// Moteur des états financiers (Bilan, Compte de résultat, Emplois et ressources) : les montants viennent des soldes comptables
// (balance de démonstration de l'exercice 2026 + écritures saisies) selon les rubriques et règles du paramétrage.
//   ETATS_FIN_MODELES[kind]()          fonction exposée par chaque écran de paramétrage (kind : bil, cr, er) → liste des modèles
//   ETATS_FIN.modeles(kind)            modèles { id, libelle, lignes }
//   ETATS_FIN.calc(kind, id, du, au)   lignes du modèle avec leur montant v (centimes) ; du / au au format aaaa-mm-jj
//   ETATS_FIN.fmt(centimes)            montant formaté « 1 234,00 »
// Règles :
//   - fourchette de comptes Min–Max (préfixes) ; sens S : solde (actif / emploi : débit − crédit ; passif / ressource : crédit − débit), D : total débit, C : total crédit ;
//   - comptes de bilan (classes 1 à 5) : cumul depuis l'ouverture jusqu'à la date d'arrêté ; comptes de gestion (classes 6 à 9) : mouvements de la période ;
//   - fourchettes par axe analytique : seules les écritures saisies portant l'élément d'axe compris entre Min et Max sont retenues (la balance de démonstration n'a pas d'analytique) ;
//   - amortissements / provisions (bilan) : montant net = brut − amortissements ;
//   - nature « Résultat » : fourchettes de la ligne + résultat des comptes de gestion (produits − charges) ;
//   - sous-total : somme des lignes depuis le titre, le sous-titre ou le sous-total précédent ; total (ou formule vide) : somme des lignes du même type depuis le dernier total ;
//   - formule : codes de lignes et opérateurs + − * / ( ), par exemple « AE + AF − AL » ; constante : nombre.
(function () {
  var reg = (window.ETATS_FIN_MODELES = window.ETATS_FIN_MODELES || {});
  var ORDRE = { actif: 0, passif: 1, treso: 2 };
  function modeles(kind) { try { return reg[kind] ? (reg[kind]() || []) : []; } catch (e) { return []; } }
  function classe(c) { return +String(c).charAt(0) || 0; }
  function an(iso, n) { return (+iso.slice(0, 4) + n) + iso.slice(4); }
  function fmt(c) { return (c < 0 ? '-' : '') + (Math.abs(c) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[  ]/g, ' '); }

  // écritures élémentaires de la période : { c compte, d débit, cr crédit, ax axes, base }
  function entrees(du, au) {
    var out = [], B = window.BALANCE_BASE || [], S = window.ECRITURES_SAISIES;
    if (du <= '2026-12-31' && au >= '2026-01-01') {
      var annee = du <= '2026-01-01' && au >= '2026-12-31';   // les cumuls de gestion de la balance de démonstration portent sur l'année entière
      B.forEach(function (x) {
        if (classe(x.code) >= 6 && !annee) return;
        var bil = classe(x.code) < 6, d = (bil ? x.anD : 0) + x.mvD, cr = (bil ? x.anC : 0) + x.mvC;
        if (d || cr) out.push({ c: x.code, d: d, cr: cr, ax: {}, base: true });
      });
    }
    if (S) S({}).forEach(function (x) {
      var bil = classe(x.compte) < 6;
      if (x.date > au || (!bil && x.date < du)) return;
      out.push({ c: x.compte, d: S.c100(x.debit), cr: S.c100(x.credit), ax: x.axes || {}, base: false });
    });
    return out;
  }
  // Règle de gestion « type de dépense » (emplois) — mouvements de la période, avec imputation analytique :
  //   Décaissement : comptes des racines C2, C4, C6, dans les journaux de type Trésorerie
  //   Engagement   : comptes des racines C2, C6, dans tous les journaux
  //   (la balance de démonstration n'a ni journal ni imputation analytique : elle n'entre pas dans ce calcul)
  function racine(code, prof) {
    var P = window.PLAN_COMPTABLE || [], r0 = P.filter(function (x) { return x.code === code; })[0];
    if (r0 && r0.racine) return r0.racine;
    if (r0 && r0.parent && (prof || 0) < 12) return racine(r0.parent, (prof || 0) + 1);
    return 'C' + String(code).charAt(0);
  }
  function journalTreso(code) { var J = (window.JOURNAUX_PLAN || []).filter(function (x) { return x.code === code; })[0]; return !!J && J.type === 'Trésorerie'; }
  function entreesDepense(du, au, genre) {
    var S = window.ECRITURES_SAISIES, out = [], RAC = genre === 'decaissement' ? ['C2', 'C4', 'C6'] : ['C2', 'C6'];
    if (!S) return out;
    S({}).forEach(function (x) {
      if (x.date < du || x.date > au) return;
      if (RAC.indexOf(racine(x.compte)) < 0) return;
      if (genre === 'decaissement' && !journalTreso(x.journal)) return;
      var ax = x.axes || {}; if (!Object.keys(ax).some(function (k) { return ax[k]; })) return;
      out.push({ c: x.compte, d: S.c100(x.debit), cr: S.c100(x.credit), ax: ax, base: false, dt: x.date, jnl: x.journal, site: x.site });
    });
    return out;
  }
  function dans(v, a, b) { v = String(v); return !!a && !!b && v.slice(0, a.length) >= a && v.slice(0, b.length) <= b; }
  function premiere(code, F) { for (var i = 0; i < F.length; i++) if (dans(code, F[i].d, F[i].f)) return F[i]; return null; }
  function montant(E, F, axes, type) {
    var tot = 0; F = (F || []).filter(function (f) { return f.d && f.f; }); axes = axes || [];
    if (!F.length) return 0;
    var par = {}; axes.forEach(function (a) { (par[a.axe] = par[a.axe] || []).push(a); });
    E.forEach(function (e) {
      var f = premiere(e.c, F); if (!f) return;
      for (var k in par) { if (!par.hasOwnProperty(k)) continue; if (e.base) return; var v = e.ax[k]; if (!v || !par[k].some(function (a) { return dans(v, a.d, a.f); })) return; }
      tot += f.s === 'D' ? e.d : f.s === 'C' ? e.cr : (type === 'passif' ? e.cr - e.d : e.d - e.cr);
    });
    return tot;
  }
  function resultatGestion(E) { var r = 0; E.forEach(function (e) { var k = classe(e.c); if (k === 7) r += e.cr - e.d; else if (k === 6) r -= e.d - e.cr; }); return r; }
  function formule(txt, V) {
    var ex = String(txt || '').replace(/[A-Za-z_][A-Za-z0-9_]*/g, function (m) { return '(' + (V.hasOwnProperty(m) ? V[m] : 0) + ')'; }).replace(/−/g, '-').replace(/×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
    if (!/^[0-9+\-*\/().\s]+$/.test(ex)) return 0;
    try { var r = new Function('return (' + ex + ')')(); return isFinite(r) ? Math.round(r) : 0; } catch (e) { return 0; }
  }
  function calc(kind, id, du, au, opt) {
    if (kind === 'tft') return calcTft(id, du, au);
    var M = modeles(kind).filter(function (m) { return m.id === id; })[0]; if (!M) return [];
    var E = entrees(du, au), Ed = (opt && opt.depense) ? entreesDepense(du, au, opt.depense) : null, L = M.lignes.slice().sort(function (a, b) { return ((ORDRE[a.type] || 0) - (ORDRE[b.type] || 0)) || ((+a.ordre || 0) - (+b.ordre || 0)); });
    var V = {}, sous = 0, tot = { actif: 0, passif: 0, treso: 0 };
    var rows = L.map(function (l) {
      var v = 0, n = l.nature, t = l.type || 'actif';
      var EE = (Ed && t === 'actif') ? Ed : E;
      if (n === 'ligne') { v = montant(EE, l.fourchettes, l.axes, t); if (l.amort && l.amort.length) v -= montant(EE, l.amort, [], 'passif'); }
      else if (n === 'resultat') { v = montant(EE, l.fourchettes, l.axes, t) + (t === 'passif' ? 1 : -1) * resultatGestion(E); }
      else if (n === 'constante') v = Math.round((parseFloat(String(l.formule || '').replace(',', '.')) || 0) * 100);
      if (n === 'ligne' || n === 'resultat') { sous += v; tot[t] = (tot[t] || 0) + v; }
      else if (n === 'titre' || n === 'soustitre') sous = 0;
      else if (n === 'soustotal') { v = sous; sous = 0; }
      else if ((n === 'total' || n === 'formule') && !String(l.formule || '').trim()) { v = tot[t] || 0; tot[t] = 0; }
      if (l.code) V[l.code] = v;
      return { code: l.code, libelle: l.libelle, nature: n, type: t, v: v, formule: l.formule || '', afficher: l.afficher !== false, gras: !!l.gras, italique: !!l.italique, vide: !!l.vide, fond: !!l.fond, note: l.note || '', reference: l.reference || '' };
    });
    for (var k = 0; k < 3; k++) rows.forEach(function (r) { if ((r.nature === 'formule' || r.nature === 'total' || r.nature === 'soustotal') && String(r.formule).trim()) { r.v = formule(r.formule, V); if (r.code) V[r.code] = r.v; } });
    return rows;
  }
  // Tableau de flux de trésorerie : lignes « grille » (fourchettes de comptes, type de calcul, type de mouvement), regroupements et formules
  //   type : D − C, C − D, D, C, Solde D, Solde C (le solde se calcule compte par compte) ; mouvement : Variation (période), Solde Début (ouverture), Solde Fin (ouverture + variation)
  function ouverture(du) {
    var out = [], B = window.BALANCE_BASE || [], S = window.ECRITURES_SAISIES;
    if (du >= '2026-01-01') B.forEach(function (x) { if (classe(x.code) < 6 && (x.anD || x.anC)) out.push({ c: x.code, d: x.anD, cr: x.anC }); });
    if (S) S({}).forEach(function (x) { if (x.date < du && classe(x.compte) < 6) out.push({ c: x.compte, d: S.c100(x.debit), cr: S.c100(x.credit) }); });
    return out;
  }
  function variation(du, au) {
    var out = [], B = window.BALANCE_BASE || [], S = window.ECRITURES_SAISIES;
    if (du <= '2026-01-01' && au >= '2026-12-31') B.forEach(function (x) { if (x.mvD || x.mvC) out.push({ c: x.code, d: x.mvD, cr: x.mvC }); });
    if (S) S({}).forEach(function (x) { if (x.date >= du && x.date <= au) out.push({ c: x.compte, d: S.c100(x.debit), cr: S.c100(x.credit) }); });
    return out;
  }
  function tftValeur(l, ouv, mv) {
    var F = (l.fourchettes || []).filter(function (f) { return f.d && f.f; }); if (!F.length) return 0;
    var mvt = String(l.mouvement || ''), E = /D.but/.test(mvt) ? ouv : /Fin/.test(mvt) ? ouv.concat(mv) : mv, par = {};
    E.forEach(function (e) { if (!premiere(e.c, F)) return; var o = par[e.c] = par[e.c] || { d: 0, c: 0 }; o.d += e.d; o.c += e.cr; });
    var t = String(l.type || 'D - C').replace(/\s+/g, ' '), v = 0;
    Object.keys(par).forEach(function (k) {
      var d = par[k].d, c = par[k].c;
      v += t === 'D' ? d : t === 'C' ? c : t === 'C - D' ? c - d : t === 'Solde D' ? Math.max(d - c, 0) : t === 'Solde C' ? Math.max(c - d, 0) : d - c;
    });
    return v;
  }
  function calcTft(id, du, au) {
    var M = modeles('tft').filter(function (m) { return m.id === id; })[0]; if (!M) return [];
    var ouv = ouverture(du), mv = variation(du, au), V = {}, grp = 0;
    var L = M.lignes.slice().sort(function (a, b) { return (+a.tri || 0) - (+b.tri || 0); });
    var rows = L.map(function (l) {
      var v = 0, n = l.nature;
      if (n === 'grille') { v = tftValeur(l, ouv, mv); grp += v; }
      else if (n === 'regroupement') { v = grp; grp = 0; }
      else if (n === 'titre') grp = 0;
      if (l.code) V[l.code] = v;
      return { code: l.code, libelle: l.libelle, nature: n, v: v, formule: l.formule || '', afficher: l.afficher !== false, rupture: !!l.rupture, gras: !!l.gras, italique: !!l.italique, vide: !!l.vide };
    });
    for (var k = 0; k < 3; k++) rows.forEach(function (r) { if (r.nature === 'formule' && String(r.formule).trim()) { r.v = formule(r.formule, V); if (r.code) V[r.code] = r.v; } });
    return rows;
  }
  // opt.taux : monnaie d'édition autre que la monnaie locale (cours = unités de monnaie locale pour une unité de la devise) ; les montants calculés sont divisés par le cours
  function calcConv(kind, id, du, au, opt) { var R = calc(kind, id, du, au, opt); if (opt && opt.taux > 0 && opt.taux !== 1) R.forEach(function (r) { if (typeof r.v === 'number') r.v = Math.round(r.v / opt.taux); }); return R; }
  window.ETATS_FIN = { modeles: modeles, calc: calcConv, fmt: fmt, an: an, depense: entreesDepense };
})();
