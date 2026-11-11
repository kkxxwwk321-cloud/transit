import { fileURLToPath } from 'node:url';
// usage: node tour.mjs outdir WxH[m] scenarios.json   (env: SETUP=file.js, DSF=device scale, URL=page, PROFILE=name)
// scenarios.json: [{name, js, wait?, frames?, interval?, each?, clip?, log?}]
// Each scenario: fresh navigation → wait until all scripts loaded → SETUP code → js → optional frame series.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
const size = "390x844";
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
// Returning player: a save with waiting passengers, then a normal reload (scripts arrive at their own pace).
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Runtime.enable'); await send('Network.enable');
let errs = []; ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Runtime.exceptionThrown') errs.push((m.params.exceptionDetails.exception?.description || '').split('\n')[0]); });
const ready = async () => { for (let i = 0; i < 80; i++) { await wait(250); const r = await run("return document.readyState==='complete'&&typeof startAtlasMap==='function'&&typeof S!=='undefined'&&!!S"); if (r.value) return; } };
await send('Page.navigate', { url }); await ready();
console.log('setup', JSON.stringify((await run(fs.readFileSync(new URL('./setupE.js', import.meta.url), 'utf8') + ";S.paused=false;save();return [realCities().map(c=>c.q.length).join(), S.lines.length]")).value));
if (process.env.SLOW) await send('Network.emulateNetworkConditions', { offline: false, latency: +process.env.SLOW, downloadThroughput: 200 * 1024, uploadThroughput: 100 * 1024 });
await send('Network.setCacheDisabled', { cacheDisabled: true });
errs = [];
await send('Page.navigate', { url }); await ready(); await wait(1200);
const a = await run('return [typeof drawFrame!=="undefined"?drawFrame:null, S.day, realCities().map(c=>c.q.length).join()]');
await wait(1000);
const b = await run('return [typeof drawFrame!=="undefined"?drawFrame:null, S.day]');
console.log(JSON.stringify({ errors: [...new Set(errs)], count: errs.length, before: a.value, after: b.value, loopAlive: a.value?.[0] !== b.value?.[0] }));
chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(__profile, { recursive: true, force: true }); break; } catch {} }   // Chrome may still hold files: retry
process.exit(0);
