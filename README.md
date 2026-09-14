# GETAWAY — The Night Shift

A self-contained solo arcade driving game. Serve `dist/` over HTTP. All models, fonts, and libraries are local; no installation or build is required.

## Play

WASD / arrow keys drive and reverse. Space is the handbrake; Shift is nitro. C switches camera. J chooses a job. Tab routes to the garage. E banks the haul when stopped there. R recovers a stuck car. Mobile uses simultaneous touch steering, pedals, drift, and nitro.

Eight pickup spots generate jobs with three risk levels and six destinations. Stop in a pickup ring to board, then stop at a hideout to deliver. Deliveries pay arcade credits, add time, and increase the streak multiplier. Police pursue and search last-seen positions; roadblocks, destructible props, traffic, and ramps create escape opportunities. Return to the garage and bank to finish a run. Losing forfeits the unbanked haul.

The garage has three cars with distinct speed, acceleration, handling, capacity, and durability, plus four body tints. Banked credits, cars, paint, and preferences are stored locally on the device. No shared account, multiplayer, wallet, or real-money payouts are connected.

## Implementation

`driving.mjs` contains driving physics, city collision bounds, road routing, job state, settlement, and profile validation. `getaway.js` renders the city, imported assets, driving controls, traffic and police, missions, garage, effects, audio, and HUD. Buildings fade when they obstruct the chase camera. Fixed scenery is batched for rendering efficiency.

Models: Kenney Blocky Characters, Car Kit, and City Kit Roads (CC0). Three.js 0.170.0 (MIT). Space Mono (SIL Open Font License). Credits and licenses are included in the app and `dist/assets/LICENSES.txt`.

Validation: all 135 road route pairs clear collision bounds; police driving simulations reach all eight pickups; each car accelerates, reverses, steers, and uses nitro; ramps launch and land; pickup/capacity/delivery/banking, repeat settlement prevention, vehicle unlocks, and profile reload checked. A Node simulation with a renderer stub runs the application pickup-to-bank flow. These checks do not constitute a browser rendering or physical-device test.
