// Saisie d'écritures › « Facture SoftDocs » : même principe que « Facture OCR », mais les factures sont récupérées dans SoftDocs (factures déjà validées).
// SoftDocs fournit les données analytiques de chaque ligne (activité, poste budgétaire, financement, géographique) : elles sont reprises telles quelles dans l'écriture.
// Les montants déjà rattachés sont mémorisés pour que « Reste disponible » baisse après chaque génération. Données de démonstration (pas de connexion réelle à SoftDocs).
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  var O = window.FACTURE_OCR; if (!O || !O.formulaire) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  var CLE = 'softcompta.softdocs';
  function lu() { try { return JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) { return {}; } }
  function ecrit(o) { try { localStorage.setItem(CLE, JSON.stringify(o)); } catch (e) { /* stockage indisponible */ } }

  var css = document.createElement('style');
  css.textContent = '.sd-t{width:100%;border-collapse:collapse;font-size:13px}.sd-t th{background:#0B4C6F;color:#fff;text-align:left;padding:10px 12px;font:700 11.5px var(--font-sans,sans-serif);text-transform:uppercase;white-space:nowrap}.sd-t th.r,.sd-t td.r{text-align:right}' +
    '.sd-t td{padding:11px 12px;border-bottom:1px solid #E9EBF0}.sd-t tbody tr{cursor:pointer}.sd-t tbody tr:nth-child(even){background:#F8F9FB}.sd-t tbody tr:hover{background:#E9F1FB}.sd-t tbody tr.off{cursor:not-allowed;opacity:.5}.sd-t td.ok{color:#0B7A4B;font-weight:700}' +
    '.sd-fl{display:flex;gap:10px;align-items:center;margin-bottom:12px}.sd-fl input{height:34px;flex:1;border:1px solid #D6D9E0;border-radius:6px;padding:0 10px;font:inherit;font-size:12.5px}.sd-fl small{color:#5B606D;white-space:nowrap}' +
    '.sd-doc{border:1px solid #E9EBF0;border-radius:10px;background:#F8F9FB;padding:14px 16px;font-size:12.5px}.sd-doc h3{margin:0 0 4px;font:700 15px var(--font-heading,Outfit,sans-serif);color:#0B1332}.sd-doc dl{display:grid;grid-template-columns:auto 1fr;gap:4px 12px;margin:10px 0 0}.sd-doc dt{color:#5B606D}.sd-doc dd{margin:0;font-weight:600;color:#353944}.sd-bdg{display:inline-block;padding:2px 8px;border-radius:4px;background:#1E7B4B;color:#fff;font:700 11px var(--font-sans,sans-serif)}';
  document.head.appendChild(css);

  // factures validées dans SoftDocs (démonstration) : fournisseur, lignes (compte de charge et analytique) et montants
  function factures() {
    var T = O.tiersListe(), ch = O.planDetail().filter(function (r) { return /^6/.test(r.code); }), A = window.ECRITURES_AXES || {};
    function ax(i) { var g = function (n) { var l = A[n] || []; return l.length ? l[i % l.length].code : ''; }; return { 'ACTIVITE': g('ACTIVITE'), 'POSTE BUDGETAIRE': g('POSTE BUDGETAIRE'), 'FINANCEMENT': g('FINANCEMENT'), 'GEOGRAPHIQUE': g('GEOGRAPHIQUE') }; }
    function cpt(i) { return ch.length ? ch[i % ch.length].code : ''; }
    function tr(i) { return T.length ? T[i % T.length] : null; }
    var D = [
      { ref: '0011/2026/TANA', titre: 'Fournitures de bureau', date: '2026-09-04', ech: '2026-10-04', L: [['Papeterie et consommables', 14000, 0], ['Petit matériel de bureau', 6000, 1]] },
      { ref: '0009/2026/TANA', titre: 'Documents test', date: '2026-09-11', ech: '2026-10-11', L: [['Impression de documents', 500, 2]] },
      { ref: '0501/2026/01', titre: 'Entretien véhicule', date: '2026-09-18', ech: '2026-10-18', L: [['Entretien et réparation', 160, 3], ['Pièces de rechange', 40, 4]] },
      { ref: '000362/26/20', titre: 'Honoraires septembre 2026', date: '2026-09-30', ech: '2026-10-30', L: [['Honoraires — mission de septembre', 3000000, 5], ['Frais de déplacement', 750000, 6]] }
    ];
    return D.map(function (x, i) {
      var t = tr(i), ht = x.L.reduce(function (s, l) { return s + l[1]; }, 0), tva = Math.round(ht * 20) / 100;
      return { ref: x.ref, titre: x.titre, date: x.date, ech: x.ech, tiers: t, fourn: t ? t.nom : 'Fournisseur', ht: ht, tva: tva, ttc: ht + tva,
        lignes: x.L.map(function (l, k) { return { libelle: l[0], montant: l[1], compte: cpt(l[2]), axes: ax(i * 3 + k + 1) }; }) };
    });
  }
  function rattache(f) { return lu()[f.ref] || 0; }

  function ouvrir() {
    var F = factures(), w = O.fenetre('Facture SoftDocs — factures validées', true, 'files', 'Facture SoftDocs');
    w.b.innerHTML = '<div class="fo-note" style="background:#EEF6FF;border-color:#C9DFF7;color:#1F4A7A">Factures validées dans SoftDocs, avec leurs données analytiques. Choisissez la facture à comptabiliser : elle est proposée en saisie, puis l’écriture est générée dans la pièce.</div>' +
      '<div class="sd-fl"><input type="search" data-sd-q placeholder="Filtrer par référence, titre ou fournisseur"><small data-sd-n></small></div>' +
      '<div style="overflow:auto"><table class="sd-t"><thead><tr><th>Référence</th><th>Titre</th><th>Fournisseur</th><th>Date</th><th class="r">Montant validé</th><th class="r">Montant déjà rattaché</th><th class="r">Reste disponible</th></tr></thead><tbody data-sd-l></tbody></table></div>';
    w.f.innerHTML = '<button type="button" data-fo-x>Fermer</button>';
    w.f.querySelector('[data-fo-x]').addEventListener('click', O.fermer);
    var tb = w.b.querySelector('[data-sd-l]'), q = w.b.querySelector('[data-sd-q]'), n = w.b.querySelector('[data-sd-n]'), vue = [];
    function dessiner() {
      var t = q.value.trim().toLowerCase();
      vue = F.filter(function (f) { return !t || (f.ref + ' ' + f.titre + ' ' + f.fourn).toLowerCase().indexOf(t) >= 0; });
      tb.innerHTML = vue.map(function (f, i) {
        var r = f.ttc - rattache(f);
        return '<tr data-i="' + i + '"' + (r > 0 ? '' : ' class="off" title="Facture entièrement rattachée"') + '><td>' + esc(f.ref) + '</td><td>' + esc(f.titre) + '</td><td>' + esc(f.fourn) + '</td><td>' + esc(f.date.split('-').reverse().join('/')) + '</td><td class="r">' + fmt(f.ttc) + '</td><td class="r">' + fmt(rattache(f)) + '</td><td class="r ok">' + fmt(Math.max(r, 0)) + '</td></tr>';
      }).join('') || '<tr><td colspan="7" style="text-align:center;color:#5B606D">Aucune facture validée.</td></tr>';
      n.textContent = vue.length + ' facture(s)';
    }
    q.addEventListener('input', dessiner);
    tb.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-i]'); if (!tr || tr.classList.contains('off')) return; choisir(vue[+tr.dataset.i]); });
    dessiner();
  }

  function choisir(f) {
    var apercu = '<div class="sd-doc"><span class="sd-bdg">Validée dans SoftDocs</span><h3>' + esc(f.titre) + '</h3><div>' + esc(f.ref) + '</div><dl><dt>Fournisseur</dt><dd>' + esc(f.fourn) + '</dd><dt>Date</dt><dd>' + esc(f.date.split('-').reverse().join('/')) + '</dd><dt>Échéance</dt><dd>' + esc(f.ech.split('-').reverse().join('/')) + '</dd><dt>Montant HT</dt><dd>' + fmt(f.ht) + '</dd><dt>TVA</dt><dd>' + fmt(f.tva) + '</dd><dt>Montant TTC</dt><dd>' + fmt(f.ttc) + '</dd><dt>Lignes</dt><dd>' + f.lignes.length + ' (analytique incluse)</dd></dl></div>';
    var d = { numero: f.ref, date: f.date, echeance: f.ech, fournisseur: f.fourn, taux: 20, ht: f.ht, tva: f.tva, ttc: f.ttc, lignes: f.lignes, brut: '' };
    O.formulaire(d, apercu, null, { titre: 'Saisie à partir de la facture SoftDocs — ' + f.ref, icone: 'files', aria: 'Facture SoftDocs', analytique: true, sansNote: true, autre: 'Choisir une autre facture', autreFn: ouvrir,
      apres: function () { var m = lu(); m[f.ref] = (m[f.ref] || 0) + f.ttc; ecrit(m); } });
  }
  window.FACTURE_SOFTDOCS = { ouvrir: ouvrir };

  // bouton de la barre d'actions (relayé par barre_actions.js)
  var hote = R.querySelector('.entry-import-actions');
  if (hote) { var b = document.createElement('button'); b.type = 'button'; b.className = 'inline-flex min-h-10 items-center'; b.innerHTML = '<i class="ti ti-files" aria-hidden="true"></i> Facture SoftDocs'; b.title = 'Récupérer une facture validée dans SoftDocs (analytique incluse)'; b.addEventListener('click', ouvrir); hote.insertBefore(b, hote.firstChild); }
})();
