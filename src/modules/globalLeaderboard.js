/* ============================================
   Global Leaderboard Module
   Handles fetching the global score leaderboard and 
   executing the global benchmark suite.
   ============================================ */

import { getLeaderboard, submitGlobalScore } from './firebaseService.js';
import { detectHardware } from './hardwareDetector.js';
import { preloadedBenchmarks } from './preloadedBenchmarks.js';
import { runBenchmark, formatTime } from './benchmarkEngine.js';

let currentLeaderboardEntries = [];
let currentBrowserFilter = 'all';
let cachedHwInfo = null;
let hasLoadedData = false;
let isRunningGlobal = false;

export function initLeaderboard() {
  cachedHwInfo = detectHardware();
  setupLeaderboardTabs();
  
  const runBtn = document.getElementById('lb-run-global-btn');
  if (runBtn) {
    runBtn.addEventListener('click', handleRunGlobalBenchmark);
  }
}

export function onLeaderboardTabActive() {
  if (!hasLoadedData) {
    loadGlobalLeaderboard();
  }
}

function setupLeaderboardTabs() {
  const tabs = document.querySelectorAll('#lb-browser-tabs .lb-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentBrowserFilter = tab.dataset.browser;
      renderLeaderboardTable();
    });
  });
}

/**
 * Executes the entire suite of benchmarks, calculates a composite score,
 * and submits it to Firebase as the user's global ranking.
 */
async function handleRunGlobalBenchmark() {
  if (isRunningGlobal) return;
  isRunningGlobal = true;

  const runBtn = document.getElementById('lb-run-global-btn');
  runBtn.disabled = true;

  const overlay = document.getElementById('progress-overlay');
  overlay.classList.remove('hidden');

  let totalScore = 0;
  const benchmarksToRun = preloadedBenchmarks;

  for (let i = 0; i < benchmarksToRun.length; i++) {
    const bench = benchmarksToRun[i];
    document.getElementById('progress-text').textContent =
      `Running Global Suite: ${bench.name} (${i + 1}/${benchmarksToRun.length})...`;
    
    document.getElementById('progress-bar').style.width = `${(i / benchmarksToRun.length) * 100}%`;

    try {
      const result = await runBenchmark(
        bench.code,
        bench.inputSize,
        bench.iterations,
        bench.warmup,
        bench.id,
        (current, total, phase) => {
          const benchProgress = (current / total) * (1 / benchmarksToRun.length);
          const overallProgress = ((i / benchmarksToRun.length) + benchProgress) * 100;
          document.getElementById('progress-bar').style.width = `${overallProgress}%`;
          document.getElementById('progress-detail').textContent =
            `${phase === 'warmup' ? 'Warm-up' : 'Iteration'} ${current}/${total}`;
        }
      );

      // We calculate a base score from opsPerSec. 
      // Higher ops = higher score. We scale it so it's a nice integer.
      const benchScore = (result.stats.opsPerSec * 10);
      totalScore += benchScore;

    } catch (err) {
      console.error(`Global bench failed on ${bench.name}:`, err);
    }
  }
  
  // Final composite score (rounded to nearest integer)
  const finalGlobalScore = Math.round(totalScore);

  document.getElementById('progress-text').textContent = 'Uploading Global Score...';
  
  try {
    const success = await submitGlobalScore(finalGlobalScore, cachedHwInfo);
    if (success) {
      showSubmitToast(`🎉 Global Benchmark Complete! Score: ${finalGlobalScore.toLocaleString()}`);
      // Refresh leaderboard to show new score
      await loadGlobalLeaderboard();
    }
  } catch (err) {
    console.error('Failed to submit global score:', err);
  }

  overlay.classList.add('hidden');
  runBtn.disabled = false;
  isRunningGlobal = false;
}


async function loadGlobalLeaderboard() {
  const tbody = document.getElementById('leaderboard-body');
  tbody.innerHTML = `<tr><td colspan="6" class="lb-loading">Loading Global Rankings...</td></tr>`;

  try {
    // We use a special ID 'global_benchmark_suite' for the overall leaderboard
    currentLeaderboardEntries = await getLeaderboard('global_benchmark_suite', 50, true);
    hasLoadedData = true;
    renderLeaderboardTable();
  } catch (err) {
    console.error('Failed to load global leaderboard:', err);
    tbody.innerHTML = `<tr><td colspan="6" class="lb-empty">Failed to load global leaderboard</td></tr>`;
  }
}

function renderLeaderboardTable() {
  const tbody = document.getElementById('leaderboard-body');
  
  if (currentLeaderboardEntries.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="lb-empty">No global scores yet. Be the first! 🚀</td></tr>`;
    return;
  }

  let filtered = currentLeaderboardEntries;
  if (currentBrowserFilter !== 'all') {
    filtered = filtered.filter(entry => entry.browser === currentBrowserFilter);
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="lb-empty">No entries for ${currentBrowserFilter}.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.slice(0, 20).map((entry, i) => {
    const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`;
    const isYou = isCurrentUser(entry);
    const rowClass = isYou ? 'lb-row lb-you' : 'lb-row';

    // Format date beautifully
    const dateStr = new Date(entry.timestamp).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric'
    });

    return `
      <tr class="${rowClass}">
        <td class="lb-rank">${medal}</td>
        <td class="lb-time" style="font-size: 1.1em;">${entry.globalScore.toLocaleString()}</td>
        <td class="lb-hw">${entry.cpuCores} • ${entry.ram}</td>
        <td class="lb-browser">${getBrowserIcon(entry.browser)} ${entry.browser} ${entry.browserVersion ? entry.browserVersion.split('.')[0] : ''}</td>
        <td class="lb-gpu" title="${entry.gpu || ''}">${truncate(entry.gpu || '—', 25)}</td>
        <td class="lb-date" style="color: var(--text-muted); font-size: 0.85em;">${dateStr}</td>
      </tr>
    `;
  }).join('');
}

function isCurrentUser(entry) {
  return entry.cpuCores === cachedHwInfo.cores &&
    entry.browser === cachedHwInfo.browser &&
    entry.gpu === cachedHwInfo.gpu;
}

function getBrowserIcon(browser) {
  switch (browser) {
    case 'Chrome': return '🟡';
    case 'Firefox': return '🦊';
    case 'Safari': return '🧭';
    case 'Edge': return '🔵';
    default: return '🌐';
  }
}

function truncate(str, maxLen) {
  return str.length > maxLen ? str.substring(0, maxLen) + '…' : str;
}

function showSubmitToast(msg) {
  const toast = document.getElementById('submit-toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.remove('hidden');
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('hidden'), 300);
  }, 4000);
}
