import {parentPort,workerData} from 'node:worker_threads';
import {executeOperation} from './src/services/http.js';
try {parentPort.postMessage({value:executeOperation(workerData.input,workerData.operation)});}
catch(error){parentPort.postMessage({error:{message:error.message,code:error.code}});}
