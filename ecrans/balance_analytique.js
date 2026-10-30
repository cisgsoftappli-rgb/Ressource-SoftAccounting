// Balance analytique (États comptables › Analytique › Balance) : fenêtre « Critères de restitution »,
// puis balance par compte analytique avec sous-totaux à chaque niveau du plan.
// Les montants viennent de la capture du résultat (plan ACTIVITE, exercice 2026, décaissement) : on relit
// les comptes de niveau 5 dans le tableau, puis sous-totaux, total et filtres sont recalculés.
(function () {
  var page = document.querySelector('app-balance-analytique');
  if (!page) return;
  var A = ' _ngcontent-ng-c2712255655=""';
  var q = function (s, r) { return (r || page).querySelector(s); };
  var qa = function (s, r) { return Array.prototype.slice.call((r || page).querySelectorAll(s)); };

  // --- Montants en centimes, affichés comme dans l'application (1,234.56) ---
  function lire(t) { t = (t || '').replace(/[,\s]/g, ''); return t ? Math.round(parseFloat(t) * 100) : 0; }
  function fmt(c) {
    var neg = c < 0; c = Math.abs(c);
    return (neg ? '-' : '') + String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + String(c % 100).padStart(2, '0');
  }
  function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  // --- Données relues dans la capture ---
  var tbody = q('tbody'), tfoot = q('tfoot');
  var LIBELLES = {};   // code d'un regroupement -> libellé (attribut title de la capture)
  var COMPTES = [];
  qa('tr', tbody).forEach(function (tr) {
    var td = tr.children, code = td[0].textContent.trim();
    if (tr.classList.contains('row-principale')) {
      COMPTES.push({ code: code, libelle: td[1].textContent.trim(),
        anD: lire(td[2].textContent), anC: lire(td[3].textContent), mvD: lire(td[4].textContent), mvC: lire(td[5].textContent) });
    } else LIBELLES[code] = td[0].getAttribute('title');
  });
  var PLAN_DONNEES = 'PLAN1', EXERCICE_DONNEES = '2026', TYPE_DONNEES = 'DECAISSEMENT';

  // --- Fenêtre de critères ---
  var modal = q('app-bal-criteres-modal soft-modal > div');
  var exo = q('#bal-exercice'), deb = q('#bal-debut'), fin = q('#bal-fin'), dep = q('#bal-depense');
  var plan = q('#bal-plan'), axe2 = q('#bal-axe-secondaire'), info = q('.filters-info');
  var niveaux = qa('.niveaux-box input[type=checkbox]');
  var hint = q('.filter-hint');
  var erreur = document.createElement('p');
  erreur.className = 'filters-erreur'; erreur.setAttribute('_ngcontent-ng-c2657484088', ''); erreur.style.display = 'none';
  var footer = q('.modal-footer');
  footer.parentNode.insertBefore(erreur, footer);
  var ouvrir = function () { erreur.style.display = 'none'; modal.style.display = ''; };
  var fermer = function () { modal.style.display = 'none'; };

  function annee() { return exo.value ? exo.options[exo.selectedIndex].textContent.trim() : ''; }
  // Devis programme (pleine largeur, avant l'exercice) : un DP choisi fixe la période et grise l'exercice
  var dp = window.SoftDPFiltre({ avant: exo.parentNode, attr: '_ngcontent-ng-c2657484088', id: 'bal-dp', ecran: 'balana',
    exercice: exo, indice: 'filter-hint', pleineLargeur: true, change: dates });
  function periode() {
    var d = dp.valeur(), a = annee();
    if (d) return { debut: d.debut, fin: d.fin, nom: 'le programme ' + d.code };
    return a ? { debut: a + '-01-01', fin: a + '-12-31', nom: 'l\'exercice ' + a } : null;
  }
  function bornes() {
    var p = periode(), fr = function (v) { return v.split('-').reverse().join('/'); };
    deb.min = fin.min = p ? p.debut : ''; deb.max = fin.max = p ? p.fin : '';
    hint.textContent = p ? 'Période autorisée : du ' + fr(p.debut) + ' au ' + fr(p.fin) : 'Sélectionnez un exercice.';
  }
  function dates() { bornes(); var p = periode(); deb.value = p ? p.debut : ''; fin.value = p ? p.fin : ''; }
  exo.addEventListener('change', dates);
  // L'axe secondaire ne peut pas être l'axe principal
  function axes() {
    qa('option', axe2).forEach(function (o) { o.disabled = !!o.value && o.value === plan.value; });
    if (axe2.value && axe2.value === plan.value) axe2.value = '';
    info.textContent = axe2.value
      ? 'Croisé : ' + plan.options[plan.selectedIndex].textContent + ' × ' + axe2.options[axe2.selectedIndex].textContent +
        ' — le croisement n\'est pas alimenté dans la maquette, la balance reste restituée sur l\'axe principal.'
      : 'Mono-critère : la balance sera restituée uniquement sur l\'axe principal.';
  }
  plan.addEventListener('change', axes); axe2.addEventListener('change', axes);

  function reinitialiser() {
    exo.selectedIndex = 1; dp.reset(); dates();
    dep.selectedIndex = 0; plan.value = PLAN_DONNEES; axe2.value = '';
    niveaux.forEach(function (c) { c.checked = true; });
    axes(); erreur.style.display = 'none';
  }
  reinitialiser();

  function verifier() {
    var p = periode();
    if (!p) return 'Sélectionnez un exercice ou un devis programme.';
    if (!deb.value || !fin.value) return 'Renseignez la période (du … au …).';
    if (deb.value > fin.value) return 'La date de début doit précéder la date de fin.';
    if (deb.value < p.debut || fin.value > p.fin) return 'La période doit être comprise dans ' + p.nom + '.';
    if (!plan.value) return 'Sélectionnez le plan analytique (critère principal).';
    if (!niveaux.some(function (c) { return c.checked; })) return 'Cochez au moins un niveau d\'analyse.';
    return '';
  }

  var footerBtns = qa('.footer-actions .toolbar-btn');
  footerBtns[0].addEventListener('click', reinitialiser);
  footerBtns[1].addEventListener('click', fermer);
  footerBtns[2].addEventListener('click', function () {
    var e = verifier();
    erreur.textContent = e; erreur.style.display = e ? '' : 'none';
    if (e) return;
    fermer(); generer();
  });
  modal.addEventListener('click', function (e) { if (e.target === modal) fermer(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && modal.style.display !== 'none' && page.offsetParent) fermer(); });

  // --- Résultat ---
  var vide = q('[data-ba-vide]'), cartouche = q('.cartouche'), carte = q('.result-card');
  var exportBtns = qa('.page-header .toolbar .toolbar-btn').slice(1);
  var recherche = q('.recherche-input'), meta = q('.result-meta');
  var filtreBtn = q('.result-actions .toolbar-btn');
  var filtresCol = null, actif = false;

  function etat(resultat) {
    actif = resultat;
    vide.style.display = resultat ? 'none' : '';
    cartouche.style.display = carte.style.display = resultat ? '' : 'none';
    exportBtns.forEach(function (b) { b.disabled = !resultat; });
  }
  etat(false);

  function dateFr(v) { var p = v.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  function cumul(cs) {
    var r = { anD: 0, anC: 0, mvD: 0, mvC: 0 };
    cs.forEach(function (c) { r.anD += c.anD; r.anC += c.anC; r.mvD += c.mvD; r.mvC += c.mvC; });
    r.totD = r.anD + r.mvD; r.totC = r.anC + r.mvC;
    var s = r.totD - r.totC; r.sD = Math.max(s, 0); r.sC = Math.max(-s, 0);
    return r;
  }
  function cellules(r) {
    return [r.anD, r.anC, r.mvD, r.mvC, r.totD, r.totC, r.sD, r.sC].map(function (v, i) {
      return '<td' + A + ' class="num' + (i % 2 ? ' credit' : '') + '">' + fmt(v) + '</td>';
    }).join('');
  }
  function donnees() {
    // Données capturées : 2026 ; la période éditée (exercice ou programme) doit couvrir cette année
    var couvre = deb.value <= EXERCICE_DONNEES + '-12-31' && fin.value >= EXERCICE_DONNEES + '-01-01';
    if (!couvre || plan.value !== PLAN_DONNEES || dep.value !== TYPE_DONNEES) return [];
    return COMPTES;
  }

  function generer() {
    var comptes = donnees(), vus = niveaux.map(function (c) { return c.checked; });
    var f = (recherche.value || '').trim().toLowerCase();
    var fc = filtresCol ? qa('input', filtresCol).map(function (i) { return i.value.trim().toLowerCase(); }) : ['', ''];
    var garde = function (code, lib) {
      return (!f || code.toLowerCase().indexOf(f) >= 0 || lib.toLowerCase().indexOf(f) >= 0) &&
        (!fc[0] || code.toLowerCase().indexOf(fc[0]) === 0) && (!fc[1] || lib.toLowerCase().indexOf(fc[1]) >= 0);
    };
    // Parcours en profondeur : un compte de niveau 5, puis les sous-totaux qui se ferment après lui
    var html = '', n = 0;
    comptes.forEach(function (c, i) {
      if (vus[4] && garde(c.code, c.libelle)) {
        html += '<tr' + A + ' class="row-principale"><td' + A + ' class="code-link" title="' + esc(c.libelle) + '">' + c.code + '</td><td' + A + '>' +
          esc(c.libelle) + '</td>' + cellules(cumul([c])) + '</tr>';
        n++;
      }
      var suivant = comptes[i + 1] ? comptes[i + 1].code : '';
      for (var l = 4; l >= 1; l--) {
        var g = c.code.slice(0, l);
        if (suivant.slice(0, l) === g || !vus[l - 1]) continue;
        var lib = LIBELLES[g] || g;
        if (!garde(g, lib)) continue;
        html += '<tr' + A + ' class="row-sous-total"><td' + A + ' class="code-link" title="' + esc(lib) + '">' + g + '</td><td' + A + '>Sous-total — ' +
          esc(lib) + '</td>' + cellules(cumul(comptes.filter(function (x) { return x.code.indexOf(g) === 0; }))) + '</tr>';
      }
    });
    if (!html) html = '<tr' + A + '><td' + A + ' colspan="10" class="empty-state">' + (comptes.length
      ? 'Aucun compte analytique ne correspond à la recherche.'
      : 'Aucun mouvement pour ces critères dans la maquette (seule la combinaison ACTIVITE · année ' + EXERCICE_DONNEES + ' · décaissement est alimentée).') + '</td></tr>';
    tbody.innerHTML = html;
    // Total général : tous les comptes retenus ; soldes D et C sommés compte par compte
    var t = cumul(comptes), sD = 0, sC = 0;
    comptes.forEach(function (c) { var r = cumul([c]); sD += r.sD; sC += r.sC; });
    t.sD = sD; t.sC = sC;
    tfoot.innerHTML = '<tr' + A + ' class="row-total"><td' + A + '></td><td' + A + '> Total général </td>' + cellules(t) + '</tr>';

    q('.cartouche-texte').textContent = ' ' + dep.options[dep.selectedIndex].textContent + ' du ' + dateFr(deb.value) + ' au ' + dateFr(fin.value) +
      (dp.valeur() ? ' — Programme ' + dp.valeur().code + ' (' + dp.valeur().libelle + ')' : '') + ' ';
    var croise = !!axe2.value, maintenant = new Date();
    var p2 = function (x) { return String(x).padStart(2, '0'); };
    meta.innerHTML = '<span' + A + ' class="badge-mode' + (croise ? ' badge-mode-croise' : '') + '"> ' + (croise ? 'Croisé' : 'Mono-critère') +
      ' </span> Comptes analytiques : <strong' + A + '>' + n + '</strong> · Générée le : <strong' + A + '>' +
      p2(maintenant.getDate()) + '/' + p2(maintenant.getMonth() + 1) + '/' + maintenant.getFullYear() + ' ' +
      p2(maintenant.getHours()) + ':' + p2(maintenant.getMinutes()) + ':' + p2(maintenant.getSeconds()) + '</strong>';
    q('.result-title').textContent = 'Balance Analytique — ' + plan.options[plan.selectedIndex].textContent;
    etat(true);
  }

  q('.page-header .toolbar-btn-primary').addEventListener('click', ouvrir);
  recherche.addEventListener('input', function () { if (actif) generer(); });
  // Filtres par colonne (code, libellé) sous l'en-tête du tableau
  filtreBtn.addEventListener('click', function () {
    if (filtresCol) {
      filtresCol.remove(); filtresCol = null; filtreBtn.textContent = ' Afficher les filtres colonnes ';
    } else {
      filtresCol = document.createElement('tr');
      filtresCol.className = 'filter-row'; filtresCol.setAttribute('_ngcontent-ng-c2712255655', '');
      filtresCol.innerHTML = ['Code commence par…', 'Libellé contient…'].map(function (p) {
        return '<th' + A + '><input' + A + ' class="col-filter" type="search" placeholder="' + p + '"></th>';
      }).join('') + new Array(9).join('<th' + A + '></th>');
      q('thead').appendChild(filtresCol);
      qa('input', filtresCol).forEach(function (i) { i.addEventListener('input', generer); });
      filtreBtn.textContent = ' Masquer les filtres colonnes ';
    }
    if (actif) generer();
  });
  // Exports : CSV (aussi pour EXCEL, séparateur « ; ») et impression
  function csv() {
    var lignes = qa('thead tr:first-child th').map(function (th) { return th.textContent.trim(); }).join(';');
    var corps = qa('tbody tr, tfoot tr').map(function (tr) {
      return qa('td', tr).map(function (td) { return '"' + td.textContent.trim().replace(/"/g, '""') + '"'; }).join(';');
    });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + [lignes].concat(corps).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
    a.download = 'balance_analytique_' + fin.value + '.csv';
    document.body.appendChild(a); a.click(); a.remove();
  }
  exportBtns[0].addEventListener('click', csv);
  exportBtns[1].addEventListener('click', csv);
  exportBtns[2].addEventListener('click', function () { window.print(); });
})();
