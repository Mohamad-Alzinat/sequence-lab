export function allmerChoice(meanLength) {
  return meanLength < 50 ? "bm4DNADS" : "bm4DNAHMbs";
}

export function policyMetrics(policy, rows) {
  if (!rows.length) throw new Error("At least one measured case is required");
  let wins = 0, near = 0, logSum = 0, total = 0, bestTotal = 0;
  let worstSlowdown = 0, worstCase;
  for (const { id, selectedMs, bestMs } of rows) {
    if (!(bestMs > 0 && selectedMs >= bestMs && Number.isFinite(selectedMs))) {
      throw new Error("Expected finite positive medians and a shared fastest reference");
    }
    const ratio = selectedMs / bestMs;
    if (selectedMs === bestMs) wins++;
    if (selectedMs <= 1.1 * bestMs) near++;
    logSum += Math.log(ratio);
    total += selectedMs;
    bestTotal += bestMs;
    if (ratio > worstSlowdown) {
      worstSlowdown = ratio;
      worstCase = id;
    }
  }
  return { policy, fastestRate: wins / rows.length, within10Rate: near / rows.length,
    geometricSlowdown: Math.exp(logSum / rows.length), worstSlowdown,
    totalRatio: total / bestTotal, worstCase };
}

export function fitRelative(featuresAndTimes) {
  // Nonnegative two-term least squares on relative timing errors. Normalize
  // columns for stability. Check the unconstrained interior and both axes.
  const xs = featuresAndTimes.map(({ scan, prep, ms }) => [scan / ms, prep / ms]);
  const scale = [0, 1].map(i => Math.max(1e-30, ...xs.map(x => x[i])));
  const rows = xs.map(([s,p]) => [s / scale[0], p / scale[1]]);
  let ss = 0, sp = 0, pp = 0, sy = 0, py = 0;
  for (const [s,p] of rows) {
    ss += s*s; sp += s*p; pp += p*p; sy += s; py += p;
  }
  const candidates = [[ss ? sy / ss : 0, 0], [0, pp ? py / pp : 0]];
  const det = ss*pp - sp*sp;
  if (det > Number.EPSILON * ss * pp) {
    const interior = [(sy*pp - py*sp) / det, (py*ss - sy*sp) / det];
    if (interior.every(x => x >= 0)) candidates.push(interior);
  }
  const loss = ([a,b]) => rows.reduce((sum, [s,p]) => sum + (s*a + p*b - 1)**2, 0);
  candidates.sort((a,b) => loss(a) - loss(b));
  const [a,b] = candidates[0];
  return { scan: a / scale[0], prep: b / scale[1] };
}
