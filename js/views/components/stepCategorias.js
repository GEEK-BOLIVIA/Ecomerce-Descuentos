/**
 * stepCategorias.js
 * Paso 2 del formulario de producto
 * Responsabilidad: Renderizar la selección de categorías
 */

export const stepCategorias = {
    render(seleccionadas) {
        return `
        <div class="space-y-6">
            <div class="relative">
                <span class="material-symbols-outlined absolute left-4 top-4 text-slate-400">search</span>
                <input type="text"
                       placeholder="Filtrar subcategorías..."
                       oninput="window.productManager.handleSearch(this)"
                       class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-12 py-4 font-semibold outline-none focus:border-blue-600">
            </div>
            <div class="grid grid-cols-2 gap-6 h-[450px]">
                <div id="nexus-resultados-busqueda"
                     class="overflow-y-auto bg-slate-50 rounded-[2rem] p-5 border-2 border-dashed border-slate-200">
                    <p class="text-center text-slate-400 text-[10px] font-bold mt-10 uppercase">Escribe para buscar</p>
                </div>
                <div class="overflow-y-auto bg-blue-50/30 rounded-[2rem] p-5 border border-blue-100">
                    ${seleccionadas.length === 0
                ? `<p class="text-center text-slate-400 text-[10px] font-bold mt-10 uppercase">Sin categorías seleccionadas</p>`
                : seleccionadas.map(s => `
                            <div class="flex justify-between items-center p-4 bg-white rounded-xl mb-2 shadow-sm border border-blue-100">
                                <span class="text-[11px] font-black text-slate-700 uppercase">${s.nombre}</span>
                                <button onclick="window.productManager.toggleHija(${s.id})"
                                        class="text-red-400 hover:text-red-600 transition-colors">
                                    <span class="material-symbols-outlined text-base">cancel</span>
                                </button>
                            </div>`).join('')
            }
                </div>
            </div>
        </div>`;
    }
};