import { NextResponse } from 'next/server';
import { getGoogleAdsOverview } from '../../../../lib/external';
import { ingestMetric } from '../../../../lib/hgs';

export const runtime = 'nodejs';
export const maxDuration = 60;

function authorized(request) {
  const secret = process.env.CRON_SECRET;
  return Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const ads = await getGoogleAdsOverview();
  if (!ads.connected) return NextResponse.json({ ok: false, error: ads.error || 'google ads not configured' }, { status: 503 });
  const recent = ads.series.slice(-3);
  const definitions = [
    ['広告費', 'google_ads_spend', 'spend', 'JPY'],
    ['広告クリック', 'google_ads_clicks', 'clicks', 'clicks'],
    ['広告表示', 'google_ads_impressions', 'impressions', 'views'],
    ['広告コンバージョン', 'google_ads_conversions', 'conversions', 'count'],
  ];
  const written = [];
  for (const row of recent) for (const [name, key, field, unit] of definitions) {
    const page = await ingestMetric({
      name, key, value: row[field], unit, source: 'Google Ads', project: 'NextLife',
      account: process.env.GOOGLE_ADS_ACCOUNT_ID || 'connected account', granularity: 'day', state: 'VERIFIED',
      occurredAt: `${row.date}T00:00:00+09:00`, eventId: `google_ads:${process.env.GOOGLE_ADS_ACCOUNT_ID || 'account'}:${row.date}:${key}`,
      sourceUrl: 'https://ads.google.com/',
    }, { mode: 'upsert' });
    written.push({ id: page.id, key, date: row.date, updated: page.updated });
  }
  return NextResponse.json({ ok: true, days: recent.length, written: written.length, generatedAt: ads.generatedAt });
}
