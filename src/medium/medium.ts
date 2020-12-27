import { Selector, selector } from '@performance-artist/fp-ts-adt';
import { AllKeys } from '@performance-artist/fp-ts-adt/dist/utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { fromCreator } from '../source/utils';
import { Compute } from '../utils';
import {
  ApplyRayType,
  Carrier,
  CarrierOutput,
  CarrierSource,
  MapOutput,
  map as carrierMap,
} from '../carrier/carrier';
import { enclose, merge } from '../carrier/enclose';
import { flow } from 'fp-ts/lib/function';

export type Medium<E, A> = Selector<E, Carrier<E, A>>;
export type AnyMedium = Medium<{}, CarrierOutput>;
export type MediumValue<E> = E extends Medium<any, infer A> ? A : never;

export const id = <D extends Record<string, any>>() => <
  K extends keyof D = never
>(
  ...keys: K[]
): Medium<AllKeys<D, K>, {}> =>
  pipe(
    selector.keys<D>()(...keys),
    selector.map(sources => ({
      type: 'carrier',
      sources,
      reflection: action$ => ({}),
    })),
  );

export const map = <D, A, B extends MapOutput>(
  m: Medium<D, A>,
  f: (
    deps: Compute<CarrierSource<D>>,
    on: ReturnType<typeof fromCreator>,
    a: A,
  ) => B,
): Medium<D, Compute<ApplyRayType<B>>> =>
  pipe(
    m,
    selector.map(c => carrierMap(c, f)),
  );

export const subscribe = flow(merge, enclose);

export const run = <E>(deps: E) => <A extends CarrierOutput>(m: Medium<E, A>) =>
  pipe(m.run(deps), subscribe);
