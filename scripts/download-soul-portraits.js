#!/usr/bin/env node
/**
 * scripts/download-soul-portraits.js
 *
 * Downloads real character portrait images from MyAnimeList via the Jikan API
 * and updates registry/index.json to point at the downloaded files.
 *
 * Usage (run locally — requires outbound internet access):
 *   node scripts/download-soul-portraits.js
 *
 * Output: website/public/images/souls/{name}.jpg  (one per character)
 *         registry/index.json  (image fields updated to .jpg URLs)
 */

'use strict';

const https    = require('https');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const { URL }  = require('url');

const REGISTRY = path.join(__dirname, '..', 'registry', 'index.json');
const OUT_DIR  = path.join(__dirname, '..', 'website', 'public', 'images', 'souls');
const BASE_URL = 'https://0x8i11i0n.github.io/grimoire/images/souls';

fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── Character manifest ─────────────────────────────────────────────── */
// malId: character page ID on myanimelist.net
// query: search string used if the ID lookup fails
const CHARACTERS = [
  { name: 'lelouch',          malId: 417,    query: 'Lelouch Lamperouge' },
  { name: 'lightyagami',      malId: 71,     query: 'Light Yagami' },
  { name: 'gojo',             malId: 116281, query: 'Gojo Satoru' },
  { name: 'edwardelric',      malId: 11,     query: 'Edward Elric' },
  { name: 'roymustang',       malId: 8,      query: 'Roy Mustang' },
  { name: 'itachi',           malId: 4,      query: 'Itachi Uchiha' },
  { name: 'vegeta',           malId: 913,    query: 'Vegeta' },
  { name: 'levi',             malId: 36765,  query: 'Levi Ackerman' },
  { name: 'gilgamesh',        malId: 3248,   query: 'Gilgamesh Fate' },
  { name: 'diobrando',        malId: 2887,   query: 'Dio Brando' },
  { name: 'sungjinwoo',       malId: null,   query: 'Sung Jinwoo Solo Leveling' },
  // George Washington — historical portrait from Library of Congress (public domain)
  {
    name: 'georgewashington',
    malId: null,
    query: null,
    directUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Gilbert_Stuart_Williamstown_Portrait_of_George_Washington.jpg/400px-Gilbert_Stuart_Williamstown_Portrait_of_George_Washington.jpg',
  },
];

/* ── HTTP helpers ───────────────────────────────────────────────────── */

function get(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const opts   = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      headers:  {
        'User-Agent': 'GrimoireBot/1.0 (grimoire soul registry; https://github.com/0x8i11i0n/grimoire)',
        'Accept':     'application/json, image/*, */*',
      },
    };
    lib.get(opts, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        if (redirectsLeft === 0) return reject(new Error('Too many redirects'));
        return resolve(get(res.headers.location, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end',  ()  => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    }).on('error', reject);
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

/* ── Jikan API helpers ──────────────────────────────────────────────── */

const JIKAN = 'https://api.jikan.moe/v4';

async function getImageUrlById(malId) {
  const buf  = await get(`${JIKAN}/characters/${malId}`);
  const data = JSON.parse(buf.toString());
  return data?.data?.images?.jpg?.large_image_url
      ?? data?.data?.images?.jpg?.image_url
      ?? null;
}

async function getImageUrlByQuery(query) {
  const encoded = encodeURIComponent(query);
  const buf     = await get(`${JIKAN}/characters?q=${encoded}&limit=3`);
  const data    = JSON.parse(buf.toString());
  const first   = data?.data?.[0];
  return first?.images?.jpg?.large_image_url
      ?? first?.images?.jpg?.image_url
      ?? null;
}

/* ── Download one character ─────────────────────────────────────────── */

async function downloadCharacter(char) {
  const dest = path.join(OUT_DIR, `${char.name}.jpg`);

  // Already downloaded
  if (fs.existsSync(dest) && fs.statSync(dest).size > 5000) {
    console.log(`  ↷  ${char.name}.jpg  (already exists, skipping)`);
    return true;
  }

  let imageUrl = char.directUrl ?? null;

  // Try MAL ID first, then name search
  if (!imageUrl && char.malId) {
    try {
      imageUrl = await getImageUrlById(char.malId);
    } catch (e) {
      console.log(`     (id lookup failed for ${char.name}: ${e.message})`);
    }
    await sleep(400); // Jikan rate limit: ~3 req/s
  }

  if (!imageUrl && char.query) {
    try {
      imageUrl = await getImageUrlByQuery(char.query);
    } catch (e) {
      console.log(`     (search failed for ${char.name}: ${e.message})`);
    }
    await sleep(400);
  }

  if (!imageUrl) {
    console.log(`  ✗  ${char.name}  — could not resolve image URL`);
    return false;
  }

  try {
    const img = await get(imageUrl);
    if (img.length < 1000) throw new Error(`Suspiciously small file (${img.length} bytes)`);
    fs.writeFileSync(dest, img);
    console.log(`  ✓  ${char.name}.jpg  (${Math.round(img.length / 1024)} KB)`);
    return true;
  } catch (e) {
    console.log(`  ✗  ${char.name}  — download failed: ${e.message}`);
    return false;
  }
}

/* ── Update registry ────────────────────────────────────────────────── */

function updateRegistry(succeeded) {
  const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  let updated = 0;
  for (const soul of reg.souls) {
    if (succeeded.includes(soul.name)) {
      soul.image = `${BASE_URL}/${soul.name}.jpg`;
      updated++;
    }
  }
  fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  console.log(`\n  ✓  registry/index.json  — updated ${updated} image URLs to .jpg`);
}

/* ── Main ───────────────────────────────────────────────────────────── */

async function main() {
  console.log('\nDownloading soul portraits via Jikan (MyAnimeList)…\n');
  const succeeded = [];

  for (const char of CHARACTERS) {
    const ok = await downloadCharacter(char);
    if (ok) succeeded.push(char.name);
    await sleep(350); // stay well under Jikan's 3 req/s limit
  }

  if (succeeded.length > 0) updateRegistry(succeeded);

  const failed = CHARACTERS.map((c) => c.name).filter((n) => !succeeded.includes(n));
  console.log(`\nDone — ${succeeded.length} downloaded, ${failed.length} failed`);
  if (failed.length) console.log(`Failed: ${failed.join(', ')}`);
  console.log('\nNext: git add website/public/images/souls/ registry/index.json && git commit -m "chore: add character portraits"\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
