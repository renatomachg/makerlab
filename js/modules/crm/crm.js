/**
 * js/modules/crm/crm.js
 * Módulo CRM - gestión de contactos
 *
 * Renderiza una tabla con los contactos guardados en Supabase
 * y permite crearlos. Las acciones de editar/eliminar quedan
 * cableadas a botones (los handlers se exponen vía data-* para
 * que la app principal los ate).
 */

import { supabase } from '../../core/db.js';

/**
 * id del nodo donde se monta el módulo CRM.
 * El index.html ya tiene <div id="module-container">, pero
 * dejamos un selector configurable por si cambia.
 */
const MOUNT_SELECTOR = '#module-container';

/* ===================================================
 * DATA: lectura
 * ================================================= */

/**
 * Carga todos los contactos desde Supabase.
 * @returns {Promise<Array>} arreglo de contactos (vacío si error)
 */
export async function loadContactos() {
    try {
        const { data, error } = await supabase
            .from('contactos')
            .select('*')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('[crm] error cargando contactos:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('[crm] excepción cargando contactos:', err);
        return [];
    }
}

/* ===================================================
 * DATA: escritura
 * ================================================= */

/**
 * Crea un contacto nuevo.
 * @param {object} data - { nombre, email, empresa, ... }
 * @returns {Promise<{data, error}>}
 */
export async function createContacto(data) {
    try {
        const res = await supabase
            .from('contactos')
            .insert([data])
            .select()
            .single();
        return res;
    } catch (err) {
        console.error('[crm] excepción creando contacto:', err);
        return { data: null, error: err };
    }
}

/* ===================================================
 * RENDER
 * ================================================= */

/**
 * Escapa texto para evitar inyección al meterlo en innerHTML.
 */
function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Construye el HTML de la tabla de contactos.
 */
function renderTable(contactos) {
    if (!contactos.length) {
        return '<div class="card"><p>No hay contactos todavía.</p></div>';
    }

    let html = '';
    html += '<div class="table-wrapper"><table>';
    html += '  <thead><tr>';
    html += '    <th>Nombre</th><th>Email</th><th>Empresa</th><th></th>';
    html += '  </tr></thead><tbody>';

    contactos.forEach((c) => {
        html += '<tr>';
        html += '<td>' + esc(c.nombre) + '</td>';
        html += '<td>' + esc(c.email) + '</td>';
        html += '<td>' + esc(c.empresa || '') + '</td>';
        html += '<td>';
        html += '  <button class="btn btn-sm btn-secondary" data-action="edit-contacto" data-id="' + esc(c.id) + '">Editar</button> ';
        html += '  <button class="btn btn-sm btn-danger" data-action="delete-contacto" data-id="' + esc(c.id) + '">Eliminar</button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
}

/**
 * Construye el bloque entero del módulo (header + tabla).
 */
function renderModule(contactos) {
    let html = '';
    html += '<div class="page-header">';
    html += '  <h2>CRM - Contactos</h2>';
    html += '  <button class="btn btn-primary" data-action="new-contacto">+ Nuevo contacto</button>';
    html += '</div>';
    html += renderTable(contactos);
    return html;
}

/* ===================================================
 * INIT
 * ================================================= */

/**
 * Inicializa el módulo CRM: carga contactos y los renderiza.
 * @param {string} [mountSelector] - selector CSS donde montar (default #module-container)
 */
export async function initCRM(mountSelector = MOUNT_SELECTOR) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[crm] no se encontró el contenedor:', mountSelector);
        return;
    }

    mount.innerHTML = '<div class="loader">Cargando contactos…</div>';

    const contactos = await loadContactos();
    mount.innerHTML = renderModule(contactos);
}
