'use strict';
// 1.2.3: portrait interaction and guided first journey. Simulation balancing is otherwise unchanged.
let quoteExpanded123=false,bridgeTouch123=new Map(),bridgeBeforeTouch123=null,bridgePinch123=null,exitWasPaused123=true;
const baseOpen123=openModal,baseClose123=closeModal;
function measureModal123(){let r=$('modal-content').getBoundingClientRect();setPortraitCss('--panel-top',Math.max(0,Math.round(r.top))+'px');}
openModal=function(html){baseOpen123(html);S.paused=true;measureModal123();requestAnimationFrame(measureModal123);};
closeModal=function(){baseClose123();tutorialUI123();};
if(typeof ResizeObserver!=='undefined')new ResizeObserver(measureModal123).observe($('modal-content'));
const styleLine123=lineStyle;
lineStyle=function(l,alpha=1){styleLine123(l,l.retiring?Math.min(.28,alpha):alpha);if(l.retiring)ctx.setLineDash([9,8]);};
const quoteBar123=draftBar;
const quoteExpand123=document.createElement('button');quoteExpand123.id='quote-expand';quoteExpand123.onclick=()=>{quoteExpanded123=!quoteExpanded123;draftBar();};$('drawdone').parentElement?.prepend(quoteExpand123);
draftBar=function(){quoteBar123();let bar=$('drawbar'),compact=!!draft&&S.quoteSeen123&&!quoteExpanded123&&!draftCost().invalid&&draftCost().cash<=S.points;bar.classList.toggle('quote-compact',compact);quoteExpand123.hidden=!draft;quoteExpand123.textContent=draft?(TYPES[draft.type].name+' · '+draft.stops.filter(id=>S.cities[id]?.kind!=='bridgehead').length+'站 '+(compact?'⌄ 展开':'⌃ 收起')):'';};
const beginDraft123=beginDraft;
beginDraft=function(...args){quoteExpanded123=false;lastSnap123=null;return beginDraft123(...args);};
const commit123=commitDraft;
commitDraft=function(...args){let before=draft,stops=before?.stops.filter(id=>S.cities[id]?.kind!=='bridgehead'),cost=before&&draftCost();if(before&&tutorialStage123()==='connect'&&cost&&!cost.invalid)tutorialFunds123(cost.cash,'接通第四城');commit123(...args);if(before&&!draft){S.quoteSeen123=true;if(before.stopRemoval&&tutorialStage123()==='remove-stop')tutorialSet123('delete');if(['build','rebuild'].includes(tutorialStage123())&&stops?.length>=3){S.tutorial123.line=S.lines.at(-1).id;tutorialSet123(tutorialStage123()==='build'?'remove-stop':'wait');}else if(tutorialStage123()==='connect'&&stops?.includes(S.tutorial123.city))tutorialSet123('fog');save();}};
// Larger screen-space targets with nearest-target selection; no mutations from pointer-down.
const cityHit123=hitCity;
hitCity=function(p){let candidates=S.cities.filter(c=>!c.removed).map(c=>({c,d:Math.hypot(p.x-c.x,p.y-c.y)*view.scale})).filter(x=>x.d<=Math.max(20,radius(x.c)*view.scale+5)).sort((a,b)=>a.d-b.d);return candidates[0]?.c||cityHit123(p);};
const addCityDraft123=addDraftCity;let lastSnap123=null;
addDraftCity=function(c,force=false){if(!gesture||gesture.kind==='pinch')return;if(gesture.kind==='draft-pending')return;let p=gesture.start;if(p&&gesture.moved!==true)return;if(!force&&draft?.stops.at(-1)!==c.id){let now=performance.now();if(!lastSnap123||lastSnap123.id!==c.id){lastSnap123={id:c.id,at:now};return;}if(now-lastSnap123.at<90)return;}return addCityDraft123(c);};
// Bridge mode owns gestures, including two-finger navigation. Taps cannot reset a quoted bridge.
handleEngineeringPointer=function(phase,e){if(!bridgeDraft)return false;e.preventDefault?.();if(phase==='down'){bridgeTouch123.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY});cv.setPointerCapture(e.pointerId);if(bridgeTouch123.size===1){bridgeBeforeTouch123={a:bridgeDraft.a,b:bridgeDraft.b};engineeringPointer=e.pointerId;}else if(bridgeTouch123.size===2){Object.assign(bridgeDraft,bridgeBeforeTouch123);let a=[...bridgeTouch123.values()];bridgePinch123={dist:Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),scale:view.scale,x:view.x,y:view.y,cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2};engineeringPointer=null;}}
 else if(phase==='move'){let t=bridgeTouch123.get(e.pointerId);if(!t)return true;t.x=e.clientX;t.y=e.clientY;if(bridgeTouch123.size===2&&bridgePinch123){let a=[...bridgeTouch123.values()],k=bridgePinch123,s=Math.max(minScale(),Math.min(portraitMaxScale(),k.scale*Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y)/Math.max(1,k.dist))),cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2;view.scale=s;view.x=cx-(k.cx-k.x)*s/k.scale;view.y=cy-(k.cy-k.y)*s/k.scale;clampPortraitCamera();}else if(engineeringPointer===e.pointerId&&Math.hypot(t.x-t.sx,t.y-t.sy)>14){if(!t.dragging){let w={x:(t.sx-view.x)/view.scale,y:(t.sy-view.y)/view.scale};if(activeAtlasMap&&nearestRiver(w).d*view.scale>60)return true;t.dragging=true;bridgeDraft.a=snapBank(w);}bridgeDraft.b=snapBank(toWorld(e));}}
 else if(phase==='up'){let t=bridgeTouch123.get(e.pointerId);if(e.type==='pointercancel'&&t?.dragging)Object.assign(bridgeDraft,bridgeBeforeTouch123);bridgeTouch123.delete(e.pointerId);engineeringPointer=null;if(!bridgeTouch123.size){bridgePinch123=null;bridgeBeforeTouch123=null;}}
 updateBridgeBar();return true;};
const bridgeBegin123=beginBridge;
beginBridge=function(...args){bridgeTouch123.clear();bridgePinch123=null;bridgeBegin123(...args);$('drawbar').classList.remove('quote-compact');quoteExpand123.hidden=true;quoteExpand123.textContent='';};
const updateBridge123=updateBridgeBar;
updateBridgeBar=function(){updateBridge123();if(bridgeDraft&&tutorialStage123()==='bridge'&&bridgeDraft.a&&bridgeDraft.b&&!bridgeTerrainIssue(bridgeDraft.a,bridgeDraft.b)){tutorialFunds123(bridgePrice(bridgeDraft.a,bridgeDraft.b,bridgeDraft.type),'教学架桥');updateBridge123();}};
const createBridge123=createBridge;
createBridge=function(){let count=S.bridges.length;createBridge123();if(S.bridges.length>count&&tutorialStage123()==='bridge')tutorialSet123('connect');};
// Exit and manual save are explicit. Automatic saves continue during play and interruption.
const exitButton123=document.createElement('button');exitButton123.id='game-exit';exitButton123.textContent='↶';exitButton123.setAttribute('aria-label','保存与退出');exitButton123.onclick=askExit123;document.querySelector('header')?.appendChild(exitButton123);
function askExit123(){exitWasPaused123=S.paused;S.paused=true;openModal('<div class="modal-head"><h2>保存与退出</h2></div><p>返回选图前会保存当前进度。</p><div class="ux-actions"><button class="primary" onclick="saveExit123()">保存并返回选图</button><button onclick="cancelExit123()">继续游戏</button></div>');}
function manualSave123(){if(save()===false){toast('保存失败，请检查设备空间');return false;}toast('存档已保存');return true;}
function saveExit123(){S.paused=true;if(!manualSave123())return;closeModal();showAtlasMaps(false);}
function cancelExit123(){closeModal();S.paused=exitWasPaused123||interruptionPending();last=performance.now();updateUI();save();}
window.transitAndroidControl.back=function(){if(modalOpen){S.paused=true;closeModal();return false;}if(draft||bridgeDraft){cancelDraft(false);bridgeDraft=null;engineeringPointer=null;return false;}if(selected){clearSelection();return false;}if(!atlasMenuOpen){askExit123();return false;}return true;};
const hideMaps123=hideAtlasMaps;
hideAtlasMaps=function(...args){hideMaps123(...args);tutorialUI123();};
$('atlas-menu').onclick=askExit123;
$('atlas-back').onclick=()=>{if(S.portraitStarted)hideAtlasMaps(false);};
// Remove the service-contract system, including old pending settlements, without penalties.
chooseContract=function(){toast('公共交通服务合同已移除');};acceptContract=function(){};
const world123=updateWorld;
updateWorld=function(...args){S.contract=null;return world123(...args);};
const ops123=showOperations;
showOperations=function(){S.contract=null;ops123();let el=$('modal-content');el.innerHTML=el.innerHTML.replace(/<section class="infra-card"><h3>公共服务合同<\/h3>[\s\S]*?<\/section>/g,'').replaceAll('公共服务合同沿用原规则。','').replaceAll('；公共服务合同','；普通交通');};
// Three seed towns define the first cluster, rather than town zero alone.
function centerFirstRegion123(){let r=S.cityRegions?.[0];if(!r||S.cityRegions.length!==1)return;let seeds=S.cities.filter(c=>c.kind!=='bridgehead').slice(0,3);if(seeds.length===3){r.x=seeds.reduce((n,c)=>n+c.x,0)/3;r.y=seeds.reduce((n,c)=>n+c.y,0)/3;}}
function fourthCity123(r){let choices=growthAvailable.filter(p=>localAllowed(p,r)&&S.cities.slice(0,3).some(c=>{let d=Math.hypot(c.x-p.x,c.y-p.y);return d>=195&&d<=330&&riverSpans(c,p).length===1&&!mountainCrossings(c,p).length;}));if(!choices.length)return findLocal(r);choices.sort((a,b)=>Math.min(...S.cities.slice(0,3).map(c=>Math.hypot(c.x-a.x,c.y-a.y)))-Math.min(...S.cities.slice(0,3).map(c=>Math.hypot(c.x-b.x,c.y-b.y))));return choices[0];}
// Preserve old-save geometry. New journeys use extended, rounded river centerlines for both drawing and collision.
const originalMaps123=atlasClone(ATLAS_MAPS),naturalMaps123=atlasClone(ATLAS_MAPS);
function roundRiver123(p){let out=[p[0]];for(let i=1;i<p.length-1;i++){let a=p[i-1],b=p[i],c=p[i+1],u=Math.min(.12,22/Math.hypot(b[0]-a[0],b[1]-a[1])),v=Math.min(.12,22/Math.hypot(c[0]-b[0],c[1]-b[1])),s=[b[0]+(a[0]-b[0])*u,b[1]+(a[1]-b[1])*u],z=[b[0]+(c[0]-b[0])*v,b[1]+(c[1]-b[1])*v];out.push(s);for(let j=1;j<=5;j++){let t=j/5;out.push([(1-t)**2*s[0]+2*(1-t)*t*b[0]+t*t*z[0],(1-t)**2*s[1]+2*(1-t)*t*b[1]+t*t*z[1]]);}}out.push(p.at(-1));return out;}
for(let m of Object.values(naturalMaps123)){for(let p of m.branches){let a=p[0],b=p[1],dx=a[0]-b[0],dy=a[1]-b[1],ts=[];for(let [edge,axis,d] of [[m.bounds.xmin-650,0,dx],[m.bounds.xmax+650,0,dx],[m.bounds.ymin-650,1,dy],[m.bounds.ymax+650,1,dy]]){let t=(edge-a[axis])/d;if(t>0&&Number.isFinite(t))ts.push(t);}let t=Math.min(...ts);p.unshift([a[0]+dx*t,a[1]+dy*t]);}m.main=roundRiver123(m.main);m.branches=m.branches.map(roundRiver123);}
function compatibleOldRivers123(id){let m=atlasClone(originalMaps123[id]);if(!m||S?.mapId!==id)return m;const crosses=(a,b,c,d)=>{let cross=(p,q,r)=>(q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x);return Math.min(a.x,b.x)<=Math.max(c.x,d.x)&&Math.min(c.x,d.x)<=Math.max(a.x,b.x)&&Math.min(a.y,b.y)<=Math.max(c.y,d.y)&&Math.min(c.y,d.y)<=Math.max(a.y,b.y)&&cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0;};for(let pts of m.branches){let a={x:pts[0][0],y:pts[0][1]},dx=pts[0][0]-pts[1][0],dy=pts[0][1]-pts[1][1],ts=[];for(let [edge,axis,d] of [[m.bounds.xmin-650,'x',dx],[m.bounds.xmax+650,'x',dx],[m.bounds.ymin-650,'y',dy],[m.bounds.ymax+650,'y',dy]]){let t=(edge-a[axis])/d;if(t>0&&Number.isFinite(t))ts.push(t);}let t=Math.min(...ts),b={x:a.x+dx*t,y:a.y+dy*t};let occupied=realCities().some(c=>!c.removed&&segDist(c,a,b)<radius(c)+42)||S.lines.some(l=>l.stops.some((id,i)=>i&&crosses(a,b,S.cities[l.stops[i-1]],S.cities[id])))||Object.values(S.infrastructure||{}).some(e=>{let c=S.cities[e.a],d=S.cities[e.b];return c&&d&&crosses(a,b,c,d);});if(!occupied)pts.unshift([b.x,b.y]);}return m;}
const geometry123=activateAtlasGeometry;
activateAtlasGeometry=function(id){let useNatural=S?.mapId===id&&S.mapRevision>=2;let source=useNatural?naturalMaps123:originalMaps123;for(let key of ['east','west']){let geom=!useNatural&&key===id?compatibleOldRivers123(key):source[key];ATLAS_MAPS[key].main=atlasClone(geom.main);ATLAS_MAPS[key].branches=atlasClone(geom.branches);}return geometry123(id);};
const reset123=reset;
reset=function(){reset123();S.mapRevision=2;activateAtlasGeometry(S.mapId);centerFirstRegion123();configureGrowth();S.contract=null;S.tutorial123=null;tutorialUI123();};
// Old saves keep their river centerlines; extend their visible ends outside the map via scenery only.
const startMap123=startAtlasMap;
startAtlasMap=function(){startMap123();if(!atlasMenuOpen){centerFirstRegion123();if(realCities().length===3&&S.day<16)growthState().next=Math.min(growthState().next,10);if(S.day===0&&S.mapId==='east'&&!localStorage.getItem('transit-tutorial123-done')&&!S.tutorial123){S.tutorial123={stage:'view',line:null,city:null,practiceCash:S.points};S.paused=true;save();}tutorialUI123();}};
$('atlas-start').onclick=()=>{atlasRestart=false;startAtlasMap();};
const guide123=document.createElement('section');guide123.id='tutorial-guide';guide123.setAttribute('aria-label','新手引导');guide123.hidden=true;document.body.appendChild(guide123);
function tutorialStage123(){return S?.tutorial123?.stage;}
function tutorialSet123(stage){if(!S.tutorial123)return;S.tutorial123.stage=stage;S.paused=stage!=='wait';if(stage==='fog'){let c=S.cities[0];S.climate.events=S.climate.events.filter(e=>e.id!=='tutorial-fog');S.climate.events.push({id:'tutorial-fog',type:'fog',strong:false,start:S.day,end:S.day+365,x:c.x,y:c.y,radius:300,vx:0,vy:0});}tutorialUI123();save();}
function tutorialFunds123(required,label){if(!S.tutorial123||S.tutorial123.stage==='done')return;if(S.points<required)credit(cashRound(required-S.points),'subsidy',label+' · 教学专项补助');}
function skipTutorial123(){if(S.tutorial123)S.tutorial123.stage='done';S.climate.events=S.climate.events.filter(e=>e.id!=='tutorial-fog');meteoPreview=null;localStorage.setItem('transit-tutorial123-done','1');guide123.hidden=true;save();toast('已结束引导，可从帮助查看操作');}
function tutorialNext123(){let s=tutorialStage123();if(s==='fog'){meteoPreview={id:0,radius:240};tutorialSet123('meteo');}else if(s==='meteo')skipTutorial123();}
function tutorialUI123(){if(!document.getElementById('tutorial-guide'))return;let t=S?.tutorial123,s=t?.stage;guide123.hidden=!s||s==='done'||atlasMenuOpen||modalOpen;if(guide123.hidden)return;let texts={view:['查看城市','点一下任意城市，查看候车与城市信息。高亮圆环表示目标。'],build:['连接初始三城','从城市拖到另一座，继续接入第三座；核对底部报价后点建设。'], 'remove-stop':['移除一站','点线路打开详情，在途经城市列表中移除中间一站，再确认修改。'],wait:['等待河对岸的新城','时间正在推进。第10天附近会发现第四城；期间可观察客流和车辆。'],bridge:['架桥连接两岸','打开工程，选公路桥，从高亮河段的一岸拖到对岸，再点确认桥梁。双指可移动地图。'],connect:['接通第四城','从已有城市拉线接入河对岸第四城，沿自己选定的桥拖过两端。'],fog:['雾会使车辆减速','已出现一次教学雾：普通雾使公交减速15%。气象站可减轻范围内的天气减速。'],meteo:['气象站覆盖范围','虚线范围内的天气减速损失减半；覆盖重叠不叠加，也不能解除台风停飞。气象站需自行出资建设，本次只演示范围。']},x=texts[s];if(!x)return;guide123.innerHTML='<b>'+x[0]+'</b><p>'+x[1]+'</p>'+(['fog','meteo'].includes(s)?'<button onclick="tutorialNext123()">'+(s==='fog'?'查看气象站范围':'完成教学')+'</button>':'')+'<button onclick="skipTutorial123()">跳过引导</button>';}
const details123=showDetails;
showDetails=function(...a){details123(...a);if(tutorialStage123()==='view'&&selected?.type==='city')tutorialSet123('build');};
const removeStop123=confirmRemoveStop;
confirmRemoveStop=function(...a){let d=draft;removeStop123(...a);if(d&&!draft&&tutorialStage123()==='remove-stop')tutorialSet123('delete');};
const cancellation123=confirmLineCancellation;
const tick123=tick;
tick=function(dt){let t=S.tutorial123;if(t&&t.stage!=='done'){for(let c of realCities()){c.shield=Math.max(c.shield||0,30);for(let p of c.q)p.wait=0;}}tick123(dt);if(t&&t.stage==='wait'&&S.day>=10&&realCities().length>=4){t.city=realCities()[3].id;tutorialSet123('bridge');fit();}if(S.saveClock<dt)save();};
// On-load migration is deliberately small: no pending service-contract settlement and no forced tutorial.
S.contract=null;centerFirstRegion123();if(S.day<10&&realCities().length===3){let g=growthState();g.next=Math.min(g.next,10);}tutorialUI123();

const scenery123=drawPortraitScenery;
drawPortraitScenery=function(){scenery123();if(!activeAtlasMap)return;ctx.save();ctx.lineJoin='round';ctx.lineCap='round';for(let p of mapSpec.branches){atlasRiverPath(p);for(let [w,c] of [[33,'#c3d4b4'],[25,'#e2d9b4'],[18,'#619ca5'],[15,'#85bfc0'],[7,'#abd8cd']]){ctx.lineWidth=w;ctx.strokeStyle=c;ctx.stroke();}}ctx.restore();};
const cards123=showActivityCards;
showActivityCards=function(){cards123();let grid=$('modal-content').querySelector('.activity-grid');if(!grid)return;let pagination=document.createElement('div');pagination.className='card-pagination123';pagination.innerHTML='<button onclick="cardPage123(-1)" aria-label="上一张邀请">←</button><span id="card-page123">1 / 3</span><button onclick="cardPage123(1)" aria-label="下一张邀请">→</button>';grid.parentElement.appendChild(pagination);grid.addEventListener('scroll',()=>{let first=grid.firstElementChild,w=(first?.getBoundingClientRect().width||1)+10;let n=Math.max(1,Math.min(3,Math.round(grid.scrollLeft/w)+1));$('card-page123').textContent=n+' / 3';},{passive:true});};
function cardPage123(dir){let grid=$('modal-content').querySelector('.activity-grid');if(grid)grid.scrollBy({left:dir*((grid.firstElementChild?.getBoundingClientRect().width||grid.clientWidth)+10),behavior:'smooth'});}
// Teaching cues draw in screen space so the target remains legible while zooming.
function firstRouteCue123(){
 const line=S.lines.find(l=>!l.retiring&&l.stops.length===2);
 const missing=line&&S.cities.slice(0,3).find(c=>!line.stops.includes(c.id));
 return missing?[S.cities[line.stops.at(-1)],missing]:[S.cities[0],S.cities[1]];
}
const render123=render;
render=function(){render123();let stage=tutorialStage123();if(['trim-end','restore-end'].includes(stage))return;if(!stage||stage==='done'||atlasMenuOpen||modalOpen)return;if(stage==='build'){
 if(draft&&!$('drawdone').disabled)return;
 const [a,z]=firstRouteCue123().map(toScreen),t=(performance.now()%1800)/1800;
 ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle=ctx.fillStyle='#c2943a';ctx.lineWidth=2;ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(a.x,a.y,26,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(z.x,z.y);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.arc(a.x+(z.x-a.x)*t,a.y+(z.y-a.y)*t,6,0,Math.PI*2);ctx.fill();ctx.restore();return;
 }let c=stage==='connect'?S.cities[S.tutorial123.city]:S.cities[0];if(!c)return;let b=fitBand(),x=view.x+c.x*view.scale,y=view.y+c.y*view.scale;ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='#c2943a';ctx.lineWidth=2;ctx.setLineDash([5,5]);if(stage==='bridge'){let target=S.cities[S.tutorial123.city],origin=S.cities.slice(0,3).sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y))[0],river=nearestRiver({x:(origin.x+target.x)/2,y:(origin.y+target.y)/2});x=view.x+river.x*view.scale;y=view.y+river.y*view.scale;}if(y>b.top&&y<b.bottom){ctx.beginPath();ctx.arc(x,y,26+Math.sin(performance.now()/300)*3,0,Math.PI*2);ctx.stroke();}if(stage==='rebuild'){let a=S.cities[0],z=S.cities[1];ctx.beginPath();ctx.moveTo(view.x+a.x*view.scale,view.y+a.y*view.scale);ctx.lineTo(view.x+z.x*view.scale,view.y+z.y*view.scale);ctx.stroke();let t=(performance.now()%1800)/1800;ctx.fillStyle='#c2943a';ctx.beginPath();ctx.arc(view.x+(a.x+(z.x-a.x)*t)*view.scale,view.y+(a.y+(z.y-a.y)*t)*view.scale,6,0,Math.PI*2);ctx.fill();}ctx.restore();};

const help123=help;help=function(){help123();let e=$('modal-content');e.innerHTML=e.innerHTML.replace(/<li>[^<]*<b>服务合同<\/b>[\s\S]*?<\/li>/g,'').replace(/<p><b>服务合同<\/b>[\s\S]*?<\/p>/g,'');e.innerHTML+='<section class="infra-card"><h3>操作与保存</h3><p>点城市查看信息；从城市明显拖出后拉线，底栏确认建设。点线路查看详情，可移除单站或撤销整条线；撤销中的线路呈虚影，车辆到站后退出。在建造中选择桥型，再从河岸拖向对岸。双指只移动或缩放地图。左上角退出按钮可手动保存，确认保存成功后返回选图；平时自动保存。</p></section>';};$('help').onclick=()=>help();
