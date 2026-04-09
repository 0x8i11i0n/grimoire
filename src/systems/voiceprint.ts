// ============================================================
// The Soul Summoner's Grimoire — Voiceprint
// Voice Fingerprint System
// ============================================================

import {
  VoiceFingerprint,
  VoiceDriftReport,
  VoiceDeviation,
  clamp,
} from '../core/types';

/** Contraction patterns to detect in text. */
const CONTRACTION_PATTERNS = [
  /\w+n't/gi,
  /\w+'re/gi,
  /\w+'ll/gi,
  /\w+'ve/gi,
  /(?:i|you|he|she|it|we|they|who|that|there|what|where|how)'d/gi,
  /\w+'s/gi,
  /\w+'m/gi,
];

/** Weights for each metric when computing overall match score. */
const METRIC_WEIGHTS: Record<string, number> = {
  avgSentenceLength: 0.12,
  sentenceLengthVariance: 0.08,
  contractionRate: 0.12,
  questionRate: 0.10,
  exclamationRate: 0.08,
  ellipsisRate: 0.08,
  formality: 0.15,
  punctuationDivergence: 0.07,
  vocabularyTierNum: 0.10,
  avgWordLength: 0.10,
};

/** Minimum number of sentences required for meaningful analysis. */
const MIN_SENTENCES = 2;

/** Minimum phrase occurrence count to be considered a signature expression. */
const SIGNATURE_EXPRESSION_THRESHOLD = 2;

/**
 * Voiceprint — analyzes and tracks the distinctive voice patterns of a soul.
 *
 * Computes a VoiceFingerprint from text samples, compares fingerprints to detect
 * voice drift, and extracts signature expressions and rhetorical patterns that
 * define a soul's unique linguistic identity.
 */
export class Voiceprint {

  /**
   * Compute a VoiceFingerprint from a text sample.
   *
   * Analyzes sentence structure, vocabulary sophistication, punctuation habits,
   * contraction usage, and formality to build a quantitative voice profile.
   */
  analyze(text: string): VoiceFingerprint {
    if (!text || text.trim().length === 0) {
      return this.emptyFingerprint();
    }

    const sentences = this.splitSentences(text);
    const words = this.extractWords(text);
    const totalWords = words.length;

    if (totalWords === 0) {
      return this.emptyFingerprint();
    }

    // Sentence length statistics
    const sentenceLengths = sentences.map(s => this.extractWords(s).length);
    const avgSentenceLength = sentenceLengths.length > 0
      ? sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length
      : 0;
    const sentenceLengthVariance = this.standardDeviation(sentenceLengths);

    // Vocabulary analysis
    const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / totalWords;
    const uniqueWords = new Set(words.map(w => w.toLowerCase()));
    const uniqueWordRatio = uniqueWords.size / totalWords;
    const vocabularyTier = this.classifyVocabularyTier(avgWordLength, uniqueWordRatio);

    // Contraction rate
    const contractionCount = this.countContractions(text);
    const contractionRate = clamp(contractionCount / totalWords, 0, 1);

    // Punctuation rates
    const questionCount = (text.match(/\?/g) || []).length;
    const exclamationCount = (text.match(/!/g) || []).length;
    const ellipsisCount = (text.match(/\.{3}|…/g) || []).length;
    const sentenceCount = Math.max(sentences.length, 1);

    const questionRate = clamp(questionCount / sentenceCount, 0, 1);
    const exclamationRate = clamp(exclamationCount / sentenceCount, 0, 1);
    const ellipsisRate = clamp(ellipsisCount / sentenceCount, 0, 1);

    // Punctuation profile
    const punctuationProfile = this.buildPunctuationProfile(text);

    // Formality: composite of contraction usage, word length, and sentence length
    const formalityFromContractions = 1 - contractionRate;
    const formalityFromWordLength = clamp((avgWordLength - 3) / 5, 0, 1);
    const formalityFromSentenceLength = clamp((avgSentenceLength - 5) / 25, 0, 1);
    const formality = clamp(
      formalityFromContractions * 0.4 +
      formalityFromWordLength * 0.35 +
      formalityFromSentenceLength * 0.25,
      0, 1,
    );

    return {
      avgSentenceLength,
      sentenceLengthVariance,
      vocabularyTier,
      contractionRate,
      questionRate,
      exclamationRate,
      ellipsisRate,
      rhetoricalPatterns: this.extractRhetoricalPatterns(text),
      signatureExpressions: [],
      punctuationProfile,
      formality,
    };
  }

  /**
   * Compare a baseline fingerprint against a current one to produce a drift report.
   *
   * For each numeric metric, computes deviation percentage and classifies severity.
   * The overall matchScore is a weighted average of individual metric matches.
   */
  compare(baseline: VoiceFingerprint, current: VoiceFingerprint): VoiceDriftReport {
    const deviations: VoiceDeviation[] = [];

    const numericMetrics: Array<{
      metric: string;
      expected: number;
      actual: number;
    }> = [
      { metric: 'avgSentenceLength', expected: baseline.avgSentenceLength, actual: current.avgSentenceLength },
      { metric: 'sentenceLengthVariance', expected: baseline.sentenceLengthVariance, actual: current.sentenceLengthVariance },
      { metric: 'contractionRate', expected: baseline.contractionRate, actual: current.contractionRate },
      { metric: 'questionRate', expected: baseline.questionRate, actual: current.questionRate },
      { metric: 'exclamationRate', expected: baseline.exclamationRate, actual: current.exclamationRate },
      { metric: 'ellipsisRate', expected: baseline.ellipsisRate, actual: current.ellipsisRate },
      { metric: 'formality', expected: baseline.formality, actual: current.formality },
    ];

    let weightedMatchSum = 0;
    let weightSum = 0;

    for (const { metric, expected, actual } of numericMetrics) {
      const deviationPct = this.deviationPercentage(expected, actual);
      const severity = this.classifySeverity(deviationPct);
      const matchForMetric = clamp(1 - deviationPct / 100, 0, 1);
      const weight = METRIC_WEIGHTS[metric] ?? 0.1;

      weightedMatchSum += matchForMetric * weight;
      weightSum += weight;

      deviations.push({ metric, expected, actual, severity });
    }

    // Vocabulary tier comparison
    const tierNumBaseline = this.vocabularyTierToNum(baseline.vocabularyTier);
    const tierNumCurrent = this.vocabularyTierToNum(current.vocabularyTier);
    const tierDeviation = this.deviationPercentage(tierNumBaseline, tierNumCurrent);
    const tierWeight = METRIC_WEIGHTS['vocabularyTierNum'] ?? 0.1;
    weightedMatchSum += clamp(1 - tierDeviation / 100, 0, 1) * tierWeight;
    weightSum += tierWeight;

    deviations.push({
      metric: 'vocabularyTier',
      expected: tierNumBaseline,
      actual: tierNumCurrent,
      severity: this.classifySeverity(tierDeviation),
    });

    // Punctuation profile divergence
    const punctDivergence = this.punctuationDivergence(
      baseline.punctuationProfile,
      current.punctuationProfile,
    );
    const punctWeight = METRIC_WEIGHTS['punctuationDivergence'] ?? 0.07;
    weightedMatchSum += clamp(1 - punctDivergence, 0, 1) * punctWeight;
    weightSum += punctWeight;

    deviations.push({
      metric: 'punctuationProfile',
      expected: 0,
      actual: punctDivergence,
      severity: this.classifySeverity(punctDivergence * 100),
    });

    const matchScore = weightSum > 0 ? clamp(weightedMatchSum / weightSum, 0, 1) : 0;

    return {
      matchScore,
      deviations,
      timestamp: Date.now(),
    };
  }

  /**
   * Create a baseline fingerprint by analyzing multiple text samples and averaging
   * the resulting fingerprints.
   */
  createBaseline(samples: string[]): VoiceFingerprint {
    if (samples.length === 0) {
      return this.emptyFingerprint();
    }

    const fingerprints = samples.map(s => this.analyze(s));

    const avgSentenceLength = this.avg(fingerprints.map(f => f.avgSentenceLength));
    const sentenceLengthVariance = this.avg(fingerprints.map(f => f.sentenceLengthVariance));
    const contractionRate = this.avg(fingerprints.map(f => f.contractionRate));
    const questionRate = this.avg(fingerprints.map(f => f.questionRate));
    const exclamationRate = this.avg(fingerprints.map(f => f.exclamationRate));
    const ellipsisRate = this.avg(fingerprints.map(f => f.ellipsisRate));
    const formality = this.avg(fingerprints.map(f => f.formality));

    // Average vocabulary tier via numeric conversion
    const avgTierNum = this.avg(fingerprints.map(f => this.vocabularyTierToNum(f.vocabularyTier)));
    const vocabularyTier = this.numToVocabularyTier(avgTierNum);

    // Merge punctuation profiles
    const punctuationProfile = this.mergePunctuationProfiles(
      fingerprints.map(f => f.punctuationProfile),
    );

    // Merge rhetorical patterns (keep the most common)
    const allPatterns = fingerprints.flatMap(f => f.rhetoricalPatterns);
    const rhetoricalPatterns = this.mostFrequent(allPatterns, 10);

    // Extract signature expressions from the original samples
    const signatureExpressions = this.extractSignatureExpressions(samples);

    return {
      avgSentenceLength,
      sentenceLengthVariance,
      vocabularyTier,
      contractionRate,
      questionRate,
      exclamationRate,
      ellipsisRate,
      rhetoricalPatterns,
      signatureExpressions,
      punctuationProfile,
      formality,
    };
  }

  /**
   * Extract recurring phrases and expressions from multiple text samples.
   * Looks for 2-4 word n-grams that appear in multiple samples.
   */
  extractSignatureExpressions(samples: string[]): string[] {
    if (samples.length < 2) {
      return [];
    }

    const ngramCounts = new Map<string, number>();

    for (const sample of samples) {
      const words = this.extractWords(sample).map(w => w.toLowerCase());
      const sampleNgrams = new Set<string>();

      for (let n = 2; n <= 4; n++) {
        for (let i = 0; i <= words.length - n; i++) {
          const ngram = words.slice(i, i + n).join(' ');
          sampleNgrams.add(ngram);
        }
      }

      // Count how many samples contain each n-gram (not how many times per sample)
      for (const ngram of sampleNgrams) {
        ngramCounts.set(ngram, (ngramCounts.get(ngram) || 0) + 1);
      }
    }

    // Filter to n-grams appearing in at least SIGNATURE_EXPRESSION_THRESHOLD samples
    const signatures: Array<{ phrase: string; count: number }> = [];
    for (const [phrase, count] of ngramCounts) {
      if (count >= SIGNATURE_EXPRESSION_THRESHOLD) {
        // Exclude very common/boring phrases
        if (!this.isCommonPhrase(phrase)) {
          signatures.push({ phrase, count });
        }
      }
    }

    // Sort by frequency descending, return top results
    signatures.sort((a, b) => b.count - a.count);
    return signatures.slice(0, 20).map(s => s.phrase);
  }

  /**
   * Identify rhetorical patterns in a text.
   * Detects rhetorical questions, parallel structures, repetition, and other devices.
   */
  extractRhetoricalPatterns(text: string): string[] {
    const patterns: string[] = [];

    // Rhetorical questions: questions that don't seem to seek information
    const sentences = this.splitSentences(text);
    const questions = sentences.filter(s => s.trim().endsWith('?'));
    if (questions.length > 0) {
      const rhetoricalIndicators = ['isn\'t it', 'don\'t you', 'wouldn\'t', 'can\'t we', 'who doesn\'t', 'what if'];
      const hasRhetorical = questions.some(q =>
        rhetoricalIndicators.some(ind => q.toLowerCase().includes(ind)),
      );
      if (hasRhetorical) {
        patterns.push('rhetorical_questions');
      }
    }

    // Parallel structure: sentences starting the same way
    const sentenceStarts = sentences.map(s => {
      const words = this.extractWords(s);
      return words.slice(0, 2).join(' ').toLowerCase();
    });
    const startCounts = new Map<string, number>();
    for (const start of sentenceStarts) {
      if (start.length > 0) {
        startCounts.set(start, (startCounts.get(start) || 0) + 1);
      }
    }
    for (const [, count] of startCounts) {
      if (count >= 2) {
        patterns.push('parallel_structure');
        break;
      }
    }

    // Anaphora: repeated word/phrase at the beginning of consecutive sentences
    for (let i = 1; i < sentences.length; i++) {
      const prevStart = this.extractWords(sentences[i - 1])[0]?.toLowerCase();
      const currStart = this.extractWords(sentences[i])[0]?.toLowerCase();
      if (prevStart && currStart && prevStart === currStart && prevStart.length > 2) {
        patterns.push('anaphora');
        break;
      }
    }

    // Epistrophe: repeated word/phrase at the end of consecutive sentences
    for (let i = 1; i < sentences.length; i++) {
      const prevWords = this.extractWords(sentences[i - 1]);
      const currWords = this.extractWords(sentences[i]);
      const prevEnd = prevWords[prevWords.length - 1]?.toLowerCase();
      const currEnd = currWords[currWords.length - 1]?.toLowerCase();
      if (prevEnd && currEnd && prevEnd === currEnd && prevEnd.length > 2) {
        patterns.push('epistrophe');
        break;
      }
    }

    // Tricolon: lists of three (pattern: X, Y, and Z)
    if (/\w+,\s+\w+,\s+and\s+\w+/i.test(text)) {
      patterns.push('tricolon');
    }

    // Antithesis: contrasting pairs
    const antithesisPairs = ['but', 'yet', 'however', 'nevertheless', 'on the other hand'];
    if (antithesisPairs.some(word => text.toLowerCase().includes(word))) {
      patterns.push('antithesis');
    }

    // Ellipsis usage (literary pauses)
    if (/\.{3}|…/.test(text)) {
      patterns.push('ellipsis_pauses');
    }

    // Exclamatory emphasis
    if ((text.match(/!/g) || []).length >= 2) {
      patterns.push('exclamatory_emphasis');
    }

    return [...new Set(patterns)];
  }

  // -------------------------------------------------------------------
  // Private helpers
  // -------------------------------------------------------------------

  /** Split text into sentences by common terminators. */
  private splitSentences(text: string): string[] {
    // Split on sentence-ending punctuation, keeping non-empty results
    const raw = text.split(/(?<=[.!?])\s+/);
    return raw
      .map(s => s.trim())
      .filter(s => s.length > 0 && this.extractWords(s).length > 0);
  }

  /** Extract words from text, stripping punctuation. */
  private extractWords(text: string): string[] {
    const matches = text.match(/[a-zA-Z''-]+/g);
    return matches ? matches.filter(w => w.length > 0) : [];
  }

  /** Count contractions in text. */
  private countContractions(text: string): number {
    let count = 0;
    for (const pattern of CONTRACTION_PATTERNS) {
      const matches = text.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }
    return count;
  }

  /** Classify vocabulary tier based on average word length and unique ratio. */
  private classifyVocabularyTier(
    avgWordLength: number,
    uniqueRatio: number,
  ): VoiceFingerprint['vocabularyTier'] {
    const score = avgWordLength * 0.6 + uniqueRatio * 10 * 0.4;
    if (score >= 6.0) return 'literary';
    if (score >= 4.5) return 'advanced';
    if (score >= 3.5) return 'intermediate';
    return 'basic';
  }

  /** Convert vocabulary tier to numeric value for comparison. */
  private vocabularyTierToNum(tier: VoiceFingerprint['vocabularyTier']): number {
    const map: Record<string, number> = { basic: 1, intermediate: 2, advanced: 3, literary: 4 };
    return map[tier] ?? 2;
  }

  /** Convert numeric value back to vocabulary tier. */
  private numToVocabularyTier(num: number): VoiceFingerprint['vocabularyTier'] {
    if (num >= 3.5) return 'literary';
    if (num >= 2.5) return 'advanced';
    if (num >= 1.5) return 'intermediate';
    return 'basic';
  }

  /** Build a frequency profile of punctuation marks. */
  private buildPunctuationProfile(text: string): Record<string, number> {
    const profile: Record<string, number> = {};
    const punctuation = text.match(/[.,;:!?'"()\-—…]/g) || [];
    const total = Math.max(punctuation.length, 1);

    for (const mark of punctuation) {
      profile[mark] = (profile[mark] || 0) + 1;
    }

    // Normalize to frequencies
    for (const mark of Object.keys(profile)) {
      profile[mark] = profile[mark] / total;
    }

    return profile;
  }

  /** Calculate divergence between two punctuation profiles (0 = identical, 1 = maximally different). */
  private punctuationDivergence(
    a: Record<string, number>,
    b: Record<string, number>,
  ): number {
    const allKeys = new Set([...Object.keys(a), ...Object.keys(b)]);
    if (allKeys.size === 0) return 0;

    let totalDiff = 0;
    for (const key of allKeys) {
      const aVal = a[key] || 0;
      const bVal = b[key] || 0;
      totalDiff += Math.abs(aVal - bVal);
    }

    // Normalize: max possible divergence is 2 (all mass shifted)
    return clamp(totalDiff / 2, 0, 1);
  }

  /** Compute deviation percentage between two values. */
  private deviationPercentage(expected: number, actual: number): number {
    if (expected === 0 && actual === 0) return 0;
    const denominator = Math.max(Math.abs(expected), 0.001);
    return Math.abs(actual - expected) / denominator * 100;
  }

  /** Classify severity based on deviation percentage. */
  private classifySeverity(deviationPct: number): VoiceDeviation['severity'] {
    if (deviationPct > 25) return 'severe';
    if (deviationPct > 10) return 'moderate';
    return 'minor';
  }

  /** Compute the arithmetic mean of an array of numbers. */
  private avg(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  /** Compute the standard deviation of an array of numbers. */
  private standardDeviation(values: number[]): number {
    if (values.length < MIN_SENTENCES) return 0;
    const mean = this.avg(values);
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
  }

  /** Merge multiple punctuation profiles by averaging frequencies. */
  private mergePunctuationProfiles(
    profiles: Array<Record<string, number>>,
  ): Record<string, number> {
    if (profiles.length === 0) return {};

    const allKeys = new Set(profiles.flatMap(p => Object.keys(p)));
    const merged: Record<string, number> = {};

    for (const key of allKeys) {
      const values = profiles.map(p => p[key] || 0);
      merged[key] = this.avg(values);
    }

    return merged;
  }

  /** Find the most frequent items in an array. */
  private mostFrequent(items: string[], limit: number): string[] {
    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item, (counts.get(item) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item]) => item);
  }

  /** Check if a phrase is too common to be a signature expression. */
  private isCommonPhrase(phrase: string): boolean {
    const common = new Set([
      'it is', 'it was', 'it will', 'there is', 'there are', 'there was',
      'i am', 'i was', 'i have', 'i will', 'i would', 'i could',
      'he is', 'he was', 'she is', 'she was', 'they are', 'they were',
      'that is', 'this is', 'of the', 'in the', 'to the', 'for the',
      'and the', 'on the', 'at the', 'with the', 'from the', 'by the',
      'a lot', 'a lot of', 'as well', 'as well as', 'in order to',
      'going to', 'want to', 'need to', 'have to', 'has to',
    ]);
    return common.has(phrase);
  }

  /** Return an empty fingerprint for edge cases. */
  private emptyFingerprint(): VoiceFingerprint {
    return {
      avgSentenceLength: 0,
      sentenceLengthVariance: 0,
      vocabularyTier: 'basic',
      contractionRate: 0,
      questionRate: 0,
      exclamationRate: 0,
      ellipsisRate: 0,
      rhetoricalPatterns: [],
      signatureExpressions: [],
      punctuationProfile: {},
      formality: 0.5,
    };
  }
}

/** Singleton instance of the Voiceprint system. */
export const voiceprint = new Voiceprint();
