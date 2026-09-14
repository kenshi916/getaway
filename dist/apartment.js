import * as THREE from './assets/three.module.js';
export const HOME_SPAWN={x:1,z:2.4};
export const HOME_SPOTS=[{id:'laptop',x:-2.1,z:-2.05,label:'CHECK LAPTOP'},{id:'wardrobe',x:4.65,z:.15,label:'OPEN GARAGE'},{id:'bed',x:1.6,z:-.5,label:'SAVE PROGRESS'},{id:'door',x:4.65,z:2.65,label:'HEAD DOWNSTAIRS'}];
export function buildApartment(templates,position=HOME_SPAWN){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#101c2d');
 scene.add(new THREE.HemisphereLight('#d4e9ff','#66503d',2.1));const sunlight=new THREE.DirectionalLight('#ffdeb0',3);sunlight.position.set(-5,9,6);sunlight.castShadow=true;sunlight.shadow.mapSize.set(1024,1024);Object.assign(sunlight.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:1,far:35});sunlight.shadow.normalBias=.025;scene.add(sunlight);
 const lamp=new THREE.PointLight('#ffbe78',24,12,2);lamp.position.set(-4,2,1.2);scene.add(lamp);const windowLight=new THREE.PointLight('#8dcfff',18,14,2);windowLight.position.set(-.7,3,-4);scene.add(windowLight);
 const camera=new THREE.PerspectiveCamera(40,1,.1,90),room=new THREE.Group();scene.add(room);const colliders=[],hotspots=[],mats=new Map();
 function material(color,extra={}){const key=color+JSON.stringify(extra);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.88,...extra}));return mats.get(key);}
 function box(w,h,d,color,x,y,z,extra={}){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material(color,extra));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;room.add(mesh);return mesh;}
 function solid(x,z,w,d){colliders.push({x,z,w,d});}
 function text(text,w,h,x,y,z,ink='#fce5ad',bg='#23394c'){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=Math.max(128,Math.round(768*h/w));const ctx=canvas.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,768,canvas.height);ctx.fillStyle=ink;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`700 ${Math.min(canvas.height*.6,1080/text.length)}px PixelArcade,monospace`;ctx.fillText(text,384,canvas.height/2,725);const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map,emissiveMap:map,emissive:'#ffffff',emissiveIntensity:.45}));mesh.position.set(x,y,z);room.add(mesh);return mesh;
 }
 function prop(name,x,z,width,maxHeight=5,rotation=0){const original=templates[name];if(!original)throw Error('Apartment asset missing: '+name);const root=original.scene.clone(true),wrap=new THREE.Group();wrap.add(root);root.rotation.y=rotation;root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3()),scale=Math.min(width/size.x,maxHeight/size.y);root.scale.setScalar(scale);root.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);wrap.position.set(x,.2,z);room.add(wrap);root.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});return wrap;}
 // A furnished cutaway room: the front and right walls remain open to the camera.
 box(12,.4,10,'#263847',0,-.05,0);box(11.6,.12,9.6,'#b89573',0,.18,0);
 for(let z=-4.6;z<4.8;z+=.48){box(11.5,.006,.018,'#8b735b',0,.244,z);for(let x=-4.5+(Math.round(z*2)%2)*1.2;x<5.6;x+=2.8)box(.018,.007,.46,'#9b7a61',x,.246,z);}
 box(.22,3.8,10,'#547c79',-5.85,2,-.05);box(12,.28,.2,'#d8d2b5',0,.46,-4.8);box(.18,.3,9.8,'#d8d2b5',-5.7,.46,0);
 box(4.4,3.8,.22,'#4c727b',-3.8,2,-4.85);box(4.3,3.8,.22,'#4c727b',3.85,2,-4.85);box(3.2,1,.22,'#4c727b',0,.7,-4.85);box(3.2,.65,.22,'#4c727b',0,3.58,-4.85);
 box(3.15,2.25,.09,'#1e3b60',0,2.17,-4.94,{emissive:'#36698e',emissiveIntensity:.5,roughness:.35});for(const x of [-1.55,0,1.55])box(.09,2.5,.16,'#e2d4b6',x,2.2,-4.7);for(const y of [1,2.2,3.4])box(3.2,.09,.16,'#e2d4b6',0,y,-4.7);box(3.6,.12,.55,'#dbd1b4',0,.96,-4.6);
 // Miniature lit skyline behind the window.
 for(let i=0;i<8;i++){const h=.7+(i*7%9)*.13,x=-1.4+i*.4;box(.34,h,.08,'#27415d',x,1.1+h/2,-4.83);for(let j=0;j<3;j++)box(.055,.06,.02,'#f9cd85',x-.08+(j%2)*.14,1.3+j*.23,-4.77,{emissive:'#ffbb6c',emissiveIntensity:.8});}
 // Bed, folded blanket, and bedside lamp.
 box(3,.52,3.3,'#604b47',3.25,.48,-2.6);box(2.9,.42,3.1,'#f0e7ce',3.25,.91,-2.6);box(3,1.4,.2,'#85735e',3.25,.95,-4.3);box(2.94,.08,2.2,'#64b4a0',3.25,1.17,-2.2);box(2.6,.09,.32,'#97d4b3',3.25,1.23,-1.24);box(1.05,.23,.62,'#fff4d5',2.55,1.25,-3.65);box(1.05,.23,.62,'#fff4d5',3.88,1.25,-3.65);solid(3.25,-2.6,3,3.3);
 box(.8,.75,.8,'#977152',1.24,.61,-3.65);box(.35,.05,.35,'#39475a',1.24,1.04,-3.65);box(.09,.55,.09,'#b7946b',1.24,1.32,-3.65);box(.6,.43,.6,'#ffd99d',1.24,1.6,-3.65,{emissive:'#ffd083',emissiveIntensity:.3});solid(1.24,-3.65,.8,.8);
 // Sofa, rug, and low table.
 box(4,.04,3.4,'#436e79',-2.6,.28,2.1);for(const x of [-4.45,-.75])box(.09,.02,3.15,'#cbbd8f',x,.308,2.1);box(3.4,.4,1.3,'#b07760',-3.7,.54,.55);box(3.4,1.25,.3,'#bf8e6d',-3.7,1.05,-.07);for(const x of [-5.25,-2.15])box(.35,.84,1.5,'#ad735c',x,.86,.6);for(const x of [-4.45,-3.05])box(1.27,.22,1.08,'#e0ae83',x,.83,.6);solid(-3.7,.5,3.5,1.5);
 box(1.65,.14,.95,'#bf9970',-2.65,.83,2.35);for(const x of [-3.28,-2.02])for(const z of [2.02,2.68])box(.12,.55,.12,'#465359',x,.49,z);box(.44,.05,.3,'#f1d38c',-2.9,.93,2.35);box(.2,.22,.2,'#eee6c9',-2.3,1.01,2.35);solid(-2.65,2.35,1.65,.95);
 // Imported desk setup and room props preserve the game's asset style.
 const desk=prop('desk',-3.6,-3.25,3.2,1.5,Math.PI);desk.updateMatrixWorld(true);const deskBox=new THREE.Box3().setFromObject(desk);const screen=prop('monitor',-3.6,-3.45,1.12,.8,0);screen.position.y=deskBox.max.y;const keyboard=prop('keyboard',-3.6,-2.93,.9,.12);keyboard.position.y=deskBox.max.y;prop('office-chair',-3.6,-1.9,.92,1.6,Math.PI);solid(-3.6,-3.25,3.2,1.45);solid(-3.6,-1.9,.9,.8);
 prop('potted-plant',-5.1,3.5,.75,1.7);prop('office-cabinet',5.02,-.3,1.12,2.2,-Math.PI/2);solid(5.02,-.3,1.12,1.2);prop('cardboard-box',4.9,4,.65,.6);solid(4.9,4,.65,.65);
 text('LAST EXIT / DISPATCH',2.5,.4,-3.6,2.92,-4.69,'#a6f0dc');text('HOME SWEET HOME',2.5,.47,3.2,3,-4.69,'#ffdcac','#78605c');
 // Entry frame and coat hooks at the open edge of the room.
 for(const z of [1.75,3.55])box(.18,3,.18,'#d2b38b',5.7,1.7,z);box(.18,.18,1.98,'#d2b38b',5.7,3.17,2.65);box(.08,2.9,1.65,'#395e63',5.85,1.7,2.65);box(.15,.15,.15,'#ffc87c',5.66,1.58,2.13);box(1.3,.035,1.7,'#ceb07c',4.85,.28,2.65);
 // The playable character uses the existing animated suit asset.
 const character=templates.suit.scene.clone(true),avatar=new THREE.Group();character.updateMatrixWorld(true);const cb=new THREE.Box3().setFromObject(character),cs=cb.getSize(new THREE.Vector3()),scale=1.65/cs.y;character.scale.setScalar(scale);character.position.y=-cb.min.y*scale;avatar.add(character);avatar.position.set(position.x,.25,position.z);scene.add(avatar);const mixer=new THREE.AnimationMixer(character),actions={};for(const name of ['idle','walk']){const clip=templates.suit.animations.find(a=>a.name===name);if(clip)actions[name]=mixer.clipAction(clip);}actions.idle?.play();let walking=false;
 for(const spot of HOME_SPOTS){const ring=new THREE.Mesh(new THREE.RingGeometry(.4,.48,4),new THREE.MeshBasicMaterial({color:'#94f7d5',transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.rotation.z=Math.PI/4;ring.position.set(spot.x,.29,spot.z);scene.add(ring);const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.16),new THREE.MeshBasicMaterial({color:'#ffe39b'}));diamond.position.set(spot.x,2.1,spot.z);scene.add(diamond);hotspots.push({...spot,ring,diamond});}
 function blocked(x,z){return Math.abs(x)>5.25||z<-4.1||z>4.3||colliders.some(b=>x+.27>b.x-b.w/2&&x-.27<b.x+b.w/2&&z+.27>b.z-b.d/2&&z-.27<b.z+b.d/2);}
 function setPosition(p){avatar.position.set(p.x,.25,p.z);if(blocked(p.x,p.z))avatar.position.set(HOME_SPAWN.x,.25,HOME_SPAWN.z);}
 setPosition(position);
 function update(dt,input={},step=6,time=0){const x=(input.right?1:0)-(input.left?1:0),z=(input.down?1:0)-(input.up?1:0),len=Math.hypot(x,z),before=avatar.position.clone();if(len){const dx=x/len*3.1*dt,dz=z/len*3.1*dt;if(!blocked(avatar.position.x+dx,avatar.position.z))avatar.position.x+=dx;if(!blocked(avatar.position.x,avatar.position.z+dz))avatar.position.z+=dz;avatar.rotation.y=Math.atan2(x,z);}
  const moving=before.distanceTo(avatar.position)>.0001;if(moving!==walking){walking=moving;const a=moving?actions.walk:actions.idle,b=moving?actions.idle:actions.walk;if(a){a.reset().fadeIn(.14).play();b?.fadeOut(.14);}}mixer.update(dt);
  for(const h of hotspots){const focused=step===1?h.id==='laptop':step===2?h.id==='door':step>2;h.diamond.visible=focused;h.ring.material.opacity=focused?.55+Math.sin(time*3)*.18:.15;h.diamond.position.y=2.05+Math.sin(time*2)*.1;h.diamond.rotation.y=time;}
  return before.distanceTo(avatar.position);
 }
 function nearest(){return hotspots.filter(h=>Math.hypot(avatar.position.x-h.x,avatar.position.z-h.z)<1.45).sort((a,b)=>Math.hypot(avatar.position.x-a.x,avatar.position.z-a.z)-Math.hypot(avatar.position.x-b.x,avatar.position.z-b.z))[0]||null;}
 // Fit the whole room beside the tutorial and above touch controls at any aspect ratio.
 const roomBounds=new THREE.Box3().setFromObject(room),corners=[];for(const x of [roomBounds.min.x,roomBounds.max.x])for(const y of [roomBounds.min.y,roomBounds.max.y])for(const z of [roomBounds.min.z,roomBounds.max.z])corners.push(new THREE.Vector3(x,y,z));
 function resize(width,height){
  const phone=width<=650,short=height<=560&&!phone;
  const area=phone?{left:18,right:width-18,top:height<700?296:340,bottom:height-138}:{left:short?Math.min(310,width*.41):width>1100?370:330,right:width-24,top:short?76:100,bottom:height-(short?114:132)};
  // Retain a usable viewport on unusually short embedded screens.
  if(area.bottom-area.top<100)area.top=area.bottom-100;
  camera.aspect=width/height;camera.fov=phone?44:39;camera.clearViewOffset();let distance=1,bounds;
  for(let i=0;i<8;i++){camera.position.set(11.6,13.2,16.7).multiplyScalar(distance);camera.lookAt(0,.3,0);camera.updateProjectionMatrix();camera.updateMatrixWorld();const points=corners.map(p=>p.clone().project(camera));bounds={left:Math.min(...points.map(p=>(p.x+1)*width/2)),right:Math.max(...points.map(p=>(p.x+1)*width/2)),top:Math.min(...points.map(p=>(1-p.y)*height/2)),bottom:Math.max(...points.map(p=>(1-p.y)*height/2))};const ratio=Math.max((bounds.right-bounds.left)/(area.right-area.left),(bounds.bottom-bounds.top)/(area.bottom-area.top));if(ratio<=1)break;distance*=ratio*1.012;}
  camera.far=Math.max(90,camera.position.length()+25);camera.setViewOffset(width,height,(bounds.left+bounds.right-area.left-area.right)/2,(bounds.top+bounds.bottom-area.top-area.bottom)/2,width,height);camera.updateProjectionMatrix();
 }

 return{scene,camera,avatar,colliders,hotspots,update,nearest,setPosition,blocked,resize};
}
