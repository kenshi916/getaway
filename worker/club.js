import {CLUB,TABLES,handValue,utcDay} from '../dist/club-catalog.mjs';
import {WORLD_TTL} from '../dist/world-catalog.mjs';
const empty=()=>({phase:'lobby',seats:[],dealer:[],deck:[],deadline:0,round:0});
function shuffled(){const deck=Array.from({length:52},(_,i)=>i);for(let i=51;i>0;i--){let n;const bound=4294967296-4294967296%(i+1);do{n=crypto.getRandomValues(new Uint32Array(1))[0];}while(n>=bound);const j=n%(i+1);[deck[i],deck[j]]=[deck[j],deck[i]];}return deck;}
export async function clubApi(request,{db,me,body,json,fail,url}){
 if(!me)fail('Create your player name and join a neighborhood first.',409);
 const now=Date.now(),b=request.method==='POST'?await body(request):{},path=url.pathname.replace('/api/club','')||'/';
 const member=await db.prepare('SELECT m.*,p.venue,p.local_x,p.local_z FROM world_members m LEFT JOIN neighborhood_presence p ON p.profile_id=m.profile_id WHERE m.profile_id=? AND m.last_seen>?').bind(me.id,now-WORLD_TTL).first();
 if(!member)fail('Join a neighborhood to visit Last Hand.',409);
 if(request.method==='POST'&&b.session!==member.session)fail('Reconnect to your neighborhood.',409);
 const inside=member.mode==='destination'&&member.venue===CLUB.id;
 await db.prepare('INSERT INTO club_accounts (profile_id,chips,gift_day) VALUES (?,500,?) ON CONFLICT DO NOTHING').bind(me.id,utcDay(now)).run();
 const account=()=>db.prepare('SELECT chips,gift_day FROM club_accounts WHERE profile_id=?').bind(me.id).first();
 const getTable=async id=>{const key=member.room_id+':'+id;await db.prepare('INSERT INTO club_tables (id,room_id,data,updated_at) VALUES (?,?,?,?) ON CONFLICT DO NOTHING').bind(key,member.room_id,JSON.stringify(empty()),now).run();return db.prepare('SELECT * FROM club_tables WHERE id=?').bind(key).first();};
 async function commit(row,state,changes=[],guard=null){
  const op=crypto.randomUUID();const q=db.prepare('UPDATE club_tables SET data=?,revision=revision+1,operation=?,updated_at=? WHERE id=? AND revision=?'+(guard?' AND EXISTS (SELECT 1 FROM club_accounts WHERE profile_id=? AND chips>=?)':''));
  const params=[JSON.stringify(state),op,now,row.id,row.revision,...(guard?[guard.id,guard.cost]:[])];
  const batch=[q.bind(...params),...changes.map(c=>db.prepare('UPDATE club_accounts SET chips=chips+? WHERE profile_id=? AND EXISTS (SELECT 1 FROM club_tables WHERE id=? AND operation=?)').bind(c.amount,c.id,row.id,op))];
  const r=await db.batch(batch);if(!r[0].meta.changes)fail('The table changed. Try again.',409);
  return {...row,data:JSON.stringify(state),revision:row.revision+1};
 }
 async function finish(row,s){
  if(s.phase!=='playing'||s.seats.some(p=>p.status==='playing'))return row;
  while(handValue(s.dealer)<17)s.dealer.push(s.deck.pop());const dealer=handValue(s.dealer),changes=[];
  for(const p of s.seats.filter(p=>p.hand.length)){
   const total=handValue(p.hand),amount=total>21?0:dealer>21||total>dealer?20:total===dealer?10:0;
   p.result=amount===20?'You win':amount===10?'Push — stake returned':'Dealer wins';p.payout=amount;p.status='done';if(amount)changes.push({id:p.id,amount});
  }
  s.phase='results';s.deadline=0;s.deck=[];return commit(row,s,changes);
 }
 async function maintain(row){
  let s=JSON.parse(row.data),changed=false;const live=await db.prepare('SELECT m.profile_id FROM world_members m JOIN neighborhood_presence p ON p.profile_id=m.profile_id WHERE m.room_id=? AND m.mode=\'destination\' AND p.venue=? AND m.last_seen>?').bind(member.room_id,CLUB.id,now-WORLD_TTL).all();const ids=new Set(live.results.map(p=>p.profile_id)),refunds=[];
  for(const p of s.seats){if(s.phase==='playing'&&p.status==='playing'&&(!ids.has(p.id)||now>=s.deadline)){p.status='stood';changed=true;}if(s.phase!=='playing'&&!ids.has(p.id)){if(p.status==='ready')refunds.push({id:p.id,amount:10});changed=true;}}
  if(s.phase!=='playing')s.seats=s.seats.filter(p=>ids.has(p.id));
  if(changed)row=await commit(row,s,refunds);
  return finish(row,s);
 }
 const publicTable=row=>{const s=JSON.parse(row.data);return {id:Number(row.id.split(':')[1]),revision:row.revision,phase:s.phase,round:s.round,deadline:s.deadline,dealer:s.phase==='playing'?[s.dealer[0],null]:s.dealer,seats:s.seats.map(({id,name,hand,status,result,payout})=>({id,name,hand,status,result,payout}))};};
 if(path==='/'&&request.method==='GET'){
  const tables=[];for(const t of TABLES)tables.push(publicTable(await maintain(await getTable(t.id))));
  return json({account:await account(),tables,inside,day:utcDay(now),serverTime:now,playerId:me.id});
 }
 if(!inside)fail('Walk into Last Hand first.',409);
 if(path==='/chips'&&request.method==='POST'){
  await db.prepare('UPDATE club_accounts SET chips=MAX(chips,500),gift_day=? WHERE profile_id=? AND gift_day<>?').bind(utcDay(now),me.id,utcDay(now)).run();return json({ok:true,account:await account()});
 }
 if(path==='/table'&&request.method==='POST'){
  const def=TABLES.find(t=>t.id===b.table);if(!def)fail('Choose a table.');
  let row=await maintain(await getTable(def.id)),s=JSON.parse(row.data),seat=s.seats.find(p=>p.id===me.id);
  if(b.round!==undefined&&b.round!==s.round)fail('A new hand has started. Review it before choosing an action.',409);
  if(b.revision!==row.revision)fail('The table changed. Try again.',409);
  if(b.action==='sit'){
   if(Math.hypot(member.local_x-def.x,member.local_z-def.z)>4.2)fail('Walk closer to this card table.',409);
   if(seat)return json({ok:true});if(s.phase==='playing'||s.seats.length>=4)fail('Wait for a free seat after this hand.',409);
   const other=await getTable(def.id===1?2:1);if(JSON.parse(other.data).seats.some(p=>p.id===me.id))fail('Leave your other table first.',409);
   s.seats.push({id:me.id,name:me.name,hand:[],status:'watching',result:'',payout:0});await commit(row,s);return json({ok:true});
  }
  if(!seat)fail('Take a seat first.',409);
  const changes=[];
  if(b.action==='leave'){
   if(s.phase==='playing'&&seat.hand.length)fail('Finish this hand before leaving your seat.',409);
   if(seat.status==='ready')changes.push({id:me.id,amount:10});s.seats=s.seats.filter(p=>p.id!==me.id);
  }else if(b.action==='ready'){
   if(s.phase==='playing'||seat.status==='ready')fail('Wait for the current hand.',409);
   if(s.phase==='results'){s.phase='lobby';s.dealer=[];for(const p of s.seats){p.hand=[];p.status='watching';p.result='';p.payout=0;}}
   seat.status='ready';await commit(row,s,[{id:me.id,amount:-10}],{id:me.id,cost:10});return json({ok:true});
  }else if(b.action==='deal'){
   if(s.phase!=='lobby'||seat.status!=='ready')fail('Put in 10 free chips first.',409);
   s.deck=shuffled();s.dealer=[s.deck.pop(),s.deck.pop()];s.phase='playing';s.round++;s.deadline=now+60000;
   for(const p of s.seats){p.hand=p.status==='ready'?[s.deck.pop(),s.deck.pop()]:[];p.status=p.hand.length?(handValue(p.hand)===21?'stood':'playing'):'watching';p.result='';p.payout=0;}
  }else if(b.action==='hit'||b.action==='stand'){
   if(s.phase!=='playing'||seat.status!=='playing')fail('Your turn has finished.',409);
   if(b.action==='hit')seat.hand.push(s.deck.pop());if(b.action==='stand'||handValue(seat.hand)>=21)seat.status='stood';
  }else fail('Choose a table action.');
  row=await commit(row,s,changes);await finish(row,s);return json({ok:true});
 }
 fail('Page not found.',404);
}
