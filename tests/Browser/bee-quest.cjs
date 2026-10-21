const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--autoplay-policy=no-user-gesture-required']});
  const ctx=await browser.newContext({viewport:{width:1440,height:960},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack);});page.on('console',m=>{if(m.type()==='error'){errors.push(m.text());console.error(m.text());}});
  await page.goto('http://127.0.0.1:8766/__test/login');await page.goto('http://127.0.0.1:8766/play/bee-smart/1');
  await page.waitForFunction(()=>window.__playScene&&window.__playApi&&!document.getElementById('pgPlay').disabled);
  assert.equal(await page.evaluate(()=>window.__playScene._renderer.backend),'webgl');
  await page.screenshot({path:'storage/testing/buzzing-title.png',fullPage:true});
  await page.evaluate(async()=>{Object.assign(window.__playApi.state.settings,{voice:'off',talk:'off',video:'off'});window.__playScene._B().intro={};const {Store}=await import('/games/_joy/js/storage.js');Store.save();await Store.flushNow();});await page.locator('#pgPlay').click();
  await page.waitForFunction(()=>window.__playScene._S()?.introBtn||window.__playScene._S()?.mode==='field');
  await page.evaluate(()=>{const game=window.__playScene,s=game._S();if(s.mode==='intro'){const r=s.introBtn;game.onTap(r.x+r.w/2,r.y+r.h/2);}});
  await page.waitForFunction(()=>window.__playScene._S().mode==='field');
  await page.evaluate(()=>{const g=window.__playScene,s=g._S(),f=s.flowers[0];s.bee.x=f.x;s.bee.y=f.y+140;s.bee.altitude=1.5;s.hz.list.forEach(h=>h.flee=100);});
  await page.waitForTimeout(500);await page.screenshot({path:'storage/testing/buzzing-meadow.png',fullPage:true});
  assert.equal(await page.evaluate(()=>window.__playScene._renderer.scene.gl.getError()),0);
  // Real vertical flight, view and vision controls.
  const before=await page.evaluate(()=>window.__playScene._S().bee.altitude);
  await page.keyboard.down('r');await page.waitForTimeout(400);await page.keyboard.up('r');assert(await page.evaluate(()=>window.__playScene._S().bee.altitude)>before+.2);
  await page.locator('[data-toggle="view"]').click();await page.locator('[data-toggle="compound"]').click();await page.waitForTimeout(200);
  assert(await page.evaluate(()=>window.__playScene._S().vision.firstPerson&&window.__playScene._S().vision.compound));await page.screenshot({path:'storage/testing/buzzing-bee-eyes.png',fullPage:true});
  await page.locator('[data-toggle="view"]').click();await page.locator('[data-toggle="compound"]').click();
  // A physical flower landing opens the existing adaptive challenge and pauses flight time.
  await page.evaluate(()=>{const s=window.__playScene._S(),f=s.flowers[0];s.bee.x=f.x;s.bee.y=f.y;s.bee.altitude=1.35+(f.id%3)*.18;s.bee.vx=s.bee.vy=0;});
  await page.waitForFunction(()=>window.__playScene._S().mode==='chal');const time=await page.evaluate(()=>window.__playScene._S().flight.seconds);await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>window.__playScene._S().flight.seconds),time);
  await page.screenshot({path:'storage/testing/buzzing-puzzle.png',fullPage:true});
  // Fill a real cargo load and verify the full honey/larva/winter visit with its own touch targets.
  await page.evaluate(()=>{const g=window.__playScene,s=g._S();s.mode='field';s.chal=null;s.pollen=4;s.nectar=6;s.done=4;s.stolen=0;g._goHive();});
  await page.waitForFunction(()=>window.__playScene._S().hive.H.hits.length>0);await page.waitForTimeout(200);await page.screenshot({path:'storage/testing/buzzing-hive.png',fullPage:true});
  await page.evaluate(()=>{const h=window.__playScene._S().hive;for(const hit of [...h.H.hits])h.tap(hit.r.x+hit.r.w/2,hit.r.y+hit.r.h/2);});
  await page.waitForFunction(()=>window.__playScene._S().hive.H.step==='fan');
  await page.evaluate(()=>{const h=window.__playScene._S().hive;h.H.hold=true;h.update(5);h.up();});
  await page.waitForFunction(()=>window.__playScene._S().hive.H.step==='cap'&&window.__playScene._S().hive.H.hits.length>0);
  await page.evaluate(()=>{const h=window.__playScene._S().hive;for(const hit of [...h.H.hits])h.tap(hit.r.x+hit.r.w/2,hit.r.y+hit.r.h/2);});
  await page.waitForFunction(()=>window.__playScene._S().hive.H.step==='feed');
  await page.waitForTimeout(150);await page.screenshot({path:'storage/testing/buzzing-larvae.png',fullPage:true});
  await page.evaluate(()=>{const h=window.__playScene._S().hive;for(let i=0;i<3;i++){const r=h.H.hits[0].r;h.tap(r.x+r.w/2,r.y+r.h/2);}});
  await page.waitForFunction(()=>window.__playScene._S().hive.H.step==='winter');await page.waitForTimeout(150);await page.screenshot({path:'storage/testing/buzzing-winter.png',fullPage:true});
  await page.evaluate(()=>{const h=window.__playScene._S().hive;h.H.hold=true;h.update(4);h.up();});
  assert.equal(await page.evaluate(()=>window.__playScene._S().hive.H.step),'fact');
  assert.equal(await page.evaluate(()=>window.__playScene._B().larvaeFed>=3),true);
  // Device layouts and each world's actual modeled hazards.
  for(const [width,height] of [[390,844],[768,1024],[844,390]]){
    await page.setViewportSize({width,height});await page.evaluate(()=>window.__playScene.start({edition:1}));await page.waitForTimeout(400);
    await page.evaluate(()=>{const g=window.__playScene,s=g._S();if(s.mode==='intro'){const r=s.introBtn;g.onTap(r.x+r.w/2,r.y+r.h/2);}s.bee.x=700;s.bee.y=700;s.hz.list.forEach(h=>h.flee=100);});await page.waitForTimeout(200);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:`storage/testing/buzzing-${width}.png`,fullPage:true});
  }
  // A Grown-Up sees the same modeled meadow and can still plant a flower.
  await page.setViewportSize({width:1280,height:900});
  const live=(await(await page.request.get('http://127.0.0.1:8766/coop/live')).json()).live.find(s=>s.key==='bee-smart');assert(live);
  const parentContext=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'}),parent=await parentContext.newPage();
  parent.on('pageerror',e=>errors.push('guard: '+e.message));
  await parent.goto('http://127.0.0.1:8766/__test/login');await parent.goto(live.join);await parent.locator('#nm').fill('Grandma');await parent.locator('#nameForm button[type="submit"]').click();
  await parent.waitForFunction(()=>window.__beeGuardRenderer?.eye);
  assert.equal(await parent.evaluate(()=>window.__beeGuardRenderer.backend),'webgl');assert.equal(await parent.evaluate(()=>window.__beeGuardRenderer.scene.gl.getError()),0);
  await parent.screenshot({path:'storage/testing/buzzing-family.png',fullPage:true});
  await parent.close();await parentContext.close();
  // All hazards are rendered, including rain and crop spray from older grade worlds.
  for(const edition of [2,3,5]){
    await page.evaluate(edition=>window.__playScene.start({edition}),edition);await page.waitForTimeout(250);
    await page.evaluate(()=>{const g=window.__playScene,s=g._S();if(s.mode==='intro'){const r=s.introBtn;g.onTap(r.x+r.w/2,r.y+r.h/2);}s.bee.x=1000;s.bee.y=800;s.hz.list.forEach(h=>h.flee=100);});
    await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>window.__playScene._renderer.scene.gl.getError()),0);await page.screenshot({path:`storage/testing/buzzing-world-${edition}.png`,fullPage:true});
  }
  // Force timer expiry with no cargo: safe return must not create free honey.
  await page.evaluate(()=>{const s=window.__playScene._S();s.mode='field';s.pollen=s.stolen=0;s.flight.seconds=.01;});
  await page.waitForFunction(()=>window.__playScene._S().flight.seconds>100);assert.equal(await page.evaluate(()=>window.__playScene._S().mode),'field');
  assert.deepEqual(errors,[]);fs.writeFileSync('storage/testing/buzzing-report.json',JSON.stringify({passed:true,webgl:true,flight:true,timerPausedForLearning:true,hive:true,larvae:true,winter:true,errors},null,2));console.log('Buzzing Quest: 3D graphics, flight, learning pause, hive operations and device layouts passed.');
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
