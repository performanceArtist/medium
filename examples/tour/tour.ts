import { selector } from '@performance-artist/fp-ts-adt';
import { identity } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { carrier, medium, effect } from '../../src';

// Consider this case: we want to start an app tour(and run its effects) only in case this is the user's first login.

type TourMediumDeps = {
  tour: {
    setIsOpen: (isOpen: boolean) => void;
  };
};

const tourMedium = medium.map(medium.id<TourMediumDeps>()('tour'), (deps) => {
  const { tour } = deps;

  const setIsOpen = pipe(rx.of(true), effect.tag('setIsOpen', tour.setIsOpen));

  return { setIsOpen };
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

    // "transform" allows to modify the effect's input stream,
    // as long as it produces the same payload type
    const setIsOpen = pipe(
      tourMedium.setIsOpen,
      effect.transform((input$) =>
        pipe(
          userInfo.isFirstLogin$,
          rxo.filter(identity),
          rxo.switchMap(() => input$),
        ),
      ),
    );

    return {
      setIsOpen,
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
    carrier.map(envMedium, (deps) => {
      const { userInfo, symbolProvider } = deps;

      const tourEffects$ = pipe(
        rx.combineLatest([userInfo.isFirstLogin$, symbolProvider.symbol$]),
        rxo.filter(([isFirstLogin]) => isFirstLogin),
        rxo.switchMap(([_, symbol]) =>
          pipe(
            tourMedium.run({
              symbol,
            }),
            // uses sources to produce an effect map
            carrier.merge,
          ),
        ),
      );

      const tourStart = pipe(
        tourEffects$,
        rxo.filter(e => e.type === 'setIsOpen'),
        rxo.map((e) => e.payload),
        effect.tag('setIsOpen', () => {}),
      );

      return {
        tourStart,
      };
    }),
  ),
);
