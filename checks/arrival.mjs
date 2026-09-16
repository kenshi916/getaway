import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from '../dist/assets/three.module.js';
import {GLTFLoader} from '../dist/assets/GLTFLoader.js';
import {buildArrival,ARRIVAL_SPAWN,ARRIVAL_DOOR} from '../dist/arrival-scene.js';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
async function asset(name){const b=fs.readFileSync(new URL('../dist/assets/models/'+name,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}
const room=buildArrival({suit:await asset('suit.glb'),'passenger-k':await asset('passengers/character-k.glb')});
room.resize(1440,960);room.update(.04,{up:true},0);assert.equal(room.avatar.position.z,ARRIVAL_SPAWN.z,'welcome waits for player acknowledgement');assert(!room.walkTo(),'cannot skip greeting');
room.begin();assert(room.walkTo(),'front door is reachable');let frames=0;while(!room.nearDoor&&frames++<1200){room.update(1/30,{},frames/30);assert(!room.blocked(room.avatar.position.x,room.avatar.position.z),'path stays outside planters and benches');}assert(room.nearDoor,'walking reaches the front door');assert(frames>40,'walk happens over time');
room.openDoor();const doorway=room.avatar.position.clone();room.update(.04,{down:true},0);assert(room.avatar.position.equals(doorway),'entry animation holds the player at the door');
room.reset();room.begin();const start=room.avatar.position.clone();room.update(.04,{right:true},0);assert(room.avatar.position.x>start.x,'manual movement');assert(!room.walkTo({x:-4.6,z:5}),'planted bed cannot be selected');
assert(room.walkTo());room.update(.04,{left:true},0);assert(!room.navigating,'manual control cancels auto-walk');
for(let i=0;i<300;i++)room.update(.04,{down:true},0);assert(room.avatar.position.z<=room.bounds.maxZ,'walkable courtyard has an edge');
room.reset();room.begin();room.resize(1440,960);const p=new THREE.Vector3(-7,.06,11).project(room.camera);assert(room.clickAt((p.x+1)*720,(1-p.y)*480,1440,960),'pavement can be clicked');for(let i=0;i<120;i++)room.update(.04,{},0);assert(Math.hypot(room.avatar.position.x+7,room.avatar.position.z-11)<.12);
for(const [w,h]of [[1440,960],[390,844],[320,568],[844,390]])for(const point of [ARRIVAL_SPAWN,ARRIVAL_DOOR]){room.avatar.position.set(point.x,.06,point.z);room.resize(w,h);const clip=room.avatar.position.clone().add(new THREE.Vector3(0,1,0)).project(room.camera);assert(Math.abs(clip.x)<.9&&Math.abs(clip.y)<.8,'walker visible at '+w+'x'+h);}
console.log('Arrival: real character assets, gated greeting, collision-safe walking, keyboard override, bounds, floor click, door and responsive camera pass.');
