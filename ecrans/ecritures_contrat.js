// Saisie d'écritures › choix d'un contrat : le système demande s'il faut reprendre les imputations du marché.
//  - Oui : saisie du pourcentage à facturer (plafonné par la part du marché pas encore facturée) ; les lignes de charge du marché (compte, axes, budget, contrat)
//          sont reprises au prorata du pourcentage et ajoutées à la pièce, à compléter puis valider (préremplissage, pas de génération directe).
//  - Non : saisie normale, le contrat reste simplement porté par les lignes saisies.
// Données : contrats de « Fiche contrat » (window.CONTRATS : lignes de ventilation, facturé simulé comme dans Suivi des contrats) + marchés d'exemple de la saisie ;
// les montants déjà repris ici viennent s'ajouter au facturé (mémorisés dans softcompta.contratFacture).
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  var O = window.FACTURE_OCR; if (!O || !O.fenetre) return;
  var REF = window.ECRITURES_REF || {}; REF.contrats = REF.contrats || [];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function num(s) { var n = parseFloat(String(s || '').replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function r2(v) { return Math.round(v * 100) / 100; }
  function c(n) { return R.querySelector('[formcontrolname="' + n + '"]'); }
  var CLE = 'softcompta.contratFacture', extra = {};
  try { extra = JSON.parse(localStorage.getItem(CLE) || '{}') || {}; } catch (e) {}
  function sauve() { try { localStorage.setItem(CLE, JSON.stringify(extra)); } catch (e) {} }
  function hash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000; return h / 1000; }
  var AXE = { PLAN1: 'ACTIVITE', PLAN2: 'POSTE BUDGETAIRE', PLAN3: 'FINANCEMENT', PLAN4: 'GEOGRAPHIQUE' };
  var AX0 = { 'ACTIVITE': '110305', 'POSTE BUDGETAIRE': '23175', 'FINANCEMENT': 'FFAMCR', 'GEOGRAPHIQUE': 'MSAN014' }, AX1 = { 'ACTIVITE': '110401', 'POSTE BUDGETAIRE': '24240', 'FINANCEMENT': 'FFE10BIE', 'GEOGRAPHIQUE': 'MSAN015' };
  // marchés d'exemple de la saisie (codes MAR-…)
  var DEMO = {
    'MAR-2026-014': { montant: 120000000, fact: .35, lignes: [{ lib: 'Gros œuvre', compte: '606300', axes: AX0, budget: 'BUD-02', part: .7 }, { lib: 'Finitions', compte: '624400', axes: AX1, budget: 'BUD-02', part: .3 }] },
    'MAR-2026-021': { montant: 48000000, fact: .5, lignes: [{ lib: 'Fourniture de matériel informatique', compte: '606300', axes: AX0, budget: 'BUD-01', part: 1 }] },
    'MAR-2026-033': { montant: 36000000, fact: .2, lignes: [{ lib: 'Prestation logistique', compte: '624400', axes: AX1, budget: 'BUD-01', part: .6 }, { lib: 'Frais de déplacement', compte: '606300', axes: AX0, budget: 'BUD-01', part: .4 }] }
  };
  function reel(code) { return (window.CONTRATS || []).filter(function (x) { return x.num === code; })[0] || null; }
  // marchés réels de « Fiche contrat » proposés aussi dans la liste de la saisie
  function sync() { (window.CONTRATS || []).forEach(function (x) { if (!REF.contrats.some(function (y) { return y.code === x.num; })) REF.contrats.push({ code: x.num, label: x.designation }); }); }
  sync(); window.addEventListener('contrats-changed', sync); setTimeout(sync, 1500);
  function donnees(code) {
    var x = reel(code);
    if (x) {
      var vent = x.vent || [], tot = vent.reduce(function (a, v) { return a + (Number((v.mt || {}).MGA) || 0); }, 0), r = hash(x.num);
      return { montant: tot, fact: .3 + r * .6, lignes: vent.map(function (v) { var ax = {}; Object.keys(v.ana || {}).forEach(function (k) { if (AXE[k] && v.ana[k]) ax[AXE[k]] = v.ana[k]; }); return { lib: v.desc || x.designation, compte: v.pcg || '', axes: ax, budget: '', part: tot > 0 ? (Number((v.mt || {}).MGA) || 0) / tot : 1 / Math.max(1, vent.length) }; }) };
    }
    return DEMO[code] || null;
  }
  function etatMarche(code) {
    var d = donnees(code); if (!d) return null;
    var fact = Math.round(d.montant * d.fact) + (extra[code] || 0), dispo = Math.max(0, d.montant - fact);
    return { d: d, montant: d.montant, fact: fact, dispo: dispo, pctDispo: d.montant > 0 ? dispo / d.montant * 100 : 0 };
  }
  function compteDe(code) { var l = REF.comptes || [], x = l.filter(function (r) { return r.code === code; })[0]; return x ? { code: x.code, label: x.label } : { code: code, label: '' }; }

  // ----- attributaire (tiers du marché) et comptes -----
  function tiersTous() { return (O.tiersListe && O.tiersListe()) || []; }
  function attributaire(code) {
    var x = reel(code), T = tiersTous();
    if (x && x.tiers) { var t = T.filter(function (y) { return y.code === x.tiers && (!x.compteTiers || y.compte === x.compteTiers); })[0]; return t || { code: x.tiers, nom: x.tiers, compte: x.compteTiers || '401000' }; }
    var F = T.filter(function (y) { return /^401/.test(y.compte); }); if (F.length) return F[Math.floor(hash(code) * F.length) % F.length];
    var R = (REF.tiers || []).filter(function (y) { return /^40/.test(y.collectif); })[0]; return R ? { code: R.code, nom: R.label, compte: R.collectif } : { code: '', nom: '', compte: '401000' };
  }
  function plan(re) {
    var pc = window.PLAN_COMPTABLE || [], P = {}; pc.forEach(function (r) { if (r.parent) P[r.parent] = 1; });
    var l = pc.filter(function (r) { return r.actif !== false && !P[r.code] && re.test(r.code); }).map(function (r) { return { code: r.code, label: r.libelle || r.label || '' }; });
    return l.length ? l : (REF.comptes || []).filter(function (r) { return re.test(r.code); });
  }
  function opts(l, sel, vide) { return (vide ? '<option value="">' + vide + '</option>' : '') + l.map(function (r) { return '<option value="' + esc(r.code) + '"' + (r.code === sel ? ' selected' : '') + '>' + esc(r.code + ' — ' + r.label) + '</option>'; }).join(''); }
  function collOpts(sel) { var l = plan(/^40/); if (sel && !l.some(function (r) { return r.code === sel; })) l = l.concat([{ code: sel, label: 'Compte collectif de l’attributaire' }]); return opts(l, sel, '— Sélectionner —'); }
  function taxes() { return (window.TAXES_REF || []).filter(function (t) { return t.code && parseFloat(t.taux) > 0; }).map(function (t) { return { code: t.code, taux: parseFloat(t.taux) }; }); }

  function ouvrir(item) {
    var E = etatMarche(item.code), A = window.__ecEntete;
    var w = O.fenetre('Contrat ' + item.code + ' — reprise des imputations', false, 'file-certificate', 'Reprise des imputations du marché');
    var Q = function (s) { return w.b.querySelector(s); }, OK = function () { return w.f.querySelector('[data-ct-ok]'); };
    var md = w.b.closest('.fo-md'); if (md) md.style.width = 'min(1040px,100%)';
    if (!E) { w.b.innerHTML = '<div class="fo-note">Aucune imputation connue pour ce marché : saisie normale.</div>'; w.f.innerHTML = '<button type="button" class="p" data-fo-x>Continuer en saisie normale</button>'; w.f.querySelector('[data-fo-x]').addEventListener('click', O.fermer); return; }
    var maxPct = Math.floor(E.pctDispo * 100) / 100, att = attributaire(item.code), T = tiersTous(), TX = taxes(), tvaC = plan(/^445/); if (!tvaC.length) tvaC = plan(/^44/);
    var tiersOpts = T.slice(); if (!T.some(function (y) { return y.code === att.code && y.compte === att.compte; })) tiersOpts.unshift(att);
    var tv0 = TX.filter(function (t) { return /tva/i.test(t.code); })[0] || TX[0] || null;
    w.b.innerHTML = '<div style="font-size:13px;margin-bottom:10px"><b>' + esc(item.label) + '</b></div>' +
      '<div class="fo-fl"><label>Montant du marché<input class="fo-in r" readonly value="' + fmt(E.montant) + '" style="background:#F1F2F5"></label><label>Déjà facturé<input class="fo-in r" readonly value="' + fmt(E.fact) + '" style="background:#F1F2F5"></label><label>Disponible (pas encore facturé)<input class="fo-in r" readonly value="' + fmt(E.dispo) + '" style="background:#F1F2F5"></label></div>' +
      '<div class="fo-sec">Attributaire</div>' +
      '<div class="fo-fl"><label>Attributaire du marché (Saisie des plans › Tiers)<select class="fo-in" data-ct="tiers">' + tiersOpts.map(function (t) { return '<option value="' + esc(t.compte + '|' + t.code) + '"' + (t.code === att.code && t.compte === att.compte ? ' selected' : '') + '>' + esc(t.code + ' — ' + t.nom) + '</option>'; }).join('') + '</select></label>' +
      '<label>Compte collectif de l’attributaire<select class="fo-in" data-ct="coll">' + collOpts(att.compte) + '</select></label></div>' +
      '<div class="fo-sec">Reprendre les imputations du marché ?</div>' +
      '<div class="fo-rg" style="margin-bottom:10px"><label><input type="radio" name="ct-rep" value="oui" checked> Oui : reprendre le compte, les axes analytiques et le budget du marché</label><label><input type="radio" name="ct-rep" value="non"> Non : saisie normale</label></div>' +
      '<div data-ct-oui><div class="fo-fl"><label>Pourcentage à facturer (max ' + String(maxPct).replace('.', ',') + ' %)<input class="fo-in r" data-ct="pct" inputmode="decimal" value="' + String(maxPct).replace('.', ',') + '"></label><label>Montant HT à facturer (MGA)<input class="fo-in r" data-ct="mt" readonly style="background:#F1F2F5"></label>' +
      '<label>Type de taxe<select class="fo-in" data-ct="taxe"><option value="">— Sans taxe —</option>' + TX.map(function (t) { return '<option value="' + esc(t.code) + '"' + (tv0 && t.code === tv0.code ? ' selected' : '') + '>' + esc(t.code + ' (' + String(t.taux).replace('.', ',') + ' %)') + '</option>'; }).join('') + '</select></label>' +
      '<label>Compte de TVA déductible<select class="fo-in" data-ct="tvac">' + opts(tvaC, (tvaC[0] || {}).code, '— Aucun —') + '</select></label></div>' +
      '<div class="fo-sec">Schéma comptable</div><div data-ct-sch></div></div><div data-ct-er class="fo-ko"></div>';
    w.f.innerHTML = '<button type="button" data-fo-x>Annuler</button><button type="button" class="p" data-ct-ok><i class="ti ti-pencil"></i> Préremplir la saisie</button>';
    var P = function () { return Q('[data-ct="pct"]'); };
    function pct() { return num(P().value); }
    function tiersSel() { var v = Q('[data-ct="tiers"]').value.split('|'); return tiersOpts.filter(function (t) { return t.compte === v[0] && t.code === v[1]; })[0] || null; }
    function tauxSel() { var c = Q('[data-ct="taxe"]').value, t = TX.filter(function (x) { return x.code === c; })[0]; return t ? t.taux : 0; }
    function lignesCharge() { var m = r2(E.montant * pct() / 100), acc = 0, Lg = E.d.lignes; return Lg.map(function (x, i) { var v = i === Lg.length - 1 ? r2(m - acc) : r2(m * x.part); acc += v; return Object.assign({}, x, { montant: v }); }); }
    function ecriture() {
      var Lc = lignesCharge(), ht = r2(E.montant * pct() / 100), tva = r2(ht * tauxSel() / 100), ttc = r2(ht + tva), t = tiersSel(), cc = compteDe(Q('[data-ct="coll"]').value), lib = 'Marché ' + item.code + (t ? ' ' + t.nom : '');
      var D = Lc.map(function (x) { return { compte: compteDe(x.compte), tiers: null, libelle: x.lib + ' — ' + item.code, montant: x.montant, sens: 'DEBIT', axes: x.axes || {}, budget: x.budget || '' }; });
      if (tva > 0) D.push({ compte: compteDe(Q('[data-ct="tvac"]').value), tiers: null, libelle: 'TVA ' + lib, montant: tva, sens: 'DEBIT', axes: {}, budget: '' });
      D.push({ compte: { code: cc.code, label: cc.label, collectif: true }, tiers: t ? { code: t.code, label: t.nom, collectif: t.compte } : null, libelle: lib, montant: ttc, sens: 'CREDIT', axes: {}, budget: '' });
      return { L: D, ht: ht, tva: tva, ttc: ttc };
    }
    function maj() {
      var p = pct(), er = '', oui = Q('[name="ct-rep"]:checked').value === 'oui';
      if (!(p > 0)) er = 'Saisissez un pourcentage supérieur à 0.'; else if (p > maxPct + 1e-9) er = 'Le pourcentage dépasse la part encore disponible du marché (' + String(maxPct).replace('.', ',') + ' %).';
      else if (!Q('[data-ct="coll"]').value) er = 'Choisissez le compte collectif de l’attributaire.'; else if (tauxSel() > 0 && !Q('[data-ct="tvac"]').value) er = 'Choisissez le compte de TVA déductible.';
      Q('[data-ct="mt"]').value = p > 0 ? fmt(r2(E.montant * p / 100)) : '';
      Q('[data-ct-er]').textContent = oui ? er : ''; OK().disabled = oui && !!er;
      if (er) { Q('[data-ct-sch]').innerHTML = ''; return; }
      var X = ecriture(), dT = 0, cT = 0, anal = X.L.some(function (x) { return x.axes && Object.keys(x.axes).length; });
      Q('[data-ct-sch]').innerHTML = '<table class="fo-t"><thead><tr><th>Compte</th><th>Tiers</th><th>Libellé</th>' + (anal ? '<th>Axes analytiques</th><th>Budget</th>' : '') + '<th style="width:120px;text-align:right">Débit</th><th style="width:120px;text-align:right">Crédit</th></tr></thead><tbody>' +
        X.L.map(function (x) { var d = x.sens === 'DEBIT'; if (d) dT += x.montant; else cT += x.montant; return '<tr><td><b>' + esc(x.compte.code) + '</b> <span style="color:#5B606D">' + esc(x.compte.label) + '</span></td><td>' + esc(x.tiers ? x.tiers.code : '') + '</td><td>' + esc(x.libelle) + '</td>' + (anal ? '<td style="font-family:monospace;font-size:11px">' + esc(Object.keys(x.axes || {}).map(function (k) { return x.axes[k]; }).join(' · ')) + '</td><td style="font-family:monospace;font-size:11px">' + esc(x.budget || '') + '</td>' : '') + '<td style="text-align:right">' + (d ? fmt(x.montant) : '') + '</td><td style="text-align:right">' + (d ? '' : fmt(x.montant)) + '</td></tr>'; }).join('') +
        '<tr style="font-weight:700"><td colspan="' + (anal ? 5 : 3) + '">Total' + (Math.round((dT - cT) * 100) ? ' — écart ' + fmt(Math.abs(dT - cT)) : ' — équilibré') + '</td><td style="text-align:right">' + fmt(dT) + '</td><td style="text-align:right">' + fmt(cT) + '</td></tr></tbody></table>';
    }
    Q('[data-ct="tiers"]').addEventListener('change', function () { var t = tiersSel(); if (t) { Q('[data-ct="coll"]').innerHTML = collOpts(t.compte); Q('[data-ct="coll"]').value = t.compte; } maj(); });
    ['coll', 'taxe', 'tvac'].forEach(function (k) { Q('[data-ct="' + k + '"]').addEventListener('change', maj); });
    P().addEventListener('input', maj); P().addEventListener('change', function () { P().value = pct() ? String(pct()).replace('.', ',') : ''; maj(); });
    [].forEach.call(w.b.querySelectorAll('[name="ct-rep"]'), function (r) { r.addEventListener('change', function () { var oui = Q('[name="ct-rep"]:checked').value === 'oui'; Q('[data-ct-oui]').hidden = !oui; maj(); if (!oui) { OK().disabled = false; OK().innerHTML = 'Continuer en saisie normale'; } else OK().innerHTML = '<i class="ti ti-pencil"></i> Préremplir la saisie'; }); });
    w.f.querySelector('[data-fo-x]').addEventListener('click', O.fermer);
    OK().addEventListener('click', function () {
      if (Q('[name="ct-rep"]:checked').value !== 'oui') { O.fermer(); return; }
      if (!A || !A.ajouterLignes) { alert('Saisie d’écritures indisponible.'); return; }
      var k1 = num(c('cours1') && c('cours1').value), k2 = num(c('cours2') && c('cours2').value), X = ecriture();
      A.ajouterLignes(X.L.map(function (x) {
        return { compte: x.compte, tiers: x.tiers, contrat: item, libelle: x.libelle, montant: x.montant, sens: x.sens, echeance: '', axes: x.axes || {}, budget: x.budget || '',
          montant1: k1 > 0 ? r2(x.montant / k1) : 0, montant2: k2 > 0 ? r2(x.montant / k2) : 0 };
      }), 'Saisie préremplie avec les imputations du marché ' + item.code + ' (' + String(pct()).replace('.', ',') + ' % facturé, attributaire ' + (tiersSel() ? tiersSel().code : '—') + ') : vérifiez les lignes puis validez la pièce.');
      extra[item.code] = (extra[item.code] || 0) + X.ht; sauve();
      O.fermer();
    });
    maj();
  }
  window.__ecContrat = { choisi: ouvrir, etat: etatMarche };
})();
