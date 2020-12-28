import { selector } from '@performance-artist/fp-ts-adt';
import { identity } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { carrier, medium, ray } from '../../src';

// Consider this case: we want to start an app tour(and run its effects) only in case this is the user's first login.
// Since the effects of medium are simply observables, we can use chain-like operators(e.g. switchMap) to
// create an observable that contains the effects of tourMedium inside of the other "env" medium, that controls its lifecycle.

type TourMediumDeps = {
  tour: {
    setIsOpen: (isOpen: boolean) => void;
  };
};

const tourMedium = medium.map(medium.id<TourMediumDeps>()('tour'), deps => {
  const { tour } = deps;

  const setIsOpen$ = pipe(rx.of(true), ray.infer(tour.setIsOpen));

  return { setIsOpen$ };
});

type UserInfo = {
  isFirstLogin$: rx.Observable<boolean>;
};

type EnvMediumDeps = {
  userInfo: UserInfo;
};

export const tourEnvMedium = medium.map(
  medium.combine(tourMedium, medium.id<EnvMediumDeps>()('userInfo')),
  (deps, _, [tourMedium]) => {
    const { userInfo } = deps;

    // Carrier is an underlying value of the medium.
    // Medium type is basically Selector<E, Carrier<E, A>>.
    // Carrier "carries" over the dependencies +
    // a function that takes a stream of actions and returns an object with streams of effects.
    // carrier.mergeOutput merges the object streams to create one stream of effects,
    // which can be "chained", using operators like switchMap.
    const tourMedium$ = pipe(
      userInfo.isFirstLogin$,
      rxo.filter(identity),
      rxo.switchMap(() => pipe(tourMedium, carrier.mergeOutput)),
    );

    return {
      tourMedium$,
    };
  },
);

// More advanced case - what if we need a symbol(currency pair) to start a tour?
// We want to make sure we can "point" to that symbol with tour, otherwise tour should not start.

const tourSymbolMedium = medium.map(
  medium.combine(tourMedium, medium.id<{ symbol: string }>()('symbol')),
  (deps, on, [value]) => value,
);

type EnvMediumSymbolDeps = EnvMediumDeps & {
  symbolProvider: {
    symbol$: rx.Observable<string>;
  };
};

// While it is possible to add all tourSymbolMedium dependencies to envSymbolMedium
// and pass them through, the better approach is to utilize the underliying
// abstractions to pass only what we need.

export const tourSymbolEnvMedium = pipe(
  selector.combine(
    selector.defer(tourSymbolMedium, 'symbol'),
    medium.id<EnvMediumSymbolDeps>()('userInfo', 'symbolProvider'),
  ),
  selector.map(([tourMedium, envMedium]) =>
    carrier.map(envMedium, deps => {
      const { userInfo, symbolProvider } = deps;

      const tourMedium$ = pipe(
        rx.combineLatest([userInfo.isFirstLogin$, symbolProvider.symbol$]),
        rxo.filter(([isFirstLogin]) => isFirstLogin),
        rxo.switchMap(([_, symbol]) =>
          pipe(
            tourMedium.run({
              symbol,
            }),
            carrier.merge,
          ),
        ),
      );

      return {
        tourMedium$,
      };
    }),
  ),
);
