// Saisie d'écritures › « Facture OCR » : lit une facture (PDF ou image), en extrait le texte (OCR), repère les données de la facture et ouvre une fenêtre
// de saisie pré-remplie à partir de la facture ; « Générer l'écriture » renseigne l'en-tête (n° de facture, dates, référence) et ajoute les lignes à la pièce
// (charges au débit, TVA au débit, tiers au crédit). Moteurs chargés à la demande : PDF.js (PDF) et Tesseract.js (reconnaissance de texte des images et des PDF scannés).
(function () {
  var R = document.querySelector('[data-screen="ecritures"] app-jour-entry-form'); if (!R) return;
  var CDN = { tess: 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js', pdf: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js', pdfw: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function fmt(n) { return (n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function c(n) { return R.querySelector('[formcontrolname="' + n + '"]'); }

  /* ---------- style ---------- */
  var css = document.createElement('style');
  css.textContent = '.fo-ov{position:fixed;inset:0;z-index:3500;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.fo-md{display:flex;flex-direction:column;width:min(1180px,100%);max-height:calc(100vh - 32px);border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.fo-md.s{width:min(620px,100%)}.fo-md h2{margin:0;padding:14px 20px;border-bottom:1px solid #E9EBF0;font:600 18px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332;display:flex;align-items:center;gap:10px}' +
    '.fo-b{padding:16px 20px;overflow:auto}.fo-f{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:12px 20px;border-top:1px solid #E9EBF0}' +
    '.fo-f button,.fo-bt{min-height:36px;padding:0 16px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font-weight:600;font-size:13px;cursor:pointer}.fo-f button:hover{background:#F4F7FE}.fo-f button.p{background:#2E427B;color:#fff}.fo-f button.p:hover{background:#243569}.fo-f button:disabled{opacity:.45;cursor:not-allowed}' +
    '.fo-dz{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 16px;border:2px dashed #AEB6CC;border-radius:12px;background:#F8F9FB;color:#474C58;text-align:center;cursor:pointer}.fo-dz.on,.fo-dz:hover{border-color:#2E427B;background:#F4F7FE}.fo-dz i{font-size:34px;color:#2E427B}.fo-dz small{color:#5B606D}' +
    '.fo-prog{border:1px solid #E9EBF0;border-radius:10px;padding:12px 16px;background:#F8F9FB}.fo-prog .t{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px;color:#0B1332}.fo-chip{display:inline-block;padding:2px 8px;border-radius:4px;background:#2E427B;color:#fff;font-size:11px;font-weight:700}' +
    '.fo-bar{height:10px;margin:8px 0 4px;border-radius:6px;background:#E3EBFE;overflow:hidden}.fo-bar i{display:block;height:100%;width:0;border-radius:6px;background:repeating-linear-gradient(135deg,#4A90D9 0 8px,#7DB1EA 8px 16px);transition:width .2s}.fo-prog small{color:#5B606D;font-size:12px}' +
    '.fo-file{display:flex;align-items:center;gap:10px;margin:12px 0;padding:10px 14px;border-radius:8px;background:#E9EEF8;font-family:ui-monospace,Consolas,monospace;font-size:13px}.fo-st{padding:1px 8px;border-radius:4px;background:#FFC107;color:#0B1332;font:700 11px var(--font-sans,sans-serif)}.fo-st.ok{background:#1E7B4B;color:#fff}.fo-st.ko{background:#B63132;color:#fff}' +
    '.fo-prev{text-align:center}.fo-prev img,.fo-prev canvas{max-width:100%;max-height:60vh;border:1px solid #E9EBF0;border-radius:6px}' +
    '.fo-g{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:18px}@media(max-width:900px){.fo-g{grid-template-columns:1fr}}' +
    '.fo-fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px}.fo-fl .w{grid-column:1/-1}.fo-fl label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:600;color:#474C58}' +
    '.fo-in{height:34px;box-sizing:border-box;width:100%;border:1px solid #D6D9E0;border-radius:6px;background:#fff;padding:0 10px;font:inherit;font-size:12.5px;color:#353944}.fo-in:focus{outline:none;border-color:#2E427B;box-shadow:0 0 0 3px rgba(46,66,123,.12)}.fo-in.r{text-align:right}' +
    '.fo-sec{margin:14px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#2E427B}' +
    '.fo-t{width:100%;border-collapse:collapse;font-size:12px}.fo-t th{background:#F5F7F9;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;color:#5B606D;border-bottom:1px solid #E9EBF0}.fo-t td{padding:4px 6px;border-bottom:1px solid #F1F2F5;vertical-align:middle}.fo-t td .fo-in{height:30px}' +
    '.fo-x{border:1px solid #E6B8B8;border-radius:6px;background:#fff;color:#B63132;width:30px;height:30px;cursor:pointer}.fo-ko{color:#B63132;font-size:12px;margin-top:6px}.fo-ok{color:#0B6B43;font-size:12px;margin-top:6px}.fo-note{padding:8px 12px;border-radius:8px;background:#FFF8E6;border:1px solid #F1E2B8;color:#6B4A0F;font-size:12px;margin-bottom:10px}';
  document.head.appendChild(css);

  /* ---------- chargement des moteurs ---------- */
  var charges = {};
  function script(url) { return charges[url] || (charges[url] = new Promise(function (ok, ko) { var s = document.createElement('script'); s.src = url; s.onload = ok; s.onerror = function () { delete charges[url]; ko(new Error('chargement impossible : ' + url)); }; document.head.appendChild(s); })); }

  /* ---------- lecture du fichier ---------- */
  function lireDataUrl(f) { return new Promise(function (ok, ko) { var r = new FileReader(); r.onload = function () { ok(r.result); }; r.onerror = ko; r.readAsDataURL(f); }); }
  async function pdfPage(f, prog) {
    await script(CDN.pdf); window.pdfjsLib.GlobalWorkerOptions.workerSrc = CDN.pdfw;
    var doc = await window.pdfjsLib.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise, page = await doc.getPage(1);
    var vp = page.getViewport({ scale: 2 }), cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height;
    await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    // texte natif du PDF (sans OCR) quand il existe
    var tc = await page.getTextContent(), lignes = {}, ys = [];
    tc.items.forEach(function (it) { var y = Math.round(it.transform[5] / 3); if (!lignes[y]) { lignes[y] = []; ys.push(y); } lignes[y].push({ x: it.transform[4], t: it.str }); });
    ys.sort(function (a, b) { return b - a; });
    var texte = ys.map(function (y) { return lignes[y].sort(function (a, b) { return a.x - b.x; }).map(function (i) { return i.t; }).join(' '); }).join('\n');
    return { canvas: cv, texte: texte };
  }
  async function ocrSource(src, prog) {
    prog(8, 'Chargement du moteur de reconnaissance…'); await script(CDN.tess);
    prog(15, 'Initialisation de la langue française…');
    var res = await window.Tesseract.recognize(src, 'fra', { logger: function (m) { if (m && m.status === 'recognizing text') prog(20 + Math.round(m.progress * 65), 'Extraction du texte en cours… (' + Math.round(m.progress * 100) + '%)'); else if (m && m.status) prog(null, 'Moteur OCR : ' + m.status + '…'); } });
    return res.data.text;
  }
  async function lire(f, prog, prevHost) {
    var estPdf = /pdf$/i.test(f.type) || /\.pdf$/i.test(f.name), texte = '';
    if (estPdf) {
      prog(5, 'Lecture du PDF…'); var p = await pdfPage(f, prog);
      prevHost.innerHTML = ''; prevHost.appendChild(p.canvas); texte = p.texte;
      if (texte.replace(/\s/g, '').length < 40) texte = await ocrSource(p.canvas, prog);   // PDF scanné : reconnaissance de texte
      else prog(85, 'Texte du PDF lu (pas de reconnaissance nécessaire).');
    } else {
      var url = await lireDataUrl(f); prevHost.innerHTML = '<img alt="Facture" src="' + url + '">';
      texte = await ocrSource(url, prog);
    }
    prog(92, 'Mapping des données…');
    return texte;
  }

  /* ---------- repérage des données de la facture ---------- */
  var NB = /-?\d{1,3}(?:[  .]\d{3})*(?:[.,]\d{1,2})?|-?\d+(?:[.,]\d{1,2})?/g;
  function nombre(s) {
    s = String(s).replace(/[\s €$]/g, ''); if (!s) return 0;
    var vp = s.lastIndexOf(','), pt = s.lastIndexOf('.');
    if (vp >= 0 && pt >= 0) { var dec = vp > pt ? ',' : '.'; s = dec === ',' ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, ''); }
    else if (vp >= 0) s = s.replace(',', '.');
    else if (pt >= 0 && /\.\d{3}$/.test(s) && s.split('.').length >= 2 && s.indexOf('.') === s.lastIndexOf('.')) s = s.replace('.', '');
    var n = parseFloat(s); return isNaN(n) ? 0 : n;
  }
  function nombres(l) {
    var T = l.replace(/€/g, ' € ').split(/\s+/).filter(Boolean), out = [], i = 0;
    function num(t) { return /^-?[0-9][0-9.,]*$/.test(t); }
    while (i < T.length) {
      if (!num(T[i])) { i++; continue; }
      var cur = T[i]; i++;
      while (i < T.length && /^[1-9][0-9]{0,2}( [0-9]{3})*$/.test(cur) && /^[0-9]{3}([.,][0-9]{1,2})?$/.test(T[i])) { cur += ' ' + T[i]; i++; }
      out.push({ t: cur, v: nombre(cur) });
    }
    return out;
  }
  function iso(s) {
    var m = /(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{2,4})/.exec(s); if (!m) { var mo = { janvier: 1, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7, aout: 8, septembre: 9, octobre: 10, novembre: 11, decembre: 12 }, m2 = /(\d{1,2})\s+(janvier|fevrier|mars|avril|mai|juin|juillet|aout|septembre|octobre|novembre|decembre)\s+(\d{2,4})/.exec(norm(s)); if (!m2) return ''; m = [0, m2[1], mo[m2[2]], m2[3]]; }
    var y = +m[3]; if (y < 100) y += 2000; var d = +m[1], mm = +m[2]; if (mm > 12 && d <= 12) { var t = d; d = mm; mm = t; } if (mm < 1 || mm > 12 || d < 1 || d > 31) return '';
    return y + '-' + ('0' + mm).slice(-2) + '-' + ('0' + d).slice(-2);
  }
  function analyser(texte) {
    var L = String(texte || '').split(/\r?\n/).map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean), d = { numero: '', date: '', fournisseur: '', echeance: '', ht: 0, tva: 0, ttc: 0, taux: 0, lignes: [], brut: texte };
    L.forEach(function (l) {
      var n = norm(l);
      if (!d.numero) { var m = /(?:facture|invoice)\s*(?:n\s*[°oº.]?|num[a-z]*\s*[:\-]?)?\s*[:#]?\s*([a-z0-9][a-z0-9\-\/_.]{2,})/i.exec(l.replace(/n\s*[°º]\s*/ig, 'n ')); if (m && /\d/.test(m[1])) d.numero = m[1].replace(/[.,;]+$/, ''); }
      if (!d.date) { var dt = iso(l); if (dt && !/ech[eé]ance|avant le/i.test(l)) d.date = dt; }
      if (!d.echeance && /(ech[eé]ance|a regler avant|payable)/.test(n)) { var e = iso(l); if (e) d.echeance = e; }
    });
    // fournisseur : première ligne « nominative » avant les montants
    for (var i = 0; i < Math.min(L.length, 14) && !d.fournisseur; i++) {
      var l = L[i].replace(/(?:à|a)\s*l['’]attention\s*de.*$/i, '').trim(), n = norm(l);
      if (nombres(L[i]).length >= 2) continue;
      if (/facture|invoice|date|n°|attention|tel|@|www|http|\d{2}[ .-]\d{2}[ .-]\d{2}|description|prix|quantit|total/.test(n) || l.length < 4 || /^\W*\d/.test(l)) continue;
      if ((l.match(/[A-Za-zÀ-ÿ]/g) || []).length >= 4) d.fournisseur = l.replace(/^[^A-Za-zÀ-ÿ]+/, '');
    }
    // totaux
    L.forEach(function (l) {
      var n = norm(l), v = nombres(l); if (!v.length) return;
      if (/sous[\s-]?total|total\s*ht|montant\s*ht|hors\s*taxe/.test(n)) d.ht = v[v.length - 1].v;
      else if (/tva|t\.v\.a|taxe/.test(n) && !/total\s*ttc/.test(n)) { d.tva = v[v.length - 1].v; var tx = /(\d{1,2}(?:[.,]\d+)?)\s*%/.exec(l); if (tx) d.taux = nombre(tx[1]); }
      else if (/total\s*ttc|net\s*a\s*payer|montant\s*ttc|total\s*a\s*payer|^total\b/.test(n)) d.ttc = v[v.length - 1].v;
    });
    // lignes de détail : description puis prix, quantité, total
    L.forEach(function (l) {
      var n = norm(l); if (/sous[\s-]?total|total|tva|t\.v\.a|taxe|facture|description|prix|quantit|date|^iban|@|www|compte|iban|\bbic\b|\brib\b|paiement|conditions|merci|ordre de|siret|siren|\bnif\b|\bstat\b|\btel\b/.test(n)) return;
      var v = nombres(l); if (v.length < 2) return;
      if (v.filter(function (x) { return /^0[0-9]{3,}$/.test(x.t) || /^[0-9]{5,}$/.test(x.t); }).length) return;   // numéros de compte, de téléphone…
      var desc = l.replace(/[\d€|,.%\s]+$/, '').replace(/\s+\d[\d\s,.]*€?\s*(?:\d+\s*)?\d[\d\s,.]*€?$/, '').trim();
      var m0 = /^(.*?)\s+-?\d/.exec(l); if (m0 && m0[1].length >= 3) desc = m0[1].trim();
      if (!desc || (desc.match(/[A-Za-zÀ-ÿ]/g) || []).length < 3) return;
      var tot = v[v.length - 1].v, prix = v.length >= 3 ? v[0].v : tot, qte = v.length >= 3 ? v[1].v : 1;
      if (tot > 0) d.lignes.push({ libelle: desc, prix: prix, qte: qte, montant: tot });
    });
    var somme = d.lignes.reduce(function (s, x) { return s + x.montant; }, 0);
    if (!d.ht && somme) d.ht = somme;
    if (!d.tva && d.ttc && d.ht) d.tva = Math.round((d.ttc - d.ht) * 100) / 100;
    if (!d.ttc && d.ht) d.ttc = Math.round((d.ht + d.tva) * 100) / 100;
    if (!d.ht && d.ttc) d.ht = Math.round((d.ttc - d.tva) * 100) / 100;
    return d;
  }

  /* ---------- référentiels de l'entité ---------- */
  function planDetail() { var pc = window.PLAN_COMPTABLE || [], parents = {}; pc.forEach(function (r) { if (r.parent) parents[r.parent] = 1; }); return pc.filter(function (r) { return r.actif !== false && !parents[r.code]; }); }
  function comptesDe(re) { return planDetail().filter(function (r) { return re.test(r.code); }); }
  function tiersListe() { return (window.TIERS_PLAN || []).filter(function (t) { return t.actif !== false; }); }
  function meilleurTiers(nom) {
    var tk = norm(nom).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 2; }), best = null, bs = 0;
    tiersListe().forEach(function (t) { var tn = norm(t.nom), s = 0; tk.forEach(function (w) { if (tn.indexOf(w) >= 0) s++; }); if (s > bs) { bs = s; best = t; } });
    return best;
  }
  function journaux() { var J = (window.ECRITURES_REF && window.ECRITURES_REF.journaux) || []; return J.map(function (j) { return { code: j.code, label: j.label || '', devise: j.devise || '' }; }); }
  function opt(liste, sel, vide) { return (vide ? '<option value="">' + vide + '</option>' : '') + liste.map(function (r) { return '<option value="' + esc(r.code) + '"' + (r.code === sel ? ' selected' : '') + '>' + esc(r.code + ' — ' + (r.libelle || r.label || '')) + '</option>'; }).join(''); }

  /* ---------- fenêtre ---------- */
  var ov = null;
  function fermer() { if (ov) { ov.remove(); ov = null; } document.removeEventListener('keydown', echap, true); }
  function echap(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }
  function fenetre(titre, large) {
    fermer(); ov = document.createElement('div'); ov.className = 'fo-ov';
    ov.innerHTML = '<div class="fo-md' + (large ? '' : ' s') + '" role="dialog" aria-modal="true" aria-label="Facture OCR"><h2><i class="ti ti-scan" aria-hidden="true"></i>' + esc(titre) + '</h2><div class="fo-b"></div><div class="fo-f"></div></div>';
    document.body.appendChild(ov); document.addEventListener('keydown', echap, true);
    return { b: ov.querySelector('.fo-b'), f: ov.querySelector('.fo-f') };
  }
  function ouvrir() {
    var w = fenetre('Facture OCR — lire une facture');
    w.b.innerHTML = '<label class="fo-dz" data-fo-dz><i class="ti ti-file-upload" aria-hidden="true"></i><b>Déposez une facture ici ou cliquez pour la choisir</b><small>PDF, JPG ou PNG — la facture est lue (OCR) puis proposée en saisie</small><input type="file" accept=".pdf,image/*" hidden></label>';
    w.f.innerHTML = '<button type="button" data-fo-x>Annuler</button>';
    var dz = w.b.querySelector('[data-fo-dz]'), inp = dz.querySelector('input');
    inp.addEventListener('change', function () { if (inp.files[0]) traiter(inp.files[0]); });
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('on'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('on'); }); });
    dz.addEventListener('drop', function (e) { var f = e.dataTransfer && e.dataTransfer.files[0]; if (f) traiter(f); });
    w.f.querySelector('[data-fo-x]').addEventListener('click', fermer);
  }
  async function traiter(f) {
    var w = fenetre('Facture OCR — analyse', true);
    w.b.innerHTML = '<div class="fo-prog"><div class="t"><span>Progression OCR</span><span class="fo-chip" data-fo-etape>Lecture</span></div><div class="fo-bar"><i data-fo-bar></i></div><small data-fo-msg>Préparation…</small></div>' +
      '<div class="fo-file"><i class="ti ti-photo" aria-hidden="true"></i><span>' + esc(f.name) + '</span><span class="fo-st" data-fo-st>En cours</span></div><div class="fo-prev" data-fo-prev></div>';
    w.f.innerHTML = '<button type="button" data-fo-x>Annuler</button>'; w.f.querySelector('[data-fo-x]').addEventListener('click', fermer);
    var bar = w.b.querySelector('[data-fo-bar]'), msg = w.b.querySelector('[data-fo-msg]'), et = w.b.querySelector('[data-fo-etape]'), st = w.b.querySelector('[data-fo-st]'), prev = w.b.querySelector('[data-fo-prev]');
    function prog(p, t) { if (p != null) { bar.style.width = p + '%'; et.textContent = p < 20 ? 'Chargement' : p < 90 ? 'Extraction du texte' : 'Mapping des données'; } if (t) msg.textContent = t; }
    try {
      var texte = await lire(f, prog, prev); prog(100, 'Mapping des données… terminé'); st.textContent = 'Terminé'; st.className = 'fo-st ok';
      var d = analyser(texte); setTimeout(function () { formulaire(d, prev.innerHTML, f); }, 450);
    } catch (e) {
      st.textContent = 'Erreur'; st.className = 'fo-st ko'; et.textContent = 'Erreur'; msg.textContent = 'Lecture impossible : ' + (e && e.message ? e.message : 'fichier illisible') + '. Vérifiez la connexion (moteurs OCR chargés à la demande).';
      w.f.innerHTML = '<button type="button" data-fo-x>Fermer</button><button type="button" data-fo-r>Choisir un autre fichier</button><button type="button" class="p" data-fo-m>Saisir quand même à partir de la facture</button>';
      w.f.querySelector('[data-fo-x]').addEventListener('click', fermer); w.f.querySelector('[data-fo-r]').addEventListener('click', ouvrir);
      w.f.querySelector('[data-fo-m]').addEventListener('click', function () { formulaire(analyser(''), prev.innerHTML, f); });
    }
  }

  /* ---------- saisie à partir de la facture ---------- */
  function formulaire(d, apercu, f) {
    var w = fenetre('Saisie à partir de la facture — ' + (f ? f.name : ''), true);
    var jCourant = (window.__ecEntete && window.__ecEntete.journalCourant && window.__ecEntete.journalCourant()) || ((c('journalCode') || {}).value || ''), t0 = meilleurTiers(d.fournisseur), charges = comptesDe(/^6/), tvaC = comptesDe(/^445/), colls = comptesDe(/^40/);
    if (!tvaC.length) tvaC = comptesDe(/^44/); if (!tvaC.length) tvaC = planDetail().filter(function (r) { return /^4/.test(r.code); }); var cptTiers = t0 ? t0.compte : (colls[0] || {}).code || '';
    var etat = { lignes: d.lignes.length ? d.lignes.map(function (x) { return { libelle: x.libelle, montant: x.montant, compte: (charges[0] || {}).code || '' }; }) : [{ libelle: d.fournisseur ? 'Facture ' + (d.numero || '') + ' ' + d.fournisseur : 'Facture', montant: d.ht || 0, compte: (charges[0] || {}).code || '' }] };
    var leg = d.lignes.length ? '' : '<div class="fo-note">Aucune ligne de détail n’a été reconnue : une ligne unique au montant hors taxe est proposée, à compléter.</div>';
    w.b.innerHTML = '<div class="fo-g"><div class="fo-prev">' + apercu + '</div><div>' + leg +
      '<div class="fo-fl"><label class="w">Fournisseur lu sur la facture<input class="fo-in" data-fo="fourn" value="' + esc(d.fournisseur) + '"></label>' +
      '<label>Journal<select class="fo-in" data-fo="jnl">' + journaux().map(function (j) { return '<option value="' + esc(j.code) + '"' + (j.code === jCourant ? ' selected' : '') + '>' + esc(j.code + ' — ' + j.label) + (j.devise ? ' (' + esc(j.devise) + ')' : '') + '</option>'; }).join('') + '</select></label>' +
      '<label>Tiers (Saisie des plans › Tiers)<select class="fo-in" data-fo="tiers">' + '<option value="">— Sélectionner —</option>' + tiersListe().map(function (t) { return '<option value="' + esc(t.compte + '|' + t.code) + '"' + (t0 && t === t0 ? ' selected' : '') + '>' + esc(t.code + ' — ' + t.nom) + '</option>'; }).join('') + '</select></label>' +
      '<label>Compte collectif du tiers<select class="fo-in" data-fo="coll">' + opt(colls, cptTiers, '— Sélectionner —') + '</select></label>' +
      '<label>N° de facture<input class="fo-in" data-fo="num" value="' + esc(d.numero) + '"></label><label>Référence<input class="fo-in" data-fo="ref" value="' + esc(d.numero) + '"></label>' +
      '<label>Date de la facture (date de la pièce)<input class="fo-in" type="date" data-fo="date" value="' + esc(d.date) + '"></label><label>Date de l’écriture<input class="fo-in" type="date" data-fo="dateEcr" value="' + esc(d.date) + '"></label>' +
      '<label>Échéance<input class="fo-in" type="date" data-fo="ech" value="' + esc(d.echeance) + '"></label><label>Compte de TVA déductible<select class="fo-in" data-fo="tvaC">' + opt(tvaC, (tvaC[0] || {}).code, '— Aucun —') + '</select></label></div>' +
      '<div class="fo-sec">Lignes de charge (débit)</div><table class="fo-t"><thead><tr><th>Libellé</th><th style="width:230px">Compte de charge</th><th style="width:120px">Montant HT</th><th style="width:34px"></th></tr></thead><tbody data-fo-l></tbody></table>' +
      '<div style="margin-top:6px"><button type="button" class="fo-bt" data-fo-add>+ Ajouter une ligne</button></div>' +
      '<div class="fo-fl" style="margin-top:12px"><label>Total HT<input class="fo-in r" data-fo="ht" value="' + fmt(d.ht) + '" readonly></label><label>TVA' + (d.taux ? ' (' + d.taux + ' %)' : '') + '<input class="fo-in r" data-fo="tva" value="' + fmt(d.tva) + '"></label><label>Total TTC (crédit du tiers)<input class="fo-in r" data-fo="ttc" value="' + fmt(d.ttc) + '"></label></div>' +
      '<div class="fo-sec">Schéma comptable (avant génération de l’écriture)</div><div data-fo-sch></div>' +
      '<div data-fo-ctl></div></div></div>';
    w.f.innerHTML = '<button type="button" data-fo-x>Annuler</button><button type="button" data-fo-r>Lire une autre facture</button><button type="button" class="p" data-fo-g><i class="ti ti-wand"></i> Générer l’écriture</button>';
    var Q = function (s) { return w.b.querySelector(s); }, QA = function (s) { return [].slice.call(w.b.querySelectorAll(s)); }, F = function (k) { return Q('[data-fo="' + k + '"]'); };
    function num(k) { return nombre(F(k).value); }
    function dessiner() {
      Q('[data-fo-l]').innerHTML = etat.lignes.map(function (x, i) {
        return '<tr data-i="' + i + '"><td><input class="fo-in" data-l="libelle" value="' + esc(x.libelle) + '"></td><td><select class="fo-in" data-l="compte">' + opt(charges, x.compte, '— Compte —') + '</select></td><td><input class="fo-in r" data-l="montant" value="' + fmt(x.montant) + '"></td><td><button type="button" class="fo-x" data-fo-del aria-label="Supprimer la ligne"><i class="ti ti-x"></i></button></td></tr>';
      }).join('');
      controle();
    }
    function lireH() {
      return { jnl: F('jnl').value, num: F('num').value.trim(), ref: F('ref').value.trim(), date: F('date').value, dateEcr: F('dateEcr').value, ech: F('ech').value, fourn: F('fourn').value.trim(), tiers: F('tiers').value, coll: F('coll').value, tvaC: F('tvaC').value, tva: num('tva'), ttc: num('ttc'), lignes: etat.lignes };
    }
    function schema() {
      var h = lireH(), L = constituer(h), dT = 0, cT = 0, jn = journaux().filter(function (j) { return j.code === h.jnl; })[0];
      Q('[data-fo-sch]').innerHTML = '<div style="font-size:12px;color:#5B606D;margin-bottom:4px">Journal <b>' + esc(h.jnl) + '</b>' + (jn && jn.label ? ' — ' + esc(jn.label) : '') + ' · date de l’écriture ' + esc(h.dateEcr ? h.dateEcr.split('-').reverse().join('/') : '—') + ' · facture ' + esc(h.num || '—') + '</div>' +
        '<table class="fo-t"><thead><tr><th>Compte</th><th>Tiers</th><th>Libellé</th><th style="width:110px;text-align:right">Débit</th><th style="width:110px;text-align:right">Crédit</th></tr></thead><tbody>' +
        L.map(function (x) { var d = x.sens === 'DEBIT'; if (d) dT += x.montant; else cT += x.montant; return '<tr><td><b>' + esc(x.compte.code) + '</b> <span style="color:#5B606D">' + esc(x.compte.label) + '</span></td><td>' + esc(x.tiers ? x.tiers.code : '') + '</td><td>' + esc(x.libelle) + '</td><td style="text-align:right">' + (d ? fmt(x.montant) : '') + '</td><td style="text-align:right">' + (d ? '' : fmt(x.montant)) + '</td></tr>'; }).join('') +
        '<tr style="font-weight:700"><td colspan="3">Total' + (Math.round((dT - cT) * 100) ? ' — écart ' + fmt(Math.abs(dT - cT)) : ' — équilibré') + '</td><td style="text-align:right">' + fmt(dT) + '</td><td style="text-align:right">' + fmt(cT) + '</td></tr></tbody></table>';
    }
    function controle() {
      var ht = etat.lignes.reduce(function (s, x) { return s + (+x.montant || 0); }, 0); F('ht').value = fmt(ht);
      var ecart = Math.round((ht + num('tva') - num('ttc')) * 100) / 100;
      Q('[data-fo-ctl]').innerHTML = ecart ? '<div class="fo-ko">Écart de ' + fmt(Math.abs(ecart)) + ' entre HT + TVA et le TTC : corrigez les montants avant de générer.</div>' : '<div class="fo-ok">HT + TVA = TTC : l’écriture est équilibrée.</div>';
      w.f.querySelector('[data-fo-g]').disabled = !!ecart || !ht; schema();
    }
    Q('[data-fo-l]').addEventListener('input', function (e) { var tr = e.target.closest('tr'), k = e.target.dataset.l; if (!tr || !k) return; var x = etat.lignes[+tr.dataset.i]; x[k] = k === 'montant' ? nombre(e.target.value) : e.target.value; controle(); });
    Q('[data-fo-l]').addEventListener('change', function (e) { if (e.target.dataset.l === 'montant') e.target.value = fmt(nombre(e.target.value)); });
    Q('[data-fo-l]').addEventListener('click', function (e) { var b = e.target.closest('[data-fo-del]'); if (!b) return; etat.lignes.splice(+b.closest('tr').dataset.i, 1); dessiner(); });
    Q('[data-fo-add]').addEventListener('click', function () { etat.lignes.push({ libelle: '', montant: 0, compte: (charges[0] || {}).code || '' }); dessiner(); });
    ['tva', 'ttc'].forEach(function (k) { F(k).addEventListener('input', controle); F(k).addEventListener('change', function () { F(k).value = fmt(num(k)); controle(); }); });
    ['jnl', 'num', 'dateEcr', 'tvaC', 'coll', 'fourn'].forEach(function (k) { F(k).addEventListener('input', schema); F(k).addEventListener('change', schema); });
    F('tiers').addEventListener('change', function () { var v = F('tiers').value.split('|'); if (v[0]) F('coll').value = v[0]; });
    w.f.querySelector('[data-fo-x]').addEventListener('click', fermer); w.f.querySelector('[data-fo-r]').addEventListener('click', ouvrir);
    w.f.querySelector('[data-fo-g]').addEventListener('click', function () {
      var ko = [];
      if (!F('num').value.trim()) ko.push('le n° de facture'); if (!F('dateEcr').value) ko.push('la date de l’écriture'); if (!F('coll').value) ko.push('le compte collectif du tiers');
      if (etat.lignes.some(function (x) { return !x.compte || !x.libelle.trim() || !(x.montant > 0); })) ko.push('le libellé, le compte et le montant de chaque ligne');
      if (num('tva') > 0 && !F('tvaC').value) ko.push('le compte de TVA');
      if (ko.length) { Q('[data-fo-ctl]').innerHTML = '<div class="fo-ko">Complétez : ' + ko.join(', ') + '.</div>'; return; }
      if (!F('jnl').value) { Q('[data-fo-ctl]').innerHTML = '<div class="fo-ko">Complétez : le journal.</div>'; return; }
      if (generer(lireH())) fermer();
    });
    dessiner();
  }

  /* ---------- constitution des lignes de l'écriture (schéma comptable et génération) ---------- */
  function constituer(h, conv) {
    var pc = window.PLAN_COMPTABLE || [], cpt = function (code) { var r = pc.filter(function (x) { return x.code === code; })[0] || { code: code, libelle: '' }; return { code: r.code, label: r.libelle || r.label || '' }; };
    conv = conv || function () { return {}; };
    var lib = 'Facture ' + h.num + (h.fourn ? ' ' + h.fourn : ''), L = [];
    h.lignes.forEach(function (x) { L.push(Object.assign({ compte: cpt(x.compte), tiers: null, libelle: String(x.libelle || '').trim(), montant: x.montant, sens: 'DEBIT', echeance: '' }, conv(x.montant))); });
    if (h.tva > 0) L.push(Object.assign({ compte: cpt(h.tvaC), tiers: null, libelle: 'TVA ' + lib, montant: h.tva, sens: 'DEBIT', echeance: '' }, conv(h.tva)));
    var tp = String(h.tiers || '').split('|'), t = tp[1] ? (window.TIERS_PLAN || []).filter(function (x) { return x.compte === tp[0] && x.code === tp[1]; })[0] : null, cc = cpt(h.coll); cc.collectif = true;
    L.push(Object.assign({ compte: cc, tiers: t ? { code: t.code, label: t.nom, collectif: t.compte } : null, libelle: lib, montant: h.ttc, sens: 'CREDIT', echeance: h.ech || '' }, conv(h.ttc)));
    return L;
  }

  /* ---------- génération de l'écriture ---------- */
  function poser(i, v) { if (!i) return; i.value = v; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); }
  function generer(h) {
    var A = window.__ecEntete; if (!A || !A.ajouterLignes) { alert('Saisie d’écritures indisponible.'); return false; }
    A.rouvrirEntete(false);
    if (h.jnl && A.setJournal) A.setJournal(h.jnl);
    poser(c('facture'), h.num); poser(c('reference'), h.ref || h.num); poser(c('datePiece'), h.date || h.dateEcr); poser(c('dateEcriture'), h.dateEcr);
    window.__ecSansTreso = true; var ouvert = A.ouvrirLignes(); window.__ecSansTreso = false;
    if (!ouvert) return false;   // date hors exercice : message de l'en-tête
    var k1 = nombre(c('cours1') && c('cours1').value), k2 = nombre(c('cours2') && c('cours2').value);
    var L = constituer(h, function (m) { return { montant1: k1 > 0 ? Math.round(m / k1 * 100) / 100 : 0, montant2: k2 > 0 ? Math.round(m / k2 * 100) / 100 : 0 }; });
    A.ajouterLignes(L);
    return true;
  }
  window.FACTURE_OCR = { ouvrir: ouvrir, analyser: analyser, nombre: nombre };
  // bouton de la barre d'actions : relayé depuis le conteneur d'actions de l'en-tête de page (voir barre_actions.js)
  var hote = R.querySelector('.entry-import-actions');
  if (hote) { var b = document.createElement('button'); b.type = 'button'; b.className = 'inline-flex min-h-10 items-center'; b.innerHTML = '<i class="ti ti-scan" aria-hidden="true"></i> Facture OCR'; b.title = 'Lire une facture (PDF ou image) et la saisir'; b.addEventListener('click', ouvrir); hote.insertBefore(b, hote.firstChild); }
})();
