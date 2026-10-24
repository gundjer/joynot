import test from 'node:test';
import assert from 'node:assert/strict';
import {motionFor,sampleMotion} from '../public/games/sparkles-rainbow-journey/js/board-motion.js';
import {tilePoint} from '../public/games/sparkles-rainbow-journey/js/board.js';
import {cameraTurn,applyCameraTurn} from '../public/games/_play/camera-view.js';
test('piece takes distinct slow steps and lifts between spaces',()=>{
 const m=motionFor({from:0,landing:4,to:4});
 assert.equal(m.walkDuration,2880);
 const half=sampleMotion(m,m.rollDuration+360),a=tilePoint(0),b=tilePoint(1);
 assert.equal(half.x,(a.x+b.x)/2);assert.equal(half.z,(a.z+b.z)/2);assert(half.lift>.3);assert(half.zoom>.9);
 const end=sampleMotion(m,m.duration);assert.equal(end.x,tilePoint(4).x);assert.equal(end.z,tilePoint(4).z);assert.equal(end.zoom,0);assert.equal(end.lift,0);assert(end.done);
});
test('special routes arrive at destination and reduced motion suppresses lift and zoom',()=>{
 for(const to of [2,28]){const m=motionFor({from:5,landing:8,to});assert.equal(m.linkDuration,1800);const end=sampleMotion(m,m.duration);assert.equal(end.x,tilePoint(to).x);assert.equal(end.z,tilePoint(to).z);}
 const m=motionFor({from:0,landing:6,to:6},{reduced:true});const p=sampleMotion(m,150);assert.equal(p.lift,0);assert.equal(p.zoom,0);assert(m.duration<1000);
});
test('camera orientation is normalized and remote faces are unmirrored',()=>{
 assert.equal(cameraTurn(-90),270);assert.equal(cameraTurn(540),180);assert.equal(cameraTurn('bad'),0);
 const video={style:{},dataset:{}};applyCameraTurn(video,180);assert.equal(video.style.transform,'rotate(180deg)');assert.equal(video.dataset.cameraTurn,'180');applyCameraTurn(video,90,true);assert.equal(video.style.transform,'rotate(90deg) scaleX(-1)');assert.equal(video.style.objectFit,'contain');
});
