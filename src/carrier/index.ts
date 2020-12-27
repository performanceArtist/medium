import { fromSources, map } from './carrier';
import { mergeOutput, merge, enclose, toObservable } from './enclose';

export const carrier = {
  fromSources,
  merge,
  mergeOutput,
  enclose,
  toObservable,
  map,
};
