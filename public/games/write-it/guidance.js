import {ENCOUNTERS,distance,route,blocked,available,nearest} from './adventure.js';

export const INTRO='Welcome to Oakhaven! I’m your guide. Your written spells can wake this enchanted realm. Pyra the dragon is waiting across the river. First, follow the golden footprints to Ari, the Rune Smith.';
export const SLIME='That bouncing green ball is a moss slime. It can bump away a heart. Walk around it, or use Calm slime to put it to sleep for six seconds. Your rune shield protects you too.';
export const WAND='Your wand casts Calm. It costs three mana gems and puts the wandering moss slime to sleep for six seconds. It does not repair the bridge: that needs a written spell at the Broken Crossing.';
const STEPS={
  smith:'Follow the golden footprints to Ari at the glowing anvil. Walk close and Ari will greet you. Forge your first rune to earn a shield.',
  gate:'Your shield is ready! Follow the golden footprints to the Vine Gate. Its ancient lock will ask for a written spell. Casting it clears the vines so you can walk through.',
  fox:'The gate is open. Walk through it and follow the golden footprints to Moonwing, the little winged creature in the golden snare. Your next written spell will set Moonwing free.',
  bridge:'To cross the river, follow the golden footprints to the Broken Crossing on this bank. Roll the dice, open your scroll, and cast a written spell. Wooden planks will appear. The Calm slime wand button cannot build the bridge.',
  dragon:'The bridge is ready! Follow the golden footprints over the wooden planks and along the far bank to Pyra. Walk close to hear her story.',
};
export const GREETINGS={
  smith:{speaker:'Ari · Rune Smith',text:'Hello, adventurer! I’m Ari, the Rune Smith. Let’s forge a shield for your journey. Tap Roll rune dice, then Open spell scroll. Write your rune and cast it to awaken the forge.'},
  gate:{speaker:'The ancient gate',text:'Welcome, rune keeper. My vines are fast asleep. Roll the rune dice and write your spell on my scroll. Your magic will open the gate.'},
  fox:{speaker:'Moonwing',text:'Over here! I’m Moonwing. This golden snare has caught my wings. Roll the dice, write a spell, and cast it to free me. Then I can travel with you!'},
  bridge:{speaker:'Your guide · River crossing',text:'Here is the missing bridge. The river is too wide to walk through. Roll the dice and open the spell scroll. Cast your writing into the crossing to bring back the wooden planks.'},
  dragon:{speaker:'Pyra · Ember Dragon',text:'Hello, little storyteller. I’m Pyra. I guard the Ember Crown, but I would rather have a friend. Will you write me a kind spell? Roll the dice and open your scroll. Your words can bring us together.'},
};
export const OUTCOMES={
  smith:'Your shield is equipped! It protects your hearts from moss slime. Next, follow the golden footprints to the Vine Gate.',
  gate:'Look! The vines have uncurled. You can walk through the gate now. Moonwing needs your help on the other side.',
  fox:'You freed Moonwing! Your new companion will fly beside you. Now find the Broken Crossing to restore the bridge.',
  bridge:'You did it! Wooden planks now cross the river. Walk along the golden footprints, over your new bridge, to meet Pyra on the far bank.',
  dragon:'Pyra is your friend! You earned the Ember Crown through kindness and writing. Pyra and Moonwing can explore the realm with you. Open Character and loot to try your equipment and spell cards.',
};
export function objective(s){return ENCOUNTERS.find(n=>!s.done[n.id])||null;}
export function nextInstruction(s){const n=objective(s);return n?STEPS[n.id]:OUTCOMES.dragon;}
export function approachRoute(s,node){
  if(!node)return [];
  const candidates=[{x:node.x,z:node.z},...[[-1,0],[1,0],[0,1],[0,-1]].map(([x,z])=>({x:node.x+x,z:node.z+z}))].filter(p=>!blocked(s,p.x,p.z));
  const paths=candidates.map(p=>({p,path:route(s,p)})).filter(({p,path})=>path.length||distance(s.hero,p)<.5);
  paths.sort((a,b)=>a.path.length-b.path.length);return paths[0]?.path||[];
}
// A dismissed encounter stays dismissed until the hero steps outside its ring.
export function proximityEncounter(s,dt){
  if(s.dismissedEncounter){const old=ENCOUNTERS.find(n=>n.id===s.dismissedEncounter);if(!old||distance(s.hero,old)>2.3)s.dismissedEncounter=null;}
  const n=nearest(s);
  if(s.mode!=='explore'||!n||!available(s,n)||s.dismissedEncounter===n.id){s.approachId=null;s.approachTime=0;return null;}
  if(s.approachId!==n.id){s.approachId=n.id;s.approachTime=0;}
  s.approachTime+=dt;return s.approachTime>=.6?n:null;
}
