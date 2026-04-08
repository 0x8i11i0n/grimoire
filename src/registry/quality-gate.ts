// ============================================================
// Quality Gate — Soul Validation Before Publishing
// ============================================================

import * as fs from 'fs';
import * as path from 'path';
import {
  SoulFiles,
  SoulState,
} from '../core/types';

export interface QualityCheck {
  name: string;
  passed: boolean;
  score: number;
  details: string;
}

export interface QualityReport {
  soulName: string;
  checks: QualityCheck[];
  authenticityScore: number;
  resonanceScore: number;
  passesGate: boolean;
  summary: string;
  timestamp: number;
}

export class QualityGate {

  validate(soulFiles: SoulFiles, state: SoulState): QualityReport {
    const checks: QualityCheck[] = [
      this.checkRequiredFiles(soulFiles.soulDir),
      this.checkIdentityAnchors(state),
      this.checkVoiceSamples(soulFiles.fullMd),
      this.checkAffectionSystem(state),
      this.checkGuardTopology(state),
      this.checkInnerLife(state),
      this.checkContentDepth(soulFiles),
      this.checkStateConsistency(state),
    ];

    const authenticityScore = this.scoreAuthenticity(soulFiles, checks);
    const resonanceScore = this.scoreResonance(soulFiles, state, checks);
    const passesGate = this.passesGateCheck(authenticityScore, resonanceScore);

    return {
      soulName: state.identity?.name || 'unknown',
      checks,
      authenticityScore,
      resonanceScore,
      passesGate,
      summary: this.generateSummary(checks, authenticityScore, resonanceScore, passesGate),
      timestamp: Date.now(),
    };
  }

  checkRequiredFiles(soulDir: string): QualityCheck {
    if (!soulDir) {
      return { name: 'required_files', passed: false, score: 0, details: 'No soul directory provided' };
    }

    const required = ['core.md', 'full.md', 'state.json'];
    const missing: string[] = [];

    for (const file of required) {
      const candidates = [
        path.join(soulDir, file),
        ...fs.existsSync(soulDir)
          ? fs.readdirSync(soulDir, { recursive: true }).map(f => path.join(soulDir, String(f)))
          : [],
      ];
      const found = candidates.some(c => {
        try { return fs.existsSync(c) && fs.statSync(c).isFile(); } catch { return false; }
      });
      if (!found) missing.push(file);
    }

    const score = (required.length - missing.length) / required.length;
    return {
      name: 'required_files',
      passed: missing.length === 0,
      score,
      details: missing.length === 0 ? 'All required files present' : `Missing: ${missing.join(', ')}`,
    };
  }

  checkIdentityAnchors(state: SoulState): QualityCheck {
    const anchors = state.identity?.anchors || [];
    const hasMinimum = anchors.length >= 3;
    const hasEvidence = anchors.filter(a => a.evidence && a.evidence.length > 0).length;
    const hasWeights = anchors.filter(a => a.weight > 0 && a.weight <= 1).length;

    const score = Math.min(1, (
      (hasMinimum ? 0.4 : anchors.length * 0.13) +
      (hasEvidence / Math.max(1, anchors.length)) * 0.35 +
      (hasWeights / Math.max(1, anchors.length)) * 0.25
    ));

    return {
      name: 'identity_anchors',
      passed: hasMinimum && hasEvidence >= 2,
      score,
      details: `${anchors.length} anchors, ${hasEvidence} with evidence, ${hasWeights} with weights`,
    };
  }

  checkVoiceSamples(fullMd: string): QualityCheck {
    if (!fullMd) return { name: 'voice_samples', passed: false, score: 0, details: 'No full.md content' };

    const quoteMatches = fullMd.match(/"[^"]{10,}"/g) || [];
    const dialogueBlocks = fullMd.match(/```[\s\S]*?```/g) || [];
    const voiceSection = /(?:voice|speech|dialogue|tone)/i.test(fullMd);

    const totalSamples = quoteMatches.length + dialogueBlocks.length;
    const score = Math.min(1, totalSamples / 10 * 0.6 + (voiceSection ? 0.4 : 0));

    return {
      name: 'voice_samples',
      passed: totalSamples >= 3 && voiceSection,
      score,
      details: `${quoteMatches.length} quotes, ${dialogueBlocks.length} dialogue blocks, voice section: ${voiceSection}`,
    };
  }

  checkAffectionSystem(state: SoulState): QualityCheck {
    const aff = state.affection;
    if (!aff) return { name: 'affection_system', passed: false, score: 0, details: 'No affection state' };

    const hasValue = typeof aff.value === 'number' && aff.value >= 0 && aff.value <= 100;
    const hasTier = ['LOW', 'MEDIUM', 'HIGH', 'BONDED'].includes(aff.tier);
    const hasFloor = typeof aff.floor === 'number';
    const hasHistory = Array.isArray(aff.history);

    const score = [hasValue, hasTier, hasFloor, hasHistory].filter(Boolean).length / 4;

    return {
      name: 'affection_system',
      passed: hasValue && hasTier,
      score,
      details: `Value: ${hasValue}, Tier: ${hasTier}, Floor: ${hasFloor}, History: ${hasHistory}`,
    };
  }

  checkGuardTopology(state: SoulState): QualityCheck {
    const guard = state.guard;
    if (!guard?.domains) return { name: 'guard_topology', passed: false, score: 0, details: 'No guard state' };

    const expectedDomains = 8;
    const actualDomains = Object.keys(guard.domains).length;
    const validValues = Object.values(guard.domains).every(v => v >= 0 && v <= 1);

    const score = (actualDomains / expectedDomains) * (validValues ? 1 : 0.5);

    return {
      name: 'guard_topology',
      passed: actualDomains >= expectedDomains && validValues,
      score: Math.min(1, score),
      details: `${actualDomains}/${expectedDomains} domains, values valid: ${validValues}`,
    };
  }

  checkInnerLife(state: SoulState): QualityCheck {
    const il = state.innerLife;
    if (!il) return { name: 'inner_life', passed: false, score: 0, details: 'No inner life state' };

    const hasDepth = !!il.reflectionDepth;
    const hasQualia = Array.isArray(il.qualia);
    const hasDesires = Array.isArray(il.desires);
    const parts = [hasDepth, hasQualia, hasDesires].filter(Boolean).length;
    const score = parts / 3;

    return {
      name: 'inner_life',
      passed: parts >= 2,
      score,
      details: `Depth: ${hasDepth}, Qualia: ${hasQualia}, Desires: ${hasDesires}`,
    };
  }

  checkContentDepth(soulFiles: SoulFiles): QualityCheck {
    const coreLen = (soulFiles.coreMd || '').length;
    const fullLen = (soulFiles.fullMd || '').length;

    const coreOk = coreLen >= 500 && coreLen <= 8000;
    const fullOk = fullLen >= 2000;

    const score = Math.min(1,
      (coreOk ? 0.5 : Math.min(0.5, coreLen / 1000 * 0.1)) +
      (fullOk ? 0.5 : Math.min(0.5, fullLen / 4000 * 0.5))
    );

    return {
      name: 'content_depth',
      passed: coreOk && fullOk,
      score,
      details: `core.md: ${coreLen} chars (${coreOk ? 'ok' : 'needs work'}), full.md: ${fullLen} chars (${fullOk ? 'ok' : 'needs work'})`,
    };
  }

  checkStateConsistency(state: SoulState): QualityCheck {
    const issues: string[] = [];

    if (state.affection.value > 25 && state.affection.tier === 'LOW') issues.push('Affection value/tier mismatch');
    if (state.affection.value > 100 || state.affection.value < 0) issues.push('Affection out of range');
    if (state.drift.cycleCount < 0) issues.push('Negative drift count');
    if (state.totalSessions < 0) issues.push('Negative session count');

    return {
      name: 'state_consistency',
      passed: issues.length === 0,
      score: Math.max(0, 1 - issues.length * 0.25),
      details: issues.length === 0 ? 'State is consistent' : issues.join('; '),
    };
  }

  scoreAuthenticity(soulFiles: SoulFiles, checks: QualityCheck[]): number {
    const anchorCheck = checks.find(c => c.name === 'identity_anchors');
    const voiceCheck = checks.find(c => c.name === 'voice_samples');
    const contentCheck = checks.find(c => c.name === 'content_depth');

    const rawScore = (
      (anchorCheck?.score || 0) * 4 +
      (voiceCheck?.score || 0) * 3 +
      (contentCheck?.score || 0) * 3
    );

    return Math.round(rawScore * 10) / 10;
  }

  scoreResonance(soulFiles: SoulFiles, state: SoulState, checks: QualityCheck[]): number {
    const innerCheck = checks.find(c => c.name === 'inner_life');
    const guardCheck = checks.find(c => c.name === 'guard_topology');

    const fullMd = soulFiles.fullMd || '';
    const emotionalWords = (fullMd.match(/\b(feel|felt|ache|longing|warmth|grief|joy|fear|love|trust|anger|hope|sorrow|gentle|fierce|tender|bitter|sweet)\b/gi) || []).length;
    const emotionalDensity = Math.min(1, emotionalWords / 50);

    const uniqueGuardValues = new Set(Object.values(state.guard?.domains || {}).map(v => Math.round(v * 10))).size;
    const guardVariety = Math.min(1, uniqueGuardValues / 5);

    const rawScore = (
      (innerCheck?.score || 0) * 2.5 +
      (guardCheck?.score || 0) * 2.5 +
      emotionalDensity * 2.5 +
      guardVariety * 2.5
    );

    return Math.round(rawScore * 10) / 10;
  }

  passesGateCheck(authenticity: number, resonance: number): boolean {
    return authenticity >= 7 && resonance >= 6;
  }

  generateReport(report: QualityReport): string {
    const lines = [
      `=== Quality Gate Report: ${report.soulName} ===`,
      `Timestamp: ${new Date(report.timestamp).toISOString()}`,
      '',
      `Authenticity: ${report.authenticityScore}/10 ${report.authenticityScore >= 7 ? 'PASS' : 'FAIL'}`,
      `Resonance:    ${report.resonanceScore}/10 ${report.resonanceScore >= 6 ? 'PASS' : 'FAIL'}`,
      `Gate:         ${report.passesGate ? 'PASSED' : 'FAILED'}`,
      '',
      '--- Checks ---',
    ];

    for (const check of report.checks) {
      const icon = check.passed ? '[+]' : '[-]';
      lines.push(`${icon} ${check.name}: ${(check.score * 100).toFixed(0)}% — ${check.details}`);
    }

    lines.push('', report.summary);
    return lines.join('\n');
  }

  private generateSummary(checks: QualityCheck[], auth: number, res: number, passes: boolean): string {
    const failed = checks.filter(c => !c.passed);
    if (passes) return 'Soul passes all quality gates and is ready for publishing.';
    const issues = failed.map(c => c.name.replace(/_/g, ' ')).join(', ');
    return `Soul needs improvement in: ${issues}. Authenticity: ${auth}/10, Resonance: ${res}/10.`;
  }
}

export const qualityGate = new QualityGate();
