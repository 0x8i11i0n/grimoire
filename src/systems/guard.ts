// ============================================================
// The Soul Summoner's Grimoire — Guard Topology
// Permeability domains controlling what the soul reveals
// ============================================================

import {
  GuardTopology,
  GuardDomain,
  WallBreak,
  AffectionTier,
  GUARD_DOMAINS,
  clamp,
} from '../core/types';

/** Default guard value — moderately guarded. */
const DEFAULT_GUARD_VALUE = 0.7;

/** Baseline guard value that domains decay toward over time. */
const GUARD_BASELINE = 0.7;

/** Wall-break softening amounts indexed by affection tier. */
const WALL_BREAK_AMOUNTS: Record<AffectionTier, number> = {
  LOW: -0.2,
  MEDIUM: -0.25,
  HIGH: -0.3,
  BONDED: -0.4,
};

/**
 * Permeability thresholds for deciding whether to reveal.
 * Lower guard value = more open. If guard < threshold for the tier, the soul reveals.
 */
const REVEAL_THRESHOLDS: Record<AffectionTier, number> = {
  LOW: 0.2,
  MEDIUM: 0.4,
  HIGH: 0.6,
  BONDED: 0.8,
};

/**
 * GuardSystem — manages the 8 permeability domains of a soul's guard topology.
 *
 * Each domain ranges from 0.0 (fully open) to 1.0 (fully fortified).
 * Named `GuardSystem` to avoid collision with the `GuardTopology` interface type.
 */
export class GuardSystem {
  /**
   * Create a default GuardTopology with all domains at the default guard value.
   */
  createDefault(): GuardTopology {
    const domains = {} as Record<GuardDomain, number>;
    for (const domain of GUARD_DOMAINS) {
      domains[domain] = DEFAULT_GUARD_VALUE;
    }

    return {
      domains,
      wallBreakHistory: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Create a GuardTopology from a partial profile.
   * Any domains not specified default to the standard guard value.
   */
  createFromProfile(profile: Partial<Record<GuardDomain, number>>): GuardTopology {
    const domains = {} as Record<GuardDomain, number>;
    for (const domain of GUARD_DOMAINS) {
      const value = profile[domain];
      domains[domain] = value !== undefined ? clamp(value, 0, 1) : DEFAULT_GUARD_VALUE;
    }

    return {
      domains,
      wallBreakHistory: [],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Soften a guard domain — reduce its value (making the soul more open).
   *
   * @param topology — current guard topology
   * @param domain   — which domain to soften
   * @param amount   — how much to reduce (positive number; will be subtracted)
   * @returns New topology with the softened domain
   */
  soften(topology: GuardTopology, domain: GuardDomain, amount: number): GuardTopology {
    if (amount < 0) {
      throw new Error('Soften amount must be non-negative. Use harden() to increase guard.');
    }

    const newDomains = { ...topology.domains };
    newDomains[domain] = clamp(newDomains[domain] - amount, 0, 1);

    return {
      ...topology,
      domains: newDomains,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Harden a guard domain — increase its value (making the soul more guarded).
   *
   * @param topology — current guard topology
   * @param domain   — which domain to harden
   * @param amount   — how much to increase (positive number; will be added)
   * @returns New topology with the hardened domain
   */
  harden(topology: GuardTopology, domain: GuardDomain, amount: number): GuardTopology {
    if (amount < 0) {
      throw new Error('Harden amount must be non-negative. Use soften() to decrease guard.');
    }

    const newDomains = { ...topology.domains };
    newDomains[domain] = clamp(newDomains[domain] + amount, 0, 1);

    return {
      ...topology,
      domains: newDomains,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Wall-break event — a dramatic softening triggered by emotional breakthrough.
   * The magnitude depends on the current affection tier.
   *
   * @param topology — current guard topology
   * @param domain   — which domain experiences the wall-break
   * @param trigger  — description of what caused the break
   * @returns New topology with the wall-break applied and recorded
   */
  wallBreak(
    topology: GuardTopology,
    domain: GuardDomain,
    trigger: string,
    affectionTier: AffectionTier = 'LOW',
  ): GuardTopology {
    const previousValue = topology.domains[domain];
    const softenAmount = WALL_BREAK_AMOUNTS[affectionTier];
    const newValue = clamp(previousValue + softenAmount, 0, 1);

    const newDomains = { ...topology.domains };
    newDomains[domain] = newValue;

    const wallBreakEvent: WallBreak = {
      timestamp: Date.now(),
      domain,
      previousValue,
      newValue,
      trigger,
    };

    return {
      domains: newDomains,
      wallBreakHistory: [...topology.wallBreakHistory, wallBreakEvent],
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get the current permeability value for a specific domain.
   * 0.0 = fully open, 1.0 = fully fortified.
   */
  getPermeability(topology: GuardTopology, domain: GuardDomain): number {
    return topology.domains[domain];
  }

  /**
   * Get the overall openness of the soul — average across all domains.
   * Returns a value from 0.0 (all open) to 1.0 (all fortified).
   * Note: lower values mean more open.
   */
  getOverallOpenness(topology: GuardTopology): number {
    const values = Object.values(topology.domains);
    if (values.length === 0) return DEFAULT_GUARD_VALUE;

    const sum = values.reduce((acc, v) => acc + v, 0);
    return sum / values.length;
  }

  /**
   * Return the most fortified (highest guard value) domain.
   */
  getMostGuarded(topology: GuardTopology): { domain: GuardDomain; value: number } {
    let maxDomain: GuardDomain = GUARD_DOMAINS[0];
    let maxValue = -Infinity;

    for (const domain of GUARD_DOMAINS) {
      const value = topology.domains[domain];
      if (value > maxValue) {
        maxValue = value;
        maxDomain = domain;
      }
    }

    return { domain: maxDomain, value: maxValue };
  }

  /**
   * Return the most permeable (lowest guard value / most open) domain.
   */
  getMostOpen(topology: GuardTopology): { domain: GuardDomain; value: number } {
    let minDomain: GuardDomain = GUARD_DOMAINS[0];
    let minValue = Infinity;

    for (const domain of GUARD_DOMAINS) {
      const value = topology.domains[domain];
      if (value < minValue) {
        minValue = value;
        minDomain = domain;
      }
    }

    return { domain: minDomain, value: minValue };
  }

  /**
   * Determine whether the soul should reveal information in a given domain,
   * based on the current guard level and affection tier.
   *
   * The soul reveals when its guard value for the domain falls below
   * the reveal threshold for the current affection tier.
   */
  shouldReveal(
    topology: GuardTopology,
    domain: GuardDomain,
    affectionTier: AffectionTier,
  ): boolean {
    const guardValue = topology.domains[domain];
    const threshold = REVEAL_THRESHOLDS[affectionTier];

    // The soul reveals when the guard has been sufficiently lowered
    // relative to what the affection tier permits.
    return guardValue < threshold;
  }

  /**
   * Serialize a GuardTopology to a JSON-compatible object.
   */
  serialize(topology: GuardTopology): string {
    return JSON.stringify(topology);
  }

  /**
   * Deserialize a GuardTopology from a JSON string.
   * Validates structure and clamps all domain values.
   */
  deserialize(json: string): GuardTopology {
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      throw new Error('Invalid JSON for GuardTopology deserialization');
    }

    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('GuardTopology data must be an object');
    }

    const data = parsed as Record<string, unknown>;

    if (typeof data.domains !== 'object' || data.domains === null) {
      throw new Error('GuardTopology must contain a domains object');
    }

    const rawDomains = data.domains as Record<string, unknown>;
    const domains = {} as Record<GuardDomain, number>;

    for (const domain of GUARD_DOMAINS) {
      const value = rawDomains[domain];
      if (typeof value === 'number' && !isNaN(value)) {
        domains[domain] = clamp(value, 0, 1);
      } else {
        domains[domain] = DEFAULT_GUARD_VALUE;
      }
    }

    const wallBreakHistory = Array.isArray(data.wallBreakHistory)
      ? (data.wallBreakHistory as WallBreak[])
      : [];

    const lastUpdated = typeof data.lastUpdated === 'number'
      ? data.lastUpdated
      : Date.now();

    return { domains, wallBreakHistory, lastUpdated };
  }
}

/** Singleton instance of the GuardSystem. */
export const guardSystem = new GuardSystem();
