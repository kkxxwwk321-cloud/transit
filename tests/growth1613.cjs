const assert=require('node:assert/strict'),create=require('./harness156.cjs');
for(const seed of [31627,92817,155921]){
 const g=create(),{run}=g;let rng=seed;g.w.Math.random=()=>((rng=(1664525*rng+1013904223)>>>0)/4294967296);
 run(`activateAtlasGeometry('ocean');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;`);
 assert.equal(run('S.points'),12000);assert.equal(run('formatDate().month'),6);
 const starts=run('JSON.stringify(realCities().slice(0,3).map(c=>[c.x,c.y]))');
 // Layout-only inspection: normal birth dates, no passenger simulation or cash injected.
 for(let day=1;day<=78;day++){
  run(`S.day=${day};realCities().forEach(c=>c.dormant=false);var oldCount13=realCities().length;spawnCity();if(realCities().length>oldCount13){var added13=realCities().at(-1),nearest13=Math.min(...realCities().slice(0,-1).map(c=>Math.hypot(c.x-added13.x,c.y-added13.y))),spacing13=oceanSpacing1613(oldCount13+1);if(nearest13<spacing13.min||nearest13>spacing13.max)throw Error('spawn spacing');if(!cityBuildable(added13.x,added13.y,2))throw Error('unsafe spawn');}`);
 }
 assert.equal(run('realCities().length'),12);assert.equal(run('S.points'),12000);
 assert.equal(run('JSON.stringify(realCities().slice(0,3).map(c=>[c.x,c.y]))'),starts);
 assert.equal(run("realCities().filter(c=>c.isVegas&&c.name==='拉斯维加斯').length"),1);
 assert.deepEqual(JSON.parse(run('JSON.stringify(growthState().births.map(b=>b.day))')),[10,20,30,38,46,54,62,70,78]);
 // Continuing an old run must preserve its money, map coordinates, clock and next-city schedule.
 run(`S.points=4321;S.release='1.6.12';var before13=JSON.stringify({cash:S.points,day:S.day,cities:S.cities.map(c=>[c.id,c.x,c.y]),next:growthState().next});save();load();`);
 assert.equal(run('JSON.stringify({cash:S.points,day:S.day,cities:S.cities.map(c=>[c.id,c.x,c.y]),next:growthState().next})'),run('before13'));
 assert.equal(run('S.release'),'1.6.15');assert.deepEqual(g.errors,[]);g.dom.window.close();
 console.log('PASS seed '+seed+' moderate early spacing, unchanged dates/start cities and save continuity');
}
const g=create();for(const [map,cash]of [['east',7000],['west',8000]]){g.run(`activateAtlasGeometry('${map}');reset();`);assert.equal(g.run('S.points'),cash);}g.dom.window.close();
console.log('PASS east/west starting funds unchanged');
