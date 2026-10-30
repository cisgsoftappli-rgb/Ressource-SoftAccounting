/* Règle générale des tableaux (hors états comptables et états financiers) : un filtre par colonne (ligne ajoutée sous l'en-tête quand le tableau
   n'en a pas déjà un) et un tri A/Z, Z/A puis ordre d'origine au clic sur le nom de la colonne. Le tri ne déplace que les lignes dans le tableau
   (les lignes gardent leurs attributs : les écrans retrouvent leurs données par data-i) ; filtre et tri sont réappliqués quand l'écran redessine le corps
   du tableau. Exclus : écrans listés dans EXCLUS, tableaux de fenêtres modales, de la barre d'actions et de l'assistant, tableau marqué data-no-tf.
   Ne pas nommer de fonction « $$ » (build.cjs). */
(function () {
  var EXCLUS = { balance: 1, balaux: 1, glg: 1, journal: 1, balana: 1, listedit: 1, recapexec: 1, fisctrait: 1, biledit: 1, cred: 1, ered: 1, tfted: 1, designer2: 1, listingdes: 1, modfisc2: 1, situation: 1 };
  var HORS = '[class*="-ov"],[class*="modal"],[role="dialog"],.ba-bar,.ai-pan,.custom-select-dropdown,.cb-pan';
  var css = '.tf-s{cursor:pointer;user-select:none}.tf-s:hover{color:#2E427B}.tf-s::after{content:"↕";margin-left:6px;font-size:11px;opacity:.35}' +
    '.tf-s[aria-sort="ascending"]::after{content:"▲";opacity:1;color:#2E427B}.tf-s[aria-sort="descending"]::after{content:"▼";opacity:1;color:#2E427B}' +
    '.tf-s:focus-visible{outline:3px solid #2E427B;outline-offset:-3px}' +
    '.tf-row th{padding:3px 6px!important;background:#fff!important;border-bottom:1px solid #E9EBF0;text-transform:none!important;letter-spacing:0!important;font-weight:400!important}' +
    '.tf-row input{width:100%;min-width:56px;box-sizing:border-box;height:29px;border:1px solid #C5CAD6;border-radius:6px;padding:0 8px;font:400 9.6px var(--font-sans);color:#353944;background:#fff}' +
    '.tf-row input:focus-visible{outline:3px solid #2E427B;outline-offset:1px}.tf-off{display:none!important}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }
  function texteCellule(c) {
    if (!c) return '';
    var f = c.querySelector('select,input:not([type=checkbox]):not([type=radio])');
    if (f && f.tagName === 'SELECT') return f.options[f.selectedIndex] ? f.options[f.selectedIndex].text.trim() : '';
    if (f) return String(f.value || '').trim();
    var ck = c.querySelector('input[type=checkbox]'); if (ck && !c.textContent.trim()) return ck.checked ? '1' : '0';
    return c.textContent.replace(/\s+/g, ' ').trim();
  }
  function cle(t) {
    if (!t || /^[—–-]+$/.test(t)) return null;
    var m = t.match(/^(\d{2})\/(\d{2})\/(\d{4})/); if (m) return { n: +(m[3] + m[2] + m[1]) };
    if (/^[−-]?\s*\d[\d\s ]*([.,]\d+)?\s*(%|[A-Za-z]{1,3})?$/.test(t)) return { n: parseFloat(t.replace(/[\s ]/g, '').replace('−', '-').replace(',', '.')) };
    return { s: norm(t) };
  }
  function comparer(a, b) {
    if (a === null && b === null) return 0; if (a === null) return 1; if (b === null) return -1;     // les vides restent en bas
    if (a.n !== undefined && b.n !== undefined) return a.n - b.n;
    var x = a.s !== undefined ? a.s : String(a.n), y = b.s !== undefined ? b.s : String(b.n);
    return x.localeCompare(y, 'fr', { numeric: true, sensitivity: 'base' });
  }

  function equiper(table) {
    var th = table.tHead, tb = table.tBodies[0]; if (!th || !tb || table.tBodies.length > 1) return;
    var ligne = [].slice.call(th.rows).filter(function (r) { return [].some.call(r.cells, function (c) { return c.textContent.trim() && !c.querySelector('input,select'); }); })[0];
    if (!ligne) return;
    var simple = [].every.call(th.rows, function (r) { return [].every.call(r.cells, function (c) { return c.colSpan <= 1 && c.rowSpan <= 1; }); });
    var propre = !!th.querySelector('input:not([type=checkbox]):not([type=radio]),select');
    var etat = { col: -1, dir: 0, f: {} };
    var cells = [].slice.call(ligne.cells);

    // Tri : un clic sur le nom de la colonne (sauf si l'écran a déjà son propre tri)
    var triPropre = cells.some(function (c) { return getComputedStyle(c).cursor === 'pointer'; });
    if (simple && !triPropre) cells.forEach(function (c, i) {
      var t = c.textContent.replace(/\s+/g, ' ').trim();
      if (!t || c.querySelector('input,select,button') || /^(actions?|#)$/i.test(t) || c.classList.contains('tf-s')) return;
      c.classList.add('tf-s'); c.tabIndex = 0; c.setAttribute('aria-sort', 'none'); c.__i = i;
    });
    // Filtre : une ligne d'en-tête avec un champ par colonne si le tableau n'en a pas déjà
    if (!propre && simple) {
      var fr = document.createElement('tr'); fr.className = 'tf-row';
      cells.forEach(function (c, i) {
        var h = document.createElement('th'), t = c.textContent.replace(/\s+/g, ' ').trim();
        if (t && !c.querySelector('input,select') && !/^(actions?|#)$/i.test(t)) {
          var inp = document.createElement('input'); inp.type = 'search'; inp.placeholder = 'Filtrer'; inp.setAttribute('aria-label', 'Filtrer : ' + t); inp.autocomplete = 'off'; inp.dataset.tfc = i;
          h.appendChild(inp);
        }
        fr.appendChild(h);
      });
      th.appendChild(fr);
      if (getComputedStyle(cells[0]).position === 'sticky') { var hh = ligne.offsetHeight; [].forEach.call(fr.cells, function (h) { h.style.position = 'sticky'; h.style.top = hh + 'px'; h.style.zIndex = 2; }); }
      fr.addEventListener('input', function (e) { var i = e.target.dataset.tfc; if (i === undefined) return; etat.f[i] = norm(e.target.value); appliquer(); });
    }

    var obs = new MutationObserver(function () { appliquer(); });
    function appliquer() {
      obs.disconnect();
      var rows = [].slice.call(tb.rows), i;
      rows.forEach(function (r, k) { if (r.__o === undefined) r.__o = k; });
      rows.forEach(function (r) {
        var ok = true;
        Object.keys(etat.f).forEach(function (c) { if (ok && etat.f[c] && norm(texteCellule(r.cells[+c])).indexOf(etat.f[c]) < 0) ok = false; });
        r.classList.toggle('tf-off', !ok);
      });
      var tri = rows.slice();
      if (etat.col >= 0 && etat.dir) {
        var k = new Map(); rows.forEach(function (r) { k.set(r, cle(texteCellule(r.cells[etat.col]))); });
        tri.sort(function (a, b) { var c = comparer(k.get(a), k.get(b)); return c ? (k.get(a) && k.get(b) ? c * etat.dir : c) : a.__o - b.__o; });
      } else tri.sort(function (a, b) { return a.__o - b.__o; });
      var change = tri.some(function (r, j) { return r !== rows[j]; });
      if (change) { var fr2 = document.createDocumentFragment(); tri.forEach(function (r) { fr2.appendChild(r); }); tb.appendChild(fr2); }
      obs.observe(tb, { childList: true });
    }
    function trier(c) {
      var i = c.__i;
      if (etat.col === i) { etat.dir = etat.dir === 1 ? -1 : (etat.dir === -1 ? 0 : 1); if (!etat.dir) etat.col = -1; } else { etat.col = i; etat.dir = 1; }
      cells.forEach(function (x) { if (x.__i !== undefined) x.setAttribute('aria-sort', x.__i === etat.col ? (etat.dir === 1 ? 'ascending' : 'descending') : 'none'); });
      appliquer();
    }
    th.addEventListener('click', function (e) { var c = e.target.closest('th.tf-s'); if (c && !e.target.closest('input,select,button')) trier(c); });
    th.addEventListener('keydown', function (e) { var c = e.target.closest('th.tf-s'); if (c && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); trier(c); } });
    obs.observe(tb, { childList: true });
    table.__tf = true;
  }

  // Champs de filtre des colonnes : hauteur et police réduites d'un cinquième (36 px → 29 px, 12 px → 9,6 px) — style en ligne pour l'emporter sur les règles globales
  function reduireFiltres(s) {
    s.querySelectorAll('thead input:not([type=checkbox]):not([type=radio]):not([type=hidden]),thead select').forEach(function (e) {
      if (e.__tfr) return; e.__tfr = true;
      e.style.setProperty('height', '29px', 'important'); e.style.setProperty('min-height', '29px', 'important'); e.style.setProperty('font-size', '9.6px', 'important');
      e.style.setProperty('padding-top', '0', 'important'); e.style.setProperty('padding-bottom', '0', 'important');
    });
  }
  function balayer() {
    document.querySelectorAll('[data-screen]').forEach(function (s) {
      if (EXCLUS[s.dataset.screen]) return;
      reduireFiltres(s);
      s.querySelectorAll('table').forEach(function (t) {
        if (t.__tf || t.hasAttribute('data-no-tf') || t.closest(HORS)) return;
        t.__tf = true;
        try { equiper(t); } catch (e) {}
      });
    });
  }
  setTimeout(balayer, 900); setInterval(balayer, 1200);
})();
