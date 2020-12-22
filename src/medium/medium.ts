import { Selector, selector } from '@performance-artist/fp-ts-adt';
import { AllKeys } from '@performance-artist/fp-ts-adt/dist/utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { Source } from '../source/model';
import { fromCreator } from '../source/utils';
import { Any } from 'ts-toolbelt';
import {
  ApplyRayType,
  applyRayType,
  Carrier,
  CarrierOutput,
  MapOutput,
} from '../carrier/carrier';
import { enclose, merge } from '../carrier/enclose';
import { flow } from 'fp-ts/lib/function';

export type Medium<E, A> = Selector<E, Carrier<E, A>>;
type MediumSource<E extends {}> = {
  [key in keyof E]: E[key] extends Source<any, any>
    ? Any.Compute<Pick<E[key], 'create' | 'state'>, 'flat'>
    : E[key];
};
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
  e: Medium<D, A>,
  f: (
    deps: Any.Compute<MediumSource<D>, 'flat'>,
    on: ReturnType<typeof fromCreator>,
    a: A,
  ) => B,
): Medium<D, Any.Compute<ApplyRayType<B>, 'flat'>> =>
  pipe(
    e,
    selector.map(a => ({
      type: 'carrier',
      sources: a.sources,
      reflection: action$ =>
        pipe(
          f(a.sources as any, fromCreator(action$), a.reflection(action$)),
          applyRayType,
        ),
    })),
  );

export const subscribe = flow(merge, enclose);

export const run = <E>(deps: E) => <A extends CarrierOutput>(m: Medium<E, A>) =>
  pipe(m.run(deps), subscribe);
