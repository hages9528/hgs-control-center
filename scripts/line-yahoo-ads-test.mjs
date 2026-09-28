import assert from 'node:assert/strict';
import { buildLineYahooAdsOverview } from '../lib/external.js';

const period = { from: '2026-09-01', to: '2026-09-02', label: 'test' };
const result = buildLineYahooAdsOverview([
  {
    date: '2026-09-01', account_id: 'account-1', account_currency: 'JPY',
    campaign: '採用', campaign_id: 'campaign-1', campaign_delivery_status: 'ACTIVE',
    campaign_objective: 'WEB_CONVERSION', impressions: '1000', clicks: '30', cost: '1200',
    conversions: '3', conversions_generate_lead: '2', conversions_purchase: '1', reach: '800',
  },
  {
    date: '2026-09-02', account_id: 'account-1', account_currency: 'JPY',
    campaign: '採用', campaign_id: 'campaign-1', campaign_delivery_status: 'ACTIVE',
    campaign_objective: 'WEB_CONVERSION', impressions: '500', clicks: '20', cost: '800',
    conversions: '1', conversions_complete_registration: '1', reach: '400',
  },
], period);

assert.equal(result.summary.spend, 2000);
assert.equal(result.summary.impressions, 1500);
assert.equal(result.summary.clicks, 50);
assert.equal(result.summary.conversions, 4);
assert.equal(result.summary.leads, 2);
assert.equal(result.summary.registrations, 1);
assert.equal(result.summary.purchases, 1);
assert.equal(result.summary.cpa, 500);
assert.equal(result.series.length, 2);
assert.equal(result.campaigns.length, 1);
assert.equal(result.campaigns[0].status, 'ACTIVE');
assert.equal(result.accountId, 'account-1');
assert.equal(result.currency, 'JPY');

console.log(JSON.stringify({ ok: true, summary: result.summary }, null, 2));
