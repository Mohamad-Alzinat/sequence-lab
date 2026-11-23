// Fixture generation is deterministic and runs outside the timed region.
export const alphabets = {
  DNA: "ACGT",
  Protein: "ACDEFGHIKLMNPQRSTVWY",
  Text: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ.,!?",
  Binary: "ab",
};

export const grid = {
  alphabet: ["DNA", "Protein", "Text"],
  n: [10_000, 100_000, 1_000_000],
  m: [4, 16, 32, 50, 96],
  k: [1, 4, 12, 32],
};

export function random(seed) {
  let state = seed >>> 0;
  if (state === 0) throw new Error("xorshift32 requires a nonzero seed");
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 0x100000000;
  };
}

export function calibrationCases() {
  const cases = [];
  for (const alphabet of grid.alphabet) {
    for (const n of grid.n) {
      for (const m of grid.m) {
        for (const k of grid.k) {
          const index = cases.length;
          cases.push({ id: "C" + String(index + 1).padStart(3, "0"), seed: 97009 + 8191 * index, alphabet, n, m, k });
        }
      }
    }
  }
  return cases;
}

export function validationCases() {
  // Prespecified independent holdout. Cycle all alphabet and length strata.
  const rng = random(0xa2735b91);
  const between = (low, high) => low + 1 + Math.floor(rng() * (high - low - 1));
  return Array.from({ length: 100 }, (_, i) => {
    const alphabet = Object.keys(alphabets)[i % 4];
    const nBand = Math.floor(i / 4) % 2;
    const mBand = (Math.floor(i / 8) + i % 4) % 4;
    const kBand = (Math.floor(i / 4) + i % 4) % 3;
    return {
      id: "V" + String(i + 1).padStart(3, "0"),
      seed: 0xc0000000 + i * 65537,
      alphabet,
      n: between(grid.n[nBand], grid.n[nBand + 1]),
      m: between(grid.m[mBand], grid.m[mBand + 1]),
      k: between(grid.k[kBand], grid.k[kBand + 1]),
    };
  });
}

export function fixture({ id, seed, alphabet, n, m, k }) {
  const symbols = alphabets[alphabet];
  const rng = random(seed);
  const makeText = (length) => {
    const bytes = Buffer.allocUnsafe(length);
    for (let i = 0; i < length; i++) {
      bytes[i] = symbols.charCodeAt(Math.floor(rng() * symbols.length));
    }
    return bytes.toString("latin1");
  };
  const seq = makeText(n);
  const patterns = Array.from({ length: k }, (_, i) => {
    if (i % 2) return makeText(m);
    const start = Math.floor(rng() * (n - m + 1));
    return seq.slice(start, start + m);
  });
  return { entry: { header: ">" + id, seq }, patterns };
}
