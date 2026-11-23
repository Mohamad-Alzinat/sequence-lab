// Build the private hosted Worker using only Node built-ins. The closed set of
// domain modules uses named ESM imports/exports; each retains a separate scope.
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {posix} from 'node:path';
const root=new URL('./',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const modules=new Map();
async function include(id){
  if(modules.has(id))return;
  const source=await read(id);
  const dependencies=[...source.matchAll(/^import\s*\{([^}]+)\}\s*from\s*['"]([^'"]+)['"];?\s*$/gm)];
  let body=source;
  for(const dep of dependencies){
    const path=posix.normalize(posix.join(posix.dirname(id),dep[2]));
    await include(path);
    const bindings=dep[1].split(',').map(s=>s.trim().replace(/\s+as\s+/,':')).join(',');
    body=body.replace(dep[0],'const {'+bindings+'}=modules['+JSON.stringify(path)+'];\n');
  }
  const exports=[...body.matchAll(/^export\s+(?:async\s+)?(?:const|class|function)\s+(\w+)/gm)].map(x=>x[1]);
  body=body.replace(/^export\s+/gm,'');
  modules.set(id,'modules['+JSON.stringify(id)+']=(()=>{\n'+body+'\nreturn {'+exports.join(',')+'};\n})();');
}
await include('src/services/http.js');
const assets={};
const report=(await readFile(new URL('docs/report.pdf',root))).toString('base64');
const types={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml'};
assets['/fasta.js']=[types.js,await read('src/fasta.js')];
for(const name of await readdir(new URL('web/',root))){
  const ext=name.split('.').pop();
  if(types[ext])assets['/'+name]=[types[ext],await read('web/'+name)];
}
const data={};
for(const key of ['calibration','validation']){
  try{data[key]=JSON.parse(await read('bench/results/'+key+'.json'));}catch(error){if(error.code!=='ENOENT')throw error;}
}
const core='const modules=Object.create(null);\n'+[...modules.values()].join('\n');
await include('web/calculation-worker.js');
assets['/calculation-worker.js']=[types.js,core+'\n'+modules.get('web/calculation-worker.js')];
assets['/index.html'][1]=assets['/index.html'][1].replace('src="/app.js"','src="/app.js" data-search-worker="/calculation-worker.js"');
const worker=core+
  '\nconst assets='+JSON.stringify(assets)+';\nconst benchmark='+JSON.stringify(data)+';\n'+
  `export default {async fetch(request){
    const path=new URL(request.url).pathname;
    if(path==='/report.pdf' && request.method==='GET')return new Response(Uint8Array.from(atob('${report}'),c=>c.charCodeAt(0)),{headers:{'Content-Type':'application/pdf'}});
    if(path.startsWith('/api/'))return modules['src/services/http.js'].api(request,key=>benchmark[key]??null);
    const item=assets[path==='/'?'/index.html':path];
    return item && request.method==='GET' ? new Response(item[1],{headers:{'Content-Type':item[0],'X-Content-Type-Options':'nosniff'}}) : new Response('Not found',{status:404});
  }};`;
await mkdir(new URL('dist/server/',root),{recursive:true});
await writeFile(new URL('dist/server/index.js',root),worker);
