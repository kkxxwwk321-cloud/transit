'use strict';
// A port is a marine endpoint. City nodes keep their normal road/rail behavior.
let harborPointer164=null;
// Badge geometry is separate from the physical dock used by ships.
let portLayoutMemo164=null;
function portBadges164(){
 if(!isOcean16())return [];
 const scale=Math.max(.15,view.scale),cities=realCities(),ports=cities.filter(c=>c.harbor&&!c.dormant);
 const key=[scale,...cities.flatMap(c=>[c.id,c.x,c.y,c.harbor?.x,c.harbor?.y])].join('|');
 if(portLayoutMemo164?.key===key&&portLayoutMemo164.owner===S)return portLayoutMemo164.items;
 let items=[];
 for(let c of ports){let base=Math.atan2(c.harbor.y-c.y,c.harbor.x-c.x),chosen=null,best=-Infinity;
  for(let extra of [0,22,44,70])for(let offset of [0,.3,-.3,.6,-.6,1,-1]){
   let d=Math.max(70/scale,Math.hypot(c.harbor.x-c.x,c.harbor.y-c.y)+24/scale)+extra/scale,angle=base+offset;
   let p={x:c.x+Math.cos(angle)*d,y:c.y+Math.sin(angle)*d};
   if(!sea16(p)||!seaSegment16(c.harbor,p))continue;
   let clearance=Math.min(...cities.map(o=>Math.hypot(o.x-p.x,o.y-p.y)*scale-28),...items.map(o=>Math.hypot(o.p.x-p.x,o.p.y-p.y)*scale-48));
   let score=Math.min(0,clearance)*10-extra-Math.abs(offset)*8;
   if(score>best){best=score;chosen=p;}
  }
  items.push({c,p:chosen||{...c.harbor}});
 }
 portLayoutMemo164={owner:S,key,items};return items;
}
function portHit164(p){let best=null;for(let item of portBadges164()){let d=Math.hypot(p.x-item.p.x,p.y-item.p.y)*view.scale;if(d<=25&&(!best||d<best.d))best={c:item.c,d};}return best?.c||null;}
function beginHarborRoute164(id,type=null){let c=S.cities[id];if(S.lives<=0||!c?.harbor||c.dormant||!isOcean16())return false;type=type||(isMarine16(uxLastType)&&S.unlocked.includes(uxLastType)?uxLastType:'ship');if(!isMarine16(type)||!S.unlocked.includes(type))return false;if(realCities().filter(c=>c.harbor&&!c.dormant).length<2){toast('至少需要两个已建港口的城市才能连接航线');return false;}beginDraft(type);uxLastType=type;draft.stops=[id];draftBar();$('drawtext').textContent=c.name+'港 → 拖到另一个港口圆点';return true;}
const cityHitBefore164=hitCity;
hitCity=function(p){if(isMarine16(draft?.type)||harborPointer164)return portHit164(p);if(draft&&portHit164(p))return null;return cityHitBefore164(p);};
const elasticBefore164=elasticTouch;
elasticTouch=function(p,previous){if(isMarine16(draft?.type)){let direct=portHit164(p);if(direct)return direct;if(!previous)return null;let hits=portBadges164().filter(o=>o.c.id!==gesture?.lastHover&&segDist(o.p,previous,p)*view.scale<25);hits.sort((a,b)=>Math.hypot(a.p.x-previous.x,a.p.y-previous.y)-Math.hypot(b.p.x-previous.x,b.p.y-previous.y));return hits[0]?.c||null;}if(portHit164(p))return null;return elasticBefore164(p,previous);};
const draftBefore164=beginDraft;
beginDraft=function(type,...a){let r=draftBefore164(type,...a);if(draft)draft.endpointMode164=isMarine16(draft.type)?'harbor':'city';return r;};
const setTypeBefore164=uxSetType;
uxSetType=function(t){if(draft?.stops.length&&isMarine16(t)!==isMarine16(draft.type))return toast('请先清空停靠点，再切换海运或陆地交通');let r=setTypeBefore164(t);if(draft)draft.endpointMode164=isMarine16(draft.type)?'harbor':'city';return r;};
const costBefore164=draftCost;
draftCost=function(){let r=costBefore164();if(draft?.endpointMode164&&((draft.endpointMode164==='harbor')!==isMarine16(draft.type)))r.invalid='港口只连接海运，城市节点连接陆地或航空';return r;};

const pointerDownBefore164=beginPointer;
beginPointer=function(e){if(pointers.size){harborPointer164=null;return pointerDownBefore164(e);}let c=!draft&&!bridgeDraft&&!modalOpen&&e.button!==2?portHit164(toWorld(e)):null;if(!c){let r=pointerDownBefore164(e);if(!draft&&gesture?.c){let options=S.lines.filter(l=>!l.retiring&&!isMarine16(l.type)&&l.stops.includes(gesture.c.id)),preferred=selected?.id;gesture.cityLine=options.find(l=>l.id===preferred)||(options.length===1?options[0]:null);gesture.ambiguousLines=options.length>1?options:null;}return r;}e.preventDefault?.();hideJunction();cv.setPointerCapture?.(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});harborPointer164={id:e.pointerId,city:c.id,line:harborEditLine164(c)?.id??null,x:e.clientX,y:e.clientY};gesture={kind:'harbor-pending164',start:{x:e.clientX,y:e.clientY},p:toWorld(e),c,moved:false};};
const pointerMoveBefore164=movePointer;
movePointer=function(e){let h=harborPointer164;if(h&&(!pointers.has(h.id)||gesture?.kind!=='harbor-pending164')){harborPointer164=null;h=null;}if(h&&h.id===e.pointerId){if(Math.hypot(e.clientX-h.x,e.clientY-h.y)<12)return;harborPointer164=null;let edit=h.line&&S.lines.find(l=>l.id===h.line);if(edit){beginDraft(edit.type,edit.id);let c=S.cities[h.city];gesture={kind:'city-edit',start:{x:h.x,y:h.y},p:{x:c.x,y:c.y},c,moved:true,createdDraft:true,hadDraft:false,draftStops:[...edit.stops],baseStops:[...edit.stops],cityIndex:edit.stops.indexOf(c.id)};return pointerMoveBefore164(e);}if(!beginHarborRoute164(h.city)){pointers.clear();gesture=null;return;}let c=S.cities[h.city];gesture={kind:'draft',start:{x:h.x,y:h.y},p:{x:c.x,y:c.y},c,moved:true,createdDraft:true,hadDraft:false,draftStops:[]};}if(!draft&&gesture?.kind==='tap'&&gesture.c&&!gesture.cityLine&&!gesture.ambiguousLines&&Math.hypot(e.clientX-gesture.start.x,e.clientY-gesture.start.y)>14){let type=S.unlocked.find(t=>!isMarine16(t)&&uxFreeSlots(t)>0);if(type){beginDraft(type);draft.stops=[gesture.c.id];gesture.kind='draft';gesture.createdDraft=true;}else{gesture.kind='none';return toast('陆地线路名额已满，请从港口圆点连接海运');}}return pointerMoveBefore164(e);};
const pointerUpBefore164=finishPointer;
finishPointer=function(e){let h=harborPointer164;if(h&&h.id===e.pointerId){harborPointer164=null;pointers.delete(e.pointerId);gesture=null;try{cv.releasePointerCapture?.(e.pointerId);}catch{}if(e.type==='pointerup'){selected={type:'city',id:h.city};showDetails();}return;}return pointerUpBefore164(e);};
const cancelBefore164=cancelDraft;
cancelDraft=function(...a){harborPointer164=null;return cancelBefore164(...a);};
const portDetailsBefore164=showDetails;
showDetails=function(...a){let r=portDetailsBefore164(...a);if(selected?.type==='city'&&isOcean16()){let c=S.cities[selected.id],el=$('details');if(c?.harbor&&!c.dormant&&!el.querySelector('.harbor-connect164')){let b=document.createElement('button');b.className='harbor-connect164';b.textContent='⚓ 新建海运航线';b.onclick=()=>beginHarborRoute164(c.id);el.append(b);}}return r;};
const drawPortsBefore164=drawCityEconomy;
drawCityEconomy=function(){drawPortsBefore164();if(!isOcean16())return;let scale=Math.max(.15,view.scale);for(let {c,p}of portBadges164()){
 ctx.save();ctx.strokeStyle='#567f8b';ctx.lineWidth=1.2/scale;ctx.setLineDash([3/scale,4/scale]);ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(c.harbor.x,c.harbor.y);ctx.lineTo(p.x,p.y);ctx.stroke();ctx.setLineDash([]);
 ctx.fillStyle='#fff9e8';ctx.beginPath();ctx.arc(c.harbor.x,c.harbor.y,3/scale,0,Math.PI*2);ctx.fill();
 // Shrink the visible badge and anchor together; keep the 50px touch target.
 ctx.translate(p.x,p.y);ctx.scale(.8,.8);ctx.translate(-p.x,-p.y);
 ctx.fillStyle='#286c83';ctx.strokeStyle='#fff9e8';ctx.lineWidth=3/scale;ctx.beginPath();ctx.arc(p.x,p.y,19/scale,0,Math.PI*2);ctx.fill();ctx.stroke();
 ctx.strokeStyle='#fff9e8';ctx.lineWidth=1.7/scale;ctx.beginPath();ctx.arc(p.x,p.y-7/scale,2.5/scale,0,Math.PI*2);ctx.moveTo(p.x,p.y-4/scale);ctx.lineTo(p.x,p.y+10/scale);ctx.moveTo(p.x-6/scale,p.y-1/scale);ctx.lineTo(p.x+6/scale,p.y-1/scale);ctx.moveTo(p.x-10/scale,p.y+3/scale);ctx.quadraticCurveTo(p.x-10/scale,p.y+10/scale,p.x,p.y+10/scale);ctx.quadraticCurveTo(p.x+10/scale,p.y+10/scale,p.x+10/scale,p.y+3/scale);ctx.stroke();
 if(draft?.stops.includes(c.id)||harborPointer164?.city===c.id){ctx.strokeStyle='#edc16f';ctx.lineWidth=2/scale;ctx.beginPath();ctx.arc(p.x,p.y,24/scale,0,Math.PI*2);ctx.stroke();}ctx.restore();}};
const distanceBefore164=displayLineDistance;
displayLineDistance=function(p,a,b,l){if(!isMarine16(l?.type))return distanceBefore164(p,a,b,l);let path=displaySeaPath163(a,b);if(!path)return Infinity;let d=Infinity;for(let i=1;i<path.points.length;i++)d=Math.min(d,segDist(p,path.points[i-1],path.points[i]));return d;};
// Preserve each verified sea-path vertex when drawing. Sampling can cut across a headland corner.
const seaStrokeBefore164=strokeLaneRange;
strokeLaneRange=function(a,b,l,lo=0,hi=1){if(!isMarine16(l?.type))return seaStrokeBefore164(a,b,l,lo,hi);ctx.beginPath();let path=displaySeaPath163(a,b);if(!path)return;lo=Math.max(0,Math.min(1,lo));hi=Math.max(lo,Math.min(1,hi));let p=pathPoint16(path,lo),distance=0;ctx.moveTo(p.x,p.y);for(let i=1;i<path.points.length;i++){let x=path.points[i-1],y=path.points[i];distance+=Math.hypot(y.x-x.x,y.y-x.y);if(distance>lo*path.length&&distance<hi*path.length)ctx.lineTo(y.x,y.y);}let q=pathPoint16(path,hi);ctx.lineTo(q.x,q.y);};
const transportIconBefore164=transportIcon;
transportIcon=function(t){if(!isMarine16(t))return transportIconBefore164(t);return '<svg viewBox="0 0 64 48" class="transport-icon" aria-hidden="true"><path d="M5 28h54L49 40H16Z" fill="currentColor"/><path d="M17 13h28v15H17Z" fill="currentColor"/><path d="M22 18h6v5h-6zm12 0h6v5h-6z" fill="white"/><path d="M30 5h4v8h-4Z" fill="currentColor"/>'+ (t==='ferry'?'<path d="M12 25h39v3H12Z" fill="currentColor"/>':'')+'<path d="M5 44q7-5 14 0t14 0t14 0t14 0" fill="none" stroke="currentColor" stroke-width="2"/></svg>';};
const unlockBefore164=unlockText;
unlockText=function(t){return t==='ferry'?'与飞机同步开放：第120天＋送达600人':t==='ship'?'双洋大陆开放':unlockBefore164(t);};
const fleetSheetBefore164=uxLineSheet;
uxLineSheet=function(...a){let r=fleetSheetBefore164(...a),l=selected?.type==='line'?S.lines.find(x=>x.id===selected.id):null;if(!l||!isMarine16(l.type))return r;let el=$('details'),fleet=el.querySelector('.ux-fleet'),inv=S.inventory[l.type]||0;if(fleet){fleet.querySelector('div>small').textContent='船舶';let unit=fleet.querySelector('div>b>span');if(unit)unit.textContent=' 艘';let plus=fleet.querySelector('.ux-stepper .primary'),minus=fleet.querySelector('.ux-stepper button');if(plus){plus.textContent=inv?'＋ 投入1艘 · 库存 '+inv:'＋ 买入并投入 ¥'+TYPES[l.type].vehicle;plus.setAttribute('aria-label','增加一艘'+TYPES[l.type].name);}if(minus)minus.setAttribute('aria-label','回收一艘船');}for(let b of el.querySelectorAll('button[onclick]'))if((b.getAttribute('onclick')||'').startsWith('openInfrastructure('))b.remove();if(!el.querySelector('.marine-fleet-help164')){let p=document.createElement('p');p.className='marine-fleet-help164';p.textContent='本航线可加入多艘'+TYPES[l.type].name+'。优先使用库存；没有库存时，按原价买入并投入。航线与航行免费，船舶逐艘运行。';el.querySelector('.ux-fleet')?.after(p);}return r;};

// Marine endpoints are the port badges; never show road-style plus handles at city nodes.
const handlesBefore164=uxHandles;
uxHandles=function(){return handlesBefore164().filter(h=>!isMarine16(h.line.type));};
UX_TYPE_CHAR.ship='船';UX_TYPE_CHAR.ferry='渡';
const previewBefore164=drawTerrainPreview;
drawTerrainPreview=function(...a){if(isMarine16(draft?.type))return;return previewBefore164(...a);};
// Reproject old physical docks if the softened shoreline has covered them.
// Existing city positions, port ownership, vessels and routes remain intact.
function repairSavedPorts162(){if(!isOcean16())return false;let changed=false;for(let c of realCities()){if(!c.harbor||sea16(c.harbor))continue;let shore=shore16(c),len=Math.hypot(shore.dx,shore.dy)||1,point=null;for(let distance of [35,60,100]){point=[1,-1].map(sign=>({x:shore.x-sign*shore.dy/len*distance,y:shore.y+sign*shore.dx/len*distance})).find(sea16);if(point)break;}if(point){c.harbor={...c.harbor,...point};changed=true;}}if(changed){clearMarinePaths16();portLayoutMemo164=null;invalidateRouteDrawing161();}return changed;}
const loadPortsBefore162=load;
load=function(...a){let r=loadPortsBefore162(...a);if(r&&repairSavedPorts162())save();return r;};
if(repairSavedPorts162())save();

// Ports remain attachments of their owning city. Display endpoints use the same
// badge positions as touch targets; navigation/economy keep physical dock geometry.
let displaySeaMemo163={owner:null,scale:null,paths:new Map()};
function displaySeaPath163(a,b){
 if(!a?.harbor||!b?.harbor)return null;
 if(displaySeaMemo163.owner!==S||displaySeaMemo163.scale!==view.scale)displaySeaMemo163={owner:S,scale:view.scale,paths:new Map()};
 let badges=portBadges164(),from=badges.find(o=>o.c===a)?.p||a.harbor,to=badges.find(o=>o.c===b)?.p||b.harbor;
 let key=[a.id,b.id,from.x,from.y,to.x,to.y].join('|');if(displaySeaMemo163.paths.has(key))return displaySeaMemo163.paths.get(key);
 let aa={id:a.id,harbor:from},bb={id:b.id,harbor:to},lo=aa.id>bb.id?bb:aa,hi=aa.id>bb.id?aa:bb,k=[lo.id,hi.id,lo.harbor.x,lo.harbor.y,hi.harbor.x,hi.harbor.y].join('|'),existed=seaPaths16.has(k),path=oceanPath16(aa,bb);
 if(!existed)seaPaths16.delete(k);
 if(displaySeaMemo163.paths.size>=256)displaySeaMemo163.paths.clear();displaySeaMemo163.paths.set(key,path);return path;
}
const displayLaneBefore163=lanePoint;
lanePoint=function(a,b,l,t){if(!isMarine16(l?.type))return displayLaneBefore163(a,b,l,t);return pathPoint16(displaySeaPath163(a,b),t)||displayLaneBefore163(a,b,l,t);};
const sharedPortDetailsBefore163=showDetails;
showDetails=function(...args){let r=sharedPortDetailsBefore163(...args),c=selected&&['city','stop'].includes(selected.type)?S.cities[selected.id]:null,el=$('details');if(c?.harbor&&!el.querySelector('.harbor-shared163')){let p=document.createElement('p');p.className='detail-sub harbor-shared163';p.textContent='⚓ 本城港口 · 与城市共用旅客、候车容量和任务，海陆换乘使用同一候车队列。';el.querySelector('h3')?.after(p);}return r;};
const sharedPortDrawBefore163=drawCityEconomy;
drawCityEconomy=function(...a){let r=sharedPortDrawBefore163(...a);if(!isOcean16())return r;let scale=Math.max(.15,view.scale);for(let {c,p}of portBadges164()){ctx.save();ctx.translate(p.x,p.y);ctx.scale(1/scale,1/scale);roundBody(-36,22,72,18,7,'#fffdf3','#b9d1cf',1);text('本城 '+c.q.length+'/'+capacity(c),0,34,10,'#315b68');ctx.restore();}return r;};

// A port on the sole marine route can extend that route without creating a new line.
function harborEditLine164(c){let lines=S.lines.filter(l=>!l.retiring&&isMarine16(l.type)&&l.stops.includes(c.id)),chosen=selected?.type==='line'?lines.find(l=>l.id===selected.id):null;return chosen||((selected?.type!=='line'&&lines.length===1&&[lines[0].stops[0],lines[0].stops.at(-1)].includes(c.id))?lines[0]:null);}
const snapBefore164=addDraftCity;
addDraftCity=function(c,...a){if(isMarine16(draft?.type)){if(!c?.harbor||c.dormant)return;return snapBefore164(c,true);}return snapBefore164(c,...a);};
