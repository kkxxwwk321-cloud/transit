const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createLinearGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
w.HTMLMediaElement.prototype.play=function(){return Promise.resolve()};w.HTMLMediaElement.prototype.pause=function(){};
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(['atlas167.js','atlas168.js'].includes(m[1]))continue;/* Historical map fixtures: new geometry is covered by atlas167.cjs. */vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}






run("atlasMenuOpen=true;atlasSelect('west',false);");
const rail=w.document.getElementById('atlas-rail');Object.defineProperty(rail,'clientWidth',{value:390});let scrolls=[];rail.scrollTo=o=>{scrolls.push(o);rail.scrollLeft=o.left;};
function pointer(type,x,y,id=1,extra={}){let e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{clientX:x,clientY:y,pointerId:id,button:0,isPrimary:true,...extra});rail.dispatchEvent(e);return e;}
let clicked=0;rail.addEventListener('click',()=>clicked++);
// Rightwards drag selects east; compatibility click cannot select the card back.
pointer('pointerdown',80,250);pointer('pointermove',220,253);pointer('pointerup',220,253);assert.equal(run('atlasSelected'),'east');let click=new w.MouseEvent('click',{bubbles:true,cancelable:true});rail.dispatchEvent(click);assert.equal(clicked,0);assert(click.defaultPrevented);
// Leftwards drag selects west, restoring snap styles after release.
pointer('pointerdown',260,250);pointer('pointermove',80,252);pointer('pointerup',80,252);assert.equal(run('atlasSelected'),'west');assert.equal(rail.style.scrollSnapType,'');
// A vertical read, a short accidental move and cancellation do not switch maps.
pointer('pointerdown',100,200);pointer('pointermove',103,270);pointer('pointerup',103,270);assert.equal(run('atlasSelected'),'west');
pointer('pointerdown',100,200);pointer('pointermove',110,200);pointer('pointerup',110,200);assert.equal(run('atlasSelected'),'west');
pointer('pointerdown',100,200);pointer('pointermove',230,200);pointer('pointercancel',230,200);assert.equal(run('atlasSelected'),'west');
// Native card click still works when there was no drag.
run('atlasSelect("east",false);');pointer('pointerdown',100,200);pointer('pointerup',100,200);assert.equal(run('atlasSelected'),'east');
assert.equal(scrolls.length,4);
function touch(type,x,y,id=7){const e=new w.Event(type,{bubbles:true,cancelable:true});const t={identifier:id,clientX:x,clientY:y};Object.assign(e,{touches:type==='touchend'||type==='touchcancel'?[]:[t],changedTouches:[t]});rail.dispatchEvent(e);return e;}
run('atlasSelect("west",false);');assert(touch('touchstart',80,220).defaultPrevented);touch('touchmove',240,245);touch('touchend',240,245);assert.equal(run('atlasSelected'),'east');
touch('touchstart',260,220);touch('touchmove',60,240);touch('touchend',60,240);assert.equal(run('atlasSelected'),'west');
// The browser's companion pointer-cancel must not discard an active TouchEvent drag.
touch('touchstart',80,220);touch('touchmove',240,230);pointer('pointercancel',240,230,7,{pointerType:'touch'});touch('touchend',240,230);assert.equal(run('atlasSelected'),'east');
touch('touchstart',240,220);touch('touchmove',80,220);touch('touchcancel',80,220);assert.equal(run('atlasSelected'),'east');
console.log('PASS bidirectional drag, snap cleanup, no swipe-click rebound, vertical/short/cancel safeguards');dom.window.close();
