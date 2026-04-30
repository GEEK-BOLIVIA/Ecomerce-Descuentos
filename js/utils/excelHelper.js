// excelHelper.js
export const aplicarEstiloCabecera = (ws, range) => {
    const excelUtils = window.XLSX.utils;
    for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = excelUtils.encode_col(C) + "2";
        if (!ws[address]) continue;
        ws[address].s = {
            fill: { patternType: "solid", fgColor: { rgb: "5EC8AA" } },
            font: { name: 'Arial', sz: 11, bold: true, color: { rgb: "FFFFFF" } },
            alignment: { vertical: "center", horizontal: "center" },
            border: { bottom: { style: "thin", color: { rgb: "48b496" } } }
        };
    }
};

/**
 * Aplica estilo azul a las columnas de sucursales para distinguirlas visualmente
 */
export const aplicarEstiloCabeceraSucursal = (ws, colIndices) => {
    const excelUtils = window.XLSX.utils;
    colIndices.forEach(C => {
        const address = excelUtils.encode_col(C) + "2";
        if (!ws[address]) return;
        ws[address].s = {
            fill: { patternType: "solid", fgColor: { rgb: "4A90E2" } },
            font: { name: 'Arial', sz: 11, bold: true, color: { rgb: "FFFFFF" } },
            alignment: { vertical: "center", horizontal: "center" },
            border: { bottom: { style: "thin", color: { rgb: "3a7bd5" } } }
        };
    });
};
