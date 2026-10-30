const h = require('fs').readFileSync('SoftCompta_Administration_entite_publication.html', 'utf8');
for (const w of ['RAKOTO', 'RANDRIA', 'RAZAFI', 'ANDRIAMA', 'SISSOKO', 'Faly']) {
  let i = -1, n = 0;
  while ((i = h.indexOf(w, i + 1)) >= 0 && n < 4) { n++; console.log(w, '=>', JSON.stringify(h.slice(Math.max(0, i - 70), i + 60))); }
}
