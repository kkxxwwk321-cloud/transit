'use strict';
// Keep quote and commit validation identical, including automatically inserted bridgeheads.
const costBefore1614=draftCost;
draftCost=function(){const q=costBefore1614();if(draft)q.invalid=routeRepeatIssue13(draft.stops,draft.type)||routeRepeatIssue13(q.resolved||draft.stops,draft.type)||q.invalid;return q;};

// Exhaust the normal search first. Widen its ring only when the full eight-city plan failed.
const seedBefore1614=findSeed;
findSeed=function(first=false){
 const normal=seedBefore1614(first);if(normal||mapSpec.id!=='east')return normal;
 const cs=realCities().filter(c=>!c.removed),rs=cityRegions();
 for(const band of [{near:850,center:950},{near:1000,center:1100}]){
  const candidates=growthAvailable.map(p=>({p,near:Math.min(...cs.map(c=>Math.hypot(c.x-p.x,c.y-p.y)))})).filter(({p,near})=>near>=350&&near<=band.near&&!reservedForOther(p,-1)&&(first?rs.some(r=>{const d=Math.hypot(p.x-r.x,p.y-r.y);return d>=500&&d<=band.center;}):rs.every(r=>Math.hypot(p.x-r.x,p.y-r.y)>=800))).sort((a,b)=>a.near-b.near);
  for(const {p}of candidates){
   const accessible=cs.some(c=>{if(Math.hypot(c.x-p.x,c.y-p.y)>band.near)return false;const q=requirements(c,p,'bus');return !q.invalid&&q.bridge<=1&&q.tunnel<=1;});
   if(!accessible)continue;const plan=previewSeedCluster(p);if(plan){pendingSeedPlan=plan;return p;}
  }
 }
 return null;
};

// Phase describes a vehicle's place in its complete service cycle, in seconds.
// Timings are shared for one game second; vehicle positions and road admission stay live.
let fleetOwner1614=null,fleetDay1614=null,fleetTimings1614=new Map();
function fleetServiceKey1614(v,l){const r=serviceRange(v,l);return JSON.stringify([l.id,l.type,l.stops,r.lo,r.hi,v.service?.mode==='express'?[...(v.service.skip||[])].sort((a,b)=>a-b):[],fullLoop130(v,l)?v.dir:0]);}
function fleetTiming1614(v,l){
 const second=Math.floor(S.day*12);if(fleetOwner1614!==S||fleetDay1614!==second){fleetOwner1614=S;fleetDay1614=second;fleetTimings1614.clear();}
 const key=fleetServiceKey1614(v,l);if(fleetTimings1614.has(key))return fleetTimings1614.get(key);
 const {lo,hi}=serviceRange(v,l),entries=[],loop=fullLoop130(v,l);let period=0;
 const add=(i,dir)=>{const travel=serviceTravelTime(v,l,i,dir);if(!Number.isFinite(travel)||travel<=0)return;entries.push({index:i,dir,at:period,travel});const stop=serves(v,l,i+dir)?(isMarine16(v.type)?.15:l.type==='air'?4:isTrain(l.type)?1.7:1):0;period+=travel+stop;};
 if(!loop||v.dir>0)for(let i=lo;i<hi;i++)add(i,1);
 if(!loop||v.dir<0)for(let i=hi;i>lo;i--)add(i,-1);
 const result={key,entries,period};fleetTimings1614.set(key,result);return result;
}
function fleetPhase1614(v,timing){
 const e=timing.entries.find(e=>e.index===v.index&&e.dir===v.dir);if(!e||!timing.period)return null;
 return ((e.at+Math.max(0,Math.min(1,v.t||0))*e.travel-Math.max(0,v.dwell||0))%timing.period+timing.period)%timing.period;
}
function fleetMates1614(v,l,timing){return S.vehicles.filter(q=>q.line===l.id&&!q.retired&&!q.recall&&!q.stops&&!q.pendingService&&fleetServiceKey1614(q,l)===timing.key);}
function fleetCanDepart1614(v,l){
 if(v.recall||v.stops||v.pendingService||l.retiring)return true;
 const timing=fleetTiming1614(v,l),phase=fleetPhase1614(v,timing);if(phase===null)return true;
 // Damaged lines can turn back inside disconnected components; suspend cycle spacing there.
 if(timing.entries.some(e=>!canEnter(S.cities[l.stops[e.index]],S.cities[l.stops[e.index+e.dir]],l.type)))return true;
 const mates=fleetMates1614(v,l,timing);if(mates.length<2)return true;
 const gap=Math.min(18,timing.period/mates.length*.55);if(gap<.25)return true;
 return !mates.some(q=>{if(q===v)return false;const other=fleetPhase1614(q,timing);if(other===null)return false;const ahead=(other-phase+timing.period)%timing.period;return ahead<gap&&(ahead>1e-6||q.id<v.id);});
}
function placeNewVehicle1614(v,l){
 const timing=fleetTiming1614(v,l);if(!timing.period)return;
 const positions=fleetMates1614(v,l,timing).filter(q=>q!==v).map(q=>fleetPhase1614(q,timing)).filter(p=>p!==null);if(!positions.length)return;
 let best=null;for(const e of timing.entries){if(!serves(v,l,e.index))continue;const distance=Math.min(...positions.map(p=>{const d=Math.abs(e.at-p);return Math.min(d,timing.period-d);}));if(!best||distance>best.distance)best={...e,distance};}
 if(best){v.index=best.index;v.dir=best.dir;v.t=0;v.dwell=0;}
}
// Boarding at arrival alone misses passengers who become ready during the station dwell.
function boardAtDeparture1614(v,l){
 if(v.recall||v.pendingService||v.stops||l.retiring||!serves(v,l,v.index))return;
 const city=S.cities[l.stops[v.index]],next=departureIndex({...v},l);if(!city||city.dormant||next<0)return;
 const previous=routingBatch;routingBatch={routes:new Map(),travel:new Map()};
 try{city.q.sort((a,b)=>b.wait-a.wait);const remain=[];for(const p of city.q){if(p.ready>0||v.people.length>=vehCap(v)){remain.push(p);continue;}const planForVehicle=plan(city.id,p,{boarding:v});if(planForVehicle?.line===l.id&&planForVehicle.next===l.stops[next]&&planForVehicle.vehicleIds.includes(v.id)){v.people.push(p);v.hasTransported=true;if(p.achRidden14!=null&&p.achRidden14!==l.id&&p.achBoard14!==l.id)achRun14().transfers++;p.achBoard14=l.id;}else remain.push(p);}city.q=remain;}finally{routingBatch=previous;}
}
function prepareDeparture1614(v,l){
 if(v.t>0||!serves(v,l,v.index)){delete v.dispatchHold1614;return true;}
 if(!fleetCanDepart1614(v,l)){v.dispatchHold1614=true;return false;}
 delete v.dispatchHold1614;if(!isMarine16(v.type))boardAtDeparture1614(v,l);return true;
}
