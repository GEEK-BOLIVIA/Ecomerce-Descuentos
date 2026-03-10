export const configuracionColumnasView = {

    /**
     * PASO 1: Selección de Rol
     */
    async solicitarSeleccionRol(roles) {
        const opcionesRoles = {};
        roles.forEach(r => opcionesRoles[r] = `GRUPO: ${r.toUpperCase()}`);

        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Paso 1: Grupo Base</span>',
            input: 'select',
            inputOptions: opcionesRoles,
            inputPlaceholder: '-- SELECCIONE UN ROL --',
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Siguiente',
            cancelButtonText: 'Cancelar',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-blue-600',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
                input: 'rounded-2xl border-slate-200 text-sm font-semibold p-4',
            }
        });
        return result.isConfirmed ? result.value : null;
    },

    /**
     * PASO 2: Búsqueda de Usuario (CORREGIDO)
     */
    async solicitarBusquedaUsuario(rolNombre, usuariosDelRol) {
        const dataSelect = usuariosDelRol.map(u => ({
            id: u.ci,
            text: `${u.ci} - ${u.apellido_paterno} ${u.nombres}`
        }));

        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-[15px] tracking-tight">Paso 2: Buscar Usuario</span>',
            html: `
                <div class="text-left animate-fade-in">
                    <p class="text-[11px] font-bold text-slate-400 uppercase mb-5 tracking-widest text-center">
                        Configurando para: <span class="text-blue-600">${rolNombre.toUpperCase()}</span>
                    </p>
                    
                    <div class="bg-slate-50 p-6 rounded-[28px] border border-slate-100" style="overflow: visible !important;">
                        <label class="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest ml-1">Seleccione por CI o Nombre</label>
                        
                        <div class="relative w-full mb-2">
                            <select id="swal-select-user" class="w-full"></select>
                        </div>

                        <div class="flex items-start gap-3 mt-6 p-4 bg-blue-50/60 rounded-2xl border border-blue-100/50">
                            <span class="material-symbols-outlined text-blue-500 text-[20px] leading-none mt-0.5">info</span>
                            <p class="text-[11px] text-slate-500 leading-relaxed font-medium">
                                Deje el buscador vacío y presione siguiente si desea aplicar la configuración a <b class="text-blue-700">TODOS</b> los usuarios del grupo.
                            </p>
                        </div>
                    </div>
                </div>`,
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Siguiente',
            cancelButtonText: 'Volver',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl overflow-visible',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-blue-600',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
                htmlContainer: 'overflow-visible'
            },
            didOpen: () => {
                const $select = $('#swal-select-user');

                $select.select2({
                    data: dataSelect,
                    placeholder: "Escriba para buscar...",
                    allowClear: true,
                    width: '100%',
                    dropdownParent: Swal.getPopup()
                });

                // Limpiar selección inicial para que no aparezca un usuario por defecto
                $select.val(null).trigger('change');

                // ESTILOS INYECTADOS CORREGIDOS
                $('.select2-container--default .select2-selection--single').attr('style', `
                    height: 56px !important;
                    padding: 12px !important;
                    border-radius: 18px !important;
                    border: 1px solid #e2e8f0 !important;
                    background-color: white !important;
                    display: flex !important;
                    align-items: center !important;
                    box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05) !important;
                `);

                $('.select2-selection__rendered').attr('style', `
                    font-weight: 600 !important;
                    color: #1e293b !important;
                    font-size: 14px !important;
                    padding-left: 10px !important;
                `);

                $('.select2-selection__arrow').attr('style', 'height: 54px !important; right: 12px !important; display: flex !important; align-items: center !important;');

                // Forzar Z-INDEX del dropdown para que se vea sobre todo
                $select.on('select2:open', () => {
                    $('.select2-dropdown').attr('style', `
                        z-index: 999999 !important;
                        border-radius: 18px !important;
                        border: 1px solid #f1f5f9 !important;
                        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1) !important;
                        padding: 6px !important;
                        background: white !important;
                    `);
                    $('.select2-results__option').attr('style', 'padding: 12px 16px !important; border-radius: 12px !important; font-size: 13px !important; font-weight: 500 !important; margin-bottom: 2px !important;');
                });
            },
            preConfirm: () => {
                return $('#swal-select-user').val() || "";
            }
        });

        if (result.isConfirmed) return result.value;
        if (result.dismiss === Swal.DismissReason.cancel) return 'BACK';
        return null;
    },

    /**
     * PASO 3: Selección de Columnas
     */
    /**
 * PASO 3: Selección de Columnas (CORREGIDO)
 */
    async solicitarConfiguracionColumnas(todas, actuales, destinoNombre) {
        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm tracking-widest">Paso 3: Visibilidad</span>',
            html: `
            <div class="text-left mb-5 flex justify-center">
                <div class="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                    <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span class="text-[10px] text-emerald-700 font-black uppercase tracking-wider">${destinoNombre}</span>
                </div>
            </div>
            <div id="columnas-container" class="grid grid-cols-2 gap-3 p-4 border border-slate-100 rounded-[28px] bg-slate-50/50 max-h-80 overflow-y-auto text-left">
               ${todas.map(col => {
                const estaMarcada = actuales.map(a => a.trim()).includes(col.trim());
                return `
                        <label class="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-2xl cursor-pointer hover:bg-blue-50 transition-colors">
                            <input type="checkbox" value="${col}" 
                                ${estaMarcada ? 'checked' : ''} 
                                class="col-check w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                            <span class="text-xs font-semibold text-slate-700 uppercase">${col.replace(/_/g, ' ')}</span>
                        </label>
                    `;
            }).join('')}
            </div>`,
            showCloseButton: true,
            showCancelButton: true,
            confirmButtonText: 'Siguiente',
            cancelButtonText: 'Atrás',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[600px]',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-blue-600',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
            },
            preConfirm: () => {
                // RECOLECTAR CHECKBOXES:
                const seleccionadas = Array.from(document.querySelectorAll('.col-check:checked'))
                    .map(el => el.value);
                if (seleccionadas.length === 0) {
                    Swal.showValidationMessage('Debe seleccionar al menos una columna');
                    return false;
                }
                return seleccionadas;
            }
        });

        if (result.isConfirmed) return result.value; // Ahora sí devuelve el array de strings
        if (result.dismiss === Swal.DismissReason.cancel) return 'BACK';
        return null;
    },
    /**
     * PASO 4: Confirmación Final
     */
    async confirmarGuardadoFinal(nombre) {
        const result = await Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">¿Aplicar Diseño?</span>',
            text: `Confirmar cambios para: ${nombre.toUpperCase()}`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, aplicar',
            cancelButtonText: 'Volver',
            confirmButtonColor: '#10b981',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-[32px] border-none shadow-xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-xs uppercase bg-slate-100 text-slate-500',
            }
        });

        if (result.isConfirmed) return true;
        if (result.dismiss === Swal.DismissReason.cancel) return 'BACK';
        return false;
    },

    mostrarCargando(msg = 'Procesando...') {
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Espere</span>',
            text: msg,
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px]' }
        });
    },

    notificarExito(msg) {
        Swal.fire({ icon: 'success', title: 'Hecho', text: msg, timer: 2000, showConfirmButton: false, customClass: { popup: 'rounded-[32px]' } });
    },

    notificarError(msg) {
        Swal.fire({ icon: 'error', title: 'Error', text: msg, customClass: { popup: 'rounded-[32px]' } });
    }
};