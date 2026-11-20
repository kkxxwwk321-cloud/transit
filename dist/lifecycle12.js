'use strict';
// Interface interruptions pause simulation time; wall-clock time is never replayed.
function interruptionPending(){return !!S?.interruption?.pending;}
function disableInterruptedAutoResume(){
 if(S.financial?.dailyReview)S.financial.dailyReview.wasRunning=false;
 if(S.financial?.marketPause)S.financial.marketPause.wasRunning=false;
 if(S.agriculture?.pending)S.agriculture.pending.wasRunning=false;
 atlasWasPaused=true;
}
const saveBeforeLifecycle12=save;
save=function(){if(S){S.release='1.6.10';if(interruptionPending()){S.paused=true;disableInterruptedAutoResume();}}return saveBeforeLifecycle12();};
function interruptGame(reason='界面中断'){
 if(!S)return;
 let already=interruptionPending();if(already)return;S.interruption={pending:true,reason,day:S.day};S.paused=true;disableInterruptedAutoResume();
 // An unfinished drag is only a quote, never a paid construction transaction.
 draft=null;bridgeDraft=null;engineeringPointer=null;gesture=null;pointers.clear();hideJunction();showDeleteDrop(false);$('drawbar').hidden=true;
 last=performance.now();let saved=save();updateUI();
 if(!already||saved===false)toast(saved===false?'界面已中断 · 已暂停，设备存储未能完成保存':'界面已中断 · 已暂停保存，点 ▶ 手动继续');
}
function canResumeInterface(){return !window.transitAndroidBackground13&&(window.transitNativeLifecycle13||(!document.hidden&&document.visibilityState!=='hidden'));}
function resumeAfterInterruption(){
 if(!canResumeInterface()||S.lives<=0)return false;
 if(S.interruption)S.interruption.pending=false;last=performance.now();S.paused=false;save();updateUI();return true;
}
const closeBeforeLifecycle12=closeModal;
closeModal=function(){closeBeforeLifecycle12();if(interruptionPending()){S.paused=true;disableInterruptedAutoResume();save();updateUI();}};
const tickBeforeLifecycle12=tick;
tick=function(dt){if(interruptionPending()){S.paused=true;return;}return tickBeforeLifecycle12(dt);};
const frameBeforeLifecycle12=frame;
frame=function(now){if(interruptionPending())S.paused=true;return frameBeforeLifecycle12(now);};
function toggleLifecyclePause(){if(S.paused){if(resumeAfterInterruption())return;}else{S.paused=true;save();updateUI();}}
$('pause').onclick=toggleLifecyclePause;
// Capture Space before the legacy shortcut so it cannot bypass the resume lock.
document.addEventListener('keydown',e=>{if(e.code!=='Space')return;if(['INPUT','TEXTAREA','SELECT','BUTTON'].includes(e.target?.tagName)||e.target?.isContentEditable){e.stopImmediatePropagation();return;}e.preventDefault();e.stopImmediatePropagation();if(atlasMenuOpen||modalOpen)return;toggleLifecyclePause();},true);
// Foreground focus changes (notification banners / volume UI) are not background transitions.
window.addEventListener('pagehide',()=>interruptGame('页面离开'));
window.addEventListener('beforeunload',()=>interruptGame('页面关闭'));
document.addEventListener('visibilitychange',()=>{if(!window.transitNativeLifecycle13&&(document.hidden||document.visibilityState==='hidden'))interruptGame('界面进入后台');});
document.addEventListener('freeze',()=>{if(!window.transitNativeLifecycle13)interruptGame('页面冻结');});
function retainInterruptionPause(){last=performance.now();if(interruptionPending()){S.paused=true;disableInterruptedAutoResume();save();updateUI();toast('已回到游戏 · 当前暂停，点 ▶ 继续');}}
window.addEventListener('focus',()=>{last=performance.now();});window.addEventListener('pageshow',retainInterruptionPause);document.addEventListener('resume',retainInterruptionPause);
const startAtlasBeforeLifecycle12=startAtlasMap;
startAtlasMap=function(){if(!canResumeInterface())return;startAtlasBeforeLifecycle12();if(!atlasMenuOpen&&S.lives>0)resumeAfterInterruption();};
const startBeforeLifecycle12=startGame;
startGame=function(){if(!canResumeInterface())return;startBeforeLifecycle12();resumeAfterInterruption();};
const helpBeforeLifecycle12=help;
help=function(){helpBeforeLifecycle12();$('modal-content').innerHTML+='<section class="infra-card"><h3>v1.2 · 容量科研与中断保护</h3><p>6所大学解锁科研，一次研究一项。运载量研究：公交＋20%（6000／30天）；动车＋15%（9000／45天）；高铁＋15%（12000／60天）；航空＋15%（15000／60天）。速度与运载量分别研究，对已有及新购车辆生效。</p><p>卡牌和科研容量加成相加，按当前车厢编组的基础容量计算，统一向下取整，最高200%；列车仍最多8节。基础容量不含任何百分比加成。</p><p>切后台、锁屏或页面冻结时自动暂停并保存；手机通知横幅、音量条和前台短暂失焦不暂停；返回后手动点播放继续。不会补算离开期间的交通、行情、农田或科研时间；中断后的弹窗关闭也不会自动恢复交通。未完成的拉线安全取消，不扣费。</p></section>';};$('help').onclick=()=>help();
S.release='1.6.10';if(interruptionPending()){S.paused=true;disableInterruptedAutoResume();}save();
