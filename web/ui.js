import {icon} from './icons.js';
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const main=document.getElementById('main');
export const $=s=>document.querySelector(s);
export const fmt=n=>Number(n).toLocaleString('en-US');
export const ms=n=>n<.01?n.toPrecision(2):n.toFixed(3);
export const names={bm4DNADS:'bm4DNADS',bm4DNAHMbs:'bm4DNAHMbs',KMPSearch:'Knuth–Morris–Pratt',AhoCorasickSearch:'Aho–Corasick'};
export const pretty=n=>names[n]??n;
export const codeId=n=>({bm4DNADS:'DS',bm4DNAHMbs:'HM',KMPSearch:'KM',AhoCorasickSearch:'AC'}[n]??'AT');
export const tone=n=>({bm4DNADS:'mint',bm4DNAHMbs:'blue',KMPSearch:'violet',AhoCorasickSearch:'orange'}[n]??'mint');
export const atomTag=n=>'<span class="atomtag '+tone(n)+'">'+esc(codeId(n))+'</span>';
export const heading=(title,sub)=>'<div class="pagetitle"><h1>'+esc(title)+'</h1><p>'+esc(sub)+'</p></div>';
export const opts=(list,selected)=>list.map(([id,label])=>'<option value="'+esc(id)+'"'+(String(id)===String(selected)?' selected':'')+'>'+esc(label)+'</option>').join('');
export function empty(title,text){return '<section class="panel empty"><span class="tileicon mint">'+icon('search',24)+'</span><h2>'+esc(title)+'</h2><p>'+esc(text)+'</p><a class="btn primary" href="#search">Open sequence search</a></section>';}
export function download(name,body,type='application/json'){
  const href=URL.createObjectURL(new Blob([body],{type}));
  const a=Object.assign(document.createElement('a'),{href,download:name});a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);
}
export async function getJSON(url,options){
  const res=await fetch(url,options);const data=await res.json();
  if(!res.ok)throw new Error(data.error?.message??'Request failed.');return data;
}
export function announce(text){$('#announce').textContent=text;}
