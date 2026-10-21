import test from 'node:test';
import assert from 'node:assert/strict';

const memory = new Map();
globalThis.window = { JOYNOT: { game: 'rustys-after-hours', kid: { id: 7, name: 'Tester' }, urls: { progress: '/progress', save: '/save' } } };
globalThis.document = { querySelector: () => ({ content: 'csrf' }) };
globalThis.localStorage = { getItem: key => memory.get(key) || null, setItem: (key, value) => memory.set(key, value) };
const { Store } = await import('../public/games/rustys-after-hours/js/storage.js');

test('a new parent reset wins over an offline workshop save with a future timestamp', async () => {
  const originalFetch = globalThis.fetch;
  memory.clear();
  memory.set('joynot_rustys-after-hours_kid_7_v1', JSON.stringify({ stage: 1, night: 8, bots: [{ name: 'Old', kind: 'bear' }], updatedAt: 9999999999999 }));
  const state = { resetId: 'reset-one', reset: true, parentEditAt: 100, updatedAt: 100, settings: { voices: false } };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ state }) });
  try {
    await Store.load();
    assert.equal(Store.data.stage, 0); assert.equal(Store.data.night, 1);
    assert.deepEqual(Store.data.bots, []); assert.equal(Store.data.tokens, 0);
    assert.equal(Store.data.seenResetId, 'reset-one'); assert.equal(Store.data.settings.voices, false);
  } finally { globalThis.fetch = originalFetch; }
});

test('syncing an open workshop discards its state, clears queued answers and reports a reset', async () => {
  const originalFetch = globalThis.fetch;
  Store.data.stage = 1; Store.data.bots = [{ kind: 'bunny', name: 'Old' }];
  memory.set('joynot_rustys-after-hours_queue_v1', JSON.stringify([{ kid_id: 7, prompt: 'old answer' }, { kid_id: 8, prompt: 'other kid' }]));
  let change;
  Store.onExternalChange = event => { change = event; };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ state: { resetId: 'reset-two', parentEditAt: 200 } }) });
  try {
    await Store.sync();
    assert.deepEqual(change, { reset: true }); assert.equal(Store.data.stage, 0);
    assert.deepEqual(Store.data.bots, []);
    assert.deepEqual(JSON.parse(memory.get('joynot_rustys-after-hours_queue_v1')), [{ kid_id: 8, prompt: 'other kid' }]);
  } finally { Store.onExternalChange = null; globalThis.fetch = originalFetch; }
});
