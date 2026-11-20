/* Keep simulation stopped until the selected map has a complete first frame. */
let mapLoading166=false;
const mapLoadPanel166=document.createElement('section');mapLoadPanel166.id='map-loading166';mapLoadPanel166.hidden=true;mapLoadPanel166.setAttribute('role','status');mapLoadPanel166.innerHTML='<strong>正在加载地图</strong><p></p><div class="map-load-track166"><i></i></div>';document.body.append(mapLoadPanel166);
function mapLoadStage166(text){mapLoadPanel166.querySelector('p').textContent=text;}
function waitMapImage166(image){return new Promise(resolve=>{if(image.complete)return resolve(!!image.naturalWidth);const done=()=>{image.removeEventListener('load',ok);image.removeEventListener('error',fail);resolve(!!image.naturalWidth);};const ok=done,fail=done;image.addEventListener('load',ok,{once:true});image.addEventListener('error',fail,{once:true});});}
function mapFrame166(){return new Promise(resolve=>requestAnimationFrame(resolve));}
const enterMapBefore166=startAtlasMap;
startAtlasMap=async function(...args){
 if(mapLoading166)return;
 const selectedMap166=atlasSelected,restart166=atlasRestart;
 mapLoading166=true;mapLoadPanel166.hidden=false;S.paused=true;
 try{
  mapLoadStage166('准备地图资源…');await mapFrame166();await mapFrame166();
  const savedMap166=selectedMap166===S.mapId&&!restart166?S:atlasSaved(selectedMap166);
  const freshTerrain167=typeof terrainImages167==='object'&&(restart166||!savedMap166?.lives||[1,2].includes(savedMap166.terrainRevision167));
  const images=freshTerrain167?[typeof mapImage168==='function'?mapImage168(selectedMap166,restart166||!savedMap166?.lives?2:savedMap166.terrainRevision167):terrainImages167[selectedMap166]]:selectedMap166==='west'?[westImage166]:selectedMap166==='ocean'?[sampleArtImage,oceanBase166]:[];
  const loaded=await Promise.all(images.map(waitMapImage166));
  if(freshTerrain167&&loaded.some(ok=>!ok))throw Error('地图资源加载失败');
  mapLoadStage166('恢复存档与交通网络…');await mapFrame166();
  animateView.id=(animateView.id||0)+1;atlasSelected=selectedMap166;atlasRestart=restart166;try{enterMapBefore166(...args);}finally{atlasRestart=false;}const running=!S.paused;S.paused=true;
  mapLoadStage166('绘制地形与城市…');await mapFrame166();resize();fit();terrainCache=null;ctx.save();try{ctx.setTransform(1,0,0,1,0,0);drawTerrain();}finally{ctx.restore();}await mapFrame166();await mapFrame166();
  mapLoadPanel166.hidden=true;mapLoading166=false;
  if(running&&!modalOpen&&!atlasMenuOpen&&!runtimeFault13)S.paused=false;
  if(loaded.some(ok=>!ok))toast('部分地图画面加载失败，已使用基础地形，可刷新重试');
  updateUI();
 }catch(error){mapLoading166=false;S.paused=true;mapLoadStage166('加载未完成，请重新载入。存档会保留。');const retry=document.createElement('button');retry.textContent='重新加载';retry.onclick=()=>location.reload();mapLoadPanel166.append(retry);console.error(error);}
};
$('atlas-start').onclick=startAtlasMap;
