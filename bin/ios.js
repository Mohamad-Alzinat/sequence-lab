import {parseArgs} from 'node:util';
import {once} from 'node:events';
import {parseFasta} from '../src/fasta.js';
import {ExactMatch} from '../src/molecules/ExactMatch.js';

try {
  const {values,positionals}=parseArgs({allowPositionals:true,options:{
    patterns:{type:'string'},ignoreCase:{type:'boolean',default:false},strategy:{type:'string',default:'auto'}
  }});
  const command=positionals.join(' ');
  if(!['run ExactMatch','explain'].includes(command) || values.patterns===undefined) {
    throw new Error('Use run ExactMatch or explain, with --patterns ACGT,GGCC [--ignoreCase] [--strategy auto].');
  }
  const engine=new ExactMatch({...values,patterns:values.patterns.split(',')});
  process.stdin.setEncoding('utf8');
  let input='';
  for await (const chunk of process.stdin) input+=chunk;
  const entries=parseFasta(input);
  const rows=command==='explain' ? [engine.explain(entries[0])] : engine.run(entries);
  for(const row of rows) if(!process.stdout.write(JSON.stringify(row)+'\n')) await once(process.stdout,'drain');
} catch(error) {
  console.error(error.message); process.exitCode=1;
}
