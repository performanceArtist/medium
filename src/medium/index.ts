import { id, map, run, subscribe } from './medium';
import { combine } from './combine';
import { withMedium, makeHistory } from './testing';

export const medium = {
  id,
  map,
  combine,
  run,
  subscribe,
};

export const test = {
  withMedium,
  makeHistory,
};
