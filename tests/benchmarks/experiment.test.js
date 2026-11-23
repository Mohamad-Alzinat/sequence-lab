import test from "node:test";
import assert from "node:assert/strict";
import { calibrationCases, validationCases, fixture, grid } from "../../bench/data.js";
import { median } from "../../bench/timing.js";
import { allmerChoice, fitRelative, policyMetrics } from "../../bench/metrics.js";

test("calibration is a unique 180-cell full factorial and validation uses independent seeds and values", () => {
  const training = calibrationCases();
  const testing = validationCases();
  assert.equal(training.length, 180);
  assert.equal(new Set(training.map(c => [c.alphabet, c.n, c.m, c.k].join("/"))).size, 180);
  assert.equal(testing.length, 100);
  assert.equal(new Set([...training, ...testing].map(c => c.seed)).size, 280);
  assert.ok(testing.some(c => !grid.alphabet.includes(c.alphabet)));
  for (const c of testing) for (const axis of ["n","m","k"]) {
    assert.ok(!grid[axis].includes(c[axis]) && c[axis] > grid[axis][0] && c[axis] < grid[axis].at(-1));
  }
  assert.deepEqual(fixture(training[0]), fixture(training[0]));
});

test("policy metrics include the inclusive ten-percent boundary and use the shared oracle total", () => {
  const metrics = policyMetrics("fixture", [
    { id: "x", selectedMs: 11, bestMs: 10 },
    { id: "y", selectedMs: 40, bestMs: 20 },
  ]);
  assert.equal(metrics.fastestRate, 0);
  assert.equal(metrics.within10Rate, 0.5);
  assert.ok(Math.abs(metrics.geometricSlowdown - Math.sqrt(2.2)) < 1e-12);
  assert.equal(metrics.worstSlowdown, 2);
  assert.equal(metrics.totalRatio, 1.7);
  assert.equal(metrics.worstCase, "y");
});

test("cost fit recovers positive coefficients, handles collinearity and zero-valued features", () => {
  const fitted = fitRelative([[1, 3], [6, 2], [1, 1], [4, 7]].map(([scan, prep]) => ({ scan, prep, ms: 2*scan + 3*prep })));
  assert.ok(Math.abs(fitted.scan - 2) < 1e-10 && Math.abs(fitted.prep - 3) < 1e-10);
  assert.deepEqual(fitRelative([{scan: 0, prep: 2, ms: 3}]), {scan: 0, prep: 1.5});
  const collinear = fitRelative([{scan: 2, prep: 2, ms: 3}]);
  assert.ok(Math.abs(collinear.scan + collinear.prep - 1.5) < 1e-10);
});

test("Allmer uses the strict less-than-50 boundary and timing uses a numerical median", () => {
  assert.equal(allmerChoice(49), "bm4DNADS");
  assert.equal(allmerChoice(50), "bm4DNAHMbs");
  assert.equal(median([101,3,20]), 20);
});
