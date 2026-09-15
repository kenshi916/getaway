import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as THREE from '../dist/assets/three.module.js';
import {GLTFLoader} from '../dist/assets/GLTFLoader.js';
import {loadCityPack,buildCity} from '../dist/city.js';
import {residentRoutes} from '../dist/city-residents.js';
import {BLOCKS,HOME} from '../dist/driving.mjs';
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const context=new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*12})},{get:(o,k)=>o[k]||(()=>{})});
globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>context})};
const loader={loadAsync:async url=>{const b=fs.readFileSync(new URL('../dist'+url,import.meta.url));return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}};
await loadCityPack(loader);const world=new THREE.Group(),city=buildCity(world);world.updateMatrixWorld(true);
const raised=city.landscape.placements.filter(p=>p.kind!=='flat-road-cover');
function hit(a,b,p,r=0){let lo=0,hi=1;for(const axis of ['X','Z']){const key=axis.toLowerCase(),delta=b[key]-a[key],min=p['min'+axis]-r,max=p['max'+axis]+r;if(Math.abs(delta)<1e-12){if(a[key]<min||a[key]>max)return false;}else{let x=(min-a[key])/delta,y=(max-a[key])/delta;if(x>y)[x,y]=[y,x];lo=Math.max(lo,x);hi=Math.min(hi,y);if(lo>hi)return false;}}return true;}
function boxes(a,b){return a.maxX>b.minX&&a.minX<b.maxX&&a.maxZ>b.minZ&&a.minZ<b.maxZ;}
const routes=residentRoutes();const corridor=[];for(let i=0;i<routes.length;i++){const route=routes[i];for(let j=0;j<route.points.length;j++){const a=route.points[j],b=route.points[(j+1)%route.points.length];for(const p of raised)if(hit(a,b,p,.35))corridor.push({route:i,segment:j,placement:p});}}
const apron={minX:31.5,maxX:40.5,minZ:45.5,maxZ:54};const garage=raised.filter(p=>boxes(p,apron)||Math.hypot(Math.max(p.minX-HOME.x,0,HOME.x-p.maxX),Math.max(p.minZ-HOME.z,0,HOME.z-p.maxZ))<5);
const driveway=[];let housingPaths=0;for(const built of city.buildingBounds.filter(b=>b.block.outer&&b.name.startsWith('suburban/'))){const b=built.block,cx=(built.bounds.min.x+built.bounds.max.x)/2,minZ=Math.min(built.bounds.max.z,b.z+12),maxZ=Math.max(built.bounds.max.z,b.z+12),path={minX:cx-.675,maxX:cx+.675,minZ,maxZ};housingPaths++;for(const p of raised)if(p.blockX===b.x&&p.blockZ===b.z&&boxes(p,path))driveway.push({path,placement:p});}
const outsidePads=raised.filter(p=>p.minX<p.blockX-14.95||p.maxX>p.blockX+14.95||p.minZ<p.blockZ-14.95||p.maxZ>p.blockZ+14.95);
const nonfinite=city.landscape.placements.filter(p=>!['minX','maxX','minY','maxY','minZ','maxZ'].every(k=>Number.isFinite(p[k])));
const summary={stats:city.landscape.stats,placements:city.landscape.placements.length,raised:raised.length,routes:routes.length,housingPaths,corridorOverlaps:corridor.length,garageOverlaps:garage.length,drivewayOverlaps:driveway.length,outsidePads:outsidePads.length,nonfinite:nonfinite.length,samples:{corridor:corridor.slice(0,4),garage:garage.slice(0,4),driveway:driveway.slice(0,4),outsidePads:outsidePads.slice(0,4)}};
for(const key of ['corridorOverlaps','garageOverlaps','drivewayOverlaps','outsidePads','nonfinite'])assert.equal(summary[key],0,key);
// Raised grass must also stay out of the stone tree planters in housing blocks.
let planters=0;
for(const lawn of city.landscape.lawns){const b=BLOCKS.find(b=>b.x===lawn.x&&b.z===lawn.z);if(b.park)continue;const centers=b.outer?[[b.x-10.9,b.z-10.5]]:[-1,1].map(side=>[b.x+side*(b.w/2-1.25),b.z-b.d/2+.8]);for(const [x,z]of centers){planters++;assert(!raised.some(p=>p.kind==='grass-tuft'&&boxes(p,{minX:x-1,maxX:x+1,minZ:z-1,maxZ:z+1})),'grass clears housing tree planter');}}
let grassMeshes=0;city.stage.traverse(o=>{if(o.isMesh&&o.material.userData.landscapeGrass){grassMeshes++;assert.equal(o.castShadow,false,'grass batching preserves disabled shadows');}});
assert(grassMeshes>100,'grass geometry is present');
console.log(JSON.stringify({...summary,planters,grassMeshes},null,2));
