import { behavior, Behavior } from '@performance-artist/rx-utils';
import { merge, ObservableValue } from '../carrier/merge';
import { CarrierOutput } from '../carrier/carrier';
import { Medium } from './medium';
import { ray } from '../ray';
import { Ray } from '../ray/ray';
import { pipe } from 'fp-ts/lib/pipeable';
import { array, option } from 'fp-ts';

export type History<A> = Behavior<A> & { take: () => A };

export const makeHistory = <A>(initial: A): History<A> => {
  const b = behavior.of<A>(initial);
  const take = () => {
    const value = b.get();
    b.set(initial);
    return value;
  };

  return { ...b, take };
};

export const withMedium = <E, A extends CarrierOutput>(
  medium: Medium<E, A>,
) => (
  makeDeps: () => E,
  test: (
    deps: E,
    history: History<ObservableValue<A[keyof A]>[]>,
    output: <T extends ObservableValue<A[keyof A]>['type']>(
      type: T,
    ) => <
      P extends Extract<ObservableValue<A[keyof A]>, { type: T }>['payload']
    >(
      payload: P,
    ) => Ray<T, P>,
  ) => void,
) => () => {
  const history = makeHistory([] as ObservableValue<A[keyof A]>[]);
  const deps = makeDeps();
  const resolved = medium.run(deps);
  const output$ = merge(resolved);

  const sub = output$.subscribe(e => {
    history.modify(history => history.concat(e as ObservableValue<A[keyof A]>));
  });
  test(deps, history, ray.create);
  sub.unsubscribe();
};

export const unorderedEqual = (check: (a: unknown, b: unknown) => boolean) => <
  T
>(
  a: T[],
  b: T[],
) =>
  a.length === b.length &&
  pipe(
    a,
    array.reduce(
      true,
      (acc, cur) =>
        acc &&
        pipe(
          b,
          array.findFirst(b => check(b, cur)),
          option.fold(
            () => false,
            () => true,
          ),
        ),
    ),
  );

export const unorderedEqualStrict = unorderedEqual(
  (a, b) => JSON.stringify(a) === JSON.stringify(b),
);
