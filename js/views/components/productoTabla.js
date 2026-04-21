import { ActionButtons, TableWidgets } from '../../utils/componentUtils.js';
import { selectorUtil } from '../../utils/selectorUtil.js';

export const productoTabla = {

    render(datos, estado, columnasVisibles, renderSwitch, renderPag, getColor) {
        const cols = columnasVisibles.length > 0 ? columnasVisibles :
            ['nro', 'imagen', 'nombre_producto', 'categoria', 'codigo', 'precio', 'stock', 'whatsapp', 'precio_pub', 'acciones'];

        const esTodas = estado.sucursalSeleccionada === 'todas';
        const numSeleccionados = selectorUtil.estado.seleccionados.length;
        const mostrarBarra = numSeleccionados > 0;

        return `
        <div class="bg-white border border-slate-200 rounded-[32px] shadow-sm overflow-hidden mb-8 relative">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/80">
                            ${cols.includes('nro') ? `
                            <th class="px-6 py-5 w-10 text-center">
                                <input type="checkbox" id="checkbox-header" 
                                       onclick="productoView.toggleLoteTodos()" 
                                       ${this._todosSeleccionados(datos, estado) ? 'checked' : ''}
                                       class="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4">
                            </th>
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase w-20 text-center">N°</th>
                            ` : ''}
                            ${(cols.includes('imagen') || cols.includes('nombre_producto') || cols.includes('categoria')) ? `
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase">Producto / Categoría</th>
                            ` : ''}
                            ${cols.includes('codigo') ? `
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Código</th>
                            ` : ''}
                            ${cols.includes('precio') ? `
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">
                                ${esTodas ? 'Precio (Bs)' : 'Precio'}
                            </th>
                            ` : ''}
                            ${cols.includes('stock') ? `
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">
                                ${esTodas ? 'Stock Total' : 'Stock'}
                            </th>
                            ` : ''}
                            ${cols.includes('whatsapp') ? `
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">WhatsApp</th>
                            ` : ''}
                            ${cols.includes('precio_pub') ? `
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center">Precio Pub.</th>
                            ` : ''}
                            ${cols.includes('acciones') ? `
                            <th class="px-6 py-5 text-[10px] font-black text-slate-400 uppercase text-center w-48">Acciones</th>
                            ` : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${this._renderFilas(datos, estado, cols, renderSwitch, getColor, esTodas)}
                    </tbody>
                </table>
            </div>
            ${renderPag(datos.length)}
        </div>

        <div id="bulk-actions-bar" 
             class="fixed bottom-10 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-full border border-slate-200 p-1.5 flex items-center gap-1 z-[100] transition-all duration-500 transform ${mostrarBarra ? 'translate-y-0 opacity-100' : 'translate-y-28 opacity-0 pointer-events-none'}">
            
            <div class="flex items-center gap-3 px-4 py-2 bg-blue-600 rounded-full text-white shadow-lg shadow-blue-200">
                <span class="material-symbols-outlined text-sm">checklist</span>
                <div class="flex flex-col leading-none">
                    <span class="text-[9px] uppercase font-black opacity-70">Seleccionados</span>
                    <span class="text-xs font-bold">${numSeleccionados} ítems</span>
                </div>
            </div>
            
            <div class="h-8 w-[1px] bg-slate-200 mx-2"></div>

            <button onclick="productoController.toggleMasivoFiltrado('ws_active', true, selectorUtil.estado.seleccionados)" 
                    class="group flex items-center gap-2 px-4 py-2 hover:bg-emerald-50 text-emerald-700 rounded-full transition-all duration-200">
                <i class="fa-brands fa-whatsapp text-lg group-hover:scale-110 transition-transform"></i>
                <span class="text-[11px] font-black uppercase tracking-tight">Activar WS</span>
            </button>
            
            <button onclick="productoController.toggleMasivoFiltrado('ws_active', false, selectorUtil.estado.seleccionados)" 
                    class="group flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-full transition-all duration-200">
                <i class="fa-brands fa-whatsapp text-lg opacity-40 group-hover:scale-110 transition-transform"></i>
                <span class="text-[11px] font-black uppercase tracking-tight">Desactivar WS</span>
            </button>

            <button onclick="productoController.toggleMasivoFiltrado('price_visible', true, selectorUtil.estado.seleccionados)" 
                    class="group flex items-center gap-2 px-4 py-2 hover:bg-blue-50 text-blue-700 rounded-full transition-all duration-200">
                <span class="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">payments</span>
                <span class="text-[11px] font-black uppercase tracking-tight">Mostrar Precio</span>
            </button>

            <button onclick="productoController.toggleMasivoFiltrado('price_visible', false, selectorUtil.estado.seleccionados)" 
                    class="group flex items-center gap-2 px-4 py-2 hover:bg-slate-50 text-slate-600 rounded-full transition-all duration-200">
                <span class="material-symbols-outlined text-lg group-hover:scale-110 transition-transform">visibility_off</span>
                <span class="text-[11px] font-black uppercase tracking-tight">Ocultar Precio</span>
            </button>

            <div class="h-8 w-[1px] bg-slate-200 mx-2"></div>

            <button onclick="productoView.confirmarEliminacionMasiva(selectorUtil.estado.seleccionados)" 
                    class="group flex items-center gap-2 px-5 py-2 hover:bg-red-50 text-red-600 rounded-full transition-all duration-200">
                <span class="material-symbols-outlined text-lg group-hover:animate-bounce">delete_sweep</span>
                <span class="text-[11px] font-black uppercase tracking-tight">Eliminar</span>
            </button>

            <button onclick="productoView.limpiarSeleccionLote()" 
                    class="ml-1 p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
                <span class="material-symbols-outlined text-xl">close</span>
            </button>
        </div>`;
    },

    _renderFilas(datos, estado, cols, renderSwitch, getColor, esTodas) {
        if (datos.length === 0) {
            return `<tr><td colspan="15" class="px-6 py-16 text-center">
                <div class="flex flex-col items-center gap-3 text-slate-400">
                    <span class="material-symbols-outlined text-[48px] opacity-30">inventory_2</span>
                    <p class="text-sm font-bold uppercase tracking-wide">Sin productos</p>
                </div>
            </td></tr>`;
        }

        const inicio = (estado.paginaActual - 1) * estado.filasPorPagina;
        const paged = datos.slice(inicio, inicio + estado.filasPorPagina);

        return paged.map((p, i) => {
            const idStr = String(p.id);
            const estaSeleccionado = selectorUtil.estado.seleccionados.includes(idStr);
            const dataEnc = btoa(unescape(encodeURIComponent(JSON.stringify(p))));
            const nombreCat = p.categoria_padre_nombre || 'General';
            const colorCat = getColor(nombreCat);
            const stockValor = parseInt(p.stock) || 0;
            const codigoValor = p.codigo || '---';
            const esRangoReal = p.precio_rango && p.precio_rango !== String(p.precio);

            const precioTexto = esTodas
                ? `<div class="flex flex-col items-center">
                    <span class="text-sm font-black text-slate-700">Bs. ${esRangoReal ? p.precio_rango : p.precio}</span>
                    <span class="block text-[9px] text-slate-400 font-bold mt-0.5 uppercase tracking-wider">
                        ${esRangoReal ? 'Rango' : 'Único'}
                    </span>
                   </div>`
                : `<span class="text-sm font-black text-slate-700">Bs. ${p.precio}</span>`;

            const stockCelda = esTodas
                ? `<div class="flex flex-col items-center gap-1">
                    ${TableWidgets.badge(stockValor, 'UDS')}
                    <span class="text-[9px] text-slate-400 font-bold">
                        ${p.total_sucursales || 1} sucursal${(p.total_sucursales || 1) !== 1 ? 'es' : ''}
                    </span>
                   </div>`
                : TableWidgets.badge(stockValor, 'UDS');

            return `
            <tr class="hover:bg-blue-50/40 transition-colors group ${estaSeleccionado ? 'bg-blue-50/70' : ''}">
                ${cols.includes('nro') ? `
                <td class="px-6 py-5 text-center">
                    <input type="checkbox" class="fila-checkbox rounded border-slate-300 text-blue-600 cursor-pointer w-4 h-4" 
                           data-id="${idStr}" onclick="productoView.toggleLote('${idStr}')" ${estaSeleccionado ? 'checked' : ''}>
                </td>
                <td class="px-6 py-5 text-center text-xs font-bold text-slate-400">${inicio + i + 1}</td>
                ` : ''}
                ${(cols.includes('imagen') || cols.includes('nombre_producto') || cols.includes('categoria')) ? `
                <td class="px-6 py-5">
                    <div class="flex items-center gap-3">
                        ${cols.includes('imagen') ? `
                        <div class="h-11 w-11 rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center border border-slate-100 shadow-sm">
                            ${p.imagen_url ? `<img src="${p.imagen_url}" class="h-full w-full object-cover">`
                            : `<span class="material-symbols-outlined text-slate-300 text-base">hide_image</span>`}
                        </div>
                        ` : ''}
                        <div class="flex flex-col text-left">
                            ${cols.includes('nombre_producto') ? `
                            <span class="text-slate-800 font-bold uppercase text-[12px] tracking-wide mb-1 leading-none">${p.nombre}</span>
                            ` : ''}
                            ${cols.includes('categoria') ? `
                            <span class="px-2 py-0.5 rounded text-[9px] font-black uppercase w-fit ${colorCat}">${nombreCat}</span>
                            ` : ''}
                        </div>
                    </div>
                </td>
                ` : ''}
                ${cols.includes('codigo') ? `
                <td class="px-6 py-5 text-center">
                    <span class="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200/50">${codigoValor}</span>
                </td>
                ` : ''}
                ${cols.includes('precio') ? `<td class="px-6 py-5 text-center">${precioTexto}</td>` : ''}
                ${cols.includes('stock') ? `<td class="px-6 py-5 text-center">${stockCelda}</td>` : ''}
                ${cols.includes('whatsapp') ? `
                <td class="px-6 py-5 text-center">
                    <div class="flex justify-center">
                        ${renderSwitch(p.id, 'habilitar_whatsapp', p.habilitar_whatsapp, 'emerald', false, p.nombre)}
                    </div>
                </td>
                ` : ''}
                ${cols.includes('precio_pub') ? `
                <td class="px-6 py-5 text-center">
                    ${renderSwitch(p.id, 'mostrar_precio', p.mostrar_precio, 'blue', false, p.nombre)}
                </td>
                ` : ''}
                ${cols.includes('acciones') ? `
                <td class="px-6 py-4 text-center">
                    <div class="flex justify-center gap-2">
                        ${ActionButtons.render(p.id, 'edit', 'Editar', 'blue', 'productoController.mostrarFormularioEditar')}
                        ${ActionButtons.render(p.id, 'visibility', 'Ver', 'indigo', 'productoController.verDetalle')}
                        ${ActionButtons.render(dataEnc, 'delete', 'Eliminar', 'red', 'productoView.confirmarEliminacion')}
                    </div>
                </td>
                ` : ''}
            </tr>`;
        }).join('');
    },

    _todosSeleccionados(datos, estado) {
        if (datos.length === 0) return false;
        const inicio = (estado.paginaActual - 1) * estado.filasPorPagina;
        const paged = datos.slice(inicio, inicio + estado.filasPorPagina);
        return paged.every(p => selectorUtil.estado.seleccionados.includes(String(p.id)));
    },

    renderSkeletonFilas(cantidad = 10) {
        const fila = () => `
        <tr class="animate-pulse">
            <td class="px-6 py-5 text-center"><div class="h-4 w-4 bg-slate-200 rounded mx-auto"></div></td>
            <td class="px-6 py-5 text-center"><div class="h-3 w-6 bg-slate-200 rounded-full mx-auto"></div></td>
            <td class="px-6 py-5">
                <div class="flex items-center gap-3">
                    <div class="h-11 w-11 rounded-xl bg-slate-200 flex-shrink-0"></div>
                    <div class="flex flex-col gap-2 flex-1">
                        <div class="h-3 bg-slate-200 rounded-full w-3/4"></div>
                        <div class="h-2 bg-slate-100 rounded-full w-1/3"></div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-5 text-center"><div class="h-4 w-16 bg-slate-100 rounded-md mx-auto"></div></td>
            <td class="px-6 py-5 text-center"><div class="h-3 w-14 bg-slate-200 rounded-full mx-auto"></div></td>
            <td class="px-6 py-5 text-center"><div class="h-6 w-16 bg-slate-200 rounded-lg mx-auto"></div></td>
            <td class="px-6 py-5 text-center"><div class="h-5 w-9 bg-slate-200 rounded-full mx-auto"></div></td>
            <td class="px-6 py-5 text-center"><div class="h-5 w-9 bg-slate-200 rounded-full mx-auto"></div></td>
            <td class="px-6 py-5 text-center">
                <div class="flex justify-center gap-2">
                    <div class="h-9 w-9 bg-slate-200 rounded-xl"></div>
                    <div class="h-9 w-9 bg-slate-200 rounded-xl"></div>
                </div>
            </td>
        </tr>`;
        return Array.from({ length: cantidad }, fila).join('');
    }
};