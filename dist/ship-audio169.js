'use strict';
// One quiet horn for the whole fleet, timed in active real seconds, not game days.
let shipHorn169=null,shipHornOwner169=null,shipHornAt169=null,shipHornWait169=0;
function shipHornEligible169(){
 if(!S||S.mapId!=='ocean'||S.paused||S.lives<=0||atlasMenuOpen||modalOpen||!cardSoundAllowed1511())return false;
 return S.vehicles.some(v=>isMarine16(v.type)&&!v.parked&&!v.dock16&&!v.dwell&&v.t>0&&S.lines.some(l=>l.id===v.line&&!l.retiring&&l.stops.every(id=>S.cities[id]?.harbor)));
}
function stopShipHorn169(){try{shipHorn169?.pause();}catch(_){} }
function updateShipHorn169(now=performance.now()){
 if(shipHornOwner169!==S){stopShipHorn169();shipHornOwner169=S;shipHornAt169=null;shipHornWait169=60000+Math.random()*30000;}
 if(!shipHornEligible169()){shipHornAt169=null;stopShipHorn169();return;}
 if(shipHornAt169===null){shipHornAt169=now;return;}
 const dt=Math.max(0,Math.min(2000,now-shipHornAt169));shipHornAt169=now;shipHornWait169-=dt;
 if(shipHornWait169>0)return;
 shipHornWait169=90000+Math.random()*90000;
 try{
  if(!shipHorn169){shipHorn169=new Audio('audio/ship-horn.wav');shipHorn169.preload='none';shipHorn169.hidden=true;shipHorn169.id='ship-horn169';document.body.appendChild(shipHorn169);}
  shipHorn169.currentTime=0;shipHorn169.volume=effectsPrefs156.volume*.32;
  const owner=S;Promise.resolve(shipHorn169.play()).then(()=>{if(owner!==S||!shipHornEligible169())stopShipHorn169();}).catch(()=>{});
 }catch(_){}
}
setInterval(()=>updateShipHorn169(),1000);
const stopEffectsBefore169=stopEffect156;
stopEffect156=function(){stopEffectsBefore169();stopShipHorn169();};
const uiShipBefore169=updateUI;
updateUI=function(...args){const result=uiShipBefore169(...args);if(!shipHornEligible169()){shipHornAt169=null;stopShipHorn169();}return result;};
document.addEventListener('visibilitychange',()=>{shipHornAt169=null;stopShipHorn169();});
window.addEventListener('pagehide',()=>{shipHornAt169=null;stopShipHorn169();});
