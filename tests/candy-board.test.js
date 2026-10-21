import test from 'node:test';
import assert from 'node:assert/strict';
import { newMatch, restoreMatch, unlockRoll, roll, nextTurn, tilePoint, LINKS, FINISH, controllerTag, SHIRTS } from '../public/games/sparkles-rainbow-journey/js/board.js';

const seats = [{ name: 'Child', character: 2 }, { name: 'Dad', character: 2, remote: true }, { name: 'Bot', character: 2, bot: true }];
test('chosen colors survive game creation and saved-game recovery', () => {
  const match = newMatch(seats.map((p, i) => ({ ...p, shirt: SHIRTS[8 - i] })));
  assert.deepEqual(match.players.map(p => p.shirt), [SHIRTS[8], SHIRTS[7], SHIRTS[6]]);
  assert.deepEqual(restoreMatch(JSON.parse(JSON.stringify(match))).players.map(p => p.shirt), match.players.map(p => p.shirt));
});
test('duplicate or invalid colors get free colors without taking another player’s choice', () => {
  const match = newMatch([{ name: 'A', shirt: SHIRTS[3] }, { name: 'B', shirt: SHIRTS[3] }, { name: 'C', shirt: SHIRTS[0] }, { name: 'D', shirt: 'invalid' }]);
  assert.equal(match.players[0].shirt, SHIRTS[3]); assert.equal(match.players[2].shirt, SHIRTS[0]);
  assert.equal(new Set(match.players.map(p => p.shirt)).size, 4);
});
test('every traveler gets a distinct shirt, including duplicate characters', () => {
  const match = newMatch(seats);
  assert.equal(new Set(match.players.map(p => p.shirt)).size, 3);
  assert(match.players.every(p => p.character === 2));
  assert(match.players[1].remote); assert(match.players[2].bot);
});
test('only a solved question unlocks one roll; next player starts locked', () => {
  const match = newMatch(seats);
  assert.equal(roll(match), null); assert.equal(nextTurn(match), false);
  assert(unlockRoll(match)); const move = roll(match, () => 0);
  assert.equal(move.to, 1); assert.equal(match.die, 1);
  assert.equal(roll(match), null); assert.equal(unlockRoll(match), false);
  assert(nextTurn(match)); assert.equal(match.turn, 1); assert.equal(match.phase, 'question'); assert.equal(match.die, null);
});
test('landing at either end of every ladder or slide follows its rule', () => {
  for (const link of LINKS) {
    const match = newMatch(seats); match.players[0].pos = link.from - 1;
    unlockRoll(match); const move = roll(match, () => 0);
    assert.equal(move.landing, link.from); assert.equal(move.to, link.to); assert.equal(move.kind, link.kind);
  }
});
test('a candy card moves forward to the next tile matching its color', () => {
  const match = newMatch(seats); match.players[0].pos = 8;
  unlockRoll(match); const move = roll(match, () => 0);
  assert.equal(move.landing, 9); assert.equal(move.to, 13); assert.equal(move.kind, 'candy');
  // A candy destination does not chain into another surprise in the same turn.
  assert.equal(match.players[0].pos, 13);
});
test('overshooting the last space wins and cannot advance another turn', () => {
  const match = newMatch(seats); match.players[0].pos = 59;
  unlockRoll(match); roll(match, () => .99999);
  assert.equal(match.players[0].pos, FINISH); assert.equal(match.winner, 0); assert.equal(match.phase, 'finished');
  assert.equal(nextTurn(match), false); assert.equal(roll(match), null);
});
test('saving and restoring preserves earned rolls, outcomes and turn ownership flags', () => {
  const match = newMatch(seats); unlockRoll(match);
  let saved = restoreMatch(JSON.parse(JSON.stringify(match)));
  assert.equal(saved.phase, 'ready'); assert.equal(saved.id, match.id); assert(saved.players[1].remote);
  roll(saved, () => .6); const landing = saved.players[0].pos;
  saved = restoreMatch(JSON.parse(JSON.stringify(saved)));
  assert.equal(saved.players[0].pos, landing); assert.equal(saved.phase, 'result'); assert.equal(roll(saved), null);
});
test('corrupt saves cannot put the board into an invalid turn or position', () => {
  const match = newMatch(seats);
  assert.equal(restoreMatch({ ...match, turn: 12 }), null);
  assert.equal(restoreMatch({ ...match, phase: 'finished', winner: 0 }), null);
  match.players[0].pos = -1; assert.equal(restoreMatch(match), null);
});
test('the 60 board tiles are distinct and every adjacent space shares an edge', () => {
  const points = Array.from({ length: 60 }, (_, i) => tilePoint(i + 1));
  assert.equal(new Set(points.map(p => `${p.x}:${p.z}`)).size, 60);
  for (let i = 1; i < points.length; i++) assert.equal(Math.hypot(points[i].x - points[i - 1].x, points[i].z - points[i - 1].z), 1);
});
test('rounds advance after all human and bot seats have played', () => {
  const match = newMatch(seats);
  for (let i = 0; i < 3; i++) { unlockRoll(match); roll(match, () => 0); nextTurn(match); }
  assert.equal(match.turn, 0); assert.equal(match.round, 2);
});
test('public controller labels distinguish duplicate display names without exposing tokens', () => {
  const a = 'random-authenticated-token-one', b = 'random-authenticated-token-two';
  assert.equal(controllerTag(a), controllerTag(a)); assert.notEqual(controllerTag(a), controllerTag(b));
  assert(!controllerTag(a).includes(a));
});
