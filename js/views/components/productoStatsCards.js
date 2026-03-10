/**
 * productoStatsCards.js
 * Componente: Tarjetas de estadísticas de inventario
 * Responsabilidad: Solo renderiza las 4 tarjetas de métricas calculadas desde productos reales
 */

export const productoStatsCards = {

    /**
     * Calcula las métricas desde el array de productos
     */
    _calcularStats(productos) {
        const total = productos.length;
        const conStock = productos.filter(p => p.stock > 0).length;
        const bajoStock = productos.filter(p => p.stock > 0 && p.stock <= 5).length;
        const agotados = productos.filter(p => p.stock === 0).length;
        const pct = total > 0 ? Math.round((conStock / total) * 100) : 0;
        return { total, conStock, bajoStock, agotados, pct };
    },

    /**
     * Renderiza una tarjeta individual
     */
    _renderCard({ icon, bgIcon, colorIcon, borderColor, titulo, valor, colorValor, subtexto, colorSub, filtro }) {
        return `
        <div onclick="productoView.gestionarFiltroStock('${filtro}')"
             class="stat-card bg-white border ${borderColor} rounded-[24px] p-5 flex items-center gap-4 shadow-sm cursor-pointer select-none">
            <div class="w-12 h-12 rounded-2xl ${bgIcon} flex items-center justify-center flex-shrink-0">
                <span class="material-symbols-outlined ${colorIcon} text-[26px]">${icon}</span>
            </div>
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">${titulo}</p>
                <p class="text-[28px] font-black ${colorValor} leading-none">${Number(valor).toLocaleString()}</p>
                <p class="text-[10px] ${colorSub} font-bold mt-1.5">${subtexto}</p>
            </div>
        </div>`;
    },

    /**
     * Render principal — devuelve HTML string
     * @param {Array} productos - Array completo de productos del modelo
     */
    render(productos) {
        const s = this._calcularStats(productos);

        const tarjetas = [
            {
                filtro: 'todos',
                icon: 'inventory_2',
                bgIcon: 'bg-blue-50',
                colorIcon: 'text-blue-500',
                borderColor: 'border-slate-100',
                titulo: 'Total Productos',
                valor: s.total,
                colorValor: 'text-slate-800',
                subtexto: 'catálogo completo',
                colorSub: 'text-blue-500',
            },
            {
                filtro: 'con-stock',
                icon: 'check_circle',
                bgIcon: 'bg-emerald-50',
                colorIcon: 'text-emerald-500',
                borderColor: 'border-emerald-100',
                titulo: 'Con Stock',
                valor: s.conStock,
                colorValor: 'text-emerald-600',
                subtexto: `${s.pct}% del catálogo`,
                colorSub: 'text-slate-400',
            },
            {
                filtro: 'bajo-stock',
                icon: 'warning_amber',
                bgIcon: 'bg-amber-50',
                colorIcon: 'text-amber-500',
                borderColor: 'border-amber-100',
                titulo: 'Bajo Stock',
                valor: s.bajoStock,
                colorValor: 'text-amber-600',
                subtexto: '≤ 5 unidades',
                colorSub: 'text-amber-500',
            },
            {
                filtro: 'agotados',
                icon: 'remove_shopping_cart',
                bgIcon: 'bg-red-50',
                colorIcon: 'text-red-500',
                borderColor: 'border-red-100',
                titulo: 'Agotados',
                valor: s.agotados,
                colorValor: 'text-red-600',
                subtexto: 'sin unidades',
                colorSub: 'text-red-400',
            },
        ];

        return `
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            ${tarjetas.map(t => this._renderCard(t)).join('')}
        </div>`;
    }
};