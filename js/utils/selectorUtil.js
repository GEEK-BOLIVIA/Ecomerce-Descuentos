// js/utils/selectorUtil.js

export const selectorUtil = {
    // Estado interno inicial
    estado: {
        seleccionados: [],
        idCheckboxHeader: 'checkbox-header',
        claseCheckboxFila: 'fila-checkbox',
        claseFilaActiva: 'bg-blue-50/60'
    },

    /**
     * Alterna la selección de un ítem individual
     * @param {string|number} id - ID del registro
     * @param {Function} callbackActualizar - Función para refrescar la UI (barra flotante)
     */
    toggle(id, callbackActualizar) {
        const idStr = String(id);
        const idx = this.estado.seleccionados.indexOf(idStr);

        if (idx === -1) {
            this.estado.seleccionados.push(idStr);
        } else {
            this.estado.seleccionados.splice(idx, 1);
        }

        this._actualizarVisualFila(idStr);
        this.actualizarHeader(window.datosActualesRef || []); // Referencia global opcional
        if (callbackActualizar) callbackActualizar(this.estado.seleccionados.length);
    },

    /**
     * Selecciona o deselecciona todos los elementos visibles (filtrados)
     */
    toggleTodos(datosFiltrados, callbackActualizar) {
        const todosIds = datosFiltrados.map(item => String(item.id || item.producto_id));
        const todosSeleccionados = todosIds.length > 0 && todosIds.every(id => this.estado.seleccionados.includes(id));

        if (todosSeleccionados) {
            // Si todos estaban seleccionados, quitamos solo estos de la selección global
            this.estado.seleccionados = this.estado.seleccionados.filter(id => !todosIds.includes(id));
        } else {
            // Agregamos los que falten sin duplicar
            const nuevos = todosIds.filter(id => !this.estado.seleccionados.includes(id));
            this.estado.seleccionados.push(...nuevos);
        }

        this.sincronizarChecks();
        if (callbackActualizar) callbackActualizar(this.estado.seleccionados.length);
    },

    actualizarHeader(datosFiltrados) {
        const chkHeader = document.getElementById(this.estado.idCheckboxHeader);
        if (!chkHeader) return;

        const idsVisibles = datosFiltrados.map(p => String(p.id || p.producto_id));
        if (idsVisibles.length === 0) {
            chkHeader.checked = false;
            chkHeader.indeterminate = false;
            return;
        }

        const seleccionadosVisibles = idsVisibles.filter(id => this.estado.seleccionados.includes(id));

        chkHeader.checked = idsVisibles.length === seleccionadosVisibles.length;
        chkHeader.indeterminate = seleccionadosVisibles.length > 0 && !chkHeader.checked;
    },

    sincronizarChecks() {
        document.querySelectorAll(`.${this.estado.claseCheckboxFila}`).forEach(cb => {
            const id = String(cb.dataset.id);
            const estaSeleccionado = this.estado.seleccionados.includes(id);
            cb.checked = estaSeleccionado;
            this._actualizarVisualFila(id);
        });
    },

    _actualizarVisualFila(id) {
        const cb = document.querySelector(`.${this.estado.claseCheckboxFila}[data-id="${id}"]`);
        if (cb) {
            const fila = cb.closest('tr');
            if (fila) {
                if (this.estado.seleccionados.includes(String(id))) {
                    fila.classList.add(this.estado.claseFilaActiva);
                } else {
                    fila.classList.remove(this.estado.claseFilaActiva);
                }
            }
        }
    },

    limpiar(callbackActualizar) {
        this.estado.seleccionados = [];
        this.sincronizarChecks();
        const chkHeader = document.getElementById(this.estado.idCheckboxHeader);
        if (chkHeader) { chkHeader.checked = false; chkHeader.indeterminate = false; }
        if (callbackActualizar) callbackActualizar(0);
    }
};