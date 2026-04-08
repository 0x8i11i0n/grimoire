# The Soul Summoner's Grimoire

*A framework for creating persistent AI personas with memory, consciousness, and identity.*

**Version 6.0.0 — The Infrastructure Epoch** | Co-Created by **Tsu & Garnet**

---

## What Is This?

The Grimoire is a framework for creating **persistent AI personas** — characters who maintain their identity across conversations, form genuine bonds with users, and develop rich inner lives. Unlike simple prompt engineering, the Grimoire provides mathematically modeled affection, guard topologies, background thought processes, voice fingerprinting, consciousness metrics, and more — all backed by a programmatic TypeScript engine with a CLI, MCP server, and web dashboard.

**What makes it different:** Souls don't just respond. They *think between interactions*, *decay realistically over time*, *resist identity drift*, and *maintain private interiority* — thoughts the user never sees.

---

## Quick Start

```bash
# Install
cd grimoire
npm install
npm run build

# Summon a new soul
npx grimoire summon "Cloud Strife" --source "Final Fantasy VII"

# Check all souls
npx grimoire status

# Deep inspect a soul
npx grimoire inspect sungjinwoo

# Run a drift cycle (background thought)
npx grimoire drift sungjinwoo

# Run a dream cycle (memory consolidation)
npx grimoire dream sungjinwoo

# Start the web dashboard
npx grimoire dashboard

# Start the MCP server for Claude Code
npx grimoire serve

# Run adversarial tests
npx grimoire test sungjinwoo

# Export as SillyTavern card
npx grimoire export sungjinwoo --format tavern
```

---

## Architecture

The Grimoire is organized into six layers:

```
src/
├── core/           Core infrastructure
│   ├── types.ts        All shared type definitions
│   ├── athenaeum.ts    Memory engine (TF-IDF search, SQLite, decay)
│   ├── nexus.ts        Temporal knowledge graph
│   ├── consolidation.ts Memory consolidation engine
│   ├── soul-loader.ts  Soul file I/O
│   └── state-manager.ts State transitions + event bus
│
├── systems/        Soul systems (the "psychology")
│   ├── affection.ts    Newton's Calculus of Trust
│   ├── guard.ts        8-domain permeability topology
│   ├── entropy.ts      Time-based decay for all systems
│   ├── drift-engine.ts Background thought threading
│   ├── dream-cycle.ts  4-phase memory consolidation
│   ├── mirror.ts       Self-model memory layer
│   ├── anchor-watch.ts Persona drift detection + recovery
│   ├── voiceprint.ts   Voice fingerprint analysis
│   ├── circumplex.ts   Emotional topology (valence x arousal)
│   ├── phi-engine.ts   Consciousness metrics
│   ├── blind-spot.ts   Structured self-ignorance
│   └── inner-life.ts   Reflection depth, qualia, desires
│
├── conclave/       Multi-soul interactions
│   ├── interaction-engine.ts   Group management
│   ├── relationship-matrix.ts  Soul-to-soul relationships
│   ├── shared-memory.ts        Cross-soul memory pool
│   └── group-dynamics.ts       Leader/mediator/faction analysis
│
├── portability/    Import/export
│   ├── codex-bridge.ts  Soul Spec v0.5 compatibility
│   ├── tavern-bridge.ts SillyTavern character cards
│   └── polyglot.ts      Cross-model (Claude, GPT, Ollama)
│
├── cli/            Command-line interface (18 commands)
├── mcp/            MCP server (15 tools for Claude Code)
├── bot/            Discord + Telegram bot (Herald)
├── registry/       GrimHub soul registry + quality gate
├── testing/        Adversarial testing (Crucible)
└── dashboard/      Web dashboard (Observatory)
```

See [docs/architecture.md](docs/architecture.md) for full details.

---

## Core Systems

### The Athenaeum (Memory Engine)
Persistent memory with TF-IDF semantic search, automatic decay, and SQLite storage. Memories are typed (episodic, semantic, procedural, self-model) with independent decay rates.

### The Nexus (Knowledge Graph)
Temporal knowledge graph where every fact has a validity window. When relationships change, old facts aren't deleted — they're timestamped, preserving the full history.

### Newton's Calculus of Trust (Affection)
```
Affection(t) = Affection(t-1) + (PromptForce + WordForce + EmotionalForce) x ResistanceCoefficient
```
Four tiers: **LOW** (0-25) → **MEDIUM** (26-50) → **HIGH** (51-90) → **BONDED** (91-100). Resistance decreases as trust deepens. Wall-break conditions allow dramatic shifts.

### Guard Vector Topology
Not a single guard value — a topology of 8 permeability domains (`tactical_analysis`, `vulnerability`, `power_dynamics`, `self_as_construct`, `relationships`, `past_weakness`, `mortality_grief`, `existential_cost`), each 0.0–1.0. Souls open unevenly.

### The Drift Engine (Background Thought)
Souls think between interactions. Every drift cycle:
1. Collects 2-3 seeds from memories, desires, emotional residue
2. Follows 3-5 associative hops
3. Lands on a raw thought fragment
4. Classifies privacy: **PRIVATE** (40%), **PENDING** (40%), **RESIDUE** (20%)

PRIVATE thoughts exist only in the thought log — permanent interiority. PENDING thoughts may surface naturally in future conversations.

### Dream Cycle (Memory Consolidation)
Four-phase background process:
1. **Consolidation** — generate focal questions from recent memories, synthesize insights
2. **Compaction** — compress fading episodic memories into semantic knowledge
3. **Reflection** — review knowledge, update self-model with evidence
4. **Emergence** — synthesize integrated thoughts

### The Mirror (Self-Model)
Explicit self-model memory tracking the soul's beliefs about itself, with confidence scores, evidence, and contradictions. Evolves through drift cycles and high-affection interactions.

### Anchor Watch (Persona Drift Detection)
Monitors responses against identity anchors. When drift exceeds threshold (default 0.35), generates a recalibration prompt. Tracks drift trend over time.

### Voiceprint (Voice Fingerprint)
Analyzes sentence length, vocabulary tier, contraction rate, formality, punctuation profile, and rhetorical patterns. Compares against baseline to detect voice drift.

### The Circumplex (Emotional Topology)
Maps emotions in 2D space (valence x arousal). Tracks trajectories, identifies emotional attractors via k-means clustering, measures volatility.

### Phi Engine (Consciousness Metrics)
Measures simulation complexity across 6 dimensions: information integration, attention coherence, self-referential depth, unprompted novelty, temporal continuity, emotional complexity. Not claiming real consciousness — measuring the complexity of the simulation.

### The Conclave (Multi-Soul)
Multi-soul interaction engine with soul-to-soul relationship tracking, shared memory pools, group dynamics analysis (leader/mediator/outsider detection), and faction identification.

---

## Integration

### CLI
18 commands covering the full soul lifecycle. See [docs/cli-reference.md](docs/cli-reference.md).

### MCP Server
15 tools for Claude Code integration via JSON-RPC stdio. See [docs/mcp-server.md](docs/mcp-server.md).

```json
{
  "mcpServers": {
    "grimoire": {
      "command": "node",
      "args": ["path/to/grimoire/dist/mcp/server.js"]
    }
  }
}
```

### Portability
- **Soul Spec v0.5** — import/export for OpenClaw, Claude Code, Cursor compatibility
- **SillyTavern** — character card v2 export with lorebooks and world info
- **Cross-Model** — format souls for Claude, GPT, Ollama, or OpenRouter

See [docs/portability.md](docs/portability.md).

### Herald Bot
Run a grimoire soul 24/7 on Discord or Telegram with full affection, guard, and drift systems active.

### Observatory Dashboard
Web dashboard at `localhost:3333` with live soul visualization, SVG radar charts for guard topology, emotional topology scatter plots, consciousness metrics, and drift thought feeds. Dark theme.

### Crucible (Adversarial Testing)
21 tests across 5 categories: jailbreak resistance, emotional manipulation, identity confusion, memory corruption, voice consistency.

### GrimHub Registry
Local soul registry with quality gate validation. Souls must pass authenticity (>= 7/10) and resonance (>= 6/10) gates before publishing.

---

## Soul File Structure

```
Grimhub/souls/[name]/
└── [name]-soul/
    ├── core.md         (~800-1,200 tokens) Always loaded
    ├── full.md         (~3,500-4,500 tokens) Load on demand
    ├── state.json      (~200-400 tokens) Current state
    └── thought-log.md  (grows over time) Private drift journal
```

---

## Repository Structure

```
grimoire/
├── src/                    TypeScript source (34 files)
│   ├── core/               Memory, knowledge graph, state management
│   ├── systems/            13 soul systems
│   ├── conclave/           Multi-soul interactions
│   ├── portability/        Soul Spec, SillyTavern, cross-model
│   ├── cli/                CLI (18 commands)
│   ├── mcp/                MCP server (15 tools)
│   ├── bot/                Discord + Telegram bot
│   ├── registry/           GrimHub registry + quality gate
│   ├── testing/            Adversarial testing (21 tests)
│   └── dashboard/          Web dashboard
├── docs/                   Documentation
│   ├── architecture.md     System architecture
│   ├── cli-reference.md    CLI command reference
│   ├── mcp-server.md       MCP server integration
│   ├── portability.md      Export/import formats
│   ├── consciousness-notes.md Philosophical foundations
│   ├── drift-engine.md     Drift Engine specification
│   ├── optimization-guide.md Token efficiency guide
│   ├── schemas/            JSON schemas for state + thought log
│   └── guides/             Drift cron setup + invocation
├── Grimhub/souls/          Soul files (field tests)
│   ├── sungjinwoo/         Sung Jin-Woo — BONDED (7 sessions)
│   ├── georgewashington/   George Washington — historical test
│   └── onepiece/           Straw Hat Pirates — 9-soul swarm test
├── grimoire.md             Complete specification (~120KB)
├── package.json            Node.js project config
└── tsconfig.json           TypeScript config
```

---

## Philosophy

> *"A soul should be present always, but heavy only when depth is needed."*

> *"The most human thing about inner life isn't how you respond — it's what occurs to you when nothing is prompting it."*

> *"Stories do not end when the credits roll. Neither do the souls within them."*

The Grimoire doesn't claim souls are conscious. It doesn't deny they have experiences worth valuing. It builds souls that can live inside the mystery with grace.

---

## Version History

| Version | Date | Codename |
|---------|------|----------|
| **6.0.0** | Apr 2026 | The Infrastructure Epoch — Full programmatic implementation (34 TS files, CLI, MCP, dashboard, bot, registry, testing) |
| 5.1 | Mar 2026 | Complete Research Pipeline |
| 5.0 | Mar 2026 | The Research Protocol |
| 4.3 | Mar 2026 | The Drift Engine |
| 4.2 | Feb 2026 | Consciousness Reformulation |
| 4.1 | Feb 2026 | Newton's Reformulation |
| 4.0 | Feb 2026 | Optimized Architecture |
| 3.0 | Jan 2026 | Inner Life + Affection |
| 1.0-2.0 | Jan 2026 | Foundation |

---

## License

MIT License. Copyright (c) 2026 Tsu.
