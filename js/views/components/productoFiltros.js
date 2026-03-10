/**
 * productoFiltros.js
 * Componente: Barra de filtros del inventario
 * Responsabilidad: Selector de sucursal, búsqueda, categorías, orden,
 *                  switches globales y botones de filtro por stock
 */

export const productoFiltros = {

    /**
     * Render principal — devuelve HTML string
     * @param {Object} estado             - _estado del productoView
     * @param {Array}  sucursales         - Lista de sucursales disponibles
     * @param {String} nombreSucursal     - Nombre de la sucursal actualmente seleccionada
     * @param {Boolean} todosConWhatsapp  - Estado global del switch de WhatsApp
     * @param {Boolean} todosConPrecio    - Estado global del switch de precios
     * @param {Object}  stats             - { total, conStock, bajoStock, agotados }
     * @param {Function} renderSwitch     - productoView._renderSwitch (bound)
     * @param {Function} renderEtiquetas  - productoView._renderEtiquetasFiltro (bound)
     */
    render(estado, sucursales, nombreSucursal, todosConWhatsapp, todosConPrecio, stats, renderSwitch, renderEtiquetas) {
        const filtroStock = estado.filtroStock || 'todos';

        return `
        <div class="bg-slate-50/50 p-5 rounded-[28px] border border-slate-100 mb-6 space-y-4">

            ${this._renderFilaBuscadores(estado, sucursales)}

            ${this._renderFilaAcciones(estado, todosConWhatsapp, todosConPrecio, stats, filtroStock, renderSwitch)}

            ${renderEtiquetas()}

        </div>`;
    },

    /* ── Fila 1: Sucursal · Búsqueda · Categoría · Orden · Columnas ── */
    _renderFilaBuscadores(estado, sucursales) {
        return `
        <div class="flex flex-wrap items-center gap-3">

            <!-- Selector de sucursal -->
            <div class="relative w-full md:w-52">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 text-[20px]">storefront</span>
                <select onchange="productoView.gestionarCambioSucursal(this.value)"
                        class="select-clean w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-8 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 font-bold text-slate-700 cursor-pointer">
                    <option value="todas" ${estado.sucursalSeleccionada === 'todas' ? 'selected' : ''}>Todas las sucursales</option>
                    ${sucursales.map(s => `
                        <option value="${s.id}" ${estado.sucursalSeleccionada == s.id ? 'selected' : ''}>${s.nombre}</option>
                    `).join('')}
                </select>
                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10 text-[18px]">expand_more</span>
            </div>

            <!-- Búsqueda por nombre -->
            <div class="relative flex-1 min-w-[220px]">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">search</span>
                <input type="text" id="main-search-input"
                       oninput="productoView.gestionarBusqueda(this.value)"
                       value="${estado.busqueda}"
                       class="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-10 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 font-medium"
                       placeholder="Buscar por nombre o categoría...">
                ${estado.busqueda ? `
                    <button onclick="productoView.limpiarBusquedaRapida()"
                            class="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-red-500">
                        <span class="material-symbols-outlined text-lg">cancel</span>
                    </button>` : ''}
            </div>

            <!-- Filtro de categoría -->
            <div class="relative w-full md:w-52">
                <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">sell</span>
                <input type="text"
                       id="category-search-input"
                       onkeyup="productoView.filtrarSugerencias(this.value)"
                       onfocus="productoView.filtrarSugerencias(this.value)"
                       onblur="setTimeout(() => document.getElementById('suggestions-panel').classList.add('hidden'), 200)"
                       class="w-full bg-white border border-slate-200 rounded-2xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 font-medium"
                       placeholder="Filtrar categoría..."
                       autocomplete="off">
                <div id="suggestions-panel"
                     class="hidden absolute z-[100] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-2">
                </div>
            </div>

            <!-- Orden + Columnas -->
            <div class="flex items-center gap-2 ml-auto">
                <button onclick="productoView.gestionarOrden()"
                        class="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:text-blue-600 transition-all shadow-sm font-bold text-xs uppercase">
                    <span class="material-symbols-outlined text-lg">${estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                    ${estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                </button>
                <button onclick="configuracionColumnasController.iniciarFlujoConfiguracion('productos', (cols) => productoController.refrescarVista(cols))"
                        class="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm active:scale-95">
                    <span class="material-symbols-outlined text-[20px]">view_column</span>
                </button>
            </div>

        </div>`;
    },

    /* ── Fila 2: Switches globales · Botones de filtro stock ── */
    _renderFilaAcciones(estado, todosConWhatsapp, todosConPrecio, stats, filtroStock, renderSwitch) {
        return `
        <div class="flex flex-wrap items-center justify-between gap-3">

            <!-- Switches globales -->
            <div class="flex items-center gap-5 bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm">
                <div class="flex items-center gap-2.5">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-tight">Global WhatsApp</span>
                    ${renderSwitch('global', 'habilitar_whatsapp', todosConWhatsapp, 'emerald', true)}
                </div>
                <div class="w-px h-5 bg-slate-200"></div>
                <div class="flex items-center gap-2.5">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-tight">Global Precios</span>
                    ${renderSwitch('global', 'mostrar_precio', todosConPrecio, 'blue', true)}
                </div>
            </div>

            <!-- Botones de filtro por stock -->
            <div class="flex items-center bg-white border border-slate-200 rounded-2xl p-1 shadow-sm gap-1">

                ${this._renderBotonStock('todos', 'Todos', stats.total, filtroStock, 'bg-blue-600')}
                ${this._renderBotonStock('con-stock', 'Con Stock', stats.conStock, filtroStock, 'bg-emerald-500')}
                ${this._renderBotonStock('bajo-stock', 'Bajo Stock', stats.bajoStock, filtroStock, 'bg-amber-500')}
                ${this._renderBotonStock('agotados', 'Agotados', stats.agotados, filtroStock, 'bg-red-500')}

            </div>

        </div>`;
    },

    /* ── Botón individual de filtro por stock ── */
    _renderBotonStock(valor, etiqueta, cantidad, filtroActivo, colorActivo) {
        const estaActivo = filtroActivo === valor;
        return `
        <button onclick="productoView.gestionarFiltroStock('${valor}')"
                class="stock-btn px-3.5 py-2 rounded-xl text-[11px] font-black uppercase transition-all
                       ${estaActivo
                ? `${colorActivo} text-white shadow-sm`
                : 'text-slate-500 hover:bg-slate-50'}">
            ${etiqueta}
            <span class="ml-1 font-bold opacity-60">${cantidad}</span>
        </button>`;
    }
};