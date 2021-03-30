# Medium

`Medium` is a state management library based on `rxjs`. The main goal is to provide a scalable and flexible solution to develop complex frontend apps.

## Installation

The library uses two more packages that should be installed as peer deps:

```shell
npm install @performance-artist/medium @performance-artist/fp-ts-adt @performance-artist/rx-utils
```

There is also a react package, which has no direct bindings to the lib, but provides all necessary utilities and hooks for react integration:

```shell
npm install @performance-artist/react-utils
```

## Features

1. Traceable side effects for better testing and debugging. Reactive programming combined with predictability and simplicity of `redux` approach(eschewing the global state).

2. Simple, but powerful abstraction to handle incoming view actions and trigger side effects(`Medium`), which is easy to compose and extend.

3. Built with a complete separation of view, its state and events from business logic and side effects.

4. Rich type information.

5. Integration with `react` and `fp-ts`. Also, as mentioned, this library is a part of a group of packages, which are meant to be used together to form a complete set of tools for frontend development(barring ui) with `react`, `rxjs` and `fp-ts`:

`@performance-artist/fp-ts-adt` provides utilities and adts, most prominent being `selector` for `Reader`-based di and memoized selector creation.

`@performance-artist/rx-utils` provides a wrapper over `BehaviorSubject` with a monad instance - `behavior`. It also includes reactive key-value cache(`store`), which could be used to create an interface over the transport layer(e.g. REST or websocket client).

`@performance-artist/react-utils` contains hooks and hocs for react.

Full example of the proposed architecture and these packages at work can be found [here](https://github.com/performanceArtist/medium-chat).

## Basic primitives

### Source

`Source` is a representation of view's state and events. So it is a "source" of them. It should contain everything view needs for initial rendering as its state + a set of events, which are fired upon user interaction. Events are represented by actions, which can either change the state or keep it the same, meaning that it is an event that is handled separately(in this case they're aliased by `source.input`). There are three important notes:

1. View should only interact with `Source` through actions(using `dispatch` function provided by `Source`), not modify its state directly. Actions should be as simple as possible - ideally only basic set and update operations.

2. The actions defined in `Source` should be utilized by view exclusively. There should not be any actions that aren't dispatched by view in one way or another.

3. `Source` should not have any external dependencies and should not produce any side effects, such as api calls. If a state change requires an additional dependency, action should be kept "empty". That is, it should not change the state and be created with `source.input`.

### Medium

`Medium` is an abstraction for side effect handling. The name alludes to refraction - in other words `Medium` is an environment that bends/transforms the incoming "sources" to a new shape. The "sources" can be user events, triggered by `Source` or some external data streams, like socket messages.

The main idea behind `Medium` is presentation of side-effects as actions. It is a lot like `Epic` from `redux-observable`: actions in - actions out.

`Medium` returns an object of `Effect`s. The whole purpose of `Medium` is to build `Effect`s from observables. Any side effect triggered by observable(e.g. `Source` state modification) should become an `Effect`. By no circumstances should `tap` be used for this purpose.

This

```ts
const logNumber$ = pipe(rx.of(0), rxo.tap(console.log));
```

becomes this

```ts
const logNumber = pipe(rx.of(0), effect.tag('logNumber', console.log));
```

Typical flow inside of a `Medium` looks as the following:

    filter `Source` action/external data ->
    map data needed to run a side effect ->
    create an `Effect` and return it as a part of the result object

`Medium` also has a dependency injection support. This is done so side effects can be mocked in tests and comes with a benefit of easy modification and code separation. `Medium` isn't meant to hold any data besides the specific cases where the data is truly local. It is merely an integration layer between view and the world. Once `Medium` needs something to do the real world's work, it should be created separately and specified as a dependency, not utilized directly.

### Effect

`Effect` is an abstraction that represents an input stream, associated with an effectful function and a tag. Every time the stream emits a value, the function receives it and produces a side effect, such as a `Source` state modification or any other external call.

There are two constraints enforced by the abstraction.

1. Effect immutability and non-composability - once an `Effect` is created, neither its tag, nor its worker function can be modified or discarded.

2. Tag uniqueness withing one `Medium`(and overall, ideally, to avoid confusion). Each tag can only be associated with one `Effect`. This further solidifies the intent to make every `Effect` a distinct entity with a single responsibility, reflected by its name(tag).

There are three basic `Effect` operations:

1. Creation(`effect.tag`). To create an `Effect`, you need a stream of values(such as user events), a unique tag, and a function to execute a side effect.

```ts
const clickLog = pipe(
  rx.from(['click1', 'click2']),
  effect.tag('clickLog', (data) => console.log('click', data)),
);
```

2. Modification(`effect.transform`). The only way to modify `Effect` is to alter its input stream with `transform` function. The stream type should stay the same and the result of modification should become a substitute for the input `Effect`. If both input and output effects are needed(i.e. the output is not a substitute for the input), `effect.branch` should be used instead.

```ts
const firstClickLog = pipe(clickLog, effect.transform(rxo.first()));
```

3. Deriving(`effect.branch`/`effect.branches`). The cases that aren't accounted for with `transform` should be handled with `branch` or `branches`. The function argument allows any observable transformations, as long as the result is an another `Effect`. Input and output `Effect`s are independent in a sense that they only share the same input stream, which is further modified in the output `Effect`. These functions mainly exist for extensibility purposes - if you need to create a new `Medium` from an existing one. Otherwise you can achieve the same functionality inside of a `Medium` by simply moving an input stream to a separate variable.

```ts
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
```

## Examples

### In this repo

Basic todo example: `examples/basic`.

`transform` example: `examples/withReports`.

The advanced `tour` example: `examples/tour`.

### Todo

[Repo](https://github.com/performanceArtist/medium-todo)

Demonstrates how to use this library with `react`. Very bare-bones - no architecture.

### Chat

[Repo](https://github.com/performanceArtist/medium-chat)

More involved case with a backend and a basic chat functionality.

### Async joyride

[Repo](https://github.com/performanceArtist/async-joyride) + an [example](https://github.com/performanceArtist/async-joyride-example).

A solution for react-joyride that adds an ability to wait for tour steps to become available.

## Acknowledgements

`Reader` pattern for di, as well as request adt are not new. But this particular implementation, as well as overall architecture is strongly influenced by [@devexperts](https://github.com/devexperts/). One of the main goals is to address problems and try out some ideas I came by while working with them.

From a brief examination, this approach is similar to `circle.js` and `redux-observable`, although I haven't directly taken anything from them.
