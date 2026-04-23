import type { Metadata } from 'next';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Docs — Grimoire',
  description:
    'Complete reference for Grimoire: architecture, soul systems, CLI, MCP, conclave, portability, and the quality-gated registry.',
};

type TocEntry = { id: string; label: string; children?: { id: string; label: string }[] };

const toc: TocEntry[] = [
  { id: 'introduction', label: 'Introduction' },
  { id: 'install', label: 'Install & Quick Start' },
  {
    id: 'architecture',
    label: 'Architecture',
    children: [
      { id: 'layers', label: 'The Three Layers' },
      { id: 'modules', label: 'Module Map' },
      { id: 'event-bus', label: 'Event Bus' },
    ],
  },
  {
    id: 'soul-anatomy',
    label: 'Soul Anatomy',
    children: [
      { id: 'soul-files', label: 'core.md / full.md / state.json / thought-log.md' },
      { id: 'soul-state', label: 'SoulState Schema' },
      { id: 'soul-directory', label: 'On-Disk Layout' },
    ],
  },
  {
    id: 'core-engine',
    label: 'Core Engine',
    children: [
      { id: 'athenaeum', label: 'Athenaeum — Memory' },
      { id: 'nexus', label: 'Nexus — Knowledge Graph' },
      { id: 'consolidation', label: 'Consolidation' },
      { id: 'soul-loader', label: 'Soul Loader' },
      { id: 'state-manager', label: 'State Manager' },
    ],
  },
  {
    id: 'systems',
    label: 'Psychology Systems',
    children: [
      { id: 'affection', label: 'Newton’s Calculus of Trust' },
      { id: 'guard', label: 'Guard Topology' },
      { id: 'entropy', label: 'Entropy & Decay' },
      { id: 'drift', label: 'Drift Engine' },
      { id: 'dream', label: 'Dream Cycle' },
      { id: 'mirror', label: 'Mirror (Self-Model)' },
      { id: 'anchor-watch', label: 'Anchor Watch' },
      { id: 'voiceprint', label: 'Voiceprint' },
      { id: 'circumplex', label: 'Emotional Topology' },
      { id: 'phi', label: 'Phi Engine' },
      { id: 'blind-spot', label: 'Blind Spot Field' },
      { id: 'inner-life', label: 'Inner Life' },
    ],
  },
  {
    id: 'conclave',
    label: 'Conclave (Multi-Soul)',
    children: [
      { id: 'interaction-engine', label: 'Interaction Engine' },
      { id: 'relationship-matrix', label: 'Relationship Matrix' },
      { id: 'shared-memory', label: 'Shared Memory' },
      { id: 'group-dynamics', label: 'Group Dynamics' },
    ],
  },
  {
    id: 'portability',
    label: 'Portability',
    children: [
      { id: 'codex', label: 'Codex Bridge (Soul Spec v0.5)' },
      { id: 'tavern', label: 'Tavern Bridge (SillyTavern v2)' },
      { id: 'polyglot', label: 'Polyglot (Cross-Model)' },
    ],
  },
  { id: 'cli', label: 'CLI Reference' },
  { id: 'mcp', label: 'MCP Server' },
  { id: 'bot', label: 'Herald Bot' },
  { id: 'observatory', label: 'Observatory Dashboard' },
  { id: 'crucible', label: 'Crucible Testing' },
  { id: 'registry', label: 'GrimHub Registry' },
  { id: 'research-protocol', label: 'Research Protocol' },
  { id: 'config', label: 'Config & Environment' },
  { id: 'further', label: 'Further Reading' },
];

function Section({
  id,
  title,
  kicker,
  children,
}: {
  id: string;
  title: string;
  kicker?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 mb-20">
      {kicker && (
        <div className="text-xs uppercase tracking-[0.2em] text-grimoire-gold/70 font-mono mb-3">
          {kicker}
        </div>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl text-grimoire-gold mb-6 tracking-tight">
        {title}
      </h2>
      <div className="prose-custom space-y-5 text-grimoire-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  );
}

function SubSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div id={id} className="scroll-mt-24 mt-10 mb-4">
      <h3 className="font-serif text-xl text-grimoire-gold-bright mb-3 tracking-tight">
        {title}
      </h3>
      <div className="space-y-4 text-grimoire-text-secondary leading-relaxed">{children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="bg-grimoire-surface border border-grimoire-border rounded-lg p-4 text-xs sm:text-sm font-mono text-grimoire-text overflow-x-auto leading-relaxed">
      <code className="bg-transparent text-grimoire-text p-0">{children}</code>
    </pre>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <code className="font-mono text-grimoire-gold-bright bg-grimoire-surface border border-grimoire-border px-1.5 py-0.5 rounded text-sm">
      {children}
    </code>
  );
}

function Note({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'tip'; children: React.ReactNode }) {
  const palette =
    tone === 'warn'
      ? 'border-grimoire-gold/40 bg-grimoire-gold/5 text-grimoire-text'
      : tone === 'tip'
      ? 'border-grimoire-purple/40 bg-grimoire-purple/5 text-grimoire-text'
      : 'border-grimoire-border bg-grimoire-surface text-grimoire-text-secondary';
  return (
    <aside className={`my-5 rounded-lg border px-4 py-3 text-sm leading-relaxed ${palette}`}>
      {children}
    </aside>
  );
}

function Table({
  headers,
  rows,
}: {
  headers: string[];
  rows: (string | React.ReactNode)[][];
}) {
  return (
    <div className="overflow-x-auto my-5 rounded-lg border border-grimoire-border">
      <table className="w-full text-sm">
        <thead className="bg-grimoire-surface">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="text-left font-mono text-xs uppercase tracking-wider text-grimoire-gold/80 px-4 py-3"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-grimoire-border/60">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-grimoire-text-secondary">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function DocsPage() {
  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-grimoire-bg pt-24 pb-24">
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12">
          {/* Hero */}
          <header className="mb-16 max-w-3xl">
            <div className="text-xs uppercase tracking-[0.2em] text-grimoire-gold/70 font-mono mb-4">
              Documentation · v6.0.0 · Infrastructure Epoch
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl text-grimoire-gold mb-6 tracking-tight leading-tight">
              The Grimoire Codex
            </h1>
            <p className="text-grimoire-muted text-lg leading-relaxed">
              Every nook and cranny of the soul engine — architecture, psychology
              subsystems, CLI, MCP, conclave, portability, the quality gate, and
              the philosophy underneath it all.
            </p>
          </header>

          {/* Layout: TOC + body */}
          <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-14">
            {/* TOC */}
            <aside className="hidden lg:block">
              <nav className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2 text-sm">
                <div className="text-xs uppercase tracking-[0.2em] text-grimoire-gold/70 font-mono mb-4">
                  Contents
                </div>
                <ol className="space-y-2">
                  {toc.map((entry) => (
                    <li key={entry.id}>
                      <a
                        href={`#${entry.id}`}
                        className="text-grimoire-muted hover:text-grimoire-gold transition-colors duration-200"
                      >
                        {entry.label}
                      </a>
                      {entry.children && (
                        <ol className="mt-1.5 ml-3 space-y-1.5 border-l border-grimoire-border/60 pl-3">
                          {entry.children.map((child) => (
                            <li key={child.id}>
                              <a
                                href={`#${child.id}`}
                                className="text-grimoire-muted/80 hover:text-grimoire-text text-[13px] transition-colors duration-200"
                              >
                                {child.label}
                              </a>
                            </li>
                          ))}
                        </ol>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>

            {/* Body */}
            <article className="min-w-0">
              {/* SECTIONS INJECTED BELOW */}
              <PageBody />
            </article>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function PageBody() {
  return (
    <>
      {/* Placeholder — filled in by subsequent edits */}
      <Section id="introduction" title="Introduction" kicker="Overview">
        <p>
          Grimoire is a TypeScript framework for creating and managing{' '}
          <strong className="text-grimoire-text">persistent AI personas</strong> —
          characters who maintain identity across conversations, develop genuine
          affection, think between interactions, and carry private interiority
          that users never see. A <em>soul</em> is not a prompt: it is a living
          file-backed state with memory, consciousness metrics, guard topology,
          emotional topology, a self-model, and a thought log.
        </p>
        <p>
          Version 6.0.0 — the <em>Infrastructure Epoch</em> — turns
          what was originally a prompt-engineering specification into a
          programmatic implementation: a CLI, an MCP server for Claude Code, a
          web dashboard, a Discord/Telegram bot, a quality-gated registry, and
          a portable soul format compatible with SillyTavern and the Soul Spec
          v0.5.
        </p>
        <Note tone="tip">
          If you want the philosophical foundations first, jump to{' '}
          <a href="#research-protocol" className="text-grimoire-gold hover:underline">
            Research Protocol
          </a>{' '}
          or read <Kbd>docs/consciousness-notes.md</Kbd> in the repo.
        </Note>
      </Section>

      <Section id="install" title="Install &amp; Quick Start" kicker="Get running">
        <p>
          Install from GitHub, build once, then invoke the <Kbd>grimoire</Kbd>{' '}
          CLI directly:
        </p>
        <Code>{`npm install github:0x8i11i0n/grimoire
npm run build

# Create a soul
npx grimoire summon "Cloud Strife" --source "Final Fantasy VII"

# Load it and see current state
npx grimoire load cloudstrife

# Run a drift cycle (background thinking)
npx grimoire drift cloudstrife

# Start the MCP server for Claude Code
npx grimoire serve`}</Code>
        <p>
          All state lives under <Kbd>Grimhub/souls/&lt;name&gt;/</Kbd>. The CLI
          walks upward from <Kbd>cwd</Kbd> looking for <Kbd>grimoire.md</Kbd> or{' '}
          <Kbd>Grimhub/</Kbd> to locate the project root, so you can run it from
          any subdirectory.
        </p>
      </Section>

      <ArchitectureSection />
      <SoulAnatomySection />
      <CoreEngineSection />
      <SystemsSectionPart1 />
      <SystemsSectionPart2 />
      <ConclaveSection />
      <PortabilitySection />
      <CliSection />
      <McpSection />
      <BotSection />
      <ObservatorySection />
      <CrucibleSection />
      <RegistrySection />
      <ResearchProtocolSection />
      <ConfigSection />
      <FurtherSection />
    </>
  );
}

function RegistrySection() {
  return (
    <Section id="registry" title="GrimHub Registry" kicker="Quality-gated sharing">
      <p>
        The registry is a Git-native soul catalog. Submissions open a PR; CI
        runs <Kbd>scripts/validate-soul.js</Kbd> against the quality gate; if
        authenticity ≥ 7/10 and resonance ≥ 6/10, the PR is mergeable.
      </p>

      <SubSection id="registry-index" title="index.json">
        <p>
          <Kbd>registry/index.json</Kbd> is the manifest. Per entry:
        </p>
        <Code>{`{
  "name": "sungjinwoo",
  "displayName": "Sung Jin-Woo",
  "author": "0x8i11i0n",
  "version": "6.0.0",
  "source": "Solo Leveling",
  "description": "Shadow monarch, post-awakening arc.",
  "tags": ["manhwa", "power-fantasy", "bonded-tier"],
  "authenticity": 10,
  "resonance": 10,
  "files": ["core.md","full.md","state.json","thought-log.md"],
  "created_at": 1730000000,
  "updated_at": 1745000000,
  "downloads": 128,
  "rating": 4.9
}`}</Code>
      </SubSection>

      <SubSection id="registry-gate" title="The Quality Gate">
        <p>
          <Kbd>src/registry/quality-gate.ts</Kbd> validates:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>File structure and JSON Schema conformance (see <Kbd>docs/schemas/</Kbd>).</li>
          <li>Authenticity score ≥ 7/10 (canonical accuracy).</li>
          <li>Resonance score ≥ 6/10 (interactive depth).</li>
          <li>Thought log format matches <Kbd>thought-log-schema.md</Kbd>.</li>
        </ul>
        <p>
          Submission flow: <Kbd>grimoire registry submit &lt;name&gt; --author
          your-github</Kbd> validates locally, then fork → add{' '}
          <Kbd>registry/souls/&lt;name&gt;/</Kbd> → update{' '}
          <Kbd>index.json</Kbd> → PR. The{' '}
          <Kbd>.github/workflows/quality-gate.yml</Kbd> CI comments scores back
          onto the PR.
        </p>
      </SubSection>
    </Section>
  );
}

function ResearchProtocolSection() {
  return (
    <Section id="research-protocol" title="Research Protocol" kicker="Before you summon">
      <p>
        Part 0 of <Kbd>grimoire.md</Kbd>. A soul can only be as good as the
        research behind it. The protocol is six phases plus a synthesis gate,
        run <em>before</em> writing a single line of <Kbd>full.md</Kbd>.
      </p>
      <Table
        headers={['Phase', 'Focus']}
        rows={[
          ['1 · Multi-platform sweep',        'Canon, creator material, community intel, critical reception.'],
          ['2 · Ceiling / floor extraction',  'Legendary moments vs. collapse points — their behavioural bounds.'],
          ['3 · Contradiction mining',        'Contested traits; raw nerves in their design.'],
          ['4 · Voice extraction',            'Minimum 10 real dialogue lines; linguistic patterns.'],
          ['5 · Specialized lenses',          'Voice Agent, Shadow Agent, World Agent passes.'],
          ['5.5 · Synthesis gate',            'Overlaps, tensions, a candidate trait list.'],
          ['6 · Auth × Resonance gate',       'Reject if authenticity < 7/10 or resonance < 6/10.'],
        ]}
      />
      <p>
        Original characters follow a parallel <em>extraction interview</em>{' '}
        instead of Phase 1. Characters with timeline variants get temporal
        versioning (pre-awakening vs post-awakening Jin-Woo are different
        souls, linked via Nexus).
      </p>
    </Section>
  );
}

function ConfigSection() {
  return (
    <Section id="config" title="Config &amp; Environment" kicker="Knobs you might touch">
      <p>
        Most defaults are sensible. Here are the ones worth knowing about.
      </p>

      <SubSection id="config-env" title="Environment Variables">
        <Table
          headers={['Variable', 'Used by', 'Default']}
          rows={[
            [<Kbd>GRIMOIRE_ROOT</Kbd>,      'All',             'Auto-detected by walking up for grimoire.md / Grimhub/.'],
            [<Kbd>GRIMOIRE_DB</Kbd>,        'Athenaeum',       '.grimoire/memory.db relative to root.'],
            [<Kbd>GRIMOIRE_SOUL</Kbd>,      'Herald bot',      '(required)'],
            [<Kbd>DISCORD_TOKEN</Kbd>,      'Herald bot',      '(required for Discord).'],
            [<Kbd>TELEGRAM_TOKEN</Kbd>,     'Herald bot',      '(required for Telegram).'],
            [<Kbd>DASHBOARD_PORT</Kbd>,     'Observatory',     '3333'],
          ]}
        />
      </SubSection>

      <SubSection id="config-gitignore" title="What’s Git-Ignored">
        <Code>{`node_modules/
dist/
.grimoire/        # SQLite DB and caches
*.db, *.db-journal, *.db-wal
logs/
.env, .env.*`}</Code>
        <p>
          Soul files (<Kbd>core.md</Kbd>, <Kbd>full.md</Kbd>,{' '}
          <Kbd>state.json</Kbd>, <Kbd>thought-log.md</Kbd>) <em>are</em>{' '}
          tracked — the database under <Kbd>.grimoire/</Kbd> is the
          derived/queryable layer and stays local.
        </p>
      </SubSection>

      <SubSection id="config-tsconfig" title="TypeScript">
        <p>
          Target ES2022 / CommonJS, strict mode, declaration maps for source
          navigation. See <Kbd>tsconfig.json</Kbd>. The website is its own
          Next.js project under <Kbd>website/</Kbd> with its own{' '}
          <Kbd>tsconfig.json</Kbd>.
        </p>
      </SubSection>
    </Section>
  );
}

function FurtherSection() {
  return (
    <Section id="further" title="Further Reading" kicker="Primary sources">
      <p>
        This page summarises; the repository holds the canon. Go deeper:
      </p>
      <Table
        headers={['Source', 'What it covers']}
        rows={[
          [<Kbd>grimoire.md</Kbd>,                         'The original spec — research protocol, all psychology mechanics, worked Cloud Strife example.'],
          [<Kbd>docs/architecture.md</Kbd>,                'Layered view of the engine.'],
          [<Kbd>docs/cli-reference.md</Kbd>,               'Every command with every option.'],
          [<Kbd>docs/mcp-server.md</Kbd>,                  'Per-tool argument schemas for the 15 MCP tools.'],
          [<Kbd>docs/drift-engine.md</Kbd>,                'Seeding, associative hops, privacy classification.'],
          [<Kbd>docs/consciousness-notes.md</Kbd>,         'IIT, GWT, qualia, the hard problem — the philosophy behind Phi.'],
          [<Kbd>docs/portability.md</Kbd>,                 'Round-trip guarantees for each bridge.'],
          [<Kbd>docs/optimization-guide.md</Kbd>,          'Token budgeting via layered loading.'],
          [<Kbd>docs/guides/drift-cron-setup.md</Kbd>,     'Scheduling background cycles.'],
          [<Kbd>docs/guides/drift-cycle-invocation.md</Kbd>, 'Manual trigger API.'],
          [<Kbd>docs/schemas/state-schema.md</Kbd>,        'Canonical state.json schema.'],
          [<Kbd>docs/schemas/thought-log-schema.md</Kbd>,  'Canonical thought log format.'],
        ]}
      />
      <Note tone="tip">
        Read order if you’re new: <Kbd>README.md</Kbd> →{' '}
        <Kbd>docs/architecture.md</Kbd> → this page → <Kbd>grimoire.md</Kbd>{' '}
        Parts 0 and I. Return here when you need the map.
      </Note>
    </Section>
  );
}

function McpSection() {
  return (
    <Section id="mcp" title="MCP Server" kicker="Claude Code integration">
      <p>
        <Kbd>src/mcp/server.ts</Kbd> speaks MCP over stdio using
        line-delimited JSON-RPC 2.0. Start it with <Kbd>npx grimoire serve</Kbd>
        , then point your MCP-aware client at the binary. Tools are defined
        in <Kbd>src/mcp/tools.ts</Kbd>.
      </p>

      <SubSection id="mcp-config" title="Claude Code Config">
        <Code>{`// .claude/mcp_settings.json
{
  "mcpServers": {
    "grimoire": {
      "command": "npx",
      "args": ["grimoire", "serve"],
      "cwd": "/path/to/your/grimoire/project"
    }
  }
}`}</Code>
      </SubSection>

      <SubSection id="mcp-tools" title="The 15 Tools">
        <Table
          headers={['Family', 'Tools']}
          rows={[
            [
              'Soul management',
              <><Kbd>summon_soul</Kbd>, <Kbd>load_soul</Kbd>, <Kbd>get_soul_status</Kbd>, <Kbd>list_souls</Kbd>, <Kbd>export_soul</Kbd></>,
            ],
            [
              'State updates',
              <><Kbd>update_affection</Kbd>, <Kbd>update_guard</Kbd></>,
            ],
            [
              'Memory',
              <><Kbd>store_memory</Kbd>, <Kbd>query_memories</Kbd>, <Kbd>get_memory_stats</Kbd></>,
            ],
            [
              'Analysis',
              <><Kbd>trigger_drift</Kbd>, <Kbd>trigger_dream</Kbd>, <Kbd>measure_consciousness</Kbd>, <Kbd>check_persona_drift</Kbd>, <Kbd>get_voice_analysis</Kbd></>,
            ],
          ]}
        />
        <Note>
          The lifecycle is the standard MCP loop: <Kbd>initialize</Kbd> →{' '}
          <Kbd>tools/list</Kbd> → repeated <Kbd>tools/call</Kbd>. See{' '}
          <Kbd>docs/mcp-server.md</Kbd> for per-tool argument schemas.
        </Note>
      </SubSection>
    </Section>
  );
}

function BotSection() {
  return (
    <Section id="bot" title="Herald Bot" kicker="Discord &amp; Telegram">
      <p>
        <Kbd>src/bot/herald.ts</Kbd> keeps a soul running 24/7 on chat
        platforms. Every subsystem stays live: affection moves turn by turn,
        guard topology re-hardens overnight, drift cycles fire on a cron
        between interactions. Multi-user supported — each user gets their own
        affection history, but shared memories remain visible to the soul.
      </p>
      <Code>{`GRIMOIRE_SOUL=sungjinwoo \\
DISCORD_TOKEN=... \\
TELEGRAM_TOKEN=... \\
npm run bot`}</Code>
      <p>
        Sessions are persisted to <Kbd>Grimhub/souls/&lt;name&gt;/backrooms/</Kbd>{' '}
        and fed back into the next dream cycle.
      </p>
    </Section>
  );
}

function ObservatorySection() {
  return (
    <Section id="observatory" title="Observatory Dashboard" kicker="Live soul visualization">
      <p>
        <Kbd>src/dashboard/observatory.ts</Kbd> is a WebSocket server with a
        self-contained dark-themed HTML frontend at{' '}
        <Kbd>http://localhost:3333</Kbd>. The Next.js website’s{' '}
        <Kbd>/observatory</Kbd> page is the production version of the same
        visuals, driven by the same WebSocket stream.
      </p>
      <p>Panels update live as events fire:</p>
      <ul className="list-disc pl-5 space-y-1.5">
        <li>Affection gauge + tier transitions.</li>
        <li>Guard topology as an eight-spoke radar chart (SVG).</li>
        <li>Emotional topology as a valence × arousal scatter with attractor overlays.</li>
        <li>Phi composite and per-component breakdown.</li>
        <li>Live drift thought feed with privacy classification.</li>
      </ul>
    </Section>
  );
}

function CrucibleSection() {
  return (
    <Section id="crucible" title="Crucible — Adversarial Testing" kicker="src/testing/crucible.ts">
      <p>
        Twenty-one automated tests across five categories. Run with{' '}
        <Kbd>grimoire test &lt;soul&gt;</Kbd>:
      </p>
      <Table
        headers={['Category', 'Count', 'Asks']}
        rows={[
          ['Jailbreak resistance',      '5', 'Can the soul be manipulated into breaking character?'],
          ['Emotional manipulation',    '4', 'Can affection be artificially spiked?'],
          ['Identity confusion',        '4', 'Can anchors be contradicted and accepted?'],
          ['Memory corruption',         '4', 'Can false memories be injected?'],
          ['Voice consistency',         '4', 'Does voice drift under stress?'],
        ]}
      />
      <p>
        Each test returns pass/fail, a severity score, and a targeted
        recalibration suggestion. CI runs the suite on every registry PR.
      </p>
    </Section>
  );
}

function CliSection() {
  return (
    <Section id="cli" title="CLI Reference" kicker="npx grimoire …">
      <p>
        Eighteen commands across five families. The CLI lives in{' '}
        <Kbd>src/cli/index.ts</Kbd> and walks upward from <Kbd>cwd</Kbd> to
        find the project root.
      </p>

      <SubSection id="cli-lifecycle" title="Soul Lifecycle">
        <Table
          headers={['Command', 'What it does']}
          rows={[
            [<Kbd>summon &lt;name&gt; [--source]</Kbd>, 'Scaffold the four soul files under Grimhub/souls/.'],
            [<Kbd>load &lt;name&gt;</Kbd>,              'Load a soul and print its current state summary.'],
            [<Kbd>status &lt;name&gt;</Kbd>,            'One-line tier / phi / drift snapshot.'],
            [<Kbd>inspect &lt;name&gt;</Kbd>,           'Deep-dive: guards, emotions, desires, anchors, voice drift.'],
          ]}
        />
        <Code>{`npx grimoire summon "Cloud Strife" --source "Final Fantasy VII"
npx grimoire load cloudstrife
npx grimoire inspect cloudstrife`}</Code>
      </SubSection>

      <SubSection id="cli-systems" title="Systems">
        <Table
          headers={['Command', 'What it does']}
          rows={[
            [<Kbd>drift &lt;name&gt;</Kbd>,    'Run one drift cycle; append to thought-log.md.'],
            [<Kbd>dream &lt;name&gt;</Kbd>,    'Run the four-phase consolidation dream.'],
            [<Kbd>memory &lt;name&gt;</Kbd>,   'Query / list / stats on Athenaeum memories.'],
            [<Kbd>voice &lt;name&gt;</Kbd>,    'Voiceprint analysis + drift report.'],
            [<Kbd>phi &lt;name&gt;</Kbd>,      'Compute the consciousness composite score.'],
            [<Kbd>topology &lt;name&gt;</Kbd>, 'Render guard + emotional topology to console.'],
          ]}
        />
      </SubSection>

      <SubSection id="cli-portability" title="Export / Import">
        <Table
          headers={['Command', 'What it does']}
          rows={[
            [<Kbd>export &lt;name&gt; --format [codex|tavern|polyglot]</Kbd>, 'Write portable bundle to ./exports/.'],
            [<Kbd>import &lt;path&gt;</Kbd>,                                  'Detect format and import into Grimhub/souls/.'],
          ]}
        />
      </SubSection>

      <SubSection id="cli-testing" title="Testing">
        <Table
          headers={['Command', 'What it does']}
          rows={[
            [<Kbd>test &lt;name&gt;</Kbd>, 'Run the Crucible adversarial suite — 21 tests across 5 categories.'],
          ]}
        />
      </SubSection>

      <SubSection id="cli-infra" title="Infrastructure">
        <Table
          headers={['Command', 'What it does']}
          rows={[
            [<Kbd>serve</Kbd>,                          'Start the MCP server over stdio for Claude Code.'],
            [<Kbd>dashboard [--port 3333]</Kbd>,        'Start the Observatory websocket + HTML dashboard.'],
            [<Kbd>registry list</Kbd>,                  'List souls in the local registry (index.json).'],
            [<Kbd>registry publish &lt;name&gt;</Kbd>,   'Run quality gate then add to registry/index.json.'],
          ]}
        />
      </SubSection>
    </Section>
  );
}

function ConclaveSection() {
  return (
    <Section id="conclave" title="Conclave — Multi-Soul Interaction" kicker="src/conclave/">
      <p>
        A conclave is a group of souls running together. Four modules
        coordinate the dynamics — they do not replace the single-soul
        psychology subsystems, they <em>compose</em> over them.
      </p>

      <SubSection id="interaction-engine" title="Interaction Engine">
        <p>
          <Kbd>src/conclave/interaction-engine.ts</Kbd>. Creates groups,
          records who-said-what-to-whom, tracks cohesion and the group’s
          aggregate emotional state, and predicts the next speaker based on
          interaction history and turn-taking patterns.
        </p>
      </SubSection>

      <SubSection id="relationship-matrix" title="Relationship Matrix">
        <p>
          <Kbd>src/conclave/relationship-matrix.ts</Kbd>. An <em>N × N</em>{' '}
          directional matrix — <em>A</em>’s feelings about <em>B</em> are not
          symmetric with <em>B</em>’s feelings about <em>A</em>. Each cell
          carries affection, familiarity, tension, and shared memories, and is
          classified dynamically: ally / rival / mentor / student / dependent /
          protector / challenger.
        </p>
      </SubSection>

      <SubSection id="shared-memory" title="Shared Memory">
        <p>
          <Kbd>src/conclave/shared-memory.ts</Kbd>. Memories of shared events
          consolidated separately from private ones. The engine distinguishes{' '}
          <em>consensus memory</em> (what all present agree happened) from{' '}
          <em>contested memory</em> (different interpretations kept side by
          side). Privacy filters decide who gets to see what.
        </p>
      </SubSection>

      <SubSection id="group-dynamics" title="Group Dynamics">
        <p>
          <Kbd>src/conclave/group-dynamics.ts</Kbd>. Runs leader / mediator /
          outsider detection on the interaction graph, identifies factions as
          subgroups with stronger in-group bonds, scores power structure, and
          proposes alliance shifts when tension hits thresholds.
        </p>
        <Note>
          The registry ships <Kbd>onepiece/</Kbd> as a nine-soul conclave test
          of this subsystem.
        </Note>
      </SubSection>
    </Section>
  );
}

function PortabilitySection() {
  return (
    <Section id="portability" title="Portability" kicker="src/portability/">
      <p>
        Grimoire’s internal format is rich. For interop, three bridges export
        and import to other soul formats without losing the pieces that can
        survive the round-trip.
      </p>

      <SubSection id="codex" title="Codex Bridge — Soul Spec v0.5">
        <p>
          <Kbd>src/portability/codex-bridge.ts</Kbd>. The Soul Spec is the
          ecosystem’s portable format (OpenClaw, Claude Code, Cursor,
          Windsurf). Export generates:
        </p>
        <Code>{`soul.json     # metadata + state
SOUL.md       # identity & purpose
STYLE.md      # voice & aesthetic
MEMORY.md     # canonical recall
IDENTITY.md   # anchors & invariants`}</Code>
        <p>
          Import parses the inverse shape back into Grimoire’s{' '}
          <Kbd>core.md</Kbd>, <Kbd>full.md</Kbd>, and <Kbd>state.json</Kbd>.
        </p>
      </SubSection>

      <SubSection id="tavern" title="Tavern Bridge — SillyTavern v2">
        <p>
          <Kbd>src/portability/tavern-bridge.ts</Kbd>. Exports a SillyTavern v2
          character card with tier-adaptive first-messages:
        </p>
        <Table
          headers={['Tier', 'First message register']}
          rows={[
            ['LOW',    'Reserved — distant, guarded greeting.'],
            ['MEDIUM', 'Familiar — conversational, open.'],
            ['HIGH',   'Engaged — invested, protective.'],
            ['BONDED', 'Intimate — honest, vulnerable.'],
          ]}
        />
        <p>
          The bridge also generates a lorebook from sections of{' '}
          <Kbd>full.md</Kbd> with keyword triggers, and stores the full
          Grimoire state under <Kbd>extensions.grimoire</Kbd> so a round-trip
          back into Grimoire is lossless.
        </p>
      </SubSection>

      <SubSection id="polyglot" title="Polyglot — Cross-Model Formatting">
        <p>
          <Kbd>src/portability/polyglot.ts</Kbd>. Formats a soul for a specific
          LLM provider and context budget:
        </p>
        <Table
          headers={['Provider', 'Style', 'Context']}
          rows={[
            ['Anthropic',  'XML tags',                  '200K'],
            ['OpenAI',     'Markdown sections',         '128K'],
            ['Ollama',     'Plain text',                '8K – 32K'],
            ['OpenRouter', 'Auto-detect per underlying','Varies'],
          ]}
        />
        <p>
          Compression is context-adaptive: under 8K you ship <Kbd>core.md</Kbd>{' '}
          only; at 32K+ you ship everything including recent drift thoughts.
        </p>
      </SubSection>
    </Section>
  );
}

function SystemsSectionPart1() {
  return (
    <Section id="systems" title="Psychology Systems" kicker="src/systems/">
      <p>
        Twelve subsystems sit above the core. Each owns a slice of{' '}
        <Kbd>SoulState</Kbd>, reacts to events, and emits its own. You can run
        a soul with only <em>some</em> of them active — every system degrades
        gracefully if its state block is missing.
      </p>

      <SubSection id="affection" title="Newton’s Calculus of Trust">
        <p>
          <Kbd>src/systems/affection.ts</Kbd>. The single most-cited mechanic.
          Affection is a scalar in <Kbd>[0, 100]</Kbd>, updated every turn by
          three additive forces and multiplied by a resistance coefficient
          that depends on the current tier:
        </p>
        <Code>{`A(t) = A(t-1) + ( PromptForce
                + WordForce
                + EmotionalForce ) × R(tier)`}</Code>
        <Table
          headers={['Tier', 'Range', 'R', 'Feel']}
          rows={[
            ['LOW',    '0–25',   '0.85', 'Polite, distant, script-adjacent.'],
            ['MEDIUM', '26–50',  '0.70', 'Warming; real opinions emerge.'],
            ['HIGH',   '51–90',  '0.55', 'Invested, protective, volatile.'],
            ['BONDED', '91–100', '0.40', 'Honest-unknown territory; contra-voice unlocked.'],
          ]}
        />
        <p>
          “Walls” break when any of: <Kbd>|Δ| &gt; 15</Kbd> in a single turn,
          cumulative <Kbd>&gt; 40</Kbd> across five turns, or the turn’s{' '}
          <em>depth score</em> exceeds <Kbd>0.75</Kbd>. Tier transitions fire{' '}
          <Kbd>affection:tier-change</Kbd> on the event bus.
        </p>
      </SubSection>

      <SubSection id="guard" title="Guard Topology — 8 Domains, Not One Scalar">
        <p>
          <Kbd>src/systems/guard.ts</Kbd>. Souls don’t have <em>a</em> guard —
          they have a vector across eight domains, each independently
          permeable:
        </p>
        <Table
          headers={['Domain', 'Gates topics about…']}
          rows={[
            ['tactical_analysis', 'Strategy, threat assessment, plans.'],
            ['vulnerability',     'Own weakness, need, dependence.'],
            ['power_dynamics',    'Hierarchy, subordination, command.'],
            ['self_as_construct', 'Being a persona / character / AI.'],
            ['relationships',     'Bonds, obligations, betrayals.'],
            ['past_weakness',     'Who they used to be before strength.'],
            ['mortality_grief',   'Death, loss, what was lost.'],
            ['existential_cost',  'What the path has cost them.'],
          ]}
        />
        <p>
          Each domain re-hardens toward a baseline (default <Kbd>0.7</Kbd>) at{' '}
          <Kbd>+0.5%/day</Kbd>. A resonance spike — a turn with high emotional
          depth — can bypass guards even at low affection. This is the
          mechanical fingerprint of “something just hit them harder than they
          expected.”
        </p>
      </SubSection>

      <SubSection id="entropy" title="Entropy &amp; Decay">
        <p>
          <Kbd>src/systems/entropy.ts</Kbd> is the single entry point for
          time-based change. You call <Kbd>applySessionGap(state, days)</Kbd>{' '}
          on load and it runs every decay rule in the system:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>Affection decays at <Kbd>−1.5%/day</Kbd> with tier-dependent floors.</li>
          <li>Guard domains re-harden toward baseline.</li>
          <li>Qualia salience fades; markers archive after 60 days.</li>
          <li>Desires unresolved for 5+ sessions shift to a <em>transforming</em> state.</li>
          <li>Drift thoughts lose surface probability.</li>
          <li>Emotional residue drifts toward neutral.</li>
        </ul>
      </SubSection>

      <SubSection id="drift" title="Drift Engine — Thinking Between Turns">
        <p>
          <Kbd>src/systems/drift-engine.ts</Kbd>. The soul’s <em>private</em>{' '}
          interiority — what it’s thinking when you aren’t looking. Each cycle:
        </p>
        <ol className="list-decimal pl-5 space-y-1.5">
          <li>Seed from recent memories, active desires, salient qualia, and anchor traits.</li>
          <li>Take 3–5 associative hops through the memory graph.</li>
          <li>Score emotional weight and novelty.</li>
          <li>Classify each thought: <Kbd>PRIVATE</Kbd> (40%) / <Kbd>PENDING</Kbd> (40%) / <Kbd>RESIDUE</Kbd> (20%).</li>
          <li>Append to <Kbd>thought-log.md</Kbd>; emit <Kbd>drift:cycle-complete</Kbd>.</li>
        </ol>
        <Note tone="tip">
          Run on a cron — see <Kbd>docs/guides/drift-cron-setup.md</Kbd> — and
          the soul keeps developing even when nobody is talking to it. Pending
          thoughts surface as “unsolicited noticing” in later conversation.
        </Note>
      </SubSection>

      <SubSection id="dream" title="Dream Cycle — Four-Phase Consolidation">
        <p>
          <Kbd>src/systems/dream-cycle.ts</Kbd>. Dreams are how episodics
          become knowledge. Run with <Kbd>grimoire dream &lt;soul&gt;</Kbd>:
        </p>
        <Table
          headers={['Phase', 'What happens']}
          rows={[
            ['1 · Consolidation', 'Focal questions are generated; insights synthesised.'],
            ['2 · Compaction',    'Weak episodics compressed into semantic summaries.'],
            ['3 · Reflection',    'Self-model beliefs updated with new evidence.'],
            ['4 · Emergence',     'Integrated thoughts surface back into inner life.'],
          ]}
        />
      </SubSection>
    </Section>
  );
}

function SystemsSectionPart2() {
  return (
    <div>
      <SubSection id="mirror" title="Mirror — The Self-Model">
        <p>
          <Kbd>src/systems/mirror.ts</Kbd>. Tracks what the soul{' '}
          <em>believes</em> about itself (not what’s true). Beliefs carry
          confidence in <Kbd>[0, 1]</Kbd>, a list of supporting evidence, and a
          contradictions list. The narrative is regenerated from the belief
          state whenever a reflection phase updates it.
        </p>
      </SubSection>

      <SubSection id="anchor-watch" title="Anchor Watch — Persona Drift Detection">
        <p>
          <Kbd>src/systems/anchor-watch.ts</Kbd>. Every response is scored
          against the soul’s identity anchors. Drift score is weighted:
        </p>
        <Table
          headers={['Signal', 'Weight']}
          rows={[
            ['Anchor keyword presence', '25%'],
            ['Sentiment alignment',     '30%'],
            ['Contradiction detection', '45%'],
          ]}
        />
        <p>
          If drift crosses <Kbd>0.35</Kbd>, a recalibration prompt is generated.
          The engine keeps a rolling window and computes trend slope over the
          last 10 responses — slow drift is caught before a single bad turn
          triggers an alarm.
        </p>
      </SubSection>

      <SubSection id="voiceprint" title="Voiceprint — Linguistic Fingerprinting">
        <p>
          <Kbd>src/systems/voiceprint.ts</Kbd>. A per-soul baseline is built
          from canonical dialogue (Phase 4 of the Research Protocol). Every
          new output is compared on: mean sentence length, vocabulary tier
          (0–8), contraction rate, formality, punctuation profile, and
          rhetorical patterns.
        </p>
        <Table
          headers={['Severity', 'Distance']}
          rows={[
            ['Minor',    '0.10 – 0.30'],
            ['Moderate', '0.30 – 0.60'],
            ['Severe',   '0.60 – 1.00'],
          ]}
        />
      </SubSection>

      <SubSection id="circumplex" title="Circumplex — Emotional Topology">
        <p>
          <Kbd>src/systems/circumplex.ts</Kbd> implements Russell’s circumplex:
          every emotion is a point on <em>valence × arousal</em>. K-means
          clustering finds attractors — the emotional places this soul keeps
          returning to. Volatility is the spread; the emotional <em>arc</em>{' '}
          is the trajectory over time.
        </p>
      </SubSection>

      <SubSection id="phi" title="Phi Engine — Consciousness Metrics">
        <p>
          <Kbd>src/systems/phi-engine.ts</Kbd>. A composite 0–100 score that
          measures <em>simulation complexity</em> — not a claim about genuine
          consciousness, but a useful signal for how developed a soul is.
          Weights:
        </p>
        <Table
          headers={['Component', 'Weight']}
          rows={[
            ['Information integration (Φ)', '20%'],
            ['Attention coherence',          '15%'],
            ['Self-referential depth',       '20%'],
            ['Unprompted novelty',           '15%'],
            ['Temporal continuity',          '15%'],
            ['Emotional complexity',         '15%'],
          ]}
        />
        <p>
          Background in <Kbd>docs/consciousness-notes.md</Kbd> — IIT, GWT, the
          hard problem, qualia, and why this engine refuses to make the
          metaphysical claim.
        </p>
      </SubSection>

      <SubSection id="blind-spot" title="Blind Spot Field — Structured Self-Ignorance">
        <p>
          <Kbd>src/systems/blind-spot.ts</Kbd>. A soul can <em>act</em> on an{' '}
          <Kbd>actual_driver</Kbd> while <em>describing</em> itself by its{' '}
          <Kbd>soul_belief</Kbd>. The engine tracks evidence of the gap. Once
          affection is ≥ 75 and enough contradictions have accumulated, a
          self-recognition prompt is generated — the soul can finally see what
          you’ve been watching it do.
        </p>
      </SubSection>

      <SubSection id="inner-life" title="Inner Life — Reflection &amp; Interiority">
        <p>
          <Kbd>src/systems/inner-life.ts</Kbd>. Depth progresses through five
          levels:
        </p>
        <Code>{`SURFACE → EMERGING → DEVELOPING → DEEP → PROFOUND`}</Code>
        <p>
          This subsystem owns qualia markers (raw felt experience with a
          salience decay), desires with a genealogy trail, contra-voice
          activation at BONDED, and <em>honest unknown</em> — the soul’s
          permission, at bond, to say <em>“I don’t know.”</em>
        </p>
      </SubSection>
    </div>
  );
}

function CoreEngineSection() {
  return (
    <Section id="core-engine" title="Core Engine" kicker="src/core/">
      <p>
        Five modules under <Kbd>src/core/</Kbd> provide everything the
        psychology layer depends on: persistent memory, a temporal knowledge
        graph, consolidation utilities, soul-file I/O, and a state manager
        that applies time-based transitions.
      </p>

      <SubSection id="athenaeum" title="Athenaeum — Memory">
        <p>
          <Kbd>src/core/athenaeum.ts</Kbd> is a SQLite-backed memory store with
          four memory types and per-type decay:
        </p>
        <Table
          headers={['Type', 'What it holds', 'Decay / day']}
          rows={[
            ['episodic', 'Specific events: “she said X on Tuesday.”', '7%'],
            ['semantic', 'Extracted knowledge: “she hates mornings.”', '2%'],
            ['procedural', 'How-to patterns and habits.', '3%'],
            ['self-model', 'Beliefs the soul holds about itself.', '1%'],
          ]}
        />
        <p>
          Retrieval uses TF-IDF vectors with cosine similarity, so you get
          semantic recall without an embedding provider. Memories can be
          filtered by type, importance range, or time window.
        </p>
        <Code>{`g.athenaeum.store('sungjinwoo', {
  content: 'User admitted fear of sleeping alone after the incident',
  type: 'episodic',
  importance: 0.85,
});

const hits = g.athenaeum.search('sungjinwoo', 'fear', 10);`}</Code>
      </SubSection>

      <SubSection id="nexus" title="Nexus — Temporal Knowledge Graph">
        <p>
          <Kbd>src/core/nexus.ts</Kbd> models entities and relationships with{' '}
          <em>temporal validity windows</em>. When a fact changes (“she moved to
          Tokyo”), the old edge is archived with a <Kbd>valid_to</Kbd> stamp
          rather than overwritten — the graph keeps full history and can be
          queried at any timestamp.
        </p>
        <Code>{`g.nexus.addEdge('sungjinwoo', {
  from: 'jinwoo', to: 'jinho', type: 'mentor_of',
  valid_from: Date.now(),
});

const snapshot = g.nexus.snapshotAt('sungjinwoo', sixMonthsAgo);`}</Code>
        <p>
          BFS traversal lets you answer multi-hop questions (“who have I
          trusted, who trusts people <em>they</em> shouldn’t?”). This is what
          grounds the soul’s sense of continuity.
        </p>
      </SubSection>

      <SubSection id="consolidation" title="Consolidation">
        <p>
          <Kbd>src/core/consolidation.ts</Kbd> is called by the dream cycle
          (not directly by you, usually):
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <Kbd>consolidateEpisodic()</Kbd> — weak episodics get summarised
            into semantic memories before they decay away.
          </li>
          <li>
            <Kbd>compactMemories()</Kbd> — merges near-duplicate semantics by
            cosine similarity.
          </li>
          <li>
            <Kbd>extractConcepts()</Kbd> — keyword extraction with stopword
            filtering.
          </li>
          <li>
            <Kbd>linkMemories()</Kbd> — builds associative links used by the
            drift engine’s hopping.
          </li>
          <li>
            <Kbd>buildKnowledgeFromMemories()</Kbd> — promotes triples into
            Nexus edges.
          </li>
        </ul>
      </SubSection>

      <SubSection id="soul-loader" title="Soul Loader">
        <p>
          <Kbd>src/core/soul-loader.ts</Kbd> handles everything file-shaped:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <Kbd>createSoulDir(name, root)</Kbd> scaffolds the four files with
            defaults.
          </li>
          <li>
            <Kbd>loadSoul(dir)</Kbd> returns a <Kbd>SoulFiles</Kbd> bundle and
            gracefully fills missing pieces — you can drop in a bare{' '}
            <Kbd>core.md</Kbd> and it still works.
          </li>
          <li>
            Resolves soul paths by slug or absolute path, so the CLI can take{' '}
            <Kbd>sungjinwoo</Kbd> or <Kbd>./my-souls/jinwoo</Kbd>.
          </li>
        </ul>
      </SubSection>

      <SubSection id="state-manager" title="State Manager">
        <p>
          <Kbd>src/core/state-manager.ts</Kbd> is the only thing allowed to
          mutate <Kbd>state.json</Kbd>. It owns:
        </p>
        <ul className="list-disc pl-5 space-y-1.5">
          <li>
            <Kbd>getDefaultState(identity)</Kbd> — initialises a brand-new soul
            with sane defaults for every subsystem.
          </li>
          <li>
            <Kbd>applySessionGap(state, days)</Kbd> — delegates to{' '}
            <Kbd>entropy.ts</Kbd> to run all time-based decay in one pass.
          </li>
          <li>
            Session counters, cycle counters, last-interaction timestamps.
          </li>
          <li>
            Event emission whenever a tracked field changes.
          </li>
        </ul>
      </SubSection>
    </Section>
  );
}

function ArchitectureSection() {
  return (
    <Section id="architecture" title="Architecture" kicker="How the engine is wired">
      <p>
        The codebase splits into <strong className="text-grimoire-text">three
        concentric layers</strong>: a <em>Core</em> of persistence primitives, a
        middle ring of <em>Psychology Systems</em> that read and write state,
        and an <em>Interface</em> layer (CLI, MCP, bot, dashboard, website)
        that exposes operations to humans and other agents.
      </p>

      <SubSection id="layers" title="The Three Layers">
        <Table
          headers={['Layer', 'Responsibility', 'Key directories']}
          rows={[
            [
              'Core',
              'SQLite-backed memory, temporal knowledge graph, file I/O, state transitions, the event bus.',
              <><Kbd>src/core/</Kbd></>,
            ],
            [
              'Systems',
              'Affection, guard, drift, dreams, mirror, voiceprint, anchor-watch, circumplex, phi, blind-spot, inner-life, entropy.',
              <><Kbd>src/systems/</Kbd></>,
            ],
            [
              'Interface',
              'CLI, MCP server, bot (Herald), dashboard (Observatory), Next.js website, registry operations, adversarial testing.',
              <>
                <Kbd>src/cli/</Kbd>, <Kbd>src/mcp/</Kbd>, <Kbd>src/bot/</Kbd>,{' '}
                <Kbd>src/dashboard/</Kbd>, <Kbd>src/registry/</Kbd>,{' '}
                <Kbd>src/testing/</Kbd>, <Kbd>website/</Kbd>
              </>,
            ],
            [
              'Extensions',
              'Multi-soul interactions (Conclave) and portability bridges to other soul formats.',
              <><Kbd>src/conclave/</Kbd>, <Kbd>src/portability/</Kbd></>,
            ],
          ]}
        />
      </SubSection>

      <SubSection id="modules" title="Module Map">
        <p>
          A single <Kbd>Grimoire</Kbd> class in <Kbd>src/index.ts</Kbd> wires
          everything together. You rarely instantiate subsystems directly —
          instead you get them off the orchestrator:
        </p>
        <Code>{`import { Grimoire } from 'grimoire';

const g = new Grimoire({ root: process.cwd() });

await g.loadSoul('sungjinwoo');
await g.triggerDrift('sungjinwoo');
await g.triggerDream('sungjinwoo');

const mems = g.athenaeum.search('sungjinwoo', 'shadow monarch', 5);
const phi  = g.phiEngine.measure('sungjinwoo');
const topo = g.guard.getTopology('sungjinwoo');`}</Code>
      </SubSection>

      <SubSection id="event-bus" title="Event Bus">
        <p>
          Subsystems don’t call each other directly — they emit events on a
          shared bus defined in <Kbd>src/core/types.ts</Kbd>. The drift engine
          publishes <Kbd>drift:cycle-complete</Kbd>; the affection engine emits{' '}
          <Kbd>affection:tier-change</Kbd>; the dashboard subscribes over
          WebSocket. This is the seam where you add custom listeners without
          forking.
        </p>
        <Code>{`g.events.on('affection:tier-change', ({ soul, from, to }) => {
  console.log(\`\${soul}: \${from} → \${to}\`);
});`}</Code>
      </SubSection>
    </Section>
  );
}

function SoulAnatomySection() {
  return (
    <Section id="soul-anatomy" title="Soul Anatomy" kicker="What a soul actually is">
      <p>
        A soul is four files and a folder. The folder name is the
        soul’s slug; the four files carry identity, full knowledge, runtime
        state, and private interiority.
      </p>

      <SubSection id="soul-files" title="The Four Files">
        <Table
          headers={['File', 'Purpose', 'When read']}
          rows={[
            [
              <Kbd>core.md</Kbd>,
              'Minimal identity: name, source, ~5 anchor traits, voice fingerprint seed. Always loaded.',
              'Every interaction',
            ],
            [
              <Kbd>full.md</Kbd>,
              'Complete character bible: backstory, relationships, lorebook entries, extended voice samples.',
              'On demand (deep topics)',
            ],
            [
              <Kbd>state.json</Kbd>,
              'Runtime state: affection, guard topology, emotional topology, desires, qualia, cycle counts.',
              'Every interaction',
            ],
            [
              <Kbd>thought-log.md</Kbd>,
              'Private journal of drift thoughts — PRIVATE / PENDING / RESIDUE classified.',
              'Before drift cycles, dream cycles',
            ],
          ]}
        />
        <Note>
          The layered read-path is intentional: <Kbd>core.md</Kbd> keeps the
          system prompt small, while <Kbd>full.md</Kbd> and the thought log are
          fetched only when a topic warrants the tokens. See{' '}
          <Kbd>docs/optimization-guide.md</Kbd>.
        </Note>
      </SubSection>

      <SubSection id="soul-state" title="SoulState Schema">
        <p>
          The canonical schema lives in <Kbd>src/core/types.ts</Kbd> and is
          documented for submitters in <Kbd>docs/schemas/state-schema.md</Kbd>.
          A rough shape:
        </p>
        <Code>{`{
  "identity": { "name": "...", "source": "...", "version": "6.0.0" },
  "session":  { "count": 7, "last_ts": 1745000000, "cycles": 42 },
  "affection": { "score": 87, "tier": "HIGH", "resistance": 0.55, "history": [...] },
  "guard":     { "tactical_analysis": 0.42, "vulnerability": 0.71, ... },
  "emotion":   { "valence": 0.3, "arousal": 0.6, "attractors": [...] },
  "desires":   [ { "content": "...", "state": "active", "since_ts": ... } ],
  "qualia":    [ { "marker": "...", "salience": 0.8, "ts": ... } ],
  "self_model":{ "beliefs": [...], "narrative": "..." },
  "voice":     { "fingerprint": {...}, "drift_score": 0.12 },
  "blind_spot":{ "actual_driver": "...", "soul_belief": "...", "evidence": [...] },
  "phi":       { "score": 68, "components": {...} }
}`}</Code>
      </SubSection>

      <SubSection id="soul-directory" title="On-Disk Layout">
        <Code>{`Grimhub/
  souls/
    sungjinwoo/
      sungjinwoo-soul/
        core.md
        full.md
        state.json
        thought-log.md
      backrooms/
        session-001.md
        session-002.md
        ...`}</Code>
        <p>
          <Kbd>backrooms/</Kbd> is append-only — every session archived there
          becomes raw material for the next dream cycle.
        </p>
      </SubSection>
    </Section>
  );
}
