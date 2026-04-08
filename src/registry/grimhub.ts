// ============================================================
// The Soul Summoner's Grimoire — GrimHub Registry
// Local soul registry with SQLite index and integrity verification
// ============================================================

import Database from 'better-sqlite3';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { RegistryEntry, generateId } from '../core/types';

const REGISTRY_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS registry (
    name TEXT PRIMARY KEY,
    display_name TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT 'unknown',
    version TEXT NOT NULL DEFAULT '1.0.0',
    description TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'Original',
    authenticity_score REAL NOT NULL DEFAULT 0.0,
    resonance_score REAL NOT NULL DEFAULT 0.0,
    downloads INTEGER NOT NULL DEFAULT 0,
    total_rating REAL NOT NULL DEFAULT 0.0,
    rating_count INTEGER NOT NULL DEFAULT 0,
    tags TEXT NOT NULL DEFAULT '[]',
    created INTEGER NOT NULL,
    updated INTEGER NOT NULL,
    hash TEXT NOT NULL DEFAULT '',
    soul_path TEXT NOT NULL DEFAULT ''
  )
`;

const REGISTRY_INDEXES_SQL = [
  'CREATE INDEX IF NOT EXISTS idx_registry_author ON registry(author)',
  'CREATE INDEX IF NOT EXISTS idx_registry_source ON registry(source)',
  'CREATE INDEX IF NOT EXISTS idx_registry_updated ON registry(updated)',
  'CREATE INDEX IF NOT EXISTS idx_registry_authenticity ON registry(authenticity_score)',
  'CREATE INDEX IF NOT EXISTS idx_registry_resonance ON registry(resonance_score)',
];

const REQUIRED_SOUL_FILES = ['core.md', 'full.md', 'state.json'];

interface RegistryFilters {
  author?: string;
  source?: string;
  tag?: string;
  minAuthenticity?: number;
  minResonance?: number;
  limit?: number;
  offset?: number;
}

interface RegistryRow {
  name: string;
  display_name: string;
  author: string;
  version: string;
  description: string;
  source: string;
  authenticity_score: number;
  resonance_score: number;
  downloads: number;
  total_rating: number;
  rating_count: number;
  tags: string;
  created: number;
  updated: number;
  hash: string;
  soul_path: string;
}

/**
 * GrimHub — a local registry for discovering, sharing, and managing
 * grimoire souls. Backed by a SQLite database for fast querying,
 * with SHA-256 integrity hashing and quality score tracking.
 */
export class GrimHub {
  private db: Database.Database | null = null;

  /**
   * Initialize the registry database. Creates tables and indexes
   * if they do not already exist.
   */
  initialize(dbPath: string): void {
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.exec(REGISTRY_TABLE_SQL);
    for (const sql of REGISTRY_INDEXES_SQL) {
      this.db.exec(sql);
    }
  }

  /**
   * Publish a soul to the registry. Validates the soul directory,
   * computes an integrity hash, and inserts/updates the registry entry.
   */
  async publish(soulDir: string, author: string): Promise<RegistryEntry> {
    this.ensureDb();

    const validation = await this.validate(soulDir);
    if (!validation.valid) {
      throw new Error(`Soul validation failed: ${validation.errors.join('; ')}`);
    }

    const stateRaw = await fs.readFile(path.join(soulDir, 'state.json'), 'utf-8');
    const state = JSON.parse(stateRaw);
    const identity = state.identity ?? {};

    const name = (identity.name ?? path.basename(soulDir)).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const displayName = identity.name ?? path.basename(soulDir);
    const source = identity.source ?? 'Original';
    const version = identity.version ?? '1.0.0';
    const description = this.extractDescription(soulDir, identity);
    const hash = await this.computeHash(soulDir);
    const now = Date.now();

    const existing = this.getDb().prepare('SELECT name FROM registry WHERE name = ?').get(name);

    if (existing) {
      this.getDb().prepare(`
        UPDATE registry SET
          display_name = ?, author = ?, version = ?, description = ?,
          source = ?, hash = ?, soul_path = ?, updated = ?
        WHERE name = ?
      `).run(displayName, author, version, description, source, hash, soulDir, now, name);
    } else {
      this.getDb().prepare(`
        INSERT INTO registry (
          name, display_name, author, version, description, source,
          authenticity_score, resonance_score, downloads, total_rating,
          rating_count, tags, created, updated, hash, soul_path
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, '[]', ?, ?, ?, ?)
      `).run(name, displayName, author, version, description, source, now, now, hash, soulDir);
    }

    return this.getEntry(name)!;
  }

  /**
   * List all registered souls, with optional filtering.
   */
  list(filters?: RegistryFilters): RegistryEntry[] {
    this.ensureDb();

    const conditions: string[] = [];
    const params: unknown[] = [];

    if (filters?.author) {
      conditions.push('author = ?');
      params.push(filters.author);
    }
    if (filters?.source) {
      conditions.push('source = ?');
      params.push(filters.source);
    }
    if (filters?.tag) {
      conditions.push("tags LIKE ?");
      params.push(`%"${filters.tag}"%`);
    }
    if (filters?.minAuthenticity !== undefined) {
      conditions.push('authenticity_score >= ?');
      params.push(filters.minAuthenticity);
    }
    if (filters?.minResonance !== undefined) {
      conditions.push('resonance_score >= ?');
      params.push(filters.minResonance);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters?.limit ?? 100;
    const offset = filters?.offset ?? 0;

    const rows = this.getDb()
      .prepare(`SELECT * FROM registry ${where} ORDER BY updated DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as RegistryRow[];

    return rows.map(row => this.rowToEntry(row));
  }

  /**
   * Full-text search across name, display name, description, and tags.
   */
  search(query: string): RegistryEntry[] {
    this.ensureDb();
    const pattern = `%${query.toLowerCase()}%`;

    const rows = this.getDb().prepare(`
      SELECT * FROM registry
      WHERE LOWER(name) LIKE ?
         OR LOWER(display_name) LIKE ?
         OR LOWER(description) LIKE ?
         OR LOWER(tags) LIKE ?
      ORDER BY downloads DESC, updated DESC
      LIMIT 50
    `).all(pattern, pattern, pattern, pattern) as RegistryRow[];

    return rows.map(row => this.rowToEntry(row));
  }

  /**
   * Install a soul from the registry into a target directory.
   * Copies all soul files and increments the download counter.
   */
  async install(name: string, targetDir: string): Promise<string> {
    this.ensureDb();

    const entry = this.getEntry(name);
    if (!entry) {
      throw new Error(`Soul "${name}" not found in registry`);
    }

    const row = this.getDb().prepare('SELECT soul_path FROM registry WHERE name = ?').get(name) as { soul_path: string } | undefined;
    if (!row?.soul_path) {
      throw new Error(`Soul "${name}" has no source path in registry`);
    }

    const destDir = path.join(targetDir, name);
    await fs.mkdir(destDir, { recursive: true });

    const entries = await fs.readdir(row.soul_path);
    for (const file of entries) {
      const srcFile = path.join(row.soul_path, file);
      const destFile = path.join(destDir, file);
      const stat = await fs.stat(srcFile);
      if (stat.isFile()) {
        await fs.copyFile(srcFile, destFile);
      }
    }

    this.getDb().prepare('UPDATE registry SET downloads = downloads + 1 WHERE name = ?').run(name);

    return destDir;
  }

  /**
   * Remove a soul from the registry index. Does not delete soul files.
   */
  remove(name: string): boolean {
    this.ensureDb();
    const result = this.getDb().prepare('DELETE FROM registry WHERE name = ?').run(name);
    return result.changes > 0;
  }

  /**
   * Get a single registry entry by name.
   */
  getEntry(name: string): RegistryEntry | null {
    this.ensureDb();
    const row = this.getDb().prepare('SELECT * FROM registry WHERE name = ?').get(name) as RegistryRow | undefined;
    return row ? this.rowToEntry(row) : null;
  }

  /**
   * Add a rating (1-5) for a soul. Updates the running average.
   */
  rate(name: string, rating: number): void {
    this.ensureDb();
    const clamped = Math.max(1, Math.min(5, Math.round(rating)));

    const entry = this.getEntry(name);
    if (!entry) {
      throw new Error(`Soul "${name}" not found in registry`);
    }

    this.getDb().prepare(`
      UPDATE registry
      SET total_rating = total_rating + ?,
          rating_count = rating_count + 1,
          updated = ?
      WHERE name = ?
    `).run(clamped, Date.now(), name);
  }

  /**
   * Get the most popular souls by average rating (minimum 1 rating required).
   */
  getPopular(limit: number = 10): RegistryEntry[] {
    this.ensureDb();

    const rows = this.getDb().prepare(`
      SELECT *, (total_rating / MAX(rating_count, 1)) AS avg_rating
      FROM registry
      WHERE rating_count >= 1
      ORDER BY avg_rating DESC, downloads DESC
      LIMIT ?
    `).all(limit) as RegistryRow[];

    return rows.map(row => this.rowToEntry(row));
  }

  /**
   * Compute a SHA-256 hash over all soul files in the directory.
   * Files are sorted by name for deterministic output.
   */
  async computeHash(soulDir: string): Promise<string> {
    const entries = await fs.readdir(soulDir);
    const files = entries.filter(f => !f.startsWith('.')).sort();

    const hasher = crypto.createHash('sha256');

    for (const file of files) {
      const filePath = path.join(soulDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        const content = await fs.readFile(filePath);
        hasher.update(file);
        hasher.update(content);
      }
    }

    return hasher.digest('hex');
  }

  /**
   * Validate that a soul directory has the required files and valid state.
   */
  async validate(soulDir: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    for (const file of REQUIRED_SOUL_FILES) {
      try {
        await fs.access(path.join(soulDir, file));
      } catch {
        errors.push(`Missing required file: ${file}`);
      }
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    try {
      const stateRaw = await fs.readFile(path.join(soulDir, 'state.json'), 'utf-8');
      const state = JSON.parse(stateRaw);

      if (!state.identity?.name) {
        errors.push('state.json missing identity.name');
      }
    } catch (err) {
      errors.push(`Invalid state.json: ${err instanceof Error ? err.message : String(err)}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Export the full registry as a JSON-serializable array.
   */
  exportRegistry(): RegistryEntry[] {
    this.ensureDb();
    const rows = this.getDb().prepare('SELECT * FROM registry ORDER BY name').all() as RegistryRow[];
    return rows.map(row => this.rowToEntry(row));
  }

  /**
   * Bulk import registry entries from a JSON array.
   * Existing entries with the same name are updated.
   */
  importRegistry(data: RegistryEntry[]): number {
    this.ensureDb();

    const insert = this.getDb().prepare(`
      INSERT OR REPLACE INTO registry (
        name, display_name, author, version, description, source,
        authenticity_score, resonance_score, downloads, total_rating,
        rating_count, tags, created, updated, hash, soul_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '')
    `);

    const runImport = this.getDb().transaction((entries: RegistryEntry[]) => {
      let count = 0;
      for (const entry of entries) {
        insert.run(
          entry.name,
          entry.displayName,
          entry.author,
          entry.version,
          entry.description,
          entry.source,
          entry.authenticityScore,
          entry.resonanceScore,
          entry.downloads,
          entry.rating * (entry.downloads || 1), // reconstruct total_rating
          entry.downloads || 0, // approximate rating_count
          JSON.stringify(entry.tags),
          entry.created,
          entry.updated,
          entry.hash,
        );
        count++;
      }
      return count;
    });

    return runImport(data);
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // --- Private Helpers ---

  private getDb(): Database.Database {
    if (!this.db) {
      throw new Error('GrimHub not initialized. Call initialize() first.');
    }
    return this.db;
  }

  private ensureDb(): void {
    this.getDb();
  }

  private rowToEntry(row: RegistryRow): RegistryEntry {
    const ratingCount = row.rating_count || 0;
    const avgRating = ratingCount > 0 ? row.total_rating / ratingCount : 0;

    return {
      name: row.name,
      displayName: row.display_name,
      author: row.author,
      version: row.version,
      description: row.description,
      source: row.source,
      authenticityScore: row.authenticity_score,
      resonanceScore: row.resonance_score,
      downloads: row.downloads,
      rating: Math.round(avgRating * 10) / 10,
      tags: JSON.parse(row.tags),
      created: row.created,
      updated: row.updated,
      hash: row.hash,
    };
  }

  private extractDescription(soulDir: string, identity: Record<string, unknown>): string {
    if (typeof identity.description === 'string') {
      return identity.description;
    }
    const name = identity.name ?? path.basename(soulDir);
    const source = identity.source ?? 'Original';
    return `${name} from ${source}`;
  }
}
