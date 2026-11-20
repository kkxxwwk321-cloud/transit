'use strict';
// Capture genuine pre-boot saves before the older startup adapters create defaults.
const existingSave167=(()=>{try{return Array.from({length:localStorage.length},(_,i)=>localStorage.key(i)).some(k=>/^transit-atlas-(?:v1|city-beta|map-)/.test(k));}catch{return true;}})();
window.TRANSIT_PORTRAIT_LAYOUT=true;
document.documentElement.classList.add('portrait-shell');

// A failed initialization keeps the game hidden and exposes an explicit retry.
setTimeout(()=>{if(!document.documentElement.classList.contains('app-booting124'))return;let cover=document.getElementById('startup-cover124');if(cover)cover.innerHTML='<strong>交通线</strong><p>加载未完成，请重试。</p><button onclick="location.reload()">重新加载</button>';},8000);

// The native input layer keeps an unrotated camera; PR presentation uses these shared conversions.
function toScreen(p){return {x:view.x+p.x*view.scale,y:view.y+p.y*view.scale};}
function uprightAround(){}
