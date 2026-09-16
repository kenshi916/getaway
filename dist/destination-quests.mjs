import {passengerFor,storyFor} from './passengers.mjs?v=37';
const HOMES=['west','north','south','loft','westcourt','landmark-west','landmark-sunset'];
const GARAGES=['bay','northyard','pier','southyard','landmark-harbor','landmark-docks','landmark-south'];
const GARDENS=['gardens','landmark-gardens'];
const TASKS={
 jules:['SET DOWN THE SUPPER BAG','Leave the supper bag on the marked table.','Supper delivered'],
 mina:['DELIVER THE CUTTINGS','Place the seedlings on the marked potting table.','Seedlings delivered'],
 theo:['CHECK IN FOR SOUNDCHECK','Check Theo in at the marked desk.','Soundcheck confirmed'],
 nova:['COLLECT THE WORKSHOP KEYS','Collect the keys from the marked counter.','Keys collected'],
 elias:['SECURE THE LEDGER','Leave the ledger in the marked secure case.','Evidence secured'],
 roman:['DELIVER THE PROP CASE','Set the prop case on the marked table.','Props delivered'],
 celeste:['SIGN THE GUEST BOOK','Check Celeste in at the marked desk.','Private arrival confirmed'],
 nico:['HAND OVER THE PARCEL','Leave the urgent parcel at the marked counter.','Parcel delivered'],
 kit:['CONNECT THE PROTOTYPE','Connect the prototype at the marked workstation.','Prototype connected'],
 oscar:['SET DOWN THE CLOCK CASE','Place the clock case on the marked table.','Clock case delivered'],
 ivo:['COLLECT THE REPAIR PART','Collect the repair part from the marked counter.','Repair part collected'],
 rae:['CHECK THE WORK ORDER','Check the work order at the marked workstation.','Work order confirmed']
};
export function destinationQuest(job){
 const person=passengerFor(job),story=storyFor(job),id=job.dest.id,theme=HOMES.includes(id)?'apartment':GARAGES.includes(id)?'garage':GARDENS.includes(id)?'garden':'venue';
 const [action,instruction,done]=TASKS[person.id];
 return {id:job.id,destination:id,name:job.dest.name,title:story.title,personId:person.id,theme,action,instruction,done,door:theme==='garage'?'OPEN THE GARAGE':'OPEN THE FRONT DOOR',type:{apartment:'APARTMENT VISIT',garage:'WORKSHOP HANDOFF',garden:'GARDEN VISIT',venue:id==='dinerdoor'?'AFTER-HOURS CAFÉ':'BACKSTAGE VISIT'}[theme],color:{apartment:'#edbd79',garage:'#8ccebc',garden:'#b6dc85',venue:'#bbacec'}[theme]};
}
