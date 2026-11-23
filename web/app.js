import {parseFasta,sequenceAlphabets} from './fasta.js';
import {icon} from './icons.js';
import {examples,notes} from './notes.js';
import {main,$,esc,heading,empty,atomTag,pretty,tone,opts,ms,download,getJSON,announce,fmt} from './ui.js';
import {showResults} from './results.js';
import {runWorkerSearch} from './timed-search.js';
import {showBenchmarks} from './benchmarks.js';
import {showComparison} from './compare.js';

const nav={overview:'Overview',search:'Sequence search',results:'Match results',inspector:'Selection inspector',compare:'Compare algorithms',algorithms:'Algorithm explorer',benchmarks:'Benchmarks',docs:'Documentation'};
const sections=Object.keys(nav);
const navLink=k=>'<a data-page="'+k+'" href="#'+k+'">'+icon(k,18)+'<span>'+nav[k]+'</span></a>';
$('#worknav').innerHTML=sections.slice(0,5).map(navLink).join('');
$('#resnav').innerHTML=sections.slice(5).map(navLink).join('');
$('#topicon').innerHTML=icon('overview',15);
$('#guide').innerHTML=icon('docs',16)+'<span>Documentation</span>';
const mobile=matchMedia('(max-width:840px)');
function navState(){const open=document.body.classList.contains('navopen');$('#sidebar').inert=mobile.matches&&!open;$('#menu').setAttribute('aria-expanded',String(open));}
$('#menu').onclick=()=>{document.body.classList.toggle('navopen');navState();};
mobile.addEventListener('change',navState);
document.querySelector('.skip').onclick=e=>{e.preventDefault();main.focus();};

const state={algorithms:[],draft:{alphabet:'DNA',fasta:'',patterns:[''],ignoreCase:false,strategy:'auto'},result:null,decision:null};
let active='',request=null,requestVersion=0;
let cancelComparison;
function example(i){state.draft={alphabet:examples[i].kind,fasta:examples[i].fasta,patterns:[...examples[i].patterns],strategy:'auto',ignoreCase:false};invalidate();}
function invalidate(){requestVersion++;request?.abort();request=null;state.result=null;state.decision=null;}
function sampleNav(i){example(i);if(active==='search')searchPage();else location.hash='search';}
function overview(){
  const cards=[
    ['search','mint','Sequence search','Find exact matches across FASTA records with one or more patterns.'],
    ['inspector','violet','Selection inspector','Inspect the input shape, cost estimates, and algorithm decision.'],
    ['benchmarks','orange','Benchmarks','Compare measured runtimes and explore validation results.']
  ];
  main.innerHTML=heading('Workspace overview','Your workspace for exact sequence analysis.')+
  '<section class="hero"><img src="/helix.svg" class="helix" alt=""><div class="herocopy"><div class="eyebrow"><span class="eyeline"></span>SEQUENCE ANALYSIS</div><h2>Intelligent exact<br>pattern matching<span>.</span></h2><p>Search sequences, inspect algorithm decisions, and compare performance in one workspace.</p><div class="heroactions"><a class="btn hero-primary" href="#search">'+icon('run',15)+'Start sequence search</a><button class="btn hero-secondary" id="load">'+icon('file',16)+'Load example</button></div></div></section>'+
  '<div class="sectionhead"><h2>Analysis tools</h2></div><div class="toolcards">'+cards.map(([id,color,title,desc])=>'<a class="toolcard" href="#'+id+'"><div class="cardtop"><span class="tileicon '+color+'">'+icon(id,22)+'</span>'+icon('chev',16)+'</div><h3>'+title+'</h3><p>'+desc+'</p></a>').join('')+'</div>'+
  '<div class="sectionhead"><h2>Algorithm registry <span class="count">'+state.algorithms.length+'</span></h2><a class="textlink" href="#algorithms">Explore algorithms '+icon('chev',14)+'</a></div>'+
  '<div class="panel tablewrap"><table><thead><tr><th>Algorithm</th><th>Search family</th><th>Group</th></tr></thead><tbody>'+state.algorithms.map(a=>'<tr><td><a class="atomlink" href="#algorithms/'+encodeURIComponent(a.name)+'">'+atomTag(a.name)+esc(pretty(a.name))+'</a></td><td>'+esc(notes[a.name]?.family??a.title)+'</td><td><span class="groupchip">'+esc(notes[a.name]?.group??'Custom')+'</span></td></tr>').join('')+'</tbody></table></div>';
  $('#load').onclick=()=>sampleNav(0);
  main.insertAdjacentHTML('beforeend','<div class="sectionhead"><h2>Selection workflow</h2><a class="textlink" href="#docs">Architecture '+icon('chev',14)+'</a></div><section class="panel formpanel"><div class="flow"><span>First FASTA record</span> › <span>Input shape</span> › <span>Estimated costs</span> › <strong>Selected atom</strong></div><p>Automatic selection compares setup and scan costs learned from calibration. The chosen atom processes every record in the search.</p></section>');
}
function searchPage(){
  const d=state.draft;
  main.innerHTML=heading('Sequence search','Search every record for exact, overlapping occurrences of your patterns.')+
    '<form id="form"><div class="searchgrid"><section class="panel formpanel"><div class="panelhead"><span class="titleicon">'+icon('dna')+'</span><h2>Sequence input</h2></div><label for="alphabet">Sequence alphabet</label><select id="alphabet">'+opts(Object.entries(sequenceAlphabets).map(([key,value])=>[key,value.label]),d.alphabet)+'</select><label for="fasta">FASTA records</label><textarea id="fasta" aria-describedby="alphabet-help fasta-feedback" spellcheck="false" placeholder=">record_01&#10;ACGTACGT">'+esc(d.fasta)+'</textarea><p id="alphabet-help" class="muted"></p><p id="fasta-feedback" aria-live="polite"></p><div class="row"><label class="btn filebtn">'+icon('file',16)+'Upload file<input id="upload" type="file" accept=".fa,.fasta,.fna,.faa,.txt,text/plain"></label><select aria-label="Load an example" id="example">'+opts([['','Load example…'],...examples.map((e,i)=>[i,e.name])],'')+'</select></div></section>'+
    '<section class="panel formpanel"><div class="panelhead"><span class="titleicon">'+icon('sliders')+'</span><h2>Search parameters</h2></div><label id="patternlabel">Exact patterns</label><div id="patterns"></div><button type="button" class="textbtn" id="add">+ Add pattern</button><label for="strategy">Algorithm strategy</label><select id="strategy">'+opts([['auto','Automatic selection'],...state.algorithms.map(a=>[a.name,pretty(a.name)])],d.strategy)+'</select><label class="check"><input type="checkbox" id="fold" '+(d.ignoreCase?'checked':'')+'>Ignore ASCII letter case</label></section></div>'+
    '<div id="error" role="alert"></div><div class="row actions"><button class="btn primary" id="submit">'+icon('run',15)+'Run search</button><button class="btn" type="button" id="explain">'+icon('inspector',16)+'Explain choice</button><button type="button" class="btn" id="clear">Clear</button><button class="btn" type="button" id="cancel" hidden>Cancel</button></div></form>';
  function validateSequence(){
    const {letters}=sequenceAlphabets[d.alphabet];
    $('#alphabet-help').textContent=letters?'Allowed letters: '+letters+' (upper or lower case).':'Plain text accepts any sequence character.';
    let message='';
    if(d.fasta.trim()){
      try{parseFasta(d.fasta,d.alphabet);}catch(error){message=error.message;}
    }
    $('#fasta-feedback').textContent=message;
    $('#fasta').setAttribute('aria-invalid',String(Boolean(message)));
    return !message;
  }
  validateSequence();
  const drawPatterns=()=>{
    $('#patterns').innerHTML=d.patterns.map((p,i)=>'<div class="patternrow"><input aria-label="Pattern '+(i+1)+'" class="mono" data-p="'+i+'" value="'+esc(p)+'" placeholder="e.g. ACGT" spellcheck="false"><button type="button" aria-label="Remove pattern '+(i+1)+'" data-remove="'+i+'" '+(d.patterns.length===1?'disabled':'')+'>×</button></div>').join('');
    for(const el of document.querySelectorAll('[data-p]'))el.oninput=()=>{state.draft.patterns[+el.dataset.p]=el.value;changed();};
    for(const el of document.querySelectorAll('[data-remove]'))el.onclick=()=>{d.patterns.splice(+el.dataset.remove,1);changed();drawPatterns();};
  };
  const busy=on=>{$('#submit').disabled=on;$('#explain').disabled=on;$('#cancel').hidden=!on;$('#submit').innerHTML=icon('run',15)+(on?'Working…':'Run search');};
  function changed(){invalidate();busy(false);$('#error').textContent='';}
  drawPatterns();
  $('#add').onclick=()=>{d.patterns.push('');changed();drawPatterns();document.querySelector('#patterns .patternrow:last-child input').focus();};
  $('#fasta').oninput=e=>{d.fasta=e.target.value;changed();validateSequence();};
  $('#alphabet').onchange=e=>{d.alphabet=e.target.value;changed();validateSequence();};
  $('#fold').onchange=e=>{d.ignoreCase=e.target.checked;changed();};
  $('#strategy').onchange=e=>{d.strategy=e.target.value;changed();};
  $('#example').onchange=e=>{if(e.target.value!=='')sampleNav(+e.target.value);};
  $('#upload').onchange=async e=>{
    const file=e.target.files[0];if(!file)return;
    changed();const version=requestVersion;
    try{
      if(file.size>2*1024*1024)throw new Error('Choose a file under 2 MiB or use the CLI.');
      const text=await file.text();if(version!==requestVersion||active!=='search')return;
      $('#fasta').value=d.fasta=text;validateSequence();announce('Loaded '+file.name);
    }catch(error){if(active==='search')$('#error').textContent=error.message;}
  };
  $('#clear').onclick=()=>{invalidate();state.draft={alphabet:'DNA',fasta:'',patterns:[''],strategy:'auto',ignoreCase:false};searchPage();$('#fasta').focus();};
  $('#cancel').onclick=()=>{changed();announce('Request cancelled.');};
  async function run(explain){
    changed();
    if(!d.fasta.trim()){$('#error').textContent='Enter FASTA records or load an example.';$('#fasta').focus();return;}
    if(!validateSequence()){$('#fasta').focus();return;}
    const blank=d.patterns.findIndex(p=>!p.length);
    if(blank!==-1){$('#error').textContent='Pattern '+(blank+1)+' is empty.';document.querySelector('[data-p="'+blank+'"]').focus();return;}
    request=new AbortController();const version=requestVersion;busy(true);
    try{
      const body=JSON.stringify(d);
      const workerURL=document.querySelector('script[data-search-worker]')?.dataset.searchWorker;
      const value=workerURL && !explain
        ? await runWorkerSearch(workerURL,body,request.signal)
        : await getJSON('/api/'+(explain?'explain':'search'),{method:'POST',headers:{'Content-Type':'application/json'},body,signal:request.signal});
      if(version!==requestVersion)return;
      state.decision=explain?value:value.decision;state.result=explain?null:value;
      announce(explain?'Selection explained.':fmt(value.matchCount)+' matches found.');location.hash=explain?'inspector':'results';
    }catch(error){if(error.name!=='AbortError'&&version===requestVersion)$('#error').textContent=error.message;}
    finally{if(version===requestVersion){request=null;if(active==='search')busy(false);}}
  }
  $('#form').onsubmit=e=>{e.preventDefault();run(false);};$('#explain').onclick=()=>run(true);
}
function inspector(){
  const d=state.decision;
  main.innerHTML=heading('Selection inspector','Inspect how ExactMatch selected one algorithm for the entire input stream.');
  if(!d){main.innerHTML+=empty('No decision yet','Run a search or choose Explain choice in the search workspace.');return;}
  const shape=d.shape;
  main.innerHTML+='<section class="panel formpanel"><div class="panelhead">'+atomTag(d.selected)+'<h2>'+esc(pretty(d.selected))+'</h2></div><p>'+esc(d.why)+'</p><div class="flow"><span>First record</span> › <span>Input shape</span> › <span>Eligible atoms</span> › <strong>'+esc(d.selected)+'</strong></div><div class="row"><span>Requested <code>'+esc(d.requested)+'</code></span><button class="btn" id="record">'+icon('download',15)+'Decision JSON</button><a class="btn" href="#search">Change strategy</a></div></section>'+
  '<div class="sectionhead"><h2>Input shape</h2></div><div class="metrics">'+Object.entries({Units:shape.n,Alphabet:shape.sigma,Patterns:shape.k,'Shortest':shape.min,'Longest':shape.max,'Mean length':+shape.mean.toFixed(2)}).map(([k,v])=>'<div><small>'+k+'</small><strong>'+fmt(v)+'</strong></div>').join('')+'</div>'+
  '<div class="sectionhead"><h2>Estimated costs</h2></div><div class="panel tablewrap"><table><thead><tr><th>Atom</th><th>Setup (ms)</th><th>Scan (ms)</th><th>Total (ms)</th><th>Eligibility / model</th></tr></thead><tbody>'+Object.entries(d.estimates).map(([k,v])=>'<tr><td>'+esc(k)+'</td>'+(v.eligible?[v.prepMs,v.scanMs,v.totalMs].map(x=>'<td>'+ms(x)+'</td>').join(''):'<td colspan="3">Excluded</td>')+'<td>'+esc(v.reason)+' '+esc(v.source)+'</td></tr>').join('')+'</tbody></table></div>';
  $('#record').onclick=()=>download('selection.json',JSON.stringify(d,null,2));
}
function algorithms(name){
  const chosen=state.algorithms.find(a=>a.name===name)??state.algorithms[0];
  main.innerHTML=heading('Algorithm explorer','Explore the registered search strategies and their preprocessing trade-offs.');
  if(!chosen)return;
  const n=notes[chosen.name];
  main.innerHTML+='<div class="explorer"><nav class="alglist panel" aria-label="Registered algorithms">'+state.algorithms.map(a=>'<a class="'+(a===chosen?'selected':'')+'" href="#algorithms/'+encodeURIComponent(a.name)+'">'+atomTag(a.name)+esc(pretty(a.name))+'</a>').join('')+'</nav><article class="panel formpanel"><div class="panelhead">'+atomTag(chosen.name)+'<h2>'+esc(pretty(chosen.name))+'</h2></div><p>'+esc(n?.short??chosen.title)+'</p>'+
    (n?'<dl>'+Object.entries({'Category':n.group+' · '+n.family,'Preprocessing':n.prep,'Search':n.scan,'Complexity':n.complexity,'Applicability':'Arbitrary UTF-16 input and nonempty literal patterns.','Trade-off':n.limit}).map(([k,v])=>'<dt>'+k+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl><a href="'+n.doi+'" target="_blank" rel="noreferrer">'+esc(n.ref)+'</a>':'<p>'+esc(chosen.references.join(', '))+'</p>')+'</article></div><p class="muted">L = total pattern length · h = longest pattern · k = pattern count · n = record length · z = hits. Ordering the output adds O(z log z).</p>';
}
function docs(){
  main.innerHTML=heading('Documentation','Run the engine locally, inspect its architecture, or add a search algorithm.')+
   '<section class="panel formpanel"><h2>From FASTA to matches</h2><div class="flow"><span>CLI or HTTP</span> › <span>ExactMatch molecule</span> › <span>Registered atom</span> › <strong>Search function</strong></div><p>The molecule measures the first record, compares eligible estimates, and constructs one atom for the stream. Each atom prepares patterns once and emits matches in record, position, and original pattern order.</p><h3>Run locally</h3><pre>npm test\nnpm start\nnode bin/ios.js explain --patterns AA &lt; sample.fa\nnode bin/ios.js run ExactMatch --patterns AA &lt; sample.fa</pre><h3>Calibrate and validate</h3><pre>npm run calibrate\nnpm run bench\nnode bench/audit.js</pre><p>Calibration fits setup and scanning weights to measured medians. Validation uses independent seeds and a fourth alphabet. Open Benchmarks for the saved measurements.</p><h3>Extend the registry</h3><p>Implement a pure search function and an ExactSearchAtom subclass. Supply manifest and selection metadata, then register the class once. The registry supplies the constructor to the molecule, API and manual selector.</p><h3>Design and tests</h3><p>Strategy makes the atoms interchangeable. ExactMatch provides a facade. The CLI and HTTP adapters share the domain engine. Registry injection isolates candidate selection in tests. Small function, selection and output contracts keep responsibilities separate.</p><p>The independent positional oracle checks every ordered result, including overlaps, duplicate patterns, UTF-16 positions and ASCII-only folding. Seeded cases complement the lambda and protein fixtures.</p></section>';
}
function route(){
 cancelComparison?.();cancelComparison=null;
 const [path,part]=location.hash.slice(1).split('/');
 const next=sections.includes(path)?path:'overview';
 if(active==='search'&&request){requestVersion++;request.abort();request=null;}
 active=next;document.body.classList.remove('navopen');$('#menu').setAttribute('aria-expanded','false');
 navState();
 for(const a of document.querySelectorAll('[data-page]')){if(a.dataset.page===active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');}
 $('#crumb').textContent=nav[active];document.title=nav[active]+' · Sequence Lab';
 if(active==='overview')overview();if(active==='search')searchPage();if(active==='inspector')inspector();if(active==='algorithms')algorithms(part);if(active==='docs')docs();
 if(active==='results')showResults(state.result,state.draft.patterns);if(active==='benchmarks')showBenchmarks();
 if(active==='compare')cancelComparison=showComparison(state.draft);
 if(active==='docs')main.insertAdjacentHTML('beforeend','<section class="panel formpanel compare-note"><h2>Project report</h2><p class="compare-note">The six-page report covers the matching contract, measured selection model, validation results, and a case where the selector chose a slower algorithm.</p><a class="btn" href="/report.pdf" target="_blank" rel="noopener">Open report (PDF)</a></section>');
 window.scrollTo(0,0);main.focus({preventScroll:true});
}
try {state.algorithms=(await getJSON('/api/algorithms')).algorithms;$('#engine-state').textContent='Engine online';}
catch{ $('#engine-state').textContent='Engine unavailable';document.body.classList.add('offline');}
window.addEventListener('hashchange',route);route();
