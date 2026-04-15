import { supabase } from '../config/supabaseClient.js';

export const descuentoModel = {

    // ─────────────────────────────────────────────
    // DESCUENTOS
    // ─────────────────────────────────────────────
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('descuento')
                .select(`
                    *,
                    sucursal:id_sucursal ( id, nombre )
                `)
                .order('creado_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [descuento.getAll]:', error.message);
            return [];
        }
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('descuento')
                .select(`
                    *,
                    sucursal:id_sucursal ( id, nombre )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [descuento.getById]:', error.message);
            return null;
        }
    },

    async create(datos) {
        const { nombre, descripcion, tipo, valor, alcance, id_sucursal,
            activo, fecha_inicio, fecha_fin } = datos;
        const { data, error } = await supabase
            .from('descuento')
            .insert([{
                nombre, descripcion, tipo, valor, alcance,
                id_sucursal: id_sucursal || null,
                activo, fecha_inicio: fecha_inicio || null,
                fecha_fin: fecha_fin || null
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, datos) {
        const { nombre, descripcion, tipo, valor, alcance, id_sucursal,
            activo, fecha_inicio, fecha_fin } = datos;
        const { data, error } = await supabase
            .from('descuento')
            .update({
                nombre, descripcion, tipo, valor, alcance,
                id_sucursal: id_sucursal || null,
                activo, fecha_inicio: fecha_inicio || null,
                fecha_fin: fecha_fin || null
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateFechas(id, fecha_inicio, fecha_fin) {
        const { data, error } = await supabase
            .from('descuento')
            .update({
                fecha_inicio: fecha_inicio || null,
                fecha_fin: fecha_fin || null
            })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async toggleActivo(id, activo) {
        const { data, error } = await supabase
            .from('descuento')
            .update({ activo })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('descuento')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ─────────────────────────────────────────────
    // PRODUCTOS Y CATEGORÍAS DEL DESCUENTO
    // ─────────────────────────────────────────────
    async getProductosDelDescuento(id) {
        try {
            const { data, error } = await supabase
                .from('descuento_producto')
                .select(`
                    producto:id_producto (
                        id, nombre,
                        galeria_producto ( url, orden ),
                        sucursal_producto ( precio, id_sucursal ),
                        producto_categorias_rel (
                            categoria:id_categoria ( id, nombre )
                        )
                    )
                `)
                .eq('id_descuento', id);
            if (error) throw error;
            return (data ?? [])
                .map(d => d.producto)
                .filter(Boolean)
                .map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    imagen: p.galeria_producto?.sort((a, b) => a.orden - b.orden)?.[0]?.url ?? null,
                    precios: p.sucursal_producto ?? [],
                    categoria: p.producto_categorias_rel?.[0]?.categoria ?? null,
                    excluidos: []
                }));
        } catch (error) {
            console.error('Model Error [descuento.getProductos]:', error.message);
            return [];
        }
    },

    async getCategoriasDelDescuento(id) {
        try {
            const { data, error } = await supabase
                .from('descuento_categoria')
                .select('id_categoria, categoria:id_categoria(id, nombre)')
                .eq('id_descuento', id);
            if (error) throw error;
            return data.map(d => d.categoria);
        } catch (error) {
            console.error('Model Error [descuento.getCategorias]:', error.message);
            return [];
        }
    },

    async sincronizarProductos(id_descuento, ids_productos) {
        // Borrar todos y reinsertar
        await supabase.from('descuento_producto').delete().eq('id_descuento', id_descuento);
        if (ids_productos.length === 0) return;
        const rows = ids_productos.map(id_producto => ({ id_descuento, id_producto }));
        const { error } = await supabase.from('descuento_producto').insert(rows);
        if (error) throw error;
    },

    async sincronizarCategorias(id_descuento, ids_categorias) {
        await supabase.from('descuento_categoria').delete().eq('id_descuento', id_descuento);
        if (ids_categorias.length === 0) return;
        const rows = ids_categorias.map(id_categoria => ({ id_descuento, id_categoria }));
        const { error } = await supabase.from('descuento_categoria').insert(rows);
        if (error) throw error;
    },

    // ─────────────────────────────────────────────
    // DATOS AUXILIARES
    // ─────────────────────────────────────────────
    async getSucursales() {
        try {
            const { data, error } = await supabase
                .from('sucursal')
                .select('id, nombre')
                .order('nombre');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [descuento.getSucursales]:', error.message);
            return [];
        }
    },

    async getCategorias() {
        try {
            const { data, error } = await supabase
                .from('categoria')
                .select('id, nombre, id_padre')
                .order('nombre');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [descuento.getCategorias]:', error.message);
            return [];
        }
    },

    async buscarProductos(query, id_sucursal = null) {
        try {
            let idsBase = null;

            if (id_sucursal) {
                // Paso 1: traer IDs de productos disponibles en esa sucursal
                const { data: spRows, error: spErr } = await supabase
                    .from('sucursal_producto')
                    .select('id_producto')
                    .eq('id_sucursal', id_sucursal);
                if (spErr) throw spErr;
                idsBase = (spRows ?? []).map(r => r.id_producto);
                if (idsBase.length === 0) return [];
            }

            // Paso 2: buscar productos enriquecidos
            let q = supabase
                .from('producto')
                .select(`
                    id, nombre,
                    galeria_producto ( url, orden ),
                    sucursal_producto ( precio, id_sucursal ),
                    producto_categorias_rel (
                        categoria:id_categoria ( id, nombre )
                    )
                `)
                .limit(20);

            if (idsBase) q = q.in('id', idsBase);
            else q = q.eq('visible', true);
            if (query) q = q.ilike('nombre', `%${query}%`);

            const { data, error } = await q.order('nombre');
            if (error) throw error;

            return (data ?? []).map(p => ({
                id: p.id,
                nombre: p.nombre,
                imagen: p.galeria_producto?.sort((a, b) => a.orden - b.orden)?.[0]?.url ?? null,
                precios: p.sucursal_producto ?? [],
                categoria: p.producto_categorias_rel?.[0]?.categoria ?? null
            }));
        } catch (error) {
            console.error('Model Error [descuento.buscarProductos]:', error.message);
            return [];
        }
    },

    async getProductosPorCategoria(id_categoria) {
        try {
            const { data, error } = await supabase
                .from('producto_categorias_rel')
                .select(`
                    producto:id_producto (
                        id, nombre,
                        galeria_producto ( url, orden ),
                        sucursal_producto ( precio, id_sucursal )
                    )
                `)
                .eq('id_categoria', id_categoria);

            if (error) throw error;
            return (data ?? [])
                .map(r => r.producto)
                .filter(Boolean)
                .map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    imagen: p.galeria_producto?.sort((a, b) => a.orden - b.orden)?.[0]?.url ?? null,
                    precios: p.sucursal_producto ?? []
                }));
        } catch (error) {
            console.error('Model Error [descuento.getProductosPorCategoria]:', error.message);
            return [];
        }
    }
};