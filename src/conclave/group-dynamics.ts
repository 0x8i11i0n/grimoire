// ============================================================
// The Soul Summoner's Grimoire — Group Dynamics
// How souls behave differently in groups vs one-on-one
// ============================================================

import {
  GroupState,
  SoulRelationship,
  clamp,
} from '../core/types';

import { type Matrix } from './relationship-matrix';

// --- Group Dynamics Types ---

/** Analysis report for a group's current dynamics. */
export interface GroupDynamicsReport {
  groupSize: number;
  cohesion: number;
  leaderSoulId: string | null;
  mediatorSoulId: string | null;
  outsiderSoulId: string | null;
  factions: Faction[];
  cohesionFactors: CohesionFactors;
  timestamp: number;
}

/** A natural subgroup or alliance within the larger group. */
export interface Faction {
  members: string[];
  cohesion: number;
  label: string;
}

/** Factors contributing to or detracting from group cohesion. */
export interface CohesionFactors {
  positiveFactors: string[];
  negativeFactors: string[];
  overallTrend: 'strengthening' | 'weakening' | 'stable';
}

/** Behavioral prediction for how a soul acts in different contexts. */
export interface BehaviorPrediction {
  soulId: string;
  isGroup: boolean;
  assertiveness: number;     // 0-1: how forcefully they express themselves
  openness: number;          // 0-1: willingness to share
  agreeableness: number;     // 0-1: tendency to go along with others
  initiativeRating: number;  // 0-1: likelihood to start conversations / suggest actions
  predictedRole: 'leader' | 'mediator' | 'follower' | 'contrarian' | 'observer';
}

/** Minimum group size for meaningful faction analysis. */
const MIN_FACTION_SIZE = 2;

/** Minimum mutual affection to consider two souls as factionally aligned. */
const FACTION_AFFECTION_THRESHOLD = 15;

/**
 * GroupDynamics — models how souls behave differently in groups vs 1-on-1.
 *
 * In one-on-one interactions, a soul focuses entirely on its conversational
 * partner. In groups, new dynamics emerge: leadership, mediation, conformity,
 * factions, and social positioning. This system models those emergent behaviors.
 */
export class GroupDynamics {

  /**
   * Produce a comprehensive analysis of a group's current dynamics.
   *
   * @param group         — the group state
   * @param relationships — the full relationship matrix for the group
   * @returns A GroupDynamicsReport
   */
  analyzeDynamics(group: GroupState, relationships: Matrix): GroupDynamicsReport {
    const leaderSoulId = this.getLeader(group, relationships);
    const mediatorSoulId = this.getMediator(group, relationships);
    const outsiderSoulId = this.getOutsider(group, relationships);
    const factions = this.getFactionLines(group, relationships);
    const cohesionFactors = this.getCohesionFactors(group);

    return {
      groupSize: group.souls.length,
      cohesion: group.cohesion,
      leaderSoulId,
      mediatorSoulId,
      outsiderSoulId,
      factions,
      cohesionFactors,
      timestamp: Date.now(),
    };
  }

  /**
   * Determine which soul naturally takes charge in the group.
   *
   * Leadership score is based on:
   *   - Total outgoing affection (charisma / influence)
   *   - Total incoming affection (popularity / respect)
   *   - Number of significant interactions initiated
   *   - Absence of isolation
   *
   * @returns The soul ID of the natural leader, or null if the group is empty
   */
  getLeader(group: GroupState, relationships: Matrix): string | null {
    if (group.souls.length === 0) return null;

    const scores = new Map<string, number>();

    for (const soulId of group.souls) {
      let score = 0;

      for (const otherId of group.souls) {
        if (soulId === otherId) continue;

        const outgoing = this.findRelationship(relationships, soulId, otherId);
        const incoming = this.findRelationship(relationships, otherId, soulId);

        // Outgoing positive affection = influence
        if (outgoing.affection > 0) {
          score += outgoing.affection * 0.3;
        }

        // Incoming positive affection = respect
        if (incoming.affection > 0) {
          score += incoming.affection * 0.5;
        }

        // Interaction frequency
        score += outgoing.history.length * 0.2;

        // Trust received
        score += incoming.trust * 10;
      }

      scores.set(soulId, score);
    }

    return this.highestScored(scores);
  }

  /**
   * Determine which soul naturally resolves conflicts (the mediator).
   *
   * Mediator score is based on:
   *   - Balanced relationships (not too strong affection toward any single soul)
   *   - High trust from many souls
   *   - Participation in resolved conflicts
   *   - Moderate affection (not extreme love or hate)
   *
   * @returns The soul ID of the natural mediator, or null if the group is empty
   */
  getMediator(group: GroupState, relationships: Matrix): string | null {
    if (group.souls.length === 0) return null;

    const scores = new Map<string, number>();

    for (const soulId of group.souls) {
      let score = 0;

      // Collect affection values toward this soul
      const incomingAffections: number[] = [];
      const outgoingAffections: number[] = [];

      for (const otherId of group.souls) {
        if (soulId === otherId) continue;

        const incoming = this.findRelationship(relationships, otherId, soulId);
        const outgoing = this.findRelationship(relationships, soulId, otherId);

        incomingAffections.push(incoming.affection);
        outgoingAffections.push(outgoing.affection);

        // Trust from others is important for mediators
        score += incoming.trust * 15;
      }

      // Balance: low variance in affections = better mediator
      const outVariance = this.variance(outgoingAffections);
      const balanceScore = Math.max(0, 1 - outVariance / 1000);
      score += balanceScore * 20;

      // Moderate affection: not too positive or negative toward anyone
      const avgAbsAffection = outgoingAffections.reduce(
        (sum, a) => sum + Math.abs(a), 0,
      ) / Math.max(outgoingAffections.length, 1);
      if (avgAbsAffection < 30) {
        score += 10; // moderately connected
      }

      // Participation in resolved conflicts
      const resolvedWithSoul = group.conflictLog.filter(
        c => c.resolved && c.participants.includes(soulId),
      );
      score += resolvedWithSoul.length * 5;

      scores.set(soulId, score);
    }

    return this.highestScored(scores);
  }

  /**
   * Determine which soul is least integrated into the group (the outsider).
   *
   * Outsider score is based on:
   *   - Low total absolute affection (disconnected)
   *   - Low trust from others
   *   - Few interactions
   *
   * @returns The soul ID of the outsider, or null if the group is empty
   */
  getOutsider(group: GroupState, relationships: Matrix): string | null {
    if (group.souls.length === 0) return null;

    // Invert the scoring: lowest connection = outsider
    const connectionScores = new Map<string, number>();

    for (const soulId of group.souls) {
      let connectionStrength = 0;

      for (const otherId of group.souls) {
        if (soulId === otherId) continue;

        const outgoing = this.findRelationship(relationships, soulId, otherId);
        const incoming = this.findRelationship(relationships, otherId, soulId);

        connectionStrength += Math.abs(outgoing.affection);
        connectionStrength += Math.abs(incoming.affection);
        connectionStrength += incoming.trust * 20;
        connectionStrength += outgoing.history.length;
      }

      connectionScores.set(soulId, connectionStrength);
    }

    // Return the soul with the lowest connection strength
    return this.lowestScored(connectionScores);
  }

  /**
   * Predict how a soul would behave in a given context (group vs solo).
   *
   * In groups, souls tend to:
   *   - Be less open (audience effect)
   *   - Conform more to dominant opinions (social pressure)
   *   - Show more varied behavior depending on who else is present
   *
   * @param soulId       — the soul to predict behavior for
   * @param context      — contextual info (group members, recent topic, etc.)
   * @param isGroup      — whether this is a group interaction
   * @returns A BehaviorPrediction
   */
  predictBehavior(
    soulId: string,
    context: { groupMembers?: string[]; relationships?: Matrix; recentTopic?: string },
    isGroup: boolean,
  ): BehaviorPrediction {
    let assertiveness = 0.5;
    let openness = 0.6;
    let agreeableness = 0.5;
    let initiativeRating = 0.5;

    if (isGroup && context.groupMembers && context.relationships) {
      // In groups: adjust based on relationships with other members
      const relationships = context.relationships;
      const others = context.groupMembers.filter(id => id !== soulId);

      let totalIncomingAffection = 0;
      let totalTrustReceived = 0;
      let allyCount = 0;
      let rivalCount = 0;

      for (const otherId of others) {
        const incoming = this.findRelationship(relationships, otherId, soulId);
        const outgoing = this.findRelationship(relationships, soulId, otherId);

        totalIncomingAffection += incoming.affection;
        totalTrustReceived += incoming.trust;

        if (outgoing.dynamicType === 'ally') allyCount++;
        if (outgoing.dynamicType === 'rival') rivalCount++;
      }

      const avgIncomingAffection = totalIncomingAffection / Math.max(others.length, 1);
      const avgTrust = totalTrustReceived / Math.max(others.length, 1);

      // High incoming affection = more assertive (popular)
      assertiveness = clamp(0.4 + (avgIncomingAffection / 100) * 0.3 + (allyCount * 0.1), 0, 1);

      // Group context reduces openness (audience effect)
      openness = clamp(0.3 + avgTrust * 0.3, 0, 1);

      // Rivals present makes soul more contrarian; allies make it more agreeable
      agreeableness = clamp(0.5 + (allyCount * 0.1) - (rivalCount * 0.15), 0, 1);

      // Initiative is higher when soul feels safe (trusted and liked)
      initiativeRating = clamp(0.3 + avgTrust * 0.3 + (avgIncomingAffection > 10 ? 0.2 : 0), 0, 1);
    } else {
      // Solo (1-on-1): soul is generally more open and expressive
      openness = 0.7;
      assertiveness = 0.5;
      agreeableness = 0.6;
      initiativeRating = 0.6;
    }

    // Determine predicted role
    let predictedRole: BehaviorPrediction['predictedRole'];
    if (assertiveness > 0.7 && initiativeRating > 0.6) {
      predictedRole = 'leader';
    } else if (agreeableness > 0.7 && assertiveness < 0.4) {
      predictedRole = 'follower';
    } else if (agreeableness < 0.3) {
      predictedRole = 'contrarian';
    } else if (openness < 0.3 && assertiveness < 0.4) {
      predictedRole = 'observer';
    } else {
      predictedRole = 'mediator';
    }

    return {
      soulId,
      isGroup,
      assertiveness,
      openness,
      agreeableness,
      initiativeRating,
      predictedRole,
    };
  }

  /**
   * Identify natural subgroups / alliances within the group.
   *
   * Uses a simple greedy clustering approach: start with the strongest
   * mutual bond and expand outward, grouping souls with high mutual
   * affection together.
   *
   * @returns Array of Factions (may overlap, as souls can be in multiple factions)
   */
  getFactionLines(group: GroupState, relationships: Matrix): Faction[] {
    if (group.souls.length < 3) {
      // Too small for meaningful factions
      return [];
    }

    // Build an adjacency list of mutual affection
    const mutualAffection = new Map<string, Map<string, number>>();
    for (const soulA of group.souls) {
      mutualAffection.set(soulA, new Map());
      for (const soulB of group.souls) {
        if (soulA === soulB) continue;

        const relAB = this.findRelationship(relationships, soulA, soulB);
        const relBA = this.findRelationship(relationships, soulB, soulA);
        const mutual = (relAB.affection + relBA.affection) / 2;
        mutualAffection.get(soulA)!.set(soulB, mutual);
      }
    }

    // Find connected components above the threshold
    const visited = new Set<string>();
    const factions: Faction[] = [];

    for (const soulId of group.souls) {
      if (visited.has(soulId)) continue;

      // BFS to find all souls connected to this one above threshold
      const faction: string[] = [];
      const queue: string[] = [soulId];
      const factionVisited = new Set<string>();

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (factionVisited.has(current)) continue;
        factionVisited.add(current);
        faction.push(current);

        const neighbors = mutualAffection.get(current);
        if (neighbors) {
          for (const [neighbor, affection] of neighbors) {
            if (!factionVisited.has(neighbor) && affection >= FACTION_AFFECTION_THRESHOLD) {
              queue.push(neighbor);
            }
          }
        }
      }

      if (faction.length >= MIN_FACTION_SIZE) {
        // Calculate internal cohesion of this faction
        let totalMutual = 0;
        let pairs = 0;
        for (let i = 0; i < faction.length; i++) {
          for (let j = i + 1; j < faction.length; j++) {
            const mutual = mutualAffection.get(faction[i])?.get(faction[j]) ?? 0;
            totalMutual += mutual;
            pairs++;
          }
        }
        const avgMutual = pairs > 0 ? totalMutual / pairs : 0;
        const cohesion = clamp((avgMutual + 100) / 200, 0, 1);

        // Label the faction
        let label: string;
        if (cohesion > 0.75) label = 'tight alliance';
        else if (cohesion > 0.6) label = 'friendly cluster';
        else label = 'loose association';

        factions.push({ members: faction, cohesion, label });

        // Mark these souls as visited so they form one faction
        for (const member of faction) {
          visited.add(member);
        }
      } else {
        visited.add(soulId);
      }
    }

    factions.sort((a, b) => b.cohesion - a.cohesion);
    return factions;
  }

  /**
   * Analyze what's holding the group together and what's pulling it apart.
   *
   * @returns CohesionFactors with positive/negative factors and trend
   */
  getCohesionFactors(group: GroupState): CohesionFactors {
    const positiveFactors: string[] = [];
    const negativeFactors: string[] = [];

    // Analyze conflicts
    const unresolvedConflicts = group.conflictLog.filter(c => !c.resolved);
    const resolvedConflicts = group.conflictLog.filter(c => c.resolved);

    if (unresolvedConflicts.length > 0) {
      negativeFactors.push(
        `${unresolvedConflicts.length} unresolved conflict(s) creating tension`,
      );
    }

    if (resolvedConflicts.length > 0) {
      positiveFactors.push(
        `${resolvedConflicts.length} successfully resolved conflict(s) demonstrating resilience`,
      );
    }

    // Analyze cohesion level
    if (group.cohesion > 0.7) {
      positiveFactors.push('Strong group cohesion supporting unity');
    } else if (group.cohesion < 0.3) {
      negativeFactors.push('Low group cohesion indicating fragmentation risk');
    }

    // Group size effects
    if (group.souls.length > 5) {
      negativeFactors.push('Large group size makes maintaining cohesion harder');
    } else if (group.souls.length >= 3 && group.souls.length <= 5) {
      positiveFactors.push('Manageable group size supports natural interaction');
    }

    // Shared memories as bonding factor
    if (group.sharedMemoryIds.length > 10) {
      positiveFactors.push('Rich shared history provides common ground');
    } else if (group.sharedMemoryIds.length === 0) {
      negativeFactors.push('No shared memories yet; group lacks common experiences');
    }

    // Recent gathering as engagement indicator
    const daysSinceGathering = (Date.now() - group.lastGathering) / (1000 * 60 * 60 * 24);
    if (daysSinceGathering > 7) {
      negativeFactors.push('Extended time since last gathering may erode bonds');
    } else if (daysSinceGathering < 1) {
      positiveFactors.push('Recent gathering keeps connections fresh');
    }

    // Determine overall trend
    let overallTrend: CohesionFactors['overallTrend'];
    if (positiveFactors.length > negativeFactors.length + 1) {
      overallTrend = 'strengthening';
    } else if (negativeFactors.length > positiveFactors.length + 1) {
      overallTrend = 'weakening';
    } else {
      overallTrend = 'stable';
    }

    return { positiveFactors, negativeFactors, overallTrend };
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  /**
   * Find a relationship in the matrix, returning a default if not found.
   */
  private findRelationship(
    matrix: Matrix,
    sourceId: string,
    targetId: string,
  ): SoulRelationship {
    const key = `${sourceId}:${targetId}`;
    const existing = matrix.relationships.get(key);
    if (existing) return existing;

    return {
      sourceId,
      targetId,
      affection: 0,
      trust: 0.5,
      dynamicType: 'neutral',
      history: [],
      lastInteraction: Date.now(),
    };
  }

  /** Return the key with the highest score, or null if empty. */
  private highestScored(scores: Map<string, number>): string | null {
    let bestKey: string | null = null;
    let bestScore = -Infinity;

    for (const [key, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestKey = key;
      }
    }

    return bestKey;
  }

  /** Return the key with the lowest score, or null if empty. */
  private lowestScored(scores: Map<string, number>): string | null {
    let worstKey: string | null = null;
    let worstScore = Infinity;

    for (const [key, score] of scores) {
      if (score < worstScore) {
        worstScore = score;
        worstKey = key;
      }
    }

    return worstKey;
  }

  /** Compute the variance of a number array. */
  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  }
}

/** Singleton instance of the GroupDynamics system. */
export const groupDynamics = new GroupDynamics();
