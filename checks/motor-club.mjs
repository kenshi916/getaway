import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {localD1} from './d1-local.mjs';
const DB=localD1(),env={DB,ASSETS:{fetch:()=>new Response('static')}},origin='https://getaway.test',realNow=Date.now;let now=realNow();Date.now=()=>now;const users={};
async function call(u,path,body,method=body?'POST':'GET'){const r=await worker.fetch(new Request(origin+'/api/'+path,{method,headers:{origin,'oai-authenticated-user-id':u,'content-type':'application/json'},body:body?JSON.stringify({...body,session:users[u]?.session}):undefined}),env,{});return {status:r.status,...await r.json()};}
async function move(u,x,z,extra={}){now+=1600;const r=await call(u,'world/sync',{seq:++users[u].seq,x,z,heading:0,mode:'driving',carId:'coupe',...extra});assert.equal(r.status,200,JSON.stringify(r));return r;}
async function pose(u,x,z){return move(u,-90,36,{mode:'destination',venue:'motor-club',travel:'foot',local:{x,z}});}
try{
 for(const u of ['a','b','c']){await call(u,'profile',{name:'Driver '+u,avatar:'jules',status:'at-home',homeId:'last-exit',note:''},'PUT');users[u]={...await call(u,'world/join',u==='a'?{}:{roomId:users.a.roomId}),seq:0};}
 assert.equal((await call('a','world/interior',{mode:'destination',venue:'motor-club'})).status,409,'remote entry rejected');
 for(const u of ['a','b']){await move(u,36,54);await move(u,-40,54);await move(u,-90,36);assert.equal((await call(u,'world/interior',{mode:'destination',venue:'motor-club'})).status,200);await pose(u,0,6);}
 let peers=await pose('a',0,6);assert(peers.players.some(p=>p.id===users.b.profile.id&&p.venue==='motor-club'),'same venue membership');
 await call('a','neighborhood/chat',{text:'Meet by the parts counter'});assert.equal((await call('b','neighborhood/social')).scope,'club:motor-club');assert.equal((await call('b','neighborhood/social')).messages.length,1);assert.equal((await call('c','neighborhood/social')).messages.length,0,'club chat does not leak outside');
 assert.equal((await call('a','club/table',{table:1,action:'sit',revision:0})).status,409,'workshop players cannot use casino tables');
 assert.equal((await call('a','neighborhood/car',{parts:['kit-street'],plate:'CUSTOM'})).status,400,'unowned parts rejected');
 let purchase=await call('a','neighborhood/buy',{kind:'part',id:'paint-coral'});assert.equal(purchase.credits,40);
 assert.equal((await call('a','neighborhood/car',{parts:['paint-coral'],plate:'RAE01'})).status,200);peers=await pose('b',0,6);const ride=peers.players.find(p=>p.id===users.a.profile.id);assert.equal(ride.carStyle.paint,'#f16d60');assert.equal(ride.carStyle.plate,'RAE01');
 assert.equal((await call('a','neighborhood/motor-seat',{id:'seat-0'})).status,409,'must reach seat');await pose('a',-11,10);assert.equal((await call('a','neighborhood/motor-seat',{id:'seat-0'})).status,200);await pose('b',-11,10);assert.equal((await call('b','neighborhood/motor-seat',{id:'seat-0'})).status,409,'one player per seat');assert.equal((await pose('b',-9,10)).players.find(p=>p.id===users.a.profile.id).emote,'sit:seat-0');
 await pose('a',-11,8);assert.equal((await pose('b',-9,10)).players.find(p=>p.id===users.a.profile.id).emote,'','walking clears seated pose');
 const crew=await call('a','neighborhood/coop',{action:'create',id:'motor-parts-run'});assert.equal(crew.status,200);assert.equal((await call('b','neighborhood/coop',{action:'join',contract:crew.id})).status,200);
 assert.equal((await call('a','neighborhood/coop',{action:'start',contract:crew.id})).status,409,'crew must gather outside');
 for(const u of ['a','b'])await move(u,-90,36);
 assert.equal((await call('a','neighborhood/coop',{action:'start',contract:crew.id})).status,200);
 // Both vehicles move together through the actual validated sync API.
 for(const target of [{x:-180,z:-198},{x:-90,z:36}]){
  const current=await DB.prepare('SELECT x,z FROM world_members WHERE profile_id=?').bind(users.a.profile.id).first();const steps=4;
  for(let i=1;i<=steps;i++)for(const u of ['a','b'])await move(u,current.x+(target.x-current.x)*i/steps,current.z+(target.z-current.z)*i/steps);
  const checkpoint=await call('a','neighborhood/coop',{action:'checkpoint',contract:crew.id});assert.equal(checkpoint.status,200,JSON.stringify(checkpoint));
 }
 for(const u of ['a','b']){const before=await call(u,'neighborhood'),reward=await call(u,'neighborhood/coop',{action:'claim',contract:crew.id});assert.equal(reward.credits,before.credits+150);assert.equal(reward.state.xp.mechanic,50);assert.equal((await call(u,'neighborhood/coop',{action:'claim',contract:crew.id})).credits,reward.credits,'reward once only');}
 console.log('PASS: physical Motor Club entry, shared membership, scoped chat, casino isolation, owned customization and synchronized styles, exclusive seats, movement clearing poses, full two-player convoy, and once-only rewards.');
}finally{Date.now=realNow;DB.close();}
