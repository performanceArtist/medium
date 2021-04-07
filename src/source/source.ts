import { behavior } from '@performance-artist/rx-utils';
import { record } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { ReducerMap, Source, EmitterMap } from './model';

export const create = <S, A extends ReducerMap<S>>(
  initialState: S,
  reduce: A,
): Source<S, A> => {
  const state = behavior.of(initialState);
  const on = pipe(
    reduce,
    record.map((reducer) => {
      const subject = new rx.Subject<any>();
      const value$ = pipe(
        subject.asObservable(),
        rxo.tap((value) => {
          const oldState = state.get();
          const newState = reducer(oldState)(value);
          oldState !== newState && state.set(newState);
        }),
        rxo.shareReplay(1),
      );

      return {
        value$,
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
