'use strict';
// One versioned geometry set and one full terrain painting per map. Old saves keep their geometry.
const terrainImages167={};
for(const id of ['east','west','ocean']){const im=new Image();im.src='terrain167/'+id+'.png';terrainImages167[id]=im;}
const legacyOcean167={coast:atlasClone(ATLAS_MAPS.ocean.coast),lakes:atlasClone(lakePolygons161),hills:atlasClone(ATLAS_MAPS.ocean.hills)};
const legacySpecs167=Object.fromEntries(Object.entries(ATLAS_MAPS).map(([id,d])=>[id,atlasClone(d)]));
let geometryOwner167=null;
function newAtlas167(){return [1,2].includes(S?.terrainRevision167)&&!!TERRAIN167[S.mapId];}
function terrain167(){return newAtlas167()?(S.terrainRevision167===2?TERRAIN168:TERRAIN167)[S.mapId]:null;}
function worldBox167(poly){if(poly.box167)return poly.box167;return poly.box167={left:Math.min(...poly.map(p=>p[0])),right:Math.max(...poly.map(p=>p[0])),top:Math.min(...poly.map(p=>p[1])),bottom:Math.max(...poly.map(p=>p[1]))};}
for(const d of Object.values(TERRAIN167)){d.waterBoxes=d.water.map(worldBox167);d.mountainBoxes=d.mountains.map(worldBox167);}
function inPolys167(p,polys,boxes){for(let i=0;i<polys.length;i++){const b=boxes?.[i];if(b&&(p.x<b.left||p.x>b.right||p.y<b.top||p.y>b.bottom))continue;if(polygonFast161(p,polys[i]))return true;}return false;}
function fresh167(p){const d=terrain167();return d&&inPolys167(p,d.water,d.waterBoxes);}
function rock167(p){const d=terrain167();return d&&inPolys167(p,d.mountains,d.mountainBoxes);}
function boundaryDistance167(p,polys){let distance=Infinity;for(const poly of polys){const b=worldBox167(poly);if(p.x<b.left-distance||p.x>b.right+distance||p.y<b.top-distance||p.y>b.bottom+distance)continue;distance=Math.min(distance,nearestShore161(p,poly).d);}return distance;}
function flushAtlas167(){studyGeomMemo.clear();geometryMemo.clear();crossingCache.clear();landRouteCache161.clear();shoreMemo161.clear();clearMarinePaths16();curvedSeaMemo164.clear();basinGraphWeb=null;basinPathsWeb.clear();gridCache=null;growthStateRef=null;terrainCache=null;spawnCandidates16=null;}
function applyAtlas167(id){
 const d=(S?.terrainRevision167===2?TERRAIN168:TERRAIN167)[id];if(!d)return;
 mapSpec.bounds={...d.bounds};
 mountainPolygons.splice(0,mountainPolygons.length,...d.mountains.map(p=>p.map(([x,y])=>({x,y}))));
 mountains.splice(0,mountains.length,...d.mountains.map(p=>{const b=worldBox167(p);return{x:(b.left+b.right)/2,y:(b.top+b.bottom)/2,rx:(b.right-b.left)/2,ry:(b.bottom-b.top)/2};}));
 if(id==='ocean'){
  ATLAS_MAPS.ocean.coast=atlasClone(d.coast);mapSpec.coast=ATLAS_MAPS.ocean.coast;
  lakePolygons161.splice(0,lakePolygons161.length,...atlasClone(d.water));
  const b=d.bounds,w=b.xmax-b.xmin,h=b.ymax-b.ymin;
  ATLAS_MAPS.ocean.hills=[.30,.39,.48,.57].map((y,i)=>({x:b.xmin+w*(.78-i*.025),y:b.ymin+h*y,rx:w*.105,ry:h*.085}));hills.splice(0,hills.length,...ATLAS_MAPS.ocean.hills);
 }else{
  mapSpec.main=atlasClone(d.main);mapSpec.branches=[];
  if(id==='west')hills.length=0;
 }
 riverSegments.length=0;
 if(id!=='ocean')for(let i=1;i<d.main.length;i++)riverSegments.push({rid:0,index:i-1,a:{x:d.main[i-1][0],y:d.main[i-1][1]},b:{x:d.main[i][0],y:d.main[i][1]}});
 geometryOwner167=S;flushAtlas167();
}
const activateBefore167=activateAtlasGeometry;
activateAtlasGeometry=function(id){
 // Restore adapter inputs before every switch, including old saves of the same map.
 if(geometryOwner167){for(const [mapId,spec]of Object.entries(legacySpecs167))Object.assign(ATLAS_MAPS[mapId],atlasClone(spec));lakePolygons161.splice(0,lakePolygons161.length,...atlasClone(legacyOcean167.lakes));geometryOwner167=null;}
 const r=activateBefore167(id);if(newAtlas167()&&S.mapId===id)applyAtlas167(id);return r;
};
const riverDistanceBefore167=riverDistance;
riverDistance=function(p){const d=terrain167();return d?boundaryDistance167(p,d.water):riverDistanceBefore167(p);};
const valleyBefore167=inRiverValley;
inRiverValley=function(p){return newAtlas167()?!!fresh167(p):valleyBefore167(p);};
const riverSpansBefore167=riverSpans;
riverSpans=function(a,b,width=9){
 if(!newAtlas167())return riverSpansBefore167(a,b,width);
 const d=terrain167(),dx=b.x-a.x,dy=b.y-a.y,key='water167|'+[a.x,a.y,b.x,b.y].join('|');if(studyGeomMemo.has(key))return studyGeomMemo.get(key);
 if(Math.hypot(dx,dy)<1e-9)return [];const cuts=[0,1],left=Math.min(a.x,b.x),right=Math.max(a.x,b.x),top=Math.min(a.y,b.y),bottom=Math.max(a.y,b.y);
 for(let k=0;k<d.water.length;k++){const box=d.waterBoxes[k];if(box.left>right||box.right<left||box.top>bottom||box.bottom<top)continue;const poly=d.water[k];for(let i=0,j=poly.length-1;i<poly.length;j=i++){const p=poly[j],q=poly[i],ex=q[0]-p[0],ey=q[1]-p[1],den=dx*ey-dy*ex;if(Math.abs(den)<1e-10)continue;const t=((p[0]-a.x)*ey-(p[1]-a.y)*ex)/den,u=((p[0]-a.x)*dy-(p[1]-a.y)*dx)/den;if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);}}
 cuts.sort((x,y)=>x-y);const out=[];for(let i=1;i<cuts.length;i++){const lo=cuts[i-1],hi=cuts[i];if(hi-lo<1e-9)continue;const t=(lo+hi)/2;if(fresh167({x:a.x+dx*t,y:a.y+dy*t})){if(out.length&&lo-out.at(-1)[1]<1e-8)out.at(-1)[1]=hi;else out.push([lo,hi]);}}
 if(studyGeomMemo.size>12000)studyGeomMemo.clear();studyGeomMemo.set(key,out);return out;
};
const cityBuildBefore167=cityBuildable;
function cityGround167(x,y){
 const d=terrain167();if(!d)return true;const b=d.bounds,p={x,y:y-28},r=92;
 if(x<b.xmin+100||x>b.xmax-100||y<b.ymin+130||y>b.ymax-100)return false;
 if(rock167(p)||fresh167(p)||boundaryDistance167(p,d.mountains)<r||boundaryDistance167(p,d.water)<r)return false;
 if(S.mapId==='ocean'&&(!polygon16(p,d.coast)||nearestShore161(p,d.coast,false).d<(S.terrainRevision167===2?90:100)))return false;
 return true;
}
cityBuildable=function(x,y,size=0){return newAtlas167()?cityGround167(x,y):cityBuildBefore167(x,y,size);};
const landBefore167=land16;
land16=function(p){if(!newAtlas167()||S.mapId!=='ocean')return landBefore167(p);const d=terrain167();return polygon16(p,d.coast)&&!fresh167(p);};
const seaBefore167=sea16;
sea16=function(p){if(!newAtlas167()||S.mapId!=='ocean')return seaBefore167(p);const d=terrain167(),b=d.bounds;return p.x>=b.xmin&&p.x<=b.xmax&&p.y>=b.ymin&&p.y<=b.ymax&&!polygon16(p,d.coast)&&!inPolys167(p,d.islands);};
const lakeBefore167=lake16;
lake16=function(p){return newAtlas167()&&S.mapId==='ocean'?!!fresh167(p):lakeBefore167(p);};
const snapBefore167=snapBank;
snapBank=function(p){if(!newAtlas167())return snapBefore167(p);const d=terrain167(),s=d.water.map(poly=>nearestShore161(p,poly)).sort((a,b)=>a.d-b.d)[0];if(!s)return p;const len=Math.hypot(s.dx,s.dy)||1;return [1,-1].map(side=>({x:s.x-side*s.dy/len*12,y:s.y+side*s.dx/len*12,side})).find(q=>!fresh167(q)&&(!isOcean16()||land16(q)))||p;};
const bridgeIssueBefore167=bridgeTerrainIssue;
bridgeTerrainIssue=function(a,b){if(!newAtlas167())return bridgeIssueBefore167(a,b);if(!a||!b||![a.x,a.y,b.x,b.y].every(Number.isFinite))return '桥头无效';if(Math.hypot(a.x-b.x,a.y-b.y)>260)return '桥过长';const bounds=terrain167().bounds;if([a,b].some(p=>p.x<bounds.xmin||p.x>bounds.xmax||p.y<bounds.ymin||p.y>bounds.ymax))return '越界';if(fresh167(a)||fresh167(b)||riverDistance(a)>20||riverDistance(b)>20||riverSpans(a,b).length!==1)return '桥应连接水域两岸';if(isOcean16()&&spans16(a,b,p=>!polygon16(p,terrain167().coast)).length)return '海洋禁止建桥';if(mountainCrossings(a,b).length)return '桥位穿山';return null;};
const seedOffsets167=[];for(let y=-420;y<=420;y+=24)for(let x=-420;x<=420;x+=24)seedOffsets167.push([x,y]);seedOffsets167.sort((a,b)=>a[0]*a[0]+a[1]*a[1]-b[0]*b[0]-b[1]*b[1]);
function safeSeed167(u,v,previous,coastal=false){const b=mapSpec.bounds,desired={x:b.xmin+u*(b.xmax-b.xmin),y:b.ymin+v*(b.ymax-b.ymin)};for(const [dx,dy]of seedOffsets167){const p={x:desired.x+dx,y:desired.y+dy};if(previous.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<200))continue;if(coastal&&nearestShore161(p,terrain167().coast,false).d>155)continue;if(cityBuildable(p.x,p.y,2))return p;}throw Error('没有安全的开局城市位置');}
const resetBefore167=reset;
reset=function(...args){
 const r=resetBefore167(...args);S.terrainRevision167=1;S.release='1.6.17';activateAtlasGeometry(S.mapId);
 const seeds={east:[[.66,.45],[.79,.42],[.79,.60]],west:[[.40,.43],[.55,.43],[.66,.56]],ocean:[[.93,.67],[.85,.62],[.89,.76]]}[S.mapId],placed=[];
 for(let i=0;i<3;i++){let p=safeSeed167(...seeds[i],placed,S.mapId==='ocean'&&i===0);placed.push(p);Object.assign(S.cities[i],p,{regionId:0});}
 const center={x:placed.reduce((n,p)=>n+p.x,0)/3,y:placed.reduce((n,p)=>n+p.y,0)/3};S.cityRegions=[{id:0,...center,name:mapSpec.name,discoveredAt:0,nextLocalAt:Infinity}];S.atlasGrowth=null;configureGrowth();if(isOcean16())growthState().next=10;flushAtlas167();fit();save();return r;
};
const loadBefore167=load;
load=function(...args){const ok=loadBefore167(...args);if(ok&&newAtlas167())applyAtlas167(S.mapId);return ok;};
// The world camera cannot expose the edge of a painting. Entire visible area is covered.
const portraitBoundsBefore167=portraitBounds;
portraitBounds=function(){return activeAtlasMap?{...mapSpec.bounds}:portraitBoundsBefore167();};
const drawTerrainBefore167=drawTerrain;
drawTerrain=function(){
 const d=terrain167(),image=terrainImages167[S.mapId];if(!d||!image?.naturalWidth)return drawTerrainBefore167();
 const b=d.bounds;ctx.save();ctx.drawImage(image,b.xmin,b.ymin,b.xmax-b.xmin,b.ymax-b.ymin);ctx.restore();
};
// City glyphs are rendered by the unchanged native marker loop, not by these buildings.
const cityArtBefore167=drawCityArt;
const citySprites167=new Map();
function tower167(c,x,y,w,h,depth,color,glass=false){
 c.fillStyle='#1c332737';c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y-depth/2);c.lineTo(x+w+12,y+7);c.lineTo(x+9,y+depth+6);c.closePath();c.fill();
 c.fillStyle=color;c.fillRect(x,y-h,w,h);c.fillStyle=glass?'#46748c':'#aab8bd';c.beginPath();c.moveTo(x+w,y-h);c.lineTo(x+w+depth,y-h-depth*.6);c.lineTo(x+w+depth,y-depth*.6);c.lineTo(x+w,y);c.closePath();c.fill();
 c.fillStyle=glass?'#d9edf0':'#f5f5ec';c.beginPath();c.moveTo(x,y-h);c.lineTo(x+depth,y-h-depth*.6);c.lineTo(x+w+depth,y-h-depth*.6);c.lineTo(x+w,y-h);c.closePath();c.fill();
 c.fillStyle=glass?'#b1e3e7':'#58808e';for(let yy=y-h+5;yy<y-3;yy+=7)for(let xx=x+3;xx<x+w-2;xx+=5)c.fillRect(xx,yy,2,3);
 if(glass){c.strokeStyle='#edf6f755';c.lineWidth=.7;for(let xx=x+5;xx<x+w;xx+=5){c.beginPath();c.moveTo(xx,y-h);c.lineTo(xx,y);c.stroke();}}
}
function citySprite167(city){const key=[city.shape,city.size,!!city.hub].join('|');if(citySprites167.has(key))return citySprites167.get(key);const canvas=document.createElement('canvas');canvas.width=320;canvas.height=320;const c=canvas.getContext('2d');c.scale(2,2);c.translate(76,132);
 c.fillStyle='#34473820';c.beginPath();c.ellipse(3,-21,49,21,0,0,Math.PI*2);c.fill();c.fillStyle='#b4baa9';c.beginPath();c.moveTo(-48,-32);c.lineTo(10,-50);c.lineTo(52,-24);c.lineTo(-8,-5);c.closePath();c.fill();c.strokeStyle='#6c7779';c.lineWidth=4;c.beginPath();c.moveTo(-39,-23);c.lineTo(37,-36);c.stroke();
 const n=city.size,financial=city.shape===2,industrial=city.shape===3;
 const buildings=industrial?[[-38,-28,25,18,9],[-9,-35,31,22+n*4,10],[18,-17,24,17,9]]:[[-36,-27,14,16+n*7,7],[-14,-41,17,23+n*9,8],[12,-30,18,20+n*8,8],[29,-17,12,14+n*6,6]];
 if(n>=1)buildings.push([-24,-13,13,24+n*7,7]);if(n>=2)buildings.push([4,-14,17,financial?68:52,8]);
 buildings.sort((a,b)=>a[1]-b[1]);for(const [x,y,w,h,dep]of buildings)tower167(c,x,y,w,h,dep,industrial?'#bfc9d1':financial?'#6babbc':'#e6eceb',financial||n>=2&&x===4);
 if(city.shape===1){c.fillStyle='#26abc1';c.fillRect(22,-25,12,5);c.fillStyle='#f6faf4';c.fillRect(25,-28,9,2);}
 if(industrial){c.fillStyle='#929fa5';c.fillRect(11,-68,4,32);c.fillStyle='#d77956';c.fillRect(11,-68,4,5);}
 if(city.hub){c.fillStyle='#dfd4b5';c.fillRect(-35,-2,66,8);c.fillStyle='#5a7b88';c.fillRect(-30,-7,57,6);c.fillStyle='#d5a856';c.fillRect(-29,-3,6,3);}
 citySprites167.set(key,canvas);return canvas;}
drawCityArt=function(city){if(city.kind==='bridgehead')return;if(city.isVegas)return cityArtBefore167(city);const image=citySprite167(city);ctx.save();ctx.globalAlpha=city.dormant?.55:1;ctx.drawImage(image,city.x-76,city.y-132,160,160);ctx.restore();};
for(const id of Object.keys(terrainImages167)){const tile=document.querySelector('#atlas-card-'+id+' .atlas-terrain');if(tile)tile.innerHTML='<img src="terrain167/'+id+'.png" alt="'+ATLAS_MAPS[id].name+'完整地形" style="width:100%;height:100%;object-fit:cover">';}
if(newAtlas167())applyAtlas167(S.mapId);
// Bridge geometry and native bridgehead nodes are unchanged; refresh their visual integration.
const bridgesBefore167=drawBridges;
drawBridges=function(){
 for(const bridge of S.bridges){if(bridge.status==='removed')continue;const a=S.cities[bridge.heads[0]],b=S.cities[bridge.heads[1]];if(!a||!b)continue;
  const length=Math.hypot(b.x-a.x,b.y-a.y),rail=bridgeAppearance(bridge.type)==='rail',width=rail?15:18+Math.min(bridge.level||0,2)*2;
  ctx.save();ctx.translate(a.x,a.y);ctx.rotate(Math.atan2(b.y-a.y,b.x-a.x));ctx.globalAlpha=bridge.status==='open'?1:.55;
  ctx.lineCap='round';ctx.strokeStyle='#213b3540';ctx.lineWidth=width+6;ctx.beginPath();ctx.moveTo(3,6);ctx.lineTo(length+3,6);ctx.stroke();
  // Piers sit beneath the deck only over actual water, leaving banks unobstructed.
  for(let x=20;x<length-12;x+=38){const t=x/length,p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t};if(newAtlas167()&&!fresh167(p))continue;ctx.fillStyle='#84928c';ctx.fillRect(x-2,4,5,13);ctx.fillStyle='#ccd0c2';ctx.fillRect(x-2,4,2,13);}
  ctx.fillStyle='#a3aea6';ctx.beginPath();ctx.moveTo(0,width/2);ctx.lineTo(length,width/2);ctx.lineTo(length,width/2+4);ctx.lineTo(0,width/2+4);ctx.closePath();ctx.fill();
  const deck=ctx.createLinearGradient(0,-width/2,0,width/2);deck.addColorStop(0,'#d9dfd3');deck.addColorStop(.17,'#929fa2');deck.addColorStop(.8,'#839397');deck.addColorStop(1,'#becac1');ctx.fillStyle=deck;ctx.fillRect(0,-width/2,length,width);
  ctx.strokeStyle=rail?'#384f55':'#f5e8a9';ctx.lineWidth=rail?1.6:.9;ctx.setLineDash(rail?[]:[7,5]);
  for(const side of rail?[-1,1]:[0]){ctx.beginPath();ctx.moveTo(0,side*3);ctx.lineTo(length,side*3);ctx.stroke();}ctx.setLineDash([]);
  if(rail){ctx.strokeStyle='#c9d5d0';ctx.lineWidth=1;for(let x=5;x<length;x+=7){ctx.beginPath();ctx.moveTo(x,-5);ctx.lineTo(x,5);ctx.stroke();}}
  ctx.strokeStyle='#e9eee4';ctx.lineWidth=1.3;for(const side of [-1,1]){ctx.beginPath();ctx.moveTo(0,side*(width/2-1));ctx.lineTo(length,side*(width/2-1));ctx.stroke();for(let x=8;x<length;x+=18){ctx.beginPath();ctx.moveTo(x,side*width/2);ctx.lineTo(x,side*(width/2+3));ctx.stroke();}}
  ctx.restore();for(const p of [a,b]){ctx.save();ctx.beginPath();if(rail)ctx.rect(p.x-4,p.y-4,8,8);else ctx.arc(p.x,p.y,4,0,Math.PI*2);ctx.fillStyle='#fffdf1';ctx.strokeStyle=rail?'#5d7873':'#9a9e78';ctx.fill();ctx.stroke();ctx.restore();}
 }
 if(bridgeDraft?.a&&bridgeDraft.b){ctx.save();ctx.lineWidth=5;ctx.strokeStyle=bridgeTerrainIssue(bridgeDraft.a,bridgeDraft.b)?'#ba5e4f':'#c99a58';ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(bridgeDraft.a.x,bridgeDraft.a.y);ctx.lineTo(bridgeDraft.b.x,bridgeDraft.b.y);ctx.stroke();ctx.restore();}
};

// First-ever launch also uses new terrain; an existing save is never reset automatically.
if(!existingSave167){activateAtlasGeometry('east');reset();S.paused=true;}
