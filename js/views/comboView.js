/**
 * comboView.js
 * Vista principal de tabla de combos con badges de estado, tipo y alcance.
 */

import { ActionButtons } from '../utils/componentUtils.js';

export const comboView = {

    // ─────────────────────────────────────────────
    // TABLA PRINCIPAL
    // ─────────────────────────────────────────────
    mostrarTabla(combos = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        contenedor.innerHTML = this._renderTabla(combos);
        this._bindBuscador(combos);
    },

    _renderTabla(combos) {
        return `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">package_2</span>
                        Gestión
                    </p>
                    <h1 class="text-xl font-black text-slate-800">Combos</h1>
                </div>
                <div class="flex items-center gap-3">
                    <div class="relative">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                        <input id="combo-buscador" type="text" placeholder="Buscar combo..."
                               class="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm
                                      outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                                      transition-all font-medium text-slate-700 w-64">
                        <button id="combo-btn-limpiar"
                                class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6
                                       flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all hidden">
                            <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                    <button onclick="comboController.mostrarFormularioCrear()"
                            class="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600
                                   text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                                   transition-all shadow-md shadow-orange-200 active:scale-95">
                        <span class="material-symbols-outlined text-base">add</span>
                        Nuevo Combo
                    </button>
                </div>
            </div>

            <!-- Estadísticas -->
            <div class="flex gap-4 px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0">
                ${this._renderStatCard('package_2', 'Total', combos.length, 'text-slate-600', 'bg-slate-50')}
                ${this._renderStatCard('check_circle', 'Activos', combos.filter(c => this._calcularEstado(c) === 'activo').length, 'text-emerald-600', 'bg-emerald-50')}
                ${this._renderStatCard('schedule', 'Programados', combos.filter(c => this._calcularEstado(c) === 'programado').length, 'text-amber-600', 'bg-amber-50')}
                ${this._renderStatCard('cancel', 'Finalizados', combos.filter(c => this._calcularEstado(c) === 'finalizado').length, 'text-slate-400', 'bg-slate-50')}
            </div>

            <!-- Tabla -->
            <div class="flex-1 overflow-auto px-6 py-4">
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-slate-100 bg-slate-50">
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Combo</th>
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio / Descuento</th>
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alcance</th>
                                <th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigencia</th>
                                <th class="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th class="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="combo-tbody">
                            ${combos.length === 0
                ? this._renderVacio()
                : combos.map(c => this._renderFila(c)).join('')}
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

    _renderFila(c) {
        const estado = this._calcularEstado(c);
        const badgeEst = this._badgeEstado(estado);
        const esPrecioFijo = c.precio_fijo !== null && c.precio_fijo !== undefined;
        const valorFmt = esPrecioFijo
            ? `<span class="text-base font-black text-orange-600">Bs ${parseFloat(c.precio_fijo).toFixed(2)}</span>`
            : `<span class="text-base font-black text-blue-600">-${parseFloat(c.porcentaje_descuento)}%</span>`;
        const badgeTipo = esPrecioFijo
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-100 text-orange-700 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">payments</span> Precio fijo
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">percent</span> Porcentaje
               </span>`;
        const alcanceBadge = c.alcance === 'global'
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">public</span> Global
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[11px]">store</span>
                   ${c.sucursal?.nombre || 'Sucursal'}
               </span>`;
        const fi = c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString('es-BO') : '—';
        const ff = c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString('es-BO') : '—';

        return `
        <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-all group" data-id="${c.id}">
            <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                    <div class="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-orange-100 flex items-center justify-center">
                        ${c.imagen_url
                ? `<img src="${c.imagen_url}" class="w-full h-full object-cover">`
                : `<span class="material-symbols-outlined text-orange-500 text-[18px]">package_2</span>`}
                    </div>
                    <p class="font-black text-slate-800 text-sm">${c.nombre}</p>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2 flex-wrap">
                    ${valorFmt}
                    ${badgeTipo}
                </div>
            </td>
            <td class="px-4 py-3">${alcanceBadge}</td>
            <td class="px-4 py-3">
                <div class="flex items-center gap-2">
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
                    <button onclick="comboView.abrirModalFecha(${c.id}, '${c.fecha_inicio || ''}', '${c.fecha_fin || ''}')"
                            title="Cambiar fechas"
                            class="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50 border border-amber-100
                                   hover:bg-amber-100 text-amber-500 hover:text-amber-600 transition-all flex-shrink-0">
                        <span class="material-symbols-outlined text-[15px]">edit_calendar</span>
                    </button>
                </div>
            </td>
            <td class="px-4 py-3 text-center">
                <div class="flex flex-col items-center gap-1.5">
                    ${badgeEst}
                    <button onclick="comboController.toggleActivo(${c.id}, ${!c.activo})"
                            title="${c.activo ? 'Desactivar' : 'Activar'}"
                            class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all
                                   ${c.activo
                ? 'bg-emerald-50 hover:bg-red-50 text-emerald-600 hover:text-red-500'
                : 'bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}">
                        <span class="material-symbols-outlined text-[12px]">${c.activo ? 'toggle_on' : 'toggle_off'}</span>
                        ${c.activo ? 'Activo' : 'Inactivo'}
                    </button>
                </div>
            </td>
            <td class="px-4 py-3">
                <div class="flex items-center justify-center gap-1">
                    ${ActionButtons.render(c.id, 'visibility', 'Ver', 'indigo', 'comboController.ver')}
                    ${ActionButtons.render(c.id, 'edit', 'Editar', 'blue', 'comboController.editar')}
                    ${ActionButtons.render(c.id, 'delete', 'Eliminar', 'red', 'comboController.verEliminar')}
                </div>
            </td>
        </tr>`;
    },

    // ─────────────────────────────────────────────
    // MODAL EDICIÓN RÁPIDA DE FECHAS
    // ─────────────────────────────────────────────
    abrirModalFecha(id, fechaInicioISO, fechaFinISO) {
        const toInputVal = (iso) => {
            if (!iso) return '';
            try {
                const d = new Date(iso);
                const pad = n => String(n).padStart(2, '0');
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
            } catch { return ''; }
        };
        Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm flex items-center gap-2">
                        <span class="material-symbols-outlined text-amber-500 text-base">edit_calendar</span>
                        Cambiar Vigencia
                    </span>`,
            html: `
            <div class="flex flex-col gap-4 text-left mt-2">
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <span class="material-symbols-outlined text-emerald-500 text-[13px]">event_available</span>
                        Fecha de inicio
                    </label>
                    <input id="swal-fi" type="datetime-local" value="${toInputVal(fechaInicioISO)}"
                           class="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm
                                  outline-none focus:border-amber-400 transition-all font-medium text-slate-700">
                </div>
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                        <span class="material-symbols-outlined text-red-400 text-[13px]">event_busy</span>
                        Fecha de fin
                    </label>
                    <input id="swal-ff" type="datetime-local" value="${toInputVal(fechaFinISO)}"
                           class="w-full border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm
                                  outline-none focus:border-amber-400 transition-all font-medium text-slate-700">
                </div>
                <p id="swal-fecha-error" class="text-[11px] text-red-500 font-bold hidden">
                    La fecha de fin debe ser posterior a la de inicio.
                </p>
            </div>`,
            showCancelButton: true,
            confirmButtonText: 'Guardar fechas',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#d97706',
            customClass: {
                popup: 'rounded-[28px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-2.5 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-6 py-2.5 font-bold text-sm bg-slate-100 text-slate-500',
            },
            preConfirm: () => {
                const fi = document.getElementById('swal-fi').value;
                const ff = document.getElementById('swal-ff').value;
                const errEl = document.getElementById('swal-fecha-error');
                if (fi && ff && fi >= ff) { errEl.classList.remove('hidden'); return false; }
                errEl.classList.add('hidden');
                const toISO = (val) => {
                    if (!val) return null;
                    const d = new Date(val);
                    const pad = n => String(n).padStart(2, '0');
                    const off = -d.getTimezoneOffset();
                    const sign = off >= 0 ? '+' : '-';
                    const hOff = pad(Math.floor(Math.abs(off) / 60));
                    const mOff = pad(Math.abs(off) % 60);
                    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00${sign}${hOff}:${mOff}`;
                };
                return { fecha_inicio: toISO(fi), fecha_fin: toISO(ff) };
            }
        }).then(({ isConfirmed, value }) => {
            if (isConfirmed && value) {
                comboController.actualizarFechas(id, value.fecha_inicio, value.fecha_fin);
            }
        });
    },

    _renderVacio() {
        return `
        <tr>
            <td colspan="6" class="py-16 text-center">
                <div class="flex flex-col items-center gap-3">
                    <span class="material-symbols-outlined text-slate-200 text-[56px]">package_2</span>
                    <p class="text-base font-black text-slate-400">Sin combos registrados</p>
                    <p class="text-sm text-slate-300">Crea el primer combo con el botón de arriba</p>
                </div>
            </td>
        </tr>`;
    },

    // ─────────────────────────────────────────────
    // LÓGICA DE ESTADO
    // ─────────────────────────────────────────────
    _calcularEstado(c) {
        if (!c.activo) return 'inactivo';
        const ahora = new Date();
        const parseFecha = (iso, esFin = false) => {
            if (!iso) return null;
            if (iso.includes('T') || /\d{4}-\d{2}-\d{2} \d{2}/.test(iso)) return new Date(iso);
            const [y, m, dia] = iso.split('-').map(Number);
            return esFin
                ? new Date(y, m - 1, dia, 23, 59, 59, 999)
                : new Date(y, m - 1, dia, 0, 0, 0, 0);
        };
        const fi = parseFecha(c.fecha_inicio, false);
        const ff = parseFecha(c.fecha_fin, true);
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
    _bindBuscador(combos) {
        const input = document.getElementById('combo-buscador');
        const btnX = document.getElementById('combo-btn-limpiar');
        const tbody = document.getElementById('combo-tbody');
        if (!input || !tbody) return;
        const filtrar = (q) => {
            const term = q.toLowerCase();
            const filtrados = q
                ? combos.filter(c =>
                    c.nombre.toLowerCase().includes(term) ||
                    (c.descripcion || '').toLowerCase().includes(term) ||
                    (c.sucursal?.nombre || '').toLowerCase().includes(term))
                : combos;
            tbody.innerHTML = filtrados.length === 0
                ? this._renderVacio()
                : filtrados.map(c => this._renderFila(c)).join('');
            btnX?.classList.toggle('hidden', !q);
        };
        input.addEventListener('input', (e) => filtrar(e.target.value.trim()));
        btnX?.addEventListener('click', () => { input.value = ''; filtrar(''); input.focus(); });
    },

    // ─────────────────────────────────────────────
    // VISTA DETALLE
    // ─────────────────────────────────────────────
    renderDetalle(contenedor, c, productos) {
        const estado = this._calcularEstado(c);
        const badge = this._badgeEstado(estado);
        const fmt = iso => {
            if (!iso) return '—';
            const dt = new Date(iso);
            const fecha = dt.toLocaleDateString('es-BO');
            const hora = dt.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${fecha} ${hora}`;
        };
        const fi = fmt(c.fecha_inicio);
        const ff = fmt(c.fecha_fin);
        const creado = fmt(c.creado_at);
        const esPrecioFijo = c.precio_fijo !== null && c.precio_fijo !== undefined;
        const valorTxt = esPrecioFijo
            ? `Bs ${parseFloat(c.precio_fijo).toFixed(2)}`
            : `-${parseFloat(c.porcentaje_descuento)}%`;
        const valorColor = esPrecioFijo ? 'text-orange-600' : 'text-blue-600';
        const tipoBg = esPrecioFijo
            ? 'bg-orange-50 border-orange-100 text-orange-700'
            : 'bg-blue-50 border-blue-100 text-blue-700';
        const tipoIcon = esPrecioFijo ? 'payments' : 'percent';
        const tipoTxt = esPrecioFijo ? 'Precio fijo' : 'Porcentaje';

        // Calcular precio total referencial de productos
        const precioTotal = productos.reduce((sum, p) => {
            const precio = p.precios?.[0];
            return sum + (precio ? parseFloat(precio.precio) * (p.cantidad || 1) : 0);
        }, 0);

        const renderTarjetasProductos = () => {
            if (!productos.length) return `
                <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px 0;color:#cbd5e1;">
                    <span class="material-symbols-outlined" style="font-size:48px;">inventory_2</span>
                    <p style="font-size:11px;font-weight:900;text-transform:uppercase;">Sin productos asignados</p>
                </div>`;
            return productos.map(p => {
                const precio = p.precios?.find(pr => c.alcance === 'sucursal' ? pr.id_sucursal == c.id_sucursal : true);
                const precioUni = precio ? `Bs ${parseFloat(precio.precio).toFixed(2)}` : null;
                return `
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <div style="aspect-ratio:1;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                        ${p.imagen
                        ? `<img src="${p.imagen}" style="width:100%;height:100%;object-fit:cover;">`
                        : `<span class="material-symbols-outlined" style="font-size:48px;color:#e2e8f0;">image_not_supported</span>`}
                    </div>
                    <div style="padding:12px;display:flex;flex-direction:column;gap:4px;flex:1;">
                        <p style="font-size:11px;font-weight:900;color:#334155;line-height:1.3;">${p.nombre}</p>
                        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px;">
                            ${precioUni ? `<span style="font-size:10px;font-weight:900;color:#94a3b8;">${precioUni}</span>` : ''}
                            <span class="inline-flex items-center gap-1 bg-orange-50 border border-orange-100 text-orange-600"
                                  style="padding:2px 8px;border-radius:8px;font-size:9px;font-weight:900;">
                                <span class="material-symbols-outlined" style="font-size:10px;">close</span>
                                ${p.cantidad || 1}
                            </span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        };

        contenedor.innerHTML = `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <button id="dv-btn-volver" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de Combo</p>
                        <h1 class="text-lg font-black text-slate-800 leading-tight">${c.nombre}</h1>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${badge}
                    <button id="dv-btn-editar" class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95">
                        <span class="material-symbols-outlined text-base">edit</span>
                        Editar
                    </button>
                </div>
            </div>

            <!-- Contenido -->
            <div class="flex-1 overflow-auto px-6 py-6">
                <div class="max-w-5xl mx-auto flex flex-col gap-5">

                    <!-- Fila superior -->
                    <div class="grid grid-cols-3 gap-5">
                        <div class="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">

                            <!-- Imagen del combo -->
                            ${c.imagen_url ? `
                            <div class="h-40 overflow-hidden flex-shrink-0">
                                <img src="${c.imagen_url}" class="w-full h-full object-cover">
                            </div>` : ''}

                            <div class="p-6 flex flex-col gap-4">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                                        <span class="material-symbols-outlined text-orange-500 text-[24px]">package_2</span>
                                    </div>
                                    <div>
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</p>
                                        <h2 class="text-xl font-black text-slate-800">${c.nombre}</h2>
                                    </div>
                                </div>
                                ${c.descripcion ? `
                                <div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                                    <p class="text-sm text-slate-600">${c.descripcion}</p>
                                </div>` : ''}
                                <div class="grid grid-cols-2 gap-3 pt-1">
                                    <div class="flex flex-col gap-1">
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                            ${esPrecioFijo ? 'Precio del combo' : 'Descuento aplicado'}
                                        </p>
                                        <p class="text-3xl font-black ${valorColor}">${valorTxt}</p>
                                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase w-fit ${tipoBg}">
                                            <span class="material-symbols-outlined text-[11px]">${tipoIcon}</span>${tipoTxt}
                                        </span>
                                        ${esPrecioFijo && precioTotal > 0 ? `
                                        <p class="text-[10px] text-slate-400 mt-1">
                                            Precio referencial: <span class="line-through">Bs ${precioTotal.toFixed(2)}</span>
                                            <span class="text-emerald-600 font-black ml-1">
                                                -${(((precioTotal - parseFloat(c.precio_fijo)) / precioTotal) * 100).toFixed(0)}%
                                            </span>
                                        </p>` : ''}
                                    </div>
                                    <div class="flex flex-col gap-1">
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alcance</p>
                                        ${c.alcance === 'global'
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-black w-fit mt-1">
                                                   <span class="material-symbols-outlined text-[16px]">public</span> Global
                                               </span>
                                               <p class="text-[11px] text-slate-400 mt-1">Aplica en todas las sucursales</p>`
                : `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 text-sm font-black w-fit mt-1">
                                                   <span class="material-symbols-outlined text-[16px]">store</span>
                                                   ${c.sucursal?.nombre || 'Sucursal'}
                                               </span>
                                               <p class="text-[11px] text-slate-400 mt-1">Solo en esta sucursal</p>`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4">
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[12px]">info</span>Estado actual
                                </p>
                                ${badge}
                                <button id="dv-btn-toggle"
                                        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase w-full justify-center transition-all border mt-1
                                               ${c.activo ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}">
                                    <span class="material-symbols-outlined text-[14px]">${c.activo ? 'toggle_off' : 'toggle_on'}</span>
                                    ${c.activo ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[12px]">history</span>Registro
                                </p>
                                <div class="flex items-start gap-2">
                                    <span class="material-symbols-outlined text-slate-300 text-[14px] mt-0.5">schedule</span>
                                    <div>
                                        <p class="font-black text-slate-400 text-[9px] uppercase">Creado</p>
                                        <p class="text-[11px] font-medium text-slate-500">${creado}</p>
                                    </div>
                                </div>
                            </div>
                            <!-- Resumen de productos -->
                            <div class="bg-orange-50 rounded-2xl border border-orange-100 p-5 flex flex-col gap-2">
                                <p class="text-[9px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[12px]">inventory_2</span>Productos
                                </p>
                                <p class="text-2xl font-black text-orange-600">${productos.length}</p>
                                <p class="text-[10px] text-orange-400">
                                    ${productos.reduce((s, p) => s + (p.cantidad || 1), 0)} unidades en total
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Vigencia -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-4">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[14px]">calendar_month</span>Vigencia
                            </p>
                            <button id="dv-btn-fecha" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 text-[10px] font-black uppercase hover:bg-amber-100 transition-all">
                                <span class="material-symbols-outlined text-[14px]">edit_calendar</span>
                                Cambiar fechas
                            </button>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <span class="material-symbols-outlined text-emerald-500 text-[22px]">event_available</span>
                                <div>
                                    <p class="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Inicio</p>
                                    <p class="text-sm font-black text-slate-700 mt-0.5">${fi}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                                <span class="material-symbols-outlined text-red-400 text-[22px]">event_busy</span>
                                <div>
                                    <p class="text-[9px] font-black text-red-500 uppercase tracking-widest">Fin</p>
                                    <p class="text-sm font-black text-slate-700 mt-0.5">${ff}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Productos del combo -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                            <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                            Productos del combo
                            <span class="ml-1 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[9px] font-black">${productos.length}</span>
                        </p>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">
                            ${renderTarjetasProductos()}
                        </div>
                    </div>

                </div>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // VISTA ELIMINAR
    // ─────────────────────────────────────────────
    renderEliminar(contenedor, c, productos) {
        const estado = this._calcularEstado(c);
        const badge = this._badgeEstado(estado);
        const fmt = iso => {
            if (!iso) return '—';
            const dt = new Date(iso);
            const fecha = dt.toLocaleDateString('es-BO');
            const hora = dt.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${fecha} ${hora}`;
        };
        const fi = fmt(c.fecha_inicio);
        const ff = fmt(c.fecha_fin);
        const creado = fmt(c.creado_at);
        const esPrecioFijo = c.precio_fijo !== null && c.precio_fijo !== undefined;
        const valorTxt = esPrecioFijo
            ? `Bs ${parseFloat(c.precio_fijo).toFixed(2)}`
            : `-${parseFloat(c.porcentaje_descuento)}%`;
        const valorColor = esPrecioFijo ? 'text-orange-600' : 'text-blue-600';
        const tipoBg = esPrecioFijo
            ? 'bg-orange-50 border-orange-100 text-orange-700'
            : 'bg-blue-50 border-blue-100 text-blue-700';
        const tipoIcon = esPrecioFijo ? 'payments' : 'percent';
        const tipoTxt = esPrecioFijo ? 'Precio fijo' : 'Porcentaje';

        const tarjetasHtml = productos.map(p =>
            `<div class="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden" style="display:flex;flex-direction:column;opacity:0.7;">
                <div style="aspect-ratio:1;background:#fef2f2;display:flex;align-items:center;justify-content:center;overflow:hidden;">
                    ${p.imagen
                ? `<img src="${p.imagen}" style="width:100%;height:100%;object-fit:cover;opacity:0.5;">`
                : `<span class="material-symbols-outlined" style="font-size:40px;color:#fecaca;">image_not_supported</span>`}
                </div>
                <div style="padding:10px;">
                    <p style="font-size:11px;font-weight:900;color:#334155;">${p.nombre}</p>
                    <p style="font-size:9px;color:#94a3b8;margin-top:2px;">x${p.cantidad || 1}</p>
                </div>
            </div>`
        ).join('');

        contenedor.innerHTML = `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-red-50/30">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-red-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <button id="del-btn-volver" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">warning</span>
                            Eliminar Combo
                        </p>
                        <h1 class="text-lg font-black text-slate-800 leading-tight">${c.nombre}</h1>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    ${badge}
                    <button id="del-btn-eliminar"
                            class="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600
                                   text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                                   transition-all shadow-md shadow-red-200 active:scale-95">
                        <span class="material-symbols-outlined text-base">delete_forever</span>
                        Eliminar
                    </button>
                </div>
            </div>

            <!-- Aviso -->
            <div class="flex-shrink-0 mx-6 mt-5">
                <div class="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <span class="material-symbols-outlined text-red-500 text-[28px] flex-shrink-0">warning</span>
                    <div>
                        <p class="text-sm font-black text-red-700">Esta acción es irreversible</p>
                        <p class="text-[11px] text-red-500 mt-0.5">Se eliminará el combo junto con todas sus asignaciones de productos.</p>
                    </div>
                </div>
            </div>

            <!-- Contenido -->
            <div class="flex-1 overflow-auto px-6 py-5">
                <div class="max-w-5xl mx-auto flex flex-col gap-5">

                    <div class="grid grid-cols-3 gap-5">
                        <div class="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden opacity-75">
                            ${c.imagen_url ? `<div class="h-32 overflow-hidden"><img src="${c.imagen_url}" class="w-full h-full object-cover opacity-50"></div>` : ''}
                            <div class="p-6 flex flex-col gap-3">
                                <div class="flex items-center gap-3">
                                    <div class="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                        <span class="material-symbols-outlined text-red-400 text-[24px]">package_2</span>
                                    </div>
                                    <div>
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</p>
                                        <h2 class="text-xl font-black text-slate-800">${c.nombre}</h2>
                                    </div>
                                </div>
                                ${c.descripcion ? `<div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                                    <p class="text-sm text-slate-500">${c.descripcion}</p>
                                </div>` : ''}
                                <div class="grid grid-cols-2 gap-3">
                                    <div>
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor</p>
                                        <p class="text-2xl font-black ${valorColor}">${valorTxt}</p>
                                        <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase w-fit ${tipoBg}">
                                            <span class="material-symbols-outlined text-[11px]">${tipoIcon}</span>${tipoTxt}
                                        </span>
                                    </div>
                                    <div>
                                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Alcance</p>
                                        ${c.alcance === 'global'
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-black w-fit">
                                                   <span class="material-symbols-outlined text-[16px]">public</span> Global
                                               </span>`
                : `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 text-sm font-black w-fit">
                                                   <span class="material-symbols-outlined text-[16px]">store</span>${c.sucursal?.nombre || 'Sucursal'}
                                               </span>`}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4">
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 opacity-75">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado</p>
                                ${badge}
                            </div>
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2 opacity-75">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[12px]">history</span>Registro
                                </p>
                                <div class="flex items-start gap-2">
                                    <span class="material-symbols-outlined text-slate-300 text-[13px] mt-0.5">schedule</span>
                                    <div>
                                        <p class="text-[9px] font-black text-slate-400 uppercase">Creado</p>
                                        <p class="text-[11px] font-medium text-slate-500">${creado}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Vigencia -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 opacity-75">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                            <span class="material-symbols-outlined text-[14px]">calendar_month</span>Vigencia
                        </p>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                                <span class="material-symbols-outlined text-emerald-500 text-[22px]">event_available</span>
                                <div>
                                    <p class="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Inicio</p>
                                    <p class="text-sm font-black text-slate-700 mt-0.5">${fi}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3 p-4 bg-red-50 rounded-xl border border-red-100">
                                <span class="material-symbols-outlined text-red-400 text-[22px]">event_busy</span>
                                <div>
                                    <p class="text-[9px] font-black text-red-500 uppercase tracking-widest">Fin</p>
                                    <p class="text-sm font-black text-slate-700 mt-0.5">${ff}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Productos -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 opacity-75">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                            <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                            Productos que se desasignarán
                            <span class="ml-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-500 text-[9px] font-black">${productos.length}</span>
                        </p>
                        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px;">
                            ${tarjetasHtml || `<p class="text-[11px] text-slate-300 font-black uppercase">Sin productos asignados</p>`}
                        </div>
                    </div>

                </div>
            </div>
        </div>`;
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

window.comboView = comboView;