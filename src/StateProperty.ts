import { State } from "./State";

/**
 * Function for decorating a property that is compatible with both TypeScript decorators.
 * It will keep track of readers and dispatch events when the property is changed.
 *
 * @returns {void}
 */
export function stateProperty(
    _proto: State,
    name: string | symbol,
    descriptor?: PropertyDescriptor
): PropertyDescriptor | void {
    const key = typeof name === "symbol" ? Symbol() : `__${String(name)}`;
    const nameStr = typeof name === "symbol" ? name.toString() : name;

    // Case 1: field (no accessor descriptor passed)
    if (!descriptor) {
        return {
            get(this: State) {
                this.recordRead(nameStr);
                return this[key];
            },
            set(this: State, value: unknown) {
                this[key] = value;
                this.dispatchStateEvent(nameStr);
            },
            enumerable: true,
            configurable: true,
        };
    }

    // Case 2: accessor (getter/setter present)
    const originalGet = descriptor.get;
    const originalSet = descriptor.set;

    return {
        get(this: State) {
            this.recordRead(nameStr);
            return originalGet ? originalGet.call(this) : this[key];
        },
        set(this: State, value: unknown) {
            if (originalSet) {
                originalSet.call(this, value);
            } else {
                this[key] = value;
            }
            this.dispatchStateEvent(nameStr);
        },
        enumerable: true,
        configurable: true,
    };
}
