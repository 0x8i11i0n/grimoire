// ============================================================
// The Soul Summoner's Grimoire — Shared Memory Pool
// Managing memories shared across multiple souls in a group
// ============================================================

import {
  generateId,
} from '../core/types';

// --- Shared Memory Types ---

/**
 * A memory pool for a group of souls, containing events that
 * multiple souls witnessed and can reference.
 */
export interface SharedMemoryPool {
  groupId: string;
  events: SharedEvent[];
  crossReferences: Map<string, string[]>;  // sharedEventId -> individual memory IDs
  created: number;
  lastUpdated: number;
}

/**
 * An event that was witnessed by multiple souls in a group.
 */
export interface SharedEvent {
  id: string;
  content: string;
  timestamp: number;
  witnesses: string[];         // soul IDs who witnessed this event
  importance: number;          // 0.0 - 1.0
  emotionalValence: number;    // -1.0 (negative) to 1.0 (positive)
  tags: string[];
}

/** Maximum number of events stored in a single memory pool. */
const MAX_POOL_EVENTS = 500;

/**
 * SharedMemory — manages memories shared across multiple souls in a group.
 *
 * When souls interact together, they create shared experiences. This system
 * tracks those experiences and provides mechanisms to query what each soul
 * remembers, find common ground between souls, and assemble a group narrative.
 *
 * Unlike individual memories (which may be colored by a soul's personality
 * and emotional state), shared memories represent the "objective" record of
 * what happened. Each soul may still interpret them differently.
 */
export class SharedMemory {

  /**
   * Initialize a new shared memory pool for a group.
   *
   * @param groupId — the unique identifier for the group
   * @returns A freshly initialized SharedMemoryPool
   */
  create(groupId: string): SharedMemoryPool {
    return {
      groupId,
      events: [],
      crossReferences: new Map(),
      created: Date.now(),
      lastUpdated: Date.now(),
    };
  }

  /**
   * Record an event witnessed by multiple souls.
   *
   * @param pool      — the shared memory pool
   * @param event     — description and metadata of the event
   * @param witnesses — array of soul IDs who witnessed the event
   * @returns Updated SharedMemoryPool
   */
  addSharedEvent(
    pool: SharedMemoryPool,
    event: {
      content: string;
      importance?: number;
      emotionalValence?: number;
      tags?: string[];
    },
    witnesses: string[],
  ): SharedMemoryPool {
    if (witnesses.length === 0) {
      throw new Error('A shared event must have at least one witness');
    }

    if (!event.content || event.content.trim().length === 0) {
      throw new Error('A shared event must have content');
    }

    const sharedEvent: SharedEvent = {
      id: generateId(),
      content: event.content.trim(),
      timestamp: Date.now(),
      witnesses: [...witnesses],
      importance: event.importance ?? 0.5,
      emotionalValence: event.emotionalValence ?? 0,
      tags: event.tags ?? [],
    };

    let events = [...pool.events, sharedEvent];

    // Trim if exceeding maximum
    if (events.length > MAX_POOL_EVENTS) {
      // Remove oldest, lowest-importance events first
      events.sort((a, b) => {
        // Primary: importance (keep high-importance)
        const impDiff = b.importance - a.importance;
        if (Math.abs(impDiff) > 0.1) return impDiff;
        // Secondary: recency (keep recent)
        return b.timestamp - a.timestamp;
      });
      events = events.slice(0, MAX_POOL_EVENTS);
      // Re-sort by timestamp for chronological order
      events.sort((a, b) => a.timestamp - b.timestamp);
    }

    return {
      ...pool,
      events,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Get all shared memories that a specific soul has access to
   * (events they witnessed).
   *
   * @param pool   — the shared memory pool
   * @param soulId — the soul whose accessible memories to retrieve
   * @returns Array of SharedEvents this soul witnessed, sorted by timestamp descending
   */
  getSharedMemories(pool: SharedMemoryPool, soulId: string): SharedEvent[] {
    return pool.events
      .filter(event => event.witnesses.includes(soulId))
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Find memories that both souls witnessed together.
   *
   * @param pool  — the shared memory pool
   * @param soulA — first soul ID
   * @param soulB — second soul ID
   * @returns Array of SharedEvents both souls witnessed, sorted by timestamp descending
   */
  getCommonMemories(pool: SharedMemoryPool, soulA: string, soulB: string): SharedEvent[] {
    return pool.events
      .filter(event =>
        event.witnesses.includes(soulA) && event.witnesses.includes(soulB),
      )
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Link a shared memory to individual soul memories.
   *
   * This creates a cross-reference between a shared event and the individual
   * memory entries that each soul created from their perspective of that event.
   *
   * @param pool             — the shared memory pool
   * @param sharedEventId    — the ID of the shared event
   * @param individualMemoryIds — array of individual memory IDs to link
   * @returns Updated SharedMemoryPool
   */
  crossReference(
    pool: SharedMemoryPool,
    sharedEventId: string,
    individualMemoryIds: string[],
  ): SharedMemoryPool {
    // Verify the shared event exists
    const eventExists = pool.events.some(e => e.id === sharedEventId);
    if (!eventExists) {
      throw new Error(`Shared event ${sharedEventId} not found in pool`);
    }

    const crossReferences = new Map(pool.crossReferences);
    const existing = crossReferences.get(sharedEventId) ?? [];
    const merged = [...new Set([...existing, ...individualMemoryIds])];
    crossReferences.set(sharedEventId, merged);

    return {
      ...pool,
      crossReferences,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Assemble shared memories into a chronological group narrative.
   *
   * Produces a text summary of the group's shared history, ordered by
   * time, with annotations about who was present for each event.
   *
   * @param pool — the shared memory pool
   * @returns A human-readable narrative string
   */
  getGroupNarrative(pool: SharedMemoryPool): string {
    if (pool.events.length === 0) {
      return 'No shared memories have been recorded yet.';
    }

    const sorted = [...pool.events].sort((a, b) => a.timestamp - b.timestamp);
    const lines: string[] = ['=== Group Narrative ===', ''];

    for (const event of sorted) {
      const date = new Date(event.timestamp);
      const timestamp = date.toISOString().replace('T', ' ').slice(0, 19);
      const witnesses = event.witnesses.join(', ');
      const importanceLabel = event.importance >= 0.7 ? '[significant]'
        : event.importance >= 0.4 ? '[notable]'
        : '[minor]';

      lines.push(`[${timestamp}] ${importanceLabel}`);
      lines.push(`  Witnesses: ${witnesses}`);
      lines.push(`  ${event.content}`);

      if (event.tags.length > 0) {
        lines.push(`  Tags: ${event.tags.join(', ')}`);
      }

      // Check for cross-references
      const refs = pool.crossReferences.get(event.id);
      if (refs && refs.length > 0) {
        lines.push(`  Linked memories: ${refs.length} individual perspective(s)`);
      }

      lines.push('');
    }

    // Summary statistics
    const uniqueWitnesses = new Set(sorted.flatMap(e => e.witnesses));
    lines.push('--- Summary ---');
    lines.push(`Total shared events: ${sorted.length}`);
    lines.push(`Participating souls: ${[...uniqueWitnesses].join(', ')}`);
    lines.push(`Time span: ${new Date(sorted[0].timestamp).toISOString().slice(0, 10)} to ${new Date(sorted[sorted.length - 1].timestamp).toISOString().slice(0, 10)}`);

    return lines.join('\n');
  }

  /**
   * Get events filtered by tag.
   *
   * @param pool — the shared memory pool
   * @param tag  — the tag to filter by
   * @returns Array of SharedEvents matching the tag
   */
  getByTag(pool: SharedMemoryPool, tag: string): SharedEvent[] {
    const lowerTag = tag.toLowerCase();
    return pool.events.filter(
      event => event.tags.some(t => t.toLowerCase() === lowerTag),
    );
  }

  /**
   * Get events within a time range.
   *
   * @param pool  — the shared memory pool
   * @param since — start timestamp (inclusive)
   * @param until — end timestamp (inclusive)
   * @returns Array of SharedEvents within the range
   */
  getByTimeRange(pool: SharedMemoryPool, since: number, until: number): SharedEvent[] {
    return pool.events.filter(
      event => event.timestamp >= since && event.timestamp <= until,
    );
  }

  /**
   * Get the total number of events each soul witnessed.
   *
   * @param pool — the shared memory pool
   * @returns A record mapping soul ID to event count
   */
  getWitnessCount(pool: SharedMemoryPool): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const event of pool.events) {
      for (const witness of event.witnesses) {
        counts[witness] = (counts[witness] ?? 0) + 1;
      }
    }
    return counts;
  }
}

/** Singleton instance of the SharedMemory system. */
export const sharedMemory = new SharedMemory();
