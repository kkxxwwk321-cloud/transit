const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}






run("activateAtlasGeometry('west');atlasMenuOpen=false;closeModal();S.tutorial123=null;");
for(let seed=1;seed<=40;seed++){
 run(`var rng152=${seed};Math.random=()=>((rng152=(1664525*rng152+1013904223)>>>0)/4294967296);reset();S.tutorial123=null;S.day=10;spawnCity();`);assert.equal(run('realCities().length'),4);
 run('for(let c of S.cities)c.dormant=false;S.day=34;spawnCity();');assert.equal(run('realCities().length'),5,'seed '+seed+' fifth city at day34');
 run('for(let c of S.cities)c.dormant=false;S.day=52;spawnCity();');assert.equal(run('realCities().length'),6,'seed '+seed+' sixth city at day52');
 assert(run('realCities().every(c=>cityBuildable(c.x,c.y,0))'));
}
// Recreate an old four-city save in the trapped pocket, then resume at the screenshot day.
run("reset();var r152=cityRegions()[0];S.day=10;addCity({x:-80,y:740},r152);growthState().next=34;for(let c of S.cities)c.dormant=false;S.day=52;save();load();for(let c of S.cities)c.dormant=false;");assert.equal(run('realCities().length'),4);run('spawnCity();');assert.equal(run('realCities().length'),5);assert(run('basinSpawnAllowedWeb(realCities().at(-1))'));
console.log('PASS 40 openings: fourth day10/fifth day34/sixth day52; old trapped save resumes without resetting');dom.window.close();
