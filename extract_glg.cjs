// Extrait les données du Grand livre général depuis integrer/*.txt vers ecrans/glg_donnees.js (outil de build, une fois)
const fs = require('fs');
const h = fs.readFileSync('integrer/html lang=en data-beasties-containe.txt', 'utf8');
const a = h.indexOf('<tbody', h.indexOf('<app-glg-resultat')), b = h.indexOf('</tbody>', a);
const body = h.slice(a, b).replace(/ _ngcontent-ng-c\d+=""/g, '');
const txt = (s) => s.replace(/<!---->/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&quot;/g, '"').trim();
const out = []; let cur;
for (const tr of body.match(/<tr[\s\S]*?<\/tr>/g)) {
  const cls = (tr.match(/class="(row-[a-z]+)/) || [])[1];
  const t = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => txt(m[1]));
  const nz = (x) => (x === '0,00' ? '' : x);
  if (cls === 'row-groupe') { cur = { c: t[2], l: t[4], L: [] }; out.push(cur); }
  else if (cls === 'row-ligne') {
    cur.L.push([t[0], t[1] === t[0] ? '' : t[1], t[2], t[3], t[4], t[5], t[6], t[9], t[10], nz(t[11]), nz(t[12]), t.slice(13, 23).join('|').replace(/\|+$/, ''), t[23] || ''].join('\t'));
  } else if (cls === 'row-total') cur.T = [t[1], t[2]];
}
const js = '// Grand livre général 2026 (capture) : comptes {c code, l libellé, T [débit, crédit], L lignes}\n' +
  '// ligne = date compta, date pièce (vide = idem), réf, ligne budg., contrat, JL, n° pièce, contrepartie, libellé, débit, crédit, plans 1-10 (séparés par |), regroupement — séparés par tabulation. Site : Siège.\n' +
  'window.GLG_COMPTES=' + JSON.stringify(out) + ';\n';
fs.writeFileSync('ecrans/glg_donnees.js', js);
console.log(out.length, out.reduce((s, c) => s + c.L.length, 0), js.length);
