// Grand livre auxiliaire (États comptables › Général) : critères d'édition (pop-up, voir etats_modale.js) puis écritures regroupées par tiers
// avec « Total » et « Solde » par tiers (et total par mois en option). Les mouvements sont ceux de la balance auxiliaire (window.BX_TIERS) :
// données de démonstration stables, générées par BALANCE_DETAIL ; le total de chaque tiers est égal à ses cumuls de la balance auxiliaire.
(function () {
  var root = document.querySelector('app-grand-livre-auxiliaire');
  if (!root || !window.BX_TIERS || !window.BALANCE_DETAIL) return;
  var q = function (s) { return root.querySelector(s); };
  var EXERCICE_DONNEES = '2026', T = window.BX_TIERS;
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function fr(v) { return v ? v.split('-').reverse().join('/') : ''; }
  function frd(d) { return ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear(); }
  function iso(d) { return d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '-' + ('0' + d.getUTCDate()).slice(-2); }
  function fmt(c) { if (!c) return '0'; var neg = c < 0; c = Math.abs(c); var e = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (neg ? '-' : '') + e + (c % 100 ? ',' + String(c % 100).padStart(2, '0') : ''); }
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  // --- Listes déroulantes ---
  var coll = q('#gla-collectif');
  function remplirColl() {   // collectifs de démonstration + collectifs mouvementés par les écritures saisies
    var v = coll.value, L = window.ECRITURES_SAISIES ? window.ECRITURES_SAISIES.collectifs(window.BX_COLLECTIFS) : window.BX_COLLECTIFS;
    coll.innerHTML = '<option value="">Sélectionner un compte collectif</option>' + L.map(function (c) { return '<option>' + esc(c) + '</option>'; }).join(''); coll.value = v;
  }
  remplirColl(); window.addEventListener('ecritures-pieces-changed', remplirColl);
  coll.selectedIndex = 1;
  var tiersOpt = T.map(function (t) { return '<option value="' + esc(t.code) + '">' + esc(t.code) + ' — ' + esc(t.libelle) + '</option>'; }).join('');
  var aDeb = q('#gla-aux-debut'), aFin = q('#gla-aux-fin');
  aDeb.innerHTML = aFin.innerHTML = '<option value="">Tous les comptes auxiliaires</option>' + tiersOpt;

  var E = window.ECRITURES_REF || {};
  var LISTES = { sites: (E.sites || []).map(function (s) { return s.code + ' — ' + s.label; }), plans: [], journaux: (E.journaux || []).map(function (j) { return j.code + (j.label ? ' — ' + j.label : ''); }) };
  var multis = [];
  Array.prototype.forEach.call(root.querySelectorAll('.bx-multi'), function (m) {
    var items = LISTES[m.dataset.multi], tous = m.dataset.tous;
    m.innerHTML = '<button type="button"><span class="v"></span><small></small></button><div class="pop"></div>';
    var b = m.querySelector('button'), v = m.querySelector('.v'), n = m.querySelector('small'), pop = m.querySelector('.pop');
    function remplir() { pop.innerHTML = items.length ? items.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'; }).join('') : '<span style="padding:8px 10px;color:#5B606D;font-size:12px">Aucun élément.</span>'; }
    function maj() { var c = m.valeurs(); v.textContent = c.length ? c.join(', ') : tous; v.className = 'v' + (c.length ? '' : ' vide'); n.textContent = c.length + '/' + items.length; }
    m.valeurs = function () { return Array.prototype.filter.call(m.querySelectorAll('input'), function (x) { return x.checked; }).map(function (x) { return x.value; }); };
    b.addEventListener('click', function (e) { e.stopPropagation(); multis.forEach(function (o) { if (o !== m) o.classList.remove('ouvert'); }); m.classList.toggle('ouvert'); });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    m.addEventListener('change', maj);
    m.reset = function () { Array.prototype.forEach.call(m.querySelectorAll('input'), function (x) { x.checked = false; }); maj(); };
    remplir(); m.reset(); multis.push(m);
    if (m.dataset.multi === 'plans') {
      var cle = null;
      m.refresh = function () {
        var g = window.REGROUPEMENT && window.REGROUPEMENT(), el = g ? g.elements.map(function (e) { return e.code + ' — ' + e.libelle; }) : [], k = el.join('|');
        if (k === cle) return; cle = k; items.length = 0; el.forEach(function (x) { items.push(x); }); remplir(); m.reset();
        if (g) m.title = 'Niveau ' + g.niveau + ' du plan ' + g.planLibelle;
      };
      m.refresh(); window.addEventListener('regroupement-changed', m.refresh); window.addEventListener('hashchange', function () { setTimeout(m.refresh, 250); });
    }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('app-grand-livre-auxiliaire .bx-multi')) multis.forEach(function (m) { m.classList.remove('ouvert'); }); });

  // --- Période : exercice ou programme (champ DP commun) ---
  var exo = q('#gla-exercice'), deb = q('#gla-date-debut'), fin = q('#gla-date-fin'), erreur = q('.bx-erreur'), mois = q('#gla-ana') && q('#gla-mois'), ana = q('#gla-ana');
  var dp = window.SoftDPFiltre ? window.SoftDPFiltre({ avant: exo.parentNode, attr: 'data-gla', id: 'gla-dp', ecran: 'glaux', exercice: exo, change: initDates }) : { valeur: function () { return null; }, reset: function () {} };
  function periode() { var d = dp.valeur(); return d ? { debut: d.debut, fin: d.fin } : { debut: exo.value + '-01-01', fin: exo.value + '-12-31' }; }
  function initDates() { var p = periode(); deb.value = p.debut; fin.value = p.fin; }
  exo.addEventListener('change', initDates);
  function reinitialiser() {
    exo.value = EXERCICE_DONNEES; dp.reset(); initDates(); coll.selectedIndex = 1; aDeb.value = aFin.value = ''; mois.checked = false; ana.checked = true;
    multis.forEach(function (m) { m.reset(); }); root.querySelector('input[name="gla-monnaie"]').checked = true;
    var ms = root.querySelector('[data-etm-monnaie] select'); if (ms) ms.value = 'MGA'; erreur.style.display = 'none';
  }
  q('.bx-reset').addEventListener('click', reinitialiser);
  reinitialiser();

  // --- Résultat ---
  var crit = q('.bx-crit'), res = q('.bx-res'), thead = q('.gla-table thead'), tbody = q('.gla-table tbody'), titre = q('.bx-titre'), rech = q('.bx-search'), hint = q('.bx-hint');
  var COLS = ['Date comptable', 'Date pièce', 'Référence', 'N° contrat', 'JL', 'N° pièce', 'Site', 'Compte', 'Contre partie', 'Libellé', 'Débit', 'Crédit', 'Plan 1', 'Plan 2', 'Plan 3', 'Plan 4', 'Plan 5', 'Plan 6', 'Plan 7', 'Plan 8', 'Plan 9', 'Plan 10', 'Plan regroupement'];
  var groupes = [], devise = 'MGA';
  function construire(cc, taux, d1, d2) {
    var iD = aDeb.value, iF = aFin.value, jr = multis[1].valeurs().map(function (x) { return x.split(' — ')[0]; });
    groupes = (window.ECRITURES_SAISIES ? window.ECRITURES_SAISIES.aux(T, cc) : T).filter(function (t) { /* + écritures saisies */ return (!iD || t.code >= iD) && (!iF || t.code <= iF); }).map(function (t) {
      var L = window.BALANCE_DETAIL.auxLignes(cc, t, cc).filter(function (x) { var s = iso(x.d); return s >= d1 && s <= d2 && (!jr.length || jr.indexOf(x.jl) >= 0); });
      L.forEach(function (x) { x.D = Math.round(x.D / taux); x.C = Math.round(x.C / taux); });
      return { code: t.code, libelle: t.libelle, lignes: L };
    }).filter(function (g) { return g.lignes.length; });
  }
  function afficher() {
    var mot = rech.value.trim().toLowerCase(), G = groupes.filter(function (g) { return !mot || (g.code + ' ' + g.libelle).toLowerCase().indexOf(mot) >= 0 || g.lignes.some(function (x) { return x.lib.toLowerCase().indexOf(mot) >= 0; }); });
    var anaOn = ana.checked, COLV = anaOn ? COLS : COLS.slice(0, 12);   // « Afficher les analytiques » : décoché, les colonnes Plan 1 à Plan 10 et Plan de regroupement sont masquées
    thead.innerHTML = '<tr>' + COLV.map(function (c) { return '<th' + (/^(Débit|Crédit)$/.test(c) ? ' class="n"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr>';
    var h = '', TD = 0, TC = 0, NC = COLV.length;
    G.forEach(function (g) {
      var D = 0, C = 0, mc = null, mD = 0, mC = 0;
      function totalMois() { if (mc !== null && mois.checked) h += '<tr class="gl-mois"><td colspan="10">Total ' + MOIS[mc % 12] + ' ' + (2000 + Math.floor(mc / 12)) + ' — ' + esc(g.code) + '</td><td class="n">' + fmt(mD) + '</td><td class="n">' + fmt(mC) + '</td>' + (NC > 12 ? '<td colspan="' + (NC - 12) + '"></td>' : '') + '</tr>'; mD = mC = 0; }
      h += '<tr class="gl-grp"><td><b>' + frd(g.lignes[0].d) + '</b></td><td colspan="' + (NC - 1) + '"><b>' + esc(g.code) + '</b> &nbsp;' + esc(g.libelle) + '</td></tr>';
      g.lignes.forEach(function (x) {
        var m = (x.d.getUTCFullYear() - 2000) * 12 + x.d.getUTCMonth(); if (mc !== null && m !== mc) totalMois(); mc = m;
        D += x.D; C += x.C; mD += x.D; mC += x.C;
        var p = x.p.concat(['', '', '', '', '', '']);
        h += '<tr><td>' + frd(x.d) + '</td><td>' + frd(x.dp) + '</td><td>' + (x.ref ? esc(x.ref) : '—') + '</td><td>' + esc(x.ct || '') + '</td><td>' + esc(x.jl) + '</td><td>' + esc(x.piece) + '</td><td>' + esc(x.site) + '</td><td>' + esc(x.compte) + '</td><td>' + esc(x.cp) + '</td><td class="l">' + esc(x.lib) + '</td><td class="n">' + fmt(x.D) + '</td><td class="n">' + fmt(x.C) + '</td>' +
          (anaOn ? [p[0], p[1], p[2], p[3], '', '', '', '', '', ''].map(function (v) { return '<td>' + esc(v) + '</td>'; }).join('') + '<td>' + esc(x.pr) + '</td>' : '') + '</tr>';
      });
      totalMois(); TD += D; TC += C;
      var s = D - C;
      h += '<tr class="gl-tot"><td colspan="10">Total — ' + esc(g.code) + '</td><td class="n">' + fmt(D) + '</td><td class="n">' + fmt(C) + '</td>' + (NC > 12 ? '<td colspan="' + (NC - 12) + '"></td>' : '') + '</tr>' +
        '<tr class="gl-tot"><td colspan="10">Solde — ' + esc(g.code) + '</td><td></td><td class="n">' + (s ? fmt(Math.abs(s)) + ' (' + (s > 0 ? 'D' : 'C') + ')' : '0') + '</td>' + (NC > 12 ? '<td colspan="' + (NC - 12) + '"></td>' : '') + '</tr>';
    });
    tbody.innerHTML = h || '<tr><td colspan="' + NC + '" class="bx-vide">Aucun mouvement ne correspond aux critères.</td></tr>';
    hint.textContent = G.length + ' tiers — total débit ' + fmt(TD) + ' · total crédit ' + fmt(TC) + ' (' + devise + '). Tableau défilable horizontalement — les colonnes Plan 1 à Plan 10 sont disponibles.';
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
    erreur.textContent = msg; erreur.style.display = msg ? '' : 'none'; if (msg) return;
    devise = root.querySelector('input[name="gla-monnaie"]:checked').value;
    var taux = devise === 'USD' ? ((window.COURS_API && window.COURS_API.taux && window.COURS_API.taux('USD', fin.value)) || 4400) : 1, cc = coll.value.split(' — ')[0], d2 = dp.valeur();
    construire(cc, taux, deb.value, fin.value);
    titre.textContent = 'GRAND LIVRE AUXILIAIRE ' + cc + ' AU ' + fr(fin.value) + ' (' + devise + ')' + (d2 ? ' — PROGRAMME ' + d2.code : '');
    rech.value = ''; afficher(); crit.style.display = 'none'; res.style.display = '';
  }
  q('.bx-consulter').addEventListener('click', consulter);
  q('.bx-retour').addEventListener('click', function () { res.style.display = 'none'; crit.style.display = ''; });
  rech.addEventListener('input', afficher);
  mois.addEventListener('change', function () { if (res.style.display !== 'none') afficher(); });
  q('.bx-pdf').addEventListener('click', function () { window.print(); });
  q('.bx-csv').addEventListener('click', function () {
    var rows = [['Tiers'].concat(COLS)], n = function (c) { return c ? (c / 100).toFixed(2).replace('.', ',') : ''; };
    groupes.forEach(function (g) { g.lignes.forEach(function (x) { rows.push([g.code, frd(x.d), frd(x.dp), x.ref, x.ct, x.jl, x.piece, x.site, x.compte, x.cp, x.lib, n(x.D), n(x.C)].concat(x.p.slice(0, 4), ['', '', '', '', '', ''], [x.pr])); }); });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'grand_livre_auxiliaire_' + fin.value + '.csv'; a.click();
  });
})();
