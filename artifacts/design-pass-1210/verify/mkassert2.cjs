// Browser assertions for the 2026-11-08 design pass. Writes scenA_E.json (early game), scenA_F.json (fresh game),
// scenA_L.json (late network). Each probe acts through the page's own controls and returns {ok, ...details}.
const fs = require('fs');
const W = ms => `await new Promise(r => setTimeout(r, ${ms}));`;
const P = {
  stock_tab: `uxOpenHub('money', 3); ${W(300)}
const on = [...document.querySelectorAll('.ux-hub-tabs button')].filter(b => b.classList.contains('on') || b.getAttribute('aria-selected') === 'true').map(b => b.textContent);
return { ok: on.length === 1 && on[0] === '股票', on };`,
  trade: `let f = financeState(); f.everBank = true; f.everBroker = true; S.cities[__com].size = 2; S.points = 1e6;
try { buildFinance(__com, 'bank'); } catch (e) {} try { buildFinance(__com, 'broker'); } catch (e) {} closeModal();
uxOpenHub('money', 3); ${W(400)}
const m = document.getElementById('modal-content'), q = document.getElementById('stock-quantity');
q.scrollIntoView({ block: 'center' }); ${W(100)} const top = m.scrollTop;
q.value = '5'; q.dispatchEvent(new Event('input', { bubbles: true }));
const buy = [...m.querySelectorAll('button')].find(b => /买入/.test(b.textContent) && /tradeStock/.test(b.getAttribute('onclick') || ''));
const cash0 = S.points; buy.click(); ${W(300)}
const m2 = document.getElementById('modal-content'), q2 = document.getElementById('stock-quantity');
return { ok: top > 100 && Math.abs(m2.scrollTop - top) < 4 && q2.value === '5' && S.points < cash0, top, after: m2.scrollTop, qty: q2.value, spent: Math.round(cash0 - S.points) };`,
  research: `uxOpenHub('money', 0); ${W(200)} showTransportResearch(); ${W(200)}
const back = !!document.querySelector('#modal-content .ux-back');
document.querySelector('#modal-content .modal-head .close').click(); ${W(200)}
return { ok: back && !modalOpen, back, modalOpen };`,
  // name AND colour, through each exit: 取消 and × keep both as they were; 保存设置 keeps both edits
  rename: `const l = S.lines[0], name0 = l.name, color0 = l.color, out = {};
const edit = async () => { renameLine(l.id); ${W(200)} document.getElementById('linename').value = '改了一半';
  const sw = [...document.querySelectorAll('#modal-content .colors button')].find(b => !(b.getAttribute('onclick') || '').includes("'" + l.color + "'")); sw.click(); ${W(100)}
  return /'(#[0-9a-f]+)'/i.exec(sw.getAttribute('onclick'))[1]; };
let picked = await edit(); lineStyle(l); out.preview = ctx.strokeStyle === picked && l.color === color0;   // drawn as a preview, the line itself untouched
[...document.querySelectorAll('#modal-content button')].find(b => b.textContent.trim() === '取消').click(); ${W(200)}
out.cancel = !modalOpen && l.name === name0 && l.color === color0;
picked = await edit(); document.querySelector('#modal-content .modal-head .close').click(); ${W(200)}
out.close = !modalOpen && l.name === name0 && l.color === color0;
picked = await edit(); document.querySelector('#modal-content button.primary[onclick^="applyName"]').click(); ${W(200)}
out.save = !modalOpen && l.name === '改了一半' && l.color === picked;
l.name = name0; l.color = color0; updateUI();
return { ok: out.preview && out.cancel && out.close && out.save, ...out };`,
  quake: `uxOpenHub('build', 0); ${W(200)}
const q = document.querySelector('#modal-content .quake-summary'); return { ok: !!q && q.classList.contains('is-idle') && q.getBoundingClientRect().height < 70, h: q && Math.round(q.getBoundingClientRect().height) };`,
  peek: `if (!portraitMode) return { ok: true, skipped: 'peek is a portrait sheet state' };
openCity(__com); ${W(600)} const d = document.getElementById('details');
const bar = d.querySelector('.ux-peekbar'), vis = !!bar && getComputedStyle(bar).display !== 'none' && d.classList.contains('is-peek');
bar.click(); ${W(400)} const full1 = d.classList.contains('is-full');
uxSheetSet('peek'); ${W(400)}
d.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true })); ${W(300)}
return { ok: vis && full1 && d.classList.contains('is-full'), peekbar: vis, click: full1, wheel: d.classList.contains('is-full') };`,
  facstrip: `openCity(__com); ${W(600)} const d = document.getElementById('details');
const strip = d.querySelector('.ux-fac-strip'); if (!strip) return { ok: false, strip: false };
const r = strip.getBoundingClientRect(), dr = d.getBoundingClientRect(), pb = d.querySelector('.ux-peekbar'), lim = portraitMode && pb && getComputedStyle(pb).display !== 'none' ? pb.getBoundingClientRect().top + 1 : dr.bottom, inView = r.bottom <= lim;   // above the peek bar (its height changed with the compact sheet)
strip.querySelector('button[data-i]').click(); ${W(900)}
const tile = d.querySelector('.ux-fac-tile').getBoundingClientRect(), d2 = d.getBoundingClientRect();
return { ok: inView && (!portraitMode || d.classList.contains('is-full')) && tile.top >= d2.top - 1 && tile.bottom <= d2.bottom + 2, inView };`,
  // a running activity shows the structured card (progress, stakes) whatever the upstream locate button is called, and
  // its button still does upstream's locate (regional: 定位任务城市 → locateActivityCity)
  actrun: `S.day = 40; const st = activityState(); st.offers = []; st.active = null; st.next = 0; generateActivityOffers(); ${W(100)}
try { acceptActivity(st.offers[0].id); } catch (e) {} closeModal(); S.day = (st.active?.start ?? S.day) + .2; updateUI(); ${W(200)} closeModal();
uxOpenHub('goal', 1); ${W(600)} const m = document.getElementById('modal-content'), box = m.querySelector('.ux-act'), go = box?.querySelector('.ux-act-go');
const upstream = [...m.querySelectorAll('section.infra-card')].some(x => /定位(举办|任务)城市/.test(x.textContent)), call = go?.getAttribute('onclick') || '';
go?.click(); ${W(700)} const located = !modalOpen && (selected?.type === 'city' || selected?.type === 'stop');
return { ok: !!box && !upstream && !!box.querySelector('.ux-act-progress .ux-bar') && located && (typeof locateActivityCity !== 'function' || /locateActivityCity/.test(call)), box: !!box, upstream, call, located };`,
  cards: `S.day = 40; const st = activityState(); st.offers = []; st.active = null; st.next = 0; generateActivityOffers();
${W(100)} closeModal(); uxOpenHub('goal', 1); ${W(500)}
document.querySelector('#modal-content .activity-back')?.click(); ${W(900)} document.getAnimations().forEach(a => a.finish());
const c = document.querySelector('#modal-content .card-content128'), h = c ? c.getBoundingClientRect().height : 0;
const tools = [...document.querySelectorAll('.deck-tools128 button')].every(b => b.getBoundingClientRect().bottom <= innerHeight);
return { ok: h >= 120 && tools, contentH: Math.round(h), tools };`,
  coach: `const c = document.getElementById('ux-coach'); if (!c || document.querySelector('script[src*="update129"]')) return { ok: true, skipped: 'v1.5 replaces the coach with its own tutorial (update129.js removes #ux-coach)' }; const before = !c.hidden;
openCity(realCities()[1].id); ${W(500)} uxSheetSet('full'); ${W(700)}
const during = !document.getElementById('ux-coach').hidden;
clearSelection(); ${W(700)}
return { ok: before && !during && !document.getElementById('ux-coach').hidden && !document.getElementById('notice').textContent, before, during };`,
  tray: `const p0 = document.getElementById('routes'); if (p0.classList.contains('collapsed')) { document.getElementById('collapse').click(); ${W(200)} }   // short landscape starts collapsed
// grouped by mode (2026-11-16): every line has one chip, in its mode's group, inside the tray's width; tapping a chip
// selects that line; collapsed, one pill per mode (counts add up), all tappable, the tray one row high; a pill opens
// the tray again
const p = document.getElementById('routes'), rows = [...p.querySelectorAll('.ux-tline')], pr = p.getBoundingClientRect();
const allIn = rows.every(r => { const b = r.getBoundingClientRect(); return b.left >= pr.left - 1 && b.right <= pr.right + 1; });
const modes = new Set(S.lines.map(l => l.type)), groupsOk = [...p.querySelectorAll('.ux-tg')].every(g => [...g.querySelectorAll('.ux-tline')].every(b => S.lines.find(l => l.id === +b.dataset.line)?.type === g.dataset.mode));
const lastChip = rows.find(b => +b.dataset.line === S.lines.at(-1).id); lastChip?.scrollIntoView?.({ block: 'nearest' }); ${W(100)} lastChip?.click(); ${W(300)} const picked = selected?.type === 'line' && selected.id === S.lines.at(-1).id; clearSelection(); ${W(300)}
document.getElementById('collapse').click(); ${W(200)}
// a pill counts only if the point at its centre really hits it (catches clipping by any ancestor, overlap, off-screen)
const hit = b => { const r = b.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2; return r.width >= 12 && x > 0 && x < innerWidth && y > 0 && y < innerHeight && b.contains(document.elementFromPoint(x, y)); };
const pills = [...p.querySelectorAll('.ux-tpill')]; pills.forEach(b => b.scrollIntoView?.({ inline: 'nearest', block: 'nearest' })); const sw = pills.filter(b => (b.scrollIntoView?.({ inline: 'nearest', block: 'nearest' }), hit(b))).length, h = p.getBoundingClientRect().height;
const total = pills.reduce((n, b) => n + +b.querySelector('small').textContent, 0);
const newC = document.getElementById('route-new130'), newOk = hit(newC), colOk = hit(document.getElementById('collapse'));
pills[0]?.click(); ${W(300)} const reopened = !p.classList.contains('collapsed');
if (reopened) { document.getElementById('collapse').click(); ${W(100)} }
document.getElementById('collapse').click(); ${W(100)}
const nb = document.getElementById('route-new130').getBoundingClientRect(), fits = nb.right <= p.getBoundingClientRect().right + 1;
return { ok: rows.length === S.lines.length && allIn && groupsOk && pills.length === modes.size && sw === pills.length && total === S.lines.length && picked && reopened && newOk && colOk && fits && (!portraitMode || h < 100), rows: rows.length, allIn, groupsOk, pills: sw + '/' + pills.length + '/' + modes.size, total, tapLast: picked, reopened, newBtn: newOk, collapsedH: Math.round(h) };`,
  wait: `openCity(window.__hub); ${W(600)} const d = document.getElementById('details');
const rows = [...d.querySelectorAll('.ux-wait-row')].map(r => +r.querySelector('b').textContent), groups = d.querySelectorAll('.ux-wait-group').length;
const load = d.querySelector('.ux-load em')?.textContent || '';
return { ok: rows.length >= 5 && groups >= 1 && rows[0] >= rows[1] && /超出/.test(load), rows: rows.slice(0, 5), groups, load };`,
  junction: `showJunction(window.__hub); ${W(900)}
const em = document.querySelector('#junction-picker .junction-city-task em'), c = toScreen(S.cities[window.__hub]), p = document.getElementById('junction-picker').getBoundingClientRect();
const visible = c.y > 40 && c.y < innerHeight && (portraitMode ? c.y < p.top - 10 : !(c.x > p.left && c.x < p.right && c.y > p.top && c.y < p.bottom));
return { ok: !!em && em.classList.contains('is-over') && visible, pill: em?.textContent, visible };`,
  ended: `${W(2800)} S.lives = 0; updateUI(); toast('已回到游戏 · 当前暂停，点 ▶ 继续');
let opened = false; const go = gameover; gameover = () => { opened = true; }; document.getElementById('pause').click(); gameover = go;
return { ok: document.getElementById('pause').textContent === '结算' && /本局已结束/.test(document.getElementById('toast').textContent) && opened };`,
  // hub sheets (2026-11-16): tabs and × on one row in every tab; the sheet fits its content — no blank band under the
  // last element (a short tab such as 车辆 used to keep 86% of the screen), long tabs capped and scrolling inside
  hubframe: `const out = [];
for (const [k, i] of [['money', 0], ['money', 1], ['money', 2], ['money', 3], ['build', 0], ['build', 1], ['build', 2], ['goal', 0]]) {
  uxOpenHub(k, i); ${W(300)} document.getAnimations().forEach(a => a.finish());
  const m = document.getElementById('modal-content'), t = document.querySelector('.ux-hub-tabs').getBoundingClientRect(), c = m.querySelector('.modal-head .close').getBoundingClientRect();
  const row = Math.abs((t.top + t.bottom) / 2 - (c.top + c.bottom) / 2) < 6, mr = m.getBoundingClientRect();
  const last = Math.max(...[...m.children].filter(e => e.offsetHeight).map(e => e.getBoundingClientRect().bottom));
  const gap = m.scrollHeight > m.clientHeight + 2 ? 0 : Math.round(mr.bottom - last);   // scrolling = full by definition
  out.push({ tab: k + i, row, gap });
}
closeModal(); return { ok: out.every(o => o.row && o.gap < 80), out: out.map(o => o.tab + ':' + (o.row ? '' : 'ROW!') + o.gap).join(' ') };`,
  // the edge clamp must never move a city that the play view placed in the free map area under a panel (the reported
  // 078e99c bug), checked both geometrically and by what the city's centre actually hits; edge ground is measured only
  // where it is visible inside the free area
  // v1.5.3 applies the play view once per game (playState153); the synthetic scene grows its network after that, so
  // the check asks for a fresh play view first — it tests the framing, not the moment the scene happened to start
  edge: `if (typeof playState153 !== 'undefined') playState153 = null; uxApplyPlayView(false); ${W(300)}
const r = uxVisibleRect(), raw = uxPlayTargetRaw(), s = view.scale, at = (v, c) => ({ x: v.x + c.x * v.scale, y: v.y + c.y * v.scale });
const free = (v, c) => { const p = at(v, c); return p.x >= r.l && p.x <= r.r && p.y >= r.t && p.y <= r.b; };
const lost = [], hidden = [];
for (const c of realCities().filter(c => !c.dormant)) {
  if (!free(raw, c)) continue;
  if (!free(view, c)) lost.push(c.name);
  const p = toScreen(c), e = document.elementFromPoint(p.x, p.y); if (e && e.id !== 'map' && !e.closest('header')) hidden.push(c.name + '→' + (e.id || e.className || e.tagName));
}
const b = mapSpec.bounds, tl = toScreen({ x: b.xmin, y: b.ymin }), br = toScreen({ x: b.xmax, y: b.ymax });
const bandFree = Math.round(Math.max(0, tl.x - r.l, tl.y - r.t, r.r - br.x, r.b - br.y));
return { ok: lost.length === 0 && hidden.length === 0, lost, hidden, bandFree, freeCities: realCities().filter(c => !c.dormant && free(view, c)).length };`,
  // every station on two or more lines: open the picker, let framing and upstream's soft map bounds settle, close with ×
  // → the view is exactly the one before (99c826f lost it when the soft bounds had nudged the camera)
  restore: `${W(400)} const out = [], v = () => ({ x: view.x, y: view.y, s: view.scale }), same = (a, b) => Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.s - b.s) < 1e-3;
for (const c of realCities().filter(c => !c.dormant && cityLines(c.id).length > 1)) {
  uxApplyPlayView(false); ${W(300)} const before = v(); showJunction(c.id); ${W(1600)}
  document.querySelector('#junction-picker .junction-heading button').click(); ${W(900)}
  const after = v(); if (!same(before, after)) out.push(c.name + ' dx' + Math.round(after.x - before.x) + ' dy' + Math.round(after.y - before.y));
}
return { ok: out.length === 0, notRestored: out };`,
  // the top notice ×: a closed message stays closed through refreshes (927b8c1: events.js wrote it back); new phases show
  notice: `// Top notice ×: a closed message stays closed through refreshes; a different message still shows.
const W = ms => new Promise(r => setTimeout(r, ms)), n = document.getElementById('notice'), x = document.getElementById('notice-close');
const shown = () => { updateUI(); return n.textContent; }, out = {};
S.day = 40; const st = activityState(); st.offers = []; st.active = null; st.next = 0; generateActivityOffers(); await W(100); closeModal(); await W(100);
out.offerShown = shown();
x.click(); await W(50); for (let i = 0; i < 5; i++) updateUI(); await W(600);
out.offerAfterClose = shown();
try { acceptActivity(st.offers[0].id); } catch (e) { out.acceptErr = e.message; } closeModal(); await W(100);
out.prepShown = shown();
x.click(); await W(50); for (let i = 0; i < 5; i++) updateUI(); await W(600);
out.prepAfterClose = shown();
if (st.active) { S.day = st.active.start + .1; } out.runningShown = shown();
x.click(); await W(50); if (st.active) st.active.delivered = (st.active.delivered || 0) + 3; out.runningAfterProgress = shown();
return { ok: !!out.offerShown && !out.offerAfterClose && !!out.prepShown && out.prepShown !== out.offerShown && !out.prepAfterClose && !!out.runningShown && !out.runningAfterProgress, ...out };
`,
  // transit-map lines: planned bends share fewer departure directions than a fixed bend; vehicles ride their drawn lanes;
  // every bent segment is grabbed where drawn; construction / break labels are staged on a bent road for the screenshot
  // a toast shown with a line selected never covers that line's stations or ＋ tabs (portrait: the selection is framed
  // right above the sheet, where the toast used to sit)
  toastsel: `closeModal(); const out = [], full = [];
// real messages through the real toast pipeline (renames included): the line-built feedback, a task reward and the
// lost-life warning; covered = any part of a station / ＋ tab circle of the selection under the toast (node radius)
const clearOf = pts => { const r = document.getElementById('toast').getBoundingClientRect(); return pts.filter(q => q.x + q.r > r.left && q.x - q.r < r.right && q.y + q.r > r.top && q.y - q.r < r.bottom).length; };
const node = c => { const q = toScreen(c); q.r = uxNodePx(c); return q; };
for (const l of S.lines) { selected = { type: 'line', id: l.id }; updateUI(); ${W(700)} toast('线路已应用 · 支出 ¥6030'); ${W(450)} document.getAnimations().forEach(a => a.finish());
  const sheetTop = document.getElementById('details').getBoundingClientRect().top || innerHeight;
  const pts = [...l.stops.map(id => node(S.cities[id])), ...uxVisibleHandles().map(t => { const q = toScreen(t); q.r = 10; return q; })].filter(q => !portraitMode || q.y - q.r < sheetTop);
  out.push(clearOf(pts)); clearSelection(); updateUI(); ${W(200)} }
// a city whose sheet is fully expanded: only a strip of map is left above it
for (const c of realCities().slice(0, 6)) for (const msg of [c.name + '完成任务 · +¥700', c.name + '候客厅持续满员，扣一条生命 · 本城保护45秒']) {
  closeModal(); openCity(c.id); ${W(500)} if (portraitMode) uxSheetSet('full'); ${W(700)} toast(msg); ${W(450)} document.getAnimations().forEach(a => a.finish());
  full.push(clearOf([node(c)])); clearSelection(); updateUI(); ${W(200)} }
return { ok: out.every(n => n === 0) && full.every(n => n === 0), covered: out, cityFull: full.join('') };`,
  // a route across a river with no bridge (2026-11-16): quoted with the best new bridge instead of refused; short of
  // funds nothing is built (no lone bridge); with funds it charges exactly the quote, builds one bridge, runs over its
  // heads; a second route over the same river reuses it; a route with no river is left alone
  // why the run ended (2026-11-18): close to a life loss the station's pill counts down, and goes back to the count when
  // the hall recovers; the results name the station that actually cost the last life (recorded at the moment), the
  // secondary button opens that station, and notices are gone from the finished map
  // 双洋大陆 harbours (2026-11-18): on a coastal town the harbour leads the facility strip, visible in the peek sheet;
  // built alone it says a second one is needed (strip and toast), with two it starts a sea route; inland towns show none
  harbor: `localStorage.clear(); atlasSelected = 'ocean'; atlasRestart = true; startAtlasBeforeLifecycle12(); ${W(500)} closeModal(); S.tutorial123 = null; S.points = 20000; try { notices130().queue = []; } catch (e) {}
const coast = realCities().filter(c => harborPoint16(c)), inland = realCities().find(c => !harborPoint16(c));
const chip = () => { const s = document.querySelector('#details .ux-fac-strip'), b = s?.querySelector('.ux-harbor'), d = document.getElementById('details').getBoundingClientRect(); return b ? { t: b.textContent, first: s.children[1] === b, vis: !!b.getClientRects().length && b.getBoundingClientRect().bottom <= d.bottom - 20 && b.getBoundingClientRect().right <= d.right } : null; };
const live = S.lives, oldCash = S.points; S.lives = 0; openCity(coast[0].id); buildHarbor16(coast[0].id);
const noEndedCharge = !coast[0].harbor && S.points === oldCash && !chip(); S.lives = live;
openCity(coast[0].id); ${W(700)} const a = chip(), d = document.getElementById('details');
if (innerHeight > innerWidth) d.querySelector('.ux-peekbar').click(); ${W(500)}
const full = innerHeight <= innerWidth || (d.classList.contains('is-full') && !!d.querySelector('.ux-harbor')?.getClientRects().length);
S.day = 4; notices130().queue = [{id:'weather',title:'气象站可以建设了',copy:'',hub:'build'}]; showNotice130(); const deferred = !modalOpen && notices130().queue.length === 1;
const cash = S.points; d.querySelector('.ux-harbor').click(); ${W(500)} const b = chip(), toastT = document.getElementById('toast').textContent;
const single = d.querySelector('.ux-harbor')?.disabled && !d.querySelector('.harbor-connect164') && Math.abs(cash - S.points - 1500) < .01;
clearSelection(); showNotice130(); const delivered = modalOpen && notices130().queue.length === 0; closeModal(); buildHarbor16(coast[1].id); closeModal(); openCity(coast[0].id); ${W(700)} const c = chip(); document.querySelector('#details .ux-harbor').click(); ${W(500)} const sea = draft && /ship|ferry/.test(draft.type);
if (draft) cancelDraft(false); closeModal(); let none = true; if (inland) { openCity(inland.id); ${W(500)} none = chip() === null; }
return { ok: noEndedCharge && full && single && deferred && delivered && !!a && a.first && a.vis && /建港口/.test(a.t) && /再建一座/.test(b?.t) && /再建一座港口即可开航/.test(toastT) && /开航线/.test(c?.t) && sea && none && !document.querySelector('#details > .harbor16'), a: a?.t, b: b?.t, toast: toastT, c: c?.t, sea, none, full, single, deferred, delivered, noEndedCharge };`,
  warningedge: `closeModal();clearSelection();S.paused=true;S.speed=4;
const c=S.cities[window.__hub], limit=c.shape===1?205:160;c.congestionPressure=limit-8;c.warning=8;
const paint=ctx.fillText, results=[];
try { for(const screenX of [40,W-40]){
  Object.assign(view,uxViewFor(c,screenX,H*.4,.66));const hits=[];let stale=false;
  ctx.fillText=function(label,x,y,...rest){if(/距扣命约 2 秒/.test(label)){const m=this.getTransform(),k=Math.hypot(m.a,m.b)/dpr,w=this.measureText(label).width*k,center=(m.a*x+m.c*y+m.e)/dpr;const cy=(m.b*x+m.d*y+m.f)/dpr;
  const covered=realCities().filter(o=>o!==c).some(o=>{const p=toScreen(o),r=radius(o)*k+3;return p.x+r>center-w/2-5 && p.x-r<center+w/2+5 && p.y+r>cy-8 && p.y-r<cy+8;});
  hits.push([Math.round(center-w/2),Math.round(center+w/2),Math.round(parseFloat(this.font)*k),covered]);} if(label==='拥挤 8s')stale=true;return paint.call(this,label,x,y,...rest);};
  render();results.push({screenX,hits,stale});
} } finally {ctx.fillText=paint;}
return {ok:results.every(r=>!r.stale&&r.hits.length===1&&r.hits[0][0]>=0&&r.hits[0][1]<=W&&r.hits[0][2]>=10&&!r.hits[0][3]),results};`,
  lastlife: `try { const st = activityState(); st.offers = []; st.next = S.day + 1e6; } catch (e) {} closeModal(); clearSelection(); S.speed = 1;
const c = realCities().find(x => x.name.startsWith('海宁')) || realCities()[4], cap = capacity(c), limit = c.shape === 1 ? 205 : 160;
for (let i = 0; c.q.length < cap * 1.5 && i < 200; i++) try { newPassenger(c); } catch (e) {}
c.grace = 0; c.shield = 0; c.congestionPressure = limit - 20; const near = uxLifeLeft(c);
c.congestionPressure = 10; const far = uxLifeLeft(c);
const keep = c.q.slice(); c.q.length = Math.floor(cap / 2); c.congestionPressure = limit - 20; const calm = uxLifeLeft(c); c.q.push(...keep.slice(c.q.length));
const other = S.cities[window.__hub]; other.grace = 0; other.shield = 0; other.congestionPressure = (other.shape === 1 ? 205 : 160) - 15;
const secondAtRisk = uxLifeLeft(other);
S.lives = 1; c.congestionPressure = limit - .5; S.paused = false; ${W(2500)} document.getAnimations().forEach(a => a.finish());
const m = document.getElementById('modal-content'), line = m.querySelector('.ux-lastlife')?.textContent || '', btn = [...m.querySelectorAll('button')].find(b => /查看失守车站/.test(b.textContent));
btn?.click(); ${W(900)} const opened = selected?.type === 'city' && selected.id === c.id;
const endedClean = secondAtRisk === 15 && uxLifeLeft(other) === null && dEnded();
function dEnded() { const load = document.querySelector('#details .ux-load'); return !!load && load.textContent.includes('本局失守') && !/保护中|计满扣一条命/.test(load.textContent); }
return { ok: endedClean && near >= 18 && near <= 20 && far === null && calm === null && S.lives === 0 && line.includes(c.name.split('·')[0]) && !!btn && opened && !document.getElementById('notice').textContent, near, far, calm, line, opened, secondAtRisk, endedClean };`,
  autobridge: `S.paused = true; closeModal(); clearSelection(); const cz = realCities().filter(c => !c.dormant), out = {};
let pair = null, pair2 = null, plain = null;
for (const a of cz) for (const b of cz) if (!pair && a.id < b.id && requirements(a, b, 'bus').bridge === 1 && !requirements(a, b, 'bus').tunnel && Math.hypot(a.x - b.x, a.y - b.y) < 700) pair = [a, b];
if (!pair) return { ok: true, skipped: 'no river pair in this scene' };
const quote = st => { draft = { type: 'bus', name: '测试线', color: '#7a5aa0', stops: st.map(c => c.id), stopRemoval: null }; draftBar(); return draftCost(); };
let q = quote(pair); out.quoted = !q.invalid && q.uxBridges?.items.some(i => i.kind === 'new');
S.points = q.cash - 1; const br0 = S.bridges.length, l0 = S.lines.length; document.getElementById('drawdone').click(); ${W(300)}
out.poor = S.bridges.length === br0 && S.lines.length === l0;
S.points = 1e6; const cash = S.points; q = quote(pair); document.getElementById('drawdone').click(); ${W(400)} if (modalOpen) document.querySelector('#modal .primary')?.click(); ${W(300)}
const l = S.lines.at(-1); out.built = S.lines.length === l0 + 1 && S.bridges.length === br0 + 1 && Math.abs(cash - S.points - q.cash) < 1 && l.stops.filter(id => S.cities[id].kind === 'bridgehead').length === 2 && !draft;
out.receipt = document.getElementById('toast').textContent === '线路与新桥已建成 · 合计支出 ' + money(cash - S.points);
for (const a of cz) for (const b of cz) if (!pair2 && a.id < b.id && !(a === pair[0] && b === pair[1]) && requirements(a, b, 'bus').bridge === 1 && !requirements(a, b, 'bus').tunnel && Math.hypot(a.x - b.x, a.y - b.y) < 900) pair2 = [a, b];
if (pair2) { clearSelection(); q = quote(pair2); out.reuse = !q.invalid && !!q.uxBridges?.items.length && q.uxBridges.items.every(i => i.kind === 'reuse'); cancelDraft(false); } else out.reuse = true;
for (const a of cz) for (const b of cz) if (!plain && a.id < b.id && !requirements(a, b, 'bus').bridge && !requirements(a, b, 'bus').tunnel) plain = [a, b];
if (plain) { q = quote(plain); out.plain = !q.invalid && !q.uxBridges; cancelDraft(false); } else out.plain = true;
// one undo takes back the route and its new bridge, refunding all of it
const open = () => S.bridges.filter(x => x.status === 'open').length, ob = open(), p1 = S.points; document.getElementById('undo-build').click(); ${W(300)}
out.undo = S.lines.length === l0 && open() === ob - 1 && Math.abs(S.points - p1 - (cash - p1)) < 1;
return { ok: out.quoted && out.poor && out.built && out.receipt && out.reuse && out.plain && out.undo, ...out };`,
  lines: `// 1) same-direction departures (overlap risk) with planned bends vs. a fixed bend; 2) vehicles on lanes; 3) grab at
// drawn midpoints; then stage a construction + a break on 栖山—河岸镇 for the screenshot.
const segs = new Map();
for (const l of S.lines) for (let i = 1; i < l.stops.length; i++) { const a = S.cities[l.stops[i - 1]], b = S.cities[l.stops[i]]; const k = Math.min(a.id, b.id) + '-' + Math.max(a.id, b.id); if (!segs.has(k)) segs.set(k, [a, b, l.type]); }
const clash = pathFn => { const dep = new Map(); let n = 0;
  for (const [a, b, type] of segs.values()) { const p = pathFn(a, b, type); const da = p ? uxOctDir(a, p[1]) : uxOctDir(a, b), db = p ? uxOctDir(b, p[1]) : uxOctDir(b, a);
    for (const [id, d] of [[a.id, da], [b.id, db]]) { const k = id + ':' + d; dep.set(k, (dep.get(k) || 0) + 1); } }
  for (const v of dep.values()) if (v > 1) n += v - 1; return n; };
const fixed = (a, b, type) => { const o = uxOctOptions(a, b, type); if (!o) return null; const p = o.A || o.B; return p ? (o.lo === a ? p : p.slice().reverse()) : null; };
const clashFixed = clash(fixed), clashPlanned = clash(uxOctPath);
S.paused = false; await new Promise(r => setTimeout(r, 1500)); S.paused = true;
let worst = 0, nv = 0;
for (const v of S.vehicles) { const l = S.lines.find(x => x.id === v.line), pose = vehiclePose(v); if (!l || !pose) continue; const lv = v.stops ? { ...l, stops: v.stops } : l; let ni = v.index + v.dir; if (ni < 0 || ni >= lv.stops.length) ni = v.index - v.dir; const p = lanePoint(S.cities[lv.stops[v.index]], S.cities[lv.stops[ni]], l, travelPhase(v.t)); worst = Math.max(worst, Math.hypot(p.x - pose.x, p.y - pose.y)); nv++; }
let bent = 0, grabbed = 0;
for (const l of S.lines) for (let i = 1; i < l.stops.length; i++) { const a = S.cities[l.stops[i - 1]], b = S.cities[l.stops[i]]; if (!uxOctPath(a, b, l.type)) continue; bent++; selected = { type: 'line', id: l.id }; const h = routeHit(lanePoint(a, b, l, .5)); if (h && h.l.id === l.id && h.index === i) grabbed++; }
selected = null;
// stage: line 6 segment 栖山—河岸镇 under construction and broken
const pick2 = n => realCities().find(c => c.name.startsWith(n)), qa = pick2('栖山'), qb = pick2('河岸镇');
const inf = Object.values(S.infrastructure).find(x => (x.a === qa.id && x.b === qb.id) || (x.a === qb.id && x.b === qa.id));
if (inf) inf.until = S.day + 2;
S.blockages[key(qa, qb, 'bus')] = { status: 'broken' };
closeModal(); clearSelection(); uxApplyPlayView(false); await new Promise(r => setTimeout(r, 800)); closeModal(); document.getAnimations().forEach(a => a.finish());
return { ok: clashPlanned <= clashFixed && worst < .01 && grabbed === bent, clashFixed, clashPlanned, vehicles: nv, worst: +worst.toFixed(4), bent, grabbed, staged: !!inf, segBent: !!uxOctPath(qa, qb, 'bus') };
`,
  // capsule family: the construction undo sits in the feedback capsule with the message (2026-11-16), clear of the
  // notice column and as tall as a notice; the achievements page renders all rows with one close button, the medal
  // tiers on one line and nothing wider than the sheet
  capsules: `S.paused = true; closeModal(); S.day = 40; const st = activityState(); st.offers = []; st.active = null; st.next = 0; generateActivityOffers(); ${W(100)} closeModal(); updateUI();
constructionUndo = { label: '建线', expires: performance.now() + 9000, paid: 1200 }; showUndoBuild(); ${W(200)}
const u = document.getElementById('undo-build'), fb = document.getElementById('ux-feedback'), nw = document.querySelector('.notice-wrap'), ru = (fb || u).getBoundingClientRect(), rn = nw.getBoundingClientRect();
const inStack = !!fb && u.closest('#ux-feedback') === fb && fb.classList.contains('show'), apart = ru.top >= rn.bottom - 1 || rn.top >= ru.bottom - 1 || ru.left >= rn.right - 1 || rn.left >= ru.right - 1, sameH = Math.abs(ru.height - rn.height) <= 2;
constructionUndo = null; showUndoBuild();
achievements14.best.day100 = 50; showAchievements14(); ${W(400)} document.getAnimations().forEach(a => a.finish());
const mc = document.getElementById('modal-content'), rows = mc.querySelectorAll('.uxa-row').length, closes = [...mc.querySelectorAll('button')].filter(b => /×/.test(b.textContent) && b.offsetParent).length;
const tiers = [...mc.querySelectorAll('.uxa-tier')].map(t => Math.round(t.getBoundingClientRect().top)), oneLine = new Set(tiers).size === 1;
const wide = [...mc.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > mc.getBoundingClientRect().right + 1).length, prog = mc.querySelectorAll('.uxa-prog').length;
closeModal();
return { ok: inStack && apart && sameH && rows === ACHIEVEMENTS14.length && closes === 1 && oneLine && !wide && prog > 0, inStack, apart, sameH, h: [ru.height, rn.height], rows, closes, oneLine, wide, prog };`,
  cardfacts: `if (!(innerWidth > innerHeight && innerHeight <= 500)) return { ok: true, skipped: 'landscape phone only' };
S.day = 40; const st = activityState(); st.offers = []; st.active = null; st.next = 0; generateActivityOffers();
${W(100)} closeModal(); uxOpenHub('goal', 1); ${W(500)}
document.querySelector('#modal-content .activity-back')?.click(); ${W(900)} document.getAnimations().forEach(a => a.finish());
const box = document.querySelector('#modal-content .card-content128').getBoundingClientRect(), inside = sel => { const r = document.querySelector('#modal-content .card-content128 ' + sel)?.getBoundingClientRect(); return !!r && r.top >= box.top - 1 && r.bottom <= box.bottom + 1; };
return { ok: inside('.card-stats') && inside('.card-reward') && inside('.card-risk') && inside('h3'), stats: inside('.card-stats'), reward: inside('.card-reward'), risk: inside('.card-risk') };`
};
const mk = (file, names) => fs.writeFileSync(file, JSON.stringify(names.map(n => ({ name: 'a_' + n, js: P[n], wait: 300 }))));
mk('scenA_E.json', ['stock_tab', 'trade', 'research', 'rename', 'quake', 'peek', 'facstrip', 'cards', 'hubframe', 'edge', 'cardfacts', 'notice', 'capsules', 'actrun', 'harbor']);
mk('scenA_F.json', ['coach']);
mk('scenA_L.json', ['tray', 'wait', 'junction', 'ended', 'edge', 'restore', 'lines', 'toastsel', 'autobridge', 'lastlife', 'warningedge']);
console.log('built');
