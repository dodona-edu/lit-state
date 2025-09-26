/* eslint-disable @typescript-eslint/no-unused-expressions */

import { State } from "../src/State";
import { stateProperty } from "../src/StateProperty";
import { stateRecorder } from "../src/StateRecorder";
import { expect, test, vi } from "vitest";

class ExampleState extends State {
    @stateProperty foo = "bar";
    @stateProperty fool = "bars";
}

test("a subscriber to a state should get notified anytime a stateProperty changes", () => {
    const state = new ExampleState();
    const subscriber = vi.fn();
    state.subscribe(subscriber);
    state.foo = "baz";
    expect(subscriber).toHaveBeenCalled();
});

test("a subscriber to a stateProperty should get notified anytime that stateProperty changes", () => {
    const state = new ExampleState();
    const subscriber = vi.fn();
    state.subscribe(subscriber, "foo");
    state.fool = "baz";
    expect(subscriber).not.toHaveBeenCalled();
    state.foo = "baz";
    expect(subscriber).toHaveBeenCalled();
});

test("reading a stateProperty should record a read", () => {
    const state = new ExampleState();
    vi.spyOn(stateRecorder, "recordRead");
    state.foo;
    expect(stateRecorder.recordRead).toHaveBeenCalled();
});

class GetSetExampleState extends State {
    private _foo = "bar";

    @stateProperty
    get foo(): string {
        this.getSideEffect();
        return this._foo;
    }

    set foo(value: string) {
        this.setSideEffect();
        this._foo = value;
    }

    setSideEffect = vi.fn();
    getSideEffect = vi.fn();
}

test("a stateProperty with getter and setter should work as expected", () => {
    const state = new GetSetExampleState();
    const subscriber = vi.fn();
    state.subscribe(subscriber, "foo");
    expect(state.foo).toBe("bar");
    expect(state.getSideEffect).toHaveBeenCalled();
    state.foo = "baz";
    expect(state.setSideEffect).toHaveBeenCalled();
    expect(subscriber).toHaveBeenCalled();
    expect(state.foo).toBe("baz");
});

test("a read should record a read on the property", () => {
    const state = new GetSetExampleState();
    vi.spyOn(stateRecorder, "recordRead");
    state.foo;
    expect(stateRecorder.recordRead).toHaveBeenCalledWith(state, "foo");
});
