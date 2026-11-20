const assert=require('node:assert/strict'),g=require('./harness156.cjs')({legacyTerrain166:true}),{run}=g;
for(const type of ['bus','emu','rail','air','ship','ferry']){
 run(`activateAtlasGeometry('ocean');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.points=100000;S.day=200;S.delivered=1000;checkUnlocks();S.cities.forEach(c=>c.dormant=false);if(isMarine16('${type}')){buildHarbor16(0);buildHarbor16(1);}S.lines=[{id:101,type:'${type}',stops:[0,1],name:'test',color:'#333'}];S.vehicles=[];S.inventory['${type}']=3;addVehicle(101,false);addVehicle(101,false);addVehicle(101,false);var testline=S.lines[0];S.vehicles[0].service={mode:'all'};save();load();testline=S.lines[0];`);
 for(let i=0;i<3;i++)for(let idx=0;idx<2;idx++){
  run(`var vtest=S.vehicles[${i}];vtest.index=${idx};vtest.dir=${idx===0?1:-1};vtest.people=[];vtest.t=0;delete vtest.dock16;var targettest=${1-idx};S.cities[${idx}].q=Array.from({length:3},()=>({origin:${idx},dest:targettest,fixedDestination:true,color:S.cities[targettest].color,shape:S.cities[targettest].shape,ready:0,wait:10,legs:{}}));arrival(vtest,testline);if(isMarine16(vtest.type))for(let j=0;j<8;j++)tickMarine16(vtest,testline,.5);`);
  assert(run('vtest.people.length>0'),type+' vehicle '+i+' at '+idx);
 }
 console.log('PASS '+type+' three vehicles, equivalent schedules, both directions');
}
g.dom.window.close();
