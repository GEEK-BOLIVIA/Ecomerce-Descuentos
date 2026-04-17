import { productManager } from '../modals/createProduct.js';
import { PaginationHelper } from '../utils/paginationHelper.js';
import { productoStatsCards } from './components/productoStatsCards.js';
import { productoFiltros } from './components/productoFiltros.js';
import { productoTabla } from './components/productoTabla.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const productoView = {

    _estado: {
        busqueda: '',
        categoriasSeleccionadas: [],
        sucursalSeleccionada: 'todas',
        orden: 'desc',
        paginaActual: 1,
        filasPorPagina: 10,
        filtroStock: 'todos',
        cargando: false,
    },

    // Datos auxiliares cacheados entre renders
    _categoriasDisponibles: [],
    _maestroCategorias: [],
    _sucursalesDisponibles: [],

    // ─────────────────────────────────────────────
    // LÓGICA DE SELECCIÓN POR LOTE (CORREGIDA)
    // ─────────────────────────────────────────────

    toggleLote(id) {
        selectorUtil.toggle(id, (cant) => this._actualizarBarraFlotante(cant));
        const fila = document.querySelector(`input[data-id="${id}"]`)?.closest('tr');
        if (fila) {
            const isChecked = selectorUtil.estado.seleccionados.includes(String(id));
            fila.classList.toggle('bg-blue-50/70', isChecked);
        }
    },

    toggleLoteTodos() {
        const datosVisibles = this._filtrarDatos(window.productosRaw || []);
        const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
        const paged = datosVisibles.slice(inicio, inicio + this._estado.filasPorPagina);

        // 1. Actualizamos el estado en el utilitario
        selectorUtil.toggleTodos(paged, (cant) => this._actualizarBarraFlotante(cant));

        // 2. En lugar de refrescar toda la vista, manipulamos el DOM existente
        const checks = document.querySelectorAll('input[onchange*="toggleLote"]');
        const isAllChecked = selectorUtil.estado.seleccionados.length >= paged.length;

        checks.forEach(chk => {
            chk.checked = isAllChecked;
            const fila = chk.closest('tr');
            if (fila) {
                fila.classList.toggle('bg-blue-50/70', isAllChecked);
            }
        });

        // 3. Sincronizamos el check del encabezado (el de "seleccionar todos")
        const checkMaster = document.getElementById('check-all-master');
        if (checkMaster) checkMaster.checked = isAllChecked;
    },
    limpiarSeleccion() {
        selectorUtil.limpiar((cant) => this._actualizarBarraFlotante(cant));
        productoController.refrescarVista();
    },

    limpiarSeleccionLote() {
        this.limpiarSeleccion();
    },

    accionLote(accion, valor = null) {
        const ids = selectorUtil.estado.seleccionados;
        if (ids.length === 0) return;

        if (accion === 'eliminar') {
            this.confirmarEliminacionMasiva(ids);
        } else {
            const campo = (accion === 'whatsapp' || accion === 'habilitar_whatsapp') ? 'habilitar_whatsapp' : 'mostrar_precio';
            productoController.toggleMasivoFiltrado(campo, valor, ids);
        }
    },

    _renderBarraFlotante() {
        return `
        <div id="bulk-actions-bar" 
             class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] 
                    translate-y-28 opacity-0 pointer-events-none
                    transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)">
            <div class="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-2">
                
                <div class="flex items-center gap-3 px-4 py-2 border-r border-slate-100 mr-1">
                    <div class="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-200 shadow-lg">
                        <span class="material-symbols-outlined text-white text-xl">inventory_2</span>
                    </div>
                    <div class="flex flex-col">
                        <span id="lote-contador-texto" class="text-[13px] font-bold text-slate-800 leading-none">0 seleccionados</span>
                        <span class="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Acciones masivas</span>
                    </div>
                </div>

                <button onclick="productoView.accionLote('whatsapp', true)"
                        class="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-all duration-300 group">
                    <i class="fa-brands fa-whatsapp text-xl group-hover:scale-110 transition-transform"></i>
                    <span class="text-[11px] font-black uppercase tracking-tight">Activar WS</span>
                </button>

                <button onclick="productoView.accionLote('whatsapp', false)"
                        class="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-slate-50 text-slate-500 hover:bg-slate-800 hover:text-white transition-all duration-300 group">
                    <i class="fa-brands fa-whatsapp text-xl opacity-60 group-hover:opacity-100 transition-opacity"></i>
                    <span class="text-[11px] font-black uppercase tracking-tight">Desactivar WS</span>
                </button>

                <div class="w-px h-10 bg-slate-100 mx-1"></div>

                <button onclick="productoView.accionLote('eliminar')"
                        class="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300 group">
                    <span class="material-symbols-outlined text-lg group-hover:shake transition-transform">delete_sweep</span>
                    <span class="text-[11px] font-black uppercase tracking-tight">Eliminar</span>
                </button>

                <button onclick="productoView.limpiarSeleccion()"
                        class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all ml-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>`;
    },

    _actualizarBarraFlotante(cantidad) {
        const barra = document.getElementById('bulk-actions-bar');
        const contador = barra?.querySelector('#lote-contador-texto');

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

    // ─────────────────────────────────────────────
    // NOTIFICACIONES
    // ─────────────────────────────────────────────
    notificarExito(mensaje) {
        Swal.fire({
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">¡Éxito!</span>',
            text: mensaje,
            timer: 2000,
            showConfirmButton: false,
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    notificarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error</span>',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    mostrarCargando(mensaje = 'Procesando...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Cargando</span>',
            text: mensaje,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    mostrarSkeleton() {
        this._estado.cargando = true;
        const tbody = document.querySelector('#content-area tbody');
        if (tbody) {
            tbody.innerHTML = productoTabla.renderSkeletonFilas(this._estado.filasPorPagina);
        }
    },

    // ─────────────────────────────────────────────
    // RENDER PRINCIPAL (CORREGIDO)
    // ─────────────────────────────────────────────
    render(productos, todasLasCategorias = [], sucursales = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        this._sucursalesDisponibles = sucursales;

        const activeElementId = document.activeElement?.id ?? null;
        const cursorPosition = document.activeElement?.selectionStart ?? null;

        if (todasLasCategorias.length > 0) {
            this._categoriasDisponibles = todasLasCategorias.map(c => c.nombre || c).filter(Boolean);
            this._maestroCategorias = todasLasCategorias;
        }

        const filtrados = this._ordenarDatos(this._filtrarDatos(productos));
        window.productosMostrados = filtrados;

        const todosConWhatsapp = filtrados.length > 0 && filtrados.every(p => p.habilitar_whatsapp);
        const todosConPrecio = filtrados.length > 0 && filtrados.every(p => p.mostrar_precio);

        const stats = {
            total: productos.length,
            conStock: productos.filter(p => p.stock > 0).length,
            bajoStock: productos.filter(p => p.stock > 0 && p.stock <= 5).length,
            agotados: productos.filter(p => p.stock === 0).length,
        };

        const renderSwitch = this._renderSwitch.bind(this);
        const renderEtiquetas = this._renderEtiquetasFiltro.bind(this);
        const renderPag = (total) => this._generarPaginacion(total);
        const getColor = this._obtenerColorCategoria.bind(this);

        contenedor.innerHTML = `
        <style>
            .select-clean {
                appearance: none !important; -webkit-appearance: none !important;
                -moz-appearance: none !important; background-image: none !important;
            }
            .select-clean::-ms-expand { display: none !important; }
            #suggestions-panel { transition: opacity 0.2s ease; }
            .stat-card  { transition: transform 0.15s ease, box-shadow 0.15s ease; }
            .stat-card:hover { transform: translateY(-3px); box-shadow: 0 10px 32px rgba(0,0,0,0.08); }
            .stock-btn  { transition: all 0.15s ease; }
        </style>

        <div class="p-8 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto pb-32">

            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Inventario</h1>
                    <p class="text-slate-500 text-sm mt-0.5">
                        Sucursal: <span class="font-bold text-blue-600">${this._obtenerNombreSucursalActual()}</span>
                    </p>
                </div>
                <button onclick="productoController.mostrarFormularioCrear()"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md font-bold text-sm flex items-center gap-2 self-start md:self-auto">
                    <span class="material-symbols-outlined text-[20px]">add_box</span> Nuevo Producto
                </button>
            </div>

            ${productoStatsCards.render(productos)}

            ${productoFiltros.render(
            this._estado,
            this._sucursalesDisponibles,
            this._obtenerNombreSucursalActual(),
            todosConWhatsapp,
            todosConPrecio,
            stats,
            renderSwitch,
            renderEtiquetas
        )}

            ${productoTabla.render(filtrados, this._estado, renderSwitch, renderPag, getColor)}

            ${this._renderBarraFlotante()}

        </div>`;

        // Sincronización de UI después del render
        setTimeout(() => {
            selectorUtil.sincronizarChecks();
            this._actualizarBarraFlotante(selectorUtil.estado.seleccionados.length);
        }, 0);

        if (activeElementId) {
            setTimeout(() => {
                const el = document.getElementById(activeElementId);
                if (el) {
                    el.focus();
                    if (cursorPosition !== null && el.tagName === 'INPUT') {
                        el.setSelectionRange(cursorPosition, cursorPosition);
                    }
                }
            }, 0);
        }
    },

    // ─────────────────────────────────────────────
    // HELPERS DE RENDER
    // ─────────────────────────────────────────────

    _obtenerColorCategoria(nombre) {
        if (!nombre) return 'bg-slate-100 text-slate-500';
        const paleta = [
            'bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700',
            'bg-violet-100 text-violet-700', 'bg-cyan-100 text-cyan-700',
            'bg-indigo-100 text-indigo-700', 'bg-lime-100 text-lime-700',
            'bg-fuchsia-100 text-fuchsia-700', 'bg-sky-100 text-sky-700',
            'bg-teal-100 text-teal-700'
        ];
        let hash = 0;
        for (let i = 0; i < nombre.length; i++) hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
        return paleta[Math.abs(hash) % paleta.length];
    },

    _renderSwitch(id, campo, valor, color, esGlobal = false, nombreObj = '') {
        const checked = valor ? 'checked' : '';
        const params = `'${id}', '${campo}', ${valor}, ${esGlobal}, '${String(nombreObj).replace(/'/g, "\\'")}'`;
        return `
        <div class="flex justify-center">
            <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" class="sr-only peer" ${checked}
                       onclick="event.preventDefault(); productoView.confirmarCambioSwitch(${params})">
                <div class="w-9 h-5 bg-slate-200 rounded-full peer
                            peer-checked:after:translate-x-full peer-checked:after:border-white
                            after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                            after:bg-white after:border-gray-300 after:border after:rounded-full
                            after:h-4 after:w-4 after:transition-all
                            peer-checked:bg-${color}-500 shadow-inner"></div>
            </label>
        </div>`;
    },

    _renderEtiquetasFiltro() {
        if (this._estado.categoriasSeleccionadas.length === 0) return '';
        return `
        <div class="flex flex-wrap items-center gap-2 animate-fade-in">
            <span class="text-[10px] font-black text-slate-400 uppercase mr-2">Filtros Activos:</span>
            ${this._estado.categoriasSeleccionadas.map(cat => `
                <div class="flex items-center gap-2 bg-blue-600 text-white pl-3 pr-1 py-1 rounded-full text-[11px] font-bold shadow-sm">
                    ${cat.toUpperCase()}
                    <button onclick="productoView.quitarFiltroCategoria('${cat}')"
                            class="hover:bg-blue-500 rounded-full w-5 h-5 flex items-center justify-center transition-colors">
                        <span class="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            `).join('')}
            <button onclick="productoView.limpiarFiltros()"
                    class="text-[10px] font-black text-red-500 hover:text-red-700 uppercase ml-2 underline">
                Limpiar Todo
            </button>
        </div>`;
    },

    _generarPaginacion(total) {
        return PaginationHelper.render(total, this._estado.filasPorPagina, this._estado.paginaActual, 'productoView');
    },

    _obtenerNombreSucursalActual() {
        if (this._estado.sucursalSeleccionada === 'todas') return 'Todas las sucursales';
        const suc = (this._sucursalesDisponibles || []).find(s => s.id == this._estado.sucursalSeleccionada);
        return suc ? suc.nombre : 'Sucursal seleccionada';
    },

    _filtrarDatos(d) {
        let r = [...d];
        if (this._estado.sucursalSeleccionada !== 'todas') {
            r = r.filter(x => x.id_sucursal == this._estado.sucursalSeleccionada);
        }
        if (this._estado.busqueda) {
            const t = this._estado.busqueda.toLowerCase();
            r = r.filter(x =>
                x.nombre?.toLowerCase().includes(t) ||
                x.nombre_categoria?.toLowerCase().includes(t) ||
                x.categoria_padre_nombre?.toLowerCase().includes(t)
            );
        }
        if (this._estado.categoriasSeleccionadas.length > 0) {
            r = r.filter(x =>
                this._estado.categoriasSeleccionadas.includes(x.nombre_categoria) ||
                this._estado.categoriasSeleccionadas.includes(x.categoria_nombre) ||
                this._estado.categoriasSeleccionadas.includes(x.categoria_padre_nombre)
            );
        }
        if (this._estado.filtroStock === 'con-stock') {
            r = r.filter(x => x.stock > 0);
        } else if (this._estado.filtroStock === 'bajo-stock') {
            r = r.filter(x => x.stock > 0 && x.stock <= 5);
        } else if (this._estado.filtroStock === 'agotados') {
            r = r.filter(x => x.stock === 0);
        }
        return r;
    },

    _ordenarDatos(d) {
        return [...d].sort((a, b) =>
            this._estado.orden === 'asc'
                ? a.nombre.localeCompare(b.nombre)
                : b.nombre.localeCompare(a.nombre)
        );
    },

    gestionarBusqueda(v) {
        this._estado.busqueda = v;
        this._estado.paginaActual = 1;
        this.mostrarSkeleton();
        productoController.refrescarVista();
    },

    limpiarBusquedaRapida() {
        this._estado.busqueda = '';
        this._estado.paginaActual = 1;
        productoController.refrescarVista();
        setTimeout(() => document.getElementById('main-search-input')?.focus(), 50);
    },

    gestionarOrden() {
        this._estado.orden = this._estado.orden === 'asc' ? 'desc' : 'asc';
        productoController.refrescarVista();
    },

    gestionarCambioSucursal(idSucursal) {
        this._estado.sucursalSeleccionada = idSucursal;
        this._estado.paginaActual = 1;
        this.mostrarCargando('Sincronizando inventario...');
        productoController.refrescarVista();
    },

    gestionarFiltroStock(filtro) {
        this._estado.filtroStock = filtro;
        this._estado.paginaActual = 1;
        this.mostrarSkeleton();
        productoController.refrescarVista();
    },

    agregarFiltroCategoria(cat) {
        if (!this._estado.categoriasSeleccionadas.includes(cat)) {
            this._estado.categoriasSeleccionadas.push(cat);
            this._estado.paginaActual = 1;
            this._estado.busqueda = '';
            productoController.refrescarVista();
        }
    },

    quitarFiltroCategoria(cat) {
        this._estado.categoriasSeleccionadas = this._estado.categoriasSeleccionadas.filter(c => c !== cat);
        productoController.refrescarVista();
    },

    limpiarFiltros() {
        this._estado.categoriasSeleccionadas = [];
        this._estado.busqueda = '';
        this._estado.filtroStock = 'todos';
        productoController.refrescarVista();
    },

    cambiarPagina(p) {
        this._estado.paginaActual = p;
        this.mostrarSkeleton();
        productoController.refrescarVista();
    },

    filtrarSugerencias(query) {
        const panel = document.getElementById('suggestions-panel');
        if (!panel) return;
        const coincidencias = this._categoriasDisponibles.filter(cat =>
            cat.toLowerCase().includes(query.toLowerCase()) &&
            !this._estado.categoriasSeleccionadas.includes(cat)
        );
        if (query === '' || coincidencias.length === 0) {
            if (query === '') { panel.classList.add('hidden'); return; }
            panel.classList.remove('hidden');
            panel.innerHTML = `<div class="p-4 text-xs font-bold text-slate-400 text-center">Sin resultados</div>`;
            return;
        }
        panel.classList.remove('hidden');
        panel.innerHTML = coincidencias.map(cat => `
            <div onclick="productoView.agregarFiltroCategoria('${cat}')"
                 class="px-4 py-3 hover:bg-blue-50 rounded-xl cursor-pointer text-sm font-medium text-slate-700 transition-colors">
                ${cat}
            </div>
        `).join('');
    },

    confirmarCambioSwitch(id, campo, valorActual, esGlobal, nombre) {
        const nuevoEstado = !valorActual;
        const esWhatsApp = campo === 'ws_active' || campo === 'habilitar_whatsapp';
        const etiqueta = esWhatsApp ? 'WhatsApp' : 'Precio';
        const accion = nuevoEstado ? 'ACTIVAR' : 'DESACTIVAR';

        if (esGlobal) {
            const fuenteDatos = window.productosRaw || [];
            const filtrados = this._filtrarDatos(fuenteDatos);
            const productosAActualizar = filtrados.filter(p => p[campo] !== nuevoEstado);
            const cantidad = productosAActualizar.length;
            const ids = productosAActualizar.map(p => p.id);

            if (cantidad === 0) {
                return Swal.fire({
                    icon: 'info',
                    title: `<span class="text-xs font-black uppercase text-slate-800">Sin cambios</span>`,
                    text: `Todos los productos ya tienen ${etiqueta} ${nuevoEstado ? 'activado' : 'desactivado'}.`,
                    confirmButtonColor: '#3b82f6',
                    customClass: { popup: 'rounded-[32px]' }
                });
            }

            Swal.fire({
                title: `<span class="text-blue-600 font-black uppercase text-xs">¿${accion} UNIVERSAL?</span>`,
                html: `<p class="text-sm text-slate-600">Se han detectado <b>${cantidad}</b> productos con <b>${etiqueta}</b> ${nuevoEstado ? 'apagado' : 'encendido'}.<br>¿Deseas ${accion.toLowerCase()}los todos?</p>`,
                icon: 'question',
                showCancelButton: true,
                reverseButtons: true,
                confirmButtonText: `SÍ, ${accion} (${cantidad})`,
                cancelButtonText: 'CANCELAR',
                confirmButtonColor: nuevoEstado ? '#10b981' : '#ef4444',
                customClass: {
                    popup: 'rounded-[32px] shadow-2xl',
                    confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase',
                    cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase'
                }
            }).then(r => {
                if (r.isConfirmed) productoController.toggleMasivoFiltrado(campo, nuevoEstado, ids);
            });

        } else {
            Swal.fire({
                title: `<span class="text-slate-800 font-black uppercase text-xs">Confirmar cambio</span>`,
                html: `<p class="text-sm text-slate-600">¿Deseas ${accion.toLowerCase()} <b>${etiqueta}</b> para <b>${nombre.toUpperCase()}</b>?</p>`,
                icon: 'question',
                showCancelButton: true,
                reverseButtons: true,
                confirmButtonText: `SÍ, ${accion}`,
                cancelButtonText: 'CANCELAR',
                confirmButtonColor: nuevoEstado ? '#10b981' : '#3b82f6',
                customClass: {
                    popup: 'rounded-[32px] shadow-2xl',
                    confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase',
                    cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase'
                }
            }).then(r => {
                if (r.isConfirmed) productoController.toggleEstado(id, campo, nuevoEstado);
            });
        }
    },

    confirmarEliminacion(dataEncoded) {
        try {
            const p = JSON.parse(decodeURIComponent(escape(atob(dataEncoded))));
            productoController.eliminar(p.id);
        } catch (error) {
            console.error('Error al procesar eliminación:', error);
            this.notificarError('No se pudo procesar la solicitud de eliminación.');
        }
    },

    confirmarEliminacionMasiva(ids) {
        if (!ids || ids.length === 0) return;
        Swal.fire({
            title: `<span class="text-red-600 font-black uppercase text-xs">¿ELIMINAR ${ids.length} PRODUCTOS?</span>`,
            html: `<p class="text-sm text-slate-600">Esta acción no se puede deshacer. Los productos seleccionados se borrarán del inventario permanentemente.</p>`,
            icon: 'warning',
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: 'SÍ, ELIMINAR TODO',
            cancelButtonText: 'CANCELAR',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[32px] shadow-2xl',
                confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase',
                cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase'
            }
        }).then(r => {
            if (r.isConfirmed) {
                productoController.eliminarMasivo?.(ids);
            }
        });
    },

    async mostrarDetalle(p) {
        const niveles = p.nombre_categoria ? p.nombre_categoria.split(' > ') : ['General'];
        Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-xs tracking-widest">Ficha de Producto</span>`,
            html: `
            <div class="text-left space-y-6">
                <div class="flex gap-4 items-start bg-slate-50 p-4 rounded-[24px] border border-slate-100">
                    <img src="${p.imagen_url}" class="w-24 h-24 rounded-2xl object-cover shadow-md border-2 border-white">
                    <div class="flex-1">
                        <h3 class="text-lg font-bold text-slate-800 leading-tight uppercase mb-1">${p.nombre}</h3>
                        <div class="flex flex-wrap items-center gap-1">
                            ${niveles.map((n, i) => `
                                <span class="text-[10px] font-bold ${i === niveles.length - 1 ? 'text-blue-600' : 'text-slate-400'} uppercase">${n}</span>
                                ${i < niveles.length - 1 ? '<span class="material-symbols-outlined text-[12px] text-slate-300">chevron_right</span>' : ''}
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div class="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <span class="text-[9px] font-black text-blue-400 uppercase block mb-1">Precio</span>
                        <span class="text-xl font-black text-blue-700">Bs. ${p.precio}</span>
                    </div>
                    <div class="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <span class="text-[9px] font-black text-emerald-400 uppercase block mb-1">Stock</span>
                        <span class="text-xl font-black text-emerald-700">${p.stock}</span>
                    </div>
                </div>
            </div>`,
            confirmButtonText: 'CERRAR',
            confirmButtonColor: '#1e293b',
            customClass: { popup: 'rounded-[32px] shadow-2xl', confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs' }
        });
    },
};

window.productoView = productoView;
window.productManager = productManager;