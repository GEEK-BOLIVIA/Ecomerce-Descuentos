import { importacionView } from '../views/importacionView.js';
import { importacionModel } from '../models/importacionModel.js';
import { productoModel } from '../models/productoModel.js';
import { categoriasModel } from '../models/categoriasModel.js';
import { productoCategoriaModel } from '../models/productoCategoriaModel.js';
import { galeriaProductoModel } from '../models/galeriaProductoModel.js';
import { sucursalModel } from '../models/sucursalModel.js';
import { sucursalProductoModel } from '../models/sucursalProductoModel.js';
import { aplicarEstiloCabecera, aplicarEstiloCabeceraSucursal } from '../utils/excelHelper.js';

export const importacionController = {
    datosValidados: [],
    sucursales: [],

    async inicializar() {
        const contentArea = document.getElementById('content-area');
        if (!contentArea) return;

        this.sucursales = await sucursalModel.getAll();

        contentArea.innerHTML = importacionView.render(this.sucursales);

        importacionView.initEventListeners(
            (file) => this.validarArchivo(file),
            () => this.iniciarCargaFinal(),
            () => this.descargarPlantilla()
        );
    },

    descargarPlantilla() {
        // Columnas fijas del producto
        const colsTecnicas = ["nombre", "descripcion", "categoria", "subcategoria", "imagen_url", "habilitar_whatsapp"];
        const colsAmigables = ["Nombre del Producto", "Descripción", "Categoría", "Subcategoría (opcional)", "URL Imagen", "¿WhatsApp? (SI/NO)"];

        // Columnas dinámicas por sucursal: precio_NombreSucursal, stock_NombreSucursal
        const colsSucTecnicas = [];
        const colsSucAmigables = [];
        this.sucursales.forEach(s => {
            colsSucTecnicas.push(`precio_${s.nombre}`, `stock_${s.nombre}`);
            colsSucAmigables.push(`Precio - ${s.nombre}`, `Stock - ${s.nombre}`);
        });

        const encabezadosTecnicos = [...colsTecnicas, ...colsSucTecnicas];
        const encabezadosAmigables = [...colsAmigables, ...colsSucAmigables];

        // Fila de ejemplo
        const ejemploSucursales = [];
        this.sucursales.forEach(() => { ejemploSucursales.push(100, 10); });

        const ejemplos = [
            ["Laptop Pro", "Potente laptop para diseño", "Computación", "Laptops", "", "SI", ...ejemploSucursales],
            ["Auriculares BT", "Inalámbricos con cancelación de ruido", "Electrónica", "", "", "NO", ...ejemploSucursales]
        ];

        // Nota explicativa en fila 4
        const nota = [
            "NOTA: Si el producto pertenece a una categoría sin subcategorías, llena solo 'Categoría' y deja 'Subcategoría' vacía.",
            "", "", "", "", "", ...this.sucursales.flatMap(() => ["", ""])
        ];

        const ws = XLSX.utils.aoa_to_sheet([
            encabezadosTecnicos,
            encabezadosAmigables,
            ...ejemplos,
            nota
        ]);

        ws['!rows'] = [{ hidden: true }];
        ws['!cols'] = encabezadosTecnicos.map((_, i) => ({ wch: i >= colsTecnicas.length ? 18 : 22 }));

        const range = XLSX.utils.decode_range(ws['!ref']);
        aplicarEstiloCabecera(ws, range);

        // Resaltar columnas de sucursales en azul
        const indicesSucursales = colsSucTecnicas.map((_, i) => colsTecnicas.length + i);
        aplicarEstiloCabeceraSucursal(ws, indicesSucursales);

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Plantilla_Productos");
        XLSX.writeFile(wb, "Plantilla_Importacion_Productos.xlsx");
    },

    async validarArchivo(file) {
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data, { type: 'array' });
            const hoja = workbook.Sheets[workbook.SheetNames[0]];

            // Construir header dinámico igual que la plantilla
            const colsFijas = ["nombre", "descripcion", "categoria", "subcategoria", "imagen_url", "habilitar_whatsapp"];
            const colsSucursales = [];
            this.sucursales.forEach(s => {
                colsSucursales.push(`precio_${s.nombre}`, `stock_${s.nombre}`);
            });
            const headerCompleto = [...colsFijas, ...colsSucursales];

            const filas = XLSX.utils.sheet_to_json(hoja, {
                range: 2,
                header: headerCompleto,
                defval: ""
            });

            // Filtrar fila de nota si existe
            const filasFiltradas = filas.filter(f => {
                const nombre = f.nombre?.toString().trim();
                return nombre && !nombre.startsWith('NOTA:');
            });

            const nombresExistentes = await importacionModel.obtenerNombresExistentes();
            const categoriasDB = await categoriasModel.obtenerTodas();

            const reporte = { validos: [], errores: [], totalFilas: filasFiltradas.length };

            filasFiltradas.forEach((fila, index) => {
                const nombre = fila.nombre?.toString().trim() || "";
                const catNom = fila.categoria?.toString().trim() || "";
                const subcatNom = fila.subcategoria?.toString().trim() || "";
                const precio = parseFloat(fila.precio_base?.toString().replace(',', '.')) || 0;
                let fallos = [];

                if (!nombre) { fallos.push("Falta el nombre del producto"); }
                else if (nombresExistentes.has(nombre.toLowerCase())) { fallos.push("Producto ya existe en la base de datos"); }

                if (!catNom) {
                    fallos.push("Debe especificar al menos una Categoría");
                } else {
                    // Determinar qué categoría se usará como vínculo
                    const nombreVinculo = subcatNom || catNom;
                    const categoriaVinculo = categoriasDB.find(c => c.nombre.toLowerCase() === nombreVinculo.toLowerCase());

                    if (!categoriaVinculo) {
                        // Es nueva: si tiene subcategoría, la categoría padre debe existir o se creará
                        // Si no tiene subcategoría, se creará la categoría directamente
                        if (subcatNom) {
                            const padreExiste = categoriasDB.find(c => c.nombre.toLowerCase() === catNom.toLowerCase());
                            if (!padreExiste) {
                                fallos.push(`La categoría padre '${catNom}' no existe. Se creará automáticamente.`);
                                // No es error bloqueante, solo informativo — no se agrega a fallos como error
                                fallos.pop();
                            }
                        }
                        // Categoría nueva sin subcategoría: se creará sola — OK
                    }
                }

                // Validar que al menos una sucursal tenga precio > 0
                const sucursalesProducto = this.sucursales.map(s => ({
                    id_sucursal: s.id,
                    nombre: s.nombre,
                    precio: parseFloat(fila[`precio_${s.nombre}`]?.toString().replace(',', '.')) || 0,
                    stock: parseInt(fila[`stock_${s.nombre}`]) || 0
                })).filter(s => s.precio > 0 || s.stock > 0);

                if (sucursalesProducto.length === 0) {
                    fallos.push("Debe asignar precio/stock en al menos una sucursal");
                }

                if (fallos.length > 0) {
                    reporte.errores.push({ fila: index + 3, nombre: nombre || "Sin nombre", detalles: fallos });
                } else {
                    reporte.validos.push({
                        nombre,
                        descripcion: fila.descripcion || "",
                        categoria: catNom,
                        subcategoria: subcatNom || null,
                        portada: fila.imagen_url || 'https://via.placeholder.com/600x400?text=Sin+Portada',
                        whatsapp: fila.habilitar_whatsapp?.toString().toUpperCase() === 'SI',
                        sucursales: sucursalesProducto
                    });
                }
            });

            this.datosValidados = reporte.validos;
            return reporte;

        } catch (error) {
            console.error("Error crítico en validarArchivo:", error);
            throw new Error("El archivo Excel tiene un formato incompatible o está dañado.");
        }
    },

    async iniciarCargaFinal() {
        if (this.datosValidados.length === 0) {
            return Swal.fire('Atención', 'No hay datos válidos para cargar', 'warning');
        }
        try {
            importacionView.mostrarProgreso(0);
            const resultado = await this.procesarCarga(this.datosValidados, (p) => importacionView.mostrarProgreso(p));
            importacionView.notificarExitoFinal(resultado.exitos);
            this.datosValidados = [];
        } catch (error) {
            console.error(error);
            Swal.fire('Error crítico', 'Hubo un problema durante la carga: ' + error.message, 'error');
        }
    },

    async procesarCarga(datosValidados, onProgress) {
        let exitos = 0;
        const total = datosValidados.length;

        for (let i = 0; i < total; i++) {
            try {
                const prod = datosValidados[i];

                // 1. Resolver categoría: si tiene subcategoría, vincular a la subcategoría; si no, a la categoría directa
                const idCategoria = await this._resolverCategoria(prod.categoria, prod.subcategoria);

                // 2. Crear producto base (sin precio/stock, van en sucursal_producto)
                const res = await productoModel.crear({
                    nombre: prod.nombre,
                    descripcion: prod.descripcion || '',
                    portada: prod.portada,
                    price_visible: true,
                    ws_active: prod.whatsapp
                });

                if (res.exito) {
                    const nuevoId = res.data.id;

                    // 3. Vincular categoría y asignar sucursales en paralelo
                    const promesas = [productoCategoriaModel.vincular(nuevoId, idCategoria)];

                    prod.sucursales.forEach(s => {
                        promesas.push(sucursalProductoModel.asignarProducto({
                            idSucursal: s.id_sucursal,
                            idProducto: nuevoId,
                            precio: s.precio,
                            stock: s.stock
                        }));
                    });

                    await Promise.all(promesas);
                    exitos++;
                }

                if (onProgress) onProgress(Math.round(((i + 1) / total) * 100));
            } catch (e) {
                console.error(`Error procesando fila ${i + 1}:`, e);
            }
        }
        return { exitos, totalProcesado: total };
    },

    /**
     * Resuelve el ID de categoría a vincular.
     * - Si hay subcategoría: busca/crea la subcategoría bajo la categoría padre
     * - Si no hay subcategoría: busca/crea la categoría directamente (sin padre)
     */
    async _resolverCategoria(nombreCategoria, nombreSubcategoria) {
        const categoriasActuales = await categoriasModel.obtenerTodas();

        if (nombreSubcategoria) {
            // Buscar subcategoría existente
            const subExistente = categoriasActuales.find(c =>
                c.nombre.toLowerCase() === nombreSubcategoria.toLowerCase() && c.id_padre !== null
            );
            if (subExistente) return subExistente.id;

            // Resolver/crear categoría padre primero
            let idPadre = null;
            const padreExistente = categoriasActuales.find(c =>
                c.nombre.toLowerCase() === nombreCategoria.toLowerCase() && c.id_padre === null
            );
            if (padreExistente) {
                idPadre = padreExistente.id;
            } else {
                const resPadre = await categoriasModel.crear({ nombre: nombreCategoria.trim(), id_padre: null, visible: true });
                if (resPadre.exito) idPadre = resPadre.data.id;
            }

            // Crear subcategoría bajo el padre
            const resSub = await categoriasModel.crear({ nombre: nombreSubcategoria.trim(), id_padre: idPadre, visible: true });
            return resSub.exito ? resSub.data.id : idPadre;

        } else {
            // Sin subcategoría: vincular directamente a la categoría
            const catExistente = categoriasActuales.find(c =>
                c.nombre.toLowerCase() === nombreCategoria.toLowerCase()
            );
            if (catExistente) return catExistente.id;

            const resCat = await categoriasModel.crear({ nombre: nombreCategoria.trim(), id_padre: null, visible: true });
            return resCat.exito ? resCat.data.id : null;
        }
    }
};
