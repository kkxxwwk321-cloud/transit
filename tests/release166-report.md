# 1.6.6 verification

- Reproduced the previous fleet bug: `{mode:'all'}` versus an absent default service split an identical route into two eligibility groups. The original planner returned vehicleIds `[1]`; the canonical planner returned `[1,2]`.
- All six modes: three vehicles, both directions, equivalent schedules, save/reload, actual boarding at arrivals. Land/air starts now process first-stop boarding. Existing mixed bus/ship transfer and multi-port delivery tests pass.
- Loading: cover appears before map work, simulation stays paused during preparation, selected map is captured across awaits, restart state clears, first complete frame precedes cover removal. All three restart confirmations preserve other saves and records.
- Casino: each 10-day cycle has one persisted large invitation; no small badge; touch swipe cannot move or dismiss the session; only cashout releases it. Spin settlement persists before animation; delayed third reel, spin sound scheduling, reload and exactly-once cashout checked.
- Map 1 original rendering remains delegated. Map 2 painted footprints are versioned; old saves retain their physical geometry and old rendering. New initial cities are buildable and new geometry survives reload. Map 3 smoothed lakes share drawing/water checks, ocean prices remain 9000/8000.
- Browser pixel checks: bus outside/entry/inside/exit, train carriages on both sides of the tunnel, and visible surface river valley all PASS. Browser QA also exercised the real lever, restored an unfinished casino session, and cashed out its balance.
- JavaScript parse and entrypoint asset checks pass. Existing test groups were run through the first broad batch and subsequent remainder batches; geometry expectations and restart tests were updated for the intentional terrain revision and asynchronous loader. Final changed behavior suites rerun separately.

Limit: browser QA used the provided desktop browser and synthetic touch events in the DOM harness. A low-memory Android phone was not available for physical device testing.
