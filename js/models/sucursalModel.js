import { supabase } from '../config/supabaseClient.js';

export const sucursalModel = {
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('sucursales_con_conteo') // Consultamos la VIEW
                .select('*')
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener sucursales:', error.message);
            return [];
        }
    },

    /**
     * Obtiene una sucursal por su ID
     */
    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('sucursal')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Model Error [sucursal.getById]:", error.message);
            return null;
        }
    },

    /**
     * Crea una nueva sucursal
     */
    async create(datos) {
        try {
            // Extraemos solo lo que queremos enviar (Nombre y Dirección)
            // Esto garantiza que NO se envíe un campo 'id' vacío o nulo
            const { nombre, direccion } = datos;

            const { data, error } = await supabase
                .from('sucursal')
                .insert([{ nombre, direccion }]) // Solo enviamos estos dos
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error("Model Error [sucursal.create]:", error.message);
            throw error;
        }
    },

    async update(id, updates) {
        try {
            const { data, error } = await supabase
                .from('sucursal')
                .update({
                    nombre: updates.nombre,
                    direccion: updates.direccion
                    // No incluimos 'id' aquí, así protegemos la integridad
                })
                .eq('id', id)
                .select();

            if (error) throw error;

            // Retornamos el primer elemento actualizado
            return data && data.length > 0 ? data[0] : null;

        } catch (error) {
            console.error("Model Error [sucursal.update]:", error.message);
            // Re-lanzamos el error para que el Controller pueda notificar al usuario
            throw error;
        }
    },
    async delete(id) {
        const { data, error } = await supabase
            .from('sucursal')
            .delete()
            .eq('id', id);

        if (error) {
            throw new Error(`Error al eliminar: ${error.message}`);
        }

        return data;
    }
};