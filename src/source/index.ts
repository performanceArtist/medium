import { makeActions, fromActions, create } from './source';
import { combineActions, isSource, input, setFor } from './utils';
export * from './model';

export const source = {
  makeActions,
  fromActions,
  create,
  combineActions,
  isSource,
  input,
  setFor,
};
