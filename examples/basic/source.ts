import { source } from '../../src';
import {
  requestResult,
  RequestResult,
  selector,
} from '@performance-artist/fp-ts-adt';
import { pipe } from 'fp-ts/lib/pipeable';
import { array, either } from 'fp-ts';

export type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export type TodoState = {
  todos: RequestResult<Todo[]>;
};

const initialState: TodoState = {
  todos: requestResult.initial,
};

// There are no reasons I know of not to make sources lazy, as it gives you more flexibility and
// control over creation. This way you can also create multiple components with the same state and events.
export const makeTodoSource = () =>
  source.create(
    'todo',
    initialState,
  )({
    getTodos: source.input<void>(),
    toggleDone: state => (id: number) => ({
      ...state,
      todos: pipe(
        state.todos,
        either.map(
          array.map(todo =>
            todo.id === id ? { ...todo, done: !todo.done } : todo,
          ),
        ),
      ),
    }),
  });

export type TodoSource = ReturnType<typeof makeTodoSource>;

const todoSource = makeTodoSource();
// create an action
const action = todoSource.create('toggleDone')(0);

// dispatch an action
todoSource.dispatch('toggleDone')(0);

// State is a behavior - i.e. an observable with a notion of a current value.
// It's represented by a wrapper over BehaviorSubject with some additional methods for convenience.
// You can set and modify state manually, but it should not be done in an untraced way(without an action) -
// each state update should be associated with a value.
const currentState = todoSource.state.get();
const state$ = todoSource.state.value$;
todoSource.state.set({ todos: requestResult.success([]) });
todoSource.state.modify(state => ({
  ...state,
  todos: requestResult.success([]),
}));

// The rest of the Source functions are used internally, so you shouldn't worry about them.

// On this layer you can also define functions to derive data using selector,
// which allows you to apply different strategies of memoization.
// Under the hood it is simply a function, but
// to distinguish it from other functions(and Reader in particular) it is given a 'run' field.

// This custom shape would not change unless todos field is modified.
const getStats = pipe(
  selector.focus<TodoState>()('todos'),
  selector.map(
    either.map(todos => ({
      total: todos.length,
      done: pipe(
        todos,
        array.reduce(0, (acc, todo) => (todo.done ? acc + 1 : acc)),
      ),
    })),
  ),
);

export const selectors = { getStats };
