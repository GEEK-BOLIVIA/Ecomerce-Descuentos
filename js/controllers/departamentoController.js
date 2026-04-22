import { departamentoModel } from '../models/departamentoModel.js';
import { departamentoView } from '../views/departamentoView.js';
import { departamentoFormView } from '../views/departamentoFormView.js';
import { configuracionColumnasController } from './configuracionColumnasController.js';
import { usuarioModel } from '../models/usuarioModel.js';

export const departamentoController = {
    _datosCache: [],
    _columnasVisibles: [],

    async inicializar(silencioso = false) {
        try {
            if (!silencioso) departamentoView.mostrarCargando('Cargando departamentos...');

            const usuario = await usuarioModel.obtenerUsuarioActual();

            this._columnasVisibles = await configuracionColumnasController.obtenerColumnasVisibles(
                'departamentos',
                ['nro', 'departamento', 'acciones'],
                usuario?.id,
                usuario?.rol
            );

            const data = await departamentoModel.getAll();
            this._datosCache = data;
            departamentoView.render(this._datosCache, this._columnasVisibles);
            if (!silencioso) Swal.close();
        } catch (error) {
            console.error('Error:', error);
            departamentoView.notificarError('Error al conectar con la base de datos');
        }
    },

    // ─────────────────────────────────────────────
    // CREAR
    // ─────────────────────────────────────────────
    async mostrarFormularioCrear() {
        departamentoView.mostrarCargando('Cargando formulario...');
        await new Promise(r => setTimeout(r, 600));
        Swal.close();

        await departamentoFormView.abrir({
            esEdicion: false,
            onGuardar: async (datos) => {
                try {
                    departamentoView.mostrarCargando('Guardando...');
                    await departamentoModel.create(datos);
                    await this.inicializar(true);
                    departamentoView.notificarExito('El departamento ha sido registrado correctamente.');
                } catch (error) {
                    departamentoView.notificarError('No se pudo guardar el departamento.');
                }
            },
            onCancelar: () => this.inicializar(true)
        });
    },

    async editar(id) {
        const departamento = this._datosCache.find(d => d.id == id);
        if (!departamento) return;

        departamentoView.mostrarCargando('Cargando editor...');
        await new Promise(r => setTimeout(r, 600));
        Swal.close();

        await departamentoFormView.abrir({
            datos: departamento,
            esEdicion: true,
            onGuardar: async (datos) => {
                try {
                    departamentoView.mostrarCargando('Actualizando...');
                    await departamentoModel.update(id, datos);
                    await this.inicializar(true);
                    departamentoView.notificarExito('Cambios aplicados con éxito.');
                } catch (error) {
                    departamentoView.notificarError('Error al intentar actualizar.');
                }
            },
            onCancelar: () => this.inicializar(true)
        });
    },

    // ─────────────────────────────────────────────
    // VER DETALLE — retorna false | true (editar) | 'eliminar'
    // ─────────────────────────────────────────────
    async verDetalle(id) {
        const departamento = this._datosCache.find(d => d.id == id);
        if (!departamento) return;

        const resultado = await departamentoView.mostrarDetalle(departamento);

        if (resultado === true) {
            const confirmacion = await departamentoView.confirmarAccion({
                titulo: '¿Modificar Departamento?',
                nombreEntidad: departamento.nombre,
                mensajePersonalizado: 'Estás por entrar al modo de edición para:',
                botonConfirmar: 'Ir a Editar'
            });
            if (confirmacion.isConfirmed) {
                departamentoView.mostrarCargando('Cargando editor...');
                await new Promise(r => setTimeout(r, 600));
                Swal.close();
                this.editar(id);
            } else {
                this.inicializar(true);
            }

        } else if (resultado === 'eliminar') {
            departamentoView.mostrarCargando('Cargando confirmación...');
            await new Promise(r => setTimeout(r, 600));
            Swal.close();
            this.confirmarEliminacion(id);

        } else {
            departamentoView.mostrarCargando('Volviendo...');
            await new Promise(r => setTimeout(r, 400));
            this.inicializar(true);
        }
    },

    // ─────────────────────────────────────────────
    // ELIMINAR
    // ─────────────────────────────────────────────
    async confirmarEliminacion(id) {
        const departamento = this._datosCache.find(d => d.id == id);
        if (!departamento) return;

        const confirmo = await departamentoView.mostrarConfirmacionEliminar(departamento);

        if (confirmo) {
            try {
                departamentoView.mostrarCargando('Eliminando datos...');
                await departamentoModel.delete(id);
                await this.inicializar(true);
                departamentoView.notificarExito('El departamento ha sido removido exitosamente.');
            } catch (error) {
                console.error(error);
                departamentoView.notificarError('Error al intentar eliminar el departamento.');
            }
        } else {
            this.inicializar(true);
        }
    },

    refrescarVista() {
        departamentoView.render(this._datosCache, this._columnasVisibles);
    },
};

window.departamentoController = departamentoController;