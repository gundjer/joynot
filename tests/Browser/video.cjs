const assert = require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');const fs=require('fs'),path=require('path');
(async()=>{const b=await chromium.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required']});
async function context(){const c=await b.newContext({permissions:['camera','microphone'],serviceWorkers:'block'});await c.route('**/*',async r=>{const f=path.resolve('public','.'+new URL(r.request().url()).pathname);if(f.startsWith(path.resolve('public')+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile())await r.fulfill({path:f});else await r.continue()});return c;}
const results=[];
for(const game of ['coin-carnival','bee-smart']){
 const hc=await context(),mc=await context(),h=await hc.newPage(),m=await mc.newPage();const errors=[];h.on('pageerror',e=>errors.push('child '+e.message));m.on('pageerror',e=>errors.push('parent '+e.message));
 await h.goto('http://127.0.0.1:8766/__test/login');await m.goto('http://127.0.0.1:8766/__test/login');await h.goto(`http://127.0.0.1:8766/play/${game}/1`);await h.locator('#pgPlay').waitFor();await h.locator('#pgPlay').click();
 for(let i=0;i<12;i++){await h.waitForTimeout(250);const next=h.locator('#plNext:visible');if(await next.count())await next.click();else if(await h.evaluate(()=>!!window.__joynotLink))break;}
 await h.waitForFunction(()=>!!window.__joynotLink,{},{timeout:20000});
 const live=await h.evaluate(async()=>await(await fetch('/coop/live')).json());const session=live.live.find(s=>s.key===game);if(!session)throw Error('no session '+game);
 await m.goto(session.join);await m.locator('#nm').fill('Parent Test');await m.locator('#nameForm button[type=submit]').click();await m.waitForFunction(()=>!!window.__joynotLink);
 await m.waitForFunction(()=>window.__joynotLink.direct,{},{timeout:30000});
 await m.locator(game==='bee-smart'?'[data-camera]':'#camBtn').click();
 async function stats(p){return p.evaluate(async()=>{let out=[];for(const peer of window.__joynotLink.peers.values()){for(const s of (await peer.pc.getStats()).values())if(s.type==='inbound-rtp'&&s.kind==='video')out.push({bytes:s.bytesReceived,frames:s.framesDecoded});}return out;});}
 await h.waitForFunction(()=>Array.from(document.querySelectorAll('#jtVideos .jt-vid:not(.jt-self) video')).some(v=>v.videoWidth>0&&!v.closest('.jt-vid').classList.contains('hidden')),{},{timeout:20000});
 await m.waitForFunction(selector=>document.querySelector(selector)?.videoWidth>0,game==='bee-smart'?'[data-kid]':'#kidcam video',{timeout:20000});
 await m.waitForTimeout(1500);const first={game,child:await stats(h),parent:await stats(m),errors}; assert(first.child.some(s=>s.frames>0)); assert(first.parent.some(s=>s.frames>0)); assert.deepEqual(errors,[]); console.log('VIDEO',JSON.stringify(first));
 console.log('RELOAD',game);await m.reload();if(game!=='bee-smart')await m.locator('#nameForm button[type=submit]').click();await m.waitForFunction(()=>window.__joynotLink?.direct,{},{timeout:30000});console.log('REJOIN',game,'connected'); await m.locator(game==='bee-smart'?'[data-camera]':'#camBtn').click(); await h.waitForFunction(()=>Array.from(document.querySelectorAll('#jtVideos .jt-vid:not(.jt-self) video')).some(v=>v.videoWidth>0&&!v.closest('.jt-vid').classList.contains('hidden')),{},{timeout:20000}); assert((await stats(h)).some(s=>s.frames>0)); console.log('REJOIN VIDEO',game,'decoded');
 results.push(first);await hc.close();await mc.close();
}
fs.writeFileSync('storage/testing/video-report.json',JSON.stringify(results,null,2));await b.close();})().catch(e=>{console.error(e);process.exit(1)});

