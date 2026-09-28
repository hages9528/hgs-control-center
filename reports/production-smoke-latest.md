# HGS Production Smoke

- tested_at_utc: 2026-09-28T12:09:16Z
- workflow_commit: 68aa4a5bbd75755c700c1b7b506692518e8b111e
- deployment_commit: 68aa4a5bbd75755c700c1b7b506692518e8b111e
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
{"ok":true,"readyForOperations":true,"notionConfigured":true,"notionRead":true,"dashboardAuthConfigured":true,"ingestConfigured":true,"stripeConfigured":true,"googleAdsConfigured":true,"lineConfigured":true,"cronConfigured":true,"environment":"production","deploymentUrl":"https://hgs-control-center.vercel.app","gitSha":"68aa4a5bbd75755c700c1b7b506692518e8b111e","project":"prj_7XKXTcU3w4qz6mJsQoJ96tNrumNR","time":"2026-09-28T12:09:17.465Z","sampleRows":1}
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

