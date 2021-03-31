import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { array, record } from 'fp-ts';
import { Ray } from '../ray/ray';
import { ray } from '../ray';
import { Compute } from '../utils';

export type Effect<T, P> = {
  type: 'effect';
  tag: T;
  value: rx.Observable<Ray<T, P>>;
  effect: (payload: P) => void;
};

export type EffectPayload<E> = E extends Effect<any, infer P> ? P : never;

export const tag = <E extends string, A>(tag: E, f: (a: A) => void) => (
  o: rx.Observable<A>,
): Effect<E, A> => ({
  type: 'effect',
  tag,
  value: pipe(o, rxo.map(ray.create(tag))),
  effect: f,
});

export const transform = <P>(f: (a: rx.Observable<P>) => rx.Observable<P>) => <
  T
>(
  e: Effect<T, P>,
): Effect<T, P> =>
  pipe(
    f(
      pipe(
        e.value,
        rxo.map((action) => action.payload),
      ),
    ),
    rxo.map(ray.create(e.tag)),
    (ea) => ({
      type: 'effect',
      tag: e.tag,
      value: ea,
      effect: e.effect,
    }),
  );

export const branch = <P1, P2, T2>(
  f: (o: rx.Observable<P1>) => Effect<T2, P2>,
) => <T1>(ea: Effect<T1, P1>): Effect<T2, P2> =>
  pipe(
    ea.value,
    rxo.map(({ payload }) => payload),
    f,
  );

type RemoveRay<E> = E extends rx.Observable<Ray<any, infer P>>
  ? rx.Observable<P>
  : never;
export function branches<E1 extends Effect<any, any>, T, P>(
  es: [E1],
  f: (os: [RemoveRay<E1['value']>]) => Effect<T, P>,
): Effect<T, P>;
export function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  T,
  P
>(
  es: [E1, E2],
  f: (os: [RemoveRay<E1['value']>, RemoveRay<E2['value']>]) => Effect<T, P>,
): Effect<T, P>;
export function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  E3 extends Effect<any, any>,
  T,
  P
>(
  es: [E1, E2, E3],
  f: (
    os: [
      RemoveRay<E1['value']>,
      RemoveRay<E2['value']>,
      RemoveRay<E3['value']>,
    ],
  ) => Effect<T, P>,
): Effect<T, P>;
export function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  E3 extends Effect<any, any>,
  E4 extends Effect<any, any>,
  T,
  P
>(
  es: [E1, E2, E3, E4],
  f: (
    os: [
      RemoveRay<E1['value']>,
      RemoveRay<E2['value']>,
      RemoveRay<E3['value']>,
      RemoveRay<E4['value']>,
    ],
  ) => Effect<T, P>,
): Effect<T, P>;
export function branches(
  es: Effect<any, any>[],
  f: (os: any) => Effect<any, any>,
) {
  return pipe(
    es,
    array.map((e) =>
      pipe(
        e.value,
        rxo.map(({ payload }) => payload),
      ),
    ),
    f,
  );
}

type PartialEffect<A> = <T>(tag: T) => Effect<T, A>;
export const partial = <A>(f: (a: A) => void) => (
  o: rx.Observable<A>,
): PartialEffect<A> => <T>(tag: T): Effect<T, A> => ({
  type: 'effect',
  tag,
  value: pipe(o, rxo.map(ray.create(tag))),
  effect: f,
});

export type EffectTree = Record<string, Effect<any, any>>;

export type ApplyTags<B extends Record<string, PartialEffect<any>>> = {
  [key in keyof B]: Effect<key, EffectPayload<ReturnType<B[key]>>>;
};

export const tagObject = <A extends Record<string, PartialEffect<any>>>(
  a: A,
): Compute<ApplyTags<A>> =>
  pipe(
    a,
    record.mapWithIndex((key, value) => value(key)),
  ) as any;
