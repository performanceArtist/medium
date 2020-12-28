import * as rx from 'rxjs';
import { Ray, RayPayload } from '../ray/ray';
import { AnyAction, Source } from '../source/model';
import { fromCreator } from '../source/utils';
import { ObservableValue } from './merge';
import { pipe } from 'fp-ts/lib/pipeable';
import { record } from 'fp-ts';
import { Compute } from '../utils';

export type CarrierAction<E extends string = string> = Ray<E, unknown>;
export type CarrierOutput = Record<string, rx.Observable<CarrierAction>>;
export type Carrier<E, A> = {
  type: 'carrier';
  sources: E;
  reflection: (action$: rx.Observable<AnyAction>) => A;
};
export type CarrierValue<E> = E extends Carrier<{}, infer A> ? A : never;

export type PartialRay = <T extends string>(
  type: T,
) => rx.Observable<Ray<T, unknown>>;
export type MapOutput = Record<
  string,
  rx.Observable<CarrierAction> | PartialRay
>;
export type ApplyRayType<B extends MapOutput> = {
  [key in keyof B]: B[key] extends PartialRay
    ? rx.Observable<Ray<key, RayPayload<ObservableValue<ReturnType<B[key]>>>>>
    : B[key];
};

export const applyRayType = <A extends MapOutput>(
  a: A,
): Compute<ApplyRayType<A>> =>
  pipe(
    a,
    record.mapWithIndex((key, value) =>
      value instanceof Function ? value(key) : value,
    ),
  ) as any;

export const fromSources = <S extends Source<any, any>[]>(...sources: S) => <
  R extends MapOutput
>(
  f: (sources: S, on: ReturnType<typeof fromCreator>) => R,
): Carrier<S, Compute<ApplyRayType<R>>> => ({
  type: 'carrier',
  sources,
  reflection: action$ =>
    pipe(f(sources as any, fromCreator(action$)), applyRayType),
});

export type CarrierSource<E extends {}> = {
  [key in keyof E]: E[key] extends Source<any, any>
    ? Compute<Pick<E[key], 'create' | 'state' | 'reduce'>>
    : E[key];
};

export const map = <D, A, B extends MapOutput>(
  e: Carrier<D, A>,
  f: (
    deps: Compute<CarrierSource<D>>,
    on: ReturnType<typeof fromCreator>,
    a: A,
  ) => B,
): Carrier<D, Compute<ApplyRayType<B>>> => ({
  type: 'carrier',
  sources: e.sources,
  reflection: action$ =>
    pipe(
      f(e.sources as any, fromCreator(action$), e.reflection(action$)),
      applyRayType,
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
