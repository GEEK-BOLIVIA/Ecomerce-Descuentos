import { supabase } from '../config/supabaseClient.js';

export const departamentoModel = {

    async getAll() {
        try {
            const { data, error } = await supabase
                .from('departamentos')
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener departamentos:', error.message);
            return [];
        }
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('departamentos')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [departamento.getById]:', error.message);
            return null;
        }
    },

    async create(datos) {
        try {
            const { nombre, slug, lat, lng, zoom_sugerido } = datos;

            const { data, error } = await supabase
                .from('departamentos')
                .insert([{ nombre, slug, lat, lng, zoom_sugerido }])
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [departamento.create]:', error.message);
            throw error;
        }
    },

    async update(id, updates) {
        try {
            const { nombre, slug, lat, lng, zoom_sugerido } = updates;

            const { data, error } = await supabase
                .from('departamentos')
                .update({ nombre, slug, lat, lng, zoom_sugerido })
                .eq('id', id)
                .select();

            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Model Error [departamento.update]:', error.message);
            throw error;
        }
    },

    async delete(id) {
        const { data, error } = await supabase
            .from('departamentos')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Error al eliminar: ${error.message}`);
        return data;
    }
};