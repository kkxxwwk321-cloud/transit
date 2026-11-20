const assert=require('node:assert/strict'),create=require('./harness156.cjs');
const baseline=process.argv.includes('--baseline'),loop=process.argv.includes('--loop');
for(const type of baseline||loop?['bus']:['bus','emu','rail','air','ship','ferry']){
 const g=create(),{run}=g,sparse=process.argv.includes('--sparse');
 run(`activateAtlasGeometry('ocean');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;S.points=200000;S.day=130;S.delivered=1000;checkUnlocks();S.cities.forEach(c=>{c.dormant=false;c.grace=10000;c.q=[];});if(isMarine16('${type}')){buildHarbor16(0);buildHarbor16(2);}S.lines=[{id:101,type:'${type}',stops:isMarine16('${type}')?[0,2]:[0,1,2],name:'test',color:'#333'}];S.vehicles=[];S.inventory['${type}']=4;S.nextV=1;for(let i=0;i<3;i++)addVehicle(101,false);var testline=S.lines[0];if(${loop})testline.stops=[0,1,2,0];growthState().next=1e9;S.spawnDay=1e9;newPassenger=()=>{};S.paused=false;`);
 // Recreate an existing save with a perfectly bunched fleet, not just new additions.
 run(`for(const v of S.vehicles){v.index=0;v.dir=1;v.t=0;v.dwell=0;v.people=[];delete v.dock16;}var meter14={},seen14=new Map();function feed14(id,dest,count=10){for(let i=0;i<count;i++)S.cities[id].q.push({id:S.nextP++,origin:id,dest,fixedDestination:true,color:S.cities[dest].color,shape:S.cities[dest].shape,wait:10,ready:0,journey:0,legs:{}});}for(const v of S.vehicles){meter14[v.id]=0;seen14.set(v.id,new Set());}feed14(0,2,60);feed14(2,0,60);`);
 if(!['ship','ferry'].includes(type)){
  // Empty arrival, then a passenger arrives during dwell: it must board at departure.
  run(`S.cities[0].q=[];arrival(S.vehicles[0],testline);feed14(0,2,1);S.vehicles[0].dwell=0;var boardedLate14=prepareDeparture1614(S.vehicles[0],testline);`);
  assert(run('S.vehicles[0].people.length===1'),type+' missed dwell passenger');
  run(`for(const v of S.vehicles){v.index=0;v.dir=1;v.t=0;v.dwell=0;v.people=[];}S.cities[0].q=[];feed14(0,2,60);`);
 }
 if(sparse)run('S.cities.forEach(c=>c.q=[]);');
 if(baseline)run('prepareDeparture1614=()=>true;');
 // Real ticks, persistent both-way demand, and a reload in the middle of the run.
 run(`for(let step=0;step<1000;step++){if(modalOpen)closeModal();S.paused=false;if(step%${sparse?12:24}===0){feed14(0,2,${sparse?1:10});feed14(2,0,${sparse?1:10});}tick(.25);for(const v of S.vehicles){const old=seen14.get(v.id)||new Set();meter14[v.id]+=(v.people||[]).filter(p=>!old.has(p.id)).length;seen14.set(v.id,new Set(v.people.map(p=>p.id)));if(v.people.length>vehCap(v))throw Error('over capacity');}if(step===450){save();load();S.paused=false;testline=S.lines[0];}}`);
 const result=JSON.parse(run(`JSON.stringify({boarded:meter14,delivered:S.delivered-1000,finite:S.vehicles.every(v=>Number.isFinite(v.t)),states:S.vehicles.map(v=>({id:v.id,index:v.index,t:v.t,dir:v.dir}))})`));
 if(baseline)assert(Object.values(result.boarded).some(n=>n===0),'baseline must reproduce follower starvation');else assert(Object.values(result.boarded).every(n=>n>0),type+' bunched follower never boarded '+JSON.stringify(result));assert(result.delivered>0,type+' no real delivery');assert(result.finite);assert.equal(run('runtimeFault13'),null);assert.deepEqual(g.errors,[]);
 console.log((sparse?'sparse ':'pressure ')+type+' '+JSON.stringify(result));g.dom.window.close();
}
console.log(baseline?'PASS baseline reproduces bunched follower starvation':loop?'PASS three-vehicle bus loop, seam, sparse demand and reload':'PASS all six modes: real ticks, bunched old fleets, late boarding, both-way demand, capacity, save/load and delivery');
