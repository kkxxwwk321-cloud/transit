const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}







for(const map of ['west','east']){
 run(`activateAtlasGeometry('${map}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;drawTerrain=()=>{};`);
 run(`var a15=S.cities[0],b15=S.cities[1];beginPointer({pointerId:99,clientX:toScreen(a15).x,clientY:toScreen(a15).y});movePointer({pointerId:99,clientX:toScreen(b15).x,clientY:toScreen(b15).y});`);
 assert(run('draft&&draft.pointer'));
 assert.doesNotThrow(()=>run('drawTerrainPreview();render();'),map+': live drag must render the bridge/tunnel quote');
 run(`finishPointer({pointerId:99,type:'pointerup',clientX:toScreen(b15).x,clientY:toScreen(b15).y});`);assert(run('draft.stops.length>=2'));assert.equal(run('runtimeFault13'),null);
 run('var beforeCash15=S.points;commitDraft(true);');assert.equal(run('draft'),null);assert.equal(run('S.lines.length'),1);assert(run('S.points<beforeCash15'));
 run('save();load();');assert.equal(run('S.lines.length'),1);assert.equal(run('runtimeFault13'),null);
}
console.log('PASS east/west actual pointer drag -> preview/frame -> build -> save/load');dom.window.close();
