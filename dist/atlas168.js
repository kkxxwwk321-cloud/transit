'use strict';
// Revision 2 is used by new games; the previous paintings and physical data remain available to saves.
const terrainImages168={};for(const id of ['east','west','ocean']){const im=new Image();im.src='terrain168/'+id+'.png';terrainImages168[id]=im;}
for(const d of Object.values(TERRAIN168)){d.waterBoxes=d.water.map(worldBox167);d.mountainBoxes=d.mountains.map(worldBox167);}
function terrainRevision168(){return S?.terrainRevision167===2;}
function mapImage168(id,revision=2){return revision===1?terrainImages167[id]:terrainImages168[id];}
const resetBefore168=reset;
reset=function(...args){
 const r=resetBefore168(...args);const oceanSeeds=S.mapId==='ocean'?realCities().slice(0,3).map(c=>({x:c.x,y:c.y})):null;
 S.terrainRevision167=2;S.release='1.6.17';activateAtlasGeometry(S.mapId);
 const desired={east:[[.66,.45],[.79,.42],[.73,.52]],west:[[.3572,.4524],[.4456,.5204],[.4864,.602]]},placed=[];
 for(let i=0;i<3;i++){const p=oceanSeeds?oceanSeeds[i]:safeSeed167(...desired[S.mapId][i],placed);Object.assign(S.cities[i],p);placed.push(p);}
 if(S.mapId==='east'){
  // Keep all three starter connections dry. The fourth city owns the bridge lesson.
  if(placed.some((p,i)=>placed.slice(i+1).some(q=>riverSpans(p,q).length))){
   const anchor=placed[0],offsets=[{x:0,y:0},{x:255,y:-45},{x:145,y:155}];let solved=null;
   for(const [dx,dy]of seedOffsets167){const group=offsets.map(p=>({x:anchor.x+dx+p.x,y:anchor.y+dy+p.y}));if(group.every(p=>cityBuildable(p.x,p.y,2))&&group.every((p,i)=>group.slice(i+1).every(q=>!riverSpans(p,q).length))){solved=group;break;}}
   if(!solved)throw Error('初始三城无法保持同岸');solved.forEach((p,i)=>Object.assign(S.cities[i],p));
  }
 }
 S.cityRegions=[{id:0,x:S.cities.slice(0,3).reduce((n,c)=>n+c.x,0)/3,y:S.cities.slice(0,3).reduce((n,c)=>n+c.y,0)/3,name:mapSpec.name,discoveredAt:0,nextLocalAt:Infinity}];
 S.atlasGrowth=null;flushAtlas167();configureGrowth();fit();save();updateUI();return r;
};
// The bridge tutorial is constrained by the same water polygons used by the roads.
const fourthBefore168=fourthCity123;
fourthCity123=function(region){if(!terrainRevision168()||S.mapId!=='east')return fourthBefore168(region);const seeds=realCities().slice(0,3),candidates=growthAvailable.filter(p=>cityBuildable(p.x,p.y,2)&&seeds.some(c=>{const len=Math.hypot(c.x-p.x,c.y-p.y);return len>=195&&len<=440&&riverSpans(c,p).length===1&&!mountainCrossings(c,p).length;}));const target={x:seeds[2].x+35,y:seeds[2].y+300};candidates.sort((a,b)=>Math.hypot(a.x-target.x,a.y-target.y)-Math.hypot(b.x-target.x,b.y-target.y));return candidates[0]||null;};
// A separate connected-mainland test rejects all offshore islands.
const buildableBefore168=cityBuildable;
cityBuildable=function(x,y,size=0){if(!buildableBefore168(x,y,size))return false;if(!newAtlas167()||S.mapId!=='ocean')return true;const d=terrain167();return polygon16({x,y},d.coast)&&!inPolys167({x,y},d.islands)&&!fresh167({x,y});};
function nearestWater168(p,index=null){const d=terrain167();if(!d)return null;let best=null;for(let i=0;i<d.water.length;i++){if(index!==null&&i!==index)continue;const b=d.waterBoxes[i];if(best&&(p.x<b.left-best.d||p.x>b.right+best.d||p.y<b.top-best.d||p.y>b.bottom+best.d))continue;const s=nearestShore161(p,d.water[i]);if(!best||s.d<best.d)best={...s,waterIndex:i};}return best;}
function bank168(p,index=null){const s=nearestWater168(p,index);if(!s)return null;const len=Math.hypot(s.dx,s.dy)||1,choices=[];for(const offset of [12,16,20])for(const side of [1,-1]){const q={x:s.x-side*s.dy/len*offset,y:s.y+side*s.dx/len*offset,side,waterIndex:s.waterIndex};if(!fresh167(q)&&(!isOcean16()||land16(q)))choices.push(q);}choices.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));return choices[0]||null;}
const snapBefore168=snapBank;snapBank=function(p){return newAtlas167()?bank168(p)||p:snapBefore168(p);};
function bridgeMaxLength168(){return newAtlas167()?320:260;}
const bridgeIssueBefore168=bridgeTerrainIssue;
bridgeTerrainIssue=function(a,b){if(!newAtlas167())return bridgeIssueBefore168(a,b);if(!a||!b)return '从河岸拖到对岸，桥头会自动吸附';if(![a.x,a.y,b.x,b.y].every(Number.isFinite))return '桥头位置无效';if(Math.hypot(a.x-b.x,a.y-b.y)>bridgeMaxLength168())return '桥长超过上限';const bounds=terrain167().bounds;if([a,b].some(p=>p.x<bounds.xmin||p.x>bounds.xmax||p.y<bounds.ymin||p.y>bounds.ymax))return '桥头超出地图';if(isOcean16()&&(!land16(a)||!land16(b)||spans16(a,b,p=>!polygon16(p,terrain167().coast)).length))return '海洋禁止建桥';if(fresh167(a)||fresh167(b)||riverDistance(a)>22||riverDistance(b)>22||riverSpans(a,b).length!==1)return '请连接同一水域的两岸';if(mountainCrossings(a,b).length)return '桥位穿入山体，请移至河谷';return null;};
const bridgeBarBefore168=updateBridgeBar;
updateBridgeBar=function(){bridgeBarBefore168();if(newAtlas167()&&bridgeDraft?.a&&bridgeDraft?.b){const {a,b,type}=bridgeDraft,issue=bridgeTerrainIssue(a,b),length=Math.ceil(Math.hypot(a.x-b.x,a.y-b.y));$('drawtext').textContent=(issue?issue+' · ':'')+'桥长 '+length+' / '+bridgeMaxLength168()+(issue?'':' · ¥'+bridgePrice(a,b,type));}};
const engineeringBefore168=handleEngineeringPointer;
const bridgeGestures168=new Map();let bridgePinch168=null,bridgeSnapshot168=null,bridgeGestureOwner168=null;
handleEngineeringPointer=function(phase,e){
 if(!newAtlas167()||!bridgeDraft)return engineeringBefore168(phase,e);
 e.preventDefault?.();if(bridgeGestureOwner168!==bridgeDraft){bridgeGestures168.clear();bridgePinch168=null;bridgeGestureOwner168=bridgeDraft;}
 if(phase==='down'){
  cv.setPointerCapture?.(e.pointerId);const p=toWorld(e),shore=nearestWater168(p);bridgeGestures168.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY,world:p,bank:shore&&shore.d*view.scale<=60?bank168(p):null,vx:view.x,vy:view.y});
  if(bridgeGestures168.size===1){bridgeSnapshot168={a:bridgeDraft.a,b:bridgeDraft.b};engineeringPointer=e.pointerId;}
  else if(bridgeGestures168.size===2){Object.assign(bridgeDraft,bridgeSnapshot168);const v=[...bridgeGestures168.values()];bridgePinch168={dist:Math.hypot(v[1].x-v[0].x,v[1].y-v[0].y),scale:view.scale,x:view.x,y:view.y,cx:(v[0].x+v[1].x)/2,cy:(v[0].y+v[1].y)/2};engineeringPointer=null;}
 }else if(phase==='move'){
  const t=bridgeGestures168.get(e.pointerId);if(!t)return true;t.x=e.clientX;t.y=e.clientY;
  if(bridgeGestures168.size===2&&bridgePinch168){const v=[...bridgeGestures168.values()],k=bridgePinch168,scale=Math.max(minScale(),Math.min(portraitMaxScale(),k.scale*Math.hypot(v[1].x-v[0].x,v[1].y-v[0].y)/Math.max(1,k.dist))),cx=(v[0].x+v[1].x)/2,cy=(v[0].y+v[1].y)/2;Object.assign(view,{scale,x:cx-(k.cx-k.x)*scale/k.scale,y:cy-(k.cy-k.y)*scale/k.scale});clampPortraitCamera();}
  else if(engineeringPointer===e.pointerId&&Math.hypot(t.x-t.sx,t.y-t.sy)>10){
   if(t.bank){if(!t.dragging){t.dragging=true;bridgeDraft.a=t.bank;}const end=bank168(toWorld(e),t.bank.waterIndex);bridgeDraft.b=end||null;}
   else{view.x=t.vx+t.x-t.sx;view.y=t.vy+t.y-t.sy;clampPortraitCamera();}
  }
 }else if(phase==='up'){
  const t=bridgeGestures168.get(e.pointerId);if(e.type==='pointercancel'&&t?.dragging)Object.assign(bridgeDraft,bridgeSnapshot168);bridgeGestures168.delete(e.pointerId);engineeringPointer=null;if(!bridgeGestures168.size){bridgePinch168=null;bridgeSnapshot168=null;}
 }
 updateBridgeBar();return true;
};
// Fit the whole map inside the playable screen, rather than forcing it to cover the screen.
const minimumBefore168=portraitMinScale,clampBefore168=clampPortraitCamera,fitBefore168=fit;
portraitMinScale=function(width=W,height=H){if(!newAtlas167())return minimumBefore168(width,height);const b=terrainRevision168()&&S.mapId==='ocean'?marineBounds168():mapSpec.bounds,band=fitBand();return Math.min(width/(b.xmax-b.xmin),Math.max(100,band.bottom-band.top)/(b.ymax-b.ymin))*.92;};
clampPortraitCamera=function(target=view){if(!newAtlas167())return clampBefore168(target);if(!W||!H)return target;const b=terrainRevision168()&&S.mapId==='ocean'?marineBounds168():mapSpec.bounds,band=fitBand();target.scale=Math.max(portraitMinScale(),Math.min(portraitMaxScale(),Number.isFinite(target.scale)?target.scale:1));const s=target.scale;for(const [axis,lo,hi,start,end]of [['x','xmin','xmax',0,W],['y','ymin','ymax',band.top,band.bottom]]){const extent=(b[hi]-b[lo])*s;target[axis]=extent<=end-start?(start+end)/2-(b[lo]+b[hi])/2*s:Math.max(end-b[hi]*s,Math.min(start-b[lo]*s,Number.isFinite(target[axis])?target[axis]:0));}return target;};
fit=function(){if(!newAtlas167())return fitBefore168();const cs=realCities().filter(c=>!c.removed),band=fitBand();if(!cs.length)return;const x0=Math.min(...cs.map(c=>c.x))-110,x1=Math.max(...cs.map(c=>c.x))+110,y0=Math.min(...cs.map(c=>c.y))-140,y1=Math.max(...cs.map(c=>c.y))+110,scale=Math.max(portraitMinScale(),Math.min(.65,(W-32)/(x1-x0),(band.bottom-band.top)/(y1-y0)));Object.assign(view,clampPortraitCamera({scale,x:W/2-(x0+x1)/2*scale,y:(band.top+band.bottom)/2-(y0+y1)/2*scale}));};
const focusBefore168=portraitFocusCity;
portraitFocusCity=function(c){if(!newAtlas167())return focusBefore168(c);if(!c||pointers.size)return;const b=fitBand(),p=toScreen(c);if(p.x>=55&&p.x<W-55&&p.y>=b.top+85&&p.y<b.bottom-50)return;uxAutoMove(()=>animateView(clampPortraitCamera({scale:view.scale,x:W/2-c.x*view.scale,y:(b.top+b.bottom)/2-c.y*view.scale}),220));};
function overview168(){if(!newAtlas167())return fit();if(uxOverviewOn){uxOverviewOn=false;fit();}else{uxOverviewOn=true;const b=mapSpec.bounds,band=fitBand(),scale=portraitMinScale();Object.assign(view,clampPortraitCamera({scale,x:W/2-(b.xmin+b.xmax)/2*scale,y:(band.top+band.bottom)/2-(b.ymin+b.ymax)/2*scale}));}uxSyncOverviewButton();}
$('overview').onclick=overview168;
// Full-map space is a quiet atmospheric margin; edge feathering avoids stretched terrain or seams.
const featheredCanvases168=new Map();
function featheredPainting168(image){if(featheredCanvases168.has(image))return featheredCanvases168.get(image);const c=document.createElement('canvas');c.width=image.naturalWidth;c.height=image.naturalHeight;const p=c.getContext('2d');p.drawImage(image,0,0);p.globalCompositeOperation='destination-in';const fx=Math.max(12,c.width*.035),fy=Math.max(12,c.height*.035);for(const [x0,y0,x1,y1]of [[0,0,fx,0],[c.width,0,c.width-fx,0],[0,0,0,fy],[0,c.height,0,c.height-fy]]){const gradient=p.createLinearGradient(x0,y0,x1,y1);gradient.addColorStop(0,'#fff0');gradient.addColorStop(1,'#fff');p.fillStyle=gradient;p.fillRect(0,0,c.width,c.height);}p.globalCompositeOperation='source-over';featheredCanvases168.set(image,c);return c;}
const terrainDrawBefore168=drawTerrain;
drawTerrain=function(){if(!newAtlas167())return terrainDrawBefore168();const d=terrain167(),image=mapImage168(S.mapId,S.terrainRevision167);if(!image?.naturalWidth){const r=worldViewportRect();ctx.fillStyle=S.mapId==='ocean'?'#217d99':'#9eae65';ctx.fillRect(r.left,r.top,r.right-r.left,r.bottom-r.top);return;}const b=d.bounds,w=b.xmax-b.xmin,h=b.ymax-b.ymin,rect=worldViewportRect(),outside=rect.left<b.xmin||rect.right>b.xmax||rect.top<b.ymin||rect.bottom>b.ymax;ctx.save();if(outside){const gradient=ctx.createLinearGradient(0,b.ymin-h*.1,0,b.ymax);if(S.mapId==='ocean'){gradient.addColorStop(0,'#126f91');gradient.addColorStop(1,'#0b6489');}else{gradient.addColorStop(0,'#9eae65');gradient.addColorStop(1,'#a2ad68');}ctx.fillStyle=gradient;ctx.fillRect(rect.left-5,rect.top-5,rect.right-rect.left+10,rect.bottom-rect.top+10);if(S.mapId==='ocean'&&rect.top<b.ymin+140){ctx.fillStyle='#9eae65';ctx.fillRect(rect.left-5,rect.top-5,rect.right-rect.left+10,Math.max(0,b.ymin+140-rect.top));}}if(outside&&S.mapId==='ocean'){ctx.strokeStyle='#a4d4db12';ctx.lineWidth=.65/view.scale;for(let yy=Math.floor(rect.top/280)*280;yy<rect.bottom;yy+=280)for(let xx=Math.floor(rect.left/320)*320;xx<rect.right;xx+=320){const x=xx+Math.sin(xx*.07+yy*.01)*65,y=yy+Math.cos(xx*.03-yy*.08)*45;if(y<160||x>=b.xmin&&x<=b.xmax&&y<=b.ymax)continue;ctx.beginPath();ctx.moveTo(x-28,y);ctx.quadraticCurveTo(x,y-7,x+28,y);ctx.stroke();}}ctx.drawImage(outside?featheredPainting168(image):image,b.xmin,b.ymin,w,h);ctx.restore();};
// Modern buildings keep native city glyphs, queues and selection circles untouched.
const citySprites168=new Map();
function citySprite168(city){const key=[city.shape,city.size,!!city.hub,city.id%3].join('|');if(citySprites168.has(key))return citySprites168.get(key);const canvas=document.createElement('canvas');canvas.width=352;canvas.height=352;const c=canvas.getContext('2d');c.scale(2,2);c.translate(88,140);const level=city.size||0,finance=city.shape===2,industry=city.shape===3;
 c.fillStyle='#283a2924';c.beginPath();c.ellipse(5,-20,52,23,0,0,Math.PI*2);c.fill();
 c.strokeStyle='#b5b8a3';c.lineWidth=5;c.lineCap='round';c.beginPath();c.moveTo(-43,-18);c.lineTo(38,-36);c.moveTo(-5,-7);c.lineTo(-12,-42);c.stroke();c.strokeStyle='#e5dfc5';c.lineWidth=.7;c.stroke();
 const buildings=industry?[[-40,-30,28,17,8],[-10,-43,30,23+level*5,9],[20,-22,22,18,8]]:[[-38,-28,15,19+level*6,7],[-15,-44,18,26+level*8,8],[13,-35,15,20+level*7,7],[27,-15,14,16+level*5,6]];
 if(level>0)buildings.push([-24,-10,15,25+level*6,7]);if(level>1)buildings.push([2,-14,18,finance?68:54,8]);
 buildings.sort((a,b)=>a[1]-b[1]);for(const [x,y,w,h,depth]of buildings){const glass=finance||level===2&&x===2;tower167(c,x,y,w,h,depth,glass?'#70a8b5':industry?'#bac4bb':'#d3d9ce',glass);c.fillStyle=glass?'#d9ecdf':'#9daaa6';c.fillRect(x+3,y-h+2,Math.max(4,w-8),2);if(h>30){c.fillStyle='#718b8c';c.fillRect(x+w*.4,y-h-5,5,4);}if(!glass&&!industry){c.strokeStyle='#a7b7b3';c.lineWidth=.6;for(let yy=y-h+10;yy<y-5;yy+=14){c.beginPath();c.moveTo(x+1,yy);c.lineTo(x+w-1,yy);c.stroke();}}}
 for(const [x,y]of [[-45,-19],[45,-25],[-27,-46]]){c.fillStyle='#314c3030';c.beginPath();c.ellipse(x+3,y+2,5,2,0,0,7);c.fill();c.fillStyle='#5d8150';c.beginPath();c.ellipse(x,y-4,3.5,5,0,0,7);c.fill();c.fillStyle='#88a66a';c.beginPath();c.ellipse(x-1,y-6,2.3,3,0,0,7);c.fill();}
 if(city.shape===1){c.fillStyle='#e9e4c9';c.fillRect(22,-27,17,7);c.fillStyle='#4599a9';c.fillRect(24,-26,13,4);c.fillStyle='#f0eddf';c.fillRect(25,-29,6,2);}
 if(industry){c.fillStyle='#7b8f8b';c.fillRect(9,-64,5,27);c.fillStyle='#c27a5a';c.fillRect(9,-64,5,4);}
 if(city.hub){c.fillStyle='#b9c8c1';c.fillRect(-35,-2,67,7);c.fillStyle='#567e88';c.fillRect(-29,-6,54,4);c.fillStyle='#d6b66f';for(let x=-25;x<23;x+=9)c.fillRect(x,-3,5,2);}
 citySprites168.set(key,canvas);return canvas;}
const cityArtBefore168=drawCityArt;
drawCityArt=function(city){if(city.kind==='bridgehead')return;if(city.isVegas)return cityArtBefore168(city);drawFarm(city);const image=citySprite168(city);ctx.save();ctx.globalAlpha=city.dormant?.65:1;ctx.drawImage(image,city.x-88,city.y-140,176,176);ctx.restore();};
const farmBefore168=farmPosition;let farmOwner168=null,farmSignature168='';const farmPositions168=new Map();
function dryGround168(p,margin=7){const d=terrain167();if(!d)return false;const b=d.bounds;return p.x>b.xmin+margin&&p.x<b.xmax-margin&&p.y>b.ymin+margin&&p.y<b.ymax-margin&&!rock167(p)&&!fresh167(p)&&boundaryDistance167(p,d.water)>margin&&boundaryDistance167(p,d.mountains)>margin&&(!isOcean16()||land16(p)&&shore16(p).d>margin);}
farmPosition=function(city){if(!newAtlas167())return farmBefore168(city);const signature=realCities().map(c=>[c.id,c.x,c.y,c.size,!!c.removed].join(',')).join('|');if(farmOwner168!==S||farmSignature168!==signature){farmOwner168=S;farmSignature168=signature;farmPositions168.clear();}if(farmPositions168.has(city.id))return farmPositions168.get(city.id);const candidates=[[100,30],[-100,30],[0,55],[-75,40],[75,40],[0,75],[85,80],[-85,80],[0,100],[110,-55],[-110,-55]];for(let r=125;r<=200;r+=25)for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4)candidates.push([Math.cos(angle)*r,Math.sin(angle)*r]);for(const [dx,dy]of candidates){const p={x:city.x+dx,y:city.y+dy},corners=[[-30,-20],[30,-20],[30,20],[-30,20],[0,0]].map(([x,y])=>({x:p.x+x,y:p.y+y}));if(corners.every(q=>dryGround168(q,9))&&!realCities().some(c=>!c.removed&&Math.hypot(c.x-p.x,c.y-25-p.y)<(c.id===city.id?65:92))){farmPositions168.set(city.id,p);return p;}}farmPositions168.set(city.id,null);return null;};
const drawFarmBefore168=drawFarm;
drawFarm=function(city){if(!newAtlas167())return drawFarmBefore168(city);if(!city.farm)return;const p=farmPosition(city);if(!p)return;const stage=farmStage(city),recent=!city.farm.crop&&city.farm.lastHarvest&&S.day-city.farm.lastHarvest.day<.15;ctx.save();ctx.translate(p.x,p.y);ctx.transform(1,-.13,.32,.76,0,0);ctx.fillStyle='#314a2826';ctx.fillRect(-29,-20,61,42);const earth=ctx.createLinearGradient(-25,-20,25,20);earth.addColorStop(0,'#bba77a');earth.addColorStop(1,'#8e7954');ctx.fillStyle=earth;ctx.fillRect(-28,-19,56,38);ctx.strokeStyle='#d4c39a';ctx.lineWidth=1.3;ctx.strokeRect(-28,-19,56,38);for(let row=0;row<5;row++){const y=-15+row*7;ctx.strokeStyle='#716443';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-25,y+2);ctx.lineTo(25,y+2);ctx.stroke();if(stage>0)for(let col=0;col<9;col++){const x=-23+col*5.5,h=stage===1?3:stage===2?5:7;ctx.strokeStyle=stage===3?'#d5bd65':stage===2?'#73954e':'#8daa61';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-h);ctx.moveTo(x,y-2);ctx.lineTo(x-2,y-h+1);ctx.moveTo(x,y-3);ctx.lineTo(x+2,y-h);ctx.stroke();}}ctx.strokeStyle='#72866a';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-31,-21);ctx.lineTo(-31,20);ctx.stroke();if(recent){ctx.strokeStyle=city.farm.lastHarvest.profit>0?'#d9c278':'#a18b69';ctx.lineWidth=2;ctx.strokeRect(-30,-21,60,42);}ctx.restore();};
for(const id of ['east','west','ocean']){const tile=document.querySelector('#atlas-card-'+id+' .atlas-terrain');if(tile)tile.innerHTML='<img src="terrain168/'+id+'.png" alt="'+ATLAS_MAPS[id].name+'地形" style="width:100%;height:100%;object-fit:cover">';}
if(terrainRevision168())applyAtlas167(S.mapId);
if(!existingSave167){activateAtlasGeometry('east');reset();S.paused=true;}
// New geography uses the full mainland, including the western plain and southwestern projection.
const chooseBefore168=chooseCity16;let oceanCandidatesOwner168=null,oceanCandidates168=[];
function oceanZone168(p){const b=mapSpec.bounds,x=(p.x-b.xmin)/(b.xmax-b.xmin),y=(p.y-b.ymin)/(b.ymax-b.ymin);return x<.40&&y>.70?'southwest':x<.29?'west':y<.34?'north':x>.72?'east':'center';}
// Measured in world coordinates; each phase gradually permits a longer connection.
function oceanSpacing1613(n){
 if(n<=8)return {min:260,max:480,preferred:340};
 if(n<=12)return {min:280,max:560,preferred:380};
 if(n<=24)return {min:300,max:680,preferred:440};
 return {min:320,max:820,preferred:520};
}
chooseCity16=function(){
 if(!terrainRevision168())return chooseBefore168();const b=mapSpec.bounds,w=b.xmax-b.xmin,h=b.ymax-b.ymin;
 if(oceanCandidatesOwner168!==S){oceanCandidatesOwner168=S;oceanCandidates168=[];for(let y=b.ymin+140;y<b.ymax-100;y+=60)for(let x=b.xmin+120;x<b.xmax-100;x+=60)if(cityBuildable(x,y,2)){const p={x,y};oceanCandidates168.push({...p,coast:shore16(p).d,zone:oceanZone168(p)});}}
 const cs=realCities().filter(c=>!c.removed),n=cs.length+1,phase=n<=12?0:n<=24?1:2,spacing=oceanSpacing1613(n),counts={};for(const c of cs){const z=oceanZone168(c);counts[z]=(counts[z]||0)+1;}
 // Expand locally first. Westward targets start only after a small southern network exists.
 let target=null;if(phase===0&&n>8&&!counts.southwest)target={x:b.xmin+w*.23,y:b.ymin+h*.79};else if(phase===0&&n>8&&!counts.west)target={x:b.xmin+w*.13,y:b.ymin+h*.54};else if(phase>=1&&(counts.west||0)<2)target={x:b.xmin+w*.13,y:b.ymin+h*.54};else if(phase===1&&(counts.center||0)<5)target={x:b.xmin+w*.52,y:b.ymin+h*.47};else if(phase===2)target={x:b.xmin+w*.51,y:b.ymin+h*.20};
 const candidates=oceanCandidates168.map(p=>({...p,near:Math.min(...cs.map(c=>Math.hypot(c.x-p.x,c.y-p.y)))})).filter(p=>p.near>=spacing.min&&p.near<=spacing.max&&(phase!==0||p.y>b.ymin+h*.45));
 function score(p){const coastal=p.coast<210,nearby=cs.filter(c=>Math.hypot(c.x-p.x,c.y-p.y)<=spacing.max*1.3).length;let weight=phase===0?(coastal?0:160):phase===1?(p.zone==='center'?0:coastal?100:80):(p.zone==='north'?0:180);return Math.random()*120+Math.abs(p.near-spacing.preferred)*.65+weight+(target?Math.hypot(p.x-target.x,p.y-target.y)*(phase===0?.16:.32):0)+Math.max(0,nearby-4)*65-(nearby>=2&&nearby<=4?45:0);}
 const ranked=candidates.map(p=>({...p,score:score(p)})).sort((a,b)=>a.score-b.score);
 let best=null,feasible=0;for(const p of ranked){const neighbors=cs.filter(c=>Math.hypot(c.x-p.x,c.y-p.y)<=spacing.max).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));for(const c of neighbors.slice(0,4)){let dry=true;for(let i=1;i<16;i++){const q={x:c.x+(p.x-c.x)*i/16,y:c.y+(p.y-c.y)*i/16};if(!polygon16(q,terrain167().coast)){dry=false;break;}}if(!dry)continue;const req=requirements(c,p,'bus');if(!req.invalid&&req.tunnel<=(phase===0?1:2)&&req.bridge<=1){const costScore=p.score+req.tunnel*180+req.bridge*100;if(!best||costScore<best.costScore)best={p,costScore};feasible++;break;}}if(feasible>=10)break;}
 if(best)return best.p;
 // Retain the spacing cap when no legal point exists; retry later without spending money.
 return null;
};

const basinSpawnBefore168=basinSpawnAllowedWeb;
basinSpawnAllowedWeb=function(p){if(!terrainRevision168()||S.mapId!=='west')return basinSpawnBefore168(p);if(!cityBuildable(p.x,p.y,2))return false;const cs=realCities().filter(c=>!c.removed).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));const cap=S.day<65?3000:S.day<120?4800:7200;
 for(const c of cs.slice(0,4)){const eu=Math.hypot(c.x-p.x,c.y-p.y),req=requirements(c,p,'bus'),cost=Math.ceil(eu*.38)*10+req.bridge*1500+req.tunnel*2200;if(cost<=cap&&req.tunnel<=1&&req.bridge<=1)return true;if(eu>950)continue;const g=basinPathGridWeb(),x=Math.round((p.x-g.b.xmin)/g.step),y=Math.round((p.y-g.b.ymin)/g.step),distance=basinRouteDistancesWeb(c)[y*g.nx+x];if(distance/eu<2.8&&distance*3.8+req.bridge*1500<=cap)return true;}
 return false;
};
// Legacy tutorial rings and any remaining river queries also use the new water boundary.
const nearestRiverBefore168=nearestRiver;
nearestRiver=function(p){if(!newAtlas167())return nearestRiverBefore168(p);const s=nearestWater168(p);if(!s)return{x:p.x,y:p.y,d:Infinity,nx:0,ny:0};const len=Math.hypot(s.dx,s.dy)||1;return{...s,nx:-s.dy/len,ny:s.dx/len,rid:s.waterIndex,index:0,a:{x:s.x,y:s.y},b:{x:s.x+s.dx,y:s.y+s.dy}};};
// A continuous offshore apron keeps edge headlands from sealing off valid ocean harbors.
function marineBounds168(){const b=mapSpec.bounds;return{xmin:b.xmin-600,xmax:b.xmax+600,ymin:b.ymin,ymax:b.ymax+600};}
const seaBefore168=sea16;
sea16=function(p){if(!terrainRevision168()||S.mapId!=='ocean')return seaBefore168(p);const b=marineBounds168(),main=mapSpec.bounds;if(p.x<b.xmin||p.x>b.xmax||p.y<b.ymin||p.y>b.ymax)return false;if(p.y<140&&(p.x<main.xmin||p.x>main.xmax))return false;return !polygon16(p,terrain167().coast)&&!inPolys167(p,terrain167().islands);};
const gridSeaBefore168=seaGrid16;
seaGrid16=function(){if(!terrainRevision168()||S.mapId!=='ocean')return gridSeaBefore168();if(seaGraph16)return seaGraph16;const b=marineBounds168(),step=60,nx=Math.floor((b.xmax-b.xmin)/step)+1,ny=Math.floor((b.ymax-b.ymin)/step)+1,points=Array.from({length:nx*ny},(_,i)=>({x:b.xmin+(i%nx)*step,y:b.ymin+Math.floor(i/nx)*step}));return seaGraph16={step,nx,ny,points,pass:points.map(sea16)};};
