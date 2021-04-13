import { Behavior } from '@performance-artist/rx-utils';
import { Effect } from '../effect/effect';

export type AnyReducer<S> = (state: S) => (value: any) => S;

export type ReducerMap<S> = Record<string, AnyReducer<S>>;

export type Emitter<T, A> = {
  value: Effect<T, A>;
  next: (value: A) => void;
};

export type EmitterMap<A extends ReducerMap<any>> = {
  [key in keyof A]: Parameters<ReturnType<A[key]>>[0] extends void
    ? {
        value: Effect<key, A>;
        next: () => void;
      }
    : Emitter<key, Parameters<ReturnType<A[key]>>[0]>;
};

export type Source<S, A extends ReducerMap<any>> = {
  type: 'source';
  state: Behavior<S>;
  reduce: A;
  on: EmitterMap<A>;
};

export type ToReducerMap<S, A extends object> = {
  [key in keyof A]: (state: S) => (value: A[key]) => S;
};

export type SourceOf<S, A extends object> = Source<S, ToReducerMap<S, A>>;
