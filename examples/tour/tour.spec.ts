import { withMedium } from '../../src/medium/testing';
import { tourEnvMedium, tourSymbolEnvMedium } from './tour';
import * as rx from 'rxjs';

describe('Env', () => {
  const withEnv = withMedium(tourEnvMedium);
  const isFirstLogin = new rx.Subject<boolean>();

  it(
    'Runs tour on first login',
    withEnv(
      () => ({
        tour: {
          setIsOpen: () => {},
        },
        userInfo: { isFirstLogin$: isFirstLogin.asObservable() },
      }),
      (deps, history, output) => {
        isFirstLogin.next(false);
        expect(history.take()).toStrictEqual([]);

        isFirstLogin.next(true);
        expect(history.take()).toStrictEqual([output('setIsOpen')(true)]);
      },
    ),
  );
});

describe('Symbol env', () => {
  const withEnv = withMedium(tourSymbolEnvMedium);
  const isFirstLogin = new rx.Subject<boolean>();
  const symbol = new rx.Subject<string>();

  it(
    'Run tour on first login, in case symbol is available',
    withEnv(
      () => ({
        tour: {
          setIsOpen: () => {},
        },
        userInfo: { isFirstLogin$: isFirstLogin.asObservable() },
        symbolProvider: {
          symbol$: symbol.asObservable(),
        },
      }),
      (deps, history, output) => {
        isFirstLogin.next(false);
        expect(history.take()).toStrictEqual([]);

        isFirstLogin.next(true);
        expect(history.take()).toStrictEqual([]);

        symbol.next('USD/CAD');
        expect(history.take()).toStrictEqual([output('setIsOpen')(true)]);
      },
    ),
  );
});
