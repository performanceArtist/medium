import { record } from 'fp-ts';
import { pipe } from 'fp-ts/lib/pipeable';
import { medium } from '../medium';
import * as rx from 'rxjs';
import { AnyAction } from '../source';
import { CarrierOutput } from '../carrier/carrier';
import { ObservableValue } from '../carrier/enclose';
import { Medium } from '../medium/medium';
import { ray } from '../ray';

type WithLoggerDeps = {
  logActive: boolean;
};
export const withLogger = <A extends CarrierOutput>(
  log: (value: ObservableValue<A[keyof A]>) => void,
) => <E extends {}>(e: Medium<E, A>) =>
  medium.map(
    medium.combine(e, medium.id<WithLoggerDeps>()('logActive')),
    (deps, _, [mediumValue]) => {
      const { logActive } = deps;

      const log$ = pipe(
        mediumValue,
        record.reduce(rx.EMPTY as rx.Observable<AnyAction>, (acc, cur) =>
          rx.merge(acc, cur),
        ),
        ray.inferVoid(log as any),
      );

      return logActive ? { ...mediumValue, log$ } : mediumValue;
    },
  );
