import { BoardScene, ToyMesh } from '../sparkles-rainbow-journey/js/board-scene.js';
import { rng, HIVE, WW, WH } from './worlds.js';

const SCALE = 50;
const point = (x, y) => [x / SCALE - WW / SCALE / 2, y / SCALE - WH / SCALE / 2];
const norm = v => { const n = Math.hypot(...v) || 1; return v.map(a => a / n); };
const cross = (a,b) => [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const rgb = hex => { const n = parseInt(hex.slice(1),16); return [n>>16&255,n>>8&255,n&255].map(v=>v/255); };
export const flowerHeight = flower => 1.35 + (flower.id % 3) * .18;

// Curved botanical surfaces, not billboards: every petal and leaf has real depth.
function blade(m, length, width, hex, material=5, curl=.12) {
  const color=rgb(hex), vertex=(u,v)=>{
    const t=u/8, side=v/4*2-1, breadth=Math.pow(Math.sin(t*Math.PI),.8)*width;
    return [[side*breadth,length*t,curl*t*t+.1*side*side*Math.sin(t*Math.PI)],norm([.5*side,curl*t,-1])];
  };
  for(let u=0;u<8;u++)for(let v=0;v<4;v++)for(const [a,b] of [[u,v],[u+1,v],[u+1,v+1],[u,v],[u+1,v+1],[u,v+1]]){const [p,n]=vertex(a,b);m.vertex(p,n,color,material);}
  m.tube([[0,0,.004],[0,length*.5,curl*.25+.009],[0,length,curl+.008]],.007,material===6?'#ded2a1':'#789248',material);
}
function twig(m,a,b,r,hex='#6d4c2e') { m.tube([a,b],r,hex,3,9); }
function orb(m,x,y,z,rx,ry,rz,hex,material=0) {
  const color=rgb(hex), p=(a,b)=>{const n=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];return [[x+n[0]*rx,y+n[1]*ry,z+n[2]*rz],norm([n[0]/rx,n[1]/ry,n[2]/rz])];};
  for(let a=0;a<6;a++)for(let b=0;b<10;b++){const ps=[p(a*Math.PI/6,b*Math.PI/5),p((a+1)*Math.PI/6,b*Math.PI/5),p((a+1)*Math.PI/6,(b+1)*Math.PI/5),p(a*Math.PI/6,(b+1)*Math.PI/5)];for(const i of [0,1,2,0,2,3])m.vertex(ps[i][0],ps[i][1],color,material);}
}
function tiltedBlade(m,x,y,z,yaw,pitch,length,width,hex,material=5,curl=.12) {
  const leaf=new ToyMesh();blade(leaf,length,width,hex,material,curl);
  const c=Math.cos(pitch),s=Math.sin(pitch),col=rgb(hex);
  m.transform(x,y,z,yaw);
  for(let i=0;i<leaf.data.length;i+=10){const p=leaf.data.slice(i,i+3),n=leaf.data.slice(i+3,i+6);m.vertex([p[0],p[1]*c-p[2]*s,p[1]*s+p[2]*c],[n[0],n[1]*c-n[2]*s,n[1]*s+n[2]*c],leaf.data.slice(i+6,i+9),leaf.data[i+9]);}
  m.transform();
}
function tree(m,x,z,seed,fruit=false,branches=11,leaves=15) {
  const R=rng(seed), height=4.5+R()*1.2;
  m.tube([[x,0,z],[x+.09,1.7,z-.06],[x-.08,3.3,z+.07],[x+.1,height,z]],.17,'#705137',3,14);
  for(let i=0;i<branches;i++){
    const a=i*2.399, y=2.5+R()*2, r=.9+R()*1.35;
    const end=[x+Math.cos(a)*r,y+.65,z+Math.sin(a)*r];twig(m,[x,y-.6,z],end,.045);
    for(let j=0;j<leaves;j++){
      const theta=R()*Math.PI*2, r2=R()*.85, px=end[0]+Math.cos(theta)*r2,pz=end[2]+Math.sin(theta)*r2,py=end[1]+(R()-.5)*.9;
      tiltedBlade(m,px,py,pz,R()*6.28,1.05+R()*.8,.32+R()*.28,.11+R()*.08,['#3f692f','#668c3c','#527832','#78964b'][j%4]);
      if(fruit&&j%13===0)orb(m,px,py-.1,pz,.12,.13,.12,'#b55d3b',1);
    }
  }
}
function flowerMesh(m,f,uv) {
  const [x,z]=point(f.x,f.y),h=flowerHeight(f), seed=f.id*17, R=rng(seed);
  m.tube([[x,0,z],[x-.06,h*.45,z+.05],[x+.03,h,z]],.033,'#5c8537',5);
  for(let i=0;i<3;i++)tiltedBlade(m,x,h*(.22+i*.18),z,i*2.5+f.ph,1.15,.5,.16,'#57853a');
  if(f.st!=='open') { orb(m,x,h,z,.19,.22,.19,f.fruit==='🍎'?'#b64232':'#cc813d',1); return; }
  const sunflower=f.e==='🌻', tulip=f.e==='🌷', rose=['🌹','🌺'].includes(f.e);
  const petals=tulip?6:rose?14:sunflower?20:12;
  const palette=sunflower?['#efb533','#e7a021']:tulip?['#c6556c','#d8767e']:rose?['#ab3e59','#ce6377']:f.e==='🌸'?['#e5b4bb','#d996a6']:['#f1e8cb','#dfd8ba'];
  for(let i=0;i<petals;i++) {
    const a=i/petals*Math.PI*2, l=tulip?.6:sunflower?.67:rose?.48:.57;
    tiltedBlade(m,x+Math.cos(a)*.08,h+(rose?(i%3)*.055:0),z+Math.sin(a)*.08,-a+Math.PI/2+(R()-.5)*.08,(tulip?.3:rose?.95:1.48)+(R()-.5)*.1,l*(.9+R()*.18),(tulip?.24:rose?.21:.12)*(.88+R()*.2),palette[i%2],6,tulip?.28:rose?.2:-.08);
    // UV nectar-guide streaks sit on the actual petals and are optional.
    if(i%2===0)tiltedBlade(m,x+Math.cos(a)*.09,h+.012,z+Math.sin(a)*.09,-a+Math.PI/2,1.48,.26,.027,'#9759eb',9,-.01);
  }
  orb(m,x,h+.055,z,sunflower?.22:.13,.07,sunflower?.22:.13,sunflower?'#604127':'#c9912a',0);
  const grains=sunflower?30:12;
  for(let i=0;i<grains;i++){const a=i*2.399,r=Math.sqrt(i/grains)*(sunflower?.2:.13);orb(m,x+Math.cos(a)*r,h+.13,z+Math.sin(a)*r,.025,.035,.025,i%3?'#caa23b':'#a78225');}
  if(f.gold) { m.tube(Array.from({length:25},(_,i)=>[x+Math.cos(i/24*6.28)*.4,.08,z+Math.sin(i/24*6.28)*.4]),.022,'#efca55',1); }
}
export function beeMesh(m,x,y,z,time,{hornet=false,color='#c89530',yaw=0,size=1,pollen=0}={}) {
  m.transform(x,y,z,yaw,size);
  m.ellipsoid(0,0,0,.19,.18,.33,hornet?'#9c6031':color,0);
  for(let i=0;i<3;i++)m.ellipsoid(0,.003,-.23+i*.13,.193,.182,.042,'#382e22',0);
  m.ellipsoid(0,.05,.32,.19,.18,.17,'#4a3825',0);
  m.ellipsoid(0,.015,.49,.16,.145,.14,hornet?'#9e6529':'#624827',0);
  for(const s of [-1,1]){
    m.ellipsoid(s*.123,.055,.53,.063,.092,.053,'#202b21',1);
    m.ellipsoid(s*.14,.075,.56,.012,.018,.009,'#d5e8dc',1);
    m.tube([[s*.065,.13,.52],[s*.11,.28,.62],[s*.18,.3,.65]],.012,'#362b24',0,6);
    for(let i=0;i<3;i++)m.tube([[s*.13,-.06,.24-i*.15],[s*.29,-.16,.22-i*.18],[s*.33,-.29,.28-i*.19]],.013,'#453627',0,6);
    if(pollen)orb(m,s*.3,-.17,-.04,.065,.08,.055,'#dfa82b');
  }
  // Fuzz catches the light around the thorax, rather than drawing flat stripes.
  for(let i=0;i<28;i++){const a=i*2.399,r=.15;const p=[Math.cos(a)*r,.13+Math.sin(a)*.08,.26+(i%4)*.03];m.tube([p,[p[0]*1.15,p[1]+.025,p[2]]],.004,hornet?'#967444':'#c2a66b',0,4);}
  for(const s of [-1,1]){
    const flap=Math.sin(time*62)*.08;
    m.ellipsoid(s*(.32+flap),.18,.09,.34,.018,.13,'#d4e5df',8);
    m.ellipsoid(s*.25,.16,-.14,.24,.015,.095,'#cadcd7',8);
    for(let j=0;j<3;j++)m.tube([[s*.12,.201,.13],[s*.46,.201,.05+j*.045]],.003,'#aabfb2',8,4);
  }
  m.transform();
}

export class Meadow3D {
  constructor(){this.backend='canvas';this.key='';this.eye=null;try{this.scene=new BoardScene();this.backend='webgl';}catch{this.scene=null;}this.hiveScene=null;}
  build(S){
    const m=new ToyMesh(),R=rng(S.seed), ground=S.world.id===4?'#727f68':'#597339';
    m.box(0,-.12,0,150,.15,150,ground,4);m.shadowSkip=m.data.length/10;
    // Individual grass blades, seed heads and soil stones establish bee-scale depth.
    for(let i=0;i<950;i++){
      const x=R()*WW/SCALE-WW/SCALE/2,z=R()*WH/SCALE-WH/SCALE/2,h=.3+R()*1.25;
      if(Math.hypot(x-point(HIVE.x,HIVE.y)[0],z-point(HIVE.x,HIVE.y)[1])<1.8)continue;
      const angle=R()*6.28,wx=Math.cos(angle)*.035,wz=Math.sin(angle)*.035,col=rgb(['#4a702f','#6a873d','#7e9450','#3d632c'][i%4]);
      for(let blade=0;blade<4;blade++){const offset=blade*.065,lean=(blade-1.5)*.09;for(const p of [[x-wx+offset,0,z-wz],[x+wx+offset,0,z+wz],[x+.12+offset+lean,h*(.7+blade*.15),z+.08]])m.vertex(p,[0,.4,1],col,5);}
      if(i%37===0)orb(m,x,.025,z,.13,.06,.09,'#8b8068');
    }
    const trees=S.sc.decor.filter(d=>d.tree);
    for(let i=0;i<trees.length;i++){const [x,z]=point(trees[i].x,trees[i].y);tree(m,x,z,S.seed+i*71,true);}
    for(const [i,p] of [[0,[1700,180]],[1,[1730,1130]],[2,[90,180]],[3,[1100,70]]]){const [x,z]=point(...p);tree(m,x,z,S.seed+i*117,true);}
    for(let i=0;i<16;i++){const a=i/16*Math.PI*2;tree(m,Math.cos(a)*24,Math.sin(a)*20,S.seed+i*211,false,6,8);}
    for(const d of S.sc.decor.filter(d=>d.puddle)){const [x,z]=point(d.x,d.y);m.ellipsoid(x,-.025,z,d.s/SCALE,.035,d.s/SCALE*.7,'#608c91',7);}
    // A reachable water source and muddy bank in every meadow.
    const pond=point(1090,1050);m.ellipsoid(pond[0],-.04,pond[1],1.5,.06,.85,'#423b29',0);m.ellipsoid(pond[0],.005,pond[1],1.3,.035,.7,'#60949b',7);
    for(const f of S.flowers)flowerMesh(m,f,S.vision?.uv);
    for(const leaf of S.sc.leaves){const [x,z]=point(leaf.x,leaf.y);m.tube([[x,0,z],[x,.9,z],[x+.2,2.3,z]],.05,'#527b34',5);tiltedBlade(m,x,2.15,z,-.6,1.4,2,leaf.r/SCALE*.7,'#456e2f');}
    for(const web of S.sc.webs){const [x,z]=point(web.x,web.y),r=web.r/SCALE;twig(m,[x-r,0,z],[x-r,2.5,z],.04);twig(m,[x+r,0,z],[x+r,2.5,z],.04);
      for(let j=0;j<12;j++){const a=j/12*6.28;m.tube([[x,1.3,z],[x+Math.cos(a)*r,1.3+Math.sin(a)*r,z]],.008,'#d2d5bf',8,4);}
      for(let ring=1;ring<=5;ring++)m.tube(Array.from({length:25},(_,i)=>[x+Math.cos(i/24*6.28)*r*ring/5,1.3+Math.sin(i/24*6.28)*r*ring/5,z]),.006,'#c4c9b9',8,4);
      orb(m,x,1.5,z,.08,.1,.055,'#423429');for(const side of [-1,1])for(let j=0;j<4;j++)m.tube([[x,1.5,z],[x+side*.15,1.4+j*.05,z],[x+side*.22,1.3+j*.09,z]],.008,'#554634',0,4);
    }
    for(const tower of S.sc.towers){const [x,z]=point(tower.x+tower.w/2,tower.y+tower.h/2);m.roundedBox(x,2.2,z,tower.w/SCALE,4.4,tower.h/SCALE,.08,'#9a9e96',0);for(let j=0;j<3;j++)for(let k=0;k<3;k++)m.box(x+(k-1)*.5,1+j,z+tower.h/SCALE/2+.01,.26,.42,.025,'#54747c',1);}
    const [hx,hz]=point(HIVE.x,HIVE.y);
    m.roundedBox(hx,1.1,hz,1.7,2.2,1.4,.07,'#b68a4e',2);m.roundedBox(hx,2.25,hz,1.95,.18,1.7,.05,'#655b3e',2);
    for(let i=0;i<5;i++)m.roundedBox(hx,.3+i*.39,hz+.72,1.75,.045,.1,.01,'#765b38',2);
    m.roundedBox(hx,.55,hz+.74,1.1,.2,.03,.04,'#362f20',0);m.roundedBox(hx,.37,hz+1,.95,.07,.65,.04,'#a27b43',2);
    this.scene.setStatic(m);this.key=`${S.seed}:${S.flowers.map(f=>`${f.id}:${f.st}`).join(',')}`;
  }
  draw(ctx,W,H,top,S,time,guards=[]){
    if(!this.scene)return false;
    const key=`${S.seed}:${S.flowers.map(f=>`${f.id}:${f.st}`).join(',')}`;if(key!==this.key)this.build(S);
    const height=Math.max(120,H-top),[bx,bz]=point(S.bee.x,S.bee.y),alt=S.bee.altitude||1.55;
    this.W=W;this.H=height;this.top=top;
    const first=this.first=!!S.vision?.firstPerson;
    this.eye=first?[bx,alt+.12,bz+.1]:[bx,alt+3.8,bz+6.3];this.target=first?[bx,alt-.12,bz-7]:[bx,alt*.45,bz-1.8];
    const sky=ctx.createLinearGradient(0,top,0,H);sky.addColorStop(0,S.vision?.uv?'#96b8d3':'#b0cbd3');sky.addColorStop(.65,'#d4dcc5');sky.addColorStop(1,'#718953');ctx.fillStyle=sky;ctx.fillRect(0,top,W,height);
    this.scene.resize(W,height);const m=new ToyMesh();
    if(!first)beeMesh(m,bx,alt,bz,time,{yaw:Math.atan2(S.bee.vx,S.bee.vy||-1),pollen:S.pollen,size:.72});
    for(const g of guards){const [x,z]=point(g.x,g.y);beeMesh(m,x,1.7,z,time,{color:g.color,size:.6});}
    for(const h of S.hz.list.filter(h=>!h.gone)){const [x,z]=point(h.x,h.y);beeMesh(m,x,h.altitude||1.6,z,time,{hornet:true,size:1.05,yaw:Math.atan2(h.vx,h.vy||1)});if(h.ball)for(let i=0;i<4;i++){const a=time*4+i*Math.PI/2;beeMesh(m,x+Math.cos(a)*.45,1.6+Math.sin(a)*.2,z+Math.sin(a)*.35,time,{size:.4});}}
    const bird=S.hz.bird;
    if(bird.active||bird.warn>0){const [x,z]=point(bird.active?bird.x:S.bee.x,bird.active?bird.y:bird.y0);const y=bird.warn>0?7:2.7;const flap=Math.sin(time*9)*.5;
      m.transform(x,y,z,bird.dir>0?Math.PI/2:-Math.PI/2);m.ellipsoid(0,0,0,.28,.24,.65,'#645b4d',0);m.ellipsoid(0,.13,.58,.2,.19,.23,'#554f44',0);
      for(const s of [-1,1])for(let i=0;i<7;i++)m.ellipsoid(s*(.35+i*.14),flap*(.4+i*.08),.06-i*.045,.3,.035,.23+i*.02,i%2?'#766c58':'#544d40',0);
      m.tube([[0,.05,.73],[0,.03,.99]],.055,'#ac8244',0,6);m.ellipsoid(.16,.17,.63,.025,.028,.025,'#151e18',1);m.transform();
    }
    for(const cloud of S.hz.clouds){const [x,z]=point(cloud.x,cloud.y);for(let i=0;i<4;i++)orb(m,x+(i-1.5)*.65,6.7+(i%2)*.3,z,.9,.45,.7,'#a6b1aa');
      for(let i=0;i<40;i++){const a=i*2.399,r=(i%9)/9*cloud.r/SCALE;const yy=6-((time*7+i*.37)%5.7);m.tube([[x+Math.cos(a)*r,yy,z+Math.sin(a)*r],[x+Math.cos(a)*r-.04,yy-.18,z+Math.sin(a)*r]],.007,'#acc8d0',8,4);}
    }
    if(S.hz.spray){
      const tractor=S.hz.spray.tr;
      if(tractor){const [x,z]=point(tractor.x,tractor.y);m.transform(x,.55,z,tractor.dir>0?Math.PI/2:-Math.PI/2);m.roundedBox(0,.1,0,1.1,.6,1.8,.06,'#446538');m.roundedBox(0,.65,-.25,.8,.8,.8,.04,'#71886e');m.box(0,.7,.17,.65,.48,.025,'#92aeb0',1);for(const side of[-1,1])for(const offset of[-.6,.6])m.ellipsoid(side*.6,-.18,offset,.2,.4,.4,'#30362b',0);m.transform();if(tractor.warn>0)m.box(x,.01,z,25,.02,.5,'#b27a48',0);}
      for(const puff of S.hz.spray.puffs||[]){const [x,z]=point(puff.x,puff.y);orb(m,x,.6,z,puff.r/SCALE,.4,puff.r/SCALE,'#adbd83',8);}
    }
    ctx.drawImage(this.scene.render({eye:this.eye,target:this.target,mesh:m,labels:false,nature:true,uv:!!S.vision?.uv,lightTarget:[bx,0,bz],fov:first?1.08:.9}),0,top,W,height);
    // Small screen labels identify targets; the vegetation itself is entirely 3D.
    for(const f of S.flowers.filter(f=>f.st==='open')){const [x,z]=point(f.x,f.y),p=this.project(x,flowerHeight(f)+.35,z);if(!p||p.depth>12||p.x<15||p.x>W-15||p.y<top+10||p.y>H-65)continue;
      const distance=Math.round(Math.hypot(f.x-S.bee.x,f.y-S.bee.y)/50);ctx.font='700 12px Andika,sans-serif';ctx.textAlign='center';ctx.fillStyle='rgba(23,40,24,.8)';ctx.beginPath();ctx.roundRect(p.x-37,p.y-12,74,22,11);ctx.fill();ctx.fillStyle='#fff5d7';ctx.fillText(`${f.gold?'Rare':'Flower'} · ${distance} m`,p.x,p.y+3);
    }
    if(S.vision?.compound)this.compound(ctx,W,H,top);
    return true;
  }
  project(x,y,z){if(!this.eye)return null;const p=this.scene.project(x,y,z,this.W,this.H);if(!p)return null;const forward=norm(this.target.map((v,i)=>v-this.eye[i]));const depth=(x-this.eye[0])*forward[0]+(y-this.eye[1])*forward[1]+(z-this.eye[2])*forward[2];return depth>0?{...p,y:p.y+this.top,depth}:null;}
  screenPoint(x,y,alt=1.55){const [X,Z]=point(x,y);return this.project(X,alt,Z);}
  toWorld(x,y,alt=1.55){if(!this.eye)return null;const f=norm(this.target.map((v,i)=>v-this.eye[i])),r=norm(cross(f,[0,1,0])),u=cross(r,f),s=Math.tan((this.first?1.08:.9)/2),nx=(x/this.W*2-1)*this.W/this.H*s,ny=(1-(y-this.top)/this.H*2)*s,ray=norm(f.map((v,i)=>v+r[i]*nx+u[i]*ny));if(Math.abs(ray[1])<.02)return null;const t=(alt-this.eye[1])/ray[1];if(t<=0||t>65)return null;return{x:(this.eye[0]+ray[0]*t+WW/SCALE/2)*SCALE,y:(this.eye[2]+ray[2]*t+WH/SCALE/2)*SCALE};}
  compound(ctx,W,H,top){ctx.save();ctx.strokeStyle='rgba(225,239,203,.12)';ctx.lineWidth=1;const r=30;for(let row=0,y=top;y<H+r;y+=r*1.5,row++)for(let x=(row%2)*r*.866;x<W+r;x+=r*1.732){ctx.beginPath();for(let i=0;i<6;i++){const a=i*Math.PI/3+Math.PI/6;ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.stroke();}ctx.restore();}
  title(ctx,W,H,time){
    if(!this.scene)return false;
    if(!this.demo)this.demo={seed:917,world:{id:0},sc:{decor:[],leaves:[],webs:[],towers:[]},bee:{x:650,y:890,altitude:1.2,vx:0,vy:-1},flowers:Array.from({length:13},(_,i)=>({id:i+1,x:400+i%5*170,y:260+Math.floor(i/5)*170,e:['🌼','🌷','🌸','🌻','🌺'][i%5],st:'open',ph:i})),hz:{list:[],bird:{},clouds:[]},pollen:0,vision:{uv:false}};
    return this.draw(ctx,W,H,0,this.demo,time);
  }
  hive(ctx,W,H,top,cells,fan,step){
    if(!this.scene)return null;
    if(!this.hiveScene){try{this.hiveScene=new BoardScene();const bg=new ToyMesh();bg.box(0,1,-.65,18,12,.3,'#97702b',0);bg.shadowSkip=bg.data.length/10;this.hiveScene.setStatic(bg);}catch{return null;}}
    const m=new ToyMesh(),cols=Math.min(W<600?4:7,cells.length),rows=Math.ceil(cells.length/cols),radius=.52;
    const hex=(x,y,r,fill)=>{
      const col=rgb(fill),rim=rgb('#d5a143'),wall=rgb('#8f5d1a');
      for(let i=0;i<6;i++){
        const a=Math.PI/6+i*Math.PI/3,b=a+Math.PI/3;
        const A=[x+Math.cos(a)*r,y+Math.sin(a)*r,.35],B=[x+Math.cos(b)*r,y+Math.sin(b)*r,.35],C=[x+Math.cos(b)*r*.8,y+Math.sin(b)*r*.8,.35],D=[x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8,.35];
        for(const p of [A,B,C,A,C,D])m.vertex(p,[0,0,1],rim,1);
        const E=[D[0],D[1],-.32],F=[C[0],C[1],-.32];for(const p of [D,C,F,D,F,E])m.vertex(p,[-Math.cos(a),-Math.sin(a),.15],wall,0);
        const z=fill==='#ead9ac'?.37:fill==='#87551b'?-.3:.2;
        for(const p of [[x,y,z],[x+Math.cos(a)*r*.8,y+Math.sin(a)*r*.8,z],[x+Math.cos(b)*r*.8,y+Math.sin(b)*r*.8,z]])m.vertex(p,[0,0,1],col,1);
      }
    };
    for(let row=0;row<8;row++)for(let col=0;col<15;col++)hex((col-7)*.91+(row%2)*.45,(row-3)*.79,.5,'#87551b');
    const positions=cells.map((c,i)=>({c,x:(i%cols-(cols-1)/2)*.94+(Math.floor(i/cols)%2)*.15,y:1+(rows-1)*.84/2-Math.floor(i/cols)*.84}));
    for(const p of positions)hex(p.x,p.y,radius,p.c.s===3?'#ead9ac':p.c.s>=2?'#ca870f':p.c.s===1?'#e6b33c':'#87551b');
    if(step==='feed')for(let i=0;i<3;i++){const x=(i-1)*1.05;hex(x,1,.52,'#87551b');m.tube(Array.from({length:16},(_,j)=>{const a=.4+j/15*Math.PI*1.6;return[x+Math.cos(a)*.2,1+Math.sin(a)*.2,.48];}),.085,'#e8dbb2',1,10);}
    if(step==='winter'){beeMesh(m,0,1,.65,performance.now()/1000,{size:.8,color:'#cba344'});for(let i=0;i<11;i++){const a=i/11*Math.PI*2;beeMesh(m,Math.cos(a)*.8,1+Math.sin(a)*.65,.65,performance.now()/1000,{size:.38,yaw:a});}}
    const areaTop=top+48, height=Math.max(100,H-areaTop-145),d=Math.max(4.7,cols*.72/(W/height));
    this.hiveScene.resize(W,height);ctx.fillStyle='#6b4b1b';ctx.fillRect(0,0,W,H);ctx.drawImage(this.hiveScene.render({eye:[0,1.4,d],target:[0,1,0],mesh:m,labels:false}),0,areaTop,W,height);
    return positions.map(p=>{const center=this.hiveScene.project(p.x,p.y,.4,W,height),edge=this.hiveScene.project(p.x+radius,p.y,.4,W,height);return{c:p.c,x:center.x,y:center.y+areaTop,r:Math.abs(center.x-edge.x)};});
  }
}
