#!/usr/bin/env node
'use strict';

const fs = require('node:fs/promises');
const path = require('node:path');

const DATA_PATH = path.join(process.cwd(), 'data', 'deadlines.json');
const REQUEST_TIMEOUT_MS = 15000;
const CORE_RANK_URL = 'https://portal.core.edu.au/conf-ranks/';
const USER_AGENT = 'ConferenceDeadlineCrawler/2.0 (+https://github.com/Kumar20-21/kumar20-21.github.io)';
const MONTHS = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9, oct: 10,
  october: 10, nov: 11, november: 11, dec: 12, december: 12
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function decodeEntities(value) {
  return String(value)
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}

function stripHtml(html) {
  return decodeEntities(String(html)
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<(?:br|\/p|\/div|\/li|\/tr|\/td|\/th|\/h[1-6]|\/section|\/article|\/table)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' '))
    .replace(/[ \t\r\f\v]+/g, ' ')
    .replace(/\n[ \t]*/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim();
}

function normalizeDateParts(year, month, day, hour = 23, minute = 59) {
  const y = Number(year), m = Number(month), d = Number(day);
  const h = Number(hour), min = Number(minute);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 ||
      date.getUTCDate() !== d || h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')} ${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function parseDateMatches(text) {
  const results = [];
  const patterns = [
    {
      re: /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})(?:[ T,]+(\d{1,2}):(\d{2}))?\b/g,
      parse: m => normalizeDateParts(m[1], m[2], m[3], m[4] ?? 23, m[5] ?? 59)
    },
    {
      re: /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?[,]?\s+(20\d{2})(?:\s*(?:at)?\s*(\d{1,2}):(\d{2})\s*(AM|PM)?)?/gi,
      parse: m => {
        let hour = m[4] == null ? 23 : Number(m[4]);
        const minute = m[5] == null ? 59 : Number(m[5]);
        if (m[6]) {
          const ampm = m[6].toUpperCase();
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;
        }
        return normalizeDateParts(m[3], MONTHS[m[1].toLowerCase().replace('.', '')], m[2], hour, minute);
      }
    },
    {
      re: /\b(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.?\s+(20\d{2})\b/gi,
      parse: m => normalizeDateParts(m[3], MONTHS[m[2].toLowerCase().replace('.', '')], m[1])
    }
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern.re)) {
      const value = pattern.parse(match);
      if (value) results.push({ value, index: match.index, raw: match[0] });
    }
  }
  return results.sort((a, b) => a.index - b.index);
}

function detectTimezone(text, fallback = 'AoE') {
  const match = text.match(/\b(AoE|UTC[+-]\d{1,2}(?::\d{2})?|PST|PDT|EST|EDT|CST|CDT|MST|MDT|CET|CEST|GMT)\b/i);
  if (!match) return fallback;
  return match[1].toUpperCase() === 'AOE' ? 'AoE' : match[1];
}

function deadlineCandidate(text, kind) {
  const lines = text.split(/\n|(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  const scored = [];
  const deadlineWords = /\b(deadline|due date|submission closes?|submission deadline|papers? due|abstracts? due|important dates?|call for papers|submission)\b/i;
  const abstractWords = /\babstract\b/i;
  const paperWords = /\b(full paper|paper submission|submission deadline|papers? due|manuscript)\b/i;
  const nonSubmissionWords = /\b(notification|acceptance notification|camera[- ]ready|early registration|conference dates?|rebuttal|reviewer registration|decision date)\b/i;

  for (let i = 0; i < lines.length; i++) {
    const chunk = [lines[i - 1], lines[i], lines[i + 1]].filter(Boolean).join(' ').slice(0, 900);
    if (!deadlineWords.test(chunk)) continue;
    if (nonSubmissionWords.test(chunk) && !/submission deadline|papers? due|abstracts? due/i.test(chunk)) continue;
    if (kind === 'abstract' && !abstractWords.test(chunk)) continue;
    if (kind === 'paper' && abstractWords.test(chunk) && !paperWords.test(chunk)) continue;

    const dates = parseDateMatches(chunk);
    if (!dates.length) continue;
    let score = 10;
    if (/submission deadline|paper deadline|papers? due|submission closes?/i.test(chunk)) score += 8;
    if (kind === 'abstract' && /abstract/i.test(chunk)) score += 8;
    if (kind === 'paper' && /full paper|paper submission/i.test(chunk)) score += 5;
    if (/important dates|call for papers/i.test(chunk)) score += 2;
    const today = new Date().toISOString().slice(0, 10);
    if (dates.some(d => d.value.slice(0, 10) >= today)) score += 1;
    scored.push({ text: chunk, date: dates[0].value, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored[0] || null;
}

function getAttr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(["'])(.*?)\\1`, 'i'));
  return match ? decodeEntities(match[2]) : null;
}

function discoverEditionLink(html, baseUrl, conference) {
  if (!conference.series_id || !conference.year) return null;
  const acronym = String(conference.series_id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const year = String(conference.year);
  const anchorRe = /<a\b[^>]*>[\s\S]*?<\/a>/gi;
  const candidates = [];
  for (const match of html.matchAll(anchorRe)) {
    const tag = match[0];
    const openTag = tag.match(/^<a\b[^>]*>/i)?.[0] || '';
    const href = getAttr(openTag, 'href');
    if (!href || /^(?:#|mailto:|javascript:|tel:)/i.test(href)) continue;
    const label = stripHtml(tag.replace(/^<a\b[^>]*>/i, '').replace(/<\/a>$/i, ' '));
    if (!new RegExp(`\\b${year}\\b`).test(`${label} ${href}`)) continue;
    if (!new RegExp(`\\b${acronym}\\b`, 'i').test(`${label} ${href}`)) continue;
    try {
      const candidate = new URL(href, baseUrl);
      if (!['http:', 'https:'].includes(candidate.protocol)) continue;
      let score = 0;
      if (/\b(dates|important-dates|importantdates|call-for-papers|cfp)\b/i.test(`${label} ${candidate.pathname}`)) score += 8;
      if (/\b(conference|edition|main track)\b/i.test(label)) score += 2;
      if (candidate.hostname === new URL(baseUrl).hostname) score += 1;
      candidates.push({ url: candidate.href, score, label });
    } catch { /* ignore malformed href */ }
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.url || null;
}

function extractCanonicalUrl(html, baseUrl) {
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/\brel\s*=\s*["'][^"']*canonical[^"']*["']/i.test(tag)) continue;
    const href = getAttr(tag, 'href');
    if (href) {
      try { return new URL(href, baseUrl).href; } catch { return null; }
    }
  }
  return null;
}

function parseCoreRankRows(html) {
  const rows = [];
  for (const row of html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map(m => stripHtml(m[1]));
    if (cells.length >= 4 && cells[1]) rows.push({ title: cells[0], acronym: cells[1], source: cells[2], rank: cells[3] });
  }
  return rows;
}

function mapCoreRank(rank) {
  return rank === 'A*' ? 'A+' : rank;
}

async function fetchText(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml,*/*' },
      redirect: 'follow',
      signal: controller.signal
    });
    return { ok: response.ok, status: response.status, finalUrl: response.url || url, text: await response.text() };
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverEdition(conference) {
  if (!conference.series_url || !conference.series_id || !conference.year) return;
  conference.source_discovery ||= {};
  conference.source_discovery.last_checked = new Date().toISOString().slice(0, 10);

  const today = new Date().toISOString().slice(0, 10);
  const currentYear = new Date().getUTCFullYear();
  const storedDeadline = String(conference.deadline || '').slice(0, 10);
  const shouldLookForNextEdition =
    Number(conference.year) <= currentYear &&
    storedDeadline &&
    storedDeadline < today;
  const targetYear = shouldLookForNextEdition ? currentYear + 1 : Number(conference.year);
  const isRollover = targetYear !== Number(conference.year);

  try {
    const seriesPage = await fetchText(conference.series_url);
    conference.source_discovery.http_status = seriesPage.status;
    if (!seriesPage.ok) {
      conference.source_discovery.status = 'series_source_error';
      return;
    }
    const candidate = discoverEditionLink(
      seriesPage.text,
      seriesPage.finalUrl,
      { ...conference, year: targetYear }
    );
    if (!candidate) {
      conference.source_discovery.status = isRollover ? 'next_edition_not_published' : 'no_candidate';
      conference.source_discovery.target_year = targetYear;
      conference.source_discovery.updated = false;
      return;
    }
    conference.source_discovery.candidate_url = candidate;
    conference.source_discovery.target_year = targetYear;
    const candidatePage = await fetchText(candidate);
    if (!candidatePage.ok) {
      conference.source_discovery.status = 'candidate_unreachable';
      conference.source_discovery.candidate_http_status = candidatePage.status;
      conference.source_discovery.updated = false;
      return;
    }
    const candidateText = stripHtml(candidatePage.text);
    const escapedId = String(conference.series_id).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const identity = new RegExp(`\\b${escapedId}\\b`, 'i');
    const year = new RegExp(`\\b${targetYear}\\b`);
    const fullNameFirstWords = String(conference.full_name || '').split(/\s+/).slice(0, 3).join(' ');
    const identityVerified = identity.test(candidateText) ||
      (fullNameFirstWords.length > 8 && candidateText.toLowerCase().includes(fullNameFirstWords.toLowerCase()));
    if (!identityVerified || !year.test(candidateText)) {
      conference.source_discovery.status = 'candidate_identity_unverified';
      conference.source_discovery.updated = false;
      return;
    }

    // For a year rollover, require a recognizable paper deadline before replacing
    // the old edition. This avoids deleting useful data for JS-only or incomplete pages.
    const paperCandidate = deadlineCandidate(candidateText, 'paper');
    const abstractCandidate = deadlineCandidate(candidateText, 'abstract');
    if (isRollover && !paperCandidate) {
      conference.source_discovery.status = 'next_edition_found_deadline_unverified';
      conference.source_discovery.updated = false;
      return;
    }

    conference.source_discovery.candidate_http_status = candidatePage.status;
    if (isRollover) {
      conference.previous_edition = {
        year: conference.year,
        id: conference.id,
        link: conference.link,
        deadline: conference.deadline || null,
        abstract_deadline: conference.abstract_deadline || null
      };
      conference.year = targetYear;
      const idPrefix = String(conference.id || conference.series_id.toLowerCase()).replace(/\d+$/, '');
      conference.id = `${idPrefix}${String(targetYear).slice(-2)}`;
      conference.deadline = paperCandidate.date;
      conference.abstract_deadline = abstractCandidate?.date || null;
      conference.date = 'To be confirmed';
      conference.city = 'TBD';
      conference.country = 'TBD';
      conference.note = `Automatically advanced to the verified ${targetYear} edition. Confirm venue and event dates on the official website.`;
      conference.source_discovery.status = 'advanced_to_next_edition';
    } else {
      conference.source_discovery.status = 'verified';
    }

    if (candidate !== conference.link) {
      if (!isRollover) conference.previous_link = conference.link || null;
      conference.link = candidate;
      conference.source_discovery.updated = true;
    } else {
      conference.source_discovery.updated = isRollover;
    }
  } catch (error) {
    conference.source_discovery.status = 'fetch_error';
    conference.source_discovery.error = String(error?.message || error);
    conference.source_discovery.updated = false;
  }
}

async function fetchConferenceRank(acronym) {
  const url = `${CORE_RANK_URL}?search=${encodeURIComponent(acronym)}&by=acronym&source=all&sort=arank&page=1`;
  const page = await fetchText(url);
  if (!page.ok) return { status: 'http_error', httpStatus: page.status };
  const match = parseCoreRankRows(page.text).find(row => row.acronym.toLowerCase() === acronym.toLowerCase());
  return match
    ? { status: 'ok', httpStatus: page.status, source: match.source, coreRank: match.rank }
    : { status: 'not_found', httpStatus: page.status };
}

async function main() {
  const db = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'));
  if (!db || !Array.isArray(db.conferences)) throw new Error('Invalid data/deadlines.json: conferences must be an array');
  const today = new Date().toISOString().slice(0, 10);
  const stats = { checked: 0, fetched: 0, detectedPaper: 0, detectedAbstract: 0, skipped: 0, failed: 0, editionUrlsUpdated: 0 };

  for (const conference of db.conferences) {
    if (!conference.link && !conference.series_url) continue;
    stats.checked++;

    if (conference.series_url) {
      const oldLink = conference.link;
      await discoverEdition(conference);
      if (conference.link && conference.link !== oldLink) stats.editionUrlsUpdated++;
      await sleep(500);
    }
    if (!conference.link) continue;

    conference.crawl ||= {};
    conference.crawl.last_checked = today;
    try {
      const page = await fetchText(conference.link);
      conference.crawl.http_status = page.status;
      conference.crawl.status = page.ok ? 'ok' : 'http_error';
      conference.crawl.resolved_url = page.finalUrl;
      delete conference.crawl.error;

      if (!page.ok) {
        stats.failed++;
      } else {
        stats.fetched++;
        if (conference.skip_deadline_autodetect) {
        stats.skipped++;
        conference.crawl.deadline_updated = false;
        conference.crawl.note = 'Automatic deadline detection disabled for this source; stored deadline preserved.';
      } else {
        const canonical = extractCanonicalUrl(page.text, page.finalUrl);
        // Canonical URLs are accepted only on the same host to avoid accidental source switching.
        if (canonical && new URL(canonical).hostname === new URL(page.finalUrl).hostname) {
          conference.crawl.canonical_url = canonical;
        }

        const text = stripHtml(page.text);
        const paper = deadlineCandidate(text, 'paper');
        const abstract = deadlineCandidate(text, 'abstract');
        conference.crawl.detected_deadline_text = paper?.text.slice(0, 300) ?? null;
        conference.crawl.detected_deadline_value = paper?.date ?? null;
        conference.crawl.detected_abstract_deadline_text = abstract?.text.slice(0, 300) ?? null;
        conference.crawl.detected_abstract_deadline_value = abstract?.date ?? null;
        conference.crawl.deadline_updated = false;
        conference.crawl.abstract_deadline_updated = false;

        if (paper) {
          if (conference.deadline !== paper.date) {
            conference.previous_deadline = conference.deadline || null;
            conference.deadline = paper.date;
            conference.timezone = detectTimezone(paper.text, conference.timezone || 'AoE');
            conference.crawl.deadline_updated = true;
          }
          stats.detectedPaper++;
        }
        if (abstract) {
          if (conference.abstract_deadline !== abstract.date) {
            conference.previous_abstract_deadline = conference.abstract_deadline || null;
            conference.abstract_deadline = abstract.date;
            conference.timezone = detectTimezone(abstract.text, conference.timezone || 'AoE');
            conference.crawl.abstract_deadline_updated = true;
          }
          stats.detectedAbstract++;
        }
        if (!paper && !abstract) {
          conference.crawl.note = 'Page fetched, but no supported deadline candidate was found; stored deadlines were preserved.';
        } else {
          delete conference.crawl.note;
        }
        }
      }
    } catch (error) {
      conference.crawl.status = 'fetch_error';
      conference.crawl.error = String(error?.message || error);
      stats.failed++;
    }
    await sleep(750);

    const rankAcronym = conference.core_acronym || conference.series_id || conference.title;
    conference.rank_crawl ||= {};
    conference.rank_crawl.last_checked = today;
    try {
      const result = await fetchConferenceRank(rankAcronym);
      conference.rank_crawl.status = result.status;
      conference.rank_crawl.http_status = result.httpStatus;
      delete conference.rank_crawl.error;
      if (result.status === 'ok') {
        const mapped = mapCoreRank(result.coreRank);
        conference.rank_crawl.core_source = result.source;
        conference.rank_crawl.core_rank = result.coreRank;
        conference.rank_crawl.updated = conference.rank !== mapped;
        if (conference.rank !== mapped) {
          conference.previous_rank = conference.rank || null;
          conference.rank = mapped;
        }
      } else conference.rank_crawl.updated = false;
    } catch (error) {
      conference.rank_crawl.status = 'fetch_error';
      conference.rank_crawl.error = String(error?.message || error);
      conference.rank_crawl.updated = false;
    }
    await sleep(500);
  }

  db.meta ||= {};
  db.meta.last_updated = today;
  db.meta.last_rank_update = today;
  db.meta.updated_by = 'automated-crawler';
  db.meta.crawl_summary = stats;
  await fs.writeFile(DATA_PATH, `${JSON.stringify(db, null, 2)}\n`, 'utf8');
  console.log(`Updated ${DATA_PATH} on ${today}`);
  console.log(`Crawl summary: ${JSON.stringify(stats)}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
