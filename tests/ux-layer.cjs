// Regression checks for the 0.4 UX layer (ux.js): line building, line sheet, tasks, balance display.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const nodes = new Map();
const canvas = new Proxy({createLinearGradient: () => ({addColorStop(){}}), measureText: t => ({width:t.length*7})}, {get:(x,k)=>x[k]||(()=>{})});
function node(id) {
  if (!nodes.has(id)) {
    const classes = new Set();
    nodes.set(id, {id, hidden:['details','modal','drawbar','db-types','db-cost','drawundo'].includes(id), style:{}, offsetParent:{}, textContent:'', innerHTML:'', dataset:{},
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on=on??!classes.has(v);on?classes.add(v):classes.delete(v);return on;},contains:v=>classes.has(v)},
      setAttribute(k,v){this[k]=v;}, addEventListener(){}, contains(){return false;}, setPointerCapture(){}, querySelector(){return null;},
      getBoundingClientRect(){return this.rect||{left:0,right:10,top:0,bottom:10};}, getContext:()=>canvas});
  }
  return nodes.get(id);
}
node('header').rect={left:0,right:390,top:0,bottom:62};
node('dock').rect={left:12,right:378,top:776,bottom:834};
node('routes').rect={left:12,right:378,top:610,bottom:766};
const storage = new Map();
const context = {console,document:{getElementById:node,createElement:()=>node('offscreen'),addEventListener(){},activeElement:{tagName:'BODY'},
  querySelector:s=>({'header':node('header'),'footer .dock':node('dock'),'#routes':node('routes'),'#details':node('details'),'.top-stack':node('top-stack')}[s]||null)},
  innerWidth:390,innerHeight:844,devicePixelRatio:1,window:{addEventListener(){}},screen:{},performance:{now:()=>100},addEventListener(){},
  localStorage:{setItem:(k,v)=>storage.set(k,v),getItem:k=>storage.get(k)??null},requestAnimationFrame(){},setTimeout(){},clearTimeout(){},confirm:()=>{throw new Error('native confirm() must not be used');}};
vm.createContext(context);
for (const file of ['game','progression','world','economy','management','ux','events']) vm.runInContext(fs.readFileSync(path.join(root,`dist/test04/${file}.js`),'utf8'),context);
const run = code => vm.runInContext(code,context);
const checks = [];
function test(name,fn){try{fn();checks.push({name,passed:true});}catch(error){checks.push({name,passed:false,error:error.message});}}
// Money follows the game's own prices (1.1 multiplied transport money by 10): START buys three buses, RICH is plenty.
const fresh = () => run('reset();closeModal();clearSelection();globalThis.START=TYPES.bus.vehicle*3;globalThis.RICH=TYPES.bus.vehicle*60;S.points=START;updateUI()');

test('closing during automatic framing cancels that animation and restores the original view',()=>{
  fresh();
  const raf=context.requestAnimationFrame, frames=[];
  context.requestAnimationFrame=f=>frames.push(f);
  try {
    run('uxFrameRestore=null;view.x=40;view.y=30;view.scale=1;uxAutoMove(()=>animateView({x:200,y:180,scale:.4},300))');
    frames.shift()(250); // midway through the actual animation, before its target is reached
    assert.notEqual(run('view.scale'),1);
    assert.notEqual(run('view.scale'),.4);
    run('uxEndAutoMove()');
    while(frames.length)frames.shift()(1000);
    assert.equal(run('view.x'),40);
    assert.equal(run('view.y'),30);
    assert.equal(run('view.scale'),1);
  } finally { context.requestAnimationFrame=raf; }
});

test('manual camera input during framing cancels restoration and pending animation',()=>{
  fresh();
  const raf=context.requestAnimationFrame, frames=[];
  context.requestAnimationFrame=f=>frames.push(f);
  try {
    run('uxFrameRestore=null;uxAutoMove(()=>animateView({x:200,y:180,scale:.4},300))');
    frames.shift()(250);
    run('uxCancelAutoMove();view.x=75;view.y=65;view.scale=.8;uxEndAutoMove()');
    while(frames.length)frames.shift()(1000);
    assert.equal(run('view.x'),75);assert.equal(run('view.y'),65);assert.equal(run('view.scale'),.8);
    assert.equal(run('uxFrameRestore'),null);
  } finally { context.requestAnimationFrame=raf; }
});
test('starting a line edit during framing freezes the current view without restoring',()=>{
  fresh();
  const raf=context.requestAnimationFrame, frames=[];
  context.requestAnimationFrame=f=>frames.push(f);
  try {
    run('uxFrameRestore=null;uxAutoMove(()=>animateView({x:200,y:180,scale:.4},300))');
    frames.shift()(250);
    const before=run('JSON.stringify(view)');
    run('draft={type:"bus",stops:[]};uxEndAutoMove()');
    while(frames.length)frames.shift()(1000);
    assert.equal(run('JSON.stringify(view)'),before);
    assert.equal(run('uxFrameRestore'),null);
  } finally { run('draft=null');context.requestAnimationFrame=raf; }
});

test('new route starts drawing directly, without a type dialog',()=>{
  fresh();run('chooseType()');
  assert(run('!!draft'),'a draft is started');assert.equal(node('modal').hidden,true);assert.equal(node('drawbar').hidden,false);
});
test('drawing bar shows an itemised quote and a priced build button',()=>{
  run('draft.stops=[0,1];draftBar()');
  const cost=run('draftCost()');
  assert.equal(node('drawdone').textContent,'建设 ¥'+cost.cash);assert.equal(node('db-cost').hidden,false);
  assert.match(node('db-cost').innerHTML,/线路 ¥\d+/);assert.match(node('db-cost').innerHTML,new RegExp('首辆大巴 ¥'+run('TYPES.bus.vehicle')));
});
test('undo removes only the last stop',()=>{
  run('draft.stops=[0,1,2];draftBar()');node('drawundo').onclick();assert.equal(run('JSON.stringify(draft.stops)'),'[0,1]');
});
test('build commits from the bar without a confirmation dialog',()=>{
  const cost=run('draftCost().cash');node('drawdone').onclick();
  assert.equal(run('S.lines.length'),1);assert.equal(run('S.points'),run('START')-cost);assert.equal(node('modal').hidden,true);assert.equal(run('!!draft'),false);
});
test('line sheet renders the fleet stepper and route chips once per change',()=>{
  run('selectLine(S.lines[0].id)');const html=node('details').innerHTML;
  assert.match(html,/ux-stepper/);assert.equal((html.match(/class="ux-stop"/g)||[]).length,2);
  run('for(let i=0;i<5;i++)showDetails(false)');assert.equal(node('details').innerHTML,html);
});
test('fleet plus buys when stock is empty and minus returns a vehicle to stock',()=>{
  run('S.points=RICH');const n=run('S.vehicles.length'),p0=run('S.points'),price=run('TYPES.bus.vehicle');
  run('uxFleetPlus(S.lines[0].id)');assert.equal(run('S.vehicles.length'),n+1);assert.equal(run('S.points'),p0-price);
  run('uxFleetMinus(S.lines[0].id)');assert.equal(run('S.vehicles.length'),n);assert.equal(run('S.inventory.bus'),1);
});
test('line cancellation shows recovery quote and requires explicit confirmation',()=>{
  const id=run('S.lines[0].id');run(`uxDeleteLine(${id})`);
  assert.equal(run(`S.lines.find(l=>l.id===${id}).retiring`),undefined);
  assert.match(node('modal-content').innerHTML,/取消并回收/);
  run(`confirmLineCancellation(${id},false)`);assert.equal(run(`S.lines.find(l=>l.id===${id})?.retiring??true`),true);
});

test('switching transport type only offers unlocked types with free slots',()=>{
  fresh();run('S.unlocked=["bus","emu"];S.limits.emu=1;chooseType();uxSetType("emu")');assert.equal(run('draft.type'),'emu');
  run('uxSetType("air")');assert.equal(run('draft.type'),'emu');run('cancelDraft(false)');
});
test('balance in the header is shown in whole yuan',()=>{
  run('S.points=12345.67;updateUI()');assert.equal(node('points').textContent,'¥12345');
});
test('tasks list every real city as a tappable row',()=>{
  fresh();run('showTasks()');
  assert.equal((node('modal-content').innerHTML.match(/class="ux-task( is-dormant)?"/g)||[]).length,run('realCities().length'));
});
test('bridge bar does not keep the previous route quote, types or undo',()=>{
  fresh();run('S.unlocked=["bus","emu"];S.limits.emu=1;chooseType();draft.stops=[0,1];draftBar()');
  assert.equal(node('db-cost').hidden,false);assert.equal(node('db-types').hidden,false);assert.equal(node('drawundo').hidden,false);
  run('beginBridge("bus")');
  assert.equal(node('db-cost').hidden,true);assert.equal(node('db-cost').innerHTML,'');assert.equal(node('db-types').hidden,true);
  assert.equal(node('drawundo').hidden,true);assert.equal(node('drawbar').classList.contains('db-line'),false);
  assert.equal(node('drawdone').textContent,'确认桥梁');
  run('bridgeDraft=null;cancelDraft(false)');
});
test('add-carriage button follows the balance on passive refreshes',()=>{
  fresh();run('S.unlocked=["bus","emu"];S.limits.emu=1;S.points=RICH;S.inventory.emu=1;draft={type:"emu",name:"动车1线",color:"#4f86a8",stops:[0,1]};commitDraft(true);selectLine(S.lines.at(-1).id)');
  const price=run('carPrice(S.vehicles.find(v=>v.type==="emu"))');
  const button=()=>node('details').innerHTML.match(/<button onclick="upgradeCar\(\d+\)"([^>]*)>/)[1];
  run(`S.points=${price}-1;showDetails(false)`);assert.match(button(),/disabled/);
  run(`S.points=${price};showDetails(false)`);assert.doesNotMatch(button(),/disabled/);
});
test('UX shop keeps upstream train-car purchasing and refreshes its quote',()=>{
  fresh();run('shop()');assert.match(node('modal-content').innerHTML,/暂无可扩容列车/);
  run('S.unlocked=["bus","emu","rail"];S.limits.emu=S.limits.rail=2;S.points=RICH;beginDraft("emu");draft.stops=[0,1];commitDraft(true);beginDraft("rail");draft.stops=[1,2];commitDraft(true);shop()');
  const id=run('S.vehicles.find(v=>v.type==="emu").id'), before=run('S.points'), price=run(`carPrice(S.vehicles.find(v=>v.id===${id}))`);
  assert.match(node('modal-content').innerHTML,new RegExp(`purchaseTrainCar\\(${id},2\\)`));
  assert.match(node('modal-content').innerHTML,/动车 \/ 高铁 · 增加车厢/);
  run(`purchaseTrainCar(${id},2)`);
  assert.equal(run('S.points'),before-price);assert.equal(run(`S.vehicles.find(v=>v.id===${id}).cars`),3);
  assert.equal(run('S.vehicles.find(v=>v.type==="rail").cars'),2);
  assert.match(node('modal-content').innerHTML,new RegExp(`purchaseTrainCar\\(${id},3\\)`));
  assert.match(node('modal-content').innerHTML,new RegExp('＋1节车厢 · ¥'+run(`carPrice(S.vehicles.find(v=>v.id===${id}))`)));
});
test('merged UX keeps school maintenance and repair-centre controls and effects',()=>{
  fresh();run('S.points=RICH;S.cities[0].size=1;confirmSchool(0);cityService(S.cities[0]).rating="良";beginDraft("bus");draft.stops=[0,1];commitDraft(true);showCityEconomy(0)');
  assert.match(node('modal-content').innerHTML,/维护减免生效/);assert.match(node('modal-content').innerHTML,/检修中心/);
  assert(run('maintenanceAssets().some(a=>a.schoolDiscount===.1)'));
  run('var roadKey=Object.keys(S.infrastructure)[0],before=upgradeQuote(roadKey).days;confirmRepairCenter(0);showEngineering()');
  assert.match(node('modal-content').innerHTML,/查看范围/);assert(run('upgradeQuote(roadKey).days<before'));
  run('previewRepairCenter(0);render();showMaintenance()');assert.match(node('modal-content').innerHTML,/学校−10%/);
});
test('new help explains both school savings and repair centres',()=>{fresh();run('help()');assert.match(node('modal-content').innerHTML,/检修中心/);assert.match(node('modal-content').innerHTML,/维护费−10%/);});
test('portrait keeps map direction and screen↔world conversions are inverse',()=>{
  run('resize()');assert.equal(run('view.rot'),0);
  const err=run('(()=>{let p={x:313.5,y:-87.25},q=toScreen(p),w=toWorld({clientX:q.x,clientY:q.y});return Math.hypot(w.x-p.x,w.y-p.y)})()');
  assert(err<1e-9,'round trip error '+err);
  run('fit()');const cities=run('JSON.stringify(realCities().map(c=>toScreen(c)))');const band=run('fitBand()');
  for(const p of JSON.parse(cities)){assert(p.x>=12&&p.x<=378,'x '+p.x);assert(p.y>=band.top&&p.y<=band.bottom,'y '+p.y);}
});
test('dragging a line-end handle chains cities and backs off when retraced',()=>{
  fresh();run('S.points=RICH;draft={type:"bus",name:"大巴1线",color:"#c56544",stops:[0,1]};commitDraft(true);clearSelection();resize()');
  const tail=run('JSON.stringify(uxHandles().find(h=>h.end==="tail"))');assert(tail,'tail handle exists');
  const at=i=>run(`(()=>{let q=toScreen(S.cities[${i}]);return {clientX:q.x,clientY:q.y}})()`);
  run('beginDraft("bus",S.lines[0].id);uxExt={id:1,line:S.lines[0].id,end:"tail",base:[...S.lines[0].stops],added:[],moved:true}');
  run(`uxExtMove(${JSON.stringify(at(2))})`);assert.equal(run('JSON.stringify(draft.stops)'),'[0,1,2]');
  run(`uxExtMove(${JSON.stringify(at(1))})`);assert.equal(run('JSON.stringify(draft.stops)'),'[0,1]');
  run(`uxExtMove(${JSON.stringify(at(2))})`);run('uxExtFinish(false)');
  const built=run('JSON.stringify(S.lines[0].stops)'),pending=run('draft&&JSON.stringify(draft.stops)');
  assert(built==='[0,1,2]'||pending==='[0,1,2]','extension committed or waiting on the priced build button');
  run('if(draft)cancelDraft(false)');
});
test('extending from the head prepends in travel order',()=>{
  fresh();run('S.points=RICH;draft={type:"bus",name:"大巴1线",color:"#c56544",stops:[1,2]};commitDraft(true);clearSelection();resize()');
  const at=run('(()=>{let q=toScreen(S.cities[0]);return {clientX:q.x,clientY:q.y}})()');
  run('beginDraft("bus",S.lines[0].id);uxExt={id:1,line:S.lines[0].id,end:"head",base:[...S.lines[0].stops],added:[],moved:true}');
  run(`uxExtMove(${JSON.stringify(at)})`);assert.equal(run('JSON.stringify(draft.stops)'),'[0,1,2]');
  run('uxExt=null;cancelDraft(false)');
});
test('overlapping end handles hit the selected (visible) line, never a hidden one',()=>{
  fresh();run('S.points=RICH;for(const n of [1,2]){draft={type:"bus",name:"线"+n,color:n===1?"#c56544":"#4f86a8",stops:[0,1]};commitDraft(true);}clearSelection();resize()');
  const [a,b]=JSON.parse(run('JSON.stringify(S.lines.map(l=>l.id))'));
  const knob=id=>run(`(()=>{let h=uxHandles().find(h=>h.line.id===${id}&&h.end==="tail"),p=toScreen(h);return JSON.stringify(p)})()`);
  assert.equal(knob(a),knob(b),'the two tails coincide');
  const p=JSON.parse(knob(b));
  run(`selectLine(${b})`);assert.equal(run(`uxHandleAt(${p.x},${p.y})?.line.id`),b,'second line selected → its own knob');
  run(`selectLine(${a})`);assert.equal(run(`uxHandleAt(${p.x},${p.y})?.line.id`),a,'first line selected → its own knob');
  run('clearSelection()');assert.equal(run(`uxHandleAt(${p.x},${p.y})`),null,'no selection → no extension tab is drawn or hit');
});
test('a fully expanded details sheet bounds the framing area and the selected city ends above it',()=>{
  fresh();run('resize();openCity(1)');
  const d=node('details');d.hidden=false;d.classList.add('is-full');d.rect={left:12,right:378,top:190,bottom:766,height:576};
  const rect=JSON.parse(run('JSON.stringify(uxVisibleRect())'));
  assert(rect.b<=190-12,'visible bottom '+rect.b+' stays above the sheet top 190');assert(rect.b-rect.t>=40,'some map remains');
  run('animateView=t=>Object.assign(view,t);uxFrameSelection()');
  const c=JSON.parse(run('JSON.stringify(toScreen(S.cities[1]))'));
  assert(c.y>=rect.t&&c.y<=rect.b,'city y '+c.y+' inside '+rect.t+'..'+rect.b);assert(c.x>=rect.l&&c.x<=rect.r,'city x '+c.x);
  d.classList.remove('is-full');d.hidden=true;delete d.rect;
});
test('landscape side details panel trims the right edge, not the map height',()=>{
  const save={w:context.innerWidth,h:context.innerHeight,header:node('header').rect,routes:node('routes').rect,dock:node('dock').rect};
  try{
    context.innerWidth=844;context.innerHeight=390;node('header').rect={left:0,right:844,top:0,bottom:54};
    node('routes').rect={left:16,right:216,top:150,bottom:376};node('dock').rect={left:236,right:828,top:338,bottom:380};
    fresh();run('resize();S.points=RICH;draft={type:"bus",name:"线1",color:"#c56544",stops:[0,1,2]};commitDraft(true);selectLine(S.lines[0].id)');
    assert.equal(run('view.rot'),0,'landscape is not rotated');
    const d=node('details');d.hidden=false;d.rect={left:536,right:820,top:60,bottom:322};
    const rect=JSON.parse(run('JSON.stringify(uxVisibleRect())'));
    assert(rect.r<=536-12,'right edge trimmed to the side panel: '+rect.r);
    assert(rect.b-rect.t>=200,'map height kept: '+rect.t+'..'+rect.b);
    assert(rect.l>=216,'left route list respected: '+rect.l);
    run('animateView=t=>Object.assign(view,t);uxFrameSelection()');
    for(const p of JSON.parse(run('JSON.stringify(S.lines[0].stops.map(i=>toScreen(S.cities[i])))')))
      assert(p.x>=rect.l&&p.x<=rect.r&&p.y>=rect.t&&p.y<=rect.b,'stop '+JSON.stringify(p)+' inside '+JSON.stringify(rect));
    d.hidden=true;delete d.rect;
  }finally{context.innerWidth=save.w;context.innerHeight=save.h;node('header').rect=save.header;node('routes').rect=save.routes;node('dock').rect=save.dock;run('resize()');}
});
test('vehicles follow their heading: no upright turn inside vehicle drawing, labels still upright in portrait',()=>{
  fresh();run('resize();S.points=RICH;draft={type:"bus",name:"线1",color:"#c56544",stops:[0,1]};commitDraft(true);clearSelection()');
  const turns=code=>JSON.parse(run(`(()=>{const out=[];ctx.rotate=a=>out.push(a);ctx.getTransform=()=>({a:0,b:1,c:-1,d:0});try{${code}}finally{delete ctx.rotate;delete ctx.getTransform;}return JSON.stringify(out.filter(a=>Math.abs(a+Math.PI/2)<1e-9).length)})()`));
  assert.equal(run('view.rot'),0,'portrait stays unrotated');
  assert.equal(turns('drawVehicle(S.vehicles[0],null)'),0,'bus body/windows must not be turned upright');
  run('S.unlocked.push("emu");S.inventory.emu=2;draft={type:"emu",name:"动车1线",color:"#4f86a8",stops:[1,2]};commitDraft(true);clearSelection();S.vehicles.at(-1).cars=4');
  assert.equal(turns('drawVehicle(S.vehicles.at(-1),null)'),0,'train cars must not be turned upright');
  assert.equal(turns('roundBody(0,0,20,10,3,"#fff")'),0,'unrotated portrait labels need no compensation');
  run('view.rot=0');assert.equal(turns('roundBody(0,0,20,10,3,"#fff")'),0,'landscape never compensates');run('resize()');
});
test('extension tabs: quiet while browsing, ~44px target when a line is selected, city node keeps its taps',()=>{
  fresh();run('resize();S.points=RICH;draft={type:"bus",name:"线1",color:"#c56544",stops:[0,1]};commitDraft(true);clearSelection()');
  assert.equal(run('uxVisibleHandles().length'),0,'browsing: no tabs');
  run('selectLine(S.lines[0].id)');assert.equal(run('uxVisibleHandles().length'),2,'selected: one tab per end');
  const h=JSON.parse(run('JSON.stringify((()=>{let h=uxVisibleHandles().find(h=>h.end==="tail"),p=toScreen(h),c=toScreen(h.city);return {p,c,dx:(p.x-c.x),dy:(p.y-c.y)}})())'));
  const len=Math.hypot(h.dx,h.dy),ox=-h.dy/len*20,oy=h.dx/len*20;   // 20px to the side of the tab centre
  assert.equal(run(`uxHandleAt(${h.p.x+ox},${h.p.y+oy})?.end`),'tail','20px off-centre still grabs the tab');
  assert.equal(run(`uxHandleAt(${h.c.x},${h.c.y})`),null,'pressing the end city node is a city tap, not the tab');
  run('clearSelection()');
});
test('full sheet with a notice on top: the sheet still bounds the map and the city is framed above it',()=>{
  fresh();run('resize();openCity(1)');
  const stack=node('top-stack'),d=node('details');stack.hidden=false;stack.rect={left:16,right:374,top:66,bottom:104,width:358,height:38};
  d.hidden=false;d.classList.add('is-full');d.rect={left:12,right:378,top:148,bottom:776};
  try{
    const rect=JSON.parse(run('JSON.stringify(uxVisibleRect())'));
    assert(rect.b<=148-12,'bottom '+rect.b+' stays above the sheet');assert(rect.b-rect.t>=40,'room left: '+rect.t+'..'+rect.b);
    run('animateView=t=>Object.assign(view,t);uxFrameSelection()');
    const c=JSON.parse(run('JSON.stringify(toScreen(S.cities[1]))'));assert(c.y>=rect.t&&c.y<=rect.b,'city y '+c.y);
  }finally{d.classList.remove('is-full');d.hidden=true;delete d.rect;delete stack.rect;stack.hidden=true;}
});
test('hubs: each global page carries its hub tabs; the old operations centre lands in the goal hub',()=>{
  fresh();run('uxLate&&uxLate()');
  // DOM insertion of the tab row is checked in the browser; here: every hub page is wrapped, and routing works.
  for(const fn of ['showTasks','showActivityCards','showEngineering','shop','showWeather','showFinance','showMaintenance'])assert.equal(run(fn+'.uxTidy'),true,fn+' wrapped');
  let opened='';run('globalThis.__oa=showActivityCards;showActivityCards=()=>{globalThis.__opened="activity"}');
  run('S.contract=null;showOperations()');assert.equal(run('globalThis.__opened'),'activity','operations → 目标/城市活动');
  run('showActivityCards=globalThis.__oa');
});
test('upstream texts that name retired entries point to the three hubs',()=>{
  assert.equal(run('uxRename("跨河前请先在工程采购中手动建桥")'),'跨河前请先在建造中手动建桥');
  assert.equal(run('uxRename("三张城市活动邀请 · 运营中心选择")'),'三张城市活动邀请 · 点「目标」选择');
  assert.equal(run('uxRename("可在交通采购中购买")'),'可在建造·车辆中购买');
});
// 1.2.10: upstream shows new invitations as a sheet again (gated by revision130's safePopup130, which this harness
// does not load); what stays from the UX layer is that the player's own tap on 目标 opens them.
test('activity invitations are generated and tapping 目标 opens them',()=>{
  fresh();run('uxLate&&uxLate();S.points=RICH;draft={type:"bus",name:"线1",color:"#c56544",stops:[0,1,2]};commitDraft(true);clearSelection();S.day=30;let st=activityState();st.offers=[];st.active=null;st.next=0;closeModal()');
  run('generateActivityOffers();closeModal()');
  assert(run('activityState().offers.length')>0,'offers were generated');
  run('uxOpenHub("goal",1)');assert.equal(node('modal').hidden,false,'player tap opens the cards');
  run('closeModal()');
});
test('first-game coach follows the player and retires',()=>{
  fresh();run('uxCoach.done=false;uxCoach.firstLineAt=0;S.lines=[];S.day=0');
  assert.equal(run('uxCoachStep()'),'start');
  run('beginDraft("bus");draft.stops=[0]');assert.equal(run('uxCoachStep()'),'next');
  run('draft.stops=[0,1]');assert.equal(run('uxCoachStep()'),'build');
  run('S.points=RICH;commitDraft(true)');assert.equal(run('uxCoachStep()'),'deliver');
  run('uxCoach.firstLineAt-=10000');assert.equal(run('uxCoachStep()'),'');assert.equal(run('uxCoach.done'),true);
});
test('caption diet: line sheet and task list carry no redundant small text',()=>{
  fresh();run('S.points=RICH;draft={type:"bus",name:"线1",color:"#c56544",stops:[0,1,2]};commitDraft(true);selectLine(S.lines[0].id)');
  const h=node('details').innerHTML;assert.doesNotMatch(h,/终点折返/);assert.doesNotMatch(h,/车辆与运行方案/);
  run('showTasks()');assert.doesNotMatch(node('modal-content').innerHTML,/ux-task-top"><b>[^<]*<\/b><small>/);
});
test('a range preview frames only its own city: switching cities drops it',()=>{
  fresh();run('uxPreviewFrame={c:S.cities[0],radius:240};selected={type:"city",id:0};uxFrameSelection()');
  assert.equal(run('!!uxPreviewFrame'),true,'kept while its city is selected');
  run('selected={type:"city",id:1};uxFrameSelection()');
  assert.equal(run('uxPreviewFrame'),null,'another city does not inherit the preview');
  run('uxPreviewFrame={c:S.cities[0],radius:240};selected={type:"junction",id:0};uxFrameSelection()');
  assert.equal(run('uxPreviewFrame'),null,'nor does the line picker');
  run('clearSelection()');
});
test('drawn range previews end with their city: switching or closing clears the circle too',()=>{
  fresh();run('selected={type:"city",id:0};showDetails();meteoPreview={id:0,radius:240};repairCenterPreview={id:0};uxSyncPreviews()');
  assert.equal(run('!!meteoPreview&&!!repairCenterPreview'),true,'kept while their city sheet is open');
  run('selected={type:"city",id:1};uxSyncPreviews()');
  assert.equal(run('meteoPreview'),null,'meteo circle ends when another city is selected');
  assert.equal(run('repairCenterPreview'),null,'repair circle ends too');
  run('selected={type:"city",id:0};meteoPreview={id:0,radius:240};clearSelection();uxSyncPreviews()');
  assert.equal(run('meteoPreview'),null,'and when the sheet closes');
});
test('closing a repair preview clears its hint even after upstream clears the circle',()=>{
  fresh();run('S.cities[0].size=1;previewRepairCenter(0);uxSyncPreviews()');
  assert.equal(node('toast').classList.contains('show'),true,'keep the hint while its preview is open');
  assert(run('!!uxPreviewFrame&&!!repairCenterPreview'),'both preview states are active');
  run('clearSelection()');
  assert.equal(run('repairCenterPreview'),null,'upstream clears the circle before the observer runs');
  run('uxSyncPreviews()');
  assert.equal(run('uxPreviewFrame'),null);
  assert.equal(node('toast').classList.contains('show'),false,'closing ends the preview hint immediately');
  run('previewRepairCenter(0);toast("资金不足");clearSelection();uxSyncPreviews()');
  assert.equal(node('toast').textContent,'资金不足');
  assert.equal(node('toast').classList.contains('show'),true,'a newer unrelated message stays visible');
});
test('landscape focus pan joins the restore session (task list / line picker → city → close)',()=>{
  fresh();run('globalThis.__raf=requestAnimationFrame;requestAnimationFrame=f=>f();globalThis.__pm=portraitMode;portraitMode=false;uxFrameRestore=null;view.x=40;view.y=30;'+
    'animateView=t=>{animateView.id=(animateView.id||0)+1;uxLastViewTarget={x:t.x,y:t.y,scale:t.scale};Object.assign(view,t)}');
  const before=run('({x:view.x,y:view.y,scale:view.scale})');
  run('uxFocusCity(S.cities.find(c=>!c.dormant&&c.kind!=="bridgehead").id)');
  assert(run('!!uxFrameRestore'),'the pan is recorded');
  assert.deepEqual(run('({x:uxFrameRestore.from.x,y:uxFrameRestore.from.y,scale:uxFrameRestore.from.scale})'),before,'with the view from before it');
  run('requestAnimationFrame=globalThis.__raf;portraitMode=globalThis.__pm;uxFrameRestore=null;clearSelection()');
});
test('messages: lifecycle note is skipped for a new game and honest for a finished one',()=>{
  fresh();run('uxToastHold=0;S.lines=[];S.day=0;S.lives=1;toast("seed");toast("已回到游戏 · 当前暂停，点 ▶ 继续")');
  assert.equal(node('toast').textContent,'seed','a brand-new game has nothing to resume');
  run('S.day=12;S.lives=0;toast("已回到游戏 · 当前暂停，点 ▶ 继续")');
  assert.match(node('toast').textContent,/本局已结束/,'a finished game does not invite ▶');
  run('S.lives=1');
});
test('messages: idle info waits behind fresh action feedback; warnings never wait',()=>{
  fresh();run('uxToastHold=0;toast("已支付 ¥560 · 维修需要 3 天")');
  assert.equal(run('uxToastHold>0'),true,'feedback holds the line');
  run('toast("中级居住城市可经营农田 · 点击城市查看")');
  assert.match(node('toast').textContent,/已支付/,'idle info does not replace the payment confirmation');
  run('toast("河岸镇候客厅持续满员，扣一条生命")');
  assert.match(node('toast').textContent,/扣一条生命/,'a loss is shown at once');
  run('uxToastHold=0');
});
test('finished match: the run button becomes 结算 and reopens the results',()=>{
  fresh();run('uxLate&&uxLate();globalThis.__go=0;globalThis.__gameover=gameover;gameover=()=>{__go++};S.lives=0;updateUI()');
  assert.equal(node('pause').textContent,'结算');
  run('uxEl("pause").onclick()');assert.equal(run('__go'),1,'tapping it opens the results');
  run('gameover=__gameover;S.lives=1;updateUI()');
});
test('dense map: crowded queues collapse to one row; labels drop the region until needed',()=>{
  fresh();run('S.cities[0].q=Array.from({length:30},()=>({color:0,shape:0,wait:0}))');
  assert.equal(run('QUEUE_SHOWN_FOR(S.cities[0])'),6,'one row when crowded');
  run('S.cities[0].q.length=8');assert.equal(run('QUEUE_SHOWN_FOR(S.cities[0])'),12,'quiet cities keep two rows');
  assert.equal(run('CITY_LABEL({name:"临江·起始城市圈"},false)'),run('view.scale>=1.25')?'临江·起始城市圈':'临江');
  assert.equal(run('CITY_LABEL({name:"临江·起始城市圈"},true)'),'临江·起始城市圈','the selected city shows its region');
  run('S.cities[0].q=[]');
});
test('help: the quick steps state the real life-loss rule (full hall for 180 s), not individual waiting',()=>{
  fresh();run('help()');const h=node('modal-content').innerHTML;
  assert.doesNotMatch(h,/候车太久会扣命/);assert.match(h,/满员/);
  run('closeModal()');
});
test('line settings: a picked colour is a preview only — never in the game state or any save until 保存设置',()=>{
  fresh();run('uxLate&&uxLate();S.points=RICH;draft={type:"bus",name:"线1",color:"#c56544",stops:[0,1,2]};commitDraft(true);clearSelection();save()');
  const id=run('S.lines[0].id'),c0=run('S.lines[0].color'),name0=run('S.lines[0].name'),pick=run('LINECOL[3]');
  const stored=()=>run('JSON.parse(localStorage.getItem("transit-atlas-v1")).lines[0]');
  run(`renameLine(${id});setLineColor(${id},LINECOL[3])`);
  assert.equal(run('S.lines[0].color'),c0,'picking does not touch the line');assert.equal(run('uxLineEdit.preview'),pick,'it is pending in the sheet');
  run('save()');assert.equal(stored().color,c0,'a save while the sheet is open (page leave, interruption) keeps the old colour');
  run('load()');assert.equal(run('S.lines[0].color'),c0,'reloading after leaving unsaved keeps the old colour');assert.equal(run('S.lines[0].name'),name0);
  run(`renameLine(${id});setLineColor(${id},LINECOL[3]);closeModal()`);
  assert.equal(run('S.lines[0].color'),c0,'closing without saving');assert.equal(stored().color,c0,'and the save made on close');
  node('linename').value='新名字';run(`renameLine(${id});setLineColor(${id},LINECOL[3]);applyName(${id})`);
  assert.equal(run('S.lines[0].color'),pick,'保存 keeps the colour');assert.equal(stored().color,pick,'in the save too');
  run('load()');assert.equal(run('S.lines[0].color'),pick,'and after reloading');assert.equal(run('S.lines[0].name'),'新名字');
  run('clearSelection()');
});
test('line identity: codes come from the name (number, plus type when numbers repeat across types)',()=>{
  fresh();run('S.points=RICH;draft={type:"bus",name:"大巴1线",color:"#c56544",stops:[0,1]};commitDraft(true);draft={type:"bus",name:"大巴2线",color:"#2f8a78",stops:[1,2]};commitDraft(true)');
  assert.equal(run('uxLineCode(S.lines[0])'),'1');assert.equal(run('uxLineCode(S.lines[1])'),'2');
  run('S.lines[1].name="动车1线";S.lines[1].type="emu"');
  assert.equal(run('uxLineCode(S.lines[0])'),'巴1','same number, different type: the type disambiguates');assert.equal(run('uxLineCode(S.lines[1])'),'动1');
  run('S.lines[1].name="海滨专线"');assert.equal(run('uxLineCode(S.lines[1])'),'海滨','no number: first characters');
  run('S.lines.length=0;S.vehicles.length=0');
});
test('dense map: zoomed out or eight cities, any queue over one row folds to one row + pill',()=>{
  fresh();run('S.cities[0].q=Array.from({length:8},()=>({color:0,shape:0,wait:0}));view.scale=1.2');
  const few=run('realCities().filter(c=>!c.dormant).length')<8;
  if(few)assert.equal(run('QUEUE_SHOWN_FOR(S.cities[0])'),12,'close-up, few cities: two rows');
  run('view.scale=.8');assert.equal(run('QUEUE_SHOWN_FOR(S.cities[0])'),6,'zoomed out: one row');
  run('S.cities[0].q=[];view.scale=1');
});
test('line picker at a station: lines through it stay strong, others fade; a selected line wins',()=>{
  fresh();run('S.points=RICH;draft={type:"bus",name:"线1",color:"#c56544",stops:[0,1]};commitDraft(true);draft={type:"bus",name:"线2",color:"#2f8a78",stops:[1,2]};commitDraft(true)');
  run('selected={type:"junction",id:0}');assert.equal(run('LINE_ALPHA(S.lines[0],null)'),1);assert(run('LINE_ALPHA(S.lines[1],null)')<.5);
  assert.equal(run('LINE_ALPHA(S.lines[1],S.lines[1].id)'),1);assert(run('LINE_ALPHA(S.lines[0],S.lines[1].id)')<.5);
  run('selected=null;S.lines.length=0;S.vehicles.length=0');
});
test('play view never shows ground beyond the map edge when the map can cover the screen',()=>{
  fresh();run('globalThis.__ms=globalThis.mapSpec;mapSpec={bounds:{xmin:-1000,xmax:1200,ymin:-300,ymax:1200}}');
  const t=run('uxClampToMap({x:5000,y:5000,scale:1})');assert(t.x<=1000&&t.y<=300,'pulled back inside');
  const c=run('uxClampToMap({x:0,y:0,scale:.05})');assert.equal(Math.round(c.x),Math.round(run('(W-200*.05)/2')),'a map smaller than the screen is centred');
  run('mapSpec=globalThis.__ms');
});

test('notice dismissal belongs to one weather/construction event, not all future matching text',()=>{
  fresh();run('uxLate();S.day=40;S.activityCards=null;for(let c of realCities())c.dormant=false;S.climate.events=[{type:"rain",start:39,end:41}]');
  run('updateUI()');assert.match(node('notice').textContent,/区域雨/);
  node('notice-close').onclick();run('updateUI()');assert.equal(node('notice').textContent,'');
  run('S.day=42;updateUI()');assert.equal(node('notice').textContent,'');
  run('S.climate.events=[{type:"rain",start:43,end:45}];S.day=44;updateUI()');assert.match(node('notice').textContent,/区域雨/,'new rain must be visible');
  run('S.climate.events=[];S.infrastructure.noticeTest={until:46};updateUI()');assert.match(node('notice').textContent,/道路施工/);
  node('notice-close').onclick();run('updateUI()');assert.equal(node('notice').textContent,'');
  run('S.day=47;updateUI();S.infrastructure.noticeTest.until=50;updateUI()');assert.match(node('notice').textContent,/道路施工/,'new construction must be visible');
});
test('late activity notices retain dismissal through progress, but new phases and invitations show',()=>{
  fresh();run('uxLate();S.day=40;S.activityCards=null;activityState().offers=[makeActivityCard(1,1,[0])];updateUI()');
  assert.match(node('notice').textContent,/活动邀请/);node('notice-close').onclick();
  run('updateUI();updateUI()');assert.equal(node('notice').textContent,'');
  run('acceptActivity(activityState().offers[0].id);closeModal();updateUI()');assert.match(node('notice').textContent,/准备中/);
  node('notice-close').onclick();run('updateUI()');assert.equal(node('notice').textContent,'');
  run('S.day=activityState().active.start;updateUI()');assert.match(node('notice').textContent,/送达/);
  node('notice-close').onclick();run('activityState().active.delivered++;updateUI()');assert.equal(node('notice').textContent,'');
  run('activityState().active=null;activityState().offers=[makeActivityCard(1,1,[0])];updateUI()');assert.match(node('notice').textContent,/活动邀请/);
});
test('closing an activity overlay does not dismiss the underlying weather',()=>{
  fresh();run('uxLate();S.day=40;S.climate.events=[{type:"rain",start:39,end:45}];S.activityCards=null;activityState().offers=[makeActivityCard(1,1,[0])];updateUI()');
  node('notice-close').onclick();run('updateUI()');assert.equal(node('notice').textContent,'');
  run('activityState().offers=[];updateUI()');assert.match(node('notice').textContent,/区域雨/);
});
test('new game can display an activity even when its id repeats the dismissed previous game',()=>{
  const offer=()=>run('uxLate();S.day=40;S.activityCards=null;activityState().offers=[makeActivityCard(1,1,[0])];updateUI()');
  fresh();offer();node('notice-close').onclick();run('updateUI()');assert.equal(node('notice').textContent,'');
  fresh();offer();assert.match(node('notice').textContent,/活动邀请/);
});
test('opening countdown dismissal follows its city and opening time, not the changing counter',()=>{
  fresh();run('uxLate();S.day=40;S.activityCards=null;S.cities[1].dormant=true;S.cities[1].openingAt=S.day+10/12;updateUI()');
  assert.match(node('notice').textContent,/即将开放/);node('notice-close').onclick();
  run('S.day+=1/12;updateUI()');assert.equal(node('notice').textContent,'');
  run('S.cities[1].dormant=false;S.cities[2].dormant=true;S.cities[2].openingAt=S.day+10/12;updateUI()');assert.match(node('notice').textContent,/即将开放/);
});

console.log(JSON.stringify(checks,null,2));
if(checks.some(x=>!x.passed))process.exitCode=1;
