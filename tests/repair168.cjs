const assert=require('node:assert/strict'),fs=require('fs'),create=require('./harness156.cjs'),g=create(),{run}=g;run(fs.readFileSync(__dirname+'/helpers168.js','utf8'));
for(const id of ['east','west','ocean']){
 run(`activateAtlasGeometry('${id}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.paused=true;`);
 assert.equal(run('S.terrainRevision167'),2);assert(run('realCities().length===3&&realCities().every(c=>cityBuildable(c.x,c.y,2))'));
 run(`var fixed168=JSON.stringify({positions:realCities().map(c=>[c.id,c.x,c.y]),water:terrain167().water,mountains:mountainPolygons});save();load();`);assert.equal(run('JSON.stringify({positions:realCities().map(c=>[c.id,c.x,c.y]),water:terrain167().water,mountains:mountainPolygons})'),run('fixed168'));
 run(`beginDraft('bus');draft.stops=[0,1,2];var openingQuote168=draftCost();cancelDraft(false);`);
 assert(!run('openingQuote168.invalid'),id+' opening invalid');assert.equal(run('openingQuote168.bridge'),0,id+' start crosses water');assert(run('openingQuote168.cash<=S.points'),id+' unaffordable opening');
 if(id==='east'){
  run(`S.day=10;spawnCity();`);assert.equal(run('realCities().length'),4);assert(run('realCities().slice(0,3).some(c=>riverSpans(c,realCities()[3]).length===1)'));
 }
 if(id==='ocean'){
  assert.deepEqual(JSON.parse(run('JSON.stringify(realCities().slice(0,3).map(c=>[Math.round(c.x*10)/10,c.y]))')),[[3430.2,2457],[3243,2382],[3168.6,2664]]);
  assert(run('terrain167().water.every(poly=>poly.every(([x,y])=>x>mapSpec.bounds.xmin+(mapSpec.bounds.xmax-mapSpec.bounds.xmin)*.58&&y<mapSpec.bounds.ymax*.31))'),'river remnants');
  assert(run('terrain167().islands.every(poly=>{const x=poly.reduce((n,p)=>n+p[0],0)/poly.length,y=poly.reduce((n,p)=>n+p[1],0)/poly.length;return !cityBuildable(x,y,2)})'),'island spawn');
 }
 // An actual pointer down/move/up must create the quote; assigning bridgeDraft endpoints is insufficient.
 run(`clearSelection();S.points=50000;var fixture168=findBridgeFixture168(${id==='east'?90:0});if(!fixture168)throw Error('bridge fixture missing');beginBridge('bus');view.scale=1.4;view.x=W/2-(fixture168.a.x+fixture168.b.x)/2*view.scale;view.y=H/2-(fixture168.a.y+fixture168.b.y)/2*view.scale;clampPortraitCamera();var start168=toScreen(fixture168.a),end168=toScreen(fixture168.b),event168=(p,type,id=168)=>({pointerId:id,button:0,type,clientX:p.x,clientY:p.y,preventDefault(){}});beginPointer(event168(start168,'pointerdown'));for(let i=1;i<=12;i++)movePointer(event168({x:start168.x+(end168.x-start168.x)*i/12,y:start168.y+(end168.y-start168.y)*i/12},'pointermove'));finishPointer(event168(end168,'pointerup'));`);
 assert(run('bridgeDraft.a&&bridgeDraft.b&&!bridgeTerrainIssue(bridgeDraft.a,bridgeDraft.b)'),'native drag '+id+' '+run('JSON.stringify({fixture:fixture168,actual:bridgeDraft,issue:bridgeTerrainIssue(bridgeDraft.a,bridgeDraft.b)})'));assert(!run('$("drawdone").disabled'));assert(run('$("drawtext").textContent.includes("320")'));
 run(`var quote168=bridgePrice(bridgeDraft.a,bridgeDraft.b,'bus'),cash168=S.points;$('drawdone').click();closeModal();drawBridges();`);assert.equal(run('S.bridges.length'),1);assert.equal(run('cash168-S.points'),run('quote168'));
 run(`var bridgeState168=JSON.stringify(S.bridges);save();load();`);assert.equal(run('JSON.stringify(S.bridges)'),run('bridgeState168'));
 // Camera reaches a true overview; the previous cover-screen clamp must not push it back in.
 for(const [width,height]of [[360,800],[390,844],[430,932]]){
  run(`W=${width};H=${height};uxOverviewOn=false;overview168();var bounds168=mapSpec.bounds,band168=fitBand(),tl168=toScreen({x:bounds168.xmin,y:bounds168.ymin}),br168=toScreen({x:bounds168.xmax,y:bounds168.ymax});`);
  assert(run('tl168.x>=0&&br168.x<=W&&tl168.y>=band168.top&&br168.y<=band168.bottom'),'whole map visible '+id);
 }
 run(`W=390;H=844;fit();var fc168=realCities()[1];fc168.shape=0;fc168.size=2;fc168.dormant=false;S.points=50000;plantFarm(fc168.id);closeModal();var fp168=farmPosition(fc168);`);assert(run('!!fp168'),id+' farm position');assert(run('dryGround168(fp168,9)'));run('drawCityArt(fc168);');
 // Existing settlement accounting remains exactly once.
 run(`var farmPayout168=fc168.farm.crop.payout,cashBeforeFarm168=S.points;S.day=fc168.farm.crop.due;settleFarms(false);settleFarms(false);`);assert.equal(run('S.points-cashBeforeFarm168'),run('farmPayout168'));assert.equal(run('fc168.farm.completed'),1);
 console.log('PASS '+id+' opening/save geometry, pointer bridge, transaction, full overview and terrain-safe rendered farm');
}
assert.deepEqual(g.errors,[]);g.dom.window.close();
