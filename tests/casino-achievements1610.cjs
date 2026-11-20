const assert=require('node:assert/strict'),create=require('./harness156.cjs'),g=create(),{run,w,timers}=g;
function setup(){run(`slotSpinning16=false;casinoState16().session=null;activateAtlasGeometry('ocean');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.points=10000;var vegas1610=realCities()[0];vegas1610.isVegas=true;vegas1610.casino=true;S.casino16={built:S.day-10,nextOpen:S.day,session:null,last:null};achievements14.unlocked={};achievements14.best={};achievements14.seen={};achPending14=[];showCasino16();`);w.document.getElementById('casino-entry16').value='100';run('enterCasino16()');}
function spin(symbols,stake='10'){w.document.getElementById('slot-stake16').value=stake;run(`var originalRandom1610=Math.random,rolls1610=${JSON.stringify(symbols)};Math.random=()=>rolls1610.length?(rolls1610.shift()+.2)/7:.5;spinCasino16();Math.random=originalRandom1610;`);}
function finish(){const t=timers.filter(t=>t.ms===2050).at(-1);assert(t);t.f();}
function has(id){return run(`!!achievements14.unlocked['${id}']`)}
setup();assert.equal(run('ACHIEVEMENTS14.length'),38);assert.equal(run('new Set(ACHIEVEMENTS14.map(a=>a.id)).size'),38);
// A displayed/default triple, invalid input or an unplayed exit never counts.
run('renderCasino16()');assert(!has('slotTriple'));spin([6,6,6],'0');assert.equal(run('casinoState16().session.spins'),0);run('exitCasino16()');assert(!has('casinoNoProfit'));assert(!has('slotJackpot'));
for(let symbol=0;symbol<7;symbol++){
 setup();spin([symbol,symbol,symbol]);assert(has('slotTriple'));assert.equal(has('slotJackpot'),symbol===6);assert(!has('casinoNoProfit'));
 const money=run('S.points');run('exitCasino16()');assert(run('!!casinoState16().session'));assert.equal(run('S.points'),money);
 finish();const cashout=run('casinoState16().session.balance/100');run('exitCasino16();exitCasino16()');assert.equal(run('S.points'),money+cashout);assert(!has('casinoNoProfit'));
}
// Winning something does not disqualify an overall break-even/losing visit.
setup();spin([0,0,1]);assert(!has('slotTriple'));finish();spin([0,1,2]);finish();assert.equal(run('casinoState16().session.balance'),10000);assert(!has('casinoNoProfit'));run('exitCasino16()');assert(has('casinoNoProfit'));
setup();spin([0,1,2]);finish();run('exitCasino16()');assert(has('casinoNoProfit'));
setup();spin([0,1,2],'100');finish();assert.equal(run('casinoState16().session.balance'),0);run('exitCasino16()');assert(has('casinoNoProfit'));
// Settlement awards persist even if reload happens before the reels stop.
setup();spin([6,6,6]);assert(has('slotTriple')&&has('slotJackpot'));const saved=Object.fromEntries(Array.from({length:w.localStorage.length},(_,i)=>{let k=w.localStorage.key(i);return [k,w.localStorage.getItem(k)]}));
run('save();load();');assert(has('slotJackpot'));run('slotSpinning16=false;exitCasino16();reset();');assert(has('slotJackpot'));
const cold=create({saves:saved});assert(cold.run("!!achievements14.unlocked.slotJackpot&&!!achievements14.unlocked.slotTriple"));cold.dom.window.close();
run('casinoState16().session=null;closeModal();showAchievements14();');assert(w.document.getElementById('modal-content').textContent.includes('赌城见闻'));for(const name of ['三连好运','头等奖','白忙一场'])assert(w.document.getElementById('modal-content').textContent.includes(name));assert(w.document.querySelector('.uxa-count').textContent.includes('/ 38'));
assert.deepEqual(g.errors,[]);g.dom.window.close();console.log('PASS 38 unique achievements; all seven triples, C jackpot, rejected/preview/zero-spin exclusions, net break-even/loss/bust exit, animation lock, once-only cashout and cold/restart persistence');
