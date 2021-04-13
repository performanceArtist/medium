import { map } from './carrier';
import { merge, mergeInputs, applyEffects } from './merge';

export * from './types';
export const carrier = {
  merge,
  mergeInputs,
  map,
  applyEffects,
};
