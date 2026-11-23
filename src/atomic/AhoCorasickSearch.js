import {ExactSearchAtom,manifest} from './ExactSearchAtom.js';
import {prepareAC} from '../functions/ahoCorasick.js';

export class AhoCorasickSearch extends ExactSearchAtom {
  static manifest=manifest('AhoCorasickSearch','Aho–Corasick',['Aho & Corasick 1975']);
  static compile=prepareAC;
  static selection={
    features({n,k,mean,sigma}) {return {prep:k*mean,scan:n};},
    defaults:{prep:0.00004,scan:0.000015},
    applicable() {return true;}
  };
}
