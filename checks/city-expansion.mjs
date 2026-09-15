import assert from 'node:assert/strict';
import {ROAD,LIMIT,BLOCKS,LANDMARKS,STOPS,DESTS,HOME,route,blocked,createCar,CARS,createRun,defaultProfile,makeJob} from '../dist/driving.mjs';
import {captureShift,restoreShift} from '../dist/progress.mjs';
import {PASSENGERS,passengerJob,storyFor} from '../dist/passengers.mjs';
import {BURN_CONFIG} from '../dist/burn-config.js';
assert.equal(ROAD.length,22);assert.equal(BLOCKS.filter(b=>b.outer).length,416);assert.equal(LANDMARKS.length,12);
for(const a of [HOME,...STOPS,...LANDMARKS])for(const b of LANDMARKS){const points=route(a,b);for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i],n=Math.ceil(Math.hypot(to.x-from.x,to.z-from.z));for(let k=0;k<=n;k++){const t=n?k/n:0;assert(!blocked(from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t,1.15),'clear route to '+b.name)}}}
const p=defaultProfile(),car=createCar(CARS.van,100,0),run=createRun(),jobs=STOPS.map(s=>({job:makeJob(s)})),waypoint={...LANDMARKS[0]};
run.haul=2345;run.time=300;
const raw=captureShift(car,run,jobs,{mapWaypoint:waypoint}),restored=restoreShift(raw,p);
assert(restored);assert(!blocked(restored.car.x,restored.car.z,1.15));assert.equal(restored.run.haul,2345);assert.equal(restored.run.time,300);assert.equal(restored.locks.mapWaypoint.x,waypoint.x);
for(const bad of [{x:Infinity,z:0},{x:LIMIT+20,z:0},{x:0,z:0}]){assert.equal(restoreShift({...raw,locks:{mapWaypoint:bad}},p).locks.mapWaypoint,null)}
const person=PASSENGERS[0],stop=STOPS.find(s=>s.id===person.stop);
const story=passengerJob(stop,4,DESTS,{[person.id]:{rides:5,chapters:0}});
assert.equal(story.dest.id,person.chapters[0].dest,'unfinished stories keep authored destination');
const repeat=passengerJob(stop,4,DESTS,{[person.id]:{rides:5,chapters:3}});
assert(repeat.dest.id.startsWith('landmark-'));assert(storyFor(repeat).request.includes(repeat.dest.name));
assert.equal(BURN_CONFIG.chainId,'0x1237');assert.equal(BURN_CONFIG.enabled,false);assert.equal(BURN_CONFIG.token,'');
console.log('Expanded city verified: expanded neighborhood routes clear, trapped legacy saves recovered, 5-minute shifts and waypoints restored, invalid waypoint rejection, authored stories preserved, Pons launch gate closed.');

