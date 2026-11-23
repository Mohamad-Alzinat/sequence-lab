import {examples} from './notes.js';
import {runWorkerSearch} from './timed-search.js';
import {main,$,esc,heading,opts,fmt,pretty,atomTag,getJSON,announce} from './ui.js';

function time(ms){
  if(ms===0)return 'Below timer resolution';
  return ms<0.001?'&lt;0.001 ms':ms.toFixed(3)+' ms';
}

function outcome(result){
  const fastest=result.rows[0].medianMs;
  const best=result.rows.filter(r=>r.medianMs===fastest).map(r=>pretty(r.name));
  const observed=fastest===0?'Below timer resolution':best.join(' / ');
  return '<div class="sectionhead"><h2>Comparison results</h2></div>'+
    '<div class="metrics"><div><small>Automatic choice</small><strong>'+esc(pretty(result.selected))+'</strong></div>'+
    '<div><small>Lowest observed median</small><strong>'+esc(observed)+'</strong></div>'+
    '<div><small>Matching occurrences</small><strong>'+fmt(result.matchCount)+'</strong></div></div>'+
    '<p class="compare-note">All '+result.rows.length+' algorithms returned identical ordered matches across '+fmt(result.records)+' records.</p>'+
    '<div class="panel tablewrap"><table><caption>Elapsed time per complete invocation</caption><thead><tr><th>Algorithm</th><th>Median</th><th>Three samples</th><th>Runs per sample</th></tr></thead><tbody>'+
    result.rows.map(row=>'<tr><td><a class="atomlink" href="#algorithms/'+encodeURIComponent(row.name)+'">'+atomTag(row.name)+esc(pretty(row.name))+'</a></td><td>'+time(row.medianMs)+'</td><td>'+row.samplesMs.map(time).join(' · ')+'</td><td>'+row.batch+'</td></tr>').join('')+
    '</tbody></table></div><p class="muted compare-note">Each timed invocation prepares the patterns, scans every record, and collects ordered matches. Sub-millisecond differences can vary between runs. Saved calibration and validation results are available in <a href="#benchmarks">Benchmarks</a>.</p>';
}

export function showComparison(draft){
  const hasDraft=Boolean(draft.fasta.trim());
  const sources=examples.map((e,i)=>[String(i),e.name]);
  if(hasDraft)sources.unshift(['workspace','Current search input']);
  const initial=hasDraft?'workspace':String(examples.findIndex(e=>e.name==='Technical-debt markers'));
  const url=document.querySelector('script[data-search-worker]')?.dataset.searchWorker;
  main.innerHTML=heading('Compare algorithms','Measure the registered algorithms on the same FASTA records and check the automatic choice.')+
    '<section class="panel formpanel"><div class="row fields"><label>Input source<select id="compare-source">'+opts(sources,initial)+'</select></label><a class="btn" href="#search">Edit search input</a></div>'+
    '<div id="compare-preview"></div><p class="muted">One warm-up per algorithm, then three timed samples in rotating order. Measurements run '+(url?'in this browser.':'on the local Node server.')+'</p>'+
    '<div class="row actions"><button class="btn primary" id="compare-run">Run comparison</button><button class="btn" id="compare-stop" hidden>Cancel</button></div>'+
    '<p id="compare-error" role="alert"></p></section><section id="compare-out" aria-label="Comparison results"></section>';
  const select=$('#compare-source'),run=$('#compare-run'),stop=$('#compare-stop'),out=$('#compare-out'),error=$('#compare-error');
  let controller;
  const input=()=>select.value==='workspace'?draft:examples[Number(select.value)];
  const cancel=()=>{controller?.abort();controller=null;run.disabled=false;run.textContent='Run comparison';stop.hidden=true;};
  function preview(){
    cancel();out.replaceChildren();error.textContent='';
    const value=input();
    $('#compare-preview').innerHTML='<p class="compare-note"><strong>'+value.patterns.length+' patterns</strong> · '+(value.ignoreCase?'ASCII case-insensitive':'Case-sensitive')+'</p><pre>'+esc(value.fasta.slice(0,400))+(value.fasta.length>400?'…':'')+'</pre><p class="compare-note">Patterns: '+esc(value.patterns.slice(0,6).map(p=>p.length>48?p.slice(0,48)+'…':p).join(', '))+(value.patterns.length>6?' …':'')+'</p>';
  }
  select.onchange=preview;
  stop.onclick=()=>{cancel();announce('Comparison cancelled.');};
  run.onclick=async()=>{
    const current=new AbortController();
    controller=current;out.replaceChildren();error.textContent='';run.disabled=true;run.textContent='Comparing…';stop.hidden=false;
    try{
      const value=input();
      const {fasta,patterns,ignoreCase=false,alphabet=value.kind}=value;
      const body=JSON.stringify({fasta,patterns,ignoreCase,alphabet});
      const result=url?await runWorkerSearch(url,body,current.signal,'compare'):
        await getJSON('/api/compare',{method:'POST',headers:{'Content-Type':'application/json'},body,signal:current.signal});
      if(current!==controller)return;
      out.innerHTML=outcome(result);announce('Algorithm comparison complete.');
    }catch(e){if(current===controller)error.textContent=e.message;}
    finally{if(current===controller)cancel();}
  };
  preview();
  return cancel;
}
