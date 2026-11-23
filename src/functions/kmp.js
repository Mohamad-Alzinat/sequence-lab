export function prepareKMP(pattern) {
  const failure = new Uint32Array(pattern.length);
  for (let i = 1, j = 0; i < pattern.length; i++) {
    while (j && pattern[i] !== pattern[j]) j = failure[j - 1];
    if (pattern[i] === pattern[j]) j++;
    failure[i] = j;
  }
  return (seq, emit) => {
    for (let i = 0, j = 0; i < seq.length; i++) {
      while (j && seq[i] !== pattern[j]) j = failure[j - 1];
      if (seq[i] === pattern[j]) j++;
      if (j === pattern.length) {
        emit(i - j + 1);
        j = failure[j - 1];
      }
    }
  };
}
