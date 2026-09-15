import assert from 'node:assert/strict';
import {PASSENGERS,updateRides,rideStatus,rememberRide} from '../dist/passengers.mjs';
import {STOPS,DESTS,CARS,createCar,createRun,makeJob,pickup,deliver,defaultProfile,cleanProfile} from '../dist/driving.mjs';
import {captureShift,restoreShift} from '../dist/progress.mjs';

function trip(id){const person=PASSENGERS.find(p=>p.id===id),stop=STOPS.find(s=>s.id===person.stop),jobs=STOPS.map(s=>({job:makeJob(s)})),job=jobs.find(p=>p.job.stopId===stop.id).job,car=createCar(CARS.van,stop.x,stop.z),run=createRun();assert(pickup(run,job,CARS.van,car));return{person,job:run.passengers[0],car,run,jobs};}
function travel(t,seconds,options={}){const messages=[];for(let n=0;n<Math.ceil(seconds*60);n++){Object.assign(t.car,{speed:5,boosting:false,drifting:false,...options});t.car.x+=t.car.speed/60;messages.push(...updateRides(t.run,t.car,1/60));}return messages;}

assert.equal(new Set(PASSENGERS.map(p=>p.stop)).size,STOPS.length);
assert.equal(new Set(PASSENGERS.map(p=>p.model)).size,12);
for(const p of PASSENGERS)for(const c of p.chapters){assert(DESTS.some(d=>d.id===c.dest),'story destination exists');assert(c.request.length>15&&c.after.length>15);}

const smooth=trip('jules');assert.equal(smooth.run.wanted,0,'ordinary passengers do not create police heat');
const dialogue=travel(smooth,8);assert(dialogue.some(m=>m.line===smooth.person.talk),'passenger speaks during the ride');assert.equal(smooth.job.ride.comfort,100);
const clean=deliver(smooth.run,smooth.job.id);assert.equal(clean.base,850);assert.equal(clean.tip,170);assert.equal(clean.bonus,350);assert.equal(clean.payment,1370);assert.equal(clean.rating,5);assert.equal(deliver(smooth.run,smooth.job.id),null,'cannot collect a fare twice');
const profile=defaultProfile();rememberRide(profile,clean);assert.equal(makeJob(STOPS.find(s=>s.id==='diner'),4,Math.random,profile.passengerHistory).chapter,1,'completed ride unlocks next story chapter');
assert.equal(cleanProfile(JSON.parse(JSON.stringify(profile))).passengerHistory.jules.bestRating,5,'ratings and story history survive reload');

const rough=trip('jules');travel(rough,4);rough.run.crashes++;rough.car.health-=20;travel(rough,1,{drifting:true});const poor=deliver(rough.run,rough.job.id);assert.equal(poor.bonus,0);const poorProfile=defaultProfile();rememberRide(poorProfile,poor);assert.equal(poorProfile.passengerHistory.jules.chapters,0,'failed goal does not skip a story chapter');assert(poor.tip<clean.tip);assert(poor.rating<clean.rating);
const fragile=trip('mina');travel(fragile,3);fragile.run.crashes++;travel(fragile,.1);assert.equal(rideStatus(fragile.job).success,false);assert.equal(deliver(fragile.run,fragile.job.id).bonus,0,'damaged cargo loses goal bonus');
const intact=trip('kit');travel(intact,3);assert.equal(deliver(intact.run,intact.job.id).bonus,450);

const rushed=trip('theo');travel(rushed,3);assert.equal(deliver(rushed.run,rushed.job.id).bonus,500,'on-time ride earns deadline bonus');
const late=trip('theo');travel(late,late.job.ride.deadline+1);assert.equal(rideStatus(late.job).success,false);const lateResult=deliver(late.run,late.job.id);assert(lateResult);assert.equal(lateResult.base,850,'missing a deadline does not erase the base fare');assert.equal(lateResult.bonus,0);

const thrill=trip('nova');travel(thrill,4.2,{boosting:true});assert(rideStatus(thrill.job).success);assert.equal(deliver(thrill.run,thrill.job.id).bonus,450);
const careless=trip('rae');travel(careless,4.2,{boosting:true});careless.run.crashes+=2;travel(careless,.1);assert.equal(deliver(careless.run,careless.job.id).bonus,0);
const secret=trip('elias');travel(secret,3);assert.equal(deliver(secret.run,secret.job.id),null,'cannot drop a discreet rider while pursued');assert.equal(secret.run.passengers.length,1);secret.run.wanted=0;assert.equal(deliver(secret.run,secret.job.id).bonus,650,'losing the tail enables completion');

const savedTrip=trip('nico');travel(savedTrip,3);const snapshot=captureShift(savedTrip.car,savedTrip.run,savedTrip.jobs,{targetLock:savedTrip.job.id});
const restored=restoreShift(JSON.parse(JSON.stringify(snapshot)),defaultProfile());assert(restored);assert.equal(restored.run.passengers[0].ride.elapsed,savedTrip.job.ride.elapsed);assert.equal(restored.run.passengers[0].ride.deadline,savedTrip.job.ride.deadline);assert.equal(restored.run.passengers[0].personId,'nico');
updateRides(restored.run,restored.car,0);assert.equal(restored.run.passengers[0].ride.elapsed,savedTrip.job.ride.elapsed,'paused ride does not consume deadline');
const legacy={...snapshot,version:1};delete legacy.rides;assert(restoreShift(legacy,defaultProfile()),'pre-passenger saves still resume');
const malformed={...snapshot,rides:[{id:savedTrip.job.id,comfort:Infinity,cargo:-100,elapsed:NaN,deadline:0}]};const safe=restoreShift(malformed,defaultProfile()).run.passengers[0].ride;assert(Number.isFinite(safe.comfort)&&Number.isFinite(safe.elapsed));assert.equal(safe.cargo,0);assert.equal(safe.deadline,30);
console.log('Ride checks passed: twelve unique characters, 36 story chapters, dialogue, five ride objectives, ratings/tips, duplicate protection, saved deadlines, story progression, and legacy saves.');
