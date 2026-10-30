// Met les codes de démonstration des plans en conformité avec la configuration des plans (niveaux : format et nombre de caractères).
// Code d'un niveau n = code du parent + segment de ce niveau (longueur et format définis dans « Configuration des plans »).
// Les libellés, hiérarchies et valeurs complémentaires sont conservés ; seuls les codes sont régénérés (sauf ceux du niveau 1 déjà conformes).
const fs = require('fs');
const f = 'ecrans/plans_donnees.json';
const P = JSON.parse(fs.readFileSync(f, 'utf8').replace(/^﻿/, ''));
const N = 'N', A = 'A', X = 'X'; // numérique, alphabétique, alphanumérique
const CFG = {
  pl_comptable: [[N, 1], [N, 2], [N, 2], [N, 2]],
  pl_activite: [[N, 1], [X, 2], [X, 4]],
  pl_budget: [[N, 2], [N, 2], [N, 3]],
  pl_financier: [[N, 2], [X, 2]],
  pl_geo: [[N, 2], [X, 2], [X, 3]]
};
for (let n = 5; n <= 10; n++) CFG['pl_' + n] = [[X, 2], [X, 3]];
const RE = { N: /^\d+$/, A: /^[A-Z]+$/, X: /^[A-Z0-9]+$/ };
function seg(fmt, larg, i) { // i : rang (1, 2, 3…) du fils sous son parent
  if (fmt === N) return String(i).padStart(larg, '0');
  if (fmt === A) { let s = '', k = i - 1; do { s = String.fromCharCode(65 + (k % 26)) + s; k = Math.floor(k / 26) - 1; } while (k >= 0); return s.padStart(larg, 'A'); }
  return i.toString(36).toUpperCase().padStart(larg, '0');
}
P.forEach((p) => {
  const niv = CFG[p.id]; if (!niv) return; // Tiers et Journaux : pas de configuration de niveaux
  const nouveau = {}, rang = {}, niveau = {}, ancien = {};
  p.lignes.forEach((l) => { ancien[l[0]] = l; });
  const lvl = (c, vu = {}) => { const l = ancien[c]; if (!l || vu[c]) return 1; vu[c] = 1; return l[2] ? 1 + lvl(l[2], vu) : 1; };
  p.lignes.forEach((l) => {
    const n = lvl(l[0]); if (n > niv.length) throw new Error(p.id + ' : niveau ' + n + ' absent de la configuration');
    const [fmt, larg] = niv[n - 1], parent = l[2] ? nouveau[l[2]] : '';
    let code;
    if (n === 1 && l[0].length === larg && RE[fmt].test(l[0].toUpperCase())) code = l[0].toUpperCase(); // niveau 1 déjà conforme : conservé
    else { rang[parent] = (rang[parent] || 0) + 1; code = parent + seg(fmt, larg, rang[parent]); }
    nouveau[l[0]] = code; niveau[code] = n;
  });
  p.lignes = p.lignes.map((l) => [nouveau[l[0]], l[1], l[2] ? nouveau[l[2]] : ''].concat(l.slice(3)));
  const vus = new Set(); p.lignes.forEach((l) => { if (vus.has(l[0])) throw new Error(p.id + ' : doublon ' + l[0]); vus.add(l[0]); });
});
fs.writeFileSync(f, JSON.stringify(P), 'utf8');
console.log('codes normalisés pour ' + Object.keys(CFG).length + ' plans');
