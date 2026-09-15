export const HOMES=[
 {id:'last-exit',name:'Last Exit Apartment',district:'Downtown',x:36,z:54,description:'Above the garage. Always close to your next ride.'},
 {id:'northside',name:'Northside Loft',district:'Downtown',x:18,z:-36,description:'A loft above the busy downtown streets.'},
 {id:'riverside',name:'Riverside Homes',district:'Downtown',x:-18,z:36,description:'A familiar doorstep on the riverside route.'},
 {id:'rooftop',name:'Rooftop Loft',district:'Downtown',x:36,z:-18,description:'Room for a rooftop garden above the city.'},
 {id:'west-court',name:'West Court',district:'Downtown',x:-72,z:90,description:'A courtyard home off the motor yard route.'}
];
export const AVATARS=['jules','mina','theo','rae'];
export const STATUSES=[{id:'off-duty',label:'Off duty'},{id:'on-shift',label:'On a shift'},{id:'at-home',label:'At home'},{id:'in-garage',label:'In the garage'},{id:'exploring',label:'Exploring the city'}];
export function homeRouteFromSearch(search){return HOMES.find(h=>h.id===new URLSearchParams(search||'').get('friendHome'))||null;}
