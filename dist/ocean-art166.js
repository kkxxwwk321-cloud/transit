/* Local art trial. Raster terrain uses the game's exact coastline and lake paths. */
// Structured landforms with a continuous crest, lit flank and incised valleys.
// Subdivide lake outlines once at startup, sharing the new paths with water checks.
for(let lakeIndex=0;lakeIndex<lakePolygons161.length;lakeIndex++){
 const e=ATLAS_MAPS.ocean.lakes[lakeIndex];
 let points=LAKE_SHAPES161[lakeIndex].map(([x,y])=>[e.x+x*e.rx,e.y+y*e.ry]);
 for(let pass=0;pass<3;pass++){
  const next=[];
  for(let i=0;i<points.length;i++){
   const a=points[i],b=points[(i+1)%points.length];
   next.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75]);
  }
  points=next;
 }
 const polygon=lakePolygons161[lakeIndex];polygon.splice(0,polygon.length,...points);polygonIndexes161.delete(polygon);
}
landRouteCache161.clear();studyGeomMemo.clear();geometryMemo.clear();clearMarinePaths16();

const sampleArtImage=new Image();
sampleArtImage.src='terrain-art-source.png';
const oceanBase166=new Image();oceanBase166.src='ocean-base166.png';
const sampleArtTiles={};
function sampleArtTile(kind){
 if(sampleArtTiles[kind])return sampleArtTiles[kind];
 const es=kind==='mountain'?ATLAS_MAPS.ocean.mountains:ATLAS_MAPS.ocean.hills;
 const margin=kind==='mountain'?55:26;
 const left=Math.min(...es.map(e=>e.x-e.rx))-margin,right=Math.max(...es.map(e=>e.x+e.rx))+margin;
 const top=Math.min(...es.map(e=>e.y-e.ry)),bottom=Math.max(...es.map(e=>e.y+e.ry));
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(right-left);canvas.height=Math.ceil(bottom-top);
 const c=canvas.getContext('2d');
 const source=kind==='mountain'?[54,86,410,850]:[610,410,300,310];
 c.drawImage(sampleArtImage,...source,0,0,canvas.width,canvas.height);
 c.globalCompositeOperation='destination-in';
 // Feather the edge into the plain without drawing outside the physical relief.
 const mask=document.createElement('canvas');mask.width=canvas.width;mask.height=canvas.height;
 const m=mask.getContext('2d');
 if(kind==='mountain') {
  for(const e of es){m.save();m.translate(e.x-left,e.y-top);m.scale((e.rx+margin)/e.ry,1);const g=m.createRadialGradient(0,0,0,0,0,e.ry);g.addColorStop(0,'#fff');g.addColorStop(.80,'#fff');g.addColorStop(1,'#fff0');m.fillStyle=g;m.fillRect(-e.ry,-e.ry,e.ry*2,e.ry*2);m.restore();}
 } else {
  // One continuous slope envelope replaces the separate ellipse silhouettes.
  const pixels=m.createImageData(mask.width,mask.height);
  const first=es[0],last=es.at(-1);
  const smooth=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t);};
  for(let row=0;row<mask.height;row++){
   const worldY=top+row;
   const along=(worldY-first.y)/(last.y-first.y);
   const axis=first.x+(last.x-first.x)*along+Math.sin(worldY/210)*12;
   const width=first.rx+margin-8+Math.sin(worldY/190)*10;
   const endFade=smooth(row/210)*smooth((mask.height-row)/230);
   for(let column=0;column<mask.width;column++){
    const distance=Math.abs(left+column-axis)/width;
    const sideFade=1-smooth((distance-.22)/.92);
    const offset=(row*mask.width+column)*4;
    pixels.data[offset]=pixels.data[offset+1]=pixels.data[offset+2]=255;
    pixels.data[offset+3]=Math.round(255*sideFade*endFade*.92);
   }
  }
  m.putImageData(pixels,0,0);
 }
 if(kind==='mountain'){
  // Visible mountain footprint and tunnel intersection share these exact polygons.
  const footprint=document.createElement('canvas');footprint.width=canvas.width;footprint.height=canvas.height;
  const f=footprint.getContext('2d');f.fillStyle='#fff';
  for(const polygon of mountainPolygons){f.beginPath();polygon.forEach((point,index)=>index?f.lineTo(point.x-left,point.y-top):f.moveTo(point.x-left,point.y-top));f.closePath();f.fill();}
  m.globalCompositeOperation='destination-in';m.drawImage(footprint,0,0);
 }
 c.drawImage(mask,0,0);
 return sampleArtTiles[kind]={canvas,left,top};
}
function samplePaintArtRelief(){
 if(!sampleArtImage.naturalWidth)return;
 for(const kind of ['mountain','hill']){const tile=sampleArtTile(kind);ctx.drawImage(tile.canvas,tile.left,tile.top);}
}
const sampleOldPaint = paintOcean16;
let sampleBitmap = null;
function sampleNoise(x,y){
 const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
 const sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
 const hash=(a,b)=>{const v=Math.sin(a*127.1+b*311.7)*43758.5453;return v-Math.floor(v);};
 const a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);
 return (a+(b-a)*sx)*(1-sy)+(c+(d-c)*sx)*sy;
}
function sampleHeight(x,y){
 let hill=0,mountain=0;
 for(const e of ATLAS_MAPS.ocean.hills){
  const dx=(x-e.x-32*Math.sin(y/95))/e.rx,dy=(y-e.y)/e.ry;
  hill+=Math.exp(-(dx*dx*.72+dy*dy*1.2))*30;
 }
 for(const e of ATLAS_MAPS.ocean.mountains){
  const dx=(x-e.x-44*Math.sin(y/100))/(e.rx*1.2),dy=(y-e.y)/e.ry;
  mountain+=Math.exp(-(dx*dx*.9+dy*dy))*150;
 }
 const detail=sampleNoise(x/240,y/240);
 return hill*(.8+detail*.15)+mountain*(.65+detail*.12);
}
paintOcean16=function(){
 const b=ATLAS_MAPS.ocean.bounds;
 if(!sampleArtImage.naturalWidth||!oceanBase166.naturalWidth)return sampleOldPaint();
 sampleBitmap=oceanBase166;
 ctx.save();tracePolygon161(ATLAS_MAPS.ocean.coast);ctx.clip();
 ctx.drawImage(sampleBitmap,b.xmin,b.ymin,b.xmax-b.xmin,b.ymax-b.ymin);
 samplePaintArtRelief();
 // Sparse groups use different sizes and spacing, leaving the coastal plain clear.
 for(let y=330;y<2950;y+=73)for(let x=300;x<3300;x+=79){
  const n=terrainNoise162(x,y);if(n<.88)continue;
  const p={x:x+(n-.5)*85,y:y+terrainNoise162(y,x)*48};
  if(!land16(p)||shore16(p).d<180||sampleHeight(p.x,p.y)>110)continue;
  ctx.save();ctx.globalAlpha=.45;drawTree(p.x,p.y,.6+n*.25);drawTree(p.x+9,p.y-5,.55);ctx.restore();
 }
 ctx.restore();
 // Shallows follow precisely the coastline used for transport collision checks.
 ctx.save();tracePolygon161(ATLAS_MAPS.ocean.coast);ctx.rect(b.xmin-400,b.ymin-400,b.xmax-b.xmin+800,b.ymax-b.ymin+800);ctx.clip('evenodd');
 traceCoastReview162();ctx.lineJoin='round';ctx.lineCap='round';
 for(const [width,color] of [[68,'#8ec9ce'],[42,'#a2d1cf'],[23,'#bedbd0']]){ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();}
 ctx.restore();
 traceCoastReview162();ctx.lineWidth=7;ctx.strokeStyle='#efe3bb';ctx.stroke();ctx.lineWidth=1.3;ctx.strokeStyle='#c3c6a0';ctx.stroke();
 for(const lake of lakePolygons161){tracePolygon161(lake);ctx.fillStyle='#85bec5';ctx.fill();ctx.save();ctx.clip();ctx.lineWidth=17;ctx.strokeStyle='#b5d6cc';ctx.stroke();ctx.restore();ctx.lineWidth=1.3;ctx.strokeStyle='#70a8ad';ctx.stroke();}
};

for(const image of [sampleArtImage,oceanBase166])image.addEventListener("load",()=>{terrainCache=null;});
