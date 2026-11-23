import {ExactMatch} from '../molecules/ExactMatch.js';
import {parseFasta} from '../fasta.js';
export function search(input, explainOnly=false) {
  const entries=parseFasta(input.fasta,input.alphabet);
  const engine=new ExactMatch(input);
  if(explainOnly) return engine.explain(entries[0]);
  let started;
  const records=[...engine.groups(entries,10000,()=>{started=performance.now();})];
  const elapsedMs=performance.now()-started;
  // An edge runtime can freeze its clock throughout a CPU-only operation.
  const calculationMs=elapsedMs===0 && performance.timeOrigin===0 ? null : elapsedMs;
  return {decision:engine.record,records,matchCount:records.reduce((n,r)=>n+r.matches.length,0),calculationMs};
}
