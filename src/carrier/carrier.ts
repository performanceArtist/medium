import * as rx from 'rxjs';
import { AnyAction, Source } from '../source/model';
import { fromCreator } from '../source/utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { Compute } from '../utils';
import { EffectTree } from '../effect/effect';
import { array, record } from 'fp-ts';

export type Carrier<E, A> = {
  type: 'carrier';
  sources: E;
  reflection: (action$: rx.Observable<AnyAction>) => A;
};
export type CarrierValue<E> = E extends Carrier<{}, infer A> ? A : never;

export const fromSources = <S extends Source<any, any>[]>(...sources: S) => <
  R extends EffectTree
>(
  f: (sources: S, on: ReturnType<typeof fromCreator>) => R,
): Carrier<S, R> => ({
  type: 'carrier',
  sources,
  reflection: (action$) => pipe(f(sources as any, fromCreator(action$))),
});

export type CarrierSource<E extends {}> = {
  [key in keyof E]: E[key] extends Source<any, any>
    ? Compute<Pick<E[key], 'create' | 'state' | 'reduce'>>
    : E[key];
};

const tagsInvariant = (es: EffectTree) => {
  const tags = pipe(
    es,
    record.toArray,
    array.map(([_, e]) => e.tag),
  );

  if (new Set(tags).size !== tags.length) {
    throw new Error(`Duplicate tags are not allowed(${tags})`);
  }

  return es;
};

export const map = <D, A, B extends EffectTree>(
  e: Carrier<D, A>,
  f: (
    deps: Compute<CarrierSource<D>>,
    on: ReturnType<typeof fromCreator>,
    a: A,
  ) => B,
): Carrier<D, B> => ({
  type: 'carrier',
  sources: e.sources,
  reflection: (action$) =>
    pipe(
      f(e.sources as any, fromCreator(action$), e.reflection(action$)),
      tagsInvariant as any, // cast due to contravariance constraint
    ),
});

export const from = <E, A>(
  sources: E,
  reflection: (action$: rx.Observable<AnyAction>) => A,
): Carrier<E, A> => ({
  type: 'carrier',
  sources,
  reflection,
});
