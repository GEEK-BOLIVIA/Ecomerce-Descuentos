import { MediaHelper } from '../utils/mediaHelper.js';

export const detallesProductoView = {
    _galeriaReferencia: [],
    _itemActivo: null,

    _cambiarRecursoPrincipal(url, tipo) {
        this._itemActivo = url;
        const visor = document.getElementById('main-visor-container');
        if (!visor) return;

        const info = MediaHelper.obtenerInfoVideo(url, null, this._galeriaReferencia);
        const contenido = (info.tipo !== 'imagen')
            ? `<div class="w-full h-full flex items-center justify-center bg-slate-950">
                   ${MediaHelper.renderVideoPlayer(url, this._galeriaReferencia)}
               </div>`
            : `<img src="${url}" class="w-full h-full object-contain">`;

        visor.innerHTML = `
            ${contenido}
            <button onclick="window.detallesProductoView._verPreview('${url}', '${info.tipo}')"
                    class="absolute bottom-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur
                           hover:bg-slate-900 hover:text-white text-slate-700 rounded-full shadow-lg
                           transition-all flex items-center justify-center">
                <span class="material-symbols-outlined text-lg">fullscreen</span>
            </button>`;

        this._actualizarEstadoThumbs(url);
    },

    _actualizarEstadoThumbs(url) {
        document.querySelectorAll('.thumb-item').forEach(el => {
            const activo = el.dataset.url === url;
            el.classList.toggle('ring-2', activo);
            el.classList.toggle('ring-blue-500', activo);
            el.classList.toggle('opacity-100', activo);
            el.classList.toggle('opacity-40', !activo);
        });
    },

    _verPreview(url, tipo) {
        MediaHelper.verPreviewAmpliado(url, tipo, this._galeriaReferencia);
    },

    // ─────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────
    render(datos, onEdit, onVolver) {
        const { producto, categorias = [], galeria = [], sucursales = [] } = datos;
        if (!producto) return `<div class="p-20 text-center text-slate-400 font-bold uppercase text-sm">Error al cargar datos</div>`;

        const nombre = producto.nombre || 'Sin nombre';
        const portadaUrl = producto.imagen_url || producto.portada || '';

        // ── FIX DUPLICADO: construir galería sin repetir la portada ──
        const galeriaFiltrada = (galeria || []).filter(item => {
            const urlItem = item.url || item.file_url || '';
            return urlItem !== portadaUrl;
        });

        this._galeriaReferencia = [
            ...(portadaUrl ? [{ url: portadaUrl, tipo: 'imagen' }] : []),
            ...galeriaFiltrada
        ];
        this._itemActivo = portadaUrl || this._galeriaReferencia[0]?.url || '';

        // ── Thumbnails ──
        const htmlThumbs = this._galeriaReferencia.map(item => {
            const url = item.url || item.file_url;
            const info = MediaHelper.obtenerInfoVideo(url, null, this._galeriaReferencia);
            const activo = url === this._itemActivo;
            return `
            <div onclick="window.detallesProductoView._cambiarRecursoPrincipal('${url}', '${info.tipo}')"
                 data-url="${url}"
                 class="thumb-item relative flex-shrink-0 w-16 h-16 rounded-2xl overflow-hidden
                        border-2 transition-all cursor-pointer bg-slate-100
                        ${activo
                    ? 'border-blue-500 ring-2 ring-blue-500 opacity-100'
                    : 'border-slate-200 opacity-40 hover:opacity-80'}">
                <img src="${info.thumb || url}" class="w-full h-full object-cover">
                ${info.tipo !== 'imagen'
                    ? `<div class="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                           <span class="material-symbols-outlined text-sm">play_circle</span>
                       </div>`
                    : ''}
            </div>`;
        }).join('');

        // ── Tabla de sucursales ──
        const htmlSucursales = sucursales.length === 0
            ? `<p class="text-[11px] text-slate-400 italic px-1">Sin sucursales asignadas</p>`
            : `<div class="rounded-2xl border border-slate-200 overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50 border-b border-slate-200">
                            <th class="px-4 py-3 text-[9px] font-black uppercase text-slate-400">Sucursal</th>
                            <th class="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-right">Precio</th>
                            <th class="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Stock</th>
                            <th class="px-4 py-3 text-[9px] font-black uppercase text-slate-400 text-center">Estado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        ${sucursales.map(s => {
                const stock = parseInt(s.stock) || 0;
                const stockColor = stock === 0 ? 'text-red-500' : stock <= 5 ? 'text-amber-500' : 'text-emerald-600';
                const stockLabel = stock === 0 ? 'Agotado' : stock <= 5 ? 'Bajo' : 'Disponible';
                const stockBg = stock === 0 ? 'bg-red-50 border-red-100' : stock <= 5 ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100';
                return `
                            <tr class="hover:bg-slate-50/60 transition-colors">
                                <td class="px-4 py-3">
                                    <div class="flex items-center gap-2">
                                        <span class="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0"></span>
                                        <span class="text-[11px] font-black text-slate-700 uppercase">${s.nombre}</span>
                                    </div>
                                </td>
                                <td class="px-4 py-3 text-right">
                                    <span class="text-[12px] font-black text-slate-800">Bs. ${parseFloat(s.precio || 0).toFixed(2)}</span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="text-[12px] font-black ${stockColor}">${stock} uds</span>
                                </td>
                                <td class="px-4 py-3 text-center">
                                    <span class="inline-flex items-center px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${stockBg} ${stockColor}">
                                        ${stockLabel}
                                    </span>
                                </td>
                            </tr>`;
            }).join('')}
                    </tbody>
                </table>
               </div>`;

        // ── Categorías con jerarquía padre/hija ──
        const htmlCategorias = (() => {
            if (categorias.length === 0)
                return `<span class="text-slate-400 text-xs italic">Sin categorías asignadas</span>`;

            const padres = categorias.filter(c => !c.id_padre);
            const hijas = categorias.filter(c => c.id_padre);
            const hijasSueltas = hijas.filter(h => !padres.some(p => p.id === h.id_padre));

            let html = '';

            // Padres con sus hijas debajo
            padres.forEach(padre => {
                const hijasDelPadre = hijas.filter(h => h.id_padre === padre.id);
                html += `
                <div class="flex flex-col gap-2">
                    <span class="inline-flex items-center gap-1.5 px-3 py-1.5
                                 bg-blue-50 border border-blue-200 text-blue-700
                                 rounded-xl text-[10px] font-black uppercase w-fit shadow-sm">
                        <span class="material-symbols-outlined text-[13px]">folder</span>
                        ${padre.nombre}
                    </span>
                    ${hijasDelPadre.length > 0 ? `
                    <div class="flex flex-wrap gap-2 pl-5 border-l-2 border-blue-100 ml-1">
                        ${hijasDelPadre.map(h => `
                            <span class="inline-flex items-center gap-1.5 px-3 py-1.5
                                         bg-slate-50 border border-slate-200 text-slate-600
                                         rounded-xl text-[10px] font-black uppercase">
                                <span class="material-symbols-outlined text-[13px] text-blue-400">subdirectory_arrow_right</span>
                                ${h.nombre}
                            </span>`).join('')}
                    </div>` : ''}
                </div>`;
            });

            // Hijas sueltas (su padre no está vinculado al producto)
            if (hijasSueltas.length > 0) {
                html += `
                <div class="flex flex-wrap gap-2">
                    ${hijasSueltas.map(h => `
                        <span class="inline-flex items-center gap-1.5 px-3 py-1.5
                                     bg-slate-50 border border-slate-200 text-slate-600
                                     rounded-xl text-[10px] font-black uppercase">
                            <span class="material-symbols-outlined text-[13px] text-slate-400">label</span>
                            ${h.nombre}
                        </span>`).join('')}
                </div>`;
            }

            return `<div class="flex flex-col gap-4">${html}</div>`;
        })();

        // ── Badges de estado ──
        const badgeWS = producto.habilitar_whatsapp
            ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase">
                   <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> WhatsApp Activo
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase">
                   <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span> WhatsApp Inactivo
               </span>`;

        const badgePrecio = producto.mostrar_precio
            ? `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[13px]">visibility</span> Precio Público
               </span>`
            : `<span class="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-[10px] font-black uppercase">
                   <span class="material-symbols-outlined text-[13px]">visibility_off</span> Precio Oculto
               </span>`;

        // ── Stock total ──
        const stockTotal = sucursales.reduce((acc, s) => acc + (parseInt(s.stock) || 0), 0);

        return `
        <div class="w-full h-full bg-slate-50 overflow-y-auto custom-scrollbar">

            <!-- Header sticky -->
            <div class="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 shadow-sm">
                <div class="max-w-[1200px] mx-auto flex items-center justify-between gap-4">
                    <div class="flex items-center gap-3">
                        <button id="btnVolverListado"
                                class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100
                                       hover:bg-slate-200 text-slate-600 transition-all">
                            <span class="material-symbols-outlined text-lg">arrow_back</span>
                        </button>
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detalle del Producto</p>
                            <h1 class="text-lg font-black text-slate-800 leading-tight">${nombre}</h1>
                        </div>
                    </div>
                    <button id="btnEditarProductoMain"
                            class="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700
                                   text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                                   transition-all shadow-md active:scale-95">
                        <span class="material-symbols-outlined text-base">edit_square</span>
                        Editar Producto
                    </button>
                </div>
            </div>

            <!-- Contenido -->
            <div class="max-w-[1200px] mx-auto p-6 space-y-6">

                <!-- Fila superior: Visor + Info básica -->
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <!-- Visor multimedia -->
                    <div class="lg:col-span-5 space-y-3">
                        <div id="main-visor-container"
                             class="aspect-square w-full rounded-3xl overflow-hidden bg-white
                                    shadow-xl border border-slate-200 relative flex items-center justify-center">
                            ${this._itemActivo
                ? `<img src="${this._itemActivo}" class="w-full h-full object-contain">
                                   <button onclick="window.detallesProductoView._verPreview('${this._itemActivo}', 'imagen')"
                                           class="absolute bottom-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur
                                                  hover:bg-slate-900 hover:text-white text-slate-700 rounded-full
                                                  shadow-lg transition-all flex items-center justify-center">
                                       <span class="material-symbols-outlined text-lg">fullscreen</span>
                                   </button>`
                : `<span class="material-symbols-outlined text-6xl text-slate-200">image_not_supported</span>`
            }
                        </div>

                        <!-- Thumbnails -->
                        ${this._galeriaReferencia.length > 1 ? `
                        <div class="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                            ${htmlThumbs}
                        </div>` : ''}
                    </div>

                    <!-- Info básica -->
                    <div class="lg:col-span-7 space-y-5">

                        <!-- Nombre, badges y descripción -->
                        <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                            <h2 class="text-2xl font-black text-slate-900 leading-tight">${nombre}</h2>

                            <div class="flex flex-wrap gap-2">
                                ${badgeWS}
                                ${badgePrecio}
                            </div>

                            <div class="pt-3 border-t border-slate-100">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción</p>
                                <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    ${producto.descripcion || 'Sin descripción registrada.'}
                                </p>
                            </div>
                        </div>

                        <!-- Stock y precio resumen -->
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Stock Total</p>
                                <p class="text-3xl font-black ${stockTotal === 0 ? 'text-red-500' : stockTotal <= 10 ? 'text-amber-500' : 'text-slate-900'}">
                                    ${stockTotal}
                                    <span class="text-sm font-bold text-slate-400">uds</span>
                                </p>
                                <p class="text-[9px] text-slate-400 mt-1">
                                    ${sucursales.length} sede${sucursales.length !== 1 ? 's' : ''} asignada${sucursales.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Precio Base</p>
                                <p class="text-3xl font-black text-slate-900">
                                    ${sucursales.length > 0
                ? `Bs. ${parseFloat(sucursales[0].precio || 0).toFixed(2)}`
                : '—'}
                                </p>
                                ${sucursales.length > 1
                ? `<p class="text-[9px] text-slate-400 mt-1">varía por sucursal</p>`
                : ''}
                            </div>
                        </div>

                    </div>
                </div>

                <!-- Tabla de sucursales -->
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-blue-500 text-xl">storefront</span>
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidad</p>
                            <h3 class="text-sm font-black text-slate-800">Precio y Stock por Sucursal</h3>
                        </div>
                    </div>
                    ${htmlSucursales}
                </div>

                <!-- Categorías con jerarquía -->
                <div class="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-indigo-500 text-xl">account_tree</span>
                        <div>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clasificación</p>
                            <h3 class="text-sm font-black text-slate-800">Categorías del Producto</h3>
                        </div>
                    </div>
                    ${htmlCategorias}
                </div>

            </div>
        </div>`;
    },

    initEventListeners(producto, onEdit, onVolver) {
        document.getElementById('btnEditarProductoMain')?.addEventListener('click', () => onEdit(producto));
        document.getElementById('btnVolverListado')?.addEventListener('click', () => onVolver());
        window.detallesProductoView = this;
    }
};