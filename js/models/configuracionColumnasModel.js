import { supabase } from '../config/supabaseClient.js';

export const configuracionColumnasModel = {

    /**
     * Obtiene la configuración guardada con jerarquía de prioridad.
     * 1. Usuario específico | 2. Rol del usuario.
     */
    async obtenerConfiguracion(tablaNombre, usuarioId = null, rolId = null) {
        try {
            let query = supabase
                .from('configuracion_columnas')
                .select('columnas_visibles')
                .eq('tabla_nombre', tablaNombre);

            if (usuarioId) {
                // Prioridad 1: Configuración específica del usuario
                query = query.eq('usuario_id', usuarioId).is('rol_id', null);
            } else if (rolId) {
                // Prioridad 2: Configuración del grupo (rol)
                query = query.eq('rol_id', rolId).is('usuario_id', null);
            }

            // Usamos .select() normal en lugar de .maybeSingle() para evitar el error 406/400
            const { data, error } = await query;
            if (data && data.length > 0) return data[0].columnas_visibles;

            if (error) throw error;

            // Si hay resultados, tomamos el primero (el más reciente o único)
            if (data && data.length > 0) {
                return data[0].columnas_visibles;
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
            // En configuracionColumnasModel.js
            const esUsuario = !!(config.usuario_id && config.usuario_id !== 'null');

            const payload = {
                tabla_nombre: config.tabla_nombre,
                columnas_visibles: config.columnas_visibles,
                usuario_id: esUsuario ? config.usuario_id : null,
                rol_id: esUsuario ? null : config.rol_id
            };

            // Ahora que creamos las constraints, esto coincidirá perfectamente
            const columnasConflicto = esUsuario
                ? 'tabla_nombre,usuario_id'
                : 'tabla_nombre,rol_id';

            const { error } = await supabase
                .from('configuracion_columnas')
                .upsert(payload, {
                    onConflict: columnasConflicto
                });
            if (error) {
                console.error('Error detallado de Supabase:', error);
                throw error;
            }

            return { exito: true };
        } catch (err) {
            console.error('Error crítico en guardarConfiguracion:', err.message);
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