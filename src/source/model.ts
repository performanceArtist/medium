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

export type Options = {
  id: SourceID;
};

export type Formatter = {
  format: (key: string) => string;
  unformat: (tag: string) => string;
};

export type SourceID = string;

export type ActionPack<S, A extends ReducerMap<S>> = {
  id: SourceID;
  reduce: A;
  create: ToActions<S, A>;
  formatter: Formatter;
};

export type Source<S, A extends ActionPack<S, any>> = {
  type: 'source';
  id: SourceID;
  state: Behavior<S>;
  reduce: A['reduce'];
  create: <K extends keyof A['create']>(key: K) => A['create'][K];
  dispatch: <K extends keyof A['create']>(
    key: K,
  ) => Parameters<ReturnType<A['reduce'][K]>>[0] extends void
    ? () => void
    : (payload: Parameters<ReturnType<A['reduce'][K]>>[0]) => void;
  action$: rx.Observable<AnyAction>;
};

export type ToReducerMap<S, A extends object> = {
  [key in keyof A]: (state: S) => (value: A[key]) => S;
};

export type SourceOf<S, A extends object> = Source<
  S,
  ActionPack<S, ToReducerMap<S, A>>
>;
