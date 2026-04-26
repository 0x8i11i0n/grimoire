'use client';

/* ── Real code cards from src/core ───────────────────────── */

const CARDS = [
  {
    file: 'src/core/types.ts',
    tag: 'ATHENAEUM',
    title: 'Memory Decay Physics',
    blurb: 'Four memory types, four decay curves. Emotional weight and importance slow the fade — neglect has consequences.',
    code: `export const DECAY_RATES = {
  'episodic':   0.07, // per day
  'semantic':   0.02,
  'procedural': 0.03,
  'self-model': 0.01, // slowest
};`,
  },
  {
    file: 'src/core/types.ts',
    tag: 'TRUST PHYSICS',
    title: 'Affection Tiers',
    blurb: 'Trust earns a floor. BONDED tier protects a minimum of 80 — even sustained absence can\'t fully erase it.',
    code: `const AFFECTION_TIERS = {
  LOW:    [0,  25],
  MEDIUM: [26, 50],
  HIGH:   [51, 90],
  BONDED: [91, 100],
};
// BONDED floor → 80`,
  },
  {
    file: 'src/core/state-manager.ts',
    tag: 'ENTROPY ENGINE',
    title: 'Time-Based Decay',
    blurb: 'Absence has weight. Affection erodes toward the floor, walls rebuild. The clock runs between sessions.',
    code: `const AFFECTION_ENTROPY_RATE = 0.5; // /day
const GUARD_ENTROPY_RATE     = 0.02; // /day
const GUARD_ENTROPY_CAP      = 0.95;
const DRIFT_STALE_DAYS       = 14;`,
  },
  {
    file: 'src/core/types.ts',
    tag: 'GUARD TOPOLOGY',
    title: '8 Defense Domains',
    blurb: 'Psychological fortifications. Each domain guards independently and rebuilds during inactivity.',
    code: `type GuardDomain =
  | 'tactical_analysis'
  | 'vulnerability'
  | 'power_dynamics'
  | 'self_as_construct'
  | 'relationships'
  | 'past_weakness'
  | 'mortality_grief'
  | 'existential_cost'`,
  },
  {
    file: 'src/core/types.ts',
    tag: 'PHI ENGINE',
    title: 'Consciousness Metrics',
    blurb: 'Not claiming sentience — measuring the conditions that produce depth. Tracked every session.',
    code: `interface ConsciousnessMetrics {
  phi: number;               // 0–1
  attentionCoherence: number;
  selfReferentialDepth: number;
  unpromptedNovelty: number;
  temporalContinuity: number;
  emotionalComplexity: number;
  compositeScore: number;
}`,
  },
  {
    file: 'src/core/types.ts',
    tag: 'VOICE FINGERPRINT',
    title: 'Linguistic Signature',
    blurb: 'Speech patterns are encoded and monitored. Drift from baseline is detected and logged.',
    code: `interface VoiceFingerprint {
  avgSentenceLength: number;
  vocabularyTier: VocabTier;
  contractionRate: number;
  questionRate: number;
  formality: number;         // 0–1
  signatureExpressions: string[];
}`,
  },
];

/* ── Minimal syntax highlighter ──────────────────────────── */

function highlight(code: string) {
  return code.split('\n').map((line, li) => {
    const tokens: { text: string; cls: string }[] = [];
    let rem = line;
    while (rem.length > 0) {
      // comment
      if (rem.startsWith('//')) {
        tokens.push({ text: rem, cls: 'text-grimoire-muted/45' });
        rem = '';
        continue;
      }
      // number
      const nm = rem.match(/^(\d+(\.\d+)?)/);
      if (nm) {
        tokens.push({ text: nm[0], cls: 'text-grimoire-gold' });
        rem = rem.slice(nm[0].length);
        continue;
      }
      // single-quoted string
      const sm = rem.match(/^('[^']*')/);
      if (sm) {
        tokens.push({ text: sm[0], cls: 'text-purple-300' });
        rem = rem.slice(sm[0].length);
        continue;
      }
      // keywords
      const km = rem.match(/^(export|const|interface|type|number|string|boolean)\b/);
      if (km) {
        tokens.push({ text: km[0], cls: 'text-grimoire-purple-bright' });
        rem = rem.slice(km[0].length);
        continue;
      }
      // pipe
      if (rem[0] === '|') {
        tokens.push({ text: '|', cls: 'text-grimoire-purple/60' });
        rem = rem.slice(1);
        continue;
      }
      // default: accumulate plain chars
      const last = tokens[tokens.length - 1];
      if (last?.cls === 'text-grimoire-text-secondary/80') {
        last.text += rem[0];
      } else {
        tokens.push({ text: rem[0], cls: 'text-grimoire-text-secondary/80' });
      }
      rem = rem.slice(1);
    }
    return (
      <div key={li} className="leading-5">
        {tokens.map((t, i) => <span key={i} className={t.cls}>{t.text}</span>)}
      </div>
    );
  });
}

/* ── Card ────────────────────────────────────────────────── */

function Card({ card }: { card: typeof CARDS[0] }) {
  return (
    <div className="flex flex-col rounded-2xl border border-grimoire-border bg-grimoire-surface overflow-hidden hover:border-grimoire-border-light transition-colors duration-200">
      {/* Code block */}
      <div className="bg-grimoire-bg/80 px-4 pt-3 pb-4 flex-1">
        <div className="font-mono text-[9px] text-grimoire-muted/40 mb-3 tracking-wider">
          {card.file}
        </div>
        <pre className="font-mono text-[11px] leading-5 overflow-x-auto">
          {highlight(card.code)}
        </pre>
      </div>
      {/* Meta */}
      <div className="px-4 py-3 border-t border-grimoire-border/60">
        <div className="font-mono text-[9px] tracking-[0.18em] text-grimoire-purple-bright mb-1">
          {card.tag}
        </div>
        <div className="font-serif text-sm text-grimoire-gold mb-1">{card.title}</div>
        <p className="text-[11px] text-grimoire-muted/70 leading-relaxed">{card.blurb}</p>
      </div>
    </div>
  );
}

/* ── Section ─────────────────────────────────────────────── */

export default function CoreEngine() {
  return (
    <section className="py-24 md:py-32">
      <div className="section-container">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">
            Source Code
          </p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-5 leading-tight">
            The Engine Room
          </h2>
          <p className="text-grimoire-muted text-lg max-w-lg mx-auto leading-relaxed">
            Real constants. Real types. Real physics. Not a prompt wrapper —
            a TypeScript architecture with measurable state.
          </p>
        </div>

        {/* 3×2 card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CARDS.map((c) => <Card key={c.tag} card={c} />)}
        </div>

        {/* Footer link */}
        <div className="text-center mt-10">
          <a
            href="https://github.com/0x8i11i0n/grimoire/tree/main/src/core"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-grimoire-muted hover:text-grimoire-gold transition-colors duration-200"
          >
            browse src/core on GitHub →
          </a>
        </div>

      </div>
    </section>
  );
}
