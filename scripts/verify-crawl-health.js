#!/usr/bin/env node

const fs = require('fs');

const file = process.argv[2] || 'data/deadlines.json';
const minSuccess = Number(process.env.MIN_CRAWL_SUCCESS || '1');

const raw = fs.readFileSync(file, 'utf8');
const db = JSON.parse(raw);

if (!db || !Array.isArray(db.conferences)) {
  console.error('Invalid deadlines data: conferences array missing');
  process.exit(1);
}

const statuses = db.conferences.map((c) => c.crawl?.status || 'missing');
const okCount = statuses.filter((s) => s === 'ok').length;
const errorCount = statuses.filter((s) => s === 'fetch_error' || s === 'http_error').length;
const missingCount = statuses.filter((s) => s === 'missing').length;

const metaDate = db.meta?.last_updated || 'missing';
const today = new Date().toISOString().slice(0, 10);

console.log(`Crawl health: ok=${okCount}, errors=${errorCount}, missing=${missingCount}, meta.last_updated=${metaDate}`);

if (metaDate !== today) {
  console.error(`Expected meta.last_updated=${today}, got ${metaDate}`);
  process.exit(2);
}

if (okCount < minSuccess) {
  console.error(`Expected at least ${minSuccess} successful crawl result(s), got ${okCount}`);
  process.exit(3);
}

console.log('Crawl health check passed.');
