import { carruselController } from '../controllers/carruselController.js';
import { RegisterCarrusel } from '../modules/carrusel/registerCarrusel.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const carruselController_View = {
    _estado: {
        busqueda: '',
        orden: 'asc',
        paginaActual: 1,
        filasPorPagina: 10
    },
    _modalEstado: {
        indexActual: 0
    },

    // ─────────────────────────────────────────────
    // SELECCIÓN POR LOTE
    // ─────────────────────────────────────────────

    toggleLote(id) {
        selectorUtil.toggle(id, (cant) => this._actualizarBarraFlotante(cant));
        const fila = document.querySelector(`input.fila-checkbox-car[data-id="${id}"]`)?.closest('tr');
        if (fila) fila.classList.toggle('bg-blue-50/70', selectorUtil.estado.seleccionados.includes(String(id)));
    },

    toggleLoteTodos(datos) {
        selectorUtil.toggleTodos(datos, (cant) => this._actualizarBarraFlotante(cant));
        const isAllChecked = selectorUtil.estado.seleccionados.length >= datos.length;
        document.querySelectorAll('input.fila-checkbox-car').forEach(chk => {
            chk.checked = isAllChecked;
            chk.closest('tr')?.classList.toggle('bg-blue-50/70', isAllChecked);
        });
        const master = document.getElementById('check-all-car');
        if (master) master.checked = isAllChecked;
    },

    limpiarSeleccion() {
        selectorUtil.limpiar((cant) => this._actualizarBarraFlotante(cant));
        carruselController.refrescarVista();
    },

    _renderBarraFlotante() {
        return `
        <div id="bulk-actions-bar-car"
             class="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]
                    translate-y-28 opacity-0 pointer-events-none transition-all duration-500">
            <div class="bg-white/95 backdrop-blur-xl border border-slate-200 p-2.5 rounded-[26px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center gap-2">
                <div class="flex items-center gap-3 px-4 py-2 border-r border-slate-100 mr-1">
                    <div class="w-9 h-9 bg-red-600 rounded-xl flex items-center justify-center shadow-red-200 shadow-lg">
                        <span class="material-symbols-outlined text-white text-xl">view_carousel</span>
                    </div>
                    <div class="flex flex-col">
                        <span id="lote-car-contador" class="text-[13px] font-bold text-slate-800 leading-none">0 seleccionados</span>
                        <span class="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Acciones masivas</span>
                    </div>
                </div>
                <button onclick="carruselController_View.confirmarEliminacionMasiva()"
                        class="flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition-all duration-300">
                    <span class="material-symbols-outlined text-lg">delete_sweep</span>
                    <span class="text-[11px] font-black uppercase tracking-tight">Eliminar</span>
                </button>
                <button onclick="carruselController_View.limpiarSeleccion()"
                        class="w-11 h-11 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-200 transition-all ml-1">
                    <span class="material-symbols-outlined">close</span>
                </button>
            </div>
        </div>`;
    },

    _actualizarBarraFlotante(cantidad) {
        const barra = document.getElementById('bulk-actions-bar-car');
        const contador = document.getElementById('lote-car-contador');
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

    confirmarEliminacionMasiva() {
        const ids = selectorUtil.estado.seleccionados;
        if (ids.length === 0) return;
        Swal.fire({
            title: `<span class="text-red-600 font-black uppercase text-xs">¿ELIMINAR ${ids.length} CARRUSELES?</span>`,
            html: `<p class="text-sm text-slate-600">Se eliminarán los carruseles y todos sus banners vinculados. No se puede deshacer.</p>`,
            icon: 'warning', showCancelButton: true, reverseButtons: true,
            confirmButtonText: 'SÍ, ELIMINAR TODO', cancelButtonText: 'CANCELAR',
            confirmButtonColor: '#ef4444',
            customClass: { popup: 'rounded-[32px] shadow-2xl', confirmButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase', cancelButton: 'rounded-xl px-5 py-2.5 text-xs font-bold uppercase' }
        }).then(r => { if (r.isConfirmed) carruselController.eliminarMasivo(ids); });
    },

    notificarExito(mensaje) {
        Swal.fire({
            icon: 'success',
            title: `<span class="text-slate-800 font-black uppercase text-sm">${mensaje}</span>`,
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
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    async confirmarEliminacion(nombre) {
        const nombreStr = nombre.toUpperCase();
        const primerPaso = await Swal.fire({
            title: '<span class="text-red-600 font-black uppercase text-sm">¿Confirmar Eliminación?</span>',
            html: `
                <div class="mb-4 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700 text-[11px] font-bold leading-relaxed text-center">
                    ATENCIÓN: Se eliminará la configuración y todos los banners vinculados.
                </div>
                <div class="text-left p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-inner">
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Registro a eliminar</p>
                    <p class="text-slate-800 font-bold text-lg uppercase text-center">${nombreStr}</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            reverseButtons: true,
            confirmButtonText: 'Sí, Eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc2626',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-6 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-6 py-3 font-bold text-sm uppercase bg-slate-100 text-slate-500'
            }
        });

        if (primerPaso.isConfirmed) {
            const segundoPaso = await Swal.fire({
                title: '<span class="text-slate-800 font-black uppercase text-sm">Verificación Final</span>',
                text: `¿Estás absolutamente seguro de borrar "${nombreStr}"?`,
                icon: 'error',
                showCancelButton: true,
                reverseButtons: true,
                confirmButtonText: 'SÍ, BORRAR DEFINITIVAMENTE',
                cancelButtonText: 'CANCELAR',
                confirmButtonColor: '#000000',
                customClass: {
                    popup: 'rounded-[32px] border-4 border-red-600 shadow-2xl',
                    confirmButton: 'rounded-xl px-6 py-3 font-bold text-sm uppercase',
                    cancelButton: 'rounded-xl px-6 py-3 font-bold text-sm uppercase bg-slate-100 text-slate-500'
                }
            });
            return segundoPaso.isConfirmed;
        }
        return false;
    },

    async render(columnasVisibles = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        const cols = columnasVisibles.length > 0 ? columnasVisibles :
            ['nro', 'nombre', 'ubicacion', 'tipo', 'acciones'];

        Swal.fire({
            title: 'Cargando registros',
            html: 'Sincronizando con la base de datos...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); },
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });

        try {
            let datos = await carruselController.cargarCarruseles();
            let datosFiltrados = this._ordenarDatos(this._filtrarDatos(datos));
            const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
            const datosPaginados = datosFiltrados.slice(inicio, inicio + this._estado.filasPorPagina);
            window._carruselesPaginados = datosPaginados;

            Swal.close();

            contenedor.innerHTML = `
        <div class="p-8 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto">
            <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Carruseles y Banners</h1>
                    <p class="text-slate-500 text-sm">Gestiona la publicidad y colecciones de la página principal.</p>
                </div>
            </div>

            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div class="flex items-center gap-3 w-full md:w-auto">
                    <div class="relative flex-1 md:w-64">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input type="text" 
                               placeholder="Buscar carrusel..." 
                               value="${this._estado.busqueda}"
                               oninput="carruselController_View.gestionarBusqueda(this.value)"
                               class="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium">
                    </div>
                    <button onclick="carruselController_View.gestionarOrden()" 
                            class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all shadow-sm font-bold text-sm">
                        <span class="material-symbols-outlined text-lg">${this._estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                        ${this._estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                    </button>
                    <button onclick="configuracionColumnasController.iniciarFlujoConfiguracion('carruseles', async () => { await carruselController.inicializar(); })"
                            class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-blue-600 transition-all shadow-sm font-bold text-sm">
                        <span class="material-symbols-outlined text-lg">view_column</span>
                        Columnas
                    </button>
                </div>
                <button onclick="RegisterCarrusel.init('content-area')" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition-all shadow-md font-bold text-sm flex items-center gap-2">
                    <span class="material-symbols-outlined text-[20px]">add</span> Nuevo Carrusel
                </button>
            </div>

            <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse table-auto">
                        <thead>
                            <tr class="bg-slate-50/80 border-b border-slate-200">
                                <th class="px-4 py-5 w-12 text-center">
                                    <input type="checkbox" id="check-all-car"
                                           class="w-4 h-4 rounded accent-blue-600 cursor-pointer"
                                           onchange="carruselController_View.toggleLoteTodos(window._carruselesPaginados)">
                                </th>
                                ${cols.includes('nro') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase w-24 text-center">N°</th>` : ''}
                                ${cols.includes('nombre') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center min-w-[200px]">Nombre / Descripción</th>` : ''}
                                ${cols.includes('ubicacion') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center min-w-[150px]">Ubicación</th>` : ''}
                                ${cols.includes('tipo') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center min-w-[120px]">Tipo</th>` : ''}
                                ${cols.includes('acciones') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center w-64">Acciones</th>` : ''}
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            ${datosPaginados.length > 0
                    ? datosPaginados.map((item, index) => this._crearFila(item, inicio + index, cols)).join('')
                    : `<tr><td colspan="6" class="px-6 py-12 text-center text-slate-400 italic text-sm">No se encontraron carruseles</td></tr>`
                }
                        </tbody>
                    </table>
                </div>
            </div>
        </div>` + this._renderBarraFlotante();

            setTimeout(() => {
                selectorUtil.sincronizarChecks();
                this._actualizarBarraFlotante(selectorUtil.estado.seleccionados.length);
            }, 0);

        } catch (error) {
            Swal.close();
            this.notificarError("Error al conectar con el servidor.");
        }
    },

    _crearFila(item, index, cols = []) {
        const isChecked = selectorUtil.estado.seleccionados.includes(String(item.id)) ? 'checked' : '';
        return `
    <tr class="hover:bg-blue-50/40 transition-colors group ${isChecked ? 'bg-blue-50/70' : ''}">
        <td class="px-4 py-4 text-center">
            <input type="checkbox" ${isChecked}
                   class="fila-checkbox-car w-4 h-4 rounded accent-blue-600 cursor-pointer"
                   data-id="${item.id}"
                   onchange="carruselController_View.toggleLote('${item.id}')">
        </td>
        ${cols.includes('nro') ? `
        <td class="px-6 py-4 text-sm text-slate-400 font-bold text-center border-r border-slate-50/50">
            ${index + 1}
        </td>` : ''}
        ${cols.includes('nombre') ? `
        <td class="px-6 py-4 text-center">
            <div class="flex flex-col items-center">
                <span class="text-slate-800 font-bold uppercase text-[13px] tracking-wide">${item.nombre}</span>
                <span class="text-[10px] text-slate-400 font-medium">${item.descripcion || 'SIN DESCRIPCIÓN'}</span>
            </div>
        </td>` : ''}
        ${cols.includes('ubicacion') ? `
        <td class="px-6 py-4 text-center">
            <span class="px-4 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-black border border-slate-200 uppercase shadow-sm">
                ${item.ubicacion_slug}
            </span>
        </td>` : ''}
        ${cols.includes('tipo') ? `
        <td class="px-6 py-4 text-center text-sm text-slate-600 font-semibold uppercase">
            ${item.tipo}
        </td>` : ''}
        ${cols.includes('acciones') ? `
        <td class="px-6 py-4">
            <div class="flex items-center justify-center gap-2">
                <button onclick="carruselController.abrirEditor('${item.id}')" 
                        title="Editar" 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">edit</span>
                </button>
                <button onclick="carruselController_View.verDetalles('${item.id}', '${item.nombre}', '${item.tipo}')" 
                        title="Vista Previa" 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-800 hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">visibility</span>
                </button>
                <button onclick="carruselController.borrarCarruselCompleto('${item.id}')" 
                        title="Eliminar" 
                        class="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
            </div>
        </td>` : ''}
    </tr>`;
    },

    async verDetalles(id, nombre, tipo) {
        Swal.fire({ title: 'Cargando...', didOpen: () => Swal.showLoading(), background: 'transparent' });

        try {
            const items = await carruselController.cargarItemsPorCarrusel(id);
            this._modalEstado.indexActual = 0;
            if (this._autoplayInterval) clearInterval(this._autoplayInterval);

            Swal.fire({
                html: window.carruselTemplates.renderConsultaPro(items, 0, tipo),
                width: '1000px', // Ancho controlado
                background: 'transparent',
                showConfirmButton: false,
                showCloseButton: true,
                closeButtonHtml: '<span class="material-symbols-outlined text-white text-4xl">close</span>',
                customClass: {
                    htmlContainer: 'overflow-hidden-important', // Clase personalizada para evitar scroll
                    popup: 'bg-transparent shadow-none'
                },
                didOpen: () => {
                    const slides = document.querySelectorAll('.modal-slide-consulta');
                    if (slides.length > 1) {
                        this._autoplayInterval = setInterval(() => {
                            this.moverModalSlide(1, slides.length);
                        }, 4000);
                    }
                },
                willClose: () => clearInterval(this._autoplayInterval)
            });
        } catch (error) { console.error(error); }
    },
    moverModalSlide(direccion, total) {
        if (total <= 1) return;
        this._modalEstado.indexActual = (this._modalEstado.indexActual + direccion + total) % total;

        // 1. Alternar Visibilidad de Slides
        const slides = document.querySelectorAll('.modal-slide-consulta');
        slides.forEach((slide, i) => {
            slide.classList.toggle('hidden', i !== this._modalEstado.indexActual);
            slide.classList.toggle('flex', i === this._modalEstado.indexActual);
        });

        // 2. Animar Indicadores (Dots)
        const dots = document.querySelectorAll('#modal-dots-consulta div');
        dots.forEach((dot, i) => {
            if (i === this._modalEstado.indexActual) {
                dot.className = 'h-1.5 w-12 rounded-full bg-blue-500 transition-all duration-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]';
            } else {
                dot.className = 'h-1.5 w-3 rounded-full bg-white/30 transition-all duration-500';
            }
        });
    },

    _filtrarDatos(datos) {
        if (!this._estado.busqueda) return [...datos];
        const term = this._estado.busqueda.toLowerCase();
        return datos.filter(item => item.nombre.toLowerCase().includes(term));
    },

    _ordenarDatos(datos) {
        return [...datos].sort((a, b) => {
            const nombreA = a.nombre.toLowerCase();
            const nombreB = b.nombre.toLowerCase();
            return this._estado.orden === 'asc' ? nombreA.localeCompare(nombreB) : nombreB.localeCompare(nombreA);
        });
    },

    gestionarBusqueda(valor) {
        this._estado.busqueda = valor;
        this._estado.paginaActual = 1;
        carruselController.refrescarVista();
    },

    gestionarOrden() {
        this._estado.orden = this._estado.orden === 'asc' ? 'desc' : 'asc';
        carruselController.refrescarVista();
    },
};

window.carruselController_View = carruselController_View;