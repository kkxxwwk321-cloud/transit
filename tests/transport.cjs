const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}





run("activateAtlasGeometry('east');reset();atlasMenuOpen=false;S.tutorial123=null;");
function setup(stops,loop=false){run(`
 S.lines=[];S.vehicles=[];S.blockages={};S.climate.events=[];
 S.cities=Array.from({length:7},(_,id)=>({...S.cities[0],id,x:id*100,y:0,color:id,shape:0,origin:undefined,dormant:false,removed:false,q:[],mission:{...S.cities[0].mission},arrivals:0,departures:0,served:0}));
 S.cities[3].color=2;
 canEnter=(a,b)=>!S.blockages[a.id+'-'+b.id]&&!S.blockages[b.id+'-'+a.id];
 serviceTravelTime=(v,l,i,d)=>Math.abs(l.stops[i]-l.stops[i+d])*2+1;
 S.delivered=0;S.periodDelivered=0;
 `);for(let i=0;i<stops.length;i++)run(`S.lines.push({id:${i+1},type:'bus',stops:${JSON.stringify(stops[i])},name:'test',color:0});S.vehicles.push({id:${i+1},line:${i+1},type:'bus',index:0,dir:1,t:0,dwell:0,people:[],cars:1});`);}
const passenger=(extra='')=>`({origin:0,color:2,shape:0,wait:70,ready:0,journey:0,legs:{},${extra}})`;
setup([[0,1],[1,4],[4,2]]);
assert.equal(run(`plan(0,${passenger()}).target`),2);
assert.equal(run(`plan(0,${passenger()}).rides`),3);
run(`S.cities[0].q=[${passenger()}];arrival(S.vehicles[0],S.lines[0]);`);
assert.equal(run('S.vehicles[0].people.length'),1);
run('S.vehicles[0].index=1;arrival(S.vehicles[0],S.lines[0]);');assert.equal(run('S.cities[1].q.length'),1);assert.equal(run('S.cities[1].q[0].wait'),70);
run('S.cities[1].q[0].ready=0;arrival(S.vehicles[1],S.lines[1]);');assert.equal(run('S.vehicles[1].people.length'),1);
run('S.vehicles[1].index=1;arrival(S.vehicles[1],S.lines[1]);S.cities[4].q[0].ready=0;arrival(S.vehicles[2],S.lines[2]);S.vehicles[2].index=1;arrival(S.vehicles[2],S.lines[2]);');assert.equal(run('S.delivered'),1);assert.equal(run('S.vehicles[2].people.length'),0);
console.log('PASS required two transfers, actual boarding/alighting, wait preserved, one delivery');
setup([[0,1,2]]);assert.equal(run(`plan(0,${passenger()}).rides`),1);
run(`S.vehicles[0].index=1;S.vehicles[0].people=[${passenger()}];arrival(S.vehicles[0],S.lines[0]);`);assert.equal(run('S.vehicles[0].people.length'),1);assert.equal(run('S.cities[1].q.length'),0);
console.log('PASS same ride has one boarding cost and stays aboard');
setup([[0,3]]);assert.equal(run(`plan(0,${passenger()}).target`),3);
assert.equal(run(`plan(0,${passenger('cardId:"c",dest:2')})`),null);
assert.equal(run(`matchesDestination(S.cities[3],${passenger()})`),true);
assert.equal(run(`matchesDestination(S.cities[3],${passenger('cardId:"c",dest:2')})`),false);
assert.equal(run('matchesDestination(S.cities[0],{origin:1,color:0,shape:0,eventId:0,dest:2})'),false);
run('S.lines[0].stops=[0,2];');assert.equal(run(`plan(0,${passenger('cardId:"c",dest:2')}).target`),2);
run('S.blockages["0-2"]={status:"broken"};');assert.equal(run(`plan(0,${passenger()})`),null);
run('S.blockages={};S.lines[0].stops=[0,1];');assert.equal(run(`plan(0,${passenger()})`),null);
run(`S.cities[0].q=[${passenger()}];arrival(S.vehicles[0],S.lines[0]);`);assert.equal(run('S.cities[0].q.length'),1);
console.log('PASS interchangeable ordinary / exact special / destination ID zero / edits and closures / unreachable does not board');
setup([[0,1,2,0]]);assert.equal(run(`plan(2,{origin:2,color:1,shape:0}).next`),0);assert.equal(run(`plan(2,{origin:2,color:1,shape:0}).target`),1);
run('S.vehicles[0].dir=-1;');assert.equal(run(`plan(0,${passenger()}).next`),2);
console.log('PASS bus loop seam in both directions, no reverse shortcut');
setup([[0,1,2]]);run(`S.vehicles[0].people=[${passenger()}];S.vehicles[0].stops=[0,1,2];S.lines[0].stops=[0,3];S.vehicles[0].index=1;arrival(S.vehicles[0],vehicleLine(S.vehicles[0]));`);assert.equal(run('S.cities[1].q.length'),1);
console.log('PASS edited onboard vehicle releases at safe city');
setup([[0,2]]);run(`vehCap=()=>1;S.cities[0].q=[${passenger('wait:10')},${passenger('wait:90')}];arrival(S.vehicles[0],S.lines[0]);`);assert.equal(run('S.vehicles[0].people[0].wait'),90);
console.log('PASS oldest eligible passenger boards first');
// Batch reuse: same origin and destination shares a result, a later arrival builds afresh.
run(`routingBatch={routes:new Map(),travel:new Map()};`);let a=run(`plan(0,${passenger()})`),b=run(`plan(0,${passenger()})`);assert.equal(a,b);run('routingBatch=null;S.lines[0].stops=[0,1];');assert.equal(run(`plan(0,${passenger()})`),null);
console.log('PASS transaction cache reuse and invalidation');
dom.window.close();
