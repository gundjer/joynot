import test from 'node:test';
import assert from 'node:assert/strict';
import { purchase, useBattery } from '../public/games/rustys-after-hours/js/supplies.js';
import { buildNight, findPath } from '../public/games/rustys-after-hours/js/world.js';
import { cameraMatrix, Mesh } from '../public/games/rustys-after-hours/js/scene3d.js';

test('coins buy usable supplies and permanent upgrades without duplicate charges', () => {
  const data = { tokens: 50 };
  assert.equal(purchase(data, 'battery'), true);
  assert.equal(purchase(data, 'lens'), true);
  assert.equal(purchase(data, 'chrome'), true);
  assert.equal(data.tokens, 12);
  assert.equal(purchase(data, 'lens'), false);
  assert.equal(purchase(data, 'missing'), false);
  const game = { battery: 15, lightOn: false };
  assert.equal(useBattery(data, game), true);
  assert.equal(game.battery, 100);
  assert.equal(game.lightOn, true);
  assert.equal(data.supplies.batteries, 0);
  assert.equal(useBattery(data, game), false);
  assert.equal(data.tokens, 12);
});

test('prizes cannot overdraw coins or stock more than five batteries', () => {
  const data = { tokens: 40 };
  for (let i = 0; i < 5; i++) assert.equal(purchase(data, 'battery'), true);
  assert.equal(purchase(data, 'battery'), false);
  assert.equal(purchase(data, 'lens'), false);
  assert.equal(data.tokens, 10);
});

test('every pizzeria has a dining room, stage, arcade and reachable escape supplies', () => {
  for (let night = 1; night <= 12; night++) for (let run = 0; run < 4; run++) {
    const w = buildNight(night);
    assert.equal(w.start.theme, 'dining');
    assert(w.rooms.some(r => r.theme === 'stage'));
    assert(w.doors.some(d => d.rooms.includes(w.start.id) && d.rooms.includes(1) && d.open));
    assert(w.rooms.some(r => r.theme === 'arcade'));
    assert.equal(w.items.filter(i => i.type === 'cell').length, w.cellsNeeded);
    assert(w.items.some(i => i.type === 'battery'));
    assert(w.items.some(i => i.type === 'coin'));
    for (const item of w.items) assert(findPath(w, w.startPos.x, w.startPos.y, item.x, item.y), `unreachable ${item.type} on night ${night}`);
  }
});

test('3D camera projects the point being viewed into the middle of the screen', () => {
  const m = cameraMatrix([2, 1, 3], [2, 1, 2], 16 / 9);
  const target = [2, 1, 2, 1], clip = [0, 0, 0, 0];
  for (let row = 0; row < 4; row++) for (let i = 0; i < 4; i++) clip[row] += m[i * 4 + row] * target[i];
  assert(Math.abs(clip[0]) < .0001); assert(Math.abs(clip[1]) < .0001); assert(clip[3] > 0);
  const mesh = new Mesh(); mesh.box(0, 0, 0, 1, 1, 1, '#ffffff');
  assert.equal(mesh.data.length, 360);
  assert(mesh.data.every(Number.isFinite));
});
