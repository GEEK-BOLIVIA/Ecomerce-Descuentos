export const dashboardView = {

    TITULOS_TABLA: {
        productos_stock: 'Productos & Stock',
        usuarios: 'Usuarios',
        categorias: 'Categorías',
        descuentos_combos: 'Descuentos & Combos',
        sucursales: 'Sucursales'
    },

    // ─── NOTIFICACIONES ───────────────────────────────────────────────────────
    mostrarCargando(msg = 'Procesando...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Cargando</span>',
            text: msg, allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    notificarError(msg) {
        Swal.fire({ icon: 'error', title: '<span class="text-red-600 font-black uppercase text-sm">Error</span>', text: msg, confirmButtonColor: '#2563eb', customClass: { popup: 'rounded-[32px]' } });
    },

    notificarInfo(msg) {
        Swal.fire({ icon: 'info', title: '<span class="text-blue-600 font-black uppercase text-sm">Sin resultados</span>', text: msg, confirmButtonColor: '#2563eb', customClass: { popup: 'rounded-[32px]' } });
    },

    // ─── RENDER GENERAL (HOME DASHBOARD) ─────────────────────────────────────
    renderGeneral({ resumen, stockBajo, roles, descuentos, porCategoria }) {
        const c = document.getElementById('content-area');
        if (!c) return;

        c.innerHTML = `
        <div class="p-8 animate-fade-in h-full overflow-y-auto">
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
                    <p class="text-slate-500 text-sm">Resumen general del sistema.</p>
                </div>
                <button onclick="dashboardController.abrirReportes()"
                    class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all">
                    <span class="material-symbols-outlined text-[20px]">assessment</span>
                    Generar Reportes
                </button>
            </div>

            <!-- KPIs -->
            <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
                ${this._kpiCard('inventory_2', 'Productos', resumen?.totalProductos ?? 0, 'blue')}
                ${this._kpiCard('category', 'Categorías', resumen?.totalCategorias ?? 0, 'indigo')}
                ${this._kpiCard('store', 'Sucursales', resumen?.totalSucursales ?? 0, 'emerald')}
                ${this._kpiCard('group', 'Usuarios', resumen?.totalUsuarios ?? 0, 'violet')}
                ${this._kpiCard('package_2', 'Combos', resumen?.totalCombos ?? 0, 'orange')}
                ${this._kpiCard('sell', 'Descuentos', resumen?.totalDescuentos ?? 0, 'rose')}
            </div>

            <!-- Gráficos -->
            <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
                <div class="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                    <h2 class="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Productos por Categoría</h2>
                    <div id="chart-categorias"></div>
                </div>
                <div class="bg-white border border-slate-200 rounded-3xl shadow-sm p-6">
                    <h2 class="text-xs font-black text-slate-600 uppercase tracking-widest mb-4">Usuarios por Rol</h2>
                    <div id="chart-roles"></div>
                </div>
            </div>

            <!-- Stock bajo + Descuentos -->
            <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div class="xl:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-orange-500 text-[22px]">warning</span>
                            <h2 class="text-xs font-black text-slate-600 uppercase tracking-widest">Stock Bajo (≤5)</h2>
                        </div>
                        <span class="text-[11px] font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">${stockBajo.length} alertas</span>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead><tr class="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase">
                                <th class="px-6 py-3">Producto</th>
                                <th class="px-6 py-3 text-center">Sucursal</th>
                                <th class="px-6 py-3 text-center">Stock</th>
                                <th class="px-6 py-3 text-center">Precio</th>
                            </tr></thead>
                            <tbody class="divide-y divide-slate-100">
                                ${stockBajo.length > 0 ? stockBajo.map(item => `
                                <tr class="hover:bg-orange-50/30 transition-colors">
                                    <td class="px-6 py-3"><div class="flex items-center gap-3">
                                        <img src="${item.producto?.imagen_url || 'https://placehold.co/40x40?text=P'}" class="w-9 h-9 rounded-xl object-cover border border-slate-100"/>
                                        <span class="text-sm font-bold text-slate-700 truncate max-w-[160px]">${item.producto?.nombre ?? '-'}</span>
                                    </div></td>
                                    <td class="px-6 py-3 text-center text-sm text-slate-500 font-medium">${item.sucursal?.nombre ?? '-'}</td>
                                    <td class="px-6 py-3 text-center"><span class="px-3 py-1 rounded-full text-[11px] font-black ${item.stock === 0 ? 'bg-red-100 text-red-600 border border-red-200' : 'bg-orange-100 text-orange-600 border border-orange-200'}">${item.stock}</span></td>
                                    <td class="px-6 py-3 text-center text-sm font-bold text-slate-600">${item.precio != null ? `Bs. ${Number(item.precio).toFixed(2)}` : '-'}</td>
                                </tr>`).join('') : `<tr><td colspan="4" class="px-6 py-10 text-center text-slate-400 text-sm italic">Sin alertas</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                    <div class="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
                        <span class="material-symbols-outlined text-rose-500 text-[22px]">sell</span>
                        <h2 class="text-xs font-black text-slate-600 uppercase tracking-widest">Descuentos Activos</h2>
                    </div>
                    <div class="overflow-x-auto">
                        <table class="w-full text-left">
                            <thead><tr class="bg-slate-50 text-[11px] font-bold text-slate-400 uppercase">
                                <th class="px-6 py-3">Nombre</th><th class="px-6 py-3 text-center">Tipo</th><th class="px-6 py-3 text-center">Valor</th>
                            </tr></thead>
                            <tbody class="divide-y divide-slate-100">
                                ${descuentos.length > 0 ? descuentos.map(d => `
                                <tr class="hover:bg-rose-50/30 transition-colors">
                                    <td class="px-6 py-3 text-sm font-bold text-slate-700">${d.nombre}</td>
                                    <td class="px-6 py-3 text-center"><span class="px-2 py-1 rounded-full text-[10px] font-black uppercase ${d.tipo === 'porcentaje' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}">${d._tipo_registro}</span></td>
                                    <td class="px-6 py-3 text-center text-sm font-bold text-slate-600">${d.valor_display}</td>
                                </tr>`).join('') : `<tr><td colspan="3" class="px-6 py-10 text-center text-slate-400 text-sm italic">Sin descuentos</td></tr>`}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>`;

        this._cargarApexCharts(() => {
            setTimeout(() => {
                const elCat = document.getElementById('chart-categorias');
                const elRol = document.getElementById('chart-roles');
                if (elCat) elCat.innerHTML = '';
                if (elRol) elRol.innerHTML = '';
                this._renderChartCategorias(porCategoria);
                this._renderChartRoles(roles);
            }, 50);
        });
    },

    // ─── RENDER MÓDULO REPORTES ───────────────────────────────────────────────
    renderReportes({ sucursales, categorias }) {
        const c = document.getElementById('content-area');
        if (!c) return;

        // Guardamos en memoria para los filtros dinámicos
        this._sucursales = sucursales;
        this._categorias = categorias;

        c.innerHTML = `
        <div class="p-8 animate-fade-in h-full overflow-y-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-8">
                <div class="flex items-center gap-3">
                    <button onclick="dashboardController.inicializar()"
                        class="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-[22px]">arrow_back</span>
                    </button>
                    <div>
                        <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Generador de Reportes</h1>
                        <p class="text-slate-500 text-sm">Selecciona una tabla, aplica filtros y exporta.</p>
                    </div>
                </div>
            </div>

            <!-- Paso 1: Selección de tabla -->
            <div class="bg-white border border-slate-200 rounded-3xl shadow-sm p-6 mb-6">
                <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">Paso 1 — Selecciona la tabla</p>
                <div class="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
                    ${[
                { key: 'productos_stock', icon: 'inventory_2', label: 'Productos & Stock', color: 'blue' },
                { key: 'usuarios', icon: 'group', label: 'Usuarios', color: 'violet' },
                { key: 'categorias', icon: 'category', label: 'Categorías', color: 'indigo' },
                { key: 'descuentos_combos', icon: 'sell', label: 'Descuentos & Combos', color: 'rose' },
                { key: 'sucursales', icon: 'store', label: 'Sucursales', color: 'emerald' }
            ].map(t => `
                        <button onclick="dashboardController.cambiarTabla('${t.key}')"
                            id="btn-tabla-${t.key}"
                            class="tabla-btn flex flex-col items-center gap-2 p-4 rounded-2xl border-2 border-slate-200 hover:border-${t.color}-400 hover:bg-${t.color}-50 transition-all group"
                            data-color="${t.color}">
                            <span class="material-symbols-outlined text-[28px] text-slate-400 group-hover:text-${t.color}-500">${t.icon}</span>
                            <span class="text-[11px] font-black text-slate-500 uppercase text-center leading-tight">${t.label}</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <!-- Paso 2: Filtros (se rellena dinámicamente) -->
            <div id="panel-filtros" class="hidden bg-white border border-slate-200 rounded-3xl shadow-sm p-6 mb-6"></div>

            <!-- Paso 3: Resultados (se rellena dinámicamente) -->
            <div id="panel-resultados"></div>
        </div>`;
    },

    // ─── RENDER FILTROS DINÁMICOS ─────────────────────────────────────────────
    renderFiltros(tabla) {
        const panel = document.getElementById('panel-filtros');
        if (!panel) return;
        panel.classList.remove('hidden');

        const sucursalOpts = (this._sucursales || []).map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
        const catOpts = (this._categorias || []).map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

        const filtrosPorTabla = {
            productos_stock: `
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    ${this._select('f-sucursal', 'Sucursal', `<option value="">Todas</option>${sucursalOpts}`)}
                    ${this._select('f-categoria', 'Categoría', `<option value="">Todas</option>${catOpts}`)}
                    ${this._select('f-visible', 'Estado', '<option value="">Todos</option><option value="true">Activo</option><option value="false">Inactivo</option>')}
                    ${this._input('f-stock-min', 'Stock mínimo', 'number', '0')}
                    ${this._input('f-stock-max', 'Stock máximo', 'number', '')}
                    ${this._input('f-precio-min', 'Precio mínimo (Bs.)', 'number', '')}
                    ${this._input('f-precio-max', 'Precio máximo (Bs.)', 'number', '')}
                </div>`,

            usuarios: `
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    ${this._select('f-rol', 'Rol', '<option value="">Todos</option><option value="owner">Owner</option><option value="admin">Admin</option><option value="supervisor">Supervisor</option><option value="cliente">Cliente</option>')}
                    ${this._select('f-visible', 'Estado', '<option value="">Todos</option><option value="true">Activo</option><option value="false">Inactivo</option>')}
                </div>`,

            categorias: `
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    ${this._select('f-tipo-cat', 'Tipo', '<option value="">Todos</option><option value="padre">Solo Categorías</option><option value="hijo">Solo Subcategorías</option>')}
                </div>`,

            descuentos_combos: `
                <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    ${this._select('f-activo', 'Estado', '<option value="">Todos</option><option value="true">Activo</option><option value="false">Inactivo</option>')}
                    ${this._select('f-alcance', 'Alcance', '<option value="">Todos</option><option value="global">Global</option><option value="sucursal">Por Sucursal</option>')}
                    ${this._select('f-tipo-desc', 'Tipo de valor', '<option value="">Todos</option><option value="porcentaje">Porcentaje</option><option value="fijo">Precio Fijo</option>')}
                    ${this._input('f-fecha-desde', 'Desde (fecha)', 'date', '')}
                    ${this._input('f-fecha-hasta', 'Hasta (fecha)', 'date', '')}
                </div>`,

            sucursales: `<p class="text-slate-400 text-sm italic">Sin filtros adicionales para sucursales.</p>`
        };

        panel.innerHTML = `
            <p class="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4">
                Paso 2 — Filtros: <span class="text-blue-600">${this.TITULOS_TABLA[tabla]}</span>
            </p>
            ${filtrosPorTabla[tabla] || ''}
            <div class="flex justify-end mt-5">
                <button onclick="dashboardController.generarReporte()"
                    class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all">
                    <span class="material-symbols-outlined text-[20px]">play_arrow</span>
                    Generar Reporte
                </button>
            </div>`;

        // Resaltar botón tabla activo
        document.querySelectorAll('.tabla-btn').forEach(btn => {
            btn.classList.remove('border-blue-500', 'bg-blue-50');
            btn.classList.add('border-slate-200');
        });
        const activo = document.getElementById(`btn-tabla-${tabla}`);
        if (activo) {
            activo.classList.remove('border-slate-200');
            activo.classList.add('border-blue-500', 'bg-blue-50');
        }
    },

    limpiarResultados() {
        const p = document.getElementById('panel-resultados');
        if (p) p.innerHTML = '';
    },

    // ─── LEER FILTROS DEL DOM ─────────────────────────────────────────────────
    leerFiltros() {
        const val = id => document.getElementById(id)?.value || null;
        const num = id => { const v = document.getElementById(id)?.value; return v !== '' && v != null ? Number(v) : null; };
        const bool = id => { const v = val(id); return v === 'true' ? true : v === 'false' ? false : null; };

        return {
            id_sucursal: val('f-sucursal') || null,
            id_categoria: val('f-categoria') || null,
            visible: bool('f-visible'),
            stock_min: num('f-stock-min'),
            stock_max: num('f-stock-max'),
            precio_min: num('f-precio-min'),
            precio_max: num('f-precio-max'),
            rol: val('f-rol') || null,
            tipo: val('f-tipo-cat') || null,
            activo: bool('f-activo'),
            alcance: val('f-alcance') || null,
            tipo_desc: val('f-tipo-desc') || null,
            fecha_desde: val('f-fecha-desde') || null,
            fecha_hasta: val('f-fecha-hasta') || null,
        };
    },

    // ─── RENDER RESULTADOS ────────────────────────────────────────────────────
    renderResultados(tabla, datos) {
        const panel = document.getElementById('panel-resultados');
        if (!panel) return;

        const columnas = this.obtenerColumnasExport(tabla);

        panel.innerHTML = `
        <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
            <!-- Header resultados -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div>
                    <h2 class="text-xs font-black text-slate-600 uppercase tracking-widest">
                        Resultados — ${this.TITULOS_TABLA[tabla]}
                    </h2>
                    <p class="text-[11px] text-slate-400 mt-0.5">${datos.length} registros encontrados</p>
                </div>
                <!-- Botones exportar -->
                <div class="flex items-center gap-2">
                    <button onclick="dashboardController.exportarCSV()"
                        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase transition-all border border-slate-200">
                        <span class="material-symbols-outlined text-[18px]">download</span> CSV
                    </button>
                    <button onclick="dashboardController.exportarExcel()"
                        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs uppercase transition-all border border-emerald-200">
                        <span class="material-symbols-outlined text-[18px]">table_view</span> Excel
                    </button>
                    <button onclick="dashboardController.exportarPDF()"
                        class="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs uppercase transition-all border border-rose-200">
                        <span class="material-symbols-outlined text-[18px]">picture_as_pdf</span> PDF
                    </button>
                </div>
            </div>

            <!-- Gráfico -->
            <div class="px-6 pt-6 pb-2">
                <div id="chart-reporte"></div>
            </div>

            <!-- Tabla -->
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                            <th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase w-16 text-center">N°</th>
                            ${columnas.map(c => `<th class="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase">${c.label}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${datos.map((row, i) => `
                        <tr class="hover:bg-blue-50/30 transition-colors">
                            <td class="px-6 py-3 text-sm text-slate-400 font-bold text-center">${i + 1}</td>
                            ${columnas.map(c => `<td class="px-6 py-3 text-sm text-slate-700 font-medium">${c.fn ? c.fn(row) : (row[c.key] ?? '-')}</td>`).join('')}
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;

        this._cargarApexCharts(() => {
            requestAnimationFrame(() => this._renderChartReporte(tabla, datos));
        });
    },

    // ─── COLUMNAS POR TABLA (para tabla + export) ─────────────────────────────
    obtenerColumnasExport(tabla) {
        const mapas = {
            productos_stock: [
                { label: 'Producto', key: 'producto', fn: r => r.producto?.nombre ?? '-' },
                { label: 'Código', key: 'producto', fn: r => r.producto?.codigo ?? '-' },
                { label: 'Sucursal', key: 'sucursal', fn: r => r.sucursal?.nombre ?? '-' },
                { label: 'Stock', key: 'stock', fn: r => r.stock },
                { label: 'Precio (Bs.)', key: 'precio', fn: r => r.precio != null ? Number(r.precio).toFixed(2) : '-' },
                { label: 'Visible', key: 'visible', fn: r => r.visible ? 'Sí' : 'No' }
            ],
            usuarios: [
                { label: 'Nombres', fn: r => `${r.nombres} ${r.apellido_paterno}` },
                { label: 'CI', key: 'ci' },
                { label: 'Correo', key: 'correo_electronico' },
                { label: 'Celular', key: 'celular' },
                { label: 'Rol', key: 'rol', fn: r => r.rol.charAt(0).toUpperCase() + r.rol.slice(1) },
                { label: 'Estado', fn: r => r.visible ? 'Activo' : 'Inactivo' }
            ],
            categorias: [
                { label: 'Nombre', key: 'nombre' },
                { label: 'Tipo', key: 'tipo' },
                { label: 'Categoría Padre', fn: r => r.nombre_padre }
            ],
            descuentos_combos: [
                { label: 'Tipo Registro', key: '_tipo_registro' },
                { label: 'Nombre', key: 'nombre' },
                { label: 'Tipo Valor', key: 'tipo' },
                { label: 'Valor', fn: r => r.valor_display },
                { label: 'Alcance', key: 'alcance' },
                { label: 'Sucursal', fn: r => r.sucursal?.nombre ?? 'Global' },
                { label: 'Activo', fn: r => r.activo ? 'Sí' : 'No' },
                { label: 'Vence', fn: r => r.fecha_fin ? new Date(r.fecha_fin).toLocaleDateString('es-BO') : '∞' }
            ],
            sucursales: [
                { label: 'Nombre', key: 'nombre' },
                { label: 'Dirección', key: 'direccion' },
                { label: 'Productos', key: 'totalProductos' },
                { label: 'Stock Total', key: 'stockTotal' }
            ]
        };
        return mapas[tabla] || [];
    },

    // ─── GRÁFICO DEL REPORTE ──────────────────────────────────────────────────
    _renderChartReporte(tabla, datos) {
        const el = document.getElementById('chart-reporte');
        if (!el || !datos.length) return;

        let opts = null;

        if (tabla === 'productos_stock') {
            // Top 10 productos por stock
            const top = [...datos].sort((a, b) => b.stock - a.stock).slice(0, 10);
            opts = {
                chart: { type: 'bar', height: 260, toolbar: { show: false } },
                plotOptions: { bar: { borderRadius: 5, horizontal: true } },
                dataLabels: { enabled: false },
                series: [{ name: 'Stock', data: top.map(r => r.stock) }],
                xaxis: { categories: top.map(r => r.producto?.nombre ?? '-'), labels: { style: { fontSize: '11px' } } },
                colors: ['#3b82f6'], grid: { borderColor: '#f1f5f9' }
            };
        } else if (tabla === 'usuarios') {
            const conteo = {};
            datos.forEach(u => { conteo[u.rol] = (conteo[u.rol] || 0) + 1; });
            opts = {
                chart: { type: 'donut', height: 260 },
                series: Object.values(conteo),
                labels: Object.keys(conteo).map(r => r.charAt(0).toUpperCase() + r.slice(1)),
                colors: ['#3b82f6', '#6366f1', '#10b981', '#8b5cf6'],
                legend: { position: 'bottom', fontSize: '11px' },
                plotOptions: { pie: { donut: { size: '55%' } } }
            };
        } else if (tabla === 'categorias') {
            const padres = datos.filter(c => c.tipo === 'Categoría').length;
            const hijos = datos.filter(c => c.tipo === 'Subcategoría').length;
            opts = {
                chart: { type: 'donut', height: 260 },
                series: [padres, hijos],
                labels: ['Categorías', 'Subcategorías'],
                colors: ['#6366f1', '#10b981'],
                legend: { position: 'bottom', fontSize: '11px' },
                plotOptions: { pie: { donut: { size: '55%' } } }
            };
        } else if (tabla === 'descuentos_combos') {
            const desc = datos.filter(d => d._tipo_registro === 'Descuento').length;
            const combo = datos.filter(d => d._tipo_registro === 'Combo').length;
            opts = {
                chart: { type: 'bar', height: 260, toolbar: { show: false } },
                plotOptions: { bar: { borderRadius: 6, columnWidth: '40%' } },
                dataLabels: { enabled: true },
                series: [{ name: 'Cantidad', data: [desc, combo] }],
                xaxis: { categories: ['Descuentos', 'Combos'] },
                colors: ['#f43f5e', '#f97316'], grid: { borderColor: '#f1f5f9' }
            };
        } else if (tabla === 'sucursales') {
            opts = {
                chart: { type: 'bar', height: 260, toolbar: { show: false } },
                plotOptions: { bar: { borderRadius: 5, columnWidth: '55%' } },
                dataLabels: { enabled: false },
                series: [{ name: 'Stock Total', data: datos.map(s => s.stockTotal) }],
                xaxis: { categories: datos.map(s => s.nombre), labels: { style: { fontSize: '11px' } } },
                colors: ['#10b981'], grid: { borderColor: '#f1f5f9' }
            };
        }

        if (opts) new ApexCharts(el, opts).render();
    },

    // ─── GRÁFICOS GENERALES ───────────────────────────────────────────────────
    _renderChartCategorias(porCategoria) {
        const el = document.getElementById('chart-categorias');
        if (!el) return;
        if (!porCategoria.length) { el.innerHTML = '<p class="text-slate-400 text-sm italic text-center py-8">Sin datos</p>'; return; }
        new ApexCharts(el, {
            chart: { type: 'bar', height: 300, toolbar: { show: false } },
            plotOptions: { bar: { borderRadius: 6, columnWidth: '55%' } },
            dataLabels: { enabled: false },
            series: [{ name: 'Productos', data: porCategoria.map(d => d.total) }],
            xaxis: { categories: porCategoria.map(d => d.nombre), labels: { style: { fontSize: '11px', fontWeight: 700 } } },
            colors: ['#3b82f6'], grid: { borderColor: '#f1f5f9' },
            tooltip: { y: { formatter: v => `${v} producto(s)` } }
        }).render();
    },

    _renderChartRoles(roles) {
        const el = document.getElementById('chart-roles');
        if (!el) return;
        const conDatos = roles.filter(r => r.total > 0);
        if (!conDatos.length) { el.innerHTML = '<p class="text-slate-400 text-sm italic text-center py-8">Sin usuarios</p>'; return; }
        new ApexCharts(el, {
            chart: { type: 'donut', height: 300 },
            series: conDatos.map(r => r.total),
            labels: conDatos.map(r => r.rol.charAt(0).toUpperCase() + r.rol.slice(1)),
            colors: ['#3b82f6', '#6366f1', '#10b981', '#8b5cf6'],
            legend: { position: 'bottom', fontSize: '12px', fontWeight: 700 },
            tooltip: { y: { formatter: v => `${v} usuario(s)` } },
            plotOptions: { pie: { donut: { size: '60%' } } }
        }).render();
    },

    // ─── HELPERS ──────────────────────────────────────────────────────────────
    _cargarApexCharts(cb) {
        if (window.ApexCharts) { cb(); return; }
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/apexcharts';
        s.onload = cb;
        document.head.appendChild(s);
    },

    _kpiCard(icon, label, value, color) {
        const c = { blue: ['bg-blue-50', 'text-blue-600', 'border-blue-100'], indigo: ['bg-indigo-50', 'text-indigo-600', 'border-indigo-100'], emerald: ['bg-emerald-50', 'text-emerald-600', 'border-emerald-100'], violet: ['bg-violet-50', 'text-violet-600', 'border-violet-100'], orange: ['bg-orange-50', 'text-orange-600', 'border-orange-100'], rose: ['bg-rose-50', 'text-rose-600', 'border-rose-100'] }[color] || ['bg-blue-50', 'text-blue-600', 'border-blue-100'];
        return `<div class="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col gap-3">
            <div class="w-10 h-10 ${c[0]} ${c[2]} border rounded-2xl flex items-center justify-center">
                <span class="material-symbols-outlined ${c[1]} text-[22px]">${icon}</span>
            </div>
            <div><p class="text-2xl font-black text-slate-800">${value}</p>
            <p class="text-[11px] font-bold text-slate-400 uppercase tracking-widest">${label}</p></div>
        </div>`;
    },

    _select(id, label, opciones) {
        return `<div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${label}</label>
            <select id="${id}" class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500">
                ${opciones}
            </select>
        </div>`;
    },

    _input(id, label, type = 'text', placeholder = '') {
        return `<div class="flex flex-col gap-1.5">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">${label}</label>
            <input id="${id}" type="${type}" placeholder="${placeholder}"
                class="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl px-3 py-2.5 font-medium outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"/>
        </div>`;
    }
};

window.dashboardView = dashboardView;