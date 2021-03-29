import { medium, effect } from '../../src';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rxo from 'rxjs/operators';
import { array, option } from 'fp-ts';
import { makeTodoSource, TodoSource } from './todo.source';
import { TodoApi, makeTodoApi } from './todo.api';

export type TodoDeps = {
  todoApi: TodoApi;
  todoSource: TodoSource;
};

export const todoMedium = medium.map(
  // Creates a minimal medium value(similar to Applicative's of).
  // Keys('todoApi', 'todoSource') are a memoization measure - this ensures
  // that regardless of an object passed to Medium, it will only recreate itself when
  // the values at the aforementioned keys have changed.
  medium.id<TodoDeps>()('todoApi', 'todoSource'),
  (deps, on) => {
    const { todoApi, todoSource } = deps;

    const setTodos = pipe(
      // this function is used to filter actions triggered by sources
      // it returns an observable with an action payload
      on(todoSource.create('getTodos')),
      rxo.switchMap(todoApi.getTodos),
      // create an effect representation
      effect.tag('setTodos', (todos) =>
        todoSource.state.modify((state) => ({ ...state, todos })),
      ),
    );

    const updateTodo = pipe(
      on(todoSource.create('toggleDone')),
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
    );

    return {
      setTodos,
      updateTodo,
    };
  },
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
