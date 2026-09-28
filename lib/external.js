import Stripe from 'stripe';
import { parseLineDate, parsePeriod, periodUnix, shiftDate } from './period.js';

function empty(service, configured, error = null) {
  return { service, configured, connected: configured && !error, error, generatedAt: new Date().toISOString(), rows: [], series: [], summary: {} };
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function aggregateByDate(rows) {
  const dates = new Map();
  for (const row of rows) {
    const date = row.date || 'unknown';
    const current = dates.get(date) || { date, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    current.impressions += toNumber(row.impressions);
    current.clicks += toNumber(row.clicks);
    current.spend += toNumber(row.spend);
    current.conversions += toNumber(row.conversions);
    dates.set(date, current);
  }
  return [...dates.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function aggregateCampaigns(rows) {
  const campaigns = new Map();
  for (const row of rows) {
    const key = row.campaign_id || row.campaign || 'unknown';
    const current = campaigns.get(key) || { id: key, campaign: row.campaign || key, impressions: 0, clicks: 0, spend: 0, conversions: 0 };
    current.impressions += toNumber(row.impressions);
    current.clicks += toNumber(row.clicks);
    current.spend += toNumber(row.spend);
    current.conversions += toNumber(row.conversions);
    campaigns.set(key, current);
  }
  return [...campaigns.values()].sort((a, b) => b.spend - a.spend);
}

const GOOGLE_ADS_CONVERSION_FIELDS = {
  applicationsPartTime: 'conversions_申し込み_アルバイト_',
  applicationsFullTime: 'conversions_申し込み_正社員_',
  consultations: 'conversions_無料相談するボタンクリック',
  lineClicks: 'conversions_techsol_lineクリック_59945',
};

function conversionBreakdown(row) {
  const applicationsPartTime = toNumber(row[GOOGLE_ADS_CONVERSION_FIELDS.applicationsPartTime]);
  const applicationsFullTime = toNumber(row[GOOGLE_ADS_CONVERSION_FIELDS.applicationsFullTime]);
  return {
    applicationsPartTime,
    applicationsFullTime,
    applications: applicationsPartTime + applicationsFullTime,
    consultations: toNumber(row[GOOGLE_ADS_CONVERSION_FIELDS.consultations]),
    lineClicks: toNumber(row[GOOGLE_ADS_CONVERSION_FIELDS.lineClicks]),
  };
}

function keywordVerdict(row) {
  if (row.applications > 0) return { key: 'application', label: '申込み確認', tone: 'good' };
  if (row.conversions > 0) return { key: 'engaged', label: '反応あり', tone: 'blue' };
  if (row.spend >= 1000) return { key: 'review', label: '要改善', tone: 'bad' };
  return { key: 'learning', label: '検証中', tone: 'neutral' };
}

function sumPerformance(target, row) {
  const detail = conversionBreakdown(row);
  target.impressions += toNumber(row.impressions);
  target.clicks += toNumber(row.clicks);
  target.spend += toNumber(row.spend);
  target.conversions += toNumber(row.conversions);
  target.allConversions += toNumber(row.all_conversions);
  target.applicationsPartTime += detail.applicationsPartTime;
  target.applicationsFullTime += detail.applicationsFullTime;
  target.applications += detail.applications;
  target.consultations += detail.consultations;
  target.lineClicks += detail.lineClicks;
  return target;
}

function finishPerformance(row) {
  row.ctr = row.impressions ? row.clicks / row.impressions : 0;
  row.averageCpc = row.clicks ? row.spend / row.clicks : null;
  row.cpa = row.conversions ? row.spend / row.conversions : null;
  row.applicationCpa = row.applications ? row.spend / row.applications : null;
  row.verdict = keywordVerdict(row);
  row.profitStatus = '未算定';
  return row;
}

function blankPerformance(extra = {}) {
  return {
    impressions: 0, clicks: 0, spend: 0, conversions: 0, allConversions: 0,
    applicationsPartTime: 0, applicationsFullTime: 0, applications: 0,
    consultations: 0, lineClicks: 0, ...extra,
  };
}

export function buildKeywordAnalysis(rows = []) {
  const details = rows.map((row, index) => finishPerformance(sumPerformance(blankPerformance({
    id: `${row.campaign_id || 'campaign'}:${row.ad_group_id || 'group'}:${row.keyword_info_text || index}`,
    keyword: row.keyword_info_text || '（不明）',
    campaign: row.campaign || row.campaign_id || '（不明）',
    campaignId: row.campaign_id || null,
    adGroupId: row.ad_group_id || null,
    matchType: row.keyword_match_type || null,
  }), row)));
  const grouped = new Map();
  for (const row of rows) {
    const keyword = String(row.keyword_info_text || '（不明）').trim().replace(/\s+/g, ' ');
    const current = grouped.get(keyword) || blankPerformance({ keyword, campaigns: new Set(), rows: 0 });
    current.rows += 1;
    current.campaigns.add(row.campaign || row.campaign_id || '（不明）');
    sumPerformance(current, row);
    grouped.set(keyword, current);
  }
  const keywords = [...grouped.values()].map((row) => finishPerformance({
    ...row,
    campaignCount: row.campaigns.size,
    campaigns: [...row.campaigns],
  })).sort((a, b) => b.applications - a.applications || b.conversions - a.conversions || b.spend - a.spend);
  details.sort((a, b) => b.applications - a.applications || b.conversions - a.conversions || b.spend - a.spend);
  return { keywords, details };
}

export function buildSearchTermAnalysis(rows = []) {
  const grouped = new Map();
  for (const row of rows) {
    const term = String(row.search_term_view_search_term || '（不明）').trim().replace(/\s+/g, ' ');
    const current = grouped.get(term) || blankPerformance({ term, campaigns: new Set(), statuses: new Set(), rows: 0 });
    current.rows += 1;
    current.campaigns.add(row.campaign || row.campaign_id || '（不明）');
    current.statuses.add(row.search_term_view_status || 'UNKNOWN');
    sumPerformance(current, row);
    grouped.set(term, current);
  }
  const terms = [...grouped.values()].map((row) => finishPerformance({
    ...row,
    campaignCount: row.campaigns.size,
    campaigns: [...row.campaigns],
    statuses: [...row.statuses],
    registered: row.statuses.has('ADDED'),
  })).sort((a, b) => b.applications - a.applications || b.conversions - a.conversions || b.spend - a.spend);
  return {
    terms,
    candidates: terms.filter((row) => !row.registered && row.conversions > 0).slice(0, 20),
    reviewTerms: terms.filter((row) => !row.registered && row.conversions === 0 && row.spend >= 300).slice(0, 20),
  };
}

async function fetchWindsorRows(apiKey, period, fields) {
  const url = new URL('https://connectors.windsor.ai/all');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('fields', fields.join(','));
  url.searchParams.set('date_from', period.from);
  url.searchParams.set('date_to', period.to);
  url.searchParams.set('_renderer', 'json');
  if (process.env.GOOGLE_ADS_ACCOUNT_ID) {
    const account = process.env.GOOGLE_ADS_ACCOUNT_ID.replace(/\D/g, '');
    url.searchParams.set('select_accounts', `google_ads__${account}`);
  }
  const response = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'HGS-Control-Center/3.0' } });
  if (!response.ok) throw new Error(`Windsor returned HTTP ${response.status}`);
  const body = await response.json();
  return Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
}

async function fetchWindsorConnectorRows(apiKey, connector, period, fields, accountId = '') {
  const url = new URL(`https://connectors.windsor.ai/${connector}`);
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('fields', fields.join(','));
  url.searchParams.set('date_from', period.from);
  url.searchParams.set('date_to', period.to);
  url.searchParams.set('_renderer', 'json');
  if (accountId) url.searchParams.set('select_accounts', accountId);
  const response = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'HGS-Control-Center/4.0' } });
  if (!response.ok) throw new Error(`Windsor ${connector} returned HTTP ${response.status}`);
  const body = await response.json();
  return Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
}

export async function getGoogleAdsOverview(inputPeriod, options = {}) {
  const period = inputPeriod || parsePeriod();
  const includeDetails = Boolean(options.includeDetails);
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) return { ...empty('Google Ads', false), period };
  try {
    const conversionFields = Object.values(GOOGLE_ADS_CONVERSION_FIELDS);
    const overviewFields = ['date', 'datasource', 'campaign', 'campaign_id', 'impressions', 'clicks', 'spend', 'conversions', 'all_conversions', 'ctr', 'average_cpc', 'cost_per_conversion', 'currency'];
    const keywordFields = ['campaign', 'campaign_id', 'ad_group', 'ad_group_id', 'keyword_info_text', 'keyword_match_type', 'impressions', 'clicks', 'spend', 'conversions', 'all_conversions', 'ctr', 'average_cpc', 'cost_per_conversion', ...conversionFields];
    const searchTermFields = ['campaign', 'campaign_id', 'search_term_view_ad_group_id', 'search_term_view_keyword_id', 'search_term_view_search_term', 'search_term_view_status', 'impressions', 'clicks', 'spend', 'conversions', 'all_conversions', 'ctr', 'average_cpc', 'cost_per_conversion', ...conversionFields];
    const [overviewResult, keywordResult, searchTermResult] = await Promise.allSettled([
      fetchWindsorRows(apiKey, period, overviewFields),
      includeDetails ? fetchWindsorRows(apiKey, period, keywordFields) : Promise.resolve([]),
      includeDetails ? fetchWindsorRows(apiKey, period, searchTermFields) : Promise.resolve([]),
    ]);
    if (overviewResult.status === 'rejected') throw overviewResult.reason;
    const rows = overviewResult.value;
    const series = aggregateByDate(rows);
    const campaigns = aggregateCampaigns(rows);
    const summary = series.reduce((out, row) => ({
      impressions: out.impressions + row.impressions,
      clicks: out.clicks + row.clicks,
      spend: out.spend + row.spend,
      conversions: out.conversions + row.conversions,
    }), { impressions: 0, clicks: 0, spend: 0, conversions: 0 });
    summary.ctr = summary.impressions ? summary.clicks / summary.impressions : 0;
    summary.cpa = summary.conversions ? summary.spend / summary.conversions : 0;
    const keywordAnalysis = buildKeywordAnalysis(keywordResult.status === 'fulfilled' ? keywordResult.value : []);
    const searchTermAnalysis = buildSearchTermAnalysis(searchTermResult.status === 'fulfilled' ? searchTermResult.value : []);
    const detailWarnings = [
      keywordResult.status === 'rejected' ? `キーワード明細: ${keywordResult.reason.message}` : null,
      searchTermResult.status === 'rejected' ? `検索語明細: ${searchTermResult.reason.message}` : null,
    ].filter(Boolean);
    return {
      service: 'Google Ads', configured: true, connected: true, error: null,
      generatedAt: new Date().toISOString(), period, rows, series, campaigns, summary,
      keywordRows: keywordResult.status === 'fulfilled' ? keywordResult.value : [],
      searchTermRows: searchTermResult.status === 'fulfilled' ? searchTermResult.value : [],
      ...keywordAnalysis,
      searchTerms: searchTermAnalysis.terms,
      keywordCandidates: searchTermAnalysis.candidates,
      searchTermsToReview: searchTermAnalysis.reviewTerms,
      detailWarnings,
      detailReady: includeDetails && detailWarnings.length === 0,
      metricDefinitions: {
        conversions: 'Google広告の「コンバージョン」。申込み、無料相談、LINEクリック等を含むため、有料契約件数ではありません。',
        applications: '申込み(アルバイト)と申込み(正社員)の合計です。',
        profit: 'キーワードとStripe決済の直接帰属がないため、黒字・赤字は未算定です。',
      },
    };
  } catch (error) {
    return { ...empty('Google Ads', true, error.message), connected: false, period };
  }
}

export function buildLineYahooAdsOverview(rows = [], period = parsePeriod()) {
  const normalizedRows = rows.map((row) => ({
    ...row,
    campaign: row.campaign || row.campaign_name,
    spend: toNumber(row.cost ?? row.totalcost),
    impressions: toNumber(row.imps ?? row.impressions),
    clicks: toNumber(row.clicks),
    conversions: toNumber(row.conversions),
    allConversions: toNumber(row.all_conv),
    conversionValue: toNumber(row.conv_value),
  }));
  const series = aggregateByDate(normalizedRows);
  const campaignMeta = new Map();
  for (const row of normalizedRows) {
    const key = row.campaign_id || row.campaign || 'unknown';
    campaignMeta.set(key, {
      status: row.campaign_distribution_status || row.campaign_user_status || 'UNKNOWN',
      objective: row.campaign_type || '—',
    });
  }
  const campaigns = aggregateCampaigns(normalizedRows).map((row) => ({
    ...row,
    ...campaignMeta.get(row.id),
    ctr: row.impressions ? row.clicks / row.impressions : 0,
    cpa: row.conversions ? row.spend / row.conversions : null,
  }));
  const summary = normalizedRows.reduce((out, row) => ({
    impressions: out.impressions + row.impressions,
    clicks: out.clicks + row.clicks,
    spend: out.spend + row.spend,
    conversions: out.conversions + row.conversions,
    allConversions: out.allConversions + row.allConversions,
    conversionValue: out.conversionValue + row.conversionValue,
  }), { impressions: 0, clicks: 0, spend: 0, conversions: 0, allConversions: 0, conversionValue: 0 });
  summary.ctr = summary.impressions ? summary.clicks / summary.impressions : 0;
  summary.cpc = summary.clicks ? summary.spend / summary.clicks : null;
  summary.cpa = summary.conversions ? summary.spend / summary.conversions : null;
  return {
    service: 'LINE Yahoo Ads',
    period,
    rows: normalizedRows,
    series,
    campaigns,
    summary,
    accountId: normalizedRows.find((row) => row.account_id)?.account_id || null,
    accountName: normalizedRows.find((row) => row.account_name)?.account_name || null,
    currency: 'JPY',
  };
}

export async function getLineYahooAdsOverview(inputPeriod) {
  const period = inputPeriod || parsePeriod();
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) return { ...empty('LINE Yahoo Ads', false), period };
  try {
    const fields = [
      'date', 'account_id', 'account_name', 'campaign', 'campaign_id',
      'campaign_distribution_status', 'campaign_type', 'imps', 'clicks',
      'cost', 'conversions', 'all_conv', 'conv_value',
    ];
    const rows = await fetchWindsorConnectorRows(
      apiKey,
      'yahoo_japan',
      period,
      fields,
      process.env.YAHOO_JAPAN_ADS_ACCOUNT_ID || '',
    );
    return {
      ...buildLineYahooAdsOverview(rows, period),
      configured: true,
      connected: true,
      error: null,
      generatedAt: new Date().toISOString(),
      metricDefinitions: {
        conversions: 'Yahoo!広告のコンバージョンです。有料契約件数とは限りません。',
        spend: 'Yahoo!広告のCost（JPY）です。',
      },
    };
  } catch (error) {
    return { ...empty('LINE Yahoo Ads', true, error.message), connected: false, period };
  }
}

const LINE_INSIGHT_CACHE_SECONDS = 900;
const LINE_BOT_CACHE_SECONDS = 21600;
const LINE_RETRY_COOLDOWN_MS = 300000;
const lineSnapshots = new Map();
const lineCooldowns = new Map();

async function lineFetch(path, token, cacheSeconds) {
  const response = await fetch(`https://api.line.me${path}`, {
    cache: 'force-cache',
    next: { revalidate: cacheSeconds, tags: [`line:${path.split('?')[0]}`] },
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = new Error(response.status === 429
      ? 'LINE APIのレート制限中です。前回正常値を表示し、5分後に自動再試行します。'
      : `LINE returned HTTP ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return response.json();
}

function settledValue(result, fallback = null) {
  return result.status === 'fulfilled' ? result.value : fallback;
}

export async function getLineOverview(input = {}) {
  const selected = input.date ? parseLineDate({ date: input.date }) : parseLineDate();
  const displayDate = selected.date;
  const date = displayDate.replaceAll('-', '');
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return { ...empty('LINE', false), date: displayDate, period: selected };
  const lastLineSnapshot = lineSnapshots.get(displayDate);
  const lineCooldownUntil = lineCooldowns.get(displayDate) || 0;
  if (Date.now() < lineCooldownUntil && lastLineSnapshot) {
    return {
      ...lastLineSnapshot,
      degraded: true,
      stale: true,
      warning: 'LINE APIのレート制限中です。前回正常値を表示し、5分後に自動再試行します。',
    };
  }
  try {
    const [botResult, followersResult, deliveryResult] = await Promise.allSettled([
      lineFetch('/v2/bot/info', token, LINE_BOT_CACHE_SECONDS),
      lineFetch(`/v2/bot/insight/followers?date=${date}`, token, LINE_INSIGHT_CACHE_SECONDS),
      lineFetch(`/v2/bot/insight/message/delivery?date=${date}`, token, LINE_INSIGHT_CACHE_SECONDS),
    ]);
    const failures = [botResult, followersResult, deliveryResult].filter((result) => result.status === 'rejected');
    const rateLimited = failures.some((result) => result.reason?.status === 429);
    if (rateLimited) lineCooldowns.set(displayDate, Date.now() + LINE_RETRY_COOLDOWN_MS);

    const previous = lastLineSnapshot || {};
    const bot = settledValue(botResult, previous.rawBot);
    const followers = settledValue(followersResult, previous.rawFollowers);
    const delivery = settledValue(deliveryResult, previous.delivery);
    if (!bot && !followers && !delivery) throw failures[0]?.reason || new Error('LINE data is unavailable');

    const snapshot = {
      service: 'LINE', configured: true, connected: true, error: null, generatedAt: new Date().toISOString(), date: displayDate, period: selected,
      degraded: failures.length > 0,
      stale: failures.length > 0 && Boolean(lastLineSnapshot),
      warning: failures.length ? (rateLimited
        ? 'LINE APIのレート制限中です。取得済みデータを保護し、5分後に自動再試行します。'
        : 'LINEの一部データを更新できませんでした。取得済みの項目を表示しています。') : null,
      cacheSeconds: LINE_INSIGHT_CACHE_SECONDS,
      rawBot: bot,
      rawFollowers: followers,
      bot: bot ? { displayName: bot.displayName, basicId: bot.basicId, premiumId: bot.premiumId, pictureUrl: bot.pictureUrl } : previous.bot,
      summary: {
        followers: followers?.followers ?? previous.summary?.followers ?? null,
        targetedReaches: followers?.targetedReaches ?? previous.summary?.targetedReaches ?? null,
        blocks: followers?.blocks ?? previous.summary?.blocks ?? null,
        messages: delivery ? (delivery.broadcast || 0) + (delivery.targeting || 0) + (delivery.autoResponse || 0) + (delivery.welcomeResponse || 0) + (delivery.chat || 0) : previous.summary?.messages ?? null,
      },
      delivery: delivery || previous.delivery || {},
    };
    if (!failures.length || !lastLineSnapshot) lineSnapshots.set(displayDate, snapshot);
    return snapshot;
  } catch (error) {
    if (error.status === 429) lineCooldowns.set(displayDate, Date.now() + LINE_RETRY_COOLDOWN_MS);
    if (lastLineSnapshot) return {
      ...lastLineSnapshot,
      degraded: true,
      stale: true,
      warning: error.status === 429
        ? 'LINE APIのレート制限中です。前回正常値を表示し、5分後に自動再試行します。'
        : 'LINEの更新に失敗したため、前回正常値を表示しています。',
    };
    return { ...empty('LINE', true, error.message), connected: false, date: displayDate, period: selected };
  }
}

export async function getStripeOverview(inputPeriod) {
  const period = inputPeriod || parsePeriod();
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return { ...empty('Stripe', false), period };
  try {
    const stripe = new Stripe(key);
    const paymentIntents = await stripe.paymentIntents.list({ limit: 100, created: periodUnix(period) }).autoPagingToArray({ limit: 1000 });
    const paid = paymentIntents.filter((item) => item.status === 'succeeded');
    const volume = paid.reduce((sum, item) => sum + toNumber(item.amount_received || item.amount), 0);
    const currency = paid[0]?.currency?.toUpperCase() || 'JPY';
    return {
      service: 'Stripe', configured: true, connected: true, error: null, generatedAt: new Date().toISOString(), period,
      account: {
        id: process.env.STRIPE_ACCOUNT_ID || null,
        country: process.env.STRIPE_ACCOUNT_COUNTRY || 'JP',
        businessName: process.env.STRIPE_ACCOUNT_LABEL || '退職代行ネクストライフ',
      },
      summary: { payments: paid.length, volume: currency === 'JPY' ? volume : volume / 100, currency },
      payments: paymentIntents.map((item) => {
        const received = toNumber(item.amount_received ?? item.amount);
        return { id: item.id, created: item.created, amount: item.currency === 'jpy' ? received : received / 100, currency: item.currency?.toUpperCase(), status: item.status, description: item.description };
      }),
      hasMore: paymentIntents.length === 1000,
    };
  } catch (error) {
    return { ...empty('Stripe', true, error.message), connected: false, period };
  }
}

function jstDateTime(unixSeconds) {
  const value = new Date(unixSeconds * 1000);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(value).map((part) => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }).format(value),
  };
}

export function buildProfitOverview(ads, stripe, inputPeriod) {
  const period = inputPeriod || parsePeriod();
  const byDate = new Map();
  for (let date = period.from; date <= period.to; date = shiftDate(date, 1)) {
    byDate.set(date, { date, revenue: 0, requests: 0, adSpend: 0, contribution: null, times: [] });
  }
  for (const row of ads.series || []) {
    const point = byDate.get(row.date);
    if (point) point.adSpend += toNumber(row.spend);
  }
  let excludedCurrencies = 0;
  for (const payment of stripe.payments || []) {
    if (payment.status !== 'succeeded') continue;
    if (payment.currency !== 'JPY') { excludedCurrencies += 1; continue; }
    const occurred = jstDateTime(payment.created);
    const point = byDate.get(occurred.date);
    if (!point) continue;
    point.revenue += toNumber(payment.amount);
    point.requests += 1;
    point.times.push(occurred.time);
  }
  const calculationReady = Boolean(ads.connected && stripe.connected);
  const series = [...byDate.values()].map((point) => ({
    ...point,
    contribution: calculationReady ? point.revenue - point.adSpend : null,
    times: point.times.sort(),
  }));
  const summary = series.reduce((total, point) => ({
    revenue: total.revenue + point.revenue,
    requests: total.requests + point.requests,
    adSpend: total.adSpend + point.adSpend,
    contribution: calculationReady ? total.contribution + point.contribution : null,
  }), { revenue: 0, requests: 0, adSpend: 0, contribution: calculationReady ? 0 : null });
  return {
    service: 'Profit', period, series, summary, calculationReady, excludedCurrencies,
    truncated: Boolean(stripe.hasMore),
    generatedAt: [ads.generatedAt, stripe.generatedAt].filter(Boolean).sort().at(-1) || new Date().toISOString(),
    definition: '広告差引利益（概算） = Stripe成功決済総額 − Google広告費',
    limitations: 'Stripe手数料・返金・人件費・外注費・固定費・税は未反映です。成功決済件数を依頼件数の代理指標として表示します。',
  };
}

export async function getProfitOverview(inputPeriod) {
  const period = inputPeriod || parsePeriod();
  const [ads, stripe] = await Promise.all([getGoogleAdsOverview(period), getStripeOverview(period)]);
  return { ...buildProfitOverview(ads, stripe, period), ads, stripe };
}
