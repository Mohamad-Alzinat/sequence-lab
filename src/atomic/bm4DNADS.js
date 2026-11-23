import {ExactSearchAtom,manifest,perPattern} from './ExactSearchAtom.js';
import {prepareDS} from '../functions/bm4DNADS.js';

export class bm4DNADS extends ExactSearchAtom {
  static manifest=manifest('bm4DNADS','DNA skip search',['Allmer 2016']);
  static compile=perPattern(prepareDS);
  static selection={
    features({n,k,mean,sigma}) {return {prep:k*mean,scan:n*k/Math.max(1,Math.min(mean,sigma))};},
    defaults:{prep:0.00004,scan:0.000015},
    applicable() {return true;}
  };
}
