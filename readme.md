# BenchmarkCP

## Project Overview
BenchmarkCP is a web-based performance benchmarking application designed to let users write, test, and compare JavaScript code snippets in real-time. It also includes hardware detection and a global leaderboard to see how different devices handle specific computational tasks.

## Why We Are Building This
The goal is to provide developers with an accessible, in-browser tool to test code performance (execution time, efficiency) across different implementations (Code Duel) and to benchmark their hardware's capabilities directly from the browser.

## What We Have Done So Far
1. **Project Setup & Tooling**:
   - Initialized a Vanilla JS project using **Vite**.
   - Set up standard configuration, including a build step that transpiles code.
   - Configured **GitHub Actions** (`.github/workflows/deploy.yml`) for automated deployment to GitHub Pages on pushes to the `main` branch.

2. **Core Tech Stack**:
   - **Frontend**: HTML, CSS, Vanilla JavaScript (ES Modules).
   - **Code Editor**: Integrated **Monaco Editor** for a rich, syntax-highlighted coding experience.
   - **Visualizations**: Added **Chart.js** for rendering benchmark results.
   - **Backend/Database**: Integrated **Firebase** for the global leaderboard functionality.

3. **Key Features Implemented**:
   - **Code Duel Mode**: Allows users to write and compare two different JavaScript snippets side-by-side to see which runs faster.
   - **Hardware Benchmarking**: Tests the local machine's performance using predefined computational workloads.
   - **Hardware Detection**: Automatically detects the user's system specs (CPU Cores, estimated RAM, GPU, Browser version) and displays it on the UI.
   - **Global Leaderboard**: A Firebase-backed system to submit and view benchmark scores globally.
   - **Web Workers**: Utilizes Web Workers (`benchmarkWorker.js`) to run heavy benchmarks off the main thread, preventing UI freezing.

4. **Security & Dependency Audit**:
   - We recently ran an `npm audit`. Found 2 vulnerabilities related to `dompurify` (a dependency of `monaco-editor`).
   - Concluded that since we only use Monaco for basic editing and do not sanitize attacker-controlled HTML, the vulnerabilities are a non-issue for our specific use case, and the current state is safe to proceed without downgrading Monaco (which would be a breaking change).

## Current Status
The v1.0 of the application has been built and committed to the repository. The build passes successfully, and the codebase is structured cleanly into modules (`src/modules/`). The app is ready for further feature development, UI polish, or bug fixing in subsequent iterations.
