// Refonte des filtres d'édition des états (styles : ecrans/etats_filtres.css).
// S'exécute après balance.js et balance_analytique.js : les champs existants sont déplacés (et non
// recréés), si bien que leurs comportements (DP, contrôles, recalculs) restent branchés.
(function () {
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }
  function bloc(icone, titre, cls) {
    var b = el('div', 'etf-bloc' + (cls ? ' ' + cls : ''));
    b.appendChild(el('span', 'etf-bloc-titre', '<i class="ti ' + icone + '"></i>' + titre));
    return b;
  }
  // Champ (div) d'une grille repéré par le libellé de son étiquette
  function champ(racine, libelle) {
    var l = Array.prototype.filter.call(racine.querySelectorAll('.filter-label'), function (x) {
      return x.textContent.trim().indexOf(libelle) === 0;
    })[0];
    return l ? l.parentNode : null;
  }

  // Champ « Plan de regroupement » : le composant capturé est inerte ; il est remplacé par la liste des éléments du niveau du plan choisi
  // (Administration de l'entité > Analytique). La sélection est lue par la balance (crit.__regr).
  function regroupement(champ, crit) {
    var lab = champ.querySelector('.filter-label');
    Array.prototype.slice.call(champ.children).forEach(function (c) { if (c !== lab) c.remove(); });
    var m = el('div', 'bx-multi'), note = el('span', 'filters-hint'), cle = null, items = [];
    champ.appendChild(m); champ.appendChild(note);
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    function valeurs() { return Array.prototype.filter.call(m.querySelectorAll('input'), function (x) { return x.checked; }).map(function (x) { return x.value; }); }
    function maj() { var c = valeurs(), v = m.querySelector('.v'), n = m.querySelector('small'); v.textContent = c.length ? c.join(', ') : 'Tous les éléments'; v.className = 'v' + (c.length ? '' : ' vide'); n.textContent = c.length + '/' + items.length; }
    function dessiner() {
      var g = window.REGROUPEMENT && window.REGROUPEMENT(), el2 = g ? g.elements.map(function (e) { return e.code + ' — ' + e.libelle; }) : [], k = el2.join('|');
      if (k === cle) return; cle = k; items = el2;
      m.innerHTML = '<button type="button"><span class="v"></span><small></small></button><div class="pop">' + (el2.length ? el2.map(function (i) { return '<label><input type="checkbox" value="' + esc(i) + '">' + esc(i) + '</label>'; }).join('') : '<span style="padding:8px 10px;color:#5B606D;font-size:12px">Aucun plan de regroupement choisi.</span>') + '</div>';
      note.textContent = g ? (g.plan === 'PC' ? '' : 'Plan « ' + g.planLibelle + ' » : sans effet sur les comptes de la balance générale.') : 'Aucun plan de regroupement choisi dans Analytique.';
      m.title = g ? 'Niveau ' + g.niveau + ' du plan ' + g.planLibelle : '';
      maj();
    }
    m.addEventListener('click', function (e) { var b = e.target.closest('button'); if (b && b.parentNode === m) { e.stopPropagation(); m.classList.toggle('ouvert'); } else if (e.target.closest('.pop')) e.stopPropagation(); });
    m.addEventListener('change', maj);
    document.addEventListener('click', function () { m.classList.remove('ouvert'); dessiner(); }, true);
    window.addEventListener('regroupement-changed', dessiner); window.addEventListener('hashchange', function () { setTimeout(dessiner, 250); });
    crit.__regr = function () { var g = window.REGROUPEMENT && window.REGROUPEMENT(); return g ? { plan: g.plan, codes: valeurs().map(function (v) { return v.split(' — ')[0]; }) } : null; };
    dessiner();
  }

  // ---------- Balance générale : page « critères d'édition » ----------
  (function () {
    var crit = document.querySelector('app-bg-criteres');
    if (!crit) return;
    var page = crit.querySelector('main.bg-page');
    crit.setAttribute('data-etf', '');
    var header = page.querySelector('.page-header'), carte = page.querySelector('.filters-card');
    var reset = header.querySelector('.toolbar .toolbar-btn'), consulter = carte.querySelector('.filters-actions .toolbar-btn-primary');
    var erreur = carte.querySelector('.filters-erreur');
    var grille = carte.querySelector('.filters-grid'), second = carte.querySelector('.filters-secondary');

    // En-tête : icône + titre, actions à droite (Consulter remonte dans l'en-tête)
    var head = el('div', 'etf-head'), titre = el('div', 'etf-titre');
    titre.appendChild(el('span', 'etf-icone', '<i class="ti ti-scale"></i>'));
    var t = el('div'); t.appendChild(header.querySelector('.page-title')); t.appendChild(header.querySelector('.page-subtitle'));
    titre.appendChild(t); head.appendChild(titre);
    var actions = el('div', 'etf-actions');
    reset.insertAdjacentHTML('afterbegin', '<i class="ti ti-rotate"></i>');
    consulter.insertAdjacentHTML('afterbegin', '<i class="ti ti-search"></i>');
    actions.appendChild(reset); actions.appendChild(consulter); head.appendChild(actions);

    // Bloc 1 : période et périmètre — Site, DP, Exercice, Date début, Date fin
    var b1 = bloc('ti-calendar-event', 'Période et périmètre'), l1 = el('div', 'etf-ligne');
    ['Site', 'Devis programme', 'Exercice', 'Date début', 'Date fin'].forEach(function (n) { var c = champ(grille, n); if (c) l1.appendChild(c); });
    b1.appendChild(l1);
    // Bloc 2 : comptes et journaux — Journal, Du compte, Au compte, Plan de regroupement
    var b2 = bloc('ti-list-numbers', 'Comptes et journaux'), l2 = el('div', 'etf-ligne');
    ['Journal', 'Du compte', 'Au compte'].forEach(function (n) { var c = champ(grille, n); if (c) l2.appendChild(c); });
    var planRgp = champ(second, 'Plan de regroupement'); if (planRgp) { regroupement(planRgp, crit); l2.appendChild(planRgp); }
    b2.appendChild(l2);
    // Bloc 3 : présentation — niveaux (pastilles) | solde tiers (pastilles) | monnaie
    var b3 = bloc('ti-adjustments-horizontal', 'Présentation'), l3 = el('div', 'etf-presentation');
    var niveaux = second.querySelector('.niveaux-group'), solde = Array.prototype.filter.call(second.querySelectorAll('fieldset'), function (f) { return f !== niveaux; })[0];
    var monnaie = carte.querySelector('.monnaie-group');
    [[niveaux, 'Niveaux des comptes'], [solde, 'Solde tiers'], [monnaie, 'Monnaie d\'édition']].forEach(function (x) {
      var f = x[0]; if (!f) return;
      var d = el('div'); d.appendChild(el('span', 'filter-label', x[1]));
      var corps = el('div', f === monnaie ? '' : 'etf-pastilles');
      Array.prototype.slice.call(f.childNodes).forEach(function (n) { if (n.nodeName !== 'LEGEND') corps.appendChild(n); });
      d.appendChild(corps); l3.appendChild(d); f.remove();
    });
    b3.appendChild(l3);

    var nouvelle = el('section', 'etf-carte');
    [b1, b2, b3, erreur].forEach(function (x) { if (x) nouvelle.appendChild(x); });
    // Remplacement : fil d'Ariane interne, en-tête, « Étape 1 » et ancienne carte
    ['.page-breadcrumb', '.filters-step'].forEach(function (s) { var x = page.querySelector(s); if (x) x.remove(); });
    header.replaceWith(head);
    carte.replaceWith(nouvelle);
  })();

  // ---------- Balance analytique : fenêtre « Critères de restitution » ----------
  (function () {
    var dialog = document.querySelector('app-balance-analytique [role="dialog"]');
    if (!dialog) return;
    dialog.setAttribute('data-etf', '');
    var body = dialog.querySelector('[modal-body]');
    // Niveaux d'analyse en pastilles
    var box = body.querySelector('.niveaux-box'); if (box) box.classList.add('etf-pastilles');
    // Icônes de section
    var icones = ['ti-calendar-event', 'ti-receipt', 'ti-hierarchy-2'];
    Array.prototype.forEach.call(body.querySelectorAll('.filters-title'), function (h, i) {
      var b = h.querySelector('.badge-num'); if (b) b.innerHTML = '<i class="ti ' + icones[i] + '"></i>';
    });
    var footer = dialog.querySelector('.footer-actions');
    var bt = footer.querySelectorAll('.toolbar-btn');
    bt[0].insertAdjacentHTML('afterbegin', '<i class="ti ti-rotate"></i> ');
    bt[2].insertAdjacentHTML('afterbegin', '<i class="ti ti-player-play"></i> ');
  })();
})();
