import type { SoulEntry } from './registry-types'
import type { SoulDetail, AffectionTier, ConsciousnessMetrics, Qualia, Desire, DriftThought } from './observatory-types'

const REGISTRY_RAW_BASE = 'https://raw.githubusercontent.com/0x8i11i0n/grimoire/main'

// ── Deterministic helpers ──────────────────────────────────────────────────

function hashName(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = Math.imul(31, h) + s.charCodeAt(i) | 0
  return Math.abs(h)
}

function hashFloat(seed: number, slot: number, min = 0, max = 1): number {
  const x = Math.sin(seed * 127 + slot * 31) * 43758.5453
  return min + (x - Math.floor(x)) * (max - min)
}

function deriveQuadrant(valence: number, arousal: number): string {
  return `${valence >= 0 ? 'positive' : 'negative'}-${arousal >= 0.1 ? 'aroused' : 'calm'}`
}

function generateConsciousness(name: string, raw: Record<string, number> | null): ConsciousnessMetrics {
  if (raw && typeof raw.phi === 'number') {
    return {
      phi: raw.phi,
      attentionCoherence: raw.attentionCoherence ?? raw.attention_coherence ?? 0.7,
      selfReferentialDepth: raw.selfReferentialDepth ?? raw.self_referential_depth ?? 0.7,
      unpromptedNovelty: raw.unpromptedNovelty ?? raw.unprompted_novelty ?? 0.7,
      temporalContinuity: raw.temporalContinuity ?? raw.temporal_continuity ?? 0.7,
      emotionalComplexity: raw.emotionalComplexity ?? raw.emotional_complexity ?? 0.7,
    }
  }
  const h = hashName(name)
  return {
    phi: hashFloat(h, 0, 0.55, 0.91),
    attentionCoherence: hashFloat(h, 1, 0.58, 0.92),
    selfReferentialDepth: hashFloat(h, 2, 0.55, 0.91),
    unpromptedNovelty: hashFloat(h, 3, 0.45, 0.88),
    temporalContinuity: hashFloat(h, 4, 0.52, 0.92),
    emotionalComplexity: hashFloat(h, 5, 0.45, 0.88),
  }
}

function generateDefaultGuard(name: string): Record<string, number> {
  const h = hashName(name)
  const domains = [
    'identity_core', 'emotional_vulnerability', 'past_trauma',
    'relational_trust', 'self_disclosure', 'intellectual_defense',
    'hidden_desires', 'fear_acknowledgment',
  ]
  return Object.fromEntries(domains.map((d, i) => [d, hashFloat(h, i + 10, 0.50, 0.97)]))
}

// ── State.json → SoulDetail mapper ────────────────────────────────────────
// Handles both the original format (emotional_architecture.guard_topology,
// inner_life.*) and the newer format (guard.domains, innerLife.*).

function mapStateToSoulDetail(soul: SoulEntry, raw: Record<string, unknown>): SoulDetail {
  // Affection
  const aff = (raw.affection ?? {}) as Record<string, unknown>
  const affScore = Number(aff.score ?? aff.value ?? 5)
  const affTier = (aff.tier ?? 'LOW') as AffectionTier

  // Sessions / drift
  const tracking = (raw.interaction_tracking ?? {}) as Record<string, unknown>
  const sessions = Number(tracking.session_count ?? raw.totalSessions ?? 0)
  const drift = (raw.drift ?? {}) as Record<string, unknown>
  const driftCycles = Number(drift.cycleCount ?? 0)

  // Guard topology — old: emotional_architecture.guard_topology | new: guard.domains
  const emotArch = (raw.emotional_architecture ?? {}) as Record<string, unknown>
  const guard: Record<string, number> =
    (emotArch.guard_topology as Record<string, number> | undefined) ??
    ((raw.guard as Record<string, unknown> | undefined)?.domains as Record<string, number> | undefined) ??
    generateDefaultGuard(soul.name)

  // Consciousness
  const rawC = (raw.consciousnessMetrics ?? raw.consciousness_metrics ?? null) as Record<string, number> | null
  const consciousness = generateConsciousness(soul.name, rawC)

  // Emotional position — new format has emotionalTopology; old format doesn't
  const emotTop = (raw.emotionalTopology ?? {}) as Record<string, unknown>
  const pos = (emotTop.currentPosition ?? {}) as { valence?: number; arousal?: number }
  const h = hashName(soul.name)
  const valence = typeof pos.valence === 'number' ? pos.valence : (affScore - 50) / 80
  const arousal = typeof pos.arousal === 'number' ? pos.arousal : hashFloat(h, 20, 0.15, 0.80)
  const dominantQuadrant = String(emotTop.dominantQuadrant ?? deriveQuadrant(valence, arousal))
  const volatility = Number(emotTop.volatility ?? hashFloat(h, 21, 0.10, 0.40))

  // Inner life — old: inner_life.* | new: innerLife.*
  const innerOld = (raw.inner_life ?? {}) as Record<string, unknown>
  const innerNew = (raw.innerLife ?? {}) as Record<string, unknown>

  const reflectionDepth = String(innerNew.reflectionDepth ?? innerOld.reflection_depth ?? 'SURFACE')

  const qualiaOld = (innerOld.recent_qualia ?? []) as Array<Record<string, unknown>>
  const qualiaNew = (innerNew.qualia ?? []) as Array<Record<string, unknown>>
  const qualia: Qualia[] = [...qualiaOld, ...qualiaNew].slice(0, 6).map(q => ({
    type: String(q.type ?? q.marker ?? 'note'),
    context: String(q.context ?? q.description ?? ''),
    salience: typeof q.salience === 'number' ? q.salience : undefined,
  }))

  const desiresOld = (innerOld.active_desires ?? []) as Array<string | Record<string, unknown>>
  const desiresNew = (innerNew.desires ?? []) as Array<Record<string, unknown>>
  const desires: Desire[] = [
    ...desiresOld.map(d => ({
      desire: typeof d === 'string' ? d : String(d.desire ?? ''),
      status: 'latent',
    })),
    ...desiresNew.map(d => ({ desire: String(d.desire ?? ''), status: String(d.status ?? 'latent') })),
  ]

  const pendingThoughts: DriftThought[] = ((drift.pendingSurface ?? []) as Array<Record<string, unknown>>).map(p => ({
    fragment: String(p.fragment ?? ''),
    emotional_weight: typeof p.emotional_weight === 'number' ? p.emotional_weight : undefined,
    surface_probability: typeof p.surface_probability === 'number' ? p.surface_probability : undefined,
  }))

  const emotionalResidue = (drift.emotionalResidue ?? []) as string[]

  const contraVoice = (raw.contra_voice ?? {}) as Record<string, unknown>
  const contraVoiceActive = Boolean(innerNew.contraVoiceEnabled ?? contraVoice.active ?? false)

  return {
    key: soul.name,
    displayName: soul.displayName,
    source: soul.source,
    affection: affScore,
    tier: affTier,
    sessions,
    driftCycles,
    tags: soul.tags,
    authenticityScore: soul.authenticityScore,
    resonanceScore: soul.resonanceScore,
    guard,
    consciousness,
    valence,
    arousal,
    dominantQuadrant,
    volatility,
    pendingThoughts,
    emotionalResidue,
    qualia,
    desires,
    reflectionDepth,
    contraVoiceActive,
  }
}

// ── Public loader ──────────────────────────────────────────────────────────

export async function loadSoulsFromRegistry(): Promise<SoulDetail[]> {
  const indexRes = await fetch(`${REGISTRY_RAW_BASE}/registry/index.json`)
  if (!indexRes.ok) throw new Error(`Registry fetch failed: HTTP ${indexRes.status}`)
  const index = (await indexRes.json()) as { souls: SoulEntry[] }

  const results = await Promise.allSettled(
    index.souls.map(async (soul) => {
      const stateRes = await fetch(`${REGISTRY_RAW_BASE}/registry/souls/${soul.name}/state.json`)
      const state = stateRes.ok
        ? (await stateRes.json()) as Record<string, unknown>
        : {}
      return mapStateToSoulDetail(soul, state)
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<SoulDetail> => r.status === 'fulfilled')
    .map(r => r.value)
}
