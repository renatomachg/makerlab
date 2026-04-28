/**
 * js/modules/pipeline/pipeline.js
 * Módulo Pipeline - estado de órdenes
 *
 * Tabla `ordenes` esperada con columnas:
 *   id, contacto_id, estado, monto, lead_score, created_at
 *
 * Estados válidos: borrador | cotizado | confirmado | pagado | rechazado
 */

import { supabase } from '../../core/db.js';

const MOUNT_SELECTOR = '#module-container';

const ESTADOS_VALIDOS = ['borrador', 'cotizado', 'confirmado', 'pagado', 'rechazado'];

/* ===================================================
 * DATA
 * ================================================= */

/**
 * Carga todas las órdenes (más recientes primero).
 * Hace join ligero a contactos para mostrar el nombre del cliente.
 * @returns {Promise<Array>}
 */
export async function loadOrdenes() {
    try {
        const { data, error } = await supabase
            .from('ordenes')
            .select('*, contactos(nombre)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[pipeline] error cargando órdenes:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('[pipeline] excepción cargando órdenes:', err);
        return [];
    }
}

/**
 * Actualiza el estado de una orden.
 * @param {string|number} id
 * @param {string} estado - debe ser uno de ESTADOS_VALIDOS
 * @returns {Promise<{data, error}>}
 */
export async function updateOrdenEstado(id, estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
        const error = new Error('estado inválido: ' + estado);
        console.error('[pipeline]', error.message);
        return { data: null, error };
    }

    try {
        const res = await supabase
            .from('ordenes')
            .update({ estado })
            .eq('id', id)
            .select()
            .single();
        return res;
    } catch (err) {
        console.error('[pipeline] excepción actualizando estado:', err);
        return { data: null, error: err };
    }
}

/* ===================================================
 * RENDER
 * ================================================= */

function esc(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function fmtMoney(n) {
    const num = Number(n) || 0;
    return '$' + num.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function badgeForEstado(estado) {
    const map = {
        borrador: 'badge',
        cotizado: 'badge',
        confirmado: 'badge badge-warning',
        pagado: 'badge badge-success',
        rechazado: 'badge badge-danger'
    };
    const cls = map[estado] || 'badge';
    return '<span class="' + cls + '">' + esc(estado || '—') + '</span>';
}

/**
 * Pinta un score 0-100 con color según el rango.
 */
function renderLeadScore(score) {
    const n = Number(score);
    if (isNaN(n)) return '—';
    let cls = 'badge';
    if (n >= 70) cls = 'badge badge-success';
    else if (n >= 40) cls = 'badge badge-warning';
    else cls = 'badge badge-danger';
    return '<span class="' + cls + '">' + n + '</span>';
}

function renderTable(ordenes) {
    if (!ordenes.length) {
        return '<div class="card"><p>No hay órdenes en el pipeline.</p></div>';
    }

    let html = '';
    html += '<div class="table-wrapper"><table>';
    html += '  <thead><tr>';
    html += '    <th>Cliente</th><th>Monto</th><th>Estado</th><th>Lead score</th><th></th>';
    html += '  </tr></thead><tbody>';

    ordenes.forEach((o) => {
        const cliente = (o.contactos && o.contactos.nombre) || o.cliente || '—';
        html += '<tr>';
        html += '<td>' + esc(cliente) + '</td>';
        html += '<td>' + fmtMoney(o.monto) + '</td>';
        html += '<td>' + badgeForEstado(o.estado) + '</td>';
        html += '<td>' + renderLeadScore(o.lead_score) + '</td>';
        html += '<td>';
        html += '  <button class="btn btn-sm btn-secondary" data-action="view-orden" data-id="' + esc(o.id) + '">Ver</button> ';
        html += '  <button class="btn btn-sm btn-secondary" data-action="edit-orden" data-id="' + esc(o.id) + '">Editar</button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
}

function renderModule(ordenes) {
    let html = '';
    html += '<div class="page-header">';
    html += '  <h2>Pipeline</h2>';
    html += '</div>';
    html += renderTable(ordenes);
    return html;
}

/* ===================================================
 * INIT
 * ================================================= */

/**
 * Inicializa el módulo Pipeline: carga órdenes y renderiza la tabla.
 */
export async function initPipeline(mountSelector = MOUNT_SELECTOR) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[pipeline] no se encontró el contenedor:', mountSelector);
        return;
    }

    mount.innerHTML = '<div class="loader">Cargando pipeline…</div>';

    const ordenes = await loadOrdenes();
    mount.innerHTML = renderModule(ordenes);
}
