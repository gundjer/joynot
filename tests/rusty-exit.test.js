import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../public/games/rustys-after-hours/js/game.js', import.meta.url), 'utf8');
const openDoorSource = source.slice(source.indexOf('async function openDoor('), source.indexOf('// ------------------------------------------------------------------ caught / win'));

function setup(result = { solved: true }) {
  let completed = 0, questions = 0;
  const context = vm.createContext({
    g: { world: { cellsNeeded: 3 }, cells: 3, time: 10, graceUntil: 0, stepsMath: 0, stepsRead: 0 },
    mode: 'play', input: {}, Voice: { stop() {} }, Sfx: { door() {} },
    store: { data: { math: { level: 1 } } },
    exitProblem: () => ({ track: 'math' }),
    challenge: { open: async () => { questions++; return result; } },
    sparkyTalk() {}, levelUp() {},
    nightComplete() { completed++; context.mode = 'done'; context.g = null; },
  });
  vm.runInContext(openDoorSource, context);
  return { context, completed: () => completed, questions: () => questions };
}

test('a correct exit answer completes the chase without additional movement', async () => {
  const run = setup(), game = run.context.g;
  const door = { exit: true, open: false };
  await run.context.openDoor(door);
  assert.equal(door.open, true);
  assert.equal(game.stepsMath, 1);
  assert.equal(run.completed(), 1);
  assert.equal(run.context.mode, 'done');
});

test('an already open exit can finish without asking another question', async () => {
  const run = setup();
  await run.context.openDoor({ exit: true, open: true });
  assert.equal(run.completed(), 1);
  assert.equal(run.questions(), 0);
});

test('missing power cells and an unsolved question do not finish the level', async () => {
  const run = setup({ solved: false });
  run.context.g.cells = 2;
  await run.context.openDoor({ exit: true, open: false });
  assert.equal(run.questions(), 0);
  run.context.g.cells = 3;
  const door = { exit: true, open: false };
  await run.context.openDoor(door);
  assert.equal(door.open, false);
  assert.equal(run.completed(), 0);
  assert.equal(run.context.mode, 'play');
});

test('the render loop survives the chase finishing during update', () => {
  const start = source.indexOf('function loop(now)');
  const end = source.indexOf('\n}', start) + 2;
  const context = vm.createContext({
    last: 0, st: null, g: {}, mode: 'play',
    update() { context.g = null; },
    renderer: { draw() { assert.fail('completed chase must not render a cleared game'); } },
    requestAnimationFrame() {},
  });
  vm.runInContext(source.slice(start, end), context);
  context.loop(16);
});
