const assert=require('node:assert/strict');
const g=require('./harness156.cjs')({legacyTerrain166:true}),{run}=g;
run(`activateAtlasGeometry('east');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;S.points=100000;requirements=()=>({bridge:0,tunnel:0,hill:0});S.cities[0].x=0;S.cities[0].y=0;S.cities[1].x=300;S.cities[1].y=-150;S.cities[2].x=400;S.cities[2].y=250;beginDraft('bus');draft.stops=[0,1,2];commitDraft(true);clearSelection();var lesson159=S.lines[0];`);
for(const scale of [.7,1.4]){
 run(`view.scale=${scale};view.x=83;view.y=160;var demo159=tutorialTrimPath159(lesson159);`);
 assert(run('demo159.length>20'));
 assert.equal(run('demo159[0].x'),run('S.cities[2].x'));
 assert.equal(run('demo159[0].y'),run('S.cities[2].y'));
 assert(run('demo159.some(p=>Math.hypot(p.x-S.cities[1].x,p.y-S.cities[1].y)<1)'));
 // Rounded road samples visibly deviate from the old endpoint chord.
 assert(run('demo159.some(p=>segDist(p,S.cities[2],S.cities[1])*view.scale>15)'));
 // Follow the demonstrated path through actual input, including the turn beyond the prior city.
 run('var start159=toScreen(demo159[0]);beginPointer({pointerId:159,clientX:start159.x,clientY:start159.y});for(var p159 of demo159.slice(1)){var screen159=toScreen(p159);movePointer({pointerId:159,clientX:screen159.x,clientY:screen159.y});}finishPointer({pointerId:159,type:"pointerup",clientX:screen159.x,clientY:screen159.y});');
 assert(run('!!draft?.stopRemoval?.backtrack125'),'the illustrated gesture must actually preview deletion');
 assert.equal(run('draft.stops.join()'),'0,1');run('cancelDraft(false)');
}
run('beginDraft("bus",lesson159.id);draft.stops=[0,1];commitDraft(true);clearSelection()');
for(const scale of [.7,1.4]){
 run(`view.scale=${scale};view.x=70;view.y=180;var circle159=tutorialRestorePoint159(lesson159,S.cities[2]);`);
 assert(run('!!circle159'));
 assert.equal(run('routeHit(circle159)?.l.id'),run('lesson159.id'),'ring must be on the visible, draggable road');
 assert.equal(run('hitCity(circle159)'),null,'ring must not be mistaken for a city press');
 run('var point159=toScreen(circle159),dest159=toScreen(S.cities[2]);beginPointer({pointerId:160,clientX:point159.x,clientY:point159.y});movePointer({pointerId:160,clientX:dest159.x,clientY:dest159.y});finishPointer({pointerId:160,type:"pointerup",clientX:dest159.x,clientY:dest159.y});');
 assert(run('draft?.stops.includes(2)'),'dragging from the ring must actually restore the city');
 run('cancelDraft(false)');
}
// Exact screenshot case: the middle city was removed, leaving the bent 0->2 road.
run('lesson159.stops=[0,2];clearSelection();view.scale=1;var middleRing159=tutorialRestorePoint159(lesson159,S.cities[1]);');
assert.equal(run('routeHit(middleRing159)?.l.id'),run('lesson159.id'));
assert.equal(run('hitCity(middleRing159)'),null);
run('var midStart159=toScreen(middleRing159),midDest159=toScreen(S.cities[1]);beginPointer({pointerId:161,clientX:midStart159.x,clientY:midStart159.y});movePointer({pointerId:161,clientX:midDest159.x,clientY:midDest159.y});finishPointer({pointerId:161,type:"pointerup",clientX:midDest159.x,clientY:midDest159.y});');
assert(run('draft?.stops.includes(1)'));run('cancelDraft(false)');
assert.equal(run('runtimeFault13'),null);assert.equal(g.errors.length,0);g.dom.window.close();
console.log('PASS curved-road tutorial: actual deletion follows sampled bends; reconnection ring is on hit-tested road; both gestures work after camera pan/zoom');
