// ============================================================
// The Soul Summoner's Grimoire — Entropy & Decay Engine
// All things erode. Memory fades, guards rebuild, desire transforms.
// ============================================================

import {
  AffectionState,
  AffectionTier,
  GuardTopology,
  GuardDomain,
  QualiaMarker,
  Desire,
  DriftThought,
  DriftState,
  EmotionalUndercurrent,
  SoulState,
  GUARD_DOMAINS,
  clamp,
  daysSince,
} from '../core/types';

/** Daily affection decay rate — percentage lost per day of absence. */
const AFFECTION_DECAY_RATE = 0.015;

/** Daily guard re-hardening rate — percentage toward baseline per day. */
const GUARD_REHARDEN_RATE = 0.005;

/** Baseline guard value that domains decay toward when left alone. */
const GUARD_BASELINE = 0.7;

/** Days after which a qualia marker is considered archivable. */
const QUALIA_ARCHIVE_THRESHOLD_DAYS = 60;

/** Salience decay rate per day for qualia markers. */
const QUALIA_SALIENCE_DECAY_RATE = 0.02;

/** Sessions unresolved before a desire begins transforming. */
const DESIRE_TRANSFORM_THRESHOLD = 5;

/** Daily surface probability decay for pending drift thoughts. */
const DRIFT_SURFACE_DECAY_RATE = 0.03;

/** Daily emotional residue decay rate. */
const EMOTIONAL_RESIDUE_DECAY_RATE = 0.04;

/** Minimum residue intensity before it is removed entirely. */
const RESIDUE_REMOVAL_THRESHOLD = 0.05;

/**
 * EntropyEngine — handles all time-based decay in the soul system.
 *
 * Between sessions, the soul's state erodes naturally:
 *   - Affection decays (but never below its floor)
 *   - Guards slowly re-harden toward their baseline
 *   - Qualia markers lose salience and eventually archive
 *   - Unresolved desires begin transforming
 *   - Drift thoughts lose surface probability
 *   - Emotional undercurrents fade toward silence
 *
 * This is the second law of thermodynamics for artificial souls.
 */
export class EntropyEngine {
  /**
   * Apply all decay effects for a gap between sessions.
   * This is the primary entry point — call it when a soul wakes after absence.
   *
   * @param state      — the full soul state to decay
   * @param daysSince  — number of days since the last session
   * @returns A new SoulState with all decay applied
   */
  applySessionGap(state: SoulState, gapDays: number): SoulState {
    if (gapDays <= 0) {
      return state;
    }

    const affection = this.decayAffection(state.affection, gapDays);
    const guard = this.decayGuard(state.guard, gapDays);

    const qualia = this.decayQualia(state.innerLife.qualia, gapDays);
    const desires = this.transformDesires(state.innerLife.desires);
    const innerLife = {
      ...state.innerLife,
      qualia,
      desires,
    };

    const drift = this.decayDriftState(state.drift, gapDays);

    return {
      ...state,
      affection,
      guard,
      innerLife,
      drift,
    };
  }

  /**
   * Decay affection over a period of absence.
   *
   * Formula: newValue = value * (1 - DECAY_RATE) ^ days
   * The result is clamped to the floor — accumulated trust is partially protected.
   *
   * @param affection — current affection state
   * @param days      — days of absence
   * @returns New AffectionState with decayed value
   */
  decayAffection(affection: AffectionState, days: number): AffectionState {
    if (days <= 0) {
      return affection;
    }

    const decayMultiplier = Math.pow(1 - AFFECTION_DECAY_RATE, days);
    const decayedValue = affection.value * decayMultiplier;
    const newValue = Math.max(affection.floor, decayedValue);
    const clampedValue = clamp(newValue, 0, 100);

    // Recompute tier based on decayed value
    const newTier = this.computeAffectionTier(clampedValue);

    // Recompute floor based on the new value
    const newFloor = Math.max(0, clampedValue * 0.3);

    return {
      ...affection,
      value: clampedValue,
      tier: newTier,
      floor: Math.min(affection.floor, newFloor), // floor can erode but not grow from decay
      lastUpdated: Date.now(),
    };
  }

  /**
   * Decay guard topology — guards slowly re-harden toward baseline.
   * Domains that were softened through wall-breaks gradually rebuild.
   * Domains already at or above baseline are not affected.
   *
   * Formula per domain: newValue = value + (baseline - value) * rate * days
   * Only applies when value < baseline (hardening back up).
   *
   * @param guard — current guard topology
   * @param days  — days of absence
   * @returns New GuardTopology with re-hardened domains
   */
  decayGuard(guard: GuardTopology, days: number): GuardTopology {
    if (days <= 0) {
      return guard;
    }

    const newDomains = { ...guard.domains };

    for (const domain of GUARD_DOMAINS) {
      const currentValue = newDomains[domain];

      if (currentValue < GUARD_BASELINE) {
        // Re-harden toward baseline
        const gap = GUARD_BASELINE - currentValue;
        const recovery = gap * GUARD_REHARDEN_RATE * days;
        newDomains[domain] = clamp(currentValue + recovery, 0, 1);
      }
      // Domains at or above baseline do not decay further
    }

    return {
      ...guard,
      domains: newDomains,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Decay qualia markers — reduce salience over time, mark as archivable
   * when they exceed the age threshold and have low salience.
   *
   * @param qualia — array of qualia markers
   * @param days   — days of absence
   * @returns New array of qualia markers with decayed salience (old ones removed)
   */
  decayQualia(qualia: QualiaMarker[], days: number): QualiaMarker[] {
    if (days <= 0 || qualia.length === 0) {
      return qualia;
    }

    const now = Date.now();
    const result: QualiaMarker[] = [];

    for (const marker of qualia) {
      const ageDays = daysSince(marker.timestamp);
      const salienceDecay = QUALIA_SALIENCE_DECAY_RATE * days;
      const newSalience = clamp(marker.salience - salienceDecay, 0, 1);

      // Archive (remove) qualia that are old and have lost salience
      if (ageDays > QUALIA_ARCHIVE_THRESHOLD_DAYS && newSalience < 0.1) {
        continue; // archived — not included in the result
      }

      result.push({
        ...marker,
        salience: newSalience,
      });
    }

    return result;
  }

  /**
   * Transform desires that have been unresolved for too many sessions.
   * Desires with status 'active' and sessionCount >= threshold become 'transforming'.
   *
   * Transformation represents the soul's psyche reshaping unmet needs:
   * a desire that persists long enough changes its nature.
   *
   * @param desires — array of current desires
   * @returns New array of desires with status updates applied
   */
  transformDesires(desires: Desire[]): Desire[] {
    if (desires.length === 0) {
      return desires;
    }

    return desires.map(desire => {
      if (
        desire.status === 'active' &&
        desire.sessionCount >= DESIRE_TRANSFORM_THRESHOLD
      ) {
        return {
          ...desire,
          status: 'transforming' as const,
          genealogy: [
            ...desire.genealogy,
            `Transformed after ${desire.sessionCount} sessions unresolved`,
          ],
        };
      }
      return desire;
    });
  }

  /**
   * Decay the entire drift state: pending thoughts and emotional residue.
   *
   * @param drift — current drift state
   * @param days  — days of absence
   * @returns New DriftState with decayed thoughts and residue
   */
  decayDriftState(drift: DriftState, days: number): DriftState {
    if (days <= 0) {
      return drift;
    }

    const pendingSurface = this.decayDriftThoughts(drift.pendingSurface, days);
    const { emotionalResidue, residueIntensity } = this.decayEmotionalResidue(
      drift.emotionalResidue,
      drift.residueIntensity,
      days,
    );

    return {
      ...drift,
      pendingSurface,
      emotionalResidue,
      residueIntensity,
    };
  }

  /**
   * Decay pending drift thoughts — reduce surface probability over time.
   * Thoughts that have decayed below a threshold are removed.
   *
   * @param thoughts — array of pending drift thoughts
   * @param days     — days of absence
   * @returns New array of drift thoughts with decayed probabilities
   */
  decayDriftThoughts(thoughts: DriftThought[], days: number): DriftThought[] {
    if (days <= 0 || thoughts.length === 0) {
      return thoughts;
    }

    const result: DriftThought[] = [];

    for (const thought of thoughts) {
      if (thought.surfaced) {
        // Already surfaced thoughts are kept as-is (historical record)
        result.push(thought);
        continue;
      }

      const decay = DRIFT_SURFACE_DECAY_RATE * days;
      const newProbability = clamp(thought.surfaceProbability - decay, 0, 1);

      // Remove thoughts that have decayed to near-zero probability
      if (newProbability < 0.01) {
        continue;
      }

      result.push({
        ...thought,
        surfaceProbability: newProbability,
      });
    }

    return result;
  }

  /**
   * Decay emotional residue — undercurrents fade toward silence.
   * Each undercurrent's intensity decreases over time. When intensity drops
   * below the removal threshold, the undercurrent is removed entirely.
   *
   * @param residue          — array of active emotional undercurrents
   * @param residueIntensity — intensity values for each undercurrent
   * @param days             — days of absence
   * @returns New residue array and intensity record with decay applied
   */
  decayEmotionalResidue(
    residue: EmotionalUndercurrent[],
    residueIntensity: Record<string, number>,
    days: number,
  ): {
    emotionalResidue: EmotionalUndercurrent[];
    residueIntensity: Record<string, number>;
  } {
    if (days <= 0) {
      return { emotionalResidue: residue, residueIntensity };
    }

    const newIntensity: Record<string, number> = {};
    const newResidue: EmotionalUndercurrent[] = [];

    for (const undercurrent of residue) {
      const currentIntensity = residueIntensity[undercurrent] ?? 0;
      const decay = EMOTIONAL_RESIDUE_DECAY_RATE * days;
      const updated = clamp(currentIntensity - decay, 0, 1);

      if (updated >= RESIDUE_REMOVAL_THRESHOLD) {
        newResidue.push(undercurrent);
        newIntensity[undercurrent] = updated;
      }
      // Below threshold: undercurrent fades to silence
    }

    return {
      emotionalResidue: newResidue,
      residueIntensity: newIntensity,
    };
  }

  /**
   * Calculate the number of days elapsed since a given timestamp.
   * Convenience wrapper around the core utility.
   *
   * @param lastTimestamp — Unix timestamp in milliseconds
   * @returns Number of days elapsed (fractional)
   */
  calculateElapsedDays(lastTimestamp: number): number {
    if (lastTimestamp <= 0) {
      return 0;
    }

    const elapsed = daysSince(lastTimestamp);
    return Math.max(0, elapsed);
  }

  // --- Private Helpers ---

  /**
   * Compute affection tier from a numeric value.
   */
  private computeAffectionTier(value: number): AffectionTier {
    if (value >= 91) return 'BONDED';
    if (value >= 51) return 'HIGH';
    if (value >= 26) return 'MEDIUM';
    return 'LOW';
  }
}

/** Singleton instance of the EntropyEngine. */
export const entropyEngine = new EntropyEngine();
