'use client';

import { useEffect, useRef, useState } from 'react';

/* ── Athenaeum — memory grid ─────────────────────────────── */

function AthenaeumVisual({ visible }: { visible: boolean }) {
  const types = [
    { label: 'self-model', col: '#c4a265', y: 28,  st: [0.92, 0.6, 0.88, 0.5, 0.95, 0.72, 0.82, 0.55, 0.9] },
    { label: 'procedural', col: '#4cb87a', y: 72,  st: [0.55, 0.8, 0.42, 0.78, 0.85, 0.48, 0.72, 0.62, 0.8] },
    { label: 'semantic',   col: '#7c5cbf', y: 116, st: [0.82, 0.92, 0.62, 0.88, 0.52, 0.9, 0.78, 0.68, 0.58] },
    { label: 'episodic',   col: '#d4704a', y: 154, st: [0.28, 0.52, 0.78, 0.18, 0.42, 0.14, 0.68, 0.28, 0.48] },
  ];
  const xs = [36, 68, 100, 135, 168, 200, 232, 264, 292];
  const arcs: Array<[number, number, number, number]> = [
    [36, 28, 36, 154], [100, 28, 135, 116], [168, 72, 168, 116], [232, 116, 200, 154],
  ];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {/* shelf lines */}
      {types.map((t) => (
        <line key={t.label} x1="22" y1={t.y} x2="305" y2={t.y} stroke={t.col} strokeWidth="0.3" opacity="0.18" />
      ))}
      {/* association arcs */}
      {arcs.map(([x1, y1, x2, y2], i) => (
        <path key={i}
          d={`M${x1},${y1} Q${(x1 + x2) / 2 + (i % 2 === 0 ? -18 : 18)},${(y1 + y2) / 2} ${x2},${y2}`}
          fill="none" stroke="#7c5cbf" strokeWidth="0.7"
          opacity={visible ? 0.28 : 0}
          strokeDasharray="3,3"
          style={{ transition: `opacity 0.5s ease-out ${i * 120}ms` }}
        />
      ))}
      {/* memory nodes */}
      {types.map((t) =>
        t.st.map((s, i) => (
          <circle key={`${t.label}-${i}`}
            cx={xs[i]} cy={t.y}
            r={2.8 + s * 3.5}
            fill={t.col}
            opacity={visible ? 0.18 + s * 0.78 : 0}
            style={{ transition: `opacity 0.4s ease-out ${100 + i * 55 + types.indexOf(t) * 80}ms` }}
          />
        ))
      )}
      {/* recall spotlight */}
      <line x1="168" y1="8" x2="168" y2="168"
        stroke="#c4a265" strokeWidth="0.5"
        opacity={visible ? 0.18 : 0}
        strokeDasharray="2,5"
        style={{ transition: 'opacity 0.8s ease-out 0.6s' }}
      />
      <circle cx="168" cy="28" r="9" fill="none" stroke="#c4a265" strokeWidth="0.9"
        opacity={visible ? 0.38 : 0}
        style={{ transition: 'opacity 0.6s ease-out 0.8s' }}
      />
      {/* type labels */}
      {types.map((t, i) => (
        <text key={t.label} x="6" y={t.y + 3.5} fill={t.col} fontSize="7" fontFamily="monospace"
          opacity={visible ? 0.55 : 0}
          style={{ transition: `opacity 0.5s ease-out ${200 + i * 80}ms` }}
        >
          {t.label.slice(0, 4)}
        </text>
      ))}
      <text x="20" y="172" fill="#4a4060" fontSize="7.5" fontFamily="monospace">athenaeum · 4 types · TF-IDF recall · decay physics</text>
    </svg>
  );
}

/* ── Nexus — knowledge graph ─────────────────────────────── */

function NexusVisual({ visible }: { visible: boolean }) {
  const nodes = [
    { x: 158, y: 62, r: 10, col: '#c4a265', label: 'Jin-Woo',    type: 'soul'    },
    { x: 62,  y: 32, r: 7,  col: '#7c5cbf', label: 'Hae-In',     type: 'person'  },
    { x: 256, y: 32, r: 7,  col: '#7c5cbf', label: 'Igris',       type: 'person'  },
    { x: 40,  y: 112, r: 6, col: '#4cb87a', label: 'Shadow Army', type: 'concept' },
    { x: 278, y: 112, r: 6, col: '#4cb87a', label: 'System',      type: 'concept' },
    { x: 100, y: 152, r: 5, col: '#d4704a', label: 'grief',       type: 'emotion' },
    { x: 220, y: 152, r: 5, col: '#d4704a', label: 'purpose',     type: 'emotion' },
    { x: 158, y: 148, r: 5, col: '#4a90d9', label: 'Seoul',       type: 'place'   },
  ];
  const edges = [
    { a: 0, b: 1, label: 'loves',      active: true  },
    { a: 0, b: 2, label: 'trusts',     active: true  },
    { a: 0, b: 3, label: 'commands',   active: true  },
    { a: 0, b: 4, label: 'bound_to',   active: true  },
    { a: 0, b: 5, label: 'carries',    active: false }, // expired
    { a: 0, b: 6, label: 'holds',      active: true  },
    { a: 0, b: 7, label: 'protects',   active: true  },
    { a: 3, b: 5, label: 'source_of',  active: true  },
  ];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {/* edges */}
      {edges.map((e, i) => {
        const a = nodes[e.a], b = nodes[e.b];
        const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2 - 10;
        return (
          <g key={i}>
            <path d={`M${a.x},${a.y} Q${mx},${my} ${b.x},${b.y}`}
              fill="none"
              stroke={e.active ? '#7c5cbf' : '#3a3245'}
              strokeWidth={e.active ? 1 : 0.6}
              strokeDasharray={e.active ? undefined : '3,3'}
              opacity={visible ? (e.active ? 0.45 : 0.22) : 0}
              style={{ transition: `opacity 0.5s ease-out ${i * 80}ms` }}
            />
            <text x={mx} y={my - 2} textAnchor="middle" fill={e.active ? '#6a5a88' : '#3a3245'}
              fontSize="6.5" fontFamily="monospace"
              opacity={visible ? (e.active ? 0.7 : 0.3) : 0}
              style={{ transition: `opacity 0.5s ease-out ${100 + i * 80}ms` }}
            >
              {e.label}
            </text>
          </g>
        );
      })}
      {/* nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          <circle cx={n.x} cy={n.y} r={n.r + 4} fill={n.col} opacity={visible ? 0.08 : 0}
            style={{ transition: `opacity 0.4s ease-out ${i * 60}ms` }} />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.col}
            opacity={visible ? (i === 0 ? 1 : 0.72) : 0}
            style={{ transition: `opacity 0.4s ease-out ${i * 60}ms` }} />
          <text x={n.x} y={n.y + n.r + 10} textAnchor="middle" fill={n.col} fontSize="7" fontFamily="monospace"
            opacity={visible ? 0.65 : 0}
            style={{ transition: `opacity 0.5s ease-out ${100 + i * 60}ms` }}
          >
            {n.label}
          </text>
        </g>
      ))}
      {/* expired label */}
      <text x="72" y="118" fill="#3a3245" fontSize="6.5" fontFamily="monospace"
        opacity={visible ? 0.55 : 0}
        style={{ transition: 'opacity 0.6s ease-out 0.9s' }}
      >
        [expired]
      </text>
      <text x="20" y="172" fill="#4a4060" fontSize="7.5" fontFamily="monospace">nexus · entity-relation graph · temporal validity</text>
    </svg>
  );
}

/* ── Consolidation — dream pipeline ──────────────────────── */

function ConsolidationVisual({ visible }: { visible: boolean }) {
  const episodic = [
    [28,25],[48,52],[22,78],[55,100],[32,128],[62,148],[38,168],
    [18,48],[58,72],[42,108],[52,132],[26,155],
  ];
  const semantic = [
    [266,35],[282,72],[270,112],[285,148],[260,162],
  ];
  const concepts = ['grief', 'power', 'loyalty', 'cost', 'sacrifice'];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {/* Zone backgrounds */}
      <rect x="8"   y="8" width="90"  height="164" rx="6" fill="#200a00" opacity="0.4" />
      <rect x="108" y="8" width="104" height="164" rx="6" fill="#08041a" opacity="0.4" />
      <rect x="222" y="8" width="90"  height="164" rx="6" fill="#050012" opacity="0.4" />

      {/* Zone labels */}
      {[['episodic','#d4704a',53],['dream cycle','#7c5cbf',160],['semantic','#7c5cbf',267]].map(([label,col,x],i) => (
        <text key={i} x={x as number} y="175" textAnchor="middle" fill={col as string} fontSize="7.5" fontFamily="monospace" opacity="0.6">{label}</text>
      ))}

      {/* Episodic memories — scattered, varying strength */}
      {episodic.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={2 + (i % 3)}
          fill="#d4704a"
          opacity={visible ? 0.2 + (i % 5) * 0.14 : 0}
          style={{ transition: `opacity 0.4s ease-out ${i * 50}ms` }}
        />
      ))}

      {/* Flow arrows */}
      {[88, 104].map((x, i) => (
        <path key={i} d={`M${x},90 L${x + 12},90`} fill="none"
          stroke="#7c5cbf" strokeWidth="1.2" strokeLinecap="round"
          opacity={visible ? 0.45 : 0}
          style={{ transition: `opacity 0.5s ease-out ${0.5 + i * 0.1}s` }}
        />
      ))}
      <path d="M214,90 L222,90" fill="none" stroke="#7c5cbf" strokeWidth="1.2" strokeLinecap="round"
        opacity={visible ? 0.45 : 0} style={{ transition: 'opacity 0.5s ease-out 0.6s' }} />

      {/* Dream swirl */}
      {[0,1,2].map((i) => (
        <circle key={i} cx="160" cy="90" r={16 + i * 18}
          fill="none" stroke="#7c5cbf" strokeWidth="0.6"
          opacity={visible ? 0.12 + i * 0.06 : 0}
          style={{ transition: `opacity 0.6s ease-out ${0.4 + i * 0.15}s` }}
        />
      ))}
      <circle cx="160" cy="90" r="7" fill="#7c5cbf"
        opacity={visible ? 0.55 : 0} style={{ transition: 'opacity 0.5s ease-out 0.5s' }} />

      {/* Concept tags floating in dream zone */}
      {concepts.map((c, i) => (
        <text key={c}
          x={118 + (i % 2) * 40} y={28 + i * 30}
          fill="#a87ef0" fontSize="6.5" fontFamily="monospace"
          opacity={visible ? 0.45 : 0}
          style={{ transition: `opacity 0.5s ease-out ${0.6 + i * 0.1}s` }}
        >
          {c}
        </text>
      ))}

      {/* Semantic nodes — fewer, larger, stable */}
      {semantic.map(([cx, cy], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={8 + i} fill="#7c5cbf"
            opacity={visible ? 0.12 : 0}
            style={{ transition: `opacity 0.5s ease-out ${0.8 + i * 0.1}s` }}
          />
          <circle cx={cx} cy={cy} r={5 + i * 0.5} fill="#7c5cbf"
            opacity={visible ? 0.65 : 0}
            style={{ transition: `opacity 0.4s ease-out ${0.9 + i * 0.1}s` }}
          />
        </g>
      ))}

      {/* Counts */}
      <text x="53" y="14" textAnchor="middle" fill="#d4704a" fontSize="7" fontFamily="monospace"
        opacity={visible ? 0.6 : 0} style={{ transition: 'opacity 0.5s ease-out 0.3s' }}>12 ep.</text>
      <text x="267" y="14" textAnchor="middle" fill="#7c5cbf" fontSize="7" fontFamily="monospace"
        opacity={visible ? 0.6 : 0} style={{ transition: 'opacity 0.5s ease-out 1s' }}>5 sem.</text>
    </svg>
  );
}

/* ── Section data ────────────────────────────────────────── */

const CORES = [
  {
    tag: 'MEMORY ENGINE',
    title: 'The Athenaeum',
    subtitle: 'SQLite · TF-IDF · Decay Physics',
    description: 'Every memory is stored with an importance score, emotional weight, and a decay rate. Episodic memories fade fastest. Self-model memories persist longest. TF-IDF vectors enable associative recall — asking about one thing surfaces related things the soul experienced.',
    details: [
      '4 memory types with independent decay curves',
      'Emotional weight reduces effective decay rate',
      'TF-IDF cosine similarity for semantic search',
      'Association links connect related memories',
    ],
    Visual: AthenaeumVisual,
    flip: false,
  },
  {
    tag: 'KNOWLEDGE GRAPH',
    title: 'The Nexus',
    subtitle: 'Temporal · Entity-Relation · SQLite',
    description: 'A graph of entities — people, concepts, emotions, places — connected by weighted relations. Every edge carries a validity window: facts can expire. The soul doesn\'t just know things; it knows when those things were true, and when they stopped being.',
    details: [
      'Nodes: person, concept, event, emotion, place, soul',
      'Edges weighted by strength with evidence trails',
      'Temporal validity — relations can expire over time',
      'BFS traversal for contextual association chains',
    ],
    Visual: NexusVisual,
    flip: true,
  },
  {
    tag: 'DREAM CYCLE',
    title: 'Consolidation',
    subtitle: 'Episodic → Semantic · Compaction · Graph Build',
    description: 'Between sessions, weak episodic memories are distilled into semantic facts. Similar memories are merged. Concepts are extracted and linked into the Nexus. The soul reorganises what happened into what it means — the same process that makes human sleep non-optional.',
    details: [
      'Episodic memories below 0.4 strength become candidates',
      'Cosine similarity ≥ 0.45 triggers memory compaction',
      'Concept extraction feeds directly into the Nexus',
      'Distilled facts inherit the highest-density sentences',
    ],
    Visual: ConsolidationVisual,
    flip: false,
  },
];

/* ── Row component ───────────────────────────────────────── */

function CoreRow({ core, index }: { core: typeof CORES[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const { Visual } = core;

  return (
    <div
      ref={ref}
      className={`flex flex-col ${core.flip ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-8 md:gap-14 transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}
      style={{ transitionDelay: `${index * 80}ms` }}
    >
      {/* Visual */}
      <div className="w-full md:w-1/2 shrink-0">
        <div className="bg-grimoire-surface/80 border border-grimoire-border rounded-2xl p-6 md:p-8 aspect-video">
          <Visual visible={visible} />
        </div>
      </div>

      {/* Text */}
      <div className="w-full md:w-1/2">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-grimoire-purple-bright mb-3">
          {core.tag}
        </p>
        <h3 className="font-serif text-3xl md:text-4xl text-grimoire-gold mb-1 leading-tight">
          {core.title}
        </h3>
        <p className="font-mono text-[10px] text-grimoire-muted/50 mb-4 tracking-wider">
          {core.subtitle}
        </p>
        <p className="text-grimoire-muted leading-relaxed text-[15px] mb-5">
          {core.description}
        </p>
        <ul className="space-y-2">
          {core.details.map((d) => (
            <li key={d} className="flex items-start gap-2.5 text-sm text-grimoire-text-secondary">
              <span className="text-grimoire-gold/50 mt-0.5 shrink-0 text-[10px]">◆</span>
              {d}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────── */

export default function SoulCore() {
  return (
    <section className="py-28 md:py-36">
      <div className="section-container">

        <div className="text-center mb-20">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">
            Core Architecture
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-5 leading-tight">
            Memory, Knowledge, Dreams
          </h2>
          <p className="text-grimoire-muted text-lg max-w-xl mx-auto leading-relaxed">
            Three engines that run beneath every soul — storing what happened,
            understanding what it means, and processing it while you're away.
          </p>
        </div>

        <div className="flex flex-col gap-24 md:gap-32">
          {CORES.map((core, i) => (
            <CoreRow key={core.title} core={core} index={i} />
          ))}
        </div>

      </div>
    </section>
  );
}
