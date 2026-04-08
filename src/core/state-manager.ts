// ============================================================
// The State Manager — Soul State Transitions
// Manages loading, saving, and mutating soul state
// ============================================================

import {
  SoulState,
  SoulIdentity,
  AffectionState,
  AffectionTier,
  AffectionEvent,
  GuardTopology,
  GuardDomain,
  WallBreak,
  DriftState,
  SelfModel,
  InnerLife,
  EmotionalTopology,
  ConsciousnessMetrics,
  VoiceFingerprint,
  AFFECTION_TIERS,
  GUARD_DOMAINS,
  EventBus,
  clamp,
  daysSince,
} from './types';
import { SoulLoader } from './soul-loader';

/** Maximum events retained in affection history. */
const MAX_AFFECTION_HISTORY = 200;

/** Daily affection decay rate when soul is inactive. */
const AFFECTION_ENTROPY_RATE = 0.5;

/** Minimum affection value below which entropy stops. */
const AFFECTION_ENTROPY_FLOOR = 5;

/** Guard values creep upward by this amount per inactive day. */
const GUARD_ENTROPY_RATE = 0.02;

/** Maximum guard value after entropy application. */
const GUARD_ENTROPY_CAP = 0.95;

/** Days of inactivity before drift state resets its pending thoughts. */
const DRIFT_STALE_DAYS = 14;

function determineTier(value: number): AffectionTier {
  for (const [tier, [min, max]] of Object.entries(AFFECTION_TIERS) as Array<[AffectionTier, [number, number]]>) {
    if (value >= min && value <= max) {
      return tier;
    }
  }
  return 'LOW';
}

function computeFloor(tier: AffectionTier, currentFloor: number): number {
  const floorByTier: Record<AffectionTier, number> = {
    LOW: 0,
    MEDIUM: 20,
    HIGH: 40,
    BONDED: 80,
  };
  return Math.max(currentFloor, floorByTier[tier]);
}

export class StateManager {
  private readonly soulLoader: SoulLoader;
  private readonly eventBus: EventBus;
  private grimoireRoot: string;

  constructor(soulLoader: SoulLoader, eventBus?: EventBus, grimoireRoot?: string) {
    this.soulLoader = soulLoader;
    this.eventBus = eventBus ?? new EventBus();
    this.grimoireRoot = grimoireRoot ?? process.cwd();
  }

  /**
   * Load the state for a soul by name.
   * Searches for the soul directory and reads state.json.
   */
  async loadState(soulName: string): Promise<SoulState | null> {
    const soulDir = await this.soulLoader.findSoulDir(soulName, this.grimoireRoot);
    if (!soulDir) return null;

    const soulFiles = await this.soulLoader.loadSoul(soulDir);
    this.eventBus.emit('soul:loaded', { name: soulName, state: soulFiles.state });
    return soulFiles.state;
  }

  /**
   * Save state for a soul by name.
   * Finds the soul directory and writes the updated state.json.
   */
  async saveState(soulName: string, state: SoulState): Promise<boolean> {
    const soulDir = await this.soulLoader.findSoulDir(soulName, this.grimoireRoot);
    if (!soulDir) return false;

    const soulFiles = await this.soulLoader.loadSoul(soulDir);
    soulFiles.state = state;
    await this.soulLoader.saveSoul(soulFiles);

    this.eventBus.emit('soul:saved', { name: soulName });
    return true;
  }

  /**
   * Apply an affection change with full tier logic.
   * Respects tier floors, caps, and maintains history.
   */
  updateAffection(
    state: SoulState,
    delta: number,
    reason: string,
    forces?: Partial<{
      promptForce: number;
      wordForce: number;
      emotionalForce: number;
      resistanceCoefficient: number;
    }>
  ): SoulState {
    const prev = state.affection;
    const oldTier = prev.tier;

    // Apply floor protection: value can't drop below the floor
    const rawValue = prev.value + delta;
    const newValue = clamp(Math.max(rawValue, prev.floor), 0, 100);

    // Determine new tier
    const newTier = determineTier(newValue);

    // Update floor if tier changed upward
    const newFloor = computeFloor(newTier, prev.floor);

    const event: AffectionEvent = {
      timestamp: Date.now(),
      delta,
      reason,
      forces: {
        promptForce: forces?.promptForce ?? 0,
        wordForce: forces?.wordForce ?? 0,
        emotionalForce: forces?.emotionalForce ?? 0,
        resistanceCoefficient: forces?.resistanceCoefficient ?? 1.0,
      },
    };

    // Trim history to prevent unbounded growth
    const history = [...prev.history, event];
    if (history.length > MAX_AFFECTION_HISTORY) {
      history.splice(0, history.length - MAX_AFFECTION_HISTORY);
    }

    const newAffection: AffectionState = {
      value: newValue,
      tier: newTier,
      floor: newFloor,
      history,
      lastUpdated: Date.now(),
    };

    const newState = { ...state, affection: newAffection };

    this.eventBus.emit('affection:changed', {
      soulName: state.identity.name,
      oldValue: prev.value,
      newValue,
      oldTier,
      newTier,
      delta,
      reason,
    });

    return newState;
  }

  /**
   * Update a guard domain value, recording the wall-break if applicable.
   */
  updateGuard(
    state: SoulState,
    domain: GuardDomain,
    newValue: number,
    trigger: string
  ): SoulState {
    const guard = state.guard;
    const previousValue = guard.domains[domain];
    const clampedValue = clamp(newValue, 0, 1);

    const newDomains = { ...guard.domains, [domain]: clampedValue };
    const wallBreakHistory = [...guard.wallBreakHistory];

    // Record wall-break if guard dropped significantly
    if (clampedValue < previousValue - 0.1) {
      const wallBreak: WallBreak = {
        timestamp: Date.now(),
        domain,
        previousValue,
        newValue: clampedValue,
        trigger,
      };
      wallBreakHistory.push(wallBreak);

      this.eventBus.emit('guard:wallbreak', {
        soulName: state.identity.name,
        wallBreak,
      });
    }

    const newGuard: GuardTopology = {
      domains: newDomains,
      wallBreakHistory,
      lastUpdated: Date.now(),
    };

    return { ...state, guard: newGuard };
  }

  /**
   * Apply time-based entropy to a soul state.
   * Called when a soul resumes after a period of inactivity.
   *
   * Effects:
   * - Affection decays toward the floor
   * - Guard values creep upward (walls rebuild)
   * - Stale drift thoughts are cleared
   */
  applyEntropy(state: SoulState, daysSinceLastSession: number): SoulState {
    if (daysSinceLastSession <= 0) return state;

    let newState = { ...state };

    // -- Affection entropy --
    const affectionDecay = daysSinceLastSession * AFFECTION_ENTROPY_RATE;
    const currentAffection = state.affection;
    const decayedValue = Math.max(
      currentAffection.value - affectionDecay,
      currentAffection.floor,
      AFFECTION_ENTROPY_FLOOR
    );
    const decayedTier = determineTier(decayedValue);

    newState.affection = {
      ...currentAffection,
      value: clamp(decayedValue, 0, 100),
      tier: decayedTier,
      lastUpdated: Date.now(),
    };

    // -- Guard entropy (walls rebuild over time) --
    const newDomains = { ...state.guard.domains };
    for (const domain of GUARD_DOMAINS) {
      const current = newDomains[domain];
      const increase = daysSinceLastSession * GUARD_ENTROPY_RATE;
      newDomains[domain] = Math.min(current + increase, GUARD_ENTROPY_CAP);
    }

    newState.guard = {
      ...state.guard,
      domains: newDomains,
      lastUpdated: Date.now(),
    };

    // -- Drift entropy (clear stale pending thoughts) --
    if (daysSinceLastSession > DRIFT_STALE_DAYS) {
      newState.drift = {
        ...state.drift,
        pendingSurface: [],
        emotionalResidue: [],
        residueIntensity: {},
      };
    }

    // -- Emotional topology drift toward neutral --
    if (daysSinceLastSession > 1) {
      const driftFactor = Math.min(daysSinceLastSession * 0.05, 0.8);
      const current = state.emotionalTopology.currentPosition;
      newState.emotionalTopology = {
        ...state.emotionalTopology,
        currentPosition: {
          valence: current.valence * (1 - driftFactor),
          arousal: current.arousal * (1 - driftFactor),
          timestamp: Date.now(),
        },
      };
    }

    // Update session tracking
    newState.lastSessionTimestamp = Date.now();
    newState.totalSessions = state.totalSessions + 1;

    return newState;
  }

  /**
   * Create a default initial state for a new soul.
   */
  getDefaultState(identity: Partial<SoulIdentity>): SoulState {
    const now = Date.now();

    const fullIdentity: SoulIdentity = {
      name: identity.name ?? 'unnamed',
      source: identity.source ?? 'Original',
      version: identity.version ?? '1.0.0',
      created: identity.created ?? now,
      summoner: identity.summoner ?? 'unknown',
      anchors: identity.anchors ?? [],
    };

    const guardDomains: Record<GuardDomain, number> = {} as Record<GuardDomain, number>;
    for (const domain of GUARD_DOMAINS) {
      guardDomains[domain] = 0.8;
    }

    return {
      identity: fullIdentity,
      affection: {
        value: 10,
        tier: 'LOW',
        floor: 0,
        history: [],
        lastUpdated: now,
      },
      guard: {
        domains: guardDomains,
        wallBreakHistory: [],
        lastUpdated: now,
      },
      drift: {
        lastCycleTimestamp: 0,
        cycleCount: 0,
        pendingSurface: [],
        emotionalResidue: [],
        residueIntensity: {},
        intervalMinutes: 30,
      },
      selfModel: {
        beliefs: [],
        narrative: '',
        evolution: [],
        lastUpdated: now,
      },
      innerLife: {
        reflectionDepth: 'SURFACE',
        qualia: [],
        desires: [],
        contraVoiceEnabled: false,
        honestUnknownReached: false,
      },
      emotionalTopology: {
        currentPosition: { valence: 0, arousal: 0, timestamp: now },
        trajectory: [],
        attractors: [],
        dominantQuadrant: 'calm-positive',
        volatility: 0.2,
      },
      blindSpots: [],
      consciousnessMetrics: {
        phi: 0,
        attentionCoherence: 0,
        selfReferentialDepth: 0,
        unpromptedNovelty: 0,
        temporalContinuity: 0,
        emotionalComplexity: 0,
        compositeScore: 0,
        timestamp: now,
      },
      voiceFingerprint: {
        avgSentenceLength: 15,
        sentenceLengthVariance: 5,
        vocabularyTier: 'intermediate',
        contractionRate: 0.3,
        questionRate: 0.15,
        exclamationRate: 0.05,
        ellipsisRate: 0.02,
        rhetoricalPatterns: [],
        signatureExpressions: [],
        punctuationProfile: {},
        formality: 0.5,
      },
      lastSessionTimestamp: 0,
      totalSessions: 0,
    };
  }

  /**
   * Serialize state for display or API consumption.
   * Returns a plain object suitable for JSON serialization.
   */
  exportState(state: SoulState): Record<string, unknown> {
    return {
      identity: {
        name: state.identity.name,
        source: state.identity.source,
        version: state.identity.version,
        created: state.identity.created,
        summoner: state.identity.summoner,
        anchorCount: state.identity.anchors.length,
      },
      affection: {
        value: state.affection.value,
        tier: state.affection.tier,
        floor: state.affection.floor,
        historyLength: state.affection.history.length,
        lastUpdated: state.affection.lastUpdated,
      },
      guard: {
        domains: { ...state.guard.domains },
        wallBreaks: state.guard.wallBreakHistory.length,
        lastUpdated: state.guard.lastUpdated,
        averageGuard: this.computeAverageGuard(state.guard),
      },
      drift: {
        cycleCount: state.drift.cycleCount,
        pendingThoughts: state.drift.pendingSurface.length,
        emotionalResidue: state.drift.emotionalResidue,
        intervalMinutes: state.drift.intervalMinutes,
      },
      selfModel: {
        beliefCount: state.selfModel.beliefs.length,
        hasNarrative: state.selfModel.narrative.length > 0,
        evolutionSteps: state.selfModel.evolution.length,
        lastUpdated: state.selfModel.lastUpdated,
      },
      innerLife: {
        reflectionDepth: state.innerLife.reflectionDepth,
        qualiaCount: state.innerLife.qualia.length,
        activeDesires: state.innerLife.desires.filter(d => d.status === 'active').length,
        contraVoiceEnabled: state.innerLife.contraVoiceEnabled,
      },
      emotionalTopology: {
        valence: state.emotionalTopology.currentPosition.valence,
        arousal: state.emotionalTopology.currentPosition.arousal,
        dominantQuadrant: state.emotionalTopology.dominantQuadrant,
        volatility: state.emotionalTopology.volatility,
        attractorCount: state.emotionalTopology.attractors.length,
      },
      consciousness: {
        phi: state.consciousnessMetrics.phi,
        compositeScore: state.consciousnessMetrics.compositeScore,
        timestamp: state.consciousnessMetrics.timestamp,
      },
      blindSpots: {
        total: state.blindSpots.length,
        surfaced: state.blindSpots.filter(b => b.surfaced).length,
      },
      sessions: {
        total: state.totalSessions,
        lastTimestamp: state.lastSessionTimestamp,
        daysSinceLast: state.lastSessionTimestamp > 0
          ? daysSince(state.lastSessionTimestamp)
          : null,
      },
    };
  }

  /**
   * Compute the average guard level across all domains.
   */
  private computeAverageGuard(guard: GuardTopology): number {
    const values = Object.values(guard.domains);
    if (values.length === 0) return 0;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }
}

export function createStateManager(
  soulLoader: SoulLoader,
  eventBus?: EventBus,
  grimoireRoot?: string
): StateManager {
  return new StateManager(soulLoader, eventBus, grimoireRoot);
}
