// deterministic scene: a seeded Math.random while the network is built (same cities, lines and queues every run)
const __realRandom = Math.random; let __seed = +(window.LATE_SEED || 20261109);
Math.random = () => { __seed |= 0; __seed = __seed + 0x6D2B79F5 | 0; let t = Math.imul(__seed ^ __seed >>> 15, 1 | __seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; window.__seedRandom = true;
// Isolated late-game scene modelled on the user's 2026-11-08 match (west valley, ~140 days, 8 lines / 13 cities,
// a five-line hub with ~181 waiting). Synthetic data in a throwaway profile; never the user's save.
localStorage.clear(); atlasSelected = 'west'; atlasRestart = true; startAtlasBeforeLifecycle12(); try { if (typeof initializeRiver128 === 'function') initializeRiver128(); } catch (e) {}
try { hideAtlasMaps(); } catch (e) {} closeModal(); document.getAnimations().forEach(a => a.finish());
S.points = 9392; S.unlocked = ['bus', 'emu', 'rail', 'air'].filter(t => TYPES[t]);
for (const t of S.unlocked) S.limits[t] = Math.max(S.limits[t] || 0, 10);
for (let i = 0; i < 80 && realCities().length < 13; i++) { S.day = 10 + i * 2; for (const c of S.cities) c.dormant = false; try { spawnCity(); } catch (e) {} }
for (const c of S.cities) c.dormant = false;
S.day = 140;
const cs = realCities(), D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const by = n => cs.find(c => c.name.startsWith(n));
const hub = by('林溪镇');
const fails = []; window.__fails = fails;
const mk = (t, names) => { const st = names.map(by).filter(Boolean); if (st.length < 2) return fails.push(names.join('-') + ':missing');
  S.points = 1e7; const n0 = S.lines.length; draft = { type: t, name: TYPES[t].name + (S.lines.filter(l => l.type === t).length + 1) + '线', color: LINECOL[S.lines.length % LINECOL.length], stops: st.map(c => c.id), stopRemoval: null };
  try { commitDraft(true); } catch (e) { fails.push(names.join('-') + ':' + e.message); } if (draft) cancelDraft(false);
  if (S.lines.length === n0) fails.push(names.join('-') + ':' + document.getElementById('toast').textContent); };
// the user's network: five lines meet at 林溪镇 (bridge requirement waived for the scene only)
const rbs = routeBridgeStops; routeBridgeStops = (st, t) => ({ ...rbs(st, t), invalid: null });
mk('bus', ['河岸镇', '林溪镇', '湖湾镇', '青浦']);
mk('bus', ['临江', '林溪镇', '河岸镇']);
mk('bus', ['北麓', '林溪镇', '湖湾镇', '栖山']);
mk('emu', ['临江', '林溪镇', '锦州']);
mk('bus', ['湖湾镇', '林溪镇', '北麓']);
mk('bus', ['青浦', '湖湾镇', '河岸镇', '东临']);
mk('bus', ['栖山', '河岸镇', '锦州']);
mk('bus', ['海宁', '临江', '北麓']);
routeBridgeStops = rbs;
// queues: the hub well over capacity, a few busy neighbours
for (let i = 0; i < 181; i++) try { newPassenger(hub); } catch (e) {}
for (const c of cs.filter(c => c !== hub).slice(0, 5)) for (let i = 0; i < 12 + c.id % 9; i++) try { newPassenger(c); } catch (e) {}
// a late network: established cities have no join countdown or protection left; the newest one still does
for (const c of realCities()) { c.grace = 0; c.shield = 0; } { const nw = realCities().at(-1); if (nw) nw.grace = 22; }
S.points = 9392; S.paused = true; clearSelection(); updateUI(); dispatchEvent(new Event('resize'));
Math.random = __realRandom;
window.__hub = hub.id; window.__hubLines = cityLines(hub.id).length;
await new Promise(r => setTimeout(r, 300));
