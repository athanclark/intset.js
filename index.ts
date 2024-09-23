export default class IntSet {
  private INTSIZE: bigint;
  private entries: Map<bigint, bigint>;
  private negEntries: Map<bigint, bigint>;

  /**
   * The entry point of an IntSet
   * @param size The number of bytes to allocate per entry in the set (default is 256n)
   */ 
  public constructor(size?: bigint) {
    this.INTSIZE = size || 256n;
    this.entries = new Map();
    this.negEntries = new Map();
  }

  private makeMask(x: bigint) {
    return 2n ** ((x < 0n ? -x : x) % this.INTSIZE);
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
   * Remove an element to the set
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
    if (oldEntry) {
      return (oldEntry | mask) === oldEntry;
    } else {
      return false;
    }
  }

  /**
   * Create a union of two sets
   * @param xs The other set
   */
  public union(xs: IntSet): IntSet {
    const newEntries = new Map(xs.entries); // cloned
    for (const [k, v] of this.entries) {
      const old = newEntries.get(k);
      newEntries.set(k, old ? old | v : v);
    }
    const newNegEntries = new Map(xs.negEntries); // cloned
    for (const [k, v] of this.negEntries) {
      const old = newNegEntries.get(k);
      newNegEntries.set(k, old ? old | v : v);
    }
    const zs = new IntSet();
    zs.entries = newEntries;
    zs.negEntries = newNegEntries;
    return zs;
  }

  /**
   * Find an intersection of two sets
   * @param xs The other set
   */
  public intersection(xs: IntSet): IntSet {
    let zs = new IntSet();
    (() => {
      const newEntries = new Map();
      let smaller;
      let larger;
      if (this.entries.size < xs.entries.size) {
        smaller = this.entries;
        larger = xs.entries;
      } else {
        smaller = xs.entries;
        larger = this.entries;
      }
      for (const [k, v] of smaller) {
        const v_ = larger.get(k);
        if (v_) {
          newEntries.set(k, v & v_);
        }
      }
      zs.entries = newEntries;
    })();
    (() => {
      const newNegEntries = new Map();
      let smaller;
      let larger;
      if (this.negEntries.size < xs.negEntries.size) {
        smaller = this.negEntries;
        larger = xs.negEntries;
      } else {
        smaller = xs.negEntries;
        larger = this.negEntries;
      }
      for (const [k, v] of smaller) {
        const v_ = larger.get(k);
        if (v_) {
          newNegEntries.set(k, v & v_);
        }
      }
      zs.negEntries = newNegEntries;
    })();
    return zs;
  }

  /**
   * Pull the symmetric difference of two sets
   * @param xs The other set
   */
  public symmetricDifference(xs: IntSet): IntSet {
    let zs = new IntSet();
    let newEntries = new Map(xs.entries); // clone
    for (const [k, v] of this.entries) {
      const old = newEntries.get(k);
      newEntries.set(k, old ? old ^ v : v);
    }
    zs.entries = newEntries;
    let newNegEntries = new Map(xs.negEntries); // clone
    for (const [k, v] of this.negEntries) {
      const old = newNegEntries.get(k);
      newNegEntries.set(k, old ? old ^ v : v);
    }
    zs.negEntries = newNegEntries;
    return zs;
  }

  /**
   * Subtract the content of one set from this one
   * @param xs The set that won't be present in the result
   */
  public difference(xs: IntSet): IntSet {
    let zs = new IntSet();
    let newEntries = new Map(this.entries);
    for (const [k, v] of xs.entries) {
      const old = newEntries.get(k);
      if (old) {
        const newEntry = old & ~v;
        if (newEntry === 0n) {
          newEntries.delete(k);
        } else {
          newEntries.set(k, newEntry);
        }
      }
    }
    zs.entries = newEntries;
    let newNegEntries = new Map(this.negEntries);
    for (const [k, v] of xs.negEntries) {
      const old = newNegEntries.get(k);
      if (old) {
        const newEntry = old & ~v;
        if (newEntry === 0n) {
          newNegEntries.delete(k);
        } else {
          newNegEntries.set(k, newEntry);
        }
      }
    }
    zs.negEntries = newNegEntries;
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
    let acc = 0n;
    for (const entry of this.entries.values()) {
      acc = acc | entry;
    }
    for (const entry of this.negEntries.values()) {
      acc = acc | entry;
    }
    return acc === 0n;
  }
}
