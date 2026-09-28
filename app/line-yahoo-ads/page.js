import { getLineYahooAdsOverview } from '../../lib/external';
import { parsePeriod } from '../../lib/period';
import { HorizontalBars, TrendChart } from '../_components/Charts';
import { AutoRefresh, Badge, MetricCard, PageHeader, Panel, SetupNotice } from '../_components/UI';
import PeriodToolbar from '../_components/PeriodToolbar';

export const dynamic = 'force-dynamic';

const yen = (value) => value == null ? '—' : `¥${Math.round(value).toLocaleString('ja-JP')}`;
const count = (value) => Number(value || 0).toLocaleString('ja-JP', { maximumFractionDigits: 2 });
const percent = (value) => `${(Number(value || 0) * 100).toFixed(2)}%`;

function StatusBadge({ status }) {
  const good = status === 'ACTIVE' || status === 'SERVING' || status === 'ON';
  const bad = status === 'REMOVED' || status === 'NOT_APPROVED';
  return <Badge tone={good ? 'good' : bad ? 'bad' : 'warn'}>{status || 'UNKNOWN'}</Badge>;
}

export default async function LineYahooAdsPage({ searchParams }) {
  const period = parsePeriod(await searchParams, { defaultPreset: '30d' });
  const data = await getLineYahooAdsOverview(period);
  const s = data.summary || {};

  return <>
    <AutoRefresh seconds={300} />
    <PageHeader
      eyebrow="MARKETING"
      title="LINEヤフー広告"
      description="Yahoo!検索広告・ディスプレイ広告の広告費・表示・クリック・コンバージョンを、キャンペーン別・日別に確認します。表示は読み取り専用です。"
      actions={<Badge tone={data.connected ? 'good' : 'warn'}>{data.connected ? '接続済み' : '接続待ち'}</Badge>}
    />
    {!data.connected && <SetupNotice
      title="Windsor.aiでYahoo! Japan Adsアカウント接続が必要です"
      description="Yahoo! JAPANビジネスIDのOAuth認可後、既存のWindsor.ai APIキーを使って自動表示します。認証情報はDashboard・Git・Notionへ保存しません。"
      variables={['Yahoo! Japan Ads', 'OAuth read access']}
    />}
    {data.error && <div className="notice error"><strong>LINEヤフー広告の取得に失敗</strong><span>{data.error}</span></div>}
    <div className="notice definition-notice">
      <strong>コンバージョンの境界</strong>
      <span>表示するCVはLINEヤフー広告側の計測値です。Stripe決済との直接帰属がないため、有料契約件数や利益とは分離して表示します。</span>
    </div>
    <PeriodToolbar period={period} generatedAt={data.generatedAt} refreshSeconds={300} />

    <section className="metric-grid compact-grid">
      <MetricCard label="広告費" value={data.connected ? yen(s.spend) : '—'} hint={period.label} icon="card" tone="orange" />
      <MetricCard label="表示回数" value={data.connected ? count(s.impressions) : '—'} hint={period.label} icon="activity" tone="blue" />
      <MetricCard label="クリック" value={data.connected ? count(s.clicks) : '—'} hint={data.connected ? `CTR ${percent(s.ctr)}` : period.label} icon="campaign" tone="violet" />
      <MetricCard label="コンバージョン" value={data.connected ? count(s.conversions) : '—'} hint={data.connected ? `CPA ${yen(s.cpa)}` : period.label} icon="overview" tone="green" />
      <MetricCard label="平均CPC" value={data.connected ? yen(s.cpc) : '—'} hint="広告費 ÷ クリック" icon="campaign" tone="blue" />
      <MetricCard label="全コンバージョン" value={data.connected ? count(s.allConversions) : '—'} hint="Yahoo!広告の全CV" icon="profit" tone="green" />
    </section>

    <section className="dashboard-grid">
      <Panel className="span-8" title="クリックとコンバージョン" subtitle={`${period.label} の日次推移`}>
        <TrendChart data={data.series || []} primaryKey="clicks" secondaryKey="conversions" primaryLabel="クリック" secondaryLabel="CV" />
      </Panel>
      <Panel className="span-4" title="キャンペーン別広告費" subtitle="期間内の合計">
        <HorizontalBars items={data.campaigns || []} valueKey="spend" labelKey="campaign" format={yen} />
      </Panel>

      <Panel className="span-12" title="キャンペーン実績" subtitle="配信状態と主要成果を同じ期間で比較します。">
        <div className="table-wrap"><table><thead><tr>
          <th>キャンペーン</th><th>状態</th><th>目的</th><th>表示</th><th>クリック</th><th>CTR</th><th>広告費</th><th>CV</th><th>CPA</th>
        </tr></thead><tbody>
          {(data.campaigns || []).map((row) => <tr key={row.id}>
            <td><strong>{row.campaign}</strong></td><td><StatusBadge status={row.status} /></td><td>{row.objective}</td>
            <td>{count(row.impressions)}</td><td>{count(row.clicks)}</td><td>{percent(row.ctr)}</td><td>{yen(row.spend)}</td><td>{count(row.conversions)}</td><td>{yen(row.cpa)}</td>
          </tr>)}
          {!data.campaigns?.length && <tr><td colSpan="9" className="muted-cell">Yahoo!広告のキャンペーン実績はまだありません</td></tr>}
        </tbody></table></div>
      </Panel>

      <Panel className="span-12" title="日次実績" subtitle={`最終取得 ${data.generatedAt ? new Date(data.generatedAt).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '—'}`}>
        <div className="table-wrap"><table><thead><tr>
          <th>日付</th><th>表示</th><th>クリック</th><th>CTR</th><th>広告費</th><th>CV</th><th>CPA</th>
        </tr></thead><tbody>
          {(data.series || []).slice().reverse().map((row) => <tr key={row.date}>
            <td>{row.date}</td><td>{count(row.impressions)}</td><td>{count(row.clicks)}</td>
            <td>{percent(row.impressions ? row.clicks / row.impressions : 0)}</td><td>{yen(row.spend)}</td><td>{count(row.conversions)}</td><td>{row.conversions ? yen(row.spend / row.conversions) : '—'}</td>
          </tr>)}
          {!data.series?.length && <tr><td colSpan="7" className="muted-cell">選択期間の日次データはありません</td></tr>}
        </tbody></table></div>
      </Panel>
    </section>
  </>;
}
