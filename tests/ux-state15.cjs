const assert = require('node:assert/strict');
const createGame = require('./harness156.cjs');

async function main() {
  let g, run, w;
  let failures = 0;
  const test = async (name, fn) => {
    g = createGame(); ({run, w} = g);
    w.HTMLElement.prototype.scrollTo = function () {};
    try { await fn(); assert.equal(run('runtimeFault13'), null); assert.deepEqual(g.errors, []); console.log('PASS', name); }
    catch (e) { failures++; console.error('FAIL', name, e.message); }
    finally { g.dom.window.close(); }
  };
  const json = s => JSON.parse(run('JSON.stringify(' + s + ')'));
  const settleObservers = async () => { await Promise.resolve(); await Promise.resolve(); };
  const finishFrames = async () => {
    // Run queued layout/animation frames to completion, without real-time sleeps or changing animation code.
    for (let i = 0; i < 5; i++) {
      await settleObservers();
      const frames = [...g.raf13.values()]; g.raf13.clear();
      for (const fn of frames) fn(w.performance.now() + 1000);
    }
    await settleObservers();
  };
  const fresh = async () => {
    run(`activateAtlasGeometry('east');reset();atlasMenuOpen=false;closeModal();S.tutorial123=null;S.interruption=null;S.points=100000;S.paused=true;requirements=()=>({bridge:0,tunnel:0,hill:0});beginDraft('bus');draft.stops=[0,1,2];commitDraft(true);clearSelection();`);
    await finishFrames();
    run('uxFrameRestore=null;Object.assign(view,{x:40,y:30,scale:.8});');
  };
  await test('multi-stop selection belongs to its game, including reset and load with reused IDs', async () => {
    await fresh();
    run('selectLine(S.lines[0].id);uxStopPickToggle(S.lines[0].id);uxStopMark(S.lines[0].id,1);clearSelection();');
    await fresh();
    run('selectLine(S.lines[0].id);');
    assert.equal(run('uxStopPick'), null, 'new game inherited marked stops');
    run('uxStopPickToggle(S.lines[0].id);uxStopMark(S.lines[0].id,1);save();load();selectLine(S.lines[0].id);');
    assert.equal(run('uxStopPick'), null, 'load inherited marked stops');
    assert.equal(w.document.querySelectorAll('#details .ux-stop[aria-pressed=true]').length, 0);
  });
  await test('same-game multi-stop preview and cancel preserve line, vehicles and funds', async () => {
    await fresh();
    run('selectLine(S.lines[0].id);uxStopPickToggle(S.lines[0].id);uxStopMark(S.lines[0].id,1);');
    const before = json('({lines:S.lines,vehicles:S.vehicles,cash:S.points})');
    run('uxStopPickApply(S.lines[0].id);');
    assert.deepEqual(json('draft.stops'), [0,2]);
    assert.deepEqual(json('({lines:S.lines,vehicles:S.vehicles,cash:S.points})'), before);
    run('cancelDraft(false)');
    assert.deepEqual(json('({lines:S.lines,vehicles:S.vehicles,cash:S.points})'), before);
  });
  await test('portrait city focus restores original camera after the actual details close', async () => {
    await fresh();
    const before = json('view');
    run('openCity(0);');
    await finishFrames();
    assert(run('!!uxFrameRestore'), 'portrait focus did not record a restore session');
    assert.notDeepEqual(json('view'), before);
    run('clearSelection();');
    await finishFrames();
    assert.deepEqual(json('view'), before);
  });
  await test('closing during focus animation cancels it and restores the original view', async () => {
    await fresh();
    const before = json('view');
    run('portraitFocusCity(S.cities[0]);uxEndAutoMove();');
    await finishFrames();
    assert.deepEqual(json('view'), before);
  });
  await test('closing before a queued layout frame neither throws nor starts a stale focus', async () => {
    await fresh();
    const before = json('view');
    run('openCity(0);');
    await settleObservers();
    run('clearSelection();');
    await finishFrames();
    assert.deepEqual(json('view'), before);
  });
  await test('manual camera takeover cancels an in-flight focus without pulling back', async () => {
    await fresh();
    run('portraitFocusCity(S.cities[0]);');
    w.document.getElementById('map').dispatchEvent(new w.WheelEvent('wheel', {deltaY:0}));
    run('Object.assign(view,{x:75,y:65,scale:.8});uxEndAutoMove();');
    await finishFrames();
    assert.deepEqual(json('({x:view.x,y:view.y,scale:view.scale})'), {x:75,y:65,scale:.8});
  });
  await test('starting an edit freezes an in-flight focus instead of jumping or restoring', async () => {
    await fresh();
    run('portraitFocusCity(S.cities[0]);');
    const before = json('view');
    run('beginDraft("bus",S.lines[0].id);uxEndAutoMove();');
    await finishFrames();
    assert.deepEqual(json('view'), before);
  });
  await test('a new game restores the play control after the previous result', async () => {
    await fresh();
    run('S.lives=0; updateUI();'); assert.match(w.document.getElementById('pause').getAttribute('aria-label'), /结算/);
    run('reset(); updateUI();'); assert.equal(w.document.getElementById('pause').getAttribute('aria-label'), '暂停或继续');
  });
  await test('tutorial points past a completed two-stop line, and names the actual confirmation', async () => {
    await fresh(); run("S.lines[0].stops=[1,0]; S.tutorial123={stage:'build'};");
    assert.deepEqual(json('firstRouteCue123().map(c=>c.id)'), [0,2]);
    assert(run('guideCopy129()[1].includes(S.cities[2].name)'));
    run("S.tutorial123.stage='restore-end'; beginDraft('bus',S.lines[0].id); draft.stops=[1,2,0]; draftBar();");
    assert(run("guideCopy129()[1].includes($('drawdone').textContent)"));
  });
  await test('manual bridge planning clears the previous route quote', async () => {
    await fresh();run("S.quoteSeen123=true; beginDraft('bus'); draft.stops=[0,1]; draftBar(); cancelDraft(false); beginBridge('bus');");
    assert(run("!$('drawbar').classList.contains('quote-compact') && $('quote-expand').hidden && !$('quote-expand').textContent"));
  });
  if (failures) process.exitCode = 1;
}
main().catch(e => { console.error(e); process.exitCode = 1; });
