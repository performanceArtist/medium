import { pipe } from 'fp-ts/lib/pipeable';
import { effect, medium } from '../../src';
import { TodoDeps } from './todo.medium';
import * as rxo from 'rxjs/operators';
import { array, option } from 'fp-ts';

export const todoMedium = medium.map(
  medium.id<TodoDeps>()('todoApi', 'todoSource'),
  (deps) => {
    const { todoApi, todoSource } = deps;

    const setTodos = pipe(
      todoSource.on.getTodos.value$,
      rxo.switchMap(todoApi.getTodos),
      effect.partial((todos) =>
        todoSource.state.modify((state) => ({ ...state, todos })),
      ),
    );

    const updateTodo = pipe(
      todoSource.on.toggleDone.value$,
      rxo.withLatestFrom(todoSource.state.value$),
      rxo.map(([id, state]) =>
        pipe(
          state.todos,
          option.fromEither,
          option.chain(array.findFirst((todo) => todo.id === id)),
        ),
      ),
      effect.partial((todo) => {
        if (option.isSome(todo)) {
          todoApi.updateTodo(todo.value);
        }
      }),
    );

    return effect.tagObject({
      setTodos,
      updateTodo,
    });
  },
);
