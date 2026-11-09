// États comptables › Général › Échéancier et balance âgée : critères d'édition (pop-up, voir etats_modale.js) puis résultat par tiers.
// Balance âgée : retard constaté à la date d'arrêté, réparti dans les fourchettes de jours paramétrées (non échu à part).
// Échéancier : échéances à venir réparties dans les mêmes fourchettes (échu à part). Les échéances ouvertes sont des données de démonstration
// générées de façon stable pour chaque tiers (aucune écriture réelle n'alimente cet état dans la maquette).
(function () {
  var root = document.querySelector('app-echeancier');
  if (!root) return;
  var q = function (s) { return root.querySelector(s); };
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
  function fr(v) { return v ? v.split('-').reverse().join('/') : ''; }
  function fmt(n) { n = Math.round(n * 100) / 100; if (!n) return '0'; var neg = n < 0; n = Math.abs(n); var p = n.toFixed(2).split('.'); var e = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (neg ? '-' : '') + e + (p[1] !== '00' ? ',' + p[1].replace(/0$/, '') : ''); }
  var REF = Date.UTC(2026, 10, 2);   // date de référence des échéances de démonstration
  function jour(iso) { var p = iso.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }

  // --- Listes à choix multiple (Centre de saisie, Journal, Plan de regroupement) ---
  var E = window.ECRITURES_REF || {};
  var LISTES = { sites: (E.sites || []).map(function (s) { return s.code + ' — ' + s.label; }), plans: [], journaux: (E.journaux || []).map(function (j) { return j.code + (j.label ? ' — ' + j.label : ''); }) };
  var multis = [];
  Array.prototype.forEach.call(root.querySelectorAll('.bx-multi'), function (m) {
    var items = LISTES[m.dataset.multi], tous = m.dataset.tous;
    m.innerHTML = '<button type="button"><span class="v"></span><small></small></button><div class="pop"></div>';
    var b = m.querySelector('button'), v = m.querySelector('.v'), n = m.querySelector('small'), pop = m.querySelector('.pop');
    function remplir() { pop.innerHTML = items.length ? items.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'; }).join('') : '<span style="padding:8px 10px;color:#5B606D;font-size:12px">Aucun élément.</span>'; }
    function maj() {
      var c = Array.prototype.filter.call(m.querySelectorAll('input'), function (x) { return x.checked; }).map(function (x) { return x.value; });
      v.textContent = c.length ? c.join(', ') : tous; v.className = 'v' + (c.length ? '' : ' vide'); n.textContent = c.length + '/' + items.length;
      return c;
    }
    m.valeurs = function () { return Array.prototype.filter.call(m.querySelectorAll('input'), function (x) { return x.checked; }).map(function (x) { return x.value; }); };
    b.addEventListener('click', function (e) { e.stopPropagation(); multis.forEach(function (o) { if (o !== m) o.classList.remove('ouvert'); }); m.classList.toggle('ouvert'); });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    m.addEventListener('change', maj);
    m.reset = function () { Array.prototype.forEach.call(m.querySelectorAll('input'), function (x) { x.checked = false; }); maj(); };
    remplir(); m.reset(); multis.push(m);
    if (m.dataset.multi === 'plans') {   // éléments du plan de regroupement (Administration de l'entité > Analytique)
      var cle = null;
      m.refresh = function () {
        var g = window.REGROUPEMENT && window.REGROUPEMENT(), el = g ? g.elements.map(function (e) { return e.code + ' — ' + e.libelle; }) : [], k = el.join('|');
        if (k === cle) return; cle = k; items.length = 0; el.forEach(function (x) { items.push(x); }); remplir(); m.reset();
        if (g) m.title = 'Niveau ' + g.niveau + ' du plan ' + g.planLibelle;
      };
      m.refresh(); window.addEventListener('regroupement-changed', m.refresh); window.addEventListener('hashchange', function () { setTimeout(m.refresh, 250); });
    }
  });
  document.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('.ech-page .bx-multi')) multis.forEach(function (m) { m.classList.remove('ouvert'); }); });

  // --- Comptes généraux de tiers (issus des tiers du plan) ---
  var T = window.TIERS_PLAN || [], PC = window.PLAN_COMPTABLE || [];
  function libCompte(c) { var r = PC.filter(function (x) { return x.code === c; })[0]; return r ? (r.libelle || r.label || '') : 'Compte collectif'; }
  function typeDe(t) { return root.querySelector('input[name="ech-type"]:checked').value === 'Client' ? t.sous === 'Client' : t.sous === 'Fournisseur'; }   // type du tiers (Saisie des plans › Tiers)
  var du = q('#ech-du'), au = q('#ech-au');
  function comptes() {
    var set = {}; T.forEach(function (t) { if (t.actif !== false && t.compte && typeDe(t)) set[t.compte] = 1; });
    return Object.keys(set).sort();
  }
  function majComptes() {
    var L = comptes(), o = L.map(function (c) { return '<option value="' + esc(c) + '">' + esc(c + ' — ' + libCompte(c)) + '</option>'; }).join('');
    du.innerHTML = au.innerHTML = o || '<option value="">Aucun compte</option>';
    du.value = L[0] || ''; au.value = L[L.length - 1] || '';
  }

  // --- Fourchettes de retard ---
  var DEFAUT = [[0, 30], [31, 60], [61, 90], [91, 120], [121, '']];
  var cols = [], enreg = [], zone = q('[data-ech-cols]'), bAdd = q('.ech-b-add'), bSave = q('.ech-b-save'), bUndo = q('.ech-b-undo');
  function copie(l) { return l.map(function (c) { return { min: c.min, max: c.max }; }); }
  function sale() { return JSON.stringify(cols) !== JSON.stringify(enreg); }
  function boutons() { bSave.disabled = bUndo.disabled = !sale(); }
  function dessinerCols() {
    zone.innerHTML = cols.map(function (c, i) {
      return '<tr data-i="' + i + '"><td class="c">' + (i + 1) + '</td><td><input type="number" min="0" data-f="min" value="' + esc(c.min) + '"></td><td><input type="number" min="0" data-f="max" placeholder="9999" value="' + esc(c.max) + '"></td>' +
        '<td class="c"><button type="button" class="ech-x" data-del title="Supprimer la colonne"' + (cols.length < 2 ? ' disabled' : '') + '><i class="ti ti-trash"></i></button></td></tr>';
    }).join(''); boutons();
  }
  function chargerDefaut() { cols = DEFAUT.map(function (d) { return { min: d[0], max: d[1] }; }); enreg = copie(cols); dessinerCols(); }
  zone.addEventListener('input', function (e) { var d = e.target.closest('[data-i]'); if (!d || !e.target.dataset.f) return; cols[+d.dataset.i][e.target.dataset.f] = e.target.value === '' ? '' : +e.target.value; boutons(); });
  zone.addEventListener('click', function (e) { var x = e.target.closest('[data-del]'); if (x && cols.length > 1) { cols.splice(+x.closest('[data-i]').dataset.i, 1); dessinerCols(); } });
  bAdd.addEventListener('click', function () { var l = cols[cols.length - 1], mn = l ? (l.max === '' ? (+l.min || 0) + 30 : +l.max + 1) : 0; if (l && l.max === '') l.max = mn - 1; cols.push({ min: mn, max: '' }); dessinerCols(); var w = q('.ech-tw'); w.scrollTop = w.scrollHeight; });
  bSave.addEventListener('click', function () { var m = verifierCols(); erreur.textContent = m; erreur.style.display = m ? '' : 'none'; if (!m) { enreg = copie(cols); boutons(); } });
  bUndo.addEventListener('click', function () { cols = copie(enreg); erreur.style.display = 'none'; dessinerCols(); });
  function libCol(c) { return c.max === '' ? 'À PARTIR DE ' + c.min : 'DE ' + c.min + ' À ' + c.max; }

  // --- Critères ---
  var exo = q('#ech-exercice'), dt = q('#ech-date'), erreur = q('.ech-erreur'), lib = q('[data-ech-datelib]');
  var dp = window.SoftDPFiltre ? window.SoftDPFiltre({ avant: exo.parentNode, attr: 'data-ech', id: 'ech-dp', ecran: 'echeancier', exercice: exo, change: function () {} }) : { valeur: function () { return null; }, reset: function () {} };
  function etat() { return root.querySelector('input[name="ech-etat"]:checked').value; }
  function majLib() { lib.textContent = etat() === 'echeancier' ? 'Échéancier au' : 'Balance âgée au'; }
  Array.prototype.forEach.call(root.querySelectorAll('input[name="ech-etat"]'), function (r) { r.addEventListener('change', majLib); });
  Array.prototype.forEach.call(root.querySelectorAll('input[name="ech-type"]'), function (r) { r.addEventListener('change', majComptes); });
  function aujourdhui() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function reinitialiser() {
    exo.value = '2026'; dp.reset(); dt.value = aujourdhui(); multis.forEach(function (m) { m.reset(); });
    root.querySelector('input[name="ech-monnaie"]').checked = true; root.querySelector('input[name="ech-etat"][value="balance"]').checked = true; root.querySelector('input[name="ech-type"]').checked = true;
    var ms = root.querySelector('[data-etm-monnaie] select'); if (ms) ms.value = 'MGA';
    majLib(); majComptes(); chargerDefaut(); erreur.style.display = 'none';
  }
  q('.ech-reset').addEventListener('click', reinitialiser);
  reinitialiser();

  // --- Échéances ouvertes de démonstration (stables par tiers) ---
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function echeances(t) {
    var h = hash(t.code + '|' + t.compte), n = h % 6 === 0 ? 1 + (h >> 3) % 3 : 0, L = [];
    for (var k = 0; k < n; k++) {
      var s = hash(t.code + t.compte + k), off = (s % 200) - 160 + (k * 17 % 40);   // échéance : de ~160 jours avant à ~40 jours après la date de référence
      var m = (((s >> 5) % 90) + 1) * 50000 * (s % 11 === 0 ? -1 : 1);
      L.push({ e: REF + off * 86400000, m: m });
    }
    // + écritures saisies du tiers sur ce compte : échéance saisie (sinon date de l’écriture), montant restant dû
    var ES = window.ECRITURES_SAISIES; if (ES) ES({ tiers: t.code }).forEach(function (x) { if (t.compte && x.compte !== t.compte) return; var v = /^40/.test(x.compte) ? x.credit - x.debit : x.debit - x.credit; if (v) L.push({ e: Date.parse((x.echeance || x.date) + "T00:00:00Z"), m: Math.round(v), saisi: true }); });
    return L;
  }

  // échéances ouvertes de démonstration, partagées avec le tableau de bord (balances âgées clients et fournisseurs par type de tiers)
  window.ECHEANCES_TIERS = { ref: REF, de: echeances };

  // --- Résultat ---
  var crit = q('.bx-crit'), res = q('.bx-res'), thead = q('.ech-table thead'), tbody = q('.ech-table tbody'), tfoot = q('.ech-table tfoot'), titre = q('.ech-titre'), sst = q('.ech-sstitre'), rech = q('.ech-search'), hint = q('.ech-hint');
  var courant = [], entetes = [];
  function calculer(echu, mode, D, taux) {
    var lignes = [];
    T.forEach(function (t) {
      if (t.actif === false || !t.compte || !typeDe(t) || t.compte < du.value || t.compte > au.value) return;
      var E = echeances(t); if (!E.length) return;
      var v = { code: t.code, libelle: t.nom, solde: 0, special: 0, items: [], b: cols.map(function () { return 0; }) };
      E.forEach(function (x) {
        var m = x.m / taux, retard = Math.floor((D - x.e) / 86400000), ecart = mode === 'balance' ? retard : -retard;   // balance : retard ; échéancier : jours restants
        v.solde += m; v.items.push({ e: x.e, m: m });
        if (mode === 'balance' ? retard < 0 : retard > 0) { v.special += m; return; }   // non échu (balance) / échu (échéancier)
        var j = mode === 'balance' ? retard : -retard;
        for (var i = 0; i < cols.length; i++) if (j >= cols[i].min && (cols[i].max === '' || j <= cols[i].max)) { v.b[i] += m; break; }
      });
      lignes.push(v);
    });
    return lignes.sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; });
  }
  function afficher() {
    var mot = rech.value.trim().toLowerCase();
    var l = courant.filter(function (t) { return !mot || (t.code + ' ' + t.libelle).toLowerCase().indexOf(mot) >= 0; });
    thead.innerHTML = '<tr><th>COMPTE</th><th>LIBELLÉ</th>' + entetes.map(function (h) { return '<th class="n">' + esc(h) + '</th>'; }).join('') + '</tr>';
    tbody.innerHTML = l.length ? l.map(function (t) {
      return '<tr data-code="' + esc(t.code) + '" data-k="' + courant.indexOf(t) + '" title="Double-clic : détail des échéances"><td>' + esc(t.code) + '</td><td>' + esc(t.libelle) + '</td><td class="n">' + fmt(t.solde) + '</td><td class="n">' + fmt(t.special) + '</td>' + t.b.map(function (x) { return '<td class="n">' + fmt(x) + '</td>'; }).join('') + '</tr>';
    }).join('') : '<tr><td colspan="' + (entetes.length + 2) + '" class="bx-vide">Aucune échéance ouverte ne correspond aux critères.</td></tr>';
    var s = { solde: 0, special: 0, b: cols.map(function () { return 0; }) };
    l.forEach(function (t) { s.solde += t.solde; s.special += t.special; t.b.forEach(function (x, i) { s.b[i] += x; }); });
    tfoot.innerHTML = '<tr><td colspan="2">Total (' + l.length + ' tiers)</td><td class="n">' + fmt(s.solde) + '</td><td class="n">' + fmt(s.special) + '</td>' + s.b.map(function (x) { return '<td class="n">' + fmt(x) + '</td>'; }).join('') + '</tr>';
  }
  function verifier() {
    if (!dt.value) return 'Renseignez la date d\'arrêté.';
    if (!du.value || !au.value) return 'Aucun compte général de tiers pour ce type d\'échéancier.';
    if (du.value > au.value) return 'Le compte de début doit précéder le compte de fin.';
    return verifierCols();
  }
  function verifierCols() {
    for (var i = 0; i < cols.length; i++) {
      var c = cols[i]; if (c.min === '' || isNaN(c.min)) return 'Colonne ' + (i + 1) + ' : renseignez le jour mini.';
      if (c.max === '' && i < cols.length - 1) return 'Colonne ' + (i + 1) + ' : le jour maxi est obligatoire sauf pour la dernière colonne.';
      if (c.max !== '' && c.max < c.min) return 'Colonne ' + (i + 1) + ' : le jour maxi doit être supérieur ou égal au jour mini.';
      if (i && c.min <= cols[i - 1].max) return 'Colonne ' + (i + 1) + ' : les fourchettes ne doivent pas se chevaucher.';
    }
    return '';
  }
  function consulter() {
    var msg = verifier(); erreur.textContent = msg; erreur.style.display = msg ? '' : 'none'; if (msg) return;
    var mode = etat(), devise = root.querySelector('input[name="ech-monnaie"]:checked').value, type = root.querySelector('input[name="ech-type"]:checked').value;
    var taux = devise === 'USD' ? ((window.COURS_API && window.COURS_API.taux && window.COURS_API.taux('USD', dt.value)) || 4400) : 1;
    entetes = ['SOLDE', mode === 'balance' ? 'NON ÉCHU' : 'ÉCHU'].concat(cols.map(libCol));
    courant = calculer(null, mode, jour(dt.value), taux);
    var d = dp.valeur(), sites = multis[0].valeurs();
    titre.textContent = (mode === 'balance' ? 'BALANCE ÂGÉE AU ' : 'ÉCHÉANCIER AU ') + fr(dt.value) + ' (' + devise + ')' + (d ? ' — PROGRAMME ' + d.code : '');
    sst.textContent = 'Du compte ' + du.value + ' au compte ' + au.value + ' · Type d\'échéancier : ' + type + ' · Site(s) : ' + (sites.length ? sites.map(function (s) { return s.split(' — ')[0]; }).join(', ') : 'Tous') + ' · Exercice ' + exo.value;
    rech.value = ''; hint.textContent = 'Double-clic sur une ligne pour afficher le détail des mouvements constituant le solde.';
    window.__echCtx = { courant: courant, type: type, du: du.value, au: au.value, date: fr(dt.value), devise: devise };
    afficher(); crit.style.display = 'none'; res.style.display = '';
  }
  q('.ech-consulter').addEventListener('click', consulter);
  q('.ech-retour').addEventListener('click', function () { res.style.display = 'none'; crit.style.display = ''; });
  rech.addEventListener('input', afficher);
  q('.ech-pdf').addEventListener('click', function () { window.print(); });
  q('.ech-csv').addEventListener('click', function () {
    var rows = [['Compte', 'Libellé'].concat(entetes)], n = function (x) { return (Math.round(x * 100) / 100).toFixed(2).replace('.', ','); };
    courant.forEach(function (t) { rows.push([t.code, t.libelle, n(t.solde), n(t.special)].concat(t.b.map(n))); });
    var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = (etat() === 'balance' ? 'balance_agee_' : 'echeancier_') + dt.value + '.csv'; a.click();
  });
})();
