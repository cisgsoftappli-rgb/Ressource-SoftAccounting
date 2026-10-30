const fs = require('fs');
const h = fs.readFileSync('ecrans/etat_depense.html', 'utf8');
const m = [...h.matchAll(/"([^"\n]{2,90}) — ([^"\n]{2,120})"/g)];
console.log(m.length);
const uniq = [...new Set(m.map((x) => x[1] + ' — ' + x[2]))];
console.log(uniq.length);
console.log(uniq.slice(0, 40).join('\n'));
const i = h.indexOf('Ihasimbelo');
console.log(h.slice(i - 600, i + 200));
