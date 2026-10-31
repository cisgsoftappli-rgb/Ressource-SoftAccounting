// Soft e-Payment — écran « Ordres de paiement » (maquette). Ouvert depuis le sélecteur de produits ; couche plein écran avec sa propre sidebar/en-tête, aux couleurs de la charte Softwell.
// Données fictives en mémoire ; seul « Ordres de paiement » est navigable.
(function () {
  var N = { b: '#2E427B', b9: '#18244F', b95: '#0B1332', b1: '#E3EBFE', b05: '#F4F7FE', g: '#E1C340', n1: '#E9EBF0', n2: '#D6D9E0', n6: '#5B606D' };
  var ST = ['Brouillon', 'Initié', 'Approuvé', 'Rejeté'];
  var KPI = [
    { st: 'Brouillon', lib: 'Brouillons', sub: 'En cours de saisie', c: '#5F77B9' },
    { st: 'Initié', lib: 'Initiés', sub: 'En attente de validation lot', c: '#2E427B' },
    { st: 'Approuvé', lib: 'Approuvés', sub: 'Prêts pour exécution', c: '#E1C340', t: '#706000' },
    { st: 'Rejeté', lib: 'Rejetés', sub: 'Annulés', c: '#B42318' }
  ];
  var MODES = ['Virement bancaire', 'Mobile Money', 'Chèque'];
  var MENU = [
    { id: 'tb', l: 'Tableau de bord', i: 'layout-dashboard' },
    { id: 'ben', l: 'Bénéficiaires', i: 'users', sub: [{ l: 'Liste des bénéficiaires' }, { l: 'Comptes bénéficiaires' }] },
    { id: 'pai', l: 'Paiements', i: 'wallet', open: 1, sub: [{ id: 'ordres', l: 'Ordres de paiement' }, { l: 'Lots de paiement' }, { l: 'Suivi des exécutions' }] },
    { id: 'eta', l: 'États & Rapports', i: 'chart-bar', sub: [{ l: 'Journal des paiements' }, { l: 'Situation des comptes' }] },
    { id: 'par', l: 'Paramétrage', i: 'settings', open: 1, sub: [
      { l: 'Paramètres généraux', g: [{ l: 'Projets' }, { l: 'Sites' }] },
      { l: 'Paramètres de paiement', open: 1, g: [{ id: 'comptes', l: 'Comptes émetteurs' }, { l: 'Seuils de validation' }, { l: 'Serveurs distants' }, { l: 'Compte Mobile Money' }] },
      { l: 'Modèle', g: [{ l: 'Modèle d\'import Excel' }, { l: 'Modèle d\'ordre' }] }
    ] }
  ];
  var DATA = [
    ['Projet démo', 'Antananarivo', 'OP-2026-0001', 'Virement bancaire', 'BÉNÉFICIAIRE 001', 'MG46 0000 1000 0100 0000 0001', 3250000, 'Approuvé'],
    ['Projet démo', 'Antananarivo', 'OP-2026-0002', 'Mobile Money', 'BÉNÉFICIAIRE 002', '034 00 000 02', 185000, 'Initié'],
    ['Projet démo', 'Toamasina', 'OP-2026-0003', 'Virement bancaire', 'BÉNÉFICIAIRE 003', 'MG46 0000 1000 0100 0000 0003', 12480000, 'Initié'],
    ['Projet démo', 'Toamasina', 'OP-2026-0004', 'Chèque', 'BÉNÉFICIAIRE 004', 'CHQ-0004', 940000, 'Brouillon'],
    ['Projet démo', 'Antananarivo', 'OP-2026-0005', 'Mobile Money', 'BÉNÉFICIAIRE 005', '032 00 000 05', 72500, 'Brouillon'],
    ['Projet démo', 'Mahajanga', 'OP-2026-0006', 'Virement bancaire', 'BÉNÉFICIAIRE 006', 'MG46 0000 1000 0100 0000 0006', 5600000, 'Rejeté'],
    ['Projet démo', 'Antananarivo', 'OP-2026-0007', 'Virement bancaire', 'BÉNÉFICIAIRE 007', 'MG46 0000 1000 0100 0000 0007', 1875000, 'Approuvé']
  ].map(function (r) { return { projet: r[0], site: r[1], ref: r[2], mode: r[3], nom: r[4], compte: r[5], montant: r[6], st: r[7] }; });
  var COLS = [['projet', 'Projet'], ['site', 'Site'], ['ref', 'Référence'], ['mode', 'Mode de paiement'], ['nom', 'Nom bénéficiaire'], ['compte', 'Compte bénéficiaire'], ['montant', 'Montant'], ['st', 'Statut']];
  var etat = { q: '', du: '', au: '', st: '', mode: '', site: '', cf: false, adv: false, colf: {}, tri: null, dir: 1, pg: 1, par: 10, collapse: false };
  var racine, nextRef = 8, ecr = 'ordres';

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function mnt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' Ar'; }
  function toast(t) { var d = document.createElement('div'); d.className = 'ep-toast'; d.textContent = t; racine.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }

  var css = '#ep-app{position:fixed;inset:0;z-index:2400;display:flex;background:#F5F7F9;font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}#ep-app[hidden]{display:none}' +
    '#ep-app *{box-sizing:border-box}#ep-app button{font-family:inherit;cursor:pointer}' +
    '.ep-side{width:256px;flex:none;background:' + N.b9 + ';color:#fff;display:flex;flex-direction:column;transition:width .2s}.ep-side.col{width:72px}' +
    '.ep-brand{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(255,255,255,.1);min-height:74px}.ep-lg{display:block;width:42px;height:42px;border-radius:10px;background:#fff no-repeat 0 0;overflow:hidden;flex:none}.ep-lg.ac{background-position:center;background-size:contain}' +
    '.ep-brand b{display:block;font:600 15px var(--font-heading,Outfit,sans-serif)}.ep-brand small{display:block;font-size:11px;color:rgba(255,255,255,.65);white-space:nowrap}.ep-side.col .ep-brand div,.ep-side.col .ep-lb,.ep-side.col .ep-chev,.ep-side.col .ep-sub{display:none}' +
    '.ep-nav{flex:1;overflow:auto;padding:10px 8px}.ep-it{display:flex;align-items:center;gap:10px;width:100%;padding:9px 12px;border:0;border-radius:8px;background:none;color:rgba(255,255,255,.85);font-size:14px;text-align:left}' +
    '.ep-it:hover{background:rgba(255,255,255,.08)}.ep-it.act{background:rgba(255,255,255,.08);color:' + N.g + '}.ep-it i{font-size:18px;flex:none}.ep-lb{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.ep-chev{font-size:14px!important;transition:transform .15s}.ep-it[aria-expanded=true] .ep-chev{transform:rotate(180deg)}' +
    '.ep-sub{padding-left:14px}.ep-sub .ep-it{font-size:13px;color:rgba(255,255,255,.75);padding:8px 12px}.ep-sub .ep-sub .ep-it{padding-left:28px}.ep-dot{width:5px;height:5px;border-radius:50%;background:currentColor;opacity:.7;flex:none;margin:0 6px 0 4px}.ep-it.cur{color:' + N.g + ';background:rgba(255,255,255,.1)}' +
    '.ep-fold{display:flex;align-items:center;gap:10px;padding:12px 18px;border:0;border-top:1px solid rgba(255,255,255,.1);background:none;color:rgba(255,255,255,.75);font-size:13px}.ep-side.col .ep-fold span{display:none}' +
    '.ep-main{flex:1;min-width:0;display:flex;flex-direction:column}.ep-hd{display:flex;align-items:center;gap:12px;height:76px;padding:0 20px;background:#fff;border-bottom:1px solid ' + N.n1 + ';flex:none}' +
    '.ep-ib{display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid ' + N.n1 + ';border-radius:12px;background:#fff;color:' + N.b95 + ';font-size:20px;position:relative}.ep-ib:hover{background:' + N.b05 + '}' +
    '.ep-bdg{position:absolute;top:-6px;right:-6px;min-width:20px;height:20px;padding:0 5px;border-radius:10px;background:#B42318;color:#fff;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center}' +
    '.ep-sw{position:relative}.ep-swb{display:flex;align-items:center;gap:10px;min-width:300px;height:48px;padding:0 10px;border:1px solid ' + N.n1 + ';border-radius:12px;background:#fff;text-align:left}.ep-swb .ep-lg{width:38px;height:38px}.ep-swb b{display:block;font:600 14px var(--font-heading,Outfit,sans-serif);color:' + N.b95 + '}.ep-swb small{display:block;font-size:11px;color:' + N.n6 + '}.ep-swb .ti{margin-left:auto;color:' + N.b + '}' +
    '.ep-pm{position:absolute;top:calc(100% + 8px);left:0;z-index:5;width:318px;padding:10px 12px;display:grid;gap:4px;border:1px solid ' + N.n1 + ';border-radius:12px;background:#fff;box-shadow:0 28px 70px #0b133230}.ep-pm[hidden]{display:none}.ep-pi{display:grid;grid-template-columns:42px 1fr 18px;align-items:center;gap:12px;min-height:56px;padding:4px 8px;border:1px solid transparent;border-radius:12px;background:#fff;text-align:left}.ep-pi:hover{background:' + N.b05 + ';border-color:#DCE4F7}.ep-pi[aria-current=true]{background:#EEF1FA;border-color:#C9D3F0}.ep-pi b{display:block;font-size:14px;color:' + N.b95 + '}.ep-pi small{display:block;font-size:12px;color:' + N.n6 + '}' +
    '.ep-chip{display:flex;flex-direction:column;justify-content:center;height:48px;padding:0 14px;border:1px solid ' + N.n1 + ';border-radius:12px;font-size:11px;color:' + N.n6 + '}.ep-chip b{font-size:13px;color:' + N.b95 + ';font-weight:600}' +
    '.ep-grow{flex:1}.ep-lang{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 14px;border:1px solid ' + N.n1 + ';border-radius:12px;font-size:13px;font-weight:600;color:' + N.b95 + '}.ep-user{display:flex;align-items:center;gap:10px;height:52px;padding:0 16px 0 8px;border:1px solid ' + N.n1 + ';border-radius:14px;font-size:13px;line-height:1.2}.ep-user i{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:50%;background:' + N.b + ';color:#fff;font-style:normal;font-weight:700}.ep-user b{display:block;color:' + N.b95 + '}.ep-user small{color:' + N.n6 + '}' +
    '.ep-bc{display:flex;align-items:center;gap:6px;padding:12px 24px;background:#fff;border-bottom:1px solid ' + N.n1 + ';font-size:13px;color:' + N.b + ';flex:none}.ep-bc span:last-child{color:' + N.b + '}.ep-bc .ti{color:' + N.n6 + ';font-size:14px}' +
    '.ep-body{flex:1;overflow:auto;padding:20px 24px 28px}.ep-top{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-bottom:18px}.ep-top h1{margin:0;font:600 24px var(--font-heading,Outfit,sans-serif);color:' + N.b95 + '}.ep-acts{display:flex;gap:10px;flex-wrap:wrap}' +
    '.ep-btn{display:inline-flex;align-items:center;gap:8px;min-height:40px;padding:0 16px;border:1px solid ' + N.b + ';border-radius:8px;background:#fff;color:' + N.b + ';font-size:14px;font-weight:600}.ep-btn:hover{background:' + N.b05 + '}.ep-btn.pri{background:' + N.b + ';color:#fff}.ep-btn.pri:hover{background:#243569}.ep-btn.sm{min-height:36px;padding:0 14px;font-weight:500;color:' + N.b95 + ';border-color:' + N.n2 + '}.ep-btn[disabled]{opacity:.5;cursor:default}' +
    '.ep-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;margin-bottom:18px}.ep-k{padding:16px 22px 14px;border:1px solid ' + N.n1 + ';border-top:3px solid;border-radius:12px;background:#fff;text-align:left}.ep-k.on{box-shadow:0 0 0 2px ' + N.b + '33}.ep-k b{display:block;font-size:12px;letter-spacing:.04em;text-transform:uppercase;font-weight:700}.ep-k strong{display:block;margin:6px 0 2px;font:500 36px var(--font-heading,Outfit,sans-serif)}.ep-k small{font-size:13px;color:' + N.n6 + '}' +
    '.ep-card{border:1px solid ' + N.n1 + ';border-radius:12px;background:#fff;padding:14px;margin-bottom:16px}.ep-fl{display:flex;gap:12px;align-items:center;flex-wrap:wrap}.ep-in{height:40px;padding:0 12px;border:1px solid ' + N.n2 + ';border-radius:8px;background:#fff;font-size:14px;color:#353944;min-width:0}.ep-in:focus{outline:2px solid ' + N.b + ';outline-offset:-1px}.ep-q{position:relative;flex:1;min-width:240px}.ep-q .ti{position:absolute;left:12px;top:11px;color:' + N.n6 + '}.ep-q .ep-in{width:100%;padding-left:36px}' +
    '.ep-adv{display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;padding-top:12px;border-top:1px solid ' + N.n1 + '}.ep-adv label{display:grid;gap:4px;font-size:12px;color:' + N.n6 + '}.ep-adv[hidden]{display:none}' +
    '.ep-tb{display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:12px}.ep-tg{display:flex;gap:8px;flex-wrap:wrap}' +
    '.ep-tw{overflow:auto;border-radius:8px}.ep-t{width:100%;border-collapse:collapse;font-size:13px}.ep-t th{background:' + N.b + ';color:#fff;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;padding:10px 12px;white-space:nowrap;cursor:pointer;user-select:none}.ep-t th .ti{font-size:12px;opacity:.7;margin-left:4px}.ep-t th.r,.ep-t td.r{text-align:right}.ep-t td{padding:10px 12px;border-bottom:1px solid ' + N.n1 + ';color:#353944;white-space:nowrap}.ep-t tbody tr:hover td{background:' + N.b05 + '}.ep-t .cf th{background:' + N.b05 + ';padding:6px 8px;cursor:default}.ep-t .cf .ep-in{height:32px;width:100%;font-size:12px}' +
    '.ep-bd{display:inline-block;padding:2px 10px;border-radius:12px;font-size:12px;font-weight:600}.ep-bd.Brouillon{background:#E3EBFE;color:#2E427B}.ep-bd.Initié{background:#CAD9FB;color:#18244F}.ep-bd.Approuvé{background:#FBF3C7;color:#706000}.ep-bd.Inactif{background:#E9EBF0;color:#5B606D}.ep-bd.Rejeté{background:#FDE4E1;color:#B42318}' +
    '.ep-ac{display:inline-flex;gap:4px}.ep-ac button{width:30px;height:30px;border:1px solid ' + N.n2 + ';border-radius:8px;background:#fff;color:' + N.b + ';font-size:15px}.ep-ac button:hover{background:' + N.b1 + '}.ep-ac .no{color:#B42318}' +
    '.ep-t tbody tr.sel td{background:#E3EBFE}.ep-vide{padding:56px 0;text-align:center;color:' + N.n6 + ';font-size:14px}.ep-vide .ti{display:block;font-size:44px;color:' + N.n2 + ';margin-bottom:8px}' +
    '.ep-pg{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;padding-top:12px;font-size:13px;color:' + N.n6 + '}.ep-pgs{display:flex;gap:6px}.ep-pgs button{min-width:34px;height:34px;border:1px solid ' + N.n2 + ';border-radius:8px;background:#fff;color:' + N.b95 + '}.ep-pgs button.on{background:' + N.b + ';border-color:' + N.b + ';color:#fff}.ep-pgs button[disabled]{opacity:.4;cursor:default}' +
    '.ep-ov{position:absolute;inset:0;z-index:10;background:#0b133266;display:flex;align-items:center;justify-content:center;padding:16px}.ep-md{width:min(560px,100%);max-height:100%;overflow:auto;border-radius:12px;background:#fff;box-shadow:0 28px 70px #0b133240}.ep-md h2{margin:0;padding:16px 20px;border-bottom:1px solid ' + N.n1 + ';font:600 18px var(--font-heading,Outfit,sans-serif);color:' + N.b95 + '}.ep-mb{display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px 20px}.ep-mb label{display:grid;gap:4px;font-size:13px;color:#353944}.ep-mb label.w{grid-column:1/-1}.ep-mb label b{color:#B42318}.ep-mb .ep-in{width:100%}.ep-er{grid-column:1/-1;color:#B42318;font-size:13px;min-height:16px}.ep-mf{display:flex;justify-content:flex-end;gap:10px;padding:14px 20px;border-top:1px solid ' + N.n1 + '}' +
    '.ep-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:30;background:' + N.b95 + ';color:#fff;padding:10px 18px;border-radius:10px;font-size:13px}' +
    '@media(max-width:900px){.ep-side{display:none}.ep-chip,.ep-lang,.ep-user small{display:none}.ep-swb{min-width:0}.ep-hd{padding:0 12px}.ep-body{padding:14px 12px}.ep-mb{grid-template-columns:1fr}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function menuHtml(items, niv) {
    return items.map(function (m) {
      var enfants = m.sub || m.g, cur = m.id === ecr;
      var ic = m.i ? '<i class="ti ti-' + m.i + '"></i>' : '<span class="ep-dot"></span>';
      if (!enfants) return '<button class="ep-it' + (cur ? ' cur' : '') + '" data-ep-nav="' + (m.id || '') + '"' + (cur ? ' aria-current="page"' : '') + '>' + ic + '<span class="ep-lb">' + esc(m.l) + '</span></button>';
      return '<button class="ep-it' + (m.id === 'pai' ? ' act' : '') + '" data-ep-grp aria-expanded="' + (m.open ? 'true' : 'false') + '">' + ic + '<span class="ep-lb">' + esc(m.l) + '</span><i class="ti ti-chevron-down ep-chev"></i></button>' +
        '<div class="ep-sub"' + (m.open ? '' : ' hidden') + '>' + menuHtml(enfants, niv + 1) + '</div>';
    }).join('');
  }

  function lg(u) { return '<span class="ep-lg" style="background-image:url(' + (u || '') + ')"></span>'; }
  function squelette() {
    var logoAcc = (document.querySelector('.switcher-logo-img') || {}).src || '';
    var L = window.PRODUITS_LOGOS || {};
    racine = document.createElement('div'); racine.id = 'ep-app'; racine.hidden = true;
    racine.innerHTML =
      '<aside class="ep-side"><div class="ep-brand">' + lg(L.epay) + '<div><b>Soft e-Payment</b><small>Liquidations &amp; Paiements Bancaires</small></div></div>' +
      '<nav class="ep-nav" aria-label="Menu Soft e-Payment">' + menuHtml(MENU, 0) + '</nav>' +
      '<button class="ep-fold" data-ep-fold><i class="ti ti-chevrons-left"></i><span>Replier la barre latérale</span></button></aside>' +
      '<div class="ep-main"><header class="ep-hd"><button class="ep-ib" data-ep-fold aria-label="Menu"><i class="ti ti-menu-2"></i></button>' +
      '<div class="ep-sw"><button class="ep-swb" data-ep-sw aria-expanded="false">' + lg(L.epay) + '<span><b>Soft e-Payment</b><small>Paiements et encaissements électroniques</small></span><i class="ti ti-chevron-down"></i></button>' +
      '<div class="ep-pm" hidden role="menu">' +
      '<button class="ep-pi" data-ep-prod="accounting"><span class="ep-lg ac" style="background-image:url(' + logoAcc + ')"></span><span><b>SoftAccounting</b><small>Comptabilité &amp; pilotage financier</small></span><i></i></button>' +
      '<button class="ep-pi" aria-current="true" data-ep-prod="epay">' + lg(L.epay) + '<span><b>Soft e-Payment</b><small>Paiements et encaissements électroniques</small></span><i class="ti ti-check" style="color:' + N.b + '"></i></button>' +
      '<button class="ep-pi" data-ep-prod="budget">' + lg(L.budget) + '<span><b>Soft Budget</b><small>Élaboration et suivi budgétaire</small></span><i></i></button></div></div>' +
      '<div class="ep-chip">PROJET ACTIF<b>PROJET DÉMO</b></div><div class="ep-grow"></div>' +
      '<span class="ep-lang">FR</span><button class="ep-ib" aria-label="Notifications" data-ep-notif><i class="ti ti-bell"></i><span class="ep-bdg">3</span></button>' +
      '<div class="ep-user"><i>U</i><span><b>Utilisateur démo</b><small>Administrateur</small></span></div></header>' +
      '<nav class="ep-bc" aria-label="Fil d\'Ariane"><i class="ti ti-home"></i><span>Soft e-Payment</span><i class="ti ti-chevron-right"></i><span data-ep-crumb>Ordres de paiement</span></nav>' +
      '<div class="ep-body" data-ep-body></div></div>';
    document.body.appendChild(racine);
    racine.addEventListener('click', clic);
    racine.addEventListener('input', saisie);
    document.addEventListener('keydown', function (e) { if (!racine.hidden && e.key === 'Escape') { var m = racine.querySelector('.ep-ov'); if (m) m.remove(); else fermerSw(); } });
    document.addEventListener('click', function (e) { if (!racine.hidden && !e.target.closest('.ep-sw')) fermerSw(); });
    ecran();
  }
  function fermerSw() { var m = racine.querySelector('.ep-pm'); if (m) m.hidden = true; var b = racine.querySelector('[data-ep-sw]'); if (b) b.setAttribute('aria-expanded', 'false'); }

  function lignes() {
    var q = etat.q.toLowerCase();
    var L = DATA.filter(function (r) {
      if (etat.st && r.st !== etat.st) return false;
      if (etat.mode && r.mode !== etat.mode) return false;
      if (etat.site && r.site !== etat.site) return false;
      if (q && r.ref.toLowerCase().indexOf(q) < 0) return false;
      if (etat.du && r.date && r.date < etat.du) return false;
      if (etat.au && r.date && r.date > etat.au) return false;
      return COLS.every(function (c) { var f = (etat.colf[c[0]] || '').toLowerCase(); return !f || String(r[c[0]]).toLowerCase().indexOf(f) >= 0; });
    });
    if (etat.tri) L = L.slice().sort(function (a, b) { var x = a[etat.tri], y = b[etat.tri]; return (typeof x === 'number' ? x - y : String(x).localeCompare(String(y), 'fr')) * etat.dir; });
    return L;
  }
  function opts(liste, v, tous) { return '<option value="">' + tous + '</option>' + liste.map(function (x) { return '<option' + (x === v ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }
  function sites() { var s = []; DATA.forEach(function (r) { if (s.indexOf(r.site) < 0) s.push(r.site); }); return s.sort(); }

  function ecran() {
    if (ecr === 'comptes') return ecranComptes();
    var b = racine.querySelector('[data-ep-body]'), foc = document.activeElement, fid = foc && foc.dataset && (foc.dataset.epQ !== undefined ? 'q' : foc.dataset.epCf ? 'cf:' + foc.dataset.epCf : ''), pos = foc && foc.selectionStart;
    var L = lignes(), n = L.length, pages = Math.max(1, Math.ceil(n / etat.par)); if (etat.pg > pages) etat.pg = pages;
    var deb = (etat.pg - 1) * etat.par, vue = L.slice(deb, deb + etat.par);
    var cnt = {}; ST.forEach(function (s) { cnt[s] = DATA.filter(function (r) { return r.st === s; }).length; });
    var h = '<div class="ep-top"><h1>Ordres de paiement</h1><div class="ep-acts">' +
      '<button class="ep-btn" data-ep-imp><i class="ti ti-upload"></i>Importation Excel</button>' +
      '<button class="ep-btn pri" data-ep-new><i class="ti ti-plus"></i>Saisie de paiement</button>' +
      '<button class="ep-btn" data-ep-soft="SoftDocs"><i class="ti ti-file-import"></i>Récupération SoftDocs</button>' +
      '<button class="ep-btn" data-ep-soft="logiciels"><i class="ti ti-refresh"></i>Récupération logiciels</button></div></div>' +
      '<div class="ep-kpis">' + KPI.map(function (k) {
        return '<button class="ep-k' + (etat.st === k.st ? ' on' : '') + '" data-ep-kpi="' + k.st + '" style="border-top-color:' + k.c + '" aria-pressed="' + (etat.st === k.st) + '"><b style="color:' + (k.t || k.c) + '">' + k.lib + '</b><strong style="color:' + (k.t || k.c) + '">' + cnt[k.st] + '</strong><small>' + k.sub + '</small></button>';
      }).join('') + '</div>' +
      '<div class="ep-card"><div class="ep-fl"><div class="ep-q"><i class="ti ti-search"></i><input class="ep-in" data-ep-q placeholder="Rechercher par référence…" value="' + esc(etat.q) + '"></div>' +
      '<input class="ep-in" type="date" data-ep-du aria-label="Date de début" value="' + etat.du + '"><span>–</span><input class="ep-in" type="date" data-ep-au aria-label="Date de fin" value="' + etat.au + '"></div></div>' +
      '<div class="ep-card"><div class="ep-tb"><div class="ep-tg"><button class="ep-btn sm" data-ep-cf><i class="ti ti-filter"></i>' + (etat.cf ? 'Masquer' : 'Afficher') + ' les filtres colonnes</button><button class="ep-btn sm" data-ep-adv><i class="ti ti-adjustments"></i>Recherche avancée</button></div>' +
      '<div class="ep-tg"><button class="ep-btn sm" data-ep-exp="csv">CSV</button><button class="ep-btn sm" data-ep-exp="xlsx">Excel</button><button class="ep-btn sm" data-ep-exp="pdf">PDF</button></div></div>' +
      '<div class="ep-adv"' + (etat.adv ? '' : ' hidden') + '><label>Statut<select class="ep-in" data-ep-fst>' + opts(ST, etat.st, 'Tous') + '</select></label><label>Mode de paiement<select class="ep-in" data-ep-fmode>' + opts(MODES, etat.mode, 'Tous') + '</select></label><label>Site<select class="ep-in" data-ep-fsite>' + opts(sites(), etat.site, 'Tous') + '</select></label><button class="ep-btn sm" data-ep-raz style="align-self:end">Réinitialiser</button></div>' +
      '<div class="ep-tw" style="margin-top:12px"><table class="ep-t"><thead><tr>' + COLS.map(function (c) {
        return '<th data-ep-tri="' + c[0] + '"' + (c[0] === 'montant' ? ' class="r"' : '') + '>' + c[1] + '<i class="ti ti-' + (etat.tri === c[0] ? (etat.dir > 0 ? 'arrow-up' : 'arrow-down') : 'arrows-sort') + '"></i></th>';
      }).join('') + '<th class="r" style="cursor:default">Actions</th></tr>' +
      (etat.cf ? '<tr class="cf">' + COLS.map(function (c) { return '<th><input class="ep-in" data-ep-cf-i="' + c[0] + '" data-ep-cf="' + c[0] + '" aria-label="Filtrer ' + c[1] + '" value="' + esc(etat.colf[c[0]] || '') + '"></th>'; }).join('') + '<th></th></tr>' : '') +
      '</thead><tbody>' + vue.map(function (r) {
        var i = DATA.indexOf(r), a = '';
        if (r.st === 'Brouillon') a = '<button title="Initier le paiement" data-ep-act="init" data-i="' + i + '"><i class="ti ti-send"></i></button><button class="no" title="Supprimer" data-ep-act="sup" data-i="' + i + '"><i class="ti ti-trash"></i></button>';
        else if (r.st === 'Initié') a = '<button title="Approuver" data-ep-act="app" data-i="' + i + '"><i class="ti ti-check"></i></button><button class="no" title="Rejeter" data-ep-act="rej" data-i="' + i + '"><i class="ti ti-x"></i></button>';
        else a = '<button title="Consulter" data-ep-act="voir" data-i="' + i + '"><i class="ti ti-eye"></i></button>';
        return '<tr><td>' + esc(r.projet) + '</td><td>' + esc(r.site) + '</td><td>' + esc(r.ref) + '</td><td>' + esc(r.mode) + '</td><td>' + esc(r.nom) + '</td><td>' + esc(r.compte) + '</td><td class="r">' + mnt(r.montant) + '</td><td><span class="ep-bd ' + r.st + '">' + r.st + '</span></td><td class="r"><span class="ep-ac">' + a + '</span></td></tr>';
      }).join('') + '</tbody></table>' + (n ? '' : '<div class="ep-vide"><i class="ti ti-file-off"></i>Aucun paiement trouvé</div>') + '</div>' +
      '<div class="ep-pg"><span>Lignes par page : <select class="ep-in" data-ep-par style="height:32px">' + [10, 25, 50].map(function (x) { return '<option' + (x === etat.par ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select> &nbsp; ' + (n ? deb + 1 : 0) + '–' + (deb + vue.length) + ' sur ' + n + '</span>' +
      '<span class="ep-pgs"><button data-ep-p="-1"' + (etat.pg <= 1 ? ' disabled' : '') + ' aria-label="Page précédente"><i class="ti ti-chevron-left"></i></button>' +
      Array.apply(null, Array(pages)).map(function (_, k) { return '<button data-ep-p="' + (k + 1) + '"' + (k + 1 === etat.pg ? ' class="on" aria-current="page"' : '') + '>' + (k + 1) + '</button>'; }).join('') +
      '<button data-ep-p="+1"' + (etat.pg >= pages ? ' disabled' : '') + ' aria-label="Page suivante"><i class="ti ti-chevron-right"></i></button></span></div></div>';
    b.innerHTML = h;
    if (fid) { var el = fid === 'q' ? b.querySelector('[data-ep-q]') : b.querySelector('[data-ep-cf-i="' + fid.slice(3) + '"]'); if (el) { el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} } }
  }

  function saisie(e) {
    var t = e.target;
    if (ecr === 'comptes' && cpSaisie(t)) return;
    if (t.matches('[data-ep-q]')) { etat.q = t.value; etat.pg = 1; ecran(); }
    else if (t.matches('[data-ep-cf-i]')) { etat.colf[t.dataset.epCf] = t.value; etat.pg = 1; ecran(); }
    else if (t.matches('[data-ep-du]')) { etat.du = t.value; ecran(); }
    else if (t.matches('[data-ep-au]')) { etat.au = t.value; ecran(); }
    else if (t.matches('[data-ep-fst]')) { etat.st = t.value; etat.pg = 1; ecran(); }
    else if (t.matches('[data-ep-fmode]')) { etat.mode = t.value; etat.pg = 1; ecran(); }
    else if (t.matches('[data-ep-fsite]')) { etat.site = t.value; etat.pg = 1; ecran(); }
    else if (t.matches('[data-ep-par]')) { etat.par = +t.value; etat.pg = 1; ecran(); }
  }

  function exporter(fmt) {
    var L = lignes(), tete = COLS.map(function (c) { return c[1]; }), rows = L.map(function (r) { return COLS.map(function (c) { return c[0] === 'montant' ? mnt(r.montant) : r[c[0]]; }); });
    if (fmt === 'csv') {
      var csv = '﻿' + [tete].concat(rows).map(function (l) { return l.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'ordres_de_paiement.csv'; document.body.appendChild(a); a.click(); a.remove(); return;
    }
    var X = window.EXPORT_TABLEAU;
    if (!X) { toast('Export non disponible dans cette vue.'); return; }
    if (fmt === 'xlsx') X.xlsx('ordres_de_paiement', 'Ordres de paiement', tete, rows);
    else X.pdf('ordres_de_paiement', 'Ordres de paiement', L.length + ' ordre(s)', tete, rows);
  }

  function modale(r) {
    var ro = r ? ' disabled' : '';
    var v = r || { projet: 'Projet démo', site: 'Antananarivo', mode: 'Virement bancaire', nom: '', compte: '', montant: '' };
    var ov = document.createElement('div'); ov.className = 'ep-ov';
    ov.innerHTML = '<div class="ep-md" role="dialog" aria-modal="true" aria-label="' + (r ? 'Consultation' : 'Saisie de paiement') + '"><h2>' + (r ? 'Ordre ' + esc(r.ref) : 'Saisie de paiement') + '</h2><div class="ep-mb">' +
      '<label>Projet<input class="ep-in" data-m="projet" value="' + esc(v.projet) + '"' + ro + '></label>' +
      '<label>Site<select class="ep-in" data-m="site"' + ro + '>' + opts(sites(), v.site, '').replace('<option value=""></option>', '') + '</select></label>' +
      '<label>Mode de paiement<select class="ep-in" data-m="mode"' + ro + '>' + opts(MODES, v.mode, '').replace('<option value=""></option>', '') + '</select></label>' +
      '<label>Montant (Ar) <b>*</b><input class="ep-in" type="number" min="1" step="any" data-m="montant" value="' + esc(v.montant) + '"' + ro + '></label>' +
      '<label class="w">Nom du bénéficiaire <b>*</b><input class="ep-in" data-m="nom" value="' + esc(v.nom) + '"' + ro + '></label>' +
      '<label class="w">Compte bénéficiaire <b>*</b><input class="ep-in" data-m="compte" value="' + esc(v.compte) + '"' + ro + '></label><div class="ep-er" data-m-err></div></div>' +
      '<div class="ep-mf"><button class="ep-btn" data-m-x>' + (r ? 'Fermer' : 'Annuler') + '</button>' + (r ? '' : '<button class="ep-btn pri" data-m-ok>Enregistrer en brouillon</button>') + '</div></div>';
    racine.appendChild(ov);
    var f = ov.querySelector('[data-m=' + (r ? 'projet' : 'montant') + ']'); if (f) f.focus();
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-m-x]')) { ov.remove(); return; }
      if (!e.target.closest('[data-m-ok]')) return;
      var g = function (k) { return ov.querySelector('[data-m=' + k + ']').value.trim(); }, m = parseFloat(g('montant'));
      if (!g('nom') || !g('compte') || !(m > 0)) { ov.querySelector('[data-m-err]').textContent = 'Renseignez le montant, le nom et le compte du bénéficiaire.'; return; }
      DATA.unshift({ projet: g('projet'), site: g('site'), ref: 'OP-2026-' + ('0000' + nextRef++).slice(-4), mode: g('mode'), nom: g('nom'), compte: g('compte'), montant: m, st: 'Brouillon' });
      ov.remove(); etat.pg = 1; ecran(); toast('Paiement enregistré en brouillon.');
    });
  }

  // ---- importation Excel des ordres de paiement (créés en brouillon) ----
  var MODELE_OP = {
    titre: 'Ordres de paiement', fichier: 'modele_ordres_de_paiement.xlsx',
    champs: [
      { col: 'Projet', oblig: false, format: 'Nom du projet. Par défaut : Projet démo.', exemple: 'Projet démo' },
      { col: 'Site', oblig: false, format: 'Site de paiement. Par défaut : Antananarivo.', exemple: 'Antananarivo' },
      { col: 'Référence', oblig: false, format: 'Référence unique de l\'ordre. Générée automatiquement si vide.', exemple: 'OP-2026-0100' },
      { col: 'Mode de paiement', oblig: false, format: 'Virement bancaire, Mobile Money ou Chèque. Par défaut : Virement bancaire.', exemple: 'Virement bancaire' },
      { col: 'Nom bénéficiaire', oblig: true, format: 'Texte.', exemple: 'BÉNÉFICIAIRE 010' },
      { col: 'Compte bénéficiaire', oblig: true, format: 'IBAN, numéro de compte ou numéro Mobile Money.', exemple: 'MG46 0000 1000 0100 0000 0010' },
      { col: 'Montant', oblig: true, format: 'Nombre strictement positif, en Ariary. Virgule ou point décimal.', exemple: '1250000' }
    ],
    exemples: [['Projet démo', 'Antananarivo', 'OP-2026-0100', 'Virement bancaire', 'BÉNÉFICIAIRE 010', 'MG46 0000 1000 0100 0000 0010', '1250000'], ['Projet démo', 'Toamasina', '', 'Mobile Money', 'BÉNÉFICIAIRE 011', '034 00 000 11', '85000']],
    ligne: function (v) {
      var sans = function (t) { return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); };
      var m = parseFloat(v['Montant'].replace(/[\s  ]/g, '').replace(',', '.')), ref = v['Référence'], er = [];
      if (!v['Nom bénéficiaire']) er.push('Nom du bénéficiaire obligatoire'); if (!v['Compte bénéficiaire']) er.push('Compte bénéficiaire obligatoire'); if (!(m > 0)) er.push('Montant invalide (nombre strictement positif)');
      if (v['Mode de paiement'] && !MODES.some(function (x) { return sans(x) === sans(v['Mode de paiement']); })) er.push('Mode de paiement « ' + v['Mode de paiement'] + ' » inconnu (' + MODES.join(', ') + ')');
      var mode = MODES.filter(function (x) { return sans(x) === sans(v['Mode de paiement']); })[0] || MODES[0];
      return { cle: ref, doublon: !!ref && DATA.some(function (x) { return x.ref === ref; }), erreurs: er, data: { projet: v['Projet'] || 'Projet démo', site: v['Site'] || 'Antananarivo', ref: ref, mode: mode, nom: v['Nom bénéficiaire'], compte: v['Compte bénéficiaire'], montant: m } };
    },
    integrer: function (L) {
      var n = 0, mj = 0;
      L.forEach(function (x) {
        var d = x.data, ex = d.ref && DATA.filter(function (y) { return y.ref === d.ref; })[0];
        if (ex) { ex.projet = d.projet; ex.site = d.site; ex.mode = d.mode; ex.nom = d.nom; ex.compte = d.compte; ex.montant = d.montant; mj++; return; }
        DATA.unshift({ projet: d.projet, site: d.site, ref: d.ref || 'OP-2026-' + ('0000' + nextRef++).slice(-4), mode: d.mode, nom: d.nom, compte: d.compte, montant: d.montant, st: 'Brouillon' }); n++;
      });
      etat.pg = 1; ecran(); toast(n + ' ordre(s) intégré(s) en brouillon' + (mj ? ', ' + mj + ' mis à jour' : '') + '.');
    }
  };

  function clic(e) {
    var t = e.target, b;
    if (ecr === 'comptes' && cpClic(t)) return;
    if ((b = t.closest('[data-ep-fold]'))) { racine.querySelector('.ep-side').classList.toggle('col'); return; }
    if ((b = t.closest('[data-ep-grp]'))) { var o = b.getAttribute('aria-expanded') !== 'true'; b.setAttribute('aria-expanded', o); b.nextElementSibling.hidden = !o; return; }
    if ((b = t.closest('[data-ep-nav]'))) { if (b.dataset.epNav === 'ordres' || b.dataset.epNav === 'comptes') { aller(b.dataset.epNav); } else toast('« ' + b.textContent.trim() + ' » : écran non intégré dans la maquette.'); return; }
    if (t.closest('[data-ep-notif]')) { toast('3 notifications : ordres en attente de validation.'); return; }
    if ((b = t.closest('[data-ep-sw]'))) { var m = racine.querySelector('.ep-pm'); m.hidden = !m.hidden; b.setAttribute('aria-expanded', !m.hidden); return; }
    if ((b = t.closest('[data-ep-prod]'))) {
      fermerSw(); var p = b.dataset.epProd;
      if (p === 'accounting') EP.fermer(); else if (p === 'budget') toast('Soft Budget : produit non disponible dans cette maquette.');
      return;
    }
    if (t.closest('[data-ep-new]')) { modale(null); return; }
    if (t.closest('[data-ep-imp]')) { if (window.IMPORT_ASSISTANT) window.IMPORT_ASSISTANT.ouvrir(MODELE_OP); return; }
    if ((b = t.closest('[data-ep-soft]'))) { toast('Récupération ' + b.dataset.epSoft + ' : connecteur non intégré dans la maquette.'); return; }
    if ((b = t.closest('[data-ep-kpi]'))) { etat.st = etat.st === b.dataset.epKpi ? '' : b.dataset.epKpi; etat.pg = 1; ecran(); return; }
    if (t.closest('[data-ep-cf]') && t.closest('button')) { etat.cf = !etat.cf; ecran(); return; }
    if (t.closest('[data-ep-adv]')) { etat.adv = !etat.adv; ecran(); return; }
    if (t.closest('[data-ep-raz]')) { etat.q = ''; etat.du = etat.au = etat.st = etat.mode = etat.site = ''; etat.colf = {}; etat.pg = 1; ecran(); return; }
    if ((b = t.closest('[data-ep-exp]'))) { exporter(b.dataset.epExp); return; }
    if ((b = t.closest('[data-ep-tri]'))) { var k = b.dataset.epTri; if (etat.tri === k) etat.dir = -etat.dir; else { etat.tri = k; etat.dir = 1; } ecran(); return; }
    if ((b = t.closest('[data-ep-p]'))) { var v = b.dataset.epP; etat.pg = v === '-1' ? etat.pg - 1 : v === '+1' ? etat.pg + 1 : +v; ecran(); return; }
    if ((b = t.closest('[data-ep-act]'))) {
      var r = DATA[+b.dataset.i], a = b.dataset.epAct;
      if (a === 'init') { r.st = 'Initié'; toast(r.ref + ' initié.'); }
      else if (a === 'app') { r.st = 'Approuvé'; toast(r.ref + ' approuvé : prêt pour exécution.'); }
      else if (a === 'rej') { r.st = 'Rejeté'; toast(r.ref + ' rejeté.'); }
      else if (a === 'sup') { DATA.splice(+b.dataset.i, 1); toast(r.ref + ' supprimé.'); }
      else if (a === 'voir') { modale(r); return; }
      ecran();
    }
  }

  // ---- Paramétrage > Paramètres de paiement > Comptes émetteurs ----
  var PAYS = ['Madagascar', 'France', 'Maurice', 'Comores'], DEVISES = ['MGA', 'EUR', 'USD', 'MUR'];
  var CPTS = [
    { lib: 'Compte principal MGA', banque: 'Banque démo A', titulaire: 'Entité démo', pays: 'Madagascar', devise: 'MGA', iban: 'MG46 0000 1000 0100 0000 0001', bic: 'BDEMMGMG', actif: true },
    { lib: 'Compte devises EUR', banque: 'Banque démo B', titulaire: 'Entité démo', pays: 'Madagascar', devise: 'EUR', iban: 'MG46 0000 2000 0200 0000 0002', bic: 'BDEMMGMX', actif: true },
    { lib: 'Ancien compte USD', banque: 'Banque démo A', titulaire: 'Entité démo', pays: 'Madagascar', devise: 'USD', iban: 'MG46 0000 1000 0300 0000 0003', bic: 'BDEMMGMG', actif: false }
  ];
  var CC = [['lib', 'Libellé'], ['banque', 'Banque'], ['titulaire', 'Titulaire'], ['pays', 'Pays'], ['devise', 'Devise'], ['iban', 'IBAN'], ['bic', 'BIC'], ['actif', 'Statut']];
  var cp = { q: '', sel: -1, pg: 1, par: 10 };
  function cpVal(r, k) { return k === 'actif' ? (r.actif ? 'Actif' : 'Inactif') : r[k]; }
  function cpLignes() { var q = cp.q.toLowerCase(); return CPTS.filter(function (r) { return !q || CC.some(function (c) { return String(cpVal(r, c[0])).toLowerCase().indexOf(q) >= 0; }); }); }
  function ecranComptes() {
    var b = racine.querySelector('[data-ep-body]'), foc = document.activeElement, pos = foc && foc.selectionStart, qf = foc && foc.hasAttribute && foc.hasAttribute('data-cp-q');
    var L = cpLignes(), n = L.length, pages = Math.max(1, Math.ceil(n / cp.par)); if (cp.pg > pages) cp.pg = pages;
    var deb = (cp.pg - 1) * cp.par, vueL = L.slice(deb, deb + cp.par), sel = CPTS[cp.sel];
    b.innerHTML = '<div class="ep-top"><h1>Comptes émetteurs</h1><div class="ep-acts">' +
      '<button class="ep-btn pri" data-cp-new><i class="ti ti-plus"></i>Ajouter</button>' +
      '<button class="ep-btn" data-cp-mod' + (sel ? '' : ' disabled') + '><i class="ti ti-pencil"></i>Modifier</button>' +
      '<button class="ep-btn" data-cp-sup' + (sel ? '' : ' disabled') + '><i class="ti ti-trash"></i>Supprimer</button></div></div>' +
      '<div class="ep-card"><div class="ep-tb"><div class="ep-q" style="max-width:420px"><i class="ti ti-search"></i><input class="ep-in" data-cp-q placeholder="Rechercher un compte…" value="' + esc(cp.q) + '"></div>' +
      '<div class="ep-tg"><button class="ep-btn sm" data-cp-exp="csv">CSV</button><button class="ep-btn sm" data-cp-exp="xlsx">Excel</button><button class="ep-btn sm" data-cp-exp="pdf">PDF</button></div></div>' +
      '<div class="ep-tw"><table class="ep-t"><thead><tr>' + CC.map(function (c) { return '<th style="cursor:default">' + c[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      vueL.map(function (r) {
        var i = CPTS.indexOf(r);
        return '<tr data-cp-row="' + i + '" style="cursor:pointer"' + (i === cp.sel ? ' class="sel"' : '') + '>' + CC.map(function (c) {
          return c[0] === 'actif' ? '<td><span class="ep-bd ' + (r.actif ? 'Approuvé' : 'Inactif') + '">' + cpVal(r, 'actif') + '</span></td>' : '<td>' + esc(r[c[0]]) + '</td>';
        }).join('') + '</tr>';
      }).join('') + '</tbody></table>' + (n ? '' : '<div class="ep-vide"><i class="ti ti-building-bank"></i>Aucun compte émetteur trouvé</div>') + '</div>' +
      '<div class="ep-pg"><span>Lignes par page : <select class="ep-in" data-cp-par style="height:32px">' + [10, 25, 50].map(function (x) { return '<option' + (x === cp.par ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select> &nbsp; ' + (n ? deb + 1 : 0) + '–' + (deb + vueL.length) + ' sur ' + n + '</span>' +
      '<span class="ep-pgs"><button data-cp-p="-1"' + (cp.pg <= 1 ? ' disabled' : '') + ' aria-label="Page précédente"><i class="ti ti-chevron-left"></i></button>' +
      Array.apply(null, Array(pages)).map(function (_, k) { return '<button data-cp-p="' + (k + 1) + '"' + (k + 1 === cp.pg ? ' class="on"' : '') + '>' + (k + 1) + '</button>'; }).join('') +
      '<button data-cp-p="+1"' + (cp.pg >= pages ? ' disabled' : '') + ' aria-label="Page suivante"><i class="ti ti-chevron-right"></i></button></span></div></div>';
    if (qf) { var el = b.querySelector('[data-cp-q]'); el.focus(); try { el.setSelectionRange(pos, pos); } catch (e) {} }
  }
  function cpSaisie(t) {
    if (t.matches('[data-cp-q]')) { cp.q = t.value; cp.pg = 1; ecranComptes(); return true; }
    if (t.matches('[data-cp-par]')) { cp.par = +t.value; cp.pg = 1; ecranComptes(); return true; }
    return false;
  }
  function cpModale(i) {
    var r = i >= 0 ? CPTS[i] : { lib: '', banque: '', titulaire: '', pays: 'Madagascar', devise: 'MGA', iban: '', bic: '', actif: true };
    var pl = (window.PAYS || []).filter(function (p) { return p.actif; }).map(function (p) { return p.libelle; }); if (pl.length) { if (r.pays && pl.indexOf(r.pays) < 0) pl.push(r.pays); } else pl = PAYS;
    var sel = function (k, liste) { return '<select class="ep-in" data-m="' + k + '">' + liste.map(function (x) { return '<option' + (x === r[k] ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join('') + '</select>'; };
    var ov = document.createElement('div'); ov.className = 'ep-ov';
    ov.innerHTML = '<div class="ep-md" role="dialog" aria-modal="true" aria-label="Compte émetteur"><h2>' + (i >= 0 ? 'Modifier le compte émetteur' : 'Nouveau compte émetteur') + '</h2><div class="ep-mb">' +
      '<label class="w">Libellé <b>*</b><input class="ep-in" data-m="lib" value="' + esc(r.lib) + '"></label>' +
      '<label>Banque <b>*</b><input class="ep-in" data-m="banque" value="' + esc(r.banque) + '"></label>' +
      '<label>Titulaire <b>*</b><input class="ep-in" data-m="titulaire" value="' + esc(r.titulaire) + '"></label>' +
      '<label>Pays' + sel('pays', pl) + '</label><label>Devise' + sel('devise', DEVISES) + '</label>' +
      '<label>IBAN <b>*</b><input class="ep-in" data-m="iban" value="' + esc(r.iban) + '"></label>' +
      '<label>BIC <b>*</b><input class="ep-in" data-m="bic" value="' + esc(r.bic) + '"></label>' +
      '<label class="w" style="display:flex;align-items:center;gap:8px"><input type="checkbox" data-m="actif"' + (r.actif ? ' checked' : '') + '>Actif</label><div class="ep-er" data-m-err></div></div>' +
      '<div class="ep-mf"><button class="ep-btn" data-m-x>Annuler</button><button class="ep-btn pri" data-m-ok>Enregistrer</button></div></div>';
    racine.appendChild(ov); ov.querySelector('[data-m=lib]').focus();
    ov.addEventListener('click', function (e) {
      if (e.target === ov || e.target.closest('[data-m-x]')) { ov.remove(); return; }
      if (!e.target.closest('[data-m-ok]')) return;
      var g = function (k) { return ov.querySelector('[data-m=' + k + ']').value.trim(); };
      if (!g('lib') || !g('banque') || !g('titulaire') || !g('iban') || !g('bic')) { ov.querySelector('[data-m-err]').textContent = 'Renseignez le libellé, la banque, le titulaire, l\'IBAN et le BIC.'; return; }
      var o = { lib: g('lib'), banque: g('banque'), titulaire: g('titulaire'), pays: g('pays'), devise: g('devise'), iban: g('iban'), bic: g('bic').toUpperCase(), actif: ov.querySelector('[data-m=actif]').checked };
      if (i >= 0) CPTS[i] = o; else { CPTS.push(o); cp.sel = CPTS.length - 1; }
      ov.remove(); ecranComptes(); toast(i >= 0 ? 'Compte modifié.' : 'Compte ajouté.');
    });
  }
  function cpClic(t) {
    var b;
    if ((b = t.closest('[data-cp-row]'))) { cp.sel = +b.dataset.cpRow; ecranComptes(); return true; }
    if (t.closest('[data-cp-new]')) { cpModale(-1); return true; }
    if (t.closest('[data-cp-mod]')) { if (cp.sel >= 0) cpModale(cp.sel); return true; }
    if (t.closest('[data-cp-sup]')) { if (cp.sel >= 0 && confirm('Supprimer le compte « ' + CPTS[cp.sel].lib + ' » ?')) { CPTS.splice(cp.sel, 1); cp.sel = -1; ecranComptes(); toast('Compte supprimé.'); } return true; }
    if ((b = t.closest('[data-cp-p]'))) { var v = b.dataset.cpP; cp.pg = v === '-1' ? cp.pg - 1 : v === '+1' ? cp.pg + 1 : +v; ecranComptes(); return true; }
    if ((b = t.closest('[data-cp-exp]'))) {
      var fmt = b.dataset.cpExp, L = cpLignes(), tete = CC.map(function (c) { return c[1]; }), rows = L.map(function (r) { return CC.map(function (c) { return cpVal(r, c[0]); }); });
      if (fmt === 'csv') {
        var csv = '﻿' + [tete].concat(rows).map(function (l) { return l.map(function (x) { return '"' + String(x).replace(/"/g, '""') + '"'; }).join(';'); }).join('\r\n');
        var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' })); a.download = 'comptes_emetteurs.csv'; document.body.appendChild(a); a.click(); a.remove();
      } else if (window.EXPORT_TABLEAU) { if (fmt === 'xlsx') window.EXPORT_TABLEAU.xlsx('comptes_emetteurs', 'Comptes émetteurs', tete, rows); else window.EXPORT_TABLEAU.pdf('comptes_emetteurs', 'Comptes émetteurs', L.length + ' compte(s)', tete, rows); }
      else toast('Export non disponible dans cette vue.');
      return true;
    }
    return false;
  }
  function aller(id) {
    ecr = id;
    racine.querySelectorAll('[data-ep-nav]').forEach(function (x) { var c = x.dataset.epNav === id; x.classList.toggle('cur', c); if (c) x.setAttribute('aria-current', 'page'); else x.removeAttribute('aria-current'); });
    racine.querySelector('[data-ep-crumb]').textContent = id === 'comptes' ? 'Comptes émetteurs' : 'Ordres de paiement';
    ecran();
  }

  var EP = window.EPAYMENT = {
    ouvrir: function () { if (!racine) squelette(); racine.hidden = false; document.documentElement.style.overflow = 'hidden'; },
    comptes: function () { return CPTS.map(function (c) { return Object.assign({}, c); }); },
    fermer: function () { if (racine) racine.hidden = true; document.documentElement.style.overflow = ''; }
  };
})();
