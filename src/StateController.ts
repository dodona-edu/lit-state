import { ReactiveController, ReactiveControllerHost } from "lit";
import { stateRecorder } from "./StateRecorder";
import { Unsubscribe } from "./State";

/**
 * `StateController` a [ReactiveController](https://lit.dev/docs/composition/controllers/) that
 *  uses the `stateRecorder` to track all stateProperties that are read during a render cycle.
 *  It then subscribes to the relevant states to trigger an update of its host every time one
 *  of those stateProperties changes. Thanks to _@lit-app/state_ for introducing me to controllers
 *  for this usecase Reactive controllers
 *
 * This code is a combination of the code from the [@lit-app/state StateController](https://github.com/lit-apps/lit-app/blob/main/packages/state/src/state-controller.ts)
 * and the [litState observeState mixin](https://github.com/gitaarik/lit-state/blob/8cd66223612c3b115c0275f58f6cee5e900ee534/lit-state.js#L1)
 */
export class StateController implements ReactiveController {
    unsubscribeList: Unsubscribe[] = [];
    wasConnected = false;
    isConnected = false;

    constructor(protected host: ReactiveControllerHost) {
        this.host.addController(this);
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
        this.clearStateObservers();
        if (!this.isConnected) {
            return;
        }
        const log = stateRecorder.finish();
        log.forEach((keys, state) => {
            const unsubscribe = state.subscribe(() => this.host.requestUpdate(), keys);
            this.unsubscribeList.push(unsubscribe);
        });
    }

    private clearStateObservers(): void {
        this.unsubscribeList.forEach((unsubscribe) => unsubscribe());
        this.unsubscribeList = [];
    }
}
