
export const descuentoView = {

    // ─────────────────────────────────────────────
    // TABLA PRINCIPAL
    // ─────────────────────────────────────────────
    mostrarTabla(descuentos = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        contenedor.innerHTML = this._renderTabla(descuentos);
        this._bindBuscador(descuentos);
    },

    _renderTabla(descuentos) {
        return `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">sell</span>
                        Gestión
                    </p>
                    <h1 class="text-xl font-black text-slate-800">Descuentos</h1>
                </div>
                <div class="flex items-center gap-3">
                    <!-- Buscador -->
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                                     text-slate-400 text-[18px]">search</span>
                        <input id="desc-buscador" type="text" placeholder="Buscar descuento..."
                               class="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm
                                      outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                      transition-all font-medium text-slate-700 w-64">
                        <button id="desc-btn-limpiar"
                                class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6
                                       flex items-center justify-center text-slate-400
                                       hover:text-slate-600 transition-all hidden">
                            <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                    <!-- Nuevo -->
                    <button onclick="descuentoController.mostrarFormularioCrear()"
                            class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700
                                   text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                                   transition-all shadow-md shadow-blue-200 active:scale-95">
                        <span class="material-symbols-outlined text-base">add</span>
                        Nuevo Descuento
                    </button>
                </div>
            </div>

            <!-- Estadísticas rápidas -->
            <div class="flex gap-4 px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0">
                ${this._renderStatCard('sell', 'Total', descuentos.length, 'text-slate-600', 'bg-slate-50')}
                ${this._renderStatCard('check_circle', 'Activos', descuentos.filter(d => this._calcularEstado(d) === 'activo').length, 'text-emerald-600', 'bg-emerald-50')}
                ${this._renderStatCard('schedule', 'Programados', descuentos.filter(d => this._calcularEstado(d) === 'programado').length, 'text-amber-600', 'bg-amber-50')}
                ${this._renderStatCard('cancel', 'Finalizados', descuentos.filter(d => this._calcularEstado(d) === 'finalizado').length, 'text-slate-400', 'bg-slate-50')}
            </div>

            <!-- Tabla -->
            <div class="flex-1 overflow-auto px-6 py-4">
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-slate-100 bg-slate-50">
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descuento</th>
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alcance</th>
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigencia</th>
                                <th class="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th class="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="desc-tbody">
                            ${descuentos.length === 0
                ? this._renderVacio()
                : descuentos.map(d => this._renderFila(d)).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>`;
    },

    _renderStatCard(icon, label, value, textColor, bgColor) {
        return `
        <div class="flex items-center gap-2.5 px-4 py-2 ${bgColor} rounded-xl border border-slate-100">
            <span class="material-symbols-outlined ${textColor} text-[16px]">${icon}</span>
            <div>
                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">${label}</p>
                <p class="text-lg font-black ${textColor} leading-none">${value}</p>
            </div>
        </div>`;
    },

    _renderFila(d) {
        const estado = this._calcularEstado(d);
        const badgeEst = this._badgeEstado(estado);
        const badgeTipo = d.tipo === 'porcentaje'
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100
                           text-blue-700 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">percent</span> %
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100
                           text-amber-700 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">payments</span> Bs
               </span>`;

        const valorFmt = d.tipo === 'porcentaje'
            ? `<span class="text-base font-black text-blue-600">-${parseFloat(d.valor)}%</span>`
            : `<span class="text-base font-black text-amber-600">-Bs ${parseFloat(d.valor).toFixed(2)}</span>`;

        const alcanceBadge = d.alcance === 'global'
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200
                           text-slate-600 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">public</span> Global
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100
                           text-violet-700 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">store</span>
                   ${d.sucursal?.nombre || 'Sucursal'}
               </span>`;

        const fi = d.fecha_inicio ? new Date(d.fecha_inicio).toLocaleDateString('es-BO') : '—';
        const ff = d.fecha_fin ? new Date(d.fecha_fin).toLocaleDateString('es-BO') : '—';

        return `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-all group" data-id="${d.id}">
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span class="material-symbols-outlined text-blue-600 text-[18px]">sell</span>
                    </div>
                    <div>
                        <p class="font-black text-slate-800 text-sm">${d.nombre}</p>
                        ${d.descripcion
                ? `<p class="text-[10px] text-slate-400 truncate max-w-[200px]">${d.descripcion}</p>`
                : ''}
                    </div>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                    ${valorFmt}
                    ${badgeTipo}
                </div>
            </td>
            <td class="px-4 py-3">${alcanceBadge}</td>
            <td class="px-4 py-3">
                <div class="flex flex-col gap-1">
                    <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span class="material-symbols-outlined text-emerald-500 text-[13px]">event_available</span>
                        ${fi}
                    </div>
                    <div class="flex items-center gap-1.5 text-[11px] text-slate-500">
                        <span class="material-symbols-outlined text-red-400 text-[13px]">event_busy</span>
                        ${ff}
                    </div>
                </div>
            </td>
            <td class="px-4 py-3 text-center">${badgeEst}</td>
            <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                    <!-- Toggle activo -->
                    <button onclick="descuentoController.toggleActivo(${d.id}, ${!d.activo})"
                            title="${d.activo ? 'Desactivar' : 'Activar'}"
                            class="w-8 h-8 flex items-center justify-center rounded-xl transition-all
                                   ${d.activo
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-400'}">
                        <span class="material-symbols-outlined text-[16px]">
                            ${d.activo ? 'toggle_on' : 'toggle_off'}
                        </span>
                    </button>
                    <!-- Editar -->
                    <button onclick="descuentoController.editar(${d.id})"
                            title="Editar"
                            class="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50
                                   hover:bg-blue-100 text-blue-600 transition-all">
                        <span class="material-symbols-outlined text-[16px]">edit</span>
                    </button>
                    <!-- Eliminar -->
                    <button onclick="descuentoController.confirmarEliminacion(${d.id})"
                            title="Eliminar"
                            class="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50
                                   hover:bg-red-100 text-red-500 transition-all">
                        <span class="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                </div>
            </td>
        </tr>`;
    },

    _renderVacio() {
        return `
        <tr>
            <td colspan="6" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                    <span class="material-symbols-outlined text-slate-200 text-[56px]">sell</span>
                    <p class="text-base font-black text-slate-400">Sin descuentos registrados</p>
                    <p class="text-sm text-slate-300">Crea el primer descuento con el botón de arriba</p>
                </div>
            </td>
        </tr>`;
    },

    // ─────────────────────────────────────────────
    // LÓGICA DE ESTADO
    // ─────────────────────────────────────────────
    _calcularEstado(d) {
        if (!d.activo) return 'inactivo';
        const ahora = new Date();
        const fi = d.fecha_inicio ? new Date(d.fecha_inicio) : null;
        const ff = d.fecha_fin ? new Date(d.fecha_fin) : null;
        if (fi && fi > ahora) return 'programado';
        if (ff && ff < ahora) return 'finalizado';
        return 'activo';
    },

    _badgeEstado(estado) {
        const cfg = {
            activo: { icon: 'check_circle', text: 'Activo', bg: 'bg-emerald-50', border: 'border-emerald-100', color: 'text-emerald-700' },
            programado: { icon: 'schedule', text: 'Programado', bg: 'bg-amber-50', border: 'border-amber-100', color: 'text-amber-700' },
            finalizado: { icon: 'event_busy', text: 'Finalizado', bg: 'bg-slate-100', border: 'border-slate-200', color: 'text-slate-500' },
            inactivo: { icon: 'cancel', text: 'Inactivo', bg: 'bg-slate-100', border: 'border-slate-200', color: 'text-slate-400' },
        }[estado] || {};
        return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                     ${cfg.bg} border ${cfg.border} ${cfg.color} text-[10px] font-black uppercase">
            <span class="material-symbols-outlined text-[12px]">${cfg.icon}</span>
            ${cfg.text}
        </span>`;
    },

    // ─────────────────────────────────────────────
    // BUSCADOR
    // ─────────────────────────────────────────────
    _bindBuscador(descuentos) {
        const input = document.getElementById('desc-buscador');
        const btnX = document.getElementById('desc-btn-limpiar');
        const tbody = document.getElementById('desc-tbody');
        if (!input || !tbody) return;

        const filtrar = (q) => {
            const term = q.toLowerCase();
            const filtrados = q
                ? descuentos.filter(d =>
                    d.nombre.toLowerCase().includes(term) ||
                    (d.descripcion || '').toLowerCase().includes(term) ||
                    (d.sucursal?.nombre || '').toLowerCase().includes(term)
                )
                : descuentos;

            tbody.innerHTML = filtrados.length === 0
                ? this._renderVacio()
                : filtrados.map(d => this._renderFila(d)).join('');

            btnX?.classList.toggle('hidden', !q);
        };

        input.addEventListener('input', (e) => filtrar(e.target.value.trim()));
        btnX?.addEventListener('click', () => { input.value = ''; filtrar(''); input.focus(); });
    },

    // ─────────────────────────────────────────────
    // NOTIFICACIONES
    // ─────────────────────────────────────────────
    mostrarCargando(msg = 'Cargando...') {
        Swal.fire({
            title: msg, allowOutsideClick: false, showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-2xl' }
        });
    },

    notificarExito(msg) {
        Swal.fire({
            icon: 'success', title: '<span class="text-slate-800 font-black uppercase text-sm">Listo</span>',
            text: msg, timer: 2000, showConfirmButton: false,
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    notificarError(msg) {
        Swal.fire({
            icon: 'error', title: '<span class="text-red-600 font-black uppercase text-sm">Error</span>',
            text: msg, confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    }
};

window.descuentoView = descuentoView;