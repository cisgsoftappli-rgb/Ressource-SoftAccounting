/* Règle générale de la pagination des tableaux (charte §7.4, complément « Lignes par page ») :
   - à droite sous le tableau : « Lignes par page » (10 par défaut, puis 25, 50, 100), Précédent, numéros de page (sept au plus, avec ellipse), Suivant ;
     boutons de 36 px, page courante en marine plein ; barre affichée dès que la liste dépasse 10 lignes ;
   - le choix du nombre de lignes est mémorisé par liste (localStorage softcompta.pg.<écran>.<n° de tableau>) ;
   - la liste se termine à la fin de l'écran : la zone du tableau reçoit une hauteur maximale (défilement interne, en-tête fixe) pour que la barre de pagination reste en bas.
   Exclus : écrans d'états (EXCLUS), tableaux de fenêtres modales / barre d'actions / assistant, tableau marqué data-no-pg, tableau déjà suivi d'une pagination propre.
   Les lignes de total (attribut data-pg-keep ou classe contenant « tot ») restent toujours visibles. Le filtre / tri de tableaux.js (classe tf-off) est respecté.
   Ne pas nommer de fonction « $$ » (build.cjs). */
(function () {
  var EXCLUS = { balance: 1, balaux: 1, glg: 1, journal: 1, balana: 1, listedit: 1, recapexec: 1, fisctrait: 1, biledit: 1, cred: 1, ered: 1, tfted: 1, designer2: 1, listingdes: 1, designer: 1, modfisc2: 1, situation: 1 };
  var HORS = '[class*="-ov"],[class*="modal"],[role="dialog"],.ba-bar,.ai-pan,.custom-select-dropdown,.cb-pan,.etm-dialog,.pg-bar';
  var TAILLES = [10, 25, 50, 100];
  var css = '.pg-off{display:none!important}' +
    '.pg-bar{display:flex;justify-content:flex-end;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 0;font:400 12px var(--font-sans);color:#474C58}' +
    '.pg-bar label{display:inline-flex;align-items:center;gap:8px;margin-right:8px}' +
    '.pg-bar select{height:36px;min-width:64px;border:1px solid #878D9A;border-radius:8px;background:#fff;color:#353944;font:inherit;padding:0 8px}' +
    '.pg-bar button{min-width:36px;height:36px;padding:0 10px;border:1px solid #D6D9E0;border-radius:8px;background:#fff;color:#474C58;font:600 12px var(--font-sans);cursor:pointer}' +
    '.pg-bar button:hover:not(:disabled):not(.on){background:#E9EBF0}.pg-bar button.on{background:#2E427B;border-color:#2E427B;color:#fff}.pg-bar button:disabled{opacity:.4;cursor:not-allowed}' +
    '.pg-bar button:focus-visible,.pg-bar select:focus-visible{outline:3px solid #2E427B;outline-offset:2px}.pg-bar .pg-e{min-width:20px;text-align:center}' +
    '.pg-wrap{overflow:auto}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function filtree(r) { return r.classList.contains('tf-off') || r.hidden || r.style.display === 'none'; }
  function garde(r) { return r.hasAttribute('data-pg-keep') || /(^|[-_ ])tot(al)?([-_ ]|$)/i.test(r.className.replace(/pg-off|tf-off/g, '')); }
  function pages(c, n) {
    if (n <= 7) { var a = []; for (var i = 1; i <= n; i++) a.push(i); return a; }
    if (c <= 4) return [1, 2, 3, 4, 5, '…', n];
    if (c >= n - 3) return [1, '…', n - 4, n - 3, n - 2, n - 1, n];
    return [1, '…', c - 1, c, c + 1, '…', n];
  }
  function defileur(el) {
    for (var p = el.parentElement; p && p !== document.body; p = p.parentElement) { var o = getComputedStyle(p).overflowY; if ((o === 'auto' || o === 'scroll') && p.scrollHeight > p.clientHeight + 2) return p; }
    return document.scrollingElement || document.documentElement;
  }
  function fond(c) { var b = getComputedStyle(c).backgroundColor; return (!b || b === 'transparent' || /rgba\(.*,\s*0\)$/.test(b)) ? '#fff' : b; }

  function paginer(table, cle) {
    var tb = table.tBodies[0]; if (!tb || table.tBodies.length > 1) return;
    var parent = table.parentElement, seul = parent && parent.children.length === 1 && parent !== document.body;
    var wrap = seul ? parent : null, taille = 10, page = 1;
    try { var m = parseInt(localStorage.getItem('softcompta.pg.' + cle), 10); if (TAILLES.indexOf(m) >= 0) taille = m; } catch (e) {}
    var bar = document.createElement('div'); bar.className = 'pg-bar no-print'; bar.hidden = true; bar.setAttribute('role', 'navigation'); bar.setAttribute('aria-label', 'Pagination');
    (wrap || table).insertAdjacentElement('afterend', bar);
    if (wrap) wrap.classList.add('pg-wrap');
    var obs = new MutationObserver(function () { rafraichir(); });
    function observer() { obs.observe(tb, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'hidden', 'style'] }); }

    function rafraichir() {
      obs.disconnect();
      var rows = [].slice.call(tb.rows), vis = rows.filter(function (r) { return !filtree(r) && !garde(r); });
      var n = vis.length, np = Math.max(1, Math.ceil(n / taille)); if (page > np) page = np;
      rows.forEach(function (r) { if (garde(r)) r.classList.remove('pg-off'); });
      vis.forEach(function (r, i) { r.classList.toggle('pg-off', !(i >= (page - 1) * taille && i < page * taille)); });
      rows.forEach(function (r) { if (filtree(r)) r.classList.remove('pg-off'); });
      var afficher = n > TAILLES[0];
      bar.hidden = !afficher;
      if (afficher) {
        bar.innerHTML = '<label>Lignes par page <select aria-label="Lignes par page">' + TAILLES.map(function (t) { return '<option' + (t === taille ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></label>' +
          '<button type="button" data-pg="prec"' + (page <= 1 ? ' disabled' : '') + '>Précédent</button>' +
          pages(page, np).map(function (p) { return p === '…' ? '<span class="pg-e" aria-hidden="true">…</span>' : '<button type="button" data-pg="' + p + '"' + (p === page ? ' class="on" aria-current="page"' : '') + ' aria-label="Page ' + p + '">' + p + '</button>'; }).join('') +
          '<button type="button" data-pg="suiv"' + (page >= np ? ' disabled' : '') + '>Suivant</button>';
      }
      ajuster();
      observer();
    }
    bar.addEventListener('change', function (e) { if (e.target.tagName !== 'SELECT') return; taille = +e.target.value; page = 1; try { localStorage.setItem('softcompta.pg.' + cle, String(taille)); } catch (x) {} rafraichir(); });
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pg]'); if (!b || b.disabled) return; var k = b.dataset.pg;
      page = k === 'prec' ? page - 1 : k === 'suiv' ? page + 1 : +k; rafraichir();
    });
    // la liste se termine à la fin de l'écran : hauteur maximale de la zone du tableau, en-tête fixe
    function ajuster() {
      if (!wrap || !table.offsetParent) return;
      var sc = defileur(wrap), rs = sc.getBoundingClientRect ? sc.getBoundingClientRect() : { top: 0 }, doc = sc === document.scrollingElement || sc === document.documentElement;
      var haut = wrap.getBoundingClientRect().top - (doc ? 0 : rs.top) + (doc ? window.pageYOffset : sc.scrollTop);
      var dispo = (doc ? window.innerHeight - 56 : sc.clientHeight) - haut - (bar.hidden ? 16 : 64);
      wrap.style.maxHeight = Math.max(220, Math.floor(dispo)) + 'px';
      var th = table.tHead; if (!th) return; var top = 0;
      [].forEach.call(th.rows, function (r) { [].forEach.call(r.cells, function (c) { c.style.position = 'sticky'; c.style.top = top + 'px'; c.style.zIndex = 3; if (!c.__pgbg) { c.__pgbg = 1; c.style.backgroundColor = fond(c); } }); top += r.offsetHeight; });
    }
    table.__pg = { ajuster: ajuster, rafraichir: rafraichir };
    rafraichir();
  }

  function propre(t) {
    var box = t.parentElement && t.parentElement.parentElement; if (!box) return false;
    return /Page\s*\d+\s*(sur|\/)|Lignes par page/i.test(box.textContent.replace(/\s+/g, ' ')) && !box.querySelector('.pg-bar') || !!box.querySelector('[class*="pagin"],[data-pagin]');
  }
  function balayer() {
    document.querySelectorAll('[data-screen]').forEach(function (s) {
      if (EXCLUS[s.dataset.screen]) return;
      var tabs = s.querySelectorAll('table'), i = 0;
      [].forEach.call(tabs, function (t) {
        i++;
        if (t.__pg) { if (t.offsetParent) t.__pg.ajuster(); return; }
        if (t.__pgx || t.hasAttribute('data-no-pg') || t.closest(HORS) || !t.tBodies[0]) return;
        if (t.tBodies[0].rows.length <= TAILLES[0] && !t.offsetParent) return;      // écran masqué : on attend l'affichage
        if (propre(t)) { t.__pgx = 1; return; }
        try { paginer(t, s.dataset.screen + '.' + i); } catch (e) { t.__pgx = 1; }
      });
    });
  }
  window.addEventListener('resize', function () { document.querySelectorAll('table').forEach(function (t) { if (t.__pg) t.__pg.ajuster(); }); });
  setTimeout(balayer, 1000); setInterval(balayer, 1400);
})();
