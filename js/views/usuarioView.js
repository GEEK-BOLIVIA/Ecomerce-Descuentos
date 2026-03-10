import { PaginationHelper } from '../utils/paginationHelper.js';
import { detalleUsuarioModal } from './components/detalleUsuarioModal.js';
import { eliminarUsuarioModal } from './components/eliminarUsuarioModal.js';
import { completarPerfilModal } from './components/completarPerfilModal.js';

export const usuarioView = {
    // Estado local para manejar UI de cada rol de forma independiente
    _estado: {
        busqueda: '',
        orden: 'asc',
        paginaActual: 1,
        filasPorPagina: 10,
        rolActual: ''
    },

    /**
     * MÉTODOS DE NOTIFICACIÓN ESTILO PREMIUM
     */
    notificarExito(mensaje) {
        Swal.fire({
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">¡Operación Exitosa!</span>',
            text: mensaje,
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    async mostrarModalCompletarPerfil(userId, datosSugeridos) {
        return await completarPerfilModal.mostrar(datosSugeridos);
    },
    
    notificarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error en la Operación</span>',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-6 py-2 font-bold text-xs uppercase'
            }
        });
    },

    mostrarCargando(mensaje = 'Procesando solicitud...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Cargando</span>',
            text: mensaje,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    /**
     * RENDER PRINCIPAL DE LA SECCIÓN DE USUARIOS
     */
    render(datos, infoConfig) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        this._estado.rolActual = infoConfig.rol;

        // Filtramos y ordenamos antes de paginar
        let datosFiltrados = this._ordenarDatos(this._filtrarDatos(datos));

        const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
        const fin = inicio + this._estado.filasPorPagina;
        const datosPaginados = datosFiltrados.slice(inicio, fin);

        // Lógica para determinar si ocultamos acciones de creación
        const esCliente = infoConfig.rol.toLowerCase() === 'cliente';

        const html = `
        <div class="p-8 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de ${infoConfig.titulo}</h1>
                    <p class="text-slate-500 text-sm">Administración y control de perfiles tipo ${infoConfig.rol}.</p>
                </div>
                
                <div class="flex flex-wrap gap-3">
                    ${!esCliente ? `
                        <button onclick="usuarioView.mostrarInvitacionesPendientes()" 
                                class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 px-5 py-3 rounded-2xl transition-all shadow-sm font-bold text-sm flex items-center gap-2">
                            <span class="material-symbols-outlined text-[20px]">mail</span> Pendientes
                        </button>

                        <button onclick="usuarioController.mostrarFormulario()" 
                                class="bg-${infoConfig.color}-600 hover:bg-${infoConfig.color}-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-${infoConfig.color}-200 font-bold text-sm flex items-center gap-2 w-fit">
                            <span class="material-symbols-outlined text-[20px]">person_add</span> Nuevo ${infoConfig.rol}
                        </button>
                    ` : `
                        <div class="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200">
                            Usuarios Registrados: ${datosFiltrados.length}
                        </div>
                    `}
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div class="relative flex-1 md:w-96">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                    <input type="text" 
                           id="input-busqueda-usuarios"
                           placeholder="Buscar por nombre, C.I. o correo..." 
                           value="${this._estado.busqueda}"
                           oninput="usuarioView.gestionarBusqueda(this.value)"
                           class="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-${infoConfig.color}-500/10 focus:border-${infoConfig.color}-500 transition-all font-medium">
                </div>
                
                <button onclick="usuarioView.gestionarOrden()" 
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-${infoConfig.color}-600 transition-all shadow-sm font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">${this._estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                    ${this._estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
            </div>

            <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
                <div class="overflow-x-auto"> 
                    <table class="w-full text-left border-collapse table-auto"> 
                        <thead>
                            <tr class="bg-slate-50/80 border-b border-slate-200">
                                <th class="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase w-12 text-center">#</th>
                                <th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase w-20 text-center">Perfil</th>
                                <th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Nombre Completo</th>
                                <th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">C.I.</th>
                                <th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Teléfono</th>
                                <th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center w-48">Acciones</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${datosPaginados.length > 0
                ? datosPaginados.map((u, index) => this._crearFila(u, infoConfig.color, inicio + index + 1)).join('')
                : `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 italic text-sm">No se encontraron usuarios activos</td></tr>`
            }
                        </tbody>
                    </table>
                </div>

                ${PaginationHelper.render(datosFiltrados.length, this._estado.filasPorPagina, this._estado.paginaActual, 'usuarioView')}
            </div>
        </div>
    `;

        contenedor.innerHTML = html;
        this._enfocarBusqueda();
    },
    /**
     * ESTRUCTURA DE FILA INDIVIDUAL
     */
    _crearFila(u, color, numero) {
        const nombreCompleto = `${u.nombres} ${u.apellido_paterno} ${u.apellido_materno || ''}`.trim();

        return `
            <tr class="hover:bg-slate-50/50 transition-colors group">
                <td class="px-4 py-4 text-center">
                    <span class="text-slate-400 font-bold text-xs">${numero}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex justify-center">
                        <div class="w-10 h-10 rounded-2xl bg-${color}-100 text-${color}-600 flex items-center justify-center font-black text-sm shadow-sm border border-${color}-200/50">
                            ${u.nombres.charAt(0)}${u.apellido_paterno.charAt(0)}
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex flex-col">
                        <span class="text-slate-800 font-bold uppercase text-[13px] tracking-wide">${nombreCompleto}</span>
                        <span class="text-slate-400 text-xs font-medium">${u.correo_electronico}</span>
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="text-slate-600 font-bold text-xs">${u.ci || '---'}</span>
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="text-slate-600 font-bold text-xs">${u.celular || '---'}</span>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button onclick="usuarioController.editar('${u.id}')" title="Editar" class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                        <button onclick="usuarioView.verDetalle('${u.id}')" title="Ver Detalle" class="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-[18px]">visibility</span></button>
                        <button onclick="usuarioView.confirmarEliminacion('${u.id}', '${u.nombres}')" title="Eliminar" class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                    </div>
                </td>
            </tr>`;
    },

    /**
     * LÓGICA DE FILTRADO Y ORDEN
     */
    _filtrarDatos(datos) {
        if (!this._estado.busqueda) return [...datos];
        const term = this._estado.busqueda.toLowerCase();
        return datos.filter(u =>
            u.nombres.toLowerCase().includes(term) ||
            u.apellido_paterno.toLowerCase().includes(term) ||
            (u.apellido_materno && u.apellido_materno.toLowerCase().includes(term)) ||
            u.correo_electronico.toLowerCase().includes(term) ||
            (u.ci && u.ci.toLowerCase().includes(term))
        );
    },

    _ordenarDatos(datos) {
        return [...datos].sort((a, b) => {
            const nombreA = a.nombres.toLowerCase();
            const nombreB = b.nombres.toLowerCase();
            return this._estado.orden === 'asc' ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
        });
    },

    gestionarBusqueda(valor) {
        this._estado.busqueda = valor;
        this._estado.paginaActual = 1;
        usuarioController.refrescarVista();
    },

    gestionarOrden() {
        this._estado.orden = this._estado.orden === 'asc' ? 'desc' : 'asc';
        usuarioController.refrescarVista();
    },

    cambiarPagina(nuevaPagina) {
        this._estado.paginaActual = nuevaPagina;
        usuarioController.refrescarVista();
    },

    _enfocarBusqueda() {
        const input = document.getElementById('input-busqueda-usuarios');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },

    /**
     * MODALES DE DETALLE Y ELIMINACIÓN
     */
    verDetalle(id) {
        usuarioController.verDetalle(id);
    },

    confirmarEliminacion(id, nombre) {
        usuarioController.previsualizarEliminacion(id);
    },
    /**
     * FORMULARIO DINÁMICO PARA CREACIÓN (INVITACIÓN) O EDICIÓN
     */
    async mostrarFormularioUsuario({ titulo, datos, color, esEdicion }) {
        const { value: formValues } = await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">${titulo}</span>`,
            html: `
                <div class="text-left space-y-4 p-2">
                    <p class="text-xs text-slate-500">
                        ${esEdicion
                    ? 'Modifica los datos básicos del perfil.'
                    : 'Ingresa el correo para autorizar el acceso. El usuario completará su perfil al iniciar sesión.'}
                    </p>

                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Correo Electrónico</label>
                        <input id="swal-email" type="email" 
                               ${esEdicion ? 'disabled' : ''} 
                               class="${esEdicion ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white shadow-sm border-slate-200'} w-full border rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-${color}-500/10 outline-none" 
                               placeholder="ejemplo@correo.com" value="${datos.correo_electronico || ''}">
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre o Alias (Opcional)</label>
                        <input id="swal-nombres" class="w-full bg-white shadow-sm border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-${color}-500/10 outline-none" 
                               placeholder="Ej. Juan Perez" value="${datos.nombres || ''}">
                    </div>
                    
                    ${esEdicion ? `
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">C.I.</label>
                            <input id="swal-ci" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm outline-none" value="${datos.ci || ''}">
                        </div>
                        <div class="space-y-1">
                            <label class="text-[10px] font-black text-slate-400 uppercase ml-2">Celular</label>
                            <input id="swal-celular" class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm outline-none" value="${datos.celular || ''}">
                        </div>
                    </div>
                    ` : ''}
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: esEdicion ? 'Guardar Cambios' : 'Autorizar Acceso',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#000000',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[90%] max-w-md',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all hover:scale-105',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            },
            preConfirm: () => {
                const email = document.getElementById('swal-email').value.trim();
                const nombres = document.getElementById('swal-nombres').value.trim();

                if (!email) {
                    Swal.showValidationMessage('El correo electrónico es obligatorio');
                    return false;
                }

                // Estructura mínima para el controlador
                const payload = {
                    correo_electronico: email,
                    nombres: nombres || 'Nuevo Usuario',
                    apellido_paterno: '',
                    apellido_materno: '',
                    ci: '',
                    celular: ''
                };

                // Si es edición, capturamos los campos extra si existen
                if (esEdicion) {
                    payload.ci = document.getElementById('swal-ci').value.trim();
                    payload.celular = document.getElementById('swal-celular').value.trim();
                }

                return payload;
            }
        });

        return formValues;
    },
    async mostrarInvitacionesPendientes() {
        this.mostrarCargando('Cargando invitaciones...');
        const { usuarioModel } = await import('../models/usuarioModel.js');
        const invitaciones = await usuarioModel.obtenerInvitacionesPendientes();
        Swal.close();

        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Invitaciones Pendientes</span>',
            html: `
            <div class="text-left mt-4 max-h-96 overflow-y-auto custom-scroll">
                ${invitaciones.length === 0
                    ? '<p class="text-center text-slate-400 py-8 italic">No hay invitaciones pendientes de aceptar.</p>'
                    : `
                    <div class="space-y-2">
                        ${invitaciones.map(inv => `
                            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                                <div>
                                    <p class="text-sm font-bold text-slate-700">${inv.correo_electronico}</p>
                                    <p class="text-[10px] font-black text-blue-500 uppercase">${inv.rol}</p>
                                </div>
                                <button onclick="usuarioView.cancelarInvitacion('${inv.id}')" class="text-red-400 hover:text-red-600 p-2">
                                    <span class="material-symbols-outlined text-sm">delete</span>
                                </button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `,
            showConfirmButton: false,
            showCloseButton: true,
            customClass: { popup: 'rounded-[32px] border-none shadow-2xl' }
        });
    },
    confirmarRevocarInvitacion(id, correo) {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">¿Revocar Acceso?</span>',
            text: `El correo ${correo} ya no podrá registrarse en el sistema.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'SÍ, ELIMINAR',
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[28px]',
                confirmButton: 'rounded-xl px-6 py-3 font-bold text-xs',
                cancelButton: 'rounded-xl px-6 py-3 font-bold text-xs bg-slate-100 text-slate-500'
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                const { usuarioModel } = await import('../models/usuarioModel.js');
                const res = await usuarioModel.eliminarInvitacion(id);
                if (res.exito) {
                    this.notificarExito('Invitación eliminada correctamente');
                    this.mostrarInvitacionesPendientes(); // Recarga el modal de invitaciones
                }
            }
        });
    },
    async cancelarInvitacion(id) {
        const { usuarioModel } = await import('../models/usuarioModel.js');
        const res = await usuarioModel.eliminarInvitacion(id);
        if (res.exito) {
            this.notificarExito('Invitación revocada');
            this.mostrarInvitacionesPendientes(); // Recargar el modal
        }
    },
    mostrarDetalle(u) {
        detalleUsuarioModal.mostrar(u);
    }
};

window.usuarioView = usuarioView;