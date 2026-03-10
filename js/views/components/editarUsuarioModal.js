export const editarUsuarioModal = {

    mostrar(u) {
        document.getElementById('modal-edicion-usuario')?.remove();
        document.body.appendChild(this._construir(u));
        this._animar();
    },

    cerrar() {
        const overlay = document.getElementById('modal-overlay');
        const box = document.getElementById('modal-box');
        if (!overlay || !box) return;

        overlay.classList.replace('opacity-100', 'opacity-0');
        box.classList.replace('opacity-100', 'opacity-0');
        box.classList.replace('-translate-y-1/2', '-translate-y-[calc(50%+20px)]');

        setTimeout(() => document.getElementById('modal-edicion-usuario')?.remove(), 300);
    },

    obtenerPayload() {
        const nombres  = document.getElementById('edit-nombres').value.trim();
        const paterno  = document.getElementById('edit-paterno').value.trim();
        const materno  = document.getElementById('edit-materno').value.trim();
        const ci       = document.getElementById('edit-ci').value.trim();
        const celular  = document.getElementById('edit-celular').value.trim();
        const errorEl  = document.getElementById('edit-error');

        if (!nombres || !paterno) {
            errorEl.textContent = 'El nombre y el apellido paterno son obligatorios.';
            errorEl.classList.remove('hidden');
            return null;
        }

        errorEl.classList.add('hidden');
        return { nombres, apellido_paterno: paterno, apellido_materno: materno, ci, celular };
    },

    setGuardando(activo) {
        const btn = document.getElementById('btn-guardar-edicion');
        if (!btn) return;
        btn.disabled = activo;
        btn.innerHTML = activo
            ? `<span class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span> Guardando...`
            : `<span class="material-symbols-outlined text-[18px]">save</span> Guardar Cambios`;
    },

    _animar() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.getElementById('modal-overlay')?.classList.replace('opacity-0', 'opacity-100');
                const box = document.getElementById('modal-box');
                box?.classList.replace('opacity-0', 'opacity-100');
                box?.classList.replace('-translate-y-[calc(50%+20px)]', '-translate-y-1/2');
            });
        });
    },

    _construir(u) {
        const el = document.createElement('div');
        el.id = 'modal-edicion-usuario';
        el.innerHTML = `
            <div id="modal-overlay"
                 onclick="usuarioController.cerrarModalEdicion()"
                 class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 opacity-0 transition-opacity duration-300">
            </div>

            <div id="modal-box"
                 class="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-md bg-white rounded-[32px] shadow-2xl
                        opacity-0 -translate-y-[calc(50%+20px)] transition-all duration-300 ease-out overflow-hidden">

                <div class="flex items-center justify-between px-6 py-5 bg-slate-50 border-b border-slate-100">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                            ${u.nombres.charAt(0)}${u.apellido_paterno.charAt(0)}
                        </div>
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Editando perfil</p>
                            <p class="text-slate-800 font-bold text-sm uppercase truncate max-w-[200px]">
                                ${u.nombres} ${u.apellido_paterno}
                            </p>
                        </div>
                    </div>
                    <button onclick="usuarioController.cerrarModalEdicion()"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-slate-100 transition-all shadow-sm">
                        <span class="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div class="px-6 py-6 space-y-5">
                    <div class="space-y-1">
                        <label class="text-[10px] font-black text-slate-400 uppercase ml-1">Correo Electrónico</label>
                        <div class="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
                            <span class="material-symbols-outlined text-slate-400 text-[18px]">mail</span>
                            <span class="text-slate-500 text-sm font-medium truncate">${u.correo_electronico}</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="flex-1 h-px bg-slate-100"></div>
                        <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Datos personales</span>
                        <div class="flex-1 h-px bg-slate-100"></div>
                    </div>

                    <div class="space-y-1">
                        <label for="edit-nombres" class="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre(s)</label>
                        <input id="edit-nombres" type="text" value="${u.nombres || ''}" placeholder="Ej. Juan Carlos"
                               class="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all">
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label for="edit-paterno" class="text-[10px] font-black text-slate-400 uppercase ml-1">Ap. Paterno</label>
                            <input id="edit-paterno" type="text" value="${u.apellido_paterno || ''}" placeholder="Ej. García"
                                   class="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all">
                        </div>
                        <div class="space-y-1">
                            <label for="edit-materno" class="text-[10px] font-black text-slate-400 uppercase ml-1">Ap. Materno</label>
                            <input id="edit-materno" type="text" value="${u.apellido_materno || ''}" placeholder="Ej. López"
                                   class="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all">
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <div class="flex-1 h-px bg-slate-100"></div>
                        <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Contacto</span>
                        <div class="flex-1 h-px bg-slate-100"></div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="space-y-1">
                            <label for="edit-ci" class="text-[10px] font-black text-slate-400 uppercase ml-1">C.I.</label>
                            <input id="edit-ci" type="text" value="${u.ci || ''}" placeholder="Ej. 1234567 LP"
                                   class="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all">
                        </div>
                        <div class="space-y-1">
                            <label for="edit-celular" class="text-[10px] font-black text-slate-400 uppercase ml-1">Celular</label>
                            <input id="edit-celular" type="tel" value="${u.celular || ''}" placeholder="Ej. 70712345"
                                   class="w-full bg-white border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all">
                        </div>
                    </div>

                    <p id="edit-error" class="hidden text-red-500 text-xs font-bold bg-red-50 border border-red-100 rounded-xl px-4 py-2.5"></p>
                </div>

                <div class="px-6 pb-6 flex gap-3">
                    <button onclick="usuarioController.cerrarModalEdicion()"
                            class="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">
                        Cancelar
                    </button>
                    <button id="btn-guardar-edicion"
                            onclick="usuarioController.guardarEdicion('${u.id}')"
                            class="flex-1 py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">save</span>
                        Guardar Cambios
                    </button>
                </div>
            </div>
        `;
        return el;
    }
};