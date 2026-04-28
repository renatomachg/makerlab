/**
 * js/modules/crm/crm.js
 * Módulo CRM - gestión de contactos
 *
 * El chrome (header, botón "+ Nuevo Contacto") vive en index.html
 * dentro de #module-crm. Este módulo solo se encarga de:
 *   - Cargar contactos
 *   - Renderizar la TABLA en el div #crm-table
 *   - Cablear eventos de los botones (delegación)
 */

import { supabase } from '../../core/db.js';

/* Selector del div donde se monta la tabla. Se actualiza en initCRM
 * para que las recargas internas (después de delete, etc.) sepan
 * dónde re-renderizar.
 */
let currentMountSelector = '#crm-table';

/* ===================================================
 * DATA
 * ================================================= */

/**
 * Carga todos los contactos ordenados por nombre.
 * @returns {Promise<Array>}
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

/**
 * Crea un contacto nuevo.
 * @param {object} data - { nombre, email, empresa, ... }
 * @returns {Promise<{data, error}>}
 */
export async function createContacto(data) {
    try {
        return await supabase
            .from('contactos')
            .insert([data])
            .select()
            .single();
    } catch (err) {
        console.error('[crm] excepción creando contacto:', err);
        return { data: null, error: err };
    }
}

/* ===================================================
 * RENDER
 * ================================================= */

/** Escapa texto para usar en innerHTML. */
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
 * Renderiza la tabla de contactos dentro del mountSelector.
 * @param {Array} contactos
 * @param {string} mountSelector - selector CSS del div destino (ej. '#crm-table')
 */
export function renderContactosTable(contactos, mountSelector) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[crm] no se encontró el contenedor:', mountSelector);
        return;
    }

    if (!contactos || !contactos.length) {
        mount.innerHTML = '<div class="card"><p>No hay contactos todavía.</p></div>';
        bindTableEvents(mount);
        return;
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
    mount.innerHTML = html;

    bindTableEvents(mount);
}

/* ===================================================
 * EVENTOS
 * ================================================= */

/**
 * Cablea click delegado sobre la tabla. Idempotente:
 * usa dataset.bound para no duplicar listeners.
 */
function bindTableEvents(mount) {
    if (mount.dataset.bound === '1') return;
    mount.dataset.bound = '1';

    mount.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'edit-contacto') {
            // TODO: abrir modal de edición
            console.log('[crm] editar contacto:', id);
        } else if (action === 'delete-contacto') {
            if (!confirm('¿Eliminar este contacto?')) return;
            try {
                const { error } = await supabase
                    .from('contactos')
                    .delete()
                    .eq('id', id);
                if (error) {
                    alert('Error al eliminar: ' + (error.message || error));
                    return;
                }
                await refreshTable();
            } catch (err) {
                console.error('[crm] excepción eliminando:', err);
                alert('Error al eliminar.');
            }
        }
    });
}

/**
 * Cablea el botón "+ Nuevo Contacto" del HTML (#btn-new-contacto).
 * Idempotente.
 */
function bindNewButton() {
    const btn = document.getElementById('btn-new-contacto');
    if (!btn || btn.dataset.bound === '1') return;
    btn.dataset.bound = '1';

    btn.addEventListener('click', () => {
        // TODO: abrir modal de creación
        console.log('[crm] abrir modal nuevo contacto');
    });
}

/** Re-render interno tras una mutación. */
async function refreshTable() {
    const contactos = await loadContactos();
    renderContactosTable(contactos, currentMountSelector);
}

/* ===================================================
 * INIT
 * ================================================= */

/**
 * Inicializa el módulo CRM: carga contactos y renderiza la tabla.
 * @param {string} [mountSelector='#crm-table']
 */
export async function initCRM(mountSelector = '#crm-table') {
    currentMountSelector = mountSelector;

    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[crm] no se encontró el contenedor:', mountSelector);
        return;
    }

    mount.innerHTML = '<div class="loader">Cargando contactos…</div>';
    bindNewButton();

    const contactos = await loadContactos();
    renderContactosTable(contactos, mountSelector);
}
