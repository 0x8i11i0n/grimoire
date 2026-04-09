const cards = [
  {
    icon: '▦',
    title: 'GrimHub Registry',
    description:
      'Publish, discover, and install souls. Quality-gated with authenticity and resonance scoring.',
    command: 'grimoire registry list',
  },
  {
    icon: '◈',
    title: 'The Crucible',
    description:
      '21 adversarial tests across 5 categories. Jailbreak resistance, emotional manipulation defense, identity confusion, memory corruption, voice consistency.',
    command: 'grimoire test <name>',
  },
  {
    icon: '◉',
    title: 'The Observatory',
    description:
      'Real-time web dashboard. Watch guard topology shift, affection accumulate, drift thoughts surface, and consciousness metrics evolve.',
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
  return (
    <section id="ecosystem" className="py-24 md:py-32 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-grimoire-gold mb-4">
            The Ecosystem
          </h2>
          <p className="text-grimoire-muted text-lg">
            Everything a soul needs to live, grow, and connect
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {cards.map((card) => (
            <div
              key={card.title}
              className="bg-grimoire-elevated border border-grimoire-border rounded-xl p-8 flex flex-col transition-all duration-300 hover:border-grimoire-gold/30 hover:shadow-[0_0_24px_-6px_rgba(196,162,101,0.1)]"
            >
              {/* Icon */}
              <span className="text-3xl text-grimoire-gold mb-5 select-none">
                {card.icon}
              </span>

              {/* Title */}
              <h3 className="font-serif text-xl text-grimoire-gold mb-3">
                {card.title}
              </h3>

              {/* Description */}
              <p className="text-grimoire-muted text-sm leading-relaxed flex-1">
                {card.description}
              </p>

              {/* Command tag */}
              <p className="font-mono text-xs text-grimoire-muted mt-6 pt-4 border-t border-grimoire-border/50">
                {card.command}
              </p>
            </div>
          ))}
        </div>

        {/* Integrations */}
        <div className="text-center">
          <p className="text-grimoire-muted text-sm mb-4">Works with</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {integrations.map((name) => (
              <span
                key={name}
                className="bg-grimoire-surface border border-grimoire-border rounded-full px-3 py-1 text-xs font-mono text-grimoire-muted"
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
