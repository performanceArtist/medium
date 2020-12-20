import * as rxo from 'rxjs/operators';
import * as rx from 'rxjs';
import { pipe } from 'fp-ts/lib/pipeable';

export type Ray<E, P> = {
  tag: 'ray';
  type: E;
  payload: P;
};

export type RayPayload<E> = E extends Ray<any, infer P> ? P : never;

export const isRay = (e: any): e is Ray<string, unknown> => e.tag === 'ray';

export const create = <E extends string>(type: E) => <P = void>(
  payload: P,
): Ray<E, P> => ({
  tag: 'ray',
  type,
  payload,
});

export const tap = <T extends string, A>(type: T, f: (a: A) => void) => (
  o: rx.Observable<A>,
) =>
  pipe(
    o,
    rxo.map(value => {
      f(value);
      return create(type)(value);
    }),
  );

export const infer = <A>(f: (a: A) => void) => (o: rx.Observable<A>) => <
  T extends string
>(
  type: T,
) => tap(type, f)(o);

export const inferVoid = <A>(f: (a: A) => void) => (o: rx.Observable<A>) => <
  T extends string
>(
  type: T,
) =>
  pipe(
    o,
    rxo.map(
      (value): Ray<T, void> => {
        f(value);
        return create(type)(undefined);
      },
    ),
  );

export const map = <A, B>(f: (a: A) => B) => (
  o: rx.Observable<Ray<string, A>>,
) =>
  pipe(
    o,
    rxo.map(({ payload }) => f(payload)),
  );
