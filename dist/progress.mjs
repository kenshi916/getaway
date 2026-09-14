import {CARS,STOPS,DESTS,LIMIT,clamp,createCar,createRun} from './driving.mjs?v=7';
const RUN_FIELDS=['time','haul','deliveries','combo','wanted','heat','escape','pickups','nearMisses','crashes','airJumps','drift','style','busted','elapsed','roadblockCount'];
const CAR_FIELDS=['x','z','heading','vx','vz','y','vy','health','nitro','ground','airtime','steering','yawRate','wheelTravel','reverseDelay'];
export function captureShift(player,run,pickups,locks={}){
 if(run.phase!=='driving'||run.banked)return null;
 const car=Object.fromEntries(CAR_FIELDS.map(k=>[k,Number.isFinite(player[k])?player[k]:0]));
 const job=j=>({id:j.id,stopId:j.stopId,destId:j.dest.id,picked:j.picked,cooldown:j.cooldown});
 return{version:1,carId:player.config.id,car,run:{...Object.fromEntries(RUN_FIELDS.map(k=>[k,run[k]])),passengerIds:run.passengers.map(j=>j.id)},jobs:pickups.map(p=>job(p.job)),locks:{bankRoute:!!locks.bankRoute,pickupLock:locks.pickupLock||null,targetLock:locks.targetLock||null}};
}
export function restoreShift(raw,profile){
 if(!raw||raw.version!==1||!CARS[raw.carId]||!profile.unlocked.includes(raw.carId)||!raw.car||!raw.run||!Array.isArray(raw.jobs)||raw.jobs.length!==STOPS.length||!Array.isArray(raw.run.passengerIds))return null;
 if(!Number.isFinite(raw.run.time)||raw.run.time<=0||raw.run.time>180||!Number.isFinite(raw.car.health)||raw.car.health<=0)return null;
 for(const key of CAR_FIELDS)if(!Number.isFinite(raw.car[key]))return null;
 for(const key of RUN_FIELDS)if(!Number.isFinite(raw.run[key]))return null;
 if(Math.abs(raw.car.x)>LIMIT||Math.abs(raw.car.z)>LIMIT)return null;
 const jobs=[],seen=new Set();
 for(const j of raw.jobs){if(!j||typeof j!=='object')return null;const stop=STOPS.find(s=>s.id===j.stopId),dest=DESTS.find(d=>d.id===j.destId);if(!stop||!dest||seen.has(stop.id)||typeof j.id!=='string'||!j.id.startsWith(stop.id+'-')||!/^\d{1,9}$/.test(j.id.slice(stop.id.length+1)))return null;seen.add(stop.id);jobs.push({id:j.id,stopId:stop.id,name:['','LATE SHIFT','HOT PICKUP','BIG SCORE'][stop.type],level:stop.type,value:[0,850,1450,2100][stop.type],dest:{...dest},picked:j.picked===true,cooldown:clamp(Number(j.cooldown)||0,0,30)});}
 if(raw.run.passengerIds.length>CARS[raw.carId].seats||new Set(raw.run.passengerIds).size!==raw.run.passengerIds.length)return null;
 const passengers=[];for(const id of raw.run.passengerIds){const job=jobs.find(j=>j.id===id);if(!job||!job.picked)return null;passengers.push({...job});}
 const run=createRun();for(const k of RUN_FIELDS)run[k]=clamp(raw.run[k],0,1e7);run.time=raw.run.time;run.combo=clamp(raw.run.combo,1,3);run.wanted=clamp(raw.run.wanted,0,5);run.busted=clamp(raw.run.busted,0,4.5);run.passengers=passengers;
 const car=createCar(CARS[raw.carId]);for(const k of CAR_FIELDS)car[k]=raw.car[k];car.health=clamp(car.health,1,car.config.health);car.nitro=clamp(car.nitro,0,100);car.vx=clamp(car.vx,-50,50);car.vz=clamp(car.vz,-50,50);car.y=clamp(car.y,0,20);car.vy=clamp(car.vy,-30,30);car.speed=Math.hypot(car.vx,car.vz);car.acceleration=0;
 const locks={bankRoute:raw.locks?.bankRoute===true,pickupLock:STOPS.some(s=>s.id===raw.locks?.pickupLock)?raw.locks.pickupLock:null,targetLock:passengers.some(p=>p.id===raw.locks?.targetLock)?raw.locks.targetLock:null};
 return{car,run,jobs,locks};
}
