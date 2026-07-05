/* ============================================
   Benchmark Engine
   Manages workers, computes statistics.
   ============================================ */

/**
 * Compute statistical analysis from an array of timing measurements.
 */
export function computeStats(times) {
  if (!times || times.length === 0) {
    return null;
  }

  const sorted = [...times].sort((a, b) => a - b);
  const n = sorted.length;

  const sum = sorted.reduce((a, b) => a + b, 0);
  const mean = sum / n;
  const median = n % 2 === 0
    ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2
    : sorted[Math.floor(n / 2)];

  const min = sorted[0];
  const max = sorted[n - 1];

  // Standard deviation
  const sqDiffs = sorted.map(t => (t - mean) ** 2);
  const variance = sqDiffs.reduce((a, b) => a + b, 0) / n;
  const stdDev = Math.sqrt(variance);

  // Percentiles
  const p5 = sorted[Math.floor(n * 0.05)] || min;
  const p95 = sorted[Math.ceil(n * 0.95) - 1] || max;

  // Operations per second (based on median)
  const opsPerSec = median > 0 ? (1000 / median) : Infinity;

  return {
    times: sorted,
    count: n,
    mean,
    median,
    min,
    max,
    stdDev,
    p5,
    p95,
    opsPerSec,
  };
}

/**
 * Format time in human-readable format.
 */
export function formatTime(ms) {
  if (ms < 0.001) return `${(ms * 1000000).toFixed(0)}ns`;
  if (ms < 1) return `${(ms * 1000).toFixed(1)}µs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(3)}s`;
}

/**
 * Format ops/sec in human-readable format.
 */
export function formatOps(ops) {
  if (ops === Infinity) return '∞ ops/s';
  if (ops >= 1000000) return `${(ops / 1000000).toFixed(1)}M ops/s`;
  if (ops >= 1000) return `${(ops / 1000).toFixed(1)}K ops/s`;
  return `${ops.toFixed(1)} ops/s`;
}

/**
 * Run a benchmark in a Web Worker.
 * Returns a promise that resolves with { label, times, stats }.
 * 
 * @param {string} code - The user's code string
 * @param {number} inputSize - Size of test data
 * @param {number} iterations - Number of measurement iterations
 * @param {number} warmup - Number of warm-up iterations
 * @param {string} label - Label for this run (e.g., 'A' or 'B')
 * @param {function} onProgress - Progress callback (current, total, phase, label)
 */
export function runBenchmark(code, inputSize, iterations, warmup, label, onProgress) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../workers/benchmarkWorker.js', import.meta.url),
      { type: 'module' }
    );

    // Set a global timeout (iterations * 10s max + 30s buffer)
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error(`Global timeout: benchmark took too long`));
    }, (iterations + warmup) * ITERATION_TIMEOUT_EXTERNAL + 30000);

    worker.addEventListener('message', (e) => {
      const msg = e.data;

      if (msg.type === 'progress') {
        if (onProgress) {
          onProgress(msg.current, msg.total, msg.phase, msg.label);
        }
      } else if (msg.type === 'result') {
        clearTimeout(timeout);
        worker.terminate();
        const stats = computeStats(msg.times);
        resolve({ label: msg.label, times: msg.times, stats });
      } else if (msg.type === 'error') {
        clearTimeout(timeout);
        worker.terminate();
        reject(new Error(msg.error));
      }
    });

    worker.addEventListener('error', (e) => {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(`Worker error: ${e.message}`));
    });

    worker.postMessage({
      type: 'run',
      code,
      inputSize,
      iterations,
      warmup,
      label,
    });
  });
}

// Generous external timeout per iteration (15s)
const ITERATION_TIMEOUT_EXTERNAL = 15000;

/**
 * Run a duel — two benchmarks sequentially.
 */
export async function runDuel(codeA, codeB, inputSize, iterations, warmup, onProgress) {
  const resultA = await runBenchmark(codeA, inputSize, iterations, warmup, 'A', onProgress);
  const resultB = await runBenchmark(codeB, inputSize, iterations, warmup, 'B', onProgress);

  // Determine winner
  const diff = resultA.stats.median - resultB.stats.median;
  const pctDiff = resultB.stats.median > 0
    ? ((Math.abs(diff) / Math.max(resultA.stats.median, resultB.stats.median)) * 100)
    : 0;

  let winner = 'tie';
  // Consider it a tie if difference is less than the combined standard deviations
  const threshold = Math.max(
    (resultA.stats.stdDev + resultB.stats.stdDev) * 0.5,
    resultA.stats.median * 0.02 // or 2% of the faster time
  );

  if (diff < -threshold) {
    winner = 'A';
  } else if (diff > threshold) {
    winner = 'B';
  }

  return {
    a: resultA,
    b: resultB,
    winner,
    percentDiff: pctDiff.toFixed(1),
  };
}
