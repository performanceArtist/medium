import { behavior } from '@performance-artist/store';
import { record } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import {
  ActionPack,
  AnyAction,
  Options,
  ReducerMap,
  Source,
  Formatter,
} from './model';

const defaultFormat = (id: string): Formatter => ({
  format: key => `${id}.${key}`,
  unformat: tag => tag.split('.')[1],
});

export const makeActions = <S>(options: Options) => <A extends ReducerMap<S>>(
  actions: A,
): ActionPack<S, A> => {
  const formatter = defaultFormat(options.id);

  const create = Object.keys(actions).reduce((acc, key) => {
    acc[key] = (payload: any) => ({
      type: formatter.format(key),
      payload,
    });
    acc[key].getType = () => formatter.format(key);

    return acc;
  }, {} as any);

  return { create, formatter, reduce: actions };
};

export const fromActions = <S, A extends ActionPack<S, any>>(
  initialState: S,
  { create, formatter, reduce }: A,
): Source<S, A> => {
  const state = behavior.of(initialState);
  const actions = new rx.Subject<AnyAction>();
  actions.subscribe((action: any) => {
    const key = formatter.unformat(action.type);
    if (action.payload != null && reduce[key]) {
      try {
        const oldState = state.get();
        const newState = reduce[key](oldState)(action.payload);
        oldState !== newState && state.set(newState);
      } catch (e) {
        console.error(
          `Error running a reducer at ${key} for action`,
          action,
          e,
        );
        return state;
      }
    }
  });

  const has = (action: AnyAction) =>
    reduce[formatter.unformat(action.type)] != null;
  const emit = actions.next.bind(actions);
  const maybeEmit = (action: any) => {
    action && typeof action.type === 'string' && has(action) && emit(action);
  };

  const dispatchers = pipe(
    create,
    record.reduceWithIndex({} as Record<string, Function>, (key, acc) => {
      acc[key] = (payload?: any) =>
        emit({ type: formatter.format(key), payload });
      return acc;
    }),
  );

  return {
    type: 'source',
    state,
    reduce,
    create: key => create[key],
    action$: pipe(actions.asObservable(), shareReplay(1)),
    dispatch: key => dispatchers[key as any] as any,
    emit: maybeEmit,
  };
};

export  const create = <S>(id: string, initialState: S) => <A extends ReducerMap<S>>(
  actions: A,
) =>
  fromActions(
    initialState,
    makeActions<S>({ id })(actions),
  );
