import assert from 'node:assert/strict';import fs from 'node:fs';
import * as THREE from '../dist/assets/three.module.js';
import {GLTFLoader} from '../dist/assets/GLTFLoader.js';
import {loadVehiclePack} from '../dist/vehicles.js?v=36';
import {createNeighborhood} from '../dist/world-client.js';
import worker from '../worker/index.js';import {localD1} from './d1-local.mjs';
const nodes=new Map();
class Element{
 constructor(id=''){this.id=id;this.dataset={};this.style={};this.classes=new Set();this.classList={add:(c)=>this.classes.add(c),remove:(c)=>this.classes.delete(c),contains:c=>this.classes.has(c),toggle:(c,on)=>on?this.classes.add(c):this.classes.delete(c)};}
 set innerHTML(html){this.html=html;for(const m of html.matchAll(/<([\w-]+)([^>]*?)>/g)){const a=m[2],id=/\bid="([^"]+)"/.exec(a)?.[1];if(!id)continue;const e=new Element(id);for(const d of a.matchAll(/data-([\w-]+)="([^"]+)"/g))e.dataset[d[1].replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=d[2];nodes.set(id,e);}}
 get innerHTML(){return this.html||'';}
}
const ctx=new Proxy({},{get:(o,k)=>o[k]||(()=>{})});
for(const id of ['worldButton','worldTarget','modalRoot'])nodes.set(id,new Element(id));
globalThis.document={hidden:false,getElementById:id=>nodes.get(id)||null,querySelectorAll:()=>[],createElement:()=>({width:0,height:0,getContext:()=>ctx})};globalThis.addEventListener=()=>{};
globalThis.self=globalThis;globalThis.createImageBitmap=async()=>({width:1,height:1,close(){}});
const loader={loadAsync:async url=>{const file=new URL('../dist'+url,import.meta.url),b=fs.readFileSync(file);return new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');}};
await loadVehiclePack(loader);
const DB=localD1(),origin='https://getaway.test',env={DB,ASSETS:{fetch:()=>new Response('static')}};
let user='a',now=Date.now();const clock=Date.now,oldFetch=globalThis.fetch;Date.now=()=>now;
globalThis.fetch=async(url,options={})=>{if(typeof url!=='string'||!url.startsWith('/api/'))return oldFetch(url,options);const identity=user;return worker.fetch(new Request(origin+url,{...options,headers:{origin,'oai-authenticated-user-id':identity,...options.headers}}),env,{});};
const positionA={mode:'driving',x:36,z:54,heading:0,carId:'hatch',speed:0},positionB={mode:'driving',x:42,z:54,heading:1,carId:'coupe',speed:0};
let notifications=[],levels=[],routed=null;const root=new THREE.Group();
const create=(position)=>createNeighborhood({world:root,state:()=>position,canOpen:()=>true,pause(){},close(){nodes.get('modalRoot').classes.clear()},modal(html){nodes.get('modalRoot').innerHTML=html;nodes.get('modalRoot').classes.clear();},homeChanged:h=>levels.push(h?.level),notify:n=>notifications.push(n),cruise(){},routeTo:p=>{routed=p},goHome(){},jobCompleted(){}});
async function profile(id){user=id;const result=await fetch('/api/profile',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify({name:'Player '+id,avatar:'jules',status:'at-home',note:'',homeId:'last-exit'})});assert.equal(result.status,200);}
const settle=()=>new Promise(resolve=>setImmediate(resolve));
try{
 await profile('a');await profile('b');const a=create(positionA),b=create(positionB);
 user='a';await a.join();user='b';await b.join(a.room());assert.equal(a.room(),b.room());
 async function tick(client,id){now+=1400;user=id;client.update(.016);await settle();client.update(.016);}
 await tick(a,'a');await tick(b,'b');await tick(a,'a');
 assert.equal(a.peers().length,1);assert.equal(a.peers()[0].name,'Player b');assert.equal(a.peers()[0].carId,'coupe');assert.equal(b.peers()[0].carId,'hatch');
 assert.equal(root.children.filter(p=>p.userData.playerId).length,2,'real remote car meshes created');
 root.updateMatrixWorld(true);root.traverse(o=>assert(o.matrixWorld.elements.every(Number.isFinite),'remote transforms remain finite'));
 positionB.x=50;await tick(b,'b');await tick(a,'a');assert.equal(a.peers()[0].x,50,'server position reaches other client');
 user='a';a.open('home');assert(nodes.get('modalRoot').innerHTML.includes('Garden retreat'));assert(nodes.get('modalRoot').innerHTML.includes('120 HOME CR'));
 user='a';a.open('jobs');assert(nodes.get('modalRoot').innerHTML.includes('Flowers for the neighbors'));
 user='b';await b.leave();await tick(a,'a');assert.equal(a.peers().length,0);assert.equal(root.children.filter(p=>p.userData.playerId).length,0,'leaving removes remote cars and name labels');
 user='a';await a.leave();assert(!a.connected());assert(levels.includes(0));assert(notifications.some(n=>n.startsWith('WELCOME HOME')));
 console.log('PASS: two clients exchange live positions through the Worker, render real cars/name labels with finite transforms, open home/job boards, and remove peers on leave.');
}finally{Date.now=clock;globalThis.fetch=oldFetch;DB.close();}
