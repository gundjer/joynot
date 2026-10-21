import test from 'node:test';
import assert from 'node:assert/strict';
import { createFlight, updateFlight, sipNectar } from '../public/games/bee-smart/flight.js';

test('flight time and stamina pause during learning and other inactive screens',()=>{
  const flight=createFlight(4),before={...flight};
  for(let i=0;i<200;i++)updateFlight(flight,.05,{active:false,moving:true,boost:true,wet:true});
  assert.deepEqual(flight,before);
});
test('boost and weather spend energy faster than normal flight',()=>{
  const regular=createFlight(),boost=createFlight(),storm=createFlight();
  for(let i=0;i<40;i++){updateFlight(regular,.1,{moving:true});updateFlight(boost,.1,{moving:true,boost:true});updateFlight(storm,.1,{moving:true,wet:true,wind:true});}
  assert(boost.stamina<storm.stamina);assert(storm.stamina<regular.stamina);assert.equal(boost.seconds,regular.seconds);
});
test('a leaf shelters the bee from weather energy drain',()=>{
  const sheltered=createFlight(),dry=createFlight();
  updateFlight(sheltered,.1,{wet:true,wind:true,shelter:true});updateFlight(dry,.1);
  assert.equal(sheltered.stamina,dry.stamina);
});
test('nectar replenishes energy without exceeding capacity',()=>{
  const flight=createFlight();flight.stamina=91;sipNectar(flight);assert.equal(flight.stamina,100);
});
test('the home warning and safe rescue fire once and never let counters go negative',()=>{
  const flight=createFlight();flight.seconds=35;
  assert.equal(updateFlight(flight,.1),'warning');assert.equal(updateFlight(flight,.1),null);
  flight.seconds=.05;assert.equal(updateFlight(flight,.1),'rescue');assert.equal(updateFlight(flight,.1),null);assert.equal(flight.seconds,0);
});
