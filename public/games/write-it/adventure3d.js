import {BoardScene,ToyMesh} from '../sparkles-rainbow-journey/js/board-scene.js';
import {Mesh} from '../rustys-after-hours/js/scene3d.js';
import {ENCOUNTERS,SIZE,key,TREES} from './adventure.js';
const orb=(m,...a)=>Mesh.prototype.ellipsoid.call(m,...a);
const P=(x,z)=>[(x-10)*1.4,(z-8)*1.4];
function ring(m,x,y,z,r,color){m.tube(Array.from({length:25},(_,i)=>[x+Math.cos(i/24*Math.PI*2)*r,y,z+Math.sin(i/24*Math.PI*2)*r]),.035,color,1);}
function tree(m,x,z,i){m.cylinder(x,1.3,z,.17,2.6,'#6e4f39',3);for(let n=0;n<3;n++)orb(m,x+Math.sin(n*3+i)*.4,2.5+n*.35,z+Math.cos(n*3+i)*.4,.8,.85,.75,['#4d7364','#5e8a6b','#396456'][n],5);}
function tower(m,x,z,h){m.cylinder(x,h/2,z,.65,h,'#87928f',0);m.cone(x,h+.5,z,.95,1.2,'#465c72');for(let j=0;j<3;j++)m.box(x,h*.3+j*.65,z+.66,.2,.3,.025,'#edc77c',1);}
function hero(m,x,z,time,look,moving,stun){m.transform(x,.18,z,look.yaw||0,.85);const skin=look.skin||'#b97f5a',cloak=look.cloak||'#8365db',stride=moving?Math.sin(time*10)*.2:0;
  orb(m,0,.9,0,.28,.42,.21,cloak,0);m.cone(0,.55,.04,.38,.72,cloak);orb(m,0,1.52,0,.24,.28,.23,skin);orb(m,0,1.7,-.035,.255,.16,.23,'#3c2f37');for(const side of [-1,1]){m.tube([[side*.15,.62,0],[side*.16,.26,side*stride],[side*.16,.08,side*stride]],.09,'#374451');m.tube([[side*.25,1.17,0],[side*.4,.88,-side*stride]],.065,skin);orb(m,side*.085,1.55,.216,.03,.045,.025,'#1c2e34');}m.tube([[.39,.78,.05],[.46,1.8,.08]],.035,'#d6b46e');orb(m,.46,1.85,.08,.095,.14,.09,stun?'#f4d58b':'#a4e2d5',1);
  if(look.gear===0){m.roundedBox(-.4,.95,.17,.45,.6,.09,.09,'#dab982',1);m.roundedBox(-.4,.95,.23,.28,.37,.03,.06,'#559297',1);}if(look.gear===2){m.cylinder(0,1.88,0,.26,.12,'#dfb050',1);for(let i=0;i<5;i++){const a=i/5*Math.PI*2;m.cone(Math.sin(a)*.23,2.02,Math.cos(a)*.23,.06,.24,'#efc969');}}m.transform();}
function moonwing(m,x,y,z,t,scale=1){m.transform(x,y,z,0,scale);orb(m,0,0,0,.18,.24,.15,'#dcebd8');orb(m,0,.23,.04,.2,.17,.14,'#f2d99a');for(const side of [-1,1]){m.tube([[side*.1,0,0],[side*.42,.2+Math.sin(t*7)*.12,0],[side*.65,.12,0]],.10,'#8dc8c5');orb(m,side*.08,.25,.16,.035,.045,.03,'#2b3e4c');}m.transform();}
function dragon(m,x,z,t,friendly,scale=1.1){m.transform(x,.3,z,.5,scale);orb(m,0,1.05,0,.75,.95,.7,'#a56d90');orb(m,0,1.02,.59,.43,.65,.18,'#e4bb97');m.tube([[0,.4,-.45],[.7,.35,-1],[1.4,.3,-1.4],[1.8,.5+Math.sin(t)*.1,-1.7]],.18,'#ad7896');orb(m,0,2.22,.25,.62,.49,.52,'#bb829d');orb(m,0,2.02,.69,.46,.24,.42,'#d798a7');for(const side of [-1,1]){orb(m,side*.29,2.32,.64,.13,.16,.09,'#f3db8b');orb(m,side*.29,2.32,.72,.04,.11,.03,'#223741');m.cone(side*.39,2.86,.1,.12,.5,'#e5c68b');m.tube([[side*.6,1.3,-.2],[side*1.8,2.65+Math.sin(t*1.4)*.1,-.4],[side*2.25,1.0,-.6]],.05,'#edb6b0');const ps=[[side*.5,1.35,-.18],[side*1.8,2.65+Math.sin(t*1.4)*.1,-.4],[side*2.25,1,-.6],[side*1.15,.83,-.35]];for(const i of [0,1,2,0,2,3])m.vertex(ps[i],[0,0,1],[.62,.32,.52],0);orb(m,side*.55,.28,.5,.38,.21,.5,'#aa7192');}if(friendly)ring(m,0,.03,0,1.15,'#a5e5c3');m.transform();}
function chest(m,x,z,open=false){m.roundedBox(x,.35,z,.9,.6,.62,.05,'#77553d',3);m.roundedBox(x,.71+(open?.2:0),z-(open?.2:0),.94,.18,.66,.06,'#b78b55',1);for(const side of [-1,1])m.box(x+side*.32,.4,z,.07,.7,.67,'#dbc18b',1);m.box(x,.45,z+.34,.18,.2,.04,'#e2c377',1);}
export class Adventure3D{
  constructor(){try{this.scene=new BoardScene();this.backend='webgl';this.rebuild();}catch(e){this.backend='unavailable';this.error=e.message;}}
  rebuild(){if(!this.scene)return;const m=new ToyMesh();m.box(0,-.6,0,34,1,28,'#796044',3);m.roundedBox(0,-.08,0,31,.15,25,.5,'#577a63',4);
    for(let z=0;z<SIZE.h;z++)for(let x=0;x<SIZE.w;x++){const [X,Z]=P(x,z);m.roundedBox(X,.02,Z,1.36,.12,1.36,.06,z===7?'#598e9c':(x+z)%2?'#739171':'#67836a',z===7?7:0);}
    // The entire adventure sits on a physical grid of beveled map tiles.
    for(const p of TREES){const [X,Z]=P(p.x,p.z);tree(m,X,Z,p.i);}
    for(let z=8;z<16;z++){if(z===10)continue;const [x,zz]=P(10,z);m.roundedBox(x,.8,zz,.6,1.6,1.4,.08,'#9ba191');}
    for(const n of ENCOUNTERS){const [x,z]=P(n.x,n.z);if(n.id==='smith'){m.box(x,.3,z,1.3,.5,1,'#536679');m.box(x,.65,z,.8,.2,.55,'#adc1bd',1);m.cylinder(x-1.2,.4,z,.5,.7,'#83674b',3);m.cone(x-1.2,1.0,z,.38,.55,'#e6a756');}if(n.id==='gate'){for(const s of [-1,1])tower(m,x+s*.9,z,2);m.box(x,2.4,z,2.4,.4,.5,'#aeb5a1');}if(n.id==='dragon'){m.cylinder(x,.15,z,2.5,.2,'#a49b8e');tower(m,x-3,z-2,4);tower(m,x+3,z-2,4);}}
    const [cx,cz]=P(6,8);chest(m,cx,cz);this.scene.setStatic(m);
  }
  draw(c,W,H,s,look={},title=false){if(!this.scene){c.fillStyle='#193641';c.fillRect(0,0,W,H);return;}
    const m=new ToyMesh(),t=s.time||0,[hx,hz]=P(s.hero.x,s.hero.z),focus=s.encounter&&s.mode!=='explore'?P(s.encounter.x,s.encounter.z):[hx,hz];
    for(const n of ENCOUNTERS){const [x,z]=P(n.x,n.z);if(n.id==='gate'&&!s.done.gate){for(let i=0;i<5;i++)m.tube([[x-.7+i*.35,.15,z],[x+.4*Math.sin(i),1.2,z+.1],[x-.65+i*.32,2.3,z]],.07,'#648453',5);}if(n.id==='bridge'&&s.done.bridge){for(let i=0;i<5;i++){const [xx,zz]=P(15,6.3+i*.35);m.roundedBox(xx,.19,zz,1.2,.16,.42,.04,'#cfb58c',2);}for(const side of [-1,1])m.tube([[x+side*.6,.7,z],[x+side*.6,.7,z-3]],.035,'#d9c292');}if(n.id==='fox'&&!s.done.fox){moonwing(m,x,1.15,z,t);ring(m,x,1.15,z,.6,'#c6a965');}if(n.id==='dragon'&&!s.done.dragon)dragon(m,x,z,t,false);if(!s.done[n.id])ring(m,x,.2,z,1,'#e4bf77');if(s.done[n.id]&&s.mode!=='loot')chest(m,x+.8,z+.8,true);}
    if(!s.done.dragon){const smith=ENCOUNTERS[0],[x,z]=P(smith.x-1,smith.z-.6);hero(m,x,z,t,{skin:'#88543e',cloak:'#bd8054',yaw:.7},false,false);}
    for(let z=0;z<SIZE.h;z++)for(let x=0;x<SIZE.w;x++){if(!s.seen[key(x,z)]&&!title){const [X,Z]=P(x,z);m.roundedBox(X,.35,Z,1.39,.45,1.39,.07,'#233d4b',0);}}
    for(let i=0;i<14;i++){const x=2+(i*3)%17,z=8+(i*5)%8;if(!s.coins.includes(i)){const [X,Z]=P(x,z);m.cylinder(X,.65+Math.sin(t*2+i)*.12,Z,.16,.09,'#e9c374',1);}}
    if(s.done.fox||look.gear===1)moonwing(m,hx-.7,1.75+Math.sin(t*2)*.15,hz+.2,t,.65);
    hero(m,hx,hz,t,{...look,yaw:s.hero.yaw},s.moving,s.invincible>0);if(s.done.dragon)dragon(m,hx+1.4,hz-.8,t,true,.45);
    const slime=this.slime=s.slimeStun>0&&this.slime?this.slime:{x:7.5+Math.sin(t*.6)*1.8,z:11.5+Math.cos(t*.6)*.6};const [sx,sz]=P(slime.x,slime.z);orb(m,sx,s.slimeStun>0?.22:.48,sz,.5,s.slimeStun>0?.2:.48,.5,s.slimeStun?'#8ab5bf':'#9cb86b',1);for(const side of [-1,1])orb(m,sx+side*.15,.63,sz+.39,.05,s.slimeStun>0?.015:.07,.04,'#31454e');
    if(s.spell>0)for(let i=0;i<15;i++){const a=i*2.4+t*9;orb(m,hx+Math.sin(a)*(2-s.spell),.6+(i%5)*.2,hz+Math.cos(a)*(2-s.spell),.055,.055,.055,s.ink||'#a5dfdb',1);}
    if(s.mode==='casting'&&s.encounter){const [x,z]=P(s.encounter.x,s.encounter.z),k=1-s.castTimer/1.4;orb(m,hx+(x-hx)*k,1+Math.sin(k*Math.PI)*2,hz+(z-hz)*k,.24,.24,.24,s.ink||'#b6eddc',1);ring(m,x,.3,z,1+k,'#e7d59e');}
    if(s.mode==='explore'&&s.guidanceTarget){for(const [i,p]of (s.guidePath||[]).slice(0,22).entries()){const [x,z]=P(p.x,p.z);m.cylinder(x,.66,z,.105,.035,i%2?'#e7c77d':'#f5de9b',1);}const [x,z]=P(s.guidanceTarget.x,s.guidanceTarget.z);ring(m,x,.68,z,1.1+.08*Math.sin(t*3),'#f4d28b');m.cone(x,3.3+Math.sin(t*3)*.15,z,.18,-.45,'#f2cb79');}
    if(s.misfire>0&&s.encounter){const [x,z]=P(s.encounter.x,s.encounter.z);orb(m,x+.7,1.8,z,.28,.35,.25,'#afba6d');orb(m,x+.7,2.1,z,.16,.22,.16,'#afba6d');for(const side of [-1,1])orb(m,x+.7+side*.09,1.86,z+.24,.035,.05,.025,'#304a3e');}
    if(s.encounter&&['dice','scroll'].includes(s.mode)){const [x,z]=P(s.encounter.x,s.encounter.z);m.roundedBox(x,1.3,z+2.5,4.9,.2,2.9,.13,'#f2dfaf',1);for(const side of [-1,1])m.tube([[x+side*2.3,1.48,z+1],[x+side*2.3,1.48,z+4]],.15,'#bd9962',1);
      this.dice=[];for(let i=0;i<3;i++){const dx=x+(i-1)*1.25,dz=z+1.4,bounce=s.roll>0?Math.abs(Math.sin(s.roll*18+i))*.8:0;m.transform(dx,1.5+bounce,dz,s.roll*8*(i%2?-1:1));m.roundedBox(0,0,0,.8,.8,.8,.1,i===1?'#527fa2':'#ad5a59',1);m.transform();this.dice.push({x:dx,y:2.03+bounce,z:dz,text:(s.rollWord||'cat')[i]?.toUpperCase()||'•'});}}
    if(s.mode==='loot'&&s.loot){const [x,z]=P(s.loot.x,s.loot.z);chest(m,x, z,true);for(let i=0;i<7;i++)orb(m,x+Math.sin(i*2.4+t)*.7,1.2+i*.08,z+Math.cos(i*2.4+t)*.7,.07,.12,.07,'#ecd195',1);}
    // Camera follows walking; encounters push in toward the actual table/creature.
    const portrait=W/H<.8,d=s.mode==='explore'?(portrait?10.5:8.2):s.mode==='scroll'?6.8:8.2;
    const target=[focus[0],s.mode==='explore'?.3:1,focus[1]],desired=[focus[0]+d*.55,d*.93,focus[1]+d*.85];
    if(!this.eye||title)this.eye=desired;else this.eye=this.eye.map((v,i)=>v+(desired[i]-v)*.12);
    this.scene.resize(W,H);const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#b9d0cc');sky.addColorStop(1,'#576f70');c.fillStyle=sky;c.fillRect(0,0,W,H);c.drawImage(this.scene.render({eye:this.eye,target,mesh:m,labels:false,nature:true,lightTarget:target,fov:.9}),0,0,W,H);
    this.tiles=[];for(let z=0;z<SIZE.h;z++)for(let x=0;x<SIZE.w;x++){const [X,Z]=P(x,z),p=this.scene.project(X,.15,Z,W,H);if(p&&p.x>0&&p.x<W&&p.y>0&&p.y<H)this.tiles.push({...p,xw:x,zw:z});}
    this.nodes=ENCOUNTERS.map(n=>{const [x,z]=P(n.x,n.z),p=this.scene.project(x,n.id==='dragon'?3.6:2.5,z,W,H);return {...n,screen:p};});
    if(s.mode==='explore'){const [x,z]=P(slime.x,slime.z),p=this.scene.project(x,1.1,z,W,H);if(p&&p.x>20&&p.x<W-20&&p.y>100&&p.y<H-90){const text=s.slimeStun>0?`Moss slime · asleep ${Math.ceil(s.slimeStun)}s`:'Moss slime · Calm slime to soothe';c.font='600 11px Lexend';c.textAlign='center';const w=c.measureText(text).width;c.fillStyle='#243c42e8';c.beginPath();c.roundRect(p.x-w/2-7,p.y-16,w+14,24,7);c.fill();c.fillStyle=s.slimeStun>0?'#b8e3d5':'#f5ddaa';c.fillText(text,p.x,p.y);}}
    if(s.mode==='dice'||s.mode==='scroll'){for(const d of this.dice||[]){const p=this.scene.project(d.x,d.y,d.z,W,H);if(p){c.font='bold 24px Georgia';c.textAlign='center';c.fillStyle='#fff2d6';c.fillText(s.roll>0?'?':d.text,p.x,p.y);}}}
  }
  tile(x,y){return this.tiles?.map(p=>({...p,d:Math.hypot(p.x-x,p.y-y)})).sort((a,b)=>a.d-b.d)[0];}
}
