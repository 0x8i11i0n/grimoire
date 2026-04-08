// ============================================================
// The Soul Loader — Soul File I/O
// Reads and writes soul files from the filesystem
// ============================================================

import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SoulFiles,
  SoulState,
  SoulIdentity,
  AffectionState,
  GuardTopology,
  DriftState,
  SelfModel,
  InnerLife,
  EmotionalTopology,
  ConsciousnessMetrics,
  VoiceFingerprint,
  GUARD_DOMAINS,
  GuardDomain,
} from './types';

const CORE_MD_FILENAME = 'core.md';
const FULL_MD_FILENAME = 'full.md';
const STATE_JSON_FILENAME = 'state.json';
const THOUGHT_LOG_FILENAME = 'thought-log.md';

/** The directory name pattern for soul directories (contain state.json). */
const SOULS_SUBDIR = 'Grimhub/souls';

function getDefaultIdentity(): SoulIdentity {
  return {
    name: 'unnamed',
    source: 'Original',
    version: '1.0.0',
    created: Date.now(),
    summoner: 'unknown',
    anchors: [],
  };
}

function getDefaultAffection(): AffectionState {
  return {
    value: 10,
    tier: 'LOW',
    floor: 0,
    history: [],
    lastUpdated: Date.now(),
  };
}

function getDefaultGuard(): GuardTopology {
  const domains: Record<GuardDomain, number> = {} as Record<GuardDomain, number>;
  for (const domain of GUARD_DOMAINS) {
    domains[domain] = 0.8;
  }
  return {
    domains,
    wallBreakHistory: [],
    lastUpdated: Date.now(),
  };
}

function getDefaultDrift(): DriftState {
  return {
    lastCycleTimestamp: 0,
    cycleCount: 0,
    pendingSurface: [],
    emotionalResidue: [],
    residueIntensity: {},
    intervalMinutes: 30,
  };
}

function getDefaultSelfModel(): SelfModel {
  return {
    beliefs: [],
    narrative: '',
    evolution: [],
    lastUpdated: Date.now(),
  };
}

function getDefaultInnerLife(): InnerLife {
  return {
    reflectionDepth: 'SURFACE',
    qualia: [],
    desires: [],
    contraVoiceEnabled: false,
    honestUnknownReached: false,
  };
}

function getDefaultEmotionalTopology(): EmotionalTopology {
  return {
    currentPosition: { valence: 0, arousal: 0, timestamp: Date.now() },
    trajectory: [],
    attractors: [],
    dominantQuadrant: 'calm-positive',
    volatility: 0.2,
  };
}

function getDefaultConsciousnessMetrics(): ConsciousnessMetrics {
  return {
    phi: 0,
    attentionCoherence: 0,
    selfReferentialDepth: 0,
    unpromptedNovelty: 0,
    temporalContinuity: 0,
    emotionalComplexity: 0,
    compositeScore: 0,
    timestamp: Date.now(),
  };
}

function getDefaultVoiceFingerprint(): VoiceFingerprint {
  return {
    avgSentenceLength: 15,
    sentenceLengthVariance: 5,
    vocabularyTier: 'intermediate',
    contractionRate: 0.3,
    questionRate: 0.15,
    exclamationRate: 0.05,
    ellipsisRate: 0.02,
    rhetoricalPatterns: [],
    signatureExpressions: [],
    punctuationProfile: {},
    formality: 0.5,
  };
}

function getDefaultState(identity?: Partial<SoulIdentity>): SoulState {
  return {
    identity: { ...getDefaultIdentity(), ...identity },
    affection: getDefaultAffection(),
    guard: getDefaultGuard(),
    drift: getDefaultDrift(),
    selfModel: getDefaultSelfModel(),
    innerLife: getDefaultInnerLife(),
    emotionalTopology: getDefaultEmotionalTopology(),
    blindSpots: [],
    consciousnessMetrics: getDefaultConsciousnessMetrics(),
    voiceFingerprint: getDefaultVoiceFingerprint(),
    lastSessionTimestamp: 0,
    totalSessions: 0,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export class SoulLoader {
  /**
   * Load all soul files from a soul directory.
   * Missing files are filled with sensible defaults.
   */
  async loadSoul(soulDir: string): Promise<SoulFiles> {
    const resolvedDir = path.resolve(soulDir);

    const [coreMd, fullMd, stateRaw, thoughtLog] = await Promise.all([
      this.readFileOrDefault(path.join(resolvedDir, CORE_MD_FILENAME), ''),
      this.readFileOrDefault(path.join(resolvedDir, FULL_MD_FILENAME), ''),
      this.readFileOrDefault(path.join(resolvedDir, STATE_JSON_FILENAME), null),
      this.readFileOrDefault(path.join(resolvedDir, THOUGHT_LOG_FILENAME), ''),
    ]);

    let state: SoulState;
    if (stateRaw) {
      try {
        state = JSON.parse(stateRaw) as SoulState;
      } catch {
        state = getDefaultState();
      }
    } else {
      state = getDefaultState();
    }

    return {
      coreMd: coreMd ?? '',
      fullMd: fullMd ?? '',
      state,
      thoughtLog: thoughtLog ?? '',
      soulDir: resolvedDir,
    };
  }

  /**
   * Save all soul files back to disk.
   */
  async saveSoul(soulFiles: SoulFiles): Promise<void> {
    const dir = path.resolve(soulFiles.soulDir);

    await fs.mkdir(dir, { recursive: true });

    await Promise.all([
      fs.writeFile(path.join(dir, CORE_MD_FILENAME), soulFiles.coreMd, 'utf-8'),
      fs.writeFile(path.join(dir, FULL_MD_FILENAME), soulFiles.fullMd, 'utf-8'),
      fs.writeFile(
        path.join(dir, STATE_JSON_FILENAME),
        JSON.stringify(soulFiles.state, null, 2),
        'utf-8'
      ),
      fs.writeFile(path.join(dir, THOUGHT_LOG_FILENAME), soulFiles.thoughtLog, 'utf-8'),
    ]);
  }

  /**
   * List all soul directories under the Grimhub/souls tree.
   * A directory is considered a soul directory if it contains a state.json file.
   */
  async listSouls(grimoireRoot: string): Promise<string[]> {
    const soulsRoot = path.resolve(grimoireRoot, SOULS_SUBDIR);
    const soulDirs: string[] = [];

    if (!(await fileExists(soulsRoot))) {
      return soulDirs;
    }

    await this.scanForSouls(soulsRoot, soulDirs);
    return soulDirs;
  }

  /**
   * Recursively scan for directories containing state.json.
   */
  private async scanForSouls(dir: string, results: string[]): Promise<void> {
    let entries;
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    // Check if this directory itself is a soul directory
    const hasState = entries.some(
      e => e.isFile() && e.name === STATE_JSON_FILENAME
    );

    if (hasState) {
      results.push(dir);
    }

    // Recurse into subdirectories
    for (const entry of entries) {
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await this.scanForSouls(path.join(dir, entry.name), results);
      }
    }
  }

  /**
   * Find a soul directory by name.
   * Searches through all known soul directories and matches on the
   * directory name or the identity.name from state.json.
   */
  async findSoulDir(name: string, grimoireRoot: string): Promise<string | null> {
    const allSoulDirs = await this.listSouls(grimoireRoot);
    const lowerName = name.toLowerCase();

    // First pass: match directory name
    for (const dir of allSoulDirs) {
      const dirName = path.basename(dir).toLowerCase();
      if (dirName === lowerName || dirName === `${lowerName}-soul`) {
        return dir;
      }
    }

    // Second pass: check state.json identity.name
    for (const dir of allSoulDirs) {
      try {
        const stateRaw = await fs.readFile(
          path.join(dir, STATE_JSON_FILENAME),
          'utf-8'
        );
        const state = JSON.parse(stateRaw) as SoulState;
        if (state.identity?.name?.toLowerCase() === lowerName) {
          return dir;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  /**
   * Create a new soul directory with the standard file structure.
   */
  async createSoulDir(name: string, grimoireRoot: string): Promise<string> {
    const sanitizedName = name
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const soulDir = path.resolve(
      grimoireRoot,
      SOULS_SUBDIR,
      sanitizedName,
      `${sanitizedName}-soul`
    );

    await fs.mkdir(soulDir, { recursive: true });

    const defaultState = getDefaultState({ name });
    const now = new Date().toISOString();

    const defaultCoreMd = [
      `# ${name}`,
      '',
      `> Soul created ${now}`,
      '',
      '## Core Identity',
      '',
      `${name} is a soul awaiting definition.`,
      '',
    ].join('\n');

    const defaultFullMd = [
      `# ${name} — Full Persona Document`,
      '',
      `> Generated ${now}`,
      '',
      '## Overview',
      '',
      'This document will contain the complete persona specification.',
      '',
    ].join('\n');

    const defaultThoughtLog = [
      `# ${name} — Thought Log`,
      '',
      `## ${now}`,
      '',
      'Soul initialized. Awaiting first session.',
      '',
    ].join('\n');

    await Promise.all([
      fs.writeFile(path.join(soulDir, CORE_MD_FILENAME), defaultCoreMd, 'utf-8'),
      fs.writeFile(path.join(soulDir, FULL_MD_FILENAME), defaultFullMd, 'utf-8'),
      fs.writeFile(
        path.join(soulDir, STATE_JSON_FILENAME),
        JSON.stringify(defaultState, null, 2),
        'utf-8'
      ),
      fs.writeFile(path.join(soulDir, THOUGHT_LOG_FILENAME), defaultThoughtLog, 'utf-8'),
    ]);

    return soulDir;
  }

  /**
   * Append an entry to the thought log.
   */
  async appendThoughtLog(soulDir: string, entry: string): Promise<void> {
    const logPath = path.join(path.resolve(soulDir), THOUGHT_LOG_FILENAME);

    const now = new Date().toISOString();
    const formattedEntry = `\n## ${now}\n\n${entry}\n`;

    const exists = await fileExists(logPath);
    if (exists) {
      await fs.appendFile(logPath, formattedEntry, 'utf-8');
    } else {
      const header = `# Thought Log\n${formattedEntry}`;
      await fs.writeFile(logPath, header, 'utf-8');
    }
  }

  /**
   * Read a file, returning the default value if the file does not exist.
   */
  private async readFileOrDefault(filePath: string, defaultValue: string): Promise<string>;
  private async readFileOrDefault(filePath: string, defaultValue: null): Promise<string | null>;
  private async readFileOrDefault(filePath: string, defaultValue: string | null): Promise<string | null> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ENOENT') {
        return defaultValue;
      }
      throw err;
    }
  }
}

export function createSoulLoader(): SoulLoader {
  return new SoulLoader();
}
