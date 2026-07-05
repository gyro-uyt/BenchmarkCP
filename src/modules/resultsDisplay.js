/* ============================================
   Results Display
   Charts and visual comparison using Chart.js
   ============================================ */

import { Chart, registerables } from 'chart.js';
import { formatTime, formatOps } from './benchmarkEngine.js';

Chart.register(...registerables);

// Chart.js global dark theme config
Chart.defaults.color = '#94A3B8';
Chart.defaults.borderColor = 'rgba(148, 163, 184, 0.1)';
Chart.defaults.font.family = "'Inter', sans-serif";

let duelChartInstance = null;
let distributionChartInstance = null;
let hwChartInstance = null;

/**
 * Display duel results (winner card + stat cards + charts).
 */
export function displayDuelResults(duelResult) {
  const { a, b, winner, percentDiff } = duelResult;
  const container = document.getElementById('duel-results');
  container.classList.remove('hidden');

  // Scroll to results
  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);

  // --- Winner Card ---
  const winnerCard = document.getElementById('winner-card');
  const winnerIcon = document.getElementById('winner-icon');
  const winnerText = document.getElementById('winner-text');
  const winnerDetail = document.getElementById('winner-detail');

  winnerCard.className = 'result-card winner-card';

  if (winner === 'A') {
    winnerCard.classList.add('winner-a');
    winnerIcon.textContent = '🏆';
    winnerText.textContent = 'Version A Wins!';
    winnerDetail.textContent = `${percentDiff}% faster`;
  } else if (winner === 'B') {
    winnerCard.classList.add('winner-b');
    winnerIcon.textContent = '🏆';
    winnerText.textContent = 'Version B Wins!';
    winnerDetail.textContent = `${percentDiff}% faster`;
  } else {
    winnerCard.classList.add('tie');
    winnerIcon.textContent = '🤝';
    winnerText.textContent = "It's a Tie!";
    winnerDetail.textContent = `Within margin of error (${percentDiff}%)`;
    winnerDetail.style.color = 'var(--accent-amber)';
  }

  // --- Stat Cards ---
  document.getElementById('stat-a-median').textContent = formatTime(a.stats.median);
  document.getElementById('stat-a-ops').textContent = formatOps(a.stats.opsPerSec);

  document.getElementById('stat-b-median').textContent = formatTime(b.stats.median);
  document.getElementById('stat-b-ops').textContent = formatOps(b.stats.opsPerSec);

  document.getElementById('stat-stddev').textContent =
    `${formatTime(a.stats.stdDev)} / ${formatTime(b.stats.stdDev)}`;

  // --- Meta ---
  document.getElementById('results-meta').textContent =
    `${a.stats.count} iterations • median of sorted runs`;

  // --- Comparison Bar Chart ---
  renderDuelChart(a, b);

  // --- Distribution Chart ---
  renderDistributionChart(a, b);
}

/**
 * Render side-by-side comparison bar chart.
 */
function renderDuelChart(a, b) {
  const ctx = document.getElementById('duel-chart').getContext('2d');

  if (duelChartInstance) {
    duelChartInstance.destroy();
  }

  duelChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Median', 'Mean', 'Min', 'Max', 'P5', 'P95'],
      datasets: [
        {
          label: 'Version A',
          data: [a.stats.median, a.stats.mean, a.stats.min, a.stats.max, a.stats.p5, a.stats.p95],
          backgroundColor: 'rgba(124, 58, 237, 0.7)',
          borderColor: 'rgba(124, 58, 237, 1)',
          borderWidth: 2,
          borderRadius: 6,
        },
        {
          label: 'Version B',
          data: [b.stats.median, b.stats.mean, b.stats.min, b.stats.max, b.stats.p5, b.stats.p95],
          backgroundColor: 'rgba(6, 182, 212, 0.7)',
          borderColor: 'rgba(6, 182, 212, 1)',
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
      plugins: {
        title: {
          display: true,
          text: 'Performance Comparison (ms)',
          font: { size: 14, weight: '600' },
          padding: { bottom: 16 },
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            pointStyle: 'rectRounded',
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          titleFont: { weight: '600' },
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatTime(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (v) => formatTime(v),
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.06)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

/**
 * Render run-by-run distribution chart (line chart).
 */
function renderDistributionChart(a, b) {
  const ctx = document.getElementById('distribution-chart').getContext('2d');

  if (distributionChartInstance) {
    distributionChartInstance.destroy();
  }

  const labels = a.times.map((_, i) => `Run ${i + 1}`);

  distributionChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Version A',
          data: a.times,
          borderColor: 'rgba(124, 58, 237, 1)',
          backgroundColor: 'rgba(124, 58, 237, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
        {
          label: 'Version B',
          data: b.times,
          borderColor: 'rgba(6, 182, 212, 1)',
          backgroundColor: 'rgba(6, 182, 212, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      animation: {
        duration: 1000,
        easing: 'easeOutQuart',
      },
      plugins: {
        title: {
          display: true,
          text: 'Run Distribution (each iteration)',
          font: { size: 14, weight: '600' },
          padding: { bottom: 16 },
        },
        legend: {
          position: 'top',
          labels: {
            usePointStyle: true,
            padding: 20,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${formatTime(ctx.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          ticks: {
            callback: (v) => formatTime(v),
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.06)',
          },
        },
        x: {
          ticks: {
            maxTicksLimit: 15,
          },
          grid: {
            display: false,
          },
        },
      },
    },
  });
}

/**
 * Display hardware benchmark results.
 */
export function displayHardwareResults(results) {
  const container = document.getElementById('hw-results');
  const list = document.getElementById('hw-results-list');
  container.classList.remove('hidden');

  // Clear previous
  list.innerHTML = '';

  results.forEach((r) => {
    const item = document.createElement('div');
    item.className = 'hw-result-item';
    item.innerHTML = `
      <div class="hw-result-name">${r.icon} ${r.name}</div>
      <div class="hw-result-value">${formatTime(r.stats.median)}</div>
      <div class="hw-result-ops">${formatOps(r.stats.opsPerSec)} • σ ${formatTime(r.stats.stdDev)}</div>
    `;
    list.appendChild(item);
  });

  // Render bar chart
  renderHardwareChart(results);

  setTimeout(() => {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/**
 * Render hardware benchmark bar chart.
 */
function renderHardwareChart(results) {
  const ctx = document.getElementById('hw-chart').getContext('2d');

  if (hwChartInstance) {
    hwChartInstance.destroy();
  }

  const colors = [
    'rgba(124, 58, 237, 0.7)',
    'rgba(6, 182, 212, 0.7)',
    'rgba(16, 185, 129, 0.7)',
    'rgba(245, 158, 11, 0.7)',
    'rgba(236, 72, 153, 0.7)',
    'rgba(59, 130, 246, 0.7)',
    'rgba(168, 85, 247, 0.7)',
    'rgba(20, 184, 166, 0.7)',
  ];

  const borderColors = colors.map(c => c.replace('0.7', '1'));

  hwChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: results.map(r => r.name),
      datasets: [
        {
          label: 'Median Time (ms)',
          data: results.map(r => r.stats.median),
          backgroundColor: colors.slice(0, results.length),
          borderColor: borderColors.slice(0, results.length),
          borderWidth: 2,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      indexAxis: 'y',
      animation: {
        duration: 800,
        easing: 'easeOutQuart',
      },
      plugins: {
        title: {
          display: true,
          text: 'Hardware Benchmark Results (lower is better)',
          font: { size: 14, weight: '600' },
          padding: { bottom: 16 },
        },
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          bodyFont: { family: "'JetBrains Mono', monospace" },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => `Median: ${formatTime(ctx.parsed.x)}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: {
            callback: (v) => formatTime(v),
          },
          grid: {
            color: 'rgba(148, 163, 184, 0.06)',
          },
        },
        y: {
          grid: {
            display: false,
          },
        },
      },
    },
  });
}
