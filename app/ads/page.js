import { getGoogleAdsOverview } from '../../lib/external';
import { parsePeriod } from '../../lib/period';
import { HorizontalBars, TrendChart } from '../_components/Charts';
import { AutoRefresh, Badge, MetricCard, PageHeader, Panel, SetupNotice } from '../_components/UI';
import PeriodToolbar from '../_components/PeriodToolbar';

export const dynamic = 'force-dynamic';

export default async function AdsPage({ searchParams }) {
  const period = parsePeriod(await searchParams);
  const data = await getGoogleAdsOverview(period);
  const s = data.summary || {};
  return <>
    <AutoRefresh seconds={300} />
    <PageHeader eyebrow="MARKETING" title="Google広告" description="ネクストライフの配信結果を日次・キャンペーン別に確認します。表示値は読み取り専用です。" actions={<Badge tone={data.connected ? 'good' : 'warn'}>{data.connected ? '接続済み' : '設定待ち'}</Badge>} />
    {!data.configured && <SetupNotice title="Windsor.ai API接続が必要です" description="既存のGoogle広告接続をVercelから安全に読み取るため、サーバー専用のAPIキーを設定します。" variables={['WINDSOR_API_KEY', 'GOOGLE_ADS_ACCOUNT_ID']} />}
    {data.error && <div className="notice error"><strong>Google広告の取得に失敗</strong><span>{data.error}</span></div>}
    <PeriodToolbar period={period} generatedAt={data.generatedAt} refreshSeconds={300} />
    <section className="metric-grid">
      <MetricCard label="表示回数" value={data.connected ? Math.round(s.impressions || 0).toLocaleString('ja-JP') : '—'} hint={period.label} icon="activity" tone="blue" />
      <MetricCard label="クリック" value={data.connected ? Math.round(s.clicks || 0).toLocaleString('ja-JP') : '—'} hint={data.connected ? `CTR ${((s.ctr || 0) * 100).toFixed(2)}%` : period.label} icon="campaign" tone="violet" />
      <MetricCard label="広告費" value={data.connected ? `¥${Math.round(s.spend || 0).toLocaleString('ja-JP')}` : '—'} hint={period.label} icon="card" tone="orange" />
      <MetricCard label="コンバージョン" value={data.connected ? (s.conversions || 0).toFixed(1) : '—'} hint={data.connected ? `CPA ¥${Math.round(s.cpa || 0).toLocaleString('ja-JP')}` : period.label} icon="overview" tone="green" />
    </section>
    <section className="dashboard-grid">
      <Panel className="span-8" title="クリックとコンバージョン" subtitle={`${period.label} の日次推移`}>
        <TrendChart data={data.series || []} primaryKey="clicks" secondaryKey="conversions" primaryLabel="クリック" secondaryLabel="CV" />
      </Panel>
      <Panel className="span-4" title="キャンペーン別広告費" subtitle="期間内の合計">
        <HorizontalBars items={data.campaigns || []} valueKey="spend" labelKey="campaign" format={(v) => `¥${Math.round(v).toLocaleString('ja-JP')}`} />
      </Panel>
      <Panel className="span-12" title="日次実績" subtitle={`最終取得 ${data.generatedAt ? new Date(data.generatedAt).toLocaleString('ja-JP') : '—'}`}>
        <div className="table-wrap"><table><thead><tr><th>日付</th><th>表示</th><th>クリック</th><th>広告費</th><th>CV</th><th>CPA</th></tr></thead><tbody>{(data.series || []).slice().reverse().map((row) => <tr key={row.date}><td>{row.date}</td><td>{Math.round(row.impressions).toLocaleString('ja-JP')}</td><td>{Math.round(row.clicks).toLocaleString('ja-JP')}</td><td>¥{Math.round(row.spend).toLocaleString('ja-JP')}</td><td>{row.conversions.toFixed(2)}</td><td>{row.conversions ? `¥${Math.round(row.spend / row.conversions).toLocaleString('ja-JP')}` : '—'}</td></tr>)}</tbody></table></div>
      </Panel>
    </section>
  </>;
}
