# HGS Control Center

NotionをSource of Truthとして、HGSの連携・指令・時系列メトリクス・同期状態を扱うNext.jsダッシュボードです。

## 実装済み（v4）
- Notion Public API server-side read/write
- 9画面構成（概要 / Google広告 / LINEヤフー広告 / 公式LINE / Stripe / 利益推移 / 統合指標 / 指令 / 連携設定）
- JST基準の日付・期間切替（今日 / 昨日 / 7日 / 30日 / 90日 / 指定期間）
- Google広告・Stripeの期間集計、LINEの日次集計切替、Notion統合指標の期間・ソース絞り込み
- Google広告の登録キーワード合算・キャンペーン別明細・検索語候補、総CVと申込み/無料相談/LINEの分離表示
- Stripe成功決済とGoogle広告費による広告差引利益（概算）、日別推移、ホバー内訳（売上・件数・発生時刻・広告費）
- 取得時刻・自動更新間隔・手動更新を画面上へ明示
- Google広告ライブ読取（Windsor.ai Connectors API）
- LINEヤフー広告ライブ読取（Windsor.ai `line_ads` connector、キャンペーン別・日別）
- Google広告の日次Notion同期（Vercel Cron、直近3日をupsert）
- LINE Messaging API統計読取 + 署名検証Webhook
- Stripe read-only表示 + 署名検証Webhook
- Integrations一覧 / Command Queue GET/POST
- Metrics ingest webhook（Bearer secret）
- Stripe webhook → HGS統合メトリクスへの正規化
- HTTP Basicによるowner-only保護
- Health endpoint
- Dashboard UI（ローディング・エラー回復・レスポンシブ表示）
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

## 接続
- Google広告: `WINDSOR_API_KEY` と `GOOGLE_ADS_ACCOUNT_ID`。Windsorの統合 `/all` APIから対象Google広告アカウントだけを読み取り、APIキーは画面・ログへ出しません。
  - 「総コンバージョン」はGoogle広告の主要コンバージョン合計であり、有料契約件数ではありません。
  - キーワード別Stripe売上を直接帰属できるまでは、黒字・赤字を確定せず「利益未算定」と表示します。
- LINEヤフー広告: Windsor.aiの `line_ads` connectorへ広告アカウントを接続します。Dashboardは既存の `WINDSOR_API_KEY` をサーバー側で使用し、必要な場合だけ `LINE_YAHOO_ADS_ACCOUNT_ID` でアカウントを限定します。Access Key / Secret KeyはDashboard、Git、Notionへ保存しません。
- 公式LINE: `LINE_CHANNEL_ACCESS_TOKEN` と `LINE_CHANNEL_SECRET`。Webhook URLは `/api/webhooks/line`。前日統計は15分キャッシュし、429時は前回正常値を保持して5分後に再試行します。
- Stripe: Payment Intentsの読み取りのみを許可した `STRIPE_SECRET_KEY` と `STRIPE_WEBHOOK_SECRET`。Webhook URLは `/api/webhooks/stripe`。アカウント表示名は必要に応じて `STRIPE_ACCOUNT_LABEL`で指定します。
- 定期保存: `CRON_SECRET` を設定し、Vercel Hobbyで利用できる日次Cronから `/api/sync/google-ads` を実行します。画面のGoogle広告値はCronではなく、表示時にWindsorから直接更新します。

Stripe Webhookは `payment_intent.succeeded`, `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`, `customer.subscription.created`, `customer.subscription.deleted` を受信できます。

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
