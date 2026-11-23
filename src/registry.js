import {bm4DNADS} from './atomic/bm4DNADS.js';
import {bm4DNAHMbs} from './atomic/bm4DNAHMbs.js';
import {KMPSearch} from './atomic/KMPSearch.js';
import {AhoCorasickSearch} from './atomic/AhoCorasickSearch.js';
export function register(Atom, target=registry) {
  const name=Atom.manifest.name;
  if (target.has(name)) throw new Error('Duplicate atom: '+name);
  target.set(name,Atom);
}
export const registry=new Map();
for (const Atom of [bm4DNADS,bm4DNAHMbs,KMPSearch,AhoCorasickSearch]) register(Atom);
