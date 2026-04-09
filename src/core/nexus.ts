// ============================================================
// The Nexus — Temporal Knowledge Graph
// Entity-relation graph with temporal validity tracking
// ============================================================

import Database from 'better-sqlite3';
import {
  KnowledgeNode,
  KnowledgeEdge,
  generateId,
} from './types';

const NODES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS nodes (
    id TEXT PRIMARY KEY,
    entity TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    properties TEXT NOT NULL DEFAULT '{}',
    valid_from INTEGER NOT NULL,
    valid_to INTEGER,
    soul_id TEXT NOT NULL
  )
`;

const EDGES_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS edges (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    target_id TEXT NOT NULL,
    relation TEXT NOT NULL,
    weight REAL NOT NULL DEFAULT 1.0,
    valid_from INTEGER NOT NULL,
    valid_to INTEGER,
    evidence TEXT NOT NULL DEFAULT '[]',
    soul_id TEXT NOT NULL,
    FOREIGN KEY (source_id) REFERENCES nodes(id),
    FOREIGN KEY (target_id) REFERENCES nodes(id)
  )
`;

const NEXUS_INDEXES_SQL = [
  'CREATE INDEX IF NOT EXISTS idx_nodes_entity ON nodes(entity)',
  'CREATE INDEX IF NOT EXISTS idx_nodes_soul_id ON nodes(soul_id)',
  'CREATE INDEX IF NOT EXISTS idx_nodes_valid ON nodes(valid_from, valid_to)',
  'CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id)',
  'CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id)',
  'CREATE INDEX IF NOT EXISTS idx_edges_soul_id ON edges(soul_id)',
  'CREATE INDEX IF NOT EXISTS idx_edges_relation ON edges(relation)',
  'CREATE INDEX IF NOT EXISTS idx_edges_valid ON edges(valid_from, valid_to)',
];

function rowToNode(row: Record<string, unknown>): KnowledgeNode {
  let properties: Record<string, unknown> = {};
  if (typeof row.properties === 'string') {
    try { properties = JSON.parse(row.properties); } catch { /* use empty */ }
  }
  return {
    id: row.id as string,
    entity: row.entity as string,
    entityType: row.entity_type as KnowledgeNode['entityType'],
    properties,
    validFrom: row.valid_from as number,
    validTo: (row.valid_to as number) ?? null,
    soulId: row.soul_id as string,
  };
}

function safeJsonParse(value: unknown, fallback: unknown = []): unknown {
  if (typeof value !== 'string') return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function rowToEdge(row: Record<string, unknown>): KnowledgeEdge {
  return {
    id: row.id as string,
    sourceId: row.source_id as string,
    targetId: row.target_id as string,
    relation: row.relation as string,
    weight: row.weight as number,
    validFrom: row.valid_from as number,
    validTo: (row.valid_to as number) ?? null,
    evidence: safeJsonParse(row.evidence, []) as string[],
    soulId: row.soul_id as string,
  };
}

export class Nexus {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.initialize();
  }

  private initialize(): void {
    this.db.exec(NODES_TABLE_SQL);
    this.db.exec(EDGES_TABLE_SQL);
    for (const sql of NEXUS_INDEXES_SQL) {
      this.db.exec(sql);
    }
  }

  addNode(node: Omit<KnowledgeNode, 'id'>): KnowledgeNode {
    const id = generateId();
    const full: KnowledgeNode = { ...node, id };

    this.db.prepare(`
      INSERT INTO nodes (id, entity, entity_type, properties, valid_from, valid_to, soul_id)
      VALUES (@id, @entity, @entityType, @properties, @validFrom, @validTo, @soulId)
    `).run({
      id: full.id,
      entity: full.entity,
      entityType: full.entityType,
      properties: JSON.stringify(full.properties),
      validFrom: full.validFrom,
      validTo: full.validTo,
      soulId: full.soulId,
    });

    return full;
  }

  addEdge(edge: Omit<KnowledgeEdge, 'id'>): KnowledgeEdge {
    const id = generateId();
    const full: KnowledgeEdge = { ...edge, id };

    this.db.prepare(`
      INSERT INTO edges (id, source_id, target_id, relation, weight, valid_from, valid_to, evidence, soul_id)
      VALUES (@id, @sourceId, @targetId, @relation, @weight, @validFrom, @validTo, @evidence, @soulId)
    `).run({
      id: full.id,
      sourceId: full.sourceId,
      targetId: full.targetId,
      relation: full.relation,
      weight: full.weight,
      validFrom: full.validFrom,
      validTo: full.validTo,
      evidence: JSON.stringify(full.evidence),
      soulId: full.soulId,
    });

    return full;
  }

  query(entity: string, soulId: string): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const nodeRows = this.db.prepare(
      `SELECT * FROM nodes
       WHERE entity = ? AND soul_id = ? AND valid_to IS NULL`
    ).all(entity, soulId) as Record<string, unknown>[];

    const nodes = nodeRows.map(rowToNode);
    const edges: KnowledgeEdge[] = [];

    for (const node of nodes) {
      const edgeRows = this.db.prepare(
        `SELECT * FROM edges
         WHERE (source_id = ? OR target_id = ?) AND valid_to IS NULL`
      ).all(node.id, node.id) as Record<string, unknown>[];

      for (const row of edgeRows) {
        const edge = rowToEdge(row);
        if (!edges.find(e => e.id === edge.id)) {
          edges.push(edge);
        }
      }
    }

    return { nodes, edges };
  }

  getRelationships(nodeId: string): KnowledgeEdge[] {
    const rows = this.db.prepare(
      `SELECT * FROM edges
       WHERE (source_id = ? OR target_id = ?) AND valid_to IS NULL`
    ).all(nodeId, nodeId) as Record<string, unknown>[];

    return rows.map(rowToEdge);
  }

  invalidate(id: string, timestamp: number): boolean {
    const nodeResult = this.db.prepare(
      `UPDATE nodes SET valid_to = ? WHERE id = ? AND valid_to IS NULL`
    ).run(timestamp, id);

    if (nodeResult.changes > 0) return true;

    const edgeResult = this.db.prepare(
      `UPDATE edges SET valid_to = ? WHERE id = ? AND valid_to IS NULL`
    ).run(timestamp, id);

    return edgeResult.changes > 0;
  }

  getActiveGraph(soulId: string): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const nodeRows = this.db.prepare(
      `SELECT * FROM nodes WHERE soul_id = ? AND valid_to IS NULL`
    ).all(soulId) as Record<string, unknown>[];

    const edgeRows = this.db.prepare(
      `SELECT * FROM edges WHERE soul_id = ? AND valid_to IS NULL`
    ).all(soulId) as Record<string, unknown>[];

    return {
      nodes: nodeRows.map(rowToNode),
      edges: edgeRows.map(rowToEdge),
    };
  }

  getTemporalSnapshot(soulId: string, timestamp: number): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const nodeRows = this.db.prepare(
      `SELECT * FROM nodes
       WHERE soul_id = ? AND valid_from <= ?
         AND (valid_to IS NULL OR valid_to > ?)`
    ).all(soulId, timestamp, timestamp) as Record<string, unknown>[];

    const edgeRows = this.db.prepare(
      `SELECT * FROM edges
       WHERE soul_id = ? AND valid_from <= ?
         AND (valid_to IS NULL OR valid_to > ?)`
    ).all(soulId, timestamp, timestamp) as Record<string, unknown>[];

    return {
      nodes: nodeRows.map(rowToNode),
      edges: edgeRows.map(rowToEdge),
    };
  }

  traverseFrom(nodeId: string, depth: number): { nodes: KnowledgeNode[]; edges: KnowledgeEdge[] } {
    const visitedNodeIds = new Set<string>();
    const visitedEdgeIds = new Set<string>();
    const resultNodes: KnowledgeNode[] = [];
    const resultEdges: KnowledgeEdge[] = [];
    const queue: Array<{ id: string; currentDepth: number }> = [{ id: nodeId, currentDepth: 0 }];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (visitedNodeIds.has(current.id)) continue;
      visitedNodeIds.add(current.id);

      const nodeRow = this.db.prepare(
        `SELECT * FROM nodes WHERE id = ? AND valid_to IS NULL`
      ).get(current.id) as Record<string, unknown> | undefined;

      if (!nodeRow) continue;
      resultNodes.push(rowToNode(nodeRow));

      if (current.currentDepth >= depth) continue;

      const edgeRows = this.db.prepare(
        `SELECT * FROM edges
         WHERE (source_id = ? OR target_id = ?) AND valid_to IS NULL`
      ).all(current.id, current.id) as Record<string, unknown>[];

      for (const row of edgeRows) {
        const edge = rowToEdge(row);

        if (!visitedEdgeIds.has(edge.id)) {
          visitedEdgeIds.add(edge.id);
          resultEdges.push(edge);
        }

        const neighborId = edge.sourceId === current.id ? edge.targetId : edge.sourceId;
        if (!visitedNodeIds.has(neighborId)) {
          queue.push({ id: neighborId, currentDepth: current.currentDepth + 1 });
        }
      }
    }

    return { nodes: resultNodes, edges: resultEdges };
  }

  getNodeById(id: string): KnowledgeNode | null {
    const row = this.db.prepare(
      'SELECT * FROM nodes WHERE id = ?'
    ).get(id) as Record<string, unknown> | undefined;

    return row ? rowToNode(row) : null;
  }

  getEdgeById(id: string): KnowledgeEdge | null {
    const row = this.db.prepare(
      'SELECT * FROM edges WHERE id = ?'
    ).get(id) as Record<string, unknown> | undefined;

    return row ? rowToEdge(row) : null;
  }

  findNodeByEntity(entity: string, soulId: string): KnowledgeNode | null {
    const row = this.db.prepare(
      `SELECT * FROM nodes
       WHERE entity = ? AND soul_id = ? AND valid_to IS NULL
       ORDER BY valid_from DESC LIMIT 1`
    ).get(entity, soulId) as Record<string, unknown> | undefined;

    return row ? rowToNode(row) : null;
  }

  updateNodeProperties(nodeId: string, properties: Record<string, unknown>, timestamp: number): KnowledgeNode | null {
    const existing = this.getNodeById(nodeId);
    if (!existing || existing.validTo !== null) return null;

    this.db.prepare(
      `UPDATE nodes SET valid_to = ? WHERE id = ?`
    ).run(timestamp, nodeId);

    return this.addNode({
      entity: existing.entity,
      entityType: existing.entityType,
      properties: { ...existing.properties, ...properties },
      validFrom: timestamp,
      validTo: null,
      soulId: existing.soulId,
    });
  }

  updateEdge(edgeId: string, updates: Partial<Pick<KnowledgeEdge, 'weight' | 'evidence'>>, timestamp: number): KnowledgeEdge | null {
    const existing = this.getEdgeById(edgeId);
    if (!existing || existing.validTo !== null) return null;

    // Resolve current valid node IDs — if a node was updated via
    // updateNodeProperties, the original ID is invalidated and a
    // replacement node exists for the same entity.
    const resolveNodeId = (nodeId: string): string => {
      const node = this.getNodeById(nodeId);
      if (node && node.validTo === null) return nodeId;
      // Node was invalidated; find its replacement by entity
      if (node) {
        const replacement = this.findNodeByEntity(node.entity, node.soulId);
        if (replacement) return replacement.id;
      }
      return nodeId; // fallback to original
    };

    this.db.prepare(
      `UPDATE edges SET valid_to = ? WHERE id = ?`
    ).run(timestamp, edgeId);

    return this.addEdge({
      sourceId: resolveNodeId(existing.sourceId),
      targetId: resolveNodeId(existing.targetId),
      relation: existing.relation,
      weight: updates.weight ?? existing.weight,
      validFrom: timestamp,
      validTo: null,
      evidence: updates.evidence ?? existing.evidence,
      soulId: existing.soulId,
    });
  }
}

export function createNexus(db: Database.Database): Nexus {
  return new Nexus(db);
}
