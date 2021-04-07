import { Behavior } from '@performance-artist/rx-utils';
import * as rx from 'rxjs';

export type AnyReducer<S> = (state: S) => (value: any) => S;

export type ReducerMap<S> = Record<string, AnyReducer<S>>;

export type Action<P> = {
  type: string;
  payload: P;
};

export type AnyAction = {
  type: string;
  payload: unknown;
};

export type AnyCreator = (payload?: any) => AnyAction;

export type WithGetType<T extends AnyCreator> = T & {
  getType: () => string;
};

export type ToActions<S, A extends ReducerMap<S>> = {
  [key in keyof A]: A[key] extends (state: S) => () => S
    ? WithGetType<() => Action<void>>
    : A[key] extends (state: S) => (payload: infer A) => S
    ? WithGetType<(payload: A) => Action<A>>
    : never;
};

export type Emitter<A> = {
  value$: rx.Observable<A>;
  next: (value: A) => void;
};

export type EmitterMap<A extends ReducerMap<any>> = {
  [key in keyof A]: Parameters<ReturnType<A[key]>>[0] extends undefined
    ? {
        value$: rx.Observable<A>;
        next: () => void;
      }
    : Emitter<Parameters<ReturnType<A[key]>>[0]>;
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
