'use client';

import { useState, useCallback } from 'react';

/* ── Terminal line data ────────────────────────────────────────────── */

interface Line {
  type: 'comment' | 'command';
  text: string;
}

const lines: Line[] = [
  { type: 'comment', text: '# Summon a soul' },
  { type: 'command', text: 'npx grimoire summon "Makima" --source "Chainsaw Man"' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Edit the persona files' },
  { type: 'command', text: 'vim Grimhub/souls/makima/makima-soul/full.md' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Start the MCP server (works with Claude, Cursor, etc.)' },
  { type: 'command', text: 'npx grimoire serve' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Launch the web dashboard' },
  { type: 'command', text: 'npx grimoire dashboard' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Run adversarial tests' },
  { type: 'command', text: 'npx grimoire test makima' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Trigger a drift cycle' },
  { type: 'command', text: 'npx grimoire drift makima' },
];

const rawText = `# Summon a soul
npx grimoire summon "Makima" --source "Chainsaw Man"

# Edit the persona files
vim Grimhub/souls/makima/makima-soul/full.md

# Start the MCP server (works with Claude, Cursor, etc.)
npx grimoire serve

# Launch the web dashboard
npx grimoire dashboard

# Run adversarial tests
npx grimoire test makima

# Trigger a drift cycle
npx grimoire drift makima`;

/* ── Syntax-highlighted command ────────────────────────────────────── */

function HighlightedCommand({ text }: { text: string }) {
  // Tokenise: pull out quoted strings, then highlight npx/grimoire keywords
  const parts: { value: string; kind: 'keyword' | 'string' | 'plain' }[] = [];
  const regex = /("(?:[^"\\]|\\.)*")|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    if (token.startsWith('"')) {
      parts.push({ value: token, kind: 'string' });
    } else if (token === 'npx' || token === 'grimoire') {
      parts.push({ value: token, kind: 'keyword' });
    } else {
      parts.push({ value: token, kind: 'plain' });
    }
  }

  return (
    <span>
      {parts.map((p, i) => {
        const space = i > 0 ? ' ' : '';
        switch (p.kind) {
          case 'keyword':
            return (
              <span key={i}>
                {space}
                <span className="text-grimoire-purple-bright">{p.value}</span>
              </span>
            );
          case 'string':
            return (
              <span key={i}>
                {space}
                <span className="text-grimoire-gold">{p.value}</span>
              </span>
            );
          default:
            return (
              <span key={i}>
                {space}
                <span className="text-grimoire-gold-bright">{p.value}</span>
              </span>
            );
        }
      })}
    </span>
  );
}

/* ── Feature cards ─────────────────────────────────────────────────── */

interface FeatureCard {
  icon: string;
  title: string;
  description: string;
}

const features: FeatureCard[] = [
  {
    icon: '\u25C8',
    title: 'MCP Ready',
    description:
      '15 tools. Works with Claude Code, Cursor, Windsurf, and any MCP client.',
  },
  {
    icon: '\u25C7',
    title: 'Cross-Model',
    description:
      'Claude, GPT, Ollama, OpenRouter. One soul, any model.',
  },
  {
    icon: '\u25C6',
    title: 'Battle-Tested',
    description:
      '21 adversarial tests across jailbreak, manipulation, identity, memory, and voice.',
  },
];

/* ── Component ─────────────────────────────────────────────────────── */

export default function QuickStart() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <section id="quickstart" className="py-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-grimoire-gold">
            Soul in 60 Seconds
          </h2>
        </div>

        {/* Terminal window */}
        <div className="relative rounded-xl border border-grimoire-border bg-grimoire-surface overflow-hidden">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-grimoire-elevated border-b border-grimoire-border/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs text-grimoire-muted font-mono select-none">
                Terminal
              </span>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopy}
              className="text-xs font-mono text-grimoire-muted hover:text-grimoire-text border border-grimoire-border hover:border-grimoire-border-light rounded px-2.5 py-1 transition-colors duration-200"
            >
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>

          {/* Code area */}
          <div className="p-5 sm:p-6 overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed">
              {lines.map((line, i) => {
                if (line.type === 'comment') {
                  if (line.text === '') {
                    return <div key={i} className="h-3" />;
                  }
                  return (
                    <div key={i} className="text-grimoire-muted">
                      {line.text}
                    </div>
                  );
                }
                return (
                  <div key={i} className="text-grimoire-gold-bright">
                    <HighlightedCommand text={line.text} />
                  </div>
                );
              })}
            </pre>
          </div>
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-grimoire-border bg-grimoire-card p-6 transition-colors duration-200 hover:border-grimoire-border-light"
            >
              <div className="text-2xl text-grimoire-purple-bright mb-3 select-none">
                {f.icon}
              </div>
              <h3 className="font-mono text-sm text-grimoire-gold-bright mb-2">
                {f.title}
              </h3>
              <p className="text-sm text-grimoire-muted leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
