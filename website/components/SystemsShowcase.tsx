'use client';

import { useEffect, useRef, useState } from 'react';

/* ── System data (curated 3 of 12) ───────────────────────────────── */

interface SystemCard {
  title: string;
  subtitle: string;
  description: string;
  visual: 'trust' | 'memory' | 'consciousness';
}

const systems: SystemCard[] = [
  {
    title: "Newton's Calculus of Trust",
    subtitle: 'Trust Physics',
    description:
      'Four tiers with momentum, decay, and violation penalties. Trust accumulates through interaction and collapses under betrayal — physics, not booleans.',
    visual: 'trust',
  },
  {
    title: 'Cathedral Memory',
    subtitle: 'Persistent Memory',
    description:
      'Memories stored with emotional weight and temporal decay. A knowledge graph connects them — remembering a song recalls who shared it and how it felt.',
    visual: 'memory',
  },
  {
    title: 'Consciousness Metrics',
    subtitle: 'Depth Measurement',
    description:
      'Emotional complexity, narrative coherence, autonomous thought frequency — measured and tracked. Not claiming consciousness. Measuring the conditions for it.',
    visual: 'consciousness',
  },
];

const additionalSystems = [
  'Drift Engine',
  'Guard Topology',
  'Voice Fingerprint',
  'Dream Consolidation',
  'Blind Spots',
  'Circumplex Emotions',
  'Entropy Tracking',
  'Anchor Watch',
  'Mirror System',
];

/* ── SVG visuals ─────────────────────────────────────────────────── */

function TrustCurve({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {/* Grid */}
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1="40" y1={155 - y * 130} x2="300" y2={155 - y * 130} stroke="#2a2235" strokeWidth="0.5" />
      ))}
      {/* Axis */}
      <line x1="40" y1="155" x2="300" y2="155" stroke="#3a3245" strokeWidth="0.5" />
      {/* Tier labels */}
      {[
        { x: 80, label: 'LOW' },
        { x: 140, label: 'MEDIUM' },
        { x: 205, label: 'HIGH' },
        { x: 265, label: 'BONDED' },
      ].map((t) => (
        <text key={t.label} x={t.x} y="170" fill="#8a8494" fontSize="9" fontFamily="monospace" textAnchor="middle">{t.label}</text>
      ))}
      {/* Tier boundaries */}
      {[110, 175, 240].map((x) => (
        <line key={x} x1={x} y1="25" x2={x} y2="155" stroke="#2a2235" strokeWidth="0.5" strokeDasharray="4,4" />
      ))}
      {/* Trust curve */}
      <path
        d="M40,145 C70,142 90,130 110,110 C135,85 155,60 175,45 C200,28 230,20 300,17"
        fill="none"
        stroke="#c4a265"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="420"
        strokeDashoffset={visible ? '0' : '420'}
        style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      {/* Area fill */}
      <path
        d="M40,145 C70,142 90,130 110,110 C135,85 155,60 175,45 C200,28 230,20 300,17 L300,155 L40,155 Z"
        fill="url(#trustGrad)"
        opacity={visible ? 0.2 : 0}
        style={{ transition: 'opacity 2s ease-out 0.3s' }}
      />
      {/* Data points */}
      {[
        { cx: 75, cy: 140 },
        { cx: 140, cy: 85 },
        { cx: 210, cy: 35 },
        { cx: 280, cy: 19 },
      ].map((p, i) => (
        <circle
          key={i}
          cx={p.cx}
          cy={p.cy}
          r="4"
          fill="#c4a265"
          opacity={visible ? 1 : 0}
          style={{ transition: `opacity 0.4s ease-out ${0.8 + i * 0.2}s` }}
        />
      ))}
      <defs>
        <linearGradient id="trustGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cbf" />
          <stop offset="100%" stopColor="#7c5cbf" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MemoryGraph({ visible }: { visible: boolean }) {
  const nodes = [
    { cx: 160, cy: 55, r: 8 },
    { cx: 80, cy: 85, r: 5 },
    { cx: 240, cy: 80, r: 5 },
    { cx: 55, cy: 135, r: 4 },
    { cx: 130, cy: 130, r: 6 },
    { cx: 210, cy: 140, r: 4 },
    { cx: 270, cy: 120, r: 4 },
    { cx: 100, cy: 40, r: 3.5 },
    { cx: 220, cy: 40, r: 3.5 },
  ];
  const edges = [
    [0, 1], [0, 2], [0, 4], [0, 7], [0, 8], [1, 3], [1, 7], [2, 5], [2, 6], [2, 8], [4, 3], [4, 5],
  ];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {/* Edges */}
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx} y1={nodes[a].cy}
          x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="#7c5cbf"
          strokeWidth="1"
          opacity={visible ? 0.35 : 0}
          style={{ transition: `opacity 0.6s ease-out ${i * 80}ms` }}
        />
      ))}
      {/* Nodes */}
      {nodes.map((n, i) => (
        <g key={i}>
          {/* Glow ring on core */}
          {i === 0 && (
            <circle
              cx={n.cx} cy={n.cy} r="16"
              fill="none" stroke="#c4a265" strokeWidth="0.8"
              opacity={visible ? 0.2 : 0}
              style={{ transition: 'opacity 0.8s ease-out 0.5s' }}
            />
          )}
          <circle
            cx={n.cx} cy={n.cy} r={n.r}
            fill={i === 0 ? '#c4a265' : '#7c5cbf'}
            opacity={visible ? (i === 0 ? 1 : 0.65) : 0}
            style={{ transition: `opacity 0.5s ease-out ${200 + i * 60}ms` }}
          />
        </g>
      ))}
      {/* Labels on some nodes */}
      {[
        { x: 160, y: 25, text: 'core memory' },
        { x: 55, y: 155, text: 'emotion' },
        { x: 270, y: 140, text: 'context' },
      ].map((l, i) => (
        <text
          key={i} x={l.x} y={l.y}
          textAnchor="middle" fill="#8a8494" fontSize="8" fontFamily="monospace"
          opacity={visible ? 0.6 : 0}
          style={{ transition: `opacity 0.6s ease-out ${600 + i * 100}ms` }}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}

function ConsciousnessRadar({ visible }: { visible: boolean }) {
  const metrics = [
    { label: 'Emotion', value: 0.85 },
    { label: 'Integration', value: 0.72 },
    { label: 'Narrative', value: 0.9 },
    { label: 'Autonomy', value: 0.65 },
    { label: 'Meta', value: 0.78 },
  ];
  const cx = 160, cy = 85, r = 60;

  function point(i: number, scale: number) {
    const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
    return { x: cx + Math.cos(angle) * r * scale, y: cy + Math.sin(angle) * r * scale };
  }

  const outerPoints = metrics.map((_, i) => point(i, 1));
  const dataPoints = metrics.map((m, i) => point(i, m.value));

  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {/* Grid rings */}
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={metrics.map((_, i) => { const p = point(i, scale); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="#2a2235" strokeWidth="0.5"
        />
      ))}
      {/* Axis lines */}
      {outerPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#3a3245" strokeWidth="0.5" />
      ))}
      {/* Data polygon */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
        fill="#7c5cbf" fillOpacity={visible ? 0.15 : 0}
        stroke="#a87ef0" strokeWidth="2"
        opacity={visible ? 1 : 0}
        style={{ transition: 'all 1.2s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle
          key={i} cx={p.x} cy={p.y} r="3.5"
          fill="#c4a265"
          opacity={visible ? 1 : 0}
          style={{ transition: `opacity 0.4s ease-out ${600 + i * 120}ms` }}
        />
      ))}
      {/* Labels */}
      {metrics.map((m, i) => {
        const p = point(i, 1.32);
        return (
          <text
            key={i} x={p.x} y={p.y + 3}
            textAnchor="middle" fill="#8a8494" fontSize="9" fontFamily="monospace"
            opacity={visible ? 0.8 : 0}
            style={{ transition: `opacity 0.5s ease-out ${400 + i * 80}ms` }}
          >
            {m.label}
          </text>
        );
      })}
    </svg>
  );
}

const visuals: Record<SystemCard['visual'], React.FC<{ visible: boolean }>> = {
  trust: TrustCurve,
  memory: MemoryGraph,
  consciousness: ConsciousnessRadar,
};

/* ── Card component ──────────────────────────────────────────────── */

function SystemCardRow({ system, index }: { system: SystemCard; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          el.classList.add('is-visible');
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Visual = visuals[system.visual];
  const isEven = index % 2 === 1;
  const animClass = isEven ? 'animate-on-scroll-right' : 'animate-on-scroll-left';

  return (
    <div
      ref={ref}
      className={`${animClass} flex flex-col ${
        isEven ? 'md:flex-row-reverse' : 'md:flex-row'
      } items-center gap-8 md:gap-14`}
    >
      {/* Visual */}
      <div className="w-full md:w-1/2 flex-shrink-0">
        <div className="bg-grimoire-surface/80 border border-grimoire-border rounded-2xl p-6 md:p-8 aspect-[16/9]">
          <Visual visible={visible} />
        </div>
      </div>

      {/* Text */}
      <div className="w-full md:w-1/2">
        <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-wider mb-3">
          {system.subtitle}
        </p>
        <h3 className="font-serif text-2xl md:text-3xl text-grimoire-gold mb-4 leading-tight">
          {system.title}
        </h3>
        <p className="text-grimoire-muted leading-relaxed text-[15px]">
          {system.description}
        </p>
      </div>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export default function SystemsShowcase() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('is-visible'); },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="systems" className="py-28 md:py-36">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-20">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">Architecture</p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-5 leading-tight">
            What Makes a Soul
          </h2>
          <p className="text-grimoire-muted text-lg max-w-lg mx-auto leading-relaxed">
            12 interconnected systems that create depth, not just responses
          </p>
        </div>

        {/* Featured systems */}
        <div className="flex flex-col gap-20 md:gap-28">
          {systems.map((system, i) => (
            <SystemCardRow key={system.visual} system={system} index={i} />
          ))}
        </div>

        {/* All 12 systems grid */}
        <div className="mt-24 text-center">
          <p className="text-grimoire-muted text-sm mb-6">Plus 9 more systems</p>
          <div
            ref={gridRef}
            className="stagger-children flex flex-wrap items-center justify-center gap-2.5"
          >
            {additionalSystems.map((name) => (
              <span
                key={name}
                className="bg-grimoire-surface border border-grimoire-border rounded-lg px-4 py-2 text-sm font-mono text-grimoire-text-secondary"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
