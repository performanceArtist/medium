export type Ray<E, P> = {
  tag: 'ray';
  type: E;
  payload: P;
};

export type RayPayload<E> = E extends Ray<any, infer P> ? P : never;

export const isRay = (e: any): e is Ray<string, unknown> => e.tag === 'ray';

export const create = <E>(type: E) => <P = void>(payload: P): Ray<E, P> => ({
  tag: 'ray',
  type,
  payload,
});
