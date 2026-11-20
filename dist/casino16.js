'use strict';
const SLOT_SYMBOLS16=['🚌','🚆','✈','🚢','🪙','🍋','C'],SLOT_TRIPLES16=[4,5,8,6,12,3,30];
// Per-pull probabilities, in the same order as the original symbols.
const SLOT_TRIPLE_PROBS1617=[.026,.023,.017,.020,.014,.030,.010];
function slotResult1617(){
 const tier=Math.random();
 if(tier<.14){let sum=0;for(let i=0;i<7;i++){sum+=SLOT_TRIPLE_PROBS1617[i];if(tier<sum||i===6)return [i,i,i];}}
 if(tier<.46){
  const pair=Math.floor(Math.random()*7),other=(pair+1+Math.floor(Math.random()*6))%7,single=Math.floor(Math.random()*3);
  return Array.from({length:3},(_,i)=>i===single?other:pair);
 }
 const pool=Array.from({length:7},(_,i)=>i),result=[];
 for(let i=0;i<3;i++)result.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
 return result;
}
let slotSpinning16=false,slotDrag16=null,slotAudio16=null,slotTimers16=[],slotLeverReturn16=null;
function cents16(v){let n=Number(v);return !Number.isFinite(n)||n<=0||n>Number.MAX_SAFE_INTEGER/100?null:Math.round(n*100);}
function slotMultiplier16(r){return r[0]===r[1]&&r[1]===r[2]?SLOT_TRIPLES16[r[0]]:new Set(r).size===2?2:0;}
function casinoCity16(){return realCities().find(c=>c.isVegas&&!c.removed);}
function casinoState16(){return S.casino16??={built:null,nextOpen:null,session:null,last:null};}
function casinoDue16(){let c=casinoCity16(),s=casinoState16();if(s.nextOpen!==null&&!s.session&&S.day>=s.nextOpen+1)s.nextOpen+=(Math.floor((S.day-s.nextOpen-1)/10)+1)*10;return !!c?.casino&&s.nextOpen!==null&&S.day>=s.nextOpen&&S.day<s.nextOpen+1&&!s.session;}
function casinoSound16(kind,speed=1){
 if(typeof cardSoundAllowed1511==='function'&&!cardSoundAllowed1511())return;
 try{
  const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return;
  slotAudio16??=new AudioCtx();slotAudio16.resume();
  const count=kind==='jackpot'?18:kind==='major'?10:kind==='win'?5:kind==='pair'?3:1;
  for(let i=0;i<count;i++){
   const osc=slotAudio16.createOscillator(),gain=slotAudio16.createGain(),time=slotAudio16.currentTime+i*.11;
   osc.type=['spin','lever','stop'].includes(kind)?'triangle':'sine';
   const freq=kind==='spin'?130+Math.min(15,speed)*18:kind==='lever'?110:kind==='stop'?260:523.25*Math.pow(2,[0,4,7,12,7,4][i%6]/12);
   osc.frequency.setValueAtTime(freq,time);if(kind==='spin'||kind==='stop')osc.frequency.exponentialRampToValueAtTime(freq*.55,time+.055);
   gain.gain.setValueAtTime(Math.max(.001,(effectsPrefs156?.volume??.5)*(kind==='spin'?.24:.16)),time);
   gain.gain.exponentialRampToValueAtTime(.001,time+.085);osc.connect(gain);gain.connect(slotAudio16.destination);
   osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(time);osc.stop(time+.10);
  }
 }catch{}
}
// The animation only reveals a result already settled and saved; it never rerolls it.
let slotFrame1617=null,slotRun1617=0;
function slotPlan1617(index,result){
 const tail=index===2?3+Math.floor(Math.random()*3):3;
 const fast=18+index*5,brake=6,total=fast+brake+tail;
 const fastEnd=[650,950,1250][index],brakeEnd=[1100,1800,2600][index],end=[2100,3900,7800+(tail-3)*600][index];
 const symbols=Array.from({length:total+3},()=>Math.floor(Math.random()*7));
 // In the final slow approach, matching symbols may pass before the actual stop.
 if(index===2&&result[0]===result[1]){symbols[total-2]=result[0];symbols[total-1]=result[0];}
 symbols[total]=result[index];
 return {index,tail,fast,brake,total,fastEnd,brakeEnd,end,symbols,lastTick:0,stopped:false};
}
function slotPosition1617(p,elapsed){
 if(elapsed<=p.fastEnd)return Math.max(0,elapsed)/p.fastEnd*p.fast;
 if(elapsed<=p.brakeEnd){const t=(elapsed-p.fastEnd)/(p.brakeEnd-p.fastEnd);return p.fast+p.brake*(1-(1-t)**2);}
 const t=Math.max(0,Math.min(1,(elapsed-p.brakeEnd)/(p.end-p.brakeEnd)));
 return p.fast+p.brake+p.tail*(1-(1-t)**1.6);
}
function slotPaint1617(el,p,position){
 const base=Math.floor(position),fraction=position-base,strip=el.querySelector('.slot-strip1617');
 if(p.paintedBase!==base){strip.innerHTML=[-1,0,1,2].map(offset=>`<b>${SLOT_SYMBOLS16[p.symbols[Math.max(0,Math.min(p.symbols.length-1,base+offset))]]}</b>`).join('');p.paintedBase=base;}
 strip.style.transform=`translateY(calc(-1 * var(--slot-cell) * ${fraction}))`;
}
function slotCelebrate1617(multiplier,payout){
 const machine=document.querySelector('.slot-machine16');if(!machine||multiplier<8)return;
 const jackpot=multiplier===30;machine.classList.add(jackpot?'is-jackpot1617':'is-major1617');
 const layer=document.createElement('div');layer.className='slot-celebration1617';layer.setAttribute('aria-hidden','true');
 layer.innerHTML=Array.from({length:jackpot?24:12},(_,i)=>`<i style="--x:${(i*37)%101}%;--delay:${i*.035}s;--drift:${((i*71)%160)-80}px">${i%3?'🪙':'✦'}</i>`).join('')+`<strong>${jackpot?'头等奖':'大奖'}<em>¥${(payout/100).toFixed(2)}</em></strong>`;
 machine.appendChild(layer);navigator.vibrate?.(jackpot?[50,70,70]:35);
}
function animateSlots1617(result,multiplier,s){
 const run=++slotRun1617,plans=result.map((_,i)=>slotPlan1617(i,result)),start=performance.now();
 casinoSound16('lever');
 const machine=document.querySelector('.slot-machine16');machine.classList.remove('is-jackpot1617','is-major1617');machine.querySelector('.slot-celebration1617')?.remove();machine.classList.add('is-running1617');
 document.querySelectorAll('.slot-reel1617').forEach(el=>el.classList.remove('is-stopped1617'));
 function frame(now){
  if(run!==slotRun1617||!slotSpinning16)return;
  const elapsed=Math.max(0,now-start);
  for(const p of plans){
   if(p.stopped)continue;const el=$('slot-reel16-'+p.index);if(!el)return;
   const pos=slotPosition1617(p,elapsed);slotPaint1617(el,p,pos);
   const tick=Math.floor(pos);if(tick>p.lastTick){p.lastTick=tick;casinoSound16('spin',elapsed<p.fastEnd?12:elapsed<p.brakeEnd?5:1);}
   if(elapsed>=p.end){p.stopped=true;el.classList.add('is-stopped1617');el.setAttribute('aria-label',SLOT_SYMBOLS16[result[p.index]]);casinoSound16('stop');}
  }
  if(plans.every(p=>p.stopped)){
   slotFrame1617=null;slotSpinning16=false;machine.classList.remove('is-running1617');
   if(multiplier)casinoSound16(multiplier===30?'jackpot':multiplier>=8?'major':multiplier===2?'pair':'win');
   renderCasino16();slotCelebrate1617(multiplier,s.payout);
   if(s.spins>=10||s.balance<=0)toast('本场结束，请退出领取剩余金额');return;
  }
  slotFrame1617=requestAnimationFrame(frame);
 }
 slotFrame1617=requestAnimationFrame(frame);
}
// Stop sounding immediately on mute/background; a returned page can finish the saved reveal.
const stopCasinoEffects1617=stopEffect156;
stopEffect156=function(...a){const r=stopCasinoEffects1617(...a);try{slotAudio16?.suspend();}catch{}return r;};
function ensureCasino164(){let c=casinoCity16();if(!c||c.casino)return false;let s=casinoState16();c.casino=true;s.built??=c.discoveredAt??S.day;s.nextOpen??=s.built+10;return true;}
function buildCasino16(){if(ensureCasino164()){save();showDetails();}}
function showCasino16(){let c=casinoCity16(),s=casinoState16();if(!c?.casino)return;if(s.session){s.firstNoticeSeen165=true;save();return renderCasino16();}if(!casinoDue16())return toast('赌城尚未开放，约'+Math.ceil(s.nextOpen-S.day)+'天后开放');s.firstNoticeSeen165=true;save();openModal(`<div class="modal-head"><h2>拉斯维加斯 · 赌城开放</h2><button class="close" onclick="closeModal()">×</button></div><p>可自由选择是否参加。先输入带入金额，最多拉10次，可提前退出，剩余金额全部返还。</p><label>带入金额（现金 ¥${S.points.toFixed(2)}）<input id="casino-entry16" type="number" min="0.01" step="0.01" inputmode="decimal" placeholder="输入金额"></label><p>每次下注自行输入。两枚相同总返还2倍；三枚相同按图标返还3—30倍，返还包含本金。每次独立随机：不中奖54%、对子32%、三连14%；三连奖金越高越稀少，C三连为1%。</p><div class="ux-actions"><button class="primary" onclick="enterCasino16()">进入赌城</button><button onclick="skipCasino16()">本次不参加</button></div>`);}
function nextCasino16(s){s.nextOpen=(s.nextOpen??S.day)+10;while(s.nextOpen<=S.day)s.nextOpen+=10;}
function skipCasino16(){let s=casinoState16();if(s.session||!casinoDue16())return;nextCasino16(s);save();closeModal();updateUI();}
function enterCasino16(){let s=casinoState16();if(s.session||!casinoDue16())return;let amount=cents16($('casino-entry16')?.value);if(!amount||amount>Math.round(S.points*100))return toast('请输入不超过现金的带入金额');spend(amount/100,'casinoBankroll','赌城带入资金');s.session={balance:amount,brought:amount,spins:0,result:null,stake:0,payout:0};nextCasino16(s);save();renderCasino16();}
function renderCasino16(){let s=casinoState16().session;if(!s)return;openModal(`<div class="modal-head"><h2>拉斯维加斯 · 拉杆机</h2></div><div class="slot-machine16"><div class="slot-lights16"><small>LAS VEGAS</small>LUCKY SEVEN</div><div class="slot-reels16">${(s.result||[0,1,2]).map((x,i)=>`<span class="slot-reel1617" id="slot-reel16-${i}" aria-label="${SLOT_SYMBOLS16[x]}"><i class="slot-strip1617">${[-1,0,1,2].map(d=>`<b>${SLOT_SYMBOLS16[(x+d+7)%7]}</b>`).join('')}</i></span>`).join('')}</div><div class="slot-lever-track16"><button id="slot-lever16" aria-label="按住并向下拉动拉杆"><i></i></button></div><div class="slot-status16" aria-live="polite">${s.result?(s.payout?'返还 ¥'+(s.payout/100).toFixed(2):'本次未中奖'):'按住红色拉杆，向下拉到底后松手'}</div></div><div class="market-metrics"><div>本场余额<strong>¥${(s.balance/100).toFixed(2)}</strong></div><div>已拉次数<strong>${s.spins} / 10</strong></div></div><label>本次下注金额<input id="slot-stake16" type="number" inputmode="decimal" min="0.01" step="0.01" value="${s.stake?s.stake/100:''}" placeholder="自行输入，不固定下注"></label><p class="market-muted">恰好两枚相同 ×2；三枚相同：🍋×3、🚌×4、🚆×5、🚢×6、✈×8、🪙×12、C×30。返还包含本金。三个不同54%；对子32%；三连14%：🍋3%、🚌2.6%、🚆2.3%、🚢2%、✈1.7%、🪙1.4%、C1%。每次独立随机。</p><button id="slot-exit16" onclick="exitCasino16()" class="secondary">带钱离场</button>`);
 let lever=$('slot-lever16'),bottom=108;clearTimeout(slotLeverReturn16);slotDrag16=null;lever.disabled=s.spins>=10||s.balance<=0;
 function spring(delay=0){lever.classList.remove('is-dragging16');clearTimeout(slotLeverReturn16);slotLeverReturn16=setTimeout(()=>{lever.style.setProperty('--pull','0px');slotLeverReturn16=null;},delay);}
 lever.addEventListener('pointerdown',e=>{if(slotSpinning16||lever.disabled||slotDrag16)return;e.preventDefault();e.stopPropagation();clearTimeout(slotLeverReturn16);slotDrag16={id:e.pointerId,y:e.clientY,travel:0,detent:-1};lever.classList.add('is-dragging16');lever.setPointerCapture?.(e.pointerId);});
 lever.addEventListener('pointermove',e=>{let d=slotDrag16;if(!d||d.id!==e.pointerId)return;e.preventDefault();e.stopPropagation();d.travel=Math.min(bottom,Math.pow(Math.max(0,e.clientY-d.y)/115,.8)*bottom);lever.style.setProperty('--pull',d.travel+'px');let detent=Math.floor(d.travel/18);if(detent!==d.detent){d.detent=detent;casinoSound16('lever');navigator.vibrate?.(8);}});
 function release(e,cancel){e.stopPropagation();let d=slotDrag16;if(!d||d.id!==e.pointerId)return;slotDrag16=null;if(lever.hasPointerCapture?.(e.pointerId))lever.releasePointerCapture?.(e.pointerId);if(!cancel&&d.travel>=bottom*.86){lever.style.setProperty('--pull',bottom+'px');lever.getBoundingClientRect();let spun=spinCasino16();spring(spun?140:0);}else spring();}
 lever.addEventListener('pointerup',e=>release(e,false));lever.addEventListener('pointercancel',e=>release(e,true));lever.addEventListener('lostpointercapture',e=>release(e,true));}

function spinCasino16(){let s=casinoState16().session;if(!s||slotSpinning16||s.spins>=10)return;let stake=cents16($('slot-stake16')?.value);if(!stake||stake>s.balance)return toast('请输入不超过本场余额的下注金额');let result=slotResult1617(),multiplier=slotMultiplier16(result),payout=stake*multiplier;if(!Number.isSafeInteger(payout))return toast('下注金额过大');
 // Result and settlement are persisted together before any animation begins.
 s.balance=s.balance-stake+payout;s.spins++;s.result=result;s.stake=stake;s.payout=payout;if(typeof recordCasinoSpin1610==='function')recordCasinoSpin1610(s);save();slotSpinning16=true;$('slot-exit16').disabled=true;$('slot-lever16').disabled=true;document.querySelector('.slot-status16').textContent='转动中…';$('slot-stake16').disabled=true;animateSlots1617(result,multiplier,s);return true;}
function exitCasino16(){let state=casinoState16(),s=state.session;if(!s)return closeModal();if(slotSpinning16)return toast('请等待本次结果停止');state.last={...s,ended:S.day};state.session=null;if(s.balance>0)credit(s.balance/100,'casinoReturns','赌城带出余额');if(typeof recordCasinoExit1610==='function')recordCasinoExit1610(s);save();closeModal();updateUI();}
const casinoCloseBefore16=closeModal;
closeModal=function(...a){if(S?.casino16?.session)return;return casinoCloseBefore16(...a);};

const casinoDetailsBefore16=showDetails;
showDetails=function(...a){let r=casinoDetailsBefore16(...a);if(selected?.type==='city'){let c=S.cities[selected.id],el=$('details');if(c?.isVegas&&!el.querySelector('.casino-action16'))el.innerHTML+=`<div class="detail-actions casino-action16"><button onclick="${c.casino?'showCasino16()':'buildCasino16()'}">${c.casino?'赌城 · '+(casinoDue16()?'现已开放':'每10天开放'):'建设赌城 ¥100'}</button></div>`;}return r;};
