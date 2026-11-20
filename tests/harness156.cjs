module.exports = function createGame(options={}) {
const {JSDOM,VirtualConsole}=require('jsdom');const vm=require('vm'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict');const root=path.resolve(__dirname,'../dist');let html=fs.readFileSync(root+'/index.html','utf8');let errors=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!e.message.includes('CSS stylesheet'))errors.push(e.message)});const dom=new JSDOM(html,{url:'https://localhost/',runScripts:'outside-only',pretendToBeVisual:true,virtualConsole:vc});const w=dom.window,c=dom.getInternalVMContext();w.console={...console,error:()=>{}};w.innerWidth=390;w.innerHeight=844;w.confirm=()=>{throw Error('native confirm forbidden')};const timers=[];w.setTimeout=(f,ms)=>{timers.push({f,ms});return timers.length};w.clearTimeout=()=>{};w.setInterval=()=>0;const raf13=new Map();let rafId13=0;w.requestAnimationFrame=fn=>{let id=++rafId13;raf13.set(id,fn);return id};w.cancelAnimationFrame=id=>raf13.delete(id);w.ResizeObserver=undefined;let observerBatches13=0;const NativeObserver13=w.MutationObserver;w.MutationObserver=class extends NativeObserver13{constructor(fn){super((records,observer)=>{if(++observerBatches13>1000)throw Error('observer feedback loop');fn(records,observer);});}};w.HTMLCanvasElement.prototype.getContext=function(){return new Proxy({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4),width:w,height:h}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}}),measureText:t=>({width:String(t).length*7})},{get:(o,k)=>o[k]||(()=>{})});};w.HTMLElement.prototype.setPointerCapture=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};Object.defineProperty(w.HTMLElement.prototype,'offsetParent',{get(){return this.hidden?null:w.document.body}});w.HTMLElement.prototype.getBoundingClientRect=function(){let top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?775:400;return {left:10,right:380,top,bottom:top+60,width:370,height:60,x:10,y:top}};
let hidden=false,plays=0,pauses=0,rejected=false;
Object.defineProperty(w.document,'hidden',{get:()=>hidden});
Object.defineProperty(w.document,'visibilityState',{get:()=>hidden?'hidden':'visible'});
for(const [key,value]of Object.entries(options.saves||{}))w.localStorage.setItem(key,value);
if(options.prefs)w.localStorage.setItem('transit-effects-v1',JSON.stringify(options.prefs));
if(options.blockStorage){w.Storage.prototype.getItem=function(){throw Error('unavailable')};w.Storage.prototype.setItem=function(){throw Error('unavailable')};}
w.HTMLMediaElement.prototype.play=function(){plays++;return rejected?Promise.reject(Error('blocked')):Promise.resolve()};
w.HTMLMediaElement.prototype.pause=function(){pauses++};

// Historical suites explicitly request the frozen 1.6.6 terrain adapter.
for(const m of html.matchAll(/<script src="([^"?]+)[^"]*"/g)){if(options.legacyTerrain166&&['atlas167.js','atlas168.js'].includes(m[1])||options.legacyTerrain167&&m[1]==='atlas168.js')continue;vm.runInContext(fs.readFileSync(root+'/'+m[1],'utf8'),c,{filename:m[1]});}
const run=s=>vm.runInContext(s,c);run('uxLate();');
for(const m of html.matchAll(/<link[^>]*href="([^"?]+)[^"]*"/g)){let p=root+'/'+m[1];if(fs.existsSync(p)&&m[1].endsWith('.css')){let st=w.document.createElement('style');st.textContent=fs.readFileSync(p,'utf8');w.document.head.append(st)}}








return {dom,w,run,errors,timers,raf13,get plays(){return plays},get pauses(){return pauses},setHidden(value){hidden=value;w.document.dispatchEvent(new w.Event('visibilitychange'))},setRejected(value){rejected=value}};
};
