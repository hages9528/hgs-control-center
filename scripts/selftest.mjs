import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();
const required=['package.json','.env.example','lib/notion.js','lib/hgs.js','lib/external.js','lib/period.js','app/page.js','app/ads/page.js','app/line/page.js','app/stripe/page.js','app/profit/page.js','app/metrics/page.js','app/_components/PeriodToolbar.js','app/_components/ProfitChart.js','app/loading.js','app/error.js','app/commands/page.js','app/integrations/page.js','app/api/health/route.js','app/api/overview/route.js','app/api/commands/route.js','app/api/metrics/ingest/route.js','app/api/webhooks/stripe/route.js','app/api/webhooks/line/route.js','app/api/sync/google-ads/route.js'];
let errors=[];for(const f of required){if(!fs.existsSync(path.join(root,f)))errors.push(`missing ${f}`)}
const env=fs.readFileSync(path.join(root,'.env.example'),'utf8');for(const k of ['NOTION_API_KEY','HGS_INGEST_SECRET','HGS_DS_COMMANDS','HGS_DS_METRICS','WINDSOR_API_KEY','LINE_CHANNEL_ACCESS_TOKEN','LINE_CHANNEL_SECRET','STRIPE_SECRET_KEY','STRIPE_WEBHOOK_SECRET','CRON_SECRET'])if(!env.includes(k+'='))errors.push(`env ${k}`);
const hgs=fs.readFileSync(path.join(root,'lib/hgs.js'),'utf8');for(const a of ['RE_RUN_CRT','RE_RUN_TST','EXTERNAL_ACTION','SYNC_DATA'])if(!hgs.includes(a))errors.push(`action ${a}`);
const external=fs.readFileSync(path.join(root,'lib/external.js'),'utf8');
for(const marker of ["LINE_INSIGHT_CACHE_SECONDS = 900","cache: 'force-cache'","LINE_RETRY_COOLDOWN_MS = 300000","Promise.allSettled"])if(!external.includes(marker))errors.push(`line resilience ${marker}`);
const linePage=fs.readFileSync(path.join(root,'app/line/page.js'),'utf8');
if(!linePage.includes('AutoRefresh seconds={300}'))errors.push('line refresh interval');
const period=fs.readFileSync(path.join(root,'lib/period.js'),'utf8');for(const marker of ['parsePeriod','parseLineDate','periodUnix'])if(!period.includes(marker))errors.push(`period ${marker}`);
for(const marker of ["date_from', period.from","created: periodUnix(period)","lineSnapshots = new Map()"] )if(!external.includes(marker))errors.push(`dated source ${marker}`);
for(const marker of ['buildProfitOverview','広告差引利益（概算）','autoPagingToArray({ limit: 1000 })'])if(!external.includes(marker))errors.push(`profit ${marker}`);
console.log(JSON.stringify({ok:errors.length===0,checks:required.length+19,errors},null,2));process.exit(errors.length?1:0);
