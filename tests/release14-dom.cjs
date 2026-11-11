const {JSDOM,VirtualConsole}=require('../mobile/node_modules/jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../mobile/www');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}


(async()=>{
run('activateAtlasGeometry("east");reset();activateAtlasGeometry("west");reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;');
assert(run('S.westTerrain14'));assert.equal(run('mountains.length'),41);assert(run('mapSpec.terrainRevision14===1'));
assert(run('S.cities.slice(0,3).every(c=>cityBuildable(c.x,c.y,0))'));
console.log('west',run('JSON.stringify({mountains:mountains.length,starts:S.cities.slice(0,3).map(c=>({x:c.x,y:c.y,ok:cityBuildable(c.x,c.y,0)})),pool:growthGrid().length})'));
assert(run('mountainCrossings({x:100,y:450},{x:1100,y:100}).length>0'));
assert(run('mountainCrossings({x:100,y:450},{x:100,y:-300}).length>0'));
assert(run('mountainCrossings({x:100,y:450},{x:-1000,y:450}).length>0'));
assert(run('mountainCrossings({x:100,y:450},{x:400,y:1200}).length>0'));
assert.equal(run('mountainCrossings({x:700,y:450},{x:1150,y:450}).length'),0);
run('var hills14=JSON.stringify(mountains);var paths14=JSON.stringify(S.riverPaths128);save();load();');assert.equal(run('JSON.stringify(mountains)'),run('hills14'));assert.equal(run('JSON.stringify(S.riverPaths128)'),run('paths14'));
console.log('blocked rays',run('Array.from({length:72},(_,i)=>{let a=i/72*Math.PI*2;return mountainCrossings({x:80,y:450},{x:80+1200*Math.cos(a),y:450+900*Math.sin(a)}).length>0}).filter(Boolean).length'));
// An older save retains every old mountain and bridge coordinate.
run('delete S.westTerrain14;S.riverPaths128=atlasClone([legacyWest14.main,...legacyWest14.branches]);activateAtlasGeometry("west");var oldMount14=JSON.stringify(mountains);save();load();');assert.equal(run('JSON.stringify(mountains)'),run('oldMount14'));assert.equal(run('mountains.length'),10);assert(!run('mapSpec.terrainRevision14'));
run('reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;');assert(run('mapSpec.terrainRevision14'));assert.equal(run('mountains.length'),41);
assert.equal(run('ACHIEVEMENTS14.length'),24);assert.equal(run('ACHIEVEMENTS14.filter(a=>a.grade==="diamond").length'),1);assert.equal(run('ACHIEVEMENTS14.find(a=>a.grade==="diamond").id'),'shareholder');assert.equal(w.document.querySelector('#atlas-back'),null);assert.equal(w.document.querySelector('.atlas-medal'),null);assert(w.document.querySelector('#achievements-entry14'));
run('S.tutorial123={stage:"done"};achSync14();');assert(!run('achievements14.unlocked.tutorial'));run('S.tutorial123.completed129=true;achSync14();');assert(run('achievements14.unlocked.tutorial'));
// Lifetime counts begin at installation, never count a save twice or after rewinding.
run('var total14=achievements14.total;S.delivered+=100;save();');assert.equal(run('achievements14.total'),run('total14')+100);run('save();load();achSync14();');assert.equal(run('achievements14.total'),run('total14')+100);run('S.delivered-=30;save();S.delivered+=30;save();');assert.equal(run('achievements14.total'),run('total14')+100);run('S.delivered++;save();');assert.equal(run('achievements14.total'),run('total14')+101);
run('var retain14=achievements14.total;reset();');assert.equal(run('achievements14.total'),run('retain14'));assert(run('achievements14.unlocked.tutorial'));
// Super shareholder uses total shares, not float or shares summed across companies.
run('var fin14=financeState();fin14.market={stocks:MARKET_STOCKS.map(c=>({shares:0}))};fin14.market.stocks[0].shares=MARKET_STOCKS[0].float*.1;achSync14();');assert(!run('achievements14.unlocked.shareholder'));run('fin14.market.stocks[0].shares=MARKET_STOCKS[0].total*.1;achSync14();');assert(run('achievements14.unlocked.shareholder'));run('fin14.market.stocks[0].shares=0;achSync14();');assert(run('achievements14.unlocked.shareholder'));
// Cards: successful five/six star only.
run('S.activityCards={history:[{success:false,star:6}]};achSync14();');assert(!run('achievements14.unlocked.six'));run('S.activityCards.history=[{success:true,star:5}];achSync14();');assert(run('achievements14.unlocked.five'));assert(!run('achievements14.unlocked.six'));run('S.activityCards.history.push({success:true,star:6});achSync14();');assert(run('achievements14.unlocked.six'));
// Six distinct real cities, no bridgeheads or repeated endpoint; actual complete circuit required.
run('while(S.cities.length<8)S.cities.push(makeCity(100+S.cities.length*40,500));var loop14={id:50,type:"bus",stops:[0,1,2,3,4,5,0]};var bus14={index:0,dir:1};achCircuit14(bus14,loop14);for(let i=1;i<=5;i++){bus14.index=i;achCircuit14(bus14,loop14);}');assert(!run('achievements14.unlocked.loop6'));run('bus14.index=6;achCircuit14(bus14,loop14);');assert(run('achievements14.unlocked.loop6'));
// Real stock transaction path: two buys reach total-share threshold; sell keeps badge.
run('delete achievements14.unlocked.shareholder;S.activityCards=null;S.financial=null;S.cities[0].shape=2;S.cities[0].size=2;S.cities[0].financeBuildings={bank:1,broker:1};S.points=1e9;openStockMarket();var q14=MARKET_STOCKS[0].total*.1;tradeStock(0,"buy",q14-1);');assert(!run('achievements14.unlocked.shareholder'));run('tradeStock(0,"buy",1);');assert(run('achievements14.unlocked.shareholder'));run('tradeStock(0,"sell",q14);');assert(run('achievements14.unlocked.shareholder'));
// Actual destination settlement is once-only; completed tunnel and repaired passage count on delivery.
run('closeModal();S.cities[0].shape=0;S.cities[1].shape=1;S.cities[1].color=1;S.cities[0].x=100;S.cities[0].y=450;S.cities[1].x=1100;S.cities[1].y=100;var passenger14={id:S.nextP++,origin:0,color:1,shape:1,originRegion:0,destRegion:0,wait:0,journey:1,legs:{}};var key14=key(S.cities[0],S.cities[1],"bus");S.blockages[key14]={cause:"quake",status:"repairing",until:S.day};settleClosures();');assert(run('S.achievements14.repaired[key14]'));run('recordSegment(passenger14,S.cities[0],S.cities[1],"bus");');assert(run('passenger14.achTunnel14'));assert(run('passenger14.achRepaired14'));run('var deliveries14=S.delivered;finishPassengerAtCity(passenger14,S.cities[1]);finishPassengerAtCity(passenger14,S.cities[1]);achSync14();');assert.equal(run('S.delivered'),run('deliveries14')+1);assert(run('achievements14.unlocked.tunnel'));assert(run('achievements14.unlocked.quake'));
run('S.inventory.tunnel=0;S.points=50000;beginDraft("bus");draft.stops=[0,1];var quote14=draftCost();');assert(run('quote14.tunnel>0'));assert(run('quote14.works>=2200'));run('cancelDraft(false);');
// Reading achievements marks red dot read, leaves game economy unchanged.
run('S.activityCards=null;S.financial=null;var cash14=S.points;showAtlasMaps(false);showAchievements14();');assert.equal(w.document.querySelectorAll('.ach-row14').length,24);assert(w.document.body.classList.contains('achievements-open14'));assert.equal(run('S.points'),run('cash14'));assert(!w.document.querySelector('#achievements-entry14').classList.contains('has-new'));run('closeModal();');assert(!w.document.body.classList.contains('achievements-open14'));
run('S.mapId="east";localStorage.setItem(ATLAS_BEST,JSON.stringify({east:99,west:180}));achSync14();');assert(run('achievements14.unlocked.day180'));assert(run('achievements14.unlocked.west'));assert.equal(run('achievements14.best.east'),99);
// Two independent maps can have identical line type/stop IDs. Their cached drawing paths cannot share city objects.
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
assert(run('uxOctPath(S.cities[0],S.cities[1],"bus")[0]===S.cities[0]'),'reload must not retain city objects from the previous game state');
w.performance.now=realNow14;
console.log('PASS bent-path cache follows actual map switch and reload, immediately and after the throttle interval');
await Promise.resolve();assert.deepEqual(errors,[]);assert.equal(run('runtimeFault13'),null);console.log('PASS v1.4 terrain enclosure/tunnels/land pass/buildable start/persistent geometry/legacy saves; 24 achievements/unique diamond/tutorial skip/lifetime reload and rewind/reset retention/total-share threshold/card success/circuit/unread/modal/economy');dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;dom.window.close();});
