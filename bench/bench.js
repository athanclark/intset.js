const Benchmark = require('benchmark');
const RandomGenerator = require('@japan-d2/random-bigint').RandomGenerator;
const IntSet = require('../index.js');
// const process = require('process');

const random = new RandomGenerator({
    seed: 123456789n,
    limit: 2n ** 128n
});

const checkMemory = function checkMemory(e, b) {
    console.log(`checking memory of ${b}`);
    let o = {};
    o.xs = [];
    o.ys = [];
    const mid = 2n ** e;
    const max = 2n * mid;
    console.log('generating random values');
    for (let i = 0n; i < mid; i++) {
        o.xs.push(random.next());
    }
    for (let i = mid; i < max; i++) {
        o.ys.push(random.next());
    }

    console.log('adding random values to sets');
    let set1 = new IntSet(b);
    for (const x of o.xs) {
        set1.add(x);
    }
    let set2 = new IntSet(b);
    for (const y of o.ys) {
        set2.add(y);
    }

    delete o.xs;
    delete o.ys;

    console.log('running suite');
    gc();
    set1.union(set2);
    console.log(`using bit depth ${b}`, process.memoryUsage());
    gc();
};

const runSuite = (e) => {
    const suite = new Benchmark.Suite;

    let xs = [];
    let ys = [];
    const mid = 2n ** e;
    const max = 2n * mid;
    console.log('generating random values');
    for (let i = 0n; i < mid; i++) {
        xs.push(random.next());
    }
    for (let i = mid; i < max; i++) {
        ys.push(random.next());
    }

    console.log('adding random values to sets');
    let set1_32 = new IntSet(32n);
    for (const x of xs) {
        set1_32.add(x);
    }
    let set2_32 = new IntSet(32n);
    for (const y of ys) {
        set2_32.add(y);
    }
    let set1_64 = new IntSet(64n);
    for (const x of xs) {
        set1_64.add(x);
    }
    let set2_64 = new IntSet(64n);
    for (const y of ys) {
        set2_64.add(y);
    }
    let set1_128 = new IntSet(128n);
    for (const x of xs) {
        set1_128.add(x);
    }
    let set2_128 = new IntSet(128n);
    for (const y of ys) {
        set2_128.add(y);
    }
    let set1_256 = new IntSet(256n);
    for (const x of xs) {
        set1_256.add(x);
    }
    let set2_256 = new IntSet(256n);
    for (const y of ys) {
        set2_256.add(y);
    }
    let set1_512 = new IntSet(512n);
    for (const x of xs) {
        set1_512.add(x);
    }
    let set2_512 = new IntSet(512n);
    for (const y of ys) {
        set2_512.add(y);
    }

    console.log('running suite');
    suite.add(`union 2^${e} #32`, function() {
        set1_32.union(set2_32);
    })
    .add(`union 2^${e} #64`, function() {
        set1_64.union(set2_64);
    })
    .add(`union 2^${e} #128`, function() {
        set1_128.union(set2_128);
    })
    .add(`union 2^${e} #256`, function() {
        set1_256.union(set2_256);
    })
    .add(`union 2^${e} #512`, function() {
        set1_512.union(set2_512);
    })
    .on('cycle', function(event) {
        console.log(String(event.target));
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));

        checkMemory(16n, 32n);
        checkMemory(16n, 64n);
        checkMemory(16n, 128n);
        checkMemory(16n, 256n);
        checkMemory(16n, 512n);
    })
    // run async
    .run({ 'async': true });
};

// runSuite(8n);
runSuite(16n);
