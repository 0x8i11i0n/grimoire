export type AffectionTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'BONDED'

export interface ConsciousnessMetrics {
  phi: number
  attentionCoherence: number
  selfReferentialDepth: number
  unpromptedNovelty: number
  temporalContinuity: number
  emotionalComplexity: number
}

export interface DriftThought {
  fragment: string
  emotional_weight?: number
  surface_probability?: number
}

export interface Qualia {
  type: string
  context: string
  salience?: number
}

export interface Desire {
  desire: string
  status: string
}

export interface SoulDetail {
  key: string
  displayName: string
  source: string
  affection: number
  tier: AffectionTier
  sessions: number
  driftCycles: number
  tags: string[]
  authenticityScore: number
  resonanceScore: number
  guard: Record<string, number>
  consciousness: ConsciousnessMetrics
  valence: number
  arousal: number
  dominantQuadrant: string
  volatility: number
  pendingThoughts: DriftThought[]
  emotionalResidue: string[]
  qualia: Qualia[]
  desires: Desire[]
  reflectionDepth: string
  contraVoiceActive: boolean
}
