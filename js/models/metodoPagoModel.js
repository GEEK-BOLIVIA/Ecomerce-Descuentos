import { supabase } from '../config/supabaseClient.js';

export const metodoPagoModel = {

    async listar() {
        try {
            const { data, error } = await supabase
                .from('metodo_pago')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error en metodoPagoModel.listar:', err.message);
            return [];
        }
    },

    async obtenerPorId(id) {
        try {
            const { data, error } = await supabase
                .from('metodo_pago')
                .select('*')
                .eq('id', id)
                .limit(1);

            if (error) throw error;
            if (!data || data.length === 0) return null;
            return data[0];
        } catch (err) {
            console.error(`Error al obtener método de pago ${id}:`, err.message);
            return null;
        }
    },

    async crear(datos) {
        try {
            const payload = {
                nombre:               datos.nombre.trim(),
                slug:                 datos.slug.trim().toLowerCase(),
                activo:               datos.activo ?? true,
                requiere_referencia:  datos.requiere_referencia ?? false,
                descripcion:          datos.descripcion?.trim() || null,
            };

            const { data, error } = await supabase
                .from('metodo_pago')
                .insert([payload])
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error al crear método de pago:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    async actualizar(id, cambios) {
        try {
            const datosLimpios = {};
            if (cambios.nombre              !== undefined) datosLimpios.nombre              = cambios.nombre.trim();
            if (cambios.slug                !== undefined) datosLimpios.slug                = cambios.slug.trim().toLowerCase();
            if (cambios.activo              !== undefined) datosLimpios.activo              = cambios.activo;
            if (cambios.requiere_referencia !== undefined) datosLimpios.requiere_referencia = cambios.requiere_referencia;
            if (cambios.descripcion         !== undefined) datosLimpios.descripcion         = cambios.descripcion?.trim() || null;

            const { data, error } = await supabase
                .from('metodo_pago')
                .update(datosLimpios)
                .eq('id', id)
                .select();

            if (error) throw error;
            return { exito: true, data: data[0] };
        } catch (err) {
            console.error('Error al actualizar método de pago:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    async toggleActivo(id, nuevoEstado) {
        return this.actualizar(id, { activo: nuevoEstado });
    },

    async actualizarVarios(ids, datos) {
        try {
            const { data, error } = await supabase
                .from('metodo_pago')
                .update(datos)
                .in('id', ids);

            if (error) throw error;
            return { exito: true, data };
        } catch (err) {
            console.error('Error en actualizarVarios:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    async eliminar(id) {
        try {
            const { error } = await supabase
                .from('metodo_pago')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Error al eliminar método de pago:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },
};
