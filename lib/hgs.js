import { createPage, pageToObject, prop, queryDataSource } from './notion';

export const DS = {
  integrations: process.env.HGS_DS_INTEGRATIONS || '70a13f8e-f94e-4873-b036-b169493f1e95',
  commands: process.env.HGS_DS_COMMANDS || '002179d2-d5b2-47f5-bb92-3c0169b5fc33',
  metrics: process.env.HGS_DS_METRICS || '730472cb-c27d-4b6a-a938-10b6a06bab81',
  sync: process.env.HGS_DS_SYNC_LOG || '43d29a28-ff12-4a54-8b7d-3632e922b588',
};

async function rows(ds, body = {}) {
  const res = await queryDataSource(ds, body);
  return (res.results || []).map(pageToObject);
}

export async function getOverview() {
  const [integrations, commands, metrics, sync] = await Promise.all([
    rows(DS.integrations, { sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }] }),
    rows(DS.commands, { sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }] }),
    rows(DS.metrics, { sorts: [{ property: '日時', direction: 'descending' }] }),
    rows(DS.sync, { sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }] }),
  ]);
  const pendingCommands = commands.filter(x => !['COMPLETED','CANCELLED'].includes(x['状態']));
  const blocked = commands.filter(x => x['状態'] === 'BLOCKED');
  const connected = integrations.filter(x => x['状態'] === '接続済み');
  const recentMetrics = metrics.slice(0, 100);
  const metricTotals = {};
  for (const m of recentMetrics) {
    const key = m['指標キー'] || m['メトリクス名'] || 'unknown';
    const v = Number(m['値']);
    if (Number.isFinite(v)) metricTotals[key] = (metricTotals[key] || 0) + v;
  }
  return {
    generatedAt: new Date().toISOString(), integrations, commands: commands.slice(0, 50), metrics: recentMetrics,
    sync: sync.slice(0, 30),
    summary: { integrations: integrations.length, connected: connected.length, pendingCommands: pendingCommands.length, blocked: blocked.length, metricRows: metrics.length },
    metricTotals,
  };
}

const ACTIONS = new Set(['RE_RUN_CRT','RE_RUN_TST','PAUSE_CASE','RESUME_CASE','CHANGE_PRIORITY','SYNC_DATA','REFRESH_DASHBOARD','EXTERNAL_ACTION','CUSTOM']);

export async function enqueueCommand(input) {
  const action = String(input.action || 'CUSTOM');
  if (!ACTIONS.has(action)) throw new Error('Unsupported action');
  const externalImpact = input.externalImpact || (action === 'EXTERNAL_ACTION' ? '高' : 'なし');
  const approvalRequired = input.approvalRequired ?? (action === 'EXTERNAL_ACTION');
  const status = approvalRequired ? 'APPROVAL_REQUIRED' : 'REQUESTED';
  const properties = {
    '指令名': prop.title(input.name || `${action} ${input.target || ''}`.trim()),
    '操作': prop.select(action),
    '状態': prop.select(status),
    '優先度': prop.select(input.priority || '通常'),
    '外部影響': prop.select(externalImpact),
    '承認必須': prop.checkbox(approvalRequired),
    'Readback必須': prop.checkbox(input.readbackRequired ?? action === 'EXTERNAL_ACTION'),
    '依頼者': prop.text(input.requester || 'HGS Dashboard'),
    'Payload': prop.text(JSON.stringify(input.payload || { target: input.target || null })),
    '依頼日時': prop.date(new Date()),
    '最終更新': prop.date(new Date()),
  };
  if (Array.isArray(input.casePageIds) && input.casePageIds.length) properties['案件'] = prop.relation(input.casePageIds);
  return createPage(DS.commands, properties);
}

const UNITS = new Set(['JPY','USD','count','percent','ratio','seconds','views','clicks','conversions','other']);
const GRANULARITIES = new Set(['event','hour','day','week','month']);
const STATES = new Set(['RAW','VERIFIED','ESTIMATED','ERROR']);

export async function ingestMetric(m) {
  if (!m.name || !m.key || m.value === undefined) throw new Error('name, key, value are required');
  if (!UNITS.has(m.unit || 'other')) throw new Error('invalid unit');
  if (!GRANULARITIES.has(m.granularity || 'event')) throw new Error('invalid granularity');
  if (!STATES.has(m.state || 'RAW')) throw new Error('invalid state');
  const now = new Date();
  return createPage(DS.metrics, {
    'メトリクス名': prop.title(m.name),
    '指標キー': prop.text(m.key),
    '値': prop.number(m.value),
    '単位': prop.select(m.unit || 'other'),
    '期間粒度': prop.select(m.granularity || 'event'),
    '状態': prop.select(m.state || 'RAW'),
    '日時': prop.date(m.occurredAt || now),
    '取得日時': prop.date(now),
    'ソース': prop.text(m.source || 'HGS Gateway'),
    'プロジェクト': prop.text(m.project || ''),
    'アカウント・対象': prop.text(m.account || ''),
    'ディメンション': prop.text(m.dimension ? JSON.stringify(m.dimension) : ''),
    'source_event_id': prop.text(m.eventId || `${m.source || 'manual'}:${m.key}:${new Date(m.occurredAt || now).toISOString()}`),
    ...(m.sourceUrl ? { '元データ参照': prop.url(m.sourceUrl) } : {}),
  });
}
