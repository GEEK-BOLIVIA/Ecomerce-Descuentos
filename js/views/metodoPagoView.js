import { PaginationHelper } from '../utils/paginationHelper.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const metodoPagoView = {

    _estado: {
        busqueda: '',
        orden: 'asc',
        paginaActual: 1,
        filasPorPagina: 10,
    },

    // ─────────────────────────────────────────────
    // SELECCIÓN POR LOTE
    // ─────────────────────────────────────────────

    toggleLote(id) {
        selectorUtil.toggle(id, (cant) => this._actualizarBarraFlotante(cant));
        const fila = document.querySelector(`input.fila-checkbox-mp[data-id="${id}"]`)?.closest('tr');
        if (fila) fila.classList.toggle('bg-blue-50/70', selectorUtil.estado.seleccionados.includes(String(id)));
    },

    toggleLoteTodos(datos) {
        selectorUtil.toggleTodos(datos, (cant) => this._actualizarBarraFlotante(cant));
        const isAllChecked = selectorUtil.estado.seleccionados.length >= datos.length;
        document.querySelectorAll('input.fila-checkbox-mp').forEach(chk => {
            chk.checked = isAllChecked;
            chk.closest('tr')?.classList.toggle('bg-blue-50/70', isAllChecked);
        });
        const master = document.getElementById('check-all-mp');
        if (master) master.checked = isAllChecked;
    },

    limpiarSeleccion() {
        selectorUtil.limpiar((cant) => this._actualizarBarraFlotante(cant));
        window.metodoPagoController.refrescarVista();
    },

    _renderBarraFlotante() {
        return `
        <div id="bulk-actions-bar-mp"
             class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]
                    translate-y-28 opacity-0 pointer-events-none transition-all duration-500">
            <div class="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-2">
                <div class="flex items-center gap-3 px-4 py-2 border-r border-slate-100 mr-1">
                    <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-200 shadow-lg">
                        <span class="material-symbols-outlined text-white text-xl">payments</span>
                    </div>
                    <div class="flex flex-col">
                        <span id="lote-mp-contador" class="text-[13px] font-bold text-slate-800 leading-none">0 seleccionados</span>
                        <span class="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Acciones masivas</span>
                    </div>
                </div>
                <button onclick="metodoPagoView.accionLote('activar')"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all duration-300">
                    <span class="material-symbols-outlined text-lg">toggle_on</span>
                    <span class="text-[11px] font-black uppercase">Activar</span>
                </button>
                <button onclick="metodoPagoView.accionLote('desactivar')"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-800 hover:text-white transition-all duration-300">
                    <span class="material-symbols-outlined text-lg">toggle_off</span>
                    <span class="text-[11px] font-black uppercase">Desactivar</span>
                </button>
                <button onclick="metodoPagoView.limpiarSeleccion()"
                        class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all ml-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>`;
    },

    _actualizarBarraFlotante(cantidad) {
        const barra = document.getElementById('bulk-actions-bar-mp');
        const contador = document.getElementById('lote-mp-contador');
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

    accionLote(accion) {
        const ids = selectorUtil.estado.seleccionados;
        if (ids.length === 0) return;
        const nuevoEstado = accion === 'activar';
        Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-xs">¿${nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR'} ${ids.length} MÉTODOS?</span>`,
            html: `<p class="text-sm text-slate-600">Se ${nuevoEstado ? 'activarán' : 'desactivarán'} los ${ids.length} métodos de pago seleccionados.</p>`,
            icon: 'question',
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: `SÍ, ${nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR'}`,
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: nuevoEstado ? '#059669' : '#64748b',
            customClass: {
                popup: 'rounded-[32px] shadow-2xl',
                confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase',
                cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase',
            },
        }).then(r => { if (r.isConfirmed) window.metodoPagoController.toggleActivoMasivo(ids, nuevoEstado); });
    },

    // ─────────────────────────────────────────────
    // NOTIFICACIONES
    // ─────────────────────────────────────────────

    notificarExito(mensaje) {
        Swal.fire({
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">¡Operación Exitosa!</span>',
            text: mensaje,
            timer: 2500,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' },
        });
    },

    notificarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error en la Operación</span>',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-6 py-2 font-bold text-xs uppercase',
            },
        });
    },

    mostrarCargando(mensaje = 'Cargando datos...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Cargando</span>',
            text: mensaje,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' },
        });
    },

    // ─────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────

    render(datos, columnasVisibles = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        const cols = columnasVisibles.length > 0 ? columnasVisibles :
            ['nro', 'nombre', 'slug', 'requiere_referencia', 'activo', 'acciones'];

        let datosFiltrados = this._ordenarDatos(this._filtrarDatos(datos));
        const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
        const datosPaginados = datosFiltrados.slice(inicio, inicio + this._estado.filasPorPagina);
        window._metodoPagoPaginados = datosPaginados;

        const html = `
    <div class="p-8 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto pb-32">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Métodos de Pago</h1>
                <p class="text-slate-500 text-sm font-medium">Administración de métodos de pago disponibles en el sistema.</p>
            </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="relative flex-1 md:w-96">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input type="text"
                       id="input-busqueda-mp"
                       placeholder="Buscar por nombre o slug..."
                       value="${this._estado.busqueda}"
                       oninput="metodoPagoView.gestionarBusqueda(this.value)"
                       class="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium">
            </div>
            <div class="flex items-center gap-2">
                <button onclick="metodoPagoView.gestionarOrden()"
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all shadow-sm font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">${this._estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                    ${this._estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
                <button onclick="configuracionColumnasController.iniciarFlujoConfiguracion('metodos_pago', async () => { await window.metodoPagoController.inicializar(true); })"
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all shadow-sm font-bold text-sm">
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
                                <input type="checkbox" id="check-all-mp"
                                       class="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                       onchange="metodoPagoView.toggleLoteTodos(window._metodoPagoPaginados)">
                            </th>
                            ${cols.includes('nro')                 ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase w-16 text-center">N°</th>` : ''}
                            ${cols.includes('nombre')              ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Nombre</th>` : ''}
                            ${cols.includes('slug')                ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Slug</th>` : ''}
                            ${cols.includes('requiere_referencia') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Ref. Requerida</th>` : ''}
                            ${cols.includes('activo')              ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Estado</th>` : ''}
                            ${cols.includes('acciones')            ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center w-36">Acciones</th>` : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${datosPaginados.length > 0
                            ? datosPaginados.map((m, i) => this._crearFila(m, inicio + i + 1, cols)).join('')
                            : `<tr><td colspan="7" class="px-6 py-12 text-center text-slate-400 italic text-sm">No se encontraron métodos de pago</td></tr>`
                        }
                    </tbody>
                </table>
            </div>
            ${PaginationHelper.render(datosFiltrados.length, this._estado.filasPorPagina, this._estado.paginaActual, 'metodoPagoView')}
        </div>
    </div>`;

        contenedor.innerHTML = html + this._renderBarraFlotante();

        setTimeout(() => {
            selectorUtil.sincronizarChecks();
            this._actualizarBarraFlotante(selectorUtil.estado.seleccionados.length);
        }, 0);

        this._enfocarBusqueda();
    },

    // ─────────────────────────────────────────────
    // FILA
    // ─────────────────────────────────────────────

    _crearFila(m, numero, cols = []) {
        const isChecked = selectorUtil.estado.seleccionados.includes(String(m.id)) ? 'checked' : '';
        return `
    <tr class="hover:bg-slate-50/50 transition-colors group ${isChecked ? 'bg-blue-50/70' : ''}">
        <td class="px-4 py-4 text-center">
            <input type="checkbox" ${isChecked}
                   class="fila-checkbox-mp w-4 h-4 rounded accent-blue-600 cursor-pointer"
                   data-id="${m.id}"
                   onchange="metodoPagoView.toggleLote('${m.id}')">
        </td>
        ${cols.includes('nro') ? `
        <td class="px-6 py-4 text-center">
            <span class="text-slate-400 font-bold text-xs">${numero}</span>
        </td>` : ''}
        ${cols.includes('nombre') ? `
        <td class="px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm border border-blue-100/50 flex-shrink-0">
                    <span class="material-symbols-outlined" style="font-size:18px;">payments</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-slate-800 font-bold uppercase text-[13px] tracking-wide">${m.nombre}</span>
                    ${m.descripcion ? `<span class="text-slate-400 text-[11px] font-medium truncate max-w-[220px]">${m.descripcion}</span>` : ''}
                </div>
            </div>
        </td>` : ''}
        ${cols.includes('slug') ? `
        <td class="px-6 py-4 text-center">
            <span class="px-3 py-1 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black font-mono border border-slate-200">${m.slug}</span>
        </td>` : ''}
        ${cols.includes('requiere_referencia') ? `
        <td class="px-6 py-4 text-center">
            ${m.requiere_referencia
                ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase">
                       <span class="material-symbols-outlined text-[12px]">check_circle</span> Sí
                   </span>`
                : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-400 text-[10px] font-black uppercase">
                       <span class="material-symbols-outlined text-[12px]">remove_circle</span> No
                   </span>`
            }
        </td>` : ''}
        ${cols.includes('activo') ? `
        <td class="px-6 py-4 text-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase
                         ${m.activo
                             ? 'bg-emerald-50 border border-emerald-100 text-emerald-700'
                             : 'bg-slate-100 border border-slate-200 text-slate-400'}">
                <span class="material-symbols-outlined text-[14px]">${m.activo ? 'check_circle' : 'cancel'}</span>
                ${m.activo ? 'Activo' : 'Inactivo'}
            </span>
        </td>` : ''}
        ${cols.includes('acciones') ? `
        <td class="px-6 py-4 text-center">
            <div class="flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                <button onclick="window.metodoPagoController.verDetalle(${m.id})" title="Ver Detalle"
                        class="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <button onclick="window.metodoPagoController.editar(${m.id})" title="Editar"
                        class="w-9 h-9 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
            </div>
        </td>` : ''}
    </tr>`;
    },

    // ─────────────────────────────────────────────
    // DETALLE
    // ─────────────────────────────────────────────

    mostrarDetalle(m) {
        Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">Detalle del Método</span>`,
            html: `
            <div class="text-left space-y-4 p-2">
                <div class="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div class="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 flex-shrink-0">
                        <span class="material-symbols-outlined text-[28px]">payments</span>
                    </div>
                    <div>
                        <p class="text-xl font-black text-slate-800 uppercase leading-tight">${m.nombre}</p>
                        <span class="font-mono text-[11px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-lg font-bold">${m.slug}</span>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-3">
                    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Estado</p>
                        <span class="inline-flex items-center gap-1.5 text-sm font-black ${m.activo ? 'text-emerald-600' : 'text-slate-400'}">
                            <span class="material-symbols-outlined text-[16px]">${m.activo ? 'check_circle' : 'cancel'}</span>
                            ${m.activo ? 'Activo' : 'Inactivo'}
                        </span>
                    </div>
                    <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Requiere Referencia</p>
                        <span class="inline-flex items-center gap-1.5 text-sm font-black ${m.requiere_referencia ? 'text-amber-600' : 'text-slate-400'}">
                            <span class="material-symbols-outlined text-[16px]">${m.requiere_referencia ? 'check_circle' : 'remove_circle'}</span>
                            ${m.requiere_referencia ? 'Sí' : 'No'}
                        </span>
                    </div>
                </div>
                ${m.descripcion ? `
                <div class="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                    <p class="text-sm text-slate-600 font-medium leading-relaxed">${m.descripcion}</p>
                </div>` : ''}
            </div>`,
            showCancelButton: true,
            confirmButtonText: '<span class="flex items-center gap-2"><span class="material-symbols-outlined text-sm">edit</span> Editar</span>',
            cancelButtonText: 'Cerrar',
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[90%] max-w-md',
                confirmButton: 'rounded-xl px-6 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-6 py-3 font-bold text-sm bg-slate-100 text-slate-500',
            },
        }).then(({ isConfirmed }) => {
            if (isConfirmed) window.metodoPagoController.editar(m.id);
        });
    },

    // ─────────────────────────────────────────────
    // FORMULARIO EDITAR (solo nombre y descripción)
    // ─────────────────────────────────────────────

    async mostrarFormularioEditar(datos = {}) {
        const { value: formValues } = await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">Editar Método de Pago</span>`,
            html: `
            <div class="text-left space-y-4 p-2">
                <div class="space-y-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre</label>
                    <input id="swal-nombre" type="text"
                           class="bg-white shadow-sm border border-slate-200 w-full rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700"
                           placeholder="Ej. Transferencia Bancaria" value="${datos.nombre || ''}">
                </div>
                <div class="space-y-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Descripción (opcional)</label>
                    <textarea id="swal-descripcion" rows="3"
                              class="w-full bg-white shadow-sm border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-slate-700 resize-none"
                              placeholder="Descripción breve del método...">${datos.descripcion || ''}</textarea>
                </div>
            </div>`,
            showCancelButton: true,
            confirmButtonText: 'Guardar Cambios',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[90%] max-w-md',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all shadow-lg shadow-blue-200',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors',
            },
            didOpen: () => document.getElementById('swal-nombre').focus(),
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value.trim();
                if (!nombre) { Swal.showValidationMessage('El nombre es obligatorio'); return false; }
                return {
                    nombre,
                    descripcion: document.getElementById('swal-descripcion').value.trim() || null,
                };
            },
        });

        return formValues;
    },

    // ─────────────────────────────────────────────
    // FILTRADO Y ORDEN
    // ─────────────────────────────────────────────

    _filtrarDatos(datos) {
        if (!this._estado.busqueda) return [...datos];
        const term = this._estado.busqueda.toLowerCase();
        return datos.filter(m =>
            m.nombre.toLowerCase().includes(term) ||
            m.slug.toLowerCase().includes(term) ||
            (m.descripcion && m.descripcion.toLowerCase().includes(term))
        );
    },

    _ordenarDatos(datos) {
        return [...datos].sort((a, b) => {
            const valA = (a.nombre || '').toLowerCase();
            const valB = (b.nombre || '').toLowerCase();
            return this._estado.orden === 'asc'
                ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
                : valB.localeCompare(valA, undefined, { sensitivity: 'base' });
        });
    },

    gestionarBusqueda(valor) {
        this._estado.busqueda = valor;
        this._estado.paginaActual = 1;
        window.metodoPagoController.refrescarVista();
    },

    gestionarOrden() {
        this._estado.orden = this._estado.orden === 'asc' ? 'desc' : 'asc';
        window.metodoPagoController.refrescarVista();
    },

    cambiarPagina(nuevaPagina) {
        this._estado.paginaActual = nuevaPagina;
        window.metodoPagoController.refrescarVista();
    },

    _enfocarBusqueda() {
        const input = document.getElementById('input-busqueda-mp');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },
};

window.metodoPagoView = metodoPagoView;
