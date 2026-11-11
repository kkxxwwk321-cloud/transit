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
// Reviewer path: line settings open, new name + colour picked, no save → real page reload → saved game restored.
const [w, h] = size.split('x').map(Number);
await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true }); await send('Runtime.enable');
const ready = async () => { for (let i = 0; i < 80; i++) { await wait(250); const r = await run("return document.readyState==='complete'&&typeof startAtlasMap==='function'&&!!S"); if (r.value) return; } };
await send('Page.navigate', { url }); await ready();
const before = (await run(fs.readFileSync(new URL('./setupE.js', import.meta.url), 'utf8') + ";save();return {name:S.lines[0].name,color:S.lines[0].color}")).value;
const mid = (await run(`renameLine(S.lines[0].id);await new Promise(r=>setTimeout(r,200));document.getElementById('linename').value='未保存的名称';
const b=[...document.querySelectorAll('#modal-content .colors button')].find(b=>!(b.getAttribute('onclick')||'').includes("'"+S.lines[0].color+"'"));b.click();await new Promise(r=>setTimeout(r,200));
return {picked:/'(#[0-9a-f]+)'/i.exec(b.getAttribute('onclick'))[1],lineNow:S.lines[0].color}`)).value;
await send('Page.reload', { ignoreCache: true }); await ready(); await wait(500);
const after = (await run('return {name:S.lines[0].name,color:S.lines[0].color}')).value;
console.log(JSON.stringify({ before, mid, after, ok: after.color === before.color && after.name === before.name && mid.lineNow === before.color }));
chrome.kill(); for (let i = 0; i < 8; i++) { await wait(500); try { fs.rmSync(__profile, { recursive: true, force: true }); break; } catch {} }   // Chrome may still hold files: retry
process.exit(0);
