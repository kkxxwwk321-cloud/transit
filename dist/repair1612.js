'use strict';
// Only the camera/scenic apron changes. Physical bounds, spawn geometry and saved coordinates do not.
function cameraBounds1612(){return mapSpec.bounds;}
function cameraBand1612(){const band=fitBand();return {top:Math.max(0,Math.min(H-120,band.top)),bottom:Math.max(band.top+100,Math.min(H,band.bottom))};}
const minBefore1612=portraitMinScale,maxBefore1612=portraitMaxScale,clampBefore1612=clampPortraitCamera;
// Use a stable HUD-to-dock viewport, independent of temporary sheets/tutorials.
function cameraPlayBand1616(height=H){
 const top=Math.max(0,Math.min(height-1,portraitRect('header')?.bottom??60));
 const bottom=Math.max(top+1,Math.min(height,portraitRect('footer')?.top??height-65));
 return {top,bottom};
}
portraitMinScale=function(width=W,height=H){
 if(!activeAtlasMap)return minBefore1612(width,height);
 const b=cameraBounds1612(),band=cameraPlayBand1616(height);
 return Math.max(width/(b.xmax-b.xmin),(band.bottom-band.top)/(b.ymax-b.ymin));
};
portraitMaxScale=function(){return activeAtlasMap?Math.max(portraitMinScale(),1.8):maxBefore1612();};
clampPortraitCamera=function(target=view){
 if(!activeAtlasMap||!W||!H)return clampBefore1612(target);
 const b=cameraBounds1612(),band=cameraPlayBand1616();target.scale=Math.max(portraitMinScale(),Math.min(portraitMaxScale(),Number.isFinite(target.scale)?target.scale:1));const s=target.scale;
 for(const [axis,lo,hi,start,end]of [['x','xmin','xmax',0,W],['y','ymin','ymax',band.top,band.bottom]]){
  const extent=(b[hi]-b[lo])*s,mid=(start+end)/2-(b[lo]+b[hi])/2*s;
  // Keep the detailed painting covering the play viewport at every zoom.
  const pad=0;
  target[axis]=extent<=end-start?mid:Math.max(end-b[hi]*s-pad,Math.min(start-b[lo]*s+pad,Number.isFinite(target[axis])?target[axis]:mid));
 }
 return target;
};
// Cheap cached edge colours extend each painting continuously into the scenic apron.
// Never stretch the detailed painting or change collision data; no hard north-green rectangle.
let apronImage1612=null,apronCanvas1612=null,apronBounds1612=null;
function apronSample1612(image,b){
 if(apronImage1612===image&&apronCanvas1612)return apronCanvas1612;
 const low=document.createElement('canvas');low.width=low.height=64;const p=low.getContext('2d');p.drawImage(image,0,0,64,64);const data=p.getImageData(0,0,64,64).data;
 const blur=(x,y)=>{const rgb=[0,0,0];let n=0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const k=(Math.max(0,Math.min(63,Math.round(y)+dy))*64+Math.max(0,Math.min(63,Math.round(x)+dx)))*4;for(let c=0;c<3;c++)rgb[c]+=data[k+c];n++;}return rgb.map(v=>v/n);};
 const smooth=new Float32Array(64*64*3);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const v=blur(x,y),k=(y*64+x)*3;smooth.set(v,k);}
 const sample=(x,y)=>{const k=(Math.max(0,Math.min(63,Math.round(y)))*64+Math.max(0,Math.min(63,Math.round(x))))*3;return [smooth[k],smooth[k+1],smooth[k+2]];};
 const mean=(axis,pos)=>{const rgb=[0,0,0];for(let i=0;i<64;i++){const v=axis==='x'?sample(pos,i):sample(i,pos);for(let c=0;c<3;c++)rgb[c]+=v[c]/64;}return rgb;};
 const edges={left:mean('x',0),right:mean('x',63),top:mean('y',0),bottom:mean('y',63)},w=b.xmax-b.xmin,h=b.ymax-b.ymin,pad=Math.max(w,h)*3;
 const bounds={left:b.xmin-pad,top:b.ymin-pad,width:w+pad*2,height:h+pad*2};
 const c=document.createElement('canvas');c.width=c.height=384;const q=c.getContext('2d'),out=q.createImageData(c.width,c.height);
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){
  const wx=bounds.left+x/(c.width-1)*bounds.width,wy=bounds.top+y/(c.height-1)*bounds.height,px=Math.max(b.xmin,Math.min(b.xmax,wx)),py=Math.max(b.ymin,Math.min(b.ymax,wy)),dx=Math.abs(wx-px),dy=Math.abs(wy-py),dist=Math.hypot(dx,dy),edge=sample((px-b.xmin)/w*63,(py-b.ymin)/h*63);
  const ex=wx<b.xmin?edges.left:edges.right,ey=wy<b.ymin?edges.top:edges.bottom,weight=Math.max(1,dx+dy),fade=Math.min(1,dist/(Math.max(w,h)*.065));
  const noise=(Math.sin(wx*.014+Math.sin(wy*.011)*2)+Math.sin(wy*.021+wx*.008))*(S.mapId==='ocean'?1.1:2.3);
  const k=(y*c.width+x)*4;for(let ch=0;ch<3;ch++){const far=(ex[ch]*dx+ey[ch]*dy)/weight;out.data[k+ch]=edge[ch]*(1-fade)+far*fade+noise;}out.data[k+3]=255;
 }
 q.putImageData(out,0,0);apronImage1612=image;apronCanvas1612=c;apronBounds1612=bounds;return c;
}
function drawApron1612(image,b,r){
 const c=apronSample1612(image,b),a=apronBounds1612;ctx.drawImage(c,a.left,a.top,a.width,a.height);
}
const terrainBefore1612=drawTerrain;
drawTerrain=function(){
 if(typeof newAtlas167!=='function'||!newAtlas167())return terrainBefore1612();const image=mapImage168(S.mapId,S.terrainRevision167);if(!image?.naturalWidth)return terrainBefore1612();
 const b=terrain167().bounds,r=worldViewportRect(),outside=r.left<b.xmin||r.right>b.xmax||r.top<b.ymin||r.bottom>b.ymax;
 ctx.save();try{ctx.imageSmoothingEnabled=true;if(outside)drawApron1612(image,b,r);ctx.drawImage(outside?featheredPainting168(image):image,b.xmin,b.ymin,b.xmax-b.xmin,b.ymax-b.ymin);}finally{ctx.restore();}
};
// An accidental third touch must not replace an active two-finger gesture.
const ignoredTouches1612=new Set(),pointerBefore1612=beginPointer,finishBefore1612=finishPointer;
beginPointer=function(e){if(pointers.size>=2&&!pointers.has(e.pointerId)){ignoredTouches1612.add(e.pointerId);e.preventDefault?.();return;}return pointerBefore1612(e);};
finishPointer=function(e){if(ignoredTouches1612.delete(e.pointerId))return;return finishBefore1612(e);};
// No cross-game ghost, elastic cursor or snap survives cancel/load/restart/recovery.
function clearEditVisuals1612(id=null){
 routeGhosts=id===null?[]:routeGhosts.filter(g=>g.line?.id!==id&&!g.preview);
 harborPointer164=null;ignoredTouches1612.clear();uxStrokeTrail=[];uxStrokeSpeed=0;portLayoutMemo164=null;
 invalidateRouteDrawing161();
}
const cancelBefore1612=cancelDraft;
cancelDraft=function(...args){const id=draft?.original??draft?.id;const r=cancelBefore1612(...args);clearEditVisuals1612(id??null);return r;};
const transientBefore1612=clearTransient13;
clearTransient13=function(...args){const r=transientBefore1612(...args);clearEditVisuals1612();uxStopPick=null;return r;};
// Use visible curves for the touch corridor, including narrow bends at high zoom.
const distanceBefore1612=displayLineDistance;
displayLineDistance=function(p,a,b,l){
 if(!a||!b||a.removed||b.removed||S.blockages[key(a,b,l.type)]?.status==='broken')return Infinity;
 if(isMarine16(l.type))return distanceBefore1612(p,a,b,l);
 const pieces=Math.min(256,Math.max(32,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)*Math.min(2,view.scale)/12)));
 let distance=Infinity,prev=lanePoint(a,b,l,0);
 for(let i=1;i<=pieces;i++){const next=lanePoint(a,b,l,i/pieces);distance=Math.min(distance,segDist(p,prev,next));prev=next;}return distance;
};
// The facility row is the same city-owned entry point as the existing farm sheet.
function installRepairs1612(){
 if(installRepairs1612.done)return;installRepairs1612.done=true;
 const details=showDetails;
 showDetails=function(...args){
  const result=details.apply(this,args),el=$('details'),c=['city','stop'].includes(selected?.type)&&S.cities[selected.id];
  if(!c||c.removed||c.kind==='bridgehead'||c.shape!==0||el.hidden)return result;
  let strip=el.querySelector(':scope > .ux-fac-strip');
  if(!strip){strip=document.createElement('div');strip.className='ux-fac-strip';strip.innerHTML='<span>设施</span>';(el.querySelector(':scope > .ux-load')||el.querySelector(':scope > .detail-sub'))?.after(strip);}
  const state=!farmEligible(c)?'中级开放':c.farm?.crop?'生长中 · '+Math.max(0,Math.ceil(c.farm.crop.due-S.day))+'天':c.farm?'待种植':'¥800 / 轮';
  const disabled=(!farmEligible(c)||!!c.dormant||S.lives<=0)&&!c.farm,signature=[c.id,state,farmStageName(c),!!disabled].join('|'),old=strip.querySelector('.farm-chip1612');
  if(old?.dataset.state===signature&&old.cityOwner1612===c)return result;
  old?.remove();const button=document.createElement('button');button.className='farm-chip1612';button.type='button';button.dataset.state=signature;button.cityOwner1612=c;
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h16M12 19V8M12 12C5 12 5 5 5 5s7 0 7 7Zm0 3c7 0 7-7 7-7s-7 0-7 7Z"/></svg><small>农田</small><em>'+state+'</em>';
  button.title='农田 · '+farmStageName(c);button.disabled=disabled;
  button.onclick=e=>{e.stopPropagation();showFarm(c.id);};
  const harbor=strip.querySelector('.ux-harbor');if(harbor)harbor.after(button);else strip.querySelector(':scope > span').after(button);
  return result;
 };
}
const lateBefore1612=uxLate;
uxLate=function(...args){const r=lateBefore1612(...args);installRepairs1612();return r;};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installRepairs1612);else installRepairs1612();
