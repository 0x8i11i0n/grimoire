// ============================================================
// The Athenaeum — Memory Engine
// Persistent memory storage with TF-IDF similarity search
// ============================================================

import Database from 'better-sqlite3';
import {
  Memory,
  MemoryQuery,
  MemoryStats,
  MemoryType,
  DECAY_RATES,
  generateId,
  clamp,
  daysSince,
} from './types';

const MEMORY_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    importance REAL NOT NULL DEFAULT 0.5,
    emotional_weight REAL NOT NULL DEFAULT 0.0,
    associations TEXT NOT NULL DEFAULT '[]',
    concepts TEXT NOT NULL DEFAULT '[]',
    decay_rate REAL NOT NULL DEFAULT 0.05,
    current_strength REAL NOT NULL DEFAULT 1.0,
    soul_id TEXT NOT NULL,
    session_id TEXT,
    embedding TEXT
  )
`;

const INDEXES_SQL = [
  'CREATE INDEX IF NOT EXISTS idx_memories_soul_id ON memories(soul_id)',
  'CREATE INDEX IF NOT EXISTS idx_memories_type ON memories(type)',
  'CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp)',
  'CREATE INDEX IF NOT EXISTS idx_memories_strength ON memories(current_strength)',
];

interface Vocabulary {
  terms: string[];
  idf: Map<string, number>;
  documentCount: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function computeTF(tokens: string[]): Map<string, number> {
  const freq = new Map<string, number>();
  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }
  const max = Math.max(...freq.values(), 1);
  const tf = new Map<string, number>();
  for (const [term, count] of freq) {
    tf.set(term, count / max);
  }
  return tf;
}

function buildVocabulary(documents: string[]): Vocabulary {
  const docFreq = new Map<string, number>();
  const allTerms = new Set<string>();
  const n = documents.length;

  for (const doc of documents) {
    const unique = new Set(tokenize(doc));
    for (const term of unique) {
      allTerms.add(term);
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  for (const [term, df] of docFreq) {
    idf.set(term, Math.log((n + 1) / (df + 1)) + 1);
  }

  return { terms: Array.from(allTerms), idf, documentCount: n };
}

function computeTFIDFVector(text: string, vocab: Vocabulary): number[] {
  const tokens = tokenize(text);
  const tf = computeTF(tokens);
  const vector: number[] = new Array(vocab.terms.length).fill(0);

  for (let i = 0; i < vocab.terms.length; i++) {
    const term = vocab.terms[i];
    const tfVal = tf.get(term) || 0;
    const idfVal = vocab.idf.get(term) || 0;
    vector[i] = tfVal * idfVal;
  }

  return vector;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

function safeJsonParse(value: unknown, fallback: unknown = []): unknown {
  if (typeof value !== 'string') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function rowToMemory(row: Record<string, unknown>): Memory {
  return {
    id: row.id as string,
    type: row.type as MemoryType,
    content: row.content as string,
    timestamp: row.timestamp as number,
    importance: row.importance as number,
    emotionalWeight: row.emotional_weight as number,
    associations: safeJsonParse(row.associations, []) as string[],
    concepts: safeJsonParse(row.concepts, []) as string[],
    decayRate: row.decay_rate as number,
    currentStrength: row.current_strength as number,
    soulId: row.soul_id as string,
    sessionId: (row.session_id as string) || undefined,
    embedding: row.embedding ? safeJsonParse(row.embedding, undefined) as number[] | undefined : undefined,
  };
}

export class Athenaeum {
  readonly db: Database.Database;

  getDb(): Database.Database {
    return this.db;
  }

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(MEMORY_TABLE_SQL);
    for (const sql of INDEXES_SQL) {
      this.db.exec(sql);
    }
  }

  store(memory: Omit<Memory, 'embedding'> & { id?: string }): Memory {
    const id = memory.id ?? generateId();
    const decayRate = memory.decayRate ?? DECAY_RATES[memory.type];
    const currentStrength = memory.currentStrength ?? 1.0;

    const full: Memory = {
      ...memory,
      id,
      decayRate,
      currentStrength,
      embedding: undefined,
    };

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO memories
        (id, type, content, timestamp, importance, emotional_weight,
         associations, concepts, decay_rate, current_strength,
         soul_id, session_id, embedding)
      VALUES
        (@id, @type, @content, @timestamp, @importance, @emotionalWeight,
         @associations, @concepts, @decayRate, @currentStrength,
         @soulId, @sessionId, @embedding)
    `);

    stmt.run({
      id: full.id,
      type: full.type,
      content: full.content,
      timestamp: full.timestamp,
      importance: full.importance,
      emotionalWeight: full.emotionalWeight,
      associations: JSON.stringify(full.associations),
      concepts: JSON.stringify(full.concepts),
      decayRate: full.decayRate,
      currentStrength: full.currentStrength,
      soulId: full.soulId,
      sessionId: full.sessionId || null,
      embedding: null,
    });

    return full;
  }

  recall(query: MemoryQuery): Memory[] {
    const conditions: string[] = ['soul_id = @soulId'];
    const params: Record<string, unknown> = { soulId: query.soulId };

    if (query.type) {
      conditions.push('type = @type');
      params.type = query.type;
    }
    if (query.minImportance !== undefined) {
      conditions.push('importance >= @minImportance');
      params.minImportance = query.minImportance;
    }
    if (query.minStrength !== undefined) {
      conditions.push('current_strength >= @minStrength');
      params.minStrength = query.minStrength;
    }
    if (query.since !== undefined) {
      conditions.push('timestamp >= @since');
      params.since = query.since;
    }

    const limit = query.limit ?? 50;
    const where = conditions.join(' AND ');

    let sql = `SELECT * FROM memories WHERE ${where}`;

    if (query.concepts && query.concepts.length > 0) {
      const conceptClauses = query.concepts.map((_, i) => {
        const key = `concept_${i}`;
        params[key] = `%"${query.concepts![i]}"%`;
        return `concepts LIKE @${key}`;
      });
      sql += ` AND (${conceptClauses.join(' OR ')})`;
    }

    sql += ` ORDER BY (importance * current_strength) DESC LIMIT @limit`;
    params.limit = limit;

    const rows = this.db.prepare(sql).all(params) as Record<string, unknown>[];

    if (query.text) {
      return this.rankByRelevance(rows.map(rowToMemory), query.text);
    }

    return rows.map(rowToMemory);
  }

  search(text: string, soulId: string, limit: number = 20): Memory[] {
    const rows = this.db.prepare(
      `SELECT * FROM memories WHERE soul_id = ? AND current_strength > 0.05`
    ).all(soulId) as Record<string, unknown>[];

    if (rows.length === 0) return [];

    const memories = rows.map(rowToMemory);
    return this.rankByRelevance(memories, text).slice(0, limit);
  }

  private rankByRelevance(memories: Memory[], queryText: string): Memory[] {
    if (memories.length === 0) return [];

    const documents = memories.map(m => m.content);
    documents.push(queryText);

    const vocab = buildVocabulary(documents);
    const queryVector = computeTFIDFVector(queryText, vocab);

    const scored = memories.map(m => {
      const memVector = computeTFIDFVector(m.content, vocab);
      const similarity = cosineSimilarity(queryVector, memVector);
      const relevance = similarity * 0.6 + m.importance * 0.2 + m.currentStrength * 0.2;
      return { memory: m, relevance };
    });

    scored.sort((a, b) => b.relevance - a.relevance);
    return scored.map(s => s.memory);
  }

  rebuildEmbeddings(soulId: string): void {
    const rows = this.db.prepare(
      `SELECT * FROM memories WHERE soul_id = ?`
    ).all(soulId) as Record<string, unknown>[];

    if (rows.length === 0) return;

    const documents = rows.map(r => r.content as string);
    const vocab = buildVocabulary(documents);

    const update = this.db.prepare(
      `UPDATE memories SET embedding = ? WHERE id = ?`
    );

    const transaction = this.db.transaction(() => {
      for (const row of rows) {
        const vector = computeTFIDFVector(row.content as string, vocab);
        update.run(JSON.stringify(vector), row.id as string);
      }
    });

    transaction();
  }

  decay(soulId?: string): number {
    const where = soulId
      ? 'WHERE current_strength > 0.01 AND soul_id = ?'
      : 'WHERE current_strength > 0.01';
    const params = soulId ? [soulId] : [];
    const rows = this.db.prepare(
      `SELECT id, type, timestamp, current_strength, decay_rate, importance, emotional_weight
       FROM memories ${where}`
    ).all(...params) as Record<string, unknown>[];

    let decayed = 0;

    const update = this.db.prepare(
      `UPDATE memories SET current_strength = ? WHERE id = ?`
    );

    const transaction = this.db.transaction(() => {
      for (const row of rows) {
        const days = daysSince(row.timestamp as number);
        const rate = row.decay_rate as number;
        const importance = row.importance as number;
        const emotionalWeight = row.emotional_weight as number;

        const protectionFactor = 1 - (importance * 0.3 + emotionalWeight * 0.2);
        const effectiveRate = rate * protectionFactor;
        const newStrength = clamp(Math.pow(1 - effectiveRate, days), 0, 1);

        if (newStrength !== (row.current_strength as number)) {
          update.run(newStrength, row.id as string);
          decayed++;
        }
      }
    });

    transaction();
    return decayed;
  }

  getStats(soulId?: string): MemoryStats {
    const where = soulId ? 'WHERE soul_id = ?' : '';
    const params = soulId ? [soulId] : [];

    const total = (this.db.prepare(
      `SELECT COUNT(*) as count FROM memories ${where}`
    ).get(...params) as { count: number }).count;

    if (total === 0) {
      return {
        total: 0,
        byType: { episodic: 0, semantic: 0, procedural: 0, 'self-model': 0 },
        avgStrength: 0,
        avgImportance: 0,
        oldestTimestamp: 0,
        newestTimestamp: 0,
      };
    }

    const byTypeRows = this.db.prepare(
      `SELECT type, COUNT(*) as count FROM memories ${where} GROUP BY type`
    ).all(...params) as { type: string; count: number }[];

    const byType: Record<MemoryType, number> = {
      episodic: 0,
      semantic: 0,
      procedural: 0,
      'self-model': 0,
    };

    for (const row of byTypeRows) {
      byType[row.type as MemoryType] = row.count;
    }

    const agg = this.db.prepare(
      `SELECT AVG(current_strength) as avgStrength,
              AVG(importance) as avgImportance,
              MIN(timestamp) as oldest,
              MAX(timestamp) as newest
       FROM memories ${where}`
    ).get(...params) as {
      avgStrength: number;
      avgImportance: number;
      oldest: number;
      newest: number;
    };

    return {
      total,
      byType,
      avgStrength: agg.avgStrength,
      avgImportance: agg.avgImportance,
      oldestTimestamp: agg.oldest,
      newestTimestamp: agg.newest,
    };
  }

  delete(id: string): boolean {
    const result = this.db.prepare('DELETE FROM memories WHERE id = ?').run(id);
    return result.changes > 0;
  }

  getRecent(soulId: string, limit: number = 20): Memory[] {
    const rows = this.db.prepare(
      `SELECT * FROM memories WHERE soul_id = ?
       ORDER BY timestamp DESC LIMIT ?`
    ).all(soulId, limit) as Record<string, unknown>[];

    return rows.map(rowToMemory);
  }

  getById(id: string): Memory | null {
    const row = this.db.prepare(
      'SELECT * FROM memories WHERE id = ?'
    ).get(id) as Record<string, unknown> | undefined;

    return row ? rowToMemory(row) : null;
  }

  getBySoulAndType(soulId: string, type: MemoryType, limit: number = 100): Memory[] {
    const rows = this.db.prepare(
      `SELECT * FROM memories WHERE soul_id = ? AND type = ?
       ORDER BY (importance * current_strength) DESC LIMIT ?`
    ).all(soulId, type, limit) as Record<string, unknown>[];

    return rows.map(rowToMemory);
  }

  close(): void {
    this.db.close();
  }
}

let defaultInstance: Athenaeum | null = null;

export function createAthenaeum(dbPath: string = './grimoire.db'): Athenaeum {
  if (!defaultInstance || !defaultInstance.db.open) {
    defaultInstance = new Athenaeum(dbPath);
  } else if (defaultInstance.db.name !== dbPath) {
    console.warn(`[Athenaeum] Singleton already open at "${defaultInstance.db.name}", ignoring request for "${dbPath}"`);
  }
  return defaultInstance;
}
