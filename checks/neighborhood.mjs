import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {localD1} from './d1-local.mjs';
import {HOMES} from '../dist/social-catalog.mjs';
import {HOME_UPGRADES,NEIGHBORHOOD_JOBS,WORLD_TTL,ROOM_CAPACITY} from '../dist/world-catalog.mjs';
const DB=localD1(),env={DB,ASSETS:{fetch:()=>new Response('static')}},origin='https://getaway.test',originalNow=Date.now;
let now=originalNow();Date.now=()=>now;
const step=(ms=1300)=>{now+=ms;};
async function call(user,path,method='GET',body,extra={}){const headers={origin,...extra};if(user)headers['oai-authenticated-user-id']=user;if(body!==undefined)headers['content-type']='application/json';const response=await worker.fetch(new Request(origin+'/api/'+path,{method,headers,body:body!==undefined?JSON.stringify(body):undefined}),env,{});return {status:response.status,data:await response.json()};}
async function profile(user){const result=await call(user,'profile','PUT',{name:'Driver '+user,avatar:'jules',status:'at-home',note:'',homeId:'last-exit'});assert.equal(result.status,200);}
async function join(user,roomId){const result=await call(user,'world/join','POST',roomId?{roomId}:{});assert.equal(result.status,200,JSON.stringify(result));return {...result.data,seq:0};}
async function sync(user,client,pos,extra={}){step();return call(user,'world/sync','POST',{session:client.session,seq:++client.seq,mode:'driving',carId:'hatch',heading:0,...pos,...extra});}
try{
 assert.equal((await call(null,'world')).status,401);
 assert.equal((await call('a','world/join','POST',{})).status,409);
 assert.equal((await call('a','world/join','POST',{}, {origin:'https://other.test'})).status,403);
 await profile('a');await profile('b');await profile('c');
 assert.equal((await call('a','world/join','POST',null)).status,400);
 const a=await join('a'),b=await join('b',a.roomId);
 assert.equal(a.roomId,b.roomId);assert(a.home.unit>0);assert(HOMES.some(h=>h.id===a.home.homeId));assert.equal(a.home.credits,120);
 const moveA=await sync('a',a,{x:36,z:54});assert.equal(moveA.status,200);assert.equal(moveA.data.players.length,2);
 const moveB=await sync('b',b,{x:40,z:54});assert.equal(moveB.status,200);const seen=moveB.data.players.find(p=>p.id===a.profile.id);assert.equal(seen.carId,'hatch');assert.equal(seen.x,36);assert.equal(seen.name,'Driver a');
 for(const p of moveB.data.players){assert.equal(p.owner_id,undefined);assert.equal(p.session,undefined);assert.equal(p.friendCode,undefined);assert.equal(p.credits,undefined);assert.equal(p.note,undefined);}
 assert.equal((await sync('c',{session:a.session,seq:0},{x:36,z:54})).status,409);
 assert.equal((await sync('a',a,{x:9999,z:54})).status,400);
 assert.equal((await sync('a',a,{x:385,z:385})).status,422,'teleport rejected');
 const replay=await call('a','world/sync','POST',{session:a.session,seq:1,x:36,z:54,heading:0,mode:'driving',carId:'hatch'});assert.equal(replay.status,409);
 const upgrade=await Promise.all([call('a','world/upgrade','POST',{level:1}),call('a','world/upgrade','POST',{level:1})]);assert.equal(upgrade.filter(r=>r.status===200).length,1,'purchase is atomic');
 let home=(await call('a','world')).data.home;assert.equal(home.level,1);assert.equal(home.credits,0);assert.equal((await call('a','world/upgrade','POST',{level:2})).status,409,'no insufficient-credit purchase');
 await call('a','profile','PUT',{name:'Driver a',avatar:'jules',status:'at-home',note:'',homeId:HOMES.find(h=>h.id!==a.home.homeId).id});assert.equal((await call('a','social')).data.profile.homeId,a.home.homeId,'assigned address authoritative');
 const c=await join('c');assert.equal(c.roomId,a.roomId);
 const addresses=new Set([a,b,c].map(p=>p.home.homeId+':'+p.home.unit));assert.equal(addresses.size,3,'each driver gets a distinct unit');
 // Moving between interior and city is explicit and keeps the home position authoritative.
 assert.equal((await call('a','world/interior','POST',{session:a.session,mode:'garage'})).status,200);
 let snap=await sync('b',b,{x:40,z:54});const indoors=snap.data.players.find(p=>p.id===a.profile.id);const assigned=HOMES.find(h=>h.id===a.home.homeId);assert.equal(indoors.mode,'garage');assert.equal(indoors.x,assigned.x);
 // Complete real job stages using elapsed server time and reported positions.
 const job=NEIGHBORHOOD_JOBS[0];
 for(let i=0;i<4;i++){
  await call('a','world/interior','POST',{session:a.session,mode:'garage'});
  assert.equal((await sync('a',a,{x:36,z:54})).status,200);
  const approach=Math.ceil(Math.hypot(job.from.x-36,job.from.z-54)/70);for(let n=1;n<=approach;n++)assert.equal((await sync('a',a,{x:36+(job.from.x-36)*n/approach,z:54+(job.from.z-54)*n/approach})).status,200);
  assert.equal((await call('a','world/jobs','POST',{session:a.session,id:job.id,action:'start'})).status,200);
  assert.equal((await call('a','world/jobs','POST',{session:a.session,id:job.id,action:'finish'})).status,409,'cannot finish before pickup');
  step(1200);assert.equal((await call('a','world/jobs','POST',{session:a.session,id:job.id,action:'pickup'})).status,200);
  assert.equal((await call('a','world/jobs','POST',{session:a.session,id:job.id,action:'pickup'})).status,409,'cannot pick up twice');
  assert.equal((await call('a','world/jobs','POST',{session:a.session,id:job.id,action:'finish'})).status,409,'must drive to destination');
  const length=Math.hypot(job.to.x-job.from.x,job.to.z-job.from.z),segments=8;
  for(let n=1;n<=segments;n++)assert.equal((await sync('a',a,{x:job.from.x+(job.to.x-job.from.x)*n/segments,z:job.from.z+(job.to.z-job.from.z)*n/segments})).status,200);
  assert(now-(await call('a','world')).data.home.job.startedAt>=length/65*1000);
  const finishes=await Promise.all([call('a','world/jobs','POST',{session:a.session,id:job.id,action:'finish'}),call('a','world/jobs','POST',{session:a.session,id:job.id,action:'finish'})]);
  assert.equal(finishes.filter(r=>r.status===200).length,1,'reward once, even for simultaneous requests');
 }
 home=(await call('a','world')).data.home;assert.equal(home.credits,job.reward*4);assert.equal(home.deliveries,4);assert.equal(home.job,null);
 assert.equal((await call('a','world/upgrade','POST',{level:2})).status,200);home=(await call('a','world')).data.home;assert.equal(home.level,2);assert.equal(home.credits,job.reward*4-HOME_UPGRADES[2].cost);
 const before=JSON.stringify(home);await call('a','world/leave','POST',{session:a.session});assert.equal((await sync('a',a,job.to)).status,409);const rejoined=await join('a');assert.equal(JSON.stringify(rejoined.home),before,'home, address, credits, and upgrades survive reconnect');
 // Fill a server and prove joins cannot overbook it; the next driver gets a new room.
 step(WORLD_TTL+1);await profile('capacity0');const leader=await join('capacity0');
 for(let i=1;i<ROOM_CAPACITY-1;i++){await profile('capacity'+i);const player=await join('capacity'+i,leader.roomId);assert.equal(player.roomId,leader.roomId);}
 await profile('last1');await profile('last2');
 const last=await Promise.all([call('last1','world/join','POST',{}),call('last2','world/join','POST',{})]);
 assert(last.every(r=>r.status===200));assert.equal(new Set(last.map(r=>r.data.roomId)).size,2,'concurrent joins cannot overbook');
 const full=await sync('capacity0',leader,{x:36,z:54});assert.equal(full.data.players.length,ROOM_CAPACITY);
 await profile('full');assert.equal((await call('full','world/join','POST',{roomId:leader.roomId})).status,409);
 assert.equal((await sync('b',b,{x:40,z:54})).status,409,'stale session cannot resurrect itself');
 const ownerBefore=JSON.stringify((await call('a','world')).data.home);assert.equal((await call('b','world/upgrade','POST',{level:3,profileId:a.profile.id})).status,409);assert.equal(JSON.stringify((await call('a','world')).data.home),ownerBefore,'another player cannot spend your balance');
 console.log('PASS: two-player presence, server isolation/capacity, concurrent joins, unique persistent homes, CSRF/auth, private-field filtering, movement validation, reconnect/expiry, atomic upgrades, four real delivery cycles, exactly-once rewards.');
}finally{Date.now=originalNow;DB.close();}
