const assert=require('node:assert/strict');
const createGame=(opts=>require('./harness156.cjs')({legacyTerrain166:true,...opts}));
const g=createGame(),{run,w}=g;
run("activateAtlasGeometry('west');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;");
assert.equal(run('S.basinTerrain158'),3);
assert.equal(run('westRangesPreview.length'),9);
assert(run('S.cities.every(c=>cityBuildable(c.x,c.y))'));
run('beginDraft("bus");draft.stops=[0,1,2];var quote158=draftCost();commitDraft(true);');
assert.equal(run('quote158.cash'),5670);
const newGeometry=run('JSON.stringify(mountainPolygons)'),lines=run('JSON.stringify(S.lines)'),cities=run('JSON.stringify(S.cities.map(c=>[c.x,c.y]))');
run('save();load()');assert.equal(run('JSON.stringify(mountainPolygons)'),newGeometry);
// Previously restored games retain their separated ridges and exact construction.
run('delete S.terrainArt166;S.basinTerrain158=2;save();load()');
assert.equal(run('JSON.stringify(mountainPolygons)'),run('JSON.stringify(westRangesRestored1510.map(r=>r.poly))'));
assert.equal(run('JSON.stringify(S.lines)'),lines);
// Previously expanded games retain the exact one-ridge terrain through load.
run('S.basinTerrain158=1;save();load()');
assert.equal(run('JSON.stringify(mountainPolygons)'),run('JSON.stringify(westRangesExpanded158.map(r=>r.poly))'));
assert.equal(run('JSON.stringify(S.lines)'),lines);assert.equal(run('JSON.stringify(S.cities.map(c=>[c.x,c.y]))'),cities);
// Old saves keep exact footprints and existing construction; future new games use the new ring.
run('delete S.basinTerrain158;save();load()');
assert.equal(run('JSON.stringify(mountainPolygons)'),run('JSON.stringify(westRangesLegacy158.map(r=>r.poly))'));
assert.equal(run('JSON.stringify(S.lines)'),lines);assert.equal(run('JSON.stringify(S.cities.map(c=>[c.x,c.y]))'),cities);
run('basinGraphWeb={old:true};basinPathsWeb.set("old",[]);reset()');assert.equal(run('basinGraphWeb'),null);assert.equal(run('basinPathsWeb.size'),0);
function area(ranges){const p=[...ranges[0].p,...ranges[3].p,...ranges[2].p.slice().reverse(),...ranges[1].p.slice().reverse()];return Math.abs(p.reduce((n,[x,y],i)=>{let[u,v]=p[(i+1)%p.length];return n+x*v-u*y},0))/2;}
const ratio=area(run('westRangesPreview'))/(2800*2100);
assert(ratio>.5&&ratio<.65);assert(area(run('westRangesLegacy158'))/(2800*2100)<.2);
// Every restored interior ridge remains physical, and the outer ring is unchanged.
assert.equal(run('JSON.stringify(westRangesRestored1510.slice(0,4))'),run('JSON.stringify(westRangesExpanded158.slice(0,4))'));
assert(run('westRangesRestored1510.slice(4).every(r=>r.path.some(p=>!inRiverValley(p)&&mountainDistance(p)<1))'));
assert(run('westRangesRestored1510.slice(4).every(r=>r.path.some(p=>!cityBuildable(p.x,p.y)))'));
// Five genuine mountain joins, using the same polygons as the live renderer.
assert.equal(run('JSON.stringify(westRangesJoined1512.slice(0,4))'),run('JSON.stringify(westRangesRestored1510.slice(0,4))'));
assert(run('westRangesJoined1512.slice(4).every(r=>r.join1512&&pointInPolygon(r.join1512.point,westRangesJoined1512[r.join1512.outer].poly)&&!inRiverValley(r.join1512.point))'));
assert(run('westRangesJoined1512.slice(4).every(r=>r.path.some(p=>pointInPolygon(p,r.poly)&&pointInPolygon(p,westRangesJoined1512[r.join1512.outer].poly)))'));
console.log('PASS expanded basin enclosure '+(ratio*100).toFixed(1)+'% of map, five spaced interior ridges, opening quote, versioned save geometry and cache invalidation');

// Inspect the actual probability boundary without consuming RNG on weather scheduling.
run('var originalRandom158=Math.random,originalQuake158=triggerQuake,quakeCount158=0;triggerQuake=()=>{quakeCount158++;S.climate.lastQuake=S.day};');
function earthquake(map,value,extras=''){
 run(`activateAtlasGeometry('${map}');reset();S.day=200;S.unlocked=['bus','emu','rail'];S.cities=Array.from({length:6},(_,id)=>({...S.cities[0],id,dormant:false}));S.climate.next=Infinity;S.climate.lastQuake=-200;S.climate.events=[];S.climate.seasons={0:{count:0}};S.climate.typhoonVersion=1;${extras};Math.random=()=>${value};quakeCount158=0;updateClimate(199);`);
 return run('quakeCount158');
}
assert.equal(earthquake('west',.019999),1);assert.equal(earthquake('west',.020001),0);
assert.equal(earthquake('east',.007999),1);assert.equal(earthquake('east',.008001),0);
assert.equal(earthquake('west',0,'S.day=149'),0);
assert.equal(earthquake('west',0,'S.unlocked=["bus"]'),0);
assert.equal(earthquake('west',0,'S.cities.pop()'),0);
assert.equal(earthquake('west',0,'S.climate.lastQuake=121'),0);
assert.equal(earthquake('west',0,'S.climate.lastQuake=120'),1);
run('Math.random=originalRandom158;triggerQuake=originalQuake158;activateAtlasGeometry("east");reset();S.climate.seasons={};ensureTyphoonSeason(0);');
assert(run('S.climate.events.filter(e=>e.type==="typhoon").length>=3'));
run('activateAtlasGeometry("west");reset();S.climate.events.push({type:"typhoon",start:0,end:400});save();load()');
assert.equal(run('S.climate.events.some(e=>e.type==="typhoon")'),false);
run('ensureTyphoonSeason(0);ensureTyphoonSeason(1)');assert.equal(run('S.climate.events.some(e=>e.type==="typhoon")'),false);
console.log('PASS west 2% / east 0.8%, all existing eligibility/cooldown guards, east seasons, west old/new save typhoon removal');

run('atlasMenuOpen=false;closeModal();S.tutorial123=null;S.notices130={seen:{},unread:{},queue:[]};S.points=7000;S.cities.forEach(c=>c.dormant=false);constructionNotices130();showNotice130();');
const m=w.document.querySelector('#modal-content');
assert.match(m.textContent,/新设施可以建设了/);assert.match(m.textContent,/气象站/);assert.match(m.textContent,/交通枢纽/);
assert.equal(m.querySelectorAll('.unlock-item158').length,2);assert.equal(run('notices130().queue.length'),0);
run('closeModal();constructionNotices130();showNotice130()');assert.equal(run('modalOpen'),false);
for(const paused of [false,true]){
 run(`S.paused=${paused};S.interruption=null;askExit123()`);
 assert.match(m.textContent,/保存并返回选图/);assert.match(m.textContent,/继续游戏/);assert.doesNotMatch(m.textContent,/保存并返回本局|取消/);
 assert.equal(m.querySelectorAll('button').length,2);
 run('cancelExit123()');assert.equal(run('S.paused'),paused);
}
run('S.paused=false;askExit123();interruptGame("后台测试");cancelExit123()');assert(run('S.paused&&interruptionPending()'));
run('S.interruption=null;askExit123();saveExit123()');assert(run('atlasMenuOpen'));assert.equal(run('atlasSaved("west").mapId'),'west');
console.log('PASS simultaneous two-facility notice, no repeats, two exit actions, previous pause restoration, background lock and saved map return');

// Drawing consumes no RNG and animation phase freezes with simulation pause.
run('var oldCtx158=ctx,weatherCalls158=[];ctx=new Proxy({createRadialGradient(...a){weatherCalls158.push(a);return {addColorStop(){}}}}, {get(o,k){return o[k]||((...a)=>weatherCalls158.push([k,...a]))}});S.day=200;view.scale=1;view.x=200;view.y=200;Math.random=()=>{throw Error("render consumed simulation RNG")};');
for(const type of ['rain','fog']){
 run(`weatherCalls158=[];drawWeatherParticles158({type:'${type}',strong:true,radius:170},{x:0,y:0});var firstWeather158=JSON.stringify(weatherCalls158);`);
 assert(run('weatherCalls158.some(a=>a[0]==="clip")'));
 run(`weatherCalls158=[];S.paused=true;drawWeatherParticles158({type:'${type}',strong:true,radius:170},{x:0,y:0});`);
 assert.equal(run('JSON.stringify(weatherCalls158)'),run('firstWeather158'));
 run(`S.day+=.02;weatherCalls158=[];drawWeatherParticles158({type:'${type}',strong:true,radius:170},{x:0,y:0});`);
 assert.notEqual(run('JSON.stringify(weatherCalls158)'),run('firstWeather158'));
 assert(run('weatherCalls158.length<200'));
}
run('ctx=oldCtx158;Math.random=originalRandom158');assert.equal(g.errors.length,0);g.dom.window.close();
console.log('PASS clipped animated rain/fog, deterministic bounded draw work and paused animation');
