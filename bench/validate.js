import assert from "node:assert/strict";
import {writeFile} from "node:fs/promises";
import {validationTable} from "./validation-table.js";
import { coefficients } from "../src/calibration.js";
import { ExactMatch } from "../src/molecules/ExactMatch.js";
import { registry } from "../src/registry.js";
import { validationCases } from "./data.js";
import { allmerChoice, policyMetrics } from "./metrics.js";
import { metadata, measureCases, saveJson, readJson } from "./runner.js";

const calibration = await readJson("calibration.json");
const frozen = await readJson("model.json");
assert.deepEqual(coefficients, frozen, "Model must match the saved calibration");
assert.deepEqual(Object.keys(frozen), [...registry.keys()], "Recalibrate after a roster change");
const meta = metadata("validation");
const cases = measureCases(validationCases(), (entry, patterns, shape) => {
  const molecule = new ExactMatch({ patterns, strategy: "auto", ignoreCase: false });
  const decision = molecule.explain(entry);
  const { selected } = decision;
  const estimates = Object.fromEntries(Object.entries(decision.estimates).map(
    ([name, costs]) => [name, costs.totalMs]
  ));
  return { selected, estimates, allmer: allmerChoice(shape.mean) };
});

for (const c of cases) c.slowdown = c.timings[c.selected].medianMs / c.timings[c.winner].medianMs;
const policies = [
  ["auto", c => c.selected],
  ...Array.from(registry.keys(), atom => [atom, () => atom]),
  ["Allmer 2016", c => c.allmer],
].map(([name, choice]) => policyMetrics(name, cases.map(c => ({
  id: c.id, selectedMs: c.timings[choice(c)].medianMs, bestMs: c.timings[c.winner].medianMs,
}))));

const study = { meta, calibrationId: calibration.meta.id, policies, cases };
await saveJson("validation.json", study);
await writeFile(new URL("./results/validation-table.md", import.meta.url), validationTable(study));
console.table(policies);
process.stdout.write("Validated on " + cases.length + " held-out cases. Run ID " + meta.id + "\n");
