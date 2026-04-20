/**
 * stepCategorias.js
 * Paso 2 del formulario de producto
 * Lógica portada desde createProduct.js original
 */

export const stepCategorias = {
    render(pm) {
        // pm = referencia a productManager (this)
        const padres = pm._categoriasPadresList || [];
        const hijas = window.categoriasRaw || [];
        const padreSelId = pm._padreSeleccionadoId;
        const seleccionadas = pm._categoriasSeleccionadas;

        const hijasDePadre = padreSelId != null
            ? hijas.filter(h => Number(h.id_padre) === Number(padreSelId))
            : [];

        const svgIcon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E";

        // Badge de categoría seleccionada para preview
        const selObj = seleccionadas.length > 0
            ? (() => {
                const id = seleccionadas[0];
                return hijas.find(h => Number(h.id) === Number(id))
                    || padres.find(p => Number(p.id) === Number(id));
            })()
            : null;

        return `
        <div class="space-y-6">

            <!-- Selector de categoría padre -->
            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Categoría</label>
                <div class="relative">
                    <select
                        style="appearance:none;-webkit-appearance:none;-moz-appearance:none;
                               background-image:url('${svgIcon}');background-repeat:no-repeat;
                               background-position:right 1.25rem center;background-size:1.25rem;padding-right:3rem;"
                        onchange="window.productManager.onCambioPadre(this.value)"
                        class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 font-semibold outline-none focus:border-blue-600 transition-colors cursor-pointer">
                        <option value="">-- Seleccione una categoría --</option>
                        ${padres.map(p => `
                            <option value="${p.id}" ${Number(padreSelId) === Number(p.id) ? 'selected' : ''}>
                                ${pm._htmlEscape(p.nombre)}
                            </option>`).join('')}
                    </select>
                </div>
                <div class="flex gap-2 mt-1">
                    <button type="button"
                            onclick="window.productManager.mostrarFormCrearCategoria()"
                            class="text-[10px] font-black uppercase text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">add_circle</span> Nueva categoría
                    </button>
                </div>
            </div>

            <!-- Subcategorías del padre seleccionado -->
            ${padreSelId != null ? `
            <div class="space-y-2">
                <div class="flex items-center justify-between">
                    <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Subcategoría</label>
                    <button type="button"
                            onclick="window.productManager.mostrarFormCrearSubcategoria()"
                            class="text-[10px] font-black uppercase text-emerald-600 hover:text-emerald-800 transition-colors flex items-center gap-1">
                        <span class="material-symbols-outlined text-sm">add_circle</span> Nueva subcategoría
                    </button>
                </div>

                ${hijasDePadre.length === 0 ? `
                <div class="py-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                    <span class="material-symbols-outlined text-3xl text-slate-300">account_tree</span>
                    <p class="text-[11px] text-slate-400 font-bold mt-1 uppercase">
                        Esta categoría no tiene subcategorías
                    </p>
                    <p class="text-[10px] text-slate-400 mt-1">
                        Se asignará directamente la categoría padre
                    </p>
                </div>` : `
                <div class="grid grid-cols-2 gap-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                    ${hijasDePadre.map(h => {
            const activa = seleccionadas.includes(Number(h.id));
            return `
                        <button type="button"
                                onclick="window.productManager.toggleHija(${h.id})"
                                class="text-left px-4 py-3 rounded-xl border-2 font-semibold text-sm transition-all
                                       ${activa
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300'}">
                            <div class="flex items-center justify-between gap-2">
                                <span class="truncate">${pm._htmlEscape(h.nombre)}</span>
                                ${activa ? `<span class="material-symbols-outlined text-base text-blue-600 shrink-0">check_circle</span>` : ''}
                            </div>
                        </button>`;
        }).join('')}
                </div>`}
            </div>` : ''}

            <!-- Selección actual -->
            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Categoría asignada</label>
                ${selObj ? `
                <div class="flex items-center justify-between px-5 py-3.5 bg-blue-50 border-2 border-blue-200 rounded-2xl">
                    <div class="flex items-center gap-2">
                        <span class="material-symbols-outlined text-blue-600 text-lg">label</span>
                        <span class="text-sm font-black text-blue-800">${pm._htmlEscape(selObj.nombre)}</span>
                    </div>
                    <button type="button"
                            onclick="window.productManager.limpiarCategoriaProducto()"
                            class="text-red-400 hover:text-red-600 transition-colors">
                        <span class="material-symbols-outlined text-base">cancel</span>
                    </button>
                </div>` : `
                <div class="py-6 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50">
                    <p class="text-[11px] text-slate-400 font-bold uppercase">Sin categoría seleccionada</p>
                </div>`}
            </div>

        </div>`;
    }
};