export const pedidoView = {

    _estado: { busqueda: '', fechaDesde: '', fechaHasta: '' },

    // ─────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────

    render(pedidos = [], filtroEstado = '') {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        contenedor.innerHTML = this._renderLayout(pedidos, filtroEstado);
        this._bindBuscador(pedidos, filtroEstado);
    },

    _renderLayout(pedidos, filtroEstado) {
        const filtrados = this._filtrar(pedidos);
        const counts    = this._contarPorEstado(pedidos);
        const totalBs   = pedidos.reduce((s, p) => s + parseFloat(p.total ?? 0), 0);
        const pendPago  = pedidos.filter(p => p.pago?.[0]?.estado !== 'completado' && p.estado !== 'cancelado').length;

        return `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

            <!-- HEADER -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-md shadow-blue-200">
                        <span class="material-symbols-outlined text-white text-[20px]">receipt_long</span>
                    </div>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Owner &middot; Monitor</p>
                        <h1 class="text-lg font-black text-slate-800 leading-tight">Gestión de Órdenes</h1>
                    </div>
                </div>
                <div class="relative">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
                    <input id="ped-buscador" type="text" placeholder="Buscar cliente..."
                           value="${this._estado.busqueda}"
                           class="bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-9 text-sm
                                  outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                                  transition-all font-medium text-slate-700 w-56">
                    <button id="ped-btn-limpiar"
                            class="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
                                   text-slate-400 hover:text-slate-600 transition-all ${this._estado.busqueda ? '' : 'hidden'}">
                        <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            </div>

            <!-- STATS CARDS -->
            <div class="grid grid-cols-4 gap-3 px-6 py-3 bg-white border-b border-slate-100 flex-shrink-0">
                ${this._statCard('receipt_long',  'Total Órdenes',    counts.total,         'bg-blue-50',    'text-blue-600',    'border-blue-100')}
                ${this._statCard('schedule',       'Pago Pendiente',   pendPago,             'bg-amber-50',   'text-amber-600',   'border-amber-100')}
                ${this._statCard('local_shipping', 'En Tránsito',      counts.en_camino,     'bg-violet-50',  'text-violet-600',  'border-violet-100')}
                ${this._statCard('payments',       'Facturado (Bs)',   totalBs.toFixed(2),   'bg-emerald-50', 'text-emerald-600', 'border-emerald-100')}
            </div>

            <!-- FILTROS -->
            <div class="flex items-center gap-3 px-6 py-2.5 bg-white border-b border-slate-100 flex-shrink-0 flex-wrap">
                <span class="material-symbols-outlined text-slate-400 text-[18px] flex-shrink-0">filter_list</span>

                <!-- Filtro estado -->
                <select onchange="pedidoController.cambiarFiltroEstado(this.value)"
                        class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-black text-slate-700
                               bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
                    <option value=""             ${filtroEstado === ''             ? 'selected' : ''}>Todos (${counts.total})</option>
                    <option value="pendiente"    ${filtroEstado === 'pendiente'    ? 'selected' : ''}>Pendiente (${counts.pendiente})</option>
                    <option value="confirmado"   ${filtroEstado === 'confirmado'   ? 'selected' : ''}>Confirmado (${counts.confirmado})</option>
                    <option value="en_preparacion" ${filtroEstado === 'en_preparacion' ? 'selected' : ''}>En Preparación (${counts.en_preparacion})</option>
                    <option value="listo"        ${filtroEstado === 'listo'        ? 'selected' : ''}>Listo (${counts.listo})</option>
                    <option value="en_camino"    ${filtroEstado === 'en_camino'    ? 'selected' : ''}>En Camino (${counts.en_camino})</option>
                    <option value="entregado"    ${filtroEstado === 'entregado'    ? 'selected' : ''}>Entregado (${counts.entregado})</option>
                    <option value="cancelado"    ${filtroEstado === 'cancelado'    ? 'selected' : ''}>Cancelado (${counts.cancelado})</option>
                </select>

                <!-- Separador -->
                <div class="w-px h-5 bg-slate-200 flex-shrink-0"></div>

                <!-- Filtro fecha desde -->
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Desde</span>
                    <input type="date" id="ped-fecha-desde"
                           value="${this._estado.fechaDesde ?? ''}"
                           class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700
                                  bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
                </div>

                <!-- Filtro fecha hasta -->
                <div class="flex items-center gap-1.5">
                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex-shrink-0">Hasta</span>
                    <input type="date" id="ped-fecha-hasta"
                           value="${this._estado.fechaHasta ?? ''}"
                           class="border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700
                                  bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer">
                </div>

                <!-- Limpiar fechas -->
                <button id="ped-btn-limpiar-fechas"
                        class="flex items-center gap-1 px-2.5 py-2 rounded-xl border border-slate-200 text-slate-400
                               hover:text-red-500 hover:border-red-200 transition-all text-[10px] font-black uppercase
                               ${(this._estado.fechaDesde || this._estado.fechaHasta) ? '' : 'hidden'}">
                    <span class="material-symbols-outlined text-[14px]">close</span>
                    Limpiar fechas
                </button>

                ${filtroEstado ? `<div class="ml-auto">${this._badgeEstado(filtroEstado)}</div>` : ''}
            </div>

            <!-- TABLA -->
            <div class="flex-1 overflow-auto px-6 py-4">
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <div class="overflow-x-auto rounded-2xl">
                        <table class="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr class="bg-slate-50 border-b border-slate-100">
                                <th class="text-left px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-16">Nº</th>
                                <th class="text-left px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                                <th class="text-left px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sucursal</th>
                                <th class="text-left px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Pago</th>
                                <th class="text-right px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th>
                                <th class="text-center px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                                <th class="text-left px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha</th>
                                <th class="text-center px-4 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
                            </tr>
                        </thead>
                        <tbody id="ped-tbody">
                            ${filtrados.length === 0 ? this._renderVacio() : filtrados.map(p => this._renderFila(p)).join('')}
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`;
    },

    _statCard(icon, label, value, bg, color, border) {
        return `
        <div class="flex items-center gap-3 px-4 py-3 rounded-xl border ${border} ${bg}">
            <span class="material-symbols-outlined ${color} text-[22px] flex-shrink-0">${icon}</span>
            <div class="min-w-0">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">${label}</p>
                <p class="text-lg font-black ${color} leading-tight">${value}</p>
            </div>
        </div>`;
    },

    _chip(valor, label, icon, activo, count = null) {
        const isActive = activo === valor;
        const cfg = this._cfgEstado(valor || 'todos');
        const cls = isActive
            ? `${cfg.bg} ${cfg.border} ${cfg.color} shadow-sm`
            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300';
        return `
        <button onclick="pedidoController.cambiarFiltroEstado('${valor}')"
                class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase
                       tracking-widest transition-all flex-shrink-0 ${cls}">
            <span class="material-symbols-outlined text-[13px]">${icon}</span>
            ${label}
            ${count !== null ? `<span class="ml-0.5 px-1.5 py-0.5 rounded-full bg-black/10 text-[9px]">${count}</span>` : ''}
        </button>`;
    },

    // ─────────────────────────────────────────────
    // FILA DE TABLA
    // ─────────────────────────────────────────────

    _renderFila(p) {
        const cliente = p.usuario
            ? `${p.usuario.nombres} ${p.usuario.apellido_paterno}`
            : 'Sin cliente';
        const pago        = p.pago?.[0];
        const estadoPago  = pago?.estado ?? 'sin_pago';
        const metodoPago  = pago?.metodo?.nombre ?? '—';
        const necesitaValidar = estadoPago !== 'completado' && p.estado !== 'cancelado';
        const fecha = p.creado_at
            ? new Date(p.creado_at).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
            : '—';

        return `
        <tr class="border-b border-slate-50 hover:bg-blue-50/20 transition-colors group cursor-pointer"
            onclick="pedidoController.verDetalle(${p.id})">

            <!-- ID -->
            <td class="px-5 py-4">
                <span class="font-black text-slate-700 text-xs">#${p.id}</span>
            </td>

            <!-- Cliente -->
            <td class="px-4 py-4">
                <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                        <span class="text-white font-black text-[11px]">${(p.usuario?.nombres?.[0] ?? 'S').toUpperCase()}</span>
                    </div>
                    <div class="min-w-0">
                        <p class="font-black text-slate-800 text-xs leading-tight truncate">${cliente}</p>
                        ${p.usuario?.celular
                            ? `<p class="text-[10px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                                   <span class="material-symbols-outlined text-[10px]">phone</span>
                                   ${p.usuario.celular}
                               </p>`
                            : ''}
                    </div>
                </div>
            </td>

            <!-- Sucursal -->
            <td class="px-4 py-4">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200
                             text-slate-600 text-[10px] font-black uppercase tracking-wide">
                    <span class="material-symbols-outlined text-[12px] text-slate-400">store</span>
                    ${p.sucursal?.nombre ?? '—'}
                </span>
            </td>

            <!-- Pago -->
            <td class="px-4 py-4">
                <div class="flex flex-col gap-1">
                    <span class="text-[11px] font-black text-slate-600">${metodoPago}</span>
                    ${this._badgePago(estadoPago)}
                </div>
            </td>

            <!-- Total -->
            <td class="px-4 py-4 text-right">
                <span class="text-sm font-black text-slate-800">Bs ${parseFloat(p.total ?? 0).toFixed(2)}</span>
            </td>

            <!-- Estado -->
            <td class="px-4 py-4 text-center">
                ${this._badgeEstado(p.estado)}
            </td>

            <!-- Fecha -->
            <td class="px-4 py-4">
                <div class="flex flex-col gap-0.5">
                    <span class="text-xs font-black text-slate-600">${new Date(p.creado_at).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    <span class="text-[10px] text-slate-400">${new Date(p.creado_at).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
            </td>

            <!-- Accion -->
            <td class="px-4 py-4" onclick="event.stopPropagation()">
                <div class="flex items-center justify-center gap-1.5">
                    <div class="group/tip relative">
                        <button onclick="pedidoController.verDetalle(${p.id})"
                                class="w-8 h-8 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-600
                                       border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'wght' 250">visibility</span>
                        </button>
                        <span class="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                     bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none">
                            Ver detalle
                        </span>
                    </div>
                    ${necesitaValidar ? `
                    <div class="group/tip relative">
                        <button onclick="pedidoController.abrirValidacionPago(${p.id})"
                                class="w-8 h-8 flex items-center justify-center rounded-xl bg-emerald-50 text-emerald-600
                                       border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'wght' 250">verified</span>
                        </button>
                        <span class="absolute -top-8 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                     bg-slate-800 text-white text-[9px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none">
                            Validar pago
                        </span>
                    </div>` : ''}
                </div>
            </td>
        </tr>`;
    },

    // ─────────────────────────────────────────────
    // DETALLE — PANTALLA COMPLETA (patrón createProduct)
    // ─────────────────────────────────────────────

    _detalleOriginalContent: null,
    _detalleContainer: null,

    mostrarDetalle(pedido) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        this._detalleContainer = contenedor;
        this._detalleOriginalContent = contenedor.innerHTML;

        const pago          = pedido.pago?.[0];
        const pagoCompletado = pago?.estado === 'completado';
        const cancelado     = pedido.estado === 'cancelado';
        const cliente       = pedido.usuario
            ? `${pedido.usuario.nombres} ${pedido.usuario.apellido_paterno}`
            : 'Sin cliente';
        const fecha = pedido.creado_at
            ? new Date(pedido.creado_at).toLocaleString('es-BO', { dateStyle: 'long', timeStyle: 'short' })
            : '—';

        const estadosLogisticos = [
            { v: 'en_preparacion', l: 'En Preparación' },
            { v: 'listo',          l: 'Listo para despacho' },
            { v: 'en_camino',      l: 'En Camino' },
            { v: 'entregado',      l: 'Entregado' },
            { v: 'cancelado',      l: 'Cancelado' },
        ];

        const items = (pedido.pedido_item ?? []).map(it => {
            const nombre   = it.producto?.nombre ?? it.combo?.nombre ?? '—';
            const imgUrl   = it.producto?.imagen_url ?? null;
            const esCombo  = !!it.id_combo;
            return `
            <div class="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <!-- Imagen -->
                <div class="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0 border border-slate-200">
                    ${imgUrl
                        ? `<img src="${imgUrl}" alt="${nombre}" class="w-full h-full object-cover">`
                        : `<div class="w-full h-full flex items-center justify-center">
                               <span class="material-symbols-outlined text-slate-300 text-[28px]">${esCombo ? 'category' : 'medication'}</span>
                           </div>`}
                </div>
                <!-- Info -->
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 flex-wrap">
                        <p class="font-black text-slate-800 text-sm truncate">${nombre}</p>
                        ${esCombo ? `<span class="px-2 py-0.5 rounded-lg bg-violet-100 text-violet-600 text-[9px] font-black uppercase">Combo</span>` : ''}
                    </div>
                    <p class="text-[11px] text-slate-400 mt-0.5">Precio unit.: <span class="font-black text-slate-600">Bs ${parseFloat(it.precio_unitario ?? 0).toFixed(2)}</span></p>
                </div>
                <!-- Cantidad y subtotal -->
                <div class="text-right flex-shrink-0">
                    <p class="text-[10px] text-slate-400 uppercase font-black">x${it.cantidad}</p>
                    <p class="text-base font-black text-slate-800">Bs ${parseFloat(it.subtotal ?? 0).toFixed(2)}</p>
                </div>
            </div>`;
        }).join('');

        contenedor.innerHTML = `
        <div class="h-full min-h-0 w-full flex flex-col overflow-y-auto bg-slate-100/90 px-5 pt-4 pb-5 lg:px-8 lg:pt-5 lg:pb-6">

            <!-- Header -->
            <header class="shrink-0 flex items-center justify-between gap-4 mb-5 max-w-[1360px] mx-auto w-full border-b border-slate-200/80 pb-4">
                <div class="flex items-center gap-3">
                    <button onclick="pedidoView.cerrarDetalle()"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-500
                                   hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                        <span class="material-symbols-outlined text-[20px]">arrow_back</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Orden de Despacho</p>
                        <h1 class="text-xl font-black text-slate-800">Pedido #${pedido.id}</h1>
                    </div>
                </div>
                <div class="flex items-center gap-3">
                    ${this._badgeEstado(pedido.estado)}
                    <button onclick="pedidoView.cerrarDetalle()"
                            class="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700
                                   bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50
                                   hover:text-red-700 hover:border-red-200 transition-colors">
                        <span class="material-symbols-outlined text-[18px]">close</span>
                        Cerrar
                    </button>
                </div>
            </header>

            <!-- Contenido en 2 columnas -->
            <div class="max-w-[1360px] mx-auto w-full grid grid-cols-12 gap-6 lg:gap-8">

                <!-- COLUMNA IZQUIERDA: Items del pedido -->
                <div class="col-span-12 lg:col-span-7 flex flex-col gap-4">

                    <!-- Card: Productos -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-white text-[16px]">shopping_cart</span>
                            </span>
                            <p class="font-black text-slate-800 text-sm uppercase tracking-wide">Productos del Pedido</p>
                            <span class="ml-auto px-2.5 py-1 rounded-xl bg-slate-100 text-slate-500 text-[10px] font-black">
                                ${(pedido.pedido_item ?? []).length} ítem(s)
                            </span>
                        </div>
                        <div class="p-4 flex flex-col gap-3">
                            ${items || `<div class="py-8 text-center text-slate-400 text-sm">Sin ítems registrados</div>`}
                        </div>
                        <!-- Totales -->
                        <div class="px-5 py-4 bg-slate-50 border-t border-slate-100">
                            ${pedido.descuento_monto > 0 ? `
                            <div class="flex justify-between text-sm mb-1">
                                <span class="text-slate-500">Subtotal</span>
                                <span class="font-medium text-slate-700">Bs ${parseFloat(pedido.subtotal ?? 0).toFixed(2)}</span>
                            </div>
                            <div class="flex justify-between text-sm mb-2">
                                <span class="text-emerald-600">Descuento</span>
                                <span class="font-black text-emerald-600">- Bs ${parseFloat(pedido.descuento_monto ?? 0).toFixed(2)}</span>
                            </div>` : ''}
                            <div class="flex justify-between items-center">
                                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a Cobrar</span>
                                <span class="text-2xl font-black text-slate-800">Bs ${parseFloat(pedido.total ?? 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Card: Notas -->
                    ${pedido.notas ? `
                    <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3">
                        <span class="material-symbols-outlined text-amber-500 text-[20px] flex-shrink-0 mt-0.5">sticky_note_2</span>
                        <div>
                            <p class="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Notas del Pedido</p>
                            <p class="text-sm text-amber-800">${pedido.notas}</p>
                        </div>
                    </div>` : ''}
                </div>

                <!-- COLUMNA DERECHA: Info + Acciones -->
                <div class="col-span-12 lg:col-span-5 flex flex-col gap-4">

                    <!-- Card: Cliente y Entrega -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-white text-[16px]">person</span>
                            </span>
                            <p class="font-black text-slate-800 text-sm uppercase tracking-wide">Cliente</p>
                        </div>
                        <div class="p-5 flex flex-col gap-3">
                            <div class="flex items-center gap-3">
                                <div class="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                                    <span class="material-symbols-outlined text-blue-600 text-[22px]">person</span>
                                </div>
                                <div>
                                    <p class="font-black text-slate-800">${cliente}</p>
                                    ${pedido.usuario?.celular
                                        ? `<p class="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                               <span class="material-symbols-outlined text-[12px]">phone</span>
                                               ${pedido.usuario.celular}
                                           </p>`
                                        : ''}
                                </div>
                            </div>
                            <div class="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sucursal</p>
                                    <p class="text-sm font-black text-slate-700 flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[14px] text-slate-400">store</span>
                                        ${pedido.sucursal?.nombre ?? '—'}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</p>
                                    <p class="text-[11px] font-medium text-slate-600">${fecha}</p>
                                </div>
                            </div>
                            ${pedido.direccion?.direccion_texto ? `
                            <div class="pt-2 border-t border-slate-100">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dirección de Entrega</p>
                                <p class="text-sm text-slate-700 flex items-start gap-1.5">
                                    <span class="material-symbols-outlined text-[14px] text-slate-400 mt-0.5">location_on</span>
                                    ${pedido.direccion.direccion_texto}
                                </p>
                                ${pedido.direccion.referencia
                                    ? `<p class="text-[11px] text-slate-400 mt-1 ml-5">${pedido.direccion.referencia}</p>`
                                    : ''}
                            </div>` : ''}
                        </div>
                    </div>

                    <!-- Card: Pago -->
                    <div class="bg-white rounded-2xl border ${pagoCompletado ? 'border-emerald-200' : 'border-amber-200'} shadow-sm overflow-hidden">
                        <div class="px-5 py-4 border-b ${pagoCompletado ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'} flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg ${pagoCompletado ? 'bg-emerald-500' : 'bg-amber-400'} flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-white text-[16px]">payments</span>
                            </span>
                            <p class="font-black text-slate-800 text-sm uppercase tracking-wide">Información de Pago</p>
                            <div class="ml-auto">${this._badgePago(pago?.estado ?? 'sin_pago')}</div>
                        </div>
                        <div class="p-5 grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Método</p>
                                <p class="font-black text-slate-700 text-sm">${pago?.metodo?.nombre ?? '—'}</p>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto</p>
                                <p class="font-black text-slate-800 text-lg">Bs ${parseFloat(pago?.monto ?? pedido.total ?? 0).toFixed(2)}</p>
                            </div>
                            <div class="col-span-2">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Referencia / Comprobante</p>
                                <p class="font-mono font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm">
                                    ${pago?.referencia_externa ?? 'Sin referencia'}
                                </p>
                            </div>
                        </div>
                        ${!pagoCompletado && !cancelado ? `
                        <div class="px-5 pb-5">
                            <button onclick="pedidoController.abrirValidacionPago(${pedido.id}); pedidoView.cerrarDetalle();"
                                    class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.98] text-white
                                           font-black text-xs uppercase tracking-widest rounded-xl transition-all
                                           shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                                <span class="material-symbols-outlined text-[18px]">verified</span>
                                Validar Pago y Confirmar Pedido
                            </button>
                        </div>` : ''}
                    </div>

                    <!-- Card: Control de Estado -->
                    ${!cancelado ? `
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                        <div class="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                            <span class="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-white text-[16px]">local_shipping</span>
                            </span>
                            <p class="font-black text-slate-800 text-sm uppercase tracking-wide">Control de Despacho</p>
                        </div>
                        <div class="p-5">
                            <p class="text-[11px] text-slate-400 mb-3">Cambia el estado logístico del pedido. Si cancelas un pedido con pago completado, el stock se repondrá automáticamente.</p>
                            <select onchange="pedidoController.cambiarEstadoManual(${pedido.id}, this.value); pedidoView.cerrarDetalle();"
                                    class="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm font-black text-slate-700
                                           bg-white outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all">
                                <option value="" disabled selected>— Seleccionar nuevo estado —</option>
                                ${estadosLogisticos.map(e => `
                                <option value="${e.v}" ${pedido.estado === e.v ? 'selected' : ''}>${e.l}</option>`).join('')}
                            </select>
                        </div>
                    </div>` : `
                    <div class="bg-slate-100 rounded-2xl border border-slate-200 p-5 flex items-center gap-3">
                        <span class="material-symbols-outlined text-slate-400 text-[24px]">cancel</span>
                        <p class="text-sm font-black text-slate-500">Este pedido fue cancelado y no puede modificarse.</p>
                    </div>`}
                </div>
            </div>
        </div>`;
    },

    cerrarDetalle() {
        if (this._detalleContainer && this._detalleOriginalContent !== null) {
            this._detalleContainer.innerHTML = this._detalleOriginalContent;
            this._detalleOriginalContent = null;
        }
    },

    // ─────────────────────────────────────────────
    // BADGES
    // ─────────────────────────────────────────────

    _badgeEstado(estado) {
        const cfg = {
            pendiente:      { icon: 'schedule',       text: 'Pendiente',      bg: 'bg-amber-50',   border: 'border-amber-200',   color: 'text-amber-700' },
            confirmado:     { icon: 'check_circle',    text: 'Confirmado',     bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-700' },
            en_preparacion: { icon: 'inventory_2',     text: 'En Preparación', bg: 'bg-sky-50',     border: 'border-sky-200',     color: 'text-sky-700' },
            listo:          { icon: 'done',            text: 'Listo',          bg: 'bg-teal-50',    border: 'border-teal-200',    color: 'text-teal-700' },
            en_camino:      { icon: 'local_shipping',  text: 'En Camino',      bg: 'bg-blue-50',    border: 'border-blue-200',    color: 'text-blue-700' },
            entregado:      { icon: 'done_all',        text: 'Entregado',      bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-700' },
            cancelado:      { icon: 'cancel',          text: 'Cancelado',      bg: 'bg-slate-100',  border: 'border-slate-200',   color: 'text-slate-500' },
        }[estado] ?? { icon: 'help', text: estado, bg: 'bg-slate-50', border: 'border-slate-200', color: 'text-slate-400' };

        return `
        <span class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl
                     ${cfg.bg} border ${cfg.border} ${cfg.color} text-[10px] font-black uppercase">
            <span class="material-symbols-outlined text-[12px]">${cfg.icon}</span>
            ${cfg.text}
        </span>`;
    },

    _badgePago(estado) {
        const cfg = {
            pendiente:  { text: 'Pendiente',  bg: 'bg-amber-100',   color: 'text-amber-700' },
            completado: { text: 'Completado', bg: 'bg-emerald-100', color: 'text-emerald-700' },
            rechazado:  { text: 'Rechazado',  bg: 'bg-red-100',     color: 'text-red-600' },
            sin_pago:   { text: 'Sin pago',   bg: 'bg-slate-100',   color: 'text-slate-500' },
        }[estado] ?? { text: estado, bg: 'bg-slate-100', color: 'text-slate-400' };
        return `<span class="inline-flex px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.color} text-[10px] font-black uppercase">${cfg.text}</span>`;
    },

    _cfgEstado(estado) {
        return {
            todos:          { bg: 'bg-slate-800',   border: 'border-slate-800',   color: 'text-white' },
            pendiente:      { bg: 'bg-amber-50',    border: 'border-amber-300',   color: 'text-amber-700' },
            confirmado:     { bg: 'bg-emerald-50',  border: 'border-emerald-300', color: 'text-emerald-700' },
            en_preparacion: { bg: 'bg-sky-50',      border: 'border-sky-300',     color: 'text-sky-700' },
            listo:          { bg: 'bg-teal-50',     border: 'border-teal-300',    color: 'text-teal-700' },
            en_camino:      { bg: 'bg-blue-50',     border: 'border-blue-300',    color: 'text-blue-700' },
            entregado:      { bg: 'bg-emerald-50',  border: 'border-emerald-300', color: 'text-emerald-700' },
            cancelado:      { bg: 'bg-slate-100',   border: 'border-slate-300',   color: 'text-slate-600' },
        }[estado] ?? { bg: 'bg-slate-50', border: 'border-slate-200', color: 'text-slate-500' };
    },

    // ─────────────────────────────────────────────
    // VACÍO Y BÚSQUEDA
    // ─────────────────────────────────────────────

    _renderVacio() {
        return `
        <tr>
            <td colspan="8" class="py-20 text-center">
                <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                        <span class="material-symbols-outlined text-slate-300 text-[36px]">inbox</span>
                    </div>
                    <p class="text-sm font-black text-slate-400">Sin órdenes</p>
                    <p class="text-xs text-slate-300">No hay pedidos para el filtro seleccionado</p>
                </div>
            </td>
        </tr>`;
    },

    _contarPorEstado(pedidos) {
        const c = { total: pedidos.length, pendiente: 0, confirmado: 0, en_preparacion: 0, listo: 0, en_camino: 0, entregado: 0, cancelado: 0 };
        pedidos.forEach(p => { if (c[p.estado] !== undefined) c[p.estado]++; });
        return c;
    },

    _filtrar(pedidos) {
        const term   = this._estado.busqueda.toLowerCase();
        const desde  = this._estado.fechaDesde ? new Date(this._estado.fechaDesde + 'T00:00:00') : null;
        const hasta  = this._estado.fechaHasta ? new Date(this._estado.fechaHasta + 'T23:59:59') : null;

        return pedidos.filter(p => {
            if (term) {
                const cliente = `${p.usuario?.nombres ?? ''} ${p.usuario?.apellido_paterno ?? ''}`.toLowerCase();
                if (!cliente.includes(term) && !String(p.id).includes(term) && !(p.sucursal?.nombre ?? '').toLowerCase().includes(term))
                    return false;
            }
            if (desde || hasta) {
                const fecha = p.creado_at ? new Date(p.creado_at) : null;
                if (!fecha) return false;
                if (desde && fecha < desde) return false;
                if (hasta && fecha > hasta) return false;
            }
            return true;
        });
    },

    _bindBuscador(pedidos, filtroEstado) {
        const input      = document.getElementById('ped-buscador');
        const btnX       = document.getElementById('ped-btn-limpiar');
        const inputDesde = document.getElementById('ped-fecha-desde');
        const inputHasta = document.getElementById('ped-fecha-hasta');
        const btnFechas  = document.getElementById('ped-btn-limpiar-fechas');
        const tbody      = document.getElementById('ped-tbody');
        if (!tbody) return;

        const refrescar = () => {
            const res = this._filtrar(pedidos);
            tbody.innerHTML = res.length === 0 ? this._renderVacio() : res.map(p => this._renderFila(p)).join('');
        };

        input?.addEventListener('input', e => {
            this._estado.busqueda = e.target.value.trim();
            btnX?.classList.toggle('hidden', !this._estado.busqueda);
            refrescar();
        });
        btnX?.addEventListener('click', () => {
            input.value = ''; this._estado.busqueda = '';
            btnX.classList.add('hidden'); refrescar();
        });

        inputDesde?.addEventListener('change', e => {
            this._estado.fechaDesde = e.target.value;
            btnFechas?.classList.toggle('hidden', !this._estado.fechaDesde && !this._estado.fechaHasta);
            refrescar();
        });
        inputHasta?.addEventListener('change', e => {
            this._estado.fechaHasta = e.target.value;
            btnFechas?.classList.toggle('hidden', !this._estado.fechaDesde && !this._estado.fechaHasta);
            refrescar();
        });
        btnFechas?.addEventListener('click', () => {
            this._estado.fechaDesde = ''; this._estado.fechaHasta = '';
            if (inputDesde) inputDesde.value = '';
            if (inputHasta) inputHasta.value = '';
            btnFechas.classList.add('hidden'); refrescar();
        });
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
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">Listo</span>',
            text: msg, timer: 2200, showConfirmButton: false,
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    notificarError(msg) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error</span>',
            text: msg, confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    notificarInfo(msg) {
        Swal.fire({
            icon: 'info',
            title: '<span class="text-blue-600 font-black uppercase text-sm">Información</span>',
            text: msg, confirmButtonColor: '#2563eb',
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    async confirmarAccion(titulo, texto, icon = 'warning', btnText = 'CONFIRMAR') {
        const { isConfirmed } = await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">${titulo}</span>`,
            text: texto, icon,
            showCancelButton: true, reverseButtons: true,
            confirmButtonText: btnText, cancelButtonText: 'CANCELAR',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[32px] shadow-2xl',
                confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase',
                cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase'
            }
        });
        return isConfirmed;
    },
};

window.pedidoView = pedidoView;
