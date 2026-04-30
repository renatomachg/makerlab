// js/core/db.js - Supabase client with ANON_KEY

const { createClient } = window.supabase;

const SUPABASE_URL = 'https://lefbyxdqvurhgbspwhbc.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InltYmxhbW5kdHdvanRhaXdva25rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUzNjM3NDMsImV4cCI6MjA5MDkzOTc0M30.-meI93j19vsNLc-h1t3vNu4IiYEIPzBYaTuHTh55n4M';

export const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ========== CRUD: EMPRESAS ==========

export async function getEmpresas() {
  try {
    const { data, error } = await supabase.from('empresas').select('*').order('nombre', { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function createEmpresa(data) {
  try {
    const { data: result, error } = await supabase.from('empresas').insert([data]).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function updateEmpresa(id, data) {
  try {
    const { data: result, error } = await supabase.from('empresas').update(data).eq('id', id).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function deleteEmpresa(id) {
  try {
    const { error } = await supabase.from('empresas').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ========== CRUD: CONTACTOS ==========

export async function getContactos(empresa_id = null) {
  try {
    let query = supabase.from('contactos').select('*');
    if (empresa_id) query = query.eq('empresa_id', empresa_id);
    const { data, error } = await query.order('nombre', { ascending: true });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function createContacto(data) {
  try {
    const { data: result, error } = await supabase.from('contactos').insert([data]).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function updateContacto(id, data) {
  try {
    const { data: result, error } = await supabase.from('contactos').update(data).eq('id', id).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function deleteContacto(id) {
  try {
    const { error } = await supabase.from('contactos').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ========== CRUD: ORDENES ==========

export async function getOrdenes(filters = {}) {
  try {
    let query = supabase.from('ordenes').select('*');
    if (filters.estado) query = query.eq('estado', filters.estado);
    if (filters.cliente_id) query = query.eq('contacto_id', filters.cliente_id);
    if (filters.fecha_desde) query = query.gte('creado_en', filters.fecha_desde);
    if (filters.fecha_hasta) query = query.lte('creado_en', filters.fecha_hasta);
    const { data, error } = await query.order('creado_en', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function createOrden(data) {
  try {
    const { data: result, error } = await supabase.from('ordenes').insert([data]).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function updateOrden(id, data) {
  try {
    const { data: result, error } = await supabase.from('ordenes').update(data).eq('id', id).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function deleteOrden(id) {
  try {
    const { error } = await supabase.from('ordenes').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ========== CRUD: COTIZACIONES ==========

export async function getCotizaciones(filters = {}) {
  try {
    let query = supabase.from('cotizaciones').select('*');
    if (filters.estado) query = query.eq('estado', filters.estado);
    if (filters.contacto_id) query = query.eq('contacto_id', filters.contacto_id);
    if (filters.fecha_desde) query = query.gte('creado_en', filters.fecha_desde);
    if (filters.fecha_hasta) query = query.lte('creado_en', filters.fecha_hasta);
    const { data, error } = await query.order('creado_en', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function createCotizacion(data) {
  try {
    const { data: result, error } = await supabase.from('cotizaciones').insert([data]).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function updateCotizacion(id, data) {
  try {
    const { data: result, error } = await supabase.from('cotizaciones').update(data).eq('id', id).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function deleteCotizacion(id) {
  try {
    const { error } = await supabase.from('cotizaciones').delete().eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (err) {
    return { error: err.message };
  }
}

// ========== CRUD: ACTIVIDADES ==========

export async function getActividades(contacto_id) {
  try {
    const { data, error } = await supabase.from('actividades').select('*').eq('contacto_id', contacto_id).order('creado_en', { ascending: false });
    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

export async function createActividad(data) {
  try {
    const { data: result, error } = await supabase.from('actividades').insert([data]).select().single();
    if (error) throw error;
    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
