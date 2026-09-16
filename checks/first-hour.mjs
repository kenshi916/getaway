import assert from 'node:assert/strict';
import worker from '../worker/index.js';
import {localD1} from './d1-local.mjs';
import {FIRST_JOBS,nextChapter} from '../dist/first-hour.mjs';
const DB=localD1(),env={DB,ASSETS:{fetch:()=>new Response('static')}},origin='https://getaway.test';
async function call(user,path='',method='GET',body,extra={}){const headers={origin,...extra};if(user)headers['oai-authenticated-user-id']=user;if(body)headers['content-type']='application/json';const r=await worker.fetch(new Request(origin+'/api/first-hour'+path,{method,headers,body:body?JSON.stringify(body):undefined}),env,{});return{status:r.status,...await r.json()};}
try{
 assert.equal((await call(null)).status,401);let a=await call('alice');assert.equal(nextChapter(a.state),'move');
 assert.equal((await call('alice','','POST',{revision:0,event:{type:'reward'}})).status,400);
 assert.equal((await call('alice','','POST',{revision:0,event:{type:'move'}},{origin:'https://unrelated.test'})).status,403);
 const save=async body=>{const r=await call('alice','','POST',{revision:a.revision,...body});assert.equal(r.status,200,JSON.stringify(r));a=r;};
 await save({event:{type:'move'}});await save({event:{type:'starter'}});
 assert.equal((await call('alice','','POST',{revision:0,event:{type:'move'}})).status,409,'stale tabs cannot overwrite progress');
 assert.equal((await call('alice','','POST',{revision:a.revision,event:{type:'delivery',job:'workshop'}})).status,400,'missions ordered');
 assert.equal((await call('alice','','POST',{revision:a.revision,decor:{underglow:true}})).status,400,'reward stays locked');
 for(const job of FIRST_JOBS){await save({event:{type:'delivery',job:job.id}});const completed=a.state.completed;await save({event:{type:'delivery',job:job.id}});assert.equal(a.state.completed,completed,'replayed completion is idempotent');}
 assert.equal(nextChapter(a.state),'bank');await save({event:{type:'bank'}});await save({event:{type:'reward'}});
 await save({decor:{theme:'coastal',floor:'walnut',rug:'stripe',art:'records',lamp:'rose',paint:4,wheels:'gold',plants:true,underglow:true}});assert.equal(nextChapter(a.state),'invite');
 const saved=await call('alice');assert.equal(saved.state.decor.theme,'coastal');assert.equal(saved.state.decor.underglow,true);assert.equal((await call('bob')).state.reward,false,'separate accounts isolated');
 const invite=await call('alice','/invite','POST',{});assert.equal(invite.status,200);const token=new URL(invite.path,origin).searchParams.get('visit');const tour=await call('bob','/visit/'+token);assert.equal(tour.status,200);assert.equal(tour.decor.theme,'coastal');for(const key of ['owner_id','revision','state','credits'])assert.equal(tour[key],undefined,'tour only returns shareable home design');
 await save({event:{type:'invite'}});assert.equal(nextChapter(a.state),'complete');assert.equal((await call('alice','/invite','DELETE')).status,200);assert.equal((await call('bob','/visit/'+token)).status,404,'revocation works');
 const race=await Promise.all([call('alice','','POST',{revision:a.revision,decor:{theme:'sunset'}}),call('alice','','POST',{revision:a.revision,decor:{theme:'garden'}})]);assert.equal(race.filter(r=>r.status===200).length,1,'atomic design updates');
 console.log('First chapter: ordered/idempotent missions, reward gating, durable designs, account isolation, stale-write protection, home tours and revocation pass.');
}finally{DB.close();}
