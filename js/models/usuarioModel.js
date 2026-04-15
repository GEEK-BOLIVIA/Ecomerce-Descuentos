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
                    correo_electronico: datos.correo_electronico,
                    rol: datos.rol,
                    creado_en: new Date().toISOString() // Útil para que Make ordene o filtre
                }])
                .select(); // IMPORTANTE: .select() para confirmar la inserción

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

};