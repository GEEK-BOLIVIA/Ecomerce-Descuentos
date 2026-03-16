import { comboModel } from '../models/comboModel.js';
import { comboView } from '../views/comboView.js';
import { comboFormView } from '../views/comboFormView.js';

export const comboController = {

    _datosCache: [],

    // ─────────────────────────────────────────────
    // INICIALIZAR
    // ─────────────────────────────────────────────
    async inicializar(silencioso = false) {
        if (!silencioso) comboView.mostrarCargando('Cargando combos...');
        try {
            this._datosCache = await comboModel.getAll();
            Swal.close();
            comboView.mostrarTabla(this._datosCache);
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al cargar los combos.');
        }
    },

    // ─────────────────────────────────────────────
    // CREAR
    // ─────────────────────────────────────────────
    async mostrarFormularioCrear() {
        comboView.mostrarCargando('Cargando...');
        try {
            const [sucursales, categorias] = await Promise.all([
                comboModel.getSucursales(),
                comboModel.getCategorias()
            ]);
            Swal.close();
            await comboFormView.abrir({
                sucursales, categorias,
                model: comboModel,
                onGuardar: (payload) => this._crear(payload),
                onCancelar: () => this.inicializar(true)
            });
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al abrir el formulario.');
        }
    },

    async _crear({ combo, imagenArchivo, productos }) {
        comboView.mostrarCargando('Guardando combo...');
        try {
            // Resolver imagen
            if (imagenArchivo?.tipo === 'local' && imagenArchivo.data) {
                combo.imagen_url = await comboModel.uploadImagen(imagenArchivo.data);
            } else if (imagenArchivo?.tipo === 'url' && imagenArchivo.url) {
                combo.imagen_url = imagenArchivo.url;
            }
            const nuevo = await comboModel.create(combo);
            await comboModel.sincronizarProductos(nuevo.id, productos);
            await this.inicializar(true);
            comboView.notificarExito(`Combo "${nuevo.nombre}" creado correctamente.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al crear el combo.');
        }
    },

    // ─────────────────────────────────────────────
    // EDITAR
    // ─────────────────────────────────────────────
    async editar(id) {
        comboView.mostrarCargando('Cargando datos...');
        try {
            const [combo, sucursales, categorias, productosIniciales] = await Promise.all([
                comboModel.getById(id),
                comboModel.getSucursales(),
                comboModel.getCategorias(),
                comboModel.getProductosDelCombo(id)
            ]);
            Swal.close();
            await comboFormView.abrir({
                datos: combo,
                esEdicion: true,
                sucursales, categorias,
                model: comboModel,
                productosIniciales,
                onGuardar: (payload) => this._actualizar(id, payload),
                onCancelar: () => this.inicializar(true)
            });
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al cargar el combo.');
        }
    },

    async _actualizar(id, { combo, imagenArchivo, productos }) {
        comboView.mostrarCargando('Guardando cambios...');
        try {
            // Resolver imagen
            if (imagenArchivo?.tipo === 'local' && imagenArchivo.data) {
                combo.imagen_url = await comboModel.uploadImagen(imagenArchivo.data);
            } else if (imagenArchivo?.tipo === 'url' && imagenArchivo.url) {
                combo.imagen_url = imagenArchivo.url;
            } else if (!imagenArchivo?.url) {
                combo.imagen_url = null; // imagen quitada
            }
            const actualizado = await comboModel.update(id, combo);
            await comboModel.sincronizarProductos(id, productos);
            await this.inicializar(true);
            comboView.notificarExito(`Combo "${actualizado.nombre}" actualizado correctamente.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al actualizar el combo.');
        }
    },

    // ─────────────────────────────────────────────
    // TOGGLE ACTIVO (desde tabla)
    // ─────────────────────────────────────────────
    async toggleActivo(id, nuevoEstado) {
        const combo = this._datosCache.find(c => c.id == id);
        if (!combo) return;
        const accion = nuevoEstado ? 'activar' : 'desactivar';
        const { isConfirmed } = await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">¿${nuevoEstado ? 'Activar' : 'Desactivar'} combo?</span>`,
            html: `<p class="text-slate-500 text-sm text-center">Se va a <span class="font-bold text-slate-700">${accion}</span> el combo:<br>
                    <span class="text-slate-800 font-bold">"${combo.nombre}"</span></p>`,
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
            comboView.mostrarCargando(nuevoEstado ? 'Activando...' : 'Desactivando...');
            await comboModel.toggleActivo(id, nuevoEstado);
            await this.inicializar(true);
            comboView.notificarExito(`Combo "${combo.nombre}" ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al cambiar el estado del combo.');
        }
    },

    // ─────────────────────────────────────────────
    // VER DETALLE
    // ─────────────────────────────────────────────
    async ver(id) {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        comboView.mostrarCargando('Cargando detalle...');
        try {
            const [c, productos] = await Promise.all([
                comboModel.getById(id),
                comboModel.getProductosDelCombo(id)
            ]);
            Swal.close();
            if (!c) return;

            comboView.renderDetalle(contenedor, c, productos);

            document.getElementById('dv-btn-volver')?.addEventListener('click', () => this.inicializar(true));
            document.getElementById('dv-btn-editar')?.addEventListener('click', () => this._confirmarEditar(id));
            document.getElementById('dv-btn-toggle')?.addEventListener('click', () => this._toggleActivoDesdeDetalle(id, !c.activo, productos));
            document.getElementById('dv-btn-fecha')?.addEventListener('click', () => comboView.abrirModalFecha(id, c.fecha_inicio || '', c.fecha_fin || ''));

        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al cargar el detalle del combo.');
        }
    },

    // ─────────────────────────────────────────────
    // ACCIONES DESDE DETALLE
    // ─────────────────────────────────────────────
    async _confirmarEditar(id) {
        const { isConfirmed } = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">¿Editar combo?</span>',
            html: '<p class="text-slate-500 text-sm text-center">Se abrirá el formulario de edición.</p>',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, editar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });
        if (isConfirmed) this.editar(id);
    },

    async _toggleActivoDesdeDetalle(id, nuevoEstado) {
        const accion = nuevoEstado ? 'activar' : 'desactivar';
        const { isConfirmed } = await Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">¿${nuevoEstado ? 'Activar' : 'Desactivar'} combo?</span>`,
            html: `<p class="text-slate-500 text-sm text-center">Se va a <span class="font-bold text-slate-700">${accion}</span> este combo.</p>`,
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
            comboView.mostrarCargando(nuevoEstado ? 'Activando...' : 'Desactivando...');
            await comboModel.toggleActivo(id, nuevoEstado);
            this._datosCache = await comboModel.getAll();
            Swal.close();
            await this.ver(id);
            comboView.notificarExito(`Combo ${nuevoEstado ? 'activado' : 'desactivado'} correctamente.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al cambiar el estado.');
        }
    },

    // ─────────────────────────────────────────────
    // VER ELIMINAR
    // ─────────────────────────────────────────────
    async verEliminar(id, origen = 'tabla') {
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        comboView.mostrarCargando('Cargando...');
        try {
            const [c, productos] = await Promise.all([
                comboModel.getById(id),
                comboModel.getProductosDelCombo(id)
            ]);
            Swal.close();
            if (!c) return;

            comboView.renderEliminar(contenedor, c, productos);

            const volverFn = origen === 'detalle' ? () => this.ver(id) : () => this.inicializar(true);
            document.getElementById('del-btn-volver')?.addEventListener('click', volverFn);
            document.getElementById('del-btn-eliminar')?.addEventListener('click', () => this._ejecutarEliminacion(id, c.nombre));

        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al cargar el combo.');
        }
    },

    async _ejecutarEliminacion(id, nombre) {
        const { isConfirmed } = await Swal.fire({
            title: '<span class="text-red-600 font-black uppercase text-sm">¿Confirmar eliminación?</span>',
            html: `<p class="text-slate-500 text-sm text-center">
                        Esta acción es <span class="text-red-600 font-bold">irreversible</span>.<br>
                        El combo <span class="font-bold text-slate-700">"${nombre}"</span> se eliminará permanentemente.
                    </p>`,
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
        if (!isConfirmed) return;
        try {
            comboView.mostrarCargando('Eliminando...');
            await comboModel.delete(id);
            await this.inicializar(true);
            comboView.notificarExito(`Combo "${nombre}" eliminado correctamente.`);
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al eliminar el combo.');
        }
    },

    // ─────────────────────────────────────────────
    // ACTUALIZAR FECHAS RÁPIDO
    // ─────────────────────────────────────────────
    async actualizarFechas(id, fecha_inicio, fecha_fin) {
        try {
            comboView.mostrarCargando('Guardando fechas...');
            await comboModel.updateFechas(id, fecha_inicio, fecha_fin);
            await this.inicializar(true);
            comboView.notificarExito('Fechas actualizadas correctamente.');
        } catch (error) {
            console.error(error);
            Swal.close();
            comboView.notificarError('Error al actualizar las fechas.');
        }
    }
};

window.comboController = comboController;