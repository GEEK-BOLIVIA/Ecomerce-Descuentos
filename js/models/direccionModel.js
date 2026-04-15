import { supabase } from '../config/supabaseClient.js';

export const direccionModel = {

    /**
     * Obtiene todas las direcciones con JOIN a usuario y departamento
     */
    async getAll() {
        try {
            const { data, error } = await supabase
                .from('direcciones')
                .select(`
                    *,
                    usuario:id_usuario (
                        id,
                        nombres,
                        apellido_paterno,
                        apellido_materno,
                        correo_electronico
                    ),
                    departamento:id_departamento (
                        id,
                        nombre,
                        slug
                    )
                `)
                .order('creado_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error al obtener direcciones:', error.message);
            return [];
        }
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('direcciones')
                .select(`
                    *,
                    usuario:id_usuario (
                        id,
                        nombres,
                        apellido_paterno,
                        apellido_materno,
                        correo_electronico
                    ),
                    departamento:id_departamento (
                        id,
                        nombre,
                        slug
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [direccion.getById]:', error.message);
            return null;
        }
    },

    /**
     * Obtiene solo clientes para el selector del formulario
     */
    async getClientes() {
        try {
            const { data, error } = await supabase
                .from('usuario')
                .select('id, nombres, apellido_paterno, apellido_materno, correo_electronico, ci')
                .eq('rol', 'cliente')
                .eq('visible', true)
                .order('ci', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [direccion.getClientes]:', error.message);
            return [];
        }
    },

    /**
     * Obtiene todos los departamentos para el selector
     */
    async getDepartamentos() {
        try {
            const { data, error } = await supabase
                .from('departamentos')
                .select('id, nombre, slug, lat, lng, zoom_sugerido')
                .order('nombre', { ascending: true });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [direccion.getDepartamentos]:', error.message);
            return [];
        }
    },

    async create(datos) {
        try {
            const { id_usuario, id_departamento, nombre_lugar, lat, lng, referencia, direccion_texto, es_principal } = datos;

            const { data, error } = await supabase
                .from('direcciones')
                .insert([{ id_usuario, id_departamento, nombre_lugar, lat, lng, referencia, direccion_texto, es_principal }])
                .select();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Model Error [direccion.create]:', error.message);
            throw error;
        }
    },

    async update(id, datos) {
        try {
            const { id_usuario, id_departamento, nombre_lugar, lat, lng, referencia, direccion_texto, es_principal } = datos;

            const { data, error } = await supabase
                .from('direcciones')
                .update({ id_usuario, id_departamento, nombre_lugar, lat, lng, referencia, direccion_texto, es_principal })
                .eq('id', id)
                .select();

            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Model Error [direccion.update]:', error.message);
            throw error;
        }
    },

    async delete(id) {
        const { data, error } = await supabase
            .from('direcciones')
            .delete()
            .eq('id', id);

        if (error) throw new Error(`Error al eliminar: ${error.message}`);
        return data;
    }
};