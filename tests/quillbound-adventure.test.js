import test from 'node:test';
import assert from 'node:assert/strict';
import {createAdventure,discover,key,route,blocked,move,award,ENCOUNTERS,hurt} from '../public/games/write-it/adventure.js';
test('walking discovers nearby grid tiles without revealing the entire map',()=>{const s=createAdventure();assert(discover(s));assert(s.seen[key(3,13)]);assert(!s.seen[key(16,3)]);const x=s.hero.x;move(s,1,0,.1);assert(s.hero.x>x);});
test('the gate and bridge physically block routes until their spells change the world',()=>{const s=createAdventure();assert(blocked(s,10,10));assert.equal(route(s,{x:14,z:10}).length,0);s.done.gate=true;assert(!blocked(s,10,10));assert(route(s,{x:14,z:10}).length>0);assert.equal(route(s,{x:16,z:3}).length,0);s.done.bridge=true;assert(route(s,{x:16,z:3}).length>0);});
test('one encounter can award its loot only once',()=>{const s=createAdventure();assert(award(s,ENCOUNTERS[0]));assert.equal(s.mode,'loot');assert.equal(award(s,ENCOUNTERS[0]),false);});
test('health has a grace period, shield protection and a safe checkpoint',()=>{const s=createAdventure();assert(hurt(s,true));assert.equal(s.health,3);assert.equal(hurt(s),false);s.invincible=0;s.health=1;s.hero={x:8,z:12};assert(hurt(s));assert.equal(s.health,3);assert.deepEqual({x:s.hero.x,z:s.hero.z},s.checkpoint);});
