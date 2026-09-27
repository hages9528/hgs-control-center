import { getOverview } from '../lib/hgs';
import { configured } from '../lib/notion';

function Badge({children, tone='neutral'}) { return <span className={`badge ${tone}`}>{children}</span>; }
function Stat({label, value, hint}) { return <div className="stat"><div className="statLabel">{label}</div><div className="statValue">{value}</div>{hint&&<div className="muted">{hint}</div>}</div>; }

export default async function Home() {
  let data = null; let error = null;
  if (configured()) { try { data = await getOverview(); } catch (e) { error = e.message; } }
  const notionUrl = process.env.NEXT_PUBLIC_NOTION_CONTROL_CENTER;
  return <main>
    <header className="hero"><div><div className="eyebrow">HGS OPERATIONS</div><h1>Control Center</h1><p>Notionを正本に、案件・指令・メトリクス・外部連携を一画面で扱う操作盤。</p></div><div className="heroActions">{notionUrl&&<a className="button secondary" href={notionUrl}>Notion Control Center</a>}<a className="button" href="/api/health">API Health</a></div></header>
    {!configured() && <div className="notice warning"><strong>Notion API未接続</strong><br/>NOTION_API_KEYをホスティング側のEnvironment Variableへ設定するとライブ同期が有効になります。UIとAPIは起動可能です。</div>}
    {error && <div className="notice error"><strong>Notion接続エラー</strong><br/>{error}</div>}
    <section className="grid stats">
      <Stat label="連携" value={data?.summary.integrations ?? '—'} hint={`接続済み ${data?.summary.connected ?? '—'}`} />
      <Stat label="未完了指令" value={data?.summary.pendingCommands ?? '—'} hint={`BLOCKED ${data?.summary.blocked ?? '—'}`} />
      <Stat label="メトリクス行" value={data?.summary.metricRows ?? '—'} hint="広告・売上・分析 共通形式" />
      <Stat label="最終取得" value={data ? new Date(data.generatedAt).toLocaleTimeString('ja-JP') : '—'} hint="Notion live read" />
    </section>
    <section className="panel"><div className="panelHead"><div><h2>Integrations</h2><p>接続状態と外部変更可否。秘密情報はDashboardサーバー側のみ。</p></div></div><div className="tableWrap"><table><thead><tr><th>連携</th><th>カテゴリ</th><th>状態</th><th>健全性</th><th>R/W</th><th>範囲</th></tr></thead><tbody>{(data?.integrations||[]).map(x=><tr key={x.id}><td>{x['連携名']}</td><td>{x['カテゴリ']}</td><td><Badge tone={x['状態']==='接続済み'?'good':x['状態']==='障害'?'bad':'warn'}>{x['状態']}</Badge></td><td>{x['健全性']}</td><td>{x['読取']?'R':''}{x['書込']?'/W':''}{!x['読取']&&!x['書込']?'—':''}</td><td className="muted">{x['データ範囲']}</td></tr>)}{!data&&<tr><td colSpan="6" className="muted">Notion API接続後に表示</td></tr>}</tbody></table></div></section>
    <section className="grid two"><div className="panel"><h2>Command Queue</h2><p className="muted">Dashboardからの操作は直接変更せず、ORCへ指令として投入。</p><div className="list">{(data?.commands||[]).slice(0,10).map(x=><div className="row" key={x.id}><div><strong>{x['指令名']}</strong><div className="muted">{x['操作']} · {x['優先度']}</div></div><Badge tone={x['状態']==='BLOCKED'?'bad':x['状態']==='COMPLETED'?'good':'warn'}>{x['状態']}</Badge></div>)}{!data&&<div className="muted">未接続</div>}</div></div>
    <div className="panel"><h2>Recent Metrics</h2><p className="muted">売上・広告・アクセス解析を同じスキーマへ正規化。</p><div className="list">{(data?.metrics||[]).slice(0,10).map(x=><div className="row" key={x.id}><div><strong>{x['メトリクス名']}</strong><div className="muted">{x['ソース']} · {x['プロジェクト']||'共通'}</div></div><div className="metric">{x['値']} <span>{x['単位']}</span></div></div>)}{!data&&<div className="muted">未接続</div>}</div></div></section>
    <section className="panel"><h2>API Routes</h2><div className="codeGrid"><code>GET /api/health</code><code>GET /api/overview</code><code>GET /api/integrations</code><code>GET/POST /api/commands</code><code>POST /api/metrics/ingest</code><code>POST /api/webhooks/stripe</code></div></section>
    <footer>HGS Control Center · Notion is Source of Truth · External writes require approval</footer>
  </main>;
}
