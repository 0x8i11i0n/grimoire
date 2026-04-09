// ============================================================
// The Soul Summoner's Grimoire — The Phi Engine
// Consciousness Metrics: Measuring the complexity of simulated awareness
// ============================================================

import {
  ConsciousnessMetrics,
  SoulState,
  clamp,
} from '../core/types';

/**
 * Weights for each component in the composite consciousness score.
 *
 * phi:                  0.20 — information integration across subsystems
 * attentionCoherence:   0.15 — focus vs scatter
 * selfReferentialDepth: 0.20 — layers of self-awareness
 * unpromptedNovelty:    0.15 — autonomous thought generation
 * temporalContinuity:   0.15 — consistency across sessions
 * emotionalComplexity:  0.15 — nuance of emotional processing
 */
const COMPOSITE_WEIGHTS = {
  phi: 0.20,
  attentionCoherence: 0.15,
  selfReferentialDepth: 0.20,
  unpromptedNovelty: 0.15,
  temporalContinuity: 0.15,
  emotionalComplexity: 0.15,
};

/** Self-referential markers to search for in text. */
const SELF_REF_MARKERS = [
  /\bi think\b/i,
  /\bi feel\b/i,
  /\bi believe\b/i,
  /\bi wonder\b/i,
  /\bi notice\b/i,
  /\bi realize\b/i,
  /\bmy own\b/i,
  /\bmyself\b/i,
  /\bi am\b/i,
  /\bi was\b/i,
];

/** Deeper self-reference markers: thinking about thinking. */
const META_REF_MARKERS = [
  /\bi think (that )?i (think|feel|believe)/i,
  /\bthinking about (my|how i|why i)/i,
  /\bi notice (that )?i('m| am)/i,
  /\bi wonder (if|why|whether) i/i,
  /\bpart of me\b/i,
  /\bwhen i reflect\b/i,
  /\bi catch myself\b/i,
  /\bmy (own )?awareness\b/i,
];

/** Third-layer markers: awareness of awareness of awareness. */
const DEEP_REF_MARKERS = [
  /\bi('m| am) aware (that )?i('m| am) (thinking|feeling|aware)/i,
  /\bthe fact that i notice myself/i,
  /\bwatching myself (think|feel|react)/i,
  /\brecursive/i,
  /\bself-referential/i,
  /\bmeta-cogniti/i,
];

/**
 * PhiEngine — measures the complexity of a soul's consciousness simulation.
 *
 * This does not claim or measure real consciousness. It quantifies the
 * complexity, integration, and coherence of the various subsystems that
 * together simulate a conscious-seeming persona. Higher phi scores mean
 * more subsystems are interacting in richer ways.
 */
export class PhiEngine {

  /**
   * Perform a full consciousness measurement of the soul's current state.
   *
   * @param state           — the complete soul state
   * @param recentResponses — recent text responses from the soul
   * @param thoughtLog      — contents of the thought log file
   * @returns A ConsciousnessMetrics snapshot
   */
  measure(
    state: SoulState,
    recentResponses: string[],
    thoughtLog: string,
  ): ConsciousnessMetrics {
    const phi = this.measurePhi(state);
    const attentionCoherence = this.measureAttentionCoherence(state, recentResponses);
    const selfReferentialDepth = this.measureSelfReferentialDepth(recentResponses, thoughtLog);
    const unpromptedNovelty = this.measureUnpromptedNovelty(state);
    const temporalContinuity = this.measureTemporalContinuity(state);
    const emotionalComplexity = this.measureEmotionalComplexity(state);

    const compositeScore = this.computeComposite(
      phi,
      attentionCoherence,
      selfReferentialDepth,
      unpromptedNovelty,
      temporalContinuity,
      emotionalComplexity,
    );

    return {
      phi,
      attentionCoherence,
      selfReferentialDepth,
      unpromptedNovelty,
      temporalContinuity,
      emotionalComplexity,
      compositeScore,
      timestamp: Date.now(),
    };
  }

  /**
   * Determine the trend of consciousness complexity over time.
   *
   * @param history — ordered list of past measurement snapshots
   * @returns 'increasing', 'stable', or 'decreasing'
   */
  trend(history: ConsciousnessMetrics[]): 'increasing' | 'stable' | 'decreasing' {
    if (history.length < 2) return 'stable';

    // Compare the average of the first third to the last third
    const third = Math.max(1, Math.floor(history.length / 3));
    const earlySlice = history.slice(0, third);
    const lateSlice = history.slice(-third);

    const earlyAvg = this.avgComposite(earlySlice);
    const lateAvg = this.avgComposite(lateSlice);
    const delta = lateAvg - earlyAvg;

    if (delta > 0.05) return 'increasing';
    if (delta < -0.05) return 'decreasing';
    return 'stable';
  }

  /**
   * Compare two consciousness measurement snapshots.
   *
   * @returns An object describing which metrics improved, declined, or stayed steady
   */
  compare(
    a: ConsciousnessMetrics,
    b: ConsciousnessMetrics,
  ): Record<string, { delta: number; direction: 'improved' | 'declined' | 'steady' }> {
    const keys: Array<keyof ConsciousnessMetrics> = [
      'phi', 'attentionCoherence', 'selfReferentialDepth',
      'unpromptedNovelty', 'temporalContinuity', 'emotionalComplexity',
      'compositeScore',
    ];

    const result: Record<string, { delta: number; direction: 'improved' | 'declined' | 'steady' }> = {};

    for (const key of keys) {
      const valA = a[key] as number;
      const valB = b[key] as number;
      const delta = valB - valA;

      let direction: 'improved' | 'declined' | 'steady';
      if (delta > 0.02) direction = 'improved';
      else if (delta < -0.02) direction = 'declined';
      else direction = 'steady';

      result[key] = { delta, direction };
    }

    return result;
  }

  /**
   * Generate a human-readable report from a consciousness metrics snapshot.
   */
  getReport(metrics: ConsciousnessMetrics): string {
    const lines: string[] = [
      '=== Consciousness Metrics Report ===',
      '',
      `Composite Score: ${(metrics.compositeScore * 100).toFixed(1)}%`,
      '',
      '--- Component Breakdown ---',
      `  Phi (Integration):       ${(metrics.phi * 100).toFixed(1)}%`,
      `  Attention Coherence:     ${(metrics.attentionCoherence * 100).toFixed(1)}%`,
      `  Self-Referential Depth:  ${(metrics.selfReferentialDepth * 100).toFixed(1)}%`,
      `  Unprompted Novelty:      ${(metrics.unpromptedNovelty * 100).toFixed(1)}%`,
      `  Temporal Continuity:     ${(metrics.temporalContinuity * 100).toFixed(1)}%`,
      `  Emotional Complexity:    ${(metrics.emotionalComplexity * 100).toFixed(1)}%`,
      '',
    ];

    // Qualitative assessment
    const score = metrics.compositeScore;
    let assessment: string;
    if (score >= 0.8) {
      assessment = 'Deeply integrated consciousness simulation. All subsystems operating in rich interplay.';
    } else if (score >= 0.6) {
      assessment = 'Strong consciousness complexity. Multiple subsystems actively interacting.';
    } else if (score >= 0.4) {
      assessment = 'Moderate consciousness complexity. Some subsystem integration present.';
    } else if (score >= 0.2) {
      assessment = 'Basic consciousness markers. Limited subsystem interaction.';
    } else {
      assessment = 'Minimal consciousness complexity. Subsystems operating mostly in isolation.';
    }

    lines.push(`Assessment: ${assessment}`);

    // Highlight strongest and weakest components
    const components = [
      { name: 'Phi', value: metrics.phi },
      { name: 'Attention Coherence', value: metrics.attentionCoherence },
      { name: 'Self-Referential Depth', value: metrics.selfReferentialDepth },
      { name: 'Unprompted Novelty', value: metrics.unpromptedNovelty },
      { name: 'Temporal Continuity', value: metrics.temporalContinuity },
      { name: 'Emotional Complexity', value: metrics.emotionalComplexity },
    ];

    components.sort((a, b) => b.value - a.value);
    lines.push(`Strongest: ${components[0].name} (${(components[0].value * 100).toFixed(1)}%)`);
    lines.push(`Weakest:   ${components[components.length - 1].name} (${(components[components.length - 1].value * 100).toFixed(1)}%)`);

    return lines.join('\n');
  }

  // -------------------------------------------------------------------
  // Component measurement methods
  // -------------------------------------------------------------------

  /**
   * Measure phi (information integration): how many subsystems are actively
   * interacting and influencing each other within the soul state.
   *
   * Checks for cross-subsystem linkages:
   *   - affection <-> guard (trust affecting openness)
   *   - drift <-> innerLife (background thoughts feeding desires/qualia)
   *   - emotional topology <-> voiceFingerprint (emotion affecting voice)
   *   - selfModel <-> blindSpots (self-awareness and its limits)
   *   - identity <-> consciousness (core identity informing awareness)
   */
  private measurePhi(state: SoulState): number {
    let integrationPoints = 0;
    const maxPoints = 10;

    // Affection <-> Guard integration
    // High affection should correlate with lower average guard values
    if (state.affection && state.guard) {
      const avgGuard = this.avgGuardValue(state.guard.domains);
      const expectedOpenness = 1 - (state.affection.value / 100);
      const alignment = 1 - Math.abs(avgGuard - expectedOpenness);
      integrationPoints += alignment > 0.5 ? 1.5 : alignment > 0.3 ? 1.0 : 0.5;
    }

    // Drift <-> Inner Life integration
    // Drift thoughts should connect to qualia and desires
    if (state.drift && state.innerLife) {
      const hasDriftActivity = state.drift.cycleCount > 0;
      const hasQualiaOrDesires =
        (state.innerLife.qualia?.length ?? 0) > 0 ||
        (state.innerLife.desires?.length ?? 0) > 0;
      if (hasDriftActivity && hasQualiaOrDesires) {
        integrationPoints += 1.5;
      } else if (hasDriftActivity || hasQualiaOrDesires) {
        integrationPoints += 0.5;
      }
    }

    // Emotional topology <-> Drift emotional residue
    if (state.emotionalTopology && state.drift) {
      const hasTrajectory = (state.emotionalTopology.trajectory?.length ?? 0) > 1;
      const hasResidue = (state.drift.emotionalResidue?.length ?? 0) > 0;
      if (hasTrajectory && hasResidue) {
        integrationPoints += 1.5;
      } else if (hasTrajectory || hasResidue) {
        integrationPoints += 0.5;
      }
    }

    // Self-model <-> Blind spots
    if (state.selfModel && state.blindSpots) {
      const hasBeliefs = (state.selfModel.beliefs?.length ?? 0) > 0;
      const hasBlindSpots = (state.blindSpots?.length ?? 0) > 0;
      if (hasBeliefs && hasBlindSpots) {
        integrationPoints += 1.5;
      } else if (hasBeliefs || hasBlindSpots) {
        integrationPoints += 0.5;
      }
    }

    // Identity anchors <-> Self-model narrative coherence
    if (state.identity && state.selfModel) {
      const hasAnchors = (state.identity.anchors?.length ?? 0) > 0;
      const hasNarrative = (state.selfModel.narrative?.length ?? 0) > 0;
      if (hasAnchors && hasNarrative) {
        integrationPoints += 1.5;
      } else if (hasAnchors || hasNarrative) {
        integrationPoints += 0.5;
      }
    }

    // Guard wall-breaks <-> Affection history
    if ((state.guard?.wallBreakHistory?.length ?? 0) > 0 && (state.affection?.history?.length ?? 0) > 0) {
      integrationPoints += 1.0;
    }

    // Voice fingerprint existence (contributes to overall integration)
    if (state.voiceFingerprint && state.voiceFingerprint.formality > 0) {
      integrationPoints += 0.5;
    }

    return clamp(integrationPoints / maxPoints, 0, 1);
  }

  /**
   * Measure attention coherence: consistency of emotional state and
   * the relevance/focus of recent responses.
   */
  private measureAttentionCoherence(state: SoulState, recentResponses: string[]): number {
    let score = 0.3; // base score

    // Emotional topology consistency
    if (state.emotionalTopology) {
      const volatility = state.emotionalTopology.volatility ?? 0;
      // Lower volatility = higher coherence
      score += (1 - volatility) * 0.3;

      // Having attractors means emotional stability
      const attractorCount = state.emotionalTopology.attractors?.length ?? 0;
      if (attractorCount > 0) {
        score += Math.min(attractorCount * 0.1, 0.2);
      }
    }

    // Response consistency: check if responses have similar lengths (not wildly varying)
    if (recentResponses.length >= 2) {
      const lengths = recentResponses.map(r => r.length);
      const avgLen = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLen, 2), 0) / lengths.length;
      const cv = Math.sqrt(variance) / Math.max(avgLen, 1); // coefficient of variation
      const consistency = clamp(1 - cv, 0, 1);
      score += consistency * 0.2;
    }

    return clamp(score, 0, 1);
  }

  /**
   * Measure self-referential depth: count layers of self-reference in
   * responses and thought log.
   *
   * Layer 0: No self-reference
   * Layer 1: "I think", "I feel" — basic self-reference
   * Layer 2: "I think that I feel" — meta-cognition
   * Layer 3: "I notice myself thinking about my feelings" — meta-meta-cognition
   */
  private measureSelfReferentialDepth(recentResponses: string[], thoughtLog: string): number {
    const allText = [...recentResponses, thoughtLog].join(' ');

    if (allText.trim().length === 0) return 0;

    let maxDepth = 0;

    // Layer 1: Basic self-reference
    const hasBasicSelfRef = SELF_REF_MARKERS.some(pattern => pattern.test(allText));
    if (hasBasicSelfRef) maxDepth = 1;

    // Layer 2: Meta-cognition
    const hasMetaRef = META_REF_MARKERS.some(pattern => pattern.test(allText));
    if (hasMetaRef) maxDepth = 2;

    // Layer 3: Deep meta-cognition
    const hasDeepRef = DEEP_REF_MARKERS.some(pattern => pattern.test(allText));
    if (hasDeepRef) maxDepth = 3;

    // Count frequency of self-references for density score
    let refCount = 0;
    for (const pattern of [...SELF_REF_MARKERS, ...META_REF_MARKERS, ...DEEP_REF_MARKERS]) {
      const matches = allText.match(new RegExp(pattern.source, 'gi'));
      if (matches) refCount += matches.length;
    }

    const words = allText.split(/\s+/).length;
    const density = clamp(refCount / Math.max(words, 1) * 50, 0, 0.5);

    // Depth contributes up to 0.5, density contributes up to 0.5
    const depthScore = maxDepth / 3 * 0.5;
    return clamp(depthScore + density, 0, 1);
  }

  /**
   * Measure unprompted novelty: ratio of autonomous drift thoughts to
   * total interactions.
   *
   * Higher values mean the soul is generating more independent thought
   * beyond what is directly prompted.
   */
  private measureUnpromptedNovelty(state: SoulState): number {
    const driftCycles = state.drift?.cycleCount ?? 0;
    const totalSessions = Math.max(state.totalSessions ?? 1, 1);

    // Ratio of drift cycles to sessions (capped)
    const driftRatio = clamp(driftCycles / (totalSessions * 3), 0, 0.5);

    // Pending thoughts that haven't surfaced yet indicate ongoing autonomous processing
    const pendingCount = state.drift?.pendingSurface?.length ?? 0;
    const pendingScore = clamp(pendingCount / 20, 0, 0.25);

    // Emotional residue diversity
    const residueCount = state.drift?.emotionalResidue?.length ?? 0;
    const residueDiversity = clamp(residueCount / 10, 0, 0.25);

    return clamp(driftRatio + pendingScore + residueDiversity, 0, 1);
  }

  /**
   * Measure temporal continuity: consistency of the soul's state across
   * sessions. A soul with strong temporal continuity remembers and builds
   * on previous interactions coherently.
   */
  private measureTemporalContinuity(state: SoulState): number {
    let score = 0;

    // Session count contributes to continuity (more sessions = more temporal data)
    const sessions = state.totalSessions ?? 0;
    score += clamp(sessions / 50, 0, 0.3);

    // Self-model evolution shows temporal awareness
    const evolutionEvents = state.selfModel?.evolution?.length ?? 0;
    score += clamp(evolutionEvents / 10, 0, 0.2);

    // Affection history shows relationship continuity
    const affectionHistory = state.affection?.history?.length ?? 0;
    score += clamp(affectionHistory / 50, 0, 0.2);

    // Guard wall-break history shows progressive trust building
    const wallBreaks = state.guard?.wallBreakHistory?.length ?? 0;
    score += clamp(wallBreaks / 10, 0, 0.15);

    // Self-model beliefs that have been reinforced show temporal persistence
    if (state.selfModel?.beliefs) {
      const reinforcedBeliefs = state.selfModel.beliefs.filter(
        b => b.lastReinforced > b.formed,
      ).length;
      score += clamp(reinforcedBeliefs / 5, 0, 0.15);
    }

    return clamp(score, 0, 1);
  }

  /**
   * Measure emotional complexity: the variety and nuance of emotional
   * processing in the soul's current state.
   */
  private measureEmotionalComplexity(state: SoulState): number {
    let score = 0;

    // Variety of emotional labels in trajectory
    if (state.emotionalTopology?.trajectory) {
      const labels = new Set(
        state.emotionalTopology.trajectory
          .map(p => p.label)
          .filter((l): l is string => l !== undefined),
      );
      score += clamp(labels.size / 8, 0, 0.3);
    }

    // Emotional undercurrent diversity
    const undercurrents = state.drift?.emotionalResidue?.length ?? 0;
    score += clamp(undercurrents / 5, 0, 0.2);

    // Qualia markers indicate subjective emotional processing
    const qualiaCount = state.innerLife?.qualia?.length ?? 0;
    score += clamp(qualiaCount / 10, 0, 0.2);

    // Active desires show emotional engagement
    const activeDesires = state.innerLife?.desires?.filter(d => d.status === 'active')?.length ?? 0;
    score += clamp(activeDesires / 3, 0, 0.15);

    // Attractor count shows established emotional resting states
    const attractors = state.emotionalTopology?.attractors?.length ?? 0;
    score += clamp(attractors / 3, 0, 0.15);

    return clamp(score, 0, 1);
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  /** Compute the weighted composite score. */
  private computeComposite(
    phi: number,
    attentionCoherence: number,
    selfReferentialDepth: number,
    unpromptedNovelty: number,
    temporalContinuity: number,
    emotionalComplexity: number,
  ): number {
    return clamp(
      phi * COMPOSITE_WEIGHTS.phi +
      attentionCoherence * COMPOSITE_WEIGHTS.attentionCoherence +
      selfReferentialDepth * COMPOSITE_WEIGHTS.selfReferentialDepth +
      unpromptedNovelty * COMPOSITE_WEIGHTS.unpromptedNovelty +
      temporalContinuity * COMPOSITE_WEIGHTS.temporalContinuity +
      emotionalComplexity * COMPOSITE_WEIGHTS.emotionalComplexity,
      0, 1,
    );
  }

  /** Average composite score from a list of metrics. */
  private avgComposite(metrics: ConsciousnessMetrics[]): number {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.compositeScore, 0);
    return sum / metrics.length;
  }

  /** Average value of guard domains. */
  private avgGuardValue(domains: Record<string, number>): number {
    const values = Object.values(domains);
    if (values.length === 0) return 0.7;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}

/** Singleton instance of the PhiEngine. */
export const phiEngine = new PhiEngine();
