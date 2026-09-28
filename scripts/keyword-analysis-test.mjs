import assert from 'node:assert/strict';
import { buildKeywordAnalysis, buildSearchTermAnalysis } from '../lib/external.js';

const conversionFields = {
  conversions_申し込み_アルバイト_: 0,
  conversions_申し込み_正社員_: 0,
  conversions_無料相談するボタンクリック: 0,
  conversions_techsol_lineクリック_59945: 0,
};

const keywordRows = [
  {
    ...conversionFields,
    campaign: '検索 #2', campaign_id: '2', ad_group_id: '20', keyword_info_text: '退職 代行 バイト',
    impressions: 290, clicks: 38, spend: 6387.0408, conversions: 9.9921, all_conversions: 9.9921,
    conversions_申し込み_アルバイト_: 1,
    conversions_無料相談するボタンクリック: 3,
    conversions_techsol_lineクリック_59945: 5.9921,
  },
  {
    ...conversionFields,
    campaign: '検索 #3', campaign_id: '3', ad_group_id: '30', keyword_info_text: '退職 代行 バイト',
    impressions: 13, clicks: 4, spend: 490, conversions: 1, all_conversions: 1,
    conversions_techsol_lineクリック_59945: 1,
  },
  {
    ...conversionFields,
    campaign: '検索 #2', campaign_id: '2', ad_group_id: '20', keyword_info_text: '退職 代行 安い',
    impressions: 54, clicks: 8, spend: 1508.5616, conversions: 0, all_conversions: 0,
  },
];

const keywords = buildKeywordAnalysis(keywordRows);
assert.equal(keywords.keywords.length, 2);
const merged = keywords.keywords.find((row) => row.keyword === '退職 代行 バイト');
assert.equal(merged.campaignCount, 2);
assert.equal(merged.applications, 1);
assert.equal(merged.conversions, 10.9921);
assert.equal(merged.verdict.key, 'application');
assert.equal(merged.profitStatus, '未算定');
const review = keywords.keywords.find((row) => row.keyword === '退職 代行 安い');
assert.equal(review.verdict.key, 'review');

const terms = buildSearchTermAnalysis([
  {
    ...conversionFields,
    campaign: '検索 #2', search_term_view_search_term: '退職 代行 バイト 即日', search_term_view_status: 'NONE',
    impressions: 9, clicks: 2, spend: 396, conversions: 1, all_conversions: 1,
    conversions_無料相談するボタンクリック: 1,
  },
  {
    ...conversionFields,
    campaign: '検索 #2', search_term_view_search_term: '退職 代行 バイト', search_term_view_status: 'ADDED',
    impressions: 127, clicks: 26, spend: 4259.08, conversions: 5.9921, all_conversions: 5.9921,
  },
]);
assert.equal(terms.candidates.length, 1);
assert.equal(terms.candidates[0].term, '退職 代行 バイト 即日');
assert.equal(terms.candidates[0].registered, false);

console.log(JSON.stringify({ ok: true, keywordGroups: keywords.keywords.length, candidates: terms.candidates.length }, null, 2));
