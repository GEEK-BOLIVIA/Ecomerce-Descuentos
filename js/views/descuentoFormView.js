/**
 * descuentoFormView.js
 * Formulario wizard de 3 pasos para crear/editar descuentos.
 * Panel lateral derecho con calculadora en vivo siempre visible.
 */

export const descuentoFormView = {

    _paso: 1,
    _totalPasos: 3,
    _estado: {},
    _sucursales: [],
    _categorias: [],
    _productosSeleccionados: [], // { id, nombre, fuente: 'manual' }
    _categoriasSeleccionadas: [], // { id, nombre }
    _debounceTimer: null,

    // ─────────────────────────────────────────────
    // ENTRADA PRINCIPAL
    // ─────────────────────────────────────────────
    async abrir({ datos = {}, esEdicion = false, sucursales = [], categorias = [],
        productosIniciales = [], categoriasIniciales = [],
        model = null, onGuardar, onCancelar }) {

        this._paso = 1;
        this._sucursales = sucursales;
        this._categorias = categorias;
        this._model = model;
        this._onGuardar = onGuardar;
        this._onCancelar = onCancelar;
        this._productosSeleccionados = productosIniciales.map(p => ({ ...p, fuente: 'manual' }));
        this._categoriasSeleccionadas = categoriasIniciales;

        this._estado = {
            id: datos.id || null,
            nombre: datos.nombre || '',
            descripcion: datos.descripcion || '',
            tipo: datos.tipo || 'porcentaje',
            valor: datos.valor || '',
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
    // SHELL: estructura fija (header + layout)
    // ─────────────────────────────────────────────
    _renderShell() {
        const { esEdicion } = this._estado;
        return `
        <div class="relative flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <button id="df-btn-cancelar"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100
                                   hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            ${esEdicion ? 'Editar' : 'Nuevo'} Descuento
                        </p>
                        <h1 id="df-titulo-header" class="text-lg font-black text-slate-800 leading-tight">
                            ${this._estado.nombre || 'Sin nombre'}
                        </h1>
                    </div>
                </div>

                <!-- Stepper -->
                <div class="flex items-center gap-2">
                    ${[1, 2, 3].map(n => `
                    <div class="flex items-center gap-2">
                        <div id="step-circle-${n}"
                             class="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black
                                    transition-all ${n === 1 ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-slate-100 text-slate-400'}">
                            ${n}
                        </div>
                        <span id="step-label-${n}"
                              class="text-[10px] font-black uppercase tracking-wide hidden md:block transition-all
                                     ${n === 1 ? 'text-blue-600' : 'text-slate-400'}">
                            ${['Configuración', 'Alcance', 'Productos'][n - 1]}
                        </span>
                        ${n < 3 ? '<div class="w-6 h-px bg-slate-200 mx-1"></div>' : ''}
                    </div>`).join('')}
                </div>
            </div>

            <!-- Layout principal: ahora ocupa todo el ancho -->
            <div class="flex flex-1 overflow-hidden">
                <div id="df-paso-area" class="flex-1 overflow-y-auto p-6"></div>
            </div>

            <!-- Botón flotante calculadora -->
            <button id="df-btn-calculadora"
                    title="Calculadora en vivo"
                    class="absolute bottom-20 right-6 z-50 w-12 h-12 rounded-xl
                           bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-300/40
                           flex flex-col items-center justify-center gap-0.5 transition-all
                           active:scale-95 hover:scale-105 group">
                <span class="material-symbols-outlined text-[22px]">calculate</span>
                <span class="text-[8px] font-black uppercase tracking-wider">Calcular</span>
            </button>

            <!-- Modal calculadora -->
            <div id="df-modal-calc"
                 class="absolute inset-0 z-[200] flex items-end justify-end pb-24 pr-6 pointer-events-none hidden"
                 onclick="if(event.target===this) this.classList.add('hidden')">
                <div class="w-[320px] bg-white rounded-3xl shadow-2xl border border-slate-200 pointer-events-auto
                            overflow-hidden animate-in slide-in-from-bottom-4 duration-200">

                    <!-- Header modal -->
                    <div class="flex items-center justify-between px-5 py-4
                                bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-[20px]">calculate</span>
                            <p class="font-black text-sm uppercase tracking-wide">Calculadora en vivo</p>
                        </div>
                        <button id="df-btn-cerrar-calc"
                                class="w-7 h-7 flex items-center justify-center rounded-xl
                                       bg-white/20 hover:bg-white/30 transition-all">
                            <span class="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>

                    <div class="p-5 flex flex-col gap-4">

                        <!-- Badges nombre/tipo/alcance -->
                        <div>
                            <p id="pv-nombre" class="text-sm font-black text-slate-800 truncate mb-2">Sin nombre</p>
                            <div class="flex flex-wrap items-center gap-2">
                                <div id="pv-tipo-badge"
                                     class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase
                                            bg-blue-50 border border-blue-100 text-blue-700 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[11px]">percent</span>
                                    Porcentaje
                                </div>
                                <div id="pv-alcance-badge"
                                     class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase
                                            bg-slate-50 border border-slate-200 text-slate-500 flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[11px]">public</span>
                                    Global
                                </div>
                            </div>
                        </div>

                        <!-- Precio ejemplo -->
                        <div class="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                Precio de ejemplo
                            </p>
                            <div class="flex items-center gap-2 mb-4">
                                <div class="flex items-center gap-1.5 bg-white rounded-xl border-2 border-blue-200
                                            px-3 py-2 flex-1 focus-within:border-blue-500 transition-all">
                                    <span class="text-[11px] font-black text-slate-400">Bs</span>
                                    <input id="pv-precio-ejemplo" type="number" value="100" min="1"
                                           class="flex-1 text-base font-black text-slate-700 outline-none bg-transparent">
                                </div>
                            </div>
                            <div class="space-y-2.5">
                                <div class="flex justify-between items-center">
                                    <span class="text-[11px] text-slate-500 font-medium">Precio original</span>
                                    <span id="pv-precio-original" class="text-sm font-bold text-slate-600">Bs 100.00</span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-[11px] text-red-500 font-bold flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[13px]">remove_circle</span>
                                        Descuento
                                    </span>
                                    <span id="pv-descuento-calc" class="text-sm font-bold text-red-500">- Bs 0.00</span>
                                </div>
                                <div class="h-px bg-slate-200"></div>
                                <div class="flex justify-between items-center pt-1">
                                    <span class="text-[11px] font-black text-blue-700 uppercase tracking-wide">
                                        Cliente paga
                                    </span>
                                    <span id="pv-precio-final"
                                          class="text-2xl font-black text-blue-700">Bs 100.00</span>
                                </div>
                            </div>
                        </div>

                        <!-- Vigencia -->
                        <div id="pv-fechas" class="hidden flex-col gap-1.5">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vigencia</p>
                            <div class="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                                <span class="material-symbols-outlined text-emerald-500 text-[14px]">event_available</span>
                                <span id="pv-fecha-inicio" class="text-[11px] font-bold text-slate-600">—</span>
                            </div>
                            <div class="flex items-center gap-2 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                                <span class="material-symbols-outlined text-red-400 text-[14px]">event_busy</span>
                                <span id="pv-fecha-fin" class="text-[11px] font-bold text-slate-600">—</span>
                            </div>
                        </div>

                        <!-- Aplica a -->
                        <div>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Aplica a</p>
                            <div id="pv-target" class="flex flex-col gap-1.5">
                                <div class="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                                    <span class="material-symbols-outlined text-slate-400 text-[13px]">inventory_2</span>
                                    <span class="text-[11px] font-bold text-slate-400 italic">Sin asignar</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer con botones de navegación -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-200 flex-shrink-0">
                <button id="df-btn-anterior"
                        class="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200
                               text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest
                               transition-all invisible">
                    <span class="material-symbols-outlined text-base">arrow_back</span>
                    Anterior
                </button>
                <div class="flex items-center gap-2">
                    ${[1, 2, 3].map(n => `
                    <div id="dot-${n}" class="w-2 h-2 rounded-full transition-all
                                               ${n === 1 ? 'bg-blue-600 w-6' : 'bg-slate-200'}"></div>`).join('')}
                </div>
                <button id="df-btn-siguiente"
                        class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                               text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                               transition-all shadow-md shadow-blue-200 active:scale-95">
                    Siguiente
                    <span class="material-symbols-outlined text-base">arrow_forward</span>
                </button>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // RENDER DEL PASO ACTUAL
    // ─────────────────────────────────────────────
    _renderPaso() {
        const area = document.getElementById('df-paso-area');
        if (!area) return;

        if (this._paso === 1) area.innerHTML = this._renderPaso1();
        if (this._paso === 2) area.innerHTML = this._renderPaso2();
        if (this._paso === 3) area.innerHTML = this._renderPaso3();

        this._actualizarStepper();
        this._actualizarBotones();
        this._actualizarPreview();
        this._bindEventosPaso();

        // Al entrar al paso 3 con datos previos (edición), poblar el carrito y chips
        if (this._paso === 3) {
            if (this._categoriasSeleccionadas.length > 0) this._refrescarChipsCategorias();
            if (this._productosSeleccionados.length > 0) this._refrescarCarrito();
        }
    },

    // ─────────────────────────────────────────────
    // PASO 1: Configuración básica
    // ─────────────────────────────────────────────
    _renderPaso1() {
        const { nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, activo } = this._estado;
        return `
        <div class="max-w-2xl mx-auto animate-fade-in">
            <div class="mb-6">
                <h2 class="text-xl font-black text-slate-800">Configuración Básica</h2>
                <p class="text-sm text-slate-500 mt-1">Define el nombre, tipo y vigencia del descuento.</p>
            </div>

            <div class="flex flex-col gap-5">

                <!-- Nombre -->
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">label</span>
                        Nombre del descuento *
                    </label>
                    <input id="p1-nombre" type="text" value="${nombre}"
                           placeholder='Ej: "Super Lunes de Parrillada"'
                           class="w-full bg-white border-2 border-slate-200 rounded-2xl py-3 px-4 text-sm
                                  outline-none focus:border-blue-500 focus:bg-white transition-all
                                  font-medium text-slate-700 placeholder:text-slate-300">
                </div>

                <!-- Descripción -->
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">description</span>
                        Descripción <span class="text-slate-300 normal-case font-medium">(opcional)</span>
                    </label>
                    <textarea id="p1-descripcion" rows="2"
                              placeholder="Describe brevemente el descuento..."
                              class="w-full bg-white border-2 border-slate-200 rounded-2xl py-3 px-4 text-sm
                                     outline-none focus:border-blue-500 transition-all
                                     font-medium text-slate-700 resize-none">${descripcion}</textarea>
                </div>

                <!-- Tipo + Valor -->
                <div class="space-y-1.5">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <span class="material-symbols-outlined text-[13px]">sell</span>
                        Tipo y Valor del descuento *
                    </label>
                    <div class="flex gap-3">
                        <!-- Selector tipo -->
                        <div class="flex gap-2">
                            <button data-tipo="porcentaje" id="btn-tipo-porcentaje"
                                    class="tipo-btn flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-black text-sm
                                           transition-all ${tipo === 'porcentaje'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}">
                                <span class="material-symbols-outlined text-[18px]">percent</span>
                                Porcentaje
                            </button>
                            <button data-tipo="monto_fijo" id="btn-tipo-monto"
                                    class="tipo-btn flex items-center gap-2 px-4 py-3 rounded-2xl border-2 font-black text-sm
                                           transition-all ${tipo === 'monto_fijo'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}">
                                <span class="material-symbols-outlined text-[18px]">payments</span>
                                Monto fijo
                            </button>
                        </div>
                        <!-- Input valor -->
                        <div class="flex-1 relative">
                            <span id="p1-simbolo"
                                  class="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-sm">
                                ${tipo === 'porcentaje' ? '%' : 'Bs'}
                            </span>
                            <input id="p1-valor" type="number" min="0" step="0.01" value="${valor}"
                                   placeholder="${tipo === 'porcentaje' ? '0 – 100' : '0.00'}"
                                   class="w-full bg-white border-2 border-slate-200 rounded-2xl py-3 pl-10 pr-4 text-sm
                                          outline-none focus:border-blue-500 transition-all font-bold text-slate-700">
                        </div>
                    </div>
                    <p id="p1-valor-hint" class="text-[10px] text-slate-400 px-1">
                        ${tipo === 'porcentaje' ? 'Ingresa un valor entre 1 y 100.' : 'Ingresa el monto fijo en bolivianos.'}
                    </p>
                </div>

                <!-- Fechas -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[13px] text-emerald-500">event_available</span>
                            Fecha de inicio
                        </label>
                        <input id="p1-fecha-inicio" type="date" value="${fecha_inicio}"
                               class="w-full bg-white border-2 border-slate-200 rounded-2xl py-3 px-4 text-sm
                                      outline-none focus:border-blue-500 transition-all font-medium text-slate-700">
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[13px] text-red-400">event_busy</span>
                            Fecha de fin
                        </label>
                        <input id="p1-fecha-fin" type="date" value="${fecha_fin}"
                               class="w-full bg-white border-2 border-slate-200 rounded-2xl py-3 px-4 text-sm
                                      outline-none focus:border-blue-500 transition-all font-medium text-slate-700">
                    </div>
                </div>

                <!-- Estado activo -->
                <div class="flex items-center justify-between bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-blue-400 text-[20px]">toggle_on</span>
                        <div>
                            <p class="text-[11px] font-black text-slate-700 uppercase tracking-wide">Activar inmediatamente</p>
                            <p class="text-[10px] text-slate-400 mt-0.5">El descuento estará disponible al guardar</p>
                        </div>
                    </div>
                    <label class="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" id="p1-activo" class="sr-only peer" ${activo ? 'checked' : ''}>
                        <div class="w-11 h-6 bg-slate-200 rounded-full peer
                                    peer-checked:after:translate-x-full peer-checked:after:border-white
                                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                                    after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all
                                    peer-checked:bg-blue-600"></div>
                    </label>
                </div>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // PASO 2: Alcance
    // ─────────────────────────────────────────────
    _renderPaso2() {
        const { alcance, id_sucursal } = this._estado;
        const opcionesSucursales = this._sucursales.map(s =>
            `<option value="${s.id}" ${s.id == id_sucursal ? 'selected' : ''}>${s.nombre}</option>`
        ).join('');

        return `
        <div class="max-w-2xl mx-auto animate-fade-in">
            <div class="mb-6">
                <h2 class="text-xl font-black text-slate-800">Alcance del Descuento</h2>
                <p class="text-sm text-slate-500 mt-1">¿Dónde aplica este descuento? ¿En todas las sucursales o en una específica?</p>
            </div>

            <div class="flex flex-col gap-4">

                <!-- Selector global/sucursal -->
                <div class="grid grid-cols-2 gap-4">
                    <button data-alcance="global" id="btn-alcance-global"
                            class="alcance-btn flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all
                                   ${alcance === 'global'
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}">
                        <span class="material-symbols-outlined text-[36px]">public</span>
                        <div class="text-center">
                            <p class="font-black text-sm uppercase">Global</p>
                            <p class="text-[10px] mt-1 opacity-70">Aplica en todas las sucursales</p>
                        </div>
                    </button>

                    <button data-alcance="sucursal" id="btn-alcance-sucursal"
                            class="alcance-btn flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all
                                   ${alcance === 'sucursal'
                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white border-slate-200 text-slate-500 hover:border-blue-300'}">
                        <span class="material-symbols-outlined text-[36px]">store</span>
                        <div class="text-center">
                            <p class="font-black text-sm uppercase">Sucursal</p>
                            <p class="text-[10px] mt-1 opacity-70">Solo en una sucursal específica</p>
                        </div>
                    </button>
                </div>

                <!-- Selector sucursal (condicional) -->
                <div id="p2-selector-sucursal" class="${alcance === 'sucursal' ? '' : 'hidden'}">
                    <div class="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                        <label class="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5 mb-3">
                            <span class="material-symbols-outlined text-[13px]">store</span>
                            Selecciona la Sucursal *
                        </label>
                        <select id="p2-sucursal"
                                class="w-full bg-white border-2 border-blue-200 rounded-2xl py-3 px-4
                                       text-sm outline-none focus:border-blue-500 transition-all
                                       font-medium text-slate-700">
                            <option value="">— Elige una sucursal —</option>
                            ${opcionesSucursales}
                        </select>
                    </div>
                </div>

                <!-- Info -->
                <div id="p2-info-global" class="bg-emerald-50 border border-emerald-100 rounded-2xl p-4
                                                  flex items-start gap-3 ${alcance === 'global' ? '' : 'hidden'}">
                    <span class="material-symbols-outlined text-emerald-500 text-[20px] mt-0.5">info</span>
                    <p class="text-sm text-emerald-700 font-medium leading-relaxed">
                        El descuento aplicará en <span class="font-black">todas las sucursales</span>
                        de la tienda para los productos o categorías que asignes en el siguiente paso.
                    </p>
                </div>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // PASO 3: Target (productos/categorías)
    // ─────────────────────────────────────────────
    _renderPaso3() {
        const catPadres = this._categorias.filter(c => !c.id_padre);

        return `
        <div class="animate-fade-in flex flex-col gap-5 max-w-5xl mx-auto">
            <div>
                <h2 class="text-xl font-black text-slate-800">¿A qué aplica el descuento?</h2>
                <p class="text-sm text-slate-500 mt-1">Selecciona categorías o busca productos individuales. Los seleccionados aparecerán como tarjetas con precio original y precio con descuento.</p>
            </div>

            <!-- Layout: selectores izq + carrito der -->
            <div class="grid grid-cols-[340px_1fr] gap-5 items-start">

                <!-- COLUMNA IZQUIERDA: selectores -->
                <div class="flex flex-col gap-4">

                    <!-- CATEGORÍAS -->
                    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <div class="flex items-center gap-2 px-4 py-3 bg-blue-50 border-b border-blue-100">
                            <span class="material-symbols-outlined text-blue-500 text-[18px]">category</span>
                            <p class="text-[11px] font-black text-blue-700 uppercase tracking-widest flex-1">Por Categoría</p>
                            <span class="text-[9px] text-blue-400 font-medium">Al marcar padre se marcan hijas</span>
                        </div>
                        <div class="p-3 flex flex-col gap-1 max-h-52 overflow-y-auto">
                            ${catPadres.length === 0
                ? '<p class="text-slate-400 text-xs italic text-center py-4">No hay categorías</p>'
                : catPadres.map(cat => {
                    const hijas = this._categorias.filter(c => c.id_padre === cat.id);
                    const selPadre = this._categoriasSeleccionadas.some(c => c.id === cat.id);
                    return `
                                    <div class="rounded-xl">
                                        <label class="flex items-center gap-2.5 px-3 py-2 rounded-xl
                                                       hover:bg-blue-50 cursor-pointer transition-all
                                                       ${selPadre ? 'bg-blue-50' : ''}">
                                            <input type="checkbox"
                                                   data-cat-id="${cat.id}"
                                                   data-cat-nombre="${cat.nombre}"
                                                   data-es-padre="true"
                                                   data-hijas="${hijas.map(h => h.id).join(',')}"
                                                   class="cat-checkbox w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                                   ${selPadre ? 'checked' : ''}>
                                            <div class="flex-1">
                                                <p class="text-[12px] font-black text-slate-700">${cat.nombre}</p>
                                                ${hijas.length > 0 ? `<p class="text-[9px] text-slate-400">${hijas.length} subcategorías</p>` : ''}
                                            </div>
                                            ${selPadre ? '<span class="material-symbols-outlined text-blue-500 text-[14px]">check_circle</span>' : ''}
                                        </label>
                                        ${hijas.map(h => {
                        const selH = this._categoriasSeleccionadas.some(c => c.id === h.id);
                        return `
                                            <label class="flex items-center gap-2.5 px-3 py-1.5 pl-7
                                                          hover:bg-blue-50 cursor-pointer transition-all rounded-xl
                                                          ${selH ? 'bg-blue-50' : ''}">
                                                <input type="checkbox"
                                                       data-cat-id="${h.id}"
                                                       data-cat-nombre="${h.nombre}"
                                                       data-padre-id="${cat.id}"
                                                       class="cat-checkbox w-3.5 h-3.5 rounded accent-blue-500 cursor-pointer"
                                                       ${selH ? 'checked' : ''}>
                                                <div class="flex items-center gap-1.5 flex-1">
                                                    <span class="material-symbols-outlined text-[11px] text-slate-300">subdirectory_arrow_right</span>
                                                    <p class="text-[11px] font-medium text-slate-600">${h.nombre}</p>
                                                </div>
                                            </label>`;
                    }).join('')}
                                    </div>`;
                }).join('')
            }
                        </div>
                    </div>

                    <!-- BUSCADOR PRODUCTOS -->
                    <div class="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <div class="flex items-center gap-2 px-4 py-3 bg-emerald-50 border-b border-emerald-100">
                            <span class="material-symbols-outlined text-emerald-600 text-[18px]">search</span>
                            <p class="text-[11px] font-black text-emerald-700 uppercase tracking-widest flex-1">Buscar Producto</p>
                            ${this._estado.alcance === 'sucursal' && this._estado.id_sucursal
                ? `<span class="flex items-center gap-1 px-2 py-1 bg-violet-100 border border-violet-200
                                               rounded-lg text-[9px] font-black text-violet-600 uppercase">
                                       <span class="material-symbols-outlined text-[11px]">store</span>
                                       ${this._sucursales.find(s => s.id == this._estado.id_sucursal)?.nombre || 'Sucursal'}
                                   </span>`
                : `<span class="flex items-center gap-1 px-2 py-1 bg-slate-100 border border-slate-200
                                               rounded-lg text-[9px] font-black text-slate-500 uppercase">
                                       <span class="material-symbols-outlined text-[11px]">public</span>
                                       Todas
                                   </span>`
            }
                        </div>
                        <div class="p-3">
                            <div class="relative mb-2">
                                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                                             text-slate-400 text-[16px]">inventory_2</span>
                                <input id="p3-buscador-producto" type="text"
                                       placeholder="${this._estado.alcance === 'sucursal' && this._estado.id_sucursal
                ? `Buscar en ${this._sucursales.find(s => s.id == this._estado.id_sucursal)?.nombre || 'sucursal'}...`
                : 'Nombre del producto...'}"
                                       autocomplete="off"
                                       class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl py-2.5 pl-9 pr-4
                                              text-sm outline-none focus:border-emerald-500 focus:bg-white transition-all
                                              font-medium text-slate-700">
                            </div>
                            <div id="p3-resultados-productos" class="max-h-44 overflow-y-auto flex flex-col gap-1">
                                <p class="text-[11px] text-slate-400 italic text-center py-3">
                                    Escribe para buscar...
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Chips de categorías seleccionadas (clicables) -->
                    <div class="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm">
                        <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                            <span class="material-symbols-outlined text-[11px]">category</span>
                            Categorías activas
                            <span id="badge-cat-count" class="ml-auto px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black">
                                ${this._categoriasSeleccionadas.length}
                            </span>
                        </p>
                        <div id="p3-cats-seleccionadas" class="flex flex-wrap gap-1.5 min-h-[32px]">
                            ${this._categoriasSeleccionadas.length === 0
                ? '<p class="text-[10px] text-slate-300 italic w-full text-center py-1">Ninguna seleccionada</p>'
                : this._categoriasSeleccionadas.map(c => this._chipCategoria(c)).join('')
            }
                        </div>
                    </div>
                </div>

                <!-- COLUMNA DERECHA: carrito de productos -->
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                    <!-- Header carrito -->
                    <div class="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <div class="flex items-center gap-2">
                            <span class="material-symbols-outlined text-slate-500 text-[18px]">shopping_cart</span>
                            <p class="text-[11px] font-black text-slate-600 uppercase tracking-widest">Productos con descuento</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span id="badge-prod-count"
                                  class="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                                ${this._productosSeleccionados.length} productos
                            </span>
                            <button id="p3-btn-limpiar-carrito"
                                    class="text-[10px] font-bold text-red-400 hover:text-red-600 transition-all
                                           flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50">
                                <span class="material-symbols-outlined text-[13px]">delete_sweep</span>
                                Limpiar
                            </button>
                        </div>
                    </div>

                    <!-- Tab de categorías activas (para filtrar vista) -->
                    <div id="p3-tabs-categorias" class="flex items-center gap-1 px-3 pt-2 overflow-x-auto hidden">
                        <button data-tab="todos"
                                class="p3-tab-cat flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black
                                       uppercase transition-all bg-slate-800 text-white">
                            Todos
                        </button>
                    </div>

                    <!-- Grid de tarjetas -->
                    <div id="p3-carrito-grid"
                         class="p-4 grid grid-cols-2 gap-3 max-h-[480px] overflow-y-auto">
                        <div class="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                            <span class="material-symbols-outlined text-slate-200 text-[48px] mb-2">shopping_cart</span>
                            <p class="text-sm font-bold text-slate-300">Sin productos seleccionados</p>
                            <p class="text-[11px] text-slate-300 mt-0.5">Selecciona una categoría o busca productos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // CHIP CATEGORÍA (clicable para filtrar carrito)
    // ─────────────────────────────────────────────
    _chipCategoria(cat) {
        return `
        <div class="flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 border border-blue-200
                    rounded-xl text-[10px] font-black text-blue-700 cursor-pointer
                    hover:bg-blue-200 transition-all chip-cat-item"
             data-cat-id="${cat.id}">
            <span class="material-symbols-outlined text-[11px]">category</span>
            ${cat.nombre}
            <button data-cat-id="${cat.id}"
                    class="btn-quitar-cat w-3.5 h-3.5 flex items-center justify-center rounded-full
                           bg-blue-200 hover:bg-red-400 hover:text-white text-blue-500 transition-all ml-0.5">
                <span class="material-symbols-outlined text-[10px]">close</span>
            </button>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // TARJETA DE PRODUCTO EN CARRITO
    // ─────────────────────────────────────────────
    _tarjetaProducto(prod) {
        const { tipo, valor } = this._estado;
        const placeholder = `<div class="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200
                                          flex items-center justify-center">
                                 <span class="material-symbols-outlined text-slate-300 text-[28px]">image_not_supported</span>
                             </div>`;

        // Calcular precios por sucursal
        const esGlobal = this._estado.alcance === 'global';
        const idSucursal = parseInt(this._estado.id_sucursal);
        const precios = prod.precios ?? [];

        let preciosHTML = '';
        if (esGlobal) {
            // Una fila por sucursal
            const sucursalesConPrecio = this._sucursales.map(s => {
                const sp = precios.find(p => p.id_sucursal === s.id);
                const orig = sp ? parseFloat(sp.precio) : null;
                const nuevo = orig !== null ? this._calcularPrecioConDescuento(orig, tipo, parseFloat(valor) || 0) : null;
                const excluido = (prod.excluidos || []).includes(s.id);
                return { suc: s, orig, nuevo, excluido };
            }).filter(x => x.orig !== null);

            if (sucursalesConPrecio.length === 0) {
                preciosHTML = `<p class="text-[10px] text-slate-400 italic">Sin precio registrado</p>`;
            } else {
                preciosHTML = sucursalesConPrecio.map(({ suc, orig, nuevo, excluido }) => `
                <div class="flex items-center justify-between gap-2 py-1 border-b border-slate-50 last:border-0
                            ${excluido ? 'opacity-40' : ''}">
                    <div class="flex items-center gap-1.5 min-w-0">
                        <span class="material-symbols-outlined text-[11px] text-slate-400 flex-shrink-0">store</span>
                        <p class="text-[10px] text-slate-500 truncate">${suc.nombre}</p>
                    </div>
                    <div class="flex items-center gap-1.5 flex-shrink-0">
                        <span class="text-[10px] text-slate-400 line-through">Bs ${orig.toFixed(2)}</span>
                        <span class="text-[11px] font-black text-emerald-600">Bs ${nuevo.toFixed(2)}</span>
                        <button data-prod-id="${prod.id}" data-suc-id="${suc.id}"
                                class="btn-excluir-suc w-5 h-5 flex items-center justify-center rounded-lg
                                       ${excluido
                        ? 'bg-red-100 text-red-500 hover:bg-emerald-100 hover:text-emerald-600'
                        : 'bg-slate-100 text-slate-400 hover:bg-red-100 hover:text-red-500'}
                                       transition-all flex-shrink-0"
                                title="${excluido ? 'Incluir en esta sucursal' : 'Excluir de esta sucursal'}">
                            <span class="material-symbols-outlined text-[12px]">${excluido ? 'add' : 'remove'}</span>
                        </button>
                    </div>
                </div>`).join('');
            }
        } else {
            // Solo precio de la sucursal seleccionada
            const sp = precios.find(p => p.id_sucursal === idSucursal);
            const orig = sp ? parseFloat(sp.precio) : null;
            const nuevo = orig !== null ? this._calcularPrecioConDescuento(orig, tipo, parseFloat(valor) || 0) : null;
            if (orig === null) {
                preciosHTML = `<p class="text-[10px] text-slate-400 italic">Sin precio en esta sucursal</p>`;
            } else {
                preciosHTML = `
                <div class="flex items-center justify-between">
                    <span class="text-sm text-slate-400 line-through font-medium">Bs ${orig.toFixed(2)}</span>
                    <span class="text-base font-black text-emerald-600">Bs ${nuevo.toFixed(2)}</span>
                </div>
                <div class="text-[10px] font-bold text-red-500 text-right">
                    -${tipo === 'porcentaje' ? `${parseFloat(valor)}%` : `Bs ${parseFloat(valor).toFixed(2)}`}
                </div>`;
            }
        }

        return `
        <div class="prod-card bg-white border-2 border-slate-100 rounded-2xl overflow-hidden
                    hover:border-slate-200 transition-all shadow-sm group"
             data-prod-id="${prod.id}" data-cat-id="${prod._catId || ''}">

            <!-- Imagen -->
            <div class="relative h-28 bg-slate-50 overflow-hidden">
                ${prod.imagen
                ? `<img src="${prod.imagen}" alt="${prod.nombre}"
                            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onerror="this.parentElement.innerHTML='${placeholder.replace(/"/g, "'")}'">`
                : placeholder}
                <!-- Botón quitar -->
                <button data-prod-id="${prod.id}"
                        class="btn-quitar-prod absolute top-2 right-2 w-6 h-6 flex items-center justify-center
                               rounded-lg bg-white/90 hover:bg-red-500 hover:text-white text-slate-500
                               shadow transition-all opacity-0 group-hover:opacity-100">
                    <span class="material-symbols-outlined text-[14px]">close</span>
                </button>
                <!-- Badge categoría fuente -->
                ${prod._catNombre ? `
                <div class="absolute bottom-2 left-2 px-2 py-0.5 bg-blue-600/90 backdrop-blur
                            rounded-lg text-[9px] font-black text-white uppercase tracking-wider">
                    ${prod._catNombre}
                </div>` : ''}
            </div>

            <!-- Info -->
            <div class="p-3">
                <p class="text-[12px] font-black text-slate-800 truncate mb-2">${prod.nombre}</p>
                <div class="flex flex-col gap-1">
                    ${preciosHTML}
                </div>
            </div>
        </div>`;
    },

    _calcularPrecioConDescuento(precio, tipo, valor) {
        if (tipo === 'porcentaje') return Math.max(0, precio - precio * (valor / 100));
        return Math.max(0, precio - valor);
    },

    // ─────────────────────────────────────────────
    // EVENTOS PASO 3
    // ─────────────────────────────────────────────
    _bindPaso3() {
        // Checkboxes de categorías
        document.querySelectorAll('.cat-checkbox').forEach(cb => {
            cb.addEventListener('change', async () => {
                const id = parseInt(cb.dataset.catId);
                const nombre = cb.dataset.catNombre;
                const esPadre = cb.dataset.esPadre === 'true';
                const hijasIds = cb.dataset.hijas ? cb.dataset.hijas.split(',').map(Number).filter(Boolean) : [];

                if (cb.checked) {
                    // Agregar esta categoría
                    if (!this._categoriasSeleccionadas.some(c => c.id === id)) {
                        this._categoriasSeleccionadas.push({ id, nombre });
                    }

                    if (esPadre && hijasIds.length > 0) {
                        // Marcar hijas y cargar sus productos
                        for (const hId of hijasIds) {
                            const hCb = document.querySelector(`.cat-checkbox[data-cat-id="${hId}"]`);
                            const hNom = hCb?.dataset.catNombre || '';
                            if (hCb) hCb.checked = true;
                            if (!this._categoriasSeleccionadas.some(c => c.id === hId)) {
                                this._categoriasSeleccionadas.push({ id: hId, nombre: hNom });
                            }
                            // Cargar productos de cada hija
                            await this._agregarProductosDeCategoriaAlCarrito(hId, hNom);
                        }
                    } else {
                        // Categoría individual (hija o sin hijas) → cargar sus productos
                        await this._agregarProductosDeCategoriaAlCarrito(id, nombre);
                    }
                } else {
                    // Quitar esta categoría de seleccionadas
                    this._categoriasSeleccionadas = this._categoriasSeleccionadas.filter(c => c.id !== id);

                    if (esPadre && hijasIds.length > 0) {
                        // Padre desmarcado → desmarcar y quitar productos de todas las hijas
                        hijasIds.forEach(hId => {
                            const hCb = document.querySelector(`.cat-checkbox[data-cat-id="${hId}"]`);
                            if (hCb) hCb.checked = false;
                            this._categoriasSeleccionadas = this._categoriasSeleccionadas.filter(c => c.id !== hId);
                            this._productosSeleccionados = this._productosSeleccionados.filter(p => p._catId !== hId);
                        });
                    }
                    // Quitar solo los productos de ESTA categoría (hija individual o padre sin hijas)
                    this._productosSeleccionados = this._productosSeleccionados.filter(p => p._catId !== id);
                }

                this._refrescarChipsCategorias();
                this._refrescarCarrito();
                this._actualizarPreview();
            });
        });

        // Buscador con debounce
        document.getElementById('p3-buscador-producto')?.addEventListener('input', (e) => {
            clearTimeout(this._debounceTimer);
            this._debounceTimer = setTimeout(() => this._buscarProductos(e.target.value.trim()), 300);
        });

        // Chips de categorías — click para filtrar carrito, X para quitar
        document.getElementById('p3-cats-seleccionadas')?.addEventListener('click', (e) => {
            const btnQuitar = e.target.closest('.btn-quitar-cat');
            if (btnQuitar) {
                const id = parseInt(btnQuitar.dataset.catId);
                this._quitarCategoria(id);
                return;
            }
            // Click en el chip → filtrar carrito por esa categoría
            const chip = e.target.closest('.chip-cat-item');
            if (chip) {
                const id = parseInt(chip.dataset.catId);
                this._filtrarCarritoPorCategoria(id);
            }
        });

        // Limpiar carrito
        document.getElementById('p3-btn-limpiar-carrito')?.addEventListener('click', () => {
            this._productosSeleccionados = [];
            // Desmarcar todos los checkboxes
            document.querySelectorAll('.cat-checkbox').forEach(cb => cb.checked = false);
            this._categoriasSeleccionadas = [];
            this._refrescarChipsCategorias();
            this._refrescarCarrito();
            this._actualizarPreview();
        });

        // Tabs de categoría en el carrito
        document.getElementById('p3-tabs-categorias')?.addEventListener('click', (e) => {
            const btn = e.target.closest('.p3-tab-cat');
            if (!btn) return;
            document.querySelectorAll('.p3-tab-cat').forEach(b => {
                b.className = b.className.replace('bg-slate-800 text-white', 'bg-slate-100 text-slate-500');
            });
            btn.className = btn.className.replace('bg-slate-100 text-slate-500', 'bg-slate-800 text-white');
            const tab = btn.dataset.tab;
            this._filtrarCarritoPorCategoria(tab === 'todos' ? null : parseInt(tab));
        });

        // Delegación carrito: quitar producto + excluir sucursal
        document.getElementById('p3-carrito-grid')?.addEventListener('click', (e) => {
            const btnQuitar = e.target.closest('.btn-quitar-prod');
            if (btnQuitar) {
                const id = parseInt(btnQuitar.dataset.prodId);
                this._productosSeleccionados = this._productosSeleccionados.filter(p => p.id !== id);
                this._refrescarCarrito();
                this._actualizarPreview();
                return;
            }
            const btnExcluir = e.target.closest('.btn-excluir-suc');
            if (btnExcluir) {
                const prodId = parseInt(btnExcluir.dataset.prodId);
                const sucId = parseInt(btnExcluir.dataset.sucId);
                const prod = this._productosSeleccionados.find(p => p.id === prodId);
                if (prod) {
                    prod.excluidos = prod.excluidos || [];
                    if (prod.excluidos.includes(sucId)) {
                        prod.excluidos = prod.excluidos.filter(s => s !== sucId);
                    } else {
                        prod.excluidos.push(sucId);
                    }
                    this._refrescarCarrito();
                }
            }
        });
    },

    // ─────────────────────────────────────────────
    // CARGAR PRODUCTOS DE CATEGORÍA AL CARRITO
    // ─────────────────────────────────────────────
    async _agregarProductosDeCategoriaAlCarrito(id_categoria, nombre_categoria) {
        const grid = document.getElementById('p3-carrito-grid');
        if (grid && this._productosSeleccionados.length === 0) {
            grid.innerHTML = `
            <div class="col-span-2 flex items-center justify-center gap-2 py-6 text-slate-400 text-[11px]">
                <span class="material-symbols-outlined text-[16px] animate-spin">autorenew</span>
                Cargando productos...
            </div>`;
        }

        try {
            if (!this._model) throw new Error('Model no inyectado');
            const productos = await this._model.getProductosPorCategoria(id_categoria);
            productos.forEach(p => {
                if (!this._productosSeleccionados.some(s => s.id === p.id)) {
                    this._productosSeleccionados.push({
                        ...p,
                        _catId: id_categoria,
                        _catNombre: nombre_categoria,
                        excluidos: []
                    });
                }
            });
        } catch (err) {
            console.error(err);
        }

        this._refrescarCarrito();
        this._actualizarPreview();
    },

    // ─────────────────────────────────────────────
    // BÚSQUEDA DE PRODUCTOS
    // ─────────────────────────────────────────────
    async _buscarProductos(query) {
        const resultadosEl = document.getElementById('p3-resultados-productos');
        if (!resultadosEl) return;

        if (!query) {
            resultadosEl.innerHTML = `<p class="text-[11px] text-slate-400 italic text-center py-3">Escribe para buscar...</p>`;
            return;
        }

        resultadosEl.innerHTML = `
        <div class="flex items-center gap-2 text-slate-400 text-[11px] py-2">
            <span class="material-symbols-outlined text-[14px] animate-spin">autorenew</span> Buscando...
        </div>`;

        try {
            if (!this._model) throw new Error('Model no inyectado');
            const idSucursal = this._estado.alcance === 'sucursal' && this._estado.id_sucursal ? parseInt(this._estado.id_sucursal) : null;
            const productos = await this._model.buscarProductos(query, idSucursal);

            if (productos.length === 0) {
                resultadosEl.innerHTML = `<p class="text-[11px] text-slate-400 italic text-center py-3">Sin resultados</p>`;
                return;
            }

            resultadosEl.innerHTML = productos.map(p => {
                const ya = this._productosSeleccionados.some(s => s.id === p.id);
                const img = p.imagen
                    ? `<img src="${p.imagen}" class="w-9 h-9 rounded-lg object-cover flex-shrink-0">`
                    : `<div class="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                           <span class="material-symbols-outlined text-slate-300 text-[16px]">image_not_supported</span>
                       </div>`;
                return `
                <button class="btn-agregar-prod w-full flex items-center gap-2.5 px-2.5 py-2
                               rounded-xl transition-all text-left border
                               ${ya
                        ? 'opacity-50 pointer-events-none bg-slate-50 border-slate-100 cursor-not-allowed'
                        : 'hover:bg-emerald-50 border-transparent hover:border-emerald-100'}"
                        data-prod-id="${p.id}" data-prod-nombre="${p.nombre}"
                        data-prod-imagen="${p.imagen || ''}"
                        data-prod-precios='${JSON.stringify(p.precios || [])}'>
                    ${img}
                    <div class="flex-1 min-w-0">
                        <p class="text-[12px] font-bold text-slate-700 truncate">${p.nombre}</p>
                        <p class="text-[10px] ${ya ? 'text-emerald-500 font-bold' : 'text-slate-400'}">${ya ? 'Ya agregado' : (p.categoria?.nombre || '—')}</p>
                    </div>
                    <span class="material-symbols-outlined text-[18px] flex-shrink-0
                                 ${ya ? 'text-emerald-400' : 'text-emerald-500'}">
                        ${ya ? 'check_circle' : 'add_circle'}
                    </span>
                </button>`;
            }).join('');

            resultadosEl.querySelectorAll('.btn-agregar-prod').forEach(btn => {
                btn.addEventListener('click', () => {
                    const id = parseInt(btn.dataset.prodId);
                    const nombre = btn.dataset.prodNombre;
                    const imagen = btn.dataset.prodImagen || null;
                    let precios = [];
                    try { precios = JSON.parse(btn.dataset.prodPrecios || '[]'); } catch (e) { }

                    if (!this._productosSeleccionados.some(p => p.id === id)) {
                        this._productosSeleccionados.push({ id, nombre, imagen, precios, excluidos: [] });
                        this._refrescarCarrito();
                        this._actualizarPreview();

                        // Limpiar input y cerrar resultados
                        const input = document.getElementById('p3-buscador-producto');
                        if (input) input.value = '';
                        resultadosEl.innerHTML = `<p class="text-[11px] text-slate-400 italic text-center py-3">Escribe para buscar...</p>`;
                    }
                });
            });
        } catch (err) {
            resultadosEl.innerHTML = `<p class="text-[11px] text-red-400 text-center py-2">Error al buscar</p>`;
        }
    },

    // ─────────────────────────────────────────────
    // REFRESCAR CARRITO
    // ─────────────────────────────────────────────
    _refrescarCarrito(filtroCategoria = null) {
        const grid = document.getElementById('p3-carrito-grid');
        const badge = document.getElementById('badge-prod-count');
        const tabsEl = document.getElementById('p3-tabs-categorias');
        if (!grid) return;

        if (badge) badge.textContent = `${this._productosSeleccionados.length} productos`;

        // Actualizar tabs de categorías
        if (tabsEl) {
            const catsConProds = this._categoriasSeleccionadas.filter(c =>
                this._productosSeleccionados.some(p => p._catId === c.id)
            );
            if (catsConProds.length > 0) {
                tabsEl.classList.remove('hidden');
                // Reconstruir tabs preservando el activo
                const tabActivo = tabsEl.querySelector('.p3-tab-cat.bg-slate-800')?.dataset.tab || 'todos';
                tabsEl.innerHTML = `
                <button data-tab="todos"
                        class="p3-tab-cat flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black
                               uppercase transition-all ${tabActivo === 'todos' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}">
                    Todos
                </button>
                ${catsConProds.map(c => `
                <button data-tab="${c.id}"
                        class="p3-tab-cat flex-shrink-0 px-3 py-1.5 rounded-xl text-[10px] font-black
                               uppercase transition-all ${tabActivo == c.id ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}">
                    ${c.nombre}
                </button>`).join('')}`;
            } else {
                tabsEl.classList.add('hidden');
            }
        }

        // Filtrar productos
        const prodsFiltrados = filtroCategoria
            ? this._productosSeleccionados.filter(p => p._catId === filtroCategoria)
            : this._productosSeleccionados;

        if (prodsFiltrados.length === 0) {
            grid.innerHTML = `
            <div class="col-span-2 flex flex-col items-center justify-center py-12 text-center">
                <span class="material-symbols-outlined text-slate-200 text-[48px] mb-2">shopping_cart</span>
                <p class="text-sm font-bold text-slate-300">Sin productos seleccionados</p>
                <p class="text-[11px] text-slate-300 mt-0.5">Selecciona una categoría o busca productos</p>
            </div>`;
            return;
        }

        grid.innerHTML = prodsFiltrados.map(p => this._tarjetaProducto(p)).join('');
    },

    _filtrarCarritoPorCategoria(idCategoria) {
        this._refrescarCarrito(idCategoria);
    },

    _quitarCategoria(id) {
        const cb = document.querySelector(`.cat-checkbox[data-cat-id="${id}"]`);
        const esPadre = cb?.dataset.esPadre === 'true';

        if (esPadre) {
            // Es padre: desmarcar y quitar hijas también
            const hijasIds = cb?.dataset.hijas ? cb.dataset.hijas.split(',').map(Number).filter(Boolean) : [];
            hijasIds.forEach(hId => {
                const hCb = document.querySelector(`.cat-checkbox[data-cat-id="${hId}"]`);
                if (hCb) hCb.checked = false;
                this._categoriasSeleccionadas = this._categoriasSeleccionadas.filter(c => c.id !== hId);
                this._productosSeleccionados = this._productosSeleccionados.filter(p => p._catId !== hId);
            });
        }
        // Siempre quitar solo esta categoría y sus productos
        if (cb) cb.checked = false;
        this._categoriasSeleccionadas = this._categoriasSeleccionadas.filter(c => c.id !== id);
        this._productosSeleccionados = this._productosSeleccionados.filter(p => p._catId !== id);

        this._refrescarChipsCategorias();
        this._refrescarCarrito();
        this._actualizarPreview();
    },
    // ─────────────────────────────────────────────
    _actualizarStepper() {
        [1, 2, 3].forEach(n => {
            const circle = document.getElementById(`step-circle-${n}`);
            const label = document.getElementById(`step-label-${n}`);
            const dot = document.getElementById(`dot-${n}`);

            if (n < this._paso) {
                // Completado
                circle?.classList.remove('bg-blue-600', 'text-white', 'bg-slate-100', 'text-slate-400');
                circle?.classList.add('bg-emerald-500', 'text-white');
                if (circle) circle.innerHTML = '<span class="material-symbols-outlined text-[14px]">check</span>';
                label?.classList.remove('text-blue-600', 'text-slate-400');
                label?.classList.add('text-emerald-500');
                dot?.classList.remove('bg-blue-600', 'bg-slate-200', 'w-6');
                dot?.classList.add('bg-emerald-400', 'w-2');
            } else if (n === this._paso) {
                // Activo
                circle?.classList.remove('bg-emerald-500', 'bg-slate-100', 'text-slate-400');
                circle?.classList.add('bg-blue-600', 'text-white');
                if (circle) circle.textContent = n;
                label?.classList.remove('text-emerald-500', 'text-slate-400');
                label?.classList.add('text-blue-600');
                dot?.classList.remove('bg-slate-200', 'bg-emerald-400', 'w-2');
                dot?.classList.add('bg-blue-600', 'w-6');
            } else {
                // Pendiente
                circle?.classList.remove('bg-blue-600', 'bg-emerald-500', 'text-white');
                circle?.classList.add('bg-slate-100', 'text-slate-400');
                if (circle) circle.textContent = n;
                label?.classList.remove('text-blue-600', 'text-emerald-500');
                label?.classList.add('text-slate-400');
                dot?.classList.remove('bg-blue-600', 'bg-emerald-400', 'w-6');
                dot?.classList.add('bg-slate-200', 'w-2');
            }
        });

        // Botón anterior
        const btnAnt = document.getElementById('df-btn-anterior');
        if (btnAnt) {
            if (this._paso > 1) btnAnt.classList.remove('invisible');
            else btnAnt.classList.add('invisible');
        }

        // Botón siguiente/guardar
        const btnSig = document.getElementById('df-btn-siguiente');
        if (btnSig) {
            if (this._paso === this._totalPasos) {
                btnSig.innerHTML = `<span class="material-symbols-outlined text-base">save</span> Guardar Descuento`;
                btnSig.classList.remove('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-200');
                btnSig.classList.add('bg-emerald-600', 'hover:bg-emerald-700', 'shadow-emerald-200');
            } else {
                btnSig.innerHTML = `Siguiente <span class="material-symbols-outlined text-base">arrow_forward</span>`;
                btnSig.classList.remove('bg-emerald-600', 'hover:bg-emerald-700', 'shadow-emerald-200');
                btnSig.classList.add('bg-blue-600', 'hover:bg-blue-700', 'shadow-blue-200');
            }
        }
    },

    _actualizarBotones() {
        this._actualizarStepper();
    },

    // ─────────────────────────────────────────────
    // PREVIEW EN VIVO
    // ─────────────────────────────────────────────
    _actualizarPreview() {
        const { nombre, tipo, valor, alcance, fecha_inicio, fecha_fin } = this._estado;

        // Nombre
        const pvNombre = document.getElementById('pv-nombre');
        if (pvNombre) pvNombre.textContent = nombre || 'Sin nombre';

        // Header titulo
        const header = document.getElementById('df-titulo-header');
        if (header) header.textContent = nombre || 'Sin nombre';

        // Tipo badge
        const pvTipo = document.getElementById('pv-tipo-badge');
        if (pvTipo) {
            pvTipo.innerHTML = tipo === 'porcentaje'
                ? '<span class="material-symbols-outlined text-[13px]">percent</span> Porcentaje'
                : '<span class="material-symbols-outlined text-[13px]">payments</span> Monto fijo';
            pvTipo.className = pvTipo.className.replace(/bg-\w+-\d+|border-\w+-\d+|text-\w+-\d+/g, '');
            pvTipo.classList.add(
                tipo === 'porcentaje' ? 'bg-blue-50' : 'bg-amber-50',
                tipo === 'porcentaje' ? 'border-blue-100' : 'border-amber-100',
                tipo === 'porcentaje' ? 'text-blue-700' : 'text-amber-700',
                'px-3', 'py-1.5', 'rounded-xl', 'text-[10px]', 'font-black', 'uppercase',
                'border', 'flex', 'items-center', 'gap-1.5'
            );
        }

        // Alcance badge
        const pvAlcance = document.getElementById('pv-alcance-badge');
        if (pvAlcance) {
            const suc = this._sucursales.find(s => s.id == this._estado.id_sucursal);
            pvAlcance.innerHTML = alcance === 'global'
                ? '<span class="material-symbols-outlined text-[13px]">public</span> Global'
                : `<span class="material-symbols-outlined text-[13px]">store</span> ${suc?.nombre || 'Sucursal'}`;
        }

        // Calculadora
        const precio = parseFloat(document.getElementById('pv-precio-ejemplo')?.value) || 100;
        const v = parseFloat(valor) || 0;
        let descuento = 0;
        if (tipo === 'porcentaje') descuento = precio * (v / 100);
        else descuento = Math.min(v, precio);
        const final = Math.max(0, precio - descuento);

        const pvOrig = document.getElementById('pv-precio-original');
        const pvDesc = document.getElementById('pv-descuento-calc');
        const pvFinal = document.getElementById('pv-precio-final');
        if (pvOrig) pvOrig.textContent = `Bs ${precio.toFixed(2)}`;
        if (pvDesc) pvDesc.textContent = `- Bs ${descuento.toFixed(2)}`;
        if (pvFinal) pvFinal.textContent = `Bs ${final.toFixed(2)}`;

        // Fechas
        const pvFechas = document.getElementById('pv-fechas');
        if (pvFechas) {
            if (fecha_inicio || fecha_fin) {
                pvFechas.classList.remove('hidden');
                const fi = document.getElementById('pv-fecha-inicio');
                const ff = document.getElementById('pv-fecha-fin');
                if (fi) fi.textContent = fecha_inicio ? `Inicio: ${fecha_inicio}` : 'Sin fecha inicio';
                if (ff) ff.textContent = fecha_fin ? `Fin: ${fecha_fin}` : 'Sin fecha fin';
            } else {
                pvFechas.classList.add('hidden');
            }
        }

        // Target resumen
        const pvTarget = document.getElementById('pv-target');
        if (pvTarget) {
            const total = this._categoriasSeleccionadas.length + this._productosSeleccionados.length;
            if (total === 0) {
                pvTarget.innerHTML = `
                <div class="flex items-center gap-2 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                    <span class="material-symbols-outlined text-slate-400 text-[14px]">inventory_2</span>
                    <span class="text-[11px] font-bold text-slate-400 italic">Sin asignar</span>
                </div>`;
            } else {
                pvTarget.innerHTML = [
                    ...this._categoriasSeleccionadas.map(c => `
                    <div class="flex items-center gap-2 bg-blue-50 rounded-xl px-3 py-2 border border-blue-100">
                        <span class="material-symbols-outlined text-blue-500 text-[13px]">category</span>
                        <span class="text-[11px] font-bold text-blue-700 truncate">${c.nombre}</span>
                    </div>`),
                    ...this._productosSeleccionados.map(p => `
                    <div class="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2 border border-emerald-100">
                        <span class="material-symbols-outlined text-emerald-600 text-[13px]">inventory_2</span>
                        <span class="text-[11px] font-bold text-emerald-700 truncate">${p.nombre}</span>
                    </div>`)
                ].join('');
            }
        }
    },

    // ─────────────────────────────────────────────
    // EVENTOS GLOBALES (persisten entre pasos)
    // ─────────────────────────────────────────────
    _bindEventosGlobales() {
        // Cancelar
        document.getElementById('df-btn-cancelar')?.addEventListener('click', () => {
            Swal.fire({
                title: '<span class="text-slate-800 font-black uppercase text-sm">¿Salir sin guardar?</span>',
                html: `<div class="text-center"><p class="text-slate-500 text-sm">Los cambios no guardados <br>
                            <span class="text-slate-800 font-bold">se perderán.</span></p></div>`,
                icon: 'warning', showCancelButton: true,
                confirmButtonText: 'Sí, salir', cancelButtonText: 'Seguir editando',
                confirmButtonColor: '#ef4444',
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl',
                    confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                    cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
                }
            }).then(({ isConfirmed }) => {
                if (!isConfirmed) return;
                if (this._onCancelar) this._onCancelar();
            });
        });

        // Botones navegación
        document.getElementById('df-btn-anterior')?.addEventListener('click', () => {
            if (this._paso > 1) { this._recopilarPaso(); this._paso--; this._renderPaso(); }
        });

        document.getElementById('df-btn-siguiente')?.addEventListener('click', () => {
            if (!this._validarPaso()) return;
            this._recopilarPaso();
            if (this._paso < this._totalPasos) {
                this._paso++;
                this._renderPaso();
            } else {
                this._guardar();
            }
        });

        // Botón flotante calculadora → abrir/cerrar modal
        document.getElementById('df-btn-calculadora')?.addEventListener('click', () => {
            document.getElementById('df-modal-calc')?.classList.toggle('hidden');
        });
        document.getElementById('df-btn-cerrar-calc')?.addEventListener('click', () => {
            document.getElementById('df-modal-calc')?.classList.add('hidden');
        });

        // Calculadora precio ejemplo
        document.getElementById('pv-precio-ejemplo')?.addEventListener('input', () => this._actualizarPreview());
    },

    // ─────────────────────────────────────────────
    // EVENTOS DEL PASO ACTUAL
    // ─────────────────────────────────────────────
    _bindEventosPaso() {
        if (this._paso === 1) this._bindPaso1();
        if (this._paso === 2) this._bindPaso2();
        if (this._paso === 3) this._bindPaso3();
    },

    _bindPaso1() {
        // Tipo de descuento
        document.querySelectorAll('.tipo-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._estado.tipo = btn.dataset.tipo;
                document.querySelectorAll('.tipo-btn').forEach(b => {
                    const activo = b.dataset.tipo === this._estado.tipo;
                    b.className = b.className
                        .replace('bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200', '')
                        .replace('bg-white text-slate-500 border-slate-200 hover:border-blue-300', '');
                    b.classList.add(...(activo
                        ? ['bg-blue-600', 'text-white', 'border-blue-600', 'shadow-md', 'shadow-blue-200']
                        : ['bg-white', 'text-slate-500', 'border-slate-200', 'hover:border-blue-300']));
                });
                // Actualizar símbolo
                const simbolo = document.getElementById('p1-simbolo');
                const hint = document.getElementById('p1-valor-hint');
                if (simbolo) simbolo.textContent = this._estado.tipo === 'porcentaje' ? '%' : 'Bs';
                if (hint) hint.textContent = this._estado.tipo === 'porcentaje'
                    ? 'Ingresa un valor entre 1 y 100.'
                    : 'Ingresa el monto fijo en bolivianos.';
                this._recopilarPaso();
                this._actualizarPreview();
            });
        });

        // Inputs en tiempo real → preview
        ['p1-nombre', 'p1-valor', 'p1-fecha-inicio', 'p1-fecha-fin'].forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this._recopilarPaso();
                this._actualizarPreview();
            });
        });
    },

    _bindPaso2() {
        document.querySelectorAll('.alcance-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this._estado.alcance = btn.dataset.alcance;
                // Actualizar estilos
                document.querySelectorAll('.alcance-btn').forEach(b => {
                    const activo = b.dataset.alcance === this._estado.alcance;
                    b.className = b.className
                        .replace('bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200', '')
                        .replace('bg-white border-slate-200 text-slate-500 hover:border-blue-300', '');
                    b.classList.add(...(activo
                        ? ['bg-blue-600', 'border-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-200']
                        : ['bg-white', 'border-slate-200', 'text-slate-500', 'hover:border-blue-300']));
                });
                // Mostrar/ocultar selector de sucursal
                const sel = document.getElementById('p2-selector-sucursal');
                const info = document.getElementById('p2-info-global');
                if (this._estado.alcance === 'sucursal') {
                    sel?.classList.remove('hidden');
                    info?.classList.add('hidden');
                } else {
                    sel?.classList.add('hidden');
                    info?.classList.remove('hidden');
                    this._estado.id_sucursal = '';
                }
                this._actualizarPreview();
            });
        });

        document.getElementById('p2-sucursal')?.addEventListener('change', (e) => {
            this._estado.id_sucursal = e.target.value;
            this._actualizarPreview();
        });
    },

    // ─────────────────────────────────────────────
    // REFRESCAR CHIPS
    _refrescarChipsCategorias() {
        const el = document.getElementById('p3-cats-seleccionadas');
        const badge = document.getElementById('badge-cat-count');
        if (el) {
            el.innerHTML = this._categoriasSeleccionadas.length === 0
                ? '<p class="text-[10px] text-slate-300 italic w-full text-center py-1">Ninguna seleccionada</p>'
                : this._categoriasSeleccionadas.map(c => this._chipCategoria(c)).join('');
        }
        if (badge) badge.textContent = this._categoriasSeleccionadas.length;
    },

    // Ya no hay chips de productos separados — el carrito es la fuente de verdad
    _refrescarChipsProductos() {
        this._refrescarCarrito();
    },

    // ─────────────────────────────────────────────
    // RECOPILAR DATOS DEL PASO
    // ─────────────────────────────────────────────
    _recopilarPaso() {
        if (this._paso === 1) {
            this._estado.nombre = document.getElementById('p1-nombre')?.value.trim() || '';
            this._estado.descripcion = document.getElementById('p1-descripcion')?.value.trim() || '';
            this._estado.valor = document.getElementById('p1-valor')?.value || '';
            this._estado.fecha_inicio = document.getElementById('p1-fecha-inicio')?.value || '';
            this._estado.fecha_fin = document.getElementById('p1-fecha-fin')?.value || '';
            this._estado.activo = document.getElementById('p1-activo')?.checked ?? true;
        }
        if (this._paso === 2) {
            this._estado.id_sucursal = document.getElementById('p2-sucursal')?.value || '';
        }
    },

    // ─────────────────────────────────────────────
    // VALIDACIONES POR PASO
    // ─────────────────────────────────────────────
    _validarPaso() {
        this._recopilarPaso();

        if (this._paso === 1) {
            if (!this._estado.nombre) {
                this._mostrarError('El nombre del descuento es obligatorio.');
                document.getElementById('p1-nombre')?.focus();
                return false;
            }
            const v = parseFloat(this._estado.valor);
            if (!this._estado.valor || isNaN(v) || v <= 0) {
                this._mostrarError('Ingresa un valor válido para el descuento.');
                document.getElementById('p1-valor')?.focus();
                return false;
            }
            if (this._estado.tipo === 'porcentaje' && v > 100) {
                this._mostrarError('El porcentaje no puede ser mayor a 100.');
                return false;
            }
            if (this._estado.fecha_inicio && this._estado.fecha_fin
                && this._estado.fecha_inicio > this._estado.fecha_fin) {
                this._mostrarError('La fecha de inicio no puede ser mayor a la fecha de fin.');
                return false;
            }
        }

        if (this._paso === 2) {
            if (this._estado.alcance === 'sucursal' && !this._estado.id_sucursal) {
                this._mostrarError('Debes seleccionar una sucursal.');
                return false;
            }
        }

        return true;
    },

    _mostrarError(mensaje) {
        Swal.fire({
            icon: 'warning',
            title: '<span class="text-slate-800 font-black uppercase text-sm">Campo requerido</span>',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    // ─────────────────────────────────────────────
    // GUARDAR
    // ─────────────────────────────────────────────
    _guardar() {
        const { nombre, descripcion, tipo, valor, alcance, id_sucursal,
            activo, fecha_inicio, fecha_fin, esEdicion } = this._estado;

        Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">
                        ${esEdicion ? '¿Guardar Cambios?' : '¿Registrar Descuento?'}
                    </span>`,
            html: `<div class="text-center"><p class="text-slate-500 text-sm">
                       Se ${esEdicion ? 'actualizará' : 'creará'} el descuento: <br>
                       <span class="text-slate-800 font-bold">"${nombre}"</span>
                   </p></div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: esEdicion ? 'Sí, guardar' : 'Sí, registrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#059669',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        }).then(({ isConfirmed }) => {
            if (!isConfirmed) return;
            if (this._onGuardar) {
                // Convierte YYYY-MM-DD a ISO con timezone local
                // fecha_inicio → inicio del día, fecha_fin → fin del día (23:59:59)
                const fechaAISO = (val, esFin = false) => {
                    if (!val) return null;
                    const pad = n => String(n).padStart(2, '0');
                    const d = esFin
                        ? new Date(`${val}T23:59:59`)
                        : new Date(`${val}T00:00:00`);
                    const off = -d.getTimezoneOffset();
                    const sign = off >= 0 ? '+' : '-';
                    const hOff = pad(Math.floor(Math.abs(off) / 60));
                    const mOff = pad(Math.abs(off) % 60);
                    return `${val}T${esFin ? '23:59:59' : '00:00:00'}${sign}${hOff}:${mOff}`;
                };
                this._onGuardar({
                    descuento: {
                        nombre, descripcion, tipo,
                        valor: parseFloat(valor),
                        alcance,
                        id_sucursal: id_sucursal || null,
                        activo,
                        fecha_inicio: fechaAISO(fecha_inicio, false),
                        fecha_fin: fechaAISO(fecha_fin, true)
                    },
                    categorias: this._categoriasSeleccionadas.map(c => c.id),
                    productos: this._productosSeleccionados.map(p => p.id)
                });
            }
        });
    }
};