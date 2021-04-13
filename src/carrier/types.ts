export type Carrier<E, A> = {
  type: 'carrier';
  sources: E;
  effects: A;
};
export type CarrierValue<E> = E extends Carrier<{}, infer A> ? A : never;
export type CarrierSources<E> = E extends Carrier<any, infer S> ? S : never;
