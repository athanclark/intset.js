// Should be able to store (0, size]
module.exports = function IntSet() {
    const INTSIZE = 64n; // bit length of integer

    const makeMask = function makeMask(x) {
        return 2n ** (x % INTSIZE);
    };
    const makeEntry = function makeEntry(x) {
        return x / INTSIZE;
    };

    this.entries = [];
    this.add = function addIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        if (entry >= this.entries.length) {
            // right pad the array
            this.entries = this.entries.concat(
                Array((Number(entry) - this.entries.length) + 1).fill(0n)
            );
        }
        this.entries[entry] = this.entries[entry] | mask;
    };
    this.remove = function removeIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        if (entry < this.entries.length) {
            this.entries[entry] = this.entries[entry] & mask;
            // remove trailing 0's
            this.entries = this.entries.reduceRight(
                (acc, x) => x === 0n && !acc.hasContent
                    ? acc
                    : { entries: acc.entries.concat([x]), hasContent: true },
                { entries: [], hasContent: false }
            ).entries;
        }
    };
    this.contains = function containsIntSet(x) {
        const mask = makeMask(x);
        const entry = makeEntry(x);
        if (entry >= this.entries.length) {
            return false;
        } else {
            return (this.entries[entry] | mask) === this.entries[entry];
        }
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
        let zs = new IntSet();
        zs.entries = ys;
        return zs;
    };
    this.intersection = function intersectionIntSet(xs) {
        let ys = [];
        for (let i = 0; i < Math.min(this.entries.length, xs.entries.length); i++) {
            ys.push(this.entries[i] & xs.entries[i]);
        }
        let zs = new IntSet();
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
        let zs = new IntSet();
        zs.entries = ys;
        return zs;
    };
    this.difference = function differenceIntSet(xs) {
        return this.intersection(this.symmetricDifference(xs));
    };
    this.toArray = function toArrayIntSet() {
        let result = [];
        this.entries.forEach(function(entry, entryIndex) {
            for (let i = 0n; entry !== 0n; i++) {
                if (entry & 1n === 1n) { // if the bit is set
                    result.push(i + (entryIndex * INTSIZE));
                }
                entry = entry >> 1n;
            }
        });
        return result;
    };
    this.isEmpty = function isEmptyIntSet() {
        let acc = 0n;
        for (const entry of this.entries) {
            acc = acc | entry;
        }
        return acc === 0n;
    };
};
