// Grand livre général (États comptables › Général) : critères d'édition puis détail chronologique par compte.
// Les lignes viennent de la capture (exercice 2026, window.GLG_COMPTES). Les dates, journaux et plages de comptes
// filtrent réellement les lignes ; totaux et soldes sont recalculés. Rendu par tranches (7 000+ lignes).
(function () {
  var root = document.querySelector('app-grand-livre-general');
  if (!root || !window.GLG_COMPTES) return;
  var q = function (s) { return root.querySelector(s); };
  var EXERCICE_DONNEES = '2026', TRANCHE = 400;

  // --- Données : lignes décodées une fois ---
  function cents(t) { t = (t || '').replace(/[\s  ]/g, '').replace(',', '.'); return t ? Math.round(parseFloat(t) * 100) : 0; }
  function fmt(c) {
    var neg = c < 0; c = Math.abs(c);
    return (neg ? '-' : '') + String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ',' + String(c % 100).padStart(2, '0');
  }
  function iso(d) { return d.split('/').reverse().join('-'); }
  function fr(v) { return v ? v.split('-').reverse().join('/') : ''; }
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  var JOURNAUX = {};
  var COMPTES = window.GLG_COMPTES.map(function (c) {
    return { code: c.c, libelle: c.l, lignes: c.L.map(function (l) {
      var f = l.split('\t'); JOURNAUX[f[5]] = 1;
      return { f: f, date: iso(f[0]), d: cents(f[9]), c: cents(f[10]), txt: (f[0] + ' ' + f[6] + ' ' + f[7] + ' ' + f[8] + ' ' + c.c).toLowerCase() };
    }) };
  });

  // --- Listes ---
  var duS = q('#glg-du'), auS = q('#glg-au');
  var opt = COMPTES.map(function (c) { return '<option value="' + c.code + '">' + c.code + ' — ' + esc(c.libelle) + '</option>'; }).join('');
  duS.innerHTML = '<option value="">Tous les comptes</option>' + opt; auS.innerHTML = duS.innerHTML;
  var LISTES = { sites: ['Siège'], journaux: Object.keys(JOURNAUX).sort(), regr: [] };
  var multis = [];
  Array.prototype.forEach.call(root.querySelectorAll('.bx-multi'), function (m) {
    var items = LISTES[m.dataset.multi], tous = m.dataset.tous;
    m.innerHTML = '<button type="button"><span class="v"></span><small></small></button><div class="pop">' +
      items.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'; }).join('') + '</div>';
    var v = m.querySelector('.v'), n = m.querySelector('small');
    function maj() { var c = m.valeurs(); v.textContent = c.length ? c.join(', ') : tous; v.className = 'v' + (c.length ? '' : ' vide'); n.textContent = c.length + '/' + items.length; }
    m.valeurs = function () { return Array.prototype.filter.call(m.querySelectorAll('input'), function (x) { return x.checked; }).map(function (x) { return x.value; }); };
    m.querySelector('button').addEventListener('click', function (e) { e.stopPropagation(); multis.forEach(function (o) { if (o !== m) o.classList.remove('ouvert'); }); m.classList.toggle('ouvert'); });
    m.querySelector('.pop').addEventListener('click', function (e) { e.stopPropagation(); });
    m.addEventListener('change', maj);
    // Site : « Siège » est sélectionné par défaut (comme l'application)
    m.reset = function () { Array.prototype.forEach.call(m.querySelectorAll('input'), function (x) { x.checked = m.dataset.multi === 'sites'; }); maj(); };
    m.reset(); multis.push(m);
    if (m.dataset.multi === 'regr') {   // éléments du niveau du plan de regroupement (Administration de l'entité > Analytique)
      var cle = null;
      m.refresh = function () {
        var g = window.REGROUPEMENT && window.REGROUPEMENT(), el = g ? g.elements.map(function (e) { return e.code + ' — ' + e.libelle; }) : [], k = el.join('|');
        if (k === cle) return; cle = k;
        items.length = 0; el.forEach(function (x) { items.push(x); });
        m.querySelector('.pop').innerHTML = el.length ? el.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'; }).join('') : '<span style="padding:8px 10px;color:#5B606D;font-size:12px">Aucun plan de regroupement choisi.</span>';
        m.title = g ? 'Niveau ' + g.niveau + ' du plan ' + g.planLibelle : '';
        m.reset();
      };
      m.refresh(); window.addEventListener('regroupement-changed', m.refresh); window.addEventListener('hashchange', function () { setTimeout(m.refresh, 250); });
      document.addEventListener('click', function () { m.refresh(); }, true);
    }
  });
  document.addEventListener('click', function () { multis.forEach(function (m) { m.classList.remove('ouvert'); }); });

  // --- Période : exercice ou programme ---
  var exo = q('#glg-exercice'), deb = q('#glg-date-debut'), fin = q('#glg-date-fin'), erreur = q('.bx-erreur');
  var dp = window.SoftDPFiltre({ avant: exo.parentNode, attr: 'data-bx', id: 'glg-dp', ecran: 'glg', exercice: exo, change: initDates });
  function periode() {
    var d = dp.valeur();
    return d ? { debut: d.debut, fin: d.fin } : { debut: exo.value + '-01-01', fin: exo.value + '-12-31' };
  }
  function initDates() { var p = periode(); deb.value = p.debut; fin.value = p.fin; }
  exo.addEventListener('change', initDates);
  function reinitialiser() {
    exo.value = EXERCICE_DONNEES; dp.reset(); initDates(); duS.value = auS.value = '';
    multis.forEach(function (m) { m.reset(); }); plansIn.forEach(function (x) { x.checked = false; }); colonnes(); parMois.checked = false; root.querySelector('input[name="glg-monnaie"]').checked = true; erreur.style.display = 'none';
  }
  q('.bx-reset').addEventListener('click', reinitialiser);

  // --- Résultat ---
  var crit = q('.bx-crit'), res = q('.bx-res'), tbody = q('tbody'), titre = q('.bx-titre'), rech = q('.bx-search'), hint = q('.bx-hint'), totaux = q('.glg-totaux');
  var groupes = [], affiche = 0, plat = [];   // plat : lignes de tableau décrites {t:'g'|'l'|'t'|'s', ...}
  var NOTE = hint.textContent;

  // Plan de regroupement : colonnes Plan 1 à 4 affichées (aucune case = toutes) ; « Tous » coche l'ensemble
  var plansBox = root.querySelector('.glg-plans'), plansIn = Array.prototype.slice.call(plansBox.querySelectorAll('input'));
  var styleCol = document.createElement('style'); root.appendChild(styleCol);
  function colonnes() {
    var c = plansIn.slice(1).filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
    var cache = c.length ? plansIn.slice(1).filter(function (x) { return !x.checked; }).map(function (x) { return x.value; }) : [];
    styleCol.textContent = cache.map(function (n) { return 'app-grand-livre-general .glg-table tr:not(.g):not(.t):not(.s):not(.m):not(.plus) > :nth-child(' + n + '){display:none}'; }).join('');
    return c.length;
  }
  plansBox.addEventListener('change', function (e) {
    var actifs = plansIn.slice(1).filter(function (x) { return !x.parentNode.classList.contains('plan-off'); }); // plans non activés exclus
    if (e.target === plansIn[0]) actifs.forEach(function (x) { x.checked = plansIn[0].checked; });
    else plansIn[0].checked = actifs.every(function (x) { return x.checked; });
    colonnes();
  });
  var parMois = q('#glg-mois');
  reinitialiser();

  function construire() {
    var mot = rech.value.trim().toLowerCase(), j = q('[data-multi="journaux"]').valeurs();
    var iDu = duS.value, iAu = auS.value;
    // Plan de regroupement : une ligne est retenue si sa valeur sur le plan choisi (ou son compte, pour le plan comptable) descend d'un élément coché
    var rg = q('[data-multi="regr"]').valeurs().map(function (v) { return v.split(' — ')[0]; }), G = window.REGROUPEMENT && window.REGROUPEMENT();
    function dansRg(x, c) {
      if (!rg.length || !G) return true;
      var v = G.plan === 'PC' ? c.code : ((x.f[11] || '').split('|')[(+G.plan.replace('PLAN', '')) - 1] || '');
      return rg.some(function (p) { return v.indexOf(p) === 0; });
    }
    plat = []; var gD = 0, gC = 0;
    COMPTES.forEach(function (c) {
      if ((iDu && c.code < iDu) || (iAu && c.code > iAu)) return;
      var l = c.lignes.filter(function (x) {
        return x.date >= deb.value && x.date <= fin.value && (!j.length || j.indexOf(x.f[5]) >= 0) && (!mot || x.txt.indexOf(mot) >= 0) && dansRg(x, c);
      });
      if (!l.length) return;
      var d = 0, cr = 0; l.forEach(function (x) { d += x.d; cr += x.c; });
      gD += d; gC += cr;
      plat.push({ t: 'g', c: c });
      var mois = null, md = 0, mc = 0;
      function fermer() { if (mois) plat.push({ t: 'm', mois: mois, d: md, cr: mc }); mois = null; md = mc = 0; }
      l.forEach(function (x) {
        var m = x.date.slice(0, 7);
        if (parMois.checked && mois && m !== mois) fermer();
        mois = m; md += x.d; mc += x.c;
        plat.push({ t: 'l', c: c, x: x });
      });
      if (parMois.checked) fermer();
      plat.push({ t: 't', c: c, d: d, cr: cr });
    });
    totaux.textContent = 'Totaux généraux — Débit : ' + fmt(gD) + ' | Crédit : ' + fmt(gC) + '  (' + devise() + ')';
    affiche = 0; tbody.innerHTML = ''; suite();
  }
  function devise() { return root.querySelector('input[name="glg-monnaie"]:checked').value; }
  function tr(t) {
    if (t.t === 'g') return '<tr class="g"><td>01/01/' + exo.value + '</td><td colspan="7"></td><td class="mono">' + t.c.code + '</td><td></td><td>' + esc(t.c.libelle) + '</td><td class="n"></td><td class="n"></td><td colspan="11"></td></tr>';
    if (t.t === 'm') return '<tr class="m"><td colspan="11">Total ' + t.mois.split('-').reverse().join('/') + ' — ' + '</td><td class="n">' + fmt(t.d) + '</td><td class="n">' + fmt(t.cr) + '</td><td colspan="11"></td></tr>';
    if (t.t === 't') {
      var s = t.d - t.cr;
      return '<tr class="t"><td colspan="11">Total — ' + t.c.code + '</td><td class="n">' + fmt(t.d) + '</td><td class="n">' + fmt(t.cr) + '</td><td colspan="11"></td></tr>' +
        '<tr class="s"><td colspan="11">Solde — ' + t.c.code + '</td><td colspan="2" class="n">' + fmt(Math.abs(s)) + ' (' + (s >= 0 ? 'D' : 'C') + ')</td><td colspan="11"></td></tr>';
    }
    var f = t.x.f, p = f[11].split('|'), h = '<tr data-ref="' + esc(f[6]) + '"><td>' + f[0] + '</td><td>' + (f[1] || f[0]) + '</td><td>' + esc(f[2]) + '</td><td>' + esc(f[3]) + '</td><td>' + esc(f[4]) + '</td><td>' + esc(f[5]) +
      '</td><td class="mono">' + esc(f[6]) + '</td><td>Siège</td><td class="mono">' + t.c.code + '</td><td class="mono">' + esc(f[7]) + '</td><td>' + esc(f[8]) + '</td><td class="n">' + (f[9] || '0,00') + '</td><td class="n">' + (f[10] || '0,00') + '</td>';
    for (var i = 0; i < 10; i++) h += '<td>' + esc(p[i] || '') + '</td>';
    return h + '<td>' + esc(f[12]) + '</td></tr>';
  }
  function suite() {
    var an = tbody.querySelector('tr.plus'); if (an) an.remove();
    if (!plat.length) { tbody.innerHTML = '<tr><td colspan="24" class="bx-vide">' + (deb.value > EXERCICE_DONNEES + '-12-31' || fin.value < EXERCICE_DONNEES + '-01-01'
      ? "Aucune écriture sur la période dans la maquette (seul l'exercice " + EXERCICE_DONNEES + ' est alimenté).' : 'Aucune écriture ne correspond aux critères.') + '</td></tr>'; return; }
    var fin2 = Math.min(plat.length, affiche + TRANCHE), h = '';
    // Ne pas couper un compte avant son total : on prolonge jusqu'à la ligne « t »
    while (fin2 < plat.length && plat[fin2 - 1].t !== 't') fin2++;
    for (var i = affiche; i < fin2; i++) h += tr(plat[i]);
    affiche = fin2;
    if (affiche < plat.length) h += '<tr class="plus"><td colspan="24"><button type="button">Afficher la suite (' + (plat.length - affiche) + ' lignes restantes)</button></td></tr>';
    tbody.insertAdjacentHTML('beforeend', h);
  }
  tbody.addEventListener('click', function (e) {
    if (e.target.closest('tr.plus button')) { suite(); return; }
    var l = e.target.closest('tr[data-ref]'); if (l) hint.textContent = 'Écriture ' + l.dataset.ref + ' (lecture seule) : non intégrée dans la maquette.';
  });

  function consulter() {
    var msg = '', d = dp.valeur();
    if (!deb.value || !fin.value) msg = 'Renseignez la période.';
    else if (deb.value > fin.value) msg = 'La date de début doit précéder la date de fin.';
    else if (d && (deb.value < d.debut || fin.value > d.fin)) msg = 'Les dates doivent être comprises dans le programme ' + d.code + ' (' + fr(d.debut) + ' – ' + fr(d.fin) + ').';
    else if (!d && (deb.value < exo.value + '-01-01' || fin.value > exo.value + '-12-31')) msg = "Les dates doivent être comprises dans l'exercice " + exo.value + '.';
    else if (duS.value && auS.value && duS.value > auS.value) msg = 'Le compte de début doit précéder le compte de fin.';
    erreur.textContent = msg; erreur.style.display = msg ? '' : 'none';
    if (msg) return;
    titre.textContent = 'GRAND LIVRE GÉNÉRAL au ' + fr(fin.value) + ' (' + devise() + ')' + (d ? ' — PROGRAMME ' + d.code : '');
    rech.value = ''; hint.textContent = NOTE; construire(); crit.style.display = 'none'; res.style.display = '';
  }
  q('.bx-consulter').addEventListener('click', consulter);
  q('.bx-retour').addEventListener('click', function () { res.style.display = 'none'; crit.style.display = ''; });
  var minuteur; rech.addEventListener('input', function () { clearTimeout(minuteur); minuteur = setTimeout(construire, 250); });
  q('.bx-pdf').addEventListener('click', function () { while (affiche < plat.length) suite(); window.print(); });
  q('.bx-csv').addEventListener('click', function () {
    var rows = [['Date comptable', 'Date pièce', 'Référence', 'Ligne budgétaire', 'N° contrat', 'JL', 'N° pièce', 'Site', 'Compte', 'Contre partie', 'Libellé', 'Débit', 'Crédit',
      'ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE', 'Plan 5', 'Plan 6', 'Plan 7', 'Plan 8', 'Plan 9', 'Plan 10', 'Plan de regroupement']];
    plat.forEach(function (t) {
      if (t.t !== 'l') return; var f = t.x.f, p = f[11].split('|');
      rows.push([f[0], f[1] || f[0], f[2], f[3], f[4], f[5], f[6], 'Siège', t.c.code, f[7], f[8], f[9] || '0,00', f[10] || '0,00'].concat([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return p[i] || ''; }), [f[12]]));
    });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'grand_livre_general_' + fin.value + '.csv'; a.click();
  });
})();
