'use strict';
for(const [id,name,description,grade] of [
 ['slotTriple','三连好运','在老虎机的一次有效下注中，摇出任意三个相同图标。','bronze'],
 ['slotJackpot','头等奖','摇出 C／C／C，获得30倍返还（含本金）。','gold'],
 ['casinoNoProfit','白忙一场','本场至少拉动一次，带钱离场时余额不高于带入金额。','bronze']
])if(!ACHIEVEMENTS14.some(a=>a.id===id))ACHIEVEMENTS14.push({id,name,description,grade,category:'赌城见闻',target:1});
function recordCasinoSpin1610(s){
 const r=s?.result;
 if(!s||!Number.isSafeInteger(s.spins)||s.spins<1||!Number.isSafeInteger(s.stake)||s.stake<=0||!Array.isArray(r)||r.length!==3||!r.every(n=>Number.isInteger(n)&&n>=0&&n<SLOT_SYMBOLS16.length)||s.payout!==s.stake*slotMultiplier16(r))return;
 if(r[0]===r[1]&&r[1]===r[2]){achProgress14('slotTriple',1);if(SLOT_TRIPLES16[r[0]]===30)achProgress14('slotJackpot',1);}
}
function recordCasinoExit1610(s){
 if(s&&Number.isSafeInteger(s.spins)&&s.spins>0&&Number.isSafeInteger(s.brought)&&s.brought>0&&Number.isSafeInteger(s.balance)&&s.balance>=0&&s.balance<=s.brought)achProgress14('casinoNoProfit',1);
}
achEntry14();
