# HGS Production Smoke

- tested_at_utc: 2026-09-28T07:45:44Z
- workflow_commit: b36a46fc0f88d415db71b03e1c15caa42cc1adf8
- deployment_commit: b36a46fc0f88d415db71b03e1c15caa42cc1adf8
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
{"ok":true,"readyForOperations":true,"notionConfigured":true,"notionRead":true,"dashboardAuthConfigured":true,"ingestConfigured":true,"stripeConfigured":false,"googleAdsConfigured":true,"lineConfigured":true,"cronConfigured":true,"environment":"production","deploymentUrl":"https://hgs-control-center.vercel.app","gitSha":"b36a46fc0f88d415db71b03e1c15caa42cc1adf8","project":"prj_7XKXTcU3w4qz6mJsQoJ96tNrumNR","time":"2026-09-28T07:45:45.241Z","sampleRows":1}
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

