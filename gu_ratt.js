<script>
// Rattachements des utilisateurs aux sites et aux axes de regroupement (même principe que l'onglet Journaux ; données simulées en mémoire)
(function () {
  var root = document.currentScript.parentElement.querySelector('[data-ga]');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function say(t) { var d = document.createElement('div'); d.className = 'ga-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2200); }
  window.RATTACHEMENTS = window.RATTACHEMENTS || {};
  var LIB_SITE = { '01': 'Siège' };
  function sites() {
    var n = {}; (window.JOURNAUX_PLAN || []).forEach(function (j) { if (j.site) n[j.site] = (n[j.site] || 0) + 1; });
    return Object.keys(n).sort().map(function (c) { return { code: c, cols: [LIB_SITE[c] || 'Site ' + c, n[c] + ' journal(aux)'] }; });
  }
  function axes() {
    var actifs = window.PLANS_ACTIFS ? window.PLANS_ACTIFS() : ['PC', 'PLAN1', 'PLAN2', 'PLAN3', 'PLAN4'], regr = window.PLANS_REGROUPEMENT ? window.PLANS_REGROUPEMENT() : { PC: 1 };
    return (window.PLANS_CFG || []).filter(function (p) { return actifs.indexOf(p.code) >= 0; }).map(function (p) {
      var niv = regr[p.code] ? (p.niveaux && p.niveaux[regr[p.code] - 1] ? p.niveaux[regr[p.code] - 1].libelle || p.niveaux[regr[p.code] - 1].nom : 'Niveau ' + regr[p.code]) : '';
      return { code: p.code, cols: [p.libelle, p.abrev || '—', regr[p.code] ? 'Plan de regroupement' + (niv ? ' · ' + niv : '') : '—'] };
    });
  }
  function monter(c) {
    var pane = root.querySelector('[data-ga-pane="' + c.tab + '"]'); if (!pane) return;
    pane.innerHTML = '<div class="ga-body"><aside class="ga-side"><div class="ga-sh"><b>Utilisateurs</b><span>Sélectionnez un utilisateur pour affecter ses ' + c.pluriel + '.</span></div>' +
      '<div style="padding:8px 8px 0"><div class="ga-q"><i class="ti ti-search"></i><input type="text" placeholder="Rechercher…" data-r-qu></div></div><div class="ga-gl" data-r-users></div></aside>' +
      '<div class="ga-main"><div class="ga-mh"><div><h2 data-r-title></h2><p data-r-sub></p></div><div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">' +
      '<button type="button" class="ga-btn" data-r-reset><i class="ti ti-refresh"></i> Réinitialiser</button><button type="button" class="ga-btn ok" data-r-save><i class="ti ti-device-floppy"></i> Enregistrer</button></div></div>' +
      '<div class="ga-tb"><div class="ga-q"><i class="ti ti-search"></i><input type="text" placeholder="' + c.ph + '" data-r-qi></div><div class="ga-rd"><label><input type="radio" name="r' + c.tab + '" data-r-all="1"> Tous les ' + c.pluriel + '</label><label><input type="radio" name="r' + c.tab + '" data-r-all="0"> Aucun</label></div></div>' +
      '<div class="ga-sc"><table class="ga-t ga-tj"><thead><tr><th>Rattaché</th><th style="text-align:left">Code</th>' + c.heads.map(function (h, i) { return '<th' + (i === 0 ? ' class="lib"' : '') + ' style="text-align:left">' + h + '</th>'; }).join('') + '</tr></thead><tbody data-r-rows></tbody></table></div></div></div>';
    var q = function (s) { return pane.querySelector(s); };
    var USERS = [], SEL = {}, cur = 0, fu = '', fi = '';
    function users() { USERS = (window.GA_USERS || []).map(function (u) { return [u.id, u.nom, /^(superadmin|admin)$/i.test(u.id) ? 1 : 0]; }); if (cur >= USERS.length) cur = 0; }
    function sel(u) { if (!SEL[u]) { SEL[u] = {}; if (USERS.filter(function (x) { return x[0] === u; })[0][2]) c.items().forEach(function (i) { SEL[u][i.code] = 1; }); } return SEL[u]; }
    function drawUsers() {
      q('[data-r-users]').innerHTML = USERS.map(function (u, i) { return [u, i]; }).filter(function (p) { return !fu || (p[0][0] + ' ' + p[0][1]).toLowerCase().indexOf(fu) >= 0; }).map(function (p) {
        var n = SEL[p[0][0]] ? Object.keys(SEL[p[0][0]]).length : (p[0][2] ? c.items().length : 0);
        return '<button type="button" class="ga-g' + (p[1] === cur ? ' on' : '') + '" data-r-u="' + p[1] + '"><span style="flex:1;min-width:0"><span class="n">' + esc(p[0][0]) + '</span><span class="d">' + esc(p[0][1]) + '</span></span><span class="b">' + n + '</span></button>';
      }).join('') || '<div class="ga-empty">Aucun utilisateur.</div>';
    }
    function draw() {
      users(); if (!USERS.length) { drawUsers(); return; }
      var u = USERS[cur], s = sel(u[0]), L = c.items(), n = Object.keys(s).filter(function (k) { return L.some(function (i) { return i.code === k; }); }).length;
      q('[data-r-title]').textContent = c.titre + ' — ' + u[0];
      q('[data-r-sub]').textContent = n + ' ' + c.singulier + '(s) rattaché(s) sur ' + L.length + ' · ' + c.aide;
      var rows = L.filter(function (i) { return !fi || (i.code + ' ' + i.cols.join(' ')).toLowerCase().indexOf(fi) >= 0; });
      q('[data-r-rows]').innerHTML = rows.length ? rows.map(function (i) {
        return '<tr><td style="padding-left:6px"><input type="checkbox" data-r-c="' + esc(i.code) + '"' + (s[i.code] ? ' checked' : '') + '></td><td style="text-align:left;font-weight:600;padding-left:6px">' + esc(i.code) + '</td>' +
          i.cols.map(function (v, k) { return '<td' + (k === 0 ? ' class="lib"' : '') + ' style="text-align:left;padding-left:6px">' + esc(v) + '</td>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + (2 + c.heads.length) + '" class="ga-empty">' + c.vide + '</td></tr>';
      [].forEach.call(pane.querySelectorAll('[data-r-all]'), function (r) { r.checked = r.dataset.rAll === '1' ? (L.length > 0 && n === L.length) : n === 0; });
      drawUsers();
    }
    pane.addEventListener('click', function (e) {
      var t = e.target, b;
      if ((b = t.closest('[data-r-u]'))) { cur = +b.dataset.rU; draw(); }
      else if (t.closest('[data-r-reset]')) { delete SEL[USERS[cur][0]]; draw(); say('Rattachements de « ' + USERS[cur][0] + ' » réinitialisés.'); }
      else if (t.closest('[data-r-save]')) { window.RATTACHEMENTS[c.tab] = SEL; say('Rattachements ' + c.de + ' de « ' + USERS[cur][0] + ' » enregistrés.'); }
    });
    pane.addEventListener('change', function (e) {
      var t = e.target, s = sel(USERS[cur][0]);
      if (t.dataset.rC) { if (t.checked) s[t.dataset.rC] = 1; else delete s[t.dataset.rC]; draw(); }
      else if (t.dataset.rAll != null) { SEL[USERS[cur][0]] = {}; if (t.dataset.rAll === '1') c.items().forEach(function (i) { SEL[USERS[cur][0]][i.code] = 1; }); draw(); }
    });
    q('[data-r-qu]').addEventListener('input', function () { fu = this.value.trim().toLowerCase(); users(); drawUsers(); });
    q('[data-r-qi]').addEventListener('input', function () { fi = this.value.trim().toLowerCase(); draw(); });
    root.addEventListener('click', function (e) { if (e.target.closest('[data-ga-tab="' + c.tab + '"]')) setTimeout(draw, 0); });
    ['ga-users-changed', 'journaux-changed', 'plans-changed', 'plans-actifs'].forEach(function (ev) { window.addEventListener(ev, draw); });
  }
  monter({ tab: 'sites', titre: 'Sites', pluriel: 'sites', singulier: 'site', de: 'aux sites', heads: ['Libellé', 'Journaux'], ph: 'Rechercher un site…', aide: 'cochez les sites auxquels cet utilisateur a accès.', vide: 'Aucun site. Ils proviennent des journaux de « Saisie des journaux ».', items: sites });
  monter({ tab: 'axes', titre: 'Axes de regroupement', pluriel: 'axes de regroupement', singulier: 'axe', de: 'aux axes de regroupement', heads: ['Libellé', 'Abréviation', 'Regroupement'], ph: 'Rechercher un axe…', aide: 'cochez les axes (plans) que cet utilisateur peut utiliser en regroupement.', vide: 'Aucun plan actif. Activez-les dans « Comptabilité analytique ».', items: axes });
})();
</script>
