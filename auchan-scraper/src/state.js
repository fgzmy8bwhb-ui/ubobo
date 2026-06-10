const fs = require('fs');
const path = require('path');

const STATE_DIR = path.resolve(__dirname, '../output/state');
fs.mkdirSync(STATE_DIR, { recursive: true });

function statePath(slug) {
  return path.join(STATE_DIR, `${slug}.json`);
}

function load(slug) {
  const p = statePath(slug);
  if (!fs.existsSync(p)) return { lastPage: 0, productIds: [] };
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch { return { lastPage: 0, productIds: [] }; }
}

function save(slug, state) {
  fs.writeFileSync(statePath(slug), JSON.stringify(state, null, 2));
}

function reset(slug) {
  const p = statePath(slug);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

module.exports = { load, save, reset };
