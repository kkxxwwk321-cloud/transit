'use strict';
// A ride edge includes every downstream stop: no fictitious transfer at each city.
// Graph and plans live for one arrival only, so edits and closures cannot leave stale routes.
function transportExactWeb(p){return p.schoolId!==undefined||p.eventId!=null||p.cardId!=null||!!p.fixedDestination;}
const transportMatchWeb=matchesDestination;
matchesDestination=function(c,p){
 if(!c||c.removed||c.dormant||c.kind==='bridgehead'||c.id===p.origin)return false;
 return transportExactWeb(p)?c.id===p.dest:transportMatchWeb(c,p);
};
function transportRidesWeb(u,context){
 if(context.adj.has(u))return context.adj.get(u);
 let edges=[],city=S.cities[u];if(!city||city.removed||city.dormant)return edges;
 for(let l of S.lines){
  if(l.retiring||l.type==='air'&&weatherFactor(city,'air')===0)continue;
  let vehicles=S.vehicles.filter(v=>v.line===l.id&&!v.retired&&!v.recall&&!v.stops);
  let groups=new Map();
  for(let v of vehicles){let sig=JSON.stringify([serviceRange(v,l).lo,serviceRange(v,l).hi,[...(v.service?.mode==='express'?v.service.skip||[]:[])].sort((a,b)=>a-b),fullLoop130(v,l)?v.dir:0]);if(!groups.has(sig))groups.set(sig,[]);groups.get(sig).push(v);}
  for(let vs of groups.values()){
   let v=vs[0],{lo,hi}=serviceRange(v,l),loop=fullLoop130(v,l),period=0;
   for(let j=lo;j<hi;j++){let t=serviceTravelTime(v,l,j,1);period+=Number.isFinite(t)?t+1:25;}
   let wait=Math.min(25,period*(loop?1:2)/Math.max(1,vs.length)/2);
   for(let idx=lo;idx<=hi;idx++){
    if(l.stops[idx]!==u||loop&&idx===hi||!serves(v,l,idx))continue;
    let eligible=vs.filter(q=>sameComponent(q,l,idx));if(!eligible.length)continue;
    for(let dir of loop?[v.dir]:[-1,1]){
     let cur=idx,travel=0,firstNext=null;
     for(let step=0;step<hi-lo;step++){
      let from=cur;if(loop&&dir>0&&from===hi)from=lo;if(loop&&dir<0&&from===lo)from=hi;
      let next=from+dir;if(next<lo||next>hi)break;
      let a=S.cities[l.stops[from]],b=S.cities[l.stops[next]];
      if(!a||!b||a.removed||b.removed||!canEnter(a,b,l.type))break;
      let t=serviceTravelTime(v,l,from,dir);if(!Number.isFinite(t))break;
      travel+=t;firstNext??=b.id;
      if(serves(v,l,next)&&!b.dormant){
       edges.push({to:b.id,travel,wait,transfer:TYPES[l.type].transfer*(city.hub?.7:1),first:{line:l.id,next:firstNext,dir,alight:b.id,vehicleIds:eligible.map(q=>q.id)}});
       travel+=l.type==='air'?4:isTrain(l.type)?1.7:1;
      }
      cur=next;
     }
    }
   }
  }
 }
 context.adj.set(u,edges);return edges;
}
plan=function(start,p,options={}){
 let boarding=options.boarding||null,onboard=options.onboard||null,exact=transportExactWeb(p),key=JSON.stringify([start,p.origin,exact,exact?p.dest:null,p.color,p.shape,p.destRegion??null,onboard?.id??null,onboard?.dir??null,boarding?.id??null,boarding?.dir??null]);
 if(routingBatch?.routes.has(key))return routingBatch.routes.get(key);
 let context=routingBatch?(routingBatch.transportWeb??={adj:new Map()}):{adj:new Map()};
 let n=S.cities.length,dist=Array(n).fill(Infinity),rides=Array(n).fill(Infinity),first=Array(n).fill(null),done=new Set(),result=null;dist[start]=0;rides[start]=0;
 for(let turn=0;turn<n;turn++){
  let u=-1;for(let i=0;i<n;i++)if(!done.has(i)&&(u<0||dist[i]<dist[u]||dist[i]===dist[u]&&rides[i]<rides[u]))u=i;
  if(u<0||!Number.isFinite(dist[u]))break;done.add(u);
  if(u!==start&&matchesDestination(S.cities[u],p)){result={...first[u],target:u,time:dist[u],rides:rides[u]};break;}
  for(let e of transportRidesWeb(u,context)){
   if(u===start&&boarding&&!(e.first.line===boarding.line&&e.first.dir===boarding.dir&&e.first.vehicleIds.includes(boarding.id)))continue;
   let stay=u===start&&onboard&&e.first.line===onboard.line&&e.first.dir===onboard.dir&&e.first.vehicleIds.includes(onboard.id);
   let nd=dist[u]+e.travel+(stay?0:((u===start&&boarding)?0:e.wait)+e.transfer),nr=rides[u]+(stay?0:1);
   if(nd<dist[e.to]-1e-6||Math.abs(nd-dist[e.to])<=1e-6&&nr<rides[e.to]){dist[e.to]=nd;rides[e.to]=nr;first[e.to]=first[u]||e.first;}
  }
 }
 if(routingBatch)routingBatch.routes.set(key,result);return result;
};
// Break rewards into readable items without changing amounts or accepting an offer.
const cardMarkupBeforeTransportWeb=cardMarkup128;
cardMarkup128=function(...args){let t=document.createElement('template');t.innerHTML=cardMarkupBeforeTransportWeb(...args);let p=t.content.querySelector('.card-reward p');if(p){let parts=p.textContent.split(/\s*·\s*/);p.replaceChildren(...parts.map(text=>{let line=document.createElement('span');line.className='reward-line-web';line.textContent=text;return line;}));}return t.innerHTML;};
