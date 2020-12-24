export type Compute<A> = A extends object
  ? {
      [K in keyof A]: A[K];
    } & {}
  : never;
