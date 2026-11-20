'use strict';
// Camera limits include a scenic apron. Only mapSpec.bounds can spawn cities.
const PORTRAIT_SCENIC_MARGIN=600;
let portraitReady=false,portraitResizeFrame=0,portraitSeenSelection='';
function setPortraitCss(name,value){let s=document.documentElement.style;if(s.getPropertyValue(name)!==value)s.setProperty(name,value);}
function portraitBounds(){let b=activeAtlasMap?mapSpec.bounds:{xmin:-1000,xmax:1600,ymin:-400,ymax:1400};return{xmin:b.xmin-PORTRAIT_SCENIC_MARGIN,xmax:b.xmax+PORTRAIT_SCENIC_MARGIN,ymin:b.ymin-PORTRAIT_SCENIC_MARGIN,ymax:b.ymax+PORTRAIT_SCENIC_MARGIN};}
function portraitMinScale(width=W,height=H){let b=portraitBounds();return Math.max(width/(b.xmax-b.xmin),height/(b.ymax-b.ymin));}
function portraitMaxScale(){return Math.max(3.5,portraitMinScale());}
function clampPortraitCamera(target=view){if(!W||!H)return target;let b=portraitBounds();target.scale=Math.max(portraitMinScale(),Math.min(portraitMaxScale(),Number.isFinite(target.scale)?target.scale:1));let s=target.scale;target.x=Math.max(W-b.xmax*s,Math.min(-b.xmin*s,Number.isFinite(target.x)?target.x:0));target.y=Math.max(H-b.ymax*s,Math.min(-b.ymin*s,Number.isFinite(target.y)?target.y:0));return target;}
minScale=()=>portraitMinScale();
function portraitRect(selector){let e=document.querySelector?.(selector);if(!e||e.hidden||e.offsetParent===null||typeof e.getBoundingClientRect!=='function')return null;let r=e.getBoundingClientRect();return r.width>0&&r.height>0?r:null;}
fitBand=function(){let top=portraitRect('header')?.bottom??110,bottom=(portraitRect('footer')?.top??H-65)-8;for(let s of ['#routes','#details','#drawbar']){let r=portraitRect(s);if(r&&r.top>top)bottom=Math.min(bottom,r.top-8);}return {top:Math.min(H-1,top+8),bottom:Math.max(Math.min(H-1,top+9),Math.min(H,bottom)),side:16};};
// Note: keep shell focus in the existing restore session — .agents/notes/implemented/feature/2026-11-08-design-pass.md
function portraitFocusCity(c){if(!c||c.removed||pointers.size)return;let band=fitBand(),b=portraitBounds(),x=W/2,y=(band.top+band.bottom)/2,s=Math.max(view.scale,.7,portraitMinScale(),x/Math.max(1,c.x-b.xmin),(W-x)/Math.max(1,b.xmax-c.x),y/Math.max(1,c.y-b.ymin),(H-y)/Math.max(1,b.ymax-c.y));uxAutoMove(()=>animateView(clampPortraitCamera({scale:Math.min(portraitMaxScale(),s),x:x-c.x*s,y:y-c.y*s}),220));}
fit=function(){if(!W||!H)return;let cs=typeof S!=='undefined'&&S?realCities().filter(c=>!c.removed):[],band=fitBand();if(!cs.length){let b=portraitBounds(),s=portraitMinScale();Object.assign(view,clampPortraitCamera({scale:s,x:W/2-(b.xmin+b.xmax)/2*s,y:H/2-(b.ymin+b.ymax)/2*s}));return;}let x0=Math.min(...cs.map(c=>c.x))-85,x1=Math.max(...cs.map(c=>c.x))+85,y0=Math.min(...cs.map(c=>c.y))-105,y1=Math.max(...cs.map(c=>c.y))+85,s=Math.max(portraitMinScale(),Math.min(1.1,(W-band.side*2)/Math.max(1,x1-x0),(band.bottom-band.top)/Math.max(1,y1-y0)));Object.assign(view,clampPortraitCamera({scale:s,x:W/2-(x0+x1)/2*s,y:(band.top+band.bottom)/2-(y0+y1)/2*s}));};
const animateBeforePortrait=animateView;
animateView=function(t,ms=320){return animateBeforePortrait(clampPortraitCamera({...t}),ms);};
function measurePortraitUI(){let header=portraitRect('header'),footer=portraitRect('footer'),style=document.documentElement.style;if(header)setPortraitCss('--hud-bottom',Math.ceil(header.bottom)+'px');if(footer)setPortraitCss('--dock-height',Math.ceil(footer.height)+'px');clampPortraitCamera();}
resize=function(){let prevW=W,prevH=H,wx=Number.isFinite(W)&&view.scale?(W/2-view.x)/view.scale:null,wy=Number.isFinite(H)&&view.scale?(H/2-view.y)/view.scale:null,v=window.visualViewport;W=Math.max(1,Math.round(v?.width||document.documentElement.clientWidth||innerWidth));H=Math.max(1,Math.round(Math.min(v?.height||innerHeight,innerHeight)));portraitMode=true;view.rot=0;dpr=Math.min(2,devicePixelRatio||1);let style=document.documentElement.style;setPortraitCss('--app-w',W+'px');setPortraitCss('--app-h',H+'px');cv.style.width=W+'px';cv.style.height=H+'px';let cw=Math.round(W*dpr),ch=Math.round(H*dpr);if(cv.width!==cw)cv.width=cw;if(cv.height!==ch)cv.height=ch;measurePortraitUI();if(!portraitReady||wx===null||wy===null){fit();portraitReady=true;}else if(prevW!==W||prevH!==H){view.x=W/2-wx*view.scale;view.y=H/2-wy*view.scale;clampPortraitCamera();}syncOrientation();};
function schedulePortraitLayout(){if(portraitResizeFrame)return;portraitResizeFrame=requestAnimationFrame(()=>{portraitResizeFrame=0;resize();let id=selected?.type==='city'||selected?.type==='stop'?selected.id:null;if(id!==null&&!$('details').hidden&&!pointers.size)portraitFocusCity(S.cities[id]);});}
// A fixed-size terrain cache is retained; only visible scenic apron details are drawn.
function drawPortraitScenery(){if(!activeAtlasMap)return;let b=mapSpec.bounds,outer=portraitBounds(),left=Math.max(outer.xmin,-view.x/view.scale-30),right=Math.min(outer.xmax,(W-view.x)/view.scale+30),top=Math.max(outer.ymin,-view.y/view.scale-30),bottom=Math.min(outer.ymax,(H-view.y)/view.scale+30),pts=mapSpec.main,a=pts[0],z=pts.at(-1),a2=pts[1],z2=pts.at(-2),extA=[a[0]+(a[0]-a2[0])*4,a[1]+(a[1]-a2[1])*4],extZ=[z[0]+(z[0]-z2[0])*4,z[1]+(z[1]-z2[1])*4];ctx.save();ctx.fillStyle='#e6edda';ctx.fillRect(left-40,top-40,right-left+80,bottom-top+80);for(let y=Math.floor(top/145)*145;y<bottom;y+=145)for(let x=Math.floor(left/155)*155;x<right;x+=155){if(x>b.xmin-30&&x<b.xmax+30&&y>b.ymin-30&&y<b.ymax+30)continue;if(Math.sin(x*.013+y*.021)<.1)continue;let p={x,y};if(segDist(p,{x:a[0],y:a[1]},{x:extA[0],y:extA[1]})<55||segDist(p,{x:z[0],y:z[1]},{x:extZ[0],y:extZ[1]})<55)continue;for(let i=0;i<3;i++)artTree(x+i*12,y+Math.sin(i*5)*6,.85,mapSpec.id==='west');}ctx.lineJoin='round';ctx.lineCap='round';atlasRiverPath([extA,...pts,extZ]);for(let [w,c] of [[33,'#c3d4b4'],[25,'#e2d9b4'],[18,'#619ca5'],[15,'#85bfc0'],[7,'#abd8cd']]){ctx.lineWidth=w;ctx.strokeStyle=c;ctx.stroke();}ctx.restore();}
const drawBeforePortrait=drawTerrain;
drawTerrain=function(){if(!activeAtlasMap)return drawBeforePortrait();drawPortraitScenery();if(!terrainCache){let cache=document.createElement('canvas');cache.width=2640;cache.height=1800;let live=ctx;try{ctx=cache.getContext('2d');ctx.scale(1.2,1.2);ctx.translate(1000,300);paintTerrain();terrainCache=cache;}finally{ctx=live;}}ctx.drawImage(terrainCache,-1000,-300,2200,1500);};
const renderBeforePortrait=render;
render=function(){clampPortraitCamera();return renderBeforePortrait();};
const moveBeforePortrait=movePointer;
movePointer=function(e){moveBeforePortrait(e);clampPortraitCamera();};
const showBeforePortrait=showDetails;
showDetails=function(...args){showBeforePortrait(...args);let id=selected?.type==='city'||selected?.type==='stop'?selected.id:null,k=id===null?'':String(id);if(k!==portraitSeenSelection){portraitSeenSelection=k;schedulePortraitLayout();}};
const resetBeforePortrait=reset;
reset=function(){resetBeforePortrait();collapsePortraitRoutes();schedulePortraitLayout();};
function collapsePortraitRoutes(){let e=$('routes');e.classList.add('collapsed');$('collapse').textContent='+';$('collapse').setAttribute('aria-expanded','false');}
const closePanel=document.createElement('button');closePanel.className='portrait-modal-close';closePanel.textContent='×';closePanel.setAttribute('aria-label','关闭面板');closePanel.onclick=()=>closeModal();$('modal').appendChild(closePanel);
window.addEventListener('resize',schedulePortraitLayout);window.visualViewport?.addEventListener('resize',schedulePortraitLayout);
if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(schedulePortraitLayout);for(let selector of ['header','footer','#details','#routes','#drawbar']){let e=document.querySelector(selector);if(e)observer.observe(e);}}
if(typeof MutationObserver!=='undefined'){const observer=new MutationObserver(schedulePortraitLayout);observer.observe($('details'),{attributes:true,attributeFilter:['hidden'],childList:true});observer.observe(document.documentElement,{attributes:true,attributeFilter:['style']});}
collapsePortraitRoutes();resize();

// Per-map resume is explicit; an untouched automatically saved seed is not a played game.
function portraitCanResume(id){let s=atlasSaved(id);return !!(s&&s.lives>0&&(s.portraitStarted||s.day>0||s.lines?.length||s.delivered>0));}
const portraitRefreshCardsBefore=atlasRefreshCards;
atlasRefreshCards=function(){portraitRefreshCardsBefore();let saved=portraitCanResume(atlasSelected);$('atlas-start').textContent=saved?'继续游戏':'开始游戏';$('atlas-restart').hidden=!saved;let note=$('atlas-save-'+atlasSelected),s=atlasSaved(atlasSelected);if(note)note.textContent=saved?'已有第 '+(Math.floor(s.day)+1)+' 天存档':'从三座小城开始';};
const portraitStartMapBefore=startAtlasMap;
startAtlasMap=function(){portraitStartMapBefore();if(!atlasMenuOpen){S.portraitStarted=true;save();}};
function portraitResumeMap(){atlasRestart=false;startAtlasMap();}
function portraitAskRestart(){let id=atlasSelected;if(!portraitCanResume(id))return;hideAtlasMaps(false);openModal('<div class="modal-head"><h2>重新开始'+escapeHTML(ATLAS_MAPS[id].name)+'？</h2></div><p>确认后将清除这张地图的本局进度，最高存活记录会保留。另一张地图的存档不受影响。</p><div class="ux-actions"><button class="primary" onclick="portraitConfirmRestart(\''+id+'\')">确认重新开始</button><button onclick="portraitCancelRestart()">取消，保留存档</button></div>');}
function portraitCancelRestart(){closeModal();showAtlasMaps(false);}
function portraitConfirmRestart(id){if(!Object.prototype.hasOwnProperty.call(ATLAS_MAPS,id))return;atlasSelected=id;atlasRestart=true;try{startAtlasMap();}finally{atlasRestart=false;}}
const restartMapButton=document.createElement('button');restartMapButton.id='atlas-restart';restartMapButton.textContent='重新开始';restartMapButton.hidden=true;restartMapButton.onclick=portraitAskRestart;$('atlas-start').parentElement?.appendChild(restartMapButton);
$('atlas-start').onclick=portraitResumeMap;
atlasRefreshCards();
