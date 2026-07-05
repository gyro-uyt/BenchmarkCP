/* ============================================
   BenchmarkCP — Main Entry Point
   ============================================ */

// Styles
import './styles/index.css';
import './styles/editor.css';
import './styles/results.css';

// Monaco Editor
import * as monaco from 'monaco-editor';
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';

// Modules
import { initCodeDuel } from './modules/codeDuel.js';
import { initHardwareBench } from './modules/hardwareBench.js';
import { initLeaderboard, onLeaderboardTabActive } from './modules/globalLeaderboard.js';
import { detectHardware, getHardwareSummary } from './modules/hardwareDetector.js';

// ---- Monaco Worker Setup ----
self.MonacoEnvironment = {
  getWorker(_, label) {
    return new editorWorker();
  }
};

// ---- App Initialization ----
function initApp() {
  // Detect hardware
  const hwInfo = detectHardware();
  populateHardwareInfo(hwInfo);

  // Initialize both modes
  initCodeDuel(monaco);
  initHardwareBench(monaco);
  initLeaderboard();

  // Tab navigation
  setupTabNavigation();
}

// ---- Populate Hardware Info ----
function populateHardwareInfo(info) {
  document.getElementById('hw-cores').textContent = info.cores;
  document.getElementById('hw-ram').textContent = info.ram;
  document.getElementById('hw-gpu').textContent = info.gpu;
  document.getElementById('hw-browser').textContent =
    `${info.browser} ${info.browserVersion}`;
  document.getElementById('hw-summary').textContent = getHardwareSummary(info);
}

// ---- Tab Navigation ----
function setupTabNavigation() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.mode-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update tab states
      tabs.forEach(t => {
        const isSelected = t === tab;
        t.classList.toggle('active', isSelected);
        t.setAttribute('aria-selected', isSelected);
      });

      // Update panel visibility
      panels.forEach(p => {
        p.classList.toggle('active', p.id === `panel-${targetTab}`);
      });
      
      // Trigger data fetch if leaderboard tab is opened
      if (targetTab === 'leaderboard') {
        onLeaderboardTabActive();
      }
    });
  });
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
