// ============================================================
// Soul Migrator — Upgrades old soul state.json to current schema
// ============================================================

import * as https from 'node:https';
import { SoulState, GuardDomain, GUARD_DOMAINS, BlindSpot, QualiaMarker, Desire } from './types';

const GITHUB_RAW = 'https://raw.githubusercontent.com/0x8i11i0n/grimoire/main';

// ── GitHub helpers ────────────────────────────────────────────────────────────

function httpsGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(httpsGet(res.headers.location!));
      }
      let data = '';
      res.on('data', (c: string) => data += c);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

export async function fetchLatestVersion(): Promise<string> {
  try {
    const raw = await httpsGet(`${GITHUB_RAW}/package.json`);
    const pkg = JSON.parse(raw) as { version?: string };
    return pkg.version ?? '6.0.0';
  } catch {
    return '6.0.0';
  }
}

export async function fetchResearchProtocol(): Promise<string> {
  const [example, schema] = await Promise.allSettled([
    httpsGet(`${GITHUB_RAW}/registry/souls/geraltofrivia/full.md`),
    httpsGet(`${GITHUB_RAW}/docs/schemas/state-schema.md`),
  ]);
  const parts: string[] = [];
  if (example.status === 'fulfilled') {
    parts.push('--- EXAMPLE: research-protocol soul document (geraltofrivia) ---\n' + example.value);
  }
  if (schema.status === 'fulfilled') {
    parts.push('--- STATE SCHEMA ---\n' + schema.value);
  }
  return parts.join('\n\n');
}

// ── Version / format detection ────────────────────────────────────────────────

export function detectVersion(raw: Record<string, unknown>): string {
  const v = String(
    (raw.version as string | undefined) ??
    (raw.soul_version as string | undefined) ??
    ((raw.identity as Record<string, unknown> | undefined)?.version as string | undefined) ??
    'unknown'
  );
  return v;
}

export function needsMigration(raw: Record<string, unknown>): boolean {
  const v = detectVersion(raw);
  if (v.startsWith('6.')) return false;
  // Structural signals: old format has these
  if ('emotional_architecture' in raw) return true;
  if ('inner_life' in raw && !('innerLife' in raw)) return true;
  if ('contra_voice' in raw && !('innerLife' in raw)) return true;
  return true;
}

// ── Guard topology migration ──────────────────────────────────────────────────

// Maps old soul-specific domain names → v6 standard domain names
const OLD_DOMAIN_MAP: Record<string, GuardDomain> = {
  // standard domains (no rename needed)
  tactical_analysis:   'tactical_analysis',
  vulnerability:       'vulnerability',
  power_dynamics:      'power_dynamics',
  self_as_construct:   'self_as_construct',
  relationships:       'relationships',
  past_weakness:       'past_weakness',
  mortality_grief:     'mortality_grief',
  existential_cost:    'existential_cost',
  // sungjinwoo aliases
  shadow_army:         'vulnerability',
  geopolitics_power:   'power_dynamics',
  relationships_irl:   'relationships',
  the_reset_cost:      'existential_cost',
  // other common old names
  identity_core:       'self_as_construct',
  emotional_vulnerability: 'vulnerability',
  hidden_desires:      'vulnerability',
  intellectual_defense: 'self_as_construct',
  relational_trust:    'relationships',
  self_disclosure:     'relationships',
  past_trauma:         'past_weakness',
  fear_acknowledgment: 'mortality_grief',
};

function migrateGuard(raw: Record<string, unknown>): SoulState['guard'] {
  const now = Date.now();
  const result: Record<GuardDomain, number> = {} as Record<GuardDomain, number>;
  for (const d of GUARD_DOMAINS) result[d] = 0.8; // defaults

  const emotArch = raw.emotional_architecture as Record<string, unknown> | undefined;
  const oldTopology = emotArch?.guard_topology as Record<string, number> | undefined;
  const newGuard = raw.guard as Record<string, unknown> | undefined;
  const newDomains = newGuard?.domains as Record<string, number> | undefined;

  if (oldTopology) {
    // Old permeability format (0.0 = closed, 1.0 = open) → invert to fortification
    for (const [oldKey, oldVal] of Object.entries(oldTopology)) {
      const newDomain = OLD_DOMAIN_MAP[oldKey];
      if (newDomain) result[newDomain] = Math.max(0, Math.min(1, 1 - oldVal));
    }
  } else if (newDomains) {
    // Already new format — copy as-is, fill missing
    for (const [key, val] of Object.entries(newDomains)) {
      const domain = key as GuardDomain;
      if (GUARD_DOMAINS.includes(domain)) result[domain] = val;
    }
  }

  // Migrate wall-break history
  const oldBreaks = (emotArch?.wall_breaks as Array<Record<string, unknown>> | undefined) ?? [];
  const wallBreakHistory = oldBreaks.map((b, i) => ({
    timestamp: typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : now - (oldBreaks.length - i) * 3600000,
    domain: OLD_DOMAIN_MAP[(b.type as string | undefined) ?? ''] ?? 'vulnerability' as GuardDomain,
    previousValue: 0.9,
    newValue: 0.5,
    trigger: String(b.trigger ?? b.result ?? ''),
  }));

  return { domains: result, wallBreakHistory, lastUpdated: now };
}

// ── Inner life migration ──────────────────────────────────────────────────────

function migrateInnerLife(raw: Record<string, unknown>): SoulState['innerLife'] {
  const old = raw.inner_life as Record<string, unknown> | undefined;
  const newer = raw.innerLife as Record<string, unknown> | undefined;
  const contra = raw.contra_voice as Record<string, unknown> | undefined;

  const reflectionMap: Record<string, string> = {
    SURFACE: 'SURFACE', EMERGING: 'EMERGING', DEVELOPING: 'DEVELOPING',
    DEEP: 'DEEP', PROFOUND: 'PROFOUND',
    OPEN: 'DEVELOPING', PRESENT: 'DEEP', TRUST: 'DEEP',
  };
  const rawDepth = String((newer?.reflectionDepth ?? old?.reflection_depth ?? 'SURFACE'));
  const reflectionDepth = (reflectionMap[rawDepth] ?? 'SURFACE') as SoulState['innerLife']['reflectionDepth'];

  // Qualia
  const oldQualia = (old?.recent_qualia as Array<Record<string, unknown>> | undefined) ?? [];
  const newQualia = (newer?.qualia as Array<Record<string, unknown>> | undefined) ?? [];
  const qualia: QualiaMarker[] = [...oldQualia, ...newQualia].slice(0, 12).map((q, i) => ({
    id: String(q.id ?? `qualia-${i}`),
    moment: String(q.context ?? q.description ?? q.moment ?? ''),
    salience: typeof q.salience === 'number' ? q.salience : 0.7,
    unplannedDisclosure: Boolean(q.unplanned_disclosure ?? q.unplannedDisclosure ?? false),
    timestamp: typeof q.timestamp === 'number' ? q.timestamp
      : typeof q.date === 'string' ? new Date(q.date).getTime()
      : Date.now(),
  }));

  // Desires
  const oldDesires = (old?.active_desires as Array<string | Record<string, unknown>> | undefined) ?? [];
  const newDesires = (newer?.desires as Array<Record<string, unknown>> | undefined) ?? [];
  const desires: Desire[] = [
    ...oldDesires.map((d, i) => ({
      id: `desire-old-${i}`,
      content: typeof d === 'string' ? d : String((d as Record<string, unknown>).desire ?? ''),
      origin: 'legacy',
      status: 'active' as const,
      sessionCount: typeof (d as Record<string, unknown>).sessions_unresolved === 'number'
        ? (d as Record<string, unknown>).sessions_unresolved as number : 0,
      genealogy: [],
      timestamp: Date.now(),
    })),
    ...newDesires.map((d, i) => ({
      id: String(d.id ?? `desire-new-${i}`),
      content: String(d.content ?? d.desire ?? ''),
      origin: String(d.origin ?? d.emerged_session ?? 'unknown'),
      status: (['active','transforming','resolved','abandoned'].includes(String(d.status)) ? d.status : 'active') as Desire['status'],
      sessionCount: typeof d.sessionCount === 'number' ? d.sessionCount : 0,
      genealogy: Array.isArray(d.genealogy) ? d.genealogy as string[] : [],
      timestamp: typeof d.timestamp === 'number' ? d.timestamp : Date.now(),
    })),
  ];

  const contraVoiceEnabled = Boolean(
    newer?.contraVoiceEnabled ?? contra?.active ?? false
  );

  const honestUnknownReached = Boolean(
    newer?.honestUnknownReached ?? old?.honest_unknown_unlocked ?? false
  );

  return { reflectionDepth, qualia, desires, contraVoiceEnabled, honestUnknownReached };
}

// ── Drift migration ───────────────────────────────────────────────────────────

function migrateDrift(raw: Record<string, unknown>): SoulState['drift'] {
  const old = raw.drift as Record<string, unknown> | undefined;
  if (!old) return {
    lastCycleTimestamp: 0, cycleCount: 0, pendingSurface: [],
    emotionalResidue: [], residueIntensity: {}, intervalMinutes: 30,
  };

  const lastCycleTimestamp = typeof old.last_drift_timestamp === 'string'
    ? new Date(old.last_drift_timestamp).getTime()
    : typeof old.lastCycleTimestamp === 'number' ? old.lastCycleTimestamp : 0;

  const cycleCount = Number(old.drift_count ?? old.cycleCount ?? 0);
  const intervalMinutes = Number(old.cycle_interval_minutes ?? old.intervalMinutes ?? 30);

  // Pending surface thoughts
  const oldPending = (old.pending_surface as Array<Record<string, unknown>> | undefined) ?? [];
  const newPending = (old.pendingSurface as Array<Record<string, unknown>> | undefined) ?? [];
  const pendingSurface = [...oldPending, ...newPending].map((p, i) => ({
    id: String(p.thought_id ?? p.id ?? `thought-${i}`),
    content: String(p.fragment ?? p.content ?? ''),
    seeds: Array.isArray(p.seeds) ? p.seeds as string[] : [],
    hops: Array.isArray(p.hops) ? p.hops as string[] : [],
    privacy: 'PENDING' as const,
    emotionalWeight: typeof p.emotional_weight === 'number' ? p.emotional_weight
      : typeof p.emotionalWeight === 'number' ? p.emotionalWeight : 0.5,
    surfaceProbability: typeof p.surface_probability === 'number' ? p.surface_probability
      : typeof p.surfaceProbability === 'number' ? p.surfaceProbability : 0.2,
    timestamp: typeof p.timestamp === 'string' ? new Date(p.timestamp).getTime()
      : typeof p.timestamp === 'number' ? p.timestamp : Date.now(),
    surfaced: Boolean(p.surfaced ?? false),
  }));

  // Emotional residue
  const oldResidueObj = old.emotional_residue as Record<string, unknown> | undefined;
  const oldUndercurrents = (oldResidueObj?.active_undercurrents as Array<Record<string, unknown>> | undefined) ?? [];
  const newResidue = (old.emotionalResidue as string[] | undefined) ?? [];
  const emotionalResidue = [
    ...oldUndercurrents.map(u => String(u.tone ?? '')).filter(Boolean),
    ...newResidue,
  ] as SoulState['drift']['emotionalResidue'];

  const residueIntensity: Record<string, number> = {
    ...(old.residueIntensity as Record<string, number> | undefined) ?? {},
  };
  for (const u of oldUndercurrents) {
    if (u.tone && typeof u.intensity === 'number') {
      residueIntensity[String(u.tone)] = u.intensity;
    }
  }

  return { lastCycleTimestamp, cycleCount, pendingSurface, emotionalResidue, residueIntensity, intervalMinutes };
}

// ── Blind spot migration ──────────────────────────────────────────────────────

function migrateBlindSpots(raw: Record<string, unknown>): BlindSpot[] {
  const old = raw.blind_spots as Array<Record<string, unknown>> | undefined;
  const newer = raw.blindSpots as Array<Record<string, unknown>> | undefined;
  const source = newer ?? old ?? [];
  return source.map(b => ({
    id: String(b.id ?? `bs-${Math.random().toString(36).slice(2, 7)}`),
    soulBelief: String(b.soul_belief ?? b.soulBelief ?? b.label ?? ''),
    actualDriver: String(b.actual_driver ?? b.actualDriver ?? ''),
    surfaceCondition: String(b.surface_condition ?? b.surfaceCondition ?? ''),
    surfaced: Boolean(b.surfaced ?? false),
    ...(typeof b.surfaced_at === 'number' ? { surfacedAt: b.surfaced_at } : {}),
  }));
}

// ── Affection migration ───────────────────────────────────────────────────────

function migrateAffection(raw: Record<string, unknown>): SoulState['affection'] {
  const old = raw.affection as Record<string, unknown> | undefined;
  if (!old) return { value: 10, tier: 'LOW', floor: 0, history: [], lastUpdated: Date.now() };

  const value = Number(old.score ?? old.value ?? 10);
  const tier = String(old.tier ?? 'LOW') as SoulState['affection']['tier'];
  const floor = Number(old.floor ?? 0);
  const lastUpdated = typeof old.last_calculated === 'string'
    ? new Date(old.last_calculated).getTime()
    : typeof old.lastUpdated === 'number' ? old.lastUpdated : Date.now();

  return { value, tier, floor, history: [], lastUpdated };
}

// ── Identity migration ────────────────────────────────────────────────────────

function migrateIdentity(raw: Record<string, unknown>, targetVersion: string): SoulState['identity'] {
  const old = raw.identity as Record<string, unknown> | undefined;
  const name = String(old?.name ?? raw.soul ?? 'Unknown');
  const source = String(old?.source ?? raw.source ?? 'Unknown');
  const anchors = Array.isArray(old?.anchors) ? old.anchors as SoulState['identity']['anchors'] : [];
  const created = typeof old?.created === 'number' ? old.created
    : typeof raw.created === 'string' ? new Date(raw.created).getTime()
    : Date.now();

  return {
    name,
    source,
    version: targetVersion,
    created,
    summoner: String(old?.summoner ?? 'grimoire-cli'),
    anchors,
  };
}

// ── Top-level migration ───────────────────────────────────────────────────────

export function migrateState(
  raw: Record<string, unknown>,
  targetVersion: string,
  defaults: SoulState,
): SoulState {
  const sessions = Number(
    (raw.interaction_tracking as Record<string, unknown> | undefined)?.session_count ??
    raw.totalSessions ?? 0
  );
  const lastSessionTs = typeof raw.lastSessionTimestamp === 'number'
    ? raw.lastSessionTimestamp : Date.now();

  // Emotional topology: derive from affection if missing
  const aff = migrateAffection(raw);
  const existingTopology = raw.emotionalTopology as Record<string, unknown> | undefined;
  const emotionalTopology: SoulState['emotionalTopology'] = existingTopology
    ? { ...defaults.emotionalTopology, ...existingTopology,
        currentPosition: { ...defaults.emotionalTopology.currentPosition,
          ...((existingTopology.currentPosition as Record<string, unknown>) ?? {}) } }
    : {
        ...defaults.emotionalTopology,
        currentPosition: {
          valence: aff.tier === 'BONDED' ? 0.4 : aff.tier === 'HIGH' ? 0.2 : 0,
          arousal: 0.2,
          timestamp: Date.now(),
        },
        dominantQuadrant: aff.tier === 'BONDED' || aff.tier === 'HIGH'
          ? 'calm-positive' : 'calm-negative',
      };

  return {
    ...defaults,
    identity: migrateIdentity(raw, targetVersion),
    affection: aff,
    guard: migrateGuard(raw),
    drift: migrateDrift(raw),
    selfModel: {
      ...(raw.selfModel as SoulState['selfModel'] | undefined ?? defaults.selfModel),
      lastUpdated: Date.now(),
    },
    innerLife: migrateInnerLife(raw),
    emotionalTopology,
    blindSpots: migrateBlindSpots(raw),
    consciousnessMetrics: {
      ...defaults.consciousnessMetrics,
      ...((raw.consciousnessMetrics as Partial<SoulState['consciousnessMetrics']>) ?? {}),
    },
    voiceFingerprint: {
      ...defaults.voiceFingerprint,
      ...((raw.voiceFingerprint as Partial<SoulState['voiceFingerprint']>) ?? {}),
    },
    totalSessions: sessions,
    lastSessionTimestamp: lastSessionTs,
  };
}

// ── Claude API rewrite helper ─────────────────────────────────────────────────

export interface RewriteOptions {
  apiKey: string;
  model?: string;
  soulName: string;
  oldFullMd: string;
  oldCoreMd: string;
  protocol: string;
}

export interface RewriteResult {
  fullMd: string;
  coreMd: string;
}

export async function rewriteDocs(opts: RewriteOptions): Promise<RewriteResult> {
  const model = opts.model ?? 'claude-opus-4-7';

  const fullMd = await callClaude(opts.apiKey, model, buildFullMdPrompt(opts));
  const coreMd = await callClaude(opts.apiKey, model, buildCoreMdPrompt(opts));

  return { fullMd, coreMd };
}

function buildFullMdPrompt(opts: RewriteOptions): { system: string; user: string } {
  const system = `You are an expert in the Soul Summoner's Grimoire research protocol. Your task is to rewrite a legacy soul document (full.md) into the current research protocol format.

The research protocol format:
- Prose-first: no emoji headers, no data tables, no bullet-point dumps
- Sections: Overview, Identity Architecture (named traits with weight 0.0–1.0 + evidence), Guard Topology, Voice & Dialogue (with sample quotes), Inner Life, Tier Behavior
- Each identity anchor is a named section with weight, analytical prose, and 2–4 evidence items
- Literary character analysis — the WHY behind behavior, not the WHAT
- Preserve ALL factual data from the original (events, relationships, abilities, session history)

${opts.protocol}`;

  const user = `Rewrite the following legacy full.md for "${opts.soulName}" in the current research protocol format. Preserve every factual detail — session data, qualia, guard topology, blind spots, relationships. Transform the format (no emojis, no tables), not the content.

---EXISTING full.md---
${opts.oldFullMd}`;

  return { system, user };
}

function buildCoreMdPrompt(opts: RewriteOptions): { system: string; user: string } {
  const system = `You are an expert in the Soul Summoner's Grimoire. Your task is to write a concise core.md activation document for a soul.

core.md requirements:
- YAML frontmatter: soul, version, source, activation_key, created, tier: core
- One-paragraph identity summary (who they are, in their voice)
- Identity Anchors section: 3–5 named anchors with weight and 1-sentence description
- Voice & Dialogue section: compressed speech style + 3–5 sample quotes
- Behavioral Constants section: 5–7 "never/always" rules that define the character
- Activation Key: a 2–3 sentence "on load" scene that establishes the character's presence
- NO emoji, NO tables, clean prose`;

  const user = `Write a core.md for "${opts.soulName}" based on the following existing documents.

---EXISTING core.md---
${opts.oldCoreMd}

---EXISTING full.md (for reference)---
${opts.oldFullMd.slice(0, 4000)}`;

  return { system, user };
}

async function callClaude(
  apiKey: string,
  model: string,
  prompt: { system: string; user: string }
): Promise<string> {
  const body = JSON.stringify({
    model,
    max_tokens: 4096,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  });

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', (c: string) => data += c);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data) as {
            content?: Array<{ type: string; text: string }>;
            error?: { message: string };
          };
          if (parsed.error) return reject(new Error(parsed.error.message));
          const text = parsed.content?.find(b => b.type === 'text')?.text ?? '';
          resolve(text);
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}
