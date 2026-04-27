import { supabase } from '../config/supabaseClient.js';

export const pedidoModel = {

    // ─────────────────────────────────────────────
    // PEDIDOS
    // ─────────────────────────────────────────────

    async listar(filtros = {}) {
        try {
            let q = supabase
                .from('pedido')
                .select(`
                    *,
                    usuario:id_usuario ( id, nombres, apellido_paterno, celular ),
                    sucursal:id_sucursal ( id, nombre ),
                    direccion:id_direccion ( id, direccion_texto, referencia ),
                    pago ( id, id_metodo_pago, monto, estado, referencia_externa,
                           metodo:id_metodo_pago ( id, nombre, slug, requiere_referencia ) )
                `)
                .order('creado_at', { ascending: false });

            if (filtros.estado)      q = q.eq('estado', filtros.estado);
            if (filtros.id_sucursal) q = q.eq('id_sucursal', filtros.id_sucursal);

            const { data, error } = await q;
            if (error) throw error;
            return data ?? [];
        } catch (err) {
            console.error('Model Error [pedido.listar]:', err.message);
            return [];
        }
    },

    async getById(id) {
        try {
            const { data, error } = await supabase
                .from('pedido')
                .select(`
                    *,
                    usuario:id_usuario ( id, nombres, apellido_paterno, celular ),
                    sucursal:id_sucursal ( id, nombre ),
                    direccion:id_direccion ( id, direccion_texto, referencia ),
                    pago ( id, id_metodo_pago, monto, estado, referencia_externa,
                           metodo:id_metodo_pago ( id, nombre, slug, requiere_referencia ) ),
                    pedido_item (
                        id, id_producto, id_combo, cantidad, precio_unitario,
                        descuento_monto, subtotal,
                        producto:id_producto ( id, nombre, imagen_url ),
                        combo:id_combo ( id, nombre, imagen_url )
                    )
                `)
                .eq('id', id)
                .single();
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Model Error [pedido.getById]:', err.message);
            return null;
        }
    },

    async crear(pedido, items, pago) {
        try {
            // 1. Insertar pedido
            const { data: pedidoData, error: pedidoErr } = await supabase
                .from('pedido')
                .insert([pedido])
                .select()
                .single();
            if (pedidoErr) throw pedidoErr;

            // 2. Insertar items
            const rows = items.map(i => ({ ...i, id_pedido: pedidoData.id }));
            const { error: itemsErr } = await supabase.from('pedido_item').insert(rows);
            if (itemsErr) throw itemsErr;

            // 3. Insertar pago
            const { error: pagoErr } = await supabase
                .from('pago')
                .insert([{ ...pago, id_pedido: pedidoData.id }]);
            if (pagoErr) throw pagoErr;

            return { exito: true, id: pedidoData.id };
        } catch (err) {
            console.error('Model Error [pedido.crear]:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    async actualizarEstado(id, estado) {
        try {
            const { error } = await supabase
                .from('pedido')
                .update({ estado, actualizado_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Model Error [pedido.actualizarEstado]:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    async actualizarNotas(id, notas) {
        try {
            const { error } = await supabase
                .from('pedido')
                .update({ notas, actualizado_at: new Date().toISOString() })
                .eq('id', id);
            if (error) throw error;
            return { exito: true };
        } catch (err) {
            return { exito: false, mensaje: err.message };
        }
    },

    // ─────────────────────────────────────────────
    // PAGO
    // ─────────────────────────────────────────────

    async actualizarPago(idPago, cambios) {
        try {
            const { error } = await supabase
                .from('pago')
                .update(cambios)
                .eq('id', idPago);
            if (error) throw error;
            return { exito: true };
        } catch (err) {
            console.error('Model Error [pedido.actualizarPago]:', err.message);
            return { exito: false, mensaje: err.message };
        }
    },

    // ─────────────────────────────────────────────
    // STOCK — reducción al confirmar
    // ─────────────────────────────────────────────

    async reducirStockPorItems(idSucursal, items) {
        // items = [{ id_producto, id_combo, cantidad }]
        const errores = [];

        for (const item of items) {
            if (item.id_producto) {
                const ok = await this._decrementarStock(idSucursal, item.id_producto, item.cantidad);
                if (!ok) errores.push(`Producto ${item.id_producto}`);
            } else if (item.id_combo) {
                // Obtener componentes del combo
                const { data: componentes, error } = await supabase
                    .from('combo_producto')
                    .select('id_producto, cantidad')
                    .eq('id_combo', item.id_combo);

                if (error || !componentes) { errores.push(`Combo ${item.id_combo}`); continue; }

                for (const comp of componentes) {
                    const cantTotal = comp.cantidad * item.cantidad;
                    const ok = await this._decrementarStock(idSucursal, comp.id_producto, cantTotal);
                    if (!ok) errores.push(`Producto ${comp.id_producto} (combo ${item.id_combo})`);
                }
            }
        }

        return errores.length === 0
            ? { exito: true }
            : { exito: false, mensaje: `Stock insuficiente: ${errores.join(', ')}` };
    },

    async _decrementarStock(idSucursal, idProducto, cantidad) {
        try {
            const { data, error } = await supabase
                .from('sucursal_producto')
                .select('stock')
                .eq('id_sucursal', idSucursal)
                .eq('id_producto', idProducto)
                .maybeSingle();

            if (error || !data) return false;
            if (data.stock < cantidad) return false;

            const { error: updErr } = await supabase
                .from('sucursal_producto')
                .update({ stock: data.stock - cantidad })
                .eq('id_sucursal', idSucursal)
                .eq('id_producto', idProducto);

            return !updErr;
        } catch { return false; }
    },

    async reponerStockPorItems(idSucursal, items) {
        const errores = [];

        for (const item of items) {
            if (item.id_producto) {
                const ok = await this._incrementarStock(idSucursal, item.id_producto, item.cantidad);
                if (!ok) errores.push(`Producto ${item.id_producto}`);
            } else if (item.id_combo) {
                const { data: componentes, error } = await supabase
                    .from('combo_producto')
                    .select('id_producto, cantidad')
                    .eq('id_combo', item.id_combo);

                if (error || !componentes) { errores.push(`Combo ${item.id_combo}`); continue; }

                for (const comp of componentes) {
                    const ok = await this._incrementarStock(idSucursal, comp.id_producto, comp.cantidad * item.cantidad);
                    if (!ok) errores.push(`Producto ${comp.id_producto} (combo ${item.id_combo})`);
                }
            }
        }

        return errores.length === 0
            ? { exito: true }
            : { exito: false, mensaje: `Error al reponer stock: ${errores.join(', ')}` };
    },

    async _incrementarStock(idSucursal, idProducto, cantidad) {
        try {
            const { data, error } = await supabase
                .from('sucursal_producto')
                .select('stock')
                .eq('id_sucursal', idSucursal)
                .eq('id_producto', idProducto)
                .maybeSingle();

            if (error || !data) return false;

            const { error: updErr } = await supabase
                .from('sucursal_producto')
                .update({ stock: data.stock + cantidad })
                .eq('id_sucursal', idSucursal)
                .eq('id_producto', idProducto);

            return !updErr;
        } catch { return false; }
    },

    // ─────────────────────────────────────────────
    // DATOS AUXILIARES
    // ─────────────────────────────────────────────

    async getSucursales() {
        try {
            const { data, error } = await supabase
                .from('sucursal').select('id, nombre').order('nombre');
            if (error) throw error;
            return data ?? [];
        } catch (err) { return []; }
    },

    async getMetodosPago() {
        try {
            const { data, error } = await supabase
                .from('metodo_pago').select('*').eq('activo', true).order('nombre');
            if (error) throw error;
            return data ?? [];
        } catch (err) { return []; }
    },

    async getUsuarios() {
        try {
            const { data, error } = await supabase
                .from('usuario')
                .select('id, nombres, apellido_paterno, celular')
                .eq('visible', true)
                .order('apellido_paterno');
            if (error) throw error;
            return data ?? [];
        } catch (err) { return []; }
    },

    async getDireccionesUsuario(idUsuario) {
        try {
            const { data, error } = await supabase
                .from('direcciones')
                .select('id, nombre_lugar, direccion_texto, referencia')
                .eq('id_usuario', idUsuario);
            if (error) throw error;
            return data ?? [];
        } catch (err) { return []; }
    },

    async buscarProductos(query, idSucursal) {
        try {
            const { data: sp, error: spErr } = await supabase
                .from('sucursal_producto')
                .select('id_producto, precio, stock')
                .eq('id_sucursal', idSucursal)
                .gt('stock', 0);
            if (spErr) throw spErr;

            const ids = (sp ?? []).map(r => r.id_producto);
            if (!ids.length) return [];

            let q = supabase
                .from('producto')
                .select('id, nombre, codigo')
                .in('id', ids)
                .eq('visible', true)
                .limit(20);
            if (query) q = q.ilike('nombre', `%${query}%`);

            const { data, error } = await q.order('nombre');
            if (error) throw error;

            return (data ?? []).map(p => {
                const sp_row = sp.find(r => r.id_producto === p.id);
                return { ...p, precio: sp_row?.precio ?? 0, stock: sp_row?.stock ?? 0 };
            });
        } catch (err) {
            console.error('Model Error [pedido.buscarProductos]:', err.message);
            return [];
        }
    },

    async buscarCombos(query, idSucursal) {
        try {
            let q = supabase
                .from('combo')
                .select('id, nombre, precio_fijo, porcentaje_descuento')
                .eq('activo', true)
                .limit(20);

            // Combos globales o de la sucursal específica
            q = q.or(`alcance.eq.global,id_sucursal.eq.${idSucursal}`);
            if (query) q = q.ilike('nombre', `%${query}%`);

            const { data, error } = await q.order('nombre');
            if (error) throw error;
            return data ?? [];
        } catch (err) {
            console.error('Model Error [pedido.buscarCombos]:', err.message);
            return [];
        }
    },
};
