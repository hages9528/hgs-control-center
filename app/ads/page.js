import { getGoogleAdsOverview } from '../../lib/external';
import { parsePeriod } from '../../lib/period';
import { HorizontalBars, TrendChart } from '../_components/Charts';
import { AutoRefresh, Badge, MetricCard, PageHeader, Panel, SetupNotice } from '../_components/UI';
import PeriodToolbar from '../_components/PeriodToolbar';

export const dynamic = 'force-dynamic';

const yen = (value) => value == null ? '—' : `¥${Math.round(value).toLocaleString('ja-JP')}`;
const count = (value) => Number(value || 0).toLocaleString('ja-JP', { maximumFractionDigits: 2 });
const percent = (value) => `${(Number(value || 0) * 100).toFixed(2)}%`;

function Verdict({ verdict }) {
  const tones = { application: 'good', engaged: 'warn', review: 'bad', learning: 'neutral' };
  return <Badge tone={tones[verdict?.key] || 'neutral'}>{verdict?.label || '未判定'}</Badge>;
}

function Breakdown({ row }) {
  return <span className="conversion-breakdown" title="総CVは申込み・無料相談・LINEクリック等を含みます">
    申込 {count(row.applications)} / 相談 {count(row.consultations)} / LINE {count(row.lineClicks)}
  </span>;
}

export default async function AdsPage({ searchParams }) {
  const period = parsePeriod(await searchParams);
  const data = await getGoogleAdsOverview(period, { includeDetails: true });
  const s = data.summary || {};
  const keywordSummary = data.keywords || [];
  const keywordDetails = data.details || [];
  const candidates = data.keywordCandidates || [];
  const applicationKeywords = keywordSummary.filter((row) => row.applications > 0).length;
  const responseKeywords = keywordSummary.filter((row) => row.applications === 0 && row.conversions > 0).length;
  const reviewKeywords = keywordSummary.filter((row) => row.verdict?.key === 'review').length;

  return <>
    <AutoRefresh seconds={300} />
    <PageHeader
      eyebrow="MARKETING"
      title="Google広告"
      description="総CV・申込み・無料相談・LINEを分離し、登録キーワードと実検索語を同じ期間で精査します。表示値は読み取り専用です。"
      actions={<Badge tone={data.connected ? 'good' : 'warn'}>{data.connected ? '接続済み' : '設定待ち'}</Badge>}
    />
    {!data.configured && <SetupNotice title="Windsor.ai API接続が必要です" description="既存のGoogle広告接続をVercelから安全に読み取るため、サーバー専用のAPIキーを設定します。" variables={['WINDSOR_API_KEY', 'GOOGLE_ADS_ACCOUNT_ID']} />}
    {data.error && <div className="notice error"><strong>Google広告の取得に失敗</strong><span>{data.error}</span></div>}
    {(data.detailWarnings || []).map((warning) => <div className="notice warning" key={warning}><strong>明細の一部を取得できません</strong><span>{warning}</span></div>)}
    <div className="notice definition-notice">
      <strong>利益判定の境界</strong>
      <span>Google広告の総CVは有料契約数ではありません。キーワード別Stripe売上の直接帰属が未接続のため、黒字・赤字は「未算定」とし、ここでは申込み確認・反応・費用の状態を表示します。</span>
    </div>
    <PeriodToolbar period={period} generatedAt={data.generatedAt} refreshSeconds={300} />

    <section className="metric-grid">
      <MetricCard label="広告費" value={data.connected ? yen(s.spend || 0) : '—'} hint={period.label} icon="card" tone="orange" />
      <MetricCard label="総コンバージョン" value={data.connected ? count(s.conversions) : '—'} hint={data.connected ? `総CPA ${yen(s.cpa || 0)}` : period.label} icon="overview" tone="green" />
      <MetricCard label="申込み確認キーワード" value={data.connected ? `${applicationKeywords}語` : '—'} hint="申込みCVが1件以上" icon="campaign" tone="blue" />
      <MetricCard label="反応ありキーワード" value={data.connected ? `${responseKeywords}語` : '—'} hint="総CVあり・申込み未確認" icon="activity" tone="violet" />
      <MetricCard label="表示回数" value={data.connected ? Math.round(s.impressions || 0).toLocaleString('ja-JP') : '—'} hint={period.label} icon="activity" tone="blue" />
      <MetricCard label="クリック" value={data.connected ? Math.round(s.clicks || 0).toLocaleString('ja-JP') : '—'} hint={data.connected ? `CTR ${percent(s.ctr)}` : period.label} icon="campaign" tone="violet" />
      <MetricCard label="要改善キーワード" value={data.connected ? `${reviewKeywords}語` : '—'} hint="費用1,000円以上・総CV 0" icon="queue" tone="orange" />
      <MetricCard label="未登録の反応語句" value={data.connected ? `${candidates.length}語` : '—'} hint="検索語でCVあり" icon="link" tone="green" />
    </section>

    <section className="dashboard-grid">
      <Panel className="span-8" title="クリックと総コンバージョン" subtitle={`${period.label} の日次推移`}>
        <TrendChart data={data.series || []} primaryKey="clicks" secondaryKey="conversions" primaryLabel="クリック" secondaryLabel="総CV" />
      </Panel>
      <Panel className="span-4" title="キャンペーン別広告費" subtitle="期間内の合計">
        <HorizontalBars items={data.campaigns || []} valueKey="spend" labelKey="campaign" format={yen} />
      </Panel>

      <Panel className="span-12" title="登録キーワード精査" subtitle="同じキーワードが複数キャンペーンにある場合は合算。利益は未算定です。">
        <div className="table-wrap keyword-table"><table><thead><tr>
          <th>キーワード</th><th>状態</th><th>配信先</th><th>表示</th><th>クリック</th><th>広告費</th><th>総CV</th><th>CV内訳</th><th>総CPA</th><th>申込みCPA</th><th>利益</th>
        </tr></thead><tbody>
          {keywordSummary.map((row) => <tr key={row.keyword}>
            <td><strong>{row.keyword}</strong></td>
            <td><Verdict verdict={row.verdict} /></td>
            <td>{row.campaignCount}キャンペーン</td>
            <td>{count(row.impressions)}</td><td>{count(row.clicks)}<small className="table-subtext">CTR {percent(row.ctr)}</small></td>
            <td>{yen(row.spend)}</td><td>{count(row.conversions)}</td><td><Breakdown row={row} /></td>
            <td>{yen(row.cpa)}</td><td>{yen(row.applicationCpa)}</td><td><Badge tone="neutral">未算定</Badge></td>
          </tr>)}
          {!keywordSummary.length && <tr><td colSpan="11" className="muted-cell">キーワード明細はありません</td></tr>}
        </tbody></table></div>
      </Panel>

      <Panel className="span-12" title="未登録の有望検索語" subtitle="実際に広告が表示された検索語のうち、キーワード未登録かつ総CVがあるもの。追加を自動実行する一覧ではありません。">
        <div className="table-wrap"><table><thead><tr>
          <th>検索語</th><th>状態</th><th>クリック</th><th>広告費</th><th>総CV</th><th>CV内訳</th><th>総CPA</th><th>判断材料</th>
        </tr></thead><tbody>
          {candidates.map((row) => <tr key={row.term}>
            <td><strong>{row.term}</strong></td><td><Badge tone="warn">未登録</Badge></td>
            <td>{count(row.clicks)}</td><td>{yen(row.spend)}</td><td>{count(row.conversions)}</td><td><Breakdown row={row} /></td><td>{yen(row.cpa)}</td>
            <td>{row.applications > 0 ? '申込み実績あり' : '相談・LINE反応あり'}</td>
          </tr>)}
          {!candidates.length && <tr><td colSpan="8" className="muted-cell">該当する未登録検索語はありません</td></tr>}
        </tbody></table></div>
      </Panel>

      <Panel className="span-12" title="キャンペーン別キーワード明細" subtitle="重複して見える同一キーワードを、キャンペーンごとに確認します。">
        <div className="table-wrap"><table><thead><tr>
          <th>キャンペーン</th><th>キーワード</th><th>表示</th><th>クリック</th><th>広告費</th><th>総CV</th><th>申込み</th><th>無料相談</th><th>LINE</th><th>総CPA</th>
        </tr></thead><tbody>
          {keywordDetails.map((row) => <tr key={row.id}>
            <td>{row.campaign}</td><td><strong>{row.keyword}</strong></td><td>{count(row.impressions)}</td><td>{count(row.clicks)}</td><td>{yen(row.spend)}</td>
            <td>{count(row.conversions)}</td><td>{count(row.applications)}</td><td>{count(row.consultations)}</td><td>{count(row.lineClicks)}</td><td>{yen(row.cpa)}</td>
          </tr>)}
          {!keywordDetails.length && <tr><td colSpan="10" className="muted-cell">キャンペーン別明細はありません</td></tr>}
        </tbody></table></div>
      </Panel>

      <Panel className="span-12" title="日次実績" subtitle={`最終取得 ${data.generatedAt ? new Date(data.generatedAt).toLocaleString('ja-JP') : '—'}`}>
        <div className="table-wrap"><table><thead><tr><th>日付</th><th>表示</th><th>クリック</th><th>広告費</th><th>総CV</th><th>総CPA</th></tr></thead><tbody>{(data.series || []).slice().reverse().map((row) => <tr key={row.date}><td>{row.date}</td><td>{Math.round(row.impressions).toLocaleString('ja-JP')}</td><td>{Math.round(row.clicks).toLocaleString('ja-JP')}</td><td>{yen(row.spend)}</td><td>{count(row.conversions)}</td><td>{row.conversions ? yen(row.spend / row.conversions) : '—'}</td></tr>)}</tbody></table></div>
      </Panel>
    </section>
  </>;
}
