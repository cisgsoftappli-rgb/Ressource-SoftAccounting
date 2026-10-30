// Écran « Compte de tiers » (captures liste + formulaire « Ajouter un tiers »), données en mémoire.
//
//  Liste       - recherche (code, intitulé, compte collectif), filtres sous-type / statut,
//                tri par colonne, pagination 10 / 20 / 50, indicateurs recalculés.
//  Formulaire  - code, intitulé, sous-type et compte collectif obligatoires ; code unique.
//                Ajouter, Modifier (crayon), Dupliquer vers un nouveau code (code à ressaisir).
//  Intégrité   - un tiers « Utilisé » dans des écritures ne peut pas être supprimé, et son code
//                et son compte collectif ne sont plus modifiables.
//  Liaison     - window.SoftTiers : la saisie d'écritures propose les tiers actifs rattachés au
//                compte collectif choisi, et marque comme utilisés les tiers d'une pièce enregistrée.
(function () {
  var screen = document.querySelector('[data-screen="tiers"]');
  if (!screen) return;
  var L = screen.querySelector('app-parametrage-comptes-tiers');
  var F = screen.querySelector('app-parametrage-compte-tiers-form');
  var NG_L = '_ngcontent-ng-c3418914328';
  var $ = function (s, el) { return el.querySelector(s); };
  var $$ = function (s, el) { return Array.prototype.slice.call(el.querySelectorAll(s)); };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function ng(html, attr) {
    var t = document.createElement('template');
    t.innerHTML = html.trim();
    var n = t.content.firstChild;
    [n].concat($$('*', n)).forEach(function (e) { e.setAttribute(attr, ''); });
    return n;
  }

  var TYPES = { Client: 'Client', Fournisseur: 'Fournisseur', Salarie: 'Salarié', Partenaire: 'Partenaire', Banque: 'Banque', Autre: 'Autre type de tiers' };
  var typeDe = function (libelle) { return Object.keys(TYPES).filter(function (k) { return TYPES[k] === libelle; })[0] || 'Autre'; };

  // Comptes collectifs proposés par le formulaire (« 401000 · Fournisseurs… »)
  var selCollectif = $('[formcontrolname="compteCollectifElementId"]', F);
  var COLLECTIFS = $$('option', selCollectif).filter(function (o) { return !o.disabled; }).map(function (o) {
    var p = o.textContent.split(' · ');
    return { id: o.value, code: p[0].trim(), label: (p[1] || '').trim() };
  });
  var collectifParId = function (id) { return COLLECTIFS.filter(function (c) { return c.id === String(id); })[0]; };

  // Données de départ : les 20 lignes de la capture
  var tbody = $('tbody', L);
  var actionsHtml = tbody.rows[0].cells[8].innerHTML;
  var tiers = Array.prototype.slice.call(tbody.rows).map(function (tr) {
    return {
      code: tr.cells[0].textContent.trim(), nom: tr.cells[1].textContent.trim(),
      type: typeDe($('.type-cell strong', tr).textContent.trim()), collectifId: '',
      actif: !!$('.status.active', tr), utilise: !!$('.used-label', tr),
      collection: 0, debit: 0, credit: 0
    };
  });

  // ---------- Liste ----------
  var fSearch = $('[formcontrolname="search"]', L), fType = $('[formcontrolname="typeTiers"]', L), fStatut = $('[formcontrolname="statut"]', L);
  var pageSize = $('.page-controls select', L), pager = $$('.page-controls button', L), pageLbl = $('.page-controls span', L);
  var cards = $$('.summary-card strong', L);
  var tri = { col: 'code', asc: true }, page = 1;
  pageSize.value = '20';

  var COLS = { 'Code': 'code', 'Intitulé': 'nom', 'Sous-type': 'type', 'Compte collectif': 'collectif', 'Statut': 'actif' };
  var thBtns = $$('thead th button', L);
  function cle(t, col) {
    if (col === 'collectif') { var c = collectifParId(t.collectifId); return c ? c.code : ''; }
    if (col === 'type') return TYPES[t.type];
    if (col === 'actif') return t.actif ? 0 : 1;
    return String(t[col]).toLowerCase();
  }
  function filtres() {
    var q = fSearch.value.trim().toLowerCase();
    return tiers.filter(function (t) {
      var c = collectifParId(t.collectifId);
      var hay = (t.code + ' ' + t.nom + ' ' + (c ? c.code + ' ' + c.label : '')).toLowerCase();
      return (!q || hay.indexOf(q) >= 0) && (!fType.value || t.type === fType.value) &&
        (!fStatut.value || (fStatut.value === 'actif') === t.actif);
    }).sort(function (a, b) {
      var x = cle(a, tri.col), y = cle(b, tri.col);
      return (x < y ? -1 : x > y ? 1 : 0) * (tri.asc ? 1 : -1);
    });
  }
  function ligne(t) {
    var c = collectifParId(t.collectifId), type = TYPES[t.type];
    var tr = ng('<tr>' +
      '<td><strong>' + esc(t.code) + '</strong></td><td>' + esc(t.nom) + '</td>' +
      '<td><div class="type-cell"><span class="type-avatar" data-type="' + t.type + '"> ' + t.type.slice(0, 2).toUpperCase() + ' </span><strong>' + esc(type) + '</strong></div></td>' +
      '<td><div class="account-cell"><strong>' + (c ? esc(c.code) : '') + '</strong><span>' + (c ? esc(c.label) : '') + '</span></div></td>' +
      '<td>' + t.collection.toFixed(2) + '</td><td>' + t.debit.toFixed(2) + '</td><td>' + t.credit.toFixed(2) + '</td>' +
      '<td><div class="status-stack"><span class="status' + (t.actif ? ' active' : '') + '"><i aria-hidden="true"></i>' + (t.actif ? 'Actif' : 'Inactif') + ' </span>' +
      (t.utilise ? '<span title="Ce tiers est utilisé dans des écritures" class="used-label"> 🔒 Utilisé </span>' : '') + '</div></td>' +
      '<td class="row-actions no-print"></td></tr>', NG_L);
    tr.cells[8].innerHTML = actionsHtml;
    var b = $$('button', tr.cells[8]);
    b[0].addEventListener('click', function () { ouvrirForm('modifier', t); });
    b[1].addEventListener('click', function () { ouvrirForm('dupliquer', t); });
    b[2].disabled = t.utilise;
    b[2].title = t.utilise ? 'Tiers utilisé dans des écritures : suppression impossible' : 'Supprimer';
    b[2].addEventListener('click', function () { supprimer(t); });
    return tr;
  }
  function render() {
    var liste = filtres(), n = Number(pageSize.value), pages = Math.max(1, Math.ceil(liste.length / n));
    page = Math.min(page, pages);
    var vue = liste.slice((page - 1) * n, page * n);
    tbody.innerHTML = '';
    vue.forEach(function (t) { tbody.appendChild(ligne(t)); });
    if (!vue.length) tbody.appendChild(ng('<tr><td colspan="9" style="padding:40px;text-align:center;color:#78838c">Aucun tiers ne correspond aux critères.</td></tr>', NG_L));
    cards[0].textContent = liste.length;
    cards[1].textContent = vue.filter(function (t) { return t.actif; }).length;
    cards[2].textContent = vue.filter(function (t) { return t.utilise; }).length;
    var info = $$('.pagination > div:first-child strong', L);
    info[0].textContent = liste.length ? ((page - 1) * n + 1) + '–' + ((page - 1) * n + vue.length) : '0';
    info[1].textContent = liste.length;
    pageLbl.textContent = 'Page ' + page + ' / ' + pages;
    pager[0].disabled = page <= 1;
    pager[1].disabled = page >= pages;
    thBtns.forEach(function (b) {
      var col = COLS[b.childNodes[0].textContent.trim()], fl = $('span', b);
      if (fl) fl.remove();
      if (col === tri.col) b.appendChild(ng('<span>' + (tri.asc ? '↑' : '↓') + '</span>', NG_L));
    });
  }
  thBtns.forEach(function (b) {
    var col = COLS[b.childNodes[0].textContent.trim()];
    b.addEventListener('click', function () { tri = { col: col, asc: tri.col === col ? !tri.asc : true }; render(); });
  });
  [fSearch, fType, fStatut].forEach(function (f) { f.addEventListener('input', function () { page = 1; render(); }); });
  $('.clear-btn', L).addEventListener('click', function () { fSearch.value = ''; fType.value = ''; fStatut.value = ''; page = 1; render(); });
  pageSize.addEventListener('change', function () { page = 1; render(); });
  pager[0].addEventListener('click', function () { page--; render(); });
  pager[1].addEventListener('click', function () { page++; render(); });
  var hdr = $$('.header-actions button', L);
  hdr[0].addEventListener('click', function () { window.print(); });
  hdr[1].addEventListener('click', function () { ouvrirForm('ajouter'); });

  // Suppression : boîte de confirmation (styles .modal-backdrop / .dialog de la capture)
  function supprimer(t) {
    if (t.utilise) return;
    var d = ng('<div class="modal-backdrop"><div class="dialog" role="dialog" aria-modal="true">' +
      '<header><span class="dialog-icon red">!</span><div><span>Suppression</span><h2>Supprimer le tiers ' + esc(t.code) + ' ?</h2></div><button type="button" aria-label="Fermer">×</button></header>' +
      '<p>' + esc(t.nom) + ' sera retiré du référentiel des tiers. Cette action est définitive.</p>' +
      '<footer><button type="button" class="btn secondary">Annuler</button><button type="button" class="btn danger">Supprimer</button></footer></div></div>', NG_L);
    var fermer = function () { d.remove(); };
    $$('header button, .btn.secondary', d).forEach(function (b) { b.addEventListener('click', fermer); });
    d.addEventListener('mousedown', function (e) { if (e.target === d) fermer(); });
    $('.btn.danger', d).addEventListener('click', function () { tiers.splice(tiers.indexOf(t), 1); fermer(); render(); });
    L.appendChild(d);
  }

  // ---------- Formulaire ----------
  var form = $('form', F), h1 = $('h1', F), intro = $('.page-header p', F);
  var champ = function (n) { return $('[formcontrolname="' + n + '"]', form); };
  var COORDS = ['adresse', 'region', 'pays', 'telephone', 'nif', 'stat', 'rcs', 'banque', 'codeBanque', 'codeAgenceBanque',
    'numeroCompteBancaire', 'cleRib', 'swift', 'adresseBanque', 'paysBanque', 'modalitePaiementId', 'siteId'];
  var mode = null, courant = null;
  var note = ng('<div class="integrity-note" style="display:none"><span aria-hidden="true">🔒</span><div><strong>Tiers utilisé dans des écritures</strong>' +
    '<p>Le code et le compte collectif ne peuvent plus être modifiés ; les autres informations restent modifiables.</p></div></div>', '_ngcontent-ng-c1701603028');
  form.insertBefore(note, form.firstChild);

  function erreur(c, msg) {
    var lab = c.closest('label'), s = $('small', lab);
    if (!msg) { if (s) s.remove(); c.style.borderColor = ''; return; }
    if (!s) { s = ng('<small></small>', '_ngcontent-ng-c1701603028'); lab.appendChild(s); }
    s.textContent = msg;
    c.style.borderColor = '#c33d3d';
  }
  function ouvrirForm(m, t) {
    mode = m; courant = t || null;
    form.reset();
    $$('small', form).forEach(function (s) { s.remove(); });
    $$('input, select', form).forEach(function (c) { c.style.borderColor = ''; c.disabled = false; });
    h1.textContent = { ajouter: 'Ajouter un tiers', modifier: 'Modifier le tiers ' + (t && t.code), dupliquer: 'Dupliquer le tiers ' + (t && t.code) }[m];
    intro.textContent = m === 'dupliquer' ? 'Nouveau tiers créé à partir de ' + t.code + ' : saisissez un nouveau code.'
      : 'Code, intitulé, compte collectif, coordonnées et informations bancaires du tiers.';
    selCollectif.value = '0';
    champ('estActif').checked = true;
    if (t) {
      champ('code').value = m === 'dupliquer' ? '' : t.code;
      champ('nom').value = t.nom;
      champ('typeTiers').value = t.type;
      selCollectif.value = t.collectifId || '0';
      champ('estActif').checked = t.actif;
      COORDS.forEach(function (n) { champ(n).value = t[n] || ''; });
    }
    var verrou = m === 'modifier' && t.utilise;
    note.style.display = verrou ? '' : 'none';
    champ('code').disabled = verrou;
    selCollectif.disabled = verrou;
    L.style.display = 'none';
    F.style.display = '';
    var sc = document.querySelector('.softcompta-content-scroll'); if (sc) sc.scrollTop = 0;
    (verrou ? champ('nom') : champ('code')).focus();
  }
  function fermerForm() { F.style.display = 'none'; L.style.display = ''; render(); }
  $('.header-actions button', F).addEventListener('click', fermerForm);
  $('.form-footer .btn.secondary', F).addEventListener('click', fermerForm);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = champ('code').value.trim().toUpperCase(), nom = champ('nom').value.trim();
    var ok = true;
    var autre = function (x) { return x !== courant || mode === 'dupliquer'; };
    var doublon = tiers.some(function (x) { return autre(x) && x.code.toUpperCase() === code; });
    [[champ('code'), !code ? 'Le code est obligatoire.' : doublon ? 'Le code ' + code + ' existe déjà.' : ''],
     [champ('nom'), !nom ? 'L\'intitulé est obligatoire.' : ''],
     [selCollectif, selCollectif.value === '0' || !selCollectif.value ? 'Le compte collectif est obligatoire.' : '']
    ].forEach(function (p) { if (p[0].disabled) return; erreur(p[0], p[1]); if (p[1]) ok = false; });
    if (!ok) return;
    var t = mode === 'modifier' ? courant : { collection: 0, debit: 0, credit: 0, utilise: false };
    if (!champ('code').disabled) t.code = code;
    t.nom = nom;
    t.type = champ('typeTiers').value;
    if (!selCollectif.disabled) t.collectifId = selCollectif.value;
    t.actif = champ('estActif').checked;
    COORDS.forEach(function (n) { t[n] = champ(n).value.trim(); });
    if (mode !== 'modifier') tiers.push(t);
    fSearch.value = mode === 'modifier' ? fSearch.value : '';
    fermerForm();
  });
  $$('input, select', form).forEach(function (c) { c.addEventListener('input', function () { erreur(c, ''); }); });

  // ---------- Liaison avec la saisie d'écritures ----------
  window.SoftTiers = {
    collectifs: function () { return COLLECTIFS.slice(); },
    liste: function () {
      return tiers.map(function (t) {
        var c = collectifParId(t.collectifId);
        return { code: t.code, label: t.nom, collectif: c ? c.code : '', actif: t.actif };
      });
    },
    marquerUtilise: function (code) {
      tiers.forEach(function (t) { if (t.code === code) t.utilise = true; });
      render();
    }
  };
  // Retour à la liste à chaque ouverture de l'écran
  window.addEventListener('hashchange', function () { if (location.hash === '#tiers' && F.style.display !== 'none') fermerForm(); });

  render();
})();
