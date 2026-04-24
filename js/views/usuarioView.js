import { PaginationHelper } from '../utils/paginationHelper.js';
import { detalleUsuarioModal } from './components/detalleUsuarioModal.js';
import { eliminarUsuarioModal } from './components/eliminarUsuarioModal.js';
import { completarPerfilModal } from './components/completarPerfilModal.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const usuarioView = {
    // Estado local para manejar UI de cada rol de forma independiente
    _estado: {
        busqueda: '',
        orden: 'asc',
        paginaActual: 1,
        filasPorPagina: 10,
        rolActual: ''
    },

    // ─────────────────────────────────────────────
    // SELECCIÓN POR LOTE
    // ─────────────────────────────────────────────

    toggleLote(id) {
        selectorUtil.toggle(id, (cant) => this._actualizarBarraFlotante(cant));
        const fila = document.querySelector(`input.fila-checkbox-usr[data-id="${id}"]`)?.closest('tr');
        if (fila) fila.classList.toggle('bg-blue-50/70', selectorUtil.estado.seleccionados.includes(String(id)));
    },

    toggleLoteTodos(datos) {
        selectorUtil.toggleTodos(datos, (cant) => this._actualizarBarraFlotante(cant));
        const isAllChecked = selectorUtil.estado.seleccionados.length >= datos.length;
        document.querySelectorAll('input.fila-checkbox-usr').forEach(chk => {
            chk.checked = isAllChecked;
            chk.closest('tr')?.classList.toggle('bg-blue-50/70', isAllChecked);
        });
        const master = document.getElementById('check-all-usr');
        if (master) master.checked = isAllChecked;
    },

    limpiarSeleccion() {
        selectorUtil.limpiar((cant) => this._actualizarBarraFlotante(cant));
        usuarioController.refrescarVista();
    },

    _renderBarraFlotante() {
        return `
        <div id="bulk-actions-bar-usr"
             class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]
                    translate-y-28 opacity-0 pointer-events-none
                    transition-all duration-500">
            <div class="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-2">
                <div class="flex items-center gap-3 px-4 py-2 border-r border-slate-100 mr-1">
                    <div class="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-red-200 shadow-lg">
                        <span class="material-symbols-outlined text-white text-xl">group</span>
                    </div>
                    <div class="flex flex-col">
                        <span id="lote-usr-contador" class="text-[13px] font-bold text-slate-800 leading-none">0 seleccionados</span>
                        <span class="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Acciones masivas</span>
                    </div>
                </div>
                <button onclick="usuarioView.confirmarEliminacionMasiva()"
                        class="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 group">
                    <span class="material-symbols-outlined text-lg">delete_sweep</span>
                    <span class="text-[11px] font-black uppercase tracking-tight">Eliminar</span>
                </button>
                <button onclick="usuarioView.limpiarSeleccion()"
                        class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all ml-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>`;
    },

    _actualizarBarraFlotante(cantidad) {
        const barra = document.getElementById('bulk-actions-bar-usr');
        const contador = document.getElementById('lote-usr-contador');
        if (!barra) return;
        if (cantidad > 0) {
            barra.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
            barra.classList.add('translate-y-0', 'opacity-100');
            if (contador) contador.textContent = `${cantidad} seleccionados`;
        } else {
            barra.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
            barra.classList.remove('translate-y-0', 'opacity-100');
        }
    },

    confirmarEliminacionMasiva() {
        const ids = selectorUtil.estado.seleccionados;
        if (ids.length === 0) return;
        Swal.fire({
            title: `<span class="text-red-600 font-black uppercase text-xs">¿ELIMINAR ${ids.length} USUARIOS?</span>`,
            html: `<p class="text-sm text-slate-600">Los usuarios seleccionados serán desactivados del sistema. No se puede deshacer.</p>`,
            icon: 'warning',
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: 'SÍ, ELIMINAR TODO',
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[32px] shadow-2xl',
                confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase',
                cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase'
            }
        }).then(r => {
            if (r.isConfirmed) usuarioController.eliminarMasivo(ids);
        });
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
    render(datos, infoConfig, columnasVisibles = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        const cols = columnasVisibles.length > 0 ? columnasVisibles :
            ['nro', 'perfil', 'nombre', 'ci', 'telefono', 'acciones'];

        this._estado.rolActual = infoConfig.rol;

        let datosFiltrados = this._ordenarDatos(this._filtrarDatos(datos));
        const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
        const datosPaginados = datosFiltrados.slice(inicio, inicio + this._estado.filasPorPagina);

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

            <div class="flex items-center gap-2">
                <button onclick="usuarioView.gestionarOrden()" 
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-${infoConfig.color}-600 transition-all shadow-sm font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">${this._estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                    ${this._estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                </button>

                <button onclick="configuracionColumnasController.iniciarFlujoConfiguracion('usuarios_${infoConfig.rol.toLowerCase()}', async () => { await usuarioController.inicializarSeccion('${infoConfig.rol}'); })"
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">view_column</span>
                    Columnas
                </button>
            </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
            <div class="overflow-x-auto"> 
                <table class="w-full text-left border-collapse table-auto"> 
                    <thead>
                        <tr class="bg-slate-50/80 border-b border-slate-200">
                            <th class="px-4 py-5 w-12 text-center">
                                <input type="checkbox" id="check-all-usr"
                                       class="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                       onchange="usuarioView.toggleLoteTodos(window._usuariosPaginados)">
                            </th>
                            ${cols.includes('nro') ? `<th class="px-4 py-5 text-[11px] font-bold text-slate-400 uppercase w-12 text-center">N°</th>` : ''}
                            ${cols.includes('perfil') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase w-20 text-center">Perfil</th>` : ''}
                            ${cols.includes('nombre') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Nombre Completo</th>` : ''}
                            ${cols.includes('ci') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">C.I.</th>` : ''}
                            ${cols.includes('telefono') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Teléfono</th>` : ''}
                            ${cols.includes('acciones') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center w-48">Acciones</th>` : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${datosPaginados.length > 0
                ? datosPaginados.map((u, index) => this._crearFila(u, infoConfig.color, inicio + index + 1, cols)).join('')
                : `<tr><td colspan="10" class="px-6 py-12 text-center text-slate-400 italic text-sm">No se encontraron usuarios activos</td></tr>`
            }
                    </tbody>
                </table>
            </div>
            ${PaginationHelper.render(datosFiltrados.length, this._estado.filasPorPagina, this._estado.paginaActual, 'usuarioView')}
        </div>
    </div>
    `;

        window._usuariosPaginados = datosPaginados;

        contenedor.innerHTML = html + this._renderBarraFlotante();

        setTimeout(() => {
            selectorUtil.sincronizarChecks();
            this._actualizarBarraFlotante(selectorUtil.estado.seleccionados.length);
        }, 0);

        this._enfocarBusqueda();
    },

    _crearFila(u, color, numero, cols = []) {
        const nombreCompleto = `${u.nombres} ${u.apellido_paterno} ${u.apellido_materno || ''}`.trim();
        const isChecked = selectorUtil.estado.seleccionados.includes(String(u.id)) ? 'checked' : '';
        return `
        <tr class="hover:bg-slate-50/50 transition-colors group ${isChecked ? 'bg-blue-50/70' : ''}">
            <td class="px-4 py-4 text-center">
                <input type="checkbox" ${isChecked}
                       class="fila-checkbox-usr w-4 h-4 rounded accent-blue-600 cursor-pointer"
                       data-id="${u.id}"
                       onchange="usuarioView.toggleLote('${u.id}')">
            </td>
            ${cols.includes('nro') ? `
            <td class="px-4 py-4 text-center">
                <span class="text-slate-400 font-bold text-xs">${numero}</span>
            </td>` : ''}
            ${cols.includes('perfil') ? `
            <td class="px-6 py-4">
                <div class="flex justify-center">
                    <div class="w-10 h-10 rounded-2xl bg-${color}-100 text-${color}-600 flex items-center justify-center font-black text-sm shadow-sm border border-${color}-200/50">
                        ${u.nombres.charAt(0)}${u.apellido_paterno.charAt(0)}
                    </div>
                </div>
            </td>` : ''}
            ${cols.includes('nombre') ? `
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span class="text-slate-800 font-bold uppercase text-[13px] tracking-wide">${nombreCompleto}</span>
                    <span class="text-slate-400 text-xs font-medium">${u.correo_electronico}</span>
                </div>
            </td>` : ''}
            ${cols.includes('ci') ? `
            <td class="px-6 py-4 text-center">
                <span class="text-slate-600 font-bold text-xs">${u.ci || '---'}</span>
            </td>` : ''}
            ${cols.includes('telefono') ? `
            <td class="px-6 py-4 text-center">
                <span class="text-slate-600 font-bold text-xs">${u.celular || '---'}</span>
            </td>` : ''}
            ${cols.includes('acciones') ? `
            <td class="px-6 py-4">
                <div class="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button onclick="usuarioController.editar('${u.id}')" title="Editar" class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-[18px]">edit</span></button>
                    <button onclick="usuarioView.verDetalle('${u.id}')" title="Ver Detalle" class="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-[18px]">visibility</span></button>
                    <button onclick="usuarioView.confirmarEliminacion('${u.id}', '${u.nombres}')" title="Eliminar" class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"><span class="material-symbols-outlined text-[18px]">delete</span></button>
                </div>
            </td>` : ''}
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
 * FORMULARIO DINÁMICO MEJORADO (CON SCROLL, BOTÓN X Y ALTO CONTRASTE)
 */
    async mostrarFormularioUsuario({ titulo, datos, color = 'blue', esEdicion }) {
        const { value: formValues } = await Swal.fire({
            title: `<span class="text-slate-900 font-black uppercase text-[16px] tracking-tight">${titulo}</span>`,
            showCloseButton: true, // Agrega la X de cierre
            closeButtonHtml: '&times;',
            html: `
        <div class="text-left px-2 py-1 max-h-[65vh] overflow-y-auto pr-4 custom-scrollbar" id="swal-scroll-container">
            
            ${!esEdicion ? `
            <div class="flex bg-slate-100 p-1 rounded-2xl mb-6 max-w-sm mx-auto border border-slate-200">
                <button id="btn-modo-invitacion" type="button" onclick="usuarioView._cambiarModoRegistro('invitacion')" 
                    class="flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all bg-white shadow-sm text-slate-900">Invitación</button>
                <button id="btn-modo-directo" type="button" onclick="usuarioView._cambiarModoRegistro('directo')" 
                    class="flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all text-slate-500">Registro Directo</button>
            </div>
            ` : ''}

            <p id="form-descripcion" class="text-[11px] text-slate-600 leading-relaxed px-1 mb-6 text-center font-medium">
                ${esEdicion ? 'Modifica los datos del perfil. La contraseña es opcional.' : 'Solo autoriza el correo y nombres. El usuario completará su perfil después.'}
            </p>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                
                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-900 uppercase ml-2 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[15px] text-slate-500">mail</span> Correo Electrónico
                    </label>
                    <input id="swal-email" type="email" ${esEdicion ? 'disabled' : ''} 
                           class="${esEdicion ? 'bg-slate-50 text-slate-500' : 'bg-white text-slate-900'} w-full border border-blue-600/30 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all" 
                           placeholder="ejemplo@correo.com" value="${datos.correo_electronico || ''}">
                </div>

                <div class="space-y-1">
                    <label class="text-[10px] font-bold text-slate-900 uppercase ml-2 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[15px] text-slate-500">person</span> Nombres
                    </label>
                    <input id="swal-nombres" 
                           oninput="this.value = this.value.replace(/[0-9]/g, '')"
                           class="w-full bg-white text-slate-900 border border-blue-600/30 rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all" 
                           placeholder="Ej. Juan" value="${datos.nombres || ''}">
                </div>

                <div id="campos-expandidos" class="${!esEdicion ? 'hidden' : 'contents'} animate-fade-in">
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-900 uppercase ml-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[15px] text-slate-500">badge</span> Ap. Paterno
                        </label>
                        <input id="swal-paterno" 
                               oninput="this.value = this.value.replace(/[0-9]/g, '')"
                               class="w-full bg-white text-slate-900 border border-blue-600/30 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 transition-all" value="${datos.apellido_paterno || ''}">
                    </div>
                    
                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-900 uppercase ml-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[15px] text-slate-500">badge</span> Ap. Materno
                        </label>
                        <input id="swal-materno" 
                               oninput="this.value = this.value.replace(/[0-9]/g, '')"
                               class="w-full bg-white text-slate-900 border border-blue-600/30 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 transition-all" value="${datos.apellido_materno || ''}">
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-900 uppercase ml-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[15px] text-slate-500">fingerprint</span> C.I. (Máx 7)
                        </label>
                        <input id="swal-ci" type="text" maxlength="7"
                               oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                               class="w-full bg-white text-slate-900 border border-blue-600/30 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 transition-all" 
                               placeholder="1234567" value="${datos.ci || ''}">
                    </div>

                    <div class="space-y-1">
                        <label class="text-[10px] font-bold text-slate-900 uppercase ml-2 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[15px] text-slate-500">smartphone</span> Celular (8 dígitos)
                        </label>
                        <input id="swal-celular" type="text" maxlength="8"
                               oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                               class="w-full bg-white text-slate-900 border border-blue-600/30 rounded-xl py-3 px-4 text-sm outline-none focus:border-blue-600 transition-all" 
                               placeholder="70000000" value="${datos.celular || ''}">
                    </div>
                </div>

                <div id="contenedor-password" class="${!esEdicion ? 'hidden' : 'space-y-1'} md:col-span-2">
                    <label class="text-[10px] font-bold text-slate-900 uppercase ml-2 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[15px] text-slate-500">lock</span> Contraseña
                    </label>
                    <div class="relative">
                        <input id="swal-password" type="password" 
                               class="w-full bg-white text-slate-900 border border-blue-600/30 rounded-xl py-3 px-4 text-sm focus:border-blue-600 outline-none transition-all" 
                               placeholder="${esEdicion ? '•••••••• (Vacío para mantener)' : 'Mínimo 6 caracteres'}">
                        <span class="material-symbols-outlined absolute right-4 top-3 text-slate-400 cursor-pointer hover:text-blue-700" 
                              onclick="const p = document.getElementById('swal-password'); p.type = p.type === 'password' ? 'text' : 'password'; this.textContent = p.type === 'password' ? 'visibility' : 'visibility_off'">
                            visibility
                        </span>
                    </div>
                </div>
            </div>
        </div>
        
        <style>
            /* Scrollbar personalizada para que sea sutil */
            .custom-scrollbar::-webkit-scrollbar { width: 6px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
        </style>
        `,
            showCancelButton: true,
            confirmButtonText: esEdicion ? 'Actualizar Usuario' : 'Registrar Ahora',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#1d4ed8',
            customClass: {
                popup: 'rounded-[24px] border border-slate-200 shadow-2xl w-[95%] max-w-2xl',
                confirmButton: 'rounded-xl px-10 py-3 font-bold text-sm uppercase transition-all hover:bg-blue-800',
                cancelButton: 'rounded-xl px-10 py-3 font-bold text-sm bg-slate-200 text-slate-700',
                closeButton: 'text-slate-400 hover:text-red-500 transition-colors focus:outline-none'
            },
            preConfirm: () => {
                // ... (Lógica de validación exacta a la anterior)
                const email = document.getElementById('swal-email').value.trim();
                const nombres = document.getElementById('swal-nombres').value.trim();
                const modoDirecto = !document.getElementById('campos-expandidos').classList.contains('hidden');

                if (!email || !nombres) {
                    Swal.showValidationMessage('Complete los campos obligatorios');
                    return false;
                }

                const payload = {
                    correo_electronico: email,
                    nombres: nombres,
                    apellido_paterno: document.getElementById('swal-paterno')?.value.trim() || '',
                    apellido_materno: document.getElementById('swal-materno')?.value.trim() || '',
                    ci: document.getElementById('swal-ci')?.value.trim() || '',
                    celular: document.getElementById('swal-celular')?.value.trim() || '',
                    password: document.getElementById('swal-password')?.value || ''
                };

                if (!esEdicion && modoDirecto) {
                    if (payload.celular.length < 8) {
                        Swal.showValidationMessage('El celular debe tener 8 dígitos');
                        return false;
                    }
                    if (payload.password.length < 6) {
                        Swal.showValidationMessage('La contraseña debe tener al menos 6 caracteres');
                        return false;
                    }
                }
                return payload;
            }
        });

        return formValues;
    },

    _cambiarModoRegistro(modo) {
        const desc = document.getElementById('form-descripcion');
        const campos = document.getElementById('campos-expandidos');
        const pass = document.getElementById('contenedor-password');
        const btnInv = document.getElementById('btn-modo-invitacion');
        const btnDir = document.getElementById('btn-modo-directo');

        if (modo === 'directo') {
            desc.textContent = "Modo Registro Directo: Se requiere información completa del perfil.";
            campos.classList.remove('hidden');
            campos.classList.add('contents');
            pass.classList.remove('hidden');
            btnDir.className = "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all bg-white shadow-sm text-slate-900";
            btnInv.className = "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all text-slate-400";
        } else {
            desc.textContent = "Modo Invitación: Solo nombre y correo. El usuario completará su perfil después.";
            campos.classList.add('hidden');
            campos.classList.remove('contents');
            pass.classList.add('hidden');
            btnInv.className = "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all bg-white shadow-sm text-slate-900";
            btnDir.className = "flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all text-slate-400";
        }
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