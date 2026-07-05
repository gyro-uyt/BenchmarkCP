/* ============================================
   Hardware Benchmark Module
   Preloaded benchmarks + custom code mode.
   ============================================ */

import { preloadedBenchmarks } from './preloadedBenchmarks.js';
import { runBenchmark, formatTime, formatOps } from './benchmarkEngine.js';
import { displayHardwareResults } from './resultsDisplay.js';
import { detectHardware } from './hardwareDetector.js';

let previewEditor = null;
let selectedBenchmark = null;
let isRunning = false;
let benchmarkResults = [];
let cachedHwInfo = null;

/**
 * Initialize Hardware Benchmark mode.
 */
export function initHardwareBench(monaco) {
  cachedHwInfo = detectHardware();
  // Load user-provided CPU name from localStorage
  cachedHwInfo.cpuName = localStorage.getItem('benchmarkcp_cpuName') || '';
  renderBenchmarkList();
  renderCpuInput();
  setupEventListeners();

  // Create a read-only preview editor
  previewEditor = monaco.editor.create(document.getElementById('bench-code-preview'), {
    value: '// Select a benchmark from the sidebar to preview its code',
    language: 'javascript',
    theme: 'vs-dark',
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12 },
    readOnly: false,
    renderLineHighlight: 'line',
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
  });

  // Select first benchmark by default
  selectBenchmark(preloadedBenchmarks[0]);
}

/**
 * Render the benchmark list in the sidebar.
 */
function renderBenchmarkList() {
  const list = document.getElementById('bench-list');
  list.innerHTML = '';

  preloadedBenchmarks.forEach((bench, index) => {
    const item = document.createElement('div');
    item.className = 'bench-item';
    item.dataset.id = bench.id;
    if (index === 0) item.classList.add('active');

    item.innerHTML = `
      <input type="checkbox" checked data-bench-id="${bench.id}" />
      <span class="bench-item-icon">${bench.icon}</span>
      <span class="bench-item-name">${bench.name}</span>
      <span class="bench-item-time" id="bench-time-${bench.id}"></span>
    `;

    item.addEventListener('click', (e) => {
      // Don't trigger select when clicking checkbox
      if (e.target.type === 'checkbox') return;
      selectBenchmark(bench);
    });

    list.appendChild(item);
  });

  // Add custom code option
  const customItem = document.createElement('div');
  customItem.className = 'bench-item';
  customItem.dataset.id = 'custom';
  customItem.innerHTML = `
    <input type="checkbox" data-bench-id="custom" />
    <span class="bench-item-icon"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg></span>
    <span class="bench-item-name">Custom Code</span>
    <span class="bench-item-time" id="bench-time-custom"></span>
  `;
  customItem.addEventListener('click', (e) => {
    if (e.target.type === 'checkbox') return;
    selectCustom();
  });
  list.appendChild(customItem);
}

/**
 * Render a CPU name input field inside the hardware info bar.
 * This lets the user type their CPU model (e.g. "i7-14700HX") since
 * browsers don't expose the CPU name for privacy reasons.
 */
function renderCpuInput() {
  const hwBar = document.getElementById('hw-info-bar');
  if (!hwBar) return;

  // Insert a new hw-info-item for CPU Name at the beginning
  const cpuItem = document.createElement('div');
  cpuItem.className = 'hw-info-item';
  cpuItem.innerHTML = `
    <svg class="hw-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
    <span class="hw-label">CPU Name</span>
    <input
      type="text"
      id="hw-cpu-name"
      class="hw-cpu-input"
      placeholder="e.g. i7-14700HX"
      value="${cachedHwInfo.cpuName || ''}"
      spellcheck="false"
    />
  `;
  hwBar.insertBefore(cpuItem, hwBar.firstChild);

  // Save on input
  const input = document.getElementById('hw-cpu-name');
  input.addEventListener('input', () => {
    const name = input.value.trim();
    cachedHwInfo.cpuName = name;
    localStorage.setItem('benchmarkcp_cpuName', name);
  });
}

/**
 * Select a preloaded benchmark and show its code.
 */
function selectBenchmark(bench) {
  selectedBenchmark = bench;

  // Update active state
  document.querySelectorAll('.bench-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === bench.id);
  });

  // Update detail panel
  document.getElementById('bench-detail-title').textContent = bench.name;
  document.getElementById('bench-detail-desc').textContent = bench.description;

  // Update editor
  if (previewEditor) {
    previewEditor.setValue(bench.code);
    previewEditor.updateOptions({ readOnly: true });
  }
}

/**
 * Select custom code mode.
 */
function selectCustom() {
  selectedBenchmark = null;

  document.querySelectorAll('.bench-item').forEach(item => {
    item.classList.toggle('active', item.dataset.id === 'custom');
  });

  document.getElementById('bench-detail-title').textContent = 'Custom Code';
  document.getElementById('bench-detail-desc').textContent =
    'Write your own benchmark code. You have access to `data` (random integer array) and `size` (array length).';

  if (previewEditor) {
    previewEditor.setValue(`// Write your custom benchmark code here
// Available variables:
//   data - array of random integers (size determined by input)
//   size - length of the data array

// Example: Test Array.sort() vs manual sort
data.sort((a, b) => a - b);
`);
    previewEditor.updateOptions({ readOnly: false });
  }
}

/**
 * Setup event listeners for run buttons.
 */
function setupEventListeners() {
  // Run Selected
  document.getElementById('hw-run-btn').addEventListener('click', handleRunSelected);

  // Run All
  document.getElementById('hw-run-all-btn').addEventListener('click', handleRunAll);
}

/**
 * Get list of checked benchmarks.
 */
function getCheckedBenchmarks() {
  const checked = [];
  document.querySelectorAll('#bench-list input[type="checkbox"]:checked').forEach(cb => {
    const id = cb.dataset.benchId;
    if (id === 'custom') {
      // Custom code
      if (previewEditor) {
        checked.push({
          id: 'custom',
          name: 'Custom Code',
          icon: '',
          code: previewEditor.getValue(),
          inputSize: 100000,
          iterations: 30,
          warmup: 5,
        });
      }
    } else {
      const bench = preloadedBenchmarks.find(b => b.id === id);
      if (bench) checked.push(bench);
    }
  });
  return checked;
}

/**
 * Handle "Run Selected" button.
 */
async function handleRunSelected() {
  if (isRunning) return;

  const benchmarks = getCheckedBenchmarks();
  if (benchmarks.length === 0) {
    alert('Please select at least one benchmark to run.');
    return;
  }

  await executeBenchmarks(benchmarks);
}

/**
 * Handle "Run All" button — checks all and runs.
 */
async function handleRunAll() {
  if (isRunning) return;

  // Check all checkboxes
  document.querySelectorAll('#bench-list input[type="checkbox"]').forEach(cb => {
    if (cb.dataset.benchId !== 'custom') {
      cb.checked = true;
    }
  });

  const benchmarks = preloadedBenchmarks.slice(); // all preloaded
  await executeBenchmarks(benchmarks);
}

/**
 * Execute a list of benchmarks sequentially.
 */
async function executeBenchmarks(benchmarks) {
  isRunning = true;
  benchmarkResults = [];

  const runBtn = document.getElementById('hw-run-btn');
  const runAllBtn = document.getElementById('hw-run-all-btn');
  runBtn.disabled = true;
  runAllBtn.disabled = true;

  // Show progress
  const overlay = document.getElementById('progress-overlay');
  overlay.classList.remove('hidden');

  for (let i = 0; i < benchmarks.length; i++) {
    const bench = benchmarks[i];

    document.getElementById('progress-text').textContent =
      `Running ${bench.name} (${i + 1}/${benchmarks.length})...`;
    document.getElementById('progress-bar').style.width =
      `${(i / benchmarks.length) * 100}%`;

    try {
      const result = await runBenchmark(
        bench.code,
        bench.inputSize,
        bench.iterations,
        bench.warmup,
        bench.id,
        (current, total, phase) => {
          const benchProgress = (current / total) * (1 / benchmarks.length);
          const overallProgress = ((i / benchmarks.length) + benchProgress) * 100;
          document.getElementById('progress-bar').style.width = `${overallProgress}%`;
          document.getElementById('progress-detail').textContent =
            `${phase === 'warmup' ? 'Warm-up' : 'Iteration'} ${current}/${total}`;
        }
      );

      benchmarkResults.push({
        ...bench,
        stats: result.stats,
        times: result.times,
      });

      // Update time in sidebar
      const timeEl = document.getElementById(`bench-time-${bench.id}`);
      if (timeEl) {
        timeEl.textContent = formatTime(result.stats.median);
      }

      // Mark as completed
      const item = document.querySelector(`.bench-item[data-id="${bench.id}"]`);
      if (item) item.classList.add('completed');

    } catch (err) {
      console.error(`Benchmark ${bench.name} failed:`, err);
      benchmarkResults.push({
        ...bench,
        stats: { median: 0, mean: 0, min: 0, max: 0, stdDev: 0, opsPerSec: 0, p5: 0, p95: 0, count: 0 },
        error: err.message,
      });
    }
  }

  // Hide progress
  overlay.classList.add('hidden');

  // Display results
  const validResults = benchmarkResults.filter(r => !r.error);
  if (validResults.length > 0) {
    displayHardwareResults(validResults);
  }

  isRunning = false;
  runBtn.disabled = false;
  runAllBtn.disabled = false;
}
