import { fileURLToPath } from 'node:url';
// Late-game drawing performance: a real touch drag (CDP Input) from one city to another while the CPU profiler runs.
// usage: SETUP=setupLate.js node dragperf.mjs WxH [from] [to]   (env: URL, STEPS, MOUSE=1 for a mouse drag)
// Prints the wall time of each input dispatch (handler cost), frame gaps measured in the page and the functions
// with the most self time during the drag.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [size = '461x709', from = '青浦', to = '锦州'] = process.argv.slice(2);
const url = process.env.URL || 'http://127.0.0.1:8791/';
const port = 9334 + Math.floor(Math.random() * 400);
const profile = (process.env.VERIFY_TMP || fileURLToPath(new URL('../../../.verify-tmp', import.meta.url))) + '/cdp_perf_' + port;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=' + profile, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 150; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') console.log('PAGE-ERROR', (m.params.exceptionDetails.exception?.description || '').slice(0, 300)); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const run = async code => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true }); return r.result?.exceptionDetails ? { error: r.result.exceptionDetails.exception?.description } : r.result?.result?.value; };
const [w, h] = size.split('x').map(Number), mouse = !!process.env.MOUSE;
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: +(process.env.DSF || 1), mobile: !mouse });
await send('Emulation.setTouchEmulationEnabled', { enabled: !mouse });
await send('Runtime.enable');
await send('Page.navigate', { url });
for (let i = 0; i < 60; i++) { await wait(250); if (await run("return typeof S!=='undefined'&&!!S&&typeof uxVisibleRect==='function'&&document.readyState==='complete'")) break; }
// SETUP may list several files joined with + (e.g. setupLate.js+setupHeavy.js); they run in order
const setup = (process.env.SETUP || 'setupLate.js').split('+').filter(f => f && fs.existsSync(f)).map(f => fs.readFileSync(f, 'utf8')).join('\n;\n');
console.log('setup', JSON.stringify(await run(setup + `\ntry { const st = activityState(); st.offers = []; st.next = 1e9; } catch (e) {} closeModal(); clearSelection(); updateUI(); S.paused = false; await new Promise(r => setTimeout(r, 1500)); return { lines: S.lines.length, cities: realCities().length };`)));
// MODE: pan (drag empty map), new (＋新建线路, then drag city → city), extend (select a line, drag its ＋ tab to a city)
const mode = process.env.MODE || 'new';
const pts = await run(`closeModal(); const cz = realCities(), a = cz.find(c => c.name.startsWith(${JSON.stringify(from)})) || cz[0], b = cz.find(c => c.name.startsWith(${JSON.stringify(to)})) || cz.at(-1);
  const mode = ${JSON.stringify(mode)}; let pa = toScreen(a), pb = toScreen(b);
  if (mode === 'pan') { let best = null; for (let x = 60; x < innerWidth - 60; x += 20) for (let y = 140; y < innerHeight * .55; y += 20) { const d = Math.min(...cz.map(c => { const q = toScreen(c); return Math.hypot(q.x - x, q.y - y); })); if (!best || d > best.d) best = { x, y, d }; } pa = { x: best.x, y: best.y }; pb = { x: best.x + 90, y: best.y + 120 }; }
  // grab: press on a stretch of line and pull it. SELECT=n selects line n first (since 2026-11-15 only the selected
  // line can be pulled) and looks for the stretch after the camera has framed it.
  if (mode === 'grab') { const sel = ${process.env.SELECT ? +process.env.SELECT : -1}; if (sel >= 0) { selectLine(S.lines[sel].id); await new Promise(r => setTimeout(r, 900)); }
    const top = document.getElementById('details')?.hidden ? innerHeight * .6 : document.getElementById('details').getBoundingClientRect().top - 30; let best = null;
    for (const l of S.lines.filter(l => sel < 0 || l === S.lines[sel])) for (let i = 1; i < l.stops.length; i++) { const p = toScreen(lanePoint(S.cities[l.stops[i - 1]], S.cities[l.stops[i]], l, .5)); const d = Math.min(...cz.map(c => { const q = toScreen(c); return Math.hypot(q.x - p.x, q.y - p.y); })); if (p.x > 30 && p.x < innerWidth - 30 && p.y > 140 && p.y < top && (!best || d > best.d)) best = { ...p, d, line: l.name }; }
    pa = { x: best.x, y: best.y }; pb = { x: best.x + 70, y: best.y + 90 }; }
  if (mode === 'new') { document.getElementById('newroute')?.click(); await new Promise(r => setTimeout(r, 300)); }
  if (mode === 'extend') { const l = S.lines.find(l => l.stops[0] === a.id || l.stops.at(-1) === a.id) || S.lines[0]; selectLine(l.id); await new Promise(r => setTimeout(r, 900)); const hs = uxVisibleHandles(), hd = ${process.env.TOPTAB ? 1 : 0} ? hs.slice().sort((p, q) => toScreen(p).y - toScreen(q).y)[0] : hs.sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0]; pa = toScreen(hd); pb = { x: pa.x - 120, y: pa.y - 60 }; }
  return { a: a.name, b: b.name, pa, pb, mode, newMode: typeof drawMode !== 'undefined' ? drawMode : null };`);
console.log('drag', JSON.stringify(pts));
await run(`window.__fr = []; let last = performance.now(); const tick = t => { __fr.push(t - last); last = t; if (!window.__stop) requestAnimationFrame(tick); }; requestAnimationFrame(tick);`);
if (process.env.THROTTLE) await send('Emulation.setCPUThrottlingRate', { rate: +process.env.THROTTLE });   // e.g. 6 ≈ a mid phone
await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 200 }); await send('Profiler.start');
const steps = +(process.env.STEPS || 40), times = [];
// MODE=gen: only the invitation generation itself (generateActivityOffers), timed and profiled, game paused
if (mode === 'gen') {
  const r = await run(`S.paused = true; const st = activityState(); st.offers = []; st.active = null; const t0 = performance.now(); generateActivityOffers(); const t1 = performance.now(); const tOpen0 = performance.now(); try { showActivityCards(); } catch (e) {} const t2 = performance.now(); return { gen: Math.round(t1 - t0), open: Math.round(t2 - tOpen0), offers: st.offers.length };`);
  const prof = (await send('Profiler.stop')).result.profile;
  const self = new Map(), total = new Map(), byId = new Map(prof.nodes.map(n => [n.id, n])), parent = new Map();
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
  prof.samples.forEach((s, i) => { const d = (prof.timeDeltas[i] || 0) / 1000; const cf = byId.get(s).callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + d);
    const seen = new Set(); for (let id = s; id; id = parent.get(id)) { const f = byId.get(id).callFrame, kk = `${f.functionName || '(anon)'} ${f.url.split('/').pop()}:${f.lineNumber + 1}`; if (!seen.has(kk)) { seen.add(kk); total.set(kk, (total.get(kk) || 0) + d); } } });
  console.log('gen', JSON.stringify(r));
  const show = m => [...m].filter(([k]) => !/^\(idle\)|^\(program\)|^\(root\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 16));
  console.log('self time (ms):'); for (const [k, v] of show(self)) console.log('  ' + v.toFixed(0).padStart(6) + '  ' + k);
  console.log('total time (ms):'); for (const [k, v] of show(total)) console.log('  ' + v.toFixed(0).padStart(6) + '  ' + k);
  chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch {} } process.exit(0);
}
// MODE=cards: no drag — the city-activity invitation falls due while the game runs (what a player meets mid-game)
if (mode === 'cards') {
  const t0 = performance.now();
  await run(`window.__lt = []; try { new PerformanceObserver(l => { for (const e of l.getEntries()) __lt.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: false }); } catch (e) {}
    const st = activityState(); st.offers = []; st.active = null; st.next = S.day; S.paused = false; return 1;`);
  let opened = null;
  for (let i = 0; i < 40; i++) { await wait(250); const m = await run(`return modalOpen ? (document.querySelector('#modal-content .deck128, #modal-content .activity-grid') ? 'deck' : 'modal') : null`); if (m && !opened) opened = { what: m, ms: Math.round(performance.now() - t0) }; }
  const prof = (await send('Profiler.stop')).result.profile;
  const fr = await run(`window.__stop = true; return { fr: __fr, lt: __lt, offers: activityState().offers.length };`);
  const self = new Map(), byId = new Map(prof.nodes.map(n => [n.id, n]));
  prof.samples.forEach((s, i) => { const cf = byId.get(s).callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (prof.timeDeltas[i] || 0) / 1000); });
  const sf = [...fr.fr].sort((a, b) => b - a), lt = fr.lt.sort((a, b) => b[1] - a[1]);
  console.log('cards', JSON.stringify({ opened, offers: fr.offers, longTasks: lt.length, longest: lt.slice(0, 6), longSum: lt.reduce((a, b) => a + b[1], 0) }));
  console.log('frames:', fr.fr.length, 'max gap', sf[0]?.toFixed(0), 'top5', sf.slice(0, 5).map(v => v.toFixed(0)).join(','));
  console.log('self time (ms):'); for (const [k, v] of [...self].filter(([k]) => !/^\(idle\)|^\(program\)/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 18))) console.log('  ' + v.toFixed(0).padStart(6) + '  ' + k);
  chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch {} } process.exit(0);
}
const touch = async (type, x, y) => { const t0 = performance.now(); if (mouse) await send('Input.dispatchMouseEvent', { type: type === 'touchStart' ? 'mousePressed' : type === 'touchEnd' ? 'mouseReleased' : 'mouseMoved', x, y, button: 'left', buttons: type === 'touchEnd' ? 0 : 1, clickCount: 1 }); else await send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] }); times.push(performance.now() - t0); };
await touch('touchStart', pts.pa.x, pts.pa.y); await wait(120);
if (process.env.DEBUG) console.log('after start', JSON.stringify(await run(`return { gesture: gesture && gesture.kind, moved: gesture?.moved, pointers: pointers.size, sel: selected, modal: modalOpen, paused: S.paused, hit: hitCity(toWorld({ clientX: ${pts.pa.x}, clientY: ${pts.pa.y} }))?.name, picker: !document.getElementById('junction-picker').hidden, top: document.elementFromPoint(${pts.pa.x}, ${pts.pa.y})?.id || document.elementFromPoint(${pts.pa.x}, ${pts.pa.y})?.className }`)));
for (let i = 1; i <= steps; i++) { await touch('touchMove', pts.pa.x + (pts.pb.x - pts.pa.x) * i / steps, pts.pa.y + (pts.pb.y - pts.pa.y) * i / steps); await wait(16); }
if (process.env.SHOT) { const sh = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(process.env.SHOT, Buffer.from(sh.result.data, 'base64')); }   // mid-gesture, finger still down
const mid = await run(`return { details: (() => { const d = document.getElementById('details'); const r = d.getBoundingClientRect(); return d.hidden ? 'hidden' : Math.round(r.top) + '/' + Math.round(r.height) + ' ' + d.className; })(), drawbar: !document.getElementById('drawbar').hidden, draft: !!draft, stops: draft?.stops?.map(i => S.cities[i].name), gesture: gesture?.kind, bridge: !!bridgeDraft, sel: selected?.type, cam: [view.x|0, view.y|0, +view.scale.toFixed(2)] };`);
await touch('touchEnd', pts.pb.x, pts.pb.y); await wait(500);
const prof = (await send('Profiler.stop')).result.profile;
const fr = await run(`window.__stop = true; return __fr;`);
const self = new Map(), byId = new Map(prof.nodes.map(n => [n.id, n]));
const dt = prof.timeDeltas; prof.samples.forEach((s, i) => { const n = byId.get(s), cf = n.callFrame, k = `${cf.functionName || '(anon)'} ${cf.url.split('/').pop()}:${cf.lineNumber + 1}`; self.set(k, (self.get(k) || 0) + (dt[i] || 0) / 1000); });
const top = [...self].filter(([k]) => !/^\(idle\)|^\(program\)|^\(garbage/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 18));
const st = [...times].sort((a, b) => b - a), sf = [...fr].sort((a, b) => b - a);
console.log('mid-drag', JSON.stringify(mid));
console.log('input ms: max', st[0].toFixed(0), 'top5', st.slice(0, 5).map(v => v.toFixed(0)).join(','), 'sum', times.reduce((a, b) => a + b, 0).toFixed(0));
console.log('frames:', fr.length, 'max gap', sf[0]?.toFixed(0), 'top5', sf.slice(0, 5).map(v => v.toFixed(0)).join(','));
console.log('self time (ms):'); for (const [k, v] of top) console.log('  ' + v.toFixed(0).padStart(6) + '  ' + k);
chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch {} } process.exit(0);
