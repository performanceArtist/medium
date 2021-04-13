import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { array, record } from 'fp-ts';
import { Action } from '../action/action';
import { action } from '../action';
import { Compute } from '../utils';

export type Effect<T, P> = {
  type: 'effect';
  tag: T;
  value: rx.Observable<Action<T, P>>;
  effect: (payload: P) => void;
};

export type EffectPayload<E> = E extends Effect<any, infer P> ? P : never;

const tag = <E extends string, A>(tag: E, f: (a: A) => void) => (
  o: rx.Observable<A>,
): Effect<E, A> => ({
  type: 'effect',
  tag,
  value: pipe(o, rxo.map(action.create(tag))),
  effect: f,
});

const transform = <P>(f: (a: rx.Observable<P>) => rx.Observable<P>) => <T>(
  e: Effect<T, P>,
): Effect<T, P> =>
  pipe(
    f(
      pipe(
        e.value,
        rxo.map((action) => action.payload),
      ),
    ),
    rxo.map(action.create(e.tag)),
    (ea) => ({
      type: 'effect',
      tag: e.tag,
      value: ea,
      effect: e.effect,
    }),
  );

type AnyEffect = Effect<any, any> | PartialEffect<any>;

const branch = <P1, R extends AnyEffect>(f: (o: rx.Observable<P1>) => R) => <
  T1
>(
  ea: Effect<T1, P1>,
): R =>
  pipe(
    ea.value,
    rxo.map(({ payload }) => payload),
    f,
  );

type RemoveRay<E> = E extends rx.Observable<Action<any, infer P>>
  ? rx.Observable<P>
  : never;
function branches<E1 extends Effect<any, any>, R extends AnyEffect>(
  es: [E1],
  f: (os: [RemoveRay<E1['value']>]) => R,
): R;
function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  R extends AnyEffect
>(
  es: [E1, E2],
  f: (os: [RemoveRay<E1['value']>, RemoveRay<E2['value']>]) => R,
): R;
function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  E3 extends Effect<any, any>,
  R extends AnyEffect
>(
  es: [E1, E2, E3],
  f: (
    os: [
      RemoveRay<E1['value']>,
      RemoveRay<E2['value']>,
      RemoveRay<E3['value']>,
    ],
  ) => R,
): R;
function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  E3 extends Effect<any, any>,
  E4 extends Effect<any, any>,
  R extends AnyEffect
>(
  es: [E1, E2, E3, E4],
  f: (
    os: [
      RemoveRay<E1['value']>,
      RemoveRay<E2['value']>,
      RemoveRay<E3['value']>,
      RemoveRay<E4['value']>,
    ],
  ) => R,
): R;
function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  E3 extends Effect<any, any>,
  E4 extends Effect<any, any>,
  E5 extends Effect<any, any>,
  R extends AnyEffect
>(
  es: [E1, E2, E3, E4, E5],
  f: (
    os: [
      RemoveRay<E1['value']>,
      RemoveRay<E2['value']>,
      RemoveRay<E3['value']>,
      RemoveRay<E4['value']>,
      RemoveRay<E5['value']>,
    ],
  ) => R,
): R;
function branches<
  E1 extends Effect<any, any>,
  E2 extends Effect<any, any>,
  E3 extends Effect<any, any>,
  E4 extends Effect<any, any>,
  E5 extends Effect<any, any>,
  E6 extends Effect<any, any>,
  R extends AnyEffect
>(
  es: [E1, E2, E3, E4, E5, E6],
  f: (
    os: [
      RemoveRay<E1['value']>,
      RemoveRay<E2['value']>,
      RemoveRay<E3['value']>,
      RemoveRay<E4['value']>,
      RemoveRay<E5['value']>,
      RemoveRay<E6['value']>,
    ],
  ) => R,
): R;
function branches(es: Effect<any, any>[], f: (os: any) => Effect<any, any>) {
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
const partial = <A>(f: (a: A) => void) => (
  o: rx.Observable<A>,
): PartialEffect<A> => <T>(tag: T): Effect<T, A> => ({
  type: 'effect',
  tag,
  value: pipe(o, rxo.map(action.create(tag))),
  effect: f,
});

export type EffectTree = Record<string, Effect<any, any>>;
export type PartialEffectTree = Record<string, PartialEffect<any>>;

export type ApplyTags<B extends Record<string, PartialEffect<any>>> = {
  [key in keyof B]: Effect<key, EffectPayload<ReturnType<B[key]>>>;
};

const tagObject = <A extends Record<string, PartialEffect<any>>>(
  a: A,
): Compute<ApplyTags<A>> =>
  pipe(
    a,
    record.mapWithIndex((key, value) => value(key)),
  ) as any;

export const effect = {
  branch,
  branches,
  tag,
  transform,
  partial,
  tagObject,
};
