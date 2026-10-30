// États comptables : barre d'actions unifiée « Filtre | CSV | EXCEL | PDF » (modèle : Balance analytique).
// Les boutons existants sont déplacés et renommés (leurs comportements restent branchés) ; seul le bouton
// manquant (CSV ou EXCEL) est ajouté et déclenche l'export existant.
(function () {
  function btn(cls, icone, libelle) {
    var b = document.createElement('button'); b.type = 'button'; b.className = 'etb ' + cls;
    b.innerHTML = (icone ? '<i class="ti ' + icone + '"></i>' : '') + libelle; return b;
  }
  function met(b, cls, icone, libelle) { b.className = 'etb ' + cls; b.innerHTML = (icone ? '<i class="ti ' + icone + '"></i>' : '') + libelle; return b; }
  function proxy(cible, cls, icone, libelle) { var b = btn(cls, icone, libelle); b.addEventListener('click', function () { cible.click(); }); return b; }
  var I = { filtre: 'ti-adjustments-horizontal', xls: 'ti-file-spreadsheet', pdf: 'ti-file-type-pdf' };
  function groupe(bs) { var g = document.createElement('div'); g.className = 'etb-group'; bs.forEach(function (b) { g.appendChild(b); }); return g; }

  // Balance générale : Retour | Imprimer PDF | Exporter (XLSX)  ->  Filtre | CSV | EXCEL | PDF
  (function () {
    var tb = document.querySelector('app-bg-resultat .result-toolbar'); if (!tb) return;
    var bs = tb.querySelectorAll('.toolbar-btn'); if (bs.length < 3) return;
    var retour = bs[0], pdf = bs[1], xls = bs[2];
    var g = groupe([met(retour, 'pri', I.filtre, 'Filtre'), proxy(xls, '', '', 'CSV'), met(xls, '', I.xls, 'EXCEL'), met(pdf, '', I.pdf, 'PDF')]);
    tb.innerHTML = ''; tb.appendChild(g); tb.classList.add('etb-bar');
  })();

  // Balance auxiliaire et Grand livre général : Retour | Imprimer PDF | Exporter (CSV)
  ['app-balance-auxiliaire', 'app-grand-livre-general'].forEach(function (sel) {
    var tb = document.querySelector(sel + ' .bx-toolbar'); if (!tb) return;
    var retour = tb.querySelector('.bx-retour'), pdf = tb.querySelector('.bx-pdf'), csv = tb.querySelector('.bx-csv');
    if (!retour || !pdf || !csv) return;
    var g = groupe([met(retour, 'pri', I.filtre, 'Filtre'), met(csv, '', '', 'CSV'), proxy(csv, '', I.xls, 'EXCEL'), met(pdf, '', I.pdf, 'PDF')]);
    tb.innerHTML = ''; tb.appendChild(g); tb.classList.add('etb-bar');
    // Titre de l'état sur la même ligne que les boutons : titre à gauche, actions à droite (charte §7.4)
    var res = tb.closest('.bx-res'), titre = res && res.querySelector('.bx-titre');
    if (titre) { tb.insertBefore(titre, g); tb.classList.add('etb-avec-titre'); }
  });

  // Balance analytique : boutons déjà dans le bon ordre, mêmes styles
  (function () {
    var bs = document.querySelectorAll('app-balance-analytique .page-header .toolbar .toolbar-btn'); if (bs.length < 4) return;
    met(bs[0], 'pri', I.filtre, 'Filtre'); met(bs[1], '', '', 'CSV'); met(bs[2], '', I.xls, 'EXCEL'); met(bs[3], '', I.pdf, 'PDF');
    bs[0].parentNode.classList.add('etb-group');
  })();

  // États personnalisés › Édition (Liste, Récapitulatif) : menu « Exporter » -> boutons
  ['app-listing-report-edition', 'app-recap-report-edition', '[data-screen="listedit"]', '[data-screen="recapexec"]'].forEach(function (sel) {
    var root = document.querySelector(sel); if (!root) return;
    var ex = root.querySelector('[data-el-expw]'); if (!ex || ex.getAttribute('data-etb')) return;
    ex.setAttribute('data-etb', '');
    var f = btn('pri', I.filtre, 'Filtre'); f.setAttribute('data-el-open', '');
    var c = btn('', '', 'CSV'); c.setAttribute('data-el-do', 'csv');
    var x = btn('', I.xls, 'EXCEL'); x.setAttribute('data-el-do', 'xls');
    var p = btn('', I.pdf, 'PDF'); p.setAttribute('data-el-do', 'pdf');
    ex.innerHTML = ''; ex.appendChild(groupe([f, c, x, p]));
  });
  // En-tête d'état unifié (Balance générale, Balance analytique) : titre de l'état à gauche, Filtre | CSV | EXCEL | PDF à droite, recherche dessous.
  // Le titre de ces états est (re)généré par leur script : on le recopie dans la barre et on masque l'original.
  function copierTitre(root, ligne, sel) {
    var p = document.createElement('h2'); p.className = 'etb-titre'; ligne.insertBefore(p, ligne.firstChild); ligne.classList.add('etb-avec-titre');
    function maj() {
      var o = root.querySelector(sel), t = o ? o.textContent.trim() : '';
      if (p.textContent !== t) p.textContent = t;
      p.style.display = t ? '' : 'none';
    }
    new MutationObserver(maj).observe(root, { childList: true, subtree: true, characterData: true }); maj();
  }
  (function () {
    var root = document.querySelector('app-bg-resultat'), tb = root && root.querySelector('.result-toolbar');
    if (tb) copierTitre(root, tb, '.result-bar .result-title');
  })();
  (function () {
    var root = document.querySelector('app-balance-analytique'), g = root && root.querySelector('.page-header .etb-group');
    if (!g) return;
    var ligne = document.createElement('div'); ligne.className = 'etb-bar'; g.parentNode.insertBefore(ligne, g); ligne.appendChild(g);
    copierTitre(root, ligne, '.result-meta-bloc .result-title');
  })();
})();
