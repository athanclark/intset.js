IntSet.js
===========

This library allows for an _"efficient"_ storage mechanism for `BigInt` values (positive and negative) in
JavaScript. It allows for basic set-theoretic operations, like union and intersection as well.

Usage
------

You can create a new set pretty easily. The package is an ES module:

```js
import IntSet from 'intset';

let set = new IntSet();
```

You can add elements to a set straightforward as well:

```js
set.add(5n);
```

And remove them the same:

```js
set.remove(5n);
```

Check for presence:

```js
const is5inSet = set.contains(5n);
```

Or see if it's empty:

```js
const isSetEmpty = set.isEmpty();
```

You can also do typical set operations on them as well. These return new sets and
leave the originals untouched:

```js
const set6 = set1
    .union(set2)
    .intersection(set3)
    .symmetricDifference(set4)
    .difference(set5);
```

Implementation
-----------------

Internally, the set is a series of BigInt's, where each one uses bit masking to determine the
presence or lack thereof of other numbers. This allows a set that represents `n` numbers to
actually take up `n / m` numbers of space, where `m` is the number of bits stored per
internal entry. `m` defaults to `256n`, but can be customized through an argument to
`new IntSet(customM)` (it must be a positive `bigint`, e.g. `new IntSet(64n)`).

Set operations return a new set with the same block size. Combining two sets with
different block sizes throws a `RangeError`.

This means that unions, intersections, and the like are implemented through bitwise
operators on each masked number, rather than storing each number individually.

Performance
-----------

IntSet is fast at combining sets (`union`, `intersection`, `difference`) and compact
when the stored numbers are **close together**. It is slower than the built-in `Set` at
adding, looking up, and listing individual values, and it loses everywhere when the
numbers are **spread far apart**, because then nearly every value needs its own block.

Rough guide, compared with a built-in `Set<number>`:

| Your data | Set operations | Add / lookup | Memory |
|---|---|---|---|
| Dense (values close together) | **30–130× faster** with the default `256n` or larger, ~6× with `64n` | 3–5× slower | **10–60× smaller** |
| Medium spread | 1–2.5× faster with `new IntSet(1024n)`, slower with smaller blocks | ~5× slower | ~1.3× smaller with `1024n`, larger with smaller blocks |
| Sparse (values far apart) | 2–6× slower | 2–4× slower | 1.4–3× larger |

Listing the contents with `toArray()` is 10–100× slower than spreading a `Set`, because
every value has to be turned back into a `bigint`. Larger block sizes help dense data and
hurt sparse data. If your values fit safely in a
JavaScript `number` and you mostly add and look up single values, a plain `Set` is the
better choice.

### Results

Median time in milliseconds (lower is better) for 100,000 values per set, measured on
Node v26.13.0. The built-in `Set` uses its native `union`, `intersection` and
`difference` methods. Memory is the heap used by one set. These are from a single run on
one machine, so treat them as rough sizes, not exact figures.

**Dense (100k values in 0..200k)**

| | build | 100k lookups | union | intersection | difference | toArray | memory (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `Set<number>` | 9.37 | 4.57 | 6.50 | 6.41 | 7.83 | 0.60 | 2.50 |
| `Set<bigint>` | 18.53 | 17.43 | 17.49 | 13.17 | 18.32 | 0.68 | 2.50 |
| `IntSet(64n)` | 30.02 | 25.66 | 1.09 | 0.92 | 1.05 | 7.53 | 0.25 |
| `IntSet(256n)` | 31.57 | 25.28 | 0.19 | 0.14 | 0.32 | 7.98 | 0.08 |
| `IntSet(1024n)` | 29.00 | 24.87 | 0.08 | 0.05 | 0.07 | 6.20 | 0.04 |

**Medium spread (100k values in 0..10M)**

| | build | 100k lookups | union | intersection | difference | toArray | memory (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `Set<number>` | 9.55 | 7.15 | 12.53 | 4.50 | 6.50 | 0.40 | 2.50 |
| `Set<bigint>` | 16.20 | 15.11 | 24.49 | 13.77 | 19.16 | 0.38 | 2.50 |
| `IntSet(64n)` | 52.80 | 31.60 | 47.48 | 17.73 | 41.69 | 31.35 | 6.85 |
| `IntSet(256n)` | 55.16 | 38.15 | 19.07 | 7.05 | 23.75 | 41.53 | 4.01 |
| `IntSet(1024n)` | 47.69 | 38.56 | 5.14 | 2.50 | 6.17 | 43.38 | 1.92 |

**Sparse (100k values in 0..2^40)**

| | build | 100k lookups | union | intersection | difference | toArray | memory (MB) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `Set<number>` | 13.89 | 13.68 | 20.90 | 8.76 | 9.58 | 0.39 | 4.03 |
| `Set<bigint>` | 20.35 | 28.51 | 30.85 | 17.35 | 21.17 | 0.57 | 2.50 |
| `IntSet(64n)` | 36.65 | 29.23 | 113.82 | 44.46 | 42.66 | 28.69 | 5.79 |
| `IntSet(256n)` | 34.82 | 28.97 | 72.10 | 16.43 | 43.28 | 30.56 | 5.79 |
| `IntSet(1024n)` | 58.45 | 43.49 | 83.99 | 26.74 | 60.43 | 148.21 | 12.07 |

To reproduce, run `npm run bench`. It prints these tables and writes `bench/results.json`.

Contributing
---------------

Just make an issue, or file a pull request!
