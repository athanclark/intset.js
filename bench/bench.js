// Head-to-head benchmark: IntSet vs the built-in Set (number and bigint keys).
//
// Run with: npm run bench
// Writes bench/results.json and prints Markdown tables (median ms; lower is better).
import { writeFileSync } from 'node:fs';
import IntSet from '../index.js';

if (typeof global.gc !== 'function') {
  console.error('Run with node --expose-gc (npm run bench does this for you).');
  process.exit(1);
}

const N = 100_000;
let sink = 0;

function rng(seed) { // deterministic mulberry32
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gen = (range, seed) => {
  const r = rng(seed);
  return Array.from({ length: N }, () => Math.floor(r() * range));
};

function time(fn) {
  for (let i = 0; i < 3; i++) sink += fn() ? 1 : 0; // warm-up
  const samples = [];
  const deadline = performance.now() + 400;
  while (samples.length < 5 || (performance.now() < deadline && samples.length < 200)) {
    const t0 = performance.now();
    sink += fn() ? 1 : 0;
    samples.push(performance.now() - t0);
  }
  samples.sort((a, b) => a - b);
  return samples[samples.length >> 1]; // median ms
}

function heapOf(build) {
  global.gc(); global.gc();
  const before = process.memoryUsage().heapUsed;
  const keep = build();
  global.gc(); global.gc();
  const after = process.memoryUsage().heapUsed;
  sink += keep ? 1 : 0;
  return (after - before) / 1024 / 1024;
}

const impls = {
  'Set<number>': {
    conv: (xs) => xs,
    build: (xs) => new Set(xs),
    has: (s, x) => s.has(x),
    union: (a, b) => a.union(b),
    intersection: (a, b) => a.intersection(b),
    difference: (a, b) => a.difference(b),
    toArray: (s) => [...s],
  },
  'Set<bigint>': {
    conv: (xs) => xs.map(BigInt),
    build: (xs) => new Set(xs),
    has: (s, x) => s.has(x),
    union: (a, b) => a.union(b),
    intersection: (a, b) => a.intersection(b),
    difference: (a, b) => a.difference(b),
    toArray: (s) => [...s],
  },
};
for (const size of [64n, 256n, 1024n]) {
  impls[`IntSet(${size}n)`] = {
    conv: (xs) => xs.map(BigInt),
    build: (xs) => { const s = new IntSet(size); for (const x of xs) s.add(x); return s; },
    has: (s, x) => s.contains(x),
    union: (a, b) => a.union(b),
    intersection: (a, b) => a.intersection(b),
    difference: (a, b) => a.difference(b),
    toArray: (s) => s.toArray(),
  };
}

const scenarios = [
  ['dense   (100k values in 0..200k)', 200_000],
  ['medium  (100k values in 0..10M)', 10_000_000],
  ['sparse  (100k values in 0..2^40)', 2 ** 40],
];

const rows = [];
for (const [label, range] of scenarios) {
  const xsRaw = gen(range, 1), ysRaw = gen(range, 2), probesRaw = gen(range, 3);
  for (const [name, im] of Object.entries(impls)) {
    const xs = im.conv(xsRaw), ys = im.conv(ysRaw), probes = im.conv(probesRaw);
    const a = im.build(xs), b = im.build(ys);
    const row = { scenario: label, impl: name };
    row.build = time(() => im.build(xs));
    row.has100k = time(() => { let c = 0; for (const p of probes) if (im.has(a, p)) c++; return c; });
    row.union = time(() => im.union(a, b));
    row.intersection = time(() => im.intersection(a, b));
    row.difference = time(() => im.difference(a, b));
    row.toArray = time(() => im.toArray(a));
    row.heapMB = heapOf(() => im.build(xs));
    rows.push(row);
    process.stderr.write(`done ${label} / ${name}\n`);
  }
}
writeFileSync(new URL('./results.json', import.meta.url), JSON.stringify({
  node: process.version,
  date: new Date().toISOString(),
  n: N,
  rows,
}, null, 2) + '\n');

const cols = ['build', 'has100k', 'union', 'intersection', 'difference', 'toArray', 'heapMB'];
const header = ['build', '100k lookups', 'union', 'intersection', 'difference', 'toArray', 'memory (MB)'];
let current = '';
for (const r of rows) {
  if (r.scenario !== current) {
    current = r.scenario;
    console.log(`\n**${current.replace(/\s+/g, ' ')}**\n`);
    console.log(`| | ${header.join(' | ')} |`);
    console.log(`|---|${header.map(() => '---:').join('|')}|`);
  }
  console.log(`| ${r.impl} | ${cols.map((c) => r[c].toFixed(2)).join(' | ')} |`);
}
if (sink < 0) console.log(sink);
