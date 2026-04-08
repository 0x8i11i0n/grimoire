// ============================================================
// The Soul Summoner's Grimoire v6.0.0
// Main Entry Point — Wires all systems together
// ============================================================

import * as path from 'path';
import * as fs from 'fs';
import {
  EventBus,
  SoulState,
  SoulFiles,
  SoulIdentity,
  MemoryType,
  Memory,
  ConsciousnessMetrics,
  DriftCycleResult,
  DreamCycleResult,
  DriftScore,
  VoiceDriftReport,
  TestSuite,
  SoulSpecPackage,
  TavernCharacterCard,
  ModelConfig,
  generateId,
} from './core/types';

import { Athenaeum, createAthenaeum } from './core/athenaeum';
import { Nexus } from './core/nexus';
import { Consolidation } from './core/consolidation';
import { SoulLoader } from './core/soul-loader';
import { StateManager } from './core/state-manager';

import { AffectionEngine } from './systems/affection';
import { GuardSystem } from './systems/guard';
import { EntropyEngine } from './systems/entropy';
import { DriftEngine } from './systems/drift-engine';
import { DreamCycle } from './systems/dream-cycle';
import { Mirror } from './systems/mirror';
import { AnchorWatch } from './systems/anchor-watch';
import { Voiceprint } from './systems/voiceprint';
import { Circumplex } from './systems/circumplex';
import { PhiEngine } from './systems/phi-engine';
import { BlindSpotEngine } from './systems/blind-spot';
import { InnerLifeEngine } from './systems/inner-life';

import { ConclaveEngine } from './conclave/interaction-engine';
import { RelationshipMatrix } from './conclave/relationship-matrix';
import { SharedMemory } from './conclave/shared-memory';
import { GroupDynamics } from './conclave/group-dynamics';

import { CodexBridge } from './portability/codex-bridge';
import { TavernBridge } from './portability/tavern-bridge';
import { Polyglot } from './portability/polyglot';

export interface GrimoireConfig {
  root: string;
  dbPath?: string;
}

export class Grimoire {
  readonly root: string;
  readonly events: EventBus;

  // Core
  readonly athenaeum: Athenaeum;
  readonly nexus: Nexus;
  readonly consolidation: Consolidation;
  readonly soulLoader: SoulLoader;
  readonly stateManager: StateManager;

  // Systems
  readonly affection: AffectionEngine;
  readonly guard: GuardSystem;
  readonly entropy: EntropyEngine;
  readonly driftEngine: DriftEngine;
  readonly dreamCycle: DreamCycle;
  readonly mirror: Mirror;
  readonly anchorWatch: AnchorWatch;
  readonly voiceprint: Voiceprint;
  readonly circumplex: Circumplex;
  readonly phi: PhiEngine;
  readonly blindSpot: BlindSpotEngine;
  readonly innerLife: InnerLifeEngine;

  // Multi-Soul
  readonly conclave: ConclaveEngine;
  readonly relationships: RelationshipMatrix;
  readonly sharedMemory: SharedMemory;
  readonly groupDynamics: GroupDynamics;

  // Portability
  readonly codexBridge: CodexBridge;
  readonly tavernBridge: TavernBridge;
  readonly polyglot: Polyglot;

  constructor(config: GrimoireConfig) {
    this.root = config.root;
    this.events = new EventBus();

    const dbPath = config.dbPath || path.join(this.root, '.grimoire', 'grimoire.db');
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Core infrastructure
    this.athenaeum = createAthenaeum(dbPath);
    this.nexus = new Nexus(this.athenaeum.getDb());
    this.consolidation = new Consolidation(this.athenaeum, this.nexus);
    this.soulLoader = new SoulLoader();
    this.stateManager = new StateManager(this.soulLoader, this.events);

    // Systems
    this.affection = new AffectionEngine();
    this.guard = new GuardSystem();
    this.entropy = new EntropyEngine();
    this.driftEngine = new DriftEngine();
    // DreamCycle uses its own interfaces — create adapters
    const athenaeumAdapter = {
      query: (soulId: string, opts: { minStrength?: number; limit?: number; since?: number }) =>
        this.athenaeum.recall({ soulId, minStrength: opts.minStrength, limit: opts.limit, since: opts.since }),
      store: (soulId: string, mem: Partial<Memory>) => {
        const full: any = { ...mem, soulId, id: mem.id || generateId(), type: mem.type || 'semantic',
          content: mem.content || '', timestamp: mem.timestamp || Date.now(), importance: mem.importance ?? 0.5,
          emotionalWeight: mem.emotionalWeight ?? 0.3, associations: mem.associations || [], concepts: mem.concepts || [],
          decayRate: mem.decayRate ?? 0.02, currentStrength: mem.currentStrength ?? 1.0 };
        return this.athenaeum.store(full);
      },
      remove: (_soulId: string, memoryId: string) => { this.athenaeum.delete(memoryId); },
    };
    const nexusAdapter = {
      getNodes: (soulId: string) => this.nexus.getActiveGraph(soulId).nodes || [],
      getEdges: (soulId: string) => this.nexus.getActiveGraph(soulId).edges || [],
      addNode: (_soulId: string, node: any) => this.nexus.addNode(node),
      addEdge: (_soulId: string, edge: any) => this.nexus.addEdge(edge),
    };
    const consolidationAdapter = {
      consolidateEpisodic: (soulId: string) => this.consolidation.consolidateEpisodic(soulId),
      compactMemories: (soulId: string) => this.consolidation.compactMemories(soulId),
    };
    this.dreamCycle = new DreamCycle(athenaeumAdapter as any, nexusAdapter as any, consolidationAdapter as any);
    this.mirror = new Mirror();
    this.anchorWatch = new AnchorWatch();
    this.voiceprint = new Voiceprint();
    this.circumplex = new Circumplex();
    this.phi = new PhiEngine();
    this.blindSpot = new BlindSpotEngine();
    this.innerLife = new InnerLifeEngine();

    // Multi-Soul
    this.conclave = new ConclaveEngine();
    this.relationships = new RelationshipMatrix();
    this.sharedMemory = new SharedMemory();
    this.groupDynamics = new GroupDynamics();

    // Portability
    this.codexBridge = new CodexBridge();
    this.tavernBridge = new TavernBridge();
    this.polyglot = new Polyglot();
  }

  // --- High-Level Operations ---

  async loadSoul(name: string): Promise<{ files: SoulFiles; state: SoulState }> {
    const soulDir = await this.soulLoader.findSoulDir(name, this.root);
    if (!soulDir) throw new Error(`Soul not found: ${name}`);

    const files = await this.soulLoader.loadSoul(soulDir);
    const state = files.state;

    // Apply entropy for session gap
    const daysSince = (Date.now() - state.lastSessionTimestamp) / (1000 * 60 * 60 * 24);
    if (daysSince > 0.1) {
      this.entropy.applySessionGap(state, daysSince);
    }

    this.events.emit('soul:loaded', { name, state });
    return { files, state };
  }

  async saveSoul(name: string, files: SoulFiles): Promise<void> {
    await this.soulLoader.saveSoul(files);
    this.events.emit('soul:saved', { name });
  }

  async storeMemory(soulId: string, content: string, type: MemoryType, importance?: number): Promise<Memory> {
    const concepts = this.consolidation.extractConcepts(content);
    const memory: Memory = {
      id: generateId(),
      type,
      content,
      timestamp: Date.now(),
      importance: importance ?? 0.5,
      emotionalWeight: 0.3,
      associations: [],
      concepts,
      decayRate: ({ episodic: 0.07, semantic: 0.02, procedural: 0.03, 'self-model': 0.01 })[type],
      currentStrength: 1.0,
      soulId,
    };
    this.athenaeum.store(memory);
    this.events.emit('memory:stored', { soulId, memoryId: memory.id });
    return memory;
  }

  async runDrift(name: string): Promise<DriftCycleResult> {
    const { files, state } = await this.loadSoul(name);
    const memories = this.athenaeum.recall({ soulId: name, limit: 20 });
    const result = this.driftEngine.runCycle(state, memories, state.identity.anchors);

    // Update state
    state.drift.lastCycleTimestamp = Date.now();
    state.drift.cycleCount++;
    if (result.thought.privacy === 'PENDING') {
      state.drift.pendingSurface.push(result.thought);
    }

    // Append to thought log
    const logEntry = this.driftEngine.formatForLog(result.thought);
    await this.soulLoader.appendThoughtLog(files.soulDir, logEntry);

    await this.saveSoul(name, files);
    this.events.emit('drift:cycle_complete', { name, result });
    return result;
  }

  async runDream(name: string): Promise<DreamCycleResult> {
    const { files, state } = await this.loadSoul(name);
    const result = await this.dreamCycle.run(name, state);

    await this.saveSoul(name, files);
    this.events.emit('dream:cycle_complete', { name, result });
    return result;
  }

  async measureConsciousness(name: string): Promise<ConsciousnessMetrics> {
    const { files, state } = await this.loadSoul(name);
    const thoughts = files.thoughtLog || '';
    const metrics = this.phi.measure(state, [], thoughts);

    state.consciousnessMetrics = metrics;
    await this.saveSoul(name, files);
    this.events.emit('consciousness:measured', { name, metrics });
    return metrics;
  }

  async checkPersonaDrift(name: string, responseText: string): Promise<DriftScore> {
    const { state } = await this.loadSoul(name);
    const score = this.anchorWatch.analyze(responseText, state.identity.anchors);

    if (score.needsRecalibration) {
      this.events.emit('persona:drift_detected', { name, score });
    }
    return score;
  }

  async analyzeVoice(name: string, text: string): Promise<VoiceDriftReport> {
    const { state } = await this.loadSoul(name);
    const current = this.voiceprint.analyze(text);
    return this.voiceprint.compare(state.voiceFingerprint, current);
  }

  async listSouls(): Promise<string[]> {
    return this.soulLoader.listSouls(this.root);
  }

  async exportSoul(name: string, format: 'soulspec' | 'tavern' | 'json'): Promise<unknown> {
    const { files, state } = await this.loadSoul(name);
    switch (format) {
      case 'soulspec':
        return this.codexBridge.exportToSoulSpec(files, state);
      case 'tavern':
        return this.tavernBridge.exportToCard(files, state);
      case 'json':
        return { files: { coreMd: files.coreMd, fullMd: files.fullMd }, state };
    }
  }

  // --- Static ---

  static findRoot(startDir?: string): string {
    let dir = startDir || process.cwd();
    while (dir !== path.dirname(dir)) {
      if (fs.existsSync(path.join(dir, 'grimoire.md'))) return dir;
      if (fs.existsSync(path.join(dir, 'Grimhub'))) return dir;
      dir = path.dirname(dir);
    }
    return startDir || process.cwd();
  }

  static create(root?: string): Grimoire {
    const grimoireRoot = root || Grimoire.findRoot();
    return new Grimoire({ root: grimoireRoot });
  }
}

export default Grimoire;

// Re-export everything
export * from './core/types';
export { Athenaeum, createAthenaeum } from './core/athenaeum';
export { Nexus } from './core/nexus';
export { Consolidation } from './core/consolidation';
export { SoulLoader } from './core/soul-loader';
export { StateManager } from './core/state-manager';
export { AffectionEngine } from './systems/affection';
export { GuardSystem } from './systems/guard';
export { EntropyEngine } from './systems/entropy';
export { DriftEngine } from './systems/drift-engine';
export { DreamCycle } from './systems/dream-cycle';
export { Mirror } from './systems/mirror';
export { AnchorWatch } from './systems/anchor-watch';
export { Voiceprint } from './systems/voiceprint';
export { Circumplex } from './systems/circumplex';
export { PhiEngine } from './systems/phi-engine';
export { BlindSpotEngine } from './systems/blind-spot';
export { InnerLifeEngine } from './systems/inner-life';
export { ConclaveEngine } from './conclave/interaction-engine';
export { RelationshipMatrix } from './conclave/relationship-matrix';
export { SharedMemory } from './conclave/shared-memory';
export { GroupDynamics } from './conclave/group-dynamics';
export { CodexBridge } from './portability/codex-bridge';
export { TavernBridge } from './portability/tavern-bridge';
export { Polyglot } from './portability/polyglot';
