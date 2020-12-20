import * as rx from 'rxjs';
import { Ray, RayPayload } from '../ray/ray';
import { AnyAction, Source } from '../source/model';
import { fromCreator } from '../source/utils';
import { ObservableValue } from './enclose';
import { Any } from 'ts-toolbelt';
import { pipe } from 'fp-ts/lib/pipeable';
import { record } from 'fp-ts';

export type CarrierAction<E extends string = string> =
  | AnyAction
  | Ray<E, unknown>;
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
): Any.Compute<ApplyRayType<A>, 'flat'> =>
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
): Carrier<S, Any.Compute<ApplyRayType<R>, 'flat'>> => ({
  type: 'carrier',
  sources,
  reflection: action$ =>
    pipe(f(sources as any, fromCreator(action$)), applyRayType),
});
