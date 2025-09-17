import { State } from "./State";

/**
 * This class extends the Map class to allow for state tracking
 * It notifies subscribers of key changes as if it where `stateProperties`.
 */
export class StateMap<K, V> extends State implements Map<K, V> {
    private map: Map<K, V> = new Map<K, V>();

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
