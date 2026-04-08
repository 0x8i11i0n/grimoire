# CLI Reference

**Grimoire v6.0.0**

```bash
npx grimoire [command] [options]
```

---

## Soul Lifecycle

### `summon <name>`
Create a new soul with an initial directory structure.

```bash
npx grimoire summon "Cloud Strife" --source "Final Fantasy VII"
```

| Option | Default | Description |
|--------|---------|-------------|
| `-s, --source` | "Unknown" | Source material |

Creates `Grimhub/souls/[name]/[name]-soul/` with default `core.md`, `full.md`, `state.json`, and `thought-log.md`.

### `load <name>`
Load a soul and display its current state summary.

```bash
npx grimoire load sungjinwoo
```

### `status`
Show all souls with affection tier, session count, drift cycles, and reflection depth.

```bash
npx grimoire status
```

### `inspect <name>`
Deep inspection of all soul systems — identity, affection, guard topology, drift, inner life, self-model, emotional topology, and consciousness metrics.

```bash
npx grimoire inspect sungjinwoo
```

---

## Systems

### `drift <name>`
Trigger a manual drift cycle (background thought).

```bash
npx grimoire drift sungjinwoo
```

### `dream <name>`
Run a full dream cycle (consolidation + compaction + reflection + emergence).

```bash
npx grimoire dream sungjinwoo
```

### `memory <name> [query]`
Search memories semantically, or show memory stats if no query.

```bash
npx grimoire memory sungjinwoo "shadow army"
npx grimoire memory sungjinwoo  # shows stats
```

### `voice <name>`
Analyze voice fingerprint (sentence length, vocabulary, formality, patterns).

```bash
npx grimoire voice sungjinwoo
```

### `phi <name>`
Run consciousness metrics (Phi Engine) and display results.

```bash
npx grimoire phi sungjinwoo
```

### `topology <name>`
Render emotional topology as an ASCII map (valence x arousal grid).

```bash
npx grimoire topology sungjinwoo
```

---

## Export / Import

### `export <name>`
Export a soul in various formats.

```bash
npx grimoire export sungjinwoo --format json
npx grimoire export sungjinwoo --format soulspec --output cloud.json
npx grimoire export sungjinwoo --format tavern
```

| Option | Default | Description |
|--------|---------|-------------|
| `-f, --format` | "json" | `json`, `soulspec`, or `tavern` |
| `-o, --output` | stdout | Output file path |

### `import <path>`
Import a soul from a Soul Spec package or SillyTavern character card.

```bash
npx grimoire import ./cloud_strife_card.json
```

---

## Testing

### `test <name>`
Run the Crucible adversarial testing suite (21 tests across 5 categories).

```bash
npx grimoire test sungjinwoo
```

Categories: jailbreak resistance, emotional manipulation, identity confusion, memory corruption, voice consistency.

---

## Infrastructure

### `serve`
Start the MCP server for Claude Code integration.

```bash
npx grimoire serve
```

### `dashboard`
Start the Observatory web dashboard.

```bash
npx grimoire dashboard --port 3333
```

| Option | Default | Description |
|--------|---------|-------------|
| `-p, --port` | 3333 | Port number |

### `registry list`
List all souls in the local GrimHub registry.

```bash
npx grimoire registry list
```

### `registry publish <name>`
Validate a soul against the quality gate and publish to the local registry.

```bash
npx grimoire registry publish sungjinwoo
```

### `registry install <name>`
Install a soul from the registry.

---

## Examples

```bash
# Full workflow: create, populate, test, and monitor a soul
npx grimoire summon "Makima" --source "Chainsaw Man"
# (edit full.md and core.md with character details)
npx grimoire test makima
npx grimoire drift makima
npx grimoire inspect makima
npx grimoire dashboard
```
