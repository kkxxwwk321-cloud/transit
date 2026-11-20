'use strict';
// Preview-only terrain. Ridge corridors are also the tunnel/city collision polygons.
const westRangesPreview=[
 {w:120,h:1.0,p:[[-610,170],[-455,55],[-225,80],[30,20],[285,80],[505,110],[690,260]]},
 {w:145,h:1.1,p:[[-610,145],[-680,335],[-575,530],[-590,705],[-400,840]]},
 {w:103,h:.80,p:[[-400,840],[-175,935],[65,885],[280,950],[490,875]]},
 {w:110,h:.86,p:[[690,240],[780,415],[670,590],[730,700]]},
 {w:38,h:.72,p:[[-420,120],[-380,220],[-315,305],[-235,305],[-165,350],[-105,370]]},
 {w:30,h:.66,p:[[440,125],[430,190],[405,285]]},
 {w:38,h:.67,p:[[-515,650],[-390,655],[-270,675],[-170,680],[-65,600],[55,525]]},
 {w:32,h:.61,p:[[285,920],[270,850],[290,760],[300,675]]},
 {w:32,h:.62,p:[[695,490],[590,485],[470,510]]}
];
function smoothRangePreview(p){const a=[];for(let i=0;i<p.length-1;i++){let p0=p[Math.max(0,i-1)],p1=p[i],p2=p[i+1],p3=p[Math.min(p.length-1,i+2)];for(let k=0;k<7;k++){let t=k/7,t2=t*t,t3=t2*t;a.push({x:.5*(2*p1[0]+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3),y:.5*(2*p1[1]+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)});}}a.push({x:p.at(-1)[0],y:p.at(-1)[1]});return a;}
for(let [j,r]of westRangesPreview.entries()){r.path=smoothRangePreview(r.p);r.widths=r.path.map((p,i)=>r.w*(.82+.12*Math.sin(i*.59+j)+.12*Math.sin(i*.21+j*2)));let a=[],b=[];r.path.forEach((p,i)=>{let p0=r.path[Math.max(0,i-1)],p1=r.path[Math.min(i+1,r.path.length-1)],dx=p1.x-p0.x,dy=p1.y-p0.y,l=Math.hypot(dx,dy)||1,w=r.widths[i];a.push({x:p.x-dy/l*w,y:p.y+dx/l*w});b.push({x:p.x+dy/l*w,y:p.y-dx/l*w});});r.poly=a.concat(b.reverse());}
const westRangesLegacy158=atlasClone(westRangesPreview);
const westRangesExpanded158=atlasClone(westRangesLegacy158).filter((r,i)=>i<4||i===6).map((r,i)=>{
 if(i<4){r.p=r.p.map(([x,y])=>[100+(x-100)*1.7,500+(y-500)*1.9]);r.path=smoothRangePreview(r.p);
 r.widths=r.path.map((p,j)=>r.w*(.82+.12*Math.sin(j*.59+i)+.12*Math.sin(j*.21+i*2)));
 let a=[],b=[];r.path.forEach((p,j)=>{let u=r.path[Math.max(0,j-1)],v=r.path[Math.min(r.path.length-1,j+1)],dx=v.x-u.x,dy=v.y-u.y,l=Math.hypot(dx,dy)||1,w=r.widths[j];a.push({x:p.x-dy/l*w,y:p.y+dx/l*w});b.push({x:p.x+dy/l*w,y:p.y-dx/l*w});});r.poly=a.concat(b.reverse());}
 return r;
});
// Restore all five interior ridges, spread through the larger basin. Keep the
// opening ridge exact so the starting cities and first tunnel quote are stable.
const westRangesRestored1510=atlasClone(westRangesLegacy158).map((r,i)=>{
 if(i<4)return atlasClone(westRangesExpanded158[i]);
 if(i===6)return r;
 r.p=r.p.map(([x,y])=>[100+(x-100)*1.25,500+(y-500)*1.3]);
 r.path=smoothRangePreview(r.p);r.widths=r.path.map((p,j)=>r.w*(.82+.12*Math.sin(j*.59+i)+.12*Math.sin(j*.21+i*2)));
 const a=[],b=[];r.path.forEach((p,j)=>{const u=r.path[Math.max(0,j-1)],v=r.path[Math.min(r.path.length-1,j+1)],dx=v.x-u.x,dy=v.y-u.y,l=Math.hypot(dx,dy)||1,w=r.widths[j];a.push({x:p.x-dy/l*w,y:p.y+dx/l*w});b.push({x:p.x+dy/l*w,y:p.y-dx/l*w});});r.poly=a.concat(b.reverse());return r;
});
let creatingBasin158=false,activeBasinRevision158=null;
basinWest14.start=[[-320,500],[-120,500],[160,580]];
basinWest14.main=[[180,-480],[190,-150],[110,50],[85,205],[0,340],[100,460],[210,530],[325,660],[490,745],[625,815],[820,950],[1050,1100],[1400,1350]];
basinWest14.branches=[[[1400,65],[1090,50],[825,130],[640,285],[480,385],[300,410],[100,460]],[[-1250,-45],[-920,10],[-685,150],[-500,270],[-335,365],[-130,430],[100,460]]];
basinWest14.mountains=[];basinWest14.hills=[{x:250,y:610,rx:70,ry:23}];
// Each interior group grows outward into an existing outer ridge. Junctions
// avoid river valleys; the inner tips and broad intervening plains stay open.
const westRangesJoined1512=atlasClone(westRangesRestored1510).map((r,i)=>{
 if(i<4)return r;
 let best=null;
 for(const end of [0,1]){
  const tip=r.p[end?r.p.length-1:0];
  for(let outer=0;outer<4;outer++)for(const p of westRangesRestored1510[outer].path){
   const riverDistance=Math.min(...[basinWest14.main,...basinWest14.branches].flatMap(path=>path.slice(1).map((b,j)=>segDist(p,{x:path[j][0],y:path[j][1]},{x:b[0],y:b[1]}))));
   if(riverDistance<85)continue;
   const distance=Math.hypot(p.x-tip[0],p.y-tip[1]);
   if(!best||distance<best.distance)best={end,outer,point:{x:p.x,y:p.y},distance};
  }
 }
 if(!best)return r;
 const tip=r.p[best.end?r.p.length-1:0],p=best.point,middle=[(p.x+tip[0])/2,(p.y+tip[1])/2];
 r.p=best.end?[...r.p,middle,[p.x,p.y]]:[[p.x,p.y],middle,...r.p];
 r.join1512={outer:best.outer,end:best.end,point:p};
 r.path=smoothRangePreview(r.p);r.widths=r.path.map((p,j)=>r.w*(.82+.12*Math.sin(j*.59+i)+.12*Math.sin(j*.21+i*2)));
 const a=[],b=[];r.path.forEach((p,j)=>{const u=r.path[Math.max(0,j-1)],v=r.path[Math.min(r.path.length-1,j+1)],dx=v.x-u.x,dy=v.y-u.y,l=Math.hypot(dx,dy)||1,w=r.widths[j];a.push({x:p.x-dy/l*w,y:p.y+dx/l*w});b.push({x:p.x+dy/l*w,y:p.y-dx/l*w});});r.poly=a.concat(b.reverse());return r;
});
let previewTerrainImage;
const beforePreviewActivate=activateAtlasGeometry;
activateAtlasGeometry=function(id){
 let revision=id!=='west'?0:creatingBasin158||S?.mapId!=='west'?3:S?.basinTerrain158>=3?3:S?.basinTerrain158===2?2:S?.basinTerrain158===1?1:0;
 if(revision!==activeBasinRevision158){westRangesPreview.splice(0,westRangesPreview.length,...atlasClone(revision===3?westRangesJoined1512:revision===2?westRangesRestored1510:revision===1?westRangesExpanded158:westRangesLegacy158));previewTerrainImage=null;activeBasinRevision158=revision;}
 let r=beforePreviewActivate(id);if(id==='west'){mountainPolygons.splice(0,mountainPolygons.length,...westRangesPreview.map(r=>r.poly));terrainCache=null;gridCache=null;growthStateRef=null;studyGeomMemo.clear();geometryMemo.clear();crossingCache.clear();}return r;
};
function makeReliefPreview(){let b=mapSpec.bounds,c=document.createElement('canvas'),cw=1120,ch=840;c.width=cw;c.height=ch;let cc=c.getContext('2d'),img=cc.createImageData(cw,ch),heights=new Float32Array(cw*ch),segs=[];
 for(let r of westRangesPreview)for(let i=1;i<r.path.length;i++){let a=r.path[i-1],b=r.path[i];segs.push({ax:a.x,ay:a.y,dx:b.x-a.x,dy:b.y-a.y,l2:(b.x-a.x)**2+(b.y-a.y)**2,w:(r.widths[i]+r.widths[i-1])/2,h:r.h});}
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){let wx=b.xmin+x*(b.xmax-b.xmin)/cw,wy=b.ymin+y*(b.ymax-b.ymin)/ch,z=0;for(let s of segs){if(wx<s.ax-s.w-70||wx>s.ax+s.dx+s.w+70){let bx=s.ax+s.dx;if(wx<Math.min(s.ax,bx)-s.w-70||wx>Math.max(s.ax,bx)+s.w+70)continue;}let t=Math.max(0,Math.min(1,((wx-s.ax)*s.dx+(wy-s.ay)*s.dy)/s.l2)),d=Math.hypot(wx-s.ax-t*s.dx,wy-s.ay-t*s.dy),q=Math.max(0,1-d/(s.w*1.18));z=Math.max(z,Math.pow(q,1.65)*s.h);}
 let n=Math.sin(wx*.037+wy*.023+Math.sin(wy*.043)*1.5)*.07+Math.cos(wy*.071-wx*.029+Math.cos(wx*.018))*.04;
 heights[y*cw+x]=Math.max(0,z*(1+n));}
 for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){let i=y*cw+x,z=heights[i],gx=(heights[y*cw+Math.min(cw-1,x+1)]-heights[y*cw+Math.max(0,x-1)])*15,gy=(heights[Math.min(ch-1,y+1)*cw+x]-heights[Math.max(0,y-1)*cw+x])*15,light=Math.max(-.22,Math.min(.22,(-gx-gy)*.30)),t=Math.min(1,z*2.9),floor=[230,237,218],mount=[158,180,151],peak=[202,209,180];let col=mount.map((v,j)=>v+(peak[j]-v)*Math.max(0,(z-.4)/.65));let contour=z>.05&&Math.floor(z*25)!==Math.floor((z+.005)*25)?-2:0;
 for(let j=0;j<3;j++)img.data[i*4+j]=floor[j]+(col[j]-floor[j])*t+light*120*t+contour;img.data[i*4+3]=255;}
 cc.putImageData(img,0,0);
 // Joined faceted slopes, rather than repeated mountain icons.
 const step=12,rows=Math.ceil(ch/step)+1,cols=Math.ceil(cw/step)+1,mesh=[];
 function rnd(a,b){let n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n);}
 for(let y=0;y<=rows;y++){let row=[];for(let x=0;x<=cols;x++){let px=x*step+(rnd(x,y)-.5)*step*.85,py=y*step+(rnd(y+17,x)-.5)*step*.85;let ix=Math.max(0,Math.min(cw-1,Math.round(px))),iy=Math.max(0,Math.min(ch-1,Math.round(py)));row.push({x:px,y:py,z:heights[iy*cw+ix]});}mesh.push(row);}
 function face(a,b,d){let z=(a.z+b.z+d.z)/3;if(z<.07)return;let ux=b.x-a.x,uy=b.y-a.y,uz=(b.z-a.z)*130,vx=d.x-a.x,vy=d.y-a.y,vz=(d.z-a.z)*130,nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;if(nz<0){nx=-nx;ny=-ny;nz=-nz;}let l=Math.hypot(nx,ny,nz),light=(nx*-.55+ny*-.45+nz*.7)/l,shade=(light-.6)*38,t=Math.min(1,z*2.5),base=[157,179,150],peak=[203,210,184],floor=[230,237,218];let rgb=base.map((v,j)=>Math.round(floor[j]+((v+(peak[j]-v)*Math.max(0,(z-.45)/.6))+shade-floor[j])*t));cc.fillStyle='rgb('+rgb.join(',')+')';cc.beginPath();cc.moveTo(a.x,a.y);cc.lineTo(b.x,b.y);cc.lineTo(d.x,d.y);cc.closePath();cc.fill();cc.strokeStyle=cc.fillStyle;cc.lineWidth=.65;cc.stroke();}
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){let a=mesh[y][x],b=mesh[y][x+1],d=mesh[y+1][x],e=mesh[y+1][x+1];if((x+y)%2){face(a,b,d);face(b,e,d);}else{face(a,b,e);face(a,e,d);}}
 return c;}
paintTerrain=function(){if(mapSpec.id!=='west')return terrainBefore14();ctx.save();if(!previewTerrainImage)previewTerrainImage=makeReliefPreview();let bounds=mapSpec.bounds;ctx.drawImage(previewTerrainImage,bounds.xmin,bounds.ymin,bounds.xmax-bounds.xmin,bounds.ymax-bounds.ymin);
 // Valley floors follow the same river clearance as the live tunnel calculations.
 for(let e of hills){contourPath(e);ctx.fillStyle='#c6d5ae';ctx.fill();for(let k=1;k<5;k++){contourPath(e,1-k*.18,-k*3,-k*4);ctx.fillStyle=['#c6d5ae','#cfddba','#d7e2c3','#dfe8cd','#e7ecd8'][k];ctx.fill();}}
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';for(let p of [mapSpec.main,...mapSpec.branches]){atlasRiverPath(p);ctx.strokeStyle='#dfe8d0';ctx.lineWidth=62;ctx.stroke();}ctx.restore();atlasWater();
 for(let y=-200;y<1150;y+=83)for(let x=-900;x<1150;x+=93){if(Math.sin(x*.019+y*.013)+Math.cos(y*.027-x*.011)<1.25||riverDistance({x,y})<53||mountainDistance({x,y})<28)continue;for(let k=0;k<3;k++)artTree(x+k*9,y+Math.sin(k*4)*6,.65,true);}
 text('中 央 盆 地',100,180,23,'#8d9e82');text('外 围 平 原',-825,800,23,'#7d9477');text('外 围 平 原',1040,630,23,'#7d9477');text('东 南 山 口',760,820,22,'#657f68');ctx.restore();};

// Actual playtest reset: preserve all standard gameplay and per-map save flows.
const resetBeforeBasinWeb=reset;
reset=function(...args){creatingBasin158=true;try{let result=resetBeforeBasinWeb(...args);if(S.mapId==='west'){S.points=STARTING_FUNDS.west;S.basinTerrain158=3;S.basinPlaytest={version:4};S.cities.forEach((c,i)=>{let p=basinWest14.start[i];if(p)Object.assign(c,{x:p[0],y:p[1]});});activateAtlasGeometry('west');save();updateUI();}return result;}finally{creatingBasin158=false;}};
const thumbBeforeBasinWeb=atlasThumbnail;
atlasThumbnail=function(id){if(id!=='west')return thumbBeforeBasinWeb(id);let s='<svg viewBox="-1000 -300 2200 1500" role="img" aria-label="中央盆地与外围平原"><rect x="-1000" y="-300" width="2200" height="1500" fill="#e6edda"/>';for(let r of westRangesJoined1512)s+='<polygon points="'+r.poly.map(p=>p.x+','+p.y).join(' ')+'" fill="#9fb297"/>';for(let pts of [basinWest14.main,...basinWest14.branches])s+='<polyline points="'+smoothRiver128(pts).map(p=>p.join(',')).join(' ')+'" fill="none" stroke="#80b8b7" stroke-width="22" stroke-linejoin="round"/>';return s+'</svg>';};
let westCardBasin=$('atlas-card-west');if(westCardBasin){westCardBasin.querySelector('.atlas-terrain').innerHTML=atlasThumbnail('west');westCardBasin.querySelector('p').innerHTML='中央盆地 · 东南山口 · 外围平原<br>开局 ¥8000，跨山连接第三座城市。';}
let titleBasin=document.querySelector('.atlas-heading h1');if(titleBasin)titleBasin.textContent='让城市，彼此相连。';
let introBasin=document.querySelector('.atlas-heading p');if(introBasin)introBasin.textContent='西部新地图已就绪，开始你的旅程。';
if(S?.mapId==='west')activateAtlasGeometry('west');
// Select West in the menu, never start/reset automatically.
requestAnimationFrame(()=>{if(atlasMenuOpen){atlasSelect('west');atlasRefreshCards();}});
