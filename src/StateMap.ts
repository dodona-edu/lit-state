import { State } from "./State";

/**
 * Structural type of what the registry needs from a registered instance.
 * Avoids having to pick concrete key and value types for the shared registry.
 */
type Clearable = { clear(): void };

/**
 * Registry of every constructed `StateMap` that has not been garbage collected yet.
 * The entries are weak, so being registered never keeps a map alive: consumers are
 * free to construct maps dynamically (one per row, per record, ...) without leaking.
 */
const liveStateMaps = new Set<WeakRef<Clearable>>();
const finalizationRegistry = new FinalizationRegistry<WeakRef<Clearable>>((ref) => {
    liveStateMaps.delete(ref);
});

/**
 * This class extends the Map class to allow for state tracking
 * It notifies subscribers of key changes as if it were `stateProperties`.
 *
 * Every instance registers itself weakly, which allows `StateMap.clearAll()` to clear
 * all of them at once.
 */
export class StateMap<K, V> extends State implements Map<K, V> {
    private map: Map<K, V> = new Map<K, V>();

    public constructor() {
        super();
        const ref = new WeakRef<Clearable>(this);
        liveStateMaps.add(ref);
        finalizationRegistry.register(this, ref);
    }

    /**
     * Clears every `StateMap` that was still reachable when `clearAll()` was called, as if
     * `clear()` was called on each of them individually. Subscribers of those maps are
     * notified, just like they are for a regular `clear()`. Maps constructed afterwards,
     * including ones a subscriber constructs while `clearAll()` is still running, are not
     * affected.
     *
     * Instances that have already been garbage collected are silently skipped: the registry
     * holds weak references only, so it never keeps a map alive.
     *
     * The main use is resetting shared state between tests, so every test file does not have
     * to know about, and hand-clear, each individual map. Note that only maps are affected:
     * scalar `stateProperty` values living next to them keep whatever value they had.
     */
    public static clearAll(): void {
        for (const ref of [...liveStateMaps]) {
            const stateMap = ref.deref();
            if (stateMap === undefined) {
                liveStateMaps.delete(ref);
            } else {
                stateMap.clear();
            }
        }
    }

    public get size(): number {
        this.recordRead();
        return this.map.size;
    }

    public clear(): void {
        this.dispatchStateEvent();
        this.map.clear();
    }

    public delete(key: K): boolean {
        this.dispatchStateEvent(key.toString());
        return this.map.delete(key);
    }

    public forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: never): void {
        this.recordRead();
        this.map.forEach(callbackfn, thisArg);
    }

    public get(key: K): V | undefined {
        this.recordRead(key.toString());
        return this.map.get(key);
    }

    public has(key: K): boolean {
        this.recordRead(key.toString());
        return this.map.has(key);
    }

    public set(key: K, value: V): this {
        this.map.set(key, value);
        this.dispatchStateEvent(key.toString());
        return this;
    }

    public entries(): ReturnType<Map<K, V>["entries"]> {
        this.recordRead();
        return this.map.entries();
    }

    public keys(): ReturnType<Map<K, V>["keys"]> {
        this.recordRead();
        return this.map.keys();
    }

    public values(): ReturnType<Map<K, V>["values"]> {
        this.recordRead();
        return this.map.values();
    }

    public [Symbol.iterator](): ReturnType<Map<K, V>[typeof Symbol.iterator]> {
        this.recordRead();
        return this.map[Symbol.iterator]();
    }

    public get [Symbol.toStringTag](): string {
        return this.map[Symbol.toStringTag];
    }
}
