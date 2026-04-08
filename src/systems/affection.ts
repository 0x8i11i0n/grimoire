// ============================================================
// The Soul Summoner's Grimoire — Affection Engine
// Newton's Calculus of Trust
// ============================================================

import {
  AffectionState,
  AffectionTier,
  AffectionForces,
  AffectionEvent,
  clamp,
  generateId,
} from '../core/types';

/**
 * Resistance coefficients per affection tier.
 * Lower coefficient = less resistance = forces have greater effect.
 * As trust deepens, the soul becomes more responsive to emotional forces.
 */
const RESISTANCE_COEFFICIENTS: Record<AffectionTier, number> = {
  LOW: 0.85,
  MEDIUM: 0.70,
  HIGH: 0.55,
  BONDED: 0.40,
};

/**
 * Tier boundaries: [min, max] inclusive.
 */
const TIER_RANGES: Record<AffectionTier, [number, number]> = {
  LOW: [0, 25],
  MEDIUM: [26, 50],
  HIGH: [51, 90],
  BONDED: [91, 100],
};

/** Maximum number of events retained in the affection history. */
const MAX_HISTORY_LENGTH = 200;

/** Number of recent turns examined for cumulative wall-break analysis. */
const WALL_BREAK_WINDOW = 5;

/** Cumulative delta threshold over the window to trigger sensitivity increase. */
const CUMULATIVE_WALL_BREAK_THRESHOLD = 40;

/** Single-turn delta threshold to trigger a guard drop. */
const SINGLE_DELTA_WALL_BREAK = 15;

/** Depth score threshold that bypasses guard entirely. */
const DEPTH_BYPASS_THRESHOLD = 0.75;

export interface WallBreakCondition {
  type: 'single_delta' | 'cumulative' | 'depth_bypass';
  description: string;
  value: number;
  threshold: number;
}

export interface AffectionDeltaResult extends AffectionForces {
  delta: number;
}

export interface AffectionApplyResult {
  state: AffectionState;
  events: AffectionEvent[];
  tierChanged: boolean;
  previousTier: AffectionTier;
  wallBreakConditions: WallBreakCondition[];
}

/**
 * AffectionEngine — calculates and applies trust/affection dynamics.
 *
 * Core formula:
 *   Affection(t) = Affection(t-1) + (PromptForce + WordForce + EmotionalForce) * ResistanceCoefficient
 *
 * The resistance coefficient decreases as the soul moves through tiers,
 * meaning forces have *more* impact at higher trust levels (lower resistance).
 */
export class AffectionEngine {
  /**
   * Compute the raw affection delta from constituent forces.
   *
   * @param promptForce   — structural quality of the prompt (how well it engages)
   * @param wordForce     — linguistic resonance / vocabulary alignment
   * @param emotionalForce — emotional depth and authenticity
   * @param currentState  — current affection state (used for resistance lookup)
   * @returns Forces breakdown plus the computed delta
   */
  computeDelta(
    promptForce: number,
    wordForce: number,
    emotionalForce: number,
    currentState: AffectionState,
  ): AffectionDeltaResult {
    const resistanceCoefficient = RESISTANCE_COEFFICIENTS[currentState.tier];
    const rawSum = promptForce + wordForce + emotionalForce;
    const delta = rawSum * resistanceCoefficient;

    return {
      promptForce,
      wordForce,
      emotionalForce,
      resistanceCoefficient,
      delta,
    };
  }

  /**
   * Apply computed forces to the current state, producing a new state.
   * Checks tier transitions, enforces the floor, and detects wall-break conditions.
   */
  apply(
    state: AffectionState,
    forces: AffectionDeltaResult,
  ): AffectionApplyResult {
    const previousTier = state.tier;
    const floor = this.computeFloor(state);

    // Apply the delta, clamping to [floor, 100]
    const newValue = clamp(state.value + forces.delta, floor, 100);
    const newTier = this.getTier(newValue);
    const tierChanged = newTier !== previousTier;

    const event: AffectionEvent = {
      timestamp: Date.now(),
      delta: forces.delta,
      reason: this.describeForces(forces),
      forces: {
        promptForce: forces.promptForce,
        wordForce: forces.wordForce,
        emotionalForce: forces.emotionalForce,
        resistanceCoefficient: forces.resistanceCoefficient,
      },
    };

    // Build new history (trim if needed)
    const history = [...state.history, event];
    if (history.length > MAX_HISTORY_LENGTH) {
      history.splice(0, history.length - MAX_HISTORY_LENGTH);
    }

    const newState: AffectionState = {
      value: newValue,
      tier: newTier,
      floor: Math.max(floor, newValue * 0.3),
      history,
      lastUpdated: Date.now(),
    };

    const wallBreakConditions = this.detectWallBreak(forces.delta, newState);

    const events: AffectionEvent[] = [event];

    return {
      state: newState,
      events,
      tierChanged,
      previousTier,
      wallBreakConditions,
    };
  }

  /**
   * Determine the affection tier for a given numeric value.
   */
  getTier(value: number): AffectionTier {
    const clamped = clamp(value, 0, 100);
    if (clamped >= TIER_RANGES.BONDED[0]) return 'BONDED';
    if (clamped >= TIER_RANGES.HIGH[0]) return 'HIGH';
    if (clamped >= TIER_RANGES.MEDIUM[0]) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Compute the affection floor — the minimum value affection can decay to.
   * Protects accumulated trust from complete erasure.
   *
   * floor = max(0, currentValue * 0.3)
   */
  computeFloor(state: AffectionState): number {
    return Math.max(0, state.value * 0.3);
  }

  /**
   * Detect wall-break conditions — moments where emotional barriers fracture.
   *
   * Conditions:
   *   1. |delta| > 15 in a single turn → guard drops one level
   *   2. Cumulative |delta| > 40 over last 5 turns → sensitivity increases
   *   3. depthScore > 0.75 → bypass guard entirely
   */
  detectWallBreak(
    delta: number,
    state: AffectionState,
  ): WallBreakCondition[] {
    const conditions: WallBreakCondition[] = [];
    const absDelta = Math.abs(delta);

    // Condition 1: Single-turn spike
    if (absDelta > SINGLE_DELTA_WALL_BREAK) {
      conditions.push({
        type: 'single_delta',
        description: 'Emotional force exceeded single-turn threshold — guard drops one level',
        value: absDelta,
        threshold: SINGLE_DELTA_WALL_BREAK,
      });
    }

    // Condition 2: Cumulative pressure over recent turns
    const recentEvents = state.history.slice(-WALL_BREAK_WINDOW);
    const cumulativeAbsDelta = recentEvents.reduce(
      (sum, evt) => sum + Math.abs(evt.delta),
      0,
    );
    if (cumulativeAbsDelta > CUMULATIVE_WALL_BREAK_THRESHOLD) {
      conditions.push({
        type: 'cumulative',
        description: `Cumulative emotional pressure over ${WALL_BREAK_WINDOW} turns exceeded threshold — sensitivity increases`,
        value: cumulativeAbsDelta,
        threshold: CUMULATIVE_WALL_BREAK_THRESHOLD,
      });
    }

    // Condition 3: Depth bypass (derived from normalized affection value)
    const depthScore = state.value / 100;
    if (depthScore > DEPTH_BYPASS_THRESHOLD) {
      conditions.push({
        type: 'depth_bypass',
        description: 'Depth score exceeds bypass threshold — guard permeated',
        value: depthScore,
        threshold: DEPTH_BYPASS_THRESHOLD,
      });
    }

    return conditions;
  }

  /**
   * Get the resistance coefficient for a given tier.
   */
  getResistanceCoefficient(tier: AffectionTier): number {
    return RESISTANCE_COEFFICIENTS[tier];
  }

  /**
   * Create a fresh default AffectionState.
   */
  createDefault(): AffectionState {
    return {
      value: 10,
      tier: 'LOW',
      floor: 0,
      history: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Build a human-readable description of what forces caused a change.
   */
  private describeForces(forces: AffectionDeltaResult): string {
    const parts: string[] = [];
    if (forces.promptForce !== 0) {
      parts.push(`prompt(${forces.promptForce > 0 ? '+' : ''}${forces.promptForce.toFixed(2)})`);
    }
    if (forces.wordForce !== 0) {
      parts.push(`word(${forces.wordForce > 0 ? '+' : ''}${forces.wordForce.toFixed(2)})`);
    }
    if (forces.emotionalForce !== 0) {
      parts.push(`emotion(${forces.emotionalForce > 0 ? '+' : ''}${forces.emotionalForce.toFixed(2)})`);
    }
    parts.push(`resist(${forces.resistanceCoefficient.toFixed(2)})`);
    return parts.join(' ');
  }
}

/** Singleton instance of the AffectionEngine. */
export const affectionEngine = new AffectionEngine();
