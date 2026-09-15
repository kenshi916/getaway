import {HOMES,AVATARS,STATUSES} from '../dist/social-catalog.mjs';
import {worldApi} from './world.js';
const headers={'content-type':'application/json; charset=utf-8','cache-control':'private, no-store','x-content-type-options':'nosniff'};
const json=(body,status=200)=>new Response(JSON.stringify(body),{status,headers});
const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
const publicProfile=p=>({id:p.id,name:p.name,avatar:p.avatar,status:p.status,note:p.note,homeId:p.home_id,online:Date.now()-p.last_seen<120000,lastSeen:p.last_seen});
const code=()=>Array.from(crypto.getRandomValues(new Uint8Array(12)),b=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b%32]).join('');
async function body(request){if(!request.headers.get('content-type')?.startsWith('application/json'))fail('Send JSON.',415);const text=await request.text();if(text.length>4096)fail('Request is too large.',413);try{const value=JSON.parse(text);if(!value||typeof value!=='object'||Array.isArray(value))fail('Send a JSON object.');return value;}catch{fail('Invalid request.');}}
async function api(request,env){
 const url=new URL(request.url),path=url.pathname,method=request.method;
 const owner=request.headers.get('oai-authenticated-user-id');if(!owner)fail('Sign in with ChatGPT to open your crew.',401);
 if(method!=='GET'&&(request.headers.get('origin')!==url.origin||request.headers.get('sec-fetch-site')==='cross-site'))fail('Open Crew on this site to make changes.',403);
 const db=env.DB;if(!db)fail('Crew is temporarily unavailable. Try again shortly.',503);
 const me=await db.prepare('SELECT * FROM profiles WHERE owner_id = ?').bind(owner).first();
 if(path==='/api/world'||path.startsWith('/api/world/'))return worldApi(request,{db,me,body,json,fail,url});
 if(path==='/api/social'&&method==='GET'){
  if(!me)return json({profile:null,friends:[],incoming:[],outgoing:[]});
  const rows=await db.prepare(`SELECT f.id AS connection_id,f.status AS connection_status,f.from_id,p.* FROM friendships f JOIN profiles p ON p.id = CASE WHEN f.from_id = ? THEN f.to_id ELSE f.from_id END WHERE f.from_id = ? OR f.to_id = ? ORDER BY f.created_at DESC LIMIT 120`).bind(me.id,me.id,me.id).all();
  const residence=await db.prepare('SELECT home_id,unit,level FROM residences WHERE profile_id=?').bind(me.id).first();
  const result={profile:{...publicProfile(me),friendCode:me.friend_code,residence:residence?{homeId:residence.home_id,unit:residence.unit,level:residence.level}:null},friends:[],incoming:[],outgoing:[]};
  for(const row of rows.results){const group=row.connection_status==='accepted'?'friends':row.from_id===me.id?'outgoing':'incoming';const profile=publicProfile(row);if(group!=='friends'){delete profile.homeId;delete profile.status;delete profile.note;delete profile.online;delete profile.lastSeen;}result[group].push({connectionId:row.connection_id,...profile});}return json(result);
 }
 if(path==='/api/profile'&&method==='PUT'){
  const b=await body(request);if(!b||typeof b.name!=='string'||b.name.trim().length<2||b.name.trim().length>24||/[\x00-\x1f<>]/.test(b.name))fail('Use a player name between 2 and 24 characters.');
  if(!AVATARS.includes(b.avatar)||!STATUSES.some(s=>s.id===b.status)||!HOMES.some(h=>h.id===b.homeId))fail('Choose a character, status, and GETAWAY apartment.');
  if(typeof b.note!=='string'||b.note.length>80||/[\x00-\x1f<>]/.test(b.note))fail('Keep your status message under 80 characters, without markup.');
  const assigned=me?await db.prepare('SELECT home_id FROM residences WHERE profile_id=?').bind(me.id).first():null;if(assigned)b.homeId=assigned.home_id;
  await db.prepare(`INSERT INTO profiles (id,owner_id,friend_code,name,avatar,status,note,home_id,last_seen) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(owner_id) DO UPDATE SET name=excluded.name,avatar=excluded.avatar,status=excluded.status,note=excluded.note,home_id=excluded.home_id,last_seen=excluded.last_seen`).bind(crypto.randomUUID(),owner,code(),b.name.trim(),b.avatar,b.status,b.note.trim(),b.homeId,Date.now()).run();
  return json({ok:true});
 }
 if(!me)fail('Create your player profile first.',409);
 if(path==='/api/presence'&&method==='POST'){await db.prepare('UPDATE profiles SET last_seen = ? WHERE id = ?').bind(Date.now(),me.id).run();return json({ok:true});}
 if(path==='/api/requests'&&method==='POST'){
  const b=await body(request),friendCode=typeof b?.code==='string'?b.code.replace(/[ -]/g,'').toUpperCase():'';
  if(!/^[A-HJ-NP-Z2-9]{12}$/.test(friendCode))fail('Enter the 12-character code from your friend.');
  const peer=await db.prepare('SELECT id FROM profiles WHERE friend_code = ?').bind(friendCode).first();if(!peer)fail('No player has that code. Ask your friend to create a Crew profile and check their code.',404);if(peer.id===me.id)fail('That is your code. Ask a friend for theirs.');
  const pair=JSON.stringify([me.id,peer.id].sort());
  const exists=await db.prepare('SELECT id,status FROM friendships WHERE pair_key = ?').bind(pair).first();if(exists)fail(exists.status==='accepted'?'You are already friends.':'A request already exists. Check your requests.',409);
  const result=await db.prepare(`INSERT INTO friendships (id,pair_key,from_id,to_id,status,created_at) SELECT ?,?,?,?,'pending',? WHERE (SELECT COUNT(*) FROM friendships WHERE from_id=? OR to_id=?)<100 AND (SELECT COUNT(*) FROM friendships WHERE from_id=? OR to_id=?)<100 AND (SELECT COUNT(*) FROM friendships WHERE from_id=? AND status='pending')<20 ON CONFLICT(pair_key) DO NOTHING`).bind(crypto.randomUUID(),pair,me.id,peer.id,Date.now(),me.id,me.id,peer.id,peer.id,me.id).run();
  if(!result.meta.changes)fail('Request limit reached or a request already exists. Clear an old request and try again.',409);return json({ok:true},201);
 }
 const match=path.match(/^\/api\/(requests|friends)\/([a-f0-9-]{36})$/);
 if(match&&method==='PATCH'&&match[1]==='requests'){
  const b=await body(request);let result;
  if(b?.action==='accept')result=await db.prepare("UPDATE friendships SET status='accepted' WHERE id=? AND to_id=? AND status='pending'").bind(match[2],me.id).run();
  else if(b?.action==='decline')result=await db.prepare("DELETE FROM friendships WHERE id=? AND to_id=? AND status='pending'").bind(match[2],me.id).run();
  else fail('Choose accept or decline.');if(!result.meta.changes)fail('This request is no longer available.',404);return json({ok:true});
 }
 if(match&&method==='DELETE'){
  const status=match[1]==='friends'?'accepted':'pending';const result=await db.prepare('DELETE FROM friendships WHERE id=? AND (from_id=? OR to_id=?) AND status=?').bind(match[2],me.id,me.id,status).run();if(!result.meta.changes)fail('This connection is no longer available.',404);return json({ok:true});
 }
 fail('Page not found.',404);
}
export default {async fetch(request,env,ctx){if(new URL(request.url).pathname.startsWith('/api/')){try{return await api(request,env);}catch(error){if(error.status)return json({error:error.message},error.status);console.error('Crew API error',error.name);return json({error:'Crew could not save that change. Please try again.'},500);}}return env.ASSETS.fetch(request);}};
