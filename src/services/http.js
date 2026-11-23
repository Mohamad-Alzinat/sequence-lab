import {registry} from '../registry.js';
import {search} from './search.js';
import {compareAlgorithms} from './compare.js';

export const byteLimit=2*1024*1024;
export async function readInput(request) {
  if(Number(request.headers.get('content-length'))>byteLimit) throw new Error('BODY_LIMIT');
  const reader=request.body?.getReader();
  if(!reader) throw new Error('INVALID_JSON');
  let bytes=0,text='';
  const decoder=new TextDecoder();
  for(;;){
    const {done,value}=await reader.read();
    if(done)break;
    bytes+=value.length;
    if(bytes>byteLimit){await reader.cancel();throw new Error('BODY_LIMIT');}
    text+=decoder.decode(value,{stream:true});
  }
  try {
    const input=JSON.parse(text+decoder.decode());
    if(!input || typeof input!=='object' || Array.isArray(input))throw new Error();
    return input;
  }catch{throw new Error('INVALID_JSON');}
}
export function executeOperation(input,operation){
  if(operation==='compare')return compareAlgorithms(input);
  return search(input,operation==='explain');
}
export async function api(request,readBenchmark,execute=executeOperation) {
  const {pathname}=new URL(request.url);
  const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  const fail=(code,message,status)=>json({error:{code,message}},status);
  try {
    if(request.method==='POST' && ['/api/search','/api/explain','/api/compare'].includes(pathname)){
      const input=await readInput(request);
      if(pathname==='/api/compare' && performance.timeOrigin===0){
        return fail('CLOCK_UNAVAILABLE','Use the Compare algorithms tab to measure this input with the browser clock.',422);
      }
      return json(await execute(input,pathname.slice(5),request.signal));
    }
    if(request.method==='GET'){
      if(pathname==='/api/health')return json({status:'ok'});
      if(pathname==='/api/algorithms')return json({algorithms:[...registry.values()].map(A=>A.manifest)});
      if(pathname==='/api/benchmarks'){
        const validation=await readBenchmark('validation');
        return json({runs:validation?[validation.meta]:[]});
      }
      if(pathname.startsWith('/api/benchmarks/')){
        const validation=await readBenchmark('validation');
        if(validation && pathname==='/api/benchmarks/'+validation.meta.id){
          return json({calibration:await readBenchmark('calibration'),validation});
        }
      }
    }
    return fail('NOT_FOUND','Endpoint not found.',404);
  }catch(error){
    if(error.message==='BODY_LIMIT')return fail('BODY_LIMIT','Request exceeds the 2 MiB web limit. Use the CLI for larger files.',413);
    if(error.message==='INVALID_JSON')return fail('INVALID_JSON','Provide a JSON object.',400);
    return fail(error.code==='RESULT_LIMIT'?'RESULT_LIMIT':'INVALID_INPUT',error.message,422);
  }
}
