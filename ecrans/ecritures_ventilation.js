// Saisie d'écritures › version Entreprise : bouton « Ventiler » (ventilation analytique de la ligne en cours).
// Une fenêtre à onglets (un onglet par axe analytique actif) répartit le montant de la ligne en sections et pourcentages ; chaque axe ventilé doit totaliser 100 %.
// La ventilation est conservée avec la ligne (champ ventil) et se relit en consultation ou en modification de la ligne. Le bouton n'apparaît que dans la variante Entreprise.
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  var g = R.querySelector('.entry-general-fields'); if (!g) return;
  function A() { return (window.__ecEntete && window.__ecEntete.ventilation) || null; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 }); }
  function num(s) { var n = parseFloat(String(s || '').replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }

  var css = document.createElement('style');
  css.textContent = '.vt-ov{position:fixed;inset:0;z-index:3600;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.vt-md{display:flex;flex-direction:column;width:min(860px,100%);max-height:calc(100vh - 32px);border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.vt-hd{padding:18px 24px 14px;border-bottom:1px solid #E9EBF0}.vt-hd h2{margin:0;font:700 20px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}.vt-hd p{margin:4px 0 0;font-size:13.5px;color:#6B7080}' +
    '.vt-tabs{display:flex;gap:6px;padding:0 24px;margin-top:14px;border-bottom:1px solid #E9EBF0;overflow-x:auto}.vt-tab{padding:12px 16px;border:0;border-bottom:3px solid transparent;margin-bottom:-1px;background:none;color:#6B7080;font:600 14px var(--font-sans,sans-serif);cursor:pointer;white-space:nowrap}.vt-tab.on{color:#0B1332;border-bottom-color:#C9A227}.vt-tab:hover{color:#0B1332}.vt-tab i{margin-left:6px;font-size:12px;color:#1E7B4B}' +
    '.vt-b{padding:16px 24px;overflow:auto}.vt-t{width:100%;border-collapse:collapse;font-size:14px}.vt-t th{background:#F8F9FB;text-align:left;padding:11px 14px;font:700 12px var(--font-sans,sans-serif);letter-spacing:.06em;text-transform:uppercase;color:#6B7080}.vt-t th.r,.vt-t td.r{text-align:right}' +
    '.vt-t td{padding:8px 14px;border-bottom:1px solid #EEF0F4;vertical-align:middle}.vt-t select,.vt-t input{height:38px;box-sizing:border-box;border:1px solid #D6D9E0;border-radius:8px;background:#fff;padding:0 10px;font:inherit;font-size:14px;color:#353944}.vt-t select{width:130px;font-family:ui-monospace,Consolas,monospace}.vt-t input{width:84px;text-align:right}.vt-t select:focus,.vt-t input:focus{outline:none;border-color:#2E427B;box-shadow:0 0 0 3px rgba(46,66,123,.12)}.vt-t select:disabled,.vt-t input:disabled{background:#F4F5F7}' +
    '.vt-t td.m{font-weight:700;text-align:right;white-space:nowrap}.vt-t tr.tot td{background:#F6F3DF;font-weight:700;border-bottom:0}.vt-t tr.tot.ko td{background:#FBE9E9;color:#B63132}.vt-x{width:32px;height:32px;border:1px solid #E6B8B8;border-radius:6px;background:#fff;color:#B63132;cursor:pointer}' +
    '.vt-vide{padding:22px 14px;text-align:center;color:#6B7080;font-size:13.5px}.vt-add{margin-top:10px;min-height:34px;padding:0 14px;border:1px dashed #2E427B;border-radius:8px;background:#fff;color:#2E427B;font:600 13px var(--font-sans,sans-serif);cursor:pointer}.vt-add:hover{background:#F4F7FE}' +
    '.vt-er{min-height:18px;margin-top:8px;color:#B63132;font-size:13px}.vt-ft{display:flex;justify-content:flex-end;gap:10px;padding:12px 24px;border-top:1px solid #E9EBF0}' +
    '.vt-ft button{min-height:38px;padding:0 18px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font:600 13px var(--font-sans,sans-serif);cursor:pointer}.vt-ft button.p{background:#2E427B;color:#fff}.vt-ft button:hover{filter:brightness(.97)}';
  document.head.appendChild(css);

  // bouton « Ventiler » (visible seulement dans la variante Entreprise : voir ecritures_disposition.css)
  var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'ec-ventiler'; btn.title = 'Ventilation analytique de la ligne : un onglet par axe analytique';
  g.appendChild(btn);
  function etiquette() {
    var a = A(); if (!a) return; var v = a.get(), n = Object.keys(v).filter(function (k) { return (v[k] || []).some(function (r) { return r.code; }); }).length;
    btn.innerHTML = '<i class="ti ti-chart-pie" aria-hidden="true"></i> Ventiler' + (n ? ' (' + n + ' axe' + (n > 1 ? 's' : '') + ')' : ''); btn.classList.toggle('on', n > 0);
  }
  etiquette();
  ['click', 'keyup', 'change'].forEach(function (ev) { R.addEventListener(ev, function () { setTimeout(etiquette, 0); }, true); });

  var NOMS = { 'ACTIVITE': 'Activités', 'POSTE BUDGETAIRE': 'Postes budgétaires', 'FINANCEMENT': 'Financements', 'GEOGRAPHIQUE': 'Zones géographiques', 'NATURE': 'Natures', 'CATEGORIE DE DEPENSE': 'Catégories de dépense' };
  var ov = null;
  function fermer() { if (ov) { ov.remove(); ov = null; } document.removeEventListener('keydown', echap, true); setTimeout(etiquette, 0); }
  function echap(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }

  function ouvrir() {
    var a = A(); if (!a) return;
    var axes = a.axes(), lecture = a.lecture(), mt = a.montant(), info = a.info();
    if (!axes.length) { alert('Aucun plan analytique actif : paramétrez les plans analytiques de l’entité.'); return; }
    if (!lecture && !(mt > 0)) { alert('Saisissez d’abord le montant de la ligne pour la ventiler.'); return; }
    var etat = a.get(), cur = axes[0].nom;
    axes.forEach(function (x) { etat[x.nom] = (etat[x.nom] || []).map(function (r) { return { code: r.code, pct: r.pct }; }); });
    ov = document.createElement('div'); ov.className = 'vt-ov';
    ov.innerHTML = '<div class="vt-md" role="dialog" aria-modal="true" aria-label="Ventilation analytique"><div class="vt-hd"><h2>Ventilation analytique</h2><p>Ligne ' + info.no + (info.compte ? ' · ' + esc(info.compte) : '') + ' · ' + esc(fmt(mt)) + ' ' + esc(info.devise) + (info.libelle ? ' · ' + esc(info.libelle) : '') + '</p></div>' +
      '<div class="vt-tabs" role="tablist" data-vt-tabs></div><div class="vt-b"><div data-vt-p></div><div class="vt-er" data-vt-er></div></div>' +
      '<div class="vt-ft">' + (lecture ? '<button type="button" class="p" data-vt-x>Fermer</button>' : '<button type="button" data-vt-x>Annuler</button><button type="button" data-vt-raz>Effacer cet axe</button><button type="button" class="p" data-vt-ok>Valider la ventilation</button>') + '</div></div>';
    document.body.appendChild(ov); document.addEventListener('keydown', echap, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
    var Q = function (s) { return ov.querySelector(s); };
    function total(nom) { return (etat[nom] || []).reduce(function (s, r) { return s + (+r.pct || 0); }, 0); }
    function ok(nom) { var L = etat[nom] || []; return L.length && L.every(function (r) { return r.code; }) && Math.abs(total(nom) - 100) < 0.005; }
    function onglets() {
      Q('[data-vt-tabs]').innerHTML = axes.map(function (x) { return '<button type="button" class="vt-tab' + (x.nom === cur ? ' on' : '') + '" role="tab" data-n="' + esc(x.nom) + '">' + esc(x.lib + ' – ' + (NOMS[x.nom] || x.nom.charAt(0) + x.nom.slice(1).toLowerCase())) + (ok(x.nom) ? '<i class="ti ti-circle-check" aria-hidden="true"></i>' : '') + '</button>'; }).join('');
    }
    function panneau() {
      var ax = axes.filter(function (x) { return x.nom === cur; })[0], L = etat[cur] || [], t = total(cur);
      Q('[data-vt-p]').innerHTML = '<table class="vt-t"><thead><tr><th>Section</th><th>Intitulé</th><th class="r">%</th><th class="r">Montant</th><th style="width:44px"></th></tr></thead><tbody>' +
        (L.length ? L.map(function (r, i) {
          var it = ax.items.filter(function (x) { return x.code === r.code; })[0];
          return '<tr data-i="' + i + '"><td><select data-f="code"' + (lecture ? ' disabled' : '') + '><option value="">—</option>' + ax.items.map(function (x) { return '<option value="' + esc(x.code) + '"' + (x.code === r.code ? ' selected' : '') + '>' + esc(x.code) + '</option>'; }).join('') + '</select></td><td>' + esc(it ? it.label : '') + '</td>' +
            '<td class="r"><input data-f="pct" inputmode="decimal" value="' + esc(r.pct === '' || r.pct == null ? '' : String(r.pct).replace('.', ',')) + '"' + (lecture ? ' disabled' : '') + '></td><td class="m">' + fmt(Math.round(mt * (+r.pct || 0)) / 100) + '</td><td>' + (lecture ? '' : '<button type="button" class="vt-x" data-del aria-label="Supprimer la section"><i class="ti ti-x"></i></button>') + '</td></tr>';
        }).join('') + '<tr class="tot' + (Math.abs(t - 100) < 0.005 ? '' : ' ko') + '"><td colspan="2">Total ventilé</td><td class="r">' + fmt(t) + ' %</td><td class="m">' + fmt(Math.round(mt * t) / 100) + '</td><td></td></tr>'
          : '<tr><td colspan="5" class="vt-vide">Aucune section pour cet axe : la ligne n’est pas ventilée sur ' + esc(cur.toLowerCase()) + '.</td></tr>') + '</tbody></table>' +
        (lecture ? '' : '<button type="button" class="vt-add" data-add>+ Ajouter une section</button>');
    }
    function tout() { onglets(); panneau(); }
    Q('[data-vt-tabs]').addEventListener('click', function (e) { var b = e.target.closest('[data-n]'); if (!b) return; cur = b.dataset.n; Q('[data-vt-er]').textContent = ''; tout(); });
    var P = Q('[data-vt-p]');
    P.addEventListener('click', function (e) {
      if (e.target.closest('[data-add]')) { var reste = Math.max(0, Math.round((100 - total(cur)) * 100) / 100); etat[cur].push({ code: '', pct: reste }); tout(); return; }
      var d = e.target.closest('[data-del]'); if (d) { etat[cur].splice(+d.closest('tr').dataset.i, 1); tout(); }
    });
    P.addEventListener('change', function (e) {
      var tr = e.target.closest('tr[data-i]'); if (!tr) return; var r = etat[cur][+tr.dataset.i], f = e.target.dataset.f;
      if (f === 'code') r.code = e.target.value; else if (f === 'pct') r.pct = Math.max(0, Math.min(100, num(e.target.value)));
      Q('[data-vt-er]').textContent = ''; tout();
    });
    Q('[data-vt-x]').addEventListener('click', fermer);
    if (!lecture) {
      Q('[data-vt-raz]').addEventListener('click', function () { etat[cur] = []; tout(); });
      Q('[data-vt-ok]').addEventListener('click', function () {
        for (var k = 0; k < axes.length; k++) {
          var n = axes[k].nom, L = etat[n] || []; if (!L.length) continue;
          var codes = L.map(function (r) { return r.code; }), msg = '';
          if (codes.some(function (c) { return !c; })) msg = 'choisissez la section de chaque ligne';
          else if (codes.some(function (c, i) { return codes.indexOf(c) !== i; })) msg = 'une même section ne peut figurer qu’une fois';
          else if (Math.abs(total(n) - 100) >= 0.005) msg = 'le total ventilé doit être de 100 % (actuellement ' + fmt(total(n)) + ' %)';
          if (msg) { cur = n; tout(); Q('[data-vt-er]').textContent = 'Axe ' + axes[k].lib + ' : ' + msg + '.'; return; }
        }
        var res = {}; axes.forEach(function (x) { if ((etat[x.nom] || []).length) res[x.nom] = etat[x.nom]; });
        a.set(res); fermer();
      });
    }
    tout();
  }
  btn.addEventListener('click', ouvrir);
  window.ECRITURES_VENTILATION = { ouvrir: ouvrir };
})();
