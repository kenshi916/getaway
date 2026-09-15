export const HOME_VERSION=3;
export const HOME_SPAWN={x:-3.5,z:2.5};
export const HOME_BOUNDS={minX:-10.48,maxX:10.48,minZ:-7.68,maxZ:7.68};
export const HOME_SPOTS=[
 {id:'garage',x:.2,z:6.65,label:'ENTER GARAGE',room:'Entry'},
 {id:'laptop',x:3.8,z:-1.65,label:'CHECK LAPTOP',room:'Bedroom'},
 {id:'wardrobe',x:9,z:-.35,label:'OPEN COLLECTION',room:'Bedroom'},
 {id:'bed',x:7,z:-3.65,label:'SAVE & REST',room:'Bedroom'},
 {id:'door',x:3.8,z:6.95,label:'HEAD DOWNSTAIRS',room:'Entry'},
 {id:'coffee',x:-1.8,z:-5.95,label:'MAKE COFFEE',room:'Kitchen'},
 {id:'tv',x:-9,z:1,label:'SWITCH TV',room:'Living room'},
 {id:'sofa',x:-5.05,z:2,label:'SIT & WATCH TV',room:'Living room'},
 {id:'shower',x:9.3,z:3.7,label:'TAKE A SHOWER',room:'Bathroom'}
];
export function homeRoom(x,z){return x>6.6&&z>1.1?'Bathroom':x>1.6&&z<1.1?'Bedroom':x>1.6?'Entry':z<-4.3?'Kitchen':'Living room';}
