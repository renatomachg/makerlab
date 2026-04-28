/**
 * js/core/auth.js
 * Autenticación con Supabase Auth para Makerlab 1.0
 *
 * Mantiene los siguientes valores en localStorage:
 *   - auth_token : access_token de la sesión activa
 *   - user_id    : id del usuario autenticado
 *
 * Toda función async devuelve { data, error } o { error } cuando aplica,
 * siguiendo la convención del SDK de Supabase.
 */

import { supabase } from './db.js';

/* ---------------------------------------------------
 * Claves de localStorage
 * ------------------------------------------------- */
const LS_TOKEN = 'auth_token';
const LS_USER_ID = 'user_id';

/* ---------------------------------------------------
 * Helpers internos para sincronizar localStorage
 * ------------------------------------------------- */
function persistSession(session) {
    if (session && session.access_token) {
        localStorage.setItem(LS_TOKEN, session.access_token);
    }
    if (session && session.user && session.user.id) {
        localStorage.setItem(LS_USER_ID, session.user.id);
    }
}

function clearSession() {
    localStorage.removeItem(LS_TOKEN);
    localStorage.removeItem(LS_USER_ID);
}

/* ===================================================
 * SIGN UP - registro de usuario
 * ================================================= */

/**
 * Registra un nuevo usuario con email y contraseña.
 * No autologuea hasta que el usuario confirme su email
 * (depende de la configuración del proyecto Supabase).
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data, error}>}
 */
export async function signUp(email, password) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password
    });

    // Si el proyecto no exige confirmación de email, ya viene la sesión
    if (!error && data && data.session) {
        persistSession(data.session);
    }

    return { data, error };
}

/* ===================================================
 * SIGN IN - login
 * ================================================= */

/**
 * Inicia sesión con email y contraseña.
 * Guarda auth_token y user_id en localStorage al éxito.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data, error}>}
 */
export async function signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (!error && data && data.session) {
        persistSession(data.session);
    }

    return { data, error };
}

/* ===================================================
 * SIGN OUT - logout
 * ================================================= */

/**
 * Cierra sesión y limpia localStorage.
 * @returns {Promise<{error}>}
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    clearSession();
    return { error };
}

/* ===================================================
 * GET CURRENT USER
 * ================================================= */

/**
 * Devuelve el estado actual de sesión leyendo localStorage.
 * No hace request a Supabase (lectura síncrona y barata).
 * @returns {{ token: string|null, user_id: string|null, isLoggedIn: boolean }}
 */
export function getCurrentUser() {
    const token = localStorage.getItem(LS_TOKEN);
    const user_id = localStorage.getItem(LS_USER_ID);

    return {
        token,
        user_id,
        isLoggedIn: Boolean(token && user_id)
    };
}

/* ===================================================
 * AUTH STATE CHANGE
 * ================================================= */

/**
 * Suscribe un callback a los cambios de estado de auth.
 * El callback recibe (isLoggedIn: boolean, user: object|null).
 *
 * También sincroniza localStorage automáticamente para que
 * los cambios externos (refresh de token, logout en otra pestaña)
 * se reflejen en auth_token / user_id.
 *
 * @param {(isLoggedIn: boolean, user: object|null) => void} callback
 * @returns {{ data: { subscription }, unsubscribe: () => void }}
 *          Suscripción de Supabase + helper unsubscribe().
 */
export function onAuthStateChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (session) {
            persistSession(session);
        } else {
            clearSession();
        }

        const isLoggedIn = Boolean(session && session.access_token);
        const user = session ? session.user : null;

        try {
            callback(isLoggedIn, user);
        } catch (e) {
            console.error('[auth] error en callback onAuthStateChange:', e);
        }
    });

    return {
        data,
        unsubscribe: () => {
            if (data && data.subscription && typeof data.subscription.unsubscribe === 'function') {
                data.subscription.unsubscribe();
            }
        }
    };
}
