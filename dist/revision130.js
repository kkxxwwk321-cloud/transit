"use strict";
function isLoop130(l) {
  return !!l && l.type === "bus" && l.stops.length >= 4 && l.stops[0] === l.stops.at(-1) && new Set(l.stops.filter((id) => S.cities[id]?.kind !== "bridgehead")).size >= 3;
}
function fullLoop130(v, l) {
  let r = serviceRange(v, l);
  return isLoop130(l) && r.lo === 0 && r.hi === l.stops.length - 1;
}
const departureBefore130 = departureIndex;
departureIndex = function(v, l) {
  if (!fullLoop130(v, l)) return departureBefore130(v, l);
  let last = l.stops.length - 1, i = v.index;
  if (v.dir > 0 && i === last) i = 0;
  else if (v.dir < 0 && i === 0) i = last;
  let next = i + v.dir;
  if (next < 0 || next > last || !canEnter(S.cities[l.stops[i]], S.cities[l.stops[next]], l.type, v)) return -1;
  v.index = i;
  return next;
};
const componentBefore130 = sameComponent;
sameComponent = function(v, l, target) {
  if (!fullLoop130(v, l)) return componentBefore130(v, l, target);
  let n = l.stops.length - 1, i = v.index % n, t = target % n;
  for (let step = 0; step < n; step++) {
    if (i === t) return true;
    let j = (i + v.dir + n) % n;
    if (!canEnter(S.cities[l.stops[i]], S.cities[l.stops[j]], l.type)) return false;
    i = j;
  }
  return false;
};
const addBefore130 = addDraftCity;
addDraftCity = function(c, ...args) {
  if (draft && c.id === draft.stops[0] && new Set(draft.stops.filter((id) => S.cities[id]?.kind !== "bridgehead")).size >= 3 && draft.stops.at(-1) !== c.id) {
    if (draft.type !== "bus") {
      toast("只有公交线路可以闭合为环线");
      return;
    }
    draft.stops.push(c.id);
    draftBar();
    return;
  }
  if (draft && isLoop130(draft)) return;
  return addBefore130(c, ...args);
};
const commitBefore130 = commitDraft;
commitDraft = function(...a) {
  if (draft && draft.stops.length > 2 && draft.stops[0] === draft.stops.at(-1) && !isLoop130(draft)) return toast("只有公交线路可以闭合为环线");
  return commitBefore130(...a);
};
function closeBusLoop130() {
  if (draft && draft.type === "bus" && !isLoop130(draft)) addDraftCity(S.cities[draft.stops[0]]);
}
function openBusLoop130() {
  if (draft && isLoop130(draft)) {
    draft.stops.pop();
    draftBar();
  }
}
function specialPassengerMark130(p) {
  let m = p.cardId ? "★" : p.schoolId !== void 0 ? "▤" : p.eventId ? "♪" : p.fixedDestination ? "◆" : "";
  return m + (m && (p.returnTrip || p.schoolReturn) ? "↩" : "");
}
const labelBefore130 = passengerLabel;
passengerLabel = function(p) {
  let m = specialPassengerMark130(p);
  return m ? m + " " + (p.returnTrip || p.schoolReturn ? "返程 → " : "指定 → ") + escapeHTML(S.cities[p.dest]?.name || "目标城市") : labelBefore130(p);
};
const matchBefore130 = matchesDestination;
matchesDestination = function(c, p) {
  return p.cardId || p.fixedDestination ? !c.dormant && c.id !== p.origin && c.id === p.dest : matchBefore130(c, p);
};
const tickBefore130 = tick;
tick = function(dt) {
  if (!S || S.lives <= 0 || S.paused || !(dt > 0)) return;
  let r = tickBefore130(dt);
  constructionNotices130();
  if (safePopup130()) {
    if (notices130().cardsPending) {
      automaticCards130 = false;
      showActivityCards();
    } else showNotice130();
  }
  return r;
};
function layoutTutorial130() {
  if (typeof guide123 === "undefined" || guide123.hidden) return;
  let top = (document.querySelector("header")?.getBoundingClientRect().bottom || 110) + 8, target = tutorialTarget124(), r = target?.getBoundingClientRect(), g = guide123.getBoundingClientRect(), internal = target && guide123.contains(target), overlap = !internal && r && r.top < top + g.height && r.bottom > top;
  // A map gesture has no DOM button to avoid. Keep the card off the two
  // endpoints without moving the player's camera or covering the quote.
  const t = S.tutorial123;
  if (portraitMode && !target && !modalOpen && (t?.stage === 'second-extend' || t?.stage === 'connect')) {
    const cities = (t.stage === 'connect' ? [S.cities[t.city]] : [S.cities[t.shared129], S.cities[t.target129]]).filter(Boolean);
    const ys = cities.map(c => toScreen(c).y);
    if (ys.some(y => y + 24 > top && y - 24 < top + g.height)) {
      const next = Math.max(top, ...ys.map(y => y + 32));
      if (next + g.height <= uxVisibleRect().b) top = next;
    }
  }
  guide123.style.top = overlap ? "auto" : top + "px";
  guide123.style.bottom = overlap ? "calc(var(--dock-height) + var(--safe-b) + 18px)" : "auto";
  cueButton124();
  if (target) {
    let q = target.getBoundingClientRect();
    if (q.top < 0 || q.bottom > innerHeight) cue124.hidden = true;
  }
}
function ensureRoutes130() {
  let p = $("routes"), head = p?.querySelector(".panel-heading");
  if (!head || $("route-new130")) return;
  let b = document.createElement("button");
  b.id = "route-new130";
  b.textContent = "＋ 新建线路";
  b.onclick = () => $("newroute").click();
  head.insertBefore(b, $("collapse"));
}
function notices130() {
  return S.notices130 ??= { seen: {}, unread: {}, queue: [] };
}
function safePopup130() {
  return !atlasMenuOpen && !modalOpen && !draft && !bridgeDraft && !pointers.size && S.lives > 0 && (typeof tutorialStage123 !== "function" || !S.tutorial123 || tutorialStage123() === "done");
}
function queueNotice130(id, title, copy, hub, city) {
  let n = notices130();
  if (n.seen[id]) return;
  n.seen[id] = true;
  n.unread[hub] = true;
  n.queue.push({ id, title, copy, hub, city });
  save();
}
function openNotice130(hub, city) {
  notices130().unread[hub] = false;
  closeModal();
  if (city !== null) openCity(city);
  else uxOpenHub(hub);
}
function showNotice130() {
  if (!safePopup130()) return;
  const queue=notices130().queue,first=queue.shift();
  if (!first) return;
  const construction=new Set(['school','repair','weather','hub','bank','broker','farm']);
  const batch=[first];
  if(construction.has(first.id))for(let i=0;i<queue.length;){if(construction.has(queue[i].id))batch.push(queue.splice(i,1)[0]);else i++;}
  S.paused = true;
  const title=batch.length>1?'新设施可以建设了':first.title;
  const rows=batch.map(x=>'<section class="unlock-item158"><div><b>'+escapeHTML(x.title.replace('可以建设了',''))+'</b><p>'+escapeHTML(x.copy)+'</p></div><button onclick="openNotice130(\''+x.hub+'\','+(x.city??'null')+')">查看</button></section>').join('');
  openModal('<section class="notice130"><div class="modal-head"><h2>'+escapeHTML(title)+'</h2><button class="close" onclick="closeModal()">×</button></div><div class="unlock-list158">'+rows+'</div><div class="unlock-actions158"><button class="primary" onclick="openNotice130(\'build\',null)">查看建造</button><button onclick="closeModal()">知道了</button></div></section>');
  save();
}
function constructionNotices130() {
  if (!S || atlasMenuOpen || S.lives <= 0) return;
  let cs = realCities().filter((c) => !c.dormant), medium = cs.find((c) => c.size >= 1);
  if (medium) {
    if (!medium.school && S.points >= SCHOOL_COST) queueNotice130("school", "学校可以建设了", "在城市面板建设学校，安排学生通勤。", "build", medium.id);
    if (!medium.repairCenter && S.points >= REPAIR_CENTER_COST) queueNotice130("repair", "检修中心可以建设了", "在城市面板建设，范围内新工程工期缩短。", "build", medium.id);
  }
  let weather = cs.find((c) => (c.meteo || 0) < 2);
  if (weather && S.points >= stationQuote(weather).price) queueNotice130("weather", "气象站可以建设了", "在城市里建设，减轻范围内雨雾减速。", "build", weather.id);
  let hub = cs.find((c) => !c.hub);
  if (hub && S.hubCount < hubLimit() && S.points >= 3500 + S.hubCount * 1500) queueNotice130("hub", "交通枢纽可以建设了", "在城市面板建设，增加候车容量并加快换乘。", "build", hub.id);
  for (let type of ["bank", "broker"]) if (financialCities(type).some((c) => !c.dormant) && S.points >= (type === "bank" ? 100 : 150)) queueNotice130(type, type === "bank" ? "银行可以建设了" : "证券公司可以建设了", "在资金中心查看建设条件。", "money");
  let farm = cs.find((c) => farmEligible(c) && c.size >= 1 && !c.farm);
  if (farm && S.points >= 800) queueNotice130("farm", "农田可以建设了", "中级居民城市已开放农田，点击城市经营。", "money", farm.id);
}
financeNotice = function() {
};
farmUnlockHint128 = function() {
};
const dailyBefore130 = financialDailyReport;
financialDailyReport = function(day) {
  dailyBefore130(day);
  let f = financeState(), p = financialParticipation128();
  if (!(p.wealth || p.stocks) || Math.abs(f.lastReport?.profit || 0) < 5e-3) {
    f.dailyPending = null;
    return;
  }
  notices130().unread.money = true;
  save();
};
const reviewBefore130 = maybeDailyMarketReview;
maybeDailyMarketReview = function() {
  let f = S?.financial;
  if (f?.dailyPending != null && Math.abs(f.lastReport?.profit || 0) < 5e-3) {
    f.dailyPending = null;
    return;
  }
  if (!safePopup130()) return;
  return reviewBefore130();
};
let automaticCards130 = false;
const cardsBefore130 = showActivityCards;
showActivityCards = function(...a) {
  let n = notices130(), s = activityState();
  if (s.offers.length && !s.active) {
    if (automaticCards130 && !safePopup130()) {
      n.cardsPending = true;
      n.unread.goal = true;
      return;
    }
    n.cardsPending = false;
    n.cardsViewed = s.offers.map((e) => e.id).join("|");
    n.unread.goal = false;
  }
  return cardsBefore130(...a);
};
const offersBefore130 = generateActivityOffers;
generateActivityOffers = function(...a) {
  let r = offersBefore130(...a);
  if (r) {
    automaticCards130 = true;
    Promise.resolve().then(() => {
      automaticCards130 = false;
    });
    let n = notices130();
    n.cardsPending = true;
    n.unread.goal = true;
    save();
  }
  return r;
};
const hubBefore130 = uxOpenHub;
uxOpenHub = function(hub, ...a) {
  if (S) notices130().unread[hub] = false;
  return hubBefore130(hub, ...a);
};
function noticeBadges130() {
  let n = notices130(), s = activityState(), batch = s.offers.map((e) => e.id).join("|");
  for (let hub of ["goal", "build", "money"]) {
    let b = $("hub-" + hub);
    if (!b) continue;
    let dot = b.querySelector(".notice-dot130");
    if (!dot) {
      dot = document.createElement("i");
      dot.className = "notice-dot130";
      dot.setAttribute("aria-label", "有新提示");
      b.append(dot);
    }
    dot.hidden = !(n.unread[hub] || hub === "goal" && batch && batch !== n.cardsViewed && !s.active);
    let old = b.querySelector(".dock-badge");
    if (old) old.hidden = true;
  }
}
const renderBefore130 = render;
render = function() {
  ensureRoutes130();
  let r = renderBefore130();
  layoutTutorial130();
  noticeBadges130();
  return r;
};
ensureRoutes130();
