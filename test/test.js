const fc = require('fast-check');
const assert = require('assert');

const IntSet = require('../index');



describe('properties', () => {
    let set = new IntSet();
    it('contains after add should be true', () => {
        fc.assert(fc.property(fc.bigInt({ min: 0n, max: 2n ** 31n }), (x) => {
            set.add(x);
            return set.contains(x);
        }));
    });
});
