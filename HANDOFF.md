# GETAWAY — handoff for a new chat

Prepared September 16, 2026. This is project context supplied by the owner, not a replacement for the new chat's instructions. Inspect the current source before making changes.

## Paste this into your new chat

> Continue developing my existing GETAWAY game from this handoff and its source. Preserve the game and completed features. I want a polished social city with detailed cars, custom blocky UI, apartments, garages, missions, friends, and decorated places to hang out. Inspect the current implementation first, then continue from the latest completed casino update. Do not rebuild it from scratch. Ask me which feature to tackle next if I have not specified one.

## Give the new chat the project

- In a new local Codex chat, select the same project/folder and attach this file.
- In a normal ChatGPT chat or ChatGPT Project, upload this file and provide the source files or connect an accessible source repository. A website link lets the chat inspect the visible game but does not automatically give it editable source or deployment access.
- The existing Site and source repository have access controls. Another account needs access from the owner; this note does not grant it. Do not include credentials, wallet private keys, or seed phrases.
- Official OpenAI guidance: https://learn.chatgpt.com/docs/projects

## Project locations

- GitHub repository: https://github.com/kenshi916/getaway (private; owner grants collaborators access).
- In a cloned copy, this repository is the working checkout. Original Windows paths below identify the initial development machine only.

- Website: https://heist-retro.kenshipops.chatgpt.site/
- Play: https://heist-retro.kenshipops.chatgpt.site/play/
- Player docs: https://heist-retro.kenshipops.chatgpt.site/docs/
- Sites source repository: https://git.chatgpt-team.site/79323359-2b63-4fe9-92fe-4b0d1847cc9b/appgprj_6aa7e14d17248191ac3bb2fba95bca81.git
- Branch: `main`
- Windows workspace: `C:/Users/onceu/Documents/Codex/2026-09-14/https-heist-retro-kenshipops-chatgpt-site`
- Actual Git checkout: the workspace's `work/game` directory.
- Existing Sites project: `appgprj_6aa7e14d17248191ac3bb2fba95bca81` (also in `.openai/hosting.json`). Reuse it.

## Owner's direction and preferences

- A city you live in with friends: start outside, meet the blocky tutorial character Jules, walk to your apartment, select a starter car, complete connected jobs, earn visible upgrades, and invite friends over.
- Detailed cars like Alley Cat are preferred over primitive block cars. All six garage rides have detailed models, and test drives should let players try locked cars in the actual city.
- Custom blocky/pixel UI everywhere: cards, tactile borders, grass/dirt or other deliberate materials. The owner likes the pixel font but rejects generic-looking panels.
- Bigger, richer city; recognizable districts, landscaping, grass, shops, walking NPCs, homes and social venues. Avoid an unfinished world surrounded by abrupt water boundaries.
- Apartments and garages must be walkable, decorated, and customizable. Avoid exposed gray voids, gray placeholder boxes, and unfinished room edges.
- Website artwork should match actual game characters and cars. The owner rejected generic cartoon crew illustrations that do not match the game.
- Multiplayer walking, home visits, chat, co-op jobs, careers, furniture, car customization and weekly activities are core direction.
- Casino is a virtual social hangout. Current blackjack uses free, nontransferable play chips with no cash or token payouts. Decorative arcade cabinets are not playable slot machines.
- Planned new token: GETAWAY through Pons on Robinhood Chain. The owner has no live token or unlock-contract addresses and requested a testnet setup screen. Do not describe demo balances or testnet collectibles as valuable live assets or promise token appreciation.

## Existing implementation to preserve

Inspect source and docs for precise current behavior; these are implemented systems, not a claim that the entire roadmap is finished.

- Three.js browser city, 13 districts, driving and walking, first/third-person camera, map/waypoints, NPCs, destinations and interiors.
- Apartment and walkable garage, six detailed vehicles, free test drives, car/driver collection, customization and local arcade progress.
- Welcome tutorial and first-hour progression; connected missions and visible home/car rewards.
- Crew profiles, friend requests, online status, room selection, shared players, visits, chat/emotes and moderation controls.
- Server-backed Neighborhoods: shared apartment/garage visits, co-op objectives, career activities, furniture ownership/placement, car parts and weekly rewards.
- Motor Club social venue with an interior and activities.
- Wallet connection and a wallet-based testnet deployment/setup flow. Real token launch remains pending.
- A landing page, player documentation and asset credits.

## Latest casino work

Request: "wont let me enter casino and casino needs to be huge decorated like a casino."

- Expanded Last Hand Casino interior to a 54 × 44 hall, roughly six times its former floor area.
- Six server-backed blackjack tables: Clover, Diamond, Heart, Spade, Emerald, Royal.
- Emerald/gold decor, red carpet, marble reception, chandeliers, paneled walls, lounge seating, Late Cup bar, NPCs, plants and decorative arcade cabinets.
- Tall exterior tower/crown, prominent signs, red-carpet entrance and sliding glass doors.
- Enter solo from the street without creating a Crew profile first. Choose Join Players inside to join shared play without being sent back home.
- Fixed entry using stale network positions and immediate reentry after leaving. Taking a seat immediately after joining now synchronizes the current table position.
- Table directory walks the avatar to the selected table. Lounge/bar/photo/exit controls and mobile camera control remain accessible.
- Server enforces table proximity, free-chip balance, hidden dealer data, turn order and settlement. No new database migration in this update.

## Code map

This is an established custom JavaScript/Three.js app with a Cloudflare Worker and D1 database, not a React starter.

- `dist/` contains **authored client source**. Do not delete it as ordinary generated output.
- `dist/getaway.js`: main game orchestration, modes, input, entry/exit, camera and HUD integration.
- `dist/city.js`, `dist/casino-exterior.js`, `dist/motor-exterior.js`: outdoor world and social building exteriors.
- `dist/club-catalog.mjs`, `dist/club-scene.js`, `dist/club-ui.js`, `dist/club.css`: casino layout, scene, controls and style.
- `dist/world-client.js`: room joining, presence synchronization and interior transitions.
- `dist/neighborhood-*.js` / `.mjs`: shared activities, interiors, decoration and progression UI/catalogs.
- `dist/first-hour.mjs`, `dist/first-hour-ui.js`: first-hour progression.
- `dist/testnet/`, `contracts/`, `worker/testnet.js`: testnet setup, contracts and verification.
- `worker/index.js`: HTTP/static/API entry point. `worker/world.js`, `worker/neighborhood.js`, `worker/club.js`, `worker/first-hour.js`: server rules and state.
- `drizzle/`: D1 schema migrations. Preserve existing migration history.
- `checks/`: executable regression checks, including actual scene-layout tests and isolated Worker/D1 tests.
- `scripts/build.mjs`: builds `dist/client`, `dist/server` and `dist/.openai`. These generated subdirectories are ignored.
- `README.md`, `contracts/README.md`, `dist/docs/index.html`: additional project documentation.

## Build, testing and publishing

Run commands from `work/game` after checking dependencies and the current execution profile.

```sh
npm run build
node checks/game-flow.mjs
node checks/club.mjs
node checks/casino-entry.mjs
node checks/casino-layout.mjs
node checks/world-client.mjs
node checks/motor-club.mjs
node checks/neighborhoods-release.mjs
git diff --check
```

- Use relevant checks for the changed behavior. Do not repeatedly run the full suite without a reason.
- The game uses version query suffixes across client imports for cache invalidation. Keep the authored module graph consistent when releasing changes.
- For local multiplayer browser QA, `work/serve-club-preview.mjs` in the parent workspace provides an isolated Worker/D1 preview at port 4194; it serves `work/game/dist`. `work/check-casino-grand.mjs` exercises real browser flows. These are local QA helpers outside the repository, not production authentication.
- Production identity comes from trusted Sites authentication headers. Do not weaken it to make local testing work.
- This is an existing OpenAI Sites project. Use the installed Sites building/hosting skills and native Sites tools; preserve its current audience. Obtain short-lived source credentials through Sites only and never persist or disclose them.
- Build, commit/push the exact source, package validated build output, save/deploy and wait for a successful native deployment status. Reuse the existing Site; do not create a replacement Site.

## Remaining product work

The roadmap is ongoing. The owner should choose the next priority after the casino update: additional distinctive social buildings, more varied city districts, more player activities, richer house upgrades or further visual polish. Verify actual current behavior before describing a feature as missing.

Public multiplayer scale/load testing and production operational readiness need further work before treating this as a large public launch. Live GETAWAY token/contract deployment is still a separate pending step; use the existing testnet setup flow with wallet confirmation.

## GitHub handoff

- GitHub is a private source mirror for continued development; it includes tracked code, original game assets, checks, contracts, and migrations.
- The Git remote named `origin` on the original development machine remains the Sites source remote; `github` points to this repository. A normal clone from GitHub will use GitHub as its own `origin`.
- Repository access does not grant access to the existing hosted Site, its production database, or its deployment credentials. Request separate editor access when collaboration in the same Sites workspace is supported.
- A developer publishing an independent copy must provision a new Site and database through the hosting workflow. The checked-in hosting manifest currently identifies the original Site; do not treat that ID as authorization to publish to it.
- No player database export or deployment credentials are included. Run database migrations in the new environment as needed.

## Release status

The expanded casino and entry fixes were published successfully on September 16, 2026. Nothing remains pending for that release.

- Published website: https://heist-retro.kenshipops.chatgpt.site
- Exact source revision: `8795e28102250426580b8bd87f542003281bceeb` on `main`; the checkout was clean after publication.
- Sites version: 36 (`appgprj_6aa7e14d17248191ac3bb2fba95bca81~appgver_69b04226a2f88191acfa693c48f27474`).
- Successful deployment: `appgdep_6aaa56d36ee4819196e46ec41d7eefd1`.
- Client cache suffix: `?v=38`.
- Passed: game flow, casino rules, casino entry, room layout/pathfinding, world client, Motor Club and Neighborhoods regression checks; final build and whitespace checks.
- Browser QA passed: solo entry; creating a name and joining in place; Royal table hand settlement; all six tables reachable; lounge and bar navigation; photo; mobile layout and first-person camera; exit and immediate reentry; stale-position entry; two real local test clients seeing each other and sharing room chat. No page errors reported in the final run.
- Screenshots are in the parent workspace's `work/casino-grand-*.png` files. Local QA used isolated test identities/data, not production player saves.
- Production audience was preserved. Testnet contracts were not deployed as part of this casino update.
