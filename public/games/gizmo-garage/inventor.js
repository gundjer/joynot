// Open workbench: placed weights, beams, supports and transmissions share one simulation.
import {clone,part} from './jobs.js';
import {G,STEP,endpoints,collide,gears,rope,ropeGeometry} from './mechanics.js';
export const LB_N=4.4482216153,LB_KG=.45359237;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function seesawBuild(){return {nextId:10,rope:[],parts:[part('lever',5,2,{id:'example-beam',length:6}),part('fulcrum',5,2,{id:'example-support'}),part('weight',6.5,2.5,{id:'example-weight',lbs:2}),part('piston',2.25,3.5,{id:'example-push',direction:1})]};}
export function createInventor(job,bp,challenge=null){
 const parts=clone(bp.parts).map(p=>({...p,a:p.angle||0,w:0,inertia:Math.max(.01,.4*(p.r||.3)**2)})),bodies=parts.filter(p=>p.kind==='weight').map(p=>Object.assign(p,{m:(p.lbs||2)*LB_KG,r:.28,vx:0,vy:0,startX:p.x,startY:p.y,peakForce:0}));
 const run={job,parts,bodies,rope:clone(bp.rope),body:bodies[0]||{x:8,y:.5,m:1,r:.28,vy:0},t:0,energy:0,effort:0,tension:0,brake:false,operating:false,collisions:0,diagnosis:'Press and hold Power to push or turn. Weights fall when you press Run. Reset brings all your parts back.',win:false,hold:0,challenge:clone(challenge),earned:false,connections:[],ropeLength:0,maxForce:0};
 const moving=parts.find(p=>p.kind==='pulley'&&p.moving&&bp.rope.includes(p.id)),last=parts.find(p=>p.id===bp.rope.at(-1)&&p.kind==='weight');run.body=bodies.find(b=>b.id===moving?.loadId)||last||run.body;
 for(const beam of parts.filter(p=>p.kind==='lever')){
  const f=parts.filter(p=>p.kind==='fulcrum'&&Math.abs(p.y-beam.y)<.35&&Math.abs(p.x-beam.x)<beam.length/2-.1).sort((a,b)=>Math.abs(a.y-beam.y)-Math.abs(b.y-beam.y))[0];
  if(!f){beam.freeVy=0;continue;}beam.support=f.id;beam.pivot=(f.x-beam.x)/beam.length+.5;beam.y=f.y;run.connections.push({from:beam.id,to:f.id});
  for(const b of bodies){const [left,right]=endpoints(beam),height=beam.y+Math.tan(beam.angle)*(b.x-f.x);if(!(bp.rope.length&&b===run.body)&&!b.carrier&&b.x>left.x&&b.x<right.x&&Math.abs(b.y-height-.42)<.45){b.carrier=beam.id;b.arm=(b.x-f.x)/Math.cos(beam.angle);run.connections.push({from:b.id,to:beam.id});}}
 }

 for(const w of parts.filter(p=>p.kind==='wedge')){const screw=parts.find(p=>p.kind==='screw'&&p.x<w.x&&w.x-p.x<1.7&&Math.abs(p.y-w.y)<1);const load=bodies.find(b=>!(bp.rope.length&&b===run.body)&&!b.carrier&&!b.jack&&Math.abs(b.x-w.x)<1&&Math.abs(b.y-w.y-.5)<.7);if(screw&&load){load.jack=w.id;w.screw=screw.id;w.load=load.id;w.speed=0;w.turns=0;run.connections.push({from:screw.id,to:w.id},{from:w.id,to:load.id});}}
 run.ropeLength=ropeGeometry(run).length;return run;
}
export function stepInventor(r,dt=STEP){
 r.t+=dt;r.effort=0;r.tension=0;
 const powered=r.operating&&!r.brake,pushers=r.parts.filter(p=>p.kind==='piston'),sources=r.parts.filter(p=>['motor','winch'].includes(p.kind));
 const saved=r.operating;r.operating=false;gears(r,dt);r.operating=saved;
 for(const p of sources){const manual=r.manual?.[p.id],controlled=manual!==undefined&&!r.brake;if(powered||controlled){const limit=(p.forceLbs||2)*LB_N*.1,torque=controlled?clamp((manual-p.w)*2,-limit,limit):limit*Math.max(0,1-Math.abs(p.w)/22);p.w+=torque/p.inertia*dt;r.energy+=Math.max(0,torque*p.w*dt);r.effort+=Math.abs(torque)/.1;}if(r.brake&&p.kind==='winch')p.w=0;}
 // Resolve meshing after applying power, without a second application of drive.
 r.operating=false;gears(r,dt);r.operating=saved;
 for(const beam of r.parts.filter(p=>p.kind==='lever')){
  if(!beam.support){beam.freeVy-=G*dt;beam.y=Math.max(.12,beam.y+beam.freeVy*dt);continue;}
  const pivot=beam.x+(beam.pivot-.5)*beam.length,loads=r.bodies.filter(b=>b.carrier===beam.id),[left,right]=endpoints(beam);
  let torque=0,inertia=1,drive=0;
  for(const b of loads){torque-=b.m*G*(Math.cos(beam.angle)*b.arm-Math.sin(beam.angle)*.42);inertia+=b.m*(b.arm*b.arm+.42*.42);}
  for(const p of pushers){const end=Math.abs(p.x-left.x)<Math.abs(p.x-right.x)?left:right;if(powered&&Math.abs(p.x-end.x)<.9&&p.y>end.y&&p.y-end.y<4){const force=(p.forceLbs||2)*LB_N,arm=end.x-pivot,t=-force*arm;torque+=t;drive+=t;r.effort+=force;p.contactX=end.x;p.contactY=end.y;}}
  const leftArm=beam.pivot*beam.length,rightArm=(1-beam.pivot)*beam.length,maxAngle=Math.min(.6,Math.asin(clamp((beam.y-.1)/Math.max(.01,leftArm),0,1))),minAngle=-Math.min(.6,Math.asin(clamp((beam.y-.1)/Math.max(.01,rightArm),0,1)));
  beam.w+=(torque-.5*beam.w)/inertia*dt;if(r.brake)beam.w=0;beam.angle=clamp(beam.angle+beam.w*dt,minAngle,maxAngle);if(beam.angle===minAngle||beam.angle===maxAngle)beam.w=0;
  r.energy+=Math.max(0,drive*beam.w*dt);
  for(const b of loads){b.x=pivot+Math.cos(beam.angle)*b.arm-Math.sin(beam.angle)*.42;b.y=beam.y+Math.sin(beam.angle)*b.arm+Math.cos(beam.angle)*.42;b.vx=(-Math.sin(beam.angle)*b.arm-Math.cos(beam.angle)*.42)*beam.w;b.vy=(Math.cos(beam.angle)*b.arm-Math.sin(beam.angle)*.42)*beam.w;}
 }
 for(const w of r.parts.filter(p=>p.kind==='wedge'&&p.screw)){const s=r.parts.find(p=>p.id===w.screw),b=r.bodies.find(p=>p.id===w.load),lead=s.pitch/(2*Math.PI),slope=Math.tan(Math.abs(w.angle)||.3),force=powered?(s.forceLbs||2)*LB_N:0,torque=force*.1,load=b.m*G*slope*lead,friction=b.m*G*.06*lead;w.speed=clamp(w.speed+(torque-load-Math.sign(w.speed||1)*friction)/.01*dt,-15,15);if(r.brake)w.speed=0;w.turns=Math.max(0,w.turns+w.speed*dt);if(w.turns===0)w.speed=Math.max(0,w.speed);w.slide=Math.min(4,w.turns*lead);if(w.slide===4)w.speed=0;s.a=w.turns;b.y=b.startY+w.slide*slope;b.vy=w.speed*lead*slope;r.energy+=Math.max(0,torque*w.speed*dt);r.effort+=force;}
 for(const b of r.bodies.filter(b=>!b.carrier&&!b.jack)){
  b.vy-=G*dt;
  for(const p of pushers){if(powered&&p.x<b.x&&b.x-p.x<2&&Math.abs(p.y-b.y)<.65){const f=(p.forceLbs||2)*LB_N;b.vx+=f/b.m*dt;r.energy+=Math.max(0,f*b.vx*dt);r.effort+=f;p.extension=Math.max(.2,b.x-p.x-.3);}}
  if(b===r.body)for(let i=0;i<6;i++)rope(r,dt);
  b.x+=b.vx*dt;b.y+=b.vy*dt;
  for(const p of r.parts.filter(p=>p.kind==='ramp'||p.kind==='lever'&&!p.support)){const adapter={body:b,collisions:0};collide(adapter,{...p,kind:'ramp'});r.collisions+=adapter.collisions;}
  if(b.y<b.r+.05){b.y=b.r+.05;b.vy=Math.max(0,-b.vy*.05);const rolling=r.parts.filter(p=>p.kind==='wheel'&&Math.abs(p.x-b.x)<.8&&p.y<.7).length>=2;b.vx*=Math.exp(-(r.brake?20:rolling?.15:2)*dt);}
  if(b.x<.3||b.x>9.7){b.x=clamp(b.x,.3,9.7);b.vx*=-.12;}
 }
 // Weights bump each other, so a rolling weight can start another moving.
 for(let i=0;i<r.bodies.length;i++)for(let k=i+1;k<r.bodies.length;k++){const a=r.bodies[i],b=r.bodies[k];if(a.carrier||b.carrier)continue;const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||.001;if(d<.56){const nx=dx/d,ny=dy/d,v=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(v<0){const j=-1.1*v/(1/a.m+1/b.m);a.vx-=j*nx/a.m;a.vy-=j*ny/a.m;b.vx+=j*nx/b.m;b.vy+=j*ny/b.m;}a.x-=nx*(.56-d)/2;b.x+=nx*(.56-d)/2;}}
 for(const p of r.parts.filter(p=>['gear','motor','fan','winch'].includes(p.kind)))p.a+=p.w*dt;
 for(const b of r.bodies)if(b.y>b.startY+.03)b.peakForce=Math.max(b.peakForce,r.effort/LB_N);
 r.maxForce=Math.max(r.maxForce,r.effort/LB_N);
 const unsupported=r.parts.some(p=>p.kind==='lever'&&!p.support),connected=r.parts.some(p=>p.kind==='lever'&&p.support),c=r.challenge;
 r.diagnosis=unsupported?'This beam needs a fulcrum: place the green support with its tip touching the beam.':connected?'The beam balances on the green fulcrum. Move the fulcrum toward a heavy weight to make it easier to lift.':r.bodies.length?'Watch the weights. Add a ramp to guide them, or build a lever with a fulcrum.':'Start with a weight, a beam and a fulcrum. Or open a part’s ? and choose Try a seesaw.';
 if(!r.rope.length&&sources.some(p=>p.kind==='motor'))r.diagnosis='Drag the blue crank handle in a circle to turn the gears yourself. Hold Power is optional automatic turning.';
 if(r.rope.length){const geometry=ropeGeometry(r);r.diagnosis=geometry.jy>=-.05?'The rope is not pulling upward. Route it over a pulley above the weight.':r.brake?'The rope drum is braked. Release Brake and hold Power to wind it.':!r.operating?'Rope connected. Hold Power to wind the drum and pull the weight.':r.body.vy<.01?'The drum is loaded. Try a lighter weight, more drum force, or pulleys clipped to the weight to share the load.':'The rope is lifting the weight. Brake holds the drum; Reset lets you change the design.';}
 let reached=false;if(c){if(['lift','rope'].includes(c.type))reached=r.energy>.01&&r.bodies.some(b=>b.lbs>=c.minLbs&&b.y-b.startY>=c.rise&&b.peakForce<=c.maxForce+.001&&(c.type!=='rope'||b===r.body&&r.parts.some(p=>p.kind==='pulley'&&p.moving&&r.rope.includes(p.id))));if(c.type==='roll')reached=r.bodies.some(b=>Math.abs(b.x-b.startX)>=c.distance)&&r.parts.some(p=>p.kind==='ramp');if(c.type==='fan')reached=r.parts.some(p=>p.kind==='fan'&&Math.abs(p.w)>2)&&r.parts.filter(p=>p.kind==='gear'&&Math.abs(p.w)>.1).length>=2;}
 r.hold=reached?r.hold+dt:0;if(r.hold>.35)r.earned=true;
}
