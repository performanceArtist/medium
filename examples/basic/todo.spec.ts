import { requestResult } from '@performance-artist/fp-ts-adt';
import { option } from 'fp-ts';
import * as rx from 'rxjs';
import { test } from '../../src';
import { todoMedium } from './todo.medium';
import { makeTodoSource } from './todo.source';

const withTodo = test.withMedium(todoMedium);

describe('todo', () => {
  it(
    'Fetches todos on getTodos',
    withTodo(
      () => ({
        todoSource: makeTodoSource(),
        todoApi: {
          getTodos: () => rx.of(requestResult.success([])),
          updateTodo: () => {},
        },
      }),
      (deps, history, output) => {
        const { todoSource } = deps;

        todoSource.dispatch('getTodos')();

        expect(history.take()).toStrictEqual([
          output('setTodos$')(requestResult.success([])),
        ]);
      },
    ),
  );

  it(
    'Updates todo on toggle done',
    withTodo(
      () => {
        const todoSource = makeTodoSource();
        todoSource.state.modify(state => ({
          ...state,
          todos: requestResult.success([{ id: 1, text: '', done: false }]),
        }));

        return {
          todoSource,
          todoApi: {
            getTodos: () => rx.of(requestResult.success([])),
            updateTodo: () => {},
          },
        };
      },
      (deps, history, output) => {
        const { todoSource } = deps;

        todoSource.dispatch('toggleDone')(0);
        expect(history.take()).toStrictEqual([
          output('updateTodo$')(option.none),
        ]);

        todoSource.dispatch('toggleDone')(1);
        expect(history.take()).toStrictEqual([
          output('updateTodo$')(option.some({ id: 1, text: '', done: true })),
        ]);
      },
    ),
  );
});
