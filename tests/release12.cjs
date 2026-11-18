// Regression checks for the 0.4 UX layer (ux.js): line building, line sheet, tasks, balance display.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const nodes = new Map();
const canvas = new Proxy({createLinearGradient: () => ({addColorStop(){}}), measureText: t => ({width:t.length*7})}, {get:(x,k)=>x[k]||(()=>{})});
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, {id, hidden:['details','modal','drawbar','db-types','db-cost','drawundo'].includes(id), style:{}, offsetParent:{}, textContent:'', innerHTML:'', dataset:{},
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on=on??!classes.has(v);on?classes.add(v):classes.delete(v);return on;},contains:v=>classes.has(v)},
      setAttribute(k,v){this[k]=v;}, append(){}, appendChild(){}, remove(){}, addEventListener(){}, contains(){return false;}, setPointerCapture(){}, querySelector(){return null;},
      getBoundingClientRect(){return this.rect||{left:0,right:10,top:0,bottom:10};}, getContext:()=>canvas});
  }
  return nodes.get(id);
}
node('header').rect={left:0,right:390,top:0,bottom:62};
node('dock').rect={left:12,right:378,top:776,bottom:834};
node('routes').rect={left:12,right:378,top:610,bottom:766};
const storage = new Map(),listeners={window:{},document:{}};
function listen(target,type,fn,capture){(listeners[target][type]??=[]).push({fn,capture:!!capture});}
function fire(target,type,event={}){event.target??={tagName:'BODY'};event.preventDefault??=()=>{};let stopped=false;event.stopImmediatePropagation=()=>{stopped=true;};for(const x of [...(listeners[target][type]||[])].sort((a,b)=>b.capture-a.capture)){x.fn(event);if(stopped)break;}}
/* v1.3: a focus change (notification banner, volume UI) no longer interrupts; going to the background does. */
function toBackground(){context.document.hidden=true;context.document.visibilityState='hidden';fire('document','visibilitychange');context.document.hidden=false;context.document.visibilityState='visible';}
const context = {console,document:{hidden:false,visibilityState:'visible',hasFocus:()=>context.focused,getElementById:node,createElement:()=>node('offscreen'+nodes.size),addEventListener:(t,f,c)=>listen('document',t,f,c),activeElement:{tagName:'BODY'},
  querySelectorAll:()=>[],
  querySelector:s=>({'header':node('header'),'footer .dock':node('dock'),'#routes':node('routes'),'#details':node('details')}[s]||null)},
  innerWidth:390,innerHeight:844,devicePixelRatio:1,focused:true,window:{addEventListener:(t,f,c)=>listen('window',t,f,c)},screen:{},performance:{now:()=>100},addEventListener(){},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null},requestAnimationFrame(){},cancelAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>{throw new Error('native confirm() must not be used');}};
context.document.body=node('body');context.document.body.appendChild=()=>{};context.document.documentElement=node('html');context.navigator={};
vm.createContext(context);
const html=fs.readFileSync(path.join(root,'dist/test04/index.html'),'utf8');
for(const match of html.matchAll(/<script src="([^"?]+)(?:[^"]*)"/g))vm.runInContext(fs.readFileSync(path.join(root,'dist/test04',match[1]),'utf8'),context,{filename:match[1]});
const run = code => vm.runInContext(code,context);




run('activateAtlasGeometry("east");reset();closeModal();S.paused=true;');
assert.equal(run('S.release'),'1.3');   /* upstream v1.3 stamps saves with 1.3 */assert.equal(run('Object.keys(TRANSPORT_RESEARCH).length'),8);
run('var b={type:"bus",cars:1},e={type:"emu",cars:2},r={type:"rail",cars:8},a={type:"air",cars:1};balanceState().power=1;researchState().completed={bus_capacity:{at:0}};');
assert.equal(run('vehCap(b)'),16);assert.equal(run('researchSpeedFactor("bus")'),1);
run('balanceState().power=1.5;');assert.equal(run('vehCap(b)'),23);
run('researchState().completed.emu_capacity={at:0};researchState().completed.rail_capacity={at:0};researchState().completed.air_capacity={at:0};');
assert.equal(run('vehCap(e)'),59);assert.equal(run('vehCap(r)'),237);assert.equal(run('vehCap(a)'),79);
run('balanceState().power=3;');assert.equal(run('vehCap(b)'),28);assert.equal(run('vehCap(e)'),72);assert.equal(run('vehCap(r)'),288);assert.equal(run('vehCap(a)'),96);
run('var beforeCap=vehCap(e);e.cars=3;');assert.equal(run('vehCap(e)'),108);
console.log('PASS additive bonuses, floor once, 200% cap all types, current train formation base, no speed NaN');
run('reset();closeModal();for(let c of S.cities)c.school={built:0};S.unlocked=["bus","emu","rail","air"];S.points=100000;startTransportResearch("bus_capacity");');assert.equal(run('researchState().active'),null);
run('for(let i=3;i<8;i++){let c=makeCity(650+i*40,800);c.school={built:0};S.cities.push(c);}updateTransportResearch();startTransportResearch("bus_capacity");');assert.equal(run('S.points'),94000);assert.equal(run('researchState().active.id'),'bus_capacity');
run('startTransportResearch("electric_bus");');assert.equal(run('S.points'),94000);
run('S.day=29.99;updateTransportResearch();');assert.equal(run('vehCap({type:"bus"})'),14);
run('S.day=30;updateTransportResearch();startTransportResearch("electric_bus");S.day=60;updateTransportResearch();');assert.equal(run('vehCap({type:"bus"})'),16);assert.equal(run('researchSpeedFactor("bus")'),1.15);assert.equal(run('S.points'),88000);
run('save();load();');assert.equal(run('vehCap({type:"bus"})'),16);assert.equal(run('researchSpeedFactor("bus")'),1.15);
run('showTransportResearch();');assert(nodes.get('modal-content').innerHTML.includes('200%'));assert(nodes.get('modal-content').innerHTML.includes('公交车厢布局'));
console.log('PASS 8-school gate, research cost/timing, one active, capacity+speed coexist and survive reload/UI');
/* 1.2.10 one-time construction notices (revision130) would open a sheet during the long ticks below; this test is about lifecycle, so they count as already seen. */
run('reset();closeModal();atlasMenuOpen=false;S.notices130={seen:{school:1,repair:1,weather:1,hub:1,bank:1,broker:1,farm:1},unread:{},queue:[]};S.day=50;S.paused=false;draft={type:"bus",stops:[0,1]};bridgeDraft={a:{x:0,y:0}};gesture={kind:"draft"};pointers.set(9,{x:1,y:2});');
const day=run('S.day'),cash=run('S.points');context.focused=false;toBackground();
assert.equal(run('S.paused'),true);assert.equal(run('interruptionPending()'),true);assert.equal(run('draft'),null);assert.equal(run('bridgeDraft'),null);assert.equal(run('pointers.size'),0);assert.equal(run('S.points'),cash);
let persisted=JSON.parse(storage.get('transit-atlas-map-east-v1'));assert.equal(persisted.paused,true);assert.equal(persisted.interruption.pending,true);
run('S.paused=false;tick(100000);');assert.equal(run('S.day'),day);assert.equal(run('S.paused'),true);
context.focused=true;fire('window','focus');assert.equal(run('S.paused'),true);assert.equal(run('S.day'),day);
nodes.get('pause').onclick();assert.equal(run('interruptionPending()'),false);assert.equal(run('S.paused'),false);
console.log('PASS blur pauses+saves, cancels unpaid draft, no background catchup, focus stays paused, explicit continue');
for(let type of ['pagehide','beforeunload']){run('S.paused=false');fire('window',type);assert.equal(run('S.paused'),true);assert.equal(JSON.parse(storage.get('transit-atlas-v1')).paused,true);}
context.document.hidden=true;context.document.visibilityState='hidden';fire('document','visibilitychange');assert.equal(run('resumeAfterInterruption()'),false);context.document.hidden=false;context.document.visibilityState='visible';fire('window','pageshow');assert.equal(run('S.paused'),true);
fire('document','freeze');fire('document','resume');assert.equal(run('S.paused'),true);
fire('document','keydown',{code:'Space',target:{tagName:'BODY'}});assert.equal(run('S.paused'),false);assert.equal(run('interruptionPending()'),false);
console.log('PASS lifecycle hidden/pagehide/freeze, no auto resume, Space continues exactly once');
run('S.financial={dailyReview:{day:1,wasRunning:true},marketPause:{wasRunning:true}};dailyReviewVisible=true;S.paused=false;');toBackground();run('closeModal();');assert.equal(run('S.paused'),true);assert.equal(run('interruptionPending()'),true);
run('S.agriculture={pending:{rows:[],wasRunning:true}};farmReviewVisible=true;S.paused=false;');toBackground();run('closeModal();');assert.equal(run('S.paused'),true);assert.equal(run('interruptionPending()'),true);assert.equal(run('S.agriculture.pending'),null);
run('save();load();');assert.equal(run('S.paused'),true);assert.equal(run('interruptionPending()'),true);
console.log('PASS market/farm modal close cannot undo interruption pause, save/reload retains resume lock');
/* v1.3 removed the long-frame interruption: a long gap advances one capped step and does not pause; the interruption below comes from going to the background. */run('reset();closeModal();atlasMenuOpen=false;S.notices130={seen:{school:1,repair:1,weather:1,hub:1,bank:1,broker:1,farm:1},unread:{},queue:[]};S.paused=false;last=100;frame(5000);');assert(run('S.day')<0.01);assert.equal(run('interruptionPending()'),false);toBackground();assert.equal(run('S.paused'),true);assert.equal(run('interruptionPending()'),true);
fire('document','keydown',{code:'Space',target:{tagName:'BUTTON'}});assert.equal(run('S.paused'),true);nodes.get('pause').onclick();assert.equal(run('S.paused'),false);
const workingSetItem=context.localStorage.setItem;context.localStorage.setItem=()=>{throw Error('quota');};toBackground();assert.equal(run('S.paused'),true);assert.equal(run('interruptionPending()'),true);assert(nodes.get('toast').textContent.includes('未能完成保存'));context.localStorage.setItem=workingSetItem;
console.log('PASS long-frame interruption, button Space avoids double toggle, storage failure retains pause and reports failure');
