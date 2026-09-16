import * as THREE from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
export function buildGarageRoom(scene,templates){
 const room=new THREE.Group(),props=[],materials=new Map();scene.add(room);
 const grain=new Uint8Array(64*64*4);let seed=8731;for(let i=0;i<grain.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=185+((seed>>>24)%48);grain.set([v,v,v,255],i);}const concrete=new THREE.DataTexture(grain,64,64);concrete.wrapS=concrete.wrapT=THREE.RepeatWrapping;concrete.repeat.set(9,9);concrete.magFilter=THREE.LinearFilter;concrete.needsUpdate=true;
 function mat(color,extra={}){const k=color+JSON.stringify(extra);if(!materials.has(k))materials.set(k,new THREE.MeshStandardMaterial({color,roughness:.63,...extra}));return materials.get(k);}
 function box(w,h,d,color,x,y,z,extra={},parent=room){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function sign(text,w,h,x,y,z,ink='#e9d7a2',bg='#14191c',parent=room){const cv=document.createElement('canvas');cv.width=1024;cv.height=Math.max(128,Math.round(1024*h/w));const c=cv.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,cv.width,cv.height);c.fillStyle=ink;c.textAlign='center';c.textBaseline='middle';c.font=`900 ${Math.min(cv.height*.66,1500/text.length)}px Arial,sans-serif`;c.fillText(text,512,cv.height/2,940);const tx=new THREE.CanvasTexture(cv);tx.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tx,emissiveMap:tx,emissive:'#ffffff',emissiveIntensity:.22,roughness:.8,side:THREE.DoubleSide}));m.position.set(x,y,z);parent.add(m);return m;}
 function prop(name,x,z,height,color='#4c5354',width=Infinity){const template=templates['home-'+name];if(!template)return null;const root=template.scene.clone(true),group=new THREE.Group();root.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(root),size=b.getSize(new THREE.Vector3()),center=b.getCenter(new THREE.Vector3()),scale=Math.min(height/size.y,width/size.x);root.scale.setScalar(scale);root.position.set(-center.x*scale,-b.min.y*scale,-center.z*scale);root.traverse(o=>{if(!o.isMesh)return;o.castShadow=true;o.receiveShadow=true;const recolor=m=>{const a=m.clone();a.color.set(color);a.roughness=.55;a.metalness=.2;return a;};o.material=Array.isArray(o.material)?o.material.map(recolor):recolor(o.material);});group.add(root);group.position.set(x,.03,z);room.add(group);props.push(group);return group;}
 const floor=box(24,.28,23,'#264a47',0,-.15,1.2,{map:concrete,roughness:.54,metalness:.2});
 box(24,6.8,.4,'#47736c',0,3.3,-8.5,{map:concrete,roughness:.93});
 for(const x of [-11.8,11.8]){box(.4,6.8,12,'#294d49',x,3.3,-2.6,{map:concrete,roughness:.9});box(.4,.28,9.3,'#373d3d',x,.13,7.3);}
 for(let x=-8;x<=8;x+=4)box(.018,.01,23,'#3d4141',x,.002,1.2);for(let z=-6;z<=10;z+=4)box(24,.01,.018,'#3d4141',0,.003,z);
 // Cast-concrete panels, expansion joints, and a protective wall band.
 for(const x of [-8,-4,4,8])box(.025,6.7,.026,'#30383a',x,3.3,-8.28);for(const y of [2.2,4.4])box(24,.025,.035,'#31393a',0,y,-8.28);
 box(24,1.4,.12,'#20282b',0,.75,-8.23);box(24,.075,.14,'#bda362',0,1.5,-8.15);
 for(const x of [-10.8,-4.8,4.8,10.8]){box(.43,6.7,.55,'#414b4d',x,3.3,-7.98);box(.47,1.35,.62,'#d4af57',x,.67,-7.93);for(let y=.15;y<1.3;y+=.33)box(.48,.13,.64,'#292e2f',x,y,-7.92);}
 for(const z of [-7,-.8]){box(23,.26,.24,'#282f31',0,6.38,z,{metalness:.5});for(const x of [-7,0,7]){box(3.1,.12,.28,'#272d2d',x,6.13,z);box(2.9,.045,.22,'#fff1ce',x,6.045,z,{emissive:'#ffdfaa',emissiveIntensity:2.7});}}
 for(const x of [-10.2,10.2]){box(.09,.09,13.2,'#836853',x,5.86,-1.2,{metalness:.6});box(.1,2.3,.1,'#836853',x,4.74,-7.75,{metalness:.6});}
 // An inset shutter and an illuminated Last Exit sign anchor the far wall.
 box(8.3,4.7,.18,'#11191e',0,2.35,-8.08);box(7.7,4.2,.1,'#3d4a4f',0,2.12,-7.94,{metalness:.6,roughness:.38});for(let n=0;n<21;n++)box(7.7,.036,.06,'#1f2a2f',0,.13+n*.2,-7.86);
 box(9.3,1.35,.19,'#171d20',0,5.38,-8.05);sign('LAST EXIT',8.5,1.03,0,5.4,-7.93,'#f2d084');box(9,.045,.11,'#ffdfa0',0,4.76,-7.88,{emissive:'#ffc25c',emissiveIntensity:2.2});
 // Correctly scaled workbench, drawers and equipment cabinet.
 const bench=new THREE.Group();bench.position.set(-7.55,0,-7.2);room.add(bench);props.push(bench);box(4.25,.13,1.18,'#7e8581',0,1.03,0,{metalness:.7,roughness:.35},bench);for(const x of [-1.9,1.9])box(.14,1,.98,'#262d30',x,.5,0,{},bench);box(4,.08,.8,'#2f393c',0,.19,0,{},bench);
 for(const x of [-8.8,-7.9,-7])prop('kitchenCabinetDrawer',x,-7.19,.91,x===-7?'#b98438':'#434f50');const radio=prop('radio',-6.5,-7.2,.26,'#555e58',.4);if(radio)radio.position.y=1.1;
 prop('bookcaseClosedDoors',-10.35,-7.2,2.1,'#3c484b');prop('trashcan',-5.05,-7.1,.67,'#6d7370');
 box(4.05,1.4,.1,'#2e373a',-7.6,2.05,-8.05);for(let x=-9.4;x<-5.7;x+=.23)for(let y=1.45;y<2.7;y+=.24)box(.025,.025,.025,'#566364',x,y,-7.98);
 for(let n=0;n<7;n++){const x=-9.14+n*.47;box(.06,.49+(n%3)*.1,.05,'#aeb6af',x,2.13,-7.88,{metalness:.7});box(.2,.12,.06,n%2?'#b58944':'#808e8c',x,2.41,-7.88);}
 sign('SERVICE / 01',3.4,.4,-7.6,3.11,-8.02,'#d8d5c3');
 // Tire storage and a low parts trolley stay outside the walking aisles.
 const rack=new THREE.Group();rack.position.set(7.5,0,-7.2);room.add(rack);props.push(rack);for(const x of [-1.5,1.5])box(.1,2.48,.9,'#3f4c4f',x,1.24,0,{},rack);for(const y of [.22,1.28,2.44])box(3.1,.08,.9,'#5e6968',0,y,0,{metalness:.55},rack);
 const tireGeo=new THREE.TorusGeometry(.37,.13,10,24),tireMat=mat('#181d20',{roughness:.95}),hubMat=mat('#646e70',{metalness:.7,roughness:.28});for(const y of [.77,1.83])for(const x of [-1.06,0,1.06]){const tire=new THREE.Mesh(tireGeo,tireMat);tire.position.set(x,y,0);tire.castShadow=true;rack.add(tire);const hub=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.19,12),hubMat);hub.rotation.x=Math.PI/2;hub.position.copy(tire.position);rack.add(hub);}
 prop('bookcaseClosedDoors',10.05,-7.15,2.1,'#394448');const trolley=new THREE.Group();trolley.position.set(5.05,0,-7.2);room.add(trolley);props.push(trolley);box(1.15,.82,.78,'#94713f',0,.5,0,{},trolley);for(const y of [.29,.48,.67])box(.9,.035,.04,'#252b2d',0,y,.41,{},trolley);box(1.2,.08,.82,'#313c3c',0,.95,0,{},trolley);
 sign('WHEELS / 02',3.4,.4,7.5,3.12,-8.02,'#d8d5c3');
 const deck=new THREE.Mesh(new THREE.CylinderGeometry(4.55,4.65,.12,72),mat('#303a3d',{metalness:.65,roughness:.35}));deck.position.y=.065;deck.receiveShadow=true;room.add(deck);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(4.52,.017,6,80),new THREE.MeshBasicMaterial({color:'#d9b865'}));rim.rotation.x=-Math.PI/2;rim.position.y=.14;room.add(rim);
 for(let n=0;n<20;n++){const a=n*Math.PI/10,m=box(.012,.003,.47,'#596263',Math.sin(a)*4.24,.131,Math.cos(a)*4.24);m.rotation.y=a;}
 for(const side of [-1,1]){for(const x of [side*5.6,side*9.5])box(.06,.007,6.45,'#bbb69b',x,.008,-3.6);box(3.9,.007,.06,'#bbb69b',side*7.55,.008,-.36);const number=sign(side<0?'02':'03',1.2,.8,side*7.55,.013,.55,'#b5b49f','#284b48');number.rotation.x=-Math.PI/2;box(2.3,.12,.22,'#363e3e',side*7.55,.06,-6.45);}
 const floorLabel=sign('DISPLAY 01',2.7,.48,0,.015,5.05,'#c4b17a','#284b48');floorLabel.rotation.x=-Math.PI/2;
 // Indoor reflection strips replace the exterior blue sky on the car paint.
 const faces=Array.from({length:6},(_,i)=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');x.fillStyle='#333b3e';x.fillRect(0,0,128,128);x.fillStyle='#909695';x.fillRect(0,15,128,8);x.fillStyle='#fff1c9';x.fillRect(0,31+(i%2)*10,128,8);x.fillStyle='#181f24';x.fillRect(0,76,128,52);return c;});const reflection=new THREE.CubeTexture(faces);reflection.colorSpace=THREE.SRGBColorSpace;reflection.needsUpdate=true;scene.environment=reflection;
 const walls=room.children.filter(m=>m.isMesh&&m.geometry.parameters?.height>6);
 const batches=new Map();for(const mesh of [...room.children]){if(!mesh.isMesh||mesh.material.map||mesh.material.transparent)continue;mesh.updateMatrix();const list=batches.get(mesh.material)||[];list.push(mesh);batches.set(mesh.material,list);}for(const [material,list]of batches){if(list.length<2)continue;const parts=list.map(m=>m.geometry.clone().applyMatrix4(m.matrix)),geometry=mergeGeometries(parts);parts.forEach(g=>g.dispose());if(!geometry)continue;const merged=new THREE.Mesh(geometry,material);merged.castShadow=true;merged.receiveShadow=true;room.add(merged);for(const m of list){room.remove(m);m.geometry.dispose();}}
 return {room,props,mat,box,sign,floor,walls};
}
