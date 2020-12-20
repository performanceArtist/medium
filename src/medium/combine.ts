import { Carrier } from '../carrier/carrier';
import { Medium } from './medium';
import { Any } from 'ts-toolbelt';
import { pipe } from 'fp-ts/lib/pipeable';
import { selector } from '@performance-artist/fp-ts-adt';

type Combine = {
  <A, RA, R>(a: Medium<A, RA>): Medium<A, [RA]>;
  <A, RA, B, RB, R>(a: Medium<A, RA>, b: Medium<B, RB>): Medium<
    Any.Compute<A & B, 'flat'>,
    [RA, RB]
  >;
  <A, RA, B, RB, C, RC>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
  ): Medium<Any.Compute<A & B & C, 'flat'>, [RA, RB, RC]>;
  <A, RA, B, RB, C, RC, D, RD>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
  ): Medium<Any.Compute<A & B & C & D, 'flat'>, [RA, RB, RC, RD]>;
  <A, RA, B, RB, C, RC, D, RD, E, RE>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
    e: Medium<E, RE>,
  ): Medium<Any.Compute<A & B & C & D & E, 'flat'>, [RA, RB, RC, RD, RE]>;
  <A, RA, B, RB, C, RC, D, RD, E, RE, F, RF>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
    e: Medium<E, RE>,
    f: Medium<F, RF>,
  ): Medium<
    Any.Compute<A & B & C & D & E & F, 'flat'>,
    [RA, RB, RC, RD, RE, RF]
  >;
  <A, RA, B, RB, C, RC, D, RD, E, RE, F, RF, G, RG>(
    a: Medium<A, RA>,
    b: Medium<B, RB>,
    c: Medium<C, RC>,
    d: Medium<D, RD>,
    e: Medium<E, RE>,
    f: Medium<F, RF>,
    g: Medium<G, RG>,
  ): Medium<
    Any.Compute<A & B & C & D & E & F & G, 'flat'>,
    [RA, RB, RC, RD, RE, RF, RG]
  >;
};

export const combine: Combine = <E extends Medium<any, any>[]>(...es: E) =>
  pipe(
    selector.sequence(es),
    selector.map(
      (es): Carrier<any, any> => ({
        type: 'carrier',
        sources: es.reduce((acc, cur) => ({ ...acc, ...cur.sources }), {}),
        reflection: action$ => es.map(e => e.reflection(action$)),
      }),
    ),
  ) as any;
