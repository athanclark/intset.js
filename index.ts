export default class IntSet {
  private INTSIZE: bigint;
  private entries: Map<bigint, bigint>;
  
  public constructor(size?: bigint) {
    this.INTSIZE = size || 256n;
    this.entries = new Map();
  }

  private makeMask(x: bigint) {
    return 2n ** (x % this.INTSIZE);
  }

  private makeEntry(x: bigint) {
    return x / this.INTSIZE;
  }

  public add(x: bigint) {
    const mask = this.makeMask(x);
    const entry = this.makeEntry(x);
    const oldEntry = this.entries.get(entry);
    this.entries.set(entry, oldEntry ? oldEntry | mask : mask);
  }

  public remove(x: bigint) {
    const mask = this.makeMask(x);
    const entry = this.makeEntry(x);
    const oldEntry = this.entries.get(entry);
    if (oldEntry) {
      const newEntry = oldEntry & ~mask;
      if (newEntry === 0n) {
        this.entries.delete(entry);
      } else {
        this.entries.set(entry, newEntry);
      }
    }
  }

  public contains(x: bigint): boolean {
    const mask = this.makeMask(x);
    const entry = this.makeEntry(x);
    const oldEntry = this.entries.get(entry);
    if (oldEntry) {
      return (oldEntry | mask) === oldEntry;
    } else {
      return false;
    }
  }

  public union(xs: IntSet): IntSet {
    const ys = new Map(xs.entries); // cloned
    for (const [k, v] of this.entries) {
      const old = ys.get(k);
      ys.set(k, old ? old | v : v);
    }
    const zs = new IntSet();
    zs.entries = ys;
    return zs;
  }

  public intersection(xs: IntSet): IntSet {
    const ys = new Map();
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
        ys.set(k, v & v_);
      }
    }
    let zs = new IntSet();
    zs.entries = ys;
    return zs;
  }

  public symmetricDifference(xs: IntSet): IntSet {
    let ys = new Map(xs.entries); // clone
    for (const [k, v] of this.entries) {
      const old = ys.get(k);
      ys.set(k, old ? old ^ v : v);
    }
    let zs = new IntSet();
    zs.entries = ys;
    return zs;
  }

  public difference(xs: IntSet): IntSet {
    return this.intersection(this.symmetricDifference(xs));
  }

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
    return result;
  }

  public isEmpty(): boolean {
    let acc = 0n;
    for (const entry of this.entries.values()) {
      acc = acc | entry;
    }
    return acc === 0n;
  }
}
