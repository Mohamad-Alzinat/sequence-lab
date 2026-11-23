// Recompute the published scores from raw repetitions without rerunning a timer.
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validationTable } from "./validation-table.js";
import { registry } from "../src/registry.js";
import { coefficients } from "../src/calibration.js";
import { calibrationCases, validationCases } from "./data.js";
import { median } from "./timing.js";
import { fitRelative, allmerChoice, policyMetrics } from "./metrics.js";
import { readJson } from "./runner.js";

const [training, heldOut, model] = await Promise.all([
  readJson("calibration.json"), readJson("validation.json"), readJson("model.json"),
]);
assert.equal(heldOut.calibrationId, training.meta.id);
const names = [...registry.keys()];
for (const [study, definitions] of [[training, calibrationCases()], [heldOut, validationCases()]]) {
  assert.equal(study.cases.length, definitions.length);
  assert.equal(study.meta.repetitions, 3);
  for (const [i, c] of study.cases.entries()) {
    for (const [key, value] of Object.entries(definitions[i])) assert.equal(c[key], value);
    assert.deepEqual(Object.keys(c.timings).sort(), [...names].sort());
    for (const t of Object.values(c.timings)) {
      assert.equal(t.samplesMs.length, 3);
      assert.ok(t.samplesMs.every(x => Number.isFinite(x) && x > 0));
      assert.equal(median(t.samplesMs), t.medianMs);
      assert.ok(Number.isInteger(t.batch) && t.batch > 0);
    }
    assert.equal(c.timings[c.winner].medianMs, Math.min(...Object.values(c.timings).map(t => t.medianMs)));
  }
}
assert.deepEqual(coefficients, model);
for (const [name, Atom] of registry) {
  assert.deepEqual(model[name], fitRelative(training.cases.map(c => ({
    ...Atom.selection.features(c.shape), ms: c.timings[name].medianMs,
  }))));
}
for (const c of heldOut.cases) {
  for (const [name, Atom] of registry) {
    const { prep, scan } = Atom.selection.features(c.shape);
    assert.equal(c.estimates[name], prep * model[name].prep + scan * model[name].scan);
  }
  assert.equal(c.estimates[c.selected], Math.min(...Object.values(c.estimates)));
  assert.equal(c.slowdown, c.timings[c.selected].medianMs / c.timings[c.winner].medianMs);
  assert.equal(c.allmer, allmerChoice(c.m));
}
assert.deepEqual(heldOut.policies.map(p => p.policy), ["auto", ...names, "Allmer 2016"]);
for (const p of heldOut.policies) {
  const rows = heldOut.cases.map(c => {
    const chosen = p.policy === "auto" ? c.selected : p.policy === "Allmer 2016" ? c.allmer : p.policy;
    return { id: c.id, bestMs: c.timings[c.winner].medianMs, selectedMs: c.timings[chosen].medianMs };
  });
  assert.deepEqual(policyMetrics(p.policy, rows), p);
}
const table = await readFile(new URL("./results/validation-table.md", import.meta.url), "utf8");
assert.equal(table.replaceAll("\r\n","\n"), validationTable(heldOut));
console.log("Verified raw medians, grid identities, coefficients, decisions, all policy metrics, and the validation table.");
