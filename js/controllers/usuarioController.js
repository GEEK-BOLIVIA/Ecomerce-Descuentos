import { usuarioModel } from '../models/usuarioModel.js';
import { usuarioView } from '../views/usuarioView.js';
import { detalleUsuarioModal } from '../views/components/detalleUsuarioModal.js';
import { editarUsuarioModal } from '../views/components/editarUsuarioModal.js';
import { eliminarUsuarioModal } from '../views/components/eliminarUsuarioModal.js';

export const usuarioController = {

    _estado: {
        rolActual: '',
        configActual: null
    },

    // Configuración estética por rol
    _configuraciones: {
        'owner': { rol: 'owner', titulo: 'Owners', color: 'blue' },
        'admin': { rol: 'admin', titulo: 'Administradores', color: 'indigo' },
        'cliente': { rol: 'cliente', titulo: 'Clientes', color: 'emerald' }
    },
    _distribuirNombre(fullName) {
        const partes = fullName.trim().split(/\s+/);
        if (partes.length >= 4) return { nombres: `${partes[0]} ${partes[1]}`, paterno: partes[2], materno: partes[3] };
        if (partes.length === 3) return { nombres: partes[0], paterno: partes[1], materno: partes[2] };
        if (partes.length === 2) return { nombres: partes[0], paterno: partes[1], materno: '' };
        return { nombres: partes[0] || '', paterno: '', materno: '' };
    },

    async gestionarRedireccionInicial() {
        // === CONTROL DE INTERFAZ PARA EVITAR "PARPADEO" ===
        const overlay = document.getElementById('loading-overlay');
        const formularioLogin = document.getElementById('login-form');

        // Si detectamos el token de Supabase en la URL, ocultamos el login y mostramos carga
        if (window.location.hash.includes('access_token')) {
            overlay?.classList.remove('hidden');
            formularioLogin?.classList.add('hidden');
        }

        const sesion = await usuarioModel.obtenerSesionActual();

        // 1. Si NO hay sesión activa
        if (!sesion) {
            // Nos aseguramos de ocultar el overlay para que el usuario pueda intentar loguearse
            overlay?.classList.add('hidden');
            formularioLogin?.classList.remove('hidden');

            const pathActual = window.location.pathname;
            const esPaginaPrivada = !pathActual.includes('index.html') && pathActual !== '/' && !pathActual.endsWith('/comercio/');

            if (esPaginaPrivada) {
                window.location.href = './index.html';
            }
            return;
        }

        const { auth, perfil, tipo } = sesion;

        // 2. Caso: Acceso denegado (No está en la whitelist o no tiene perfil)
        if (tipo === 'denegado' || !perfil) {
            const respuestaLogout = await usuarioModel.logout();
            usuarioView.notificarError("Acceso denegado: Tu correo no ha sido autorizado.");

            // Ocultamos overlay para que vea el mensaje de error de la notificación
            overlay?.classList.add('hidden');

            setTimeout(() => {
                window.location.href = respuestaLogout.urlRedireccion;
            }, 3000);
            return;
        }

        // 3. Caso: Usuario Nuevo (Invitado) o Perfil Incompleto
        // Se añade validación para asegurar que el modal se vea y no se congele la pantalla
        if (perfil.temporal || !perfil.ci || !perfil.celular) {
            // NUEVO: Cerramos cualquier modal previo de carga de SweetAlert
            if (typeof Swal !== 'undefined') Swal.close();

            // Antes de mostrar el modal, ocultamos el overlay de carga para evitar bloqueo visual
            overlay?.classList.add('hidden');
            formularioLogin?.classList.add('hidden'); // Aseguramos que el login no se vea de fondo

            const nombresAuto = this._distribuirNombre(
                auth.user_metadata?.full_name || auth.user_metadata?.name || ''
            );

            const datosSugeridos = {
                nombres: perfil.nombres || nombresAuto.nombres || '',
                apellido_paterno: perfil.apellido_paterno || nombresAuto.paterno || '',
                apellido_materno: perfil.apellido_materno || nombresAuto.materno || '',
            };

            const completado = await usuarioView.mostrarModalCompletarPerfil(auth.id, datosSugeridos);

            if (completado) {
                // Si el usuario completa los datos, volvemos a mostrar carga mientras procesamos
                usuarioView.mostrarCargando("Guardando perfil...");

                let res;
                if (perfil.temporal) {
                    const nuevoRegistro = {
                        id: auth.id,
                        correo_electronico: auth.email,
                        rol: perfil.rol,
                        visible: true,
                        ...completado
                    };
                    res = await usuarioModel.crear(nuevoRegistro);
                    if (res.exito) await usuarioModel.eliminarInvitacionPorCorreo(auth.email);
                } else {
                    res = await usuarioModel.actualizar(auth.id, completado);
                }

                if (res && res.exito) {
                    usuarioView.notificarExito("¡Bienvenido! Perfil configurado correctamente.");
                    sessionStorage.setItem('usuario_rol', perfil.rol);
                    sessionStorage.setItem('usuario_nombre', completado.nombres);
                    sessionStorage.setItem('usuario_id', auth.id);

                    setTimeout(() => window.location.href = './administracion.html', 1500);
                } else {
                    usuarioView.notificarError("No se pudo guardar: " + (res?.mensaje || "Error desconocido"));
                    // Si falla el guardado, relanzamos la lógica para que no se quede la pantalla vacía
                    setTimeout(() => this.gestionarRedireccionInicial(), 2000);
                }
            } else {
                // Si el usuario cancela o cierra el modal sin completar, forzamos logout para evitar el "limbo"
                const respuestaLogout = await usuarioModel.logout();
                window.location.href = respuestaLogout.urlRedireccion;
            }
            return;
        }

        // 4. Caso: Usuario recurrente (Perfil completo)
        sessionStorage.setItem('usuario_rol', perfil.rol);
        sessionStorage.setItem('usuario_nombre', perfil.nombres);
        sessionStorage.setItem('usuario_id', auth.id);

        const path = window.location.pathname;
        const enIndex = path.endsWith('/') || path.includes('index.html');

        if (enIndex) {
            console.log("Sesión válida encontrada. Entrando al panel...");
            // Mantenemos el overlay visible hasta que la página cambie de verdad para un efecto suave
            overlay?.classList.remove('hidden');
            window.location.href = './administracion.html';
        } else {
            // Si ya está en una página interna, simplemente ocultamos el overlay
            overlay?.classList.add('hidden');
        }
    },
    async manejarLogin(email, pass) {
        usuarioView.mostrarCargando('Iniciando sesión...');
        const respuesta = await usuarioModel.login(email, pass);
        if (respuesta.exito) {
            await this.gestionarRedireccionInicial();
        } else {
            usuarioView.notificarError(respuesta.mensaje);
        }
    },
    // Reemplaza tu sección de Autenticación por esta:
    async manejarLoginSocial(proveedor) {
        usuarioView.mostrarCargando(`Conectando con ${proveedor}...`);
        const respuesta = await usuarioModel.loginConRedSocial(proveedor);
        if (!respuesta.exito) usuarioView.notificarError(respuesta.mensaje);
    },

    // ==========================================
    // SECCIÓN: MOTOR CRUD GLOBAL
    // ==========================================

    /**
     * Inicializa la sección según el rol (Se llama desde navigation.js)
     */
    async inicializarSeccion(rol) {
        try {
            if (document.activeElement) document.activeElement.blur();

            const config = this._configuraciones[rol.toLowerCase()];
            if (!config) throw new Error(`Rol ${rol} no configurado`);

            this._estado.rolActual = rol;
            this._estado.configActual = config;

            usuarioView.mostrarCargando(`Obteniendo listado de ${config.titulo}...`);

            const datos = await usuarioModel.obtenerPorRol(rol);

            // Renderizamos usando la vista global
            usuarioView.render(datos, config);

            Swal.close();
        } catch (error) {
            console.error(`Error al inicializar:`, error);
            usuarioView.notificarError("No se pudieron cargar los datos.");
        }
    },

    /**
     * Refresca la vista actual (útil para búsqueda, paginación o tras cambios)
     */
    async refrescarVista() {
        const datos = await usuarioModel.obtenerPorRol(this._estado.rolActual);
        usuarioView.render(datos, this._estado.configActual);
    },

    /**
     * Lógica para eliminar (Desactivación lógica)
     */
    async previsualizarEliminacion(id) {
        try {
            usuarioView.mostrarCargando('Cargando datos del usuario...');
            const usuario = await usuarioModel.obtenerPorId(id);
            Swal.close();
            if (usuario) eliminarUsuarioModal.mostrar(usuario);
        } catch (error) {
            usuarioView.notificarError('Error al cargar el usuario.');
        }
    },

    async confirmarEliminacion(id) {
        eliminarUsuarioModal.cerrar();
        usuarioView.mostrarCargando('Eliminando usuario...');
        try {
            const res = await usuarioModel.actualizar(id, { visible: false });
            Swal.close();
            if (res.exito) {
                usuarioView.notificarExito('Usuario eliminado correctamente.');
                await this.refrescarVista();
            } else {
                usuarioView.notificarError(res.mensaje);
            }
        } catch (error) {
            Swal.close();
            usuarioView.notificarError('Error inesperado al eliminar.');
        }
    },

    /**
     * Abre el modal para ver detalles (Llamado desde la vista)
     */
    async verDetalle(id) {
        try {
            const usuario = await usuarioModel.obtenerPorId(id);
            if (usuario) {
                usuarioView.mostrarDetalle(usuario);
            }
        } catch (error) {
            usuarioView.notificarError("Error al cargar detalles.");
        }
    },

    /**
     * Prepara y muestra el formulario de creación o edición
     */
    async mostrarFormulario() {
        const resultadoForm = await usuarioView.mostrarFormularioUsuario({
            titulo: `Nuevo ${this._estado.configActual.rol}`,
            datos: { nombres: '', correo_electronico: '', ci: '', celular: '' },
            color: this._estado.configActual.color,
            esEdicion: false
        });

        if (resultadoForm) {
            this.guardarUsuario(null, resultadoForm);
        }
    },
    async guardarUsuario(id, datos) {
        const mensajeCarga = id ? 'Actualizando datos...' : 'Enviando invitación...';
        usuarioView.mostrarCargando(mensajeCarga);

        try {
            let resultado;

            if (id) {
                resultado = await usuarioModel.actualizar(id, datos);
            } else {
                // CASO B: Invitación
                const rolesRestringidos = ['owner', 'admin'];
                const rolAInvitar = this._estado.rolActual.toLowerCase();

                if (!rolesRestringidos.includes(rolAInvitar)) {
                    usuarioView.notificarError(`El rol "${rolAInvitar}" no requiere invitación manual.`);
                    return;
                }

                const emailLimpio = datos.correo_electronico.toLowerCase().trim();

                // VALIDACIÓN: ¿Ya existe en la tabla de usuarios activos?
                const usuariosExistentes = await usuarioModel.obtenerTodos();
                const yaExiste = usuariosExistentes.some(u => u.correo_electronico === emailLimpio);

                if (yaExiste) {
                    usuarioView.notificarError("Este correo ya pertenece a un usuario activo.");
                    return;
                }

                // MODIFICACIÓN AQUÍ:
                const datosInvitacion = {
                    nombres: datos.nombres, // <--- CAPTURAMOS EL NOMBRE DE LA VISTA
                    correo_electronico: emailLimpio,
                    rol: this._estado.rolActual
                };

                resultado = await usuarioModel.autorizarEnWhitelist(datosInvitacion);
            }

            if (resultado.exito) {
                usuarioView.notificarExito(id ? 'Perfil actualizado.' : `Invitación enviada a ${datos.correo_electronico}.`);
                await this.refrescarVista();
            } else {
                usuarioView.notificarError(resultado.mensaje);
            }

        } catch (error) {
            console.error("Error en guardarUsuario:", error);
            usuarioView.notificarError("Ocurrió un error inesperado.");
        }
    },
    async editar(id) {
        try {
            // SweetAlert de carga mientras busca el usuario
            usuarioView.mostrarCargando('Cargando datos del usuario...');
            const usuario = await usuarioModel.obtenerPorId(id);
            Swal.close();

            if (usuario) editarUsuarioModal.mostrar(usuario);
        } catch (error) {
            usuarioView.notificarError("Error al cargar el usuario.");
        }
    },

    async guardarEdicion(id) {
        const payload = editarUsuarioModal.obtenerPayload();
        if (!payload) return;

        // Confirmación antes de guardar
        const { isConfirmed } = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">¿Guardar cambios?</span>',
            text: 'Se actualizarán los datos del perfil.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'SÍ, GUARDAR',
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: '#000000',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-3 font-bold text-sm',
                cancelButton: 'rounded-xl px-6 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });

        if (!isConfirmed) return;

        editarUsuarioModal.setGuardando(true);
        try {
            usuarioView.mostrarCargando('Actualizando datos...');
            const res = await usuarioModel.actualizar(id, payload);
            Swal.close();

            if (res.exito) {
                editarUsuarioModal.cerrar();
                usuarioView.notificarExito('Usuario actualizado correctamente.');
                await this.refrescarVista();
            } else {
                editarUsuarioModal.setGuardando(false);
                usuarioView.notificarError(res.mensaje);
            }
        } catch (error) {
            Swal.close();
            editarUsuarioModal.setGuardando(false);
            usuarioView.notificarError("Error inesperado al guardar.");
        }
    },

    cerrarModalEdicion() {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">¿Descartar cambios?</span>',
            text: 'Los cambios no guardados se perderán.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, CERRAR',
            cancelButtonText: 'SEGUIR EDITANDO',
            confirmButtonColor: '#000000',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-3 font-bold text-sm',
                cancelButton: 'rounded-xl px-6 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        }).then(({ isConfirmed }) => {
            if (isConfirmed) editarUsuarioModal.cerrar();
        });
    },
    async abrirFormularioInvitacion(rol) {
        const config = this._configuraciones[rol.toLowerCase()];
        if (!config) return;

        // Establece el estado aunque no se haya navegado a la sección
        this._estado.rolActual = rol;
        this._estado.configActual = config;

        await this.mostrarFormulario();
    },
    async verDetalle(id) {
        try {
            usuarioView.mostrarCargando('Cargando datos del usuario...');
            const usuario = await usuarioModel.obtenerPorId(id);
            Swal.close();
            if (usuario) detalleUsuarioModal.mostrar(usuario);
        } catch (error) {
            usuarioView.notificarError('Error al cargar el usuario.');
        }
    },

    async editarDesdeDetalle(id) {
        detalleUsuarioModal.cerrar();
        usuarioView.mostrarCargando('Preparando formulario...');

        try {
            const usuario = await usuarioModel.obtenerPorId(id);
            Swal.close();

            const { isConfirmed } = await Swal.fire({
                title: '<span class="text-slate-800 font-black uppercase text-sm">Editar perfil</span>',
                text: `Vas a modificar los datos de ${usuario.nombres} ${usuario.apellido_paterno}.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#000000',
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl',
                    confirmButton: 'rounded-xl px-6 py-3 font-bold text-sm',
                    cancelButton: 'rounded-xl px-6 py-3 font-bold text-sm bg-slate-100 text-slate-500'
                }
            });

            if (isConfirmed) editarUsuarioModal.mostrar(usuario);

        } catch (error) {
            usuarioView.notificarError('Error al cargar el usuario.');
        }
    },
    /**
 * Maneja el clic en los botones de Login Social (Google/Facebook)
 */
    async manejarLoginSocial(proveedor) {
        try {
            usuarioView.mostrarCargando(`Conectando con ${proveedor}...`);

            // Verificamos si ya hay una sesión antes de intentar el login
            const sesionExistente = await usuarioModel.obtenerSesionActual();
            if (sesionExistente && sesionExistente.auth) {
                // Si ya existe sesión, saltamos directo a la redirección
                await this.gestionarRedireccionInicial();
                return;
            }

            const resultado = await usuarioModel.loginConRedSocial(proveedor);
            // ... resto del código
        } catch (error) {
            console.error(error);
            Swal.close(); // Cerramos cualquier cargando
        }
    }
};

// Exposición global
window.usuarioController = usuarioController;