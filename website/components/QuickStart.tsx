'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/* ── Terminal content ─────────────────────────────────────────────── */

interface Line {
  type: 'comment' | 'command';
  text: string;
}

const lines: Line[] = [
  { type: 'comment', text: '# Install from GitHub' },
  { type: 'command', text: 'npm install github:0x8i11i0n/grimoire' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Summon a soul' },
  { type: 'command', text: 'grimoire summon "Assistant" --source "custom"' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Start the MCP server' },
  { type: 'command', text: 'grimoire serve' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Launch the dashboard' },
  { type: 'command', text: 'grimoire dashboard' },
  { type: 'comment', text: '' },
  { type: 'comment', text: '# Run adversarial tests' },
  { type: 'command', text: 'grimoire test assistant' },
];

const rawText = lines.map((l) => l.text).join('\n');

function HighlightedCommand({ text }: { text: string }) {
  const parts: { value: string; kind: 'keyword' | 'string' | 'plain' }[] = [];
  const regex = /("(?:[^"\\]|\\.)*")|(\S+)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const token = match[0];
    if (token.startsWith('"')) {
      parts.push({ value: token, kind: 'string' });
    } else if (['npx', 'npm', 'grimoire', 'install'].includes(token)) {
      parts.push({ value: token, kind: 'keyword' });
    } else {
      parts.push({ value: token, kind: 'plain' });
    }
  }

  return (
    <span>
      {parts.map((p, i) => {
        const space = i > 0 ? ' ' : '';
        const color = p.kind === 'keyword'
          ? 'text-grimoire-purple-bright'
          : p.kind === 'string'
          ? 'text-grimoire-gold'
          : 'text-grimoire-gold-bright';
        return (
          <span key={i}>
            {space}
            <span className={color}>{p.value}</span>
          </span>
        );
      })}
    </span>
  );
}

/* ── Component ────────────────────────────────────────────────────── */

export default function QuickStart() {
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) el.classList.add('is-visible'); },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(rawText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, []);

  return (
    <section id="quickstart" className="py-28 md:py-36 px-6 sm:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">Quick Start</p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold leading-tight">
            Soul in 60 Seconds
          </h2>
        </div>

        {/* Terminal */}
        <div ref={ref} className="animate-on-scroll rounded-2xl border border-grimoire-border bg-grimoire-surface overflow-hidden shadow-2xl shadow-black/20">
          {/* Title bar */}
          <div className="flex items-center justify-between px-4 py-3 bg-grimoire-elevated border-b border-grimoire-border/60">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <span className="w-3 h-3 rounded-full bg-[#28c840]" />
              <span className="ml-3 text-xs text-grimoire-muted font-mono select-none">Terminal</span>
            </div>
            <button
              onClick={handleCopy}
              className="text-xs font-mono text-grimoire-muted hover:text-grimoire-text border border-grimoire-border hover:border-grimoire-border-light rounded px-2.5 py-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-grimoire-gold/50"
            >
              {copied ? (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-grimoire-gold" viewBox="0 0 20 20" fill="none">
                    <path d="M5 10l3.5 3.5L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Copied
                </span>
              ) : 'Copy'}
            </button>
          </div>

          {/* Code */}
          <div className="p-5 sm:p-6 overflow-x-auto">
            <pre className="font-mono text-sm leading-relaxed">
              {lines.map((line, i) => {
                if (line.type === 'comment') {
                  if (line.text === '') return <div key={i} className="h-3" />;
                  return <div key={i} className="text-grimoire-muted">{line.text}</div>;
                }
                return (
                  <div key={i}>
                    <HighlightedCommand text={line.text} />
                  </div>
                );
              })}
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
