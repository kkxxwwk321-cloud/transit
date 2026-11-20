const assert=require('node:assert/strict');
const g=require('./harness156.cjs')({legacyTerrain166:true}),{run,w}=g;
const ids=['stockProfit','stockLoss','wealthProfit','wealthLoss'];
function setup(){run(`
 activateAtlasGeometry('east');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;S.day=10;S.points=10000;
 achievements14={version:1,nextRun:1,total:0,runs:{},best:{},unlocked:{},seen:{}};achPending14=[];achDirty14=true;
 S.financial=null;var f1514=financeState();f1514.everBank=true;f1514.everBroker=true;openStockMarket();var s1514=f1514.market.stocks[0];
`);}
const has=id=>run(`!!achievements14.unlocked['${id}']`);
setup();assert.equal(run('ACHIEVEMENTS14.length'),38);
for(const [id,name,grade,target] of [['stockProfit','幸运儿','gold',15],['stockLoss','险些腰斩','gold',30],['wealthProfit','靠谱的经理','silver',15],['wealthLoss','打水漂','silver',30]]){
 assert.equal(run(`JSON.stringify(ACHIEVEMENTS14.find(a=>a.id==='${id}'))`),JSON.stringify({id,name,description:run(`ACHIEVEMENTS14.find(a=>a.id==='${id}').description`),grade,category:'金融传奇',target}));
}
run('s1514.shares=10;s1514.cost=100;s1514.price=11.49999;achFinance14()');assert(!has('stockProfit'));
run('s1514.price=11.5;achFinance14()');assert(has('stockProfit'));assert(!has('stockLoss'));
run('s1514.price=7.00001;achFinance14()');assert(!has('stockLoss'));
run('s1514.price=7;achFinance14()');assert(has('stockLoss'));
assert(!has('wealthProfit')&&!has('wealthLoss'),'stock gains/losses cannot award wealth medals');
setup();run('f1514.wealthLots=[{id:1,units:100,principal:100,boughtAt:0,unlockDay:1}];f1514.wealthNav=1.149999;achFinance14()');assert(!has('wealthProfit'));
run('f1514.wealthNav=1.15;achFinance14()');assert(has('wealthProfit'));
run('f1514.wealthNav=.700001;achFinance14()');assert(!has('wealthLoss'));
run('f1514.wealthNav=.7;achFinance14()');assert(has('wealthLoss'));
assert(!has('stockProfit')&&!has('stockLoss'));
setup();run('s1514.price=100;s1514.shares=0;s1514.cost=100;f1514.deposited=999;f1514.withdrawn=99999;achFinance14();s1514.shares=10;s1514.cost=0;f1514.wealthLots=[{units:100,principal:0},{units:0,principal:100}];achFinance14()');
for(const id of ids)assert(!has(id),'no holding/zero basis/cash flows cannot unlock '+id);
setup();run('s1514.shares=10;s1514.cost=100;s1514.price=11.5;tradeStock(0,"sell",10)');assert(has('stockProfit'));assert.equal(run('s1514.shares'),0,'sale observed before position disappears');
setup();run('f1514.wealthNav=.7;f1514.wealthLots=[{id:1,units:100,principal:100,boughtAt:0,unlockDay:1}];redeemWealth(1)');assert(has('wealthLoss'));assert.equal(run('f1514.wealthLots.length'),0,'redemption observed before lot disappears');
setup();run('s1514.shares=10;s1514.cost=100;s1514.price=11.5;financialDailyReport(S.day);s1514.price=10;achPersist14()');assert(has('stockProfit'),'daily settled crossing remains unlocked after recovery');
run('s1514.price=7;achSync14();showAchievements14()');
for(const [name,grade] of [['幸运儿','gold'],['险些腰斩','gold'],['靠谱的经理','silver'],['打水漂','silver']]){
 const row=[...w.document.querySelectorAll('.ach-row14')].find(el=>el.querySelector('h4')?.textContent.startsWith(name));assert(row);assert(row.querySelector('.ach-badge14.'+grade));assert(row.textContent.includes('%'));
}
assert(w.document.querySelector('.uxa-count').textContent.includes('/ 38'));
run('save();reset();load();achSync14()');assert(has('stockProfit')&&has('stockLoss'),'achievements persist through reset and loading');
const persisted=JSON.parse(w.localStorage.getItem('transit-achievements-v1'));assert(persisted.unlocked.stockProfit&&persisted.unlocked.stockLoss);
assert.equal(g.errors.length,0);g.dom.window.close();
console.log('PASS 38 achievements: names/medals, precise gain/loss thresholds, actual holdings/bases, category isolation, sale/redemption/settlement capture, percentage display and persistent resets');
