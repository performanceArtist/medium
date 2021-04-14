import { Selector } from '@performance-artist/fp-ts-adt';
import { EffectTree } from '../effect';
import * as rx from 'rxjs';

export type Medium<E, A extends EffectTree> = Selector<E, A>;
export type AnyMedium = Medium<{}, EffectTree>;
export type ObservableValue<E> = E extends rx.Observable<infer V> ? V : never;
