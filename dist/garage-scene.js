import * as THREE from './assets/three.module.js';
import {makeVehicle} from './vehicles.js?v=17';
import {CARS,PAINTS} from './driving.mjs?v=17';
export function buildGarage(templates){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#101b28');scene.fog=new THREE.Fog('#101b28',24,60);
 const camera=new THREE.PerspectiveCamera(41,1,.1,70),room=new THREE.Group();scene.add(room);
 scene.add(new THREE.HemisphereLight('#c5e5f5','#263242',2));
 const key=new THREE.DirectionalLight('#ffe3bd',3.8);key.position.set(-3,10,7);key.castShadow=true;key.shadow.mapSize.set(1024,1024);Object.assign(key.shadow.camera,{left:-13,right:13,top:13,bottom:-13,near:1,far:35});key.shadow.normalBias=.035;scene.add(key);
 const fill=new THREE.PointLight('#58d7c0',85,22,2);fill.position.set(5,4,-4);scene.add(fill);
 const mats=new Map(),props=[];
 const mat=(color,extra={})=>{const k=color+JSON.stringify(extra);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:.72,...extra}));return mats.get(k)};
 function box(w,h,d,color,x,y,z,extra={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;room.add(m);return m;}
 function prop(name,x,z,width,rotation=0){const source=templates['home-'+name];if(!source)return;const root=source.scene.clone(true),group=new THREE.Group();root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3()),c=b.getCenter(new THREE.Vector3()),scale=width/size.x;root.scale.setScalar(scale);root.position.set(-c.x*scale,-b.min.y*scale,-c.z*scale);group.add(root);group.position.set(x,.13,z);group.rotation.y=rotation;root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});room.add(group);props.push(group);}
 function sign(text,w,h,x,y,z){const cv=document.createElement('canvas');cv.width=1024;cv.height=256;const c=cv.getContext('2d');c.fillStyle='#18343d';c.fillRect(0,0,1024,256);c.strokeStyle='#73caba';c.lineWidth=8;c.strokeRect(8,8,1008,240);c.fillStyle='#e5e8c9';c.textAlign='center';c.textBaseline='middle';c.font='bold 82px PixelArcade,monospace';c.fillText(text,512,128,920);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tx,emissiveMap:tx,emissive:'#ffffff',emissiveIntensity:.3}));mesh.position.set(x,y,z);room.add(mesh);}
 box(24,.25,23,'#283c47',0,-.13,0);box(24,6.8,.3,'#253e4b',0,3.3,-8.5);
 for(const x of [-11.8,11.8])box(.4,6.8,12,'#243b47',x,3.3,-2.6);
 for(let n=-11;n<12;n+=2){box(.035,.015,23,'#42555d',n,.006,0);box(24,.015,.035,'#42555d',0,.007,n);}
 box(24,.18,.16,'#6ad5c0',0,1.55,-8.28,{emissive:'#64d4bf',emissiveIntensity:.55});
 for(const x of [-10.8,0,10.8]){box(.32,6.8,.6,'#708088',x,3.3,-8.1);box(.37,1.5,.65,'#e5bd6d',x,.75,-8.08);for(let y=.2;y<1.4;y+=.4)box(.38,.18,.67,'#26333b',x,y,-8.07);}
 box(7,4.3,.12,'#2f4753',0,2.15,-8.2);for(let n=0;n<17;n++)box(6.8,.035,.035,'#5a737c',0,.2+n*.24,-8.1);
 sign('LAST EXIT / B1',7,1.75,0,5.55,-8.03);
 for(const x of [-5,5]){box(5,.12,.34,'#c4cfc5',x,6.15,-1);box(4.8,.045,.29,'#fff3c8',x,6.05,-1,{emissive:'#fff0b4',emissiveIntensity:2});}
 prop('desk',-8,-6.9,3.4);prop('bookcaseClosedDoors',-10.6,-6.7,1.6);prop('radio',-8.4,-6.8,.5);props.at(-1).position.y=1.68;prop('trashcan',-6.15,-7,.6);
 prop('bookcaseClosedDoors',9.7,-6.8,2.3);prop('chairDesk',7.8,-6.5,.7);prop('lampRoundFloor',6.4,-7.6,.65);
 const deck=new THREE.Mesh(new THREE.CylinderGeometry(4.4,4.65,.22,64),mat('#3b505b',{metalness:.4,roughness:.48}));deck.position.y=.12;deck.receiveShadow=true;room.add(deck);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(4.42,.035,6,64),new THREE.MeshBasicMaterial({color:'#8cd9c0'}));rim.rotation.x=-Math.PI/2;rim.position.y=.24;room.add(rim);
 for(const side of [-1,1]){box(.13,.015,9.5,'#d9b674',side*4.9,.03,0);box(3.4,.018,.13,'#d9b674',side*3.2,.03,5);}
 let display=null,angle=.3,auto=true,currentId=null,currentSkin=null;
 const ghosts=[];
 for(const [id,x]of [['coupe',-7.2],['suv',7.2]]){const v=makeVehicle(CARS[id].model,1.25,'#536778');v.group.position.set(x,.15,-3.8);v.group.rotation.y=.4;scene.add(v.group);ghosts.push(v);}
 function dispose(v){const gs=new Set(),ms=new Set();v.group.traverse(o=>{if(o.isMesh){if(!o.geometry.userData.shared)gs.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material])ms.add(m)}});gs.forEach(g=>g.dispose());ms.forEach(m=>m.dispose());}
 function select(id,skin=null,paint=PAINTS[0]){if(!CARS[id])return;const k=skin?.id+':'+paint;if(currentId===id&&currentSkin===k)return;currentId=id;currentSkin=k;if(display){scene.remove(display.group);dispose(display);}display=makeVehicle(CARS[id].model,CARS[id].scale,paint,skin);display.group.position.set(0,.28,0);display.group.rotation.y=angle;scene.add(display.group);}
 function resize(w,h){camera.aspect=w/h;const portrait=w<=720;camera.position.set(portrait?8.2:8,portrait?6.2:5.5,portrait?12.5:11);camera.lookAt(0,1,0);camera.setViewOffset(w,h,portrait?0:w*.16,portrait?h*.22:0,w,h);camera.updateProjectionMatrix();}
 return {scene,camera,props,ghosts,select,resize,rotate(dx){auto=false;angle+=dx*.012;if(display)display.group.rotation.y=angle},setAuto(){auto=!auto;return auto},get auto(){return auto},get display(){return display},get selected(){return currentId},update(dt){if(auto)angle+=dt*.12;if(display)display.group.rotation.y=angle}};
}

