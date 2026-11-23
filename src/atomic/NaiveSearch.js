import {validateParams} from '../functions/alphabet.js';
// Independent positional oracle, including its own ASCII comparison and output ordering.
export class NaiveSearch {
  constructor(params) { validateParams(params); this.params=params; }
  *process({seq,header}) {
    const norm = s => this.params.ignoreCase ? s.replace(/[A-Z]/g,c=>c.toLowerCase()) : s;
    const text=norm(seq);
    const needles=this.params.patterns.map(norm);
    for(let position=0;position<text.length;position++){
      for(let i=0;i<needles.length;i++) if(text.startsWith(needles[i],position)){
        const pattern=this.params.patterns[i];
        yield {header,pattern,position,length:pattern.length};
      }
    }
  }
}
