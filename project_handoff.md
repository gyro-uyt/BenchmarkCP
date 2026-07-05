# BenchmarkCP — Full Project Handoff

> Paste this entire document into the new chat as your first message so the AI understands exactly where we left off.

---

## 1. What Is This Project?

**BenchmarkCP** is a web-based code benchmarking application with 3 modes:

1. **⚔️ Code Duel** — Paste two JavaScript code snippets side-by-side, click "Duel", and get a statistically rigorous comparison of which runs faster (median, std dev, ops/sec, percentiles, charts).
2. **🖥️ Hardware Bench** — Run 8 preloaded standard algorithms (Bubble Sort, Quick Sort, Matrix Multiply, Fibonacci, Prime Sieve, Binary Search, String Operations, JSON Parse/Stringify) plus a "Custom Code" option to test your machine's raw JS performance.
3. **🏆 Leaderboard** — A dedicated page with a "Run Global Benchmark" button that runs all 8 preloaded algorithms, calculates a composite "Global Score" (sum of ops/sec × 10 across all benchmarks), and submits it to a Firebase Firestore leaderboard. The leaderboard can be filtered by browser (All / Chrome / Firefox / Edge / Safari).

**The motivation**: The user does DSA and writes multiple optimal solutions with the same Big-O complexity but different structure/logic. He wanted a tool to find which implementation is actually superior in wall-clock time.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Build tool | **Vite** (vanilla JS, no framework) |
| Code editor | **Monaco Editor** (same editor as VS Code) |
| Charts | **Chart.js** |
| Database | **Firebase Firestore** (free tier) |
| Execution | **Web Workers** (runs user code off-main-thread) |
| Hosting | **GitHub Pages** via GitHub Actions |
| Styling | Vanilla CSS with design tokens, glassmorphism, dark theme |

---

## 3. Project Structure

```
BenchmarkCp/
├── .github/workflows/deploy.yml   ← Auto-deploys to GH Pages on push to main
├── .gitignore
├── index.html                     ← App shell: 3 tab panels (Duel, Hardware, Leaderboard)
├── package.json
├── vite.config.js                 ← base: './' for relative paths
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.js                    ← Entry point: imports styles, sets up Monaco workers, tab navigation
    ├── styles/
    │   ├── index.css              ← Design system (CSS custom properties, gradients, animations)
    │   ├── editor.css             ← Monaco editor panel styles
    │   └── results.css            ← Results cards, charts, leaderboard table, toast
    ├── modules/
    │   ├── benchmarkEngine.js     ← Web Worker management, stats computation (median, stdDev, percentiles, ops/sec)
    │   ├── codeDuel.js            ← Code Duel mode: 2 Monaco editors, runs benchmarks via workers, displays comparison
    │   ├── hardwareBench.js       ← Hardware Bench mode: sidebar with 8 checkable benchmarks + custom code + code preview editor
    │   ├── globalLeaderboard.js   ← Leaderboard page: "Run Global Benchmark" button, fetches/renders global scores, browser tab filtering
    │   ├── firebaseService.js     ← Firebase init, Firestore CRUD, fingerprint-based deduplication, global score submission
    │   ├── hardwareDetector.js    ← Silent detection: CPU cores, RAM, GPU (via WebGL), browser name/version, OS
    │   ├── preloadedBenchmarks.js ← 8 standard algorithms with code, inputSize, iterations, warmup config
    │   └── resultsDisplay.js      ← Chart.js rendering for duel comparison bars, run distribution lines, HW benchmark horizontal bars
    └── workers/
        └── benchmarkWorker.js     ← Isolated Web Worker: receives code string, generates random data, runs iterations, reports times
```

---

## 4. Firebase Setup

**Project**: `benchmarkcp-ea72d`

**Config** (already hardcoded in `src/modules/firebaseService.js`):
```js
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "benchmarkcp-ea72d.firebaseapp.com",
  projectId: "benchmarkcp-ea72d",
  storageBucket: "benchmarkcp-ea72d.firebasestorage.app",
  messagingSenderId: "98263729404",
  appId: "1:98263729404:web:6962aa617529996ec4c379"
};
```

**Firestore Collection**: `benchmark_results`

**Deduplication**: Each submission generates a fingerprint from `benchmarkId + browser + browserVersion + os + cores + ram + gpu`. The fingerprint becomes the Firestore document ID, so re-running the same benchmark on the same machine silently overwrites the old score instead of creating duplicates.

**IMPORTANT — Composite Indexes Required**: Firestore needs composite indexes for queries that filter on one field and sort on another. Two indexes are needed:

1. **For per-algorithm leaderboard** (benchmarkId + medianMs ascending) — may already be created.
2. **For global score leaderboard** (benchmarkId + globalScore descending) — this link creates it:
   `https://console.firebase.google.com/v1/r/project/benchmarkcp-ea72d/firestore/indexes?create_composite=Cltwcm9qZWN0cy9iZW5jaG1hcmtjcC1lYTcyZC9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvYmVuY2htYXJrX3Jlc3VsdHMvaW5kZXhlcy9fEAEaDwoLYmVuY2htYXJrSWQQARoPCgtnbG9iYWxTY29yZRACGgwKCF9fbmFtZV9fEAI`

If the leaderboard shows "Loading..." and then goes empty, it means the composite index hasn't been created yet. Check the browser console — Firebase logs a clickable URL to create the missing index.

**Firestore Security Rules**: Currently in **test mode** (open read/write). Before going public, lock down writes to prevent abuse.

---

## 5. Key Design Decisions

### Why Web Workers?
User-submitted code runs inside a `Web Worker` via `new Function()`. This prevents:
- Infinite loops from freezing the UI
- Access to the DOM (security)
Each benchmark run gets its own fresh worker that is terminated after completion or timeout.

### Why client-side browser filtering instead of Firestore queries?
To avoid needing 5 separate Firestore composite indexes (one per browser), we fetch the top 50 global scores and filter client-side using JavaScript. This keeps Firebase costs at zero.

### How the Global Score works
When the user clicks "Run Global Benchmark" on the Leaderboard page:
1. All 8 preloaded algorithms execute sequentially via Web Workers
2. For each algorithm, `opsPerSec × 10` is added to a running total
3. The final integer is the "Global Score" (e.g., `1,128`)
4. This single score is submitted to Firestore under `benchmarkId: 'global_benchmark_suite'`
5. Higher score = faster hardware

### Deduplication
Same user + same hardware + same browser + same benchmark = same Firestore document ID. Running again overwrites the old score. This prevents leaderboard spam.

### Data collected silently (no user prompts)
- CPU threads: `navigator.hardwareConcurrency`
- RAM: `navigator.deviceMemory`
- GPU: WebGL `UNMASKED_RENDERER_WEBGL`
- Browser + version: parsed from `navigator.userAgent`
- OS: parsed from `navigator.userAgent`
- Screen resolution: `window.screen`

---

## 6. Statistical Analysis

The benchmark engine (`benchmarkEngine.js`) computes:
- **Median** (primary metric — resistant to outliers)
- **Mean**
- **Min / Max**
- **Standard Deviation**
- **P5 / P95 percentiles**
- **Operations per second** (`1000 / median`)

The "Duel" winner is only declared if the median difference exceeds `max(0.5 × combined stdDev, 2% of faster time)`. Otherwise it's declared a **statistical tie**.

---

## 7. Current State & Known Issues

### ✅ What works
- All 3 tabs (Code Duel, Hardware Bench, Leaderboard) render and function
- Monaco editors load with syntax highlighting
- Benchmarks run in Web Workers with progress overlay
- Results display with Chart.js (bar charts, distribution lines, horizontal bars)
- Firebase submission succeeds (global score submitted, shows in Firestore console)
- GitHub Actions workflow auto-deploys to GitHub Pages
- Production build (`vite build`) succeeds with all relative paths

### ⚠️ Pending / Known Issues
1. **Firebase Composite Index**: The global leaderboard requires a composite index (benchmarkId + globalScore desc). If it hasn't been created, the leaderboard will fail to load. The creation link is in Section 4 above.
2. **Firestore Security Rules**: Still in test mode. Need to lock down before the site gets public traffic.
3. **Monaco bundle size**: The full Monaco editor ships all language workers (~6.9MB for TypeScript alone). Could be optimized by only including the JavaScript language.
4. **Custom Code in Hardware Bench**: Custom code results are intentionally NOT submitted to the leaderboard (only the 8 standard algorithms are submitted). This is by design for fairness.
5. **npm audit**: 2 vulnerabilities in `dompurify` (a transitive dependency of `monaco-editor`). These are non-issues because we don't use Monaco to sanitize attacker-controlled HTML.

---

## 8. How to Run

```bash
cd BenchmarkCp
npm install
npm run dev
# Opens at http://localhost:5173/
```

Production build:
```bash
npm run build
# Output in dist/
```

---

## 9. GitHub Pages Deployment

Already configured via `.github/workflows/deploy.yml`:
- Triggers on push to `main`
- Runs `npm ci` → `npm run build`
- Uploads `dist/` folder to GitHub Pages
- **Requirement**: In repo Settings → Pages → Source, select "GitHub Actions"

---

## 10. What To Work On Next (potential)

- **UI polish**: Better responsive design for mobile, loading skeletons, more animations
- **More preloaded benchmarks**: Add algorithms like heap sort, BFS/DFS, dynamic programming
- **Export results**: Let users download their benchmark results as JSON/CSV
- **Share duels**: Generate shareable URLs for specific duel results
- **Firestore security rules**: Lock down writes, add rate limiting
- **Monaco optimization**: Only bundle the JavaScript language to cut bundle size
- **User accounts**: Optional login to track personal history over time
