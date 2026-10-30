// Écran « Devis programme » : données en mémoire (rechargées à chaque ouverture de la page).
(function () {
  var root = document.querySelector('[data-dp-root]');
  if (!root) return;
  var $ = function (s) { return root.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(root.querySelectorAll(s)); };

  var CONVENTIONS = { FA: 'FA - REVENU DU CAPITAL' };
  var VIDE = {
    convention: '', code: '', libelle: '', debut: '', fin: '', prorogation: '', cloture: '',
    limitePaiement: '', engagement: '', avance: 0, avanceDevise: 0, caisseDe: '', caisseA: '',
    banqueDe: '', banqueA: '', cautionDe: '', cautionA: '', bqIntitule: '', bqNumero: '', bqNom: '', bqAgence: ''
  };
  // Liste de départ : export Excel des DP paramétrés
  var dps = [
    Object.assign({}, VIDE, { convention: 'FA', code: 'ANC', libelle: 'BUDGET 2025', debut: '2025-01-01', fin: '2025-12-31' }),
    Object.assign({}, VIDE, { convention: 'FA', code: 'BUD', libelle: 'BUDGET 2026', debut: '2026-01-01', fin: '2027-06-30' })
  ];
  var selected = 0;          // index du DP sélectionné, ou -1
  var mode = 'consultation'; // consultation | creation | modification
  var actif = true;
  // Lecture par les autres écrans (saisie d'écritures) : DP paramétrés et activation du module
  window.SoftDP = {
    liste: function () { return dps.map(function (d) { return Object.assign({}, d, { conventionLibelle: CONVENTIONS[d.convention] || d.convention }); }); },
    actif: function () { return actif; }
  };

  var form = $('[data-dp-form]');
  var fields = Array.prototype.slice.call(form.elements).filter(function (el) { return el.name; });
  form.addEventListener('submit', function (e) { e.preventDefault(); });
  var TAB_ON = ['border-[#3e97ff]', 'text-[#3e97ff]'], TAB_OFF = ['border-transparent', 'text-[#888780]'];

  function fmtDate(iso) { return iso ? iso.split('-').reverse().join('/') : ''; }
  function fmtMontant(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function parseMontant(s) {
    var n = parseFloat(String(s).replace(/\s| | /g, '').replace(',', '.'));
    return isNaN(n) ? NaN : n;
  }

  function showTab(id) {
    $$('[data-dp-tab]').forEach(function (b) {
      var on = b.dataset.dpTab === id;
      b.classList.remove.apply(b.classList, on ? TAB_OFF : TAB_ON);
      b.classList.add.apply(b.classList, on ? TAB_ON : TAB_OFF);
      b.setAttribute('aria-selected', on);
    });
    $$('[data-dp-panel]').forEach(function (p) { p.style.display = p.dataset.dpPanel === id ? '' : 'none'; });
  }

  function fillForm(dp) {
    fields.forEach(function (el) {
      var v = dp[el.name];
      el.value = el.classList.contains('dp-amount') ? fmtMontant(v) : (v || '');
      el.classList.remove('dp-invalid');
    });
    $('[data-dp-errors]').style.display = 'none';
  }

  function readForm() {
    var dp = {};
    fields.forEach(function (el) {
      dp[el.name] = el.classList.contains('dp-amount') ? parseMontant(el.value) : el.value.trim();
    });
    dp.code = dp.code.toUpperCase();
    return dp;
  }

  function validate(dp) {
    var errs = [], bad = [];
    function req(name, label) { if (!dp[name]) { errs.push(label + ' est obligatoire.'); bad.push(name); } }
    req('convention', 'La convention'); req('code', 'Le code du DP'); req('libelle', 'Le libellé');
    req('debut', 'La date de début'); req('fin', 'La date de fin');
    if (dp.debut && dp.fin && dp.fin < dp.debut) { errs.push('La fin de période doit être postérieure au début.'); bad.push('fin'); }
    if (dp.prorogation && dp.fin && dp.prorogation < dp.fin) { errs.push('La date de prorogation doit être postérieure à la fin de période.'); bad.push('prorogation'); }
    ['avance', 'avanceDevise'].forEach(function (n) {
      if (isNaN(dp[n]) || dp[n] < 0) { errs.push('Le montant d\'avance initiale doit être un nombre positif.'); bad.push(n); }
    });
    var doublon = dps.some(function (d, i) {
      return d.convention === dp.convention && d.code === dp.code && !(mode === 'modification' && i === selected);
    });
    if (dp.code && doublon) { errs.push('Le code ' + dp.code + ' existe déjà pour cette convention.'); bad.push('code'); }
    fields.forEach(function (el) { el.classList.toggle('dp-invalid', bad.indexOf(el.name) >= 0); });
    var box = $('[data-dp-errors]');
    box.innerHTML = errs.join('<br>');
    box.style.display = errs.length ? '' : 'none';
    return !errs.length;
  }

  function flash(msg) {
    var m = $('[data-dp-message]');
    m.textContent = msg;
    m.style.display = '';
    clearTimeout(flash.t);
    flash.t = setTimeout(function () { m.style.display = 'none'; }, 3500);
  }

  function renderList() {
    var q = ($('[data-dp-search]').value || '').trim().toLowerCase();
    var tbody = $('[data-dp-rows]');
    tbody.innerHTML = '';
    var shown = 0;
    dps.forEach(function (dp, i) {
      var hay = (dp.convention + ' ' + (CONVENTIONS[dp.convention] || '') + ' ' + dp.code + ' ' + dp.libelle).toLowerCase();
      if (q && hay.indexOf(q) < 0) return;
      shown++;
      var tr = document.createElement('tr');
      tr.className = 'cursor-pointer border-b border-slate-100 hover:bg-slate-50' + (i === selected ? ' dp-row-selected' : '');
      tr.title = CONVENTIONS[dp.convention] || dp.convention;
      [[dp.convention, 'text-left font-semibold'], [dp.code, 'text-left font-bold'], [dp.libelle, 'text-left'],
       [fmtDate(dp.debut), 'text-center'], [fmtDate(dp.fin), 'text-center'], [fmtMontant(dp.avance), 'text-right']]
        .forEach(function (c) {
          var td = document.createElement('td');
          td.className = 'px-4 py-3 ' + c[1];
          td.textContent = c[0];
          tr.appendChild(td);
        });
      tr.addEventListener('click', function () { if (mode === 'consultation') { selected = i; refresh(); } });
      tr.addEventListener('dblclick', function () { if (mode === 'consultation') { selected = i; refresh(); showTab('saisie'); } });
      tbody.appendChild(tr);
    });
    if (!shown) {
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-12 text-center"><p class="text-sm font-semibold text-slate-700">Aucun devis programme</p>' +
        '<p class="mt-1 text-xs text-slate-500">' + (q ? 'Modifiez votre recherche.' : 'Utilisez « Ajouter » pour créer le premier DP.') + '</p></td></tr>';
    }
    $('[data-dp-count]').textContent = dps.length;
    $('[data-dp-shown]').textContent = shown + ' DP affiché(s) sur ' + dps.length;
  }

  function refresh() {
    var editing = mode !== 'consultation';
    var has = selected >= 0 && selected < dps.length;
    var can = function (a) {
      if (!actif) return false;
      if (a === 'ajouter') return !editing;
      if (a === 'modifier' || a === 'supprimer') return !editing && has;
      return editing; // enregistrer, annuler
    };
    $$('[data-dp-action]').forEach(function (b) { b.disabled = !can(b.dataset.dpAction); });
    fields.forEach(function (el) { el.disabled = !editing; });

    var badge = $('[data-dp-mode]');
    var MODES = {
      consultation: ['Consultation', 'bg-slate-100 text-slate-600'],
      creation: ['Création', 'bg-blue-50 text-blue-700'],
      modification: ['Modification', 'bg-amber-50 text-amber-700']
    };
    badge.textContent = MODES[mode][0];
    badge.className = 'w-fit rounded-full px-3 py-1 text-xs font-semibold ' + MODES[mode][1];

    if (!editing) fillForm(has ? dps[selected] : VIDE);
    $('[data-dp-form-title]').textContent = mode === 'creation' ? 'Nouveau devis programme'
      : has ? 'Devis programme ' + dps[selected].code + ' — ' + dps[selected].libelle : 'Devis programme';
    renderList();
  }

  // Interrupteur d'activation
  var sw = $('[data-dp-switch]');
  sw.addEventListener('click', function () {
    actif = !actif;
    if (!actif && mode !== 'consultation') mode = 'consultation';
    sw.setAttribute('aria-checked', actif);
    $('[data-dp-switch-label]').textContent = actif ? 'Activée' : 'Désactivée';
    $('[data-dp-off-notice]').style.display = actif ? 'none' : '';
    root.classList.toggle('dp-off', !actif);
    refresh();
  });

  // Par défaut la gestion des DP est désactivée (non utilisée pour l'instant)
  sw.click();

  $$('[data-dp-tab]').forEach(function (b) { b.addEventListener('click', function () { showTab(b.dataset.dpTab); }); });
  $('[data-dp-search]').addEventListener('input', renderList);

  // Montants : mise en forme à la sortie du champ
  fields.filter(function (el) { return el.classList.contains('dp-amount'); }).forEach(function (el) {
    el.addEventListener('blur', function () {
      var n = parseMontant(el.value);
      if (!isNaN(n)) el.value = fmtMontant(n);
    });
  });

  var ACTIONS = {
    ajouter: function () {
      mode = 'creation';
      fillForm(VIDE);
      refresh();
      showTab('saisie');
      $('#dp-convention').focus();
    },
    modifier: function () {
      mode = 'modification';
      refresh();
      showTab('saisie');
      $('#dp-code').focus();
    },
    supprimer: function () {
      var dp = dps[selected];
      if (!window.confirm('Supprimer le devis programme ' + dp.code + ' — ' + dp.libelle + ' ?')) return;
      dps.splice(selected, 1);
      selected = dps.length ? Math.min(selected, dps.length - 1) : -1;
      refresh();
      flash('Devis programme ' + dp.code + ' supprimé.');
    },
    enregistrer: function () {
      var dp = readForm();
      if (!validate(dp)) { showTab('saisie'); return; }
      if (mode === 'creation') { dps.push(dp); selected = dps.length - 1; }
      else { dps[selected] = dp; }
      var cree = mode === 'creation';
      mode = 'consultation';
      refresh();
      flash('Devis programme ' + dp.code + (cree ? ' créé.' : ' modifié.'));
    },
    annuler: function () {
      mode = 'consultation';
      refresh();
    }
  };
  $$('[data-dp-action]').forEach(function (b) {
    b.addEventListener('click', function () { if (!b.disabled) ACTIONS[b.dataset.dpAction](); });
  });

  showTab('saisie');
  refresh();
})();
