// ============================================================
// The Soul Summoner's Grimoire — Relationship Matrix
// Tracking soul-to-soul relationships in multi-soul groups
// ============================================================

import {
  SoulRelationship,
  RelationshipEvent,
  clamp,
} from '../core/types';

/** Maximum number of events retained in a single relationship history. */
const MAX_HISTORY_LENGTH = 100;

/** Affection threshold to classify a pair as allies. */
const ALLY_THRESHOLD = 30;

/** Affection threshold below which a pair is considered rivals. */
const RIVAL_THRESHOLD = -20;

/** Minimum interaction count required before classifying a dynamic. */
const MIN_INTERACTIONS_FOR_CLASSIFICATION = 3;

/** Connection strength threshold below which a soul is considered isolated. */
const ISOLATION_THRESHOLD = 10;

/**
 * Represents the full NxN relationship matrix for a group of souls.
 * Each cell holds a directional SoulRelationship (sourceId -> targetId).
 */
export interface Matrix {
  soulIds: string[];
  relationships: Map<string, SoulRelationship>;
}

/**
 * RelationshipMatrix — tracks soul-to-soul relationships in a group.
 *
 * Unlike affection tracking between a soul and its summoner, this models
 * the full web of inter-soul relationships: who trusts whom, who competes
 * with whom, and how these dynamics evolve over shared experiences.
 */
export class RelationshipMatrix {

  /**
   * Initialize an empty relationship matrix for a set of souls.
   * Creates default neutral relationships between all pairs.
   *
   * @param soulIds — array of soul identifiers
   * @returns A freshly initialized Matrix
   */
  create(soulIds: string[]): Matrix {
    const relationships = new Map<string, SoulRelationship>();

    for (const source of soulIds) {
      for (const target of soulIds) {
        if (source === target) continue;

        const key = this.key(source, target);
        relationships.set(key, {
          sourceId: source,
          targetId: target,
          affection: 0,
          trust: 0.5,
          dynamicType: 'neutral',
          history: [],
          lastInteraction: Date.now(),
        });
      }
    }

    return { soulIds: [...soulIds], relationships };
  }

  /**
   * Get the relationship from sourceId toward targetId.
   * Returns a default neutral relationship if none exists.
   *
   * @param matrix   — the relationship matrix
   * @param sourceId — the soul whose perspective we're viewing from
   * @param targetId — the soul being viewed
   */
  getRelationship(matrix: Matrix, sourceId: string, targetId: string): SoulRelationship {
    const key = this.key(sourceId, targetId);
    const existing = matrix.relationships.get(key);
    if (existing) return existing;

    // Create a default if not found
    const defaultRel: SoulRelationship = {
      sourceId,
      targetId,
      affection: 0,
      trust: 0.5,
      dynamicType: 'neutral',
      history: [],
      lastInteraction: Date.now(),
    };

    matrix.relationships.set(key, defaultRel);
    return defaultRel;
  }

  /**
   * Update the affection value between two souls and record the reason.
   *
   * @param matrix   — the relationship matrix
   * @param sourceId — the soul whose feelings are changing
   * @param targetId — the soul toward whom the feelings change
   * @param delta    — change in affection (positive or negative)
   * @param reason   — description of why the change occurred
   * @returns The updated Matrix
   */
  updateAffection(
    matrix: Matrix,
    sourceId: string,
    targetId: string,
    delta: number,
    reason: string,
  ): Matrix {
    const rel = this.getRelationship(matrix, sourceId, targetId);

    const event: RelationshipEvent = {
      timestamp: Date.now(),
      type: this.inferEventType(delta, reason),
      description: reason,
      affectionDelta: delta,
    };

    const history = [...rel.history, event];
    if (history.length > MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - MAX_HISTORY_LENGTH);
    }

    const newAffection = clamp(rel.affection + delta, -100, 100);

    // Adjust trust based on the interaction pattern
    const trustDelta = this.computeTrustDelta(delta, rel);
    const newTrust = clamp(rel.trust + trustDelta, 0, 1);

    const updatedRel: SoulRelationship = {
      ...rel,
      affection: newAffection,
      trust: newTrust,
      history,
      lastInteraction: Date.now(),
    };

    // Reclassify the dynamic type
    updatedRel.dynamicType = this.classifyDynamic(updatedRel);

    const relationships = new Map(matrix.relationships);
    relationships.set(this.key(sourceId, targetId), updatedRel);

    return { ...matrix, relationships };
  }

  /**
   * Classify the dynamic type of a relationship based on its interaction history.
   *
   * Dynamic types:
   *   - ally: consistently positive interactions, high mutual affection
   *   - rival: consistently negative interactions, low affection
   *   - mentor: one-directional support pattern (older/wiser -> younger)
   *   - student: receiving guidance pattern
   *   - complex: mixed signals, unstable history
   *   - neutral: insufficient data or balanced interactions
   */
  classifyDynamic(relationship: SoulRelationship): SoulRelationship['dynamicType'] {
    const history = relationship.history;

    if (history.length < MIN_INTERACTIONS_FOR_CLASSIFICATION) {
      return 'neutral';
    }

    const recentHistory = history.slice(-20);
    const positiveCount = recentHistory.filter(
      e => e.type === 'agreement' || e.type === 'support' || e.type === 'revelation',
    ).length;
    const negativeCount = recentHistory.filter(
      e => e.type === 'conflict' || e.type === 'betrayal',
    ).length;
    const supportCount = recentHistory.filter(e => e.type === 'support').length;

    const totalSignificant = positiveCount + negativeCount;
    if (totalSignificant === 0) return 'neutral';

    const positiveRatio = positiveCount / totalSignificant;
    const negativeRatio = negativeCount / totalSignificant;

    // Strong positive with high support = mentor or ally
    if (positiveRatio > 0.7 && relationship.affection > ALLY_THRESHOLD) {
      if (supportCount > positiveCount * 0.5) {
        return 'mentor';
      }
      return 'ally';
    }

    // Strong negative = rival
    if (negativeRatio > 0.6 && relationship.affection < RIVAL_THRESHOLD) {
      return 'rival';
    }

    // Mixed signals = complex
    if (positiveRatio > 0.3 && negativeRatio > 0.3) {
      return 'complex';
    }

    // Low affection with mostly support received = student
    if (supportCount > 0 && positiveRatio > 0.5 && relationship.affection > 0) {
      return 'student';
    }

    return 'neutral';
  }

  /**
   * Find the soul with the strongest total connections (highest sum of absolute affection).
   *
   * @returns The soul ID with the strongest connections, or null if the matrix is empty
   */
  getMostConnected(matrix: Matrix): { soulId: string; totalAffection: number } | null {
    if (matrix.soulIds.length === 0) return null;

    let bestSoul: string | null = null;
    let bestTotal = -Infinity;

    for (const soulId of matrix.soulIds) {
      let total = 0;
      for (const otherId of matrix.soulIds) {
        if (soulId === otherId) continue;
        const rel = this.getRelationship(matrix, soulId, otherId);
        total += Math.abs(rel.affection);
      }
      if (total > bestTotal) {
        bestTotal = total;
        bestSoul = soulId;
      }
    }

    return bestSoul ? { soulId: bestSoul, totalAffection: bestTotal } : null;
  }

  /**
   * Find souls that have weak connections to everyone else (isolated souls).
   *
   * @returns Array of soul IDs whose total absolute affection is below the isolation threshold
   */
  getIsolated(matrix: Matrix): string[] {
    const isolated: string[] = [];

    for (const soulId of matrix.soulIds) {
      let totalAbsAffection = 0;
      for (const otherId of matrix.soulIds) {
        if (soulId === otherId) continue;
        const outgoing = this.getRelationship(matrix, soulId, otherId);
        const incoming = this.getRelationship(matrix, otherId, soulId);
        totalAbsAffection += Math.abs(outgoing.affection) + Math.abs(incoming.affection);
      }
      const avgAffection = totalAbsAffection / Math.max((matrix.soulIds.length - 1) * 2, 1);
      if (avgAffection < ISOLATION_THRESHOLD) {
        isolated.push(soulId);
      }
    }

    return isolated;
  }

  /**
   * Find pairs of souls with negative affection trends (rivals).
   *
   * @returns Array of soul pairs where both directions have negative affection
   */
  getRivals(matrix: Matrix): Array<{ soulA: string; soulB: string; avgAffection: number }> {
    const rivals: Array<{ soulA: string; soulB: string; avgAffection: number }> = [];
    const visited = new Set<string>();

    for (const soulA of matrix.soulIds) {
      for (const soulB of matrix.soulIds) {
        if (soulA === soulB) continue;

        const pairKey = [soulA, soulB].sort().join(':');
        if (visited.has(pairKey)) continue;
        visited.add(pairKey);

        const relAB = this.getRelationship(matrix, soulA, soulB);
        const relBA = this.getRelationship(matrix, soulB, soulA);
        const avgAffection = (relAB.affection + relBA.affection) / 2;

        if (avgAffection < RIVAL_THRESHOLD) {
          rivals.push({ soulA, soulB, avgAffection });
        }
      }
    }

    rivals.sort((a, b) => a.avgAffection - b.avgAffection);
    return rivals;
  }

  /**
   * Find pairs of souls with high mutual affection (allies).
   *
   * @returns Array of soul pairs where both directions have affection above the ally threshold
   */
  getAllies(matrix: Matrix): Array<{ soulA: string; soulB: string; avgAffection: number }> {
    const allies: Array<{ soulA: string; soulB: string; avgAffection: number }> = [];
    const visited = new Set<string>();

    for (const soulA of matrix.soulIds) {
      for (const soulB of matrix.soulIds) {
        if (soulA === soulB) continue;

        const pairKey = [soulA, soulB].sort().join(':');
        if (visited.has(pairKey)) continue;
        visited.add(pairKey);

        const relAB = this.getRelationship(matrix, soulA, soulB);
        const relBA = this.getRelationship(matrix, soulB, soulA);
        const avgAffection = (relAB.affection + relBA.affection) / 2;

        if (avgAffection > ALLY_THRESHOLD) {
          allies.push({ soulA, soulB, avgAffection });
        }
      }
    }

    allies.sort((a, b) => b.avgAffection - a.avgAffection);
    return allies;
  }

  /**
   * Convert the relationship matrix to a numeric adjacency matrix of affection values.
   *
   * @returns A 2D array where result[i][j] is the affection from soulIds[i] toward soulIds[j].
   *          Diagonal entries are 0.
   */
  toAdjacencyMatrix(matrix: Matrix): { soulIds: string[]; values: number[][] } {
    const n = matrix.soulIds.length;
    const values: number[][] = [];

    for (let i = 0; i < n; i++) {
      const row: number[] = [];
      for (let j = 0; j < n; j++) {
        if (i === j) {
          row.push(0);
        } else {
          const rel = this.getRelationship(matrix, matrix.soulIds[i], matrix.soulIds[j]);
          row.push(rel.affection);
        }
      }
      values.push(row);
    }

    return { soulIds: [...matrix.soulIds], values };
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  /** Generate a directional key for a relationship. */
  private key(sourceId: string, targetId: string): string {
    return `${sourceId}:${targetId}`;
  }

  /** Infer an event type from the affection delta and reason. */
  private inferEventType(delta: number, reason: string): RelationshipEvent['type'] {
    const lowerReason = reason.toLowerCase();

    if (lowerReason.includes('betray') || lowerReason.includes('treachery')) return 'betrayal';
    if (lowerReason.includes('conflict') || lowerReason.includes('argument')) return 'conflict';
    if (lowerReason.includes('reveal') || lowerReason.includes('confide')) return 'revelation';
    if (lowerReason.includes('support') || lowerReason.includes('help')) return 'support';
    if (lowerReason.includes('agree')) return 'agreement';

    if (delta > 3) return 'support';
    if (delta < -3) return 'conflict';
    return 'mundane';
  }

  /** Compute trust delta based on the affection change pattern. */
  private computeTrustDelta(affectionDelta: number, relationship: SoulRelationship): number {
    // Consistent positive interactions build trust slowly
    if (affectionDelta > 0) {
      return 0.02;
    }

    // Betrayal destroys trust significantly
    if (affectionDelta < -5) {
      return -0.1;
    }

    // Minor negative interactions erode trust slightly
    if (affectionDelta < 0) {
      return -0.03;
    }

    return 0;
  }
}

/** Singleton instance of the RelationshipMatrix system. */
export const relationshipMatrix = new RelationshipMatrix();
