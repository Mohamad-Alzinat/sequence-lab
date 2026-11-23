import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {Readable} from 'node:stream';
import {Worker} from 'node:worker_threads';
import {api,byteLimit} from './src/services/http.js';

const contentTypes={html:'text/html; charset=utf-8',js:'text/javascript; charset=utf-8',css:'text/css; charset=utf-8',svg:'image/svg+xml'};
function execute(input,operation,signal) {
  return new Promise((resolve,reject)=>{
    const worker=new Worker(new URL('./worker-search.js',import.meta.url),{workerData:{input,operation}});
    const cancel=()=>{worker.terminate();reject(new Error('Request cancelled.'));};
    if(signal.aborted)return cancel();
    signal.addEventListener('abort',cancel,{once:true});
    worker.once('message',({value,error})=>error?reject(Object.assign(new Error(error.message),error)):resolve(value));
    worker.once('error',reject);
    worker.once('exit',code=>{signal.removeEventListener('abort',cancel);if(code)reject(new Error('Search worker stopped.'));});
  });
}
async function readBenchmark(key){
  try{return JSON.parse(await readFile(new URL('./bench/results/'+key+'.json',import.meta.url),'utf8'));}
  catch(error){if(error.code==='ENOENT')return null;throw error;}
}
export function makeServer(){
  return createServer(async(req,res)=>{
    try {
      const url=new URL(req.url,'http://localhost');
      if(url.pathname.startsWith('/api/')){
        if(Number(req.headers['content-length'])>byteLimit){
          req.resume();
          res.writeHead(413,{'Content-Type':'application/json','Connection':'close'});
          res.end(JSON.stringify({error:{code:'BODY_LIMIT',message:'Request exceeds the 2 MiB web limit. Use the CLI for larger files.'}}));
          return;
        }
        const controller=new AbortController();
        res.on('close',()=>{if(!res.writableEnded)controller.abort();});
        const request=new Request(url,{method:req.method,headers:req.headers,signal:controller.signal,...(req.method==='POST'?{body:Readable.toWeb(req),duplex:'half'}:{})});
        const result=await api(request,readBenchmark,execute);
        res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));return;
      }
      const name=url.pathname==='/'?'index.html':url.pathname.slice(1);
      if(req.method==='GET' && name==='report.pdf'){
        const pdf=await readFile(new URL('./docs/report.pdf',import.meta.url));
        res.writeHead(200,{'Content-Type':'application/pdf'});res.end(pdf);return;
      }
      if(req.method!=='GET'||!/^[-a-z0-9]+\.(html|js|css|svg)$/.test(name)){res.writeHead(404);res.end();return;}
      const body=await readFile(new URL(name==='fasta.js'?'./src/fasta.js':'./web/'+name,import.meta.url));
      res.writeHead(200,{'Content-Type':contentTypes[name.split('.').pop()],'X-Content-Type-Options':'nosniff'});res.end(body);
    }catch(error){res.writeHead(error.code==='ENOENT'?404:500);res.end('Request could not be completed.');}
  });
}
if(process.argv[1] && import.meta.url===(await import('node:url')).pathToFileURL(process.argv[1]).href){
  const port=Number(process.env.PORT || 4173);
  makeServer().listen(port,'127.0.0.1',()=>console.log('http://127.0.0.1:'+port));
}
