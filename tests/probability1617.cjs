const assert=require('node:assert/strict'),{readFileSync}=require('node:fs'),vm=require('node:vm');
const c=vm.createContext({Math:Object.create(Math)});
vm.runInContext(readFileSync('dist/casino16.js','utf8').split('function casinoCity16')[0],c);
const evalIn=s=>vm.runInContext(s,c);
const probs=[.026,.023,.017,.020,.014,.030,.010];
let sum=0;
for(let i=0;i<7;i++){
 c.rolls=[sum+probs[i]/2];c.Math.random=()=>c.rolls.shift();
 assert.deepEqual(Array.from(evalIn('slotResult1617()')),[i,i,i]);sum+=probs[i];
}
assert(Math.abs(sum-.14)<1e-12);
for(const tier of [.14,.459999999,.46,.999999999])for(const x of [0,.2,.8,.999999999]){
 c.rolls=[tier,x,x,x];c.Math.random=()=>c.rolls.shift();
 const result=Array.from(evalIn('slotResult1617()')),unique=new Set(result).size;
 assert.equal(unique,tier<.46?2:3);assert(result.every(x=>Number.isInteger(x)&&x>=0&&x<7));
}
const pairs=new Set();
for(let a=0;a<7;a++)for(let b=0;b<6;b++)for(let k=0;k<3;k++){
 c.rolls=[.2,(a+.5)/7,(b+.5)/6,(k+.5)/3];c.Math.random=()=>c.rolls.shift();pairs.add(JSON.stringify(evalIn('slotResult1617()')));
}assert.equal(pairs.size,126);
const counts={blank:0,pair:0,triple:[0,0,0,0,0,0,0]};
for(let k=0;k<10000;k++){
 let first=true;c.Math.random=()=>first?(first=false,(k+.5)/10000):.5;
 const r=Array.from(evalIn('slotResult1617()')),n=new Set(r).size;
 if(n===3)counts.blank++;else if(n===2)counts.pair++;else counts.triple[r[0]]++;
}
assert.equal(counts.blank,5400);assert.equal(counts.pair,3200);assert.deepEqual(counts.triple,[260,230,170,200,140,300,100]);
const rtp=.32*2+probs.reduce((sum,p,i)=>sum+p*evalIn(`slotMultiplier16([${i},${i},${i}])`),0);
assert(Math.abs(rtp-1.673)<1e-12);
console.log('PASS independent 54/32/14 tiers; seven weighted triples incl C 1%; valid outcomes; RTP 167.3%');
