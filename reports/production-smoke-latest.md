# HGS Production Smoke

- tested_at_utc: 2026-09-28T02:18:22Z
- workflow_commit: 62cdd88fde36629516fc10d023c3210aa726000b
- deployment_commit: fd35c5aef579c37e564f19643bb2d4b988462abb
- matched_current_deployment: 0
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
{"ok":true,"readyForOperations":true,"notionConfigured":true,"notionRead":true,"dashboardAuthConfigured":true,"ingestConfigured":true,"stripeConfigured":false,"environment":"production","deploymentUrl":"https://hgs-control-center.vercel.app","gitSha":"fd35c5aef579c37e564f19643bb2d4b988462abb","project":"prj_7XKXTcU3w4qz6mJsQoJ96tNrumNR","time":"2026-09-28T02:18:22.649Z","sampleRows":1}
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

