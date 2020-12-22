# Medium

`Medium` is a state management library based on `rxjs`. The main goal is to provide a scalable and flexible solution to develop complex frontend apps.

## Features

1. Traceable side effects for better testing and debugging. Reactive programming combined with predictability and simplicity of `redux` approach(eschewing the global state).

2. Simple, but powerful abstraction to handle incoming view actions and trigger side effects(`Medium`), which is easy to compose and extend.

3. Complete separation of the view, its state and events from business logic and side effects.

4. Rich type information.

5. Integration with `react` and `fp-ts`. Moreover, this library is a part of a group of packages, which are meant to be used together to form a complete set of tools for frontend development(barring ui) with `react`, `rxjs` and `fp-ts`:

`@performance-artist/fp-ts-adt` provides utilities and adts, most prominent being `selector` for `Reader`-based di and memoized selector creation.

`@performance-artist/store` provides a reactive key-value cache(`store`), which is used to create an interface over the transport layer(e.g. REST or websocket client). It also includes a wrapper over `BehaviorSubject` with monad instance - `behavior`.

`@performance-artist/react-utils` contains hooks and hocs for react.

Full example of the proposed architecture and these packages at work can be found [here](https://github.com/performanceArtist/medium-chat).

## Basic primitives

### Source

`Source` is a representation of the view's state and events. So it is a "source" of them. It should contain everything view needs for initial rendering + a set of events, which are fired upon user interaction. Events are represented by actions, which either change the state or not(in this case they're aliased by `source.input`). There are two important notes:

1. View should only interact with `Source` through actions(using `dispatch` function provided by `Source`), not modify its state directly. Actions should be as simple as possible - ideally only basic set and update operations.

2. The actions defined in `Source` should be utilized by view. There should not be any actions that aren't dispatched by view in one way or another.

### Medium

`Medium` is the main abstraction for side effect handling. The name alludes to refraction - in other words `Medium` is an environment that bends/transforms the incoming "sources" to a new shape. The "sources" can be user events, triggered by `Source` or some external data streams, like socket messages.

The main idea behind `Medium` is presentation of side-effects as actions. It is a lot like `Epic` from `redux-observable`: actions in - actions out. There are two types of actions - those that are defined in `Source` and those that are created by `Medium`(usually in response to `Source`). The medium action is represented by `Ray`, which is an adt not unlike `Action`, used in `Source`. The conceptual difference between `Ray` and `Action` is their origin - i.e. `Ray` can only be produced by `Medium`, while `Action` is definitely produced by view(and optionally by `Medium`). Implementation-wise `Ray`s aren't dispatched to `Source`s as opposed to `Action`s - since `Ray` presence already indicates that there is an effect associated with its payload.

While it is possible to define all actions in `Source` and simply return them in `Medium`, this is strongly discouraged. If `Source` defines actions emitted only by `Medium`, it has both knowledge of `Medium`'s and view's needs. Actions can easily become coupled both in `Source` and in `Medium`, which adds unnecessary complexity. This choice also has a potential of polluting `Source` with actions that aren't used in view and therefore have to be looked up in `Medium`s. From the developer's perspective it could raise a lot more questions - like whether a certain action should be in `Source` or `Medium`.

The other important recommendation is to only have one effect per observable in `Medium`'s and never use `tap`. Typical flow should look something like this:

    filter source action ->
    map data needed to create `Source`'s action or run a side effect ->
    return an action with the mapped data as a payload

It goes without saying that if you use `tap` instead of `ray` or `Source` action creators, the stream would not produce an action and there would be no way to track the side effect. Note that `Medium`'s typings enforce that you always return an action in each field of the resulting object. Returning an object of a certain shape is also encoded for consistency and ease of modification.

## Examples

### In this repo

Basic example: `examples/basic`.

`map`, `combine` examples, as well as higher-order medium example: `examples/transformation`.

### Todo

[Repo](https://github.com/performanceArtist/medium-todo)

Demonstrates how to use this library with `react`. Very bare-bones - no architecture.

### Chat

[Repo](https://github.com/performanceArtist/medium-chat)

More involved case with a backend and a basic chat functionality.

## Acknowledgements

`Reader` pattern for di, as well as request adt are not new. But this particular implementation, as well as overall architecture is strongly influenced by [@devexperts](https://github.com/devexperts/). One of the main goals is to address problems and try out some ideas I came by while working with them.

From a brief examination, this approach is similar to `circle.js` and `redux-observable`, although I haven't directly taken anything from them.
