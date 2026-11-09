// Écran « Saisie d'écritures » (capture) : règles de saisie reprises de la maquette de
// spécification « saisie-ecriture.html », appliquées au balisage de la capture.
//
//  En-tête   - le panneau de ligne reste verrouillé tant que l'en-tête n'est pas validé (cadenas) ;
//              date d'écriture obligatoire et comprise dans l'exercice.
//            - la pièce est numérotée par journal : 2 premières lettres du code + compteur (AC0001).
//  Ligne     - listes filtrables (code + libellé, ↑ ↓ Entrée Échap, ✕ pour vider).
//            - le compte tiers n'est accessible que pour un compte collectif ; il propose les tiers
//              actifs rattachés à ce compte (référentiel « Compte de tiers ») ; sinon « Non applicable ».
//            - « Ajouter » exige compte général, libellé et montant en devise locale non nul ;
//              le sens Débit / Crédit place le montant. Après ajout, libellé et montant sont vidés,
//              le reste (compte, analytique…) est conservé pour la ligne suivante.
//            - analytique, budget (disponible = budget − engagé), mode de règlement : fenêtre
//              « Analytique » ; infos libres et documents : fenêtre « Infos libres ».
//  Pièce     - totaux débit / crédit en monnaie locale et écart ; « Enregistrer » n'accepte qu'une
//              pièce équilibrée et non nulle, puis passe à la pièce suivante.
(function () {
  // Axe FINANCEMENT branché sur « Gestion des plans › Saisie des plans › Financier » : lu à chaque ouverture de liste (seuls les codes actifs du dernier niveau, la catégorie)
  (function () {
    var A = window.ECRITURES_AXES; if (!A || A.__axesPlans) return; Object.defineProperty(A, '__axesPlans', { value: 1, enumerable: false });
    [['ACTIVITE', 'PLAN1'], ['POSTE BUDGETAIRE', 'PLAN2'], ['GEOGRAPHIQUE', 'PLAN4']].forEach(function (x) {
      var nom = x[0], code = x[1], statique = A[nom] || [];
      Object.defineProperty(A, nom, { enumerable: true, configurable: true, set: function (v) { statique = v; }, get: function () {
        var pl = window.PLANS_LIGNES && window.PLANS_LIGNES[code]; if (!pl || !pl.rows) return statique;
        var par = {}; pl.rows.forEach(function (r) { if (r.parent) par[r.parent] = 1; });
        var vus = {}, out = statique.slice(); out.forEach(function (a) { vus[a.code] = 1; });
        pl.rows.forEach(function (r) { if (r.actif !== false && !par[r.code] && !vus[r.code]) { vus[r.code] = 1; out.push({ code: r.code, label: r.libelle }); } });
        return out;
      } });
    });
  })();
  (function () {
    var A = window.ECRITURES_AXES; if (!A || A.__finPlan) return; var statique = A['FINANCEMENT'] || [];
    Object.defineProperty(A, '__finPlan', { value: 1, enumerable: false });
    Object.defineProperty(A, 'FINANCEMENT', { enumerable: true, configurable: true, set: function (v) { statique = v; }, get: function () {
      var pl = window.PLANS_LIGNES && window.PLANS_LIGNES['PLAN3']; if (!pl) return statique;
      var rows = pl.rows || [], cfg = (window.PLANS_CFG || []).filter(function (x) { return x.code === 'PLAN3'; })[0], dernier = cfg && cfg.niveaux ? cfg.niveaux.length : 2;
      return rows.filter(function (r) { return r.actif !== false && pl.niveau(r.code) === dernier; }).map(function (r) { return { code: r.code, label: r.libelle }; });
    } });
  })();
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form');
  if (!R || !window.ECRITURES_REF) return;
  var NG = '_ngcontent-ng-c868432638';
  var REF = window.ECRITURES_REF, AXES = window.ECRITURES_AXES || {};
  // Plans importés (Plans_consolides.xlsx : plan comptable, tiers, journaux, sites, activités, budget, géographie) : ils remplacent les listes d'exemple
  var PREF = window.PLANS_REF;
  if (PREF) {
    REF.comptes = PREF.comptes.map(function (c) { return c[2] ? { code: c[0], label: c[1], collectif: true } : { code: c[0], label: c[1] }; });
    REF.tiers = PREF.tiers.map(function (t) { return { code: t[0], label: t[1], collectif: t[2] }; });
    REF.sites = PREF.sites.slice().sort(function (a, b) { return (b[2] || 0) - (a[2] || 0); }).map(function (s) { return { code: s[0], label: s[1] }; }); // site en cours en tête
    var siteEnCours = (REF.sites[0] || {}).code;
    REF.journaux = PREF.journaux.slice().sort(function (a, b) { return (b[2] === siteEnCours) - (a[2] === siteEnCours) || (a[0] < b[0] ? -1 : 1); }).map(function (j) { return { code: j[0], label: j[1] }; });
    AXES['ACTIVITE'] = PREF.activite.map(function (a) { return { code: a[0], label: a[1] }; });
    AXES['POSTE BUDGETAIRE'] = PREF.budget.map(function (a) { return { code: a[0], label: a[1] }; });
    AXES['GEOGRAPHIQUE'] = PREF.geo.map(function (a) { return { code: a[0], label: a[1] }; });
  }
  var AXE_NOMS = ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE', 'NATURE', 'CATEGORIE DE DEPENSE',
    'Plan 7', 'Plan 8', 'Plan 9', 'Plan 10'];
  var $ = function (s, el) { return (el || R).querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call((el || R).querySelectorAll(s)); };
  var ctrl = function (name) { return $('[formcontrolname="' + name + '"]'); };
  function el(html) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    var n = t.content.firstChild;
    [n].concat($$('*', n)).forEach(function (e) { e.setAttribute(NG, ''); });
    return n;
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function parse(s) { var n = parseFloat(String(s || '').replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function fmtDate(iso) { return iso ? iso.split('-').reverse().join('/') : ''; }

  // monnaies de l'entité (Administration de l'entité › Personnalisation) : M1 tenue de compte, M2 et M3 reporting facultatives
  function MON() { var f = window.ENTITE_MONNAIES; return f ? f() : { m1: 'MGA', m2: 'USD', m3: '' }; }
  // plan de regroupement (Administration de l'entité › Analytique) : champ, colonne et valeur de la ligne seulement s'il est activé
  function regrActif() { return !!(window.REGROUPEMENT && window.REGROUPEMENT()); }
  function repCols() { var m = MON(), c = []; if (m.m2) c.push({ cle: 'montant1', code: m.m2 }); if (m.m3) c.push({ cle: 'montant2', code: m.m3 }); return c; }
  function repNom(i, sens) { return sens + (repCols().length > 1 ? '(Rep' + (i + 1) + ')' : '(Rep)'); }
  var form = $('form');
  form.addEventListener('submit', function (e) { e.preventDefault(); });

  // ---------- Message (toast) ----------
  var toast = document.createElement('div');
  toast.setAttribute('role', 'status');
  toast.style.cssText = 'position:fixed;top:72px;left:50%;transform:translateX(-50%);z-index:30000;padding:8px 16px;border-radius:999px;' +
    'background:#0e3b3a;color:#fff;font-size:12px;font-weight:600;box-shadow:0 14px 30px -14px rgba(14,59,58,.5);display:none';
  document.body.appendChild(toast);
  function notify(msg, erreur) {
    toast.textContent = msg;
    toast.style.background = erreur ? '#a33c35' : '#0e3b3a';
    toast.style.display = '';
    clearTimeout(notify.t);
    notify.t = setTimeout(function () { toast.style.display = 'none'; }, 2800);
  }

  // Présentation des panneaux Code | Libellé (charte) : en-tête centré, filtres avec loupe, ligne choisie en bleu clair
  (function () {
    if (document.getElementById('csx-style')) return;
    var st = document.createElement('style'); st.id = 'csx-style';
    st.textContent = '.csx-pan{padding:0!important;max-height:340px;overflow:auto!important;border:1px solid #D6D9E0!important;border-radius:8px!important;background:#fff!important;box-shadow:0 12px 32px #0b13322e!important;font-size:12px}' +
      '.csx-hd{position:sticky;top:0;z-index:2;background:#fff}.csx-th{display:grid;gap:12px;padding:9px 12px;background:#F5F7F9;border-bottom:1px solid #E9EBF0;text-align:center;font-size:12px;font-weight:600;color:#0B1332}' +
      '.csx-fl{display:grid;gap:8px;padding:8px 8px;border-bottom:1px solid #E9EBF0;background:#fff}.csx-in{position:relative;display:block}.csx-in i{position:absolute;left:8px;top:50%;transform:translateY(-50%);font-size:14px;color:#8A8F9C;pointer-events:none}' +
      '.csx-pan .csx-in input[type=text]{width:100%!important;height:30px!important;min-height:30px!important;padding:0 8px 0 30px!important;border:1px solid #D6D9E0;border-radius:6px;font-size:12px;color:#353944;background:#fff;outline:none;box-sizing:border-box}.csx-pan .csx-in input[type=text]:focus{border-color:#2E427B;box-shadow:0 0 0 1px #2E427B}' +
      '.csx-o{display:grid!important;gap:12px;width:100%;padding:7px 12px!important;border:0!important;border-bottom:1px solid #F1F2F5!important;border-radius:0!important;background:#fff!important;text-align:left;font-size:12px!important;color:#0B1332!important;font-style:normal!important;cursor:pointer;outline:none!important;align-items:baseline}' +
      '.csx-o .csx-c{font-family:inherit!important;font-weight:400!important}.csx-o:hover,.csx-o.csx-on{background:#E3EBFE!important}.csx-o.csx-sel{background:#E3EBFE!important;font-weight:600;color:#2E427B!important}' +
      '.csx-o.csx-aucun{display:block!important;color:#5B606D!important;font-weight:600;padding:8px 12px!important}.csx-vide{padding:14px;text-align:center;color:#8A8F9C;font-size:12px}';
    document.head.appendChild(st);
  })();

  // ---------- Listes filtrables sur les boutons « custom-select » de la capture ----------
  var SEL = {};
  function select(name, items, opts) {
    opts = opts || {};
    var hidden = ctrl(name);
    var btn = $('.custom-select-wrapper button', hidden.parentNode);
    var span = btn.querySelector('span');
    var placeholder = span.textContent;
    var s = SEL[name] = { items: items, value: null, btn: btn, onChange: opts.onChange };
    var panel = null;

    s.set = function (item, silent) {
      s.value = item || null;
      hidden.value = item ? item.code : '';
      span.textContent = item ? item.code : s.placeholder || placeholder; btn.title = item ? item.code + ' — ' + item.label : '';
      span.classList.toggle('text-[#b4b2a9]', !item && !opts.court);
      btn.style.borderColor = ''; btn.style.boxShadow = '';
      if (!silent && s.onChange) s.onChange(item);
    };
    s.setPlaceholder = function (txt) { s.placeholder = txt; if (!s.value) span.textContent = txt; };
    function close() { if (panel) { panel.remove(); panel = null; document.removeEventListener('mousedown', outside); } }
    function outside(e) { if (!btn.parentNode.contains(e.target)) close(); }
    function open() {
      var seul = !!opts.sansLibelle;   // liste sans libellé (ex. exercice) : colonne Code seule, un seul filtre
      var COLS = seul ? '1fr' : 'minmax(90px,34%) 1fr';
      panel = el('<div class="custom-select-dropdown csx-pan"><div class="csx-hd"><div class="csx-th" style="grid-template-columns:' + COLS + '"><span>Code</span>' + (seul ? '' : '<span>Libellé</span>') + '</div>' +
        '<div class="csx-fl" style="grid-template-columns:' + COLS + '"><span class="csx-in"><i class="ti ti-search" aria-hidden="true"></i><input type="text" data-cs="0" placeholder="Rechercher…" aria-label="Filtrer par code" autocomplete="off"></span>' +
        (seul ? '' : '<span class="csx-in"><i class="ti ti-search" aria-hidden="true"></i><input type="text" data-cs="1" placeholder="Rechercher…" aria-label="Filtrer par libellé" autocomplete="off"></span>') + '</div></div><div data-liste></div></div>');
      var inputs = [].slice.call(panel.querySelectorAll('input')), input = inputs[0], liste = panel.querySelector('[data-liste]');
      var visibles = [], actif = 0;
      function render() {
        var qc = inputs[0].value.trim().toLowerCase(), ql = inputs[1] ? inputs[1].value.trim().toLowerCase() : '', q = qc || ql;
        var items = typeof s.items === 'function' ? s.items() : s.items;
        visibles = items.filter(function (it) { return (!qc || String(it.code).toLowerCase().indexOf(qc) === 0) && (!ql || String(it.label).toLowerCase().indexOf(ql) >= 0); });
        // Choix « aucune valeur » proposé en tête de liste (opts.aucun)
        if (opts.aucun && !q) visibles.unshift(null);
        actif = Math.max(0, visibles.findIndex(function (it) { return it ? s.value && it.code === s.value.code : !s.value; }));
        liste.innerHTML = visibles.length ? '' : '<div class="csx-vide">Aucun résultat</div>';
        visibles.slice(0, 200).forEach(function (it, i) {
          var o = el(it ? '<button type="button" class="custom-select-option csx-o" style="grid-template-columns:' + COLS + '"><span class="csx-c">' + esc(it.code) + '</span>' + (seul ? '' : '<span>' + esc(it.label) + '</span>') + '</button>'
            : '<button type="button" class="custom-select-option csx-o csx-aucun">' + esc(opts.aucun) + '</button>');
          if (it && s.value && it.code === s.value.code) o.classList.add('csx-sel');
          if (!it && !s.value) o.classList.add('csx-sel');
          o.addEventListener('mousedown', function (e) { e.preventDefault(); s.set(it); close(); btn.focus(); });
          liste.appendChild(o);
        });
        surligner();
      }
      function surligner() {
        $$('.custom-select-option', liste).forEach(function (o, i) {
          o.classList.toggle('csx-on', i === actif);
          if (i === actif) o.scrollIntoView({ block: 'nearest' });
        });
      }
      inputs.forEach(function (inp) { inp.addEventListener('input', render); });
      inputs.forEach(function (inp) { inp.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          e.preventDefault();
          actif = Math.min(Math.max(actif + (e.key === 'ArrowDown' ? 1 : -1), 0), Math.min(visibles.length, 200) - 1);
          surligner();
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (actif < visibles.length) { s.set(visibles[actif]); close(); btn.focus(); }
        } else if (e.key === 'Escape') { close(); btn.focus(); }
      }); });
      panel.style.minWidth = seul ? 'min(200px, calc(100vw - 32px))' : 'min(460px, calc(100vw - 32px))';
      btn.parentNode.appendChild(panel);
      document.addEventListener('mousedown', outside);
      render();
      input.focus();
    }
    btn.addEventListener('click', function () { if (panel) close(); else if (!btn.disabled) open(); });
    // ✕ pour vider la liste (sauf listes obligatoires de l'en-tête)
    if (!opts.obligatoire) {
      var clear = el('<span title="Vider" style="position:absolute;right:30px;top:50%;transform:translateY(-50%);cursor:pointer;color:#b4b2a9;font-size:12px;display:none">✕</span>');
      btn.parentNode.appendChild(clear);
      clear.addEventListener('mousedown', function (e) { e.preventDefault(); if (!btn.disabled) s.set(null); });
      var maj = s.set;
      s.set = function (item, silent) { maj(item, silent); clear.style.display = item ? '' : 'none'; };
    }
    s.close = close;
    return s;
  }

  // ---------- En-tête ----------
  var bordereau = $('.entry-bordereau');
  var lock = $('button[aria-label]', bordereau);
  var dateEcriture = ctrl('dateEcriture');
  var compteurs = {};   // dernier numéro enregistré par journal
  var valide = false;

  // Champ « Devis programme » placé avant l'exercice (même balisage que le champ Exercice)
  var champEx = $('.header-field-exercice', bordereau);
  var champDp = champEx.cloneNode(true);
  champDp.className = champDp.className.replace('header-field-exercice', 'header-field-dp');
  champDp.querySelector('label').textContent = 'DEVIS PROGRAMME';
  var hiddenDp = champDp.querySelector('input[type="hidden"]');
  hiddenDp.setAttribute('formcontrolname', 'devisProgramme');
  hiddenDp.value = '';
  var spanDp = champDp.querySelector('button span');
  spanDp.textContent = 'Aucun — comptabilisation dans l’exercice';
  spanDp.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left';
  champEx.parentNode.insertBefore(champDp, champEx);
  champEx.parentNode.classList.replace('xl:grid-cols-3', 'xl:grid-cols-4');

  // DP paramétrés dans l'écran « Devis programme » ; période = début → prorogation (sinon fin)
  function dpItems() {
    if (!window.SoftDP || !window.SoftDP.actif()) return [];
    return window.SoftDP.liste().map(function (d) {
      var fin = d.prorogation || d.fin;
      return { code: d.convention + '/' + d.code, label: d.libelle + ' (' + fmtDate(d.debut) + ' – ' + fmtDate(fin) + ')',
        libelle: d.libelle, debut: d.debut, fin: fin };
    });
  }
  var dp = select('devisProgramme', dpItems, { aucun: 'Aucun — comptabilisation dans l’exercice' });
  var exercice = select('exerciceCode', REF.exercices, { obligatoire: true, court: true, sansLibelle: true });
  function syncJournaux() {
    var JP = window.JOURNAUX_PLAN; if (!JP) return;
    JP.forEach(function (j) { var x = REF.journaux.filter(function (y) { return y.code === j.code; })[0]; if (x) x.label = j.libelle || x.label; else REF.journaux.push({ code: j.code, label: j.libelle || '' }); });
    for (var i = REF.journaux.length - 1; i >= 0; i--) if (!JP.some(function (j) { return j.code === REF.journaux[i].code; })) REF.journaux.splice(i, 1);
  }
  function syncExercices() {
    var EA = window.EXERCICES_API; if (!EA || !EA.liste) return;
    var L = EA.liste().filter(function (e) { return !e.cloture; }).sort(function (a, b) { return (b.cours ? 1 : 0) - (a.cours ? 1 : 0) || b.annee - a.annee; }).map(function (e) { var iso = function (v) { v = String(v || ''); return /^\d{2}\/\d{2}\/\d{4}$/.test(v) ? v.split('/').reverse().join('-') : v; }; return { code: String(e.annee), label: 'Exercice ' + e.annee, debut: iso(e.debut), fin: iso(e.fin) }; });
    if (!L.length) return;
    REF.exercices.length = 0; L.forEach(function (e) { REF.exercices.push(e); });
    if (typeof exercice !== 'undefined' && exercice.value) { var cur = REF.exercices.filter(function (e) { return e.code === exercice.value.code; })[0]; if (cur) exercice.value = cur; }
  }
  syncJournaux(); syncExercices();
  window.addEventListener('journaux-changed', syncJournaux); window.addEventListener('exercices-changed', syncExercices); setTimeout(function () { syncJournaux(); syncExercices(); }, 1500);
  var journal = select('journalCode', REF.journaux, { obligatoire: true });
  var site = select('siteId', REF.sites, { obligatoire: true, court: true });
  dp.set(null, true);
  exercice.set(REF.exercices[0], true);
  journal.set(REF.journaux[0], true);
  site.set(REF.sites[0], true);

  // Période de comptabilisation : celle du DP choisi, sinon celle de l'exercice
  function periode() {
    return dp.value ? { debut: dp.value.debut, fin: dp.value.fin, nom: 'le programme ' + dp.value.code }
      : { debut: exercice.value.debut, fin: exercice.value.fin, nom: 'l\'exercice ' + exercice.value.code };
  }
  // Numérotation paramétrée dans « Saisie des journaux » (préfixe, séparateur, longueur, suffixe, dernier numéro)
  function paramJournal(code) { return (window.JOURNAUX_PLAN || []).filter(function (x) { return x.code === code; })[0]; }
  // contexte de la numérotation : site de l'en-tête et date de l'écriture (année, mois)
  function ctxNum() { return { site: site.value ? site.value.code : '', date: dateEcriture.value }; }
  function piece() {
    var j = journal.value.code, pj = paramJournal(j);
    if (pj && window.JOURNAUX_PROCHAIN) return pj.auto ? window.JOURNAUX_PROCHAIN(pj, ctxNum()) : '';
    return (/^\d/.test(j) ? j : j.slice(0, 2)).toUpperCase() + String((compteurs[j] || 0) + 1).padStart(4, '0');
  }
  // Pièce saisie à la main (sinon le numéro proposé par le journal est utilisé)
  function pieceSaisie() { return ctrl('piece').value.trim().toUpperCase(); }
  function pieceCourante() { return pieceSaisie() || piece(); }
  function majEntete() {
    var per = periode(), p = pieceCourante();
    // Comptabilisation dans un programme : l'exercice est grisé (non opérationnel)
    exercice.btn.disabled = valide || !!dp.value;
    exercice.btn.title = dp.value ? 'Comptabilisation dans le programme ' + dp.value.code + ' : exercice non utilisé' : '';
    // Gestion des DP désactivée dans les paramètres : le champ DP n'est pas affiché
    var dpOff = !window.SoftDP || !window.SoftDP.actif();
    champDp.style.display = dpOff ? 'none' : '';
    champEx.parentNode.classList.toggle('xl:grid-cols-4', !dpOff);
    champEx.parentNode.classList.toggle('xl:grid-cols-3', dpOff);
    dp.btn.disabled = valide;
    dateEcriture.min = per.debut; dateEcriture.max = per.fin;
    $('strong', bordereau).textContent = p;
    var pj0 = paramJournal(journal.value.code);
    ctrl('piece').placeholder = pj0 && !pj0.auto ? 'Saisie manuelle du n° de pièce' : 'Proposée : ' + piece();
    $('.entry-page-header p').textContent = journal.value.code + ' - ' + journal.value.label + ' · ' +
      (dp.value ? 'programme ' + dp.value.code + ' — ' + dp.value.libelle : 'exercice ' + exercice.value.code);
  }
  exercice.onChange = journal.onChange = site.onChange = majEntete;
  ['input', 'change'].forEach(function (e) { dateEcriture.addEventListener(e, majEntete); });   // numéro proposé : année et mois de la date de l'écriture
  dp.onChange = function () { invalide(dateEcriture, false); majEntete(); };
  // Le module DP a pu être désactivé ou les DP modifiés depuis leur écran
  window.addEventListener('hashchange', function () {
    if (location.hash !== '#ecritures' && location.hash !== '#ecritures_ent') return;
    var codes = dpItems().map(function (d) { return d.code; });
    if (dp.value && codes.indexOf(dp.value.code) < 0) {
      if (valide) { notify('Le devis programme ' + dp.value.code + ' n\'est plus disponible : l\'en-tête est rouvert.', true); verrouiller(false); }
      dp.set(null, true);
    }
    majEntete();
  });
  ctrl('piece').disabled = false; ctrl('piece').readOnly = false; ctrl('piece').maxLength = 20; // jamais grisé, même avec une proposition
  ctrl('piece').addEventListener('input', function () { majEntete(); });
  majEntete();

  var panneaux = $$('fieldset', form);
  var champsEntete = $$('.header-primary-grid button, input[type="date"], input[type="text"]:not([disabled])', bordereau);
  // Plus de titre « Sélection de l'exercice et du journal » ni de cadenas : l'en-tête reste modifiable et la saisie des lignes est toujours active.
  // La date d'écriture est contrôlée à l'ajout d'une ligne (entetePret).
  $$('h1,h2,h3,h4,h5,p,span,div', bordereau).forEach(function (e) { if (!e.children.length && /s[ée]lection de l.exercice/i.test(e.textContent)) e.style.display = 'none'; });
  lock.style.display = 'none';
  if (lock.parentNode && lock.parentNode.parentNode) lock.parentNode.parentNode.style.display = 'none'; // ligne de titre vide
  // En-tête compact : trois blocs sur une même ligne (gain de place) —
  // « Exercice et journal » (exercice, site, journal, devis programme), « Dates » (date d'écriture, date pièce, cours 1)
  // et « Références » (n° de facture, référence, pièce). Les blocs passent à la ligne sur écran étroit.
  (function () {
    var primaire = $('.header-primary-grid', bordereau), details = $('.header-details-grid', bordereau); if (!primaire || !details) return;
    function bloc(titre) {
      var g = document.createElement('div'); g.className = 'hd-groupe'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', titre);
      var t = document.createElement('span'); t.className = 'hd-titre'; t.textContent = titre; g.appendChild(t); return g;
    }
    function champs(g, noms) {
      var c = document.createElement('div'); c.className = 'hd-champs'; g.appendChild(c);
      noms.forEach(function (n) { var f = ctrl(n); if (f && f.parentNode) c.appendChild(f.parentNode); });
    }
    var ligne = document.createElement('div'); ligne.className = 'hd-ligne';
    var g0 = bloc('Exercice et journal'), g1 = bloc('Dates'), g2 = bloc('Références');
    primaire.classList.add('hd-champs', 'hd-primaire'); g0.appendChild(primaire);
    champs(g1, ['dateEcriture', 'datePiece', 'cours1']); champs(g2, ['facture', 'reference', 'piece']);
    ligne.appendChild(g0); ligne.appendChild(g1); ligne.appendChild(g2);
    details.parentNode.insertBefore(ligne, details); details.style.display = 'none';
  })();
  function verrouiller() {
    valide = false;
    panneaux.forEach(function (f) { f.disabled = false; f.classList.remove('panneau-ligne-verrouille'); f.classList.add('entry-line-editor-active'); });
    champsEntete.forEach(function (c) { c.disabled = false; });
    majEntete();
    majTiers();
    window.dispatchEvent(new Event('ecritures-entete-ouvert'));   // l'en-tête est à (re)saisir : la saisie des lignes se verrouille (voir ecritures_disposition.js)
  }
  function entetePret() {
    var d = dateEcriture.value, per = periode();
    var err = !d ? "La date d'écriture est obligatoire."
      : (d < per.debut || d > per.fin) ? "La date d'écriture doit être comprise dans " + per.nom + ' (' + fmtDate(per.debut) + ' – ' + fmtDate(per.fin) + ').' : '';
    if (!err && d) {
      var clo = (window.PERIODES_CLOTUREES || {})[d.slice(0, 4)] || {}, exo = window.EXERCICES_API && window.EXERCICES_API.liste ? window.EXERCICES_API.liste().filter(function (e) { return String(e.annee) === d.slice(0, 4); })[0] : null;
      if (exo && exo.cloture) err = 'L’exercice ' + exo.annee + ' est clôturé : saisie impossible.';
      else if (clo[d.slice(0, 7)]) err = 'La période ' + d.slice(5, 7) + '/' + d.slice(0, 4) + ' est clôturée (le ' + clo[d.slice(0, 7)] + ') : saisie impossible.';
    }
    invalide(dateEcriture, !!err);
    if (err) { notify(err, true); dateEcriture.focus(); return false; }
    return true;
  }
  window.__ecEntete = { pret: function () { return entetePret(); } };
  function invalide(champ, on) { champ.style.borderColor = on ? '#dc2626' : ''; champ.style.boxShadow = on ? '0 0 0 2px rgba(220,38,38,.12)' : ''; }
  dateEcriture.addEventListener('input', function () { invalide(dateEcriture, false); });

  // ---------- Panneau de ligne ----------
  // Plan comptable : comptes d'exemple + comptes collectifs du référentiel « Compte de tiers »
  function comptes() {
    var liste = REF.comptes.slice(), PCL = window.PLAN_COMPTABLE || [], parPC = {}, vusC = {};
    liste.forEach(function (c) { vusC[c.code] = 1; }); PCL.forEach(function (x) { if (x.parent) parPC[x.parent] = 1; });
    PCL.forEach(function (x) { if (x.actif !== false && !parPC[x.code] && !vusC[x.code]) { vusC[x.code] = 1; liste.push((x.comp || []).indexOf('tiers') >= 0 ? { code: x.code, label: x.libelle, collectif: true } : { code: x.code, label: x.libelle }); } });
    (window.SoftTiers && !PREF ? window.SoftTiers.collectifs() : []).forEach(function (c) {
      if (!liste.some(function (x) { return x.code === c.code; })) liste.push({ code: c.code, label: c.label, collectif: true });
    });
    liste.sort(function (a, b) { return a.code < b.code ? -1 : 1; });
    var pere = {}; (window.PLAN_COMPTABLE || []).forEach(function (x) { if (x.parent) pere[x.parent] = 1; });
    return liste.filter(function (c, i) { var n = liste[i + 1]; return !pere[c.code] && !(n && n.code !== c.code && String(n.code).indexOf(String(c.code)) === 0); });   // dernier niveau : le compte suivant (ordre des codes) n'est pas son sous-compte
  }
  // Tiers : exemples + tiers actifs du référentiel, chacun rattaché à un compte collectif
  function tiersDe(codeCompte) {
    var ref = window.SoftTiers && !PREF ? window.SoftTiers.liste().filter(function (t) { return t.actif; }) : [];
    var live = (window.TIERS_PLAN || []).filter(function (t) { return t.actif !== false && t.compte === codeCompte; }).map(function (t) { return { code: t.code, label: t.nom, collectif: t.compte }; });
    var vusT = {}; return (window.TIERS_PLAN ? live : REF.tiers.filter(function (t) { return t.collectif === codeCompte; })).concat(ref.filter(function (t) { return t.collectif === codeCompte; })).filter(function (t) { if (vusT[t.code]) return false; vusT[t.code] = 1; return true; });
  }
  var compte = select('compteGeneral', comptes);
  var tiers = select('tiers', []);
  var contrat = select('contrat', REF.contrats); contrat.onChange = function (it) { if (it && window.__ecContrat) window.__ecContrat.choisi(it); };
  var libelle = ctrl('libelle'), montant = ctrl('deviseLocale'), echeance = ctrl('echeance');
  // Seul un compte collectif ouvre le compte tiers, limité aux tiers rattachés à ce compte
  function majTiers() {
    var c = compte.value, collectif = !!(c && c.collectif);
    tiers.items = collectif ? tiersDe(c.code) : [];
    tiers.btn.disabled = !tiers.items.length;
    var garde = tiers.value && tiers.items.some(function (t) { return t.code === tiers.value.code; });
    if (!garde) tiers.set(null, true);
    tiers.setPlaceholder(!c ? 'Sélectionner un tiers' : !collectif ? 'Non applicable'
      : tiers.items.length ? 'Sélectionner un tiers' : 'Aucun tiers actif sur ce compte');
  }
  compte.onChange = majTiers;
  majTiers();

  montant.addEventListener('blur', function () { if (montant.value.trim()) montant.value = fmt(parse(montant.value)); });
  montant.addEventListener('input', function () { invalide(montant, false); });
  libelle.addEventListener('input', function () { invalide(libelle, false); });
  ctrl('devise1').title = 'Cours 1 non paramétré';

  var SENS_ON = ['bg-[#3e97ff]', 'border-[#3e97ff]', 'shadow-sm', 'text-white'];
  var SENS_OFF = ['bg-white', 'border-[#d3d1c7]', 'hover:bg-[#eff6ff]', 'hover:border-[#3e97ff]', 'text-[#2c2c2a]'];
  var sensBtns = $$('.entry-field-sens button');
  function setSens(s) {
    sensBtns.forEach(function (o, i) {
      var on = (i === 0) === (s === 'DEBIT');
      o.classList.remove.apply(o.classList, on ? SENS_OFF : SENS_ON);
      o.classList.add.apply(o.classList, on ? SENS_ON : SENS_OFF);
    });
    ctrl('sens').value = s;
  }
  sensBtns.forEach(function (b, i) { b.addEventListener('click', function () { setSens(i ? 'CREDIT' : 'DEBIT'); }); });

  // ---------- Fenêtres « Analytique » et « Infos libres » ----------
  // Le bloc analytique replié de la capture est remplacé par la fenêtre (une seule saisie)
  $('.entry-analytics').style.display = 'none';
  var modeReglement = ctrl('modePaiementCode').cloneNode(true);

  function modal(titre, icone, corps) {
    var m = el('<div class="modal-overlay" style="display:none"><div class="modal-card" style="max-width:960px;padding:0">' +
      '<div style="display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid #e7e0d3">' +
      '<i class="ti ' + icone + '" style="color:#c9a667;font-size:18px"></i><h3 style="margin:0;font-size:15px;font-weight:700;color:#0e3b3a;text-transform:uppercase;letter-spacing:.05em">' + titre + '</h3>' +
      '<button type="button" class="entry-info-modal-close" data-fermer aria-label="Fermer">×</button></div>' +
      '<div data-corps></div>' +
      '<div style="display:flex;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1px solid #e7e0d3">' +
      '<button type="button" class="entry-action" data-fermer>Fermer</button><button type="button" class="entry-action entry-action-primary" data-fermer><i class="ti ti-check"></i> Valider</button></div></div></div>');
    m.querySelector('[data-corps]').appendChild(corps);
    m.addEventListener('mousedown', function (e) { if (e.target === m) m.style.display = 'none'; });
    $$('[data-fermer]', m).forEach(function (b) { b.addEventListener('click', function () { m.style.display = 'none'; m.dispatchEvent(new Event('fermee')); }); });
    R.appendChild(m);
    m.ouvrir = function () { m.style.display = 'flex'; };
    return m;
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') $$('.modal-overlay', R).forEach(function (m) { m.style.display = 'none'; });
  });

  var axesHtml = AXE_NOMS.map(function (nom) {
    var items = AXES[nom] || [];
    return '<div><label class="block text-[11px] font-bold text-[#888780] mb-1.5 uppercase tracking-[0.06em]">' + nom + '</label>' +
      '<select data-axe="' + nom + '" class="w-full border border-[#d3d1c7] rounded-lg bg-white"' + (items.length ? '' : ' disabled title="Plan non paramétré"') + '>' +
      '<option value="">' + (items.length ? 'Sélectionner une affectation' : 'Non paramétré') + '</option>' +
      items.map(function (it) { return '<option value="' + esc(it.code) + '">' + esc(it.code + ' — ' + it.label) + '</option>'; }).join('') +
      '</select></div>';
  }).join('');
  var corpsAna = el('<div class="entry-analytic-modal-grid">' +
    '<div class="entry-analytic-modal-axes"><div class="entry-analytic-axes-heading"><h4><i class="ti ti-chart-pie"></i> Axes analytiques</h4>' +
    '<span>' + AXE_NOMS.filter(function (n) { return (AXES[n] || []).length; }).length + ' axes paramétrés</span></div>' + axesHtml + '</div>' +
    '<div class="entry-analytic-modal-side">' +
    '<section><h4><i class="ti ti-wallet"></i> Budget</h4><label>BUDGET</label><select data-budget><option value="">Aucun budget</option>' +
    REF.budgets.map(function (b) { return '<option value="' + b.code + '">' + esc(b.code + ' — ' + b.label) + '</option>'; }).join('') + '</select>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px"><div><label>DISPONIBLE</label><input data-disponible disabled value="0"></div>' +
    '<div><label>CONSOMMÉ</label><input data-consomme disabled value="0 %"></div></div>' +
    '<div style="height:6px;margin-top:8px;border-radius:999px;background:#fff;border:1px solid #e6ddce;overflow:hidden"><div data-jauge style="height:100%;width:0;background:#0e3b3a"></div></div>' +
    '<p data-alerte-budget style="display:none;margin:6px 0 0;color:#a33c35;font-size:11px;font-weight:700"></p></section>' +
    '<section><h4><i class="ti ti-cash"></i> Règlement</h4><label>MODE DE RÈGLEMENT</label></section>' +
    '</div></div>');
  // Champs analytiques en ligne avec le compte (PC) et le tiers : les listes d'axes quittent la fenêtre « Analytique » (budget et règlement y restent)
  (function () {
    var grille = $('.entry-general-fields', R), tiers = $('.entry-field-compte-tiers', R), k = 0;
    if (!grille || !tiers) return;
    var bloc = document.createElement('div'); bloc.className = 'entry-axes-ligne'; tiers.parentNode.insertBefore(bloc, tiers.nextSibling); // les axes des plans actifs se répartissent sur la ligne
    $$('[data-axe]', corpsAna).forEach(function (s) {
      var w = s.parentNode, l = w.querySelector('label'); k++;
      w.className = 'entry-field-axe entry-axe-' + k; l.className = tiers.querySelector('label').className;
      bloc.appendChild(w);
    });
    var colAxes = $('.entry-analytic-modal-axes', corpsAna); if (colAxes) colAxes.style.display = 'none';
    var cadre = $('.entry-analytic-modal-grid', corpsAna); if (cadre) cadre.style.gridTemplateColumns = '1fr';
  })();
  // Règle de gestion : seul un compte dont la racine (Racine des comptes) ouvre des axes analytiques demande une imputation ; sinon les axes sont grisés.
  // Axes ouverts = plans activés ouverts par la racine du compte, restreints aux axes cochés au dernier niveau du plan comptable ; aucun si « Sans analytique ».
  var PLAN_DE_AXE = { 'ACTIVITE': 'PLAN1', 'POSTE BUDGETAIRE': 'PLAN2', 'FINANCEMENT': 'PLAN3', 'GEOGRAPHIQUE': 'PLAN4', 'NATURE': 'PLAN5', 'CATEGORIE DE DEPENSE': 'PLAN6', 'Plan 7': 'PLAN7', 'Plan 8': 'PLAN8', 'Plan 9': 'PLAN9', 'Plan 10': 'PLAN10' };
  function racineDe(code, vu) {
    vu = vu || {}; var r0 = (window.PLAN_COMPTABLE || []).filter(function (x) { return x.code === code; })[0]; if (!r0 || vu[code]) return 'C' + String(code).charAt(0); vu[code] = 1;
    return r0.parent ? racineDe(r0.parent, vu) : (r0.racine || 'C' + String(code).charAt(0));
  }
  function axesOuverts(code) {
    if (!code) return [];
    var r0 = (window.PLAN_COMPTABLE || []).filter(function (x) { return x.code === code; })[0], ro = (window.RACINES || []).filter(function (x) { return x.code === racineDe(code); })[0], act = window.PLANS_ACTIFS ? window.PLANS_ACTIFS() : [];
    if (!ro || (r0 && (r0.comp || []).indexOf('sans') >= 0)) return [];
    var o = act.filter(function (p) { return ro.plans && ro.plans[p]; }); if (r0 && r0.ana && r0.ana.length) o = o.filter(function (p) { return r0.ana.indexOf(p) >= 0; });
    return o;
  }
  function majAxesCompte() {
    var cv = compte.value, code = cv ? (typeof cv === 'string' ? cv : cv.code) : '', ouv = axesOuverts(code);
    $$('[data-axe]', R).forEach(function (sl) {
      if (sl.dataset.np === undefined) sl.dataset.np = sl.disabled ? '1' : '';
      var ok = ouv.indexOf(PLAN_DE_AXE[sl.dataset.axe]) >= 0 && !sl.dataset.np;
      sl.disabled = !ok; if (!ok) sl.value = '';
      var w = sl.parentNode; if (w) { w.style.opacity = ok ? '' : '.45'; w.title = ok ? '' : (code ? 'Imputation analytique non requise pour ce compte (racine des comptes sans axe)' : 'Choisissez d’abord le compte'); }
    });
  }
  (function () { var set0 = compte.set; compte.set = function (item, silent) { set0.call(compte, item, silent); majAxesCompte(); }; })();
  ['plans-changed', 'plans-actifs'].forEach(function (e) { window.addEventListener(e, majAxesCompte); });
  window.addEventListener('hashchange', majAxesCompte); window.addEventListener('load', majAxesCompte); majAxesCompte();
  // Libellés : « Compte général » prend l'abréviation du plan comptable, « Compte tiers » devient « Tiers »
  function majLibellesChamps() {
    var pc = (window.PLANS_CFG || []).filter(function (x) { return x.code === 'PC'; })[0];
    var g = $('.entry-field-compte-general > label', R), t = $('.entry-field-compte-tiers > label', R);
    if (g) { var v = (pc && pc.abrev) || 'Compte général'; if (g.textContent !== v) g.textContent = v; }
    if (t && t.textContent !== 'Tiers') t.textContent = 'Tiers';
  }
  majLibellesChamps();
  ['plans-changed', 'plans-actifs'].forEach(function (e) { window.addEventListener(e, majLibellesChamps); window.addEventListener(e, function () { setTimeout(function () { if (window.__renderLignes) window.__renderLignes(); }, 0); }); });
  window.addEventListener('hashchange', majLibellesChamps); window.addEventListener('load', majLibellesChamps);
  var secReg = $$('section', corpsAna)[1];
  modeReglement.removeAttribute('formcontrolname');
  secReg.appendChild(modeReglement);
  // Type de taxe (éclatement automatique) et mode de règlement, à droite du libellé
  var taxeSel = document.createElement('select'); taxeSel.className = 'ec-tm-in'; taxeSel.setAttribute('aria-label', 'Type de taxe');
  var taxesSel = [], taxeChips = document.createElement('div'); taxeChips.className = 'ec-taxchips'; taxeChips.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin-top:4px';
  function dessinerChips() { taxeChips.innerHTML = taxesSel.map(function (c, i) { return '<span style="display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:999px;background:#E3EBFE;color:#2E427B;font-size:12px;font-weight:600">' + esc(c) + '<button type="button" data-tx-x="' + i + '" aria-label="Retirer ' + esc(c) + '" style="border:0;background:none;color:#2E427B;cursor:pointer;font-size:14px;line-height:1;padding:0">×</button></span>'; }).join(''); }
  taxeChips.addEventListener('click', function (e) { var b = e.target.closest('[data-tx-x]'); if (b) { taxesSel.splice(+b.dataset.txX, 1); dessinerChips(); } });
  taxeSel.addEventListener('change', function () { var v = taxeSel.value; if (v && taxesSel.indexOf(v) < 0) taxesSel.push(v); taxeSel.value = ''; dessinerChips(); });
  function fixerTaxes(l) { taxesSel = l && l.taxe ? String(l.taxe).split(',').filter(Boolean) : []; dessinerChips(); }
  function majTypesTaxe() {
    var v = taxeSel.value, N = (window.TAXES_REF || []).filter(function (t) { return t.actif !== false && t.ctaxe; }), T = N.length ? N.map(function (t) { return { code: t.code, lib: t.libelle }; }) : (window.__taxTypes || []);
    taxeSel.innerHTML = '<option value="">Aucune taxe</option>' + T.map(function (t) { return '<option value="' + esc(t.code) + '">' + esc(t.code + (t.lib && t.lib !== t.code ? ' — ' + t.lib : '')) + '</option>'; }).join('');
    taxeSel.value = v;
  }
  function majModes() {
    var v = modeReglement.value, M = window.MODES_REGLEMENT;
    if (M) modeReglement.innerHTML = '<option value="">Sélectionner un mode</option>' + M.map(function (m) { return '<option value="' + esc(m.code) + '">' + esc(m.code + ' — ' + m.libelle) + '</option>'; }).join('');
    modeReglement.value = v;
  }
  majTypesTaxe(); majModes(); modeReglement.className = 'ec-tm-in'; modeReglement.setAttribute('aria-label', 'Mode de règlement');
  window.addEventListener('taxes-changed', majTypesTaxe); window.addEventListener('modes-reglement-changed', majModes); window.addEventListener('load', function () { majTypesTaxe(); majModes(); });
  window.addEventListener('hashchange', function () { majTypesTaxe(); majModes(); });
  var tmBloc = el('<div class="ec-taxmode"><label class="ec-tm"><span>Type de taxe</span></label><label class="ec-tm"><span>Mode de règlement</span></label></div>');
  tmBloc.children[0].appendChild(taxeSel); tmBloc.children[0].appendChild(taxeChips); tmBloc.children[1].appendChild(modeReglement);
  (function () { var lb = $('.entry-field-libelle'); if (lb && lb.parentNode) lb.parentNode.insertBefore(tmBloc, lb.nextSibling); })();
  var mAna = modal('Analytique', 'ti-chart-pie', corpsAna);
  var budgetSel = $('[data-budget]', corpsAna);

  function majBudget() {
    var b = REF.budgets.filter(function (x) { return x.code === budgetSel.value; })[0];
    var dispo = b ? b.total - b.engage : 0, pct = b ? Math.round(b.engage / b.total * 100) : 0;
    $('[data-disponible]', corpsAna).value = b ? fmt(dispo) + ' ' + REF.devise : '—';
    $('[data-consomme]', corpsAna).value = b ? pct + ' %' : '—';
    $('[data-jauge]', corpsAna).style.width = pct + '%';
    var depasse = b && ctrl('sens').value === 'DEBIT' && parse(montant.value) > dispo;
    var alerte = $('[data-alerte-budget]', corpsAna);
    alerte.style.display = depasse ? '' : 'none';
    alerte.textContent = depasse ? 'Le montant de la ligne dépasse le disponible du budget.' : '';
  }
  budgetSel.addEventListener('change', majBudget);
  $('.entry-compact-analytic-button').addEventListener('click', function () { majBudget(); mAna.ouvrir(); });

  var corpsInfos = el('<div style="padding:14px;display:grid;gap:12px">' +
    '<div class="entry-analytic-modal-free-info" style="order:0"><h4><i class="ti ti-notes"></i> Informations libres de la ligne</h4>' +
    '<div class="entry-modal-two-cols"><div><label>INFORMATION LIBRE 1</label><input data-info="0" placeholder="Info libre 1"></div>' +
    '<div><label>INFORMATION LIBRE 2</label><input data-info="1" placeholder="Info libre 2"></div></div></div>' +
    '<div class="entry-info-modal-documents" data-benef-bloc><h4><i class="ti ti-user-check"></i> Bénéficiaire du paiement</h4>' +
    '<label style="display:block;margin:6px 0 4px;font-size:12px;font-weight:700">BÉNÉFICIAIRE DU PAIEMENT</label>' +
    '<input data-benef list="ec-benef-liste" autocomplete="off" maxlength="120" placeholder="Code ou nom du tiers, ou nom du bénéficiaire" style="width:100%;box-sizing:border-box"><datalist id="ec-benef-liste"></datalist>' +
    '<p class="entry-modal-doc-hint" data-benef-hint>Personne ou organisme qui reçoit effectivement le paiement (s’il diffère du tiers de la ligne).</p></div>' +
    '<div class="entry-info-modal-documents" data-sdoc-bloc><h4><i class="ti ti-link"></i> Document SoftDocs</h4>' +
    '<label style="display:block;margin:6px 0 4px;font-size:12px;font-weight:700">LIEN DU DOCUMENT SOFTDOCS</label>' +
    '<div style="display:flex;gap:8px;align-items:center"><input data-sdoc type="url" inputmode="url" autocomplete="off" placeholder="https://softdocs.softwell.mg/documents/…" style="flex:1;min-width:0">' +
    '<button type="button" class="entry-modal-doc-button" data-sdoc-ouvrir disabled><i class="ti ti-external-link"></i> Ouvrir</button></div>' +
    '<p class="entry-modal-doc-hint" data-sdoc-hint>Collez le lien du document SoftDocs à rattacher à la ligne (facture, contrat, justificatif).</p></div>' +
    '<div class="entry-info-modal-documents"><h4>Documents rattachés</h4><p data-docs-resume>Aucun document rattaché à la ligne.</p>' +
    '<div data-docs style="display:flex;flex-wrap:wrap;gap:6px"></div>' +
    '<div class="entry-modal-doc-actions"><button type="button" class="entry-modal-doc-button" data-ajout-doc><i class="ti ti-paperclip"></i> Rattacher un document</button>' +
    '<button type="button" class="entry-modal-doc-button" disabled title="Aucun lien documentaire à consulter"><i class="ti ti-eye"></i> Consulter</button></div>' +
    '<p class="entry-modal-doc-hint">Le lien documentaire est enregistré sur la ligne.</p></div></div>');
  var mInfos = modal('Infos libres', 'ti-info-circle', corpsInfos);
  var benef = $('[data-benef]', corpsInfos), benefListe = $('#ec-benef-liste', corpsInfos);
  function majBenefListe() {
    var t = (window.TIERS_PLAN || []).filter(function (x) { return x.actif !== false; }), cur = tiers && tiers.value ? tiers.value.code : '';
    t = t.slice().sort(function (a, b) { return (b.code === cur) - (a.code === cur); }).slice(0, 400);
    benefListe.innerHTML = t.map(function (x) { return '<option value="' + esc(x.code + ' — ' + x.nom) + '"></option>'; }).join('');
  }
  benef.addEventListener('focus', majBenefListe);
  var sdoc = $('[data-sdoc]', corpsInfos), sdocOuvrir = $('[data-sdoc-ouvrir]', corpsInfos), sdocHint = $('[data-sdoc-hint]', corpsInfos), SDOC_AIDE = sdocHint.textContent;
  function lienOk(v) { return /^https?:\/\/[^\s\/$.?#][^\s]*$/i.test(v); }
  function majSdoc() { var v = sdoc.value.trim(), ok = !v || lienOk(v); sdocOuvrir.disabled = !v || !ok; sdoc.style.borderColor = ok ? '' : '#dc2626'; sdocHint.textContent = ok ? SDOC_AIDE : 'Lien invalide : il doit commencer par http:// ou https://.'; sdocHint.style.color = ok ? '' : '#dc2626'; }
  sdoc.addEventListener('input', majSdoc);
  sdocOuvrir.addEventListener('click', function () { var v = sdoc.value.trim(); if (lienOk(v)) window.open(v, '_blank', 'noopener'); });
  var infoBtn = $('.entry-info-hover-button');
  var docs = [], numDoc = 0;
  function renderDocs() {
    var box = $('[data-docs]', corpsInfos);
    box.innerHTML = '';
    docs.forEach(function (d, i) {
      var p = el('<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border:1px solid #e7e0d3;border-radius:999px;background:#fff;font-size:11px">' +
        '<i class="ti ti-file-text"></i>' + esc(d) + '<span title="Retirer" style="cursor:pointer;color:#a33c35;font-weight:700">✕</span></span>');
      p.lastChild.addEventListener('click', function () { docs.splice(i, 1); renderDocs(); });
      box.appendChild(p);
    });
    $('[data-docs-resume]', corpsInfos).textContent = docs.length ? docs.length + ' document(s) rattaché(s) à la ligne.' : 'Aucun document rattaché à la ligne.';
  }
  $('[data-ajout-doc]', corpsInfos).addEventListener('click', function () {
    numDoc++;
    docs.push('Facture_' + String(numDoc).padStart(3, '0') + '.pdf');
    renderDocs();
  });
  infoBtn.addEventListener('click', function () {
    if (!entetePret()) return;
    infoBtn.setAttribute('aria-expanded', 'true');
    mInfos.ouvrir();
  });
  mInfos.addEventListener('fermee', function () { infoBtn.setAttribute('aria-expanded', 'false'); });

  // Import : hors périmètre de la maquette
  $$('.entry-import-actions button:not(.entry-info-hover-button), .entry-import-actions input').forEach(function (b) {
    b.addEventListener(b.tagName === 'INPUT' ? 'change' : 'click', function () {
      notify('L\'import Excel n\'est pas simulé dans la maquette.');
      if (b.tagName === 'INPUT') b.value = '';
    });
  });

  // ---------- Lignes de la pièce ----------
  var lignes = [], selection = -1, edition = -1, modifPiece = null;   // modifPiece : pièce existante en cours de correction (depuis « Liste des écritures »)
  var consult = -1, desactives = [];   // ligne choisie dans la liste : ses informations s'affichent dans la saisie (consultation, champs figés) jusqu'à « Modifier » ou « + »
  var tresoMode = '';   // journal de trésorerie : '' | 'paiement' | 'autres' (voir ecritures_tresorerie.js)
  var tbody = $('.entry-lines-panel tbody');
  // Plus de titre « Pièce en cours » ni de bloc « Lignes de la pièce / n ligne » : la barre d'actions des lignes reste seule
  (function () {
    var h = $('.entry-lines-panel > div:first-child'); if (h && h.querySelector('h3')) h.style.display = 'none';
    var cb = $('.entry-crud-toolbar > div:first-child'); if (cb && cb.querySelector('strong')) cb.style.display = 'none';
  })();
  // Liste des lignes de la pièce : seulement Compte, Tiers, Libellé, Débit, Crédit (le détail analytique reste saisi et conservé, non affiché)
  var trEntete = $('.entry-lines-panel thead tr'), thModele = trEntete ? (trEntete.children[1] || trEntete.children[0]) : null, sigEntete = '';
  // Imputations analytiques affichées après le tiers : un axe par plan actif (abréviation du plan en en-tête, codes seuls dans les cellules)
  function axesListe() {
    return $$('.entry-axes-ligne > .entry-field-axe', R).filter(function (w) { return !w.classList.contains('plan-off'); })
      .map(function (w) { return { nom: w.querySelector('[data-axe]').dataset.axe, lib: w.querySelector('label').textContent.trim() }; });
  }
  function enteteListe(axes) {
    var sig = axes.map(function (a) { return a.lib; }).join('|') + (regrActif() ? '+R' : '') + '#' + repCols().map(function (c) { return c.code; }).join(','); if (!trEntete || sig === sigEntete) return; sigEntete = sig;
    [].slice.call(trEntete.children).slice(1).forEach(function (t) { trEntete.removeChild(t); });
    ['Compte', 'Auxiliaire'].concat(axes.map(function (a) { return a.lib; }), ['Budget'], regrActif() ? ['Regroupement'] : [], ['Contrat', 'Libellé', 'Débit', 'Crédit'], [].concat.apply([], repCols().map(function (c, i) { return [repNom(i, 'Débit'), repNom(i, 'Crédit')]; })), ['Échéance']).forEach(function (nom) {
      var t = thModele.cloneNode(true); t.textContent = nom;
      if (/^(Débit|Crédit)/.test(nom)) t.style.textAlign = 'right';
      trEntete.appendChild(t);
    });
    // la ligne de filtres (tableaux.js) est posée une seule fois : elle suit les colonnes quand l'en-tête change (axes, devises de report, regroupement)
    var fr = trEntete.parentNode.querySelector('tr.tf-row');
    if (fr) {
      var st0 = fr.cells[0] ? fr.cells[0].style.cssText : '';
      fr.innerHTML = '';
      [].slice.call(trEntete.cells).forEach(function (c, i) {
        var h = document.createElement('th'), tt = c.textContent.replace(/s+/g, ' ').trim(); if (st0) h.style.cssText = st0;
        if (tt) { var inp = document.createElement('input'); inp.type = 'search'; inp.placeholder = 'Filtrer'; inp.setAttribute('aria-label', 'Filtrer : ' + tt); inp.autocomplete = 'off'; inp.dataset.tfc = i; h.appendChild(inp); }
        fr.appendChild(h);
      });
    }
  }
  enteteListe(axesListe());
  var pied = $$('.entry-balance-footer td'), trPiedFixe = pied[0].parentNode, tfootFixe = pied[0].closest('tfoot');
  var toolbar = {};
  $$('.entry-crud-toolbar button').forEach(function (b) { toolbar[b.textContent.trim()] = b; });
  var btnAjouter = toolbar['Ajouter'];
  // « Enregistrer la pièce » : valide la pièce (lignes équilibrées) ; les icônes de la zone de ligne agissent sur la ligne en cours
  var btnPiece = el('<button type="button" class="entry-action entry-action-primary"><i class="ti ti-device-floppy"></i> Enregistrer la pièce </button>');
  var btnAnnulerPiece = $('.entry-bottom-actions button'); btnAnnulerPiece.innerHTML = '<i class="ti ti-x"></i> Annuler '; btnAnnulerPiece.title = 'Tout réinitialiser : abandonne la pièce et vide l’en-tête';
  $('.entry-bottom-actions').insertBefore(btnPiece, btnAnnulerPiece);

  var ventil = {};   // ventilation analytique de la ligne en cours (version Entreprise) : { axe: [{ code, pct }] }
  function lireLigne() {
    var axes = {};
    $$('[data-axe]', R).forEach(function (s) { axes[s.dataset.axe] = s.value; });
    Object.keys(ventil).forEach(function (n) { var v = (ventil[n] || []).filter(function (x) { return x.code; }); if (v.length) axes[n] = v.length === 1 ? v[0].code : 'VENTILÉ'; });
    return {
      compte: compte.value, tiers: tiers.value, contrat: contrat.value, libelle: libelle.value.trim(),
      regr: ctrl('regroupement') ? ctrl('regroupement').value : '',
      montant: parse(montant.value), montant1: parse(ctrl('devise1') ? ctrl('devise1').value : '') || 0, montant2: parse(ctrl('devise2') ? ctrl('devise2').value : '') || 0, sens: ctrl('sens').value, echeance: echeance.value,
      axes: axes, ventil: JSON.parse(JSON.stringify(ventil)), budget: budgetSel.value, mode: modeReglement.value, taxe: taxesSel.join(','),
      infos: $$('[data-info]', corpsInfos).map(function (i) { return i.value.trim(); }), docs: docs.slice(), sdoc: sdoc.value.trim(), benef: benef.value.trim()
    };
  }
  function ecrireLigne(l) {
    compte.set(l ? l.compte : null);
    tiers.set(l ? l.tiers : null, true);
    contrat.set(l ? l.contrat : null, true);
    libelle.value = l ? l.libelle : '';
    montant.value = l ? fmt(l.brut != null ? l.brut : l.montant) : '';   // taxe retenue : on ressaisit le montant d'origine, la taxe est recalculée à l'enregistrement
    var m1 = l ? (l.brut != null ? l.brut1 : l.montant1) : 0, m2 = l ? (l.brut != null ? l.brut2 : l.montant2) : 0;
    ctrl('devise1').value = m1 ? fmt(m1) : '';
    if (ctrl('devise2')) ctrl('devise2').value = m2 ? fmt(m2) : '';
    echeance.value = l ? l.echeance : '';
    if (ctrl('regroupement')) ctrl('regroupement').value = l && l.regr ? l.regr : '';
    setSens(l ? l.sens : 'DEBIT');
    $$('[data-axe]', R).forEach(function (s) { s.value = l ? l.axes[s.dataset.axe] || '' : ''; });
    budgetSel.value = l ? l.budget : '';
    modeReglement.value = l ? l.mode : '';
    taxeSel.value = ''; fixerTaxes(l);
    ventil = l && l.ventil ? JSON.parse(JSON.stringify(l.ventil)) : {};
    $$('[data-info]', corpsInfos).forEach(function (i, k) { i.value = l ? l.infos[k] : ''; });
    docs = l ? l.docs.slice() : [];
    sdoc.value = l && l.sdoc ? l.sdoc : ''; majSdoc();
    benef.value = l && l.benef ? l.benef : '';
    renderDocs();
    [libelle, montant].forEach(function (c) { invalide(c, false); });
    invalide(compte.btn, false);
  }
  // Contrôle d'équilibre du bordereau (zone de droite de la ligne) : Débit, Crédit, Solde par monnaie de comptabilisation (locale et devise 1)
  var equilibre = el('<div class="entry-equilibre"><div class="entry-equilibre-titre">Contrôle d\'équilibre du bordereau</div>' +
    '<table><thead><tr><th>Monnaie</th><th>Débit</th><th>Crédit</th><th>Solde</th></tr></thead><tbody></tbody></table></div>');
  // Équilibre débit / crédit par élément du plan de regroupement (monnaie locale) : obligatoire avant de valider la pièce
  function ecartsRegr(liste) {
    if (!regrActif()) return [];
    var m = {}; (liste || lignes).forEach(function (l) { var k = l.regr || ''; m[k] = m[k] || { code: k, d: 0, c: 0 }; if (l.sens === 'DEBIT') m[k].d += l.montant; else m[k].c += l.montant; });
    return Object.keys(m).map(function (k) { var x = m[k]; x.s = Math.round((x.d - x.c) * 100) / 100; return x; });
  }
  // Équilibre débit / crédit par contrat rattaché (monnaie locale) : obligatoire avant de valider la pièce
  function ecartsContrat(liste) {
    var m = {}; (liste || lignes).forEach(function (l) { var k = l.contrat && l.contrat.code; if (!k) return; m[k] = m[k] || { code: k, d: 0, c: 0 }; if (l.sens === 'DEBIT') m[k].d += l.montant; else m[k].c += l.montant; });
    return Object.keys(m).map(function (k) { var x = m[k]; x.s = Math.round((x.d - x.c) * 100) / 100; return x; });
  }
  function majEquilibre(liste) {
    var MONS = [[MON().m1, 'montant']].concat(repCols().map(function (c) { return [c.code, c.cle]; }));
    $('tbody', equilibre).innerHTML = MONS.map(function (m) {
      var d = 0, c = 0; liste.forEach(function (l) { if (l.sens === 'DEBIT') d += l[m[1]] || 0; else c += l[m[1]] || 0; });
      var s = Math.round((d - c) * 100) / 100, ok = !s;
      return '<tr><td>' + m[0] + '</td><td>' + fmt(d) + '</td><td>' + fmt(c) + '</td><td class="' + (!liste.length ? '' : ok ? 'eq-ok' : 'eq-ko') + '">' + fmt(s) + '</td></tr>';
    }).join('') + ecartsRegr(liste).map(function (x) { return '<tr title="Équilibre du regroupement ' + (x.code || 'non renseigné') + '"><td>Regr. ' + (x.code || '—') + '</td><td>' + fmt(x.d) + '</td><td>' + fmt(x.c) + '</td><td class="' + (!x.s ? 'eq-ok' : 'eq-ko') + '">' + fmt(x.s) + '</td></tr>'; }).join('');
  }
  majEquilibre([]);
  function valider(l) {
    var manque = [];
    invalide(compte.btn, !l.compte); if (!l.compte) manque.push('compte général');
    invalide(libelle, !l.libelle); if (!l.libelle) manque.push('libellé');
    invalide(montant, !l.montant); if (!l.montant) manque.push('montant en devise locale');
    if (regrActif()) { var cr = ctrl('regroupement'); if (cr) { invalide(cr, !l.regr); if (cr.__cbBox) invalide(cr.__cbBox, !l.regr); } if (!l.regr) manque.push('plan de regroupement'); }
    if (l.sdoc && !lienOk(l.sdoc)) { notify('Le lien SoftDocs doit commencer par http:// ou https://.', true); return false; }
    if (l.montant < 0) { invalide(montant, true); notify('Le montant doit être positif : utilisez le sens Débit / Crédit.', true); return false; }
    if (manque.length) { notify('Complétez : ' + manque.join(', ') + '.', true); return false; }
    return true;
  }

  function td(html, cls) { return '<td class="px-2.5 py-2 border-b border-[#edf1f5] ' + (cls || 'whitespace-nowrap') + '">' + html + '</td>'; }
  var VIDE = '<span style="color:#b4b2a9">—</span>';
  window.__renderLignes = function () { render(); };
  function render() {
    if (consult >= 0 && (selection !== consult || edition >= 0)) { var enModif = edition >= 0; sortirConsult(); if (!enModif) ecrireLigne(null); }
    var axesL = axesListe(); enteteListe(axesL);
    tbody.innerHTML = '';
    lignes.forEach(function (l, i) {
      var tr = el('<tr style="cursor:pointer">' +
        td('<input type="radio" name="ligne-ecriture" aria-label="Sélectionner la ligne"' + (i === selection ? ' checked' : '') + '>') +
        td('<strong>' + esc(l.compte.code) + '</strong>') +
        td(l.tiers ? esc(l.tiers.code) : VIDE) +
        axesL.map(function (a) { return td(l.axes[a.nom] ? '<span style="font-family:monospace">' + esc(l.axes[a.nom]) + '</span>' : VIDE); }).join('') +
        td(l.budget ? '<span style="font-family:monospace">' + esc(l.budget) + '</span>' : VIDE) +
        (regrActif() ? td(l.regr ? '<span style="font-family:monospace">' + esc(l.regr) + '</span>' : VIDE) : '') +
        td(l.contrat && l.contrat.code ? '<span style="font-family:monospace" title="' + esc(l.contrat.label || '') + '">' + esc(l.contrat.code) + '</span>' : VIDE) +
        td('<div style="min-width:220px">' + esc(l.libelle) + '</div>', 'whitespace-normal') +
        td(l.sens === 'DEBIT' ? '<span style="font-family:monospace">' + fmt(l.montant) + '</span>' : '', 'text-right whitespace-nowrap') +
        td(l.sens === 'DEBIT' ? '' : '<span style="font-family:monospace">' + fmt(l.montant) + '</span>', 'text-right whitespace-nowrap') +
        repCols().map(function (rc) { var v = l[rc.cle]; return td(l.sens === 'DEBIT' && v ? '<span style="font-family:monospace">' + fmt(v) + '</span>' : '', 'text-right whitespace-nowrap') + td(l.sens !== 'DEBIT' && v ? '<span style="font-family:monospace">' + fmt(v) + '</span>' : '', 'text-right whitespace-nowrap'); }).join('') +
        td(l.echeance ? esc(fmtDate(l.echeance)) : VIDE, 'whitespace-nowrap') +
        '</tr>');
      if (i === selection) tr.style.boxShadow = 'inset 3px 0 0 #2E427B'; // sélection : filet bleu, fond blanc
      if (i === edition) tr.style.boxShadow = 'inset 3px 0 0 #0B1332';
      tr.addEventListener('click', function (e) {
        var act = e.target.closest('[data-act]');
        selection = i;
        if (act) ACTIONS[act.dataset.act === 'modifier' ? 'Modifier' : 'Supprimer']();
        else { if (edition < 0) entrerConsult(i); render(); }
      });
      tr.addEventListener('dblclick', function () { selection = i; ACTIONS.Modifier(); });
      tbody.appendChild(tr);
    });

    var d = 0, c = 0;
    lignes.forEach(function (l) { if (l.sens === 'DEBIT') d += l.montant; else c += l.montant; });
    var ecart = Math.round((d - c) * 100) / 100;
    majEquilibre(lignes);
    // Pied : totaux alignés sous les colonnes Débit / Crédit (monnaie locale et devise 1), fond blanc
    var d1 = 0, c1 = 0;
    lignes.forEach(function (l) { if (l.sens === 'DEBIT') d1 += l.montant1 || 0; else c1 += l.montant1 || 0; });
    var ecart1 = Math.round((d1 - c1) * 100) / 100;
    var d2 = 0, c2 = 0; lignes.forEach(function (l) { if (l.sens === 'DEBIT') d2 += l.montant2 || 0; else c2 += l.montant2 || 0; });
    window.__ecTotaux = { d: d, c: c, d1: d1, c1: c1, d2: d2, c2: c2 }; window.__ecRegr = ecartsRegr(); window.__ecContrat = ecartsContrat(); window.dispatchEvent(new Event('ecritures-totaux'));
    var trPied = trPiedFixe, tdT = 'class="px-2.5 py-2 text-right whitespace-nowrap" style="font-family:monospace;font-weight:700;color:#0B1332"';
    tfootFixe.style.display = lignes.length ? '' : 'none';
    trPied.className = ''; trPied.style.background = '#fff'; trPied.style.color = '#0B1332';
    trPied.innerHTML = '<td colspan="' + (6 + axesL.length + (regrActif() ? 1 : 0)) + '" class="px-2.5 py-2" style="font-weight:700">Total · ' + (ecart || ecart1 ? 'Écart ' + fmt(Math.abs(ecart)) + (ecart1 ? ' / ' + fmt(Math.abs(ecart1)) + ' USD' : '') : 'Équilibré') + '</td>' +
      '<td ' + tdT + '>' + fmt(d) + '</td><td ' + tdT + '>' + fmt(c) + '</td>' + repCols().map(function (rc) { var a = rc.cle === 'montant1' ? d1 : d2, b = rc.cle === 'montant1' ? c1 : c2; return '<td ' + tdT + '>' + fmt(a) + '</td><td ' + tdT + '>' + fmt(b) + '</td>'; }).join('') + '<td></td>';
    $('.entry-crud-toolbar strong').textContent = lignes.length + (lignes.length > 1 ? ' lignes' : ' ligne') + (edition >= 0 ? ' · modification de la ligne ' + (edition + 1) : '');

    var sel = selection >= 0 && edition < 0;
    toolbar['Enregistrer'].disabled = consult >= 0 && edition < 0;   // enregistre la ligne en cours (ajout ou mise à jour) ; grisé quand une ligne est seulement consultée
    toolbar['Enregistrer'].title = edition >= 0 ? 'Enregistrer : mettre à jour la ligne ' + (edition + 1) : 'Enregistrer la ligne en cours';
    var er = ecartsRegr().filter(function (x) { return x.s || !x.code; });
    var ec2 = ecartsContrat().filter(function (x) { return x.s; });
    btnPiece.disabled = !lignes.length || edition >= 0 || !!ecart || !!er.length || !!ec2.length;
    btnPiece.title = !lignes.length ? 'Aucune ligne à enregistrer' : edition >= 0 ? 'Terminez la modification de la ligne en cours' : ecart ? 'Pièce déséquilibrée : écart de ' + fmt(Math.abs(ecart)) + ' entre débit et crédit' : ec2.length ? 'Contrat : débit et crédit à équilibrer pour ' + ec2.map(function (x) { return x.code; }).join(', ') : er.length ? 'Plan de regroupement : ' + (er.some(function (x) { return !x.code; }) ? 'regroupement manquant sur une ligne' : 'débit et crédit à équilibrer pour ' + er.filter(function (x) { return x.s; }).map(function (x) { return x.code; }).join(', ')) : 'Enregistrer la pièce';
    toolbar['Modifier'].disabled = !sel;
    toolbar['Dupliquer'].disabled = !sel;
    toolbar['Supprimer'].disabled = !sel;
    btnAjouter.innerHTML = '<i class="ti ti-plus"></i> Ajouter '; btnAjouter.title = 'Ajouter : nouvelle ligne';
  }

  // Éclatement automatique selon le type de taxe : une ligne par compte rattaché au type (États comptables › Type de taxe), au taux ou forfait de la taxe (Paramétrages › Taxes)
  var uidN = 0; function nouvelUid() { return 'L' + Date.now().toString(36) + (++uidN); }
  function rnd(v) { return Math.round(v * 100) / 100; }
  function tauxTaxe(code) {
    var T = window.TAXES_REF || [], c = String(code).toUpperCase();
    return T.filter(function (t) { return t.code.toUpperCase() === c; })[0] || T.filter(function (t) { return t.type && t.type.toUpperCase() === c; })[0] || T.filter(function (t) { return t.code.toUpperCase().indexOf(c) === 0; })[0] || null;
  }
  function eclater(b) {
    var codes = String(b.taxe || '').split(',').filter(Boolean), out = [];
    // retour à l'état saisi : la ligne du tiers revient à son montant d'origine avant tout recalcul
    if (b.brut != null) { b.montant = b.brut; b.montant1 = b.brut1 || 0; b.montant2 = b.brut2 || 0; }
    var M = b.montant, M1 = b.montant1 || 0, M2 = b.montant2 || 0, ret = 0, ret1 = 0, ret2 = 0;
    codes.forEach(function (code) {
      var nt = (window.TAXES_REF || []).filter(function (t) { return t.code === code && t.ctaxe; })[0];
      if (!nt) { out = out.concat(eclaterAncien(b, code)); return; }
      // paramétrage simple (Paramètres comptables › Type de taxe) : taux, mode (En plus / Retenue), compte de taxe
      var tx0 = nt.taux !== '' && nt.taux != null ? parseFloat(nt.taux) : NaN, fo0 = nt.forfait !== '' && nt.forfait != null ? parseFloat(nt.forfait) : NaN;
      if (!(tx0 > 0) && !(fo0 > 0)) { notify('Type de taxe ' + nt.code + ' : ni taux ni montant fixe paramétré (Paramètres comptables › Type de taxe).', true); return; }
      var T = tx0 > 0 ? rnd(M * tx0 / 100) : fo0, k0 = M ? T / M : 0, T1 = rnd(M1 * k0), T2 = rnd(M2 * k0);
      var cpx = REF.comptes.filter(function (x) { return x.code === nt.ctaxe; })[0], ct = { code: nt.ctaxe, label: cpx ? cpx.label : nt.libelle };
      var lib0 = nt.code + (tx0 > 0 ? ' ' + String(tx0).replace('.', ',') + ' %' : '') + ' — ' + b.libelle, opp = b.sens === 'DEBIT' ? 'CREDIT' : 'DEBIT';
      var mk = function (compte, tiers, sens) { return { compte: compte, tiers: tiers, contrat: b.contrat || null, libelle: lib0, regr: b.regr || '', montant: T, montant1: T1, montant2: T2, sens: sens, echeance: b.echeance, axes: {}, budget: '', mode: b.mode, infos: b.infos.map(function () { return ''; }), docs: [], parent: b.uid, taxeAuto: true }; };
      if (nt.effet === 'Retenue') { ret += T; ret1 += T1; ret2 += T2; out.push(mk(ct, null, b.sens)); }   // 401 (C) 100 → 401 (C) 92 + taxe (C) 8
      else { out.push(mk(b.compte, b.tiers || null, b.sens)); out.push(mk(ct, null, opp)); }           // 401 (C) 100 + 401 (C) 20 + taxe (D) 20
    });
    if (ret) { b.brut = M; b.brut1 = M1; b.brut2 = M2; b.montant = rnd(M - ret); b.montant1 = rnd(M1 - ret1); b.montant2 = rnd(M2 - ret2); }
    else { delete b.brut; delete b.brut1; delete b.brut2; }
    return out;
  }
  function eclaterAncien(b, code) {
    var ty = (window.__taxTypes || []).filter(function (t) { return t.code === code; })[0];
    if (!ty) return [];
    if (!ty.cpt || !ty.cpt.length) { notify('Type de taxe ' + ty.code + ' : aucun compte rattaché (États comptables › Type de taxe).', true); return []; }
    var tx = tauxTaxe(ty.code), taux = tx && tx.taux !== '' ? parseFloat(tx.taux) : NaN, forfait = tx && tx.forfait !== '' ? parseFloat(tx.forfait) : NaN;
    if (!(taux > 0) && !(forfait > 0)) { notify('Type de taxe ' + ty.code + ' : taux non paramétré (Paramétrages › Taxes).', true); return []; }
    var out = [];
    ty.cpt.forEach(function (c) {
      var m = taux > 0 ? rnd(b.montant * taux / 100) : forfait, k = b.montant ? m / b.montant : 0, cp = REF.comptes.filter(function (x) { return x.code === c.compte; })[0];
      out.push({ compte: { code: c.compte, label: cp ? cp.label : c.lib }, tiers: null, contrat: b.contrat || null, libelle: ty.code + (taux > 0 ? ' ' + String(taux).replace('.', ',') + ' %' : '') + ' — ' + b.libelle, regr: b.regr || '', montant: m, montant1: rnd((b.montant1 || 0) * k), montant2: rnd((b.montant2 || 0) * k),
        sens: /^Débit$/.test(c.sens) ? 'DEBIT' : /^Crédit$/.test(c.sens) ? 'CREDIT' : b.sens, echeance: b.echeance, axes: {}, budget: '', mode: b.mode, infos: b.infos.map(function () { return ''; }), docs: [], parent: b.uid, taxeAuto: true });
    });
    return out;
  }
  function sansEclat(uid) { for (var k = lignes.length - 1; k >= 0; k--) if (lignes[k].parent === uid) { if (k < edition) edition--; lignes.splice(k, 1); } }
  var ACTIONS = {
    Ajouter: function () {
      if (!entetePret()) return;
      var l = lireLigne();
      if (!valider(l)) return;
      var pos, eclat, modif = edition >= 0;
      if (modif) { l.uid = lignes[edition].uid || nouvelUid(); if (lignes[edition].parent) l.parent = lignes[edition].parent; sansEclat(l.uid); lignes[edition] = l; pos = edition; selection = edition; edition = -1; }
      else { l.uid = nouvelUid(); lignes.push(l); pos = lignes.length - 1; selection = -1; }
      eclat = l.taxe ? eclater(l) : [];
      eclat.forEach(function (x, k) { lignes.splice(pos + 1 + k, 0, x); });
      if (!l.taxe || eclat.length) notify((modif ? 'Ligne mise à jour' : 'Ligne ajoutée à la pièce') + (eclat.length ? ' — ' + eclat.length + ' ligne(s) de taxe générée(s).' : '.'));
      taxeSel.value = ''; fixerTaxes(null);
      // Ligne suivante : on garde compte, tiers, analytique… ; libellé et montant sont à ressaisir
      libelle.value = ''; montant.value = '';
      docs = []; renderDocs(); ventil = {};
      sdoc.value = ''; majSdoc(); benef.value = '';
      $$('[data-info]', corpsInfos).forEach(function (i) { i.value = ''; });
      render();
      libelle.focus();
    },
    Enregistrer: function () {
      var d = 0, c = 0;
      lignes.forEach(function (l) { if (l.sens === 'DEBIT') d += l.montant; else c += l.montant; });
      if (Math.round((d - c) * 100)) { notify('Pièce déséquilibrée : écart de ' + fmt(Math.abs(d - c)) + ' entre débit et crédit.', true); return; }
      var sansR = lignes.filter(function (l) { return regrActif() && !l.regr; }).length;
      if (sansR) { notify('Plan de regroupement obligatoire : ' + sansR + ' ligne(s) sans regroupement.', true); return; }
      var kr = ecartsRegr().filter(function (x) { return x.s; });
      if (kr.length) { notify('Plan de regroupement : débit et crédit non équilibrés pour ' + kr.map(function (x) { return x.code + ' (écart ' + fmt(Math.abs(x.s)) + ')'; }).join(', ') + '.', true); return; }
      var kc = ecartsContrat().filter(function (x) { return x.s; });
      if (kc.length) { notify('Contrat : débit et crédit non équilibrés pour ' + kc.map(function (x) { return x.code + ' (écart ' + fmt(Math.abs(x.s)) + ')'; }).join(', ') + '. Rattachez aussi la contrepartie au contrat.', true); return; }
      var pjE = paramJournal(journal.value.code);
      if (pjE && !pjE.auto && !pieceSaisie()) { notify('Ce journal est en numérotation manuelle : saisissez le numéro de pièce.', true); ctrl('piece').focus(); return; }
      var Z0 = window.CIRCUIT_ZERO, uc = window.UTILISATEUR_COURANT || 'admin';
      if (Z0 && Z0.actif && Z0.createurs.length && Z0.createurs.indexOf(uc) < 0) { notify('Étape zéro : vous n’êtes pas nommé utilisateur créateur d’écritures en brouillon (Paramètre Circuit).', true); return; }
      var manuelle = !!pieceSaisie(), p = pieceCourante(), n = lignes.length;
      if (!manuelle) { if (pjE) { if (window.JOURNAUX_AVANCER) window.JOURNAUX_AVANCER(pjE, ctxNum()); else pjE.dernier = (+pjE.dernier || 0) + 1; window.dispatchEvent(new Event('journaux-changed')); } else compteurs[journal.value.code] = (compteurs[journal.value.code] || 0) + 1; }
      ctrl('piece').value = '';
      lignes.forEach(function (l) { if (l.apure && window.ECRITURES_APURER) window.ECRITURES_APURER(l.apure, l.montant); });   // règlements : les factures apurées sont mises à jour
      // correction d'une pièce existante : l'ancienne version est retirée du registre et masquée dans la liste des écritures
      if (modifPiece) { var kk = modifPiece.journal + '|' + modifPiece.piece + '|' + modifPiece.date; window.ECRITURES_PIECES = (window.ECRITURES_PIECES || []).filter(function (x) { return (x.journal + '|' + x.piece + '|' + x.date) !== kk; }); (window.ECRITURES_REMPLACEES = window.ECRITURES_REMPLACEES || []).push(kk); modifPiece = null; }
      // la pièce enregistrée rejoint le registre des pièces (détection des doublons à l'importation)
      (window.ECRITURES_PIECES = window.ECRITURES_PIECES || []).push({ journal: journal.value.code, piece: p, date: dateEcriture.value, datePiece: ctrl('datePiece').value, facture: ctrl('facture').value, reference: ctrl('reference').value, source: 'saisie', statut: (Z0 && Z0.actif) ? 'Brouillon' : '', createur: uc,
        site: site.value ? site.value.code : '', lignes: lignes.map(function (l) { return { contrat: l.contrat ? l.contrat.code : '', compte: l.compte && l.compte.code, tiers: l.tiers && l.tiers.code, libelle: l.libelle, sens: l.sens, montant: l.montant, montant1: l.montant1 || 0, montant2: l.montant2 || 0, echeance: l.echeance, regr: l.regr, axes: l.axes, auto: !!l.auto, regle: 0 }; }) });
      window.dispatchEvent(new Event('ecritures-pieces-changed'));
      // Les tiers mouvementés deviennent « Utilisés » dans le référentiel
      lignes.forEach(function (l) { if (l.tiers && window.SoftTiers && !PREF) window.SoftTiers.marquerUtilise(l.tiers.code); if (l.tiers && window.TIERS_MARQUER) window.TIERS_MARQUER(l.tiers.collectif, l.tiers.code); });
      lignes = []; selection = -1; edition = -1; tresoMode = '';
      ecrireLigne(null);
      majEntete();
      render();
      notify('Pièce ' + p + ' enregistrée (' + n + ' lignes). Pièce suivante : ' + piece() + '.');
      window.dispatchEvent(new Event('ecritures-entete-ouvert'));   // pièce suivante : nouvel en-tête à valider
    },
    Modifier: function () {
      edition = selection;
      ecrireLigne(lignes[edition]);
      render();
      libelle.focus();
    },
    Dupliquer: function () {
      var l = lignes[selection];
      lignes.splice(selection + 1, 0, JSON.parse(JSON.stringify(l)));
      // Les références d'objets des listes sont conservées pour la ligne dupliquée
      var copie = lignes[selection + 1];
      copie.compte = l.compte; copie.tiers = l.tiers; copie.contrat = l.contrat; copie.uid = nouvelUid(); delete copie.parent;
      selection++;
      render();
      notify('Ligne dupliquée.');
    },
    Supprimer: function () {
      if (!window.confirm('Supprimer la ligne ' + (selection + 1) + ' — ' + lignes[selection].libelle + ' ?')) return;
      var bSup = lignes[selection]; lignes.splice(selection, 1); if (bSup.uid) lignes = lignes.filter(function (x) { return x.parent !== bSup.uid; });
      if (edition === selection) { edition = -1; ecrireLigne(null); }
      selection = -1;
      render();
    },
    Annuler: function () {
      // Abandonne la modification en cours, ou vide le panneau de ligne
      edition = -1;
      ecrireLigne(null);
      render();
    }
  };
  function entrerConsult(i) {
    sortirConsult(); ecrireLigne(lignes[i]); consult = i; desactives = [];
    $$('input,select,textarea,button', $('.entry-general-fields')).forEach(function (x) { if (!x.disabled && !x.classList.contains('ec-ventiler')) { x.disabled = true; desactives.push(x); } });   // « Ventiler » reste actif : ouverture en lecture seule
    $('.entry-general-fields').classList.add('ec-consult');
  }
  function sortirConsult() {
    if (consult < 0) return;
    desactives.forEach(function (x) { x.disabled = false; }); desactives = []; consult = -1;
    $('.entry-general-fields').classList.remove('ec-consult'); majTiers();
  }
  // Journal de trésorerie (type Trésorerie ou Hybride, avec compte associé) : la ligne du compte associé est générée automatiquement en contrepartie des autres lignes
  function jTreso() { var pj = journal.value ? paramJournal(journal.value.code) : null; return pj && (pj.type === 'Trésorerie' || pj.type === 'Hybride') && pj.compte ? pj : null; }
  function majContrepartie(garder) {
    var pj = jTreso(); lignes = lignes.filter(function (l) { return !l.auto; });
    if (pj && tresoMode) {
      var cleG = function (l) { return (regrActif() ? l.regr || '' : '') + '\u0001' + (l.contrat && l.contrat.code || ''); };
      var groupes = lignes.map(cleG).filter(function (v, i, t) { return t.indexOf(v) === i; });
      groupes.forEach(function (gr) {
        var d = 0, c = 0, d1 = 0, c1 = 0, d2 = 0, c2 = 0, ref = null;
        lignes.forEach(function (l) { if (cleG(l) !== gr) return; if (!ref) ref = l; if (l.sens === 'DEBIT') { d += l.montant; d1 += l.montant1 || 0; d2 += l.montant2 || 0; } else { c += l.montant; c1 += l.montant1 || 0; c2 += l.montant2 || 0; } });
        var net = Math.round((d - c) * 100) / 100;
        if (net) {
          var cp = REF.comptes.filter(function (x) { return x.code === pj.compte; })[0] || { code: pj.compte, label: '' }, r2 = function (v) { return Math.round(Math.abs(v) * 100) / 100; };
          lignes.push({ compte: { code: cp.code, label: cp.label }, tiers: null, contrat: ref && ref.contrat || null, libelle: 'Contrepartie ' + (journal.value.label || journal.value.code), regr: regrActif() && ref ? ref.regr || '' : '', montant: Math.abs(net), montant1: r2(d1 - c1), montant2: r2(d2 - c2), sens: net > 0 ? 'CREDIT' : 'DEBIT', echeance: '', axes: {}, budget: '', mode: '', infos: $$('[data-info]', corpsInfos).map(function () { return ''; }), docs: [], auto: true });
        }
      });
    }
    if (!garder) { selection = -1; edition = -1; }
    render();
  }
  // Sémantique des actions de ligne : « Ajouter » ouvre une nouvelle ligne vide ; « Enregistrer » enregistre la ligne en cours (ajout ou mise à jour) ; la pièce s'enregistre par « Enregistrer la pièce »
  var enregLigne = ACTIONS.Ajouter, enregPiece = ACTIONS.Enregistrer;
  ACTIONS.Enregistrer = function () { if (consult >= 0 && edition < 0) { notify('Ligne en consultation : utilisez Modifier pour la modifier ou « + » pour une nouvelle ligne.', true); return; } var n = lignes.length, ed = edition; enregLigne(); if (lignes.length !== n || edition !== ed) majContrepartie(true); };
  var suppr = ACTIONS.Supprimer, dupl = ACTIONS.Dupliquer; ACTIONS.Supprimer = function () { var n = lignes.length, auto = lignes[selection] && lignes[selection].auto; suppr(); if (lignes.length !== n && !auto) majContrepartie(); };   // supprimer la contrepartie la retire sans la régénérer : la pièce est alors déséquilibrée jusqu'à la prochaine ligne
  ACTIONS.Dupliquer = function () { var n = lignes.length, auto = lignes[selection] && lignes[selection].auto; dupl(); if (lignes.length === n) return; if (auto) { if (lignes[selection]) delete lignes[selection].auto; render(); } else majContrepartie(); };
  ACTIONS.Ajouter = function () { if (!entetePret()) return; edition = -1; selection = -1; ecrireLigne(null); render(); compte.btn.focus(); };
  ACTIONS['Enregistrer la pièce'] = enregPiece;
  Object.keys(toolbar).forEach(function (k) {
    toolbar[k].addEventListener('click', function () { if (!toolbar[k].disabled) ACTIONS[k](); });
  });
  btnPiece.addEventListener('click', function () { if (!btnPiece.disabled) ACTIONS['Enregistrer la pièce'](); });

  // ajout de lignes déjà constituées (ex. facture lue par OCR) : mêmes objets que ceux de la saisie manuelle
  window.__ecEntete.jTreso = function () { return jTreso(); };
  window.__ecEntete.setTreso = function (m) { tresoMode = m || ''; majContrepartie(); };
  window.__ecEntete.periode = function () { return periode(); };
  window.__ecEntete.notifier = function (m, er) { notify(m, er); };
  // Ventilation analytique (version Entreprise) : l'écran ecritures_ventilation.js lit et écrit la ventilation de la ligne en cours par ces accès
  window.__ecEntete.ventilation = {
    axes: function () { return axesListe().map(function (a) { return { nom: a.nom, lib: a.lib, items: AXES[a.nom] || [] }; }).filter(function (x) { return x.items.length; }); },
    montant: function () { return parse(montant.value) || 0; },
    info: function () { var c = compte.value; return { no: edition >= 0 ? edition + 1 : consult >= 0 ? consult + 1 : lignes.length + 1, compte: c ? c.code + ' ' + c.label : '', libelle: libelle.value.trim(), devise: MON().m1 }; },
    get: function () { return JSON.parse(JSON.stringify(ventil)); },
    set: function (v) { ventil = v || {}; },
    lecture: function () { return consult >= 0 && edition < 0; }
  };
  window.__ecEntete.eclater = function (b) { return eclater(b); };   // éclatement automatique d'une ligne selon le(s) type(s) de taxe (utilisé aussi pour contrôle)
  window.__ecEntete.journalCourant = function () { return journal.value ? journal.value.code : ''; };
  window.__ecEntete.setJournal = function (code) { var it = REF.journaux.filter(function (j) { return j.code === code; })[0]; if (it && (!journal.value || journal.value.code !== code)) { journal.set(it); } };
  window.__ecEntete.ajouterLignes = function (L, msg) {
    var vides = $$('[data-info]', corpsInfos).map(function () { return ''; });
    L.forEach(function (x) {
      lignes.push({ compte: x.compte, tiers: x.tiers || null, contrat: x.contrat || null, libelle: x.libelle, regr: x.regr || '', montant: x.montant, montant1: x.montant1 || 0, montant2: x.montant2 || 0, sens: x.sens, echeance: x.echeance || '', axes: x.axes || {}, budget: x.budget || '', mode: '', infos: vides.slice(), docs: [], apure: x.apure || null });
    });
    selection = -1; edition = -1; majContrepartie(); notify(msg || (L.length + ' ligne(s) ajoutée(s) à la pièce depuis la facture.'));
  };

  // « Modifier » dans la liste des écritures : la pièce choisie est rechargée dans la saisie (en-tête et lignes) pour être corrigée
  window.ECRITURES_MODIF = {
    charger: function (L) {
      if (!L || !L.length) return false;
      var l0 = L[0], bloc = L.filter(function (x) { return x.numLettrage || x.numReleve; });
      if (bloc.length) { notify('Pièce ' + l0.piece + ' non modifiable : ' + (bloc.some(function (x) { return x.numLettrage; }) ? 'lettrée' : 'rapprochée') + ' (annulez d’abord le ' + (bloc.some(function (x) { return x.numLettrage; }) ? 'lettrage' : 'rapprochement') + ').', true); return false; }
      if (lignes.length && !window.confirm('Une pièce est en cours de saisie. L’abandonner pour corriger la pièce ' + l0.piece + ' ?')) return false;
      var A = window.__ecEntete; lignes = []; selection = -1; edition = -1; tresoMode = ''; ecrireLigne(null);
      function poser(c, v) { if (!c) return; c.value = v; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('change', { bubbles: true })); }
      A.rouvrirEntete(false);
      var jr = REF.journaux.filter(function (j) { return j.code === l0.journal; })[0] || REF.journaux.filter(function (j) { return j.code.replace(/^[0-9]+/, '').indexOf(l0.journal) === 0; })[0];   // les journaux de la liste (ACHA, VENT, BANQ, CA…) sont rapprochés des journaux de la saisie
      if (jr && A.setJournal) A.setJournal(jr.code);
      poser(ctrl('datePiece'), l0.datePiece || l0.date); poser(ctrl('dateEcriture'), l0.date); poser(ctrl('facture'), l0.facture || ''); poser(ctrl('reference'), l0.reference || ''); poser(ctrl('piece'), String(l0.piece || '').toUpperCase());
      window.__ecSansTreso = true; var ouvert = A.ouvrirLignes(); window.__ecSansTreso = false;
      if (!ouvert) { notify('La date comptable ' + l0.date + ' est hors de l’exercice ou de la période ouverte : la pièce ne peut pas être corrigée.', true); return false; }
      var CT = REF.contrats || [], arr = function (v) { return Math.round((+v || 0) * 100) / 100; };
      A.ajouterLignes(L.map(function (x) {
        var cp = REF.comptes.filter(function (c) { return c.code === x.compte; })[0] || { code: x.compte, label: '' }, ti = x.tiers ? (window.TIERS_PLAN || []).filter(function (t) { return t.code === x.tiers; })[0] : null, ct = x.contrat ? CT.filter(function (c) { return c.code === x.contrat; })[0] : null, ax = {};
        Object.keys(x.ana || {}).forEach(function (k) { var i = parseInt(String(k).replace(/\D/g, ''), 10); if (i >= 1 && AXE_NOMS[i - 1] && x.ana[k]) ax[AXE_NOMS[i - 1]] = x.ana[k]; });
        var deb = x.sens === 'Débit' || x.sens === 'DEBIT';
        return { compte: { code: cp.code, label: cp.label }, tiers: ti ? { code: ti.code, label: ti.nom, collectif: ti.compte } : (x.tiers ? { code: x.tiers, label: '' } : null), contrat: ct ? { code: ct.code, label: ct.label } : (x.contrat ? { code: x.contrat, label: '' } : null), libelle: x.libelle, regr: x.regr || '', montant: arr(deb ? x.debit : x.credit), montant1: arr((x.d1 || 0)), montant2: arr((x.d2 || 0)), sens: deb ? 'DEBIT' : 'CREDIT', echeance: x.echeance || '', axes: ax, budget: '' };
      }), 'Pièce ' + l0.piece + ' chargée pour correction : modifiez les lignes puis cliquez sur « Enregistrer la pièce » (l’ancienne version sera remplacée).');
      tresoMode = ''; modifPiece = { journal: l0.journal, piece: l0.piece, date: l0.date };
      return true;
    }
  };

  // « Annuler » en bas de page : abandon de la pièce en cours
  btnAnnulerPiece.addEventListener('click', function () {
    if (lignes.length && !window.confirm('Tout réinitialiser : abandonner la pièce ' + pieceCourante() + ' et ses ' + lignes.length + ' ligne(s), et vider l’en-tête ?')) return;
    lignes = []; selection = -1; edition = -1; tresoMode = ''; modifPiece = null;
    ecrireLigne(null);
    dateEcriture.value = ''; ctrl('datePiece').value = ''; ctrl('facture').value = ''; ctrl('reference').value = ''; ctrl('piece').value = '';
    verrouiller(false);
    render();
  });

  render();
  verrouiller(); // saisie des lignes active dès l’ouverture (plus de cadenas)
})();
