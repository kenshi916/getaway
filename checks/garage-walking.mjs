import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/assets/three.module.js';
import {GLTFLoader} from '../dist/assets/GLTFLoader.js';
import {loadVehiclePack} from '../dist/vehicles.js?v=29';
import {buildGarage} from '../dist/garage-scene.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const loader={async loadAsync(url){const b=fs.readFileSync(new URL('../dist'+url,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}};
await loadVehiclePack(loader);const templates={suit:await loader.loadAsync('/assets/models/suit.glb')};
for(const name of ['desk','bookcaseClosedDoors','radio','trashcan','chairDesk','lampRoundFloor'])templates['home-'+name]=await loader.loadAsync('/assets/models/interior/'+name+'.glb');
const g=buildGarage(templates);g.select('hatch');g.resize(1440,960);
for(const spot of g.hotspots){g.resetSpawn();assert(g.walkTo(spot.id),'route exists to '+spot.id);let arrived=null;for(let i=0;i<1800&&!arrived;i++){g.update(1/30,{},i/30);assert(!g.blocked(g.avatar.position.x,g.avatar.position.z),'walker outside obstacles');arrived=g.takeArrival();}assert.equal(arrived,spot.id);assert(g.canInteract(spot.id));}
g.resetSpawn();const start=g.avatar.position.clone();g.update(.04,{left:true},0);assert(g.avatar.position.x<start.x);g.update(.04,{right:true},0);assert(Math.abs(g.avatar.position.x-start.x)<.01);g.update(.04,{up:true},0);assert(g.avatar.position.z<start.z);g.update(.04,{down:true},0);assert(Math.abs(g.avatar.position.z-start.z)<.01);
assert(g.blocked(0,0));assert(g.blocked(12,0));assert(!g.walkTo(null,{x:0,z:0}));g.avatar.position.set(0,.035,5.3);for(let i=0;i<100;i++)g.update(1/30,{up:true},0);assert(g.avatar.position.z>=4.85,'display collision stops walking');
g.resetSpawn();g.setInspection(true);assert(!g.avatar.visible);g.update(.04,{right:true},0);assert(!g.inspection&&g.avatar.visible,'movement leaves inspection');
g.resetSpawn();const destination=new THREE.Vector3(-6.4,0,8.7).project(g.camera);assert(g.clickAt((destination.x+1)*720,(1-destination.y)*480,1440,960));for(let i=0;i<100;i++)g.update(1/30,{},0);assert(Math.hypot(g.avatar.position.x+6.4,g.avatar.position.z-8.7)<.12,'floor click moves avatar');
console.log('Garage walking verified: all hotspots reachable, four directions, display/wall collision, floor clicks, and inspection-to-walking transition.');

for(const [w,h]of [[1440,960],[390,844],[320,568],[844,390]])for(const point of [g.spawn,...g.hotspots,{x:-10.7,z:10.4},{x:10.7,z:10.4}]){g.avatar.position.set(point.x,.035,point.z);g.resize(w,h);for(const height of [0,1.8]){const p=g.avatar.position.clone().add(new THREE.Vector3(0,height,0)).project(g.camera);assert(Math.abs(p.x)<.85&&Math.abs(p.y)<.9,'walker stays visible '+w+'x'+h);}}
