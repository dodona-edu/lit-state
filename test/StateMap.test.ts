import { StateMap } from "../src/StateMap";
import { stateRecorder } from "../src/StateRecorder";
import { StateController } from "../src/StateController";
import {html, LitElement, TemplateResult} from "lit";
import { customElement } from "lit/decorators.js";
import {fixture, fixtureCleanup, nextFrame} from "@open-wc/testing-helpers";
import { describe, expect, beforeEach, test, vi, afterEach } from "vitest";

describe("StateMap", () => {
    const stateMap: StateMap<string, string> = new StateMap<string, string>();
    @customElement("test-component")
    class TestComponent extends LitElement {
        constructor() {
            super();
            new StateController(this);
        }

        protected override render(): TemplateResult {
            return html`<span>${stateMap.get("foo")}</span>`;
        }
    }
    let el: TestComponent;

    beforeEach(async () => {
        stateMap.clear();
        el = await fixture(`<test-component></test-component>`);
    });

    afterEach(() => {
        fixtureCleanup();
    });

    test("should call recordRead with correct key on get", () => {
        const spy = vi.spyOn(stateRecorder, "recordRead");
        stateMap.get("foo");
        expect(spy).toHaveBeenCalledWith(stateMap, "foo");
        spy.mockRestore();
    });

    test("should notify subscribers on set", () => {
        const subscriber = vi.fn();
        stateMap.subscribe(subscriber, "foo");
        stateMap.set("foo", "baz");
        expect(subscriber).toHaveBeenCalled();
    });

    test("stateMap should update users if used key gets updated", async () => {
        expect(el.shadowRoot?.textContent).toBe("");
        stateMap.set("foo", "bar");
        await nextFrame();
        expect(el.shadowRoot?.textContent).toBe("bar");
    });

    test("stateMap should update users if used key gets deleted", async () => {
        stateMap.set("foo", "bar");
        await nextFrame();
        expect(el.shadowRoot?.textContent).toBe("bar");
        stateMap.delete("foo");
        await nextFrame();
        expect(el.shadowRoot?.textContent).toBe("");
    });

    test("stateMap should update users if used key gets cleared", async () => {
        stateMap.set("foo", "bar");
        await nextFrame();
        expect(el.shadowRoot?.textContent).toBe("bar");
        stateMap.clear();
        await nextFrame();
        expect(el.shadowRoot?.textContent).toBe("");
    });

    test("should record read on a values call", async () => {
        vi.spyOn(stateRecorder, "recordRead");
        stateMap.values();
        expect(stateRecorder.recordRead).toHaveBeenCalled();
    });

    test("subscriber should get notified for any change to the map", () => {
        const subscriber = vi.fn();
        stateMap.subscribe(subscriber);
        stateMap.set("foo", "bar");
        expect(subscriber).toHaveBeenCalled();
    });

    test("A subscriber to a specific key should get notified for any change to that key", () => {
        const subscriber = vi.fn();
        stateMap.subscribe(subscriber, "foo");
        stateMap.set("fool", "bar");
        expect(subscriber).not.toHaveBeenCalled();
        stateMap.set("foo", "bar");
        expect(subscriber).toHaveBeenCalled();
    });
});
