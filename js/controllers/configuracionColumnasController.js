import { configuracionColumnasModel } from '../models/configuracionColumnasModel.js';
import { usuarioModel } from '../models/usuarioModel.js';
import { configuracionColumnasView } from '../views/configuracionColumnasView.js';

export const configuracionColumnasController = {

    // configuracionColumnasController.js - AGREGAR A ESQUEMAS

    ESQUEMAS: {
        productos: ['nro', 'imagen', 'nombre_producto', 'categoria', 'codigo', 'precio', 'stock', 'whatsapp', 'precio_pub', 'acciones'],
        categorias_padre: ['nombre'],
        subcategorias: ['nombre', 'categoria_padre'],
        usuarios_owner: ['nro', 'perfil', 'nombre', 'ci', 'telefono', 'acciones'],
        usuarios_admin: ['nro', 'perfil', 'nombre', 'ci', 'telefono', 'acciones'],
        usuarios_supervisor: ['nro', 'perfil', 'nombre', 'ci', 'telefono', 'sucursal', 'acciones'],
        usuarios_cliente: ['nro', 'perfil', 'nombre', 'ci', 'telefono', 'acciones'],
        sucursales: ['nro', 'sucursal', 'direccion', 'productos', 'acciones'],
        departamentos: ['nro', 'departamento', 'acciones'],
        direcciones: ['nro', 'cliente', 'etiqueta', 'direccion', 'referencia', 'mapa', 'acciones'],
        descuentos: ['nro', 'nombre', 'valor', 'alcance', 'vigencia', 'estado', 'acciones'],
        combos: ['nro', 'nombre', 'precio_descuento', 'alcance', 'vigencia', 'estado', 'acciones'],
        carruseles: ['nro', 'nombre', 'ubicacion', 'tipo', 'acciones'],
        metodos_pago: ['nro', 'nombre', 'slug', 'requiere_referencia', 'activo', 'acciones']
    },
    // --- Agregar esto dentro de configuracionColumnasController ---

    obtenerColumnasVisibles: async function (tablaNombre, columnasPorDefecto, usuarioId = null, rolId = null) {
        try {
            // 1. Intentar obtener la configuración de la DB
            // Nota: configuracionColumnasModel.obtenerConfiguracion ya maneja la jerarquía
            const guardadas = await configuracionColumnasModel.obtenerConfiguracion(tablaNombre, usuarioId, rolId);

            // 2. Si hay datos guardados, los usamos
            if (guardadas && guardadas.length > 0) {
                return guardadas;
            }

            // 3. Si no hay nada guardado, devolvemos lo que el controller nos mandó por defecto
            return columnasPorDefecto;
        } catch (error) {
            console.error(`Error al recuperar columnas para ${tablaNombre}:`, error);
            return columnasPorDefecto;
        }
    },

    iniciarFlujoConfiguracion: async function (tablaNombre, callbackRecargar) {
        const todasLasColumnas = this.ESQUEMAS[tablaNombre];
        if (!todasLasColumnas) {
            console.error(`Error: El esquema '${tablaNombre}' no está definido.`);
            return;
        }
        await this.abrirSelectorColumnas(tablaNombre, todasLasColumnas, callbackRecargar);
    },

    abrirSelectorColumnas: async function (tablaNombre, todasLasColumnas, callbackRecargar) {
        let paso = 1;
        let rolSeleccionado = null;
        let ciSeleccionado = "";
        let usuarioDestino = null;
        let nombreVisualDestino = "";
        let seleccionadas = null;

        try {
            const { roles } = await usuarioModel.obtenerDestinosConfiguracion();

            while (paso > 0 && paso <= 4) {

                // --- PASO 1: SELECCIONAR ROL ---
                if (paso === 1) {
                    rolSeleccionado = await configuracionColumnasView.solicitarSeleccionRol(roles);
                    if (!rolSeleccionado) return;
                    paso = 2;
                    continue; // Salta al siguiente ciclo del while
                }

                // --- PASO 2: SELECCIONAR USUARIO ---
                if (paso === 2) {
                    configuracionColumnasView.mostrarCargando('Buscando personal del grupo...');
                    const todosLosUsuarios = await usuarioModel.obtenerTodos();
                    const usuariosFiltrados = todosLosUsuarios.filter(u => u.rol === rolSeleccionado);
                    Swal.close();

                    ciSeleccionado = await configuracionColumnasView.solicitarBusquedaUsuario(rolSeleccionado, usuariosFiltrados);

                    if (ciSeleccionado === 'BACK') {
                        paso = 1;
                        continue;
                    }
                    if (ciSeleccionado === null) return;

                    usuarioDestino = null;
                    nombreVisualDestino = `GRUPO: ${rolSeleccionado.toUpperCase()}`;

                    if (ciSeleccionado !== "") {
                        usuarioDestino = usuariosFiltrados.find(u => String(u.ci) === String(ciSeleccionado));
                        if (usuarioDestino) {
                            nombreVisualDestino = `${usuarioDestino.apellido_paterno} ${usuarioDestino.nombres} (${usuarioDestino.ci})`;
                        }
                    }
                    paso = 3;
                    continue;
                }

                // --- PASO 3: CONFIGURAR VISIBILIDAD ---
                if (paso === 3) {
                    const uId = usuarioDestino ? usuarioDestino.id : null;
                    const rId = !usuarioDestino ? rolSeleccionado : null;

                    configuracionColumnasView.mostrarCargando('Cargando preferencias...');
                    const actuales = await configuracionColumnasModel.obtenerConfiguracion(tablaNombre, uId, rId);
                    Swal.close();

                    // Determinamos qué columnas marcar (las guardadas o todas por defecto)
                    const columnasAMarcar = actuales && actuales.length > 0 ? actuales : todasLasColumnas;

                    // ÚNICA LLAMADA: Aquí estaba el error (estaba duplicado en tu código)
                    seleccionadas = await configuracionColumnasView.solicitarConfiguracionColumnas(
                        todasLasColumnas,
                        columnasAMarcar,
                        nombreVisualDestino
                    );

                    if (seleccionadas === 'BACK') {
                        paso = 2;
                        continue;
                    }
                    if (!seleccionadas) return;

                    paso = 4;
                    continue;
                }

                // --- PASO 4: PERSISTENCIA ---
                if (paso === 4) {
                    const confirmado = await configuracionColumnasView.confirmarGuardadoFinal(nombreVisualDestino);

                    if (confirmado === 'BACK') {
                        paso = 3;
                        continue;
                    }
                    if (!confirmado) return;

                    configuracionColumnasView.mostrarCargando('Guardando preferencias...');

                    const payload = {
                        tabla_nombre: tablaNombre,
                        columnas_visibles: seleccionadas,
                        usuario_id: usuarioDestino ? usuarioDestino.id : null,
                        rol_id: !usuarioDestino ? rolSeleccionado : null
                    };

                    const res = await configuracionColumnasModel.guardarConfiguracion(payload);

                    if (res.exito) {
                        configuracionColumnasView.notificarExito('Configuración guardada correctamente');
                        if (callbackRecargar) callbackRecargar();
                        break; // Finaliza el flujo
                    } else {
                        configuracionColumnasView.notificarError(res.mensaje);
                        paso = 3;
                        continue;
                    }
                }
            }
        } catch (error) {
            console.error("Error crítico en el flujo:", error);
            configuracionColumnasView.notificarError('Error inesperado al procesar la configuración.');
        }
    }
};