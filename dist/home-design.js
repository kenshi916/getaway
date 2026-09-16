import * as THREE from './assets/three.module.js';
import {HOME_THEMES,cleanDecor} from './first-hour.mjs?v=38';
// These are actual scene surfaces, present in close, overhead and walking cameras.
export function addHomeSurroundings(scene,garage=false){
 const root=new THREE.Group();root.name='landscaped-home-surroundings';scene.add(root);
 const material=c=>new THREE.MeshStandardMaterial({color:c,roughness:.96});
 const mats=new Map();const box=(w,h,d,c,x,y,z)=>{if(!mats.has(c))mats.set(c,material(c));const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mats.get(c));m.position.set(x,y,z);m.receiveShadow=true;m.castShadow=true;root.add(m);return m;};
 const turf=box(220,.4,220,'#648a39',0,-.55,0);const texels=new Uint8Array(64*64*4);let seed=9127;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};for(let i=0;i<texels.length;i+=4){const v=180+random()*65;texels.set([v,v,v*.87,255],i);}const turfTexture=new THREE.DataTexture(texels,64,64);turfTexture.wrapS=turfTexture.wrapT=THREE.RepeatWrapping;turfTexture.repeat.set(55,55);turfTexture.needsUpdate=true;turf.material.map=turfTexture;
 box(29,.12,26,'#b79767',0,-.22,1);box(27,.08,24,'#d6bd87',0,-.14,1);for(let n=-13;n<14;n++)box(.018,.005,24,'#bba67a',n,-.095,1);for(let n=-11;n<14;n++)box(27,.005,.018,'#bba67a',0,-.095,n);
 // Stepping stones, low garden borders and a planted courtyard surround the cutaway.
 for(let n=0;n<12;n++)box(2.6,.07,1.05,n%2?'#d6bf8c':'#c4a476',3.8,-.25,14+n*1.28);
 for(const side of [-1,1]){box(1.55,.55,23,'#684529',side*15,.02,1);box(1.4,.04,22.8,'#4c3523',side*15,.315,1);}
 const leafMat=material('#487b37'),trunkMat=material('#765134');const leafGeo=new THREE.IcosahedronGeometry(1,1),stemGeo=new THREE.CylinderGeometry(.12,.19,2.9,7);
 for(const [x,z]of [[-19,-12],[19,-12],[-19,5],[19,7],[-14,21],[14,22],[-25,26],[28,30],[-27,-25],[28,-24]]){const trunk=new THREE.Mesh(stemGeo,trunkMat);trunk.position.set(x,1.05,z);root.add(trunk);for(let i=0;i<3;i++){const crown=new THREE.Mesh(leafGeo,leafMat);crown.scale.set(1.5+i*.25,1.7,1.5);crown.position.set(x+Math.sin(i*2)*.6,2.7+i*.55,z+Math.cos(i*2)*.5);crown.castShadow=true;root.add(crown);}}
 const grass=new THREE.InstancedMesh(new THREE.ConeGeometry(.11,.45,3),material('#91b64f'),500),stamp=new THREE.Object3D();let i=0;
 for(let n=0;i<500;n++){const x=random()*67-33.5,z=random()*65-30;if(Math.abs(x)<16.2&&z>-13&&z<14)continue;stamp.position.set(x,-.14,z);stamp.rotation.y=n;stamp.scale.setScalar(.7+(n%5)*.1);stamp.updateMatrix();grass.setMatrixAt(i++,stamp.matrix);}root.add(grass);
 const flowerMat=material('#ffd074'),flowerGeo=new THREE.IcosahedronGeometry(.12,0);for(const side of [-1,1])for(let n=0;n<28;n++){const m=new THREE.Mesh(flowerGeo,flowerMat);m.position.set(side*15+(n%3-1)*.3,.8,-9+n*.75);root.add(m);box(.035,.45,.035,'#447446',m.position.x,.56,m.position.z);}
 for(const [x,z]of [[-8,16],[8,16]]){box(3.1,.18,.85,'#986538',x,.4,z);for(const a of [-1,1])box(.15,.65,.7,'#2b4939',x+a*1.2,.03,z);box(3.1,.7,.12,'#ad7843',x,.9,z+.4);}
 scene.background=new THREE.Color(garage?'#2e4b39':'#9cbac5');
 root.userData.dispose=()=>{const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.isMesh){geometries.add(o.geometry);materials.add(o.material);}});geometries.forEach(g=>g.dispose());materials.forEach(m=>{m.map?.dispose();m.dispose();});scene.remove(root);};return root;
}
export function createHomeDesign({scene,room,floor,walls=[],garage=false}){
 const group=new THREE.Group();group.name='personal-home-design';room.add(group);
 const mats={};const box=(w,h,d,c,x,y,z,key)=>{const mat=new THREE.MeshStandardMaterial({color:c,roughness:.72});const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;group.add(m);if(key)(mats[key]??=[]).push(mat);return m;};
 let rug=null,art=null;const plants=new THREE.Group();group.add(plants);
 const positions=garage?[[-10.3,5.6],[10.3,4.7]]:[[-1.1,5.7],[9.6,-4.1]];
 for(const [x,z]of positions){const pot=box(.7,.6,.7,'#c0804e',x,.53,z);plants.attach(pot);for(let i=0;i<5;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.27,1.3,5),new THREE.MeshStandardMaterial({color:i%2?'#5d8c42':'#83b957',roughness:.92}));leaf.position.set(x+Math.sin(i*2)*.17,1.35+(i%2)*.22,z+Math.cos(i*2)*.17);leaf.rotation.z=Math.sin(i)*.2;plants.add(leaf);}}
 if(garage){
  box(9.1,.06,.14,'#9ee888',0,4.76,-7.72,'accent');
  for(const side of [-1,1]){for(let n=0;n<12;n++)box(.14,4.6,.15,'#b17949',side*(10.4-n*.24),3.65,-8.12,'wood');box(3.7,1.35,.08,'#2d5b48',side*7.9,3.6,-7.98,'wall');}
  for(const side of [-1,1])box(.11,.024,13,'#acdb86',side*10.8,.04,1,'accent');
 }else{
  rug=box(7.7,.018,5.7,'#cd9e62',-6,.41,3.7,'rug');
  for(let n=0;n<9;n++)box(7.45,.009,.055,'#f1d7a0',-6,.425,1.1+n*.62,'rugStripe');
  box(1.2,1.5,.08,'#72503c',.2,2.12,-7.8,'wood');
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=320;const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;art=new THREE.Mesh(new THREE.PlaneGeometry(1.04,1.34),new THREE.MeshStandardMaterial({map:texture}));art.position.set(.2,2.12,-7.75);group.add(art);
 }
 const lamp=new THREE.PointLight('#ffd294',garage?55:25,garage?22:12,2);lamp.position.set(garage?0:-5,garage?4.8:2.8,garage?2:5);scene.add(lamp);
 function paintArt(id,theme){if(!art)return;const c=art.material.map.image,ctx=c.getContext('2d');ctx.fillStyle='#efe3c2';ctx.fillRect(0,0,256,320);ctx.fillStyle=theme.fabric;
  if(id==='city'){for(let n=0;n<7;n++){const h=75+n*27%110;ctx.fillRect(n*38,260-h,32,h);}ctx.fillStyle='#e8ba55';ctx.beginPath();ctx.arc(175,75,35,0,Math.PI*2);ctx.fill();}
  else if(id==='records'){for(let n=0;n<3;n++){ctx.fillStyle=n%2?theme.fabric:'#213c37';ctx.beginPath();ctx.arc(128,65+n*90,40,0,Math.PI*2);ctx.fill();ctx.fillStyle='#e5b768';ctx.beginPath();ctx.arc(128,65+n*90,10,0,Math.PI*2);ctx.fill();}}
  else{ctx.strokeStyle='#466d39';ctx.lineWidth=7;ctx.beginPath();ctx.moveTo(128,285);ctx.lineTo(128,48);ctx.stroke();for(let n=0;n<6;n++){ctx.fillStyle=n%2?'#8caa54':'#527e42';ctx.beginPath();ctx.ellipse(128+(n%2?25:-25),75+n*32,35,14,n%2?-.5:.5,0,Math.PI*2);ctx.fill();}}
  art.material.map.needsUpdate=true;
 }
 function apply(raw,reward=false){const d=cleanDecor(raw),t=HOME_THEMES.find(t=>t.id===d.theme);
  walls.forEach(m=>m.material.color.set(garage?t.garage:t.wall));if(floor)floor.material.color.set(garage?({teal:'#2d645b',terracotta:'#97553d',midnight:'#293e5d'}[d.garageFloor]):({oak:'#d1ad76',walnut:'#8b5d39',sand:'#eee0b7'}[d.floor]));
  for(const [key,list]of Object.entries(mats))for(const m of list)m.color.set(key==='accent'?t.accent:key==='wall'?t.garage:key==='wood'?t.wood:key==='rug'?t.rug:'#eedeb2');
  if(rug){rug.visible=d.rug!=='none';group.children.filter(m=>m.material&&mats.rugStripe?.includes(m.material)).forEach(m=>m.visible=d.rug==='stripe');}
  plants.visible=d.plants&&reward;lamp.color.set({warm:'#ffd28e',mint:'#9effd4',rose:'#ffc2d6'}[d.lamp]);paintArt(d.art,t);
  room.traverse(o=>{if(!o.isMesh||group.getObjectById(o.id))return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(/^carpet/.test(m.name))m.color.set(t.fabric);});
 }
 return{apply,group,lamp};
}
