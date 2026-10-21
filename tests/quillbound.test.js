import test from 'node:test';
import assert from 'node:assert/strict';
import { checkSentence, checkParagraph, checkInk, CARDS } from '../public/games/write-it/quests.js';
test('sentence spells require whole card words and reward punctuation separately',()=>{
  assert.equal(checkSentence('The swift dragon flew over the river.',CARDS[0]).bonus,5);
  assert.equal(checkSentence('the swift dragon flew over the river',CARDS[0]).ok,true);
  assert.equal(checkSentence('The dragonfly flew over the river.',CARDS[0]).ok,false);
  assert.equal(checkSentence('The dragon flew over',CARDS[0]).ok,false);
});
test('story scrolls require four distinct, punctuated ideas and linked details',()=>{
  const lines=['Pyra, I want to be your friend.','First, I can bring you warm cocoa.','Also, we could explore the forest together.','Please join our kind and curious team.'];
  assert.equal(checkParagraph(lines).ok,true);
  assert.equal(checkParagraph(lines.slice(0,3)).ok,false);
  assert.equal(checkParagraph(lines.map(s=>s.toLowerCase())).ok,false);
  assert.equal(checkParagraph(Array(4).fill(lines[0])).ok,false);
  assert.equal(checkParagraph([lines[0],'I like to visit forests.','I enjoy seeing the stars.',lines[3]]).ok,false);
});
test('handwriting requires coverage and alignment, not just stray dots',()=>{
  const target=[Array.from({length:40},(_,i)=>[20,i*5])];
  assert.equal(checkInk(target,target).ok,true);
  assert.equal(checkInk([[[20,0],[20,1],[20,2]]],target).ok,false);
  assert.equal(checkInk([Array.from({length:40},(_,i)=>[200,i*5])],target).ok,false);
  assert.equal(checkInk([],target).ok,false);
});
