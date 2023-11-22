IntSet.js
===========

This library allows for an _"efficient"_ storage mechanism for positive `BigInt` values in
JavaScript. It allows for basic set-theoretic operations, like union and intersection as well.

Usage
------

You can create a new set pretty easily:

```js
const IntSet = require('intset');

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

You can also do typical set operations on them as well:

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
actually take up `n / m` numbers of space, where `m` represents the amount of storage used
per number. `m` defaults to `64` bits, as this has (through experimentation) seemed to be
the fastest, but can be customized through an argument to `new IntSet(customM)`.

This means that unions, intersections, and the like are implemented through bitwise
operators on each masked number, rather than storing each number individually.

Contributing
---------------

Just make an issue, or file a pull request!
