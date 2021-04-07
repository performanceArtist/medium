import { RequestResult, requestResult } from '@performance-artist/fp-ts-adt';
import { option } from 'fp-ts';
import * as rx from 'rxjs';
import { test } from '../../src';
import { ReportDeps, withReports as reportsMedium } from './withReports';
import { makeTodoSource, Todo } from '../basic/todo.source';
import { TodoDeps } from '../basic/todo.medium';
import { unorderedEqualStrict } from '../../src/medium/testing';

const withReports = test.withMedium(reportsMedium);

const mockTodos: RequestResult<Todo[]> = requestResult.success([
  { id: 1, text: '', done: false },
]);

const makeDeps = (): ReportDeps & TodoDeps => ({
  todoSource: makeTodoSource(),
  todoApi: {
    getTodos: () => rx.of(mockTodos),
    updateTodo: () => {},
  },
  logger: () => {},
});

describe('reports', () => {
  it(
    'Triggers report on any update',
    withReports(makeDeps, (deps, history, output) => {
      const { todoSource } = deps;

      todoSource.on.getTodos.next();
      expect(history.take()).toStrictEqual([
        output('setTodos')(mockTodos),
        output('updateReport')(mockTodos),
      ]);

      todoSource.on.toggleDone.next(1);
      expect(history.take()).toStrictEqual([
        output('updateTodo')(option.some({ id: 1, text: '', done: true })),
        output('updateReport')(option.some({ id: 1, text: '', done: true })),
      ]);
    }),
  );

  it(
    'Triggers logger on error(no todo for the provided id)',
    withReports(makeDeps, (deps, history, output) => {
      const { todoSource } = deps;

      todoSource.on.toggleDone.next(10);
      const [first, ...rest] = history.take();
      expect(first).toStrictEqual(output('updateTodo')(option.none));
      expect(
        unorderedEqualStrict(rest, [
          output('updateReport')(option.none),
          output('errorReport')(10),
        ]),
      ).toBe(true);
    }),
  );
});
