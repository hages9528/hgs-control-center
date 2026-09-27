import fs from 'node:fs';import path from 'node:path';
const root=process.cwd();
const required=['package.json','.env.example','lib/notion.js','lib/hgs.js','app/page.js','app/api/health/route.js','app/api/overview/route.js','app/api/commands/route.js','app/api/metrics/ingest/route.js','app/api/webhooks/stripe/route.js'];
let errors=[];for(const f of required){if(!fs.existsSync(path.join(root,f)))errors.push(`missing ${f}`)}
const env=fs.readFileSync(path.join(root,'.env.example'),'utf8');for(const k of ['NOTION_API_KEY','HGS_INGEST_SECRET','HGS_DS_COMMANDS','HGS_DS_METRICS'])if(!env.includes(k+'='))errors.push(`env ${k}`);
const hgs=fs.readFileSync(path.join(root,'lib/hgs.js'),'utf8');for(const a of ['RE_RUN_CRT','RE_RUN_TST','EXTERNAL_ACTION','SYNC_DATA'])if(!hgs.includes(a))errors.push(`action ${a}`);
console.log(JSON.stringify({ok:errors.length===0,checks:required.length+8,errors},null,2));process.exit(errors.length?1:0);
