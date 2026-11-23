import {ExactSearchAtom,manifest,perPattern} from './ExactSearchAtom.js';
import {prepareKMP} from '../functions/kmp.js';

export class KMPSearch extends ExactSearchAtom {
  static manifest=manifest('KMPSearch','Knuth–Morris–Pratt',['Knuth, Morris & Pratt 1977']);
  static compile=perPattern(prepareKMP);
  static selection={
    features({n,k,mean,sigma}) {return {prep:k*mean,scan:k*n};},
    defaults:{prep:0.00004,scan:0.000015},
    applicable() {return true;}
  };
}
