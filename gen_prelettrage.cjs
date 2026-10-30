// Génère l'écran « Prélettrage » à partir de l'écran « Lettrage » (ecrans/lettrage_manuel.html) : mêmes critères, même liste et mêmes totaux,
// mais sans obligation d'équilibre débit / crédit et avec une référence de prélettrage (PRE-0001…) à la place de la lettre.
// Les écrans sont indépendants (préfixe data-lpr / .lpr-, état séparé dans localStorage). Appelé par build.cjs à chaque génération.
const fs = require('fs');

module.exports = function prelettrage() {
  let s = fs.readFileSync(__dirname + '/ecrans/lettrage_manuel.html', 'utf8');
  function rep(a, b) { if (s.split(a).length !== 2) throw new Error('prélettrage : ' + a.slice(0, 70)); s = s.replace(a, () => b); }
  function coupe(debut, fin, remplacement) {
    const a = s.indexOf(debut), b = s.indexOf(fin, a + 1);
    if (a < 0 || b < 0) throw new Error('prélettrage (bornes) : ' + debut.slice(0, 60));
    s = s.slice(0, a) + remplacement + s.slice(b);
  }

  // En-tête
  coupe('<!--', '-->', `<!--
  Écran « Prélettrage » (Comptabilité générale › Lettrage › Prélettrage) — généré depuis l'écran Lettrage (gen_prelettrage.cjs) : mêmes critères
  (compte, tiers, période, statut) et même liste, mais le prélettrage ne demande AUCUN équilibre débit / crédit et attribue une référence de
  prélettrage (PRE-0001…) à la place d'une lettre. État conservé dans localStorage (softcompta.prelettrage). Ne pas nommer de fonction « $$ » (build.cjs).
`);
  // Sans lettrage automatique : bouton et fenêtre de propositions
  s = s.replace(/^    <button type="button" data-lm-auto>.*\n/m, '');
  coupe('  <div class="lm-ov" data-lm-ov hidden>', '  <div class="bp-toast"', '');
  coupe('  // Lettrage automatique : propositions', '  function lettrer() {', '');
  s = s.replace(/^  q\('\[data-lm-ov\]'\).*\n/gm, '');
  s = s.replace(/^    if \(b\.hasAttribute\('data-lm-oann'\).*\n/m, '').replace(/^    else if \(b\.hasAttribute\('data-lm-oval'\)\).*\n/m, '').replace(/^    else if \(b\.hasAttribute\('data-lm-auto'\)\).*\n/m, '');
  rep("else if (b.hasAttribute('data-lm-rech')) rechercher();", "if (b.hasAttribute('data-lm-rech')) rechercher();");

  // Référence de prélettrage
  coupe('  function lettreAt(n) {', '  function lettreSuivante(', "  function lettreAt(n) { return 'PRE-' + ('0000' + (n + 1)).slice(-4); }\n");
  // Totaux : l'équilibre n'est pas requis
  coupe("    var e = q('[data-lm-etat]'), ec = Math.abs(d - c), tol = cfg().ecart;", '  }\n  function toast(', `    var e = q('[data-lm-etat]'), ec = Math.abs(d - c);
    if (!s.length) { e.textContent = ''; e.className = 'lm-etat'; }
    else if (ec < 0.005) { e.textContent = 'Sélection équilibrée.'; e.className = 'lm-etat ok'; }
    else { e.textContent = 'Écart de ' + nb(ec, 2) + ' Ar : l\\u2019équilibre débit / crédit n\\u2019est pas requis pour un prélettrage.'; e.className = 'lm-etat att'; }
`);
  // Prélettrer / annuler le prélettrage
  coupe('  function lettrer() {', "\n\n  q('[data-lm-compte]').addEventListener('change'", `  function lettrer() {
    var s = selection().filter(function (l) { return !lettreDe(l); });
    if (s.length < 2) { toast('Sélectionnez au moins deux écritures à prélettrer.'); return; }
    var d = 0, c = 0; s.forEach(function (l) { d += l[7]; c += l[8]; });
    var ref = lettreSuivante(appl.compte);
    s.forEach(function (l) { etat.lettres[l[0]] = ref; delete sel[l[0]]; });
    sauver(); dessiner();
    toast('Écritures prélettrées avec la référence ' + ref + (Math.abs(d - c) > 0.005 ? ' (non équilibrées : écart de ' + nb(Math.abs(d - c), 2) + ' Ar).' : '.'));
  }
  function delettrer() {
    var refs = {};
    var cibles = (L[cle()] || []).filter(function (l) { return lettreDe(l) && sel[l[0]]; });
    if (!cibles.length) { toast('Cliquez d\\u2019abord sur une ligne prélettrée, puis sur « Annuler le prélettrage ».'); return; }
    cibles.forEach(function (l) { refs[lettreDe(l)] = 1; });
    var n = 0; (L[cle()] || []).forEach(function (l) { if (refs[lettreDe(l)]) { etat.lettres[l[0]] = ''; delete sel[l[0]]; n++; } });
    sauver(); dessiner(); toast(n + ' écriture(s) : prélettrage annulé.');
  }`);

  // Textes
  rep('clip-path:inset(50%);margin:0">Lettrage</h1>', 'clip-path:inset(50%);margin:0">Prélettrage</h1>');
  rep('<button type="button" data-lm-delettrer>Délettrer</button>', '<button type="button" data-lm-delettrer>Annuler le prélettrage</button>');
  rep('<button type="button" data-lm-lettrer>Lettrer</button>', '<button type="button" data-lm-lettrer>Prélettrer</button>');
  rep('aria-label="Statut de lettrage"', 'aria-label="Statut de prélettrage"');
  rep('<span>Non lettrées</span>', '<span>Non prélettrées</span>');
  rep('<span>Lettrées</span>', '<span>Prélettrées</span>');
  rep('<th>Lettre</th></tr>', '<th>Réf. prélettrage</th></tr>');
  rep("// Un clic sur une ligne lettrée la marque pour le délettrage (même lettre)", "// Un clic sur une ligne prélettrée la marque pour l'annulation (même référence)");
  rep("var CLE = 'softcompta.lettrageManuel'", "var CLE = 'softcompta.prelettrage'");
  // Données d'exemple : aucune lettre ; un prélettrage non équilibré en exemple
  s = s.split('\n').map((l) => {
    if (/^\s*\[20[12],/.test(l)) return l.replace("'AA']", "'']");
    if (/^\s*\[(205|207),/.test(l)) return l.replace(/'']/, "'PRE-0001']");
    return l;
  }).join('\n');

  // Préfixes propres à l'écran : data-lm → data-lpr, classes lm- → lpr-
  s = s.replace(/data-lm/g, 'data-lpr').replace(/\blm-/g, 'lpr-');
  return s;
};
