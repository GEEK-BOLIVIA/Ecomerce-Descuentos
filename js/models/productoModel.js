import { supabase } from '../config/supabaseClient.js';

export const productoModel = {

    async listarActivos(idSucursal = 1) { // Por defecto sucursal 1
        try {
            const { data, error } = await supabase
                .from('v_productos_detallados')
                .select('*')
                // Ahora validamos ambos niveles de visibilidad
                .eq('visible_global', true)
                .eq('visible_sucursal', true)
                .eq('id_sucursal', idSucursal) // FILTRO CRÍTICO
                .order('producto_id', { ascending: false });

            if (error) throw error;

            // Ya no necesitamos filtrar duplicados con Set() porque 
            // al filtrar por id_sucursal, cada producto sale solo una vez.
            return data.map(p => ({
                ...p,
                id: p.producto_id,
                // Ajustamos los nombres según las columnas de tu vista
                nombre: p.nombre,
                nombre_categoria: p.categoria_padre_nombre
                    ? `${p.categoria_padre_nombre} > ${p.categoria_nombre}`
                    : (p.categoria_nombre || 'Sin Categoría')
            }));

        } catch (err) {
            console.error('Error en productoModel.listarActivos:', err.message);
            return [];
        }
    },
    async obtenerPorId(id) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .select('*')
                .eq('id', id)
                .limit(1);

            if (error) throw error;
            if (!data || data.length === 0) return null;

            return { ...data[0], id: data[0].id };
        } catch (err) {
            console.error(`Error al obtener producto ${id}:`, err.message);
            return null;
        }
    },
    async crear(datos) {
        try {
            const payload = {
                nombre: datos.nombre ? datos.nombre.trim() : 'Sin Nombre',
                codigo: datos.codigo || null,
                descripcion: datos.descripcion || '',
                imagen_url: datos.portada || '',
                visible: true,
                mostrar_precio: datos.price_visible == 1 || datos.price_visible === true,
                habilitar_whatsapp: datos.ws_active == 1 || datos.ws_active === true
                // ← precio y stock eliminados, van en sucursal_producto
            };

            const { data, error } = await supabase
                .from('producto')
                .insert([payload])
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error al crear producto:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    async actualizar(id, cambios) {
        try {
            const datosLimpios = {
                nombre: cambios.nombre || cambios.producto_nombre,
                codigo: cambios.codigo,
                descripcion: cambios.descripcion,
                imagen_url: cambios.imagen_url || cambios.portada,
                mostrar_precio: cambios.mostrar_precio !== undefined ? cambios.mostrar_precio
                    : (cambios.price_visible !== undefined ? cambios.price_visible : undefined),
                habilitar_whatsapp: cambios.habilitar_whatsapp !== undefined ? cambios.habilitar_whatsapp
                    : (cambios.ws_active !== undefined ? cambios.ws_active : undefined)
                // ← precio y stock eliminados
            };

            Object.keys(datosLimpios).forEach(key => {
                if (datosLimpios[key] === undefined) delete datosLimpios[key];
            });

            const { data, error } = await supabase
                .from('producto')
                .update(datosLimpios)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error al actualizar producto:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },
    /**
     * Víncula producto con categoría
     */
    async vincularCategoria(id_producto, id_categoria) {
        try {
            const { error } = await supabase
                .from('producto_categorias_rel')
                .insert([{ id_producto, id_categoria }]);

            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Error al vincular categoría:', err.message);
            return { exito: false };
        }
    },

    /**
     * Actualización Masiva
     */
    async actualizarMasivo(campo, valor) {
        try {
            // Traducir campo si viene del componente
            let campoReal = campo;
            if (campo === 'ws_active') campoReal = 'habilitar_whatsapp';
            if (campo === 'price_visible') campoReal = 'mostrar_precio';

            const { data, error } = await supabase
                .from('producto')
                .update({ [campoReal]: valor })
                .eq('visible', true)
                .select();

            if (error) throw error;
            return { exito: true, total: data.length };
        } catch (err) {
            console.error(`Error en actualización masiva:`, err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Actualiza solo un grupo específico de IDs
     */
    async actualizarVarios(ids, datos) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .update(datos)
                .in('id', ids);

            if (error) throw error;
            return { exito: true, data };
        } catch (err) {
            console.error("Error en actualizarVarios:", err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    /**
     * Soft Delete
     */
    async eliminar(id) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .update({ visible: false })
                .eq('id', id)
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error en Soft Delete:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },
    async buscarPorNombre(termino) {
        try {
            const { data, error } = await supabase
                .from('producto')
                .select('id, nombre, imagen_url, codigo, visible')
                .ilike('nombre', `%${termino}%`)
                .eq('visible', true)
                .limit(10);

            if (error) throw error;

            // NORMALIZACIÓN CORREGIDA:
            // Usamos los nombres reales de las columnas de tu tabla 'producto'
            return data.map(p => ({
                id: p.id,
                nombre: p.nombre,
                imagen: p.imagen_url,
                codigo: p.codigo
            }));
        } catch (err) {
            console.error('Error buscando productos:', err.message);
            return [];
        }
    },
    async listarTodoDetallado() {
        try {
            const { data, error } = await supabase
                .from('v_productos_resumen')  // ← nueva vista
                .select('*')
                .order('producto_id', { ascending: false });

            if (error) throw error;

            return data.map(p => ({
                ...p,
                id: p.producto_id,
                nombre: p.nombre,
                nombre_categoria: p.categoria_nombre || 'Sin Categoría',
                // precio_rango disponible para mostrar en tabla si lo necesitas
            }));
        } catch (err) {
            console.error('Error en listarTodoDetallado:', err.message);
            return [];
        }
    }
};