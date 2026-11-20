const assert=require('node:assert/strict'),create=require('./harness156.cjs');
(async()=>{
for(const available of [true,false]){
 const g=create({legacyTerrain167:true}),{run}=g;g.w.HTMLElement.prototype.scrollTo=function(){};g.raf13.clear();
 run(`Object.defineProperty(terrainImages167.east,'complete',{value:true});Object.defineProperty(terrainImages167.east,'naturalWidth',{value:${available?1536:0}});atlasSelected='east';atlasRestart=true;`);
 const promise=run('startAtlasMap()');assert(run('mapLoading166&&!mapLoadPanel166.hidden&&S.paused'));
 for(let i=0;i<30;i++){for(const [id,fn]of [...g.raf13]){g.raf13.delete(id);fn(0);}await Promise.resolve();await Promise.resolve();}
 await promise;assert(!run('mapLoading166'));
 if(available){assert(run('mapLoadPanel166.hidden&&newAtlas167()'));assert(!run('runtimeFault13'));}
 else{assert(run('!mapLoadPanel166.hidden&&S.paused'));assert(run('mapLoadPanel166.querySelector("button").textContent==="重新加载"'));}
 assert.deepEqual(g.errors,[]);g.dom.window.close();
}
console.log('PASS full-entrypoint new-map first frame and failed terrain resource stays paused behind retry panel');
})().catch(e=>{console.error(e);process.exitCode=1});
