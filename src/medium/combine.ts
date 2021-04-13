import { Carrier } from '../carrier';
import { Medium } from './types';
import { Compute } from '../utils';
import { pipe } from 'fp-ts/lib/pipeable';
import { selector } from '@performance-artist/fp-ts-adt';

type Combine = {
  <A, RA, R>(a: Medium<A, RA>): Medium<A, [RA]>;
  <A, RA, B, RB, R>(a: Medium<A, RA>, b: Medium<B, RB>): Medium<
    Compute<A & B>,
    [RA, RB]
  >;
  <A, RA, B, RB, C, RC>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
  ): Medium<Compute<A & B & C>, [RA, RB, RC]>;
  <A, RA, B, RB, C, RC, D, RD>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
  ): Medium<Compute<A & B & C & D>, [RA, RB, RC, RD]>;
  <A, RA, B, RB, C, RC, D, RD, E, RE>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
    e: Medium<E, RE>,
  ): Medium<Compute<A & B & C & D & E>, [RA, RB, RC, RD, RE]>;
  <A, RA, B, RB, C, RC, D, RD, E, RE, F, RF>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
    e: Medium<E, RE>,
    f: Medium<F, RF>,
  ): Medium<Compute<A & B & C & D & E & F>, [RA, RB, RC, RD, RE, RF]>;
  <A, RA, B, RB, C, RC, D, RD, E, RE, F, RF, G, RG>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
    e: Medium<E, RE>,
    f: Medium<F, RF>,
    g: Medium<G, RG>,
  ): Medium<Compute<A & B & C & D & E & F & G>, [RA, RB, RC, RD, RE, RF, RG]>;
};

export const combine: Combine = <E extends Medium<any, any>[]>(...es: E) =>
  pipe(
    selector.sequence(es),
    selector.map(
      (es): Carrier<any, any> => ({
        type: 'carrier',
        sources: es.reduce((acc, cur) => ({ ...acc, ...cur.sources }), {}),
        effects: es.map((e) => e.effects),
      }),
    ),
  ) as any;
