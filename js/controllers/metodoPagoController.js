import { metodoPagoModel } from '../models/metodoPagoModel.js';
import { metodoPagoView } from '../views/metodoPagoView.js';
import { configuracionColumnasController } from './configuracionColumnasController.js';
import { usuarioModel } from '../models/usuarioModel.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const metodoPagoController = {

    _datosCache: [],
    _columnasVisibles: [],

    // ─────────────────────────────────────────────
    // INICIALIZAR
    // ─────────────────────────────────────────────

    async inicializar(silencioso = false) {
        try {
            if (!silencioso) selectorUtil.limpiar();
            if (!silencioso) metodoPagoView.mostrarCargando('Cargando métodos de pago...');

            const usuario = await usuarioModel.obtenerUsuarioActual();

            this._columnasVisibles = await configuracionColumnasController.obtenerColumnasVisibles(
                'metodos_pago',
                ['nro', 'nombre', 'slug', 'requiere_referencia', 'activo', 'acciones'],
                usuario?.id,
                usuario?.rol
            );

            this._datosCache = await metodoPagoModel.listar();
            metodoPagoView.render(this._datosCache, this._columnasVisibles);

            if (!silencioso) Swal.close();
        } catch (error) {
            console.error('Error en metodoPagoController.inicializar:', error);
            metodoPagoView.notificarError('Error al cargar los métodos de pago.');
        }
    },

    refrescarVista() {
        metodoPagoView.render(this._datosCache, this._columnasVisibles);
    },

    // ─────────────────────────────────────────────
    // VER DETALLE
    // ─────────────────────────────────────────────

    verDetalle(id) {
        const metodo = this._datosCache.find(m => m.id == id);
        if (!metodo) return;
        metodoPagoView.mostrarDetalle(metodo);
    },

    // ─────────────────────────────────────────────
    // EDITAR (solo nombre y descripción)
    // ─────────────────────────────────────────────

    async editar(id) {
        const metodo = this._datosCache.find(m => m.id == id);
        if (!metodo) return;

        const datosEditados = await metodoPagoView.mostrarFormularioEditar(metodo);
        if (!datosEditados) return;

        try {
            metodoPagoView.mostrarCargando('Actualizando...');
            const resultado = await metodoPagoModel.actualizar(id, {
                nombre:      datosEditados.nombre,
                descripcion: datosEditados.descripcion,
            });

            if (resultado.exito) {
                await this.inicializar(true);
                metodoPagoView.notificarExito('Cambios aplicados correctamente.');
            } else {
                Swal.close();
                metodoPagoView.notificarError(resultado.mensaje);
            }
        } catch (error) {
            console.error(error);
            metodoPagoView.notificarError('Error al intentar actualizar.');
        }
    },

    // ─────────────────────────────────────────────
    // TOGGLE ACTIVO MASIVO
    // ─────────────────────────────────────────────

    async toggleActivoMasivo(ids, nuevoEstado) {
        metodoPagoView.mostrarCargando(nuevoEstado ? 'Activando métodos...' : 'Desactivando métodos...');
        try {
            await metodoPagoModel.actualizarVarios(ids, { activo: nuevoEstado });
            metodoPagoView.limpiarSeleccion();
            await this.inicializar(true);
            metodoPagoView.notificarExito(`${ids.length} métodos ${nuevoEstado ? 'activados' : 'desactivados'} correctamente.`);
        } catch (error) {
            console.error(error);
            metodoPagoView.notificarError('Error al cambiar el estado de algunos métodos.');
        }
    },
};

window.metodoPagoController = metodoPagoController;
