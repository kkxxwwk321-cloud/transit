/* Clip vehicle pixels against the same mountains and open river valleys used by
   tunnel construction. Each carriage can independently enter/leave a tunnel. */
let tunnelVehicleCanvas=null,tunnelMaskCanvas=null;
let tunnelFootprintOwner=null,tunnelFootprintBoxes=[];
function physicalTunnelAt(point){
 return !inRiverValley(point)&&mountainPolygons.some(polygon=>pointInPolygon(point,polygon));
}
const visibleVehicleBase=drawVehicle;
drawVehicle=function(vehicle,focus){
 if(!['bus','emu','rail'].includes(vehicle.type))return visibleVehicleBase(vehicle,focus);
 const head=vehiclePose(vehicle);if(!head)return;
 const bodyScale=Math.max(.95,Math.min(1.8,.95/view.scale));
 const poses=isTrain(head.l.type)?trainCarriagePoses(vehicle,17*bodyScale):[head];
 if(!poses.length)return;
 const padding=38*bodyScale;
 const left=Math.min(...poses.map(p=>p.x))-padding,right=Math.max(...poses.map(p=>p.x))+padding;
 const top=Math.min(...poses.map(p=>p.y))-padding,bottom=Math.max(...poses.map(p=>p.y))+padding;
 if(tunnelFootprintOwner!==mountainPolygons[0]||tunnelFootprintBoxes.length!==mountainPolygons.length){
  tunnelFootprintOwner=mountainPolygons[0];
  tunnelFootprintBoxes=mountainPolygons.map(polygon=>({polygon,left:Math.min(...polygon.map(p=>p.x)),right:Math.max(...polygon.map(p=>p.x)),top:Math.min(...polygon.map(p=>p.y)),bottom:Math.max(...polygon.map(p=>p.y))}));
 }
 // A small raster-space overlap closes antialias fringes on oblique boundaries
 // and shared edges between terrain tiles. It does not change tunnel geometry.
 const resolution=Math.max(1,Math.min(3,view.scale*(typeof dpr==='number'?dpr:1)));
 const edgeGuard=1.5/resolution;
 const polygons=tunnelFootprintBoxes.filter(box=>box.right+edgeGuard>=left&&box.left-edgeGuard<=right&&box.bottom+edgeGuard>=top&&box.top-edgeGuard<=bottom).map(box=>box.polygon);
 if(!polygons.length)return visibleVehicleBase(vehicle,focus);
 const width=Math.ceil((right-left)*resolution),height=Math.ceil((bottom-top)*resolution);
 tunnelVehicleCanvas??=document.createElement('canvas');tunnelMaskCanvas??=document.createElement('canvas');
 tunnelVehicleCanvas.width=tunnelMaskCanvas.width=width;tunnelVehicleCanvas.height=tunnelMaskCanvas.height=height;
 const layer=tunnelVehicleCanvas.getContext('2d'),mask=tunnelMaskCanvas.getContext('2d');
 layer.setTransform(resolution,0,0,resolution,-left*resolution,-top*resolution);
 const live=ctx;
 try{ctx=layer;visibleVehicleBase(vehicle,focus);}finally{ctx=live;}
 mask.setTransform(resolution,0,0,resolution,-left*resolution,-top*resolution);mask.fillStyle='#fff';
 mask.strokeStyle='#fff';mask.lineWidth=edgeGuard*2;mask.lineJoin='round';
 for(const polygon of polygons){mask.beginPath();polygon.forEach((p,i)=>i?mask.lineTo(p.x,p.y):mask.moveTo(p.x,p.y));mask.closePath();mask.fill();mask.stroke();}
 // River valley is a real surface opening, not an underground tunnel.
 mask.globalCompositeOperation='destination-out';mask.strokeStyle='#fff';mask.lineWidth=64;mask.lineCap='round';
 if(typeof newAtlas167==='function'&&newAtlas167()){for(const polygon of terrain167().water){mask.beginPath();polygon.forEach(([x,y],i)=>i?mask.lineTo(x,y):mask.moveTo(x,y));mask.closePath();mask.fill();}}
 else if(activeAtlasMap){for(const segment of riverSegments){mask.beginPath();mask.moveTo(segment.a.x,segment.a.y);mask.lineTo(segment.b.x,segment.b.y);mask.stroke();}}
 else{mask.beginPath();riverValleyBanks[0].forEach((p,i)=>i?mask.lineTo(p.x,p.y):mask.moveTo(p.x,p.y));[...riverValleyBanks[1]].reverse().forEach(p=>mask.lineTo(p.x,p.y));mask.closePath();mask.fill();}
 layer.setTransform(1,0,0,1,0,0);layer.globalCompositeOperation='destination-out';layer.drawImage(tunnelMaskCanvas,0,0);
 live.save();live.drawImage(tunnelVehicleCanvas,left,top,right-left,bottom-top);live.restore();
};
