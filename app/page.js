import Link from 'next/link';
import { getOverview } from '../lib/hgs';
import { getGoogleAdsOverview, getLineOverview, getStripeOverview } from '../lib/external';
import { ActivityBars, DonutChart, TrendChart } from './_components/Charts';
import { AutoRefresh, Badge, EmptyState, MetricCard, PageHeader, Panel } from './_components/UI';

async function safeOverview() {
  try { return { data: await getOverview(), error: null }; }
  catch (error) { return { data: null, error: error.message }; }
}

export default async function Home() {
  const [{ data, error }, ads, line, stripe] = await Promise.all([
    safeOverview(), getGoogleAdsOverview(), getLineOverview(), getStripeOverview(),
  ]);
  const integrations = data?.integrations || [];
  const connected = integrations.filter((item) => item['状態'] === '接続済み').length;
  const series = ads.series?.slice(-14) || [];
  const totalActivity = (line.summary?.followers || 0) + (stripe.summary?.payments || 0);

  return <>
    <AutoRefresh seconds={60} />
    <PageHeader
      eyebrow="HGS OPERATIONS"
      title="事業の状態を、ひと目で。"
      description="広告・顧客接点・売上・HGS運用を、正本への参照を保ったまま一つの入口で確認します。"
      actions={<><Link className="button secondary" href="/integrations">接続状態</Link><a className="button" href="/api/health">システム確認</a></>}
    />
    {error && <div className="notice error"><strong>Notion接続エラー</strong><span>{error}</span></div>}

    <section className="metric-grid">
      <MetricCard label="接続済み" value={`${connected}/${integrations.length || 0}`} hint="外部サービス" icon="link" tone="blue" />
      <MetricCard label="広告費（30日）" value={ads.configured ? `¥${Math.round(ads.summary.spend).toLocaleString('ja-JP')}` : '未接続'} hint={ads.configured ? `${Math.round(ads.summary.clicks).toLocaleString('ja-JP')} clicks` : 'Windsor API key'} icon="campaign" tone="violet" />
      <MetricCard label="LINE友だち" value={line.configured ? (line.summary.followers ?? '集計待ち') : '未接続'} hint={line.configured ? '前日確定値' : 'Messaging API'} icon="chat" tone="green" />
      <MetricCard label="Stripe決済" value={stripe.configured ? `${stripe.summary.payments}件` : '未接続'} hint={stripe.configured ? `¥${Math.round(stripe.summary.volume).toLocaleString('ja-JP')}` : 'Restricted key'} icon="card" tone="orange" />
    </section>

    <section className="dashboard-grid">
      <Panel className="span-8" title="Google広告パフォーマンス" subtitle="直近14日の日次推移" action={<Link href="/ads">詳細を見る →</Link>}>
        {series.length ? <TrendChart data={series} primaryKey="clicks" secondaryKey="conversions" primaryLabel="クリック" secondaryLabel="CV" /> : <EmptyState title="広告データの表示準備中" description="Google広告ページで接続状態を確認できます。" />}
      </Panel>
      <Panel className="span-4" title="接続の健全性" subtitle="読み取り経路の現在値">
        <DonutChart value={integrations.length ? Math.round(connected / integrations.length * 100) : 0} label="接続済み" />
        <div className="mini-list">
          <div><span>Notion</span><Badge tone="good">稼働</Badge></div>
          <div><span>Google Ads</span><Badge tone={ads.configured ? 'good' : 'warn'}>{ads.configured ? '稼働' : '設定待ち'}</Badge></div>
          <div><span>LINE</span><Badge tone={line.connected && !line.degraded ? 'good' : 'warn'}>{line.connected ? (line.degraded ? '保護更新中' : '稼働') : '設定待ち'}</Badge></div>
          <div><span>Stripe</span><Badge tone={stripe.configured ? 'good' : 'warn'}>{stripe.configured ? '稼働' : '設定待ち'}</Badge></div>
        </div>
      </Panel>
      <Panel className="span-5" title="HGS指令キュー" subtitle="外部操作は承認経路を通します" action={<Link href="/commands">すべて見る →</Link>}>
        <div className="list">
          {(data?.commands || []).slice(0, 5).map((item) => <div className="row" key={item.id}><div><strong>{item['指令名']}</strong><small>{item['操作']} · {item['優先度']}</small></div><Badge tone={item['状態'] === 'COMPLETED' ? 'good' : item['状態'] === 'BLOCKED' ? 'bad' : 'warn'}>{item['状態']}</Badge></div>)}
          {!data?.commands?.length && <EmptyState compact title="指令はありません" description="新しい指令が入るとここに表示されます。" />}
        </div>
      </Panel>
      <Panel className="span-7" title="チャネル活動" subtitle="LINEイベントと決済イベントの確認">
        <ActivityBars values={[line.summary?.messages || 0, line.summary?.followers || 0, stripe.summary?.payments || 0, totalActivity]} labels={['LINE受信', '友だち', '決済', '合計活動']} />
      </Panel>
    </section>
  </>;
}
