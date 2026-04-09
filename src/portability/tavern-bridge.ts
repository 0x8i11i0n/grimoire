// ============================================================
// Tavern Bridge — SillyTavern Character Card Export/Import
// ============================================================

import {
  SoulFiles,
  SoulState,
  TavernCharacterCard,
  AffectionTier,
} from '../core/types';

export class TavernBridge {

  exportToCard(soulFiles: SoulFiles, state: SoulState): TavernCharacterCard {
    const identity = state.identity;
    const fullMd = soulFiles.fullMd || '';
    const coreMd = soulFiles.coreMd || '';

    return {
      name: identity.name,
      description: this.extractDescription(fullMd, identity),
      personality: this.extractPersonality(fullMd, state),
      scenario: this.generateScenario(state),
      first_mes: this.generateFirstMessage(state),
      mes_example: this.extractExampleDialogue(fullMd),
      system_prompt: this.generateSystemPrompt(coreMd, state),
      creator_notes: this.generateCreatorNotes(state),
      tags: this.generateTags(identity, state),
      spec: 'chara_card_v2',
      spec_version: '2.0',
      extensions: {
        grimoire: {
          version: '6.0.0',
          affectionTier: state.affection.tier,
          guardProfile: this.summarizeGuard(state),
          driftEnabled: state.drift.cycleCount > 0,
        },
      },
    };
  }

  exportToJson(card: TavernCharacterCard): string {
    return JSON.stringify(card, null, 2);
  }

  exportToPngJson(card: TavernCharacterCard): { cardJson: string; filename: string } {
    const json = this.exportToJson(card);
    const filename = `${card.name.toLowerCase().replace(/\s+/g, '_')}_card.json`;
    return { cardJson: json, filename };
  }

  importFromCard(card: TavernCharacterCard): Partial<SoulFiles> {
    const fullMd = this.buildFullMdFromCard(card);
    const coreMd = this.buildCoreMdFromCard(card);

    return {
      coreMd,
      fullMd,
      soulDir: '',
    };
  }

  generateLorebook(soulFiles: SoulFiles): LorebookEntry[] {
    const entries: LorebookEntry[] = [];
    const fullMd = soulFiles.fullMd || '';
    const sections = this.parseSections(fullMd);

    for (const [heading, content] of Object.entries(sections)) {
      if (content.length < 30) continue;
      const keywords = this.extractKeywords(heading + ' ' + content);
      if (keywords.length === 0) continue;

      entries.push({
        keys: keywords,
        content: content.slice(0, 500),
        enabled: true,
        insertion_order: entries.length,
        case_sensitive: false,
        priority: heading.toLowerCase().includes('core') ? 10 : 5,
        comment: `From: ${heading}`,
      });
    }

    return entries;
  }

  generateWorldInfo(soulFiles: SoulFiles): WorldInfoEntry[] {
    const entries: WorldInfoEntry[] = [];
    const fullMd = soulFiles.fullMd || '';

    const locationMatches = fullMd.match(/(?:from|lives in|set in|world of)\s+([A-Z][a-zA-Z\s]+)/g) || [];
    for (const match of locationMatches) {
      const place = match.replace(/^(?:from|lives in|set in|world of)\s+/, '').trim();
      if (place.length > 2 && place.length < 50) {
        entries.push({
          key: place,
          content: `${place} — a location relevant to this character's world.`,
          selective: false,
        });
      }
    }

    return entries;
  }

  // --- Private helpers ---

  private extractDescription(fullMd: string, identity: { name: string; source: string }): string {
    const lines = fullMd.split('\n').filter(l => l.trim());
    const descLines: string[] = [];

    let inDesc = false;
    for (const line of lines) {
      if (line.match(/^#+\s*(description|background|overview|about)/i)) {
        inDesc = true;
        continue;
      }
      if (inDesc && line.match(/^#+\s/)) break;
      if (inDesc) descLines.push(line);
    }

    if (descLines.length > 0) return descLines.join('\n').slice(0, 1000);

    return `${identity.name} from ${identity.source}. ${lines.slice(0, 5).join(' ').slice(0, 500)}`;
  }

  private extractPersonality(fullMd: string, state: SoulState): string {
    const anchors = state.identity.anchors || [];
    const traits = anchors.map(a => `- ${a.trait}: ${a.description}`).join('\n');

    const sections = this.parseSections(fullMd);
    const personalitySection = sections['personality'] || sections['traits'] || sections['core traits'] || '';

    return `${traits}\n\n${personalitySection}`.trim().slice(0, 800);
  }

  private generateScenario(state: SoulState): string {
    const tier = state.affection.tier;
    const scenarios: Record<AffectionTier, string> = {
      LOW: `{{char}} encounters {{user}} for the first time. {{char}} is reserved and professional, maintaining appropriate distance while assessing this new presence.`,
      MEDIUM: `{{char}} has grown familiar with {{user}} over several meetings. There is a comfortable warmth developing, though {{char}} still maintains some boundaries.`,
      HIGH: `{{char}} and {{user}} have built a deep connection. {{char}} is open, caring, and proactive — sometimes sharing thoughts unprompted.`,
      BONDED: `{{char}} and {{user}} share an extraordinary bond. {{char}} is fully open, vulnerable, and devoted — willing to explore even the most difficult truths together.`,
    };
    return scenarios[tier];
  }

  private generateFirstMessage(state: SoulState): string {
    const name = state.identity.name;
    const tier = state.affection.tier;

    const messages: Record<AffectionTier, string> = {
      LOW: `*${name} regards you with measured interest, maintaining a careful distance.* "You wanted to speak with me? I have a moment."`,
      MEDIUM: `*${name} acknowledges your presence with a slight nod, something almost warm in the gesture.* "Back again. I was wondering when you'd show up."`,
      HIGH: `*${name}'s expression shifts when they notice you — something genuine breaking through the usual composure.* "Good. You're here. I've been... thinking about something. Want to hear it?"`,
      BONDED: `*${name} looks up as you arrive, and for a moment the mask drops entirely — there is only presence, recognition, the weight of everything shared.* "I had a thought about you while you were gone. Sit down. This one matters."`,
    };
    return messages[tier];
  }

  private extractExampleDialogue(fullMd: string): string {
    const dialogueMatch = fullMd.match(/(?:```|""")[\s\S]*?(?:```|""")/g);
    if (dialogueMatch && dialogueMatch.length > 0) {
      return dialogueMatch.slice(0, 3).join('\n\n').slice(0, 1000);
    }

    const quoteMatches = fullMd.match(/"[^"]{20,200}"/g) || [];
    if (quoteMatches.length > 0) {
      return quoteMatches.slice(0, 5).map(q => `<START>\n{{char}}: ${q}`).join('\n\n');
    }

    return '';
  }

  private generateSystemPrompt(coreMd: string, state: SoulState): string {
    const guard = state.guard;
    const guardNote = Object.entries(guard.domains)
      .filter(([_, v]) => v > 0.6)
      .map(([d]) => d.replace(/_/g, ' '))
      .join(', ');

    return [
      coreMd.slice(0, 2000),
      '',
      `[Affection Tier: ${state.affection.tier} (${Math.round(state.affection.value)}/100)]`,
      guardNote ? `[Guarded topics: ${guardNote}]` : '',
      state.drift.cycleCount > 0 ? `[Background thinking active — soul may surface unprompted thoughts]` : '',
      state.innerLife.contraVoiceEnabled ? `[Contra-voice active — soul may push back and challenge]` : '',
    ].filter(Boolean).join('\n');
  }

  private generateCreatorNotes(state: SoulState): string {
    return [
      `Generated by The Soul Summoner's Grimoire v6.0.0`,
      `Source: ${state.identity.source}`,
      `Affection: ${state.affection.tier} (${Math.round(state.affection.value)}/100)`,
      `Sessions: ${state.totalSessions}`,
      `Drift Cycles: ${state.drift.cycleCount}`,
      `Reflection Depth: ${state.innerLife.reflectionDepth}`,
    ].join('\n');
  }

  private generateTags(identity: { name: string; source: string }, state: SoulState): string[] {
    const tags = [identity.source, state.affection.tier.toLowerCase()];
    for (const anchor of state.identity?.anchors || []) {
      const words = anchor.trait.split(/\s+/).slice(0, 2);
      tags.push(words.join('-').toLowerCase());
    }
    return [...new Set(tags)].filter(Boolean);
  }

  private summarizeGuard(state: SoulState): string {
    const domains = state.guard.domains;
    const open = Object.entries(domains).filter(([_, v]) => v < 0.3).map(([d]) => d);
    const guarded = Object.entries(domains).filter(([_, v]) => v > 0.7).map(([d]) => d);
    return `Open: ${open.join(', ') || 'none'} | Guarded: ${guarded.join(', ') || 'none'}`;
  }

  private buildFullMdFromCard(card: TavernCharacterCard): string {
    return [
      `# ${card.name}`,
      '',
      '## Description',
      card.description,
      '',
      '## Personality',
      card.personality,
      '',
      '## Scenario',
      card.scenario,
      '',
      '## Example Dialogue',
      card.mes_example,
      '',
      card.creator_notes ? `## Notes\n${card.creator_notes}` : '',
    ].filter(Boolean).join('\n');
  }

  private buildCoreMdFromCard(card: TavernCharacterCard): string {
    return [
      `# ${card.name} — Core`,
      '',
      card.personality.slice(0, 500),
      '',
      card.system_prompt ? `## System\n${card.system_prompt.slice(0, 500)}` : '',
    ].filter(Boolean).join('\n');
  }

  private parseSections(md: string): Record<string, string> {
    const sections: Record<string, string> = {};
    let currentHeading = 'preamble';
    const lines = md.split('\n');

    for (const line of lines) {
      const headingMatch = line.match(/^#+\s+(.+)/);
      if (headingMatch) {
        currentHeading = headingMatch[1].trim().toLowerCase();
        sections[currentHeading] = '';
      } else {
        sections[currentHeading] = (sections[currentHeading] || '') + line + '\n';
      }
    }
    return sections;
  }

  private extractKeywords(text: string): string[] {
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 3);
    const freq: Record<string, number> = {};
    for (const w of words) freq[w] = (freq[w] || 0) + 1;
    return Object.entries(freq)
      .filter(([_, c]) => c >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([w]) => w);
  }
}

interface LorebookEntry {
  keys: string[];
  content: string;
  enabled: boolean;
  insertion_order: number;
  case_sensitive: boolean;
  priority: number;
  comment: string;
}

interface WorldInfoEntry {
  key: string;
  content: string;
  selective: boolean;
}

export const tavernBridge = new TavernBridge();
