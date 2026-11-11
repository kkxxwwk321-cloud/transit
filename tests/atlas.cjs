// Regression checks for the 0.4 UX layer (ux.js): line building, line sheet, tasks, balance display.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const nodes = new Map();
const canvas = new Proxy({createLinearGradient: () => ({addColorStop(){}}), measureText: t => ({width:t.length*7})}, {get:(x,k)=>x[k]||(()=>{})});
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, {id, hidden:['details','modal','drawbar','db-types','db-cost','drawundo'].includes(id), style:{}, offsetParent:{}, textContent:'', innerHTML:'', dataset:{},
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on=on??!classes.has(v);on?classes.add(v):classes.delete(v);return on;},contains:v=>classes.has(v)},
      setAttribute(k,v){this[k]=v;}, remove(){}, addEventListener(){}, contains(){return false;}, setPointerCapture(){}, querySelector(){return null;},
      getBoundingClientRect(){return this.rect||{left:0,right:10,top:0,bottom:10};}, getContext:()=>canvas});
  }
  return nodes.get(id);
}
node('header').rect={left:0,right:390,top:0,bottom:62};
node('dock').rect={left:12,right:378,top:776,bottom:834};
node('routes').rect={left:12,right:378,top:610,bottom:766};
const storage = new Map();
const context = {console,document:{getElementById:node,createElement:()=>node('offscreen'+nodes.size),addEventListener(){},activeElement:{tagName:'BODY'},
  querySelectorAll:()=>[],
  querySelector:s=>({'header':node('header'),'footer .dock':node('dock'),'#routes':node('routes'),'#details':node('details')}[s]||null)},
  innerWidth:390,innerHeight:844,devicePixelRatio:1,window:{addEventListener(){}},screen:{},performance:{now:()=>100},addEventListener(){},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null},requestAnimationFrame(){},cancelAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>{throw new Error('native confirm() must not be used');}};
context.document.body=node('body');context.document.body.appendChild=()=>{};context.document.documentElement=node('html');context.navigator={};
vm.createContext(context);
const html=fs.readFileSync(path.join(root,'dist/test04/index.html'),'utf8');
for(const match of html.matchAll(/<script src="([^"?]+)(?:[^"]*)"/g))vm.runInContext(fs.readFileSync(path.join(root,'dist/test04',match[1]),'utf8'),context,{filename:match[1]});
const run = code => vm.runInContext(code,context);



assert.equal(run('S.mapId'),'east');assert.equal(run('S.lives'),1);assert.equal(run('S.points'),5000);assert.equal(run('S.limits.bus'),6);
assert.equal(run('modalOpen'),false);assert.equal(run('atlasMenuOpen'),true);
for(let m of ['east','west']){
 run(`activateAtlasGeometry('${m}');reset();closeModal();configureGrowth();`);
 assert.equal(run('S.mapId'),m);assert(run('S.cities.every(c=>cityBuildable(c.x,c.y,2))'));assert.equal(run('realCities().length'),3);
 let before=run('JSON.stringify(S)');run('var rr=Math.random;Math.random=()=>{throw Error("render RNG")};drawTerrain();Math.random=rr;');assert.equal(run('JSON.stringify(S)'),before);assert.equal(run('terrainCache.width'),2640);assert.equal(run('terrainCache.height'),1800);
 for(let d of [16,34,52])run(`S.day=${d};for(let c of S.cities)c.dormant=false;spawnCity();`);
 assert.equal(run('realCities().length'),6);assert.equal(run('JSON.stringify(S.atlasGrowth.births.map(x=>x.day))'),'[16,34,52]');
 run('S.day=64;S.unlocked.push("rail");spawnCity();');assert.equal(run('cityRegions().length'),1);
 run('S.day=65;for(let c of S.cities)c.dormant=false;spawnCity();');assert.equal(run('cityRegions().length'),2);assert.equal(run('clusterMembers(cityRegions()[1]).length'),1);
 assert.equal(run('S.limits.bus'),8);assert.equal(run('regionMobilityState().applied.bus'),2);assert.equal(run('regionMobilityState().applied.emu'),0);
 run('S.unlocked=["bus","emu","rail","air"];updateRegionalExpansion();var limitSnapshot=JSON.stringify(S.limits);updateRegionalExpansion();');assert.equal(run('regionMobilityState().applied.emu'),2);assert.equal(run('JSON.stringify(S.limits)'),run('limitSnapshot'));
 run('S.cityRegions.push({id:2,x:-900,y:0,name:"第三圈",discoveredAt:200});updateRegionalExpansion();');assert.equal(run('regionMobilityState().applied.bus'),4);assert.equal(run('regionMobilityState().applied.emu'),4);assert.equal(run('regionMobilityState().applied.rail'),2);
 run('save();var ownSave=localStorage.getItem(atlasSaveKey(S.mapId));S.atlasGrowth=null;load();');assert.equal(run('JSON.stringify(S.limits)'),run('JSON.stringify(JSON.parse(ownSave).limits)'));
 console.log('PASS '+m+': start, cadence16/34/52, second seed>=65, per-circle bonus+deferred unlock, render purity, reload');
}
run('activateAtlasGeometry("east");reset();S.day=12;S.points=4321;save();activateAtlasGeometry("west");reset();S.day=7;S.points=3210;save();atlasSelected="east";atlasRestart=false;startAtlasMap();');assert.equal(run('S.mapId'),'east');assert.equal(run('S.day'),12);assert.equal(run('S.points'),4321);
run('atlasSelected="west";startAtlasMap();');assert.equal(run('S.mapId'),'west');assert.equal(run('S.day'),7);assert.equal(run('S.points'),3210);
run('showAtlasMaps(true);atlasSelected="east";startAtlasMap();');assert.equal(run('S.day'),0);assert.equal(run('S.points'),5000);assert.equal(run('atlasBest().east'),65);assert.equal(run('atlasSaved("west").points'),3210);
console.log('PASS independent map saves, explicit restart, best retention');
run('activateAtlasGeometry(null);reset();delete S.mapId;S.day=25;save();var legacyCoords=JSON.stringify(S.cities.map(c=>[c.x,c.y]));load();');assert.equal(run('activeAtlasMap'),null);assert.equal(run('JSON.stringify(S.cities.map(c=>[c.x,c.y]))'),run('legacyCoords'));assert(run('coast(300)<1200'));assert.equal(run('mountains.length'),3);
console.log('PASS legacy coast/coordinates retained');
// Use production map geometry and the original routing kernel as the oracle.
for(let map of ['east','west']){
 run(`activateAtlasGeometry('${map}');reset();closeModal();S.points=100000;S.day=100;S.unlocked=['bus','emu','rail','air'];S.lines=[{id:1,type:'bus',color:'#123',stops:[0,1,2]},{id:2,type:'air',color:'#456',stops:[0,2,1]}];S.vehicles=[{id:1,line:1,type:'bus',index:0,dir:1,t:0,cars:1,people:[]},{id:2,line:2,type:'air',index:2,dir:-1,t:0,cars:1,people:[]}];`);
 for(let phase=0;phase<4;phase++){
  run(`S.vehicles[0].service=${phase===1?'{mode:"express",skip:[1]}':'{mode:"all"}'};S.cities[1].hub=${phase===2};S.blockages=${phase===3?'{[key(S.cities[0],S.cities[1],"bus")]:{cause:"quake",status:"broken",allowed:[]}}':'{}'};`);
  for(let origin=0;origin<3;origin++)for(let dest=0;dest<3;dest++)if(origin!==dest){
   run(`routingBatch=null;var testP={origin:${origin},dest:${dest},eventId:'routing-test'},ref=planBeforeMemo(${origin},testP);routingBatch={routes:new Map(),travel:new Map()};var got=plan(${origin},testP);routingBatch=null;`);
   assert.equal(run('JSON.stringify(got)'),run('JSON.stringify(ref)'));
  }
 }
 for(let seg=0;seg<run('riverSegments.length');seg++){
  run(`var seg=riverSegments[${seg}],n=nearestRiver({x:(seg.a.x+seg.b.x)/2,y:(seg.a.y+seg.b.y)/2}),a={x:n.x-19*n.nx,y:n.y-19*n.ny},b={x:n.x+19*n.nx,y:n.y+19*n.ny};`);
  if(run('bridgeTerrainIssue(a,b)===null'))assert.equal(run('requirements(a,b,"bus").bridge'),1);
 }
}
console.log('PASS 48 native-vs-optimized routing queries including closures, express and hubs; all multi-river bridge sites checked');
// The original growth floor belongs to the original map footprint. Keep it for legacy saves.
// v1.4's enclosed basin has a separate fixed-seed oracle, verified against pristine upstream 57d1284.
for(let map of ['east','west-legacy','west']){
 run(`activateAtlasGeometry('${map==='west-legacy'?'west':map}');reset();${map==='west-legacy'?"delete S.westTerrain14;S.riverPaths128=atlasClone([legacyWest14.main,...legacyWest14.branches]);activateAtlasGeometry('west');resetTerrainBefore14();":''}closeModal();configureGrowth();var seededBefore=Math.random;Math.random=marketRng(1291001);for(let day=0;day<=400;day++){S.day=day;if(day>=65)S.unlocked=['bus','emu','rail','air'];for(let c of realCities())if(c.dormant&&c.openingAt<=day)c.dormant=false;updateGrowthMaturity();spawnCity();}Math.random=seededBefore;`);
 if(map==='west')assert.equal(run('realCities().length'),27,'v1.4 basin, seed 1291001: same town count as upstream');else assert(run('realCities().length>=30'));assert(run('cityRegions().length>=2'));assert(run('realCities().every(c=>cityBuildable(c.x,c.y,2))'));
 assert(run('S.atlasGrowth.births.every(b=>S.cities[b.id].regionId===b.region&&!b.outlying||S.cities[b.id].outlying)'));
 for(let i=3;i<run('realCities().length');i++)assert(run(`S.cities.slice(0,${i}).every(c=>Math.hypot(c.x-S.cities[${i}].x,c.y-S.cities[${i}].y)>=190-1e-6)`));
 console.log('PASS '+map+' 400-day spatial growth: '+run('realCities().length')+' towns / '+run('cityRegions().length')+' circles; fixed membership and clearance');
}
run('activateAtlasGeometry("east");reset();closeModal();S.cities[2].shape=2;S.cities[2].size=1;var moneyBeforeBank=S.points;buildFinance(2,"bank");');assert.equal(run('S.points'),run('moneyBeforeBank')-100);assert.equal(run('S.cities[2].financeBuildings.bank'),1);
run('closeModal();var moneyBeforeFarm=S.points;S.cities[1].size=1;plantFarm(1);');assert.equal(run('S.points'),run('moneyBeforeFarm')-800);assert(run('!!S.cities[1].farm.crop'));
console.log('PASS actual atlas production entry retains bank100 and farm800 (excluded only in offline comparison)');

// PR #3 rotation must also work with v1.2 terrain and geographic camera targets.
for(const rot of [false,true]){run(`view.rot=${rot};view.scale=.7;view.x=330;view.y=250;var rect127=worldViewportRect(20);`);
 for(const [x,y] of [[0,0],[390,0],[0,844],[390,844]])assert(run(`(()=>{let p=toWorld({clientX:${x},clientY:${y}});return p.x>=rect127.left&&p.x<=rect127.right&&p.y>=rect127.top&&p.y<=rect127.bottom;})()`));
 run('S.lastEarthquake={x:-300,y:700};focusEarthquake();var target127=quakeCamera.target;var sx127=target127.x+(view.rot?-S.lastEarthquake.y:S.lastEarthquake.x)*target127.scale,sy127=target127.y+(view.rot?S.lastEarthquake.x:S.lastEarthquake.y)*target127.scale;');assert(Math.abs(run('sx127-W/2'))<1e-6);assert(Math.abs(run('sy127-(fitBand().top+fitBand().bottom)/2'))<1e-6);
}
console.log('PASS merged v1.2 terrain viewport bounds and earthquake target for rotated/unrotated cameras');
