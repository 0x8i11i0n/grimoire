'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const REGISTRY_URL =
  'https://raw.githubusercontent.com/0x8i11i0n/grimoire/main/registry/index.json';

// Character-specific symbol shown in the image area when no portrait is available
const CHAR_ART: Record<string, { symbol: string; sigil: string }> = {
  lelouch:          { symbol: '♟', sigil: 'ZERO'       },
  lightyagami:      { symbol: '✦', sigil: 'KIRA'       },
  gojo:             { symbol: '∞', sigil: 'INFINITY'   },
  edwardelric:      { symbol: '⊕', sigil: 'FULLMETAL'  },
  roymustang:       { symbol: '✦', sigil: 'FLAME'      },
  itachi:           { symbol: '◈', sigil: 'SHARINGAN'  },
  vegeta:           { symbol: '⋆', sigil: 'SAIYAN'     },
  levi:             { symbol: '⚔', sigil: 'SURVEY'     },
  gilgamesh:        { symbol: '♛', sigil: 'KING'       },
  diobrando:        { symbol: '★', sigil: 'ZA WARUDO'  },
  sungjinwoo:       { symbol: '◈', sigil: 'SHADOW'     },
  georgewashington: { symbol: '⊛', sigil: 'PRESIDENT'  },
};

// Character-specific colour pairs used as fallback gradient when image fails / is loading
const CHAR_PALETTE: Record<string, readonly [string, string, string]> = {
  lelouch:          ['#0d0620', '#4a0e8f', '#6b21a8'],
  lightyagami:      ['#0a0a14', '#1e1e3a', '#c4a265'],
  gojo:             ['#020b1a', '#0d2d5e', '#1d4ed8'],
  edwardelric:      ['#140800', '#3d1a00', '#b45309'],
  roymustang:       ['#130303', '#3d0a0a', '#dc2626'],
  itachi:           ['#080010', '#1a0030', '#7c3aed'],
  vegeta:           ['#0a0010', '#250040', '#9333ea'],
  levi:             ['#07080a', '#1a1e24', '#4b5563'],
  gilgamesh:        ['#120d00', '#362400', '#ca8a04'],
  diobrando:        ['#0d0800', '#2d1800', '#92400e'],
  sungjinwoo:       ['#03020c', '#110830', '#4c1d95'],
  georgewashington: ['#080806', '#1a1a14', '#57534e'],
};

const RARITY: Record<number, { label: string; border: string; glow: string; badge: string }> = {
  10: {
    label:  'LEGENDARY',
    border: 'linear-gradient(135deg, #e8c87a 0%, #a87ef0 30%, #c4a265 55%, #7c5cbf 80%, #e8c87a 100%)',
    glow:   'rgba(196,162,101,0.55)',
    badge:  'border-grimoire-gold/70 text-grimoire-gold',
  },
  9: {
    label:  'RARE',
    border: 'linear-gradient(135deg, #a87ef0 0%, #7c5cbf 50%, #a87ef0 100%)',
    glow:   'rgba(124,92,191,0.5)',
    badge:  'border-purple-500/60 text-purple-300',
  },
  8: {
    label:  'UNCOMMON',
    border: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #60a5fa 100%)',
    glow:   'rgba(96,165,250,0.4)',
    badge:  'border-blue-500/50 text-blue-300',
  },
};

function getRarity(score: number) {
  return RARITY[Math.min(10, Math.max(7, Math.round(score)))] ?? RARITY[7] ?? {
    label: 'COMMON',
    border: 'linear-gradient(135deg, #c4a265 0%, #4a3570 100%)',
    glow:   'rgba(196,162,101,0.25)',
    badge:  'border-grimoire-border text-grimoire-muted',
  };
}

function getPalette(name: string) {
  return CHAR_PALETTE[name] ?? ['#0c0918', '#1a1232', '#3d2a5c'] as const;
}

// ──────────────────────────────────────────────
// Corner ornament (SVG bracket-style flourish)
// ──────────────────────────────────────────────
function Corner({ rotate }: { rotate: number }) {
  return (
    <svg
      width="22" height="22" viewBox="0 0 22 22" fill="none"
      style={{ transform: `rotate(${rotate}deg)` }}
      className="pointer-events-none"
    >
      <path d="M1 1 L9 1 L9 2.8 L2.8 2.8 L2.8 9 L1 9 Z" fill="#c4a265" fillOpacity="0.85" />
      <circle cx="2.8" cy="2.8" r="1.2" fill="#c4a265" fillOpacity="0.6" />
    </svg>
  );
}

// ──────────────────────────────────────────────
// Diamond divider
// ──────────────────────────────────────────────
function DiamondDivider() {
  return (
    <div className="flex items-center gap-2 my-2.5">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, rgba(196,162,101,0.35))' }} />
      <svg width="8" height="8" viewBox="0 0 8 8">
        <rect x="1" y="1" width="6" height="6" transform="rotate(45 4 4)" fill="#c4a265" fillOpacity="0.55" />
      </svg>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to left, transparent, rgba(196,162,101,0.35))' }} />
    </div>
  );
}

// ──────────────────────────────────────────────
// Score bar
// ──────────────────────────────────────────────
function ScoreBar({ label, score }: { label: string; score: number }) {
  const pct = `${(score / 10) * 100}%`;
  const barGrad = score >= 9.5
    ? 'linear-gradient(90deg, #b8923a, #e8c87a, #c4a265)'
    : 'linear-gradient(90deg, #7a6030, #c4a265)';
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-grimoire-muted/80 w-6 shrink-0 uppercase tracking-wide">{label}</span>
      <div className="flex-1 h-[3px] rounded-full" style={{ background: 'rgba(58,50,69,0.8)' }}>
        <div className="h-full rounded-full transition-all duration-700" style={{ width: pct, background: barGrad }} />
      </div>
      <span className="text-[10px] font-mono text-grimoire-gold/80 w-5 text-right tabular-nums">{score}</span>
    </div>
  );
}

// ──────────────────────────────────────────────
// Copy button
// ──────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  const copy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setOk(true);
      setTimeout(() => setOk(false), 1800);
    });
  }, [text]);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); copy(); }}
      className="text-[10px] font-mono text-grimoire-muted hover:text-grimoire-gold transition-colors duration-200 shrink-0 ml-1"
    >
      {ok ? '✓' : 'copy'}
    </button>
  );
}

// ──────────────────────────────────────────────
// The Soul Card
// ──────────────────────────────────────────────
interface SoulEntry {
  name: string;
  displayName: string;
  author: string;
  version: string;
  source: string;
  description: string;
  tags: string[];
  authenticityScore: number;
  resonanceScore: number;
  downloads: number;
  rating: number;
  files: string[];
  created: string;
  updated: string;
  image?: string;
}

function SoulCard({ soul }: { soul: SoulEntry }) {
  const [imgFailed, setImgFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [shimmer, setShimmer] = useState(false);
  const shimmerTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rarity  = getRarity(soul.authenticityScore);
  const palette = getPalette(soul.name);
  const isLegendary = soul.authenticityScore >= 10;
  const installCmd = `grimoire registry install ${soul.name}`;

  // Image URL: prefer registry field, else derive from name
  const imgSrc = soul.image ?? `https://0x8i11i0n.github.io/grimoire/images/souls/${soul.name}.jpg`;

  const handleHoverEnter = () => {
    setHovered(true);
    if (!shimmer) {
      setShimmer(true);
      shimmerTimer.current = setTimeout(() => setShimmer(false), 1100);
    }
  };
  const handleHoverLeave = () => setHovered(false);

  useEffect(() => () => { if (shimmerTimer.current) clearTimeout(shimmerTimer.current); }, []);

  return (
    <div
      className="relative"
      style={{ perspective: '900px' }}
      onMouseEnter={handleHoverEnter}
      onMouseLeave={handleHoverLeave}
    >
      {/* ── Outer ambient glow ── */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-500"
        style={{
          background: rarity.border,
          opacity: hovered ? 0.55 : 0,
          filter: 'blur(16px)',
          transform: 'scale(1.08)',
        }}
      />
      {/* ── Legendary animated border pulse ── */}
      {isLegendary && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none soul-card-legendary-border"
          style={{
            background: rarity.border,
            filter: 'blur(6px)',
            transform: 'scale(1.02)',
          }}
        />
      )}

      {/* ── Gradient border wrapper ── */}
      <div
        className="relative rounded-2xl transition-transform duration-300 ease-out"
        style={{
          background: rarity.border,
          padding: '1.5px',
          transform: hovered ? 'translateY(-6px) rotateX(2deg)' : 'translateY(0) rotateX(0deg)',
        }}
      >
        {/* ── Card body ── */}
        <div
          className="rounded-[14px] overflow-hidden flex flex-col"
          style={{ background: `linear-gradient(160deg, ${palette[0]} 0%, ${palette[1]} 60%, ${palette[0]} 100%)` }}
        >

          {/* ── Portrait image section ── */}
          <div className="relative overflow-hidden" style={{ height: '230px' }}>
            {/* Fallback gradient (always present behind image) */}
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(175deg, ${palette[1]} 0%, ${palette[2]}55 60%, ${palette[0]} 100%)` }}
            />

            {/* Symbol art — always rendered; covered by image when it loads, visible on fail */}
            {(() => {
              const art = CHAR_ART[soul.name] ?? { symbol: '◈', sigil: soul.name.toUpperCase() };
              return (
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none overflow-hidden">
                  {/* Large background sigil text */}
                  <span
                    className="absolute font-serif tracking-[0.35em] font-bold"
                    style={{
                      fontSize: '9rem',
                      color: palette[2],
                      opacity: 0.06,
                      lineHeight: 1,
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {art.symbol}
                  </span>
                  {/* Centred symbol */}
                  <span
                    className="font-serif relative z-10"
                    style={{ fontSize: '3.5rem', color: palette[2], opacity: 0.45, lineHeight: 1 }}
                  >
                    {art.symbol}
                  </span>
                  {/* Sigil label */}
                  <span
                    className="font-mono tracking-[0.3em] text-[9px] mt-3 relative z-10"
                    style={{ color: palette[2], opacity: 0.35 }}
                  >
                    {art.sigil}
                  </span>
                  {/* Horizontal rule */}
                  <div className="w-12 mt-2 h-px relative z-10" style={{ background: `${palette[2]}55` }} />
                </div>
              );
            })()}

            {!imgFailed && (
              <img
                src={imgSrc}
                alt={soul.displayName}
                onError={() => setImgFailed(true)}
                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-out"
                style={{ transform: hovered ? 'scale(1.06)' : 'scale(1.0)' }}
              />
            )}

            {/* Shimmer sweep on hover */}
            {shimmer && (
              <div
                className="absolute inset-0 soul-card-shimmer pointer-events-none"
                style={{
                  background: 'linear-gradient(105deg, transparent 25%, rgba(255,255,255,0.13) 50%, transparent 75%)',
                  width: '60%',
                  top: 0,
                  bottom: 0,
                  left: 0,
                }}
              />
            )}

            {/* Bottom fade to card body */}
            <div
              className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
              style={{ background: `linear-gradient(to bottom, transparent, ${palette[0]})` }}
            />

            {/* Rarity badge */}
            <div className="absolute top-2.5 right-2.5">
              <span className={`text-[8px] tracking-[0.18em] font-mono px-2 py-[3px] rounded border bg-black/50 backdrop-blur-sm ${rarity.badge}`}>
                {rarity.label}
              </span>
            </div>

            {/* Author watermark */}
            <div className="absolute bottom-3 left-3">
              <span className="text-[9px] font-mono text-white/25">by {soul.author}</span>
            </div>
          </div>

          {/* ── Card text body ── */}
          <div className="px-4 pt-3 pb-4 flex flex-col gap-0">

            {/* Character name */}
            <h3 className="font-serif leading-tight text-grimoire-gold" style={{ fontSize: '1.05rem' }}>
              {soul.displayName}
            </h3>
            <p className="text-[11px] text-grimoire-muted/70 mt-0.5 truncate">{soul.source}</p>

            <DiamondDivider />

            {/* Scores */}
            <div className="space-y-1.5 mb-3">
              <ScoreBar label="Auth" score={soul.authenticityScore} />
              <ScoreBar label="Res"  score={soul.resonanceScore} />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3 min-h-[20px]">
              {soul.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] font-mono tracking-wide text-grimoire-muted/60 border border-grimoire-border/40 rounded-sm px-1.5 py-[2px]"
                  style={{ background: 'rgba(255,255,255,0.02)' }}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Install command */}
            <div
              className="flex items-center justify-between rounded-lg px-3 py-2 border border-grimoire-border/50"
              style={{ background: 'rgba(0,0,0,0.35)' }}
            >
              <code className="text-[11px] font-mono text-grimoire-gold/80 truncate">
                <span className="text-grimoire-muted/50 mr-1">$</span>
                install {soul.name}
              </code>
              <CopyBtn text={installCmd} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Corner ornaments (outside the gradient border) ── */}
      <div className="absolute top-0.5 left-0.5"><Corner rotate={0}   /></div>
      <div className="absolute top-0.5 right-0.5"><Corner rotate={90}  /></div>
      <div className="absolute bottom-0.5 left-0.5"><Corner rotate={270} /></div>
      <div className="absolute bottom-0.5 right-0.5"><Corner rotate={180} /></div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Loading skeleton (card-shaped)
// ──────────────────────────────────────────────
function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ border: '1.5px solid rgba(196,162,101,0.15)' }}>
      <div className="h-[230px]" style={{ background: 'rgba(26,18,50,0.8)' }} />
      <div className="px-4 pt-3 pb-4 space-y-3" style={{ background: '#0c0918' }}>
        <div className="h-4 rounded w-3/4" style={{ background: 'rgba(196,162,101,0.12)' }} />
        <div className="h-3 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="space-y-2">
          <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-2 rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
        </div>
        <div className="flex gap-1">
          {[1,2,3].map(i => <div key={i} className="h-4 w-12 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />)}
        </div>
        <div className="h-8 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Tag filter pill
// ──────────────────────────────────────────────
function TagPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200 whitespace-nowrap ${
        active
          ? 'border-grimoire-gold/60 text-grimoire-gold bg-grimoire-gold/10'
          : 'border-grimoire-border text-grimoire-muted hover:text-grimoire-text hover:border-grimoire-border-light'
      }`}
    >
      {label}
    </button>
  );
}

// ──────────────────────────────────────────────
// Main RegistryBrowser export
// ──────────────────────────────────────────────
interface RegistryIndex {
  version: string;
  updated: string;
  total: number;
  souls: SoulEntry[];
}

export default function RegistryBrowser() {
  const [index, setIndex]           = useState<RegistryIndex | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [query, setQuery]           = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetch(REGISTRY_URL)
      .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<RegistryIndex>; })
      .then(setIndex)
      .catch((e: Error) => setError(e.message));
  }, []);

  const allTags = index
    ? Array.from(new Set(index.souls.flatMap((s) => s.tags))).sort()
    : [];

  const filtered = index
    ? index.souls.filter((s) => {
        const q = query.toLowerCase();
        const matchQ =
          !q ||
          s.name.includes(q) ||
          s.displayName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q));
        const matchT = !selectedTag || s.tags.includes(selectedTag);
        return matchQ && matchT;
      })
    : [];

  return (
    <section className="space-y-8">

      {/* ── Search + tag filter bar ── */}
      <div className="flex flex-col gap-3">
        {/* Search input */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grimoire-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, source, tags…"
            className="w-full bg-grimoire-surface border border-grimoire-border rounded-xl pl-9 pr-4 py-2.5 text-sm text-grimoire-text placeholder:text-grimoire-muted focus:outline-none focus:border-grimoire-gold/40 transition-colors duration-200"
          />
        </div>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <TagPill label="All" active={!selectedTag} onClick={() => setSelectedTag(null)} />
            {allTags.slice(0, 10).map((tag) => (
              <TagPill
                key={tag}
                label={tag}
                active={selectedTag === tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Loading ── */}
      {!index && !error && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-400 mb-1">Could not load registry</p>
          <p className="text-xs text-grimoire-muted font-mono">{error}</p>
        </div>
      )}

      {/* ── Empty state ── */}
      {index && filtered.length === 0 && (
        <div className="text-center py-16 text-grimoire-muted text-sm">
          No souls match your search.
        </div>
      )}

      {/* ── Card grid ── */}
      {index && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map((soul) => (
              <SoulCard key={soul.name} soul={soul} />
            ))}
          </div>
          <p className="text-xs text-grimoire-muted text-center pt-2">
            {filtered.length} soul{filtered.length !== 1 ? 's' : ''} · last updated {index.updated}
          </p>
        </>
      )}
    </section>
  );
}
