'use strict';
uxCoach.done=true;uxCoach.step='';$('ux-coach')?.remove();
function tutorial129(){return S?.tutorial123;}
function clearTeachingFog129(){S.climate.events=S.climate.events.filter(e=>e.id!=='tutorial-fog');meteoPreview=null;}
function tutorialContinue129(){let t=tutorial129();if(!t)return;if(t.stage==='city-intro'){clearSelection();tutorialSet123('build');}else if(t.stage==='meteo'){clearTeachingFog129();clearSelection();tutorialSet123('facility-city');}else if(t.stage==='facility-read')startSecondLesson129();else if(t.stage==='second-build'&&draft&&draftCost().cash>S.points){cancelDraft(false);S.paused=false;save();tutorialUI123();}}
function startSecondLesson129(){let t=tutorial129();if(!t||t.stage!=='facility-read')return false;clearTeachingFog129();clearSelection();closeModal();if(!t.reward129){t.reward129=true;credit(1600,'subsidy','新手练习补助');}t.secondBase129=S.lines.filter(l=>!l.retiring).map(l=>l.id);t.shared129=2;t.target129=1;t.secondPicked129=false;t.stage='second-build';S.paused=true;collapsePortraitRoutes();save();tutorialUI123();toast('获得 ¥1600 · 学习第二条线路');return true;}
function finishTutorial129(){let t=tutorial129();if(!t)return;t.completed129=true;skipTutorial123();document.documentElement.classList.remove('tutorial-quote125');cue124.hidden=true;}
const nextBefore129=tutorialNext123;
tutorialNext123=function(){if(tutorialStage123()==='meteo')return tutorialContinue129();if(tutorialStage123()==='fog'){meteoPreview={id:0,radius:240};tutorialSet123('meteo');return;}return nextBefore129();};
const detailsBefore129=showDetails;
showDetails=function(...args){let t=tutorial129(),s=t?.stage,r=detailsBefore129(...args);if(t&&selected?.type==='city'){if(s==='view'){t.introCity129=selected.id;t.stage='city-intro';S.paused=true;save();}else if(s==='facility-city'){t.stage='facility-read';S.paused=true;save();}}tutorialUI123();return r;};
const junctionBefore129=showJunction;
showJunction=function(id,...args){let r=junctionBefore129(id,...args),t=tutorial129();if(t&&['second-city','second-extend'].includes(t.stage)&&!draft&&id===t.shared129){t.stage='second-pick';save();}tutorialUI123();return r;};
const junctionDragBefore129=startJunctionDrag;
startJunctionDrag=function(e,line,city){let t=tutorial129();if(t&&['second-pick','second-extend'].includes(t.stage)&&line===t.second129&&city===t.shared129){t.secondPicked129=true;t.stage='second-extend';save();}let r=junctionDragBefore129(e,line,city);tutorialUI123();return r;};
const commitBefore129=commitDraft;
commitDraft=function(...args){let t=tutorial129(),s=t?.stage,d=draft,ids=S.lines.map(l=>l.id),r=commitBefore129(...args);if(!t||!d||draft||t.stage==='done')return r;if(s==='second-build'&&d.original==null){let l=S.lines.find(l=>!ids.includes(l.id)&&l.type==='bus'&&l.stops.includes(0)&&l.stops.includes(t.shared129));if(l){t.second129=l.id;t.stage='second-city';S.paused=true;selected=null;$('details').hidden=true;collapsePortraitRoutes();save();}}syncSecondLesson131();tutorialUI123();return r;};
// Committed route state is authoritative. A preview or a click-history flag is not completion.
let syncingSecond131=false;
function syncSecondLesson131(){let t=tutorial129();if(syncingSecond131||!t||!['second-build','second-city','second-pick','second-extend'].includes(t.stage)||draft||bridgeDraft||gesture||pointers.size)return;let shared=t.shared129??2,target=t.target129??1,l=t.second129!=null?S.lines.find(l=>l.id===t.second129):null;if(t.second129==null&&Array.isArray(t.secondBase129)){let fresh=S.lines.filter(l=>!l.retiring&&l.type==='bus'&&!t.secondBase129.includes(l.id)&&l.id!==t.line&&l.stops.includes(0)&&l.stops.includes(shared));if(fresh.length===1){l=fresh[0];t.second129=l.id;save();}}if(!l||l.retiring||l.type!=='bus'||l.id===t.line||t.secondBase129?.includes(l.id))return;if([0,shared,target].every(id=>l.stops.includes(id)&&S.cities[id]&&!S.cities[id].removed)){syncingSecond131=true;try{finishTutorial129();}finally{syncingSecond131=false;}}else if(t.stage==='second-build'){t.stage='second-city';save();}}

function guideCopy129(){let t=tutorial129(),s=t?.stage;if(!t)return null;let n=id=>escapeHTML(S.cities[id]?.name||'目标城市');switch(s){
case 'view':return ['查看城市','点一下圈出的城市。'];
case 'city-intro':return ['城市里有什么？','这里看候车、任务和建筑；满足条件后可建设。','开始拉线'];
case 'build':{const [a,b]=firstRouteCue123();return ['连接三座城市',draft&&!$('drawdone').disabled?'点下方「'+escapeHTML($('drawdone').textContent)+'」。':'从'+n(a.id)+'拖到'+n(b.id)+(S.lines.length?'，延长这条线。':'，先接通两站。')];}
case 'trim-end':return ['删除一段路',draft?.stopRemoval?'点「应用修改」，确认删路。':'从末站沿原线往回拖，越过上一站一点。'];
case 'restore-end':return ['把城市接回来',draft?'点下方「'+escapeHTML($('drawdone').textContent)+'」。':'按住圈出的实际线段，拖到刚移除的城市。'];
case 'wait':return ['等待河对岸的新城','先运行游戏，观察客流。'];
case 'bridge':return ['架一座公路桥',bridgeDraft?'从河岸拖到对岸，再确认架桥。':modalOpen?'点「公路桥」。':'点「建造」，打开「桥梁与道路」。'];
case 'connect':return ['接通河对岸','从城市出发，沿桥拖过两端，再连到新城。'];
case 'fog':return ['雾会让车变慢','气象站能减轻范围内的雨雾减速。','查看覆盖范围'];
case 'meteo':return ['气象站覆盖范围','覆盖内减速减半。气象站在城市里建设。','介绍城市建筑'];
case 'facility-city':return ['城市里建设建筑',selected?.type==='junction'?'点「城市详情」。':'点一下圈出的城市。'];
case 'facility-read':return ['按需建设','建筑在城市面板里，满足条件后再建。','领取 ¥1600，继续'];
case 'second-build':return ['建立第二条线',draft?(draftCost().cash>S.points?'资金不足，可先运行赚取票款。':draft.stops.includes(t.shared129)?'点「建设」，开通第二条线。':'从'+n(0)+'拖到'+n(t.shared129)+'。'):$('routes').classList.contains('collapsed')?'展开「交通网络」。':'点「新建线路」，连接'+n(0)+'与'+n(t.shared129)+'。',draft&&draftCost().cash>S.points?'先运行赚票款':null];
case 'second-city':return ['共用城市有多条线','点一下'+n(t.shared129)+'。'];
case 'second-pick':return ['选中第二条线',$('junction-picker').hidden?'点'+n(t.shared129)+'，再选第二条线。':'点第二条线右侧的 ↗，再到地图拖动。'];
case 'second-extend':return ['延长第二条线',!draft?'从'+n(t.shared129)+'把第二条线接到'+n(t.target129)+'。':draft.original!==t.second129?'请取消，改为选择第二条线。':[0,t.shared129,t.target129].every(id=>draft.stops.includes(id))?'点「应用修改」，完成练习。':'沿第二条线继续拖到'+n(t.target129)+'。'];
}return null;}
let guideSignature129='';
tutorialUI123=function(){syncTutorial125();syncTutorial127();syncSecondLesson131();let s=tutorial129()?.stage,c=guideCopy129(),visible=!!c&&!atlasMenuOpen&&(!modalOpen||s==='bridge');guide123.hidden=!visible;document.documentElement.classList.toggle('tutorial-quote125',visible&&!!draft&&!$('drawdone').disabled);if(!visible){guideSignature129='';return;}let sig=s+'|'+c.join('|');if(sig!==guideSignature129){guideSignature129=sig;guide123.innerHTML='<b>'+c[0]+'</b><p>'+c[1]+'</p><div>'+(c[2]?'<button data-guide-next129 onclick="'+(s==='fog'?'tutorialNext123()':'tutorialContinue129()')+'">'+c[2]+'</button>':'')+'<button class="guide-skip129" onclick="skipTutorial123()">跳过引导</button></div>';}};
tutorialTarget124=function(){let t=tutorial129(),s=t?.stage,m=$('modal-content');if(!t||s==='done'||atlasMenuOpen)return null;if(s==='bridge'){if(bridgeDraft)return $('drawdone');if(modalOpen)return m.querySelector('[onclick="beginBridge(\'bus\')"]')||m.querySelector('[onclick="uxOpenHub(\'build\',0)"]');return $('hub-build');}if(['city-intro','facility-read','meteo','fog'].includes(s))return guide123.querySelector('[data-guide-next129]');if(s==='facility-city'&&selected?.type==='junction')return $('junction-picker').querySelector('.junction-city-task');if(s==='second-pick')return $('junction-picker').querySelector('[data-junction-line="'+t.second129+'"]');if(s==='second-build'&&!draft)return $('routes').classList.contains('collapsed')?$('collapse'):($('route-new130')||$('newroute'));if(draft&&!$('drawdone').disabled&&(!['second-build','second-extend'].includes(s)||draft.stops.includes(s==='second-build'?t.shared129:t.target129)))return $('drawdone');return null;};
const renderBefore129=render;
render=function(){renderBefore129();tutorialUI123();let t=tutorial129(),s=t?.stage;if(!t||atlasMenuOpen||modalOpen||s==='done')return;let ids=s==='facility-city'?[t.introCity129??0]:(s==='second-city'||s==='second-extend'&&!draft||s==='second-pick'&&$('junction-picker').hidden)?[t.shared129]:s==='second-build'&&draft?[0,t.shared129]:s==='second-extend'&&draft?[t.shared129,t.target129]:[];if(ids.length){ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);ctx.strokeStyle='#c2943a';ctx.fillStyle='#c2943a';ctx.lineWidth=2.5;ctx.setLineDash([5,5]);let pts=ids.map(id=>S.cities[id]).filter(Boolean).map(toScreen);for(let p of pts){ctx.beginPath();ctx.arc(p.x,p.y,25,0,Math.PI*2);ctx.stroke();}if(pts.length===2){let [a,b]=pts;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();ctx.setLineDash([]);let u=performance.now()%1800/1800;ctx.beginPath();ctx.arc(a.x+(b.x-a.x)*u,a.y+(b.y-a.y)*u,6,0,Math.PI*2);ctx.fill();}ctx.restore();}layoutTutorial130();};
if(tutorial129()&&tutorialStage123()!=='done'){migrateTutorial124();syncTutorial127();}
tutorialUI123();
// A fresh eastern game can show the revised lesson even if an older tutorial was completed.
const skipBefore129=skipTutorial123;
skipTutorial123=function(){localStorage.setItem('transit-tutorial129-done','1');let r=skipBefore129();document.documentElement.classList.remove('tutorial-quote125');cue124.hidden=true;return r;};
const startMapBefore129=startAtlasMap;
startAtlasMap=function(...args){let r=startMapBefore129(...args);if(!atlasMenuOpen&&S.mapId==='east'&&S.day===0&&!S.lines.length&&realCities().length===3&&!localStorage.getItem('transit-tutorial129-done')&&(!tutorial129()||tutorialStage123()==='done')){S.tutorial123={stage:'view',version129:1,line:null,city:null};S.paused=true;save();}tutorialUI123();return r;};
$('atlas-start').onclick=()=>{atlasRestart=false;startAtlasMap();};
