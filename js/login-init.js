import { usuarioController } from './controllers/usuarioController.js';
import { supabase } from '../js/config/supabaseClient.js';

let redireccionEjecutada = false;

/**
 * Inicia el flujo de verificación de perfil y redirección.
 */
async function iniciarFlujoAcceso() {
    if (redireccionEjecutada) return;

    try {
        redireccionEjecutada = true;
        console.log("Iniciando flujo de acceso único...");
        await usuarioController.gestionarRedireccionInicial();
    } catch (error) {
        console.error("Error en iniciarFlujoAcceso:", error);
        // IMPORTANTE: Si falla, liberamos la bandera para permitir reintentos
        redireccionEjecutada = false;
    }
}

document.addEventListener('DOMContentLoaded', async () => {

    // 1. ESCUCHAR CAMBIOS DE AUTENTICACIÓN
    supabase.auth.onAuthStateChange(async (event, session) => {
        console.log("Evento Auth detectado:", event);

        if (session && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
            // Limpiamos el hash de la URL (el token que devuelve Supabase) 
            // para evitar que interfiera en futuras recargas
            if (window.location.hash) {
                window.history.replaceState(null, null, window.location.pathname);
                console.log("Token procesado y URL limpiada.");
            }

            if (!redireccionEjecutada) {
                await iniciarFlujoAcceso();
            }
        }

        if (event === 'SIGNED_OUT') {
            redireccionEjecutada = false;
            console.log("Sesión cerrada.");
        }
    });

    // 2. VERIFICACIÓN DE RESPALDO (Para sesiones ya activas al cargar)
    const { data: { session } } = await supabase.auth.getSession();
    if (session && !redireccionEjecutada) {
        await iniciarFlujoAcceso();
    }

    // --- EVENTOS DE UI ---
    const btnLogin = document.getElementById('btn-login');
    const btnGoogle = document.getElementById('btn-google-auth'); // <-- Verifica este ID en tu HTML
    const togglePass = document.getElementById('toggle-password');

    // Mostrar/Ocultar Password
    if (togglePass) {
        togglePass.addEventListener('click', () => {
            const input = document.getElementById('password');
            const icon = document.getElementById('password-icon');
            const isPass = input.type === 'password';
            input.type = isPass ? 'text' : 'password';
            icon.textContent = isPass ? 'visibility_off' : 'visibility';
        });
    }

    // Login Tradicional
    if (btnLogin) {
        btnLogin.addEventListener('click', async () => {
            const email = document.getElementById('email').value.trim();
            const pass = document.getElementById('password').value.trim();

            if (!email || !pass) {
                Swal.fire({ icon: 'warning', title: 'Campos incompletos', text: 'Por favor ingresa correo y contraseña.' });
                return;
            }
            await usuarioController.manejarLogin(email, pass);
        });
    }

    // Login Social (Google)
    if (btnGoogle) {
        btnGoogle.addEventListener('click', async () => {
            // Reiniciamos bandera para asegurar que el flujo se dispare al volver de Google
            redireccionEjecutada = false;
            
            // Llamamos al método actualizado del controller
            await usuarioController.manejarLoginSocial('google');
        });
    }
});