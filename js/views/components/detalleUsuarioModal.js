export const detalleUsuarioModal = {

    mostrar(u) {
        document.getElementById('modal-detalle-usuario')?.remove();
        document.body.appendChild(this._construir(u));
        this._animar();
    },

    cerrar() {
        const overlay = document.getElementById('detalle-overlay');
        const box = document.getElementById('detalle-box');
        if (!overlay || !box) return;

        overlay.classList.replace('opacity-100', 'opacity-0');
        box.classList.replace('opacity-100', 'opacity-0');
        box.classList.replace('-translate-y-1/2', '-translate-y-[calc(50%+20px)]');

        setTimeout(() => document.getElementById('modal-detalle-usuario')?.remove(), 300);
    },

    _animar() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                document.getElementById('detalle-overlay')?.classList.replace('opacity-0', 'opacity-100');
                const box = document.getElementById('detalle-box');
                box?.classList.replace('opacity-0', 'opacity-100');
                box?.classList.replace('-translate-y-[calc(50%+20px)]', '-translate-y-1/2');
            });
        });
    },

    _construir(u) {
        const el = document.createElement('div');
        el.id = 'modal-detalle-usuario';
        el.innerHTML = `
            <!-- Overlay -->
            <div id="detalle-overlay"
                 onclick="detalleUsuarioModal.cerrar()"
                 class="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 opacity-0 transition-opacity duration-300">
            </div>

            <!-- Modal -->
            <div id="detalle-box"
                    class="fixed top-1/2 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-lg bg-white rounded-[32px] shadow-2xl
                        opacity-0 -translate-y-[calc(50%+20px)] transition-all duration-300 ease-out overflow-hidden">

                <!-- Header -->
                <div class="bg-gradient-to-br from-slate-800 to-slate-900 p-6 relative overflow-hidden">
                    <div class="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div class="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

                    <!-- Botón cerrar -->
                       <button onclick="detalleUsuarioModal.cerrar()"
                           class="absolute top-4 right-4 z-[100] w-11 h-11 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/25 active:bg-white/30 text-white/80 hover:text-white transition-all border border-white/10 hover:border-white/20 cursor-pointer">
                           <span class="material-symbols-outlined text-[22px] select-none pointer-events-none">close</span>
                       </button>

                    <div class="relative z-10 flex items-center gap-4">
                        <div class="w-16 h-16 rounded-2xl bg-blue-500/20 border border-blue-400/30 text-blue-300 flex items-center justify-center text-2xl font-black shadow-lg">
                            ${u.nombres[0]}${u.apellido_paterno[0]}
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-0.5">Perfil de Usuario</p>
                            <p class="text-white font-black text-base uppercase leading-tight truncate">
                                ${u.nombres} ${u.apellido_paterno} ${u.apellido_materno || ''}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Body -->
                <div class="p-6 space-y-3">

                    <!-- Correo -->
                    <div class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div class="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-[18px]">mail</span>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</p>
                            <p class="text-slate-700 font-bold text-sm truncate">${u.correo_electronico}</p>
                        </div>
                    </div>

                    <!-- CI y Celular -->
                    <div class="grid grid-cols-2 gap-3">
                        <div class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div class="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-[18px]">id_card</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">C.I.</p>
                                <p class="text-slate-700 font-bold text-sm">${u.ci || '---'}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                            <div class="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center flex-shrink-0">
                                <span class="material-symbols-outlined text-[18px]">smartphone</span>
                            </div>
                            <div>
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Celular</p>
                                <p class="text-slate-700 font-bold text-sm">${u.celular || '---'}</p>
                            </div>
                        </div>
                    </div>

                    ${u.rol === 'supervisor' ? `
                    <!-- Sucursal -->
                    <div class="flex items-center gap-3 p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                        <div class="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center flex-shrink-0">
                            <span class="material-symbols-outlined text-[18px]">store</span>
                        </div>
                        <div class="min-w-0 flex-1">
                            <p class="text-[10px] font-black text-violet-400 uppercase tracking-widest">Sucursal Asignada</p>
                            <p class="text-violet-700 font-bold text-sm">${u.sucursal?.nombre || 'Sin sucursal asignada'}</p>
                        </div>
                    </div>` : ''}
                </div>

                <!-- Footer -->
                <div class="px-6 pb-6 flex gap-3">
                    <button onclick="detalleUsuarioModal.cerrar()"
                            class="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-all">
                        Cerrar
                    </button>
                    <button onclick="usuarioController.editarDesdeDetalle('${u.id}')"
                            class="flex-1 py-3 rounded-2xl bg-black hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2">
                        <span class="material-symbols-outlined text-[18px]">edit</span>
                        Editar Perfil
                    </button>
                </div>
            </div>
        `;
        return el;
    }
};

window.detalleUsuarioModal = detalleUsuarioModal;