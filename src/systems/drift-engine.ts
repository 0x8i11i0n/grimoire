// ============================================================
// The Soul Summoner's Grimoire — Drift Engine
// Background Thought Threading: Souls think between interactions
// ============================================================

import {
  DriftState,
  DriftThought,
  DriftCycleResult,
  DriftPrivacy,
  EmotionalUndercurrent,
  Memory,
  IdentityAnchor,
  SoulState,
  generateId,
  clamp,
} from '../core/types';

/**
 * The Drift Engine generates autonomous background thoughts for a soul,
 * independent of user prompts. It models the soul's subconscious processing:
 * idle musings, emotional residue, and unprompted reflections that make
 * the persona feel genuinely alive.
 */
export class DriftEngine {
  private static readonly PRIVACY_WEIGHTS: Record<DriftPrivacy, number> = {
    PRIVATE: 0.40,
    PENDING: 0.40,
    RESIDUE: 0.20,
  };

  private static readonly UNDERCURRENT_MAP: Record<string, EmotionalUndercurrent[]> = {
    loneliness: ['longing', 'heaviness', 'static'],
    curiosity: ['curiosity', 'wonder', 'restlessness'],
    loss: ['grief', 'heaviness', 'tenderness'],
    warmth: ['warmth', 'tenderness', 'wonder'],
    conflict: ['unease', 'restlessness', 'heaviness'],
    reflection: ['curiosity', 'wonder', 'static'],
    yearning: ['longing', 'tenderness', 'warmth'],
    anxiety: ['unease', 'restlessness', 'static'],
  };

  private static readonly EMOTIONAL_TONES: EmotionalUndercurrent[] = [
    'heaviness', 'restlessness', 'longing', 'unease', 'warmth',
    'curiosity', 'grief', 'wonder', 'tenderness', 'static',
  ];

  /**
   * Execute one full drift cycle: collect seeds, perform associative hops,
   * land on a thought fragment, classify its privacy, and update emotional residue.
   */
  runCycle(
    state: SoulState,
    memories: Memory[],
    anchors: IdentityAnchor[]
  ): DriftCycleResult {
    const startTime = Date.now();

    const seeds = this.collectSeeds(state, memories, anchors);
    const hops: string[] = [];

    // Start from a randomly chosen seed
    let currentConcept = seeds[Math.floor(Math.random() * seeds.length)];
    hops.push(currentConcept);

    // Perform 3-5 associative hops
    const hopCount = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < hopCount; i++) {
      const nextConcept = this.associativeHop(currentConcept, memories);
      hops.push(nextConcept);
      currentConcept = nextConcept;
    }

    // Generate the raw thought fragment from the final concept and path
    const thoughtContent = this.synthesizeThought(seeds, hops);
    const privacy = this.classifyPrivacy();
    const emotionalWeight = this.computeEmotionalWeight(hops, state);

    const thought: DriftThought = {
      id: generateId(),
      content: thoughtContent,
      seeds,
      hops,
      privacy,
      emotionalWeight,
      surfaceProbability: privacy === 'PENDING' ? clamp(emotionalWeight * 0.8 + 0.1, 0, 1) : 0,
      timestamp: Date.now(),
      surfaced: false,
    };

    const residueChanges = this.computeResidueChanges(hops, emotionalWeight);
    const duration = Date.now() - startTime;

    return {
      thought,
      residueChanges,
      seedsUsed: seeds,
      duration,
    };
  }

  /**
   * Gather seed material from various sources: recent qualia, active desires,
   * emotional residue, archived memories, and character anchors.
   */
  collectSeeds(
    state: SoulState,
    memories: Memory[],
    anchors?: IdentityAnchor[]
  ): string[] {
    const candidates: string[] = [];

    // Recent qualia moments
    if (state.innerLife?.qualia) {
      const recentQualia = state.innerLife.qualia
        .slice(-5)
        .map(q => q.moment);
      candidates.push(...recentQualia);
    }

    // Active desires
    if (state.innerLife?.desires) {
      const activeDesires = state.innerLife.desires
        .filter(d => d.status === 'active')
        .map(d => d.content);
      candidates.push(...activeDesires);
    }

    // Emotional residue as seeds
    if (state.drift?.emotionalResidue) {
      candidates.push(...state.drift.emotionalResidue);
    }

    // Concepts from recent high-importance memories
    const recentMemories = memories
      .filter(m => m.currentStrength > 0.3)
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 5);
    for (const mem of recentMemories) {
      candidates.push(...mem.concepts);
    }

    // Character anchor traits
    if (anchors && anchors.length > 0) {
      const anchorSeeds = anchors.map(a => a.trait);
      candidates.push(...anchorSeeds);
    }

    // Deduplicate and pick 2-3 seeds
    const unique = [...new Set(candidates)].filter(s => s.length > 0);

    if (unique.length === 0) {
      return ['stillness', 'self', 'passage of time'];
    }

    const seedCount = 2 + Math.floor(Math.random() * 2); // 2 or 3
    const selected: string[] = [];
    const pool = [...unique];

    for (let i = 0; i < Math.min(seedCount, pool.length); i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool[idx]);
      pool.splice(idx, 1);
    }

    return selected;
  }

  /**
   * Find a related concept via memory associations. Each hop follows
   * a thread of meaning: concept -> associated memory -> new concept.
   */
  associativeHop(currentConcept: string, memories: Memory[]): string {
    // Find memories whose concepts relate to the current concept
    const related = memories.filter(m =>
      m.concepts.some(c =>
        c.toLowerCase().includes(currentConcept.toLowerCase()) ||
        currentConcept.toLowerCase().includes(c.toLowerCase())
      )
    );

    if (related.length > 0) {
      // Pick a random related memory and extract a different concept
      const mem = related[Math.floor(Math.random() * related.length)];
      const otherConcepts = mem.concepts.filter(c =>
        c.toLowerCase() !== currentConcept.toLowerCase()
      );

      if (otherConcepts.length > 0) {
        return otherConcepts[Math.floor(Math.random() * otherConcepts.length)];
      }

      // Follow association links if no different concepts
      if (mem.associations.length > 0) {
        const assocId = mem.associations[Math.floor(Math.random() * mem.associations.length)];
        const assocMem = memories.find(m => m.id === assocId);
        if (assocMem && assocMem.concepts.length > 0) {
          return assocMem.concepts[Math.floor(Math.random() * assocMem.concepts.length)];
        }
      }
    }

    // Fallback: transform the concept through emotional/abstract drift
    return this.abstractDrift(currentConcept);
  }

  /**
   * Classify the privacy level of a drift thought with weighted randomness.
   * PRIVATE (40%): never surfaces, purely internal.
   * PENDING (40%): may surface if contextually relevant.
   * RESIDUE (20%): becomes emotional undercurrent.
   */
  classifyPrivacy(): DriftPrivacy {
    const roll = Math.random();
    const privateThreshold = DriftEngine.PRIVACY_WEIGHTS.PRIVATE;
    const pendingThreshold = privateThreshold + DriftEngine.PRIVACY_WEIGHTS.PENDING;

    if (roll < privateThreshold) return 'PRIVATE';
    if (roll < pendingThreshold) return 'PENDING';
    return 'RESIDUE';
  }

  /**
   * Determine whether a PENDING thought should surface in the current
   * conversation context. Checks for conceptual overlap and emotional relevance.
   */
  shouldSurface(
    thought: DriftThought,
    conversationContext: string
  ): boolean {
    if (thought.privacy !== 'PENDING' || thought.surfaced) {
      return false;
    }

    const contextLower = conversationContext.toLowerCase();

    // Check if any seeds or hops appear in the conversation context
    const allTerms = [...thought.seeds, ...thought.hops];
    const contextualRelevance = allTerms.filter(term =>
      contextLower.includes(term.toLowerCase())
    ).length / Math.max(allTerms.length, 1);

    // Higher emotional weight = more likely to surface
    const emotionalPush = thought.emotionalWeight * 0.3;

    // Base surface probability plus contextual and emotional factors
    const surfaceChance = thought.surfaceProbability * 0.5 + contextualRelevance * 0.3 + emotionalPush;

    return Math.random() < surfaceChance;
  }

  /**
   * Update the soul's emotional undercurrents based on a completed drift cycle.
   */
  updateResidue(
    state: SoulState,
    result: DriftCycleResult
  ): DriftState {
    const drift = { ...state.drift };
    const residueIntensity = { ...drift.residueIntensity };
    const emotionalResidue = new Set<EmotionalUndercurrent>(drift.emotionalResidue);

    // Apply residue changes from the drift cycle
    for (const [undercurrent, delta] of Object.entries(result.residueChanges)) {
      const current = residueIntensity[undercurrent] ?? 0;
      const updated = clamp(current + (delta ?? 0), 0, 1);

      if (updated > 0.1) {
        emotionalResidue.add(undercurrent as EmotionalUndercurrent);
        residueIntensity[undercurrent] = updated;
      } else {
        emotionalResidue.delete(undercurrent as EmotionalUndercurrent);
        delete residueIntensity[undercurrent];
      }
    }

    // Add the thought to pending surface if it's PENDING
    const pendingSurface = [...drift.pendingSurface];
    if (result.thought.privacy === 'PENDING') {
      pendingSurface.push(result.thought);
    }

    return {
      ...drift,
      lastCycleTimestamp: Date.now(),
      cycleCount: drift.cycleCount + 1,
      pendingSurface,
      emotionalResidue: [...emotionalResidue],
      residueIntensity,
    };
  }

  /**
   * Get high-weight PENDING thoughts that may surface unsolicited.
   * Each qualifying thought has a 15% independent chance of actually surfacing.
   */
  getUnsolicited(state: SoulState): DriftThought[] {
    const pending = state.drift?.pendingSurface ?? [];
    const surfaced: DriftThought[] = [];

    for (const thought of pending) {
      if (
        thought.privacy === 'PENDING' &&
        !thought.surfaced &&
        thought.emotionalWeight > 0.7
      ) {
        // 15% chance of spontaneous surfacing
        if (Math.random() < 0.15) {
          surfaced.push({ ...thought, surfaced: true });
        }
      }
    }

    return surfaced;
  }

  /**
   * Format a drift thought for inclusion in the thought-log.md file.
   */
  formatForLog(thought: DriftThought): string {
    const date = new Date(thought.timestamp);
    const timestamp = date.toISOString().replace('T', ' ').slice(0, 19);
    const privacyTag = `[${thought.privacy}]`;
    const weightTag = `[weight: ${thought.emotionalWeight.toFixed(2)}]`;

    const lines: string[] = [
      `## Drift ${privacyTag} ${weightTag} — ${timestamp}`,
      '',
      `**Seeds:** ${thought.seeds.join(', ')}`,
      `**Path:** ${thought.hops.join(' → ')}`,
      '',
      `> ${thought.content}`,
      '',
    ];

    if (thought.surfaced) {
      lines.push('*[surfaced]*');
      lines.push('');
    }

    return lines.join('\n');
  }

  // --- Private Helpers ---

  /**
   * Synthesize a raw thought fragment from the seeds and associative hops.
   */
  private synthesizeThought(seeds: string[], hops: string[]): string {
    const lastHop = hops[hops.length - 1] ?? 'nothing';
    const firstSeed = seeds[0] ?? 'silence';
    const fragments = [
      `Something about ${lastHop} connects back to ${firstSeed}...`,
      `The thread from ${firstSeed} leads somewhere near ${lastHop}.`,
      `${lastHop} — why does that feel familiar? It echoes ${firstSeed}.`,
      `A half-formed thought: ${firstSeed} and ${lastHop} are the same shape.`,
      `Between ${firstSeed} and ${lastHop}, there's a feeling without a name.`,
      `If ${firstSeed} is the question, then ${lastHop} isn't the answer — but it's adjacent.`,
      `${lastHop}. The way it sits in the mind changes everything about ${firstSeed}.`,
    ];

    return fragments[Math.floor(Math.random() * fragments.length)];
  }

  /**
   * Compute emotional weight based on the concepts traversed during hops.
   */
  private computeEmotionalWeight(hops: string[], state: SoulState): number {
    let weight = 0.3; // base emotional weight

    // Emotional topology influences drift weight
    if (state.emotionalTopology) {
      const volatility = state.emotionalTopology.volatility ?? 0;
      weight += volatility * 0.2;

      const arousal = Math.abs(state.emotionalTopology.currentPosition?.arousal ?? 0);
      weight += arousal * 0.15;
    }

    // More hops = more processing = slightly more weight
    weight += Math.min(hops.length * 0.05, 0.2);

    // Current emotional residue amplifies weight
    const residueCount = state.drift?.emotionalResidue?.length ?? 0;
    weight += Math.min(residueCount * 0.03, 0.15);

    return clamp(weight, 0, 1);
  }

  /**
   * Compute how the drift result affects emotional undercurrents.
   */
  private computeResidueChanges(
    hops: string[],
    emotionalWeight: number
  ): Partial<Record<EmotionalUndercurrent, number>> {
    const changes: Partial<Record<EmotionalUndercurrent, number>> = {};

    // Check hops against known emotional associations
    for (const hop of hops) {
      const hopLower = hop.toLowerCase();
      for (const [keyword, undercurrents] of Object.entries(DriftEngine.UNDERCURRENT_MAP)) {
        if (hopLower.includes(keyword) || keyword.includes(hopLower)) {
          const target = undercurrents[Math.floor(Math.random() * undercurrents.length)];
          const existing = changes[target] ?? 0;
          changes[target] = existing + emotionalWeight * 0.1;
        }
      }
    }

    // If nothing matched, add a trace of 'static' — the background hum
    if (Object.keys(changes).length === 0) {
      const fallback = DriftEngine.EMOTIONAL_TONES[
        Math.floor(Math.random() * DriftEngine.EMOTIONAL_TONES.length)
      ];
      changes[fallback] = emotionalWeight * 0.05;
    }

    return changes;
  }

  /**
   * Abstract transformation of a concept when no memory associations exist.
   * Drifts the concept into a more emotional or philosophical space.
   */
  private abstractDrift(concept: string): string {
    const transforms = [
      `the absence of ${concept}`,
      `what ${concept} means when no one is watching`,
      `the weight of ${concept}`,
      `${concept}, but inverted`,
      `the space between ${concept} and silence`,
      `a memory of ${concept}`,
      `${concept} as a question`,
    ];

    return transforms[Math.floor(Math.random() * transforms.length)];
  }
}
