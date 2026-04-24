/**
 * descuentoView.js
 */

import { ActionButtons } from '../utils/componentUtils.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const descuentoView = {

    // ─────────────────────────────────────────────
    // SELECCIÓN POR LOTE
    // ─────────────────────────────────────────────

    toggleLote(id) {
        selectorUtil.toggle(id, (cant) => this._actualizarBarraFlotante(cant));
        const fila = document.querySelector(`input.fila-checkbox-desc[data-id="${id}"]`)?.closest('tr');
        if (fila) fila.classList.toggle('bg-blue-50/70', selectorUtil.estado.seleccionados.includes(String(id)));
    },

    toggleLoteTodos(datos) {
        selectorUtil.toggleTodos(datos, (cant) => this._actualizarBarraFlotante(cant));
        const isAllChecked = selectorUtil.estado.seleccionados.length >= datos.length;
        document.querySelectorAll('input.fila-checkbox-desc').forEach(chk => {
            chk.checked = isAllChecked;
            chk.closest('tr')?.classList.toggle('bg-blue-50/70', isAllChecked);
        });
        const master = document.getElementById('check-all-desc');
        if (master) master.checked = isAllChecked;
    },

    limpiarSeleccion() {
        selectorUtil.limpiar((cant) => this._actualizarBarraFlotante(cant));
        window.descuentoController.refrescarVista();
    },

    _renderBarraFlotante() {
        return `
        <div id="bulk-actions-bar-desc"
             class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]
                    translate-y-28 opacity-0 pointer-events-none transition-all duration-500">
            <div class="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-2">
                <div class="flex items-center gap-3 px-4 py-2 border-r border-slate-100 mr-1">
                    <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-200 shadow-lg">
                        <span class="material-symbols-outlined text-white text-xl">sell</span>
                    </div>
                    <div class="flex flex-col">
                        <span id="lote-desc-contador" class="text-[13px] font-bold text-slate-800 leading-none">0 seleccionados</span>
                        <span class="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Acciones masivas</span>
                    </div>
                </div>
                <button onclick="descuentoView.accionLote('activar')"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all duration-300">
                    <span class="material-symbols-outlined text-lg">toggle_on</span>
                    <span class="text-[11px] font-black uppercase">Activar</span>
                </button>
                <button onclick="descuentoView.accionLote('desactivar')"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-800 hover:text-white transition-all duration-300">
                    <span class="material-symbols-outlined text-lg">toggle_off</span>
                    <span class="text-[11px] font-black uppercase">Desactivar</span>
                </button>
                <div class="w-px h-8 bg-slate-100 mx-1"></div>
                <button onclick="descuentoView.accionLote('eliminar')"
                        class="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300">
                    <span class="material-symbols-outlined text-lg">delete_sweep</span>
                    <span class="text-[11px] font-black uppercase">Eliminar</span>
                </button>
                <button onclick="descuentoView.limpiarSeleccion()"
                        class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-200 transition-all ml-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>`;
    },

    _actualizarBarraFlotante(cantidad) {
        const barra = document.getElementById('bulk-actions-bar-desc');
        const contador = document.getElementById('lote-desc-contador');
        if (!barra) return;
        if (cantidad > 0) {
            barra.classList.remove('translate-y-28', 'opacity-0', 'pointer-events-none');
            barra.classList.add('translate-y-0', 'opacity-100');
            if (contador) contador.textContent = `${cantidad} seleccionados`;
        } else {
            barra.classList.add('translate-y-28', 'opacity-0', 'pointer-events-none');
            barra.classList.remove('translate-y-0', 'opacity-100');
        }
    },

    accionLote(accion) {
        const ids = selectorUtil.estado.seleccionados;
        if (ids.length === 0) return;
        if (accion === 'eliminar') {
            Swal.fire({
                title: `<span class="text-red-600 font-black uppercase text-xs">¿ELIMINAR ${ids.length} DESCUENTOS?</span>`,
                html: `<p class="text-sm text-slate-600">Esta acción eliminará los descuentos y sus asignaciones. No se puede deshacer.</p>`,
                icon: 'warning', showCancelButton: true, reverseButtons: true,
                confirmButtonText: 'SÍ, ELIMINAR TODO', cancelButtonText: 'CANCELAR',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-[32px] shadow-2xl', confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase', cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase' }
            }).then(r => { if (r.isConfirmed) window.descuentoController.eliminarMasivo(ids); });
        } else {
            const nuevoEstado = accion === 'activar';
            Swal.fire({
                title: `<span class="text-slate-800 font-black uppercase text-xs">¿${nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR'} ${ids.length} DESCUENTOS?</span>`,
                html: `<p class="text-sm text-slate-600">Se ${nuevoEstado ? 'activarán' : 'desactivarán'} los ${ids.length} descuentos seleccionados.</p>`,
                icon: 'question', showCancelButton: true, reverseButtons: true,
                confirmButtonText: `SÍ, ${nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR'}`, cancelButtonText: 'CANCELAR',
                confirmButtonColor: nuevoEstado ? '#059669' : '#64748b',
                customClass: { popup: 'rounded-[32px] shadow-2xl', confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase', cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase' }
            }).then(r => { if (r.isConfirmed) window.descuentoController.toggleActivoMasivo(ids, nuevoEstado); });
        }
    },

    mostrarTabla(descuentos = [], columnasVisibles = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        const cols = columnasVisibles.length > 0 ? columnasVisibles :
            ['nro', 'nombre', 'valor', 'alcance', 'vigencia', 'estado', 'acciones'];
        window._descuentosPaginados = descuentos;
        contenedor.innerHTML = this._renderTabla(descuentos, cols) + this._renderBarraFlotante();
        this._bindBuscador(descuentos, cols);
        setTimeout(() => {
            selectorUtil.sincronizarChecks();
            this._actualizarBarraFlotante(selectorUtil.estado.seleccionados.length);
        }, 0);
    },

    _renderTabla(descuentos, cols = []) {
        return `
    <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
        <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
            <div>
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[13px]">sell</span>
                    Gestión
                </p>
                <h1 class="text-xl font-black text-slate-800">Descuentos</h1>
            </div>
            <div class="flex items-center gap-3">
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                    <input id="desc-buscador" type="text" placeholder="Buscar descuento..."
                           class="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-sm
                                  outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                  transition-all font-medium text-slate-700 w-64">
                    <button id="desc-btn-limpiar"
                            class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6
                                   flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all hidden">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
                <button onclick="configuracionColumnasController.iniciarFlujoConfiguracion('descuentos', async () => { await descuentoController.inicializar(true); })"
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all shadow-sm font-black text-[10px] uppercase tracking-widest">
                    <span class="material-symbols-outlined text-base">view_column</span>
                    Columnas
                </button>
                <button onclick="descuentoController.mostrarFormularioCrear()"
                        class="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700
                               text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                               transition-all shadow-md shadow-blue-200 active:scale-95">
                    <span class="material-symbols-outlined text-base">add</span>
                    Nuevo Descuento
                </button>
            </div>
        </div>
        <div class="flex gap-4 px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0">
            ${this._renderStatCard('sell', 'Total', descuentos.length, 'text-slate-600', 'bg-slate-50')}
            ${this._renderStatCard('check_circle', 'Activos', descuentos.filter(d => this._calcularEstado(d) === 'activo').length, 'text-emerald-600', 'bg-emerald-50')}
            ${this._renderStatCard('schedule', 'Programados', descuentos.filter(d => this._calcularEstado(d) === 'programado').length, 'text-amber-600', 'bg-amber-50')}
            ${this._renderStatCard('cancel', 'Finalizados', descuentos.filter(d => this._calcularEstado(d) === 'finalizado').length, 'text-slate-400', 'bg-slate-50')}
        </div>
        <div class="flex-1 overflow-auto px-6 py-4">
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="border-b border-slate-100 bg-slate-50">
                            <th class="px-4 py-3 w-10 text-center">
                                <input type="checkbox" id="check-all-desc"
                                       class="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                       onchange="descuentoView.toggleLoteTodos(window._descuentosPaginados)">
                            </th>
                            ${cols.includes('nro') ? `<th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">N°</th>` : ''}
                            ${cols.includes('nombre') ? `<th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Descuento</th>` : ''}
                            ${cols.includes('valor') ? `<th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>` : ''}
                            ${cols.includes('alcance') ? `<th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alcance</th>` : ''}
                            ${cols.includes('vigencia') ? `<th class="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vigencia</th>` : ''}
                            ${cols.includes('estado') ? `<th class="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>` : ''}
                            ${cols.includes('acciones') ? `<th class="text-center px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>` : ''}
                        </tr>
                    </thead>
                    <tbody id="desc-tbody">
                        ${descuentos.length === 0
                ? this._renderVacio()
                : descuentos.map((d, i) => this._renderFila(d, i + 1, cols)).join('')}
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

    _renderFila(d, numero, cols = []) {
        const isChecked = selectorUtil.estado.seleccionados.includes(String(d.id)) ? 'checked' : '';
        const estado = this._calcularEstado(d);
        const badgeEst = this._badgeEstado(estado);
        const badgeTipo = d.tipo === 'porcentaje'
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase">
               <span class="material-symbols-outlined text-[11px]">percent</span> Porcentaje
           </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-[10px] font-black uppercase">
               <span class="material-symbols-outlined text-[11px]">payments</span> Monto fijo
           </span>`;
        const valorFmt = d.tipo === 'porcentaje'
            ? `<span class="text-base font-black text-blue-600">-${parseFloat(d.valor)}%</span>`
            : `<span class="text-base font-black text-amber-600">-Bs ${parseFloat(d.valor).toFixed(2)}</span>`;
        const alcanceBadge = d.alcance === 'global'
            ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-black uppercase">
               <span class="material-symbols-outlined text-[11px]">public</span> Global
           </span>`
            : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black uppercase">
               <span class="material-symbols-outlined text-[11px]">store</span>
               ${d.sucursal?.nombre || 'Sucursal'}
           </span>`;
        const fi = d.fecha_inicio ? new Date(d.fecha_inicio).toLocaleDateString('es-BO') : '—';
        const ff = d.fecha_fin ? new Date(d.fecha_fin).toLocaleDateString('es-BO') : '—';

        return `
    <tr class="border-b border-slate-50 hover:bg-slate-50/50 transition-all group ${isChecked ? 'bg-blue-50/70' : ''}" data-id="${d.id}">
        <td class="px-4 py-3 text-center">
            <input type="checkbox" ${isChecked}
                   class="fila-checkbox-desc w-4 h-4 rounded accent-blue-600 cursor-pointer"
                   data-id="${d.id}"
                   onchange="descuentoView.toggleLote('${d.id}')">
        </td>
        ${cols.includes('nro') ? `
        <td class="px-4 py-3">
            <span class="text-slate-400 font-bold text-xs">${numero}</span>
        </td>` : ''}
        ${cols.includes('nombre') ? `
        <td class="px-4 py-3">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span class="material-symbols-outlined text-blue-600 text-[18px]">sell</span>
                </div>
                <p class="font-black text-slate-800 text-sm">${d.nombre}</p>
            </div>
        </td>` : ''}
        ${cols.includes('valor') ? `
        <td class="px-4 py-3">
            <div class="flex items-center gap-2 flex-wrap">
                ${valorFmt}
                ${badgeTipo}
            </div>
        </td>` : ''}
        ${cols.includes('alcance') ? `
        <td class="px-4 py-3">${alcanceBadge}</td>` : ''}
        ${cols.includes('vigencia') ? `
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
                <button onclick="descuentoView.abrirModalFecha(${d.id}, '${d.fecha_inicio || ''}', '${d.fecha_fin || ''}')"
                        title="Cambiar fechas"
                        class="w-7 h-7 flex items-center justify-center rounded-lg bg-amber-50 border border-amber-100
                               hover:bg-amber-100 text-amber-500 hover:text-amber-600 transition-all flex-shrink-0">
                    <span class="material-symbols-outlined text-[15px]">edit_calendar</span>
                </button>
            </div>
        </td>` : ''}
        ${cols.includes('estado') ? `
        <td class="px-4 py-3 text-center">
            <div class="flex flex-col items-center gap-1.5">
                ${badgeEst}
                <button onclick="descuentoController.toggleActivo(${d.id}, ${!d.activo})"
                        title="${d.activo ? 'Desactivar' : 'Activar'}"
                        class="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase transition-all
                               ${d.activo
                    ? 'bg-emerald-50 hover:bg-red-50 text-emerald-600 hover:text-red-500'
                    : 'bg-slate-100 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'}">
                    <span class="material-symbols-outlined text-[12px]">${d.activo ? 'toggle_on' : 'toggle_off'}</span>
                    ${d.activo ? 'Activo' : 'Inactivo'}
                </button>
            </div>
        </td>` : ''}
        ${cols.includes('acciones') ? `
        <td class="px-4 py-3">
            <div class="flex items-center justify-center gap-1">
                ${ActionButtons.render(d.id, 'visibility', 'Ver', 'indigo', 'descuentoController.ver')}
                ${ActionButtons.render(d.id, 'edit', 'Editar', 'blue', 'descuentoController.editar')}
                ${ActionButtons.render(d.id, 'delete', 'Eliminar', 'red', 'descuentoController.verEliminar')}
            </div>
        </td>` : ''}
    </tr>`;
    },

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
                descuentoController.actualizarFechas(id, value.fecha_inicio, value.fecha_fin);
            }
        });
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

    _calcularEstado(d) {
        if (!d.activo) return 'inactivo';
        const ahora = new Date();
        const parseFecha = (iso, esFin = false) => {
            if (!iso) return null;
            if (iso.includes('T') || /\d{4}-\d{2}-\d{2} \d{2}/.test(iso)) return new Date(iso);
            const [y, m, dia] = iso.split('-').map(Number);
            return esFin
                ? new Date(y, m - 1, dia, 23, 59, 59, 999)
                : new Date(y, m - 1, dia, 0, 0, 0, 0);
        };
        const fi = parseFecha(d.fecha_inicio, false);
        const ff = parseFecha(d.fecha_fin, true);
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

    _bindBuscador(descuentos, cols = []) {
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
                    (d.sucursal?.nombre || '').toLowerCase().includes(term))
                : descuentos;
            tbody.innerHTML = filtrados.length === 0
                ? this._renderVacio()
                : filtrados.map((d, i) => this._renderFila(d, i + 1, cols)).join('');
            btnX?.classList.toggle('hidden', !q);
        };
        input.addEventListener('input', (e) => filtrar(e.target.value.trim()));
        btnX?.addEventListener('click', () => { input.value = ''; filtrar(''); input.focus(); });
    },

    renderDetalle(contenedor, d, productos, categorias) {
        const estado = this._calcularEstado(d);
        const badge = this._badgeEstado(estado);
        const fmt = iso => {
            if (!iso) return '—';
            const dt = new Date(iso);
            const fecha = dt.toLocaleDateString('es-BO');
            const hora = dt.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${fecha} ${hora}`;
        };
        const fi = fmt(d.fecha_inicio);
        const ff = fmt(d.fecha_fin);
        const creado = fmt(d.creado_at);
        const valorTxt = d.tipo === 'porcentaje'
            ? `-${parseFloat(d.valor)}%`
            : `-Bs ${parseFloat(d.valor).toFixed(2)}`;
        const valorColor = d.tipo === 'porcentaje' ? 'text-blue-600' : 'text-amber-600';
        const tipoBg = d.tipo === 'porcentaje'
            ? 'bg-blue-50 border-blue-100 text-blue-700'
            : 'bg-amber-50 border-amber-100 text-amber-700';
        const tipoIcon = d.tipo === 'porcentaje' ? 'percent' : 'payments';
        const tipoTxt = d.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo';

        const renderTarjetas = (lista) => {
            if (!lista.length) return `
                <div style="grid-column: 1/-1; display:flex; flex-direction:column; align-items:center; gap:8px; padding:40px 0; color:#cbd5e1;">
                    <span class="material-symbols-outlined" style="font-size:48px;">inventory_2</span>
                    <p style="font-size:11px; font-weight:900; text-transform:uppercase; letter-spacing:.1em;">Sin productos en esta categoría</p>
                </div>`;
            return lista.map(p => {
                const precio = p.precios?.find(pr => d.alcance === 'sucursal' ? pr.id_sucursal == d.id_sucursal : true);
                const precioOriginal = precio ? 'Bs ' + parseFloat(precio.precio).toFixed(2) : null;
                const precioDesc = precio && d.tipo === 'porcentaje'
                    ? 'Bs ' + (parseFloat(precio.precio) * (1 - parseFloat(d.valor) / 100)).toFixed(2)
                    : precio && d.tipo === 'monto_fijo'
                        ? 'Bs ' + Math.max(0, parseFloat(precio.precio) - parseFloat(d.valor)).toFixed(2)
                        : null;
                const imgHtml = p.imagen
                    ? '<img src="' + p.imagen + '" style="width:100%;height:100%;object-fit:cover;">'
                    : '<span class="material-symbols-outlined" style="font-size:48px;color:#e2e8f0;">image_not_supported</span>';
                const preciosHtml = precioOriginal
                    ? '<div style="display:flex;align-items:center;gap:6px;margin-top:4px;">'
                    + '<span style="font-size:10px;color:#94a3b8;text-decoration:line-through;">' + precioOriginal + '</span>'
                    + '<span style="font-size:12px;font-weight:900;" class="' + valorColor + '">' + (precioDesc || precioOriginal) + '</span>'
                    + '</div>'
                    : '';
                return '<div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style="display:flex;flex-direction:column;">'
                    + '<div style="aspect-ratio:1;background:#f8fafc;display:flex;align-items:center;justify-content:center;overflow:hidden;">' + imgHtml + '</div>'
                    + '<div style="padding:12px;display:flex;flex-direction:column;gap:4px;flex:1;">'
                    + '<p style="font-size:11px;font-weight:900;color:#334155;line-height:1.3;">' + p.nombre + '</p>'
                    + preciosHtml
                    + '<span class="inline-flex items-center gap-1 bg-emerald-50 border border-emerald-100 text-emerald-600" style="margin-top:auto;padding:2px 8px;border-radius:8px;font-size:9px;font-weight:900;width:fit-content;">'
                    + '<span class="material-symbols-outlined" style="font-size:10px;">sell</span>' + valorTxt
                    + '</span>'
                    + '</div></div>';
            }).join('');
        };

        const chipsHtml = categorias.length ? (() => {
            const btnTodos = '<button data-cat="all" class="dv-cat-chip" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:12px;border:1px solid #2563eb;background:#2563eb;color:#fff;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">Todos <span style="background:#fff;color:#2563eb;border-radius:9999px;padding:0 6px;font-size:9px;">' + productos.length + '</span></button>';
            const btnCats = categorias.map(c => {
                const cnt = productos.filter(p => p.categoria?.id === c.id).length;
                return '<button data-cat="' + c.id + '" class="dv-cat-chip" style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;border-radius:12px;border:1px solid #e2e8f0;background:#fff;color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;cursor:pointer;">'
                    + '<span class="material-symbols-outlined" style="font-size:11px;">category</span>'
                    + c.nombre
                    + '<span style="background:#f1f5f9;color:#64748b;border-radius:9999px;padding:0 6px;font-size:9px;">' + cnt + '</span>'
                    + '</button>';
            }).join('');
            return btnTodos + btnCats;
        })() : '';

        contenedor.innerHTML = `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <button id="dv-btn-volver" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle de Descuento</p>
                        <h1 class="text-lg font-black text-slate-800 leading-tight">${d.nombre}</h1>
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
            <div class="flex-1 overflow-auto px-6 py-6">
                <div class="max-w-5xl mx-auto flex flex-col gap-5">

                    <div class="grid grid-cols-3 gap-5">
                        <div class="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span class="material-symbols-outlined text-blue-600 text-[24px]">sell</span>
                                </div>
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</p>
                                    <h2 class="text-xl font-black text-slate-800">${d.nombre}</h2>
                                </div>
                            </div>
                            ${d.descripcion ? `<div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                                <p class="text-sm text-slate-600">${d.descripcion}</p>
                            </div>` : ''}
                            <div class="grid grid-cols-2 gap-3 pt-1">
                                <div class="flex flex-col gap-1">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                                    <p class="text-3xl font-black ${valorColor}">${valorTxt}</p>
                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase w-fit ${tipoBg}">
                                        <span class="material-symbols-outlined text-[11px]">${tipoIcon}</span>
                                        ${tipoTxt}
                                    </span>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alcance</p>
                                    ${d.alcance === 'global'
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-black w-fit mt-1">
                                               <span class="material-symbols-outlined text-[16px]">public</span> Global
                                           </span>
                                           <p class="text-[11px] text-slate-400 mt-1">Aplica en todas las sucursales</p>`
                : `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 text-sm font-black w-fit mt-1">
                                               <span class="material-symbols-outlined text-[16px]">store</span>
                                               ${d.sucursal?.nombre || 'Sucursal'}
                                           </span>
                                           <p class="text-[11px] text-slate-400 mt-1">Solo en esta sucursal</p>`}
                                </div>
                            </div>
                        </div>
                        <div class="flex flex-col gap-4">
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[12px]">info</span>
                                    Estado actual
                                </p>
                                ${badge}
                                <button id="dv-btn-toggle"
                                        class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase w-full justify-center transition-all border mt-1
                                               ${d.activo ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' : 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'}">
                                    <span class="material-symbols-outlined text-[14px]">${d.activo ? 'toggle_off' : 'toggle_on'}</span>
                                    ${d.activo ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[12px]">history</span>
                                    Registro
                                </p>
                                <div class="flex items-start gap-2">
                                    <span class="material-symbols-outlined text-slate-300 text-[14px] mt-0.5">schedule</span>
                                    <div>
                                        <p class="font-black text-slate-400 text-[9px] uppercase">Creado</p>
                                        <p class="text-[11px] font-medium text-slate-500">${creado}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-4">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[14px]">calendar_month</span>
                                Vigencia
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

                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                            <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                            Productos asignados
                            <span class="ml-1 px-2 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-[9px] font-black">${productos.length}</span>
                        </p>
                        ${categorias.length ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f1f5f9;">' + chipsHtml + '</div>' : ''}
                        <div id="dv-productos-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px;">
                            ${productos.length ? renderTarjetas(productos) : '<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px 0;color:#cbd5e1;"><span class="material-symbols-outlined" style="font-size:48px;">inventory_2</span><p style="font-size:11px;font-weight:900;text-transform:uppercase;">Sin productos asignados</p></div>'}
                        </div>
                    </div>

                </div>
            </div>
        </div>`;

        contenedor.querySelectorAll('.dv-cat-chip').forEach(btn => {
            btn.addEventListener('click', () => {
                contenedor.querySelectorAll('.dv-cat-chip').forEach(b => {
                    b.style.background = '#fff';
                    b.style.borderColor = '#e2e8f0';
                    b.style.color = '#64748b';
                });
                btn.style.background = '#2563eb';
                btn.style.borderColor = '#2563eb';
                btn.style.color = '#fff';
                const catId = btn.dataset.cat;
                const filtrados = catId === 'all' ? productos : productos.filter(p => p.categoria?.id == catId);
                const grid = contenedor.querySelector('#dv-productos-grid');
                if (grid) grid.innerHTML = renderTarjetas(filtrados);
            });
        });
    },

    renderEliminar(contenedor, d, productos, categorias) {
        const estado = this._calcularEstado(d);
        const badge = this._badgeEstado(estado);
        const fmt = iso => {
            if (!iso) return '—';
            const dt = new Date(iso);
            const fecha = dt.toLocaleDateString('es-BO');
            const hora = dt.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
            return `${fecha} ${hora}`;
        };
        const valorTxt = d.tipo === 'porcentaje'
            ? `-${parseFloat(d.valor)}%`
            : `-Bs ${parseFloat(d.valor).toFixed(2)}`;
        const valorColor = d.tipo === 'porcentaje' ? 'text-blue-600' : 'text-amber-600';
        const tipoBg = d.tipo === 'porcentaje'
            ? 'bg-blue-50 border-blue-100 text-blue-700'
            : 'bg-amber-50 border-amber-100 text-amber-700';
        const tipoIcon = d.tipo === 'porcentaje' ? 'percent' : 'payments';
        const tipoTxt = d.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo';
        const fi = fmt(d.fecha_inicio);
        const ff = fmt(d.fecha_fin);
        const creado = fmt(d.creado_at);

        const renderTarjetas = (lista) => {
            if (!lista.length) return `<div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;gap:8px;padding:40px 0;color:#cbd5e1;">
                <span class="material-symbols-outlined" style="font-size:48px;">inventory_2</span>
                <p style="font-size:11px;font-weight:900;text-transform:uppercase;">Sin productos asignados</p>
            </div>`;
            return lista.map(p => {
                const imgHtml = p.imagen
                    ? `<img src="${p.imagen}" style="width:100%;height:100%;object-fit:cover;opacity:0.5;">`
                    : `<span class="material-symbols-outlined" style="font-size:48px;color:#e2e8f0;">image_not_supported</span>`;
                return `<div class="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden" style="display:flex;flex-direction:column;opacity:0.7;">
                    <div style="aspect-ratio:1;background:#fef2f2;display:flex;align-items:center;justify-content:center;overflow:hidden;">${imgHtml}</div>
                    <div style="padding:10px;">
                        <p style="font-size:11px;font-weight:900;color:#334155;">${p.nombre}</p>
                    </div>
                </div>`;
            }).join('');
        };

        const catChips = categorias.map(c =>
            `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-50 border border-red-100 text-red-400 text-[11px] font-black" style="opacity:0.7;">
                <span class="material-symbols-outlined text-[13px]">category</span>${c.nombre}
            </span>`
        ).join('');

        contenedor.innerHTML = `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-red-50/30">

            <!-- Header con tono rojo -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-red-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <button id="del-btn-volver" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">warning</span>
                            Eliminar Descuento
                        </p>
                        <h1 class="text-lg font-black text-slate-800 leading-tight">${d.nombre}</h1>
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
                        <p class="text-[11px] text-red-500 mt-0.5">Se eliminará el descuento junto con todas sus asignaciones a productos y categorías.</p>
                    </div>
                </div>
            </div>

            <!-- Contenido (lectura, no editable) -->
            <div class="flex-1 overflow-auto px-6 py-5">
                <div class="max-w-5xl mx-auto flex flex-col gap-5">

                    <div class="grid grid-cols-3 gap-5">
                        <div class="col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-4 opacity-75">
                            <div class="flex items-center gap-3">
                                <div class="w-12 h-12 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                                    <span class="material-symbols-outlined text-red-400 text-[24px]">sell</span>
                                </div>
                                <div>
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre</p>
                                    <h2 class="text-xl font-black text-slate-800">${d.nombre}</h2>
                                </div>
                            </div>
                            ${d.descripcion ? `<div class="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Descripción</p>
                                <p class="text-sm text-slate-600">${d.descripcion}</p>
                            </div>` : ''}
                            <div class="grid grid-cols-2 gap-3">
                                <div class="flex flex-col gap-1">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor</p>
                                    <p class="text-3xl font-black ${valorColor}">${valorTxt}</p>
                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase w-fit ${tipoBg}">
                                        <span class="material-symbols-outlined text-[11px]">${tipoIcon}</span>${tipoTxt}
                                    </span>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Alcance</p>
                                    ${d.alcance === 'global'
                ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 text-sm font-black w-fit mt-1">
                                               <span class="material-symbols-outlined text-[16px]">public</span> Global
                                           </span>`
                : `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-100 text-violet-700 text-sm font-black w-fit mt-1">
                                               <span class="material-symbols-outlined text-[16px]">store</span>${d.sucursal?.nombre || 'Sucursal'}
                                           </span>`}
                                </div>
                            </div>
                        </div>

                        <div class="flex flex-col gap-4">
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 opacity-75">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span class="material-symbols-outlined text-[12px]">info</span>Estado actual
                                </p>
                                ${badge}
                            </div>
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-2 opacity-75">
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

                    <!-- Productos y categorías (solo visual) -->
                    <div class="grid grid-cols-2 gap-5">
                        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 opacity-75">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                                <span class="material-symbols-outlined text-[14px]">inventory_2</span>
                                Productos que se desasignarán
                                <span class="ml-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-500 text-[9px] font-black">${productos.length}</span>
                            </p>
                            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">
                                ${renderTarjetas(productos)}
                            </div>
                        </div>
                        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 opacity-75">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 mb-4">
                                <span class="material-symbols-outlined text-[14px]">category</span>
                                Categorías que se desasignarán
                                <span class="ml-1 px-2 py-0.5 rounded-full bg-red-50 border border-red-100 text-red-500 text-[9px] font-black">${categorias.length}</span>
                            </p>
                            <div class="flex flex-wrap gap-2">
                                ${catChips || `<p class="text-[11px] text-slate-300 font-black uppercase">Sin categorías asignadas</p>`}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>`;
    },

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