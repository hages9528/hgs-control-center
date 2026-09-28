import { getProfitOverview } from '../../lib/external';
import { parsePeriod } from '../../lib/period';
import ProfitChart from '../_components/ProfitChart';
import PeriodToolbar from '../_components/PeriodToolbar';
import { AutoRefresh, Badge, MetricCard, PageHeader, Panel } from '../_components/UI';

export const dynamic = 'force-dynamic';

export default async function ProfitPage({ searchParams }) {
  const period = parsePeriod(await searchParams);
  const data = await getProfitOverview(period);
  const s = data.summary;
  return <>
    <AutoRefresh seconds={60} />
    <PageHeader eyebrow="MANAGEMENT ACCOUNTING" title="利益推移" description="Stripe成功決済とGoogle広告費を同じ期間で照合し、広告差引後の推移を確認します。" actions={<Badge tone={data.calculationReady ? 'good' : 'warn'}>{data.calculationReady ? '概算可能' : '接続確認待ち'}</Badge>} />
    <div className="notice warning"><strong>利益の定義</strong><span>{data.definition}。{data.limitations}</span></div>
    {(data.ads.error || data.stripe.error) && <div className="notice error"><strong>一部データを取得できません</strong><span>{[data.ads.error, data.stripe.error].filter(Boolean).join(' / ')}</span></div>}
    {data.truncated && <div className="notice warning"><strong>表示上限</strong><span>期間内の決済が1,000件以上あるため、最新1,000件までを集計しています。</span></div>}
    {data.excludedCurrencies > 0 && <div className="notice warning"><strong>通貨を分離</strong><span>JPY以外の成功決済 {data.excludedCurrencies}件は合算せず除外しています。</span></div>}
    <PeriodToolbar period={period} generatedAt={data.generatedAt} refreshSeconds={60} />
    <section className="metric-grid">
      <MetricCard label="売上（成功決済）" value={data.stripe.connected ? `¥${Math.round(s.revenue).toLocaleString('ja-JP')}` : '—'} hint={period.label} icon="card" tone="blue" />
      <MetricCard label="依頼件数" value={data.stripe.connected ? `${s.requests}件` : '—'} hint="成功決済を代理指標として集計" icon="queue" tone="violet" />
      <MetricCard label="Google広告費" value={data.ads.connected ? `¥${Math.round(s.adSpend).toLocaleString('ja-JP')}` : '—'} hint={period.label} icon="campaign" tone="orange" />
      <MetricCard label="広告差引利益（概算）" value={data.calculationReady ? `¥${Math.round(s.contribution).toLocaleString('ja-JP')}` : '算定不能'} hint="売上 − Google広告費" icon="profit" tone="green" />
    </section>
    <section className="dashboard-grid">
      <Panel className="span-12" title="日別の利益推移" subtitle={`${period.label} · カーソルで売上・件数・時刻・広告費を表示`}><ProfitChart data={data.series} /></Panel>
      <Panel className="span-12" title="日別明細" subtitle="成功決済ベース・JST">
        <div className="table-wrap"><table><thead><tr><th>日付</th><th>売上</th><th>依頼件数</th><th>発生時刻</th><th>広告費</th><th>広告差引</th></tr></thead><tbody>{data.series.slice().reverse().map((point) => <tr key={point.date}><td>{point.date}</td><td>¥{Math.round(point.revenue).toLocaleString('ja-JP')}</td><td>{point.requests}件</td><td>{point.times.length ? point.times.join('、') : '—'}</td><td>¥{Math.round(point.adSpend).toLocaleString('ja-JP')}</td><td className={point.contribution < 0 ? 'negative-number' : 'positive-number'}>{point.contribution == null ? '算定不能' : `¥${Math.round(point.contribution).toLocaleString('ja-JP')}`}</td></tr>)}</tbody></table></div>
      </Panel>
    </section>
  </>;
}
