# HGS Production Smoke

- tested_at_utc: 2026-09-27T23:36:02Z
- commit: 2655391a061be2ed5beb9d6734b08e2fa5992955
- base: https://hgs-control-center.vercel.app

## GET /

- curl_exit: 0
- http_status: 200

~~~
<!DOCTYPE html><html lang="ja"><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><link rel="stylesheet" href="/_next/static/immutable/chunks/3w0horx-rjnis.css" data-precedence="next"/><link rel="preload" as="script" fetchPriority="low" href="/_next/static/immutable/chunks/1kbt14nefgsiq.js"/><script src="/_next/static/immutable/chunks/0jo3lv8klof30.js" async=""></script><script src="/_next/static/immutable/chunks/0k-_60eas02f5.js" async=""></script><script src="/_next/static/immutable/chunks/turbopack-43omn5ohpg7h8.js" async=""></script><script src="/_next/static/immutable/chunks/2corl6wyj4669.js" async=""></script><title>HGS Control Center</title><meta name="description" content="HGS operational dashboard"/><script src="/_next/static/immutable/chunks/0c0hxoamwjsbw.js" noModule=""></script></head><body><div hidden=""><!--$--><!--/$--></div><main><header class="hero"><div><div class="eyebrow">HGS OPERATIONS</div><h1>Control Center</h1><p>Notionを正本に、案件・指令・メトリクス・外部連携を一画面で扱う操作盤。</p></div><div class="heroActions"><a class="button" href="/api/health">API Health</a></div></header><div class="notice warning"><strong>Notion API未接続</strong><br/>NOTION_API_KEYをホスティング側のEnvironment Variableへ設定するとライブ同期が有効になります。UIとAPIは起動可能です。</div><section class="grid stats"><div class="stat"><div class="statLabel">連携</div><div class="statValue">—</div><div class="muted">接続済み —</div></div><div class="stat"><div class="statLabel">未完了指令</div><div class="statValue">—</div><div class="muted">BLOCKED —</div></div><div class="stat"><div class="statLabel">メトリクス行</div><div class="statValue">—</div><div class="muted">広告・売上・分析 共通形式</div></div><div class="stat"><div class="statLabel">最終取得</div><div class="statValue">—</div><div class="muted">Notion live read</div></div></section><section class="panel"><div class="panelHead"><div><h2>Integrations</h2><p>接続状態と外部変更可否。秘密情報はDashboardサーバー側のみ。</p></div></div><div class="tableWrap"><table><thead><tr><th>連携</th><th>カテゴリ</th><th>状態</th><th>健全性</th><th>R/W</th><th>範囲</th></tr></thead><tbody><tr><td colSpan="6" class="muted">Notion API接続後に表示</td></tr></tbody></table></div></section><section class="grid two"><div class="panel"><h2>Command Queue</h2><p class="muted">Dashboardからの操作は直接変更せず、ORCへ指令として投入。</p><div class="list"><div class="muted">未接続</div></div></div><div class="panel"><h2>Recent Metrics</h2><p class="muted">売上・広告・アクセス解析を同じスキーマへ正規化。</p><div class="list"><div class="muted">未接続</div></div></div></section><section class="panel"><h2>API Routes</h2><div class="codeGrid"><code>GET /api/health</code><code>GET /api/overview</code><code>GET /api/integrations</code><code>GET/POST /api/commands</code><code>POST /api/metrics/ingest</code><code>POST /api/webhooks/stripe</code></div></section><footer>HGS Control Center · Notion is Source of Truth · External writes require approval</footer></main><!--$--><!--/$--><script src="/_next/static/immutable/chunks/1kbt14nefgsiq.js" id="_R_" async=""></script><script>(self.__next_f=self.__next_f||[]).push([0])</script><script>self.__next_f.push([1,"1:\"$Sreact.fragment\"\n2:I[39756,[\"/_next/static/immutable/chunks/2corl6wyj4669.js\"],\"default\"]\n3:I[37457,[\"/_next/static/immutable/chunks/2corl6wyj4669.js\"],\"default\"]\n5:I[97367,[\"/_next/static/immutable/chunks/2corl6wyj4669.js\"],\"OutletBoundary\"]\n6:\"$Sreact.suspense\"\n8:I[97367,[\"/_next/static/immutable/chunks/2corl6wyj4669.js\"],\"ViewportBoundary\"]\na:I[97367,[\"/_next/static/immutable/chunks/2corl6wyj4669.js\"],\"MetadataBoundary\"]\nc:I[68027,[\"/_next/static/immutable/c
~~~

## GET /api/health

- curl_exit: 0
- http_status: 200

~~~
{"ok":true,"notionConfigured":false,"time":"2026-09-27T23:36:03.545Z"}
~~~

## GET /api/overview

- curl_exit: 0
- http_status: 503

~~~
{"error":"NOTION_API_KEY is not configured"}
~~~

## GET /api/integrations

- curl_exit: 0
- http_status: 503

~~~
{"error":"NOTION_API_KEY is not configured"}
~~~

## GET /api/commands

- curl_exit: 0
- http_status: 503

~~~
{"error":"NOTION_API_KEY is not configured"}
~~~

## POST /api/commands

- curl_exit: 0
- http_status: 400

~~~
{"ok":false,"error":"NOTION_API_KEY is not configured"}
~~~

## POST /api/metrics/ingest

- curl_exit: 0
- http_status: 401

~~~
{"error":"unauthorized"}
~~~

## POST /api/webhooks/stripe

- curl_exit: 0
- http_status: 503

~~~
{"error":"stripe webhook not configured"}
~~~

