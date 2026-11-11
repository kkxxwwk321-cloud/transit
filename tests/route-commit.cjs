const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

// Android stages its own game/world baseline; both entry points must keep quote-only calls read-only.
for (const base of ['dist/test04', 'mobile/web-base127']) {
  const canvas = new Proxy({ measureText: t => ({ width: String(t).length * 7 }) }, { get: (o, k) => o[k] || (() => {}) });
  const nodes = new Map();
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, { id, hidden: false, style: {}, classList: { add() {}, remove() {} }, textContent: '', innerHTML: '', addEventListener() {}, contains() { return false; }, getBoundingClientRect() { return { left: 0, right: 10, top: 0, bottom: 10 }; }, getContext() { return canvas; } });
    return nodes.get(id);
  };
  const disk = new Map();
  const ctx = vm.createContext({ document: { getElementById: node, createElement: () => node('offscreen'), addEventListener() {}, activeElement: { tagName: 'BODY' } }, innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1, window: { addEventListener() {} }, screen: {}, performance: { now: () => 100 }, localStorage: { setItem: (k, v) => disk.set(k, v), getItem: k => disk.get(k) ?? null }, requestAnimationFrame() {}, setTimeout() {}, clearTimeout() {}, console, confirm: () => true });
  for (const file of ['game', 'progression', 'world', 'economy', 'management']) {
    vm.runInContext(fs.readFileSync(`${['game', 'world'].includes(file) ? base : 'dist/test04'}/${file}.js`, 'utf8'), ctx, { filename: file + '.js' });
  }
  const run = code => vm.runInContext(code, ctx);
  // This contract test excludes presentation (native details depend on later revision130 helpers).
  run('showDetails=()=>{};');
  run('reset();S.points=20000;beginDraft("bus");draft.stops=[0,1];commitDraft(true);var line=S.lines[0],vehicle=S.vehicles[0];vehicle.service={mode:"interval",start:0,end:1};delete vehicle.pendingService;var money=S.points;');

  // Quoting and cancelling must neither change an existing schedule nor enqueue a new one.
  run('beginDraft("bus",line.id);draft.stops=[0,1,2];var quote=draftCost();');
  assert(run('quote.cash>0'), base);
  run('commitDraft(false);');
  assert(run('draft!==null'), base);
  assert.equal(run('vehicle.pendingService'), undefined, base + ': quote queued a schedule');
  assert.equal(run('S.points'), run('money'), base);
  assert.equal(run('line.stops.join(",")'), '0,1', base);
  run('cancelDraft(false);closeModal();');
  assert.equal(run('vehicle.service.mode'), 'interval', base);
  assert.equal(run('vehicle.pendingService'), undefined, base);

  // A previously requested schedule also survives a quote, invalid edit and insufficient funds.
  run('vehicle.pendingService={mode:"express",skip:[]};var pending=JSON.stringify(vehicle.pendingService);beginDraft("bus",line.id);draft.stops=[0,1,2];commitDraft(false);');
  assert.equal(run('JSON.stringify(vehicle.pendingService)'), run('pending'), base);
  run('cancelDraft(false);closeModal();beginDraft("bus",line.id);draft.stops=[0];commitDraft(true);');
  assert.equal(run('JSON.stringify(vehicle.pendingService)'), run('pending'), base);
  run('draft.stops=[0,1,2];S.points=0;commitDraft(true);');
  assert.equal(run('JSON.stringify(vehicle.pendingService)'), run('pending'), base);
  assert.equal(run('line.stops.join(",")'), '0,1', base);

  // Only the successful edit resets the pending schedule; cash and persistence change once.
  run('S.points=money;quote=draftCost();commitDraft(true);commitDraft(true);');
  assert.equal(run('draft'), null, base);
  assert.equal(run('line.stops.join(",")'), '0,1,2', base);
  assert.equal(run('vehicle.pendingService.mode'), 'all', base);
  assert.equal(run('vehicle.service.mode'), 'interval', base + ': current trip must finish first');
  assert.equal(run('money-S.points'), run('quote.cash'), base);
  assert.equal(JSON.parse(disk.get('transit-atlas-v1')).vehicles[0].pendingService.mode, 'all', base);
  console.log('PASS', base, 'quote/cancel, rejected edits, successful once-only edit and saved schedule');
}
