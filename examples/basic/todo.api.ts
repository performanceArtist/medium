import { requestResult, RequestResult } from '@performance-artist/fp-ts-adt';
import * as rx from 'rxjs';

// api has its own types that may differ from the view's types
// changes in the view should not affect the api, but changes in the api affect the view
// conversions(mappings to view types) should be handled by epic or container
export type Todo = {
  id: number;
  text: string;
  done: boolean;
};

export type TodoApi = {
  getTodos: () => rx.Observable<RequestResult<Todo[]>>;
  updateTodo: (todo: Todo) => void;
};

export const makeTodoApi = (): TodoApi => ({
  getTodos: () =>
    rx.of(requestResult.success([{ id: 0, text: 'test', done: false }])),
  updateTodo: todo => console.log('Update todo:', todo),
});
