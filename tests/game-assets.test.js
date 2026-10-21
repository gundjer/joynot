import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const name = path.join(dir, entry.name);
    return entry.isDirectory() ? files(name) : [name];
  });
}

test('all local game module imports exist in the shipped public files', () => {
  const missing = [];
  for (const file of files(path.join(publicDir, 'games')).filter(f => f.endsWith('.js'))) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/^\s*(?:import|export)\s+[^;\n]*?from\s+['"]([^'"]+)['"]/gm)) {
      const specifier = match[1].split('?')[0];
      if (!specifier.startsWith('.') && !specifier.startsWith('/')) continue;
      const target = specifier.startsWith('/') ? path.join(publicDir, specifier) : path.resolve(path.dirname(file), specifier);
      if (!fs.existsSync(target)) missing.push(`${path.relative(publicDir, file)} → ${specifier}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('the service worker only precaches files that exist', () => {
  const source = fs.readFileSync(path.join(publicDir, 'sw.js'), 'utf8').split('const ASSETS = [')[1].split('];')[0];
  const missing = [...source.matchAll(/'([^']+)'/g)].map(m => m[1]).filter(asset => !fs.existsSync(path.join(publicDir, asset)));
  assert.deepEqual(missing, []);
});
