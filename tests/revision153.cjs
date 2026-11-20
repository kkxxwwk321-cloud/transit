const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}






run("activateAtlasGeometry('west');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;");
assert.equal(run('mapSpec.bounds.ymax'),1650);assert.equal(run('mapSpec.bounds.xmax'),1500);assert.equal(run('S.points'),7000);assert.equal(run('S.cities[0].x'),-320);
run("beginDraft('bus');draft.stops=[0,1,2];");assert.equal(run('draftCost().cash'),5670);run('cancelDraft(false);');
run('view.scale=portraitMinScale();var low153=clampPortraitCamera({scale:view.scale,x:0,y:-1e6}).y,high153=clampPortraitCamera({scale:view.scale,x:0,y:1e6}).y;');assert(run('high153-low153>=239'));
// Every open river end lies outside the complete movable scenic bounds, on both maps.
for(const map of ['east','west']){
 run(`activateAtlasGeometry('${map}');reset();`);
 assert(run(`(()=>{let b=portraitBounds();return [mapSpec.main[0],mapSpec.main.at(-1),...mapSpec.branches.map(p=>p[0])].every(([x,y])=>x<b.xmin||x>b.xmax||y<b.ymin||y>b.ymax);})()`));
 run('var paths153=JSON.stringify(S.riverPaths128);applyMapRevision153();');assert.equal(run('JSON.stringify(S.riverPaths128)'),run('paths153'));
 run('save();load();');assert.equal(run('JSON.stringify(S.riverPaths128)'),run('paths153'));
}
assert.equal(run('clusterFits153([0,1,2,3,4].map(i=>({x:i*200,y:0})))'),false);assert.equal(run('clusterFits153([0,1,2,3,4].map(i=>({x:i*160,y:i*160})))'),false);assert(run('clusterFits153([{x:0,y:0},{x:220,y:0},{x:0,y:220},{x:220,y:220},{x:110,y:-220}])'));
console.log('PASS expanded west / unchanged opening quote / vertical room / both complete river networks / idempotent save geometry / no line-shaped clusters');
// Real pointer operations across several towns, without lifting the pointer.
run(`activateAtlasGeometry('east');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.lines=[];S.vehicles=[];S.cities=Array.from({length:6},(_,id)=>({...S.cities[0],id,x:100+id*200,y:500,shape:id%3,color:id%3,dormant:false,removed:false,q:[]}));requirements=()=>({bridge:0,tunnel:0,hill:0});S.points=50000;`);
function down(id){run(`beginPointer({pointerId:77,clientX:toScreen(S.cities[${id}]).x,clientY:toScreen(S.cities[${id}]).y});`)}
function move(id){run(`movePointer({pointerId:77,clientX:toScreen(S.cities[${id}]).x,clientY:toScreen(S.cities[${id}]).y});`)}
function up(id){run(`finishPointer({pointerId:77,type:'pointerup',clientX:toScreen(S.cities[${id}]).x,clientY:toScreen(S.cities[${id}]).y});`)}
down(0);move(1);move(2);up(2);assert.equal(run('draft.stops.join()'),'0,1,2');run('cancelDraft(false);beginDraft("bus");draft.stops=[0,1];commitDraft(true);clearSelection();');
down(1);move(2);move(3);move(4);up(4);assert.equal(run('draft.stops.join()'),'0,1,2,3,4');assert.equal(run('S.lines[0].stops.join()'),'0,1');run('cancelDraft(false);');
down(0);move(2);move(3);up(3);assert.equal(run('draft.stops.join()'),'3,2,0,1');run('cancelDraft(false);');
assert.equal(run('runtimeFault13'),null);console.log('PASS continuous new line, tail extension and head extension, no premature commit');dom.window.close();
