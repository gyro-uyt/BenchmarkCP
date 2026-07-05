/* ============================================
   Code Duel Module
   Side-by-side code comparison mode.
   ============================================ */

import { runDuel } from './benchmarkEngine.js';
import { displayDuelResults } from './resultsDisplay.js';

let editorA = null;
let editorB = null;
let isRunning = false;

// Default code samples
const DEFAULT_CODE_A = `// Version A — Quick Sort (Lomuto partition)
// 'data' is a random integer array, 'size' is its length
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
quickSort(data, 0, size - 1);`;

const DEFAULT_CODE_B = `// Version B — Merge Sort
// 'data' is a random integer array, 'size' is its length
function mergeSort(arr, l, r) {
  if (l >= r) return;
  const m = (l + r) >> 1;
  mergeSort(arr, l, m);
  mergeSort(arr, m + 1, r);
  merge(arr, l, m, r);
}

function merge(arr, l, m, r) {
  const left = arr.slice(l, m + 1);
  const right = arr.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    if (left[i] <= right[j]) arr[k++] = left[i++];
    else arr[k++] = right[j++];
  }
  while (i < left.length) arr[k++] = left[i++];
  while (j < right.length) arr[k++] = right[j++];
}
mergeSort(data, 0, size - 1);`;

/**
 * Initialize Code Duel mode.
 */
export function initCodeDuel(monaco) {
  // Create Editor A
  editorA = monaco.editor.create(document.getElementById('editor-a'), {
    value: DEFAULT_CODE_A,
    language: 'javascript',
    theme: 'vs-dark',
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12 },
    renderLineHighlight: 'line',
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
  });

  // Create Editor B
  editorB = monaco.editor.create(document.getElementById('editor-b'), {
    value: DEFAULT_CODE_B,
    language: 'javascript',
    theme: 'vs-dark',
    minimap: { enabled: false },
    fontSize: 13,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    lineNumbers: 'on',
    scrollBeyondLastLine: false,
    automaticLayout: true,
    padding: { top: 12 },
    renderLineHighlight: 'line',
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
  });

  // Size selector buttons
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Run button
  document.getElementById('duel-run-btn').addEventListener('click', handleDuelRun);
}

/**
 * Get current configuration from UI.
 */
function getConfig() {
  const activeSize = document.querySelector('.size-btn.active');
  return {
    inputSize: parseInt(activeSize.dataset.size),
    iterations: parseInt(document.getElementById('iterations').value) || 50,
    warmup: parseInt(document.getElementById('warmup').value) || 10,
  };
}

/**
 * Handle Duel run button click.
 */
async function handleDuelRun() {
  if (isRunning) return;

  const codeA = editorA.getValue();
  const codeB = editorB.getValue();

  if (!codeA.trim() || !codeB.trim()) {
    alert('Please enter code in both editors.');
    return;
  }

  const config = getConfig();
  isRunning = true;

  // Update UI
  const runBtn = document.getElementById('duel-run-btn');
  runBtn.disabled = true;
  runBtn.querySelector('.run-text').textContent = 'Running...';

  const statusA = document.getElementById('status-a');
  const statusB = document.getElementById('status-b');

  // Show progress overlay
  showProgress();

  try {
    const result = await runDuel(
      codeA,
      codeB,
      config.inputSize,
      config.iterations,
      config.warmup,
      (current, total, phase, label) => {
        updateProgress(current, total, phase, label);
        
        if (label === 'A') {
          statusA.className = 'editor-status running';
          statusA.textContent = `${phase === 'warmup' ? 'Warming up' : 'Measuring'}...`;
        } else {
          statusB.className = 'editor-status running';
          statusB.textContent = `${phase === 'warmup' ? 'Warming up' : 'Measuring'}...`;
        }
      }
    );

    // Update statuses
    statusA.className = 'editor-status done';
    statusA.textContent = `Done`;
    statusB.className = 'editor-status done';
    statusB.textContent = `Done`;

    // Display results
    displayDuelResults(result);
  } catch (err) {
    const errorLabel = err.message.includes('Version A') || !err.message.includes('Version B') ? 'A' : 'B';
    if (errorLabel === 'A') {
      statusA.className = 'editor-status error';
      statusA.textContent = 'Error';
    } else {
      statusB.className = 'editor-status error';
      statusB.textContent = 'Error';
    }
    alert(`Benchmark Error: ${err.message}`);
  } finally {
    isRunning = false;
    runBtn.disabled = false;
    runBtn.querySelector('.run-text').textContent = 'Duel!';
    hideProgress();
  }
}

/**
 * Show progress overlay.
 */
function showProgress() {
  document.getElementById('progress-overlay').classList.remove('hidden');
  document.getElementById('progress-bar').style.width = '0%';
}

/**
 * Update progress overlay.
 */
function updateProgress(current, total, phase, label) {
  const pct = (current / (total * 2)) * 100; // *2 because we run A then B
  const offset = label === 'B' ? 50 : 0;
  
  document.getElementById('progress-bar').style.width = `${offset + pct}%`;
  document.getElementById('progress-text').textContent =
    `Running Version ${label}...`;
  document.getElementById('progress-detail').textContent =
    `${phase === 'warmup' ? 'Warm-up' : 'Iteration'} ${current}/${total}`;
}

/**
 * Hide progress overlay.
 */
function hideProgress() {
  document.getElementById('progress-overlay').classList.add('hidden');
}
