const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}







// Record actual canvas paths separately for the visible canvas and cached land tiles.
run(`var strokes154=[];function recorder154(target){let path=[],state={};let methods={save(){},restore(){},beginPath(){path=[];},moveTo(x,y){path.push(['M',x,y]);},lineTo(x,y){path.push(['L',x,y]);},stroke(){if(state.strokeStyle==='#85bfc0')strokes154.push({target,path:JSON.stringify(path)});},createLinearGradient(){return {addColorStop(){}};},measureText(t){return {width:7*String(t).length};}};return new Proxy(state,{get(o,k){return k in o?o[k]:methods[k]||(()=>{});},set(o,k,v){o[k]=v;return true;}});}ctx=recorder154('visible');HTMLCanvasElement.prototype.getContext=function(){return recorder154('tile');};makeReliefPreview=()=>document.createElement('canvas');`);
for(const map of ['west','east']){
 run(`activateAtlasGeometry('${map}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;strokes154=[];terrainCache=null;drawTerrain();`);
 assert.equal(run('strokes154.length'),1,'one river water pass across tile and apron');assert.equal(run('strokes154[0].target'),'visible');
 assert.equal(run("JSON.parse(strokes154[0].path).filter(p=>p[0]==='M').length"),map==='west'?3:4);
 assert.equal(run('strokes154[0].path'),run(`JSON.stringify([mapSpec.main,...mapSpec.branches].flatMap(p=>p.map(([x,y],i)=>[i?'L':'M',x,y])))`));
 run('var saved154=JSON.stringify(S.riverPaths128);var oldtile154=terrainCache;drawTerrain();');assert(run('terrainCache===oldtile154'));assert.equal(run('strokes154.length'),2);
 run('save();load();strokes154=[];drawTerrain();');assert.equal(run('strokes154.length'),1);assert.equal(run('JSON.stringify(S.riverPaths128)'),run('saved154'));
 // An older save may replace its geometry without a renderer notification.
 // The tile must still be rebuilt; no blue water can survive from its prior map.
 run('var prior154=terrainCache;mapSpec.main=mapSpec.main.map(([x,y])=>[x+9,y]);strokes154=[];drawTerrain();');assert(run('terrainCache!==prior154'));assert.equal(run('strokes154.length'),1);
 assert.equal(run('strokes154[0].path'),run(`JSON.stringify([mapSpec.main,...mapSpec.branches].flatMap(p=>p.map(([x,y],i)=>[i?'L':'M',x,y])))`));
 console.log('PASS '+map+': one authoritative river pass, separate tributaries, land-only cache, save/load preservation, stale tile invalidation');
}

for(const map of ['east','west']){
 run(`activateAtlasGeometry('${map}');reset();initializeRiver128();var base154=atlasClone(S.riverPaths128),bounds154={...mapSpec.bounds},edge154={xmin:bounds154.xmin-850,xmax:bounds154.xmax+850,ymin:bounds154.ymin-850,ymax:bounds154.ymax+850};var bad154=base154.map((p,i)=>{let x=legacyExtendRiver153(p,false,edge154);return i===0?legacyExtendRiver153(x,true,edge154):x;});`);
 if(map==='east')assert(run('bad154[1][0][0]<0&&base154[1][0][0]>0'),'reproduce reversed east tributary');
 run(`S.points=100000;var site154=null;for(let e of riverSegments){let dx=e.b.x-e.a.x,dy=e.b.y-e.a.y,len=Math.hypot(dx,dy);if(len<.1)continue;let x=(e.a.x+e.b.x)/2,y=(e.a.y+e.b.y)/2,a={x:x-dy/len*24,y:y+dx/len*24},b={x:x+dy/len*24,y:y-dx/len*24};if(!bridgeTerrainIssue(a,b)){site154={type:'bus',a,b};break;}}bridgeDraft=site154;createBridge();closeModal();beginDraft('bus');draft.stops=[0,1,2];commitDraft(true);closeModal();var structures154=JSON.stringify({towns:S.cities.map(c=>[c.id,c.x,c.y]),bridges:S.bridges,lines:S.lines});`);
 assert.equal(run('S.bridges.length'),1);assert.equal(run('S.lines.length'),1);

 run('S.riverPaths128=atlasClone(bad154);S.mapRevision153=1;applyRiverPaths128(S.riverPaths128);applyMapRevision153();var repaired154=atlasClone(S.riverPaths128);');
 assert(run(`base154.every((old,rid)=>{let now=repaired154[rid],index=now.findIndex(p=>Math.hypot(p[0]-old[0][0],p[1]-old[0][1])<1e-6);return index>=0&&old.every((p,i)=>Math.hypot(p[0]-now[index+i][0],p[1]-now[index+i][1])<1e-6);})`),'preserve every original sample');
 assert(run(`base154.every((old,rid)=>{let now=repaired154[rid],index=now.findIndex(p=>Math.hypot(p[0]-old[0][0],p[1]-old[0][1])<1e-6),extras=[...now.slice(0,index),...now.slice(index+old.length)];return extras.every(([x,y])=>x<bounds154.xmin||x>bounds154.xmax||y<bounds154.ymin||y>bounds154.ymax);})`),'extensions stay outside existing playable core');
 run('save();load();');assert.equal(run('JSON.stringify(S.riverPaths128)'),run('JSON.stringify(repaired154)'),'repair stable after real save/load');
 assert.equal(run('JSON.stringify({towns:S.cities.map(c=>[c.id,c.x,c.y]),bridges:S.bridges,lines:S.lines})'),run('structures154'),'built bridge, towns and route survive repair');
 assert.equal(run('riverSpans(S.cities[S.bridges[0].heads[0]],S.cities[S.bridges[0].heads[1]]).length'),1,'built bridge still crosses the original river');
 console.log('PASS '+map+': repair v1.5.3 endpoint reversal, retain original river samples, keep added extensions outside the core, stable save/load');
}
assert.equal(run('runtimeFault13'),null);dom.window.close();
