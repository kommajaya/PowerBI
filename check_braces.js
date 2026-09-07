const fs = require('fs');
const src = fs.readFileSync('D:/PBI/SalesDashboard/gen_pages.js', 'utf8').split('\n');
const strip = s => s
  .replace(/'(?:[^'\\]|\\.)*'/g, '"X"')
  .replace(/`(?:\\`|[^`])*`/g, '"X"')
  .replace(/\/\/.*$/, '');
let d = 0, line = 0;
for (const raw of src) {
  line++;
  const s = strip(raw);
  for (const ch of s) {
    if (ch === '{' || ch === '[') d++;
    else if (ch === '}') { d--; if (d < 0) { console.log('extra } at line', line); process.exit(0); } }
    else if (ch === ']') { d--; if (d < 0) { console.log('extra ] at line', line); process.exit(0); } }
  }
}
console.log('final depth', d);