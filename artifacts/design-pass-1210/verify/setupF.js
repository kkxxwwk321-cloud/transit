// Fresh first game on the east map: no lines, coach on (isolated profile).
localStorage.clear(); atlasSelected = 'east'; atlasRestart = true; startAtlasBeforeLifecycle12(); try { if (typeof initializeRiver128 === 'function') initializeRiver128(); } catch (e) {}
document.getAnimations().forEach(a => a.finish()); S.paused = true; updateUI(); dispatchEvent(new Event('resize'));
window.__com = (realCities().find(c => c.shape === 2) || realCities()[2]).id;
await new Promise(r => setTimeout(r, 400));
