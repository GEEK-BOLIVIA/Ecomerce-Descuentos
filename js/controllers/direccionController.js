import { direccionModel } from '../models/direccionModel.js';
import { direccionView } from '../views/direccionView.js';
import { direccionFormView } from '../views/direccionFormView.js';

export const direccionController = {
    _datosCache: [],

    async inicializar(silencioso = false) {
        try {
            if (!silencioso) direccionView.mostrarCargando('Cargando direcciones...');
            const data = await direccionModel.getAll();
            this._datosCache = data;
            direccionView.render(this._datosCache);
            if (!silencioso) Swal.close();
        } catch (error) {
            console.error('Error:', error);
            direccionView.notificarError('Error al conectar con la base de datos');
        }
    },

    // ─────────────────────────────────────────────
    // CREAR
    // ─────────────────────────────────────────────
    async mostrarFormularioCrear() {
        try {
            direccionView.mostrarCargando('Cargando formulario...');
            const [clientes, departamentos] = await Promise.all([
                direccionModel.getClientes(),
                direccionModel.getDepartamentos()
            ]);
            await new Promise(r => setTimeout(r, 500));
            Swal.close();

            await direccionFormView.abrir({
                esEdicion: false,
                clientes,
                departamentos,
                onGuardar: async (datos) => {
                    try {
                        direccionView.mostrarCargando('Guardando...');
                        await direccionModel.create(datos);
                        await this.inicializar(true);
                        direccionView.notificarExito('Dirección registrada correctamente.');
                    } catch (error) {
                        direccionView.notificarError('No se pudo guardar la dirección.');
                    }
                },
                onCancelar: () => this.inicializar(true)
            });
        } catch (error) {
            direccionView.notificarError('Error al cargar los datos del formulario.');
        }
    },

    // ─────────────────────────────────────────────
    // EDITAR
    // ─────────────────────────────────────────────
    async editar(id) {
        try {
            const direccion = this._datosCache.find(d => d.id == id);
            if (!direccion) return;

            direccionView.mostrarCargando('Cargando editor...');
            const [clientes, departamentos] = await Promise.all([
                direccionModel.getClientes(),
                direccionModel.getDepartamentos()
            ]);
            await new Promise(r => setTimeout(r, 500));
            Swal.close();

            await direccionFormView.abrir({
                datos: direccion,
                esEdicion: true,
                clientes,
                departamentos,
                onGuardar: async (datos) => {
                    try {
                        direccionView.mostrarCargando('Actualizando...');
                        await direccionModel.update(id, datos);
                        await this.inicializar(true);
                        direccionView.notificarExito('Cambios aplicados con éxito.');
                    } catch (error) {
                        direccionView.notificarError('Error al intentar actualizar.');
                    }
                },
                onCancelar: () => this.inicializar(true)
            });
        } catch (error) {
            direccionView.notificarError('Error al cargar los datos del formulario.');
        }
    },

    // ─────────────────────────────────────────────
    // VER DETALLE
    // ─────────────────────────────────────────────
    async verDetalle(id) {
        const direccion = this._datosCache.find(d => d.id == id);
        if (!direccion) return;

        direccionView.mostrarCargando('Cargando detalle...');
        await new Promise(r => setTimeout(r, 500));
        Swal.close();

        const resultado = await direccionView.mostrarDetalle(direccion);

        if (resultado === true) {
            const confirmacion = await direccionView.confirmarAccion({
                titulo: '¿Modificar Dirección?',
                nombreEntidad: direccion.nombre_lugar || 'Mi Casa',
                mensajePersonalizado: 'Estás por entrar al modo de edición para:',
                botonConfirmar: 'Ir a Editar'
            });
            if (confirmacion.isConfirmed) {
                this.editar(id);
            } else {
                this.inicializar(true);
            }

        } else if (resultado === 'eliminar') {
            direccionView.mostrarCargando('Cargando confirmación...');
            await new Promise(r => setTimeout(r, 500));
            Swal.close();
            this.confirmarEliminacion(id);

        } else {
            // DESPUÉS — cierra antes de inicializar
            direccionView.mostrarCargando('Volviendo...');
            await new Promise(r => setTimeout(r, 400));
            Swal.close();
            this.inicializar(true);
        }
    },

    // ─────────────────────────────────────────────
    // VER MINI MAPA (botón pin en tabla)
    // ─────────────────────────────────────────────
    async verMapa(id) {
        const direccion = this._datosCache.find(d => d.id == id);
        if (!direccion) return;
        await direccionView.mostrarMiniMapa(direccion);
    },

    // ─────────────────────────────────────────────
    // ELIMINAR
    // ─────────────────────────────────────────────
    async confirmarEliminacion(id) {
        const direccion = this._datosCache.find(d => d.id == id);
        if (!direccion) return;

        const confirmo = await direccionView.mostrarConfirmacionEliminar(direccion);

        if (!confirmo) {
            this.inicializar(true);
            return;
        }

        // Segunda confirmación antes de ejecutar
        const { isConfirmed } = await Swal.fire({
            title: '<span class="text-red-600 font-black uppercase text-sm">¿Confirmar eliminación?</span>',
            html: `<div class="text-center">
                   <p class="text-slate-500 text-sm">Esta acción es <span class="text-red-600 font-bold">irreversible</span>.<br>
                   Se eliminará permanentemente la dirección<br>
                   <span class="text-slate-800 font-bold">"${direccion.nombre_lugar || 'Mi Casa'}"</span></p>
               </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'No, cancelar',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        });

        if (!isConfirmed) {
            this.inicializar(true);
            return;
        }

        try {
            direccionView.mostrarCargando('Eliminando...');
            await direccionModel.delete(id);
            await this.inicializar(true);
            direccionView.notificarExito('La dirección ha sido eliminada correctamente.');
        } catch (error) {
            console.error(error);
            Swal.close();
            direccionView.notificarError('Error al intentar eliminar la dirección.');
        }
    },
    refrescarVista() {
        direccionView.render(this._datosCache);
    }
};

window.direccionController = direccionController;