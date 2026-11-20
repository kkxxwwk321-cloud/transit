const assert=require('node:assert/strict'),g=require('./harness156.cjs')(),{run}=g;
const json=s=>JSON.parse(run('JSON.stringify('+s+')'));
for(const map of ['east','west','ocean']){
 run(`activateAtlasGeometry('${map}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;S.paused=true;S.points=200000;beginDraft('bus');draft.stops=[0,1];commitDraft(true);clearSelection();fit();var line12=S.lines[0],stops12=line12.stops.join(','),cash12=S.points,evt12=(p,id,type='pointermove')=>({pointerId:id,button:0,clientX:p.x,clientY:p.y,type,preventDefault(){}});`);
 // Pull an unselected, visibly curved mid-segment directly into the third city.
 run(`var from12=toScreen(lanePoint(S.cities[0],S.cities[1],line12,.5)),to12=toScreen(S.cities[2]);beginPointer(evt12(from12,12,'pointerdown'));movePointer(evt12(to12,12));`);
 assert(run('!!draft&&draft.original===line12.id&&draft.stops.includes(2)'),map+' direct segment drag failed');assert.equal(run('line12.stops.join(",")'),run('stops12'));assert.equal(run('S.points'),run('cash12'));
 // Regression: cancelDraft clears pointers; the pinch transition must preserve its two touches first.
 run(`beginPointer(evt12({x:to12.x+90,y:to12.y},13,'pointerdown'));`);
 run(`beginPointer(evt12({x:to12.x+160,y:to12.y+20},99,'pointerdown'));finishPointer(evt12(to12,99,'pointerup'));`);assert.equal(run('gesture.kind'),'pinch');assert.equal(run('pointers.size'),2);assert.equal(run('draft'),null);assert.equal(run('line12.stops.join(",")'),run('stops12'));
 run(`movePointer(evt12({x:to12.x+130,y:to12.y},13));finishPointer(evt12(to12,12,'pointerup'));finishPointer(evt12({x:to12.x+130,y:to12.y},13,'pointerup'));`);
 assert.equal(run('pointers.size'),0);assert.equal(run('S.points'),run('cash12'));assert.equal(run('runtimeFault13'),null);
 // A new unpaid route can also safely switch to two-finger navigation.
 run(`clearSelection();fit();var first12=toScreen(S.cities[0]),next12=toScreen(S.cities[2]);beginPointer(evt12(first12,14,'pointerdown'));movePointer(evt12(next12,14));beginPointer(evt12({x:next12.x+90,y:next12.y+20},15,'pointerdown'));finishPointer(evt12(next12,14,'pointerup'));finishPointer(evt12(next12,15,'pointerup'));`);
 assert.equal(run('draft'),null);assert.equal(run('pointers.size'),0);assert.equal(run('S.lines.length'),1);assert.equal(run('S.points'),run('cash12'));
 // Cancel/restart must clear coloured draft references, ghosts and stale port layout.
 run(`uxRedraw(line12.id);draft.stops=[0,2];draft.pointer={...S.cities[1]};routeGhosts.push({line:line12,edges:[[0,1]],removed:[],at:performance.now()});cancelDraft(false);render();`);
 assert.equal(run('routeGhosts.length'),0);assert.equal(run('draft'),null);assert.equal(run('gesture'),null);assert.equal(run('uxExt'),null);assert.equal(run('runtimeFault13'),null);
 // Limits cannot shrink when a large panel opens or be bypassed by bad saved camera values.
 for(const [w,h]of [[360,800],[390,844],[430,932],[844,390]]){
  run(`W=${w};H=${h};var minimum12=portraitMinScale();$('details').hidden=false;var panelMinimum12=portraitMinScale();$('details').hidden=true;Object.assign(view,{scale:1e-9,x:1e12,y:-1e12});clampPortraitCamera();var full12={...view};Object.assign(view,{scale:1e9,x:-1e12,y:1e12});clampPortraitCamera();`);
  assert.equal(run('panelMinimum12'),run('minimum12'));assert.equal(run('full12.scale'),run('minimum12'));assert.equal(run('view.scale'),1.8);
  assert(run('Object.values(view).every(Number.isFinite)'));
  run(`var bb12=cameraBounds1612(),bd12=cameraBand1612(),tl12=toScreen({x:bb12.xmin,y:bb12.ymin}),br12=toScreen({x:bb12.xmax,y:bb12.ymax});`);
  assert(run('tl12.x<=90&&br12.x>=W-90&&tl12.y<=bd12.top+90&&br12.y>=bd12.bottom-90'),map+' pan outside bounded apron');
 }
 run(`W=390;H=844;fit();var resident12=S.cities[1];resident12.shape=0;resident12.size=1;resident12.dormant=false;selected={type:'city',id:resident12.id};showDetails();`);
 assert.equal(run(`$('details').querySelectorAll('.ux-fac-strip .farm-chip1612').length`),1);run('showDetails(true);');assert.equal(run(`$('details').querySelectorAll('.farm-chip1612').length`),1);
 run(`var farmCash12=S.points;$('details').querySelector('.farm-chip1612').click();`);assert(run(`$('modal-content').textContent.includes('农田')`));assert.equal(run('S.points'),run('farmCash12'));
 run('closeModal();plantFarm(resident12.id);closeModal();selected={type:"city",id:resident12.id};showDetails();');assert.equal(run('farmCash12-S.points'),800);assert(run(`$('details').querySelector('.farm-chip1612').textContent.includes('生长中')`));
 run('var cropDue12=resident12.farm.crop.due;save();load();selected={type:"city",id:1};showDetails();');assert.equal(run('S.cities[1].farm.crop.due'),run('cropDue12'));assert.equal(run(`$('details').querySelectorAll('.farm-chip1612').length`),1);
 run('clearTransient13();');assert.equal(run('routeGhosts.length'),0);
 console.log('PASS '+map+' direct segment edit, pinch takeover without crash, atomic cancel, four viewport limits, stable panel zoom and city-owned farm/save');
}
assert.deepEqual(g.errors,[]);g.dom.window.close();
