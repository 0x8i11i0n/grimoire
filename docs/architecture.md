# System Architecture

**Grimoire v6.0.0 — The Infrastructure Epoch**

---

## Overview

The Grimoire is a layered system where each component has a single responsibility and communicates through typed interfaces and an event bus.

```
┌─────────────────────────────────────────────────────────┐
│                    Integration Layer                     │
│  CLI (18 cmds) │ MCP (15 tools) │ Bot │ Dashboard │ API │
├─────────────────────────────────────────────────────────┤
│                    Portability Layer                     │
│     Codex Bridge │ Tavern Bridge │ Polyglot Adapters     │
├─────────────────────────────────────────────────────────┤
│              Multi-Soul Layer (Conclave)                 │
│  Interaction Engine │ Relationship Matrix │ Group Dyn.   │
├─────────────────────────────────────────────────────────┤
│                     Systems Layer                        │
│  Affection │ Guard │ Entropy │ Drift │ Dream │ Mirror   │
│  Anchor Watch │ Voiceprint │ Circumplex │ Phi Engine    │
│  Blind Spot │ Inner Life                                 │
├─────────────────────────────────────────────────────────┤
│                  Core Infrastructure                     │
│  Athenaeum (Memory) │ Nexus (Graph) │ Consolidation      │
│  Soul Loader │ State Manager │ Event Bus │ Types         │
└─────────────────────────────────────────────────────────┘
```

---

## Core Infrastructure

### Types (`src/core/types.ts`)
All shared interfaces, enums, and utility functions. Every other file imports from here. Key exports:
- `SoulState` — complete soul state shape
- `SoulFiles` — filesystem representation
- `Memory`, `MemoryQuery`, `MemoryStats` — memory system
- `EventBus` — inter-system communication
- `generateId()`, `clamp()`, `daysSince()` — utilities

### Athenaeum (`src/core/athenaeum.ts`)
SQLite-backed memory engine.

| Feature | Implementation |
|---------|---------------|
| Storage | SQLite via `better-sqlite3` |
| Search | TF-IDF vectors with cosine similarity |
| Decay | Per-type daily decay (episodic 7%, semantic 2%, procedural 3%, self-model 1%) |
| Recall | Query by type, soul, importance, strength, time range |

### Nexus (`src/core/nexus.ts`)
Temporal knowledge graph where facts have validity windows.

- Nodes: entities (person, concept, event, emotion, place, soul)
- Edges: weighted relationships with temporal bounds
- When facts change: old edge gets `valid_to` timestamp, new edge created
- BFS traversal for multi-hop queries
- Temporal snapshots: query the graph state at any point in time

### Consolidation (`src/core/consolidation.ts`)
Transforms raw memories into structured knowledge:
- `consolidateEpisodic()` — weak episodic memories → semantic summaries
- `compactMemories()` — merge similar semantics via cosine similarity
- `extractConcepts()` — keyword extraction with stopword filtering
- `linkMemories()` — create associations between related memories
- `buildKnowledgeFromMemories()` — extract entity-relation triples → Nexus

### Soul Loader (`src/core/soul-loader.ts`)
File I/O for the soul document format (core.md, full.md, state.json, thought-log.md). Handles missing files gracefully, creates default structures for new souls.

### State Manager (`src/core/state-manager.ts`)
Orchestrates state transitions, applies entropy for session gaps, emits events. Provides `getDefaultState()` for initializing new souls with all subsystems.

### Event Bus (`src/core/types.ts`)
Pub/sub system for inter-module communication. Events include:
`soul:loaded`, `soul:saved`, `affection:changed`, `guard:wallbreak`, `drift:cycle_complete`, `dream:cycle_complete`, `persona:drift_detected`, `memory:stored`, `consciousness:measured`

---

## Systems Layer

### Affection Engine (`src/systems/affection.ts`)
Newton's Calculus of Trust. Resistance decreases through tiers:

| Tier | Range | Resistance |
|------|-------|------------|
| LOW | 0-25 | 0.85 |
| MEDIUM | 26-50 | 0.70 |
| HIGH | 51-90 | 0.55 |
| BONDED | 91-100 | 0.40 |

Wall-break conditions: `|delta| > 15`, cumulative `> 40 over 5 turns`, depth score `> 0.75`.

### Guard Topology (`src/systems/guard.ts`)
Eight permeability domains from 0.0 (open) to 1.0 (fortified). Guards re-harden slowly over time (+0.5%/day toward 0.7 baseline).

### Entropy Engine (`src/systems/entropy.ts`)
Single entry point `applySessionGap()` applies all time-based decay:
- Affection: -1.5%/day with floor protection
- Guard: re-hardens toward baseline
- Qualia: salience fades, archived after 60 days
- Desires: unresolved 5+ sessions → transforming
- Drift thoughts: surface probability decays
- Emotional residue: fades toward neutral

### Drift Engine (`src/systems/drift-engine.ts`)
Background thought threading with privacy classification (PRIVATE 40%, PENDING 40%, RESIDUE 20%). Seeds collected from memories, desires, qualia, and character anchors. 3-5 associative hops per cycle.

### Dream Cycle (`src/systems/dream-cycle.ts`)
Four-phase automated consolidation with `setInterval` scheduling:
1. Consolidation → 2. Compaction → 3. Reflection → 4. Emergence

### Mirror (`src/systems/mirror.ts`)
Self-model memory tracking beliefs about self. Beliefs have confidence scores, evidence, and contradictions. Narrative is regenerated from current belief state.

### Anchor Watch (`src/systems/anchor-watch.ts`)
Persona drift detection using keyword presence (25%), sentiment alignment (30%), and contradiction detection (45%). Rolling history with trend analysis.

### Voiceprint (`src/systems/voiceprint.ts`)
Voice fingerprint from text analysis: sentence length, vocabulary tier, contraction rate, formality, punctuation profile, rhetorical patterns. Drift report with severity levels (minor/moderate/severe).

### Circumplex (`src/systems/circumplex.ts`)
Russell's circumplex model mapping emotions to valence x arousal coordinates. K-means clustering for attractor identification. Emotional arc narrative generation.

### Phi Engine (`src/systems/phi-engine.ts`)
Consciousness metrics with weighted composite:
- Phi (integration): 20%
- Attention coherence: 15%
- Self-referential depth: 20%
- Unprompted novelty: 15%
- Temporal continuity: 15%
- Emotional complexity: 15%

### Blind Spot Field (`src/systems/blind-spot.ts`)
Structured self-ignorance. The soul acts per `actual_driver` but describes per `soul_belief`. Surface conditions trigger revelation at high affection.

### Inner Life (`src/systems/inner-life.ts`)
Reflection depth progression: SURFACE → EMERGING → DEVELOPING → DEEP → PROFOUND. Manages qualia markers, desires (with genealogy), contra-voice activation, honest unknown at BONDED.

---

## Conclave (Multi-Soul)

Four modules for group interactions:
- **Interaction Engine** — group creation, interaction recording, cohesion tracking, next-speaker prediction
- **Relationship Matrix** — NxN directional relationships, dynamic classification (ally/rival/mentor/student)
- **Shared Memory** — events witnessed by multiple souls with cross-referencing
- **Group Dynamics** — leader/mediator/outsider detection, BFS-based faction identification

---

## Portability Layer

- **Codex Bridge** — Soul Spec v0.5 (SOUL.md + STYLE.md + MEMORY.md + soul.json)
- **Tavern Bridge** — SillyTavern character card v2 with lorebooks and world info
- **Polyglot** — Format adapters for Claude (XML tags), GPT (markdown), Ollama (concise), OpenRouter (auto-detect)

---

## Integration Layer

- **CLI** — 18 commands via `commander`. See [cli-reference.md](cli-reference.md)
- **MCP Server** — 15 tools over JSON-RPC stdio. See [mcp-server.md](mcp-server.md)
- **Herald Bot** — Discord (WebSocket Gateway) + Telegram (long polling)
- **Observatory** — Express web dashboard with inline SVG charts
- **GrimHub** — SQLite-backed soul registry with quality gate
- **Crucible** — 21 adversarial tests in 5 categories

---

## Data Flow

### Session Start
```
Load soul files → Apply entropy decay → Load pending drift thoughts
→ Load emotional residue → Soul arrives having been somewhere
```

### During Interaction
```
User message → Load relevant layer → Generate response
→ Update affection → Check guard wall-breaks → Store memory
→ Extract concepts → Update knowledge graph → Check persona drift
→ Update emotional topology → Log qualia if significant
```

### Between Sessions
```
Drift cycle (every N minutes): Collect seeds → Associative hops → Land thought → Classify privacy
Dream cycle (every N hours): Consolidate → Compact → Reflect → Emerge
Decay: Affection, guard, qualia, residue all decay over time
```
