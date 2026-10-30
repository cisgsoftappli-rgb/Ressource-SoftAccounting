// Balance auxiliaire (États comptables › Général) : critères d'édition puis résultat par tiers.
// Les cumuls viennent de la capture (exercice 2026, window.BX_TIERS) ; les dates ne filtrent pas les
// mouvements, mais un programme (DP) ou un exercice qui ne couvre pas 2026 donne un état vide.
(function () {
  var root = document.querySelector('app-balance-auxiliaire');
  if (!root || !window.BX_TIERS) return;
  var q = function (s) { return root.querySelector(s); };
  var EXERCICE_DONNEES = '2026';
  var T = window.BX_TIERS;

  function fmt(c) {
    if (!c) return '';
    var neg = c < 0; c = Math.abs(c);
    var e = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (neg ? '-' : '') + e + (c % 100 ? ',' + String(c % 100).padStart(2, '0').replace(/0$/, '') : '');
  }
  function fr(v) { return v ? v.split('-').reverse().join('/') : ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }

  // --- Listes déroulantes ---
  var coll = q('#bx-collectif');
  coll.innerHTML = '<option value="">Sélectionner un compte collectif</option>' + window.BX_COLLECTIFS.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join('');
  coll.selectedIndex = 1;
  var tiersOpt = T.map(function (t) { return '<option value="' + esc(t.code) + '">' + esc(t.code) + ' — ' + esc(t.libelle) + '</option>'; }).join('');
  var aDeb = q('#bx-aux-debut'), aFin = q('#bx-aux-fin');
  aDeb.innerHTML = aFin.innerHTML = '<option value="">Tous les comptes auxiliaires</option>' + tiersOpt;

  // Listes à choix multiple (Site, Journal, Plan de regroupement)
  var LISTES = { sites: ['Siège'], plans: ['Plan de regroupement général'],
    journaux: ['ACH — Achats', 'VTE — Ventes', 'BQ1 — Banque 1', 'BQ2 — Banque 2', 'CAI — Caisse', 'OD — Opérations diverses', 'AN — À nouveaux', 'SAL — Salaires',
      'IMM — Immobilisations', 'REG — Régularisations', 'DEC — Décaissements', 'ENC — Encaissements', 'FAC — Factures à recevoir', 'MIS — Missions', 'AVA — Avances',
      'RET — Retenues de garantie', 'TVA — Taxes', 'CLO — Clôture'] };
  var multis = [];
  Array.prototype.forEach.call(root.querySelectorAll('.bx-multi'), function (m) {
    var items = LISTES[m.dataset.multi], tous = m.dataset.tous;
    m.innerHTML = '<button type="button"><span class="v"></span><small></small></button><div class="pop">' +
      items.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'; }).join('') + '</div>';
    var b = m.querySelector('button'), v = m.querySelector('.v'), n = m.querySelector('small');
    function maj() {
      var c = Array.prototype.filter.call(m.querySelectorAll('input'), function (x) { return x.checked; }).map(function (x) { return x.value; });
      v.textContent = c.length ? c.join(', ') : tous; v.className = 'v' + (c.length ? '' : ' vide'); n.textContent = c.length + '/' + items.length;
      return c;
    }
    b.addEventListener('click', function (e) { e.stopPropagation(); multis.forEach(function (o) { if (o !== m) o.classList.remove('ouvert'); }); m.classList.toggle('ouvert'); });
    m.querySelector('.pop').addEventListener('click', function (e) { e.stopPropagation(); });
    m.addEventListener('change', maj);
    m.reset = function () { Array.prototype.forEach.call(m.querySelectorAll('input'), function (x) { x.checked = false; }); maj(); };
    m.reset(); multis.push(m);
    if (m.dataset.multi === 'plans') {   // éléments du plan de regroupement (Administration de l'entité > Analytique)
      var cle = null;
      m.refresh = function () {
        var g = window.REGROUPEMENT && window.REGROUPEMENT(), el = g ? g.elements.map(function (e) { return e.code + ' — ' + e.libelle; }) : [], k = el.join('|');
        if (k === cle) return; cle = k;
        items.length = 0; el.forEach(function (x) { items.push(x); });
        m.querySelector('.pop').innerHTML = el.length ? el.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'; }).join('') : '<span style="padding:8px 10px;color:#5B606D;font-size:12px">Aucun plan de regroupement choisi.</span>';
        if (g) m.title = 'Niveau ' + g.niveau + ' du plan ' + g.planLibelle;
        m.reset();
      };
      m.refresh(); window.addEventListener('regroupement-changed', m.refresh); window.addEventListener('hashchange', function () { setTimeout(m.refresh, 250); });
      document.addEventListener('click', function () { m.refresh(); }, true);
    }
  });
  document.addEventListener('click', function () { multis.forEach(function (m) { m.classList.remove('ouvert'); }); });

  // --- Période : exercice ou programme (champ DP commun) ---
  var exo = q('#bx-exercice'), deb = q('#bx-date-debut'), fin = q('#bx-date-fin'), erreur = q('.bx-erreur');
  var dp = window.SoftDPFiltre({ avant: exo.parentNode, attr: 'data-bx', id: 'bx-dp', ecran: 'balaux', exercice: exo, change: initDates });
  function periode() {
    var d = dp.valeur();
    return d ? { debut: d.debut, fin: d.fin, nom: 'le programme ' + d.code, libelle: d.code }
      : { debut: exo.value + '-01-01', fin: exo.value + '-12-31', nom: "l'exercice " + exo.value };
  }
  function initDates() { var p = periode(); deb.value = p.debut; fin.value = p.fin; }
  function avecDonnees() { return deb.value <= EXERCICE_DONNEES + '-12-31' && fin.value >= EXERCICE_DONNEES + '-01-01'; }
  exo.addEventListener('change', initDates);
  function reinitialiser() {
    exo.value = EXERCICE_DONNEES; dp.reset(); initDates(); coll.selectedIndex = 1; aDeb.value = aFin.value = '';
    multis.forEach(function (m) { m.reset(); });
    root.querySelector('input[name="bx-monnaie"]').checked = true; erreur.style.display = 'none';
  }
  q('.bx-reset').addEventListener('click', reinitialiser);
  reinitialiser();

  // --- Résultat ---
  var crit = q('.bx-crit'), res = q('.bx-res'), tbody = q('tbody'), tfoot = q('tfoot'), titre = q('.bx-titre'), rech = q('.bx-search'), hint = q('.bx-hint');
  var courant = [];
  function ligne(t) {
    var tot = [t.mvD, t.mvC], s = t.mvD - t.mvC;
    return '<tr data-code="' + esc(t.code) + '"><td>' + esc(t.code) + '</td><td>' + esc(t.libelle) + '</td><td class="n"></td><td class="n"></td><td class="n">' + fmt(t.mvD) +
      '</td><td class="n">' + fmt(t.mvC) + '</td><td class="n">' + fmt(tot[0]) + '</td><td class="n">' + fmt(tot[1]) + '</td><td class="n">' + (s > 0 ? fmt(s) : '') + '</td><td class="n">' + (s < 0 ? fmt(-s) : '') + '</td></tr>';
  }
  function afficher() {
    var mot = rech.value.trim().toLowerCase();
    var l = courant.filter(function (t) { return !mot || (t.code + ' ' + t.libelle).toLowerCase().indexOf(mot) >= 0; });
    tbody.innerHTML = l.length ? l.map(ligne).join('') : '<tr><td colspan="10" class="bx-vide">' +
      (!avecDonnees() ? 'Aucune écriture sur ' + periode().nom + " dans la maquette (seul l'exercice " + EXERCICE_DONNEES + ' est alimenté).' : 'Aucun tiers ne correspond aux critères.') + '</td></tr>';
    var s = [0, 0, 0, 0]; l.forEach(function (t) { var x = t.mvD - t.mvC; s[0] += t.mvD; s[1] += t.mvC; if (x > 0) s[2] += x; else s[3] -= x; });
    tfoot.innerHTML = '<tr><td colspan="2">Total</td><td class="n">0</td><td class="n">0</td><td class="n">' + fmt(s[0]) + '</td><td class="n">' + fmt(s[1]) + '</td><td class="n">' + fmt(s[0]) + '</td><td class="n">' +
      fmt(s[1]) + '</td><td class="n">' + fmt(s[2]) + '</td><td class="n">' + fmt(s[3]) + '</td></tr>';
  }
  function consulter() {
    var msg = '';
    if (!coll.value) msg = 'Sélectionnez un compte collectif.';
    else if (!deb.value || !fin.value) msg = 'Renseignez la période.';
    else if (deb.value > fin.value) msg = 'La date de début doit précéder la date de fin.';
    else {
      var d = dp.valeur(), p = periode();
      if (d && (deb.value < d.debut || fin.value > d.fin)) msg = 'Les dates doivent être comprises dans le programme ' + d.code + ' (' + fr(d.debut) + ' – ' + fr(d.fin) + ').';
      else if (!d && (deb.value < p.debut || fin.value > p.fin)) msg = "Les dates doivent être comprises dans l'exercice " + exo.value + '.';
      else if (aDeb.value && aFin.value && aDeb.value > aFin.value) msg = 'Le compte auxiliaire de début doit précéder celui de fin.';
    }
    erreur.textContent = msg; erreur.style.display = msg ? '' : 'none';
    if (msg) return;
    var iD = aDeb.value, iF = aFin.value;
    courant = avecDonnees() ? T.filter(function (t) { return (!iD || t.code >= iD) && (!iF || t.code <= iF); }) : [];
    var devise = root.querySelector('input[name="bx-monnaie"]:checked').value, d2 = dp.valeur();
    titre.textContent = 'BALANCE AUXILIAIRE ' + coll.value.split(' — ')[0] + ' au ' + fr(fin.value) + ' (' + devise + ')' + (d2 ? ' — PROGRAMME ' + d2.code : '');
    rech.value = ''; hint.textContent = 'Clic sur une ligne pour afficher le détail des écritures.';
    afficher(); crit.style.display = 'none'; res.style.display = '';
  }
  q('.bx-consulter').addEventListener('click', consulter);
  q('.bx-retour').addEventListener('click', function () { res.style.display = 'none'; crit.style.display = ''; });
  rech.addEventListener('input', afficher);
  tbody.addEventListener('click', function (e) {
    var tr = e.target.closest('tr[data-code]');
    if (tr) hint.textContent = 'Détail des écritures du tiers ' + tr.dataset.code + ' : non intégré dans la maquette.';
  });
  q('.bx-pdf').addEventListener('click', function () { window.print(); });
  q('.bx-csv').addEventListener('click', function () {
    var rows = [['Code', 'Libellé', 'A nouveau D', 'A nouveau C', 'Mouvements D', 'Mouvements C', 'Total D', 'Total C', 'Solde D', 'Solde C']];
    courant.forEach(function (t) {
      var s = t.mvD - t.mvC, n = function (c) { return c ? (c / 100).toFixed(2).replace('.', ',') : ''; };
      rows.push([t.code, t.libelle, '', '', n(t.mvD), n(t.mvC), n(t.mvD), n(t.mvC), n(s > 0 ? s : 0), n(s < 0 ? -s : 0)]);
    });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'balance_auxiliaire_' + fin.value + '.csv'; a.click();
  });
})();
