/* 0.4 体验层 — loaded last, after economy.js.
   Interface only: no changes to economy parameters, save keys or simulation rules.
   Sections: helpers · header · sheets · welcome/help · line building · line sheet · tasks · shop · camera/touch. */

/* ---------- helpers ---------- */
const UX_COARSE = typeof matchMedia !== 'undefined' && matchMedia('(pointer:coarse)').matches;
globalThis.HIT_PX = UX_COARSE ? 30 : 21;      // city hit radius in screen px (game.js hitCity)
globalThis.ROUTE_PX = UX_COARSE ? 18 : 12;    // route hit tolerance in screen px (game.js routeHit)
let uxLastType = null;

function money(n) { return '¥' + Math.floor((+n || 0) + 1e-6); }
function haptic(ms = 8) { try { if (UX_COARSE) navigator.vibrate?.(ms); } catch {} }
function uxEl(id) { return document.getElementById(id); }
// Centre a world point in the usable map band (works with the portrait rotation).
function panTo(x, y, scale = view.scale) {
  const b = fitBand(), cx = W / 2, cy = (b.top + b.bottom) / 2;
  animateView(view.rot ? { scale, x: cx + y * scale, y: cy - x * scale } : { scale, x: cx - x * scale, y: cy - y * scale });
}
function uxFocusCity(id) {
  const c = S.cities[id]; if (!c) return;
  closeModal(); hideJunction(); selected = { type: 'city', id }; showDetails();
  // Portrait: the sheet framing (uxFrameSelection) places the city and remembers the prior view for close.
  if (!portraitMode) requestAnimationFrame(() => uxAutoMove(() => panTo(c.x, c.y)));
}
function uxTypes() { return ['bus', 'emu', 'rail', 'air', ...(typeof isOcean16==='function'&&isOcean16()?['ship','ferry']:[])].filter(t => TYPES[t]); }
function uxFreeSlots(t) { return S.limits[t] - S.lines.filter(l => l.type === t && !l.retiring).length; }
function uxServiceLabel(v) {
  return (v.pendingService ? '交接中' : v.service?.mode === 'interval' ? '区间车' : v.service?.mode === 'express' ? '快车' : '全程')
    + (v.parked ? ' · 停在端点' : '') + (v.recall ? ' · 待回收' : '');
}

/* ---------- header: whole-yuan balance ---------- */
const uxUpdateUI = updateUI;
updateUI = function () {
  uxUpdateUI();
  const p = uxEl('points'); if (p) p.textContent = money(S.points);
  // The intro notice repeated the first-game coach (and reappeared right after the coach was closed): the coach is the only guide.
  const n = uxEl('notice'); if (n && n.textContent.startsWith('城市成长测试版')) n.textContent = '';
  if (n && /运营中心|工程采购|交通采购|收支账本/.test(n.textContent)) n.textContent = uxRename(n.textContent);
};

/* ---------- transient messages ---------- */
// Action feedback (money moved, something built) stays readable for a moment: idle information arriving meanwhile
// ("…可以建设", "…可经营", "…已开放") waits its turn instead of replacing it. Warnings, losses and everything else are
// never delayed. The lifecycle "paused, press ▶" note is skipped for a brand-new game (nothing
// to resume yet; the coach is on screen) and, for a finished game, stays valid on both the map and the map picker.
const UX_FEEDBACK = /已支付|支出|退还|全退|已建设|建成|已应用|已购买|买入|卖出|已出售/;
const UX_IDLE_INFO = /可以建设|可经营|可以经营|点击城市查看|已开放|开放了|新城市|发现待接入/;
let uxToastHold = 0, uxToastQueued = null, uxToastTimer = 0;
const uxToastBase = toast;
toast = function (t, ...a) {
  t = String(t ?? '');
  if (/^已回到游戏/.test(t)) {
    if (S && S.lives <= 0) t = '本局已结束';
    else if (S && !S.lines.length && S.day < 1) return;
  }
  if (/^从一座城市拖向另一座/.test(t) && uxCoachActive()) return;   // the coach already says this
  if (/^从河岸拖向对岸/.test(t) && typeof bridgeDraft !== 'undefined' && bridgeDraft) return;   // the bridge bar already says this
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  if (now < uxToastHold && UX_IDLE_INFO.test(t)) {
    uxToastQueued = [t, ...a]; clearTimeout(uxToastTimer);
    uxToastTimer = setTimeout(() => { const q = uxToastQueued; uxToastQueued = null; if (q) toast(...q); }, uxToastHold - now);
    return;
  }
  if (UX_FEEDBACK.test(t)) uxToastHold = now + 2600;
  return uxToastBase(t, ...a);
};

/* ---------- line palette: distinct on small screens, away from the passenger destination hues ---------- */
// Old palette had three near-identical blues/purples and hues next to passenger colours (blue, gold, purple).
// The first four are the most distinct. Only new lines use it; saved lines keep their stored colour.
if (typeof LINECOL !== 'undefined') LINECOL.splice(0, LINECOL.length, '#d36951', '#2f8a78', '#3f5a9e', '#8a9a2e', '#b4487e', '#8a5a3c', '#4f9a4f', '#5f6f78');

/* ---------- retired entry names in upstream texts → the three hubs ---------- */
const UX_RENAMES = [['运营中心选择', '点「目标」选择'], ['交通采购', '建造·车辆'], ['工程采购', '建造'], ['收支账本', '资金·收支'], ['运营中心', '目标']];
function uxRename(t) { t = String(t); for (const [a, b] of UX_RENAMES) t = t.split(a).join(b); return t; }

/* ---------- sheets (modals) ---------- */
const uxOpenModal = openModal;
openModal = function (html) {
  html = uxRename(S ? String(html).split('¥' + S.points).join(money(S.points)) : String(html));
  uxOpenModal(html);
  const m = uxEl('modal-content'); m.scrollTop = 0; m.style.transform = '';
};
function uxDismissModal() {
  const close = uxEl('modal-content').querySelector('.modal-head .close, .close');
  if (close) close.click();
}
(function sheetGestures() {
  const overlay = uxEl('modal'), sheet = uxEl('modal-content');
  overlay.addEventListener('click', e => { if (e.target === overlay) uxDismissModal(); });
  // Swipe the sheet down from its top to dismiss (phones in portrait).
  let y0 = null, dy = 0;
  sheet.addEventListener('touchstart', e => {
    if (typeof casinoState16==='function'&&S?.casino16?.session) return;
    if (!portraitMode || sheet.scrollTop > 0 || !sheet.querySelector('.close')) return;
    y0 = e.touches[0].clientY; dy = 0;
  }, { passive: true });
  sheet.addEventListener('touchmove', e => {
    if (y0 === null) return;
    dy = e.touches[0].clientY - y0;
    if (dy > 0 && sheet.scrollTop <= 0) { sheet.style.transition = 'none'; sheet.style.transform = `translateY(${dy}px)`; }
    else { y0 = null; sheet.style.transform = ''; }
  }, { passive: true });
  sheet.addEventListener('touchend', () => {
    if (y0 === null) return;
    sheet.style.transition = ''; y0 = null;
    if (dy > 90) { sheet.style.transform = 'translateY(100%)'; setTimeout(uxDismissModal, 150); }
    else sheet.style.transform = '';
  });
})();

/* ---------- welcome & help ---------- */
welcome = function (hasSave) {
  openModal(`<div class="ux-hero"><span class="eyebrow">东岸 · 0.5 城市活动版</span><h1>从一条线，带动一座城。</h1>
<p class="ux-lead">从一座城市拖向另一座，修出线路、派出车辆，把乘客送到与他们标记同色同形的城市。完成城市任务拿奖金，看小镇长大。</p></div>
<ul class="ux-points">
<li><i>¥</i><span><b>起步资金有限</b>大巴 ¥${TYPES.bus.vehicle}，拉线另计建设费，报价就在底栏</span></li>
<li><i>↗</i><span><b>任务推动繁荣</b>点城市或「任务」查看阶段目标，奖金自动到账</span></li>
<li><i>♥</i><span><b>别让候客厅满员</b>候车达到容量并持续 180 秒，失去一条命</span></li>
</ul>
<div class="ux-actions"><button class="primary ux-wide" onclick="startGame()">${hasSave ? '继续游戏' : '开始游戏'}</button>${hasSave ? '<button id="ux-new" class="ux-ghost" onclick="uxConfirmNew(this)">重新开始</button>' : ''}</div>
<p class="ux-foot">独立测试存档，不影响正式版 · 每游戏日 12 秒 · <a href="updates/index.html">更新说明</a> · <a href="index.html">正式版</a></p>`);
};
function uxConfirmNew(btn) {
  if (btn.dataset.armed) { newGame(); return; }
  btn.dataset.armed = '1'; btn.textContent = '再点一次：清空存档并重开'; btn.classList.add('ux-danger');
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.textContent = '重新开始'; btn.classList.remove('ux-danger'); } }, 4000);
}

help = function () {
  const sec = (title, items, open) => `<details class="ux-help"${open ? ' open' : ''}><summary>${title}</summary><ul>${items.map(x => `<li>${x}</li>`).join('')}</ul></details>`;
  openModal(`<div class="modal-head"><div><h2>玩法速查</h2><small>点标题展开</small></div><button class="close" onclick="closeModal()">×</button></div>
${sec('基本操作', [
    '<b>建线</b>：从城市拖到下一座城市，可连续经过多座；松手后在底栏选交通方式、看报价，点「建设」。',
    '<b>撤销一站</b>：拉线时点 ↶ 去掉最后一站。',
    '<b>延长</b>：选中线路后，从端点城市拖到新城市。',
    '<b>挂站 / 摘站</b>：拖动线路上的线段经过城市；也可在线路详情里点站名旁的 ×，8 秒内可撤销。',
    '<b>地图</b>：单指拖动平移，双指缩放，⌖ 回到全图；拉线到屏幕边缘时地图会自动跟随。',
    '<b>电脑</b>：空格暂停，滚轮缩放，Esc 取消或关闭。'], true)}
${sec('乘客与任务', [
    '乘客头上的小方块是目的地：<b>颜色＋形状</b>相同的城市都能接收。点城市候车列表可在地图标出目标。',
    '候客厅满员累计160秒才扣生命（旅游城市205秒），最后8秒警告；低于容量逐渐恢复，降到80%以下加快恢复。个人等待只影响服务质量。',
    '每座城市有 6 个阶段任务，奖金自动到账；连续类任务中断只重置天数，不扣钱。',
    '新城镇需要拉线接通才会产生乘客，接通后有 45 秒宽限。'])}
${sec('资金与车辆', [
    uxTypes().map(t => TYPES[t].name + ' ¥' + TYPES[t].vehicle).join(' · ') + '。新车进库存，在线路详情里点「＋」加车（没有库存会直接购买）。',
    '票款按起终点距离 1 / 2 / 3，乘坐方式加权：动车 ×1.4，高铁 ×1.8，飞机 ×3。',
    '每 10 天固定补助；道路月底收维护费，账本里可看预计支出、拆除闲置道路。',
    '动车、高铁可加车厢（最多8节），回库存后保留编组。取消线路可保留资产，或回收闲置道路50%、车辆车厢原价60%。',
    '刚完成建线、改线、建桥或升级后，20秒内可点右上「撤回」全额退款；已载客、被共用或开始后续付费建设时不适用。'])}
${sec('工程与天气', [
    '<b>桥梁</b>：建造 → 桥梁与道路 → 拉建公路桥 / 铁路桥，从一岸拖到对岸。',
    '<b>道路升级</b>：线路详情 → 道路升级，施工期间该路段减速 30%。',
    '<b>气象站</b>范围内天气减速减半；<b>交通枢纽</b>候车容量翻倍，基础最多 3 座，六星活动可增加名额；换乘准备−30%，附近进站提速15%。',
    (S.mapId==='west'?'西部没有台风；第150天后满足高铁解锁、至少6城接入及80天地震间隔时，每天有2%概率地震。':'东部7月下旬至9月可能有台风；第150天后满足条件时每天有0.8%概率地震。')+'受损路段可在建造面板支付维修费。',
    '<b>检修中心</b>：中大城市可建，¥' + (typeof REPAIR_CENTER_COST === 'number' ? REPAIR_CENTER_COST : '') + '、半径300，新开工升级和抢修工期最多缩短10%，部分覆盖按长度折算。'])}
${sec('运营与解锁', [
    '<b>商演</b>：运营 → 筹办，观众带音符，前往举办城市后再返程。',
    '<b>城市服务与学校</b>：长期差评会让城市降级，改善后可恢复。学校正常招生、评价优或良时，连接本城设施维护费−10%。',
    '<b>解锁</b>：动车 第25天＋送达60人；高铁 第65天＋250人＋3座小城；飞机 第120天＋600人。'])}
<p class="ux-foot"><a href="updates/index.html">完整更新说明</a></p>`);
};

/* ---------- line building: no type dialog, inline quote, one-tap build ---------- */
chooseType = function () {
  if (draft) return;
  const free = uxTypes().filter(t => S.unlocked.includes(t) && uxFreeSlots(t) > 0);
  if (!free.length) return toast('线路名额已满：撤销一条线路，或等待解锁新的交通方式');
  beginDraft(free.includes(uxLastType) ? uxLastType : free[0]);
};
function uxSetType(t) {
  if (!draft || draft.original || !S.unlocked.includes(t) || uxFreeSlots(t) <= 0) return;
  draft.type = t; uxLastType = t;
  draft.name = TYPES[t].name + (S.lines.filter(l => l.type === t).length + 1) + '线';
  haptic(); draftBar();
}
function uxUndoStop() {
  if (!draft || draft.original || !draft.stops.length) return;
  draft.stops.pop(); haptic(); draftBar();
}
const uxDraftBar = draftBar;
draftBar = function () {
  uxDraftBar();
  const bar = uxEl('drawbar'), types = uxEl('db-types'), cost = uxEl('db-cost'), undo = uxEl('drawundo'), done = uxEl('drawdone');
  if (!bar) return;
  if (bridgeDraft || !draft) { uxResetDrawExtras(); return; }
  bar.classList.add('db-line');
  const c = draftCost(), isNew = !draft.original;
  const open = uxTypes().filter(t => S.unlocked.includes(t));
  types.hidden = !isNew || open.length < 2;
  if (!types.hidden) types.innerHTML = open.map(t => {
    const free = uxFreeSlots(t);
    return `<button class="${t === draft.type ? 'on' : ''}" ${free <= 0 ? 'disabled' : ''} onclick="uxSetType('${t}')">${TYPES[t].name}<small>${free <= 0 ? '已满' : '余' + free}</small></button>`;
  }).join('');
  const names = draft.stops.filter(id => S.cities[id] && S.cities[id].kind !== 'bridgehead').map(id => escapeHTML(S.cities[id].name));
  uxEl('drawtext').innerHTML = !names.length ? `<b>${escapeHTML(draft.name)}</b> · 从一座城市拖到另一座`
    : names.length === 1 ? `<b>${names[0]}</b> → 继续拖到下一座城市`
    : names.join(' <i>→</i> ');
  undo.hidden = !(isNew && draft.stops.length > 0);
  cost.hidden = draft.stops.length < 2;
  if (!cost.hidden) {
    const line = c.cash - c.works - c.vehicle, parts = [];
    if (c.invalid) parts.push(`<span class="bad">${escapeHTML(c.invalid)}</span>`);
    else {
      parts.push(`<span>线路 ¥${line}</span>`);
      if (c.works || c.bridge || c.tunnel) parts.push(`<span>桥隧 ¥${c.works}${c.tunnel ? ' · 隧' + c.tunnel : ''}${c.bridge ? ' · 桥' + c.bridge : ''}</span>`);
      if (c.reused) parts.push(`<span>复用桥 ×${c.reused}</span>`);
      if (c.vehicle) parts.push(`<span>首辆${TYPES[draft.type].name} ¥${c.vehicle}</span>`);
      else if (isNew) parts.push(`<span>用库存车辆</span>`);
      parts.push(c.cash > S.points ? `<span class="bad">资金不足 · 差 ${money(c.cash - S.points)}</span>` : `<span class="muted">建成后余 ${money(S.points - c.cash)}</span>`);
    }
    cost.innerHTML = parts.join('');
  }
  for (const e of [cost, uxEl('drawtext')]) if (e && /运营中心|工程采购|交通采购|收支账本/.test(e.innerHTML)) e.innerHTML = uxRename(e.innerHTML);
  done.textContent = draft.stops.length < 2 ? '建设' : c.cash ? '建设 ¥' + c.cash : isNew ? '建设' : '应用修改';
};
uxEl('drawundo').onclick = uxUndoStop;
// Build straight from the bar: the price is on the button, so no second confirmation dialog.
uxEl('drawdone').onclick = () => bridgeDraft ? createBridge() : commitDraft(true);
const uxCommit = commitDraft;
commitDraft = function (skip = false) {
  const type = draft && !draft.original ? draft.type : null;
  uxCommit(skip);
  if (type && !draft) { uxLastType = type; haptic(15); }
};
const uxToast = toast;
toast = function (t) {
  t = String(t).replace('点击查看报价后确认建设', '核对底栏报价后点「建设」').replace('；查看报价确认建设', '，然后点底栏「建设」');
  if (uxCoachActive() && /拖到|线路已规划|报价后|核对底栏/.test(t)) return;   // the coach already says this
  uxToast(uxRename(t));
  uxPlaceToast();
};
// Where a message floats. Portrait: just above whatever sheet is at the bottom (thumb zone). Landscape / desktop: the
// stylesheet's place (top of the map on short screens, above the dock otherwise).
// Either way it must not land on the selection: the selection is framed in the free map, so one of its stations often
// sits right where the toast goes. Candidate spots — the usual row, then the other end of the map (under the top status
// column; only the strip under the header when a portrait sheet is fully open), each centred / left / right of the
// free map — are tried in order, and the toast takes the first that leaves every visible station or ＋ tab of the
// selection clear, node included. A long message that fits nowhere in the map (a reward or a lost-life warning beside
// a full portrait sheet) goes over the bottom of the sheet, above the dock, rather than onto the selection.
function uxPlaceToast() {
  const el = uxEl('ux-feedback') || uxEl('toast'); if (!el) return;
  el.style.top = el.style.bottom = el.style.left = '';
  const vis = id => { const e = uxEl(id), r = e && !e.hidden && (typeof getComputedStyle !== 'function' || getComputedStyle(e).display !== 'none') && e.getBoundingClientRect?.(); return r && r.height ? r : null; };
  const headB = document.querySelector('header')?.getBoundingClientRect().bottom || 60, dockT = document.querySelector('footer .dock')?.getBoundingClientRect().top || H;
  const st = document.querySelector('.top-stack'), sr = st?.getBoundingClientRect && (typeof getComputedStyle !== 'function' || getComputedStyle(st).visibility !== 'hidden') ? st.getBoundingClientRect() : null;
  const upper = Math.max(headB + 8, sr && sr.height ? sr.bottom + 8 : 0);
  const w = el.offsetWidth || 200, h = el.offsetHeight || 36;
  const atTop = y => () => { el.style.bottom = 'auto'; el.style.top = y + 'px'; }, atBottom = b => () => { el.style.top = 'auto'; el.style.bottom = (H - b) + 'px'; };
  let mapL = 0, mapR = W, mapB, rows, sheetSpot = null;
  if (portraitMode) {
    let top = H;
    for (const sel of ['#ux-coach', '#junction-picker', '#details', '#routes', '#drawbar', 'footer .dock']) {
      const e = document.querySelector(sel);
      if (!e || e.hidden || typeof getComputedStyle !== 'function' || getComputedStyle(e).display === 'none') continue;
      const r = e.getBoundingClientRect(); if (r.height && r.top > H * 0.35) top = Math.min(top, r.top);
    }
    // a sheet that fills most of the screen leaves only a strip of map under the header
    const tallTop = Math.min(...['details', 'junction-picker'].map(id => { const r = vis(id); return r && r.top < H * .35 ? r.top : Infinity; }));
    mapB = tallTop < Infinity ? tallTop : top;
    rows = tallTop < Infinity ? [[upper, atTop(upper)], ...(tallTop - 10 - h > upper + h ? [[tallTop - 10 - h, atTop(tallTop - 10 - h)]] : [])]
      : [[top - 10 - h, atBottom(top - 10)], [upper, atTop(upper)]];
    // over the bottom of a details / picker sheet as a last resort — never over the network tray, whose chips are controls
    if (mapB < dockT - 10 - h && vis('details')) sheetSpot = { key: 'sheet', x: W / 2, y: dockT - 10 - h, place: atBottom(dockT - 10) };
  } else {
    // side panels (details, line picker, route list) take the right or left of the map
    for (const id of ['details', 'junction-picker']) { const r = vis(id); if (r && r.left > W / 2) mapR = Math.min(mapR, r.left); }
    const rl = vis('routes'); if (rl && rl.right < W / 2 && rl.top < H / 2) mapL = Math.max(mapL, rl.right);
    mapB = dockT;
    const r0 = el.getBoundingClientRect?.() || { top: H - 80 }, home = r0.top < H / 2;
    rows = home ? [[r0.top, atTop(r0.top)], [dockT - 10 - h, atBottom(dockT - 10)]] : [[r0.top, atTop(r0.top)], [upper, atTop(upper)]];
  }
  const pts = uxSelectionPoints().map(p => { const q = toScreen(p); q.r = S.cities.includes(p) ? uxNodePx(p) + 4 : 13; return q; })
    .filter(q => q.y + q.r > headB && q.y - q.r < mapB && q.x - q.r < mapR && q.x + q.r > mapL);   // under a panel it is hidden anyway
  // …and of every town on screen: the capsule can stay up for the 20 s undo window, it must not sit on a town
  for (const c of realCities()) { if (c.dormant && !c.discovered) continue; const q = toScreen(c); if (q.x < -20 || q.x > W + 20 || q.y < headB - 20 || q.y > mapB + 20) continue; q.r = uxNodePx(c) + 4; pts.push(q); }
  // …and of the notices at the top (status column)
  for (const n of document.querySelectorAll('.top-stack > :not([hidden])')) { const r = n.getBoundingClientRect(); if (r.width && r.height) for (let x = r.left + r.height / 2; x < r.right; x += r.height) pts.push({ x, y: r.top + r.height / 2, r: r.height / 2 }); }
  for (const p of document.querySelectorAll('.ux-edge-pill:not([hidden])')) { const r = p.getBoundingClientRect(); if (r.width) pts.push({ x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.max(r.width, r.height) / 2 }); }
  // centred in the free map first; a line running down the middle pushes it to one side
  const mid = (mapL + mapR) / 2, xs = [W / 2, mid, mapL + 16 + w / 2, mapR - 16 - w / 2].filter((x, i, a) => x - w / 2 >= mapL + 8 - (i ? 0 : 1e9) && x + w / 2 <= mapR - 8 + (i ? 0 : 1e9) && a.indexOf(x) === i);
  const spots = [];
  for (const [y, place] of rows)
    for (const x of xs) spots.push({ key: spots.length, x, y, place: () => { place(); el.style.left = x === W / 2 ? '' : x + 'px'; } });
  if (sheetSpot) spots.push(sheetSpot);
  const cover = (s, m) => pts.filter(p => p.x + p.r > s.x - w / 2 - m && p.x - p.r < s.x + w / 2 + m && p.y + p.r > s.y - m && p.y - p.r < s.y + h + m).length;
  // while one toast shows, it stays where it is as long as that spot is still clear (no hopping while the camera glides)
  // 'same toast' = same message over the same layout (the undo countdown ticks every second and is ignored)
  const txt = (uxEl('toast')?.textContent || '') + '|' + Math.round(mapB) + '|' + Math.round(mapR);
  const shown = el.classList.contains('show') && el.uxText === txt ? spots.find(s => s.key === el.uxSpot && !cover(s, 2)) : null;
  // …unless the preferred place (first spot) has come free meanwhile — e.g. the camera finished framing the selection:
  // then it returns there once
  if (shown && shown !== spots[0] && !cover(spots[0], 12)) { spots[0].place(); el.uxSpot = spots[0].key; el.uxText = txt; return; }
  const pick = shown || spots.find(s => !cover(s, 12)) || spots.find(s => !cover(s, 2)) || spots.reduce((a, s) => cover(s, 2) < cover(a, 2) ? s : a);
  pick.place(); el.uxSpot = pick.key; el.uxText = txt;
}
const uxStopUndo = offerStopUndo;
offerStopUndo = function (...args) { uxStopUndo(...args); uxPlaceToast(); };
const uxAddDraftCity = addDraftCity;
addDraftCity = function (c) { const n = draft?.stops.length; uxAddDraftCity(c); if (draft && draft.stops.length > n) haptic(); };
const uxPop = popStation;
popStation = function (c, color) { uxPop(c, color); haptic(); };

/* ---------- line sheet ---------- */
function uxFleetPlus(id) {
  const l = S.lines.find(x => x.id === id); if (!l || l.retiring) return;
  if (S.inventory[l.type] > 0) addVehicle(id); else buyAndAdd(id);
  haptic(); updateUI();
}
function uxFleetMinus(id) {
  const vs = S.vehicles.filter(v => v.line === id && !v.recall); if (!vs.length) return;
  const v = vs.find(v => !v.people.length) || vs[vs.length - 1];
  removeVehicle(v.id); haptic(); showDetails(); updateUI();
}
function uxLineSheet(rebuild) {
  const el = uxEl('details'), l = S.lines.find(x => x.id === selected.id);
  if (!l) { selected = null; el.hidden = true; return; }
  if (el.contains(document.activeElement) && document.activeElement.tagName === 'INPUT') return;
  const vs = S.vehicles.filter(v => v.line === l.id), T = TYPES[l.type], inv = S.inventory[l.type];
  const seats = vs.reduce((n, v) => n + vehCap(v), 0), load = vs.reduce((n, v) => n + v.people.length, 0);
  const blocked = l.stops.some((id, i) => i && S.blockages[key(S.cities[l.stops[i - 1]], S.cities[id], l.type)]);
  const stops = l.stops.filter(id => S.cities[id] && !S.cities[id].removed && S.cities[id].kind !== 'bridgehead');
  const pick = uxStopPickFor(l.id);
  const sig = JSON.stringify([l.id, l.name, l.color, l.stops, l.retiring, inv, S.points >= T.vehicle, blocked, pick ? [...pick.marked] : null,
    vs.map(v => [v.id, v.cars, v.people.length, uxServiceLabel(v), isTrain(v.type) && v.cars < 8 && S.points >= carPrice(v)])]);
  if (!rebuild && sig === uxLineSheet.sig && !el.hidden) return;
  uxLineSheet.sig = sig; el.hidden = false;
  const canAdd = !l.retiring && (inv > 0 || S.points >= T.vehicle);
  el.innerHTML = `<div class="ux-sheet-head"><i class="ux-swatch" style="background:${l.color}"></i>
<div class="ux-title"><h3>${escapeHTML(l.name)}</h3><small>${T.name} · ${stops.length} 站${l.retiring ? ' · 撤出中' : ''}</small></div>
<button class="ux-icon" onclick="renameLine(${l.id})" title="名称 / 颜色" aria-label="修改名称或颜色">✎</button><button class="close" onclick="clearSelection()" aria-label="关闭">×</button></div>
${blocked ? '<p class="ux-alert">部分路段停止接入，两侧车辆分段运行。拉线时可支付维修费，或重新接桥改线。</p>' : ''}
${!vs.length && !l.retiring ? '<p class="ux-alert">还没有车辆，乘客不会使用这条线路。点「＋」加一辆。</p>' : ''}
<div class="ux-fleet ux-fleet-row" style="--lc:${l.color}"><div class="ux-fleet-txt"><small class="ux-fleet-kind">车辆</small><b class="ux-fleet-n">${vs.length}<span> 辆</span></b><span>载客 <b>${load}</b>/${seats}${seats ? ' · ' + Math.round(load / seats * 100) + '%' : ''}</span><span class="ux-bar"><i style="width:${seats ? Math.min(100, load / seats * 100) : 0}%"></i></span></div>
<div class="ux-stepper"><button onclick="uxFleetMinus(${l.id})" ${!vs.some(v => !v.recall) ? 'disabled' : ''} aria-label="回收一辆">−</button><button class="primary" onclick="uxFleetPlus(${l.id})" ${canAdd ? '' : 'disabled'}>＋ ${inv > 0 ? '库存 ' + inv : '¥' + T.vehicle}</button></div></div>
<div class="ux-route${pick ? ' is-picking' : ''}" style="--lc:${l.color}">${stops.map((id, k) => `<span class="ux-hop">${k ? '<i></i>' : ''}${pick ? `<button class="ux-stop${pick.marked.has(id) ? ' is-off' : ''}" onclick="uxStopMark(${l.id},${id})" aria-pressed="${pick.marked.has(id)}">${escapeHTML(S.cities[id].name)}</button>` : `<span class="ux-stop">${escapeHTML(S.cities[id].name)}${stops.length > 2 && !l.retiring ? `<button onclick="prepareRemoveStop(${l.id},${id})" aria-label="移除${escapeHTML(S.cities[id].name)}这一站">×</button>` : ''}</span>`}</span>`).join('')}${l.retiring || pick ? '' : `<span class="ux-route-tools"><button onclick="uxStopPickToggle(${l.id})" ${stops.length > 2 ? '' : 'disabled'}>多站移除</button><button onclick="uxRedraw(${l.id})">重画</button></span>`}</div>
${!l.retiring && pick ? `<div class="ux-route-tools is-picking"><span>点选要去掉的站 · 已选 ${pick.marked.size}</span><button onclick="uxStopPickToggle(${l.id})">取消</button><button class="primary" onclick="uxStopPickApply(${l.id})" ${pick.marked.size ? '' : 'disabled'}>预览移除 ${pick.marked.size || ''} 站</button></div>` : ''}

${vs.length ? `<div class="ux-list">${vs.map(v => `<div class="ux-row"><span><b>#${v.id}</b> ${uxServiceLabel(v)}<small>${vs.length > 1 ? v.people.length + '/' + vehCap(v) + ' 人' : ''}${v.people.length >= vehCap(v) ? ' · <em class="danger">满员</em>' : ''}${isTrain(v.type) ? ' · ' + v.cars + '/8 节' : ''}</small></span><span class="ux-row-actions">${isTrain(v.type) && v.cars < 8 ? `<button onclick="upgradeCar(${v.id})" ${S.points < carPrice(v) ? 'disabled' : ''}>＋车厢 ¥${carPrice(v)}</button>` : ''}<button onclick="setService(${v.id})">方案</button></span></div>`).join('')}</div>` : ''}
<div class="ux-actions-row">${l.type !== 'air' ? `<button onclick="openInfrastructure(${l.id})">道路升级</button>` : ''}<button class="ux-danger" onclick="uxDeleteLine(${l.id})">${uxArmedDelete?.id === l.id && uxArmedDelete.until > performance.now() ? '再点一次确认撤销' : '取消线路'}</button></div>`;
}
// Re-routing a whole line (user 2026-11-15: 大改线路). Both tools only open an edit draft of the line; the quote in the
// route bar and 应用修改 commit it, as for any drag edit, and 取消 leaves the line as it was.
// - 多站移除: mark several stops in the sheet, then preview the line without them (one quote, one apply);
// - 整条重画: the line keeps its id, colour, vehicles and number; its route is drawn again from scratch (the old route
//   stays on the map as a pale band, see uxDraftGhost).
// Note: game-owned selection — .agents/notes/implemented/feature/2026-11-08-design-pass.md
let uxStopPick = null;   // { game, line, marked: Set(city id) }; IDs are reused after reset/load
function uxStopPickFor(lineId) {
  if (uxStopPick && (uxStopPick.game !== S || uxStopPick.line !== lineId)) uxStopPick = null;
  return uxStopPick;
}
function uxStopPickToggle(lineId) { uxStopPick = uxStopPickFor(lineId) ? null : { game: S, line: lineId, marked: new Set() }; haptic(); showDetails(true); }
function uxStopMark(lineId, cityId) { const pick = uxStopPickFor(lineId); if (!pick) return; const m = pick.marked; m.has(cityId) ? m.delete(cityId) : m.add(cityId); haptic(); showDetails(true); }
function uxStopPickApply(lineId) {
  const l = S.lines.find(x => x.id === lineId), pick = uxStopPickFor(lineId); if (!l || l.retiring || !pick?.marked.size) return;
  const keep = l.stops.filter(id => S.cities[id] && !pick.marked.has(id));
  // Keep the player's chosen crossings between surviving cities; never leave bridgeheads as terminals.
  while (keep.length && S.cities[keep[0]].kind === 'bridgehead') keep.shift();
  while (keep.length && S.cities[keep.at(-1)].kind === 'bridgehead') keep.pop();
  if (keep.filter(id => S.cities[id] && S.cities[id].kind !== 'bridgehead').length < 2) return toast('一条线路至少连接两座城市；整条撤销请用「取消线路」');
  uxStopPick = null; beginDraft(l.type, l.id); draft.stops = keep; draftBar(); updateUI();
}
function uxRedraw(lineId) {
  const l = S.lines.find(x => x.id === lineId); if (!l || l.retiring) return;
  uxStopPick = null; beginDraft(l.type, l.id); draft.stops = []; draft.uxRedraw = true; draftBar(); updateUI();
  toast(typeof isMarine16 === 'function' && isMarine16(l.type) ? '从港口圆点拖出新的航线 · 可连续连接多个港口' : '从一座城市拖出新的走向 · 原走向留作参照');
}
// Cancellation opens an itemised recovery quote before any assets are retired.
let uxArmedDelete = null;
function uxDeleteLine(id) { showLineCancellation(id); }

const uxShowDetails = showDetails;
showDetails = function (rebuild = true) {
  if (selected?.type === 'line') return uxLineSheet(rebuild);
  uxLineSheet.sig = null;
  const r = uxShowDetails(rebuild);
  try { uxTidyCitySheet(); } catch {}
  return r;
};

/* ---------- city sheet: numbers, goal, demand, facilities — no paragraphs ---------- */
// Four script layers append to the city sheet. Instead of re-implementing them, re-arrange what they render:
// waiting destinations become a row of chips, and every facility entry (weather station, hub, school/service,
// repair centre, finance…) becomes one tile in an icon grid that says what it is for and what it costs.
// Buttons keep their own onclick and disabled state, so upstream rules stay authoritative.
const UX_FACILITIES = [
  { on: /^buildMeteo|^previewMeteo/, name: '气象站', why: '范围内雨雾减速减半', icon: '<path d="M7 17h10a4 4 0 0 0 0-8 5 5 0 0 0-9.6-1.5A3.5 3.5 0 0 0 7 17z"/>' },
  { on: /^buildHub/, name: '交通枢纽', why: '候车容量翻倍，换乘更快', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 3v5M12 16v5M3 12h5M16 12h5"/>' },
  { on: /^showCityEconomy/, name: '服务与学校', why: '评价好可建学校，学生带来票款', icon: '<path d="M3 9l9-5 9 5-9 5-9-5z"/><path d="M7 11v5c3 2 7 2 10 0v-5"/>' },
  { on: /^buildRepairCenter|^previewRepairCenter/, name: '检修中心', why: '附近施工与抢修工期最多−10%', icon: '<path d="M14 6a4 4 0 0 0-5 5l-5 5 3 3 5-5a4 4 0 0 0 5-5l-2 2-3-3 2-2z"/>' },
  { on: /^buildFinance|^showFinanceConstruction|^openStockMarket|^showFinancialMarket/, name: '金融设施', why: '银行理财、证券交易', icon: '<path d="M3 20h18M5 16v-5M10 16V8M15 16V5M20 16v-8"/>' },
];
// "本圈 · 起始城市圈 · ◆ 紫色商业金融  50  212s" → the region becomes a group heading once; each row is
// [destination] ……… [people] [longest wait], largest group first, so counts line up and can be compared.
function uxWaitList(el, rows) {
  const items = rows.map(b => {
    const [who, meta] = [b.children[0], b.children[1]], t = meta?.textContent || '';
    const label = (who?.textContent || '').trim(), parts = label.split(' · ');
    const n = +(t.match(/(\d+)\s*人/)?.[1] || 0), wait = +(t.match(/·\s*(\d+)/)?.[1] || 0);
    return { b, color: who?.style.color || '', what: parts.length > 1 ? parts.at(-1) : label, group: parts.length > 1 ? parts.slice(0, -1).join(' · ') : '', n, wait };
  });
  const total = g => items.filter(x => x.group === g).reduce((s, x) => s + x.n, 0);
  const groups = [...new Set(items.map(x => x.group))].sort((a, b) => (/^本圈/.test(b) - /^本圈/.test(a)) || total(b) - total(a));
  const box = document.createElement('section'); box.className = 'ux-wait';
  const all = items.reduce((s, x) => s + x.n, 0);
  box.innerHTML = '<div class="ux-wait-head"><span>等车去</span><small>' + all + ' 人 · ' + items.length + ' 个去向</small></div>';
  rows[0].before(box);
  for (const g of groups) {
    if (g && (groups.length > 1 || !/^本圈/.test(g))) { const h = document.createElement('div'); h.className = 'ux-wait-group'; h.innerHTML = escapeHTML(g) + '<small>' + total(g) + ' 人</small>'; box.appendChild(h); }
    for (const x of items.filter(i => i.group === g).sort((a, b) => b.n - a.n || b.wait - a.wait)) {
      x.b.className = 'ux-wait-row' + (x.wait > 120 ? ' is-late' : '');
      // tile: count large, the destination (shape + colour, as on the map) under it, the longest wait only when it matters
      const m = x.what.match(/^([■◆●▲])\s*(.*)$/), glyph = m ? m[1] : '', name = m ? m[2] : x.what;
      x.b.innerHTML = '<b>' + x.n + '</b><span style="color:' + x.color + '"><i>' + glyph + '</i>' + escapeHTML(name) + '</span>' + (x.wait > 60 ? '<small>' + x.wait + 's</small>' : '');
      box.appendChild(x.b);
    }
  }
  for (const p of el.querySelectorAll(':scope > p.detail-sub')) if (/候车目的地/.test(p.textContent)) p.remove();
  // what is waiting comes before the city's long-term mission: it is what the player opened the city for
  const mission = el.querySelector(':scope > .city-mission'); if (mission && mission.compareDocumentPosition(box) & 4) mission.before(box);
}
// The two numbers at the top are different things: people waiting vs. capacity, and how long the hall has been full.
// Say so, and say what happens at the limit (management.js: pressure grows only while waiting ≥ capacity).
function uxLoadBlock(el) {
  const g = el.querySelector(':scope > .metric-grid'); if (!g || el.querySelector('.ux-load')) return;
  const c = S.cities[selected.id]; if (!c || typeof capacity !== 'function') return;
  const n = c.q.filter(p => !p.cardId && !p.eventId).length, cap = capacity(c), limit = c.shape === 1 ? 205 : 160;
  const p = Math.max(0, c.congestionPressure || 0), full = n >= cap, special = c.q.length - n;
  const ended = S.lives <= 0, lost = ended && S.uxLifeLog?.at(-1)?.id === c.id;
  const state = ended ? [lost ? '本局失守' : '本局已结束', lost ? 'is-over' : 'is-calm'] : c.shield > 0 ? ['保护中 ' + Math.ceil(c.shield) + 's', 'is-calm'] : full ? ['超出 ' + (n - cap), 'is-over'] : n >= cap * .8 ? ['接近满员', 'is-near'] : ['未满', 'is-calm'];
  const box = document.createElement('section'); box.className = 'ux-load';
  box.innerHTML = '<div class="ux-load-main"><b>' + n + '</b><span>人候车 · 容量 ' + cap + (special ? ' · 另有活动乘客 ' + special : '') + '</span><em class="' + state[1] + '">' + state[0] + '</em></div>'
    + (ended ? '' : '<div class="ux-load-press"><span class="ux-bar' + (full ? ' is-over' : '') + '"><i style="width:' + Math.min(100, p / limit * 100) + '%"></i></span><small>' + (!full && p > 0 ? '满员计时回落中 ' : '满员计时 ') + Math.floor(p) + '/' + Math.round(limit) + ' 秒 · 计满扣一条命</small></div>');
  g.replaceWith(box);
  const bar = box.nextElementSibling; if (bar?.classList?.contains('bar')) bar.remove();
}
function uxTidyCitySheet() {
  const el = uxEl('details');
  if (!el || el.hidden || !selected || !['city', 'stop'].includes(selected.type) || el.querySelector('.ux-fac')) return;
  // demand: chips instead of a captioned list
  const rows = [...el.querySelectorAll(':scope > .destination-row')];
  if (rows.length) uxWaitList(el, rows);
  uxLoadBlock(el);
  // facilities: every known entry button becomes a tile
  const tiles = [];
  for (const b of [...el.querySelectorAll('button[onclick]')]) {
    const call = b.getAttribute('onclick') || '', f = UX_FACILITIES.find(x => x.on.test(call));
    if (!f || b.closest('.ux-fac')) continue;
    const host = b.closest('.city-mission, .detail-actions');
    const label = b.textContent.replace(/\s+/g, ' ').trim(), price = label.match(/¥[\d,]+/)?.[0] || '';
    const state = f.name === '服务与学校' ? (host?.querySelector('b')?.textContent.split('·')[1]?.trim() || '') : (label.match(/\d+\/\d+/)?.[0] || (/已建|覆盖|查看/.test(label) ? '已建' : ''));
    const tile = document.createElement('button');
    tile.className = 'ux-fac-tile'; tile.setAttribute('onclick', call); tile.disabled = b.disabled; tile.title = label;
    tile.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${f.icon}</svg><span><b>${f.name}</b><small>${f.why}</small></span><em>${price || state || '›'}</em>`;
    tiles.push(tile);
    b.remove();
    if (host && !host.querySelector('button')) host.remove();
  }
  if (tiles.length) {
    const grid = document.createElement('div'); grid.className = 'ux-fac';
    grid.innerHTML = '<div class="ux-list-title">城市设施</div>';
    tiles.forEach(t => grid.appendChild(t));
    el.appendChild(grid);
    const strip = document.createElement('div'); strip.className = 'ux-fac-strip';
    strip.innerHTML = '<span>设施</span>' + tiles.map((t, i) => '<button data-i="' + i + '" title="' + escapeHTML(t.title || '') + '"' + (t.disabled ? ' class="is-off"' : '') + '><svg viewBox="0 0 24 24" aria-hidden="true">' + (t.querySelector('svg')?.innerHTML || '') + '</svg><small>' + escapeHTML(t.querySelector('b')?.textContent || '') + '</small></button>').join('');
    strip.onclick = e => {
      const b = e.target.closest('button[data-i]'); if (!b) return;
      uxSheetSet('full');
      const t = grid.querySelectorAll('.ux-fac-tile')[+b.dataset.i];
      setTimeout(() => { t?.scrollIntoView?.({ block: 'center', behavior: 'smooth' }); t?.classList.add('is-flash'); setTimeout(() => t?.classList.remove('is-flash'), 1400); }, 260);
    };
    (el.querySelector('.ux-load') || el.querySelector('.detail-sub'))?.after(strip);
  }
  for (const n of el.querySelectorAll(':scope > .detail-actions')) if (!n.querySelector('button')) n.remove();
}

/* ---------- tasks ---------- */
// The city's own map glyph (shape + colour) so the list matches what the player sees on the map.
function uxCityGlyph(c) {
  const col = (typeof COLORS !== 'undefined' && COLORS[c.color]) || '#8a9a90', sh = c.shape;
  const g = sh === 0 ? '<circle cx="12" cy="12" r="6"/>' : sh === 1 ? '<path d="M12 5.5 18.5 17h-13z"/>' : sh === 2 ? '<path d="M12 4.5 19 12l-7 7.5L5 12z"/>' : '<rect x="6.5" y="6.5" width="11" height="11" rx="1"/>';
  return `<span class="ux-glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="#fff" stroke="#334b4e" stroke-width="2"/><g fill="${col}">${g}</g></svg></span>`;
}
function uxMissionDetail(c, spec) {
  const m = c.mission;
  if (spec.mode === 'dual') return `出发 ${m.out || 0}/12 · 到达 ${m.in || 0}/12`;
  if (spec.mode === 'streak') return `连续 ${m.streak || 0}/${spec.goal} 天 · 今日 ${m.dayTrips || 0}/${m.step === 5 ? 2 : 1} 人`;
  if (spec.mode === 'window') return `${m.records.filter(x => x.day > S.day - 12).length}/${spec.goal} 人 · 合格 ${Math.round(m.records.length ? m.records.filter(x => x.good).length / m.records.length * 100 : 0)}%`;
  return `${m.progress}/${spec.goal} ${spec.mode === 'reach' ? '类别' : '人'}`;
}
showTasks = function () {
  const cs = realCities().slice().sort((a, b) => (a.dormant - b.dormant) || ((missionSpec(b) ? 1 : 0) - (missionSpec(a) ? 1 : 0)) || (b.mission.progress - a.mission.progress));
  const done = S.cities.reduce((n, c) => n + (c.mission?.completed || 0), 0);
  openModal(`<div class="modal-head"><div><h2>城市任务</h2><small>已完成 ${done} 项 · 点城市在地图上定位</small></div><button class="close" onclick="closeModal()">×</button></div>
<div class="ux-tasks">${cs.map(c => {
    const spec = c.dormant ? null : missionSpec(c), pct = spec ? Math.min(100, c.mission.progress / spec.goal * 100) : 0;
    const tag = c.dormant ? '待接入' : spec ? escapeHTML(spec.title || spec.verb || '') : '已完成';
    return `<button class="ux-task${c.dormant ? ' is-dormant' : ''}" onclick="uxFocusCity(${c.id})">${uxCityGlyph(c)}
<span class="ux-task-main"><span class="ux-task-top"><b>${escapeHTML(c.name)}</b><span class="ux-task-title">${tag}</span>${spec ? `<em>+¥${spec.reward + (spec.upgrade ? 600 * (+S.moneyScale || 1) / 10 : 0)}</em>` : ''}</span>
${spec ? `<span class="ux-task-bar"><span class="ux-bar"><i style="width:${pct}%"></i></span><small>${uxMissionDetail(c, spec)}</small></span>` : ''}</span></button>`;
  }).join('')}</div>`);
};
openCity = function (id) { uxFocusCity(id); };

/* ---------- shop ---------- */
shop = function () {
  openModal(`<div class="modal-head"><div><h2>交通采购</h2><small>余额 ${money(S.points)} · 新车进入库存，在线路详情点「＋」派车</small></div><button class="close" onclick="closeModal()">×</button></div>
${(() => {
    // what can be bought now, specs on one line; what is still locked in its own short list: name, condition, price
    const all = uxTypes(), open = all.filter(t => S.unlocked.includes(t)), shut = all.filter(t => !S.unlocked.includes(t));
    const spec = t => { const T = TYPES[t]; return (isTrain(t) ? '2–8 节' : T.cap + ' 人') + ' · 票价 ×' + (T.fare ?? 1) + ' · 库存 ' + S.inventory[t]; };
    let h = '<div class="ux-list">' + open.map(t => { const T = TYPES[t];
      return `<div class="ux-product">${transportIcon(t)}<div><b>${T.name}</b><small>${spec(t)}</small></div><button class="primary" onclick="purchase('v-${t}')" ${S.points < T.vehicle ? 'disabled' : ''}>¥${T.vehicle}</button></div>`; }).join('') + '</div>';
    if (shut.length) h += '<div class="ux-locked-title">待解锁</div><div class="ux-locked">' + shut.map(t => { const T = TYPES[t];
      return `<div class="ux-product is-locked">${transportIcon(t)}<div><b>${T.name}<em>¥${T.vehicle}</em></b><small class="ux-lock">${unlockText(t)}</small></div></div>`; }).join('') + '</div>';
    return h;
  })()}
${shopTrainCarsHTML()}
<div class="ux-links"><button onclick="showEngineering()"><span>工程</span><small>桥梁 · 道路升级 · 气象站 · 枢纽 · 检修中心</small><i>›</i></button><button onclick="showFinance()"><span>收支账本</span><small>收入、支出与月底维护</small><i>›</i></button></div>`);
};

/* ---------- dock & camera on touch ---------- */
uxEl('dock-tasks').onclick = () => showTasks();
// game.js bound these by reference before this layer loaded.
uxEl('tasks').onclick = () => showTasks();
uxEl('newroute').onclick = () => chooseType();
// Clear the line-only parts of the bar (types, quote, undo) whenever a line draft ends or a bridge draft starts,
// so the bridge bar never shows a stale route quote.
function uxResetDrawExtras() {
  const bar = uxEl('drawbar'); if (!bar) return;
  bar.classList.remove('db-line');
  for (const id of ['db-types', 'db-cost']) { const e = uxEl(id); if (e) { e.hidden = true; e.innerHTML = ''; } }
  const undo = uxEl('drawundo'); if (undo) undo.hidden = true;
}
const uxCancelDraft = cancelDraft;
cancelDraft = function (...args) { uxCancelDraft(...args); uxResetDrawExtras(); };
const uxBeginBridge = beginBridge;
beginBridge = function (...args) { uxBeginBridge(...args); uxResetDrawExtras(); };
const uxBridgeBar = updateBridgeBar;
updateBridgeBar = function () { uxResetDrawExtras(); uxBridgeBar(); };
// While drawing near a screen edge, scroll the map so far cities stay reachable on a phone.
(function edgeScroll() {
  let ptr = null;
  cv.addEventListener('pointermove', e => { ptr = { pointerId: e.pointerId, clientX: e.clientX, clientY: e.clientY }; }, { passive: true, capture: true });
  for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, () => { ptr = null; }, { passive: true, capture: true });
  function step() {
    try {
      const extending = ptr && uxExt && ptr.pointerId === uxExt.id;
      // Only after the finger has travelled: grabbing a tab or city that already sits near an edge must not scroll the map.
      const start = extending ? { x: uxExt.x0, y: uxExt.y0 } : gesture?.start, travelled = !ptr || !start || Math.hypot(ptr.clientX - start.x, ptr.clientY - start.y) > 24;
      if (travelled && (extending || ptr && gesture && pointers.size === 1 && ['draft', 'city-edit', 'elastic'].includes(gesture.kind))) {
        const top = (document.querySelector('header')?.getBoundingClientRect().bottom || 60) + 8;
        const bar = uxEl('drawbar'), bottom = bar && !bar.hidden ? bar.getBoundingClientRect().top - 8 : H - 8;
        const edge = 44, push = d => 7 * Math.min(1, d / edge);
        let dx = 0, dy = 0;
        if (ptr.clientX < edge) dx = push(edge - ptr.clientX); else if (ptr.clientX > W - edge) dx = -push(ptr.clientX - (W - edge));
        if (ptr.clientY < top + edge) dy = push(top + edge - ptr.clientY); else if (ptr.clientY > bottom - edge) dy = -push(ptr.clientY - (bottom - edge));
        if (dx || dy) { view.x += dx; view.y += dy; if (extending) uxExtMove(ptr); else movePointer(ptr); }
      }
    } catch {}
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
})();

/* ---------- line-end handles: grab the end of any line and keep stringing cities ---------- */
// A knob sits just beyond each terminus. Dragging it extends that end; passing more cities chains them,
// sliding back over a city just added takes it off again. Works for lines that share a city, without a picker.
let uxExt = null;
// Browsing is quiet: no extension controls on the map. Selecting a line shows an "extend" tab at each of its ends:
// a short lead in the line colour coming out of the end city, ending in a round tab with a plus. The tab sits a
// fixed distance outside the end city's node on screen; its touch target is 22px in radius (about 44×44 CSS px),
// but a press on the city node itself still belongs to the city. Hidden tabs are never hit-tested.
const UX_TAB_GAP = 30, UX_TAB_R = 10, UX_HANDLE_HIT = 22;
let uxTabSince = { line: null, at: 0 };
function uxHandleFocus() { return selected?.type === 'line' ? selected.id : selected?.type === 'stop' ? selected.line : null; }
function uxNodePx(c) { return radius(c) * view.scale * (globalThis.CITY_GLYPH?.() ?? 1); }
function uxHandles() {
  const out = [];
  if (draft || bridgeDraft || !S?.lines) return out;
  for (const l of S.lines) {
    if (l.retiring || l.stops.length < 2) continue;
    for (const end of ['head', 'tail']) {
      const e = S.cities[end === 'tail' ? l.stops.at(-1) : l.stops[0]], n = S.cities[end === 'tail' ? l.stops.at(-2) : l.stops[1]];
      if (!e || !n) continue;
      // direction of the line's last stretch into the end station (its drawn leg, not the straight chord)
      const path = uxOctPath(n, e, l.type), q = path ? path[1] : n, dx = e.x - q.x, dy = e.y - q.y, len = Math.hypot(dx, dy) || 1, p = uxTabPlace(e, dx / len, dy / len);
      out.push({ line: l, end, city: e, x: e.x + p.ux * p.reach, y: e.y + p.uy * p.reach, ux: p.ux, uy: p.uy });
    }
  }
  return out;
}
// Screen distance from the city centre to the tab. Starts just outside the node and slides further out along the
// line if it would sit on the waiting squares (drawn upright to the node's right, up to two rows).
// Returns the tab's world direction and distance for an end city whose line arrives along (ux, uy).
// The city's name and status lines under the node, as a world-unit box relative to the city centre (baselines r+22 and
// r+35, upright; the text grows when zoomed out — see the text() wrapper).
function uxLabelBox(c) {
  const r = radius(c), f = view.scale < .85 ? Math.min(1.35, .85 / view.scale) : 1;
  const half = Math.max(String(globalThis.CITY_LABEL?.(c, false) ?? c.name).length * 11, 52) * f / 2 + 3;
  return { l: -half, r: half, t: r + 22 - 11 * f, b: r + 35 + 3 * f };
}
function uxTabPlace(c, ux, uy) {
  const s = view.scale, g = globalThis.CITY_GLYPH?.() ?? 1, r = radius(c), base = uxNodePx(c) + UX_TAB_GAP;
  const n = Math.min(c.q?.length || 0, typeof globalThis.QUEUE_SHOWN_FOR === 'function' ? QUEUE_SHOWN_FOR(c) : globalThis.QUEUE_SHOWN || 30);
  const o = toScreen(c), t = toScreen({ x: c.x + ux, y: c.y + uy }), dl = Math.hypot(t.x - o.x, t.y - o.y) || 1, sx = (t.x - o.x) / dl, sy = (t.y - o.y) / dl;
  const rows = Math.ceil(Math.min(Math.max(n, 1), 30) / 6), pad = UX_TAB_R + 4;
  const box = { l: (r + 15) * s * g - pad, r: (r + 15 + 6 * 11) * s * g + pad + 44, t: -r * s * g - pad, b: (-r + rows * 12) * s * g + pad };
  const lb = uxLabelBox(c), lab = { l: lb.l * s - pad, r: lb.r * s + pad, t: lb.t * s - pad, b: lb.b * s + pad };
  const hits = (x, y) => (n && x >= box.l && x <= box.r && y >= box.t && y <= box.b) || (x >= lab.l && x <= lab.r && y >= lab.t && y <= lab.b);
  for (const deg of [0, -40, 40, -80, 80, -120, 120]) {
    const q = deg * Math.PI / 180, dx = sx * Math.cos(q) - sy * Math.sin(q), dy = sx * Math.sin(q) + sy * Math.cos(q);
    if (!hits(dx * base, dy * base)) {
      const w = toWorld({ clientX: o.x + dx * base, clientY: o.y + dy * base }), wx = w.x - c.x, wy = w.y - c.y, wl = Math.hypot(wx, wy) || 1;
      return { ux: wx / wl, uy: wy / wl, reach: base / view.scale };
    }
  }
  return { ux, uy, reach: base / view.scale };
}
// Hit-testing and drawing share this list. Nothing selected → no tabs at all.
function uxVisibleHandles() { const f = uxHandleFocus(); return f === null ? [] : uxHandles().filter(h => h.line.id === f); }
function uxHandleAt(sx, sy) {
  let best = null, d = Infinity;
  for (const h of uxVisibleHandles()) {
    const c = toScreen(h.city);
    if (Math.hypot(c.x - sx, c.y - sy) <= uxNodePx(h.city) + 8) continue;   // the city node keeps its own taps
    const p = toScreen(h), dd = Math.hypot(p.x - sx, p.y - sy);
    if (dd < UX_HANDLE_HIT && dd <= d + 3) { best = h; d = Math.min(d, dd); }
  }
  return best;
}
// Line identity: a short code from the line's name — its number ("3"), with the vehicle type ("巴1", "动1") once a
// network mixes types and numbers repeat; otherwise the first characters. The same code labels the line's ends on
// the map (as on a metro map) and its entry in the collapsed tray, so a colour always comes with a name.
const UX_TYPE_CHAR = { bus: '巴', emu: '动', rail: '铁', air: '航', ship: '船', ferry: '渡' };
function uxLineCode(l) {
  const num = l => (String(l.name).match(/\d+/) || [])[0];
  const n = num(l);
  if (!n) return String(l.name).replace(/线$/, '').slice(0, 2) || '·';
  const clash = S.lines.some(x => x !== l && num(x) === n);
  return clash ? (UX_TYPE_CHAR[l.type] || '') + n : n;
}
// Codes at both ends of every line (one for a loop), just outside the end city along the line, using the same
// placement as the extension tabs (clear of the waiting squares). The selected line shows its ＋ tabs instead.
function uxDrawLineCodes() {
  if (draft || bridgeDraft || !S?.lines?.length || view.scale < .42) return;
  const focus = uxHandleFocus(), k = 1 / view.scale, placed = [];
  for (const h of uxHandles()) {
    if (h.line.id === focus) continue;
    if (h.end === 'tail' && h.line.stops[0] === h.line.stops.at(-1)) continue;
    // clear of the node and (when the line leaves downward) of the city name under it
    const out = (uxNodePx(h.city) + 18 + (h.uy > .55 ? 22 : 0)) * k;
    let x = h.city.x + h.ux * out, y = h.city.y + h.uy * out;
    const code = uxLineCode(h.line), w = (code.length > 1 ? 9 + code.length * 7.5 : 16) * k, hh = 16 * k;
    // never on the city's own name / status lines
    const lb = uxLabelBox(h.city), lab = { l: h.city.x + lb.l, r: h.city.x + lb.r, t: h.city.y + lb.t, b: h.city.y + lb.b };
    const onLabel = () => x + w / 2 + 2 * k > lab.l && x - w / 2 - 2 * k < lab.r && y + hh / 2 + 2 * k > lab.t && y - hh / 2 - 2 * k < lab.b;
    for (let i = 0; i < 16 && onLabel(); i++) { x += h.ux * 5 * k; y += h.uy * 5 * k; }
    for (let i = 0; i < 3 && placed.some(p => Math.hypot(p.x - x, p.y - y) < 18 * k); i++) { x += h.ux * 15 * k; y += h.uy * 15 * k; }
    placed.push({ x, y });
    const dim = typeof LINE_ALPHA === 'function' ? LINE_ALPHA(h.line, focus) : 1;
    ctx.save(); ctx.globalAlpha = Math.max(.25, dim);
    ctx.lineCap = 'round'; ctx.strokeStyle = h.line.color; ctx.lineWidth = 2.4 * k; ctx.setLineDash([]);
    const from = (uxNodePx(h.city) + 2) * k; ctx.beginPath(); ctx.moveTo(h.city.x + h.ux * from, h.city.y + h.uy * from);
    ctx.lineTo(x - h.ux * w * .45, y - h.uy * hh * .45); ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.globalAlpha = Math.max(.25, dim); uprightAround(x, y);
    roundBody(x - w / 2 - 1.5 * k, y - hh / 2 - 1.5 * k, w + 3 * k, hh + 3 * k, (hh + 3 * k) / 2, '#fffef9', '#fffef9', 1);
    roundBody(x - w / 2, y - hh / 2, w, hh, hh / 2, h.line.color, h.line.color, 1);
    { const halo = globalThis.TEXT_HALO; globalThis.TEXT_HALO = null; try { text(code, x, y + 3.6 * k, 10 * k, '#fff'); } finally { globalThis.TEXT_HALO = halo; } }   // white on colour: no light halo
    ctx.restore();
  }
}
// While the line picker is open at a shared station, the lines through that station are the ones being chosen
// between: they stay at full strength, the rest fade (the same treatment as selecting one line).
globalThis.LINE_ALPHA = (l, focus) => {
  if (focus !== null && focus !== undefined) return focus === l.id ? 1 : .2;
  if (selected?.type === 'junction') return l.stops.includes(selected.id) ? 1 : .22;
  if (uxHoverLine !== null && !draft && !selected) return l.id === uxHoverLine ? 1 : .28;
  return 1;
};
if (typeof cv !== 'undefined' && cv.addEventListener) {
  cv.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || e.buttons || draft || modalOpen || selected) { if (uxHoverLine !== null) { uxHoverLine = null; cv.style.cursor = ''; } return; }
    const h = typeof routeHit === 'function' ? routeHit(toWorld(e)) : null, id = h ? h.l.id : null; if (id !== uxHoverLine) { uxHoverLine = id; cv.style.cursor = id !== null ? 'pointer' : ''; } }, { passive: true });
  cv.addEventListener('pointerleave', () => { uxHoverLine = null; cv.style.cursor = ''; });
}
function uxDrawHandles() {
  const focus = uxHandleFocus(); if (focus === null) { uxTabSince.line = null; return; }
  if (uxTabSince.line !== focus) uxTabSince = { line: focus, at: performance.now() };
  const k = 1 / view.scale, age = (performance.now() - uxTabSince.at) / 1400;
  for (const h of uxVisibleHandles()) {
    const col = h.line.color, start = (uxNodePx(h.city) + 3) * k, stop = (UX_TAB_GAP - UX_TAB_R + 1) * k;
    ctx.save(); ctx.lineCap = 'round';
    // lead: the line continues a little past its end city
    ctx.globalAlpha = .9; ctx.strokeStyle = col; ctx.lineWidth = 3.2 * k; ctx.setLineDash([]);
    ctx.beginPath(); ctx.moveTo(h.city.x + h.ux * start, h.city.y + h.uy * start);
    ctx.lineTo(h.city.x + h.ux * (start + stop), h.city.y + h.uy * (start + stop)); ctx.stroke();
    // a brief invitation pulse right after selecting the line
    if (age < 1) { ctx.globalAlpha = .35 * (1 - age); ctx.lineWidth = 2 * k; ctx.beginPath(); ctx.arc(h.x, h.y, (UX_TAB_R + 3 + 10 * age) * k, 0, Math.PI * 2); ctx.stroke(); }
    // tab: white rim, line-coloured disc, white plus
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(h.x, h.y, (UX_TAB_R + 2.5) * k, 0, Math.PI * 2); ctx.fillStyle = '#fffef9'; ctx.fill();
    ctx.beginPath(); ctx.arc(h.x, h.y, UX_TAB_R * k, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.2 * k; ctx.beginPath();
    ctx.moveTo(h.x - 4.5 * k, h.y); ctx.lineTo(h.x + 4.5 * k, h.y); ctx.moveTo(h.x, h.y - 4.5 * k); ctx.lineTo(h.x, h.y + 4.5 * k); ctx.stroke();
    ctx.restore();
  }
}
function uxExtStops() { return uxExt.end === 'tail' ? [...uxExt.base, ...uxExt.added] : [...uxExt.added.slice().reverse(), ...uxExt.base]; }
function uxExtMove(e) {
  if (!uxExt || !draft) return;
  const p = toWorld(e), c = hitCity(p), endId = uxExt.end === 'tail' ? uxExt.base.at(-1) : uxExt.base[0];
  if (c) {
    const i = uxExt.added.indexOf(c.id);
    if (c.id === endId) uxExt.added = [];
    else if (i >= 0) uxExt.added = uxExt.added.slice(0, i + 1);
    else if (!uxExt.base.includes(c.id)) { uxExt.added.push(c.id); popStation(c, draft.color); }
  }
  draft.stops = uxExtStops();
  draft.extensionPointer = { city: uxExt.added.at(-1) ?? endId, p }; draft.pointer = null;
  draftBar();
  uxEl('drawtext').innerHTML = uxExt.added.length ? `延长 <b>+${uxExt.added.length}</b> 站 · ${uxExt.added.map(id => escapeHTML(S.cities[id].name)).join(' → ')}` : '拖到城市上连接 · 回到原端点取消';
}
function uxExtFinish(cancelled) {
  const ext = uxExt; uxExt = null; if (!ext || !draft) return;
  draft.extensionPointer = null;
  if (cancelled || !ext.added.length) { cancelDraft(false); if (!ext.moved) { selectLine(ext.line); if (!cancelled) toast('按住 ＋ 拖向城市即可延长，可连续经过多座'); } return; }
  const c = draftCost();
  if (c.invalid || c.cash > S.points) { toast(c.invalid || '资金不足：延长需要 ' + money(c.cash)); cancelDraft(false); selectLine(ext.line); return; }
  if (c.cash || c.bridge || c.tunnel) { draftBar(); haptic(); } else commitDraft(true);
}
cv.addEventListener('pointerdown', e => {
  if (uxExt || draft || bridgeDraft || pointers.size || modalOpen) return;
  const h = uxHandleAt(e.clientX, e.clientY); if (!h) return;
  e.stopImmediatePropagation(); e.preventDefault();
  try { cv.setPointerCapture(e.pointerId); } catch {}
  hideJunction(); beginDraft(h.line.type, h.line.id);
  uxExt = { id: e.pointerId, line: h.line.id, end: h.end, base: [...h.line.stops], added: [], x0: e.clientX, y0: e.clientY, moved: false };
  haptic(); uxExtMove(e);
}, { capture: true });
cv.addEventListener('pointermove', e => {
  if (!uxExt || e.pointerId !== uxExt.id) return;
  e.stopImmediatePropagation();
  if (Math.hypot(e.clientX - uxExt.x0, e.clientY - uxExt.y0) > 8) uxExt.moved = true;
  uxExtMove(e);
}, { capture: true });
for (const t of ['pointerup', 'pointercancel']) cv.addEventListener(t, e => {
  if (!uxExt || e.pointerId !== uxExt.id) return;
  e.stopImmediatePropagation(); uxExtFinish(t === 'pointercancel');
}, { capture: true });

/* ---------- edge pointers: cities that need you but sit off-screen ---------- */
// New towns (with their opening countdown) and towns about to lose a life get a pill on the screen edge.
// Tapping it glides there and opens the town; nothing moves the camera on its own.
(function edgePointers() {
  if (!document.body?.appendChild) return;
  const layer = document.createElement('div'); layer.id = 'ux-edge'; document.body.appendChild(layer);
  const pills = new Map();
  // Pills take taps. A drag that starts on a pill belongs to the map: hand the pointer to the canvas (pointer capture)
  // so panning, pinching and line drawing work even when a pill happens to sit under the finger.
  let press = null, dragged = false;
  layer.addEventListener('pointerdown', e => { if (e.target.closest('[data-city]')) { press = { id: e.pointerId, x: e.clientX, y: e.clientY }; dragged = false; } });
  layer.addEventListener('pointermove', e => {
    if (!press || e.pointerId !== press.id || Math.hypot(e.clientX - press.x, e.clientY - press.y) < 8) return;
    const start = { pointerId: press.id, clientX: press.x, clientY: press.y, type: 'pointerdown', preventDefault() {}, stopPropagation() {} };
    press = null; dragged = true;
    try { beginPointer(start); movePointer(e); } catch {}
  });
  layer.addEventListener('pointerup', () => { press = null; });
  layer.addEventListener('click', e => { const b = e.target.closest('[data-city]'); if (dragged) { dragged = false; return; } if (b) { haptic(); uxFocusCity(+b.dataset.city); } });
  function update() {
    try {
      const keep = new Set();
      if (S && S.lives > 0 && !modalOpen && !draft && !bridgeDraft) {
        const band = fitBand();
        // portrait: the line picker is a bottom sheet too (fitBand already stops at the tray and the details sheet)
        const pk = uxEl('junction-picker'); if (portraitMode && pk && !pk.hidden) { const r = pk.getBoundingClientRect(); if (r.height) band.bottom = Math.min(band.bottom, r.top - 10); }
        // Stay below the notices and the construction-undo pill so a pointer is never covered.
        for (const sel of ['.top-stack']) { const e = document.querySelector(sel); if (!e || e.hidden) continue; const r = e.getBoundingClientRect(); if (r.height) band.top = Math.max(band.top, r.bottom + 4); }
        const cx = W / 2, cy = (band.top + band.bottom) / 2;
        for (const c of realCities()) {
          const left = uxLifeLeft(c), urgent = !c.dormant && (left !== null || c.warning > 0), fresh = c.dormant;
          if (!urgent && !fresh) continue;
          const p = toScreen(c);
          // A city the player can see (below the header, above the dock — and in portrait above an open sheet) needs no pointer.
          const headerB = document.querySelector('header')?.getBoundingClientRect().bottom || 60, dockT = document.querySelector('footer .dock')?.getBoundingClientRect().top || H;
          if (p.x > 8 && p.x < W - 8 && p.y > headerB && p.y < Math.min(dockT - 8, portraitMode ? band.bottom : Infinity)) continue;
          const dx = p.x - cx, dy = p.y - cy, sx = (W / 2 - 64) / Math.abs(dx || 1e-6), sy = ((band.bottom - band.top) / 2 - 22) / Math.abs(dy || 1e-6), k = Math.min(sx, sy, 1);
          let el = pills.get(c.id);
          if (!el) { el = document.createElement('button'); el.dataset.city = c.id; layer.appendChild(el); pills.set(c.id, el); }
          const secs = urgent ? (left ?? Math.ceil(c.warning / Math.max(1, S.speed || 1))) : typeof cityOpeningRemaining === 'function' ? cityOpeningRemaining(c) : null;
          el.className = 'ux-edge-pill' + (urgent ? ' is-urgent' : '');
          el.innerHTML = `<i style="transform:rotate(${Math.atan2(dy, dx)}rad)">➜</i><span>${urgent ? '告急 ' : '新城 '}${escapeHTML(c.name)}</span>${secs !== null ? `<small>${secs}s</small>` : ''}`;
          // Never cover a city that is on screen (a tap meant for it would fly the camera away): slide the pill along
          // its edge — vertically on the left/right edges, horizontally on the top/bottom — until it is clear.
          let px = cx + dx * k, py = cy + dy * k;
          const halfW = (el.offsetWidth || 120) / 2 + 10, halfH = (el.offsetHeight || 34) / 2 + 10, alongY = sx <= sy;
          // cities on screen and the selected line's ＋ tabs (a pill over a tab would take the tap meant for it)
          const nodes = [...realCities(), ...(typeof uxVisibleHandles === 'function' ? uxVisibleHandles() : [])].map(o => toScreen(o)).filter(q => q.x > 0 && q.x < W && q.y > band.top && q.y < band.bottom);
          // …nor the toast while it shows (a pointer pressed against it reads as one blurred message)
          const fbx = uxEl('ux-feedback'), tr = !fbx && uxEl('toast')?.classList.contains('show') ? uxEl('toast').getBoundingClientRect() : null;   // the feedback capsule steps around pointers itself
          const covers = (x, y) => nodes.some(q => Math.abs(q.x - x) < halfW + 14 && Math.abs(q.y - y) < halfH + 14) || !!(tr && tr.width && x + halfW > tr.left && x - halfW < tr.right && y + halfH > tr.top && y - halfH < tr.bottom);
          let clear = false;
          for (const off of [0, 40, -40, 80, -80, 120, -120, 160, -160, 200, -200, 240, -240, 280, -280]) {
            const x = alongY ? px : Math.min(W - halfW, Math.max(halfW, px + off)), y = alongY ? Math.min(band.bottom - halfH, Math.max(band.top + halfH, py + off)) : py;
            if (!covers(x, y)) { px = x; py = y; clear = true; break; }
          }
          // No free spot along this edge: the city wins, the pointer waits until the map moves.
          el.hidden = !clear;
          el.style.left = px + 'px'; el.style.top = py + 'px';
          el.setAttribute('aria-label', (urgent ? '告急城市 ' : '新城镇 ') + c.name + '，点击前往');
          keep.add(c.id);
        }
      }
      for (const [id, el] of pills) if (!keep.has(id)) { el.remove(); pills.delete(id); }
    } catch {}
    if (uxEl('toast')?.classList.contains('show') || uxEl('ux-feedback')?.classList.contains('show')) uxPlaceToast();
    setTimeout(update, 150);
  }
  update();
})();

/* ---------- portrait rotation: keep city-attached labels upright and in place ---------- */
// Badges, markers and icons are drawn at "city + offset". When the map is rotated, turn each one around the
// city it belongs to, so "above the city" stays above on screen. Cities are at least 145 apart vertically.
function uxLabelCity(x, y) {
  let best = null, d = 80;
  for (const c of realCities()) { const dd = Math.hypot(c.x - x, c.y - y); if (dd < d) { d = dd; best = c; } }
  if (best) return best;
  d = 151;
  for (const c of realCities()) { const dy = c.y - y; if (Math.abs(c.x - x) < 75 && dy >= 0 && dy < d) { d = dy; best = c; } }
  return best;
}
function uxCityUpright(fn) {
  return function (...args) {
    if (!view.rot) return fn.apply(this, args);
    const t0 = text, r0 = roundBody;
    const around = (c, draw) => { if (!c) return draw(); ctx.save(); uprightAround(c.x, c.y); draw(); ctx.restore(); };
    text = (t, x, y, ...rest) => around(uxLabelCity(x, y), () => t0(t, x, y, ...rest));
    roundBody = (x, y, w, h, ...rest) => around(uxLabelCity(x + w / 2, y + h / 2), () => r0(x, y, w, h, ...rest));
    try { return fn.apply(this, args); } finally { text = t0; roundBody = r0; }
  };
}
function uxWrapLateDrawers() {
  if (typeof drawInfrastructure === 'function' && !drawInfrastructure.uxOct) { drawInfrastructure = uxOctInfra(drawInfrastructure); drawInfrastructure.uxOct = true; }
  if (typeof drawTerrainPreview === 'function' && !drawTerrainPreview.uxHalo) {
    const tp = drawTerrainPreview; drawTerrainPreview = function (...a) { const r = tp.apply(this, a); if (!draft && !bridgeDraft) uxStationHalos(); return r; };
    drawTerrainPreview.uxHalo = true;
  }
  // Lines: a paper-coloured casing under each stroke. Where lanes run side by side the next line's casing draws a
  // hairline gap, so each colour can be followed through a shared corridor (as on a transit map). Dashed strokes
  // (air, drafts, broken segments) are left as they are.
  if (typeof drawSegment === 'function' && !drawSegment.uxCasing) {
    const seg = drawSegment;
    drawSegment = function (a, b, l, ...rest) {
      const solid = !(ctx.getLineDash?.() || []).length;
      if (l && S?.lines?.includes(l) && solid && typeof strokeLaneRange === 'function') {
        ctx.save(); ctx.strokeStyle = '#fbf9f1'; ctx.lineWidth += 2.4; ctx.lineCap = 'butt';
        try { strokeLaneRange(a, b, l); ctx.stroke(); } catch {} ctx.restore();
      }
      // rail (动车 / 高铁): the line in its own colour with a light centre line (double track) — replaces 动车's dark
      // sleeper dots, which hid the line colour under a grey texture. Broken / repairing segments stay upstream's.
      const blocked = typeof key === 'function' && ['broken', 'repairing'].includes(S.blockages?.[key(a, b, l?.type)]?.status);
      if (l && (l.type === 'emu' || l.type === 'rail') && !blocked && typeof strokeLaneRange === 'function') {
        strokeLaneRange(a, b, l); ctx.stroke();
        if (solid) { ctx.save(); ctx.strokeStyle = '#fffdf4'; ctx.globalAlpha *= .92; ctx.lineWidth *= l.type === 'rail' ? .24 : .26; ctx.lineCap = 'butt'; ctx.stroke(); ctx.restore(); }
        return;
      }
      return seg.call(this, a, b, l, ...rest);
    };
    drawSegment.uxCasing = true;
  }
  for (const name of ['drawMissionBadges', 'drawEventMarkers', 'drawCityEconomy', 'drawRouteGhosts'])
    if (typeof globalThis[name] === 'function' && !globalThis[name].uxUpright) { const f = uxCityUpright(globalThis[name]); f.uxUpright = true; globalThis[name] = f; }
  if (typeof drawCityOpening === 'function' && !drawCityOpening.uxUpright) {
    const open = drawCityOpening;
    drawCityOpening = function (c) { ctx.save(); uprightAround(c.x, c.y); try { open(c); } finally { ctx.restore(); } };
    drawCityOpening.uxUpright = true;
  }
  if (!drawCityEconomy.uxHandles) { const dce = drawCityEconomy; drawCityEconomy = function (...a) { dce.apply(this, a); uxDrawLineCodes(); uxDrawHandles(); uxDrawCoach(); }; drawCityEconomy.uxHandles = true; }
}
/* ---------- tidy sheets that later scripts extend ---------- */
// Later layers append sections by string. These passes keep one header on top, drop entries that already have a
// home elsewhere (tasks and ledger have their own buttons), and move per-city builds to the city sheet.
function uxAfter(name, tidy) {
  const f = globalThis[name]; if (typeof f !== 'function') return;
  if (f.uxTidies) { f.uxTidies.push(tidy); return; }
  const list = [tidy];
  const g = function (...a) { const r = f.apply(this, a); for (const t of list) { try { t(uxEl('modal-content')); } catch {} } return r; };
  g.uxTidy = true; g.uxTidies = list; globalThis[name] = g;
}
function uxHeadFirst(m) { const head = m.querySelector('.modal-head'); if (head && m.firstElementChild !== head) m.prepend(head); }
const UX_HELP_TOPICS = [[/开局|一条命|补助/, '资金与生命'], [/候客|满员|拥堵|扣命/, '等待与扣命'], [/任务|成长|维护费|欠费/, '任务、收入与维护'], [/解锁|名额|每\d+天/, '交通方式与名额'], [/学校|检修/, '学校与检修中心'], [/金融|银行|证券|股票|理财/, '金融市场'], [/活动|邀请|卡/, '城市活动']];
function uxFoldRules(m) {
  if (m.querySelector('.ux-rules')) return;
  // Stand-alone rule paragraphs fold away; a short line inside a feature card says what the feature is for and stays.
  const long = [...m.querySelectorAll(':scope > p')].filter(p => p.textContent.trim().length > 30 && !p.querySelector('button, input'));
  if (!long.length) return;
  const d = document.createElement('details'); d.className = 'ux-rules'; d.innerHTML = '<summary>规则说明</summary>';
  long[0].before(d); long.forEach(p => d.appendChild(p));
}
function uxHowToPlay(m) {
  const head = m.querySelector('.modal-head'); if (head?.querySelector('h2')) head.querySelector('h2').textContent = '怎么玩';
  const steps = document.createElement('ol'); steps.className = 'ux-steps';
  steps.innerHTML = [
    ['连线', '从一座城市拖到另一座，看底栏报价，点「建设」。'],
    ['配车', '点线路，用「＋」加车；拖线路两端的「＋」延长。'],
    ['送客', '乘客头上的色块是目的地，送到同色同形的城市。别让候客厅长时间满员——满员持续 180 秒扣一条命，细节见下方「等待与扣命」。'],
    ['成长', '完成城市任务拿奖金、城市升级；每 10 天补助，月底付维护。'],
  ].map(([t, d], i) => `<li><i>${i + 1}</i><span><b>${t}</b>${d}</span></li>`).join('');
  (head || m.firstChild)?.after(steps);
  // upstream rule paragraphs → topics (first one open)
  const paras = [...m.querySelectorAll(':scope > p, :scope > section.infra-card')];
  const groups = new Map();
  for (const p of paras) {
    const t = p.textContent, title = (UX_HELP_TOPICS.find(([re]) => re.test(t)) || [, '更多规则'])[1];
    if (!groups.has(title)) groups.set(title, []);
    groups.get(title).push(p);
  }
  let anchor = steps;
  for (const [title, ps] of groups) {
    const d = document.createElement('details'); d.className = 'ux-help';
    d.innerHTML = `<summary>${title}</summary>`;
    const body = document.createElement('div'); body.className = 'ux-help-body'; ps.forEach(p => body.appendChild(p)); d.appendChild(body);
    anchor.after(d); anchor = d;
  }
  // remaining buttons/links (ledger, market, changelog) stay at the end as a quiet row
  const tail = [...m.querySelectorAll(':scope > button, :scope > a')];
  if (tail.length) { const row = document.createElement('div'); row.className = 'ux-help-links'; tail.forEach(x => row.appendChild(x)); m.appendChild(row); }
}
function uxWrapLatePanels() {
  uxAfter('showOperations', m => {
    uxHeadFirst(m);
    m.querySelectorAll('button[onclick^="showTasks"],button[onclick^="showFinance"],button[onclick^="closeModal();showTasks"]').forEach(b => b.remove());
    m.querySelectorAll('.tabs').forEach(t => { if (!t.querySelector('button')) t.remove(); });
    uxFoldRules(m);
  });
  for (const name of ['showFinance', 'shop', 'showMaintenance', 'showWeather', 'showEngineering']) uxAfter(name, m => uxFoldRules(m));
  // Finance market (1.0): the "build another bank/broker" box moves to the end once one exists, and long rule lines fold.
  uxAfter('showFinancialMarket', m => {
    const fm = m.querySelector('.financial-market') || m;
    for (const b of [...fm.querySelectorAll('.market-build')]) {
      if (!/已有/.test(b.textContent)) continue;
      const d = document.createElement('details'); d.className = 'ux-rules ux-market-build';
      d.innerHTML = '<summary>' + ((b.querySelector('b, strong, h3')?.textContent || '设施建设').trim() + ' · 再建一座') + '</summary>';
      fm.appendChild(d); d.appendChild(b);
    }
    const rules = [...fm.querySelectorAll('p')].filter(p => !p.id && !p.closest('.ux-rules') && p.textContent.trim().length > 30 && !p.querySelector('button, input, b[id], span[id]'));
    if (rules.length) { const d = document.createElement('details'); d.className = 'ux-rules'; d.innerHTML = '<summary>规则说明</summary>'; fm.appendChild(d); rules.forEach(p => d.appendChild(p)); }
  });
  uxAfter('showEngineering', m => {
    uxHeadFirst(m);
    const lists = [...m.querySelectorAll('.task-cities')];
    if (!lists.length) return;
    lists.forEach(list => { const h = list.previousElementSibling; if (h?.tagName === 'H3') h.remove(); list.remove(); });
    const cs = realCities().filter(c => !c.dormant);
    const note = document.createElement('section'); note.className = 'infra-card';
    note.innerHTML = `<h3>城市设施</h3><p>气象站 ${cs.filter(c => c.meteo).length} 座 · 交通枢纽 ${S.hubCount}/${hubLimit()} · 检修中心 ${cs.filter(c => c.repairCenter).length} 座<br>点地图上的城市，在城市详情里建设并预览覆盖范围。</p>`;
    m.appendChild(note);
  });
  uxAfter('help', m => {
    if (!m.querySelector('.ux-steps')) uxHowToPlay(m);
    const last = [...m.querySelectorAll('details.ux-help')].at(-1); if (!last) return;
    const extra = []; for (let n = last.nextElementSibling; n; n = n.nextElementSibling) if (!n.classList.contains('ux-foot')) extra.push(n);
    if (!extra.length) return;
    const d = document.createElement('details'); d.className = 'ux-help';
    d.innerHTML = '<summary>更新说明</summary>';
    const body = document.createElement('div'); body.className = 'ux-help-body'; extra.forEach(n => body.appendChild(n)); d.appendChild(body);
    last.after(d);
  });
}
/* ---------- three hubs: 目标 / 建造 / 资金 ---------- */
// Players think "what should I do", "how do I grow", "how is my money". Every global sheet now belongs to one hub,
// opened from the dock, with a fixed row of tabs on top so each page does a single job. Pages are still rendered
// by the upstream functions; the hub only adds the tab row, the hub title, and removes links that the tabs replace.
// Per-object actions stay on the object (city facilities in the city sheet, fleet and upgrades in the line sheet).
const UX_HUBS = {
  goal: { name: '目标', tabs: [['城市任务', 'showTasks'], ['城市活动', 'showActivityCards']] },
  build: { name: '建造', tabs: [['桥梁与道路', 'showEngineering'], ['车辆', 'shop'], ['天气', 'showWeather'], ['科研', 'showTransportResearch']] },
  money: { name: '资金', tabs: [['收支', 'showFinance'], ['维护', 'showMaintenance'], ['理财', 'uxMarketWealth'], ['股票', 'uxMarketStocks']] },
};
let uxMoneyIntent = null;   // tab index the player tapped (lock pages cannot tell 理财 from 股票 by their text)
function uxMarketWealth() { uxMoneyIntent = 2; showFinancialMarket('wealth'); }
function uxMarketStocks() { uxMoneyIntent = 3; showFinancialMarket('stocks'); }
function uxOpenHub(key, i = 0) { haptic(); globalThis[UX_HUBS[key].tabs[i][1]](); }
function uxHubBar(key, idx, m) {
  const hub = UX_HUBS[key];
  if (!m || m.hidden === true || m.querySelector('.ux-hub-tabs, .ux-deck-tabs')) return;
  // the activity deck (web128) has its own full-height layout and header: the tabs go into that header in place of its
  // two title lines, next to its own × (the shell hid that ×; it is shown again in style.css)
  const deckHead = m.querySelector('.deck128 .deck-heading128, .deck-heading128');
  if (deckHead) {
    const nav = document.createElement('nav'); nav.className = 'ux-deck-tabs'; nav.setAttribute('role', 'tablist');
    nav.innerHTML = hub.tabs.map(([label], i) => `<button role="tab" aria-selected="${i === idx}" class="${i === idx ? 'on' : ''}" onclick="uxOpenHub('${key}',${i})">${label}</button>`).join('');
    const titles = deckHead.querySelector(':scope > div'); if (titles) titles.hidden = true;
    deckHead.insertBefore(nav, deckHead.querySelector('.close'));
    return;
  }
  let head = m.querySelector('.modal-head');
  if (!head) { head = document.createElement('div'); head.className = 'modal-head'; head.innerHTML = '<h2></h2><button class="close" onclick="closeModal()">×</button>'; m.prepend(head); }
  uxHeadFirst(m);
  let h2 = head.querySelector('h2'); if (!h2) { h2 = document.createElement('h2'); head.prepend(h2); }
  h2.textContent = hub.name;
  head.querySelectorAll('.close').forEach(b => b.setAttribute('onclick', 'closeModal()'));
  const nav = document.createElement('nav'); nav.className = 'ux-hub-tabs'; nav.setAttribute('role', 'tablist');
  nav.innerHTML = hub.tabs.map(([label], i) => `<button role="tab" aria-selected="${i === idx}" class="${i === idx ? 'on' : ''}" onclick="uxOpenHub('${key}',${i})">${label}</button>`).join('');
  head.classList.add('has-hub'); head.insertBefore(nav, head.querySelector('.close'));   // tabs + × on one row in the sticky header
  // links the tabs replace
  m.querySelectorAll('.ux-links, .market-tabs').forEach(n => { const keep = n.querySelector('[onclick*="portfolio"]'); if (keep && n.classList.contains('market-tabs')) { const row = document.createElement('div'); row.className = 'ux-help-links'; row.appendChild(keep); n.replaceWith(row); } else n.remove(); });
  m.querySelectorAll('button[onclick^="showOperations"], button[onclick^="showMaintenance"], button[onclick^="showFinance()"], button[onclick^="showWeather"], button[onclick^="showEngineering"], button[onclick^="shop()"]').forEach(b => { if (!b.closest('.ux-hub-tabs')) b.remove(); });
  m.querySelectorAll('.tabs').forEach(t => { if (!t.querySelector('button')) t.remove(); });
  uxHubPolish(m);
  m.scrollTop = 0;
}
// Shared polish for every hub page, after the page's own tidy pass.
function uxHubPolish(m) {
  // rule / detail folds: one quiet footer at the bottom, in a stable order
  const folds = [...m.querySelectorAll(':scope > details.ux-rules, :scope > .financial-market > details.ux-rules')];
  const foot = m.querySelector(':scope > .ux-foldfoot') || Object.assign(document.createElement('div'), { className: 'ux-foldfoot' });
  // folds with the same title (several layers each made one) merge into the first
  const byTitle = new Map();
  for (const d of folds) { const t = d.querySelector('summary')?.textContent.trim(); if (byTitle.has(t)) { [...d.childNodes].filter(n => n.tagName !== 'SUMMARY').forEach(n => byTitle.get(t).appendChild(n)); d.remove(); } else byTitle.set(t, d); }
  [...byTitle.values()].sort((a, b) => /明细/.test(b.textContent) - /明细/.test(a.textContent)).forEach(d => foot.appendChild(d));
  if (folds.length) m.appendChild(foot);
  // weather: a real empty state
  for (const p of m.querySelectorAll(':scope > p')) if (/目前没有可见天气事件/.test(p.textContent)) {
    p.className = 'ux-emptystate'; p.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8"/></svg><b>天气平稳</b><span>预报出现时会在这里和地图上显示</span>';
  }
  // maintenance: per-segment costs as one card with a label; empty settlement history as a quiet line
  const segs = [...m.querySelectorAll(':scope > .quote-row')];
  if (segs.length && !m.querySelector('.ux-card')) {
    const label = document.createElement('div'); label.className = 'ux-card-label'; label.textContent = '各路段月费';
    const card = document.createElement('section'); card.className = 'ux-card';
    segs[0].before(label); label.after(card); segs.forEach(r => card.appendChild(r));
  }
  for (const h of m.querySelectorAll(':scope > h3')) if (/月度结算记录/.test(h.textContent)) { const p = h.nextElementSibling; if (p && /首月尚未结算/.test(p.textContent)) { p.remove(); h.remove(); } }
  // vehicles: the purchase-discount footnote goes to the footer area
  for (const p of m.querySelectorAll(':scope > p')) if (/采购优惠/.test(p.textContent)) { p.className = 'ux-footnote'; m.appendChild(p); }
}
/* ---------- 建造 · 桥梁与道路: actions first, empty sections gone ---------- */
// Upstream renders headings with placeholder text ("还没有桥梁", "暂无受损路段"). Rebuild as: two bridge actions with a
// starting price, then only sections that have content — existing bridges, damaged roads, per-line upgrades as rows.
function uxEngineeringPage(m) {
  if (m.querySelector('.ux-eng')) return;
  const sections = new Map(); let cur = null;
  for (const n of [...m.children]) {
    if (n.tagName === 'H3') { cur = n.textContent; sections.set(cur, []); n.remove(); continue; }
    if (cur) { sections.get(cur).push(n); n.remove(); }
  }
  const pick = re => [...sections.entries()].find(([k]) => re.test(k))?.[1] || [];
  const hasContent = nodes => nodes.some(n => n.querySelector?.('button') || n.classList?.contains('quote-row'));
  const wrap = document.createElement('div'); wrap.className = 'ux-eng';
  // bridges
  const from = t => { try { return bridgePrice({ x: 0, y: 0 }, { x: 38, y: 0 }, t); } catch { return ''; } };
  const old = m.querySelector(':scope > .tabs'); if (old && old.querySelector('[onclick^="beginBridge"]')) old.remove();
  wrap.insertAdjacentHTML('beforeend', `<div class="ux-eng-title">建桥</div>
<div class="ux-eng-actions"><button onclick="beginBridge('bus')"><b>公路桥</b><small>¥${from('bus')} 起</small></button><button onclick="beginBridge('track')"><b>铁路桥</b><small>¥${from('track')} 起</small></button></div>`);
  const addSection = (title, nodes, note) => {
    if (!hasContent(nodes)) return;
    const d = document.createElement('section'); d.className = 'ux-eng-sec';
    d.innerHTML = `<div class="ux-eng-title">${title}${note ? ` <small>${note}</small>` : ''}</div><div class="ux-card"></div>`;
    nodes.forEach(n => d.lastChild.appendChild(n)); wrap.appendChild(d);
  };
  addSection('已有桥梁', pick(/已有桥梁/), '拓宽提速或拆除');
  addSection('受损路段', pick(/断线|维修/), '抢修后恢复通行');
  // line upgrades: one row per line with its colour
  const upg = pick(/道路升级|铁路改造/).flatMap(n => [...(n.querySelectorAll?.('button[onclick^="openInfrastructure"]') || [])]);
  if (upg.length) {
    const d = document.createElement('section'); d.className = 'ux-eng-sec';
    d.innerHTML = '<div class="ux-eng-title">线路提速</div><div class="ux-card"></div>';
    for (const b of upg) {
      const id = +(b.getAttribute('onclick').match(/\d+/) || [])[0], l = S.lines.find(x => x.id === id);
      const row = document.createElement('button'); row.className = 'ux-eng-row'; row.setAttribute('onclick', b.getAttribute('onclick'));
      row.innerHTML = `<i style="background:${l?.color || '#999'}"></i><span>${escapeHTML(l?.name || b.textContent)}</span><em>›</em>`;
      d.lastChild.appendChild(row);
    }
    wrap.appendChild(d);
  }
  for (const [k, nodes] of sections) if (!/已有桥梁|断线|维修|道路升级|铁路改造/.test(k)) addSection(k, nodes);
  const rules = m.querySelector(':scope > .ux-rules');
  const facilities = m.querySelector(':scope > section.infra-card');
  (m.querySelector(':scope > .modal-head') || m.firstChild).after(wrap);
  if (facilities) { facilities.className = 'ux-eng-foot'; wrap.appendChild(facilities); }
  if (rules) m.appendChild(rules);
}
/* ---------- welcome: returning players get a one-tap continue card ---------- */
// A new game keeps the upstream introduction. With a save, the intro is replaced by where you left off and one button.
function uxWrapWelcome() {
  const w = welcome;
  welcome = function (hasSave) {
    if (!hasSave || !S?.cities) return w.apply(this, arguments);
    const d = formatDate(), lines = S.lines.filter(l => !l.retiring).length, open = realCities().filter(c => !c.dormant).length;
    openModal(`<div class="ux-hero"><span class="eyebrow">东岸 · 继续经营</span><h1>第${d.year}年 ${d.month}月${d.day}日</h1></div>
<div class="ux-resume"><div><small>资金</small><b>${money(S.points)}</b></div><div><small>线路</small><b>${lines}</b></div><div><small>城市</small><b>${open}</b></div><div><small>已送达</small><b>${S.delivered}</b></div></div>
<div class="ux-actions"><button class="primary ux-wide" onclick="startGame()">继续</button></div>
<div class="ux-resume-links"><button onclick="help()">怎么玩</button><button id="ux-new" class="ux-ghost" onclick="uxConfirmNew(this)">重新开始</button></div>`);
  };
  if (modalOpen && uxEl('modal-content').innerHTML.includes('startGame()')) welcome(typeof hadSave !== 'undefined' && hadSave);
}
/* ---------- 资金·收支: income vs spending first, every line item folded below ---------- */
const UX_LEDGER = {
  in: [['fares', '票款'], ['tasks', '城市任务'], ['subsidy', '补助'], ['events', '活动收入'], ['education', '教育补贴'], ['refunds', '撤回返还']],
  out: [['construction', '建设'], ['vehicles', '车辆'], ['maintenance', '维护'], ['activityFines', '活动罚款'], ['financialBuildings', '金融设施']],
};
// progression.js hard-codes the 0.x starting cash (500) in the ledger; a 1.1 save (moneyScale 10) started with 10×.
function uxFixStartingCash(m) {
  const k = +S?.moneyScale || 1; if (k === 1) return;
  for (const sp of m.querySelectorAll('.finance-summary span')) {
    const b = sp.querySelector('b'); if (!b || !/^初始资金/.test(sp.textContent.trim())) continue;
    if (b.textContent.trim() === '+500') b.textContent = '+' + 500 * k;
  }
}
function uxLedgerOverview(m) {
  if (m.querySelector('.ux-ledger') || !S?.ledger) return;
  uxFixStartingCash(m);
  const L = S.ledger, sum = list => list.map(([k, n]) => [n, Math.max(0, +L[k] || 0)]).filter(x => x[1] > 0).sort((a, b) => b[1] - a[1]);
  const ins = sum(UX_LEDGER.in), outs = sum(UX_LEDGER.out), tin = ins.reduce((n, x) => n + x[1], 0), tout = outs.reduce((n, x) => n + x[1], 0);
  const max = Math.max(tin, tout, 1), fmt = v => '¥' + Math.round(v).toLocaleString('en-US');
  const rows = (list, cls) => list.slice(0, 4).map(([n, v]) => `<div class="ux-ledger-row ${cls}"><span>${n}</span><i style="width:${Math.max(3, v / max * 100)}%"></i><b>${fmt(v)}</b></div>`).join('');
  const box = document.createElement('section'); box.className = 'ux-ledger';
  box.innerHTML = `<div class="ux-ledger-head"><div><small>累计收入</small><b class="in">${fmt(tin)}</b></div><div><small>累计支出</small><b class="out">${fmt(tout)}</b></div><div><small>经营结余</small><b class="${tin >= tout ? 'in' : 'out'}">${tin >= tout ? '+' : '−'}${fmt(Math.abs(tin - tout))}</b></div></div>
${rows(ins, 'in')}${rows(outs, 'out')}
<div class="ux-ledger-note">维护预计 ${typeof maintenanceForecast === 'function' ? fmt(maintenanceForecast()) : '—'} / 月</div>`;
  const head = m.querySelector('.modal-head'); (head || m.firstChild).after(box);
  // everything upstream rendered below the overview goes into one "全部明细" fold, links stay outside
  const d = document.createElement('details'); d.className = 'ux-rules ux-ledger-all'; d.innerHTML = '<summary>全部明细与流水</summary>';
  for (const n of [...m.children]) if (n !== head && n !== box && !n.classList.contains('ux-hub-tabs') && !n.matches('details.ux-rules:not(.ux-ledger-all)') && !(n.tagName === 'SECTION' && /投资账户/.test(n.textContent))) d.appendChild(n);
  box.after(d);
}
/* ---------- finance curves: readable at phone size ---------- */
// Upstream draws a 720-unit-wide SVG that shows at ~340px, so its 10-unit text is ~4.7px and the line ~1.2px.
// Same data, re-styled: area fill under the curve, a dot on the latest value, larger axis text (CSS).
function uxPolishCharts(m) {
  for (const svg of m.querySelectorAll('.market-chart svg')) {
    if (svg.dataset.ux) continue; svg.dataset.ux = '1';
    const line = svg.querySelector('polyline'); if (!line) continue;
    const pts = line.getAttribute('points').trim().split(/\s+/).map(p => p.split(',').map(Number)); if (!pts.length) continue;
    const col = line.getAttribute('stroke') || '#34775b', id = 'uxg' + Math.random().toString(36).slice(2, 8), base = 168;
    const ns = 'http://www.w3.org/2000/svg', el = (t, a) => { const e = document.createElementNS(ns, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    const defs = el('defs', {}), g = el('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 });
    g.append(el('stop', { offset: '0', 'stop-color': col, 'stop-opacity': '.22' }), el('stop', { offset: '1', 'stop-color': col, 'stop-opacity': '0' }));
    defs.append(g); svg.prepend(defs);
    const area = el('polygon', { points: [...pts.map(p => p.join(',')), pts.at(-1)[0] + ',' + base, pts[0][0] + ',' + base].join(' '), fill: `url(#${id})` });
    line.before(area);
    line.setAttribute('stroke-width', '4'); line.setAttribute('stroke-linecap', 'round');
    // upstream puts the min-value label and the first-day label in the same corner
    for (const t of svg.querySelectorAll('text')) if (t.getAttribute('x') === '4' && t.getAttribute('y') === '190') t.setAttribute('y', '158');
    const last = pts.at(-1); svg.append(el('circle', { cx: last[0], cy: last[1], r: 7, fill: '#fff', stroke: col, 'stroke-width': 4 }));
  }
}
function uxPolishPortfolio(m) {
  const metrics = m.querySelector('.market-metrics'); if (!metrics || metrics.dataset.ux) return; metrics.dataset.ux = '1';
  // the headline above already shows 累计投资收益率
  for (const d of metrics.children) if (/累计投资收益率/.test(d.textContent) && m.querySelector('.market-headline')) d.remove();
  // a section left with only its heading (paragraphs folded) goes away
  for (const sec of m.querySelectorAll('.market-product')) if (!sec.querySelector('p, button, input, .market-chart, .market-metrics') && /每日结算/.test(sec.textContent)) sec.remove();
}

/* ---------- confirmation sheets: one pattern ---------- */
// [取消]  [ primary action ]  at the bottom; destructive primaries read red; a second real choice stacks as an option.
function uxConfirmPattern(m) {
  if (!m || m.querySelector('.ux-hub-tabs, ' + UX_DESIGNED) || m.querySelector('.ux-confirm')) return;
  const btns = [...m.querySelectorAll('button')].filter(b => !b.closest('.modal-head, .ux-foldfoot, details, .colors, .ux-seg'));
  const primary = btns.filter(b => b.classList.contains('primary'));
  if (primary.length !== 1 || btns.length > 6) return;
  const p = primary[0], cancel = btns.find(b => b !== p && /^(取消|返回|暂不|先不)/.test(b.textContent.trim()));
  const others = btns.filter(b => b !== p && b !== cancel && b.parentElement === p.parentElement);
  const row = document.createElement('div'); row.className = 'ux-confirm';
  if (others.length === 1 && !/预览|地图/.test(others[0].textContent)) { // a second real choice: stack as options
    row.classList.add('is-options'); row.append(p, others[0]); if (cancel) row.append(cancel);
  } else { if (cancel) row.append(cancel); row.append(p); }
  if (/拆除|断线|回收|撤销/.test(p.textContent)) p.classList.add('ux-danger-primary');
  (m.querySelector('.ux-foldfoot') || null) ? m.querySelector('.ux-foldfoot').before(row) : m.appendChild(row);
  for (const c of m.querySelectorAll('.construction-actions')) if (!c.querySelector('button')) c.remove();
}

/* ---------- city services list: one row per city; the shared caveat once ---------- */
function uxCityServicesList(m) {
  const secs = [...m.querySelectorAll('.task-cities > section')]; if (!secs.length || m.querySelector('.ux-svc')) return;
  const lines = secs.map(sec => (sec.querySelector('p')?.innerHTML || '').split(/<br\s*\/?>/));
  const reasons = lines.map(l => (l[1] || '').trim()), same = reasons.every(r => r && r === reasons[0]);
  const card = document.createElement('div'); card.className = 'ux-card ux-svc';
  secs.forEach((sec, i) => {
    const btn = sec.querySelector('button'), name = sec.querySelector('h3')?.textContent || '';
    const row = document.createElement('div'); row.className = 'ux-svc-row';
    row.innerHTML = `<span><b>${escapeHTML(name)}</b><small>${lines[i][0]}${!same && reasons[i] ? ' · ' + reasons[i] : ''}</small></span>`;
    if (btn) { btn.textContent = '查看'; row.appendChild(btn); }
    card.appendChild(row);
  });
  const grid = m.querySelector('.task-cities'); grid.before(card); grid.remove();
  if (same) { const note = document.createElement('p'); note.className = 'ux-footnote'; note.innerHTML = reasons[0]; card.after(note); }
}

/* ---------- game over: the run in numbers ---------- */
function uxGameOver(m) {
  if (m.querySelector('.ux-resume')) return;
  const t = m.textContent, days = t.match(/(?:维持|坚持)了\s*(\d+)\s*天/)?.[1], got = t.match(/送达\s*(\d+)\s*位/)?.[1];
  if (!days) return;
  const tiles = document.createElement('div'); tiles.className = 'ux-resume';
  tiles.innerHTML = `<div><small>坚持</small><b>${days} 天</b></div><div><small>送达</small><b>${got ?? 0} 人</b></div><div><small>线路</small><b>${S.lines.length}</b></div><div><small>城市</small><b>${realCities().filter(c => !c.dormant).length}</b></div>`;
  const h = m.querySelector('h1, h2'); (h || m.firstChild).after(tiles);
  // what ended the run (user 2026-11-18): the last life actually lost, as recorded when it happened (uxLifeLog) — not a
  // guess from the stations that are crowded now. The secondary button goes to that station.
  const last = (S.uxLifeLog || []).at(-1), lc = last && S.cities[last.id];
  if (last) {
    const why = document.createElement('p'); why.className = 'ux-lastlife';
    why.innerHTML = '<b>最后一条命</b>' + escapeHTML(last.name.split('·')[0]) + ' 持续满员<small>第 ' + (last.day + 1) + ' 天 · 当时候车 ' + last.n + ' / 容量 ' + last.cap + '</small>';
    tiles.before(why);
    const look = [...m.querySelectorAll('button')].find(b => /查看交通网络/.test(b.textContent));
    if (look && lc && !lc.removed) { look.textContent = '查看失守车站'; look.setAttribute('onclick', 'closeModal();uxFocusCity(' + last.id + ')'); }
  }
  for (const p of m.querySelectorAll('p')) if (/(维持|坚持)了/.test(p.textContent)) p.remove();
}
/* ---------- active city activity: status, progress, stakes ---------- */
function uxActiveActivity(m) {
  const st = typeof activityState === 'function' ? activityState() : null, e = st?.active; if (!e || m.querySelector('.ux-act')) return;
  // upstream's card ends with a locate button: 定位举办城市 (events.js) or, since regional tasks, 定位任务城市 — kept as is
  const card = [...m.querySelectorAll('section.infra-card')].find(x => /定位(举办|任务)城市/.test(x.textContent)); if (!card) return;
  const go = [...card.querySelectorAll('button')].find(b => /定位(举办|任务)城市/.test(b.textContent)), goCall = go?.getAttribute('onclick') || `closeModal();openCity(${e.host})`, goTask = /任务城市/.test(go?.textContent || '');
  const scope = typeof regionalTaskLabel === 'function' ? (() => { try { return regionalTaskLabel(e); } catch { return ''; } })() : '';
  const prep = S.day < e.start, days = (prep ? e.start - S.day : Math.max(0, e.end - S.day)).toFixed(1);
  const pct = Math.min(100, e.delivered / Math.max(1, e.goal) * 100);
  const box = document.createElement('section'); box.className = 'ux-act';
  box.innerHTML = `<div class="ux-act-head"><span class="ux-act-stars">${'★'.repeat(e.star)}</span><b>${escapeHTML(e.title)}</b><small>${escapeHTML([S.cities[e.host]?.name, scope].filter(Boolean).join(' · '))}</small><em class="${prep ? 'is-prep' : ''}">${prep ? '准备中 · 还需 ' + days + ' 天' : '进行中 · 剩 ' + days + ' 天'}</em></div>
<div class="ux-act-progress"><span class="ux-bar"><i style="width:${pct}%"></i></span><span><b>${e.delivered}</b> / ${e.goal} 已送达<small>已出发 ${e.spawned}/${e.total} · 候车合格 ${e.good}/${e.delivered}${e.goodRatio ? '（需 ' + Math.round(e.goodRatio * 100) + '%）' : ''}</small></span></div>
<div class="ux-act-stakes"><div class="ok"><small>完成</small><b>${typeof activityRewardText === 'function' ? activityRewardText(e) : ''}</b></div><div class="bad"><small>未完成</small><b>最高 ¥${e.fine}${e.scoreLoss ? ' · 评分 −' + e.scoreLoss : ''}</b></div></div>
<button class="ux-act-go" onclick="${escapeHTML(goCall)}">在地图上定位${goTask ? '任务' : '举办'}城市</button>`;
  card.replaceWith(box);
}
// Activity page footer: an unpaid fine is a warning; with nothing owed only the rule remains, as a footnote.
// An empty settlement history is not shown.
function uxActivityFooter(m) {
  for (const p of m.querySelectorAll('p')) {
    const t = p.textContent.match(/^待缴活动罚款\s*¥([\d.]+)。(?:未付部分从后续收入补缴。)?(.*)$/); if (!t || p.dataset.ux) continue;
    p.dataset.ux = '1';
    if (+t[1] > 0) { p.className = 'ux-warnline'; p.textContent = `待缴活动罚款 ¥${(+t[1]).toFixed(0)} · 从后续收入补缴`; if (t[2]) { const n = document.createElement('p'); n.className = 'ux-footnote'; n.textContent = t[2]; p.after(n); } }
    else if (t[2]) { p.className = 'ux-footnote'; p.textContent = t[2]; } else p.remove();
  }
  for (const h of m.querySelectorAll('h3')) if (/^最近结算$/.test(h.textContent.trim())) { const p = h.nextElementSibling; if (p?.tagName === 'P' && /暂无记录/.test(p.textContent)) { p.remove(); h.remove(); } }
}
/* ---------- finance locked: two steps with status ---------- */
function uxFinanceLock(m) {
  const fm = m.querySelector('.financial-market') || m; if (fm.querySelector('.ux-steps-fin')) return;
  const secs = [...fm.querySelectorAll('section.market-product')].filter(x => /银行|证券公司/.test(x.querySelector('h3')?.textContent || ''));
  if (!secs.length) return;
  const list = document.createElement('ol'); list.className = 'ux-steps ux-steps-fin';
  secs.forEach((sec, i) => {
    const h = sec.querySelector('h3')?.textContent || '', done = /已建设/.test(h), btn = sec.querySelector('button');
    const li = document.createElement('li'); if (done) li.className = 'is-done';
    li.innerHTML = `<i>${done ? '✓' : i + 1}</i><span><b>${escapeHTML(h)}</b>${sec.querySelector('p')?.innerHTML || ''}</span>`;
    if (btn) { btn.className = 'primary'; li.querySelector('span').appendChild(btn); }
    list.appendChild(li);
  });
  secs[0].before(list); secs.forEach(x => x.remove());
  for (const b of fm.querySelectorAll('button')) if (/^知道了$/.test(b.textContent.trim())) b.remove();   // × already closes
}
/* ---------- line name & colour: one row of swatches, current one marked ---------- */
function uxMarkColor() {
  const l = S.lines.find(x => x.id === uxMarkColor.id); if (!l) return;
  const row = document.querySelector('#modal-content .colors'); if (!row) return;
  let hit = false;
  const cur = uxLineEdit?.id === l.id && uxLineEdit.preview || l.color;
  for (const b of row.querySelectorAll('button')) { const on = (b.getAttribute('onclick') || '').includes("'" + cur + "'"); b.classList.toggle('on', on); hit ||= on; }
  // a colour from an older palette (or an older save) is still shown, first and marked, so "current" is never lost
  if (!hit && /^#[0-9a-f]{3,8}$/i.test(l.color)) {
    const b = document.createElement('button'); b.className = 'on'; b.style.background = l.color; b.setAttribute('aria-label', '当前颜色');
    b.setAttribute('onclick', `setLineColor(${l.id},'${l.color}')`); row.prepend(b);
  }
}
// Line picker at a shared station: the city entry says how loaded the station is and comes first; drawing a line
// out of it is a secondary chip on each row.
// Line picker at a shared station (user 2026-11-16: 页面大胆重构): the lines through the station grouped by mode, like
// the tray — the mode named once, each line a compact cell (colour, number, stops) with its ↗ edit button beside it.
// Upstream's own rows are moved into the groups as they are (handlers, data-junction-line for the drag and the
// tutorial, the chosen highlight); only their text is shortened.
function uxJunctionGroups(id) {
  const el = uxEl('junction-picker'), list = el?.querySelector('.junction-lines'); if (!list || list.dataset.ux) return;
  list.dataset.ux = '1';
  const head = el.querySelector('.junction-heading small'), lines = typeof cityLines === 'function' ? cityLines(id) : [];
  if (head) head.textContent = lines.length + ' 条线路经过 · 点线路查看，↗ 改线';
  const rows = [...list.querySelectorAll(':scope > .junction-line')];
  const byId = new Map(rows.map(r => [+r.querySelector('[data-junction-line]')?.dataset.junctionLine, r]));
  const frag = document.createDocumentFragment();
  for (const [t, name] of UX_MODES) {
    const ls = lines.filter(l => l.type === t).sort((a, b) => (+uxLineLabel(a) || 1e9) - (+uxLineLabel(b) || 1e9) || a.id - b.id); if (!ls.length) continue;
    const g = document.createElement('section'); g.className = 'ux-jg'; g.dataset.mode = t;
    g.innerHTML = '<div class="ux-jg-head"><i class="ux-tmark ' + t + '"></i><b>' + name + '</b><small>' + ls.length + '</small></div><div class="ux-jg-cells"></div>';
    const cells = g.querySelector('.ux-jg-cells');
    for (const l of ls) { const r = byId.get(l.id); if (!r) continue; r.style.setProperty('--c', l.color);
      const sp = r.querySelector('button:first-child span'); if (sp) sp.innerHTML = '<b>' + escapeHTML(uxLineLabel(l)) + '</b><small>' + l.stops.filter(s => S.cities[s]?.kind !== 'bridgehead').length + '站</small>';
      const go = r.querySelector('.junction-drag'); if (go) go.textContent = '↗';
      cells.appendChild(r); }
    frag.appendChild(g);
  }
  for (const r of list.querySelectorAll(':scope > .junction-line')) frag.appendChild(r);   // anything left (no mode match)
  list.appendChild(frag);
}
function uxJunctionCity(id) {
  const c = S.cities[id], b = uxEl('junction-picker')?.querySelector('.junction-city-task'); if (!c || !b || typeof capacity !== 'function') return;
  const n = c.q.filter(p => !p.cardId && !p.eventId).length, cap = capacity(c), cls = n >= cap ? 'is-over' : n >= cap * .8 ? 'is-near' : '';
  b.innerHTML = '<span><b>城市详情</b></span><em class="' + cls + '">候车 ' + n + '/' + cap + '</em><i>›</i>';
}
let uxLineEdit = null;   // { id, preview } while the line settings sheet is open; preview = picked, not yet saved colour
function uxWrapHubs() {
  // 6. maintenance: the same pair of cities can carry a road and a track (two bills); say which is which
  uxAfter('showMaintenance', m => {
    if (typeof maintenanceAssets !== 'function' || m.querySelector('.ux-mode')) return;
    const items = maintenanceAssets(), rows = [...m.querySelectorAll('.quote-row')].filter(r => /↔|桥梁 #/.test(r.textContent));
    if (rows.length !== items.length) return;
    rows.forEach((r, i) => {
      const it = items[i], x = S.infrastructure?.[it.key], bridge = it.key.startsWith('bridge-');
      const mode = bridge ? ['桥梁', 'is-bridge'] : x?.type === 'track' ? [(x.level >= 2 ? '高速铁路' : '铁路'), 'is-rail'] : ['公路', 'is-road'];
      const lvl = !bridge && x?.level ? ' · ' + x.level + ' 级' : '';
      r.querySelector('span')?.insertAdjacentHTML('afterbegin', '<em class="ux-mode ' + mode[1] + '">' + mode[0] + lvl + '</em>');
      r.dataset.pair = it.label; r.dataset.mode = mode[0];
    });
    // a road and a track between the same two cities sit next to each other
    const host = rows[0]?.parentElement; if (host) rows.slice().sort((a, b) => (a.dataset.pair || '').localeCompare(b.dataset.pair || '', 'zh') || (a.dataset.mode || '').localeCompare(b.dataset.mode || '', 'zh')).forEach(r => host.appendChild(r));
  });
  // 7. roads page: damage and earthquake belong together; the city-facility count is its own small group
  // (runs after uxEngineeringPage has built the sections, hence the deferred registration)
  Promise.resolve().then(() => uxAfter('showEngineering', m => {
    const card = m.querySelector('.ux-eng-sec .ux-card'), infra = card?.querySelector('.infra-card'); if (!infra || m.querySelector('.ux-fac-count')) return;
    const t = infra.textContent, num = re => (t.match(re) || [])[1] ?? '0';
    const sec = document.createElement('section'); sec.className = 'ux-eng-sec ux-fac-count';
    sec.innerHTML = '<div class="ux-eng-title">城市设施</div><div class="ux-card"><div class="ux-tiles3"><div><small>气象站</small><b>' + num(/气象站\s*(\d+)/) + '</b></div><div><small>交通枢纽</small><b>' + (t.match(/交通枢纽\s*([\d/]+)/) || [])[1] + '</b></div><div><small>检修中心</small><b>' + num(/检修中心\s*(\d+)/) + '</b></div></div><p class="ux-footnote">在地图上点城市，于城市详情里建设并预览覆盖范围。</p></div>';
    infra.remove();
    const secs = [...m.querySelectorAll('.ux-eng > .ux-eng-sec')], damage = card.closest('.ux-eng-sec'), calm = /暂无受损路段/.test(card.textContent);
    // with nothing damaged, line upgrades (something to do) come before the quiet damage/earthquake status
    if (calm && secs.length > 1 && secs.at(-1) !== damage) secs.at(-1).after(damage);
    // …and says it in one row: 路网状态 — 地震监测 · 暂无震情 · 无受损路段 [自动聚焦]
    if (calm) { const tt = damage.querySelector('.ux-eng-title'); if (tt) tt.textContent = '路网状态';
      for (const p of damage.querySelectorAll('p')) if (/暂无受损路段/.test(p.textContent)) p.remove();
      const sm = damage.querySelector('.quake-summary b small'); if (sm && !/路段/.test(sm.textContent)) sm.textContent = '无震情 · 路段完好'; }
    damage.after(sec);
  }));
  // 9b. finance pages (理财 / 股票): the pause note, the cash / return figures and the 收益记录 link were three rows above
  // the products; they become one strip — 现金 · 收益率 · [收益记录] — with the pause note as its small print
  uxAfter('showFinancialMarket', m => Promise.resolve().then(() => {   // after the hub bar has turned the market tabs into links
    const fm = m.querySelector('.financial-market'), hl = fm?.querySelector(':scope > .market-headline'); if (!hl || hl.classList.contains('ux-strip')) return;
    hl.classList.add('ux-strip');
    // a trade re-renders the page and restores the scroll position on the full layout: keep it through this change
    // (scroll anchoring would otherwise move the page up by the rows removed here)
    const sc = m.scrollTop;
    for (const s of hl.querySelectorAll(':scope > div > small')) s.textContent = s.textContent.replace('可用现金', '现金').replace('累计投资收益率', '累计收益');
    const note = fm.querySelector(':scope > .market-pause-note'), links = fm.querySelector(':scope > .ux-help-links'), rec = links?.querySelector('button[onclick*="portfolio"]');
    if (rec) { hl.appendChild(rec); if (!links.querySelector('button')) links.remove(); }
    if (note) { note.classList.add('ux-strip-note'); hl.after(note); }
    if (m.scrollTop !== sc) m.scrollTop = sc;
  }));
  // 10. stocks before the first settled trading day: an explained empty chart instead of a blank one with controls
  uxAfter('showFinancialMarket', m => {
    if (!/已结算\s*0\s*个交易日/.test(m.textContent)) return;
    const fig = m.querySelector('.market-stock-detail .market-chart'); if (!fig || fig.classList.contains('ux-nohist')) return;
    fig.classList.add('ux-nohist');
    fig.innerHTML = '<div class="ux-emptystate"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 19h18M5 15l4-4 3 3 6-6"/></svg><b>还没有走势</b><span>第一个交易日结算后开始绘制 · 每日 09:00 更新</span></div>';
    m.querySelector('.market-stock-detail .market-range')?.classList.add('ux-hidden');
  });
  // A trade re-renders the market page: keep the reading position and the quantity the player typed.
  if (typeof tradeStock === 'function') {
    const ts = tradeStock;
    tradeStock = function (id, side, ...a) {
      const m = uxEl('modal-content'), top = m?.scrollTop || 0, q = uxEl('stock-quantity')?.value;
      const r = ts.call(this, id, side, ...a);
      const m2 = uxEl('modal-content'); if (m2) m2.scrollTop = top;
      const inp = uxEl('stock-quantity'); if (inp && q && inp.value !== q) { inp.value = q; try { updateStockOrderQuote(id); } catch {} }
      return r;
    };
  }
  // Research: × closes to the map like every other sheet; when opened from the ledger, a back link returns there.
  if (typeof showTransportResearch === 'function') {
    const sr = showTransportResearch;
    showTransportResearch = function (...a) {
      const fromLedger = typeof modalOpen !== 'undefined' && modalOpen && uxDockState.hub === 'money';
      const r = sr.apply(this, a), head = uxEl('modal-content')?.querySelector('.modal-head');
      head?.querySelectorAll('.close').forEach(b => { b.setAttribute('onclick', 'closeModal()'); b.setAttribute('aria-label', '关闭'); });
      if (fromLedger && head && !head.querySelector('.ux-back')) { const b = document.createElement('button'); b.className = 'ux-back'; b.textContent = '‹ 收支'; b.setAttribute('onclick', "uxOpenHub('money',0)"); head.prepend(b); }
      return r;
    };
  }
  // Line settings: a visible way to leave without saving. A picked colour is pending state of the sheet (drawn on the
  // map as a preview through lineStyle); the game state — and therefore any save, including the save on close and the
  // one when the page is left — never holds it. Only 保存设置 writes it to the line, together with the name.
  if (typeof renameLine === 'function') {
    const rl = renameLine;
    renameLine = function (id, ...a) {
      uxLineEdit = S.lines.some(l => l.id === id) ? { id, preview: null } : null;
      const r = rl.call(this, id, ...a), m = uxEl('modal-content'), h = m?.querySelector(':scope > h2');
      if (h && !m.querySelector('.modal-head')) { const head = document.createElement('div'); head.className = 'modal-head'; h.before(head); head.append(h); head.insertAdjacentHTML('beforeend', '<button class="close" onclick="closeModal()" aria-label="不保存，关闭">×</button>'); }
      const save = m?.querySelector('button.primary[onclick^="applyName"]');
      if (save && !m.querySelector('.ux-confirm')) { const row = document.createElement('div'); row.className = 'ux-confirm'; save.before(row); row.insertAdjacentHTML('beforeend', '<button onclick="closeModal()">取消</button>'); row.append(save); }
      return r;
    };
  }
  if (typeof applyName === 'function') { const an = applyName; applyName = function (id, ...a) {
    const e = uxLineEdit, l = e && S.lines.find(x => x.id === e.id); uxLineEdit = null;
    if (l && e.preview) l.color = e.preview;          // committed together with the name; upstream saves on close
    return an.call(this, id, ...a);
  }; }
  { const cm = closeModal; closeModal = function (...a) { uxLineEdit = null; return cm.apply(this, a); }; }   // leaving drops the pending colour
  { const ls = lineStyle; lineStyle = function (l, ...a) { const r = ls.call(this, l, ...a); if (uxLineEdit?.preview && l && l.id === uxLineEdit.id) ctx.strokeStyle = uxLineEdit.preview; return r; }; }
  // Build page: with no earthquake there is nothing to warn about; the monitor is one quiet settings row.
  uxAfter('showEngineering', m => {
    const q = m.querySelector('.quake-summary'); if (!q || q.querySelector('[onclick*="focusEarthquake"]')) return;
    q.classList.add('is-idle');
    const p = q.querySelector('p'); if (p) p.remove();
    const b = q.querySelector('b'); if (b) b.innerHTML = '地震监测<small>暂无震情</small>';
  });
  // The tap that opens the picker is followed by the browser's click at the same point. Kept on screen, the floating
  // picker can sit under that finger, and the click would pick its first row (城市详情) instead of letting the player
  // choose: clicks on the picker in the first moments after it opened are ignored.
  { const jp = uxEl('junction-picker'); jp?.addEventListener?.('click', e => { if (performance.now() < (showJunction.openedAt || 0) + 450) { e.stopImmediatePropagation(); e.preventDefault(); } }, true); }
  if (typeof showJunction === 'function') { const sj = showJunction; showJunction = function (...a) {
    showJunction.openedAt = performance.now();
    const r = sj.apply(this, a);
    uxJunctionCity(a[0]); uxJunctionGroups(a[0]);
    if (portraitMode) { const el = uxEl('junction-picker'); if (el?.style) el.style.maxHeight = '';
      // opening the picker hides the details sheet, which may start a 280ms view restore: frame once that settles
      setTimeout(() => { if (selected?.type === 'junction' && typeof requestAnimationFrame === 'function') requestAnimationFrame(uxFrameSelection); }, 320); }
    else { // upstream places the floating picker from an estimated height: keep the real one on screen (short landscape phones)
      const el = uxEl('junction-picker'), top = el?.getBoundingClientRect ? el.getBoundingClientRect().top : 0, head = (document.querySelector('header')?.getBoundingClientRect().bottom || 60) + 8;
      if (el && !el.hidden) { el.style.maxHeight = (H - head - 12) + 'px'; el.style.overflowY = 'auto'; const h = el.getBoundingClientRect().height; if (top + h > H - 12) el.style.top = Math.max(head, H - 12 - h) + 'px';
      // the floating picker sits beside the city and is clamped to the screen, so near an edge it can cover the city
      // (or the city is off-screen): frame the city into the map area the picker leaves free, as in portrait
      setTimeout(() => { if (selected?.type === 'junction' && typeof requestAnimationFrame === 'function') requestAnimationFrame(uxFrameSelection); }, 320); }
    }
    return r;
  }; }
  uxAfter('showActivityCards', m => { uxActiveActivity(m); uxActivityFooter(m); });
  if (typeof showFinanceLock === 'function') uxAfter('showFinanceLock', m => uxFinanceLock(m));
  if (typeof renameLine === 'function') { const rn = renameLine; renameLine = function (id, ...a) { uxMarkColor.id = id; const r = rn.call(this, id, ...a); uxMarkColor(); return r; }; }
  if (typeof setLineColor === 'function') { const sc = setLineColor; setLineColor = function (id, c, ...a) {
    if (uxLineEdit && uxLineEdit.id === id) { uxLineEdit.preview = c; uxMarkColor(); return; }   // pending, not game state
    const r = sc.call(this, id, c, ...a); uxMarkColor(); return r;
  }; }
  uxAfter('showFinancialMarket', m => { uxPolishPortfolio(m); uxPolishCharts(m); });
  if (typeof showCityServices === 'function') uxAfter('showCityServices', m => uxCityServicesList(m));
  if (typeof gameover === 'function') uxAfter('gameover', m => uxGameOver(m));
  uxAfter('showFinance', m => uxLedgerOverview(m));
  // 建造·车辆: the train-car shop repeats the per-train "+车厢" in each line sheet; fold it into one summary row.
  uxAfter('shop', m => {
    const sec = m.querySelector('section.car-shop'); if (!sec || sec.closest('details')) return;
    const n = sec.querySelectorAll('button[onclick^="purchaseTrainCar"]:not([disabled])').length;
    const d = document.createElement('details'); d.className = 'ux-rules ux-car-fold';
    d.innerHTML = `<summary>列车扩编 · ${n ? n + ' 列可加车厢' : '暂无可扩容列车'}<small>线路详情里也能逐车加</small></summary>`;
    sec.before(d); d.appendChild(sec);
    sec.querySelectorAll(':scope > p').forEach(p => { if (p.textContent.trim().length > 30) p.remove(); });
  });
  // Activity cards (0.5): the deck actions (reveal all / skip) sit right under the tabs so they are always in reach.
  uxAfter('showActivityCards', m => {
    const grid = m.querySelector('.activity-grid'), acts = m.querySelector('.activity-deck-actions');
    if (grid && acts && acts.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING) return;   // already above
    if (grid && acts) grid.before(acts);
  });
  uxAfter('showEngineering', m => uxEngineeringPage(m));
  for (const [key, hub] of Object.entries(UX_HUBS)) hub.tabs.forEach(([, fn], i) => {
    if (fn === 'uxMarketWealth' || fn === 'uxMarketStocks') return;
    uxAfter(fn, m => uxHubBar(key, i, m));
  });
  uxAfter('showFinancialMarket', m => { uxMoneyIntent = null; uxHubBar('money', marketTab === 'stocks' ? 3 : 2, m); });
  uxAfter('showFinanceLock', m => { const i = uxMoneyIntent ?? (/证券|券商/.test(m.textContent) && !/银行尚未/.test(m.textContent) ? 3 : 2); uxMoneyIntent = null; uxHubBar('money', i, m); });
  // the old operations centre is retired: its callers ("返回" buttons, accepting a contract) land in the goal hub
  showOperations = function () { uxOpenHub('goal', 1); };
  // dock + header entries
  for (const key of ['goal', 'build', 'money']) { const b = uxEl('hub-' + key); if (b) b.onclick = () => uxOpenHub(key); }
}
// events.js loads after this file and redefines some drawers and sheets, so wrap once every script has run.
// A finished match stays on screen for looking back at the network: the ▶ button becomes 「结算」 (reopens the results),
// so nothing suggests the run can be continued.
/* ---------- network tray ---------- */
// Upstream (1.2.10) keeps a titled, collapsible line list with its own 「＋ 新建线路」. On phones every line is a chip in
// a wrapping grid (eight lines = two or three rows, none hidden off to the side); collapsed, the heading carries one
// tappable swatch per line so the count and colours stay readable. The collapsed choice is remembered per browser.
const UX_TRAY_KEY = 'transit-ux-tray-collapsed';
function uxTray() {
  const p = uxEl('routes'), head = p?.querySelector?.('.panel-heading'); if (!head || !S) return;
  head.querySelector('.ux-swatches')?.remove();   // the per-line code row is replaced by the per-mode pills (uxTrayGroups)
  // swatches speak the map's language: bus a solid line, 动车 / 高铁 a double track (heavier for 高铁), air a dash
  for (const row of p.querySelectorAll('.route-row[data-line]')) {
    const l = S.lines.find(x => x.id === +row.dataset.line), sw = row.querySelector('.swatch'); if (!l || !sw) continue;
    const want = l.type === 'air' ? 'dashed 3px' : l.type === 'rail' ? 'double 7px' : l.type === 'emu' ? 'double 6px' : 'solid 4px';
    if (sw.dataset.mode !== want) { sw.dataset.mode = want; const [st, w] = want.split(' '); sw.style.borderTopStyle = st; sw.style.borderTopWidth = w; }
  }
  uxEl('route-new130')?.setAttribute?.('aria-label', '新建线路');
  // the expand toggle must not read as a second 「＋」 next to 新建: a chevron that points where the list goes
  const col = uxEl('collapse'), shut = p.classList.contains('collapsed');
  if (col) { const t = shut ? '⌃' : '⌄'; if (col.textContent !== t) col.textContent = t; col.setAttribute('aria-label', shut ? '展开线路列表' : '收起线路列表'); }
  const cnt = uxEl('routecount'); if (cnt && shut) { const t = S.lines.length + ' 条'; if (cnt.textContent !== t) cnt.textContent = t; }
  uxTrayGroups(p, head, shut);
  // short landscape: the shell's tray offset assumes the portrait dock; keep the tray above the dock that is really there
  // (the shell keeps portraitMode on in landscape too, and its offset is !important)
  const dk = document.querySelector('footer .dock')?.getBoundingClientRect?.(), want = innerWidth > innerHeight && innerHeight <= 500 && dk && dk.height ? Math.ceil(innerHeight - dk.top + 8) + 'px' : '';
  if (p.style.getPropertyValue?.('bottom') !== want) want ? p.style.setProperty('bottom', want, 'important') : p.style.removeProperty?.('bottom');
  const ov = uxEl('overview'), foot = p.querySelector('.route-foot');
  if (ov && portraitMode && ov.parentElement !== head) head.insertBefore(ov, uxEl('route-new130') || uxEl('collapse'));
  else if (ov && !portraitMode && foot && ov.parentElement !== foot) foot.appendChild(ov);
}
// Lines grouped by mode (user 2026-11-16: 同种交通线归并). Expanded: one group per mode — the mode named once (大巴 · 14),
// its lines as compact chips by number in their colour (a renamed line keeps its own name). Collapsed: one row, a pill
// per mode with its count and colour dots; tapping a pill opens the tray at that mode. Upstream's list stays in the
// page (hidden) — the chips select lines with the same call it uses.
// v1.6 sea modes (third map): 小轮船 / 大轮渡 lines are grouped like the land modes
const UX_MODES = [['bus', '大巴'], ['emu', '动车'], ['rail', '高铁'], ['ship', '轮船'], ['ferry', '轮渡'], ['air', '航空']];
function uxLineLabel(l) {
  const m = String(l.name).match(/^(?:大巴|公交|动车|高铁|飞机|航空|航线|小轮船|大轮渡|轮船|轮渡|海运)?\s*(\d+)\s*(?:号)?线?$/);
  return m ? m[1] : String(l.name).replace(/线$/, '').slice(0, 4);
}
let uxTrayFocus = null;   // mode the collapsed pill asked for
function uxTrayGroups(p, head, shut) {
  let g = p.querySelector(':scope > .ux-tgroups'), sum = head.querySelector('.ux-tsum');
  if (!g) { g = document.createElement('div'); g.className = 'ux-tgroups'; head.after(g); }
  if (!sum) { sum = document.createElement('div'); sum.className = 'ux-tsum'; head.insertBefore(sum, head.firstChild); }
  const sel = selected?.type === 'line' ? selected.id : null, live = S.lines.filter(l => !l.retiring || true);
  const groups = UX_MODES.map(([t, name]) => ({ t, name, lines: live.filter(l => l.type === t).sort((a, b) => (+uxLineLabel(a) || 1e9) - (+uxLineLabel(b) || 1e9) || a.id - b.id) })).filter(x => x.lines.length);
  const key = shut + '|' + sel + '|' + uxTrayFocus + '|' + groups.map(x => x.t + ':' + x.lines.map(l => l.id + l.color + l.name + (l.retiring ? 'r' : '')).join(',')).join(';');
  if (g.dataset.key === key) return; g.dataset.key = key;
  if (!groups.length) {   // no line yet: say what to do instead of an empty box
    sum.innerHTML = '<span class="ux-tempty">还没有线路 · 从一座城拖到另一座</span>'; g.innerHTML = '<p class="ux-tempty">还没有线路 · 从一座城拖到另一座，看报价后建设</p>'; return;
  }
  // one row whatever the network: the more modes, the shorter each pill (full name + 8 dots → 简称 + 4 → 简称 + count)
  const nd = groups.length === 1 ? 8 : groups.length === 2 ? 4 : 0, shortName = groups.length > 1;
  sum.innerHTML = groups.map(x => '<button type="button" class="ux-tpill" data-mode="' + x.t + '" aria-label="' + x.name + ' ' + x.lines.length + ' 条，展开">' + (groups.length < 3 ? '<i class="ux-tmark ' + x.t + '"></i>' : '') + '<b>' + (shortName ? UX_TYPE_CHAR[x.t] || x.name : x.name) + '</b><small>' + x.lines.length + '</small>' + (nd ? '<span class="ux-tdots">'
    + x.lines.slice(0, nd).map(l => '<i style="--c:' + l.color + '"></i>').join('') + (x.lines.length > nd ? '<em>+' + (x.lines.length - nd) + '</em>' : '') + '</span>' : '') + '</button>').join('');
  g.innerHTML = groups.map(x => '<section class="ux-tg' + (uxTrayFocus === x.t ? ' is-focus' : '') + '" data-mode="' + x.t + '"><div class="ux-tg-head"><i class="ux-tmark ' + x.t + '"></i><b>' + x.name + '</b><small>' + x.lines.length + '</small></div><div class="ux-tg-lines">'
    + x.lines.map(l => '<button type="button" class="ux-tline' + (l.id === sel ? ' on' : '') + (l.retiring ? ' is-retiring' : '') + '" style="--c:' + l.color + '" data-line="' + l.id + '" title="' + escapeHTML(l.name) + '" aria-label="' + escapeHTML(l.name) + '"><i></i>' + escapeHTML(uxLineLabel(l)) + '</button>').join('') + '</div></section>').join('');
  if (!g.uxWired) {
    g.uxWired = true;
    g.addEventListener('click', e => { const b = e.target.closest('[data-line]'); if (b) { haptic(); selectLine(+b.dataset.line); } });
    sum.addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; e.stopPropagation(); haptic(); uxTrayFocus = b.dataset.mode;
      if (p.classList.contains('collapsed')) uxEl('collapse')?.click(); else updateUI();
      setTimeout(() => { g.querySelector('.ux-tg[data-mode="' + uxTrayFocus + '"]')?.scrollIntoView?.({ block: 'nearest' }); }, 60); setTimeout(() => { uxTrayFocus = null; updateUI(); }, 1600); });
  }
}
function uxTrayInit() {
  const btn = uxEl('collapse'), p = uxEl('routes'); if (!btn || !p) return;
  const tap = btn.onclick; btn.onclick = function (...a) { const r = tap?.apply(this, a); try { localStorage.setItem(UX_TRAY_KEY, p.classList.contains('collapsed') ? '1' : '0'); } catch {} updateUI(); return r; };
  // The player's own choice wins. Without one, a short landscape screen starts with the tray collapsed once the
  // network has more than three lines: expanded, eight lines take over a third of a 390px-high screen.
  const want = () => { let sv = null; try { sv = localStorage.getItem(UX_TRAY_KEY); } catch {}
    return sv === '1' ? true : sv === '0' ? false : innerHeight <= 500 && innerWidth > innerHeight && (S?.lines?.length || 0) > 3; };
  uxTrayInit.apply = () => { if (p.classList.contains('collapsed') === want()) return false; tap?.call(btn); return true; };
  uxTrayInit.apply(); addEventListener('resize', () => { const moved = uxTrayInit.apply(); uxTray(); if (moved && !modalOpen) uxApplyPlayView(false); });   // the free map area changed
  const ui = updateUI; updateUI = function (...a) { const r = ui.apply(this, a); uxTray(); return r; };
  uxTray();
}
// The dock shows which hub's sheet is open; nothing is highlighted while the map is in front.
function uxDockState() {
  const open = typeof modalOpen !== 'undefined' && modalOpen ? uxDockState.hub : null;
  for (const k of ['goal', 'build', 'money']) uxEl('hub-' + k)?.classList?.toggle('is-open', open === k);
}
// Only events.js notices bypass economy.js's dismissal handler. Leave weather/construction and permanent hints
// with their existing owner; their text can recur in a later event. Note: .agents/notes/implemented/feature/2026-11-08-design-pass.md
function uxNoticeKey(t) {
  if (/^★/.test(t) && typeof activityState === 'function') {
    const st = activityState();
    if (st.offers.length) return 'offers:' + st.offers.map(e => e.id).join(',');
    if (st.active) return 'activity:' + st.active.id + (S.day < st.active.start ? ':preparing' : ':running');
  }
  if (t.includes(' · 即将开放 ')) {
    const c = realCities().find(c => c.dormant && t.startsWith(c.name + ' · 即将开放 '));
    if (c) return 'opening:' + c.id + ':' + c.openingAt;
  }
  return null;
}
// The top notice gets a category icon on its left, the same round slot as the undo pill and the edge pointers. Only an
// attribute is set (other layers read the notice text); a leading ★ / ♪ in the text is hidden since the icon says it.
const UX_NOTICE_KINDS = [['activity', /^★|活动|邀请/], ['concert', /^♪|音乐|演出/], ['weather', /雨|雾|台风|天气/], ['damage', /受损|断开|断线|待拆/], ['works', /施工/], ['opening', /开放|新城|待接入/]];
function uxNoticeIcon() {
  const n = uxEl('notice'), wrap = n?.closest?.('.notice-wrap'); if (!n || !wrap || typeof MutationObserver !== 'function') return;
  const apply = () => { const t = n.textContent || '', k = t ? (UX_NOTICE_KINDS.find(([, re]) => re.test(t))?.[0] || 'info') : '', sym = /^[★♪]/.test(t) ? '1' : '';
    if (wrap.dataset.kind !== k) wrap.dataset.kind = k; if ((wrap.dataset.sym || '') !== sym) wrap.dataset.sym = sym; };
  new MutationObserver(apply).observe(n, { childList: true, characterData: true, subtree: true }); apply();
}
function uxNoticeDismiss() {
  const btn = uxEl('notice-close'), n = uxEl('notice'); if (!btn || !n) return;
  let closed = null; const up = btn.onclick;
  btn.onclick = function (...a) {
    const key = uxNoticeKey(n.textContent);
    if (!key) return up?.apply(this, a);
    // The upstream handler sees an earlier, possibly unrelated message under this overlay.
    closed = { state: S, key }; n.textContent = '';
  };
  const ui = updateUI; updateUI = function (...a) {
    const r = ui.apply(this, a), t = n.textContent;
    if (closed?.state !== S) closed = null;
    if (t && closed) { if (uxNoticeKey(t) === closed.key) n.textContent = ''; else closed = null; }
    return r;
  };
}
function uxEndedState() {
  const b = uxEl('pause'); if (!b) return;
  const tap = b.onclick, playLabel = b.getAttribute?.('aria-label') || '暂停或继续';
  b.onclick = function (e) { if (S && S.lives <= 0) { if (typeof gameover === 'function') gameover(); return; } return tap?.call(this, e); };
  const ui = updateUI; updateUI = function (...a) {
    const r = ui.apply(this, a), ended = !!S && S.lives <= 0;
    if (b.classList?.contains('is-ended') !== ended) b.classList?.toggle('is-ended', ended);
    if (ended) { if (b.textContent !== '结算') b.textContent = '结算'; b.setAttribute?.('aria-label', '本局已结束，查看结算'); }
    else if (b.getAttribute?.('aria-label') === '本局已结束，查看结算') b.setAttribute('aria-label', playLabel);
    return r;
  };
}
// Achievements (upstream v1.4): same data and side effects (sync, mark seen, persist), a denser page — a summary with
// the count per medal, each category with its own count, compact rows (medal · name and condition · status) and a
// progress bar only where there is a count to make. Wide sheets put rows in two columns.
function uxAchievementsHTML() {
  const A = ACHIEVEMENTS14, st = achievements14, got = id => !!st.unlocked[id];
  const tierName = { bronze: '铜', silver: '银', gold: '金', diamond: '钻石' }, mapName = { east: '东部', west: '西部' };
  const n = A.filter(a => got(a.id)).length;
  const tiers = ['bronze', 'silver', 'gold', 'diamond'].map(g => { const all = A.filter(a => a.grade === g); return `<span class="uxa-tier ${g}" title="${tierName[g]}牌" aria-label="${tierName[g]}牌 ${all.filter(a => got(a.id)).length} / ${all.length}">${achBadge14(g)}<b>${all.filter(a => got(a.id)).length}</b><small>/ ${all.length}</small></span>`; }).join('');
  let html = `<div class="modal-head"><div><span class="eyebrow">旅途荣誉</span><h2>成就</h2></div><button class="close" onclick="closeModal()" aria-label="关闭成就">×</button></div>
<section class="uxa-sum"><div class="uxa-count"><b>${n}</b><span>/ ${A.length} 已解锁</span></div><div class="uxa-bar"><i style="width:${n / A.length * 100}%"></i></div><div class="uxa-tiers">${tiers}</div><p>跨对局保留，重新开始不清空；不提供现金或运力奖励。</p></section>`;
  const fmt = (a, v) => achPercent14(a.id) ? (v > 0 && v < .01 ? (Math.floor(v * 1e4) / 1e4).toFixed(4) : (Math.floor(v * 100) / 100).toFixed(2)) + ' / ' + a.target + '%' : Math.floor(v) + ' / ' + a.target;
  for (const cat of new Set(A.map(a => a.category))) {
    const rows = A.filter(a => a.category === cat);
    html += `<h3 class="uxa-cat"><span>${cat}</span><small>${rows.filter(a => got(a.id)).length} / ${rows.length}</small></h3><div class="uxa-list">`;
    for (const a of rows) {
      const u = st.unlocked[a.id], v = Math.min(a.target, st.best[a.id] || 0), counted = a.target > 1 && !u;
      const where = u ? [mapName[u.map], Number.isFinite(u.day) ? '第' + u.day + '天' : ''].filter(Boolean).join(' ') : '';
      const status = u ? `<span class="uxa-st is-done">已解锁</span>` : counted ? `<span class="uxa-st">${fmt(a, v)}</span>` : `<span class="uxa-st is-none">未解锁</span>`;
      html += `<section class="ach-row14 uxa-row ${u ? 'is-done' : 'is-locked'} ${a.grade}">${achBadge14(a.grade)}<div class="uxa-txt"><h4>${a.name}<small>${tierName[a.grade]}</small></h4><p>${a.description}</p>${where ? `<small class="uxa-when">${where}</small>` : ''}</div>${status}${counted ? `<div class="uxa-prog"><i style="width:${Math.min(100, v / a.target * 100)}%"></i></div>` : ''}</section>`;
    }
    html += '</div>';
  }
  return html;
}
function uxAchievements() {
  if (typeof showAchievements14 !== 'function' || showAchievements14.ux) return;
  const show = showAchievements14;
  showAchievements14 = function (...a) {
    const om = openModal;
    openModal = function (html, ...r) { let mine = html; try { mine = uxAchievementsHTML(); } catch {} return om.call(this, mine, ...r); };
    try { return show.apply(this, a); } finally { openModal = om; }
  };
  showAchievements14.ux = true;
  const b = uxEl('achievements-entry14'); if (b) b.onclick = () => showAchievements14();
}
// v1.5 save-and-exit button (update123.js): an exit glyph (door, arrow out); its label and action stay upstream's
function uxExitIcon() {
  const b = uxEl('game-exit'); if (!b || b.dataset.ux) return;
  b.dataset.ux = '1'; b.title = b.getAttribute('aria-label') || '保存与退出';
  b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/><path d="M14 8l4 4-4 4M18 12H9"/></svg>';
}
// City-activity invitations (抽卡) are drawn mid-game: for every possible host town, every other town's full transfer
// route is planned (activitySources → plan → serviceTravelTime → edgeTime), with the same edges timed again and
// again. Late in a match this froze the game for seconds (tens of seconds on Android WebView) the moment an
// invitation fell due. Upstream already memoises routes and travel times inside a routing batch (performance.js,
// used for vehicle arrivals); the draw is one synchronous computation on an unchanging state, so it runs inside its
// own batch too. Same routes, same results — computed once.
function uxBatchOffers() {
  if (typeof generateActivityOffers !== 'function' || generateActivityOffers.uxBatch || typeof routingBatch === 'undefined') return;
  const gen = generateActivityOffers;
  generateActivityOffers = function (...a) {
    if (routingBatch) return gen.apply(this, a);   // already inside one
    routingBatch = { routes: new Map(), travel: new Map() };
    try { return gen.apply(this, a); } finally { routingBatch = null; }
  };
  generateActivityOffers.uxBatch = true;
}
// Late networks: touches land on lines and stations almost everywhere, so a drag used to grab whatever was under the
// finger (user 2026-11-15, 拉线打架). Now a drag edits a line only when that line is the one selected:
// - from a station shared by several lines: a new line starts there (it used to pop the line picker, so no new line
//   could be drawn from a busy station; a tap still opens the picker). A station on one line keeps upstream's drag —
//   extend from an end, pull a stop off — which the v1.5.9 tutorial teaches;
// - from a stretch of line: the selected line is pulled (elastic); any other line under the finger is just map → pan.
// Upstream's edit mode (a line chosen in the picker: draft.tapEdit132) and pinch are untouched.
function uxGestureRules() {
  if (typeof movePointer !== 'function' || movePointer.uxRules) return;
  const mv = movePointer;
  movePointer = function (e) {
    const g = gesture;
    // the tutorial (update123–129, tutorial159) teaches dragging an unselected road and stop: keep that while it runs
    const tutorial = S?.tutorial123?.stage && S.tutorial123.stage !== 'done';
    if (g && g.kind === 'tap' && !g.uxRuled && !tutorial && !draft && pointers.size === 1 && Math.hypot(e.clientX - g.start.x, e.clientY - g.start.y) > 14) {
      g.uxRuled = true;
      const sel = selected?.type === 'line' ? selected.id : selected?.type === 'stop' ? selected.line : selected?.type === 'junction' ? selected.preferred : null;
      if (g.c) { if (g.ambiguousLines && !g.cityLine) g.ambiguousLines = null; }   // shared station: a new line (single-line stations keep upstream's extend / remove-stop drag, taught by tutorial159)
      else if (g.rh && g.rh.l?.id !== sel) g.rh = null;
    }
    return mv.call(this, e);
  };
  movePointer.uxRules = true;
}
// While drawing, a station attaches at once when the finger passes its centre (v1.5.3), so a quick stroke across a
// late network picked up every town on the way. A fast-moving finger (> ~350 px/s over the last 100 ms) now has to
// pause on a town (the 90 ms dwell upstream already uses for the wider halo); slow passes and pauses attach as before.
let uxStrokeSpeed = 0, uxStrokeTrail = [];
function uxSwipeAttach() {
  if (typeof addDraftCity !== 'function' || addDraftCity.uxSwipe || typeof cv === 'undefined') return;
  cv.addEventListener('pointermove', e => {
    const t = e.timeStamp || performance.now(); uxStrokeTrail.push({ x: e.clientX, y: e.clientY, t });
    while (uxStrokeTrail.length > 2 && t - uxStrokeTrail[0].t > 100) uxStrokeTrail.shift();
    const o = uxStrokeTrail[0]; uxStrokeSpeed = t > o.t ? Math.hypot(e.clientX - o.x, e.clientY - o.y) / (t - o.t) : 0;
  }, { capture: true, passive: true });
  cv.addEventListener('pointerdown', e => { uxStrokeSpeed = 0; uxStrokeTrail = [{ x: e.clientX, y: e.clientY, t: e.timeStamp || performance.now() }]; }, { capture: true, passive: true });
  const add = addDraftCity;
  addDraftCity = function (c, force = false, ...rest) {
    if (!(S?.tutorial123?.stage && S.tutorial123.stage !== 'done') && !(typeof isMarine16 === 'function' && isMarine16(draft?.type)) && !force && gesture?.kind === 'draft' && draft?.pointer && uxStrokeSpeed > .35 && c?.kind !== 'bridgehead') {
      const p = draft.pointer; draft.pointer = null;   // hides the centre test of map-revision153 → the dwell guard decides
      try { return add.call(this, c, force, ...rest); } finally { if (draft) draft.pointer = p; }
    }
    return add.call(this, c, force, ...rest);
  };
  addDraftCity.uxSwipe = true;
}
// While a route is drawn or re-routed, other lines' bridge and tunnel decks (drawn in full colour) are toned down with
// the lines themselves; building a bridge keeps them as they are.
function uxDraftInfra() {
  // tunnel mouths and bridge decks are drawn per line segment (drawTunnelSpans) in full colour: they fade with their line
  if (typeof drawTunnelSpans === 'function' && !drawTunnelSpans.uxFade) {
    const ts = drawTunnelSpans;
    drawTunnelSpans = function (a, b, l, ...r) {
      if (ctx.canvas !== cv || !l || l === draft) return ts.call(this, a, b, l, ...r);
      const f = draft ? (draft.original ?? -1) : uxHandleFocus(), k = f !== null && f !== undefined ? (l.id === f ? 1 : .25) : (typeof LINE_ALPHA === 'function' ? LINE_ALPHA(l, null) : 1);
      if (k >= 1) return ts.call(this, a, b, l, ...r);
      // upstream sets globalAlpha = 1 inside: for this call, whatever it sets is scaled by the line's fade
      const d = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(ctx), 'globalAlpha');
      if (!d?.set) return ts.call(this, a, b, l, ...r);
      Object.defineProperty(ctx, 'globalAlpha', { configurable: true, get() { return d.get.call(this); }, set(v) { d.set.call(this, v * k); } });
      ctx.save(); ctx.globalAlpha = 1;
      try { return ts.call(this, a, b, l, ...r); } finally { ctx.restore(); delete ctx.globalAlpha; }
    };
    drawTunnelSpans.uxFade = true;
  }
  if (typeof drawInfrastructure !== 'function' || drawInfrastructure.uxDraft) return;
  const di = drawInfrastructure;
  drawInfrastructure = function (...a) {
    if (!draft || bridgeDraft || ctx.canvas !== cv) return di.apply(this, a);
    ctx.save(); ctx.globalAlpha *= .4; try { return di.apply(this, a); } finally { ctx.restore(); }
  };
  drawInfrastructure.uxDraft = true;
}
// Portrait header in one row (user 2026-11-16: the second row held four buttons on the right and nothing on the left).
// Help, sound settings and save-and-exit are occasional: they move into one menu (☰) at the left; date, funds/lives
// and play/speed share the single row. The original buttons stay in the page and the menu clicks them, so their
// behaviour (and upstream's handlers) is unchanged. Landscape and desktop keep the original header.
function uxHeaderMenu() {
  const head = document.querySelector('header'); if (!head || uxEl('ux-menu')) return;
  const btn = document.createElement('button'); btn.id = 'ux-menu'; btn.type = 'button'; btn.className = 'ctl'; btn.setAttribute('aria-label', '菜单'); btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M5 12h14M5 17h14"/></svg>';
  const pop = document.createElement('div'); pop.id = 'ux-menu-pop'; pop.hidden = true; pop.setAttribute('role', 'menu');
  const items = [['help', '操作说明', () => uxEl('help')], ['sound', '声音设置', () => document.querySelector('.effects-button156')], ['exit', '保存并退出', () => uxEl('game-exit')]];
  pop.innerHTML = items.map(([k, t]) => '<button type="button" role="menuitem" data-k="' + k + '">' + t + '</button>').join('');
  const close = () => { pop.hidden = true; btn.setAttribute('aria-expanded', 'false'); };
  btn.onclick = e => { e.stopPropagation(); pop.hidden = !pop.hidden; btn.setAttribute('aria-expanded', String(!pop.hidden)); haptic(); };
  pop.onclick = e => { const b = e.target.closest('[data-k]'); if (!b) return; close(); items.find(i => i[0] === b.dataset.k)?.[2]()?.click(); };
  document.addEventListener('pointerdown', e => { if (!pop.hidden && !pop.contains(e.target) && e.target !== btn && !btn.contains(e.target)) close(); }, true);
  head.prepend(btn); document.body.appendChild(pop);
}
// Feedback in one place (user 2026-11-16: 撤回条、反馈提示散落在地图上). The momentary message (toast) and the
// construction undo share one capsule above the bottom sheet: "线路已应用 · 支出 ¥6800 | ↶ 撤回 19秒" while both show,
// then "↶ 撤回建线 · 19秒 · 全退 ¥6800" alone until the undo window closes. Both elements keep their ids, text and
// handlers (upstream writes them); the capsule only holds and places them (uxPlaceToast).
function uxFeedbackBox() {
  const t = uxEl('toast'), u = uxEl('undo-build'); if (!t || !u || uxEl('ux-feedback') || !t.parentNode || typeof MutationObserver !== 'function') return;
  const fb = document.createElement('div'); fb.id = 'ux-feedback';
  t.parentNode.insertBefore(fb, t); fb.append(t, u);
  const sync = () => {
    const msg = t.classList.contains('show'), undo = !u.hidden, on = msg || undo;
    const short = '撤回 ' + ((u.textContent || '').match(/(\d+)\s*秒/)?.[1] || '') + '秒';
    if (!msg) fb.uxText = null;   // a new message (or none) picks its place afresh
    if (u.dataset.short !== short) u.dataset.short = short;
    fb.classList.toggle('has-msg', msg); fb.classList.toggle('has-undo', undo);
    if (fb.classList.contains('show') !== on) fb.classList.toggle('show', on);
    if (on) uxPlaceToast();
  };
  try {
    new MutationObserver(sync).observe(t, { attributes: true, attributeFilter: ['class'] });
    new MutationObserver(sync).observe(u, { attributes: true, attributeFilter: ['hidden'], childList: true, characterData: true, subtree: true });
  } catch { t.parentNode === fb && fb.before(t); u.parentNode === fb && fb.before(u); fb.remove(); return; }   // no observers: leave both as they were
  sync();
}
// Facility notices (revision130 "新设施可以建设了") wait until the player has built a first line (or day 3): the weather
// station and the hub are available from the start, so they popped up over the map in the first second of every new
// game — before the player had seen the towns. The hub's unread dot is set as before; only the popup waits.
function uxNoticeTiming() {
  if (typeof showNotice130 !== 'function' || showNotice130.ux) return;   // only this popup: activity offers keep their own timing
  const sn = showNotice130;
  showNotice130 = function (...a) { if (!S || (selected && !uxEl('details')?.hidden) || (!S.lines?.length && S.day < 3)) return; return sn.apply(this, a); };
  showNotice130.ux = true;
}
// v1.6 vehicle trading (release16 appends 「车辆买卖」 to the shop): one row per type even with nothing in stock, plus
// one 回收 row per running vehicle — a long list of grey buttons in a new game and dozens of rows late. Stock rows are
// kept only for types in stock (or one quiet line); running vehicles fold away under 「运行中车辆 N 辆 · 回收」 (the line
// sheet's − already recalls one by one). Rows, buttons and handlers are upstream's, only regrouped.
function uxFleetSale() {
  if (typeof shop !== 'function' || shop.uxSale) return;
  const sh = shop;
  shop = function (...a) {
    const r = sh.apply(this, a), sec = uxEl('modal-content')?.querySelector('.fleet-sale16'); if (!sec || sec.dataset.ux) return r;
    sec.dataset.ux = '1';
    const rows = [...sec.querySelectorAll(':scope > .quote-row')], stock = [], run = [];
    for (const row of rows) (/#\d+/.test(row.querySelector('span')?.textContent || '') ? run : stock).push(row);
    for (const row of stock) if (row.querySelector('button')?.disabled) row.remove();
    if (!stock.some(r => r.isConnected)) { const p = document.createElement('p'); p.className = 'ux-sale-empty'; p.textContent = '库存里没有车辆可出售'; (run[0] || null) ? run[0].before(p) : sec.appendChild(p); }
    if (run.length) { const d = document.createElement('details'); d.className = 'ux-rules ux-sale-run'; d.innerHTML = '<summary>运行中车辆 ' + run.length + ' 辆 · 回收</summary>'; run[0].before(d); run.forEach(x => d.appendChild(x)); }
    return r;
  };
  shop.uxSale = true;
}
// Life-loss record: which station cost each life, with its queue at that moment (kept with the game, last 5)
function uxLifeLog() {
  if (typeof updateCongestion !== 'function' || updateCongestion.uxLog) return;
  const uc = updateCongestion;
  updateCongestion = function (c, ...a) {
    if (S.lives <= 0) return;
    const before = S.lives, n = c?.q ? c.q.filter(p => !p.cardId && !p.eventId).length : 0, cap = typeof capacity === 'function' && c ? capacity(c) : 0;
    const r = uc.call(this, c, ...a);
    if (S.lives < before && c) { (S.uxLifeLog ||= []).push({ id: c.id, name: c.name, day: Math.floor(S.day), n, cap }); if (S.uxLifeLog.length > 5) S.uxLifeLog.shift(); }
    return r;
  };
  updateCongestion.uxLog = true;
  // a finished run is looked back at: invitations and other notices no longer ask for anything
  const ui = updateUI; updateUI = function (...a) {
    const r = ui.apply(this, a);
    if (S && S.lives <= 0) { const n = uxEl('notice'); if (n && n.textContent) n.textContent = ''; }
    return r;
  };
}
// Harbours (v1.6 双洋大陆; user 2026-11-18): the map's own facility was a button added by marine16 at the very end of the
// city sheet, below everything — on a 360px phone the player had to open the sheet fully and scroll to find it. For a
// city that can have a harbour it now leads the 设施 strip: 建港口 ¥1500 → 本城港口 · 再建一座可开航 (only one harbour
// on the map: nothing to sail to yet) → 本城港口 · 开航线 (starts a sea route from here). Building and routing use
// upstream's buildHarbor16 / beginHarborRoute164; the bottom row it replaces is removed.
function uxHarborChip() {
  if (typeof showDetails !== 'function' || showDetails.uxHarbor) return;
  const sd = showDetails;
  showDetails = function (...a) {
    const r = sd.apply(this, a);
    try {
      const el = uxEl('details'), row = el?.querySelector(':scope > .harbor16'), c = selected?.type === 'city' ? S.cities[selected.id] : null;
      if (!row || !c || typeof isOcean16 !== 'function' || !isOcean16()) return r;
      row.remove(); el.querySelector(':scope > .harbor-connect164')?.remove();
      if (S.lives <= 0 && !c.harbor) { el.querySelector('.ux-harbor')?.remove(); return r; }
      let strip = el.querySelector(':scope > .ux-fac-strip');
      if (!strip) { strip = document.createElement('div'); strip.className = 'ux-fac-strip'; strip.innerHTML = '<span>设施</span>'; (el.querySelector(':scope > .ux-load') || el.querySelector(':scope > .detail-sub'))?.after(strip); }
      strip.querySelector('.ux-harbor')?.remove();
      const ports = realCities().filter(x => x.harbor && !x.dormant).length, b = document.createElement('button'); b.type = 'button'; b.className = 'ux-harbor';
      if (S.lives <= 0) { b.textContent = '⚓ 本城港口 · 已建成'; b.classList.add('is-note'); b.disabled = true; }
      else if (!c.harbor) { b.innerHTML = '<i>⚓</i>建港口 <small>¥1500</small>'; b.onclick = e => { e.stopPropagation(); buildHarbor16(c.id); showDetails(true); }; if (S.points < 1500) b.classList.add('is-off'); }
      else if (ports < 2) { b.innerHTML = '<i>⚓</i>本城港口 <small>再建一座可开航</small>'; b.classList.add('is-note'); b.disabled = true; }
      else { b.innerHTML = '<i>⚓</i>本城港口 <small>开航线 ↗</small>'; b.onclick = e => { e.stopPropagation(); if (typeof beginHarborRoute164 === 'function') beginHarborRoute164(c.id); }; }
      strip.querySelector(':scope > span')?.after(b);
      // the harbour note (harbor-connection164) goes from under the title to the foot of the sheet: it explains, it is not a status
      const note = el.querySelector(':scope > .harbor-shared163'); if (note) { b.title = note.textContent.replace(/^⚓\s*/, ''); note.classList.add('ux-harbor-note'); el.appendChild(note); el.querySelector(':scope > .ux-peekbar') && el.appendChild(el.querySelector(':scope > .ux-peekbar')); }
    } catch {}
    return r;
  };
  showDetails.uxHarbor = true;
}
function uxLate() {
  if (uxLate.done) return;   // wrapping twice would stack every layer; done only once the last layer (events.js) is loaded
  if (typeof activityState === 'function') uxLate.done = true;
  uxWrapLateDrawers(); uxWrapLatePanels(); uxWrapHubs(); uxWrapWelcome();
  uxEndedState(); uxTrayInit(); uxModeStyle(); uxAchievements(); uxExitIcon(); uxBatchOffers(); uxGestureRules(); uxSwipeAttach(); uxDraftInfra(); uxHeaderMenu(); uxFeedbackBox(); uxNoticeTiming(); uxFleetSale(); uxLifeLog(); uxHarborChip();
  if (typeof startAtlasMap === 'function') { const sa = startAtlasMap; startAtlasMap = function (...a) { const r = sa.apply(this, a); if (typeof atlasMenuOpen === 'undefined' || !atlasMenuOpen) uxApplyPlayView(false); return r; }; }
  if (!modalOpen && (typeof atlasMenuOpen === 'undefined' || !atlasMenuOpen)) uxApplyPlayView(false);
  uxEl('hub-build')?.classList?.remove('is-primary');
  { const oh = uxOpenHub; uxOpenHub = function (k, ...a) { uxDockState.hub = k; const r = oh.call(this, k, ...a); uxDockState(); return r; }; }
  { const cm = closeModal; closeModal = function (...a) { const r = cm.apply(this, a); uxDockState(); return r; }; }
  // later layers set the notice text inside their own updateUI; rename after all of them
  const ui = updateUI; updateUI = function (...a) { const r = ui.apply(this, a); const n = uxEl('notice'); if (n && /运营中心|工程采购|交通采购|收支账本/.test(n.textContent)) n.textContent = uxRename(n.textContent); return r; };
  const ui2 = updateUI; updateUI = function (...a) {
    const r = ui2.apply(this, a);
    const b = uxEl('hub-goal')?.querySelector?.('.dock-badge'), s = typeof activityState === 'function' ? activityState() : null;
    if (b) b.hidden = !(s && s.offers?.length && !s.active);
    return r;
  };
  uxEl('notice')?.closest?.('.notice-wrap')?.addEventListener('click', e => { if (e.target.closest('#notice-close')) return; if (/活动邀请/.test(uxEl('notice').textContent)) uxOpenHub('goal', 1); });
  uxNoticeIcon();
  uxNoticeDismiss();   // outermost: sees the banner text after every layer (and the rename) has written it
  updateUI();
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', uxLate); else uxLate();

const uxText = text;
text = function (t, x, y, size = 12, color, align) {
  globalThis.uxHaloOK = size >= 9;
  if (ctx.canvas === cv) {
    const m = ctx.getTransform?.(), k = m ? Math.hypot(m.a, m.b) / (dpr || 1) : view.scale;
    if (k < .85) size *= Math.min(1.35, .85 / k);
  }
  try { return uxText(t, x, y, size, color, align); } finally { globalThis.uxHaloOK = true; }
};

/* ---------- detail sheet: peek first, expand on demand, keep the subject in view ---------- */
// Phones in portrait: a new selection opens as a short "peek" (title, numbers, main actions) so the map stays
// usable. Swipe up or tap the grip for everything; swipe down to go back to peek, then to close.
// Whatever the sheet covers, the selected city or line (or a range preview) is framed in the space above it.
function uxViewFor(p, cx, cy, s) { return view.rot ? { x: cx + p.y * s, y: cy - p.x * s, scale: s } : { x: cx - p.x * s, y: cy - p.y * s, scale: s }; }
function uxVisibleRect() {
  const header = (document.querySelector('header')?.getBoundingClientRect().bottom || 60) + 8;
  // Panels are cut first against the header alone; notices and the undo pill are overlays applied afterwards.
  const overlays = Math.max(0, ...['.top-stack'].map(q => { const e = document.querySelector(q); const r = e && !e.hidden && e.getBoundingClientRect(); return r && r.height ? r.bottom + 12 : 0; }));
  const rect = { l: 14, r: W - 14, b: H - 12, t: header };
  // Panels can sit at the bottom (portrait sheets, docks) or at a side (landscape details, route list).
  // For each one that overlaps the map, trim whichever edge keeps the larger usable area.
  for (const q of ['#details', '#junction-picker', '#routes', 'footer .dock', '#drawbar']) {
    const e = document.querySelector(q); if (!e || e.hidden || typeof getComputedStyle === 'function' && getComputedStyle(e).display === 'none') continue;
    const p = e.getBoundingClientRect();
    if (!(p.bottom > p.top && p.right > p.left) || p.right <= rect.l || p.left >= rect.r || p.bottom <= rect.t || p.top >= rect.b) continue;
    const options = [{ ...rect, b: Math.min(rect.b, p.top - 12) }, { ...rect, t: Math.max(rect.t, p.bottom + 12) },
      { ...rect, r: Math.min(rect.r, p.left - 12) }, { ...rect, l: Math.max(rect.l, p.right + 12) }]
      .filter(o => o.r - o.l >= 60 && o.b - o.t >= 40);
    if (!options.length) continue;
    Object.assign(rect, options.reduce((x, y) => (y.r - y.l) * (y.b - y.t) > (x.r - x.l) * (x.b - x.t) ? y : x));
  }
  // Keep clear of the notices only when that still leaves real room (a fully expanded portrait sheet does not):
  // overlays may be overlapped, panels may not.
  if (rect.b - Math.max(rect.t, overlays) >= 80) rect.t = Math.max(rect.t, overlays);
  return rect;
}
// Move (and only if needed, zoom out) so every world point plus its padding sits inside the visible rect.
function uxFrame(points, pad = 60) {
  if (!points.length) return;
  const rect = uxVisibleRect(), sp = points.map(p => toScreen(p)), padPx = pad * view.scale;
  const box = { l: Math.min(...sp.map(p => p.x)) - padPx, r: Math.max(...sp.map(p => p.x)) + padPx, t: Math.min(...sp.map(p => p.y)) - padPx, b: Math.max(...sp.map(p => p.y)) + padPx };
  if (box.l >= rect.l && box.r <= rect.r && box.t >= rect.t && box.b <= rect.b) return;
  const fit = Math.min(1, (rect.r - rect.l) / (box.r - box.l), (rect.b - rect.t) / (box.b - box.t));
  const s = Math.max(minScale(), view.scale * fit);
  const cx = points.reduce((n, p) => n + p.x, 0) / points.length, cy = points.reduce((n, p) => n + p.y, 0) / points.length;
  animateView(uxViewFor({ x: cx, y: cy }, (rect.l + rect.r) / 2, (rect.t + rect.b) / 2, s), 300);
}
function uxSelectionPoints() {
  if (!selected) return [];
  if (selected.type === 'line') return [...(S.lines.find(l => l.id === selected.id)?.stops || []).map(i => S.cities[i]).filter(Boolean), ...uxHandles().filter(h => h.line.id === selected.id)];
  if (['city', 'stop', 'junction'].includes(selected.type)) return [S.cities[selected.id]].filter(Boolean);
  if (selected.type === 'vehicle') { const v = S.vehicles.find(x => x.id === selected.id), p = v && vehiclePose(v); return p ? [p] : []; }
  return [];
}
let uxPreviewFrame = null;   // {c, radius} while a range preview is shown
// Upstream draws the circles from meteoPreview / repairCenterPreview; they end when their city stops being the selection.
// Note: preview/session cleanup — .agents/notes/implemented/feature/2026-11-05-portrait-rotation.md
function uxSyncPreviews() {
  const id = ['city', 'stop'].includes(selected?.type) && !uxEl('details')?.hidden ? selected.id : null;
  let ended = false;
  if (typeof meteoPreview !== 'undefined' && meteoPreview && meteoPreview.id !== id) { meteoPreview = null; ended = true; }
  if (typeof repairCenterPreview !== 'undefined' && repairCenterPreview && repairCenterPreview.id !== id) { repairCenterPreview = null; ended = true; }
  // clearSelection may already have cleared the upstream circle; the framing state still owns its hint.
  if (uxPreviewFrame && !uxPreviewOwns()) { uxPreviewFrame = null; ended = true; }
  // the preview's own hint ("气象站覆盖预览 · 再点…", "检修中心半径…覆盖范围") goes with it
  const t = uxEl('toast'); if (ended && t?.classList?.contains('show') && /覆盖预览|覆盖范围/.test(t.textContent)) t.classList.remove('show');
}
function uxPreviewOwns() { return !!uxPreviewFrame && ['city', 'stop'].includes(selected?.type) && S.cities[selected.id] === uxPreviewFrame.c; }
function uxFrameSelection() {
  // a range preview frames only while its own city is the selection (another city's sheet must not inherit it)
  if (uxPreviewFrame && !uxPreviewOwns()) uxPreviewFrame = null;
  if (uxPreviewFrame) { const { c, radius: r } = uxPreviewFrame; uxFrame([{ x: c.x - r, y: c.y - r }, { x: c.x + r, y: c.y + r }], 10); return; }
  const full = uxEl('details')?.classList.contains('is-full');
  uxFrame(uxSelectionPoints(), selected?.type === 'line' ? (full ? 30 : 50) : (full ? 36 : 90));
}
function uxPeekBar() {
  const d = uxEl('details'); if (!d || d.hidden || !d.appendChild) return;
  let b = d.querySelector(':scope > .ux-peekbar');
  if (!b) { b = document.createElement('button'); b.className = 'ux-peekbar'; b.innerHTML = '展开全部 <i>⌃</i>'; b.onclick = () => uxSheetSet('full'); d.appendChild(b); }
  uxPeekFit();
}
// Peek shows the essentials and stops there (user 2026-11-16: compact portrait): a line down to its stops and route
// tools, a city down to its facility strip. The sheet's own cap (36%) still applies; everything else is one tap away.
function uxPeekFit() {
  const d = uxEl('details'); if (!d?.style?.setProperty) return;
  if (!portraitMode || d.hidden || !d.classList.contains('is-peek')) { d.style.removeProperty('max-height'); return; }
  const cut = selected?.type === 'line' ? (d.querySelector(':scope > .ux-route-tools.is-picking') || d.querySelector(':scope > .ux-route'))
    : (d.querySelector(':scope > .ux-fac-strip') || d.querySelector(':scope > .ux-load'));
  if (!cut || !cut.offsetHeight) { d.style.removeProperty('max-height'); return; }
  const h = Math.ceil(cut.offsetTop + cut.offsetHeight + 8 + 30);   // + the 30px peek bar
  if (d.style.getPropertyValue('max-height') !== h + 'px') d.style.setProperty('max-height', h + 'px', 'important');
}
function uxSheetSet(state) {
  const d = uxEl('details'); if (!d) return;
  d.classList.toggle('is-peek', state === 'peek'); d.classList.toggle('is-full', state === 'full');
  uxPeekFit();
  if (state === 'peek') d.scrollTop = 0;
  setTimeout(() => requestAnimationFrame(uxFrameSelection), 240);   // after the height transition
}
(function sheetStates() {
  const d = uxEl('details'); if (!d?.getBoundingClientRect || typeof MutationObserver === 'undefined') return;
  let lastKey = '';
  new MutationObserver(() => {
    if (d.hidden || !selected) { lastKey = ''; uxSyncPreviews(); d.classList.remove('is-peek', 'is-full'); return; }
    const k = selected.type + ':' + selected.id;
    if (k !== lastKey) { lastKey = k; uxSyncPreviews(); uxSheetSet('peek'); }
    uxPeekBar();
  }).observe(d, { attributes: true, attributeFilter: ['hidden'], childList: true });
  let y0 = null, top0 = 0;
  d.addEventListener('touchstart', e => { y0 = e.touches[0].clientY; top0 = d.scrollTop; }, { passive: true });
  d.addEventListener('touchend', e => {
    if (y0 === null || !portraitMode) return;
    const dy = e.changedTouches[0].clientY - y0, full = d.classList.contains('is-full'); y0 = null;
    if (dy < -40 && !full) { uxSheetSet('full'); haptic(); }
    else if (dy > 50 && top0 <= 0) { if (full) uxSheetSet('peek'); else clearSelection(); haptic(); }
  }, { passive: true });
  // mouse wheel: scrolling down on a peek opens the whole sheet; scrolling up at the top of a full sheet goes back
  d.addEventListener('wheel', e => {
    if (!portraitMode) return;
    if (d.classList.contains('is-peek') && e.deltaY > 0) { e.preventDefault(); uxSheetSet('full'); }
    else if (d.classList.contains('is-full') && e.deltaY < -20 && d.scrollTop <= 0) { e.preventDefault(); uxSheetSet('peek'); }
  }, { passive: false });
  d.addEventListener('click', e => { // a tap on the grip strip toggles; taps fire click on touch screens too
    if (portraitMode && e.clientY - d.getBoundingClientRect().top < 30 && !e.target.closest('button')) uxSheetSet(d.classList.contains('is-full') ? 'peek' : 'full'); });
})();
// Range previews: shrink the sheet and fit the whole circle above it.
for (const [name, radius] of [['previewMeteo', c => meteoPreview?.radius || 240], ['previewRepairCenter', () => typeof REPAIR_CENTER_RADIUS === 'number' ? REPAIR_CENTER_RADIUS : 300]]) {
  const f = globalThis[name]; if (typeof f !== 'function') continue;
  globalThis[name] = function (id, ...rest) {
    const r = f.call(this, id, ...rest), c = S.cities[id];
    if (c) { uxPreviewFrame = { c, radius: radius(c) }; uxSheetSet('peek'); }
    return r;
  };
}

/* ---------- map legibility: halos, fewer squares, quiet decorations while you work ---------- */
globalThis.TEXT_HALO = '#fffef9e6';   // soft outline keeps labels readable over lines and buildings
globalThis.QUEUE_SHOWN = 12;           // two rows of waiting squares, then "+n"
// A crowded city (more than two rows) shows one row and a pill with waiting / capacity, coloured by load: the number
// that decides what to do (181/128) is on the map instead of "+169" and a wall of squares.
// In a dense or zoomed-out view every city with more than one row waiting gets the one-row + pill form.
globalThis.QUEUE_SHOWN_FOR = c => { const n = c.q?.length || 0, dense = view.scale < 1 || realCities().filter(x => !x.dormant).length >= 8; return n > 12 || dense && n > 6 ? 6 : 12; };
// seconds of real time before this station costs a life, or null when it is not about to (the rule of release16.js
// updateCongestion: pressure grows while the hall is full and costs a life at 160 s, 205 s for a tourist town)
function uxLifeLeft(c) {
  if (S.lives <= 0 || !c || c.dormant || c.grace > 0 || c.shield > 0 || typeof capacity !== 'function') return null;
  const cap = capacity(c), n = c.q.filter(p => !p.cardId && !p.eventId).length; if (!cap || n < cap) return null;
  const limit = c.shape === 1 ? 205 : 160, rest = Math.max(0, limit - (c.congestionPressure || 0)), real = rest / Math.max(1, S.speed || 1);
  return real <= 30 ? Math.max(1, Math.ceil(real)) : null;
}
globalThis.QUEUE_TAIL = function (c, px, py) {
  const n = c.q.length, cap = typeof capacity === 'function' ? capacity(c) : 0, ratio = cap ? n / cap : 0;
  // close to losing a life (≤ 30 s of real time at the current speed): "44/24 · 距扣命约 12 秒"; back to the count on recovery
  const left = uxLifeLeft(c), label = (cap ? n + '/' + cap : String(n)) + (left !== null ? ' · 距扣命约 ' + left + ' 秒' : '');
  let w = 7 + label.length * 5.6, h = 11, font = 8.5, x = px + 6 * 11 + 2, y = py - 1;
  const [bg, fg] = ratio >= 1 ? ['#b5573f', '#fff'] : ratio >= .7 ? ['#e9c27a', '#4a3a1c'] : ['#eef1ea', '#4f5f58'];
  ctx.save();
  if (left !== null) {
    // The queue normally grows to the right. Keep a visible station's actionable warning on screen
    // even when its passenger squares run off the edge. No camera move or additional overlay.
    const k = view.scale * (globalThis.CITY_GLYPH?.() ?? 1), {x:sx, y:sy} = toScreen(c);
    font = 11 / k; h = 16 / k; y = py + 4.5 - h / 2;
    ctx.font = font + 'px system-ui,sans-serif'; w = ctx.measureText(label).width + 10 / k;
    if (sx >= 0 && sx <= W && sy >= 0 && sy <= H) {
      const width = w * k, height = h * k, row = sy + (y - c.y) * k, gap = radius(c) * k + 9;
      const center = Math.max(4, Math.min(W - width - 4, sx - width / 2));
      const spots = [[sx + (x - c.x) * k, row], [sx - gap - width, row],
        [center, sy - gap - height], [center, sy + gap]].filter(([x,y]) => x >= 4 && x + width <= W - 4 && y >= 4 && y + height <= H - 4);
      // A side switch must not put this station's warning over a neighbouring station.
      const free = ([x,y]) => !S.cities.some(o => {
        if (o === c || o.removed) return false;
        const p = toScreen(o), r = radius(o) * k + 4;
        return p.x + r > x && p.x - r < x + width && p.y + r > y && p.y - r < y + height;
      });
      const at = spots.find(free) || spots[0];
      if (at) { x = c.x + (at[0] - sx) / k; y = c.y + (at[1] - sy) / k; }
    }
  }
  ctx.globalAlpha *= .96; ctx.fillStyle = bg; ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, h / 2); else ctx.rect(x, y, w, h);
  ctx.fill();
  if (left !== null) {
    ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, x + w / 2, y + h / 2);
  }
  ctx.restore();
  if (left === null) text(label, x + w / 2, y + 8.3, font, fg);
  return true;
};
// "临江·起始城市圈": the region half is shown for the selected city or when zoomed in, not on every label.
globalThis.CITY_LABEL = (c, sel) => sel || view.scale >= 1.25 || !c.name.includes('·') ? c.name : c.name.split('·')[0];
globalThis.TIMERS_BELOW = true;        // countdowns sit under the name, not on the buildings
globalThis.SUBTITLE_MIN_SCALE = .8;    // "旅游 · 小镇" only when zoomed in (or the city is selected)
(function quietArt() {
  const art = drawCityArt;
  drawCityArt = function (c) {
    const busy = draft || bridgeDraft || selected?.type === 'line';
    globalThis.ART_ALPHA = busy ? .42 : 1;
    try { return art(c); } finally { globalThis.ART_ALPHA = 1; }
  };
})();
// Mission badges: show progress that means something; a row of "0/20" at overview zoom is noise.
drawMissionBadges = function () {
  for (const c of realCities()) {
    if (c.dormant) { if (S.lives > 0 && typeof drawCityOpening === 'function') drawCityOpening(c); continue; }
    const spec = missionSpec(c), rewarded = c.rewardUntil > S.day, label = rewarded ? '奖金已到账' : spec ? c.mission.progress + '/' + spec.goal : '繁荣';
    const focus = selected && ['city', 'stop', 'junction'].includes(selected.type) && selected.id === c.id;
    // the selected city, a just-paid reward, or a mission at least half done; everything else is in 目标 → 城市任务
    if (!rewarded && !focus && !(spec && c.mission.progress >= spec.goal / 2) && view.scale < 1.3) continue;
    roundBody(c.x - 28, c.y - 85 - c.size * 9, 56, 17, 5, rewarded ? '#e5efda' : '#fffdf6', '#e1e6d8', .8);
    text(label, c.x, c.y - 73 - c.size * 9, 8, rewarded ? '#577942' : '#879274');
  }
};

/* ---------- readable portrait: play view, size floors, no creeping zoom ---------- */
// The default camera frames the cities you are playing with at a readable scale instead of squeezing the whole
// world into a thumbnail. ⌖ toggles between this play view and the full overview. When the map is zoomed out,
// the things you act on (city nodes, names, waiting squares, lines) keep a minimum on-screen size; buildings
// and scenery do not, so the hierarchy reads at a glance.
const PLAY_MIN_SCALE = .66;
const UX_FIT_PAD = { l: 34, r: 86, t: 44, b: 58 };
// Lanes (lines sharing a corridor, side by side) used to taper to the city centre over 16% of each segment: on long
// segments that is a long fan, and at a junction the fans of several corridors overlap into a knot. The taper now
// happens within a fixed distance of the station — its drawn radius plus a little — so bundles stay parallel up to the
// station and converge underneath it. Vehicles use the same lanePoint, so they stay on their lines.
globalThis.LANE_RAMP = (a, b, len) => {
  const k = globalThis.CITY_GLYPH?.() ?? 1, reach = c => c && c.id !== undefined && c.kind !== 'bridgehead' ? radius(c) * k + 10 : 12;
  return [Math.min(.16, reach(a) / len), Math.min(.16, reach(b) / len)];
};
// ---------- transit-map lines ----------
// A segment stays straight when it must: air routes, segments touching a bridgehead, and segments whose straight
// chord or either leg needs a bridge or tunnel (river and mountain costs are computed along the chord, so a bent path
// must not cross water or rock somewhere the game did not price). The leg order is canonical by station id, so both
// directions and every line on the segment share one path and keep their lanes side by side.
// Each segment can bend two ways: diagonal first from one end or from the other. The bends are planned for the whole
// network, line by line in building order (so a new line never reshapes older ones): each segment takes the bend whose
// departure directions collide least with segments already placed at its two stations — two corridors leaving a
// station on the same ray would lie on top of each other. A bend that would cross water or rock is never used.
const UX_OCT_R = 20;                      // corner radius (world units)
const uxOctFree = (p, q, type) => { try { const r = requirements(p, q, type); return !r.invalid && !(r.bridge || r.tunnel); } catch { return false; } };
const uxOctDir = (p, q) => (Math.round(Math.atan2(q.y - p.y, q.x - p.x) / (Math.PI / 4)) + 8) % 8;
// Options per station pair are fixed while the towns and the terrain are: cached (lanePoint asks for them for every
// segment sample and every vehicle, each answer costing three terrain checks). The cache belongs to one game state and
// is dropped every few seconds anyway; the key carries the towns' coordinates.
let uxOctOptCache = {}, uxOctOptState = null, uxOctOptAt = 0;   // type → Map(pair number → { ax, ay, bx, by, o })
function uxOctOptions(a, b, type) {
  if (!a || !b || a.id === undefined || b.id === undefined || type === 'air' || a.kind === 'bridgehead' || b.kind === 'bridgehead' || a === b) return null;
  if (uxOctOptState !== S) { uxOctOptCache = {}; uxOctOptState = S; }
  const lo = a.id < b.id ? a : b, hi = lo === a ? b : a, m = uxOctOptCache[type] || (uxOctOptCache[type] = new Map()), k = lo.id * 65536 + hi.id, e = m.get(k);
  if (e && e.ax === lo.x && e.ay === lo.y && e.bx === hi.x && e.by === hi.y) return e.o;
  const o = uxOctOptionsNow(a, b, type); m.set(k, { ax: lo.x, ay: lo.y, bx: hi.x, by: hi.y, o }); return o;
}
function uxOctOptionsNow(a, b, type) {
  const lo = a.id < b.id ? a : b, hi = lo === a ? b : a, dx = hi.x - lo.x, dy = hi.y - lo.y, m = Math.min(Math.abs(dx), Math.abs(dy)), sx = Math.sign(dx), sy = Math.sign(dy);
  if (m < 6 || Math.max(Math.abs(dx), Math.abs(dy)) - m < 6 || !uxOctFree(lo, hi, type)) return null;
  const A = { x: lo.x + sx * m, y: lo.y + sy * m }, B = { x: hi.x - sx * m, y: hi.y - sy * m };
  const ok = bend => uxOctFree(lo, bend, type) && uxOctFree(bend, hi, type);
  return { lo, hi, A: ok(A) ? [lo, A, hi] : null, B: ok(B) ? [lo, B, hi] : null };
}
let uxOctPlan = new Map(), uxOctPlanKey = '', uxOctPlanAt = -1e9, uxOctPlanState = null, uxOctPlanCalls = 0;
function uxOctPlanNow() {
  // Paths retain city objects: map switches and reloads invalidate them before the time throttle.
  // Note: .agents/notes/implemented/feature/2026-11-08-design-pass.md (折线路径缓存)
  if (uxOctPlanState !== S) {
    uxOctPlanState = S; uxOctPlan = new Map(); uxOctPlanKey = null; uxOctPlanAt = -1e9; uxOctPlanCalls = 0;
  }
  // asked thousands of times a frame (every lane sample, every vehicle): the clock is read every 64th call only
  if (uxOctPlanCalls++ & 63) return uxOctPlan;
  const now = typeof performance !== 'undefined' ? performance.now() : 0;
  if (now - uxOctPlanAt < 200) return uxOctPlan;
  uxOctPlanAt = now;
  if (now - uxOctOptAt > 3000) { uxOctOptCache = {}; uxOctOptAt = now; }   // terrain checks are re-read every few seconds
  const lines = [...(S?.lines || []), ...(draft?.stops ? [draft] : [])];
  const key = lines.map(l => l.type + ':' + l.stops.join(',')).join('|');
  if (key === uxOctPlanKey) return uxOctPlan;
  uxOctPlanKey = key; const plan = new Map(), usage = new Map();
  const use = (id, d) => { if (!usage.has(id)) usage.set(id, new Map()); const u = usage.get(id); u.set(d, (u.get(d) || 0) + 1); };
  const cost = (id, d) => usage.get(id)?.get(d) || 0;
  for (const l of lines) for (let i = 1; i < l.stops.length; i++) {
    const a = S.cities[l.stops[i - 1]], b = S.cities[l.stops[i]], o = uxOctOptions(a, b, l.type); if (!o) continue;
    const pk = o.lo.id + '-' + o.hi.id + ':' + l.type; if (plan.has(pk)) continue;
    const score = p => p ? cost(o.lo.id, uxOctDir(o.lo, p[1])) + cost(o.hi.id, uxOctDir(o.hi, p[1])) : Infinity;
    const pick = o.A && o.B ? (score(o.B) < score(o.A) ? o.B : o.A) : o.A || o.B;
    plan.set(pk, pick || null);
    if (pick) { use(o.lo.id, uxOctDir(o.lo, pick[1])); use(o.hi.id, uxOctDir(o.hi, pick[1])); }
  }
  uxOctPlan = plan; return plan;
}
function uxOctPath(a, b, type) {
  const o = uxOctOptions(a, b, type); if (!o) return null;
  const pk = o.lo.id + '-' + o.hi.id + ':' + type, plan = uxOctPlanNow();
  const p = plan.has(pk) ? plan.get(pk) : (o.A || o.B);
  return p ? (o.lo === a ? p : p.slice().reverse()) : null;
}
// Geometry of a two-leg path with a rounded corner (quadratic fillet of radius R): position and unit tangent at arc
// distance d. Used for lines (with lane offsets), roads and label anchors alike.
function uxOctGeom(pts) {
  const L1 = Math.hypot(pts[1].x - pts[0].x, pts[1].y - pts[0].y), L2 = Math.hypot(pts[2].x - pts[1].x, pts[2].y - pts[1].y);
  const u1 = { x: (pts[1].x - pts[0].x) / (L1 || 1), y: (pts[1].y - pts[0].y) / (L1 || 1) }, u2 = { x: (pts[2].x - pts[1].x) / (L2 || 1), y: (pts[2].y - pts[1].y) / (L2 || 1) };
  const R = Math.min(UX_OCT_R, L1 * .45, L2 * .45);
  return { L1, L2, u1, u2, R, len: L1 + L2, P0: { x: pts[1].x - u1.x * R, y: pts[1].y - u1.y * R }, P2: { x: pts[1].x + u2.x * R, y: pts[1].y + u2.y * R }, B: pts[1], pts };
}
function uxOctAt(g, d) {
  const { L1, u1, u2, R, P0, P2, B, pts } = g;
  if (d < L1 - R) return { x: pts[0].x + u1.x * d, y: pts[0].y + u1.y * d, tx: u1.x, ty: u1.y };
  if (d > L1 + R) { const e = d - L1; return { x: pts[1].x + u2.x * e, y: pts[1].y + u2.y * e, tx: u2.x, ty: u2.y }; }
  const s = R ? (d - (L1 - R)) / (2 * R) : 0, k = 1 - s;
  const x = k * k * P0.x + 2 * k * s * B.x + s * s * P2.x, y = k * k * P0.y + 2 * k * s * B.y + s * s * P2.y;
  let tx = 2 * k * (B.x - P0.x) + 2 * s * (P2.x - B.x), ty = 2 * k * (B.y - P0.y) + 2 * s * (P2.y - B.y); const tl = Math.hypot(tx, ty) || 1;
  return { x, y, tx: tx / tl, ty: ty / tl };
}
// A point at fraction t along a station-to-station path, carrying the lane offset the straight version would have
// had, turned to the local direction of the path (so lanes stay parallel round the rounded corner).
function uxOctPoint(pts, a, b, base, t) {
  const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, n0x = -dy / len, n0y = dx / len;
  const off = (base.x - (a.x + dx * t)) * n0x + (base.y - (a.y + dy * t)) * n0y;
  const g = uxOctGeom(pts), p = uxOctAt(g, t * g.len);
  let nx = -p.ty, ny = p.tx; if (nx * n0x + ny * n0y < 0) { nx = -nx; ny = -ny; }
  return { x: p.x + nx * off, y: p.y + ny * off };
}
if (typeof lanePoint === 'function' && !lanePoint.uxOct) {
  const lp = lanePoint;
  lanePoint = function (a, b, l, t) {
    const base = lp(a, b, l, t), pts = l && uxOctPath(a, b, l.type);
    return pts ? uxOctPoint(pts, a, b, base, t) : base;
  };
  lanePoint.uxOct = true;
}
// Bent strokes are sampled densely (about every 4 units) so the rounded corners read as curves, not facets.
if (typeof strokeLaneRange === 'function' && !strokeLaneRange.uxOct) {
  const slr = strokeLaneRange;
  strokeLaneRange = function (a, b, l, lo = 0, hi = 1) {
    const pts = l && uxOctPath(a, b, l.type); if (!pts) return slr.call(this, a, b, l, lo, hi);
    const g = uxOctGeom(pts), n = Math.max(16, Math.ceil((hi - lo) * g.len / 4));
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const p = lanePoint(a, b, l, lo + (hi - lo) * i / n); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); }
  };
  strokeLaneRange.uxOct = true;
}
// Roads and tracks under the lines are drawn as straight strokes between station centres, and their construction and
// break labels («施工 2天», «× 断线») at the straight midpoint. While they draw, a stroke between two stations whose
// segment is bent follows the same rounded path, and a label anchored near that segment's straight midpoint moves to
// the middle of the path — the road it belongs to.
function uxOctInfra(draw) {
  return function (...args) {
    const mt = ctx.moveTo, lt = ctx.lineTo, tx0 = globalThis.text, rb0 = globalThis.roundBody; let from = null;
    const at = (x, y) => S.cities.find(c => c && Math.abs(c.x - x) < .01 && Math.abs(c.y - y) < .01);
    const pathOf = (a, b) => uxOctPath(a, b, 'bus') || uxOctPath(a, b, 'emu');
    const moves = [];
    const pairs = [...Object.values(S.infrastructure || {}).map(x => [x.a, x.b]), ...Object.keys(S.blockages || {}).map(k => k.split('-').slice(-2).map(Number))];
    for (const [ia, ib] of pairs) {
      const a = S.cities[ia], b = S.cities[ib], pts = a && b && pathOf(a, b); if (!pts) continue;
      const g = uxOctGeom(pts), m = uxOctAt(g, g.len / 2);
      moves.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, dx: m.x - (a.x + b.x) / 2, dy: m.y - (a.y + b.y) / 2 });
    }
    const shift = (x, y) => { let best = null, d = 34; for (const mv of moves) { const e = Math.hypot(x - mv.x, y - mv.y); if (e < d) { d = e; best = mv; } } return best; };
    ctx.moveTo = function (x, y) { from = { x, y }; return mt.call(this, x, y); };
    ctx.lineTo = function (x, y) {
      const a = from && at(from.x, from.y), b = a && at(x, y), pts = b && pathOf(a, b);
      from = { x, y };
      if (!pts) return lt.call(this, x, y);
      const g = uxOctGeom(pts);
      lt.call(this, g.P0.x, g.P0.y); this.quadraticCurveTo(g.B.x, g.B.y, g.P2.x, g.P2.y); return lt.call(this, x, y);
    };
    globalThis.text = function (t, x, y, ...r) { const mv = shift(x, y); return tx0.call(this, t, mv ? x + mv.dx : x, mv ? y + mv.dy : y, ...r); };
    globalThis.roundBody = function (x, y, w, h, ...r) { const mv = shift(x + w / 2, y + h / 2); return rb0.call(this, mv ? x + mv.dx : x, mv ? y + mv.dy : y, w, h, ...r); };
    try { return draw.apply(this, args); } finally { ctx.moveTo = mt; ctx.lineTo = lt; globalThis.text = tx0; globalThis.roundBody = rb0; }
  };
}
// ---------- transport modes ----------
const UX_MODE_RANK = { bus: 0, emu: 1, rail: 2, ship: 2.5, ferry: 2.6, air: 3 };
// widths relative to upstream's (bus 3.7, 动车 4.5, 高铁 7, air 2.8), so the zoom scaling applied by earlier layers stays
const UX_MODE_WIDTH = { bus: 3.4 / 3.7, emu: 5.2 / 4.5, rail: 7 / 7, air: 2.2 / 2.8 };
// Re-routing a line (user 2026-11-15: 改线时看不清当前走向): the line as it is now stays on the map as a wide, pale band
// in its colour under everything else, and the new route (upstream's dashed draft) runs over it — before and after at a
// glance. Drawn when the line pass begins (LINE_ORDER is asked for the drawing order right before lines are drawn).
function uxDraftGhost() {
  if (!draft?.original || ctx.canvas !== cv || typeof strokeLaneRange !== 'function') return;
  const l = S.lines.find(x => x.id === draft.original); if (!l || l.stops.length < 2) return;
  ctx.save();
  try { lineStyle(l); ctx.setLineDash([]); ctx.globalAlpha = .3; ctx.lineWidth *= 3.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < l.stops.length; i++) { const a = S.cities[l.stops[i - 1]], b = S.cities[l.stops[i]]; if (a && b) { strokeLaneRange(a, b, l); ctx.stroke(); } } } catch {}
  ctx.restore();
}
globalThis.LINE_ORDER = lines => (uxDraftGhost(), lines).map((l, i) => [l, i]).sort((x, y) => (UX_MODE_RANK[x[0].type] ?? 0) - (UX_MODE_RANK[y[0].type] ?? 0) || x[1] - y[1]).map(x => x[0]);
function uxModeStyle() {
  if (typeof lineStyle !== 'function' || lineStyle.uxMode) return;
  const ls = lineStyle;
  lineStyle = function (l, ...a) {
    const r = ls.call(this, l, ...a);
    if (l && UX_MODE_WIDTH[l.type]) ctx.lineWidth *= UX_MODE_WIDTH[l.type];
    if (l?.type === 'air') {
      ctx.setLineDash([7, 7]);
      // air crosses everything but runs on no road: kept light unless it is the line in focus
      const focus = (selected?.type === 'line' && selected.id === l.id) || uxHoverLine === l.id || (draft && draft === l);
      if (!focus) ctx.globalAlpha *= .6;
    }
    return r;
  };
  lineStyle.uxMode = true;
}
// Desktop: hovering a line with the mouse previews it — that line full strength, the rest faded — which is exactly what
// a click there would select (upstream picks lines by their drawn path). Touch keeps the tray and station picker.
let uxHoverLine = null;
// Every station sits in a clear zone the colour of the paper: lines stop at its edge, as at an interchange on a transit
// map, instead of running into the centre. The zone grows with the number of corridors meeting there, so a five-line
// hub gets room around it. Drawn after the lines and before vehicles and the stations themselves.
function uxStationHalos() {
  if (!S?.lines?.length) return;
  const k = globalThis.CITY_GLYPH?.() ?? 1, edges = new Map();
  for (const l of S.lines) for (let i = 1; i < l.stops.length; i++) {
    const a = l.stops[i - 1], b = l.stops[i]; if (a === b) continue;
    for (const [x, y] of [[a, b], [b, a]]) { if (!edges.has(x)) edges.set(x, new Set()); edges.get(x).add(y); }
  }
  ctx.save(); ctx.fillStyle = '#f7f6ec';
  for (const [id, nb] of edges) {
    const c = S.cities[id]; if (!c || c.dormant || c.kind === 'bridgehead') continue;
    const n = nb.size, r = radius(c) * k + (n >= 3 ? 7 + Math.min(6, (n - 3) * 1.5) : 4);
    ctx.globalAlpha = .96; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
globalThis.CITY_GLYPH = () => ctx.canvas === cv ? Math.max(1, Math.min(1.45, .85 / view.scale)) : 1;
(function lineFloor() {
  const style = lineStyle;
  lineStyle = function (...a) { style.apply(this, a); if (ctx.canvas === cv) ctx.lineWidth *= Math.max(1, Math.min(1.4, .85 / view.scale)); };
})();
function uxScreenFor(v, p) { return v.rot ? { x: v.x - p.y * v.scale, y: v.y + p.x * v.scale } : { x: v.x + p.x * v.scale, y: v.y + p.y * v.scale }; }
// Phones: portrait, or a short landscape screen (the side route list and dock leave a small map window).
function uxCompact() { return portraitMode || H <= 500; }
const PLAY_MIN_SCALE_LAND = .6;
// The play view never shows the flat ground beyond the map's edge when the map is big enough to cover the screen
// at that zoom (a landscape turn or a late network near the border used to leave a plain band); a map smaller than
// the screen is centred instead. Selection framing is not clamped: a city near the edge must still come above a sheet.
function uxClampToMap(t) {
  const b = typeof mapSpec !== 'undefined' && mapSpec?.bounds; if (!b || view.rot || !t) return t;
  const s = t.scale, w = (b.xmax - b.xmin) * s, h = (b.ymax - b.ymin) * s;
  const x = w >= W ? Math.min(-b.xmin * s, Math.max(W - b.xmax * s, t.x)) : (W - (b.xmin + b.xmax) * s) / 2;
  const y = h >= H ? Math.min(-b.ymin * s, Math.max(H - b.ymax * s, t.y)) : (H - (b.ymin + b.ymax) * s) / 2;
  // Visibility outranks hiding the edge: every active city that sits in the free map area (below the header, clear of
  // the tray, dock and sheets) before the clamp must still sit there after it. Each axis may only shift as far as all
  // of them allow; a city near the map border keeps a strip of edge ground rather than slipping under the tray.
  const r = uxVisibleRect(), pad = 30, cs = typeof realCities === 'function' ? realCities().filter(c => !c.dormant) : [];
  const inside = cs.filter(c => { const sx = t.x + c.x * s, sy = t.y + c.y * s; return sx >= r.l && sx <= r.r && sy >= r.t && sy <= r.b; });
  const limit = (d, lo, hi) => Math.max(lo, Math.min(hi, d));
  let dxLo = -Infinity, dxHi = Infinity, dyLo = -Infinity, dyHi = Infinity;
  for (const c of inside) { const sx = t.x + c.x * s, sy = t.y + c.y * s;
    // a city already inside the margin may stay where it is, but is never pushed further toward the panel or edge
    dxLo = Math.max(dxLo, Math.min(0, r.l + pad - sx)); dxHi = Math.min(dxHi, Math.max(0, r.r - pad - sx)); dyLo = Math.max(dyLo, Math.min(0, r.t + pad - sy)); dyHi = Math.min(dyHi, Math.max(0, r.b - pad - sy)); }
  return { ...t, x: t.x + limit(x - t.x, dxLo, dxHi), y: t.y + limit(y - t.y, dyLo, dyHi) };
}
// What the default view should keep in sight: connected cities over idle ones, and in a late network the places that
// need attention — a crowded hall (by load against capacity) and junctions where several lines meet.
function uxPlayWeight(c) {
  let w = cityHasRoute?.(c) ? 2 : 1;
  const cap = typeof capacity === 'function' ? capacity(c) : 0, load = cap ? c.q.length / cap : 0;
  w += Math.min(3, load * 2);
  if (typeof cityLines === 'function') w += Math.min(2, Math.max(0, cityLines(c.id).length - 1) * .5);
  return w;
}
function uxPlayTarget() { return uxClampToMap(uxPlayTargetRaw()); }
function uxPlayTargetRaw() {
  const all = fitTarget();
  if (!uxCompact()) return uxDeskPlayTarget(all);
  if (portraitMode && all.scale >= PLAY_MIN_SCALE) return all;
  const active = realCities().filter(c => !c.dormant); if (!active.length) return all;
  const rot = view.rot; let s, box;
  if (portraitMode) {
    const band = fitBand(); s = PLAY_MIN_SCALE;
    box = { l: band.side + UX_FIT_PAD.l, r: W - band.side - UX_FIT_PAD.r, t: band.top + UX_FIT_PAD.t, b: band.bottom - UX_FIT_PAD.b };
    // a young network (≤ 6 towns, e.g. the three opening towns of the west) is shown whole: zoom out just enough to fit
    // it rather than leave a town on the screen edge with its name cut off (never below 0.5)
    if (active.length <= 6) { const xs = active.map(c => c.x), ys = active.map(c => c.y), need = Math.min((box.r - box.l) / Math.max(1, Math.max(...xs) - Math.min(...xs)), (box.b - box.t) / Math.max(1, Math.max(...ys) - Math.min(...ys))); if (need < s) s = Math.max(.5, need); }
  } else {
    // landscape phone: the free map window is what remains after the route list (left) and the dock (bottom)
    const r = uxVisibleRect(); box = { l: r.l + 20, r: r.r - 70, t: r.t + 26, b: r.b - 34 };
    const xs = active.map(c => c.x), ys = active.map(c => c.y);
    s = Math.max(PLAY_MIN_SCALE_LAND, Math.min(1.1, (box.r - box.l) / Math.max(1, Math.max(...xs) - Math.min(...xs)), (box.b - box.t) / Math.max(1, Math.max(...ys) - Math.min(...ys))));
  }
  const cx = (box.l + box.r) / 2, cy = (box.t + box.b) / 2;
  const mean = { x: active.reduce((n, c) => n + c.x, 0) / active.length, y: active.reduce((n, c) => n + c.y, 0) / active.length };
  let best = null;
  for (const p of [mean, ...active]) {
    const v = { rot, scale: s, ...uxViewFor(p, cx, cy, s) };
    let score = 0;
    for (const c of active) { const q = uxScreenFor(v, c); if (q.x >= box.l && q.x <= box.r && q.y >= box.t && q.y <= box.b) score += uxPlayWeight(c); }
    score -= Math.hypot(p.x - mean.x, p.y - mean.y) / 1e4;   // tie-break: stay near the middle of the network
    if (!best || score > best.score) best = { score, v };
  }
  return { x: best.v.x, y: best.v.y, scale: s };
}
// Desktop: a large screen showing the whole map leaves an early network as a small patch in a field of trees.
// Frame the cities in play with room around them for growth; once the network spreads the whole map is the view.
function uxDeskPlayTarget(all) {
  const active = realCities().filter(c => !c.dormant); if (active.length < 2) return all;
  const r = uxVisibleRect(), box = { l: r.l + 40, r: r.r - 40, t: r.t + 30, b: r.b - 60 };
  const xs = active.map(c => c.x), ys = active.map(c => c.y);
  const span = Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)), m = Math.max(140, span * .4);
  const wx = Math.max(...xs) - Math.min(...xs) + 2 * m, wy = Math.max(...ys) - Math.min(...ys) + 2 * m;
  const s = Math.min(1.6, (box.r - box.l) / (view.rot ? wy : wx), (box.b - box.t) / (view.rot ? wx : wy));
  if (s <= all.scale * 1.08) return all;
  const c = { x: (Math.max(...xs) + Math.min(...xs)) / 2, y: (Math.max(...ys) + Math.min(...ys)) / 2 };
  return { ...uxViewFor(c, (box.l + box.r) / 2, (box.t + box.b) / 2, s), scale: s };
}
let uxOverviewOn = false;
function uxApplyPlayView(animate) {
  if (!S?.cities) return;
  const t = uxPlayTarget(); uxOverviewOn = false; uxSyncOverviewButton(); uxFrameRestore = null;
  if (animate) animateView(t); else Object.assign(view, t);
}
function uxSyncOverviewButton() { const b = uxEl('overview'); if (b) { b.title = uxOverviewOn ? '回到游玩视图' : '查看全图'; b.setAttribute('aria-label', b.title); b.classList.toggle('is-on', uxOverviewOn); } }
uxEl('overview').onclick = () => {
  uxOverviewOn = !uxOverviewOn; uxSyncOverviewButton();
  animateView(uxOverviewOn ? fitTarget() : uxPlayTarget()); haptic();
};
addEventListener('resize', () => uxApplyPlayView(false));
(function () { const start = startGame; startGame = function (...a) { const r = start.apply(this, a); uxApplyPlayView(false); return r; }; })();
// Framing for an open sheet may zoom out; closing the sheet brings the earlier view back, unless the player
// moved the map in between. Repeated open/close therefore never ratchets the scale down.
let uxAutoMove = move => move();   // replaced below by the recording version
let uxFrameRestore = null;   // { from: view before the first automatic framing, to: view after the latest one }
// Remember the end state of every camera animation, so "is the view still where our framing put it?" needs no timers.
let uxLastViewTarget = null;
let uxOwnCamera = 0;   // >0 while our framing or restore is driving the camera
(function () { const anim = animateView; animateView = function (t, ms) { uxLastViewTarget = { x: t.x, y: t.y, scale: t.scale }; if (!uxOwnCamera && uxFrameRestore) uxFrameRestore = null; return anim(t, ms); }; animateView.id = anim.id; Object.defineProperty(animateView, 'id', { get: () => anim.id, set: v => { anim.id = v; } }); })();
function uxCancelAutoMove() {
  uxFrameRestore = null;
  if (animateView.activeId != null) { animateView.id = (animateView.id || 0) + 1; animateView.activeId = null; }
}
function uxEndAutoMove() {
  const r = uxFrameRestore; uxFrameRestore = null;
  if (!r) return;
  const running = animateView.activeId != null && animateView.activeId === r.animationId && animateView.id === r.animationId;
  // Starting an edit must freeze the current view, even if automatic framing has not finished.
  if (draft || uxExt || bridgeDraft) { if (running) uxCancelAutoMove(); return; }
  // The session itself says the player has not taken the camera: their pan, pinch or wheel and any other deliberate
  // camera move (⌖, edge pill, new play view) end it. Position is not compared — upstream's soft map bounds nudge the
  // view every frame, which made an untouched view look "moved" and skipped the restore.
  uxOwnCamera++; try { animateView(r.from, 280); } finally { uxOwnCamera--; }
}
// Actual camera input takes ownership; a city tap or panel transition does not.
cv.addEventListener('pointermove', e => { if (pointers.has(e.pointerId) && ['pan', 'pinch'].includes(gesture?.kind)) uxCancelAutoMove(); }, { capture: true });
cv.addEventListener('wheel', uxCancelAutoMove, { capture: true, passive: true });
(function () {
  const frame = uxFrame;
  // Every automatic camera move (sheet framing, landscape focus pan) joins one restore session: the first move
  // remembers the view before it, later ones only update where the camera was sent.
  uxAutoMove = function (move) {
    const before = { x: view.x, y: view.y, scale: view.scale }, id0 = animateView.id;
    uxOwnCamera++; try { move(); } finally { uxOwnCamera--; }
    if (animateView.id === id0) return;              // nothing moved
    if (!uxFrameRestore) uxFrameRestore = { from: before, to: null };
    uxFrameRestore.to = uxLastViewTarget;           // where our own framing ends up
    uxFrameRestore.animationId = animateView.id;
  };
  uxFrame = function (points, pad) { uxAutoMove(() => frame(points, pad)); };
  // The details sheet and the line picker are both bottom sheets. The view goes back only when one of them really
  // closes (open → hidden) and neither is left open: upstream re-sets `hidden = true` on every UI update while the
  // picker is up, and moving from one sheet to the other keeps the original view to come back to.
  const d = uxEl('details'), jp = uxEl('junction-picker'), sheets = [d, jp].filter(e => e?.getBoundingClientRect);
  const wasOpen = new Map(sheets.map(e => [e, !e.hidden]));
  const onSheet = e => () => {
    const was = wasOpen.get(e); wasOpen.set(e, !e.hidden);
    if (!was || !e.hidden || sheets.some(x => !x.hidden) || !uxFrameRestore) return;
    uxEndAutoMove();
  };
  if (typeof MutationObserver !== 'undefined') for (const e of sheets) new MutationObserver(onSheet(e)).observe(e, { attributes: true, attributeFilter: ['hidden'] });
})();

/* ---------- first-game coach: follows what the player does, then retires ---------- */
// No modal, no arrows over controls: one quiet hint above the bottom bar and, before the first line, a pulsing
// dashed suggestion between the two closest open cities. Stored once finished or dismissed (per browser).
const UX_COACH_KEY = 'transit-ux-coach-done';
let uxCoach = { done: false, step: '', firstLineAt: 0 };
try { uxCoach.done = localStorage.getItem(UX_COACH_KEY) === '1'; } catch {}
// hoisted, so early callers (before the let above is initialised) get false instead of a TDZ error
function uxCoachActive() { try { return !uxCoach.done; } catch { return false; } }
function uxCoachShowing() { try { return !!uxCoach.step; } catch { return false; } }
function uxCoachFinish() { uxCoach.done = true; try { localStorage.setItem(UX_COACH_KEY, '1'); } catch {} uxCoachRender(); }
function uxCoachPair() {
  const cs = realCities().filter(c => !c.dormant); let best = null;
  for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const d = Math.hypot(cs[i].x - cs[j].x, cs[i].y - cs[j].y); if (!best || d < best.d) best = { a: cs[i], b: cs[j], d }; }
  return best;
}
function uxCoachStep() {
  if (uxCoach.done || !S?.lines || S.day > 6) return '';
  if (draft && !draft.original) return draft.stops.length < 2 ? 'next' : 'build';
  if (!S.lines.length) return 'start';
  if (!uxCoach.firstLineAt) uxCoach.firstLineAt = performance.now();
  return performance.now() - uxCoach.firstLineAt < 9000 ? 'deliver' : (uxCoachFinish(), '');
}
const UX_COACH_TEXT = {
  start: '<b>第一步</b>从一座城市拖到另一座，修出第一条线路',
  next: '<b>继续拖</b>到下一座城市，可以连续经过多座',
  build: '<b>核对报价</b>，点底栏「建设」完成',
  deliver: '<b>开通了！</b>乘客头上的色块是目的地，送到同色同形的城市；点城市看任务',
};
function uxCoachRender() {
  let el = uxEl('ux-coach');
  if (!el && document.body?.appendChild) {
    el = document.createElement('div'); el.id = 'ux-coach'; el.setAttribute('role', 'status');
    el.innerHTML = '<span></span><button aria-label="关闭引导">×</button>';
    el.querySelector('button').onclick = uxCoachFinish;
    document.body.appendChild(el);
  }
  if (!el) return;
  const inspecting = !draft && ['details', 'junction-picker'].some(id => { const e = uxEl(id); return e && !e.hidden; });
  const step = modalOpen || inspecting ? '' : uxCoachStep();
  el.hidden = !step;
  if (step && step !== uxCoach.step) el.querySelector('span').innerHTML = UX_COACH_TEXT[step];
  uxCoach.step = step;
  if (step) { // float just above whatever sits at the bottom (route strip, draw bar, sheet)
    let top = H;
    for (const q of ['#drawbar', '#junction-picker', '#details', '#routes', 'footer .dock']) { const e = document.querySelector(q); if (!e || e.hidden || getComputedStyle(e).display === 'none') continue; const r = e.getBoundingClientRect(); if (r.height && r.top > H * .4) top = Math.min(top, r.top); }
    el.style.bottom = (H - top + 10) + 'px';
  }
}
if (typeof setInterval === "function") setInterval(() => { try { uxCoachRender(); } catch {} }, 300);
function uxDrawCoach() {
  if (uxCoach.done || uxCoach.step !== 'start') return;
  const p = uxCoachPair(); if (!p) return;
  const k = 1 / view.scale, t = (performance.now() % 1600) / 1600;
  ctx.save(); ctx.strokeStyle = '#c56544'; ctx.lineWidth = 3 * k; ctx.lineCap = 'round';
  ctx.setLineDash([2 * k, 9 * k]); ctx.lineDashOffset = -t * 22 * k; ctx.globalAlpha = .85;
  ctx.beginPath(); ctx.moveTo(p.a.x, p.a.y); ctx.lineTo(p.b.x, p.b.y); ctx.stroke(); ctx.setLineDash([]);
  for (const c of [p.a, p.b]) { ctx.globalAlpha = .55 * (1 - t); ctx.lineWidth = 2.5 * k; ctx.beginPath(); ctx.arc(c.x, c.y, (radius(c) * (globalThis.CITY_GLYPH?.() ?? 1) + 8 + 16 * t) , 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

/* ---------- generic sheet compaction (runs after any sheet finishes rendering) ---------- */
// Upstream sheets stack stat rows, rule paragraphs and actions, and later layers append more by string. One pass,
// after the last mutation: long rule text folds into a single 「规则说明」, short facts stay, 3-option dropdowns become
// segmented controls (the hidden select stays the source of truth), and redundant "back to map" buttons go.
const UX_DESIGNED = '.deck128,.notice130,.ux-hero,.ux-steps,.ux-help,.financial-market,.activity-grid,.ux-tasks,.ux-resume';
let uxCompacting = false;
function uxCompactSheet(m) {
  if (!m || m.querySelector(UX_DESIGNED)) return;
  uxCompacting = true;
  try {
    const keep = 'details,.ux-ledger,.ux-fac,.ux-eng,.ux-contract,.ux-empty,label';
    const long = [...m.querySelectorAll('p')].filter(p => !p.closest(keep) && !p.querySelector('button,input,select') && (t => t.length > 60 || (t.length > 30 && !/\d/.test(t)))(p.textContent.trim()));   // long rules fold; short numeric facts stay
    // a confirmation sheet's first paragraph explains what you are agreeing to: it stays visible
    if (m.querySelector('button.primary') && !m.querySelector('.ux-hub-tabs')) { const first = m.querySelector('p'); const i = long.indexOf(first); if (i >= 0) long.splice(i, 1); }
    if (long.length) {
      // reuse an existing 规则说明 fold anywhere in the sheet (the hub footer may already hold it)
      let d = [...m.querySelectorAll('details.ux-rules')].find(x => !/ux-ledger-all|ux-car-fold|ux-market-build/.test(x.className) && /规则说明/.test(x.querySelector('summary')?.textContent || ''));
      if (!d) { d = document.createElement('details'); d.className = 'ux-rules'; d.innerHTML = '<summary>规则说明</summary>'; (m.querySelector('.ux-foldfoot') || m).appendChild(d); }
      long.forEach(p => d.appendChild(p));
    }
    // info cards left with only a heading and no numbers or actions add nothing
    for (const sec of m.querySelectorAll('section.infra-card, div.infra-card')) {
      if (sec.querySelector('button,input,select,.quote-row,p')) continue;
      if (!/\d/.test(sec.textContent)) sec.remove();
    }
    for (const b of m.querySelectorAll('button')) if (/^返回地图$/.test(b.textContent.trim())) b.remove();
    uxConfirmPattern(m);
    for (const sel of m.querySelectorAll('select')) {
      if (sel.dataset.uxSeg || sel.options.length < 2 || sel.options.length > 3) continue;
      sel.dataset.uxSeg = '1';
      const seg = document.createElement('div'); seg.className = 'ux-seg'; seg.setAttribute('role', 'radiogroup');
      const sync = () => seg.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.v === sel.value));
      for (const o of sel.options) {
        const b = document.createElement('button'); b.type = 'button'; b.dataset.v = o.value; b.textContent = o.textContent.trim();
        b.onclick = () => { sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); sync(); haptic(); };
        seg.appendChild(b);
      }
      sel.after(seg); sel.classList.add('ux-seg-src'); sync();
    }
  } finally { uxCompacting = false; }
}
(function watchSheets() {
  const mc = uxEl('modal-content'); if (!mc || typeof MutationObserver === 'undefined') return;
  let queued = false;
  new MutationObserver(() => {
    if (uxCompacting || queued) return; queued = true;
    requestAnimationFrame(() => { queued = false; if (!uxEl('modal').hidden) uxCompactSheet(mc); });
  }).observe(mc, { childList: true });
})();

/* ---------- caption diet on upstream-rendered panels ---------- */
function uxCaptionDiet() {
  const d = uxEl('details'); if (!d || d.hidden) return;
  // city sheet: short metric labels and stage tag
  for (const sm of d.querySelectorAll('.metric-grid small')) { const t = sm.textContent.trim(); if (t === '候车 / 容量') sm.textContent = '候车'; else if (t === '满员压力') sm.textContent = '满员'; else if (t === '最长等待') sm.textContent = '等待'; }
  const tag = d.querySelector('.city-mission .eyebrow'); if (tag && /阶段任务/.test(tag.textContent)) tag.textContent = tag.textContent.replace('阶段任务', '任务').replace(/\s*\/\s*/, '/');
  // vehicle sheet: the passenger list speaks for itself; an empty bus needs no sentence
  for (const p of d.querySelectorAll('p.detail-sub')) if (/^(车内旅客目的地|当前空车。?)$/.test(p.textContent.trim())) p.remove();
}
(function () {
  const sd = showDetails; showDetails = function (...a) { const r = sd.apply(this, a); try { uxCaptionDiet(); } catch {} return r; };
  if (typeof showVehicleDetails === 'function') { const sv = showVehicleDetails; showVehicleDetails = function (...a) { const r = sv.apply(this, a); try { uxCaptionDiet(); } catch {} return r; }; }
})();

/* Re-render surfaces that were drawn before this layer loaded. */
if (modalOpen && uxEl('modal-content').innerHTML.includes('startGame()')) welcome(typeof hadSave !== 'undefined' && hadSave);
updateUI();
