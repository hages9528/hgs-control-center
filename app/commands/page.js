import { getOverview } from '../../lib/hgs';
import { Badge, PageHeader, Panel } from '../_components/UI';

export const dynamic = 'force-dynamic';

export default async function CommandsPage() {
  let data = null; let error = null;
  try { data = await getOverview(); } catch (cause) { error = cause.message; }
  return <>
    <PageHeader eyebrow="GOVERNANCE" title="指令キュー" description="Dashboardからの操作要求をORC・承認・TST/CRT・readback経路へ渡します。" />
    {error && <div className="notice error"><strong>指令の取得に失敗</strong><span>{error}</span></div>}
    <section className="metric-grid compact-grid">
      <Metric label="未完了" value={data?.summary.pendingCommands ?? '—'} />
      <Metric label="BLOCKED" value={data?.summary.blocked ?? '—'} />
      <Metric label="完了" value={(data?.commands || []).filter((x) => x['状態'] === 'COMPLETED').length} />
    </section>
    <Panel title="すべての指令" subtitle="Notion 指令キューDBのライブ表示">
      <div className="table-wrap"><table><thead><tr><th>指令</th><th>操作</th><th>状態</th><th>優先度</th><th>外部影響</th><th>依頼者</th></tr></thead><tbody>{(data?.commands || []).map((item) => <tr key={item.id}><td><a href={item.url}>{item['指令名']}</a></td><td>{item['操作']}</td><td><Badge tone={item['状態'] === 'COMPLETED' ? 'good' : item['状態'] === 'BLOCKED' ? 'bad' : 'warn'}>{item['状態']}</Badge></td><td>{item['優先度']}</td><td>{item['外部影響']}</td><td>{item['依頼者']}</td></tr>)}</tbody></table></div>
    </Panel>
  </>;
}

function Metric({ label, value }) { return <div className="compact-stat"><span>{label}</span><strong>{value}</strong></div>; }
