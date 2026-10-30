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
        visibles = items.filter(function (it) { return (!qc || String(it.code).toLowerCase().indexOf(qc) >= 0) && (!ql || String(it.label).toLowerCase().indexOf(ql) >= 0); });
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
  function piece() {
    var j = journal.value.code, pj = paramJournal(j);
    if (pj && window.JOURNAUX_NUMERO) return pj.auto ? window.JOURNAUX_NUMERO(pj, (+pj.dernier || 0) + 1) : '';
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
  exercice.onChange = journal.onChange = majEntete;
  dp.onChange = function () { invalide(dateEcriture, false); majEntete(); };
  // Le module DP a pu être désactivé ou les DP modifiés depuis leur écran
  window.addEventListener('hashchange', function () {
    if (location.hash !== '#ecritures') return;
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
  }
  function entetePret() {
    var d = dateEcriture.value, per = periode();
    var err = !d ? "La date d'écriture est obligatoire."
      : (d < per.debut || d > per.fin) ? "La date d'écriture doit être comprise dans " + per.nom + ' (' + fmtDate(per.debut) + ' – ' + fmtDate(per.fin) + ').' : '';
    invalide(dateEcriture, !!err);
    if (err) { notify(err, true); dateEcriture.focus(); return false; }
    return true;
  }
  function invalide(champ, on) { champ.style.borderColor = on ? '#dc2626' : ''; champ.style.boxShadow = on ? '0 0 0 2px rgba(220,38,38,.12)' : ''; }
  dateEcriture.addEventListener('input', function () { invalide(dateEcriture, false); });

  // ---------- Panneau de ligne ----------
  // Plan comptable : comptes d'exemple + comptes collectifs du référentiel « Compte de tiers »
  function comptes() {
    var liste = REF.comptes.slice();
    (window.SoftTiers && !PREF ? window.SoftTiers.collectifs() : []).forEach(function (c) {
      if (!liste.some(function (x) { return x.code === c.code; })) liste.push({ code: c.code, label: c.label, collectif: true });
    });
    return liste.sort(function (a, b) { return a.code < b.code ? -1 : 1; });
  }
  // Tiers : exemples + tiers actifs du référentiel, chacun rattaché à un compte collectif
  function tiersDe(codeCompte) {
    var ref = window.SoftTiers && !PREF ? window.SoftTiers.liste().filter(function (t) { return t.actif; }) : [];
    return REF.tiers.concat(ref).filter(function (t) { return t.collectif === codeCompte; });
  }
  var compte = select('compteGeneral', comptes);
  var tiers = select('tiers', []);
  var contrat = select('contrat', REF.contrats);
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
    '<div class="entry-info-modal-documents"><h4>Documents rattachés</h4><p data-docs-resume>Aucun document rattaché à la ligne.</p>' +
    '<div data-docs style="display:flex;flex-wrap:wrap;gap:6px"></div>' +
    '<div class="entry-modal-doc-actions"><button type="button" class="entry-modal-doc-button" data-ajout-doc><i class="ti ti-paperclip"></i> Rattacher un document</button>' +
    '<button type="button" class="entry-modal-doc-button" disabled title="Aucun lien documentaire à consulter"><i class="ti ti-eye"></i> Consulter</button></div>' +
    '<p class="entry-modal-doc-hint">Le lien documentaire est enregistré sur la ligne.</p></div></div>');
  var mInfos = modal('Infos libres', 'ti-info-circle', corpsInfos);
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
  var lignes = [], selection = -1, edition = -1;
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
    var sig = axes.map(function (a) { return a.lib; }).join('|'); if (!trEntete || sig === sigEntete) return; sigEntete = sig;
    [].slice.call(trEntete.children).slice(1).forEach(function (t) { trEntete.removeChild(t); });
    ['Compte', 'Tiers'].concat(axes.map(function (a) { return a.lib; }), ['Libellé', 'Débit', 'Crédit', 'Débit USD', 'Crédit USD']).forEach(function (nom) {
      var t = thModele.cloneNode(true); t.textContent = nom;
      if (/^(Débit|Crédit)/.test(nom)) t.style.textAlign = 'right';
      trEntete.appendChild(t);
    });
  }
  enteteListe(axesListe());
  var pied = $$('.entry-balance-footer td'), trPiedFixe = pied[0].parentNode, tfootFixe = pied[0].closest('tfoot');
  var toolbar = {};
  $$('.entry-crud-toolbar button').forEach(function (b) { toolbar[b.textContent.trim()] = b; });
  var btnAjouter = toolbar['Ajouter'];

  function lireLigne() {
    var axes = {};
    $$('[data-axe]', R).forEach(function (s) { axes[s.dataset.axe] = s.value; });
    return {
      compte: compte.value, tiers: tiers.value, contrat: contrat.value, libelle: libelle.value.trim(),
      montant: parse(montant.value), montant1: parse(ctrl('devise1').value) || 0, sens: ctrl('sens').value, echeance: echeance.value,
      axes: axes, budget: budgetSel.value, mode: modeReglement.value,
      infos: $$('[data-info]', corpsInfos).map(function (i) { return i.value.trim(); }), docs: docs.slice()
    };
  }
  function ecrireLigne(l) {
    compte.set(l ? l.compte : null);
    tiers.set(l ? l.tiers : null, true);
    contrat.set(l ? l.contrat : null, true);
    libelle.value = l ? l.libelle : '';
    montant.value = l ? fmt(l.montant) : '';
    ctrl('devise1').value = l && l.montant1 ? fmt(l.montant1) : '';
    echeance.value = l ? l.echeance : '';
    setSens(l ? l.sens : 'DEBIT');
    $$('[data-axe]', R).forEach(function (s) { s.value = l ? l.axes[s.dataset.axe] || '' : ''; });
    budgetSel.value = l ? l.budget : '';
    modeReglement.value = l ? l.mode : '';
    $$('[data-info]', corpsInfos).forEach(function (i, k) { i.value = l ? l.infos[k] : ''; });
    docs = l ? l.docs.slice() : [];
    renderDocs();
    [libelle, montant].forEach(function (c) { invalide(c, false); });
    invalide(compte.btn, false);
  }
  // Contrôle d'équilibre du bordereau (zone de droite de la ligne) : Débit, Crédit, Solde par monnaie de comptabilisation (locale et devise 1)
  var equilibre = el('<div class="entry-equilibre"><div class="entry-equilibre-titre">Contrôle d\'équilibre du bordereau</div>' +
    '<table><thead><tr><th>Monnaie</th><th>Débit</th><th>Crédit</th><th>Solde</th></tr></thead><tbody></tbody></table></div>');
  function majEquilibre(liste) {
    var MON = [['MGA', 'montant'], ['USD', 'montant1']];
    $('tbody', equilibre).innerHTML = MON.map(function (m) {
      var d = 0, c = 0; liste.forEach(function (l) { if (l.sens === 'DEBIT') d += l[m[1]] || 0; else c += l[m[1]] || 0; });
      var s = Math.round((d - c) * 100) / 100, ok = !s;
      return '<tr><td>' + m[0] + '</td><td>' + fmt(d) + '</td><td>' + fmt(c) + '</td><td class="' + (!liste.length ? '' : ok ? 'eq-ok' : 'eq-ko') + '">' + fmt(s) + '</td></tr>';
    }).join('');
  }
  majEquilibre([]);
  function valider(l) {
    var manque = [];
    invalide(compte.btn, !l.compte); if (!l.compte) manque.push('compte général');
    invalide(libelle, !l.libelle); if (!l.libelle) manque.push('libellé');
    invalide(montant, !l.montant); if (!l.montant) manque.push('montant en devise locale');
    if (l.montant < 0) { invalide(montant, true); notify('Le montant doit être positif : utilisez le sens Débit / Crédit.', true); return false; }
    if (manque.length) { notify('Complétez : ' + manque.join(', ') + '.', true); return false; }
    return true;
  }

  function td(html, cls) { return '<td class="px-2.5 py-2 border-b border-[#edf1f5] ' + (cls || 'whitespace-nowrap') + '">' + html + '</td>'; }
  var VIDE = '<span style="color:#b4b2a9">—</span>';
  window.__renderLignes = function () { render(); };
  function render() {
    var axesL = axesListe(); enteteListe(axesL);
    tbody.innerHTML = '';
    lignes.forEach(function (l, i) {
      var tr = el('<tr style="cursor:pointer">' +
        td('<input type="radio" name="ligne-ecriture" aria-label="Sélectionner la ligne"' + (i === selection ? ' checked' : '') + '>') +
        td('<strong>' + esc(l.compte.code) + '</strong>') +
        td(l.tiers ? esc(l.tiers.code) : VIDE) +
        axesL.map(function (a) { return td(l.axes[a.nom] ? '<span style="font-family:monospace">' + esc(l.axes[a.nom]) + '</span>' : VIDE); }).join('') +
        td('<div style="min-width:220px">' + esc(l.libelle) + '</div>', 'whitespace-normal') +
        td(l.sens === 'DEBIT' ? '<span style="font-family:monospace">' + fmt(l.montant) + '</span>' : '', 'text-right whitespace-nowrap') +
        td(l.sens === 'DEBIT' ? '' : '<span style="font-family:monospace">' + fmt(l.montant) + '</span>', 'text-right whitespace-nowrap') +
        td(l.sens === 'DEBIT' && l.montant1 ? '<span style="font-family:monospace">' + fmt(l.montant1) + '</span>' : '', 'text-right whitespace-nowrap') +
        td(l.sens !== 'DEBIT' && l.montant1 ? '<span style="font-family:monospace">' + fmt(l.montant1) + '</span>' : '', 'text-right whitespace-nowrap') +
        '</tr>');
      if (i === selection) tr.style.boxShadow = 'inset 3px 0 0 #2E427B'; // sélection : filet bleu, fond blanc
      if (i === edition) tr.style.boxShadow = 'inset 3px 0 0 #0B1332';
      tr.addEventListener('click', function (e) {
        var act = e.target.closest('[data-act]');
        selection = i;
        if (act) ACTIONS[act.dataset.act === 'modifier' ? 'Modifier' : 'Supprimer']();
        else render();
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
    var trPied = trPiedFixe, tdT = 'class="px-2.5 py-2 text-right whitespace-nowrap" style="font-family:monospace;font-weight:700;color:#0B1332"';
    tfootFixe.style.display = lignes.length ? '' : 'none';
    trPied.className = ''; trPied.style.background = '#fff'; trPied.style.color = '#0B1332';
    trPied.innerHTML = '<td colspan="' + (4 + axesL.length) + '" class="px-2.5 py-2" style="font-weight:700">Total · ' + (ecart || ecart1 ? 'Écart ' + fmt(Math.abs(ecart)) + (ecart1 ? ' / ' + fmt(Math.abs(ecart1)) + ' USD' : '') : 'Équilibré') + '</td>' +
      '<td ' + tdT + '>' + fmt(d) + '</td><td ' + tdT + '>' + fmt(c) + '</td><td ' + tdT + '>' + fmt(d1) + '</td><td ' + tdT + '>' + fmt(c1) + '</td>';
    $('.entry-crud-toolbar strong').textContent = lignes.length + (lignes.length > 1 ? ' lignes' : ' ligne') + (edition >= 0 ? ' · modification de la ligne ' + (edition + 1) : '');

    var sel = selection >= 0 && edition < 0;
    toolbar['Enregistrer'].disabled = !lignes.length || edition >= 0;
    toolbar['Modifier'].disabled = !sel;
    toolbar['Dupliquer'].disabled = !sel;
    toolbar['Supprimer'].disabled = !sel;
    btnAjouter.innerHTML = edition >= 0 ? '<i class="ti ti-check"></i> Mettre à jour ' : '<i class="ti ti-plus"></i> Ajouter ';
  }

  var ACTIONS = {
    Ajouter: function () {
      if (!entetePret()) return;
      var l = lireLigne();
      if (!valider(l)) return;
      if (edition >= 0) { lignes[edition] = l; selection = edition; edition = -1; notify('Ligne mise à jour.'); }
      else { lignes.push(l); selection = -1; notify('Ligne ajoutée à la pièce.'); }
      // Ligne suivante : on garde compte, tiers, analytique… ; libellé et montant sont à ressaisir
      libelle.value = ''; montant.value = '';
      docs = []; renderDocs();
      $$('[data-info]', corpsInfos).forEach(function (i) { i.value = ''; });
      render();
      libelle.focus();
    },
    Enregistrer: function () {
      var d = 0, c = 0;
      lignes.forEach(function (l) { if (l.sens === 'DEBIT') d += l.montant; else c += l.montant; });
      if (Math.round((d - c) * 100)) { notify('Pièce déséquilibrée : écart de ' + fmt(Math.abs(d - c)) + ' entre débit et crédit.', true); return; }
      var pjE = paramJournal(journal.value.code);
      if (pjE && !pjE.auto && !pieceSaisie()) { notify('Ce journal est en numérotation manuelle : saisissez le numéro de pièce.', true); ctrl('piece').focus(); return; }
      var manuelle = !!pieceSaisie(), p = pieceCourante(), n = lignes.length;
      if (!manuelle) { if (pjE) { pjE.dernier = (+pjE.dernier || 0) + 1; window.dispatchEvent(new Event('journaux-changed')); } else compteurs[journal.value.code] = (compteurs[journal.value.code] || 0) + 1; }
      ctrl('piece').value = '';
      // Les tiers mouvementés deviennent « Utilisés » dans le référentiel
      lignes.forEach(function (l) { if (l.tiers && window.SoftTiers && !PREF) window.SoftTiers.marquerUtilise(l.tiers.code); if (l.tiers && window.TIERS_MARQUER) window.TIERS_MARQUER(l.tiers.collectif, l.tiers.code); });
      lignes = []; selection = -1; edition = -1;
      ecrireLigne(null);
      majEntete();
      render();
      notify('Pièce ' + p + ' enregistrée (' + n + ' lignes). Pièce suivante : ' + piece() + '.');
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
      copie.compte = l.compte; copie.tiers = l.tiers; copie.contrat = l.contrat;
      selection++;
      render();
      notify('Ligne dupliquée.');
    },
    Supprimer: function () {
      if (!window.confirm('Supprimer la ligne ' + (selection + 1) + ' — ' + lignes[selection].libelle + ' ?')) return;
      lignes.splice(selection, 1);
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
  Object.keys(toolbar).forEach(function (k) {
    toolbar[k].addEventListener('click', function () { if (!toolbar[k].disabled) ACTIONS[k](); });
  });

  // « Annuler » en bas de page : abandon de la pièce en cours
  $('.entry-bottom-actions button').addEventListener('click', function () {
    if (lignes.length && !window.confirm('Abandonner la pièce ' + pieceCourante() + ' et ses ' + lignes.length + ' ligne(s) ?')) return;
    lignes = []; selection = -1; edition = -1;
    ecrireLigne(null);
    dateEcriture.value = ''; ctrl('datePiece').value = ''; ctrl('facture').value = ''; ctrl('reference').value = ''; ctrl('piece').value = '';
    verrouiller(false);
    render();
  });

  render();
  verrouiller(); // saisie des lignes active dès l’ouverture (plus de cadenas)
})();
