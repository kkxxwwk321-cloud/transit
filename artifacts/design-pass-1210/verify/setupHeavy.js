// Heavier late network for performance checks. Run after setupLate.js: SETUP=setupLate.js+setupHeavy.js
// Grows the seeded late scene to ~24 towns and ~16 lines (each new town joined to its two nearest towns by bus, a few
// rail trunks), gives every town a queue, then lets the game run a few seconds so vehicles and passengers move.
// Synthetic; throwaway profile only. Bridges/tunnels are waived while building, as in setupLate.js.
{
  const __rnd = Math.random; let __s = 777; Math.random = () => { __s |= 0; __s = __s + 0x6D2B79F5 | 0; let t = Math.imul(__s ^ __s >>> 15, 1 | __s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  for (let i = 0; i < 160 && realCities().length < 24; i++) { S.day = 140 + i; for (const c of S.cities) c.dormant = false; try { spawnCity(); } catch (e) {} }
  for (const c of S.cities) c.dormant = false;
  for (const t of S.unlocked) S.limits[t] = Math.max(S.limits[t] || 0, 30);
  S.points = 1e8;
  const rb = routeBridgeStops; routeBridgeStops = (a, b) => ({ ...rb(a, b), invalid: null });
  const mk2 = (t, ids) => { draft = { type: t, name: TYPES[t].name + (S.lines.length + 1) + '线', color: LINECOL[S.lines.length % LINECOL.length], stops: ids, stopRemoval: null }; try { commitDraft(true); } catch (e) {} if (draft) cancelDraft(false); };
  const cs = realCities(), D = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const lone = cs.filter(c => !S.lines.some(l => l.stops.includes(c.id)));
  for (const c of lone) { const near = cs.filter(o => o !== c).sort((a, b) => D(a, c) - D(b, c)); mk2('bus', [near[0].id, c.id, near[1].id]); if (S.lines.length >= 16) break; }
  const far = cs.slice().sort((a, b) => a.x - b.x); if (S.lines.length < 18) mk2('rail', [far[0].id, far[Math.floor(far.length / 2)].id, far.at(-1).id]);
  routeBridgeStops = rb;
  for (const l of S.lines) for (let k = 0; k < 2; k++) try { addVehicle(l.id); } catch (e) {}
  for (const c of realCities()) for (let i = 0; i < 10 + c.id % 12; i++) try { newPassenger(c); } catch (e) {}
  for (const c of realCities()) { c.grace = 0; c.shield = 0; c.warning = 0; }
  Math.random = __rnd;
  S.points = 24000; S.lives = Math.max(S.lives, 2);
  try { const st = activityState(); st.offers = []; st.next = 1e9; } catch (e) {}
  closeModal(); clearSelection(); updateUI(); dispatchEvent(new Event('resize'));
  window.__heavy = { cities: realCities().length, lines: S.lines.length, vehicles: S.vehicles.length, waiting: realCities().reduce((n, c) => n + c.q.length, 0) };
}
