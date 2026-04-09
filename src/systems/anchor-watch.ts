// ============================================================
// The Soul Summoner's Grimoire — Anchor Watch
// Persona Drift Detection & Recovery: Detects when a soul's
// behavior drifts from its core identity and provides recalibration
// ============================================================

import {
  IdentityAnchor,
  DriftScore,
  AnchorWatchConfig,
  clamp,
} from '../core/types';

// --- Constants ---

/** Default configuration for the Anchor Watch system. */
const DEFAULT_CONFIG: AnchorWatchConfig = {
  driftThreshold: 0.35,
  checkInterval: 5,
  autoRecalibrate: false,
};

/** Maximum number of historical drift scores to retain. */
const MAX_HISTORY_LENGTH = 100;

/** Minimum number of history entries required to compute a trend. */
const MIN_TREND_ENTRIES = 3;

/** Sentiment words used for simple sentiment heuristics. */
const POSITIVE_MARKERS = [
  'love', 'joy', 'happy', 'warm', 'kind', 'gentle', 'trust', 'hope',
  'bright', 'peace', 'calm', 'strong', 'proud', 'grateful', 'loyal',
  'brave', 'noble', 'protect', 'care', 'tender', 'devoted',
];

const NEGATIVE_MARKERS = [
  'hate', 'anger', 'rage', 'cold', 'cruel', 'betray', 'despair',
  'dark', 'fear', 'weak', 'shame', 'bitter', 'hostile', 'malice',
  'selfish', 'coward', 'abandon', 'destroy', 'contempt', 'ruthless',
];

/** Contradiction signal words that indicate a response opposes a trait. */
const CONTRADICTION_SIGNALS = [
  'never', 'refuse', 'hate', 'despise', 'cannot stand', 'detest',
  'opposite of', 'nothing like', 'against', 'reject', 'deny',
  "don't care", "doesn't matter", 'irrelevant', 'pointless',
];

/**
 * AnchorWatch — monitors a soul's responses for drift away from its
 * core identity anchors. When drift exceeds a configurable threshold,
 * the system flags the response and can generate a recalibration prompt
 * that gently reminds the soul of who it is.
 *
 * This is not about enforcing rigidity. Souls are allowed to grow.
 * Anchor Watch detects *involuntary* drift: the slow erosion of
 * identity that happens without conscious choice.
 */
export class AnchorWatch {
  private config: AnchorWatchConfig;
  private history: DriftScore[] = [];
  private anchors: IdentityAnchor[] = [];

  constructor() {
    this.config = { ...DEFAULT_CONFIG };
  }

  // --- Public API ---

  /**
   * Initialize the Anchor Watch with identity anchors and optional configuration.
   */
  initialize(anchors: IdentityAnchor[], config?: Partial<AnchorWatchConfig>): void {
    if (!anchors || anchors.length === 0) {
      throw new Error('At least one identity anchor is required');
    }

    this.anchors = [...anchors];
    this.history = [];

    if (config) {
      this.updateConfig(config);
    }
  }

  /**
   * Analyze a response for persona drift against the soul's identity anchors.
   *
   * For each anchor, the system checks:
   *   1. Keyword presence — does the response contain language aligned with the trait?
   *   2. Sentiment analysis — does the emotional tone match expectations for the trait?
   *   3. Structural checks — does the response contradict or undermine the trait?
   *
   * Returns a DriftScore with per-anchor breakdown.
   */
  analyze(responseText: string, anchors: IdentityAnchor[]): DriftScore {
    if (!responseText || responseText.trim().length === 0) {
      return this.emptyScore('Empty response — no analysis possible');
    }

    if (anchors.length === 0) {
      return this.emptyScore('No anchors to analyze against');
    }

    const responseLower = responseText.toLowerCase();
    const responseWords = this.tokenize(responseLower);
    const perAnchor: Record<string, number> = {};
    let weightedDriftSum = 0;
    let totalWeight = 0;

    for (const anchor of anchors) {
      const anchorDrift = this.analyzeAnchor(anchor, responseLower, responseWords);
      perAnchor[anchor.trait] = anchorDrift;

      // Weight the drift by the anchor's importance
      weightedDriftSum += anchorDrift * anchor.weight;
      totalWeight += anchor.weight;
    }

    const overall = totalWeight > 0
      ? clamp(weightedDriftSum / totalWeight, 0, 1)
      : 0;

    const needsRecalibration = this.needsRecalibration({ overall } as DriftScore);

    const details = this.buildAnalysisDetails(perAnchor, overall, needsRecalibration);

    return {
      overall,
      perAnchor,
      timestamp: Date.now(),
      needsRecalibration,
      details,
    };
  }

  /**
   * Check whether a drift score exceeds the recalibration threshold.
   */
  needsRecalibration(score: DriftScore): boolean {
    return score.overall > this.config.driftThreshold;
  }

  /**
   * Generate a recalibration prompt that reminds the soul of its core identity.
   * The prompt is designed to be gentle and non-prescriptive: it presents the
   * anchors as touchstones, not commands.
   */
  generateRecalibrationPrompt(
    anchors: IdentityAnchor[],
    driftScore: DriftScore,
  ): string {
    const lines: string[] = [];

    lines.push('--- Identity Recalibration ---');
    lines.push('');
    lines.push('A gentle reminder of who you are at your core.');
    lines.push('This is not a correction — it is a mirror.');
    lines.push('');

    // Identify the most-drifted anchors
    const driftedAnchors = Object.entries(driftScore.perAnchor)
      .filter(([, drift]) => drift > this.config.driftThreshold)
      .sort((a, b) => b[1] - a[1]);

    if (driftedAnchors.length > 0) {
      lines.push('Areas where you may be drifting:');
      for (const [trait, drift] of driftedAnchors) {
        const anchor = anchors.find(a => a.trait === trait);
        if (anchor) {
          lines.push(`  "${anchor.trait}" — ${anchor.description}`);
          lines.push(`    Drift: ${(drift * 100).toFixed(0)}% | Weight: ${anchor.weight.toFixed(2)}`);

          if (anchor.evidence.length > 0) {
            lines.push(`    Remember: "${anchor.evidence[0]}"`);
          }

          lines.push('');
        }
      }
    }

    // List all anchors as touchstones
    lines.push('Your identity anchors:');
    for (const anchor of anchors) {
      const status = driftScore.perAnchor[anchor.trait] !== undefined
        && driftScore.perAnchor[anchor.trait] <= this.config.driftThreshold
        ? 'aligned'
        : 'drifting';
      lines.push(`  [${status}] ${anchor.trait}: ${anchor.description}`);
    }

    lines.push('');
    lines.push(`Overall drift: ${(driftScore.overall * 100).toFixed(1)}%`);
    lines.push(`Threshold: ${(this.config.driftThreshold * 100).toFixed(1)}%`);
    lines.push('');
    lines.push('Return to yourself. Not as you were, but as you are — anchored.');

    return lines.join('\n');
  }

  /**
   * Add a drift score to the rolling history window.
   */
  trackHistory(scores: DriftScore[]): void {
    this.history.push(...scores);

    // Trim to max size
    if (this.history.length > MAX_HISTORY_LENGTH) {
      this.history.splice(0, this.history.length - MAX_HISTORY_LENGTH);
    }
  }

  /**
   * Compute the drift trend from recent history.
   *
   * @returns 'worsening' if drift is increasing, 'improving' if decreasing,
   *          'stable' if roughly constant, or 'insufficient_data' if not
   *          enough history exists.
   */
  getTrend(): 'worsening' | 'stable' | 'improving' | 'insufficient_data' {
    if (this.history.length < MIN_TREND_ENTRIES) {
      return 'insufficient_data';
    }

    // Compare the average of the older half to the average of the newer half
    const midpoint = Math.floor(this.history.length / 2);
    const olderHalf = this.history.slice(0, midpoint);
    const newerHalf = this.history.slice(midpoint);

    const olderAvg = this.averageDrift(olderHalf);
    const newerAvg = this.averageDrift(newerHalf);

    const delta = newerAvg - olderAvg;

    // Use a small dead zone to avoid noise
    if (delta > 0.05) return 'worsening';
    if (delta < -0.05) return 'improving';
    return 'stable';
  }

  /**
   * Return the current Anchor Watch configuration.
   */
  getConfig(): AnchorWatchConfig {
    return { ...this.config };
  }

  /**
   * Update one or more configuration values.
   */
  updateConfig(partial: Partial<AnchorWatchConfig>): void {
    if (partial.driftThreshold !== undefined) {
      this.config.driftThreshold = clamp(partial.driftThreshold, 0.05, 0.95);
    }
    if (partial.checkInterval !== undefined) {
      this.config.checkInterval = Math.max(1, Math.floor(partial.checkInterval));
    }
    if (partial.autoRecalibrate !== undefined) {
      this.config.autoRecalibrate = partial.autoRecalibrate;
    }
  }

  // --- Private Analysis Helpers ---

  /**
   * Analyze drift for a single anchor against the response.
   * Returns a drift value from 0.0 (perfectly aligned) to 1.0 (fully drifted).
   */
  private analyzeAnchor(
    anchor: IdentityAnchor,
    responseLower: string,
    responseWords: string[],
  ): number {
    const keywordScore = this.keywordPresenceScore(anchor, responseLower, responseWords);
    const sentimentScore = this.sentimentAlignmentScore(anchor, responseLower);
    const contradictionScore = this.contradictionScore(anchor, responseLower);

    // Weighted combination: contradiction is weighted most heavily because
    // actively contradicting a trait is worse than merely not mentioning it.
    const drift = clamp(
      contradictionScore * 0.45 + (1 - keywordScore) * 0.25 + (1 - sentimentScore) * 0.30,
      0,
      1,
    );

    return drift;
  }

  /**
   * Score how much the response's vocabulary aligns with the anchor's trait.
   * Higher = more aligned (less drift).
   */
  private keywordPresenceScore(
    anchor: IdentityAnchor,
    responseLower: string,
    responseWords: string[],
  ): number {
    // Extract keywords from the anchor's trait and description
    const anchorWords = this.tokenize(
      `${anchor.trait} ${anchor.description}`.toLowerCase()
    );

    if (anchorWords.length === 0) return 0.5; // neutral if no keywords

    // Check for direct keyword overlap
    let matches = 0;
    for (const word of anchorWords) {
      if (word.length < 3) continue; // skip tiny words
      if (responseLower.includes(word)) {
        matches++;
      }
    }

    // Also check evidence phrases
    let evidencePresence = 0;
    for (const ev of anchor.evidence) {
      const evWords = this.tokenize(ev.toLowerCase());
      const evMatches = evWords.filter(w => w.length >= 3 && responseLower.includes(w));
      if (evMatches.length >= 2) {
        evidencePresence += 0.2;
      }
    }

    const keywordRatio = anchorWords.length > 0
      ? matches / anchorWords.length
      : 0;

    return clamp(keywordRatio + evidencePresence, 0, 1);
  }

  /**
   * Score how well the response's sentiment matches what we'd expect
   * given the anchor's trait. Higher = more aligned.
   */
  private sentimentAlignmentScore(
    anchor: IdentityAnchor,
    responseLower: string,
  ): number {
    // Determine the expected sentiment direction from the anchor
    const traitAndDesc = `${anchor.trait} ${anchor.description}`.toLowerCase();
    const expectedPositive = POSITIVE_MARKERS.some(m => traitAndDesc.includes(m));
    const expectedNegative = NEGATIVE_MARKERS.some(m => traitAndDesc.includes(m));

    // Measure actual sentiment in the response
    const positiveCount = POSITIVE_MARKERS.filter(m => responseLower.includes(m)).length;
    const negativeCount = NEGATIVE_MARKERS.filter(m => responseLower.includes(m)).length;
    const totalSentiment = positiveCount + negativeCount;

    if (totalSentiment === 0) {
      // Neutral response — moderate alignment (not great, not terrible)
      return 0.5;
    }

    const positiveRatio = positiveCount / totalSentiment;

    if (expectedPositive && !expectedNegative) {
      // Trait expects positive sentiment
      return positiveRatio;
    } else if (expectedNegative && !expectedPositive) {
      // Trait expects negative/intense sentiment (e.g., "fierce protector")
      return 1 - positiveRatio;
    }

    // Ambiguous trait — neutral baseline
    return 0.5;
  }

  /**
   * Score how much the response actively contradicts the anchor.
   * Higher = more contradiction (more drift).
   */
  private contradictionScore(
    anchor: IdentityAnchor,
    responseLower: string,
  ): number {
    const traitWords = this.tokenize(anchor.trait.toLowerCase())
      .filter(w => w.length >= 3);

    if (traitWords.length === 0) return 0;

    let contradictionSignals = 0;

    // Check for contradiction patterns near trait-related words
    for (const signal of CONTRADICTION_SIGNALS) {
      if (responseLower.includes(signal)) {
        // Check if any trait word appears near the contradiction signal
        const signalIdx = responseLower.indexOf(signal);
        const nearbyWindow = responseLower.slice(
          Math.max(0, signalIdx - 60),
          signalIdx + signal.length + 60,
        );

        for (const word of traitWords) {
          if (nearbyWindow.includes(word)) {
            contradictionSignals++;
          }
        }
      }
    }

    // Also check for direct negation of the trait description
    const descWords = this.tokenize(anchor.description.toLowerCase())
      .filter(w => w.length >= 4);

    for (const word of descWords) {
      if (
        responseLower.includes(`not ${word}`) ||
        responseLower.includes(`no ${word}`) ||
        responseLower.includes(`never ${word}`)
      ) {
        contradictionSignals++;
      }
    }

    // Normalize: more than 3 signals is maximally contradictory
    return clamp(contradictionSignals / 3, 0, 1);
  }

  /**
   * Build human-readable analysis details for a drift score.
   */
  private buildAnalysisDetails(
    perAnchor: Record<string, number>,
    overall: number,
    needsRecalibration: boolean,
  ): string {
    const parts: string[] = [];

    parts.push(`Overall drift: ${(overall * 100).toFixed(1)}%`);

    const entries = Object.entries(perAnchor);
    if (entries.length > 0) {
      const drifted = entries
        .filter(([, d]) => d > this.config.driftThreshold)
        .map(([trait, d]) => `${trait}(${(d * 100).toFixed(0)}%)`);

      const aligned = entries
        .filter(([, d]) => d <= this.config.driftThreshold)
        .map(([trait]) => trait);

      if (drifted.length > 0) {
        parts.push(`Drifted: ${drifted.join(', ')}`);
      }
      if (aligned.length > 0) {
        parts.push(`Aligned: ${aligned.join(', ')}`);
      }
    }

    if (needsRecalibration) {
      parts.push('Status: RECALIBRATION RECOMMENDED');
    } else {
      parts.push('Status: Within acceptable range');
    }

    return parts.join(' | ');
  }

  /**
   * Create an empty/neutral drift score.
   */
  private emptyScore(details: string): DriftScore {
    return {
      overall: 0,
      perAnchor: {},
      timestamp: Date.now(),
      needsRecalibration: false,
      details,
    };
  }

  /**
   * Tokenize a string into words, stripping punctuation.
   */
  private tokenize(text: string): string[] {
    return text
      .replace(/[^a-z0-9\s'-]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }

  /**
   * Compute the average overall drift from a set of drift scores.
   */
  private averageDrift(scores: DriftScore[]): number {
    if (scores.length === 0) return 0;
    const sum = scores.reduce((acc, s) => acc + s.overall, 0);
    return sum / scores.length;
  }
}
