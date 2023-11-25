const Benchmark = require('benchmark');
const RandomGenerator = require('@japan-d2/random-bigint').RandomGenerator;
const IntSet = require('../index.js');

const MIN_N = 5n;
const MAX_N = 15n;

// // [(element_bit_size, max_bit_size, n, ops/sec)]
// let timingResults = [];
// // [(element_bit_size, max_bit_size, n, heap_used, total_memory)]
// let memoryResults = [];
// {element_bit_size: {max_bit_size: {n: [ops/sec, heap_used, total_memory]}}}
let results = {};

const runSuite = ({elements_bit_size, max_bit_size}, onComplete) => {
    console.log(`running suite with 2^${elements_bit_size} elements, 2^${max_bit_size} max values`);
    const seed = BigInt(Math.floor(Math.random() * 1000000000));
    const random = new RandomGenerator({
        seed,
        limit: 2n ** max_bit_size
    });

    const suite = new Benchmark.Suite;
    const elements = 2n ** elements_bit_size;

    let xs = [];
    let ys = [];
    for (let i = 0n; i < elements; i++) {
        xs.push(random.next());
    }
    for (let i = 0n; i < elements; i++) {
        ys.push(random.next());
    }

    const addTest = function addTest(i_n) {
        const n = 2n ** i_n;
        let set1 = new IntSet(n);
        for (const x of xs) {
            set1.add(x);
        }
        let set2 = new IntSet(n);
        for (const y of ys) {
            set2.add(y);
        }
        suite.add(`${i_n}`, function() {
            set1.union(set2);
        });
    };

    for (let i = MIN_N; i <= MAX_N; i++) {
        addTest(i);
    }

    suite.on('cycle', function(event) {
        // timingResults.push([
        //     `${elements_bit_size}`,
        //     `${max_bit_size}`,
        //     event.target.name,
        //     event.target.hz
        // ]);
        results[`${elements_bit_size}`] ||= {};
        results[`${elements_bit_size}`][`${max_bit_size}`] ||= {};
        results[`${elements_bit_size}`][`${max_bit_size}`][event.target.name] = [event.target.hz];
    })
    .on('complete', function() {
        console.log('Fastest is ' + this.filter('fastest').map('name'));

        const checkMemory = function checkMemory(i_n) {
            const n = 2n ** i_n;
            let o = {};
            o.xs = [];
            o.ys = [];
            for (let i = 0n; i < elements; i++) {
                o.xs.push(random.next());
            }
            for (let i = 0n; i < elements; i++) {
                o.ys.push(random.next());
            }

            let set1 = new IntSet(n);
            for (const x of o.xs) {
                set1.add(x);
            }
            let set2 = new IntSet(n);
            for (const y of o.ys) {
                set2.add(y);
            }

            delete o.xs;
            delete o.ys;

            gc();
            const set3 = set1.union(set2);
            // memoryResults.push([
            //     `${elements_bit_size}`,
            //     `${max_bit_size}`,
            //     `${n}`,
            //     process.memoryUsage().heapUsed,
            //     `${BigInt(set3.entries.size) * n}`
            // ]);
            console.log(results);
            results[`${elements_bit_size}`][`${max_bit_size}`][`${i_n}`].push(process.memoryUsage().heapUsed);
            results[`${elements_bit_size}`][`${max_bit_size}`][`${i_n}`].push(`${BigInt(set3.entries.size) * n}`);
            gc();
        };

        for (let i = MIN_N; i <= MAX_N; i++) {
            checkMemory(i);
        }

        onComplete();
    })
        .run({ 'async': true });
};

let current_bit_size = 8n;
const MAX_BIT_SIZE = 32n;
const BIT_SIZE_INCREMENT = 4n;

const fs = require('fs');

const callRunSuite = function callRunSuite() {
    if (current_bit_size <= MAX_BIT_SIZE) {
        const last_bit_size = current_bit_size;
        current_bit_size += BIT_SIZE_INCREMENT;
        runSuite({elements_bit_size: 16n, max_bit_size: last_bit_size}, callRunSuite);
    } else {
        // console.log('timing results', timingResults);
        // console.log('memory results', memoryResults);
        // fs.writeFileSync('./timingResults.csv', timingResults.reduce((acc, row) => acc + toCSVRow(row), ''));
        // fs.writeFileSync('./memoryResults.csv', memoryResults.reduce((acc, row) => acc + toCSVRow(row), ''));
        console.log(results);
        let resultsArr = [];
        for (const e in results) {
            for (const m in results[e]) {
                for (const n in results[e][m]) {
                    resultsArr.push([e,m,n].concat(results[e][m][n]));
                }
            }
        }
        fs.writeFileSync('./bench/results.csv', "elements_bit_size,max_bit_size,n,ops_per_sec,heap_used,total_size\n" + resultsArr.map(toCSVRow).join("\n"));
        fs.writeFileSync('./bench/results.json', JSON.stringify(results));
    }
};

callRunSuite();


function toCSVRow(xs) {
    return xs.map((x) => x.toString()).join(',');
}
