// Saisie d'écritures › « Importer » : importation d'écritures depuis un fichier Excel (assistant commun : doublons, lignes retenues / rejetées / anomalies,
// intégration définitive). Une ligne du fichier = une ligne d'écriture ; les lignes sont regroupées en pièces par journal + n° de pièce.
// Règles : journal et compte existants, tiers obligatoire pour un compte collectif (et rattaché à ce compte), date dans l'exercice, sens D/C, montant > 0,
// chaque pièce équilibrée (débit = crédit). Les pièces intégrées sont enregistrées (window.ECRITURES_PIECES) comme si elles avaient été saisies.
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  var A = function () { return window.__ecEntete || {}; };
  function c(n) { return R.querySelector('[formcontrolname="' + n + '"]'); }
  function REF() { return window.ECRITURES_REF || { comptes: [], tiers: [], journaux: [] }; }
  function MON() { var f = window.ENTITE_MONNAIES; return f ? f() : { m1: 'MGA', m2: 'USD', m3: '' }; }
  function nombre(v) { var s = String(v == null ? '' : v).replace(/[\s ]/g, ''); if (!s) return NaN; var vp = s.lastIndexOf(','), pt = s.lastIndexOf('.'); if (vp >= 0 && pt >= 0) s = vp > pt ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); else if (vp >= 0) s = s.replace(',', '.'); var n = parseFloat(s); return isNaN(n) ? NaN : n; }
  function date(v) {
    v = String(v == null ? '' : v).trim(); if (!v) return '';
    if (/^[0-9]{5}(\.[0-9]+)?$/.test(v)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(Number(v)) * 864e5).toISOString().slice(0, 10);
    var m = /^([0-9]{1,2})[\/.\-]([0-9]{1,2})[\/.\-]([0-9]{4})/.exec(v); if (m) return m[3] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[1]).slice(-2);
    m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(v); return m ? m[0] : '';
  }
  function fr(d) { return d ? d.split('-').reverse().join('/') : ''; }
  function pieces() { return window.ECRITURES_PIECES = window.ECRITURES_PIECES || []; }
  function axesActifs() { return [].slice.call(R.querySelectorAll('.entry-axes-ligne > .entry-field-axe')).filter(function (w) { return !w.classList.contains('plan-off') && w.querySelector('[data-axe]'); }).map(function (w) { return { col: w.querySelector('label').textContent.trim(), nom: w.querySelector('[data-axe]').dataset.axe }; }); }
  function regrActif() { return !!(window.REGROUPEMENT && window.REGROUPEMENT()); }

  function modele() {
    var m = MON(), ax = axesActifs(), ch = [
      { col: 'Journal', oblig: true, format: 'Code d’un journal actif (Saisie des plans › Journaux).', exemple: '01ACHAT' },
      { col: 'N° de pièce', oblig: true, format: 'Les lignes d’une même pièce portent le même journal et le même n° de pièce.', exemple: 'AC0001' },
      { col: 'Date de l’écriture', oblig: true, format: 'jj/mm/aaaa, dans l’exercice en cours.', exemple: '15/03/2026' },
      { col: 'Date de la pièce', oblig: false, format: 'jj/mm/aaaa. Par défaut : date de l’écriture.', exemple: '12/03/2026' },
      { col: 'N° de facture', oblig: false, format: 'Texte.', exemple: 'FA-2026-0045' },
      { col: 'Référence', oblig: false, format: 'Texte.', exemple: 'BC-118' },
      { col: 'Compte', oblig: true, format: 'Compte général de détail du plan comptable.', exemple: '606300' },
      { col: 'Compte auxiliaire', oblig: false, format: 'Code du tiers : obligatoire pour un compte collectif, interdit sinon.', exemple: '' },
      { col: 'Libellé', oblig: true, format: 'Texte.', exemple: 'Fournitures de bureau' },
      { col: 'Sens (D/C)', oblig: true, format: 'D (débit) ou C (crédit).', exemple: 'D' },
      { col: 'Montant ' + m.m1, oblig: true, format: 'Nombre strictement positif en ' + m.m1 + '. Virgule ou point décimal.', exemple: '120000' }];
    var ex = ['01ACHAT', 'AC0001', '15/03/2026', '12/03/2026', 'FA-2026-0045', 'BC-118', '606300', '', 'Fournitures de bureau', 'D', '120000'];
    if (m.m2) { ch.push({ col: 'Montant ' + m.m2, oblig: false, format: 'Montant en ' + m.m2 + ' (reporting 2). Par défaut : converti avec le cours à la date de l’écriture.', exemple: '' }); ex.push(''); }
    if (m.m3) { ch.push({ col: 'Montant ' + m.m3, oblig: false, format: 'Montant en ' + m.m3 + ' (reporting 3). Par défaut : converti avec le cours à la date de l’écriture.', exemple: '' }); ex.push(''); }
    ch.push({ col: 'Échéance', oblig: false, format: 'jj/mm/aaaa.', exemple: '' }); ex.push('');
    if (regrActif()) { ch.push({ col: 'Regroupement', oblig: false, format: 'Code d’un élément du plan de regroupement actif.', exemple: '' }); ex.push(''); }
    ax.forEach(function (a) { ch.push({ col: a.col, oblig: false, format: 'Code de l’élément du plan « ' + a.col + ' ».', exemple: '' }); ex.push(''); });
    var ex2 = ex.slice(); ex2[7] = 'VIMA'; ex2[6] = '401100'; ex2[8] = 'Facture FA-2026-0045'; ex2[9] = 'C';
    return { titre: 'Écritures comptables', fichier: 'modele_ecritures.xlsx', champs: ch, exemples: [ex, ex2], ax: ax, m: m };
  }

  function ouvrir() {
    if (!window.IMPORT_ASSISTANT) { alert('Assistant d’importation indisponible.'); return; }
    var M = modele(), m = M.m, REFS = REF(), journaux = {}, comptes = {}, ax = M.ax;
    REFS.journaux.forEach(function (j) { journaux[j.code] = j; }); REFS.comptes.forEach(function (x) { comptes[x.code] = x; });
    var per = A().periode ? A().periode() : null;
    var colM1 = 'Montant ' + m.m1;
    M.ligne = function (v) {
      var er = [], jn = v['Journal'], pc = v['N° de pièce'], d = date(v['Date de l’écriture']), cp = v['Compte'].replace(/\.0+$/, ''), aux = v['Compte auxiliaire'], sens = v['Sens (D/C)'].toUpperCase().charAt(0), mt = nombre(v[colM1]);
      if (!jn) er.push('Journal obligatoire'); else if (!journaux[jn]) er.push('Journal « ' + jn + ' » inconnu ou inactif');
      if (!pc) er.push('N° de pièce obligatoire');
      if (!d) er.push('Date de l’écriture invalide ou absente (jj/mm/aaaa)'); else if (per && (d < per.debut || d > per.fin)) er.push('Date ' + fr(d) + ' hors de ' + per.nom + ' (' + fr(per.debut) + ' – ' + fr(per.fin) + ')');
      var dp = v['Date de la pièce'] ? date(v['Date de la pièce']) : d; if (v['Date de la pièce'] && !dp) er.push('Date de la pièce invalide');
      var ec = v['Échéance'] ? date(v['Échéance']) : ''; if (v['Échéance'] && !ec) er.push('Échéance invalide');
      var cpt = comptes[cp];
      if (!cp) er.push('Compte obligatoire'); else if (!cpt) er.push('Compte « ' + cp + ' » absent du plan comptable');
      if (cpt) {
        if (cpt.collectif && !aux) er.push('Compte collectif « ' + cp + ' » : le compte auxiliaire (tiers) est obligatoire');
        else if (!cpt.collectif && aux) er.push('Compte « ' + cp + ' » non collectif : pas de compte auxiliaire');
        else if (cpt.collectif && !REFS.tiers.some(function (t) { return t.code === aux && t.collectif === cp; })) er.push('Tiers « ' + aux + ' » inconnu ou non rattaché au compte « ' + cp + ' »');
      }
      if (!v['Libellé']) er.push('Libellé obligatoire');
      if (sens !== 'D' && sens !== 'C') er.push('Sens « ' + v['Sens (D/C)'] + ' » invalide (D ou C)');
      if (isNaN(mt) || !(mt > 0)) er.push('Montant « ' + v[colM1] + ' » invalide (nombre strictement positif)');
      var m2 = m.m2 && v['Montant ' + m.m2] !== '' ? nombre(v['Montant ' + m.m2]) : null, m3 = m.m3 && v['Montant ' + m.m3] !== '' ? nombre(v['Montant ' + m.m3]) : null;
      if ((m2 !== null && isNaN(m2)) || (m3 !== null && isNaN(m3))) er.push('Montant en monnaie de reporting invalide');
      var regr = M.champs.some(function (x) { return x.col === 'Regroupement'; }) ? v['Regroupement'] : '';
      var axes = {}; ax.forEach(function (a) { if (v[a.col]) axes[a.nom] = v[a.col]; });
      var existe = !er.length && pieces().some(function (p) { return p.journal === jn && p.piece === pc; });
      return { cle: '', libDoublon: 'pièce ' + jn + ' / ' + pc, doublon: existe, erreurs: er, data: { journal: jn, piece: pc, date: d, datePiece: dp || d, facture: v['N° de facture'], reference: v['Référence'], compte: cp, aux: aux, libelle: v['Libellé'], sens: sens === 'D' ? 'DEBIT' : 'CREDIT', montant: mt, m2: m2, m3: m3, echeance: ec, regr: regr, axes: axes, cle: jn + '|' + pc } };
    };
    // chaque pièce du fichier doit être équilibrée (débit = crédit)
    M.controle = function (L) {
      var S = {}, out = [];
      L.forEach(function (x) { var k = x.data.cle; S[k] = S[k] || { d: 0, c: 0, l: [] }; if (x.data.sens === 'DEBIT') S[k].d += x.data.montant; else S[k].c += x.data.montant; S[k].l.push(x.n); });
      Object.keys(S).forEach(function (k) { var e = Math.round((S[k].d - S[k].c) * 100) / 100; if (e) S[k].l.forEach(function (n) { out.push({ n: n, cause: 'Pièce « ' + k.replace('|', ' / ') + ' » déséquilibrée : débit ' + S[k].d.toLocaleString('fr-FR') + ' ≠ crédit ' + S[k].c.toLocaleString('fr-FR') }); }); });
      return out;
    };
    M.integrer = function (L) {
      var P = {}, ordre = [], REFS2 = REF(), api = window.COURS_API;
      L.forEach(function (x) { var d = x.data; if (!P[d.cle]) { P[d.cle] = { journal: d.journal, piece: d.piece, date: d.date, datePiece: d.datePiece, facture: d.facture, reference: d.reference, lignes: [], source: 'import' }; ordre.push(d.cle); }
        var t = d.aux ? REFS2.tiers.filter(function (y) { return y.code === d.aux && y.collectif === d.compte; })[0] : null;
        function conv(code, saisi) { if (saisi !== null && saisi !== undefined && !isNaN(saisi)) return saisi; var r = code && api ? api.taux(code, d.date) : null; return r > 0 ? Math.round(d.montant / r * 100) / 100 : 0; }
        P[d.cle].lignes.push({ compte: d.compte, tiers: d.aux, libelle: d.libelle, sens: d.sens, montant: d.montant, montant1: conv(m.m2, d.m2), montant2: conv(m.m3, d.m3), echeance: d.echeance, regr: d.regr, axes: d.axes });
        if (t && window.TIERS_MARQUER) window.TIERS_MARQUER(t.collectif, t.code); });
      var remplacees = 0;
      ordre.forEach(function (k) { var p = P[k], i = -1; pieces().forEach(function (q, j) { if (i < 0 && q.journal === p.journal && q.piece === p.piece) i = j; }); if (i >= 0) { pieces()[i] = p; remplacees++; } else pieces().push(p); });
        window.dispatchEvent(new Event('ecritures-pieces-changed'));
      try { localStorage.setItem('softcompta.pieces', JSON.stringify(pieces().slice(-500))); } catch (e) {}
      window.dispatchEvent(new Event('ecritures-pieces-changed'));
      if (A().notifier) A().notifier(ordre.length + ' pièce(s) intégrée(s) (' + L.length + ' ligne(s))' + (remplacees ? ', dont ' + remplacees + ' remplacée(s)' : '') + '.');
    };
    window.IMPORT_ASSISTANT.ouvrir(M);
  }

  // bouton de la barre d'actions (relayé par barre_actions.js) ; l'ancien import natif et la matrice sont remplacés par l'assistant commun (modèle téléchargeable)
  var hote = R.querySelector('.entry-import-actions');
  if (hote) {
    [].slice.call(hote.querySelectorAll('button,label')).forEach(function (e) { if (/matrice d.import|importer excel/i.test(e.textContent)) e.remove(); });
    var b = document.createElement('button'); b.type = 'button'; b.className = 'inline-flex min-h-10 items-center'; b.innerHTML = '<i class="ti ti-upload" aria-hidden="true"></i> Importer des écritures'; b.title = 'Importer des écritures depuis un fichier Excel'; b.addEventListener('click', ouvrir); hote.insertBefore(b, hote.firstChild);
  }
  window.ECRITURES_IMPORT = { ouvrir: ouvrir };
})();
