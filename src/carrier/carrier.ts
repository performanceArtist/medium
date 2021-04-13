import { pipe } from 'fp-ts/lib/pipeable';
import { EffectTree } from '../effect/effect';
import { array, record } from 'fp-ts';
import { Carrier } from './types';

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

export const map = <D, A, B extends EffectTree>(
  e: Carrier<D, A>,
  f: (deps: D, a: A) => B,
): Carrier<D, B> => ({
  type: 'carrier',
  sources: e.sources,
  effects: tagsInvariant(f(e.sources as any, e.effects)),
});
