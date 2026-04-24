import { dashboardModel } from '../models/dashboardModel.js';
import { dashboardView } from '../views/dashboardView.js';

export const dashboardController = {

    _filtrosActuales: {},
    _tablaActual: null,
    _datosReporte: [],

    // ─── INICIO: VISTA GENERAL ────────────────────────────────────────────────
    async inicializar() {
        try {
            dashboardView.mostrarCargando('Cargando dashboard...');
            const [resumen, stockBajo, roles, descuentos, porCategoria] = await Promise.all([
                dashboardModel.obtenerResumen(),
                dashboardModel.obtenerStockBajo(5),
                dashboardModel.obtenerDistribucionRoles(),
                dashboardModel.reporteDescuentosCombos({ activo: true }),
                dashboardModel.obtenerProductosPorCategoria()
            ]);
            dashboardView.renderGeneral({ resumen, stockBajo, roles, descuentos: descuentos.slice(0, 5), porCategoria });
            Swal.close();
        } catch (err) {
            console.error('dashboardController.inicializar:', err);
            dashboardView.notificarError('No se pudo cargar el dashboard.');
        }
    },

    // ─── ABRIR MÓDULO DE REPORTES ─────────────────────────────────────────────
    async abrirReportes() {
        try {
            dashboardView.mostrarCargando('Cargando módulo...');
            const [sucursales, categorias] = await Promise.all([
                dashboardModel.obtenerSucursales(),
                dashboardModel.obtenerCategoriasPadre()
            ]);
            this._filtrosActuales = {};
            this._tablaActual = null;
            this._datosReporte = [];
            dashboardView.renderReportes({ sucursales, categorias });
            Swal.close();
        } catch (err) {
            console.error('dashboardController.abrirReportes:', err);
            dashboardView.notificarError('Error al cargar reportes.');
        }
    },

    // ─── CAMBIO DE TABLA SELECCIONADA ─────────────────────────────────────────
    cambiarTabla(tabla) {
        this._tablaActual = tabla;
        this._filtrosActuales = {};
        this._datosReporte = [];
        dashboardView.renderFiltros(tabla);
        dashboardView.limpiarResultados();
    },

    // ─── GENERAR REPORTE ──────────────────────────────────────────────────────
    async generarReporte() {
        if (!this._tablaActual) {
            dashboardView.notificarError('Selecciona una tabla primero.');
            return;
        }

        this._filtrosActuales = dashboardView.leerFiltros();
        dashboardView.mostrarCargando('Generando reporte...');

        try {
            let datos = [];
            switch (this._tablaActual) {
                case 'productos_stock':
                    datos = await dashboardModel.reporteProductosStock(this._filtrosActuales); break;
                case 'usuarios':
                    datos = await dashboardModel.reporteUsuarios(this._filtrosActuales); break;
                case 'categorias':
                    datos = await dashboardModel.reporteCategorias(this._filtrosActuales); break;
                case 'descuentos_combos':
                    datos = await dashboardModel.reporteDescuentosCombos(this._filtrosActuales); break;
                case 'sucursales':
                    datos = await dashboardModel.reporteSucursales(this._filtrosActuales); break;
            }

            this._datosReporte = datos;
            Swal.close();

            if (!datos.length) {
                dashboardView.notificarInfo('No se encontraron registros con esos filtros.');
                dashboardView.limpiarResultados();
                return;
            }

            dashboardView.renderResultados(this._tablaActual, datos);
        } catch (err) {
            console.error('generarReporte:', err);
            dashboardView.notificarError('Error al generar reporte.');
        }
    },

    // ─── EXPORTAR CSV ─────────────────────────────────────────────────────────
    exportarCSV() {
        if (!this._datosReporte.length) return;
        const columnas = dashboardView.obtenerColumnasExport(this._tablaActual);
        const encabezado = columnas.map(c => c.label).join(',');
        const filas = this._datosReporte.map(row =>
            columnas.map(c => {
                const val = c.fn ? c.fn(row) : (row[c.key] ?? '');
                return `"${String(val).replace(/"/g, '""')}"`;
            }).join(',')
        );
        const csv = [encabezado, ...filas].join('\n');
        this._descargar(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), `reporte_${this._tablaActual}_${this._fechaHoy()}.csv`);
    },

    // ─── EXPORTAR EXCEL ───────────────────────────────────────────────────────
    exportarExcel() {
        if (!this._datosReporte.length || !window.XLSX) return;
        const columnas = dashboardView.obtenerColumnasExport(this._tablaActual);
        const wsData = [
            columnas.map(c => c.label),
            ...this._datosReporte.map(row => columnas.map(c => c.fn ? c.fn(row) : (row[c.key] ?? '')))
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        // Estilo encabezado
        const headerRange = XLSX.utils.decode_range(ws['!ref']);
        for (let C = headerRange.s.c; C <= headerRange.e.c; C++) {
            const cell = ws[XLSX.utils.encode_cell({ r: 0, c: C })];
            if (cell) {
                cell.s = {
                    font: { bold: true, color: { rgb: 'FFFFFF' } },
                    fill: { fgColor: { rgb: '3B82F6' } },
                    alignment: { horizontal: 'center' }
                };
            }
        }

        // Anchos automáticos
        ws['!cols'] = columnas.map(() => ({ wch: 20 }));

        XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
        XLSX.writeFile(wb, `reporte_${this._tablaActual}_${this._fechaHoy()}.xlsx`);
    },

    // ─── EXPORTAR PDF ─────────────────────────────────────────────────────────
    exportarPDF() {
        if (!this._datosReporte.length) return;
        const columnas = dashboardView.obtenerColumnasExport(this._tablaActual);
        const titulo = dashboardView.TITULOS_TABLA[this._tablaActual] || 'Reporte';
        const fecha = new Date().toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });

        const filas = this._datosReporte.map(row =>
            columnas.map(c => c.fn ? c.fn(row) : (row[c.key] ?? '-'))
        );

        const htmlTabla = `
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 30px; }
                    h1 { font-size: 18px; font-weight: 800; color: #1e40af; margin-bottom: 4px; }
                    p.sub { font-size: 10px; color: #64748b; margin-bottom: 20px; }
                    table { width: 100%; border-collapse: collapse; }
                    thead tr { background-color: #3b82f6; color: white; }
                    th { padding: 8px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
                    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
                    tr:nth-child(even) td { background-color: #f8fafc; }
                    .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9px; font-weight: 700; }
                    .footer { margin-top: 20px; font-size: 9px; color: #94a3b8; text-align: right; }
                </style>
            </head>
            <body>
                <h1>Reporte: ${titulo}</h1>
                <p class="sub">Generado el ${fecha} — Total: ${this._datosReporte.length} registros</p>
                <table>
                    <thead><tr>${columnas.map(c => `<th>${c.label}</th>`).join('')}</tr></thead>
                    <tbody>${filas.map(fila => `<tr>${fila.map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
                <div class="footer">Geek v2.0 — Panel Administrativo</div>
            </body>
            </html>
        `;

        const ventana = window.open('', '_blank');
        ventana.document.write(htmlTabla);
        ventana.document.close();
        ventana.focus();
        setTimeout(() => { ventana.print(); ventana.close(); }, 500);
    },

    // ─── HELPERS ──────────────────────────────────────────────────────────────
    _descargar(blob, nombre) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = nombre; a.click();
        URL.revokeObjectURL(url);
    },

    _fechaHoy() {
        return new Date().toISOString().slice(0, 10);
    }
};

window.dashboardController = dashboardController;