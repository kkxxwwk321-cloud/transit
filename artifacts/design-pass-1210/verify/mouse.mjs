import { fileURLToPath } from 'node:url';
// usage: node tour.mjs outdir WxH[m] scenarios.json   (env: SETUP=file.js, DSF=device scale, URL=page, PROFILE=name)
// scenarios.json: [{name, js, wait?, frames?, interval?, each?, clip?, log?}]
// Each scenario: fresh navigation → wait until all scripts loaded → SETUP code → js → optional frame series.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const size = process.argv[2] || "390x844";
const url = process.env.URL || 'http://127.0.0.1:8791/test04/';
const port = 9334 + Math.floor(Math.random() * 400);
const profile = (process.env.VERIFY_TMP || fileURLToPath(new URL('../../../.verify-tmp', import.meta.url))) + '/cdp_' + (process.env.PROFILE || 'tour') + '_' + port;
const __profile=(profile);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir='+__profile, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms));
let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = {};
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') console.log('PAGE-ERROR', (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).slice(0, 300)); if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const run = async code => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${code}})()`, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) return { error: (r.result.exceptionDetails.exception?.description || '').slice(0, 300) }; return { value: r.result?.result?.value }; };
// Reviewer-style mouse repro of two camera bugs. usage: node mouse.mjs WxH
const [w, h] = size.split('x').map(Number);
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
await send('Runtime.enable');
const setup = fs.readFileSync(new URL('./setupE.js', import.meta.url), 'utf8');
const ev = async c => { const r = await run(c); if (r.error) console.log('ERR', r.error); return r.value; };
const mouse = async (type, x, y) => send('Input.dispatchMouseEvent', { type, x, y, button: 'left', buttons: type === 'mouseReleased' ? 0 : 1, clickCount: 1 });
const click = async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await mouse('mousePressed', x, y); await wait(60); await mouse('mouseReleased', x, y); };
const drag = async (x, y, dx, dy) => { await mouse('mousePressed', x, y); for (let i = 1; i <= 10; i++) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + dx * i / 10, y: y + dy * i / 10, button: 'left', buttons: 1 }); await wait(16); } await mouse('mouseReleased', x + dx, y + dy); };
const V = 'return {x:Math.round(view.x),y:Math.round(view.y),s:+view.scale.toFixed(3),sel:selected&&selected.type+":"+selected.id,jp:!document.getElementById("junction-picker").hidden,det:!document.getElementById("details").hidden}';
const pos = async id => ev(`const p=toScreen(S.cities[${id}]);return [Math.round(p.x),Math.round(p.y)]`);
// A pan that starts on empty map: if the drag selected something (it began on a line or vehicle), undo and retry elsewhere.
async function panEmpty() {
  for (const [fx, fy] of [[.5, .45], [.3, .3], [.7, .3], [.2, .55], [.8, .55], [.5, .25]]) {
    await drag(Math.round(w * fx), Math.round(h * fy), 30, 120); await wait(400);
    if (!(await ev('return !!selected'))) return;
    await ev('clearSelection();uxFrameRestore=null'); await wait(500);
  }
}
// Bring a city into the open map (not under a panel) by dragging the map from empty ground, as a player would.
async function onMap(id) {
  for (let k = 0; k < 4; k++) {
    const st = await ev(`const p=toScreen(S.cities[${id}]),e=document.elementFromPoint(p.x,p.y);return {x:Math.round(p.x),y:Math.round(p.y),free:!!e&&e.id==='map'}`);
    if (st.free) return [st.x, st.y];
    const tx = Math.round(w * .45), ty = Math.round(h * .45);
    for (const [fx, fy] of [[.5, .3], [.3, .3], [.7, .3], [.5, .5]]) {
      await drag(Math.round(w * fx), Math.round(h * fy), Math.max(-200, Math.min(200, tx - st.x)), Math.max(-200, Math.min(200, ty - st.y))); await wait(400);
      if (!(await ev('return !!selected'))) break;
      await ev('clearSelection();uxFrameRestore=null'); await wait(400);
    }
  }
  return pos(id);
}
async function fresh() { await send('Page.navigate', { url }); for (let i = 0; i < 40; i++) { await wait(250); const ok = await run("return typeof S!=='undefined'&&!!S&&typeof uxVisibleRect==='function'&&typeof addStockAsset==='function'&&document.readyState==='complete'&&typeof startAtlasMap==='function'"); if (ok.value) break; } await ev(setup); await wait(500); }
// --- bug 2: pan, tap a two-line city, close the picker
await fresh();
await panEmpty();
const j = await onMap(1); const before = await ev(V);
await click(j[0], j[1]); await wait(900); const open = await ev(V);
await ev(`document.querySelector('#junction-picker .junction-heading button').click()`); await wait(800); const after = await ev(V);
console.log('BUG2', JSON.stringify({ before, open, after, restored: open.jp && Math.abs(after.x - before.x) < 4 && Math.abs(after.y - before.y) < 4 }));
// --- bug 3: same, but closing by tapping empty map
await fresh();
await panEmpty();
const j3 = await onMap(1); const b3 = await ev(V);
await click(j3[0], j3[1]); await wait(900);
await click(30, Math.round(h * .2)); await wait(800); const a3 = await ev(V);
console.log('BUG2-map', JSON.stringify({ b3, a3, restored: Math.abs(a3.x - b3.x) < 4 && Math.abs(a3.y - b3.y) < 4 }));
// --- bug 1: preview a range on city A, then tap city B, then expand its sheet
await fresh();
await ev(`openCity(2)`); await wait(500); await ev(`previewMeteo(2)`); await wait(700); const pv = await ev(V);
const b = await pos(+(process.env.B || 0)); await click(b[0], b[1]); await wait(800); const sw = await ev(V);
await ev(`uxSheetSet('full')`); await wait(800); const full = await ev(V);
console.log('BUG1', JSON.stringify({ pv, sw, full }));

const at = async sel => ev(`const r=document.querySelector(${JSON.stringify(sel)})?.getBoundingClientRect();return r&&r.width?[Math.round(r.left+r.width/2),Math.round(r.top+r.height/2)]:null`);
const near = (a, b) => Math.abs(a.x - b.x) < 4 && Math.abs(a.y - b.y) < 4 && Math.abs(a.s - b.s) < 1e-3;
// --- P2 (review f38fbb8): line picker → 城市任务与候车 → close the city sheet with ×
await fresh();
const jc = await onMap(1); const v0 = await ev(V);
await click(jc[0], jc[1]); await wait(900);
const task = await at('#junction-picker .junction-city-task'); await click(task[0], task[1]); await wait(1000); const mid = await ev(V);
const x = await at('#details .close'); await click(x[0], x[1]); await wait(900); const v1 = await ev(V);
console.log('TRANSFER', JSON.stringify({ v0, mid, v1, restored: near(v0, v1), moved: !near(v0, mid) }));
// --- P3: meteo preview on A → select B → expand → close: no circle left
await fresh();
await ev(`openCity(2)`); await wait(500); await ev(`previewMeteo(2)`); await wait(700);
const m0 = await ev('return JSON.stringify(meteoPreview)');
const bb = await pos(0); await click(bb[0], bb[1]); await wait(800);
const m1 = await ev('return JSON.stringify(meteoPreview)');
await ev(`uxSheetSet('full')`); await wait(600);
const xc = await at('#details .close'); await click(xc[0], xc[1]); await wait(600);
const m2 = await ev('return JSON.stringify([meteoPreview, typeof repairCenterPreview!=="undefined"?repairCenterPreview:"-", selected])');
console.log('PREVIEW', JSON.stringify({ previewOnA: m0, afterSwitch: m1, afterClose: m2 }));
// repair-centre preview: same lifecycle
await fresh();
await ev(`S.cities[2].size=Math.max(1,S.cities[2].size);openCity(2)`); await wait(500); await ev(`previewRepairCenter(2)`); await wait(700);
const r0 = await ev('return JSON.stringify(repairCenterPreview)'); const rb = await pos(0); await click(rb[0], rb[1]); await wait(800);
console.log('REPAIR', JSON.stringify({ onA: r0, afterSwitch: await ev('return JSON.stringify([repairCenterPreview,selected])') }));
chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(__profile, { recursive: true, force: true }); break; } catch {} }   // Chrome may still hold files: retry
process.exit(0);
