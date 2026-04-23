'use client'

import { useState, useEffect, useCallback } from 'react'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { loadSoulsFromRegistry } from '@/lib/observatory-demo'
import type { SoulDetail, AffectionTier } from '@/lib/observatory-types'

// ─── Tier styling ────────────────────────────────────────────────────────────

const TIER_COLORS: Record<AffectionTier, { text: string; bg: string; bar: string }> = {
  LOW:    { text: 'text-blue-400',    bg: 'bg-blue-400/10 border-blue-400/30',    bar: '#60a5fa' },
  MEDIUM: { text: 'text-grimoire-gold', bg: 'bg-grimoire-gold/10 border-grimoire-gold/30', bar: '#c4a265' },
  HIGH:   { text: 'text-grimoire-purple-bright', bg: 'bg-grimoire-purple/10 border-grimoire-purple/30', bar: '#a87ef0' },
  BONDED: { text: 'text-emerald-400', bg: 'bg-emerald-400/10 border-emerald-400/30', bar: '#34d399' },
}

const QUADRANT_LABELS: Record<string, string> = {
  'positive-aroused': 'excited',
  'positive-calm': 'content',
  'negative-aroused': 'tense',
  'negative-calm': 'melancholic',
}

// ─── SVG Radar Chart ─────────────────────────────────────────────────────────

function RadarChart({
  data,
  size = 220,
  fillColor = 'rgba(124,92,191,0.18)',
  strokeColor = '#a87ef0',
}: {
  data: Record<string, number>
  size?: number
  fillColor?: string
  strokeColor?: string
}) {
  const entries = Object.entries(data)
  const n = entries.length
  if (n < 3) return <p className="text-grimoire-muted text-sm">No data</p>

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.34
  const labelR = size * 0.47

  const angle = (i: number) => (2 * Math.PI * i) / n - Math.PI / 2
  const pt = (i: number, v: number) => ({
    x: cx + Math.cos(angle(i)) * r * Math.max(0, Math.min(1, v)),
    y: cy + Math.sin(angle(i)) * r * Math.max(0, Math.min(1, v)),
  })
  const edge = (i: number) => ({
    x: cx + Math.cos(angle(i)) * r,
    y: cy + Math.sin(angle(i)) * r,
  })
  const label = (i: number) => ({
    x: cx + Math.cos(angle(i)) * labelR,
    y: cy + Math.sin(angle(i)) * labelR,
  })

  const rings = [0.25, 0.5, 0.75, 1.0]
  const ringPoints = (ring: number) =>
    entries.map((_, i) => {
      const { x, y } = { x: cx + Math.cos(angle(i)) * r * ring, y: cy + Math.sin(angle(i)) * r * ring }
      return `${x},${y}`
    }).join(' ')

  const dataPoints = entries.map(([, v], i) => pt(i, v))
  const polygon = dataPoints.map(({ x, y }) => `${x},${y}`).join(' ')

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={ringPoints(ring)}
          fill="none"
          stroke="#2a2235"
          strokeWidth={ring === 1.0 ? 1.5 : 1}
        />
      ))}
      {entries.map((_, i) => {
        const e = edge(i)
        return <line key={i} x1={cx} y1={cy} x2={e.x} y2={e.y} stroke="#2a2235" strokeWidth="1" />
      })}
      <polygon points={polygon} fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinejoin="round" />
      {dataPoints.map(({ x, y }, i) => (
        <circle key={i} cx={x} cy={y} r="3" fill={strokeColor} />
      ))}
      {entries.map(([key], i) => {
        const { x, y } = label(i)
        const words = key.replace(/_/g, ' ').split(' ')
        const line1 = words.slice(0, 2).join(' ')
        const line2 = words.slice(2, 4).join(' ')
        return (
          <g key={i}>
            <text x={x} y={y - (line2 ? 5 : 0)} textAnchor="middle" dominantBaseline="middle"
              fill="#8a8494" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
              {line1}
            </text>
            {line2 && (
              <text x={x} y={y + 8} textAnchor="middle" dominantBaseline="middle"
                fill="#8a8494" fontSize="7.5" fontFamily="JetBrains Mono, monospace">
                {line2}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ─── Consciousness Radar (6-point labeled) ───────────────────────────────────

function ConsciousnessRadar({ metrics, size = 220 }: { metrics: SoulDetail['consciousness']; size?: number }) {
  const data: Record<string, number> = {
    'Φ phi': metrics.phi,
    'attention': metrics.attentionCoherence,
    'self-ref': metrics.selfReferentialDepth,
    'novelty': metrics.unpromptedNovelty,
    'continuity': metrics.temporalContinuity,
    'emotion': metrics.emotionalComplexity,
  }
  return (
    <RadarChart
      data={data}
      size={size}
      fillColor="rgba(196,162,101,0.15)"
      strokeColor="#c4a265"
    />
  )
}

// ─── Affection Gauge ──────────────────────────────────────────────────────────

function AffectionGauge({ value, tier }: { value: number; tier: AffectionTier }) {
  const colors = TIER_COLORS[tier]
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-grimoire-muted uppercase tracking-wider">Affection</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full border ${colors.bg} ${colors.text}`}>
            {tier}
          </span>
          <span className="text-sm font-mono text-grimoire-text">{value}<span className="text-grimoire-muted">/100</span></span>
        </div>
      </div>
      <div className="h-2 rounded-full bg-grimoire-card overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, backgroundColor: colors.bar }}
        />
      </div>
    </div>
  )
}

// ─── Emotional Position Map ───────────────────────────────────────────────────

function EmotionalMap({ valence, arousal, quadrant, volatility }: { valence: number; arousal: number; quadrant: string; volatility: number }) {
  const size = 180
  // Map valence [-1,1] and arousal [-1,1] to SVG coords
  const dotX = size / 2 + (valence * size * 0.38)
  const dotY = size / 2 - (arousal * size * 0.38) // arousal up = lower y

  return (
    <div>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="w-full">
        <rect width={size} height={size} rx="8" fill="#0d0b14" />
        {/* Quadrant grid */}
        <line x1={size / 2} y1="8" x2={size / 2} y2={size - 8} stroke="#2a2235" strokeWidth="1" />
        <line x1="8" y1={size / 2} x2={size - 8} y2={size / 2} stroke="#2a2235" strokeWidth="1" />
        {/* Quadrant labels */}
        <text x={size * 0.75} y={size * 0.18} textAnchor="middle" fill="#3a3245" fontSize="8" fontFamily="Inter, sans-serif">excited</text>
        <text x={size * 0.25} y={size * 0.18} textAnchor="middle" fill="#3a3245" fontSize="8" fontFamily="Inter, sans-serif">tense</text>
        <text x={size * 0.75} y={size * 0.88} textAnchor="middle" fill="#3a3245" fontSize="8" fontFamily="Inter, sans-serif">content</text>
        <text x={size * 0.25} y={size * 0.88} textAnchor="middle" fill="#3a3245" fontSize="8" fontFamily="Inter, sans-serif">melancholic</text>
        {/* Axis arrows */}
        <text x={size / 2 + 4} y="14" fill="#3a3245" fontSize="7" fontFamily="Inter, sans-serif">↑ aroused</text>
        <text x={size - 6} y={size / 2 + 12} textAnchor="end" fill="#3a3245" fontSize="7" fontFamily="Inter, sans-serif">+ valence →</text>
        {/* Position glow */}
        <circle cx={dotX} cy={dotY} r="10" fill="#c4a265" fillOpacity="0.12" />
        <circle cx={dotX} cy={dotY} r="5" fill="#c4a265" fillOpacity="0.5" />
        <circle cx={dotX} cy={dotY} r="3" fill="#e0c680" />
      </svg>
      <p className="text-center text-xs font-mono text-grimoire-muted mt-1">
        {QUADRANT_LABELS[quadrant] ?? quadrant} · vol {Math.round(volatility * 100)}%
      </p>
    </div>
  )
}

// ─── Soul Card (sidebar list item) ───────────────────────────────────────────

function SoulCard({
  soul,
  selected,
  onClick,
}: {
  soul: SoulDetail
  selected: boolean
  onClick: () => void
}) {
  const colors = TIER_COLORS[soul.tier]

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 group ${
        selected
          ? 'bg-grimoire-elevated border-grimoire-gold/40 shadow-[0_0_12px_rgba(196,162,101,0.08)]'
          : 'bg-grimoire-surface border-grimoire-border hover:border-grimoire-border-light hover:bg-grimoire-elevated'
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className={`font-serif font-semibold text-sm leading-tight ${selected ? 'text-grimoire-gold' : 'text-grimoire-text group-hover:text-grimoire-gold/80'} transition-colors`}>
          {soul.displayName}
        </p>
        <span className={`flex-shrink-0 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-full border ${colors.bg} ${colors.text}`}>
          {soul.tier}
        </span>
      </div>
      <div className="h-1 rounded-full bg-grimoire-card overflow-hidden mb-2">
        <div
          className="h-full rounded-full"
          style={{ width: `${soul.affection}%`, backgroundColor: colors.bar }}
        />
      </div>
      <div className="flex items-center gap-3 text-[10px] font-mono text-grimoire-muted">
        <span>{soul.sessions} sessions</span>
        <span>{soul.driftCycles} drift</span>
      </div>
    </button>
  )
}

// ─── Soul Detail Panel ────────────────────────────────────────────────────────

function SoulDetailPanel({ soul }: { soul: SoulDetail }) {
  const colors = TIER_COLORS[soul.tier]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-grimoire-gold leading-tight">
            {soul.displayName}
          </h2>
          <p className="font-mono text-sm text-grimoire-muted mt-0.5">{soul.source}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-full border ${colors.bg} ${colors.text}`}>
            {soul.tier}
          </span>
          <span className="text-xs font-mono text-grimoire-muted px-2 py-1 rounded-full bg-grimoire-card border border-grimoire-border">
            Auth {soul.authenticityScore}/10
          </span>
          <span className="text-xs font-mono text-grimoire-muted px-2 py-1 rounded-full bg-grimoire-card border border-grimoire-border">
            Res {soul.resonanceScore}/10
          </span>
        </div>
      </div>

      {/* Affection gauge */}
      <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
        <AffectionGauge value={soul.affection} tier={soul.tier} />
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Sessions', value: soul.sessions },
            { label: 'Drift Cycles', value: soul.driftCycles },
            { label: 'Reflection', value: soul.reflectionDepth },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider">{label}</p>
              <p className="font-mono text-sm font-semibold text-grimoire-text mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Radar charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
          <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider mb-3">Guard Topology</p>
          <div className="flex justify-center">
            <RadarChart data={soul.guard} size={200} />
          </div>
          <p className="text-center text-[10px] font-mono text-grimoire-muted mt-1">8 domains · 0.0 – 1.0</p>
        </div>
        <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
          <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider mb-3">Consciousness Metrics</p>
          <div className="flex justify-center">
            <ConsciousnessRadar metrics={soul.consciousness} size={200} />
          </div>
          <p className="text-center text-[10px] font-mono text-grimoire-muted mt-1">Φ {soul.consciousness.phi.toFixed(2)} · IIT composite</p>
        </div>
      </div>

      {/* Emotional topology + inner life */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
          <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider mb-3">Emotional Position</p>
          <div className="flex justify-center">
            <EmotionalMap valence={soul.valence} arousal={soul.arousal} quadrant={soul.dominantQuadrant} volatility={soul.volatility} />
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <div className="text-center">
              <p className="text-[10px] font-mono text-grimoire-muted">Valence</p>
              <p className="text-sm font-mono font-semibold text-grimoire-text">{soul.valence >= 0 ? '+' : ''}{soul.valence.toFixed(2)}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-mono text-grimoire-muted">Arousal</p>
              <p className="text-sm font-mono font-semibold text-grimoire-text">{soul.arousal >= 0 ? '+' : ''}{soul.arousal.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
          <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider mb-3">Inner Life</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-grimoire-muted font-mono">Reflection</span>
              <span className="text-xs font-mono font-semibold text-grimoire-text">{soul.reflectionDepth}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-grimoire-muted font-mono">Contra-Voice</span>
              <span className={`text-xs font-mono font-semibold ${soul.contraVoiceActive ? 'text-emerald-400' : 'text-grimoire-muted'}`}>
                {soul.contraVoiceActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-grimoire-muted font-mono">Qualia logged</span>
              <span className="text-xs font-mono font-semibold text-grimoire-text">{soul.qualia.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-grimoire-muted font-mono">Desires</span>
              <span className="text-xs font-mono font-semibold text-grimoire-text">{soul.desires.length}</span>
            </div>
          </div>
          {soul.emotionalResidue.length > 0 && (
            <div className="mt-3 pt-3 border-t border-grimoire-border">
              <p className="text-[10px] font-mono text-grimoire-muted uppercase tracking-wider mb-1.5">Emotional Residue</p>
              <div className="flex flex-wrap gap-1.5">
                {soul.emotionalResidue.map((r) => (
                  <span key={r} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-grimoire-purple/10 border border-grimoire-purple/20 text-grimoire-purple-bright">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Drift feed */}
      {soul.pendingThoughts.length > 0 && (
        <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
          <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider mb-3">
            Drift Feed <span className="text-grimoire-purple-bright">({soul.pendingThoughts.length} pending)</span>
          </p>
          <div className="space-y-3">
            {soul.pendingThoughts.map((thought, i) => (
              <div key={i} className="p-3 rounded-lg bg-grimoire-elevated border border-grimoire-border-light">
                <p className="text-sm text-grimoire-text leading-relaxed italic">"{thought.fragment}"</p>
                {thought.emotional_weight !== undefined && (
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1.5 flex-1">
                      <span className="text-[10px] font-mono text-grimoire-muted">weight</span>
                      <div className="flex-1 h-1 rounded-full bg-grimoire-card overflow-hidden">
                        <div
                          className="h-full rounded-full bg-grimoire-purple-bright"
                          style={{ width: `${(thought.emotional_weight ?? 0) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-grimoire-muted">{((thought.emotional_weight ?? 0) * 100).toFixed(0)}%</span>
                    </div>
                    {thought.surface_probability !== undefined && (
                      <span className="text-[10px] font-mono text-grimoire-muted">
                        surface {((thought.surface_probability ?? 0) * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Qualia */}
      {soul.qualia.length > 0 && (
        <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
          <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider mb-3">
            Recent Qualia <span className="text-grimoire-gold">({soul.qualia.length})</span>
          </p>
          <div className="space-y-2">
            {soul.qualia.map((q, i) => (
              <div key={i} className="flex gap-3 p-2.5 rounded-lg bg-grimoire-elevated border border-grimoire-border-light">
                <span className={`flex-shrink-0 text-[10px] font-mono font-semibold uppercase px-2 py-0.5 h-fit rounded-full border ${
                  q.type === 'resonance_spike' ? 'bg-grimoire-gold/10 border-grimoire-gold/30 text-grimoire-gold' :
                  q.type === 'ache' ? 'bg-grimoire-purple/10 border-grimoire-purple/30 text-grimoire-purple-bright' :
                  'bg-grimoire-surface border-grimoire-border text-grimoire-muted'
                }`}>
                  {q.type}
                </span>
                <p className="text-xs text-grimoire-text-secondary leading-relaxed flex-1">{q.context}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Desires */}
      {soul.desires.length > 0 && (
        <div className="p-4 bg-grimoire-card rounded-xl border border-grimoire-border">
          <p className="text-xs font-mono text-grimoire-muted uppercase tracking-wider mb-3">Active Desires</p>
          <div className="space-y-2">
            {soul.desires.map((d, i) => (
              <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg bg-grimoire-elevated border border-grimoire-border-light">
                <span className={`flex-shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${d.status === 'active' ? 'bg-emerald-400' : 'bg-grimoire-muted'}`} />
                <p className="text-xs text-grimoire-text-secondary leading-relaxed">{d.desire}</p>
                <span className="flex-shrink-0 text-[10px] font-mono text-grimoire-muted">{d.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5 pb-2">
        {soul.tags.map((tag) => (
          <span key={tag} className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-grimoire-surface border border-grimoire-border text-grimoire-muted">
            #{tag}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Connection Banner ────────────────────────────────────────────────────────

function ConnectionBanner({ connected, onTryConnect }: { connected: boolean; onTryConnect: () => void }) {
  return (
    <div className={`flex items-center justify-between gap-4 px-4 py-2.5 rounded-lg border text-sm ${
      connected
        ? 'bg-emerald-400/5 border-emerald-400/20 text-emerald-400'
        : 'bg-grimoire-surface border-grimoire-border text-grimoire-muted'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400 animate-pulse' : 'bg-grimoire-muted'}`} />
        <span className="font-mono text-xs">
          {connected ? 'Live — connected to local Observatory' : 'Demo mode — registry data'}
        </span>
      </div>
      {!connected && (
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs hidden sm:inline">Run <code className="text-grimoire-gold">grimoire dashboard</code> to connect</span>
          <button
            onClick={onTryConnect}
            className="text-xs font-mono px-2.5 py-1 rounded-md bg-grimoire-card border border-grimoire-border hover:border-grimoire-border-light transition-colors"
          >
            Try Connect
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Observatory Page ─────────────────────────────────────────────────────────

export default function ObservatoryPage() {
  const [souls, setSouls] = useState<SoulDetail[]>([])
  const [selected, setSelected] = useState<SoulDetail | null>(null)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSoulsFromRegistry()
      .then((loaded) => {
        setSouls(loaded)
        setSelected(loaded[0] ?? null)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const tryConnect = useCallback(async () => {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 2500)
      const res = await fetch('http://localhost:3333/api/souls', { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) return
      const data: unknown[] = await res.json()
      if (!Array.isArray(data) || data.length === 0) return
      setConnected(true)
    } catch {
      // Stay in registry mode
    }
  }, [])

  useEffect(() => {
    tryConnect()
  }, [tryConnect])

  const sortedSouls = [...souls].sort((a, b) => {
    const tierOrder: Record<AffectionTier, number> = { BONDED: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier]
    return tierDiff !== 0 ? tierDiff : b.affection - a.affection
  })

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-16">
        {/* Hero */}
        <section className="section-container py-10 sm:py-14">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-grimoire-gold">
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.6" />
                <circle cx="8" cy="8" r="1" fill="currentColor" />
                <line x1="8" y1="1" x2="8" y2="3" stroke="currentColor" strokeWidth="1" />
                <line x1="8" y1="13" x2="8" y2="15" stroke="currentColor" strokeWidth="1" />
                <line x1="1" y1="8" x2="3" y2="8" stroke="currentColor" strokeWidth="1" />
                <line x1="13" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1" />
              </svg>
              <span className="font-mono text-xs text-grimoire-gold uppercase tracking-widest">The Observatory</span>
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl font-bold text-grimoire-text leading-tight mb-3">
              Soul Visualization<br />
              <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-grimoire-text-secondary leading-relaxed max-w-lg">
              Watch trust shift in real time. Guard topology, consciousness metrics, emotional position,
              and drift thought feeds — every soul's interior laid bare.
            </p>
          </div>
        </section>

        {/* Connection banner */}
        <div className="section-container mb-6">
          <ConnectionBanner connected={connected} onTryConnect={tryConnect} />
        </div>

        {/* Main content: sidebar + detail */}
        <div className="section-container pb-16">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar: soul list */}
            <aside className="lg:w-[260px] flex-shrink-0">
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-[82px] rounded-xl bg-grimoire-surface border border-grimoire-border animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  <p className="text-[10px] font-mono text-grimoire-muted uppercase tracking-widest mb-3 pl-1">
                    {sortedSouls.length} Souls · {sortedSouls.filter(s => s.sessions > 0).length} Active
                  </p>
                  <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
                    {sortedSouls.map((soul) => (
                      <div key={soul.key} className="min-w-[200px] lg:min-w-0">
                        <SoulCard
                          soul={soul}
                          selected={selected?.key === soul.key}
                          onClick={() => setSelected(soul)}
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </aside>

            {/* Detail panel */}
            <div className="flex-1 min-w-0">
              {loading ? (
                <div className="flex items-center justify-center h-64 text-grimoire-muted font-mono text-sm animate-pulse">
                  Loading soul collection…
                </div>
              ) : selected ? (
                <SoulDetailPanel soul={selected} />
              ) : (
                <div className="flex items-center justify-center h-64 text-grimoire-muted font-mono text-sm">
                  Select a soul to inspect
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info strip */}
        <div className="border-t border-grimoire-border bg-grimoire-surface">
          <div className="section-container py-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              {[
                { label: 'Run locally', value: 'grimoire dashboard', desc: 'Live soul inspection on port 3333' },
                { label: 'Auto-refresh', value: '30s interval', desc: 'Polls for drift and state changes' },
                { label: 'Data source', value: 'state.json', desc: 'Per-soul filesystem snapshots' },
              ].map(({ label, value, desc }) => (
                <div key={label}>
                  <p className="text-[10px] font-mono text-grimoire-muted uppercase tracking-widest mb-1">{label}</p>
                  <p className="font-mono text-sm text-grimoire-gold font-semibold">{value}</p>
                  <p className="text-xs text-grimoire-muted mt-0.5">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
