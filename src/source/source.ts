import { behavior } from '@performance-artist/rx-utils';
import { effect } from '../effect';
import { record } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import { ReducerMap, Source, EmitterMap } from './model';
import { applyEffects } from '../carrier/merge';

export const create = <S, A extends ReducerMap<S>>(
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

export const subscribe = (s: Source<any, any>) =>
  pipe(
    s.on,
    record.map(({ value }) => value),
    applyEffects,
    (o$) => o$.subscribe(),
  );
