const assert=require('node:assert/strict'),create=require('./harness156.cjs'),g=create({legacyTerrain167:true}),{run}=g;
let rng=1;g.w.Math.random=()=>((rng=(1664525*rng+1013904223)>>>0)/4294967296);
run(`var oldMains167=JSON.stringify(Object.fromEntries(Object.entries(ATLAS_MAPS).map(([id,d])=>[id,d.main])));`);
for(const id of ['east','west','ocean']){
 run(`activateAtlasGeometry('${id}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.paused=true;`);
 assert(run('newAtlas167()'));assert.equal(run('S.points'),{east:7000,west:8000,ocean:12000}[id]);
 assert(run('realCities().length===3&&realCities().every(c=>cityBuildable(c.x,c.y,2))'));
 run(`var terrainJSON167=JSON.stringify({mountainPolygons,water:terrain167().water,coast:mapSpec.coast,cities:S.cities.map(c=>({id:c.id,x:c.x,y:c.y,shape:c.shape,color:c.color}))});save();load();`);
 assert.equal(run('JSON.stringify({mountainPolygons,water:terrain167().water,coast:mapSpec.coast,cities:S.cities.map(c=>({id:c.id,x:c.x,y:c.y,shape:c.shape,color:c.color}))})'),run('terrainJSON167'));
 // Every allowed maximum-size city has the reserved footprint outside both visible rock and water.
 assert(run(`growthGrid().length>50&&growthGrid().every(p=>{let q={x:p.x,y:p.y-28};return !rock167(q)&&!fresh167(q)&&boundaryDistance167(q,terrain167().water)>=92&&boundaryDistance167(q,terrain167().mountains)>=92;})`));
 for(const dimensions of [[390,844],[360,800],[430,932]]){
 run(`W=${dimensions[0]};H=${dimensions[1]};`);
 assert(run(`(()=>{let b=portraitBounds();for(let scale of [portraitMinScale(),1,2.5])for(let x of [-1e6,1e6])for(let y of [-1e6,1e6]){Object.assign(view,{scale:Math.max(scale,portraitMinScale()),x,y});clampPortraitCamera();if(view.x+b.xmin*view.scale>1e-6||view.y+b.ymin*view.scale>1e-6||view.x+b.xmax*view.scale<W-1e-6||view.y+b.ymax*view.scale<H-1e-6)return false;}return true;})()`),id+' edge cover');
 }
 run('W=390;H=844;fit();');
 assert(run('realCities().every(c=>{let p=toScreen(c);return p.x>0&&p.x<W&&p.y>0&&p.y<H})'),id+' opening camera');
 // A candidate bridge is found from actual water contours, not a legacy centerline.
 run(`var bridgeFixture167=null;for(const poly of terrain167().water){for(let i=0;i<poly.length&&!bridgeFixture167;i+=3){let a=snapBank({x:poly[i][0],y:poly[i][1]});for(let ang=0;ang<Math.PI*2&&!bridgeFixture167;ang+=Math.PI/8)for(let len=40;len<=240;len+=20){let b={x:a.x+Math.cos(ang)*len,y:a.y+Math.sin(ang)*len};if(!bridgeTerrainIssue(a,b)){bridgeFixture167={a,b};break;}}}if(bridgeFixture167)break;}`);
 assert(run('!!bridgeFixture167'),id+' usable river/lake bridge');
 assert(run('riverSpans(bridgeFixture167.a,bridgeFixture167.b).length===1&&!fresh167(bridgeFixture167.a)&&!fresh167(bridgeFixture167.b)'));
 run(`var draftBridgeFixture167=bridgeFixture167;bridgeDraft={a:bridgeFixture167.a,b:bridgeFixture167.b};drawBridges();bridgeDraft=null;`);
 assert(run('bridgeTerrainIssue({x:mapSpec.bounds.xmin-1,y:0},{x:mapSpec.bounds.xmin+1,y:0})!==null'));
 if(id==='ocean'){
  assert(run('land16({x:1800,y:1})'),'northern mainland');
  assert(run('harborPoint16(S.cities[0])!==null'),'opening harbor eligible');
  assert(run(`(()=>{let p={x:mapSpec.bounds.xmax-50,y:mapSpec.bounds.ymax-50};return sea16(p)&&!!bridgeTerrainIssue(p,{x:p.x-30,y:p.y-30});})()`),'ocean bridge denied');
 }else if(id==='east')assert.equal(run('mountainPolygons.length'),0,'hills are not tunnel terrain');
 // Terrain changes must leave room for subsequent cities, not just the opening three.
 run(`S.unlocked.push('rail');for(let day=10;day<=150;day++){S.day=day;realCities().forEach(c=>{c.dormant=false;c.size=2;c.maxSize=2;c.q=[];});spawnCity();}`);
 assert(run('realCities().length>=7'),id+' growth');
 assert(run('realCities().every(c=>cityBuildable(c.x,c.y,2))'),id+' spawned footprint');
 console.log('PASS '+id+' exact save geometry, growth, max-size city clearance, actual-water bridge, three mobile camera bounds');
}
// Compare real old-save adapters with and without the new module loaded.
for(const id of ['east','west','ocean']){
 const old=create({legacyTerrain166:true});old.run(`activateAtlasGeometry('${id}');reset();`);
 const state=old.run('JSON.stringify(S)'),expected=old.run('JSON.stringify({main:mapSpec.main,bounds:mapSpec.bounds,coast:mapSpec.coast,mountainPolygons})');
 run(`S=JSON.parse(${JSON.stringify(state)});activateAtlasGeometry('${id}');`);
 assert.equal(run('JSON.stringify({main:mapSpec.main,bounds:mapSpec.bounds,coast:mapSpec.coast,mountainPolygons})'),expected,id+' legacy save adapters');old.dom.window.close();
}
assert.deepEqual(g.errors,[]);g.dom.window.close();console.log('PASS full production chain restores all three legacy save geometries');
