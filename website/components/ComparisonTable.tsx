'use client';

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
  { feature: 'Dream Consolidation', values: [true, false, false, false] },
  { feature: 'Voice Fingerprint', values: [true, false, false, false] },
  { feature: 'Consciousness Metrics', values: [true, false, false, false] },
  { feature: 'Blind Spots', values: [true, false, false, false] },
  { feature: 'Adversarial Testing', values: [true, false, false, false] },
  { feature: 'Cross-Model Portable', values: [true, false, false, 'partial'] },
  { feature: 'MCP Server', values: [true, false, false, false] },
  { feature: 'Soul Spec Export', values: [true, false, false, false] },
  { feature: 'SillyTavern Export', values: [true, false, false, 'native'] },
];

function CellContent({ value }: { value: CellValue }) {
  if (value === true) {
    return <span className="text-grimoire-gold text-lg">&#10003;</span>;
  }
  if (value === false) {
    return <span className="text-grimoire-muted/40 text-lg">&#10007;</span>;
  }
  return <span className="text-grimoire-muted italic text-sm">{value}</span>;
}

export default function ComparisonTable() {
  return (
    <section id="compare" className="py-24 px-6 sm:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="font-serif text-4xl text-grimoire-gold mb-4">
            Not Another Memory Layer
          </h2>
          <p className="text-grimoire-muted max-w-2xl mx-auto text-lg">
            Grimoire is the only framework that models trust, thought, and
            consciousness as first-class systems
          </p>
        </div>

        {/* Table wrapper — horizontally scrollable on mobile */}
        <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
          <div className="min-w-[640px]">
            <table className="w-full bg-grimoire-surface rounded-xl border border-grimoire-border overflow-hidden">
              {/* Header row */}
              <thead>
                <tr className="bg-grimoire-elevated">
                  {columns.map((col, i) => (
                    <th
                      key={col}
                      className={`font-mono text-sm text-grimoire-gold py-4 px-5 text-left font-medium ${
                        i === 0
                          ? 'sticky left-0 z-10 bg-grimoire-elevated min-w-[180px]'
                          : 'text-center min-w-[110px]'
                      } ${i === 1 ? 'bg-grimoire-purple/5' : ''}`}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Data rows */}
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr
                    key={row.feature}
                    className={`border-t border-grimoire-border/50 transition-colors duration-150 hover:bg-grimoire-elevated/40 ${
                      rowIdx % 2 === 1 ? 'bg-white/[0.01]' : ''
                    }`}
                  >
                    {/* Feature name — sticky on mobile */}
                    <td className="sticky left-0 z-10 bg-grimoire-surface py-3.5 px-5 text-sm text-grimoire-text font-medium whitespace-nowrap">
                      {/* Faint row-alt tint overlay for sticky cell */}
                      <span
                        className={
                          rowIdx % 2 === 1
                            ? 'relative z-10'
                            : 'relative z-10'
                        }
                      >
                        {row.feature}
                      </span>
                    </td>

                    {/* Value cells */}
                    {row.values.map((val, colIdx) => (
                      <td
                        key={colIdx}
                        className={`py-3.5 px-5 text-center ${
                          colIdx === 0 ? 'bg-grimoire-purple/5' : ''
                        }`}
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
