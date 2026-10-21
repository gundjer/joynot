const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
 const ctx=await browser.newContext({permissions:['camera','microphone'],serviceWorkers:'block'}); await ctx.route('**/*', async route=>{const path=require('path');const file=path.resolve('public','.'+new URL(route.request().url()).pathname);if(file.startsWith(path.resolve('public')+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile()) await route.fulfill({path:file});else await route.continue();}); const page=await ctx.newPage();
 await page.goto('http://127.0.0.1:8766/__test/login'); console.log('login',await page.textContent('body'));
 const config=fs.readFileSync('config/joynot.php','utf8');const section=config.split("'games' => [")[1].split("'coming_soon'")[0];
 const games=[...section.matchAll(/^        '([^']+)' => \[/gm)].map(m=>m[1]);
 const report=[];
 for(const game of games){const errors=[];const onError=e=>errors.push(e.message);const onResponse=r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`)};page.on('pageerror',onError); const onConsole=m=>{if(m.type()==='error')errors.push('console: '+m.text())};page.on('console',onConsole);page.on('response',onResponse);
 const r=await page.goto(`http://127.0.0.1:8766/play/${game}/1`);await page.waitForTimeout(1600);
 const before=await page.locator('body').innerText();
 const buttons=await page.locator('button').allTextContents();
 await page.locator('#pgPlay:visible, #btnPlay:visible').first().waitFor({timeout:15000}); const start=page.locator('#pgPlay:visible, #btnPlay:visible').first();
 if(await start.count()) {await start.click({timeout:15000}).catch(e=>errors.push('click: '+e.message));await page.waitForTimeout(700); for(let i=0;i<10;i++){const next=page.locator('#plNext:visible, #btnStartNight:visible, #btnStart:visible, .pg-pbtns button:visible').filter({hasText:/next|start|go|fly|play|begin|kindergarten/i}).last();if(!await next.count())break;await next.click();await page.waitForTimeout(300);} await page.waitForTimeout(1200);await page.keyboard.press('ArrowRight');}
 const result={game,status:r.status(),buttons:buttons.slice(0,10),text:(await page.locator('body').innerText()).slice(0,300),canvases:await page.locator('canvas').count(),errors};report.push(result);console.log(JSON.stringify(result));
 page.off('pageerror',onError);page.off('console',onConsole);page.off('response',onResponse);
 }
 fs.writeFileSync('storage/testing/games-report.json',JSON.stringify(report,null,2));await browser.close(); if(report.some(r=>r.status!==200||r.errors.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});






