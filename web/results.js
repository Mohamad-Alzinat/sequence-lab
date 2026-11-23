import {main,$,esc,heading,empty,download,fmt,opts,pretty,announce} from './ui.js';
import {icon} from './icons.js';
export function showResults(result,patterns){
  main.innerHTML=heading('Match results','Explore record-local positions and inspect overlapping matches.');
  if(!result){main.innerHTML+=empty('No search results yet','Run a sequence search to open the viewer and export your matches.');return;}
  let recordIndex=0,filter=-1,selected=0,start=0;
  const windowSize=64,pageSize=20;
  const ids=new Map();
  patterns.forEach((p,i)=>{if(!ids.has(p))ids.set(p,[]);ids.get(p).push(i);});
  function matches(record){
    const seen=new Map();let prev=-1;
    return record.matches.map((m,index)=>{
      if(prev!==m.position){prev=m.position;seen.clear();}
      const copy=seen.get(m.pattern)??0;seen.set(m.pattern,copy+1);
      return {...m,index,id:ids.get(m.pattern)[copy]};
    }).filter(m=>filter===-1||filter===m.id);
  }
  main.innerHTML+='<div class="row statline"><strong>'+fmt(result.matchCount)+' matches</strong><span>'+fmt(result.records.length)+' records</span><a href="#inspector">'+esc(pretty(result.decision.selected))+'</a><button class="btn" id="export">'+icon('download',15)+'Export JSONL</button></div><section class="panel formpanel"><div class="panelhead"><span class="titleicon">'+icon('dna')+'</span><h2>Sequence viewer</h2></div><div class="row fields"><label>FASTA record<select id="recordSelect">'+opts(result.records.map((r,i)=>[i,(i+1)+' · '+r.header]),0)+'</select></label><label>Pattern filter<select id="filter">'+opts([[-1,'All patterns'],...patterns.map((p,i)=>[i,(i+1)+' · '+p])],-1)+'</select></label></div><div id="viewer"></div></section><div class="sectionhead"><h2>Occurrences</h2></div><div id="occurrences"></div>';
  const timing=document.createElement('span');
  const duration=result.calculationMs;
  const display=Number.isFinite(duration)
    ? (duration===0?'below timer resolution':duration<0.01?'<0.01 ms':duration.toFixed(2)+' ms')
    : 'unavailable for this run';
  timing.textContent='Calculation time: '+display;
  timing.title='Elapsed time for pattern preparation, matching, and ordering results across all FASTA records.';
  $('#export').before(timing);
  const compare=document.createElement('a');
  compare.href='#compare';compare.textContent='Compare algorithms';
  $('#export').before(compare);
  $('#export').onclick=()=>{const rows=result.records.flatMap(r=>r.matches.map(m=>JSON.stringify(m)));download('matches.jsonl',rows.join('\n')+(rows.length?'\n':''),'application/x-ndjson');};
  const color=id=>['mint','violet','orange','blue'][id%4];
  function draw(jump=false){
    const record=result.records[recordIndex],list=matches(record);
    selected=Math.max(0,Math.min(list.length-1,selected));
    const hit=list[selected];
    if(jump&&hit)start=Math.floor(hit.position/windowSize)*windowSize;
    const end=Math.min(record.seq.length,start+windowSize);
    const visible=list.filter(m=>m.position<end&&m.position+m.length>start);
    let sequence='';
    for(let i=start;i<end;i++){
      if((i-start)%16===0)sequence+='<div class="seqline"><small>'+fmt(i)+'</small><div>';
      const covering=visible.filter(m=>m.position<=i&&m.position+m.length>i);
      const focus=hit&&i>=hit.position&&i<hit.position+hit.length;
      const label=covering.slice(0,5).map(m=>'#'+(m.id+1)+' @ '+m.position).join(' · ')+(covering.length>5?' · '+covering.length+' total':'');
      sequence+='<span class="base '+(covering.length?'covered '+color(covering[0].id):'')+(focus?' current':'')+(covering.length>1?' overlap':'')+'" title="'+esc(i+(label?' · '+label:''))+'">'+esc(record.seq[i])+'</span>';
      if((i-start)%16===15||i===end-1)sequence+='</div></div>';
    }
    $('#viewer').innerHTML='<div class="ruler"><span>Offset '+fmt(start)+'</span><span>'+fmt(end)+' / '+fmt(record.seq.length)+' units</span></div><div class="sequence">'+(sequence||'Empty record')+'</div><div class="row navcontrols"><button class="btn" id="winprev" '+(start===0?'disabled':'')+'>Previous window</button><button class="btn" id="winnext" '+(end>=record.seq.length?'disabled':'')+'>Next window</button></div><p class="muted">Double underline marks overlaps. Select an occurrence below to inspect its full span.</p>';
    const page=Math.floor(selected/pageSize),slice=list.slice(page*pageSize,(page+1)*pageSize);
    $('#occurrences').innerHTML='<div class="panel tablewrap"><table><thead><tr><th>Pattern</th><th>Position (0-based)</th><th>Length</th><th>End (exclusive)</th></tr></thead><tbody>'+slice.map((m,i)=>'<tr class="'+(selected===page*pageSize+i?'selectedrow':'')+'"><td><button data-hit="'+(page*pageSize+i)+'" class="hitbtn"><span class="atomtag '+color(m.id)+'">'+(m.id+1)+'</span>'+esc(m.pattern)+'</button></td><td>'+fmt(m.position)+'</td><td>'+m.length+'</td><td>'+fmt(m.position+m.length)+'</td></tr>').join('')+'</tbody></table>'+(list.length?'':'<p class="pad">No occurrences for this record and filter.</p>')+'</div><div class="row navcontrols"><button class="btn" id="prev" '+(!selected?'disabled':'')+'>Previous match</button><button class="btn" id="next" '+(selected+1>=list.length?'disabled':'')+'>Next match</button><span>'+(hit?'Match '+fmt(selected+1)+' of '+fmt(list.length):'0 matches')+'</span><button class="btn" id="pageprev" '+(!page?'disabled':'')+'>Previous page</button><button class="btn" id="pagenext" '+((page+1)*pageSize>=list.length?'disabled':'')+'>Next page</button></div>';
    function go(n,focus){selected=n;draw(true);announce('Occurrence '+(selected+1)+' at offset '+list[selected].position);const el=$(focus);if(el&&!el.disabled)el.focus();}
    $('#winprev').onclick=()=>{start=Math.max(0,start-windowSize);draw();$('#winprev').focus();};
    $('#winnext').onclick=()=>{start+=windowSize;draw();$('#winnext').focus();};
    $('#prev').onclick=()=>go(selected-1,'#prev');$('#next').onclick=()=>go(selected+1,'#next');
    $('#pageprev').onclick=()=>go((page-1)*pageSize,'#pageprev');$('#pagenext').onclick=()=>go((page+1)*pageSize,'#pagenext');
    for(const b of document.querySelectorAll('[data-hit]'))b.onclick=()=>go(+b.dataset.hit,'[data-hit="'+b.dataset.hit+'"]');
  }
  $('#recordSelect').onchange=e=>{recordIndex=+e.target.value;start=selected=0;draw(true);};
  $('#filter').onchange=e=>{filter=+e.target.value;start=selected=0;draw(true);};
  draw(true);
}
