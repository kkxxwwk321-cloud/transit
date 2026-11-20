const assert=require('node:assert/strict'),g=require('./harness156.cjs')(),{run}=g;
run(`activateAtlasGeometry('ocean');reset();atlasMenuOpen=false;closeModal();S.paused=false;S.lives=2;S.cities.forEach(c=>{c.dormant=false;c.harbor={x:c.x,y:c.y}});S.lines=[{id:169,type:'ship',stops:[0,1]}];S.vehicles=[{id:169,line:169,type:'ship',t:.4,dwell:0,dock16:null,parked:false,people:[]}];updateShipHorn169(0);shipHornWait169=3000;`);
let plays=g.plays;
run('updateShipHorn169(1000);updateShipHorn169(2000)');assert.equal(g.plays,plays);
run('updateShipHorn169(3000)');assert.equal(g.plays,plays+1);assert(run('shipHorn169.volume<=effectsPrefs156.volume*.32&&shipHornWait169>=90000&&shipHornWait169<=180000'));
run('S.speed=4;updateShipHorn169(4000);');assert.equal(g.plays,plays+1);assert(run('shipHornWait169>=89000'));
run('S.paused=true;var before169=shipHornWait169;updateShipHorn169(900000);S.paused=false;updateShipHorn169(900001);');assert.equal(run('shipHornWait169'),run('before169'));
for(const code of ['S.paused=true','modalOpen=true','atlasMenuOpen=true','S.lives=0','S.vehicles=[]','delete S.cities[0].harbor',"S.mapId='east'",'effectsPrefs156.enabled=false']){
 run(`S.paused=false;modalOpen=false;atlasMenuOpen=false;S.lives=2;S.mapId='ocean';effectsPrefs156.enabled=true;S.vehicles=[{line:169,type:'ship',t:.4}];S.cities[0].harbor={x:0,y:0};${code};shipHornWait169=0;updateShipHorn169(999999);`);assert.equal(g.plays,plays+1,code);
}
run(`S.mapId='ocean';S.lives=0;S.points=9000;delete S.cities[0].harbor;var beforePort169=S.points;buildHarbor16(0);`);assert.equal(run('S.points'),run('beforePort169'));assert(!run('S.cities[0].harbor'));
assert.deepEqual(g.errors,[]);g.dom.window.close();console.log('PASS fleet-wide horn cooldown, real-time speed independence, silent pause/menu/mute/no-port/no-ship/game-over and no post-game harbor charge');
