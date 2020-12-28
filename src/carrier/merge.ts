import { array } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import { combineActions, isSource } from '../source/utils';
import { Carrier, CarrierOutput } from './carrier';
import * as rx from 'rxjs';

export type ObservableValue<
  E extends rx.Observable<any>
> = E extends rx.Observable<infer V> ? V : never;

export const mergeOutput = <V extends CarrierOutput>(
  vs: V,
): rx.Observable<ObservableValue<V[keyof V]>> =>
  pipe(
    vs,
    Object.values,
    array.reduce(rx.EMPTY, (acc, cur) => rx.merge(acc, cur)),
  );

export const merge = <E, A extends CarrierOutput>(
  carrier: Carrier<E, A>,
): rx.Observable<ObservableValue<A[keyof A]>> => {
  const sources = pipe(carrier.sources, Object.values, array.filter(isSource));

  return pipe(carrier.reflection(combineActions(...sources)), mergeOutput);
};
