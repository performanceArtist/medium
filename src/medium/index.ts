import { id, map, run } from './medium';
import { combine } from './combine';
import { withMedium, makeHistory } from './testing';

export const medium = {
  id,
  map,
  combine,
  run,
};

export const test = {
  withMedium,
  makeHistory,
};
