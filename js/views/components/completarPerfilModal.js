export const completarPerfilModal = {

    async mostrar(datosSugeridos) {
        // SweetAlert de carga
        Swal.fire({
            title: '<span class="text-slate-800 font-black uppercase text-sm">Preparando tu perfil</span>',
            text: 'Un momento por favor...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => Swal.showLoading(),
            customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
        });

        await new Promise(r => setTimeout(r, 800));
        Swal.close();

        const { value: formValues } = await Swal.fire({
            title: '',
            html: `
                <div class="text-left">

                    <!-- Header -->
                    <div class="bg-gradient-to-br from-blue-600 to-blue-700 rounded-[24px] p-6 mb-6 text-white relative overflow-hidden">
                        <div class="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div class="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                        <div class="relative z-10 flex items-center gap-4">
                            <div class="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center shadow-lg border border-white/30">
                                <span class="material-symbols-outlined text-[28px]">person</span>
                            </div>
                            <div>
                                <p class="text-blue-100 text-[10px] font-black uppercase tracking-widest mb-0.5">Primer acceso</p>
                                <p class="text-white font-black text-lg leading-tight">Bienvenido</p>
                                <p class="text-blue-200 text-xs">Completa tu perfil para activar tu cuenta</p>
                            </div>
                        </div>
                    </div>

                    <!-- Pasos -->
                    <div class="flex items-center justify-center gap-2 mb-6">
                        <div class="flex items-center gap-1.5">
                            <div class="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</div>
                            <span class="text-[10px] font-bold text-blue-600 uppercase">Identidad</span>
                        </div>
                        <div class="w-8 h-px bg-slate-200"></div>
                        <div class="flex items-center gap-1.5">
                            <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black">2</div>
                            <span class="text-[10px] font-bold text-slate-400 uppercase">Contacto</span>
                        </div>
                    </div>

                    <div class="space-y-4 px-1">

                        <!-- Nombres -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[13px]">badge</span>
                                Nombre(s)
                            </label>
                            <div class="relative">
                                <input id="onboard-nombres"
                                       class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all"
                                       placeholder="Ej. Juan Carlos"
                                       value="${datosSugeridos.nombres || ''}">
                                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px] pointer-events-none">edit</span>
                            </div>
                        </div>

                        <!-- Apellidos -->
                        <div class="grid grid-cols-2 gap-3">
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Ap. Paterno</label>
                                <input id="onboard-paterno"
                                       class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all"
                                       placeholder="Ej. García"
                                       value="${datosSugeridos.apellido_paterno || ''}">
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">Ap. Materno</label>
                                <input id="onboard-materno"
                                       class="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all"
                                       placeholder="Ej. López"
                                       value="${datosSugeridos.apellido_materno || ''}">
                            </div>
                        </div>

                        <!-- Divider -->
                        <div class="flex items-center gap-3 py-1">
                            <div class="flex-1 h-px bg-slate-100"></div>
                            <span class="text-[10px] font-black text-slate-300 uppercase tracking-widest">Contacto</span>
                            <div class="flex-1 h-px bg-slate-100"></div>
                        </div>

                        <!-- CI -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[13px]">id_card</span>
                                Cédula de Identidad (C.I.)
                            </label>
                            <div class="relative">
                                <input id="onboard-ci"
                                       class="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all shadow-sm"
                                       placeholder="Ej. 1234567 LP">
                                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px] pointer-events-none">pin</span>
                            </div>
                        </div>

                        <!-- Celular -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[13px]">smartphone</span>
                                Celular / WhatsApp
                            </label>
                            <div class="relative">
                                <input id="onboard-celular" type="tel"
                                       class="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-400 transition-all shadow-sm"
                                       placeholder="Ej. 70712345">
                                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 text-[18px] pointer-events-none">call</span>
                            </div>
                        </div>

                        <!-- Nota -->
                        <div class="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
                            <span class="material-symbols-outlined text-blue-400 text-[16px] mt-0.5 pointer-events-none">info</span>
                            <p class="text-[11px] text-blue-500 font-medium leading-relaxed">
                                Tus datos están protegidos y solo serán usados para identificarte en el sistema.
                            </p>
                        </div>
                    </div>
                </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showCancelButton: false,
            confirmButtonText: `
                <span class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px] pointer-events-none">verified_user</span>
                    ACTIVAR MI CUENTA
                </span>
            `,
            confirmButtonColor: '#2563eb',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl w-[90%] max-w-md',
                confirmButton: 'rounded-2xl px-8 py-3.5 font-black text-sm w-full transition-all hover:scale-[1.02] hover:shadow-lg'
            },
            preConfirm: () => {
                const nombres = document.getElementById('onboard-nombres').value.trim();
                const paterno = document.getElementById('onboard-paterno').value.trim();
                const ci      = document.getElementById('onboard-ci').value.trim();
                const celular = document.getElementById('onboard-celular').value.trim();

                if (!nombres) { Swal.showValidationMessage('El nombre es obligatorio'); return false; }
                if (!paterno) { Swal.showValidationMessage('El apellido paterno es obligatorio'); return false; }
                if (!ci)      { Swal.showValidationMessage('La cédula de identidad es obligatoria'); return false; }
                if (!celular) { Swal.showValidationMessage('El número de celular es obligatorio'); return false; }

                return {
                    nombres,
                    apellido_paterno: paterno,
                    apellido_materno: document.getElementById('onboard-materno').value.trim(),
                    ci,
                    celular
                };
            }
        });

        return formValues || null;
    }
};