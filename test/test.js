import fc from 'fast-check';
import assert from 'assert';
import _ from 'lodash';

import IntSet from '../index.js';


describe('unit tests', () => {
    let set = new IntSet();
    it('should contain 0n after add', () => {
        set.add(0n);
        assert(set.contains(0n));
    });
    it('should not contain 0n after removal', () => {
        set.remove(0n);
        assert(!set.contains(0n));
    });
    it('should be capable of making an array', () => {
        set.add(0n);
        assert.deepStrictEqual(set.toArray(), [0n]);
    });
});

const value = (e) => fc.bigInt({ min: 0n, max: 2n ** e });
const setInput = (e) => fc.array(value(e));
function mkSet(xs) {
    let set = new IntSet();
    for (const x of xs) {
        set.add(x);
    }
    return set;
}
const fcAssert = (p) => fc.assert(p, { numRuns: 10000, timeout: 3000 });

const properties = (e) => {
    describe(`properties with max size of 2^${e}`, () => {
        it('contains after add should be true', () => {
            fcAssert(fc.property(setInput(e), value(e), (xs, x) => {
                assert(typeof x === 'bigint');
                assert(Array.isArray(xs));
                let set = mkSet(xs);
                set.add(x);
                return set.contains(x);
            }));
        });
        it('contains after remove should be false', () => {
            fcAssert(fc.property(setInput(e), value(e), (xs, x) => {
                let set = mkSet(xs);
                set.remove(x);
                return !set.contains(x);
            }));
        });
        it('contains after remove after add should be false', () => {
            fcAssert(fc.property(setInput(e), value(e), (xs, x) => {
                let set = mkSet(xs);
                set.add(x);
                set.remove(x);
                return !set.contains(x);
            }));
        });
        it('toArray should be identical to input', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set = mkSet(xs);
                const ys = set.toArray().sort();
                const zs = [...new Set(xs)].sort();
                let result = true;
                for (let i = 0; i < ys.length && result; i++) {
                    result = ys[i] === zs[i];
                }
                return result;
            }));
        });
        it('union left identity', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set1 = mkSet(xs);
                let set2 = new IntSet();
                let r1 = set1.union(set2).toArray();
                let r2 = set1.toArray();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('union right identity', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set1 = new IntSet();
                let set2 = mkSet(xs);
                let r1 = set1.union(set2).toArray();
                let r2 = set2.toArray();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('union commutativity', () => {
            fcAssert(fc.property(setInput(e), setInput(e), (xs, ys) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let r1 = set1.union(set2).toArray().sort();
                let r2 = set2.union(set1).toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('union associativity', () => {
            fcAssert(fc.property(setInput(e), setInput(e), setInput(e), (xs, ys, zs) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let set3 = mkSet(zs);
                let r1 = set1.union(set2.union(set3)).toArray().sort();
                let r2 = set1.union(set2).union(set3).toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('intersection identity via automorphism', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(xs);
                let r1 = set1.intersection(set2).toArray();
                let r2 = set1.toArray();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('intersection with empty is empty', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set1 = mkSet(xs);
                let set2 = new IntSet();
                return set1.intersection(set2).isEmpty();
            }));
        });
        it('intersection commutativity', () => {
            fcAssert(fc.property(setInput(e), setInput(e), (xs, ys) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let r1 = set1.intersection(set2).toArray().sort();
                let r2 = set2.intersection(set1).toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('intersection associativity', () => {
            fcAssert(fc.property(setInput(e), setInput(e), setInput(e), (xs, ys, zs) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let set3 = mkSet(zs);
                let r1 = set1.intersection(set2.intersection(set3)).toArray().sort();
                let r2 = set1.intersection(set2).intersection(set3).toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('symmetricDifference left identity', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set1 = mkSet(xs);
                let set2 = new IntSet();
                let r1 = set1.symmetricDifference(set2).toArray();
                let r2 = set1.toArray();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('symmetricDifference right identity', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set1 = new IntSet();
                let set2 = mkSet(xs);
                let r1 = set1.symmetricDifference(set2).toArray();
                let r2 = set2.toArray();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('symmetricDifference commutativity', () => {
            fcAssert(fc.property(setInput(e), setInput(e), (xs, ys) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let r1 = set1.symmetricDifference(set2).toArray().sort();
                let r2 = set2.symmetricDifference(set1).toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('symmetricDifference associativity', () => {
            fcAssert(fc.property(setInput(e), setInput(e), setInput(e), (xs, ys, zs) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let set3 = mkSet(zs);
                let r1 = set1.symmetricDifference(set2.symmetricDifference(set3)).toArray().sort();
                let r2 = set1.symmetricDifference(set2).symmetricDifference(set3).toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('symmetricDifference automorphism is empty', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set = mkSet(xs);
                return set.symmetricDifference(set).isEmpty();
            }));
        });
        it('difference idempotency', () => {
            fcAssert(fc.property(setInput(e), setInput(e), (xs, ys) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let r1 = set1.difference(set2).toArray().sort();
                let r2 = set1.difference(set2).difference(set2).toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
        it('difference automorphism is empty', () => {
            fcAssert(fc.property(setInput(e), (xs) => {
                let set = mkSet(xs);
                return set.difference(set).isEmpty();
            }));
        });
        it('union of intersection and difference is identity', () => {
            fcAssert(fc.property(setInput(e), setInput(e), (xs, ys) => {
                let set1 = mkSet(xs);
                let set2 = mkSet(ys);
                let r1 = set1.intersection(set2).union(set1.difference(set2)).toArray().sort();
                let r2 = set1.toArray().sort();
                let result = true;
                for (let i = 0; i < r1.length && result; i++) {
                    result = r1[i] === r2[i];
                }
                return result;
            }));
        });
    });
};

properties(10n);
properties(64n);
properties(128n);
properties(256n);
