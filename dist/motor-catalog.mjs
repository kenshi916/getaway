export const MOTOR_CLUB={id:'motor-club',name:'Rae’s Motor Club',x:-90,z:36,radius:12};
export const MOTOR_BAYS=Array.from({length:8},(_,i)=>({id:'bay-'+i,x:[-10.5,-3.5,3.5,10.5][i%4],z:i<4?-5:4}));
export const MOTOR_SEATS=[{id:'seat-0',x:-11,z:10,heading:Math.PI},{id:'seat-1',x:-9,z:10,heading:Math.PI}];
export const MOTOR_SPOTS=[{id:'style',x:0,z:-9.4,label:'CUSTOMIZE MY RIDE'},{id:'jobs',x:10.5,z:-9.4,label:'CREW JOB BOARD'},{id:'chat',x:-10.5,z:8,label:'LOUNGE & CHAT'},{id:'exit',x:0,z:11,label:'LEAVE MOTOR CLUB'},...MOTOR_SEATS.map(s=>({...s,label:'TAKE A SEAT'})),...MOTOR_BAYS.map(b=>({...b,z:b.z+3.3,label:'INSPECT THIS RIDE'}))];
