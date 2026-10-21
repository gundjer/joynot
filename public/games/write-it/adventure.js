export const SIZE={w:21,h:17};
export const ENCOUNTERS=[
  {id:'smith',x:5,z:12,name:'The Rune Smith',verb:'Forge',story:'Ari needs a living rune for your wand. Roll the red and blue dice, then inscribe their magic.',reward:'Rune shield',gear:0,coins:12},
  {id:'gate',x:10,z:10,name:'The Vine Gate',verb:'Enchant gate',story:'Sleeping vines seal the road. Write a glowing spell on the gate’s scroll to wake them.',reward:'Gatekeeper sticker',coins:15},
  {id:'fox',x:14,z:10,name:'Moonwing’s Rescue',verb:'Help Moonwing',story:'Moonwing is tangled in a magic snare. Give your spell a subject, an action, and a little imagination.',reward:'Moonwing companion',gear:1,coins:18},
  {id:'bridge',x:15,z:8,name:'The Broken Crossing',verb:'Restore bridge',story:'The bridge has vanished into the river. Write a spell that brings a path back to life.',reward:'River sapphire',coins:20},
  {id:'dragon',x:16,z:3,name:'Pyra the Dragon',verb:'Talk to Pyra',story:'Pyra guards the Ember Crown. She is lonely. Tell her why she should join your adventure.',reward:'The Ember Crown',gear:2,coins:30},
];
export const RUNE_WORDS=['cat','bug','sun','fox','map','pig','hat','cup','red','bed'];
export const key=(x,z)=>`${x},${z}`;
export const TREES=Array.from({length:44},(_,i)=>({x:1+(i*7)%19,z:1+(i*11)%15,i})).filter(p=>p.z!==7&&p.z!==10&&p.z!==12&&p.x!==10&&p.x!==15&&!ENCOUNTERS.some(n=>Math.hypot(n.x-p.x,n.z-p.z)<2)&&!(p.x===3&&p.z>10));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function createAdventure(){return {hero:{x:3,z:13,yaw:0},seen:{},done:{},coins:[],mana:12,health:3,invincible:0,checkpoint:{x:3,z:13},path:[],mode:'explore',time:0,spell:0,slimeStun:0,roll:0,rollWord:'cat',loot:null,turn:0,particles:[],scratched:{},mapReveal:0};}
export function discover(s,radius=3.2){let changed=false;for(let z=0;z<SIZE.h;z++)for(let x=0;x<SIZE.w;x++)if(Math.hypot(x-s.hero.x,z-s.hero.z)<=radius&&!s.seen[key(x,z)]){s.seen[key(x,z)]=1;changed=true;}return changed;}
export function blocked(s,x,z){x=Math.round(x);z=Math.round(z);if(x<1||z<1||x>19||z>15)return true;
  if(z===7&&!(x===15&&s.done.bridge))return true;
  if(x===10&&z>=8&&!(z===10&&s.done.gate))return true;
  if(TREES.some(p=>p.x===x&&p.z===z))return true;
  return false;
}
export function route(s,to){const start={x:Math.round(s.hero.x),z:Math.round(s.hero.z)},target={x:Math.round(to.x),z:Math.round(to.z)};if(blocked(s,target.x,target.z))return [];
  const q=[start],prev=new Map([[key(start.x,start.z),null]]);for(let i=0;i<q.length;i++){const p=q[i];if(p.x===target.x&&p.z===target.z){const out=[];let k=key(p.x,p.z);while(prev.get(k)){const [x,z]=k.split(',').map(Number);out.unshift({x,z});k=prev.get(k);}return out;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=p.x+dx,z=p.z+dz,k=key(x,z);if(!blocked(s,x,z)&&!prev.has(k)){prev.set(k,key(p.x,p.z));q.push({x,z});}}}return [];
}
export function move(s,dx,dz,dt){const step=dt*3.5,n=Math.hypot(dx,dz)||1,xx=dx/n*step,zz=dz/n*step;let moved=false;
  for(const [ax,az]of [[xx,0],[0,zz]]){const x=s.hero.x+ax,z=s.hero.z+az;if(!blocked(s,x,z)&&!blocked(s,x+Math.sign(ax)*.18,z+Math.sign(az)*.18)){s.hero.x=x;s.hero.z=z;moved ||= Math.abs(ax)+Math.abs(az)>0;}}
  if(moved)s.hero.yaw=Math.atan2(dx,dz);return moved;
}
export function available(s,node){if(node.id==='dragon')return !!s.done.bridge;if(node.id==='gate')return !!s.done.smith;return true;}
export function nearest(s){return ENCOUNTERS.filter(n=>!s.done[n.id]&&distance(s.hero,n)<1.65).sort((a,b)=>distance(s.hero,a)-distance(s.hero,b))[0]||null;}
export function award(s,node){if(s.done[node.id])return false;s.done[node.id]=true;s.checkpoint={x:s.hero.x,z:s.hero.z};s.mana=Math.min(30,s.mana+6);s.loot=node;s.mode='loot';return true;}
export function hurt(s,shield=false){if(s.invincible>0)return false;s.invincible=3;s.health-=shield?0:1;if(s.health<=0){s.hero={...s.hero,...s.checkpoint};s.health=3;s.path=[];}return true;}
