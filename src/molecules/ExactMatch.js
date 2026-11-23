import {registry as standardRegistry} from '../registry.js';
import {shapeOf} from '../shape.js';
import {coefficients} from '../calibration.js';
import {validateParams} from '../functions/alphabet.js';

export class ExactMatch {
  constructor({patterns,ignoreCase=false,strategy='auto'}, registry=standardRegistry) {
    validateParams({patterns,ignoreCase});
    if (strategy !== 'auto' && !registry.has(strategy)) {
      throw new Error('Unknown strategy. Choose auto or '+[...registry.keys()].join(', ')+'.');
    }
    this.params={patterns:[...patterns],ignoreCase};
    this.requested=strategy;
    this.registry=registry;
    this.record=null;
  }
  explain(entry) {
    const {patterns,ignoreCase}=this.params;
    const shape=shapeOf(entry,patterns,ignoreCase);
    const estimates=Object.create(null);
    let best=null, lowest=Infinity;
    for (const [name,Atom] of this.registry) {
      const permitted=Atom.selection.applicable?.(shape) ?? true;
      if (permitted!==true) {
        estimates[name]={eligible:false,reason:String(permitted),totalMs:null};
        continue;
      }
      const features=Atom.selection.features(shape);
      const calibrated=Object.hasOwn(coefficients,name);
      const weights=calibrated ? coefficients[name] : Atom.selection.defaults;
      const prepMs=features.prep*weights.prep, scanMs=features.scan*weights.scan;
      const totalMs=prepMs+scanMs;
      estimates[name]={eligible:true,reason:'Supports this input shape.',prepMs,scanMs,totalMs,source:calibrated?'calibration':'defaults'};
      if (totalMs<lowest) {best=name;lowest=totalMs;}
    }
    const selected=this.requested==='auto' ? best : this.requested;
    if (!selected || !estimates[selected]?.eligible) throw new Error(estimates[selected]?.reason ?? 'No applicable atom.');
    const why=this.requested==='auto' ? selected+' has the lowest estimated total cost on the first record. Ties follow registry order.'
      : selected+' was explicitly requested and is eligible for this input.';
    return this.record={requested:this.requested,selected,shape,estimates,why};
  }
  *groups(entries,limit=Infinity,onAlgorithmStart) {
    this.record=null;
    let atom=null, recordIndex=0, remaining=limit;
    for(const entry of entries) {
      if(!atom) {
        const {selected}=this.explain(entry);
        const Atom=this.registry.get(selected);
        onAlgorithmStart?.();
        atom=new Atom(this.params);
      }
      const matches=[...atom.process(entry,remaining)];
      remaining-=matches.length;
      yield {recordIndex:recordIndex++,...entry,matches};
    }
  }
  *run(entries) { for(const group of this.groups(entries)) yield* group.matches; }
}
