'use client';

import { useState, useEffect, useCallback } from 'react';

const REGISTRY_URL =
  'https://raw.githubusercontent.com/0x8i11i0n/grimoire/main/registry/index.json';

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
}

interface RegistryIndex {
  version: string;
  updated: string;
  total: number;
  souls: SoulEntry[];
}

function ScorePip({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100;
  const color =
    score >= 8.5
      ? 'bg-grimoire-gold'
      : score >= 7
        ? 'bg-grimoire-gold-dim'
        : 'bg-grimoire-muted';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1 rounded-full bg-grimoire-border overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-mono text-grimoire-muted">{score}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-grimoire-muted hover:text-grimoire-gold transition-colors duration-200 ml-2 select-none"
      aria-label="Copy install command"
    >
      {copied ? 'copied!' : 'copy'}
    </button>
  );
}

function SoulCard({ soul }: { soul: SoulEntry }) {
  const installCmd = `grimoire registry install ${soul.name}`;

  return (
    <article className="group rounded-xl border border-grimoire-border bg-grimoire-surface hover:border-grimoire-gold/30 hover:bg-grimoire-elevated transition-all duration-300 p-6 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-grimoire-gold text-lg leading-tight group-hover:text-grimoire-gold-bright transition-colors duration-200">
            {soul.displayName}
          </h3>
          <p className="text-xs text-grimoire-muted mt-0.5">
            by <span className="text-grimoire-text-secondary">{soul.author}</span>
            {' · '}
            <span className="text-grimoire-muted">{soul.source}</span>
          </p>
        </div>
        <span className="flex-shrink-0 text-xs font-mono text-grimoire-muted bg-grimoire-card border border-grimoire-border rounded px-2 py-0.5">
          v{soul.version}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-grimoire-text-secondary leading-relaxed line-clamp-3">
        {soul.description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {soul.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs text-grimoire-muted bg-grimoire-card border border-grimoire-border/60 rounded-full px-2.5 py-0.5"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-grimoire-muted w-20">Authenticity</span>
          <ScorePip score={soul.authenticityScore} />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-grimoire-muted w-20">Resonance</span>
          <ScorePip score={soul.resonanceScore} />
        </div>
      </div>

      {/* Install command */}
      <div className="mt-auto pt-2 border-t border-grimoire-border/40">
        <div className="flex items-center justify-between bg-grimoire-card border border-grimoire-border rounded-lg px-3 py-2">
          <code className="text-xs font-mono text-grimoire-gold truncate">{installCmd}</code>
          <CopyButton text={installCmd} />
        </div>
      </div>
    </article>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border border-grimoire-border bg-grimoire-surface p-6 animate-pulse"
        >
          <div className="h-5 bg-grimoire-elevated rounded w-2/3 mb-3" />
          <div className="h-3 bg-grimoire-elevated rounded w-1/2 mb-5" />
          <div className="space-y-2 mb-4">
            <div className="h-3 bg-grimoire-elevated rounded" />
            <div className="h-3 bg-grimoire-elevated rounded w-5/6" />
          </div>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="h-5 w-16 bg-grimoire-elevated rounded-full" />
            ))}
          </div>
          <div className="h-8 bg-grimoire-elevated rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export default function RegistryBrowser() {
  const [index, setIndex] = useState<RegistryIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  useEffect(() => {
    fetch(REGISTRY_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch registry (${r.status})`);
        return r.json() as Promise<RegistryIndex>;
      })
      .then(setIndex)
      .catch((e: Error) => setError(e.message));
  }, []);

  const allTags = index
    ? Array.from(new Set(index.souls.flatMap((s) => s.tags))).sort()
    : [];

  const filtered = index
    ? index.souls.filter((s) => {
        const q = query.toLowerCase();
        const matchesQuery =
          !q ||
          s.name.includes(q) ||
          s.displayName.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.source.toLowerCase().includes(q) ||
          s.tags.some((t) => t.includes(q));
        const matchesTag = !selectedTag || s.tags.includes(selectedTag);
        return matchesQuery && matchesTag;
      })
    : [];

  return (
    <section className="space-y-8">
      {/* Search + filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-grimoire-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search souls, sources, tags..."
            className="w-full bg-grimoire-surface border border-grimoire-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-grimoire-text placeholder:text-grimoire-muted focus:outline-none focus:border-grimoire-gold/50 transition-colors duration-200"
          />
        </div>
        {allTags.length > 0 && (
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setSelectedTag(null)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-200 whitespace-nowrap ${
                !selectedTag
                  ? 'border-grimoire-gold/50 text-grimoire-gold bg-grimoire-elevated'
                  : 'border-grimoire-border text-grimoire-muted hover:text-grimoire-text'
              }`}
            >
              All
            </button>
            {allTags.slice(0, 6).map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                className={`text-xs px-3 py-1.5 rounded-lg border transition-colors duration-200 whitespace-nowrap ${
                  selectedTag === tag
                    ? 'border-grimoire-gold/50 text-grimoire-gold bg-grimoire-elevated'
                    : 'border-grimoire-border text-grimoire-muted hover:text-grimoire-text'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Loading */}
      {!index && !error && <LoadingSkeleton />}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-900/40 bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-400 mb-2">Failed to load registry</p>
          <p className="text-xs text-grimoire-muted font-mono">{error}</p>
        </div>
      )}

      {/* Results */}
      {index && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-grimoire-muted text-sm">No souls match your search.</p>
        </div>
      )}

      {index && filtered.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((soul) => (
              <SoulCard key={soul.name} soul={soul} />
            ))}
          </div>
          <p className="text-xs text-grimoire-muted text-center">
            {filtered.length} soul{filtered.length !== 1 ? 's' : ''} — registry last updated {index.updated}
          </p>
        </>
      )}
    </section>
  );
}
