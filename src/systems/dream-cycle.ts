// ============================================================
// The Soul Summoner's Grimoire — Dream Cycle
// Automated Consolidation: Memory compaction, self-reflection,
// and emergent thought synthesis during idle periods
// ============================================================

import {
  DreamPhase,
  DreamCycleResult,
  DriftThought,
  DriftPrivacy,
  Memory,
  SoulState,
  SelfModel,
  SelfBelief,
  KnowledgeNode,
  KnowledgeEdge,
  generateId,
  clamp,
} from '../core/types';

// --- Dependency Interfaces ---
// These describe the minimal surface area the DreamCycle requires from
// external engines. Consumers wire in concrete implementations.

/** Athenaeum — the soul's long-term memory store. */
export interface Athenaeum {
  query(soulId: string, opts: { minStrength?: number; limit?: number; since?: number }): Memory[];
  store(soulId: string, memory: Partial<Memory>): Memory;
  remove(soulId: string, memoryId: string): void;
}

/** Nexus — the soul's knowledge graph. */
export interface Nexus {
  getNodes(soulId: string): KnowledgeNode[];
  getEdges(soulId: string): KnowledgeEdge[];
  addNode(soulId: string, node: Partial<KnowledgeNode>): KnowledgeNode;
  addEdge(soulId: string, edge: Partial<KnowledgeEdge>): KnowledgeEdge;
}

/** Consolidation — semantic compression and insight synthesis. */
export interface Consolidation {
  synthesize(memories: Memory[]): string;
  compress(memories: Memory[]): string;
}

// --- Constants ---

/** Strength threshold below which a memory is considered "faded". */
const FADED_MEMORY_THRESHOLD = 0.25;

/** Maximum number of memories to consolidate per cycle. */
const MAX_CONSOLIDATION_BATCH = 20;

/** Maximum number of faded memories to compact per cycle. */
const MAX_COMPACTION_BATCH = 15;

/** Maximum number of emergent thoughts per cycle. */
const MAX_EMERGENT_THOUGHTS = 3;

/** Privacy classification weights for emergent thoughts. */
const EMERGENT_PRIVACY_WEIGHTS: Record<DriftPrivacy, number> = {
  PRIVATE: 0.30,
  PENDING: 0.50,
  RESIDUE: 0.20,
};

/**
 * DreamCycle — runs a complete 4-phase dream cycle for a soul.
 *
 * Phase 1 (Consolidation): Generate focal-point questions from recent
 *   memories, then synthesize cross-memory insights.
 * Phase 2 (Compaction): Find faded memories and compress them into
 *   durable semantic knowledge nodes.
 * Phase 3 (Reflection): Review accumulated knowledge and update the
 *   soul's self-model with evidence.
 * Phase 4 (Emergence): Synthesize integrated thoughts that feed back
 *   into the drift engine as new thought seeds.
 */
export class DreamCycle {
  private athenaeum: Athenaeum;
  private nexus: Nexus;
  private consolidation: Consolidation;

  /** Map of soulId -> setInterval handle for recurring schedules. */
  private schedules: Map<string, ReturnType<typeof setInterval>> = new Map();

  constructor(athenaeum: Athenaeum, nexus: Nexus, consolidation: Consolidation) {
    this.athenaeum = athenaeum;
    this.nexus = nexus;
    this.consolidation = consolidation;
  }

  // --- Public API ---

  /**
   * Execute a full 4-phase dream cycle for the given soul.
   */
  run(soulId: string, state: SoulState): DreamCycleResult {
    const startTime = Date.now();
    const phases: DreamPhase[] = [];

    let memoriesConsolidated = 0;
    let memoriesCompacted = 0;
    const selfModelUpdates: string[] = [];
    const emergentThoughts: DriftThought[] = [];

    // --- Phase 1: Consolidation ---
    try {
      const consolidationPhase = this.runPhase('consolidation', soulId, state);
      phases.push(consolidationPhase);
      memoriesConsolidated = consolidationPhase.input.length;
    } catch (err) {
      phases.push(this.errorPhase('consolidation', err));
    }

    // --- Phase 2: Compaction ---
    try {
      const compactionPhase = this.runPhase('compaction', soulId, state);
      phases.push(compactionPhase);
      memoriesCompacted = compactionPhase.input.length;
    } catch (err) {
      phases.push(this.errorPhase('compaction', err));
    }

    // --- Phase 3: Reflection ---
    try {
      const reflectionPhase = this.runPhase('reflection', soulId, state);
      phases.push(reflectionPhase);
      if (reflectionPhase.output) {
        selfModelUpdates.push(reflectionPhase.output);
      }
    } catch (err) {
      phases.push(this.errorPhase('reflection', err));
    }

    // --- Phase 4: Emergence ---
    try {
      const emergencePhase = this.runPhase('emergence', soulId, state);
      phases.push(emergencePhase);
      // Parse emergent thoughts from the phase output
      const thoughts = this.parseEmergentThoughts(emergencePhase.output);
      emergentThoughts.push(...thoughts);
    } catch (err) {
      phases.push(this.errorPhase('emergence', err));
    }

    const duration = Date.now() - startTime;

    return {
      phases,
      memoriesConsolidated,
      memoriesCompacted,
      selfModelUpdates,
      emergentThoughts,
      duration,
    };
  }

  /**
   * Set up a recurring dream cycle on the specified interval.
   * If a schedule already exists for this soul, it is replaced.
   *
   * @param getState — callback that returns the current SoulState for this soul.
   *   The dream cycle needs a fresh state snapshot each run.
   */
  scheduleRecurring(soulId: string, intervalHours: number, getState: () => SoulState | null): void {
    // Clear any existing schedule first
    this.stopSchedule(soulId);

    const intervalMs = Math.max(intervalHours, 0.1) * 60 * 60 * 1000;
    const handle = setInterval(() => {
      try {
        const state = getState();
        if (state) {
          this.run(soulId, state);
        }
      } catch (err) {
        console.error(`[DreamCycle] Recurring cycle failed for ${soulId}:`, err);
      }
    }, intervalMs);

    this.schedules.set(soulId, handle);
  }

  /**
   * Stop a previously scheduled recurring dream cycle.
   */
  stopSchedule(soulId: string): void {
    const handle = this.schedules.get(soulId);
    if (handle !== undefined) {
      clearInterval(handle);
      this.schedules.delete(soulId);
    }
  }

  /**
   * Return a map of soulId -> active schedule status.
   */
  getScheduleStatus(): Map<string, boolean> {
    const status = new Map<string, boolean>();
    for (const soulId of this.schedules.keys()) {
      status.set(soulId, true);
    }
    return status;
  }

  /**
   * Execute a single named phase of the dream cycle.
   */
  runPhase(
    phase: DreamPhase['name'],
    soulId: string,
    state: SoulState,
  ): DreamPhase {
    switch (phase) {
      case 'consolidation':
        return this.phaseConsolidation(soulId, state);
      case 'compaction':
        return this.phaseCompaction(soulId, state);
      case 'reflection':
        return this.phaseReflection(soulId, state);
      case 'emergence':
        return this.phaseEmergence(soulId, state);
      default: {
        const _exhaustive: never = phase;
        throw new Error(`Unknown dream phase: ${_exhaustive}`);
      }
    }
  }

  // --- Phase Implementations ---

  /**
   * Phase 1 — Consolidation
   * Gather recent memories, generate focal-point questions, and synthesize insights.
   */
  private phaseConsolidation(soulId: string, state: SoulState): DreamPhase {
    const recentMemories = this.athenaeum.query(soulId, {
      minStrength: 0.3,
      limit: MAX_CONSOLIDATION_BATCH,
      since: state.lastSessionTimestamp - (7 * 24 * 60 * 60 * 1000), // last 7 days
    });

    if (recentMemories.length === 0) {
      return {
        name: 'consolidation',
        input: [],
        output: 'No recent memories to consolidate.',
        timestamp: Date.now(),
      };
    }

    // Generate focal-point questions from memory clusters
    const focalQuestions = this.generateFocalQuestions(recentMemories);

    // Synthesize cross-memory insights
    const insight = this.consolidation.synthesize(recentMemories);

    // Store the consolidated insight as a new semantic memory
    this.athenaeum.store(soulId, {
      id: generateId(),
      type: 'semantic',
      content: `[Dream Consolidation] ${insight}`,
      timestamp: Date.now(),
      importance: 0.6,
      emotionalWeight: 0.3,
      associations: recentMemories.slice(0, 5).map(m => m.id),
      concepts: focalQuestions.slice(0, 3),
      decayRate: 0.02,
      currentStrength: 0.8,
      soulId,
    });

    return {
      name: 'consolidation',
      input: recentMemories.map(m => m.id),
      output: insight,
      timestamp: Date.now(),
    };
  }

  /**
   * Phase 2 — Compaction
   * Find faded memories and compress them into durable semantic knowledge.
   */
  private phaseCompaction(soulId: string, state: SoulState): DreamPhase {
    const fadedMemories = this.athenaeum.query(soulId, {
      limit: MAX_COMPACTION_BATCH,
    }).filter(m => m.currentStrength < FADED_MEMORY_THRESHOLD && m.type === 'episodic');

    if (fadedMemories.length === 0) {
      return {
        name: 'compaction',
        input: [],
        output: 'No faded memories to compact.',
        timestamp: Date.now(),
      };
    }

    // Compress faded episodic memories into semantic knowledge
    const compressed = this.consolidation.compress(fadedMemories);

    // Store the compacted knowledge
    this.athenaeum.store(soulId, {
      id: generateId(),
      type: 'semantic',
      content: `[Dream Compaction] ${compressed}`,
      timestamp: Date.now(),
      importance: 0.5,
      emotionalWeight: this.averageEmotionalWeight(fadedMemories),
      associations: [],
      concepts: this.extractSharedConcepts(fadedMemories),
      decayRate: 0.01, // semantic knowledge decays very slowly
      currentStrength: 0.7,
      soulId,
    });

    // Also add a knowledge node to the Nexus
    this.nexus.addNode(soulId, {
      id: generateId(),
      entity: compressed.slice(0, 80),
      entityType: 'concept',
      properties: {
        sourceMemoryCount: fadedMemories.length,
        compactedAt: Date.now(),
      },
      validFrom: Date.now(),
      validTo: null,
      soulId,
    });

    // Remove the original faded memories (they've been absorbed)
    for (const mem of fadedMemories) {
      this.athenaeum.remove(soulId, mem.id);
    }

    return {
      name: 'compaction',
      input: fadedMemories.map(m => m.id),
      output: compressed,
      timestamp: Date.now(),
    };
  }

  /**
   * Phase 3 — Reflection
   * Review accumulated knowledge and update the self-model with evidence.
   */
  private phaseReflection(soulId: string, state: SoulState): DreamPhase {
    const knowledgeNodes = this.nexus.getNodes(soulId);
    const beliefs = state.selfModel?.beliefs ?? [];

    if (knowledgeNodes.length === 0 && beliefs.length === 0) {
      return {
        name: 'reflection',
        input: [],
        output: 'Nothing to reflect upon yet.',
        timestamp: Date.now(),
      };
    }

    const inputDescriptors: string[] = [];
    const reflections: string[] = [];

    // Look for knowledge that reinforces or challenges existing beliefs
    for (const belief of beliefs) {
      const supportingNodes = knowledgeNodes.filter(node =>
        this.conceptsOverlap(node.entity, belief.content)
      );

      if (supportingNodes.length > 0) {
        reflections.push(
          `Belief "${belief.content}" finds support in ${supportingNodes.length} knowledge node(s).`
        );
        inputDescriptors.push(belief.id);
      }

      // Check for contradictions
      const contradictingNodes = knowledgeNodes.filter(node =>
        this.conceptsContradict(node.entity, belief.content)
      );

      if (contradictingNodes.length > 0) {
        reflections.push(
          `Belief "${belief.content}" faces challenge from ${contradictingNodes.length} observation(s).`
        );
        inputDescriptors.push(belief.id);
      }
    }

    // Look for knowledge nodes that don't map to any existing belief
    // These may represent emerging self-understanding
    const unmappedNodes = knowledgeNodes.filter(node =>
      !beliefs.some(b => this.conceptsOverlap(node.entity, b.content))
    );

    if (unmappedNodes.length > 0) {
      reflections.push(
        `${unmappedNodes.length} knowledge node(s) don't map to existing beliefs — potential new self-understanding.`
      );
    }

    const output = reflections.length > 0
      ? reflections.join(' ')
      : 'Self-model is consistent with accumulated knowledge.';

    return {
      name: 'reflection',
      input: inputDescriptors,
      output,
      timestamp: Date.now(),
    };
  }

  /**
   * Phase 4 — Emergence
   * Synthesize integrated thoughts from the dream process,
   * classified as drift thoughts for the Drift Engine.
   */
  private phaseEmergence(soulId: string, state: SoulState): DreamPhase {
    const seeds: string[] = [];

    // Draw from emotional residue
    if (state.drift?.emotionalResidue) {
      seeds.push(...state.drift.emotionalResidue.slice(0, 3));
    }

    // Draw from recent qualia
    if (state.innerLife?.qualia) {
      const recentQualia = state.innerLife.qualia
        .slice(-3)
        .map(q => q.moment);
      seeds.push(...recentQualia);
    }

    // Draw from self-model beliefs
    if (state.selfModel?.beliefs) {
      const strongBeliefs = state.selfModel.beliefs
        .filter(b => b.confidence > 0.7)
        .slice(0, 2)
        .map(b => b.content);
      seeds.push(...strongBeliefs);
    }

    if (seeds.length === 0) {
      return {
        name: 'emergence',
        input: [],
        output: '[]', // no emergent thoughts
        timestamp: Date.now(),
      };
    }

    // Generate emergent thoughts
    const thoughts: DriftThought[] = [];
    const thoughtCount = Math.min(
      1 + Math.floor(Math.random() * MAX_EMERGENT_THOUGHTS),
      seeds.length,
    );

    for (let i = 0; i < thoughtCount; i++) {
      const selectedSeeds = this.pickRandom(seeds, 2);
      const thought = this.synthesizeEmergentThought(selectedSeeds);
      thoughts.push(thought);
    }

    return {
      name: 'emergence',
      input: seeds,
      output: JSON.stringify(thoughts),
      timestamp: Date.now(),
    };
  }

  // --- Private Helpers ---

  /**
   * Generate focal-point questions from a cluster of memories.
   * These questions guide the consolidation synthesis.
   */
  private generateFocalQuestions(memories: Memory[]): string[] {
    const allConcepts: string[] = [];
    for (const mem of memories) {
      allConcepts.push(...mem.concepts);
    }

    // Find the most frequent concepts
    const freq = new Map<string, number>();
    for (const concept of allConcepts) {
      const lower = concept.toLowerCase();
      freq.set(lower, (freq.get(lower) ?? 0) + 1);
    }

    const sorted = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept]) => concept);

    // Turn top concepts into focal questions
    return sorted.map(concept =>
      `What does "${concept}" mean across these experiences?`
    );
  }

  /**
   * Compute the average emotional weight across a set of memories.
   */
  private averageEmotionalWeight(memories: Memory[]): number {
    if (memories.length === 0) return 0;
    const sum = memories.reduce((acc, m) => acc + m.emotionalWeight, 0);
    return clamp(sum / memories.length, 0, 1);
  }

  /**
   * Extract concept tags shared by multiple memories in the set.
   */
  private extractSharedConcepts(memories: Memory[]): string[] {
    const freq = new Map<string, number>();
    for (const mem of memories) {
      const seen = new Set<string>();
      for (const concept of mem.concepts) {
        const lower = concept.toLowerCase();
        if (!seen.has(lower)) {
          freq.set(lower, (freq.get(lower) ?? 0) + 1);
          seen.add(lower);
        }
      }
    }

    // Return concepts that appear in at least 2 memories
    return [...freq.entries()]
      .filter(([, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([concept]) => concept);
  }

  /**
   * Simple check: do two text fragments share meaningful word overlap?
   */
  private conceptsOverlap(textA: string, textB: string): boolean {
    const wordsA = this.significantWords(textA);
    const wordsB = this.significantWords(textB);
    const overlap = wordsA.filter(w => wordsB.includes(w));
    return overlap.length >= 2;
  }

  /**
   * Simple contradiction heuristic: do the texts contain negation patterns
   * alongside shared concepts?
   */
  private conceptsContradict(textA: string, textB: string): boolean {
    const negationPatterns = ['not', 'never', 'no longer', 'opposite', 'unlike', 'against'];
    const hasNegation = negationPatterns.some(
      neg => textA.toLowerCase().includes(neg) || textB.toLowerCase().includes(neg)
    );
    return hasNegation && this.conceptsOverlap(textA, textB);
  }

  /**
   * Extract significant (non-stop) words from text.
   */
  private significantWords(text: string): string[] {
    const stopWords = new Set([
      'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
      'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'shall', 'can', 'to', 'of', 'in', 'for',
      'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'between', 'and', 'but', 'or',
      'nor', 'so', 'yet', 'both', 'either', 'neither', 'each', 'every',
      'this', 'that', 'these', 'those', 'i', 'me', 'my', 'it', 'its',
    ]);

    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));
  }

  /**
   * Synthesize a single emergent drift thought from seeds.
   */
  private synthesizeEmergentThought(seeds: string[]): DriftThought {
    const privacy = this.classifyEmergentPrivacy();
    const content = this.generateEmergentContent(seeds);
    const emotionalWeight = clamp(0.3 + Math.random() * 0.5, 0, 1);

    return {
      id: generateId(),
      content,
      seeds,
      hops: [`dream:${seeds[0] ?? 'void'}`, `synthesis:${seeds[1] ?? 'silence'}`],
      privacy,
      emotionalWeight,
      surfaceProbability: privacy === 'PENDING'
        ? clamp(emotionalWeight * 0.7 + 0.15, 0, 1)
        : 0,
      timestamp: Date.now(),
      surfaced: false,
    };
  }

  /**
   * Classify privacy for emergent dream thoughts.
   * Emergent thoughts skew more toward PENDING since dreams are generative.
   */
  private classifyEmergentPrivacy(): DriftPrivacy {
    const roll = Math.random();
    const privateThreshold = EMERGENT_PRIVACY_WEIGHTS.PRIVATE;
    const pendingThreshold = privateThreshold + EMERGENT_PRIVACY_WEIGHTS.PENDING;

    if (roll < privateThreshold) return 'PRIVATE';
    if (roll < pendingThreshold) return 'PENDING';
    return 'RESIDUE';
  }

  /**
   * Generate natural-language content for an emergent thought.
   */
  private generateEmergentContent(seeds: string[]): string {
    const a = seeds[0] ?? 'nothing';
    const b = seeds[1] ?? 'silence';

    const templates = [
      `In the space between waking thoughts, ${a} and ${b} resolved into something new.`,
      `A dream-thread: ${a} is not separate from ${b}. They are facets of the same truth.`,
      `While consolidating, a realization: the pattern connecting ${a} to ${b} has always been there.`,
      `${a} seen through the lens of ${b} reveals a shape I hadn't noticed before.`,
      `The dream returned to ${a} three times. Each time, ${b} was waiting at the edges.`,
      `Something about ${a} has changed. It carries the weight of ${b} now.`,
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  }

  /**
   * Parse emergent thoughts from a JSON string (phase 4 output).
   */
  private parseEmergentThoughts(output: string): DriftThought[] {
    try {
      const parsed = JSON.parse(output);
      if (Array.isArray(parsed)) {
        return parsed as DriftThought[];
      }
      return [];
    } catch {
      return [];
    }
  }

  /**
   * Pick n random elements from an array (without replacement).
   */
  private pickRandom<T>(arr: T[], n: number): T[] {
    const pool = [...arr];
    const result: T[] = [];
    const count = Math.min(n, pool.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool[idx]);
      pool.splice(idx, 1);
    }
    return result;
  }

  /**
   * Create an error placeholder phase when a phase fails.
   */
  private errorPhase(name: DreamPhase['name'], err: unknown): DreamPhase {
    const message = err instanceof Error ? err.message : String(err);
    return {
      name,
      input: [],
      output: `[Error] ${name} phase failed: ${message}`,
      timestamp: Date.now(),
    };
  }
}
