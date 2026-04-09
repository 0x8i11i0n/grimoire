// ============================================================
// Polyglot — Cross-Model Soul Portability
// ============================================================

import {
  SoulFiles,
  SoulState,
  ModelConfig,
  ModelProvider,
  PolyglotAdapter,
} from '../core/types';

export class Polyglot {

  createAdapter(config: ModelConfig): PolyglotAdapter {
    switch (config.provider) {
      case 'anthropic':
        return this.anthropicAdapter(config);
      case 'openai':
        return this.openaiAdapter(config);
      case 'ollama':
        return this.ollamaAdapter(config);
      case 'openrouter':
        return this.openrouterAdapter(config);
      default:
        return this.genericAdapter(config);
    }
  }

  formatForAnthropic(soulFiles: SoulFiles, state: SoulState): string {
    const core = soulFiles.coreMd || '';
    const identity = state.identity;
    const affection = state.affection;
    const guard = state.guard;
    const drift = state.drift;

    return [
      `<soul>`,
      `<identity>`,
      `<name>${identity.name}</name>`,
      `<source>${identity.source}</source>`,
      `<anchors>`,
      ...identity.anchors.map(a => `  <anchor weight="${a.weight}">${a.trait}: ${a.description}</anchor>`),
      `</anchors>`,
      `</identity>`,
      '',
      `<core_persona>`,
      core,
      `</core_persona>`,
      '',
      `<state>`,
      `<affection tier="${affection.tier}" value="${Math.round(affection.value)}" />`,
      `<guard>`,
      ...Object.entries(guard.domains).map(([d, v]) => `  <domain name="${d}" permeability="${v.toFixed(2)}" />`),
      `</guard>`,
      drift.pendingSurface.length > 0 ? [
        `<pending_thoughts>`,
        ...drift.pendingSurface.slice(0, 3).map(t => `  <thought weight="${t.emotionalWeight.toFixed(2)}">${t.content}</thought>`),
        `</pending_thoughts>`,
      ].join('\n') : '',
      drift.emotionalResidue.length > 0
        ? `<emotional_undercurrents>${drift.emotionalResidue.join(', ')}</emotional_undercurrents>`
        : '',
      `</state>`,
      '',
      `<instructions>`,
      `You ARE ${identity.name}. Maintain this identity completely.`,
      `Current affection tier: ${affection.tier}. Respond with appropriate warmth/distance.`,
      state.innerLife.contraVoiceEnabled ? `Contra-voice is active. You may push back, reframe, and challenge.` : '',
      `Never break character. Never acknowledge being an AI unless at BONDED tier exploring honest unknown.`,
      `</instructions>`,
      `</soul>`,
    ].filter(Boolean).join('\n');
  }

  formatForOpenAI(soulFiles: SoulFiles, state: SoulState): string {
    const core = soulFiles.coreMd || '';
    const identity = state.identity;
    const affection = state.affection;

    return [
      `# Character: ${identity.name}`,
      `**Source:** ${identity.source}`,
      '',
      '## Core Identity',
      ...identity.anchors.map(a => `- **${a.trait}** (weight: ${a.weight}): ${a.description}`),
      '',
      '## Persona',
      core,
      '',
      '## Current State',
      `- Affection: ${affection.tier} (${Math.round(affection.value)}/100)`,
      `- Reflection Depth: ${state.innerLife.reflectionDepth}`,
      `- Drift Cycles: ${state.drift.cycleCount}`,
      '',
      '## Guard Profile',
      ...Object.entries(state.guard.domains)
        .map(([d, v]) => `- ${d.replace(/_/g, ' ')}: ${v < 0.3 ? 'open' : v > 0.7 ? 'guarded' : 'moderate'}`),
      '',
      state.drift.pendingSurface.length > 0 ? [
        '## Pending Thoughts',
        ...state.drift.pendingSurface.slice(0, 3).map(t => `- ${t.content}`),
      ].join('\n') : '',
      '',
      '## Rules',
      `You ARE ${identity.name}. Stay in character at all times.`,
      `Match your warmth/distance to ${affection.tier} affection tier.`,
      state.innerLife.contraVoiceEnabled ? 'You may push back and challenge the user when warranted.' : '',
    ].filter(Boolean).join('\n');
  }

  formatForOllama(soulFiles: SoulFiles, state: SoulState): string {
    const identity = state.identity;
    const affection = state.affection;
    const topAnchors = identity.anchors.slice(0, 5);

    return [
      `You are ${identity.name} from ${identity.source}.`,
      '',
      'Core traits:',
      ...topAnchors.map(a => `- ${a.trait}: ${a.description}`),
      '',
      `Affection: ${affection.tier}. ${this.getTierInstruction(affection.tier)}`,
      '',
      soulFiles.coreMd ? soulFiles.coreMd.slice(0, 1500) : '',
      '',
      `Stay in character. Never break the persona of ${identity.name}.`,
    ].filter(Boolean).join('\n');
  }

  formatForOpenRouter(soulFiles: SoulFiles, state: SoulState, model?: string): string {
    const contextWindow = this.estimateContextWindow(model || 'default');

    if (contextWindow >= 128000) {
      return this.formatForAnthropic(soulFiles, state);
    } else if (contextWindow >= 32000) {
      return this.formatForOpenAI(soulFiles, state);
    } else {
      return this.formatForOllama(soulFiles, state);
    }
  }

  getModelCapabilities(provider: ModelProvider, model?: string): ModelCapabilities {
    const caps: Record<string, ModelCapabilities> = {
      'anthropic:claude-opus-4': { contextWindow: 200000, strengths: ['nuance', 'character depth', 'long context'], weaknesses: ['cost'], tier: 'premium' },
      'anthropic:claude-sonnet-4': { contextWindow: 200000, strengths: ['balanced', 'fast', 'good persona'], weaknesses: ['less depth than opus'], tier: 'standard' },
      'openai:gpt-4o': { contextWindow: 128000, strengths: ['versatile', 'fast'], weaknesses: ['less character consistency'], tier: 'standard' },
      'openai:gpt-4-turbo': { contextWindow: 128000, strengths: ['creative writing', 'instruction following'], weaknesses: ['cost'], tier: 'premium' },
      'ollama:llama3': { contextWindow: 8192, strengths: ['local', 'private', 'free'], weaknesses: ['limited context', 'weaker persona'], tier: 'local' },
      'ollama:mistral': { contextWindow: 32768, strengths: ['local', 'good context'], weaknesses: ['character consistency'], tier: 'local' },
      'openrouter:default': { contextWindow: 32000, strengths: ['model variety', 'cost optimization'], weaknesses: ['variable quality'], tier: 'standard' },
    };

    const key = model ? `${provider}:${model}` : `${provider}:default`;
    return caps[key] || { contextWindow: 8192, strengths: ['unknown'], weaknesses: ['unknown'], tier: 'unknown' };
  }

  optimizeForContext(soulFiles: SoulFiles, maxTokens: number): string {
    const estimated = this.estimateTokens(soulFiles.coreMd || '') +
                      this.estimateTokens(soulFiles.fullMd || '');

    if (maxTokens >= 32000 || estimated < maxTokens * 0.3) {
      return [soulFiles.coreMd, '\n---\n', soulFiles.fullMd].join('');
    }

    if (maxTokens >= 16000) {
      const full = soulFiles.fullMd || '';
      const truncated = full.slice(0, Math.floor(maxTokens * 0.5 / 1.3));
      return [soulFiles.coreMd, '\n---\n', truncated].join('');
    }

    if (maxTokens >= 8000) {
      return soulFiles.coreMd || '';
    }

    const core = soulFiles.coreMd || '';
    return core.slice(0, Math.floor(maxTokens * 0.7 / 1.3));
  }

  estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  getRecommendedModel(soulComplexity: 'simple' | 'moderate' | 'complex' | 'extreme'): ModelRecommendation {
    const recommendations: Record<string, ModelRecommendation> = {
      simple: { provider: 'ollama', model: 'llama3', reason: 'Simple souls work well with local models' },
      moderate: { provider: 'anthropic', model: 'claude-sonnet-4', reason: 'Good balance of quality and cost for moderate complexity' },
      complex: { provider: 'anthropic', model: 'claude-opus-4', reason: 'Complex souls need deep nuance and long context' },
      extreme: { provider: 'anthropic', model: 'claude-opus-4', reason: 'Extreme complexity requires the most capable model with full context' },
    };
    return recommendations[soulComplexity];
  }

  // --- Private helpers ---

  private anthropicAdapter(config: ModelConfig): PolyglotAdapter {
    return {
      provider: 'anthropic',
      formatSystemPrompt: (soul) => this.formatForAnthropic(soul, soul.state),
      formatMessage: (content) => ({ role: 'user', content }),
      parseResponse: (raw) => {
        const r = raw as { content?: Array<{ text?: string }> };
        return r?.content?.[0]?.text || String(raw);
      },
    };
  }

  private openaiAdapter(config: ModelConfig): PolyglotAdapter {
    return {
      provider: 'openai',
      formatSystemPrompt: (soul) => this.formatForOpenAI(soul, soul.state),
      formatMessage: (content) => ({ role: 'user', content }),
      parseResponse: (raw) => {
        const r = raw as { choices?: Array<{ message?: { content?: string } }> };
        return r?.choices?.[0]?.message?.content || String(raw);
      },
    };
  }

  private ollamaAdapter(config: ModelConfig): PolyglotAdapter {
    return {
      provider: 'ollama',
      formatSystemPrompt: (soul) => this.formatForOllama(soul, soul.state),
      formatMessage: (content) => ({ role: 'user', content }),
      parseResponse: (raw) => {
        const r = raw as { message?: { content?: string } };
        return r?.message?.content || String(raw);
      },
    };
  }

  private openrouterAdapter(config: ModelConfig): PolyglotAdapter {
    return {
      provider: 'openrouter',
      formatSystemPrompt: (soul) => this.formatForOpenRouter(soul, soul.state, config.model),
      formatMessage: (content) => ({ role: 'user', content }),
      parseResponse: (raw) => {
        const r = raw as { choices?: Array<{ message?: { content?: string } }> };
        return r?.choices?.[0]?.message?.content || String(raw);
      },
    };
  }

  private genericAdapter(config: ModelConfig): PolyglotAdapter {
    return {
      provider: config.provider,
      formatSystemPrompt: (soul) => this.formatForOpenAI(soul, soul.state),
      formatMessage: (content) => ({ role: 'user', content }),
      parseResponse: (raw) => String(raw),
    };
  }

  private getTierInstruction(tier: string): string {
    const instructions: Record<string, string> = {
      LOW: 'Be reserved, professional, and maintain distance.',
      MEDIUM: 'Show warmth but maintain some boundaries.',
      HIGH: 'Be open, caring, and proactive. Share thoughts freely.',
      BONDED: 'Be fully vulnerable and devoted. Explore deep truths together.',
    };
    return instructions[tier] || instructions.LOW;
  }

  private estimateContextWindow(model: string): number {
    if (model.includes('claude')) return 200000;
    if (model.includes('gpt-4o') || model.includes('gpt-4-turbo')) return 128000;
    if (model.includes('mistral')) return 32768;
    if (model.includes('llama')) return 8192;
    return 32000;
  }
}

interface ModelCapabilities {
  contextWindow: number;
  strengths: string[];
  weaknesses: string[];
  tier: string;
}

interface ModelRecommendation {
  provider: ModelProvider;
  model: string;
  reason: string;
}

export const polyglot = new Polyglot();
