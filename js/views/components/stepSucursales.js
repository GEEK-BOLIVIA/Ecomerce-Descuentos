/**
 * stepSucursales.js
 * Paso 4 del formulario de producto — Rediseñado
 *
 * Flujo:
 * 1. Usuario ingresa precio base y stock base
 * 2. Pulsa "Asignar a sucursales" → abre modal con buscador
 * 3. Selecciona sucursales → se les aplica precio/stock base
 * 4. Tabla compacta para editar individualmente
 * 5. Botón X para quitar una sucursal
 */

export const stepSucursales = {

    render(asignadas, precioBase = '', stockBase = '') {
        return `
        <div class="space-y-6">

            <!-- ── Precio y Stock base ── -->
            <div>
                <p class="text-[10px] font-black uppercase text-slate-400 mb-3">Precio y Stock Base</p>
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="text-[9px] font-black uppercase text-slate-400 ml-1">Precio (Bs)</label>
                        <div class="relative">
                            <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[11px] font-black text-slate-400">Bs.</span>
                            <input type="number"
                                   id="precio-base-input"
                                   value="${precioBase}"
                                   min="0" step="0.01"
                                   placeholder="0.00"
                                   oninput="window.productManager.setPrecioBase(this.value)"
                                   class="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-colors text-right">
                        </div>
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-[9px] font-black uppercase text-slate-400 ml-1">Stock</label>
                        <div class="relative">
                            <input type="number"
                                   id="stock-base-input"
                                   value="${stockBase}"
                                   min="0" step="1"
                                   placeholder="0"
                                   oninput="window.productManager.setStockBase(this.value)"
                                   class="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-blue-500 transition-colors text-center">
                            <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400">UDS</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── Botón asignar ── -->
            <button onclick="window.productManager.abrirModalSucursales()"
                    class="w-full flex items-center justify-center gap-2 py-3.5 border-2 border-dashed border-blue-300 bg-blue-50/50 text-blue-600 rounded-2xl text-[11px] font-black uppercase hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95">
                <span class="material-symbols-outlined text-[18px]">add_business</span>
                Asignar a Sucursales
            </button>

            <!-- ── Tabla de asignadas ── -->
            ${this._renderTabla(asignadas)}

            <!-- ── Resumen ── -->
            ${this._renderResumen(asignadas)}

        </div>`;
    },

    _renderTabla(asignadas) {
        if (asignadas.length === 0) {
            return `
            <div class="py-10 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                <span class="material-symbols-outlined text-4xl text-slate-200">store_mall_directory</span>
                <p class="text-slate-400 text-[10px] font-black uppercase mt-2">Ninguna sucursal asignada</p>
                <p class="text-slate-300 text-[10px] mt-1">Ingresa precio y stock, luego pulsa "Asignar a Sucursales"</p>
            </div>`;
        }

        return `
        <div class="rounded-2xl border border-slate-200 overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead>
                    <tr class="bg-slate-50 border-b border-slate-200">
                        <th class="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Sucursal</th>
                        <th class="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right w-32">Precio (Bs)</th>
                        <th class="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-center w-28">Stock</th>
                        <th class="px-4 py-3 w-10"></th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    ${asignadas.map(s => this._renderFila(s)).join('')}
                </tbody>
            </table>
        </div>`;
    },

    _renderFila(s) {
        return `
        <tr class="hover:bg-slate-50/80 transition-colors group">
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                    <span class="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
                    <span class="text-[11px] font-black text-slate-700 uppercase">${s.nombre}</span>
                </div>
            </td>
            <td class="px-4 py-2.5">
                <div class="flex justify-end">
                    <input type="number"
                           value="${s.precio ?? ''}"
                           data-suc-id="${s.id}"
                           data-suc-campo="precio"
                           min="0" step="0.01"
                           placeholder="0.00"
                           oninput="window.productManager.actualizarSucursal(${s.id}, 'precio', this.value)"
                           class="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-right outline-none focus:border-blue-500 transition-colors">
                </div>
            </td>
            <td class="px-4 py-2.5">
                <div class="flex justify-center">
                    <input type="number"
                           value="${s.stock ?? ''}"
                           min="0" step="1"
                           data-suc-id="${s.id}"
                           data-suc-campo="stock"
                           placeholder="0"
                           oninput="window.productManager.actualizarSucursal(${s.id}, 'stock', this.value)"
                           class="w-20 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-bold text-center outline-none focus:border-blue-500 transition-colors">
                </div>
            </td>
            <td class="px-4 py-2.5 text-center">
                <button onclick="window.productManager.quitarSucursal(${s.id})"
                        title="Quitar sucursal"
                        class="w-7 h-7 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 mx-auto">
                    <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
            </td>
        </tr>`;
    },

    _renderResumen(asignadas) {
        if (asignadas.length === 0) return '';
        const stockTotal = asignadas.reduce((acc, s) => acc + (parseInt(s.stock) || 0), 0);
        return `
        <div class="flex items-center gap-4 bg-slate-50 rounded-2xl border border-slate-100 px-4 py-3">
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-blue-500"></span>
                <span class="text-[10px] font-black text-slate-600">
                    ${asignadas.length} sede${asignadas.length !== 1 ? 's' : ''} asignada${asignadas.length !== 1 ? 's' : ''}
                </span>
            </div>
            <div class="w-px h-4 bg-slate-200"></div>
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-[14px] text-emerald-500">inventory_2</span>
                <span class="text-[10px] font-black text-slate-600">Stock total: ${stockTotal} UDS</span>
            </div>
        </div>`;
    },

    /**
     * Modal de selección con buscador
     * @param {Array}  todasLasSucursales
     * @param {Array}  idsYaAsignadas
     * @returns {Promise<Array|null>}  IDs confirmados, o null si canceló
     */
    async abrirModal(todasLasSucursales, idsYaAsignadas = []) {
        let seleccionados = [...idsYaAsignadas];

        const generarLista = (filtro = '') => {
            const coincidencias = todasLasSucursales.filter(s =>
                s.nombre.toLowerCase().includes(filtro.toLowerCase())
            );

            if (coincidencias.length === 0) {
                return `<p class="text-center text-slate-400 text-[10px] font-bold py-8 uppercase">Sin resultados</p>`;
            }

            return coincidencias.map(s => {
                const activa = seleccionados.includes(s.id);
                return `
                <div onclick="window.__toggleSucModal(${s.id})"
                     id="suc-item-${s.id}"
                     class="flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all mb-2
                            ${activa ? 'border-blue-500 bg-blue-50' : 'border-slate-100 bg-white hover:border-slate-300'}">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${activa ? 'bg-blue-600' : 'bg-slate-100'}">
                            <span class="material-symbols-outlined text-[16px] ${activa ? 'text-white' : 'text-slate-400'}">
                                ${activa ? 'check' : 'storefront'}
                            </span>
                        </div>
                        <span class="text-[11px] font-black text-slate-700 uppercase">${s.nombre}</span>
                    </div>
                    ${activa ? `<span class="text-[9px] font-black text-blue-600 uppercase bg-blue-100 px-2 py-1 rounded-full">Asignada</span>` : ''}
                </div>`;
            }).join('');
        };

        window.__toggleSucModal = (id) => {
            seleccionados = seleccionados.includes(id)
                ? seleccionados.filter(i => i !== id)
                : [...seleccionados, id];

            const lista = document.getElementById('suc-modal-lista');
            if (lista) lista.innerHTML = generarLista(
                document.getElementById('suc-modal-search')?.value || ''
            );

            const contador = document.getElementById('suc-modal-contador');
            if (contador) {
                contador.textContent = `${seleccionados.length} seleccionada${seleccionados.length !== 1 ? 's' : ''}`;
            }
        };

        window.__generarListaSuc = generarLista;

        const result = await Swal.fire({
            title: '<span class="text-sm font-black uppercase text-slate-800">Asignar Sucursales</span>',
            width: '520px',
            html: `
            <div class="space-y-3 text-left">
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                    <input type="text"
                           id="suc-modal-search"
                           placeholder="Buscar sucursal..."
                           oninput="document.getElementById('suc-modal-lista').innerHTML = window.__generarListaSuc(this.value)"
                           class="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:border-blue-500 transition-colors">
                </div>
                <p id="suc-modal-contador" class="text-[10px] font-black text-slate-400 uppercase px-1">
                    ${idsYaAsignadas.length} seleccionada${idsYaAsignadas.length !== 1 ? 's' : ''}
                </p>
                <div id="suc-modal-lista" class="max-h-72 overflow-y-auto pr-1 custom-scrollbar">
                    ${generarLista()}
                </div>
            </div>`,
            showCancelButton: true,
            confirmButtonText: 'Confirmar Selección',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-3 text-xs font-black uppercase',
                cancelButton: 'rounded-xl px-6 py-3 text-xs font-black uppercase'
            },
            willClose: () => {
                delete window.__toggleSucModal;
                delete window.__generarListaSuc;
            }
        });

        return result.isConfirmed ? seleccionados : null;
    }
};