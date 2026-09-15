import assert from 'node:assert/strict';import worker from '../worker/index.js';import {localD1} from './d1-local.mjs';import {HOMES,homeRouteFromSearch} from '../dist/social-catalog.mjs';import {route,HOME} from '../dist/driving.mjs';
const DB=localD1();const env={DB,ASSETS:{fetch:()=>new Response('static')}};const origin='https://getaway.test';
async function call(user,path,method='GET',body,extra={}){const h={origin,...extra};if(user)h['oai-authenticated-user-id']=user;if(body)h['content-type']='application/json';const r=await worker.fetch(new Request(origin+'/api/'+path,{method,headers:h,body:body?JSON.stringify(body):undefined}),env,{});return {status:r.status,data:await r.json()};}
const profile=(name,homeId='last-exit')=>({name,homeId,avatar:'jules',status:'on-shift',note:'See you around the city'});
try{
 assert.equal((await call(null,'social')).status,401);
 assert.equal((await call('a','profile','PUT',profile('Alex'),{origin:'https://outside.test'})).status,403);
 assert.equal((await call('a','profile','PUT',profile('Alex'),{'sec-fetch-site':'cross-site'})).status,403);
 assert.equal((await call('a','profile','PUT',{...profile('Alex'),homeId:'real-address'})).status,400);
 assert.equal((await call('a','profile','PUT',{...profile('Alex'),name:'<script>'})).status,400);
 for(const [id,name,home]of [['a','Alex','last-exit'],['b','Sam','rooftop'],['c','Kai','riverside']])assert.equal((await call(id,'profile','PUT',profile(name,home))).status,200);
 const a=(await call('a','social')).data.profile,b=(await call('b','social')).data.profile;
 assert.equal(a.friendCode.length,12);assert.equal((await call('a','requests','POST',{code:a.friendCode})).status,400);
 assert.equal((await call('a','requests','POST',{code:b.friendCode})).status,201);
 let s=(await call('b','social')).data;const id=s.incoming[0].connectionId;
 assert.equal(s.incoming[0].homeId,undefined);assert.equal(s.incoming[0].note,undefined);assert.equal(s.incoming[0].status,undefined);assert.equal(s.incoming[0].lastSeen,undefined);assert.equal(s.incoming[0].friendCode,undefined);assert.equal(s.incoming[0].owner_id,undefined);
 assert.equal((await call('a','requests','POST',{code:b.friendCode})).status,409);
 assert.equal((await call('a','requests/'+id,'PATCH',{action:'accept'})).status,404);
 assert.equal((await call('c','requests/'+id,'PATCH',{action:'accept'})).status,404);
 assert.equal((await call('c','requests/'+id,'DELETE')).status,404);
 assert.equal((await call('b','requests/'+id,'PATCH',{action:'accept'})).status,200);
 s=(await call('a','social')).data;assert.equal(s.friends.length,1);assert.equal(s.friends[0].homeId,'rooftop');assert.equal(s.friends[0].status,'on-shift');assert.equal(s.friends[0].friendCode,undefined);assert.equal(s.friends[0].owner_id,undefined);
 assert.equal((await call('c','friends/'+id,'DELETE')).status,404);
 await call('b','profile','PUT',{...profile('Sam','west-court'),status:'at-home',note:'Back at home'});
 s=(await call('a','social')).data;assert.equal(s.friends[0].homeId,'west-court');assert.equal(s.friends[0].note,'Back at home');assert.equal((await call('b','social')).data.profile.friendCode,b.friendCode);
 assert.equal((await call('b','presence','POST')).status,200);assert((await call('a','social')).data.friends[0].online);
 assert.equal((await call('a','friends/'+id,'DELETE')).status,200);assert.equal((await call('b','social')).data.friends.length,0);assert.equal((await call('a','social')).data.friends.length,0);
 await call('a','requests','POST',{code:b.friendCode});s=(await call('b','social')).data;assert.equal((await call('b','requests/'+s.incoming[0].connectionId,'PATCH',{action:'decline'})).status,200);assert.equal((await call('a','social')).data.outgoing.length,0);
 await call('a','requests','POST',{code:b.friendCode});s=(await call('a','social')).data;assert.equal((await call('a','requests/'+s.outgoing[0].connectionId,'DELETE')).status,200);
 for(const home of HOMES){assert.equal(homeRouteFromSearch('?friendHome='+home.id).id,home.id);assert(route(HOME,home).length>0);}assert.equal(homeRouteFromSearch('?friendHome=invalid'),null);
 const staticResponse=await worker.fetch(new Request(origin+'/play/'),env,{});assert.equal(await staticResponse.text(),'static');
 console.log('PASS: identity, CSRF, validation, friend lifecycle, private fields, ownership, status/home updates, persistence, game home routes, static fallback.');
}finally{DB.close();}
