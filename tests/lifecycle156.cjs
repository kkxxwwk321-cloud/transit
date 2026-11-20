const assert = require('node:assert/strict');
const createGame = (opts=>require('./harness156.cjs')({legacyTerrain166:true,...opts}));
const g=createGame(),{run,w}=g;
for(const map of ['east','west']) {
  run(`activateAtlasGeometry('${map}');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;S.paused=false;S.points=100000;beginDraft('bus');draft.stops=[0,1];commitDraft(true);clearSelection();`);
  const points=run('S.points'),day=run('S.day'),line=run('JSON.stringify(S.lines)');
  // Real pinch entry rolls back an unfinished drawing transaction.
  run('view.scale=Math.max(portraitMinScale()*1.5,.35);gesture=null;pointers.clear();beginPointer({pointerId:11,clientX:160,clientY:300});beginPointer({pointerId:12,clientX:260,clientY:300});var scale156=view.scale;movePointer({pointerId:12,clientX:290,clientY:300});');
  assert.equal(run('gesture.kind'),'pinch');assert(run('view.scale>scale156'));
  run('finishPointer({pointerId:11,type:"pointerup",clientX:160,clientY:300});finishPointer({pointerId:12,type:"pointerup",clientX:290,clientY:300});');
  assert.equal(run('JSON.stringify(S.lines)'),line);assert.equal(run('S.points'),points);
  run('beginDraft("bus");draft.stops=[0,1];var oldPause156=S.paused;');
  run('playConnect156()');const pauses=g.pauses;g.setHidden(true);
  assert(run('S.paused&&interruptionPending()'));assert.equal(run('draft'),null);assert.equal(run('pointers.size'),0);assert(g.pauses>pauses);
  assert.equal(run('S.points'),points);assert.equal(run('JSON.stringify(S.lines)'),line);
  const save=JSON.parse(w.localStorage.getItem('transit-atlas-v1'));
  assert(save.paused&&save.interruption.pending);assert.equal(save.lines.length,1);
  run('tick(100000)');assert.equal(run('S.day'),day,'no catch-up simulation');
  assert.equal(run('resumeAfterInterruption()'),false,'hidden resume is blocked');
  g.setHidden(false);w.dispatchEvent(new w.Event('pageshow'));run('closeModal()');
  assert(run('S.paused&&interruptionPending()'),'foreground and modal close stay paused');
  assert.equal(run('resumeAfterInterruption()'),true);assert.equal(run('S.paused'),false);
  run('save();load()');assert.equal(run('S.lines.length'),1);assert.equal(run('S.points'),points);
}
assert.equal(run('runtimeFault13'),null);assert.equal(g.errors.length,0);g.dom.window.close();
console.log('PASS both maps: two-pointer zoom, no accidental build, background save/cancel, no elapsed-time replay, explicit foreground resume and reload');
