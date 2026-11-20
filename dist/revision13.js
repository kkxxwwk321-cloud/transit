"use strict";
function editLineLock13() {
  if (draft?.original) return S.lines.find((l) => l.id === draft.original && !l.retiring) || null;
  let id = selected?.type === "line" ? selected.id : selected?.type === "stop" ? selected.line : null;
  return id == null ? null : S.lines.find((l) => l.id === id && !l.retiring) || null;
}
const handlesBefore13 = uxHandles;
uxHandles = function() {
  let lock = editLineLock13();
  return handlesBefore13().filter((h) => !isLoop130(h.line) && (!lock || h.line.id === lock.id));
};
if (typeof cityEdit125 === "function") {
  const cityEditBefore13 = cityEdit125;
  cityEdit125 = function(p) {
    let g = gesture, base = g?.baseStops, target = hitCity(p);
    if (draft && base && g.trimKeep125 == null && !isLoop130({ type: draft.type, stops: base }) && (g.cityIndex === 0 || g.cityIndex === base.length - 1) && target?.id === base[g.cityIndex === 0 ? base.length - 1 : 0] && new Set(base.filter((id) => S.cities[id]?.kind !== "bridgehead")).size >= 3) {
      draft.stops = [...base];
      draft.pointer = null;
      delete draft.stopRemoval;
      delete draft.extensionPointer;
      if (draft.type === "bus") {
        draft.stops.push(base[0]);
        draft.loopClosure13 = true;
        draftBar();
        $("drawtext").textContent = "公交首尾已接合 · 点应用修改确认";
      } else {
        draftBar();
        $("drawtext").textContent = "只有公交可以首尾闭环";
      }
      return true;
    }
    if (draft) delete draft.loopClosure13;
    return cityEditBefore13(p);
  };
}
const extMoveBefore13 = uxExtMove;
uxExtMove = function(e) {
  if (!uxExt || !draft) return extMoveBefore13(e);
  let c = hitCity(toWorld(e)), base = uxExt.base, opposite = uxExt.end === "tail" ? base[0] : base.at(-1), current = uxExtStops();
  if (c?.id === opposite && draft.type === "bus" && new Set(current.filter((id) => S.cities[id]?.kind !== "bridgehead")).size >= 3) {
    if (uxExt.added.at(-1) !== opposite) uxExt.added.push(opposite);
    draft.stops = uxExtStops();
    draft.extensionPointer = null;
    draft.pointer = null;
    draftBar();
    $("drawtext").textContent = "公交首尾已接合 · 点应用修改确认";
    return;
  }
  if (isLoop130({ type: draft.type, stops: current })) {
    if (c?.id === (uxExt.end === "tail" ? base.at(-1) : base[0])) {
      uxExt.added = [];
    } else return;
  }
  return extMoveBefore13(e);
};
const commitBefore13 = commitDraft;
function routeRepeatIssue13(stops,type) {
  const seen=new Set(),loop=isLoop130({type,stops});
  for(let i=0;i<stops.length;i++){
    const id=stops[i];
    if(seen.has(id)&&!(i===stops.length-1&&id===stops[0]&&loop))return S.cities[id]?.kind==='bridgehead'?'线路重复经过同一桥头，请调整走向或拆分线路':'只能连接公交线路首尾，不能在中途形成闭环';
    seen.add(id);
  }
  return null;
}
commitDraft = function(...a) {
  if (draft) {
    const issue=draftCost().invalid;
    if(issue)return toast(issue);
  }
  return commitBefore13(...a);
};
function clearTransient13() {
  for (let id of [...pointers.keys()]) {
    try {
      cv.releasePointerCapture?.(id);
    } catch {
    }
  }
  pointers.clear();
  draft = null;
  bridgeDraft = null;
  gesture = null;
  engineeringPointer = null;
  selected = null;
  uxExt = null;
  modalOpen = false;
  stopUndo = null;
  lastPanelSignature = "";
  if (typeof bridgeTouch123 !== "undefined") {
    bridgeTouch123.clear();
    bridgePinch123 = null;
    bridgeBeforeTouch123 = null;
  }
  dailyReviewVisible = false;
  farmReviewVisible = false;
  automaticCards130 = false;
  deckTouch128 = null;
  uxFrameRestore = null;
  uxPreviewFrame = null;
  animateView.id = (animateView.id || 0) + 1;
  animateView.activeId = null;
  clearTimeout(toastTimer);
  $("toast")?.classList.remove("show", "undo-enabled");
  for (let id of ["modal", "details", "drawbar", "junction-picker", "delete-drop"]) {
    let e = $(id);
    if (e && !e.hidden) e.hidden = true;
  }
  if (typeof cue124 !== "undefined") cue124.hidden = true;
  document.documentElement.classList.remove("tutorial-quote125");
}
let runtimeFault13 = null;
const resumeBefore13 = resumeAfterInterruption;
resumeAfterInterruption = function(...a) { return runtimeFault13 ? false : resumeBefore13(...a); };
const saveBefore13 = save;
save = function() {
  if (runtimeFault13) return false;
  return saveBefore13();
};
function recordRuntimeFault13(error, source) {
  if (runtimeFault13) return;
  runtimeFault13 = { source, message: String(error?.message || error), stack: String(error?.stack || "").slice(0, 3e3), day: S?.day, at: Date.now() };
  console.error("Transit runtime stopped safely", JSON.stringify(runtimeFault13));
  try {
    localStorage.setItem("transit-last-error13", JSON.stringify(runtimeFault13));
  } catch {
  }
  if (S) S.paused = true;
  clearTransient13();
  let box = $("runtime-recovery13");
  if (!box) {
    box = document.createElement("section");
    box.id = "runtime-recovery13";
    box.setAttribute("role", "alert");
    document.body.appendChild(box);
  }
  box.hidden = false;
  box.innerHTML = '<h2>运行出现异常，游戏已暂停</h2><p>本次异常不会覆盖最近存档。可以返回选图，继续存档或重新开始。</p><button onclick="recoverRuntime13()">返回选图</button><button onclick="location.reload()">重新加载应用</button>';
}
function recoverRuntime13() {
  let id = S?.mapId || "east", saved = atlasSaved(id);
  clearTransient13();
  if (saved) {
    S = JSON.parse(JSON.stringify(saved));
    S.paused = true;
    if (S.interruption) S.interruption.pending = false;
    activateAtlasGeometry(id);
    configureGrowth();
  } else {
    activateAtlasGeometry(id);
    resetBefore13();
  }
  runtimeFault13 = null;
  $("runtime-recovery13").hidden = true;
  last = performance.now();
  resize();
  showAtlasMaps(false);
}
const resetBefore13 = reset;
reset = function(...a) {
  clearTransient13();
  let fault = runtimeFault13;
  runtimeFault13 = null;
  try {
    let r = resetBefore13(...a);
    $("runtime-recovery13")?.setAttribute("hidden", "");
    last = performance.now();
    return r;
  } catch (e) {
    runtimeFault13 = fault;
    throw e;
  }
};
const loadBefore13 = load;
load = function(...a) {
  clearTransient13();
  let r = loadBefore13(...a);
  last = performance.now();
  return r;
};
const renderBefore13 = render;
render = function(...a) {
  cancelAnimationFrame(drawFrame);
  return renderBefore13(...a);
};
const frameBefore13 = frame;
frame = function(now) {
  cancelAnimationFrame(drawFrame);
  try {
    if (!runtimeFault13) frameBefore13(now);
    else last = now;
  } catch (e) {
    recordRuntimeFault13(e, "frame");
  } finally {
    cancelAnimationFrame(drawFrame);
    drawFrame = requestAnimationFrame(frame);
  }
};
window.addEventListener("error", (e) => {
  if (e.error) recordRuntimeFault13(e.error, "event");
});
const newRoute13 = $("route-new130");
if (newRoute13) newRoute13.onclick = () => {
  clearSelection();
  $("newroute").click();
};
$("loop-action130")?.remove();
cancelAnimationFrame(drawFrame);
drawFrame = requestAnimationFrame(frame);
