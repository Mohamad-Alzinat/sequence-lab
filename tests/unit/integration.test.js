import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {fileURLToPath} from 'node:url';
import {makeServer} from '../../server.js';
import {parseFasta} from '../../src/fasta.js';
import {examples} from '../../web/notes.js';

test('sequence alphabets validate record bodies and preserve literal case and positions',()=>{
  assert.equal(parseFasta('\uFEFF>XYZ 123\r\na c\r\nGt','DNA')[0].seq,'acGt');
  const fasta='>valid header: Z\nACGT\n>second\n a X';
  assert.throws(()=>parseFasta(fasta,'DNA'),/“X” on line 4, column 4/);
  assert.throws(()=>parseFasta('>x\nACN','DNA'),/“N”/);
  assert.equal(parseFasta('>x\nACnRy','AmbiguousDNA')[0].seq,'ACnRy');
  assert.throws(()=>parseFasta('>x\nM2','Protein'),/“2”/);
  assert.throws(()=>parseFasta('>x\nACG7','DNA'),/“7”/);
  assert.throws(()=>parseFasta('>x\nAA','unknown'),/alphabet/);
  for(const example of examples)assert.ok(parseFasta(example.fasta,example.kind).length);
});

test('HTTP endpoints and CLI agree on ordered records and full decision',async t=>{
  const server=makeServer().listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>server.close());
  const base='http://127.0.0.1:'+server.address().port;
  const fixture={fasta:'><header>\nAAAAA\n><header>\naA',patterns:['AA','AA'],ignoreCase:true};
  const post=(path,body)=>fetch(base+'/api/'+path,{method:'POST',body,headers:{'Content-Type':'application/json'}});
  for(const path of ['search','explain','compare']){
    const invalid=await post(path,JSON.stringify({fasta:'>record Z\naTX',patterns:['A'],alphabet:'DNA'}));
    assert.equal(invalid.status,422);
    assert.match((await invalid.json()).error.message,/“X” on line 2, column 3/);
  }
  const cli=(args,input)=>spawnSync(process.execPath,[fileURLToPath(new URL('../../bin/ios.js',import.meta.url)),...args],{encoding:'utf8',input});
  const args=['--patterns','AA,AA','--ignoreCase'];
  const run=cli(['run','ExactMatch',...args],fixture.fasta);
  assert.equal(run.status,0);
  const result=await(await post('search',JSON.stringify(fixture))).json();
  assert.equal(result.matchCount,10);assert.deepEqual(result.records.map(r=>r.recordIndex),[0,1]);
  assert.ok(Number.isFinite(result.calculationMs) && result.calculationMs>=0);
  assert.deepEqual(result.records.flatMap(r=>r.matches),run.stdout.trim().split('\n').map(s=>JSON.parse(s)));
  const decision=await(await post('explain',JSON.stringify(fixture))).json();
  const comparison=await(await post('compare',JSON.stringify(fixture))).json();
  assert.equal(comparison.matchCount,result.matchCount);
  assert.equal(comparison.selected,decision.selected);
  assert.equal(comparison.records,2);
  assert.equal(comparison.rows.length,4);
  for(const row of comparison.rows){
    assert.equal(row.samplesMs.length,3);
    assert.ok(row.samplesMs.every(t=>Number.isFinite(t)&&t>=0));
    assert.equal(row.medianMs,[...row.samplesMs].sort((a,b)=>a-b)[1]);
    assert.ok(Number.isInteger(row.batch)&&row.batch>=1);
  }
  const report=await fetch(base+'/report.pdf');
  assert.equal(report.headers.get('Content-Type'),'application/pdf');
  assert.ok(Buffer.from(await report.arrayBuffer()).subarray(0,5).equals(Buffer.from('%PDF-')));
  assert.deepEqual(decision,result.decision);assert.deepEqual(decision,JSON.parse(cli(['explain',...args],fixture.fasta).stdout));
  assert.equal((await(await fetch(base+'/api/algorithms')).json()).algorithms.length,4);
  assert.equal((await post('search','{')).status,400);
  assert.equal((await post('search','x'.repeat(2*1024*1024+1))).status,413);
  const cap=await post('search',JSON.stringify({...fixture,patterns:['a'],fasta:'>x\n'+'a'.repeat(10001)}));
  assert.equal(cap.status,422);assert.equal((await cap.json()).error.code,'RESULT_LIMIT');
  assert.equal((await post('search',JSON.stringify({...fixture,strategy:'invalid'}))).status,422);
  const nohits=cli(['run','ExactMatch','--patterns','Z'],fixture.fasta);assert.equal(nohits.stdout,'');assert.equal(nohits.status,0);
  const bad=cli(['explain','--patterns','A','--unknown'],fixture.fasta);assert.notEqual(bad.status,0);
  const long=await(await post('search',JSON.stringify({patterns:['Z'],fasta:'>large\n'+'A'.repeat(999999)+'Z'}))).json();
  assert.equal(long.records[0].matches[0].position,999999);
  assert.ok(long.calculationMs>0);
  const empty=await(await post('search',JSON.stringify({...fixture,patterns:['Z'],strategy:'KMPSearch'}))).json();
  assert.equal(empty.matchCount,0);
  assert.ok(Number.isFinite(empty.calculationMs) && empty.calculationMs>=0);
});
