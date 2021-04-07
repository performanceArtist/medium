import { array, record } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import { Carrier } from './carrier';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { EffectTree, Effect } from '../effect/effect';

export type ObservableValue<E> = E extends rx.Observable<infer V> ? V : never;

export const mergeInputs = <V extends EffectTree>(
  vs: V,
): rx.Observable<ObservableValue<V[keyof V]['value']>> =>
  pipe(
    vs,
    Object.values,
    array.reduce<Effect<unknown, unknown>, rx.Observable<any>>(
      rx.EMPTY,
      (acc, cur) => rx.merge(acc, cur.value),
    ),
  );

export const applyEffects = <V extends EffectTree>(
  vs: V,
): rx.Observable<ObservableValue<V[keyof V]['value']>> => {
  const effects: Record<string, Function> = pipe(
    vs,
    record.reduce({}, (acc, e) => ({ ...acc, [e.tag]: e.effect })),
  );

  return pipe(
    mergeInputs(vs),
    rxo.tap(
      (action) => effects[action.type] && effects[action.type](action.payload),
    ),
  );
};

export const merge = <E, A extends EffectTree>(
  carrier: Carrier<E, A>,
): rx.Observable<ObservableValue<A[keyof A]['value']>> =>
  pipe(carrier.effects, applyEffects);
