/* Mountain ground footprints traced against the full basin painting (1448 × 1086).
   These describe slope feet on the ground, not the projected tops of tall peaks. */
const westPaintedFootprints=[
 [[0,0],[774,0],[775,120],[706,148],[624,130],[520,176],[451,213],[369,168],[294,207],[230,179],[170,230],[80,197],[0,218]],
 [[801,0],[1448,0],[1448,172],[1350,186],[1280,169],[1200,219],[1110,192],[1080,144],[1000,149],[960,164],[906,138],[853,117],[796,112]],
 [[0,230],[80,249],[143,285],[166,354],[140,408],[177,455],[168,515],[208,595],[223,647],[190,710],[215,755],[296,800],[330,862],[380,880],[365,970],[270,947],[212,908],[148,862],[80,805],[0,780]],
 [[178,776],[285,780],[375,836],[475,825],[568,821],[650,830],[718,790],[792,840],[873,888],[942,892],[1030,942],[1044,989],[1000,1017],[917,994],[849,983],[770,1005],[707,990],[620,1028],[523,1000],[440,1010],[360,974],[295,953],[215,892]],
 [[1187,115],[1285,127],[1398,177],[1448,238],[1448,747],[1370,799],[1295,744],[1240,690],[1208,626],[1230,573],[1259,540],[1268,492],[1221,454],[1212,403],[1260,360],[1292,295],[1240,244],[1200,232],[1150,199]],
 [[328,80],[457,116],[401,204],[414,258],[486,296],[543,319],[592,355],[578,405],[520,391],[449,351],[382,320],[337,283],[303,238],[310,164]],
 [[942,90],[1008,140],[1000,195],[980,244],[950,305],[909,316],[911,260],[894,235],[914,189],[910,131]],
 [[145,465],[236,495],[310,492],[375,517],[445,540],[512,535],[560,535],[607,530],[650,505],[680,499],[710,518],[703,548],[660,578],[602,580],[530,590],[460,593],[390,581],[320,576],[260,608],[190,595],[138,566]],
 [[1260,447],[1175,437],[1125,439],[1070,471],[997,462],[927,489],[897,507],[939,532],[1008,529],[1098,520],[1162,542],[1250,574],[1290,516]],
 [[732,839],[708,784],[718,729],[760,699],[772,652],[798,615],[845,612],[864,653],[877,688],[861,739],[835,779],[803,838]]
];
function calibrateWestPainting(){
 if(mapSpec.id!=='west'||!S.terrainArt166)return;
 const b=mapSpec.bounds;
 const footprints=westPaintedFootprints.map(polygon=>polygon.map(([x,y])=>({x:b.xmin+x/1448*(b.xmax-b.xmin),y:b.ymin+y/1086*(b.ymax-b.ymin)})));
 mountainPolygons.splice(0,mountainPolygons.length,...footprints);
 studyGeomMemo.clear();geometryMemo.clear();crossingCache.clear();
 basinGraphWeb=null;basinPathsWeb.clear();gridCache=null;growthStateRef=null;
 terrainCache=null;
}
const paintedActivateBase=activateAtlasGeometry;
activateAtlasGeometry=function(id){const result=paintedActivateBase(id);if(id==='west')calibrateWestPainting();return result;};
if(mapSpec.id==='west')calibrateWestPainting();

const resetArtBefore166=reset;
reset=function(...a){let r=resetArtBefore166(...a);if(S.mapId==='west'){S.terrainArt166=1;activateAtlasGeometry('west');save();}return r;};
const westImage166=new Image();westImage166.src='west-continuous-painted.png';
westImage166.addEventListener('load',()=>{terrainCache=null;});
const paintBefore166=paintTerrain;
paintTerrain=function(...args){if(mapSpec.id!=='west'||!S.terrainArt166||!westImage166.naturalWidth)return paintBefore166(...args);const b=mapSpec.bounds;ctx.drawImage(westImage166,b.xmin,b.ymin,b.xmax-b.xmin,b.ymax-b.ymin);};

const westCard166=document.querySelector('#atlas-card-west .atlas-terrain');
if(westCard166)westCard166.innerHTML='<img src="west-continuous-painted.png" alt="西部环山盆地与五条内部山脉" style="width:100%;height:100%;object-fit:cover">';
