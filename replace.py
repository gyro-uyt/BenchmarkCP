import re
import os

html_path = r"e:\BX\BenchmarkCP\index.html"
with open(html_path, "r", encoding="utf-8") as f:
    content = f.read()

# Remove bg-gradient div entirely (lines 14-15)
content = re.sub(r'<!-- Background animated gradient -->\s*<div class="bg-gradient"></div>', '', content)

# ⚡ Brand icon
brand_icon = '<svg class="brand-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
content = content.replace('<span class="brand-icon">⚡</span>', brand_icon)

# ⚔️ Code Duel Tab
duel_icon = '<svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline></svg>'
content = content.replace('<span class="tab-icon">⚔️</span>\n          <span class="tab-label">Code Duel', duel_icon + '\n          <span class="tab-label">Code Duel')

# 🖥️ Hardware Tab
hw_icon = '<svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>'
content = content.replace('<span class="tab-icon">🖥️</span>\n          <span class="tab-label">Hardware Bench', hw_icon + '\n          <span class="tab-label">Hardware Bench')

# 🏆 Leaderboard Tab
lb_icon = '<svg class="tab-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>'
content = content.replace('<span class="tab-icon">🏆</span>\n          <span class="tab-label">Leaderboard', lb_icon + '\n          <span class="tab-label">Leaderboard')

# ⚔️ Duel! button
play_icon = '<svg class="run-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
content = content.replace('<span class="run-icon">⚔️</span>\n          <span class="run-text">Duel!</span>', play_icon + '\n          <span class="run-text">Duel!</span>')

# 📊 Results
content = content.replace('📊 Results', 'Results')

# 🏆 Winner Card
winner_svg = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path></svg>'
content = content.replace('<div class="winner-icon" id="winner-icon">🏆</div>', f'<div class="winner-icon" id="winner-icon">{winner_svg}</div>')

# 🔲 CPU
cpu_svg = '<svg class="hw-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>'
content = content.replace('<span class="hw-icon">🔲</span>', cpu_svg)

# 💾 RAM
ram_svg = '<svg class="hw-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>'
content = content.replace('<span class="hw-icon">💾</span>', ram_svg)

# 🎮 GPU
gpu_svg = '<svg class="hw-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>'
content = content.replace('<span class="hw-icon">🎮</span>', gpu_svg)

# 🌐 Browser
globe_svg = '<svg class="hw-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>'
content = content.replace('<span class="hw-icon">🌐</span>', globe_svg)

# 🚀 Run Selected
content = content.replace('<span class="run-icon">🚀</span>', play_icon)

# 🔥 Run All & Global
zap_icon = '<svg class="run-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>'
content = content.replace('<span class="run-icon">🔥</span>', zap_icon)

# 🚀 Benchmark Results & 🏆 Top Scores
content = content.replace('🚀 Benchmark Results', 'Benchmark Results')
content = content.replace('🏆 Top Scores', 'Top Scores')

with open(html_path, "w", encoding="utf-8") as f:
    f.write(content)
