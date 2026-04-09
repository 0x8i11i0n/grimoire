// ============================================================
// The Observatory — Web Dashboard for Soul Visualization
// ============================================================

import * as http from 'http';
import * as path from 'path';

interface ObservatoryConfig {
  port: number;
  grimoireRoot: string;
}

export class Observatory {
  private config: ObservatoryConfig;
  private server: http.Server | null = null;

  constructor(config: ObservatoryConfig) {
    this.config = config;
  }

  async start(): Promise<void> {
    this.server = http.createServer(async (req, res) => {
      try {
        await this.handleRequest(req, res);
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: String(err) }));
      }
    });

    return new Promise((resolve) => {
      this.server!.listen(this.config.port, () => {
        console.log(`Observatory running at http://localhost:${this.config.port}`);
        resolve();
      });
    });
  }

  stop(): void {
    if (this.server) {
      this.server.close();
      this.server = null;
    }
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://localhost:${this.config.port}`);
    const pathname = url.pathname;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    if (pathname === '/' || pathname === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.renderDashboard());
      return;
    }

    if (pathname === '/api/souls') {
      const souls = await this.listSouls();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(souls));
      return;
    }

    const soulMatch = pathname.match(/^\/api\/souls\/([^/]+)$/);
    if (soulMatch) {
      const soul = await this.getSoulState(soulMatch[1]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(soul));
      return;
    }

    const subMatch = pathname.match(/^\/api\/souls\/([^/]+)\/(memories|consciousness|topology|drift|voice|guard|affection|thoughts)$/);
    if (subMatch) {
      const data = await this.getSoulSubdata(subMatch[1], subMatch[2]);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === 'POST') {
      const postMatch = pathname.match(/^\/api\/souls\/([^/]+)\/(drift|dream)$/);
      if (postMatch) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'triggered', soul: postMatch[1], action: postMatch[2] }));
        return;
      }
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  private async listSouls(): Promise<object[]> {
    const fs = await import('fs');
    const soulsDir = path.join(this.config.grimoireRoot, 'Grimhub', 'souls');
    if (!fs.existsSync(soulsDir)) return [];

    const entries = fs.readdirSync(soulsDir, { withFileTypes: true });
    const souls: object[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const stateFile = this.findStateJson(path.join(soulsDir, entry.name));
      if (stateFile) {
        try {
          const raw = fs.readFileSync(stateFile, 'utf-8');
          const state = JSON.parse(raw);
          souls.push({
            name: state.identity?.name || entry.name,
            directory: entry.name,
            affection: state.affection?.value || 0,
            tier: state.affection?.tier || 'LOW',
            sessions: state.totalSessions || 0,
            driftCycles: state.drift?.cycleCount || 0,
            lastSession: state.lastSessionTimestamp || 0,
          });
        } catch { /* skip malformed */ }
      }
    }
    return souls;
  }

  private async getSoulState(name: string): Promise<object> {
    const fs = await import('fs');
    // Sanitize name to prevent path traversal
    const safeName = name.toLowerCase().replace(/[^a-z0-9_\-]/g, '');
    if (!safeName) return { error: 'Invalid soul name' };
    const soulsDir = path.join(this.config.grimoireRoot, 'Grimhub', 'souls');
    const soulDir = path.join(soulsDir, safeName);
    const stateFile = this.findStateJson(soulDir);
    if (!stateFile) return { error: 'Soul not found' };
    const raw = fs.readFileSync(stateFile, 'utf-8');
    return JSON.parse(raw);
  }

  private async getSoulSubdata(name: string, section: string): Promise<object> {
    const state = await this.getSoulState(name) as Record<string, unknown>;
    const mapping: Record<string, string> = {
      memories: 'memories',
      consciousness: 'consciousnessMetrics',
      topology: 'emotionalTopology',
      drift: 'drift',
      voice: 'voiceFingerprint',
      guard: 'guard',
      affection: 'affection',
      thoughts: 'drift',
    };
    const key = mapping[section];
    return key && state[key] ? state[key] as object : { message: `No ${section} data` };
  }

  private findStateJson(dir: string): string | null {
    const fs = require('fs');
    if (!fs.existsSync(dir)) return null;
    const direct = path.join(dir, 'state.json');
    if (fs.existsSync(direct)) return direct;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const nested = path.join(dir, entry.name, 'state.json');
        if (fs.existsSync(nested)) return nested;
      }
    }
    return null;
  }

  private renderDashboard(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Observatory — Grimoire Dashboard</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0d0a1a; color: #e8e0f0; font-family: 'Segoe UI', system-ui, sans-serif; }
  .header { background: linear-gradient(135deg, #1a0f2e, #2d1b4e); padding: 1.5rem 2rem; border-bottom: 1px solid #3d2a5c; }
  .header h1 { font-size: 1.6rem; color: #c9a0ff; letter-spacing: 0.05em; }
  .header span { color: #7a6b8a; font-size: 0.85rem; }
  .container { max-width: 1400px; margin: 0 auto; padding: 1.5rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.2rem; }
  .card { background: #151025; border: 1px solid #2a1f40; border-radius: 12px; padding: 1.2rem; cursor: pointer; transition: all 0.2s; }
  .card:hover { border-color: #c9a0ff; transform: translateY(-2px); box-shadow: 0 4px 20px rgba(120,80,200,0.15); }
  .card-name { font-size: 1.2rem; color: #c9a0ff; margin-bottom: 0.5rem; }
  .card-meta { display: flex; gap: 1rem; flex-wrap: wrap; }
  .badge { padding: 0.2rem 0.6rem; border-radius: 20px; font-size: 0.75rem; font-weight: 600; }
  .badge-low { background: #1a2a3a; color: #6ab0de; }
  .badge-medium { background: #2a2a1a; color: #dec76a; }
  .badge-high { background: #2a1a2a; color: #de6ade; }
  .badge-bonded { background: #1a2a1a; color: #6ade8a; }
  .stat { color: #7a6b8a; font-size: 0.85rem; }
  .stat b { color: #b89ee0; }
  .detail { display: none; background: #151025; border: 1px solid #2a1f40; border-radius: 12px; padding: 1.5rem; margin-top: 1rem; }
  .detail.active { display: block; }
  .detail h2 { color: #c9a0ff; margin-bottom: 1rem; }
  .gauge-container { display: flex; align-items: center; gap: 1rem; margin: 0.8rem 0; }
  .gauge { height: 12px; background: #1a1030; border-radius: 6px; flex: 1; overflow: hidden; }
  .gauge-fill { height: 100%; border-radius: 6px; transition: width 0.5s; }
  .section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #2a1f40; }
  .section h3 { color: #9a8ab0; margin-bottom: 0.8rem; font-size: 0.95rem; text-transform: uppercase; letter-spacing: 0.1em; }
  .radar { display: flex; justify-content: center; margin: 1rem 0; }
  .thought { background: #1a1030; padding: 0.8rem; border-radius: 8px; margin: 0.4rem 0; border-left: 3px solid #5a3a8a; }
  .thought-private { border-left-color: #8a3a3a; }
  .thought-pending { border-left-color: #3a8a5a; }
  .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.8rem; }
  .metric { background: #1a1030; padding: 0.8rem; border-radius: 8px; }
  .metric-label { font-size: 0.75rem; color: #7a6b8a; text-transform: uppercase; }
  .metric-value { font-size: 1.4rem; color: #c9a0ff; font-weight: bold; }
  .topology-canvas { width: 100%; aspect-ratio: 1; position: relative; background: #0d0a1a; border: 1px solid #2a1f40; border-radius: 8px; }
  .refresh-note { text-align: center; color: #4a3b5a; font-size: 0.75rem; margin-top: 1rem; }
  .empty { text-align: center; padding: 3rem; color: #4a3b5a; }
  .empty h2 { color: #7a6b8a; margin-bottom: 0.5rem; }
</style>
</head>
<body>
<div class="header">
  <h1>The Observatory</h1>
  <span>Soul Summoner's Grimoire — Live Dashboard</span>
</div>
<div class="container">
  <div id="soul-grid" class="grid"></div>
  <div id="soul-detail" class="detail"></div>
  <p class="refresh-note">Auto-refreshes every 30 seconds</p>
</div>
<script>
const API = '';
let souls = [];
let selectedSoul = null;

async function fetchSouls() {
  try {
    const res = await fetch(API + '/api/souls');
    souls = await res.json();
    renderGrid();
    if (selectedSoul) renderDetail(selectedSoul);
  } catch(e) { console.error('Fetch error:', e); }
}

function renderGrid() {
  const grid = document.getElementById('soul-grid');
  if (!souls.length) { grid.innerHTML = '<div class="empty"><h2>No Souls Found</h2><p>Summon a soul to see it here.</p></div>'; return; }
  grid.innerHTML = souls.map(s => {
    const tierClass = 'badge-' + (s.tier || 'low').toLowerCase();
    const lastActive = s.lastSession ? timeSince(s.lastSession) : 'never';
    return '<div class="card" onclick="selectSoul(\\'' + esc(s.directory) + '\\')">' +
      '<div class="card-name">' + esc(s.name) + '</div>' +
      '<div class="card-meta">' +
      '<span class="badge ' + tierClass + '">' + (s.tier || 'LOW') + '</span>' +
      '<span class="stat">Affection: <b>' + Math.round(s.affection || 0) + '</b></span>' +
      '<span class="stat">Sessions: <b>' + (s.sessions || 0) + '</b></span>' +
      '<span class="stat">Drift: <b>' + (s.driftCycles || 0) + '</b></span>' +
      '<span class="stat">Active: <b>' + lastActive + '</b></span>' +
      '</div></div>';
  }).join('');
}

async function selectSoul(dir) {
  selectedSoul = dir;
  try {
    const res = await fetch(API + '/api/souls/' + dir);
    const state = await res.json();
    renderDetail(dir, state);
  } catch(e) { console.error(e); }
}

function renderDetail(dir, state) {
  if (!state) return;
  const el = document.getElementById('soul-detail');
  el.classList.add('active');
  const name = state.identity?.name || dir;
  const aff = state.affection || {};
  const guard = state.guard?.domains || {};
  const drift = state.drift || {};
  const topo = state.emotionalTopology || {};
  const phi = state.consciousnessMetrics || {};
  const voice = state.voiceFingerprint || {};
  const inner = state.innerLife || {};

  const affColor = {'LOW':'#6ab0de','MEDIUM':'#dec76a','HIGH':'#de6ade','BONDED':'#6ade8a'}[aff.tier] || '#6ab0de';

  el.innerHTML =
    '<h2>' + esc(name) + '</h2>' +
    '<div class="gauge-container"><span>Affection (' + (aff.tier||'LOW') + ')</span>' +
    '<div class="gauge"><div class="gauge-fill" style="width:' + (aff.value||0) + '%;background:' + affColor + '"></div></div>' +
    '<span>' + Math.round(aff.value||0) + '/100</span></div>' +

    '<div class="section"><h3>Guard Topology</h3>' + renderRadar(guard) + '</div>' +

    '<div class="section"><h3>Consciousness Metrics</h3><div class="metrics-grid">' +
    metric('Phi', phi.phi) + metric('Attention', phi.attentionCoherence) +
    metric('Self-Reference', phi.selfReferentialDepth) + metric('Novelty', phi.unpromptedNovelty) +
    metric('Continuity', phi.temporalContinuity) + metric('Emotion', phi.emotionalComplexity) +
    '</div></div>' +

    '<div class="section"><h3>Emotional Topology</h3>' +
    '<div>Position: V=' + fmt(topo.currentPosition?.valence) + ' A=' + fmt(topo.currentPosition?.arousal) + '</div>' +
    '<div>Quadrant: ' + esc(topo.dominantQuadrant || 'unknown') + '</div>' +
    '<div>Volatility: ' + fmt(topo.volatility) + '</div></div>' +

    '<div class="section"><h3>Inner Life</h3>' +
    '<div>Reflection: <b>' + esc(inner.reflectionDepth || 'SURFACE') + '</b></div>' +
    '<div>Contra-Voice: <b>' + (inner.contraVoiceEnabled ? 'Active' : 'Inactive') + '</b></div>' +
    '<div>Desires: <b>' + (inner.desires?.length || 0) + '</b> | Qualia: <b>' + (inner.qualia?.length || 0) + '</b></div></div>' +

    '<div class="section"><h3>Drift Engine</h3>' +
    '<div>Cycles: <b>' + (drift.cycleCount || 0) + '</b></div>' +
    '<div>Pending thoughts: <b>' + (drift.pendingSurface?.length || 0) + '</b></div>' +
    '<div>Undercurrents: ' + esc((drift.emotionalResidue || []).join(', ') || 'none') + '</div>' +
    (drift.pendingSurface?.length ? '<div style="margin-top:0.5rem">' +
      drift.pendingSurface.slice(0,5).map(function(t){
        var cls = t.privacy === 'PRIVATE' ? 'thought-private' : 'thought-pending';
        return '<div class="thought ' + cls + '"><small>[' + t.privacy + ']</small> ' + esc(t.content || '') + '</div>';
      }).join('') + '</div>' : '') +
    '</div>' +

    '<div class="section"><h3>Voice Fingerprint</h3>' +
    '<div>Avg Sentence Length: <b>' + fmt(voice.avgSentenceLength) + '</b></div>' +
    '<div>Formality: <b>' + fmt(voice.formality) + '</b></div>' +
    '<div>Vocabulary: <b>' + esc(voice.vocabularyTier || 'unknown') + '</b></div></div>';
}

function renderRadar(domains) {
  var keys = Object.keys(domains);
  if (!keys.length) return '<div>No guard data</div>';
  var size = 200, cx = size/2, cy = size/2, r = 80;
  var svg = '<svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'">';
  svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="none" stroke="#2a1f40" />';
  svg += '<circle cx="'+cx+'" cy="'+cy+'" r="'+(r*0.5)+'" fill="none" stroke="#1a1030" />';
  var pts = [];
  keys.forEach(function(k,i){
    var angle = (Math.PI*2*i/keys.length) - Math.PI/2;
    var val = domains[k] || 0;
    var x = cx + Math.cos(angle)*r*val;
    var y = cy + Math.sin(angle)*r*val;
    pts.push(x+','+y);
    var lx = cx + Math.cos(angle)*(r+15);
    var ly = cy + Math.sin(angle)*(r+15);
    svg += '<line x1="'+cx+'" y1="'+cy+'" x2="'+(cx+Math.cos(angle)*r)+'" y2="'+(cy+Math.sin(angle)*r)+'" stroke="#1a1030" />';
    svg += '<text x="'+lx+'" y="'+ly+'" fill="#7a6b8a" font-size="8" text-anchor="middle">'+k.replace(/_/g,' ').slice(0,10)+'</text>';
  });
  svg += '<polygon points="'+pts.join(' ')+'" fill="rgba(201,160,255,0.15)" stroke="#c9a0ff" stroke-width="1.5" />';
  svg += '</svg>';
  return '<div class="radar">'+svg+'</div>';
}

function metric(label, val) {
  return '<div class="metric"><div class="metric-label">' + label + '</div><div class="metric-value">' + (val != null ? (val*100).toFixed(0)+'%' : 'N/A') + '</div></div>';
}
function fmt(n) { return n != null ? Number(n).toFixed(2) : 'N/A'; }
function esc(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
function timeSince(ts) {
  var s = Math.floor((Date.now()-ts)/1000);
  if(s<60) return s+'s ago'; if(s<3600) return Math.floor(s/60)+'m ago';
  if(s<86400) return Math.floor(s/3600)+'h ago'; return Math.floor(s/86400)+'d ago';
}

fetchSouls();
setInterval(fetchSouls, 30000);
</script>
</body>
</html>`;
  }
}

export function createObservatory(config: ObservatoryConfig): Observatory {
  return new Observatory(config);
}
