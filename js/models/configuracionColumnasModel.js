import { supabase } from '../config/supabaseClient.js';

export const configuracionColumnasModel = {

    /**
     * Obtiene la configuración guardada con jerarquía de prioridad.
     * 1. Usuario específico | 2. Rol del usuario.
     */
    async obtenerConfiguracion(tablaNombre, usuarioId = null, rolId = null) {
        try {
            // Prioridad 1: config específica del usuario
            if (usuarioId) {
                const { data: dataUsuario } = await supabase
                    .from('configuracion_columnas')
                    .select('columnas_visibles')
                    .eq('tabla_nombre', tablaNombre)
                    .eq('usuario_id', usuarioId)
                    .is('rol_id', null);

                if (dataUsuario && dataUsuario.length > 0) {
                    return dataUsuario[0].columnas_visibles;
                }
            }

            // Prioridad 2: config del rol
            if (rolId) {
                const { data: dataRol } = await supabase
                    .from('configuracion_columnas')
                    .select('columnas_visibles')
                    .eq('tabla_nombre', tablaNombre)
                    .eq('rol_id', rolId)
                    .is('usuario_id', null);

                if (dataRol && dataRol.length > 0) {
                    return dataRol[0].columnas_visibles;
                }
            }

            return null;
        } catch (err) {
            console.error('Error al obtener configuración:', err.message);
            return null;
        }
    },
    /**
     * Guarda o actualiza la configuración (UPSERT).
     * CORRECCIÓN: Se envía como [array] para satisfacer los requisitos de la API.
     */
    async guardarConfiguracion(config) {
        try {
            const esUsuario = !!(config.usuario_id && config.usuario_id !== 'null');

            const payload = {
                tabla_nombre: config.tabla_nombre,
                columnas_visibles: config.columnas_visibles,
                usuario_id: esUsuario ? config.usuario_id : null,
                rol_id: esUsuario ? null : config.rol_id
            };

            // ELIMINAR CONFIG ANTERIOR
            let deleteQuery = supabase
                .from('configuracion_columnas')
                .delete()
                .eq('tabla_nombre', config.tabla_nombre);

            if (esUsuario) {
                deleteQuery = deleteQuery.eq('usuario_id', config.usuario_id);
            } else {
                deleteQuery = deleteQuery.eq('rol_id', config.rol_id);
            }

            await deleteQuery;

            // INSERTAR NUEVA
            const { error } = await supabase
                .from('configuracion_columnas')
                .insert(payload);

            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Error guardar config:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },
    /**
     * Elimina la configuración personalizada.
     */
    async resetearConfiguracion(tablaNombre, destinoTipo, destinoId) {
        try {
            let query = supabase
                .from('configuracion_columnas')
                .delete()
                .eq('tabla_nombre', tablaNombre);

            if (destinoTipo === 'usuario') {
                query = query.eq('usuario_id', destinoId);
            } else {
                query = query.eq('rol_id', destinoId);
            }

            const { error } = await query;
            if (error) throw error;

            return { exito: true };
        } catch (err) {
            console.error('Error al resetear:', err.message);
            return { exito: false, mensaje: err.message };
        }
    }
};