import * as THREE from './assets/three.module.js';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {BLOCKS,ROAD,RAMPS,LIMIT} from './driving.mjs?v=6';

const ASSETS=[...'abcdefghijklmn'].map(c=>'building-'+c).concat(['building-skyscraper-a','building-skyscraper-b','building-skyscraper-c','detail-parasol-a','detail-parasol-b']);
const models=new Map();
export async function loadCityPack(loader){await Promise.all(ASSETS.map(async name=>{const g=await loader.loadAsync('/assets/models/city/'+name+'.glb');g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});models.set(name,g.scene);}));}
export function buildCity(world){
 const stage=new THREE.Group();stage.name='Downtown';world.add(stage);
 const buildings=[],signals=[],materials=new Map(),buildingBounds=[],landmarkLights=[];
 function mat(color,extra={}){const key=color+JSON.stringify(extra);if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.88,...extra}));return materials.get(key);}
 function block(w,h,d,color,x,y,z,parent=stage,extra={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function ground(w,d,color,x,z,y=.025,parent=stage,extra={}){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(color,{side:THREE.DoubleSide,...extra}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 function pole(radius,height,color,x,y,z,parent=stage){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,6),mat(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 function label(text,w,h,x,y,z,ink='#ffe59b',bg='#1b2941',rotation=0,parent=stage){
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.max(128,Math.round(1024*h/w));const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);c.strokeStyle=ink;c.lineWidth=8;c.strokeRect(12,12,1000,canvas.height-24);c.textAlign='center';c.textBaseline='middle';c.fillStyle=ink;c.font=`700 ${Math.min(canvas.height*.62,1400/Math.max(1,text.length))}px PixelArcade,monospace`;c.fillText(text,512,canvas.height/2,960);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffffff',emissiveIntensity:.7,roughness:.75,side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;
 }
 function tree(x,z,height=4,parent=stage){
  block(2.1,.36,2.1,'#516877',x,.18,z,parent);block(1.8,.08,1.8,'#345f5c',x,.39,z,parent);pole(.14,height*.56,'#73554a',x,height*.28+.3,z,parent);
  const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),mat('#4c9c85'));m.position.set(x,height*.78,z);m.scale.set(height*.35,height*.52,height*.35);m.castShadow=true;parent.add(m);
  const upper=new THREE.Mesh(new THREE.IcosahedronGeometry(1,0),mat('#72b997'));upper.position.set(x-.2,height*.95,z+.15);upper.scale.set(height*.23,height*.3,height*.23);upper.castShadow=true;parent.add(upper);
 }
 function model(name,x,z,width,depth,maxHeight,rotation,parent,tint='#ffffff'){
  const source=models.get(name);if(!source)throw new Error('City model missing: '+name);
  const root=source.clone(true),wrap=new THREE.Group();wrap.add(root);root.rotation.y=rotation;
  root.updateMatrixWorld(true);const original=new THREE.Box3().setFromObject(root),size=original.getSize(new THREE.Vector3()),center=original.getCenter(new THREE.Vector3());
  const scale=Math.min(width/size.x,depth/size.z,maxHeight/size.y);root.scale.setScalar(scale);root.position.set(-center.x*scale,-original.min.y*scale,-center.z*scale);wrap.position.set(x,.22,z);parent.add(wrap);
  const copies=new Map();root.traverse(o=>{if(!o.isMesh)return;const convert=m=>{if(copies.has(m))return copies.get(m);const c=m.clone();if(c.name==='wall')c.color.set(tint);if(c.name==='glass'){c.emissive.set('#739de5');c.emissiveIntensity=.33;c.roughness=.28;}copies.set(m,c);return c;};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});
  wrap.updateMatrixWorld(true);return{root:wrap,box:new THREE.Box3().setFromObject(wrap),scale};
 }
 // A continuous road grid with raised curbs and clearly marked junctions.
 ground(500,500,'#234e67',0,0,-.7);block(208,.8,208,'#36516b',0,-.42,0);ground(206,206,'#27394c',0,0,.005);ground(208,43,'#516c78',0,-124,-.03);ground(43,250,'#516c78',124,-12,-.03);
 for(const road of ROAD){ground(206,11.8,'#2b3c50',0,road,.015);ground(11.8,206,'#2b3c50',road,0,.016);
  for(let n=-99;n<102;n+=4.5)if(ROAD.every(v=>Math.abs(v-n)>7)){ground(2.1,.13,'#e9d8a2',n,road,.028);ground(.13,2.1,'#e9d8a2',road,n,.029);}
 }
 for(const x of [-72,-36,0,36,72])for(const z of [-72,-36,0,36,72]){
  block(29.8,.24,29.8,'#87949f',x,.015,z);block(30,.2,.22,'#b7c2c9',x,.17,z-14.95);block(30,.2,.22,'#b7c2c9',x,.17,z+14.95);block(.22,.2,29.8,'#b7c2c9',x-14.95,.17,z);block(.22,.2,29.8,'#b7c2c9',x+14.95,.17,z);
  for(let n=-14;n<15;n+=2.5){ground(.027,29.5,'#677b8a',x+n,z,.14);ground(29.5,.027,'#677b8a',x,z+n,.141);}
 }
 ground(8,30,'#3b4d60',0,0,.15);ground(30,6,'#3b4d60',-36,36,.15);
 // Four zebra crossings and traffic signals make each intersection legible.
 for(const x of ROAD)for(const z of ROAD){
  for(const side of [-1,1])for(let n=-2;n<=2;n++){ground(.7,2.45,'#d7dfe0',x+n*1.17,z+side*4.8,.038);ground(2.45,.7,'#d7dfe0',x+side*4.8,z+n*1.17,.039);}
  for(const side of [-1,1]){ground(5.4,.19,'#e1e5de',x,z+side*6.6,.04);ground(.19,5.4,'#e1e5de',x+side*6.6,z,.041);}
  if(x!==ROAD[0]&&x!==ROAD.at(-1)&&z!==ROAD[0]&&z!==ROAD.at(-1))for(const side of [-1,1]){
   const px=x+side*4.1,pz=z+side*4.1;pole(.075,3.6,'#314255',px,1.8,pz);block(.43,1,.32,'#17283b',px,3.7,pz);
   const red=block(.22,.22,.035,'#7c454e',px,3.98,pz+.18,stage,{emissive:'#ff5573',emissiveIntensity:.12});const green=block(.22,.22,.035,'#437b6e',px,3.46,pz+.18,stage,{emissive:'#76f6be',emissiveIntensity:1.3});signals.push({red:red.material.clone(),green:green.material.clone(),phase:(x+z)/36});red.material=signals.at(-1).red;green.material=signals.at(-1).green;
  }
 }
 const designs=[
  {models:['j','f','b','i'],wall:'#f1dfc8',neon:'#ffe39a',height:17},
  {models:['l','m','a','g'],wall:'#f3d1c3',neon:'#ffb8a3',height:22},
  {models:['e','c','h','d'],wall:'#bde9d9',neon:'#8effc4',height:10},
  {models:['j','k','b','a'],wall:'#eac4d6',neon:'#ff8bd5',height:16},
  {models:['d','a'],wall:'#c4d9ee',neon:'#b8eaff',height:12},
  {models:['b','h'],wall:'#dac5e9',neon:'#c89aff',height:12},
  {models:['skyscraper-a','l','f','i'],wall:'#ccdbf4',neon:'#9dc8ff',height:24},
  {models:['c','e'],wall:'#efd59c',neon:'#ffe18a',height:8},
  {models:['k','h'],wall:'#bde0e1',neon:'#a6f7ef',height:9},
  {models:['e','j','c','f'],wall:'#efc7b7',neon:'#ffaf79',height:13},
  {models:['e','d','c','a'],wall:'#cdd3e6',neon:'#90f9d1',height:10}
 ];
 BLOCKS.forEach((b,i)=>{
  const theme=designs[i]||{models:b.district==='east'?['skyscraper-a','l','m','f']:b.district==='docks'?['e','j','k','n']:['a','g','i','c'],wall:b.color,neon:b.district==='docks'?'#a3ece9':b.district==='north'?'#ffdb91':'#ffd0a3',height:b.h},group=new THREE.Group();group.name=b.name;stage.add(group);
  if(b.park){
   block(b.w,.26,b.d,'#355f53',b.x,.2,b.z,group);ground(b.w-1.2,b.d-1.2,'#548465',b.x,b.z,.35,group);
   ground(3,b.d,'#c0b89b',b.x,b.z,.37,group);ground(b.w,3,'#c0b89b',b.x,b.z,.38,group);
   block(7,.5,7,'#8ea9a4',b.x,.55,b.z,group);block(6,.08,6,'#55a9b0',b.x,.83,b.z,group,{roughness:.22,metalness:.12});block(1.2,1.4,1.2,'#b7c4b1',b.x,1.1,b.z,group);
   for(const dx of [-8,8])for(const dz of [-8,8]){tree(b.x+dx,b.z+dz,4.5+(dx+dz)/25,group);block(3,.22,.7,'#c29b70',b.x+dx,.78,b.z+dz/2,group);for(const sign of [-1,1])block(.14,.7,.55,'#354956',b.x+dx+sign,.4,b.z+dz/2,group);}
   label(b.name,12,1.1,b.x,1.9,b.z+b.d/2+.2,'#d0edb8','#263e39',0,group);finishBlock(group);return;
  }
  // The solid podium marks the original collision footprint while the roofline varies.
  block(b.w,.25,b.d,'#4a6171',b.x,.25,b.z,group);
  const cols=b.w<10?1:2,rows=b.d<13?1:2,lw=b.w/cols,ld=b.d/rows,frontRoofs=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const k=row*cols+col,name='building-'+theme.models[k%theme.models.length],cx=b.x+(col-(cols-1)/2)*lw,cz=b.z+(row-(rows-1)/2)*ld;
   const built=model(name,cx,cz,lw-.35,ld-.35,theme.height-(k%3)*1.6,row===0?Math.PI:0,group,theme.wall);buildingBounds.push({name,bounds:built.box,block:b});if(row===rows-1)frontRoofs.push(built.box);
  }
  const front=b.z+b.d/2+.22,back=b.z-b.d/2-.22,signWidth=Math.min(b.w-1,16),height=i===10?3.8:3.4;
  for(const [z,rot]of [[front,0],[back,Math.PI]]){
   const direction=rot===0?1:-1;
   block(signWidth+.3,1.2,.34,'#213246',b.x,height+.1,z,group);
   label(b.name,signWidth,1.03,b.x,height+.1,z+direction*.19,theme.neon,'#1a2a3c',rot,group);
   for(const side of [-1,1])block(.2,height+.4,.2,'#d4c7ad',b.x+side*(signWidth/2),height/2,z,group);
   if(!['east','docks'].includes(b.district)){const awningZ=z+direction*.7;for(let j=0;j<Math.floor(signWidth/.8);j++)block(.77,.15,1.1,j%2?theme.neon:'#e3e2cb',b.x-signWidth/2+.4+j*.8,height-.65,awningZ,group);}
  }
  if([3,5,6,7].includes(i)||b.district==='docks'){const side=b.x<0?-1:1;label(b.name,Math.min(b.d-2,13),1.2,b.x+side*(b.w/2+.2),4.8,b.z,theme.neon,'#1d2e40',side*Math.PI/2,group);}
  const fenceZ=b.z+b.d/2+1.05;for(const side of [-1,1])tree(b.x+side*(b.w/2-1.25),fenceZ,3+(i%3)*.35,group);
  if([2,7,9].includes(i)){
   for(const side of [-1,1])model('detail-parasol-'+(i===9?'b':'a'),b.x+side*3.4,b.z+b.d/2+1.05,2.6,2.6,3.2,0,group);
  }
  // Roof signs identify the dangerous pickups from a distance.
  if([0,3,5,6,9,10].includes(i)){
   const text=['BANK','','','MOTEL','','ARCADE','HOTEL','','','DINER','LAST EXIT'][i],y=Math.max(...frontRoofs.map(roof=>roof.max.y))+1.35,roofZ=b.z+(rows-1)*ld/2;
   block(Math.min(11,b.w),2.2,.25,'#22324c',b.x,y,roofZ,group);label(text,Math.min(10.6,b.w-.3),1.7,b.x,y,roofZ+.15,theme.neon,'#22324c',0,group);
   for(const x of [b.x-3,b.x+3]){const roof=frontRoofs.find(box=>x>=box.min.x&&x<=box.max.x)||frontRoofs[0],bottom=roof.max.y-.25,top=y-.6;block(.16,top-bottom,.16,'#3b5066',x,(top+bottom)/2,roofZ,group);}
  }
  if([2,3,5,9,10].includes(i)){const light=new THREE.PointLight(theme.neon,23,13,2);light.position.set(b.x,3,front+2);stage.add(light);landmarkLights.push(light);}
  finishBlock(group);
 });
 // Last Exit's garage door, repair canopy, and apron create a recognisable home base.
 block(8,3.5,.22,'#101f32',36,1.9,45.1);for(let n=0;n<8;n++)block(7.7,.045,.05,'#526b80',36,.45+n*.43,45.24);
 for(const x of [31.75,40.25])block(.18,4.4,.22,'#a4fadc',x,2.2,45.3,stage,{emissive:'#72edc1',emissiveIntensity:.8});
 label('REPAIRS / CASH OUT',9,.7,36,4.2,45.5,'#a4fadc');ground(9,7,'#405c67',36,49,.145);
 for(const x of [31.5,40.5])ground(.16,8.5,'#acdfc8',x,49.6,.16);for(let n=0;n<5;n++)ground(.85,.15,'#d9d893',32+n*2,53.1,.161);
 // Street lamps sit on the pavement; their pools stay clear of route arrows.
 for(const x of [-86,-50,-22,14,50,86])for(const z of [-82,-46,-26,10,46,82]){
  pole(.075,4.8,'#3b5267',x,2.4,z);block(.95,.1,.12,'#40566e',x+.4,4.82,z);block(.72,.12,.42,'#b0c1c9',x+.62,4.73,z);block(.6,.025,.33,'#ffeab7',x+.62,4.65,z,stage,{emissive:'#ffe2a1',emissiveIntensity:1.3});
  const glow=new THREE.Mesh(new THREE.CircleGeometry(2.5,20),new THREE.MeshBasicMaterial({color:'#ffe3a7',transparent:true,opacity:.065,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.set(x+.7,.17,z);stage.add(glow);
 }
 for(const x of [-98,98])for(let z=-84;z<=85;z+=7){ground(3,.12,'#91a7bb',x,z,.04);ground(.12,3,'#91a7bb',x+(x<0?-1.5:1.5),z+1.5,.04);}
 // A distant skyline and waterfront replace the empty background plane.
 for(let i=0;i<15;i++){const x=-105+i*15;model('building-skyscraper-'+['a','b','c'][i%3],x,-126,11,12,26+(i*7%19),i%2?Math.PI:0,stage,['#becfe5','#b5b6d2','#e3c3c5'][i%3]);}
 for(let i=0;i<10;i++)model('building-'+['f','l','n'][i%3],126,-90+i*21,13,15,20+(i%3)*4,-Math.PI/2,stage,'#aebed5');
 for(let i=0;i<39;i++){block(.16,1.15,.16,'#7493a8',-103.3,.65,-100+i*5.3);if(i<38)block(.1,.12,5.3,'#7493a8',-103.3,1.12,-97.35+i*5.3);}
 ground(6,209,'#78909c',-105.9,0,-.01);for(let i=0;i<5;i++)ground(2,13,'#719bbc',-116-i*11,-42+i*19,-.675,stage,{transparent:true,opacity:.22});
 for(const r of RAMPS){const hw=r.w/2,hd=r.d/2,a=(1-r.dir)*r.h/2,b=(1+r.dir)*r.h/2;const points=r.axis==='x'?[[-hw,0,-hd],[-hw,0,hd],[hw,r.h,hd],[hw,r.h,-hd]]:[[-hw,a,-hd],[hw,a,-hd],[hw,b,hd],[-hw,b,hd]],v=[];for(const i of [0,1,2,0,2,3])v.push(...points[i]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat('#d2a26c',{side:THREE.DoubleSide}));m.position.set(r.x,.08,r.z);m.receiveShadow=true;stage.add(m);}
 // The outer map adds a waterfront promenade, docks, and a lit arcade gateway.
 for(const z of [-75,-24,27,78]){
  block(18,.65,4.4,'#8d8972',-114,-.1,z);for(let n=0;n<12;n++)ground(.045,4.3,'#5a685f',-122+n*1.45,z,.235);
  for(const x of [-121,-113])for(const edge of [-1,1])pole(.2,2.1,'#41595b',x,.4,z+edge*2.4);
  for(const x of [-117,-111]){block(3,.7,2.4,'#425569',x,.55,z);block(2.5,.18,2,'#ca9f6c',x,1,z);}
 }
 for(const z of [-86,-50,-14,22,58,94]){tree(-99,z,3.9);block(.65,1.35,.65,'#c6dacc',-101,1,z,stage,{emissive:'#fce4ab',emissiveIntensity:.6});}
 for(const x of [-4.4,4.4]){block(.24,7.6,.28,'#374866',x,3.8,-9);block(.13,6.2,.31,'#c291ff',x,4,-9,stage,{emissive:'#a674ff',emissiveIntensity:.75});}
 block(9,1,.38,'#362749',0,7.6,-9);label('NEON ROW',8.6,.82,0,7.6,-8.79,'#e1b7ff','#362749');
 for(let n=0;n<9;n++){const x=26+n*2.5;block(.24,.3,.24,n%2?'#ffeea5':'#b0f8db',x,4.8,-48.5,stage,{emissive:n%2?'#ffd279':'#76e8c3',emissiveIntensity:1});}
 label('STARLIGHT',14,2.1,36,5.7,-84.8,'#ffe0a0','#63354e',Math.PI);
 for(const x of [28.7,43.3])for(let y=4.8;y<7;y+=.5)block(.16,.16,.12,'#fff0b9',x,y,-84.9,stage,{emissive:'#ffc879',emissiveIntensity:1});
 function finishBlock(group){group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group);batch(group);const copies=new Map();group.traverse(o=>{if(!o.isMesh)return;const unique=m=>{if(!copies.has(m)){const c=m.clone();c.transparent=true;copies.set(m,c);}return copies.get(m);};o.material=Array.isArray(o.material)?o.material.map(unique):unique(o.material);});buildings.push({group,box:bounds,materials:[...copies.values()]});}
 // Batch only fixed meshes. Signals and each fading block keep their own materials.
 stage.updateMatrixWorld(true);
 function batch(parent){
  const entries=new Map(),inverse=parent.matrixWorld.clone().invert();parent.traverse(o=>{if(!o.isMesh||o.material.map||o.material.transparent||Array.isArray(o.material)||signals.some(s=>s.red===o.material||s.green===o.material))return;const material=o.material,key=JSON.stringify([material.type,material.color.toArray(),material.emissive?.toArray(),material.emissiveIntensity,material.roughness,material.metalness,material.side,material.vertexColors,material.flatShading,material.depthWrite,material.depthTest]);const a=entries.get(key)||{material:o.material,objects:[],geos:[]};const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));g.deleteAttribute('uv');if(!g.getAttribute('color')){const colors=new Float32Array(g.attributes.position.count*3).fill(1);g.setAttribute('color',new THREE.BufferAttribute(colors,3));}a.geos.push(g);a.objects.push(o);entries.set(key,a);});
  for(const a of entries.values()){if(a.objects.length<2){a.geos.forEach(g=>g.dispose());continue;}const geo=mergeGeometries(a.geos,false);a.geos.forEach(g=>g.dispose());if(!geo)continue;const m=new THREE.Mesh(geo,a.material);m.castShadow=true;m.receiveShadow=true;for(const o of a.objects)o.removeFromParent();parent.add(m);}
 }
 // Imported block geometry remains individually fadeable; shared static street meshes batch together.
 batch(stage);
 return{buildings,buildingBounds,stage,landmarkLights,update(time){for(const s of signals){const go=Math.sin(time*.28+s.phase)>0;s.green.emissiveIntensity=go?1.5:.06;s.red.emissiveIntensity=go?.06:1.5;}}};
}
