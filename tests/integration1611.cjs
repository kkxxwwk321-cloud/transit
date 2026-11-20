const assert=require('node:assert/strict'),fs=require('fs'),g=require('./harness156.cjs')(),{run}=g;
const read=s=>JSON.parse(run('JSON.stringify('+s+')'));
for(const id of ['east','west','ocean']){
 run(`activateAtlasGeometry('${id}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.paused=true;S.points=100000;beginDraft('bus');draft.stops=[0,1,2];commitDraft(true);var line11=S.lines[0],before11=JSON.stringify(line11),cash11=S.points,vehicles11=S.vehicles.map(v=>v.id).join(',');selected={type:'line',id:line11.id};showDetails();`);
 assert(run(`$('details').textContent.includes('多站移除')&&$('details').textContent.includes('重画')`));
 run('uxStopPickToggle(line11.id);uxStopMark(line11.id,2);uxStopPickApply(line11.id);var quote11=draftCost();');
 assert(!run('quote11.invalid'),id+' removal quote');assert.equal(run('JSON.stringify(line11)'),run('before11'));assert.equal(run('S.points'),run('cash11'));
 run('cancelDraft(false);');assert.equal(run('JSON.stringify(line11)'),run('before11'));
 run('uxStopPickToggle(line11.id);uxStopMark(line11.id,2);uxStopPickApply(line11.id);commitDraft(true);');assert.deepEqual(read('line11.stops'),[0,1]);assert.equal(run('line11.id'),1);assert.equal(run('S.vehicles.map(v=>v.id).join(",")'),run('vehicles11'));
 run('var edited11=JSON.stringify(line11),bridgeCount11=S.bridges.length;uxRedraw(line11.id);draft.stops=[0,1,2];var redrawQuote11=draftCost();');assert(!run('redrawQuote11.invalid'));assert.equal(run('JSON.stringify(line11)'),run('edited11'));
 run('cancelDraft(false);');assert.equal(run('JSON.stringify(line11)'),run('edited11'));
 run('uxRedraw(line11.id);draft.stops=[0,1,2];var paidQuote11=draftCost(),cashRedraw11=S.points;commitDraft(true);');assert.deepEqual(read('line11.stops'),[0,1,2]);assert.equal(run('S.points'),run('cashRedraw11-paidQuote11.cash'));assert.equal(run('S.bridges.length'),run('bridgeCount11'));
 run('undoConstruction();');assert.equal(run('JSON.stringify(line11)'),run('edited11'));assert.equal(run('S.points'),run('cashRedraw11'));
 // Countdown uses normal passengers and real seconds, terminal snapshots survive save/load.
 run(`var lost11=S.cities[0];lost11.dormant=false;lost11.grace=lost11.shield=0;lost11.shape=0;lost11.q=Array.from({length:capacity(lost11)},()=>({color:1,shape:0}));lost11.congestionPressure=80;S.speed=4;S.lives=1;`);
 assert.equal(run('uxLifeLeft(lost11)'),20);run('S.speed=1;');assert.equal(run('uxLifeLeft(lost11)'),null);run('S.speed=4;lost11.q.forEach(p=>p.eventId=1);');assert.equal(run('uxLifeLeft(lost11)'),null);
 run('lost11.q.forEach(p=>delete p.eventId);lost11.congestionPressure=159;updateCongestion(lost11,1);');assert.equal(run('S.lives'),0);assert.equal(run('S.uxLifeLog.at(-1).id'),0);assert.equal(run('S.uxLifeLog.at(-1).n'),run('capacity(lost11)'));
 run('updateCongestion(S.cities[1],1000);');assert.equal(run('S.lives'),0);assert.equal(run('S.uxLifeLog.length'),1);
 run('S.day=40;gameover();');assert(run(`$('modal-content').textContent.includes('最后一条命')&&$('modal-content').textContent.includes(lost11.name.split('·')[0])&&$('modal-content').textContent.includes('查看失守车站')`));
 run('save();load();');assert.equal(run('S.uxLifeLog.at(-1).id'),0);assert.equal(run('uxLifeLeft(S.cities[0])'),null);
 console.log('PASS '+id+' multi-stop preview/cancel, redraw apply/undo, fleet identity, real-time warning and persisted actual loss');
}
// Multi-stop marine editing retains city IDs and port-only endpoints.
run(`activateAtlasGeometry('ocean');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.points=100000;S.cities.forEach(c=>c.dormant=false);var samples11=growthGrid();for(const zone of ['west','southwest']){const p=samples11.find(p=>oceanZone168(p)===zone&&harborPoint16(p));const c=makeCity(p.x,p.y);c.id=S.cities.length;c.dormant=false;S.cities.push(c);}var ports11=[0,3,4];for(const id of ports11)buildHarbor16(id);beginHarborRoute164(0);draft.stops=[...ports11];commitDraft(true);var seaLine11=S.lines.at(-1),seaBefore11=JSON.stringify(seaLine11);selected={type:'line',id:seaLine11.id};showDetails();uxStopPickToggle(seaLine11.id);uxStopMark(seaLine11.id,3);uxStopPickApply(seaLine11.id);var seaQuote11=draftCost();`);
assert.equal(run('draft.endpointMode164'),'harbor');assert(!run('seaQuote11.invalid'));run('commitDraft(true);');assert.deepEqual(read('seaLine11.stops'),[0,4]);run('uxRedraw(seaLine11.id);');assert.equal(run('draft.endpointMode164'),'harbor');assert.equal(run('draft.stops.length'),0);run('draft.stops=[4,3,0];commitDraft(true);');assert.deepEqual(read('seaLine11.stops'),[4,3,0]);
run('selected={type:"city",id:0};showDetails();');assert.equal(run(`$('details').querySelectorAll('.ux-harbor').length`),1);assert.equal(run(`$('details').querySelectorAll('.harbor-connect164').length`),0);assert(run(`$('details').querySelector('.ux-harbor').textContent.includes('开航线')`));
run('showDetails(true);');assert.equal(run(`$('details').querySelectorAll('.ux-harbor').length`),1);
run('S.lives=0;var endedCash11=S.points;beginHarborRoute164(0);');assert.equal(run('S.points'),run('endedCash11'));assert.equal(run('draft'),null);
console.log('PASS marine A-B-C multi-stop editing, port-only redraw, single city-owned harbor action and terminal guard');
// Removed endpoints cannot leave stray bridgeheads. No new crossing is silently chosen.
run(`activateAtlasGeometry('east');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.points=100000;var head11={...S.cities[0],id:S.cities.length,kind:'bridgehead',name:'桥头'};S.cities.push(head11);var tail11={...head11,id:S.cities.length};S.cities.push(tail11);var edgeLine11={id:99,type:'bus',stops:[0,head11.id,tail11.id,1,2],color:'#123',name:'端点测试'};S.lines.push(edgeLine11);uxStopPickToggle(99);uxStopMark(99,0);uxStopPickApply(99);`);assert.deepEqual(read('draft.stops'),[1,2]);run('cancelDraft(false);');
// Focus owns a restore session at the existing overview scale; manual pan cancels its animation.
run(`view.scale=Math.max(.15,portraitMinScale());var scaleBefore11=view.scale;view.x=10;view.y=20;uxFrameRestore=null;portraitFocusCity(S.cities[0]);var focusScale11=uxLastViewTarget.scale;`);assert.equal(run('focusScale11'),run('scaleBefore11'));assert(run('uxFrameRestore!==null'));assert(run('animateView.activeId!=null'));
run('var animation11=animateView.id;uxCancelAutoMove();');assert.equal(run('uxFrameRestore'),null);assert(run('animateView.id>animation11'));assert.equal(run('animateView.activeId'),null);
assert.deepEqual(g.errors,[]);g.dom.window.close();console.log('PASS bridgehead endpoint cleanup and modern-map camera ownership/cancellation');
