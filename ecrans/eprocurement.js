// Connecteur « Soft e-Procurement » (maquette) : source de données simulée + fenêtre de synchronisation partagée.
// Utilisé par Gestion des contrats › Paramétrages › Type de passation (bouton « Synchroniser avec Soft e-Procurement » : référentiel des types de passation)
// et par Gestion des contrats › Saisies › Fiche contrat (même bouton : récupération d'un contrat attribué dans e-Procurement pour préremplir la fiche).
// Même principe que la récupération Soft e-Payment de la liste des banques : la fenêtre liste les éléments d'e-Procurement avec leur situation par rapport à la
// maquette (Nouveau / Mise à jour / À jour / Déjà présent), l'utilisateur coche ce qu'il veut synchroniser, l'écran appelant applique la sélection.
// Les données d'e-Procurement ci-dessous sont FICTIVES (aucun appel réseau). window.EPROCUREMENT.ouvrir(options) :
//   { titre, intro, lignes, colonnes: [{ k, l, mono, r }], cle(ligne), etat(ligne) -> { txt: 'Nouveau' | 'Mise à jour' | 'À jour' | 'Déjà présent', actif: bool },
//     unique: bool (un seul choix, boutons radio), ok: 'libellé du bouton', onValider(sélection[]) }
(function () {
  var TYPES_PASSATION = [
    { code: 'AOI', libelle: "Appel d'offre International", actif: true },
    { code: 'AON', libelle: "Appel d'Offre National", actif: true },
    { code: 'AOR', libelle: "Appel d'offres restreint", actif: true },
    { code: 'AMI', libelle: "Appel à manifestation d'intérêt", actif: true },
    { code: 'CF', libelle: 'Consultation de fournisseurs', actif: true },
    { code: 'DC', libelle: 'Demande de cotation', actif: true },
    { code: 'DP', libelle: 'Demande de Proposition', actif: true },
    { code: 'GG', libelle: 'Gré à gré (entente directe)', actif: true },
    { code: 'SQC', libelle: 'Sélection fondée sur la qualité et le coût', actif: true },
    { code: 'SMC', libelle: 'Sélection au moindre coût', actif: false }
  ];
  // Contrats attribués dans e-Procurement (fictifs). typeMarche / typePassation : libellés ; attributaire : nom du tiers.
  var CONTRATS = [
    { ref: 'MP-2026-001', objet: 'Fourniture de matériel informatique', attributaire: 'FOURNISSEUR A', typeMarche: 'Fournitures', typePassation: 'Appel d’offres ouvert', dateNO: '2026-02-10', dateSign: '2026-03-02', montant: 48000000, devise: 'MGA' },
    { ref: 'MP-2026-003', objet: 'Acquisition de véhicules de service', attributaire: 'FOURNISSEUR B', typeMarche: 'Fournitures', typePassation: 'Appel d’offres ouvert', dateNO: '2026-06-02', dateSign: '2026-06-20', montant: 185000000, devise: 'MGA' },
    { ref: 'MP-2026-004', objet: 'Construction du magasin de stockage', attributaire: 'ENTREPRISE DE TRAVAUX 2', typeMarche: 'Travaux', typePassation: 'Appel d’offres restreint', dateNO: '2026-07-01', dateSign: '2026-07-15', montant: 96000000, devise: 'MGA' },
    { ref: 'MP-2026-005', objet: 'Assistance technique en audit interne', attributaire: 'FOURNISSEUR C', typeMarche: 'Prestations intellectuelles', typePassation: 'Consultation de fournisseurs', dateNO: '', dateSign: '2026-08-03', montant: 24500000, devise: 'MGA' },
    { ref: 'MP-2026-006', objet: 'Maintenance du parc informatique', attributaire: 'FOURNISSEUR A', typeMarche: 'Services courants', typePassation: 'Gré à gré', dateNO: '', dateSign: '2026-09-10', montant: 12000000, devise: 'MGA' },
    { ref: 'MP-2026-007', objet: 'Fourniture de mobilier de bureau', attributaire: 'SOCIÉTÉ HASINA MEUBLES', typeMarche: 'Fournitures', typePassation: 'Consultation de fournisseurs', dateNO: '', dateSign: '2026-10-05', montant: 8300000, devise: 'MGA' }
  ];
  function copie(L) { return JSON.parse(JSON.stringify(L)); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function sans(t) { return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
  function nb(n) { return (Math.round((+n || 0) * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }); }

  var css = document.createElement('style'); css.id = 'epr-css';
  css.textContent = '.epr-voile{z-index:60!important}.epr-dialog{max-width:980px!important}' +
    '.epr-bar{display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin:0 0 12px}.epr-bar input[type=search]{flex:1;min-width:220px;min-height:40px;padding:0 12px;border:1px solid #878D9A;border-radius:8px;font:inherit}' +
    '.epr-info{font-size:12px;color:#5B606D}.epr-conn{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#047857;font-weight:600}.epr-conn::before{content:"";width:8px;height:8px;border-radius:50%;background:#10B981}' +
    '.epr-wrap{max-height:48vh;overflow:auto;border:1px solid #D6D9E0;border-radius:8px}' +
    '.epr-tb{width:100%;border-collapse:collapse;font-size:13px}.epr-tb th{position:sticky;top:0;background:#F5F7F9;text-align:left;padding:8px 10px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#2E427B;white-space:nowrap}' +
    '.epr-tb td{padding:8px 10px;border-top:1px solid #E9EBF0;vertical-align:middle}.epr-tb tr.off td{opacity:.55}.epr-tb .r{text-align:right;white-space:nowrap}.epr-m{font-family:ui-monospace,Consolas,monospace;font-weight:600}' +
    '.epr-st{display:inline-flex;padding:2px 10px;border-radius:999px;font-size:12px;font-weight:600;white-space:nowrap}.epr-st.n{background:#ECFDF5;color:#047857}.epr-st.m{background:#FEF3C7;color:#92400E}.epr-st.a{background:#F1F2F4;color:#5B606D}' +
    '.epr-vide{padding:24px;text-align:center;color:#5B606D}.epr-btn{display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 16px;border:1px solid #D6D9E0;border-radius:8px;background:#fff;color:#18244F;font-weight:600;font-size:14px;cursor:pointer}' +
    '.epr-btn:hover:not(:disabled){background:#F4F7FE;border-color:#2E427B}.epr-btn.p{background:#2E427B;border-color:#2E427B;color:#fff}.epr-btn.p:hover:not(:disabled){background:#243569}.epr-btn:disabled{opacity:.5;cursor:default}';
  document.head.appendChild(css);

  var ov = null, O = null, rsel = {}, extraction = '';
  function construire() {
    ov = document.createElement('div'); ov.className = 'etm-voile epr-voile'; ov.hidden = true; ov.style.display = 'none';
    ov.innerHTML = '<div class="etm-dialog epr-dialog" role="dialog" aria-modal="true" aria-labelledby="epr-t">' +
      '<div class="etm-head"><div class="etm-titre"><span class="etm-icone"><i class="ti ti-cloud-download" aria-hidden="true"></i></span><div><p class="etm-eyebrow">Soft e-Procurement</p><h2 class="etm-h" id="epr-t" data-epr-titre></h2><p class="etm-sub" data-epr-intro></p></div></div>' +
      '<button type="button" class="etm-x" data-epr-x aria-label="Fermer"><i class="ti ti-x" aria-hidden="true"></i></button></div>' +
      '<div class="etm-body"><div class="epr-bar"><span class="epr-conn" data-epr-conn></span><input type="search" data-epr-q placeholder="Rechercher…" aria-label="Rechercher"><span class="epr-info" data-epr-info></span></div>' +
      '<div class="epr-wrap"><table class="epr-tb"><thead data-epr-thead></thead><tbody data-epr-tbody></tbody></table></div></div>' +
      '<div class="etm-foot"><span class="epr-info" data-epr-note></span><div class="etm-droite"><button type="button" class="epr-btn" data-epr-annuler>Annuler</button><button type="button" class="epr-btn p" data-epr-ok><i class="ti ti-refresh" aria-hidden="true"></i> <span data-epr-oklib></span></button></div></div></div>';
    document.body.appendChild(ov);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-epr-x]') || e.target.closest('[data-epr-annuler]')) { fermer(); return; }
      if (e.target.closest('[data-epr-ok]') && !ov.querySelector('[data-epr-ok]').disabled) valider();
    });
    ov.addEventListener('input', function (e) { if (e.target.matches('[data-epr-q]')) rendre(); });
    ov.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-epr-k]')) { if (O.unique) rsel = {}; rsel[t.dataset.eprK] = t.checked; rendre(); }
      else if (t.matches('[data-epr-all]')) { filtre().forEach(function (x) { if (x.actif) rsel[x.cle] = t.checked; }); rendre(); }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && ov && !ov.hidden) fermer(); });
  }
  function filtre() {
    var t = sans(ov.querySelector('[data-epr-q]').value);
    return O.lignes.map(function (l) { var e = O.etat(l) || {}; return { l: l, cle: O.cle(l), txt: e.txt || '', actif: e.actif !== false }; }).filter(function (x) {
      return !t || sans(O.colonnes.map(function (c) { return x.l[c.k]; }).join(' ') + ' ' + x.txt).indexOf(t) >= 0;
    });
  }
  function rendre() {
    var L = filtre(), nbSel = Object.keys(rsel).filter(function (k) { return rsel[k]; }).length, cls = { 'Nouveau': 'n', 'Mise à jour': 'm' };
    ov.querySelector('[data-epr-thead]').innerHTML = '<tr><th style="width:36px">' + (O.unique ? '' : '<input type="checkbox" data-epr-all aria-label="Tout sélectionner">') + '</th>' + O.colonnes.map(function (c) { return '<th' + (c.r ? ' class="r"' : '') + '>' + esc(c.l) + '</th>'; }).join('') + '<th>Situation</th></tr>';
    ov.querySelector('[data-epr-tbody]').innerHTML = L.length ? L.map(function (x) {
      return '<tr' + (x.actif ? '' : ' class="off"') + '><td><input type="' + (O.unique ? 'radio' : 'checkbox') + '" name="epr-sel" data-epr-k="' + esc(x.cle) + '"' + (rsel[x.cle] ? ' checked' : '') + (x.actif ? '' : ' disabled') + ' aria-label="Sélectionner"></td>' +
        O.colonnes.map(function (c) { var v = x.l[c.k]; if (c.fmt === 'montant') v = nb(v) + ' ' + (x.l.devise || ''); else if (c.fmt === 'date') v = v ? String(v).split('-').reverse().join('/') : '—'; return '<td class="' + (c.r ? 'r ' : '') + (c.mono ? 'epr-m' : '') + '">' + esc(v == null || v === '' ? '—' : v) + '</td>'; }).join('') +
        '<td><span class="epr-st ' + (cls[x.txt] || 'a') + '">' + esc(x.txt) + '</span></td></tr>';
    }).join('') : '<tr><td colspan="' + (O.colonnes.length + 2) + '" class="epr-vide">Aucun élément ne correspond à la recherche.</td></tr>';
    ov.querySelector('[data-epr-info]').textContent = L.length + ' élément(s) affiché(s) sur ' + O.lignes.length + ' — ' + nbSel + ' sélectionné(s)';
    var ok = ov.querySelector('[data-epr-ok]'); ok.disabled = !nbSel; ov.querySelector('[data-epr-oklib]').textContent = O.ok + (nbSel && !O.unique ? ' (' + nbSel + ')' : '');
    var all = ov.querySelector('[data-epr-all]'); if (all) all.checked = L.length > 0 && L.every(function (x) { return !x.actif || rsel[x.cle]; });
  }
  function fermer() { if (ov) { ov.hidden = true; ov.style.display = 'none'; } }
  function valider() {
    var S = O.lignes.filter(function (l) { return rsel[O.cle(l)]; }); if (!S.length) return;
    fermer(); O.onValider(S);
  }
  function ouvrir(o) {
    if (!ov) construire(); O = o; rsel = {};
    var n = new Date(); extraction = n.toLocaleDateString('fr-FR') + ' à ' + n.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    ov.querySelector('[data-epr-titre]').textContent = o.titre; ov.querySelector('[data-epr-intro]').textContent = o.intro || '';
    ov.querySelector('[data-epr-conn]').textContent = 'Connecté à Soft e-Procurement — extraction du ' + extraction;
    ov.querySelector('[data-epr-q]').value = ''; ov.querySelector('[data-epr-note]').textContent = o.note || '';
    ov.hidden = false; ov.style.display = ''; rendre();
    var q = ov.querySelector('[data-epr-q]'); setTimeout(function () { q.focus(); }, 0);
  }

  window.EPROCUREMENT = {
    nom: 'Soft e-Procurement',
    typesPassation: function () { return copie(TYPES_PASSATION); },
    contrats: function () { return copie(CONTRATS); },
    ouvrir: ouvrir
  };
})();
