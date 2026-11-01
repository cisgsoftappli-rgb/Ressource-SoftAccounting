// Saisie d'écritures › journaux de trésorerie : après validation de l'en-tête (Tab sur le n° de pièce), une fenêtre propose le choix de l'opération.
//  - « Paiement d'un tiers » : la saisie des lignes devient une recherche des factures non payées du tiers (compte collectif + code tiers) ; on coche les factures à apurer,
//    on fixe le pourcentage à payer, et la validation ajoute les lignes de règlement à la pièce ; la contrepartie est générée sur le compte associé du journal.
//  - « Autres opérations » : saisie normale ; la ligne du compte associé au journal est générée automatiquement en contrepartie des lignes saisies (voir ecritures.js › majContrepartie).
// Les factures proviennent du registre des pièces (window.ECRITURES_PIECES : pièces saisies et importées ; quelques factures de démonstration sont créées au premier usage).
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  var A = function () { return window.__ecEntete || {}; };
  function REF() { return window.ECRITURES_REF || { comptes: [], tiers: [], journaux: [] }; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function nombre(s) { var n = parseFloat(String(s || '').replace(/[\s ]/g, '').replace(',', '.')); return isNaN(n) ? 0 : n; }
  function fr(d) { return d ? String(d).split('-').reverse().join('/') : ''; }
  function c(n) { return R.querySelector('[formcontrolname="' + n + '"]'); }
  function pieces() { return window.ECRITURES_PIECES = window.ECRITURES_PIECES || []; }
  function sensFacture(coll) { return /^41/.test(coll) ? 'DEBIT' : 'CREDIT'; }   // clients : facture au débit ; fournisseurs, personnel… : au crédit

  /* ---------- style ---------- */
  var css = document.createElement('style');
  css.textContent = '.tz-ov{position:fixed;inset:0;z-index:3500;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.tz-md{width:min(640px,100%);border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.tz-md h2{margin:0;padding:14px 20px;border-bottom:1px solid #E9EBF0;font:600 18px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}.tz-b{padding:16px 20px}.tz-b p{margin:0 0 12px;font-size:13px;color:#5B606D}' +
    '.tz-cx{display:grid;grid-template-columns:1fr 1fr;gap:14px}@media(max-width:560px){.tz-cx{grid-template-columns:1fr}}' +
    '.tz-ch{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px;border:1px solid #D6D9E0;border-radius:10px;background:#fff;text-align:left;cursor:pointer;font:inherit}.tz-ch:hover,.tz-ch:focus-visible{border-color:#2E427B;background:#F4F7FE;outline:none;box-shadow:0 0 0 3px rgba(46,66,123,.12)}' +
    '.tz-ch i{font-size:28px;color:#2E427B}.tz-ch b{font-size:14px;color:#0B1332}.tz-ch span{font-size:12px;color:#5B606D}' +
    '.tz-pay{display:flex;flex-direction:column;gap:10px;padding:14px 18px;border:1px solid #D6D9E0;border-radius:8px;background:#F5F7F9;min-width:0}.tz-pay[hidden]{display:none}' +
    '.tz-pay h3{margin:0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#2E427B}' +
    '.tz-rech{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px 14px}.tz-rech label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:600;color:#474C58}' +
    '.tz-in{height:34px;box-sizing:border-box;width:100%;border:1px solid #D6D9E0;border-radius:6px;background:#fff;padding:0 10px;font:inherit;font-size:12.5px;color:#353944}.tz-in:focus{outline:none;border-color:#2E427B;box-shadow:0 0 0 3px rgba(46,66,123,.12)}.tz-in.r{text-align:right}' +
    '.tz-sc{max-height:230px;overflow:auto;border:1px solid #E9EBF0;border-radius:6px;background:#fff}.tz-t{width:100%;border-collapse:collapse;font-size:12px}.tz-t th{position:sticky;top:0;background:#F5F7F9;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;color:#5B606D;border-bottom:1px solid #E9EBF0;white-space:nowrap}.tz-t td{padding:4px 8px;border-bottom:1px solid #F1F2F5;vertical-align:middle}.tz-t td.r,.tz-t th.r{text-align:right;font-variant-numeric:tabular-nums}.tz-t td .tz-in{height:28px;width:70px}' +
    '.tz-t tr.on td{background:#EEF3FE}.tz-vide{padding:22px;text-align:center;color:#5B606D;font-size:12px}.tz-pied{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}.tz-pied b{font-variant-numeric:tabular-nums}' +
    '.tz-bt{min-height:34px;padding:0 14px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font-weight:600;font-size:12.5px;cursor:pointer}.tz-bt:hover{background:#F4F7FE}.tz-bt.p{background:#2E427B;color:#fff}.tz-bt:disabled{opacity:.45;cursor:not-allowed}' +
    '.tz-chip{display:inline-flex;align-items:center;gap:8px;padding:2px 10px;border-radius:12px;background:#E3EBFE;color:#243569;font-size:12px;font-weight:600}.tz-chip button{border:0;background:none;color:#2E427B;text-decoration:underline;cursor:pointer;font:inherit}' +
    '[data-screen="ecritures"] .ec-mode-pay .entry-general-wrap{display:none!important}';
  document.head.appendChild(css);

  /* ---------- factures non payées ---------- */
  function seedDemo() {
    if (pieces().some(function (p) { return p.source === 'demo'; })) return;
    var Rf = REF(), colls = Rf.comptes.filter(function (x) { return x.collectif; }), jr = (Rf.journaux[0] || {}).code || '01ACHAT';
    var charge = (Rf.comptes.filter(function (x) { return /^6/.test(x.code) && !x.collectif; })[0] || {}).code, produit = (Rf.comptes.filter(function (x) { return /^7/.test(x.code) && !x.collectif; })[0] || {}).code, n = 0;
    [[colls.filter(function (x) { return /^40/.test(x.code); })[0], 'CREDIT', charge], [colls.filter(function (x) { return /^41/.test(x.code); })[0], 'DEBIT', produit]].forEach(function (cfg) {
      var cc = cfg[0]; if (!cc || !cfg[2]) return;
      Rf.tiers.filter(function (t) { return t.collectif === cc.code; }).slice(0, 3).forEach(function (t, k) {
        [0, 1].forEach(function (j) {
          var mt = [1250000, 860000, 430000][(k + j) % 3] * (j ? 1.5 : 1), d = '2026-0' + (8 + j) + '-1' + (k + 2), ref = 'FA-' + (2000 + (++n));
          pieces().push({ journal: jr, piece: 'DEMO' + ('000' + n).slice(-4), date: d, datePiece: d, facture: ref, reference: '', source: 'demo', lignes: [
            { compte: cc.code, tiers: t.code, libelle: 'Facture ' + ref + ' ' + t.label, sens: cfg[1], montant: mt, montant1: 0, montant2: 0, echeance: '', regle: 0 },
            { compte: cfg[2], tiers: '', libelle: 'Facture ' + ref + ' ' + t.label, sens: cfg[1] === 'CREDIT' ? 'DEBIT' : 'CREDIT', montant: mt, montant1: 0, montant2: 0, echeance: '' }] });
        });
      });
    });
  }
  function ouvertes(coll, tiers, recherche) {
    var L = [], q = String(recherche || '').toLowerCase();
    pieces().forEach(function (p) { p.lignes.forEach(function (l, i) {
      if (l.auto || l.compte !== coll || l.tiers !== tiers || l.sens !== sensFacture(coll)) return;
      var reste = Math.round((l.montant - (l.regle || 0)) * 100) / 100; if (reste <= 0.005) return;
      var txt = (p.piece + ' ' + p.facture + ' ' + l.libelle).toLowerCase(); if (q && txt.indexOf(q) < 0) return;
      L.push({ k: p.journal + '|' + p.piece + '|' + i, journal: p.journal, piece: p.piece, i: i, date: p.datePiece || p.date, facture: p.facture, libelle: l.libelle, total: l.montant, regle: l.regle || 0, reste: reste });
    }); });
    return L.sort(function (a, b) { return a.date < b.date ? -1 : 1; });
  }
  // met à jour le registre quand une pièce de règlement est enregistrée (ecritures.js)
  window.ECRITURES_APURER = function (ap, montant) {
    var p = pieces().filter(function (x) { return x.journal === ap.journal && x.piece === ap.piece; })[0]; if (!p || !p.lignes[ap.i]) return;
    p.lignes[ap.i].regle = Math.round(((p.lignes[ap.i].regle || 0) + montant) * 100) / 100;
  };

  /* ---------- panneau de recherche (paiement d'un tiers) ---------- */
  var gen = R.querySelector('.entry-general-fields'), fs = gen && gen.closest('fieldset'), blocGen = gen && gen.closest('.entry-general') && gen.closest('.entry-general').parentElement, pay = null, st = { sel: {}, coll: '', tiers: '', q: '' };
  if (blocGen) blocGen.classList.add('entry-general-wrap');
  function panneau() {
    if (pay || !fs) return pay;
    pay = document.createElement('div'); pay.className = 'tz-pay'; pay.hidden = true;
    pay.innerHTML = '<div class="tz-rech"><label>Compte collectif<select class="tz-in" data-tz="coll"></select></label><label>Tiers<select class="tz-in" data-tz="tiers"></select></label><label>Rechercher (n° de pièce, facture, libellé)<input class="tz-in" data-tz="q" autocomplete="off" placeholder="Filtrer les factures"></label></div>' +
      '<div class="tz-sc"><table class="tz-t"><thead><tr><th style="width:30px"><input type="checkbox" data-tz="tout" aria-label="Tout sélectionner"></th><th>Date</th><th>Pièce</th><th>N° de facture</th><th>Libellé</th><th class="r">Total</th><th class="r">Déjà réglé</th><th class="r">Reste dû</th><th class="r">% à payer</th><th class="r">Montant à payer</th></tr></thead><tbody data-tz="lignes"></tbody></table><div class="tz-vide" data-tz="vide" hidden></div></div>' +
      '<div class="tz-pied" style="justify-content:flex-end;gap:24px">' +
      '<span>Total à payer : <b data-tz="total">0,00</b></span><button type="button" class="tz-bt p" data-tz="valider" disabled><i class="ti ti-check"></i> Valider le paiement</button></div>';
    fs.insertBefore(pay, fs.querySelector('.ec-droite') || null);
    pay.addEventListener('input', surEntree); pay.addEventListener('change', surChangement); pay.addEventListener('click', surClic);
    return pay;
  }
  function Q(k) { return pay.querySelector('[data-tz="' + k + '"]'); }
  function remplirTiers() {
    var Rf = REF(), colls = Rf.comptes.filter(function (x) { return x.collectif; });
    if (!st.coll) st.coll = (colls.filter(function (x) { return /^40/.test(x.code); })[0] || colls[0] || {}).code || '';
    Q('coll').innerHTML = colls.map(function (x) { return '<option value="' + esc(x.code) + '"' + (x.code === st.coll ? ' selected' : '') + '>' + esc(x.code + ' — ' + x.label) + '</option>'; }).join('');
    var T = Rf.tiers.filter(function (t) { return t.collectif === st.coll; }); if (!T.some(function (t) { return t.code === st.tiers; })) st.tiers = (T[0] || {}).code || '';
    Q('tiers').innerHTML = T.map(function (t) { return '<option value="' + esc(t.code) + '"' + (t.code === st.tiers ? ' selected' : '') + '>' + esc(t.code + ' — ' + t.label) + '</option>'; }).join('') || '<option value="">Aucun tiers</option>';
  }
  function dessiner() {
    var L = ouvertes(st.coll, st.tiers, st.q);
    Q('lignes').innerHTML = L.map(function (x) {
      var s = st.sel[x.k], on = !!s;
      return '<tr class="' + (on ? 'on' : '') + '" data-k="' + esc(x.k) + '"><td><input type="checkbox" data-tz-c' + (on ? ' checked' : '') + ' aria-label="Apurer la facture ' + esc(x.facture || x.piece) + '"></td><td>' + fr(x.date) + '</td><td>' + esc(x.journal + ' / ' + x.piece) + '</td><td>' + esc(x.facture) + '</td><td>' + esc(x.libelle) + '</td>' +
        '<td class="r">' + fmt(x.total) + '</td><td class="r">' + fmt(x.regle) + '</td><td class="r">' + fmt(x.reste) + '</td><td class="r"><input class="tz-in r" data-tz-p value="' + (on ? s.pct : 100) + '" ' + (on ? '' : 'disabled') + ' inputmode="decimal"></td><td class="r" data-tz-m>' + (on ? fmt(montantDe(x, s.pct)) : '') + '</td></tr>';
    }).join('');
    var v = Q('vide'); v.hidden = L.length > 0; v.textContent = st.tiers ? 'Aucune facture non payée pour ce tiers' + (st.q ? ' avec ce filtre' : '') + '.' : 'Sélectionnez un tiers.';
    pay._L = L; total();
  }
  function montantDe(x, pct) { return Math.min(x.reste, Math.round(x.total * (nombre(pct) / 100) * 100) / 100); }
  function total() {
    var t = 0, n = 0; (pay._L || []).forEach(function (x) { var s = st.sel[x.k]; if (s) { t += montantDe(x, s.pct); n++; } });
    Q('total').textContent = fmt(t); Q('valider').disabled = !(t > 0);
  }
  function surEntree(e) {
    var t = e.target; if (t.dataset.tz === 'q') { st.q = t.value; dessiner(); return; }
    if (t.hasAttribute('data-tz-p')) { var tr = t.closest('tr'), k = tr.dataset.k, s = st.sel[k]; if (!s) return; s.pct = t.value; var x = pay._L.filter(function (y) { return y.k === k; })[0]; tr.querySelector('[data-tz-m]').textContent = fmt(montantDe(x, s.pct)); total(); }
  }
  function surChangement(e) {
    var t = e.target;
    if (t.dataset.tz === 'coll') { st.coll = t.value; st.tiers = ''; st.sel = {}; remplirTiers(); dessiner(); return; }
    if (t.dataset.tz === 'tiers') { st.tiers = t.value; st.sel = {}; dessiner(); return; }
    if (t.dataset.tz === 'tout') { (pay._L || []).forEach(function (x) { if (t.checked) st.sel[x.k] = st.sel[x.k] || { pct: '100' }; else delete st.sel[x.k]; }); dessiner(); return; }
    if (t.hasAttribute('data-tz-c')) { var k = t.closest('tr').dataset.k; if (t.checked) st.sel[k] = { pct: '100' }; else delete st.sel[k]; dessiner(); }
  }
  function surClic(e) {
    if (e.target.closest('[data-tz="valider"]')) valider();
  }
  function valider() {
    var Rf = REF(), coll = Rf.comptes.filter(function (x) { return x.code === st.coll; })[0], tiers = Rf.tiers.filter(function (t) { return t.code === st.tiers && t.collectif === st.coll; })[0];
    var k1 = nombre(c('cours1') && c('cours1').value), k2 = nombre(c('cours2') && c('cours2').value), L = [];
    function conv(m) { return { montant1: k1 > 0 ? Math.round(m / k1 * 100) / 100 : 0, montant2: k2 > 0 ? Math.round(m / k2 * 100) / 100 : 0 }; }
    (pay._L || []).forEach(function (x) { var s = st.sel[x.k]; if (!s) return; var m = montantDe(x, s.pct); if (!(m > 0)) return;
      L.push(Object.assign({ compte: { code: coll.code, label: coll.label, collectif: true }, tiers: tiers ? { code: tiers.code, label: tiers.label, collectif: tiers.collectif } : null, libelle: 'Règlement ' + (x.facture ? 'facture ' + x.facture : 'pièce ' + x.piece) + (tiers ? ' ' + tiers.label : ''), montant: m, sens: sensFacture(st.coll) === 'CREDIT' ? 'DEBIT' : 'CREDIT', echeance: '', apure: { journal: x.journal, piece: x.piece, i: x.i } }, conv(m))); });
    if (!L.length) return;
    A().ajouterLignes(L); st.sel = {};
    pay.hidden = true; if (blocGen) blocGen.style.display = '';   // retour à la saisie normale ; « Changer » rouvre la recherche des factures
  }

  /* ---------- choix de l'opération ---------- */
  var mode = '', ov = null, chip = null;
  function majChip(pj) {
    var aide = R.querySelector('.ec-aide'); if (!aide) return;
    if (!chip) { chip = document.createElement('span'); chip.className = 'tz-chip'; aide.appendChild(chip); chip.addEventListener('click', function (e) { if (e.target.closest('button')) choix(); }); }
    chip.hidden = !mode; if (!mode) return;
    chip.innerHTML = 'Journal de trésorerie · ' + (mode === 'paiement' ? 'Paiement d’un tiers' : 'Autres opérations') + ' · compte associé ' + esc(pj ? pj.compte : '') + ' <button type="button">Changer</button>';
  }
  function appliquer(m) {
    mode = m; var pj = A().jTreso && A().jTreso();
    if (A().setTreso) A().setTreso(m);
    if (m === 'paiement') { seedDemo(); panneau(); remplirTiers(); st.sel = {}; dessiner(); pay.hidden = false; if (blocGen) blocGen.style.display = 'none'; }
    else { if (pay) pay.hidden = true; if (blocGen) blocGen.style.display = ''; }
    majChip(pj);
  }
  function fermer() { if (ov) { ov.remove(); ov = null; } document.removeEventListener('keydown', echap, true); }
  function echap(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); if (!mode) appliquer('autres'); } }
  function choix() {
    var pj = A().jTreso && A().jTreso(); if (!pj) return; fermer();
    ov = document.createElement('div'); ov.className = 'tz-ov';
    ov.innerHTML = '<div class="tz-md" role="dialog" aria-modal="true" aria-label="Opération de trésorerie"><h2>Journal de trésorerie — choix de l’opération</h2><div class="tz-b"><p>Journal <b>' + esc(pj.code) + '</b> — compte associé <b>' + esc(pj.compte) + '</b>. Quelle opération voulez-vous saisir ?</p><div class="tz-cx">' +
      '<button type="button" class="tz-ch" data-op="paiement"><i class="ti ti-receipt-2" aria-hidden="true"></i><b>Paiement d’un tiers</b><span>Recherche des factures non payées du tiers, choix des factures à apurer et du pourcentage à payer. La contrepartie est générée sur le compte associé.</span></button>' +
      '<button type="button" class="tz-ch" data-op="autres"><i class="ti ti-pencil" aria-hidden="true"></i><b>Autres opérations</b><span>Saisie normale des lignes ; la ligne du compte associé au journal est générée automatiquement en contrepartie.</span></button></div></div></div>';
    document.body.appendChild(ov); document.addEventListener('keydown', echap, true);
    ov.addEventListener('click', function (e) { var b = e.target.closest('[data-op]'); if (b) { var op = b.dataset.op; fermer(); appliquer(op); } else if (e.target === ov) { fermer(); if (!mode) appliquer('autres'); } });
    ov.querySelector('[data-op="paiement"]').focus();
  }
  window.addEventListener('ecritures-lignes-ouvertes', function () { if (window.__ecSansTreso) return; if (A().jTreso && A().jTreso()) choix(); else { mode = ''; appliquer(''); } });
  ['ecritures-entete-ouvert', 'ecritures-entete-rouvert'].forEach(function (ev) { window.addEventListener(ev, function () { fermer(); mode = ''; if (pay) pay.hidden = true; if (blocGen) blocGen.style.display = ''; majChip(null); if (A().setTreso) A().setTreso(''); }); });
  window.ECRITURES_TRESO = { choix: choix, mode: function () { return mode; } };
})();
