export function validationTable({meta, cases, policies}) {
  const rows = policies.map(p => [
    p.policy,
    (100 * p.fastestRate).toFixed(1) + '%',
    (100 * p.within10Rate).toFixed(1) + '%',
    p.geometricSlowdown.toFixed(3) + '×',
    p.worstSlowdown.toFixed(3) + '×',
    p.totalRatio.toFixed(3) + '×',
    p.worstCase
  ]);
  return [
    '# Held-out validation',
    '',
    `Run \`${meta.id}\` · ${cases.length} cases · ${meta.cpu} · Node ${meta.node}.`,
    '',
    '| Policy | Fastest | Within 10% | Geometric slowdown | Worst slowdown | Total time / fastest total | Worst case |',
    '|---|---:|---:|---:|---:|---:|---|',
    ...rows.map(row => '| ' + row.join(' | ') + ' |'),
    '',
    'Values use per-case median milliseconds for constructing the atom and consuming all ordered hits. The denominators are the fastest observed medians for the same cases. Full-precision values and raw repetitions are in validation.json.',
    ''
  ].join('\n');
}
