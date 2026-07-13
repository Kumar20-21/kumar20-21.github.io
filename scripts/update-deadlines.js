#!/usr/bin/env node

const fs = require('fs/promises');
const path = require('path');

const DATA_PATH = path.join(process.cwd(), 'data', 'deadlines.json');
const REQUEST_TIMEOUT_MS = 15000;
const KEYWORDS = ['deadline', 'submission', 'paper', 'abstract', 'important dates', 'call for papers'];
const CORE_RANK_URL = 'https://portal.core.edu.au/conf-ranks/';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectTimezone(text, fallback) {
  const tzMatch = text.match(/\b(AoE|UTC[+-]\d{1,2}|PST|EST|CST|MST|US\/Eastern|CET|CEST|GMT)\b/i);
  if (tzMatch) {
    return tzMatch[1].toUpperCase() === 'AOE' ? 'AoE' : tzMatch[1];
  }
  return fallback || 'UTC';
}

function normalizeDateParts(year, month, day, hh = '23', mm = '59') {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  const h = String(hh).padStart(2, '0');
  const min = String(mm).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

function parseCandidateDate(text) {
  const iso = text.match(/\b(20\d{2})[-\/.](\d{1,2})[-\/.](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?/);
  if (iso) {
    return normalizeDateParts(iso[1], iso[2], iso[3], iso[4] || '23', iso[5] || '59');
  }

  const longForm = text.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\s+(\d{1,2}),?\s+(20\d{2})(?:\s+(\d{1,2}):(\d{2}))?/i);
  if (longForm) {
    const parseSource = `${longForm[1]} ${longForm[2]} ${longForm[3]} ${longForm[4] ? `${longForm[4]}:${longForm[5]}` : '23:59'}`;
    const parsed = new Date(parseSource);
    if (!Number.isNaN(parsed.getTime())) {
      return normalizeDateParts(
        parsed.getUTCFullYear(),
        parsed.getUTCMonth() + 1,
        parsed.getUTCDate(),
        longForm[4] || '23',
        longForm[5] || '59'
      );
    }
  }

  return null;
}

function pickBestDeadlineCandidate(text) {
  const chunks = text
    .split(/(?<=[.!?])\s+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .slice(0, 4000);

  const scored = [];

  for (const chunk of chunks) {
    const lower = chunk.toLowerCase();
    const hasKeyword = KEYWORDS.some((keyword) => lower.includes(keyword));
    if (!hasKeyword) continue;

    const parsedDate = parseCandidateDate(chunk);
    if (!parsedDate) continue;

    let score = 0;
    score += 20;
    if (lower.includes('paper deadline')) score += 10;
    if (lower.includes('abstract')) score += 4;
    if (lower.includes('2026') || lower.includes('2027')) score += 6;

    scored.push({ chunk, parsedDate, score });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.length ? scored[0] : null;
}

function extractCanonicalUrl(html) {
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  return canonical ? canonical[1] : null;
}

function parseCoreRankRows(html) {
  const rows = [];
  const rowRe = /<tr class="(?:even|odd)row"[^>]*>([\s\S]*?)<\/tr>/g;
  let rowMatch;
  while ((rowMatch = rowRe.exec(html))) {
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    const cells = [];
    let cellMatch;
    while ((cellMatch = cellRe.exec(rowMatch[1]))) {
      cells.push(stripHtml(cellMatch[1]));
    }
    if (cells.length >= 4) {
      rows.push({ title: cells[0], acronym: cells[1], source: cells[2], rank: cells[3] });
    }
  }
  return rows;
}

// The site uses "A+" for CORE's top tier ("A*"); every other CORE rank
// (A, B, C, National, etc.) is passed through unchanged.
function mapCoreRank(coreRank) {
  return coreRank === 'A*' ? 'A+' : coreRank;
}

async function fetchConferenceRank(acronym) {
  const url = `${CORE_RANK_URL}?search=${encodeURIComponent(acronym)}&by=acronym&source=all&sort=arank&page=1`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'RankCrawler/1.0 (+https://github.com/Kumar20-21)' },
      redirect: 'follow',
      signal: controller.signal
    });

    if (!response.ok) {
      return { status: 'http_error', httpStatus: response.status };
    }

    const rows = parseCoreRankRows(await response.text());
    const match = rows.find((row) => row.acronym.toLowerCase() === acronym.toLowerCase());

    if (!match) {
      return { status: 'not_found', httpStatus: response.status };
    }

    return { status: 'ok', httpStatus: response.status, source: match.source, coreRank: match.rank };
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DeadlineCrawler/1.0 (+https://github.com/Kumar20-21)'
      },
      redirect: 'follow',
      signal: controller.signal
    });

    const html = await response.text();
    return {
      ok: response.ok,
      status: response.status,
      finalUrl: response.url || url,
      html
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const raw = await fs.readFile(DATA_PATH, 'utf8');
  const db = JSON.parse(raw);

  if (!Array.isArray(db.conferences)) {
    throw new Error('Invalid data/deadlines.json: conferences must be an array');
  }

  const today = new Date().toISOString().slice(0, 10);

  for (const conference of db.conferences) {
    if (!conference.link) continue;

    conference.crawl = conference.crawl || {};
    conference.crawl.last_checked = today;

    try {
      const page = await fetchPage(conference.link);
      conference.crawl.http_status = page.status;
      conference.crawl.status = page.ok ? 'ok' : 'http_error';
      conference.crawl.resolved_url = page.finalUrl;
      delete conference.crawl.error;

      if (page.ok && conference.skip_deadline_autodetect) {
        conference.crawl.detected_deadline_text = null;
        conference.crawl.detected_deadline_value = null;
        conference.crawl.deadline_updated = false;
        conference.crawl.note = 'Deadline auto-detection skipped (skip_deadline_autodetect); page renders dates via JS.';
      } else if (page.ok) {
        const canonical = extractCanonicalUrl(page.html);
        if (canonical && canonical.startsWith('http')) {
          conference.link = canonical;
        }

        const pageText = stripHtml(page.html);
        const picked = pickBestDeadlineCandidate(pageText);
        if (picked) {
          conference.crawl.detected_deadline_text = picked.chunk.slice(0, 250);
          conference.crawl.detected_deadline_value = picked.parsedDate;

          // Only update tracked deadline when the new value differs.
          if (conference.deadline !== picked.parsedDate) {
            conference.previous_deadline = conference.deadline || null;
            conference.deadline = picked.parsedDate;
            conference.timezone = detectTimezone(picked.chunk, conference.timezone);
            conference.crawl.deadline_updated = true;
          } else {
            conference.crawl.deadline_updated = false;
          }
        } else {
          conference.crawl.detected_deadline_text = null;
          conference.crawl.detected_deadline_value = null;
          conference.crawl.deadline_updated = false;
        }
      }
    } catch (error) {
      conference.crawl.status = 'fetch_error';
      conference.crawl.error = String(error.message || error);
    }

    // Polite crawl spacing
    await sleep(1000);

    const rankAcronym = conference.core_acronym || conference.title;
    conference.rank_crawl = conference.rank_crawl || {};
    conference.rank_crawl.last_checked = today;

    try {
      const rankResult = await fetchConferenceRank(rankAcronym);
      conference.rank_crawl.status = rankResult.status;
      conference.rank_crawl.http_status = rankResult.httpStatus;
      delete conference.rank_crawl.error;

      if (rankResult.status === 'ok') {
        const mappedRank = mapCoreRank(rankResult.coreRank);
        conference.rank_crawl.core_source = rankResult.source;
        conference.rank_crawl.core_rank = rankResult.coreRank;

        if (conference.rank !== mappedRank) {
          conference.previous_rank = conference.rank || null;
          conference.rank = mappedRank;
          conference.rank_crawl.updated = true;
        } else {
          conference.rank_crawl.updated = false;
        }
      } else {
        conference.rank_crawl.updated = false;
      }
    } catch (error) {
      conference.rank_crawl.status = 'fetch_error';
      conference.rank_crawl.error = String(error.message || error);
      conference.rank_crawl.updated = false;
    }

    // Polite crawl spacing (CORE portal is a separate host)
    await sleep(1000);
  }

  db.meta = db.meta || {};
  db.meta.last_updated = today;
  db.meta.last_rank_update = today;
  db.meta.updated_by = 'automated-crawler';

  await fs.writeFile(DATA_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
  console.log(`Updated ${DATA_PATH} on ${today}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
