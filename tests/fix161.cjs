const assert=require('node:assert/strict'),g=require('./harness156.cjs')({legacyTerrain166:true}),{run,w}=g;
function ocean(){run('activateAtlasGeometry("ocean");reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.paused=false;');}
ocean();assert.equal(run('S.release'),'1.6.10');assert.equal(run('$("date").textContent'),'6月1日');assert.match(run('$("calendar-tag").textContent'),/^第1年 · /);assert.equal(w.getComputedStyle(w.document.querySelector('.calendar')).flexDirection,'column');
run(`var a161={x:3010,y:1700,id:100},b161={x:2730,y:2190,id:101},p161=landRoute161(a161,b161,'bus');`);
assert(!run('landSegment161(a161,b161)'));assert(run('p161&&p161.points.length>2&&p161.length>Math.hypot(a161.x-b161.x,a161.y-b161.y)'));
assert(run('p161.points.slice(1).every((p,i)=>landSegment161(p161.points[i],p))'));
assert(run('!requirements(a161,b161,"bus").invalid&&!requirements(a161,b161,"bus").bridge'));
assert.equal(run('landRoute161(b161,a161,"bus").length'),run('p161.length'));
run(`var road161={id:99,type:'bus',color:'#456',stops:[100,101]};`);
assert(run('Array.from({length:101},(_,i)=>lanePoint(a161,b161,road161,i/100)).every(land16)'));
assert(run('Math.abs(edgeTime(a161,b161,"bus")/edgeBefore161(a161,b161,"bus")-p161.length/Math.hypot(a161.x-b161.x,a161.y-b161.y))<1e-9'));
run(`S.cities.push({...makeCity(a161.x,a161.y),id:3},{...makeCity(b161.x,b161.y),id:4});S.points=100000;beginDraft('bus');draft.stops=[3,4];var q161=draftCost();`);
assert(run('q161.cash>0&&!q161.invalid&&Math.abs(q161.length-p161.length)<.01'));
run(`var cash161=S.points,inventory161=S.inventory.bus;commitDraft(true);var built161=S.lines.at(-1).id;`);
assert(run('!!constructionUndo?.route161'));assert.equal(run('cash161-S.points'),run('q161.cash'));
run(`undoConstruction();`);assert.equal(run('S.points'),run('cash161'));assert.equal(run('S.inventory.bus'),run('inventory161'));assert(!run('S.lines.some(l=>l.id===built161)||S.vehicles.some(v=>v.line===built161)'));assert.equal(run('Object.keys(S.infrastructure).length'),0);run('undoConstruction()');assert.equal(run('S.points'),run('cash161'));
run(`beginDraft('bus');draft.stops=[3,4];draft.pointer={x:2800,y:2000};draft.extensionPointer={city:0};gesture={kind:'draft',moved:true};pointers.set(71,{});uxOctPlanKey='stale';cancelDraft(false);`);assert(run('!draft&&!gesture&&!pointers.size&&uxOctPlanKey===null'));
run(`beginDraft('bus');draft.stops=[3,4];draft.pointer={x:2800,y:2000};draft.extensionPointer={city:0};gesture={kind:'draft',moved:false};pointers.set(71,{});finishPointer({pointerId:71,type:'pointerup',clientX:0,clientY:0});`);assert(run('draft&&!draft.pointer&&!draft.extensionPointer'));run('cancelDraft(false)');
// Editing undo restores the old stops; refund also restores a purchased vehicle's absence.
ocean();run("S.points=100000;beginDraft('bus');draft.stops=[0,1];commitDraft(true);var original161=S.lines[0],cashEdit161=S.points;beginDraft('bus',original161.id);draft.stops=[0,1,2];commitDraft(true);undoConstruction();");assert.equal(run('S.lines[0].stops.join(",")'),'0,1');assert.equal(run('S.points'),run('cashEdit161'));
ocean();run("S.points=100000;S.inventory.bus=0;S.stockAssets.bus=[];beginDraft('bus');draft.stops=[0,1];var purchasedCash161=S.points;commitDraft(true);undoConstruction();");assert.equal(run('S.points'),run('purchasedCash161'));assert.equal(run('S.inventory.bus'),0);assert.equal(run('S.vehicles.length'),0);
// Restore the running state through nested panels and real bound UI clicks.
run('S.speed=4;S.paused=false;showEngineering()');assert(run('S.paused&&modalOpen'));run('openModal("<h2>下一页</h2>");closeModal()');assert(!run('S.paused'));assert.equal(run('S.speed'),4);
run('S.paused=true;showEngineering();closeModal()');assert(run('S.paused'));
run('S.paused=false');w.document.getElementById('help').click();assert(run('S.paused'));run('closeModal()');assert(!run('S.paused'));
run('S.paused=false;showEngineering()');g.setHidden(true);run('closeModal()');assert(run('S.paused'));g.setHidden(false);
ocean();run('S.paused=false;showEngineering();S.lives=0;closeModal()');assert(run('S.paused'));
ocean();run('while(realCities().length<10){S.day=cityDay16(realCities().length+1);spawnCity();}casinoCity16().size=2;drawCityArt(casinoCity16());save();load();render()');assert(run('realCities().every(land16)'));assert.equal(run('lakePolygons161.length'),5);assert(run('lakePolygons161.every(p=>p.length>50)'));assert.equal(g.errors.length,0);
g.dom.window.close();console.log('PASS 1.6.1 coastal land detour/arc length, once-only atomic refund, stale-pointer cleanup, modal pause ownership, calendar and terrain/save compatibility');
