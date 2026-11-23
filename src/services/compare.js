import {parseFasta} from '../fasta.js';
import {registry} from '../registry.js';
import {ExactMatch} from '../molecules/ExactMatch.js';

// One invocation includes pattern compilation and consumption of every ordered hit.
function collect(Atom,params,entries){
  const atom=new Atom(params);
  let remaining=10000;
  return entries.map(entry=>{
    const hits=[...atom.process(entry,remaining)];
    remaining-=hits.length;
    return hits;
  });
}

function sameOutput(left,right){
  return left.every((record,i)=>record.length===right[i].length &&
    record.every((a,j)=>{
      const b=right[i][j];
      return a.position===b.position && a.length===b.length && a.pattern===b.pattern && a.header===b.header;
    }));
}

export function compareAlgorithms(input){
  const entries=parseFasta(input.fasta,input.alphabet);
  const params={patterns:input.patterns,ignoreCase:input.ignoreCase??false};
  const decision=new ExactMatch(params).explain(entries[0]);
  const candidates=[...registry].filter(([name])=>decision.estimates[name].eligible);
  let reference,matchCount=0;
  const rows=candidates.map(([name,Atom])=>{
    const start=performance.now();
    const matches=collect(Atom,params,entries);
    const warmMs=performance.now()-start;
    if(!reference){
      reference=matches;
      matchCount=matches.reduce((sum,record)=>sum+record.length,0);
    }else if(!sameOutput(matches,reference)){
      throw new Error('Ordered matches differ for '+name+'.');
    }
    const batch=Math.min(32,Math.max(1,Math.ceil(1/Math.max(warmMs,0.001))));
    return {name,batch,samplesMs:[]};
  });
  for(let round=0;round<3;round++){
    for(let offset=0;offset<rows.length;offset++){
      const row=rows[(offset+round)%rows.length];
      const Atom=registry.get(row.name);
      const start=performance.now();
      for(let i=0;i<row.batch;i++)collect(Atom,params,entries);
      row.samplesMs.push((performance.now()-start)/row.batch);
    }
  }
  for(const row of rows)row.medianMs=[...row.samplesMs].sort((a,b)=>a-b)[1];
  rows.sort((a,b)=>a.medianMs-b.medianMs);
  return {selected:decision.selected,records:entries.length,matchCount,rows};
}
