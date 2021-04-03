import { fromSources, map, from } from './carrier';
import { merge, mergeInputs, toEffectTree, applyEffects } from './merge';

export const carrier = {
  fromSources,
  merge,
  mergeInputs,
  toEffectTree,
  map,
  from,
  applyEffects,
};
