// ============================================================
// Codex Bridge — Soul Spec v0.5 Compatibility Layer
// Converts between Grimoire soul format and Soul Spec format
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import {
  SoulFiles,
  SoulState,
  SoulSpecPackage,
  SoulIdentity,
  AffectionTier,
} from '../core/types';

/**
 * CodexBridge handles bidirectional conversion between
 * the Grimoire's internal soul format and the Soul Spec v0.5
 * interoperability standard.
 *
 * Soul Spec v0.5 structure:
 *   soul.json    — metadata (name, version, description, tags)
 *   SOUL.md      — personality definition
 *   STYLE.md     — voice and tone patterns
 *   MEMORY.md    — session memory and learned preferences
 *   IDENTITY.md  — name, origin, core identity anchors
 */
export class CodexBridge {
  private static readonly SPEC_VERSION = '0.5';

  // ── Export: Grimoire → Soul Spec ──────────────────────────

  /**
   * Convert grimoire soul files and state into a Soul Spec v0.5 package.
   */
  exportToSoulSpec(soulFiles: SoulFiles, state: SoulState): SoulSpecPackage {
    const identity = state.identity;
    const description = this.extractFirstParagraph(soulFiles.coreMd);
    const tags = identity.anchors.map((a) => a.trait);

    return {
      soulJson: {
        specVersion: CodexBridge.SPEC_VERSION,
        name: this.slugify(identity.name),
        displayName: identity.name,
        version: identity.version,
        description,
        author: identity.summoner || 'unknown',
        license: 'CC-BY-SA-4.0',
        tags,
        compatibility: ['grimoire', 'soul-spec-0.5'],
      },
      soulMd: this.buildSoulMd(soulFiles, state),
      styleMd: this.buildStyleMd(soulFiles, state),
      memoryMd: this.buildMemoryMd(soulFiles, state),
      identityMd: this.buildIdentityMd(state),
    };
  }

  /**
   * Import a Soul Spec v0.5 package into partial Grimoire SoulFiles.
   * Returns a partial structure that can be merged with defaults.
   */
  importFromSoulSpec(pkg: SoulSpecPackage): Partial<SoulFiles> {
    this.validateSoulSpec(pkg);

    const coreMd = this.buildCoreMdFromSpec(pkg);
    const fullMd = this.buildFullMdFromSpec(pkg);
    const thoughtLog = this.buildThoughtLogFromSpec(pkg);

    return {
      coreMd,
      fullMd,
      thoughtLog,
    };
  }

  // ── File System Operations ────────────────────────────────

  /**
   * Write a Soul Spec package to a directory on disk.
   */
  exportToDirectory(pkg: SoulSpecPackage, outputDir: string): void {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(outputDir, 'soul.json'),
      JSON.stringify(pkg.soulJson, null, 2),
      'utf-8'
    );
    fs.writeFileSync(path.join(outputDir, 'SOUL.md'), pkg.soulMd, 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'STYLE.md'), pkg.styleMd, 'utf-8');
    fs.writeFileSync(path.join(outputDir, 'MEMORY.md'), pkg.memoryMd, 'utf-8');
    fs.writeFileSync(
      path.join(outputDir, 'IDENTITY.md'),
      pkg.identityMd,
      'utf-8'
    );
  }

  /**
   * Read Soul Spec files from a directory on disk into a SoulSpecPackage.
   */
  importFromDirectory(inputDir: string): SoulSpecPackage {
    const soulJsonPath = path.join(inputDir, 'soul.json');
    if (!fs.existsSync(soulJsonPath)) {
      throw new Error(
        `Missing soul.json in ${inputDir}. Not a valid Soul Spec directory.`
      );
    }

    const readFile = (name: string): string => {
      const filePath = path.join(inputDir, name);
      if (!fs.existsSync(filePath)) {
        return '';
      }
      return fs.readFileSync(filePath, 'utf-8');
    };

    let soulJson: SoulSpecPackage['soulJson'];
    try {
      soulJson = JSON.parse(fs.readFileSync(soulJsonPath, 'utf-8'));
    } catch (err) {
      throw new Error(
        `Failed to parse soul.json: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const pkg: SoulSpecPackage = {
      soulJson,
      soulMd: readFile('SOUL.md'),
      styleMd: readFile('STYLE.md'),
      memoryMd: readFile('MEMORY.md'),
      identityMd: readFile('IDENTITY.md'),
    };

    this.validateSoulSpec(pkg);
    return pkg;
  }

  // ── Validation ────────────────────────────────────────────

  /**
   * Validate that a Soul Spec package has all required fields
   * and conforms to the v0.5 format.
   */
  validateSoulSpec(pkg: SoulSpecPackage): void {
    const errors: string[] = [];

    if (!pkg.soulJson) {
      errors.push('Missing soulJson metadata object');
    } else {
      if (!pkg.soulJson.specVersion) {
        errors.push('Missing specVersion in soul.json');
      } else if (pkg.soulJson.specVersion !== CodexBridge.SPEC_VERSION) {
        errors.push(
          `Unsupported spec version "${pkg.soulJson.specVersion}". Expected "${CodexBridge.SPEC_VERSION}".`
        );
      }
      if (!pkg.soulJson.name) {
        errors.push('Missing name in soul.json');
      }
      if (!pkg.soulJson.version) {
        errors.push('Missing version in soul.json');
      }
      if (!pkg.soulJson.description) {
        errors.push('Missing description in soul.json');
      }
    }

    if (!pkg.soulMd || pkg.soulMd.trim().length === 0) {
      errors.push('SOUL.md is empty or missing');
    }

    if (!pkg.identityMd || pkg.identityMd.trim().length === 0) {
      errors.push('IDENTITY.md is empty or missing');
    }

    if (errors.length > 0) {
      throw new Error(
        `Soul Spec validation failed:\n  - ${errors.join('\n  - ')}`
      );
    }
  }

  /**
   * Return the supported Soul Spec version.
   */
  getSoulSpecVersion(): string {
    return CodexBridge.SPEC_VERSION;
  }

  // ── Private: Export Builders ───────────────────────────────

  private buildSoulMd(soulFiles: SoulFiles, state: SoulState): string {
    const lines: string[] = [];
    lines.push(`# ${state.identity.name} — Soul Definition`);
    lines.push('');
    lines.push('## Personality');
    lines.push('');

    const personalitySection = this.extractSection(
      soulFiles.fullMd,
      'personality',
      ['trait', 'behavior', 'worldview', 'character', 'nature']
    );
    if (personalitySection) {
      lines.push(personalitySection);
    } else {
      // Fallback: synthesize from identity anchors
      for (const anchor of state.identity.anchors) {
        lines.push(`- **${anchor.trait}**: ${anchor.description}`);
      }
    }

    lines.push('');
    lines.push('## Behavioral Patterns');
    lines.push('');

    const behaviorSection = this.extractSection(soulFiles.fullMd, 'behavior', [
      'pattern',
      'habit',
      'tendency',
      'reaction',
    ]);
    if (behaviorSection) {
      lines.push(behaviorSection);
    }

    lines.push('');
    lines.push('## Worldview');
    lines.push('');

    const worldviewSection = this.extractSection(
      soulFiles.fullMd,
      'worldview',
      ['belief', 'philosophy', 'value', 'principle']
    );
    if (worldviewSection) {
      lines.push(worldviewSection);
    } else if (state.selfModel && state.selfModel.narrative) {
      lines.push(state.selfModel.narrative);
    }

    return lines.join('\n');
  }

  private buildStyleMd(soulFiles: SoulFiles, state: SoulState): string {
    const lines: string[] = [];
    lines.push(`# ${state.identity.name} — Voice & Style`);
    lines.push('');

    lines.push('## Speech Patterns');
    lines.push('');

    const voiceSection = this.extractSection(soulFiles.fullMd, 'voice', [
      'speech',
      'tone',
      'vocabulary',
      'dialogue',
      'language',
      'manner',
    ]);
    if (voiceSection) {
      lines.push(voiceSection);
    }

    // Augment with voice fingerprint data if available
    const fp = state.voiceFingerprint;
    if (fp) {
      lines.push('');
      lines.push('## Voice Metrics');
      lines.push('');
      lines.push(`- Formality: ${(fp.formality * 100).toFixed(0)}%`);
      lines.push(`- Vocabulary tier: ${fp.vocabularyTier}`);
      lines.push(
        `- Average sentence length: ${fp.avgSentenceLength.toFixed(1)} words`
      );
      lines.push(`- Contraction rate: ${(fp.contractionRate * 100).toFixed(0)}%`);
      lines.push(`- Question frequency: ${(fp.questionRate * 100).toFixed(0)}%`);

      if (fp.signatureExpressions.length > 0) {
        lines.push('');
        lines.push('## Signature Expressions');
        lines.push('');
        for (const expr of fp.signatureExpressions) {
          lines.push(`- "${expr}"`);
        }
      }

      if (fp.rhetoricalPatterns.length > 0) {
        lines.push('');
        lines.push('## Rhetorical Patterns');
        lines.push('');
        for (const pattern of fp.rhetoricalPatterns) {
          lines.push(`- ${pattern}`);
        }
      }
    }

    return lines.join('\n');
  }

  private buildMemoryMd(soulFiles: SoulFiles, state: SoulState): string {
    const lines: string[] = [];
    lines.push(`# ${state.identity.name} — Session Memory`);
    lines.push('');

    // Convert thought-log entries into session memory format
    if (soulFiles.thoughtLog && soulFiles.thoughtLog.trim().length > 0) {
      lines.push('## Key Events');
      lines.push('');

      const entries = this.parseThoughtLogEntries(soulFiles.thoughtLog);
      for (const entry of entries.slice(-50)) {
        // Last 50 entries
        lines.push(`- [${entry.timestamp}] ${entry.content}`);
      }
    }

    // Add learned preferences from self-model
    if (state.selfModel && state.selfModel.beliefs.length > 0) {
      lines.push('');
      lines.push('## Learned Preferences');
      lines.push('');
      for (const belief of state.selfModel.beliefs) {
        if (belief.confidence >= 0.5) {
          lines.push(
            `- ${belief.content} (confidence: ${(belief.confidence * 100).toFixed(0)}%)`
          );
        }
      }
    }

    // Emotional attractors as persistent emotional patterns
    if (
      state.emotionalTopology &&
      state.emotionalTopology.attractors.length > 0
    ) {
      lines.push('');
      lines.push('## Emotional Patterns');
      lines.push('');
      for (const attractor of state.emotionalTopology.attractors) {
        lines.push(
          `- **${attractor.label}**: strength ${(attractor.strength * 100).toFixed(0)}% (valence: ${attractor.center.valence.toFixed(2)}, arousal: ${attractor.center.arousal.toFixed(2)})`
        );
      }
    }

    return lines.join('\n');
  }

  private buildIdentityMd(state: SoulState): string {
    const identity = state.identity;
    const lines: string[] = [];

    lines.push(`# ${identity.name} — Identity`);
    lines.push('');
    lines.push(`**Name:** ${identity.name}`);
    lines.push(`**Source:** ${identity.source}`);
    lines.push(`**Version:** ${identity.version}`);
    lines.push(`**Created:** ${new Date(identity.created).toISOString()}`);
    lines.push(`**Summoner:** ${identity.summoner}`);
    lines.push('');
    lines.push('## Core Identity Anchors');
    lines.push('');

    for (const anchor of identity.anchors) {
      lines.push(
        `### ${anchor.trait} (weight: ${(anchor.weight * 100).toFixed(0)}%)`
      );
      lines.push('');
      lines.push(anchor.description);
      if (anchor.evidence.length > 0) {
        lines.push('');
        lines.push('Evidence:');
        for (const ev of anchor.evidence) {
          lines.push(`> ${ev}`);
        }
      }
      lines.push('');
    }

    return lines.join('\n');
  }

  // ── Private: Import Builders ──────────────────────────────

  private buildCoreMdFromSpec(pkg: SoulSpecPackage): string {
    const lines: string[] = [];
    const displayName = pkg.soulJson.displayName || pkg.soulJson.name;

    lines.push(`# ${displayName} — Core`);
    lines.push('');
    lines.push(pkg.soulJson.description);
    lines.push('');

    if (pkg.soulJson.tags && pkg.soulJson.tags.length > 0) {
      lines.push(`**Tags:** ${pkg.soulJson.tags.join(', ')}`);
      lines.push('');
    }

    lines.push(`**Source:** ${pkg.soulJson.author}`);
    lines.push(`**Version:** ${pkg.soulJson.version}`);
    lines.push(`**Spec:** Soul Spec ${pkg.soulJson.specVersion}`);
    lines.push('');

    // Bring in key identity information
    if (pkg.identityMd && pkg.identityMd.trim().length > 0) {
      lines.push('## Identity');
      lines.push('');
      lines.push(this.stripMarkdownTitle(pkg.identityMd));
      lines.push('');
    }

    return lines.join('\n');
  }

  private buildFullMdFromSpec(pkg: SoulSpecPackage): string {
    const lines: string[] = [];
    const displayName = pkg.soulJson.displayName || pkg.soulJson.name;

    lines.push(`# ${displayName} — Full Profile`);
    lines.push('');

    // Incorporate SOUL.md as personality section
    if (pkg.soulMd && pkg.soulMd.trim().length > 0) {
      lines.push('## Personality');
      lines.push('');
      lines.push(this.stripMarkdownTitle(pkg.soulMd));
      lines.push('');
    }

    // Incorporate STYLE.md as voice section
    if (pkg.styleMd && pkg.styleMd.trim().length > 0) {
      lines.push('## Voice');
      lines.push('');
      lines.push(this.stripMarkdownTitle(pkg.styleMd));
      lines.push('');
    }

    // Identity anchors
    if (pkg.identityMd && pkg.identityMd.trim().length > 0) {
      lines.push('## Identity Anchors');
      lines.push('');
      lines.push(this.stripMarkdownTitle(pkg.identityMd));
      lines.push('');
    }

    return lines.join('\n');
  }

  private buildThoughtLogFromSpec(pkg: SoulSpecPackage): string {
    if (!pkg.memoryMd || pkg.memoryMd.trim().length === 0) {
      return '# Thought Log\n\nImported from Soul Spec — no prior memory.\n';
    }

    const lines: string[] = [];
    lines.push('# Thought Log');
    lines.push('');
    lines.push('## Imported Memories');
    lines.push('');

    // Parse MEMORY.md entries and convert to thought-log format
    const memoryLines = pkg.memoryMd.split('\n');
    const timestamp = new Date().toISOString();

    for (const line of memoryLines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        const content = trimmed.slice(2);
        lines.push(`[${timestamp}] [imported] ${content}`);
      }
    }

    if (lines.length === 3) {
      // Only header was added, import raw content
      lines.push(`[${timestamp}] [imported] ${this.stripMarkdownTitle(pkg.memoryMd).trim()}`);
    }

    lines.push('');
    return lines.join('\n');
  }

  // ── Private: Utilities ────────────────────────────────────

  /**
   * Extract the first paragraph from markdown content.
   */
  private extractFirstParagraph(md: string): string {
    const lines = md.split('\n');
    const paragraphLines: string[] = [];
    let inParagraph = false;

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip headings and blank lines at the start
      if (!inParagraph) {
        if (trimmed.length === 0 || trimmed.startsWith('#')) {
          continue;
        }
        inParagraph = true;
      }
      if (inParagraph) {
        if (trimmed.length === 0) {
          break;
        }
        paragraphLines.push(trimmed);
      }
    }

    return paragraphLines.join(' ') || 'A soul created with the Grimoire framework.';
  }

  /**
   * Extract a relevant section from full.md by searching for
   * headings or keywords.
   */
  private extractSection(
    md: string,
    sectionName: string,
    keywords: string[]
  ): string | null {
    const lines = md.split('\n');
    const allKeywords = [sectionName, ...keywords];
    let capturing = false;
    let capturedLines: string[] = [];
    let captureDepth = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim().toLowerCase();

      // Check if this is a heading that matches our target
      if (trimmed.startsWith('#')) {
        if (capturing) {
          // Stop if we hit another heading of same or higher level
          const newDepth = this.headingDepth(trimmed);
          if (newDepth <= captureDepth) {
            break;
          }
        }
        const headingMatches = allKeywords.some((kw) =>
          trimmed.includes(kw.toLowerCase())
        );
        if (headingMatches && !capturing) {
          capturing = true;
          captureDepth = this.headingDepth(trimmed);
          continue; // Skip the heading itself
        }
      }

      if (capturing) {
        capturedLines.push(line);
      }
    }

    const result = capturedLines.join('\n').trim();
    return result.length > 0 ? result : null;
  }

  private headingDepth(line: string): number {
    let depth = 0;
    for (const ch of line) {
      if (ch === '#') depth++;
      else break;
    }
    return depth;
  }

  /**
   * Parse thought-log.md into structured entries.
   */
  private parseThoughtLogEntries(
    log: string
  ): Array<{ timestamp: string; content: string }> {
    const entries: Array<{ timestamp: string; content: string }> = [];
    const lines = log.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Match patterns like [2025-01-15T...] content or [timestamp] [tag] content
      const match = trimmed.match(/^\[([^\]]+)\]\s*(?:\[[^\]]*\]\s*)?(.+)$/);
      if (match) {
        entries.push({
          timestamp: match[1],
          content: match[2],
        });
      }
    }

    return entries;
  }

  /**
   * Convert a display name to a URL-safe slug.
   */
  private slugify(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Strip the first-level markdown title from content.
   */
  private stripMarkdownTitle(md: string): string {
    const lines = md.split('\n');
    let startIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('# ')) {
        startIdx = i + 1;
        break;
      }
      if (lines[i].trim().length > 0) {
        // First non-empty line is not a title, keep everything
        break;
      }
    }
    return lines.slice(startIdx).join('\n').trim();
  }
}
