import { performance } from "node:perf_hooks";

export function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function timeAtom(Atom, entry, patterns) {
  function fullRun() {
    const atom = new Atom({ patterns, ignoreCase: false });
    let hits = 0;
    for (const _match of atom.process(entry)) hits++;
    return hits;
  }
  const startWarm = performance.now();
  const hits = fullRun();
  const warmMs = performance.now() - startWarm;
  // Batch sub-millisecond operations. Include construction in every invocation.
  const batch = Math.min(64, Math.max(1, Math.ceil(1 / Math.max(warmMs, 0.001))));
  const samplesMs = [];
  for (let repeat = 0; repeat < 3; repeat++) {
    const start = performance.now();
    let count = 0;
    for (let i = 0; i < batch; i++) count += fullRun();
    samplesMs.push((performance.now() - start) / batch);
    if (count !== hits * batch) throw new Error("Nondeterministic match count");
  }
  return { hits, samplesMs, medianMs: median(samplesMs), batch };
}
