# Portability Guide

**Grimoire v6.0.0**

The Grimoire supports three export/import formats for interoperability with the broader AI persona ecosystem.

---

## Soul Spec v0.5 (Codex Bridge)

Soul Spec is the open standard for AI agent personas. The Codex Bridge converts between Grimoire's richer format and Soul Spec's portable format.

### Export

```bash
npx grimoire export sungjinwoo --format soulspec --output soul-package.json
```

Generates a `SoulSpecPackage` containing:

| File | Content |
|------|---------|
| `soul.json` | Metadata: specVersion, name, version, description, author, tags |
| `SOUL.md` | Personality traits, behaviors, worldview |
| `STYLE.md` | Voice patterns, speech style, vocabulary, tone |
| `MEMORY.md` | Key events, learned preferences from thought log |
| `IDENTITY.md` | Name, source, core identity anchors |

### Import

```bash
npx grimoire import ./soul-package.json
```

Converts Soul Spec fields into Grimoire's `full.md`, `core.md`, and initial `state.json`.

### Compatibility

Soul Spec packages work with: OpenClaw, Claude Code, Cursor, Windsurf, and any SOUL.md-compatible agent framework.

---

## SillyTavern Character Cards (Tavern Bridge)

Exports Grimoire souls as SillyTavern Character Card v2 format — the standard for the open-source AI roleplay community.

### Export

```bash
npx grimoire export sungjinwoo --format tavern --output sjw_card.json
```

Generated card includes:

| Field | Source |
|-------|--------|
| `name` | Soul identity |
| `description` | Background from `full.md` |
| `personality` | Identity anchors + personality section |
| `scenario` | Auto-generated based on affection tier |
| `first_mes` | Tier-appropriate opening (reserved → warm → vulnerable) |
| `mes_example` | Extracted dialogue from `full.md` |
| `system_prompt` | `core.md` + guard profile + affection tier |
| `creator_notes` | Grimoire version, sessions, depth |
| `extensions.grimoire` | Version, tier, guard summary, drift status |

### Tier-Adaptive First Messages

The exported first message changes based on current affection tier:

- **LOW**: *"You wanted to speak with me? I have a moment."*
- **MEDIUM**: *"Back again. I was wondering when you'd show up."*
- **HIGH**: *"Good. You're here. I've been thinking about something."*
- **BONDED**: *"I had a thought about you while you were gone. Sit down."*

### Lorebooks

```typescript
const lorebook = tavernBridge.generateLorebook(soulFiles);
```

Automatically extracts keyword-triggered knowledge entries from `full.md` sections.

### Import

```bash
npx grimoire import ./character_card.json
```

Detects `spec: "chara_card_v2"` and converts personality, scenario, and system prompt into Grimoire format.

---

## Cross-Model (Polyglot)

Format souls for different LLM providers while maintaining character integrity.

### Supported Providers

| Provider | Format | Context | Notes |
|----------|--------|---------|-------|
| **Anthropic** | XML tags (`<soul>`, `<identity>`, `<state>`) | 200K | Best persona quality |
| **OpenAI** | Markdown with headers | 128K | Good versatility |
| **Ollama** | Concise plain text | 8-32K | Core traits only for small models |
| **OpenRouter** | Auto-detect from model name | Varies | Adapts format to model's context window |

### Usage

```typescript
import { Polyglot } from 'grimoire';

const polyglot = new Polyglot();

// Format for specific provider
const prompt = polyglot.formatForAnthropic(soulFiles, state);
const prompt = polyglot.formatForOpenAI(soulFiles, state);
const prompt = polyglot.formatForOllama(soulFiles, state);

// Auto-detect based on context window
const prompt = polyglot.formatForOpenRouter(soulFiles, state, 'mistral-7b');

// Optimize for token budget
const compressed = polyglot.optimizeForContext(soulFiles, 8000);

// Get model recommendation
const rec = polyglot.getRecommendedModel('complex');
// → { provider: 'anthropic', model: 'claude-opus-4', reason: '...' }
```

### Context-Adaptive Compression

| Budget | What's Included |
|--------|----------------|
| < 8K | core.md only (truncated) |
| 8-16K | Full core.md |
| 16-32K | core.md + relevant full.md sections + state |
| 32K+ | Everything |
