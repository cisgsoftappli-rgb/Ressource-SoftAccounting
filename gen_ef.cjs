// Génère les écrans États financiers à partir des écrans du bilan (mêmes principes : onglets Saisie / Liste, barre d'actions,
// fenêtre de critères, tableaux en 13 px). Chaque écran reçoit son propre préfixe d'attributs data-* pour ne pas entrer en conflit.
const fs = require('fs');
const lire = (f) => fs.readFileSync(f, 'utf8');
const tout = (s, a, b) => s.split(a).join(b);

function param(cfg) {
  let s = lire('ecrans/bilan_param.html');
  s = s.replace(/^<!--[\s\S]*?-->\n/, '<!--\n  Écran « ' + cfg.titre + ' » (États financiers › ' + cfg.rub + ' › Paramétrages) — généré par gen_ef.cjs à partir du paramétrage du bilan.\n  Modèles, lignes, saisie / liste en onglets, fourchettes selon la nature. Données en mémoire. Ne pas nommer de fonction « $$ » (build.cjs).\n-->\n');
  const p = cfg.p;
  s = tout(s, 'data-bp', 'data-' + p); s = tout(s, 'bpTab', p + 'Tab'); s = tout(s, 'bpPan', p + 'Pan');
  s = tout(s, 'bp-dt', p + '-dt'); s = tout(s, 'bp-type', p + '-type'); s = tout(s, 'bp-nature', p + '-nature');
  s = tout(s, 'Paramétrage du bilan', cfg.titre); s = tout(s, 'Lignes du bilan', 'Lignes du ' + cfg.court);
  s = tout(s, '>Actif</label>', '>' + cfg.t1 + '</label>'); s = tout(s, '>Passif</label>', '>' + cfg.t2 + '</label>');
  s = tout(s, "l.type === 'actif' ? 'A' : 'P'", "l.type === 'actif' ? '" + cfg.l1 + "' : '" + cfg.l2 + "'");
  s = tout(s, "'Choisissez le type (Actif ou Passif).'", "'Choisissez le type (" + cfg.t1 + " ou " + cfg.t2 + ").'");
  const a = s.indexOf('var modeles = ['), b = s.indexOf('var cur = null');
  if (a < 0 || b < 0) throw new Error('données introuvables');
  s = s.slice(0, a) + 'var modeles = ' + cfg.donnees + ';\n  ' + s.slice(b);
  fs.writeFileSync('ecrans/' + cfg.fichier, s);
}

function edition(cfg) {
  let s = lire('ecrans/bilan_edition.html');
  s = s.replace(/^<!--[\s\S]*?-->\n/, '<!--\n  Écran « ' + cfg.titre + ' » (États financiers › ' + cfg.rub + ' › Édition) — généré par gen_ef.cjs à partir de l\'édition du bilan.\n  Critères et lignes de titre dans une fenêtre modale ouverte à l\'arrivée, puis état édité. Données en mémoire.\n-->\n');
  const p = cfg.p;
  s = tout(s, 'Bilan arrêté au', cfg.arrete || 'Arrêté au');
  s = tout(s, 'be-debut', p + '-debut'); s = tout(s, 'be-fin', p + '-fin'); s = tout(s, 'data-be', 'data-' + p); s = tout(s, 'be-dt', p + '-dt');
  s = tout(s, "'#biledit'", "'#" + cfg.hash + "'");
  s = tout(s, 'Édition du bilan', cfg.titre); s = tout(s, 'Bilan édité', cfg.edite); s = tout(s, 'Aucun bilan édité', cfg.aucun);
  s = tout(s, 'Export du bilan', cfg.export); s = tout(s, 'value="BILAN"', 'value="' + cfg.defaut + '"'); s = tout(s, "T.titre.value = 'BILAN'", "T.titre.value = '" + cfg.defaut + "'");
  const a = s.indexOf('var LIGNES = ['), b = s.indexOf('];', a) + 2;
  if (a < 0 || b < 2) throw new Error('lignes introuvables');
  s = s.slice(0, a) + 'var LIGNES = ' + cfg.lignes + ';' + s.slice(b);
  if (cfg.periodes) {
    const i = s.indexOf('function periodes() {'), j = s.indexOf('\n  }\n', i) + 5;
    if (i < 0) throw new Error('periodes introuvable');
    s = s.slice(0, i) + cfg.periodes + '\n' + s.slice(j);
  }
  if (cfg.rendu) {
    const i = s.indexOf("q('[data-" + p + "-corps]').innerHTML = LIGNES.map"), j = s.indexOf(".join('');", i) + 10;
    if (i < 0) throw new Error('rendu introuvable');
    s = s.slice(0, i) + cfg.rendu.split('PFX').join(p) + s.slice(j);
    const t0 = s.indexOf('<table class="be-tb">'), t1 = s.indexOf('</thead>', t0) + 8;
    if (t0 < 0) throw new Error('thead introuvable');
    s = s.slice(0, t0) + '<table class="be-tb ' + (cfg.classe || 'ter') + '">' + cfg.thead + s.slice(t1);
    s = s.replace('.be-pan[hidden]{display:none}', () => '.be-pan[hidden]{display:none}\n' + cfg.css);
  }
  fs.writeFileSync('ecrans/' + cfg.fichier, s);
}

const L = "function L(code, ordre, libelle, type, nature, f, a)"; // (déjà défini dans le gabarit)
const modele = (id, lib, lignes) => "[{ id: '" + id + "', libelle: '" + lib + "', lignes: [\n    " + lignes.join(',\n    ') + "\n  ] }, { id: 'ALLEGE', libelle: 'Système allégé', lignes: [] }]";

param({
  fichier: 'cr_param.html', p: 'crp', titre: 'Paramétrage du compte de résultat', court: 'compte de résultat', rub: 'Compte de résultat', t1: 'Charge', t2: 'Produit', l1: 'C', l2: 'P',
  donnees: modele('1', 'Compte de résultat du projet AD2M-II', [
    "L('A', 10, 'Achats consommés', 'actif', 'titre')",
    "L('A1', 20, 'Autres approvisionnements', 'actif', 'ligne', [{ d: '6021', f: '6029', s: 'D' }])",
    "L('A2', 30, 'Carburants et lubrifiants', 'actif', 'ligne', [{ d: '6061', f: '6069', s: 'D' }])",
    "L('A3', 40, 'Autres fournitures', 'actif', 'ligne', [{ d: '6081', f: '6089', s: 'D' }])",
    "L('AT', 50, '*** TOTAL Achats consommés ***', 'actif', 'soustotal')",
    "L('S', 60, 'Services extérieurs', 'actif', 'titre')",
    "L('S1', 70, 'Locations', 'actif', 'ligne', [{ d: '6131', f: '6139', s: 'D' }])",
    "L('S2', 80, 'Entretiens, réparations et maintenances', 'actif', 'ligne', [{ d: '6151', f: '6159', s: 'D' }])",
    "L('S3', 90, 'Assurances', 'actif', 'ligne', [{ d: '6161', f: '6169', s: 'D' }])",
    "L('ST', 100, '*** TOTAL Services extérieurs ***', 'actif', 'soustotal')",
    "L('P', 110, 'Charges de personnel', 'actif', 'titre')",
    "L('P1', 120, 'Rémunération du personnel', 'actif', 'ligne', [{ d: '6611', f: '6619', s: 'D' }])",
    "L('P2', 130, 'Cotisations aux organismes sociaux', 'actif', 'ligne', [{ d: '6641', f: '6649', s: 'D' }])",
    "L('PT', 140, '*** TOTAL Charges de personnel ***', 'actif', 'soustotal')",
    "L('GC', 150, 'TOTAL GÉNÉRAL CHARGES', 'actif', 'total')",
    "L('GP', 160, 'TOTAL GÉNÉRAL PRODUITS', 'passif', 'total')",
    "L('XD', 170, 'EXCÉDENT / DÉFICIT', 'passif', 'resultat')"
  ])
});
param({
  fichier: 'er_param.html', p: 'erp', titre: 'Paramétrage des emplois et ressources', court: 'tableau emplois et ressources', rub: 'Emplois et ressources', t1: 'Emploi', t2: 'Ressource', l1: 'E', l2: 'R',
  donnees: modele('1', 'Tableau des recettes et des paiements (Modèle II)', [
    "L('R', 10, 'I - RESSOURCES', 'passif', 'titre')",
    "L('R1', 20, 'Contributions reçues FIDA', 'passif', 'ligne', [{ d: '1011', f: '1019', s: 'C' }])",
    "L('R2', 30, 'Contributions reçues Etat Malagasy', 'passif', 'ligne', [{ d: '1021', f: '1029', s: 'C' }])",
    "L('R3', 40, 'Paiement direct', 'passif', 'ligne', [{ d: '1051', f: '1059', s: 'C' }])",
    "L('RT', 50, 'Total I - RESSOURCES', 'passif', 'formule')",
    "L('E', 60, 'II - EMPLOIS (Par catégorie)', 'actif', 'titre')",
    "L('E1', 70, 'I-PRET FIDA', 'actif', 'soustitre')",
    "L('E11', 80, 'Consultations', 'actif', 'ligne', [{ d: '6211', f: '6219', s: 'D' }])",
    "L('E12', 90, 'Travaux', 'actif', 'ligne', [{ d: '2311', f: '2319', s: 'D' }])",
    "L('ET', 100, 'Total II - EMPLOIS', 'actif', 'formule')",
    "L('EX', 110, 'Excédent / Déficit fonds sur emplois', 'passif', 'formule')"
  ])
});

edition({
  fichier: 'cr_edition.html', arrete: 'Compte de résultat arrêté au', p: 'cre', hash: 'cred', titre: 'Édition du compte de résultat', rub: 'Compte de résultat', edite: 'Compte de résultat édité', aucun: 'Aucun compte de résultat édité', export: 'Export du compte de résultat', defaut: 'COMPTE DE RESULTAT DU PROJET AD2M-II AU 31 10 2022',
  // Modèle fourni (capture « Compte de résultat du projet AD2M-II ») : lignes dans ecrans/cr_donnees.json (l, k, n, n1)
  lignes: fs.readFileSync('ecrans/cr_donnees.json', 'utf8').replace(/^﻿/, '').trim(),
  thead: '<thead><tr><th class="c">Libellé</th><th class="c">Exercice N</th><th class="c">Exercice N-1</th></tr></thead>',
  css: '.be-tb.ter th{background:#2E427B;color:#fff;text-align:center;letter-spacing:0;text-transform:none;font-size:13px;border-bottom:0}.be-tb.ter th.c{text-align:center}.be-tb.ter td.r{white-space:nowrap}.be-tb.ter tr.t td{font-weight:700;color:#0B1332}.be-tb.ter tr.l td:first-child{padding-left:28px;font-weight:600}.be-tb.ter tr.s td{font-weight:700;background:#F5F7F9}.be-tb.ter tr.g td{font-weight:700;background:#E9EBF0}.be-res{overflow-x:auto!important}.be-tb.ter{min-width:560px}',
  rendu: "q('[data-PFX-corps]').innerHTML = LIGNES.map(function (r) { return '<tr class=\"' + r.k + '\"><td>' + r.l.replace(/&/g, '&amp;') + '</td><td class=\"r\">' + r.n + '</td><td class=\"r\">' + r.n1 + '</td></tr>'; }).join('');"
});
edition({
  fichier: 'er_edition.html', arrete: 'Tableau arrêté au', p: 'ere', hash: 'ered', titre: 'Édition des emplois et ressources', rub: 'Emplois et ressources', edite: 'Emplois et ressources édités', aucun: 'Aucun tableau emplois et ressources édité', export: 'Export des emplois et ressources', defaut: 'TABLEAU DES RECETTES ET DES PAIEMENTS (MODELE II)',
  // Modèle fourni : « Tableau des recettes et des paiements (Modèle II) » — lignes lues dans ecrans/ter_donnees.json (l, n, b, c, d, e)
  lignes: fs.readFileSync('ecrans/ter_donnees.json', 'utf8').replace(/^﻿/, '').trim(),
  thead: '<thead><tr><th>Désignation</th><th class="r" colspan="2">Trimestre</th><th class="r" colspan="2">Cumulatif</th></tr></thead>',
  css: '.be-tb.ter td:first-child{white-space:normal}.be-tb.ter tr.soustitre td:first-child{padding-left:28px;font-weight:600}.be-tb.ter tr.ligne td:first-child{padding-left:44px}.be-tb.ter tr.total td{background:#F5F7F9}.be-tb.ter td.r,.be-tb.ter th.r{white-space:nowrap}.be-tb.ter{min-width:820px}.be-res{overflow-x:auto!important}.be-tb.ter td:first-child{min-width:260px}',
  rendu: "q('[data-PFX-corps]').innerHTML = LIGNES.map(function (r) { var k = r.n === 0 ? (/^Total/.test(r.l) ? 'total' : 'titre') : r.n <= 6 ? 'soustitre' : 'ligne'; function c(v) { return '<td class=\"r\">' + v + '</td>'; } return '<tr class=\"' + k + '\"><td>' + r.l.replace(/&/g, '&amp;') + '</td>' + c(r.b) + c(r.c) + c(r.d) + c(r.e) + '</tr>'; }).join('');"
});
edition({
  fichier: 'tft_edition.html', arrete: 'Tableau arrêté au', p: 'tfe', hash: 'tfted', titre: 'Édition du tableau de flux de trésorerie', rub: 'Tableau de flux de trésorerie', edite: 'Tableau de flux de trésorerie édité', aucun: 'Aucun tableau de flux de trésorerie édité', export: 'Export du tableau de flux de trésorerie', defaut: 'TABLEAU DE FLUX DE TRÉSORERIE',
  // Modèle fourni (capture « TFT ») : lignes et montants de démonstration dans ecrans/tft_donnees.json (l, n, k, note, a, b)
  lignes: fs.readFileSync('ecrans/tft_donnees.json', 'utf8').replace(/^\uFEFF/, '').trim(),
  thead: '<thead><tr><th class="c">Libellé</th><th class="c">Note</th><th class="c">Exercice N</th><th class="c">Exercice N-1</th></tr></thead>',
  css: '.be-tb.tft th{background:#2E427B;color:#fff;text-align:center;letter-spacing:0;text-transform:none;font-size:13px;border-bottom:0}.be-tb.tft td.r,.be-tb.tft th.r{white-space:nowrap}.be-tb.tft tr.t td{font-weight:700;color:#0B1332}.be-tb.tft tr.s td{font-weight:600}.be-tb.tft td.c{text-align:center;width:60px}.be-res{overflow-x:auto!important}.be-tb.tft{min-width:640px}',
  classe: 'tft',
  rendu: "q('[data-PFX-corps]').innerHTML = LIGNES.map(function (r) { return '<tr class=\"' + r.k + '\"><td style=\"padding-left:' + (16 + r.n * 18) + 'px\">' + r.l.replace(/&/g, '&amp;') + '</td><td class=\"c\">' + r.note + '</td><td class=\"r\">' + r.a + '</td><td class=\"r\">' + r.b + '</td></tr>'; }).join('');"
});

// build.cjs : les écrans quittent la liste des pages vides
let b = lire('build.cjs');
const vides = b.match(/const EF_VIDES = \[[^\n]*\];/);
if (!vides) throw new Error('EF_VIDES introuvable');
b = b.replace(vides[0], () => 'const EF_VIDES = [];');
const ancre = "  `<div data-screen=\"tftparam\" style=\"display:none\">${read('ecrans/tft_param.html')}</div>` +";
if (!b.includes(ancre)) throw new Error('ancre build introuvable');
if (!b.includes("ecrans/cr_param.html")) {
  b = b.replace(ancre, () => ancre + '\n' + [['crparam', 'cr_param'], ['erparam', 'er_param'], ['cred', 'cr_edition'], ['ered', 'er_edition'], ['tfted', 'tft_edition']]
    .map(([id, f]) => "  `<div data-screen=\"" + id + "\" style=\"display:none\">${read('ecrans/" + f + ".html')}</div>` +").join('\n'));
}
fs.writeFileSync('build.cjs', b);

// barre d'actions
let j = lire('ecrans/barre_actions.js');
if (!j.includes('crparam:')) {
  const p = "{ txt: /^(ajouter|nouveau modèle|dupliquer|supprimer|modifier|enregistrer|annuler|imprimer|exporter)$/i }";
  const e = "{ txt: /^(critères|imprimer|exporter)$/i }";
  j = j.replace('plans: {},', 'plans: {}, crparam: ' + p + ', erparam: ' + p + ', cred: ' + e + ', ered: ' + e + ', tfted: ' + e + ',');
  fs.writeFileSync('ecrans/barre_actions.js', j);
}
console.log('ok');
