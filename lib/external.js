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

export async function getGoogleAdsOverview(inputPeriod) {
  const period = inputPeriod || parsePeriod();
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) return { ...empty('Google Ads', false), period };
  try {
    // Windsor's current API uses the blended `/all` endpoint even when a
    // single connector is selected. The legacy connector-specific endpoint
    // returns 403 for otherwise valid trial accounts.
    const url = new URL('https://connectors.windsor.ai/all');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('fields', 'date,datasource,campaign,campaign_id,impressions,clicks,spend,conversions,ctr,average_cpc,cost_per_conversion,currency');
    url.searchParams.set('date_from', period.from);
    url.searchParams.set('date_to', period.to);
    url.searchParams.set('_renderer', 'json');
    if (process.env.GOOGLE_ADS_ACCOUNT_ID) {
      const account = process.env.GOOGLE_ADS_ACCOUNT_ID.replace(/\D/g, '');
      url.searchParams.set('select_accounts', `google_ads__${account}`);
    }
    const response = await fetch(url, { cache: 'no-store', headers: { 'User-Agent': 'HGS-Control-Center/2.0' } });
    if (!response.ok) throw new Error(`Windsor returned HTTP ${response.status}`);
    const body = await response.json();
    const rows = Array.isArray(body) ? body : Array.isArray(body.data) ? body.data : [];
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
    return { service: 'Google Ads', configured: true, connected: true, error: null, generatedAt: new Date().toISOString(), period, rows, series, campaigns, summary };
  } catch (error) {
    return { ...empty('Google Ads', true, error.message), connected: false, period };
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
