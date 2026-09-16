import assert from 'node:assert/strict';
import * as THREE from '../dist/assets/three.module.js';
import {buildClub} from '../dist/club-scene.js';
import {CLUB,TABLES} from '../dist/club-catalog.mjs';
globalThis.innerWidth=1440;globalThis.innerHeight=1000;const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>ctx})};
const source=new THREE.Group();source.add(new THREE.Mesh(new THREE.BoxGeometry(.6,1.8,.4),new THREE.MeshStandardMaterial()));const templates={suit:{scene:source,animations:[]}};
const room=buildClub(templates);assert.equal(TABLES.length,6);assert((CLUB.bounds.maxX-CLUB.bounds.minX)*(CLUB.bounds.maxZ-CLUB.bounds.minZ)>2000);
for(const spot of room.spots){room.avatar.position.set(CLUB.spawn.x,.23,CLUB.spawn.z);room.walkTo(spot.id);for(let i=0;i<1800&&Math.hypot(room.avatar.position.x-spot.x,room.avatar.position.z-spot.z)>.35;i++)room.update(1/60,{});assert(Math.hypot(room.avatar.position.x-spot.x,room.avatar.position.z-spot.z)<.35,'reachable '+spot.id);assert(!room.blocked(room.avatar.position.x,room.avatar.position.z));}
for(const [w,h]of [[1440,1000],[390,844],[844,390]]){room.resize(w,h);room.setFirstPerson(false);room.update(2,{});assert(room.camera.position.toArray().every(Number.isFinite));room.setFirstPerson(true);room.update(.1,{});assert(room.camera.position.toArray().every(Number.isFinite));}
room.scene.updateMatrixWorld();room.scene.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite)));room.dispose();console.log('PASS: all six tables, lounge, bar and exit reachable through the expanded layout; desktop/mobile and first-person cameras remain finite.');
