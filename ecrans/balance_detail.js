// États comptables › Général : double-clic sur une ligne d'une balance (générale, auxiliaire) ou de l'échéancier / balance âgée
// → fenêtre « détail des mouvements » constituant le solde de la ligne (mêmes colonnes que le grand livre : dates, référence, contrat,
// journal, pièce, site, compte, contrepartie, libellé, débit, crédit, plan de regroupement et plans analytiques).
// Les mouvements sont des données de démonstration générées de façon stable pour la ligne ; leur total est toujours égal au solde affiché.
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function cents(t) { t = String(t || '').replace(/[\s  ]/g, '').replace(',', '.'); var n = parseFloat(t); return isNaN(n) ? 0 : Math.round(n * 100); }
  function fmt(c) { if (!c) return ''; var neg = c < 0; c = Math.abs(c); var e = String(Math.floor(c / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (neg ? '-' : '') + e + ',' + String(c % 100).padStart(2, '0'); }
  function fr(d) { return ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2) + '/' + d.getUTCFullYear(); }
  function hash(s) { var h = 2166136261; s = String(s); for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function rnd(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

  var css = document.createElement('style');
  css.textContent = '.bd-ov{position:fixed;inset:0;z-index:3700;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.bd-md{display:flex;flex-direction:column;width:min(1500px,100%);max-height:calc(100vh - 32px);border-radius:14px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.bd-hd{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:18px 24px 12px;border-bottom:1px solid #E9EBF0}.bd-hd h2{margin:0;font:700 19px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}.bd-hd p{margin:4px 0 0;font-size:13px;color:#6B7080}' +
    '.bd-act{display:flex;gap:8px;flex-shrink:0}.bd-act button{min-height:34px;padding:0 14px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font:600 13px var(--font-sans,sans-serif);cursor:pointer;display:inline-flex;align-items:center;gap:6px}.bd-act button:hover{background:#F4F7FE}.bd-act button.p{background:#2E427B;color:#fff}' +
    '.bd-b{overflow:auto;padding:0 0 4px}.bd-t{width:100%;border-collapse:collapse;font-size:13px;min-width:1700px}.bd-t th{position:sticky;top:0;z-index:1;background:#0c4a6e;color:#fff;text-align:left;padding:11px 12px;font:700 11px var(--font-sans,sans-serif);letter-spacing:.04em;text-transform:uppercase;white-space:nowrap}' +
    '.bd-t th.n,.bd-t td.n{text-align:right;font-variant-numeric:tabular-nums}.bd-t td{padding:9px 12px;border-bottom:1px solid #EEF2F7;white-space:nowrap}.bd-t tbody tr:hover{background:#EFF6FF}.bd-t tfoot td{position:sticky;bottom:0;background:#EFF6FF;font-weight:700;color:#1E40AF}.bd-t td.l{white-space:normal;min-width:260px}' +
    '@media print{.bd-act{display:none}.bd-ov{position:static;background:none;padding:0}.bd-md{box-shadow:none;max-height:none}}';
  document.head.appendChild(css);

  var ov = null, courant = null;
  function fermer() { if (ov) { ov.remove(); ov = null; } document.removeEventListener('keydown', echap, true); }
  function echap(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }

  // répartit un total (en centimes) en n parts entières de poids aléatoires ; le solde est repris par la dernière
  function repartir(total, n, r) {
    if (!total) return [];
    var w = [], s = 0, out = [], i; for (i = 0; i < n; i++) { w.push(0.4 + r()); s += w[i]; }
    var reste = total; for (i = 0; i < n - 1; i++) { var p = Math.round(total * w[i] / s); out.push(p); reste -= p; } out.push(reste);
    return out;
  }
  function refs() {
    var E = window.ECRITURES_REF || {}, AX = window.ECRITURES_AXES || {}, J = (E.journaux || []).map(function (j) { return j.code; });
    var S = (E.sites || []).map(function (x) { return x.code; });
    var C = (window.PLAN_COMPTABLE || []).filter(function (r) { return r.actif !== false && !/^[0-9]{1,2}$/.test(r.code); }).map(function (r) { return r.code; });
    return { J: J.length ? J : ['ACHMGA', 'BSGA2', 'OD'], S: S.length ? S : ['01'], C: C.length ? C : ['512300', '244416', '445660'], AX: AX };
  }
  function pick(a, r) { return a.length ? a[Math.floor(r() * a.length)] : ''; }
  function axe(AX, n, r) { var l = AX[n] || []; return l.length ? l[Math.floor(r() * l.length)].code : ''; }

  // mouvements d'un compte / d'un tiers : à nouveau, puis mouvements débit et crédit entrelacés sur l'exercice
  function mouvements(o) {
    var R = refs(), r = rnd(hash(o.cle)), L = [], an = o.anD || o.anC;
    var annee = o.annee || 2026, g = window.REGROUPEMENT && window.REGROUPEMENT(), plan = g && g.elements && g.elements.length ? g.elements[Math.floor(r() * g.elements.length)].code : 'IDA012';
    function base(i, d, jl, sens, m, lib, extra) {
      var dp = new Date(d.getTime() - Math.floor(r() * 12) * 86400000);
      return Object.assign({ d: d, dp: dp, ref: '', lb: axe(R.AX, 'POSTE BUDGETAIRE', r), ct: o.contrat || '', jl: jl, piece: jl + ' ' + (100 + Math.floor(r() * 700)) + '/' + String(annee).slice(2), site: pick(R.S, r), compte: o.compteLib, cp: pick(R.C, r), lib: lib, D: sens === 'D' ? m : 0, C: sens === 'C' ? m : 0, pr: plan, p: [axe(R.AX, 'ACTIVITE', r), axe(R.AX, 'FINANCEMENT', r), axe(R.AX, 'GEOGRAPHIQUE', r), axe(R.AX, 'NATURE', r), axe(R.AX, 'CATEGORIE DE DEPENSE', r)] }, extra || {});
    }
    if (an) L.push(Object.assign(base(0, new Date(Date.UTC(annee, 0, 1)), 'AN', o.anD ? 'D' : 'C', o.anD || o.anC, 'Report à nouveau ' + annee), { D: o.anD, C: o.anC, cp: '' }));
    var nD = o.mvD ? 2 + Math.floor(r() * 4) : 0, nC = o.mvC ? 2 + Math.floor(r() * 4) : 0, pD = repartir(o.mvD, nD, r), pC = repartir(o.mvC, nC, r), tous = [];
    pD.forEach(function (m) { tous.push({ s: 'D', m: m }); }); pC.forEach(function (m) { tous.push({ s: 'C', m: m }); });
    tous.forEach(function (x) { x.t = r(); }); tous.sort(function (a, b) { return a.t - b.t; });
    tous.forEach(function (x, i) {
      var mois = Math.min(11, Math.floor(i * 11 / Math.max(1, tous.length - 1))), d = new Date(Date.UTC(annee, mois, 1 + Math.floor(r() * 27)));
      var jl = pick(R.J, r), lib = (x.s === 'D' ? o.libD : o.libC) + ' ' + ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][mois] + ' ' + annee;
      L.push(base(i + 1, d, jl, x.s, x.m, lib));
    });
    L.sort(function (a, b) { return a.d - b.d; });
    return L;
  }

  var COLS = ['Date comptable', 'Date pièce', 'Référence', 'N° contrat', 'JL', 'N° pièce', 'Site', 'Compte', 'Contre partie', 'Libellé', 'Débit', 'Crédit', 'Plan regroupement', 'Plan 1', 'Plan 2', 'Plan 3', 'Plan 4', 'Plan 5'];
  function ouvrir(o) {
    fermer(); courant = o;
    var L = o.lignes, D = 0, C = 0; L.forEach(function (x) { D += x.D; C += x.C; });
    ov = document.createElement('div'); ov.className = 'bd-ov';
    ov.innerHTML = '<div class="bd-md" role="dialog" aria-modal="true" aria-label="Détail des mouvements"><div class="bd-hd"><div><h2>' + esc(o.titre) + '</h2><p>' + esc(o.sous) + '</p></div>' +
      '<div class="bd-act"><button type="button" data-bd-pdf><i class="ti ti-printer"></i>Imprimer</button><button type="button" data-bd-csv><i class="ti ti-file-spreadsheet"></i>Exporter (CSV)</button><button type="button" class="p" data-bd-x><i class="ti ti-arrow-left"></i>Retour</button></div></div>' +
      '<div class="bd-b"><table class="bd-t"><thead><tr>' + COLS.map(function (c) { return '<th' + (/^(Débit|Crédit)$/.test(c) ? ' class="n"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (L.length ? L.map(function (x) {
        return '<tr><td>' + fr(x.d) + '</td><td>' + fr(x.dp) + '</td><td>' + esc(x.ref) + '</td><td>' + esc(x.ct) + '</td><td>' + esc(x.jl) + '</td><td>' + esc(x.piece) + '</td><td>' + esc(x.site) + '</td><td>' + esc(x.compte) + '</td><td>' + esc(x.cp) + '</td><td class="l">' + esc(x.lib) + '</td><td class="n">' + fmt(x.D) + '</td><td class="n">' + fmt(x.C) + '</td><td>' + esc(x.pr) + '</td>' + x.p.map(function (p) { return '<td>' + esc(p) + '</td>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + COLS.length + '" style="text-align:center;padding:24px;color:#6B7080">Aucun mouvement.</td></tr>') +
      '</tbody><tfoot><tr><td colspan="10">Total (' + L.length + ' mouvement' + (L.length > 1 ? 's' : '') + ') — solde ' + fmt(Math.abs(D - C)) + (D === C ? '' : D > C ? ' débiteur' : ' créditeur') + '</td><td class="n">' + fmt(D) + '</td><td class="n">' + fmt(C) + '</td><td colspan="6"></td></tr></tfoot></table></div></div>';
    document.body.appendChild(ov); document.addEventListener('keydown', echap, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
    ov.querySelector('[data-bd-x]').addEventListener('click', fermer);
    ov.querySelector('[data-bd-pdf]').addEventListener('click', function () { window.print(); });
    ov.querySelector('[data-bd-csv]').addEventListener('click', function () {
      var rows = [COLS].concat(L.map(function (x) { var n = function (c) { return c ? (c / 100).toFixed(2).replace('.', ',') : ''; }; return [fr(x.d), fr(x.dp), x.ref, x.ct, x.jl, x.piece, x.site, x.compte, x.cp, x.lib, n(x.D), n(x.C), x.pr].concat(x.p); }));
      var csv = rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })); a.download = 'detail_mouvements.csv'; a.click();
    });
  }
  // mouvements d'un tiers de la balance auxiliaire (t : { code, libelle, mvD, mvC } en centimes) : mêmes lignes dans le détail et dans le grand livre auxiliaire
  function auxLignes(cc, t, compteAff) {
    var ES = window.ECRITURES_SAISIES, S = ES ? ES({ tiers: t.code }).filter(function (x) { return !cc || x.compte === cc; }) : [], sD = 0, sC = 0;
    S.forEach(function (x) { sD += ES.c100(x.debit); sC += ES.c100(x.credit); });
    var L = mouvements({ cle: 'bx|' + cc + '|' + t.code, anD: t.anD || 0, anC: t.anC || 0, mvD: Math.max(0, t.mvD - sD), mvC: Math.max(0, t.mvC - sC), compteLib: t.code, libD: 'Facture ' + t.libelle + ' —', libC: 'Règlement ' + t.libelle + ' —' });
    if (compteAff) L.forEach(function (x) { x.compte = compteAff; });
    L = L.concat(S.map(ES ? ES.detail : function (x) { return x; })).sort(function (a, b) { return a.d - b.d; });   // + écritures saisies
    return L;
  }
  window.BALANCE_DETAIL = { ouvrir: ouvrir, mouvements: mouvements, auxLignes: auxLignes };

  // --- branchement des écrans : double-clic sur une ligne ---
  document.addEventListener('dblclick', function (e) {
    var tr = e.target.closest && e.target.closest('tr'); if (!tr || !tr.closest('tbody')) return;
    var td = tr.children, an;
    if (tr.closest('app-bg-resultat')) {   // balance générale : compte
      var code = tr.dataset.compte || ''; if (!code || td.length < 6) return;   // lignes de total : pas de détail
      var lib = td[1].textContent.trim();
      var o = { cle: 'bg|' + code, anD: cents(td[2].textContent), anC: cents(td[3].textContent), mvD: cents(td[4].textContent), mvC: cents(td[5].textContent), compteLib: code, libD: 'Écriture ' + lib + ' —', libC: 'Règlement ' + lib + ' —' };
      var ES = window.ECRITURES_SAISIES, S = ES ? ES({ compte: code }) : [];   // écritures saisies : lignes réelles, le reste du solde en démonstration
      S.forEach(function (x) { o.mvD = Math.max(0, o.mvD - ES.c100(x.debit)); o.mvC = Math.max(0, o.mvC - ES.c100(x.credit)); });
      ouvrir({ titre: 'Compte : ' + code + ' — ' + lib, sous: 'Mouvements du compte ' + code + ' — mêmes colonnes que le Grand livre général', lignes: mouvements(o).concat(S.map(ES ? ES.detail : function (x) { return x; })).sort(function (a, b) { return a.d - b.d; }) });
    } else if (tr.closest('app-balance-auxiliaire .bx-res')) {   // balance auxiliaire : tiers
      var c = tr.dataset.code; if (!c) return;
      var coll = (document.querySelector('app-balance-auxiliaire #bx-collectif') || {}).value || '', cc = coll.split(' — ')[0];
      ouvrir({ titre: 'Compte : ' + cc + ', Auxiliaire : ' + td[1].textContent.trim(), sous: 'Code auxiliaire ' + c + ' — mêmes colonnes que le Grand livre auxiliaire',
        lignes: auxLignes(cc, { code: c, libelle: td[1].textContent.trim(), anD: cents(td[2].textContent), anC: cents(td[3].textContent), mvD: cents(td[4].textContent), mvC: cents(td[5].textContent) }) });
    } else if (tr.closest('app-echeancier .bx-res')) {   // échéancier / balance âgée : échéances ouvertes du tiers
      var k = tr.dataset.k, ctx = window.__echCtx, it = ctx && ctx.courant[+k]; if (!it) return;
      var L = it.items.map(function (x, i) {
        var h = rnd(hash('ech|' + it.code + '|' + i)), R = refs(), d = new Date(x.e - (20 + Math.floor(h() * 40)) * 86400000), ech = new Date(x.e);
        var credit = (ctx.type === 'Fournisseur') === (x.m > 0), m = Math.round(Math.abs(x.m) * 100);
        return { d: d, dp: d, ref: '', lb: axe(R.AX, 'POSTE BUDGETAIRE', h), ct: '', jl: pick(R.J, h), piece: 'FA ' + (100 + Math.floor(h() * 800)) + '/26', site: pick(R.S, h), compte: it.code, cp: pick(R.C, h),
          lib: (x.m < 0 ? 'Avoir ' : 'Facture ') + it.libelle + ' — échéance ' + fr(ech), D: credit ? 0 : m, C: credit ? m : 0, pr: 'IDA012', p: [axe(R.AX, 'ACTIVITE', h), axe(R.AX, 'FINANCEMENT', h), axe(R.AX, 'GEOGRAPHIQUE', h), axe(R.AX, 'NATURE', h), axe(R.AX, 'CATEGORIE DE DEPENSE', h)] };
      }).sort(function (a, b) { return a.d - b.d; });
      ouvrir({ titre: 'Compte : ' + ctx.du + ' à ' + ctx.au + ', Auxiliaire : ' + it.libelle, sous: 'Code auxiliaire ' + it.code + ' — échéances ouvertes constituant le solde au ' + ctx.date + ' (' + ctx.devise + ')', lignes: L });
    }
  });
  var st = document.createElement('style');
  st.textContent = 'app-bg-resultat tbody tr,app-balance-auxiliaire .bx-res tbody tr,app-echeancier .bx-res tbody tr{user-select:none;cursor:pointer}';
  document.head.appendChild(st);
})();
