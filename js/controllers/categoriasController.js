import { categoriasModel } from '../models/categoriasModel.js';
import { configuracionColumnasController } from './configuracionColumnasController.js';
import { categoriasView } from '../views/categoriasView.js';

export const categoriasController = {
    // Definimos las columnas que el código necesita pero el usuario no debe configurar
    COLUMNAS_TECNICAS: ['id', 'visible'],

    COLUMNAS_PADRES: ['id', 'nombre', 'visible'],
    COLUMNAS_HIJOS: ['id', 'nombre', 'categoria_padre', 'visible'],
    REF_PADRES: 'categorias_padre',
    REF_HIJOS: 'subcategorias',

    _datosPadres: [],
    _datosHijos: [],
    _colsPadres: [],
    _colsHijos: [],

    async inicializar(pestanaPorDefecto = 'categorias') {
        try {
            // Usamos la notificación de la vista para mantener consistencia visual
            categoriasView.mostrarCargando('Cargando catálogo...');

            // 1. Cargar configuración de columnas
            this._colsPadres = await configuracionColumnasController.obtenerColumnasVisibles(this.REF_PADRES, ['nombre']);
            this._colsHijos = await configuracionColumnasController.obtenerColumnasVisibles(this.REF_HIJOS, ['nombre', 'categoria_padre']);

            // 2. Cargar datos desde el modelo
            const todas = await categoriasModel.obtenerTodas();
            this._datosPadres = todas.filter(c => !c.id_padre);
            this._datosHijos = todas.filter(c => c.id_padre);

            // 3. Sincronizar la pestaña en el estado de la vista
            categoriasView._estado.pestanaActiva = pestanaPorDefecto;

            // 4. Renderizar
            this.refrescarVista();

            Swal.close();
        } catch (error) {
            console.error("Error al inicializar:", error);
            categoriasView.notificarError('No se pudieron cargar los datos.');
        }
    },

    /**
     * REFRESCO DE VISTA
     */
    refrescarVista() {
        // Pasamos los datos completos; la vista hará el .slice() de la paginación internamente
        categoriasView.render(
            this._datosPadres, 
            this._colsPadres, 
            this._datosHijos, 
            this._colsHijos
        );
        
        // Mantenemos tus configuraciones de eventos
        this._setupEventListeners();
        this._setupTabLogic(); 
    },

    async verDetalle(id) {
        const registro = await categoriasModel.obtenerPorId(id);
        if (registro) {
            categoriasView.mostrarDetalle(registro);
        }
    },

    async eliminarRegistro(id) {
        const res = await categoriasModel.eliminar(id);
        if (res.exito) {
            categoriasView.notificarExito('Registro eliminado correctamente');
            // Recargamos manteniendo la pestaña actual del estado de la vista
            this.inicializar(categoriasView._estado.pestanaActiva); 
        } else {
            categoriasView.notificarError(res.mensaje);
        }
    },

    async mostrarFormularioCreacion(tipo) {
        // Informamos a la vista en qué pestaña estamos antes de abrir el form
        categoriasView._estado.pestanaActiva = (tipo === 'padre') ? 'categorias' : 'subcategorias';

        const datos = await categoriasView.mostrarFormulario({
            titulo: tipo === 'padre' ? 'Nueva Categoría Principal' : 'Nueva Subcategoría',
            categoriasPadre: this._datosPadres
        });

        if (datos) {
            const res = await categoriasModel.crear(datos);
            if (res.exito) {
                this.inicializar(categoriasView._estado.pestanaActiva);
                categoriasView.notificarExito('Registro creado con éxito');
            } else {
                categoriasView.notificarError('No se pudo crear el registro');
            }
        }
    },

    async editar(id) {
        const registro = await categoriasModel.obtenerPorId(id);
        const padresDisponibles = this._datosPadres.filter(c => c.id !== id);

        // Si el registro tiene id_padre, es una subcategoría
        categoriasView._estado.pestanaActiva = registro.id_padre ? 'subcategorias' : 'categorias';

        const nuevosDatos = await categoriasView.mostrarFormulario({
            titulo: 'Editar Registro',
            nombre: registro.nombre,
            id_padre: registro.id_padre,
            categoriasPadre: padresDisponibles 
        });

        if (nuevosDatos) {
            const res = await categoriasModel.actualizar(id, nuevosDatos);
            if (res.exito) {
                this.inicializar(categoriasView._estado.pestanaActiva);
                categoriasView.notificarExito('Cambios guardados correctamente');
            } else {
                categoriasView.notificarError('Error al actualizar');
            }
        }
    },

    // --- LÓGICA DE INTERFAZ Y EVENTOS (Mantenida intacta) ---

    activarPestanaSubcategorias() {
        const btnSub = document.getElementById('tab-subcategorias');
        const btnCat = document.getElementById('tab-categorias');
        const secSub = document.getElementById('seccion-subcategorias');
        const secCat = document.getElementById('seccion-categorias');
        if (btnSub && secSub) {
            this._ejecutarCambioVisualPestana(btnSub, btnCat, secSub, secCat);
            categoriasView._estado.pestanaActiva = 'subcategorias';
        }
    },

    _setupTabLogic() {
        const btnCat = document.getElementById('tab-categorias');
        const btnSub = document.getElementById('tab-subcategorias');
        const secCat = document.getElementById('seccion-categorias');
        const secSub = document.getElementById('seccion-subcategorias');
        
        if (!btnCat || !btnSub) return;

        btnCat.onclick = () => {
            this._ejecutarCambioVisualPestana(btnCat, btnSub, secCat, secSub);
            categoriasView._estado.pestanaActiva = 'categorias';
        };
        btnSub.onclick = () => {
            this._ejecutarCambioVisualPestana(btnSub, btnCat, secSub, secCat);
            categoriasView._estado.pestanaActiva = 'subcategorias';
        };
    },

    _ejecutarCambioVisualPestana(activeBtn, inactiveBtn, showSec, hideSec) {
        activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-sm', 'active');
        activeBtn.classList.remove('text-slate-500');
        inactiveBtn.classList.remove('bg-white', 'text-blue-600', 'shadow-sm', 'active');
        inactiveBtn.classList.add('text-slate-500');
        showSec.classList.remove('hidden');
        hideSec.classList.add('hidden');
    },

    _setupEventListeners() {
        const configCat = document.getElementById('btn-config-cat');
        const nuevaCat = document.getElementById('btn-nueva-cat');
        const configSub = document.getElementById('btn-config-sub');
        const nuevaSub = document.getElementById('btn-nueva-sub');

        if (configCat) configCat.onclick = () => this.abrirConfiguracionColumnas(this.REF_PADRES, this.COLUMNAS_PADRES);
        if (nuevaCat) nuevaCat.onclick = () => this.mostrarFormularioCreacion('padre');
        if (configSub) configSub.onclick = () => this.abrirConfiguracionColumnas(this.REF_HIJOS, this.COLUMNAS_HIJOS);
        if (nuevaSub) nuevaSub.onclick = () => this.mostrarFormularioCreacion('hijo');
    },

    async abrirConfiguracionColumnas(tablaRef, columnasTotales) {
        // Filtrar las columnas para el selector: No mostramos 'id' ni 'visible'
        const columnasParaMostrarAlOwner = columnasTotales.filter(col => !this.COLUMNAS_TECNICAS.includes(col));

        await configuracionColumnasController.abrirSelectorColumnas(tablaRef, columnasParaMostrarAlOwner, () => {
            this.inicializar(categoriasView._estado.pestanaActiva);
        });
    }
};

window.categoriasController = categoriasController;