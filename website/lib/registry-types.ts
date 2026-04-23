export interface BackroomSession {
  file: string;
  number: number;
  date: string;
  title: string;
  summary: string;
  affectionStart: string;
  affectionEnd: string;
  sizeKb: number;
}

export interface BackroomsManifest {
  sourcePath: string;
  sessions: BackroomSession[];
}

export interface SoulEntry {
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
  backrooms?: BackroomsManifest;
  created: string;
  updated: string;
  image?: string;
}

export interface RegistryIndex {
  version: string;
  updated: string;
  total: number;
  souls: SoulEntry[];
}

export const REGISTRY_RAW_BASE =
  'https://raw.githubusercontent.com/0x8i11i0n/grimoire/main';

export const REGISTRY_URL = `${REGISTRY_RAW_BASE}/registry/index.json`;

export function backroomFileUrl(manifest: BackroomsManifest, file: string): string {
  return `${REGISTRY_RAW_BASE}/${manifest.sourcePath}/${file}`;
}
