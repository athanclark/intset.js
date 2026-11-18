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

Contributing
---------------

Just make an issue, or file a pull request!
