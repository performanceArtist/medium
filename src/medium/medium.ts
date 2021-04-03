import { Selector, selector } from '@performance-artist/fp-ts-adt';
import { AllKeys } from '@performance-artist/fp-ts-adt/dist/utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { fromCreator } from '../source/utils';
import { Compute } from '../utils';
import { Carrier, CarrierSource, map as carrierMap } from '../carrier/carrier';
import { merge } from '../carrier/merge';
import { flow } from 'fp-ts/lib/function';
import { EffectTree } from '../effect/effect';
import { combine } from './combine';

export type Medium<E, A> = Selector<E, Carrier<E, A>>;
export type AnyMedium = Medium<{}, EffectTree>;
export type MediumValue<E> = E extends Medium<any, infer A> ? A : never;
export type MediumDeps<E> = E extends Medium<infer E, any> ? E : never;

export const id = <D extends Record<string, any>>() => <
  K extends keyof D = never
>(
  ...keys: K[]
): Medium<AllKeys<D, K>, {}> =>
  pipe(
    selector.keys<D>()(...keys),
    selector.map((sources) => ({
      type: 'carrier',
      sources,
      reflection: (action$) => ({}),
    })),
  );

export const map = <D, A, B extends EffectTree>(
  m: Medium<D, A>,
  f: (
    deps: Compute<CarrierSource<D>>,
    on: ReturnType<typeof fromCreator>,
    a: A,
  ) => B,
): Medium<D, B> =>
  pipe(
    m,
    selector.map((c) => carrierMap(c, f)),
  );

export const decorateWith = <V extends EffectTree>() => <
  D extends Medium<any, any>
>(
  d: D,
) => <R extends EffectTree>(
  f: (
    deps: MediumDeps<D>,
    on: ReturnType<typeof fromCreator>,
    values: [MediumValue<D>, V],
  ) => R,
) => <M extends Medium<any, V>>(
  m: M,
): Medium<
  Compute<MediumDeps<D> & MediumDeps<M>>,
  Compute<MediumValue<M> & R>
> =>
  map(combine(d, m as Medium<{}, V>), (deps, on, values) => ({
    ...values[1],
    ...f(deps as any, on, values),
  })) as any;

export const decorateAny = decorateWith<EffectTree>();

export const subscribe = flow(merge, (output$) => output$.subscribe());

export const run = <E>(deps: E) => <A extends EffectTree>(m: Medium<E, A>) =>
  pipe(m.run(deps), subscribe);
