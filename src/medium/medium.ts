import {
  selector,
  SelectorInput,
  SelectorOutput,
} from '@performance-artist/fp-ts-adt';
import { AllKeys } from '@performance-artist/fp-ts-adt/dist/utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { flow } from 'fp-ts/lib/function';
import { Effect, EffectTree } from '../effect/effect';
import { Action } from '../action/action';
import { Medium, ObservableValue } from './types';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { array, record } from 'fp-ts';
import { Compute } from '../utils';

export const id = <D extends Record<string, any>>() => <
  K extends keyof D = never
>(
  ...keys: K[]
): Medium<AllKeys<D, K>, {}> =>
  pipe(
    selector.keys<D>()(...keys),
    selector.map(() => ({})),
  );

const tagsInvariant = <E extends EffectTree>(es: E) => {
  const tags = pipe(
    es,
    record.toArray,
    array.map(([_, e]) => e.tag),
  );

  if (new Set(tags).size !== tags.length) {
    throw new Error(`Duplicate tags are not allowed(${tags})`);
  }

  return es;
};

export const mergeInputs = <V extends EffectTree>(
  es: V,
): rx.Observable<ObservableValue<V[keyof V]['value']>> =>
  pipe(
    tagsInvariant(es),
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

export const subscribeWith = (onEmit: (action: Action<string, any>) => void) =>
  flow(applyEffects, (output$) => output$.subscribe(onEmit));

export const subscribe = subscribeWith(() => {});

export const run = <E>(deps: E) => <A extends EffectTree>(m: Medium<E, A>) =>
  pipe(m.run(deps), subscribe);

export const decorateWith = <V extends EffectTree>() => <
  D extends Medium<any, any>
>(
  d: D,
) => <R extends EffectTree>(
  f: (deps: SelectorInput<D>, values: [SelectorOutput<D>, V]) => R,
) => <M extends Medium<any, V>>(
  m: M,
): Medium<
  Compute<SelectorInput<D> & SelectorInput<M>>,
  Compute<SelectorOutput<M> & R>
> =>
  pipe(
    selector.combine(d, m as Medium<{}, V>),
    selector.askMap(([deps, values]) => ({
      ...values[1],
      ...f(deps as any, values),
    })),
  ) as any;

export const decorateAny = decorateWith<EffectTree>();
