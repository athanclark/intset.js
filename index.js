/**
 * The entry point of an IntSet
 * @constructor
 * @param {bigint} size - the number of bytes to allocate per entry in the set (default is 128n)
 */
function IntSet(size) {
    let INTSIZE = 128n; // bit length of integer
    if (size) {
        INTSIZE = size;
    }

    // returns a single bit
    const makeMask = function makeMask(x) {
        return 2n ** (x % INTSIZE);
    };
    const makeEntry = function makeEntry(x) {
        return x / INTSIZE;
    };

    this.entries = new Map();
    // this.keys = [];

    /**
     * Add an element to the set
     * @method
     * @param {bigint} x - the element to add
     */
    this.add = function addIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        const oldEntry = this.entries.get(entry);
        if (oldEntry) {
            this.entries.set(entry, oldEntry | mask);
        } else {
            this.entries.set(entry, mask);
        }
    };

    /**
     * Remove an element to the set
     * @method
     * @param {bigint} x - the element to remove
     */
    this.remove = function removeIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        const oldEntry = this.entries.get(entry);
        if (oldEntry) {
            const newEntry = oldEntry & ~mask;
            if (newEntry === 0n) {
                this.entries.delete(entry);
            } else {
                this.entries.set(entry, newEntry);
            }
        }
    };

    /**
     * Does the set contain this element?
     * @method
     * @param {bigint} x - the element to query
     * @returns {boolean}
     */
    this.contains = function containsIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        const oldEntry = this.entries.get(entry);
        if (oldEntry) {
            return (oldEntry | mask) === oldEntry;
        } else {
            return false;
        }
    };

    /**
     * Create a union of two sets
     * @method
     * @param {IntSet} xs - the other set
     * @returns {IntSet}
     */
    this.union = function unionIntSet(xs) {
        let ys = new Map(xs.entries); // cloned
        for (const [k, v] of this.entries) {
            const old = ys.get(k);
            if (old) {
                ys.set(k, old | v);
            } else {
                ys.set(k, v);
            }
        }
        let zs = new IntSet();
        zs.entries = ys;
        return zs;
    };

    /**
     * Find an intersection of two sets
     * @method
     * @param {IntSet} xs - the other set
     * @returns {IntSet}
     */
    this.intersection = function intersectionIntSet(xs) {
        let ys = new Map();
        let smaller;
        let larger;
        if (this.entries.size < xs.entries.size) {
            smaller = this.entries;
            larger = xs.entries;
        } else {
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
    };

    /**
     * Pull the symmetric difference of two sets
     * @method
     * @param {IntSet} xs - the other set
     * @returns {IntSet}
     */
    this.symmetricDifference = function symmetricDifferenceIntSet(xs) {
        let ys = new Map(xs.entries); // clone
        for (const [k, v] of this.entries) {
            const old = ys.get(k);
            if (old) {
                ys.set(k, old ^ v);
            } else {
                ys.set(k, v);
            }
        }
        let zs = new IntSet();
        zs.entries = ys;
        return zs;
    };

    /**
     * Subtract the content of one set from this one
     * @method
     * @param {IntSet} xs - the set that won't be present in the result
     * @returns {IntSet}
     */
    this.difference = function differenceIntSet(xs) {
        return this.intersection(this.symmetricDifference(xs));
    };

    /**
     * Turn the contents of the set into an unsorted array
     * @method
     * @returns {Array}
     */
    this.toArray = function toArrayIntSet() {
        let result = [];
        this.entries.forEach(function(entry, entryIndex) {
            for (let i = 0n; entry !== 0n; i++) {
                if ((entry & 1n) === 1n) { // if the bit is set
                    result.push(i + (entryIndex * INTSIZE));
                }
                entry = entry >> 1n;
            }
        });
        return result;
    };

    /**
     * Determine whether or not this set is empty
     * @returns {boolean}
     */
    this.isEmpty = function isEmptyIntSet() {
        let acc = 0n;
        for (const entry of this.entries.values()) {
            acc = acc | entry;
        }
        return acc === 0n;
    };
}

module.exports = IntSet;
