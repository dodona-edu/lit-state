# Lit state 
`@dodona/lit-state` is a state management system for [lit](https://lit.dev/) that combines the best of [litState](https://www.npmjs.com/package/lit-element-state) and [@lit-app/state](https://www.npmjs.com/package/@lit-app/state).

It is designed to be easy to use, with great typescript support and minimal boilerplate code.

This package has been in active use in production at [Dodona](https://dodona.be), with thousands of users daily, since early 2023.

## Getting started
Install the package via npm or yarn:
```bash
yarn add @dodona/lit-state
# or
npm install @dodona/lit-state
```

### Usage
Statefull objects inherit from `State` and use the `stateProperty` decorator for properties that should be tracked.
```ts
class CounterState extends State {
  @stateProperty() count = 0;
}

// global state that can be shared between components
const counterState = new CounterState();
```

Components that want to use state inherit from `LitElement` and use the `StateController` to track state properties that are read during render.
You only need to define the `StateController` once per component, it will automatically track all state properties that are read during render and subscribe to them.
```ts
class CounterComponent extends LitElement {
  private stateController = new StateController(this);

  render() {
    return html`
      <div>Count: ${counterState.count}</div>
      <button @click=${() => counterState.count++ }>Increment</button>
    `;
  }
}
```

## API
The package exports the following:
- `State` a class that inherits from `EventTarget`. It can be subscribed to and will dispatch an event to all subscribers when any of its properties change. It also record every read of it's properties to the stateRecorder. All credits to _@lit-app/state_ for the idea to use `EventTarget` to avoid reinventing an event system.
- `stateProperty` a decorator used for properties in the `State` class. This decorator overwrites the get and set methods to make sure events get dispatched.
- `stateRecorder` instance. A global instance that records every property of a state that gets read between its start and finish. Credits to _litState_.
- `StateController` a [ReactiveController](https://lit.dev/docs/composition/controllers/) that uses the `stateRecorder` to track all stateProperties that are read during a render cycle. It then subscribes to the relevant states to trigger an update of its host every time one of those stateProperties changes. Thanks to _@lit-app/state_ for introducing me to controllers for this use case.
- `StateEvent` a custom event that signifies state changes. Credits _@lit-app/state_
- `StateMap` extends `State` and implements `Map`. It  notifies subscribers of key changes as if it where stateProperties.

## Contributing
Contributions are welcome! Please open an issue or a pull request on GitHub.
See `package.json` for scripts to build, test and lint the project.
