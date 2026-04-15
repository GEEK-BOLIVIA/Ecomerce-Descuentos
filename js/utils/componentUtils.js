export const ActionButtons = {
    render(id, icon, label, color, callback) {
        // Mapeo de colores para asegurar que Tailwind los detecte
        const colores = {
            blue: 'bg-blue-50 text-blue-600 border-blue-100/50 hover:bg-blue-600',
            indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100/50 hover:bg-indigo-600',
            red: 'bg-red-50 text-red-500 border-red-100/50 hover:bg-red-500',
            slate: 'bg-slate-50 text-slate-600 border-slate-100/50 hover:bg-slate-600'
        };

        const clasesColor = colores[color] || colores.slate;

        return `
            <div class="group/tooltip relative flex justify-center">
                <button onclick="${callback}('${id}')" 
                        class="w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm hover:text-white ${clasesColor}">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 250; font-size: 18px;">${icon}</span>
                </button>
                <span class="absolute -top-10 scale-0 transition-all rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-white group-hover/tooltip:scale-100 z-50 whitespace-nowrap shadow-lg pointer-events-none">
                    ${label}
                    <i class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></i>
                </span>
            </div>
        `;
    }
};

export const TableWidgets = {
    badge(text, subtext) {
        return `
            <div class="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200/50 shadow-sm">
                <span class="text-slate-700 font-black text-xs">${text}</span>
                <span class="ml-1 text-[10px] text-slate-400 font-black uppercase tracking-tighter">${subtext}</span>
            </div>
        `;
    }
};