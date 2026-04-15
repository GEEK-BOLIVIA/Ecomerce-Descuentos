/**
 * Utility for Media Processing (Images & Videos)
 * Centraliza la lógica de detección y renderizado de multimedia del Nexus Admin Suite.
 */

export const MediaHelper = {

    obtenerInfoVideo(url, file = null, galeriaReferencia = []) {
        if (file && file instanceof File) {
            const esVideo = file.type.startsWith('video/');
            const blobUrl = URL.createObjectURL(file);
            return { tipo: esVideo ? 'video' : 'imagen', esArchivo: esVideo, thumb: esVideo ? 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png' : blobUrl, url: blobUrl };
        }
        if (!url) return { tipo: 'imagen', thumb: '', esArchivo: false };
        const urlStr = String(url);
        if (urlStr.startsWith('blob:')) {
            const item = galeriaReferencia.find(i => i.url === urlStr);
            if (item?.tipo === 'video') return { tipo: 'video', esArchivo: true, thumb: 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png', url: urlStr };
            return { tipo: 'video', esArchivo: true, thumb: 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png', url: urlStr };
        }
        if (urlStr.match(/\.(mp4|webm|ogg|mov|m4v)($|\?)/i))
            return { tipo: 'video', esArchivo: true, thumb: 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png', url: urlStr };
        const ytMatch = urlStr.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch) return { tipo: 'youtube', id: ytMatch[1], thumb: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`, url: urlStr };
        if (urlStr.includes('facebook.com') || urlStr.includes('fb.watch')) return { tipo: 'facebook', thumb: 'https://cdn-icons-png.flaticon.com/512/124/124010.png', url: urlStr };
        if (urlStr.includes('instagram.com')) return { tipo: 'instagram', thumb: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', url: urlStr };
        if (urlStr.includes('tiktok.com')) { const tkId = urlStr.split('/video/')[1]?.split('?')[0]; return { tipo: 'tiktok', id: tkId, thumb: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', url: urlStr }; }
        return { tipo: 'imagen', thumb: urlStr, url: urlStr, esArchivo: false };
    },

    renderVideoPlayer(url, galeriaReferencia = []) {
        if (!url) return `<div style="padding:40px;text-align:center;color:#94a3b8;">URL no válida</div>`;
        const info = this.obtenerInfoVideo(url, null, galeriaReferencia);
        if (info.esArchivo || url.startsWith('blob:'))
            return `<video src="${url}" controls autoplay style="width:100%;height:100%;object-fit:contain;background:#000;"></video>`;
        let iframeSrc = '', aspect = '56.25%';
        switch (info.tipo) {
            case 'youtube': iframeSrc = `https://www.youtube.com/embed/${info.id}?autoplay=1&rel=0`; break;
            case 'facebook': iframeSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`; aspect = '75%'; break;
            case 'instagram': iframeSrc = url.split('?')[0].replace(/\/$/, '') + '/embed'; aspect = '125%'; break;
            case 'tiktok': if (info.id) { iframeSrc = `https://www.tiktok.com/embed/v2/${info.id}`; aspect = '177%'; } break;
        }
        if (iframeSrc) return `<div style="position:relative;width:100%;padding-top:${aspect};background:#000;"><iframe src="${iframeSrc}" style="position:absolute;top:0;left:0;width:100%;height:100%;" frameborder="0" allow="autoplay;fullscreen" allowfullscreen></iframe></div>`;
        return `<div style="padding:40px;text-align:center;color:#94a3b8;">Formato no reconocido</div>`;
    },

    // ─────────────────────────────────────────────
    // PREVIEW AMPLIADO
    // ─────────────────────────────────────────────
    verPreviewAmpliado(urlInicial, tipo = 'image', galeriaReferencia = []) {
        if (!urlInicial) return;

        // Inyectar estilos una sola vez
        if (!document.getElementById('mp-styles')) {
            const s = document.createElement('style');
            s.id = 'mp-styles';
            s.textContent = `
                /* Forzar tamaño fijo del popup de SweetAlert */
                body.swal2-shown .swal2-container { align-items: center !important; }
                .mp-popup.swal2-popup {
                    width: min(820px, 88vw) !important;
                    max-width: min(820px, 88vw) !important;
                    background: rgba(10,13,22,0.98) !important;
                    border-radius: 20px !important;
                    border: 1px solid rgba(255,255,255,0.07) !important;
                    padding: 0 !important;
                    box-shadow: 0 32px 80px rgba(0,0,0,0.7) !important;
                }
                .mp-popup .swal2-html-container {
                    margin: 0 !important;
                    padding: 0 !important;
                    overflow: hidden !important;
                }
                .mp-close.swal2-close {
                    color: #475569 !important;
                    position: absolute !important;
                    top: 10px !important; right: 12px !important;
                    z-index: 100 !important;
                    font-size: 22px !important;
                }
                .mp-close.swal2-close:hover { color: #f87171 !important; }
                /* Thumb hover */
                .mp-thumb:hover { opacity: 0.85 !important; border-color: rgba(59,130,246,0.5) !important; }
                /* Zoom CSS hover */
                .mp-zoom-box { overflow: hidden; border-radius: 12px; cursor: zoom-in; }
                .mp-zoom-box img {
                    display: block; width: 100%; height: 100%;
                    object-fit: contain;
                    transform: scale(1);
                    transform-origin: 50% 50%;
                    transition: transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
                    pointer-events: none; user-select: none;
                }
                .mp-zoom-box:hover img { transform: scale(2.2); }
                /* Botones control */
                .mp-ctrl {
                    width: 34px; height: 34px; border-radius: 9px;
                    background: rgba(255,255,255,0.07);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #cbd5e1; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.15s, color 0.15s;
                    flex-shrink: 0;
                }
                .mp-ctrl:hover:not(:disabled) { background: rgba(255,255,255,0.15); color: white; }
                .mp-ctrl:disabled { opacity: 0.2; cursor: default; }
                .mp-ctrl .material-symbols-outlined { font-size: 17px; pointer-events: none; }
            `;
            document.head.appendChild(s);
        }

        // Estado
        let _idx = Math.max(0, galeriaReferencia.findIndex(i => (i.url || i.file_url) === urlInicial));
        let _galVis = true;
        const total = galeriaReferencia.length;

        const getUrl = (i) => { const it = galeriaReferencia[i]; return it ? (it.url || it.file_url || '') : ''; };
        const getTipo = (i) => { const it = galeriaReferencia[i]; return it ? (it.tipo || 'imagen') : 'imagen'; };
        const esVideo = (i) => {
            const u = getUrl(i);
            const t = getTipo(i);
            const info = MediaHelper.obtenerInfoVideo(u, null, galeriaReferencia);
            return t === 'video' || info.tipo !== 'imagen' || u.startsWith('blob:');
        };

        // ── Funciones que actualizan el DOM directamente (sin re-render) ──

        const actualizarVisor = (idx) => {
            const contenedor = document.getElementById('mp-visor');
            if (!contenedor) return;
            const u = getUrl(idx);
            if (esVideo(idx)) {
                contenedor.innerHTML = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;">
                    ${MediaHelper.renderVideoPlayer(u, galeriaReferencia)}
                </div>`;
            } else {
                contenedor.innerHTML = `
                <div class="mp-zoom-box" id="mp-zoom-box" style="width:100%;height:100%;">
                    <img src="${u}" id="mp-zoom-img" alt="" draggable="false">
                </div>`;
                // Actualizar transform-origin con la posición del cursor
                const box = document.getElementById('mp-zoom-box');
                if (box) {
                    box.addEventListener('mousemove', (e) => {
                        const img = document.getElementById('mp-zoom-img');
                        if (!img) return;
                        const rect = box.getBoundingClientRect();
                        const ox = ((e.clientX - rect.left) / rect.width * 100).toFixed(1) + '%';
                        const oy = ((e.clientY - rect.top) / rect.height * 100).toFixed(1) + '%';
                        img.style.transformOrigin = `${ox} ${oy}`;
                    });
                    box.addEventListener('mouseleave', () => {
                        const img = document.getElementById('mp-zoom-img');
                        if (img) img.style.transformOrigin = '50% 50%';
                    });
                }
            }
        };

        const actualizarThumbs = (idx) => {
            document.querySelectorAll('.mp-thumb').forEach((el, i) => {
                const activo = i === idx;
                el.style.borderColor = activo ? '#3b82f6' : 'rgba(255,255,255,0.06)';
                el.style.opacity = activo ? '1' : '0.4';
                if (activo) el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            });
        };

        const actualizarContador = (idx) => {
            const el = document.getElementById('mp-contador');
            if (el) el.textContent = `${idx + 1} / ${total}`;
            document.querySelectorAll('.mp-dot').forEach((d, i) => {
                d.style.width = i === idx ? '14px' : '5px';
                d.style.background = i === idx ? '#3b82f6' : '#334155';
            });
        };

        const actualizarBotones = (idx) => {
            const prev = document.getElementById('mp-prev');
            const next = document.getElementById('mp-next');
            if (prev) prev.disabled = idx === 0;
            if (next) next.disabled = idx === total - 1;
        };

        const actualizarGaleria = (vis) => {
            const gal = document.getElementById('mp-galeria');
            const btn = document.getElementById('mp-toggle');
            if (gal) {
                gal.style.maxHeight = vis ? '72px' : '0';
                gal.style.opacity = vis ? '1' : '0';
            }
            if (btn) {
                btn.title = vis ? 'Ocultar galería' : 'Mostrar galería';
                const icon = btn.querySelector('.material-symbols-outlined');
                if (icon) icon.textContent = vis ? 'photo_library' : 'hide_image';
            }
        };

        const irA = (idx) => {
            if (idx < 0 || idx >= total || idx === _idx) return;
            _idx = idx;
            actualizarVisor(idx);
            actualizarThumbs(idx);
            actualizarContador(idx);
            actualizarBotones(idx);
        };

        // ── HTML estático del modal (estructura fija, solo el visor cambia) ──
        const thumbsHtml = galeriaReferencia.map((item, i) => {
            const u = item.url || item.file_url || '';
            const info = MediaHelper.obtenerInfoVideo(u, null, galeriaReferencia);
            const act = i === _idx;
            return `
            <div class="mp-thumb"
                 data-thumb-idx="${i}"
                 style="flex-shrink:0;width:52px;height:52px;border-radius:10px;overflow:hidden;
                        cursor:pointer;position:relative;box-sizing:border-box;
                        border:2px solid ${act ? '#3b82f6' : 'rgba(255,255,255,0.06)'};
                        opacity:${act ? '1' : '0.4'};transition:all 0.2s;">
                <img src="${info.thumb || u}" style="width:100%;height:100%;object-fit:cover;display:block;pointer-events:none;" draggable="false">
                ${info.tipo !== 'imagen'
                    ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.35);">
                           <span class="material-symbols-outlined" style="color:white;font-size:14px;pointer-events:none;">play_circle</span>
                       </div>`
                    : ''}
            </div>`;
        }).join('');

        const dotsHtml = galeriaReferencia.map((_, i) =>
            `<div class="mp-dot" style="height:3px;border-radius:99px;transition:all 0.3s;
                  width:${i === _idx ? '14px' : '5px'};
                  background:${i === _idx ? '#3b82f6' : '#334155'};"></div>`
        ).join('');

        const html = `
        <div style="display:flex;flex-direction:column;gap:0;width:100%;">

            <!-- Header -->
            <div style="display:flex;align-items:center;justify-content:space-between;
                        padding:16px 20px 12px 20px;">
                <!-- Contador + dots -->
                <div style="display:flex;align-items:center;gap:10px;">
                    ${total > 1 ? `
                    <span id="mp-contador"
                          style="font-size:10px;font-weight:900;color:#475569;
                                 text-transform:uppercase;letter-spacing:0.08em;">
                        ${_idx + 1} / ${total}
                    </span>
                    <div style="display:flex;gap:3px;align-items:center;">${dotsHtml}</div>` : ''}
                </div>

                <!-- Controles navegación -->
                <div style="display:flex;align-items:center;gap:6px;margin-right:36px;">
                    ${total > 1 ? `
                    <button id="mp-prev" class="mp-ctrl" ${_idx === 0 ? 'disabled' : ''} title="Anterior">
                        <span class="material-symbols-outlined">chevron_left</span>
                    </button>
                    <button id="mp-next" class="mp-ctrl" ${_idx === total - 1 ? 'disabled' : ''} title="Siguiente">
                        <span class="material-symbols-outlined">chevron_right</span>
                    </button>
                    <div style="width:1px;height:20px;background:rgba(255,255,255,0.08);margin:0 2px;"></div>
                    <button id="mp-toggle" class="mp-ctrl" title="${_galVis ? 'Ocultar galería' : 'Mostrar galería'}">
                        <span class="material-symbols-outlined">${_galVis ? 'photo_library' : 'hide_image'}</span>
                    </button>` : ''}
                </div>
            </div>

            <!-- Visor — altura fija siempre -->
            <div style="padding:0 20px;">
                <div id="mp-visor" style="width:100%;height:480px;border-radius:12px;overflow:hidden;
                                           background:transparent;"></div>
            </div>

            <!-- Galería inferior -->
            ${total > 1 ? `
            <div id="mp-galeria"
                 style="overflow:hidden;transition:max-height 0.3s ease,opacity 0.3s ease;
                        max-height:${_galVis ? '76px' : '0'};opacity:${_galVis ? '1' : '0'};
                        padding:0 20px;">
                <div style="display:flex;gap:6px;overflow-x:auto;padding:12px 0 4px 0;
                             scrollbar-width:thin;scrollbar-color:#1e293b transparent;">
                    ${thumbsHtml}
                </div>
            </div>` : ''}

            <!-- Padding inferior -->
            <div style="height:16px;"></div>
        </div>`;

        // ── Abrir Swal ──
        Swal.fire({
            html,
            showConfirmButton: false,
            background: 'transparent',
            width: 'min(820px, 88vw)',
            backdrop: 'rgba(8,12,24,0.92)',
            showCloseButton: true,
            customClass: { popup: 'mp-popup', closeButton: 'mp-close' },
            didOpen: () => {
                // Render inicial del visor
                actualizarVisor(_idx);

                // Evento prev
                document.getElementById('mp-prev')?.addEventListener('click', () => irA(_idx - 1));

                // Evento next
                document.getElementById('mp-next')?.addEventListener('click', () => irA(_idx + 1));

                // Toggle galería
                document.getElementById('mp-toggle')?.addEventListener('click', () => {
                    _galVis = !_galVis;
                    actualizarGaleria(_galVis);
                });

                // Thumbnails — delegación en el contenedor de galería
                document.getElementById('mp-galeria')?.addEventListener('click', (e) => {
                    const thumb = e.target.closest('[data-thumb-idx]');
                    if (!thumb) return;
                    irA(parseInt(thumb.getAttribute('data-thumb-idx')));
                });

                // Teclado
                const kh = (e) => {
                    if (e.key === 'ArrowRight') irA(_idx + 1);
                    if (e.key === 'ArrowLeft') irA(_idx - 1);
                };
                window.__mpKH = kh;
                window.addEventListener('keydown', kh);
            },
            willClose: () => {
                if (window.__mpKH) { window.removeEventListener('keydown', window.__mpKH); delete window.__mpKH; }
            }
        });
    }
};