/**
 * js/modules/pipeline/pipeline.js
 * Módulo Pipeline - estado de órdenes
 *
 * El header vive en index.html (#module-pipeline).
 * Este módulo solo:
 *   - Carga las órdenes
 *   - Renderiza la TABLA en #pipeline-table
 *   - Cablea los eventos de cambio de estado (data-action="update-estado")
 *
 * Tabla `ordenes`:
 *   id, contacto_id, estado, monto, lead_score, created_at
 *
 * Estados válidos:
 *   borrador | cotizado | confirmado | pagado | rechazado
 */

import { supabase } from '../../core/db.js';

const ESTADOS_VALIDOS = ['borrador', 'cotizado', 'confirmado', 'pagado', 'rechazado'];

let currentMountSelector = '#pipeline-table';

/* ===================================================
 * DATA
 * ================================================= */

/**
 * Carga todas las órdenes (más recientes primero), con join
 * a contactos para mostrar el nombre del cliente.
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
 * Actualiza el estado de una orden, validando contra ESTADOS_VALIDOS.
 * @param {string|number} id
 * @param {string} estado
 * @returns {Promise<{data, error}>}
 */
export async function updateOrdenEstado(id, estado) {
    if (!ESTADOS_VALIDOS.includes(estado)) {
        const error = new Error('estado inválido: ' + estado);
        console.error('[pipeline]', error.message);
        return { data: null, error };
    }

    try {
        return await supabase
            .from('ordenes')
            .update({ estado })
            .eq('id', id)
            .select()
            .single();
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
        borrador:   'badge',
        cotizado:   'badge',
        confirmado: 'badge badge-warning',
        pagado:     'badge badge-success',
        rechazado:  'badge badge-danger'
    };
    const cls = map[estado] || 'badge';
    return '<span class="' + cls + '">' + esc(estado || '—') + '</span>';
}

function renderLeadScore(score) {
    const n = Number(score);
    if (isNaN(n)) return '—';
    let cls;
    if (n >= 70) cls = 'badge badge-success';
    else if (n >= 40) cls = 'badge badge-warning';
    else cls = 'badge badge-danger';
    return '<span class="' + cls + '">' + n + '</span>';
}

/**
 * Construye un <select> para cambiar el estado de una orden.
 * Cada opción lleva data-action="update-estado", data-id, data-estado.
 */
function renderEstadoSelect(orden) {
    let html = '<select class="estado-select" data-action="update-estado" data-id="' + esc(orden.id) + '">';
    ESTADOS_VALIDOS.forEach((est) => {
        const sel = est === orden.estado ? ' selected' : '';
        html += '<option value="' + esc(est) + '" data-estado="' + esc(est) + '"' + sel + '>' + esc(est) + '</option>';
    });
    html += '</select>';
    return html;
}

/**
 * Renderiza la tabla de órdenes dentro del mountSelector.
 */
export function renderOrdenesTable(ordenes, mountSelector) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[pipeline] no se encontró el contenedor:', mountSelector);
        return;
    }

    if (!ordenes || !ordenes.length) {
        mount.innerHTML = '<div class="card"><p>No hay órdenes en el pipeline.</p></div>';
        bindTableEvents(mount);
        return;
    }

    let html = '';
    html += '<div class="table-wrapper"><table>';
    html += '  <thead><tr>';
    html += '    <th>Cliente</th><th>Monto</th><th>Estado</th><th>Lead score</th><th>Cambiar estado</th><th></th>';
    html += '  </tr></thead><tbody>';

    ordenes.forEach((o) => {
        const cliente = (o.contactos && o.contactos.nombre) || '—';
        html += '<tr>';
        html += '<td>' + esc(cliente) + '</td>';
        html += '<td>' + fmtMoney(o.monto) + '</td>';
        html += '<td>' + badgeForEstado(o.estado) + '</td>';
        html += '<td>' + renderLeadScore(o.lead_score) + '</td>';
        html += '<td>' + renderEstadoSelect(o) + '</td>';
        html += '<td>';
        html += '  <button class="btn btn-sm btn-secondary" data-action="view-orden" data-id="' + esc(o.id) + '">Ver</button> ';
        html += '  <button class="btn btn-sm btn-secondary" data-action="edit-orden" data-id="' + esc(o.id) + '">Editar</button>';
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
 * Cablea eventos delegados sobre la tabla. Idempotente.
 *  - change en [data-action="update-estado"] → updateOrdenEstado
 *  - click  en [data-action="view-orden"|"edit-orden"] → stub
 */
function bindTableEvents(mount) {
    if (mount.dataset.bound === '1') return;
    mount.dataset.bound = '1';

    /* change → cambiar estado */
    mount.addEventListener('change', async (e) => {
        const sel = e.target.closest('[data-action="update-estado"]');
        if (!sel) return;

        const id = sel.dataset.id;
        const estado = sel.value;

        const { error } = await updateOrdenEstado(id, estado);
        if (error) {
            alert('Error al cambiar estado: ' + (error.message || error));
            return;
        }
        await refreshTable();
    });

    /* click → ver / editar (stubs por ahora) */
    mount.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'view-orden') {
            console.log('[pipeline] ver orden:', id);
        } else if (action === 'edit-orden') {
            console.log('[pipeline] editar orden:', id);
        }
    });
}

/** Re-render interno tras una mutación. */
async function refreshTable() {
    const ordenes = await loadOrdenes();
    renderOrdenesTable(ordenes, currentMountSelector);
}

/* ===================================================
 * INIT
 * ================================================= */

/**
 * Inicializa el módulo Pipeline.
 * @param {string} [mountSelector='#pipeline-table']
 */
export async function initPipeline(mountSelector = '#pipeline-table') {
    currentMountSelector = mountSelector;

    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[pipeline] no se encontró el contenedor:', mountSelector);
        return;
    }

    mount.innerHTML = '<div class="loader">Cargando pipeline…</div>';

    const ordenes = await loadOrdenes();
    renderOrdenesTable(ordenes, mountSelector);
}
