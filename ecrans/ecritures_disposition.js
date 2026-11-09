// Saisie d'écritures : disposition harmonisée (bordereau en 3 colonnes, bloc de ligne, totaux et actions à droite) branchée sur les paramètres de l'entité.
// - monnaies (Administration de l'entité › Personnalisation) : M1 tenue de compte, M2 / M3 de reporting facultatives → montants, cours, totaux et colonnes suivent ;
// - cours proposés automatiquement (Gestion des cours › Saisie) à la date de la pièce ; saisie dans la devise du journal si le journal est géré en devise ;
// - plans analytiques activés (plus de quatre axes : rangée pleine largeur) et devis programme (champ Engagement) : voir ecritures.js et ecritures_disposition.css.
// Ne change pas les règles de saisie (ecritures.js) : réorganise l'affichage, renomme les libellés et ajoute les champs des monnaies supplémentaires.
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  function c(n) { return R.querySelector('[formcontrolname="' + n + '"]'); }
  function parse(s) { var n = parseFloat(String(s || '').replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function MON() { var f = window.ENTITE_MONNAIES; return f ? f() : { m1: 'MGA', m2: 'USD', m3: '' }; }
  function lab(w, t, gras) { var l = w && w.querySelector('label'); if (!l) return; l.innerHTML = gras ? t.replace(/\b([A-Z]{3})\b/, '<b>$1</b>') : t; l.style.textTransform = 'none'; }
  var ligne = R.querySelector('.hd-ligne'); if (!ligne) return;

  // ----- bordereau : champs repérés, libellés de référence -----
  ['site', 'exercice', 'journal', 'dp'].forEach(function (k) { var w = ligne.querySelector('.header-field-' + k); if (w) w.classList.add('ec-f', 'ec-f-' + k); });
  ['dateEcriture', 'datePiece', 'cours1', 'facture', 'reference', 'piece'].forEach(function (n) { var i = c(n), w = i && i.parentElement; if (w) w.classList.add('ec-f', 'ec-f-' + n); });
  lab(ligne.querySelector('.ec-f-site'), 'SITE'); lab(ligne.querySelector('.ec-f-dp'), 'Engagement'); lab(ligne.querySelector('.ec-f-journal'), 'Code du journal');
  lab(ligne.querySelector('.ec-f-exercice'), 'Exercice'); lab(ligne.querySelector('.ec-f-dateEcriture'), 'Date de l’écriture'); lab(ligne.querySelector('.ec-f-datePiece'), 'Date de la pièce');
  lab(ligne.querySelector('.ec-f-piece'), 'Numéro de pièce'); lab(ligne.querySelector('.ec-f-facture'), 'N° de facture'); lab(ligne.querySelector('.ec-f-reference'), 'Référence');

  // cours de la 3ᵉ monnaie : même champ que le cours de M2
  var w1 = ligne.querySelector('.ec-f-cours1'), w2 = null;
  if (w1) { w2 = w1.cloneNode(true); w2.className = w1.className.replace('ec-f-cours1', 'ec-f-cours2'); var i2 = w2.querySelector('input'); if (i2) { i2.setAttribute('formcontrolname', 'cours2'); i2.value = ''; } w1.parentNode.insertBefore(w2, w1.nextSibling); }
  ligne.querySelectorAll('.ec-f-cours1 input, .ec-f-cours2 input').forEach(function (i) { i.setAttribute('inputmode', 'decimal'); });
  // les deux cours de reporting côte à côte sur une même ligne
  var kw = document.createElement('div'); kw.className = 'ec-cours'; if (w1) { w1.parentNode.insertBefore(kw, w1); kw.appendChild(w1); if (w2) kw.appendChild(w2); }

  // ----- bloc de ligne -----
  var gen = R.querySelector('.entry-general-fields'); if (!gen) return;
  function cl(s) { return gen.querySelector(s); }
  lab(cl('.entry-field-compte-general'), 'Compte'); lab(cl('.entry-field-compte-tiers'), 'Auxiliaire'); lab(cl('.entry-compact-contract'), 'Contrat'); lab(cl('.entry-field-echeance'), 'Échéance');
  lab(cl('.entry-field-libelle'), 'Libellé');
  // montants + sens : un conteneur extensible ; le montant de la 3ᵉ monnaie est ajouté ici (même champ que M2)
  var mt = document.createElement('div'); mt.className = 'ec-montants';
  var f1 = cl('.entry-field-devise-1'), f2 = null;
  if (f1) { f2 = f1.cloneNode(true); f2.className = f1.className.replace('entry-field-devise-1', 'entry-field-devise-2'); var d2 = f2.querySelector('input'); if (d2) { d2.setAttribute('formcontrolname', 'devise2'); d2.value = ''; } }
  [cl('.entry-field-devise-locale'), f1, f2, cl('.entry-compact-sens')].forEach(function (e) { if (e) mt.appendChild(e); });
  gen.insertBefore(mt, cl('.entry-compact-analytic-slot'));
  // plan de regroupement (Administration de l'entité › Analytique) : liste déroulante à droite de l'échéance, si le plan est activé
  var ech = cl('.entry-field-echeance'), axe0 = cl('.entry-field-axe select');
  var rw = document.createElement('div'); rw.className = 'entry-field-regr'; rw.setAttribute('data-regr', '');
  rw.innerHTML = '<label>Regroupement</label><select formcontrolname="regroupement" aria-label="Plan de regroupement" class="' + (axe0 ? axe0.className : 'w-full') + '"></select>';
  if (ech) ech.parentNode.insertBefore(rw, ech.nextSibling);
  function majRegr() {
    var s = rw.querySelector('select'), g = window.REGROUPEMENT && window.REGROUPEMENT(), v = s.value; if (!g) return;
    rw.querySelector('label').textContent = 'Regroupement'; rw.title = 'Plan de regroupement : ' + g.planLibelle + (g.niveauLibelle ? ' — ' + g.niveauLibelle : '');
    s.innerHTML = '<option value="">Sélectionner un élément</option>' + g.elements.map(function (x) { return '<option value="' + x.code + '">' + x.code + ' — ' + String(x.libelle).replace(/</g, '&lt;') + '</option>'; }).join('');
    s.value = v; if (s.value !== v) s.value = '';
    if (window.__renderLignes) window.__renderLignes();
  }
  ['regroupement-changed', 'plans-changed', 'plans-actifs'].forEach(function (ev) { window.addEventListener(ev, majRegr); });
  window.addEventListener('hashchange', function () { if (location.hash === '#ecritures' || location.hash === '#ecritures_ent') setTimeout(majRegr, 300); });
  setTimeout(majRegr, 600); setTimeout(majRegr, 2500);
  var h3 = R.querySelector('.entry-general > div > h3'); if (h3) h3.parentElement.style.display = 'none';
  var sensLab = cl('.entry-field-sens label'); if (sensLab) sensLab.style.display = 'none';
  // plans analytiques : plus de quatre axes visibles → rangée pleine largeur
  var axes = cl('.entry-axes-ligne');
  function nAxes() { var n = [].filter.call(axes.querySelectorAll('.entry-field-axe'), function (a) { return !a.classList.contains('plan-off') && a.style.display !== 'none' && !a.hidden; }).length; gen.classList.toggle('ec-axes-plus', n > 4); }
  if (axes) { new MutationObserver(nAxes).observe(axes, { subtree: true, childList: true, attributes: true, attributeFilter: ['class', 'style', 'hidden'] }); nAxes(); }

  // ----- séquence de saisie de l'en-tête (touche Tab) : 1 centre, 2 journal, 3 exercice, [engagement], 4 date comptable, 5 date de la pièce, 6-7 cours, 8 n° de facture, 9 référence, 10 n° de pièce -----
  // l'ordre du DOM suit la séquence ; Tab sur le n° de pièce valide l'en-tête, le verrouille et ouvre la saisie des lignes
  ['site', 'journal', 'exercice', 'dp', 'dateEcriture', 'datePiece'].forEach(function (k) { var w = ligne.querySelector('.ec-f-' + k); if (w) ligne.appendChild(w); });
  if (kw) ligne.appendChild(kw);
  ['facture', 'reference', 'piece'].forEach(function (k) { var w = ligne.querySelector('.ec-f-' + k); if (w) ligne.appendChild(w); });
  var bord = R.querySelector('.entry-bordereau'), entOuvert = false;
  var aide = document.createElement('div'); aide.className = 'ec-aide'; bord.insertBefore(aide, bord.firstChild);
  var msgAide = document.createElement('span'); aide.appendChild(msgAide);
  var fs = gen.closest('fieldset'); if (!fs) return;
  var dr = document.createElement('aside'); dr.className = 'ec-droite'; dr.setAttribute('aria-label', 'Totaux et actions');
  dr.innerHTML = '<table class="ec-tot" data-no-tf data-no-pg><thead><tr><th>Monnaie</th><th>DÉBIT</th><th>CRÉDIT</th><th>SOLDE</th></tr></thead><tbody>' +
    ['m1', 'm2', 'm3'].map(function (k) { return '<tr data-r="' + k + '"><th data-th="' + k + '">' + k.toUpperCase() + '</th><td data-t="d' + k + '">0,00</td><td data-t="c' + k + '">0,00</td><td data-t="s' + k + '">0,00</td></tr>'; }).join('') +
    '</tbody></table><div class="ec-actions"></div>';
  fs.appendChild(dr);
  var tb = R.querySelector('.entry-crud-toolbar'); if (tb) { dr.querySelector('.ec-actions').appendChild(tb); [].forEach.call(tb.querySelectorAll('button'), function (b) { var t = b.textContent.replace(/\s+/g, ' ').trim(); if (t) { b.title = t; b.setAttribute('aria-label', t); } }); }
  function totaux() {
    var T = window.__ecTotaux || { d: 0, c: 0, d1: 0, c1: 0, d2: 0, c2: 0 };
    [['m1', T.d, T.c], ['m2', T.d1, T.c1], ['m3', T.d2 || 0, T.c2 || 0]].forEach(function (x) {
      var k = x[0], s = Math.round((x[1] - x[2]) * 100) / 100;
      function set(n, v) { var e = dr.querySelector('[data-t="' + n + k + '"]'); if (e) e.textContent = fmt(v); }
      set('d', x[1]); set('c', x[2]); set('s', s);
      var se = dr.querySelector('[data-t="s' + k + '"]'); if (se) se.classList.toggle('ec-ko', !!s);
    });
    // équilibre par élément du plan de regroupement (monnaie locale) : obligatoire avant de valider la pièce
    var tbd = dr.querySelector('tbody'); [].forEach.call(tbd.querySelectorAll('tr[data-rg]'), function (r) { r.remove(); });
    (window.__ecRegr || []).forEach(function (x) {
      var tr = document.createElement('tr'); tr.setAttribute('data-rg', x.code); tr.title = 'Équilibre du regroupement ' + (x.code || 'non renseigné');
      tr.innerHTML = '<th>' + (x.code ? 'Regr. ' + x.code : 'Sans regr.') + '</th><td>' + fmt(x.d) + '</td><td>' + fmt(x.c) + '</td><td' + (x.s || !x.code ? ' class="ec-ko"' : '') + '>' + fmt(x.s) + '</td>';
      tbd.appendChild(tr);
    });
    [].forEach.call(tbd.querySelectorAll('tr[data-ct]'), function (r) { r.remove(); });
    (window.__ecContrat || []).forEach(function (x) {
      var tr = document.createElement('tr'); tr.setAttribute('data-ct', x.code); tr.title = 'Équilibre du contrat ' + x.code;
      tr.innerHTML = '<th>Contrat ' + x.code + '</th><td>' + fmt(x.d) + '</td><td>' + fmt(x.c) + '</td><td' + (x.s ? ' class="ec-ko"' : '') + '>' + fmt(x.s) + '</td>';
      tbd.appendChild(tr);
    });
  }
  window.addEventListener('ecritures-totaux', totaux); totaux();

  // ----- verrouillage : saisie des lignes ouverte seulement quand l'en-tête est terminé -----
  function champsEntete() { return [].slice.call(ligne.querySelectorAll('input:not([type=hidden]),button,select,textarea')); }
  function etat(ouvertLignes) {
    entOuvert = !ouvertLignes;
    fs.disabled = !ouvertLignes; fs.classList.toggle('ec-verrou', !ouvertLignes);
    bord.classList.toggle('ec-entete-verrou', ouvertLignes);
    champsEntete().forEach(function (c) { c.disabled = ouvertLignes; });
    msgAide.textContent = '';
    aide.classList.toggle('ec-aide-ok', ouvertLignes);
  }
  function ouvrirLignes() {
    if (window.__ecEntete && !window.__ecEntete.pret()) return false;
    etat(true);
    window.dispatchEvent(new Event('ecritures-lignes-ouvertes'));   // journal de trésorerie : choix de l'opération (ecritures_tresorerie.js)
    var b = cl('.entry-field-compte-general .custom-select-wrapper>button'); if (b) setTimeout(function () { b.focus(); }, 30);
    return true;
  }
  function rouvrirEntete(focus) { etat(false); window.dispatchEvent(new Event('ecritures-entete-rouvert')); if (focus) { var b = ligne.querySelector('.ec-f-site button'); if (b) b.focus(); } }
  if (window.__ecEntete) { window.__ecEntete.ouvrirLignes = ouvrirLignes; window.__ecEntete.rouvrirEntete = rouvrirEntete; }
  var pc = c('piece');
  if (pc) pc.addEventListener('keydown', function (e) { if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !entFerme()) { e.preventDefault(); ouvrirLignes(); } });
  function entFerme() { return !entOuvert; }
  window.addEventListener('ecritures-entete-ouvert', function () { setTimeout(function () { rouvrirEntete(false); }, 0); });
  etat(false);

  // ----- monnaies paramétrées : libellés, champs visibles, conversion par les cours -----
  var mL = c('deviseLocale'), mD = c('devise1'), mD3 = c('devise2'), k1 = c('cours1'), k2 = c('cours2');
  function off(e, o) { if (e) e.classList.toggle('ec-off', !!o); }
  function appliquerMonnaies() {
    var m = MON();
    lab(cl('.entry-field-devise-locale'), 'Montant en ' + m.m1, true);
    lab(f1, 'Montant Rap. ' + (m.m2 || ''), true); lab(f2, 'Montant Rap. ' + (m.m3 || ''), true);
    lab(w1, 'Cours Rap. ' + (m.m2 || ''), true); lab(w2, 'Cours Rap. ' + (m.m3 || ''), true);
    off(f1, !m.m2); off(f2, !m.m3); off(w1, !m.m2); off(w2, !m.m3);
    var th = function (k, t) { var e = dr.querySelector('[data-th="' + k + '"]'); if (e) e.textContent = t; };
    th('m1', m.m1); th('m2', m.m2 || 'M2'); th('m3', m.m3 || 'M3');
    dr.querySelector('[data-r="m2"]').style.display = m.m2 ? '' : 'none'; dr.querySelector('[data-r="m3"]').style.display = m.m3 ? '' : 'none';
    ligne.classList.toggle('ec-m3', !!m.m3);
    proposerCours(); if (window.__renderLignes) window.__renderLignes();
  }
  // cours proposés par Gestion des cours › Saisie : pour chaque monnaie de reporting, dernier cours en vigueur à la date comptable de l'écriture
  function isoDate() { var d = c('dateEcriture'); return d && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d.value) ? d.value : ''; }
  function fr(d) { return d ? d.split('-').reverse().join('/') : ''; }
  function coursDe(code, d) { var r = null; (window.COURS || []).forEach(function (x) { if (x.devise === code && x.date <= d && (!r || x.date > r.date)) r = x; }); return r; }
  function proposerCours() {
    var m = MON(), d = isoDate();
    [[k1, m.m2], [k2, m.m3]].forEach(function (p) {
      var i = p[0], code = p[1]; if (!i) return;
      if (!code) { i.value = ''; return; }
      if (!d) { i.value = ''; i.placeholder = 'Date comptable requise'; i.title = 'Le cours ' + code + ' est proposé à la date comptable de l’écriture'; return; }
      var r = coursDe(code, d);
      i.value = r && r.parite > 0 ? String(r.parite).replace('.', ',') : '';
      i.placeholder = r ? '' : 'Aucun cours au ' + fr(d);
      i.title = r ? 'Cours ' + code + ' du ' + fr(r.date) + ' (Gestion des cours › Saisie) : 1 ' + code + ' = ' + String(r.parite).replace('.', ',') + ' ' + m.m1 : 'Aucun cours ' + code + ' à la date du ' + fr(d) + ' : saisissez-le dans Gestion des cours › Saisie';
    });
    converti();
  }
  // saisie dans la devise du journal (journal géré en devise) : les autres montants se calculent
  var baseCle = 'm1';
  function champs() { return { m1: mL, m2: mD, m3: mD3 }; }
  function taux() { return { m1: 1, m2: parse(k1 && k1.value), m3: parse(k2 && k2.value) }; }
  function converti(src) {
    var F = champs(), T = taux(), m = MON(); src = src || baseCle;
    var xs = F[src];
    if (xs && T[src] > 0) {
      var v1 = parse(xs.value) * T[src];
      ['m1', 'm2', 'm3'].forEach(function (k) { if (k === src || !F[k] || (k === 'm2' && !m.m2) || (k === 'm3' && !m.m3)) return; if (T[k] > 0) F[k].value = v1 ? fmt(v1 / T[k]) : ''; });
    }
    majLecture();
  }
  function majLecture() {
    var F = champs(), T = taux();
    ['m1', 'm2', 'm3'].forEach(function (k) { var i = F[k]; if (!i) return; i.readOnly = k !== baseCle && T[k] > 0 && T[baseCle] > 0; i.classList.toggle('ec-calc', i.readOnly); });
  }
  [['m1', mL], ['m2', mD], ['m3', mD3]].forEach(function (p) { if (p[1]) p[1].addEventListener('input', function () { if (p[0] === baseCle) converti(p[0]); }); });
  [k1, k2].forEach(function (i) { if (i) i.addEventListener('input', function () { converti(); }); });
  var dt = c('dateEcriture'); if (dt) { dt.addEventListener('change', proposerCours); dt.addEventListener('input', proposerCours); dt.addEventListener('blur', proposerCours); }
  // journal géré en devise (Paramétrages › Saisie des plans › Journaux) : la saisie se fait dans la devise du journal
  var jr = c('journalCode'), dernier = null;
  function suiviJournal() {
    if (!jr) return; var code = jr.value; if (code === dernier) return; dernier = code;
    var j = ((window.ECRITURES_REF && window.ECRITURES_REF.journaux) || []).filter(function (x) { return x.code === code || String(x.code).indexOf(code) === 0; })[0], dv = j && j.devise ? j.devise : '', m = MON();
    baseCle = dv && dv === m.m2 ? 'm2' : dv && dv === m.m3 ? 'm3' : 'm1';
    majLecture();
  }
  setInterval(suiviJournal, 500);
  window.addEventListener('entite-options-changed', appliquerMonnaies); window.addEventListener('devises-changed', proposerCours); window.addEventListener('cours-changed', proposerCours);
  appliquerMonnaies(); setTimeout(proposerCours, 700);
})();
