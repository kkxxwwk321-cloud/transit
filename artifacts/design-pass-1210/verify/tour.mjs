import { fileURLToPath } from 'node:url';
// usage: node tour.mjs outdir WxH[m] scenarios.json   (env: SETUP=file.js, DSF=device scale, URL=page, PROFILE=name)
// scenarios.json: [{name, js, wait?, frames?, interval?, each?, clip?, log?}]
// Each scenario: fresh navigation → wait until all scripts loaded → SETUP code → js → optional frame series.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const [outdir, size, scenFile] = process.argv.slice(2);
const scen = JSON.parse(fs.readFileSync(scenFile, 'utf8'));
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
const mobile = size.endsWith('m'); const [w, h] = size.replace('m', '').split('x').map(Number);
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: +(process.env.DSF || 1), mobile });
await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
await send('Runtime.enable');
fs.mkdirSync(outdir, { recursive: true });
const setup = fs.existsSync(process.env.SETUP || '') ? fs.readFileSync(process.env.SETUP, 'utf8') : '';
for (const s of scen) {
  await send('Page.navigate', { url });
  for (let i = 0; i < 40; i++) { await wait(250); const ok = await run("return typeof S!=='undefined'&&!!S&&typeof uxVisibleRect==='function'&&typeof addStockAsset==='function'&&document.readyState==='complete'&&typeof startAtlasMap==='function'"); if (ok.value) break; }
  const r = await run(setup + '\n' + s.js);
  if (r.error) console.log(s.name, 'ERR', r.error); else if (r.value !== undefined) console.log(s.name, '=>', JSON.stringify(r.value).slice(0, +(process.env.LOG || 600)));
  await wait(s.wait ?? 500);
  const frames = s.frames || 1;
  for (let f = 0; f < frames; f++) {
    if (s.each) { const e = await run(s.each); if (s.log) console.log(s.name, f, JSON.stringify(e.value ?? e.error).slice(0, 400)); }
    const params = { format: 'png' }; if (s.clip) params.clip = { ...s.clip, scale: 1 };
    const shot = await send('Page.captureScreenshot', params);
    const file = `${outdir}/${s.name}${frames > 1 ? '_' + String(f).padStart(2, '0') : ''}.png`;
    fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'));
    if (f < frames - 1) await wait(s.interval || 300);
  }
}
console.log('done', scen.length);
chrome.kill();for(let i=0;i<8;i++){await new Promise(r=>setTimeout(r,500));try{(await import("node:fs")).rmSync(__profile,{recursive:true,force:true});break}catch{}}process.exit(0);   // Chrome may still hold files: retry
