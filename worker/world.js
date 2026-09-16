import {canVisit,ensureAccount} from './neighborhood.js';
import {HOMES} from '../dist/social-catalog.mjs';
import {WORLD_LIMIT,ROOM_CAPACITY,WORLD_TTL,HOME_UPGRADES,NEIGHBORHOOD_JOBS} from '../dist/world-catalog.mjs';
const cars=new Set(['van','coupe','racer','hatch','cab','suv']);
const modes=new Set(['apartment','garage','driving','destination']);
const homeView=h=>h?{homeId:h.home_id,unit:h.unit,level:h.level,credits:h.credits,deliveries:h.deliveries,job:h.job_id?{id:h.job_id,stage:h.job_stage,startedAt:h.job_started_at}:null}:null;
const placeFor=h=>HOMES.find(p=>p.id===h.home_id)||HOMES[0];
const profileView=p=>p?{id:p.id,name:p.name,avatar:p.avatar}:null;
function homeIndex(id){let h=0;for(const c of id)h=(Math.imul(h,31)+c.charCodeAt(0))>>>0;return h%HOMES.length;}
export async function worldApi(request,{db,me,body,json,fail,url}){
 const path=url.pathname,method=request.method,now=Date.now();
 const rooms=async()=>{const rows=await db.prepare('SELECT r.id, (SELECT COUNT(*) FROM world_members m WHERE m.room_id=r.id AND m.last_seen>?) AS players FROM world_rooms r ORDER BY r.id LIMIT 30').bind(now-WORLD_TTL).all();return rows.results.map(r=>({id:r.id,name:'Neighborhood '+String(r.id).padStart(2,'0'),players:r.players,capacity:ROOM_CAPACITY}));};
 const getHome=async()=>me?await db.prepare('SELECT * FROM residences WHERE profile_id=?').bind(me.id).first():null;
 if(path==='/api/world'&&method==='GET')return json({profile:profileView(me),home:homeView(await getHome()),rooms:await rooms(),capacity:ROOM_CAPACITY});
 if(!me)fail('Create your player name to join a neighborhood.',409);
 if(path==='/api/world/join'&&method==='POST'){
  const b=await body(request);if(b.roomId!==undefined&&(!Number.isInteger(b.roomId)||b.roomId<1))fail('Choose a neighborhood from the server list.');
  let home=await getHome();
  if(!home){const id=HOMES[homeIndex(me.id)].id;await db.prepare('INSERT INTO residences (profile_id,home_id,unit,level,credits,deliveries,job_stage,job_started_at,updated_at) SELECT ?,?,COALESCE(MAX(unit),0)+1,0,120,0,0,0,? FROM residences WHERE home_id=? ON CONFLICT(profile_id) DO NOTHING').bind(me.id,id,now,id).run();home=await getHome();}
  await ensureAccount(db,me.id,now);
  const place=placeFor(home),session=crypto.randomUUID();let assigned=null;
  for(let attempt=0;attempt<4&&!assigned;attempt++){
   let room=b.roomId?await db.prepare('SELECT id FROM world_rooms WHERE id=?').bind(b.roomId).first():await db.prepare('SELECT r.id FROM world_rooms r WHERE (SELECT COUNT(*) FROM world_members m WHERE m.room_id=r.id AND m.last_seen>? AND m.profile_id<>?)<? ORDER BY r.id LIMIT 1').bind(now-WORLD_TTL,me.id,ROOM_CAPACITY).first();
   if(!room&&b.roomId)fail('That neighborhood is no longer available.',404);
   if(!room)room=await db.prepare('INSERT INTO world_rooms (created_at) VALUES (?) RETURNING id').bind(now).first();
   const result=await db.prepare(`INSERT INTO world_members (profile_id,room_id,session,seq,x,z,heading,mode,car_id,last_seen) SELECT ?,?,?,0,?,?,0,'apartment','van',? WHERE (SELECT COUNT(*) FROM world_members WHERE room_id=? AND last_seen>? AND profile_id<>?)<? ON CONFLICT(profile_id) DO UPDATE SET room_id=excluded.room_id,session=excluded.session,seq=0,x=excluded.x,z=excluded.z,heading=0,mode='apartment',car_id='van',last_seen=excluded.last_seen`).bind(me.id,room.id,session,place.x,place.z,now,room.id,now-WORLD_TTL,me.id,ROOM_CAPACITY).run();
   if(result.meta.changes)assigned=room.id;else if(b.roomId)fail('This server is full. Choose another neighborhood.',409);
  }
  if(!assigned)fail('The server filled up. Please try joining again.',409);
  await db.prepare('DELETE FROM neighborhood_presence WHERE profile_id=?').bind(me.id).run();
  // Crew friends see the assigned in-game address too.
  await db.prepare('UPDATE profiles SET home_id=?,last_seen=? WHERE id=?').bind(home.home_id,now,me.id).run();
  return json({session,roomId:assigned,capacity:ROOM_CAPACITY,profile:profileView(me),home:homeView(home)});
 }
 if(path==='/api/world/upgrade'&&method==='POST'){
  const b=await body(request),home=await getHome();if(!home)fail('Join a neighborhood to get your home.',409);
  if(!Number.isInteger(b.level)||b.level!==home.level+1)fail('Your home has changed. Refresh the upgrade board.',409);
  const upgrade=HOME_UPGRADES[b.level];if(!upgrade)fail('Your home is fully upgraded.',409);
  const result=await db.prepare('UPDATE residences SET level=?,credits=credits-?,updated_at=? WHERE profile_id=? AND level=? AND credits>=?').bind(b.level,upgrade.cost,now,me.id,home.level,upgrade.cost).run();
  if(!result.meta.changes)fail('Finish more neighborhood jobs to earn this upgrade.',409);
  return json({home:homeView(await getHome())});
 }
 if(path==='/api/world/sync'&&method==='POST'){
  const b=await body(request);
  if(typeof b.session!=='string'||!Number.isSafeInteger(b.seq)||b.seq<1||!modes.has(b.mode)||!cars.has(b.carId)||![b.x,b.z,b.heading].every(Number.isFinite)||Math.abs(b.x)>WORLD_LIMIT||Math.abs(b.z)>WORLD_LIMIT||Math.abs(b.heading)>Math.PI*10000)fail('Invalid player position.');
  const member=await db.prepare('SELECT * FROM world_members WHERE profile_id=? AND session=?').bind(me.id,b.session).first();
  if(!member||now-member.last_seen>WORLD_TTL)fail('Your connection ended. Rejoin your neighborhood.',409);
  if(b.seq<=member.seq)fail('This position was already received.',409);
  if(now-member.last_seen<250)fail('Please wait before updating again.',429);
  const home=await getHome(),place=placeFor(home),moving=b.mode==='driving';
  if(b.travel!==undefined&&!['car','foot'].includes(b.travel))fail('Invalid travel mode.');
  const presence=await db.prepare('SELECT * FROM neighborhood_presence WHERE profile_id=?').bind(me.id).first();
  const speedLimit=b.travel==='foot'&&presence?.travel==='foot'?8:70;
  let host=presence?.host_id||me.id,evicted=false;if(moving)host=me.id;else if(host!==me.id&&!await canVisit(db,me.id,host,member.room_id,now)){host=me.id;evicted=true;}
  const local=b.local||{x:0,z:0};if(![local.x,local.z].every(Number.isFinite)||Math.abs(local.x)>30||Math.abs(local.z)>25)fail('Invalid interior position.');
  if(moving&&member.mode==='driving'&&Math.hypot(b.x-member.x,b.z-member.z)>Math.max(12,(now-member.last_seen)/1000*speedLimit+8))fail('Your car moved too far. Rejoin to reset its location.',422);
  if(moving&&member.mode!=='driving'&&Math.min(Math.hypot(b.x-member.x,b.z-member.z),Math.hypot(b.x-place.x,b.z-place.z),Math.hypot(b.x-36,b.z-54))>12)fail('Leave from your home or Last Exit garage.',422);
  const x=moving?b.x:b.mode==='destination'?member.x:place.x,z=moving?b.z:b.mode==='destination'?member.z:place.z;
  const changed=await db.prepare('UPDATE world_members SET seq=?,x=?,z=?,heading=?,mode=?,car_id=?,last_seen=? WHERE profile_id=? AND session=? AND seq<? AND last_seen>?').bind(b.seq,x,z,b.heading,b.mode,b.carId,now,me.id,b.session,b.seq,now-WORLD_TTL).run();
  if(!changed.meta.changes)fail('Your connection changed. Rejoin the neighborhood.',409);
  await db.prepare('INSERT INTO neighborhood_presence (profile_id,travel,host_id,local_x,local_z) VALUES (?,?,?,?,?) ON CONFLICT(profile_id) DO UPDATE SET travel=excluded.travel,host_id=excluded.host_id,local_x=excluded.local_x,local_z=excluded.local_z').bind(me.id,b.travel||'car',host,local.x,local.z).run();
  if(now-me.last_seen>30000)await db.prepare('UPDATE profiles SET last_seen=? WHERE id=?').bind(now,me.id).run();
  const members=await db.prepare(`SELECT m.profile_id,m.x,m.z,m.heading,m.mode,m.car_id,m.last_seen,p.name,p.avatar,h.home_id,h.unit,h.level,n.travel,n.host_id,n.local_x,n.local_z,n.emote,n.emote_at,a.data AS design FROM world_members m JOIN profiles p ON p.id=m.profile_id JOIN residences h ON h.profile_id=m.profile_id LEFT JOIN neighborhood_presence n ON n.profile_id=m.profile_id LEFT JOIN neighborhood_accounts a ON a.profile_id=m.profile_id WHERE m.room_id=? AND m.last_seen>? ORDER BY m.profile_id LIMIT ?`).bind(member.room_id,now-WORLD_TTL,ROOM_CAPACITY).all();
  return json({roomId:member.room_id,evicted,home:homeView(home),players:members.results.map(p=>({id:p.profile_id,name:p.name,avatar:p.design&&JSON.parse(p.design).outfit||p.avatar,x:p.x,z:p.z,heading:p.heading,mode:p.mode,carId:p.car_id,lastSeen:p.last_seen,homeId:p.home_id,unit:p.unit,level:p.level,travel:p.travel||'car',hostId:p.host_id||p.profile_id,localX:p.local_x||0,localZ:p.local_z||0,emote:p.emote,emoteAt:p.emote_at,carStyle:p.design?{...JSON.parse(p.design).car,plate:JSON.parse(p.design).plate}:null})),serverTime:now});
 }
 if(path==='/api/world/leave'&&method==='POST'){
  const b=await body(request);if(typeof b.session!=='string')fail('Invalid session.');await db.prepare('DELETE FROM world_members WHERE profile_id=? AND session=?').bind(me.id,b.session).run();return json({ok:true});
 }
 if(path==='/api/world/interior'&&method==='POST'){
  const b=await body(request);if(!['apartment','garage'].includes(b.mode)||typeof b.session!=='string')fail('Choose your apartment or garage.');
  const home=await getHome();if(!home)fail('Join a neighborhood first.',409);const place=placeFor(home);
  const member=await db.prepare('SELECT room_id FROM world_members WHERE profile_id=? AND session=?').bind(me.id,b.session).first(),host=typeof b.hostId==='string'?b.hostId:me.id;if(!member)fail('Rejoin your neighborhood.',409);if(!await canVisit(db,me.id,host,member.room_id,now))fail('This home is closed.',403);
  const result=await db.prepare('UPDATE world_members SET x=?,z=?,mode=?,last_seen=? WHERE profile_id=? AND session=? AND last_seen>?').bind(place.x,place.z,b.mode,now,me.id,b.session,now-WORLD_TTL).run();
  if(!result.meta.changes)fail('Rejoin your neighborhood.',409);
  await db.prepare('INSERT INTO neighborhood_presence (profile_id,host_id,travel) VALUES (?,?,\'foot\') ON CONFLICT(profile_id) DO UPDATE SET host_id=excluded.host_id,travel=\'foot\'').bind(me.id,host).run();return json({ok:true});
 }
 if(path==='/api/world/jobs'&&method==='POST'){
  const b=await body(request),job=NEIGHBORHOOD_JOBS.find(j=>j.id===b.id),home=await getHome();
  if(!home||!job||!['start','pickup','finish','cancel'].includes(b.action))fail('Choose a neighborhood job.');
  const member=await db.prepare('SELECT * FROM world_members WHERE profile_id=? AND session=? AND last_seen>?').bind(me.id,typeof b.session==='string'?b.session:'',now-WORLD_TTL).first();if(!member)fail('Join a neighborhood before starting a job.',409);
  let result;
  if(b.action==='start'){
   result=await db.prepare('UPDATE residences SET job_id=?,job_stage=0,job_started_at=?,updated_at=? WHERE profile_id=? AND job_id IS NULL').bind(job.id,now,now,me.id).run();
  }else if(b.action==='cancel'){
   result=await db.prepare('UPDATE residences SET job_id=NULL,job_stage=0,updated_at=? WHERE profile_id=? AND job_id=?').bind(now,me.id,job.id).run();
  }else{
   if(home.job_id!==job.id)fail('This job is no longer active.',409);
   const dest=b.action==='pickup'?job.from:job.to;
   if(member.mode!=='driving'||Math.hypot(member.x-dest.x,member.z-dest.z)>14)fail('Drive to the marked stop first.',409);
   if(now-home.job_started_at<(b.action==='pickup'?1000:Math.hypot(job.from.x-job.to.x,job.from.z-job.to.z)/65*1000))fail('Finish the drive before collecting this reward.',409);
   if(b.action==='pickup')result=await db.prepare('UPDATE residences SET job_stage=1,job_started_at=?,updated_at=? WHERE profile_id=? AND job_id=? AND job_stage=0').bind(now,now,me.id,job.id).run();
   else result=await db.prepare('UPDATE residences SET credits=credits+?,deliveries=deliveries+1,job_id=NULL,job_stage=0,updated_at=? WHERE profile_id=? AND job_id=? AND job_stage=1').bind(job.reward,now,me.id,job.id).run();
  }
  if(!result.meta.changes)fail('The job changed. Refresh your board and try again.',409);
  return json({home:homeView(await getHome()),reward:b.action==='finish'?job.reward:0});
 }
 fail('Page not found.',404);
}
