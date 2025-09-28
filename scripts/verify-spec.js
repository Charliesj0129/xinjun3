const fs = require('fs');
const path = require('path');

const SOURCE_EXT = new Set(['.ts', '.tsx', '.js']);

function collectFiles(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results = results.concat(collectFiles(full));
    } else if (SOURCE_EXT.has(path.extname(entry))) {
      results.push(full);
    }
  }
  return results;
}

const filesCache = {};
function getFilesFor(dir) {
  if (!filesCache[dir]) {
    filesCache[dir] = collectFiles(dir);
  }
  return filesCache[dir];
}

function fileContains(file, regex) {
  const text = fs.readFileSync(file, 'utf-8');
  return regex.test(text);
}

const checks = [
  {
    description: 'Entropy / Upkeep hooks implemented',
    dirs: ['src'],
    regex: /applyEntropy|enforceUpkeep|habit_stats|momentumStacks/,
    expectMatch: true,
  },
  {
    description: 'Guardrails and applyDelta usage',
    dirs: ['src'],
    regex: /Guardrails|maxInstantDelta|applyDelta\(/,
    expectMatch: true,
  },
  {
    description: 'No direct resource += mutations',
    dirs: ['src'],
    regex: /(energy|stress|focus|health)\s*[+\-]=/,
    expectMatch: false,
  },
  {
    description: 'Event queue and seeded crisis handling present',
    dirs: ['src/logic'],
    regex: /queueChain|queueCrisis|createSeededRng/,
    expectMatch: true,
  },
  {
    description: 'Build / Prestige structures referenced',
    dirs: ['src'],
    regex: /BuildId|PrestigeState|keystone/,
    expectMatch: true,
  },
  {
    description: 'Ritual crafting types present',
    dirs: ['src'],
    regex: /RitualRecipe|focusShard|clarityShard/,
    expectMatch: true,
  },
  {
    description: 'Reduced motion handling in UI',
    dirs: ['src/screens'],
    regex: /reduceMotion|prefers-reduced-motion/,
    expectMatch: true,
  }
];

for (const check of checks) {
  const files = check.dirs.flatMap(dir => getFilesFor(dir));
  const matchedFiles = files.filter(file => fileContains(file, check.regex));
  const matched = matchedFiles.length > 0;
  if (check.expectMatch ? matched : !matched) {
    console.log(`✓ ${check.description}`);
  } else {
    console.error(`✗ ${check.description}`);
    if (matchedFiles.length) {
      matchedFiles.forEach(file => console.error(`  ${file}`));
    }
    process.exitCode = 1;
  }
}
