import {MOTOR_CLUB,MOTOR_SEATS} from '../dist/motor-catalog.mjs';
import {DAILY_STOPS,RECIPES,utcDay} from '../dist/club-catalog.mjs';
import {FURNITURE,WALLPAPERS,CAR_PARTS,EMOTES,ACTIVITIES,COOP_JOBS,HOME_EXPANSIONS,rankFor,cityActivities,weekInfo,freshNeighborhood} from '../dist/neighborhood-catalog.mjs';
import {WORLD_TTL} from '../dist/world-catalog.mjs';
import {canPlaceFurniture} from '../dist/home-placement.mjs';
const parse=r=>r?.data?JSON.parse(r.data):freshNeighborhood();
export async function ensureAccount(db,id,now=Date.now()) {await db.prepare('INSERT INTO neighborhood_accounts (profile_id,data,updated_at) VALUES (?,?,?) ON CONFLICT(profile_id) DO NOTHING').bind(id,JSON.stringify(freshNeighborhood()),now).run();return db.prepare('SELECT * FROM neighborhood_accounts WHERE profile_id=?').bind(id).first();}
export async function canVisit(db,visitor,host,room,now=Date.now()) {
 if(visitor===host)return true;
 const r=await db.prepare(`SELECT a.data FROM neighborhood_accounts a JOIN world_members m ON m.profile_id=a.profile_id WHERE a.profile_id=? AND m.room_id=? AND m.last_seen>? AND EXISTS (SELECT 1 FROM friendships f WHERE f.status='accepted' AND ((f.from_id=? AND f.to_id=?) OR (f.from_id=? AND f.to_id=?)))`).bind(host,room,now-WORLD_TTL,visitor,host,host,visitor).first();
 return !!r&&parse(r).homeOpen===true;
}
export async function neighborhoodApi(request,{db,me,body,json,fail,url}) {
 if(!me)fail('Create your Crew profile and join a neighborhood first.',409);
 const now=Date.now(),path=url.pathname.replace('/api/neighborhood','')||'/',method=request.method;
 const account=await ensureAccount(db,me.id,now),state=parse(account);
 const home=await db.prepare('SELECT * FROM residences WHERE profile_id=?').bind(me.id).first();
 if(!home)fail('Join a neighborhood to move into your assigned home.',409);
 const snapshot=()=>({state,revision:account.revision,credits:home.credits,level:home.level,week:weekInfo(now)});
 const b=method==='GET'?{}:await body(request);
 const member=await db.prepare('SELECT * FROM world_members WHERE profile_id=? AND last_seen>?').bind(me.id,now-WORLD_TTL).first();
 function online(){if(!member||b.session!==member.session)fail('Join or reconnect to your neighborhood first.',409);return member;}
 async function commit(next,credits=home.credits,level=home.level) {
  const op=crypto.randomUUID();
  // The account revision and credit snapshot gate the entire atomic batch.
  const results=await db.batch([
   db.prepare('UPDATE neighborhood_accounts SET data=?,revision=revision+1,operation=?,updated_at=? WHERE profile_id=? AND revision=? AND EXISTS (SELECT 1 FROM residences WHERE profile_id=? AND credits=? AND level=?)').bind(JSON.stringify(next),op,now,me.id,account.revision,me.id,home.credits,home.level),
   db.prepare('UPDATE residences SET credits=?,level=?,updated_at=? WHERE profile_id=? AND EXISTS (SELECT 1 FROM neighborhood_accounts WHERE profile_id=? AND operation=?)').bind(credits,level,now,me.id,me.id,op)
  ]);
  if(!results[0].meta.changes)fail('Your collection changed in another tab. Refresh and try again.',409);
  return json({state:next,revision:account.revision+1,credits,level,week:weekInfo(now)});
 }
 function spend(cost){if(!Number.isInteger(cost)||cost<0||home.credits<cost)fail('Finish more city jobs to earn the credits for this item.',409);return home.credits-cost;}
 const near=(p,stop,r=17)=>p.mode==='driving'&&Math.hypot(p.x-stop.x,p.z-stop.z)<=r;
 function award(next,id,career,credits,xp,furniture){if(next.receipts.includes(id))return false;if(id.startsWith('coop:')){next.crewClaims??={};if(next.crewClaims[id])return false;for(const key of Object.keys(next.crewClaims))if(next.crewClaims[key]<now-1800000)delete next.crewClaims[key];next.crewClaims[id]=now;}next.receipts=[...next.receipts,id].slice(-200);next.xp[career]=(next.xp[career]||0)+xp;if(furniture&&!next.inventory.includes(furniture))next.inventory.push(furniture);const w=weekInfo(now);next.weekly[w.id]={...(next.weekly[w.id]||{count:0}),count:(next.weekly[w.id]?.count||0)+1};for(const key of Object.keys(next.weekly))if(key!==w.id)delete next.weekly[key];return credits;}
 if(path==='/'&&method==='GET')return json(snapshot());
 if(path==='/daily'&&method==='POST'){
  online();const day=utcDay(now);state.daily=state.daily?.day===day?state.daily:{day,done:[],active:null};state.materials??={wood:0,scrap:0,fabric:0};
  if(b.action==='craft'){const recipe=RECIPES.find(r=>r.id===b.id);if(!recipe)fail('Choose a workshop recipe.');if(state.inventory.includes(recipe.id))return json(snapshot());if(!Object.entries(recipe.materials).every(([k,n])=>(state.materials[k]||0)>=n))fail('Collect the materials shown on this recipe.',409);for(const [k,n]of Object.entries(recipe.materials))state.materials[k]-=n;state.inventory.push(recipe.id);return commit(state);}
  const stop=DAILY_STOPS.find(s=>s.id===b.id);if(!stop)fail('Choose a neighborhood errand.');if(!near(member,stop,14))fail('Reach the marked neighborhood stop first.',409);if(state.daily.done.includes(stop.id))fail('This errand is finished for today.',409);
  if(b.action==='start'){state.daily.active={id:stop.id,at:now};return commit(state);}
  if(b.action!=='finish'||state.daily.active?.id!==stop.id||now-state.daily.active.at<4000)fail('Spend a few seconds helping before collecting materials.',409);
  state.daily.done.push(stop.id);state.daily.active=null;state.materials[stop.material]=(state.materials[stop.material]||0)+stop.quantity;return commit(state,home.credits+stop.credits);
 }
 if(path==='/buy'&&method==='POST') {
  const catalogs={furniture:FURNITURE,wallpaper:WALLPAPERS,part:CAR_PARTS,emote:EMOTES},keys={furniture:'inventory',wallpaper:'wallpapers',part:'parts',emote:'emotes'};
  const item=catalogs[b.kind]?.find(i=>i.id===b.id);if(!item||item.reward)fail('Choose an available shop item.');
  const key=keys[b.kind];if(state[key].includes(item.id))return json(snapshot());
  if(item.career&&rankFor(state.xp[item.career])<item.rank)fail('Reach the next career rank to unlock this item.',409);
  state[key].push(item.id);return commit(state,spend(item.cost));
 }
 if(path==='/decorate'&&method==='POST') {
  if(!Array.isArray(b.placements)||b.placements.length>12||!state.wallpapers.includes(b.wallpaper))fail('Choose owned furnishings and wallpaper.');
  const seen=new Set(),placed=[];
  for(const input of b.placements){if(!input||![input.x,input.z,input.rotation].every(Number.isFinite))fail('Choose a floor tile.');const p={...input,x:Math.round(input.x*4)/4,z:Math.round(input.z*4)/4},item=FURNITURE.find(i=>i.id===p.id);if(!item||!state.inventory.includes(p.id)||seen.has(p.id)||!Number.isInteger(p.rotation)||p.rotation<0||p.rotation>3)fail('Keep owned furniture inside your apartment.');
   if(!canPlaceFurniture(p,item,home.level))fail('Keep furniture clear of walls, existing furnishings and walking paths.');
   const width=p.rotation%2?item.depth:item.width,depth=p.rotation%2?item.width:item.depth;
   if(placed.some(q=>Math.abs(p.x-q.x)<(width+q.width)/2+.12&&Math.abs(p.z-q.z)<(depth+q.depth)/2+.12))fail('Leave space between your furniture.');
   seen.add(p.id);placed.push({id:p.id,x:Math.round(p.x*4)/4,z:Math.round(p.z*4)/4,rotation:p.rotation,width,depth});
  }
  state.placements=placed.map(({width,depth,...p})=>p);state.wallpaper=b.wallpaper;return commit(state);
 }
 if(path==='/car'&&method==='POST') {
  if(!Array.isArray(b.parts)||b.parts.length>6||b.parts.some(id=>!state.parts.includes(id)))fail('Use parts from your collection.');
  if(typeof b.plate!=='string'||!/^[A-Z0-9 -]{1,8}$/.test(b.plate))fail('Use 1–8 letters or numbers on your plate.');
  state.car={};for(const id of b.parts){const p=CAR_PARTS.find(p=>p.id===id);if(p)state.car[p.slot]=p.value;}state.plate=b.plate;return commit(state);
 }
 if(path==='/style'&&method==='POST'){if(b.garageTheme!==undefined){if(b.garageTheme!=='default'&&!(state.garageThemes||[]).includes(b.garageTheme))fail('Choose an owned garage theme.');state.garageTheme=b.garageTheme==='default'?null:b.garageTheme;}if(b.outfit!==undefined){if(b.outfit!=='default'&&!(state.outfits||[]).includes(b.outfit))fail('Choose an owned outfit.');state.outfit=b.outfit==='default'?null:b.outfit;}return commit(state);}
 if(path==='/upgrade'&&method==='POST') {const next=HOME_EXPANSIONS.find(h=>h.level===home.level+1);if(!next)fail('Your home is fully upgraded.',409);return commit(state,spend(next.cost),next.level);}
 if(path==='/home'&&method==='POST') {if(typeof b.open!=='boolean')fail('Choose whether friends can visit.');state.homeOpen=b.open;return commit(state);}
 if(path==='/visit'&&method==='POST') {
  online();const host=typeof b.hostId==='string'?b.hostId:me.id;
  if(!await canVisit(db,me.id,host,member.room_id,now))fail('Your friend must be online here and open their home to friends.',403);
  const h=await db.prepare('SELECT r.*,p.name,a.data,f.state AS chapter FROM residences r JOIN profiles p ON p.id=r.profile_id JOIN neighborhood_accounts a ON a.profile_id=r.profile_id LEFT JOIN first_hour f ON f.owner_id=p.owner_id WHERE r.profile_id=?').bind(host).first();
  if(!h)fail('That home is not available.',404);
  await db.prepare('INSERT INTO neighborhood_presence (profile_id,host_id,travel,local_x,local_z) VALUES (?,?,\'foot\',0,0) ON CONFLICT(profile_id) DO UPDATE SET host_id=excluded.host_id,travel=\'foot\',local_x=0,local_z=0').bind(me.id,host).run();
  const design=parse(h);return json({hostId:host,name:h.name,homeId:h.home_id,unit:h.unit,level:h.level,design:{placements:design.placements,wallpaper:design.wallpaper,car:design.car,plate:design.plate,garageTheme:design.garageTheme,decor:h.chapter?JSON.parse(h.chapter).decor:null}});
 }
 if(path==='/presence'&&method==='POST') {
  online();if(!['foot','car'].includes(b.travel)||![b.x,b.z].every(Number.isFinite)||Math.abs(b.x)>30||Math.abs(b.z)>25)fail('Invalid room position.');
  const previous=await db.prepare('SELECT * FROM neighborhood_presence WHERE profile_id=?').bind(me.id).first();let host=previous?.host_id||me.id;
  if(member.mode==='driving'||b.home===true)host=me.id;
  let evicted=false;if(host!==me.id&&!await canVisit(db,me.id,host,member.room_id,now)){host=me.id;evicted=true;}
  await db.prepare('INSERT INTO neighborhood_presence (profile_id,travel,host_id,local_x,local_z) VALUES (?,?,?,?,?) ON CONFLICT(profile_id) DO UPDATE SET travel=excluded.travel,host_id=excluded.host_id,local_x=excluded.local_x,local_z=excluded.local_z').bind(me.id,b.travel,host,b.x,b.z).run();
  return json({ok:true,evicted});
 }
 if(path==='/motor-seat'&&method==='POST'){
  online();const presence=await db.prepare('SELECT * FROM neighborhood_presence WHERE profile_id=?').bind(me.id).first();
  if(member.mode!=='destination'||presence?.venue!==MOTOR_CLUB.id)fail('Walk into the Motor Club first.',409);
  if(b.id===null){await db.prepare("UPDATE neighborhood_presence SET emote='' WHERE profile_id=?").bind(me.id).run();return json({ok:true});}
  const seat=MOTOR_SEATS.find(s=>s.id===b.id);if(!seat||Math.hypot(presence.local_x-seat.x,presence.local_z-seat.z)>2)fail('Walk closer to that seat.',409);
  const result=await db.prepare("UPDATE neighborhood_presence SET emote=?,emote_at=?,local_x=?,local_z=? WHERE profile_id=? AND NOT EXISTS (SELECT 1 FROM neighborhood_presence p JOIN world_members m ON m.profile_id=p.profile_id WHERE p.venue=? AND p.emote=? AND m.room_id=? AND m.mode='destination' AND m.last_seen>? AND p.profile_id<>?)").bind('sit:'+seat.id,now,seat.x,seat.z,me.id,MOTOR_CLUB.id,'sit:'+seat.id,member.room_id,now-WORLD_TTL,me.id).run();
  if(!result.meta.changes)fail('Someone is already sitting there.',409);return json({ok:true});
 }
 if(path==='/emote'&&method==='POST') {online();if(!state.emotes.includes(b.id))fail('Choose an owned emote.');await db.prepare('INSERT INTO neighborhood_presence (profile_id,emote,emote_at) VALUES (?,?,?) ON CONFLICT(profile_id) DO UPDATE SET emote=excluded.emote,emote_at=excluded.emote_at WHERE neighborhood_presence.emote_at<?').bind(me.id,b.id,now,now-1500).run();return json({ok:true});}
 const scope=async()=>{const p=await db.prepare('SELECT host_id,venue FROM neighborhood_presence WHERE profile_id=?').bind(me.id).first();if(member?.mode==='destination'&&['last-hand',MOTOR_CLUB.id].includes(p?.venue))return 'club:'+p.venue;let host=p?.host_id||me.id;if(host!==me.id&&!await canVisit(db,me.id,host,member.room_id,now))host=me.id;return ['apartment','garage'].includes(member?.mode)?member.mode+':'+host:'city';};
 if(path==='/social'&&method==='GET') {
  if(!member)return json({messages:[],contracts:[],players:[]});const place=await scope();
  const messages=await db.prepare('SELECT m.id,m.profile_id,p.name,m.text,m.created_at FROM neighborhood_messages m JOIN profiles p ON p.id=m.profile_id WHERE m.room_id=? AND m.scope=? AND m.created_at>? AND NOT EXISTS (SELECT 1 FROM neighborhood_mutes u WHERE u.owner_id=? AND u.target_id=m.profile_id) ORDER BY m.id DESC LIMIT 30').bind(member.room_id,place,now-600000,me.id).all();
  const contracts=await db.prepare("SELECT * FROM neighborhood_contracts WHERE room_id=? AND created_at>? AND status<>'cancelled' ORDER BY created_at DESC LIMIT 12").bind(member.room_id,now-1800000).all();
  const players=await db.prepare('SELECT p.id,p.name,m.mode,n.host_id,a.data FROM profiles p JOIN world_members m ON m.profile_id=p.id LEFT JOIN neighborhood_presence n ON n.profile_id=p.id LEFT JOIN neighborhood_accounts a ON a.profile_id=p.id WHERE m.room_id=? AND m.last_seen>?').bind(member.room_id,now-WORLD_TTL).all();
  const muted=await db.prepare('SELECT target_id FROM neighborhood_mutes WHERE owner_id=?').bind(me.id).all();
  const presence=await db.prepare('SELECT host_id FROM neighborhood_presence WHERE profile_id=?').bind(me.id).first();let visit=null;if(presence?.host_id&&presence.host_id!==me.id&&await canVisit(db,me.id,presence.host_id,member.room_id,now)){const host=await db.prepare('SELECT a.data,r.level,r.unit,f.state AS chapter FROM neighborhood_accounts a JOIN residences r ON r.profile_id=a.profile_id JOIN profiles p ON p.id=a.profile_id LEFT JOIN first_hour f ON f.owner_id=p.owner_id WHERE a.profile_id=?').bind(presence.host_id).first();if(host){const d=parse(host);visit={level:host.level,unit:host.unit,design:{placements:d.placements,wallpaper:d.wallpaper,car:d.car,plate:d.plate,garageTheme:d.garageTheme,decor:host.chapter?JSON.parse(host.chapter).decor:null}};}}
  return json({visit,messages:messages.results.reverse().map(m=>({id:m.id,playerId:m.profile_id,name:m.name,text:m.text,at:m.created_at})),contracts:contracts.results.map(c=>({...c,members:JSON.parse(c.members)})),players:players.results.map(p=>({id:p.id,name:p.name,mode:p.mode,hostId:p.host_id||p.id,open:parse(p).homeOpen===true})),muted:muted.results.map(m=>m.target_id),scope:place});
 }
 if(path==='/chat'&&method==='POST') {
  online();const text=typeof b.text==='string'?b.text.trim():'';if(!text||text.length>180||/[<>\x00-\x1f]/.test(text))fail('Use a message of 1–180 characters without markup.');
  const result=await db.prepare('INSERT INTO neighborhood_messages (profile_id,room_id,scope,text,created_at) SELECT ?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM neighborhood_messages WHERE profile_id=? AND created_at>?)').bind(me.id,member.room_id,await scope(),text,now,me.id,now-2000).run();if(!result.meta.changes)fail('Wait a moment before sending another message.',429);
  await db.prepare('DELETE FROM neighborhood_messages WHERE created_at<?').bind(now-86400000).run();return json({ok:true});
 }
 if(path==='/mute'&&method==='POST') {if(b.id===me.id||typeof b.id!=='string')fail('Choose another player.');if(b.muted===false)await db.prepare('DELETE FROM neighborhood_mutes WHERE owner_id=? AND target_id=?').bind(me.id,b.id).run();else await db.prepare('INSERT INTO neighborhood_mutes (owner_id,target_id) VALUES (?,?) ON CONFLICT DO NOTHING').bind(me.id,b.id).run();return json({ok:true});}
 if(path==='/report'&&method==='POST') {online();if(!Number.isSafeInteger(b.id)||typeof b.reason!=='string'||b.reason.length<3||b.reason.length>160)fail('Describe the issue in 3–160 characters.');const message=await db.prepare('SELECT id FROM neighborhood_messages WHERE id=? AND room_id=? AND scope=? AND created_at>?').bind(b.id,member.room_id,await scope(),now-600000).first();if(!message)fail('That message is no longer available.',404);await db.prepare('INSERT INTO neighborhood_reports (owner_id,message_id,reason,created_at) VALUES (?,?,?,?) ON CONFLICT DO NOTHING').bind(me.id,b.id,b.reason,now).run();return json({ok:true});}
 if(path==='/activity'&&method==='POST') {
  online();const definition=cityActivities(state.activity?.startedAt||now).find(a=>a.id===b.id);if(!definition)fail('Choose a city activity.');
  if(b.action==='cancel'){state.activity=null;return commit(state);}
  if(b.action==='start'){if(definition.rank&&rankFor(state.xp[definition.career])<definition.rank)fail('Earn 100 career XP to unlock this contact’s next job.',409);if(state.activity)fail('Finish or cancel your current city activity.',409);state.activity={id:definition.id,key:crypto.randomUUID(),stage:0,startedAt:now,stageAt:now,raceAt:0,repair:0};return commit(state);}
  const a=state.activity;if(!a||a.id!==b.id)fail('This activity is not active.',409);
  if(!near(member,definition.stops[a.stage]))fail('Reach the marked stop first.',409);
  const prev=definition.stops[a.stage-1];if(now-a.stageAt<(prev?Math.hypot(prev.x-member.x,prev.z-member.z)/65*1000:1500))fail('Complete the journey before checking in.',409);
  if(definition.repair&&a.stage===definition.stops.length-1){if(b.repair!==definition.repair[a.repair])fail('Follow Rae’s repair checklist in order.',409);a.repair++;if(a.repair<definition.repair.length)return commit(state);}
  if(a.stage===0&&definition.limit)a.raceAt=now;
  if(a.stage<definition.stops.length-1){a.stage++;a.stageAt=now;return commit(state);}
  if(definition.limit&&now-a.raceAt>definition.limit*1000){state.lastActivityResult='time-up';state.activity=null;return commit(state);}
  state.lastActivityResult='complete';const earned=award(state,'activity:'+a.key,definition.career,definition.reward,definition.xp);if(definition.limit){state.bestTime=Math.min(state.bestTime||Infinity,now-a.raceAt);}state.activity=null;return commit(state,home.credits+(earned||0));
 }
 if(path==='/coop'&&method==='POST') {
  online();
  if(b.action==='create') {
   const job=COOP_JOBS.find(j=>j.id===b.id);if(!job)fail('Choose a shared job.');
   const id=crypto.randomUUID(),r=await db.prepare("INSERT INTO neighborhood_contracts (id,room_id,host_id,job_id,members,created_at,stage_at) SELECT ?,?,?,?,?,?,? WHERE NOT EXISTS (SELECT 1 FROM neighborhood_contracts c,json_each(c.members) j WHERE j.value=? AND c.status IN ('forming','active') AND c.created_at>?)").bind(id,member.room_id,me.id,job.id,JSON.stringify([me.id]),now,now,me.id,now-1800000).run();if(!r.meta.changes)fail('Leave or finish your current crew job first.',409);return json({id});
  }
  const c=await db.prepare('SELECT * FROM neighborhood_contracts WHERE id=? AND room_id=? AND created_at>?').bind(typeof b.contract==='string'?b.contract:'',member.room_id,now-1800000).first();if(!c)fail('That crew job expired or belongs to another neighborhood.',404);
  const members=JSON.parse(c.members),job=COOP_JOBS.find(j=>j.id===c.job_id),has=members.includes(me.id);let query;
  if(b.action==='join') {if(c.status!=='forming'||has||members.length>=4)fail('This crew is full or already underway.',409);members.push(me.id);query=db.prepare("UPDATE neighborhood_contracts SET members=?,revision=revision+1 WHERE id=? AND revision=? AND NOT EXISTS (SELECT 1 FROM neighborhood_contracts c,json_each(c.members) j WHERE j.value=? AND c.status IN ('forming','active') AND c.created_at>?)").bind(JSON.stringify(members),c.id,c.revision,me.id,now-1800000);}
  else if(!has)fail('Join this crew first.',403);
  else if(b.action==='leave'||b.action==='cancel'){if(c.status==='complete')fail('This job is already complete.',409);if(c.host_id===me.id||c.status==='active')query=db.prepare("UPDATE neighborhood_contracts SET status='cancelled',revision=revision+1 WHERE id=? AND revision=?").bind(c.id,c.revision);else query=db.prepare('UPDATE neighborhood_contracts SET members=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(members.filter(id=>id!==me.id)),c.id,c.revision);}
  else if(b.action==='claim'){if(c.status!=='complete')fail('Finish the crew job together first.',409);const earned=award(state,'coop:'+c.id,job.career,job.reward,job.xp,job.furniture);if(earned===false)return json(snapshot());return commit(state,home.credits+earned);}
  else if(b.action==='start'||b.action==='checkpoint') {
   if(b.action==='start'&&(c.host_id!==me.id||c.status!=='forming'||members.length<2))fail('The host can start with two to four players.',409);
   if(b.action==='checkpoint'&&c.status!=='active')fail('This job is not active.',409);
   const stage=b.action==='start'?0:c.stage,target=job.stops[stage],previous=job.stops[stage-1];
   const rows=await db.prepare('SELECT * FROM world_members WHERE room_id=? AND last_seen>?').bind(member.room_id,now-5000).all();
   if(!members.every(id=>rows.results.some(p=>p.profile_id===id&&near(p,target))))fail('Bring every crew member to this stop. Reconnect anyone who is offline.',409);
   if(previous&&now-c.stage_at<Math.hypot(target.x-previous.x,target.z-previous.z)/65*1000)fail('Complete the route together first.',409);
   const next=b.action==='start'?1:c.stage+1,status=next>=job.stops.length?'complete':'active';
   query=db.prepare('UPDATE neighborhood_contracts SET stage=?,status=?,stage_at=?,revision=revision+1 WHERE id=? AND revision=?').bind(next,status,now,c.id,c.revision);
  } else fail('Choose a crew action.');
  const result=await query.run();if(!result.meta.changes)fail('Your crew changed. Refresh the job board.',409);return json({ok:true});
 }
 if(path==='/event'&&method==='POST') {const w=weekInfo(now),progress=state.weekly[w.id];if(!progress||progress.count<w.target)fail('Complete three city or crew jobs this week.',409);if(progress.claimed)return json(snapshot());progress.claimed=true;if(!state.inventory.includes(w.trophy))state.inventory.push(w.trophy);return commit(state,home.credits+w.reward);}
 fail('Page not found.',404);
}
