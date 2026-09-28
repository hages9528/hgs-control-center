# HGS Production Smoke

- tested_at_utc: 2026-09-28T02:23:27Z
- workflow_commit: fa152efc3f2f35d60f3949f8af51561524b00156
- deployment_commit: fa152efc3f2f35d60f3949f8af51561524b00156
- matched_current_deployment: 1
- base: https://hgs-control-center.vercel.app

## GET /

- curl_exit: 0
- http_status: 401

~~~
Authentication required
~~~

## GET /api/health

- curl_exit: 0
- http_status: 200

~~~
{"ok":true,"readyForOperations":true,"notionConfigured":true,"notionRead":true,"dashboardAuthConfigured":true,"ingestConfigured":true,"stripeConfigured":false,"googleAdsConfigured":false,"lineConfigured":false,"cronConfigured":false,"environment":"production","deploymentUrl":"https://hgs-control-center.vercel.app","gitSha":"fa152efc3f2f35d60f3949f8af51561524b00156","project":"prj_7XKXTcU3w4qz6mJsQoJ96tNrumNR","time":"2026-09-28T02:23:27.478Z","sampleRows":1}
~~~

## GET /api/overview

- curl_exit: 0
- http_status: 401

~~~
Authentication required
~~~

## GET /api/integrations

- curl_exit: 0
- http_status: 401

~~~
Authentication required
~~~

## GET /api/commands

- curl_exit: 0
- http_status: 401

~~~
Authentication required
~~~

## POST /api/commands

- curl_exit: 0
- http_status: 401

~~~
Authentication required
~~~

## POST /api/metrics/ingest

- curl_exit: 0
- http_status: 401

~~~
Authentication required
~~~

## POST /api/webhooks/stripe

- curl_exit: 0
- http_status: 401

~~~
Authentication required
~~~

