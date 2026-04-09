// ============================================================
// The Consolidation Engine — Memory Dream-Cycle Helper
// Converts episodic memories into semantic knowledge,
// merges similar memories, links concepts, and builds the graph
// ============================================================

import {
  Memory,
  MemoryType,
  DECAY_RATES,
  generateId,
} from './types';
import { Athenaeum } from './athenaeum';
import { Nexus } from './nexus';

const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
  'should', 'may', 'might', 'shall', 'can', 'need', 'must', 'ought',
  'i', 'me', 'my', 'mine', 'myself', 'we', 'us', 'our', 'ours',
  'you', 'your', 'yours', 'he', 'him', 'his', 'she', 'her', 'hers',
  'it', 'its', 'they', 'them', 'their', 'theirs', 'this', 'that',
  'these', 'those', 'what', 'which', 'who', 'whom', 'whose',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'both', 'either',
  'neither', 'each', 'every', 'all', 'any', 'few', 'more', 'most',
  'some', 'such', 'no', 'only', 'same', 'than', 'too', 'very',
  'just', 'because', 'as', 'until', 'while', 'of', 'at', 'by',
  'for', 'with', 'about', 'against', 'between', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down',
  'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further',
  'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'if', 'also', 'still', 'much', 'even', 'like', 'well',
  'really', 'get', 'got', 'go', 'going', 'gone', 'come', 'came',
  'make', 'made', 'take', 'took', 'say', 'said', 'tell', 'told',
  'think', 'thought', 'know', 'knew', 'see', 'saw', 'want', 'wanted',
]);

/** Minimum word length for concept extraction. */
const MIN_CONCEPT_LENGTH = 3;

/** Minimum strength below which episodic memories become consolidation candidates. */
const CONSOLIDATION_STRENGTH_THRESHOLD = 0.4;

/** Minimum cosine overlap to consider two memories "similar" for compaction. */
const SIMILARITY_THRESHOLD = 0.45;

/** Maximum number of memories merged in a single compaction pass. */
const MAX_COMPACTION_BATCH = 50;

/**
 * Simple relation patterns detected in text.
 * Each pattern maps to a relation name and captures (entity1, entity2).
 */
const RELATION_PATTERNS: Array<{ regex: RegExp; relation: string }> = [
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:is|was|are|were)\s+(?:a|an|the)?\s*(\b[a-z]{3,})/gi, relation: 'is_a' },
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:likes?|loves?|enjoys?)\s+(\b\w{3,})/gi, relation: 'likes' },
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:hates?|dislikes?|despises?)\s+(\b\w{3,})/gi, relation: 'dislikes' },
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:knows?|knew)\s+(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi, relation: 'knows' },
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:works?|worked)\s+(?:at|for|with)\s+(\b[A-Z]\w+)/gi, relation: 'works_with' },
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:is|was)\s+(?:friends?|allied|close)\s+(?:with|to)\s+(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/gi, relation: 'allied_with' },
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:fears?|feared)\s+(\b\w{3,})/gi, relation: 'fears' },
  { regex: /(\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*)\s+(?:belongs?\s+to|is\s+part\s+of)\s+(\b[A-Z]\w+)/gi, relation: 'belongs_to' },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
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

function quickCosineSimilarity(textA: string, textB: string): number {
  const tokensA = tokenize(textA);
  const tokensB = tokenize(textB);

  const allTerms = new Set([...tokensA, ...tokensB]);
  if (allTerms.size === 0) return 0;

  const tfA = computeTF(tokensA);
  const tfB = computeTF(tokensB);

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (const term of allTerms) {
    const a = tfA.get(term) || 0;
    const b = tfB.get(term) || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export class Consolidation {
  private readonly athenaeum: Athenaeum;
  private readonly nexus: Nexus;

  constructor(athenaeum: Athenaeum, nexus: Nexus) {
    this.athenaeum = athenaeum;
    this.nexus = nexus;
  }

  /**
   * Consolidate fading episodic memories into durable semantic memories.
   * Extracts factual content from weak episodic memories, stores them as
   * semantic entries, and marks originals as consumed by lowering their strength.
   */
  consolidateEpisodic(soulId: string): number {
    const episodicMemories = this.athenaeum.recall({
      soulId,
      type: 'episodic',
      minStrength: 0.01,
      limit: 200,
    });

    const candidates = episodicMemories.filter(
      m => m.currentStrength < CONSOLIDATION_STRENGTH_THRESHOLD
    );

    if (candidates.length === 0) return 0;

    let consolidated = 0;

    for (const memory of candidates) {
      const concepts = this.extractConcepts(memory.content);
      if (concepts.length === 0) continue;

      const semanticContent = this.distillFact(memory.content);
      if (!semanticContent) continue;

      this.athenaeum.store({
        type: 'semantic' as MemoryType,
        content: semanticContent,
        timestamp: Date.now(),
        importance: Math.min(memory.importance + 0.1, 1.0),
        emotionalWeight: memory.emotionalWeight * 0.5,
        associations: [memory.id],
        concepts,
        decayRate: DECAY_RATES.semantic,
        currentStrength: 0.9,
        soulId,
        sessionId: memory.sessionId,
      } as Memory);

      // Lower the original episodic memory's strength to mark it as processed
      const db = this.athenaeum.db;
      db.prepare(
        `UPDATE memories SET current_strength = ? WHERE id = ?`
      ).run(memory.currentStrength * 0.3, memory.id);

      consolidated++;
    }

    return consolidated;
  }

  /**
   * Compact similar semantic memories into denser summaries.
   * Finds clusters of highly similar memories and merges them.
   */
  compactMemories(soulId: string): number {
    const semanticMemories = this.athenaeum.recall({
      soulId,
      type: 'semantic',
      minStrength: 0.05,
      limit: 500,
    });

    if (semanticMemories.length < 2) return 0;

    const merged = new Set<string>();
    let compacted = 0;

    const batch = semanticMemories.slice(0, MAX_COMPACTION_BATCH);

    for (let i = 0; i < batch.length; i++) {
      if (merged.has(batch[i].id)) continue;

      const cluster: Memory[] = [batch[i]];

      for (let j = i + 1; j < batch.length; j++) {
        if (merged.has(batch[j].id)) continue;

        const similarity = quickCosineSimilarity(batch[i].content, batch[j].content);
        if (similarity >= SIMILARITY_THRESHOLD) {
          cluster.push(batch[j]);
          merged.add(batch[j].id);
        }
      }

      if (cluster.length < 2) continue;

      merged.add(batch[i].id);

      const mergedContent = this.mergeContents(cluster.map(m => m.content));
      const allConcepts = [...new Set(cluster.flatMap(m => m.concepts))];
      const allAssociations = [...new Set(cluster.flatMap(m => m.associations))];
      const maxImportance = Math.max(...cluster.map(m => m.importance));
      const maxEmotional = Math.max(...cluster.map(m => m.emotionalWeight));

      this.athenaeum.store({
        type: 'semantic' as MemoryType,
        content: mergedContent,
        timestamp: Date.now(),
        importance: Math.min(maxImportance + 0.05, 1.0),
        emotionalWeight: maxEmotional,
        associations: allAssociations,
        concepts: allConcepts,
        decayRate: DECAY_RATES.semantic,
        currentStrength: 1.0,
        soulId,
      } as Memory);

      // Reduce strength of originals rather than deleting
      const db = this.athenaeum.db;
      const update = db.prepare(
        `UPDATE memories SET current_strength = current_strength * 0.1 WHERE id = ?`
      );
      for (const m of cluster) {
        update.run(m.id);
      }

      compacted += cluster.length;
    }

    return compacted;
  }

  /**
   * Extract meaningful concepts from text.
   * Filters stopwords, short words, and selects noun-like tokens.
   */
  extractConcepts(text: string): string[] {
    const tokens = tokenize(text);
    const candidates = tokens.filter(t =>
      t.length >= MIN_CONCEPT_LENGTH &&
      !STOPWORDS.has(t) &&
      !/^\d+$/.test(t)
    );

    // Count frequency to find important terms
    const freq = new Map<string, number>();
    for (const token of candidates) {
      freq.set(token, (freq.get(token) || 0) + 1);
    }

    // Sort by frequency descending, take top concepts
    const sorted = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([term]) => term);

    // Return unique concepts, max 15
    return sorted.slice(0, 15);
  }

  /**
   * Link unlinked memories that share concepts.
   * Creates association links between memories with overlapping concept sets.
   */
  linkMemories(soulId: string): number {
    const memories = this.athenaeum.recall({
      soulId,
      minStrength: 0.1,
      limit: 300,
    });

    if (memories.length < 2) return 0;

    // Build a concept-to-memory index
    const conceptIndex = new Map<string, string[]>();
    for (const memory of memories) {
      for (const concept of memory.concepts) {
        const existing = conceptIndex.get(concept) || [];
        existing.push(memory.id);
        conceptIndex.set(concept, existing);
      }
    }

    const db = this.athenaeum.db;
    let linked = 0;

    // For each concept, link memories that share it but aren't already associated
    const memoryMap = new Map(memories.map(m => [m.id, m]));

    for (const [, memoryIds] of conceptIndex) {
      if (memoryIds.length < 2) continue;

      for (let i = 0; i < memoryIds.length && i < 10; i++) {
        for (let j = i + 1; j < memoryIds.length && j < 10; j++) {
          const memA = memoryMap.get(memoryIds[i]);
          const memB = memoryMap.get(memoryIds[j]);

          if (!memA || !memB) continue;
          if (memA.associations.includes(memB.id)) continue;

          // Add bidirectional associations
          const newAssocA = [...memA.associations, memB.id];
          const newAssocB = [...memB.associations, memA.id];

          db.prepare(
            `UPDATE memories SET associations = ? WHERE id = ?`
          ).run(JSON.stringify(newAssocA), memA.id);

          db.prepare(
            `UPDATE memories SET associations = ? WHERE id = ?`
          ).run(JSON.stringify(newAssocB), memB.id);

          // Update in-memory state to avoid re-linking
          memA.associations = newAssocA;
          memB.associations = newAssocB;

          linked++;
        }
      }
    }

    return linked;
  }

  /**
   * Scan memories for entity-relation patterns and add discovered
   * relationships to the Nexus knowledge graph.
   */
  buildKnowledgeFromMemories(soulId: string): number {
    const memories = this.athenaeum.recall({
      soulId,
      minStrength: 0.15,
      limit: 300,
    });

    let relationsAdded = 0;
    const now = Date.now();

    for (const memory of memories) {
      for (const pattern of RELATION_PATTERNS) {
        // Reset regex state for each memory
        pattern.regex.lastIndex = 0;

        let match: RegExpExecArray | null;
        while ((match = pattern.regex.exec(memory.content)) !== null) {
          const entityA = match[1].trim();
          const entityB = match[2].trim();

          if (!entityA || !entityB || entityA.length < 2 || entityB.length < 2) continue;

          // Find or create nodes
          let nodeA = this.nexus.findNodeByEntity(entityA, soulId);
          if (!nodeA) {
            nodeA = this.nexus.addNode({
              entity: entityA,
              entityType: this.inferEntityType(entityA),
              properties: {},
              validFrom: now,
              validTo: null,
              soulId,
            });
          }

          let nodeB = this.nexus.findNodeByEntity(entityB, soulId);
          if (!nodeB) {
            nodeB = this.nexus.addNode({
              entity: entityB,
              entityType: this.inferEntityType(entityB),
              properties: {},
              validFrom: now,
              validTo: null,
              soulId,
            });
          }

          // Check for existing active edge with same relation
          const existingEdges = this.nexus.getRelationships(nodeA.id);
          const duplicate = existingEdges.find(
            e =>
              e.relation === pattern.relation &&
              ((e.sourceId === nodeA!.id && e.targetId === nodeB!.id) ||
               (e.sourceId === nodeB!.id && e.targetId === nodeA!.id)) &&
              e.validTo === null
          );

          if (duplicate) {
            // Strengthen existing edge by adding evidence
            if (!duplicate.evidence.includes(memory.id)) {
              this.nexus.updateEdge(duplicate.id, {
                evidence: [...duplicate.evidence, memory.id],
                weight: Math.min(duplicate.weight + 0.1, 1.0),
              }, now);
            }
          } else {
            this.nexus.addEdge({
              sourceId: nodeA.id,
              targetId: nodeB.id,
              relation: pattern.relation,
              weight: 0.5,
              validFrom: now,
              validTo: null,
              evidence: [memory.id],
              soulId,
            });
            relationsAdded++;
          }
        }
      }
    }

    return relationsAdded;
  }

  /**
   * Distill a factual summary from episodic memory content.
   * Returns the most information-dense sentences.
   */
  private distillFact(content: string): string | null {
    const sentences = content
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    if (sentences.length === 0) return null;

    // Score sentences by information density (non-stopword ratio)
    const scored = sentences.map(sentence => {
      const tokens = tokenize(sentence);
      const meaningful = tokens.filter(
        t => !STOPWORDS.has(t) && t.length >= MIN_CONCEPT_LENGTH
      );
      const density = tokens.length > 0 ? meaningful.length / tokens.length : 0;
      return { sentence, density };
    });

    scored.sort((a, b) => b.density - a.density);

    // Take top 2 most information-dense sentences
    const selected = scored.slice(0, 2).map(s => s.sentence);
    return selected.join('. ') + '.';
  }

  /**
   * Merge multiple memory contents into a single summary.
   */
  private mergeContents(contents: string[]): string {
    // Collect unique sentences across all contents
    const allSentences = new Set<string>();
    for (const content of contents) {
      const sentences = content
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10);
      for (const sentence of sentences) {
        allSentences.add(sentence);
      }
    }

    const sentenceArray = Array.from(allSentences);

    // Deduplicate near-identical sentences
    const unique: string[] = [];
    for (const sentence of sentenceArray) {
      const isDuplicate = unique.some(
        existing => quickCosineSimilarity(existing, sentence) > 0.8
      );
      if (!isDuplicate) {
        unique.push(sentence);
      }
    }

    // Score by information density and take best ones
    const scored = unique.map(sentence => {
      const tokens = tokenize(sentence);
      const meaningful = tokens.filter(
        t => !STOPWORDS.has(t) && t.length >= MIN_CONCEPT_LENGTH
      );
      const density = tokens.length > 0 ? meaningful.length / tokens.length : 0;
      return { sentence, density };
    });

    scored.sort((a, b) => b.density - a.density);

    const maxSentences = Math.min(5, scored.length);
    return scored.slice(0, maxSentences).map(s => s.sentence).join('. ') + '.';
  }

  /**
   * Infer the entity type from the entity name.
   */
  private inferEntityType(entity: string): 'person' | 'concept' | 'event' | 'emotion' | 'place' | 'soul' {
    const lower = entity.toLowerCase();

    const emotionWords = ['fear', 'anger', 'joy', 'sadness', 'love', 'hate', 'grief', 'hope', 'despair', 'rage', 'happiness', 'anxiety'];
    if (emotionWords.some(e => lower.includes(e))) return 'emotion';

    const placeIndicators = ['city', 'town', 'village', 'mountain', 'forest', 'castle', 'tower', 'realm', 'kingdom', 'palace', 'dungeon', 'gate'];
    if (placeIndicators.some(p => lower.includes(p))) return 'place';

    const eventIndicators = ['battle', 'war', 'ceremony', 'ritual', 'incident', 'massacre', 'raid', 'awakening', 'uprising'];
    if (eventIndicators.some(e => lower.includes(e))) return 'event';

    // Capitalized multi-word or single word starting with capital = likely person
    if (/^[A-Z]/.test(entity)) return 'person';

    return 'concept';
  }
}

export function createConsolidation(athenaeum: Athenaeum, nexus: Nexus): Consolidation {
  return new Consolidation(athenaeum, nexus);
}
