import { supabase } from '../config/supabaseClient.js';

export const dashboardModel = {

    // ─── KPIs GENERALES ───────────────────────────────────────────────────────
    async obtenerResumen() {
        try {
            const [
                { count: totalProductos },
                { count: totalCategorias },
                { count: totalSucursales },
                { count: totalUsuarios },
                { count: totalCombos },
                { count: totalDescuentos }
            ] = await Promise.all([
                supabase.from('producto').select('*', { count: 'exact', head: true }).eq('visible', true),
                supabase.from('categoria').select('*', { count: 'exact', head: true }).eq('visible', true),
                supabase.from('sucursal').select('*', { count: 'exact', head: true }),
                supabase.from('usuario').select('*', { count: 'exact', head: true }).eq('visible', true),
                supabase.from('combo').select('*', { count: 'exact', head: true }).eq('activo', true),
                supabase.from('descuento').select('*', { count: 'exact', head: true }).eq('activo', true)
            ]);
            return { totalProductos, totalCategorias, totalSucursales, totalUsuarios, totalCombos, totalDescuentos };
        } catch (err) {
            console.error('dashboardModel.obtenerResumen:', err.message);
            return null;
        }
    },

    async obtenerStockBajo(limite = 5) {
        try {
            const { data, error } = await supabase
                .from('sucursal_producto')
                .select(`stock, precio, producto:id_producto(id, nombre, imagen_url), sucursal:id_sucursal(nombre)`)
                .lte('stock', limite)
                .order('stock', { ascending: true })
                .limit(10);
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('dashboardModel.obtenerStockBajo:', err.message);
            return [];
        }
    },

    async obtenerDistribucionRoles() {
        try {
            const roles = ['owner', 'admin', 'supervisor', 'cliente'];
            const resultados = await Promise.all(
                roles.map(rol =>
                    supabase.from('usuario')
                        .select('*', { count: 'exact', head: true })
                        .eq('rol', rol).eq('visible', true)
                        .then(({ count }) => ({ rol, total: count || 0 }))
                )
            );
            return resultados;
        } catch (err) {
            console.error('dashboardModel.obtenerDistribucionRoles:', err.message);
            return [];
        }
    },

    async obtenerProductosPorCategoria() {
        try {
            const { data, error } = await supabase
                .from('producto_categorias_rel')
                .select(`
                id_categoria,
                categoria:id_categoria(id, nombre, visible)
            `);

            if (error) throw error;

            const mapa = {};
            data.forEach(({ categoria }) => {
                if (!categoria || !categoria.visible) return;
                const key = categoria.nombre;
                mapa[key] = (mapa[key] || 0) + 1;
            });

            return Object.entries(mapa)
                .map(([nombre, total]) => ({ nombre, total }))
                .sort((a, b) => b.total - a.total)
                .slice(0, 6);
        } catch (err) {
            console.error('obtenerProductosPorCategoria:', err.message);
            return [];
        }
    },
    // ─── DATOS AUXILIARES PARA FILTROS ────────────────────────────────────────
    async obtenerSucursales() {
        const { data } = await supabase.from('sucursal').select('id, nombre').order('nombre');
        return data || [];
    },

    async obtenerCategoriasPadre() {
        const { data } = await supabase.from('categoria').select('id, nombre')
            .eq('visible', true).is('id_padre', null).order('nombre');
        return data || [];
    },

    // ─── REPORTE: PRODUCTOS + STOCK ───────────────────────────────────────────
    async reporteProductosStock(filtros = {}) {
        try {
            let query = supabase
                .from('sucursal_producto')
                .select(`
                    stock, precio, visible,
                    producto:id_producto(id, nombre, descripcion, codigo, visible),
                    sucursal:id_sucursal(id, nombre)
                `);

            if (filtros.id_sucursal) query = query.eq('id_sucursal', filtros.id_sucursal);
            if (filtros.stock_min != null) query = query.gte('stock', filtros.stock_min);
            if (filtros.stock_max != null) query = query.lte('stock', filtros.stock_max);
            if (filtros.precio_min != null) query = query.gte('precio', filtros.precio_min);
            if (filtros.precio_max != null) query = query.lte('precio', filtros.precio_max);
            if (filtros.visible != null) query = query.eq('visible', filtros.visible);

            const { data, error } = await query.order('stock', { ascending: true });
            if (error) throw error;

            // Filtro por categoría (post-query porque es relación M:N)
            if (filtros.id_categoria) {
                const { data: rels } = await supabase
                    .from('producto_categorias_rel')
                    .select('id_producto')
                    .eq('id_categoria', filtros.id_categoria);
                const ids = new Set((rels || []).map(r => r.id_producto));
                return data.filter(row => ids.has(row.producto?.id));
            }

            return data;
        } catch (err) {
            console.error('reporteProductosStock:', err.message);
            return [];
        }
    },

    // ─── REPORTE: USUARIOS ────────────────────────────────────────────────────
    async reporteUsuarios(filtros = {}) {
        try {
            let query = supabase
                .from('usuario')
                .select('id, nombres, apellido_paterno, apellido_materno, correo_electronico, celular, ci, rol, visible');

            if (filtros.rol) query = query.eq('rol', filtros.rol);
            if (filtros.visible != null) query = query.eq('visible', filtros.visible);

            const { data, error } = await query.order('nombres');
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('reporteUsuarios:', err.message);
            return [];
        }
    },

    // ─── REPORTE: CATEGORÍAS ──────────────────────────────────────────────────
    async reporteCategorias(filtros = {}) {
        try {
            let query = supabase
                .from('categoria')
                .select(`id, nombre, visible, id_padre, categoria_padre:id_padre(nombre)`)
                .eq('visible', true);

            if (filtros.tipo === 'padre') query = query.is('id_padre', null);
            if (filtros.tipo === 'hijo') query = query.not('id_padre', 'is', null);

            const { data, error } = await query.order('nombre');
            if (error) throw error;

            return data.map(c => ({
                ...c,
                nombre_padre: c.categoria_padre?.nombre || 'Principal',
                tipo: c.id_padre ? 'Subcategoría' : 'Categoría'
            }));
        } catch (err) {
            console.error('reporteCategorias:', err.message);
            return [];
        }
    },

    // ─── REPORTE: DESCUENTOS + COMBOS ─────────────────────────────────────────
    async reporteDescuentosCombos(filtros = {}) {
        try {
            // Descuentos
            let qDesc = supabase
                .from('descuento')
                .select('id, nombre, descripcion, tipo, valor, alcance, activo, fecha_inicio, fecha_fin, creado_at, sucursal:id_sucursal(nombre)');

            if (filtros.activo != null) qDesc = qDesc.eq('activo', filtros.activo);
            if (filtros.alcance) qDesc = qDesc.eq('alcance', filtros.alcance);
            if (filtros.tipo_desc) qDesc = qDesc.eq('tipo', filtros.tipo_desc);
            if (filtros.fecha_desde) qDesc = qDesc.gte('creado_at', filtros.fecha_desde);
            if (filtros.fecha_hasta) qDesc = qDesc.lte('creado_at', filtros.fecha_hasta + 'T23:59:59Z');

            // Combos
            let qCombo = supabase
                .from('combo')
                .select('id, nombre, descripcion, alcance, precio_fijo, porcentaje_descuento, activo, fecha_inicio, fecha_fin, creado_at, sucursal:id_sucursal(nombre)');

            if (filtros.activo != null) qCombo = qCombo.eq('activo', filtros.activo);
            if (filtros.alcance) qCombo = qCombo.eq('alcance', filtros.alcance);
            if (filtros.fecha_desde) qCombo = qCombo.gte('creado_at', filtros.fecha_desde);
            if (filtros.fecha_hasta) qCombo = qCombo.lte('creado_at', filtros.fecha_hasta + 'T23:59:59Z');

            const [{ data: descuentos, error: e1 }, { data: combos, error: e2 }] = await Promise.all([qDesc, qCombo]);
            if (e1) throw e1;
            if (e2) throw e2;

            const descMap = (descuentos || []).map(d => ({ ...d, _tipo_registro: 'Descuento', valor_display: d.tipo === 'porcentaje' ? `${d.valor}%` : `Bs. ${d.valor}` }));
            const comboMap = (combos || []).map(c => ({ ...c, _tipo_registro: 'Combo', tipo: c.precio_fijo ? 'precio_fijo' : 'porcentaje', valor: c.precio_fijo ?? c.porcentaje_descuento, valor_display: c.precio_fijo ? `Bs. ${c.precio_fijo}` : `${c.porcentaje_descuento}%` }));

            return [...descMap, ...comboMap].sort((a, b) => new Date(b.creado_at) - new Date(a.creado_at));
        } catch (err) {
            console.error('reporteDescuentosCombos:', err.message);
            return [];
        }
    },

    // ─── REPORTE: SUCURSALES ──────────────────────────────────────────────────
    async reporteSucursales(filtros = {}) {
        try {
            const { data: sucursales, error } = await supabase
                .from('sucursal').select('id, nombre, direccion').order('nombre');
            if (error) throw error;

            // Enriquecer con conteo de productos y stock total
            const enriquecidas = await Promise.all(sucursales.map(async s => {
                const { count: totalProductos } = await supabase
                    .from('sucursal_producto').select('*', { count: 'exact', head: true })
                    .eq('id_sucursal', s.id);
                const { data: stockData } = await supabase
                    .from('sucursal_producto').select('stock').eq('id_sucursal', s.id);
                const stockTotal = (stockData || []).reduce((acc, r) => acc + (r.stock || 0), 0);
                return { ...s, totalProductos: totalProductos || 0, stockTotal };
            }));

            return enriquecidas;
        } catch (err) {
            console.error('reporteSucursales:', err.message);
            return [];
        }
    }
};