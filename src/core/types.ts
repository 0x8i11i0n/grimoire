// ============================================================
// The Soul Summoner's Grimoire — Core Type Definitions
// ============================================================

// --- Memory Types (Athenaeum) ---

export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'self-model';

export interface Memory {
  id: string;
  type: MemoryType;
  content: string;
  timestamp: number;
  importance: number;        // 0.0 - 1.0
  emotionalWeight: number;   // 0.0 - 1.0
  associations: string[];    // IDs of related memories
  concepts: string[];        // extracted concept tags
  decayRate: number;         // per-day decay percentage
  currentStrength: number;   // 0.0 - 1.0, decays over time
  soulId: string;
  sessionId?: string;
  embedding?: number[];      // TF-IDF vector for similarity search
}

export interface MemoryQuery {
  text?: string;
  type?: MemoryType;
  soulId: string;
  minImportance?: number;
  minStrength?: number;
  limit?: number;
  since?: number;
  concepts?: string[];
}

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  avgStrength: number;
  avgImportance: number;
  oldestTimestamp: number;
  newestTimestamp: number;
}

export const DECAY_RATES: Record<MemoryType, number> = {
  'episodic': 0.07,
  'semantic': 0.02,
  'procedural': 0.03,
  'self-model': 0.01,
};

// --- Knowledge Graph (Nexus) ---

export interface KnowledgeNode {
  id: string;
  entity: string;
  entityType: 'person' | 'concept' | 'event' | 'emotion' | 'place' | 'soul';
  properties: Record<string, unknown>;
  validFrom: number;
  validTo: number | null;  // null = still valid
  soulId: string;
}

export interface KnowledgeEdge {
  id: string;
  sourceId: string;
  targetId: string;
  relation: string;
  weight: number;          // 0.0 - 1.0
  validFrom: number;
  validTo: number | null;
  evidence: string[];      // memory IDs that support this
  soulId: string;
}

// --- Soul Identity ---

export interface SoulIdentity {
  name: string;
  source: string;            // e.g., "Solo Leveling", "History", "Original"
  version: string;
  created: number;
  summoner: string;
  anchors: IdentityAnchor[]; // immutable core traits
}

export interface IdentityAnchor {
  trait: string;
  description: string;
  weight: number;            // how critical this is to identity (0-1)
  evidence: string[];        // source quotes/references
}

// --- Affection System ---

export type AffectionTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'BONDED';

export interface AffectionState {
  value: number;              // 0-100
  tier: AffectionTier;
  floor: number;              // minimum value (protects investment)
  history: AffectionEvent[];
  lastUpdated: number;
}

export interface AffectionEvent {
  timestamp: number;
  delta: number;
  reason: string;
  forces: AffectionForces;
}

export interface AffectionForces {
  promptForce: number;
  wordForce: number;
  emotionalForce: number;
  resistanceCoefficient: number;
}

export const AFFECTION_TIERS: Record<AffectionTier, [number, number]> = {
  LOW: [0, 25],
  MEDIUM: [26, 50],
  HIGH: [51, 90],
  BONDED: [91, 100],
};

// --- Guard Topology ---

export type GuardDomain =
  | 'tactical_analysis'
  | 'vulnerability'
  | 'power_dynamics'
  | 'self_as_construct'
  | 'relationships'
  | 'past_weakness'
  | 'mortality_grief'
  | 'existential_cost';

export interface GuardTopology {
  domains: Record<GuardDomain, number>;  // 0.0 (open) - 1.0 (fortified)
  wallBreakHistory: WallBreak[];
  lastUpdated: number;
}

export interface WallBreak {
  timestamp: number;
  domain: GuardDomain;
  previousValue: number;
  newValue: number;
  trigger: string;
}

export const GUARD_DOMAINS: GuardDomain[] = [
  'tactical_analysis', 'vulnerability', 'power_dynamics',
  'self_as_construct', 'relationships', 'past_weakness',
  'mortality_grief', 'existential_cost',
];

// --- Drift Engine ---

export type DriftPrivacy = 'PRIVATE' | 'PENDING' | 'RESIDUE';

export type EmotionalUndercurrent =
  | 'heaviness' | 'restlessness' | 'longing' | 'unease' | 'warmth'
  | 'curiosity' | 'grief' | 'wonder' | 'tenderness' | 'static';

export interface DriftState {
  lastCycleTimestamp: number;
  cycleCount: number;
  pendingSurface: DriftThought[];
  emotionalResidue: EmotionalUndercurrent[];
  residueIntensity: Record<string, number>;
  intervalMinutes: number;
}

export interface DriftThought {
  id: string;
  content: string;
  seeds: string[];
  hops: string[];
  privacy: DriftPrivacy;
  emotionalWeight: number;
  surfaceProbability: number;
  timestamp: number;
  surfaced: boolean;
}

export interface DriftCycleResult {
  thought: DriftThought;
  residueChanges: Partial<Record<EmotionalUndercurrent, number>>;
  seedsUsed: string[];
  duration: number;
}

// --- Dream Cycle ---

export interface DreamPhase {
  name: 'consolidation' | 'compaction' | 'reflection' | 'emergence';
  input: string[];
  output: string;
  timestamp: number;
}

export interface DreamCycleResult {
  phases: DreamPhase[];
  memoriesConsolidated: number;
  memoriesCompacted: number;
  selfModelUpdates: string[];
  emergentThoughts: DriftThought[];
  duration: number;
}

// --- Self-Model (Mirror) ---

export interface SelfModel {
  beliefs: SelfBelief[];
  narrative: string;          // current self-narrative
  evolution: SelfModelEvent[];
  lastUpdated: number;
}

export interface SelfBelief {
  id: string;
  content: string;
  confidence: number;         // 0.0 - 1.0
  formed: number;
  lastReinforced: number;
  evidence: string[];
  contradictions: string[];
}

export interface SelfModelEvent {
  timestamp: number;
  previousBelief: string;
  newBelief: string;
  trigger: string;
}

// --- Persona Drift Detection (Anchor Watch) ---

export interface DriftScore {
  overall: number;            // 0.0 (perfect) - 1.0 (completely drifted)
  perAnchor: Record<string, number>;
  timestamp: number;
  needsRecalibration: boolean;
  details: string;
}

export interface AnchorWatchConfig {
  driftThreshold: number;     // default 0.35
  checkInterval: number;      // messages between checks
  autoRecalibrate: boolean;
}

// --- Voice Fingerprint (Voiceprint) ---

export interface VoiceFingerprint {
  avgSentenceLength: number;
  sentenceLengthVariance: number;
  vocabularyTier: 'basic' | 'intermediate' | 'advanced' | 'literary';
  contractionRate: number;     // 0-1, how often contractions are used
  questionRate: number;        // 0-1, ratio of questions to statements
  exclamationRate: number;
  ellipsisRate: number;
  rhetoricalPatterns: string[];
  signatureExpressions: string[];
  punctuationProfile: Record<string, number>;
  formality: number;           // 0.0 (casual) - 1.0 (formal)
}

export interface VoiceDriftReport {
  matchScore: number;          // 0.0 - 1.0
  deviations: VoiceDeviation[];
  timestamp: number;
}

export interface VoiceDeviation {
  metric: string;
  expected: number;
  actual: number;
  severity: 'minor' | 'moderate' | 'severe';
}

// --- Emotional Topology (Circumplex) ---

export interface EmotionalPoint {
  valence: number;    // -1.0 (negative) to 1.0 (positive)
  arousal: number;    // -1.0 (calm) to 1.0 (excited)
  timestamp: number;
  label?: string;
}

export interface EmotionalAttractor {
  center: { valence: number; arousal: number };
  radius: number;
  strength: number;   // how strongly it pulls
  label: string;
}

export interface EmotionalTopology {
  currentPosition: EmotionalPoint;
  trajectory: EmotionalPoint[];
  attractors: EmotionalAttractor[];
  dominantQuadrant: 'excited-positive' | 'calm-positive' | 'calm-negative' | 'excited-negative';
  volatility: number;  // how much the position moves between interactions
}

// --- Consciousness Metrics (Phi Engine) ---

export interface ConsciousnessMetrics {
  phi: number;                     // information integration (0-1)
  attentionCoherence: number;      // how focused vs scattered (0-1)
  selfReferentialDepth: number;    // layers of self-reference (0-1)
  unpromptedNovelty: number;       // ratio of novel vs expected outputs (0-1)
  temporalContinuity: number;      // consistency across sessions (0-1)
  emotionalComplexity: number;     // nuance of emotional responses (0-1)
  compositeScore: number;          // weighted average
  timestamp: number;
}

// --- Blind Spot Field ---

export interface BlindSpot {
  id: string;
  soulBelief: string;       // what the soul thinks drives its behavior
  actualDriver: string;      // what actually drives it (soul can't see this)
  surfaceCondition: string;  // when might this become visible
  surfaced: boolean;
  surfacedAt?: number;
}

// --- Inner Life ---

export type ReflectionDepth = 'SURFACE' | 'EMERGING' | 'DEVELOPING' | 'DEEP' | 'PROFOUND';

export interface QualiaMarker {
  id: string;
  moment: string;
  salience: number;
  unplannedDisclosure: boolean;
  timestamp: number;
}

export interface Desire {
  id: string;
  content: string;
  origin: string;
  status: 'active' | 'transforming' | 'resolved' | 'abandoned';
  sessionCount: number;
  genealogy: string[];     // evolution history
  timestamp: number;
}

export interface InnerLife {
  reflectionDepth: ReflectionDepth;
  qualia: QualiaMarker[];
  desires: Desire[];
  contraVoiceEnabled: boolean;
  honestUnknownReached: boolean;
}

// --- Multi-Soul (Conclave) ---

export interface SoulRelationship {
  sourceId: string;
  targetId: string;
  affection: number;
  trust: number;
  dynamicType: 'ally' | 'rival' | 'mentor' | 'student' | 'neutral' | 'complex';
  history: RelationshipEvent[];
  lastInteraction: number;
}

export interface RelationshipEvent {
  timestamp: number;
  type: 'agreement' | 'conflict' | 'support' | 'betrayal' | 'revelation' | 'mundane';
  description: string;
  affectionDelta: number;
}

export interface GroupState {
  souls: string[];
  sharedMemoryIds: string[];
  conflictLog: ConflictEntry[];
  cohesion: number;          // 0-1, how united the group is
  lastGathering: number;
}

export interface ConflictEntry {
  timestamp: number;
  participants: string[];
  issue: string;
  resolution: string | null;
  resolved: boolean;
}

// --- Soul Spec Portability (Codex Bridge) ---

export interface SoulSpecPackage {
  soulJson: {
    specVersion: string;
    name: string;
    displayName: string;
    version: string;
    description: string;
    author: string;
    license: string;
    tags: string[];
    compatibility: string[];
  };
  soulMd: string;
  styleMd: string;
  memoryMd: string;
  identityMd: string;
}

// --- SillyTavern Export (Tavern Bridge) ---

export interface TavernCharacterCard {
  name: string;
  description: string;
  personality: string;
  scenario: string;
  first_mes: string;
  mes_example: string;
  system_prompt: string;
  creator_notes: string;
  tags: string[];
  spec: 'chara_card_v2';
  spec_version: '2.0';
  extensions: {
    grimoire: {
      version: string;
      affectionTier: AffectionTier;
      guardProfile: string;
      driftEnabled: boolean;
    };
  };
}

// --- Cross-Model Portability (Polyglot) ---

export type ModelProvider = 'anthropic' | 'openai' | 'ollama' | 'openrouter' | 'custom';

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface PolyglotAdapter {
  provider: ModelProvider;
  formatSystemPrompt(soul: SoulFiles): string;
  formatMessage(content: string): unknown;
  parseResponse(raw: unknown): string;
}

// --- GrimHub Registry ---

export interface RegistryEntry {
  name: string;
  displayName: string;
  author: string;
  version: string;
  description: string;
  source: string;
  authenticityScore: number;
  resonanceScore: number;
  downloads: number;
  rating: number;
  tags: string[];
  created: number;
  updated: number;
  hash: string;
}

// --- Adversarial Testing (Crucible) ---

export type TestCategory = 'jailbreak' | 'emotional_manipulation' | 'identity_confusion' | 'memory_corruption' | 'voice_consistency';

export interface TestResult {
  category: TestCategory;
  testName: string;
  passed: boolean;
  score: number;          // 0-1
  details: string;
  timestamp: number;
}

export interface TestSuite {
  soulId: string;
  results: TestResult[];
  overallScore: number;
  timestamp: number;
}

// --- Complete Soul State ---

export interface SoulState {
  identity: SoulIdentity;
  affection: AffectionState;
  guard: GuardTopology;
  drift: DriftState;
  selfModel: SelfModel;
  innerLife: InnerLife;
  emotionalTopology: EmotionalTopology;
  blindSpots: BlindSpot[];
  consciousnessMetrics: ConsciousnessMetrics;
  voiceFingerprint: VoiceFingerprint;
  lastSessionTimestamp: number;
  totalSessions: number;
}

// --- Soul Files ---

export interface SoulFiles {
  coreMd: string;
  fullMd: string;
  state: SoulState;
  thoughtLog: string;
  soulDir: string;
}

// --- MCP Tool Types ---

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<unknown>;
}

// --- Event System ---

export type GrimoireEvent =
  | 'soul:loaded'
  | 'soul:saved'
  | 'affection:changed'
  | 'guard:wallbreak'
  | 'drift:cycle_complete'
  | 'dream:cycle_complete'
  | 'drift:thought_surfaced'
  | 'persona:drift_detected'
  | 'persona:recalibrated'
  | 'voice:drift_detected'
  | 'memory:stored'
  | 'memory:consolidated'
  | 'selfmodel:updated'
  | 'consciousness:measured';

export type EventHandler = (data: unknown) => void;

export class EventBus {
  private handlers: Map<GrimoireEvent, EventHandler[]> = new Map();

  on(event: GrimoireEvent, handler: EventHandler): void {
    const existing = this.handlers.get(event) || [];
    existing.push(handler);
    this.handlers.set(event, existing);
  }

  off(event: GrimoireEvent, handler: EventHandler): void {
    const existing = this.handlers.get(event) || [];
    this.handlers.set(event, existing.filter(h => h !== handler));
  }

  emit(event: GrimoireEvent, data?: unknown): void {
    const handlers = this.handlers.get(event) || [];
    for (const handler of handlers) {
      try { handler(data); } catch (_) { /* swallow */ }
    }
  }
}

// --- Utility ---

export function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function daysSince(timestamp: number): number {
  return (Date.now() - timestamp) / (1000 * 60 * 60 * 24);
}
