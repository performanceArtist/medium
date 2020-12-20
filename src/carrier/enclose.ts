import { array } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import { Source } from '../source';
import { combineActions, isSource } from '../source/utils';
import { isRay } from '../ray/ray';
import { Carrier, CarrierAction, CarrierOutput } from './carrier';
import * as rx from 'rxjs';

const makeDispatch = (sources: Source<any, any>[]) => (
  action: CarrierAction,
) => {
  !isRay(action) && sources.forEach(store => store.emit(action));
};

export type ObservableValue<
  E extends rx.Observable<any>
> = E extends rx.Observable<infer V> ? V : never;

export type MergedCarrier<A extends CarrierOutput> = {
  dispatch: (action: CarrierAction) => void;
  output$: rx.Observable<ObservableValue<A[keyof A]>>;
};
export const merge = <E, A extends CarrierOutput>(
  carrier: Carrier<E, A>,
): MergedCarrier<A> => {
  const sources = pipe(carrier.sources, Object.values, array.filter(isSource));
  const output$ = pipe(
    carrier.reflection(combineActions(...sources)),
    Object.values,
    array.reduce(rx.EMPTY, (acc, cur) => rx.merge(acc, cur)),
  );

  return {
    output$,
    dispatch: makeDispatch(sources),
  };
};

export const enclose = <A extends CarrierOutput>(carrier: MergedCarrier<A>) =>
  carrier.output$.subscribe(carrier.dispatch);
