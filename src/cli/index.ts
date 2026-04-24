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
const registry = program.command('registry').description('GrimHub remote soul registry (github.com/0x8i11i0n/grimoire)');

registry
  .command('list')
  .description('List souls in the remote GrimHub registry')
  .option('--tag <tag>', 'filter by tag')
  .option('--author <author>', 'filter by author')
  .option('--source <source>', 'filter by source material')
  .option('--min-score <n>', 'minimum authenticity score (0-10)', parseFloat)
  .action(async (opts: { tag?: string; author?: string; source?: string; minScore?: number }) => {
    try {
      const { listRemote } = await import('../registry/remote');
      console.log('\n  Fetching GrimHub registry...\n');
      const souls = await listRemote({
        tag: opts.tag,
        author: opts.author,
        source: opts.source,
        minScore: opts.minScore,
      });

      if (souls.length === 0) {
        console.log('  No souls found matching those filters.');
        return;
      }

      console.log(
        '  ' + 'NAME'.padEnd(22) + ' ' + 'AUTHOR'.padEnd(16) + ' ' +
        'AUTH'.padEnd(5) + ' ' + 'RES'.padEnd(5) + ' ' + 'TAGS'
      );
      console.log('  ' + '-'.repeat(80));

      for (const s of souls) {
        const tags = s.tags.slice(0, 3).join(', ');
        console.log(
          '  ' + s.name.padEnd(22) + ' ' + s.author.padEnd(16) + ' ' +
          String(s.authenticityScore).padEnd(5) + ' ' + String(s.resonanceScore).padEnd(5) + ' ' + tags
        );
      }

      console.log(`\n  ${souls.length} soul(s) found. Install with: grimoire registry install <name>`);
    } catch (e) {
      console.error(`Registry error: ${e instanceof Error ? e.message : e}`);
    }
  });

registry
  .command('search <query>')
  .description('Search the remote registry by name, description, source, or tags')
  .action(async (query: string) => {
    try {
      const { searchRemote } = await import('../registry/remote');
      console.log(`\n  Searching GrimHub for "${query}"...\n`);
      const results = await searchRemote(query);

      if (results.length === 0) {
        console.log(`  No results for "${query}".`);
        return;
      }

      for (const s of results) {
        console.log(`  ${s.displayName} (${s.name}) by ${s.author}`);
        console.log(`    ${s.source}`);
        console.log(`    ${s.description.slice(0, 90)}${s.description.length > 90 ? '...' : ''}`);
        console.log(`    Tags: ${s.tags.join(', ')}  |  Auth: ${s.authenticityScore}/10  Res: ${s.resonanceScore}/10`);
        console.log('');
      }
    } catch (e) {
      console.error(`Search failed: ${e instanceof Error ? e.message : e}`);
    }
  });

registry
  .command('info <name>')
  .description('Show full details for a soul in the remote registry')
  .action(async (name: string) => {
    try {
      const { getRemoteEntry } = await import('../registry/remote');
      const entry = await getRemoteEntry(name);

      if (!entry) {
        console.error(`Soul "${name}" not found in registry.`);
        process.exit(1);
      }

      console.log(`\n${'='.repeat(50)}`);
      console.log(`  ${entry.displayName}`);
      console.log(`${'='.repeat(50)}`);
      console.log(`  Name:        ${entry.name}`);
      console.log(`  Author:      ${entry.author}`);
      console.log(`  Version:     ${entry.version}`);
      console.log(`  Source:      ${entry.source}`);
      console.log(`  Tags:        ${entry.tags.join(', ')}`);
      console.log(`\n  ${entry.description}\n`);
      console.log(`  Authenticity: ${entry.authenticityScore}/10`);
      console.log(`  Resonance:    ${entry.resonanceScore}/10`);
      console.log(`  Downloads:    ${entry.downloads}`);
      console.log(`  Added:        ${entry.created}`);
      console.log(`\n  Install with: grimoire registry install ${entry.name}`);
      console.log(`${'='.repeat(50)}`);
    } catch (e) {
      console.error(`Info failed: ${e instanceof Error ? e.message : e}`);
    }
  });

registry
  .command('install <name>')
  .description('Download and install a soul from GrimHub')
  .option('-d, --dir <path>', 'target directory (default: Grimhub/souls)', '')
  .action(async (name: string, opts: { dir: string }) => {
    const root = findRoot();
    const targetDir = opts.dir || path.join(root, 'Grimhub', 'souls');

    try {
      const { downloadSoul, getRemoteEntry } = await import('../registry/remote');

      console.log(`\n  Looking up "${name}" in GrimHub...`);
      const entry = await getRemoteEntry(name);
      if (!entry) {
        console.error(`\n  Soul "${name}" not found. Run: grimoire registry search <query>`);
        process.exit(1);
      }

      console.log(`  Found: ${entry.displayName} by ${entry.author}`);
      console.log(`  Downloading ${entry.files.length} files...`);

      const destDir = await downloadSoul(name, targetDir);

      console.log(`\n  Installed: ${entry.displayName}`);
      console.log(`  Location:  ${destDir}`);
      console.log(`\n  Load with: grimoire load ${entry.name}`);
    } catch (e) {
      console.error(`\n  Install failed: ${e instanceof Error ? e.message : e}`);
      process.exit(1);
    }
  });

registry
  .command('submit <name>')
  .description('Validate a local soul and generate a GrimHub submission')
  .option('--author <github-username>', 'your GitHub username')
  .option('--tags <tags>', 'comma-separated tags (e.g. anime,fantasy)')
  .option('--description <desc>', 'short description of this soul')
  .action(async (name: string, opts: { author?: string; tags?: string; description?: string }) => {
    const root = findRoot();
    try {
      const { SoulLoader } = await import('../core/soul-loader');
      const { QualityGate } = await import('../registry/quality-gate');
      const { buildRegistryEntry } = await import('../registry/remote');

      const loader = new SoulLoader();
      const soulDir = await loader.findSoulDir(name, root);
      if (!soulDir) { console.error(`Soul not found: ${name}`); process.exit(1); }

      const files = await loader.loadSoul(soulDir);
      const gate = new QualityGate();
      const report = gate.validate(files, files.state);

      console.log(gate.generateReport(report));

      if (!report.passesGate) {
        console.log('\n  Soul did not pass the quality gate (need Auth ≥ 7, Resonance ≥ 6).');
        console.log('  Fix the issues above, then run submit again.');
        return;
      }

      const identity = files.state.identity as unknown as Record<string, unknown>;
      const soulName = String(identity.name ?? name).toLowerCase().replace(/[^a-z0-9-]/g, '-');
      const displayName = String(identity.name ?? name);
      const source = String(identity.source ?? 'Original');
      const version = String(identity.version ?? '1.0.0');
      const author = opts.author ?? 'your-github-username';
      const description = opts.description ?? `${displayName} from ${source}.`;
      const tags = opts.tags ? opts.tags.split(',').map(t => t.trim()) : [];

      const entry = buildRegistryEntry(soulName, displayName, author, version, source, description, tags, report.authenticityScore, report.resonanceScore);

      console.log('\n  ✓ Quality gate passed! Here is your registry entry JSON:\n');
      console.log(JSON.stringify(entry, null, 2));

      console.log(`
${'─'.repeat(60)}
HOW TO SUBMIT TO GRIMHUB
${'─'.repeat(60)}

1. Fork https://github.com/0x8i11i0n/grimoire

2. Copy your soul files into the fork:
   registry/souls/${soulName}/core.md
   registry/souls/${soulName}/full.md
   registry/souls/${soulName}/state.json

3. Add the JSON above into registry/index.json
   (append it to the "souls" array and increment "total")

4. Open a Pull Request to main. The quality gate CI
   will validate your soul automatically.

5. Once merged, your soul is live on GrimHub.
${'─'.repeat(60)}`);

    } catch (e) {
      console.error(`Submit failed: ${e instanceof Error ? e.message : e}`);
    }
  });

// ── migrate ──────────────────────────────────────────────────────────────────
program
  .command('migrate <name>')
  .description('Upgrade a soul\'s state.json (and optionally docs) to the latest Grimoire schema')
  .option('--dry-run', 'Preview changes without writing anything')
  .option('--rewrite-docs', 'Regenerate full.md and core.md via Claude API (requires ANTHROPIC_API_KEY)')
  .option('--path <dir>', 'Explicit soul directory path (skips name search)')
  .option('--model <model>', 'Claude model for --rewrite-docs (default: claude-opus-4-7)')
  .option('--registry', 'Look in registry/souls/ instead of Grimhub/souls/')
  .action(async (name: string, opts: {
    dryRun?: boolean;
    rewriteDocs?: boolean;
    path?: string;
    model?: string;
    registry?: boolean;
  }) => {
    const {
      fetchLatestVersion,
      fetchResearchProtocol,
      detectVersion,
      needsMigration,
      migrateState,
      rewriteDocs,
    } = await import('../core/migrator');
    const { SoulLoader } = await import('../core/soul-loader');
    const { StateManager } = await import('../core/state-manager');
    const { EventBus } = await import('../core/types');

    const root = findRoot();

    // ── Locate soul directory ──────────────────────────────────────────────
    let soulDir: string | null = null;

    if (opts.path) {
      soulDir = path.resolve(opts.path);
      if (!fs.existsSync(soulDir)) {
        console.error(`  Path not found: ${soulDir}`);
        process.exit(1);
      }
    } else if (opts.registry) {
      const registryDir = path.join(root, 'registry', 'souls', name.toLowerCase());
      soulDir = fs.existsSync(registryDir) ? registryDir : null;
    } else {
      const loader = new SoulLoader();
      soulDir = await loader.findSoulDir(name, root);
      // Fallback: check registry/souls/
      if (!soulDir) {
        const registryDir = path.join(root, 'registry', 'souls', name.toLowerCase());
        if (fs.existsSync(registryDir)) soulDir = registryDir;
      }
    }

    if (!soulDir) {
      console.error(`  Soul not found: "${name}"\n  Try --path <dir> or --registry flag.`);
      process.exit(1);
    }

    const stateFile = path.join(soulDir, 'state.json');
    const fullMdFile = path.join(soulDir, 'full.md');
    const coreMdFile = path.join(soulDir, 'core.md');

    if (!fs.existsSync(stateFile)) {
      console.error(`  No state.json found in: ${soulDir}`);
      process.exit(1);
    }

    // ── Read current files ─────────────────────────────────────────────────
    const rawJson = fs.readFileSync(stateFile, 'utf-8');
    let raw: Record<string, unknown>;
    try {
      raw = JSON.parse(rawJson) as Record<string, unknown>;
    } catch {
      console.error('  state.json is not valid JSON');
      process.exit(1);
    }

    const currentVersion = detectVersion(raw);
    console.log(`\n  Soul:     ${name}`);
    console.log(`  Dir:      ${soulDir}`);
    console.log(`  Version:  ${currentVersion}`);

    // ── Fetch latest version from GitHub ──────────────────────────────────
    process.stdout.write('  Fetching latest Grimoire version from GitHub... ');
    const latestVersion = await fetchLatestVersion();
    console.log(latestVersion);

    if (!needsMigration(raw)) {
      console.log(`\n  Already at latest schema (${currentVersion}). Nothing to do.`);
      return;
    }

    console.log(`\n  Migration: ${currentVersion} → ${latestVersion}`);

    // ── Run state migration ────────────────────────────────────────────────
    const events = new EventBus();
    const loader = new SoulLoader();
    const stateManager = new StateManager(loader, events);
    const defaults = stateManager.getDefaultState({ name, source: 'Unknown', version: latestVersion, created: Date.now(), summoner: 'grimoire-cli', anchors: [] });

    const migrated = migrateState(raw, latestVersion, defaults);

    // ── Show diff summary ──────────────────────────────────────────────────
    const addedFields: string[] = [];
    if (!raw.selfModel) addedFields.push('selfModel');
    if (!raw.voiceFingerprint) addedFields.push('voiceFingerprint');
    if (!raw.emotionalTopology) addedFields.push('emotionalTopology');
    if (!(raw.consciousnessMetrics as Record<string,unknown>)?.phi) addedFields.push('consciousnessMetrics');
    if (raw.emotional_architecture) addedFields.push('guard.domains (inverted from guard_topology)');
    if (raw.inner_life) addedFields.push('innerLife (from inner_life)');
    if (raw.drift && (raw.drift as Record<string,unknown>).drift_count !== undefined) addedFields.push('drift (restructured)');
    if (raw.blind_spots) addedFields.push('blindSpots (from blind_spots)');

    console.log('\n  Changes:');
    for (const f of addedFields) console.log(`    + ${f}`);
    console.log(`    ~ identity.version: ${currentVersion} → ${latestVersion}`);

    if (opts.dryRun) {
      console.log('\n  [dry-run] No files written.\n');
      console.log('  Migrated state preview:');
      console.log(JSON.stringify(migrated, null, 2).split('\n').slice(0, 40).join('\n') + '\n  ...');
      return;
    }

    // ── Write state.json ───────────────────────────────────────────────────
    fs.writeFileSync(`${stateFile}.bak`, rawJson, 'utf-8');
    fs.writeFileSync(stateFile, JSON.stringify(migrated, null, 2), 'utf-8');
    console.log(`\n  ✓ state.json migrated  (backup: state.json.bak)`);

    // ── Rewrite docs if requested ──────────────────────────────────────────
    if (opts.rewriteDocs) {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        console.error('\n  --rewrite-docs requires ANTHROPIC_API_KEY env var');
        process.exit(1);
      }

      const oldFullMd = fs.existsSync(fullMdFile) ? fs.readFileSync(fullMdFile, 'utf-8') : '';
      const oldCoreMd = fs.existsSync(coreMdFile) ? fs.readFileSync(coreMdFile, 'utf-8') : '';

      process.stdout.write('  Fetching research protocol from GitHub... ');
      const protocol = await fetchResearchProtocol();
      console.log('done');

      process.stdout.write('  Rewriting full.md via Claude API... ');
      let result: { fullMd: string; coreMd: string };
      try {
        result = await rewriteDocs({
          apiKey,
          model: opts.model ?? 'claude-opus-4-7',
          soulName: name,
          oldFullMd,
          oldCoreMd,
          protocol,
        });
      } catch (e) {
        console.error(`\n  Claude API error: ${e instanceof Error ? e.message : e}`);
        process.exit(1);
      }
      console.log('done');

      if (oldFullMd) fs.writeFileSync(`${fullMdFile}.bak`, oldFullMd, 'utf-8');
      if (oldCoreMd) fs.writeFileSync(`${coreMdFile}.bak`, oldCoreMd, 'utf-8');

      fs.writeFileSync(fullMdFile, result.fullMd, 'utf-8');
      fs.writeFileSync(coreMdFile, result.coreMd, 'utf-8');

      console.log('  ✓ full.md rewritten    (backup: full.md.bak)');
      console.log('  ✓ core.md rewritten    (backup: core.md.bak)');
    }

    console.log(`\n  Migration complete: ${name} is now at Grimoire v${latestVersion}`);
    if (!opts.rewriteDocs) {
      console.log('  Tip: run with --rewrite-docs to regenerate full.md and core.md\n       (requires ANTHROPIC_API_KEY)');
    }
    console.log();
  });

program.parse();
