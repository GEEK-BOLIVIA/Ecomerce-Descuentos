import { pedidoModel } from '../models/pedidoModel.js';
import { pedidoView }  from '../views/pedidoView.js';

export const pedidoController = {

    _datosCache: [],
    _filtroEstado: '',

    // ─────────────────────────────────────────────
    // INICIALIZAR
    // ─────────────────────────────────────────────

    async inicializar(silencioso = false) {
        try {
            if (!silencioso) pedidoView.mostrarCargando('Cargando órdenes...');
            this._datosCache = await pedidoModel.listar(
                this._filtroEstado ? { estado: this._filtroEstado } : {}
            );
            pedidoView.render(this._datosCache, this._filtroEstado);
            if (!silencioso) Swal.close();
        } catch (err) {
            console.error('pedidoController.inicializar:', err);
            pedidoView.notificarError('Error al cargar los pedidos.');
        }
    },

    async cambiarFiltroEstado(estado) {
        this._filtroEstado = estado;
        await this.inicializar(true);
    },

    // ─────────────────────────────────────────────
    // VER DETALLE
    // ─────────────────────────────────────────────

    async verDetalle(id) {
        pedidoView.mostrarCargando('Cargando detalle...');
        const pedido = await pedidoModel.getById(id);
        Swal.close();
        if (!pedido) return pedidoView.notificarError('No se pudo cargar el pedido.');
        pedidoView.mostrarDetalle(pedido);
    },

    // ─────────────────────────────────────────────
    // CONFIRMAR RECEPCIÓN DE FONDOS
    // ─────────────────────────────────────────────

    async confirmarFondos(id) {
        pedidoView.mostrarCargando('Cargando pedido...');
        const pedido = await pedidoModel.getById(id);
        Swal.close();
        if (!pedido) return pedidoView.notificarError('No se pudo cargar el pedido.');

        const pago = pedido.pago?.[0];
        if (!pago) return pedidoView.notificarError('Este pedido no tiene pago registrado.');
        if (pago.estado === 'completado') return pedidoView.notificarInfo('El pago ya fue confirmado anteriormente.');

        pedidoView.mostrarCargando('Confirmando fondos y actualizando stock...');
        try {
            // 1. Marcar pago como completado
            const resPago = await pedidoModel.actualizarPago(pago.id, { estado: 'completado' });
            if (!resPago.exito) throw new Error(resPago.mensaje);

            // 2. Reducir stock (incluye desglose de combos)
            const resStock = await pedidoModel.reducirStockPorItems(
                pedido.id_sucursal,
                pedido.pedido_item ?? []
            );
            if (!resStock.exito) throw new Error(resStock.mensaje);

            // 3. Avanzar estado del pedido a confirmado
            const resPedido = await pedidoModel.actualizarEstado(pedido.id, 'confirmado');
            if (!resPedido.exito) throw new Error(resPedido.mensaje);

            await this.inicializar(true);
            pedidoView.notificarExito('Fondos confirmados. Stock actualizado y pedido confirmado.');
        } catch (err) {
            Swal.close();
            pedidoView.notificarError(err.message || 'Error al confirmar los fondos.');
        }
    },

    // ─────────────────────────────────────────────
    // CONTROL MAESTRO DE ESTADOS (Dropdown)
    // ─────────────────────────────────────────────

    async cambiarEstadoManual(id, nuevoEstado) {
        if (!nuevoEstado) return;

        pedidoView.mostrarCargando('Cargando pedido...');
        const pedido = await pedidoModel.getById(id);
        Swal.close();
        if (!pedido) return pedidoView.notificarError('No se pudo cargar el pedido.');

        const pago = pedido.pago?.[0];
        const pagoCompletado = pago?.estado === 'completado';

        // Bloquear avance logístico sin pago confirmado
        const estadosLogisticos = ['en_preparacion', 'listo', 'en_camino', 'entregado'];
        if (estadosLogisticos.includes(nuevoEstado) && !pagoCompletado) {
            return pedidoView.notificarError('Confirma primero la recepción de fondos antes de avanzar el estado logístico.');
        }

        // Confirmación con SweetAlert2
        const esCancelacion = nuevoEstado === 'cancelado';
        const confirmado = await pedidoView.confirmarAccion(
            esCancelacion ? '¿Cancelar este pedido?' : `¿Mover a "${nuevoEstado}"?`,
            esCancelacion && pagoCompletado
                ? 'El stock será repuesto automáticamente.'
                : 'El estado del pedido será actualizado.',
            esCancelacion ? 'warning' : 'question',
            esCancelacion ? 'SÍ, CANCELAR' : 'SÍ, CAMBIAR'
        );
        if (!confirmado) return;

        pedidoView.mostrarCargando('Actualizando estado...');
        try {
            // Reponer stock si se cancela un pedido ya pagado
            if (esCancelacion && pagoCompletado && pedido.estado !== 'cancelado') {
                const resStock = await pedidoModel.reponerStockPorItems(
                    pedido.id_sucursal,
                    pedido.pedido_item ?? []
                );
                if (!resStock.exito) throw new Error(resStock.mensaje);
            }

            const res = await pedidoModel.actualizarEstado(id, nuevoEstado);
            if (!res.exito) throw new Error(res.mensaje);

            await this.inicializar(true);
            pedidoView.notificarExito(`Estado actualizado a "${nuevoEstado}".`);
        } catch (err) {
            Swal.close();
            pedidoView.notificarError(err.message || 'Error al cambiar el estado.');
        }
    },
    // alias para compatibilidad con la vista
    abrirValidacionPago(id) { return this.confirmarFondos(id); },
};

window.pedidoController = pedidoController;
