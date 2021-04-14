import {
  id,
  run,
  subscribe,
  subscribeWith,
  decorateWith,
  decorateAny,
  mergeInputs,
  applyEffects,
} from './medium';
import {
  withMedium,
  makeHistory,
  unorderedEqual,
  unorderedEqualStrict,
} from './testing';

export const medium = {
  id,
  run,
  subscribe,
  subscribeWith,
  decorateWith,
  decorateAny,
  mergeInputs,
  applyEffects,
};

export const test = {
  withMedium,
  makeHistory,
  unorderedEqual,
  unorderedEqualStrict,
};

export * from './types';
