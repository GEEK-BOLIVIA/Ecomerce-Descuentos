export const departamentoFormView = {

    // Estado interno del mapa
    _map: null,
    _marker: null,
    _estado: {
        lat: -17.3935,
        lng: -66.1570,
        zoom: 13,
        nombre: '',
        slug: '',
        id: null,
        esEdicion: false
    },

    // ─────────────────────────────────────────────
    // ENTRADA PRINCIPAL
    // ─────────────────────────────────────────────
    async abrir({ datos = {}, esEdicion = false, onGuardar, onCancelar }) {
        // Limpiar mapa anterior si existe
        this._destruirMapa();

        // Cargar Leaflet si no está disponible
        await this._cargarLeaflet();

        // Inicializar estado
        this._estado = {
            lat: parseFloat(datos.lat) || -17.3935,
            lng: parseFloat(datos.lng) || -66.1570,
            zoom: parseInt(datos.zoom_sugerido) || 13,
            nombre: datos.nombre || '',
            slug: datos.slug || '',
            id: datos.id || null,
            esEdicion
        };

        this._onGuardar = onGuardar;
        this._onCancelar = onCancelar;

        // Renderizar HTML
        const contenedor = document.getElementById('content-area');
        if (!contenedor) return;
        contenedor.innerHTML = this._renderHTML();

        // Init mapa después de que el DOM esté listo
        requestAnimationFrame(() => {
            setTimeout(() => this._initMapa(), 100);
        });

        // Eventos del panel derecho
        this._bindEventos();
    },

    // ─────────────────────────────────────────────
    // HTML ESTÁTICO
    // ─────────────────────────────────────────────
    _renderHTML() {
        const { nombre, slug, lat, lng, zoom, esEdicion } = this._estado;
        return `
        <div class="flex flex-col h-full max-h-[calc(100vh-64px)] overflow-hidden bg-slate-50">

            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm flex-shrink-0">
                <div class="flex items-center gap-3">
                    <button id="df-btn-cancelar"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-100
                                   hover:bg-slate-200 text-slate-600 transition-all">
                        <span class="material-symbols-outlined text-lg">arrow_back</span>
                    </button>
                    <div>
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            ${esEdicion ? 'Editar' : 'Nuevo'} Departamento
                        </p>
                        <h1 class="text-lg font-black text-slate-800 leading-tight" id="df-titulo-header">
                            ${nombre || 'Sin nombre'}
                        </h1>
                    </div>
                </div>
                <button id="df-btn-guardar"
                        class="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700
                               text-white rounded-xl font-black text-[10px] uppercase tracking-widest
                               transition-all shadow-md active:scale-95">
                    <span class="material-symbols-outlined text-base">save</span>
                    ${esEdicion ? 'Guardar Cambios' : 'Registrar Departamento'}
                </button>
            </div>

            <!-- Layout principal: mapa + panel -->
            <div class="flex flex-1 overflow-hidden">

                <!-- MAPA (izquierda 60%) -->
                <div class="relative flex-1 overflow-hidden">
                    <div id="df-map" class="w-full h-full"></div>

                    <!-- Instrucción flotante -->
                    <div class="absolute top-4 left-1/2 -translate-x-1/2 z-[1000]
                                bg-white/95 backdrop-blur shadow-lg rounded-2xl px-4 py-2.5
                                flex items-center gap-2 border border-slate-200 pointer-events-none">
                        <span class="material-symbols-outlined text-emerald-500 text-[18px]">touch_app</span>
                        <p class="text-[11px] font-black text-slate-600 uppercase tracking-wide">
                            Arrastra el pin al centro del departamento
                        </p>
                    </div>

                    <!-- Coordenadas en vivo -->
                    <div class="absolute bottom-4 left-4 z-[1000]
                                bg-slate-900/85 backdrop-blur rounded-xl px-3 py-2
                                flex items-center gap-3 border border-white/10">
                        <span class="material-symbols-outlined text-emerald-400 text-[15px]">my_location</span>
                        <span id="df-coords-live"
                              class="text-[11px] font-mono font-bold text-white">
                            ${parseFloat(lat).toFixed(6)}, ${parseFloat(lng).toFixed(6)}
                        </span>
                        <span class="text-slate-500 text-[10px]">|</span>
                        <span class="material-symbols-outlined text-blue-400 text-[15px]">zoom_in_map</span>
                        <span id="df-zoom-live"
                              class="text-[11px] font-mono font-bold text-white">
                            z${zoom}
                        </span>
                    </div>

                    <!-- Botón reset -->
                    <button id="df-btn-reset"
                            class="absolute bottom-4 right-4 z-[1000]
                                   flex items-center gap-2 px-3 py-2 bg-white/95 backdrop-blur
                                   border border-slate-200 shadow-md rounded-xl text-slate-600
                                   hover:text-red-500 hover:border-red-200 transition-all text-[10px] font-black uppercase">
                        <span class="material-symbols-outlined text-[15px]">restart_alt</span>
                        Reset Bolivia
                    </button>
                </div>

                <!-- PANEL DERECHO (40%) -->
                <div class="w-[380px] flex-shrink-0 bg-white border-l border-slate-200
                            overflow-y-auto flex flex-col gap-0">

                    <!-- Buscador Nominatim -->
                    <div class="p-5 border-b border-slate-100">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                            Buscar ubicación
                        </p>
                        <div class="relative">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2
                                         text-slate-400 text-[18px]">search</span>
                            <input id="df-buscador"
                                   type="text"
                                   placeholder="Ej: Cochabamba, Bolivia"
                                   class="w-full bg-slate-50 border border-slate-200 rounded-xl
                                          py-2.5 pl-10 pr-10 text-sm outline-none
                                          focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                                          transition-all font-medium text-slate-700">
                            <button id="df-btn-buscar"
                                    class="absolute right-2 top-1/2 -translate-y-1/2
                                           w-7 h-7 flex items-center justify-center
                                           bg-emerald-500 hover:bg-emerald-600 text-white
                                           rounded-lg transition-all">
                                <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                            </button>
                        </div>
                        <!-- Resultados búsqueda -->
                        <div id="df-resultados-busqueda" class="mt-2 flex flex-col gap-1 hidden"></div>
                    </div>

                    <!-- Campos del formulario -->
                    <div class="p-5 flex flex-col gap-4">

                        <!-- Nombre -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Nombre del Departamento
                            </label>
                            <input id="df-nombre"
                                   type="text"
                                   placeholder="Ej: Cochabamba"
                                   value="${nombre}"
                                   class="w-full bg-white border border-slate-200 rounded-2xl
                                          py-3 px-4 text-sm outline-none
                                          focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                                          transition-all font-medium text-slate-700">
                        </div>

                        <!-- Slug (autogenerado) -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                Slug
                                <span class="bg-slate-100 text-slate-400 px-2 py-0.5 rounded-lg text-[9px] font-black normal-case">
                                    autogenerado
                                </span>
                            </label>
                            <div class="relative">
                                <input id="df-slug"
                                       type="text"
                                       placeholder="cochabamba"
                                       value="${slug}"
                                       class="w-full bg-slate-50 border border-slate-200 rounded-2xl
                                              py-3 pl-4 pr-10 text-sm outline-none font-mono text-slate-600
                                              focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
                                              transition-all">
                                <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2
                                             text-slate-300 text-[16px]">link</span>
                            </div>
                            <p class="text-[10px] text-slate-400 px-1">Puedes editarlo manualmente si lo necesitas.</p>
                        </div>

                        <!-- Divisor -->
                        <div class="border-t border-slate-100 pt-4">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                Datos del mapa <span class="text-emerald-500">(se actualizan solos)</span>
                            </p>

                            <div class="grid grid-cols-2 gap-3">
                                <!-- Latitud -->
                                <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Latitud</p>
                                    <p id="df-display-lat"
                                       class="text-sm font-mono font-bold text-slate-700">
                                        ${parseFloat(lat).toFixed(6)}
                                    </p>
                                </div>
                                <!-- Longitud -->
                                <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Longitud</p>
                                    <p id="df-display-lng"
                                       class="text-sm font-mono font-bold text-slate-700">
                                        ${parseFloat(lng).toFixed(6)}
                                    </p>
                                </div>
                            </div>

                            <!-- Zoom -->
                            <div class="mt-3 bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    Zoom guardado
                                </p>
                                <div class="flex items-center justify-between">
                                    <p id="df-display-zoom"
                                       class="text-sm font-mono font-bold text-slate-700">
                                        Nivel ${zoom}
                                    </p>
                                    <div class="flex items-center gap-1">
                                        ${Array.from({ length: 5 }, (_, i) => `
                                            <div class="h-2 rounded-full transition-all ${i < Math.round((zoom / 20) * 5) ? 'bg-emerald-400 w-3' : 'bg-slate-200 w-2'}"></div>
                                        `).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Inputs hidden -->
                        <input type="hidden" id="df-lat"  value="${lat}">
                        <input type="hidden" id="df-lng"  value="${lng}">
                        <input type="hidden" id="df-zoom" value="${zoom}">
                    </div>

                    <!-- Vista previa info -->
                    <div class="mx-5 mb-5 bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                        <div class="flex items-start gap-2">
                            <span class="material-symbols-outlined text-emerald-500 text-[18px] mt-0.5">info</span>
                            <div>
                                <p class="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Vista del cliente</p>
                                <p class="text-[11px] text-emerald-700 leading-relaxed">
                                    Cuando un cliente elija este departamento, el mapa se centrará en las coordenadas
                                    que establezcas aquí con el zoom nivel <span id="df-preview-zoom" class="font-black">${zoom}</span>.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ─────────────────────────────────────────────
    // INICIALIZAR MAPA LEAFLET
    // ─────────────────────────────────────────────
    _initMapa() {
        const { lat, lng, zoom } = this._estado;

        this._map = L.map('df-map', {
            center: [lat, lng],
            zoom: zoom,
            zoomControl: true
        });

        // Tile layer OpenStreetMap
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this._map);

        // Icono personalizado del marcador
        const iconoPin = L.divIcon({
            className: '',
            html: `<div style="
                width:36px;height:36px;border-radius:50% 50% 50% 0;
                background:linear-gradient(135deg,#10b981,#059669);
                border:3px solid white;
                box-shadow:0 4px 16px rgba(16,185,129,0.5);
                transform:rotate(-45deg);
                cursor:grab;">
            </div>`,
            iconSize: [36, 36],
            iconAnchor: [18, 36],
            popupAnchor: [0, -40]
        });

        // Marcador draggable
        this._marker = L.marker([lat, lng], {
            draggable: true,
            icon: iconoPin
        }).addTo(this._map);

        // Evento: arrastrar el marcador
        this._marker.on('dragend', () => {
            const pos = this._marker.getLatLng();
            this._actualizarCoordenadas(pos.lat, pos.lng);
        });

        // Evento: cambio de zoom
        this._map.on('zoomend', () => {
            const z = this._map.getZoom();
            this._actualizarZoom(z);
        });

        // Clic en el mapa mueve el marcador
        this._map.on('click', (e) => {
            this._marker.setLatLng(e.latlng);
            this._actualizarCoordenadas(e.latlng.lat, e.latlng.lng);
        });
    },

    // ─────────────────────────────────────────────
    // ACTUALIZAR ESTADO DESDE EL MAPA
    // ─────────────────────────────────────────────
    _actualizarCoordenadas(lat, lng) {
        this._estado.lat = lat;
        this._estado.lng = lng;

        const latF = parseFloat(lat).toFixed(6);
        const lngF = parseFloat(lng).toFixed(6);

        // Inputs hidden
        const iLat = document.getElementById('df-lat');
        const iLng = document.getElementById('df-lng');
        if (iLat) iLat.value = lat;
        if (iLng) iLng.value = lng;

        // Display panel
        const dLat = document.getElementById('df-display-lat');
        const dLng = document.getElementById('df-display-lng');
        if (dLat) dLat.textContent = latF;
        if (dLng) dLng.textContent = lngF;

        // Coords en vivo sobre el mapa
        const live = document.getElementById('df-coords-live');
        if (live) live.textContent = `${latF}, ${lngF}`;
    },

    _actualizarZoom(zoom) {
        this._estado.zoom = zoom;

        const iZoom = document.getElementById('df-zoom');
        if (iZoom) iZoom.value = zoom;

        const dZoom = document.getElementById('df-display-zoom');
        if (dZoom) dZoom.textContent = `Nivel ${zoom}`;

        const liveZ = document.getElementById('df-zoom-live');
        if (liveZ) liveZ.textContent = `z${zoom}`;

        const prevZ = document.getElementById('df-preview-zoom');
        if (prevZ) prevZ.textContent = zoom;
    },

    // ─────────────────────────────────────────────
    // EVENTOS DEL PANEL DERECHO
    // ─────────────────────────────────────────────
    _bindEventos() {
        // Nombre → autogenera slug
        document.getElementById('df-nombre')?.addEventListener('input', (e) => {
            const val = e.target.value;
            this._estado.nombre = val;

            // Actualizar header
            const h = document.getElementById('df-titulo-header');
            if (h) h.textContent = val || 'Sin nombre';

            // Autogenerar slug solo si NO es edición o el slug está vacío/igual al anterior autogenerado
            const slugInput = document.getElementById('df-slug');
            if (slugInput) {
                const slugGenerado = this._generarSlug(val);
                slugInput.value = slugGenerado;
                this._estado.slug = slugGenerado;
            }
        });

        // Slug manual
        document.getElementById('df-slug')?.addEventListener('input', (e) => {
            this._estado.slug = e.target.value;
        });

        // Buscador: Enter
        document.getElementById('df-buscador')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this._buscarUbicacion();
        });

        // Buscador: botón
        document.getElementById('df-btn-buscar')?.addEventListener('click', () => {
            this._buscarUbicacion();
        });

        // Reset
        document.getElementById('df-btn-reset')?.addEventListener('click', () => {
            this._volarA(-16.5, -64.5, 6); // Centro de Bolivia
        });

        // Cancelar
        // Cancelar — pregunta antes de salir
        document.getElementById('df-btn-cancelar')?.addEventListener('click', () => {
            Swal.fire({
                title: '<span class="text-slate-800 font-black uppercase text-sm">¿Salir sin guardar?</span>',
                html: `<div class="text-center">
                   <p class="text-slate-500 text-sm">
                       Los cambios que no hayas guardado <br>
                       <span class="text-slate-800 font-bold">se perderán.</span>
                   </p>
               </div>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, salir',
                cancelButtonText: 'Seguir editando',
                confirmButtonColor: '#ef4444',
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl',
                    confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all hover:scale-105',
                    cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
                }
            }).then(({ isConfirmed }) => {
                if (!isConfirmed) return;
                this._destruirMapa();
                if (this._onCancelar) this._onCancelar();
            });
        });

        // Guardar
        document.getElementById('df-btn-guardar')?.addEventListener('click', () => {
            this._guardar();
        });
    },

    // ─────────────────────────────────────────────
    // BUSCADOR NOMINATIM
    // ─────────────────────────────────────────────
    async _buscarUbicacion() {
        const input = document.getElementById('df-buscador');
        const query = input?.value?.trim();
        if (!query) return;

        const resultadosEl = document.getElementById('df-resultados-busqueda');
        if (resultadosEl) {
            resultadosEl.classList.remove('hidden');
            resultadosEl.innerHTML = `
            <div class="flex items-center gap-2 px-3 py-2 text-slate-400 text-[11px]">
                <span class="material-symbols-outlined text-[14px] animate-spin">autorenew</span>
                Buscando...
            </div>`;
        }

        try {
            const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=4&countrycodes=bo`;
            const resp = await fetch(url, { headers: { 'Accept-Language': 'es' } });
            const data = await resp.json();

            if (!resultadosEl) return;

            if (data.length === 0) {
                resultadosEl.innerHTML = `
                <div class="px-3 py-2 text-slate-400 text-[11px] italic">Sin resultados para "${query}"</div>`;
                return;
            }

            resultadosEl.innerHTML = data.map(r => `
            <button class="df-resultado-item w-full text-left flex items-center gap-2
                           px-3 py-2 rounded-xl hover:bg-emerald-50 hover:text-emerald-700
                           transition-all text-[11px] font-medium text-slate-600 border border-transparent
                           hover:border-emerald-100"
                    data-lat="${r.lat}" data-lng="${r.lon}" data-nombre="${r.display_name}">
                <span class="material-symbols-outlined text-[14px] text-emerald-400 flex-shrink-0">location_on</span>
                <span class="truncate">${r.display_name}</span>
            </button>`).join('');

            // Click en resultado
            resultadosEl.querySelectorAll('.df-resultado-item').forEach(btn => {
                btn.addEventListener('click', () => {
                    const lat = parseFloat(btn.dataset.lat);
                    const lng = parseFloat(btn.dataset.lng);
                    this._volarA(lat, lng, this._estado.zoom);
                    resultadosEl.classList.add('hidden');
                    if (input) input.value = '';
                });
            });

        } catch (err) {
            if (resultadosEl) {
                resultadosEl.innerHTML = `
                <div class="px-3 py-2 text-red-400 text-[11px]">Error al buscar. Intenta de nuevo.</div>`;
            }
        }
    },

    // ─────────────────────────────────────────────
    // VOLAR A COORDENADAS
    // ─────────────────────────────────────────────
    _volarA(lat, lng, zoom) {
        if (!this._map || !this._marker) return;
        this._map.flyTo([lat, lng], zoom, { duration: 1.2 });
        this._marker.setLatLng([lat, lng]);
        this._actualizarCoordenadas(lat, lng);
    },

    // ─────────────────────────────────────────────
    // GUARDAR
    // ─────────────────────────────────────────────
    _guardar() {
        const nombre = document.getElementById('df-nombre')?.value.trim();
        const slug = document.getElementById('df-slug')?.value.trim();
        const lat = parseFloat(document.getElementById('df-lat')?.value);
        const lng = parseFloat(document.getElementById('df-lng')?.value);
        const zoom = parseInt(document.getElementById('df-zoom')?.value);

        // Validaciones
        if (!nombre) {
            Swal.fire({
                icon: 'warning',
                title: '<span class="text-slate-800 font-black uppercase text-sm">Campo requerido</span>',
                text: 'El nombre del departamento es obligatorio.',
                confirmButtonColor: '#059669',
                customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
            });
            document.getElementById('df-nombre')?.focus();
            return;
        }
        if (!slug) {
            Swal.fire({
                icon: 'warning',
                title: '<span class="text-slate-800 font-black uppercase text-sm">Campo requerido</span>',
                text: 'El slug es obligatorio.',
                confirmButtonColor: '#059669',
                customClass: { popup: 'rounded-[32px] border-none shadow-xl' }
            });
            document.getElementById('df-slug')?.focus();
            return;
        }

        // ── Confirmación antes de guardar ──
        Swal.fire({
            title: `<span class="text-slate-800 font-black uppercase text-sm">
                    ${this._estado.esEdicion ? '¿Guardar Cambios?' : '¿Registrar Departamento?'}
                </span>`,
            html: `<div class="text-center">
                   <p class="text-slate-500 text-sm">
                       ${this._estado.esEdicion ? 'Se actualizarán los datos de:' : 'Se registrará el nuevo departamento:'} <br>
                       <span class="text-slate-800 font-bold">"${nombre}"</span>
                   </p>
               </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: this._estado.esEdicion ? 'Sí, guardar' : 'Sí, registrar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#059669',
            customClass: {
                popup: 'rounded-[32px] border-none shadow-2xl',
                confirmButton: 'rounded-xl px-8 py-3 font-bold text-sm uppercase transition-all hover:scale-105',
                cancelButton: 'rounded-xl px-8 py-3 font-bold text-sm bg-slate-100 text-slate-500'
            }
        }).then(({ isConfirmed }) => {
            if (!isConfirmed) return;
            if (this._onGuardar) {
                this._destruirMapa();
                this._onGuardar({ nombre, slug, lat, lng, zoom_sugerido: zoom });
            }
        });
    },
    // ─────────────────────────────────────────────
    // UTILIDADES
    // ─────────────────────────────────────────────
    _generarSlug(texto) {
        return texto
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // quitar tildes
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    },

    _destruirMapa() {
        if (this._map) {
            this._map.remove();
            this._map = null;
            this._marker = null;
        }
    },

    async _cargarLeaflet() {
        if (window.L) return; // Ya cargado

        // CSS
        if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }

        // JS
        await new Promise((resolve, reject) => {
            if (window.L) { resolve(); return; }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
};