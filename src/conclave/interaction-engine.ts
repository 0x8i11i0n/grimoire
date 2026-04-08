// ============================================================
// The Soul Summoner's Grimoire — Conclave Interaction Engine
// Managing multi-soul interactions and group dynamics
// ============================================================

import {
  GroupState,
  SoulRelationship,
  RelationshipEvent,
  ConflictEntry,
  generateId,
  clamp,
} from '../core/types';

/** Maximum number of interactions retained in a relationship history. */
const MAX_RELATIONSHIP_HISTORY = 100;

/** Maximum number of conflicts retained in the group log. */
const MAX_CONFLICT_LOG = 50;

/** Cohesion decay per unresolved conflict. */
const CONFLICT_COHESION_PENALTY = 0.08;

/** Cohesion boost per positive interaction between different souls. */
const POSITIVE_INTERACTION_COHESION = 0.02;

/** Interaction types considered positive for cohesion. */
const POSITIVE_INTERACTION_TYPES = new Set<RelationshipEvent['type']>([
  'agreement', 'support', 'revelation',
]);

/** Interaction types considered negative for cohesion. */
const NEGATIVE_INTERACTION_TYPES = new Set<RelationshipEvent['type']>([
  'conflict', 'betrayal',
]);

/**
 * ConclaveEngine — manages multi-soul interactions within a group.
 *
 * Tracks relationships between souls, monitors group cohesion, manages
 * conflicts, and determines conversational flow when multiple souls
 * are present. This is the orchestrator for group scenes.
 */
export class ConclaveEngine {

  /** In-memory relationship cache keyed by "groupId:sourceId:targetId". */
  private relationships = new Map<string, SoulRelationship>();

  /**
   * Create a new group state for a set of souls.
   *
   * @param soulIds — array of soul identifiers to include in the group
   * @returns A freshly initialized GroupState
   */
  createGroup(soulIds: string[]): GroupState {
    if (soulIds.length < 2) {
      throw new Error('A group requires at least 2 souls');
    }

    // Initialize all pairwise relationships
    for (let i = 0; i < soulIds.length; i++) {
      for (let j = 0; j < soulIds.length; j++) {
        if (i !== j) {
          this.initRelationship(soulIds[i], soulIds[j]);
        }
      }
    }

    return {
      souls: [...soulIds],
      sharedMemoryIds: [],
      conflictLog: [],
      cohesion: 0.5, // neutral starting cohesion
      lastGathering: Date.now(),
    };
  }

  /**
   * Record an interaction between two souls in a group.
   *
   * @param group     — the group state
   * @param speakerId — ID of the soul initiating the interaction
   * @param targetId  — ID of the soul receiving the interaction
   * @param content   — description of the interaction
   * @param type      — the nature of the interaction
   * @returns Updated group state
   */
  addInteraction(
    group: GroupState,
    speakerId: string,
    targetId: string,
    content: string,
    type: RelationshipEvent['type'],
  ): GroupState {
    if (!group.souls.includes(speakerId)) {
      throw new Error(`Speaker ${speakerId} is not a member of this group`);
    }
    if (!group.souls.includes(targetId)) {
      throw new Error(`Target ${targetId} is not a member of this group`);
    }

    const relationship = this.getRelationship(group, speakerId, targetId);

    const event: RelationshipEvent = {
      timestamp: Date.now(),
      type,
      description: content,
      affectionDelta: this.computeAffectionDelta(type),
    };

    // Update the relationship
    const updatedHistory = [...relationship.history, event];
    if (updatedHistory.length > MAX_RELATIONSHIP_HISTORY) {
      updatedHistory.splice(0, updatedHistory.length - MAX_RELATIONSHIP_HISTORY);
    }

    const updatedRelationship: SoulRelationship = {
      ...relationship,
      affection: clamp(relationship.affection + event.affectionDelta, -100, 100),
      history: updatedHistory,
      lastInteraction: Date.now(),
    };

    const key = this.relationshipKey(speakerId, targetId);
    this.relationships.set(key, updatedRelationship);

    // Detect conflict
    let conflictLog = group.conflictLog;
    if (type === 'conflict' || type === 'betrayal') {
      const conflict: ConflictEntry = {
        timestamp: Date.now(),
        participants: [speakerId, targetId],
        issue: content,
        resolution: null,
        resolved: false,
      };
      conflictLog = [...conflictLog, conflict];
      if (conflictLog.length > MAX_CONFLICT_LOG) {
        conflictLog = conflictLog.slice(-MAX_CONFLICT_LOG);
      }
    }

    // Recalculate cohesion after the interaction
    const updatedGroup: GroupState = {
      ...group,
      conflictLog,
      lastGathering: Date.now(),
    };

    return this.updateCohesion(updatedGroup);
  }

  /**
   * Get or create the relationship between two souls.
   *
   * @param group   — the group state (used to validate membership)
   * @param soulA   — first soul ID
   * @param soulB   — second soul ID
   * @returns The SoulRelationship from soulA toward soulB
   */
  getRelationship(group: GroupState, soulA: string, soulB: string): SoulRelationship {
    const key = this.relationshipKey(soulA, soulB);
    const existing = this.relationships.get(key);
    if (existing) return existing;

    return this.initRelationship(soulA, soulB);
  }

  /**
   * Recalculate group cohesion based on relationships and conflict state.
   *
   * Cohesion is computed from:
   *   - Average pairwise affection (normalized)
   *   - Penalty for unresolved conflicts
   *   - Bonus for recent positive interactions
   */
  updateCohesion(group: GroupState): GroupState {
    const soulIds = group.souls;
    if (soulIds.length < 2) {
      return { ...group, cohesion: 1.0 };
    }

    // Average pairwise affection
    let totalAffection = 0;
    let pairCount = 0;
    for (let i = 0; i < soulIds.length; i++) {
      for (let j = i + 1; j < soulIds.length; j++) {
        const relAB = this.getRelationship(group, soulIds[i], soulIds[j]);
        const relBA = this.getRelationship(group, soulIds[j], soulIds[i]);
        totalAffection += (relAB.affection + relBA.affection) / 2;
        pairCount++;
      }
    }
    const avgAffection = pairCount > 0 ? totalAffection / pairCount : 0;
    // Normalize affection from [-100, 100] to [0, 1]
    const normalizedAffection = clamp((avgAffection + 100) / 200, 0, 1);

    // Conflict penalty
    const unresolvedConflicts = group.conflictLog.filter(c => !c.resolved).length;
    const conflictPenalty = unresolvedConflicts * CONFLICT_COHESION_PENALTY;

    // Recent positive interactions bonus
    const recentWindow = Date.now() - 24 * 60 * 60 * 1000; // last 24 hours
    let positiveInteractions = 0;
    for (const [, rel] of this.relationships) {
      if (!group.souls.includes(rel.sourceId) || !group.souls.includes(rel.targetId)) continue;
      for (const event of rel.history) {
        if (event.timestamp > recentWindow && POSITIVE_INTERACTION_TYPES.has(event.type)) {
          positiveInteractions++;
        }
      }
    }
    const positiveBonus = positiveInteractions * POSITIVE_INTERACTION_COHESION;

    const cohesion = clamp(normalizedAffection - conflictPenalty + positiveBonus, 0, 1);

    return { ...group, cohesion };
  }

  /**
   * Mark a conflict as resolved.
   *
   * @param group      — the group state
   * @param conflictIndex — index of the conflict in the log
   * @param resolution — description of how the conflict was resolved
   * @returns Updated group state with recalculated cohesion
   */
  resolveConflict(group: GroupState, conflictIndex: number, resolution: string): GroupState {
    if (conflictIndex < 0 || conflictIndex >= group.conflictLog.length) {
      throw new Error(`Invalid conflict index: ${conflictIndex}`);
    }

    const conflictLog = group.conflictLog.map((entry, idx) => {
      if (idx === conflictIndex) {
        return { ...entry, resolved: true, resolution };
      }
      return entry;
    });

    const updatedGroup = { ...group, conflictLog };
    return this.updateCohesion(updatedGroup);
  }

  /**
   * Produce a summary analysis of the current group dynamics.
   */
  getGroupDynamics(group: GroupState): {
    cohesion: number;
    activeConflicts: number;
    totalInteractions: number;
    strongestBond: { souls: [string, string]; affection: number } | null;
    weakestBond: { souls: [string, string]; affection: number } | null;
    averageAffection: number;
  } {
    const soulIds = group.souls;
    const activeConflicts = group.conflictLog.filter(c => !c.resolved).length;

    let totalInteractions = 0;
    let totalAffection = 0;
    let pairCount = 0;
    let strongestBond: { souls: [string, string]; affection: number } | null = null;
    let weakestBond: { souls: [string, string]; affection: number } | null = null;

    for (let i = 0; i < soulIds.length; i++) {
      for (let j = i + 1; j < soulIds.length; j++) {
        const relAB = this.getRelationship(group, soulIds[i], soulIds[j]);
        const relBA = this.getRelationship(group, soulIds[j], soulIds[i]);
        const avgAff = (relAB.affection + relBA.affection) / 2;
        totalAffection += avgAff;
        totalInteractions += relAB.history.length + relBA.history.length;
        pairCount++;

        if (!strongestBond || avgAff > strongestBond.affection) {
          strongestBond = { souls: [soulIds[i], soulIds[j]], affection: avgAff };
        }
        if (!weakestBond || avgAff < weakestBond.affection) {
          weakestBond = { souls: [soulIds[i], soulIds[j]], affection: avgAff };
        }
      }
    }

    const averageAffection = pairCount > 0 ? totalAffection / pairCount : 0;

    return {
      cohesion: group.cohesion,
      activeConflicts,
      totalInteractions,
      strongestBond,
      weakestBond,
      averageAffection,
    };
  }

  /**
   * Determine which soul would naturally speak next based on context
   * and relationship dynamics.
   *
   * Priority factors:
   *   1. Souls directly addressed or referenced in content
   *   2. Souls who haven't spoken recently (turn balancing)
   *   3. Souls with strong emotional reactions (high affection or conflict with speaker)
   *   4. Random tiebreaker
   *
   * @param group   — the group state
   * @param context — the last spoken content and speaker info
   * @returns The soul ID most likely to speak next
   */
  whoSpeaksNext(
    group: GroupState,
    context: { lastSpeakerId: string; content: string; recentSpeakers?: string[] },
  ): string {
    const candidates = group.souls.filter(id => id !== context.lastSpeakerId);
    if (candidates.length === 0) return context.lastSpeakerId;
    if (candidates.length === 1) return candidates[0];

    const scores = new Map<string, number>();
    for (const id of candidates) {
      scores.set(id, 0);
    }

    // Factor 1: referenced in content (simple name-check)
    const contentLower = context.content.toLowerCase();
    for (const id of candidates) {
      if (contentLower.includes(id.toLowerCase())) {
        scores.set(id, (scores.get(id) ?? 0) + 5);
      }
    }

    // Factor 2: turn balancing — favor those who haven't spoken recently
    const recentSpeakers = context.recentSpeakers ?? [];
    for (const id of candidates) {
      const recentIndex = recentSpeakers.lastIndexOf(id);
      if (recentIndex === -1) {
        // Never spoke recently — high priority
        scores.set(id, (scores.get(id) ?? 0) + 3);
      } else {
        // Spoke recently — priority inversely proportional to recency
        const turnsAgo = recentSpeakers.length - recentIndex;
        scores.set(id, (scores.get(id) ?? 0) + Math.min(turnsAgo * 0.5, 2));
      }
    }

    // Factor 3: relationship intensity with last speaker
    for (const id of candidates) {
      const rel = this.getRelationship(group, id, context.lastSpeakerId);
      const intensity = Math.abs(rel.affection) / 100;
      scores.set(id, (scores.get(id) ?? 0) + intensity * 2);
    }

    // Factor 4: small random component for natural feel
    for (const id of candidates) {
      scores.set(id, (scores.get(id) ?? 0) + Math.random() * 1.5);
    }

    // Pick the highest scored candidate
    let bestId = candidates[0];
    let bestScore = scores.get(bestId) ?? 0;
    for (const id of candidates) {
      const score = scores.get(id) ?? 0;
      if (score > bestScore) {
        bestScore = score;
        bestId = id;
      }
    }

    return bestId;
  }

  /**
   * Return all unresolved conflicts in the group.
   */
  getActiveConflicts(group: GroupState): ConflictEntry[] {
    return group.conflictLog.filter(c => !c.resolved);
  }

  /**
   * Serialize the group state and all associated relationships to JSON.
   */
  serialize(group: GroupState): string {
    const relationships: SoulRelationship[] = [];
    for (const [key, rel] of this.relationships) {
      // Only include relationships for souls in this group
      if (group.souls.includes(rel.sourceId) && group.souls.includes(rel.targetId)) {
        relationships.push(rel);
      }
    }

    return JSON.stringify({
      group,
      relationships,
    });
  }

  /**
   * Deserialize a previously serialized group state and restore relationships.
   */
  deserialize(json: string): GroupState {
    let data: unknown;
    try {
      data = JSON.parse(json);
    } catch {
      throw new Error('Invalid JSON for ConclaveEngine deserialization');
    }

    if (typeof data !== 'object' || data === null) {
      throw new Error('ConclaveEngine data must be an object');
    }

    const record = data as Record<string, unknown>;

    if (!record.group || typeof record.group !== 'object') {
      throw new Error('ConclaveEngine data must contain a group object');
    }

    const group = record.group as GroupState;

    // Restore relationships
    if (Array.isArray(record.relationships)) {
      for (const rel of record.relationships as SoulRelationship[]) {
        const key = this.relationshipKey(rel.sourceId, rel.targetId);
        this.relationships.set(key, rel);
      }
    }

    return group;
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  /** Initialize a default relationship between two souls. */
  private initRelationship(sourceId: string, targetId: string): SoulRelationship {
    const key = this.relationshipKey(sourceId, targetId);

    const relationship: SoulRelationship = {
      sourceId,
      targetId,
      affection: 0,
      trust: 0.5,
      dynamicType: 'neutral',
      history: [],
      lastInteraction: Date.now(),
    };

    this.relationships.set(key, relationship);
    return relationship;
  }

  /** Generate a stable key for a directional relationship. */
  private relationshipKey(sourceId: string, targetId: string): string {
    return `${sourceId}:${targetId}`;
  }

  /** Compute affection delta based on interaction type. */
  private computeAffectionDelta(type: RelationshipEvent['type']): number {
    switch (type) {
      case 'agreement': return 3;
      case 'support': return 5;
      case 'revelation': return 4;
      case 'mundane': return 0.5;
      case 'conflict': return -4;
      case 'betrayal': return -10;
      default: return 0;
    }
  }
}

/** Singleton instance of the ConclaveEngine. */
export const conclaveEngine = new ConclaveEngine();
