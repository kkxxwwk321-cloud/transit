const assert=require('node:assert/strict');
const g=require('./harness156.cjs')(),{run,w}=g;
let vw=390,vh=844;
w.HTMLElement.prototype.getBoundingClientRect=function(){const top=this.tagName==='HEADER'?0:this.tagName==='FOOTER'?vh-110:vh-180;return {left:0,right:vw,top,bottom:top+(this.tagName==='HEADER'?80:110),width:vw,height:110};};
for(const map of ['east','west','ocean']){
 run(`activateAtlasGeometry('${map}');reset();atlasMenuOpen=false;closeModal();clearSelection();`);
 for(const [width,height]of [[360,800],[390,844],[430,956],[920,2048],[844,390]]){
  vw=width;vh=height;run(`W=${width};H=${height};`);
  for(const scale of [1e-8,.5,1.8,1e8])for(const dir of [-1,1]){
   run(`Object.assign(view,{scale:${scale},x:${dir}*1e8,y:${dir}*1e8});clampPortraitCamera();var bb16=cameraBounds1612(),band16=cameraPlayBand1616(),tl16=toScreen({x:bb16.xmin,y:bb16.ymin}),br16=toScreen({x:bb16.xmax,y:bb16.ymax});`);
   assert(run('tl16.x<=.001&&br16.x>=W-.001&&tl16.y<=band16.top+.001&&br16.y>=band16.bottom-.001'),`${map} ${width}x${height} exposed filling`);
  }
  run(`fit();var minimum16=portraitMinScale();$('details').hidden=false;`);
  assert.equal(run('portraitMinScale()'),run('minimum16'));run(`$('details').hidden=true;`);
  run('save();load();clampPortraitCamera();render();');assert.equal(run('runtimeFault13'),null);
 }
 console.log('PASS '+map+': minimum zoom, extreme panning, resize, panel stability and save/load');
}
assert.deepEqual(g.errors,[]);g.dom.window.close();
