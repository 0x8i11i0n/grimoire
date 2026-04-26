'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Markdown from './Markdown';
import {
  backroomFileUrl,
  type BackroomSession,
  type RegistryIndex,
  type SoulEntry,
  REGISTRY_URL,
} from '@/lib/registry-types';

// ── Hardcoded art/palette for the original 12 souls ───────────────────────

const CHAR_ART: Record<string, { symbol: string; sigil: string }> = {
  sungjinwoo:       { symbol: '◈', sigil: 'SHADOW' },
  lelouch:          { symbol: '♟', sigil: 'ZERO' },
  lightyagami:      { symbol: '✦', sigil: 'KIRA' },
  gojo:             { symbol: '∞', sigil: 'INFINITY' },
  edwardelric:      { symbol: '⊕', sigil: 'FULLMETAL' },
  roymustang:       { symbol: '✦', sigil: 'FLAME' },
  itachi:           { symbol: '◈', sigil: 'SHARINGAN' },
  vegeta:           { symbol: '⋆', sigil: 'SAIYAN' },
  levi:             { symbol: '⚔', sigil: 'SURVEY' },
  gilgamesh:        { symbol: '♛', sigil: 'KING' },
  diobrando:        { symbol: '★', sigil: 'ZA WARUDO' },
  georgewashington: { symbol: '⊛', sigil: 'PRESIDENT' },
};

const CHAR_PALETTE: Record<string, readonly [string, string, string]> = {
  sungjinwoo:       ['#03020c', '#110830', '#4c1d95'],
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
  georgewashington: ['#080806', '#1a1a14', '#57534e'],
};

// ── Auto-generation for any new soul ──────────────────────────────────────

function hashName(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  return Math.abs(h);
}

const COLOR_THEMES: ReadonlyArray<readonly [string, string, string]> = [
  ['#07031a', '#2a0f5e', '#c084fc'],
  ['#0a0a14', '#1e1e3a', '#c4a265'],
  ['#020b1a', '#0d2d5e', '#1d4ed8'],
  ['#140800', '#3d1a00', '#b45309'],
  ['#130303', '#3d0a0a', '#dc2626'],
  ['#080010', '#1a0030', '#7c3aed'],
  ['#07080a', '#1a1e24', '#4b5563'],
  ['#120d00', '#362400', '#ca8a04'],
  ['#021208', '#0a2e14', '#16a34a'],
  ['#020d12', '#052a38', '#0891b2'],
  ['#0d0620', '#4a0e8f', '#6b21a8'],
  ['#120008', '#3a0020', '#db2777'],
  ['#080a02', '#1e2508', '#65a30d'],
  ['#0a0604', '#2e1a0e', '#c2410c'],
  ['#03060c', '#0c1929', '#0f766e'],
  ['#08080a', '#18181e', '#6366f1'],
];

const SYMBOL_SET = ['◈', '✦', '⋆', '◆', '▲', '⊕', '⊗', '⊛', '◉', '⊞', '❋', '✵', '⌬', '⍟', '⊹', '✴'];

function getPalette(name: string): readonly [string, string, string] {
  return CHAR_PALETTE[name] ?? COLOR_THEMES[hashName(name) % COLOR_THEMES.length];
}

function getCharArt(soul: SoulEntry): { symbol: string; sigil: string } {
  if (CHAR_ART[soul.name]) return CHAR_ART[soul.name];
  const h = hashName(soul.name);
  return {
    symbol: SYMBOL_SET[h % SYMBOL_SET.length],
    sigil: soul.displayName.split(' ')[0].toUpperCase().slice(0, 8),
  };
}

// ── Portrait fetching ──────────────────────────────────────────────────────

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
  const title = WIKI_TITLES[soul.name] ?? soul.displayName;
  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
    );
    const json = await res.json();
    if (json?.thumbnail?.source) return json.thumbnail.source as string;
  } catch {}

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

function AffectionChip({ label }: { label: string }) {
  const tier = label.split(' ')[0] ?? '';
  const tone =
    tier === 'BONDED' ? 'border-grimoire-gold/60 text-grimoire-gold-bright bg-grimoire-gold/5'
    : tier === 'HIGH'    ? 'border-purple-500/50 text-purple-300 bg-purple-500/5'
    : tier === 'MEDIUM'  ? 'border-blue-500/40 text-blue-300 bg-blue-500/5'
    :                      'border-grimoire-border text-grimoire-muted bg-grimoire-surface';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border font-mono text-[10px] tracking-wider ${tone}`}>
      {label}
    </span>
  );
}

function SessionPanel({
  soulName,
  session,
  manifestPath,
}: {
  soulName: string;
  session: BackroomSession;
  manifestPath: string;
}) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (content || loading) return;
    setLoading(true);
    setError(null);
    try {
      const url = backroomFileUrl({ sourcePath: manifestPath, sessions: [] }, session.file);
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      setContent(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, [content, loading, manifestPath, session.file]);

  const toggle = useCallback(() => {
    const next = !open;
    setOpen(next);
    if (next) void load();
  }, [open, load]);

  return (
    <article className="rounded-xl border border-grimoire-border bg-grimoire-surface overflow-hidden">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-grimoire-elevated/60 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50"
      >
        <div className="flex-shrink-0 font-serif text-2xl text-grimoire-gold/70 w-10 text-center tabular-nums">
          {String(session.number).padStart(2, '0')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="font-serif text-lg text-grimoire-text tracking-tight">
              {session.title}
            </h3>
            <span className="text-[11px] font-mono text-grimoire-muted">
              {session.date}
            </span>
          </div>
          <p className="text-sm text-grimoire-muted mt-0.5 truncate">{session.summary}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <AffectionChip label={session.affectionStart} />
            <span className="text-grimoire-muted/50 text-xs">→</span>
            <AffectionChip label={session.affectionEnd} />
            <span className="ml-auto text-[10px] font-mono text-grimoire-muted/60">
              {session.sizeKb} KB
            </span>
          </div>
        </div>
        <div
          className={`text-grimoire-gold transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </button>

      {open && (
        <div
          ref={contentRef}
          className="border-t border-grimoire-border px-5 sm:px-8 py-6 bg-grimoire-bg"
        >
          {loading && (
            <div className="text-sm text-grimoire-muted py-8 text-center">
              Loading session transcript…
            </div>
          )}
          {error && (
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4 text-sm">
              <p className="text-red-400 mb-1">Could not load session</p>
              <p className="text-xs text-grimoire-muted font-mono">{error}</p>
              <button
                onClick={() => { setContent(null); void load(); }}
                className="mt-3 text-xs text-grimoire-gold hover:underline"
              >
                Retry
              </button>
            </div>
          )}
          {content && (
            <>
              <Markdown source={content} />
              <div className="mt-8 pt-4 border-t border-grimoire-border/40 text-xs font-mono text-grimoire-muted/60">
                <a
                  href={backroomFileUrl({ sourcePath: manifestPath, sessions: [] }, session.file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-grimoire-gold transition-colors"
                >
                  view raw on GitHub ↗
                </a>
                <span className="mx-2">·</span>
                <span>
                  {soulName}/backrooms/{session.file}
                </span>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}

export default function SoulDetail({ soul }: { soul: SoulEntry }) {
  const palette = getPalette(soul.name);
  const art = getCharArt(soul);
  const [portrait, setPortrait] = useState<string | null>(null);
  const [imgOk, setImgOk] = useState(false);
  const [liveSessions, setLiveSessions] = useState<BackroomSession[] | null>(null);

  useEffect(() => {
    fetchPortrait(soul).then((url) => {
      if (url) setPortrait(url);
    });
  }, [soul.name]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(REGISTRY_URL)
      .then((r) => r.json())
      .then((index: RegistryIndex) => {
        const live = index.souls.find((s) => s.name === soul.name);
        if (live?.backrooms?.sessions?.length) {
          setLiveSessions(live.backrooms.sessions);
        }
      })
      .catch(() => {});
  }, [soul.name]);

  const sessions: BackroomSession[] = liveSessions ?? soul.backrooms?.sessions ?? [];
  const installCmd = `grimoire registry install ${soul.name}`;

  return (
    <div className="space-y-10">
      {/* Breadcrumb */}
      <nav className="text-xs font-mono text-grimoire-muted">
        <a href="/grimoire/registry" className="hover:text-grimoire-gold transition-colors">
          ← GrimHub Registry
        </a>
      </nav>

      {/* Hero */}
      <header
        className="relative rounded-2xl overflow-hidden border border-grimoire-border"
        style={{
          background: `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 60%, ${palette[0]} 100%)`,
        }}
      >
        <div className="grid md:grid-cols-[320px_1fr]">
          {/* Portrait */}
          <div className="relative h-[280px] md:h-auto overflow-hidden"
               style={{ background: `linear-gradient(175deg, ${palette[1]} 0%, ${palette[2]}55 60%, ${palette[0]} 100%)` }}>
            {(!portrait || !imgOk) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center select-none pointer-events-none">
                <span
                  className="font-serif"
                  style={{ fontSize: '5rem', color: palette[2], opacity: 0.45, lineHeight: 1 }}
                >
                  {art.symbol}
                </span>
                <span
                  className="font-mono tracking-[0.3em] text-[10px] mt-3"
                  style={{ color: palette[2], opacity: 0.45 }}
                >
                  {art.sigil}
                </span>
              </div>
            )}
            {portrait && (
              <img
                src={portrait}
                alt={soul.displayName}
                onLoad={() => setImgOk(true)}
                onError={() => setImgOk(false)}
                className="absolute inset-0 w-full h-full object-cover object-[center_18%]"
              />
            )}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `linear-gradient(to right, transparent 60%, ${palette[0]})` }}
            />
          </div>

          {/* Text */}
          <div className="p-6 sm:p-8 flex flex-col gap-4">
            <div>
              <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-grimoire-gold/70 mb-2">
                by {soul.author} · v{soul.version}
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl text-grimoire-gold tracking-tight">
                {soul.displayName}
              </h1>
              <p className="text-sm text-grimoire-muted mt-1">{soul.source}</p>
            </div>

            <div className="flex gap-6 text-sm">
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-grimoire-muted/70">Authenticity</div>
                <div className="font-mono text-grimoire-gold-bright text-xl tabular-nums">
                  {soul.authenticityScore}<span className="text-grimoire-muted/60 text-sm"> / 10</span>
                </div>
              </div>
              <div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-grimoire-muted/70">Resonance</div>
                <div className="font-mono text-grimoire-gold-bright text-xl tabular-nums">
                  {soul.resonanceScore}<span className="text-grimoire-muted/60 text-sm"> / 10</span>
                </div>
              </div>
              {(soul.backrooms || sessions.length > 0) && (
                <div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-grimoire-muted/70">Sessions</div>
                  <div className="font-mono text-grimoire-gold-bright text-xl tabular-nums">
                    {sessions.length}
                  </div>
                </div>
              )}
            </div>

            <p className="text-grimoire-text-secondary text-sm leading-relaxed max-w-2xl">
              {soul.description}
            </p>

            <div className="flex flex-wrap gap-1.5">
              {soul.tags.map((t) => (
                <span
                  key={t}
                  className="text-[10px] font-mono text-grimoire-muted/80 border border-grimoire-border rounded-sm px-1.5 py-[2px] bg-black/20"
                >
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-2 inline-flex items-center gap-2 bg-black/40 border border-grimoire-border rounded-lg px-4 py-2 max-w-fit">
              <span className="text-grimoire-muted/50 text-sm font-mono">$</span>
              <code className="text-grimoire-gold text-sm font-mono">{installCmd}</code>
            </div>
          </div>
        </div>
      </header>

      {/* Backrooms */}
      {sessions.length > 0 ? (
        <section>
          <div className="flex items-baseline gap-3 mb-2">
            <h2 className="font-serif text-2xl text-grimoire-gold tracking-tight">
              Backrooms
            </h2>
            <span className="text-xs font-mono text-grimoire-muted">
              {sessions.length} session
              {sessions.length !== 1 ? 's' : ''} · field-test transcripts
            </span>
          </div>
          <p className="text-sm text-grimoire-muted mb-6 max-w-2xl">
            Raw transcripts from the sessions that produced this soul&apos;s current
            state. Each one shows the affection arc, the topics covered, and the
            wall-breaks that shaped what this soul became.
          </p>

          <div className="space-y-3">
            {sessions.map((s) => (
              <SessionPanel
                key={s.file}
                soulName={soul.name}
                session={s}
                manifestPath={soul.backrooms?.sourcePath ?? `Grimhub/souls/${soul.name}/backrooms`}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-grimoire-border bg-grimoire-surface p-8 text-center">
          <div className="text-grimoire-muted text-sm">
            No backroom sessions have been published for this soul yet.
          </div>
          <div className="text-grimoire-muted/60 text-xs font-mono mt-2">
            Backrooms live in <code>Grimhub/souls/{soul.name}/backrooms/</code>
            {' '}when present.
          </div>
        </section>
      )}
    </div>
  );
}
