# MCP Server Reference

**Grimoire v6.0.0**

The Grimoire MCP server exposes 15 tools for Claude Code integration via the Model Context Protocol (JSON-RPC over stdio).

---

## Setup

Add to your Claude Code MCP configuration:

```json
{
  "mcpServers": {
    "grimoire": {
      "command": "node",
      "args": ["/path/to/grimoire/dist/mcp/server.js"]
    }
  }
}
```

Start manually:
```bash
npx grimoire serve
```

---

## Available Tools

### Soul Management

#### `summon_soul`
Create a new soul directory with default files.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Character name |
| `source` | string | no | Source material |

#### `load_soul`
Load a soul's core.md content and serialized state.

| Parameter | Type | Required |
|-----------|------|----------|
| `name` | string | yes |

#### `get_soul_status`
Get full soul status including all system states.

| Parameter | Type | Required |
|-----------|------|----------|
| `name` | string | yes |

#### `list_souls`
List all available souls with basic info.

*No parameters.*

#### `export_soul`
Export a soul in various formats.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Soul name |
| `format` | string | yes | `soulspec`, `tavern`, or `json` |

---

### State Updates

#### `update_affection`
Apply an affection change with Newton's Calculus.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Soul name |
| `delta` | number | yes | Affection change (-100 to 100) |
| `reason` | string | yes | What caused the change |

#### `update_guard`
Update a guard topology domain.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Soul name |
| `domain` | string | yes | Guard domain name |
| `value` | number | yes | New value (0.0-1.0) |
| `trigger` | string | yes | What caused the change |

---

### Memory

#### `store_memory`
Store a new memory in the Athenaeum.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Soul name |
| `content` | string | yes | Memory content |
| `type` | string | yes | `episodic`, `semantic`, `procedural`, or `self-model` |
| `importance` | number | no | 0.0-1.0 (default: 0.5) |

#### `query_memories`
Semantic search over a soul's memories using TF-IDF similarity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Soul name |
| `query` | string | yes | Search text |
| `limit` | number | no | Max results (default: 10) |

#### `get_memory_stats`
Get memory statistics (count by type, average strength/importance).

| Parameter | Type | Required |
|-----------|------|----------|
| `name` | string | yes |

---

### Analysis

#### `trigger_drift`
Run a drift cycle (background thought).

| Parameter | Type | Required |
|-----------|------|----------|
| `name` | string | yes |

Returns the generated thought with privacy classification and emotional weight.

#### `trigger_dream`
Run a full 4-phase dream cycle.

| Parameter | Type | Required |
|-----------|------|----------|
| `name` | string | yes |

Returns consolidation/compaction/reflection/emergence results.

#### `measure_consciousness`
Run the Phi Engine and return consciousness metrics.

| Parameter | Type | Required |
|-----------|------|----------|
| `name` | string | yes |

#### `check_persona_drift`
Check if a response drifts from the soul's core identity.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Soul name |
| `response_text` | string | yes | The response to analyze |

Returns drift score with per-anchor breakdown and recalibration prompt if needed.

#### `get_voice_analysis`
Compare text against the soul's voice fingerprint baseline.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | yes | Soul name |
| `text` | string | yes | Text to analyze |

---

## Protocol

The server implements MCP over stdio with line-delimited JSON-RPC 2.0:

```
→ {"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}
← {"jsonrpc":"2.0","id":1,"result":{"serverInfo":{"name":"grimoire-mcp","version":"6.0.0"},...}}

→ {"jsonrpc":"2.0","id":2,"method":"tools/list"}
← {"jsonrpc":"2.0","id":2,"result":{"tools":[...]}}

→ {"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"load_soul","arguments":{"name":"sungjinwoo"}}}
← {"jsonrpc":"2.0","id":3,"result":{"content":[{"type":"text","text":"..."}]}}
```
