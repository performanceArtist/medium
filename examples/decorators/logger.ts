import { pipe } from 'fp-ts/lib/pipeable';
import { effect, medium } from '../../src';
import * as rxo from 'rxjs/operators';
import { todoMedium } from '../basic/todo.medium';

type WithLoggerDeps = {
  log: (type: string, payload: string) => void;
};

const withLogger = medium.decorateAny(medium.id<WithLoggerDeps>()('log'))(
  (deps, [_, effects]) => {
    const log = pipe(
      medium.mergeInputs(effects),
      rxo.map(({ type, payload }) => ({
        type: String(type),
        payload: JSON.stringify(payload),
      })),
      effect.tag('log', ({ type, payload }) => deps.log(type, payload)),
    );

    return { log };
  },
);

const todoWithLogger = withLogger(todoMedium);
