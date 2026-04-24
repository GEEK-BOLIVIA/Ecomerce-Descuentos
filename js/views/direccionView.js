import { PaginationHelper } from '../utils/paginationHelper.js';
import { ActionButtons } from '../utils/componentUtils.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const direccionView = {

    _estado: {
        busqueda: '',
        orden: 'asc',
        paginaActual: 1,
        filasPorPagina: 10
    },
    _mapaDetalle: null,
    _mapaEliminar: null,

    // ─────────────────────────────────────────────
    // SELECCIÓN POR LOTE
    // ─────────────────────────────────────────────

    toggleLote(id) {
        selectorUtil.toggle(id, (cant) => this._actualizarBarraFlotante(cant));
        const fila = document.querySelector(`input.fila-checkbox-dir[data-id="${id}"]`)?.closest('tr');
        if (fila) fila.classList.toggle('bg-blue-50/70', selectorUtil.estado.seleccionados.includes(String(id)));
    },

    toggleLoteTodos(datos) {
        selectorUtil.toggleTodos(datos, (cant) => this._actualizarBarraFlotante(cant));
        const isAllChecked = selectorUtil.estado.seleccionados.length >= datos.length;
        document.querySelectorAll('input.fila-checkbox-dir').forEach(chk => {
            chk.checked = isAllChecked;
            chk.closest('tr')?.classList.toggle('bg-blue-50/70', isAllChecked);
        });
        const master = document.getElementById('check-all-dir');
        if (master) master.checked = isAllChecked;
    },

    limpiarSeleccion() {
        selectorUtil.limpiar((cant) => this._actualizarBarraFlotante(cant));
        direccionController.refrescarVista();
    },

    _renderBarraFlotante() {
        return `
        <div id="bulk-actions-bar-dir"
             class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]
                    translate-y-28 opacity-0 pointer-events-none
                    transition-all duration-500">
            <div class="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-2">
                <div class="flex items-center gap-3 px-4 py-2 border-r border-slate-100 mr-1">
                    <div class="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-red-200 shadow-lg">
                        <span class="material-symbols-outlined text-white text-xl">location_on</span>
                    </div>
                    <div class="flex flex-col">
                        <span id="lote-dir-contador" class="text-[13px] font-bold text-slate-800 leading-none">0 seleccionados</span>
                        <span class="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Acciones masivas</span>
                    </div>
                </div>
                <button onclick="direccionView.confirmarEliminacionMasiva()"
                        class="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 group">
                    <span class="material-symbols-outlined text-lg">delete_sweep</span>
                    <span class="text-[11px] font-black uppercase tracking-tight">Eliminar</span>
                </button>
                <button onclick="direccionView.limpiarSeleccion()"
                        class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all ml-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>`;
    },

    _actualizarBarraFlotante(cantidad) {
        const barra = document.getElementById('bulk-actions-bar-dir');
        const contador = document.getElementById('lote-dir-contador');
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
            title: `<span class="text-red-600 font-black uppercase text-xs">¿ELIMINAR ${ids.length} DIRECCIONES?</span>`,
            html: `<p class="text-sm text-slate-600">Se eliminarán permanentemente las direcciones seleccionadas. No se puede deshacer.</p>`,
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
            if (r.isConfirmed) direccionController.eliminarMasivo(ids);
        });
    },

    // ─────────────────────────────────────────────
    // NOTIFICACIONES
    // ─────────────────────────────────────────────
    notificarExito(mensaje) {
        Swal.fire({
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">¡Operación Exitosa!</span>',
            text: mensaje, timer: 2500, showConfirmButton: false,
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    notificarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error en la Operación</span>',
            text: mensaje, confirmButtonColor: '#2563eb',
            customClass: { popup: 'rounded-[32px] border-none shadow-xl', confirmButton: 'rounded-xl px-6 py-2 font-bold text-xs uppercase' }
        });
    },

    mostrarCargando(mensaje = 'Cargando datos...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Cargando</span>',
            text: mensaje, allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    // ─────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────
    _nombreCompleto(usuario) {
        if (!usuario) return '—';
        return [usuario.nombres, usuario.apellido_paterno, usuario.apellido_materno]
            .filter(Boolean).join(' ');
    },

    _iniciales(usuario) {
        if (!usuario) return '?';
        return [usuario.nombres, usuario.apellido_paterno]
            .filter(Boolean).map(n => n[0].toUpperCase()).join('').slice(0, 2);
    },

    async _cargarLeaflet() {
        if (window.L) return;
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css'; link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        await new Promise((resolve, reject) => {
            if (window.L) { resolve(); return; }
            const s = document.createElement('script');
            s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            s.onload = resolve; s.onerror = reject;
            document.head.appendChild(s);
        });
    },

    _crearMapaVisor(containerId, lat, lng, zoom, color = '#3b82f6') {
        const map = L.map(containerId, { center: [lat, lng], zoom, zoomControl: true, scrollWheelZoom: false });
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap', maxZoom: 19
        }).addTo(map);
        const icono = L.divIcon({
            className: '',
            html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;
                               background:${color};border:3px solid white;
                               box-shadow:0 4px 12px rgba(0,0,0,0.25);transform:rotate(-45deg);"></div>`,
            iconSize: [28, 28], iconAnchor: [14, 28]
        });
        L.marker([lat, lng], { icon: icono, interactive: false }).addTo(map);
        L.circle([lat, lng], { color, fillColor: color, fillOpacity: 0.08, weight: 1.5, radius: 300 }).addTo(map);
        return map;
    },

    _destruirMapa(ref) {
        if (ref) { try { ref.remove(); } catch (e) { } }
        return null;
    },

    // ─────────────────────────────────────────────
    // RENDER TABLA
    // ─────────────────────────────────────────────
    render(datos, columnasVisibles = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        const cols = columnasVisibles.length > 0 ? columnasVisibles :
            ['nro', 'cliente', 'etiqueta', 'direccion', 'referencia', 'mapa', 'acciones'];

        let datosFiltrados = this._ordenarDatos(this._filtrarDatos(datos));
        const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
        const datosPaginados = datosFiltrados.slice(inicio, inicio + this._estado.filasPorPagina);

        window._direccionesPaginadas = datosPaginados;

        contenedor.innerHTML = `
    <div class="p-8 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto">

        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Direcciones</h1>
                <p class="text-slate-500 text-sm font-medium">Direcciones registradas por los clientes con ubicación en el mapa.</p>
            </div>
            <button onclick="direccionController.mostrarFormularioCrear()"
                    class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl transition-all
                           shadow-lg shadow-blue-200 font-bold text-sm flex items-center gap-2 w-fit">
                <span class="material-symbols-outlined text-[20px]">add_location_alt</span> Nueva Dirección
            </button>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="relative flex-1 md:w-96">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input type="text" id="input-busqueda-direcciones"
                       placeholder="Buscar por cliente, etiqueta o referencia..."
                       value="${this._estado.busqueda}"
                       oninput="direccionView.gestionarBusqueda(this.value)"
                       class="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm
                              outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500
                              transition-all font-medium">
                ${this._estado.busqueda ? `
                <button onclick="direccionView.limpiarBusqueda()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center
                               rounded-full bg-slate-200 hover:bg-slate-300 text-slate-500 transition-all">
                    <span class="material-symbols-outlined text-[13px]">close</span>
                </button>` : ''}
            </div>

            <div class="flex items-center gap-2">
                <button onclick="direccionView.gestionarOrden()"
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl
                               text-slate-600 hover:text-blue-600 transition-all shadow-sm font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">${this._estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                    ${this._estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                </button>

                <button onclick="configuracionColumnasController.iniciarFlujoConfiguracion('direcciones', async () => { await direccionController.inicializar(true); })"
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
                                <input type="checkbox" id="check-all-dir"
                                       class="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                       onchange="direccionView.toggleLoteTodos(window._direccionesPaginadas)">
                            </th>
                            ${cols.includes('nro') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase w-12 text-center">N°</th>` : ''}
                            ${cols.includes('cliente') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Cliente</th>` : ''}
                            ${cols.includes('etiqueta') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Etiqueta</th>` : ''}
                            ${cols.includes('direccion') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Dirección</th>` : ''}
                            ${cols.includes('referencia') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase">Referencia</th>` : ''}
                            ${cols.includes('mapa') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Mapa</th>` : ''}
                            ${cols.includes('acciones') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Acciones</th>` : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${datosPaginados.length > 0
                ? datosPaginados.map((d, i) => this._crearFila(d, inicio + i + 1, cols)).join('')
                : `<tr><td colspan="7" class="px-6 py-12 text-center text-slate-400 italic text-sm">No se encontraron direcciones registradas</td></tr>`
            }
                    </tbody>
                </table>
            </div>
            ${PaginationHelper.render(datosFiltrados.length, this._estado.filasPorPagina, this._estado.paginaActual, 'direccionView')}
        </div>
    </div>` + this._renderBarraFlotante();

        setTimeout(() => {
            selectorUtil.sincronizarChecks();
            this._actualizarBarraFlotante(selectorUtil.estado.seleccionados.length);
        }, 0);

        this._enfocarBusqueda();
    },

    _crearFila(d, numero, cols = []) {
        const nombre = this._nombreCompleto(d.usuario);
        const iniciales = this._iniciales(d.usuario);
        const esPpal = d.es_principal;
        const isChecked = selectorUtil.estado.seleccionados.includes(String(d.id)) ? 'checked' : '';

        return `
    <tr class="hover:bg-slate-50/50 transition-colors group ${isChecked ? 'bg-blue-50/70' : ''}">
        <td class="px-4 py-4 text-center">
            <input type="checkbox" ${isChecked}
                   class="fila-checkbox-dir w-4 h-4 rounded accent-blue-600 cursor-pointer"
                   data-id="${d.id}"
                   onchange="direccionView.toggleLote('${d.id}')">
        </td>
        ${cols.includes('nro') ? `
        <td class="px-6 py-4 text-center">
            <span class="text-slate-400 font-bold text-xs">${numero}</span>
        </td>` : ''}
        ${cols.includes('cliente') ? `
        <td class="px-6 py-4">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center
                            font-black text-[11px] flex-shrink-0">${iniciales}</div>
                <div>
                    <p class="text-[12px] font-black text-slate-700 uppercase leading-tight">${nombre}</p>
                    <p class="text-[10px] text-slate-400 truncate max-w-[160px]">${d.usuario?.correo_electronico || ''}</p>
                </div>
            </div>
        </td>` : ''}
        ${cols.includes('etiqueta') ? `
        <td class="px-6 py-4 text-center">
            <div class="flex flex-col items-center gap-1">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase
                             bg-blue-50 border border-blue-100 text-blue-700">
                    <span class="material-symbols-outlined text-[12px]">label</span>
                    ${d.nombre_lugar || 'Mi Casa'}
                </span>
                ${esPpal ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase
                                          bg-amber-50 border border-amber-100 text-amber-600">
                                <span class="material-symbols-outlined text-[10px]">star</span> Principal
                            </span>` : ''}
            </div>
        </td>` : ''}
        ${cols.includes('direccion') ? `
        <td class="px-6 py-4">
            <p class="text-[11px] text-slate-600 font-medium truncate max-w-[200px]" title="${d.direccion_texto || ''}">
                ${d.direccion_texto || `<span class="text-slate-300 italic">Sin dirección detectada</span>`}
            </p>
            <p class="text-[10px] text-slate-400 mt-0.5">${d.departamento?.nombre || '—'}</p>
        </td>` : ''}
        ${cols.includes('referencia') ? `
        <td class="px-6 py-4">
            <p class="text-[11px] text-slate-600 font-medium truncate max-w-[160px]" title="${d.referencia}">
                ${d.referencia}
            </p>
        </td>` : ''}
        ${cols.includes('mapa') ? `
        <td class="px-6 py-4 text-center">
            <button onclick="direccionController.verMapa(${d.id})"
                    class="w-9 h-9 flex items-center justify-center mx-auto rounded-xl
                           bg-emerald-50 hover:bg-emerald-100 text-emerald-600
                           border border-emerald-100 transition-all" title="Ver en mapa">
                <span class="material-symbols-outlined text-[18px]">location_on</span>
            </button>
        </td>` : ''}
        ${cols.includes('acciones') ? `
        <td class="px-6 py-4 text-center">
            <div class="flex justify-center gap-2">
                ${ActionButtons.render(d.id, 'edit', 'Editar', 'blue', 'direccionController.editar')}
                ${ActionButtons.render(d.id, 'visibility', 'Ver Detalle', 'indigo', 'direccionController.verDetalle')}
                ${ActionButtons.render(d.id, 'delete', 'Eliminar', 'red', 'direccionController.confirmarEliminacion')}
            </div>
        </td>` : ''}
    </tr>`;
    },

    // ─────────────────────────────────────────────
    // VISTA DETALLE
    // ─────────────────────────────────────────────
    async mostrarDetalle(dir) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return false;
        await this._cargarLeaflet();

        const nombre = this._nombreCompleto(dir.usuario);
        const iniciales = this._iniciales(dir.usuario);

        return new Promise((resolve) => {
            contenedor.innerHTML = `
            <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

                <!-- Header -->
                <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                    <div class="flex items-center gap-3">
                        <button id="dd-btn-volver"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100
                                       hover:bg-slate-200 text-slate-600 transition-all">
                            <span class="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de Dirección</p>
                            <h1 class="text-lg font-black text-slate-800 leading-tight">${dir.nombre_lugar || 'Mi Casa'}</h1>
                        </div>
                    </div>
                    <button id="dd-btn-editar"
                            class="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700
                                   text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                                   transition-all shadow-md active:scale-95">
                        <span class="material-symbols-outlined text-base">edit_square</span>
                        Editar Dirección
                    </button>
                </div>

                <!-- Layout -->
                <div class="flex flex-1 overflow-hidden">

                    <!-- Mapa -->
                    <div class="relative flex-1 overflow-hidden">
                        <div id="dd-map" class="w-full h-full"></div>

                        <!-- Badge principal -->
                        ${dir.es_principal ? `
                        <div class="absolute bottom-4 right-4 z-[1000]
                                    bg-amber-500 shadow-lg rounded-2xl px-4 py-2
                                    flex items-center gap-2">
                            <span class="material-symbols-outlined text-white text-[16px]">star</span>
                            <span class="text-[11px] font-black text-white uppercase">Dirección Principal</span>
                        </div>` : ''}

                        <!-- Coords overlay -->
                        <div class="absolute bottom-4 left-4 z-[1000]
                                    bg-slate-900/85 backdrop-blur rounded-xl px-3 py-2
                                    flex items-center gap-2 border border-white/10">
                            <span class="material-symbols-outlined text-blue-400 text-[15px]">my_location</span>
                            <span class="text-[11px] font-mono font-bold text-white">
                                ${parseFloat(dir.lat).toFixed(6)}, ${parseFloat(dir.lng).toFixed(6)}
                            </span>
                        </div>
                    </div>

                    <!-- Panel info -->
                    <div class="w-[360px] flex-shrink-0 bg-white border-l border-slate-200 overflow-y-auto flex flex-col">

                        <!-- Cliente -->
                        <div class="p-6 border-b border-slate-100">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cliente</p>
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-base flex-shrink-0">
                                    ${iniciales}
                                </div>
                                <div>
                                    <p class="text-sm font-black text-slate-800 uppercase">${nombre}</p>
                                    <p class="text-[11px] text-slate-400">${dir.usuario?.correo_electronico || ''}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Datos -->
                        <div class="p-6 flex flex-col gap-4">

                            <!-- Etiqueta + departamento -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-blue-50 rounded-2xl p-3.5 border border-blue-100">
                                    <p class="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Etiqueta</p>
                                    <p class="text-sm font-black text-blue-700">${dir.nombre_lugar || 'Mi Casa'}</p>
                                </div>
                                <div class="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Departamento</p>
                                    <p class="text-sm font-black text-slate-700">${dir.departamento?.nombre || '—'}</p>
                                </div>
                            </div>

                            <!-- Dirección texto -->
                            <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[13px]">location_on</span>
                                    Dirección
                                </p>
                                <p class="text-sm text-slate-700 font-medium leading-relaxed">
                                    ${dir.direccion_texto || '<span class="text-slate-400 italic text-xs">Sin dirección detectada</span>'}
                                </p>
                            </div>

                            <!-- Referencia -->
                            <div class="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                                <p class="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[13px]">star</span>
                                    Referencia para el Repartidor
                                </p>
                                <p class="text-sm text-slate-700 font-medium leading-relaxed">${dir.referencia}</p>
                            </div>

                            <!-- Coordenadas -->
                            <div class="grid grid-cols-2 gap-3">
                                <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitud</p>
                                    <p class="text-sm font-mono font-bold text-slate-700">${parseFloat(dir.lat).toFixed(6)}</p>
                                </div>
                                <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitud</p>
                                    <p class="text-sm font-mono font-bold text-slate-700">${parseFloat(dir.lng).toFixed(6)}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Botón eliminar -->
                        <div class="mt-auto p-6 border-t border-slate-100">
                            <button id="dd-btn-eliminar"
                                    class="w-full flex items-center justify-center gap-2 px-4 py-3
                                           bg-red-50 hover:bg-red-100 border border-red-200 text-red-600
                                           rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                                <span class="material-symbols-outlined text-base">delete_forever</span>
                                Eliminar Dirección
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    this._mapaDetalle = this._crearMapaVisor('dd-map', parseFloat(dir.lat), parseFloat(dir.lng), 16, '#3b82f6');
                }, 100);
            });

            document.getElementById('dd-btn-volver')?.addEventListener('click', () => {
                this._mapaDetalle = this._destruirMapa(this._mapaDetalle);
                resolve(false);
            });
            document.getElementById('dd-btn-editar')?.addEventListener('click', () => {
                this._mapaDetalle = this._destruirMapa(this._mapaDetalle);
                resolve(true);
            });
            document.getElementById('dd-btn-eliminar')?.addEventListener('click', () => {
                this._mapaDetalle = this._destruirMapa(this._mapaDetalle);
                resolve('eliminar');
            });
        });
    },

    // ─────────────────────────────────────────────
    // VISTA ELIMINAR
    // ─────────────────────────────────────────────
    async mostrarConfirmacionEliminar(dir) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return false;
        await this._cargarLeaflet();

        const nombre = this._nombreCompleto(dir.usuario);

        return new Promise((resolve) => {
            contenedor.innerHTML = `
            <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-red-50/30">

                <!-- Header rojo -->
                <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-red-100 shadow-sm flex-shrink-0">
                    <div class="flex items-center gap-3">
                        <button id="de-btn-cancelar"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100
                                       hover:bg-slate-200 text-slate-600 transition-all">
                            <span class="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        <div>
                            <p class="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[13px]">warning</span>
                                Zona de Peligro — Acción Irreversible
                            </p>
                            <h1 class="text-lg font-black text-slate-800 leading-tight">${dir.nombre_lugar || 'Mi Casa'}</h1>
                        </div>
                    </div>
                    <button id="de-btn-confirmar"
                            class="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700
                                   text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                                   transition-all shadow-md shadow-red-200 active:scale-95">
                        <span class="material-symbols-outlined text-base">delete_forever</span>
                        Confirmar Eliminación
                    </button>
                </div>

                <div class="flex flex-1 overflow-hidden">

                    <!-- Mapa desaturado -->
                    <div class="relative flex-1 overflow-hidden">
                        <div id="de-map" class="w-full h-full" style="filter:saturate(0.3) brightness(0.9);"></div>
                        <div class="absolute inset-0 pointer-events-none z-[999]"
                             style="background:linear-gradient(135deg,rgba(239,68,68,0.08),transparent);"></div>
                        <div class="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]
                                    bg-red-600 shadow-lg shadow-red-200 rounded-2xl px-5 py-2.5
                                    flex items-center gap-2">
                            <span class="material-symbols-outlined text-white text-[18px]">warning</span>
                            <span class="text-[11px] font-black text-white uppercase tracking-wide">Esta acción no se puede deshacer</span>
                        </div>
                        <div class="absolute bottom-4 left-4 z-[1000]
                                    bg-slate-900/85 backdrop-blur rounded-xl px-3 py-2
                                    flex items-center gap-2 border border-white/10">
                            <span class="material-symbols-outlined text-red-400 text-[15px]">location_off</span>
                            <span class="text-[11px] font-mono font-bold text-white">
                                ${parseFloat(dir.lat).toFixed(6)}, ${parseFloat(dir.lng).toFixed(6)}
                            </span>
                        </div>
                    </div>

                    <!-- Panel -->
                    <div class="w-[360px] flex-shrink-0 bg-white border-l border-red-100 overflow-y-auto flex flex-col">

                        <div class="p-6 border-b border-red-50">
                            <p class="text-[10px] font-black text-red-400 uppercase tracking-widest mb-3">Se eliminará</p>
                            <div class="flex items-center gap-3 mb-3">
                                <div class="w-12 h-12 rounded-2xl bg-red-50 text-red-400 flex items-center justify-center font-black text-base flex-shrink-0">
                                    ${this._iniciales(dir.usuario)}
                                </div>
                                <div>
                                    <p class="text-sm font-black text-slate-800 uppercase">${nombre}</p>
                                    <p class="text-[11px] text-slate-400">${dir.usuario?.correo_electronico || ''}</p>
                                </div>
                            </div>
                            <p class="text-sm text-slate-500 leading-relaxed">
                                Se eliminará permanentemente esta dirección y no podrá recuperarse.
                            </p>
                        </div>

                        <div class="p-6 flex flex-col gap-3">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Datos que se eliminarán</p>

                            ${[
                    ['label', 'Etiqueta', dir.nombre_lugar || 'Mi Casa'],
                    ['location_on', 'Departamento', dir.departamento?.nombre || '—'],
                    ['near_me', 'Referencia', dir.referencia],
                    ['map', 'Coordenadas', `${parseFloat(dir.lat).toFixed(4)}, ${parseFloat(dir.lng).toFixed(4)}`]
                ].map(([icon, label, val]) => `
                            <div class="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                                <span class="material-symbols-outlined text-slate-400 text-lg mt-0.5">${icon}</span>
                                <div class="min-w-0">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${label}</p>
                                    <p class="text-sm font-bold text-slate-700 truncate">${val}</p>
                                </div>
                            </div>`).join('')}
                        </div>

                        <div class="mt-auto p-6 border-t border-red-50 flex flex-col gap-3">
                            <button id="de-btn-confirmar-2"
                                    class="w-full flex items-center justify-center gap-2 px-4 py-3
                                           bg-red-600 hover:bg-red-700 text-white rounded-2xl
                                           font-black text-[10px] uppercase tracking-widest
                                           transition-all shadow-lg shadow-red-200 active:scale-95">
                                <span class="material-symbols-outlined text-base">delete_forever</span>
                                Sí, eliminar permanentemente
                            </button>
                            <button id="de-btn-cancelar-2"
                                    class="w-full flex items-center justify-center gap-2 px-4 py-3
                                           bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl
                                           font-black text-[10px] uppercase tracking-widest transition-all">
                                <span class="material-symbols-outlined text-base">close</span>
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </div>`;

            requestAnimationFrame(() => {
                setTimeout(() => {
                    this._mapaEliminar = this._crearMapaVisor('de-map', parseFloat(dir.lat), parseFloat(dir.lng), 16, '#ef4444');
                }, 100);
            });

            const cancelar = () => { this._mapaEliminar = this._destruirMapa(this._mapaEliminar); resolve(false); };
            const confirmar = () => { this._mapaEliminar = this._destruirMapa(this._mapaEliminar); resolve(true); };

            document.getElementById('de-btn-cancelar')?.addEventListener('click', cancelar);
            document.getElementById('de-btn-cancelar-2')?.addEventListener('click', cancelar);
            document.getElementById('de-btn-confirmar')?.addEventListener('click', confirmar);
            document.getElementById('de-btn-confirmar-2')?.addEventListener('click', confirmar);
        });
    },

    // ─────────────────────────────────────────────
    // MODAL MINI MAPA (botón pin en tabla)
    // ─────────────────────────────────────────────
    async mostrarMiniMapa(dir) {
        await this._cargarLeaflet();
        const nombre = this._nombreCompleto(dir.usuario);

        Swal.fire({
            title: null,
            html: `
            <div class="text-left">
                <div class="flex items-center gap-3 mb-4">
                    <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center
                                justify-center font-black text-sm flex-shrink-0">
                        ${this._iniciales(dir.usuario)}
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800 uppercase leading-tight">${nombre}</p>
                        <p class="text-[10px] text-slate-400">${dir.nombre_lugar || 'Mi Casa'} · ${dir.departamento?.nombre || ''}</p>
                    </div>
                </div>
                <div id="mini-mapa-swal" style="width:100%;height:300px;border-radius:16px;overflow:hidden;"></div>
                <p class="text-[11px] text-slate-500 mt-3 leading-relaxed">
                    <span class="font-black text-amber-600">Ref:</span> ${dir.referencia}
                </p>
            </div>`,
            showConfirmButton: false,
            showCloseButton: true,
            width: '480px',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl p-6',
                closeButton: 'text-slate-400 hover:text-red-400'
            },
            didOpen: () => {
                setTimeout(() => {
                    const m = this._crearMapaVisor('mini-mapa-swal', parseFloat(dir.lat), parseFloat(dir.lng), 16, '#3b82f6');
                    // Destruir al cerrar
                    const orig = Swal.getPopup();
                    orig?.addEventListener('click', (e) => {
                        if (e.target.closest('.swal2-close')) m.remove();
                    });
                }, 100);
            }
        });
    },

    // ─────────────────────────────────────────────
    // FILTRADO Y ORDEN
    // ─────────────────────────────────────────────
    _filtrarDatos(datos) {
        if (!this._estado.busqueda) return [...datos];
        const term = this._estado.busqueda.toLowerCase();
        return datos.filter(d => {
            const nombre = this._nombreCompleto(d.usuario).toLowerCase();
            return nombre.includes(term)
                || (d.nombre_lugar && d.nombre_lugar.toLowerCase().includes(term))
                || (d.referencia && d.referencia.toLowerCase().includes(term))
                || (d.direccion_texto && d.direccion_texto.toLowerCase().includes(term));
        });
    },

    _ordenarDatos(datos) {
        return [...datos].sort((a, b) => {
            const valA = this._nombreCompleto(a.usuario).toLowerCase();
            const valB = this._nombreCompleto(b.usuario).toLowerCase();
            return this._estado.orden === 'asc'
                ? valA.localeCompare(valB, undefined, { sensitivity: 'base' })
                : valB.localeCompare(valA, undefined, { sensitivity: 'base' });
        });
    },

    gestionarBusqueda(valor) {
        this._estado.busqueda = valor;
        this._estado.paginaActual = 1;
        direccionController.inicializar(true);
    },

    limpiarBusqueda() {
        this._estado.busqueda = '';
        this._estado.paginaActual = 1;
        direccionController.refrescarVista();
    },

    gestionarOrden() {
        this._estado.orden = this._estado.orden === 'asc' ? 'desc' : 'asc';
        direccionController.refrescarVista();
    },

    cambiarPagina(nuevaPagina) {
        this._estado.paginaActual = nuevaPagina;
        direccionController.refrescarVista();
    },

    _enfocarBusqueda() {
        const input = document.getElementById('input-busqueda-direcciones');
        if (input) { input.focus(); input.setSelectionRange(input.value.length, input.value.length); }
    },

    async confirmarAccion({ titulo, nombreEntidad, mensajePersonalizado, botonConfirmar = 'Confirmar' }) {
        return await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">${titulo}</span>`,
            html: `<div class="text-center"><p class="text-slate-500 text-sm">${mensajePersonalizado}<br>
                       <span class="text-slate-800 font-bold">"${nombreEntidad}"</span></p></div>`,
            icon: 'question',
            showCancelButton: true, confirmButtonText: botonConfirmar, cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all hover:scale-105',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });
    }
};

window.direccionView = direccionView;