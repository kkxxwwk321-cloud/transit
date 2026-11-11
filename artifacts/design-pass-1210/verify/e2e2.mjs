import { fileURLToPath } from 'node:url';
// End-to-end flow on upstream 1.2.10 + design pass, with trusted touch events (isolated profile, synthetic save).
// usage: node e2e2.mjs outdir [WxH]   — covers: tap city, peek/expand/collapse/close, line picker → city, waiting list,
// draw a line → quote (not charged) → cancel, draw again → build (charged), tray chip → line sheet, rename → cancel,
// money hub → 股票 tab, toast order. Reports every step and page errors.
import { spawn } from 'node:child_process'; import fs from 'node:fs';
const out = process.argv[2]; const [W, H] = (process.argv[3] || '390x844').split('x').map(Number);
const port = 9500 + Math.floor(Math.random() * 300), profile = (process.env.VERIFY_TMP || fileURLToPath(new URL('../../../.verify-tmp', import.meta.url))) + '/cdpe2e2_' + port;
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--user-data-dir=' + profile, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const wait = ms => new Promise(r => setTimeout(r, ms)); let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); break; } catch { await wait(200); } }
const ws = new WebSocket(tabs.find(t => t.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r); let id = 0; const pend = {}; const errors = [];
ws.onmessage = e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') { const d = (m.params.exceptionDetails.exception?.description || '').slice(0, 200); errors.push(d); console.log('PAGE-ERROR', d); } if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; } };
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend[i] = r; ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: `(async()=>{${x}})()`, awaitPromise: true, returnByValue: true }); if (r.result.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description); return r.result.result?.value; };
const tp = (type, pts) => send('Input.dispatchTouchEvent', { type, touchPoints: pts });
const tap = async p => { await tp('touchStart', [{ x: p.x, y: p.y, id: 1 }]); await wait(40); await tp('touchEnd', []); await wait(400); };
async function stroke(points, steps = 16) { await tp('touchStart', [{ ...points[0], id: 1 }]); for (let k = 1; k < points.length; k++) { const a = points[k - 1], b = points[k]; for (let i = 1; i <= steps; i++) { await tp('touchMove', [{ x: a.x + (b.x - a.x) * i / steps, y: a.y + (b.y - a.y) * i / steps, id: 1 }]); await wait(16); } } await tp('touchEnd', []); await wait(500); }
const shot = async name => { const r = await send('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync(`${out}/${name}.png`, Buffer.from(r.result.data, 'base64')); };
const results = []; const step = (k, ok, v) => { results.push({ k, ok }); console.log((ok ? 'PASS ' : 'FAIL ') + k.padEnd(28), JSON.stringify(v)); };
const at = sel => ev(`const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const r=e.getBoundingClientRect();return r.width?{x:r.left+r.width/2,y:r.top+r.height/2}:null`);
const city = i => ev(`const p=toScreen(S.cities[${i}]);return {x:p.x,y:p.y}`);
fs.mkdirSync(out, { recursive: true });
await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 2, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 2 }); await send('Runtime.enable');
const url = 'http://127.0.0.1:8791/test04/';
await send('Page.navigate', { url });
for (let i = 0; i < 60; i++) { await wait(250); if (await ev("return document.readyState==='complete'&&typeof startAtlasMap==='function'&&!!S").catch(() => false)) break; }
await ev(fs.readFileSync(new URL('./setupE.js', import.meta.url), 'utf8') + ';S.paused=true;clearSelection();uxCoachFinish&&uxCoachFinish();');
await wait(3000);   // let the setup's own build toast and its feedback hold run out

// 1. tap a city → its sheet opens as a peek
await tap(await city(0)); await wait(500);
let s = await ev(`const d=document.getElementById('details');return {open:!d.hidden,peek:d.classList.contains('is-peek'),sel:selected&&selected.type+':'+selected.id,bar:!!d.querySelector('.ux-peekbar')}`);
step('1 tap city → peek', s.open && (s.peek || !portraitModeVal()), s); await shot('01_city_peek');
function portraitModeVal() { return W < H; }
// 2. 展开全部 → full; swipe down → peek; × → closed
if (W < H) {
  await tap(await at('#details .ux-peekbar')); await wait(400);
  const full = await ev(`return document.getElementById('details').classList.contains('is-full')`);
  const r = await ev(`const d=document.getElementById('details').getBoundingClientRect();return {x:d.left+d.width/2,y:d.top+60}`);
  await stroke([r, { x: r.x, y: r.y + 140 }], 10); await wait(300);
  const back = await ev(`return document.getElementById('details').classList.contains('is-peek')`);
  step('2 expand / swipe back', full && back, { full, back }); await shot('02_city_cycle');
}
await tap(await at('#details .close')); await wait(400);
step('3 × closes the sheet', await ev(`return document.getElementById('details').hidden`), {});
// 3. tap a city on two lines → picker → city row → sheet with waiting list / load block
await tap(await city(1)); await wait(900);
s = await ev(`const p=document.getElementById('junction-picker');return {picker:!p.hidden,row:p.querySelector('.junction-city-task em')?.textContent}`);
step('4 shared station → picker', s.picker && /候车/.test(s.row || ''), s); await shot('03_picker');
await tap(await at('#junction-picker .junction-city-task')); await wait(700);
s = await ev(`const d=document.getElementById('details');return {open:!d.hidden,load:!!d.querySelector('.ux-load'),wait:d.querySelectorAll('.ux-wait-row').length}`);
step('5 picker → city sheet', s.open && s.load, s); await shot('04_city_from_picker');
await tap(await at('#details .close')); await wait(500);
// 6. tray chip → line sheet → rename → 取消
await tap(await at('#routes .route-row')); await wait(700);
s = await ev(`return {sel:selected&&selected.type,open:!document.getElementById('details').hidden}`);
step('9 tray chip → line sheet', s.sel === 'line' && s.open, s); await shot('07_line');
const name0 = await ev('return S.lines.find(l=>l.id===selected.id).name');
await tap(await at('#details button[onclick^="renameLine"]')); await wait(400);
await ev(`document.getElementById('linename').value='改了一半'`);
await tap(await ev(`const b=[...document.querySelectorAll('#modal-content button')].find(b=>b.textContent.trim()==='取消');const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}`)); await wait(400);
s = await ev(`return {modal:modalOpen,name:S.lines.find(l=>l.id===${'selected?.id ?? -1'})?.name}`);
step('10 rename → 取消 keeps name', !s.modal && s.name === name0, { ...s, name0 });
await ev('clearSelection()'); await wait(400);
// 7. dock 资金 → 股票 tab (locked) is the highlighted one
await tap(await at('#hub-money')); await wait(500);
await tap(await ev(`const b=[...document.querySelectorAll('.ux-hub-tabs button')].find(b=>b.textContent==='股票');const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}`)); await wait(500);
s = await ev(`return [...document.querySelectorAll('.ux-hub-tabs button.on')].map(b=>b.textContent)`);
step('11 资金 → 股票 highlighted', s.length === 1 && s[0] === '股票', s); await shot('08_stock_tab');
await tap(await at('#modal-content .modal-head .close')); await wait(300);
// Phase B: a fresh first game (no lines yet) — the real first-line experience: drag, read the quote, cancel, build.
await send('Page.navigate', { url });
for (let i = 0; i < 60; i++) { await wait(250); if (await ev("return document.readyState==='complete'&&typeof startAtlasMap==='function'&&!!S").catch(() => false)) break; }
await ev("localStorage.removeItem('transit-ux-coach-done');uxCoach.done=false;" + fs.readFileSync(new URL('./setupF.js', import.meta.url), 'utf8') + ';S.paused=true;S.points=5000;');
await wait(600);
const coachOn = await ev(`return !document.getElementById('ux-coach').hidden`);
step('6a first game: coach shown', coachOn, {});
// draw 0 → 1: quote shown, not charged; cancel
const pts0 = await ev('return S.points'), lines0 = await ev('return S.lines.length');
await stroke([await city(0), await city(1)]); await wait(400);
s = await ev(`const b=document.getElementById('drawbar');return {bar:!b.hidden,done:document.getElementById('drawdone').textContent,points:S.points,lines:S.lines.length,draft:!!draft}`);
step('6 drag → quote, not charged', s.bar && /¥/.test(s.done) && s.points === pts0 && s.lines === lines0, s); await shot('05_quote');
await tap(await at('#drawcancel')); await wait(400);
s = await ev(`return {bar:!document.getElementById('drawbar').hidden,draft:!!draft,lines:S.lines.length,points:S.points}`);
step('7 取消 → nothing built', !s.bar && !s.draft && s.lines === lines0 && s.points === pts0, s);
// draw again → 建设 → charged once
await stroke([await city(0), await city(1)]); await wait(400);
await tap(await at('#drawdone')); await wait(700);
s = await ev(`return {lines:S.lines.length,points:S.points,bar:!document.getElementById('drawbar').hidden}`);
step('8 建设 → built and charged', s.lines === lines0 + 1 && s.points < pts0 && !s.bar, { ...s, spent: pts0 - s.points }); await shot('06_built');
step('12 page errors', errors.length === 0, errors.length);
console.log(results.every(r => r.ok) ? 'ALL PASS' : 'SOME FAILED');
chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(profile, { recursive: true, force: true }); break; } catch {} }   // Chrome may still hold files: retry
process.exit(0);
