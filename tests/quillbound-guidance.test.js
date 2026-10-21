import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventure,ENCOUNTERS,distance} from '../public/games/write-it/adventure.js';
import {nextInstruction,objective,approachRoute,proximityEncounter,GREETINGS,OUTCOMES,SLIME,WAND} from '../public/games/write-it/guidance.js';
test('the story guides every objective and explains the actual river crossing',()=>{
 const s=createAdventure();for(const n of ENCOUNTERS){assert.equal(objective(s).id,n.id);assert(approachRoute(s,n).length>0||n.id!=='smith');assert(GREETINGS[n.id].text);assert(OUTCOMES[n.id]);if(n.id==='bridge')assert.match(nextInstruction(s),/Broken Crossing.*written spell.*Wooden planks/);s.done[n.id]=true;}
 assert.equal(objective(s),null);assert.match(nextInstruction(s),/Pyra is your friend/);assert.match(SLIME,/ball.*moss slime/);assert.match(WAND,/three mana.*six seconds/);
});
test('approaching someone opens the encounter after a short dwell without a button',()=>{
 const s=createAdventure();s.hero={x:5,z:12};assert.equal(proximityEncounter(s,.3),null);assert.equal(proximityEncounter(s,.3).id,'smith');
 s.mode='scroll';assert.equal(proximityEncounter(s,1),null);s.mode='explore';s.dismissedEncounter='smith';assert.equal(proximityEncounter(s,2),null);
 s.hero={x:2,z:12};proximityEncounter(s,1);assert.equal(s.dismissedEncounter,null);s.hero={x:5,z:12};assert.equal(proximityEncounter(s,.6).id,'smith');
});
test('locked encounters do not trap the player in automatically reopening dialogs',()=>{
 const s=createAdventure();s.hero={x:9,z:10};assert.equal(proximityEncounter(s,2),null);s.done.smith=true;assert.equal(proximityEncounter(s,.6).id,'gate');
 s.done.gate=true;assert.equal(proximityEncounter(s,2),null);
});
test('the golden trail ends in interaction range and crosses only restored routes',()=>{
 const s=createAdventure();s.done.smith=s.done.gate=s.done.fox=true;s.hero={x:12,z:10};const bridge=ENCOUNTERS.find(n=>n.id==='bridge'),path=approachRoute(s,bridge);assert(path.length);assert(distance(path.at(-1),bridge)<1.65);
 assert.equal(approachRoute(s,ENCOUNTERS[4]).length,0);s.done.bridge=true;assert(approachRoute(s,ENCOUNTERS[4]).some(p=>p.z===7&&p.x===15));
});
