const assert=require('node:assert/strict'),g=require('./harness156.cjs')({legacyTerrain166:true}),{run}=g;
run(`activateAtlasGeometry('ocean');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.points=50000;buildHarbor16(0);buildHarbor16(1);closeModal();S.unlocked.push('emu','rail','air','ferry');S.limits.emu=S.limits.rail=S.limits.air=S.limits.ferry=20;`);
run('var geometryAtStart166=JSON.stringify({lakes:lakePolygons161,mountains:ATLAS_MAPS.ocean.mountains,start:ATLAS_MAPS.ocean.start})');
for(let scale of [.35,.7,1.5]){
 run(`view.scale=${scale};var badges162=portBadges164();`);
 assert(run('badges162.every(o=>sea16(o.p)&&Math.hypot(o.p.x-o.c.x,o.p.y-o.c.y)*view.scale>=69)'));
 for(let type of ['bus','emu','rail','air']){
  run(`beginDraft('${type}');var port162=badges162[0],prev162={x:port162.p.x-20/view.scale,y:port162.p.y};gesture={lastHover:null};`);
  assert.equal(run('hitCity(port162.p)'),null,type+' cannot snap port');assert.equal(run('elasticTouch(port162.p,prev162)'),null);
 }
 for(let type of ['ship','ferry']){
  run(`beginDraft('${type}');`);assert.equal(run('hitCity(badges162[0].p).id'),0);assert.equal(run('hitCity(S.cities[0])'),null,'marine cannot snap city node');assert.equal(run('elasticTouch(S.cities[0],null)'),null);
 }
}
run(`beginDraft('bus');draft.stops=[0,1];uxSetType('ship');`);assert.equal(run('draft.type'),'bus');
run(`cancelDraft(false);view.scale=.7;view.x=20;view.y=20;var p162=portBadges164()[0].p,q162=portBadges164()[1].p;var ev162=(p,type)=>({pointerId:162,button:0,type,clientX:p.x*view.scale+view.x,clientY:p.y*view.scale+view.y,preventDefault(){}});beginPointer(ev162(p162,'pointerdown'));movePointer(ev162(q162,'pointermove'));finishPointer(ev162(q162,'pointerup'));`);
assert.equal(run('draft.type'),'ship');assert.equal(run('draft.stops.join(",")'),'0,1');assert(!run('draftCost().invalid'));run('commitDraft(true)');assert.equal(run('S.lines.at(-1).type'),'ship');
run(`var l162=S.lines.at(-1),path162=displaySeaPath163(S.cities[0],S.cities[1]),mid162=pathPoint16(path162,.5);selected=null;`);assert.equal(run('routeHit(mid162).l.id'),run('l162.id'));
run(`beginPointer(ev162(mid162,'pointerdown'));finishPointer(ev162(mid162,'pointerup'));`);assert.equal(run('selected.type'),'line');assert(run('$("details").textContent.includes("船舶")'));
run(`var third162=makeCity(eastCoastX163(1440)-120,1440);third162.id=S.cities.length;third162.dormant=false;S.cities.push(third162);buildHarbor16(third162.id);closeModal();selected={type:'line',id:l162.id};var end162=portBadges164().find(o=>o.c.id===1).p,new162=portBadges164().find(o=>o.c.id===third162.id).p;beginPointer(ev162(end162,'pointerdown'));movePointer(ev162(new162,'pointermove'));finishPointer(ev162(new162,'pointerup'));`);
assert.equal(run('draft.original'),run('l162.id'));assert.equal(run('draft.type'),'ship');assert(run('draft.stops.includes(third162.id)'));assert(!run('draftCost().invalid'));run('commitDraft(true)');assert(run('uxHandles().every(h=>!isMarine16(h.line.type))'));
assert(run('geometryAtStart166===JSON.stringify({lakes:lakePolygons161,mountains:ATLAS_MAPS.ocean.mountains,start:ATLAS_MAPS.ocean.start})'));assert(run('ATLAS_MAPS.ocean.coast[0][1]===0&&ATLAS_MAPS.ocean.coast.at(-1)[1]===0'));assert(run('land16({x:1800,y:1})'));
assert(run('ATLAS_MAPS.ocean.hills.every((e,i)=>e.x===hillsBefore163[i].x-480)'));
run(`var plain162=[];for(let y=960;y<=1920;y+=240)for(let d of [120,360])plain162.push({x:eastCoastX163(y)-d,y});`);
assert(run('plain162.every(p=>cityBuildable(p.x,p.y,2)&&!hills.some(e=>inEllipse(p,e)))'));
run('save();load()');assert.equal(run('S.lines.at(-1).type'),'ship');assert.equal(run('S.release'),'1.6.10');assert.equal(run('saleValue16("ferry",1)'),4800);
run(`var oldDock162=null;for(let y=160;y<3200&&!oldDock162;y+=15)for(let x=50;x<3550&&!oldDock162;x+=15){let p={x,y},s=nearestShore161(p,coastBefore164);if(!land16(p)||s.d<42||s.d>160)continue;let len=Math.hypot(s.dx,s.dy),q=[1,-1].map(k=>({x:s.x-k*s.dy/len*35,y:s.y+k*s.dx/len*35})).find(q=>!polygon16(q,coastBefore164));if(q&&!sea16(q))oldDock162={p,q};}if(!oldDock162)throw Error('missing old dock migration fixture');var c162=S.cities[0],beforeDock162={...c162};Object.assign(c162,oldDock162.p,{harbor:{...oldDock162.q,built:10}});save();load();`);
assert(run('sea16(S.cities[0].harbor)'));assert.equal(run('S.cities[0].harbor.built'),10);assert.equal(run('S.cities[0].x'),run('oldDock162.p.x'));
assert.deepEqual(g.errors,[]);g.dom.window.close();console.log('PASS port/node separation at three zooms across six modes, native port drag, exact route tap/detail, inland hills, north mainland, compatible saved sea route and ferry sale');
