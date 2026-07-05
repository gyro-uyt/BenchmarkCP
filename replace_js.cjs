const fs = require('fs');

function replaceInFile(path, regexOrStr, replacement) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(regexOrStr, replacement);
    fs.writeFileSync(path, content, 'utf8');
}

const pbPath = 'e:\\BX\\BenchmarkCP\\src\\modules\\preloadedBenchmarks.js';
const rdPath = 'e:\\BX\\BenchmarkCP\\src\\modules\\resultsDisplay.js';
const hbPath = 'e:\\BX\\BenchmarkCP\\src\\modules\\hardwareBench.js';
const glPath = 'e:\\BX\\BenchmarkCP\\src\\modules\\globalLeaderboard.js';
const fsPath = 'e:\\BX\\BenchmarkCP\\src\\modules\\firebaseService.js';

// Preloaded Benchmarks
// Replace ⚡ and ✍️ with empty strings or SVG
const zapIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
replaceInFile(pbPath, /icon:\s*'⚡',/g, `icon: \`${zapIconSvg}\`,`);

// Results Display
// Replace 🏆 with SVG
const crownSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>`;
replaceInFile(rdPath, /winnerIcon\.textContent\s*=\s*'🏆';/g, `winnerIcon.innerHTML = \`${crownSvg}\`;`);

// Hardware Bench
const penSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`;
replaceInFile(hbPath, /<span class="bench-item-icon">✍️<\/span>/g, `<span class="bench-item-icon">${penSvg}</span>`);
replaceInFile(hbPath, /'✍️ Custom Code'/g, `'Custom Code'`);
replaceInFile(hbPath, /icon:\s*'✍️',/g, `icon: \`${penSvg}\`,`);

// Global Leaderboard
replaceInFile(glPath, /No global scores yet\. Be the first! 🚀/g, `No global scores yet. Be the first!`);
replaceInFile(glPath, /return\s*'🌐';/g, `return \`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>\`;`);
// Also fix the fact that browser icon in glPath might be used via innerHTML now if it was innerText before.
// In globalLeaderboard.js, line 144 is probably:
// `<td class="lb-browser"><span class="lb-icon">${getBrowserIcon(browser)}</span> ${browser}</td>`
// Since getBrowserIcon returns SVG, it will render correctly as long as it's part of template string.

// Firebase Service
replaceInFile(fsPath, /benchmarkIcon:\s*result\.icon\s*\|\|\s*'⚡',/g, `benchmarkIcon: result.icon || \`${zapIconSvg}\`,`);

// Now let's handle CSS. We'll just overwrite index.css with our premium styles.
const cssPath = 'e:\\BX\\BenchmarkCP\\src\\styles\\index.css';
let cssContent = fs.readFileSync(cssPath, 'utf8');

// Colors
cssContent = cssContent.replace(/--bg-primary:\s*#[0-9a-fA-F]+;/g, '--bg-primary: #000000;');
cssContent = cssContent.replace(/--bg-secondary:\s*#[0-9a-fA-F]+;/g, '--bg-secondary: #0A0A0A;');
cssContent = cssContent.replace(/--bg-tertiary:\s*#[0-9a-fA-F]+;/g, '--bg-tertiary: #111111;');
cssContent = cssContent.replace(/--bg-card:\s*[^;]+;/g, '--bg-card: rgba(10, 10, 10, 0.8);');
cssContent = cssContent.replace(/--bg-card-hover:\s*[^;]+;/g, '--bg-card-hover: rgba(20, 20, 20, 0.9);');
cssContent = cssContent.replace(/--glass-border:\s*[^;]+;/g, '--glass-border: rgba(255, 255, 255, 0.1);');
cssContent = cssContent.replace(/--glass-bg:\s*[^;]+;/g, '--glass-bg: #0A0A0A;');

// Drop Glows
cssContent = cssContent.replace(/--shadow-glow-purple:\s*[^;]+;/g, '--shadow-glow-purple: 0 4px 14px 0 rgba(0, 0, 0, 0.39);');
cssContent = cssContent.replace(/--shadow-glow-cyan:\s*[^;]+;/g, '--shadow-glow-cyan: 0 4px 14px 0 rgba(0, 0, 0, 0.39);');

// Change Gradients to flat or subtle
cssContent = cssContent.replace(/--gradient-primary:\s*[^;]+;/g, '--gradient-primary: linear-gradient(180deg, #FFFFFF 0%, #E0E0E0 100%);'); // Run button will be white
cssContent = cssContent.replace(/--gradient-a:\s*[^;]+;/g, '--gradient-a: #333333;');
cssContent = cssContent.replace(/--gradient-b:\s*[^;]+;/g, '--gradient-b: #333333;');
cssContent = cssContent.replace(/--gradient-green:\s*[^;]+;/g, '--gradient-green: #10B981;');

// Remove bg-gradient animations from index.css
cssContent = cssContent.replace(/\/\*\s*---\s*Animated Background\s*---\s*\*\/[\s\S]*?\/\*\s*---\s*App Shell\s*---\s*\*\//g, '/* --- App Shell --- */');

// Navbar transparent
cssContent = cssContent.replace(/rgba\(11, 15, 26, 0.85\)/g, 'rgba(0, 0, 0, 0.85)');

// Active tab button
cssContent = cssContent.replace(/\.tab-btn\.active\s*\{[\s\S]*?\}/g, `.tab-btn.active {\n  background: #FFFFFF;\n  color: #000000;\n  box-shadow: 0 1px 2px rgba(0,0,0,0.1);\n}`);

// Run Button adjustments (since gradient is now white, text must be black)
cssContent = cssContent.replace(/\.run-btn\s*\{([\s\S]*?color:\s*)white;/g, `.run-btn {$1#000000;`);
cssContent = cssContent.replace(/box-shadow:\s*0\s*0\s*40px\s*rgba\(124,\s*58,\s*237,\s*0\.5\);/g, 'box-shadow: 0 4px 14px 0 rgba(255, 255, 255, 0.1);');

// Remove backdrop-filter from glass-card and others to avoid fuzzy looks
cssContent = cssContent.replace(/backdrop-filter:\s*blur\(var\(--glass-blur\)\);/g, '');
cssContent = cssContent.replace(/-webkit-backdrop-filter:\s*blur\(var\(--glass-blur\)\);/g, '');

fs.writeFileSync(cssPath, cssContent, 'utf8');

// Editor CSS overrides
const ecPath = 'e:\\BX\\BenchmarkCP\\src\\styles\\editor.css';
let ecContent = fs.readFileSync(ecPath, 'utf8');
ecContent = ecContent.replace(/background:\s*rgba\(0, 0, 0, 0\.3\);/g, 'background: #0A0A0A;'); // editor header
ecContent = ecContent.replace(/\.editor-divider\s*\{([\s\S]*?)width:\s*48px;([\s\S]*?)background:\s*rgba\(0, 0, 0, 0\.2\);/g, `.editor-divider {$1width: 1px;$2background: var(--glass-border);`); // Divider to thin line
ecContent = ecContent.replace(/\.divider-label\s*\{[\s\S]*?\}/g, `.divider-label {\n  display: none;\n}`); // Hide VS pill
fs.writeFileSync(ecPath, ecContent, 'utf8');

// Results CSS overrides
const rcPath = 'e:\\BX\\BenchmarkCP\\src\\styles\\results.css';
let rcContent = fs.readFileSync(rcPath, 'utf8');
// Results Title - make it stark white instead of gradient
rcContent = rcContent.replace(/\.results-title\s*\{([\s\S]*?)-webkit-background-clip[\s\S]*?\}/g, `.results-title {$1 color: #FFFFFF;\n}`);
rcContent = rcContent.replace(/\.hero-title\s*\{([\s\S]*?)-webkit-background-clip[\s\S]*?\}/g, `.hero-title {$1 color: #FFFFFF;\n}`);
rcContent = rcContent.replace(/\.hw-result-value\s*\{([\s\S]*?)-webkit-background-clip[\s\S]*?\}/g, `.hw-result-value {$1 color: #FFFFFF;\n}`);
// Winner card background
rcContent = rcContent.replace(/\.winner-card::before\s*\{[\s\S]*?\}/g, `.winner-card::before {\n  display: none;\n}`);
// Run all btn text
rcContent = rcContent.replace(/\.bench-run-all-btn\s*\{([\s\S]*?)background:\s*var\(--gradient-b\);/g, `.bench-run-all-btn {$1background: #FFFFFF; color: #000000;`);
rcContent = rcContent.replace(/\.bench-run-all-btn:hover\s*\{[\s\S]*?\}/g, `.bench-run-all-btn:hover {\n  box-shadow: 0 4px 14px 0 rgba(255, 255, 255, 0.1);\n}`);
// Leaderboard primary run btn
rcContent = rcContent.replace(/\.primary-run-btn\s*\{([\s\S]*?)background:\s*var\(--gradient-primary\);/g, `.primary-run-btn {$1background: #FFFFFF; color: #000000;`);
rcContent = rcContent.replace(/\.primary-run-btn:hover\s*\{[\s\S]*?\}/g, `.primary-run-btn:hover {\n  transform: scale(1.02);\n  box-shadow: 0 4px 14px 0 rgba(255, 255, 255, 0.1);\n}`);

fs.writeFileSync(rcPath, rcContent, 'utf8');
