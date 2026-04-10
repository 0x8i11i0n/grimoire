#!/usr/bin/env node
// ============================================================
// GrimHub Soul Validator — standalone CI script (no build needed)
// Usage: node scripts/validate-soul.js registry/souls/mysoul [registry/souls/other ...]
// Exit code 0 = all passed, 1 = one or more failed
// ============================================================

const fs = require('fs');
const path = require('path');

const REQUIRED_FILES = ['core.md', 'full.md', 'state.json'];
const MIN_AUTHENTICITY = 7;
const MIN_RESONANCE = 6;

function check(label, passed, detail) {
  const icon = passed ? '[+]' : '[-]';
  console.log(`  ${icon} ${label}: ${detail}`);
  return passed;
}

function validateSoul(soulDir) {
  console.log(`\n${'─'.repeat(56)}`);
  console.log(`  Validating: ${soulDir}`);
  console.log(`${'─'.repeat(56)}`);

  const results = [];

  // 1. Directory exists
  if (!fs.existsSync(soulDir) || !fs.statSync(soulDir).isDirectory()) {
    console.error(`  [!] Directory not found: ${soulDir}`);
    return false;
  }

  // 2. Required files
  const missingFiles = REQUIRED_FILES.filter(f => !fs.existsSync(path.join(soulDir, f)));
  results.push(check(
    'required_files',
    missingFiles.length === 0,
    missingFiles.length === 0 ? 'core.md, full.md, state.json present' : `Missing: ${missingFiles.join(', ')}`
  ));

  if (missingFiles.length > 0) {
    console.log(`\n  FAILED — missing required files.\n`);
    return false;
  }

  // 3. Parse state.json
  let state;
  try {
    state = JSON.parse(fs.readFileSync(path.join(soulDir, 'state.json'), 'utf-8'));
  } catch (e) {
    results.push(check('state_json', false, `Invalid JSON: ${e.message}`));
    console.log(`\n  FAILED — invalid state.json.\n`);
    return false;
  }

  // 4. Identity
  const identityName = state.identity?.name || state.soul || state.name;
  results.push(check(
    'identity_name',
    !!identityName,
    identityName ? `name = "${identityName}"` : 'missing identity.name'
  ));

  // 5. Affection system
  const aff = state.affection;
  const affOk = aff && typeof aff.score === 'number' || (aff && typeof aff.value === 'number');
  const affTierOk = aff && ['LOW', 'MEDIUM', 'HIGH', 'BONDED'].includes(aff.tier);
  results.push(check(
    'affection_system',
    affOk && affTierOk,
    affOk && affTierOk ? `tier=${aff.tier}` : 'missing or invalid affection state'
  ));

  // 6. Guard topology
  const guard = state.guard || state.emotional_architecture?.guard_topology;
  const guardDomains = state.guard?.domains ||
    (state.emotional_architecture?.guard_topology
      ? state.emotional_architecture.guard_topology
      : null);
  const guardCount = guardDomains ? Object.keys(guardDomains).length : 0;
  results.push(check(
    'guard_topology',
    guardCount >= 5,
    guardCount >= 5 ? `${guardCount} domains` : `only ${guardCount} guard domains (need ≥5)`
  ));

  // 7. Inner life / qualia
  const il = state.inner_life || state.innerLife;
  const hasQualia = il && (Array.isArray(il.qualia) || Array.isArray(il.recent_qualia));
  const hasDepth = il && (il.reflection_depth || il.reflectionDepth);
  results.push(check(
    'inner_life',
    !!(hasQualia || hasDepth),
    hasQualia ? 'qualia present' : hasDepth ? 'reflection depth present' : 'no inner life state'
  ));

  // 8. Content depth
  const coreMd = fs.readFileSync(path.join(soulDir, 'core.md'), 'utf-8');
  const fullMd = fs.readFileSync(path.join(soulDir, 'full.md'), 'utf-8');
  const coreOk = coreMd.length >= 500;
  const fullOk = fullMd.length >= 2000;
  results.push(check(
    'content_depth',
    coreOk && fullOk,
    `core.md=${coreMd.length} chars (${coreOk ? 'ok' : 'need ≥500'}), full.md=${fullMd.length} chars (${fullOk ? 'ok' : 'need ≥2000'})`
  ));

  // 9. Voice samples
  const quotes = (fullMd.match(/"[^"]{10,}"/g) || []).length;
  const hasVoiceSection = /voice|speech|dialogue|tone/i.test(fullMd);
  results.push(check(
    'voice_samples',
    quotes >= 3 && hasVoiceSection,
    `${quotes} quoted samples, voice section: ${hasVoiceSection}`
  ));

  // Scoring
  const passedCount = results.filter(Boolean).length;
  const totalChecks = results.length;

  // Compute rough authenticity/resonance
  const anchorCheck = !!(state.identity?.anchors?.length >= 3 || state.emotional_architecture);
  const authenticity = Math.round(
    ((quotes / 10) * 3 + (coreOk && fullOk ? 3 : 1) + (anchorCheck ? 4 : 2)) * 10
  ) / 10;
  const resonance = Math.round(
    ((hasQualia ? 2.5 : 1) + (guardCount >= 8 ? 2.5 : guardCount / 8 * 2.5) +
    (hasVoiceSection ? 2.5 : 1) + (hasDepth ? 2.5 : 1)) * 10
  ) / 10;

  const auth = Math.min(10, authenticity);
  const res = Math.min(10, resonance);

  console.log(`\n  Authenticity: ${auth}/10 ${auth >= MIN_AUTHENTICITY ? 'PASS' : 'FAIL'}`);
  console.log(`  Resonance:    ${res}/10 ${res >= MIN_RESONANCE ? 'PASS' : 'FAIL'}`);
  console.log(`  Checks:       ${passedCount}/${totalChecks} passed`);

  const passed = passedCount >= Math.ceil(totalChecks * 0.75) && auth >= MIN_AUTHENTICITY && res >= MIN_RESONANCE;
  console.log(`\n  Gate: ${passed ? 'PASSED' : 'FAILED'}\n`);
  return passed;
}

// Main
const args = process.argv.slice(2).filter(Boolean);

if (args.length === 0) {
  // Auto-discover all souls in registry/souls/
  const soulsDir = path.join(process.cwd(), 'registry', 'souls');
  if (fs.existsSync(soulsDir)) {
    const entries = fs.readdirSync(soulsDir).map(d => path.join(soulsDir, d));
    args.push(...entries);
  }
}

if (args.length === 0) {
  console.log('Usage: node scripts/validate-soul.js <soul-dir> [<soul-dir> ...]');
  console.log('       node scripts/validate-soul.js  (validates all registry/souls/*)');
  process.exit(0);
}

let allPassed = true;
for (const soulDir of args) {
  const passed = validateSoul(soulDir);
  if (!passed) allPassed = false;
}

console.log(`\n${'═'.repeat(56)}`);
console.log(`  Result: ${allPassed ? 'ALL SOULS PASSED' : 'ONE OR MORE SOULS FAILED'}`);
console.log(`${'═'.repeat(56)}\n`);

process.exit(allPassed ? 0 : 1);
