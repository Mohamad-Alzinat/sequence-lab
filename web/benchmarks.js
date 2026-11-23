import {main,$,esc,heading,getJSON,opts,fmt,ms,codeId,tone,pretty} from './ui.js';
import {trend} from './trends.js';
let stored;
export async function showBenchmarks(){
  main.innerHTML=heading('Benchmarks','Explore measured runtimes, winning regions, and held-out selector performance.')+'<p role="status" id="benchbody">Loading measurements…</p>';
  const loading=$('#benchbody');
  try{
    if(!stored){
      const {runs}=await getJSON('/api/benchmarks');
      if(!runs.length){loading.textContent='No saved measurements. Run npm run calibrate, then npm run bench.';return;}
      stored=await getJSON('/api/benchmarks/'+encodeURIComponent(runs[0].id));
    }
    if(!loading.isConnected)return;
    loading.remove();render(stored);
  }catch(e){if(loading.isConnected)loading.textContent='Could not load benchmarks. '+e.message;}
}
function render({calibration,validation}){
  const cells=calibration.cases,policies=validation.policies,auto=policies.find(p=>p.policy==='auto');
  const unique=key=>Array.from(new Set(cells.map(c=>c[key])));
  let alphabet=unique('alphabet')[0],length=unique('n')[0],cell=cells[0];
  const worst=validation.cases.reduce((a,b)=>a.slowdown>b.slowdown?a:b);
  main.insertAdjacentHTML('beforeend','<div class="metrics"><div><small>Calibration cases</small><strong>'+cells.length+'</strong></div><div><small>Held-out cases</small><strong>'+validation.cases.length+'</strong></div><div><small>Fastest selections</small><strong>'+Math.round(100*auto.fastestRate)+'%</strong></div><div><small>Total time ratio</small><strong>'+auto.totalRatio.toFixed(3)+'×</strong></div></div>'+
    '<div class="sectionhead"><h2>Measured winning regions</h2></div><section class="panel formpanel"><div class="row fields"><label>Alphabet<select id="alpha">'+opts(unique('alphabet').map(a=>[a,a]),alphabet)+'</select></label><label>Record length<select id="len">'+opts(unique('n').map(n=>[n,fmt(n)]),length)+'</select></label></div><p>Select a cell to compare median runtimes at that pattern length and count.</p><div id="heatmap" class="tablewrap"></div><div id="timing"></div></section>'+
    '<div class="sectionhead"><h2>Validation policies</h2></div><div class="panel tablewrap"><table><thead><tr><th>Policy</th><th>Fastest</th><th>Within 10%</th><th>Geometric mean</th><th>Worst</th><th>Total ratio</th></tr></thead><tbody>'+policies.map(p=>'<tr><td>'+esc(p.policy)+'</td><td>'+Math.round(100*p.fastestRate)+'%</td><td>'+Math.round(100*p.within10Rate)+'%</td><td>'+p.geometricSlowdown.toFixed(3)+'×</td><td>'+p.worstSlowdown.toFixed(3)+'×</td><td>'+p.totalRatio.toFixed(3)+'×</td></tr>').join('')+'</tbody></table></div>'+
    '<div class="sectionhead"><h2>Inspect a validation case</h2></div><section class="panel formpanel"><label for="vcase">Case · selected / fastest</label><select id="vcase">'+opts(validation.cases.map(c=>[c.id,c.id+' · '+c.selected+' / '+c.winner]),worst.id)+'</select><div id="caseinfo"></div></section>'+
    '<p class="muted provenance">'+esc(validation.meta.cpu)+' · Node '+esc(validation.meta.node)+' · '+validation.meta.warmups+' warm-up · median of '+validation.meta.repetitions+' repetitions<br>Run '+esc(validation.meta.id)+'. Times include atom construction and match consumption. Selector overhead is excluded.</p>');
  $('#timing').insertAdjacentHTML('afterend','<h3>Runtime by input size</h3><label for="axis">Vary one dimension</label><select id="axis"><option value="n">Record length</option><option value="m">Pattern length</option><option value="k">Pattern count</option></select><div id="trend"></div>');
  const drawTrend=()=>{$('#trend').innerHTML=trend(cells,cell,$('#axis').value,$('#trend').clientWidth);};
  $('#axis').onchange=drawTrend;
  function paint(){
    const slice=cells.filter(c=>c.alphabet===alphabet&&c.n===length);
    const point=(m,k)=>slice.find(c=>c.m===m&&c.k===k);
    cell=point(cell.m,cell.k)??slice[0];
    $('#heatmap').innerHTML='<table class="heattable"><caption>Fastest atom by pattern length (m) and pattern count (k)</caption><thead><tr><th>m / k</th>'+unique('k').map(k=>'<th>'+k+'</th>').join('')+'</tr></thead><tbody>'+unique('m').map(m=>'<tr><th>'+m+'</th>'+unique('k').map(k=>{const c=point(m,k);return '<td><button data-cell="'+c.id+'" class="heat '+tone(c.winner)+'" aria-pressed="'+(c===cell)+'" title="'+esc(c.winner)+' · '+ms(c.timings[c.winner].medianMs)+' ms">'+codeId(c.winner)+'</button></td>';}).join('')+'</tr>').join('')+'</tbody></table>';
    const max=Math.max(...Object.values(cell.timings).map(t=>t.medianMs));
    $('#timing').innerHTML='<h3>'+cell.id+' · Median runtime</h3><p class="muted">'+alphabet+' · '+fmt(length)+' units · '+cell.k+' patterns of length '+cell.m+'</p>'+Object.entries(cell.timings).map(([name,t])=>'<div class="barrow"><span>'+esc(pretty(name))+'</span><div class="track"><div class="bar '+tone(name)+'" style="width:'+100*t.medianMs/max+'%"></div></div><b>'+ms(t.medianMs)+' ms</b></div>').join('');
    drawTrend();
    for(const b of document.querySelectorAll('[data-cell]'))b.onclick=()=>{cell=slice.find(c=>c.id===b.dataset.cell);paint();document.querySelector('[data-cell="'+cell.id+'"]').focus();};
  }
  function val(){
    const c=validation.cases.find(c=>c.id===$('#vcase').value);
    $('#caseinfo').innerHTML='<p>'+esc(c.alphabet)+' · n = '+fmt(c.n)+' · m = '+c.m+' · k = '+c.k+'. Selected <strong>'+esc(c.selected)+'</strong> at '+c.slowdown.toFixed(3)+'× the fastest runtime.</p><div class="tablewrap"><table><thead><tr><th>Atom</th><th>Estimate (ms)</th><th>Measured (ms)</th><th>Error (ms)</th></tr></thead><tbody>'+Object.entries(c.timings).map(([name,t])=>'<tr><td>'+name+'</td><td>'+ms(c.estimates[name])+'</td><td>'+ms(t.medianMs)+'</td><td>'+(c.estimates[name]-t.medianMs).toFixed(3)+'</td></tr>').join('')+'</tbody></table></div>';
  }
  $('#alpha').onchange=e=>{alphabet=e.target.value;paint();};$('#len').onchange=e=>{length=+e.target.value;paint();};
  $('#vcase').onchange=val;paint();val();
}
