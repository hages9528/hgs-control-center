# HGS Production Smoke

- tested_at_utc: 2026-09-28T13:58:27Z
- workflow_commit: 933517d66fc8c1e1d5a7b5438dc5afbbf78230bd
- deployment_commit: 933517d66fc8c1e1d5a7b5438dc5afbbf78230bd
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
{"ok":true,"readyForOperations":true,"notionConfigured":true,"notionRead":true,"dashboardAuthConfigured":true,"ingestConfigured":true,"stripeConfigured":true,"googleAdsConfigured":true,"lineConfigured":true,"cronConfigured":true,"environment":"production","deploymentUrl":"https://hgs-control-center.vercel.app","gitSha":"933517d66fc8c1e1d5a7b5438dc5afbbf78230bd","project":"prj_7XKXTcU3w4qz6mJsQoJ96tNrumNR","time":"2026-09-28T13:58:28.349Z","sampleRows":1}
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

