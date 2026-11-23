import {ExactSearchAtom,manifest,perPattern} from './ExactSearchAtom.js';
import {prepareHMbs} from '../functions/bm4DNAHMbs.js';

export class bm4DNAHMbs extends ExactSearchAtom {
  static manifest=manifest('bm4DNAHMbs','Hashed block search',['Allmer 2016; Wu & Manber 1994']);
  static compile=perPattern(prepareHMbs);
  static selection={
    features({n,k,mean,sigma}) {return {prep:k*(1024+mean),scan:n*k/Math.max(1,Math.min(mean-1,sigma*sigma,1024))};},
    defaults:{prep:0.00004,scan:0.000015},
    applicable() {return true;}
  };
}
