import { pipe } from 'fp-ts/lib/pipeable';
import { medium, ray } from '../../src';
import { todoMedium } from '../basic/todo.medium';
import * as rxo from 'rxjs/operators';
import { option } from 'fp-ts';
import { makeTodoApi } from '../basic/todo.api';
import { makeTodoSource } from '../basic/todo.source';

const withErrorReport = medium.map(todoMedium, (deps, on, value) => {
  const { todoSource } = deps;

  const errorReport$ = pipe(
    value.updateTodo$,
    rxo.filter(effect => option.isNone(effect.payload)),
    rxo.withLatestFrom(on(todoSource.create('toggleDone'))),
    ray.inferVoid(([_, id]) => console.warn(`Todo not found by id: ${id}`)),
  );

  return {
    ...value,
    errorReport$,
  };
});

type Deps = {
  logger: (info: string) => void;
};
const withErrorLogger = medium.map(
  medium.combine(todoMedium, medium.id<Deps>()('logger')),
  (deps, on, [value]) => {
    const { todoSource, logger } = deps;

    const errorReport$ = pipe(
      value.updateTodo$,
      rxo.filter(({ payload }) => option.isNone(payload)),
      rxo.withLatestFrom(on(todoSource.create('toggleDone'))),
      ray.inferVoid(([_, id]) => logger(`Todo not found by id: ${id}`)),
    );

    return {
      ...value,
      errorReport$,
    };
  },
);

const subscription = pipe(
  withErrorLogger,
  medium.run({
    todoApi: makeTodoApi(),
    todoSource: makeTodoSource(),
    logger: console.warn,
  }),
);
