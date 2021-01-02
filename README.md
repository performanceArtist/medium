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

3. Complete separation of the view, its state and events from business logic and side effects.

4. Rich type information.

5. Integration with `react` and `fp-ts`. Also, as mentioned, this library is a part of a group of packages, which are meant to be used together to form a complete set of tools for frontend development(barring ui) with `react`, `rxjs` and `fp-ts`:

`@performance-artist/fp-ts-adt` provides utilities and adts, most prominent being `selector` for `Reader`-based di and memoized selector creation.

`@performance-artist/rx-utils` provides a wrapper over `BehaviorSubject` with monad instance - `behavior`. It also includes reactive key-value cache(`store`), which is used to create an interface over the transport layer(e.g. REST or websocket client).

`@performance-artist/react-utils` contains hooks and hocs for react.

Full example of the proposed architecture and these packages at work can be found [here](https://github.com/performanceArtist/medium-chat).

## Basic primitives

### Source

`Source` is a representation of the view's state and events. So it is a "source" of them. It should contain everything view needs for initial rendering + a set of events, which are fired upon user interaction. Events are represented by actions, which either change the state or not(in this case they're aliased by `source.input`). There are two important notes:

1. View should only interact with `Source` through actions(using `dispatch` function provided by `Source`), not modify its state directly. Actions should be as simple as possible - ideally only basic set and update operations.

2. The actions defined in `Source` should be utilized by view. There should not be any actions that aren't dispatched by view in one way or another.

### Medium

`Medium` is an abstraction for side effect handling. The name alludes to refraction - in other words `Medium` is an environment that bends/transforms the incoming "sources" to a new shape. The "sources" can be user events, triggered by `Source` or some external data streams, like socket messages.

The main idea behind `Medium` is presentation of side-effects as actions. It is a lot like `Epic` from `redux-observable`: actions in - actions out. The medium action is represented by `Ray`, which is an adt not unlike `Action`, used in `Source`. The conceptual difference between `Ray` and `Action` is their origin - i.e. `Ray` can only be produced by `Medium`, while `Action` is produced by view.

The only `Medium` "rules" are:

1. Have one effect per observable, which is the last transformation of a stream's value.

2. Never use `tap`(except for debugging purposes).

Typical flow should look something like this:

    filter source action/external data ->
    map data needed to run a side effect ->
    return an action with the mapped data as a payload

It goes without saying that if you use `tap` instead of `ray`, the stream would not produce an action and there would be no way to track the side effect. Note that `Medium`'s typings enforce that you always return an observable with a `Ray` action in each field of the resulting object. Returning an object is encoded for consistency and ease of modification.

## Examples

### In this repo

Basic todo example: `examples/basic`.

`map` examples: `examples/map`.

The advanced `chain` example: `examples/chain`.

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
