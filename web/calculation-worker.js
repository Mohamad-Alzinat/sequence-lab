import {byteLimit,executeOperation} from '../src/services/http.js';

self.onmessage=({data})=>{
  try {
    const {body,operation}=typeof data==='string'?{body:data,operation:'search'}:data;
    if(new TextEncoder().encode(body).byteLength>byteLimit){
      throw new Error('Request exceeds the 2 MiB web limit. Use the CLI for larger files.');
    }
    self.postMessage({result:executeOperation(JSON.parse(body),operation)});
  } catch(error) {
    self.postMessage({error:error.message});
  }
};
