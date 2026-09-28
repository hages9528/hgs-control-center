import { getStripeOverview } from '../../lib/external';
import { AutoRefresh, Badge, MetricCard, PageHeader, Panel, SetupNotice } from '../_components/UI';

export const dynamic = 'force-dynamic';

export default async function StripePage() {
  const data = await getStripeOverview();
  const s = data.summary || {};
  return <>
    <AutoRefresh seconds={60} />
    <PageHeader eyebrow="REVENUE" title="Stripe" description="入金・決済イベントを読み取り専用で確認します。返金や課金などの変更操作はこの画面から実行しません。" actions={<Badge tone={data.connected ? 'good' : 'warn'}>{data.connected ? '接続済み' : '設定待ち'}</Badge>} />
    {!data.configured && <SetupNotice title="Stripe本番接続が必要です" description="最小権限の制限付きキーと、Webhook署名シークレットをVercelの機密環境変数へ保存します。" variables={['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']} />}
    {data.error && <div className="notice error"><strong>Stripeの取得に失敗</strong><span>{data.error}</span></div>}
    <section className="metric-grid">
      <MetricCard label="取得した決済" value={data.connected ? `${s.payments || 0}件` : '—'} hint="直近25件中の成功" icon="card" tone="blue" />
      <MetricCard label="決済金額" value={data.connected ? `¥${Math.round(s.volume || 0).toLocaleString('ja-JP')}` : '—'} hint={s.currency || 'JPY'} icon="activity" tone="green" />
      <MetricCard label="Webhook" value={process.env.STRIPE_WEBHOOK_SECRET ? '有効' : '未設定'} hint="署名検証" icon="link" tone="violet" />
      <MetricCard label="アカウント" value={data.account?.businessName || (data.connected ? '接続済み' : '—')} hint={data.account?.country || '—'} icon="overview" tone="orange" />
    </section>
    <section className="dashboard-grid">
      <Panel className="span-12" title="最近のPayment Intent" subtitle="読み取り専用・自動更新">
        <div className="table-wrap"><table><thead><tr><th>日時</th><th>説明</th><th>金額</th><th>状態</th><th>ID</th></tr></thead><tbody>{(data.payments || []).map((payment) => <tr key={payment.id}><td>{new Date(payment.created * 1000).toLocaleString('ja-JP')}</td><td>{payment.description || '—'}</td><td>{payment.currency} {Number(payment.amount).toLocaleString('ja-JP')}</td><td><Badge tone={payment.status === 'succeeded' ? 'good' : 'warn'}>{payment.status}</Badge></td><td><code>{payment.id}</code></td></tr>)}{!data.payments?.length && <tr><td colSpan="5" className="muted-cell">接続後に表示されます</td></tr>}</tbody></table></div>
      </Panel>
      <Panel className="span-12" title="リアルタイム決済イベント" subtitle="Stripe → 署名検証 → HGS統合メトリクス">
        <div className="route-card"><code>POST /api/webhooks/stripe</code><div><Badge tone={process.env.STRIPE_WEBHOOK_SECRET ? 'good' : 'warn'}>{process.env.STRIPE_WEBHOOK_SECRET ? '署名検証有効' : '設定待ち'}</Badge><p>成功決済・返金・サブスクリプション作成／解約を正規化して記録します。</p></div></div>
      </Panel>
    </section>
  </>;
}
