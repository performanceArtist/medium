import { Selector } from '@performance-artist/fp-ts-adt';
import { EffectTree } from '../effect';
import { Carrier } from '../carrier';

export type Medium<E, A> = Selector<E, Carrier<E, A>>;
export type AnyMedium = Medium<{}, EffectTree>;
export type MediumValue<E> = E extends Medium<any, infer A> ? A : never;
export type MediumDeps<E> = E extends Medium<infer E, any> ? E : never;
