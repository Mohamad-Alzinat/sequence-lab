import {foldASCII} from './functions/alphabet.js';
export function shapeOf(entry,patterns,ignoreCase = false) {
  const text = ignoreCase ? foldASCII(entry.seq) : entry.seq;
  const alphabet = new Set();
  for (let i=0; i<text.length; i++) alphabet.add(text.charCodeAt(i));
  let min = Infinity, max = 0, total = 0;
  for (const {length} of patterns) { min = Math.min(min,length); max = Math.max(max,length); total += length; }
  return {n:text.length,sigma:alphabet.size,k:patterns.length,min,max,mean:total/patterns.length};
}
