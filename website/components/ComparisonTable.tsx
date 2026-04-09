'use client';

import { useEffect, useRef } from 'react';

const columns = ['Feature', 'Grimoire', 'mem0', 'Letta', 'SillyTavern'] as const;

type CellValue = true | false | 'partial' | 'native';

interface Row {
  feature: string;
  values: [CellValue, CellValue, CellValue, CellValue];
}

const rows: Row[] = [
  { feature: 'Persistent Memory', values: [true, true, true, false] },
  { feature: 'Knowledge Graph', values: [true, false, false, false] },
  { feature: 'Trust Physics', values: [true, false, false, false] },
  { feature: 'Autonomous Thought', values: [true, false, false, false] },
  { feature: 'Guard Topology', values: [true, false, false, false] },
  { feature: 'Voice Fingerprint', values: [true, false, false, false] },
  { feature: 'Consciousness Metrics', values: [true, false, false, false] },
  { feature: 'Cross-Model Portable', values: [true, false, false, 'partial'] },
];

/* SVG icons for consistent cross-platform rendering */
function CheckIcon() {
  return (
    <svg className="w-5 h-5 mx-auto text-grimoire-gold" viewBox="0 0 20 20" fill="none" aria-label="Yes">
      <path d="M5 10l3.5 3.5L15 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg className="w-5 h-5 mx-auto text-grimoire-border-light" viewBox="0 0 20 20" fill="none" aria-label="No">
      <path d="M6 6l8 8M14 6l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function CellContent({ value }: { value: CellValue }) {
  if (value === true) return <CheckIcon />;
  if (value === false) return <CrossIcon />;
  return <span className="text-grimoire-text-secondary italic text-sm">{value}</span>;
}

export default function ComparisonTable() {
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
    <section id="compare" className="py-28 md:py-36 px-6 sm:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-mono text-xs text-grimoire-purple-bright uppercase tracking-widest mb-4">Comparison</p>
          <h2 className="font-serif text-4xl md:text-5xl text-grimoire-gold mb-5 leading-tight">
            Not Another Memory Layer
          </h2>
          <p className="text-grimoire-muted max-w-lg mx-auto text-base leading-relaxed">
            The only framework that models trust, thought, and consciousness as first-class systems
          </p>
        </div>

        {/* Table */}
        <div ref={ref} className="animate-on-scroll overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
          <div className="min-w-[600px]">
            <table className="w-full bg-grimoire-surface rounded-2xl border border-grimoire-border overflow-hidden">
              <thead>
                <tr className="bg-grimoire-elevated">
                  {columns.map((col, i) => (
                    <th
                      key={col}
                      className={`font-mono text-sm py-4 px-5 font-medium ${
                        i === 0
                          ? 'sticky left-0 z-10 bg-grimoire-elevated text-left text-grimoire-text-secondary min-w-[160px]'
                          : 'text-center min-w-[100px]'
                      } ${i === 1 ? 'text-grimoire-gold bg-grimoire-purple/[0.06]' : 'text-grimoire-text-secondary'}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr
                    key={row.feature}
                    className="border-t border-grimoire-border/40 transition-colors duration-150 hover:bg-grimoire-elevated/60"
                  >
                    <td className="sticky left-0 z-10 bg-grimoire-surface py-3.5 px-5 text-sm text-grimoire-text font-medium whitespace-nowrap">
                      {row.feature}
                    </td>
                    {row.values.map((val, colIdx) => (
                      <td
                        key={colIdx}
                        className={`py-3.5 px-5 text-center ${colIdx === 0 ? 'bg-grimoire-purple/[0.06]' : ''}`}
                      >
                        <CellContent value={val} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
