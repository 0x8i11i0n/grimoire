#!/usr/bin/env node
/**
 * scripts/generate-soul-portraits.js
 *
 * Generates stylised SVG portrait art for every soul in registry/index.json.
 * Each SVG uses character-specific colours, geometry, and a thematic symbol.
 *
 * Usage:  node scripts/generate-soul-portraits.js
 * Output: website/public/images/souls/{name}.svg
 *         registry/index.json  (image field updated to .svg URLs)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const REGISTRY = path.join(__dirname, '..', 'registry', 'index.json');
const OUT_DIR  = path.join(__dirname, '..', 'website', 'public', 'images', 'souls');
const BASE_URL = 'https://0x8i11i0n.github.io/grimoire/images/souls';

fs.mkdirSync(OUT_DIR, { recursive: true });

/* ── Per-character configuration ───────────────────────────────────── */
const CHARS = {
  lelouch: {
    symbol: '&#x265F;',  // ♟ chess pawn
    sigil:  'Z E R O',
    bg1: '#07031a', bg2: '#2a0f5e',
    accent: '#c084fc', accent2: '#6b21a8',
    deco: 'hexagons',
  },
  lightyagami: {
    symbol: '&#x2726;',  // ✦ four-pointed star
    sigil:  'K I R A',
    bg1: '#0a0a14', bg2: '#22224a',
    accent: '#c4a265', accent2: '#78613a',
    deco: 'ruled_lines',
  },
  gojo: {
    symbol: '&#x221E;',  // ∞ infinity
    sigil:  'I N F I N I T Y',
    bg1: '#02091a', bg2: '#0d2d60',
    accent: '#60a5fa', accent2: '#1d4ed8',
    deco: 'circles',
  },
  edwardelric: {
    symbol: '&#x2295;',  // ⊕ circled plus
    sigil:  'F U L L M E T A L',
    bg1: '#180200', bg2: '#3d1500',
    accent: '#fbbf24', accent2: '#b45309',
    deco: 'alchemy',
  },
  roymustang: {
    symbol: '&#x2726;',  // ✦
    sigil:  'F L A M E',
    bg1: '#1a0500', bg2: '#3d1500',
    accent: '#f97316', accent2: '#b91c1c',
    deco: 'flame',
  },
  itachi: {
    symbol: '&#x25C8;',  // ◈ white diamond w/ dot
    sigil:  'S H A R I N G A N',
    bg1: '#0f0000', bg2: '#2d0808',
    accent: '#f87171', accent2: '#7f1d1d',
    deco: 'tomoe',
  },
  vegeta: {
    symbol: '&#x22C6;',  // ⋆ star operator
    sigil:  'S A I Y A N',
    bg1: '#030818', bg2: '#0f1a4a',
    accent: '#818cf8', accent2: '#4338ca',
    deco: 'rays',
  },
  levi: {
    symbol: '&#x2716;',  // ✖ heavy multiplication (crossed)
    sigil:  'S U R V E Y',
    bg1: '#040d0d', bg2: '#122020',
    accent: '#6ee7b7', accent2: '#047857',
    deco: 'hatch',
  },
  gilgamesh: {
    symbol: '&#x265B;',  // ♛ white chess queen
    sigil:  'K I N G',
    bg1: '#120a00', bg2: '#2d1800',
    accent: '#fbbf24', accent2: '#92400e',
    deco: 'gate',
  },
  diobrando: {
    symbol: '&#x2605;',  // ★ black star
    sigil:  'Z A  W A R U D O',
    bg1: '#1a0000', bg2: '#3d0505',
    accent: '#f43f5e', accent2: '#9f1239',
    deco: 'clock',
  },
  sungjinwoo: {
    symbol: '&#x25C8;',  // ◈
    sigil:  'S H A D O W',
    bg1: '#020408', bg2: '#0a1828',
    accent: '#a78bfa', accent2: '#2e1065',
    deco: 'shadow',
  },
  georgewashington: {
    symbol: '&#x229B;',  // ⊛ circled asterisk
    sigil:  'P R E S I D E N T',
    bg1: '#030610', bg2: '#0d1830',
    accent: '#94a3b8', accent2: '#334155',
    deco: 'stars',
  },
};

/* ── Decoration generators ─────────────────────────────────────────── */

function n(v, d = 1) { return v.toFixed(d); }

function hexagons(cfg) {
  const cx = 200, cy = 240;
  const out = [];
  for (const r of [42, 82, 130, 180]) {
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = Math.PI / 180 * (60 * i - 30);
      return `${n(cx + r * Math.cos(a))},${n(cy + r * Math.sin(a))}`;
    }).join(' ');
    const op = r > 100 ? 0.14 : 0.26;
    out.push(`<polygon points="${pts}" fill="none" stroke="${cfg.accent}" stroke-width="${r > 100 ? 0.4 : 0.7}" stroke-opacity="${op}"/>`);
  }
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    out.push(`<line x1="${cx}" y1="${cy}" x2="${n(cx + 180 * Math.cos(a))}" y2="${n(cy + 180 * Math.sin(a))}" stroke="${cfg.accent}" stroke-width="0.4" stroke-opacity="0.1"/>`);
  }
  return out.join('\n  ');
}

function ruled_lines(cfg) {
  const out = [];
  for (let y = 38; y < 490; y += 22)
    out.push(`<line x1="20" y1="${y}" x2="380" y2="${y}" stroke="${cfg.accent}" stroke-width="0.5" stroke-opacity="0.09"/>`);
  out.push(`<line x1="58" y1="0" x2="58" y2="500" stroke="${cfg.accent2}" stroke-width="0.8" stroke-opacity="0.18"/>`);
  return out.join('\n  ');
}

function circles(cfg) {
  const cx = 200, cy = 230;
  const out = [];
  for (const [r, op, sw] of [[28,0.35,0.9],[62,0.22,0.6],[108,0.15,0.5],[162,0.1,0.4],[222,0.07,0.3],[290,0.05,0.25]]) {
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${cfg.accent}" stroke-width="${sw}" stroke-opacity="${op}"/>`);
  }
  out.push(`<line x1="${cx-295}" y1="${cy}" x2="${cx+295}" y2="${cy}" stroke="${cfg.accent}" stroke-width="0.3" stroke-opacity="0.09"/>`);
  out.push(`<line x1="${cx}" y1="${cy-295}" x2="${cx}" y2="${cy+295}" stroke="${cfg.accent}" stroke-width="0.3" stroke-opacity="0.09"/>`);
  return out.join('\n  ');
}

function triPts(cx, cy, r, offset) {
  return Array.from({ length: 3 }, (_, i) => {
    const a = Math.PI / 180 * (120 * i - 90 + offset);
    return `${n(cx + r * Math.cos(a))},${n(cy + r * Math.sin(a))}`;
  }).join(' ');
}

function alchemy(cfg) {
  const cx = 200, cy = 240, R = 158;
  const out = [];
  out.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${cfg.accent}" stroke-width="0.6" stroke-opacity="0.2"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${n(R * 0.85)}" fill="none" stroke="${cfg.accent}" stroke-width="0.35" stroke-opacity="0.12"/>`);
  out.push(`<polygon points="${triPts(cx, cy, R * 0.74, 0)}" fill="none" stroke="${cfg.accent}" stroke-width="0.7" stroke-opacity="0.25"/>`);
  out.push(`<polygon points="${triPts(cx, cy, R * 0.74, 180)}" fill="none" stroke="${cfg.accent}" stroke-width="0.7" stroke-opacity="0.25"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${n(R * 0.28)}" fill="none" stroke="${cfg.accent}" stroke-width="0.6" stroke-opacity="0.22"/>`);
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * 2 * i / 12;
    const x1 = cx + R * Math.cos(a), y1 = cy + R * Math.sin(a);
    const x2 = cx + (R - 12) * Math.cos(a), y2 = cy + (R - 12) * Math.sin(a);
    out.push(`<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${cfg.accent}" stroke-width="0.9" stroke-opacity="0.22"/>`);
  }
  return out.join('\n  ');
}

function flame(cfg) {
  const cx = 200, by = 490;
  const out = [];
  const lens = [148,168,192,222,252,274,262,242,202,170,152,170,202,242,262,274,252,222,192,168];
  for (let i = 0; i < 20; i++) {
    const a = -Math.PI * 0.78 + Math.PI * 1.56 * i / 19;
    out.push(`<line x1="${cx}" y1="${by}" x2="${n(cx + lens[i] * Math.cos(a))}" y2="${n(by + lens[i] * Math.sin(a))}" stroke="${cfg.accent}" stroke-width="0.6" stroke-opacity="${0.08 + (i % 3) * 0.03}"/>`);
  }
  out.push(`<line x1="${cx}" y1="${by}" x2="${cx}" y2="-20" stroke="${cfg.accent}" stroke-width="0.9" stroke-opacity="0.14"/>`);
  return out.join('\n  ');
}

function tomoe(cfg) {
  const cx = 200, cy = 240;
  const out = [];
  out.push(`<circle cx="${cx}" cy="${cy}" r="140" fill="none" stroke="${cfg.accent}" stroke-width="0.5" stroke-opacity="0.16"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="50" fill="none" stroke="${cfg.accent}" stroke-width="0.8" stroke-opacity="0.24"/>`);
  for (let i = 0; i < 3; i++) {
    const a = Math.PI * 2 * i / 3 - Math.PI / 2;
    const tx = cx + 90 * Math.cos(a), ty = cy + 90 * Math.sin(a);
    out.push(`<circle cx="${n(tx)}" cy="${n(ty)}" r="11" fill="${cfg.accent}" fill-opacity="0.18"/>`);
    out.push(`<circle cx="${n(tx)}" cy="${n(ty)}" r="11" fill="none" stroke="${cfg.accent}" stroke-width="1.1" stroke-opacity="0.42"/>`);
    const a2 = a + Math.PI * 0.6;
    const qx = cx + 72 * Math.cos(a + Math.PI * 0.3), qy = cy + 72 * Math.sin(a + Math.PI * 0.3);
    const ex = cx + 52 * Math.cos(a2), ey = cy + 52 * Math.sin(a2);
    out.push(`<path d="M${n(tx)},${n(ty)} Q${n(qx)},${n(qy)} ${n(ex)},${n(ey)}" fill="none" stroke="${cfg.accent}" stroke-width="0.9" stroke-opacity="0.3"/>`);
  }
  return out.join('\n  ');
}

function rays(cfg) {
  const cx = 200, cy = 248;
  const out = [];
  for (let i = 0; i < 24; i++) {
    const a = Math.PI * 2 * i / 24;
    const ir = 18, or = 200 + (i % 3 === 0 ? 32 : 0);
    out.push(`<line x1="${n(cx + ir * Math.cos(a))}" y1="${n(cy + ir * Math.sin(a))}" x2="${n(cx + or * Math.cos(a))}" y2="${n(cy + or * Math.sin(a))}" stroke="${cfg.accent}" stroke-width="${i % 4 === 0 ? 0.8 : 0.4}" stroke-opacity="${i % 4 === 0 ? 0.18 : 0.08}"/>`);
  }
  return out.join('\n  ');
}

function hatch(cfg) {
  const out = [];
  for (let i = -500; i < 900; i += 28)
    out.push(`<line x1="${i}" y1="0" x2="${i + 500}" y2="500" stroke="${cfg.accent}" stroke-width="0.45" stroke-opacity="0.07"/>`);
  for (let i = -500; i < 900; i += 28)
    out.push(`<line x1="${i}" y1="500" x2="${i + 500}" y2="0" stroke="${cfg.accent}" stroke-width="0.45" stroke-opacity="0.07"/>`);
  return out.join('\n  ');
}

function gate(cfg) {
  const out = [];
  const sp = 85;
  const ox = 200 - 1.5 * sp, oy = 240 - 1.5 * sp;
  for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
    const cx2 = ox + c * sp, cy2 = oy + r * sp, s = 26;
    const op = (r === 1 || r === 2) ? 0.2 : 0.12;
    out.push(`<polygon points="${cx2},${cy2-s} ${cx2+s},${cy2} ${cx2},${cy2+s} ${cx2-s},${cy2}" fill="none" stroke="${cfg.accent}" stroke-width="0.6" stroke-opacity="${op}"/>`);
  }
  return out.join('\n  ');
}

function clock(cfg) {
  const cx = 200, cy = 240, R = 148;
  const out = [];
  out.push(`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${cfg.accent}" stroke-width="0.6" stroke-opacity="0.18"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="${n(R * 0.9)}" fill="none" stroke="${cfg.accent}" stroke-width="0.3" stroke-opacity="0.08"/>`);
  for (let i = 0; i < 12; i++) {
    const a = Math.PI * 2 * i / 12 - Math.PI / 2;
    const big = i % 3 === 0;
    out.push(`<line x1="${n(cx + (R - 4) * Math.cos(a))}" y1="${n(cy + (R - 4) * Math.sin(a))}" x2="${n(cx + (R - (big ? 18 : 10)) * Math.cos(a))}" y2="${n(cy + (R - (big ? 18 : 10)) * Math.sin(a))}" stroke="${cfg.accent}" stroke-width="${big ? 1.2 : 0.6}" stroke-opacity="${big ? 0.38 : 0.2}"/>`);
  }
  // Frozen at 12:00 — ZA WARUDO
  out.push(`<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 80}" stroke="${cfg.accent}" stroke-width="1.6" stroke-opacity="0.4" stroke-linecap="round"/>`);
  out.push(`<line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 118}" stroke="${cfg.accent}" stroke-width="1" stroke-opacity="0.3" stroke-linecap="round"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="4.5" fill="${cfg.accent}" fill-opacity="0.45"/>`);
  // Time-distortion spiral
  let sp = `M${cx} ${cy}`;
  for (let t = 0; t < Math.PI * 4; t += 0.18) {
    const r2 = (t / (Math.PI * 4)) * 118;
    sp += ` L${n(cx + r2 * Math.cos(t))} ${n(cy + r2 * Math.sin(t))}`;
  }
  out.push(`<path d="${sp}" fill="none" stroke="${cfg.accent}" stroke-width="0.4" stroke-opacity="0.1"/>`);
  return out.join('\n  ');
}

function shadow(cfg) {
  const out = [];
  const swayDir = [1,-1,1,-1,1,-1,1,-1,1,-1,1,-1];
  const heights = [155,195,240,175,260,200,180,245,165,215,185,230];
  const sways   = [14, 22, 10, 28, 16, 20, 25, 12, 18, 24, 8,  20];
  for (let i = 0; i < 12; i++) {
    const bx = 36 + i * 30, h = heights[i], sw = swayDir[i] * sways[i];
    out.push(`<path d="M${bx},500 Q${bx+sw},${500-h/2} ${n(bx+sw*0.5)},${500-h}" fill="none" stroke="${cfg.accent}" stroke-width="${1 + (i%3) * 0.28}" stroke-opacity="${0.11 + (i%4)*0.04}" stroke-linecap="round"/>`);
  }
  out.push(`<ellipse cx="200" cy="492" rx="185" ry="20" fill="${cfg.accent}" fill-opacity="0.06"/>`);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI * 0.18 + Math.PI * 0.64 * i / 7;
    out.push(`<line x1="200" y1="80" x2="${n(200 + 320 * Math.cos(a + Math.PI/2))}" y2="${n(80 + 320 * Math.sin(a + Math.PI/2))}" stroke="${cfg.accent}" stroke-width="0.5" stroke-opacity="0.09"/>`);
  }
  return out.join('\n  ');
}

function starPoly(cx, cy, ro, ri) {
  return Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI * 2 * i / 10 - Math.PI / 2;
    const r = i % 2 === 0 ? ro : ri;
    return `${n(cx + r * Math.cos(a))},${n(cy + r * Math.sin(a))}`;
  }).join(' ');
}

function stars(cfg) {
  const cx = 200, cy = 195, R = 128;
  const out = [];
  for (let i = 0; i < 13; i++) {
    const a = Math.PI * 2 * i / 13 - Math.PI / 2;
    const sx = cx + R * Math.cos(a), sy = cy + R * Math.sin(a);
    out.push(`<polygon points="${starPoly(sx, sy, 8, 4)}" fill="${cfg.accent}" fill-opacity="0.28" stroke="${cfg.accent}" stroke-width="0.4" stroke-opacity="0.4"/>`);
  }
  // Abstract eagle wings
  out.push(`<path d="M70,305 Q140,182 200,245 Q260,182 330,305" fill="none" stroke="${cfg.accent}" stroke-width="0.8" stroke-opacity="0.15"/>`);
  out.push(`<path d="M82,322 Q148,202 200,260 Q252,202 318,322" fill="none" stroke="${cfg.accent}" stroke-width="0.5" stroke-opacity="0.1"/>`);
  out.push(`<circle cx="${cx}" cy="${cy}" r="22" fill="none" stroke="${cfg.accent}" stroke-width="0.8" stroke-opacity="0.28"/>`);
  return out.join('\n  ');
}

const DECO = { hexagons, ruled_lines, circles, alchemy, flame, tomoe, rays, hatch, gate, clock, shadow, stars };

/* ── SVG builder ────────────────────────────────────────────────────── */
function buildSVG(name, cfg) {
  const deco = DECO[cfg.deco](cfg);
  const id = name; // safe: all-lowercase ASCII
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" width="400" height="500">
  <defs>
    <radialGradient id="bg${id}" cx="200" cy="190" r="320" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${cfg.bg2}"/>
      <stop offset="100%" stop-color="${cfg.bg1}"/>
    </radialGradient>
    <radialGradient id="glow${id}" cx="200" cy="240" r="210" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${cfg.accent}" stop-opacity="0.14"/>
      <stop offset="100%" stop-color="${cfg.accent}" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur${id}" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="400" height="500" fill="${cfg.bg1}"/>
  <rect width="400" height="500" fill="url(#bg${id})"/>

  <!-- Character decoration -->
  ${deco}

  <!-- Center glow -->
  <rect width="400" height="500" fill="url(#glow${id})"/>

  <!-- Ghost symbol (very large, nearly invisible) -->
  <text x="200" y="275" text-anchor="middle" dominant-baseline="middle"
    font-size="255" fill="${cfg.accent}" fill-opacity="0.038"
    font-family="'Segoe UI Symbol','Apple Color Emoji','Noto Sans Symbols2','Noto Sans Symbols',sans-serif"
  >${cfg.symbol}</text>

  <!-- Halo behind symbol -->
  <ellipse cx="200" cy="252" rx="90" ry="90"
    fill="${cfg.accent}" fill-opacity="0.055" filter="url(#blur${id})"/>

  <!-- Main symbol -->
  <text x="200" y="258" text-anchor="middle" dominant-baseline="middle"
    font-size="108" fill="${cfg.accent}" fill-opacity="0.84"
    font-family="'Segoe UI Symbol','Apple Color Emoji','Noto Sans Symbols2','Noto Sans Symbols',sans-serif"
  >${cfg.symbol}</text>

  <!-- Divider -->
  <line x1="38" y1="372" x2="168" y2="372" stroke="${cfg.accent}" stroke-width="0.6" stroke-opacity="0.32"/>
  <circle cx="200" cy="372" r="2.6" fill="${cfg.accent}" fill-opacity="0.55"/>
  <line x1="232" y1="372" x2="362" y2="372" stroke="${cfg.accent}" stroke-width="0.6" stroke-opacity="0.32"/>

  <!-- Sigil text -->
  <text x="200" y="412" text-anchor="middle" dominant-baseline="middle"
    font-size="11" fill="${cfg.accent}" fill-opacity="0.52"
    font-family="'Courier New','JetBrains Mono','Lucida Console',monospace"
    letter-spacing="5"
  >${cfg.sigil}</text>
</svg>`;
}

/* ── Update registry/index.json ─────────────────────────────────────── */
function updateRegistry(names) {
  const reg = JSON.parse(fs.readFileSync(REGISTRY, 'utf8'));
  for (const soul of reg.souls) {
    if (names.includes(soul.name)) {
      soul.image = `${BASE_URL}/${soul.name}.svg`;
    }
  }
  fs.writeFileSync(REGISTRY, JSON.stringify(reg, null, 2) + '\n', 'utf8');
  console.log('\n✓ registry/index.json  — image fields updated to .svg URLs');
}

/* ── Main ───────────────────────────────────────────────────────────── */
const generated = [];
for (const [name, cfg] of Object.entries(CHARS)) {
  const svg  = buildSVG(name, cfg);
  const dest = path.join(OUT_DIR, `${name}.svg`);
  fs.writeFileSync(dest, svg, 'utf8');
  console.log(`  ✓  ${name}.svg`);
  generated.push(name);
}

updateRegistry(generated);

console.log(`\nDone — ${generated.length} portraits written to:`);
console.log(`  ${OUT_DIR}\n`);
