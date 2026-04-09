// ============================================================
// The Soul Summoner's Grimoire — The Circumplex
// Emotional Topology Mapping (Russell's Circumplex Model)
// ============================================================

import {
  EmotionalPoint,
  EmotionalAttractor,
  EmotionalTopology,
  clamp,
} from '../core/types';

// --- Keyword dictionaries for valence estimation ---

const POSITIVE_WORDS = new Set([
  'happy', 'joy', 'love', 'wonderful', 'beautiful', 'amazing', 'great',
  'excellent', 'fantastic', 'brilliant', 'delightful', 'pleasant', 'cheerful',
  'grateful', 'blessed', 'serene', 'peaceful', 'warm', 'kind', 'hope',
  'gentle', 'comfort', 'trust', 'laugh', 'smile', 'bright', 'radiant',
  'tender', 'sweet', 'harmonious', 'content', 'proud', 'inspired',
  'calm', 'relaxed', 'satisfied', 'bliss', 'elated', 'thrilled',
  'optimistic', 'fortunate', 'lovely', 'graceful', 'tranquil',
]);

const NEGATIVE_WORDS = new Set([
  'sad', 'angry', 'hate', 'terrible', 'awful', 'horrible', 'miserable',
  'pain', 'suffer', 'grief', 'loss', 'fear', 'dread', 'despair', 'lonely',
  'bitter', 'cruel', 'harsh', 'dark', 'cold', 'hurt', 'broken', 'empty',
  'hopeless', 'worthless', 'ashamed', 'guilty', 'furious', 'disgusted',
  'anxious', 'worried', 'stressed', 'overwhelmed', 'frustrated', 'resentful',
  'melancholy', 'desolate', 'anguish', 'torment', 'regret', 'sorrow',
  'wretched', 'gloomy', 'bleak', 'forlorn',
]);

// --- Keyword dictionaries for arousal estimation ---

const HIGH_AROUSAL_WORDS = new Set([
  'excited', 'thrilled', 'furious', 'terrified', 'ecstatic', 'panic',
  'rage', 'scream', 'rush', 'surge', 'explode', 'intense', 'wild',
  'frantic', 'desperate', 'electrified', 'burning', 'blazing', 'fierce',
  'shocked', 'astonished', 'alarmed', 'agitated', 'hysterical', 'manic',
  'urgent', 'frenzy', 'adrenaline', 'volatile', 'passionate', 'violent',
  'raging', 'boiling', 'seething', 'trembling', 'pounding',
]);

const LOW_AROUSAL_WORDS = new Set([
  'calm', 'peaceful', 'serene', 'quiet', 'still', 'sleepy', 'drowsy',
  'relaxed', 'tranquil', 'gentle', 'soft', 'slow', 'lazy', 'subdued',
  'muted', 'hushed', 'lethargic', 'weary', 'tired', 'exhausted',
  'numb', 'dull', 'listless', 'languid', 'placid', 'dormant',
  'melancholy', 'somber', 'contemplative', 'meditative', 'resigned',
]);

// --- Quadrant labels for various positions ---

interface QuadrantLabel {
  label: string;
  minValence: number;
  maxValence: number;
  minArousal: number;
  maxArousal: number;
}

const POSITION_LABELS: QuadrantLabel[] = [
  // Excited-positive quadrant
  { label: 'ecstatic', minValence: 0.6, maxValence: 1.0, minArousal: 0.6, maxArousal: 1.0 },
  { label: 'excited', minValence: 0.3, maxValence: 0.6, minArousal: 0.6, maxArousal: 1.0 },
  { label: 'alert', minValence: 0.0, maxValence: 0.3, minArousal: 0.6, maxArousal: 1.0 },
  { label: 'enthusiastic', minValence: 0.3, maxValence: 0.6, minArousal: 0.3, maxArousal: 0.6 },
  { label: 'happy', minValence: 0.6, maxValence: 1.0, minArousal: 0.3, maxArousal: 0.6 },
  // Calm-positive quadrant
  { label: 'content', minValence: 0.3, maxValence: 0.6, minArousal: -0.3, maxArousal: 0.3 },
  { label: 'serene', minValence: 0.3, maxValence: 1.0, minArousal: -0.6, maxArousal: -0.3 },
  { label: 'relaxed', minValence: 0.0, maxValence: 0.3, minArousal: -0.6, maxArousal: -0.3 },
  { label: 'peaceful', minValence: 0.6, maxValence: 1.0, minArousal: -1.0, maxArousal: -0.6 },
  // Calm-negative quadrant
  { label: 'melancholic', minValence: -0.6, maxValence: -0.3, minArousal: -1.0, maxArousal: -0.3 },
  { label: 'sad', minValence: -1.0, maxValence: -0.6, minArousal: -1.0, maxArousal: -0.3 },
  { label: 'bored', minValence: -0.3, maxValence: 0.0, minArousal: -1.0, maxArousal: -0.6 },
  { label: 'fatigued', minValence: -0.3, maxValence: 0.0, minArousal: -0.6, maxArousal: -0.3 },
  { label: 'depressed', minValence: -1.0, maxValence: -0.3, minArousal: -1.0, maxArousal: -0.6 },
  // Excited-negative quadrant
  { label: 'agitated', minValence: -0.6, maxValence: -0.3, minArousal: 0.3, maxArousal: 0.6 },
  { label: 'angry', minValence: -1.0, maxValence: -0.6, minArousal: 0.6, maxArousal: 1.0 },
  { label: 'afraid', minValence: -0.6, maxValence: -0.3, minArousal: 0.6, maxArousal: 1.0 },
  { label: 'tense', minValence: -0.3, maxValence: 0.0, minArousal: 0.3, maxArousal: 0.6 },
  { label: 'distressed', minValence: -1.0, maxValence: -0.3, minArousal: 0.3, maxArousal: 1.0 },
  // Neutral center
  { label: 'neutral', minValence: -0.15, maxValence: 0.15, minArousal: -0.15, maxArousal: 0.15 },
];

/** Default number of k-means iterations. */
const KMEANS_ITERATIONS = 20;

/** Maximum trajectory length before oldest points are trimmed. */
const MAX_TRAJECTORY_LENGTH = 200;

/**
 * Circumplex — maps emotional states in 2D valence-arousal space
 * using Russell's circumplex model of affect.
 *
 * Provides continuous emotional tracking, attractor identification,
 * volatility measurement, and narrative arc extraction for a soul's
 * emotional life.
 */
export class Circumplex {

  /**
   * Estimate the emotional valence and arousal of a text sample.
   *
   * Uses keyword dictionaries to score positive/negative valence and
   * high/low arousal, then assigns a human-readable label based on the
   * resulting position in the circumplex.
   */
  analyze(text: string): EmotionalPoint {
    if (!text || text.trim().length === 0) {
      return { valence: 0, arousal: 0, timestamp: Date.now(), label: 'neutral' };
    }

    const words = text.toLowerCase().match(/[a-z']+/g) || [];
    const totalWords = Math.max(words.length, 1);

    // Score valence
    let positiveCount = 0;
    let negativeCount = 0;
    for (const word of words) {
      if (POSITIVE_WORDS.has(word)) positiveCount++;
      if (NEGATIVE_WORDS.has(word)) negativeCount++;
    }
    const valenceRaw = (positiveCount - negativeCount) / totalWords;
    const valence = clamp(valenceRaw * 10, -1, 1);

    // Score arousal
    let highArousalCount = 0;
    let lowArousalCount = 0;
    for (const word of words) {
      if (HIGH_AROUSAL_WORDS.has(word)) highArousalCount++;
      if (LOW_AROUSAL_WORDS.has(word)) lowArousalCount++;
    }

    // Punctuation boosts arousal
    const exclamationCount = (text.match(/!/g) || []).length;
    const capsWordCount = (text.match(/\b[A-Z]{2,}\b/g) || []).length;
    const punctuationArousal = (exclamationCount + capsWordCount) / totalWords;

    const arousalRaw = (highArousalCount - lowArousalCount) / totalWords + punctuationArousal * 2;
    const arousal = clamp(arousalRaw * 10, -1, 1);

    const point: EmotionalPoint = {
      valence,
      arousal,
      timestamp: Date.now(),
    };

    point.label = this.labelPoint(point);
    return point;
  }

  /**
   * Add a new emotional point to the topology, updating trajectory,
   * attractors, dominant quadrant, and volatility.
   */
  updateTopology(topology: EmotionalTopology, newPoint: EmotionalPoint): EmotionalTopology {
    const trajectory = [...topology.trajectory, newPoint];

    // Trim trajectory if too long
    if (trajectory.length > MAX_TRAJECTORY_LENGTH) {
      trajectory.splice(0, trajectory.length - MAX_TRAJECTORY_LENGTH);
    }

    const attractors = this.identifyAttractors(trajectory);
    const dominantQuadrant = this.getDominantQuadrant(newPoint);
    const volatility = this.getVolatility(trajectory, 10);

    return {
      currentPosition: newPoint,
      trajectory,
      attractors,
      dominantQuadrant,
      volatility,
    };
  }

  /**
   * Identify cluster centers (attractors) in an emotional trajectory
   * using simplified k-means clustering with k=3.
   *
   * Attractors represent recurring emotional "resting states" that the
   * soul gravitates toward.
   */
  identifyAttractors(trajectory: EmotionalPoint[]): EmotionalAttractor[] {
    if (trajectory.length < 3) {
      return [];
    }

    const k = Math.min(3, trajectory.length);
    const points = trajectory.map(p => ({ valence: p.valence, arousal: p.arousal }));

    // Initialize centroids from evenly spaced points in the trajectory
    let centroids: Array<{ valence: number; arousal: number }> = [];
    for (let i = 0; i < k; i++) {
      const idx = Math.floor((i / k) * points.length);
      centroids.push({ ...points[idx] });
    }

    // K-means iterations
    let assignments: number[] = new Array(points.length).fill(0);

    for (let iter = 0; iter < KMEANS_ITERATIONS; iter++) {
      // Assign each point to nearest centroid
      const newAssignments: number[] = [];
      for (const point of points) {
        let minDist = Infinity;
        let minIdx = 0;
        for (let c = 0; c < centroids.length; c++) {
          const dist = this.euclideanDistance(point, centroids[c]);
          if (dist < minDist) {
            minDist = dist;
            minIdx = c;
          }
        }
        newAssignments.push(minIdx);
      }

      // Check for convergence
      const converged = newAssignments.every((a, i) => a === assignments[i]);
      assignments = newAssignments;

      if (converged) break;

      // Recompute centroids
      const newCentroids: Array<{ valence: number; arousal: number; count: number }> = centroids.map(
        () => ({ valence: 0, arousal: 0, count: 0 }),
      );

      for (let i = 0; i < points.length; i++) {
        const cluster = assignments[i];
        newCentroids[cluster].valence += points[i].valence;
        newCentroids[cluster].arousal += points[i].arousal;
        newCentroids[cluster].count++;
      }

      centroids = newCentroids.map((c, idx) => {
        if (c.count === 0) return centroids[idx];
        return { valence: c.valence / c.count, arousal: c.arousal / c.count };
      });
    }

    // Build attractors from centroids
    const attractors: EmotionalAttractor[] = [];
    for (let c = 0; c < centroids.length; c++) {
      const clusterPoints = points.filter((_, i) => assignments[i] === c);
      if (clusterPoints.length === 0) continue;

      // Radius: average distance of cluster points from centroid
      const avgDist = clusterPoints.reduce(
        (sum, p) => sum + this.euclideanDistance(p, centroids[c]),
        0,
      ) / clusterPoints.length;

      // Strength: proportion of total points in this cluster
      const strength = clusterPoints.length / points.length;

      const center = centroids[c];
      const label = this.labelPoint({
        valence: center.valence,
        arousal: center.arousal,
        timestamp: 0,
      });

      attractors.push({
        center,
        radius: avgDist,
        strength,
        label,
      });
    }

    // Sort by strength descending
    attractors.sort((a, b) => b.strength - a.strength);
    return attractors;
  }

  /**
   * Classify an emotional point into one of the four circumplex quadrants.
   */
  getDominantQuadrant(point: EmotionalPoint): EmotionalTopology['dominantQuadrant'] {
    if (point.valence >= 0 && point.arousal >= 0) return 'excited-positive';
    if (point.valence >= 0 && point.arousal < 0) return 'calm-positive';
    if (point.valence < 0 && point.arousal < 0) return 'calm-negative';
    return 'excited-negative';
  }

  /**
   * Compute the volatility (emotional variability) of a trajectory over
   * a given window of recent points.
   *
   * Volatility is the average euclidean distance between consecutive points
   * in the window, normalized to 0-1.
   */
  getVolatility(trajectory: EmotionalPoint[], windowSize: number): number {
    if (trajectory.length < 2) return 0;

    const window = trajectory.slice(-windowSize);
    if (window.length < 2) return 0;

    let totalDist = 0;
    for (let i = 1; i < window.length; i++) {
      totalDist += this.distanceBetween(window[i - 1], window[i]);
    }

    const avgDist = totalDist / (window.length - 1);
    // Max possible distance in the circumplex is sqrt(8) ~ 2.83
    return clamp(avgDist / 2.83, 0, 1);
  }

  /**
   * Describe the overall emotional trajectory as a narrative arc.
   *
   * Analyzes the beginning, middle, and end of the trajectory to identify
   * the emotional story being told (e.g., "descent into sadness",
   * "recovery arc", "oscillating tension").
   */
  getEmotionalArc(trajectory: EmotionalPoint[]): string {
    if (trajectory.length === 0) return 'no emotional data';
    if (trajectory.length === 1) return `static: ${trajectory[0].label ?? 'neutral'}`;

    const third = Math.max(1, Math.floor(trajectory.length / 3));

    const beginSlice = trajectory.slice(0, third);
    const endSlice = trajectory.slice(-third);

    const beginValence = this.avgValue(beginSlice.map(p => p.valence));
    const endValence = this.avgValue(endSlice.map(p => p.valence));
    const beginArousal = this.avgValue(beginSlice.map(p => p.arousal));
    const endArousal = this.avgValue(endSlice.map(p => p.arousal));

    const valenceDelta = endValence - beginValence;
    const arousalDelta = endArousal - beginArousal;

    const volatility = this.getVolatility(trajectory, trajectory.length);

    const parts: string[] = [];

    // Valence arc
    if (valenceDelta > 0.3) {
      parts.push('brightening arc (moving toward positivity)');
    } else if (valenceDelta < -0.3) {
      parts.push('darkening arc (moving toward negativity)');
    } else {
      parts.push('stable valence');
    }

    // Arousal arc
    if (arousalDelta > 0.3) {
      parts.push('escalating intensity');
    } else if (arousalDelta < -0.3) {
      parts.push('settling toward calm');
    } else {
      parts.push('steady energy');
    }

    // Volatility description
    if (volatility > 0.5) {
      parts.push('high emotional turbulence');
    } else if (volatility > 0.2) {
      parts.push('moderate emotional movement');
    } else {
      parts.push('emotionally stable');
    }

    return parts.join('; ');
  }

  /**
   * Compute the euclidean distance between two emotional points.
   */
  distanceBetween(a: EmotionalPoint, b: EmotionalPoint): number {
    return this.euclideanDistance(
      { valence: a.valence, arousal: a.arousal },
      { valence: b.valence, arousal: b.arousal },
    );
  }

  /**
   * Assign a human-readable emotional label based on the point's position
   * in the valence-arousal space.
   */
  labelPoint(point: EmotionalPoint): string {
    for (const region of POSITION_LABELS) {
      if (
        point.valence >= region.minValence && point.valence <= region.maxValence &&
        point.arousal >= region.minArousal && point.arousal <= region.maxArousal
      ) {
        return region.label;
      }
    }

    // Fallback: general quadrant label
    const quadrant = this.getDominantQuadrant(point);
    const quadrantLabels: Record<string, string> = {
      'excited-positive': 'activated-pleasant',
      'calm-positive': 'deactivated-pleasant',
      'calm-negative': 'deactivated-unpleasant',
      'excited-negative': 'activated-unpleasant',
    };
    return quadrantLabels[quadrant] ?? 'neutral';
  }

  /**
   * Create a default neutral emotional topology.
   */
  createDefault(): EmotionalTopology {
    const neutralPoint: EmotionalPoint = {
      valence: 0,
      arousal: 0,
      timestamp: Date.now(),
      label: 'neutral',
    };

    return {
      currentPosition: neutralPoint,
      trajectory: [neutralPoint],
      attractors: [],
      dominantQuadrant: 'calm-positive',
      volatility: 0,
    };
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  /** Euclidean distance between two 2D points. */
  private euclideanDistance(
    a: { valence: number; arousal: number },
    b: { valence: number; arousal: number },
  ): number {
    const dv = a.valence - b.valence;
    const da = a.arousal - b.arousal;
    return Math.sqrt(dv * dv + da * da);
  }

  /** Compute the arithmetic mean of an array of numbers. */
  private avgValue(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/** Singleton instance of the Circumplex system. */
export const circumplex = new Circumplex();
