// Should be able to store (0, size]
function IntSet(size) {
    const INTSIZE = 30; // bit length of integer

    const makeMask = function makeMask(x) {
        return 2 ** (x % INTSIZE);
    };
    const makeEntry = function makeEntry(x) {
        return Math.floor(x / INTSIZE);
    };

    this.size = size;
    this.entries = Array(Math.ceil(size / INTSIZE)).fill(0);
    this.add = function addIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        this.entries[entry] = this.entries[entry] | mask;
    };
    this.remove = function removeIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        this.entries[entry] = this.entries[entry] & mask;
    };
    this.contains = function containsIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        return (this.entries[entry] | mask) === this.entries[entry];
    };
    this.union = function unionIntSet(xs) {
        let ys = [];
        let i = 0;
        for (; i < Math.min(this.entries.length, xs.entries.length); i++) {
            ys.push(this.entries[i] | xs.entries[i]);
        }
        if (this.entries.length > xs.entries.length) {
            ys = ys.concat(this.entries.slice(i));
        } else if (this.entries.length < xs.entries.length) {
            ys = ys.concat(xs.entries.slice(i));
        }
        let zs = new IntSet(Math.max(this.size, xs.size));
        zs.entries = ys;
        return zs;
    };
    this.intersection = function intersectionIntSet(xs) {
        let ys = [];
        for (let i = 0; i < Math.min(this.entries.length, xs.entries.length); i++) {
            ys.push(this.entries[i] & xs.entries[i]);
        }
        let zs = new IntSet(Math.min(this.size, xs.size));
        zs.entries = ys;
        return zs;
    };
    this.symmetricDifference = function symmetricDifferenceIntSet(xs) {
        let ys = [];
        let i = 0;
        for (; i < Math.min(this.entries.length, xs.entries.length); i++) {
            ys.push(this.entries[i] ^ xs.entries[i]);
        }
        if (this.entries.length > xs.entries.length) {
            ys = ys.concat(this.entries.slice(i));
        } else if (this.entries.length < xs.entries.length) {
            ys = ys.concat(xs.entries.slice(i));
        }
        let zs = new IntSet(Math.max(this.size, xs.size));
        zs.entries = ys;
        return zs;
    };
    this.difference = function differenceIntSet(xs) {
        return this.intersection(this.symmetricDifference(xs));
    };
    this.toArray = function toArrayIntSet() {
        let result = [];
        this.entries.forEach(function(entry, entryIndex) {
            for (let i = 0; entry !== 0; i++) {
                if (entry & 1 === 1) {
                    result.push(i + (entryIndex * INTSIZE));
                }
                entry = entry >> 1;
            }
        });
        return result;
    };
    this.isEmpty = function isEmptyIntSet() {
        let acc = 0;
        for (const entry of this.entries) {
            acc = acc | entry;
        }
        return acc === 0;
    };
}

exports = IntSet;
