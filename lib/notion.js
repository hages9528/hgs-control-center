const NOTION_API = 'https://api.notion.com/v1';
const VERSION = process.env.NOTION_VERSION || '2026-03-11';

export function configured() {
  return Boolean(process.env.NOTION_API_KEY);
}

async function request(path, init = {}) {
  if (!process.env.NOTION_API_KEY) throw new Error('NOTION_API_KEY is not configured');
  const res = await fetch(`${NOTION_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.NOTION_API_KEY}`,
      'Notion-Version': VERSION,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Notion ${res.status}: ${body.message || JSON.stringify(body)}`);
  return body;
}

export async function queryDataSource(id, body = {}) {
  return request(`/data_sources/${id}/query`, { method: 'POST', body: JSON.stringify({ page_size: 100, ...body }) });
}

export async function createPage(dataSourceId, properties, children) {
  return request('/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: { type: 'data_source_id', data_source_id: dataSourceId },
      properties,
      ...(children ? { children } : {}),
    }),
  });
}

export async function updatePage(pageId, properties) {
  return request(`/pages/${pageId}`, { method: 'PATCH', body: JSON.stringify({ properties }) });
}

export const prop = {
  title: (s) => ({ title: [{ type: 'text', text: { content: String(s).slice(0, 1900) } }] }),
  text: (s = '') => ({ rich_text: s ? [{ type: 'text', text: { content: String(s).slice(0, 1900) } }] : [] }),
  select: (s) => ({ select: s ? { name: s } : null }),
  number: (n) => ({ number: Number(n) }),
  checkbox: (v) => ({ checkbox: Boolean(v) }),
  date: (d) => ({ date: d ? { start: new Date(d).toISOString() } : null }),
  url: (u) => ({ url: u || null }),
  relation: (ids = []) => ({ relation: ids.filter(Boolean).map(id => ({ id })) }),
};

export function readProp(p) {
  if (!p) return null;
  if (p.type === 'title') return (p.title || []).map(x => x.plain_text).join('');
  if (p.type === 'rich_text') return (p.rich_text || []).map(x => x.plain_text).join('');
  if (p.type === 'select') return p.select?.name || null;
  if (p.type === 'status') return p.status?.name || null;
  if (p.type === 'number') return p.number;
  if (p.type === 'checkbox') return p.checkbox;
  if (p.type === 'date') return p.date?.start || null;
  if (p.type === 'url') return p.url || null;
  if (p.type === 'relation') return (p.relation || []).map(x => x.id);
  if (p.type === 'unique_id') return p.unique_id ? `${p.unique_id.prefix || ''}${p.unique_id.number}` : null;
  return null;
}

export function pageToObject(page) {
  const out = { id: page.id, url: page.url, created_time: page.created_time, last_edited_time: page.last_edited_time };
  for (const [k, v] of Object.entries(page.properties || {})) out[k] = readProp(v);
  return out;
}
