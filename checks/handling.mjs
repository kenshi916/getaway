// Image decoding is browser-verified; Node checks validate geometry and game state.
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as D from '../dist/driving.mjs';
import * as THREE from '../dist/assets/three.module.js';
import {makeVehicle,animateVehicle,loadVehiclePack} from '../dist/vehicles.js';
import {GLTFLoader} from '../dist/assets/GLTFLoader.js';
const {CARS,createCar,drive,dist,route,HOME,STOPS}=D,dt=1/120;
await loadVehiclePack({async loadAsync(url){const b=fs.readFileSync(new URL('../dist'+url,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}},{detailed:'eager'});
const stats=[];
for(const config of Object.values(CARS)){
 let car=createCar(config,0,0,0);for(let i=0;i<180;i++)drive(car,{throttle:1},dt,[]);assert(car.speed>19,config.id+' acceleration');
 const at={x:car.x,z:car.z},before=car.speed;for(let i=0;i<Math.ceil(before/38/dt)+2;i++)drive(car,{throttle:-1},dt,[]);assert(car.speed<.5,config.id+' braking');assert(dist(car,at)<14,'stop distance');
 for(let i=0;i<120;i++)drive(car,{throttle:-1},dt,[]);assert(car.vz<-5,'reverse engages after stop');
 car=createCar(config,0,0,0);drive(car,{steer:1},.04,[]);assert.equal(car.heading,0,'no stationary spin');car.vz=18;car.speed=18;
 for(let i=0;i<60;i++)drive(car,{throttle:1,steer:1,brake:true},dt,[]);assert(car.drifting,'drift enters');const driftSlip=Math.abs(car.vx*Math.cos(car.heading)-car.vz*Math.sin(car.heading));assert(driftSlip>3,'drift retains lateral momentum');
 for(let i=0;i<90;i++)drive(car,{throttle:1},dt,[]);const recoveredSlip=Math.abs(car.vx*Math.cos(car.heading)-car.vz*Math.sin(car.heading));assert(recoveredSlip<.3,'released drift regains traction');
 car=createCar(config,0,0,0);for(let i=0;i<180;i++)drive(car,{throttle:1,boost:true},dt,[]);assert(car.nitro<60&&car.speed>config.speed*1.2,'nitro accelerates');const peak=car.speed;drive(car,{throttle:1},dt,[]);assert(peak-car.speed<1,'no boost release speed snap');
 const view=makeVehicle(config.model,config.scale,'#ffc23d');animateVehicle(view,car,dt);const box=new THREE.Box3().setFromObject(view.root);assert(box.max.y>1.2&&box.max.y<3.2,'sensible car dimensions');assert.equal(view.wheels.length,4);let meshes=0,triangles=0;view.root.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const n of o.geometry.attributes.position.array)assert(Number.isFinite(n),'finite geometry');}});assert(meshes<(config.model.startsWith('concept-')?45:32),'batched vehicle meshes');
 stats.push({car:config.id,driftSlip:+driftSlip.toFixed(2),recoveredSlip:+recoveredSlip.toFixed(3),meshes,triangles});
}
const patrol=makeVehicle('police-car');assert.equal(patrol.policeLights.length,2);assert(patrol.tail);assert(patrol.wheels.every(w=>w.radius>0));
// Steering and braking should be similar across normal phone refresh rates.
function simulate(step){const car=createCar(CARS.van,0,0,0);for(let t=0;t<2-1e-5;t+=step)drive(car,{throttle:1,steer:t>1?.5:0},step,[]);return car;}
const sixty=simulate(1/60),hundred=simulate(1/120);assert(dist(sixty,hundred)<.6,'refresh independent handling');
// Preserve police navigation through actual city corners with the updated grip.
const source=fs.readFileSync(new URL('../dist/getaway.js',import.meta.url),'utf8');
const fn=source.slice(source.indexOf('function aiSteer('),source.indexOf('function updateTraffic('));
const ctx=vm.createContext({...D,animateCar(){}});vm.runInContext(fn+';this.ai=aiSteer',ctx);
for(const stop of STOPS){const car=createCar({...CARS.coupe,speed:20},HOME.x,HOME.z,-Math.PI/2),entity={car,view:{}},path=route(car,stop);let arrived=false;for(let t=0;t<30;t+=1/60){ctx.ai(entity,path,17,1/60);if(dist(car,stop)<4.5){arrived=true;break;}}assert(arrived,'police route '+stop.id);}
// Real progression functions stay compatible with the new vehicle definitions.
const profile=D.defaultProfile(),run=D.createRun(),job=D.makeJob(STOPS[2],0,()=>0);
assert(D.pickup(run,job,CARS.van));assert(!D.pickup(run,job,CARS.van));const payment=D.deliver(run,job.id);assert.equal(payment.payment,850);assert(D.settleRun(run,profile,true));assert.equal(profile.credits,850);assert(!D.settleRun(run,profile,true));profile.credits=7000;assert(D.buyCar(profile,'coupe'));assert.equal(D.cleanProfile(JSON.parse(JSON.stringify(profile))).selected,'coupe');
console.log(JSON.stringify({passed:'steering, braking, reversing, drift recovery, nitro, model geometry, police routes, pickups, banking, saved unlocks',cars:stats},null,2));
