import Stripe from 'stripe';

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

export async function getGoogleAdsOverview() {
  const apiKey = process.env.WINDSOR_API_KEY;
  if (!apiKey) return empty('Google Ads', false);
  try {
    const url = new URL('https://connectors.windsor.ai/google_ads');
    url.searchParams.set('api_key', apiKey);
    url.searchParams.set('fields', 'date,campaign,campaign_id,impressions,clicks,spend,conversions,ctr,average_cpc,cost_per_conversion,currency');
    url.searchParams.set('date_preset', 'last_30dT');
    url.searchParams.set('refresh_since', '3d');
    url.searchParams.set('refresh_interval', process.env.WINDSOR_REFRESH_INTERVAL || '1h');
    url.searchParams.set('_renderer', 'json');
    if (process.env.GOOGLE_ADS_ACCOUNT_ID) url.searchParams.set('select_accounts', process.env.GOOGLE_ADS_ACCOUNT_ID);
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
    return { service: 'Google Ads', configured: true, connected: true, error: null, generatedAt: new Date().toISOString(), rows, series, campaigns, summary };
  } catch (error) {
    return { ...empty('Google Ads', true, error.message), connected: false };
  }
}

function previousJstDate() {
  const jstNow = new Date(Date.now() + 9 * 60 * 60 * 1000);
  jstNow.setUTCDate(jstNow.getUTCDate() - 1);
  return `${jstNow.getUTCFullYear()}${String(jstNow.getUTCMonth() + 1).padStart(2, '0')}${String(jstNow.getUTCDate()).padStart(2, '0')}`;
}

async function lineFetch(path, token) {
  const response = await fetch(`https://api.line.me${path}`, { cache: 'no-store', headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) throw new Error(`LINE returned HTTP ${response.status}`);
  return response.json();
}

export async function getLineOverview() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) return empty('LINE', false);
  try {
    const date = previousJstDate();
    const [bot, followers, delivery] = await Promise.all([
      lineFetch('/v2/bot/info', token),
      lineFetch(`/v2/bot/insight/followers?date=${date}`, token),
      lineFetch(`/v2/bot/insight/message/delivery?date=${date}`, token),
    ]);
    return {
      service: 'LINE', configured: true, connected: true, error: null, generatedAt: new Date().toISOString(), date,
      bot: { displayName: bot.displayName, basicId: bot.basicId, premiumId: bot.premiumId, pictureUrl: bot.pictureUrl },
      summary: {
        followers: followers.followers ?? null,
        targetedReaches: followers.targetedReaches ?? null,
        blocks: followers.blocks ?? null,
        messages: (delivery.broadcast || 0) + (delivery.targeting || 0) + (delivery.autoResponse || 0) + (delivery.welcomeResponse || 0) + (delivery.chat || 0),
      },
      delivery,
    };
  } catch (error) {
    return { ...empty('LINE', true, error.message), connected: false };
  }
}

export async function getStripeOverview() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return empty('Stripe', false);
  try {
    const stripe = new Stripe(key);
    const [account, paymentIntents] = await Promise.all([
      stripe.accounts.retrieve(),
      stripe.paymentIntents.list({ limit: 25 }),
    ]);
    const paid = paymentIntents.data.filter((item) => item.status === 'succeeded');
    const volume = paid.reduce((sum, item) => sum + toNumber(item.amount_received || item.amount), 0);
    const currency = paid[0]?.currency?.toUpperCase() || 'JPY';
    return {
      service: 'Stripe', configured: true, connected: true, error: null, generatedAt: new Date().toISOString(),
      account: { id: account.id, country: account.country, businessName: account.business_profile?.name || account.settings?.dashboard?.display_name || null },
      summary: { payments: paid.length, volume: currency === 'JPY' ? volume : volume / 100, currency },
      payments: paymentIntents.data.slice(0, 10).map((item) => ({ id: item.id, created: item.created, amount: item.currency === 'jpy' ? item.amount : item.amount / 100, currency: item.currency?.toUpperCase(), status: item.status, description: item.description })),
    };
  } catch (error) {
    return { ...empty('Stripe', true, error.message), connected: false };
  }
}
