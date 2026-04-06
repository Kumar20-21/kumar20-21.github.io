#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const indexPath = path.join(process.cwd(), 'index.html');
const year = String(new Date().getUTCFullYear());

const src = fs.readFileSync(indexPath, 'utf8');
const pattern = /(<span\s+id="copyright-year">)(\d{4})(<\/span>)/;

if (!pattern.test(src)) {
  console.error('Could not find copyright-year span in index.html');
  process.exit(1);
}

const out = src.replace(pattern, `$1${year}$3`);

if (out === src) {
  console.log(`No change needed. Year already ${year}.`);
  process.exit(0);
}

fs.writeFileSync(indexPath, out, 'utf8');
console.log(`Updated copyright year to ${year}.`);
