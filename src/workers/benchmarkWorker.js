/* ============================================
   Benchmark Web Worker
   Runs user code in an isolated thread.
   ============================================ */

/**
 * Message protocol:
 * 
 * Incoming (from main thread):
 * { type: 'run', code: string, inputSize: number, iterations: number, warmup: number, label: string }
 * 
 * Outgoing (to main thread):
 * { type: 'progress', current: number, total: number, label: string }
 * { type: 'result', label: string, times: number[], error: null }
 * { type: 'error', label: string, error: string }
 */

// Timeout for a single iteration (10 seconds)
const ITERATION_TIMEOUT = 10000;

/**
 * Generate test data based on input size
 */
function generateTestData(size) {
  const arr = new Array(size);
  for (let i = 0; i < size; i++) {
    arr[i] = Math.random() * size | 0;
  }
  return arr;
}

/**
 * Create a sandboxed function from user code string.
 * The user code receives `data` (array) and `size` (number) as parameters.
 * It should return nothing — we just measure execution time.
 */
function createUserFunction(codeString) {
  // Wrap user code in a function that receives test data
  // User code has access to: data (array), size (number)
  try {
    return new Function('data', 'size', codeString);
  } catch (e) {
    throw new Error(`Syntax Error: ${e.message}`);
  }
}

/**
 * Run a single iteration and return the time in milliseconds.
 */
function runIteration(fn, data, size) {
  // Clone data so each iteration gets a fresh copy
  // (important for in-place algorithms like sorting)
  const dataCopy = data.slice();
  
  const start = performance.now();
  fn(dataCopy, size);
  const end = performance.now();
  
  return end - start;
}

/**
 * Main benchmark runner
 */
function runBenchmark(code, inputSize, iterations, warmup, label) {
  let fn;
  
  try {
    fn = createUserFunction(code);
  } catch (e) {
    self.postMessage({ type: 'error', label, error: e.message });
    return;
  }

  // Generate test data
  const data = generateTestData(inputSize);
  const total = warmup + iterations;

  // Warm-up phase
  try {
    for (let i = 0; i < warmup; i++) {
      runIteration(fn, data, inputSize);
      self.postMessage({
        type: 'progress',
        current: i + 1,
        total,
        phase: 'warmup',
        label
      });
    }
  } catch (e) {
    self.postMessage({ type: 'error', label, error: `Runtime Error (warm-up): ${e.message}` });
    return;
  }

  // Measurement phase
  const times = [];
  try {
    for (let i = 0; i < iterations; i++) {
      const time = runIteration(fn, data, inputSize);
      times.push(time);
      
      self.postMessage({
        type: 'progress',
        current: warmup + i + 1,
        total,
        phase: 'measure',
        label
      });

      // Safety: if a single iteration takes too long, bail out
      if (time > ITERATION_TIMEOUT) {
        self.postMessage({
          type: 'error',
          label,
          error: `Timeout: single iteration took ${time.toFixed(0)}ms (limit: ${ITERATION_TIMEOUT}ms)`
        });
        return;
      }
    }
  } catch (e) {
    self.postMessage({ type: 'error', label, error: `Runtime Error: ${e.message}` });
    return;
  }

  self.postMessage({ type: 'result', label, times, error: null });
}

// Listen for messages from main thread
self.addEventListener('message', (e) => {
  const { type, code, inputSize, iterations, warmup, label } = e.data;
  
  if (type === 'run') {
    runBenchmark(code, inputSize, iterations, warmup, label);
  }
});
