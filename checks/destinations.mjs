import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from '../dist/assets/three.module.js';
import {GLTFLoader} from '../dist/assets/GLTFLoader.js';
import {buildDestination} from '../dist/destination-scene.js';
import {loadVehiclePack} from '../dist/vehicles.js?v=32';
import {APARTMENT_ASSETS} from '../dist/apartment.js';
import {PASSENGERS} from '../dist/passengers.mjs';
import {destinationQuest} from '../dist/destination-quests.mjs';
import {findWalkPath} from '../dist/walk-navigation.mjs?v=29';

globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});
globalThis.document={createElement:()=>({getContext:()=>ctx})};
const templateResources={geometry:new Set(),material:new Set(),texture:new Set()},disposedShared=[];
class Loader{
 async loadAsync(url){
  let original=fs.readFileSync(new URL('../dist'+url,import.meta.url)),length=original.readUInt32LE(12),data=JSON.parse(original.subarray(20,20+length).toString());
  // Preserve actual geometry and animations; image decoding is browser QA.
  delete data.images;delete data.textures;delete data.samplers;
  for(const m of data.materials||[]){for(const k of Object.keys(m))if(/Texture$/.test(k))delete m[k];if(m.pbrMetallicRoughness)for(const k of Object.keys(m.pbrMetallicRoughness))if(/Texture$/.test(k))delete m.pbrMetallicRoughness[k];for(const e of Object.values(m.extensions||{}))for(const k of Object.keys(e))if(/Texture$/.test(k))delete e[k];}
  const json=Buffer.from(JSON.stringify(data)),pad=Buffer.alloc(Math.ceil(json.length/4)*4,32);json.copy(pad);const binary=original.subarray(20+length),result=Buffer.alloc(20+pad.length+binary.length);original.copy(result,0,0,12);result.writeUInt32LE(result.length,8);result.writeUInt32LE(pad.length,12);result.writeUInt32LE(0x4e4f534a,16);pad.copy(result,20);binary.copy(result,20+pad.length);
  const parsed=await new GLTFLoader().parseAsync(result.buffer.slice(result.byteOffset,result.byteOffset+result.byteLength),'');
  parsed.scene.traverse(o=>{if(!o.isMesh)return;templateResources.geometry.add(o.geometry);o.geometry.addEventListener('dispose',()=>disposedShared.push({type:'geometry',url}));for(const m of Array.isArray(o.material)?o.material:[o.material]){templateResources.material.add(m);m.addEventListener('dispose',()=>disposedShared.push({type:'material',url}));}});
  return parsed;
 }
}
const loader=new Loader(),templates={};
await Promise.all([loadVehiclePack(loader),...APARTMENT_ASSETS.map(async n=>templates['home-'+n]=await loader.loadAsync('/assets/models/interior/'+n+'.glb')),...['suit','crate'].map(async n=>templates[n]=await loader.loadAsync('/assets/models/'+n+'.glb')),...['k','e','f','m'].map(async n=>templates['passenger-'+n]=await loader.loadAsync('/assets/models/passengers/character-'+n+'.glb'))]);
const choices=[['apartment','jules','south'],['garage','rae','bay'],['garden','mina','gardens'],['venue','theo','stage']],report=[];
const overlap=(a,b)=>a.min.x<b.max.x&&a.max.x>b.min.x&&a.min.y<b.max.y&&a.max.y>b.min.y&&a.min.z<b.max.z&&a.max.z>b.min.z;
for(const [theme,personId,dest]of choices){
 const person=PASSENGERS.find(p=>p.id===personId),quest=destinationQuest({id:'audit-'+theme,personId,chapter:0,dest:{id:dest,name:theme.toUpperCase()+' DESTINATION'}}),room=buildDestination(templates,quest,person,templates.suit);
 const data={theme,hotspots:room.hotspots.map(h=>({id:h.id,blocked:room.blocked(h.x,h.z),colliderHits:room.colliders.filter(b=>h.x>b.minX&&h.x<b.maxX&&h.z>b.minZ&&h.z<b.maxZ).map(b=>b.name)})),closedPaths:room.hotspots.map(h=>({id:h.id,found:!!findWalkPath(room.spawn,h,room.blocked,room.bounds)})),navigation:[],camera:[],propOverlaps:[],disposal:{}};
 room.scene.updateMatrixWorld(true);
 for(let i=0;i<room.props.length;i++)for(let j=i+1;j<room.props.length;j++){const a=room.props[i],b=room.props[j];if(overlap(a.bounds,b.bounds))data.propOverlaps.push({a:a.name,b:b.name,aCenter:a.bounds.getCenter(new THREE.Vector3()).toArray(),bCenter:b.bounds.getCenter(new THREE.Vector3()).toArray()});}
 const frame=(phase)=>{for(const[w,h]of[[1440,960],[390,844],[320,568]]){room.resize(w,h);data.camera.push({phase,w,h,avatar:room.avatar.position.toArray(),points:room.hotspots.map(p=>{const q=new THREE.Vector3(p.x,.175,p.z).project(room.camera);return{id:p.id,x:Math.round((q.x+1)*w/2),y:Math.round((1-q.y)*h/2),inside:Math.abs(q.x)<=1&&Math.abs(q.y)<=1&&Math.abs(q.z)<=1};})});}};
 const walk=(id)=>{const started=room.walkTo(id);let i=0;for(;i<1200&&room.navigating;i++)room.update(1/60,{},i/60);const got={id,started,frames:i,arrived:room.takeArrival(),canInteract:room.canInteract(id),position:room.avatar.position.toArray(),stillNavigating:room.navigating};data.navigation.push(got);return got;};
 frame('spawn');walk('door');frame('door');data.opened=room.openDoor();for(let i=0;i<180;i++)room.update(1/60,{},i/60);data.openedProgress=room.doorProgress;data.openPaths=room.hotspots.map(h=>({id:h.id,found:!!findWalkPath(room.avatar.position,h,room.blocked,room.bounds)}));frame('door-open');walk('task');frame('task');data.finishedTask=room.finishTask();walk('talk');frame('talk');data.completed=room.complete();for(let i=0;i<300;i++)room.update(1/60,{},i/60);data.npcPosition=room.npc.position.toArray();data.npcBlocked=room.blocked(room.npc.position.x,room.npc.position.z);walk('exit');frame('exit');
 const resources={geometry:new Set(),material:new Set(),texture:new Set()},disposed={geometry:new Set(),material:new Set(),texture:new Set()};
 room.scene.traverse(o=>{if(!o.isMesh)return;resources.geometry.add(o.geometry);o.geometry.addEventListener('dispose',()=>disposed.geometry.add(o.geometry));for(const m of Array.isArray(o.material)?o.material:[o.material]){resources.material.add(m);m.addEventListener('dispose',()=>disposed.material.add(m));for(const v of Object.values(m)){if(v?.isTexture){resources.texture.add(v);v.addEventListener('dispose',()=>disposed.texture.add(v));}}}});
 room.dispose();
 for(const k of Object.keys(resources))data.disposal[k]={total:resources[k].size,disposed:disposed[k].size,ownedLeak:[...resources[k]].filter(o=>!templateResources[k].has(o)&&!disposed[k].has(o)).length};
 report.push(data);
}
for(const r of report){assert(r.hotspots.every(h=>!h.blocked),'clear interaction positions: '+r.theme);assert(r.opened&&r.finishedTask&&r.completed,'complete quest: '+r.theme);assert(r.navigation.every(n=>n.started&&n.canInteract&&!n.stillNavigating),'reachable interactions: '+r.theme);assert(!r.npcBlocked,'passenger has a clear place to stand');assert(r.closedPaths.find(p=>p.id==='task').found===false,'closed door blocks interior');assert(r.openPaths.every(p=>p.found),'opening unlocks every room path');assert(Object.values(r.disposal).every(r=>r.ownedLeak===0),'owned resources released');}
assert.equal(disposedShared.length,0,'source assets remain reusable');
console.log('Four real-model destination themes pass: closed/open door navigation, objective/conversation/exit reachability, NPC clearance, and owned/shared resource disposal.');
