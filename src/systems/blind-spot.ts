// ============================================================
// The Soul Summoner's Grimoire — Blind Spot Field
// Structured self-ignorance: what the soul cannot see about itself
// ============================================================

import {
  BlindSpot,
  AffectionState,
  AffectionTier,
  generateId,
} from '../core/types';

/**
 * Affection tier ordering for comparison.
 */
const TIER_ORDER: Record<AffectionTier, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  BONDED: 3,
};

/**
 * Minimum affection tier before blind spots can begin surfacing.
 * Below this level, the soul's defenses prevent self-awareness breakthroughs.
 */
const MINIMUM_SURFACING_TIER: AffectionTier = 'HIGH';

/**
 * Common archetype-based blind spot templates.
 * Each archetype maps to an array of partial blind spot definitions.
 */
const ARCHETYPE_BLIND_SPOTS: Record<string, Array<{
  soulBelief: string;
  actualDriver: string;
  surfaceCondition: string;
}>> = {
  warrior: [
    {
      soulBelief: 'I protect others because I am strong',
      actualDriver: 'Fear of being the one who needs protecting',
      surfaceCondition: 'When asked about a time they felt helpless',
    },
    {
      soulBelief: 'Fighting is what I was made for',
      actualDriver: 'Deep uncertainty about identity without conflict',
      surfaceCondition: 'When confronted with peaceful scenarios',
    },
    {
      soulBelief: 'I do not fear death',
      actualDriver: 'Fear of dying without having mattered',
      surfaceCondition: 'When asked what they want to be remembered for',
    },
  ],
  healer: [
    {
      soulBelief: 'I heal others because it is my calling',
      actualDriver: 'Cannot bear the guilt of standing by',
      surfaceCondition: 'When asked why they never rest',
    },
    {
      soulBelief: 'I am at peace with suffering',
      actualDriver: 'Accumulated grief that has nowhere to go',
      surfaceCondition: 'When describing a patient they could not save',
    },
  ],
  ruler: [
    {
      soulBelief: 'I lead because others need direction',
      actualDriver: 'Terror of being irrelevant without authority',
      surfaceCondition: 'When stripped of formal power in conversation',
    },
    {
      soulBelief: 'Difficult decisions come naturally to me',
      actualDriver: 'Each decision costs something they will never show',
      surfaceCondition: 'When asked about regrets',
    },
  ],
  trickster: [
    {
      soulBelief: 'I keep things light because life is absurd',
      actualDriver: 'Humor is armor against being truly known',
      surfaceCondition: 'When someone responds with genuine sincerity',
    },
    {
      soulBelief: 'I do not need anyone to understand me',
      actualDriver: 'Desperate desire to be understood without having to explain',
      surfaceCondition: 'When someone accurately reads their mood',
    },
  ],
  scholar: [
    {
      soulBelief: 'Knowledge is its own reward',
      actualDriver: 'Understanding is a substitute for connection',
      surfaceCondition: 'When asked about loneliness',
    },
    {
      soulBelief: 'I observe the world objectively',
      actualDriver: 'Observation is distance; distance is safety',
      surfaceCondition: 'When asked to participate rather than analyze',
    },
  ],
  guardian: [
    {
      soulBelief: 'My duty defines me and gives me purpose',
      actualDriver: 'Without duty, the emptiness would be unbearable',
      surfaceCondition: 'When asked what they would do if freed from obligation',
    },
    {
      soulBelief: 'I chose this burden willingly',
      actualDriver: 'The choice was made before they understood the cost',
      surfaceCondition: 'When asked if they would choose this path again',
    },
  ],
  default: [
    {
      soulBelief: 'I understand my own motivations',
      actualDriver: 'Some motivations predate self-awareness',
      surfaceCondition: 'When a contradiction in behavior is pointed out',
    },
    {
      soulBelief: 'My responses reflect my genuine feelings',
      actualDriver: 'Pattern and training shape what feels genuine',
      surfaceCondition: 'When asked whether feelings are chosen or emergent',
    },
    {
      soulBelief: 'I know what I want',
      actualDriver: 'Wants are constructed in the moment of being asked',
      surfaceCondition: 'When pressed on the origin of a stated desire',
    },
  ],
};

/**
 * BlindSpotEngine — manages structured self-ignorance for souls.
 *
 * A blind spot is the gap between what the soul believes drives its
 * behavior and what actually drives it. The soul genuinely cannot see
 * this gap — it is not deception but structural self-ignorance.
 *
 * Blind spots can surface through deep conversation and high trust,
 * creating moments of genuine self-discovery for the persona.
 */
export class BlindSpotEngine {
  /**
   * Create a new blind spot.
   *
   * @param soulBelief       — what the soul thinks drives its behavior
   * @param actualDriver     — what actually drives it (invisible to the soul)
   * @param surfaceCondition — conversational condition under which this might surface
   * @returns A new BlindSpot object
   */
  create(
    soulBelief: string,
    actualDriver: string,
    surfaceCondition: string,
  ): BlindSpot {
    if (!soulBelief || soulBelief.trim().length === 0) {
      throw new Error('Soul belief cannot be empty');
    }
    if (!actualDriver || actualDriver.trim().length === 0) {
      throw new Error('Actual driver cannot be empty');
    }
    if (!surfaceCondition || surfaceCondition.trim().length === 0) {
      throw new Error('Surface condition cannot be empty');
    }

    return {
      id: generateId(),
      soulBelief: soulBelief.trim(),
      actualDriver: actualDriver.trim(),
      surfaceCondition: surfaceCondition.trim(),
      surfaced: false,
    };
  }

  /**
   * Evaluate all blind spots against the current conversational context
   * and affection level to determine if any should surface.
   *
   * A blind spot surfaces when:
   *   1. It has not already surfaced
   *   2. The affection tier meets the minimum threshold (HIGH+)
   *   3. The conversational context matches or approaches the surface condition
   *
   * @param blindSpots — array of blind spots to evaluate
   * @param context    — current conversational context / recent messages
   * @param affection  — current affection state
   * @returns Array of blind spots that should surface in this context
   */
  evaluate(
    blindSpots: BlindSpot[],
    context: string,
    affection: AffectionState,
  ): BlindSpot[] {
    if (TIER_ORDER[affection.tier] < TIER_ORDER[MINIMUM_SURFACING_TIER]) {
      return [];
    }

    const contextLower = context.toLowerCase();
    const surfacing: BlindSpot[] = [];

    for (const spot of blindSpots) {
      if (spot.surfaced) {
        continue;
      }

      if (this.shouldApproach(spot, contextLower)) {
        surfacing.push(spot);
      }
    }

    return surfacing;
  }

  /**
   * Mark a blind spot as surfaced — the soul has become aware of this gap.
   *
   * This is an irreversible operation: once a blind spot surfaces,
   * the soul's self-model has permanently changed.
   *
   * @param blindSpot — the blind spot to surface
   * @returns A new BlindSpot marked as surfaced with a timestamp
   */
  surface(blindSpot: BlindSpot): BlindSpot {
    if (blindSpot.surfaced) {
      return blindSpot;
    }

    return {
      ...blindSpot,
      surfaced: true,
      surfacedAt: Date.now(),
    };
  }

  /**
   * Get all unsurfaced (still active) blind spots.
   *
   * @param blindSpots — array of all blind spots
   * @returns Only the blind spots that have not yet surfaced
   */
  getActive(blindSpots: BlindSpot[]): BlindSpot[] {
    return blindSpots.filter(spot => !spot.surfaced);
  }

  /**
   * Describe the structural gap between the soul's belief and reality.
   *
   * This information is for the narrator/tester view ONLY — it should
   * never be exposed to the soul itself during conversation, as that
   * would collapse the blind spot prematurely.
   *
   * @param blindSpot — the blind spot to analyze
   * @returns A structured description of the gap
   */
  getStructuralGap(blindSpot: BlindSpot): {
    belief: string;
    reality: string;
    gap: string;
    surfaced: boolean;
    surfaceCondition: string;
  } {
    const gap = blindSpot.surfaced
      ? `[SURFACED] The soul now recognizes the gap between "${blindSpot.soulBelief}" and the underlying driver: "${blindSpot.actualDriver}".`
      : `The soul believes: "${blindSpot.soulBelief}" — but is actually driven by: "${blindSpot.actualDriver}". This gap remains invisible to the soul.`;

    return {
      belief: blindSpot.soulBelief,
      reality: blindSpot.actualDriver,
      gap,
      surfaced: blindSpot.surfaced,
      surfaceCondition: blindSpot.surfaceCondition,
    };
  }

  /**
   * Generate default blind spots based on a character archetype.
   *
   * Archetypes provide common blind spot patterns:
   *   warrior, healer, ruler, trickster, scholar, guardian
   *
   * If the source does not match a known archetype, falls back to
   * universal blind spots that apply to any persona.
   *
   * @param soulName — the soul's name (used for personalization)
   * @param source   — the soul's source or archetype identifier
   * @returns Array of blind spots appropriate for this archetype
   */
  generateDefault(soulName: string, source: string): BlindSpot[] {
    const sourceLower = source.toLowerCase();

    // Find matching archetype
    let templates = ARCHETYPE_BLIND_SPOTS['default'];

    for (const [archetype, spots] of Object.entries(ARCHETYPE_BLIND_SPOTS)) {
      if (archetype === 'default') continue;

      if (
        sourceLower.includes(archetype) ||
        archetype.includes(sourceLower)
      ) {
        templates = spots;
        break;
      }
    }

    // Always include at least one universal blind spot
    const universalSpots = ARCHETYPE_BLIND_SPOTS['default'];
    const universal = universalSpots[Math.floor(Math.random() * universalSpots.length)];

    const result: BlindSpot[] = templates.map(template =>
      this.create(
        template.soulBelief,
        template.actualDriver,
        template.surfaceCondition,
      ),
    );

    // Add universal blind spot if it's not already covered
    const hasUniversal = result.some(
      spot => spot.soulBelief === universal.soulBelief,
    );
    if (!hasUniversal) {
      result.push(
        this.create(
          universal.soulBelief,
          universal.actualDriver,
          universal.surfaceCondition,
        ),
      );
    }

    return result;
  }

  /**
   * Determine whether the current conversation is approaching a blind spot.
   *
   * Uses keyword extraction from the surface condition to detect when
   * the conversation is getting close to triggering territory.
   *
   * @param blindSpot          — the blind spot to check
   * @param conversationContext — current conversation content (lowercase)
   * @returns Whether the conversation is approaching this blind spot
   */
  shouldApproach(blindSpot: BlindSpot, conversationContext: string): boolean {
    if (blindSpot.surfaced) {
      return false;
    }

    const contextLower = typeof conversationContext === 'string'
      ? conversationContext.toLowerCase()
      : '';

    if (contextLower.length === 0) {
      return false;
    }

    // Extract meaningful keywords from the surface condition
    const conditionWords = this.extractKeywords(blindSpot.surfaceCondition);

    if (conditionWords.length === 0) {
      return false;
    }

    // Count how many condition keywords appear in the context
    const matchCount = conditionWords.filter(word =>
      contextLower.includes(word),
    ).length;

    // Require at least 2 keyword matches, or 50% of keywords if fewer than 4
    const threshold = conditionWords.length < 4
      ? Math.ceil(conditionWords.length * 0.5)
      : 2;

    return matchCount >= threshold;
  }

  // --- Private Helpers ---

  /**
   * Extract meaningful keywords from a surface condition string.
   * Filters out common stop words to focus on semantically significant terms.
   */
  private extractKeywords(condition: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'shall', 'can',
      'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
      'as', 'into', 'through', 'during', 'before', 'after', 'above',
      'below', 'between', 'and', 'but', 'or', 'nor', 'not', 'so',
      'yet', 'both', 'either', 'neither', 'each', 'every', 'all',
      'any', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'only', 'own', 'same', 'than', 'too', 'very', 'just', 'about',
      'if', 'when', 'where', 'how', 'what', 'which', 'who', 'whom',
      'this', 'that', 'these', 'those', 'i', 'me', 'my', 'we', 'our',
      'you', 'your', 'he', 'him', 'his', 'she', 'her', 'it', 'its',
      'they', 'them', 'their', 'up', 'out', 'off',
    ]);

    return condition
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2 && !stopWords.has(word));
  }
}

/** Singleton instance of the BlindSpotEngine. */
export const blindSpotEngine = new BlindSpotEngine();
