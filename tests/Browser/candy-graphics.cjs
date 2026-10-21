const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8766/__test/login');
  await page.goto('http://127.0.0.1:8766/play/sparkles-rainbow-journey/1');
  await page.waitForFunction(() => !!window.__candy);
  await page.locator('#practiceFocus').selectOption('math');
  await page.locator('#startGame').click();
  for (const [width,height] of [[1440,1000],[390,844],[320,740],[844,390]]) {
    await page.setViewportSize({ width,height }); await page.waitForTimeout(500);
    const state = await page.evaluate(() => {
      const renderer = window.__candy.renderer, q = document.getElementById('questionText').getBoundingClientRect(), a = document.getElementById('answerInput').getBoundingClientRect(), b = document.getElementById('game').getBoundingClientRect();
      return { backend: renderer.backend, glError: renderer.scene?.gl.getError(), q: q.bottom, a: a.bottom, boardBottom: b.bottom, questionTop: q.top, width: document.documentElement.scrollWidth, height: innerHeight, shadowReady: renderer.scene?.staticCount > 0 };
    });
    assert.equal(state.backend,'webgl'); assert.equal(state.glError,0); assert(state.shadowReady);
    assert(state.q <= height && state.a <= height && state.questionTop >= state.boardBottom); assert(state.width <= width + 1);
    await page.screenshot({ path:`storage/testing/candy-detailed-${width}.png`, fullPage:true });
  }
  assert.deepEqual(errors,[]);
  fs.writeFileSync('storage/testing/candy-detailed-report.json',JSON.stringify({ passed:true, graphics:'beveled geometry, depth-tested printed tiles, shadow mapping, 3D routes and dice', widths:[1440,390,320,844], errors },null,2));
  console.log('Detailed 3D board: WebGL, full-screen question layout and screenshots passed.');
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
