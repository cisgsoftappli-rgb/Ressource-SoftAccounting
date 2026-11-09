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
  // Les listes de niveaux n'affichent que 3 niveaux ; les suivants s'atteignent par défilement
  var stN = document.createElement('style'); stN.textContent = 'app-balance-analytique .niveaux-box{max-height:158px;overflow-y:auto;flex-wrap:nowrap!important;flex-direction:column!important;overflow-x:hidden!important;overscroll-behavior:contain}app-balance-analytique .cartouche,app-balance-analytique .result-meta,app-balance-analytique .result-actions{display:none!important}app-balance-analytique .modal-title,app-balance-analytique .modal-subtitle,app-balance-analytique .filters-title,app-balance-analytique .filter-hint,app-balance-analytique .filters-info{display:none!important}app-balance-analytique .niveaux-box>.niveau-row{flex:none!important}'; document.head.appendChild(stN);
  // Le plan de regroupement passe dans la colonne de gauche, sous « Centre de saisie » et « Journal »
  function deplacerRegr() {
    var L = qa('.filter-label'), gr = L.filter(function (l) { return /Plan de regroupement/i.test(l.textContent); })[0], jn = L.filter(function (l) { return /^\s*Journal\s*$/i.test(l.textContent); })[0];
    if (!gr || !jn) return; var g = gr.parentNode, j = jn.parentNode; if (g === j || !j.parentNode) return;
    if (g.parentNode === j.parentNode) return; j.parentNode.appendChild(g); g.style.gridColumn = '1 / -1';
  }
  // « Type de dépense » juste sous le premier bloc : l'espace excédentaire va à la dernière rangée, pas entre les deux blocs de gauche
  (function () { var cs = qa('.filters-card'), p = cs[0] && cs[0].parentNode; if (!p || cs.length < 3) return; p.style.gridTemplateRows = 'min-content 1fr'; cs[0].style.alignSelf = 'start'; cs[1].style.alignSelf = 'start'; })();
  deplacerRegr(); [300, 1200, 3000].forEach(function (t) { setTimeout(deplacerRegr, t); });
  // Critère secondaire : son propre choix de niveau (un seul), affiché sous la liste des axes quand un axe secondaire est choisi
  var box1 = q('.niveaux-box'), lab1 = box1.previousElementSibling, box2 = box1.cloneNode(true), lab2 = lab1.cloneNode(true), bloc2 = document.createElement('div');
  box2.classList.add('niveaux-box2'); lab2.innerHTML = lab1.innerHTML.replace(/Niveaux d.analyse/i, "Niveaux d'analyse — critère secondaire");
  lab1.setAttribute('data-lab1', lab1.innerHTML);
  qa('input', box2).forEach(function (c) { c.type = 'radio'; c.name = 'bal-niveau2'; c.checked = false; });
  qa('.badge-filtre', box2).forEach(function (b) { b.style.display = 'none'; });
  var niveaux2 = qa('input', box2); niveaux2[niveaux2.length - 1].checked = true;
  bloc2.style.display = 'none'; bloc2.appendChild(lab2); bloc2.appendChild(box2); info.parentNode.insertBefore(bloc2, info);
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
    // Critère secondaire activé : un seul niveau d'analyse, au choix, commun aux deux critères (cases à cocher → choix unique) ; sinon plusieurs niveaux possibles
    var croise = !!axe2.value, etaitCroise = niveaux[0].type === 'radio';
    niveaux.forEach(function (c) { c.type = croise ? 'radio' : 'checkbox'; c.name = croise ? 'bal-niveau' : ''; });
    if (croise && !etaitCroise) { var cochés = niveaux.filter(function (c) { return c.checked; }); niveaux.forEach(function (c) { c.checked = false; }); (cochés[0] || niveaux[0]).checked = true; }
    if (!croise && etaitCroise) niveaux.forEach(function (c) { c.checked = true; });
    bloc2.style.display = croise ? '' : 'none';
    lab1.innerHTML = croise ? lab1.getAttribute('data-lab1').replace(/Niveaux d.analyse/i, "Niveaux d'analyse — critère principal") : lab1.getAttribute('data-lab1');
    info.textContent = axe2.value
      ? 'Un niveau d\'analyse au choix (un seul) pour chaque critère. Croisé : ' + plan.options[plan.selectedIndex].textContent + ' × ' + axe2.options[axe2.selectedIndex].textContent +
        ' — le croisement n\'est pas alimenté dans la maquette, la balance reste restituée sur l\'axe principal.'
      : 'Mono-critère : la balance sera restituée uniquement sur l\'axe principal.';
  }
  plan.addEventListener('change', axes); axe2.addEventListener('change', axes);

  function reinitialiser() {
    exo.selectedIndex = 1; dp.reset(); dates();
    dep.selectedIndex = 0; plan.value = PLAN_DONNEES; axe2.value = '';
    niveaux.forEach(function (c) { c.checked = true; });
    niveaux2.forEach(function (c, i) { c.checked = i === niveaux2.length - 1; });
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
    if (!niveaux.some(function (c) { return c.checked; })) return axe2.value ? 'Choisissez le niveau d\'analyse.' : 'Cochez au moins un niveau d\'analyse.';
    if (axe2.value && niveaux.filter(function (c) { return c.checked; }).length !== 1) return 'Critère principal : choisissez un seul niveau d\'analyse.';
    if (axe2.value && niveaux2.filter(function (c) { return c.checked; }).length !== 1) return 'Critère secondaire : choisissez un seul niveau d\'analyse.';
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
    var base = (!couvre || plan.value !== PLAN_DONNEES || dep.value !== TYPE_DONNEES) ? [] : COMPTES;
    return window.ECRITURES_SAISIES ? window.ECRITURES_SAISIES.balance(base, deb.value, fin.value, true) : base;   // + écritures saisies imputées
  }

  // Critère 1 (principal) en sous-totaux, critère 2 (secondaire) en détail : les montants de chaque sous-total sont ventilés sur les éléments du plan secondaire (au niveau choisi), la somme du détail égale le sous-total
  function hash(t) { var h = 7; for (var i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) >>> 0; return h; }
  function elementsPlan2(n2) {
    var L = window.PLANS_LIGNES && window.PLANS_LIGNES[axe2.value], rows = L && L.rows ? L.rows.filter(function (x) { return x.actif !== false; }) : [];
    // éléments du niveau choisi ; si le plan n'a pas ce niveau, le niveau disponible le plus proche (≤ au niveau choisi, sinon le plus haut)
    var lv = function (x) { return L && L.niveau ? L.niveau(x.code) : 1; }, niv = rows.map(lv).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }), cible = niv.filter(function (v) { return v <= n2; }).pop() || niv[0];
    var E = rows.filter(function (x) { return lv(x) === cible; }).map(function (x) { return { code: String(x.code), libelle: x.libelle || '' }; }).sort(function (a, b) { return a.code < b.code ? -1 : 1; });
    if (!E.length) for (var i = 1; i <= 6; i++) E.push({ code: axe2.value.replace('PLAN', 'P') + '-' + i, libelle: 'Élément ' + i });
    return E;
  }
  function croiser(comptes, garde) {
    var n1 = niveaux.map(function (c) { return c.checked; }).indexOf(true) + 1, n2 = niveaux2.map(function (c) { return c.checked; }).indexOf(true) + 1, E = elementsPlan2(n2), html = '', n = 0, vus = {}, tous = [];
    comptes.forEach(function (c) {
      var g = c.code.slice(0, n1); if (vus[g]) return; vus[g] = 1;
      var G = comptes.filter(function (x) { return x.code.indexOf(g) === 0; }), S = cumul(G), lib = n1 === 5 ? G[0].libelle : (LIBELLES[g] || g);
      var h = hash(g), k = Math.min(E.length, 2 + (h % 3)), det = [], w = [], sw = 0;
      for (var i = 0; i < k; i++) { var e = E[(h + i * 7) % E.length]; if (det.some(function (d) { return d.code === e.code; })) { e = E[(h + i * 7 + 1) % E.length]; if (det.some(function (d) { return d.code === e.code; })) continue; } det.push({ code: e.code, libelle: e.libelle, anD: 0, anC: 0, mvD: 0, mvC: 0 }); w.push(1 + ((h >>> (i * 3)) % 5)); sw += w[w.length - 1]; }
      ['anD', 'anC', 'mvD', 'mvC'].forEach(function (cle) {
        var reste = S[cle], v = S[cle];
        det.forEach(function (d, j) { var p = j === det.length - 1 ? reste : Math.round(v * w[j] / sw); d[cle] = p; reste -= p; });
      });
      var dh = ''; det.sort(function (a, b) { return a.code < b.code ? -1 : 1; });
      det.forEach(function (d) {
        if (!garde(d.code, d.libelle) && !garde(g, lib)) return;
        dh += '<tr' + A + ' class="row-principale"><td' + A + ' class="code-link" title="' + esc(d.libelle) + '">' + esc(d.code) + '</td><td' + A + '>' + esc(d.libelle) + '</td>' + cellules(cumul([d])) + '</tr>'; n++;
      });
      if (dh || garde(g, lib)) html += dh + '<tr' + A + ' class="row-sous-total"><td' + A + ' class="code-link" title="' + esc(lib) + '">' + g + '</td><td' + A + '>Sous-total — ' + esc(lib) + '</td>' + cellules(S) + '</tr>';
      tous = tous.concat(det);
    });
    return { html: html, n: n, comptes: comptes };
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
    if (axe2.value && comptes.length) { var cr = croiser(comptes, garde); html = cr.html; n = cr.n; comptes = cr.comptes; }
    else {
      // Un seul critère : présentation hiérarchique comme la balance générale — chaque regroupement (niveaux 1 à 4) s'ouvre avant ses comptes, en retrait, avec ses montants cumulés
      var PAD = { 1: 10, 2: 28, 3: 46, 4: 64, 5: 82 }, ouverts = {};
      comptes.forEach(function (c) {
        [1, 2, 3, 4].forEach(function (l) {
          if (!vus[l - 1]) return; var g = c.code.slice(0, l);
          if (ouverts[l] === g) return; ouverts[l] = g; for (var m = l + 1; m <= 4; m++) ouverts[m] = null;
          var lib = LIBELLES[g] || g; if (!garde(g, lib)) return;
          html += '<tr' + A + ' class="row-sous-total"><td' + A + ' class="code-link" title="' + esc(lib) + '" style="padding-left: ' + PAD[l] + 'px;">' + g + '</td><td' + A + '>' + esc(lib) + '</td>' + cellules(cumul(comptes.filter(function (x) { return x.code.indexOf(g) === 0; }))) + '</tr>';
        });
        if (vus[4] && garde(c.code, c.libelle)) {
          html += '<tr' + A + ' class="row-principale"><td' + A + ' class="code-link" title="' + esc(c.libelle) + '" style="padding-left: ' + PAD[5] + 'px;">' + c.code + '</td><td' + A + '>' + esc(c.libelle) + '</td>' + cellules(cumul([c])) + '</tr>';
          n++;
        }
      });
    }
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
    q('.result-title').textContent = 'Balance Analytique — ' + plan.options[plan.selectedIndex].textContent + (axe2.value ? ' × ' + axe2.options[axe2.selectedIndex].textContent : '');
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
  filtreBtn.click();   // filtres de colonnes toujours affichés (le bouton est masqué)
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
