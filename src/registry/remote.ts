// ============================================================
// GrimHub Remote Registry — GitHub-native soul distribution
// Souls are stored in registry/souls/{name}/ in the repo.
// The index is registry/index.json, served via raw.githubusercontent.com.
// ============================================================

import * as https from 'https';
import * as http from 'http';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

const REPO_OWNER = '0x8i11i0n';
const REPO_NAME = 'grimoire';
const BRANCH = 'main';
const RAW_BASE = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}`;
const REGISTRY_INDEX_URL = `${RAW_BASE}/registry/index.json`;
const SOUL_BASE_URL = `${RAW_BASE}/registry/souls`;

export interface RemoteRegistryEntry {
  name: string;
  displayName: string;
  author: string;
  version: string;
  source: string;
  description: string;
  tags: string[];
  authenticityScore: number;
  resonanceScore: number;
  downloads: number;
  rating: number;
  files: string[];
  created: string;
  updated: string;
}

export interface RemoteIndex {
  version: string;
  updated: string;
  total: number;
  souls: RemoteRegistryEntry[];
}

export interface RemoteFilters {
  tag?: string;
  author?: string;
  source?: string;
  minScore?: number;
}

function fetchUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        if (res.headers.location) {
          fetchUrl(res.headers.location).then(resolve).catch(reject);
          return;
        }
      }
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timed out'));
    });
  });
}

/**
 * Fetch the remote registry index from GitHub.
 */
export async function fetchIndex(): Promise<RemoteIndex> {
  const raw = await fetchUrl(REGISTRY_INDEX_URL);
  try {
    return JSON.parse(raw) as RemoteIndex;
  } catch {
    throw new Error('Failed to parse registry index. The registry may be temporarily unavailable.');
  }
}

/**
 * List souls from the remote registry with optional filtering.
 */
export async function listRemote(filters?: RemoteFilters): Promise<RemoteRegistryEntry[]> {
  const index = await fetchIndex();
  let souls = index.souls;

  if (filters?.tag) {
    const tag = filters.tag.toLowerCase();
    souls = souls.filter(s => s.tags.some(t => t.toLowerCase().includes(tag)));
  }
  if (filters?.author) {
    souls = souls.filter(s => s.author.toLowerCase() === filters.author!.toLowerCase());
  }
  if (filters?.source) {
    souls = souls.filter(s => s.source.toLowerCase().includes(filters.source!.toLowerCase()));
  }
  if (filters?.minScore !== undefined) {
    souls = souls.filter(s => s.authenticityScore >= filters.minScore!);
  }

  return souls;
}

/**
 * Search souls in the remote registry.
 */
export async function searchRemote(query: string): Promise<RemoteRegistryEntry[]> {
  const index = await fetchIndex();
  const q = query.toLowerCase();
  return index.souls.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.displayName.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.source.toLowerCase().includes(q) ||
    s.tags.some(t => t.toLowerCase().includes(q))
  );
}

/**
 * Get a single soul entry from the remote registry.
 */
export async function getRemoteEntry(name: string): Promise<RemoteRegistryEntry | null> {
  const index = await fetchIndex();
  return index.souls.find(s => s.name === name.toLowerCase()) ?? null;
}

/**
 * Download a soul from the remote registry into a local directory.
 * Returns the path to the installed soul directory.
 */
export async function downloadSoul(name: string, targetDir: string): Promise<string> {
  const entry = await getRemoteEntry(name);
  if (!entry) {
    throw new Error(`Soul "${name}" not found in the remote registry.`);
  }

  const soulDir = path.join(targetDir, entry.name);
  await fs.mkdir(soulDir, { recursive: true });

  for (const file of entry.files) {
    const url = `${SOUL_BASE_URL}/${entry.name}/${file}`;
    let content: string;
    try {
      content = await fetchUrl(url);
    } catch (err) {
      throw new Error(`Failed to download ${file}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await fs.writeFile(path.join(soulDir, file), content, 'utf-8');
  }

  return soulDir;
}

/**
 * Compute the SHA-256 hash of a local soul directory (for verification).
 */
export async function computeLocalHash(soulDir: string): Promise<string> {
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
 * Generate the JSON entry a contributor needs to add to registry/index.json
 * when submitting a soul via PR.
 */
export function buildRegistryEntry(
  name: string,
  displayName: string,
  author: string,
  version: string,
  source: string,
  description: string,
  tags: string[],
  authenticityScore: number,
  resonanceScore: number,
): RemoteRegistryEntry {
  const today = new Date().toISOString().split('T')[0];
  return {
    name: name.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    displayName,
    author,
    version,
    source,
    description,
    tags,
    authenticityScore,
    resonanceScore,
    downloads: 0,
    rating: 0,
    files: ['core.md', 'full.md', 'state.json'],
    created: today,
    updated: today,
  };
}
