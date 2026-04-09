'use client';

import { useEffect, useRef } from 'react';

/* ── SVG Icons ────────────────────────────────────────────────────── */

function RegistryIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="4" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="4" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="18" y="18" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" opacity="0.4" strokeDasharray="3,2" />
    </svg>
  );
}

function CrucibleIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 4L28 16L16 28L4 16Z" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 10L22 16L16 22L10 16Z" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="16" cy="16" r="2" fill="currentColor" opacity="0.6" />
    </svg>
  );
}

function ObservatoryIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1" opacity="0.5" />
      <circle cx="16" cy="16" r="1.5" fill="currentColor" opacity="0.6" />
      <line x1="16" y1="5" x2="16" y2="9" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="16" y1="23" x2="16" y2="27" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="5" y1="16" x2="9" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="23" y1="16" x2="27" y2="16" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}

const cards = [
  {
    Icon: RegistryIcon,
    title: 'GrimHub Registry',
    description: 'Publish, discover, and install souls. Quality-gated with authenticity scoring.',
    command: 'grimoire registry list',
  },
  {
    Icon: CrucibleIcon,
    title: 'The Crucible',
    description: '21 adversarial tests. Jailbreak, manipulation, identity, memory, voice.',
    command: 'grimoire test <name>',
  },
  {
    Icon: ObservatoryIcon,
    title: 'The Observatory',
    description: 'Real-time dashboard. Watch trust shift, thoughts drift, consciousness evolve.',
    command: 'grimoire dashboard',
  },
] as const;

const integrations = [
  'Claude',
  'GPT',
  'Ollama',
  'OpenRouter',
  'SillyTavern',
  'Any MCP Client',
] as const;

export default function Ecosystem() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('is-visible'); },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="ecosystem" className="py-28 md:py-36 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">Ecosystem</p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-5 leading-tight">
            Everything a Soul Needs
          </h2>
        </div>

        {/* Cards */}
        <div ref={ref} className="stagger-children grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-grimoire-elevated border border-grimoire-border rounded-2xl p-8 flex flex-col transition-all duration-300 hover:border-grimoire-gold/20 hover:shadow-[0_0_30px_-8px_rgba(196,162,101,0.08)]"
            >
              <div className="text-grimoire-gold mb-5">
                <card.Icon />
              </div>
              <h3 className="font-serif text-xl text-grimoire-gold mb-3">{card.title}</h3>
              <p className="text-grimoire-muted text-sm leading-relaxed flex-1">{card.description}</p>
              <p className="font-mono text-xs text-grimoire-text-secondary mt-6 pt-4 border-t border-grimoire-border/40">
                $ {card.command}
              </p>
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div className="text-center">
          <p className="text-grimoire-muted text-sm mb-5">Works with</p>
          <div className="flex flex-wrap items-center justify-center gap-2.5">
            {integrations.map((name) => (
              <span
                key={name}
                className="bg-grimoire-surface border border-grimoire-border rounded-full px-4 py-1.5 text-xs font-mono text-grimoire-text-secondary hover:border-grimoire-border-light transition-colors duration-200"
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
