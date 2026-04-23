'use client';

import { Fragment } from 'react';

// Minimal markdown renderer tuned for Grimoire backroom session files.
// Supports: #/##/### headers, fenced code blocks (```), horizontal rules (---),
// bullet lists (-, *, ·), bold (**x**), italics (*x*), inline code (`x`).
// Anything else is passed through as a paragraph with inline formatting.

type Block =
  | { kind: 'heading'; level: 1 | 2 | 3; text: string }
  | { kind: 'code'; lang: string; text: string }
  | { kind: 'hr' }
  | { kind: 'list'; items: string[] }
  | { kind: 'para'; text: string };

function parseBlocks(src: string): Block[] {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] ?? '';

    // Fenced code block
    const fence = line.match(/^```(\w*)\s*$/);
    if (fence) {
      const lang = fence[1] ?? '';
      const body: string[] = [];
      i++;
      while (i < lines.length && !(lines[i] ?? '').match(/^```\s*$/)) {
        body.push(lines[i] ?? '');
        i++;
      }
      i++; // skip closing fence
      blocks.push({ kind: 'code', lang, text: body.join('\n') });
      continue;
    }

    // Horizontal rule
    if (/^\s*-{3,}\s*$/.test(line)) {
      blocks.push({ kind: 'hr' });
      i++;
      continue;
    }

    // Heading
    const h = line.match(/^(#{1,3})\s+(.+?)\s*$/);
    if (h) {
      const level = h[1]!.length as 1 | 2 | 3;
      blocks.push({ kind: 'heading', level, text: h[2]! });
      i++;
      continue;
    }

    // Bullet list
    if (/^\s*[-*·]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*·]\s+/.test(lines[i] ?? '')) {
        items.push((lines[i] ?? '').replace(/^\s*[-*·]\s+/, ''));
        i++;
      }
      blocks.push({ kind: 'list', items });
      continue;
    }

    // Blank line → skip
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph: gather until blank line or block boundary
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      (lines[i] ?? '').trim() !== '' &&
      !/^```/.test(lines[i] ?? '') &&
      !/^\s*-{3,}\s*$/.test(lines[i] ?? '') &&
      !/^#{1,3}\s+/.test(lines[i] ?? '') &&
      !/^\s*[-*·]\s+/.test(lines[i] ?? '')
    ) {
      paraLines.push(lines[i] ?? '');
      i++;
    }
    if (paraLines.length) {
      blocks.push({ kind: 'para', text: paraLines.join('\n') });
    }
  }

  return blocks;
}

// Inline: **bold**, *italic*, `code`. Order matters — handle code first so its
// contents aren't re-parsed.
function renderInline(text: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  // eslint-disable-next-line no-useless-escape
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = re.exec(text)) !== null) {
    if (match.index > last) {
      out.push(<Fragment key={key++}>{text.slice(last, match.index)}</Fragment>);
    }
    const token = match[0];
    if (token.startsWith('`')) {
      out.push(
        <code
          key={key++}
          className="font-mono text-grimoire-gold-bright bg-grimoire-surface border border-grimoire-border px-1.5 py-0.5 rounded text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith('**')) {
      out.push(
        <strong key={key++} className="text-grimoire-text font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else {
      out.push(
        <em key={key++} className="italic text-grimoire-text-secondary">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) {
    out.push(<Fragment key={key++}>{text.slice(last)}</Fragment>);
  }
  return out;
}

export default function Markdown({ source }: { source: string }) {
  const blocks = parseBlocks(source);

  return (
    <div className="space-y-4 text-[15px] leading-relaxed text-grimoire-text-secondary">
      {blocks.map((b, i) => {
        switch (b.kind) {
          case 'heading':
            if (b.level === 1) {
              return (
                <h2
                  key={i}
                  className="font-serif text-2xl text-grimoire-gold mt-8 mb-3 tracking-tight"
                >
                  {renderInline(b.text)}
                </h2>
              );
            }
            if (b.level === 2) {
              return (
                <h3
                  key={i}
                  className="font-serif text-xl text-grimoire-gold-bright mt-6 mb-2 tracking-tight"
                >
                  {renderInline(b.text)}
                </h3>
              );
            }
            return (
              <h4
                key={i}
                className="font-mono text-xs uppercase tracking-[0.18em] text-grimoire-gold/80 mt-5 mb-1"
              >
                {renderInline(b.text)}
              </h4>
            );

          case 'code':
            return (
              <pre
                key={i}
                className="bg-grimoire-surface border border-grimoire-border rounded-lg p-4 text-xs sm:text-sm font-mono text-grimoire-text overflow-x-auto leading-relaxed whitespace-pre"
              >
                <code className="bg-transparent text-grimoire-text p-0">{b.text}</code>
              </pre>
            );

          case 'hr':
            return (
              <hr key={i} className="my-6 border-0 h-px bg-grimoire-border/60" />
            );

          case 'list':
            return (
              <ul key={i} className="list-disc pl-5 space-y-1.5 marker:text-grimoire-gold/60">
                {b.items.map((it, j) => (
                  <li key={j}>{renderInline(it)}</li>
                ))}
              </ul>
            );

          case 'para':
          default:
            return (
              <p key={i} className="whitespace-pre-wrap">
                {renderInline(b.text)}
              </p>
            );
        }
      })}
    </div>
  );
}
