import { foldASCII, validateParams } from '../functions/alphabet.js';

export class ExactSearchAtom {
  constructor(params) {
    validateParams(params);
    this.patterns = [...params.patterns];
    this.ignoreCase = params.ignoreCase ?? false;
    this.prepared = this.constructor.compile(this.patterns.map(p => this.ignoreCase ? foldASCII(p) : p));
  }

  *process({header, seq}, limit = Infinity) {
    const hits = [];
    this.prepared(this.ignoreCase ? foldASCII(seq) : seq, (position, id) => {
      if (hits.length >= limit) throw Object.assign(new Error('More than 10,000 matches. Narrow the patterns or use the CLI for full output.'), {code:'RESULT_LIMIT'});
      hits.push({position, id});
    });
    hits.sort((a,b) => a.position - b.position || a.id - b.id);
    for (const {position,id} of hits) {
      const pattern = this.patterns[id];
      yield {header, pattern, position, length:pattern.length};
    }
  }
}
export function manifest(name, title, references) {
  return {name, version:'1.0.0', kind:'atom', task:'sequence.pattern-match.exact',title,references};
}
export function perPattern(prepare) {
  return patterns => {
    const searches = patterns.map(prepare);
    return (seq, emit) => searches.forEach((search,id) => search(seq, pos => emit(pos,id)));
  };
}
