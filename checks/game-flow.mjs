import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';
import * as RealThree from '../dist/assets/three.module.js';
import {mergeGeometries} from '../dist/assets/BufferGeometryUtils.js';
import {makeVehicle,animateVehicle,loadVehiclePack} from '../dist/vehicles.js';
import {loadCityPack,buildCity} from '../dist/city.js';
import * as core from '../dist/driving.mjs';
import {SKINS,DRIVERS,BURN_CARS,ownsItem} from '../dist/collection.mjs';
import {createCollectionUI} from '../dist/collection-ui.js';
import {createBurnWallet} from '../dist/burn-wallet.mjs';
import {buildApartment,HOME_SPAWN,HOME_SPOTS} from '../dist/apartment.js';
import {captureShift,restoreShift} from '../dist/progress.mjs';
import {GLTFLoader as RealGLTFLoader} from '../dist/assets/GLTFLoader.js';
const ids=new Map();let document;
const canvasContext=new Proxy({createLinearGradient:()=>({addColorStop(){}}),createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)})},{get:(o,k)=>o[k]||(()=>{})});
class Element{
 constructor(tag='div',id=''){this.tagName=tag;this.id=id;this.style={};this.dataset={};this.children=[];this._class='';this.events={};if(id)ids.set(id,this);this.classList={add:(...x)=>{this._class+=' '+x.join(' ')},remove:(...x)=>{this._class=this._class.split(/\s+/).filter(c=>!x.includes(c)).join(' ')},contains:c=>this._class.split(/\s+/).includes(c),toggle:(c,b)=>{if(b??!this.classList.contains(c))this.classList.add(c);else this.classList.remove(c)}};}
 set className(v){this._class=v}get className(){return this._class}
 set innerHTML(html){this._html=html;this.children=[];for(const m of html.matchAll(/<([\w-]+)([^>]*?)>/g)){const a=m[2],id=/\bid="([^"]*)"/.exec(a)?.[1]||'',e=new Element(m[1],id);e.className=/\bclass="([^"]*)"/.exec(a)?.[1]||'';for(const d of a.matchAll(/data-([\w-]+)(?:="([^"]*)")?/g))e.dataset[d[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=d[2]||'';e.disabled=/\sdisabled(?:\s|$)/.test(a);this.children.push(e)}}get innerHTML(){return this._html||''}
 querySelectorAll(s){return this.children.filter(e=>{if(s.startsWith('[data-'))return Object.hasOwn(e.dataset,s.slice(6,-1).replace(/-([a-z])/g,(_,c)=>c.toUpperCase()));if(s.startsWith('.'))return e.classList.contains(s.slice(1));return e.tagName==='button'&&!e.disabled})}querySelector(s){return this.querySelectorAll(s)[0]||null}
 appendChild(e){this.children.push(e)}replaceChildren(...elements){this.children=elements}remove(){this.removed=true}get clientWidth(){return 1120}get clientHeight(){return 490}setAttribute(k,v){this[k]=v}focus(){document.activeElement=this}addEventListener(k,v){this.events[k]=v}setPointerCapture(){}getContext(){return canvasContext}toDataURL(){return 'data:image/png;base64,AA=='}
}
new Element('div','game');new Element('div','ui');document={getElementById:id=>{assert(ids.has(id),'DOM element '+id);return ids.get(id)},createElement:tag=>new Element(tag),addEventListener(){},querySelectorAll:s=>[...ids.values()].flatMap(e=>e.querySelectorAll(s))};
globalThis.document=document;
class Renderer{constructor(){this.domElement=new Element('canvas');this.shadowMap={}}setPixelRatio(){}setSize(){}render(s,c){s.updateMatrixWorld();c.updateMatrixWorld();Renderer.lastScene=s}dispose(){}forceContextLoss(){}getRenderTarget(){return this.target}setRenderTarget(t){this.target=t}readRenderTargetPixels(){}}
class Loader{async loadAsync(url){if(url.includes("/rgsdev/")||url.includes("/city/")||/\/(desk|monitor|keyboard|office-chair|office-cabinet|potted-plant|cardboard-box)\.glb$/.test(url)){const b=fs.readFileSync(new URL("../dist"+url,import.meta.url));return new RealGLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),"");}const scene=new RealThree.Group();const mesh=new RealThree.Mesh(new RealThree.BoxGeometry(.3,.6,.3),new RealThree.MeshStandardMaterial());mesh.name='body';scene.add(mesh);return{scene,animations:['idle','walk'].map(name=>new RealThree.AnimationClip(name,1,[]))}}}
const saved=new Map();let callback;const context={...core,SKINS,DRIVERS,BURN_CARS,ownsItem,createCollectionUI,createBurnWallet,THREE:{...RealThree,WebGLRenderer:Renderer,Clock:class{getDelta(){return 1/60}}},GLTFLoader:Loader,mergeGeometries,makeVehicle,animateVehicle,loadVehiclePack,loadCityPack,buildCity,buildApartment,HOME_SPAWN,captureShift,restoreShift,document,localStorage:{getItem:k=>saved.get(k),setItem:(k,v)=>saved.set(k,v)},matchMedia:()=>({matches:false}),devicePixelRatio:1,innerWidth:1280,innerHeight:800,addEventListener(){},requestAnimationFrame:f=>{callback=f},setTimeout(){},console,AbortController,Uint8Array,Uint8ClampedArray};context.window=context;vm.createContext(context);
const source=fs.readFileSync(new URL('../dist/getaway.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'');
const application=source+`;this.bridge={start:startRun,garage:showGarage,close:closeModal,pause:showPause,jobs:showJobs,bank,menu:returnMenu,route:toggleGarageRoute,get:()=>({ready,mode,paused,player,run,profile,bankReady,pickups,cityState,residents,apartment,bankRoute,playerView}),interact:interactHome,leave:leaveApartment,resume:resumeRun,save:saveProfile,input:(value)=>{keys=value},reloadProfile:()=>{profile=cleanProfile(JSON.parse(localStorage.getItem('getaway-profile-v1')))},teleport:(p)=>{Object.assign(player,{x:p.x,z:p.z,vx:0,vz:0,speed:0,y:0,vy:0,yawRate:0,steering:0});},fund:()=>{profile.credits=20000}}`;vm.runInContext(application,context);
await new Promise(resolve=>setImmediate(resolve));const b=context.bridge;assert(b.get().ready,'assets ready');
const city=b.get().cityState;assert.equal(city.buildings.length,core.BLOCKS.length);assert.equal(city.buildingBounds.length,92);assert.equal(b.get().residents.length,12);
for(const {bounds,block}of city.buildingBounds){assert(bounds.min.x>=block.x-block.w/2-1e-5&&bounds.max.x<=block.x+block.w/2+1e-5,'building stays inside horizontal collision boundary');assert(bounds.min.z>=block.z-block.d/2-1e-5&&bounds.max.z<=block.z+block.d/2+1e-5,'building stays inside depth collision boundary');}
const fadeMaterials=new Set();for(const building of city.buildings)for(const material of building.materials){assert(!fadeMaterials.has(material),'camera fading cannot affect another block');fadeMaterials.add(material);}
let meshes=0,triangles=0;city.stage.traverse(o=>{if(!o.isMesh)return;meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;for(const a of Object.values(o.geometry.attributes))assert([...a.array].every(Number.isFinite),'finite city geometry');});
assert.equal(b.get().mode,'apartment','new players start inside their home');
assert.equal(b.get().profile.tutorialStep,0);b.start();assert.equal(b.get().mode,'apartment','the briefing gates the first shift');
const home=b.get().apartment;callback();assert.equal(Renderer.lastScene,home.scene);
for(const [w,h]of [[1280,800],[390,844],[375,667],[320,568],[844,390]]){home.resize(w,h);home.camera.updateMatrixWorld();for(const x of [-6,6])for(const z of [-5,5]){const p=new RealThree.Vector3(x,0,z).project(home.camera);assert(Math.abs(p.x)<1&&Math.abs(p.y)<1,'room floor fits '+w+'x'+h);}}home.resize(1280,800);
const spawnZ=home.avatar.position.z;ids.get('homeUp').events.pointerdown({preventDefault(){},pointerId:1});for(let i=0;i<6;i++)callback();ids.get('homeUp').events.pointercancel();const touchZ=home.avatar.position.z;callback();assert(touchZ<spawnZ&&home.avatar.position.z===touchZ,'touch controls move and release');home.setPosition(HOME_SPAWN);
home.scene.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite),'finite apartment transforms'));
// Flood-fill walkable floor to verify every interactive object can be reached.
const reachable=[{...HOME_SPAWN}],visited=new Set(['0,0']);
for(let i=0;i<reachable.length;i++){const p=reachable[i];for(const [dx,dz]of [[.2,0],[-.2,0],[0,.2],[0,-.2]]){const next={x:p.x+dx,z:p.z+dz},key=Math.round((next.x-HOME_SPAWN.x)*5)+','+Math.round((next.z-HOME_SPAWN.z)*5);if(!visited.has(key)&&!home.blocked(next.x,next.z)){visited.add(key);reachable.push(next);}}}
for(const spot of HOME_SPOTS)assert(reachable.some(p=>Math.hypot(p.x-spot.x,p.z-spot.z)<1.2),'reachable '+spot.id);
assert(home.blocked(3.25,-2.6),'bed blocks movement');assert(home.blocked(6,2),'room boundary blocks movement');
b.input({KeyD:true});for(let i=0;i<55;i++)callback();b.input({});assert.equal(b.get().profile.tutorialStep,1,'walking teaches movement');
home.setPosition({x:-2.1,z:-2.05});b.interact();assert.equal(b.get().profile.tutorialStep,2);assert(b.get().paused);assert(ids.get('modalRoot').innerHTML.includes('24-hour diner'));b.close();
home.setPosition({x:3.85,z:.8});b.interact();assert(ids.get('modalRoot').innerHTML.includes('data:image/png'),'wardrobe opens model previews');b.close();
home.setPosition({x:1,z:-.5});b.interact();assert(ids.get('modalRoot').innerHTML.includes('ALL SAVED.'));b.close();
home.setPosition({x:4.65,z:2.65});b.interact();assert.equal(b.get().mode,'driving');assert.equal(b.get().profile.tutorialStep,3);
const residentStart=b.get().residents[0].group.position.clone();for(let i=0;i<3;i++)callback();assert(b.get().residents[0].group.position.distanceTo(residentStart)>0,'resident walks');
console.log(`City checks passed: ${city.buildingBounds.length} fitted buildings; isolated fading; walking residents. Scene: ${meshes} meshes, ${Math.round(triangles)} triangles.`);
b.jobs();assert(b.get().paused);b.close();
const stop=b.get().pickups.find(x=>x.stop.id==='diner');b.teleport(stop.stop);for(let i=0;i<65;i++)callback();assert.equal(b.get().run.passengers.length,1,'pick up passenger');assert.equal(b.get().profile.tutorialStep,4);
const passengerId=b.get().run.passengers[0].id,remaining=b.get().run.time;b.pause();ids.get('quitBtn').onclick();assert.equal(b.get().mode,'apartment');for(let i=0;i<220;i++)callback();assert.equal(b.get().run.time,remaining,'the timer stops at home');
const onDisk=JSON.parse(saved.get('getaway-profile-v1'));assert.equal(onDisk.checkpoint.run.passengerIds[0],passengerId);assert.equal(onDisk.home.x,4.65);
const restored=restoreShift(onDisk.checkpoint,core.cleanProfile(onDisk));assert(restored);assert.equal(restored.run.time,remaining);assert.equal(restored.run.passengers[0].id,passengerId);
for(const corrupt of [null,{...onDisk.checkpoint,carId:'bogus'},{...onDisk.checkpoint,run:{...onDisk.checkpoint.run,passengerIds:['missing']}},{...onDisk.checkpoint,jobs:[]},{...onDisk.checkpoint,jobs:onDisk.checkpoint.jobs.map((j,i)=>i===0?null:j)},{...onDisk.checkpoint,car:{...onDisk.checkpoint.car,x:Infinity}},{...onDisk.checkpoint,run:{...onDisk.checkpoint.run,time:0}}])assert.equal(restoreShift(corrupt,core.cleanProfile(onDisk)),null,'invalid checkpoints rejected');
b.reloadProfile();b.resume();assert.equal(b.get().mode,'driving');assert.equal(b.get().run.time,remaining);assert.equal(b.get().run.passengers[0].id,passengerId);assert.equal(b.get().player.x,stop.stop.x);
b.teleport(b.get().run.passengers[0].dest);for(let i=0;i<65;i++)callback();assert.equal(b.get().run.deliveries,1);assert.equal(b.get().profile.tutorialStep,5);assert(b.get().bankRoute,'tutorial routes first delivery home');
b.teleport(core.HOME);for(let i=0;i<5;i++)callback();assert(b.get().bankReady);b.bank();assert.equal(b.get().profile.credits,850);assert.equal(b.get().profile.tutorialStep,6);assert.equal(JSON.parse(saved.get('getaway-profile-v1')).checkpoint,null,'bank clears the shift in the same save');
b.bank();assert.equal(b.get().profile.credits,850,'settlement cannot be duplicated');ids.get('againBtn').onclick();assert.equal(b.get().mode,'apartment');b.reloadProfile();assert.equal(b.get().profile.credits,850);assert.equal(b.get().profile.tutorialStep,6);
b.fund();b.garage();let card=document.querySelectorAll('[data-car]').find(x=>x.dataset.car==='coupe');assert(card.onclick);card.onclick();ids.get('collectionEquip').onclick();assert.equal(b.get().profile.selected,'coupe');assert.equal(b.get().profile.credits,14000);document.querySelectorAll('[data-collection-tab]').find(x=>x.dataset.collectionTab==='skins').onclick();const paint=document.querySelectorAll('[data-paint]').find(x=>x.dataset.paint==='2');paint.onclick();assert.equal(b.get().profile.paint,2);ids.get('garageDrive').onclick();assert.equal(b.get().mode,'apartment');b.leave();assert.equal(b.get().player.config.id,'coupe');b.pause();assert(b.get().paused);b.close();for(let i=0;i<5;i++)callback();
console.log('Apartment and gameplay simulation passed: reachable furniture, walking tutorial, laptop, wardrobe, bedside save, door, first fare, suspended timer, serialized shift resume, delivery, banking, retained progress, garage, and pause. Renderer and DOM simulated; no browser QA.');

// Exercise the visible collection: inspect, cancel, burn, equip, and keep the loadout.
b.menu();b.garage();const chooseTab=id=>document.querySelectorAll('[data-collection-tab]').find(x=>x.dataset.collectionTab===id).onclick();const chooseItem=id=>document.querySelectorAll('[data-collection-item]').find(x=>x.dataset.collectionItem===id).onclick();
chooseTab('cars');chooseItem('hatch');ids.get('collectionEquip').onclick();assert(ids.get('modalRoot').innerHTML.includes('NO REAL TOKENS'));ids.get('burnCancel').onclick();assert.equal(b.get().profile.collection.balance,25000,'cancel spends nothing');
ids.get('collectionEquip').onclick();await ids.get('burnConfirm').onclick();assert.equal(b.get().profile.selected,'hatch');assert(b.get().profile.unlocked.includes('hatch'));assert.equal(b.get().profile.collection.balance,22500);assert.equal(ids.get('collectionEquip').disabled,true);
chooseTab('skins');chooseItem('afterglow');ids.get('collectionEquip').onclick();await ids.get('burnConfirm').onclick();assert.equal(b.get().profile.collection.skin,'afterglow');
let painted=0;b.get().playerView.root.traverse(o=>{if(o.isMesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.name==='paint'){assert.equal(m.color.getHexString(),'27e3c1');painted++;}});assert(painted>0,'equipped skin reaches the actual player model');
const oldCharacter=b.get().apartment.avatar.children[0];chooseTab('drivers');chooseItem('robber');ids.get('collectionEquip').onclick();await ids.get('burnConfirm').onclick();assert.equal(b.get().profile.collection.driver,'robber');assert.notEqual(b.get().apartment.avatar.children[0],oldCharacter,'equipped driver replaces the apartment character');
assert.equal(b.get().profile.collection.balance,21000);assert.equal(b.get().profile.collection.history.length,3);assert.equal(b.get().profile.credits,14000,'demo burns do not spend banked credits');ids.get('garageDrive').onclick();b.start();assert.equal(b.get().player.config.id,'hatch');
console.log('Collection simulation passed: cancel is free, three demo burns debit exact costs, new car / finish / driver equip in-game, and banked credits stay intact.');

// A fresh application context must read the same persisted state and still open at home.
Object.assign(b.get().player,{health:67,nitro:42});Object.assign(b.get().run,{wanted:2,heat:1.7});b.save();const beforeReload=JSON.parse(saved.get('getaway-profile-v1'));
const freshContext={...context};freshContext.window=freshContext;vm.createContext(freshContext);vm.runInContext(application,freshContext);await new Promise(resolve=>setImmediate(resolve));const fresh=freshContext.bridge;
assert(fresh.get().ready);assert.equal(fresh.get().mode,'apartment');assert.equal(fresh.get().profile.tutorialStep,6);assert.equal(fresh.get().profile.credits,14000);assert.equal(fresh.get().profile.checkpoint.carId,'hatch');assert.equal(fresh.get().profile.collection.balance,21000);assert.equal(fresh.get().profile.collection.skin,'afterglow');assert.equal(fresh.get().profile.collection.driver,'robber');
ids.get('homeResume').onclick();assert.equal(fresh.get().mode,'driving');assert.equal(fresh.get().player.config.id,'hatch');assert.equal(fresh.get().player.health,67);assert.equal(fresh.get().player.nitro,42);assert.equal(fresh.get().run.wanted,2);assert.equal(fresh.get().run.time,beforeReload.checkpoint.run.time);
const write=freshContext.localStorage.setItem;freshContext.localStorage.setItem=()=>{throw new Error('Storage blocked')};assert.equal(fresh.save(),false);assert.equal(ids.get('homeSave').textContent,'SAVING UNAVAILABLE');freshContext.localStorage.setItem=write;
console.log('Reload and persistence checks passed: the full app starts at home from a saved profile, resumes car / timer / heat, and handles unavailable storage.');

// Exercise the website's actual model loaders, vehicle preview creation and view buttons.
const websiteRoot=new Element('main','website');websiteRoot.innerHTML=fs.readFileSync(new URL('../dist/index.html',import.meta.url),'utf8');
context.Image=class extends Element{constructor(){super('img')}};
context.ResizeObserver=class{constructor(callback){this.callback=callback}observe(){this.callback()}disconnect(){}};
context.IntersectionObserver=class{constructor(callback){this.callback=callback}observe(target){this.callback([{target,isIntersecting:true}])}disconnect(){}};
const showcaseSource=fs.readFileSync(new URL('../dist/showcase.js',import.meta.url),'utf8').replace(/^import .*\n/gm,'').replace('export async function startShowcase','async function startShowcase');
vm.runInContext(showcaseSource+';this.startShowcase=startShowcase;',context);await context.startShowcase();
const cards=document.querySelectorAll('[data-car-preview]');assert.equal(cards.length,6);for(const card of cards)assert(card.children[0].src.startsWith('data:image/png'),'actual car preview created');
for(const button of document.querySelectorAll('[data-view]')){button.events.click();for(let i=0;i<8;i++)callback(1000+i*40);assert(ids.get('districtTitle').textContent.length>0);Renderer.lastScene.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite),'finite website scene transforms'));}
console.log('Website simulation passed: city loads, six model previews render, district buttons change views, and scene transforms stay finite.');
