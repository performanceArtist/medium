import { Action, AnyAction, Source } from './model';
import * as rx from 'rxjs';
import { pipe } from 'fp-ts/lib/pipeable';
import { array } from 'fp-ts';
import * as rxo from 'rxjs/operators';

export const combineActions = (
  ...sources: Source<any, any>[]
): rx.Observable<AnyAction> =>
  pipe(
    sources,
    array.reduce(rx.EMPTY, (acc, source) =>
      rx.merge(acc, source.action$ as any),
    ),
  );

export const isSource = (input: any): input is Source<any, any> =>
  input.type === 'source';

export const input = <I>() => <A>(state: A) => (input: I) => state;

export const setFor = <S>() => <K extends keyof S>(key: K) => (state: S) => (
  value: S[K],
): S => ({ ...state, [key]: value });

export const fromCreator = (action$: rx.Observable<Action<any>>) => <
  A = void
>(actionCreator: {
  (payload: A): { type: string; payload?: A };
  getType: () => string;
}): rx.Observable<A> =>
  pipe(
    action$,
    rxo.filter(action => action.type === actionCreator.getType()),
    rxo.map(action => action.payload),
  );
