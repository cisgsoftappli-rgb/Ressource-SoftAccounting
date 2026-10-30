// Pseudonymise les noms de personnes dans les données Journal et Grand livre de la variante PUBLIÉE (import_plans/publication/).
// Les fichiers sources (ecrans/) ne sont jamais modifiés.
const fs = require('fs');
const NOMS = `VINCENT JOSEPH RODDY CHAD CHABANI NAINA TAHINA TSANTA SOLONIAINA TAFIKA FANANTENANA KOTOVAOARIVELO JUX SOLINSKI RABEMANANJARA
JOMA JENNY CHRISTIAN FALY RAVAKA ABDOULAYE SAKHO RONALD CHARLY AMÉDÉE AMEDEE TIANA SYLVIE NARINDRA FABIENNE FELANA IANDRY ANDRY
RIANASOA RIVO ROBINSON ROBISON TOVOHERITIANA EMANOEL GINOT FANOMEZANA MANASSE TSIKY MAHEFA DIMBINIRINA EMMANUEL JEANNOT ONJA ROJO MARIA
LOVA BELAHY MANITRINIAINA NJIVATIANA MIANDRY HERINTIANA SARINDRA HELISOA HAINGO MBOLASOA KANTO OELISOA LUCAS DIEUDONNE VIRGIANA DALIA
SOATSARA VANOMARO TOMBO ELSON JOELINET SOAFANIRY CASIMIR RABESOA NIRINA PAZA IVANA ANAELLE GABRIELLA FRANCK CHERY TODISOA ROTSY RIANATSARA
LALATIANA FALIERY FALIUHERY HERILAZA SISSOKO AGUADOUGOU AGUADOUDOU JACQUIS HARIVELO WILLIAM JEAN BAPTISTE HERY GRACIA NIVOMBOAHANGY
HARSON ANDRIAMANETSY TSIMAMBOLY VALERY LAURENT THIERRY IHASIMBELO`.split(/\s+/).filter(Boolean);
const PREFIXES = '(?:RAKOTO|RANDRIA|RAZAFI|RASOLO|RAMIAN|RAMER|RAMAH|RAMAR|RAJAO|RATOVO|RABEM|RABET|RANAIVO|RANDRO|RANOMEN|RAZAKA|ANDRIA|RAMIANDR)';
const L = '\\p{L}';
const re = new RegExp('(?<!' + L + ')(?:' + NOMS.join('|') + '|' + PREFIXES + L + '{3,})(?!' + L + ')', 'giu');
const SEQ = new RegExp('(?<!' + L + ')(?:' + NOMS.join('|') + '|' + PREFIXES + L + '{3,})(?!' + L + ')(?:[ \\t]+(?:' + NOMS.join('|') + '|' + PREFIXES + L + '{3,})(?!' + L + '))*', 'giu');
const map = new Map();
function pseudo(m) {
  const k = m.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ');
  if (!map.has(k)) map.set(k, 'PERSONNE ' + String(map.size + 1).padStart(3, '0'));
  return map.get(k);
}
const an = (t) => String(t).replace(SEQ, pseudo);

// Journal
const j = fs.readFileSync('ecrans/journal_donnees.json', 'utf8');
const bom = j.charCodeAt(0) === 0xFEFF ? '﻿' : '';
const J = JSON.parse(j.replace(/^﻿/, ''));
J.forEach((r) => { Object.keys(r).forEach((k) => { if (typeof r[k] === "string") r[k] = an(r[k]); }); });
fs.writeFileSync('import_plans/publication/journal_donnees.json', bom + JSON.stringify(J));

// Grand livre
const g = fs.readFileSync('ecrans/glg_donnees.js', 'utf8');
const m = g.match(/^([\s\S]*?window\.GLG_COMPTES=)(\[[\s\S]*\])(;?\s*)$/);
const C = JSON.parse(m[2]);
C.forEach((c) => { c.l = an(c.l); c.L = c.L.map(an); });
fs.writeFileSync('import_plans/publication/glg_donnees.js', m[1] + JSON.stringify(C) + m[3]);
console.log('pseudonymes distincts :', map.size);

// État de dépense : bénéficiaires (nom + adresse) et libellés
let e = fs.readFileSync('ecrans/etat_depense.html', 'utf8');
e = an(e).replace(/(PERSONNE \d{3})(?: LI)? — [^"\n\\]*/g, '$1 — Antananarivo');
fs.writeFileSync('import_plans/publication/etat_depense.html', e);
console.log('etat_depense ok');

// Exemples de désigner (SOE / IRSA) et de modèle d'état DRF : noms de salariés et de bénéficiaires remplacés par des libellés neutres
function neutre(src, dst, paires) {
  let t = fs.readFileSync(src, 'utf8');
  paires.forEach(([a, b]) => { if (t.split(a).length < 2) throw new Error('introuvable : ' + a); t = t.split(a).join(b); });
  fs.writeFileSync(dst, t);
}
neutre('ecrans/designer_soe.html', 'import_plans/publication/designer_soe.html', [["'RAKOTO Jean Marc'", "'Salarié exemple 1'"], ["'RANDRIA Voahangy'", "'Salarié exemple 2'"], ["'RASOA Hanitra'", "'Salarié exemple 3'"]]);
neutre('ecrans/modele_etat_drf.html', 'import_plans/publication/modele_etat_drf.html', [["'BEMANAMBY Edmond - MANAKARA'", "'Bénéficiaire exemple 1 - MANAKARA'"], ["'FANOMEZANTSOA Zina Seta Abrahama Vincent - Farafangana'", "'Bénéficiaire exemple 2 - Farafangana'"], ["'RAKOTOSON Lalaina Billie - MADAGASCAR'", "'Bénéficiaire exemple 3 - MADAGASCAR'"]]);
console.log('exemples ok');

// Gestion des accès : comptes utilisateurs d'exemple → identités neutres
{
  let t = fs.readFileSync('ecrans/gestion_acces.html', 'utf8'), i = 0;
  t = t.replace(/\{ id: '(ANDRY|ANDY|ANGELA|ANTHONY|HERY)', nom: '[^']*', groupe: '([^']*)', email: '[^']*', actif: true \}/g, (m, id, g) => { i++; return "{ id: 'USER0" + i + "', nom: 'Utilisateur " + i + "', groupe: '" + g + "', email: 'utilisateur" + i + "@exemple.mg', actif: true }"; });
  if (i !== 5) throw new Error('utilisateurs : ' + i);
  fs.writeFileSync('import_plans/publication/gestion_acces.html', t);
}
