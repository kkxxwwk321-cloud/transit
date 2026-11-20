const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}






run("activateAtlasGeometry('east');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;S.paused=false;gesture=null;pointers.clear();");
run("renderBrief15();");assert.equal(run("$('earnings-brief15').hidden"),true);
run("queueBrief15('investment',0,1);queueBrief15('farm',0,1);");assert.equal(run('briefState15().history.length'),0);
run("queueBrief15('investment',-15,2);renderBrief15();");assert.equal(run('S.paused'),false);assert.equal(run('modalOpen'),false);assert.equal(run("$('earnings-brief15').hidden"),false);assert(run("$('earnings-brief15').textContent.includes('−¥15')"));
run("queueBrief15('investment',20,3);queueBrief15('farm',200,3);renderBrief15();");assert.equal(run('briefState15().pending.profit'),205);assert.equal(run('briefState15().pending.investment'),2);assert.equal(run("document.querySelectorAll('#earnings-brief15').length"),1);
run("draft={};renderBrief15();");assert.equal(run("$('earnings-brief15').hidden"),true);assert(run('briefState15().pending'));
run("draft=null;renderBrief15();briefDeadline15=performance.now()-1;renderBrief15();");assert.equal(run('briefState15().pending'),null);assert.equal(run('briefState15().unread'),true);assert.equal(run('S.paused'),false);
run("queueBrief15('investment',-1,4);renderBrief15();openBrief15();");assert.equal(run('S.paused'),true);assert.equal(run('modalOpen'),true);assert.equal(run('briefState15().unread'),false);run('closeModal();');assert.equal(run('S.paused'),false);
run("S.paused=true;queueBrief15('farm',200,5);openBrief15();closeModal();");assert.equal(run('S.paused'),true);
run("S.paused=false;openBrief15();S.interruption={pending:true};closeModal();");assert.equal(run('S.paused'),true);run('S.interruption=null;S.paused=false;');
console.log('PASS one-slot coalescing, four-second expiry, gesture deferral, unread, manual details pause/resume, background lock');
// Exercise real finance settlement: unlocked empty account is silent; held wealth produces one report.
run("S.briefs15=null;S.financial=null;S.cities[1].shape=2;S.cities[1].size=2;S.cities[1].dormant=false;S.cities[1].banks=1;S.cities[1].brokers=1;S.day=2;var ff=financeState();ff.everBank=true;ff.everBroker=true;financialDailyReport(2.375);");assert.equal(run('briefState15().history.length'),0);
run("ff.wealthLots=[{units:100,cost:100}];ff.wealthNav=1;ff.lastReportAssets=90;ff.periodFlow=0;financialDailyReport(3.375);maybeDailyMarketReview();");assert.equal(run('S.paused'),false);assert.equal(run('modalOpen'),false);assert.equal(run('ff.dailyPending'),null);assert.equal(run('briefState15().history.length'),1);assert(run('briefState15().history[0].profit!==0'));
console.log('PASS empty financial account silent and real held-investment report nonblocking');
// Exact farm credits and due crops settle once, continue ticking, and never require acknowledgement.
run("S.financial=null;S.briefs15=null;S.agriculture=null;S.paused=false;S.day=10;S.cities[1].farm={round:1,completed:0,income:0,profit:0,history:[],crop:{round:1,start:0,due:9.5,payout:1000}};var cash15=S.points;settleFarms(true);maybeFarmHarvest();");assert.equal(run('S.points-cash15'),1000);assert.equal(run('S.paused'),false);assert.equal(run('S.agriculture.pending'),null);assert.equal(run('S.agriculture.completed'),1);assert.equal(run('briefState15().history[0].profit'),200);
run('settleFarms(true);maybeFarmHarvest();');assert.equal(run('S.points-cash15'),1000);assert.equal(run('S.agriculture.completed'),1);
run('notices130().queue=[];for(let k of ["school","repair","weather","hub","bank","broker","farm"])notices130().seen[k]=true;var day15=S.day;tick(.025);');assert(run('S.day>day15'));assert.equal(run('S.paused'),false);
run('save();load();');assert.equal(run('S.agriculture.completed'),1);assert.equal(run('S.agriculture.pending'),null);assert.equal(run('briefState15().history[0].profit'),200);
console.log('PASS real farm settlement exactly once, clock advances, save/load history');
dom.window.close();
