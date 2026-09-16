import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {localD1} from './d1-local.mjs';
import {COOP_JOBS,ACTIVITIES,cityActivities} from '../dist/neighborhood-catalog.mjs';
const DB=localD1(),env={DB,ASSETS:{fetch:()=>new Response('static')}},origin='https://getaway.test',realNow=Date.now;let now=realNow();Date.now=()=>now;
const clients={};
async function call(user,path,body,method=body?'POST':'GET'){const r=await worker.fetch(new Request(origin+'/api/'+path,{method,headers:{origin,'oai-authenticated-user-id':user,'content-type':'application/json'},body:body?JSON.stringify(body):undefined}),env,{});return {status:r.status,...await r.json()};}
async function life(user,path='',body){return call(user,'neighborhood'+path,body?{...body,session:clients[user]?.session}:undefined);}
async function move(user,x,z,mode='driving',extra={}){const c=clients[user];const last=await DB.prepare('SELECT * FROM world_members WHERE profile_id=?').bind(c.profile.id).first();if(mode==='driving'){if(last.mode!=='driving'&&Math.hypot(x-36,z-54)>12){await move(user,36,54);return move(user,x,z,mode,extra);}if(last.mode==='driving'&&Math.hypot(x-last.x,z-last.z)>95){const n=Math.ceil(Math.hypot(x-last.x,z-last.z)/95);for(let i=1;i<=n;i++)await move(user,last.x+(x-last.x)*i/n,last.z+(z-last.z)*i/n,mode,extra);return;}}now+=1600;const r=await call(user,'world/sync',{session:c.session,seq:++c.seq,x,z,mode,carId:'van',heading:0,...extra});assert.equal(r.status,200,JSON.stringify(r));return r;}
async function atBoth(stop){await move('a',stop.x,stop.z);await move('b',stop.x,stop.z);}
try{
 for(const user of ['a','b','c']){assert.equal((await call(user,'profile',{name:'Neighbor '+user,avatar:'jules',status:'at-home',note:'',homeId:'last-exit'},'PUT')).status,200);clients[user]={...await call(user,'world/join',user==='a'?{}:{roomId:clients.a.roomId}),seq:0};assert.equal(clients[user].status,200);}
 assert.equal((await life('a')).credits,120);
 let r=await life('a','/buy',{kind:'part',id:'kit-street'});assert.equal(r.status,409,'career rank required');
 const purchases=await Promise.all([life('a','/buy',{kind:'furniture',id:'lamp'}),life('a','/buy',{kind:'furniture',id:'lamp'})]);assert.equal(purchases.filter(r=>r.status===200).length,1);assert.equal((await life('a')).credits,50,'no double spending');
 assert.equal((await life('a','/buy',{kind:'furniture',id:'armchair'})).status,409);
 assert.equal((await life('a','/decorate',{wallpaper:'brick',placements:[{id:'armchair',x:-4,z:4,rotation:0}]})).status,400,'unowned furniture refused');
 assert.equal((await life('a','/decorate',{wallpaper:'brick',placements:[{id:'fern',x:3,z:6,rotation:0}]})).status,400,'doorway stays clear');
 assert.equal((await life('a','/decorate',{wallpaper:'brick',placements:[{id:'fern',x:-2,z:4,rotation:1}]})).status,200);
 assert.equal((await life('a','/home',{open:true})).status,200);
 assert.equal((await life('b','/visit',{hostId:clients.a.profile.id})).status,403,'nonfriend cannot enter');
 const code=(await call('a','social')).profile.friendCode;assert.equal((await call('b','requests',{code})).status,201);const incoming=(await call('a','social')).incoming[0];assert.equal((await call('a','requests/'+incoming.connectionId,{action:'accept'},'PATCH')).status,200);
 assert.equal((await life('b','/visit',{hostId:clients.a.profile.id})).status,200);
 assert.equal((await call('b','world/interior',{session:clients.b.session,mode:'garage',hostId:clients.a.profile.id})).status,200);
 assert.equal((await call('a','world/interior',{session:clients.a.session,mode:'garage'})).status,200);
 await move('b',0,0,'garage',{travel:'foot',local:{x:2,z:3}});r=await move('a',0,0,'garage',{travel:'foot',local:{x:1,z:4}});const peer=r.players.find(p=>p.id===clients.b.profile.id);assert.equal(peer.hostId,clients.a.profile.id);assert.equal(peer.localX,2);assert.equal(peer.travel,'foot');
 assert.equal((await life('a','/chat',{text:'Welcome home!'})).status,200);assert.equal((await life('a','/chat',{text:'spam'})).status,429);assert.equal((await life('b','/social')).messages.length,1);assert.equal((await life('c','/social')).messages.length,0,'room chat private');
 const message=(await life('b','/social')).messages[0];assert.equal((await life('b','/report',{id:message.id,reason:'Test report'})).status,200);assert.equal((await life('b','/mute',{id:clients.a.profile.id})).status,200);assert.equal((await life('b','/social')).messages.length,0);
 await life('a','/home',{open:false});assert.equal((await life('b','/social')).messages.length,0,'revoked visits immediately lose room chat');r=await move('b',0,0,'garage',{travel:'foot'});assert.equal(r.evicted,true,'closed homes remove visitors');
 // Reward checks use the shared server objective, position, time and saved membership.
 assert.notDeepEqual(cityActivities(Date.UTC(2026,8,14)).at(-1).stops,cityActivities(Date.UTC(2026,8,21)).at(-1).stops,'weekly route rotates');assert.equal((await life('a','/activity',{action:'start',id:'courier-express'})).status,409,'advanced career gated');
 const job=COOP_JOBS[0];await atBoth(job.stops[0]);const crew=await life('a','/coop',{action:'create',id:job.id});assert.equal(crew.status,200);assert.equal((await life('a','/coop',{action:'create',id:job.id})).status,409);assert.equal((await life('b','/coop',{action:'join',contract:crew.id})).status,200);
 await atBoth(job.stops[0]);assert.equal((await life('b','/coop',{action:'start',contract:crew.id})).status,409,'host starts');assert.equal((await life('a','/coop',{action:'start',contract:crew.id})).status,200);
 assert.equal((await life('b','/coop',{action:'claim',contract:crew.id})).status,409,'no early reward');assert.equal((await life('a','/coop',{action:'checkpoint',contract:crew.id})).status,409,'all players must arrive');
 await atBoth(job.stops[1]);assert.equal((await life('a','/coop',{action:'checkpoint',contract:crew.id})).status,200);let reward=await life('a','/coop',{action:'claim',contract:crew.id});assert.equal(reward.credits,170);assert(reward.state.inventory.includes('delivery-crate'));assert.equal(reward.state.xp.courier,45);assert.equal((await life('a','/coop',{action:'claim',contract:crew.id})).credits,170,'idempotent claim');assert.equal((await life('c','/coop',{action:'claim',contract:crew.id})).status,403);
 const stored=await DB.prepare('SELECT data FROM neighborhood_accounts WHERE profile_id=?').bind(clients.a.profile.id).first(),pruned=JSON.parse(stored.data);pruned.receipts=[];await DB.prepare('UPDATE neighborhood_accounts SET data=? WHERE profile_id=?').bind(JSON.stringify(pruned),clients.a.profile.id).run();assert.equal((await life('a','/coop',{action:'claim',contract:crew.id})).credits,170,'old active contract cannot repay after display receipts are pruned');
 assert.equal((await life('b','/coop',{action:'claim',contract:crew.id})).credits,240,'each crew member paid');
 // Each solo career validates its own steps; mechanic checklist cannot skip steps.
 for(const job of ACTIVITIES){assert.equal((await life('a','/activity',{action:'start',id:job.id})).status,200);for(let stage=0;stage<job.stops.length;stage++){const p=job.stops[stage];await move('a',p.x,p.z);now+=3000;if(job.repair&&stage===job.stops.length-1){assert.equal((await life('a','/activity',{action:'checkpoint',id:job.id,repair:'ignition'})).status,409);for(const repair of job.repair)assert.equal((await life('a','/activity',{action:'checkpoint',id:job.id,repair})).status,200);}else assert.equal((await life('a','/activity',{action:'checkpoint',id:job.id})).status,200);}assert.equal((await life('a')).state.activity,null);}
 const before=(await life('a')).credits;r=await life('a','/event',{});assert.equal(r.credits,before+180);assert(r.state.inventory.includes('crew-trophy'));assert.equal((await life('a','/event',{})).credits,before+180,'weekly award once');
 assert.equal((await life('a','/car',{parts:['kit-street'],plate:'CHEAT'})).status,400);
 console.log('PASS: purchases, layout ownership, friendships, live rooms, chat scope/mutes/reports, co-op roles/checkpoints/idempotent rewards, all careers and weekly rewards.');
}finally{Date.now=realNow;DB.close();}
