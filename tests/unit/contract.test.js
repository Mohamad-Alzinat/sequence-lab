import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registry,register} from '../../src/registry.js';
import {NaiveSearch} from '../../src/atomic/NaiveSearch.js';
import {ExactMatch} from '../../src/molecules/ExactMatch.js';
import {parseFasta} from '../../src/fasta.js';

function compare(Atom,entries,patterns,ignoreCase=false) {
  const params={patterns,ignoreCase};
  const actual=new Atom(params), expected=new NaiveSearch(params);
  for(const entry of entries) assert.deepEqual([...actual.process(entry)],[...expected.process(entry)]);
}
const cases=[
  ['periodic overlaps','ABABABABA',['ABA','BAB','ABA']],
  ['terminal alignment and absent block','XYZABCD',['ABCD','Z','Q']],
  ['sentinel boundary','AAAAA',['A','AA','AAAAA','AAAAAA']],
  ['prefix fallback','ABABACABABABAC',['ABABAC','AC','ABAB']],
  ['nested suffix outputs','ushershe',['he','she','hers','e','he']],
  ['ASCII folding and UTF-16','🙂aÄa🙂',['A','ä','🙂','\ude42']],
  ['hash collision',String.fromCharCode(1121)+'aAAB',['A','AB','AA']],
  ['empty record','',['A']],
  ['literal punctuation','.*[(A)',['.*','[','A)']],
];
for(const [name,Atom] of registry){
  for(const [label,seq,patterns] of cases) test(name+' / '+label,()=>compare(Atom,[{header:'>a',seq}],patterns,true));
  test(name+' / invalid patterns',()=>{for(const patterns of [[],[''],['A','']]) assert.throws(()=>new Atom({patterns}));});
  test(name+' / 320 seeded cases',()=>{
    let state=73819;
    const draw=n=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return Math.floor(n*state/4294967296);};
    for(let i=0;i<320;i++){
      const alphabet=['ACGT','ACDEFGHIKLMNPQRSTVWY',' .!?aZX','ab','Aa','Ω🙂'][i%6];
      const string=n=>Array.from({length:n},()=>alphabet[draw(alphabet.length)]).join('');
      const seq=string(draw(120));
      const patterns=Array.from({length:1+draw(9)},()=>string(1+draw(10)));
      if(seq) patterns.push(seq.slice(-3));
      patterns.push(patterns[0]);
      compare(Atom,[{header:'>a',seq},{header:'>a',seq:string(22)}],patterns,!!(i%2));
    }
  });
  for(const file of ['lambda','ecoli-k12']) test(name+' / '+file,()=>{
    const entries=parseFasta(readFileSync(new URL('../data/'+file+'.fasta',import.meta.url),'utf8'));
    const patterns=entries.slice(0,12).flatMap(e=>[e.seq.slice(0,4),e.seq.slice(-35)]);
    for(let i=0;i<32;i++)patterns.push(entries[0].seq.slice(i,i+11));
    compare(Atom,entries,patterns);
  });
}
test('shared decision, record order, duplicate headers and manual strategies',()=>{
  const entries=[{header:'>same',seq:'XAB'},{header:'>same',seq:'BY'}];
  const patterns=['BB','B','b','B','AB','y'];
  const params={patterns,ignoreCase:true};
  const expected=entries.flatMap(entry=>[...new NaiveSearch(params).process(entry)]);
  for(const strategy of ['auto',...registry.keys()]){
    const engine=new ExactMatch({...params,strategy});
    assert.deepEqual([...engine.run(entries.values())],expected);
    assert.deepEqual(Object.keys(engine.record).sort(),['estimates','requested','selected','shape','why']);
    assert.equal(engine.record.requested,strategy);
    assert.deepEqual(Object.keys(engine.record.estimates).sort(),[...registry.keys()].sort());
    assert.equal(engine.record.shape.n,3);
    if(strategy==='auto')assert.equal(engine.record.estimates[engine.record.selected].totalMs,Math.min(...Object.values(engine.record.estimates).map(x=>x.totalMs)));
    else assert.equal(engine.record.selected,strategy);
  }
});
test('registry injection, excluded competitor, construction once',()=>{
  const Base=registry.get('KMPSearch');let constructions=0;
  class Cheap extends Base { constructor(p){super(p);constructions++} static manifest={...Base.manifest,name:'cheap'}; static selection={features:()=>({scan:0,prep:0}),defaults:{scan:1,prep:1}}; }
  class Excluded extends Cheap {static manifest={...Cheap.manifest,name:'skip'};static selection={applicable:()=>'unsupported'};}
  const candidates=new Map(registry);
  register(Excluded,candidates);
  register(Cheap,candidates);
  const em=new ExactMatch({patterns:['A','BBB','A']},candidates);
  [...em.run([{header:'>x',seq:'ABBA'},{header:'>x',seq:'BBBBB'}].values())];
  assert.equal(constructions,1);assert.equal(em.record.selected,'cheap');
  assert.deepEqual(em.record.shape,{n:4,sigma:2,k:3,min:1,max:3,mean:5/3});
  assert.equal(em.record.estimates.skip.eligible,false);
  assert.throws(()=>new ExactMatch({patterns:['A'],strategy:'skip'},candidates).explain({header:'>x',seq:'A'}),/unsupported/);
  assert.throws(()=>new ExactMatch({patterns:['x'],strategy:'unknown'}),/KMPSearch/);
});
