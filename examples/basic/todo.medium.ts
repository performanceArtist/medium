import { medium, ray } from '../../src';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rxo from 'rxjs/operators';
import { array, option } from 'fp-ts';
import { makeTodoSource, TodoSource } from './todo.source';
import { TodoApi, makeTodoApi } from './todo.api';

type Deps = {
  todoApi: TodoApi;
  todoSource: TodoSource;
};

export const todoMedium = medium.map(
  // Creates a minimal medium value(similar to Applicative's of).
  // Keys('todoApi', 'todoSource') are a memoization measure - this ensures
  // that regardless of the object passed to Medium, it will only recreate itself when
  // the values at the aforementioned keys have changed.
  medium.id<Deps>()('todoApi', 'todoSource'),
  (deps, on) => {
    const { todoApi, todoSource } = deps;

    const setTodos$ = pipe(
      // this function is used to filter actions triggered by sources
      on(todoSource.create('getTodos')),
      rxo.switchMap(todoApi.getTodos),
      // `ray` is a generic action creator used to add information to side effects.
      // `infer` derives the following action automatically upon mapping: Ray<'setTodos$', RequestResult<Todo[]>>,
      ray.infer(todos =>
        todoSource.state.modify(state => ({ ...state, todos })),
      ),
    );

    const updateTodo$ = pipe(
      on(todoSource.create('toggleDone')),
      rxo.withLatestFrom(todoSource.state.value$),
      rxo.map(([id, state]) =>
        pipe(
          state.todos,
          option.fromEither,
          option.chain(array.findFirst(todo => todo.id === id)),
        ),
      ),
      ray.infer(todo => {
        if (option.isSome(todo)) {
          todoApi.updateTodo(todo.value);
        }
      }),
    );

    return {
      setTodos$,
      updateTodo$,
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
