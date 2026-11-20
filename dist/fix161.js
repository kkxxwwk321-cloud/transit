'use strict';
function invalidateRouteDrawing161(){uxOctPlanState=null;uxOctPlanKey=null;uxOctPlanAt=-Infinity;uxOctPlan.clear();laneFrameMemo.clear();vehicleVisuals.clear();routingBatch=null;lastPanelSignature='';}
function clearRoutePointer161(){for(let id of pointers.keys())try{cv.releasePointerCapture?.(id);}catch{}pointers.clear();gesture=null;uxExt=null;lastSnap123=null;if(draft){draft.pointer=null;delete draft.extensionPointer;}showDeleteDrop(false);}
const cancelBefore161=cancelDraft;
cancelDraft=function(...a){let id=draft?.original;clearRoutePointer161();let r=cancelBefore161(...a);if(id!=null)routeGhosts=routeGhosts.filter(g=>g.line.id!==id);invalidateRouteDrawing161();return r;};
const finishBefore161=finishPointer;
finishPointer=function(e){let r=finishBefore161(e);if(!pointers.size&&!uxExt&&draft){draft.pointer=null;delete draft.extensionPointer;invalidateRouteDrawing161();draftBar();}return r;};
const extendFinishBefore161=uxExtFinish;
uxExtFinish=function(...a){let r=extendFinishBefore161(...a);if(draft){draft.pointer=null;delete draft.extensionPointer;}invalidateRouteDrawing161();return r;};
const commitBefore161=commitDraft;
commitDraft=function(...a){if(!draft)return;let d={...draft,stops:[...draft.stops]},oldIds=new Set(S.lines.map(l=>l.id)),oldVehicleIds=new Set(S.vehicles.map(v=>v.id)),oldInfrastructure=new Set(Object.keys(S.infrastructure)),oldCorridors=new Set(Object.keys(S.corridors)),oldStops=d.original?[...S.lines.find(l=>l.id===d.original).stops]:null,oldDormant=realCities().filter(c=>c.dormant).map(c=>c.id),r=commitBefore161(...a);if(draft)return r;let line=d.original?S.lines.find(l=>l.id===d.original):S.lines.find(l=>!oldIds.has(l.id));invalidateRouteDrawing161();clearRoutePointer161();if(!line||!constructionUndo)return r;
 let receipt=constructionUndo;receipt.route161={lineId:line.id,original:!!d.original,before:oldStops};receipt.lineId=line.id;
 if(!d.original){let newVehicles=S.vehicles.filter(v=>!oldVehicleIds.has(v.id)),newKeys=Object.keys(S.infrastructure).filter(k=>!oldInfrastructure.has(k)),newCorridors=Object.keys(S.corridors).filter(k=>!oldCorridors.has(k)),originalUndo=receipt.undo;
 receipt.canUndo=()=>S.lines.some(l=>l.id===line.id&&!l.retiring)&&newVehicles.every(v=>S.vehicles.includes(v)&&!v.retired&&!v.recall&&!v.assetReturned&&!v.people.length&&!v.hasTransported)&&S.vehicles.filter(v=>v.line===line.id).every(v=>newVehicles.includes(v))&&newKeys.every(k=>!otherLineUses(k,line.id));
 receipt.undo=()=>{originalUndo();S.lines=S.lines.filter(l=>l.id!==line.id);S.vehicles=S.vehicles.filter(v=>v.line!==line.id);for(let k of newKeys)if(!otherLineUses(k,line.id)){delete S.infrastructure[k];delete S.corridors[k];delete S.blockages[k];}for(let k of newCorridors)if(!otherLineUses(k,line.id))delete S.corridors[k];for(let id of oldDormant){let c=S.cities[id];if(!S.lines.some(l=>l.stops.includes(id))&&!c.q.length)c.dormant=true;}};
 }
 return r;};
const undoBefore161=undoConstruction;
undoConstruction=function(){let u=constructionUndo;if(!u?.route161){let r=undoBefore161();invalidateRouteDrawing161();return r;}if(performance.now()>u.expires){constructionUndo=null;showUndoBuild();return toast('撤回时间已过');}if(!u.canUndo())return toast('路线已载客、资产已变化或被共用，无法全额撤回');let backup=JSON.stringify(S),id=u.route161.lineId;try{u.undo();if(!u.route161.original&&(S.lines.some(l=>l.id===id)||S.vehicles.some(v=>v.line===id)))throw Error('路线仍存在');if(u.route161.original&&S.lines.find(l=>l.id===id)?.stops.join(',')!==u.route161.before.join(','))throw Error('原路线未恢复');}catch(e){S=JSON.parse(backup);constructionUndo=null;invalidateRouteDrawing161();showUndoBuild();return toast('撤回未完成，资金未退款，请重试');}constructionUndo=null;routeGhosts=routeGhosts.filter(g=>g.line.id!==id);if(stopUndo?.lineId===id)stopUndo=null;draft=null;clearRoutePointer161();clearSelection();invalidateRouteDrawing161();$('drawbar').hidden=true;credit(u.paid,'refunds','撤回'+u.label+'全额退款');showUndoBuild();updateUI();save();toast('路线已撤回 · 全额返还 ¥'+u.paid);};
// The first modal owns the pause snapshot. Replacing its contents keeps that same snapshot.
let modalLease161=null,modalIntent161=null,frameRunning161=false,framePaused161=true;
const modalBefore161=openModal;
openModal=function(html){if(!modalOpen||!modalLease161||modalLease161.state!==S){let paused=modalIntent161?.state===S?modalIntent161.paused:frameRunning161?framePaused161:S.paused;modalLease161={state:S,paused,exit:/saveExit123|saveAndExit|保存并返回选图/.test(html)};}let r=modalBefore161(html);S.paused=true;return r;};
const closeBefore161=closeModal;
closeModal=function(...a){let lease=modalLease161,r=closeBefore161(...a);if(modalOpen)return r;modalLease161=null;if(lease?.state===S){let t=S.tutorial123,teaching=t&&!['wait','done','second-wait'].includes(t.stage),blocked=lease.exit||interruptionPending()||!canResumeInterface()||!!runtimeFault13||S.lives<=0||atlasMenuOpen||teaching;S.paused=blocked?true:lease.paused;last=performance.now();updateUI();save();}return r;};
const modalRoots161=['shop','help','showEngineering','showWeather','showTransportResearch','showFinancialMarket','showFinance','showMaintenance','showTasks','showActivityCards','showAchievements14','showCityEconomy','showAgriculture','openBrief15','showCasino16','showVehicleDetails','chooseType','showConstructionConfirmation','openCity','askExit123','uxOpenHub'];
for(let name of modalRoots161){let f=globalThis[name];if(typeof f!=='function')continue;globalThis[name]=function(...a){let old=modalIntent161;if(!modalOpen&&!modalLease161)modalIntent161={state:S,paused:S.paused};try{return f.apply(this,a);}finally{modalIntent161=old;}};}
document.addEventListener('click',e=>{if(modalOpen||modalLease161||!e.target.closest?.('button,a')||e.target.closest('#pause,#speed'))return;let token={state:S,paused:S.paused};modalIntent161=token;queueMicrotask(()=>{if(modalIntent161===token)modalIntent161=null;});},true);
const frameBefore161=frame;
frame=function(...a){frameRunning161=true;framePaused161=S.paused;try{return frameBefore161(...a);}finally{frameRunning161=false;}};
const uiBefore161=updateUI;
updateUI=function(...a){let r=uiBefore161(...a),d=formatDate(),date=$('date'),tag=$('calendar-tag');date.textContent=d.month+'月'+d.day+'日';let detail=tag.textContent.replace(/^第\d+年\s*·?\s*/,'');tag.textContent='第'+d.year+'年 · '+detail;return r;};
const resetBefore161=reset;
reset=function(...a){modalLease161=null;modalIntent161=null;let r=resetBefore161(...a);invalidateRouteDrawing161();S.release='1.6.11';return r;};
const loadBefore161=load;
load=function(...a){modalLease161=null;modalIntent161=null;let r=loadBefore161(...a);invalidateRouteDrawing161();return r;};
updateUI();
