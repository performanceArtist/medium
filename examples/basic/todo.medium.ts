import { medium, effect } from '../../src';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rxo from 'rxjs/operators';
import { array, option } from 'fp-ts';
import { makeTodoSource, TodoSource } from './todo.source';
import { TodoApi, makeTodoApi } from './todo.api';
import { flow } from 'fp-ts/lib/function';
import { selector } from '@performance-artist/fp-ts-adt';

export type TodoDeps = {
  todoApi: TodoApi;
  todoSource: TodoSource;
};

export const todoMedium = pipe(
  selector.keys<TodoDeps>()('todoApi', 'todoSource'),
  selector.map((deps) => {
    const { todoApi, todoSource } = deps;

    const setTodos = pipe(
      todoSource.on.getTodos.value,
      effect.branch(
        flow(
          rxo.switchMap(todoApi.getTodos),
          effect.tag('setTodos', (todos) =>
            todoSource.state.modify((state) => ({ ...state, todos })),
          ),
        ),
      ),
    );

    const updateTodo = pipe(
      todoSource.on.toggleDone.value,
      effect.branch(
        flow(
          rxo.withLatestFrom(todoSource.state.value$),
          rxo.map(([id, state]) =>
            pipe(
              state.todos,
              option.fromEither,
              option.chain(array.findFirst((todo) => todo.id === id)),
            ),
          ),
          effect.tag('updateTodo', (todo) => {
            if (option.isSome(todo)) {
              todoApi.updateTodo(todo.value);
            }
          }),
        ),
      ),
    );

    return {
      setTodos,
      updateTodo,
    };
  }),
);

// Should be done on component initialization.
const subscription = pipe(
  todoMedium,
  medium.run({ todoApi: makeTodoApi(), todoSource: makeTodoSource() }),
);

// an alternative way to do it(resolve dependencies, then subscribe)
// medium.run is just an alias for this
const resolved = todoMedium.run({
  todoApi: makeTodoApi(),
  todoSource: makeTodoSource(),
});
const subscription1 = medium.subscribe(resolved);
