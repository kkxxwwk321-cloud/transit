const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}





run('atlasMenuOpen=false;closeModal();S.tutorial123=null;');
const realNow14=w.performance.now.bind(w.performance);let octClock14=100000;w.performance.now=()=>octClock14;
run(`for(const map of ['east','west']){atlasSelected=map;atlasRestart=true;startAtlasBeforeLifecycle12();S.points=100000;draft={type:'bus',name:'cache regression',color:'#bd5c4c',stops:[0,1],stopRemoval:null};commitDraft(true);if(draft)cancelDraft(false);S.paused=true;save();}`);
assert.equal(run('S.lines.length'),1);run('uxOctPlanNow();');
for(const map of ['east','west']){
  run(`atlasSelected='${map}';atlasRestart=false;startAtlasBeforeLifecycle12();S.paused=true;`);
  for(const dt of [0,1000]){
    octClock14+=dt;
    const endpoints14=run(`(()=>{const l=S.lines[0],a=S.cities[l.stops[0]],b=S.cities[l.stops[1]];return [Math.hypot(lanePoint(a,b,l,0).x-a.x,lanePoint(a,b,l,0).y-a.y),Math.hypot(lanePoint(a,b,l,1).x-b.x,lanePoint(a,b,l,1).y-b.y)]})()`);
    assert(endpoints14.every(d=>d<1e-8),`map ${map}, +${dt}ms: cached line left its stations by ${endpoints14}`);
  }
}
run('save();load();');
run('uxOctPlanNow();');assert(run('uxOctPlanState===S'), 'reload must invalidate the old state before throttle');
run(`requirements=()=>({bridge:0,tunnel:0});S.cities[0].x=0;S.cities[0].y=0;S.cities[1].x=100;S.cities[1].y=40;uxOctPlanKey=null;uxOctPlanAt=-1e9;uxOctPath(S.cities[0],S.cities[1],"bus");S=JSON.parse(JSON.stringify(S));S.cities[0].x=500;S.cities[1].x=600;`);assert(run('uxOctPath(S.cities[0],S.cities[1],"bus")[0]===S.cities[0]'));assert.equal(run('uxOctPath(S.cities[0],S.cities[1],"bus")[0].x'),500);
w.performance.now=realNow14;
assert.equal(run('runtimeFault13'),null);console.log('PASS PR path cache: real save switches and load, immediate and after throttle');dom.window.close();
