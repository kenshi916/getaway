import * as THREE from './assets/three.module.js';
import {createCityLandscape} from './city-landscape.js?v=24';
import {mergeGeometries} from './assets/BufferGeometryUtils.js';
import {BLOCKS,ROAD,RAMPS,LIMIT,districtAt} from './driving.mjs?v=24';

const ASSETS=[...'abcdefghijklmn'].map(c=>'building-'+c).concat(['building-skyscraper-a','building-skyscraper-b','building-skyscraper-c','detail-parasol-a','detail-parasol-b'],[...'abfgkqrt'].map(c=>'industrial/building-'+c),['water-tower','shipping-container-a','shipping-container-b','solar-panel-landscape-group','detail-tank'].map(n=>'industrial/'+n),[...'acfgkmoq'].map(c=>'suburban/building-type-'+c),['tree_oak','tree_detailed','tree_palmDetailedTall','plant_bushDetailed','flower_redA'].map(n=>'nature/'+n));
const models=new Map();
export async function loadCityPack(loader){await Promise.all(ASSETS.map(async name=>{const g=await loader.loadAsync('/assets/models/city/'+name+'.glb');g.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;}});models.set(name,g.scene);}));}
export function buildCity(world){
 const stage=new THREE.Group();stage.name='Downtown';world.add(stage);
 const buildings=[],signals=[],materials=new Map(),buildingBounds=[],landmarkLights=[],fountainRings=[],usedAssets=new Set(),signMaterials=new Map();
 function mat(color,extra={}){const key=color+JSON.stringify(Object.fromEntries(Object.entries(extra).map(([k,v])=>[k,v?.isTexture?v.uuid:v])));if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness:.88,...extra}));return materials.get(key);}
 function block(w,h,d,color,x,y,z,parent=stage,extra={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,extra));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
 function ground(w,d,color,x,z,y=.025,parent=stage,extra={}){const geo=new THREE.PlaneGeometry(w,d);if(extra.map){const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)*w/6,uv.getY(i)*d/6);}const m=new THREE.Mesh(geo,mat(color,{side:THREE.DoubleSide,...extra}));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;parent.add(m);return m;}
 function pole(radius,height,color,x,y,z,parent=stage){const m=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,6),mat(color));m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;}
 function label(text,w,h,x,y,z,ink='#ffe59b',bg='#1b2941',rotation=0,parent=stage){
  const key=[text,Math.round(w/h*2),ink,bg].join('|');let material=signMaterials.get(key);
  if(!material){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=Math.max(64,Math.round(512*h/w));const c=canvas.getContext('2d');c.fillStyle=bg;c.fillRect(0,0,canvas.width,canvas.height);c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(7,7,498,canvas.height-14);c.textAlign='center';c.textBaseline='middle';c.fillStyle=ink;c.font=`700 ${Math.min(canvas.height*.62,720/Math.max(1,text.length))}px PixelArcade,monospace`;c.fillText(text,256,canvas.height/2,476);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.magFilter=THREE.LinearFilter;material=new THREE.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffffff',emissiveIntensity:.45,roughness:.75,side:THREE.DoubleSide});signMaterials.set(key,material);}
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);m.position.set(x,y,z);m.rotation.y=rotation;parent.add(m);return m;
 }
 function lamp(x,z,parent){pole(.065,4.65,'#304751',x,2.33,z,parent);block(.9,.11,.15,'#304751',x+.34,4.68,z,parent);block(.72,.14,.4,'#ced3bb',x+.56,4.57,z,parent);block(.57,.026,.29,'#fff0bd',x+.56,4.49,z,parent,{emissive:'#ffe3a0',emissiveIntensity:1.5});}
 function blockSeed(x,z){let v=(Math.imul(Math.round(x/36)+193,73856093)^Math.imul(Math.round(z/36)+397,19349663))>>>0;v=Math.imul(v^(v>>>16),0x45d9f3b);return (v^(v>>>16))>>>0;}
 function bin(x,z,parent){block(.58,.82,.58,'#2d5753',x,.81,z,parent);block(.66,.08,.66,'#668979',x,1.26,z,parent);block(.3,.15,.02,'#122f36',x,1.06,z+.3,parent);}
 function roofDetail(box,seed,parent){const x=(box.min.x+box.max.x)/2,z=(box.min.z+box.max.z)/2,w=box.max.x-box.min.x,d=box.max.z-box.min.z;if(w<4||d<4)return;const y=box.max.y;block(1.9,.7,1.1,'#769099',x,y+.35,z,parent);block(2,.1,1.2,'#b6c2b7',x,y+.75,z,parent);for(let n=0;n<5;n++)block(.04,.45,1.12,'#3e5a62',x-.73+n*.36,y+.35,z,parent);if(seed%3===0){pole(.035,2.8,'#71858b',x+w*.23,y+1.4,z,parent);for(const dy of [.8,1.4,2])block(1.2,.04,.04,'#869ca1',x+w*.23,y+dy,z,parent);}else if(seed%3===1&&w>6){const prop=model('industrial/water-tower',x-w*.2,z+d*.15,2.3,2.3,2.7,0,parent);prop.root.position.y=y+.05;}else if(seed%3===2&&w>6){const prop=model('industrial/solar-panel-landscape-group',x-w*.2,z+d*.15,2.7,2.3,1.1,0,parent);prop.root.position.y=y+.05;}}
 function tree(x,z,height=4,parent=stage,palm=false){
  block(2,.35,2,'#a8a698',x,.28,z,parent);block(1.72,.06,1.72,'#49473b',x,.48,z,parent);
  const name=palm?'tree_palmDetailedTall':Math.abs(Math.round(x+z))%2?'tree_oak':'tree_detailed';
  const built=model('nature/'+name,x,z,height*.9,height*.9,height,Math.sin(x+z)*Math.PI,parent);built.root.position.y=.51;
 }
 function bench(x,z,rot=0,parent=stage){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rot;parent.add(g);
  for(const x of [-1,1]){block(.13,.65,.76,'#293f47',x,.5,0,g);block(.14,1.25,.12,'#293f47',x,.9,-.34,g);}
  for(let n=0;n<4;n++)block(2.6,.12,.15,'#b98b5c',0,.84,-.27+n*.18,g);
  for(let n=0;n<3;n++)block(2.6,.16,.12,'#bb946b',0,1.08+n*.19,-.37,g);
 }
 function storefront(box,name,theme,front,parent,variant=0){
  const width=Math.min(10,(box.max.x-box.min.x)*.86),x=(box.min.x+box.max.x)/2,z=front?box.max.z+.06:box.min.z-.06,dir=front?1:-1,top=Math.min(3.35,box.max.y-.3);
  if(top<2.4)return;
  block(width+.24,top-.4,.12,'#263b43',x,(top+.4)/2,z,parent);
  const panes=3,pane=width/panes;
  for(let k=0;k<panes;k++){
   const px=x-width/2+pane*(k+.5),warm=(k+variant)%3!==0;
   block(pane-.15,top-1.05,.055,warm?'#dbb67c':'#577d89',px,(top-.2)/2+.1,z+dir*.08,parent,{emissive:warm?'#e4aa66':'#4d91a7',emissiveIntensity:warm?.2:.1,roughness:.3,metalness:.18});
   block(.055,top-.92,.085,'#e6d8b9',px-pane/2+.04,(top+.05)/2,z+dir*.14,parent);
   block(pane-.1,.12,.18,'#d2c6aa',px,.38,z+dir*.1,parent);
   if(k===2){block(.08,.48,.1,'#f4dfae',px+pane*.26,1.27,z+dir*.19,parent);block(pane-.2,.065,.1,'#293e46',px,1.98,z+dir*.15,parent);}
   else{block(pane*.75,.32,.18,'#41575b',px,.8,z+dir*.16,parent);for(let n=0;n<3;n++)block(.28,.22+(n%2)*.12,.12,['#d78365','#96ac86','#ead4a0'][n],px+(.35-n*.35),1.04,z+dir*.2,parent);}
  }
  block(width+.34,.77,.22,theme.sign||'#283f47',x,top+.25,z+dir*.12,parent);
  label(name,width,.66,x,top+.25,z+dir*.245,theme.neon,theme.sign||'#283f47',front?0:Math.PI,parent);
  const pieces=Math.ceil(width/.58);for(let n=0;n<pieces;n++)block(width/pieces-.018,.13,1.08,n%2?'#e7ddc3':theme.awning||theme.neon,x-width/2+(n+.5)*width/pieces,top-.2,z+dir*.61,parent);
  block(width,.22,.09,theme.awning||theme.neon,x,top-.34,z+dir*1.11,parent);
 }
 function model(name,x,z,width,depth,maxHeight,rotation,parent,tint='#ffffff'){
  const source=models.get(name);if(!source)throw new Error('City model missing: '+name);
  usedAssets.add(name);
  const root=source.clone(true),wrap=new THREE.Group();wrap.add(root);root.rotation.y=rotation;
  root.updateMatrixWorld(true);const original=new THREE.Box3().setFromObject(root),size=original.getSize(new THREE.Vector3()),center=original.getCenter(new THREE.Vector3());
  const scale=Math.min(width/size.x,depth/size.z,maxHeight/size.y);root.scale.setScalar(scale);root.position.set(-center.x*scale,-original.min.y*scale,-center.z*scale);wrap.position.set(x,.22,z);parent.add(wrap);
  const copies=new Map();root.traverse(o=>{if(!o.isMesh)return;const convert=m=>{if(copies.has(m))return copies.get(m);const c=m.clone();if(c.name==='wall'){c.color.set(tint);c.userData.facadeKind=name.includes('skyscraper')?2:1;}if(c.name==='glass'){c.emissive.set(Math.abs(Math.round(x+z))%3?'#eac390':'#709bab');c.emissiveIntensity=.22;c.roughness=.28;}if(c.name==='leafsGreen')c.color.set('#63946e');if(c.name==='woodBark')c.color.set('#795947');copies.set(m,c);return c;};o.material=Array.isArray(o.material)?o.material.map(convert):convert(o.material);});
  wrap.updateMatrixWorld(true);return{root:wrap,box:new THREE.Box3().setFromObject(wrap),scale};
 }
 const landscape=createCityLandscape({block,ground});
 // A continuous road grid with raised curbs and clearly marked junctions.
 const grain=new Uint8Array(64*64*4);let seed=31691;for(let i=0;i<grain.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=215+(seed%30);grain.set([v,v,v,255],i);}const asphalt=new THREE.DataTexture(grain,64,64);asphalt.colorSpace=THREE.SRGBColorSpace;asphalt.wrapS=asphalt.wrapT=THREE.RepeatWrapping;asphalt.magFilter=THREE.LinearFilter;asphalt.needsUpdate=true;
 ground(1000,1000,'#2e6174',0,0,-.7);block(LIMIT*2+4,.8,LIMIT*2+4,'#3c5865',0,-.42,0);ground(LIMIT*2+2,LIMIT*2+2,'#303b46',0,0,.005);ground(LIMIT*2+4,43,'#6f7f83',0,-LIMIT-22,-.03);ground(43,LIMIT*2+46,'#6f7f83',LIMIT+22,-12,-.03);
 for(const road of ROAD){ground(LIMIT*2+2,11.8,'#424b55',0,road,.015,stage,{map:asphalt,roughness:.95});ground(11.8,LIMIT*2+2,'#424b55',road,0,.016,stage,{map:asphalt,roughness:.95});
  for(let n=-LIMIT+3;n<LIMIT;n+=4.5)if(ROAD.every(v=>Math.abs(v-n)>7)){for(const side of [-1,1]){ground(2.6,.075,'#cfb778',n,road+side*.13,.028);ground(.075,2.6,'#cfb778',road+side*.13,n,.029);}}
 }
 for(const x of ROAD.slice(0,-1).map(n=>n+18))for(const z of ROAD.slice(0,-1).map(n=>n+18)){
  block(29.8,.24,29.8,'#a9aaa1',x,.015,z);block(30,.2,.22,'#d3d0bd',x,.17,z-14.95);block(30,.2,.22,'#d3d0bd',x,.17,z+14.95);block(.22,.2,29.8,'#d3d0bd',x-14.95,.17,z);block(.22,.2,29.8,'#d3d0bd',x+14.95,.17,z);
  for(let n=-14;n<15;n+=2.5){ground(.022,29.5,'#8c918b',x+n,z,.14);ground(29.5,.022,'#8c918b',x,z+n,.141);}
  for(const edge of [-1,1])for(let n=-8;n<=8;n+=8){ground(.5,.8,'#49585d',x+edge*14.68,z+n,.275);for(let s=0;s<4;s++)ground(.32,.035,'#a7afa5',x+edge*14.68,z+n-.25+s*.16,.28);}
 }
 ground(8,30,'#3b4d60',0,0,.15);ground(30,6,'#3b4d60',-36,36,.15);
 // Four zebra crossings and traffic signals make each intersection legible.
 for(const x of ROAD)for(const z of ROAD){
  for(const side of [-1,1])for(let n=-2;n<=2;n++){ground(.7,2.45,'#d7dfe0',x+n*1.17,z+side*4.8,.038);ground(2.45,.7,'#d7dfe0',x+side*4.8,z+n*1.17,.039);}
  for(const side of [-1,1]){ground(5.4,.19,'#e1e5de',x,z+side*6.6,.04);ground(.19,5.4,'#e1e5de',x+side*6.6,z,.041);}
  if(x!==ROAD[0]&&x!==ROAD.at(-1)&&z!==ROAD[0]&&z!==ROAD.at(-1))for(const side of [-1,1]){
   const px=x+side*4.1,pz=z+side*4.1;pole(.075,3.6,'#314255',px,1.8,pz);block(.43,1,.32,'#17283b',px,3.7,pz);
   signals.push({x:px,z:pz,phase:(x+z)/36,go:null});
  }
 }
 const designs=[
  {models:['j','f','b','i'],wall:'#e4d3af',neon:'#ffe4a3',awning:'#446a65',height:17},
  {models:['l','m','a','g'],wall:'#d9ad92',neon:'#ffe0c5',awning:'#9f5849',height:22},
  {models:['e','c','h','d'],wall:'#b3d0b6',neon:'#d5ecbd',awning:'#427565',height:10},
  {models:['j','k','b','a'],wall:'#cd8e7c',neon:'#ffceb9',awning:'#8e5c68',height:16},
  {models:['d','a'],wall:'#c4d9ee',neon:'#b8eaff',height:12},
  {models:['b','h'],wall:'#dac5e9',neon:'#c89aff',height:12},
  {models:['skyscraper-a','l','f','i'],wall:'#ccdbf4',neon:'#9dc8ff',height:24},
  {models:['c','e'],wall:'#efd59c',neon:'#ffe18a',height:8},
  {models:['k','h'],wall:'#bde0e1',neon:'#a6f7ef',height:9},
  {models:['e','j','c','f'],wall:'#e8c5a1',neon:'#ffe3b3',awning:'#ab5644',height:13},
  {models:['e','d','c','a'],wall:'#cdd3e6',neon:'#90f9d1',height:10}
 ];
 BLOCKS.forEach((b,i)=>{
  const theme=designs[i]||{models:b.district==='east'?['skyscraper-a','l','m','f']:b.district==='docks'?['e','j','k','n']:['a','g','i','c'],wall:b.color,neon:b.district==='docks'?'#a3ece9':b.district==='north'?'#ffdb91':'#ffd0a3',height:b.h},group=new THREE.Group();group.name=b.name;stage.add(group);
  if(b.outer){
   const area=districtAt(b),v=blockSeed(b.x,b.z),industrial=area.type==='industrial',residential=['residential','garden'].includes(area.type),palette=industrial?['#738d94','#a9937e','#648181','#899a9d']:residential?['#d8c5a5','#a4bfaa','#c0c7d2','#cb9b87']:['#d9bea3','#b8c9ce','#d0ac9e','#c1c3af'],wall=palette[v%palette.length];
   const names=industrial?[...'abfgkqrt'].map(n=>'industrial/building-'+n):residential?[...'acfgkmoq'].map(n=>'suburban/building-type-'+n):(v%4===0?['building-skyscraper-a','building-skyscraper-b','building-skyscraper-c']:['building-j','building-f','building-l','building-m','building-i','building-k','building-n','building-b']);
   block(b.w,.24,b.d,b.park?'#526d48':residential?'#688457':industrial?'#626f74':'#7f8780',b.x,.23,b.z,group);
   if(b.park||residential)landscape.lawn(b,group);
   if(b.park){
    ground(2.3,25,'#d0c4a2',b.x,b.z,.39,group,{map:landscape.pathTexture});ground(25,2.3,'#d0c4a2',b.x,b.z,.4,group,{map:landscape.pathTexture});
    for(const dx of [-8.5,8.5])for(const dz of [-8.5,8.5]){tree(b.x+dx,b.z+dz,5+(v%4),group,area.type==='garden');model('nature/plant_bushDetailed',b.x+dx*.65,b.z+dz,2.6,1.9,1.5,0,group);}
    bench(b.x-4,b.z+3,0,group);bench(b.x+4,b.z-3,Math.PI,group);pole(1.3,.42,'#a9b2a1',b.x,.6,b.z,group);pole(1.1,.07,'#76adb0',b.x,.86,b.z,group);
   }else if(residential){
    for(let k=0;k<2;k++){const cx=b.x+(k-.5)*12.2,cz=b.z-1.6,name=names[(v+k*3)%names.length],built=model(name,cx,cz,10.3,17,7.2+(v%3)*.7,0,group,palette[(v+k)%4]);buildingBounds.push({name,bounds:built.box,block:b});ground(1.35,Math.max(1,12-(built.box.max.z-b.z)),'#d2c4a9',cx,(built.box.max.z+b.z+12)/2,.39,group);model('nature/plant_bushDetailed',cx-3.5,b.z+9.7,3.2,1.4,1.05,0,group);for(const side of [-1,1]){block(3.4,.64,.13,'#ded3b5',cx+side*2.5,.7,b.z+12,group);for(let n=0;n<5;n++)block(.1,.87,.17,'#e8dfc6',cx+side*2.5-1.4+n*.7,.85,b.z+12,group);}label(String(200+(v%600)+k),.72,.37,cx,1.6,built.box.max.z+.06,'#ffdfa4','#314a49',0,group);}
    tree(b.x-10.9,b.z-10.5,5.3,group,area.type==='garden');
   }else if(industrial){
    for(let k=0;k<2;k++){const cx=b.x+(k-.5)*12.2,name=names[(v+k*3)%names.length],built=model(name,cx,b.z-3.8,11.5,16.3,7.5+(v%3),0,group,wall);buildingBounds.push({name,bounds:built.box,block:b});label(k?'SERVICE BAY':'MOTOR WORKS',8,.8,cx,3,built.box.max.z+.08,'#f8dfaa','#334b52',0,group);if(k===0)roofDetail(built.box,v,group);}
    const cargo=model('industrial/shipping-container-'+(v%2?'a':'b'),b.x-5,b.z+9.6,6.2,2.7,2.6,0,group);if(v%3===0){const second=model('industrial/shipping-container-b',b.x-4.7,b.z+9.6,6.2,2.7,2.6,0,group);second.root.position.y=cargo.box.max.y+.05;}
    for(let n=0;n<5;n++){ground(.12,4.3,'#cfb577',b.x+2+n*1.7,b.z+9.5,.39,group);block(.17,.8,.17,'#e3b553',b.x-11+n*.7,.75,b.z+12,group);}bin(b.x+10.8,b.z-10.5,group);
   }else{
    const count=v%4===0?2:4,cols=2,rows=count/2,local={neon:['#ffd6a3','#b2f1df','#ffb699','#b8d3ff'][v%4],awning:['#925a48','#446c62','#a16b58','#4c667e'][v%4],sign:'#243c46'};
    for(let k=0;k<count;k++){const col=k%2,row=Math.floor(k/2),cx=b.x+(col-.5)*12.7,cz=b.z+(rows===1?0:(row-.5)*12.4),name=names[(v+k*5)%names.length],built=model(name,cx,cz,12.1,rows===1?22.7:11.7,rows===1?23+(v%10):10+(v%7)+(k%3)*3,rows===2&&row===0?Math.PI:0,group,palette[(v+k)%4]);buildingBounds.push({name,bounds:built.box,block:b});
     storefront(built.box,['NIGHT COFFEE','CORNER MART','VINYL & TAPES','NOODLE HOUSE','LATE CHECKOUT','MOTOR SUPPLY','BLUE ROOM','OPEN LATE'][(v+k)%8],local,rows===1||row===1,group,v+k);if(rows===1)storefront(built.box,'DAY & NIGHT',local,false,group,v+k);roofDetail(built.box,v+k,group);
    }
   }
   // Street furniture stays inside the sidewalk walking lane at ±14.1.
   lamp(b.x-11.8,b.z+11.8,group);if(v%3===0){bench(b.x+7,b.z+12.15,0,group);bin(b.x+10.9,b.z+12.1,group);}else if(v%3===1&&!industrial)model('nature/plant_bushDetailed',b.x+10.6,b.z-11.4,2.5,1.35,1.1,0,group);
   if(b.x===area.x&&b.z===area.z){for(const dx of [-4.2,4.2])pole(.055,2.9,'#3f5962',b.x+dx,1.65,b.z-13.04,group);label(area.name,9,.72,b.x,2.85,b.z-13.12,area.color,'#172b37',Math.PI,group);}
   landscape.dress(b,group,b.park?'park':residential?'residential':industrial?'industrial':'commercial',v,buildingBounds.filter(item=>item.block===b).map(item=>item.bounds));
   finishBlock(group);return;
  }
  const industrial=[10,11,16,18,19,24,25].includes(i),residential=[21,22,23,26].includes(i);
  const factoryModels=['a','b','f','g','k','q','r','t'],houseModels=['a','c','f','g','k','m','o','q'];
  if(b.park){
   block(b.w,.26,b.d,'#465e49',b.x,.2,b.z,group);landscape.lawn(b,group);
   ground(3,b.d,'#c8b99a',b.x,b.z,.39,group,{map:landscape.pathTexture});ground(b.w,3,'#c8b99a',b.x,b.z,.4,group,{map:landscape.pathTexture});
   pole(3.8,.38,'#b7b4a1',b.x,.58,b.z,group);pole(3.2,.08,'#599b9e',b.x,.82,b.z,group);pole(.6,1.5,'#bfc4b0',b.x,1.46,b.z,group);pole(1.55,.2,'#c5c5b0',b.x,2.05,b.z,group);pole(1.37,.06,'#79b9bb',b.x,2.17,b.z,group);pole(.22,.72,'#d7cfb1',b.x,2.5,b.z,group);
   for(let n=0;n<3;n++){const ring=new THREE.Mesh(new THREE.RingGeometry(.82,1,32),new THREE.MeshBasicMaterial({color:'#c8eeee',transparent:true,opacity:.3,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.set(b.x,.867,b.z);group.add(ring);fountainRings.push({mesh:ring,phase:n/3});}
   for(const dx of [-8,8])for(const dz of [-8,8]){
    tree(b.x+dx,b.z+dz,5.8+(dx+dz)/25,group);bench(b.x+dx*.8,b.z+dz*.5,dx<0?Math.PI/2:-Math.PI/2,group);
    model('nature/plant_bushDetailed',b.x+dx*.65,b.z+dz,2.4,1.7,1.4,0,group);
    for(let n=0;n<3;n++)model('nature/flower_redA',b.x+dx*.4+(n-1)*.5,b.z+dz*.9,.75,.75,.95,n,group);
   }
   label(b.name,8,.8,b.x,1.2,b.z+b.d/2-.7,'#e3e6bd','#314d43',0,group);landscape.dress(b,group,'park',blockSeed(b.x,b.z));finishBlock(group);return;
  }
  // The solid podium marks the original collision footprint while the roofline varies.
  block(b.w,.25,b.d,residential?'#6c845b':industrial?'#72797a':'#797f7b',b.x,.25,b.z,group);if(residential)landscape.lawn(b,group);
  const cols=b.w<10?1:2,rows=b.d<13?1:2,lw=b.w/cols,ld=b.d/rows,frontRoofs=[];
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   const k=row*cols+col,name=industrial?'industrial/building-'+factoryModels[(i===10?4+k:i+k)%factoryModels.length]:residential?'suburban/building-type-'+houseModels[(i+k)%houseModels.length]:'building-'+theme.models[k%theme.models.length],cx=b.x+(col-(cols-1)/2)*lw,cz=b.z+(row-(rows-1)/2)*ld;
   const built=model(name,cx,cz,lw-(residential?1.7:.35),ld-(residential?2:.35),industrial?Math.min(theme.height,11):residential?8.5:theme.height-(k%3)*1.6,row===0?Math.PI:0,group,theme.wall);buildingBounds.push({name,bounds:built.box,block:b});if(row===rows-1)frontRoofs.push(built.box);
   ground(built.box.max.x-built.box.min.x+.15,built.box.max.z-built.box.min.z+.15,'#374248',cx,cz,.382,group);
   if(residential){
    const front=row!==0,edge=front?built.box.max.z:built.box.min.z,direction=front?1:-1;
    ground(1.1,Math.max(.6,Math.abs(b.z+direction*b.d/2-edge)),'#d2c3a4',cx,(edge+b.z+direction*b.d/2)/2,.39,group);
    model('nature/plant_bushDetailed',cx+(lw/2-1.1),cz,1.3,2.1,1.2,Math.PI/2,group);
    label(String(100+i*4+k),.7,.4,cx,1.8,edge+direction*.12,'#f8e5bd','#314c48',front?0:Math.PI,group);
   }else if(industrial){
    const front=row!==0,z=front?built.box.max.z+.13:built.box.min.z-.13,rot=front?0:Math.PI,signY=Math.min(built.box.max.y-.4,3.4);
    label(col===0?b.name:['LOADING / 02','SERVICE BAY'][row%2],Math.min(lw-1,9),.8,cx,signY,z,'#f7dba4','#3e5359',rot,group);
   }else{
    roofDetail(built.box,i+k,group);
    storefront(built.box,col===0?b.name:['LATE NIGHT COFFEE','VINYL & TAPES','CORNER STORE','NOODLE HOUSE'][(i+row)%4],theme,row!==0,group,i+k);
    if(rows===1)storefront(built.box,col===0?b.name:'OPEN LATE',theme,true,group,i+k);
   }
  }
  const front=b.z+b.d/2+.22,back=b.z-b.d/2-.22,signWidth=Math.min(b.w-1,16),height=i===10?3.8:3.4;
  if(residential)label(b.name,7,.65,b.x,1.45,front,'#e5ddbe','#395146',0,group);
  if([3,5,6,7].includes(i)||b.district==='docks'){const side=b.x<0?-1:1;label(b.name,Math.min(b.d-2,13),1.2,b.x+side*(b.w/2+.2),4.8,b.z,theme.neon,'#1d2e40',side*Math.PI/2,group);}
  const fenceZ=b.z+b.d/2+.65;for(const side of [-1,1])tree(b.x+side*(b.w/2-1.25),fenceZ,4.1+(i%3)*.4,group,b.district==='docks');
  if(residential)for(const side of [-1,1])tree(b.x+side*(b.w/2-1.25),b.z-b.d/2+.8,4.5,group);
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
  if(residential)landscape.dress(b,group,'residential',blockSeed(b.x,b.z),buildingBounds.filter(item=>item.block===b).map(item=>item.bounds));
  finishBlock(group);
 });
 for(let n=1;n<ROAD.length-1;n+=2)for(let k=1;k<ROAD.length-1;k+=2)landscape.roadDetail(ROAD[n]+1.35,ROAD[k]+14,stage,n+k);
 // Last Exit's garage door, repair canopy, and apron create a recognisable home base.
 block(8,3.5,.22,'#101f32',36,1.9,45.1);for(let n=0;n<8;n++)block(7.7,.045,.05,'#526b80',36,.45+n*.43,45.24);
 for(const x of [31.75,40.25])block(.18,4.4,.22,'#a4fadc',x,2.2,45.3,stage,{emissive:'#72edc1',emissiveIntensity:.8});
 label('REPAIRS / CASH OUT',9,.7,36,4.2,45.5,'#a4fadc');ground(9,7,'#405c67',36,49,.145);
 for(const x of [31.5,40.5])ground(.16,8.5,'#acdfc8',x,49.6,.16);for(let n=0;n<5;n++)ground(.85,.15,'#d9d893',32+n*2,53.1,.161);
 // Recessed transit shelters and roadside furnishings stay away from lane centres.
 for(const [x,z]of [[8,-85.3],[-63,85.3],[45,-49.3]]){
  for(const side of [-1,1])block(.13,3,.13,'#354c54',x+side*2.45,1.65,z);
  block(5.3,.2,1.65,'#49606a',x,3.24,z);block(4.9,2,.055,'#567c87',x,1.95,z-.66,stage,{roughness:.25,metalness:.2});
  block(4.7,.035,.06,'#f3dc9e',x,3.08,z-.45,stage,{emissive:'#ffe6b5',emissiveIntensity:.55});bench(x-.5,z-.1);label('CITY TRANSIT',4.3,.47,x,3.23,z+.86,'#d7e4c9','#354c54');
  pole(.055,3.1,'#334b55',x+3.1,1.72,z);label('BUS',.8,.85,x+3.1,2.95,z+.08,'#ebd9b0','#37586a');
 }
 // Street lamps sit on the pavement; their pools stay clear of route arrows.
 for(const x of [-86,-50,-22,14,50,86])for(const z of [-82,-46,-26,10,46,82]){
  pole(.075,4.8,'#3b5267',x,2.4,z);block(.95,.1,.12,'#40566e',x+.4,4.82,z);block(.72,.12,.42,'#b0c1c9',x+.62,4.73,z);block(.6,.025,.33,'#ffeab7',x+.62,4.65,z,stage,{emissive:'#ffe2a1',emissiveIntensity:1.3});
  const glow=new THREE.Mesh(new THREE.CircleGeometry(2.5,20),new THREE.MeshBasicMaterial({color:'#ffe3a7',transparent:true,opacity:.065,depthWrite:false}));glow.rotation.x=-Math.PI/2;glow.position.set(x+.7,.17,z);stage.add(glow);
 }
 for(const x of [-98,98])for(let z=-84;z<=85;z+=7){ground(3,.12,'#91a7bb',x,z,.04);ground(.12,3,'#91a7bb',x+(x<0?-1.5:1.5),z+1.5,.04);}
 // A distant skyline and waterfront replace the empty background plane.
 for(let i=0;i<15;i++){const x=-265+i*38;model('building-skyscraper-'+['a','b','c'][i%3],x,-306,11,12,26+(i*7%19),i%2?Math.PI:0,stage,['#becfe5','#b5b6d2','#e3c3c5'][i%3]);}
 for(let i=0;i<10;i++)model('building-'+['f','l','n'][i%3],306,-252+i*56,13,15,20+(i%3)*4,-Math.PI/2,stage,'#aebed5');
 for(let i=0;i<107;i++){block(.16,1.15,.16,'#7493a8',-283.3,.65,-280+i*5.3);if(i<106)block(.1,.12,5.3,'#7493a8',-283.3,1.12,-277.35+i*5.3);}
 ground(6,569,'#78909c',-285.9,0,-.01);for(let i=0;i<5;i++)ground(2,13,'#719bbc',-296-i*11,-42+i*19,-.675,stage,{transparent:true,opacity:.22});
 for(const r of RAMPS){const hw=r.w/2,hd=r.d/2,a=(1-r.dir)*r.h/2,b=(1+r.dir)*r.h/2;const points=r.axis==='x'?[[-hw,0,-hd],[-hw,0,hd],[hw,r.h,hd],[hw,r.h,-hd]]:[[-hw,a,-hd],[hw,a,-hd],[hw,b,hd],[-hw,b,hd]],v=[];for(const i of [0,1,2,0,2,3])v.push(...points[i]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(v,3));geo.computeVertexNormals();const m=new THREE.Mesh(geo,mat('#d2a26c',{side:THREE.DoubleSide}));m.position.set(r.x,.08,r.z);m.receiveShadow=true;stage.add(m);}
 // The outer map adds a waterfront promenade, docks, and a lit arcade gateway.
 for(const z of [-75,-24,27,78]){
  block(18,.65,4.4,'#8d8972',-294,-.1,z);for(let n=0;n<12;n++)ground(.045,4.3,'#5a685f',-302+n*1.45,z,.235);
  for(const x of [-301,-293])for(const edge of [-1,1])pole(.2,2.1,'#41595b',x,.4,z+edge*2.4);
  for(const [n,x]of [-297,-291].entries()){
   const container=model('industrial/shipping-container-'+(n?'b':'a'),x,z,5.2,3.2,2.5,0,stage);container.root.position.y=.27;
   if(n===0){const upper=model('industrial/shipping-container-b',x+.2,z,5.2,3.2,2.5,0,stage);upper.root.position.y=container.box.max.y+.08;}
  }
 }
 for(const z of [-86,-50,-14,22,58,94]){tree(-279,z,6,stage,true);block(.65,1.35,.65,'#c6dacc',-281,1,z,stage,{emissive:'#fce4ab',emissiveIntensity:.6});bench(-285.7,z,Math.PI/2);}
 // Dock cranes give the waterfront a different silhouette from the retail centre.
 for(const z of [-72,28]){
  for(const side of [-1,1]){block(.48,13,.48,'#c49a56',-296+side*2.3,6.5,z);block(1.3,.5,2,'#465c65',-296+side*2.3,.25,z);}
  block(6.3,.8,1,'#d3ae65',-296,12.8,z);block(13,.45,.55,'#cda969',-292.7,14,z);block(1.7,1.6,1.8,'#45646e',-298,13.8,z);
  for(let n=0;n<5;n++){block(.15,.8,.15,'#e4c883',-297+n*2.5,13.5,z);}
  pole(.032,6.5,'#3a4c55',-288,10.7,z);block(.2,.32,.35,'#e4c38a',-288,7.45,z);
  const tank=model('industrial/detail-tank',-299,z+9,5.5,5.5,5.5,0,stage);tank.root.position.y=.12;
 }
 // Small highlights break up the flat water without adding real-time lights.
 for(let n=0;n<36;n++){const x=-292-(n%6)*8,z=-279+Math.floor(n/6)*37+(n%4)*2;ground(3+(n%3)*2,.13,'#8fafb1',x,z,-.678,stage,{transparent:true,opacity:.23,depthWrite:false});}
 for(const x of [-4.4,4.4]){block(.24,7.6,.28,'#374866',x,3.8,-9);block(.13,6.2,.31,'#c291ff',x,4,-9,stage,{emissive:'#a674ff',emissiveIntensity:.75});}
 block(9,1,.38,'#362749',0,7.6,-9);label('NEON ROW',8.6,.82,0,7.6,-8.79,'#e1b7ff','#362749');
 for(let n=0;n<9;n++){const x=26+n*2.5;block(.24,.3,.24,n%2?'#ffeea5':'#b0f8db',x,4.8,-48.5,stage,{emissive:n%2?'#ffd279':'#76e8c3',emissiveIntensity:1});}
 label('STARLIGHT',14,2.1,36,5.7,-84.8,'#ffe0a0','#63354e',Math.PI);
 for(const x of [28.7,43.3])for(let y=4.8;y<7;y+=.5)block(.16,.16,.12,'#fff0b9',x,y,-84.9,stage,{emissive:'#ffc879',emissiveIntensity:1});
 function finishBlock(group){group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group);batch(group);const copies=new Map();group.traverse(o=>{if(!o.isMesh)return;const unique=m=>{if(!copies.has(m)){const c=m.clone();c.transparent=true;copies.set(m,c);}return copies.get(m);};o.material=Array.isArray(o.material)?o.material.map(unique):unique(o.material);});buildings.push({group,box:bounds,materials:[...copies.values()]});}
 // Bake solid surface colors into merged geometry. Glass, mapped signs, and
 // animated signals retain their own rendering properties and block fading.
 stage.updateMatrixWorld(true);
 function batch(parent){
  const entries=new Map(),inverse=parent.matrixWorld.clone().invert();
  parent.traverse(o=>{
   if(!o.isMesh||o.isInstancedMesh||o.material.map||o.material.normalMap||o.material.transparent||Array.isArray(o.material)||signals.some(s=>s.red===o.material||s.green===o.material))return;
   const material=o.material,roughness=material.roughness>=.8?.9:material.roughness;
   const key=JSON.stringify([material.type,material.emissive?.toArray(),material.emissiveIntensity,roughness,material.metalness,material.side,material.flatShading,material.depthWrite,material.depthTest,material.userData.facadeKind||0,!!material.userData.landscapeGrass]);
   const a=entries.get(key)||{material,roughness,objects:[],geos:[]};
   const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(inverse.clone().multiply(o.matrixWorld));for(const key of Object.keys(g.attributes))if(!['position','normal','color'].includes(key))g.deleteAttribute(key);
   const count=g.attributes.position.count,original=material.vertexColors?g.getAttribute('color'):null,colors=new Float32Array(count*3);
   for(let n=0;n<count;n++){colors[n*3]=(original?original.getX(n):1)*material.color.r;colors[n*3+1]=(original?original.getY(n):1)*material.color.g;colors[n*3+2]=(original?original.getZ(n):1)*material.color.b;}
   g.setAttribute('color',new THREE.BufferAttribute(colors,3));a.geos.push(g);a.objects.push(o);entries.set(key,a);
  });
  for(const a of entries.values()){
   if(a.objects.length<2){a.geos.forEach(g=>g.dispose());continue;}
   const geo=mergeGeometries(a.geos,false);a.geos.forEach(g=>g.dispose());if(!geo)continue;
   const material=a.material.clone();material.color.set('#ffffff');material.vertexColors=true;if(material.roughness!==undefined)material.roughness=a.roughness;
   const m=new THREE.Mesh(geo,material);m.castShadow=!material.userData.landscapeGrass;m.receiveShadow=true;for(const o of a.objects)o.removeFromParent();parent.add(m);
  }
 }

 const signalGeometry=new THREE.BoxGeometry(.22,.22,.035),redSignals=new THREE.InstancedMesh(signalGeometry,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),signals.length),greenSignals=new THREE.InstancedMesh(signalGeometry,new THREE.MeshBasicMaterial({color:'#ffffff',toneMapped:false}),signals.length),signalStamp=new THREE.Object3D();
 signals.forEach((s,i)=>{signalStamp.position.set(s.x,3.98,s.z+.18);signalStamp.updateMatrix();redSignals.setMatrixAt(i,signalStamp.matrix);signalStamp.position.y=3.46;signalStamp.updateMatrix();greenSignals.setMatrixAt(i,signalStamp.matrix);redSignals.setColorAt(i,new THREE.Color('#402934'));greenSignals.setColorAt(i,new THREE.Color('#76f6be'));});stage.add(redSignals,greenSignals);
 // Imported block geometry remains individually fadeable; shared static street meshes batch together.
 batch(stage);
 const facadeMaterials=new Set();stage.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.facadeKind)facadeMaterials.add(m);});
 for(const material of facadeMaterials){const kind=material.userData.facadeKind;material.customProgramCacheKey=()=>`getaway-masonry-${kind}`;material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMasonryPosition; varying vec3 vMasonryNormal;').replace('#include <worldpos_vertex>','#include <worldpos_vertex>\nvMasonryPosition=(modelMatrix*vec4(transformed,1.0)).xyz; vMasonryNormal=normalize(mat3(modelMatrix)*objectNormal);');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMasonryPosition; varying vec3 vMasonryNormal;').replace('#include <color_fragment>',`#include <color_fragment>
 vec2 masonry=vec2(abs(vMasonryNormal.z)>abs(vMasonryNormal.x)?vMasonryPosition.x:vMasonryPosition.z,vMasonryPosition.y);
 vec2 units=masonry*vec2(${kind===1?'1.75,3.6':'0.45,0.31'});units.x+=mod(floor(units.y),2.0)*${kind===1?'.5':'0.'};
 vec2 seamWidth=max(fwidth(units)*1.25,vec2(${kind===1?'.025':'.012'}));vec2 edge=smoothstep(vec2(1.0)-seamWidth,vec2(1.0),fract(units));float seam=max(edge.x,edge.y);
 float grain=fract(sin(dot(floor(units),vec2(12.9898,78.233)))*43758.5453);float tone=mix(.91+grain*.09,${kind===1?'.67':'.76'},seam);diffuseColor.rgb*=mix(tone,1.0,step(.65,abs(vMasonryNormal.y)));`);};}
 return{buildings,buildingBounds,stage,landmarkLights,usedAssets,landscape,update(time,focus){if(focus)for(const b of buildings){const c=b.box;const x=(c.min.x+c.max.x)/2,z=(c.min.z+c.max.z)/2;b.group.visible=Math.hypot(x-focus.x,z-focus.z)<195;}let signalChanged=false;signals.forEach((s,i)=>{const go=Math.sin(time*.28+s.phase)>0;if(go!==s.go){s.go=go;greenSignals.setColorAt(i,new THREE.Color(go?'#76f6be':'#20392c'));redSignals.setColorAt(i,new THREE.Color(go?'#402934':'#ff5573'));signalChanged=true;}});if(signalChanged){redSignals.instanceColor.needsUpdate=true;greenSignals.instanceColor.needsUpdate=true;}for(const r of fountainRings){const p=(time*.32+r.phase)%1;r.mesh.scale.setScalar(.45+p*2.45);r.mesh.material.opacity=(1-p)*.32;}}};
}
