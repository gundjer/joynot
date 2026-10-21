const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  if (process.env.CANDY_RELAY) await ctx.addInitScript(() => { window.RTCPeerConnection = undefined; });
  const page = await ctx.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('http://127.0.0.1:8766/__test/login');
  await page.goto('http://127.0.0.1:8766/play/sparkles-rainbow-journey/1');
  await page.waitForFunction(() => !!window.__candy);
  await page.evaluate(async () => { const { Store, defaults } = await import('/games/sparkles-rainbow-journey/js/storage.js'); Store.data = defaults(); Store.data.name = 'Smoke Test'; Store.data.settings.focus = 'math'; Store.data.settings.talk = 'off'; Store.data.settings.video = 'off'; Store.save(); await Store.flushNow(); });
  await page.reload(); await page.waitForFunction(() => !!window.__candy);
  await page.locator('[data-seat="1"][data-character="0"]').click();
  await page.locator('.seat').first().locator('[data-shirt="#b79a18"]').click();
  assert(await page.locator('.seat').nth(1).locator('[data-shirt="#b79a18"]').isDisabled());
  assert.equal(await page.locator('.masthead .brand img').getAttribute('src'), '/icons/logo.svg');
  assert.equal(await page.locator('.seat').count(), 2);
  await page.screenshot({ path: 'storage/testing/candy-setup.png', fullPage: true });
  await page.locator('#practiceFocus').selectOption('math');
  await page.locator('#startGame').click();
  assert.equal(await page.evaluate(() => window.__candy.renderer.backend), 'webgl');
  const shirts = await page.evaluate(() => window.__candy.match.players.map(p => p.shirt)); assert.notEqual(shirts[0], shirts[1]);
  assert.equal(shirts[0], '#b79a18');
  assert.equal(await page.locator('#rollCard').isVisible(), false);
  await page.locator('#answerInput').fill('999999'); await page.locator('#checkAnswer').click();
  assert.equal(await page.evaluate(() => window.__candy.match.phase), 'question');
  await page.screenshot({ path: 'storage/testing/candy-board.png', fullPage: true });
  let answer = await page.evaluate(() => String(window.__candy.match.question.answer));
  await page.locator('#answerInput').fill(answer); await page.locator('#checkAnswer').click();
  assert.equal(await page.evaluate(() => window.__candy.match.phase), 'ready');
  await page.reload(); await page.waitForFunction(() => !!window.__candy);
  await page.locator('#resumeGame').click(); assert.equal(await page.evaluate(() => window.__candy.match.phase), 'ready');
  assert.equal(await page.evaluate(() => window.__candy.match.players[0].shirt), '#b79a18');
  await page.locator('#rollDice').click(); await page.waitForFunction(() => !window.__candy.animation);
  assert.equal(await page.evaluate(() => window.__candy.match.phase), 'result');
  const die = await page.evaluate(() => window.__candy.match.die); assert(die >= 1 && die <= 6);
  await page.locator('#nextTurn').click();
  await page.waitForFunction(() => window.__candy.match.turn === 0 && window.__candy.match.round === 2, { timeout: 20000 });
  // Phone portrait, narrow portrait, tablet and phone landscape must not overflow.
  for (const [width, height] of [[390, 844], [320, 740], [768, 1024], [844, 390]]) {
    await page.setViewportSize({ width, height }); await page.waitForTimeout(300);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `horizontal overflow at ${width}`);
    const layout = await page.evaluate(() => {
      const board = document.getElementById('game').getBoundingClientRect(), question = document.getElementById('questionText').getBoundingClientRect(), answer = document.getElementById('answerInput').getBoundingClientRect();
      return { boardBottom: board.bottom, boardWidth: board.width, questionTop: question.top, questionBottom: question.bottom, answerBottom: answer.bottom, height: innerHeight, width: innerWidth };
    });
    assert(layout.boardWidth >= layout.width * .9, `board should fill screen width at ${width}`);
    assert(layout.questionTop >= layout.boardBottom, `question below board at ${width}`);
    assert(layout.questionBottom <= layout.height && layout.answerBottom <= layout.height, `question and answer must fit the screen at ${width}`);
    await page.screenshot({ path: `storage/testing/candy-${width}.png`, fullPage: true });
  }
  await page.setViewportSize({ width: 1280, height: 900 });
  // Win through actual question + roll controls, including overshoot and reward idempotency.
  await page.evaluate(() => { window.__candy.match.players[0].pos = 59; });
  answer = await page.evaluate(() => String(window.__candy.match.question.answer));
  await page.locator('#answerInput').fill(answer); await page.locator('#checkAnswer').click(); await page.locator('#rollDice').click();
  await page.locator('#winner').waitFor({ state: 'visible' });
  const tokens = await page.evaluate(async () => (await import('/games/sparkles-rainbow-journey/js/storage.js')).Store.data.tokens);
  await page.reload(); await page.waitForFunction(() => !!window.__candy); await page.locator('#resumeGame').click();
  await page.locator('#winner').waitFor({ state: 'visible' });
  assert.equal(await page.evaluate(async () => (await import('/games/sparkles-rainbow-journey/js/storage.js')).Store.data.tokens), tokens);
  await page.locator('#playAgain').click();
  // Reserve a remote family seat, with a bot still in the match.
  await page.locator('#addRemote').click(); assert(await page.locator('#startGame').isDisabled());
  const response = await page.request.get('http://127.0.0.1:8766/coop/live');
  assert.equal(response.status(), 200); const live = (await response.json()).live.find(s => s.key === 'sparkles-rainbow-journey'); assert(live);
  const familyCtx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  if (process.env.CANDY_RELAY) await familyCtx.addInitScript(() => { window.RTCPeerConnection = undefined; });
  const family = await familyCtx.newPage(); family.on('pageerror', e => errors.push('family: ' + e.message));
  await family.goto('http://127.0.0.1:8766/__test/login');
  await family.goto(live.join); await family.locator('#nm').fill('Grandma'); await family.locator('#nameForm button[type="submit"]').click();
  await family.locator('#boardRemote').waitFor({ state: 'visible', timeout: 20000 });
  await family.locator('[data-character="0"]').click(); await family.locator('.br-join-button').click();
  await page.waitForFunction(() => window.__candy.lobby[2].name === 'Grandma');
  await family.locator('.br-join-button').filter({ hasText: 'Seat claimed' }).waitFor();
  await family.locator('[data-shirt="#669c32"]').click();
  await page.waitForFunction(() => window.__candy.lobby[2].shirt === '#669c32');
  await page.locator('#startGame').click();
  await family.locator('.br-seat').filter({ hasText: 'Grandma' }).waitFor({ state: 'visible' });
  assert(await family.locator('.br-check').isDisabled());
  // A family device cannot roll or submit answers for another player's turn.
  const childKey = await page.evaluate(() => { const m = window.__candy.match; return `${m.id}:${m.round}:${m.turn}:${m.phase}:${m.attempts}`; });
  await family.evaluate(({ key }) => window.__joynotLink.send('host', { t: 'board', action: 'answer', value: '5', key }), { key: childKey });
  await family.waitForTimeout(400);
  assert.equal(await page.evaluate(() => window.__candy.match.phase), 'question');
  await page.screenshot({ path: 'storage/testing/candy-family-host.png', fullPage: true });
  answer = await page.evaluate(() => String(window.__candy.match.question.answer));
  await page.locator('#answerInput').fill(answer); await page.locator('#checkAnswer').click(); await page.locator('#rollDice').click(); await page.waitForFunction(() => !window.__candy.animation); await page.locator('#nextTurn').click();
  await page.waitForFunction(() => window.__candy.match.turn === 2, { timeout: 20000 });
  await family.waitForFunction(() => !document.querySelector('.br-check').disabled);
  // Repeated wrong answers remain retryable on the remote device.
  for (let i = 0; i < 2; i++) {
    await family.locator('#boardRemote input').fill('999999'); await family.locator('.br-check').click();
    await page.waitForFunction(n => window.__candy.match.attempts >= n, i + 1);
    await family.waitForFunction(() => !document.querySelector('.br-check').disabled);
  }
  answer = await page.evaluate(() => String(window.__candy.match.question.answer));
  const hostAnswers = await page.evaluate(async () => (await import('/games/sparkles-rainbow-journey/js/storage.js')).Store.data.stats.mathRight);
  await family.locator('#boardRemote input').fill(answer); await family.locator('.br-check').click();
  await family.locator('.br-roll').waitFor({ state: 'visible' }); await family.locator('.br-roll').click();
  await page.waitForFunction(() => !window.__candy.animation && window.__candy.match.phase === 'result');
  assert.equal(await page.evaluate(async () => (await import('/games/sparkles-rainbow-journey/js/storage.js')).Store.data.stats.mathRight), hostAnswers);
  await family.screenshot({ path: 'storage/testing/candy-family-device.png', fullPage: true });
  await family.locator('.br-next').click(); await page.waitForFunction(() => window.__candy.match.turn === 0);
  // A stale remote answer is not allowed to complete the child's question.
  assert.equal(await page.evaluate(() => window.__candy.match.phase), 'question');
  // The same family page reconnects its seat after refresh.
  await family.reload(); await family.locator('#nm').fill('Grandma'); await family.locator('#nameForm button[type="submit"]').click();
  await family.locator('.br-seat').filter({ hasText: 'Grandma' }).waitFor({ state: 'visible', timeout: 20000 });
  await family.setViewportSize({ width: 390, height: 844 }); await family.waitForTimeout(400);
  assert(await family.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1));
  await family.screenshot({ path: 'storage/testing/candy-family-mobile.png', fullPage: true });
  await family.close();
  // WebGL-disabled devices retain a playable board.
  const fallback = await ctx.newPage(); await fallback.addInitScript(() => { const original = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return type.startsWith('webgl') ? null : original.call(this, type, ...args); }; });
  await fallback.goto('http://127.0.0.1:8766/play/sparkles-rainbow-journey/1'); await fallback.waitForFunction(() => !!window.__candy);
  assert.equal(await fallback.evaluate(() => window.__candy.renderer.backend), 'canvas');
  await fallback.locator('#startGame').click(); await fallback.screenshot({ path: 'storage/testing/candy-fallback.png', fullPage: true });
  assert.deepEqual(errors, []);
  fs.writeFileSync(`storage/testing/candy${process.env.CANDY_RELAY ? '-relay' : ''}-report.json`, JSON.stringify({ passed: true, webgl: true, remoteTurns: true, relay: !!process.env.CANDY_RELAY, viewportWidths: [320, 390, 768, 844], fallback: true, errors }, null, 2));
  console.log('Candy Cloud Trail: local turns, bots, saves, winner, family device turns, layouts and fallback passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });

