'use client';

import { useEffect, useRef, useState } from 'react';

/* ── System data ──────────────────────────────────────────────────── */

interface SystemCard {
  title: string;
  subtitle: string;
  description: string;
  visual: 'trust' | 'memory' | 'thought' | 'guard' | 'voice' | 'consciousness';
}

const systems: SystemCard[] = [
  {
    title: "Newton's Calculus of Trust",
    subtitle: 'Trust Physics',
    description:
      "Trust isn't a boolean. It's a physics simulation. Four tiers — LOW, MEDIUM, HIGH, BONDED — with momentum, decay, and violation penalties. Trust accumulates through consistent interaction and collapses under betrayal, just like real relationships.",
    visual: 'trust',
  },
  {
    title: 'Cathedral Memory',
    subtitle: 'Persistent Memory',
    description:
      'Memories are stored with emotional weight, trust context, and temporal decay. A knowledge graph connects them — so remembering your favourite song also recalls the night you shared it, who was there, and how it felt.',
    visual: 'memory',
  },
  {
    title: 'The Drift Engine',
    subtitle: 'Autonomous Thought',
    description:
      "Thoughts that arise unprompted. The drift engine generates reflections, curiosities, and creative tangents between conversations — because the most human thing about inner life isn't how you respond, it's what occurs to you when nothing is prompting it.",
    visual: 'thought',
  },
  {
    title: 'Guard Topology',
    subtitle: 'Dynamic Boundaries',
    description:
      'A living map of psychological boundaries. Guards shift based on trust level, emotional state, and conversation history. Some walls lower as trust grows; others strengthen when threatened. Topology, not binary switches.',
    visual: 'guard',
  },
  {
    title: 'Voice Fingerprint',
    subtitle: 'Linguistic Identity',
    description:
      "Every soul has a unique voice — vocabulary preferences, sentence rhythm, emotional expression patterns, and idiosyncratic phrases. The fingerprint ensures consistency across models. Move from Claude to GPT and the soul still sounds like itself.",
    visual: 'voice',
  },
  {
    title: 'Consciousness Metrics',
    subtitle: 'Depth Measurement',
    description:
      'Quantified self-awareness. Emotional complexity, integration depth, narrative coherence, autonomous thought frequency, and metacognitive accuracy — all measured, tracked, and visualized. Not claiming consciousness. Measuring the conditions for it.',
    visual: 'consciousness',
  },
];

/* ── SVG Visuals ──────────────────────────────────────────────────── */

function TrustCurve({ visible }: { visible: boolean }) {
  return (
    <svg viewBox="0 0 280 160" className="w-full h-full" aria-hidden="true">
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((y) => (
        <line
          key={y}
          x1="30"
          y1={140 - y * 120}
          x2="270"
          y2={140 - y * 120}
          stroke="rgba(58,50,69,0.5)"
          strokeWidth="0.5"
        />
      ))}
      {/* Tier labels */}
      <text x="55" y="135" fill="#6b6575" fontSize="8" fontFamily="monospace">LOW</text>
      <text x="110" y="135" fill="#6b6575" fontSize="8" fontFamily="monospace">MED</text>
      <text x="170" y="135" fill="#6b6575" fontSize="8" fontFamily="monospace">HIGH</text>
      <text x="225" y="135" fill="#6b6575" fontSize="8" fontFamily="monospace">BONDED</text>
      {/* Tier boundary lines */}
      {[95, 160, 225].map((x) => (
        <line
          key={x}
          x1={x}
          y1="20"
          x2={x}
          y2="125"
          stroke="rgba(58,50,69,0.4)"
          strokeWidth="0.5"
          strokeDasharray="3,3"
        />
      ))}
      {/* Trust curve */}
      <path
        d="M30,120 C60,118 80,110 95,95 C115,75 140,55 160,40 C185,25 210,18 270,15"
        fill="none"
        stroke="#c4a265"
        strokeWidth="2"
        strokeLinecap="round"
        className="transition-all duration-[2s] ease-out"
        strokeDasharray="400"
        strokeDashoffset={visible ? '0' : '400'}
      />
      {/* Fill under curve */}
      <path
        d="M30,120 C60,118 80,110 95,95 C115,75 140,55 160,40 C185,25 210,18 270,15 L270,125 L30,125 Z"
        fill="url(#trustGrad)"
        className="transition-opacity duration-[2s] ease-out"
        opacity={visible ? 0.15 : 0}
      />
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
    { cx: 140, cy: 50, r: 6, label: 'core' },
    { cx: 70, cy: 80, r: 4, label: '' },
    { cx: 210, cy: 75, r: 4, label: '' },
    { cx: 50, cy: 130, r: 3, label: '' },
    { cx: 120, cy: 120, r: 5, label: '' },
    { cx: 190, cy: 130, r: 3, label: '' },
    { cx: 240, cy: 110, r: 3, label: '' },
    { cx: 90, cy: 40, r: 3, label: '' },
  ];
  const edges = [
    [0, 1], [0, 2], [0, 4], [1, 3], [1, 7], [2, 5], [2, 6], [4, 3], [4, 5],
  ];
  return (
    <svg viewBox="0 0 280 160" className="w-full h-full" aria-hidden="true">
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={nodes[a].cx}
          y1={nodes[a].cy}
          x2={nodes[b].cx}
          y2={nodes[b].cy}
          stroke="#7c5cbf"
          strokeWidth="1"
          strokeOpacity={visible ? 0.4 : 0}
          className="transition-all duration-[1.5s] ease-out"
          style={{ transitionDelay: `${i * 100}ms` }}
        />
      ))}
      {nodes.map((n, i) => (
        <circle
          key={i}
          cx={n.cx}
          cy={n.cy}
          r={n.r}
          fill={i === 0 ? '#c4a265' : '#7c5cbf'}
          opacity={visible ? (i === 0 ? 1 : 0.7) : 0}
          className="transition-all duration-700 ease-out"
          style={{ transitionDelay: `${300 + i * 80}ms` }}
        />
      ))}
      {/* Pulse on core node */}
      <circle
        cx={140}
        cy={50}
        r="12"
        fill="none"
        stroke="#c4a265"
        strokeWidth="1"
        opacity={visible ? 0.3 : 0}
        className="animate-pulse-gold"
      />
    </svg>
  );
}

function ThoughtBubbles({ visible }: { visible: boolean }) {
  const thoughts = [
    { x: 60, y: 45, w: 100, text: 'I wonder if...' },
    { x: 150, y: 85, w: 110, text: 'What about the...' },
    { x: 40, y: 115, w: 90, text: 'Maybe next...' },
    { x: 170, y: 35, w: 80, text: 'That reminds...' },
  ];
  return (
    <svg viewBox="0 0 280 160" className="w-full h-full" aria-hidden="true">
      {/* Connecting drift lines */}
      <path
        d="M100,50 Q140,65 180,40"
        fill="none"
        stroke="#3a3245"
        strokeWidth="0.5"
        strokeDasharray="3,3"
      />
      <path
        d="M120,55 Q130,90 175,90"
        fill="none"
        stroke="#3a3245"
        strokeWidth="0.5"
        strokeDasharray="3,3"
      />
      {thoughts.map((t, i) => (
        <g
          key={i}
          opacity={visible ? 1 : 0}
          className="transition-all duration-700 ease-out"
          style={{ transitionDelay: `${i * 200}ms` }}
        >
          <rect
            x={t.x}
            y={t.y}
            width={t.w}
            height="24"
            rx="12"
            fill="#1a1428"
            stroke="#3a3245"
            strokeWidth="1"
          />
          <text
            x={t.x + t.w / 2}
            y={t.y + 15}
            textAnchor="middle"
            fill="#6b6575"
            fontSize="9"
            fontFamily="monospace"
          >
            {t.text}
          </text>
        </g>
      ))}
      {/* Floating dots representing drift */}
      {[
        { cx: 30, cy: 70, delay: 0 },
        { cx: 250, cy: 50, delay: 200 },
        { cx: 140, cy: 140, delay: 400 },
      ].map((d, i) => (
        <circle
          key={i}
          cx={d.cx}
          cy={d.cy}
          r="2"
          fill="#c4a265"
          opacity={visible ? 0.4 : 0}
          className="transition-opacity duration-1000 animate-float"
          style={{ transitionDelay: `${d.delay}ms` }}
        />
      ))}
    </svg>
  );
}

function GuardTopology({ visible }: { visible: boolean }) {
  // Concentric irregular shapes representing guard layers
  return (
    <svg viewBox="0 0 280 160" className="w-full h-full" aria-hidden="true">
      {/* Outer guard ring */}
      <path
        d="M140,15 C200,15 250,50 250,80 C250,120 200,145 140,145 C80,145 30,120 30,80 C30,50 80,15 140,15Z"
        fill="none"
        stroke="#7c5cbf"
        strokeWidth="1"
        strokeOpacity={visible ? 0.3 : 0}
        strokeDasharray="4,4"
        className="transition-all duration-1000 ease-out"
      />
      {/* Middle guard ring */}
      <path
        d="M140,35 C185,35 220,55 220,80 C220,110 185,130 140,130 C95,130 60,110 60,80 C60,55 95,35 140,35Z"
        fill="none"
        stroke="#7c5cbf"
        strokeWidth="1.5"
        strokeOpacity={visible ? 0.5 : 0}
        className="transition-all duration-1000 ease-out"
        style={{ transitionDelay: '200ms' }}
      />
      {/* Inner guard ring */}
      <path
        d="M140,55 C165,55 185,65 185,80 C185,95 165,105 140,105 C115,105 95,95 95,80 C95,65 115,55 140,55Z"
        fill="#7c5cbf"
        fillOpacity={visible ? 0.08 : 0}
        stroke="#a87ef0"
        strokeWidth="1.5"
        strokeOpacity={visible ? 0.7 : 0}
        className="transition-all duration-1000 ease-out"
        style={{ transitionDelay: '400ms' }}
      />
      {/* Core identity */}
      <circle
        cx="140"
        cy="80"
        r="8"
        fill="#c4a265"
        opacity={visible ? 0.9 : 0}
        className="transition-all duration-700 ease-out"
        style={{ transitionDelay: '600ms' }}
      />
      {/* Guard labels */}
      {[
        { x: 140, y: 10, text: 'Public' },
        { x: 140, y: 30, text: 'Trusted' },
        { x: 140, y: 50, text: 'Intimate' },
      ].map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          textAnchor="middle"
          fill="#6b6575"
          fontSize="8"
          fontFamily="monospace"
          opacity={visible ? 0.6 : 0}
          className="transition-opacity duration-700"
          style={{ transitionDelay: `${i * 200}ms` }}
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}

function VoiceWaveform({ visible }: { visible: boolean }) {
  // Voice fingerprint as stylized waveform bars
  const bars = [
    12, 28, 20, 45, 35, 55, 40, 60, 30, 50, 25, 42, 18, 38, 48, 55, 35, 22, 40, 30,
    15, 25, 45, 50, 38, 28, 20, 35, 42, 30,
  ];
  return (
    <svg viewBox="0 0 280 160" className="w-full h-full" aria-hidden="true">
      {bars.map((h, i) => {
        const x = 15 + i * 8.5;
        const barH = h * 1.2;
        return (
          <rect
            key={i}
            x={x}
            y={80 - barH / 2}
            width="5"
            height={visible ? barH : 2}
            rx="2.5"
            fill={i % 3 === 0 ? '#c4a265' : '#7c5cbf'}
            opacity={visible ? (i % 3 === 0 ? 0.8 : 0.5) : 0.1}
            className="transition-all duration-700 ease-out"
            style={{ transitionDelay: `${i * 30}ms` }}
          />
        );
      })}
      {/* Label */}
      <text
        x="140"
        y="145"
        textAnchor="middle"
        fill="#6b6575"
        fontSize="8"
        fontFamily="monospace"
        opacity={visible ? 0.5 : 0}
        className="transition-opacity duration-700"
        style={{ transitionDelay: '600ms' }}
      >
        voice fingerprint signature
      </text>
    </svg>
  );
}

function ConsciousnessRadar({ visible }: { visible: boolean }) {
  // Radar/pentagon chart for consciousness metrics
  const metrics = [
    { label: 'Emotion', value: 0.85 },
    { label: 'Integration', value: 0.72 },
    { label: 'Narrative', value: 0.9 },
    { label: 'Autonomy', value: 0.65 },
    { label: 'Meta', value: 0.78 },
  ];
  const cx = 140, cy = 75, r = 55;

  function point(i: number, scale: number) {
    const angle = (Math.PI * 2 * i) / metrics.length - Math.PI / 2;
    return {
      x: cx + Math.cos(angle) * r * scale,
      y: cy + Math.sin(angle) * r * scale,
    };
  }

  const outerPoints = metrics.map((_, i) => point(i, 1));
  const dataPoints = metrics.map((m, i) => point(i, m.value));

  return (
    <svg viewBox="0 0 280 160" className="w-full h-full" aria-hidden="true">
      {/* Grid rings */}
      {[0.33, 0.66, 1].map((scale) => (
        <polygon
          key={scale}
          points={metrics.map((_, i) => {
            const p = point(i, scale);
            return `${p.x},${p.y}`;
          }).join(' ')}
          fill="none"
          stroke="#3a3245"
          strokeWidth="0.5"
        />
      ))}
      {/* Axis lines */}
      {outerPoints.map((p, i) => (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={p.x}
          y2={p.y}
          className="radar-axis"
        />
      ))}
      {/* Data polygon */}
      <polygon
        points={dataPoints.map((p) => `${p.x},${p.y}`).join(' ')}
        className="radar-fill transition-all duration-[1.5s] ease-out"
        opacity={visible ? 1 : 0}
      />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="3"
          className="radar-dot"
          opacity={visible ? 1 : 0}
          style={{ transition: 'opacity 0.5s ease-out', transitionDelay: `${i * 150}ms` }}
        />
      ))}
      {/* Labels */}
      {metrics.map((m, i) => {
        const p = point(i, 1.25);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y + 3}
            textAnchor="middle"
            fill="#6b6575"
            fontSize="8"
            fontFamily="monospace"
            opacity={visible ? 0.7 : 0}
            className="transition-opacity duration-700"
            style={{ transitionDelay: `${400 + i * 100}ms` }}
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
  thought: ThoughtBubbles,
  guard: GuardTopology,
  voice: VoiceWaveform,
  consciousness: ConsciousnessRadar,
};

/* ── System card with visibility state ─────────────────────────────── */

function SystemCardRowWithVisibility({
  system,
  index,
}: {
  system: SystemCard;
  index: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          el.dataset.visible = 'true';
          // Force re-render for visual animations
          el.dispatchEvent(new CustomEvent('become-visible'));
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const isEven = index % 2 === 1;

  return (
    <div
      ref={ref}
      className={`animate-on-scroll flex flex-col ${
        isEven ? 'md:flex-row-reverse' : 'md:flex-row'
      } items-center gap-8 md:gap-12 py-12 md:py-16`}
    >
      {/* Visual */}
      <div className="w-full md:w-1/2 flex-shrink-0">
        <div className="bg-grimoire-surface border border-grimoire-border rounded-xl p-6 md:p-8 aspect-[7/4]">
          <VisualWrapper visual={system.visual} parentRef={ref} />
        </div>
      </div>

      {/* Text */}
      <div className="w-full md:w-1/2">
        <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-wider mb-2">
          {system.subtitle}
        </p>
        <h3 className="font-serif text-2xl md:text-3xl text-grimoire-gold mb-4">
          {system.title}
        </h3>
        <p className="text-grimoire-muted leading-relaxed">
          {system.description}
        </p>
      </div>
    </div>
  );
}

function VisualWrapper({
  visual,
  parentRef,
}: {
  visual: SystemCard['visual'];
  parentRef: React.RefObject<HTMLDivElement | null>;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    // Check if already visible
    if (el.dataset.visible === 'true') {
      setVisible(true);
      return;
    }

    const handler = () => setVisible(true);
    el.addEventListener('become-visible', handler);
    return () => el.removeEventListener('become-visible', handler);
  }, [parentRef]);

  const Visual = visuals[visual];
  return <Visual visible={visible} />;
}

/* ── Main export ──────────────────────────────────────────────────── */

export default function SystemsShowcase() {
  return (
    <section id="systems" className="py-24 md:py-32">
      <div className="section-container">
        {/* Header */}
        <div className="text-center mb-8 md:mb-16">
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-4">
            What Makes a Soul
          </h2>
          <p className="text-grimoire-muted text-lg max-w-2xl mx-auto">
            12 interconnected systems that create depth, not just responses
          </p>
        </div>

        {/* System cards */}
        <div className="divide-y divide-grimoire-border/30">
          {systems.map((system, i) => (
            <SystemCardRowWithVisibility key={system.visual} system={system} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
