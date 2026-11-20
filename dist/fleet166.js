const addFleetBefore166=addVehicle;
addVehicle=function(id,...a){const next=S.nextV,r=addFleetBefore166(id,...a);for(const v of S.vehicles)if(v.id>=next&&!isMarine16(v.type)){const l=vehicleLine(v);if(l)arrival(v,l);}return r;};
