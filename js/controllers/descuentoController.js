/**
 * descuentoController.js
 * Controlador MVC para el módulo de descuentos.
 */

import { descuentoModel } from '../models/descuentoModel.js';
import { descuentoView } from '../views/descuentoView.js';
import { descuentoFormView } from '../views/descuentoFormView.js';

export const descuentoController = {

    _datosCache: [],

    // ─────────────────────────────────────────────
    // INICIALIZAR TABLA
    // ─────────────────────────────────────────────
    async inicializar(silencioso = false) {
        if (!silencioso) descuentoView.mostrarCargando('Cargando descuentos...');

        try {
            this._datosCache = await descuentoModel.getAll();
            Swal.close();
            descuentoView.mostrarTabla(this._datosCache);
        } catch (error) {
            console.error('Controller Error [descuento.inicializar]:', error);
            Swal.close();
            descuentoView.notificarError('Error al cargar los descuentos.');
        }
    },

    // ─────────────────────────────────────────────
    // CREAR
    // ─────────────────────────────────────────────
    async mostrarFormularioCrear() {
        descuentoView.mostrarCargando('Preparando formulario...');

        try {
            const [sucursales, categorias] = await Promise.all([
                descuentoModel.getSucursales(),
                descuentoModel.getCategorias()
            ]);
            Swal.close();

            await descuentoFormView.abrir({
                esEdicion: false,
                sucursales,
                categorias,
                model: descuentoModel,
                productosIniciales: [],
                categoriasIniciales: [],
                onGuardar: (payload) => this._crear(payload),
                onCancelar: () => this.inicializar(true)
            });
        } catch (error) {
            console.error(error);
            Swal.close();
            descuentoView.notificarError('Error al preparar el formulario.');
        }
    },

    async _crear({ descuento, categorias, productos }) {
        descuentoView.mostrarCargando('Guardando descuento...');
        try {
            const nuevo = await descuentoModel.create(descuento);
            // Sincronizar relaciones
            await Promise.all([
                descuentoModel.sincronizarCategorias(nuevo.id, categorias),
                descuentoModel.sincronizarProductos(nuevo.id, productos)
            ]);
            await this.inicializar(true);
            descuentoView.notificarExito(`El descuento "${nuevo.nombre}" fue creado correctamente.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            descuentoView.notificarError('Error al crear el descuento.');
        }
    },

    // ─────────────────────────────────────────────
    // EDITAR
    // ─────────────────────────────────────────────
    async editar(id) {
        descuentoView.mostrarCargando('Cargando datos...');

        try {
            const [descuento, sucursales, categorias, productosAsignados, categoriasAsignadas] = await Promise.all([
                descuentoModel.getById(id),
                descuentoModel.getSucursales(),
                descuentoModel.getCategorias(),
                descuentoModel.getProductosDelDescuento(id),
                descuentoModel.getCategoriasDelDescuento(id)
            ]);
            Swal.close();

            await descuentoFormView.abrir({
                datos: descuento,
                esEdicion: true,
                sucursales,
                categorias,
                model: descuentoModel,
                productosIniciales: productosAsignados,
                categoriasIniciales: categoriasAsignadas,
                onGuardar: (payload) => this._actualizar(id, payload),
                onCancelar: () => this.inicializar(true)
            });
        } catch (error) {
            console.error(error);
            Swal.close();
            descuentoView.notificarError('Error al cargar el descuento.');
        }
    },

    async _actualizar(id, { descuento, categorias, productos }) {
        descuentoView.mostrarCargando('Guardando cambios...');
        try {
            const actualizado = await descuentoModel.update(id, descuento);
            await Promise.all([
                descuentoModel.sincronizarCategorias(id, categorias),
                descuentoModel.sincronizarProductos(id, productos)
            ]);
            await this.inicializar(true);
            descuentoView.notificarExito(`El descuento "${actualizado.nombre}" fue actualizado.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            descuentoView.notificarError('Error al actualizar el descuento.');
        }
    },

    // ─────────────────────────────────────────────
    // TOGGLE ACTIVO
    // ─────────────────────────────────────────────
    async toggleActivo(id, nuevoEstado) {
        const descuento = this._datosCache.find(d => d.id == id);
        if (!descuento) return;

        const accion = nuevoEstado ? 'activar' : 'desactivar';

        const { isConfirmed } = await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">¿${nuevoEstado ? 'Activar' : 'Desactivar'} descuento?</span>`,
            html: `<div class="text-center"><p class="text-slate-500 text-sm">
                       Se va a <span class="font-bold text-slate-700">${accion}</span> el descuento: <br>
                       <span class="text-slate-800 font-bold">"${descuento.nombre}"</span>
                   </p></div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: `Sí, ${accion}`,
            cancelButtonText: 'Cancelar',
            confirmButtonColor: nuevoEstado ? '#059669' : '#64748b',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });

        if (!isConfirmed) return;

        try {
            descuentoView.mostrarCargando(nuevoEstado ? 'Activando...' : 'Desactivando...');
            await descuentoModel.toggleActivo(id, nuevoEstado);
            await this.inicializar(true);
            descuentoView.notificarExito(
                `Descuento "${descuento.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`
            );
        } catch (error) {
            console.error(error);
            Swal.close();
            descuentoView.notificarError('Error al cambiar el estado del descuento.');
        }
    },

    // ─────────────────────────────────────────────
    // ELIMINAR
    // ─────────────────────────────────────────────
    async confirmarEliminacion(id) {
        const descuento = this._datosCache.find(d => d.id == id);
        if (!descuento) return;

        const { isConfirmed: primera } = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">¿Eliminar descuento?</span>',
            html: `<div class="text-center"><p class="text-slate-500 text-sm">
                       Se eliminará el descuento: <br>
                       <span class="text-slate-800 font-bold">"${descuento.nombre}"</span><br>
                       <span class="text-[11px] text-slate-400 mt-1 block">
                           También se eliminarán sus asignaciones a productos y categorías.
                       </span>
                   </p></div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });

        if (!primera) return;

        // Segunda confirmación
        const { isConfirmed: segunda } = await Swal.fire({
            title: '<span class="text-red-600 font-black uppercase text-sm">¿Confirmar eliminación?</span>',
            html: `<div class="text-center"><p class="text-slate-500 text-sm">
                       Esta acción es <span class="text-red-600 font-bold">irreversible</span>.<br>
                       El descuento se eliminará permanentemente.
                   </p></div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar definitivamente',
            cancelButtonText: 'No, cancelar',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });

        if (!segunda) return;

        try {
            descuentoView.mostrarCargando('Eliminando...');
            await descuentoModel.delete(id);
            await this.inicializar(true);
            descuentoView.notificarExito(`Descuento "${descuento.nombre}" eliminado correctamente.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            descuentoView.notificarError('Error al eliminar el descuento.');
        }
    }
};

window.descuentoController = descuentoController;