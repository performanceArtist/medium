import { Effect } from '../../src/effect/effect';
import { effect, medium } from '../../src';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';

// for example, we need to cache a particular request made in many different mediums

type Metric = {
  value: number;
};

type HasMetricsCall = {
  setMetrics: Effect<'setMetrics', { type: string; data: Metric[] }>;
};

const withMetricsCall = medium.decorateWith<HasMetricsCall>();

type WithCachedMetricsDeps = {
  storage: Storage;
};

const withCachedMetrics = withMetricsCall(
  medium.id<WithCachedMetricsDeps>()('storage'),
)((deps, [_, effects]) => {
  const { storage } = deps;

  const cacheMetrics = pipe(
    effects.setMetrics,
    effect.branch(
      effect.tag('cacheMetrics', (metrics) =>
        storage.setItem(metrics.type, JSON.stringify(metrics.data)),
      ),
    ),
  );

  return { cacheMetrics };
});

const testMedium = medium.map(medium.id<{}>()(), () => {
  const setMetrics = pipe(
    rx.of([0, 1]),
    rxo.map((data) => ({
      type: 'test',
      data: data.map((value) => ({ value })),
    })),
    effect.tag('setMetrics', (data) => console.log('request', data)),
  );

  return { setMetrics };
});

const testCachedMetrics = withCachedMetrics(testMedium);
