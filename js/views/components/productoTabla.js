import { ActionButtons, TableWidgets } from '../../utils/componentUtils.js';

export const productoTabla = {

    /**
     * Render principal — devuelve HTML string
     * @param {Array}    datos         - Productos ya filtrados y ordenados
     * @param {Object}   estado        - _estado del productoView
     * @param {Function} renderSwitch  - productoView._renderSwitch (bound)
     * @param {Function} renderPag     - productoView._generarPaginacion (bound)
     * @param {Function} getColor      - productoView._obtenerColorCategoria (bound)
     */
    render(datos, estado, renderSwitch, renderPag, getColor) {
        const esTodas = estado.sucursalSeleccionada === 'todas';

        return `
        <div class="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden mb-8">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/80">
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase w-20 text-center">N°</th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Producto / Categoría</th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">
                                ${esTodas ? 'Precio (Bs)' : 'Precio'}
                            </th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">
                                ${esTodas ? 'Stock Total' : 'Stock'}
                            </th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">WhatsApp</th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Precio Pub.</th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center w-48">Acciones</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${this._renderFilas(datos, estado, renderSwitch, getColor, esTodas)}
                    </tbody>
                </table>
            </div>
            ${renderPag(datos.length)}
        </div>`;
    },

    _renderFilas(datos, estado, renderSwitch, getColor, esTodas) {
        if (datos.length === 0) {
            return `
            <tr>
                <td colspan="7" class="px-6 py-16 text-center">
                    <div class="flex flex-col items-center gap-3 text-slate-400">
                        <span class="material-symbols-outlined text-[48px] opacity-30">inventory_2</span>
                        <p class="text-sm font-bold uppercase tracking-wide">Sin productos que mostrar</p>
                        <p class="text-xs">Prueba cambiando los filtros activos</p>
                    </div>
                </td>
            </tr>`;
        }

        const inicio = (estado.paginaActual - 1) * estado.filasPorPagina;
        const paged = datos.slice(inicio, inicio + estado.filasPorPagina);

        return paged.map((p, i) => {
            const dataEnc = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
            const nombreMostrarCat = p.categoria_padre_nombre || 'General';
            const colorCat = getColor(nombreMostrarCat);
            const stockValor = parseInt(p.stock) || 0;

            // ── Precio ──
            // Modo "todas": muestra rango si hay diferencia entre sedes (ej: "65 – 80")
            // Modo sucursal: precio simple
            const precioTexto = esTodas && p.precio_rango && p.precio_rango !== String(p.precio)
                ? `<span class="text-xs font-black text-slate-700">${p.precio_rango}</span>
                   <span class="block text-[9px] text-slate-400 font-bold mt-0.5">rango por sucursal</span>`
                : `<span class="text-sm font-black text-slate-700">Bs. ${p.precio}</span>`;

            // ── Stock ──
            // Modo "todas": suma total + cantidad de sedes
            // Modo sucursal: badge simple
            const stockCelda = esTodas
                ? `<div class="flex flex-col items-center gap-1">
                       ${TableWidgets.badge(stockValor, 'UDS')}
                       <span class="text-[9px] text-slate-400 font-bold">
                           ${p.total_sucursales || 1} sucursales${(p.total_sucursales || 1) !== 1 ? 's' : ''}
                       </span>
                   </div>`
                : TableWidgets.badge(stockValor, 'UDS');

            return `
            <tr class="hover:bg-blue-50/40 transition-colors group">

                <td class="px-6 py-5 text-center text-xs font-bold text-slate-400">
                    ${inicio + i + 1}
                </td>

                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        <div class="h-11 w-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center border border-slate-100 shadow-sm">
                            ${p.imagen_url
                    ? `<img src="${p.imagen_url}" class="h-full w-full object-cover">`
                    : `<span class="material-symbols-outlined text-slate-300 text-base">hide_image</span>`
                }
                        </div>
                        <div class="flex flex-col text-left">
                            <span class="text-slate-800 font-bold uppercase text-[12px] tracking-wide mb-1 leading-none">
                                ${p.nombre}
                            </span>
                            <span title="Ruta: ${p.nombre_categoria || 'General'}"
                                  class="px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit ${colorCat} cursor-help">
                                ${nombreMostrarCat}
                            </span>
                        </div>
                    </div>
                </td>

                <td class="px-6 py-5 text-center">
                    ${precioTexto}
                </td>

                <td class="px-6 py-5 text-center">
                    ${stockCelda}
                </td>

                <td class="px-6 py-5 text-center">
                    ${renderSwitch(p.id, 'habilitar_whatsapp', p.habilitar_whatsapp, 'emerald', false, p.nombre)}
                </td>

                <td class="px-6 py-5 text-center">
                    ${renderSwitch(p.id, 'mostrar_precio', p.mostrar_precio, 'blue', false, p.nombre)}
                </td>

                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center gap-2">
                        ${ActionButtons.render(p.id, 'edit', 'Editar', 'blue', 'productoController.mostrarFormularioEditar')}
                        ${ActionButtons.render(p.id, 'visibility', 'Ver detalle', 'indigo', 'productoController.verDetalle')}
                        ${ActionButtons.render(dataEnc, 'delete', 'Eliminar', 'red', 'productoView.confirmarEliminacion')}
                    </div>
                </td>

            </tr>`;
        }).join('');
    },

    renderSkeletonFilas(cantidad = 10) {
        const fila = () => `
        <tr class="animate-pulse">
            <td class="px-6 py-5 text-center">
                <div class="h-3 w-6 bg-slate-200 rounded-full mx-auto"></div>
            </td>
            <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                    <div class="h-11 w-11 rounded-xl bg-slate-200 flex-shrink-0"></div>
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="h-3 bg-slate-200 rounded-full w-3/4"></div>
                        <div class="h-2 bg-slate-100 rounded-full w-1/3"></div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-5 text-center">
                <div class="h-3 w-14 bg-slate-200 rounded-full mx-auto"></div>
            </td>
            <td class="px-6 py-5 text-center">
                <div class="h-6 w-16 bg-slate-200 rounded-lg mx-auto"></div>
            </td>
            <td class="px-6 py-5 text-center">
                <div class="h-5 w-9 bg-slate-200 rounded-full mx-auto"></div>
            </td>
            <td class="px-6 py-5 text-center">
                <div class="h-5 w-9 bg-slate-200 rounded-full mx-auto"></div>
            </td>
            <td class="px-6 py-5 text-center">
                <div class="flex justify-center gap-2">
                    <div class="h-9 w-9 bg-slate-200 rounded-xl"></div>
                    <div class="h-9 w-9 bg-slate-200 rounded-xl"></div>
                    <div class="h-9 w-9 bg-slate-200 rounded-xl"></div>
                </div>
            </td>
        </tr>`;

        return Array.from({ length: cantidad }, fila).join('');
    }
};