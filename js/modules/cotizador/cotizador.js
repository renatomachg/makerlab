/**
 * js/modules/cotizador/cotizador.js
 * Módulo Cotizador - alta/edición y listado de cotizaciones
 *
 * Tabla `cotizaciones` esperada con columnas:
 *   id, contacto_id, estado, monto, detalles (jsonb), created_at
 *
 * El campo `detalles` se guarda como objeto JSON con la forma:
 *   { items: [{ descripcion, cantidad, precio }, ...] }
 */

import { supabase } from '../../core/db.js';

const MOUNT_SELECTOR = '#module-container';

/* ===================================================
 * DATA
 * ================================================= */

/**
 * Carga todas las cotizaciones (más recientes primero).
 * Hace join ligero a contactos para mostrar el nombre del cliente.
 * @returns {Promise<Array>}
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

/**
 * Carga la lista de contactos para poblar el <select> de cliente.
 */
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
 * - Si no                 → INSERT con estado por defecto 'borrador'
 *
 * @param {object} data - { id?, contacto_id, estado, monto, detalles: {items: [...]} }
 * @returns {Promise<{data, error}>}
 */
export async function saveCotizacion(data) {
    try {
        if (data && data.id) {
            const { id, ...rest } = data;
            const res = await supabase
                .from('cotizaciones')
                .update(rest)
                .eq('id', id)
                .select()
                .single();
            return res;
        }

        // INSERT
        const payload = {
            contacto_id: data.contacto_id,
            estado: data.estado || 'borrador',
            monto: data.monto,
            detalles: data.detalles || { items: [] }
        };

        const res = await supabase
            .from('cotizaciones')
            .insert([payload])
            .select()
            .single();
        return res;
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

function renderTable(cotizaciones) {
    if (!cotizaciones.length) {
        return '<div class="card"><p>No hay cotizaciones todavía.</p></div>';
    }

    let html = '';
    html += '<div class="table-wrapper"><table>';
    html += '  <thead><tr>';
    html += '    <th>Cliente</th><th>Monto</th><th>Estado</th><th></th>';
    html += '  </tr></thead><tbody>';

    cotizaciones.forEach((c) => {
        const cliente = (c.contactos && c.contactos.nombre) || c.cliente || '—';
        html += '<tr>';
        html += '<td>' + esc(cliente) + '</td>';
        html += '<td>' + fmtMoney(c.monto) + '</td>';
        html += '<td>' + badgeForEstado(c.estado) + '</td>';
        html += '<td>';
        html += '  <button class="btn btn-sm btn-secondary" data-action="edit-cotizacion" data-id="' + esc(c.id) + '">Editar</button> ';
        html += '  <button class="btn btn-sm btn-danger" data-action="delete-cotizacion" data-id="' + esc(c.id) + '">Eliminar</button>';
        html += '</td>';
        html += '</tr>';
    });

    html += '</tbody></table></div>';
    return html;
}

function renderForm(contactos) {
    let options = '<option value="">Selecciona un cliente…</option>';
    contactos.forEach((c) => {
        options += '<option value="' + esc(c.id) + '">' + esc(c.nombre) + '</option>';
    });

    let html = '';
    html += '<div class="card">';
    html += '  <h3>Nueva cotización</h3>';
    html += '  <form id="cotizador-form">';
    html += '    <div class="form-group">';
    html += '      <label for="cot-cliente">Cliente</label>';
    html += '      <select id="cot-cliente" name="contacto_id" required>' + options + '</select>';
    html += '    </div>';
    html += '    <div class="form-group">';
    html += '      <label for="cot-monto">Monto</label>';
    html += '      <input type="number" step="0.01" min="0" id="cot-monto" name="monto" required>';
    html += '    </div>';
    html += '    <div class="form-group">';
    html += '      <label for="cot-items">Items (JSON)</label>';
    html += '      <textarea id="cot-items" name="items" rows="4" placeholder=\'[{"descripcion":"Servicio","cantidad":1,"precio":1000}]\'></textarea>';
    html += '    </div>';
    html += '    <button type="submit" class="btn btn-primary">Guardar</button>';
    html += '    <p class="error-msg" id="cot-error"></p>';
    html += '  </form>';
    html += '</div>';
    return html;
}

function renderModule(cotizaciones, contactos) {
    let html = '';
    html += '<div class="page-header">';
    html += '  <h2>Cotizador</h2>';
    html += '</div>';
    html += renderForm(contactos);
    html += renderTable(cotizaciones);
    return html;
}

/* ===================================================
 * EVENTOS DEL FORM
 * ================================================= */

/**
 * Engancha el submit del form a saveCotizacion() y refresca la tabla.
 */
function attachFormHandlers(mount) {
    const form = mount.querySelector('#cotizador-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorEl = mount.querySelector('#cot-error');
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

        const { error } = await saveCotizacion(payload);
        if (error) {
            if (errorEl) errorEl.textContent = 'Error: ' + (error.message || 'no se pudo guardar');
            return;
        }

        // Refrescar
        await initCotizador();
    });
}

/* ===================================================
 * INIT
 * ================================================= */

/**
 * Inicializa el módulo Cotizador: carga datos, render y handlers.
 */
export async function initCotizador(mountSelector = MOUNT_SELECTOR) {
    const mount = document.querySelector(mountSelector);
    if (!mount) {
        console.error('[cotizador] no se encontró el contenedor:', mountSelector);
        return;
    }

    mount.innerHTML = '<div class="loader">Cargando cotizador…</div>';

    const [cotizaciones, contactos] = await Promise.all([
        loadCotizaciones(),
        loadContactosParaSelect()
    ]);

    mount.innerHTML = renderModule(cotizaciones, contactos);
    attachFormHandlers(mount);
}
