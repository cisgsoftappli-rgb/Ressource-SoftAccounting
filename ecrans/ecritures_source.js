// Source commune des écritures saisies (Saisie d'écritures → registre window.ECRITURES_PIECES) pour les écrans d'exploitation.
// Chaque état garde ses données de démonstration et y ajoute les lignes saisies de la période : balance et grand livre généraux,
// journaux, balance et grand livre auxiliaires, analytique, lettrage, pointage bancaire, déclarations fiscales, suivi des contrats, états financiers.
//   ECRITURES_SAISIES(o)          lignes normalisées { piece, journal, date (aaaa-mm-jj), compte, tiers, libelle, debit, credit (monnaie locale), axes, contrat… }
//                                 o : { du, au, compte, prefixe, tiers, contrat }
//   ECRITURES_SAISIES.parCompte(du, au)  cumuls { compte: { d, c } } en centimes
//   ECRITURES_SAISIES.balance(base, du, au)  copie des comptes d'une balance { code, libelle, anD, anC, mvD, mvC } (centimes) avec les mouvements saisis
// L'évènement « ecritures-pieces-changed » est émis à chaque enregistrement de pièce : les écrans ouverts se recalculent.
(function () {
  var AXES = ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE', 'NATURE', 'CATEGORIE DE DEPENSE', 'Plan 7', 'Plan 8', 'Plan 9', 'Plan 10'];
  function deb(s) { return s === 'DEBIT' || s === 'D' || s === 'Débit'; }
  function c100(v) { return Math.round((+v || 0) * 100); }
  function libCompte(code) {
    var P = window.PLAN_COMPTABLE || [], r = P.filter(function (x) { return x.code === code; })[0]; if (r) return r.libelle || r.label || '';
    var R = (window.ECRITURES_REF && window.ECRITURES_REF.comptes) || [], k = R.filter(function (x) { return x.code === code; })[0]; return k ? k.label : '';
  }
  function nomTiers(code) { var t = (window.TIERS_PLAN || []).filter(function (x) { return x.code === code; })[0]; return t ? t.nom : code; }
  function lignes(o) {
    o = o || {}; var out = [];
    (window.ECRITURES_PIECES || []).forEach(function (p) {
      if (p.statut === 'Annulée' || p.statut === 'Rejetée') return;
      var L = p.lignes || [];
      L.forEach(function (l, i) {
        var d = deb(l.sens), m = +l.montant || 0, opp = L.filter(function (x) { return deb(x.sens) !== d; })[0];
        var x = { id: 'S|' + p.journal + '|' + p.piece + '|' + p.date + '|' + i, piece: p.piece, journal: p.journal, date: p.date, datePiece: p.datePiece || p.date, reference: p.reference || '', facture: p.facture || '', statut: p.statut || '',
          compte: String(l.compte || ''), contrepartie: opp ? String(opp.compte || '') : '', tiers: l.tiers || '', libelle: l.libelle || '', debit: d ? m : 0, credit: d ? 0 : m, d1: +l.montant1 || 0, d2: +l.montant2 || 0,
          axes: l.axes || {}, regr: l.regr || '', contrat: l.contrat || '', echeance: l.echeance || '', site: p.site || '01' };
        if (o.du && x.date < o.du) return; if (o.au && x.date > o.au) return;
        if (o.compte && x.compte !== o.compte) return; if (o.prefixe && x.compte.indexOf(o.prefixe) !== 0) return;
        if (o.tiers && x.tiers !== o.tiers) return; if (o.contrat && x.contrat !== o.contrat) return;
        out.push(x);
      });
    });
    return out;
  }
  lignes.AXES = AXES;
  lignes.libCompte = libCompte; lignes.nomTiers = nomTiers; lignes.c100 = c100;
  lignes.axesPlans = function (x) { return AXES.map(function (n) { return x.axes[n] || ''; }); };
  lignes.parCompte = function (du, au) { var r = {}; lignes({ du: du, au: au }).forEach(function (x) { var k = r[x.compte] = r[x.compte] || { d: 0, c: 0 }; k.d += c100(x.debit); k.c += c100(x.credit); }); return r; };
  // balance (centimes) : comptes existants complétés, comptes nouveaux ajoutés et triés
  lignes.balance = function (base, du, au, analytique) {
    var S = analytique ? (function () { var r = {}; lignes({ du: du, au: au }).forEach(function (x) { if (!Object.keys(x.axes || {}).some(function (k) { return x.axes[k]; })) return; var k = r[x.compte] = r[x.compte] || { d: 0, c: 0 }; k.d += c100(x.debit); k.c += c100(x.credit); }); return r; })() : lignes.parCompte(du, au), out = base.map(function (c) { var s = S[c.code]; return s ? Object.assign({}, c, { mvD: c.mvD + s.d, mvC: c.mvC + s.c, saisi: true }) : c; });
    Object.keys(S).forEach(function (k) { if (!base.some(function (c) { return c.code === k; })) out.push({ code: k, libelle: libCompte(k) || k, anD: 0, anC: 0, mvD: S[k].d, mvC: S[k].c, saisi: true }); });
    return out.sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; });
  };
  // balance auxiliaire (centimes) : tiers { code, libelle, mvD, mvC } ; sD / sC = part saisie (le détail de démonstration porte sur le reste)
  lignes.aux = function (base, collectif) {
    var S = {}; lignes({}).forEach(function (x) { if (!x.tiers || (collectif && x.compte !== collectif)) return; var k = S[x.tiers] = S[x.tiers] || { d: 0, c: 0 }; k.d += c100(x.debit); k.c += c100(x.credit); });
    var out = base.map(function (t) { var s = S[t.code]; return s ? Object.assign({}, t, { mvD: t.mvD + s.d, mvC: t.mvC + s.c, sD: s.d, sC: s.c }) : t; });
    Object.keys(S).forEach(function (k) { if (!base.some(function (t) { return t.code === k; })) out.push({ code: k, libelle: nomTiers(k), mvD: S[k].d, mvC: S[k].c, sD: S[k].d, sC: S[k].c }); });
    return out.sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; });
  };
  // ligne au format du détail des mouvements / grand livre auxiliaire (window.BALANCE_DETAIL)
  lignes.detail = function (x) {
    var d = new Date(x.date + 'T00:00:00Z'), dp = new Date((x.datePiece || x.date) + 'T00:00:00Z'), a = x.axes;
    return { d: d, dp: dp, ref: x.reference, lb: a['POSTE BUDGETAIRE'] || '', ct: x.contrat, jl: x.journal, piece: x.piece, site: x.site, compte: x.compte, cp: x.contrepartie, lib: x.libelle, D: c100(x.debit), C: c100(x.credit), pr: x.regr, p: [a.ACTIVITE || '', a.FINANCEMENT || '', a.GEOGRAPHIQUE || '', a.NATURE || '', a['CATEGORIE DE DEPENSE'] || ''], saisi: true };
  };
  function fr(iso) { return iso ? iso.split('-').reverse().join('/') : ''; }
  function fmt2(v) { return v ? (Math.round(v * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, ' ') : ''; }
  lignes.fr = fr; lignes.fmt2 = fmt2;
  // grand livre général : comptes { code, libelle, lignes: [{ f, date, d, c, txt }] } complétés des lignes saisies
  lignes.glg = function (base) {
    var S = lignes({}), out = base.map(function (c) { return c; }), idx = {};
    out.forEach(function (c, i) { idx[c.code] = i; });
    S.forEach(function (x) {
      var f = [fr(x.date), fr(x.datePiece), x.reference, '', x.contrat, x.journal, x.piece, x.contrepartie, x.libelle, fmt2(x.debit), fmt2(x.credit), lignes.axesPlans(x).join('|'), x.regr];   // colonnes du grand livre : date, date pièce, référence, —, contrat, journal, pièce, contrepartie, libellé, débit, crédit, plans, regroupement
      var ln = { f: f, date: x.date, d: c100(x.debit), c: c100(x.credit), txt: (f[0] + ' ' + x.piece + ' ' + x.contrepartie + ' ' + x.libelle + ' ' + x.compte).toLowerCase(), saisi: true };
      if (idx[x.compte] === undefined) { out.push({ code: x.compte, libelle: libCompte(x.compte) || x.compte, lignes: [] }); idx[x.compte] = out.length - 1; }
      var c = out[idx[x.compte]]; if (!c.__copie) { c = out[idx[x.compte]] = { code: c.code, libelle: c.libelle, lignes: c.lignes.slice(), __copie: true }; }
      c.lignes.push(ln);
    });
    out.forEach(function (c) { if (c.__copie) c.lignes.sort(function (a, b) { return a.date < b.date ? -1 : a.date > b.date ? 1 : 0; }); });
    return out.sort(function (a, b) { return a.code < b.code ? -1 : a.code > b.code ? 1 : 0; });
  };
  // journal (édition) : lignes au format de journal_donnees.json
  lignes.journal = function () {
    return lignes({}).map(function (x) { var a = x.axes; return { d: fr(x.date), o: x.piece, j: x.journal, p: x.piece, s: x.site, c: x.tiers ? x.compte + ' - ' + x.tiers : x.compte, l: x.libelle, db: fmt2(x.debit), cr: fmt2(x.credit), m: 'MGA', a: a.ACTIVITE || '', pc: a['POSTE BUDGETAIRE'] || '', f: a.FINANCEMENT || '', co: a.GEOGRAPHIQUE || '', saisi: true }; });
  };
  // comptes collectifs mouvementés par des écritures saisies avec tiers, ajoutés à une liste « code — libellé »
  lignes.collectifs = function (base) { var out = (base || []).slice(); lignes({}).forEach(function (x) { if (!x.tiers) return; if (!out.some(function (c) { return String(c).split(' — ')[0] === x.compte; })) out.push(x.compte + ' — ' + (libCompte(x.compte) || 'Compte collectif')); }); return out.sort(); };
  window.ECRITURES_SAISIES = lignes;
})();
