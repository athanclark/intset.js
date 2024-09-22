export default class IntSet {
    INTSIZE;
    entries;
    /**
     * The entry point of an IntSet
     * @param size The number of bytes to allocate per entry in the set (default is 128n)
     */
    constructor(size) {
        this.INTSIZE = size || 256n;
        this.entries = new Map();
    }
    makeMask(x) {
        return 2n ** (x % this.INTSIZE);
    }
    makeEntry(x) {
        return x / this.INTSIZE;
    }
    /**
     * Add an element to the set
     * @param x The element to add
     */
    add(x) {
        const mask = this.makeMask(x);
        const entry = this.makeEntry(x);
        const oldEntry = this.entries.get(entry);
        this.entries.set(entry, oldEntry ? oldEntry | mask : mask);
    }
    /**
     * Remove an element to the set
     * @method
     * @param x The element to remove
     */
    remove(x) {
        const mask = this.makeMask(x);
        const entry = this.makeEntry(x);
        const oldEntry = this.entries.get(entry);
        if (oldEntry) {
            const newEntry = oldEntry & ~mask;
            if (newEntry === 0n) {
                this.entries.delete(entry);
            }
            else {
                this.entries.set(entry, newEntry);
            }
        }
    }
    /**
     * Does the set contain this element?
     * @param x The element to query
     */
    contains(x) {
        const mask = this.makeMask(x);
        const entry = this.makeEntry(x);
        const oldEntry = this.entries.get(entry);
        if (oldEntry) {
            return (oldEntry | mask) === oldEntry;
        }
        else {
            return false;
        }
    }
    /**
     * Create a union of two sets
     * @param xs The other set
     */
    union(xs) {
        const ys = new Map(xs.entries); // cloned
        for (const [k, v] of this.entries) {
            const old = ys.get(k);
            ys.set(k, old ? old | v : v);
        }
        const zs = new IntSet();
        zs.entries = ys;
        return zs;
    }
    /**
     * Find an intersection of two sets
     * @param xs The other set
     */
    intersection(xs) {
        const ys = new Map();
        let smaller;
        let larger;
        if (this.entries.size < xs.entries.size) {
            smaller = this.entries;
            larger = xs.entries;
        }
        else {
            smaller = xs.entries;
            larger = this.entries;
        }
        for (const [k, v] of smaller) {
            const v_ = larger.get(k);
            if (v_) {
                ys.set(k, v & v_);
            }
        }
        let zs = new IntSet();
        zs.entries = ys;
        return zs;
    }
    /**
     * Pull the symmetric difference of two sets
     * @param xs The other set
     */
    symmetricDifference(xs) {
        let ys = new Map(xs.entries); // clone
        for (const [k, v] of this.entries) {
            const old = ys.get(k);
            ys.set(k, old ? old ^ v : v);
        }
        let zs = new IntSet();
        zs.entries = ys;
        return zs;
    }
    /**
     * Subtract the content of one set from this one
     * @param xs The set that won't be present in the result
     */
    difference(xs) {
        let ys = new Map(this.entries);
        for (const [k, v] of xs.entries) {
            const old = ys.get(k);
            if (old) {
                const newEntry = old & ~v;
                if (newEntry === 0n) {
                    ys.delete(k);
                }
                else {
                    ys.set(k, newEntry);
                }
            }
        }
        let zs = new IntSet();
        zs.entries = ys;
        return zs;
    }
    /**
     * Turn the contents of the set into an unsorted array
     */
    toArray() {
        const result = [];
        const INTSIZE = this.INTSIZE;
        this.entries.forEach(function (entry, entryIndex) {
            for (let i = 0n; entry !== 0n; i++) {
                if ((entry & 1n) === 1n) { // if the bit is set
                    result.push(i + (entryIndex * INTSIZE));
                }
                entry = entry >> 1n;
            }
        });
        return result;
    }
    /**
     * Determine whether or not this set is empty
     */
    isEmpty() {
        let acc = 0n;
        for (const entry of this.entries.values()) {
            acc = acc | entry;
        }
        return acc === 0n;
    }
}
