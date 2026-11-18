/**
 * An IntSet is a collection of `bigint`s, which can be added or removed, and
 * new IntSets can be immutably created from one another through set-wise operations.
 */
export default class IntSet {
  private INTSIZE: bigint;
  private entries: Map<bigint, bigint>;
  private negEntries: Map<bigint, bigint>;

  /**
   * The entry point of an IntSet
   * @param size The number of bits stored per internal entry (default is 256n).
   *   Sets can only be combined with sets of the same size.
   */
  public constructor(size: bigint = 256n) {
    if (typeof size !== 'bigint' || size <= 0n) {
      throw new RangeError(`IntSet size must be a positive bigint, got ${String(size)}`);
    }
    this.INTSIZE = size;
    this.entries = new Map();
    this.negEntries = new Map();
  }

  private makeMask(x: bigint) {
    return 1n << ((x < 0n ? -x : x) % this.INTSIZE);
  }

  private makeEntry(x: bigint) {
    return (x < 0n ? -x : x) / this.INTSIZE;
  }

  /**
   * Add an element to the set
   * @param x The element to add
   */
  public add(x: bigint) {
    const mask = this.makeMask(x);
    const entry = this.makeEntry(x);
    const entries = x < 0n ? this.negEntries : this.entries;
    const oldEntry = entries.get(entry);
    entries.set(entry, oldEntry ? oldEntry | mask : mask);
  }

  /**
   * Remove an element from the set
   * @method
   * @param x The element to remove
   */
  public remove(x: bigint) {
    const mask = this.makeMask(x);
    const entry = this.makeEntry(x);
    const entries = x < 0n ? this.negEntries : this.entries;
    const oldEntry = entries.get(entry);
    if (oldEntry) {
      const newEntry = oldEntry & ~mask;
      if (newEntry === 0n) {
        entries.delete(entry);
      } else {
        entries.set(entry, newEntry);
      }
    }
  }

  /**
   * Does the set contain this element?
   * @param x The element to query
   */
  public contains(x: bigint): boolean {
    const mask = this.makeMask(x);
    const entry = this.makeEntry(x);
    const entries = x < 0n ? this.negEntries : this.entries;
    const oldEntry = entries.get(entry);
    return oldEntry !== undefined && (oldEntry & mask) !== 0n;
  }

  /**
   * Create an empty set with the same block size as this one.
   */
  private emptyLike(): IntSet {
    return new IntSet(this.INTSIZE);
  }

  /**
   * Ensure two sets use the same block size, since their internal entries are
   * only comparable when they do.
   */
  private assertCompatible(xs: IntSet) {
    if (this.INTSIZE !== xs.INTSIZE) {
      throw new RangeError(
        `Cannot combine IntSets with different block sizes (${this.INTSIZE} and ${xs.INTSIZE})`
      );
    }
  }

  /**
   * Create a union of two sets
   * @param xs The other set
   */
  public union(xs: IntSet): IntSet {
    this.assertCompatible(xs);
    const zs = this.emptyLike();
    zs.entries = unionEntries(this.entries, xs.entries);
    zs.negEntries = unionEntries(this.negEntries, xs.negEntries);
    return zs;
  }

  /**
   * Find an intersection of two sets
   * @param xs The other set
   */
  public intersection(xs: IntSet): IntSet {
    this.assertCompatible(xs);
    const zs = this.emptyLike();
    zs.entries = intersectEntries(this.entries, xs.entries);
    zs.negEntries = intersectEntries(this.negEntries, xs.negEntries);
    return zs;
  }

  /**
   * Pull the symmetric difference of two sets
   * @param xs The other set
   */
  public symmetricDifference(xs: IntSet): IntSet {
    this.assertCompatible(xs);
    const zs = this.emptyLike();
    zs.entries = xorEntries(this.entries, xs.entries);
    zs.negEntries = xorEntries(this.negEntries, xs.negEntries);
    return zs;
  }

  /**
   * Subtract the content of one set from this one
   * @param xs The set that won't be present in the result
   */
  public difference(xs: IntSet): IntSet {
    this.assertCompatible(xs);
    const zs = this.emptyLike();
    zs.entries = differenceEntries(this.entries, xs.entries);
    zs.negEntries = differenceEntries(this.negEntries, xs.negEntries);
    return zs;
  }

  /**
   * Turn the contents of the set into an unsorted array
   */
  public toArray(): bigint[] {
    const result: bigint[] = [];
    const INTSIZE: bigint = this.INTSIZE;
    this.entries.forEach(function(entry, entryIndex) {
      for (let i = 0n; entry !== 0n; i++) {
        if ((entry & 1n) === 1n) { // if the bit is set
          result.push(i + (entryIndex * INTSIZE));
        }
        entry = entry >> 1n;
      }
    });
    this.negEntries.forEach(function(entry, entryIndex) {
      for (let i = 0n; entry !== 0n; i++) {
        if ((entry & 1n) === 1n) { // if the bit is set
          result.push((i + (entryIndex * INTSIZE)) * -1n);
        }
        entry = entry >> 1n;
      }
    });
    return result;
  }

  /**
   * Determine whether or not this set is empty
   */
  public isEmpty(): boolean {
    return this.entries.size === 0 && this.negEntries.size === 0;
  }
}

// Entry-map helpers. Invariant: no map ever stores a 0n entry, so an entry's
// presence in a map means at least one element lives in that block.

function unionEntries(a: Map<bigint, bigint>, b: Map<bigint, bigint>): Map<bigint, bigint> {
  const result = new Map(b);
  for (const [k, v] of a) {
    const old = result.get(k);
    result.set(k, old === undefined ? v : old | v);
  }
  return result;
}

function intersectEntries(a: Map<bigint, bigint>, b: Map<bigint, bigint>): Map<bigint, bigint> {
  const [smaller, larger] = a.size < b.size ? [a, b] : [b, a];
  const result = new Map<bigint, bigint>();
  for (const [k, v] of smaller) {
    const other = larger.get(k);
    if (other !== undefined) {
      const both = v & other;
      if (both !== 0n) {
        result.set(k, both);
      }
    }
  }
  return result;
}

function xorEntries(a: Map<bigint, bigint>, b: Map<bigint, bigint>): Map<bigint, bigint> {
  const result = new Map(b);
  for (const [k, v] of a) {
    const old = result.get(k);
    if (old === undefined) {
      result.set(k, v);
    } else {
      const either = old ^ v;
      if (either === 0n) {
        result.delete(k);
      } else {
        result.set(k, either);
      }
    }
  }
  return result;
}

function differenceEntries(a: Map<bigint, bigint>, b: Map<bigint, bigint>): Map<bigint, bigint> {
  const result = new Map(a);
  for (const [k, v] of b) {
    const old = result.get(k);
    if (old !== undefined) {
      const remaining = old & ~v;
      if (remaining === 0n) {
        result.delete(k);
      } else {
        result.set(k, remaining);
      }
    }
  }
  return result;
}
