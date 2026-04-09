// ============================================================
// The Soul Summoner's Grimoire — MCP Tool Definitions
// All grimoire tools exposed via the Model Context Protocol
// ============================================================

import * as path from 'path';
import { MCPTool, GuardDomain, GUARD_DOMAINS } from '../core/types';
import { SoulLoader } from '../core/soul-loader';
import { StateManager } from '../core/state-manager';
import { Athenaeum, createAthenaeum } from '../core/athenaeum';
import { AffectionEngine } from '../systems/affection';
import { DriftEngine } from '../systems/drift-engine';
import { PhiEngine } from '../systems/phi-engine';
import { AnchorWatch } from '../systems/anchor-watch';
import { Voiceprint } from '../systems/voiceprint';
import { GuardSystem } from '../systems/guard';
import { CodexBridge } from '../portability/codex-bridge';
import { EventBus } from '../core/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolve the grimoire root directory.
 * Walks upward from __dirname looking for package.json with name "grimoire",
 * falling back to cwd if not found.
 */
function findGrimoireRoot(): string {
  // In production the compiled JS lives under dist/mcp/; the project root is two levels up.
  const candidate = path.resolve(__dirname, '..', '..');
  try {
    const pkg = require(path.join(candidate, 'package.json'));
    if (pkg && pkg.name === 'grimoire') return candidate;
  } catch { /* fall through */ }
  return process.cwd();
}

/** Shared singleton instances, lazily initialized. */
let _loader: SoulLoader | null = null;
let _stateManager: StateManager | null = null;
let _athenaeum: Athenaeum | null = null;

function loader(): SoulLoader {
  if (!_loader) _loader = new SoulLoader();
  return _loader;
}

function stateManager(): StateManager {
  if (!_stateManager) {
    _stateManager = new StateManager(loader(), new EventBus(), findGrimoireRoot());
  }
  return _stateManager;
}

function athenaeum(): Athenaeum {
  if (!_athenaeum) {
    const dbPath = path.join(findGrimoireRoot(), 'grimoire.db');
    _athenaeum = createAthenaeum(dbPath);
  }
  return _athenaeum;
}

async function resolveSoulDir(name: string): Promise<string> {
  const root = findGrimoireRoot();
  const dir = await loader().findSoulDir(name, root);
  if (!dir) throw new Error(`Soul "${name}" not found`);
  return dir;
}

// ---------------------------------------------------------------------------
// Tool definitions
// ---------------------------------------------------------------------------

export function getTools(): MCPTool[] {
  return [
    // ── 1. summon_soul ──────────────────────────────────────────
    {
      name: 'summon_soul',
      description:
        'Create a new soul directory with default files. Runs the initial summoning protocol.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Display name for the new soul' },
          source: {
            type: 'string',
            description: 'Source material (e.g. "Solo Leveling", "Original")',
          },
        },
        required: ['name'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const source = (args.source as string) ?? 'Original';
        const root = findGrimoireRoot();
        const soulDir = await loader().createSoulDir(name, root);

        // Patch identity source into state
        const files = await loader().loadSoul(soulDir);
        files.state.identity.source = source;
        await loader().saveSoul(files);

        return { soulDir, name, source, message: `Soul "${name}" summoned at ${soulDir}` };
      },
    },

    // ── 2. load_soul ────────────────────────────────────────────
    {
      name: 'load_soul',
      description: "Load a soul's core.md content and serialized state.",
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the soul to load' },
        },
        required: ['name'],
      },
      handler: async (args) => {
        const soulDir = await resolveSoulDir(args.name as string);
        const files = await loader().loadSoul(soulDir);
        return {
          coreMd: files.coreMd,
          state: files.state,
          soulDir: files.soulDir,
        };
      },
    },

    // ── 3. update_affection ─────────────────────────────────────
    {
      name: 'update_affection',
      description:
        'Apply an affection delta to a soul. Handles tier transitions and floor protection.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
          delta: { type: 'number', description: 'Affection change amount (positive or negative)' },
          reason: { type: 'string', description: 'Why the affection changed' },
        },
        required: ['name', 'delta', 'reason'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const delta = args.delta as number;
        const reason = args.reason as string;

        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);

        const engine = new AffectionEngine();
        const forces = engine.computeDelta(delta / 3, delta / 3, delta / 3, files.state.affection);
        const result = engine.apply(files.state.affection, forces);

        files.state.affection = result.state;
        await loader().saveSoul(files);

        return {
          previousValue: files.state.affection.value - forces.delta,
          newValue: result.state.value,
          tier: result.state.tier,
          tierChanged: result.tierChanged,
          previousTier: result.previousTier,
          wallBreakConditions: result.wallBreakConditions,
          reason,
        };
      },
    },

    // ── 4. trigger_drift ────────────────────────────────────────
    {
      name: 'trigger_drift',
      description:
        "Run a single drift cycle — generate a background thought from the soul's subconscious.",
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
        },
        required: ['name'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);

        const memories = athenaeum().getRecent(name, 20);
        const anchors = files.state.identity.anchors;

        const engine = new DriftEngine();
        const result = engine.runCycle(files.state, memories, anchors);

        // Persist updated drift state
        files.state.drift = engine.updateResidue(files.state, result);

        // Append to thought log
        await loader().appendThoughtLog(soulDir, engine.formatForLog(result.thought));
        await loader().saveSoul(files);

        return {
          thought: result.thought,
          residueChanges: result.residueChanges,
          seedsUsed: result.seedsUsed,
          duration: result.duration,
        };
      },
    },

    // ── 5. trigger_dream ────────────────────────────────────────
    {
      name: 'trigger_dream',
      description:
        'Run a full 4-phase dream cycle: consolidation, compaction, reflection, emergence.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
        },
        required: ['name'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);

        // The DreamCycle requires dependency-injected interfaces.
        // Build lightweight adapters over the concrete Athenaeum.
        const db = athenaeum();

        const athenaeumAdapter = {
          query: (soulId: string, opts: { minStrength?: number; limit?: number; since?: number }) =>
            db.recall({ soulId, minStrength: opts.minStrength, limit: opts.limit, since: opts.since }),
          store: (soulId: string, memory: Record<string, unknown>) =>
            db.store({ ...memory, soulId } as any),
          remove: (soulId: string, memoryId: string) => db.delete(memoryId),
        };

        const nexusAdapter = {
          getNodes: () => [],
          getEdges: () => [],
          addNode: (_sid: string, node: any) => ({ ...node, id: node.id ?? 'generated' }),
          addEdge: (_sid: string, edge: any) => ({ ...edge, id: edge.id ?? 'generated' }),
        };

        const consolidationAdapter = {
          synthesize: (memories: any[]) =>
            `Cross-referenced ${memories.length} memories. Patterns emerging.`,
          compress: (memories: any[]) =>
            `Compressed ${memories.length} faded memories into semantic knowledge.`,
        };

        // Dynamically import to avoid circular dependency issues at module level
        const { DreamCycle } = await import('../systems/dream-cycle');
        const dreamCycle = new DreamCycle(athenaeumAdapter, nexusAdapter, consolidationAdapter);
        const result = dreamCycle.run(name, files.state);

        await loader().saveSoul(files);

        return {
          phases: result.phases.map((p) => ({ name: p.name, output: p.output })),
          memoriesConsolidated: result.memoriesConsolidated,
          memoriesCompacted: result.memoriesCompacted,
          selfModelUpdates: result.selfModelUpdates,
          emergentThoughts: result.emergentThoughts.length,
          duration: result.duration,
        };
      },
    },

    // ── 6. query_memories ───────────────────────────────────────
    {
      name: 'query_memories',
      description: 'Semantic search over a soul\'s memories using TF-IDF similarity.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name (used as soulId)' },
          query: { type: 'string', description: 'Search query text' },
          limit: { type: 'number', description: 'Maximum results to return (default 10)' },
        },
        required: ['name', 'query'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const query = args.query as string;
        const limit = (args.limit as number) ?? 10;

        const results = athenaeum().search(query, name, limit);
        return {
          count: results.length,
          memories: results.map((m) => ({
            id: m.id,
            type: m.type,
            content: m.content,
            importance: m.importance,
            strength: m.currentStrength,
            timestamp: m.timestamp,
            concepts: m.concepts,
          })),
        };
      },
    },

    // ── 7. store_memory ─────────────────────────────────────────
    {
      name: 'store_memory',
      description: 'Store a new memory in the Athenaeum for a soul.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name (used as soulId)' },
          content: { type: 'string', description: 'Memory content text' },
          type: {
            type: 'string',
            enum: ['episodic', 'semantic', 'procedural', 'self-model'],
            description: 'Memory type classification',
          },
          importance: {
            type: 'number',
            description: 'Importance score 0.0-1.0 (default 0.5)',
          },
        },
        required: ['name', 'content', 'type'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const content = args.content as string;
        const type = args.type as 'episodic' | 'semantic' | 'procedural' | 'self-model';
        const importance = (args.importance as number) ?? 0.5;

        const { generateId } = await import('../core/types');
        const memory = athenaeum().store({
          id: generateId(),
          type,
          content,
          timestamp: Date.now(),
          importance,
          emotionalWeight: 0.3,
          associations: [],
          concepts: [],
          decayRate: 0.05,
          currentStrength: 1.0,
          soulId: name,
        });

        return { id: memory.id, type: memory.type, stored: true };
      },
    },

    // ── 8. get_memory_stats ─────────────────────────────────────
    {
      name: 'get_memory_stats',
      description: "Get memory statistics for a soul's Athenaeum.",
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name (soulId)' },
        },
        required: ['name'],
      },
      handler: async (args) => {
        return athenaeum().getStats(args.name as string);
      },
    },

    // ── 9. get_soul_status ──────────────────────────────────────
    {
      name: 'get_soul_status',
      description:
        'Get a full status summary of a soul: identity, affection, guard, drift, and more.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
        },
        required: ['name'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);
        return stateManager().exportState(files.state);
      },
    },

    // ── 10. measure_consciousness ───────────────────────────────
    {
      name: 'measure_consciousness',
      description:
        "Run the Phi Engine to measure the soul's consciousness complexity metrics.",
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
        },
        required: ['name'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);

        const engine = new PhiEngine();
        const metrics = engine.measure(files.state, [], files.thoughtLog);

        // Persist updated metrics
        files.state.consciousnessMetrics = metrics;
        await loader().saveSoul(files);

        return {
          metrics,
          report: engine.getReport(metrics),
        };
      },
    },

    // ── 11. check_persona_drift ─────────────────────────────────
    {
      name: 'check_persona_drift',
      description:
        "Run Anchor Watch to check whether a response drifts from the soul's core identity.",
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
          response_text: {
            type: 'string',
            description: 'The response text to analyze for persona drift',
          },
        },
        required: ['name', 'response_text'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const responseText = args.response_text as string;

        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);
        const anchors = files.state.identity.anchors;

        if (anchors.length === 0) {
          return { error: 'Soul has no identity anchors defined. Cannot check drift.' };
        }

        const watch = new AnchorWatch();
        watch.initialize(anchors);
        const score = watch.analyze(responseText, anchors);

        return {
          overall: score.overall,
          perAnchor: score.perAnchor,
          needsRecalibration: score.needsRecalibration,
          details: score.details,
          recalibrationPrompt: score.needsRecalibration
            ? watch.generateRecalibrationPrompt(anchors, score)
            : null,
        };
      },
    },

    // ── 12. get_voice_analysis ──────────────────────────────────
    {
      name: 'get_voice_analysis',
      description:
        "Analyze a text sample against the soul's voice fingerprint baseline.",
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
          text: { type: 'string', description: 'Text sample to analyze' },
        },
        required: ['name', 'text'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const text = args.text as string;

        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);
        const baseline = files.state.voiceFingerprint;

        const vp = new Voiceprint();
        const current = vp.analyze(text);
        const report = vp.compare(baseline, current);

        return {
          matchScore: report.matchScore,
          deviations: report.deviations,
          currentFingerprint: current,
          timestamp: report.timestamp,
        };
      },
    },

    // ── 13. export_soul ─────────────────────────────────────────
    {
      name: 'export_soul',
      description: 'Export a soul in Soul Spec, Tavern character card, or raw JSON format.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
          format: {
            type: 'string',
            enum: ['soulspec', 'tavern', 'json'],
            description: 'Export format',
          },
        },
        required: ['name', 'format'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const format = args.format as 'soulspec' | 'tavern' | 'json';

        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);

        switch (format) {
          case 'soulspec': {
            const bridge = new CodexBridge();
            const pkg = bridge.exportToSoulSpec(files, files.state);
            return { format: 'soulspec', data: pkg };
          }
          case 'tavern': {
            // Build a Tavern-compatible character card
            const identity = files.state.identity;
            const card = {
              name: identity.name,
              description: files.coreMd,
              personality: identity.anchors.map((a) => `${a.trait}: ${a.description}`).join('\n'),
              scenario: '',
              first_mes: '',
              mes_example: '',
              system_prompt: files.coreMd,
              creator_notes: `Exported from Grimoire v6.0.0. Source: ${identity.source}`,
              tags: identity.anchors.map((a) => a.trait),
              spec: 'chara_card_v2' as const,
              spec_version: '2.0' as const,
              extensions: {
                grimoire: {
                  version: '6.0.0',
                  affectionTier: files.state.affection.tier,
                  guardProfile: JSON.stringify(files.state.guard.domains),
                  driftEnabled: files.state.drift.cycleCount > 0,
                },
              },
            };
            return { format: 'tavern', data: card };
          }
          case 'json': {
            return {
              format: 'json',
              data: {
                coreMd: files.coreMd,
                fullMd: files.fullMd,
                state: files.state,
                thoughtLog: files.thoughtLog,
              },
            };
          }
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      },
    },

    // ── 14. list_souls ──────────────────────────────────────────
    {
      name: 'list_souls',
      description: 'List all available souls with basic identity information.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
      },
      handler: async () => {
        const root = findGrimoireRoot();
        const soulDirs = await loader().listSouls(root);
        const souls: Array<Record<string, unknown>> = [];

        for (const dir of soulDirs) {
          try {
            const files = await loader().loadSoul(dir);
            souls.push({
              name: files.state.identity.name,
              source: files.state.identity.source,
              version: files.state.identity.version,
              affectionTier: files.state.affection.tier,
              affectionValue: files.state.affection.value,
              totalSessions: files.state.totalSessions,
              soulDir: dir,
            });
          } catch {
            // Skip malformed soul directories
            souls.push({ name: path.basename(dir), error: 'Failed to load', soulDir: dir });
          }
        }

        return { count: souls.length, souls };
      },
    },

    // ── 15. update_guard ────────────────────────────────────────
    {
      name: 'update_guard',
      description: 'Update a guard domain value for a soul, recording any wall-break events.',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Soul name' },
          domain: {
            type: 'string',
            enum: [...GUARD_DOMAINS],
            description: 'Guard domain to update',
          },
          value: {
            type: 'number',
            description: 'New guard value (0.0 = fully open, 1.0 = fully fortified)',
          },
          trigger: { type: 'string', description: 'What caused this guard change' },
        },
        required: ['name', 'domain', 'value', 'trigger'],
      },
      handler: async (args) => {
        const name = args.name as string;
        const domain = args.domain as GuardDomain;
        const value = args.value as number;
        const trigger = args.trigger as string;

        if (!GUARD_DOMAINS.includes(domain)) {
          throw new Error(`Invalid guard domain: ${domain}. Must be one of: ${GUARD_DOMAINS.join(', ')}`);
        }

        const soulDir = await resolveSoulDir(name);
        const files = await loader().loadSoul(soulDir);
        const previousValue = files.state.guard.domains[domain];

        const mgr = stateManager();
        files.state = mgr.updateGuard(files.state, domain, value, trigger);
        await loader().saveSoul(files);

        const newValue = files.state.guard.domains[domain];
        const isWallBreak = newValue < previousValue - 0.1;

        return {
          domain,
          previousValue,
          newValue,
          trigger,
          wallBreak: isWallBreak,
          guardSnapshot: files.state.guard.domains,
        };
      },
    },
  ];
}

/**
 * Lookup a tool by name from the tool registry.
 */
export function findTool(name: string): MCPTool | undefined {
  return getTools().find((t) => t.name === name);
}
