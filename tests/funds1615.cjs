const create=require('./harness156.cjs'),assert=require('node:assert/strict');
for(const [map,start]of [['east',7000],['west',8000],['ocean',12000]]){
 const g=create(),{run}=g;run(`activateAtlasGeometry('${map}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;`);assert.equal(run('S.points'),start);
 run(`var toastMoney15=[],toastBefore15=toast;toast=function(t,...a){toastMoney15.push(String(t));return toastBefore15(t,...a);};var subsidyBefore15=S.ledger.subsidy;var stepMoney15=()=>{if(modalOpen)closeModal();S.paused=false;realCities().forEach(c=>{c.grace=10000;c.dormant=false;});tick(.25);};S.day=9.99;S.periods=0;stepMoney15();`);
 assert.equal(run('S.ledger.subsidy-subsidyBefore15'),2000);assert.equal(run('S.points'),start+2000);assert(run(`toastMoney15.some(t=>t.includes('补助')&&t.includes('2000'))`));
 run('stepMoney15();');assert.equal(run('S.ledger.subsidy-subsidyBefore15'),2000);
 // Continue an existing save: cash and paid subsidy period must survive without back pay.
 run(`S.points=4321;var citiesBefore15=JSON.stringify(S.cities.map(c=>[c.id,c.x,c.y]));save();load();`);assert.equal(run('S.points'),4321);assert.equal(run('S.periods'),1);assert.equal(run('JSON.stringify(S.cities.map(c=>[c.id,c.x,c.y]))'),run('citiesBefore15'));
 run('stepMoney15();');assert.equal(run('S.points'),4321);assert.equal(run('S.ledger.subsidy-subsidyBefore15'),2000);
 run('S.day=19.99;stepMoney15();');assert.equal(run('S.points'),6321);assert.equal(run('S.ledger.subsidy-subsidyBefore15'),4000);assert.equal(run('S.periods'),2);
 run('save();load();stepMoney15();');assert.equal(run('S.points'),6321);
 assert.equal(run('S.release'),'1.6.15');assert.equal(run('runtimeFault13'),null);assert.deepEqual(g.errors,[]);console.log('PASS '+map+' start '+start+', day10/day20 +2000 once, correct toast/ledger, old cash/positions/period preserved');g.dom.window.close();
}
