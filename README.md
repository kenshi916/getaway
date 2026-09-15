# GETAWAY — The Night Shift

A self-contained solo arcade driving game. Serve `dist/` over HTTP. The website opens at `/`, the game at `/play/`, and the guide at `/docs/`. All models, fonts, and libraries are local; no installation or build is required.

## Play

Start inside your apartment with a close, full-window camera. The 21.6 × 16 floor plan has about twice the floor area of the previous 15.2 × 11.2 layout, with wider doorways, a longer fitted kitchen, four dining chairs, and more circulation around furniture. Apartment version 3 relocates old home positions to the new living-room spawn without resetting earned progress. Click the floor to walk, click furniture to use it, or choose an item from Phone → Home. P opens the in-game phone and pauses the game. Its apps include Quests, Dispatch, City map, Garage, Home, My stats, Settings, and Guide. WASD / arrows walk; E uses or stops an activity. C opens the floor plan, the wheel or + / − controls zoom, and F requests browser full screen. The sofa plays the real seated animation and turns on the animated TV. Coffee, showers, and bed rest are timed, cancellable activities with saved completion state. The first-night tutorial leads into your first pickup, delivery, and banked shift.

In the car, WASD / arrow keys drive and reverse. Space is the handbrake; Shift is nitro. C switches camera. J chooses a job. Tab routes to the garage. E banks the haul when stopped there. R recovers a stuck car. Mobile uses simultaneous touch steering, pedals, drift, and nitro.

Twelve pickup spots generate jobs with three risk levels and ten destinations. Stop in a pickup ring to board, then stop at a hideout to deliver. Deliveries pay arcade credits, add time, and increase the streak multiplier. Police pursue and search last-seen positions; roadblocks, destructible props, traffic, and ramps create escape opportunities. Return to the garage and bank to finish a run. Losing forfeits the unbanked haul.

The garage has six cars with distinct speed, acceleration, handling, capacity, and durability, plus four paint colors. Banked credits, cars, paint, preferences, tutorial progress, apartment position, and an unfinished shift are stored locally on the device. Autosave runs every three seconds during play and on page exit. Save & return home suspends the active shift; the door resumes its car, timer, passengers, heat, and haul. No shared account, multiplayer, wallet, or real-money payouts are connected.

## Implementation

`driving.mjs` contains driving physics, city collision bounds, road routing, job state, settlement, and profile validation. `vehicles.js` loads the RGS_Dev CC0 models and animates their original separated wheels, brake lights and suspension. The same models appear in the live garage thumbnails. `city.js` combines Commercial, Industrial, Suburban, and Nature packs into distinct districts, with fitted storefronts, rooftop equipment, planted parks, dock cranes and containers, textured asphalt, and animated signals and fountain ripples. `getaway.js` renders imported assets, driving controls, traffic and police, missions, garage, effects, audio, and HUD. Buildings fade when they obstruct the chase camera. Fixed scenery is batched for rendering efficiency.

Models: Kenney Blocky Characters, Car Kit, City Kit Roads, and City Kit Commercial (CC0), plus RGS_Dev vehicles (CC0). Three.js 0.170.0 (MIT). Space Mono and Silkscreen (SIL Open Font License). Credits and licenses are included in the app and `dist/assets/LICENSES.txt`.

Validation: road routes clear collision bounds; police driving simulations reach all twelve pickups; each car accelerates, reverses, steers, and uses nitro; ramps launch and land; pickup/capacity/delivery/banking, repeat settlement prevention, vehicle unlocks, and profile reload checked. A Node simulation with a renderer stub runs the application pickup-to-bank flow. These checks do not constitute a browser rendering or physical-device test.

## Visual and handling update

The interface uses Silkscreen pixel lettering, raised square buttons, bordered navy panels, segmented gauges, a square minimap, and actual rendered car previews. Anti-aliasing, sky reflections, dusk lighting, and a closer chase/showcase camera improve the 3D presentation. Original character models are retained, with twelve residents now walking the sidewalks.

Vehicle input now uses progressive steering, speed-sensitive turning, a single acceleration model, stronger braking with a brief delay before reverse, controlled handbrake slip and automatic traction recovery. Nitro speed tapers after release; wheels rotate by distance travelled and brake lights reflect braking. Existing saved credits and unlocks remain compatible.

Run `node checks/handling.mjs` for driving, geometry, navigation and progression checks; `node checks/game-flow.mjs` runs the complete app with a simulated DOM and renderer. Both passed for this update. Actual WebGL rendering, browser layout and physical-device feel were not tested in this session.

## Downloaded vehicle pack

The original RGS_Dev 21-vehicle FBX pack is saved at `dist/assets/packs/rgsdev-vehicles.zip` and linked in the in-game credits. Seven converted GLB models now power the player rides, traffic and police, replacing the procedural cars. The character assets and driving physics are unchanged. See `dist/assets/packs/README.txt` for source and conversion details.

## Downtown update

Kenney City Kit Commercial supplies 92 fitted buildings across 25 building blocks, plus two parks, plus a distant skyline. Colorful awnings, lit storefronts, rooftop signs, crossings, traffic signals, planters, a waterfront, and a garage entrance give each district detail. The 19 selected models are self-contained GLBs with the original palette baked to vertex colors. Licenses and conversion notes are in `dist/assets/models/city/`.

The city is batched by equivalent materials while each block keeps isolated fade materials for camera visibility. The app simulation checks the actual city and vehicle GLBs, building footprints, finite geometry, independent block fading, walking residents, and the complete pickup-to-bank flow. Driving, navigation, progression, and source/asset checks pass; no browser or physical-device visual test was performed.

## Expanded map and gaming website

The playable boundary grew from ±66 to ±102, giving approximately 2.39 times the area. Six roads per axis create 36 junctions. Outer districts add docks, parks, a cinema, a station, and southern motor yards. Navigation scales with the road grid, and the minimap and police use the expanded bounds. There are 12 pickups and 10 destinations.

The new responsive homepage features original blocky key art, the actual 3D city, working district view buttons, and previews of the real vehicle models. The docs cover controls, jobs, pursuit, upgrades, saves, and current capabilities. Footer settings live in `dist/site-config.js`: X currently redirects to `https://x.com/`; the project profile and contract have not been supplied. CA remains “COMING AT LAUNCH” until a real address is configured, when its copy button becomes available.

Validation includes complete gameplay and website simulations, all pickup/destination route pairs, HTML routes/anchors, asset references, and JavaScript syntax. Browser graphics and physical-device layouts were not tested.

## Apartment and saved-shift update

`apartment.js` builds a connected five-zone cutaway apartment (kitchen, living room, bedroom, bathroom, and entry hall) rendered with the existing renderer. It uses the existing animated character and Kenney furniture assets, collision-aware walking, interactive markers, and an overview camera that fits the rooms around the tutorial and controls. The close camera is the default, with wall fading and adaptive framing. C toggles the floor plan. Click movement uses collision-aware pathfinding through the actual doorways; keyboard movement cancels a route. Activity saves record the valid approach position so reloads never leave the character trapped inside furniture. The kitchen coffee maker and living-room TV are interactive. The interior uses 36 CC0 Kenney Furniture Kit models. Versioned apartment positions migrate old saves to the new entry point while preserving the tutorial, credits, collection, and suspended shift. The six-step first-night guide saves its place; old credit and vehicle saves remain compatible.

`progress.mjs` serializes and validates resumable shifts. `getaway.js` coordinates apartment entry, laptop briefing, wardrobe garage, bedside save, door departure, tutorial dispatch, and return home. Banking clears the checkpoint and saves earned credits in one storage write. Saves remain local to this browser, with visible feedback if storage is unavailable. Police and traffic vehicles regenerate when resuming; the player's wanted level persists.

Validation covers reachable furniture, collision boundaries, all tutorial steps, doorway transition, first fare, suspended timer, full application reload with a saved shift, retained passengers and car state, bank settlement, corrupt checkpoints, unavailable storage, and existing driving / website behavior. DOM and WebGL renderer are simulated in Node; no browser or physical-device QA was performed.

## Skins, special rides, and burn unlocks

The collection is available at the apartment wardrobe. The original three cars keep their credit unlocks. Alley Cat (hatchback), Night Cab (taxi), and Ironhide (SUV) use the existing RGS_Dev models and have distinct handling, seats, and integrity. Four premium material finishes apply to every ride. Two additional driver models replace the playable apartment character. Actual model renders power the collection previews.

The published build uses an explicit demo: 25,000 demo tokens, review-and-confirm burns, local ownership, saved loadouts, and no wallet requests. Demo unlocks never become real wallet entitlements. `collection.mjs` owns stable item IDs and demo state; `collection-ui.js` provides browsing, confirmation, and equipment. Live mode ignores demo ownership and uses the registry's wallet ownership mask.

`contracts/GetawayUnlocks.sol` and `burn-wallet.mjs` implement the future live path. The contract uses ERC20Burnable, exact-price approval, immutable item prices, permanent wallet unlocks, and supply / balance verification. It cannot withdraw tokens or change its prices. The wallet reads on-chain prices, checks chain / token / decimals, waits for confirmed receipts, verifies ownership, and clears it on account or network changes. Live burns remain disabled: no user token address, chain configuration, or public registry deployment has been provided. See `contracts/README.md` for activation details.

`npm run test:burn` compiles the contract and exercises real transactions on a local Ganache EVM using a test-only ERC20, including the actual browser wallet adapter. `npm run test:game` checks demo cancel / burn / equip / reload and all existing gameplay flows with a simulated renderer. `npm run test:driving` checks all six vehicles. These checks are not a security audit or physical-browser QA. The Solidity compiler, OpenZeppelin, ethers, and Ganache are development dependencies; the deployed game still has no runtime package installation or build requirement.

## In-game phone

`phone.js` renders the handset and its nine apps. `getaway.js` supplies live game state and routes phone commands through the same movement, dispatch, collection, pause, and save functions as the HUD. The garage reuses the complete collection and burn-review flow within the phone. Pending wallet operations block closing or switching apps. Suspended shifts are decoded through `restoreShift` for accurate passengers and map data after a reload.

The five quests read tutorial progress, deliveries, best banked haul, completed shifts, and home activities. `trackedQuest` is validated and saved with the local profile. Milestones do not invent token rewards. Opening the phone freezes the actual shift timer; closing it resumes the game.

## City art update

26 additional CC0 Kenney models replace repeated commercial blocks with warehouse/service buildings, suburban houses, detailed trees and palms, shrubs, flowers, containers, water towers, and solar panels. Street-level shop windows and awnings attach to the actual building bounds. The road grid, collision footprints, pickups, destinations, saved progress, and player assets are retained. Shared scenery is batched; each block still fades independently behind the chase camera. The website city view uses the same assets.

`checks/import-city-assets.py` reproduces the asset import from the original Kenney ZIPs. Original palette colors are sampled into linear vertex colors without changing artist geometry. The published GLBs need no external textures. Original licenses and source URLs are included with the assets.

## Passengers and story rides

Twelve named passengers use twelve distinct Kenney Blocky Characters models with original animations and embedded textures. They wait and greet nearby drivers, walk toward the stopped car while boarding, and walk away at their destination. Their original preview portraits appear in the HUD, Dispatch, and the People phone app. Each passenger has a background, authored in-car dialogue, and three story chapters.

`passengers.mjs` owns the cast, five ride objectives, live comfort/cargo/deadline/boost telemetry, tips, ratings, and chapter progression. `passenger-actors.js` handles world characters and boarding/departure animations. Goal completion advances the current chapter; any completed ride records a visit and rating. Ordinary passengers do not summon police. Discreet riders cannot be dropped off while wanted. Rush/cargo/comfort failures retain the base fare. Tips and goal bonuses require actual movement, and all earnings still require banking.

Checkpoint version 2 persists onboard ride metrics and deadlines. Version 1 shifts still restore with the passenger assigned to the original pickup spot. Profile history and all prior car, skin, apartment, and tutorial progress remain local and are preserved. `node checks/rides.mjs` covers success and failure for each objective, payout arithmetic, duplicate protection, chapter progress, and old/new save restoration. The game simulation covers real character geometry/animation, boarding and departure, phone biographies, and saved passenger history. No real-money or token rewards were added.

## Nine-district city and Pons launch preparation

The playable boundary is now ±282, up from ±102 (7.64 times the area). Two hundred surrounding blocks preserve the original downtown streets and add Harbor Works, Crown Heights, Palm Gardens, Westside, East Exchange, South Docks, Motor Quarter, and Sunset Hills. The city uses 334 fitted building models across a 16 by 16 road grid (256 junctions). Distant blocks are culled during driving; the existing art and vehicle assets remain local.

M opens the full atlas; the minimap and Phone → City map also open it. Select a district, job, or road, zoom, pan, and set driving directions. Waypoints save with the shift. Older saved cars that overlap a new building are moved to a clear road while retaining their haul and passengers. Shifts start at five minutes and can extend to six. Repeat rides visit outer districts after the passenger’s three story chapters are complete.

Robinhood Chain is configured as chain ID 4663 / 0x1237, with ETH gas. GETAWAY is intended to be a new token launched through Pons V2. Live burns remain disabled pending the actual GETAWAY token address, verified burn support, approved item prices, and deployed GetawayUnlocks registry. No wallet transactions or token launch were performed. The demo collection includes exact-cost confirmation, equipping, saved ownership, and a local burn history.

Primary integration sources: https://docs.robinhood.com/chain/connecting/ and https://docs.ponsfamily.com/v2 . Published Pons V2 source: https://github.com/ponsdotdev/ponsfamily/blob/main/contractsV2/src/v2/PonsV2LauncherToken.sol . Verify the eventual GETAWAY deployment before activation; a launch factory is not the game token address.

Checks include real imported geometry, all routes from original stops and district landmarks to outer landmarks, old-save collision recovery, waypoint persistence, rejected invalid coordinates, passenger-story preservation, and the existing full gameplay simulations.

Browser QA passed on desktop (1440 × 960) and mobile (390 × 844) using Edge: atlas navigation, road selection, zoom, route restoration after reload, driving input, demo burn and actual material equip, no horizontal page overflow, and no page errors. Screenshots were inspected. Physical-device performance and live token transactions remain untested.

## Apartment garage and detailed concept car

G / the apartment Garage button walks to the lower-level lift and enters a separate 3D showroom. Browse all six cars, rotate the model, review a demo burn, equip a ride, go upstairs, or drive out. Browsing and equipping preserve an unfinished shift; the shift resumes in its original car. The Alley Cat burn unlock uses the freely downloadable Car Concept by Eric Chadwick / Darmstadt Graphics Group GmbH (CC BY 4.0), with animated wheels and brake lights. Low-poly traffic retains the lightweight RGS models. Live token burns remain disabled pending GETAWAY and the unlock registry.

Desktop and mobile browser checks cover garage entry, browsing, demo burn/equip, driving, and saved-shift preservation. Node renderer simulations use image bitmap placeholders; actual textures are checked in browser.

## Phone app artwork

The P-key phone uses nine original icons made with the built-in image_gen tool: Quests, Dispatch, City map, Garage, Home, My stats, Settings, Guide, and People. The three-column launcher, app title, and bottom navigation share these images. Phone-sized PNGs and the exact generation prompts are stored in `dist/assets/phone-apps/`.
