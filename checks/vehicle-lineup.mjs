import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from '../dist/assets/three.module.js';
import {GLTFLoader} from '../dist/assets/GLTFLoader.js';
import {loadVehiclePack,makeVehicle,animateVehicle} from '../dist/vehicles.js';
import {CARS,createCar} from '../dist/driving.mjs';
import {SKINS} from '../dist/collection.mjs';
globalThis.self=globalThis;
globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
await loadVehiclePack({async loadAsync(url){const b=fs.readFileSync(new URL('../dist'+url,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}},{detailed:'eager'});
const meshes=view=>{const all=[];view.root.traverse(o=>{if(o.isMesh)all.push(o);});return all;};
for(const car of Object.values(CARS)){
 assert(car.model.startsWith('concept-'),car.id+' has detailed bodywork');
 for(const skin of SKINS.filter(s=>s.color)){
  const v=makeVehicle(car.model,car.scale,'#ffc23d',skin);
  const paint=meshes(v).flatMap(m=>Array.isArray(m.material)?m.material:[m.material]).filter(m=>m.name==='paint');
  assert(paint.length,car.id+' exposes editable paint');
  assert(paint.every(m=>m.color.equals(new THREE.Color(skin.color))),car.id+' '+skin.id+' recolors body');
  const other=makeVehicle(car.model,car.scale,'#ff0000');
  assert(meshes(other).some(m=>m.material.name==='paint'&&!m.material.color.equals(new THREE.Color(skin.color))),'skin does not leak between cars');
 }
}
for(const model of ['getaway-van','coupe','racer','police-car','taxi','suv','hatchback']){
 const v=makeVehicle(model,1.55),car=createCar(CARS.coupe,0,0,0);
 const count=meshes(v).reduce((n,m)=>n+(m.geometry.index?.count||m.geometry.attributes.position.count)/3,0);
 assert(count<30000,model+' traffic geometry budget');assert.equal(v.wheels.length,4);assert.equal(v.wheels.filter(w=>w.front).length,2);
 assert(v.wheels.every(w=>Number.isFinite(w.radius)&&w.radius>0));
 car.wheelTravel=10;car.steering=.6;car.braking=true;animateVehicle(v,car,1/60);
 assert(v.wheels.every(w=>Math.abs(w.spin.rotation.x)>0),'all four wheels roll');
 assert(v.wheels.filter(w=>w.front).every(w=>w.pivot.rotation.y!==0),'front wheels steer');
 assert(v.tail&&v.tail.emissiveIntensity===3.5,'brake lights respond');
 const bounds=new THREE.Box3().setFromObject(v.root,true);assert(bounds.min.y>-.05&&bounds.min.y<.05,model+' wheels meet road: '+bounds.min.y);
 if(model==='police-car')assert.equal(v.policeLights.length,2);
}
console.log('PASS: all six detailed cars support every paint skin; isolated materials; seven optimized traffic/patrol types have four rolling wheels, steering, brake lights, road contact and <30k triangles.');
