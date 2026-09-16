import {firstHourState,advanceFirstHour,cleanDecor} from '../dist/first-hour.mjs';
export async function firstHourApi(request,{db,owner,body,json,fail,url}){
 const path=url.pathname,method=request.method;
 const view=row=>({state:firstHourState(JSON.parse(row?.state||'{}')),revision:row?.revision||0});
 const get=()=>db.prepare('SELECT * FROM first_hour WHERE owner_id=?').bind(owner).first();
 if(path.startsWith('/api/first-hour/visit/')&&method==='GET'){
  const token=path.slice('/api/first-hour/visit/'.length);if(!/^[a-f0-9-]{36}$/.test(token))fail('This invitation is not valid.',404);
  const row=await db.prepare('SELECT f.state,p.name,r.home_id,r.unit,r.level FROM first_hour f LEFT JOIN profiles p ON p.owner_id=f.owner_id LEFT JOIN residences r ON r.profile_id=p.id WHERE f.invite_token=?').bind(token).first();
  if(!row)fail('This home invitation has been closed.',404);const state=firstHourState(JSON.parse(row.state));return json({name:row.name||'Your friend',decor:state.decor,reward:state.reward,homeId:row.home_id||'last-exit',unit:row.unit||4,level:row.level||0});
 }
 if(path==='/api/first-hour'&&method==='GET')return json(view(await get()));
 if(path==='/api/first-hour'&&method==='POST'){
  const b=await body(request);if(!Number.isSafeInteger(b.revision)||b.revision<0)fail('Refresh your chapter before saving.');
  const previous=await get(),current=view(previous);if(b.revision!==current.revision)fail('Your chapter changed in another tab. Reload it and try again.',409);
  let state;try{state=b.event?advanceFirstHour(current.state,b.event):firstHourState(current.state);}catch(e){fail(e.message);}
  if(b.decor){state.decor=cleanDecor(b.decor);if(state.decor.underglow&&!state.reward)fail('Earn your housewarming kit to unlock underglow.');if(state.reward)state.decorated=true;}
  const result=await db.prepare('INSERT INTO first_hour(owner_id,state,revision,updated_at) VALUES (?,?,1,?) ON CONFLICT(owner_id) DO UPDATE SET state=excluded.state,revision=first_hour.revision+1,updated_at=excluded.updated_at WHERE first_hour.revision=?').bind(owner,JSON.stringify(state),Date.now(),b.revision).run();
  if(!result.meta.changes)fail('Your chapter changed. Reload it and try again.',409);return json(view(await get()));
 }
 if(path==='/api/first-hour/invite'&&['POST','DELETE'].includes(method)){
  if(!await get())fail('Move into your apartment first.',409);
  const token=method==='POST'?crypto.randomUUID():null;await db.prepare('UPDATE first_hour SET invite_token=? WHERE owner_id=?').bind(token,owner).run();return json({path:token?'/play/?visit='+token:null});
 }
 fail('Page not found.',404);
}
