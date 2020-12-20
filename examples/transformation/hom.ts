import { pipe } from 'fp-ts/lib/pipeable';
import { medium } from '../../src';
import { todoMedium } from '../basic/medium';
import { makeTodoApi } from '../basic/api';
import { makeTodoSource } from '../basic/source';
import { withLogger } from '../../src/homs';

// hom(s) - Higher Order Medium(s)
// Allows to add functionality(and optionally dependencies associated with this functionality) to any medium.
// For example, logger hom adds a log effect + dependency field(logActive) to switch it on and off.
const todoWithLogger = pipe(
  todoMedium,
  withLogger(({ type, payload }) => console.log('todo', type, payload)),
);

const subscription = pipe(
  todoWithLogger,
  medium.run({
    logActive: true,
    todoApi: makeTodoApi(),
    todoSource: makeTodoSource(),
  }),
);
