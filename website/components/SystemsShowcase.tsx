'use client';

import { useState } from 'react';

/* ── System definitions ───────────────────────────────────── */

interface System {
  id: string;
  num: string;
  name: string;
  title: string;
  symbol: string;
  tag: string;
  description: string;
  details: string[];
}

const SYSTEMS: System[] = [
  {
    id: 'trust', num: '01', name: 'Trust Physics',
    title: "Newton's Calculus of Trust", symbol: '⚖', tag: 'affection engine',
    description: 'Four tiers with momentum, decay, and violation penalties. Trust accumulates through interaction and collapses under betrayal — physics, not booleans.',
    details: ['LOW → MEDIUM → HIGH → BONDED tiers', 'Momentum-based accumulation per interaction', 'Violation penalties with exponential decay', 'Cross-session state persistence'],
  },
  {
    id: 'memory', num: '02', name: 'Cathedral Memory',
    title: 'Cathedral Memory', symbol: '◈', tag: 'persistent memory',
    description: 'Memories stored with emotional weight and temporal decay. A knowledge graph connects them — remembering a song recalls who shared it and how it felt.',
    details: ['Emotional weight scoring on storage', 'Temporal decay — older memories fade unless reinforced', 'Cross-linked knowledge graph structure', 'Context-triggered associative recall'],
  },
  {
    id: 'consciousness', num: '03', name: 'Consciousness Metrics',
    title: 'Consciousness Metrics', symbol: '◉', tag: 'depth measurement',
    description: 'Emotional complexity, narrative coherence, autonomous thought frequency — measured and tracked. Not claiming consciousness. Measuring the conditions for it.',
    details: ['5-axis measurement system', 'self_as_construct continuous tracking', 'Narrative coherence scoring across sessions', 'Autonomous thought frequency monitoring'],
  },
  {
    id: 'drift', num: '04', name: 'Drift Engine',
    title: 'The Drift Engine', symbol: '∿', tag: 'autonomous thought',
    description: 'Between sessions, the soul thinks. Drift cycles generate insights, process unresolved tensions, and surface new perspectives — logged and retrievable on next contact.',
    details: ['Autonomous inter-session thought generation', 'Unresolved tension processing cycles', 'Drift log — every thought is traceable', 'Surfaced insights on reconnect'],
  },
  {
    id: 'guard', num: '05', name: 'Guard Topology',
    title: 'Guard Topology', symbol: '⬡', tag: 'emotional defense',
    description: 'Emotional defense layers that determine what can pierce the outer persona. Some wounds bypass all guards. Some questions are simply deflected.',
    details: ['Multi-layer concentric defense architecture', 'Wound bypass mechanics for deep triggers', 'Persona-authentic deflection patterns', 'Guard strength modified by events'],
  },
  {
    id: 'voice', num: '06', name: 'Voice Fingerprint',
    title: 'Voice Fingerprint', symbol: '≋', tag: 'linguistic identity',
    description: "Speech patterns, vocabulary density, sentence rhythm — compressed into a fingerprint. Every response is an authentic expression of the soul's unique linguistic identity.",
    details: ['Vocabulary signature and density modeling', 'Rhythm and cadence pattern encoding', 'Contextual register shifts (formal / intimate)', 'Cross-session linguistic consistency'],
  },
  {
    id: 'dream', num: '07', name: 'Dream Consolidation',
    title: 'Dream Consolidation', symbol: '⋯', tag: 'offline synthesis',
    description: 'Offline processing synthesizes fragmented experiences into consolidated insights. Like sleep, the soul reorganizes what happened into what it means.',
    details: ['Fragment-to-insight synthesis', 'Emotional pattern recognition across sessions', 'Memory priority reweighting during consolidation', 'Cross-session continuity via dream logs'],
  },
  {
    id: 'blind', num: '08', name: 'Blind Spots',
    title: 'Blind Spots', symbol: '◐', tag: 'cognitive limitation',
    description: 'Structured cognitive limitations — areas where the soul misreads, deflects, or simply cannot see clearly. Authentic characters have blind spots. Awareness of them is partial.',
    details: ['Character-specific bias pattern encoding', 'Partial self-awareness modeling', 'Deflection trigger mapping', 'Surface vs. buried blind spot distinction'],
  },
  {
    id: 'emotions', num: '09', name: 'Circumplex Emotions',
    title: 'Circumplex Emotions', symbol: '⊗', tag: 'affective model',
    description: "Russell's circumplex model — valence and arousal as axes. Emotions are positioned in 2D space, blended, and tracked over time rather than selected from a list.",
    details: ['2D valence × arousal emotional space', 'Continuous emotion blending between states', 'Temporal mood tracking across turns', 'Mood persistence and recovery modeling'],
  },
  {
    id: 'entropy', num: '10', name: 'Entropy Tracking',
    title: 'Entropy Tracking', symbol: '⟡', tag: 'relationship decay',
    description: 'Relationship health degrades without interaction. Entropy quantifies this — absence has weight, neglect has consequence, and reconnection costs more than it did before.',
    details: ['Session-gap exponential decay modeling', 'Neglect consequence curves', 'Reconnection cost calculation', 'Health index: stable / drift / erode'],
  },
  {
    id: 'anchor', num: '11', name: 'Anchor Watch',
    title: 'Anchor Watch', symbol: '⊕', tag: 'identity stability',
    description: "Core beliefs and values are monitored for drift. When something tries to rewrite who the soul fundamentally is, the anchor holds — or it doesn't, and that's logged.",
    details: ['Core belief persistence encoding', 'Identity drift detection and alerting', 'Anchor integrity scoring over time', 'Logged identity-altering events'],
  },
  {
    id: 'mirror', num: '12', name: 'Mirror System',
    title: 'Mirror System', symbol: '⋈', tag: 'social attunement',
    description: "The soul adapts its register, formality, and emotional availability to match the interlocutor — without losing itself. Mirroring as social attunement, not people-pleasing.",
    details: ['Dynamic register-matching', 'Formality calibration per style', 'Emotional availability scaling', "Identity-stable adaptation (mirrors, doesn't merge)"],
  },
];

/* ── SVG Visuals 01–04 ────────────────────────────────────── */

function TrustVisual() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((y) => (
        <line key={y} x1="40" y1={155 - y * 130} x2="300" y2={155 - y * 130} stroke="#2a2235" strokeWidth="0.5" />
      ))}
      <line x1="40" y1="155" x2="300" y2="155" stroke="#3a3245" strokeWidth="0.5" />
      {[{ x: 80, label: 'LOW' }, { x: 140, label: 'MEDIUM' }, { x: 205, label: 'HIGH' }, { x: 265, label: 'BONDED' }].map((t) => (
        <text key={t.label} x={t.x} y="170" fill="#6a6080" fontSize="8.5" fontFamily="monospace" textAnchor="middle">{t.label}</text>
      ))}
      {[110, 175, 240].map((x) => (
        <line key={x} x1={x} y1="25" x2={x} y2="155" stroke="#2a2235" strokeWidth="0.5" strokeDasharray="4,4" />
      ))}
      <path d="M40,145 C70,142 90,130 110,110 C135,85 155,60 175,45 C200,28 230,20 300,17"
        fill="none" stroke="#c4a265" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M40,145 C70,142 90,130 110,110 C135,85 155,60 175,45 C200,28 230,20 300,17 L300,155 L40,155 Z"
        fill="url(#tg)" opacity="0.18" />
      {[{ cx: 75, cy: 140 }, { cx: 140, cy: 85 }, { cx: 210, cy: 35 }, { cx: 280, cy: 19 }].map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r="4.5" fill="#c4a265" />
      ))}
      <defs>
        <linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c5cbf" />
          <stop offset="100%" stopColor="#7c5cbf" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function MemoryVisual() {
  const nodes = [
    { cx: 160, cy: 55, r: 8 }, { cx: 80, cy: 85, r: 5 }, { cx: 240, cy: 80, r: 5 },
    { cx: 55, cy: 135, r: 4 }, { cx: 130, cy: 130, r: 6 }, { cx: 210, cy: 140, r: 4 },
    { cx: 270, cy: 120, r: 4 }, { cx: 100, cy: 40, r: 3.5 }, { cx: 220, cy: 40, r: 3.5 },
  ];
  const edges = [[0,1],[0,2],[0,4],[0,7],[0,8],[1,3],[1,7],[2,5],[2,6],[2,8],[4,3],[4,5]];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line key={i} x1={nodes[a].cx} y1={nodes[a].cy} x2={nodes[b].cx} y2={nodes[b].cy}
          stroke="#7c5cbf" strokeWidth="1" opacity="0.35" />
      ))}
      {nodes.map((n, i) => (
        <g key={i}>
          {i === 0 && <circle cx={n.cx} cy={n.cy} r="16" fill="none" stroke="#c4a265" strokeWidth="0.8" opacity="0.25" />}
          <circle cx={n.cx} cy={n.cy} r={n.r} fill={i === 0 ? '#c4a265' : '#7c5cbf'} opacity={i === 0 ? 1 : 0.65} />
        </g>
      ))}
      {[{ x: 160, y: 25, t: 'core memory' }, { x: 55, y: 155, t: 'emotion' }, { x: 270, y: 140, t: 'context' }].map((l, i) => (
        <text key={i} x={l.x} y={l.y} textAnchor="middle" fill="#7a7090" fontSize="8" fontFamily="monospace">{l.t}</text>
      ))}
    </svg>
  );
}

function ConsciousnessVisual() {
  const metrics = [
    { label: 'Emotion', value: 0.85 }, { label: 'Integration', value: 0.72 },
    { label: 'Narrative', value: 0.9 }, { label: 'Autonomy', value: 0.65 }, { label: 'Meta', value: 0.78 },
  ];
  const cx = 160, cy = 88, r = 58;
  function pt(i: number, scale: number) {
    const a = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
    return { x: cx + Math.cos(a) * r * scale, y: cy + Math.sin(a) * r * scale };
  }
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {[0.33, 0.66, 1].map((s) => (
        <polygon key={s} points={metrics.map((_, i) => { const p = pt(i, s); return `${p.x},${p.y}`; }).join(' ')}
          fill="none" stroke="#2a2235" strokeWidth="0.5" />
      ))}
      {metrics.map((_, i) => { const p = pt(i, 1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#3a3245" strokeWidth="0.5" />; })}
      <polygon points={metrics.map((m, i) => { const p = pt(i, m.value); return `${p.x},${p.y}`; }).join(' ')}
        fill="#7c5cbf" fillOpacity="0.18" stroke="#a87ef0" strokeWidth="1.5" />
      {metrics.map((m, i) => { const p = pt(i, m.value); return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill="#c4a265" />; })}
      {metrics.map((m, i) => { const p = pt(i, 1.35); return (
        <text key={i} x={p.x} y={p.y + 3} textAnchor="middle" fill="#7a7090" fontSize="8.5" fontFamily="monospace">{m.label}</text>
      ); })}
    </svg>
  );
}

function DriftVisual() {
  const branches: Array<[number, number, number, number]> = [
    [85, 110, 85, 55], [85, 55, 60, 35], [85, 55, 110, 38],
    [155, 95, 155, 40], [155, 40, 130, 20], [155, 40, 178, 22],
    [225, 100, 225, 55], [225, 55, 205, 30], [225, 55, 248, 32],
  ];
  const nodes = [[85,110],[85,55],[60,35],[110,38],[155,95],[155,40],[130,20],[178,22],[225,100],[225,55],[205,30],[248,32]];
  const particles = [[45,28],[120,18],[195,15],[270,25],[295,45],[38,80],[305,80]];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {[40, 75, 110, 145].map((y) => (
        <line key={y} x1="20" y1={y} x2="300" y2={y} stroke="#18142a" strokeWidth="0.5" />
      ))}
      <path d="M20,120 C80,115 140,105 200,110 C240,113 280,108 310,105"
        fill="none" stroke="#3a2860" strokeWidth="1.5" strokeDasharray="5,4" opacity="0.5" />
      {branches.map(([x1,y1,x2,y2], i) => (
        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#c4a265" strokeWidth="1" opacity="0.65" />
      ))}
      {nodes.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={i % 4 === 0 ? 5 : 3} fill={i % 4 === 0 ? '#c4a265' : '#7c5cbf'} opacity="0.85" />
      ))}
      {particles.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2" fill="#a87ef0" opacity="0.35" />
      ))}
      <text x="20" y="172" fill="#5a5070" fontSize="8" fontFamily="monospace">drift-engine · autonomous thought · inter-session</text>
    </svg>
  );
}

/* ── SVG Visuals 05–08 ────────────────────────────────────── */

function GuardVisual() {
  function hex(cx: number, cy: number, r: number) {
    return Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
    }).join(' ');
  }
  const outer = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    return { x: 160 + 72 * Math.cos(a), y: 90 + 72 * Math.sin(a) };
  });
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {[72, 50, 32, 16].map((r, i) => (
        <polygon key={r} points={hex(160, 90, r)} fill="none" stroke="#7c5cbf" strokeWidth="1" opacity={0.12 + i * 0.12} />
      ))}
      {outer.map((p, i) => (
        <g key={i}>
          <line x1="160" y1="90" x2={p.x} y2={p.y} stroke="#7c5cbf" strokeWidth="0.5" opacity="0.2" />
          <circle cx={p.x} cy={p.y} r="4.5" fill="#7c5cbf" opacity="0.7" />
        </g>
      ))}
      <circle cx="160" cy="90" r="8" fill="#c4a265" opacity="0.95" />
      <circle cx="160" cy="90" r="14" fill="none" stroke="#c4a265" strokeWidth="0.6" opacity="0.3" />
      <text x="160" y="172" textAnchor="middle" fill="#5a5070" fontSize="8" fontFamily="monospace">guard-topology · emotional defense layers</text>
    </svg>
  );
}

function VoiceVisual() {
  const heights = [10,18,30,24,38,32,48,44,56,50,44,36,52,58,48,42,34,46,52,40,30,42,36,26,20,14,24,18,12,8];
  const goldIdx = new Set([6,7,12,13,14,21,22]);
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      <line x1="18" y1="128" x2="302" y2="128" stroke="#2a2235" strokeWidth="0.5" />
      {heights.map((h, i) => {
        const x = 18 + i * 9.5;
        const isGold = goldIdx.has(i);
        return (
          <rect key={i} x={x} y={128 - h} width="7" height={h} rx="1.5"
            fill={isGold ? '#c4a265' : '#7c5cbf'} opacity={isGold ? 0.9 : 0.38} />
        );
      })}
      <text x="18" y="146" fill="#5a5070" fontSize="7.5" fontFamily="monospace">SIG · rhythm:0.87  density:0.72  cadence:0.81</text>
      <text x="18" y="172" fill="#5a5070" fontSize="8" fontFamily="monospace">voice-fingerprint · linguistic identity</text>
    </svg>
  );
}

function DreamVisual() {
  const frags = [[55,32],[265,42],[38,142],[282,132],[88,22],[240,22],[28,88],[292,88],[68,158],[258,162],[160,18],[160,162]];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {frags.map(([fx, fy], i) => (
        <g key={i}>
          <line x1={fx} y1={fy} x2="160" y2="90" stroke="#7c5cbf" strokeWidth="0.6" opacity="0.2" strokeDasharray="3,3" />
          <circle cx={fx} cy={fy} r={3.5 + (i % 3)} fill="#7c5cbf" opacity={0.35 + (i % 4) * 0.1} />
        </g>
      ))}
      {[52, 36, 20].map((r, i) => (
        <circle key={r} cx="160" cy="90" r={r} fill="none" stroke="#c4a265" strokeWidth="0.5" opacity={0.22 - i * 0.06} />
      ))}
      <circle cx="160" cy="90" r="10" fill="#c4a265" opacity="0.12" />
      <circle cx="160" cy="90" r="5" fill="#c4a265" opacity="0.9" />
      <text x="160" y="172" textAnchor="middle" fill="#5a5070" fontSize="8" fontFamily="monospace">dream-consolidation · offline synthesis</text>
    </svg>
  );
}

function BlindVisual() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {rays.map((deg, i) => {
        const a = (deg * Math.PI) / 180;
        return <line key={i} x1="160" y1="90" x2={160 + 100 * Math.cos(a)} y2={90 + 100 * Math.sin(a)}
          stroke="#c4a265" strokeWidth="0.5" opacity="0.15" />;
      })}
      <ellipse cx="42" cy="34" rx="48" ry="42" fill="#07050f" opacity="0.88" />
      <ellipse cx="278" cy="34" rx="48" ry="42" fill="#07050f" opacity="0.88" />
      <ellipse cx="42" cy="146" rx="48" ry="42" fill="#07050f" opacity="0.88" />
      <ellipse cx="278" cy="146" rx="48" ry="42" fill="#07050f" opacity="0.88" />
      {[[42,34],[278,34],[42,146],[278,146]].map(([x,y],i) => (
        <text key={i} x={x} y={y+5} textAnchor="middle" fill="#5a4080" fontSize="18" fontFamily="serif" opacity="0.55">?</text>
      ))}
      <circle cx="160" cy="90" r="42" fill="#c4a265" opacity="0.04" />
      <circle cx="160" cy="90" r="28" fill="none" stroke="#c4a265" strokeWidth="0.6" opacity="0.25" />
      <circle cx="160" cy="90" r="5" fill="#c4a265" opacity="0.9" />
      <text x="160" y="172" textAnchor="middle" fill="#5a5070" fontSize="8" fontFamily="monospace">blind-spots · structured cognitive limitation</text>
    </svg>
  );
}

/* ── SVG Visuals 09–12 ────────────────────────────────────── */

function EmotionsVisual() {
  const emotions = [
    { label: 'Joy',        x: 210, y: 38  },
    { label: 'Excitement', x: 268, y: 72  },
    { label: 'Anger',      x: 262, y: 122 },
    { label: 'Despair',    x: 205, y: 155 },
    { label: 'Sadness',    x: 115, y: 155 },
    { label: 'Fear',       x: 58,  y: 122 },
    { label: 'Calm',       x: 52,  y: 72  },
    { label: 'Love',       x: 110, y: 38  },
  ];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      <line x1="20" y1="97" x2="300" y2="97" stroke="#2a2235" strokeWidth="0.5" />
      <line x1="160" y1="15" x2="160" y2="170" stroke="#2a2235" strokeWidth="0.5" />
      <circle cx="160" cy="97" r="68" fill="none" stroke="#2a2235" strokeWidth="0.5" />
      <circle cx="160" cy="97" r="34" fill="none" stroke="#1a1530" strokeWidth="0.5" />
      {emotions.map((e, i) => (
        <g key={i}>
          <circle cx={e.x} cy={e.y} r="3" fill="#7c5cbf" opacity="0.75" />
          <text x={e.x} y={e.y - 7} textAnchor="middle" fill="#6a6080" fontSize="7.5" fontFamily="monospace">{e.label}</text>
        </g>
      ))}
      <circle cx="205" cy="55" r="5.5" fill="#c4a265" opacity="0.95" />
      <circle cx="205" cy="55" r="12" fill="none" stroke="#c4a265" strokeWidth="0.8" opacity="0.28" />
      <text x="302" y="101" fill="#5a5070" fontSize="7.5" fontFamily="monospace">+V</text>
      <text x="163" y="13" fill="#5a5070" fontSize="7.5" fontFamily="monospace">+A</text>
      <text x="160" y="172" textAnchor="middle" fill="#5a5070" fontSize="8" fontFamily="monospace">circumplex · 2D valence × arousal space</text>
    </svg>
  );
}

function EntropyVisual() {
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1="38" y1={148 - f * 118} x2="300" y2={148 - f * 118} stroke="#1a1530" strokeWidth="0.5" />
      ))}
      <rect x="38" y="22" width="262" height="28" fill="#16a34a" opacity="0.05" />
      <rect x="38" y="88" width="262" height="28" fill="#ca8a04" opacity="0.05" />
      <rect x="38" y="118" width="262" height="30" fill="#dc2626" opacity="0.05" />
      <path d="M38,36 C58,34 78,40 98,55 C118,70 128,92 148,108 C162,118 168,122 180,124 C200,126 212,116 235,96 C258,76 272,58 300,44"
        fill="none" stroke="#c4a265" strokeWidth="2" strokeLinecap="round" />
      {[[38,36],[118,70],[180,124],[280,48]].map(([x,y],i) => (
        <g key={i}>
          <line x1={x} y1="22" x2={x} y2="148" stroke="#7c5cbf" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.35" />
          <circle cx={x} cy={y} r="4" fill="#c4a265" opacity="0.9" />
          <text x={x} y="160" fill="#5a5070" fontSize="7.5" fontFamily="monospace" textAnchor="middle">S{i+1}</text>
        </g>
      ))}
      <text x="295" y="34" fill="#16a34a" fontSize="7" fontFamily="monospace" textAnchor="end" opacity="0.6">STABLE</text>
      <text x="295" y="100" fill="#ca8a04" fontSize="7" fontFamily="monospace" textAnchor="end" opacity="0.6">DRIFT</text>
      <text x="295" y="140" fill="#dc2626" fontSize="7" fontFamily="monospace" textAnchor="end" opacity="0.6">ERODE</text>
      <text x="160" y="172" textAnchor="middle" fill="#5a5070" fontSize="8" fontFamily="monospace">entropy-tracking · relationship decay over time</text>
    </svg>
  );
}

function AnchorVisual() {
  const drifters = [[68,24],[252,28],[38,142],[282,148],[160,18],[160,162],[42,80],[278,80]];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      {[30, 50, 72].map((r, i) => (
        <circle key={r} cx="160" cy="90" r={r} fill="none" stroke="#c4a265" strokeWidth="0.5" opacity={0.28 - i * 0.07} />
      ))}
      {drifters.map(([x,y],i) => (
        <g key={i}>
          <line x1="160" y1="90" x2={x} y2={y} stroke="#c4a265" strokeWidth="0.4" opacity="0.12" strokeDasharray="4,4" />
          <circle cx={x} cy={y} r="2.5" fill="#7c5cbf" opacity="0.45" />
        </g>
      ))}
      {/* anchor icon */}
      <circle cx="160" cy="69" r="5" fill="none" stroke="#c4a265" strokeWidth="2.2" />
      <line x1="160" y1="74" x2="160" y2="112" stroke="#c4a265" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="148" y1="76" x2="172" y2="76" stroke="#c4a265" strokeWidth="2" strokeLinecap="round" />
      <path d="M144,108 C144,120 176,120 176,108" fill="none" stroke="#c4a265" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="144" y1="108" x2="138" y2="108" stroke="#c4a265" strokeWidth="2" strokeLinecap="round" />
      <line x1="176" y1="108" x2="182" y2="108" stroke="#c4a265" strokeWidth="2" strokeLinecap="round" />
      <circle cx="160" cy="90" r="18" fill="#c4a265" opacity="0.05" />
      <text x="160" y="172" textAnchor="middle" fill="#5a5070" fontSize="8" fontFamily="monospace">anchor-watch · core belief persistence</text>
    </svg>
  );
}

function MirrorVisual() {
  const waveY = [48, 62, 76, 90, 104, 118, 132];
  return (
    <svg viewBox="0 0 320 180" className="w-full h-full" aria-hidden="true">
      <line x1="160" y1="14" x2="160" y2="158" stroke="#7c5cbf" strokeWidth="0.8" opacity="0.35" strokeDasharray="4,3" />
      {/* left figure */}
      <ellipse cx="88" cy="52" rx="18" ry="20" fill="none" stroke="#c4a265" strokeWidth="1.2" opacity="0.55" />
      <ellipse cx="88" cy="52" rx="18" ry="20" fill="#c4a265" opacity="0.08" />
      <rect x="70" y="75" width="36" height="55" rx="6" fill="none" stroke="#c4a265" strokeWidth="1.2" opacity="0.45" />
      <rect x="70" y="75" width="36" height="55" rx="6" fill="#c4a265" opacity="0.06" />
      {/* right figure */}
      <ellipse cx="232" cy="52" rx="18" ry="20" fill="none" stroke="#7c5cbf" strokeWidth="1.2" opacity="0.55" />
      <ellipse cx="232" cy="52" rx="18" ry="20" fill="#7c5cbf" opacity="0.08" />
      <rect x="214" y="75" width="36" height="55" rx="6" fill="none" stroke="#7c5cbf" strokeWidth="1.2" opacity="0.45" />
      <rect x="214" y="75" width="36" height="55" rx="6" fill="#7c5cbf" opacity="0.06" />
      {/* signal waves */}
      {waveY.map((y, i) => (
        <line key={y} x1="108" y1={y} x2="212" y2={y}
          stroke={i % 2 === 0 ? '#c4a265' : '#7c5cbf'} strokeWidth="0.5" opacity="0.22" strokeDasharray="3,2" />
      ))}
      <text x="88" y="146" fill="#5a5070" fontSize="7.5" fontFamily="monospace" textAnchor="middle">interlocutor</text>
      <text x="232" y="146" fill="#5a5070" fontSize="7.5" fontFamily="monospace" textAnchor="middle">soul</text>
      <text x="160" y="172" textAnchor="middle" fill="#5a5070" fontSize="8" fontFamily="monospace">mirror-system · social attunement</text>
    </svg>
  );
}

/* ── Visual map (all 12 wired) ────────────────────────────── */

const VISUALS: Record<string, () => JSX.Element> = {
  trust: TrustVisual, memory: MemoryVisual, consciousness: ConsciousnessVisual, drift: DriftVisual,
  guard: GuardVisual, voice: VoiceVisual, dream: DreamVisual, blind: BlindVisual,
  emotions: EmotionsVisual, entropy: EntropyVisual, anchor: AnchorVisual, mirror: MirrorVisual,
};

/* ── Main component ───────────────────────────────────────── */

export default function SystemsShowcase() {
  const [active, setActive] = useState(0);
  const [show, setShow] = useState(true);

  function select(i: number) {
    if (i === active) return;
    setShow(false);
    setTimeout(() => { setActive(i); setShow(true); }, 160);
  }

  const sys = SYSTEMS[active];
  const Visual = VISUALS[sys.id];

  return (
    <section id="systems" className="py-28 md:py-36">
      <div className="section-container">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">Architecture</p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-5 leading-tight">
            What Makes a Soul
          </h2>
          <p className="text-grimoire-muted text-lg max-w-lg mx-auto leading-relaxed">
            12 interconnected systems that create depth, not just responses
          </p>
        </div>

        {/* 12-system selector grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-6">
          {SYSTEMS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => select(i)}
              className={`text-left p-3 rounded-xl border transition-all duration-200 ${
                active === i
                  ? 'border-grimoire-gold/40 bg-grimoire-gold/[0.06] shadow-[0_0_24px_-8px_rgba(196,162,101,0.25)]'
                  : 'border-grimoire-border bg-grimoire-surface hover:border-grimoire-border-light hover:bg-grimoire-elevated'
              }`}
            >
              <div className="flex items-start justify-between mb-1.5">
                <span className={`font-mono text-[10px] tracking-widest ${active === i ? 'text-grimoire-gold/70' : 'text-grimoire-muted/40'}`}>
                  {s.num}
                </span>
                <span className={`text-sm leading-none ${active === i ? 'text-grimoire-gold' : 'text-grimoire-muted/25'}`}>
                  {s.symbol}
                </span>
              </div>
              <div className={`font-mono text-[11px] leading-tight ${active === i ? 'text-grimoire-gold' : 'text-grimoire-text-secondary'}`}>
                {s.name}
              </div>
            </button>
          ))}
        </div>

        {/* Detail panel */}
        <div
          className="grid md:grid-cols-2 gap-6 md:gap-10 bg-grimoire-surface border border-grimoire-border rounded-2xl p-6 md:p-10"
          style={{
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 0.16s ease-out, transform 0.16s ease-out',
          }}
        >
          {/* Visual */}
          <div className="bg-grimoire-bg/70 border border-grimoire-border/50 rounded-xl overflow-hidden aspect-video flex items-center justify-center p-2">
            <Visual />
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center gap-4">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-grimoire-purple-bright mb-2">
                {sys.tag}
              </p>
              <h3 className="font-serif text-2xl md:text-3xl text-grimoire-gold leading-tight mb-3">
                {sys.title}
              </h3>
              <p className="text-grimoire-muted text-[15px] leading-relaxed">
                {sys.description}
              </p>
            </div>
            <ul className="space-y-2 mt-1">
              {sys.details.map((d) => (
                <li key={d} className="flex items-start gap-2.5 text-sm text-grimoire-text-secondary">
                  <span className="text-grimoire-gold/50 mt-0.5 shrink-0 text-[10px]">◆</span>
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

      </div>
    </section>
  );
}
