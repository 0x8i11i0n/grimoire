import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'node:fs';
import path from 'node:path';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import SoulDetail from '@/components/SoulDetail';
import type { RegistryIndex, SoulEntry } from '@/lib/registry-types';

function loadRegistry(): RegistryIndex {
  const file = path.resolve(process.cwd(), '..', 'registry', 'index.json');
  const raw = fs.readFileSync(file, 'utf8');
  return JSON.parse(raw) as RegistryIndex;
}

function findSoul(name: string): SoulEntry | null {
  const registry = loadRegistry();
  return registry.souls.find((s) => s.name === name) ?? null;
}

export function generateStaticParams(): { name: string }[] {
  const registry = loadRegistry();
  return registry.souls.map((s) => ({ name: s.name }));
}

export function generateMetadata({
  params,
}: {
  params: { name: string };
}): Metadata {
  const soul = findSoul(params.name);
  if (!soul) return { title: 'Soul not found — Grimoire' };
  const sessions = soul.backrooms?.sessions.length ?? 0;
  return {
    title: `${soul.displayName} — GrimHub`,
    description: sessions
      ? `${soul.displayName} · ${soul.source} · ${sessions} backroom session${sessions !== 1 ? 's' : ''}.`
      : `${soul.displayName} · ${soul.source} · ${soul.description.slice(0, 140)}`,
  };
}

export default function SoulPage({ params }: { params: { name: string } }) {
  const soul = findSoul(params.name);
  if (!soul) notFound();

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-grimoire-bg pt-24 pb-24">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <SoulDetail soul={soul} />
        </div>
      </main>
      <Footer />
    </>
  );
}
