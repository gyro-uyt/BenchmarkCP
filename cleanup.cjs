const fs = require('fs');
const glob = require('fs').readdirSync; // not needed, just manual
const files = [
    'e:\\BX\\BenchmarkCP\\src\\styles\\index.css',
    'e:\\BX\\BenchmarkCP\\src\\styles\\editor.css',
    'e:\\BX\\BenchmarkCP\\src\\styles\\results.css'
];

files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    // Remove standalone `-webkit-` that might be left over on a line
    content = content.replace(/^[ \t]*-webkit-[ \t]*$/gm, '');
    fs.writeFileSync(f, content, 'utf8');
});
