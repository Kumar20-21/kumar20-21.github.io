#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const file = process.argv[2] || 'data/deadlines.json';
const minSuccess = Number(process.env.MIN_CRAWL_SUCCESS || '1');
const minSuccessRate = Number(process.env.MIN_CRAWL_SUCCESS_RATE || '0.50');

let db;
try {
  db = JSON.parse(fs.readFileSync(file, 'utf8'));
} catch (error) {
  console.error(`Cannot read/parse ${file}: ${error.message}`);
  process.exit(1);
}

if (!db || !Array.isArray(db.conferences) ||
    (db.journals !== undefined && !Array.isArray(db.journals))) {
  console.error('Invalid deadlines data: conferences must be an array and journals must be an array when present');
  process.exit(1);
}

const tracked = db.conferences.filter(c => c && c.link);
const okCount = tracked.filter(c => c.crawl?.status === 'ok').length;
const errorCount = tracked.filter(c => ['fetch_error', 'http_error'].includes(c.crawl?.status)).length;
const missingCount = tracked.filter(c => !c.crawl?.status || c.crawl?.status === 'not_checked').length;
const paperCandidates = tracked.filter(c => c.crawl?.detected_deadline_value).length;
const abstractCandidates = tracked.filter(c => c.crawl?.detected_abstract_deadline_value).length;
const discoveryUpdated = db.conferences.filter(c => c.source_discovery?.updated).length;
const discoveryNeedsAttention = db.conferences.filter(c =>
  ['series_source_error', 'candidate_unreachable', 'candidate_identity_unverified', 'fetch_error'].includes(c.source_discovery?.status)
).length;
const successRate = tracked.length ? okCount / tracked.length : 0;
const metaDate = db.meta?.last_updated || 'missing';
const today = new Date().toISOString().slice(0, 10);

console.log(
  `Crawl health: tracked=${tracked.length}, ok=${okCount}, errors=${errorCount}, ` +
  `missing=${missingCount}, paper_candidates=${paperCandidates}, abstract_candidates=${abstractCandidates}, ` +
  `edition_urls_updated=${discoveryUpdated}, discovery_needs_attention=${discoveryNeedsAttention}, ` +
  `success_rate=${successRate.toFixed(2)}, meta.last_updated=${metaDate}`
);

if (metaDate !== today) {
  console.error(`Expected meta.last_updated=${today}, got ${metaDate}`);
  process.exit(2);
}
if (!Number.isFinite(minSuccess) || minSuccess < 1 || okCount < minSuccess) {
  console.error(`Expected at least ${minSuccess} successful crawl(s), got ${okCount}`);
  process.exit(3);
}
if (!Number.isFinite(minSuccessRate) || minSuccessRate < 0 || minSuccessRate > 1) {
  console.error('MIN_CRAWL_SUCCESS_RATE must be a number between 0 and 1');
  process.exit(4);
}
if (successRate < minSuccessRate) {
  console.error(`Crawl success rate ${successRate.toFixed(2)} is below required ${minSuccessRate.toFixed(2)}.`);
  process.exit(5);
}
if (paperCandidates === 0) {
  console.warn('Warning: no paper-deadline candidates detected; inspect crawler output and conference-specific parsers.');
}
if (discoveryNeedsAttention > 0) {
  console.warn(`Warning: ${discoveryNeedsAttention} conference edition source(s) need review; existing URLs were preserved when verification failed.`);
}
console.log('Crawl health check passed.');
