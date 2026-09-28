# HGS Production Smoke

- tested_at_utc: 2026-09-28T03:08:45Z
- workflow_commit: ae5dd5a1354c077599eaf792dc6d080cdbf225e8
- deployment_commit: ae5dd5a1354c077599eaf792dc6d080cdbf225e8
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
{"ok":true,"readyForOperations":true,"notionConfigured":true,"notionRead":true,"dashboardAuthConfigured":true,"ingestConfigured":true,"stripeConfigured":false,"googleAdsConfigured":true,"lineConfigured":true,"cronConfigured":true,"environment":"production","deploymentUrl":"https://hgs-control-center.vercel.app","gitSha":"ae5dd5a1354c077599eaf792dc6d080cdbf225e8","project":"prj_7XKXTcU3w4qz6mJsQoJ96tNrumNR","time":"2026-09-28T03:08:45.928Z","sampleRows":1}
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

