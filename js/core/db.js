/**
 * js/core/db.js
 * Conexión a Supabase + funciones CRUD para Makerlab 1.0
 *
 * Tablas asumidas:
 *   - empresas
 *   - contactos      (FK: empresa_id)
 *   - ordenes        (filtros varios)
 *   - cotizaciones   (filtros varios)
 *   - actividades    (FK: contacto_id)
 *
 * Todas las funciones son async y retornan { data, error }
 * (mismo shape que devuelve el SDK de Supabase).
 */

/* Supabase se carga vía UMD desde CDN en index.html y queda
 * expuesto en window.supabase. Tomamos createClient desde ahí. */
const { createClient } = window.supabase;

/* ---------------------------------------------------
 * Configuración
 * TODO: mover a variables de entorno (.env) en prod
 * ------------------------------------------------- */
const SUPABASE_URL = 'https://lefbyxdqvurhgbspwhbc.supabase.co';
const SUPABASE_ANON_KEY = 'REPLACE_WITH_ANON_KEY'; // demo - reemplazar

/* ---------------------------------------------------
 * Cliente Supabase (singleton exportado)
 * ------------------------------------------------- */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    }
});

/* ===================================================
 * EMPRESAS
 * ================================================= */

/**
 * Lista todas las empresas ordenadas por nombre.
 * @returns {Promise<{data, error}>}
 */
export async function getEmpresas() {
    return await supabase
        .from('empresas')
        .select('*')
        .order('nombre', { ascending: true });
}

/**
 * Crea una nueva empresa.
 * @param {object} data - Campos de la empresa.
 * @returns {Promise<{data, error}>}
 */
export async function createEmpresa(data) {
    return await supabase
        .from('empresas')
        .insert([data])
        .select()
        .single();
}

/**
 * Actualiza una empresa por id.
 * @param {string|number} id
 * @param {object} data - Campos a actualizar.
 * @returns {Promise<{data, error}>}
 */
export async function updateEmpresa(id, data) {
    return await supabase
        .from('empresas')
        .update(data)
        .eq('id', id)
        .select()
        .single();
}

/**
 * Elimina una empresa por id.
 * @param {string|number} id
 * @returns {Promise<{data, error}>}
 */
export async function deleteEmpresa(id) {
    return await supabase
        .from('empresas')
        .delete()
        .eq('id', id);
}

/* ===================================================
 * CONTACTOS
 * ================================================= */

/**
 * Lista contactos. Si se pasa empresa_id, filtra por esa empresa.
 * @param {string|number} [empresa_id]
 * @returns {Promise<{data, error}>}
 */
export async function getContactos(empresa_id) {
    let query = supabase
        .from('contactos')
        .select('*')
        .order('nombre', { ascending: true });

    if (empresa_id !== undefined && empresa_id !== null) {
        query = query.eq('empresa_id', empresa_id);
    }

    return await query;
}

/**
 * Crea un nuevo contacto.
 * @param {object} data
 * @returns {Promise<{data, error}>}
 */
export async function createContacto(data) {
    return await supabase
        .from('contactos')
        .insert([data])
        .select()
        .single();
}

/**
 * Actualiza un contacto por id.
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise<{data, error}>}
 */
export async function updateContacto(id, data) {
    return await supabase
        .from('contactos')
        .update(data)
        .eq('id', id)
        .select()
        .single();
}

/**
 * Elimina un contacto por id.
 * @param {string|number} id
 * @returns {Promise<{data, error}>}
 */
export async function deleteContacto(id) {
    return await supabase
        .from('contactos')
        .delete()
        .eq('id', id);
}

/* ===================================================
 * ORDENES
 * ================================================= */

/**
 * Lista órdenes. Acepta un objeto de filtros opcional:
 *   { estado, cliente_id, fecha_desde, fecha_hasta }
 * @param {object} [filters]
 * @returns {Promise<{data, error}>}
 */
export async function getOrdenes(filters = {}) {
    let query = supabase
        .from('ordenes')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.estado) {
        query = query.eq('estado', filters.estado);
    }
    if (filters.cliente_id) {
        query = query.eq('cliente_id', filters.cliente_id);
    }
    if (filters.fecha_desde) {
        query = query.gte('fecha', filters.fecha_desde);
    }
    if (filters.fecha_hasta) {
        query = query.lte('fecha', filters.fecha_hasta);
    }

    return await query;
}

/**
 * Crea una nueva orden.
 * @param {object} data
 * @returns {Promise<{data, error}>}
 */
export async function createOrden(data) {
    return await supabase
        .from('ordenes')
        .insert([data])
        .select()
        .single();
}

/**
 * Actualiza una orden por id.
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise<{data, error}>}
 */
export async function updateOrden(id, data) {
    return await supabase
        .from('ordenes')
        .update(data)
        .eq('id', id)
        .select()
        .single();
}

/**
 * Elimina una orden por id.
 * @param {string|number} id
 * @returns {Promise<{data, error}>}
 */
export async function deleteOrden(id) {
    return await supabase
        .from('ordenes')
        .delete()
        .eq('id', id);
}

/* ===================================================
 * COTIZACIONES
 * ================================================= */

/**
 * Lista cotizaciones. Acepta un objeto de filtros opcional:
 *   { estado, cliente_id, fecha_desde, fecha_hasta }
 * @param {object} [filters]
 * @returns {Promise<{data, error}>}
 */
export async function getCotizaciones(filters = {}) {
    let query = supabase
        .from('cotizaciones')
        .select('*')
        .order('created_at', { ascending: false });

    if (filters.estado) {
        query = query.eq('estado', filters.estado);
    }
    if (filters.cliente_id) {
        query = query.eq('cliente_id', filters.cliente_id);
    }
    if (filters.fecha_desde) {
        query = query.gte('fecha', filters.fecha_desde);
    }
    if (filters.fecha_hasta) {
        query = query.lte('fecha', filters.fecha_hasta);
    }

    return await query;
}

/**
 * Crea una nueva cotización.
 * @param {object} data
 * @returns {Promise<{data, error}>}
 */
export async function createCotizacion(data) {
    return await supabase
        .from('cotizaciones')
        .insert([data])
        .select()
        .single();
}

/**
 * Actualiza una cotización por id.
 * @param {string|number} id
 * @param {object} data
 * @returns {Promise<{data, error}>}
 */
export async function updateCotizacion(id, data) {
    return await supabase
        .from('cotizaciones')
        .update(data)
        .eq('id', id)
        .select()
        .single();
}

/**
 * Elimina una cotización por id.
 * @param {string|number} id
 * @returns {Promise<{data, error}>}
 */
export async function deleteCotizacion(id) {
    return await supabase
        .from('cotizaciones')
        .delete()
        .eq('id', id);
}

/* ===================================================
 * ACTIVIDADES
 * ================================================= */

/**
 * Lista actividades de un contacto, más recientes primero.
 * @param {string|number} contacto_id
 * @returns {Promise<{data, error}>}
 */
export async function getActividades(contacto_id) {
    return await supabase
        .from('actividades')
        .select('*')
        .eq('contacto_id', contacto_id)
        .order('created_at', { ascending: false });
}

/**
 * Crea una nueva actividad.
 * @param {object} data
 * @returns {Promise<{data, error}>}
 */
export async function createActividad(data) {
    return await supabase
        .from('actividades')
        .insert([data])
        .select()
        .single();
}
