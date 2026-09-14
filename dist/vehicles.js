import * as THREE from './assets/three.module.js';

// RGS_Dev's CC0 vehicle models, converted from the original FBX pack to GLB.
// Geometry and wheel pivots come from the pack; driving state stays in driving.mjs.
export const VEHICLE_ASSETS={
 'getaway-van':'van',coupe:'muscle',racer:'sports','police-car':'police-sedan',
 taxi:'taxi',suv:'suv',hatchback:'hatchback'
};
const templates=new Map();
export async function loadVehiclePack(loader){
 await Promise.all(Object.entries(VEHICLE_ASSETS).map(async([id,file])=>{
  const gltf=await loader.loadAsync('/assets/models/rgsdev/'+file+'.glb');
  const body=gltf.scene.getObjectByName('Body');let wheels=0;
  gltf.scene.traverse(o=>{if(o.userData.wheel)wheels++;if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.geometry.userData.shared=true;}});
  if(!body||wheels!==4)throw new Error('Incomplete vehicle model: '+file);
  templates.set(id,gltf.scene);
 }));
}
export function makeVehicle(model,scale=1.7,paint=null){
 const source=templates.get(model);if(!source)throw new Error('Vehicle is not loaded: '+model);
 const group=new THREE.Group(),root=new THREE.Group(),asset=source.clone(true);
 group.add(root);root.add(asset);root.scale.setScalar(scale);
 const body=asset.getObjectByName('Body'),wheels=[],materialCopies=new Map(),policeLights=[];
 let tail=null;
 const cloneMaterial=original=>{
  if(materialCopies.has(original))return materialCopies.get(original);
  const m=original.clone();materialCopies.set(original,m);
  if(m.name==='paint'&&paint&&model!=='taxi')m.color.set(paint);
  if(m.name==='brake')tail=m;
  if(m.name==='police-red')policeLights[0]={material:m};
  if(m.name==='police-blue')policeLights[1]={material:m};
  return m;
 };
 asset.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(cloneMaterial):cloneMaterial(o.material);if(o.userData.wheel)wheels.push({pivot:o,front:o.userData.front,radius:o.userData.radius});});
 for(const w of wheels){const spin=new THREE.Group();for(const child of [...w.pivot.children])spin.add(child);w.pivot.add(spin);w.spin=spin;}
 return{group,root,body,wheels,tail,policeLights,pitch:0,roll:0};
}
export function animateVehicle(view,car,dt){
 view.group.position.set(car.x,.04+car.y,car.z);view.group.rotation.y=car.heading;
 const smooth=dt?1-Math.exp(-dt*11):1;
 view.pitch+=(THREE.MathUtils.clamp((car.acceleration||0)*-.0017-car.vy*.025,-.12,.12)-view.pitch)*smooth;
 view.roll+=(THREE.MathUtils.clamp((car.yawRate||0)*car.speed*.003,-.095,.095)-view.roll)*smooth;
 view.body.rotation.set(view.pitch,0,view.roll);
 for(const w of view.wheels){w.pivot.rotation.y=w.front?-(car.steering||0)*.48:0;w.spin.rotation.x=(car.wheelTravel||0)/(w.radius*view.root.scale.x);}
 if(view.tail)view.tail.emissiveIntensity=car.braking?3.5:.65;
 view.policeLights.forEach((l,i)=>{l.material.emissiveIntensity=Math.sin((car.wheelTravel||0)*2+i*Math.PI)>0?3:.4;});
}
