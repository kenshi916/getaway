import * as THREE from './assets/three.module.js';
import { GLTFLoader } from './assets/GLTFLoader.js';
import { mergeGeometries } from './assets/BufferGeometryUtils.js';
import {clamp,blocked,moveBody,lineClear,findPath,createRun,collectBag,extract,hurt} from './logic.mjs';

const $=id=>document.getElementById(id);
const touch=matchMedia('(pointer:coarse)').matches;
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});}catch(error){
 $('game').innerHTML='<div class="webgl-error"><h2>HEIST needs 3D graphics</h2><p>Open this link in Safari or Chrome with hardware acceleration enabled to play.</p></div>';throw error;
}
renderer.setPixelRatio(Math.min(devicePixelRatio,touch?1.4:1.65));
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.23;
$('game').appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','HEIST 3D game. Use WASD to move, Space to jump, E to interact.');renderer.domElement.tabIndex=0;
const scene=new THREE.Scene();scene.background=new THREE.Color('#ad8c87');scene.fog=new THREE.Fog('#ad8c87',48,116);
const camera=new THREE.PerspectiveCamera(44,innerWidth/innerHeight,.1,180);
const ambient=new THREE.HemisphereLight('#cbd8ee','#7a6470',2.05);scene.add(ambient);
const sun=new THREE.DirectionalLight('#ffce8f',3.2);sun.position.set(-24,36,20);sun.castShadow=true;sun.shadow.mapSize.set(touch?1024:2048,touch?1024:2048);Object.assign(sun.shadow.camera,{left:-38,right:38,top:36,bottom:-36,near:.5,far:100});sun.shadow.normalBias=.04;sun.shadow.bias=-.00015;scene.add(sun);
const fill=new THREE.DirectionalLight('#7cabd5',.65);fill.position.set(20,15,-16);scene.add(fill);
const world=new THREE.Group();scene.add(world);
const mats=new Map(),boxes=[],fades=[],lamps=[],glows=[],coins=[],smokeClouds=[],projectiles=[];
const clock=new THREE.Clock();let totalTime=0,mode='menu',run=createRun(),ready=false,muted=false,paused=false;
let player,van,vaultPivot,vaultCollider,extractionRing,objectiveMarker,playerRing,laser,laserGlow;
let guards=[],templates={},pendingAction='',toastUntil=0,lastHud=0,alarm=0,laserCooldown=0,lastMode='menu';
const spawn={x:7,z:13},vanSpot={x:14,z:14},terminal={x:3.4,z:-7.7};
let yaw=.25,pitch=.86,cameraDistance=18,drag=null,joy={x:0,y:0},keys={},jumpVelocity=0,jumpY=0;
let invincible=0,footstep=0,smokeLock=0,interactionProgress=0,lastInteract='',audioContext=null,walked=0;

function mat(color,options={}){const key=color+JSON.stringify(options);if(!mats.has(key))mats.set(key,new THREE.MeshStandardMaterial({color,roughness:.9,flatShading:true,...options}));return mats.get(key);}
function cube(w,h,d,color,x,y,z,parent=world,opts={}){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,opts));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function cyl(rt,rb,h,color,x,y,z,n=12,parent=world,opts={}){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),mat(color,opts));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function collider(x,z,w,d,extra={}){const b={x,z,w,d,...extra};boxes.push(b);return b;}
function wall(w,h,d,color,x,y,z,extra={}){const mesh=cube(w,h,d,color,x,y,z);collider(x,z,w,d,extra);return mesh;}
function groundRect(w,d,color,x,z,y=.022){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat(color));m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.receiveShadow=true;world.add(m);return m;}
function sign(text,w,h,bg,fg,x,y,z,rot=0,font=70){
 const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.fillRect(0,0,c.width,c.height);ctx.strokeStyle=fg;ctx.lineWidth=5;ctx.strokeRect(13,13,c.width-26,c.height-26);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`900 ${font}px monospace`;ctx.fillText(text,c.width/2,c.height/2+3);
 const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;tx.magFilter=THREE.NearestFilter;
 const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tx,roughness:.85,emissive:fg,emissiveIntensity:.12}));mesh.position.set(x,y,z);mesh.rotation.y=rot;world.add(mesh);return mesh;
}
function ring(radius,color,x,z){const mesh=new THREE.Mesh(new THREE.RingGeometry(radius-.07,radius,48),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.8,side:THREE.DoubleSide,depthWrite:false}));mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.045,z);world.add(mesh);return mesh;}
function tree(x,z,scale=1){
 cube(1.8*scale,.35,1.8*scale,'#858b73',x,.18,z);cube(1.6*scale,.12,1.6*scale,'#525c42',x,.4,z);cyl(.14*scale,.2*scale,2.4*scale,'#78634e',x,1.45*scale,z,5);
 const canopy=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8*scale,0),mat('#5a785c'));canopy.scale.set(.9,1.2,.85);canopy.position.set(x,3.55*scale,z);canopy.castShadow=true;world.add(canopy);collider(x,z,1.55*scale,1.55*scale);
}
function decorativeBuilding(x,z,w,d,h,color,label){
 wall(w,h,d,color,x,h/2,z);cube(w+.5,.45,d+.5,'#555761',x,h+.1,z);cube(w+.2,.25,d+.2,'#d0b398',x,h-1.1,z);
 for(let col=-w/2+1.2;col<w/2-1;col+=2.1){for(let row=2;row<h-1.5;row+=2.8){cube(1.1,1.6,.09,'#394b58',x+col,row,z+d/2+.05);cube(1,1.4,.025,(Math.floor(col+row*4)%3===0)?'#d4c07e':'#6d8b92',x+col,row,z+d/2+.11);}}
 if(label)sign(label,Math.min(w-1,7),1.3,'#253d43','#e7d5ab',x,3.6,z+d/2+.14,0,115);
 cube(1.8,1.3,2,'#788080',x-1,h+.9,z);cube(.25,2.2,.25,'#424c53',x+2,h+1.3,z-1);
}
function buildWorld(){
 groundRect(180,180,'#828177',0,0,-.2);cube(51,.8,46,'#696d65',0,-.44,1.4);groundRect(50,13,'#3e4750',0,15.6,.015);groundRect(10,45,'#414950',-20,1.5,.016);groundRect(8,45,'#414950',21,1.5,.016);
 for(let i=-22;i<25;i+=4)groundRect(2,.12,'#e1cc91',i,15.6,.025);
 for(let i=-18;i<21;i+=4)groundRect(.12,2,'#d9c58e',-20,i,.026);
 cube(30,.22,4.8,'#a7a08a',0,.005,7.3);cube(.35,.25,28,'#bab099',-15,.035,-3.5);cube(.35,.25,28,'#bab099',15,.035,-3.5);
 for(let x=-14;x<15;x+=1.6)groundRect(.028,4.8,'#817e71',x,7.3,.124);
 for(let i=-2;i<=2;i++){groundRect(.9,4,'#dcd4b3',i*1.7,12.8,.03);groundRect(4,.8,'#ddd2ac',-20,5+i*1.6,.03);}
 for(let x=-13;x<15;x+=4){groundRect(2.4,.09,'#c5c1a2',x,20.6,.03);groundRect(.09,3.5,'#c5c1a2',x-1.2,19,.03);}
 decorativeBuilding(-28,-9,11,13,13,'#756e72','PAWN & LOAN');decorativeBuilding(28,-8,11,14,16,'#638281','HOTEL');decorativeBuilding(-10,-26,14,8,20,'#7b777e');decorativeBuilding(8,-27,16,8,13,'#9b837b');
 decorativeBuilding(-32,18,12,10,10,'#8c7a71','24H MART');decorativeBuilding(32,18,12,10,12,'#7b8585','NOODLES');
 for(let i=0;i<12;i++){const h=12+(i*7%19);const x=-52+i*9;cube(7,h,8,i%2?'#797e88':'#8c8289',x,h/2,-46);}
 // A roofless, fully traversable bank keeps the whole heist readable from above.
 cube(25,.35,22,'#c0ad88',0,-.1,-6.4);groundRect(23.8,20.8,'#b7b7a3',0,-6.4,.085);
 for(let x=-11;x<12;x+=2)for(let z=-16;z<4;z+=2)if((x+z)%4===-1||(x+z)%4===3)groundRect(1.98,1.98,'#a7af9e',x,z,.091);
 wall(.6,5.3,22,'#a6a98e',-12.3,2.6,-6.4);wall(.6,5.3,22,'#a6a98e',12.3,2.6,-6.4);wall(25,5.3,.6,'#ada68f',0,2.6,-17.3);
 cube(25.7,.35,.9,'#e1ccab',0,5.25,-17.3);cube(.9,.35,22.7,'#e1ccab',-12.3,5.25,-6.4);cube(.9,.35,22.7,'#e1ccab',12.3,5.25,-6.4);
 for(const x of [-10,-5,5,10]){wall(1.05,4.6,1.05,'#d4c49b',x,2.25,4.15);cube(1.5,.35,1.5,'#e5d6b2',x,4.7,4.15);cube(1.4,.3,1.4,'#e4d1ac',x,.15,4.15);}
 for(const x of [-7.5,7.5]){
  wall(4,1.05,.32,'#969d85',x,.52,4.25);const glass=cube(3.7,2.4,.06,'#779ca2',x,2.22,4.22,world,{transparent:true,opacity:.32,depthWrite:false});fades.push(glass);cube(.09,2.45,.12,'#4e7272',x,2.22,4.25);
 }
 const lintel=cube(24.8,.85,1.6,'#cebb94',0,5.05,4.15);fades.push(lintel);const bankSign=sign('UNION TRUST',15.8,1.38,'#274746','#e7d7ad',0,5.92,4.98,0,104);fades.push(bankSign);
 sign('EST. 1986',3.2,.45,'#274746','#e7d7ad',0,4.55,5.02,0,95);
 groundRect(4,2.8,'#6d6660',0,3.2,.1);groundRect(3.3,1.8,'#c2a566',0,3.2,.106);
 // Teller counters, cover, offices, and vault entrance.
 wall(5.5,1.4,1.2,'#657f70',-7.2,.7,-2);cube(5.7,.16,1.4,'#e2cca1',-7.2,1.45,-2);
 wall(5.5,1.4,1.2,'#657f70',7.2,.7,-2);cube(5.7,.16,1.4,'#e2cca1',7.2,1.45,-2);
 for(const x of [-9,-6,6,9]){cube(.07,1.6,.07,'#9c967b',x,2.3,-2);cube(.9,.08,.07,'#9c967b',x,3.1,-2);}
 for(const x of [-6.8,6.8]){wall(7.3,3.1,.55,'#899589',x,1.55,-9.5);cube(7.6,.18,.72,'#d1c4a1',x,3.13,-9.5);}
 wall(.5,3.1,7.4,'#86978c',-4.8,1.55,-13.3);wall(.5,3.1,7.4,'#86978c',4.8,1.55,-13.3);groundRect(9.1,7.1,'#6d817a',0,-13.4,.11);
 // Vault door is interactive geometry, with a readable wheel and locking bolts.
 const arch=cube(5.6,4.2,.7,'#556c6b',0,2,-9.5);world.remove(arch);arch.geometry.dispose();
 wall(.6,4.3,.95,'#657878',-2.55,2.1,-9.5);wall(.6,4.3,.95,'#657878',2.55,2.1,-9.5);cube(5.7,.5,1,'#748986',0,4.15,-9.5);
 vaultPivot=new THREE.Group();vaultPivot.position.set(-2.25,0,-9.5);world.add(vaultPivot);
 cube(4.5,3.8,.5,'#8eaaa5',2.25,1.95,0,vaultPivot);cube(3.95,3.3,.12,'#647b79',2.25,1.95,.32,vaultPivot);
 const circle=cyl(1.33,1.33,.18,'#9eb4aa',2.25,1.95,.49,16,vaultPivot);circle.rotation.x=Math.PI/2;
 const inner=cyl(1.13,1.13,.21,'#68857f',2.25,1.95,.6,16,vaultPivot);inner.rotation.x=Math.PI/2;
 const wheel=new THREE.Mesh(new THREE.TorusGeometry(.6,.065,5,12),mat('#dbc798'));wheel.position.set(2.25,1.95,.8);vaultPivot.add(wheel);
 for(let a=0;a<3;a++){const spoke=cube(1.2,.07,.08,'#d8c396',2.25,1.95,.8,vaultPivot);spoke.rotation.z=a*Math.PI/3;}
 for(const y of [.55,3.35])for(const x of [.55,3.95])cube(.23,.23,.21,'#d4c398',x,y,.42,vaultPivot);
 vaultCollider=collider(0,-9.5,4.5,.8);
 const term=new THREE.Group();term.position.set(3.4,0,-8);world.add(term);cube(.72,1.4,.5,'#334e50',0,.7,0,term);cube(.94,.68,.48,'#738a78',0,1.65,0,term);cube(.68,.36,.02,'#aef67b',0,1.73,.26,term,{emissive:'#aef67b',emissiveIntensity:.8});
 for(let i=0;i<3;i++)cube(.12,.07,.04,'#dcdbb5',-.19+i*.19,1.43,.28,term);
 sign('VAULT CONTROL',2.8,.48,'#364f50','#e0edbd',3.6,2.9,-9.16,0,100);
 // Low laser gate: jump, wait for the cycle, or approach around the sides.
 for(const x of [-2.7,2.7]){cube(.3,1.1,.5,'#334d52',x,.55,-4.8);cyl(.12,.12,.07,'#fb8962',x,1.13,-4.8,8,world,{emissive:'#ff603a',emissiveIntensity:1.4});}
 laser=cube(5.4,.055,.055,'#ff6448',0,.58,-4.8,world,{emissive:'#ff4222',emissiveIntensity:2});laser.castShadow=false;laserGlow=groundRect(5.3,.35,'#ff8c5a',0,-4.8,.12);laserGlow.material=new THREE.MeshBasicMaterial({color:'#ff6845',transparent:true,opacity:.2,depthWrite:false});
 // Interior lighting and environmental storytelling.
 for(const x of [-9,9])for(const z of [-7,1]){cube(.15,.4,.3,'#485b59',x,3.8,z);const light=cube(.18,.6,.32,'#f7d795',x,3.8,z,world,{emissive:'#ffe2a0',emissiveIntensity:1});glows.push(light);}
 for(const x of [-8,8]){sign('UNION',2.5,1.2,'#345b57','#e3d8ae',x,3.5,-16.95,0,140);}
 sign('AUTHORIZED PERSONNEL',6.2,.65,'#415f5b','#e5dcba',0,4.2,-16.94,0,63);
 for(let x=-3;x<=3;x+=3){const bag=new THREE.Group();bag.position.set(x,.13,-13.7);world.add(bag);cube(1.2,.52,.8,'#91ac68',0,.35,0,bag);cube(.25,.54,.83,'#e3d7a6',0,.35,0,bag);for(let i=0;i<3;i++)cube(1.2,.035,.82,'#c4d6a2',0,.17+i*.15,0,bag);const aura=ring(.88,'#dbff80',x,-13.7);coins.push({group:bag,ring:aura,taken:false,x,z:-13.7,baseY:.13});}
 // The getaway point is visible before and after the vault opens.
 extractionRing=ring(3.8,'#dfff80',vanSpot.x,vanSpot.z);extractionRing.material.opacity=.2;
 for(const x of [-13.3,13.3]){tree(x,7, .85);tree(x,-6,.8);}tree(-13,-16,.9);
 groundRect(2,1.6,'#70866f',-13,1,.13);groundRect(2,1.6,'#70866f',13,1,.13);
 // Decorative bollards and parking meters.
 for(const x of [-11,-8,-5,5,8,11]){cyl(.12,.16,1,'#455e5e',x,.5,9.4,8);cyl(.14,.14,.14,'#ead3a0',x,.9,9.4,8);}
 for(const [x,z]of [[-14,10],[14,10],[-14,-15],[14,-15]])lamps.push({x,z});
 objectiveMarker=new THREE.Group();world.add(objectiveMarker);const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.35),new THREE.MeshBasicMaterial({color:'#e0ff88'}));objectiveMarker.add(diamond);
 const shaft=cyl(.027,.027,.5,'#dfff90',0,-.7,0,6,objectiveMarker,{emissive:'#e0ff88',emissiveIntensity:1});shaft.castShadow=false;
 playerRing=ring(.63,'#dfff90',spawn.x,spawn.z);
}
buildWorld();

// Batch the fixed architecture so phones render dozens of surfaces instead of hundreds.
function batchScenery(){
 world.updateMatrixWorld(true);const groups=new Map();
 for(const mesh of [...world.children]){
  if(!mesh.isMesh||mesh.material.transparent||mesh.material.map||fades.includes(mesh)||glows.includes(mesh)||mesh===laser)continue;
  const key=mesh.material.uuid+'-'+mesh.castShadow;let batch=groups.get(key);
  if(!batch){batch={material:mesh.material,shadow:mesh.castShadow,geometries:[],meshes:[]};groups.set(key,batch);}
  let geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();geometry.applyMatrix4(mesh.matrixWorld);batch.geometries.push(geometry);batch.meshes.push(mesh);
 }
 for(const batch of groups.values()){
  if(batch.meshes.length<2){batch.geometries.forEach(g=>g.dispose());continue;}
  const geometry=mergeGeometries(batch.geometries,false);batch.geometries.forEach(g=>g.dispose());if(!geometry)continue;
  const combined=new THREE.Mesh(geometry,batch.material);combined.castShadow=batch.shadow;combined.receiveShadow=true;world.add(combined);
  batch.meshes.forEach(mesh=>{world.remove(mesh);mesh.geometry.dispose();});
 }
}
batchScenery();

$('ui').innerHTML=`
<div class="vignette"></div><div class="scanlines"></div><div id="damageFlash" class="danger-flash"></div>
<header id="topbar" class="topbar"><div class="brand">HEIST<small>MIDNIGHT WITHDRAWAL</small></div><div class="top-actions"><span class="build-tag">PLAYABLE ALPHA / 001</span><button id="soundBtn" class="icon-btn" aria-label="Toggle sound" title="Toggle sound">♪</button><button id="infoBtn" class="icon-btn" aria-label="How to play" title="How to play">?</button></div></header>
<main id="menu" class="menu"><div class="menu-content splash-enter"><div class="eyebrow">ONE BANK. ONE WAY OUT.</div><h1 class="hero-title">HEIST</h1><div class="subtitle">Midnight withdrawal</div><p class="brief">The vault is full. The guards are bored.<br><strong>Try not to make the evening news.</strong></p><button id="playBtn" class="play-btn" disabled><span id="playText">LOADING THE BLOCK</span><span class="arrow">↗</span></button><div id="loadNote" class="loading-note">Loading characters & getaway vehicle…</div><div class="menu-meta"><span>SOLO RUN · SECURITY BOTS</span><span>5 MIN</span></div><div class="menu-secondary"><button class="text-btn" id="howBtn">HOW TO PLAY</button><button class="text-btn" id="creditsBtn">ASSET CREDITS</button></div></div></main>
<div id="sceneLabel" class="scene-label">TONIGHT’S TARGET ↙</div><footer id="bottomBar" class="bottom-bar"><div class="location-tag"><strong>UNION TRUST BANK</strong>DOWNTOWN / 20:46</div><div class="caption-tag">Practice heist · no live payouts</div></footer>
<div id="hud" class="hud hidden"><div class="hud-top"><div><div class="hud-logo">HEIST</div><div class="objective-card"><div class="objective-label" id="objectiveLabel">01 / GET INSIDE</div><div class="objective-text" id="objectiveText">Reach the vault terminal</div><div class="objective-sub" id="objectiveSub">Look for the green diamond.</div></div></div><div id="timerBox" class="timer"><span id="timer">05:00</span><small>TIME LEFT</small></div><div class="hud-right"><div class="loot-card"><small>LOOT POINTS</small><strong id="loot">0</strong></div><button class="icon-btn" id="pauseBtn" aria-label="Pause game">Ⅱ</button></div></div>
<div class="alert-label hidden" id="alertLabel">SPOTTED · KEEP MOVING</div><div id="toast" class="toast hidden" role="status" aria-live="polite"></div>
<div class="hud-bottom"><div class="status-card"><div class="status-label"><span>HEALTH</span><span id="healthText">100</span></div><div class="healthbar"><div id="healthFill" style="width:100%"></div></div><div class="staminabar"><div id="staminaFill" style="width:100%"></div></div></div><div class="gadget"><kbd>Q</kbd><div><b id="smokeCount">3 SMOKE BOMBS</b><span>BREAK LINE OF SIGHT</span></div></div></div>
<div class="controls-hint"><span><kbd>WASD</kbd>MOVE</span><span><kbd>SPACE</kbd>JUMP</span><span><kbd>SHIFT</kbd>SPRINT</span><span>DRAG TO LOOK</span></div><div class="minimap"><span class="map-label">DOWNTOWN</span><span class="map-north">N</span><canvas id="minimap" width="256" height="256"></canvas></div>
<div class="interaction hidden" id="interaction"><span id="interactText"></span><div class="interact-meter hidden" id="interactMeter"><div id="interactFill"></div></div></div>
<div class="mobile-controls"><div class="joystick" id="joystick" aria-label="Movement joystick"><div class="stick" id="stick"></div></div><div class="touch-actions"><button class="touch-btn" id="touchSmoke" aria-label="Use smoke bomb"><b>◌</b><span id="mobileSmoke">SMOKE 3</span></button><button class="touch-btn" id="touchJump" aria-label="Jump"><b>↑</b>JUMP</button><button class="touch-btn main" id="touchInteract" aria-label="Hold to interact"><b>✦</b>HOLD</button></div></div></div>
<div id="modalRoot" class="hidden"></div>`;

function prepareModel(glb){glb.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;const lit=m=>m.isMeshBasicMaterial?new THREE.MeshStandardMaterial({color:m.color,map:m.map,transparent:m.transparent,opacity:m.opacity,alphaTest:m.alphaTest,side:m.side,roughness:.85,flatShading:true}):m;o.material=Array.isArray(o.material)?o.material.map(lit):lit(o.material);const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>{m.flatShading=true;if(m.map){m.map.magFilter=THREE.NearestFilter;m.map.minFilter=THREE.LinearMipmapLinearFilter;}});}});return glb;}
function prop(name,x,z,scale=1,rot=0,y=0){const original=templates[name];if(!original)return null;const root=original.scene.clone(true),wrap=new THREE.Group();const bounds=new THREE.Box3().setFromObject(root);const center=bounds.getCenter(new THREE.Vector3());root.position.set(-center.x,-bounds.min.y,-center.z);wrap.add(root);wrap.scale.setScalar(scale);wrap.rotation.y=rot;wrap.position.set(x,y,z);world.add(wrap);return wrap;}
function character(name,x,z){const root=templates[name].scene.clone(true),wrap=new THREE.Group();wrap.add(root);root.scale.setScalar(.7);wrap.position.set(x,.12,z);world.add(wrap);const mixer=new THREE.AnimationMixer(root);const actions={};for(const clip of templates[name].animations)actions[clip.name]=mixer.clipAction(clip);const actor={group:wrap,root,mixer,actions,action:'',x,z,heading:0};animateActor(actor,'idle');return actor;}
function animateActor(actor,name){if(actor.action===name||!actor.actions[name])return;if(actor.actions[actor.action])actor.actions[actor.action].fadeOut(.15);actor.actions[name].reset().fadeIn(.15).play();actor.action=name;}
function populate(){
 player=character('robber',spawn.x,spawn.z);player.group.rotation.y=-.7;
 van=prop('getaway-van',vanSpot.x,vanSpot.z,2.05,Math.PI/2);collider(vanSpot.x,vanSpot.z,5.7,3.1);
 prop('police-car',-10.8,19,1.65,-Math.PI/2);collider(-10.8,19,5.1,2.5);
 prop('dumpster',-13.4,-.5,8,0);collider(-13.4,-.5,2.1,2.9);
 for(const p of [[-10,6,0],[10,6,Math.PI],[-14,17,0],[20,-8,Math.PI]])prop('traffic-cone',p[0],p[1],1.6,p[2]);
 for(const p of [[-22,10,Math.PI/2],[20,9,Math.PI/2],[-14,21,Math.PI/2]])prop('barrier',p[0],p[1],9,p[2]);
 for(const {x,z}of lamps){prop('streetlight',x,z,9,z<0?Math.PI:0);const l=new THREE.PointLight('#fce8ae',8,10,2);l.position.set(x,5.15,z-1.5);scene.add(l);}
 prop('stop-sign',-15.4,9,6,Math.PI/2);
 for(const p of [[-10.2,-5.8],[8.9,-5.8]]){
  prop('desk',...p,3);collider(...p,2.3,1.3);prop('monitor',p[0],p[1],2.5,Math.PI,1.2);prop('keyboard',p[0],p[1]+.4,2.1,0,1.19);prop('office-chair',p[0],p[1]-1.2,2.6,Math.PI);
 }
 for(const x of [-9.5,-6.5,6.5,9.5]){prop('monitor',x,-2,1.6,Math.PI,1.54);prop('keyboard',x,-1.7,1.3,0,1.54);}
 for(const [x,z,s]of [[-10.8,2,12],[10.8,2,12],[-10.9,-14,9],[10.9,-14,9]]){prop('potted-plant',x,z,s);collider(x,z,1,1);}
 for(const x of [-8.3,8.3]){prop('office-cabinet',x,-16.4,3.1);collider(x,-16.4,2.7,.85);}
 for(const [x,z,s]of [[-7,-12,2],[7,-12,1.8],[-7.3,-13.8,1.6],[-13.4,-4.2,1.6]]){prop('crate',x,z,s,.15);collider(x,z,.72*s,.72*s);}
 prop('cardboard-box',8.9,-15,4);prop('cardboard-box',9.4,-13.8,3);
 for(const [x,z,route]of [[-7,-5,[[-7,-5],[-3,-5],[-3,1],[-8,1]]],[7,-7,[[7,-7],[10,-7],[10,1],[4,1]]],[-7,11,[[-7,11],[-3,11],[3,9],[-3,9]]]]){
  const g=character('police-officer',x,z);g.home={x,z};g.route=route.map(([x,z])=>({x,z}));g.routeIndex=1;g.detect=0;g.shoot=0;g.path=[];g.pathTime=0;g.search=0;g.alert=false;g.stun=0;
  const geo=new THREE.CircleGeometry(5.7,24,-Math.PI/5,Math.PI*2/5);const cone=new THREE.Mesh(geo,new THREE.MeshBasicMaterial({color:'#f1dc92',transparent:true,opacity:.1,side:THREE.DoubleSide,depthWrite:false}));cone.rotation.x=-Math.PI/2;world.add(cone);g.cone=cone;
  const icon=new THREE.Mesh(new THREE.OctahedronGeometry(.2),new THREE.MeshBasicMaterial({color:'#ff9a72'}));icon.visible=false;world.add(icon);g.icon=icon;guards.push(g);
 }
 ready=true;$('playBtn').disabled=false;$('playText').textContent='START A HEIST';$('loadNote').classList.add('hidden');
}
const loader=new GLTFLoader();
const names=['robber','police-officer','getaway-van','police-car','crate','traffic-cone','dumpster','barrier','streetlight','stop-sign','desk','office-chair','monitor','keyboard','cardboard-box','potted-plant','office-cabinet'];
Promise.all(names.map(name=>loader.loadAsync(`/assets/models/${name}.glb`).then(g=>{templates[name]=prepareModel(g);}))).then(populate).catch(error=>{
 console.error('Asset loading failed',error);$('playText').textContent='RELOAD ASSETS';$('playBtn').disabled=false;$('loadNote').textContent='An asset could not load. Tap to retry.';$('playBtn').onclick=()=>location.reload();
});

function playSound(freq=440,duration=.1,type='square',vol=.035,slide=0){if(muted||!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioContext.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide),audioContext.currentTime+duration);g.gain.setValueAtTime(vol,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+duration);o.connect(g);g.connect(audioContext.destination);o.start();o.stop(audioContext.currentTime+duration);}
function initAudio(){try{audioContext??=new(window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();}catch{}}
function jingle(win){[0,1,2,3].forEach(i=>setTimeout(()=>playSound((win?[392,494,587,784]:[294,247,196,147])[i],.18,'triangle',.07),i*125));}
function toast(text,seconds=2.6){$('toast').textContent=text;$('toast').classList.remove('hidden');toastUntil=totalTime+seconds;}
function updateSound(){const b=$('soundBtn');b.textContent=muted?'♫̸':'♪';b.setAttribute('aria-label',muted?'Turn sound on':'Turn sound off');}
function closeModal(){const root=$('modalRoot');root.innerHTML='';root.className='hidden';if(paused){paused=false;clock.getDelta();}renderer.domElement.focus({preventScroll:true});}
function modal(html){const root=$('modalRoot');root.className='modal-shade';root.innerHTML=`<section class="modal splash-enter" role="dialog" aria-modal="true" aria-labelledby="dialogTitle">${html}</section>`;root.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal);root.querySelector('button')?.focus();}
function showHow(){if(mode==='playing')paused=true;modal(`<button class="modal-close" data-close aria-label="Close">×</button><h2 id="dialogTitle">THE PLAN</h2><p>Enter Union Trust. Reach the glowing terminal beside the vault and hold ${touch?'the HOLD button':'E'} to crack it. Grab the three cash stacks, then get back to the getaway van.</p><div class="desktop-instruction"><div class="instruction-row"><span>Move / sprint</span><span><kbd>W A S D</kbd> + <kbd>SHIFT</kbd></span></div><div class="instruction-row"><span>Jump over lasers</span><kbd>SPACE</kbd></div><div class="instruction-row"><span>Hold to hack / escape</span><kbd>E</kbd></div><div class="instruction-row"><span>Throw smoke</span><kbd>Q</kbd></div><div class="instruction-row"><span>Rotate camera / zoom</span><span>DRAG / SCROLL</span></div></div><div class="mobile-instruction"><div class="instruction-row"><span>Move / run</span><span>LEFT THUMBSTICK</span></div><div class="instruction-row"><span>Rotate camera</span><span>DRAG THE WORLD</span></div><div class="instruction-row"><span>Hack / escape</span><span>PRESS & HOLD ✦</span></div></div><p>Smoke hides you from guards for 6 seconds. Break their line of sight to lose them. Make it out before the five-minute timer ends.</p><button class="play-btn" data-close>GOT IT <span>↗</span></button>`);}
function showCredits(){modal(`<button class="modal-close" data-close aria-label="Close">×</button><h2 id="dialogTitle">GOOD COMPANY</h2><p>Characters, animated guards, vehicles, and props by <a href="https://kenney.nl" target="_blank" rel="noopener noreferrer">Kenney</a>, used under CC0.</p><p>Asset packs: Blocky Characters, Car Kit, City Kit Roads, and Furniture Kit. Original bank environment, gameplay, and sound effects made for HEIST.</p><p>Rendered with Three.js (MIT). Space Mono by Colophon Foundry (SIL Open Font License).</p><p class="result-note">This alpha is a solo practice game. Loot is a game score. Wallets, multiplayer, and token rewards are not connected.</p><button class="play-btn" data-close>BACK TO THE BLOCK <span>↗</span></button>`);}
function showPause(){if(mode!=='playing')return;paused=true;keys={};joy={x:0,y:0};$('stick').style.transform='';modal(`<h2 id="dialogTitle">LAY LOW.</h2><p>Your run is paused. The guards can wait.</p><button id="resumeBtn" class="play-btn">RESUME HEIST <span>↗</span></button><div class="menu-secondary"><button id="restartBtn" class="text-btn">RESTART RUN</button><button id="quitBtn" class="text-btn">BACK TO MENU</button><button id="pauseSound" class="text-btn">SOUND ${muted?'OFF':'ON'}</button></div>`);$('resumeBtn').onclick=closeModal;$('restartBtn').onclick=()=>{closeModal();startRun();};$('quitBtn').onclick=()=>{closeModal();returnMenu();};$('pauseSound').onclick=()=>{muted=!muted;updateSound();$('pauseSound').textContent='SOUND '+(muted?'OFF':'ON');};}
function resetWorld(){
 run=createRun();invincible=0;jumpY=0;jumpVelocity=0;alarm=0;laserCooldown=0;interactionProgress=0;keys={};joy={x:0,y:0};yaw=.25;pitch=.86;cameraDistance=18;
 player.x=spawn.x;player.z=spawn.z;player.group.position.set(spawn.x,.12,spawn.z);player.group.visible=true;player.group.rotation.y=-.7;animateActor(player,'idle');
 vaultPivot.rotation.y=0;vaultCollider.active=true;coins.forEach(c=>{c.taken=false;c.group.visible=true;c.ring.visible=true;});
 guards.forEach(g=>{g.x=g.home.x;g.z=g.home.z;g.group.position.set(g.x,.12,g.z);g.detect=0;g.shoot=0;g.alert=false;g.search=0;g.stun=0;g.path=[];g.pathTime=0;g.routeIndex=1;animateActor(g,'walk');});
 smokeClouds.forEach(c=>{world.remove(c.group);c.group.traverse(m=>{if(m.isMesh)m.material.dispose();});});smokeClouds.length=0;projectiles.forEach(p=>{world.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();});projectiles.length=0;
 $('damageFlash').style.opacity=0;$('interaction').classList.add('hidden');$('toast').classList.add('hidden');$('stick').style.transform='';pendingAction='';
}
function startRun(){if(!ready)return;closeModal();initAudio();resetWorld();mode='playing';paused=false;['menu','topbar','bottomBar','sceneLabel'].forEach(id=>$(id).classList.add('hidden'));$('hud').classList.remove('hidden');toast(touch?'Follow the diamond. Hold ✦ at the terminal.':'Follow the diamond. Hold E at the terminal.',4);updateHUD();renderer.domElement.focus({preventScroll:true});playSound(330,.17,'triangle',.08,330);}
function returnMenu(){mode='menu';resetWorld();['menu','topbar','bottomBar','sceneLabel'].forEach(id=>$(id).classList.remove('hidden'));$('hud').classList.add('hidden');}
function finishRun(won){if(mode!=='playing')return;mode=won?'won':'lost';keys={};joy={x:0,y:0};$('interaction').classList.add('hidden');$('alertLabel').classList.add('hidden');animateActor(player,won?'emote-yes':'die');jingle(won);
 const score=won?run.loot+(run.bonus||0):0;let best=0;try{best=Number(localStorage.getItem('heist-best')||0);if(score>best){best=score;localStorage.setItem('heist-best',String(score));}}catch{}
 modal(`<div class="result-eyebrow">${won?'CLEAN GETAWAY':'CASE CLOSED'}</div><h2 id="dialogTitle">${won?'NICE WITHDRAWAL.':run.time<=0?'OUT OF TIME.':'BUSTED.'}</h2><div class="result-total">${score.toLocaleString()}</div><div class="objective-label">${won?'POINTS BANKED':'POINTS BANKED · LOOT LOST'}</div><div class="result-stats"><div><span>BAGS</span><strong>${run.bags} / 3</strong></div><div><span>TIME BONUS</span><strong>${won?(run.bonus||0).toLocaleString():'—'}</strong></div><div><span>PERSONAL BEST</span><strong>${best.toLocaleString()}</strong></div></div><p>${won?(run.bags===3?'Every bag. One getaway. The perfect evening.':'You made it out. There’s more in the vault for your next run.'):'Use cover and smoke to lose the guards. Jump over the laser or wait for it to switch off.'}</p><button id="againBtn" class="play-btn">${won?'RUN IT BACK':'ONE MORE TRY'} <span>↗</span></button><button id="resultMenuBtn" class="text-btn" style="margin-top:20px">BACK TO MENU</button><p class="result-note">Practice score only. No money or tokens awarded.</p>`);$('againBtn').onclick=startRun;$('resultMenuBtn').onclick=()=>{closeModal();returnMenu();};}

$('playBtn').onclick=startRun;$('howBtn').onclick=showHow;$('infoBtn').onclick=showHow;$('creditsBtn').onclick=showCredits;$('soundBtn').onclick=()=>{initAudio();muted=!muted;updateSound();};$('pauseBtn').onclick=showPause;
addEventListener('keydown',e=>{
 if(e.code==='Escape'){if($('modalRoot').classList.contains('hidden'))showPause();else if(mode==='playing')closeModal();else if(mode==='menu')closeModal();return;}
 if(mode!=='playing'||paused)return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyE','KeyQ'].includes(e.code))e.preventDefault();
 if(e.code==='Space'&&!keys.Space)jump();if(e.code==='KeyQ'&&!keys.KeyQ)throwSmoke();keys[e.code]=true;
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{keys={};joy={x:0,y:0};if(mode==='playing'&&!paused)showPause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&mode==='playing'&&!paused)showPause();});
renderer.domElement.addEventListener('contextmenu',e=>e.preventDefault());
renderer.domElement.addEventListener('pointerdown',e=>{if(mode==='playing'&&!paused){drag={id:e.pointerId,x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;yaw-=(e.clientX-drag.x)*.006;pitch=clamp(pitch+(e.clientY-drag.y)*.003,.5,1.18);drag.x=e.clientX;drag.y=e.clientY;});
renderer.domElement.addEventListener('pointerup',()=>{drag=null;});renderer.domElement.addEventListener('pointercancel',()=>{drag=null;});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();cameraDistance=clamp(cameraDistance+e.deltaY*.012,11,25);},{passive:false});
let joyId=null;
function moveJoystick(e){const r=$('joystick').getBoundingClientRect(),max=r.width*.32;let x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;const len=Math.hypot(x,y);if(len>max){x=x/len*max;y=y/len*max;}joy={x:x/max,y:y/max};$('stick').style.transform=`translate(${x}px,${y}px)`;}
$('joystick').addEventListener('pointerdown',e=>{if(paused||mode!=='playing')return;e.preventDefault();joyId=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);moveJoystick(e);});
$('joystick').addEventListener('pointermove',e=>{if(e.pointerId===joyId)moveJoystick(e);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('joystick').addEventListener(type,()=>{joyId=null;joy={x:0,y:0};$('stick').style.transform='';});
function holdButton(id,key){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();keys[key]=true;b.setPointerCapture(e.pointerId);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>{keys[key]=false;});}
holdButton('touchInteract','KeyE');$('touchJump').addEventListener('pointerdown',e=>{e.preventDefault();jump();});$('touchSmoke').addEventListener('pointerdown',e=>{e.preventDefault();throwSmoke();});

function jump(){if(mode!=='playing'||paused||jumpY>.01)return;jumpVelocity=6.9;playSound(160,.16,'triangle',.04,280);}
function throwSmoke(){if(mode!=='playing'||paused||!run.smokes||totalTime<smokeLock)return;run.smokes--;smokeLock=totalTime+.6;const group=new THREE.Group();group.position.set(player.x,.1,player.z);world.add(group);
 for(let i=0;i<10;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(1.5,1),new THREE.MeshStandardMaterial({color:'#a8c6b7',transparent:true,opacity:.53,roughness:1,flatShading:true,depthWrite:false}));m.position.set(Math.sin(i*2.4)*1.7,.5+(i%3)*.65,Math.cos(i*2.4)*1.7);m.scale.setScalar(.7+(i%3)*.23);group.add(m);}
 smokeClouds.push({group,x:player.x,z:player.z,time:6});guards.forEach(g=>{if(Math.hypot(g.x-player.x,g.z-player.z)<6.5){g.detect=0;g.alert=false;g.search=0;g.stun=2.6;}});playSound(150,.4,'sawtooth',.025,-90);toast('Smoke deployed. Make your move.');updateHUD();}
function hit(amount){if(invincible>0)return;hurt(run,amount);invincible=.65;$('damageFlash').style.opacity=1;setTimeout(()=>{$('damageFlash').style.opacity=0;},160);playSound(90,.13,'sawtooth',.045,-40);}
function shoot(g){const start=new THREE.Vector3(g.x,1.15,g.z),end=new THREE.Vector3(player.x,1+jumpY,player.z);const mesh=new THREE.Mesh(new THREE.SphereGeometry(.075,4,4),new THREE.MeshBasicMaterial({color:'#ffc975'}));mesh.position.copy(start);world.add(mesh);projectiles.push({mesh,direction:end.sub(start).normalize(),life:1.3});playSound(700,.065,'square',.018,-520);}
function updatePlayer(dt){
 let ix=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+joy.x;
 let iz=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0)+joy.y;const len=Math.hypot(ix,iz);const moving=len>.07;
 if(len>1){ix/=len;iz/=len;}const sprint=moving&&(keys.ShiftLeft||keys.ShiftRight||(touch&&Math.hypot(joy.x,joy.y)>.85))&&run.stamina>1;
 run.stamina=clamp(run.stamina+(sprint?-16:14)*dt,0,100);const speed=(sprint?7:4.4)*(run.bags? .91:1);const dx=(ix*Math.cos(yaw)+iz*Math.sin(yaw))*speed*dt,dz=(-ix*Math.sin(yaw)+iz*Math.cos(yaw))*speed*dt;
 if(moving){const beforeX=player.x,beforeZ=player.z;moveBody(player,dx,dz,.42,boxes);walked+=Math.hypot(player.x-beforeX,player.z-beforeZ);const target=Math.atan2(dx,dz);let delta=target-player.group.rotation.y;delta=Math.atan2(Math.sin(delta),Math.cos(delta));player.group.rotation.y+=delta*Math.min(1,dt*16);footstep-=dt;if(footstep<=0&&jumpY<.05){playSound(sprint?78:62,.025,'triangle',.025);footstep=sprint?.24:.35;}}
 if(jumpVelocity||jumpY){jumpVelocity-=19*dt;jumpY+=jumpVelocity*dt;if(jumpY<=0){jumpY=0;jumpVelocity=0;}}
 player.group.position.set(player.x,.12+jumpY,player.z);playerRing.position.set(player.x,.135,player.z);playerRing.material.opacity=.55;playerRing.scale.setScalar(1+jumpY*.09);
 animateActor(player,interactionProgress>0?'interact-right':moving?sprint?'sprint':'walk':'idle');
 const laserOn=(totalTime%4.4)<2.6;laser.visible=laserOn;laserGlow.visible=laserOn;laserCooldown-=dt;
 if(laserOn&&Math.abs(player.z+4.8)<.43&&Math.abs(player.x)<2.8&&jumpY<.67&&laserCooldown<=0){hit(12);laserCooldown=1.5;alarm=Math.max(alarm,3.5);toast('Laser tripped! Jump or wait for the gap.');}
 updateInteraction(dt);
}
function updateInteraction(dt){
 pendingAction='';const termDist=Math.hypot(player.x-terminal.x,player.z-terminal.z);const vanDist=Math.hypot(player.x-(vanSpot.x-4),player.z-vanSpot.z);
 if(!run.vaultOpen&&termDist<2)pendingAction='hack';else if(run.bags>0&&vanDist<2.2)pendingAction='extract';
 if(run.vaultOpen){for(const c of coins){if(!c.taken&&Math.hypot(player.x-c.x,player.z-c.z)<1.35){if(collectBag(run)){c.taken=true;c.group.visible=false;c.ring.visible=false;playSound(590,.16,'triangle',.06,450);toast(run.bags===3?'All bags secured. Get to the van!':`Bag ${run.bags}/3 secured. +2,500 points`);updateHUD();}}}}
 if(pendingAction!==lastInteract){interactionProgress=0;lastInteract=pendingAction;}
 if(pendingAction){$('interaction').classList.remove('hidden');$('interactText').innerHTML=`<kbd>E</kbd>${pendingAction==='hack'?'Hold to crack the vault':'Hold to make your getaway'}`;const holding=keys.KeyE===true;if(holding){interactionProgress+=dt/(pendingAction==='hack'?3.5:1.7);$('interactMeter').classList.remove('hidden');$('interactFill').style.width=Math.min(100,interactionProgress*100)+'%';if(Math.floor(interactionProgress*12)!==Math.floor((interactionProgress-dt/3.5)*12))playSound(320+interactionProgress*550,.04,'square',.018);
 if(interactionProgress>=1){if(pendingAction==='hack'){run.vaultOpen=true;vaultCollider.active=false;alarm=5;toast('Vault open. Grab the three cash stacks!');playSound(80,.5,'sawtooth',.035,100);updateHUD();}else if(extract(run)){finishRun(true);}interactionProgress=0;}}
 else{interactionProgress=Math.max(0,interactionProgress-dt*.65);$('interactMeter').classList.toggle('hidden',interactionProgress===0);$('interactFill').style.width=interactionProgress*100+'%';}}
 else{$('interaction').classList.add('hidden');interactionProgress=0;}
}
function updateGuards(dt){
 let detected=false;const inSmoke=smokeClouds.some(c=>Math.hypot(player.x-c.x,player.z-c.z)<3.9);
 for(const g of guards){g.shoot-=dt;g.pathTime-=dt;g.stun=Math.max(0,g.stun-dt);const dist=Math.hypot(player.x-g.x,player.z-g.z),angle=Math.atan2(player.x-g.x,player.z-g.z);const diff=Math.abs(Math.atan2(Math.sin(angle-g.group.rotation.y),Math.cos(angle-g.group.rotation.y)));
 const sees=!inSmoke&&g.stun===0&&dist<8.5&&(diff<.8||dist<2.5||g.alert)&&lineClear(g.x,g.z,player.x,player.z,boxes);
 if(sees){g.detect=clamp(g.detect+dt*1.6,0,1);g.search=3.5;}else{g.detect=clamp(g.detect-dt*.9,0,1);g.search-=dt;}
 if(g.detect>=1)g.alert=true;if(g.search<=0)g.alert=false;
 if(g.alert){detected=true;if(sees&&g.shoot<=0&&dist<7){shoot(g);g.shoot=1.2+Math.random()*.35;}}
 let target=g.alert?{x:player.x,z:player.z}:g.route[g.routeIndex];const targetDist=Math.hypot(target.x-g.x,target.z-g.z);
 if(!g.alert&&targetDist<.9){g.routeIndex=(g.routeIndex+1)%g.route.length;target=g.route[g.routeIndex];}
 let moveTarget=target;if(!lineClear(g.x,g.z,target.x,target.z,boxes)){
  if(g.pathTime<=0){g.path=findPath(g,target,boxes);g.pathTime=.9;}if(g.path.length){if(Math.hypot(g.path[0].x-g.x,g.path[0].z-g.z)<.55)g.path.shift();if(g.path.length)moveTarget=g.path[0];}
 }else g.path=[];
 const mx=moveTarget.x-g.x,mz=moveTarget.z-g.z,ml=Math.hypot(mx,mz),speed=g.stun>0?0:g.alert?3.35:1.65;
 if(ml>.1&&!(g.alert&&dist<2)){moveBody(g,mx/ml*speed*dt,mz/ml*speed*dt,.4,boxes);let a=Math.atan2(mx,mz)-g.group.rotation.y;a=Math.atan2(Math.sin(a),Math.cos(a));g.group.rotation.y+=a*Math.min(1,dt*6);}
 g.group.position.set(g.x,.12,g.z);animateActor(g,g.stun>0?'emote-no':speed>2?'sprint':'walk');
 g.cone.position.set(g.x,.145,g.z);g.cone.rotation.z=g.group.rotation.y-Math.PI/2;g.cone.material.color.set(g.alert?'#f88569':'#eedaa1');g.cone.material.opacity=g.stun>0?0:g.alert?.17:.09;
 g.icon.position.set(g.x,2.5,g.z);g.icon.visible=g.alert||g.detect>.1;g.icon.rotation.y=totalTime*3;g.icon.scale.setScalar(g.alert?1: .6);
 }
 $('alertLabel').classList.toggle('hidden',!detected);alarm=Math.max(0,alarm-dt);
}
function updateEffects(dt){
 for(let i=smokeClouds.length-1;i>=0;i--){const c=smokeClouds[i];c.time-=dt;c.group.rotation.y+=dt*.13;const growth=Math.min(1,(6-c.time)*3);c.group.scale.setScalar(Math.max(.1,growth));c.group.children.forEach((m,j)=>{m.position.y+=Math.sin(totalTime+j)*dt*.06;m.material.opacity=Math.min(.53,c.time*.23);});if(c.time<=0){world.remove(c.group);c.group.traverse(m=>{if(m.isMesh){m.geometry.dispose();m.material.dispose();}});smokeClouds.splice(i,1);}}
 for(let i=projectiles.length-1;i>=0;i--){const p=projectiles[i];p.life-=dt;p.mesh.position.addScaledVector(p.direction,18*dt);if(mode==='playing'&&Math.hypot(p.mesh.position.x-player.x,p.mesh.position.z-player.z)<.65&&Math.abs(p.mesh.position.y-(1+jumpY))<1){hit(9);p.life=0;}
  if(blocked(p.mesh.position.x,p.mesh.position.z,.03,boxes))p.life=0;if(p.life<=0){world.remove(p.mesh);p.mesh.geometry.dispose();p.mesh.material.dispose();projectiles.splice(i,1);}}
 vaultPivot.rotation.y=THREE.MathUtils.damp(vaultPivot.rotation.y,run.vaultOpen?-Math.PI*.53:0,3,dt);
 coins.forEach((c,i)=>{if(!c.taken){c.group.position.y=c.baseY+Math.sin(totalTime*2+i)*.09;c.group.rotation.y=Math.sin(totalTime*.7+i)*.06;c.ring.material.opacity=.35+Math.sin(totalTime*3+i)*.2;}});
 const dest=run.bags>0?{x:vanSpot.x-4,z:vanSpot.z}:run.vaultOpen?coins.find(c=>!c.taken)||terminal:terminal;objectiveMarker.position.set(dest.x,3.7+Math.sin(totalTime*3)*.2,dest.z);objectiveMarker.rotation.y+=dt*.7;
 extractionRing.material.opacity=run.bags>0?.55+Math.sin(totalTime*3)*.2:.15;
 if(totalTime>toastUntil)$('toast').classList.add('hidden');
}
function updateHUD(){
 const sec=Math.max(0,Math.ceil(run.time));$('timer').textContent=String(Math.floor(sec/60)).padStart(2,'0')+':'+String(sec%60).padStart(2,'0');$('timerBox').classList.toggle('urgent',sec<60);$('loot').textContent=run.loot.toLocaleString();$('healthText').textContent=Math.ceil(run.health);$('healthFill').style.width=run.health+'%';$('healthFill').style.background=run.health<35?'#ffa279':'#dfff86';$('staminaFill').style.width=run.stamina+'%';$('smokeCount').textContent=run.smokes+' SMOKE BOMB'+(run.smokes===1?'':'S');$('mobileSmoke').textContent='SMOKE '+run.smokes;
 if(run.bags===3){$('objectiveLabel').textContent='03 / THE GETAWAY';$('objectiveText').textContent='Escape in the van';$('objectiveSub').textContent=touch?'Hold ✦ beside the green ring.':'Hold E beside the green ring.';}
 else if(run.vaultOpen){$('objectiveLabel').textContent='02 / GRAB THE LOOT';$('objectiveText').textContent=`Cash stacks: ${run.bags} / 3`;$('objectiveSub').textContent=run.bags?'Grab more or get to the van.':'Walk over the glowing cash stacks.';}
 else{$('objectiveLabel').textContent='01 / CRACK THE VAULT';$('objectiveText').textContent='Reach the vault terminal';$('objectiveSub').textContent=touch?'Follow the diamond. Hold ✦ to hack.':'Follow the diamond. Hold E to hack.';}
 drawMap();
}
const mapCtx=$('minimap').getContext('2d');
function drawMap(){const c=mapCtx,w=256;c.clearRect(0,0,w,w);c.fillStyle='#1c3037';c.fillRect(0,0,w,w);const x=v=>(v+26)/52*w,z=v=>(v+22)/48*w;
 c.fillStyle='#475b59';c.fillRect(x(-12.5),z(-17.5),25/52*w,22/48*w);c.fillStyle='#738172';c.fillRect(x(-4.5),z(-17),9/52*w,7/48*w);c.fillStyle='#33464c';c.fillRect(0,z(10),w,12/48*w);c.strokeStyle='#6e806b';c.lineWidth=1;c.setLineDash([5,7]);c.beginPath();c.moveTo(0,z(15.6));c.lineTo(w,z(15.6));c.stroke();c.setLineDash([]);
 c.fillStyle='#d0e28e';c.fillRect(x(vanSpot.x)-7,z(vanSpot.z)-4,14,8);
 if(!run.vaultOpen){c.fillStyle='#dfff88';c.fillRect(x(terminal.x)-3,z(terminal.z)-3,6,6);}else for(const coin of coins)if(!coin.taken){c.fillStyle='#e9db8f';c.fillRect(x(coin.x)-2,z(coin.z)-2,4,4);}
 for(const g of guards){c.fillStyle=g.alert?'#ff9670':'#d8ae84';c.beginPath();c.arc(x(g.x),z(g.z),3,0,Math.PI*2);c.fill();}
 c.save();c.translate(x(player.x),z(player.z));c.rotate(-player.group.rotation.y);c.fillStyle='#ddff8b';c.beginPath();c.moveTo(0,5);c.lineTo(-4,-4);c.lineTo(4,-4);c.closePath();c.fill();c.restore();
}
const cameraAim=new THREE.Vector3(0,0,-2),camTarget=new THREE.Vector3(),lookTarget=new THREE.Vector3();
function updateCamera(dt){
 if(mode==='menu'){
  const portrait=innerWidth<600;const orbit=Math.sin(totalTime*.055)*.025;
  camTarget.set(portrait?29:33+orbit*18,portrait?31:29,portrait?43:38);lookTarget.set(portrait?0:-2,0,portrait?-4:-3);
  if(!portrait){lookTarget.x=-4.2;camera.setViewOffset(innerWidth,innerHeight,-innerWidth*.16,0,innerWidth,innerHeight);}else camera.clearViewOffset();
 }else{
  camera.clearViewOffset();const target=new THREE.Vector3(player.x,1.1,player.z);cameraAim.lerp(target,1-Math.exp(-dt*8));const dist=touch?cameraDistance+3:cameraDistance;
  camTarget.set(cameraAim.x+Math.sin(yaw)*Math.cos(pitch)*dist,cameraAim.y+Math.sin(pitch)*dist,cameraAim.z+Math.cos(yaw)*Math.cos(pitch)*dist);lookTarget.copy(cameraAim);lookTarget.y=.5;
 }
 const smoothing=mode===lastMode?1-Math.exp(-dt*(mode==='menu'?2:8)):.8;camera.position.lerp(camTarget,smoothing);camera.lookAt(lookTarget);lastMode=mode;
 // Front signage fades while playing so it never hides the player.
 for(const mesh of fades){mesh.userData.baseOpacity??=mesh.material.opacity;const target=mode==='menu'?mesh.userData.baseOpacity:.18;mesh.material=mesh.userData.uniqueMaterial??(mesh.userData.uniqueMaterial=mesh.material.clone());mesh.material.transparent=true;mesh.material.opacity=THREE.MathUtils.damp(mesh.material.opacity,target,5,dt);mesh.material.depthWrite=mode==='menu';}
}
camera.position.set(33,29,38);camera.lookAt(-4,0,-3);
function tick(){requestAnimationFrame(tick);const dt=Math.min(clock.getDelta(),.05);if(!paused)totalTime+=dt;
 if(ready&&!paused){
  if(mode==='playing'){run.time=Math.max(0,run.time-dt);run.elapsed+=dt;invincible=Math.max(0,invincible-dt);updatePlayer(dt);if(mode==='playing'){updateGuards(dt);updateEffects(dt);if(run.health<=0||run.time<=0){run.phase='lost';finishRun(false);}}if(totalTime-lastHud>.09){updateHUD();lastHud=totalTime;}}
  else if(mode==='menu'){guards.forEach(g=>{const p=g.route[g.routeIndex],dx=p.x-g.x,dz=p.z-g.z,l=Math.hypot(dx,dz);if(l<.2)g.routeIndex=(g.routeIndex+1)%g.route.length;else{moveBody(g,dx/l*dt*.85,dz/l*dt*.85,.4,boxes);g.group.position.set(g.x,.12,g.z);g.group.rotation.y=Math.atan2(dx,dz);animateActor(g,'walk');}g.cone.visible=false;g.icon.visible=false;});updateEffects(dt);}
  for(const g of guards){g.mixer.update(dt);g.cone.visible=mode==='playing';}player.mixer.update(dt);
 }
 if(!paused)updateCamera(dt);renderer.render(scene,camera);
}
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
tick();

// Agent access mirrors the same start/pause controls and reads the live game state.
const context=document.modelContext;
if(context?.registerTool){const lifecycle=new AbortController();const register=tool=>{try{Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
 register({name:'read_heist_state',title:'Read current heist',description:'Read the visible heist mode, objective, remaining time, health, and practice score.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(input&&Object.keys(input).length)throw new Error('No parameters accepted.');return{mode,paused,ready,secondsRemaining:Math.ceil(run.time),health:run.health,bags:run.bags,lootPoints:run.loot,vaultOpen:run.vaultOpen,livePayouts:false};}});
 register({name:'start_heist_run',title:'Start a practice heist',description:'Start the solo practice heist, replacing any current run, using the same Start a heist action.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:false},execute(input){if(input&&Object.keys(input).length)throw new Error('No parameters accepted.');if(!ready)throw new Error('Game assets are still loading.');startRun();return{mode,secondsRemaining:300,livePayouts:false};}});
 addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
}
