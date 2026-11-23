// Allmer (2016), DS. Bounds checks replace sentinel text padding. The suffix
// gets zero in d0; retain its previous positive distance separately for a hit.
// A single prefix sentinel and sparse code-unit shifts support all alphabets.
export function prepareDS(pattern) {
  const m = pattern.length, last = m - 1;
  const shifts = new Map();
  for (let i = 0; i < last; i++) shifts.set(pattern.charCodeAt(i),last - i);
  const terminal = pattern.charCodeAt(last);
  const afterCandidate = shifts.get(terminal) ?? m;
  shifts.set(terminal,0);
  return (seq,emit) => {
    let end = last;
    while (end < seq.length) {
      let step = shifts.get(seq.charCodeAt(end)) ?? m;
      if (step) {
        // Three successive skips, stopping on the first suffix candidate.
        end += step;
        if (end >= seq.length) break;
        step = shifts.get(seq.charCodeAt(end)) ?? m;
        if (step) {
          end += step;
          if (end >= seq.length) break;
          end += shifts.get(seq.charCodeAt(end)) ?? m;
        }
        continue;
      }
      const start = end - last;
      // Prefix sentinel, followed by literal verification of remaining units.
      if (seq[start] === pattern[0]) {
        let i = 1;
        while (i < last && seq[start+i] === pattern[i]) i++;
        if (i >= last) emit(start);
      }
      end += afterCandidate;
    }
  };
}
