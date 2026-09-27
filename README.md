# HGS Control Center

NotionをSource of Truthとして、HGSの連携・指令・時系列メトリクス・同期状態を扱うNext.jsダッシュボードです。

## 実装済み
- Notion Public API server-side read/write
- Integrations一覧
- Command Queue GET/POST
- Metrics ingest webhook（Bearer secret）
- Stripe webhook → HGS統合メトリクスへの正規化
- HTTP Basicによるowner-only保護
- Health endpoint
- Dashboard UI
- 外部変更はCommand Queue経由。`EXTERNAL_ACTION`は承認必須が既定

## Notion正本
- Control Center: `3e7ec2cc-e566-81ad-a3d7-f3e7d03b77b1`
- Integrations data source: `70a13f8e-f94e-4873-b036-b169493f1e95`
- Commands data source: `002179d2-d5b2-47f5-bb92-3c0169b5fc33`
- Metrics data source: `730472cb-c27d-4b6a-a938-10b6a06bab81`
- Sync log data source: `43d29a28-ff12-4a54-8b7d-3632e922b588`

## 起動
1. `.env.example` → `.env.local`
2. `NOTION_API_KEY`、`DASHBOARD_PASSWORD`、`HGS_INGEST_SECRET`を設定
3. `npm install`
4. `npm run check`
5. `npm run dev`
6. `/api/health` が `notionRead: true` になることを確認

## Notion API側
Notion integrationにはControl Centerと参照するOperational DBへの権限を付与してください。秘密値はNotionへ本文保存せず、ホスティングEnvironment Variablesへ保存します。

## Stripe
Stripeを自動集計する場合は `STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET` を設定し、Stripe側のWebhook destinationを `/api/webhooks/stripe` にします。最低限 `payment_intent.succeeded`, `charge.refunded`, `customer.subscription.created`, `customer.subscription.deleted` を受信できます。

## 広告・GA4・CRM・EC
外部ツールは固有データを直接UIへ結合せず、`POST /api/metrics/ingest` へ共通スキーマで投入します。Windsor.ai等から取得したデータも同じ形式へ正規化すれば、Dashboard側は変更不要です。

Example:
```json
{
  "name": "広告費",
  "key": "ad_spend",
  "value": 12345,
  "unit": "JPY",
  "source": "Google Ads",
  "project": "NextLife",
  "account": "account name",
  "granularity": "day",
  "state": "VERIFIED",
  "occurredAt": "2026-09-26T00:00:00+09:00",
  "eventId": "googleads:account:2026-09-26:spend"
}
```

## 権限境界
Dashboardから外部広告・投稿・課金等を直接変更する設計にはしていません。まずCommand Queueへ記録し、HGSのORC/承認/TST/CRT/Readback経路を通します。
