// Balance générale (États comptables › Général) : étape 1 « critères d'édition », puis résultat.
// Les soldes des comptes viennent de la capture du résultat (exercice 2026) : on les relit dans le
// tableau au chargement, puis le tableau est recalculé selon les critères (niveaux, plage de comptes,
// recherche). Les dates ne filtrent pas les mouvements : la capture ne donne que les cumuls annuels.
(function () {
  var crit = document.querySelector('app-bg-criteres');
  var res = document.querySelector('app-bg-resultat');
  if (!crit || !res) return;
  var A = ' _ngcontent-ng-c1840363805=""';
  var q = function (root, s) { return root.querySelector(s); };
  var qa = function (root, s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  // --- Montants en centimes (évite les erreurs d'arrondi sur des milliards) ---
  function lire(t) { t = (t || '').replace(/[\s  ]/g, '').replace(',', '.'); return t ? Math.round(parseFloat(t) * 100) : 0; }
  function fmt(c) {
    if (!c) return '';
    var neg = c < 0; c = Math.abs(c);
    var e = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '-' : '') + e + ',' + String(c % 100).padStart(2, '0');
  }

  // --- Comptes généraux relus dans la capture (lignes « row-leaf ») ---
  var tbody = q(res, 'tbody');
  var COMPTES = qa(tbody, 'tr.row-leaf').map(function (tr) {
    var td = tr.children;
    return { code: td[0].textContent.trim(), libelle: td[1].textContent.trim(),
      anD: lire(td[2].textContent), anC: lire(td[3].textContent), mvD: lire(td[4].textContent), mvC: lire(td[5].textContent) };
  });
  window.BALANCE_BASE = COMPTES;   // soldes de démonstration (centimes) repris par les états financiers
  var EXERCICE_DONNEES = '2026';
  // Les cumuls capturés portent sur 2026 : la période éditée (exercice ou programme) doit couvrir cette année
  function avecDonnees() { return deb.value <= EXERCICE_DONNEES + '-12-31' && fin.value >= EXERCICE_DONNEES + '-01-01'; }

  // --- Étape 1 : critères ---
  var exo = q(crit, '#bg-exercice'), deb = q(crit, '#bg-date-debut'), fin = q(crit, '#bg-date-fin');
  var cDeb = q(crit, '#bg-compte-debut'), cFin = q(crit, '#bg-compte-fin');
  var niveaux = qa(crit, '.niveaux-group input[type=checkbox]');
  var radios = qa(crit, 'input[name=soldeTiers]');
  var erreur = document.createElement('p');
  erreur.className = 'filters-erreur'; erreur.setAttribute('_ngcontent-ng-c3888024652', ''); erreur.style.display = 'none';
  var actions = q(crit, '.filters-actions');
  actions.parentNode.insertBefore(erreur, actions);

  function annee() { return exo.options[exo.selectedIndex].textContent.trim(); }
  // Devis programme (avant l'exercice) : un DP choisi fixe la période et grise l'exercice
  var dp = window.SoftDPFiltre({ avant: exo.parentNode, attr: '_ngcontent-ng-c3888024652', id: 'bg-dp', ecran: 'balance',
    exercice: exo, change: initDates });
  // Avec le champ DP la grille compte 9 champs : 3 lignes régulières (Site, DP, Exercice / Monnaie, dates /
  // Journal, comptes) — « Monnaie d'édition » n'occupe plus deux lignes
  q(crit, '.monnaie-group').style.gridRow = 'auto';
  q(crit, '#bg-date-debut').parentNode.parentNode.insertBefore(q(crit, '.monnaie-group'), q(crit, '#bg-date-debut').parentNode);
  function periode() {
    var d = dp.valeur();
    return d ? { debut: d.debut, fin: d.fin, nom: 'le programme ' + d.code }
      : { debut: annee() + '-01-01', fin: annee() + '-12-31', nom: 'l\'exercice ' + annee() };
  }
  function initDates() { var p = periode(); deb.value = p.debut; fin.value = p.fin; }
  function reinitialiser() {
    exo.selectedIndex = 0; dp.reset(); initDates(); cDeb.value = ''; cFin.value = '';
    // Niveaux affichés par défaut : ceux de la balance capturée (classes, sous-classes, comptes, comptes généraux)
    niveaux.forEach(function (c, i) { c.checked = i !== 2; });
    radios.forEach(function (r, i) { r.checked = i === 0; });
    erreur.style.display = 'none';
  }
  exo.addEventListener('change', initDates);
  q(crit, '.toolbar .toolbar-btn').addEventListener('click', reinitialiser);
  reinitialiser();

  function verifier() {
    var p = periode(), fr = function (v) { return v.split('-').reverse().join('/'); };
    if (!deb.value || !fin.value) return 'Renseignez la date de début et la date de fin.';
    if (deb.value > fin.value) return 'La date de début doit précéder la date de fin.';
    if (deb.value < p.debut || fin.value > p.fin) return 'Les dates doivent être comprises dans ' + p.nom + ' (' + fr(p.debut) + ' – ' + fr(p.fin) + ').';
    if (cDeb.value && cFin.value && cle(cDeb.value) > cle(cFin.value)) return 'Le compte de début doit précéder le compte de fin.';
    if (!niveaux.some(function (c) { return c.checked; })) return 'Cochez au moins un niveau de compte à faire apparaître.';
    return '';
  }
  function cle(code) { return (code + '000000').slice(0, Math.max(6, code.length)); }

  // --- Résultat ---
  var titre = q(res, '.result-title'), recherche = q(res, '.recherche-input');
  var PAD = { 1: 10, 2: 28, 3: 46, 4: 64, 5: 82 };
  var LONG = { 1: 1, 2: 2, 3: 3, 4: 4 };

  // Libellés des regroupements (classe, sous-classe, rubrique, compte) : plan comptable standard, sinon libellé commun aux comptes du regroupement
  var CLASSES = { 1: 'Comptes de capitaux', 2: "Comptes d'immobilisations", 3: 'Comptes de stocks et en-cours', 4: 'Comptes de tiers', 5: 'Comptes financiers', 6: 'Comptes de charges', 7: 'Comptes de produits', 8: 'Comptes spéciaux', 9: 'Comptabilité analytique' };
  var SOUS = { 10: 'Capital et réserves', 11: 'Report à nouveau', 12: "Résultat de l'exercice", 13: "Subventions d'investissement", 14: 'Provisions réglementées', 15: 'Provisions pour risques et charges', 16: 'Emprunts et dettes assimilées', 17: 'Dettes rattachées à des participations', 18: 'Comptes de liaison', 19: 'Fonds à recevoir / à payer',
    20: 'Immobilisations incorporelles', 21: 'Immobilisations corporelles', 22: 'Immobilisations mises en concession', 23: 'Immobilisations en cours', 26: 'Participations et créances rattachées', 27: 'Autres immobilisations financières', 28: 'Amortissements des immobilisations', 29: 'Dépréciations des immobilisations',
    31: 'Matières premières', 32: 'Autres approvisionnements', 33: 'En-cours de production', 35: 'Stocks de produits', 37: 'Stocks de marchandises', 39: 'Dépréciations des stocks',
    40: 'Fournisseurs et comptes rattachés', 41: 'Clients et comptes rattachés', 42: 'Personnel et comptes rattachés', 43: 'Organismes sociaux', 44: 'État et collectivités publiques', 45: 'Groupe et associés', 46: 'Débiteurs et créditeurs divers', 47: "Comptes transitoires ou d'attente", 48: 'Comptes de régularisation', 49: 'Dépréciations des comptes de tiers',
    50: 'Valeurs mobilières de placement', 51: 'Banques, établissements financiers', 52: 'Instruments de trésorerie', 53: 'Caisse', 54: "Régies d'avances et accréditifs", 58: 'Virements internes', 59: 'Dépréciations des comptes financiers',
    60: 'Achats', 61: 'Services extérieurs', 62: 'Autres services extérieurs', 63: 'Impôts, taxes et versements assimilés', 64: 'Charges de personnel', 65: 'Autres charges de gestion courante', 66: 'Charges financières', 67: 'Charges exceptionnelles', 68: 'Dotations aux amortissements et provisions', 69: 'Impôts sur les bénéfices',
    70: 'Ventes de produits et prestations', 71: 'Production stockée', 72: 'Production immobilisée', 74: "Subventions d'exploitation", 75: 'Autres produits de gestion courante', 76: 'Produits financiers', 77: 'Produits exceptionnels', 78: 'Reprises sur amortissements et provisions', 79: 'Transferts de charges' };
  function exact(code) { var P = window.PLAN_COMPTABLE || [], r = P.filter(function (x) { return x.code === code; })[0]; return r ? (r.libelle || r.label || '') : ''; }
  function motsCommuns(L) {
    var T = L.map(function (x) { return x.split(/\s+/); }), out = [];
    for (var i = 0; i < T[0].length; i++) { var st = function (w) { return String(w || '').toLowerCase().replace(/s$/, ''); }, m = st(T[0][i]); if (T.every(function (t) { return t[i] && st(t[i]) === m; })) out.push(T[0][i]); else break; }
    return out.join(' ');
  }
  function libelleGroupe(l) {
    var k = l.code, n = k.length;
    if (n === 1 && CLASSES[k]) return CLASSES[k];
    if (n === 2 && SOUS[+k]) return SOUS[+k];
    var e = exact(k); if (e) return e;
    var L = l.comptes.map(function (c) { return c.libelle; }).filter(Boolean); if (!L.length) return k;
    if (L.length === 1) return L[0];
    var c = motsCommuns(L).replace(/[\s,:;\-–]+$/, ''); return c.length >= 6 ? c : L[0];
  }
  function lignes() {
    var garde = avecDonnees() ? COMPTES : [];
    if (window.ECRITURES_SAISIES) garde = window.ECRITURES_SAISIES.balance(garde, deb.value, fin.value);   // + écritures saisies de la période
    if (cDeb.value) garde = garde.filter(function (c) { return cle(c.code) >= cle(cDeb.value); });
    if (cFin.value) garde = garde.filter(function (c) { return cle(c.code) <= cle(cFin.value); });
    // Plan de regroupement : sur la balance générale, seul le plan comptable ventile les comptes (éléments = préfixes de comptes)
    var rg = crit.__regr && crit.__regr();
    if (rg && rg.plan === 'PC' && rg.codes.length) garde = garde.filter(function (c) { return rg.codes.some(function (p) { return c.code.indexOf(p) === 0; }); });
    var vus = niveaux.map(function (c) { return c.checked; });
    var out = [], ouverts = {};
    garde.forEach(function (c) {
      // Regroupements (classe, sous-classe, rubrique, compte) cumulés sur les comptes généraux
      [1, 2, 3, 4].forEach(function (n) {
        if (!vus[n - 1]) return;
        var k = c.code.slice(0, LONG[n]);
        if (ouverts[n] !== k) {
          ouverts[n] = k;
          for (var m = n + 1; m <= 4; m++) ouverts[m] = null;
          out.push({ code: k, libelle: k, niveau: n, comptes: [] });
        }
      });
      out.forEach(function (l) { if (l.niveau < 5 && c.code.indexOf(l.code) === 0 && ouverts[l.niveau] === l.code) l.comptes.push(c); });
      if (vus[4]) out.push({ code: c.code, libelle: c.libelle, niveau: 5, comptes: [c] });
    });
    out.forEach(function (l) { if (l.niveau < 5) l.libelle = libelleGroupe(l); });
    return { lignes: out, comptes: garde };
  }
  function cumul(comptes) {
    var r = { an: 0, mvD: 0, mvC: 0, totD: 0, totC: 0 };
    comptes.forEach(function (c) {
      r.an += c.anD - c.anC; r.mvD += c.mvD; r.mvC += c.mvC;
      r.totD += c.anD + c.mvD; r.totC += c.anC + c.mvC;
    });
    r.solde = r.totD - r.totC;
    return r;
  }
  function cellules(r, anD, anC, sD, sC) {
    return [anD, anC, r.mvD, r.mvC, r.totD, r.totC, sD, sC]
      .map(function (v) { return '<td' + A + ' class="amount">' + fmt(v) + '</td>'; }).join('');
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); }

  function afficher() {
    var d = lignes(), filtre = recherche.value.trim().toLowerCase();
    var html = d.lignes.filter(function (l) {
      return !filtre || l.code.toLowerCase().indexOf(filtre) >= 0 || l.libelle.toLowerCase().indexOf(filtre) >= 0;
    }).map(function (l) {
      var r = cumul(l.comptes);
      return '<tr' + A + ' tabindex="0" title="Clic pour afficher le détail des écritures" class="row-ligne' + (l.niveau === 5 ? ' row-leaf' : '') + '"' +
        ' data-compte="' + l.code + '"><td' + A + ' class="mono" style="padding-left: ' + PAD[l.niveau] + 'px;">' + l.code + '</td><td' + A + '>' + esc(l.libelle) + '</td>' +
        cellules(r, Math.max(r.an, 0), Math.max(-r.an, 0), Math.max(r.solde, 0), Math.max(-r.solde, 0)) + '</tr>';
    }).join('');
    if (!html) html = '<tr' + A + '><td' + A + ' colspan="10" class="empty-state">' +
      (!avecDonnees() ? 'Aucune écriture sur ' + periode().nom + ' dans la maquette (seul l\'exercice ' + EXERCICE_DONNEES + ' est alimenté).' : 'Aucun compte ne correspond aux critères.') + '</td></tr>';
    // Total général : sur tous les comptes retenus (la recherche ne filtre que l'affichage)
    var t = cumul(d.comptes), sD = 0, sC = 0;
    d.comptes.forEach(function (c) { var s = c.anD + c.mvD - c.anC - c.mvC; if (s > 0) sD += s; else sC -= s; });
    var badge = (cDeb.value || cFin.value || filtre) ? '<span' + A + ' class="badge-filtre">Filtré</span>' : '';
    function soldes(L) { var d = 0, c = 0; L.forEach(function (x) { var s = x.anD + x.mvD - x.anC - x.mvC; if (s > 0) d += s; else c -= s; }); return [d, c]; }
    [['Total compte de bilan', /^[1-5]/], ['Total compte de gestion', /^[67]/]].forEach(function (g) {
      var L = d.comptes.filter(function (x) { return g[1].test(x.code); }); if (!L.length) return;
      var tg = cumul(L), sg = soldes(L);
      html += '<tr' + A + ' class="row-total row-sous-total"><td' + A + ' colspan="2"> ' + g[0] + '</td>' + cellules(tg, Math.max(tg.an, 0), Math.max(-tg.an, 0), sg[0], sg[1]) + '</tr>';
    });
    html += '<tr' + A + ' class="row-total"><td' + A + ' colspan="2"> Total général ' + badge + '</td>' +
      cellules(t, Math.max(t.an, 0), Math.max(-t.an, 0), sD, sC) + '</tr>';
    tbody.innerHTML = html;
  }

  q(crit, '.toolbar-btn-primary').addEventListener('click', function () {
    var e = verifier();
    erreur.textContent = e; erreur.style.display = e ? '' : 'none';
    if (e) return;
    var f = fin.value.split('-');
    titre.textContent = 'BALANCE GÉNÉRALE au ' + f[2] + '/' + f[1] + '/' + f[0] + (dp.valeur() ? ' — PROGRAMME ' + dp.valeur().code : '');
    recherche.value = '';
    afficher();
    crit.style.display = 'none'; res.style.display = '';
    var sc = document.querySelector('.softcompta-content-scroll'); if (sc) sc.scrollTop = 0;
  });
  var boutons = qa(res, '.result-toolbar .toolbar-btn');
  boutons[0].addEventListener('click', function () { res.style.display = 'none'; crit.style.display = ''; });
  boutons[1].addEventListener('click', function () { window.print(); });
  // Export : fichier CSV (séparateur « ; ») lisible par Excel
  boutons[2].addEventListener('click', function () {
    var rows = qa(tbody, 'tr').map(function (tr) {
      return qa(tr, 'td').map(function (td) { return '"' + td.textContent.trim().replace(/"/g, '""') + '"'; }).join(';');
    });
    var head = qa(res, 'thead th').map(function (th) { return th.textContent.trim(); }).join(';');
    var blob = new Blob(['﻿' + [head].concat(rows).join('\r\n')], { type: 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'balance_generale_' + fin.value + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  });
  recherche.addEventListener('input', afficher);

  // Clic sur une ligne : le détail des écritures (Grand livre) n'est pas intégré dans la maquette
  var info = document.createElement('p');
  info.className = 'result-note'; info.setAttribute('_ngcontent-ng-c1840363805', '');
  info.style.cssText = 'display:none;margin:0 0 10px;padding:8px 12px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;color:#1e40af';
  q(res, '.result-card').parentNode.insertBefore(info, q(res, '.result-card'));
  tbody.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-compte]'); if (!tr) return;
    qa(tbody, 'tr').forEach(function (x) { x.style.outline = ''; });
    tr.style.outline = '2px solid #3e97ff';
    info.textContent = 'Détail des écritures du compte ' + tr.dataset.compte + ' : écran « Grand livre général » non intégré dans la maquette.';
    info.style.display = '';
  });
})();
