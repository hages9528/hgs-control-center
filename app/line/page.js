import { getLineOverview } from '../../lib/external';
import { ActivityBars, DonutChart } from '../_components/Charts';
import { AutoRefresh, Badge, MetricCard, PageHeader, Panel, SetupNotice } from '../_components/UI';

export const dynamic = 'force-dynamic';

export default async function LinePage() {
  const data = await getLineOverview();
  const s = data.summary || {};
  const reachRate = s.followers ? Math.round((s.targetedReaches || 0) / s.followers * 100) : 0;
  return <>
    <AutoRefresh seconds={60} />
    <PageHeader eyebrow="CUSTOMER CONTACT" title="公式LINE" description="友だち数、到達可能数、配信数とWebhookイベントを安全に集計します。メッセージ本文は保存しません。" actions={<Badge tone={data.connected ? 'good' : 'warn'}>{data.connected ? '接続済み' : '設定待ち'}</Badge>} />
    {!data.configured && <SetupNotice title="LINE Messaging API接続が必要です" description="チャネルアクセストークンで統計を読み取り、チャネルシークレットでWebhook署名を検証します。" variables={['LINE_CHANNEL_ACCESS_TOKEN', 'LINE_CHANNEL_SECRET']} />}
    {data.error && <div className="notice error"><strong>LINEの取得に失敗</strong><span>{data.error}</span></div>}
    <section className="metric-grid">
      <MetricCard label="友だち" value={data.connected ? (s.followers ?? '—').toLocaleString?.('ja-JP') ?? s.followers : '—'} hint="前日確定値" icon="chat" tone="green" />
      <MetricCard label="到達可能" value={data.connected ? (s.targetedReaches ?? '—').toLocaleString?.('ja-JP') ?? s.targetedReaches : '—'} hint={`到達率 ${reachRate}%`} icon="activity" tone="blue" />
      <MetricCard label="ブロック" value={data.connected ? (s.blocks ?? '—').toLocaleString?.('ja-JP') ?? s.blocks : '—'} hint="累計" icon="queue" tone="orange" />
      <MetricCard label="送信メッセージ" value={data.connected ? (s.messages || 0).toLocaleString('ja-JP') : '—'} hint={data.date || '前日集計'} icon="campaign" tone="violet" />
    </section>
    <section className="dashboard-grid">
      <Panel className="span-5" title="アカウント" subtitle="Messaging API bot情報">
        <div className="profile-card"><div className="profile-avatar">LINE</div><div><strong>{data.bot?.displayName || '未接続'}</strong><p>{data.bot?.basicId || data.bot?.premiumId || 'チャネル情報を待っています'}</p></div></div>
        <DonutChart value={reachRate} label="到達可能率" />
      </Panel>
      <Panel className="span-7" title="前日の配信内訳" subtitle="LINE Messaging API insight">
        <ActivityBars values={[data.delivery?.broadcast || 0, data.delivery?.targeting || 0, data.delivery?.autoResponse || 0, data.delivery?.chat || 0]} labels={['一斉配信', '絞り込み', '自動応答', 'チャット']} />
      </Panel>
      <Panel className="span-12" title="リアルタイム受信" subtitle="Webhook → HGS統合メトリクス">
        <div className="route-card"><code>POST /api/webhooks/line</code><div><Badge tone={process.env.LINE_CHANNEL_SECRET ? 'good' : 'warn'}>{process.env.LINE_CHANNEL_SECRET ? '署名検証有効' : '設定待ち'}</Badge><p>follow / unfollow / message / postback を件数だけ記録し、個人情報と本文は保存しません。</p></div></div>
      </Panel>
    </section>
  </>;
}
