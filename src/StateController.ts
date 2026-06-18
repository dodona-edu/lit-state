import { ReactiveController, ReactiveControllerHost } from "lit";
import { stateRecorder } from "./StateRecorder";
import { State, Unsubscribe } from "./State";

interface Subscription {
    keys: Set<string | undefined>;
    unsubscribe: Unsubscribe;
}

function keysEqual(a: Set<string | undefined>, b: Set<string | undefined>): boolean {
    if (a.size !== b.size) {
        return false;
    }
    for (const key of a) {
        if (!b.has(key)) {
            return false;
        }
    }
    return true;
}

/**
 * `StateController` a [ReactiveController](https://lit.dev/docs/composition/controllers/) that
 *  uses the `stateRecorder` to track all stateProperties that are read during a render cycle.
 *  It then subscribes to the relevant states to trigger an update of its host every time one
 *  of those stateProperties changes. Thanks to _@lit-app/state_ for introducing me to controllers
 *  for this usecase Reactive controllers
 *
 * Subscriptions are diffed across render cycles: a state whose set of read keys is
 * unchanged keeps its existing subscription. Only states that are no longer read, newly
 * read, or read with a different set of keys touch `addEventListener`/`removeEventListener`.
 * Because most components read the same state keys on every render, a re-render usually
 * does no listener churn at all (the previous implementation unsubscribed and re-subscribed
 * everything every render, i.e. O(states) listener operations per component per render).
 *
 * This code is a combination of the code from the [@lit-app/state StateController](https://github.com/lit-apps/lit-app/blob/main/packages/state/src/state-controller.ts)
 * and the [litState observeState mixin](https://github.com/gitaarik/lit-state/blob/8cd66223612c3b115c0275f58f6cee5e900ee534/lit-state.js#L1)
 */
export class StateController implements ReactiveController {
    private subscriptions: Map<State, Subscription> = new Map();
    wasConnected = false;
    isConnected = false;

    constructor(protected host: ReactiveControllerHost) {
        this.host.addController(this);
    }

    /**
     * The unsubscribe functions for the currently active subscriptions, one per
     * subscribed state. Exposed for backwards compatibility and introspection.
     */
    get unsubscribeList(): Unsubscribe[] {
        return [...this.subscriptions.values()].map((subscription) => subscription.unsubscribe);
    }

    hostConnected(): void {
        this.isConnected = true;
        if (this.wasConnected) {
            this.host.requestUpdate();
            this.wasConnected = false;
        }
    }
    hostDisconnected(): void {
        this.isConnected = false;
        this.wasConnected = true;
        this.clearStateObservers();
    }

    hostUpdate(): void {
        stateRecorder.start();
    }

    hostUpdated(): void {
        if (!this.isConnected) {
            this.clearStateObservers();
            return;
        }

        const log = stateRecorder.finish();

        // Drop subscriptions for states that were not read during this render.
        for (const state of [...this.subscriptions.keys()]) {
            if (!log.has(state)) {
                this.subscriptions.get(state).unsubscribe();
                this.subscriptions.delete(state);
            }
        }

        // Reuse subscriptions whose set of read keys is unchanged; (re)subscribe
        // only for states that are new or whose read keys changed.
        log.forEach((keys, state) => {
            const existing = this.subscriptions.get(state);
            if (existing && keysEqual(existing.keys, keys)) {
                return;
            }
            existing?.unsubscribe();
            const unsubscribe = state.subscribe(() => this.host.requestUpdate(), keys);
            this.subscriptions.set(state, { keys, unsubscribe });
        });
    }

    private clearStateObservers(): void {
        this.subscriptions.forEach((subscription) => subscription.unsubscribe());
        this.subscriptions.clear();
    }
}
