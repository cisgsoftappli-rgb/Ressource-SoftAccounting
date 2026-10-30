// États comptables › Général (Balance générale, Balance auxiliaire, Grand livre général) :
// la fenêtre de critères d'édition devient une pop-up modale (charte §8.6 / §13.7).
// Les champs et boutons existants sont déplacés, pas recréés : leurs comportements restent branchés.
// Le bloc « critères » (crit) est affiché ou masqué par les scripts des écrans via crit.style.display ;
// la feuille ecrans/etats_modale.css en fait un voile modal quand il est affiché.
(function () {
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; }

  function modaliser(o) {
    var crit = o.crit; if (!crit || crit.getAttribute('data-etm')) return;
    var head = crit.querySelector('.etf-head'), carte = crit.querySelector('.etf-carte');
    if (!head || !carte) return;
    crit.setAttribute('data-etm', '');
    var titre = head.querySelector('.etf-titre'), actions = head.querySelector('.etf-actions');
    var h = titre.querySelector('.page-title'), sub = titre.querySelector('.page-subtitle');
    var libelle = h.textContent.trim(), intro = sub ? sub.textContent.trim() : '';
    var btns = actions.querySelectorAll('.toolbar-btn');
    var reset = btns[0], consulter = btns[1];

    // --- fenêtre : en-tête (titre, ×), corps (blocs de critères), pied (Réinitialiser | Annuler, Consulter) ---
    var id = 'etm-' + o.id;
    var dlg = el('div', 'etm-dialog');
    dlg.setAttribute('role', 'dialog'); dlg.setAttribute('aria-modal', 'true'); dlg.setAttribute('aria-labelledby', id);
    var hd = el('div', 'etm-head');
    var t = el('div', 'etm-titre');
    t.appendChild(el('span', 'etm-icone', titre.querySelector('.etf-icone') ? titre.querySelector('.etf-icone').innerHTML : '<i class="ti ti-filter"></i>'));
    var tx = el('div'); tx.appendChild(el('p', 'etm-eyebrow', 'Critères d\'édition')); var h2 = el('h2', 'etm-h', libelle); h2.id = id; tx.appendChild(h2);
    if (intro) tx.appendChild(el('p', 'etm-sub', intro));
    t.appendChild(tx); hd.appendChild(t);
    var x = el('button', 'etm-x', '<i class="ti ti-x"></i>'); x.type = 'button'; x.setAttribute('aria-label', 'Fermer'); hd.appendChild(x);
    var body = el('div', 'etm-body'); body.appendChild(carte);
    var ft = el('div', 'etm-foot');
    // Charte §13.5 / §8.1 : en bas à droite, secondaire « Réinitialiser », puis « Annuler », puis l'action principale « Rechercher »
    reset.classList.add('etm-reset');
    var droite = el('div', 'etm-droite');
    var annuler = el('button', 'toolbar-btn etm-annuler', 'Annuler'); annuler.type = 'button';
    consulter.innerHTML = consulter.innerHTML.replace('Consulter', 'Rechercher');
    droite.appendChild(reset); droite.appendChild(annuler); droite.appendChild(consulter); ft.appendChild(droite);
    dlg.appendChild(hd); dlg.appendChild(body); dlg.appendChild(ft);

    // --- bloc « critères » = voile modal ; le contenu d'origine est remplacé par la fenêtre ---
    var hote = o.hote || crit;
    Array.prototype.slice.call(hote.children).forEach(function (n) { n.remove(); });
    hote.appendChild(dlg);
    crit.classList.add('etm-voile');

    // --- fond de page tant que la fenêtre est fermée et que le résultat n'est pas affiché ---
    var fond = el('section', 'etm-fond');
    fond.appendChild(el('h1', 'etm-fond-titre', libelle));
    if (intro) fond.appendChild(el('p', 'etm-fond-sub', intro));
    var ouvrir = el('button', 'toolbar-btn toolbar-btn-primary etm-ouvrir', '<i class="ti ti-adjustments-horizontal"></i>Critères d\'édition'); ouvrir.type = 'button';
    fond.appendChild(ouvrir);
    fond.appendChild(el('p', 'etm-fond-aide', 'Renseignez les critères d\'édition pour afficher l\'état.'));
    crit.parentNode.insertBefore(fond, crit);

    function ouvrirF() { crit.style.display = ''; var f = dlg.querySelector('select,input:not([type=radio]):not([type=checkbox])'); if (f) setTimeout(function () { f.focus(); }, 0); }
    function fermer() { crit.style.display = 'none'; ouvrir.focus(); }
    ouvrir.addEventListener('click', ouvrirF);
    x.addEventListener('click', fermer); annuler.addEventListener('click', fermer);
    crit.addEventListener('mousedown', function (e) { if (e.target === crit) fermer(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && crit.offsetParent !== null && crit.style.display !== 'none') fermer(); });
    // Édition : la fenêtre de critères s'ouvre directement à chaque entrée dans l'écran tant qu'aucun résultat n'est affiché
    window.addEventListener('hashchange', function () { setTimeout(function () { var s = crit.closest('[data-screen]'); if (!s || !s.offsetWidth) return; var r = o.res && document.querySelector(o.res); if (r && r.offsetWidth) return; crit.style.display = ''; }, 150); });
    // L'état s'ouvre sur la fenêtre de critères (comportement d'origine : critères d'abord)
    if (crit.style.display !== 'none') crit.style.display = '';
  }

  var bal = document.querySelector('app-bg-criteres');
  if (bal) modaliser({ id: 'balance', res: 'app-bg-resultat', crit: bal, hote: bal.querySelector('main.bg-page') || bal });
  var aux = document.querySelector('app-balance-auxiliaire .bx-crit'); if (aux) modaliser({ id: 'balaux', res: 'app-balance-auxiliaire .bx-res', crit: aux });
  var glg = document.querySelector('app-grand-livre-general .bx-crit'); if (glg) modaliser({ id: 'glg', res: 'app-grand-livre-general .bx-res', crit: glg });
  // « Monnaie d'édition » : liste déroulante (les boutons radio d'origine restent dans le DOM, masqués, et suivent le choix)
  function monnaie(racine) {
    if (!racine) return;
    var lab = [].slice.call(racine.querySelectorAll('.filter-label')).filter(function (l) { return /Monnaie d.édition/i.test(l.textContent); })[0];
    if (!lab || lab.parentElement.getAttribute('data-etm-monnaie')) return;
    var champ = lab.parentElement; champ.setAttribute('data-etm-monnaie', '');
    var radios = [].slice.call(champ.querySelectorAll('input[type=radio]'));
    var opts = radios.length ? radios.map(function (r) { return { v: r.value, t: r.parentNode.textContent.trim(), r: r }; })
      : [{ v: 'MGA', t: 'Monnaie locale — MGA' }, { v: 'USD', t: 'Devise 1 — USD' }];
    var sel = document.createElement('select'); sel.className = 'filter-input'; sel.setAttribute('aria-label', 'Monnaie d\'édition');
    opts.forEach(function (o) { var op = document.createElement('option'); op.value = o.v; op.textContent = o.t; if (o.r && o.r.checked) op.selected = true; sel.appendChild(op); });
    sel.addEventListener('change', function () {
      opts.forEach(function (o) { if (o.r && o.v === sel.value) { o.r.checked = true; o.r.dispatchEvent(new Event('input', { bubbles: true })); o.r.dispatchEvent(new Event('change', { bubbles: true })); } });
    });
    [].slice.call(champ.children).forEach(function (c) { if (c !== lab) c.style.display = 'none'; });
    champ.appendChild(sel);
  }
  monnaie(bal); monnaie(aux); monnaie(glg);
})();
