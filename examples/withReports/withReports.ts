import { pipe } from 'fp-ts/lib/pipeable';
import { medium, effect } from '../../src';
import { todoMedium } from '../basic/todo.medium';
import * as rxo from 'rxjs/operators';
import * as rx from 'rxjs';
import { option } from 'fp-ts';
import { makeTodoApi } from '../basic/todo.api';
import { makeTodoSource } from '../basic/todo.source';
import { flow } from 'fp-ts/lib/function';

export type ReportDeps = {
  logger: (info: string) => void;
};

export const withReports = medium.map(
  medium.combine(todoMedium, medium.id<ReportDeps>()('logger')),
  (deps, [todoMedium]) => {
    const { todoSource, logger } = deps;

    const errorReport = pipe(
      todoMedium.updateTodo,
      // creates a new Effect, using an observable from another Effect
      // note that the second Effect will not trigger the "parent",
      // so in this case they both should be returned
      effect.branch(
        flow(
          rxo.filter(option.isNone),
          rxo.withLatestFrom(todoSource.on.toggleDone.value$),
          rxo.map(([_, id]) => id),
          effect.tag('errorReport', (id) =>
            logger(`Todo not found by id: ${id}`),
          ),
        ),
      ),
    );

    const updateReport = effect.branches(
      [todoMedium.updateTodo, todoMedium.setTodos],
      ([updateTodo$, setTodo$]) =>
        pipe(
          rx.merge(updateTodo$, setTodo$),
          effect.tag('updateReport', () => logger('Update')),
        ),
    );

    return {
      ...todoMedium,
      errorReport,
      updateReport,
    };
  },
);

const subscription = pipe(
  withReports,
  medium.run({
    todoApi: makeTodoApi(),
    todoSource: makeTodoSource(),
    logger: console.warn,
  }),
);
