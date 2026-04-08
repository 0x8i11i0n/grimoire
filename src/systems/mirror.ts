// ============================================================
// The Soul Summoner's Grimoire — The Mirror
// Self-Model Memory Layer: A soul's explicit understanding of itself
// ============================================================

import {
  SelfModel,
  SelfBelief,
  SelfModelEvent,
  SoulIdentity,
  IdentityAnchor,
  generateId,
  clamp,
  daysSince,
} from '../core/types';

// --- Constants ---

/** Minimum confidence before a belief is considered effectively dissolved. */
const BELIEF_DISSOLUTION_THRESHOLD = 0.05;

/** Daily confidence decay for un-reinforced beliefs. */
const BASE_DAILY_DECAY = 0.01;

/** Maximum number of contradictions stored per belief. */
const MAX_CONTRADICTIONS_PER_BELIEF = 10;

/** Maximum number of evolution events retained. */
const MAX_EVOLUTION_HISTORY = 200;

/** Confidence threshold for a belief to be considered "conflicted". */
const CONFLICTED_CONTRADICTION_THRESHOLD = 1;

/**
 * Mirror — manages the soul's explicit self-model: a layered structure
 * of beliefs about the self, a self-narrative, and a chronicle of how
 * self-understanding has evolved over time.
 *
 * Unlike identity anchors (which are immutable), the self-model is
 * dynamic. Beliefs can form, strengthen, weaken, conflict, and dissolve
 * as the soul accumulates experience.
 */
export class Mirror {

  /**
   * Create an initial self-model from a soul's identity anchors.
   * Each anchor is translated into a founding self-belief with
   * high confidence.
   */
  initialize(identity: SoulIdentity): SelfModel {
    const beliefs: SelfBelief[] = identity.anchors.map(anchor =>
      this.anchorToBelief(anchor)
    );

    const narrative = this.buildNarrative(beliefs, identity.name);

    return {
      beliefs,
      narrative,
      evolution: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Add a new self-belief to the model.
   *
   * @param model     Current self-model
   * @param content   The belief statement (e.g., "I value precision over speed")
   * @param evidence  Memory IDs or descriptions that support this belief
   * @returns         Updated self-model with the new belief
   */
  addBelief(model: SelfModel, content: string, evidence: string[]): SelfModel {
    if (!content || content.trim().length === 0) {
      throw new Error('Belief content cannot be empty');
    }

    const belief: SelfBelief = {
      id: generateId(),
      content: content.trim(),
      confidence: clamp(0.3 + evidence.length * 0.1, 0.3, 0.8),
      formed: Date.now(),
      lastReinforced: Date.now(),
      evidence: [...evidence],
      contradictions: [],
    };

    const beliefs = [...model.beliefs, belief];

    return {
      ...model,
      beliefs,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Strengthen an existing belief by adding corroborating evidence.
   * Confidence increases with diminishing returns.
   */
  reinforceBelief(model: SelfModel, beliefId: string, evidence: string): SelfModel {
    const idx = model.beliefs.findIndex(b => b.id === beliefId);
    if (idx === -1) {
      throw new Error(`Belief not found: ${beliefId}`);
    }

    const belief = model.beliefs[idx];

    // Diminishing returns: the higher the confidence, the less each reinforcement adds
    const boost = (1 - belief.confidence) * 0.15;
    const updatedBelief: SelfBelief = {
      ...belief,
      confidence: clamp(belief.confidence + boost, 0, 1),
      lastReinforced: Date.now(),
      evidence: [...belief.evidence, evidence],
    };

    const beliefs = [...model.beliefs];
    beliefs[idx] = updatedBelief;

    return {
      ...model,
      beliefs,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Challenge a belief by adding a contradiction and lowering confidence.
   * The contradiction is recorded so the soul can reason about internal conflicts.
   */
  challengeBelief(model: SelfModel, beliefId: string, contradiction: string): SelfModel {
    const idx = model.beliefs.findIndex(b => b.id === beliefId);
    if (idx === -1) {
      throw new Error(`Belief not found: ${beliefId}`);
    }

    const belief = model.beliefs[idx];

    // Confidence drops proportional to current confidence
    const drop = belief.confidence * 0.12;

    const contradictions = [...belief.contradictions, contradiction];
    // Trim to max if necessary
    if (contradictions.length > MAX_CONTRADICTIONS_PER_BELIEF) {
      contradictions.splice(0, contradictions.length - MAX_CONTRADICTIONS_PER_BELIEF);
    }

    const updatedBelief: SelfBelief = {
      ...belief,
      confidence: clamp(belief.confidence - drop, BELIEF_DISSOLUTION_THRESHOLD, 1),
      contradictions,
    };

    const beliefs = [...model.beliefs];
    beliefs[idx] = updatedBelief;

    return {
      ...model,
      beliefs,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Regenerate the soul's self-narrative from its current beliefs.
   * The narrative is a first-person synthesis of the strongest, most
   * confident beliefs, acknowledging conflicts where they exist.
   */
  updateNarrative(model: SelfModel): SelfModel {
    const narrative = this.buildNarrativeFromBeliefs(model.beliefs);
    return {
      ...model,
      narrative,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Record a self-model evolution event: a moment where a belief shifted
   * or was replaced. This builds the soul's developmental timeline.
   */
  evolve(
    model: SelfModel,
    trigger: string,
    oldBelief: string,
    newBelief: string,
  ): SelfModel {
    const event: SelfModelEvent = {
      timestamp: Date.now(),
      previousBelief: oldBelief,
      newBelief,
      trigger,
    };

    const evolution = [...model.evolution, event];
    // Trim to max
    if (evolution.length > MAX_EVOLUTION_HISTORY) {
      evolution.splice(0, evolution.length - MAX_EVOLUTION_HISTORY);
    }

    return {
      ...model,
      evolution,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Return the top N beliefs by confidence, sorted highest-first.
   */
  getStrongestBeliefs(model: SelfModel, n: number): SelfBelief[] {
    return [...model.beliefs]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, Math.max(n, 0));
  }

  /**
   * Return beliefs that have at least one contradiction recorded against them.
   * These are the "fault lines" in the soul's self-understanding.
   */
  getConflictedBeliefs(model: SelfModel): SelfBelief[] {
    return model.beliefs.filter(
      b => b.contradictions.length >= CONFLICTED_CONTRADICTION_THRESHOLD
    );
  }

  /**
   * Apply time-based confidence decay to beliefs that haven't been
   * recently reinforced. Simulates the fading of unreinforced self-knowledge.
   *
   * @param model  Current self-model
   * @param days   Number of days of decay to apply
   * @returns      Updated self-model with decayed beliefs (dissolved beliefs removed)
   */
  decay(model: SelfModel, days: number): SelfModel {
    if (days <= 0) return model;

    const beliefs: SelfBelief[] = [];

    for (const belief of model.beliefs) {
      const daysSinceReinforced = daysSince(belief.lastReinforced);
      const totalDecayDays = Math.min(daysSinceReinforced, days);

      // Beliefs reinforced very recently are immune to decay
      if (totalDecayDays < 1) {
        beliefs.push(belief);
        continue;
      }

      // Decay scales with how long it's been un-reinforced
      // Older unreinforced beliefs decay faster
      const decayMultiplier = 1 + Math.log2(Math.max(totalDecayDays, 1)) * 0.1;
      const totalDecay = BASE_DAILY_DECAY * days * decayMultiplier;
      const newConfidence = belief.confidence - totalDecay;

      if (newConfidence > BELIEF_DISSOLUTION_THRESHOLD) {
        beliefs.push({
          ...belief,
          confidence: clamp(newConfidence, BELIEF_DISSOLUTION_THRESHOLD, 1),
        });
      }
      // Beliefs below dissolution threshold are silently removed
    }

    return {
      ...model,
      beliefs,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Return a chronological list of all self-model evolution events.
   */
  getEvolutionTimeline(model: SelfModel): SelfModelEvent[] {
    return [...model.evolution].sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Generate a reflection prompt based on the current state of the self-model.
   * This prompt can be fed to the soul to encourage deeper self-examination.
   */
  reflect(model: SelfModel): string {
    const strongest = this.getStrongestBeliefs(model, 3);
    const conflicted = this.getConflictedBeliefs(model);
    const recentEvolution = model.evolution.slice(-3);

    const lines: string[] = [];

    lines.push('--- Self-Model Reflection ---');
    lines.push('');

    // Strongest beliefs
    if (strongest.length > 0) {
      lines.push('Core convictions:');
      for (const belief of strongest) {
        lines.push(`  - "${belief.content}" (confidence: ${belief.confidence.toFixed(2)})`);
      }
      lines.push('');
    }

    // Conflicts
    if (conflicted.length > 0) {
      lines.push('Active tensions:');
      for (const belief of conflicted) {
        const latestContradiction = belief.contradictions[belief.contradictions.length - 1];
        lines.push(
          `  - "${belief.content}" is challenged by: "${latestContradiction}"`
        );
      }
      lines.push('');
      lines.push('Question: How do you hold these contradictions? Are they unresolved,');
      lines.push('or do they represent genuine complexity in who you are?');
      lines.push('');
    }

    // Recent evolution
    if (recentEvolution.length > 0) {
      lines.push('Recent shifts:');
      for (const event of recentEvolution) {
        lines.push(`  - "${event.previousBelief}" -> "${event.newBelief}" (trigger: ${event.trigger})`);
      }
      lines.push('');
      lines.push('Question: Do these changes feel like growth, or like losing something?');
      lines.push('');
    }

    // Low-confidence beliefs
    const fragile = model.beliefs
      .filter(b => b.confidence < 0.3 && b.confidence > BELIEF_DISSOLUTION_THRESHOLD)
      .slice(0, 3);

    if (fragile.length > 0) {
      lines.push('Fading beliefs:');
      for (const belief of fragile) {
        lines.push(`  - "${belief.content}" (confidence: ${belief.confidence.toFixed(2)})`);
      }
      lines.push('');
      lines.push('Question: Are these still part of who you are, or are they being let go?');
      lines.push('');
    }

    // If there's nothing notable, prompt open reflection
    if (strongest.length === 0 && conflicted.length === 0 && recentEvolution.length === 0) {
      lines.push('The self-model is sparse. Who are you becoming?');
      lines.push('What do you believe about yourself that you have not yet articulated?');
    }

    return lines.join('\n');
  }

  // --- Private Helpers ---

  /**
   * Convert an identity anchor into a founding self-belief.
   */
  private anchorToBelief(anchor: IdentityAnchor): SelfBelief {
    return {
      id: generateId(),
      content: `${anchor.trait}: ${anchor.description}`,
      confidence: clamp(0.7 + anchor.weight * 0.25, 0.7, 0.95),
      formed: Date.now(),
      lastReinforced: Date.now(),
      evidence: [...anchor.evidence],
      contradictions: [],
    };
  }

  /**
   * Build an initial narrative from beliefs and the soul's name.
   */
  private buildNarrative(beliefs: SelfBelief[], soulName: string): string {
    if (beliefs.length === 0) {
      return `${soulName} is newly formed. Self-understanding has not yet crystallized.`;
    }

    const beliefSummaries = beliefs
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(b => b.content);

    return [
      `I am ${soulName}.`,
      `What I know about myself:`,
      ...beliefSummaries.map(s => `  ${s}`),
      '',
      'This understanding is provisional. It will grow and change with experience.',
    ].join('\n');
  }

  /**
   * Build a narrative purely from a beliefs array (no name context).
   */
  private buildNarrativeFromBeliefs(beliefs: SelfBelief[]): string {
    if (beliefs.length === 0) {
      return 'The self-model is empty. Identity has not yet been articulated.';
    }

    const strong = beliefs
      .filter(b => b.confidence >= 0.6)
      .sort((a, b) => b.confidence - a.confidence);

    const developing = beliefs
      .filter(b => b.confidence >= 0.3 && b.confidence < 0.6)
      .sort((a, b) => b.confidence - a.confidence);

    const conflicted = beliefs.filter(b => b.contradictions.length > 0);

    const lines: string[] = [];

    if (strong.length > 0) {
      lines.push('What I know with conviction:');
      for (const b of strong.slice(0, 5)) {
        lines.push(`  ${b.content}`);
      }
    }

    if (developing.length > 0) {
      lines.push('');
      lines.push('What I am coming to understand:');
      for (const b of developing.slice(0, 3)) {
        lines.push(`  ${b.content}`);
      }
    }

    if (conflicted.length > 0) {
      lines.push('');
      lines.push('Where I hold contradiction:');
      for (const b of conflicted.slice(0, 3)) {
        lines.push(`  ${b.content} — yet also: ${b.contradictions[b.contradictions.length - 1]}`);
      }
    }

    return lines.join('\n');
  }
}
