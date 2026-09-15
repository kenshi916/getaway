export const HOME_VERSION=2;
export const HOME_SPAWN={x:-.6,z:2.8};
export const HOME_BOUNDS={minX:-7.28,maxX:7.28,minZ:-5.28,maxZ:5.28};
export const HOME_SPOTS=[
 {id:'laptop',x:3.25,z:-.9,label:'CHECK LAPTOP',room:'Bedroom'},
 {id:'wardrobe',x:5.85,z:-.25,label:'OPEN COLLECTION',room:'Bedroom'},
 {id:'bed',x:5.1,z:-1.35,label:'SAVE & REST',room:'Bedroom'},
 {id:'door',x:2.65,z:4.55,label:'HEAD DOWNSTAIRS',room:'Entry'},
 {id:'coffee',x:-1.05,z:-3.2,label:'MAKE COFFEE',room:'Kitchen'},
 {id:'tv',x:-5.7,z:-.25,label:'SWITCH TV',room:'Living room'}
];
export function homeRoom(x,z){return x>4.5&&z>.85?'Bathroom':x>1.35&&z<.85?'Bedroom':x>1.35?'Entry':z<-2.65?'Kitchen':'Living room';}
