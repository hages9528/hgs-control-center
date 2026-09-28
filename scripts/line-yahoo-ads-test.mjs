import assert from 'node:assert/strict';
import { buildLineYahooAdsOverview } from '../lib/external.js';

const period = { from: '2026-09-01', to: '2026-09-02', label: 'test' };
const result = buildLineYahooAdsOverview([
  {
    date: '2026-09-01', account_id: 'account-1', account_name: '退職代行ネクストライフ',
    campaign: '採用', campaign_id: 'campaign-1', campaign_distribution_status: 'ACTIVE',
    campaign_type: 'STANDARD', imps: '1000', clicks: '30', cost: '1200',
    conversions: '3', all_conv: '4', conv_value: '30000',
  },
  {
    date: '2026-09-02', account_id: 'account-1', account_name: '退職代行ネクストライフ',
    campaign: '採用', campaign_id: 'campaign-1', campaign_distribution_status: 'ACTIVE',
    campaign_type: 'STANDARD', imps: '500', clicks: '20', cost: '800',
    conversions: '1', all_conv: '2', conv_value: '10000',
  },
], period);

assert.equal(result.summary.spend, 2000);
assert.equal(result.summary.impressions, 1500);
assert.equal(result.summary.clicks, 50);
assert.equal(result.summary.conversions, 4);
assert.equal(result.summary.allConversions, 6);
assert.equal(result.summary.conversionValue, 40000);
assert.equal(result.summary.cpa, 500);
assert.equal(result.series.length, 2);
assert.equal(result.campaigns.length, 1);
assert.equal(result.campaigns[0].status, 'ACTIVE');
assert.equal(result.accountId, 'account-1');
assert.equal(result.accountName, '退職代行ネクストライフ');
assert.equal(result.currency, 'JPY');

console.log(JSON.stringify({ ok: true, summary: result.summary }, null, 2));
