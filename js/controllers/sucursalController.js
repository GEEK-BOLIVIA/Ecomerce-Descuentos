import { sucursalModel } from '../models/sucursalModel.js';
import { sucursalView } from '../views/sucursalView.js';
import { usuarioModel } from '../models/usuarioModel.js';
import { configuracionColumnasController } from './configuracionColumnasController.js';
import { selectorUtil } from '../utils/selectorUtil.js';

export const sucursalController = {
    _columnasVisibles: [],
    _datosCache: [],

    async inicializar(silencioso = false) {
        try {
            if (!silencioso) selectorUtil.limpiar();
            if (!silencioso) sucursalView.mostrarCargando('Cargando sucursales...');

            const usuario = await usuarioModel.obtenerUsuarioActual();

            this._columnasVisibles = await configuracionColumnasController.obtenerColumnasVisibles(
                'sucursales',
                ['nro', 'sucursal', 'direccion', 'productos', 'acciones'],
                usuario?.id,
                usuario?.rol
            );

            const data = await sucursalModel.getAll();
            this._datosCache = data;

            sucursalView.render(this._datosCache, this._columnasVisibles);

            if (!silencioso) Swal.close();
        } catch (error) {
            console.error("Error:", error);
            sucursalView.notificarError('Error al conectar con la base de datos');
        }
    },
    /**
     * Abre el modal de creación. Si no estamos en la vista de sucursales, la carga primero.
     */
    async mostrarFormularioCrear() {
        const datosForm = await sucursalView.mostrarFormulario({
            titulo: 'Registrar Nueva Sucursal',
            esEdicion: false
        });

        if (datosForm) {
            // Pasamos solo DATOS, la vista se encarga del estilo
            const confirmacion = await sucursalView.confirmarAccion({
                titulo: '¿Guardar Sucursal?',
                sucursalNombre: datosForm.nombre,
                mensajePersonalizado: '¿Deseas registrar la nueva sucursal?',
                botonConfirmar: 'Sí, registrar'
            });

            if (confirmacion.isConfirmed) {
                try {
                    sucursalView.mostrarCargando('Guardando...');

                    await sucursalModel.create(datosForm);

                    // IMPORTANTE: Primero refrescamos los datos, luego notificamos éxito
                    await this.inicializar(true); // Refresco silencioso de la tabla

                    // Esto reemplazará automáticamente el modal de "Cargando"
                    sucursalView.notificarExito('La sucursal ha sido registrada correctamente.');

                } catch (error) {
                    sucursalView.notificarError('No se pudo guardar la sucursal.');
                }
            }
        }
    },

    async editar(id) {
        const sucursal = this._datosCache.find(s => s.id == id);
        if (!sucursal) return;

        const datosEditados = await sucursalView.mostrarFormulario({
            titulo: 'Editar Sucursal',
            datos: sucursal,
            esEdicion: true
        });

        if (datosEditados) {
            const confirmacion = await sucursalView.confirmarAccion({
                titulo: '¿Actualizar Datos?',
                sucursalNombre: sucursal.nombre,
                mensajePersonalizado: '¿Deseas aplicar los cambios a:',
                botonConfirmar: 'Sí, actualizar'
            });

            if (confirmacion.isConfirmed) {
                try {
                    sucursalView.mostrarCargando('Actualizando...');

                    // Ejecutamos la actualización
                    await sucursalModel.update(id, datosEditados);

                    // REFRESCAMOS antes del éxito y en modo SILENCIOSO (true)
                    // Esto actualiza la tabla por detrás sin mostrar el modal de carga
                    await this.inicializar(true);

                    // Ahora sí notificamos el éxito. Al ser el último Swal, se quedará visible.
                    sucursalView.notificarExito('Cambios aplicados con éxito.');

                } catch (error) {
                    sucursalView.notificarError('Error al intentar actualizar.');
                }
            }
        }
    },
    async verDetalle(id) {
        const sucursal = this._datosCache.find(s => s.id == id);
        if (!sucursal) return;

        // 1. Abrimos el modal horizontal de detalles
        // Si el usuario presiona el botón "Editar Sucursal", la variable 'editarPresionado' será true
        const editarPresionado = await sucursalView.mostrarDetalle(sucursal);

        if (editarPresionado) {
            // 2. PREGUNTA DE SEGURIDAD (Antes de entrar al formulario)
            const confirmacion = await sucursalView.confirmarAccion({
                titulo: '¿Modificar Sucursal?',
                sucursalNombre: sucursal.nombre,
                mensajePersonalizado: 'Estás por entrar al modo de edición para:',
                botonConfirmar: 'Ir a Editar'
            });

            if (confirmacion.isConfirmed) {
                // 3. Abrimos el formulario de edición (reutilizando la función existente)
                this.editar(id);
            }
        }
    },
    async confirmarEliminacion(id) {
        const sucursal = this._datosCache.find(s => s.id == id);
        if (!sucursal) return;

        // 1. PRIMER PASO: Mostrar ficha de eliminación con stock
        const deseaEliminar = await sucursalView.mostrarConfirmacionEliminar(sucursal);

        if (deseaEliminar) {
            // 2. SEGUNDO PASO: Confirmación técnica de seguridad
            const confirmacionFinal = await sucursalView.confirmarAccion({
                titulo: '¿Eliminar permanentemente?',
                sucursalNombre: sucursal.nombre,
                mensajePersonalizado: '¿Estás seguro? Esta acción borrará la sede y su historial de:',
                botonConfirmar: 'Sí, borrar'
            });

            if (confirmacionFinal.isConfirmed) {
                try {
                    sucursalView.mostrarCargando('Eliminando datos...');

                    await sucursalModel.delete(id);

                    // Refresco silencioso de la tabla
                    await this.inicializar(true);

                    sucursalView.notificarExito('La sucursal ha sido removida exitosamente.');

                } catch (error) {
                    console.error(error);
                    sucursalView.notificarError('Error al intentar eliminar la sucursal.');
                }
            }
        }
    },
    refrescarVista() {
        sucursalView.render(this._datosCache, this._columnasVisibles);
    },

    async eliminarMasivo(ids) {
        sucursalView.mostrarCargando('Eliminando sucursales...');
        try {
            for (const id of ids) {
                await sucursalModel.delete(id);
            }
            sucursalView.limpiarSeleccion();
            await this.inicializar(true);
            sucursalView.notificarExito(`${ids.length} sucursales eliminadas correctamente.`);
        } catch (error) {
            console.error(error);
            sucursalView.notificarError('Error al eliminar algunas sucursales.');
        }
    },
};

// Exponemos al objeto global
window.sucursalController = sucursalController;