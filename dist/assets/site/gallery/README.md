# Website gallery — actual game renders

The v2 PNGs are 1440 × 960 exports from the shipped Three.js scene builders, with no generated environment substitutions or UI.

- `gardens-v2.png`: North Gardens from `city.js`, grass/landscaping and city finish modules, with game passenger models. Camera on the park edge avoids looking through a building.
- `apartment-v2.png`: furnished starter player home from `apartment.js`; first-person room shell closes the ceiling/walls, with a custom interior camera and the robber player model.
- `garage-v2.png`: full Last Exit showroom from `garage-scene.js` and `garage-room.js`, after eagerly loading the detailed vehicle models. Alley Cat selected.

These replace legacy renders that showed quest destinations instead of the player home/garage. Rendered directly from WebGL canvas using the game renderer color space, tone mapping, and materials. The website preserves each image's complete aspect ratio.

The separate hero and neighbors images are ImageGen crew artwork using actual model references; see `../actual-crew-art.md`. They are not gameplay screenshots.
