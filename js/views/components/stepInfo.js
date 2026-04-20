/**
 * stepInfo.js
 * Paso 1 del formulario de producto
 */

export const stepInfo = {
    render(d) {
        return `
        <div class="space-y-6">
            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Código de Barras (13 dígitos)</label>
                <input type="text" inputmode="numeric" maxlength="13"
                       value="${d.codigo || ''}"
                       oninput="window.productManager.sincronizarCodigo(this)"
                       class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 font-mono font-semibold tracking-widest outline-none focus:border-blue-600 transition-colors"
                       placeholder="0000000000000">
            </div>
            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Nombre del Producto</label>
                <input type="text" value="${d.nombre}"
                       oninput="window.productManager.sync(this, 'nombre')"
                       class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 font-semibold outline-none focus:border-blue-600 transition-colors">
            </div>
            <div class="space-y-2">
                <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Descripción</label>
                <textarea oninput="window.productManager.sync(this, 'descripcion')"
                          class="w-full bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4 h-44 resize-none font-semibold outline-none focus:border-blue-600 transition-colors">${d.descripcion}</textarea>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase text-slate-400 ml-4">Mostrar Precio</label>
                    <div class="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4">
                        <input type="checkbox" id="chk-price-visible" ${d.price_visible ? 'checked' : ''}
                               onchange="window.productManager.sync(this, 'price_visible', 'checkbox')"
                               class="w-4 h-4 accent-blue-600">
                        <label for="chk-price-visible" class="text-sm font-bold text-slate-600 cursor-pointer">Visible al público</label>
                    </div>
                </div>
                <div class="space-y-2">
                    <label class="text-[10px] font-black uppercase text-slate-400 ml-4">WhatsApp</label>
                    <div class="flex items-center gap-3 bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-4">
                        <input type="checkbox" id="chk-ws" ${d.ws_active ? 'checked' : ''}
                               onchange="window.productManager.sync(this, 'ws_active', 'checkbox')"
                               class="w-4 h-4 accent-emerald-500">
                        <label for="chk-ws" class="text-sm font-bold text-slate-600 cursor-pointer">Botón activo</label>
                    </div>
                </div>
            </div>
        </div>`;
    }
};