/**
 * comboFormView.js
 * Wizard 3 pasos para crear/editar combos.
 * Paso 1: Info básica (nombre, descripción, imagen, tipo precio, valor, fechas, activo)
 * Paso 2: Alcance (global / sucursal)
 * Paso 3: Carrito de productos con cantidad mínima 2
 */

export const comboFormView = {

    _paso: 1,
    _sucursales: [],
    _categorias: [],
    _model: null,
    _onGuardar: null,
    _onCancelar: null,
    _productosSeleccionados: [],
    _imagenArchivo: { tipo: null, data: null, url: '' },  // tipo: 'local' | 'url'
    _estado: {},

    // ─────────────────────────────────────────────
    // ABRIR
    // ─────────────────────────────────────────────
    async abrir({ datos = {}, esEdicion = false, sucursales = [], categorias = [],
        productosIniciales = [], model = null, onGuardar, onCancelar }) {

        this._paso = 1;
        this._sucursales = sucursales;
        this._categorias = categorias;
        this._model = model;
        this._onGuardar = onGuardar;
        this._onCancelar = onCancelar;
        this._productosSeleccionados = productosIniciales.map(p => ({ ...p, fuente: 'manual' }));
        this._imagenArchivo = datos.imagen_url
            ? { tipo: 'url', data: null, url: datos.imagen_url }
            : { tipo: null, data: null, url: '' };

        const esPrecioFijo = datos.precio_fijo !== null && datos.precio_fijo !== undefined;

        this._estado = {
            id: datos.id || null,
            nombre: datos.nombre || '',
            descripcion: datos.descripcion || '',
            imagen_url: datos.imagen_url || '',
            tipo: esPrecioFijo ? 'precio_fijo' : 'porcentaje',
            valor: esPrecioFijo
                ? (datos.precio_fijo ?? '')
                : (datos.porcentaje_descuento ?? ''),
            alcance: datos.alcance || 'global',
            id_sucursal: datos.id_sucursal || '',
            activo: datos.activo !== undefined ? datos.activo : true,
            fecha_inicio: datos.fecha_inicio ? datos.fecha_inicio.split('T')[0] : '',
            fecha_fin: datos.fecha_fin ? datos.fecha_fin.split('T')[0] : '',
            esEdicion
        };

        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        contenedor.innerHTML = this._renderShell();
        this._renderPaso();
        this._bindEventosGlobales();
    },

    // ─────────────────────────────────────────────
    // SHELL
    // ─────────────────────────────────────────────
    _renderShell() {
        return `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <button id="cf-btn-cancelar" class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-lg">close</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            ${this._estado.esEdicion ? 'Editar' : 'Nuevo'} Combo
                        </p>
                        <h1 id="cf-titulo" class="text-lg font-black text-slate-800 leading-tight">
                            ${this._estado.nombre || 'Sin nombre'}
                        </h1>
                    </div>
                </div>

                <!-- Stepper -->
                <div class="flex items-center gap-2" id="cf-stepper"></div>
            </div>

            <!-- Área de pasos -->
            <div class="flex-1 overflow-auto px-6 py-6" id="cf-paso-area"></div>

            <!-- Footer de navegación -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200 shadow-sm flex-shrink-0">
                <button id="cf-btn-atras"
                        class="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200
                               text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all hidden">
                    <span class="material-symbols-outlined text-base">arrow_back</span>
                    Atrás
                </button>
                <div class="flex-1"></div>
                <button id="cf-btn-siguiente"
                        class="flex items-center gap-2 px-6 py-2.5 bg-orange-500 hover:bg-orange-600
                               text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md">
                    Siguiente
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                </button>
                <button id="cf-btn-guardar"
                        class="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700
                               text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md hidden">
                    <span class="material-symbols-outlined text-base">save</span>
                    ${this._estado.esEdicion ? 'Guardar Cambios' : 'Crear Combo'}
                </button>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // RENDERIZAR PASO ACTUAL
    // ─────────────────────────────────────────────
    _renderPaso() {
        const area = document.getElementById('cf-paso-area');
        if (!area) return;
        if (this._paso === 1) area.innerHTML = this._renderPaso1();
        if (this._paso === 2) area.innerHTML = this._renderPaso2();
        if (this._paso === 3) area.innerHTML = this._renderPaso3();
        this._actualizarStepper();
        this._actualizarBotones();
        this._actualizarTitulo();
        this._bindEventosPaso();

        if (this._paso === 3 && this._productosSeleccionados.length > 0) {
            this._refrescarCarrito();
        }
    },

    _actualizarStepper() {
        const stepper = document.getElementById('cf-stepper');
        if (!stepper) return;
        const pasos = ['Configuración', 'Alcance', 'Productos'];
        stepper.innerHTML = pasos.map((label, i) => {
            const num = i + 1;
            const activo = num === this._paso;
            const hecho = num < this._paso;
            return `
            <div class="flex items-center gap-1.5">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black
                            ${hecho ? 'bg-emerald-500 text-white' : ''}
                            ${activo ? 'bg-orange-500 text-white' : ''}
                            ${!hecho && !activo ? 'bg-slate-200 text-slate-400' : ''}">
                    ${hecho ? '<span class="material-symbols-outlined text-[12px]">check</span>' : num}
                </div>
                <span class="text-[10px] font-black uppercase tracking-widest
                             ${activo ? 'text-orange-500' : hecho ? 'text-emerald-500' : 'text-slate-300'}">
                    ${label}
                </span>
                ${num < 3 ? '<span class="material-symbols-outlined text-slate-200 text-[14px] ml-1">chevron_right</span>' : ''}
            </div>`;
        }).join('');
    },

    _actualizarBotones() {
        document.getElementById('cf-btn-atras')?.classList.toggle('hidden', this._paso === 1);
        document.getElementById('cf-btn-siguiente')?.classList.toggle('hidden', this._paso === 3);
        document.getElementById('cf-btn-guardar')?.classList.toggle('hidden', this._paso !== 3);
    },

    _actualizarTitulo() {
        const el = document.getElementById('cf-titulo');
        if (el) el.textContent = this._estado.nombre || 'Sin nombre';
    },

    // ─────────────────────────────────────────────
    // PASO 1: Configuración básica
    // ─────────────────────────────────────────────
    _renderPaso1() {
        const { nombre, descripcion, imagen_url, tipo, valor, fecha_inicio, fecha_fin, activo } = this._estado;
        return `
        <div class="max-w-2xl mx-auto animate-fade-in">
            <div class="mb-6">
                <h2 class="text-xl font-black text-slate-800">Configuración Básica</h2>
                <p class="text-sm text-slate-500 mt-1">Define el nombre, tipo de precio y vigencia del combo.</p>
            </div>
            <div class="flex flex-col gap-5">

                <!-- Nombre -->
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nombre del combo *</label>
                    <input id="p1-nombre" type="text" value="${nombre}" placeholder="Ej: Combo Familiar"
                           class="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700
                                  outline-none focus:border-orange-400 transition-all">
                </div>

                <!-- Descripción -->
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Descripción</label>
                    <textarea id="p1-descripcion" rows="3" placeholder="Descripción del combo..."
                              class="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700
                                     outline-none focus:border-orange-400 transition-all resize-none">${descripcion}</textarea>
                </div>

                <!-- Imagen -->
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Imagen del combo</label>
                    <div id="p1-img-widget" class="relative rounded-2xl border-2 border-dashed border-slate-200 overflow-hidden bg-slate-50 transition-all"
                         style="aspect-ratio: 16/7; min-height: 120px;">
                        ${this._imagenArchivo.url
                ? `<img id="p1-img-el" src="${this._imagenArchivo.url}" class="w-full h-full object-cover">`
                : `<div class="flex flex-col items-center justify-center gap-2 h-full py-8 text-slate-300">
                                   <span class="material-symbols-outlined text-[48px]">add_photo_alternate</span>
                                   <p class="text-[10px] font-black uppercase tracking-widest">Sin imagen</p>
                               </div>`}
                        <!-- Overlay con acciones -->
                        <div class="absolute inset-0 bg-slate-900/60 opacity-0 hover:opacity-100 transition-all flex items-center justify-center gap-3">
                            <button id="p1-img-upload" type="button"
                                    class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-orange-600 transition-all text-[9px] font-black uppercase">
                                <span class="material-symbols-outlined text-[22px]">upload_file</span>
                                Subir archivo
                            </button>
                            <button id="p1-img-url" type="button"
                                    class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-orange-600 transition-all text-[9px] font-black uppercase">
                                <span class="material-symbols-outlined text-[22px]">link</span>
                                Pegar URL
                            </button>
                            ${this._imagenArchivo.url
                ? `<button id="p1-img-ver" type="button"
                                           class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-blue-500 transition-all text-[9px] font-black uppercase">
                                       <span class="material-symbols-outlined text-[22px]">zoom_in</span>
                                       Ver
                                   </button>
                                   <button id="p1-img-quitar" type="button"
                                           class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-red-500 transition-all text-[9px] font-black uppercase">
                                       <span class="material-symbols-outlined text-[22px]">delete</span>
                                       Quitar
                                   </button>`
                : ''}
                        </div>
                    </div>
                </div>

                <!-- Tipo de precio -->
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Tipo de precio *</label>
                    <div class="grid grid-cols-2 gap-3">
                        <button data-tipo="precio_fijo"
                                class="tipo-btn flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
                                       ${tipo === 'precio_fijo'
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200'}">
                            <span class="material-symbols-outlined text-[28px]">payments</span>
                            <span class="text-[11px] font-black uppercase">Precio Fijo</span>
                            <span class="text-[10px] text-center opacity-70">El combo tiene un precio total definido</span>
                        </button>
                        <button data-tipo="porcentaje"
                                class="tipo-btn flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all
                                       ${tipo === 'porcentaje'
                ? 'border-blue-400 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'}">
                            <span class="material-symbols-outlined text-[28px]">percent</span>
                            <span class="text-[11px] font-black uppercase">Porcentaje</span>
                            <span class="text-[10px] text-center opacity-70">Descuento sobre la suma de productos</span>
                        </button>
                    </div>
                </div>

                <!-- Valor -->
                <div>
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block" id="p1-label-valor">
                        ${tipo === 'precio_fijo' ? 'Precio del combo (Bs) *' : 'Porcentaje de descuento (%) *'}
                    </label>
                    <div class="relative">
                        <span id="p1-valor-prefix" class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                            ${tipo === 'precio_fijo' ? 'Bs' : '%'}
                        </span>
                        <input id="p1-valor" type="number" min="0" step="0.01" value="${valor}"
                               placeholder="${tipo === 'precio_fijo' ? '0.00' : '0'}"
                               class="w-full border-2 border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-medium text-slate-700
                                      outline-none focus:border-orange-400 transition-all">
                    </div>
                    <p id="p1-valor-error" class="text-[11px] text-red-500 font-bold mt-1 hidden">
                        ${tipo === 'porcentaje' ? 'El porcentaje debe estar entre 1 y 100.' : 'El precio debe ser mayor a 0.'}
                    </p>
                </div>

                <!-- Fechas -->
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-emerald-500 text-[13px]">event_available</span>
                            Fecha de inicio
                        </label>
                        <input id="p1-fecha-inicio" type="date" value="${fecha_inicio}"
                               class="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700
                                      outline-none focus:border-orange-400 transition-all">
                    </div>
                    <div>
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-red-400 text-[13px]">event_busy</span>
                            Fecha de fin
                        </label>
                        <input id="p1-fecha-fin" type="date" value="${fecha_fin}"
                               class="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700
                                      outline-none focus:border-orange-400 transition-all">
                    </div>
                </div>

                <!-- Activo -->
                <div class="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <div>
                        <p class="text-sm font-black text-slate-700">Combo activo</p>
                        <p class="text-[11px] text-slate-400">El combo estará disponible para los clientes</p>
                    </div>
                    <button id="p1-toggle-activo"
                            class="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border
                                   ${activo
                ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'}">
                        <span class="material-symbols-outlined text-[16px]">${activo ? 'toggle_on' : 'toggle_off'}</span>
                        ${activo ? 'Activo' : 'Inactivo'}
                    </button>
                </div>

            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // PASO 2: Alcance
    // ─────────────────────────────────────────────
    _renderPaso2() {
        const { alcance, id_sucursal } = this._estado;
        const sucursalesOptions = this._sucursales.map(s =>
            `<option value="${s.id}" ${id_sucursal == s.id ? 'selected' : ''}>${s.nombre}</option>`
        ).join('');

        return `
        <div class="max-w-2xl mx-auto animate-fade-in">
            <div class="mb-6">
                <h2 class="text-xl font-black text-slate-800">Alcance del Combo</h2>
                <p class="text-sm text-slate-500 mt-1">¿En qué sucursales aplica este combo?</p>
            </div>
            <div class="grid grid-cols-2 gap-4 mb-6">
                <button data-alcance="global"
                        class="alcance-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all
                               ${alcance === 'global'
                ? 'border-orange-400 bg-orange-50 text-orange-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-orange-200'}">
                    <span class="material-symbols-outlined text-[36px]">public</span>
                    <span class="text-sm font-black uppercase">Global</span>
                    <span class="text-[11px] text-center opacity-70">Aplica en todas las sucursales</span>
                </button>
                <button data-alcance="sucursal"
                        class="alcance-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all
                               ${alcance === 'sucursal'
                ? 'border-violet-400 bg-violet-50 text-violet-700'
                : 'border-slate-200 bg-white text-slate-500 hover:border-violet-200'}">
                    <span class="material-symbols-outlined text-[36px]">store</span>
                    <span class="text-sm font-black uppercase">Por Sucursal</span>
                    <span class="text-[11px] text-center opacity-70">Solo en una sucursal específica</span>
                </button>
            </div>

            <!-- Selector de sucursal -->
            <div id="p2-selector-sucursal" class="${alcance === 'sucursal' ? '' : 'hidden'}">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">
                    Seleccionar Sucursal *
                </label>
                <select id="p2-sucursal"
                        class="w-full border-2 border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700
                               outline-none focus:border-violet-400 transition-all bg-white">
                    <option value="">— Seleccione una sucursal —</option>
                    ${sucursalesOptions}
                </select>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // PASO 3: Carrito de productos
    // ─────────────────────────────────────────────
    _renderPaso3() {
        const categoriasPadre = this._categorias.filter(c => !c.id_padre);
        const categoriasHijas = this._categorias.filter(c => c.id_padre);

        const renderCategorias = () => categoriasPadre.map(padre => {
            const hijas = categoriasHijas.filter(h => h.id_padre === padre.id);
            return `
            <div class="mb-2">
                <label class="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-50 rounded-lg px-1">
                    <input type="checkbox" class="cat-check-padre w-3.5 h-3.5 accent-orange-500 cursor-pointer"
                           data-id="${padre.id}" data-nombre="${padre.nombre}"
                           data-hijas="${hijas.map(h => h.id).join(',')}">
                    <span class="text-xs font-black text-slate-700">${padre.nombre}</span>
                </label>
                ${hijas.map(hija => `
                <label class="flex items-center gap-2 cursor-pointer py-1 hover:bg-slate-50 rounded-lg px-1 ml-4">
                    <input type="checkbox" class="cat-check-hija w-3.5 h-3.5 accent-orange-500 cursor-pointer"
                           data-id="${hija.id}" data-nombre="${hija.nombre}" data-padre="${padre.id}">
                    <span class="text-xs text-slate-500">${hija.nombre}</span>
                </label>`).join('')}
            </div>`;
        }).join('');

        const { id_sucursal, alcance } = this._estado;
        const badgeSucursal = alcance === 'sucursal' && id_sucursal
            ? `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-violet-50 border border-violet-100 text-violet-700 text-[9px] font-black uppercase">
                   <span class="material-symbols-outlined text-[10px]">store</span>
                   ${this._sucursales.find(s => s.id == id_sucursal)?.nombre || 'Sucursal'}
               </span>`
            : `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 text-[9px] font-black uppercase">
                   <span class="material-symbols-outlined text-[10px]">public</span>Todas
               </span>`;

        return `
        <div class="h-full flex flex-col animate-fade-in" style="height: calc(100vh - 220px);">
            <div class="mb-4">
                <h2 class="text-xl font-black text-slate-800">Productos del Combo</h2>
                <p class="text-sm text-slate-500 mt-1">Agrega al menos <span class="font-black text-orange-500">2 productos</span> al combo.</p>
            </div>

            <div class="grid flex-1 overflow-hidden" style="grid-template-columns: 320px 1fr; gap: 16px;">

                <!-- Izquierda: categorías + buscador -->
                <div class="flex flex-col gap-3 overflow-hidden">

                    <!-- Categorías -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden" style="max-height: 45%;">
                        <div class="px-4 py-3 border-b border-slate-100 flex-shrink-0">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Categorías</p>
                        </div>
                        <div class="overflow-auto p-3 flex-1">
                            ${this._categorias.length
                ? renderCategorias()
                : '<p class="text-xs text-slate-400 text-center py-4">Sin categorías</p>'}
                        </div>
                    </div>

                    <!-- Buscador -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden flex-1">
                        <div class="px-4 py-3 border-b border-slate-100 flex-shrink-0 flex items-center justify-between">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Buscar Productos</p>
                            ${badgeSucursal}
                        </div>
                        <div class="px-3 py-2 flex-shrink-0">
                            <div class="relative">
                                <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300 text-[16px]">search</span>
                                <input id="p3-buscador" type="text" placeholder="Nombre del producto..."
                                       class="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2
                                              text-xs font-medium text-slate-700 outline-none focus:border-orange-400 transition-all">
                            </div>
                        </div>
                        <div id="p3-resultados" class="overflow-auto flex-1 px-2 pb-2">
                            <p class="text-[10px] text-slate-300 text-center py-6 font-black uppercase">Escribe para buscar</p>
                        </div>
                    </div>
                </div>

                <!-- Derecha: carrito -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                    <div class="px-4 py-3 border-b border-slate-100 flex-shrink-0 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Productos del combo</p>
                            <span id="p3-contador" class="px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[9px] font-black">
                                ${this._productosSeleccionados.length}
                            </span>
                        </div>
                        <button id="p3-btn-limpiar"
                                class="text-[9px] font-black text-slate-400 hover:text-red-500 uppercase transition-all flex items-center gap-1">
                            <span class="material-symbols-outlined text-[13px]">delete_sweep</span>
                            Limpiar
                        </button>
                    </div>
                    <div id="p3-carrito" class="flex-1 overflow-auto p-3">
                        <div id="p3-carrito-vacio" class="${this._productosSeleccionados.length ? 'hidden' : ''} flex flex-col items-center gap-2 py-12 text-slate-300">
                            <span class="material-symbols-outlined text-[48px]">shopping_cart</span>
                            <p class="text-xs font-black uppercase tracking-widest">Agrega productos al combo</p>
                        </div>
                        <div id="p3-carrito-items" class="flex flex-col gap-2"></div>
                    </div>
                    <div id="p3-error-min" class="hidden px-4 py-2 bg-red-50 border-t border-red-100 text-[11px] text-red-500 font-black flex items-center gap-1.5 flex-shrink-0">
                        <span class="material-symbols-outlined text-[14px]">warning</span>
                        El combo necesita al menos 2 productos.
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // BIND EVENTOS GLOBALES
    // ─────────────────────────────────────────────
    _bindEventosGlobales() {
        document.getElementById('cf-btn-cancelar')?.addEventListener('click', async () => {
            const { isConfirmed } = await Swal.fire({
                title: `<span class="text-slate-800 font-black uppercase text-sm">¿Salir sin guardar?</span>`,
                html: `<p class="text-slate-500 text-sm text-center">Se perderán los cambios no guardados.</p>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Seguir editando',
                confirmButtonColor: '#ef4444',
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl',
                    confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                    cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
                }
            });
            if (isConfirmed && this._onCancelar) this._onCancelar();
        });
        document.getElementById('cf-btn-atras')?.addEventListener('click', () => {
            if (this._paso > 1) { this._recopilarPaso(); this._paso--; this._renderPaso(); }
        });
        document.getElementById('cf-btn-siguiente')?.addEventListener('click', () => {
            if (!this._validarPaso()) return;
            this._recopilarPaso();
            this._paso++;
            this._renderPaso();
        });
        document.getElementById('cf-btn-guardar')?.addEventListener('click', () => {
            if (!this._validarPaso()) return;
            this._recopilarPaso();
            this._guardar();
        });
    },

    _bindEventosPaso() {
        if (this._paso === 1) this._bindPaso1();
        if (this._paso === 2) this._bindPaso2();
        if (this._paso === 3) this._bindPaso3();
    },

    // ─────────────────────────────────────────────
    // BIND PASO 1
    // ─────────────────────────────────────────────
    _bindPaso1() {
        // Tipo de precio
        document.querySelectorAll('.tipo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._estado.tipo = btn.dataset.tipo;
                document.querySelectorAll('.tipo-btn').forEach(b => {
                    const activo = b.dataset.tipo === this._estado.tipo;
                    const esFijo = b.dataset.tipo === 'precio_fijo';
                    const color = esFijo ? 'orange' : 'blue';
                    b.className = activo
                        ? `tipo-btn flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all border-${color}-400 bg-${color}-50 text-${color}-700`
                        : `tipo-btn flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all border-slate-200 bg-white text-slate-500 hover:border-${color}-200`;
                });
                const esFijo = this._estado.tipo === 'precio_fijo';
                const label = document.getElementById('p1-label-valor');
                const prefix = document.getElementById('p1-valor-prefix');
                if (label) label.textContent = esFijo ? 'Precio del combo (Bs) *' : 'Porcentaje de descuento (%) *';
                if (prefix) prefix.textContent = esFijo ? 'Bs' : '%';
            });
        });

        // Widget imagen — subir archivo
        document.getElementById('p1-img-upload')?.addEventListener('click', async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                this._imagenArchivo = { tipo: 'local', data: file, url: URL.createObjectURL(file) };
                this._refrescarWidgetImagen();
            };
            input.click();
        });

        // Widget imagen — pegar URL
        document.getElementById('p1-img-url')?.addEventListener('click', async () => {
            const { value: url } = await Swal.fire({
                title: '<span class="text-slate-800 font-black uppercase text-sm">Pegar URL de imagen</span>',
                input: 'url',
                inputPlaceholder: 'https://...',
                showCancelButton: true,
                confirmButtonText: 'Aceptar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#f97316',
                customClass: { popup: 'rounded-[28px] border-none shadow-2xl', input: 'rounded-xl' }
            });
            if (url) {
                this._imagenArchivo = { tipo: 'url', data: null, url };
                this._refrescarWidgetImagen();
            }
        });

        // Widget imagen — ver en modal
        document.getElementById('p1-img-ver')?.addEventListener('click', () => {
            Swal.fire({
                imageUrl: this._imagenArchivo.url,
                imageAlt: 'Imagen del combo',
                showConfirmButton: false,
                showCloseButton: true,
                customClass: { popup: 'rounded-[28px] border-none shadow-2xl bg-black/90', closeButton: 'text-white' }
            });
        });

        // Widget imagen — quitar
        document.getElementById('p1-img-quitar')?.addEventListener('click', () => {
            this._imagenArchivo = { tipo: null, data: null, url: '' };
            this._refrescarWidgetImagen();
        });

        // Toggle activo
        document.getElementById('p1-toggle-activo')?.addEventListener('click', () => {
            this._estado.activo = !this._estado.activo;
            const btn = document.getElementById('p1-toggle-activo');
            btn.className = `flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all border
                ${this._estado.activo
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100'
                    : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'}`;
            btn.innerHTML = `<span class="material-symbols-outlined text-[16px]">${this._estado.activo ? 'toggle_on' : 'toggle_off'}</span>
                             ${this._estado.activo ? 'Activo' : 'Inactivo'}`;
        });

        // Actualizar nombre en tiempo real
        document.getElementById('p1-nombre')?.addEventListener('input', (e) => {
            this._estado.nombre = e.target.value;
            this._actualizarTitulo();
        });
    },

    // ─────────────────────────────────────────────
    // REFRESCAR WIDGET IMAGEN
    // ─────────────────────────────────────────────
    _refrescarWidgetImagen() {
        const widget = document.getElementById('p1-img-widget');
        if (!widget) return;
        const { url } = this._imagenArchivo;
        widget.innerHTML = `
            ${url
                ? `<img id="p1-img-el" src="${url}" class="w-full h-full object-cover">`
                : `<div class="flex flex-col items-center justify-center gap-2 h-full py-8 text-slate-300">
                       <span class="material-symbols-outlined text-[48px]">add_photo_alternate</span>
                       <p class="text-[10px] font-black uppercase tracking-widest">Sin imagen</p>
                   </div>`}
            <div class="absolute inset-0 bg-slate-900/60 opacity-0 hover:opacity-100 transition-all flex items-center justify-center gap-3">
                <button id="p1-img-upload" type="button"
                        class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-orange-600 transition-all text-[9px] font-black uppercase">
                    <span class="material-symbols-outlined text-[22px]">upload_file</span>
                    Subir archivo
                </button>
                <button id="p1-img-url" type="button"
                        class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-orange-600 transition-all text-[9px] font-black uppercase">
                    <span class="material-symbols-outlined text-[22px]">link</span>
                    Pegar URL
                </button>
                ${url
                ? `<button id="p1-img-ver" type="button"
                               class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-blue-500 transition-all text-[9px] font-black uppercase">
                           <span class="material-symbols-outlined text-[22px]">zoom_in</span>
                           Ver
                       </button>
                       <button id="p1-img-quitar" type="button"
                               class="flex flex-col items-center gap-1 p-3 bg-white rounded-xl text-slate-700 hover:text-red-500 transition-all text-[9px] font-black uppercase">
                           <span class="material-symbols-outlined text-[22px]">delete</span>
                           Quitar
                       </button>`
                : ''}
            </div>`;
        // Re-bind eventos del widget tras refrescar
        document.getElementById('p1-img-upload')?.addEventListener('click', async () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                this._imagenArchivo = { tipo: 'local', data: file, url: URL.createObjectURL(file) };
                this._refrescarWidgetImagen();
            };
            input.click();
        });
        document.getElementById('p1-img-url')?.addEventListener('click', async () => {
            const { value: url } = await Swal.fire({
                title: '<span class="text-slate-800 font-black uppercase text-sm">Pegar URL de imagen</span>',
                input: 'url', inputPlaceholder: 'https://...',
                showCancelButton: true, confirmButtonText: 'Aceptar', cancelButtonText: 'Cancelar',
                confirmButtonColor: '#f97316',
                customClass: { popup: 'rounded-[28px] border-none shadow-2xl', input: 'rounded-xl' }
            });
            if (url) { this._imagenArchivo = { tipo: 'url', data: null, url }; this._refrescarWidgetImagen(); }
        });
        document.getElementById('p1-img-ver')?.addEventListener('click', () => {
            Swal.fire({
                imageUrl: this._imagenArchivo.url,
                imageAlt: 'Imagen del combo',
                showConfirmButton: false,
                showCloseButton: true,
                customClass: { popup: 'rounded-[28px] border-none shadow-2xl bg-black/90', closeButton: 'text-white' }
            });
        });
        document.getElementById('p1-img-quitar')?.addEventListener('click', () => {
            this._imagenArchivo = { tipo: null, data: null, url: '' };
            this._refrescarWidgetImagen();
        });
    },

    // ─────────────────────────────────────────────
    // BIND PASO 2
    // ─────────────────────────────────────────────
    _bindPaso2() {
        document.querySelectorAll('.alcance-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._estado.alcance = btn.dataset.alcance;
                document.querySelectorAll('.alcance-btn').forEach(b => {
                    const activo = b.dataset.alcance === this._estado.alcance;
                    const color = b.dataset.alcance === 'global' ? 'orange' : 'violet';
                    b.className = activo
                        ? `alcance-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all border-${color}-400 bg-${color}-50 text-${color}-700`
                        : `alcance-btn flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all border-slate-200 bg-white text-slate-500 hover:border-${color}-200`;
                });
                const sel = document.getElementById('p2-selector-sucursal');
                sel?.classList.toggle('hidden', this._estado.alcance !== 'sucursal');
            });
        });
    },

    // ─────────────────────────────────────────────
    // BIND PASO 3
    // ─────────────────────────────────────────────
    _bindPaso3() {
        // Buscador con debounce
        let timer;
        document.getElementById('p3-buscador')?.addEventListener('input', (e) => {
            clearTimeout(timer);
            timer = setTimeout(() => this._buscarProductos(e.target.value.trim()), 300);
        });

        // Limpiar carrito
        document.getElementById('p3-btn-limpiar')?.addEventListener('click', () => {
            this._productosSeleccionados = [];
            this._refrescarCarrito();
            document.getElementById('p3-buscador').value = '';
            document.getElementById('p3-resultados').innerHTML =
                '<p class="text-[10px] text-slate-300 text-center py-6 font-black uppercase">Escribe para buscar</p>';
        });

        // Checkboxes de categorías padre
        document.querySelectorAll('.cat-check-padre').forEach(chk => {
            chk.addEventListener('change', async () => {
                const idCat = parseInt(chk.dataset.id);
                const hijas = chk.dataset.hijas ? chk.dataset.hijas.split(',').map(Number).filter(Boolean) : [];
                if (chk.checked) {
                    await this._agregarProductosDeCategoriaAlCarrito(idCat);
                    for (const hija of hijas) {
                        const chkHija = document.querySelector(`.cat-check-hija[data-id="${hija}"]`);
                        if (chkHija) { chkHija.checked = true; await this._agregarProductosDeCategoriaAlCarrito(hija); }
                    }
                } else {
                    this._quitarCategoria(idCat, true, hijas);
                    hijas.forEach(hija => {
                        const chkHija = document.querySelector(`.cat-check-hija[data-id="${hija}"]`);
                        if (chkHija) chkHija.checked = false;
                    });
                }
            });
        });

        // Checkboxes de categorías hija
        document.querySelectorAll('.cat-check-hija').forEach(chk => {
            chk.addEventListener('change', async () => {
                const idCat = parseInt(chk.dataset.id);
                if (chk.checked) {
                    await this._agregarProductosDeCategoriaAlCarrito(idCat);
                } else {
                    this._quitarCategoria(idCat, false, []);
                }
            });
        });
    },

    // ─────────────────────────────────────────────
    // BÚSQUEDA DE PRODUCTOS
    // ─────────────────────────────────────────────
    async _buscarProductos(query) {
        const resultadosEl = document.getElementById('p3-resultados');
        if (!resultadosEl) return;

        if (!query) {
            resultadosEl.innerHTML = '<p class="text-[10px] text-slate-300 text-center py-6 font-black uppercase">Escribe para buscar</p>';
            return;
        }

        resultadosEl.innerHTML = '<p class="text-[10px] text-slate-400 text-center py-4 animate-pulse font-black uppercase">Buscando...</p>';

        const id_sucursal = this._estado.alcance === 'sucursal' ? this._estado.id_sucursal : null;
        const productos = await this._model.buscarProductos(query, id_sucursal);

        if (!productos.length) {
            resultadosEl.innerHTML = '<p class="text-[10px] text-slate-300 text-center py-6 font-black uppercase">Sin resultados</p>';
            return;
        }

        resultadosEl.innerHTML = productos.map(p => {
            const yaEsta = this._productosSeleccionados.some(s => s.id === p.id);
            return `
            <div class="flex items-center gap-2 p-2 rounded-xl transition-all cursor-pointer hover:bg-slate-50
                        ${yaEsta ? 'bg-slate-50 pointer-events-none opacity-60' : ''}"
                 data-producto-id="${p.id}">
                <div class="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 flex items-center justify-center">
                    ${p.imagen
                    ? `<img src="${p.imagen}" class="w-full h-full object-cover">`
                    : `<span class="material-symbols-outlined text-slate-300 text-[16px]">image_not_supported</span>`}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-slate-700 truncate">${p.nombre}</p>
                    ${p.precios?.[0] ? `<p class="text-[10px] text-slate-400">Bs ${parseFloat(p.precios[0].precio).toFixed(2)}</p>` : ''}
                </div>
                <span class="text-[9px] font-black uppercase ${yaEsta ? 'text-slate-400' : 'text-orange-500'}">
                    ${yaEsta ? 'Agregado' : '+ Agregar'}
                </span>
            </div>`;
        }).join('');

        // Click para agregar
        resultadosEl.querySelectorAll('[data-producto-id]').forEach(el => {
            el.addEventListener('click', () => {
                const id = parseInt(el.dataset.productoId);
                if (this._productosSeleccionados.some(p => p.id === id)) return;
                const prod = productos.find(p => p.id === id);
                if (!prod) return;
                this._productosSeleccionados.push({ ...prod, cantidad: 1, fuente: 'manual' });
                this._refrescarCarrito();
                // Marcar como agregado en resultados
                el.classList.add('bg-slate-50', 'pointer-events-none', 'opacity-60');
                const tag = el.querySelector('span:last-child');
                if (tag) { tag.textContent = 'Agregado'; tag.classList.replace('text-orange-500', 'text-slate-400'); }
                document.getElementById('p3-buscador').value = '';
                document.getElementById('p3-resultados').innerHTML =
                    '<p class="text-[10px] text-slate-300 text-center py-6 font-black uppercase">Escribe para buscar</p>';
            });
        });
    },

    async _agregarProductosDeCategoriaAlCarrito(idCategoria) {
        const productos = await this._model.getProductosPorCategoria(idCategoria);
        for (const p of productos) {
            if (!this._productosSeleccionados.some(s => s.id === p.id)) {
                this._productosSeleccionados.push({ ...p, cantidad: 1, fuente: 'categoria', idCategoria });
            }
        }
        this._refrescarCarrito();
    },

    _quitarCategoria(idCategoria, esPadre, hijas) {
        if (esPadre) {
            this._productosSeleccionados = this._productosSeleccionados.filter(
                p => p.fuente !== 'categoria' || (p.idCategoria !== idCategoria && !hijas.includes(p.idCategoria))
            );
        } else {
            this._productosSeleccionados = this._productosSeleccionados.filter(
                p => p.fuente !== 'categoria' || p.idCategoria !== idCategoria
            );
        }
        this._refrescarCarrito();
    },

    // ─────────────────────────────────────────────
    // REFRESCAR CARRITO
    // ─────────────────────────────────────────────
    _refrescarCarrito() {
        const vacioEl = document.getElementById('p3-carrito-vacio');
        const itemsEl = document.getElementById('p3-carrito-items');
        const contadorEl = document.getElementById('p3-contador');
        const errorEl = document.getElementById('p3-error-min');
        if (!itemsEl) return;

        const tiene = this._productosSeleccionados.length > 0;
        vacioEl?.classList.toggle('hidden', tiene);
        if (contadorEl) contadorEl.textContent = this._productosSeleccionados.length;
        errorEl?.classList.add('hidden');

        itemsEl.innerHTML = this._productosSeleccionados.map((p, idx) => {
            const precio = p.precios?.find(pr =>
                this._estado.alcance === 'sucursal' ? pr.id_sucursal == this._estado.id_sucursal : true
            );
            const precioTxt = precio ? `Bs ${parseFloat(precio.precio).toFixed(2)}` : '';
            return `
            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100">
                <div class="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-white border border-slate-200 flex items-center justify-center">
                    ${p.imagen
                    ? `<img src="${p.imagen}" class="w-full h-full object-cover">`
                    : `<span class="material-symbols-outlined text-slate-300 text-[14px]">image_not_supported</span>`}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-xs font-black text-slate-700 truncate">${p.nombre}</p>
                    ${precioTxt ? `<p class="text-[10px] text-slate-400">${precioTxt}</p>` : ''}
                </div>
                <!-- Control de cantidad -->
                <div class="flex items-center gap-1 flex-shrink-0">
                    <button class="p3-qty-minus w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center
                                   hover:bg-red-50 hover:border-red-200 hover:text-red-500 transition-all text-slate-500"
                            data-idx="${idx}">
                        <span class="material-symbols-outlined text-[13px]">remove</span>
                    </button>
                    <span class="w-6 text-center text-xs font-black text-slate-700">${p.cantidad || 1}</span>
                    <button class="p3-qty-plus w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center
                                   hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500 transition-all text-slate-500"
                            data-idx="${idx}">
                        <span class="material-symbols-outlined text-[13px]">add</span>
                    </button>
                </div>
                <!-- Quitar -->
                <button class="p3-quitar w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                        data-idx="${idx}">
                    <span class="material-symbols-outlined text-[15px]">close</span>
                </button>
            </div>`;
        }).join('');

        // Eventos de cantidad y quitar
        itemsEl.querySelectorAll('.p3-qty-minus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                if (this._productosSeleccionados[idx].cantidad > 1) {
                    this._productosSeleccionados[idx].cantidad--;
                    this._refrescarCarrito();
                }
            });
        });
        itemsEl.querySelectorAll('.p3-qty-plus').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                this._productosSeleccionados[idx].cantidad++;
                this._refrescarCarrito();
            });
        });
        itemsEl.querySelectorAll('.p3-quitar').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.idx);
                this._productosSeleccionados.splice(idx, 1);
                this._refrescarCarrito();
            });
        });
    },

    // ─────────────────────────────────────────────
    // VALIDACIÓN POR PASO
    // ─────────────────────────────────────────────
    _validarPaso() {
        if (this._paso === 1) {
            const nombre = document.getElementById('p1-nombre')?.value.trim();
            if (!nombre) {
                Swal.fire({
                    icon: 'warning', title: '<span class="font-black text-sm uppercase">Nombre requerido</span>',
                    text: 'Ingresa un nombre para el combo.',
                    customClass: { popup: 'rounded-[28px] border-none shadow-2xl' }
                });
                return false;
            }
            const valor = parseFloat(document.getElementById('p1-valor')?.value);
            const errEl = document.getElementById('p1-valor-error');
            const tipo = this._estado.tipo;
            if (isNaN(valor) || valor <= 0 || (tipo === 'porcentaje' && valor > 100)) {
                errEl?.classList.remove('hidden');
                return false;
            }
            errEl?.classList.add('hidden');
        }

        if (this._paso === 2) {
            if (this._estado.alcance === 'sucursal') {
                const suc = document.getElementById('p2-sucursal')?.value;
                if (!suc) {
                    Swal.fire({
                        icon: 'warning', title: '<span class="font-black text-sm uppercase">Sucursal requerida</span>',
                        text: 'Selecciona una sucursal.',
                        customClass: { popup: 'rounded-[28px] border-none shadow-2xl' }
                    });
                    return false;
                }
            }
        }

        if (this._paso === 3) {
            if (this._productosSeleccionados.length < 2) {
                document.getElementById('p3-error-min')?.classList.remove('hidden');
                return false;
            }
        }

        return true;
    },

    // ─────────────────────────────────────────────
    // RECOPILAR DATOS DEL PASO
    // ─────────────────────────────────────────────
    _recopilarPaso() {
        if (this._paso === 1) {
            this._estado.nombre = document.getElementById('p1-nombre')?.value.trim() || '';
            this._estado.descripcion = document.getElementById('p1-descripcion')?.value.trim() || '';
            this._estado.tipo = this._estado.tipo;
            this._estado.valor = document.getElementById('p1-valor')?.value || '';
            this._estado.fecha_inicio = document.getElementById('p1-fecha-inicio')?.value || '';
            this._estado.fecha_fin = document.getElementById('p1-fecha-fin')?.value || '';
        }
        if (this._paso === 2) {
            this._estado.id_sucursal = document.getElementById('p2-sucursal')?.value || '';
        }
    },

    // ─────────────────────────────────────────────
    // GUARDAR
    // ─────────────────────────────────────────────
    _guardar() {
        const { nombre, descripcion, imagen_url, tipo, valor, alcance, id_sucursal,
            activo, fecha_inicio, fecha_fin, esEdicion } = this._estado;

        Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">
                        ${esEdicion ? '¿Guardar Cambios?' : '¿Crear Combo?'}
                    </span>`,
            html: `<div class="text-center"><p class="text-slate-500 text-sm">
                        Se ${esEdicion ? 'actualizará' : 'creará'} el combo:<br>
                        <span class="text-slate-800 font-bold">"${nombre}"</span><br>
                        <span class="text-[11px] text-slate-400">con ${this._productosSeleccionados.length} productos</span>
                    </p></div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: esEdicion ? 'Sí, guardar' : 'Sí, crear',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#059669',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        }).then(({ isConfirmed }) => {
            if (!isConfirmed) return;

            // Convertir fechas con timezone local
            const fechaAISO = (val, esFin = false) => {
                if (!val) return null;
                const pad = n => String(n).padStart(2, '0');
                const d = esFin ? new Date(`${val}T23:59:59`) : new Date(`${val}T00:00:00`);
                const off = -d.getTimezoneOffset();
                const sign = off >= 0 ? '+' : '-';
                const hOff = pad(Math.floor(Math.abs(off) / 60));
                const mOff = pad(Math.abs(off) % 60);
                return `${val}T${esFin ? '23:59:59' : '00:00:00'}${sign}${hOff}:${mOff}`;
            };

            const esFijo = tipo === 'precio_fijo';

            if (this._onGuardar) {
                this._onGuardar({
                    combo: {
                        nombre, descripcion,
                        imagen_url: null,          // se resuelve en el controller tras upload
                        alcance,
                        id_sucursal: id_sucursal || null,
                        precio_fijo: esFijo ? parseFloat(valor) : null,
                        porcentaje_descuento: !esFijo ? parseFloat(valor) : null,
                        activo,
                        fecha_inicio: fechaAISO(fecha_inicio, false),
                        fecha_fin: fechaAISO(fecha_fin, true)
                    },
                    imagenArchivo: this._imagenArchivo,   // { tipo, data, url }
                    productos: this._productosSeleccionados.map(p => ({
                        id_producto: p.id,
                        cantidad: p.cantidad || 1
                    }))
                });
            }
        });
    }
};