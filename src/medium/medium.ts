import { selector } from '@performance-artist/fp-ts-adt';
import { AllKeys } from '@performance-artist/fp-ts-adt/dist/utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { Compute } from '../utils';
import { map as carrierMap } from '../carrier/carrier';
import { merge } from '../carrier/merge';
import { flow } from 'fp-ts/lib/function';
import { EffectTree } from '../effect/effect';
import { combine } from './combine';
import { Action } from '../action/action';
import { Medium, MediumDeps, MediumValue } from './types';

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
      effects: {},
    })),
  );

export const map = <D, A, B extends EffectTree>(
  m: Medium<D, A>,
  f: (deps: D, a: A) => B,
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
  f: (deps: MediumDeps<D>, values: [MediumValue<D>, V]) => R,
) => <M extends Medium<any, V>>(
  m: M,
): Medium<
  Compute<MediumDeps<D> & MediumDeps<M>>,
  Compute<MediumValue<M> & R>
> =>
  map(combine(d, m as Medium<{}, V>), (deps, values) => ({
    ...values[1],
    ...f(deps as any, values),
  })) as any;

export const decorateAny = decorateWith<EffectTree>();

export const subscribeWith = (onEmit: (action: Action<string, any>) => void) =>
  flow(merge, (output$) => output$.subscribe(onEmit));

export const subscribe = subscribeWith(() => {});

export const run = <E>(deps: E) => <A extends EffectTree>(m: Medium<E, A>) =>
  pipe(m.run(deps), subscribe);
