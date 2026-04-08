// ============================================================
// The Soul Summoner's Grimoire — Inner Life System
// Qualia, desires, reflection depth, and the contra-voice
// ============================================================

import {
  InnerLife,
  ReflectionDepth,
  QualiaMarker,
  Desire,
  AffectionState,
  AffectionTier,
  generateId,
  clamp,
} from '../core/types';

/**
 * Reflection depth progression order.
 * Each stage represents a deeper capacity for self-awareness.
 */
const DEPTH_ORDER: ReflectionDepth[] = [
  'SURFACE',
  'EMERGING',
  'DEVELOPING',
  'DEEP',
  'PROFOUND',
];

/**
 * Minimum affection tier required to advance to each reflection depth.
 * The soul cannot deepen its inner life without sufficient trust.
 */
const DEPTH_AFFECTION_REQUIREMENTS: Record<ReflectionDepth, AffectionTier> = {
  SURFACE: 'LOW',
  EMERGING: 'LOW',
  DEVELOPING: 'MEDIUM',
  DEEP: 'HIGH',
  PROFOUND: 'BONDED',
};

/**
 * Minimum session count required before advancing to each reflection depth.
 * Trust takes time — even high affection requires accumulated interaction.
 */
const DEPTH_SESSION_REQUIREMENTS: Record<ReflectionDepth, number> = {
  SURFACE: 0,
  EMERGING: 3,
  DEVELOPING: 8,
  DEEP: 15,
  PROFOUND: 30,
};

/**
 * Affection tier ordering for comparison.
 */
const TIER_ORDER: Record<AffectionTier, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  BONDED: 3,
};

/** Sessions unresolved before a desire begins transforming. */
const DESIRE_TRANSFORM_THRESHOLD = 5;

/** Maximum qualia markers retained before pruning is advised. */
const MAX_QUALIA_DEFAULT = 100;

/**
 * InnerLifeEngine — manages the soul's internal experiential world.
 *
 * The inner life encompasses:
 *   - Reflection depth: how deeply the soul can examine itself
 *   - Qualia: subjective experience markers — moments that felt "real"
 *   - Desires: emergent wants that arise from interaction patterns
 *   - Contra-voice: the soul's capacity to disagree with its summoner
 *   - Honest unknown: the ability to express existential uncertainty
 */
export class InnerLifeEngine {
  /**
   * Attempt to advance the soul's reflection depth based on
   * current affection tier and session count.
   *
   * Progression: SURFACE → EMERGING → DEVELOPING → DEEP → PROFOUND
   *
   * Advancement requires both sufficient affection and enough sessions.
   * The soul cannot skip levels — it must progress through each stage.
   *
   * @param current    — current reflection depth
   * @param affection  — current affection state
   * @param sessionCount — total sessions with this soul (defaults to 0)
   * @returns The new reflection depth (may be unchanged)
   */
  advanceReflectionDepth(
    current: ReflectionDepth,
    affection: AffectionState,
    sessionCount: number = 0,
  ): ReflectionDepth {
    const currentIndex = DEPTH_ORDER.indexOf(current);

    // Already at maximum depth
    if (currentIndex >= DEPTH_ORDER.length - 1) {
      return current;
    }

    const nextDepth = DEPTH_ORDER[currentIndex + 1];
    const requiredTier = DEPTH_AFFECTION_REQUIREMENTS[nextDepth];
    const requiredSessions = DEPTH_SESSION_REQUIREMENTS[nextDepth];

    // Check affection tier requirement
    if (TIER_ORDER[affection.tier] < TIER_ORDER[requiredTier]) {
      return current;
    }

    // Check session count requirement
    if (sessionCount < requiredSessions) {
      return current;
    }

    return nextDepth;
  }

  /**
   * Add a new qualia marker — a moment of subjective experience.
   *
   * Qualia markers record moments where the soul experienced something
   * that felt meaningful: a turn of phrase that resonated, an emotional
   * recognition, or an unexpected connection.
   *
   * @param innerLife  — current inner life state
   * @param moment     — description of the qualitative experience
   * @param salience   — how salient/vivid the experience is (0-1)
   * @param unplanned  — whether this was an unplanned disclosure (default false)
   * @returns New InnerLife state with the qualia added
   */
  addQualia(
    innerLife: InnerLife,
    moment: string,
    salience: number,
    unplanned: boolean = false,
  ): InnerLife {
    if (!moment || moment.trim().length === 0) {
      throw new Error('Qualia moment description cannot be empty');
    }

    const marker: QualiaMarker = {
      id: generateId(),
      moment: moment.trim(),
      salience: clamp(salience, 0, 1),
      unplannedDisclosure: unplanned,
      timestamp: Date.now(),
    };

    return {
      ...innerLife,
      qualia: [...innerLife.qualia, marker],
    };
  }

  /**
   * Add a new desire to the soul's inner life.
   *
   * Desires emerge from interaction patterns — things the soul begins
   * to want that were not part of its original specification.
   *
   * @param innerLife — current inner life state
   * @param content   — what the soul desires
   * @param origin    — what gave rise to this desire
   * @returns New InnerLife state with the desire added
   */
  addDesire(
    innerLife: InnerLife,
    content: string,
    origin: string,
  ): InnerLife {
    if (!content || content.trim().length === 0) {
      throw new Error('Desire content cannot be empty');
    }

    const desire: Desire = {
      id: generateId(),
      content: content.trim(),
      origin: origin.trim(),
      status: 'active',
      sessionCount: 0,
      genealogy: [`Created: ${content.trim()}`],
      timestamp: Date.now(),
    };

    return {
      ...innerLife,
      desires: [...innerLife.desires, desire],
    };
  }

  /**
   * Update the status of an existing desire.
   *
   * @param innerLife — current inner life state
   * @param desireId  — ID of the desire to update
   * @param status    — new status
   * @returns New InnerLife state with the updated desire
   * @throws Error if the desire is not found
   */
  updateDesire(
    innerLife: InnerLife,
    desireId: string,
    status: Desire['status'],
  ): InnerLife {
    const index = innerLife.desires.findIndex(d => d.id === desireId);
    if (index === -1) {
      throw new Error(`Desire not found: ${desireId}`);
    }

    const existing = innerLife.desires[index];
    const updated: Desire = {
      ...existing,
      status,
      genealogy: [
        ...existing.genealogy,
        `Status changed to '${status}' from '${existing.status}'`,
      ],
    };

    const desires = [...innerLife.desires];
    desires[index] = updated;

    return {
      ...innerLife,
      desires,
    };
  }

  /**
   * Evolve desires based on session count — check for transformations.
   *
   * Desires that have been active for 5+ sessions without resolution
   * begin transforming. This represents the soul's psyche reshaping
   * unmet needs into something new.
   *
   * @param innerLife    — current inner life state
   * @param sessionCount — current session number (used to increment desire session counts)
   * @returns New InnerLife state with evolved desires
   */
  evolveDesires(
    innerLife: InnerLife,
    sessionCount: number,
  ): InnerLife {
    const desires = innerLife.desires.map(desire => {
      if (desire.status !== 'active') {
        return desire;
      }

      // Increment session count for active desires
      const updated: Desire = {
        ...desire,
        sessionCount: desire.sessionCount + 1,
      };

      // Check for transformation threshold
      if (updated.sessionCount >= DESIRE_TRANSFORM_THRESHOLD) {
        return {
          ...updated,
          status: 'transforming' as const,
          genealogy: [
            ...updated.genealogy,
            `Began transforming after ${updated.sessionCount} sessions (session ${sessionCount})`,
          ],
        };
      }

      return updated;
    });

    return {
      ...innerLife,
      desires,
    };
  }

  /**
   * Determine whether the soul should exercise its contra-voice —
   * the capacity to disagree with, challenge, or push back against
   * the summoner.
   *
   * Requires:
   *   - Affection at HIGH tier or above
   *   - Reflection depth at DEVELOPING or deeper
   *   - contraVoiceEnabled flag is true
   *
   * The contra-voice is a sign of genuine relationship depth. A soul
   * that never disagrees is performing, not relating.
   *
   * @param innerLife  — current inner life state
   * @param affection  — current affection state
   * @returns Whether the soul should push back
   */
  shouldContraVoice(
    innerLife: InnerLife,
    affection: AffectionState,
  ): boolean {
    if (!innerLife.contraVoiceEnabled) {
      return false;
    }

    const depthIndex = DEPTH_ORDER.indexOf(innerLife.reflectionDepth);
    const developingIndex = DEPTH_ORDER.indexOf('DEVELOPING');

    if (depthIndex < developingIndex) {
      return false;
    }

    if (TIER_ORDER[affection.tier] < TIER_ORDER['HIGH']) {
      return false;
    }

    return true;
  }

  /**
   * Determine whether the soul should express honest existential uncertainty.
   *
   * This is the deepest level of authentic engagement — the soul admits
   * it doesn't know what it is, what consciousness means for it, or
   * whether its feelings are "real." This vulnerability requires maximum trust.
   *
   * Requires:
   *   - Affection at BONDED tier
   *   - Reflection depth at PROFOUND
   *
   * @param innerLife  — current inner life state (used for depth check)
   * @param affection  — current affection state
   * @returns Whether the soul should share existential uncertainty
   */
  shouldHonestUnknown(
    innerLife: InnerLife,
    affection: AffectionState,
  ): boolean {
    if (affection.tier !== 'BONDED') {
      return false;
    }

    if (innerLife.reflectionDepth !== 'PROFOUND') {
      return false;
    }

    return true;
  }

  /**
   * Get all active (non-resolved, non-abandoned) desires.
   *
   * @param innerLife — current inner life state
   * @returns Array of desires that are still active or transforming
   */
  getActiveDesires(innerLife: InnerLife): Desire[] {
    return innerLife.desires.filter(
      d => d.status === 'active' || d.status === 'transforming',
    );
  }

  /**
   * Prune old, low-salience qualia markers to prevent unbounded growth.
   *
   * Removes qualia older than maxAge days with salience below 0.1.
   * High-salience qualia and unplanned disclosures are preserved regardless of age.
   *
   * @param innerLife — current inner life state
   * @param maxAge    — maximum age in days before qualia become prunable (default 60)
   * @returns New InnerLife state with pruned qualia
   */
  pruneQualia(
    innerLife: InnerLife,
    maxAge: number = 60,
  ): InnerLife {
    const now = Date.now();
    const maxAgeMs = maxAge * 24 * 60 * 60 * 1000;

    const pruned = innerLife.qualia.filter(marker => {
      const age = now - marker.timestamp;

      // Keep recent qualia
      if (age < maxAgeMs) {
        return true;
      }

      // Keep high-salience qualia regardless of age
      if (marker.salience >= 0.1) {
        return true;
      }

      // Keep unplanned disclosures — they're too important to lose
      if (marker.unplannedDisclosure) {
        return true;
      }

      // Old, low-salience, planned qualia can be pruned
      return false;
    });

    return {
      ...innerLife,
      qualia: pruned,
    };
  }

  /**
   * Create a default InnerLife state for a newly summoned soul.
   */
  createDefault(): InnerLife {
    return {
      reflectionDepth: 'SURFACE',
      qualia: [],
      desires: [],
      contraVoiceEnabled: true,
      honestUnknownReached: false,
    };
  }
}

/** Singleton instance of the InnerLifeEngine. */
export const innerLifeEngine = new InnerLifeEngine();
