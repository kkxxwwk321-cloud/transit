# 1.6.8 validation

The current production HTML loads both retained revision-1 geometry and new revision-2 geometry. New games use revision 2. Saved games retain their revision; no live city or line is moved automatically.

`npm test` includes 43 suites. Historical fixtures explicitly select the adapter for the save version they describe. The new 1.6.8 suites load the complete production entrypoint:

- `repair168.cjs`: all starts, affordable dry opening networks, opposite-bank fourth city, actual pointer down/move/up and confirmation-button click, bridge charge/save, full-map camera at three phone dimensions, terrain-safe farm drawing and once-only harvest.
- `navigation168.cjs`: native pinch gestures, preserving bridge quotes during two-finger navigation, western/southwestern/northern port routes remaining wholly at sea, no lake harbors. Ocean bounds include 600 units of extra navigable sea to west, south and east.
- `fleet168.cjs`: three vehicles on each of bus/EMU/high-speed rail/air/small ship/ferry; both-direction boarding after save/load.
- `boot168.cjs`: all three maps on all three retained terrain revisions; a cold browser initialization preserves progress, city coordinates and physical geometry.
- `loading168.cjs`: new terrain resources and first-frame loading; failures remain paused behind a retry panel.
- `layouts168.cjs`: seeded city layout progression using the actual spawn functions, transport access checks, mature building footprints, farmland availability, complete mainland coverage and exact ocean-city dates. This is a city-layout test, not a survival/economy simulation. Three seeds per map are in the standard suite; ten per map were run for this release.

Evidence is in `tests/evidence168/`. Layout runs covered 400 days on map 2 and 300 days on map 3. Temporary iframe/gesture QA controllers are not shipped. Browser checks use actual 390×844 game viewports, including a native browser drag across a tributary and the normal bridge confirmation button. A physical Android device is not available here.

Terrain boundaries are conservative gameplay ground footprints traced from the final paintings, rather than a recovered 3D height field. Hills do not become tunnel terrain. North remains mainland; offshore islands cannot spawn cities. The new ocean grid includes an offshore apron so a headland touching the painted edge cannot seal a port into an isolated bay.
