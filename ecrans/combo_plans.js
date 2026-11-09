// Listes de choix d'un élément de plan (compte, activité, code parent, tiers…) : la liste déroulante devient un panneau à deux colonnes
// « Code | Libellé », chacune avec son champ de recherche (filtre par code et par libellé). Le <select> d'origine reste la source de vérité
// (valeur, désactivation, événements change) : le composant ne fait que l'afficher et le piloter.
(function () {
  var CIBLES = '[data-pl] select[data-f=parent], [data-tx] select[data-f=compte], select[data-axe], #bg-compte-debut, #bg-compte-fin, #bx-collectif, #bx-aux-debut, #bx-aux-fin, #glg-du, #glg-au, select[data-combo]';
  var st = document.createElement('style');
  st.textContent =
    '.cb-box{display:flex;align-items:center;justify-content:space-between;gap:8px;width:100%;min-height:36px;padding:0 10px;border:1px solid #D6D9E0;border-radius:8px;background:#fff;font-size:12px;color:#0B1332;cursor:pointer;box-sizing:border-box}' +
    '.cb-box:focus-visible{outline:2px solid #2E427B;outline-offset:1px}.cb-box.dis{background:#F5F7F9;color:#8A8F9C;cursor:default}' +
    '.cb-box .cb-t{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.cb-box .cb-t.vide{color:#8A8F9C}.cb-box i{font-size:14px;color:#5B606D;flex:none}' +
    '.cb-pan{position:fixed;z-index:99999;display:flex;flex-direction:column;background:#fff;border:1px solid #D6D9E0;border-radius:8px;box-shadow:0 12px 32px #0b13322e;overflow:hidden;font-size:12px}' +
    '.cb-sc{overflow:auto;flex:1}.cb-tb{width:100%;border-collapse:collapse;table-layout:fixed}' +
    '.cb-tb th{position:sticky;top:0;z-index:1;padding:8px 10px;background:#F5F7F9;border-bottom:1px solid #E9EBF0;text-align:center;font-size:12px;font-weight:600;color:#0B1332}' +
    '.cb-tb tr.cb-f th{top:33px;background:#fff;padding:6px 6px}' +
    '.cb-tb td{padding:6px 10px;font-size:12px;border-bottom:1px solid #F1F2F5;color:#0B1332;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.cb-tb tbody tr{cursor:pointer}.cb-tb tbody tr:hover td,.cb-tb tbody tr.cb-on td{background:#E3EBFE}.cb-tb tbody tr.cb-sel td{font-weight:600;color:#2E427B}' +
    '.cb-in{position:relative;display:block}.cb-in i{position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:14px;color:#8A8F9C;pointer-events:none}' +
    '.cb-in input{width:100%;height:30px;padding:0 8px 0 28px;border:1px solid #D6D9E0;border-radius:6px;font-size:12px;box-sizing:border-box}' +
    '.cb-vide{padding:14px;text-align:center;color:#8A8F9C;font-size:12px}';
  document.head.appendChild(st);

  var ouvert = null;
  function nbCols(s) { return Math.max(2, ((s && s.getAttribute('data-combo-cols')) || 'a|b').split('|').length); }
  function decouper(txt, s) {
    if (s && s.getAttribute('data-combo-cols')) {
      var t = (txt || '').trim(), n = nbCols(s);
      if (n > 2) { var p = t.split(' — '); while (p.length < n) p.push(''); if (p.length > n) p = p.slice(0, n - 1).concat([p.slice(n - 1).join(' — ')]); return p; }
      var k = t.lastIndexOf(' — '); return k > 0 ? [t.slice(0, k), t.slice(k + 3)] : [t, ''];
    }
    var m = /^(\S+)\s+[—–-]\s+(.*)$/.exec((txt || '').trim()); return m ? [m[1], m[2]] : [(txt || '').trim(), ''];
  }
  function texte(s) { var o = s.options[s.selectedIndex]; return o ? o.textContent.trim() : ''; }
  function maj(c) {
    var s = c.sel, o = s.options[s.selectedIndex], t = c.box.querySelector('.cb-t');
    var vide = !o || o.value === '' || /^[—–-]/.test(o.textContent.trim());
    // choix fait : seul le code est affiché, le libellé reste en infobulle (il ne sert qu'à se repérer pendant la sélection)
    var tx = o ? o.textContent.trim() : '', d = vide ? null : s.getAttribute('data-combo-cols') ? [''].concat(decouper(tx, s)) : /^(\S+)\s+[—–-]\s+(.*)$/.exec(tx);
    t.textContent = d ? d[1] : tx; t.title = d ? tx : ''; t.classList.toggle('vide', !!vide);
    var dis = s.disabled; c.box.classList.toggle('dis', dis); c.box.setAttribute('aria-disabled', dis); c.box.tabIndex = dis ? -1 : 0;
  }
  function fermer() { if (!ouvert) return; ouvert.pan.remove(); ouvert.box.setAttribute('aria-expanded', 'false'); ouvert = null; document.removeEventListener('mousedown', hors, true); document.removeEventListener('keydown', clavier, true); window.removeEventListener('resize', fermer); }
  function hors(e) { if (ouvert && !ouvert.pan.contains(e.target) && !ouvert.box.contains(e.target)) fermer(); }
  function clavier(e) {
    if (!ouvert) return;
    if (e.key === 'Escape') { e.preventDefault(); var b = ouvert.box; fermer(); b.focus(); }
    else if (e.key === 'Enter' && ouvert.pan.contains(e.target)) { var tr = ouvert.pan.querySelector('tbody tr:not([hidden])'); if (tr) { e.preventDefault(); choisir(ouvert, tr.dataset.v); } }
  }
  function choisir(c, v) {
    var s = c.sel; s.value = v; var b = c.box; fermer();
    s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); maj(c); b.focus();
  }
  function ouvrir(c) {
    if (c.sel.disabled) return; if (ouvert) { var meme = ouvert === c; fermer(); if (meme) return; }
    var s = c.sel, cols = (s.getAttribute('data-combo-cols') || 'Code|Libellé').split('|'), N = Math.max(2, cols.length), opts = [].slice.call(s.options), pan = document.createElement('div'); pan.className = 'cb-pan';
    var r = c.box.getBoundingClientRect(), larg = Math.max(r.width, N > 2 ? 640 : 460), bas = window.innerHeight - r.bottom - 12, haut = r.top - 12, dessous = bas >= 260 || bas >= haut, h = Math.min(380, Math.max(200, dessous ? bas : haut));
    pan.style.width = Math.min(larg, window.innerWidth - 16) + 'px'; pan.style.left = Math.max(8, Math.min(r.left, window.innerWidth - larg - 8)) + 'px'; pan.style.maxHeight = h + 'px';
    if (dessous) pan.style.top = (r.bottom + 4) + 'px'; else pan.style.bottom = (window.innerHeight - r.top + 4) + 'px';
    var cg = N > 2 ? '<col style="width:24%"><col style="width:36%"><col>' : '<col style="width:34%"><col>', th = '', fl = '';
    for (var ci = 0; ci < N; ci++) { th += '<th>' + (cols[ci] || '') + '</th>'; fl += '<th><span class="cb-in"><i class="ti ti-search"></i><input data-cb="' + ci + '" placeholder="Rechercher…" aria-label="Filtrer ' + (cols[ci] || '') + '" autocomplete="off"></span></th>'; }
    pan.innerHTML = '<div class="cb-sc"><table class="cb-tb"><colgroup>' + cg + '</colgroup><thead><tr>' + th + '</tr><tr class="cb-f">' + fl + '</tr></thead><tbody></tbody></table><div class="cb-vide" hidden>Aucun résultat</div></div>';
    var tb = pan.querySelector('tbody');
    opts.forEach(function (o) {
      var tr = document.createElement('tr'), vide = o.value === '' || /^[—–-]/.test(o.textContent.trim()), d = vide ? ['', o.textContent.trim()] : decouper(o.textContent, s);
      tr.dataset.v = o.value; tr.dataset.vide = vide ? '1' : ''; if (o.disabled || o.hidden) { tr.hidden = true; tr.dataset.off = '1'; }
      if (o.value === s.value) tr.className = 'cb-sel';
      if (vide) { var a0 = document.createElement('td'); a0.colSpan = N; a0.textContent = d[1]; a0.style.color = '#5B606D'; tr.appendChild(a0); }
      else for (var k = 0; k < N; k++) { var td = document.createElement('td'); td.textContent = d[k] || ''; td.title = d[k] || ''; tr.appendChild(td); }
      tb.appendChild(tr);
    });
    function filtrer() {
      var f = [].slice.call(pan.querySelectorAll('[data-cb]')).map(function (i) { return i.value.trim().toLowerCase(); }), n = 0, actif = f.some(function (v) { return v; });
      [].slice.call(tb.rows).forEach(function (tr) {
        var ok = !tr.dataset.off && (tr.dataset.vide ? !actif : f.every(function (v, k) { return !v || (tr.cells[k] && (k === 0 ? tr.cells[k].textContent.toLowerCase().indexOf(v) === 0 : tr.cells[k].textContent.toLowerCase().indexOf(v) >= 0)); }));
        tr.hidden = !ok; if (ok && !tr.dataset.vide) n++;
      });
      pan.querySelector('.cb-vide').hidden = n > 0 || !actif;
    }
    pan.addEventListener('input', filtrer);
    tb.addEventListener('click', function (e) { var tr = e.target.closest('tr'); if (tr) choisir(c, tr.dataset.v); });
    document.body.appendChild(pan); c.box.setAttribute('aria-expanded', 'true');
    ouvert = { pan: pan, box: c.box, sel: s };
    document.addEventListener('mousedown', hors, true); document.addEventListener('keydown', clavier, true); window.addEventListener('resize', fermer);
    var cur = tb.querySelector('.cb-sel'); filtrer(); if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'nearest' });
    pan.querySelector('[data-cb="0"]').focus();
  }
  var liste = [];
  function equiper(s) {
    if (s.__cb) return; s.__cb = true;
    var box = document.createElement('div'); box.className = 'cb-box'; box.setAttribute('role', 'combobox'); box.setAttribute('aria-haspopup', 'listbox'); box.setAttribute('aria-expanded', 'false'); box.tabIndex = 0;
    box.innerHTML = '<span class="cb-t"></span><i class="ti ti-chevron-down"></i>';
    var lab = s.getAttribute('aria-label') || (s.closest('label') && s.closest('label').textContent.trim().slice(0, 40)); if (lab) box.setAttribute('aria-label', lab);
    s.style.display = 'none'; s.parentNode.insertBefore(box, s.nextSibling);
    var c = { sel: s, box: box }; liste.push(c);
    box.addEventListener('mouseenter', function () { maj(c); });
    box.addEventListener('click', function () { ouvrir(c); });
    box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); ouvrir(c); } });
    s.addEventListener('change', function () { maj(c); });
    maj(c);
  }
  // Toute liste déroulante dont les options sont de la forme « code — libellé » devient un panneau Code | Libellé filtrable
  // (au moins 2 options de ce type, et elles forment l'essentiel de la liste). data-no-combo l'en exclut.
  var FORME = /^\S+\s+[—–-]\s+\S/;
  function codeLibelle(s) {
    if (s.multiple || s.hasAttribute('data-no-combo') || s.closest('.cb-pan')) return false;
    var o = s.options, n = 0, v = 0;
    for (var i = 0; i < o.length; i++) { var t = o[i].textContent.trim(); if (o[i].value === '' || /^[—–-]/.test(t)) continue; v++; if (FORME.test(t)) n++; }
    return n >= 2 && n >= v * 0.6;
  }
  function examiner(s) { if (s.__cb) return; if (s.__cbn === s.options.length) return; s.__cbn = s.options.length; if (s.matches(CIBLES) || codeLibelle(s)) equiper(s); }
  function balayer(racine) {
    var r = racine || document;
    [].slice.call(r.querySelectorAll('select')).forEach(examiner);
    if (r.matches && r.tagName === 'SELECT') examiner(r);
  }
  function demarrer() {
    balayer();
    new MutationObserver(function (ms) { ms.forEach(function (m) { [].slice.call(m.addedNodes).forEach(function (n) { if (n.nodeType === 1) balayer(n); }); }); }).observe(document.body, { childList: true, subtree: true });
    setInterval(function () { balayer(); liste = liste.filter(function (c) { return c.sel.isConnected; }); liste.forEach(function (c) { if (!ouvert || ouvert.sel !== c.sel) maj(c); }); }, 500);
  }
  if (document.readyState === 'complete') demarrer(); else window.addEventListener('load', demarrer);
})();
