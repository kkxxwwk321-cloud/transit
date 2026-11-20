## Terrain revision 1.6.7 checks

Run `npm test` with jsdom available. The historical suites explicitly use the 1.6.6 terrain adapter because their coordinate, opening-quote and growth fixtures describe existing saves. Their assertions remain unchanged, except the current release string. Tests with their own legacy HTML harness likewise exclude only `atlas167.js`.

`atlas167.cjs`, `bridges167.cjs` and `fleet167.cjs` exercise the retained 1.6.7 terrain adapter (`legacyTerrain167`); the 1.6.8 suites load the complete current production script chain:

- Actual new-game seeds, all three painted physical datasets, save/load, city growth and maximum building clearance.
- All four camera limits at three phone dimensions and zoom levels.
- Usable river/lake bridges, native construction charges, persistent bridgehead coordinates, no ocean bridges.
- Cross-continent sea route around the southern landmass, sea-only visible polyline, hills without tunnels.
- Three vehicles on each of six transport modes, boarding at both ends; the marine fixture uses genuinely coastal cities in the new geometry.
- All three old-save adapters restored and compared with the historical production adapters.

Browser QA uses 390×844 iframe viewports for all maps, city growth, actual bridge construction, and map corners. Temporary QA controllers are excluded from the deployed assets. Physical terrain uses conservative boundaries derived from the final painting; this is a gameplay approximation, not a height-map reconstruction. Low-end Android hardware is not available in this environment.
