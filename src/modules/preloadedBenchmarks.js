/* ============================================
   Preloaded Benchmark Algorithms
   ============================================ */

export const preloadedBenchmarks = [
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    icon: '🫧',
    description: 'Classic O(n²) sorting. Tests basic iteration + swap performance with nested loops.',
    inputSize: 10000,
    iterations: 20,
    warmup: 3,
    code: `// Bubble Sort — O(n²)
// data: array of random integers, size: array length
for (let i = 0; i < size - 1; i++) {
  for (let j = 0; j < size - i - 1; j++) {
    if (data[j] > data[j + 1]) {
      let temp = data[j];
      data[j] = data[j + 1];
      data[j + 1] = temp;
    }
  }
}`,
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    description: 'Efficient O(n log n) sorting. Tests recursion, partitioning, and cache performance.',
    inputSize: 500000,
    iterations: 30,
    warmup: 5,
    code: `// Quick Sort — O(n log n)
function quickSort(arr, lo, hi) {
  if (lo >= hi) return;
  let pivot = arr[hi];
  let i = lo - 1;
  for (let j = lo; j < hi; j++) {
    if (arr[j] < pivot) {
      i++;
      let tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
  }
  i++;
  let tmp = arr[i]; arr[i] = arr[hi]; arr[hi] = tmp;
  quickSort(arr, lo, i - 1);
  quickSort(arr, i + 1, hi);
}
quickSort(data, 0, size - 1);`,
  },
  {
    id: 'matrix-multiply',
    name: 'Matrix Multiply',
    icon: '🔢',
    description: 'Dense matrix multiplication (200×200). Tests nested loops, memory access patterns, and cache behavior.',
    inputSize: 200,
    iterations: 20,
    warmup: 3,
    code: `// Matrix Multiplication — O(n³)
// Using 'size' as matrix dimension (200×200)
const n = Math.min(size, 200);

// Create two n×n matrices
const A = [];
const B = [];
const C = [];
for (let i = 0; i < n; i++) {
  A[i] = new Array(n);
  B[i] = new Array(n);
  C[i] = new Float64Array(n);
  for (let j = 0; j < n; j++) {
    A[i][j] = Math.random();
    B[i][j] = Math.random();
  }
}

// Multiply: C = A × B
for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
    let sum = 0;
    for (let k = 0; k < n; k++) {
      sum += A[i][k] * B[k][j];
    }
    C[i][j] = sum;
  }
}`,
  },
  {
    id: 'fibonacci-recursive',
    name: 'Fibonacci (Recursive)',
    icon: '🌀',
    description: 'Recursive Fibonacci (n=35). Tests deep recursion, call stack, and function call overhead.',
    inputSize: 35,
    iterations: 15,
    warmup: 3,
    code: `// Recursive Fibonacci — O(2^n)
// 'size' is used as n (capped at 35 for safety)
const n = Math.min(size, 40);

function fib(x) {
  if (x <= 1) return x;
  return fib(x - 1) + fib(x - 2);
}

fib(n);`,
  },
  {
    id: 'prime-sieve',
    name: 'Prime Sieve',
    icon: '🔍',
    description: 'Sieve of Eratosthenes up to 1M. Tests memory allocation, iteration, and boolean array operations.',
    inputSize: 1000000,
    iterations: 30,
    warmup: 5,
    code: `// Sieve of Eratosthenes — O(n log log n)
const limit = size;
const sieve = new Uint8Array(limit + 1);

for (let i = 2; i * i <= limit; i++) {
  if (sieve[i] === 0) {
    for (let j = i * i; j <= limit; j += i) {
      sieve[j] = 1;
    }
  }
}

// Count primes
let count = 0;
for (let i = 2; i <= limit; i++) {
  if (sieve[i] === 0) count++;
}`,
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    icon: '🎯',
    description: '10K binary searches on a sorted 1M array. Tests branching prediction and random access patterns.',
    inputSize: 1000000,
    iterations: 40,
    warmup: 5,
    code: `// Binary Search — O(log n) × 10K lookups
// Sort the data first
data.sort((a, b) => a - b);

function binarySearch(arr, target, lo, hi) {
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return -1;
}

// Perform 10K searches with random targets
const searches = 10000;
let found = 0;
for (let i = 0; i < searches; i++) {
  const target = Math.random() * size | 0;
  if (binarySearch(data, target, 0, size - 1) !== -1) {
    found++;
  }
}`,
  },
  {
    id: 'string-ops',
    name: 'String Operations',
    icon: '📝',
    description: '100K string concatenations and operations. Tests string handling and memory allocation patterns.',
    inputSize: 100000,
    iterations: 25,
    warmup: 5,
    code: `// String Operations — concatenation + manipulation
const count = Math.min(size, 100000);
const parts = [];

for (let i = 0; i < count; i++) {
  parts.push(String.fromCharCode(65 + (i % 26)));
}

// Join and split
const joined = parts.join('');
const reversed = joined.split('').reverse().join('');
const upper = reversed.toUpperCase();
const len = upper.length;`,
  },
  {
    id: 'json-parse',
    name: 'JSON Parse/Stringify',
    icon: '📦',
    description: 'Serialize and deserialize a complex nested object. Tests JSON engine performance.',
    inputSize: 1000,
    iterations: 40,
    warmup: 5,
    code: `// JSON Parse/Stringify — serialization benchmark
// Build a complex nested object
const obj = { items: [] };
const count = Math.min(size, 5000);

for (let i = 0; i < count; i++) {
  obj.items.push({
    id: i,
    name: "item_" + i,
    value: Math.random(),
    nested: {
      a: i * 2,
      b: [i, i + 1, i + 2],
      c: i % 2 === 0
    }
  });
}

// Stringify then parse 10 times
for (let round = 0; round < 10; round++) {
  const str = JSON.stringify(obj);
  const parsed = JSON.parse(str);
}`,
  },
];

/**
 * Get a benchmark by its ID.
 */
export function getBenchmarkById(id) {
  return preloadedBenchmarks.find(b => b.id === id) || null;
}
