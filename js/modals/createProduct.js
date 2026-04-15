import { stepInfo } from '../views/components/stepInfo.js';
import { stepCategorias } from '../views/components/stepCategorias.js';
import { stepMultimedia } from '../views/components/stepMultimedia.js';
import { stepSucursales } from '../views/components/stepSucursales.js';

export const productManager = {

    // ─────────────────────────────────────────────
    // ESTADO
    // ─────────────────────────────────────────────
    _galeriaArchivos: [],
    _portadaArchivo: { tipo: 'local', data: null, url: '' },
    _pasoActual: 1,
    _categoriasSeleccionadas: [],

    // Sucursales asignadas: [{ id, nombre, precio, stock }]
    _sucursalesAsignadas: [],
    // Lista completa disponible (para el modal)
    _sucursalesDisponibles: [],
    // Precio y stock base para aplicar al asignar
    _precioBase: '',
    _stockBase: '',

    _datosTemporales: {
        ws_active: true,
        price_visible: true,
        nombre: '',
        descripcion: ''
    },
    _resolve: null,
    _originalContent: null,
    _mainContainer: null,
    _searchTerm: '',

    _initDragGaleria() {
        const container = document.getElementById('galeria-drag-container');
        if (!container) return;

        let dragSrcId = null;
        let dragSrcEl = null;

        container.querySelectorAll('.galeria-item').forEach(item => {

            item.addEventListener('dragstart', (e) => {
                dragSrcId = item.dataset.id;
                dragSrcEl = item;
                e.dataTransfer.effectAllowed = 'move';
                setTimeout(() => item.classList.add('opacity-40'), 0);
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('opacity-40');
                container.querySelectorAll('.galeria-item').forEach(i => {
                    i.classList.remove('border-blue-400', 'border-2', 'bg-blue-50/30');
                });
                dragSrcId = null;
                dragSrcEl = null;
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (item.dataset.id !== dragSrcId) {
                    item.classList.add('border-blue-400', 'border-2', 'bg-blue-50/30');
                }
            });

            item.addEventListener('dragleave', () => {
                item.classList.remove('border-blue-400', 'border-2', 'bg-blue-50/30');
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.classList.remove('border-blue-400', 'border-2', 'bg-blue-50/30');
                if (!dragSrcEl || dragSrcId === item.dataset.id) return;

                // 1. Mover nodo en el DOM — sin re-render
                const allItems = [...container.querySelectorAll('.galeria-item')];
                const srcIndex = allItems.indexOf(dragSrcEl);
                const destIndex = allItems.indexOf(item);

                if (srcIndex < destIndex) {
                    container.insertBefore(dragSrcEl, item.nextSibling);
                } else {
                    container.insertBefore(dragSrcEl, item);
                }

                // 2. Actualizar orden en el estado según posición actual del DOM
                const newOrder = [...container.querySelectorAll('.galeria-item')].map(el => el.dataset.id);
                newOrder.forEach((id, index) => {
                    const archivo = this._galeriaArchivos.find(i => String(i.id) === String(id));
                    if (archivo) archivo.orden = index + 1;
                });

                this._galeriaArchivos.sort((a, b) => a.orden - b.orden);

                // 3. Actualizar solo los inputs de posición en el DOM — sin tocar el resto
                newOrder.forEach((id, index) => {
                    const row = container.querySelector(`[data-id="${id}"]`);
                    const input = row?.querySelector('input[type="number"]');
                    if (input) input.value = index + 1;
                });
            });
        });
    },
    // ─────────────────────────────────────────────
    // MOTOR DE CÁMARA
    // ─────────────────────────────────────────────
    _cameraEngine: {
        _stream: null,
        _timerInterval: null,

        async abrir(modo = 'video') {
            return new Promise(async (resolve) => {
                const esVideo = modo === 'video';
                const modalHtml = `
                <div style="background:#000; border-radius:2.5rem; overflow:hidden; position:relative; min-height:500px; box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);">
                    <video id="n-video" autoplay muted playsinline style="width:100%; height:auto; max-height:70vh; object-fit:cover;"></video>
                    <div id="n-overlay" style="display:none; position:absolute; top:30px; left:30px; right:30px; flex-direction:column; gap:15px; z-index:10;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div style="color:red; font-weight:900; background:rgba(0,0,0,0.7); padding:8px 20px; border-radius:30px; font-size:12px; display:flex; align-items:center; gap:8px;">
                                <span style="animation:n-pulse 1s infinite; font-size:18px;">●</span> GRABANDO
                            </div>
                            <div id="n-timer" style="color:white; font-weight:900; background:rgba(0,0,0,0.7); padding:8px 20px; border-radius:30px; font-size:14px; font-family:monospace;">00:00 / 01:50</div>
                        </div>
                        <div style="width:100%; height:6px; background:rgba(255,255,255,0.2); border-radius:10px; overflow:hidden;">
                            <div id="n-progress" style="width:0%; height:100%; background:#dc2626; transition:width 1s linear;"></div>
                        </div>
                    </div>
                    <div style="padding:35px; display:flex; justify-content:center; gap:30px; background:#f8fafc; border-top:1px solid #e2e8f0;">
                        ${!esVideo
                        ? `<button id="n-btn-snap" style="width:80px;height:80px;border-radius:50%;background:#2563eb;color:white;border:8px solid #dbeafe;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="font-size:35px;">photo_camera</span></button>`
                        : `<button id="n-btn-rec"  style="width:80px;height:80px;border-radius:50%;background:#dc2626;color:white;border:8px solid #fee2e2;cursor:pointer;display:flex;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="font-size:35px;">videocam</span></button>
                               <button id="n-btn-stop" style="display:none;width:80px;height:80px;border-radius:50%;background:#0f172a;color:white;border:8px solid #e2e8f0;cursor:pointer;align-items:center;justify-content:center;"><span class="material-symbols-outlined" style="font-size:35px;">stop</span></button>`
                    }
                    </div>
                    <style>@keyframes n-pulse{0%,100%{opacity:1}50%{opacity:.3}}</style>
                </div>`;

                Swal.fire({
                    title: esVideo ? 'NEXUS VIDEO RECORDER' : 'NEXUS PHOTO STUDIO',
                    html: modalHtml, showConfirmButton: false,
                    width: '900px', background: '#f8fafc', padding: '0',
                    didOpen: async () => {
                        const videoEl = document.getElementById('n-video');
                        const btnSnap = document.getElementById('n-btn-snap');
                        const btnRec = document.getElementById('n-btn-rec');
                        const btnStop = document.getElementById('n-btn-stop');
                        const overlay = document.getElementById('n-overlay');
                        const timerEl = document.getElementById('n-timer');
                        const progressEl = document.getElementById('n-progress');
                        try {
                            this._stream = await navigator.mediaDevices.getUserMedia({
                                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                                audio: esVideo
                            });
                            videoEl.srcObject = this._stream;
                        } catch (err) {
                            Swal.fire('Error', 'No se pudo acceder a la cámara o micrófono', 'error');
                        }
                        if (!esVideo) {
                            btnSnap.onclick = () => {
                                const canvas = document.createElement('canvas');
                                canvas.width = videoEl.videoWidth; canvas.height = videoEl.videoHeight;
                                canvas.getContext('2d').drawImage(videoEl, 0, 0);
                                canvas.toBlob(async (blob) => { resolve(await this.procesar(blob, 'imagen')); Swal.close(); }, 'image/jpeg', 0.95);
                            };
                        } else {
                            let chunks = [], seconds = 0;
                            btnRec.onclick = () => {
                                const recorder = new MediaRecorder(this._stream);
                                recorder.ondataavailable = e => chunks.push(e.data);
                                recorder.onstop = async () => { clearInterval(this._timerInterval); resolve(await this.procesar(new Blob(chunks, { type: 'video/webm' }), 'video')); };
                                recorder.start();
                                btnRec.style.display = 'none'; btnStop.style.display = 'flex'; overlay.style.display = 'flex';
                                this._timerInterval = setInterval(() => {
                                    seconds++;
                                    timerEl.innerText = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')} / 01:50`;
                                    progressEl.style.width = `${(seconds / 110) * 100}%`;
                                    if (seconds >= 110) { recorder.stop(); Swal.close(); }
                                }, 1000);
                                btnStop.onclick = () => { recorder.stop(); Swal.close(); };
                            };
                        }
                    },
                    willClose: () => {
                        if (this._stream) this._stream.getTracks().forEach(t => t.stop());
                        if (this._timerInterval) clearInterval(this._timerInterval);
                    }
                });
            });
        },

        async procesar(blob, tipo) {
            const ext = tipo === 'video' ? 'webm' : 'jpg';
            const mime = tipo === 'video' ? 'video/webm' : 'image/jpeg';
            const file = new File([blob], `nexus_${Date.now()}.${ext}`, { type: mime });
            return { archivo: file, url: URL.createObjectURL(file), tipo, nombre: file.name };
        }
    },

    // ─────────────────────────────────────────────
    // INICIALIZACIÓN
    // ─────────────────────────────────────────────
    async start(containerId, categorias, dPrevios = {}, sucursalesDisponibles = []) {
        this._mainContainer = document.getElementById(containerId);
        if (!this._mainContainer) return;

        // Reset completo
        this._galeriaArchivos = [];
        this._categoriasSeleccionadas = [];
        this._portadaArchivo = { tipo: 'local', data: null, url: '' };
        this._pasoActual = 1;
        this._sucursalesAsignadas = [];
        this._sucursalesDisponibles = sucursalesDisponibles;
        this._precioBase = '';
        this._stockBase = '';

        this._originalContent = this._mainContainer.innerHTML;
        window.categoriasRaw = categorias;

        this._datosTemporales = {
            nombre: dPrevios.nombre || '',
            descripcion: dPrevios.descripcion || '',
            ws_active: dPrevios.ws_active !== undefined ? dPrevios.ws_active : true,
            price_visible: dPrevios.price_visible !== undefined ? dPrevios.price_visible : true,
            id: dPrevios.id || null
        };

        this._categoriasSeleccionadas = dPrevios.categoriasIds || [];

        // Galería previa
        if (Array.isArray(dPrevios.galeria)) {
            this._galeriaArchivos = dPrevios.galeria.map((item, index) => {
                const url = item.url || item.file_url;
                const info = this.obtenerInfoVideo(url);
                return {
                    id: item.id || `db-${index}`,
                    tipo: item.tipo || 'imagen',
                    url,
                    file: null,
                    thumb: item.tipo === 'video' ? info.thumb : url,
                    nombre: item.nombre || 'Archivo guardado',
                    orden: item.orden !== undefined ? parseInt(item.orden) : index
                };
            }).sort((a, b) => a.orden - b.orden);
        }

        // Portada previa
        const pathPortada = dPrevios.portada || dPrevios.imagen_url;
        if (pathPortada) {
            this._portadaArchivo = typeof pathPortada === 'string'
                ? { tipo: 'url', url: pathPortada, data: null }
                : { tipo: 'local', data: pathPortada, url: URL.createObjectURL(pathPortada) };
        }

        // Sucursales previas (edición) — reconstruir _sucursalesAsignadas
        if (Array.isArray(dPrevios.sucursales) && dPrevios.sucursales.length > 0) {
            this._sucursalesAsignadas = dPrevios.sucursales
                .filter(ps => ps.visible !== false)
                .map(ps => {
                    const info = sucursalesDisponibles.find(s => s.id === ps.id_sucursal);
                    return {
                        id: ps.id_sucursal,
                        nombre: info ? info.nombre : `Sucursal ${ps.id_sucursal}`,
                        precio: ps.precio ?? '',
                        stock: ps.stock ?? ''
                    };
                });

            // Precio base = precio de la primera asignada
            if (this._sucursalesAsignadas.length > 0) {
                this._precioBase = this._sucursalesAsignadas[0].precio;
                this._stockBase = this._sucursalesAsignadas[0].stock;
            }
        }
        Swal.fire({
            title: this._datosTemporales.id ? 'Cargando Producto...' : 'Preparando Formulario...',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading()
        });

        this.render();
        this.injectStyles();

        // Delay para que el spinner sea visible
        await new Promise(r => setTimeout(r, 800));
        Swal.close();

        return new Promise(resolve => { this._resolve = resolve; });
    },

    // ─────────────────────────────────────────────
    // RENDER PRINCIPAL
    // ─────────────────────────────────────────────
    render() { this.updateUI(); },

    updateUI() {
        const container = this._mainContainer;
        const d = this._datosTemporales;
        const seleccionadas = (window.categoriasRaw || []).filter(c => this._categoriasSeleccionadas.includes(c.id));

        let contenidoPaso = '';
        switch (this._pasoActual) {
            case 1: contenidoPaso = stepInfo.render(d); break;
            case 2: contenidoPaso = stepCategorias.render(seleccionadas); break;
            case 3: contenidoPaso = stepMultimedia.render(this._portadaArchivo.url, this._renderGaleriaList()); break;
            case 4: contenidoPaso = stepSucursales.render(this._sucursalesAsignadas, this._precioBase, this._stockBase); break;
        }

        const primeraAsignada = this._sucursalesAsignadas[0];

        container.innerHTML = `
        <div class="h-full w-full bg-slate-50/50 overflow-y-auto custom-scrollbar p-6 relative">

            <div class="absolute top-4 right-10 z-[100]">
                <button onclick="window.productManager.cancelarEdicion()"
                        class="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-md border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-100 rounded-xl shadow-sm transition-all group active:scale-95">
                    <span class="text-[9px] font-black uppercase tracking-tighter">Cancelar y Volver</span>
                    <span class="material-symbols-outlined text-lg group-hover:rotate-90 transition-transform">close</span>
                </button>
            </div>

            <div class="max-w-[1400px] mx-auto grid grid-cols-12 gap-10 mt-8">

                <!-- FORMULARIO -->
                <div class="col-span-12 lg:col-span-7 bg-white rounded-[3rem] shadow-xl border border-slate-100 flex flex-col min-h-[800px]">

                    <div class="flex bg-slate-50/50 border-b rounded-t-[3rem] overflow-hidden">
                        ${this._renderTab(1, 'edit_square', 'Información')}
                        ${this._renderTab(2, 'account_tree', 'Categorías')}
                        ${this._renderTab(3, 'media_output', 'Multimedia')}
                        ${this._renderTab(4, 'storefront', 'Sucursales')}
                    </div>

                    <div class="p-10 flex-1 overflow-y-auto custom-scrollbar">
                        ${contenidoPaso}
                    </div>

                    <div class="p-8 bg-slate-50 border-t flex justify-between items-center rounded-b-[3rem]">
                        <button onclick="window.productManager.irPaso(${this._pasoActual - 1})"
                                class="font-black text-[10px] uppercase text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1 ${this._pasoActual === 1 ? 'invisible' : ''}">
                            <span class="material-symbols-outlined text-sm">arrow_back</span> Atrás
                        </button>

                        <div class="flex items-center gap-2">
                            ${[1, 2, 3, 4].map(n => `
                                <div class="h-2 rounded-full transition-all ${n === this._pasoActual ? 'bg-blue-600 w-6' : n < this._pasoActual ? 'bg-blue-300 w-2' : 'bg-slate-200 w-2'}"></div>
                            `).join('')}
                        </div>

                        <button onclick="window.productManager.navSiguiente()"
                                class="px-10 py-4 bg-blue-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center gap-2">
                            ${this._pasoActual === 4
                ? `<span class="material-symbols-outlined text-sm">save</span> Guardar`
                : `Siguiente <span class="material-symbols-outlined text-sm">arrow_forward</span>`}
                        </button>
                    </div>
                </div>

                <!-- PREVIEW -->
                <div class="col-span-12 lg:col-span-5">
                    <div class="sticky top-12 bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100 transform rotate-1">
                        <div class="aspect-square bg-slate-100 relative">
                            ${this._portadaArchivo.url
                ? `<img src="${this._portadaArchivo.url}" class="w-full h-full object-cover">`
                : `<div class="w-full h-full flex items-center justify-center"><span class="material-symbols-outlined text-8xl text-slate-200">image</span></div>`}
                            ${primeraAsignada ? `
                            <div class="absolute top-8 right-8 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl font-black text-blue-600 text-xs shadow-xl uppercase">
                                STOCK: <span class="preview-stock">${primeraAsignada.stock || 0}</span>
                            </div>` : ''}
                        </div>
                        <div class="p-10 space-y-4">
                            <h2 class="preview-nombre text-2xl font-black text-slate-900 leading-tight">
                                ${d.nombre || 'Nombre del Producto'}
                            </h2>
                            ${primeraAsignada ? `
                            <div class="preview-price-box pt-4 border-t border-slate-100" style="opacity:${d.price_visible ? '1' : '0'}">
                                <p class="text-[10px] font-black text-slate-400 uppercase">Precio</p>
                                <p class="text-3xl font-black text-slate-900 tracking-tighter">
                                    ${primeraAsignada.precio || '0.00'} <span class="text-sm uppercase">Bs</span>
                                </p>
                            </div>` : `
                            <p class="text-[11px] text-slate-400 font-bold pt-4 border-t border-slate-100">
                                Asigna una sucursal en el paso 4 para ver el precio
                            </p>`}
                            ${this._sucursalesAsignadas.length > 0 ? `
                            <div class="flex flex-wrap gap-2 pt-2">
                                ${this._sucursalesAsignadas.map(s => `
                                    <span class="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase border border-blue-100">
                                        ${s.nombre}
                                    </span>`).join('')}
                            </div>` : ''}
                        </div>
                    </div>
                </div>

            </div>
        </div>`;
        if (this._pasoActual === 3) {
            this._initDragGaleria();
        }
    },

    // ─────────────────────────────────────────────
    // HANDLERS PASO 4 — SUCURSALES
    // ─────────────────────────────────────────────
    setPrecioBase(valor) {
        this._precioBase = valor;
    },

    setStockBase(valor) {
        this._stockBase = valor;
    },

    async abrirModalSucursales() {
        const idsYaAsignados = this._sucursalesAsignadas.map(s => s.id);

        const idsSeleccionados = await stepSucursales.abrirModal(
            this._sucursalesDisponibles,
            idsYaAsignados
        );

        if (idsSeleccionados === null) return; // Canceló

        // IDs nuevos que se acaban de agregar
        const idsNuevos = idsSeleccionados.filter(id => !idsYaAsignados.includes(id));

        // IDs que se quitaron
        const idsQuitados = idsYaAsignados.filter(id => !idsSeleccionados.includes(id));

        // Quitar las deseleccionadas
        this._sucursalesAsignadas = this._sucursalesAsignadas.filter(s => !idsQuitados.includes(s.id));

        // Agregar las nuevas con precio/stock base
        idsNuevos.forEach(id => {
            const info = this._sucursalesDisponibles.find(s => s.id === id);
            if (info) {
                this._sucursalesAsignadas.push({
                    id: info.id,
                    nombre: info.nombre,
                    precio: this._precioBase || '',
                    stock: this._stockBase || ''
                });
            }
        });

        this.updateUI();
    },

    actualizarSucursal(id, campo, valor) {
        const suc = this._sucursalesAsignadas.find(s => s.id === id);
        if (suc) suc[campo] = valor;
        // No re-renderizar completo para no interrumpir el typing
    },

    quitarSucursal(id) {
        this._sucursalesAsignadas = this._sucursalesAsignadas.filter(s => s.id !== id);
        this.updateUI();
    },

    // ─────────────────────────────────────────────
    // NAVEGACIÓN
    // ─────────────────────────────────────────────
    irPaso(num) {
        if (num < 1 || num > 4) return;
        this._pasoActual = num;
        this.updateUI();
    },

    async navSiguiente() {
        const d = this._datosTemporales;

        if (this._pasoActual === 1) {
            if (!d.nombre.trim()) return this._alertError('El nombre del producto es obligatorio');
            if (!d.descripcion.trim()) return this._alertError('La descripción es obligatoria');
        }
        if (this._pasoActual === 2) {
            if (this._categoriasSeleccionadas.length === 0)
                return this._alertError('Selecciona al menos una subcategoría');
        }
        if (this._pasoActual === 3) {
            if (!this._portadaArchivo.url) return this._alertError('La portada es obligatoria');
        }
        if (this._pasoActual === 4) {

            // Sincronizar DOM → estado por si quedaron valores sin capturar
            document.querySelectorAll('[data-suc-id]').forEach(input => {
                const id = parseInt(input.dataset.sucId);
                const campo = input.dataset.sucCampo;
                const suc = this._sucursalesAsignadas.find(s => s.id === id);
                if (suc) suc[campo] = input.value;
            });

            if (this._sucursalesAsignadas.length === 0)
                return this._alertError('Asigna el producto a al menos una sucursal');

            const sinPrecio = this._sucursalesAsignadas.find(s => !s.precio || parseFloat(s.precio) <= 0);
            if (sinPrecio)
                return this._alertError(`Ingresa un precio válido para "${sinPrecio.nombre}"`);

            const galeriaLimpia = this._galeriaArchivos.map((item, index) => ({
                id: item.id,
                file: item.file || null,
                url: item.url,
                tipo: item.tipo || 'imagen',
                orden: index + 1,
                nombre: item.nombre || d.nombre
            }));

            const dataFinal = {
                id: d.id || null,
                nombre: d.nombre.trim(),
                descripcion: d.descripcion.trim(),
                ws_active: d.ws_active ? 1 : 0,
                price_visible: d.price_visible ? 1 : 0,
                categoriasIds: [...this._categoriasSeleccionadas],
                portada: this._portadaArchivo.data || this._portadaArchivo.url,
                galeria: galeriaLimpia,
                sucursales: this._sucursalesAsignadas.map(s => ({
                    id_sucursal: s.id,
                    precio: parseFloat(s.precio) || 0,
                    stock: parseInt(s.stock) || 0,
                    visible: true,
                    activa: true
                }))
            };
            const accion = dataFinal.id ? 'actualizar' : 'registrar';
            const confirm = await Swal.fire({
                title: `¿${dataFinal.id ? 'Actualizar' : 'Registrar'} producto?`,
                text: `Se ${accion}á "${dataFinal.nombre}" con ${dataFinal.sucursales.length} sucursal${dataFinal.sucursales.length !== 1 ? 'es' : ''} asignada${dataFinal.sucursales.length !== 1 ? 's' : ''}.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: `SÍ, ${accion.toUpperCase()}`,
                cancelButtonText: 'REVISAR',
                confirmButtonColor: '#2563eb',
                cancelButtonColor: '#64748b',
                reverseButtons: true,
                customClass: {
                    popup: 'rounded-[32px]',
                    confirmButton: 'rounded-2xl font-black text-[10px] uppercase px-8 py-4',
                    cancelButton: 'rounded-2xl font-black text-[10px] uppercase px-8 py-4'
                }
            });

            // Si cancela vuelve al formulario sin hacer nada
            if (!confirm.isConfirmed) return;

            // Si confirma procede con el guardado
            console.log('SUCURSALES A GUARDAR:', JSON.stringify(dataFinal.sucursales));
            Swal.fire({ title: '¡Excelente!', text: 'Configuración finalizada', icon: 'success', timer: 1000, showConfirmButton: false });
            if (this._mainContainer) this._mainContainer.innerHTML = this._originalContent;
            if (typeof this._resolve === 'function') this._resolve(dataFinal);
            return;
        }

        this._pasoActual++;
        this.updateUI();
    },

    // ─────────────────────────────────────────────
    // GALERÍA Y MULTIMEDIA
    // ─────────────────────────────────────────────
    sync(el, campo, type = 'text') {
        this._datosTemporales[campo] = type === 'checkbox' ? el.checked : el.value;
        if (campo === 'nombre') {
            const t = document.querySelector('.preview-nombre');
            if (t) t.innerText = el.value || 'Nombre del Producto';
        }
        if (campo === 'price_visible') {
            const box = document.querySelector('.preview-price-box');
            if (box) box.style.opacity = el.checked ? '1' : '0';
        }
    },

    async cambiarPortada(metodo) {
        if (metodo === 'camera') {
            const cap = await this._cameraEngine.abrir('foto');
            if (cap) { this._portadaArchivo = { tipo: 'imagen', data: cap.archivo, url: cap.url }; this.updateUI(); }
            return;
        }
        if (metodo === 'local') {
            const { value: file } = await Swal.fire({ title: 'Cargar Imagen Local', input: 'file', inputAttributes: { accept: 'image/*' } });
            if (file) { this._portadaArchivo = { tipo: 'imagen', data: file, url: URL.createObjectURL(file) }; this.updateUI(); }
        } else {
            const { value: url } = await Swal.fire({ title: 'Vincular URL de Imagen', input: 'url' });
            if (url) { this._portadaArchivo = { tipo: 'imagen', data: null, url }; this.updateUI(); }
        }
    },

    async addGaleriaManual() {
        const { value: fv } = await Swal.fire({
            title: 'Configurar Multimedia', width: '600px',
            html: `
            <div class="grid grid-cols-2 gap-6 p-4 text-left">
                <div>
                    <label class="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1">Formato</label>
                    <select id="swal-tipo" class="w-full bg-slate-100 border-none rounded-xl p-4 font-bold outline-none">
                        <option value="imagen">Imagen</option><option value="video">Video</option>
                    </select>
                </div>
                <div>
                    <label class="text-[10px] font-black uppercase text-slate-400 block mb-2 px-1">Carga</label>
                    <select id="swal-metodo" class="w-full bg-slate-100 border-none rounded-xl p-4 font-bold outline-none">
                        <option value="url">URL / Enlace</option>
                        <option value="local">Archivo Local</option>
                        <option value="camera">Cámara Nexus</option>
                    </select>
                </div>
            </div>`,
            confirmButtonText: 'Siguiente',
            preConfirm: () => [document.getElementById('swal-tipo').value, document.getElementById('swal-metodo').value]
        });

        if (!fv) return;
        const [tipoManual, metodo] = fv;
        let url = '', file = null, nombre = '';

        if (metodo === 'camera') {
            const res = await this._cameraEngine.abrir(tipoManual);
            if (res) { url = res.url; file = res.archivo; nombre = res.nombre; }
        } else if (metodo === 'local') {
            const { value: f } = await Swal.fire({ title: 'Subir Archivo', input: 'file', inputAttributes: { accept: tipoManual === 'video' ? 'video/*' : 'image/*' } });
            if (f) { file = f; url = URL.createObjectURL(f); nombre = f.name; }
        } else {
            const { value: u } = await Swal.fire({ title: 'Pegar URL', input: 'url' });
            if (u) { url = u; nombre = tipoManual.toUpperCase(); }
        }

        if (url) {
            this._galeriaArchivos.push({
                id: Date.now().toString() + Math.random(),
                tipo: tipoManual, url, file,
                thumb: tipoManual === 'video' ? 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png' : url,
                nombre, orden: this._galeriaArchivos.length + 1
            });
            this._galeriaArchivos.sort((a, b) => a.orden - b.orden);
            this.updateUI();
        }
    },

    eliminarArchivo(id) {
        this._galeriaArchivos = this._galeriaArchivos.filter(i => i.id != id);
        this._galeriaArchivos.forEach((item, index) => { item.orden = index + 1; });
        this.updateUI();
    },

    setOrdenGaleria(id, nuevoValor) {
        const nuevoOrden = parseInt(nuevoValor) || 0;
        const itemCambiado = this._galeriaArchivos.find(i => i.id == id);
        if (!itemCambiado) return;
        const itemEnDestino = this._galeriaArchivos.find(i => i.id !== id && i.orden === nuevoOrden);
        if (itemEnDestino) itemEnDestino.orden = itemCambiado.orden;
        itemCambiado.orden = nuevoOrden;
        this._galeriaArchivos.sort((a, b) => a.orden - b.orden);
        this.updateUI();
    },

    handleSearch(el) {
        this._searchTerm = el.value.toLowerCase();
        const lista = document.getElementById('nexus-resultados-busqueda');
        const filtradas = (window.categoriasRaw || [])
            .filter(c => c.id_padre && c.nombre.toLowerCase().includes(this._searchTerm))
            .slice(0, 10);
        lista.innerHTML = filtradas.map(h => `
            <div onclick="window.productManager.toggleHija(${h.id})"
                 class="p-3 bg-white rounded-xl border-2 cursor-pointer hover:border-blue-600 mb-2 flex justify-between items-center group transition-all">
                <p class="text-[11px] font-black text-slate-700 uppercase">${h.nombre}</p>
                <span class="material-symbols-outlined text-slate-300 group-hover:text-blue-600 text-sm">add_circle</span>
            </div>`).join('');
    },

    toggleHija(id) {
        this._categoriasSeleccionadas = this._categoriasSeleccionadas.includes(id)
            ? this._categoriasSeleccionadas.filter(i => i !== id)
            : [...this._categoriasSeleccionadas, id];
        this.updateUI();
    },

    // ─────────────────────────────────────────────
    // VIDEO PLAYER — RESTAURADO CON IFRAMES
    // ─────────────────────────────────────────────
    obtenerInfoVideo(url, file = null) {
        if (!url && !file) return { tipo: 'imagen', thumb: '', esArchivo: false };
        if (file instanceof File) {
            const esVideo = file.type.startsWith('video/');
            const blobUrl = URL.createObjectURL(file);
            return { tipo: esVideo ? 'video' : 'imagen', esArchivo: esVideo, thumb: esVideo ? 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png' : blobUrl, url: blobUrl };
        }
        const urlStr = String(url);
        if (urlStr.match(/\.(mp4|webm|ogg|mov|m4v)($|\?)/i))
            return { tipo: 'video', esArchivo: true, thumb: 'https://cdn-icons-png.flaticon.com/512/1179/1179120.png', url: urlStr };

        const ytMatch = urlStr.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts|live)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch) return { tipo: 'youtube', id: ytMatch[1], thumb: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`, url: urlStr };
        if (urlStr.includes('facebook.com') || urlStr.includes('fb.watch'))
            return { tipo: 'facebook', thumb: 'https://cdn-icons-png.flaticon.com/512/124/124010.png', url: urlStr };
        if (urlStr.includes('instagram.com'))
            return { tipo: 'instagram', thumb: 'https://cdn-icons-png.flaticon.com/512/174/174855.png', url: urlStr };
        if (urlStr.includes('tiktok.com')) {
            const tkId = urlStr.split('/video/')[1]?.split('?')[0];
            return { tipo: 'tiktok', id: tkId, thumb: 'https://cdn-icons-png.flaticon.com/512/3046/3046121.png', url: urlStr };
        }
        return { tipo: 'imagen', thumb: urlStr, url: urlStr, esArchivo: false };
    },

    renderVideoPlayer(url) {
        if (!url) return `<div class="p-10 bg-slate-100 text-center rounded-2xl font-bold">URL no válida</div>`;
        const info = this.obtenerInfoVideo(url);
        const esLocal = url.startsWith('blob:');

        // Archivo local o video directo
        if (info.esArchivo || esLocal) {
            return `<video src="${url}" controls autoplay class="w-full rounded-2xl shadow-2xl bg-black" style="max-height:500px;"></video>`;
        }

        // Plataformas con iframe
        let iframeSrc = '';
        let aspect = '56.25%'; // 16:9 por defecto

        switch (info.tipo) {
            case 'youtube':
                iframeSrc = `https://www.youtube.com/embed/${info.id}?autoplay=1&rel=0`;
                break;
            case 'facebook':
                iframeSrc = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=0&autoplay=1`;
                aspect = '75%';
                break;
            case 'instagram':
                iframeSrc = url.split('?')[0].replace(/\/$/, '') + '/embed';
                aspect = '125%';
                break;
            case 'tiktok':
                if (info.id) { iframeSrc = `https://www.tiktok.com/embed/v2/${info.id}`; aspect = '177%'; }
                break;
        }

        if (iframeSrc) {
            return `
            <div style="position:relative; width:100%; padding-top:${aspect}; background:black; border-radius:1.5rem; overflow:hidden;">
                <iframe src="${iframeSrc}"
                        style="position:absolute; top:0; left:0; width:100%; height:100%;"
                        frameborder="0"
                        allow="autoplay; fullscreen"
                        allowfullscreen>
                </iframe>
            </div>`;
        }

        return `<div class="p-10 bg-slate-100 text-center rounded-2xl font-bold">No se pudo cargar el reproductor</div>`;
    },

    verPreviewAmpliado(url, tipo = 'image') {
        if (!url) return;
        const info = this.obtenerInfoVideo(url);
        const esVideo = tipo === 'video' || (info.tipo !== 'imagen');
        const content = esVideo
            ? this.renderVideoPlayer(url)
            : `<img src="${url}" class="w-full rounded-2xl shadow-2xl object-contain" style="max-height:85vh;">`;

        const ancho = (info.tipo === 'tiktok' || info.tipo === 'instagram') ? '400px' : '850px';
        Swal.fire({ html: content, showConfirmButton: false, background: 'transparent', width: ancho, backdrop: 'rgba(15,23,42,0.95)', showCloseButton: true });
    },

    _renderGaleriaList() {
        if (this._galeriaArchivos.length === 0) {
            return `
        <div class="py-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
            <span class="material-symbols-outlined text-4xl text-slate-200">photo_library</span>
            <p class="text-slate-400 text-[10px] font-black uppercase mt-2">No hay archivos en la galería</p>
        </div>`;
        }

        return `
        <div class="flex items-center gap-2 mb-3 px-1">
    <span class="material-symbols-outlined text-slate-300 text-[16px]">drag_indicator</span>
    <p class="text-[9px] font-bold text-slate-400 uppercase">Arrastra los elementos para reordenarlos</p>
</div>
    <div id="galeria-drag-container">
        ${this._galeriaArchivos.map(item => `
        <div class="galeria-item flex items-center gap-4 p-4 bg-slate-50 rounded-3xl border border-slate-100
                    hover:bg-white hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:opacity-60 active:scale-[0.98] mb-3"
             draggable="true"
             data-id="${item.id}">

            <!-- Handle de arrastre -->
            <div class="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors cursor-grab"
                 title="Arrastrar para reordenar">
                <span class="material-symbols-outlined text-xl">drag_indicator</span>
            </div>

            <!-- Miniatura -->
            <div class="w-16 h-16 rounded-2xl overflow-hidden bg-slate-200 flex-shrink-0 relative">
                <img src="${item.thumb || item.url}" class="w-full h-full object-cover">
                ${item.tipo === 'video'
                ? `<span class="material-symbols-outlined absolute inset-0 flex items-center justify-center text-white bg-black/20 text-xl">play_circle</span>`
                : ''}
            </div>

            <!-- Info + posición -->
            <div class="flex-1 min-w-0">
                <p class="text-[10px] font-black text-slate-800 uppercase truncate">${item.nombre}</p>
                <div class="flex items-center gap-2 mt-1.5">
                    <span class="text-[9px] font-bold text-slate-400 uppercase">Pos:</span>
                    <input type="number"
                           value="${item.orden}"
                           min="1"
                           onchange="window.productManager.setOrdenGaleria('${item.id}', this.value)"
                           class="w-12 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-center py-1 focus:border-blue-500 outline-none"
                           title="Cambiar posición manualmente">
                </div>
            </div>

            <!-- Acciones con tooltip -->
            <div class="flex items-center gap-1 flex-shrink-0">

                <!-- Preview -->
                <div class="group/tip relative">
                    <button onclick="window.productManager.verPreviewAmpliado('${item.url}', '${item.tipo}')"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 border border-indigo-100/50 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'wght' 250">visibility</span>
                    </button>
                    <span class="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                 bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        Previsualizar
                        <i class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></i>
                    </span>
                </div>

                <!-- Eliminar -->
                <div class="group/tip relative">
                    <button onclick="window.productManager.eliminarArchivo('${item.id}')"
                            class="w-9 h-9 flex items-center justify-center rounded-xl bg-red-50 text-red-400 border border-red-100/50 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                        <span class="material-symbols-outlined text-[18px]" style="font-variation-settings:'wght' 250">delete</span>
                    </button>
                    <span class="absolute -top-9 left-1/2 -translate-x-1/2 scale-0 group-hover/tip:scale-100 transition-all
                                 bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        Eliminar
                        <i class="absolute -bottom-1 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-800"></i>
                    </span>
                </div>

            </div>
        </div>`).join('')}
    </div>`;
    },

    // ─────────────────────────────────────────────
    // UTILIDADES
    // ─────────────────────────────────────────────
    _renderTab(num, icon, label) {
        const active = this._pasoActual === num;
        const completed = num < this._pasoActual;
        return `
        <button onclick="window.productManager.irPaso(${num})"
                class="flex-1 py-6 flex flex-col items-center gap-1.5 border-b-4 transition-all
                       ${active ? 'border-blue-600 text-blue-600 bg-white'
                : completed ? 'border-blue-200 text-blue-400 hover:bg-slate-50'
                    : 'border-transparent text-slate-400 hover:bg-slate-50'}">
            <span class="material-symbols-outlined text-xl">${completed && !active ? 'check_circle' : icon}</span>
            <span class="text-[9px] font-black uppercase tracking-widest hidden sm:block">${label}</span>
        </button>`;
    },

    _alertError(mensaje) {
        Swal.fire({ toast: true, position: 'top-end', icon: 'error', title: mensaje, showConfirmButton: false, timer: 3500, timerProgressBar: true, background: '#fff1f2', color: '#be123c' });
    },

    cancelarEdicion() {
        Swal.fire({
            title: '¿Está Seguro de Salir?', text: 'Se perderán los cambios que no hayas guardado.',
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#2563eb', cancelButtonColor: '#64748b',
            confirmButtonText: 'SÍ, VOLVER AL LISTADO', cancelButtonText: 'CONTINUAR EDITANDO',
            reverseButtons: true,
            customClass: { confirmButton: 'rounded-2xl font-black text-[10px] uppercase px-8 py-4', cancelButton: 'rounded-2xl font-black text-[10px] uppercase px-8 py-4' }
        }).then(result => {
            if (result.isConfirmed) {
                if (this._mainContainer) this._mainContainer.innerHTML = this._originalContent;
                this._galeriaArchivos = [];
                this._portadaArchivo = { tipo: 'local', data: null, url: '' };
                this._categoriasSeleccionadas = [];
                this._sucursalesAsignadas = [];
                this._pasoActual = 1;
                if (typeof this._resolve === 'function') this._resolve(null);
            }
        });
    },

    injectStyles() {
        if (document.getElementById('nexus-pm-styles')) return;
        const style = document.createElement('style');
        style.id = 'nexus-pm-styles';
        style.innerHTML = `
            .custom-scrollbar::-webkit-scrollbar       { width: 5px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        `;
        document.head.appendChild(style);
    }
};

window.productManager = productManager;