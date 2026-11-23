function node() { return {edges:new Map(), fail:null, suffix:null, ids:[]}; }

export function prepareAC(patterns) {
  const root = node();
  for (const [id,pattern] of patterns.entries()) {
    let state = root;
    for (let i = 0; i < pattern.length; i++) {
      if (!state.edges.has(pattern[i])) state.edges.set(pattern[i],node());
      state = state.edges.get(pattern[i]);
    }
    state.ids.push(id);
  }
  const queue = [...root.edges.values()];
  for (const child of queue) child.fail = root;
  for (let i = 0; i < queue.length; i++) {
    const parent = queue[i];
    for (const [symbol,child] of parent.edges) {
      let fallback = parent.fail;
      while (fallback !== root && !fallback.edges.has(symbol)) fallback = fallback.fail;
      child.fail = fallback.edges.get(symbol) ?? root;
      child.suffix = child.fail.ids.length ? child.fail : child.fail.suffix;
      queue.push(child);
    }
  }
  return (seq,emit) => {
    let state = root;
    for (let i = 0; i < seq.length; i++) {
      while (state !== root && !state.edges.has(seq[i])) state = state.fail;
      state = state.edges.get(seq[i]) ?? root;
      for (let output = state; output; output = output.suffix) {
        for (const id of output.ids) emit(i - patterns[id].length + 1,id);
      }
    }
  };
}
