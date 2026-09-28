import { getMetrics } from '../../lib/hgs';
import { parsePeriod } from '../../lib/period';
import PeriodToolbar from '../_components/PeriodToolbar';
import { AutoRefresh, Badge, MetricCard, PageHeader, Panel } from '../_components/UI';

export const dynamic = 'force-dynamic';

export default async function MetricsPage({ searchParams }) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const source = String(params.source || '').slice(0, 100);
  let data;
  let error = null;
  try { data = await getMetrics(period, source); }
  catch (cause) { error = cause.message; data = { generatedAt: null, metrics: [], totals: {}, truncated: false }; }
  const totals = Object.entries(data.totals || {}).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));

  return <>
    <AutoRefresh seconds={60} />
    <PageHeader eyebrow="SOURCE OF TRUTH" title="統合メトリクス" description="広告・LINE・Stripe・HGSイベントをNotion正本から期間別に確認します。値はソースと日時を保持したまま表示します。" actions={<Badge tone={error ? 'bad' : 'good'}>{error ? '取得失敗' : 'Notion同期'}</Badge>} />
    {error && <div className="notice error"><strong>統合メトリクスの取得に失敗</strong><span>{error}</span></div>}
    <PeriodToolbar period={period} generatedAt={data.generatedAt} refreshSeconds={60} />
    <form className="source-filter" method="get">
      <input type="hidden" name="range" value="custom" /><input type="hidden" name="from" value={period.from} /><input type="hidden" name="to" value={period.to} />
      <label><span>ソース絞り込み</span><input name="source" defaultValue={source} placeholder="例: Stripe / LINE / Google Ads" /></label>
      <button className="apply-button" type="submit">絞り込む</button>
      {source && <a href={`/metrics?range=custom&from=${period.from}&to=${period.to}`}>解除</a>}
    </form>
    {data.truncated && <div className="notice warning"><strong>表示上限</strong><span>該当データが100件以上あります。現在は新しい100件を集計・表示しています。</span></div>}
    <section className="metric-grid">
      <MetricCard label="メトリクス行" value={`${data.metrics.length}件`} hint={period.label} icon="metrics" tone="blue" />
      {totals.slice(0, 3).map(([key, value], index) => <MetricCard key={key} label={key} value={Number(value).toLocaleString('ja-JP')} hint="期間内合計" icon="activity" tone={['violet', 'green', 'orange'][index]} />)}
    </section>
    <section className="dashboard-grid">
      <Panel className="span-12" title="正本レコード" subtitle={`${period.label}${source ? ` · ソース: ${source}` : ''}`}>
        <div className="table-wrap"><table><thead><tr><th>日時</th><th>メトリクス</th><th>値</th><th>単位</th><th>ソース</th><th>状態</th><th>対象</th></tr></thead><tbody>
          {data.metrics.map((metric) => <tr key={metric.id}><td>{metric['日時'] ? new Date(metric['日時']).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '—'}</td><td><strong>{metric['メトリクス名'] || metric['指標キー'] || '—'}</strong><small className="table-subtext">{metric['指標キー']}</small></td><td>{metric['値'] == null ? '—' : Number(metric['値']).toLocaleString('ja-JP')}</td><td>{metric['単位'] || '—'}</td><td>{metric['ソース'] || '—'}</td><td><Badge tone={metric['状態'] === 'VERIFIED' ? 'good' : metric['状態'] === 'ERROR' ? 'bad' : 'neutral'}>{metric['状態'] || 'RAW'}</Badge></td><td>{metric['アカウント・対象'] || metric['プロジェクト'] || '—'}</td></tr>)}
          {!data.metrics.length && <tr><td colSpan="7" className="muted-cell">この期間・条件に該当するメトリクスはありません</td></tr>}
        </tbody></table></div>
      </Panel>
    </section>
  </>;
}
