import { behavior, Behavior } from '@performance-artist/rx-utils';
import { merge, ObservableValue } from '../carrier/merge';
import { Medium } from './medium';
import { ray } from '../ray';
import { Ray } from '../ray/ray';
import { pipe } from 'fp-ts/lib/pipeable';
import { array, option, record } from 'fp-ts';
import { EffectTree } from '../effect/effect';
import { source } from '../source';
import { subscription } from '@performance-artist/fp-ts-adt/dist/subscription';

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

export const withMedium = <E, A extends EffectTree>(medium: Medium<E, A>) => (
  makeDeps: () => E,
  test: (
    deps: E,
    history: History<ObservableValue<A[keyof A]['value']>[]>,
    output: <T extends ObservableValue<A[keyof A]['value']>['type']>(
      type: T,
    ) => <
      P extends Extract<
        ObservableValue<A[keyof A]['value']>,
        { type: T }
      >['payload']
    >(
      payload: P,
    ) => Ray<T, P>,
  ) => void,
) => () => {
  const history = makeHistory([] as ObservableValue<A[keyof A]['value']>[]);
  const deps = makeDeps();
  const resolved = medium.run(deps);
  const output$ = merge(resolved);

  const input = pipe(
    deps,
    record.filter(source.isSource),
    record.toArray,
    array.map(([_, s]) => source.subscribe(s)),
    (e) => subscription.sequence(...e),
  );
  const output = output$.subscribe((e) => {
    history.modify((history) =>
      history.concat(e as ObservableValue<A[keyof A]['value']>),
    );
  });
  test(deps, history, ray.create);
  input.unsubscribe();
  output.unsubscribe();
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
          array.findFirst((b) => check(b, cur)),
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
