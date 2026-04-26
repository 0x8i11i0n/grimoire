'use client';

import { useEffect, useRef, useState } from 'react';
import { REGISTRY_URL, type SoulEntry } from '@/lib/registry-types';

const ANIME_TAGS = new Set(['anime', 'manhwa', 'manga']);

const WIKI_TITLES: Record<string, string> = {
  sungjinwoo:       'Sung Jin-woo',
  lelouch:          'Lelouch vi Britannia',
  vegeta:           'Vegeta (Dragon Ball)',
  gilgamesh:        'Gilgamesh (Fate/stay night)',
  lightyagami:      'Light Yagami',
  itachi:           'Itachi Uchiha',
  gojo:             'Satoru Gojo',
  levi:             'Levi (Attack on Titan)',
  roymustang:       'Roy Mustang',
  edwardelric:      'Edward Elric',
  diobrando:        'Dio Brando',
  walterwhite:      'Walter White (Breaking Bad)',
};

const MAL_OVERRIDES: Record<string, string> = {
  sungjinwoo: 'Sung Jinwoo',
  lelouch:    'Lelouch Lamperouge',
  levi:       'Levi Ackerman',
};

async function fetchPortrait(soul: SoulEntry): Promise<string | null> {
  // Try Wikipedia first (fast)
  const title = WIKI_TITLES[soul.name] ?? soul.displayName;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );
    const json = await res.json();
    if (json?.thumbnail?.source) return json.thumbnail.source as string;
  } catch {}

  // Fallback to Jikan for anime/manhwa/manga souls
  if (soul.tags.some((t) => ANIME_TAGS.has(t))) {
    try {
      const q = MAL_OVERRIDES[soul.name] ?? soul.displayName;
      const res = await fetch(
        `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(q)}&limit=1`,
      );
      const json = await res.json();
      const entry = json?.data?.[0];
      return (entry?.images?.jpg?.large_image_url ?? entry?.images?.jpg?.image_url) ?? null;
    } catch {}
  }

  return null;
}

// Character-specific color palettes [dark-bg, mid, accent]
const PALETTE: Record<string, [string, string, string]> = {
  sungjinwoo:       ['#03020c', '#110830', '#4c1d95'],
  lelouch:          ['#0c0208', '#1a0510', '#7c1d2f'],
  vegeta:           ['#080c12', '#0c1a28', '#1a3a6e'],
  gilgamesh:        ['#0c0800', '#1a1200', '#7a5200'],
  lightyagami:      ['#07080c', '#0e1018', '#2a2d54'],
  itachi:           ['#080508', '#120810', '#4a1040'],
  gojo:             ['#05080c', '#0a1018', '#1040a0'],
  levi:             ['#080808', '#101010', '#303030'],
  roymustang:       ['#0c0800', '#1a1000', '#5a2800'],
  edwardelric:      ['#0a0800', '#180e00', '#603800'],
  hermionegranger:  ['#080808', '#100e10', '#382030'],
  sheldoncooper:    ['#030c08', '#061808', '#104020'],
  geraltofrivia:    ['#08080a', '#10101a', '#282840'],
  tyrionlannister:  ['#0c0800', '#1a1200', '#4a3000'],
  walterwhite:      ['#060808', '#0c1010', '#203030'],
  diobrando:        ['#0a0408', '#180808', '#601828'],
  elonmusk:         ['#04080c', '#081018', '#183050'],
  georgewashington: ['#06080a', '#0e0e14', '#2c2c40'],
};

function getPalette(name: string): [string, string, string] {
  return PALETTE[name] ?? ['#0a0a0f', '#111118', '#4a3570'];
}

function SoulCard({ soul }: { soul: SoulEntry }) {
  const [hovered, setHovered] = useState(false);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(false);
  const pal = getPalette(soul.name);
  const sessions = soul.backrooms?.sessions?.length ?? 0;

  useEffect(() => {
    fetchPortrait(soul).then((url) => { if (url) setPortrait(url); });
  }, [soul.name]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <a
      href={`/grimoire/registry/${soul.name}`}
      className="group block shrink-0 w-[220px] rounded-2xl border border-grimoire-border overflow-hidden transition-all duration-300 hover:border-opacity-60 hover:shadow-[0_0_40px_-10px_rgba(139,92,246,0.25)] hover:-translate-y-1"
      style={{ borderColor: hovered ? pal[2] + '60' : undefined }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top image area */}
      <div
        className="relative h-[160px] overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${pal[0]} 0%, ${pal[1]} 55%, ${pal[0]} 100%)`,
        }}
      >
        {/* Portrait image */}
        {portrait && (
          <img
            src={portrait}
            alt={soul.displayName}
            onLoad={() => setImgOk(true)}
            onError={() => setImgOk(false)}
            className="absolute inset-0 w-full h-full object-cover object-[center_15%] transition-transform duration-500"
            style={{ transform: hovered ? 'scale(1.06)' : 'scale(1)' }}
          />
        )}
        {/* Gradient overlay — always present, stronger when no image */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: imgOk
              ? `linear-gradient(to bottom, transparent 30%, ${pal[0]}cc 100%)`
              : `linear-gradient(135deg, ${pal[0]}aa 0%, ${pal[1]}88 55%, ${pal[0]}aa 100%)`,
          }}
        />
        {/* Fallback orb when no image */}
        {!imgOk && (
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
            style={{
              width:  hovered ? '90px' : '62px',
              height: hovered ? '90px' : '62px',
              background: `radial-gradient(circle at 35% 35%, ${pal[2]}88, ${pal[2]}22, transparent)`,
              boxShadow: `0 0 ${hovered ? 40 : 20}px ${pal[2]}44`,
            }}
          />
        )}
        {/* Version label */}
        <div
          className="absolute bottom-2 right-3 font-mono text-[9px] tracking-[0.18em] uppercase transition-opacity duration-300 z-10"
          style={{ color: pal[2], opacity: hovered ? 0.9 : 0.5 }}
        >
          {soul.version}
        </div>
        {/* Session badge */}
        {sessions > 0 && (
          <div
            className="absolute top-2.5 left-3 font-mono text-[9px] px-1.5 py-0.5 rounded border z-10"
            style={{
              color: pal[2],
              borderColor: pal[2] + '55',
              background: pal[0] + 'cc',
            }}
          >
            {sessions} {sessions === 1 ? 'session' : 'sessions'}
          </div>
        )}
      </div>

      {/* Card body */}
      <div
        className="p-4 flex flex-col gap-2"
        style={{ background: pal[0] + 'ee' }}
      >
        <div>
          <div className="font-serif text-grimoire-gold text-base leading-tight group-hover:text-grimoire-gold-bright transition-colors duration-200">
            {soul.displayName}
          </div>
          <div className="text-grimoire-muted/60 text-[10px] mt-0.5 truncate">
            {soul.source}
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          {soul.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono px-1.5 py-[2px] rounded-sm border"
              style={{
                color: pal[2] + 'cc',
                borderColor: pal[2] + '33',
                background: pal[2] + '11',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="shrink-0 w-[220px] rounded-2xl border border-grimoire-border overflow-hidden animate-pulse">
      <div className="h-[120px] bg-grimoire-elevated" />
      <div className="p-4 bg-grimoire-surface flex flex-col gap-3">
        <div className="h-4 bg-grimoire-elevated rounded w-3/4" />
        <div className="h-3 bg-grimoire-elevated rounded w-1/2" />
        <div className="flex gap-1">
          <div className="h-4 bg-grimoire-elevated rounded w-12" />
          <div className="h-4 bg-grimoire-elevated rounded w-14" />
        </div>
      </div>
    </div>
  );
}

export default function SoulGallery() {
  const [souls, setSouls] = useState<SoulEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // active: mouse is held down; moved: exceeded threshold (blocks link click)
  const drag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });

  useEffect(() => {
    fetch(REGISTRY_URL)
      .then((r) => r.json())
      .then((data) => {
        setSouls(data.souls ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Global mouseup so releasing outside the element always ends the drag
  useEffect(() => {
    const stop = () => {
      if (!drag.current.active) return;
      drag.current.active = false;
      if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
    };
    document.addEventListener('mouseup', stop);
    return () => document.removeEventListener('mouseup', stop);
  }, []);

  function onMouseDown(e: { pageX: number }) {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { active: true, moved: false, startX: e.pageX - el.offsetLeft, scrollLeft: el.scrollLeft };
  }

  function onMouseMove(e: { pageX: number; preventDefault(): void }) {
    if (!drag.current.active) return;
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const delta = x - drag.current.startX;
    if (Math.abs(delta) > 5) {
      drag.current.moved = true;
      el.style.cursor = 'grabbing';
      e.preventDefault();
      el.scrollLeft = drag.current.scrollLeft - delta;
    }
  }

  function onMouseUp() {
    drag.current.active = false;
    if (scrollRef.current) scrollRef.current.style.cursor = 'grab';
  }

  // Capture-phase click handler: swallow the click if the user actually dragged
  function onClickCapture(e: { stopPropagation(): void; preventDefault(): void }) {
    if (drag.current.moved) {
      e.stopPropagation();
      e.preventDefault();
      drag.current.moved = false;
    }
  }

  function scrollBy(dir: -1 | 1) {
    scrollRef.current?.scrollBy({ left: dir * 248, behavior: 'smooth' });
  }

  return (
    <section id="souls" className="py-24 md:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="px-6 mb-10">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">
            GrimHub Registry
          </p>
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold leading-tight">
              Meet the Souls
            </h2>
            <div className="flex items-center gap-3 pb-1">
              <button
                onClick={() => scrollBy(-1)}
                aria-label="Scroll left"
                className="w-7 h-7 rounded-full border border-grimoire-border flex items-center justify-center text-grimoire-muted hover:text-grimoire-gold hover:border-grimoire-gold/50 transition-colors duration-200"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                onClick={() => scrollBy(1)}
                aria-label="Scroll right"
                className="w-7 h-7 rounded-full border border-grimoire-border flex items-center justify-center text-grimoire-muted hover:text-grimoire-gold hover:border-grimoire-gold/50 transition-colors duration-200"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <a
                href="/grimoire/registry"
                className="text-xs font-mono text-grimoire-muted hover:text-grimoire-gold transition-colors duration-200 shrink-0"
              >
                View all →
              </a>
            </div>
          </div>
          <p className="text-grimoire-muted text-sm mt-3 max-w-xl">
            Each soul is a living system — persistent memory, autonomous drift, and a relationship
            that deepens over sessions. Live data from GitHub.
          </p>
        </div>

        {/* Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-6 px-6 select-none"
          style={{
            cursor: 'grab',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onClickCapture={onClickCapture}
        >
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : souls.map((s: SoulEntry) => <SoulCard key={s.name} soul={s} />)}
        </div>

        {/* Scroll hint */}
        {!loading && souls.length > 4 && (
          <p className="text-center font-mono text-[10px] text-grimoire-muted/40 mt-2 tracking-widest">
            drag to scroll · {souls.length} souls
          </p>
        )}
      </div>
    </section>
  );
}
