# GETAWAY — The Night Shift

A self-contained solo arcade driving game. Serve `dist/` over HTTP. All models, fonts, and libraries are local; no installation or build is required.

## Play

WASD / arrow keys drive and reverse. Space is the handbrake; Shift is nitro. C switches camera. J chooses a job. Tab routes to the garage. E banks the haul when stopped there. R recovers a stuck car. Mobile uses simultaneous touch steering, pedals, drift, and nitro.

Eight pickup spots generate jobs with three risk levels and six destinations. Stop in a pickup ring to board, then stop at a hideout to deliver. Deliveries pay arcade credits, add time, and increase the streak multiplier. Police pursue and search last-seen positions; roadblocks, destructible props, traffic, and ramps create escape opportunities. Return to the garage and bank to finish a run. Losing forfeits the unbanked haul.

The garage has three cars with distinct speed, acceleration, handling, capacity, and durability, plus four paint colors. Banked credits, cars, paint, and preferences are stored locally on the device. No shared account, multiplayer, wallet, or real-money payouts are connected.

## Implementation

`driving.mjs` contains driving physics, city collision bounds, road routing, job state, settlement, and profile validation. `vehicles.js` loads the RGS_Dev CC0 models and animates their original separated wheels, brake lights and suspension. The same models appear in the live garage thumbnails. `city.js` loads the commercial building pack and creates streets, storefronts, skyline, and animated signals. `getaway.js` renders imported assets, driving controls, traffic and police, missions, garage, effects, audio, and HUD. Buildings fade when they obstruct the chase camera. Fixed scenery is batched for rendering efficiency.

Models: Kenney Blocky Characters, Car Kit, City Kit Roads, and City Kit Commercial (CC0), plus RGS_Dev vehicles (CC0). Three.js 0.170.0 (MIT). Space Mono and Silkscreen (SIL Open Font License). Credits and licenses are included in the app and `dist/assets/LICENSES.txt`.

Validation: all 135 road route pairs clear collision bounds; police driving simulations reach all eight pickups; each car accelerates, reverses, steers, and uses nitro; ramps launch and land; pickup/capacity/delivery/banking, repeat settlement prevention, vehicle unlocks, and profile reload checked. A Node simulation with a renderer stub runs the application pickup-to-bank flow. These checks do not constitute a browser rendering or physical-device test.

## Visual and handling update

The interface uses Silkscreen pixel lettering, raised square buttons, bordered navy panels, segmented gauges, a square minimap, and actual rendered car previews. Anti-aliasing, sky reflections, dusk lighting, and a closer chase/showcase camera improve the 3D presentation. Original character models are retained, with eight residents now walking the sidewalks.

Vehicle input now uses progressive steering, speed-sensitive turning, a single acceleration model, stronger braking with a brief delay before reverse, controlled handbrake slip and automatic traction recovery. Nitro speed tapers after release; wheels rotate by distance travelled and brake lights reflect braking. Existing saved credits and unlocks remain compatible.

Run `node checks/handling.mjs` for driving, geometry, navigation and progression checks; `node checks/game-flow.mjs` runs the complete app with a simulated DOM and renderer. Both passed for this update. Actual WebGL rendering, browser layout and physical-device feel were not tested in this session.

## Downloaded vehicle pack

The original RGS_Dev 21-vehicle FBX pack is saved at `dist/assets/packs/rgsdev-vehicles.zip` and linked in the in-game credits. Seven converted GLB models now power the player rides, traffic and police, replacing the procedural cars. The character assets and driving physics are unchanged. See `dist/assets/packs/README.txt` for source and conversion details.

## Downtown update

Kenney City Kit Commercial supplies 36 fitted buildings across the original eleven collision blocks, plus a distant skyline. Colorful awnings, lit storefronts, rooftop signs, crossings, traffic signals, planters, a waterfront, and a garage entrance give each district detail. The 19 selected models are self-contained GLBs with the original palette baked to vertex colors. Licenses and conversion notes are in `dist/assets/models/city/`.

The city is batched by equivalent materials while each block keeps isolated fade materials for camera visibility. The app simulation checks the actual city and vehicle GLBs, building footprints, finite geometry, independent block fading, walking residents, and the complete pickup-to-bank flow. Driving, navigation, progression, and source/asset checks pass; no browser or physical-device visual test was performed.
