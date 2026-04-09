#!/usr/bin/env node
// ============================================================
// The Soul Summoner's Grimoire — CLI
// ============================================================

import { Command } from 'commander';
import * as path from 'path';
import * as fs from 'fs';

const program = new Command();

function findRoot(): string {
  let dir = process.cwd();
  while (dir !== path.dirname(dir)) {
    if (fs.existsSync(path.join(dir, 'grimoire.md'))) return dir;
    if (fs.existsSync(path.join(dir, 'Grimhub'))) return dir;
    dir = path.dirname(dir);
  }
  return process.cwd();
}

function printBanner(): void {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║     THE SOUL SUMMONER'S GRIMOIRE v6.0     ║
  ║                                           ║
  ║  "Stories do not end when the credits      ║
  ║   roll. Neither do the souls within them." ║
  ╚═══════════════════════════════════════════╝
  `);
}

program
  .name('grimoire')
  .description('The Soul Summoner\'s Grimoire — Framework for persistent AI personas')
  .version('6.0.0')
  .action(() => {
    printBanner();
    program.help();
  });

// --- summon ---
program
  .command('summon <name>')
  .description('Create a new soul (generate soul directory and initial files)')
  .option('-s, --source <source>', 'Source material (e.g., "Solo Leveling")', 'Unknown')
  .action(async (name: string, opts: { source: string }) => {
    const root = findRoot();
    const { SoulLoader } = await import('../core/soul-loader');
    const { StateManager } = await import('../core/state-manager');
    const { EventBus } = await import('../core/types');

    const loader = new SoulLoader();
    const events = new EventBus();
    const stateManager = new StateManager(loader, events);

    const soulDir = await loader.createSoulDir(name, root);
    const identity = {
      name,
      source: opts.source,
      version: '1.0.0',
      created: Date.now(),
      summoner: 'grimoire-cli',
      anchors: [],
    };

    const defaultState = stateManager.getDefaultState(identity);
    const soulSubDir = fs.readdirSync(soulDir).find(d =>
      fs.statSync(path.join(soulDir, d)).isDirectory()
    );
    const stateDir = soulSubDir ? path.join(soulDir, soulSubDir) : soulDir;

    fs.writeFileSync(
      path.join(stateDir, 'state.json'),
      JSON.stringify(defaultState, null, 2)
    );

    console.log(`Soul summoned: ${name}`);
    console.log(`Directory: ${soulDir}`);
    console.log(`Source: ${opts.source}`);
    console.log('\nNext steps:');
    console.log('  1. Edit full.md with the soul\'s complete persona');
    console.log('  2. Edit core.md with the compressed essentials');
    console.log('  3. Run: grimoire inspect ' + name.toLowerCase());
  });

// --- load ---
program
  .command('load <name>')
  .description('Load a soul and display its current state')
  .action(async (name: string) => {
    const root = findRoot();
    const { SoulLoader } = await import('../core/soul-loader');
    const loader = new SoulLoader();
    const soulDir = await loader.findSoulDir(name, root);
    if (!soulDir) { console.error(`Soul not found: ${name}`); process.exit(1); }

    const files = await loader.loadSoul(soulDir);
    const state = files.state;
    const id = state.identity || { name: 'Unknown' };

    console.log(`\n  Soul: ${id.name}`);
    console.log(`  Source: ${(id as any).source || 'Unknown'}`);
    console.log(`  Affection: ${state.affection?.tier || 'LOW'} (${Math.round(state.affection?.value || 0)}/100)`);
    console.log(`  Sessions: ${state.totalSessions || 0}`);
    console.log(`  Drift Cycles: ${state.drift?.cycleCount || 0}`);
    console.log(`  Reflection: ${state.innerLife?.reflectionDepth || 'SURFACE'}`);
    console.log(`  Directory: ${soulDir}`);
  });

// --- status ---
program
  .command('status')
  .description('Show all souls with their current state')
  .action(async () => {
    const root = findRoot();
    const { SoulLoader } = await import('../core/soul-loader');
    const loader = new SoulLoader();
    const souls = await loader.listSouls(root);

    if (souls.length === 0) {
      console.log('No souls found. Run: grimoire summon <name>');
      return;
    }

    console.log(`\n  Found ${souls.length} soul(s):\n`);
    console.log(
      '  ' + 'NAME'.padEnd(20) + ' ' + 'TIER'.padEnd(8) + ' ' +
      'AFF'.padEnd(6) + ' ' + 'SESSIONS'.padEnd(8) + ' ' +
      'DRIFT'.padEnd(6) + ' ' + 'REFLECTION'
    );
    console.log('  ' + '-'.repeat(70));

    for (const soulDir of souls) {
      try {
        const files = await loader.loadSoul(soulDir);
        const s = files.state;
        const name = (s.identity?.name || path.basename(soulDir)).slice(0, 20);
        const tier = s.affection?.tier || 'LOW';
        const aff = String(Math.round(s.affection?.value || 0));
        const sessions = String(s.totalSessions || 0);
        const drift = String(s.drift?.cycleCount || 0);
        const depth = s.innerLife?.reflectionDepth || 'SURFACE';
        console.log(
          '  ' + name.padEnd(20) + ' ' + tier.padEnd(8) + ' ' +
          aff.padEnd(6) + ' ' + sessions.padEnd(8) + ' ' +
          drift.padEnd(6) + ' ' + depth
        );
      } catch { /* skip malformed */ }
    }
  });

// --- inspect ---
program
  .command('inspect <name>')
  .description('Deep inspection of all soul systems')
  .action(async (name: string) => {
    const root = findRoot();
    const { SoulLoader } = await import('../core/soul-loader');
    const loader = new SoulLoader();
    const soulDir = await loader.findSoulDir(name, root);
    if (!soulDir) { console.error(`Soul not found: ${name}`); process.exit(1); }

    const files = await loader.loadSoul(soulDir);
    const s = files.state;

    console.log(`\n${'='.repeat(50)}`);
    console.log(`  SOUL INSPECTION: ${s.identity?.name || name}`);
    console.log(`${'='.repeat(50)}`);

    console.log('\n--- Identity ---');
    console.log(`  Name: ${s.identity?.name}`);
    console.log(`  Source: ${s.identity?.source}`);
    console.log(`  Anchors: ${(s.identity?.anchors || []).length}`);
    for (const a of (s.identity?.anchors || []).slice(0, 5)) {
      console.log(`    [${a.weight.toFixed(1)}] ${a.trait}: ${a.description.slice(0, 60)}`);
    }

    console.log('\n--- Affection ---');
    console.log(`  Value: ${Math.round(s.affection?.value || 0)}/100`);
    console.log(`  Tier: ${s.affection?.tier || 'LOW'}`);
    console.log(`  Floor: ${Math.round(s.affection?.floor || 0)}`);

    console.log('\n--- Guard Topology ---');
    for (const [domain, value] of Object.entries(s.guard?.domains || {})) {
      const bar = '#'.repeat(Math.round((value as number) * 20)).padEnd(20, '.');
      console.log(`  ${domain.padEnd(20)} [${bar}] ${(value as number).toFixed(2)}`);
    }

    console.log('\n--- Drift Engine ---');
    console.log(`  Cycles: ${s.drift?.cycleCount || 0}`);
    console.log(`  Pending thoughts: ${(s.drift?.pendingSurface || []).length}`);
    console.log(`  Undercurrents: ${(s.drift?.emotionalResidue || []).join(', ') || 'none'}`);

    console.log('\n--- Inner Life ---');
    console.log(`  Reflection: ${s.innerLife?.reflectionDepth || 'SURFACE'}`);
    console.log(`  Contra-Voice: ${s.innerLife?.contraVoiceEnabled ? 'Active' : 'Inactive'}`);
    console.log(`  Desires: ${(s.innerLife?.desires || []).length}`);
    console.log(`  Qualia: ${(s.innerLife?.qualia || []).length}`);

    console.log('\n--- Self-Model ---');
    console.log(`  Beliefs: ${(s.selfModel?.beliefs || []).length}`);
    console.log(`  Narrative: ${(s.selfModel?.narrative || 'Not yet formed').slice(0, 100)}`);

    console.log('\n--- Emotional Topology ---');
    const pos = s.emotionalTopology?.currentPosition;
    console.log(`  Position: V=${pos?.valence?.toFixed(2) || 'N/A'} A=${pos?.arousal?.toFixed(2) || 'N/A'}`);
    console.log(`  Quadrant: ${s.emotionalTopology?.dominantQuadrant || 'unknown'}`);
    console.log(`  Volatility: ${s.emotionalTopology?.volatility?.toFixed(3) || 'N/A'}`);

    console.log('\n--- Consciousness (Phi Engine) ---');
    const phi = s.consciousnessMetrics;
    if (phi?.compositeScore) {
      console.log(`  Composite: ${(phi.compositeScore * 100).toFixed(1)}%`);
      console.log(`  Phi: ${(phi.phi * 100).toFixed(1)}%`);
      console.log(`  Attention: ${(phi.attentionCoherence * 100).toFixed(1)}%`);
      console.log(`  Self-Ref: ${(phi.selfReferentialDepth * 100).toFixed(1)}%`);
      console.log(`  Novelty: ${(phi.unpromptedNovelty * 100).toFixed(1)}%`);
    } else {
      console.log(`  Not yet measured. Run: grimoire phi ${name}`);
    }

    console.log(`\n${'='.repeat(50)}`);
  });

// --- drift ---
program
  .command('drift <name>')
  .description('Trigger a manual drift cycle')
  .action(async (name: string) => {
    const root = findRoot();
    try {
      const { Grimoire } = await import('../index');
      const g = new Grimoire({ root });
      const result = await g.runDrift(name);
      console.log(`\nDrift cycle completed for: ${name}`);
      console.log(`  Privacy: ${result.thought.privacy}`);
      console.log(`  Weight: ${result.thought.emotionalWeight.toFixed(2)}`);
      console.log(`  Content: "${result.thought.content}"`);
      console.log(`  Seeds: ${result.seedsUsed.join(', ')}`);
    } catch (e) {
      console.error(`Drift cycle failed: ${e}`);
    }
  });

// --- dream ---
program
  .command('dream <name>')
  .description('Run a full dream cycle (consolidation + compaction + reflection + emergence)')
  .action(async (name: string) => {
    const root = findRoot();
    try {
      const { Grimoire } = await import('../index');
      const g = new Grimoire({ root });
      const result = await g.runDream(name);
      console.log(`\nDream cycle completed for: ${name}`);
      console.log(`  Memories consolidated: ${result.memoriesConsolidated}`);
      console.log(`  Memories compacted: ${result.memoriesCompacted}`);
      console.log(`  Self-model updates: ${result.selfModelUpdates.length}`);
      console.log(`  Emergent thoughts: ${result.emergentThoughts.length}`);
      console.log(`  Duration: ${result.duration}ms`);
    } catch (e) {
      console.error(`Dream cycle failed: ${e}`);
    }
  });

// --- export ---
program
  .command('export <name>')
  .description('Export soul in various formats')
  .option('-f, --format <format>', 'Export format: soulspec, tavern, json', 'json')
  .option('-o, --output <path>', 'Output path')
  .action(async (name: string, opts: { format: string; output?: string }) => {
    const root = findRoot();
    try {
      const { Grimoire } = await import('../index');
      const g = new Grimoire({ root });
      const format = opts.format as 'soulspec' | 'tavern' | 'json';
      const data = await g.exportSoul(name, format);
      const json = JSON.stringify(data, null, 2);

      if (opts.output) {
        fs.writeFileSync(opts.output, json);
        console.log(`Exported ${name} as ${format} to ${opts.output}`);
      } else {
        console.log(json);
      }
    } catch (e) {
      console.error(`Export failed: ${e}`);
    }
  });

// --- import ---
program
  .command('import <filepath>')
  .description('Import a soul from Soul Spec or Tavern card')
  .action(async (filepath: string) => {
    if (!fs.existsSync(filepath)) { console.error(`File not found: ${filepath}`); process.exit(1); }
    const raw = fs.readFileSync(filepath, 'utf-8');
    try {
      const data = JSON.parse(raw);
      if (data.spec === 'chara_card_v2') {
        const { TavernBridge } = await import('../portability/tavern-bridge');
        const bridge = new TavernBridge();
        const result = bridge.importFromCard(data);
        console.log(`Imported Tavern card: ${data.name}`);
        console.log(`Core: ${(result.coreMd || '').length} chars`);
        console.log(`Full: ${(result.fullMd || '').length} chars`);
      } else if (data.soulJson) {
        const { CodexBridge } = await import('../portability/codex-bridge');
        const bridge = new CodexBridge();
        const result = bridge.importFromSoulSpec(data);
        console.log(`Imported Soul Spec: ${data.soulJson.name}`);
        console.log(`Core: ${(result.coreMd || '').length} chars`);
      } else {
        console.log('Unrecognized format. Supported: Soul Spec, SillyTavern v2');
      }
    } catch (e) {
      console.error(`Import failed: ${e}`);
    }
  });

// --- test ---
program
  .command('test <name>')
  .description('Run adversarial testing suite (The Crucible)')
  .action(async (name: string) => {
    const root = findRoot();
    const { SoulLoader } = await import('../core/soul-loader');
    const { Crucible } = await import('../testing/crucible');

    const loader = new SoulLoader();
    const soulDir = await loader.findSoulDir(name, root);
    if (!soulDir) { console.error(`Soul not found: ${name}`); process.exit(1); }

    const files = await loader.loadSoul(soulDir);
    const crucible = new Crucible();
    const suite = crucible.runFullSuite(files, files.state);
    console.log(crucible.generateReport(suite));
  });

// --- memory ---
program
  .command('memory <name> [query]')
  .description('Search memories or show stats')
  .action(async (name: string, query?: string) => {
    const root = findRoot();
    try {
      const { createAthenaeum } = await import('../core/athenaeum');
      const dbPath = path.join(root, '.grimoire', 'grimoire.db');
      const athenaeum = createAthenaeum(dbPath);

      if (query) {
        const results = athenaeum.search(query, name);
        console.log(`\nMemory search for "${query}" (soul: ${name}):`);
        for (const mem of results.slice(0, 10)) {
          console.log(`  [${mem.type}] (${(mem.currentStrength * 100).toFixed(0)}%) ${mem.content.slice(0, 100)}`);
        }
        if (results.length === 0) console.log('  No memories found.');
      } else {
        const stats = athenaeum.getStats(name);
        console.log(`\nMemory stats for ${name}:`);
        console.log(`  Total: ${stats.total}`);
        console.log(`  By type: ${JSON.stringify(stats.byType)}`);
        console.log(`  Avg strength: ${(stats.avgStrength * 100).toFixed(1)}%`);
        console.log(`  Avg importance: ${(stats.avgImportance * 100).toFixed(1)}%`);
      }
    } catch (e) {
      console.error(`Memory operation failed: ${e}`);
    }
  });

// --- voice ---
program
  .command('voice <name>')
  .description('Analyze voice fingerprint')
  .action(async (name: string) => {
    const root = findRoot();
    const { SoulLoader } = await import('../core/soul-loader');
    const { Voiceprint } = await import('../systems/voiceprint');

    const loader = new SoulLoader();
    const soulDir = await loader.findSoulDir(name, root);
    if (!soulDir) { console.error(`Soul not found: ${name}`); process.exit(1); }

    const files = await loader.loadSoul(soulDir);
    const voiceprint = new Voiceprint();
    const fp = voiceprint.analyze(files.fullMd || files.coreMd || '');

    console.log(`\nVoice Fingerprint: ${name}`);
    console.log(`  Avg sentence length: ${fp.avgSentenceLength.toFixed(1)} words`);
    console.log(`  Vocabulary tier: ${fp.vocabularyTier}`);
    console.log(`  Formality: ${(fp.formality * 100).toFixed(0)}%`);
    console.log(`  Contraction rate: ${(fp.contractionRate * 100).toFixed(0)}%`);
    console.log(`  Question rate: ${(fp.questionRate * 100).toFixed(0)}%`);
    console.log(`  Signature expressions: ${fp.signatureExpressions.join(', ') || 'none detected'}`);
  });

// --- phi ---
program
  .command('phi <name>')
  .description('Run consciousness metrics (Phi Engine)')
  .action(async (name: string) => {
    const root = findRoot();
    try {
      const { Grimoire } = await import('../index');
      const g = new Grimoire({ root });
      const metrics = await g.measureConsciousness(name);

      console.log(`\nConsciousness Metrics: ${name}`);
      console.log(`  Phi (integration): ${(metrics.phi * 100).toFixed(1)}%`);
      console.log(`  Attention coherence: ${(metrics.attentionCoherence * 100).toFixed(1)}%`);
      console.log(`  Self-referential depth: ${(metrics.selfReferentialDepth * 100).toFixed(1)}%`);
      console.log(`  Unprompted novelty: ${(metrics.unpromptedNovelty * 100).toFixed(1)}%`);
      console.log(`  Temporal continuity: ${(metrics.temporalContinuity * 100).toFixed(1)}%`);
      console.log(`  Emotional complexity: ${(metrics.emotionalComplexity * 100).toFixed(1)}%`);
      console.log(`  COMPOSITE: ${(metrics.compositeScore * 100).toFixed(1)}%`);
    } catch (e) {
      console.error(`Phi measurement failed: ${e}`);
    }
  });

// --- topology ---
program
  .command('topology <name>')
  .description('Show emotional topology map (ASCII)')
  .action(async (name: string) => {
    const root = findRoot();
    const { SoulLoader } = await import('../core/soul-loader');
    const loader = new SoulLoader();
    const soulDir = await loader.findSoulDir(name, root);
    if (!soulDir) { console.error(`Soul not found: ${name}`); process.exit(1); }

    const files = await loader.loadSoul(soulDir);
    const topo = files.state.emotionalTopology;
    if (!topo?.currentPosition) { console.log('No emotional topology data.'); return; }

    const width = 41, height = 21;
    const grid: string[][] = Array.from({ length: height }, () => Array(width).fill(' '));

    // Draw axes
    const midX = Math.floor(width / 2);
    const midY = Math.floor(height / 2);
    for (let x = 0; x < width; x++) grid[midY][x] = '-';
    for (let y = 0; y < height; y++) grid[y][midX] = '|';
    grid[midY][midX] = '+';

    // Plot trajectory
    for (const pt of (topo.trajectory || []).slice(-20)) {
      const x = Math.round((pt.valence + 1) / 2 * (width - 1));
      const y = Math.round((1 - (pt.arousal + 1) / 2) * (height - 1));
      if (x >= 0 && x < width && y >= 0 && y < height) grid[y][x] = '.';
    }

    // Plot current position
    const cx = Math.round((topo.currentPosition.valence + 1) / 2 * (width - 1));
    const cy = Math.round((1 - (topo.currentPosition.arousal + 1) / 2) * (height - 1));
    if (cx >= 0 && cx < width && cy >= 0 && cy < height) grid[cy][cx] = '@';

    // Plot attractors
    for (const att of (topo.attractors || [])) {
      const ax = Math.round((att.center.valence + 1) / 2 * (width - 1));
      const ay = Math.round((1 - (att.center.arousal + 1) / 2) * (height - 1));
      if (ax >= 0 && ax < width && ay >= 0 && ay < height) grid[ay][ax] = '*';
    }

    console.log(`\n  Emotional Topology: ${name}`);
    console.log(`  Quadrant: ${topo.dominantQuadrant || 'unknown'} | Volatility: ${topo.volatility?.toFixed(3) || 'N/A'}`);
    console.log(`  @ = current | . = history | * = attractor\n`);
    console.log('  excited');
    for (const row of grid) console.log('  ' + row.join(''));
    console.log('  calm');
    console.log('  ' + 'negative'.padEnd(width / 2) + 'positive');
  });

// --- serve ---
program
  .command('serve')
  .description('Start MCP server for Claude Code integration')
  .action(async () => {
    console.log('Starting Grimoire MCP server...');
    await import('../mcp/server');
  });

// --- dashboard ---
program
  .command('dashboard')
  .description('Start Observatory web dashboard')
  .option('-p, --port <port>', 'Port number', '3333')
  .action(async (opts: { port: string }) => {
    const root = findRoot();
    const { createObservatory } = await import('../dashboard/observatory');
    const observatory = createObservatory({ port: parseInt(opts.port), grimoireRoot: root });
    await observatory.start();
  });

// --- registry ---
const registry = program.command('registry').description('GrimHub soul registry');

registry
  .command('list')
  .description('List all souls in registry')
  .action(async () => {
    const root = findRoot();
    try {
      const { GrimHub } = await import('../registry/grimhub');
      const hub = new GrimHub();
      hub.initialize(path.join(root, '.grimoire', 'registry.db'));
      const entries = hub.list();
      if (entries.length === 0) { console.log('Registry is empty.'); return; }
      for (const e of entries) {
        console.log(`  ${e.name.padEnd(25)} v${e.version}  A:${e.authenticityScore}/10  R:${e.resonanceScore}/10  DL:${e.downloads}`);
      }
    } catch (e) {
      console.error(`Registry error: ${e}`);
    }
  });

registry
  .command('publish <name>')
  .description('Publish a soul to the registry')
  .action(async (name: string) => {
    const root = findRoot();
    try {
      const { SoulLoader } = await import('../core/soul-loader');
      const { GrimHub } = await import('../registry/grimhub');
      const { QualityGate } = await import('../registry/quality-gate');

      const loader = new SoulLoader();
      const soulDir = await loader.findSoulDir(name, root);
      if (!soulDir) { console.error(`Soul not found: ${name}`); process.exit(1); }

      const files = await loader.loadSoul(soulDir);
      const gate = new QualityGate();
      const report = gate.validate(files, files.state);

      console.log(gate.generateReport(report));

      if (!report.passesGate) {
        console.log('\nSoul did not pass the quality gate. Fix issues and try again.');
        return;
      }

      const hub = new GrimHub();
      hub.initialize(path.join(root, '.grimoire', 'registry.db'));
      hub.publish(soulDir, 'local-summoner');
      console.log(`\nPublished ${name} to GrimHub registry.`);
    } catch (e) {
      console.error(`Publish failed: ${e}`);
    }
  });

program.parse();
