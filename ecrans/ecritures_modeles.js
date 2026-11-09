// Saisie d'écritures › « Modèle d'écriture » : reprise d'un modèle prédéfini. La fenêtre reprend la saisie par modèle classique : modèle, journal (imposé par le modèle),
// date comptable, date pièce, numéro de pièce proposé, libellés au débit et au crédit, montant dans chaque monnaie (cours proposés selon la date) ; « Générer l'écriture »
// renseigne l'en-tête et ajoute les deux lignes (compte débité / compte crédité) à la pièce. Modèles de démonstration : window.MODELES_ECRITURE (à remplacer par le futur
// écran « Modèles d'écriture » des paramétrages comptables).
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  var O = window.FACTURE_OCR; if (!O || !O.fenetre) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(s) { var n = parseFloat(String(s || '').replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function c(n) { return R.querySelector('[formcontrolname="' + n + '"]'); }
  function aujourdhui() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }

  // modèles prédéfinis : compte débité (D), compte crédité (C), journal et libellés ; tiers = collectif exigeant un tiers (côté indiqué)
  window.MODELES_ECRITURE = window.MODELES_ECRITURE || [
    { code: 'FRAIS-BQ', libelle: 'Frais et commissions bancaires', journal: '01IDMGA', D: '627400', C: '512102', libD: 'Commission bancaire du mois', libC: 'Commission bancaire du mois' },
    { code: 'APPRO-CAISSE', libelle: 'Approvisionnement de la caisse par la banque', journal: '01CAISSE', D: '531100', C: '512102', libD: 'Alimentation de la caisse', libC: 'Retrait bancaire pour alimentation de la caisse' },
    { code: 'TEL-CAISSE', libelle: 'Redevances téléphoniques payées en caisse', journal: '01CAISSE', D: '620300', C: '531100', libD: 'Redevance téléphone mobile', libC: 'Paiement caisse redevance téléphone' },
    { code: 'VENTE-DIV', libelle: 'Vente diverse encaissée en banque', journal: '01IDMGA', D: '512102', C: '708800', libD: 'Encaissement vente diverse', libC: 'Vente diverse' },
    { code: 'REGL-FOURN', libelle: 'Règlement d\'un fournisseur par la banque', journal: '01IDMGA', D: '401100', C: '512102', libD: 'Règlement fournisseur', libC: 'Règlement fournisseur', tiers: 'D' }
  ];
  function compteDe(code) { var l = (window.ECRITURES_REF && window.ECRITURES_REF.comptes) || [], x = l.filter(function (r) { return r.code === code; })[0]; return x ? { code: x.code, label: x.label, collectif: !!x.collectif } : { code: code, label: '' }; }
  function journalOk(code) { var J = (window.ECRITURES_REF && window.ECRITURES_REF.journaux) || []; return J.filter(function (j) { return j.code === code; })[0] ? code : ((window.__ecEntete && window.__ecEntete.journalCourant && window.__ecEntete.journalCourant()) || (J[0] || {}).code || ''); }
  function monnaies() { return (window.ENTITE_MONNAIES && window.ENTITE_MONNAIES()) || { m1: 'MGA', m2: 'USD', m3: '' }; }
  function cours(dev, date) { return dev && window.COURS_API && window.COURS_API.taux ? (window.COURS_API.taux(dev, date) || 0) : 0; }

  var AXNOM = ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE', 'NATURE', 'CATEGORIE DE DEPENSE', 'Plan 7', 'Plan 8', 'Plan 9', 'Plan 10'];
  function r2(v) { return Math.round(v * 100) / 100; }
  function regrInfo() { return window.REGROUPEMENT && window.REGROUPEMENT(); }
  function axesActifs() { var act = window.PLANS_ACTIFS ? window.PLANS_ACTIFS() : []; return AXNOM.map(function (n, i) { return { nom: n, code: 'PLAN' + (i + 1), cle: 'p' + (i + 1) }; }).filter(function (a) { return act.indexOf(a.code) >= 0 && ((window.ECRITURES_AXES || {})[a.nom] || []).length; }); }
  function abrevAxe(a) { var cfg = (window.PLANS_CFG || []).filter(function (p) { return p.code === a.code; })[0]; return (cfg && cfg.abrev) || a.nom.slice(0, 3); }
  function opt(list, cur, vide) { return '<option value="">' + esc(vide) + '</option>' + list.map(function (v) { return '<option value="' + esc(v[0]) + '"' + (v[0] === cur ? ' selected' : '') + '>' + esc(v[1]) + '</option>'; }).join(''); }
  function contratsListe() { return ((window.ECRITURES_REF && window.ECRITURES_REF.contrats) || []).map(function (x) { return [x.code, x.code + ' — ' + x.label]; }); }
  function tiersListe(col) { return (window.TIERS_PLAN || []).filter(function (t) { return t.actif !== false && t.compte === col; }).slice(0, 500).map(function (t) { return [t.code, t.code + ' — ' + t.nom]; }); }
  function lignesModele(m) {
    if (m.lignes && m.lignes.length) return m.lignes;
    return [{ sens: 'D', compte: m.D, libelle: m.libD, montantVar: m.montantVar !== false, montant: m.montantFixe || '', pct: 100, tiersVar: m.tiers === 'D' && m.tiersVar !== false, tiers: m.tiers === 'D' && m.tiersVar === false ? (m.tiersFixe || '') : '', anaVar: true, ana: {} },
      { sens: 'C', compte: m.C, libelle: m.libC, montantVar: m.montantVar !== false, montant: m.montantFixe || '', pct: 100, tiersVar: m.tiers === 'C' && m.tiersVar !== false, tiers: m.tiers === 'C' && m.tiersVar === false ? (m.tiersFixe || '') : '', anaVar: true, ana: {} }];
  }

  function ouvrir() {
    var M = window.MODELES_ECRITURE, mn = monnaies(), A = window.__ecEntete;
    var w = O.fenetre('Écriture à partir d\'un modèle', true, 'template', 'Modèle d\'écriture');
    w.b.closest('.fo-md').style.width = 'min(1240px,100%)';
    var dEcr = (c('dateEcriture') && c('dateEcriture').value) || aujourdhui(), dPie = (c('datePiece') && c('datePiece').value) || dEcr, G = regrInfo();
    w.b.innerHTML = '<div class="fo-fl"><label class="w">Modèle<select class="fo-in" data-mo="modele"><option value="">— Sélectionner un modèle —</option>' + M.map(function (m) { return '<option value="' + esc(m.code) + '">' + esc(m.code + ' — ' + m.libelle) + '</option>'; }).join('') + '</select></label>' +
      '<label class="w">Journal<select class="fo-in" data-mo="journal" disabled><option value="">—</option></select></label>' +
      '<label>Date comptable<input class="fo-in" type="date" data-mo="date" value="' + esc(dEcr) + '"></label><label>Date pièce<input class="fo-in" type="date" data-mo="datep" value="' + esc(dPie) + '"></label>' +
      '<label>Numéro de pièce<input class="fo-in" data-mo="piece" readonly placeholder="Proposé par la saisie" style="background:#F1F2F5"></label><label data-mo-tiers hidden>Tiers<select class="fo-in" data-mo="tiers"></select></label>' +
      '<label>Contrat<select class="fo-in" data-mo="contrat" data-combo data-combo-cols="Code|Libellé">' + opt(contratsListe(), '', 'Sélectionner un contrat') + '</select></label>' +
      (G && G.elements ? '<label><span>Regroupement <b style="color:#C0182B">*</b></span><select class="fo-in" data-mo="regr" data-combo data-combo-cols="Code|Libellé">' + opt(G.elements.map(function (e) { return [String(e.code), e.code + ' — ' + (e.libelle || '')]; }), '', 'Sélectionner un élément') + '</select></label>' : '') +
      '<label class="w">Libellé au débit<input class="fo-in" data-mo="libD"></label><label class="w">Libellé au crédit<input class="fo-in" data-mo="libC"></label>' +
      '<label>Montant en <b>' + esc(mn.m1) + '</b><input class="fo-in r" data-mo="m1" inputmode="decimal" placeholder="0,00"></label>' +
      (mn.m2 ? '<label>Cours Rap. <b>' + esc(mn.m2) + '</b><input class="fo-in r" data-mo="k2" inputmode="decimal"></label><label>Montant Rap. <b>' + esc(mn.m2) + '</b><input class="fo-in r" data-mo="m2" readonly style="background:#F1F2F5"></label>' : '') +
      (mn.m3 ? '<label>Cours Rap. <b>' + esc(mn.m3) + '</b><input class="fo-in r" data-mo="k3" inputmode="decimal"></label><label>Montant Rap. <b>' + esc(mn.m3) + '</b><input class="fo-in r" data-mo="m3" readonly style="background:#F1F2F5"></label>' : '') + '</div>' +
      '<div class="fo-sec">Aperçu des imputations comptables et analytiques <span style="font-weight:400;text-transform:none;letter-spacing:0;color:#5B606D">(modifiable)</span></div><div data-mo-sch style="font-size:12.5px;color:#5B606D;overflow:auto">Sélectionnez un modèle.</div><div data-mo-tot style="margin:8px 0 0;font-size:12.5px"></div><div data-mo-er class="fo-ko"></div>';
    w.f.innerHTML = '<button type="button" data-fo-x>Annuler</button><button type="button" class="p" data-mo-ok disabled><i class="ti ti-pencil"></i> Préremplir la saisie</button>';
    var Q = function (s) { return w.b.querySelector(s); }, F = function (k) { return Q('[data-mo="' + k + '"]'); }, cur = null, rows = [], AX = axesActifs();
    var st = document.createElement('style'); st.textContent = '.mo-t input,.mo-t select{width:100%;min-width:90px;box-sizing:border-box;height:32px;border:1px solid #D6D9E0;border-radius:6px;padding:0 6px;font:inherit;font-size:12px;background:#fff}.mo-t input.r{text-align:right;min-width:100px}.mo-t td{padding:4px 5px;vertical-align:middle}.mo-t input.bad,.mo-t select.bad{border-color:#C0182B}.mo-t .na{color:#8A8F9C;text-align:center}'; w.b.appendChild(st);

    function construire() {
      rows = cur ? lignesModele(cur).map(function (l) {
        var ax = {}; if (l.anaVar === false && l.ana) Object.keys(l.ana).forEach(function (k) { var i = parseInt(String(k).replace(/\D/g, ''), 10); if (i >= 1 && i <= 10 && AXNOM[i - 1]) ax[AXNOM[i - 1]] = l.ana[k]; });
        var sens = l.sens === 'C' || l.sens === 'CREDIT' ? 'CREDIT' : 'DEBIT';
        return { sens: sens, compte: l.compte, libelle: l.libelle || (sens === 'DEBIT' ? cur.libD : cur.libC) || '', tiers: l.tiersVar ? '' : (l.tiers || ''), tiersVar: !!l.tiersVar, axes: ax, montantVar: l.montantVar !== false, pct: l.pct === '' || l.pct == null ? 100 : +l.pct, fixe: +l.montant || 0, montant: 0, edited: false, contrat: '', regr: '' };
      }) : [];
      appliquerEntete(true); recalc(); schema();
    }
    function appliquerEntete(tout) {
      var ct = F('contrat') ? F('contrat').value : '', rg = F('regr') ? F('regr').value : '', th = F('tiers').value;
      rows.forEach(function (r) { r.contrat = ct; r.regr = rg; if (r.tiersVar && th && !r.tiersEdit) r.tiers = th; });
    }
    function recalc() { var m = num(F('m1').value); rows.forEach(function (r) { if (!r.edited) r.montant = r.montantVar ? r2(m * r.pct / 100) : r.fixe; }); }
    function totaux() {
      var d = 0, cr = 0, parC = {}; rows.forEach(function (r) { if (r.sens === 'DEBIT') d += r.montant; else cr += r.montant; if (r.contrat) { parC[r.contrat] = parC[r.contrat] || 0; parC[r.contrat] += r.sens === 'DEBIT' ? r.montant : -r.montant; } });
      var ec = r2(d - cr), ko = Object.keys(parC).filter(function (k) { return r2(parC[k]) !== 0; });
      Q('[data-mo-tot]').innerHTML = rows.length ? '<b>Total</b> · Débit ' + fmt(d) + ' · Crédit ' + fmt(cr) + ' · <span style="color:' + (ec ? '#C0182B' : '#136C34') + ';font-weight:600">' + (ec ? 'Écart ' + fmt(Math.abs(ec)) : 'Équilibré') + '</span>' + (ko.length ? ' · <span style="color:#C0182B;font-weight:600">Contrat à équilibrer : ' + ko.map(esc).join(', ') + '</span>' : '') : '';
      w.f.querySelector('[data-mo-ok]').disabled = !(rows.length && d > 0 && !ec && !ko.length);
      return { d: d, c: cr, ec: ec, ko: ko };
    }
    function conv() {
      var m = num(F('m1').value);
      [['m2', 'k2'], ['m3', 'k3']].forEach(function (x) { if (F(x[0])) { var k = num(F(x[1]).value); F(x[0]).value = m > 0 && k > 0 ? fmt(r2(m / k)) : ''; } });
      recalc(); schema();
    }
    function schema() {
      if (!cur) { Q('[data-mo-sch]').textContent = 'Sélectionnez un modèle.'; Q('[data-mo-tot]').innerHTML = ''; w.f.querySelector('[data-mo-ok]').disabled = true; return; }
      var comptes = (window.ECRITURES_REF && window.ECRITURES_REF.comptes) || [], G2 = regrInfo(), co = {};
      var optCpt = function (cur0) { return '<option value="">— Compte —</option>' + comptes.map(function (x) { return '<option value="' + esc(x.code) + '"' + (x.code === cur0 ? ' selected' : '') + '>' + esc(x.code + ' — ' + x.label) + '</option>'; }).join(''); };
      Q('[data-mo-sch]').innerHTML = '<table class="fo-t mo-t"><thead><tr><th>Compte</th><th>Libellé</th><th>Tiers</th>' + AX.map(function (a) { return '<th>' + esc(abrevAxe(a)) + '</th>'; }).join('') + '<th>Contrat</th>' + (G2 ? '<th>Regroupement</th>' : '') + '<th style="text-align:right">Débit</th><th style="text-align:right">Crédit</th></tr></thead><tbody>' +
        rows.map(function (r, i) {
          var cp = compteDe(r.compte), col = !!cp.collectif;
          return '<tr data-i="' + i + '"><td><select data-c="compte">' + optCpt(r.compte) + '</select></td>' +
            '<td><input data-c="libelle" value="' + esc(r.libelle) + '"></td>' +
            '<td>' + (col ? '<select data-c="tiers">' + opt(tiersListe(r.compte), r.tiers, 'Sélectionner un tiers') + '</select>' : '<div class="na">Non applicable</div>') + '</td>' +
            AX.map(function (a) { return '<td><select data-c="ax" data-n="' + esc(a.nom) + '">' + opt(((window.ECRITURES_AXES || {})[a.nom] || []).map(function (x) { return [x.code, x.code + ' — ' + x.label]; }), r.axes[a.nom] || '', 'Sélectionner') + '</select></td>'; }).join('') +
            '<td><select data-c="contrat">' + opt(contratsListe(), r.contrat, '—') + '</select></td>' +
            (G2 ? '<td><select data-c="regr">' + opt((G2.elements || []).map(function (e) { return [String(e.code), e.code + ' — ' + (e.libelle || '')]; }), r.regr, '—') + '</select></td>' : '') +
            '<td>' + (r.sens === 'DEBIT' ? '<input class="r" data-c="montant" inputmode="decimal" value="' + (r.montant ? fmt(r.montant) : '') + '">' : '') + '</td>' +
            '<td>' + (r.sens === 'CREDIT' ? '<input class="r" data-c="montant" inputmode="decimal" value="' + (r.montant ? fmt(r.montant) : '') + '">' : '') + '</td></tr>';
        }).join('') + '</tbody></table>';
      totaux();
    }
    // modifications dans l'aperçu : l'état suit les champs sans redessiner (sauf changement de compte)
    Q('[data-mo-sch]').addEventListener('input', function (e) {
      var tr = e.target.closest('tr[data-i]'); if (!tr) return; var r = rows[+tr.dataset.i], k = e.target.dataset.c;
      if (k === 'libelle') r.libelle = e.target.value; else if (k === 'montant') { r.montant = num(e.target.value); r.edited = true; totaux(); }
    });
    Q('[data-mo-sch]').addEventListener('change', function (e) {
      var tr = e.target.closest('tr[data-i]'); if (!tr) return; var r = rows[+tr.dataset.i], k = e.target.dataset.c, v = e.target.value;
      if (k === 'compte') { r.compte = v; r.tiers = ''; schema(); }
      else if (k === 'tiers') { r.tiers = v; r.tiersEdit = true; } else if (k === 'ax') { r.axes[e.target.dataset.n] = v; }
      else if (k === 'contrat') { r.contrat = v; totaux(); } else if (k === 'regr') { r.regr = v; }
      else if (k === 'montant') { r.montant = num(v); r.edited = true; e.target.value = r.montant ? fmt(r.montant) : ''; totaux(); }
    });
    F('modele').addEventListener('change', function () {
      cur = M.filter(function (x) { return x.code === F('modele').value; })[0] || null;
      var J = (window.ECRITURES_REF && window.ECRITURES_REF.journaux) || [], jc = cur ? journalOk(cur.journal) : '';
      F('journal').innerHTML = cur ? J.map(function (j) { return '<option value="' + esc(j.code) + '"' + (j.code === jc ? ' selected' : '') + '>' + esc(j.code + (j.label ? ' — ' + j.label : '')) + '</option>'; }).join('') : '<option value="">—</option>';
      F('libD').value = cur ? cur.libD || '' : ''; F('libC').value = cur ? cur.libC || '' : '';
      var tv = cur ? lignesModele(cur).filter(function (l) { return l.tiersVar; })[0] : null, lt = Q('[data-mo-tiers]'); lt.hidden = !tv;
      if (tv) { F('tiers').innerHTML = '<option value="">— Sélectionner —</option>' + tiersListe(tv.compte).map(function (t) { return '<option value="' + esc(t[0]) + '">' + esc(t[1]) + '</option>'; }).join(''); } else F('tiers').innerHTML = '';
      var mv = cur && lignesModele(cur).every(function (l) { return l.montantVar === false; });
      F('m1').readOnly = !!mv; if (mv) F('m1').value = fmt(lignesModele(cur).filter(function (l) { return l.sens === 'D'; }).reduce(function (a, l) { return a + (+l.montant || 0); }, 0));
      construire(); majCours();
    });
    function majCours() { [['k2', mn.m2], ['k3', mn.m3]].forEach(function (x) { if (F(x[0])) { var k = cours(x[1], F('date').value); F(x[0]).value = k ? String(k).replace('.', ',') : ''; } }); conv(); }
    ['date', 'm1', 'k2', 'k3'].forEach(function (k) { if (F(k)) { F(k).addEventListener('input', k === 'date' ? majCours : conv); F(k).addEventListener('change', k === 'm1' ? function () { F('m1').value = num(F('m1').value) ? fmt(num(F('m1').value)) : ''; conv(); } : (k === 'date' ? majCours : conv)); } });
    // contrat, regroupement, tiers de l'en-tête : valeurs proposées à toutes les lignes (modifiables ensuite dans l'aperçu)
    ['contrat', 'regr', 'tiers'].forEach(function (k) { if (F(k)) F(k).addEventListener('change', function () { appliquerEntete(); schema(); }); });
    [['libD', 'DEBIT'], ['libC', 'CREDIT']].forEach(function (x) { F(x[0]).addEventListener('input', function () { rows.forEach(function (r) { if (r.sens === x[1]) r.libelle = F(x[0]).value; }); schema(); }); });
    w.f.querySelector('[data-fo-x]').addEventListener('click', O.fermer);
    w.f.querySelector('[data-mo-ok]').addEventListener('click', function () {
      var er = [], G3 = regrInfo(); if (!F('date').value) er.push('la date comptable');
      rows.forEach(function (r, i) {
        var n = i + 1; if (!r.compte) er.push('le compte de la ligne ' + n); if (!String(r.libelle).trim()) er.push('le libellé de la ligne ' + n);
        if (compteDe(r.compte).collectif && !r.tiers) er.push('le tiers de la ligne ' + n); if (G3 && !r.regr) er.push('le regroupement de la ligne ' + n);
      });
      if (er.length) { Q('[data-mo-er]').textContent = 'Complétez : ' + er.join(', ') + '.'; return; }
      var t = totaux(); if (t.ec || t.ko.length) { Q('[data-mo-er]').textContent = t.ec ? 'Le débit et le crédit doivent être équilibrés.' : 'Le contrat doit être équilibré (débit = crédit).'; return; }
      if (generer()) O.fermer();
    });
    function generer() {
      if (!A || !A.ajouterLignes) { alert('Saisie d\'écritures indisponible.'); return false; }
      var k2 = F('k2') ? num(F('k2').value) : 0, k3 = F('k3') ? num(F('k3').value) : 0;
      A.rouvrirEntete(false); if (A.setJournal) A.setJournal(F('journal').value);
      function poser(i, v) { if (!i) return; i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }
      poser(c('datePiece'), F('datep').value || F('date').value); poser(c('dateEcriture'), F('date').value);
      window.__ecSansTreso = true; var ouvert = A.ouvrirLignes(); window.__ecSansTreso = false;
      if (!ouvert) { Q('[data-mo-er]').textContent = 'La date comptable est hors de l\'exercice ou de la période ouverte : corrigez-la.'; return false; }
      var CT = (window.ECRITURES_REF && window.ECRITURES_REF.contrats) || [];
      A.ajouterLignes(rows.map(function (r) {
        var cp = compteDe(r.compte), t = r.tiers ? (window.TIERS_PLAN || []).filter(function (x) { return x.code === r.tiers; })[0] : null, ct = r.contrat ? CT.filter(function (x) { return x.code === r.contrat; })[0] : null, ax = {};
        Object.keys(r.axes).forEach(function (n) { if (r.axes[n]) ax[n] = r.axes[n]; });
        return { compte: cp, tiers: t ? { code: t.code, label: t.nom, collectif: t.compte } : null, contrat: ct ? { code: ct.code, label: ct.label } : null, regr: r.regr || '', libelle: String(r.libelle).trim(), montant: r.montant, sens: r.sens, echeance: '', axes: ax, montant1: k2 > 0 ? r2(r.montant / k2) : 0, montant2: k3 > 0 ? r2(r.montant / k3) : 0 };
      }), 'Saisie préremplie depuis le modèle « ' + cur.code + ' » : vérifiez les lignes, complétez si besoin puis validez la pièce.');
      return true;
    }
    majCours();
  }
  window.ECRITURES_MODELES = { ouvrir: ouvrir };

  // bouton de la barre d'actions (relayé par barre_actions.js)
  var hote = R.querySelector('.entry-import-actions');
  if (hote) { var b = document.createElement('button'); b.type = 'button'; b.className = 'inline-flex min-h-10 items-center'; b.innerHTML = '<i class="ti ti-template" aria-hidden="true"></i> Modèle d\'écriture'; b.title = 'Reprendre un modèle d\'écriture prédéfini'; b.addEventListener('click', ouvrir); hote.insertBefore(b, hote.firstChild); }
})();
