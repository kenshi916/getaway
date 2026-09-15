// Authored passengers and ride rules. No wallet, rewards, or network dependency.
const bound=(n,a,b)=>Math.max(a,Math.min(b,n));
const chapter=(title,dest,request,after)=>({title,dest,request,after});
export const PASSENGERS=[
 {id:'jules',stop:'diner',name:'Jules Park',role:'Night cook',model:'k',color:'#dfac78',kind:'smooth',level:1,heat:0,
  bio:'Jules runs the diner grill after midnight and keeps a notebook of recipes for a food truck. Every extra shift goes into the truck fund. Tonight, the last bus left without him.',
  talk:'One day you will see my food truck parked right here. First meal is on me.',
  chapters:[chapter('After the last order','south','Long shift. A quiet ride home would be perfect.','Made it. Tomorrow I start looking at second-hand food trucks.'),chapter('The tasting box','bay','Taking samples to the garage crew. Please keep the corners gentle.','They asked for seconds. That is a good sign, right?'),chapter('Keys to the kitchen','southyard','I finally bought the truck. Take me to collect the keys.','I have a kitchen on wheels. Come back hungry.')],
  crash:'Easy on the corners. I have been on my feet for twelve hours.'},
 {id:'mina',stop:'market',name:'Mina Reyes',role:'Florist',model:'e',color:'#bd9bc5',kind:'fragile',level:1,heat:0,
  bio:'Mina inherited a flower stall and a box of seeds from her grandmother. She is restoring the abandoned planters at North Gardens, one night at a time.',
  talk:'My grandmother said a city only feels like home when something grows in it.',
  chapters:[chapter('A box of cuttings','gardens','These seedlings are fragile. No bumps, please.','Every seedling made it. You should visit when they bloom.'),chapter('The rooftop order','loft','My first rooftop garden order. Keep the pots in one piece.','That order pays for the next month at the stall.'),chapter('Opening night','gardens','The garden is ready. These are the last flowers for opening night.','We did it. There is a bench in there with your name on it.')],
  crash:'The pots are sliding! Please take it easy.'},
 {id:'theo',stop:'station',name:'Theo Bell',role:'Session musician',model:'f',color:'#8ec2b1',kind:'rush',level:1,heat:0,
  bio:'Theo plays guitar on station platforms and records songs in a rented room. A last-minute cancellation has opened a slot at Starlight. Getting there is the audition.',
  talk:'I have played this song to commuters a thousand times. A real stage is different.',
  chapters:[chapter('One open slot','stage','Soundcheck starts soon. Can we make it?','I am on time. Now I just have to remember the first chord.'),chapter('The studio call','east','The producer has one slot left tonight. Let us get there.','They want to record the whole set. This is actually happening.'),chapter('Top of the bill','stage','My name is on the poster. Doors open in a minute.','From the station platform to this. You got me to every one.')],
  crash:'I need to arrive, not become a road story.'},
 {id:'nova',stop:'cinema',name:'Nova Quinn',role:'Stunt performer',model:'q',color:'#b0bbd4',kind:'thrill',level:2,heat:0,
  bio:'Nova does the dangerous parts of movies and gets cut out of the posters. She is saving for her own stunt workshop, where beginners can learn without getting hurt.',
  talk:'The mask is wardrobe. The bruises are mine. Film work is glamorous like that.',
  chapters:[chapter('Off the clock','southyard','Show me four seconds of nitro. Keep the car in one piece.','That launch was good. You ever think about stunt driving?'),chapter('The test session','skyline','I need a clean burst of speed before the next rehearsal.','That is the feeling I needed. Smooth hands, brave right foot.'),chapter('A place of her own','east','Workshop lease is signed. One victory boost on the way?','My own name on the door. No more hiding behind somebody else.')],
  crash:'A stunt only counts if you can drive away from it.'},
 {id:'elias',stop:'bank',name:'Elias Voss',role:'Forensic accountant',model:'r',color:'#d6ba8a',kind:'stealth',level:3,heat:2,
  bio:'Elias found a second set of books inside Union Trust. He copied the ledger, left his access card on the desk, and called a driver he had never met.',
  talk:'I spent ten years making those numbers balance. Tonight I finally read them.',
  chapters:[chapter('The second ledger','north','Someone is following me. Lose the tail before the address.','No one followed us. I can make the call now.'),chapter('A second witness','pier','Same rule. Nobody follows us to this meeting.','The dock records match. This was bigger than I thought.'),chapter('Going on record','skyline','The reporter is waiting. Get us there without a tail.','It is public now. They cannot put the numbers back in the drawer.')],
  crash:'The evidence is in this bag. I would like us both to survive.'},
 {id:'roman',stop:'hotel',name:'Roman Vale',role:'Travelling illusionist',model:'p',color:'#aca5d7',kind:'fragile',level:2,heat:0,
  bio:'Roman travels with a battered case of handmade stage props. His big show was cancelled, so he has been performing smaller ones in courtyards and borrowed rooms.',
  talk:'A good trick is just a promise you keep in a way nobody expects.',
  chapters:[chapter('Handle with wonder','skyline','Glass props in the case. Please avoid collisions.','Nothing broken. I owe you a trick after the show.'),chapter('A borrowed stage','stage','Someone gave me a stage for tonight. Keep this case safe.','A full room. I had forgotten what that sounded like.'),chapter('The final rehearsal','loft','The new show is in this case. Let us get it there intact.','Opening night is sold out. There is a seat saved for you.')],
  crash:'That was not the kind of disappearing glass I had in mind.'},
 {id:'celeste',stop:'grand',name:'Celeste Ward',role:'Theatre singer',model:'n',color:'#a5cbb0',kind:'stealth',level:3,heat:2,
  bio:'Celeste sings under a stage name and leaves in costume to avoid being recognised. A dispute with her old promoter has made tonight’s trip home less private than she hoped.',
  talk:'People hear the stage name and forget there is a person underneath it.',
  chapters:[chapter('Through the side door','dinerdoor','Please lose whoever is following us before we stop.','A quiet diner. This is better than any after-party.'),chapter('The rehearsal room','east','I found a new band. I need a clean arrival.','They want my songs, not just the stage name.'),chapter('Her own encore','stage','One last quiet entrance. Tonight I sing my own set.','My name. My songs. Thank you for getting me here.')],
  crash:'I am already having a dramatic enough evening.'},
 {id:'nico',stop:'motel',name:'Nico Vega',role:'Bicycle courier',model:'c',color:'#df9c86',kind:'rush',level:2,heat:1,
  bio:'Nico normally does every delivery on a battered bicycle. Tonight the chain snapped with one urgent handoff left. Missing it means losing the route that pays his rent.',
  talk:'I know every alley in this city. My bicycle just chose a terrible night to quit.',
  chapters:[chapter('The broken chain','pier','Urgent handoff. Get me to the pier before the window closes.','Handoff made. The route is still mine.'),chapter('A borrowed wheel','southyard','The repair shop closes soon. Can you get me there?','New chain, straight wheel. I am back in business.'),chapter('His own route','northyard','First delivery for my own courier business. Do not let me be late.','My name is on the invoice this time. That feels good.')],
  crash:'I am starting to miss the bicycle.'},
 {id:'kit',stop:'arcade',name:'Kit Mercer',role:'Arcade game maker',model:'b',color:'#a0c699',kind:'fragile',level:1,heat:0,
  bio:'Kit repairs arcade cabinets by day and builds games after closing. Tonight’s passenger is mostly nerves; tonight’s luggage is the only working prototype.',
  talk:'There is no backup. I know. Everybody tells me that after I say it.',
  chapters:[chapter('The only prototype','east','Prototype on my lap. A crash could end demo night.','It still boots. You just saved six months of work.'),chapter('Demo night','stage','They invited me to show the game. Please protect the hardware.','People lined up to play it. I thought nobody would care.'),chapter('Player two','loft','I am meeting my first teammate. The new build is fragile.','There are two names on the title screen now.')],
  crash:'That sound better have been the car, not the prototype.'},
 {id:'oscar',stop:'pawn',name:'Oscar Reed',role:'Clock restorer',model:'j',color:'#a2c8dd',kind:'smooth',level:2,heat:0,
  bio:'Oscar fixes the clocks other people throw away. He works slowly, takes the same route home, and claims he can tell a good driver by the first corner.',
  talk:'People think a stopped clock is finished. Usually it just needs someone patient.',
  chapters:[chapter('No sudden turns','west','Easy corners. I have tiny watch parts in every pocket.','A patient driver. That is rarer than you think.'),chapter('A familiar chime','loft','This old clock belongs to a friend. Let us take the easy way.','She recognised the chime before I even opened the case.'),chapter('Time for himself','gardens','No delivery tonight. Just a gentle ride to the gardens.','For once, I have nowhere else I need to be.')],
  crash:'We are driving a car, not winding a clock.'},
 {id:'ivo',stop:'docks',name:'Ivo Marin',role:'Dock mechanic',model:'a',color:'#d6af80',kind:'rush',level:3,heat:1,
  bio:'Ivo keeps the harbour cranes moving. A stalled delivery has stranded his younger brother across town, and the night supervisor is already counting the minutes.',
  talk:'You can fix almost anything if you get there before somebody makes it worse.',
  chapters:[chapter('Before the gate closes','southyard','My brother is stuck at the motor yard. We have a deadline.','Gate was still open. He is all right.'),chapter('The missing part','bay','They found the part. Get me there before the courier leaves.','Perfect timing. The crane will be running by morning.'),chapter('First day off','westcourt','I promised to make the family dinner. Help me keep that promise.','They waited for me. I never used to make it home in time.')],
  crash:'I repair cranes. Please do not make me repair this car too.'},
 {id:'rae',stop:'roadhouse',name:'Rae Brooks',role:'Custom-car mechanic',model:'m',color:'#92bcb8',kind:'thrill',level:2,heat:0,
  bio:'Rae builds engines that other shops call hopeless. She sold her own project car to open a workshop and still judges every ride by how the engine sounds under load.',
  talk:'People hear an old engine. I hear what it could become.',
  chapters:[chapter('Let it breathe','westcourt','Give it four seconds of boost. Let me hear the engine work.','Good engine. Bring it by the shop when you need a tune-up.'),chapter('The first customer','southyard','First customer is waiting. One clean pull on the way?','That sound is exactly what I want from the rebuild.'),chapter('Built from scratch','bay','The workshop is open. Let us celebrate with a clean boost.','Started with a toolbox. Now there is a sign above the door.')],
  crash:'That noise is going to be expensive.'}
];
export const PASSENGER_MODELS=[...new Set(PASSENGERS.map(p=>p.model))];
export const RIDE_RULES={
 smooth:{name:'Smooth ride',goal:'Keep comfort at 80% or higher',bonus:350},
 fragile:{name:'Precious cargo',goal:'No collisions; cargo at 85% or higher',bonus:450},
 rush:{name:'Against the clock',goal:'Arrive before the passenger deadline',bonus:500},
 thrill:{name:'A little adrenaline',goal:'Boost for 4 seconds; at most 1 collision',bonus:450},
 stealth:{name:'Lose the tail',goal:'Lose your wanted level before drop-off',bonus:650}
};
export const passengerFor=job=>PASSENGERS.find(p=>p.id===job?.personId)||PASSENGERS.find(p=>p.stop===job?.stopId)||PASSENGERS[0];
export const passengerPortrait=person=>'/assets/models/passengers/character-'+person.model+'.png';
export const storyFor=job=>passengerFor(job).chapters[bound(Number(job?.chapter)||0,0,2)];
export function cleanPassengerHistory(raw){const history={};for(const p of PASSENGERS){const v=raw?.[p.id];if(!v||!Number.isFinite(v.rides))continue;history[p.id]={rides:bound(Math.floor(v.rides),0,99999),chapters:bound(Math.floor(Number(v.chapters)||0),0,3),bestRating:bound(Math.floor(Number(v.bestRating)||0),0,5),lastRating:bound(Math.floor(Number(v.lastRating)||0),0,5)};}return history;}
export function passengerJob(stop,index,destinations,history={}){
 const person=PASSENGERS.find(p=>p.stop===stop.id)||PASSENGERS[0],chapterIndex=Math.min(2,history[person.id]?.chapters||0),story=person.chapters[chapterIndex];
 const dest=destinations.find(d=>d.id===story.dest)||destinations[0];
 return{id:stop.id+'-'+index,stopId:stop.id,personId:person.id,chapter:chapterIndex,name:person.name,level:person.level,value:[0,850,1450,2100][person.level],dest:{...dest},kind:person.kind,heat:person.heat,picked:false,cooldown:0};
}
export function startRide(run,job,car){const distance=Math.abs((car?.x||0)-job.dest.x)+Math.abs((car?.z||0)-job.dest.z);return{elapsed:0,distance:0,comfort:100,cargo:100,boost:0,collisions:0,crashesAt:run.crashes,lastHealth:car?.health??100,lastX:car?.x??null,lastZ:car?.z??null,deadline:bound(Math.ceil(distance/9+25),30,75),midSpoken:false,crashSpoken:false,lateSpoken:false};}
export function cleanRide(raw,run,job,car){const r=startRide(run,job,car);if(!raw||typeof raw!=='object')return r;for(const key of ['elapsed','distance','boost','collisions'])if(Number.isFinite(raw[key]))r[key]=bound(raw[key],0,100000);for(const key of ['comfort','cargo'])if(Number.isFinite(raw[key]))r[key]=bound(raw[key],0,100);if(Number.isFinite(raw.deadline))r.deadline=bound(raw.deadline,30,75);r.midSpoken=raw.midSpoken===true;r.crashSpoken=raw.crashSpoken===true;r.lateSpoken=raw.lateSpoken===true;return r;}
export function updateRides(run,car,dt){
 const messages=[];if(run.phase!=='driving')return messages;dt=bound(dt,0,.05);
 for(const p of run.passengers){const r=p.ride||(p.ride=startRide(run,p,car)),person=passengerFor(p),crashes=Math.max(0,run.crashes-r.crashesAt),lost=Math.max(0,r.lastHealth-car.health);
  r.elapsed+=dt;r.distance+=r.lastX===null?0:Math.min(4,Math.hypot(car.x-r.lastX,car.z-r.lastZ));r.lastX=car.x;r.lastZ=car.z;r.crashesAt=run.crashes;r.lastHealth=car.health;r.collisions+=crashes;
  const rough=(car.drifting?5:0)+(car.speed>26?2:0)+(Math.abs(car.yawRate)>1.6&&car.speed>12?3:0);
  r.comfort=bound(r.comfort-crashes*22-lost*.35-rough*dt,0,100);r.cargo=bound(r.cargo-crashes*32-(car.drifting?3*dt:0),0,100);if(car.boosting)r.boost+=dt;
  if(crashes&&!r.crashSpoken){messages.push({job:p,line:person.crash});r.crashSpoken=true;}
  else if(p.kind==='rush'&&r.elapsed>r.deadline&&!r.lateSpoken){messages.push({job:p,line:'We missed the deadline. Please still get me there safely.'});r.lateSpoken=true;}
  else if(r.elapsed>7&&!r.midSpoken){messages.push({job:p,line:person.talk});r.midSpoken=true;}
 }
 return messages;
}
export function rideStatus(job,wanted=0){const r=job.ride,rule=RIDE_RULES[job.kind]||RIDE_RULES.smooth;if(!r)return{...rule,text:rule.goal,progress:0,success:false,canDrop:true};let success=false,text='',progress=0;
 if(job.kind==='rush'){const left=Math.max(0,Math.ceil(r.deadline-r.elapsed));success=left>0;text=left?left+'s to make the deadline':'Late · base fare still pays';progress=left/r.deadline;}
 else if(job.kind==='fragile'){success=r.collisions===0&&r.cargo>=85;text=Math.round(r.cargo)+'% cargo · '+r.collisions+' collisions';progress=r.cargo/100;}
 else if(job.kind==='thrill'){success=r.boost>=4&&r.collisions<=1;text=Math.min(4,r.boost).toFixed(1)+' / 4s boost · '+r.collisions+' collisions';progress=Math.min(1,r.boost/4);}
 else if(job.kind==='stealth'){success=wanted<.8;text=success?'Tail lost · clear to drop off':'Lose the cops before stopping';progress=success?1:Math.max(0,1-wanted/5);}
 else{success=r.comfort>=80;text=Math.round(r.comfort)+'% comfort · target 80%';progress=r.comfort/100;}
 return{...rule,text,progress,success,canDrop:job.kind!=='stealth'||success};
}
export function scoreRide(job,combo,wanted){const r=job.ride,status=rideStatus(job,wanted),eligible=!!r&&r.elapsed>=2&&r.distance>=12,quality=r?Math.min(r.comfort,job.kind==='fragile'?r.cargo:100):100,base=Math.round(job.value*combo),tip=eligible?Math.round(base*.2*Math.max(0,(quality-50)/50)):0,bonus=eligible&&status.success?status.bonus:0,rating=bound(Math.round(quality/25)+(eligible&&status.success?1:0),1,5);return{base,tip,bonus,payment:base+tip+bonus,rating,goalMet:eligible&&status.success};}
export function rememberRide(profile,result){profile.passengerHistory=cleanPassengerHistory(profile.passengerHistory);const id=passengerFor(result.passenger).id,old=profile.passengerHistory[id]||{rides:0,chapters:0,bestRating:0};profile.passengerHistory[id]={rides:Math.min(99999,old.rides+1),chapters:Math.min(3,old.chapters+(result.goalMet&&result.passenger.chapter===old.chapters?1:0)),bestRating:Math.max(old.bestRating,result.rating),lastRating:result.rating};}

export function rideFarewell(result){if(result.goalMet)return storyFor(result.passenger).after;return {smooth:'We made it, but that was a rough ride. Easy corners next time?',fragile:'Some of the cargo took a beating. I will need to try this again.',rush:'Too late for the appointment. Thanks for getting me here safely, though.',thrill:'We made it. Next time, let us try a clean boost.',stealth:'Thanks for the ride. We will try the full request another night.'}[result.passenger.kind];}
