/**
 * js/modules/cotizador/cotizador.js
 * Módulo Cotizador - alta/edición y listado de cotizaciones
 *
 * El form (#cotizador-form) y los inputs viven en index.html.
 * Este módulo se encarga de:
 *   - Poblar el <select id="cot-cliente">
 *   - Cablear los eventos del form (#btn-save-cot, change de cliente)
 *   - Cargar cotizaciones y renderizar la TABLA en #cotizador-table
 *   - Cablear botones de la tabla (edit-cot / delete-cot)
 *
 * Tabla `cotizaciones`:
 *   id, contacto_id, estado, monto, detalles (jsonb), created_at
 * El campo `detalles` se guarda como { items: [{ descripcion, cantidad, precio }, ...] }
 */

import { supabase } from '../../core/db.js';

let currentMountSelector = '#cotizador-table';

/* ===================================================
 * DATA
 * ================================================= */

/**
 * Carga todas las cotizaciones (más recientes primero), con join
 * a contactos para mostrar el nombre del cliente.
 */
export async function loadCotizaciones() {
    try {
        const { data, error } = await supabase
            .from('cotizaciones')
            .select('*, contactos(nombre)')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[cotizador] error cargando cotizaciones:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('[cotizador] excepción cargando cotizaciones:', err);
        return [];
    }
}

/** Carga contactos para poblar el <select id="cot-cliente">. */
async function loadContactosParaSelect() {
    try {
        const { data, error } = await supabase
            .from('contactos')
            .select('id, nombre')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('[cotizador] error cargando contactos:', error);
            return [];
        }
        return data || [];
    } catch (err) {
        console.error('[cotizador] excepción cargando contactos:', err);
        return [];
    }
}

/**
 * Inserta o actualiza una cotización.
 * - Si data.id existe → UPDATE
 * - Si no             → INSERT con estado por defecto 'borrador'
 *
 * @param {object} data - { id?, contacto_id, estado, monto, detalles: {items: [...]} }
 * @returns {Promise<{data, error}>}
 */
export async function saveCotizacion(data) {
    try {
        if (data && data.id) {
            const { id, ...rest } = data;
            return await supabase
                .from('cotizaciones')
                .update(rest)
                .eq('id', id)
                .select()
                .single();
        }

        const payload = {
            contacto_id: data.contacto_id,
            estado: data.estado || 'borrador',
            monto: data.monto,
            detalles: data.detalles || { items: [] }
        };

        return await supabase
            .from('cotizaciones')
            .insert([payload])
            .select()
            .single();
    } catch (err) {
        console.error('[cotizador] excepción guardando cotización:', err);
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
        enviada: 'badge',
        aceptada: 'badge badge-success',
        rechazada: 'badge badge-danger',
        pendiente: 'badge badge-warning'
    };
    const cls = map[estado] || 'badge';
    return '<span class="' + cls + '">' + esc(estado || '—') + '</span>';
}

/**
 * Renderiza la tabla de cotizaciones dentro del mountSelector.
 */
export function renderCotizacionesTable(cotizaciones, mountSelector) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[cotizador] no se encontró el contenedor:', mountSelector);
        return;
    }

    if (!cotizaciones || !cotizaciones.length) {
        mount.innerHTML = '<div class="card"><p>No hay cotizaciones todavía.</p></div>';
        bindTableEvents(mount);
        return;
    }

    let html = '';
    html += '<div class="table-wrapper"><table>';
    html += '  <thead><tr>';
    html += '    <th>Cliente</th><th>Monto</th><th>Estado</th><th></th>';
    html += '  </tr></thead><tbody>';

    cotizaciones.forEach((c) => {
        const cliente = (c.contactos && c.contactos.nombre) || '—';
        html += '<tr>';
        html += '<td>' + esc(cliente) + '</td>';
        html += '<td>' + fmtMoney(c.monto) + '</td>';
        html += '<td>' + badgeForEstado(c.estado) + '</td>';
        html += '<td>';
        html += '  <button class="btn btn-sm btn-secondary" data-action="edit-cot" data-id="' + esc(c.id) + '">Editar</button> ';
        html += '  <button class="btn btn-sm btn-danger" data-action="delete-cot" data-id="' + esc(c.id) + '">Eliminar</button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    mount.innerHTML = html;

    bindTableEvents(mount);
}

/* ===================================================
 * EVENTOS DE TABLA
 * ================================================= */

function bindTableEvents(mount) {
    if (mount.dataset.bound === '1') return;
    mount.dataset.bound = '1';

    mount.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'edit-cot') {
            await fillFormForEdit(id);
        } else if (action === 'delete-cot') {
            if (!confirm('¿Eliminar esta cotización?')) return;
            try {
                const { error } = await supabase
                    .from('cotizaciones')
                    .delete()
                    .eq('id', id);
                if (error) {
                    alert('Error al eliminar: ' + (error.message || error));
                    return;
                }
                await refreshTable();
            } catch (err) {
                console.error('[cotizador] excepción eliminando:', err);
                alert('Error al eliminar.');
            }
        }
    });
}

/**
 * Llena el form (#cotizador-form) con los datos de la cotización
 * indicada y la marca como "en edición" vía form.dataset.editId.
 */
async function fillFormForEdit(id) {
    try {
        const { data, error } = await supabase
            .from('cotizaciones')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            console.error('[cotizador] no se pudo cargar para editar:', error);
            return;
        }

        const form = document.getElementById('cotizador-form');
        if (!form) return;

        form.querySelector('#cot-cliente').value = data.contacto_id || '';
        form.querySelector('#cot-monto').value = data.monto || '';
        const items = (data.detalles && data.detalles.items) || [];
        form.querySelector('#cot-items').value = JSON.stringify(items, null, 2);
        form.dataset.editId = data.id;

        // Disparar change para refrescar dataset.clienteNombre
        form.querySelector('#cot-cliente').dispatchEvent(new Event('change'));
    } catch (err) {
        console.error('[cotizador] excepción cargando para edición:', err);
    }
}

/* ===================================================
 * EVENTOS DEL FORM (existente en HTML)
 * ================================================= */

/** Pobla el <select id="cot-cliente"> con los contactos. */
async function populateClientesSelect() {
    const select = document.getElementById('cot-cliente');
    if (!select) return;

    const contactos = await loadContactosParaSelect();

    let html = '<option value="">Selecciona un cliente…</option>';
    contactos.forEach((c) => {
        html += '<option value="' + esc(c.id) + '" data-nombre="' + esc(c.nombre) + '">' + esc(c.nombre) + '</option>';
    });
    select.innerHTML = html;
}

/**
 * Cablea los eventos del form (idempotente).
 *  - submit / click en #btn-save-cot → saveCotizacion
 *  - change en #cot-cliente → guarda nombre seleccionado en form.dataset
 */
function bindFormEvents() {
    const form = document.getElementById('cotizador-form');
    if (!form || form.dataset.bound === '1') return;
    form.dataset.bound = '1';

    const select = form.querySelector('#cot-cliente');
    const errorEl = form.querySelector('#cot-error');

    /* change cliente: rellenar nombre seleccionado en el form */
    if (select) {
        select.addEventListener('change', () => {
            const opt = select.options[select.selectedIndex];
            const nombre = opt && opt.dataset.nombre ? opt.dataset.nombre : '';
            form.dataset.clienteNombre = nombre;
        });
    }

    /* submit: validar, armar payload y guardar */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (errorEl) errorEl.textContent = '';

        const contacto_id = form.querySelector('#cot-cliente').value;
        const monto = parseFloat(form.querySelector('#cot-monto').value);
        const itemsRaw = form.querySelector('#cot-items').value.trim();

        if (!contacto_id || isNaN(monto)) {
            if (errorEl) errorEl.textContent = 'Cliente y monto son obligatorios.';
            return;
        }

        let items = [];
        if (itemsRaw) {
            try {
                items = JSON.parse(itemsRaw);
                if (!Array.isArray(items)) throw new Error('items debe ser un array');
            } catch (parseErr) {
                if (errorEl) errorEl.textContent = 'Items: JSON inválido (' + parseErr.message + ')';
                return;
            }
        }

        const payload = {
            contacto_id,
            estado: 'borrador',
            monto,
            detalles: { items }
        };
        if (form.dataset.editId) {
            payload.id = form.dataset.editId;
        }

        const { error } = await saveCotizacion(payload);
        if (error) {
            if (errorEl) errorEl.textContent = 'Error: ' + (error.message || 'no se pudo guardar');
            return;
        }

        form.reset();
        delete form.dataset.editId;
        delete form.dataset.clienteNombre;
        await refreshTable();
    });
}

/** Re-render interno tras una mutación. */
async function refreshTable() {
    const cotizaciones = await loadCotizaciones();
    renderCotizacionesTable(cotizaciones, currentMountSelector);
}

/* ===================================================
 * INIT
 * ================================================= */

/**
 * Inicializa el módulo Cotizador.
 * @param {string} [mountSelector='#cotizador-table']
 */
export async function initCotizador(mountSelector = '#cotizador-table') {
    currentMountSelector = mountSelector;

    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[cotizador] no se encontró el contenedor:', mountSelector);
        return;
    }

    mount.innerHTML = '<div class="loader">Cargando cotizaciones…</div>';

    // Poblar select y enganchar handlers (idempotente)
    await populateClientesSelect();
    bindFormEvents();

    const cotizaciones = await loadCotizaciones();
    renderCotizacionesTable(cotizaciones, mountSelector);
}
