'use client';

import { useState } from 'react';

/* ── Data ─────────────────────────────────────────────────── */

const ENGINES = [
  {
    id: 'athenaeum',
    name: 'Athenaeum',
    tag: 'Memory Engine',
    col: '#c4a265',
    glowColor: '196,162,101',
    description: 'Persistent memory with decay physics. Four memory types fade at different rates — emotional weight slows the process.',
    bullets: [
      'episodic · semantic · procedural · self-model',
      'Decay rate 0.01–0.07 per day by type',
      'TF-IDF cosine similarity for associative recall',
    ],
  },
  {
    id: 'nexus',
    name: 'Nexus',
    tag: 'Knowledge Graph',
    col: '#a87ef0',
    glowColor: '168,126,240',
    description: 'Temporal entity-relation graph. Every fact has a validity window — the soul knows when things stopped being true.',
    bullets: [
      'Nodes: people, concepts, emotions, places',
      'Edges carry weight, evidence, and expiry dates',
      'BFS traversal chains context across the graph',
    ],
  },
  {
    id: 'consolidation',
    name: 'Consolidation',
    tag: 'Dream Cycle',
    col: '#4cb87a',
    glowColor: '76,184,122',
    description: 'Offline memory processing between sessions. Weak episodic memories are distilled, merged, and fed into the Nexus.',
    bullets: [
      'Episodic strength < 0.4 triggers consolidation',
      'Cosine similarity ≥ 0.45 merges duplicate memories',
      'Extracted concepts populate the knowledge graph',
    ],
  },
];

/* ── Shared animation keyframes ───────────────────────────── */

const CSS = `
  @keyframes rot-cw  { to { transform: rotate(360deg);  } }
  @keyframes rot-ccw { to { transform: rotate(-360deg); } }
  @keyframes eng-pulse {
    0%,100% { opacity: 0.55; r: 5; }
    50%     { opacity: 1;    r: 6.5; }
  }
  @keyframes spoke-flash {
    0%,100% { opacity: 0.25; }
    50%     { opacity: 0.85; }
  }
  @keyframes vortex-in {
    0%   { opacity: 0.7; transform: scale(1)   rotate(0deg); }
    100% { opacity: 0;   transform: scale(0.1) rotate(720deg); }
  }
`;

/* ── Athenaeum icon — orbital memory crystal ──────────────── */

function AthenaeumIcon({ lit }: { lit: boolean }) {
  const col = '#c4a265';
  const nodes8 = Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2;
    return { x: 38 * Math.cos(a), y: 38 * Math.sin(a) };
  });
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full" aria-hidden="true">
      {/* outer orbit */}
      <g style={{ animation: 'rot-cw 22s linear infinite' }}>
        <circle r="38" fill="none" stroke={col} strokeWidth="0.4" opacity="0.25" />
        {nodes8.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={i % 2 === 0 ? 2.5 : 1.8}
            fill={col} opacity={lit ? 0.85 : 0.5} />
        ))}
      </g>
      {/* middle ring */}
      <g style={{ animation: 'rot-ccw 14s linear infinite' }}>
        <circle r="24" fill="none" stroke={col} strokeWidth="0.8" opacity={lit ? 0.5 : 0.3} />
        {Array.from({ length: 6 }, (_, i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <line key={i}
              x1={12 * Math.cos(a)} y1={12 * Math.sin(a)}
              x2={24 * Math.cos(a)} y2={24 * Math.sin(a)}
              stroke={col} strokeWidth="0.7" opacity={lit ? 0.45 : 0.25} />
          );
        })}
      </g>
      {/* inner ring */}
      <g style={{ animation: 'rot-cw 8s linear infinite' }}>
        <circle r="13" fill="none" stroke={col} strokeWidth="1.5" opacity={lit ? 0.7 : 0.4} />
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return <rect key={i} x={13 * Math.cos(a) - 1.2} y={13 * Math.sin(a) - 1.2}
            width="2.4" height="2.4" fill={col} opacity={lit ? 0.9 : 0.55} />;
        })}
      </g>
      {/* core */}
      <circle r="5" fill={col}
        style={{ animation: 'eng-pulse 2.2s ease-in-out infinite' }} />
      <circle r="9" fill={col} opacity={lit ? 0.2 : 0.08}
        style={{ animation: 'eng-pulse 2.2s ease-in-out infinite reverse' }} />
    </svg>
  );
}

/* ── Nexus icon — rotating knowledge graph ────────────────── */

function NexusIcon({ lit }: { lit: boolean }) {
  const col = '#a87ef0';
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
    return { x: 36 * Math.cos(a), y: 36 * Math.sin(a), a: i };
  });
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full" aria-hidden="true">
      {/* spinning graph */}
      <g style={{ animation: 'rot-cw 18s linear infinite' }}>
        {/* outer connections between alternating nodes */}
        {spokes.map((p, i) => {
          const next = spokes[(i + 2) % 6];
          return (
            <line key={i}
              x1={p.x} y1={p.y} x2={next.x} y2={next.y}
              stroke={col} strokeWidth="0.6" opacity={lit ? 0.3 : 0.15} />
          );
        })}
        {/* spokes */}
        {spokes.map((p, i) => (
          <g key={i}>
            <line x1="0" y1="0" x2={p.x} y2={p.y}
              stroke={col} strokeWidth="0.8" opacity={lit ? 0.45 : 0.25}
              style={{ animation: `spoke-flash ${1.4 + i * 0.35}s ease-in-out ${i * 0.2}s infinite` }}
            />
            <circle cx={p.x} cy={p.y} r="4"
              fill={col} opacity={lit ? 0.8 : 0.45}
              style={{ animation: `spoke-flash ${1.4 + i * 0.35}s ease-in-out ${i * 0.2}s infinite` }}
            />
          </g>
        ))}
      </g>
      {/* counter ring */}
      <g style={{ animation: 'rot-ccw 10s linear infinite' }}>
        <circle r="20" fill="none" stroke={col} strokeWidth="0.5"
          strokeDasharray="4 3" opacity={lit ? 0.4 : 0.2} />
      </g>
      {/* center hub */}
      <circle r="7" fill={col} opacity={lit ? 0.95 : 0.55}
        style={{ animation: 'eng-pulse 1.8s ease-in-out infinite' }} />
      <circle r="12" fill={col} opacity={lit ? 0.18 : 0.06}
        style={{ animation: 'eng-pulse 1.8s ease-in-out infinite reverse' }} />
    </svg>
  );
}

/* ── Consolidation icon — dream vortex ────────────────────── */

function ConsolidationIcon({ lit }: { lit: boolean }) {
  const col = '#4cb87a';
  const outer = Array.from({ length: 10 }, (_, i) => {
    const a = (i / 10) * Math.PI * 2;
    return { x: 40 * Math.cos(a), y: 40 * Math.sin(a), delay: i * 0.28 };
  });
  return (
    <svg viewBox="-50 -50 100 100" className="w-full h-full" aria-hidden="true">
      {/* outer particle ring — slow CW */}
      <g style={{ animation: 'rot-cw 30s linear infinite' }}>
        {outer.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.2"
            fill={col} opacity={lit ? 0.6 : 0.3} />
        ))}
      </g>
      {/* spiral arms — CCW */}
      <g style={{ animation: 'rot-ccw 8s linear infinite' }}>
        {[0, 1, 2].map((arm) => {
          const base = (arm / 3) * Math.PI * 2;
          const pts = Array.from({ length: 6 }, (_, j) => {
            const a = base + (j / 6) * Math.PI * 1.4;
            const r = 10 + j * 4.5;
            return `${r * Math.cos(a)},${r * Math.sin(a)}`;
          }).join(' ');
          return (
            <polyline key={arm} points={pts}
              fill="none" stroke={col} strokeWidth="1.2"
              opacity={lit ? 0.55 : 0.3} strokeLinecap="round" strokeLinejoin="round" />
          );
        })}
      </g>
      {/* mid ring */}
      <g style={{ animation: 'rot-cw 12s linear infinite' }}>
        <circle r="18" fill="none" stroke={col} strokeWidth="0.8" opacity={lit ? 0.4 : 0.2} />
        {[0, 1, 2, 3].map((i) => {
          const a = (i / 4) * Math.PI * 2;
          return <circle key={i} cx={18 * Math.cos(a)} cy={18 * Math.sin(a)} r="1.8"
            fill={col} opacity={lit ? 0.7 : 0.35} />;
        })}
      </g>
      {/* core */}
      <circle r="6" fill={col}
        style={{ animation: 'eng-pulse 2.5s ease-in-out infinite' }} />
      <circle r="11" fill={col} opacity={lit ? 0.2 : 0.07}
        style={{ animation: 'eng-pulse 2.5s ease-in-out infinite reverse' }} />
    </svg>
  );
}

const ICONS = {
  athenaeum:    AthenaeumIcon,
  nexus:        NexusIcon,
  consolidation: ConsolidationIcon,
};

/* ── Main component ───────────────────────────────────────── */

export default function SoulCore() {
  const [active, setActive] = useState<string | null>(null);

  function toggle(id: string) {
    setActive((prev) => (prev === id ? null : id));
  }

  const activeEngine = ENGINES.find((e) => e.id === active) ?? null;

  return (
    <section className="py-24 md:py-32">
      <style>{CSS}</style>
      <div className="section-container">

        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">
            Core Architecture
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-4 leading-tight">
            Three Running Engines
          </h2>
          <p className="text-grimoire-muted text-base max-w-md mx-auto">
            Click an engine to see what it does.
          </p>
        </div>

        {/* Engine icons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 md:gap-24 mb-10">
          {ENGINES.map((eng) => {
            const Icon = ICONS[eng.id as keyof typeof ICONS];
            const isLit = active === eng.id;
            return (
              <button
                key={eng.id}
                onClick={() => toggle(eng.id)}
                className="flex flex-col items-center gap-4 group focus-visible:outline-none"
              >
                {/* Icon circle */}
                <div
                  className="relative w-28 h-28 md:w-36 md:h-36 rounded-full transition-transform duration-300"
                  style={{
                    transform: isLit ? 'scale(1.1)' : 'scale(1)',
                    filter: isLit
                      ? `drop-shadow(0 0 18px rgba(${eng.glowColor},0.7)) drop-shadow(0 0 40px rgba(${eng.glowColor},0.35))`
                      : `drop-shadow(0 0 6px rgba(${eng.glowColor},0.25))`,
                    transition: 'filter 0.35s ease, transform 0.3s ease',
                  }}
                >
                  {/* Ring border */}
                  <div
                    className="absolute inset-0 rounded-full border transition-all duration-300"
                    style={{
                      borderColor: isLit ? `rgba(${eng.glowColor},0.6)` : `rgba(${eng.glowColor},0.2)`,
                      background: isLit
                        ? `radial-gradient(circle at 40% 40%, rgba(${eng.glowColor},0.12), transparent 70%)`
                        : `radial-gradient(circle at 40% 40%, rgba(${eng.glowColor},0.04), transparent 70%)`,
                    }}
                  />
                  <Icon lit={isLit} />
                </div>

                {/* Label */}
                <div className="text-center">
                  <div
                    className="font-serif text-lg transition-colors duration-200"
                    style={{ color: isLit ? eng.col : '#8a8090' }}
                  >
                    {eng.name}
                  </div>
                  <div className="font-mono text-[9px] tracking-widest uppercase mt-0.5"
                    style={{ color: isLit ? `rgba(${eng.glowColor},0.7)` : 'rgba(138,128,144,0.45)' }}>
                    {eng.tag}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div
          className="overflow-hidden transition-all duration-400 ease-in-out"
          style={{ maxHeight: activeEngine ? '320px' : '0px', opacity: activeEngine ? 1 : 0 }}
        >
          {activeEngine && (
            <div
              className="mx-auto max-w-2xl rounded-2xl border p-6 md:p-8"
              style={{
                borderColor: `rgba(${activeEngine.glowColor},0.3)`,
                background: `radial-gradient(ellipse at top, rgba(${activeEngine.glowColor},0.06), transparent 70%)`,
              }}
            >
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase mb-1"
                style={{ color: activeEngine.col }}>
                {activeEngine.tag}
              </p>
              <h3 className="font-serif text-2xl mb-3" style={{ color: activeEngine.col }}>
                {activeEngine.name}
              </h3>
              <p className="text-grimoire-muted text-sm leading-relaxed mb-5">
                {activeEngine.description}
              </p>
              <ul className="space-y-2">
                {activeEngine.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-grimoire-text-secondary">
                    <span className="mt-0.5 shrink-0 text-[9px]" style={{ color: activeEngine.col }}>◆</span>
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
