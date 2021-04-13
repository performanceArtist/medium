export type Action<E, P> = {
  tag: 'action';
  type: E;
  payload: P;
};

export type ActionPayload<E> = E extends Action<any, infer P> ? P : never;

export type AnyAction = Action<string, unknown>;

const isAction = (e: any): e is Action<string, unknown> => e.tag === 'action';

const create = <E>(type: E) => <P = void>(payload: P): Action<E, P> => ({
  tag: 'action',
  type,
  payload,
});

export const action = { isAction, create };
