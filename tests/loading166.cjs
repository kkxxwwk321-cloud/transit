const assert=require('node:assert/strict'),g=require('./harness156.cjs')({legacyTerrain166:true}),{run}=g;
(async()=>{
 g.w.HTMLElement.prototype.scrollTo=function(){};g.raf13.clear();run(`atlasSelected='east';atlasRestart=true;`);const day=run('S.day'),promise=run('startAtlasMap()');assert(run('mapLoading166&&!mapLoadPanel166.hidden&&S.paused'));assert.equal(run('S.day'),day);
 async function flush(){for(const [id,fn]of [...g.raf13]){g.raf13.delete(id);fn(0);}await Promise.resolve();await Promise.resolve();}
 for(let i=0;i<30;i++)await flush();assert(!run('mapLoading166'),'loading must finish within controlled frames');await promise;assert(!run('mapLoading166'));assert(run('mapLoadPanel166.hidden'));assert.equal(run('S.mapId'),'east');assert.equal(g.errors.length,0);g.dom.window.close();console.log('PASS map loading overlay, paused preparation, first frame then resume');
})().catch(e=>{console.error(e);process.exitCode=1;g.dom.window.close()});
