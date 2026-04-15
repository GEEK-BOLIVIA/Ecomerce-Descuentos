import { supabase } from '../config/supabaseClient.js';

export const comboModel = {

    // ─────────────────────────────────────────────
    // COMBOS
    // ─────────────────────────────────────────────
    async uploadImagen(archivo) {
        // archivo es un File object
        const ext = archivo.name.split('.').pop();
        const path = `combos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
            .from('Almacenamiento')
            .upload(path, archivo, { upsert: true, contentType: archivo.type });
        if (error) throw error;
        const { data } = supabase.storage.from('Almacenamiento').getPublicUrl(path);
        return data.publicUrl;
    },

    async getAll() {
        try {
            const { data, error } = await supabase
                .from('combo')
                .select(`*, sucursal:id_sucursal ( id, nombre )`)
                .order('creado_at', { ascending: false });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [combo.getAll]:', error.message);
            return [];
        }
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('combo')
                .select(`*, sucursal:id_sucursal ( id, nombre )`)
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [combo.getById]:', error.message);
            return null;
        }
    },

    async create(datos) {
        const { nombre, descripcion, imagen_url, alcance, id_sucursal,
            precio_fijo, porcentaje_descuento, activo,
            fecha_inicio, fecha_fin } = datos;
        const { data, error } = await supabase
            .from('combo')
            .insert([{
                nombre, descripcion,
                imagen_url: imagen_url || null,
                alcance,
                id_sucursal: id_sucursal || null,
                precio_fijo: precio_fijo || null,
                porcentaje_descuento: porcentaje_descuento || null,
                activo,
                fecha_inicio: fecha_inicio || null,
                fecha_fin: fecha_fin || null
            }])
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async update(id, datos) {
        const { nombre, descripcion, imagen_url, alcance, id_sucursal,
            precio_fijo, porcentaje_descuento, activo,
            fecha_inicio, fecha_fin } = datos;
        const { data, error } = await supabase
            .from('combo')
            .update({
                nombre, descripcion,
                imagen_url: imagen_url || null,
                alcance,
                id_sucursal: id_sucursal || null,
                precio_fijo: precio_fijo || null,
                porcentaje_descuento: porcentaje_descuento || null,
                activo,
                fecha_inicio: fecha_inicio || null,
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
            .from('combo')
            .update({ fecha_inicio: fecha_inicio || null, fecha_fin: fecha_fin || null })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async toggleActivo(id, activo) {
        const { data, error } = await supabase
            .from('combo')
            .update({ activo })
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async delete(id) {
        const { error } = await supabase
            .from('combo')
            .delete()
            .eq('id', id);
        if (error) throw error;
    },

    // ─────────────────────────────────────────────
    // PRODUCTOS DEL COMBO
    // ─────────────────────────────────────────────
    async getProductosDelCombo(id) {
        try {
            const { data, error } = await supabase
                .from('combo_producto')
                .select(`
                    cantidad,
                    producto:id_producto (
                        id, nombre,
                        galeria_producto ( url, orden ),
                        sucursal_producto ( precio, id_sucursal ),
                        producto_categorias_rel (
                            categoria:id_categoria ( id, nombre )
                        )
                    )
                `)
                .eq('id_combo', id);
            if (error) throw error;
            return (data ?? [])
                .filter(d => d.producto)
                .map(d => ({
                    id: d.producto.id,
                    nombre: d.producto.nombre,
                    imagen: d.producto.galeria_producto?.sort((a, b) => a.orden - b.orden)?.[0]?.url ?? null,
                    precios: d.producto.sucursal_producto ?? [],
                    categoria: d.producto.producto_categorias_rel?.[0]?.categoria ?? null,
                    cantidad: d.cantidad
                }));
        } catch (error) {
            console.error('Model Error [combo.getProductos]:', error.message);
            return [];
        }
    },

    async sincronizarProductos(id_combo, items) {
        // items = [{ id_producto, cantidad }]
        await supabase.from('combo_producto').delete().eq('id_combo', id_combo);
        if (!items.length) return;
        const rows = items.map(({ id_producto, cantidad }) => ({ id_combo, id_producto, cantidad }));
        const { error } = await supabase.from('combo_producto').insert(rows);
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
            console.error('Model Error [combo.getSucursales]:', error.message);
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
            console.error('Model Error [combo.getCategorias]:', error.message);
            return [];
        }
    },

    async buscarProductos(query, id_sucursal = null) {
        try {
            let idsBase = null;
            if (id_sucursal) {
                const { data: spRows, error: spErr } = await supabase
                    .from('sucursal_producto')
                    .select('id_producto')
                    .eq('id_sucursal', id_sucursal);
                if (spErr) throw spErr;
                idsBase = (spRows ?? []).map(r => r.id_producto);
                if (idsBase.length === 0) return [];
            }

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
            console.error('Model Error [combo.buscarProductos]:', error.message);
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
            console.error('Model Error [combo.getProductosPorCategoria]:', error.message);
            return [];
        }
    }
};