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
    '.fo-md{display:flex;flex-direction:column;width:min(1560px,100%);max-height:calc(100vh - 32px);border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.fo-md.s{width:min(620px,100%)}.fo-md h2{margin:0;padding:14px 20px;border-bottom:1px solid #E9EBF0;font:600 18px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332;display:flex;align-items:center;gap:10px}' +
    '.fo-b{padding:16px 20px;overflow:auto}.fo-f{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:12px 20px;border-top:1px solid #E9EBF0}' +
    '.fo-f button,.fo-bt{min-height:36px;padding:0 16px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font-weight:600;font-size:13px;cursor:pointer}.fo-f button:hover{background:#F4F7FE}.fo-f button.p{background:#2E427B;color:#fff}.fo-f button.p:hover{background:#243569}.fo-f button:disabled{opacity:.45;cursor:not-allowed}' +
    '.fo-dz{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:36px 16px;border:2px dashed #AEB6CC;border-radius:12px;background:#F8F9FB;color:#474C58;text-align:center;cursor:pointer}.fo-dz.on,.fo-dz:hover{border-color:#2E427B;background:#F4F7FE}.fo-dz i{font-size:34px;color:#2E427B}.fo-dz small{color:#5B606D}' +
    '.fo-prog{border:1px solid #E9EBF0;border-radius:10px;padding:12px 16px;background:#F8F9FB}.fo-prog .t{display:flex;justify-content:space-between;align-items:center;font-weight:700;font-size:13px;color:#0B1332}.fo-chip{display:inline-block;padding:2px 8px;border-radius:4px;background:#2E427B;color:#fff;font-size:11px;font-weight:700}' +
    '.fo-bar{height:10px;margin:8px 0 4px;border-radius:6px;background:#E3EBFE;overflow:hidden}.fo-bar i{display:block;height:100%;width:0;border-radius:6px;background:repeating-linear-gradient(135deg,#4A90D9 0 8px,#7DB1EA 8px 16px);transition:width .2s}.fo-prog small{color:#5B606D;font-size:12px}' +
    '.fo-file{display:flex;align-items:center;gap:10px;margin:12px 0;padding:10px 14px;border-radius:8px;background:#E9EEF8;font-family:ui-monospace,Consolas,monospace;font-size:13px}.fo-st{padding:1px 8px;border-radius:4px;background:#FFC107;color:#0B1332;font:700 11px var(--font-sans,sans-serif)}.fo-st.ok{background:#1E7B4B;color:#fff}.fo-st.ko{background:#B63132;color:#fff}' +
    '.fo-prev{text-align:center}.fo-prev .sd-doc{text-align:left}.fo-prev img,.fo-prev canvas{max-width:100%;max-height:60vh;border:1px solid #E9EBF0;border-radius:6px}' +
    '.fo-g{display:grid;grid-template-columns:minmax(0,4fr) minmax(0,9fr);gap:18px}@media(max-width:900px){.fo-g{grid-template-columns:1fr}}' +
    '.fo-fl{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 14px}.fo-fl .w{grid-column:1/-1}.fo-fl label{display:flex;flex-direction:column;gap:3px;font-size:12px;font-weight:600;color:#474C58}' +
    '.fo-in{height:34px;box-sizing:border-box;width:100%;border:1px solid #D6D9E0;border-radius:6px;background:#fff;padding:0 10px;font:inherit;font-size:12.5px;color:#353944}.fo-in:focus{outline:none;border-color:#2E427B;box-shadow:0 0 0 3px rgba(46,66,123,.12)}.fo-in.r{text-align:right}' +
    '.fo-sec{margin:14px 0 6px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#2E427B}' +
    '.fo-t{width:100%;border-collapse:collapse;font-size:12px}.fo-t th{background:#F5F7F9;text-align:left;padding:6px 8px;font-size:11px;text-transform:uppercase;color:#5B606D;border-bottom:1px solid #E9EBF0}.fo-t td{padding:4px 6px;border-bottom:1px solid #F1F2F5;vertical-align:middle}.fo-t td .fo-in{height:30px}' +
    '.fo-tabs{display:flex;gap:4px;margin:0 0 12px;border-bottom:1px solid #E9EBF0}.fo-tab{padding:8px 16px;border:0;border-bottom:3px solid transparent;background:none;color:#5B606D;font:600 13px var(--font-sans,sans-serif);cursor:pointer}.fo-tab.on{color:#2E427B;border-bottom-color:#2E427B}.fo-tab:hover{color:#2E427B}.fo-pn[hidden]{display:none}.fo-ax{min-width:92px}' +
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
  function nombres(l, sansFusion) {
    var T = l.replace(/€/g, ' € ').split(/\s+/).filter(Boolean), out = [], i = 0;
    function num(t) { return /^-?[0-9][0-9.,]*$/.test(t); }
    while (i < T.length) {
      if (!num(T[i])) { i++; continue; }
      var cur = T[i]; i++;
      while (!sansFusion && i < T.length && /^[1-9][0-9]{0,2}( [0-9]{3})*$/.test(cur) && /^[0-9]{3}([.,][0-9]{1,2})?$/.test(T[i])) { cur += ' ' + T[i]; i++; }
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
    if (!d.numero) { for (var q0 = 0; q0 < Math.min(L.length, 10) && !d.numero; q0++) { var mh = /(?:^|\s)#\s*([A-Za-z0-9][A-Za-z0-9\-\/_.]*)/.exec(L[q0]); if (mh) d.numero = mh[1].replace(/[.,;]+$/, ''); } }
    // fournisseur : première ligne « nominative » avant les montants
    for (var i = 0; i < Math.min(L.length, 14) && !d.fournisseur; i++) {
      var l = L[i].replace(/(?:à|a)\s*l['’]attention\s*de.*$/i, '').trim(), n = norm(l);
      if (/description|designation/.test(n)) break;
      if (nombres(L[i]).length >= 2) continue;
      if (iso(l) || /facture|invoice|date|echeance|emetteur|destinataire|reglement|n°|attention|tel|@|www|http|\d{2}[ .-]\d{2}[ .-]\d{2}|description|prix|quantit|total/.test(n) || l.length < 4 || /^\W*\d/.test(l)) continue;
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
    var iDesc = -1, iTot = -1; L.forEach(function (l, k) { var nn = norm(l); if (iDesc < 0 && /description|designation/.test(nn)) iDesc = k; });
    if (iDesc >= 0) L.forEach(function (l, k) { if (iTot < 0 && k > iDesc && /sous[\s-]?total|total\s*ht|^total\b/.test(norm(l))) iTot = k; });
    if (iDesc < 0) { L.forEach(function (l, k) { if (iTot < 0 && /sous[\s-]?total|total\s*ht|montant\s*ht|^total\b/.test(norm(l))) iTot = k; }); iDesc = -2; }
    L.forEach(function (l, k) {
      var dans = (iDesc >= 0 ? k > iDesc : (iTot >= 0 && k > 0)) && (iTot < 0 || k < iTot);
      var n = norm(l); if (/sous[\s-]?total|total|tva|t\.v\.a|taxe|facture|description|prix|quantit|date|^iban|@|www|compte|iban|\bbic\b|\brib\b|paiement|conditions|merci|ordre de|siret|siren|\bnif\b|\bstat\b|\btel\b/.test(n)) return;
      var v = nombres(l); if (v.length < (dans ? 1 : 2)) return;
      var v2 = nombres(l, true), q3 = v2.length - 3;   // « 20,00 € 10 200,00 € » : prix × quantité = total prime sur la fusion « 10 200,00 » (séparateur de milliers)
      if (q3 >= 0 && Math.abs(v2[q3].v * v2[q3 + 1].v - v2[q3 + 2].v) < 0.011 && v2[q3 + 2].v > 0) v = v2;
      if (dans && /offert|gratuit/.test(n)) return;   // ligne offerte : pas de montant
      if (dans && v.length === 1 && !/€|\d[.,]\d{2}\b|\b(ar|mga|eur)\b/i.test(l) && v[0].t.replace(/\D/g, '').length < 4) return;   // un seul petit nombre sans devise = quantité, pas un montant
      if (/^\d+\s+[A-Za-zÀ-ÿ]/.test(l) && !/€|\d[.,]\d{2}\b|\b(ar|mga|eur)\b/i.test(l)) return;   // adresse (« 123 Anywhere St »)
      if (v.filter(function (x) { return /^0[0-9]{3,}$/.test(x.t) || /^[0-9]{5,}$/.test(x.t); }).length) return;   // numéros de compte, de téléphone…
      var desc = l.replace(/[\d€|,.%\s]+$/, '').replace(/\s+\d[\d\s,.]*€?\s*(?:\d+\s*)?\d[\d\s,.]*€?$/, '').trim();
      var m0 = /^(.*?)\s+-?\d/.exec(l); if (m0 && m0[1].length >= 3) desc = m0[1].trim();
      if (!desc || (desc.match(/[A-Za-zÀ-ÿ]/g) || []).length < 3) return;
      var tot = v[v.length - 1].v, prix = v.length >= 3 ? v[0].v : tot, qte = v.length >= 3 ? v[1].v : 1;
      if (tot > 0) d.lignes.push({ libelle: desc, prix: prix, qte: qte, montant: tot });
    });
    var somme = d.lignes.reduce(function (s, x) { return s + x.montant; }, 0), r2 = function (v) { return Math.round(v * 100) / 100; }, fm = function (v) { return v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
    d.alertes = [];
    // 1) le HT est recoupé avec la somme des lignes et TTC − TVA (une valeur lue à tort, par exemple une virgule perdue, est écartée au profit de celle qui est confirmée par les deux autres)
    var C = []; if (d.ht) { C.push({ v: d.ht, s: 'lu sur la facture' }); if (Math.abs(d.ht - Math.round(d.ht)) < 0.001 && d.ht >= 100) C.push({ v: r2(d.ht / 100), s: 'virgule décimale probablement perdue' }); }
    if (somme) C.push({ v: r2(somme), s: 'somme des lignes' }); if (d.ttc && d.tva) C.push({ v: r2(d.ttc - d.tva), s: 'TTC − TVA' });
    if (C.length > 1) {
      var best = null; C.forEach(function (c) { c.n = C.filter(function (o) { return Math.abs(o.v - c.v) < 0.51; }).length; if (!best || c.n > best.n) best = c; });
      if (best && best.n >= 2 && d.ht && Math.abs(best.v - d.ht) >= 0.51) { d.alertes.push('HT lu sur la facture : ' + fm(d.ht) + ' — incohérent avec la somme des lignes et le TTC. ' + fm(best.v) + ' retenu.'); d.ht = best.v; }
    }
    // 2) TVA et TTC : le taux lu confirme la TVA, HT + TVA confirme le TTC
    if (d.ht && d.taux > 0 && d.tva && Math.abs(r2(d.ht * d.taux / 100) - d.tva) > 0.02 && d.ttc && Math.abs(r2(d.ht * (1 + d.taux / 100)) - d.ttc) <= 0.02) { d.alertes.push('TVA lue : ' + fm(d.tva) + ' — recalculée à ' + fm(r2(d.ht * d.taux / 100)) + ' (' + d.taux + ' % du HT).'); d.tva = r2(d.ht * d.taux / 100); }
    if (d.ht && d.tva && d.ttc && Math.abs(d.ht + d.tva - d.ttc) > 0.02) d.alertes.push('HT + TVA (' + fm(r2(d.ht + d.tva)) + ') ne correspond pas au TTC lu (' + fm(d.ttc) + ') : à vérifier sur la facture.');
    // 3) lignes de détail incohérentes avec le HT : une ligne unique est proposée
    if (d.ht && d.lignes.length && Math.abs(somme - d.ht) >= 1) { d.alertes.push('Lignes lues (' + fm(somme) + ') différentes du HT (' + fm(d.ht) + ') : ligne unique proposée, à ventiler.'); d.lignes = []; somme = 0; }
    // 4) année plausible (l'OCR confond souvent 0, 2, 5…)
    function anPlausible(iso0, nom) {
      if (!iso0) return iso0; var y = +iso0.slice(0, 4), now = new Date().getFullYear(); if (y >= now - 3 && y <= now + 1) return iso0;
      var cs = [], ys = String(y); for (var pos = 0; pos < 4; pos++) for (var dg = 0; dg < 10; dg++) { var t = ys.slice(0, pos) + dg + ys.slice(pos + 1), tn = +t; if (t !== ys && tn >= now - 3 && tn <= now + 1) cs.push(tn); }
      if (!cs.length) { d.alertes.push(nom + ' : année ' + y + ' improbable, à vérifier.'); return iso0; }
      cs.sort(function (a, b) { return Math.abs(a - now) - Math.abs(b - now); }); d.alertes.push(nom + ' lue ' + iso0.split('-').reverse().join('/') + ' : année corrigée en ' + cs[0] + ' (à vérifier).'); return cs[0] + iso0.slice(4);
    }
    d.date = anPlausible(d.date, 'Date de la facture'); d.echeance = anPlausible(d.echeance, 'Échéance');
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


  /* ---------- suggestion IA des imputations, contrat, ligne budgétaire ---------- */
  css.textContent += '.fo-rg{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:13px}.fo-rg label{display:inline-flex!important;flex-direction:row!important;align-items:center;gap:6px;width:auto!important;cursor:pointer}.fo-rg input[type=radio]{width:auto!important;height:auto!important;margin:0;flex:none}.fo-rg select{width:auto!important}.fo-tmm{display:block;margin-top:3px;font-size:11px;color:#5B606D}.fo-ia{display:inline-flex;align-items:center;gap:4px;margin-top:3px;padding:1px 8px;border-radius:6px;background:#E3EBFE;color:#2E427B;font-size:11px;font-weight:600}.fo-ia.c{background:#DCFCE7;color:#14532D}.fo-ia.m{background:#F1F2F5;color:#474C58}.fo-ia.lo{background:#FEF3C7;color:#92400E}' +
    '.fo-bl{display:inline-flex;align-items:center;gap:4px;min-height:32px;padding:0 8px;font-size:12px;white-space:nowrap}.fo-bl.on{background:#E3EBFE}.fo-ov2{z-index:3600}.fo-iab{margin:0 0 8px;padding:8px 12px;border:1px solid #C9DFF7;border-radius:8px;background:#EEF6FF;color:#1F4A7A;font-size:12.5px}.fo-iab.c{border-color:#A7F3D0;background:#ECFDF5;color:#14532D}' +
    '.fo-sub{width:min(720px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column;background:#fff;border-radius:12px;box-shadow:0 28px 70px rgba(11,19,50,.35)}.fo-sub h3{margin:0;padding:14px 20px;border-bottom:1px solid #E9EBF0;font:600 16px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}' +
    '.fo-sub table{width:100%;border-collapse:collapse;font-size:13px}.fo-sub th{padding:6px 8px;text-align:left;font-size:12px;color:#5B606D;border-bottom:1px solid #E9EBF0}.fo-sub td{padding:8px;border-bottom:1px solid #F1F2F5}.fo-sub .r{text-align:right}.fo-sub .ko{color:#B63132;font-weight:700}.fo-sub tr{cursor:pointer}.fo-sub tr:hover{background:#F4F7FE}';
  // Suggestion IA (simulée) : mots-clés du libellé, mémoire des imputations validées par fournisseur, axes analytiques proposés
  var MOTS = [[/honorair|consult|expert|audit|formation|prestation/, '622', 'honoraires / prestations'], [/carburant|gasoil|essence|vehicule|entretien|repar|pneu|garage/, '615', 'entretien / véhicule'], [/papeterie|fourniture|bureau|consommable|impression|cartouche/, '606', 'fournitures'], [/loyer|location|bail/, '613', 'location'], [/mission|deplacement|voyage|hotel|billet|transport/, '625', 'déplacements'], [/telephone|internet|telecom|orange|airtel|telma|abonnement/, '626', 'télécommunications'], [/eau|electricite|jirama|energie/, '605', 'eau / énergie'], [/assurance/, '616', 'assurance'], [/publicite|communication|annonce|affiche/, '623', 'communication'], [/banque|agios|commission/, '627', 'services bancaires']];
  function hache(t) { var h = 0; String(t).split('').forEach(function (ch) { h = (h * 31 + ch.charCodeAt(0)) % 100003; }); return h; }
  function pick(L, k) { return L && L.length ? L[k % L.length].code : ''; }
  window.__OCR_IMPUT = window.__OCR_IMPUT || {};
  function cleMem(fourn, lib) { return norm(fourn).replace(/[^a-z0-9]/g, '') + '|' + (norm(lib).match(/[a-z]{4,}/) || [''])[0]; }
  function suggerer(lib, fourn, charges, AXD, REFB) {
    var t = norm(lib + ' ' + fourn), mem = window.__OCR_IMPUT[cleMem(fourn, lib)];
    if (mem) return { compte: mem.compte, axes: Object.assign({}, mem.axes), budget: mem.budget || '', conf: 96, motif: 'Dernière imputation validée pour ce fournisseur et ce type de dépense' };
    var m = MOTS.filter(function (x) { return x[0].test(t); })[0], h = hache(t), cp = '';
    if (m) { var c = charges.filter(function (r) { return r.code.indexOf(m[1]) === 0; })[0]; cp = c ? c.code : ''; }
    var viaLib = false;
    if (!cp) { var mots = (t.match(/[a-z]{4,}/g) || []), best = 0; charges.forEach(function (r) { var lb = norm(r.libelle || r.label || ''), sc = mots.filter(function (w) { return lb.indexOf(w) >= 0; }).length; if (sc > best) { best = sc; cp = r.code; viaLib = true; } }); }
    var conf = m && cp && !viaLib ? 84 + h % 12 : viaLib ? 74 + h % 10 : 55 + h % 14; if (!cp) cp = (charges[0] || {}).code || '';
    var ax = {}; ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE'].forEach(function (n, k) { ax[n] = pick(AXD[n], h + k * 7); });
    return { compte: cp, axes: ax, budget: REFB.length ? REFB[0].code : '', conf: conf, motif: viaLib ? 'Libellé proche de l’intitulé du compte ' + cp : m ? 'Libellé proche de « ' + m[2] + ' » → compte ' + cp + ' ; axes et budget proposés d’après les imputations habituelles' : 'Aucun mot-clé reconnu : imputation par défaut, à vérifier' };
  }
  function imputContrat(code, charges, AXD, REFC, REFB) {
    var i = Math.max(0, REFC.findIndex(function (x) { return x.code === code; })), ax = {};
    ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE'].forEach(function (n, k) { ax[n] = pick(AXD[n], i * 5 + k * 3 + 1); });
    return { compte: charges.length ? charges[(i * 3 + 1) % charges.length].code : '', axes: ax, budget: REFB.length ? REFB[i % REFB.length].code : '' };
  }

  /* ---------- taxes : types de taxe (États comptables › Type de taxe) et taux (Paramétrages › Taxes) ---------- */
  function rnd2(v) { return Math.round(v * 100) / 100; }
  function typesTaxe() { return (window.__taxTypes || []).filter(function (t) { return t.code; }); }
  function typeTaxe(code) { return typesTaxe().filter(function (t) { return t.code === code; })[0]; }
  function tauxTaxeX(code) { var T = window.TAXES_REF || [], c = String(code).toUpperCase(); return T.filter(function (t) { return t.code.toUpperCase() === c; })[0] || T.filter(function (t) { return t.type && t.type.toUpperCase() === c; })[0] || T.filter(function (t) { return t.code.toUpperCase().indexOf(c) === 0; })[0] || null; }
  function tauxNum(code) { var tx = tauxTaxeX(code); return tx && tx.taux !== '' ? parseFloat(tx.taux) || 0 : 0; }
  function forfaitNum(code) { var tx = tauxTaxeX(code); return tx && tx.forfait !== '' ? parseFloat(tx.forfait) || 0 : 0; }
  function taxesDe(base, code) {
    var ty = typeTaxe(code); if (!ty) return []; var taux = tauxNum(code), fo = forfaitNum(code);
    return (ty.cpt || []).map(function (c) { return { code: ty.code, compte: c.compte, label: c.lib, sens: /^Crédit$/.test(c.sens) ? 'CREDIT' : 'DEBIT', montant: taux > 0 ? rnd2(base * taux / 100) : fo, taux: taux }; });
  }

  /* ---------- fenêtre ---------- */
  var ov = null;
  function fermer() { if (ov) { ov.remove(); ov = null; } document.removeEventListener('keydown', echap, true); }
  function echap(e) { if (e.key === 'Escape') { if (document.querySelector('.fo-ov2')) return; e.preventDefault(); fermer(); } }
  function fenetre(titre, large, icone, aria) {
    fermer(); ov = document.createElement('div'); ov.className = 'fo-ov';
    ov.innerHTML = '<div class="fo-md' + (large ? '' : ' s') + '" role="dialog" aria-modal="true" aria-label="' + esc(aria || 'Facture OCR') + '"><h2><i class="ti ti-' + (icone || 'scan') + '" aria-hidden="true"></i>' + esc(titre) + '</h2><div class="fo-b"></div><div class="fo-f"></div></div>';
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
      var d = analyser(texte); setTimeout(function () { formulaire(d, prev.innerHTML, f, { analytique: true, ia: true }); }, 450);
    } catch (e) {
      st.textContent = 'Erreur'; st.className = 'fo-st ko'; et.textContent = 'Erreur'; msg.textContent = 'Lecture impossible : ' + (e && e.message ? e.message : 'fichier illisible') + '. Vérifiez la connexion (moteurs OCR chargés à la demande).';
      w.f.innerHTML = '<button type="button" data-fo-x>Fermer</button><button type="button" data-fo-r>Choisir un autre fichier</button><button type="button" class="p" data-fo-m>Saisir quand même à partir de la facture</button>';
      w.f.querySelector('[data-fo-x]').addEventListener('click', fermer); w.f.querySelector('[data-fo-r]').addEventListener('click', ouvrir);
      w.f.querySelector('[data-fo-m]').addEventListener('click', function () { formulaire(analyser(''), prev.innerHTML, f, { analytique: true, ia: true }); });
    }
  }

  /* ---------- saisie à partir de la facture ---------- */
  function formulaire(d, apercu, f, o) {
    o = o || {}; var AX = o.analytique ? ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE'] : [], AXL = { 'ACTIVITE': 'ACT', 'POSTE BUDGETAIRE': 'BUD', 'FINANCEMENT': 'FIN', 'GEOGRAPHIQUE': 'GEO' }, AXD = window.ECRITURES_AXES || {};
    var w = fenetre(o.titre || ('Saisie à partir de la facture — ' + (f ? f.name : '')), true, o.icone, o.aria);
    var jCourant = (window.__ecEntete && window.__ecEntete.journalCourant && window.__ecEntete.journalCourant()) || ((c('journalCode') || {}).value || ''), t0 = meilleurTiers(d.fournisseur), charges = comptesDe(/^6/), tvaC = comptesDe(/^445/), colls = comptesDe(/^40/);
    if (!tvaC.length) tvaC = comptesDe(/^44/); if (!tvaC.length) tvaC = planDetail().filter(function (r) { return /^4/.test(r.code); }); var cptTiers = (t0 && colls.some(function (r) { return r.code === t0.compte; })) ? t0.compte : (colls[0] || {}).code || '';
    var etat = { lignes: d.lignes.length ? d.lignes.map(function (x) { return { libelle: x.libelle, montant: x.montant, compte: x.compte || (charges[0] || {}).code || '', axes: Object.assign({}, x.axes || {}) }; }) : [{ libelle: d.fournisseur ? 'Facture ' + (d.numero || '') + ' ' + d.fournisseur : 'Facture', montant: d.ht || 0, compte: (charges[0] || {}).code || '', axes: {} }] };
    var IA = !!o.ia, REFX = window.ECRITURES_REF || {}, REFC = REFX.contrats || [], REFB = REFX.budgets || [];
    etat.contrat = ''; etat.mht = 'ventile'; etat.mtx = 'total'; etat.taxL = []; etat.tvaNet = 0;
    etat.htTotal = etat.lignes.reduce(function (s, x) { return s + (+x.montant || 0); }, 0);
    var t0x = tauxNum('TVA'); etat.taxeT = (IA && typeTaxe('TVA') && d.tva > 0 && Math.abs((d.ht || etat.htTotal) * t0x / 100 - d.tva) < 1) ? 'TVA' : '';
    etat.lignes.forEach(function (x) { x.taxe = etat.taxeT; });
    if (IA) etat.lignes.forEach(function (x) { var sg = suggerer(x.libelle, d.fournisseur, charges, AXD, REFB); x.compte = sg.compte || x.compte; x.axes = sg.axes; x.budget = sg.budget; x.conf = sg.conf; x.motif = sg.motif; x.src = 'ia'; });
    var leg = (d.lignes.length || o.sansNote) ? '' : '<div class="fo-note">Aucune ligne de détail n’a été reconnue : une ligne unique au montant hors taxe est proposée, à compléter.</div>';
    leg += (d.alertes || []).map(function (a) { return '<div class="fo-note">' + esc(a) + '</div>'; }).join('');
    w.b.innerHTML = '<div class="fo-g"><div class="fo-prev">' + apercu + '</div><div><div class="fo-tabs" role="tablist"><button type="button" class="fo-tab on" data-fo-tab="s" role="tab">Saisie</button><button type="button" class="fo-tab" data-fo-tab="c" role="tab">Schéma comptable</button></div><div class="fo-pn" data-fo-pn="s">' + leg +
      '<div class="fo-fl"><label class="w">Fournisseur lu sur la facture<input class="fo-in" data-fo="fourn" value="' + esc(d.fournisseur) + '"></label>' +
      '<label>Journal<select class="fo-in" data-fo="jnl">' + journaux().map(function (j) { return '<option value="' + esc(j.code) + '"' + (j.code === jCourant ? ' selected' : '') + '>' + esc(j.code + ' — ' + j.label) + (j.devise ? ' (' + esc(j.devise) + ')' : '') + '</option>'; }).join('') + '</select></label>' +
      '<label>Tiers (Saisie des plans › Tiers)<select class="fo-in" data-fo="tiers">' + '<option value="">— Sélectionner —</option>' + tiersListe().map(function (t) { return '<option value="' + esc(t.compte + '|' + t.code) + '"' + (t0 && t === t0 ? ' selected' : '') + '>' + esc(t.code + ' — ' + t.nom) + '</option>'; }).join('') + '</select></label>' +
      '<label>Compte collectif du tiers<select class="fo-in" data-fo="coll">' + opt(colls, cptTiers, '— Sélectionner —') + '</select></label>' +
      '<label>N° de facture<input class="fo-in" data-fo="num" value="' + esc(d.numero) + '"></label><label>Référence<input class="fo-in" data-fo="ref" value="' + esc(d.numero) + '"></label>' +
      '<label>Date de la facture (date de la pièce)<input class="fo-in" type="date" data-fo="date" value="' + esc(d.date) + '"></label><label>Date de l’écriture<input class="fo-in" type="date" data-fo="dateEcr" value="' + esc(d.date) + '"></label>' +
      '<label>Échéance<input class="fo-in" type="date" data-fo="ech" value="' + esc(d.echeance) + '"></label><label>Compte de TVA déductible<select class="fo-in" data-fo="tvaC">' + opt(tvaC, (tvaC[0] || {}).code, '— Aucun —') + '</select></label>' + (IA ? '<label class="w">Contrat (reprise des imputations)<select class="fo-in" data-fo="contrat"><option value="">— Aucun contrat —</option>' + REFC.map(function (ct) { return '<option value="' + esc(ct.code) + '">' + esc(ct.code + ' — ' + ct.label) + '</option>'; }).join('') + '</select></label>' : '') + '</div>' +
      (IA ? '<div class="fo-sec">Comptabilisation</div><div class="fo-rg" style="margin-bottom:8px"><label><input type="radio" name="fo-cpt" value="detail" checked> Détaillée : HT par ligne et taxes</label><label><input type="radio" name="fo-cpt" value="ttc"> Sur le montant total de la facture (TTC) : une seule ligne de charge, sans ligne de taxe</label></div><div data-fo-mont><div class="fo-sec">Montants</div><div class="fo-fl" style="display:flex;flex-direction:column;gap:8px;margin-bottom:8px"><div class="fo-rg"><b>Montant HT</b><label><input type="radio" name="fo-mht" value="total"> Montant total</label><label><input type="radio" name="fo-mht" value="ventile" checked> Ventilé ligne par ligne</label></div><div class="fo-rg"><b>Taxes</b><label><input type="radio" name="fo-mtx" value="total" checked> Montant total</label><select class="fo-in" data-fo="taxeT" style="width:auto;min-width:230px"><option value="">— Saisie manuelle (montant lu sur la facture) —</option>' + typesTaxe().map(function (ty) { var tx = tauxNum(ty.code); return '<option value="' + esc(ty.code) + '"' + (ty.code === etat.taxeT ? ' selected' : '') + '>' + esc(ty.code) + (tx > 0 ? ' — ' + String(tx).replace('.', ',') + ' %' : forfaitNum(ty.code) > 0 ? ' — forfait ' + forfaitNum(ty.code) : '') + '</option>'; }).join('') + '</select><label><input type="radio" name="fo-mtx" value="ventile"> Ventilé ligne par ligne</label></div></div></div>' : '') + '<div class="fo-sec">Lignes de charge (débit)' + (IA ? ' <button type="button" class="fo-bt" data-fo-reia style="margin-left:10px;min-height:28px"><i class="ti ti-sparkles"></i> Relancer la suggestion IA</button>' : '') + '</div>' + (IA ? '<div class="fo-iab" data-fo-iab></div>' : '') + '<table class="fo-t"><thead data-fo-th><tr><th>Libellé</th><th style="width:230px">Compte de charge</th>' + AX.map(function (n) { return '<th>' + AXL[n] + '</th>'; }).join('') + (IA ? '<th style="width:150px">Budget</th>' : '') + '<th style="width:120px">Montant HT</th><th style="width:34px"></th></tr></thead><tbody data-fo-l></tbody></table>' +
      '<div style="margin-top:6px"><button type="button" class="fo-bt" data-fo-add>+ Ajouter une ligne</button></div>' +
      '<div class="fo-fl" style="margin-top:12px"><label>Total HT<input class="fo-in r" data-fo="ht" value="' + fmt(d.ht) + '" readonly></label><label>TVA' + (d.taux ? ' (' + d.taux + ' %)' : '') + '<input class="fo-in r" data-fo="tva" value="' + fmt(d.tva) + '"></label><label>Total TTC (crédit du tiers)<input class="fo-in r" data-fo="ttc" value="' + fmt(d.ttc) + '"></label></div>' +
      '</div><div class="fo-pn" data-fo-pn="c" hidden><div class="fo-sec" style="margin-top:0">Schéma comptable (avant génération de l’écriture)</div><div data-fo-sch></div></div>' +
      '<div data-fo-ctl></div></div></div>';
    w.f.innerHTML = '<button type="button" data-fo-x>Annuler</button><button type="button" data-fo-r>' + (o.autre || 'Lire une autre facture') + '</button><button type="button" class="p" data-fo-g><i class="ti ti-pencil"></i> Préremplir la saisie</button>';
    var Q = function (s) { return w.b.querySelector(s); }, QA = function (s) { return [].slice.call(w.b.querySelectorAll(s)); }, F = function (k) { return Q('[data-fo="' + k + '"]'); };
    function num(k) { return nombre(F(k).value); }
    function taxCell(x) { return '<td><select class="fo-in" data-l="taxe"><option value="">— Sans taxe —</option>' + typesTaxe().map(function (ty) { var tx = tauxNum(ty.code); return '<option value="' + esc(ty.code) + '"' + (x.taxe === ty.code ? ' selected' : '') + '>' + esc(ty.code) + (tx > 0 ? ' (' + String(tx).replace('.', ',') + ' %)' : '') + '</option>'; }).join('') + '</select><span class="fo-tmm" data-fo-tm></span></td>'; }
    function entete() { Q('[data-fo-th]').innerHTML = '<tr><th>Libellé</th><th style="width:230px">Compte de charge</th>' + AX.map(function (n) { return '<th>' + AXL[n] + '</th>'; }).join('') + '<th style="width:150px">Budget</th>' + (etat.mtx === 'ventile' ? '<th style="width:170px">Type de taxe</th>' : '') + '<th style="width:120px">Montant HT' + (etat.mht === 'total' ? ' (total)' : '') + '</th><th style="width:34px"></th></tr>'; }
    function lignesEff() { if (IA && etat.mht === 'total') { var x0 = Object.assign({}, etat.lignes[0] || {}); x0.montant = etat.htTotal; return [x0]; } return etat.lignes; }
    function htVal() { return IA && etat.mht === 'total' ? etat.htTotal : etat.lignes.reduce(function (s, x) { return s + (+x.montant || 0); }, 0); }
    function autoTax() { return IA && (etat.mtx === 'ventile' || !!F('taxeT').value); }
    function tvaVal() { return autoTax() ? etat.tvaNet : num('tva'); }
    function calculerTaxes(ht) {
      etat.taxL = []; etat.tvaNet = 0; if (!IA) return;
      var acc = {};
      function add(base, code) { taxesDe(base, code).forEach(function (t) { var k = t.code + '|' + t.compte + '|' + t.sens; if (!acc[k]) acc[k] = Object.assign({}, t, { montant: 0 }); acc[k].montant = rnd2(acc[k].montant + t.montant); }); }
      if (etat.mtx === 'total') { if (F('taxeT').value) add(ht, F('taxeT').value); } else lignesEff().forEach(function (x) { if (x.taxe) add(+x.montant || 0, x.taxe); });
      etat.taxL = Object.keys(acc).map(function (k) { return acc[k]; }).filter(function (t) { return t.montant > 0; });
      etat.tvaNet = rnd2(etat.taxL.reduce(function (s, t) { return s + (t.sens === 'DEBIT' ? t.montant : -t.montant); }, 0));
      if (autoTax()) { F('tva').readOnly = true; F('tva').value = fmt(etat.tvaNet); } else F('tva').readOnly = false;
      QA('[data-fo-tm]').forEach(function (e) { var i = +e.closest('tr').dataset.i, x = etat.lignes[i]; var tt = x && x.taxe ? taxesDe(+x.montant || 0, x.taxe).reduce(function (s, t) { return s + (t.sens === 'DEBIT' ? t.montant : -t.montant); }, 0) : 0; e.textContent = x && x.taxe ? 'Taxe : ' + fmt(rnd2(tt)) : ''; });
    }
    function badge(x) {
      if (!x.src) return '';
      if (x.src === 'contrat') return '';
      if (x.src === 'contrat') return '<span class="fo-ia c" title="Imputations reprises du contrat ' + esc(etat.contrat) + '"><i class="ti ti-file-certificate"></i> Reprise du contrat ' + esc(etat.contrat) + '</span>';
      if (x.src === 'manuel') return '<span class="fo-ia m"><i class="ti ti-pencil"></i> Modifié</span>';
      return '<span class="fo-ia' + (x.conf < 70 ? ' lo' : '') + '" title="' + esc(x.motif || '') + '"><i class="ti ti-sparkles"></i> Suggestion IA · ' + x.conf + ' %' + (x.conf < 70 ? ' · à vérifier' : '') + '</span>';
    }
    function dispo(code) { var b = REFB.filter(function (y) { return y.code === code; })[0]; return b ? b.total - b.engage : 0; }
    function budgetCell(x) { return '<td>' + (x.budget ? '<button type="button" class="fo-bt fo-bl on" data-fo-lier title="Disponible : ' + fmt(dispo(x.budget)) + '"><i class="ti ti-link"></i> ' + esc(x.budget) + '</button>' : '<button type="button" class="fo-bt fo-bl" data-fo-lier><i class="ti ti-link"></i> Lier ligne budgétaire</button>') + '</td>'; }
    function bandeau() {
      if (!IA) return; var b = Q('[data-fo-iab]'); b.style.display = 'none'; return; b.className = 'fo-iab' + (etat.contrat ? ' c' : '');
      b.innerHTML = etat.contrat ? '<i class="ti ti-file-certificate"></i> Facture rattachée au contrat <b>' + esc(etat.contrat) + '</b> : compte, axes analytiques et budget sont repris du contrat. Vous pouvez les modifier ligne par ligne.' : '<i class="ti ti-sparkles"></i> Imputations <b>suggérées par l’IA</b> (simulation) d’après le libellé et l’historique du fournisseur. Vérifiez-les, modifiez-les si besoin, ou rattachez la facture à un contrat pour reprendre ses imputations.';
    }
    function appliquerImputations() {
      etat.lignes.forEach(function (x) {
        if (etat.contrat) { var ic = imputContrat(etat.contrat, charges, AXD, REFC, REFB); x.compte = ic.compte || x.compte; x.axes = ic.axes; x.budget = ic.budget; x.src = 'contrat'; }
        else { var sg = suggerer(x.libelle, F('fourn').value, charges, AXD, REFB); x.compte = sg.compte || x.compte; x.axes = sg.axes; x.budget = sg.budget; x.conf = sg.conf; x.motif = sg.motif; x.src = 'ia'; }
      });
      dessiner();
    }
    function dessiner() {
      Q('[data-fo-l]').innerHTML = etat.lignes.map(function (x, i) {
        return '<tr data-i="' + i + '"' + (IA && etat.mht === 'total' && i > 0 ? ' hidden' : '') + '><td><input class="fo-in" data-l="libelle" value="' + esc(x.libelle) + '">' + (IA ? '<div data-fo-bdg>' + badge(x) + '</div>' : '') + '</td><td><select class="fo-in" data-l="compte">' + opt(charges, x.compte, '— Compte —') + '</select></td>' + AX.map(function (n) { return '<td><select class="fo-in fo-ax" data-ax="' + esc(n) + '"><option value="">—</option>' + (AXD[n] || []).map(function (it) { return '<option value="' + esc(it.code) + '" title="' + esc(it.label) + '"' + (x.axes && x.axes[n] === it.code ? ' selected' : '') + '>' + esc(it.code) + '</option>'; }).join('') + '</select></td>'; }).join('') + (IA ? budgetCell(x) : '') + (IA && etat.mtx === 'ventile' ? taxCell(x) : '') + '<td><input class="fo-in r" data-l="montant" value="' + fmt(IA && etat.mht === 'total' ? etat.htTotal : x.montant) + '"' + (IA && etat.mht === 'total' ? ' disabled' : '') + '></td><td><button type="button" class="fo-x" data-fo-del aria-label="Supprimer la ligne"><i class="ti ti-x"></i></button></td></tr>';
      }).join('');
      if (IA) entete(); bandeau(); controle();
    }
    function lireH() {
      return { jnl: F('jnl').value, num: F('num').value.trim(), ref: F('ref').value.trim(), date: F('date').value, dateEcr: F('dateEcr').value, ech: F('ech').value, fourn: F('fourn').value.trim(), tiers: F('tiers').value, coll: F('coll').value, tvaC: F('tvaC').value, tva: tvaVal(), ttc: num('ttc'), contrat: IA ? F('contrat').value : '', taxL: autoTax() ? etat.taxL : null, lignes: lignesEff() };
    }
    function schema() {
      var h = lireH(), L = constituer(h), dT = 0, cT = 0, anal = L.some(function (x) { return x.axes && Object.keys(x.axes).some(function (k) { return x.axes[k]; }); }), bud = L.some(function (x) { return x.budget; }), ACOL = ['ACTIVITE', 'POSTE BUDGETAIRE', 'FINANCEMENT', 'GEOGRAPHIQUE'], jn = journaux().filter(function (j) { return j.code === h.jnl; })[0];
      Q('[data-fo-sch]').innerHTML = '<div style="font-size:12px;color:#5B606D;margin-bottom:4px">Journal <b>' + esc(h.jnl) + '</b>' + (jn && jn.label ? ' — ' + esc(jn.label) : '') + ' · date de l’écriture ' + esc(h.dateEcr ? h.dateEcr.split('-').reverse().join('/') : '—') + ' · facture ' + esc(h.num || '—') + (h.contrat ? ' · contrat ' + esc(h.contrat) : '') + '</div>' +
        '<table class="fo-t"><thead><tr><th>Compte</th><th>Tiers</th><th>Libellé</th>' + (anal ? ACOL.map(function (k) { return '<th>' + AXL[k] + '</th>'; }).join('') + (bud ? '<th>Ligne budg.</th>' : '') : '') + '<th style="width:110px;text-align:right">Débit</th><th style="width:110px;text-align:right">Crédit</th></tr></thead><tbody>' +
        L.map(function (x) { var d = x.sens === 'DEBIT'; if (d) dT += x.montant; else cT += x.montant; return '<tr><td><b>' + esc(x.compte.code) + '</b> <span style="color:#5B606D">' + esc(x.compte.label) + '</span></td><td>' + esc(x.tiers ? x.tiers.code : '') + '</td><td>' + esc(x.libelle) + '</td>' + (anal ? ACOL.map(function (k) { return '<td style="font-family:monospace;font-size:11px">' + esc((x.axes || {})[k] || '') + '</td>'; }).join('') + (bud ? '<td style="font-family:monospace;font-size:11px">' + esc(x.budget || '') + '</td>' : '') : '') + '<td style="text-align:right">' + (d ? fmt(x.montant) : '') + '</td><td style="text-align:right">' + (d ? '' : fmt(x.montant)) + '</td></tr>'; }).join('') +
        '<tr style="font-weight:700"><td colspan="' + (anal ? 3 + ACOL.length + (bud ? 1 : 0) : 3) + '">Total' + (Math.round((dT - cT) * 100) ? ' — écart ' + fmt(Math.abs(dT - cT)) : ' — équilibré') + '</td><td style="text-align:right">' + fmt(dT) + '</td><td style="text-align:right">' + fmt(cT) + '</td></tr></tbody></table>';
    }
    function controle() {
      if (IA && etat.compta === 'ttc') { etat.htTotal = num('ttc'); F('tva').value = fmt(0); F('tva').readOnly = true; F('ht').value = fmt(etat.htTotal); }
      var ht = htVal(); if (!(IA && etat.mht === 'total')) F('ht').value = fmt(ht); calculerTaxes(ht);
      if (autoTax()) { F('ttc').readOnly = true; F('ttc').value = fmt(rnd2(ht + etat.tvaNet)); } else if (IA) F('ttc').readOnly = false;
      var ecart = Math.round((ht + tvaVal() - num('ttc')) * 100) / 100;
      Q('[data-fo-ctl]').innerHTML = ecart ? '<div class="fo-ko">Écart de ' + fmt(Math.abs(ecart)) + ' entre HT + TVA et le TTC : corrigez les montants avant de générer.</div>' : '<div class="fo-ok">HT + taxes = TTC : l’écriture est équilibrée.</div>';
      if (IA && autoTax() && d.ttc && Math.abs(d.ttc - num('ttc')) >= 1) Q('[data-fo-ctl]').insertAdjacentHTML('beforeend', '<div class="fo-note">TTC lu sur la facture : ' + fmt(d.ttc) + ' (écart de ' + fmt(Math.abs(d.ttc - num('ttc'))) + ' avec le calcul à partir du type de taxe).</div>');
      w.f.querySelector('[data-fo-g]').disabled = !!ecart || !ht; schema();
    }
    Q('[data-fo-l]').addEventListener('input', function (e) { var tr = e.target.closest('tr'), k = e.target.dataset.l; if (!tr || !k) return; var x = etat.lignes[+tr.dataset.i]; x[k] = k === 'montant' ? nombre(e.target.value) : e.target.value; controle(); });
    Q('[data-fo-l]').addEventListener('change', function (e) { var ax = e.target.dataset.ax, tr = e.target.closest('tr'); if (ax && tr) { var xl = etat.lignes[+tr.dataset.i]; xl.axes = xl.axes || {}; xl.axes[ax] = e.target.value; schema(); return; } if (e.target.dataset.l === 'montant') e.target.value = fmt(nombre(e.target.value)); });
    Q('[data-fo-l]').addEventListener('click', function (e) { var b = e.target.closest('[data-fo-del]'); if (!b) return; etat.lignes.splice(+b.closest('tr').dataset.i, 1); dessiner(); });
    Q('[data-fo-add]').addEventListener('click', function () { etat.lignes.push({ libelle: '', montant: 0, compte: (charges[0] || {}).code || '', axes: {}, taxe: IA ? (etat.mtx === 'ventile' ? etat.taxeT : '') : '' }); dessiner(); });
    ['tva', 'ttc'].forEach(function (k) { F(k).addEventListener('input', controle); F(k).addEventListener('change', function () { F(k).value = fmt(num(k)); controle(); }); });
    ['jnl', 'num', 'dateEcr', 'tvaC', 'coll', 'fourn'].forEach(function (k) { F(k).addEventListener('input', schema); F(k).addEventListener('change', schema); });
    F('tiers').addEventListener('change', function () { var v = F('tiers').value.split('|'); if (v[0] && colls.some(function (r) { return r.code === v[0]; })) F('coll').value = v[0]; schema(); });
    if (IA) {
      function marquer(e) { var tr = e.target.closest('tr[data-i]'); if (!tr) return; var x = etat.lignes[+tr.dataset.i]; x.src = 'manuel'; var g = tr.querySelector('[data-fo-bdg]'); if (g) g.innerHTML = badge(x); }
      Q('[data-fo-l]').addEventListener('change', function (e) { if (e.target.dataset.ax || e.target.dataset.l === 'compte') marquer(e); });
      Q('[data-fo-l]').addEventListener('click', function (e) { var b = e.target.closest('[data-fo-lier]'); if (b) lierBudget(+b.closest('tr').dataset.i); });
      F('contrat').addEventListener('change', function () {
        var v = F('contrat').value;
        if (v && etat.lignes.some(function (x) { return x.src === 'manuel'; }) && !window.confirm('Des imputations ont été modifiées à la main : les remplacer par celles du contrat ' + v + ' ?')) { F('contrat').value = etat.contrat; return; }
        etat.contrat = v; appliquerImputations();
      });
      Q('[data-fo-reia]').addEventListener('click', appliquerImputations);
      function modes() {
        QA('[name="fo-mht"]').forEach(function (r) { r.checked = r.value === etat.mht; }); QA('[name="fo-mtx"]').forEach(function (r) { r.checked = r.value === etat.mtx; });
        F('taxeT').disabled = etat.mtx !== 'total'; F('ht').readOnly = etat.mht !== 'total'; Q('[data-fo-add]').style.display = etat.mht === 'total' ? 'none' : '';
        dessiner();
      }
      w.b.addEventListener('change', function (e) {
        var t = e.target;
        if (t.name === 'fo-mht') {
          if (t.value === 'total' && etat.mht !== 'total') etat.htTotal = etat.lignes.reduce(function (s, x) { return s + (+x.montant || 0); }, 0);
          if (t.value === 'ventile' && etat.mht === 'total') { var reste = etat.htTotal - etat.lignes.slice(1).reduce(function (s, x) { return s + (+x.montant || 0); }, 0); if (etat.lignes[0]) etat.lignes[0].montant = Math.max(0, rnd2(reste)); }
          etat.mht = t.value; modes();
        } else if (t.name === 'fo-mtx') { etat.mtx = t.value; if (t.value === 'ventile') etat.lignes.forEach(function (x) { if (!x.taxe) x.taxe = F('taxeT').value || ''; }); modes(); }
        else if (t.dataset && t.dataset.fo === 'taxeT') { etat.taxeT = t.value; controle(); }
      });
      F('ht').addEventListener('input', function () { if (etat.mht === 'total') { etat.htTotal = nombre(F('ht').value); controle(); } });
      F('ht').addEventListener('change', function () { if (etat.mht === 'total') { F('ht').value = fmt(etat.htTotal); } });
      modes();
      // Comptabilisation : détaillée (état courant) ou sur le montant total de la facture (une ligne de charge = TTC, aucune ligne de taxe)
      etat.compta = 'detail'; var sauve = null;
      QA('[name="fo-cpt"]').forEach(function (r) { r.addEventListener('change', function () {
        if (!r.checked) return;
        if (r.value === 'ttc' && etat.compta !== 'ttc') {
          sauve = { mht: etat.mht, mtx: etat.mtx, htTotal: etat.htTotal, taxeT: F('taxeT').value, m0: etat.lignes[0] ? etat.lignes[0].montant : 0, tva: F('tva').value, ttc: F('ttc').value };
          etat.compta = 'ttc'; etat.mht = 'total'; etat.mtx = 'total'; F('taxeT').value = ''; etat.taxeT = ''; Q('[data-fo-mont]').hidden = true; F('ttc').readOnly = false; modes();
        } else if (r.value === 'detail' && etat.compta === 'ttc') {
          etat.compta = 'detail'; Q('[data-fo-mont]').hidden = false;
          if (sauve) { etat.mht = sauve.mht; etat.mtx = sauve.mtx; etat.htTotal = sauve.htTotal; F('taxeT').value = sauve.taxeT; etat.taxeT = sauve.taxeT; if (etat.lignes[0]) etat.lignes[0].montant = sauve.m0; F('tva').value = sauve.tva; F('ttc').value = sauve.ttc; F('tva').readOnly = false; }
          modes();
        }
      }); });
      function lierBudget(i) {
        var x = etat.lignes[i], ov2 = document.createElement('div'); ov2.className = 'fo-ov fo-ov2';
        ov2.innerHTML = '<div class="fo-sub" role="dialog" aria-modal="true" aria-label="Lier une ligne budgétaire"><h3><i class="ti ti-link"></i> Lier une ligne budgétaire</h3><div class="fo-b"><div style="margin-bottom:8px;font-size:13px">Ligne : <b>' + esc(x.libelle || '—') + '</b> · montant HT <b>' + fmt(x.montant) + '</b></div><table><thead><tr><th></th><th>Code</th><th>Ligne budgétaire</th><th class="r">Budget</th><th class="r">Engagé</th><th class="r">Disponible</th><th class="r">Après cette ligne</th></tr></thead><tbody>' +
          REFB.map(function (b) { var dp = b.total - b.engage, ap = dp - (+x.montant || 0); return '<tr data-b="' + esc(b.code) + '"><td><input type="radio" name="fo-bl"' + (x.budget === b.code ? ' checked' : '') + ' aria-label="' + esc(b.code) + '"></td><td>' + esc(b.code) + '</td><td>' + esc(b.label) + '</td><td class="r">' + fmt(b.total) + '</td><td class="r">' + fmt(b.engage) + '</td><td class="r">' + fmt(dp) + '</td><td class="r' + (ap < 0 ? ' ko' : '') + '">' + fmt(ap) + (ap < 0 ? ' · dépassement' : '') + '</td></tr>'; }).join('') + '</tbody></table></div><div class="fo-f"><button type="button" data-b-x>Annuler</button>' + (x.budget ? '<button type="button" data-b-d>Délier</button>' : '') + '<button type="button" class="p" data-b-ok>Lier cette ligne budgétaire</button></div></div>';
        document.body.appendChild(ov2);
        function ferme2() { ov2.remove(); document.removeEventListener('keydown', esc2, true); } function esc2(e) { if (e.key === 'Escape') { e.preventDefault(); ferme2(); } }
        document.addEventListener('keydown', esc2, true);
        ov2.addEventListener('click', function (e) {
          var tr = e.target.closest('tr[data-b]'); if (tr) { tr.querySelector('input').checked = true; return; }
          if (e.target.closest('[data-b-x]') || e.target === ov2) ferme2();
          else if (e.target.closest('[data-b-d]')) { x.budget = ''; x.src = 'manuel'; ferme2(); dessiner(); }
          else if (e.target.closest('[data-b-ok]')) { var r = ov2.querySelector('input:checked'); if (!r) return; x.budget = r.closest('tr').dataset.b; x.src = 'manuel'; ferme2(); dessiner(); }
        });
      }
    }
    w.f.querySelector('[data-fo-x]').addEventListener('click', fermer); w.f.querySelector('[data-fo-r]').addEventListener('click', o.autreFn || ouvrir);
    w.f.querySelector('[data-fo-g]').addEventListener('click', function () {
      var ko = [];
      if (!F('num').value.trim()) ko.push('le n° de facture'); if (!F('dateEcr').value) ko.push('la date de l’écriture'); if (!F('coll').value) ko.push('le compte collectif du tiers');
      if (lignesEff().some(function (x) { return !x.compte || !x.libelle.trim() || !(x.montant > 0); })) ko.push('le libellé, le compte et le montant de chaque ligne');
      if (!autoTax() && tvaVal() > 0 && !F('tvaC').value) ko.push('le compte de TVA');
      if (ko.length) { Q('[data-fo-ctl]').innerHTML = '<div class="fo-ko">Complétez : ' + ko.join(', ') + '.</div>'; return; }
      if (!F('jnl').value) { Q('[data-fo-ctl]').innerHTML = '<div class="fo-ko">Complétez : le journal.</div>'; return; }
      if (generer(lireH())) { if (IA) etat.lignes.forEach(function (x) { window.__OCR_IMPUT[cleMem(F('fourn').value, x.libelle)] = { compte: x.compte, axes: Object.assign({}, x.axes), budget: x.budget }; }); if (o.apres) o.apres(lireH()); fermer(); }
    });
    QA('[data-fo-tab]').forEach(function (t) { t.addEventListener('click', function () { QA('[data-fo-tab]').forEach(function (u) { u.classList.toggle('on', u === t); }); QA('[data-fo-pn]').forEach(function (p) { p.hidden = p.dataset.foPn !== t.dataset.foTab; }); if (t.dataset.foTab === 'c') schema(); }); });
    dessiner();
  }

  /* ---------- constitution des lignes de l'écriture (schéma comptable et génération) ---------- */
  function constituer(h, conv) {
    var pc = window.PLAN_COMPTABLE || [], cpt = function (code) { var r = pc.filter(function (x) { return x.code === code; })[0] || { code: code, libelle: '' }; return { code: r.code, label: r.libelle || r.label || '' }; };
    conv = conv || function () { return {}; };
    var lib = 'Facture ' + h.num + (h.fourn ? ' ' + h.fourn : ''), L = [];
    var ct = h.contrat ? ((window.ECRITURES_REF || {}).contrats || []).filter(function (y) { return y.code === h.contrat; })[0] || null : null;
    h.lignes.forEach(function (x) { L.push(Object.assign({ compte: cpt(x.compte), tiers: null, libelle: String(x.libelle || '').trim(), montant: x.montant, sens: 'DEBIT', echeance: '', axes: x.axes || {}, budget: x.budget || '', contrat: ct }, conv(x.montant))); });
    if (h.taxL) h.taxL.forEach(function (x) { var cc0 = cpt(x.compte); if (!cc0.label) cc0.label = x.label || ''; L.push(Object.assign({ compte: cc0, tiers: null, libelle: x.code + (x.taux > 0 ? ' ' + String(x.taux).replace('.', ',') + ' %' : '') + ' ' + lib, montant: x.montant, sens: x.sens, echeance: '' }, conv(x.montant))); });
    else if (h.tva > 0) L.push(Object.assign({ compte: cpt(h.tvaC), tiers: null, libelle: 'TVA ' + lib, montant: h.tva, sens: 'DEBIT', echeance: '' }, conv(h.tva)));
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
    A.ajouterLignes(L, "Saisie préremplie depuis la facture : vérifiez les lignes, complétez si besoin puis validez la pièce.");
    return true;
  }
  // Écriture automatique (écart de règlement du lettrage…) : renseigne l'en-tête de la saisie d'écritures puis ajoute les lignes à la pièce.
  // h = { jnl, num, ref, date (pièce), dateEcr, message } ; L = lignes { compte:{code,label}, tiers, libelle, montant, sens, echeance, axes }
  window.ECRITURE_AUTO = function (h, L) {
    var A = window.__ecEntete; if (!A || !A.ajouterLignes) return false;
    A.rouvrirEntete(false); if (h.jnl && A.setJournal) A.setJournal(h.jnl);
    poser(c('facture'), h.num || ''); poser(c('reference'), h.ref || ''); poser(c('datePiece'), h.date || h.dateEcr); poser(c('dateEcriture'), h.dateEcr);
    window.__ecSansTreso = true; var ouvert = A.ouvrirLignes(); window.__ecSansTreso = false; if (!ouvert) return false;
    var k1 = nombre(c('cours1') && c('cours1').value), k2 = nombre(c('cours2') && c('cours2').value);
    A.ajouterLignes(L.map(function (x) { return Object.assign({}, x, { montant1: k1 > 0 ? Math.round(x.montant / k1 * 100) / 100 : 0, montant2: k2 > 0 ? Math.round(x.montant / k2 * 100) / 100 : 0 }); }));
    if (h.message && A.notifier) A.notifier(h.message);
    return true;
  };
  window.FACTURE_OCR = { ouvrir: ouvrir, analyser: analyser, nombre: nombre, formulaire: formulaire, fermer: fermer, fenetre: fenetre, planDetail: planDetail, tiersListe: tiersListe, meilleurTiers: meilleurTiers };
  // bouton de la barre d'actions : relayé depuis le conteneur d'actions de l'en-tête de page (voir barre_actions.js)
  var hote = R.querySelector('.entry-import-actions');
  if (hote) { var b = document.createElement('button'); b.type = 'button'; b.className = 'inline-flex min-h-10 items-center'; b.innerHTML = '<i class="ti ti-scan" aria-hidden="true"></i> Facture OCR'; b.title = 'Lire une facture (PDF ou image) et la saisir'; b.addEventListener('click', ouvrir); hote.insertBefore(b, hote.firstChild); }
})();
