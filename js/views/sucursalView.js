import { PaginationHelper } from '../utils/paginationHelper.js';
import { ActionButtons, TableWidgets } from '../utils/componentUtils.js';

export const sucursalView = {
    // Estado local para manejar UI de forma independiente
    _estado: {
        busqueda: '',
        orden: 'asc',
        paginaActual: 1,
        filasPorPagina: 10
    },

    /**
     * NOTIFICACIONES
     */
    notificarExito(mensaje) {
        // Si había un loading abierto, esto lo limpia y muestra el éxito
        Swal.fire({
            icon: 'success',
            title: '<span class="text-slate-800 font-black uppercase text-sm">¡Operación Exitosa!</span>',
            text: mensaje,
            timer: 2500,
            showConfirmButton: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl'
            }
        });
    },
    notificarError(mensaje) {
        Swal.fire({
            icon: 'error',
            title: '<span class="text-red-600 font-black uppercase text-sm">Error en la Operación</span>',
            text: mensaje,
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-6 py-2 font-bold text-xs uppercase'
            }
        });
    },
    mostrarCargando(mensaje = 'Cargando datos...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Cargando</span>',
            text: mensaje,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });
    },

    /**
 * MODAL DETALLE PROFESIONAL (Horizontal)
 * Retorna true si el usuario presiona "Editar", false si cierra.
 */
    async mostrarDetalle(sucursal) {
        const { isConfirmed } = await Swal.fire({
            title: null,
            html: `
        <div class="flex flex-col md:flex-row gap-6 p-2 text-left">
            <div class="md:w-1/3 flex flex-col items-center justify-center bg-slate-50 rounded-[24px] p-6 border border-slate-100">
                <div class="w-20 h-20 rounded-[24px] bg-white text-indigo-600 flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                    <span class="material-symbols-outlined" style="font-size: 40px;">storefront</span>
                </div>
                <div class="text-center">
                    <span class="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Activa
                    </span>
                </div>
            </div>

            <div class="md:w-2/3 space-y-4">
                <div>
                    <p class="text-[10px] text-slate-400 uppercase font-black tracking-[2px] mb-1">Información General</p>
                    <h2 class="text-slate-800 text-2xl font-black uppercase tracking-tight leading-tight">
                        ${sucursal.nombre}
                    </h2>
                </div>

                <div class="grid grid-cols-1 gap-3">
                    <div class="flex items-start gap-3">
                        <div class="mt-1 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-slate-500 text-lg">location_on</span>
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Ubicación</p>
                            <p class="text-sm text-slate-600 font-medium">${sucursal.direccion || 'Sin dirección'}</p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="mt-1 w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-indigo-500 text-lg">inventory_2</span>
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Capacidad de Stock</p>
                            <p class="text-sm text-slate-600 font-medium">
                                <span class="text-indigo-600 font-bold">${sucursal.total_productos || 0}</span> Productos registrados
                            </p>
                        </div>
                    </div>

                    <div class="flex items-start gap-3">
                        <div class="mt-1 w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-amber-500 text-lg">verified_user</span>
                        </div>
                        <div>
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Tipo de Sede</p>
                            <p class="text-sm text-slate-600 font-medium">Punto de Venta Autorizado</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`,
            showCancelButton: true,
            confirmButtonText: `
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">edit</span> Editar Sucursal
            </div>`,
            cancelButtonText: 'Cerrar',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[95%] max-w-2xl p-6',
                confirmButton: 'bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all mr-3 shadow-lg shadow-indigo-200',
                cancelButton: 'bg-slate-100 hover:bg-slate-200 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all'
            }
        });

        return isConfirmed; // IMPORTANTE: Retornamos la decisión al Controller
    },
    async mostrarConfirmacionEliminar(sucursal) {
        const { isConfirmed } = await Swal.fire({
            title: null,
            html: `
        <div class="flex flex-col md:flex-row gap-6 p-2 text-left">
            <div class="md:w-1/3 flex flex-col items-center justify-center bg-red-50 rounded-[24px] p-6 border border-red-100">
                <div class="w-20 h-20 rounded-[24px] bg-white text-red-600 flex items-center justify-center shadow-sm mb-4 border border-red-100">
                    <span class="material-symbols-outlined" style="font-size: 40px;">warning</span>
                </div>
                <div class="text-center">
                    <span class="px-3 py-1 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase tracking-wider">
                        Acción Irreversible
                    </span>
                </div>
            </div>

            <div class="md:w-2/3 space-y-4">
                <div>
                    <p class="text-[10px] text-red-400 uppercase font-black tracking-[2px] mb-1">Confirmar Eliminación</p>
                    <h2 class="text-slate-800 text-2xl font-black uppercase tracking-tight leading-tight">
                        ${sucursal.nombre}
                    </h2>
                    <p class="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                        Se borrará la sucursal y se perderá el vínculo con su inventario.
                    </p>
                </div>

                <div class="grid grid-cols-1 gap-2">
                    <div class="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span class="material-symbols-outlined text-slate-400 text-lg">location_on</span>
                        <p class="text-xs text-slate-600 font-medium truncate">${sucursal.direccion || 'Sin dirección'}</p>
                    </div>

                    <div class="flex items-center gap-3 bg-red-50/50 p-3 rounded-xl border border-red-100/50">
                        <span class="material-symbols-outlined text-red-500 text-lg">inventory_2</span>
                        <div>
                            <p class="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Stock Afectado</p>
                            <p class="text-xs text-slate-700 font-bold">
                                ${sucursal.total_productos || 0} Productos vinculados
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>`,
            showCancelButton: true,
            confirmButtonText: `
            <div class="flex items-center gap-2">
                <span class="material-symbols-outlined text-sm">delete_forever</span> Eliminar Ahora
            </div>`,
            cancelButtonText: 'Cancelar',
            buttonsStyling: false,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[95%] max-w-2xl p-6',
                confirmButton: 'bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all mr-3 shadow-lg shadow-red-200',
                cancelButton: 'bg-slate-100 hover:bg-slate-200 text-slate-500 px-8 py-3 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all'
            }
        });

        return isConfirmed;
    },
    /**
     * RENDER PRINCIPAL
     */
    render(datos, columnasVisibles = []) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;

        const cols = columnasVisibles.length > 0 ? columnasVisibles :
            ['nro', 'sucursal', 'direccion', 'productos', 'acciones'];

        let datosFiltrados = this._ordenarDatos(this._filtrarDatos(datos));
        const inicio = (this._estado.paginaActual - 1) * this._estado.filasPorPagina;
        const datosPaginados = datosFiltrados.slice(inicio, inicio + this._estado.filasPorPagina);

        const html = `
    <div class="p-8 animate-fade-in max-h-[calc(100vh-64px)] overflow-y-auto">
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
                <h1 class="text-2xl font-bold text-slate-800 tracking-tight">Gestión de Sucursales</h1>
                <p class="text-slate-500 text-sm font-medium">Administración de sedes físicas, inventarios y puntos de venta.</p>
            </div>
            <div class="flex flex-wrap gap-3">
                <button onclick="sucursalController.mostrarFormularioCrear()" 
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl transition-all shadow-lg shadow-indigo-200 font-bold text-sm flex items-center gap-2 w-fit">
                    <span class="material-symbols-outlined text-[20px]">add_business</span> Nueva Sucursal
                </button>
            </div>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div class="relative flex-1 md:w-96">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                <input type="text" 
                       id="input-busqueda-sucursales"
                       placeholder="Buscar por nombre o dirección..." 
                       value="${this._estado.busqueda}"
                       oninput="sucursalView.gestionarBusqueda(this.value)"
                       class="w-full bg-white border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium">
            </div>
            
            <div class="flex items-center gap-2">
                <button onclick="sucursalView.gestionarOrden()" 
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">${this._estado.orden === 'asc' ? 'sort_by_alpha' : 'text_rotate_vertical'}</span>
                    ${this._estado.orden === 'asc' ? 'A-Z' : 'Z-A'}
                </button>

                <button onclick="configuracionColumnasController.iniciarFlujoConfiguracion('sucursales', (cols) => { sucursalController._columnasVisibles = cols; sucursalController.refrescarVista(); })"
                        class="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-indigo-600 transition-all shadow-sm font-bold text-sm">
                    <span class="material-symbols-outlined text-lg">view_column</span>
                    Columnas
                </button>
            </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mb-8">
            <div class="overflow-x-auto"> 
                <table class="w-full text-left border-collapse table-auto"> 
                    <thead>
                        <tr class="bg-slate-50/80 border-b border-slate-200">
                            ${cols.includes('nro') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase w-16 text-center">N°</th>` : ''}
                            ${cols.includes('sucursal') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Sucursal</th>` : ''}
                            ${cols.includes('direccion') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Dirección</th>` : ''}
                            ${cols.includes('productos') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Productos</th>` : ''}
                            ${cols.includes('acciones') ? `<th class="px-6 py-5 text-[11px] font-bold text-slate-400 uppercase text-center">Acciones</th>` : ''}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${datosPaginados.length > 0
                ? datosPaginados.map((s, index) => this._crearFila(s, inicio + index + 1, cols)).join('')
                : `<tr><td colspan="5" class="px-6 py-12 text-center text-slate-400 italic text-sm">No se encontraron sucursales registradas</td></tr>`
            }
                    </tbody>
                </table>
            </div>
            ${PaginationHelper.render(datosFiltrados.length, this._estado.filasPorPagina, this._estado.paginaActual, 'sucursalView')}
        </div>
    </div>
    `;

        contenedor.innerHTML = html;
        this._enfocarBusqueda();
    },

    _crearFila(s, numero, cols = []) {
        return `
    <tr class="hover:bg-slate-50/50 transition-colors group">
        ${cols.includes('nro') ? `
        <td class="px-6 py-5 text-center">
            <span class="text-slate-400 font-bold text-xs">${numero}</span>
        </td>` : ''}
        ${cols.includes('sucursal') ? `
        <td class="px-6 py-5">
            <div class="flex items-center justify-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-sm border border-indigo-100/50 flex-shrink-0">
                    <span class="material-symbols-outlined" style="font-variation-settings: 'wght' 200; font-size: 18px;">storefront</span>
                </div>
                <span class="text-slate-800 font-bold uppercase text-[13px] tracking-wide truncate">${s.nombre}</span>
            </div>
        </td>` : ''}
        ${cols.includes('direccion') ? `
        <td class="px-6 py-5 text-center">
            <div class="flex items-center justify-center gap-1.5 text-slate-500">
                <span class="material-symbols-outlined text-[16px] text-slate-400" style="font-variation-settings: 'wght' 200;">location_on</span>
                <span class="text-xs font-medium truncate max-w-[250px]">${s.direccion || 'Sin dirección registrada'}</span>
            </div>
        </td>` : ''}
        ${cols.includes('productos') ? `
        <td class="px-6 py-5 text-center">
            ${TableWidgets.badge(s.total_productos || 0, 'Items')}
        </td>` : ''}
        ${cols.includes('acciones') ? `
        <td class="px-6 py-5 text-center">
            <div class="flex justify-center gap-2">
                ${ActionButtons.render(s.id, 'edit', 'Editar', 'blue', 'sucursalController.editar')}
                ${ActionButtons.render(s.id, 'visibility', 'Ver Detalle', 'indigo', 'sucursalController.verDetalle')}
                ${ActionButtons.render(s.id, 'delete', 'Eliminar', 'red', 'sucursalController.confirmarEliminacion')}
            </div>
        </td>` : ''}
    </tr>`;
    },
    /**
     * LÓGICA DE FILTRADO Y ORDEN
     */
    _filtrarDatos(datos) {
        if (!this._estado.busqueda) return [...datos];
        const term = this._estado.busqueda.toLowerCase();
        return datos.filter(s =>
            s.nombre.toLowerCase().includes(term) ||
            (s.direccion && s.direccion.toLowerCase().includes(term))
        );
    },

    _ordenarDatos(datos) {
        // Hacemos una copia para no mutar el original por accidente
        return [...datos].sort((a, b) => {
            // Manejamos posibles valores nulos o indefinidos
            const valA = (a.nombre || "").toLowerCase();
            const valB = (b.nombre || "").toLowerCase();

            if (this._estado.orden === 'asc') {
                return valA.localeCompare(valB, undefined, { sensitivity: 'base' });
            } else {
                return valB.localeCompare(valA, undefined, { sensitivity: 'base' });
            }
        });
    },

    gestionarBusqueda(valor) {
        this._estado.busqueda = valor;
        this._estado.paginaActual = 1;
        sucursalController.inicializar(true);
    },

    gestionarOrden() {
        this._estado.orden = this._estado.orden === 'asc' ? 'desc' : 'asc';
        sucursalController.refrescarVista();
    },

    cambiarPagina(nuevaPagina) {
        this._estado.paginaActual = nuevaPagina;
        sucursalController.refrescarVista();
    },

    _enfocarBusqueda() {
        const input = document.getElementById('input-busqueda-sucursales');
        if (input) {
            input.focus();
            input.setSelectionRange(input.value.length, input.value.length);
        }
    },

    async confirmarAccion({ titulo, sucursalNombre, mensajePersonalizado, botonConfirmar = 'Confirmar' }) {
        // La vista decide que el nombre de la sucursal va en negrita o color
        const htmlContent = `
        <div class="text-center">
            <p class="text-slate-500 text-sm">
                ${mensajePersonalizado} <br>
                <span class="text-slate-800 font-bold">"${sucursalNombre}"</span>
            </p>
        </div>
    `;

        return await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">${titulo}</span>`,
            html: htmlContent,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: botonConfirmar,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all hover:scale-105',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });
    },
    async mostrarFormulario({ titulo, datos = {}, esEdicion = false }) {
        const { value: formValues } = await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">${titulo}</span>`,
            html: `
            <div class="text-left space-y-4 p-2">
                <div class="space-y-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Nombre de Sucursal</label>
                    <input id="swal-nombre" type="text" 
                           class="bg-white shadow-sm border border-slate-200 w-full rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700" 
                           placeholder="Ej. Sucursal Central" value="${datos.nombre || ''}">
                </div>

                <div class="space-y-1">
                    <label class="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Dirección</label>
                    <textarea id="swal-direccion" 
                              rows="3"
                              class="w-full bg-white shadow-sm border border-slate-200 rounded-2xl py-3 px-4 text-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 resize-none" 
                              placeholder="Calle, número, zona...">${datos.direccion || ''}</textarea>
                </div>
            </div>
        `,
            showCancelButton: true,
            confirmButtonText: esEdicion ? 'Guardar Cambios' : 'Registrar Sucursal',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#4f46e5',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[90%] max-w-md',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all hover:scale-105 shadow-lg shadow-indigo-200',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors'
            },
            preConfirm: () => {
                const nombre = document.getElementById('swal-nombre').value.trim();
                const direccion = document.getElementById('swal-direccion').value.trim();

                // Validaciones básicas
                if (!nombre) {
                    Swal.showValidationMessage('Por favor, ingresa el nombre de la sucursal');
                    return false;
                }
                if (!direccion) {
                    Swal.showValidationMessage('La dirección es necesaria');
                    return false;
                }

                // Retornamos solo los datos que pediste
                return { nombre, direccion };
            }
        });

        return formValues;
    },

    verInventario(id) {
        sucursalController.obtenerDetalleCompleto(id);
    }
};

window.sucursalView = sucursalView;