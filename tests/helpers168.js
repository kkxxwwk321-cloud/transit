function findBridgeFixture168(minLegacyDistance=0){
 for(let k=0;k<terrain167().water.length;k++){const poly=terrain167().water[k];for(let i=0;i<poly.length;i+=3){const p={x:poly[i][0],y:poly[i][1]},a=bank168(p,k);if(!a)continue;const old=nearestRiverBefore168(a);if(minLegacyDistance&&old&&old.d<minLegacyDistance)continue;for(let angle=0;angle<Math.PI*2;angle+=Math.PI/8)for(let length=35;length<=220;length+=10){const q={x:a.x+Math.cos(angle)*length,y:a.y+Math.sin(angle)*length};if(fresh167(q))continue;const b=bank168(q,k);if(!b||Math.hypot(a.x-b.x,a.y-b.y)<30)continue;if(bridgeTerrainIssue(a,b)===null)return{a,b};}}}
 return null;
}
