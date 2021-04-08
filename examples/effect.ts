import { pipe } from 'fp-ts/lib/pipeable';
import * as rx from 'rxjs';
import * as rxo from 'rxjs/operators';
import { effect } from '../src';

const logNumber$ = pipe(rx.of(0), rxo.tap(console.log));

const logNumber = pipe(rx.of(0), effect.tag('logNumber', console.log));

const clickLog = pipe(
  rx.from(['click1', 'click2']),
  effect.tag('clickLog', (data) => console.log('click', data)),
);

{
  const clickLog = pipe(
    rx.from(['click1', 'click2']),
    effect.partial((data) => console.log('click', data)),
  );
  const effects = effect.tagObject({ clickLog });
}

const firstClickLog = pipe(clickLog, effect.transform(rxo.first()));

// imagine we only have an access to clickLog,
// but not its input stream(rx.from(['click1', 'click2']))
const fetchOnClick = pipe(
  clickLog,
  effect.branch(
    effect.tag('fetchOnClick', (clickValue) =>
      console.log('fetch', clickValue),
    ),
  ),
);

// same as above, but multiple `Effect`s can be passed
const fetchOnClicks = effect.branches([clickLog], ([click$]) =>
  pipe(
    click$,
    effect.tag('fetchOnClick', (clickValue) =>
      console.log('fetch', clickValue),
    ),
  ),
);

// `effect.partial` version
{
  const fetchOnClick = pipe(
    clickLog,
    effect.branch(
      effect.partial((clickValue) => console.log('fetch', clickValue)),
    ),
  );

  const fetchOnClicks = effect.branches([clickLog], ([click$]) =>
    pipe(
      click$,
      effect.partial((clickValue) => console.log('fetch', clickValue)),
    ),
  );

  const result = effect.tagObject({ fetchOnClick, fetchOnClicks });
}
