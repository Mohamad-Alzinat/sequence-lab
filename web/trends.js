import {esc,fmt,ms,pretty} from './ui.js';
const labels={n:'Record length',m:'Pattern length',k:'Pattern count'};
const colors=['#337768','#506f9c','#775795','#9a6129'];
export function trend(cases,cell,axis,width){
  const fixed=Object.keys(labels).filter(key=>key!==axis);
  const rows=cases.filter(c=>c.alphabet===cell.alphabet && fixed.every(k=>c[k]===cell[k])).sort((a,b)=>a[axis]-b[axis]);
  const names=Object.keys(cell.timings);
  const w=Math.max(240,Math.min(840,width)),h=185,left=55,right=w-27,top=13,bottom=145;
  const max=Math.max(...rows.flatMap(c=>names.map(n=>c.timings[n].medianMs)));
  const x=c=>left+(right-left)*(c[axis]-rows[0][axis])/(rows.at(-1)[axis]-rows[0][axis]);
  const y=t=>bottom-(bottom-top)*t/max;
  const title='Median runtime (ms) by '+labels[axis].toLowerCase();
  const series=names.map((name,i)=>'<g stroke="'+colors[i]+'"><polyline fill="none" stroke-width="2" points="'+rows.map(c=>x(c)+','+y(c.timings[name].medianMs)).join(' ')+'"/>'+rows.map(c=>'<circle fill="white" cx="'+x(c)+'" cy="'+y(c.timings[name].medianMs)+'" r="3"><title>'+esc(name)+' · '+fmt(c[axis])+' · '+ms(c.timings[name].medianMs)+' ms</title></circle>').join('')+'</g>').join('');
  const yTicks=[0,max/2,max].map(val=>'<line x1="'+left+'" x2="'+right+'" y1="'+y(val)+'" y2="'+y(val)+'" stroke="#dce5e2"/><text x="'+(left-5)+'" y="'+(y(val)+4)+'" text-anchor="end">'+Number(val.toPrecision(2))+'</text>').join('');
  let previous=-Infinity;
  const xTicks=rows.map((c,i)=>{const px=x(c);if(i!==rows.length-1&&(px-previous<43||right-px<43))return '';previous=px;
    return '<text text-anchor="middle" x="'+px+'" y="'+(bottom+18)+'">'+(c[axis]>=1000?c[axis]/1000+'k':c[axis])+'</text>';}).join('');
  const chart='<svg width="100%" height="'+h+'" viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+title+'"><title>'+title+'</title><g fill="#4a6260" font-size="12">'+yTicks+xTicks+series+'</g></svg>';
  return '<p>'+esc(cell.alphabet)+' · '+fixed.map(k=>labels[k]+' '+fmt(cell[k])).join(' · ')+'</p>'+chart+
    '<div class="row legend">'+names.map((n,i)=>'<span><i style="background:'+colors[i]+'"></i>'+esc(pretty(n))+'</span>').join('')+'</div>'+
    '<details><summary>Exact runtimes (ms)</summary><div class="tablewrap"><table><thead><tr><th>'+labels[axis]+'</th>'+names.map(n=>'<th>'+n+'</th>').join('')+'</tr></thead><tbody>'+rows.map(c=>'<tr><td>'+fmt(c[axis])+'</td>'+names.map(n=>'<td>'+ms(c.timings[n].medianMs)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></details>';
}
