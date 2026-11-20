const assert=require('node:assert/strict'),g=require('./harness156.cjs')({legacyTerrain166:true}),{run,w}=g;
run(`atlasMenuOpen=false;closeModal();S.tutorial123=null;S.casino16={nextOpen:20,session:{balance:100000,brought:100000,spins:0,result:null,stake:1000,payout:0}};renderCasino16();var slotStart17=performance.now();var oldRoll17=slotResult1617;slotResult1617=()=>[6,6,6];spinCasino16();slotResult1617=oldRoll17;`);
assert.equal(run('casinoState16().session.balance'),129000);assert(run('slotSpinning16'));
assert(w.document.getElementById('slot-exit16').disabled);assert(w.document.getElementById('slot-stake16').disabled);
function frame(ms){g.raf13.get(run('slotFrame1617'))(run('slotStart17')+ms);}
frame(2200);assert(w.document.getElementById('slot-reel16-0').classList.contains('is-stopped1617'));assert(!w.document.getElementById('slot-reel16-1').classList.contains('is-stopped1617'));assert(!w.document.querySelector('.slot-celebration1617'));
frame(4000);assert(w.document.getElementById('slot-reel16-1').classList.contains('is-stopped1617'));assert(!w.document.getElementById('slot-reel16-2').classList.contains('is-stopped1617'));assert(!w.document.querySelector('.slot-celebration1617'));
frame(7500);assert(run('slotSpinning16'));frame(10000);
assert(!run('slotSpinning16'));assert(w.document.querySelector('.is-jackpot1617'));assert(w.document.querySelector('.slot-celebration1617'));assert(!w.document.getElementById('slot-exit16').disabled);
for(let i=0;i<3;i++)assert.equal(w.document.getElementById('slot-reel16-'+i).getAttribute('aria-label'),'C');
// 3, 4 or 5 tail cells are sampled without changing the actual result; no overshoot/reversal.
for(const n of [0,.4,.999]){
 run(`var oldRandom17=Math.random;Math.random=()=>${n};var plan17=slotPlan1617(2,[0,0,6]);Math.random=oldRandom17;`);
 assert(run('plan17.tail>=3&&plan17.tail<=5'));assert.equal(run('plan17.symbols[plan17.total]'),6);
 let prev=-1;for(let ms=0;ms<=10000;ms+=20){let pos=run(`slotPosition1617(plan17,${ms})`);assert(pos>=prev);assert(pos<=run('plan17.total'));prev=pos;}
 assert(run('slotPosition1617(plan17,plan17.end-1000)>plan17.total-1'));
}
// Audio obeys mute/background; no jackpot replay after a saved result is reopened.
run(`var soundCount17=0;window.AudioContext=class{constructor(){this.currentTime=0;this.destination={};}resume(){} suspend(){}createOscillator(){soundCount17++;return {frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(){},stop(){}}}createGain(){return {gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}};effectsPrefs156.enabled=true;casinoSound16('spin',12);`);
assert(run('soundCount17>0'));const count=run('soundCount17');run("effectsPrefs156.enabled=false;casinoSound16('spin');");assert.equal(run('soundCount17'),count);run("effectsPrefs156.enabled=true;");g.setHidden(true);run("casinoSound16('spin');");assert.equal(run('soundCount17'),count);g.setHidden(false);
run('renderCasino16();');assert(!w.document.querySelector('.slot-celebration1617'));run('exitCasino16();exitCasino16();');assert(!run('casinoState16().session'));
assert.deepEqual(g.errors,[]);g.dom.window.close();console.log('PASS sequential 2.1/3.9/7.8–9s stops, slow final cells, fixed result, no early/replayed award, lock and audio mute/background');
