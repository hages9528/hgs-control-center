import { getOverview } from '../../lib/hgs';
import { Badge, PageHeader, Panel } from '../_components/UI';

export const dynamic = 'force-dynamic';

export default async function IntegrationsPage() {
  let data = null; let error = null;
  try { data = await getOverview(); } catch (cause) { error = cause.message; }
  return <>
    <PageHeader eyebrow="SYSTEM" title="連携設定" description="接続先、読み書き権限、健全性、最終同期を一か所で確認します。秘密値そのものは表示しません。" />
    {error && <div className="notice error"><strong>連携情報の取得に失敗</strong><span>{error}</span></div>}
    <Panel title="外部サービス" subtitle="Notion 連携レジストリDBのライブ表示">
      <div className="integration-cards">{(data?.integrations || []).map((item) => <article key={item.id} className="integration-card"><header><div className="service-mark">{String(item['プロバイダ'] || item['連携名'] || '?').slice(0, 1)}</div><div><h3>{item['連携名']}</h3><p>{item['プロバイダ']} · {item['カテゴリ']}</p></div><Badge tone={item['状態'] === '接続済み' ? item['健全性'] === '正常' ? 'good' : 'warn' : 'warn'}>{item['状態']}</Badge></header><dl><div><dt>健全性</dt><dd>{item['健全性']}</dd></div><div><dt>権限</dt><dd>{item['読取'] ? 'READ' : '—'}{item['書込'] ? ' / WRITE' : ''}</dd></div><div><dt>最終同期</dt><dd>{item['最終同期'] ? new Date(item['最終同期']).toLocaleString('ja-JP') : '未記録'}</dd></div></dl><p className="integration-scope">{item['データ範囲']}</p><a href={item.url}>Notionの記録を開く →</a></article>)}</div>
    </Panel>
  </>;
}
