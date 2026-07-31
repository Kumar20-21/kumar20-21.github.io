#!/usr/bin/env node

// Generates a real, crawlable index.html for each client-side route so that
// GitHub Pages serves an actual HTTP 200 with route-specific <title>/meta
// (rather than a 404 that gets JS-redirected back to "/"). The SPA's own
// pushState routing in app.js already knows how to show the right page
// once loaded, so each generated file is index.html with only the
// per-route <head> metadata swapped in.

const fs = require('fs');
const path = require('path');

const SITE_ROOT = path.join(__dirname, '..');
const SOURCE_FILE = path.join(SITE_ROOT, 'index.html');
const BASE_URL = 'https://kumar20-21.github.io';

const routes = [
  {
    path: 'aboutme',
    title: 'About — Keshav Kumar | Quantitative Researcher & Academic',
    description: 'About Keshav Kumar: quantitative researcher and academic working on reinforcement learning for high-frequency optimal execution, algorithmic trading, and risk management.',
  },
  {
    path: 'projects',
    title: 'Projects — Keshav Kumar',
    description: 'Research projects by Keshav Kumar in market microstructure and quantitative finance, including order flow toxicity in limit order books and optimal stopping in option pricing.',
  },
  {
    path: 'publications',
    title: 'Publications — Keshav Kumar',
    description: 'Academic publications by Keshav Kumar in quantitative finance and machine learning.',
  },
  {
    path: 'blog',
    title: 'Blog — Keshav Kumar',
    description: 'Writing by Keshav Kumar on quantitative research, market microstructure, and financial machine learning.',
  },
  {
    path: 'conference-tracker',
    title: 'Conference & Journal Deadline Tracker — Keshav Kumar',
    description: 'Tracked submission deadlines, ranks, and research areas for top quantitative finance and machine learning conferences and journals.',
  },
];

function replaceOnce(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    throw new Error(`Pattern not found while generating route metadata: ${label}`);
  }
  return html.replace(pattern, replacement);
}

function buildRouteHtml(sourceHtml, route) {
  const url = `${BASE_URL}/${route.path}`;
  let html = sourceHtml;

  html = replaceOnce(
    html,
    /<title>.*?<\/title>/,
    `<title>${route.title}</title>`,
    'title'
  );
  html = replaceOnce(
    html,
    /<meta name="description" content=".*?">/,
    `<meta name="description" content="${route.description}">`,
    'meta description'
  );
  html = replaceOnce(
    html,
    /<link rel="canonical" href=".*?">/,
    `<link rel="canonical" href="${url}">`,
    'canonical'
  );
  html = replaceOnce(
    html,
    /<meta property="og:url" content=".*?">/,
    `<meta property="og:url" content="${url}">`,
    'og:url'
  );
  html = replaceOnce(
    html,
    /<meta property="og:title" content=".*?">/,
    `<meta property="og:title" content="${route.title}">`,
    'og:title'
  );
  html = replaceOnce(
    html,
    /<meta property="og:description" content=".*?">/,
    `<meta property="og:description" content="${route.description}">`,
    'og:description'
  );
  html = replaceOnce(
    html,
    /<meta name="twitter:title" content=".*?">/,
    `<meta name="twitter:title" content="${route.title}">`,
    'twitter:title'
  );
  html = replaceOnce(
    html,
    /<meta name="twitter:description" content=".*?">/,
    `<meta name="twitter:description" content="${route.description}">`,
    'twitter:description'
  );

  return html;
}

function main() {
  const sourceHtml = fs.readFileSync(SOURCE_FILE, 'utf8');

  for (const route of routes) {
    const outDir = path.join(SITE_ROOT, route.path);
    const outFile = path.join(outDir, 'index.html');
    const routeHtml = buildRouteHtml(sourceHtml, route);

    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outFile, routeHtml);
    console.log(`Generated ${route.path}/index.html`);
  }
}

main();
