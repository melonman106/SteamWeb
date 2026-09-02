#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const gamesDir    = path.join(__dirname, '..', 'games');
const manifestPath = path.join(gamesDir, 'manifest.json');

if (!fs.existsSync(gamesDir)) {
  fs.mkdirSync(gamesDir, { recursive: true });
  console.log('Created empty games/ directory');
}

const entries = fs.readdirSync(gamesDir, { withFileTypes: true });
const games = [];

for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  if (entry.name.startsWith('.')) continue;

  const gameDir   = path.join(gamesDir, entry.name);
  const indexPath = path.join(gameDir, 'index.html');

  // Skip folders without an index.html
  if (!fs.existsSync(indexPath)) {
    console.log(`  skipped: ${entry.name}/ (no index.html)`);
    continue;
  }

  // Defaults — prettify folder name
  const prettyName = entry.name
    .split(/[-_]/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const game = {
    name:   prettyName,
    folder: entry.name,
    banner: '',
    video:  '',
    desc:   ''
  };

  // Override with meta.json if present
  const metaPath = path.join(gameDir, 'meta.json');
  if (fs.existsSync(metaPath)) {
    try {
      const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
      if (meta.name)   game.name   = meta.name;
      if (meta.banner) game.banner = meta.banner;
      if (meta.video)  game.video  = meta.video;
      if (meta.desc)   game.desc   = meta.desc;
    } catch (e) {
      console.warn(`  warning: bad meta.json in ${entry.name}/ — ${e.message}`);
    }
  }

  games.push(game);
}

// Sort alphabetically by name
games.sort((a, b) => a.name.localeCompare(b.name));

fs.writeFileSync(manifestPath, JSON.stringify(games, null, 2) + '\n');

console.log(`\n✓ Generated manifest with ${games.length} game(s):`);
for (const g of games) {
  console.log(`  • ${g.name}  →  games/${g.folder}/index.html`);
}
if (games.length === 0) {
  console.log('  (no game folders found — add folders with index.html under games/)');
}
