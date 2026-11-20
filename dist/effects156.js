'use strict';
// Local connection, card and ship effects.
const effectsKey156 = 'transit-effects-v1';
let effectsPrefs156 = { enabled: true, volume: 0.5 };
try {
  const saved = JSON.parse(localStorage.getItem(effectsKey156) || 'null');
  if (typeof saved?.enabled === 'boolean') effectsPrefs156.enabled = saved.enabled;
  if (Number.isFinite(saved?.volume)) effectsPrefs156.volume = Math.max(0, Math.min(1, saved.volume));
} catch (_) {}
let effect156 = null, effectsAway156 = false;
const cardAudio1511=new Map(),cardTimers1511=new Set();
let cardGeneration1511=0,rarityTimer1511=null,cardRevealBatch1511=null;
function stopEffect156() {
  try { effect156?.pause(); } catch (_) {}
  cardGeneration1511++;
  for(const timer of cardTimers1511)clearTimeout(timer);
  cardTimers1511.clear();rarityTimer1511=null;
  for(const a of cardAudio1511.values())try{a.pause();}catch(_){}
}
function cardSoundAllowed1511(){return effectsPrefs156.enabled&&effectsPrefs156.volume>0&&!effectsAway156&&!document.hidden&&!window.transitAndroidBackground13;}
function playCardSound1511(name){
  if(!cardSoundAllowed1511())return;
  try{
    let a=cardAudio1511.get(name);
    if(!a){a=new Audio('audio/'+name+'.wav');a.id=name+'1511';a.hidden=true;a.preload='auto';document.body.appendChild(a);cardAudio1511.set(name,a);}
    const generation=cardGeneration1511;
    a.pause();a.currentTime=0;a.volume=effectsPrefs156.volume*.3;
    Promise.resolve(a.play()).then(()=>{if(generation!==cardGeneration1511||!cardSoundAllowed1511())a.pause();}).catch(()=>{});
  }catch(_){}
}
function cardDelay1511(callback,delay){
  if(!cardSoundAllowed1511())return null;
  const generation=cardGeneration1511;
  const timer=setTimeout(()=>{if(!cardTimers1511.delete(timer)||generation!==cardGeneration1511||!cardSoundAllowed1511())return;callback();},delay);
  cardTimers1511.add(timer);return timer;
}
function cardRarity1511(star,delay){
  if(star<5)return;
  if(rarityTimer1511!==null){clearTimeout(rarityTimer1511);cardTimers1511.delete(rarityTimer1511);}
  rarityTimer1511=cardDelay1511(()=>{rarityTimer1511=null;playCardSound1511('card-rare-'+(star>=6?6:5));},delay);
}
const revealBefore1511=revealActivity;
revealActivity=function(id){
  const card=activityState().offers.find(e=>e.id===id),wasRevealed=card?.revealed;
  const result=revealBefore1511(id);
  if(card&&!wasRevealed&&card.revealed){
    if(cardRevealBatch1511)cardRevealBatch1511.push(card.star);
    else{playCardSound1511('card-flip');cardRarity1511(card.star,280);}
  }
  return result;
};
const revealAllBefore1511=revealAllActivities;
revealAllActivities=function(...args){
  const stars=[];cardRevealBatch1511=stars;
  let result;try{result=revealAllBefore1511(...args);}finally{cardRevealBatch1511=null;}
  // A soft stagger avoids three simultaneous flips or stacked rarity chimes.
  stars.forEach((star,i)=>i?cardDelay1511(()=>playCardSound1511('card-flip'),i*160):playCardSound1511('card-flip'));
  if(stars.length)cardRarity1511(Math.max(...stars),(stars.length-1)*160+280);
  return result;
};
function playConnect156() {
  if (!effectsPrefs156.enabled || !effectsPrefs156.volume || effectsAway156 || document.hidden || window.transitAndroidBackground13) return;
  try {
    if (!effect156) { effect156 = new Audio('audio/connect.wav'); effect156.preload = 'auto'; effect156.id = 'connect-effect156'; effect156.hidden = true; document.body.appendChild(effect156); }
    effect156.pause(); effect156.currentTime = 0; effect156.volume = effectsPrefs156.volume;
    Promise.resolve(effect156.play()).then(() => {
      if (!effectsPrefs156.enabled || effectsAway156 || document.hidden || window.transitAndroidBackground13) stopEffect156();
    }).catch(() => {});
  } catch (_) {}
}
function setEffects156(key, value) {
  if (key === 'enabled') effectsPrefs156.enabled = !!value;
  else if (key === 'volume') effectsPrefs156.volume = Math.max(0, Math.min(1, Number(value) || 0));
  else return;
  try { localStorage.setItem(effectsKey156, JSON.stringify(effectsPrefs156)); } catch (_) {}
  if (!effectsPrefs156.enabled || !effectsPrefs156.volume) stopEffect156();
  for(const a of cardAudio1511.values())a.volume=effectsPrefs156.volume*.3;
  renderEffects156();
}
function renderEffects156() {
  const button = $('effects-on156'), volume = $('effects-volume156');
  if (button) { button.textContent = effectsPrefs156.enabled ? '开启' : '关闭'; button.setAttribute('aria-pressed', String(effectsPrefs156.enabled)); }
  if (volume && document.activeElement !== volume) volume.value = Math.round(effectsPrefs156.volume * 100);
}
function openEffects156() {
  openModal('<div class="effects-sheet156"><div class="modal-head"><h2>声音设置</h2><button class="close" onclick="closeModal()" aria-label="关闭声音设置">×</button></div><div class="effects-row156"><label for="effects-on156">游戏音效</label><button id="effects-on156" onclick="setEffects156(\'enabled\',!effectsPrefs156.enabled)"></button></div><label class="effects-volume156" for="effects-volume156">音量<input id="effects-volume156" type="range" min="0" max="100" step="5" oninput="setEffects156(\'volume\',this.value/100)"></label><p>包含连接城市、翻牌、高星揭晓和偶发轮船汽笛音效；翻牌声采用较低音量。</p><button onclick="playConnect156()">试听</button><button class="primary" onclick="closeModal()">完成</button></div>');
  renderEffects156();
}
for (const parent of [document.querySelector('header .controls'), document.querySelector('.atlas-top')]) {
  if (!parent) continue;
  const button = document.createElement('button');
  button.type = 'button'; button.className = 'ctl effects-button156'; button.textContent = '♪';
  button.title = '声音设置'; button.setAttribute('aria-label', '声音设置'); button.onclick = openEffects156;
  parent.appendChild(button);
}
// Observe accepted snap transitions across new lines and either-end extensions.
// Repeated move/up events over the same city do not add another stop or sound.
function withSnapSound156(handler, event) {
  const before = [...(draft?.stops || gesture?.baseStops || gesture?.cityLine?.stops || [])];
  const kind = gesture?.kind;
  const result = handler(event);
  if (!draft || !['draft', 'city-edit'].includes(gesture?.kind || kind)) return result;
  const cities = draft.stops.filter(id => S.cities[id]?.kind !== 'bridgehead');
  if (cities.length >= 2 && cities.some(id => !before.includes(id)) && !draftCost().invalid) playConnect156();
  return result;
}
const moveBeforeEffects156 = movePointer, finishBeforeEffects156 = finishPointer;
movePointer = function (event) { return withSnapSound156(moveBeforeEffects156, event); };
finishPointer = function (event) { return withSnapSound156(finishBeforeEffects156, event); };
document.addEventListener('visibilitychange', () => { if (document.hidden) stopEffect156(); });
window.addEventListener('pagehide', () => { effectsAway156 = true; stopEffect156(); });
window.addEventListener('pageshow', () => { effectsAway156 = false; });
// The native bridge uses interruptGame even when WebView visibility does not change.
const interruptBeforeEffects156 = interruptGame;
interruptGame = function (...args) { stopEffect156(); return interruptBeforeEffects156(...args); };
