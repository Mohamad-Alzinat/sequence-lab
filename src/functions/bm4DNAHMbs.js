// Allmer (2016), HMbs. Hash collisions may shorten a skip but never extend it.
// A fixed two-unit hash bounds table memory across UTF-16 alphabets. Use
// q=1 for a single-unit pattern, otherwise q=2. An absent block can advance
// m-q+1 units: the next possible overlap uses only q-1 units of that block.
export function prepareHMbs(pattern) {
  const m = pattern.length, q = Math.min(2,m), last=m-1;
  const hash = (s,end) => q===1 ? s.charCodeAt(end)&1023
    : ((s.charCodeAt(end-1)*31 + s.charCodeAt(end)) & 1023);
  const shifts = new Uint32Array(1024).fill(m-q+1);
  for (let end=q-1; end<last; end++) shifts[hash(pattern,end)] = last-end;
  const suffix = hash(pattern,last), afterCandidate=shifts[suffix];
  shifts[suffix]=0;
  return (seq,emit) => {
    for (let end=last;end<seq.length;) {
      const step=shifts[hash(seq,end)];
      if (step) { end+=step; continue; }
      const start=end-last;
      let i=0;
      while (i<m && seq[start+i]===pattern[i]) i++;
      if (i===m) emit(start);
      end+=afterCandidate;
    }
  };
}
