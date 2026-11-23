import os from "node:os";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { registry } from "../src/registry.js";
import { shapeOf } from "../src/shape.js";
import { fixture } from "./data.js";
import { timeAtom } from "./timing.js";

export const results = new URL("./results/", import.meta.url);

export function metadata(study) {
  const createdAt = new Date().toISOString();
  return {
    id: study + "-" + createdAt.replace(/[:.]/g, "-"),
    createdAt,
    cpu: os.cpus()[0]?.model ?? "unknown",
    node: process.version,
    platform: os.platform() + " " + os.arch(),
    repetitions: 3, warmups: 1, units: "milliseconds per complete atom invocation",
    atoms: Array.from(registry.values(), Atom => Atom.manifest),
    generation: "xorshift32 uniform independent code units; even-indexed patterns sampled from the record, odd-indexed patterns sampled independently",
    boundary: "construct a fresh atom, process one record, consume all ordered hits; input generation, parsing, selection, and disk I/O excluded",
    order: "registry order rotated by case ordinal",
  };
}

export async function saveJson(filename, data) {
  await mkdir(results, { recursive: true });
  const target = new URL(filename, results);
  const temp = new URL(filename + ".tmp", results);
  await writeFile(temp, JSON.stringify(data, null, 2) + "\n");
  await rename(temp, target);
}

export async function readJson(filename) {
  return JSON.parse(await readFile(new URL(filename, results), "utf8"));
}

export function measureCases(definitions, beforeTiming = () => ({})) {
  const roster = [...registry];
  return definitions.map((definition, index) => {
    const { entry, patterns } = fixture(definition);
    const shape = shapeOf(entry, patterns, false);
    const extra = beforeTiming(entry, patterns, shape);
    const timings = {};
    let expectedHits;
    for (let offset = 0; offset < roster.length; offset++) {
      const [name, Atom] = roster[(index + offset) % roster.length];
      const { hits, ...timing } = timeAtom(Atom, entry, patterns);
      if (expectedHits !== undefined && hits !== expectedHits) {
        throw new Error(definition.id + " produced different match counts for " + name);
      }
      expectedHits = hits;
      timings[name] = timing;
    }
    const winner = roster.reduce((best, [name]) =>
      timings[name].medianMs < timings[best].medianMs ? name : best, roster[0][0]);
    if ((index + 1) % 10 === 0) {
      process.stderr.write("Measured " + (index + 1) + "/" + definitions.length + " cases\n");
    }
    return { ...definition, shape, hits: expectedHits, timings, winner, ...extra };
  });
}
