import { behavior } from '@performance-artist/rx-utils';
import { effect } from '../effect';
import { record } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import { ReducerMap, Source, EmitterMap } from './types';
import { medium } from '../medium';
import { Action } from '../action/action';

const create = <S, A extends ReducerMap<S>>(
  initialState: S,
  reduce: A,
): Source<S, A> => {
  const state = behavior.of(initialState);
  const on = pipe(
    reduce,
    record.mapWithIndex((key, reducer) => {
      const subject = new rx.Subject<any>();
      const value = pipe(
        subject.asObservable(),
        effect.tag(key, (value) => {
          const oldState = state.get();
          const newState = reducer(oldState)(value);
          oldState !== newState && state.set(newState);
        }),
      );

      return {
        value,
        next: subject.next.bind(subject),
      };
    }),
  ) as EmitterMap<A>;

  return {
    type: 'source',
    state,
    reduce,
    on,
  };
};

const subscribeWith = (onEmit: (action: Action<string, any>) => void) => (
  s: Source<any, any>,
) =>
  pipe(
    s.on,
    record.map(({ value }) => value),
    medium.applyEffects,
    (o$) => o$.subscribe(onEmit),
  );

const subscribe = subscribeWith(() => {});

const isSource = (input: any): input is Source<any, any> =>
  input.type === 'source';

const input = <I>() => <A>(state: A) => (input: I) => state;

const setFor = <S>() => <K extends keyof S>(key: K) => (state: S) => (
  value: S[K],
): S => ({ ...state, [key]: value });

export const source = {
  create,
  subscribe,
  subscribeWith,
  isSource,
  input,
  setFor,
};
