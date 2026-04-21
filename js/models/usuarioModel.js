import { supabase } from '../config/supabaseClient.js';

export const usuarioModel = {
    // ==========================================
    // SECCIÓN: AUTENTICACIÓN (AUTH)
    // ==========================================

    async loginConRedSocial(proveedor) {
        try {
            // Limpieza de rastros antiguos
            if (window.location.hash) {
                window.history.replaceState(null, null, window.location.pathname);
            }
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.clear();

            // CONSTRUCCIÓN SEGURA: 
            // En Hostinger, esto devolverá exactamente https://tu-sitio.com/ruta-actual
            const urlActual = window.location.origin + window.location.pathname;

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: proveedor,
                options: {
                    redirectTo: urlActual,
                    queryParams: { prompt: 'select_account' }
                }
            });

            if (error) throw error;
            return { exito: true, data };
        } catch (err) {
            console.error("Error en OAuth:", err.message);
            return { exito: false, mensaje: err.message };
        }
    },
    // Añade esto a tu usuarioModel.js
    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (error) throw error;
            return { exito: true, data };
        } catch (error) {
            return { exito: false, mensaje: error.message };
        }
    },
    /**
     * Obtiene los datos del usuario actual si hay una sesión activa
     */
    async obtenerSesionActual() {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError || !user) return null;

            const emailLimpio = user.email.toLowerCase().trim();

            // 1. Obtener el perfil
            const { data: perfil, error: dbError } = await supabase
                .from('usuario')
                .select('*')
                .eq('correo_electronico', emailLimpio)
                .maybeSingle();

            if (dbError) {
                console.error("Error en DB:", dbError.message);
                // Si el error persiste, es probable que necesites desactivar el RLS temporalmente para probar
            }

            if (perfil) {
                // Retornamos el perfil tal cual está en la base de datos
                return { auth: user, perfil: perfil, tipo: 'existente' };
            }

            // 2. Si no hay perfil, verificar whitelist
            const { data: invitacion } = await supabase
                .from('whitelist')
                .select('*')
                .eq('correo_electronico', emailLimpio)
                .maybeSingle();

            if (invitacion) {
                return {
                    auth: user,
                    perfil: {
                        correo_electronico: emailLimpio,
                        rol: invitacion.rol,
                        temporal: true,
                        nombres: user.user_metadata?.full_name || ''
                    },
                    tipo: 'invitado'
                };
            }

            return { auth: user, perfil: null, tipo: 'denegado' };

        } catch (err) {
            console.error("Error crítico:", err);
            return null;
        }
    },
    /**
     * Cierra la sesión globalmente y limpia el storage local
     */
    async logout() {
        try {
            await supabase.auth.signOut();
            sessionStorage.clear();
            localStorage.clear();

            // En Hostinger, simplemente volvemos al origen (la raíz)
            const nuevaUrl = window.location.origin;

            return { exito: true, urlRedireccion: nuevaUrl };
        } catch (error) {
            return { exito: false, mensaje: error.message };
        }
    },
    /**
     * Registra un usuario en Auth e inserta su perfil en la tabla pública
     */
    async crear(payload) {
        try {
            const { data, error } = await supabase
                .from('usuario')
                .insert([payload])
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error al autorizar usuario:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Obtiene todos los usuarios activos
     */
    async obtenerTodos() {
        try {
            const { data, error } = await supabase
                .from('usuario')
                .select('*')
                .eq('visible', true)
                .order('apellido_paterno', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener usuarios:', error.message);
            return [];
        }
    },

    /**
     * Obtiene un usuario por su UUID (ID de Auth)
     */
    async obtenerPorId(id) {
        try {
            const { data, error } = await supabase
                .from('usuario')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error al obtener usuario con ID ${id}:`, error.message);
            return null;
        }
    },
    // Añadir esto a tu usuarioModel.js
    async obtenerPorRol(rol) {
        try {
            const { data, error } = await supabase
                .from('usuario')
                .select('*')
                .eq('visible', true)
                .eq('rol', rol) // Filtramos por el rol específico
                .order('apellido_paterno', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error al obtener ${rol}s:`, error.message);
            return [];
        }
    },
    /**
     * Actualiza datos parciales del perfil del usuario
     */
    async actualizar(id, cambios) {
        try {
            const { error } = await supabase
                .from('usuario')
                .update(cambios)
                .eq('id', id);

            if (error) throw error;
            return { exito: true };
        } catch (error) {
            return { exito: false, mensaje: error.message };
        }
    },

    /**
     * Función para configuraciones especiales (usada por Owners/Admins)
     */
    async obtenerDestinosConfiguracion() {
        try {
            const { data: usuarios, error: errUser } = await supabase
                .from('usuario')
                .select('id, nombres, apellido_paterno, apellido_materno, rol')
                .eq('visible', true);

            if (errUser) throw errUser;

            const rolesUnicos = [...new Set(usuarios.map(u => u.rol))];

            return {
                usuarios: usuarios.map(u => ({
                    id: u.id,
                    nombreCompleto: `${u.apellido_paterno} ${u.apellido_materno} ${u.nombres}`
                })),
                roles: rolesUnicos
            };
        } catch (error) {
            console.error('Error en obtenerDestinosConfiguracion:', error.message);
            return { usuarios: [], roles: [] };
        }
    },

    async eliminarUsuarioTotal(userId) {
        try {
            // Nota: Para usar admin.deleteUser necesitas una Edge Function o Service Role Key.
            // Si el RLS está bien configurado, borrar de la tabla pública es suficiente 
            // para que el Trigger de salida (opcional) o el RLS bloqueen al usuario.
            const { error } = await supabase
                .from('usuario')
                .update({ visible: false }) // Recomendamos borrado lógico por seguridad
                .eq('id', userId);

            if (error) throw error;
            return { exito: true };
        } catch (error) {
            return { exito: false, mensaje: error.message };
        }
    },
    async autorizarEnWhitelist(datos) {
        try {
            const { data, error } = await supabase
                .from('whitelist')
                .insert([{
                    nombres: datos.nombres, // <--- AÑADIR ESTA LÍNEA
                    correo_electronico: datos.correo_electronico,
                    rol: datos.rol,
                    creado_en: new Date().toISOString()
                }])
                .select();

            if (error) {
                if (error.code === '23505') throw new Error('Este correo ya está autorizado en la lista de espera.');
                throw error;
            }
            return { exito: true, data: data[0] };
        } catch (error) {
            return { exito: false, mensaje: error.message };
        }
    },
    async obtenerInvitacionesPendientes() {
        try {
            // Gracias al borrado automático, todo lo que esté en 
            // whitelist es, por definición, una invitación pendiente.
            const { data: whitelist, error: errW } = await supabase
                .from('whitelist')
                .select('*')
                .order('creado_en', { ascending: false });

            if (errW) throw errW;
            return whitelist;
        } catch (error) {
            console.error("Error al obtener invitaciones:", error);
            return [];
        }
    },
    async eliminarInvitacionPorCorreo(correo) {
        try {
            const { error } = await supabase
                .from('whitelist')
                .delete()
                .eq('correo_electronico', correo.toLowerCase().trim());

            if (error) throw error;
            return { exito: true };
        } catch (error) {
            console.error("Error al limpiar whitelist por correo:", error);
            return { exito: false, mensaje: error.message };
        }
    },

    async eliminarInvitacion(id) {
        const { error } = await supabase.from('whitelist').delete().eq('id', id);
        return { exito: !error, mensaje: error?.message };
    },

    async crearUsuarioDirecto(datos) {
        try {
            const emailLimpio = datos.correo_electronico.toLowerCase().trim();

            // 1. "Pre-autorización" en la whitelist
            // Pasamos el rol para que el trigger de la DB lo valide correctamente
            const { error: whiteError } = await supabase
                .from('whitelist')
                .upsert([{
                    correo_electronico: emailLimpio,
                    rol: datos.rol,
                    nombres: datos.nombres
                }]);

            if (whiteError) throw new Error("Error en pre-autorización: " + whiteError.message);

            // 2. Registro en Supabase Auth
            // Esto dispara tu Trigger de PostgreSQL que inserta en la tabla 'usuario'
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: emailLimpio,
                password: datos.password,
                options: {
                    data: { full_name: datos.nombres }
                }
            });

            if (authError) throw authError;

            // 3. Completar la información en la tabla 'usuario'
            // Usamos un pequeño reintento lógico o aseguramos el ID del usuario creado
            const { error: dbError } = await supabase
                .from('usuario')
                .update({
                    nombres: datos.nombres,
                    apellido_paterno: datos.apellido_paterno,
                    apellido_materno: datos.apellido_materno,
                    ci: datos.ci,
                    celular: datos.celular,
                    rol: datos.rol, // Aseguramos que el rol sea el correcto
                    visible: true
                })
                .eq('id', authData.user.id);

            if (dbError) throw dbError;

            // 4. Limpiamos la whitelist para mantener el orden
            await supabase.from('whitelist')
                .delete()
                .eq('correo_electronico', emailLimpio);

            return { exito: true };
        } catch (error) {
            console.error("Fallo en creación directa:", error);
            return { exito: false, mensaje: error.message };
        }
    },

    async actualizarConPassword(id, datosPerfil, nuevaPassword = null) {
        try {
            // 1. Actualizar datos de perfil en la tabla 'usuario'
            // (nombres, apellidos, ci, celular, etc.)
            const { error: dbError } = await supabase
                .from('usuario')
                .update(datosPerfil)
                .eq('id', id);

            if (dbError) throw dbError;

            // 2. Si hay una nueva contraseña, actualizarla en Supabase Auth
            // Nota: Esto solo funciona si el ADMIN está logueado como el usuario 
            // o si usas la API de Admin. En el flujo de cliente, actualiza al usuario actual.
            if (nuevaPassword && nuevaPassword.trim() !== "") {
                const { error: authError } = await supabase.auth.updateUser({
                    password: nuevaPassword
                });
                if (authError) throw authError;
            }

            return { exito: true };
        } catch (error) {
            console.error("Error al actualizar perfil/password:", error);
            return { exito: false, mensaje: error.message };
        }
    },
    async obtenerUsuarioActual() {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('usuario')
            .select('id, rol')
            .eq('correo_electronico', user.email.toLowerCase())
            .maybeSingle();

        if (error) {
            console.error('Error obtener usuario:', error);
            return null;
        }

        return data;
    }
};