// Local Node serves timed searches over HTTP. The hosted build supplies
// the same compiled engine in a browser worker with a monotonic live clock.
export function runWorkerSearch(url,body,signal,operation='search'){
  signal.throwIfAborted();
  const worker=new Worker(url,{type:'module'});
  return new Promise((resolve,reject)=>{
    const abort=()=>{cleanup();reject(signal.reason);};
    function cleanup(){
      signal.removeEventListener('abort',abort);
      worker.terminate();
    }
    signal.addEventListener('abort',abort,{once:true});
    worker.onmessage=({data})=>{
      cleanup();
      if(data.error)reject(new Error(data.error));
      else resolve(data.result);
    };
    worker.onerror=()=>{cleanup();reject(new Error('The search worker could not run. Reload the page and retry.'));};
    worker.postMessage(operation==='search'?body:{body,operation});
  });
}
