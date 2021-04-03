import { id, map, run, subscribe, decorateWith, decorateAny } from './medium';
import { combine } from './combine';
import {
  withMedium,
  makeHistory,
  unorderedEqual,
  unorderedEqualStrict,
} from './testing';

export const medium = {
  id,
  map,
  combine,
  run,
  subscribe,
  decorateWith,
  decorateAny,
};

export const test = {
  withMedium,
  makeHistory,
  unorderedEqual,
  unorderedEqualStrict,
};
