import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {localD1} from './d1-local.mjs';
import {CLUB,TABLES} from '../dist/club-catalog.mjs';
const DB=localD1(),env={DB,ASSETS:{fetch:()=>new Response('static')}},origin='https://getaway.test',clock=Date.now;let now=clock();Date.now=()=>now;
const sessions={};
async function call(user,path,body,method=body?'POST':'GET'){const response=await worker.fetch(new Request(origin+'/api/'+path,{method,headers:{origin,'oai-authenticated-user-id':user,'content-type':'application/json'},body:body?JSON.stringify({...body,session:sessions[user]?.session}):undefined}),env,{});return {status:response.status,...await response.json()};}
try{
 for(const user of ['arrival','walk']){assert.equal((await call(user,'profile',{name:user+' player',avatar:'jules',status:'at-home',homeId:'last-exit',note:''},'PUT')).status,200);}
 assert.equal((await call('arrival','world/join',{venue:'private-home'})).status,400);
 sessions.arrival=await call('arrival','world/join',{venue:CLUB.id,carId:'hatch'});assert.equal(sessions.arrival.status,200);
 let room=await call('arrival','club');assert(room.inside);assert.equal(room.tables.length,6);assert.equal(room.account.chips,500);
 let member=await DB.prepare('SELECT * FROM world_members WHERE profile_id=?').bind(sessions.arrival.profile.id).first();assert.equal(member.x,CLUB.x);assert.equal(member.mode,'destination');
 let presence=await DB.prepare('SELECT * FROM neighborhood_presence WHERE profile_id=?').bind(member.profile_id).first();assert.equal(presence.local_z,CLUB.spawn.z);
 // Every new table uses the same server-validated proximity and single-seat rules.
 for(const t of TABLES){now+=1000;await call('arrival','world/sync',{seq:t.id,x:54,z:36,heading:0,mode:'destination',venue:CLUB.id,travel:'foot',local:{x:t.x,z:t.z+3},carId:'hatch'});room=await call('arrival','club');let table=room.tables.find(v=>v.id===t.id);assert.equal((await call('arrival','club/table',{table:t.id,action:'sit',revision:table.revision})).status,200);room=await call('arrival','club');table=room.tables.find(v=>v.id===t.id);assert.equal((await call('arrival','club/table',{table:t.id,action:'leave',revision:table.revision})).status,200);}
 sessions.walk=await call('walk','world/join',{roomId:sessions.arrival.roomId});assert.equal((await call('walk','world/interior',{mode:'destination',venue:CLUB.id,entry:{x:54,z:36}})).status,409,'cannot skip travel from a private interior');
 let seq=0;async function move(x,z,travel='car'){now+=1500;const r=await call('walk','world/sync',{seq:++seq,x,z,heading:0,mode:'driving',travel,carId:'van'});assert.equal(r.status,200,JSON.stringify(r));}
 await move(36,54);await move(54,51);assert.equal((await call('walk','world/interior',{mode:'destination',venue:CLUB.id})).status,409,'old sample is outside the entry radius');
 // The fresh door position is accepted between position broadcasts, including on foot.
 assert.equal((await call('walk','world/interior',{mode:'destination',venue:CLUB.id,entry:{x:54,z:39}})).status,200);
 await move(54,39,'foot');await move(54,50.5,'foot');assert.equal((await call('walk','world/interior',{mode:'destination',venue:CLUB.id,entry:{x:58,z:40}})).status,200);
 assert.equal((await call('walk','club')).inside,true);
 console.log('PASS: solo-to-shared venue joins, valid canonical spawn, six playable tables, fresh door positions, foot entry, and remote-entry rejection.');
}finally{Date.now=clock;DB.close();}
