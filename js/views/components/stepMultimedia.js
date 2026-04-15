/**
 * stepMultimedia.js
 * Paso 3 del formulario de producto
 * Responsabilidad: Renderizar portada y galería multimedia
 */

export const stepMultimedia = {
    render(portadaUrl, galeriaHtml) {
        return `
        <div class="space-y-8">

            <div>
                <label class="text-[10px] font-black uppercase text-slate-400 ml-1 mb-2 block">
                    Portada del Producto
                </label>
                <div class="relative group aspect-video bg-slate-50 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-slate-200 flex items-center justify-center transition-all">
                    ${portadaUrl
                        ? `<img src="${portadaUrl}" class="w-full h-full object-cover">`
                        : `<div class="flex flex-col items-center gap-2 text-slate-300">
                            <span class="material-symbols-outlined text-6xl">add_photo_alternate</span>
                            <p class="text-[10px] font-black uppercase">Sin portada</p>
                        </div>`
                    }
                    
                    <div class="absolute inset-0 bg-slate-900/70 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">

                        <div class="group/tip relative">
                            <button onclick="window.productManager.cambiarPortada('local')"
                                    class="p-3 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all">
                                <span class="material-symbols-outlined">upload_file</span>
                            </button>
                            <span class="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                        bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                Subir archivo
                                <i class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></i>
                            </span>
                        </div>

                        <div class="group/tip relative">
                            <button onclick="window.productManager.cambiarPortada('camera')"
                                    class="p-3 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all">
                                <span class="material-symbols-outlined">photo_camera</span>
                            </button>
                            <span class="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                        bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                Usar cámara
                                <i class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></i>
                            </span>
                        </div>

                        <div class="group/tip relative">
                            <button onclick="window.productManager.cambiarPortada('url')"
                                    class="p-3 bg-white rounded-full text-slate-900 hover:text-blue-600 transition-all">
                                <span class="material-symbols-outlined">link</span>
                            </button>
                            <span class="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                        bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                Pegar URL
                                <i class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></i>
                            </span>
                        </div>

                        ${portadaUrl ? `
                        <div class="group/tip relative">
                            <button onclick="window.productManager.verPreviewAmpliado('${portadaUrl}', 'imagen')"
                                    class="p-3 bg-white rounded-full text-slate-900 hover:text-indigo-600 transition-all">
                                <span class="material-symbols-outlined">visibility</span>
                            </button>
                            <span class="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                        bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
                                Previsualizar
                                <i class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></i>
                            </span>
                        </div>` : ''}

                    </div>
                </div>
            </div>

            <div>
                <div class="flex items-center justify-between mb-3">
                    <label class="text-[10px] font-black uppercase text-slate-400 ml-1">
                        Galería Multimedia
                    </label>
                    <button onclick="window.productManager.addGaleriaManual()"
                            class="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">
                        <span class="material-symbols-outlined text-sm">add</span> Agregar
                    </button>
                </div>
                <div class="space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                    ${galeriaHtml}
                </div>
            </div>

        </div>`;
    }
};