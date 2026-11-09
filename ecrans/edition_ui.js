// Export et éditions imprimables (charte §8.1, §5, §11 — chapitre 13.17)
//  · Nom des fichiers téléchargés : <application>_<objet>_<aaaammjj-hhmm>.<ext> (SoftAccounting_Balance-generale_20261104-1015.xlsx) ; CSV : séparateur point-virgule, UTF-8 avec BOM
//  · Au-delà de 5 000 lignes : export en arrière-plan et notification quand le fichier est prêt (SC_EXPORT.notifier)
//  · Impression / PDF : A4 portrait (paysage au-delà de sept colonnes), marges 15 mm ; en-tête (logo client, raison sociale, NIF | titre, période, devise, QR de vérification, filet marine 1,5 pt),
//    tableau (en-tête neutral-50, 8 pt majuscules, répété à chaque page ; filets neutral-200 ; totaux en gras), pied (logo Softwell, application, « Édité le … par … », « Page x / y »)
(function () {
  if (window.SC_EXPORT) return;
  function z(n) { return ('0' + n).slice(-2); }
  function horo() { var d = new Date(); return { f: d.getFullYear() + z(d.getMonth() + 1) + z(d.getDate()) + '-' + z(d.getHours()) + z(d.getMinutes()), long: z(d.getDate()) + '/' + z(d.getMonth() + 1) + '/' + d.getFullYear() + ' à ' + z(d.getHours()) + ':' + z(d.getMinutes()) }; }
  function objet() {
    var t = (document.title || '').split('—').slice(1).join('—').trim() || 'export';
    return t.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function nom(ext) { return 'SoftAccounting_' + objet() + '_' + horo().f + '.' + ext; }
  function notifier(msg) {
    var t = document.createElement('div'); t.className = 'sc-notif'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.classList.add('on'); }, 20); setTimeout(function () { t.classList.remove('on'); setTimeout(function () { t.remove(); }, 300); }, 4200);
  }
  // nom de fichier uniforme à chaque téléchargement par lien temporaire
  var c0 = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function () {
    try { if (this.download && /^blob:/.test(this.href || '')) { var m = /\.([a-z0-9]+)$/i.exec(this.download); this.download = nom(m ? m[1].toLowerCase() : 'xlsx'); } } catch (e) {}
    return c0.apply(this, arguments);
  };
  // Export volumineux : en arrière-plan, notification à la fin
  function lancer(n, faire) {
    if (n > 5000) { notifier('Export de ' + n.toLocaleString('fr-FR') + ' lignes lancé en arrière-plan. Vous serez notifié quand le fichier sera prêt.'); setTimeout(function () { faire(); notifier('Votre fichier est prêt : le téléchargement démarre.'); }, 2500); } else faire();
  }

  // ---------- Excel (.xlsx) mis en charte : fichier réel, sans logo ni QR ----------
  // Lignes d'en-tête : titre de l'état, nom du projet, période / devise ; puis tableau : en-tête neutral-50 (majuscules 9 pt neutral-600), corps Inter 10 pt, montants à droite (#,##0.00),
  // totaux en gras sur fond neutral-50, filets neutral-200, largeurs de colonnes ajustées, en-tête figé et filtre automatique.
  var CRC = (function () { var t = []; for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(fichiers) {
    var enc = new TextEncoder(), parts = [], central = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; } function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    fichiers.forEach(function (f) {
      var nom = enc.encode(f[0]), d = enc.encode(f[1]), c = crc32(d);
      var h = [].concat([0x50, 0x4B, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(d.length), u32(d.length), u16(nom.length), u16(0));
      parts.push(new Uint8Array(h), nom, d);
      central.push([].concat([0x50, 0x4B, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(c), u32(d.length), u32(d.length), u16(nom.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off)), Array.prototype.slice.call(nom));
      off += h.length + nom.length + d.length;
    });
    var cd = [].concat.apply([], central), fin = [].concat([0x50, 0x4B, 5, 6], u16(0), u16(0), u16(fichiers.length), u16(fichiers.length), u32(cd.length), u32(off), u16(0));
    parts.push(new Uint8Array(cd), new Uint8Array(fin)); return new Blob(parts, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
  function ex(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, ''); }
  function col(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function nombre(t) {   // « 1 104 000,00 » (fr) ou « 1,234.56 » (en) → nombre ; sinon null
    t = String(t).replace(/[\u00a0\u202f\s]/g, ''); if (!t || t === '—' || t === '-') return null; if (!/^-?[\d.,]+$/.test(t) || !/\d/.test(t)) return null;
    var vir = t.lastIndexOf(','), pt = t.lastIndexOf('.'), dec = vir > pt ? ',' : (pt > vir ? '.' : ''); if (dec === ',' ) t = t.replace(/\./g, '').replace(',', '.'); else if (dec === '.') t = t.replace(/,/g, ''); else t = t.replace(/[.,]/g, '');
    var v = parseFloat(t); return isNaN(v) ? null : v;
  }
  function projetActif() { var l = [].slice.call(document.querySelectorAll('.soft-topbar *')).filter(function (e) { return !e.children.length && /^projet actif$/i.test(e.textContent.trim()); })[0]; return l && l.nextElementSibling ? l.nextElementSibling.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function xlsxTable(ecr) {
    var tables = [].slice.call(ecr.querySelectorAll('table')).filter(function (t) { return t.offsetParent !== null && t.tBodies.length && t.tBodies[0].rows.length; }); if (!tables.length) { notifier('Aucun tableau à exporter.'); return; }
    var T = tables.sort(function (a, b) { return b.rows.length - a.rows.length; })[0], ths = [].slice.call(T.tHead && T.tHead.rows[0] ? T.tHead.rows[0].cells : []).filter(function (c) { return c.offsetParent !== null; }), idx = ths.map(function (c) { return c.cellIndex; });
    var head = ths.map(function (c) { return c.textContent.replace(/\s+/g, ' ').trim(); }), rows = [], TOT = /(^|\s)(t|tg|g|total|row-total|row-sous-total|gl-tot|gl-mois|gl-grp|m|s)(\s|$)/;
    [].slice.call(T.tBodies).forEach(function (tb) { [].slice.call(tb.rows).forEach(function (r) { if (r.hidden || r.offsetParent === null || r.querySelector('.sc-vide,.empty-state') || /(^|\s)(plus|sc-sk|filter-row|flt)(\s|$)/.test(r.className)) return; var cells = [].slice.call(r.cells); if (!cells.length) return; var vals = idx.map(function (i) { var c = cells[i]; return c ? c.textContent.replace(/\s+/g, ' ').trim() : ''; }); if (cells.some(function (c) { return c.colSpan > 1; })) { var tot = []; cells.forEach(function (c) { tot.push(c.textContent.replace(/\s+/g, ' ').trim()); for (var k = 1; k < c.colSpan; k++) tot.push(''); }); vals = tot.slice(0, head.length); while (vals.length < head.length) vals.push(''); } rows.push({ v: vals, tot: TOT.test(r.className) || cells.some(function (c) { return c.colSpan > 1; }) || /^(Total|TOTAL)/.test(vals[0] + ' ' + (vals[1] || '')) }); }); });
    [].slice.call(T.tFoot ? T.tFoot.rows : []).forEach(function (r) { var vals = [].slice.call(r.cells).map(function (c) { return c.textContent.replace(/\s+/g, ' ').trim(); }); rows.push({ v: vals.slice(0, head.length), tot: true }); });
    var TXT = /^(code|compte|n°|numéro|num|réf|référence|date|libellé|journal|pièce|tiers|site|jl|contrat|statut|plan|axe|auxiliaire|nom|type)/i, num = head.map(function (_, j) { if (TXT.test(head[j])) return false; var n = 0, tt = 0; rows.forEach(function (r) { if (r.v[j] !== '' && r.v[j] !== '—') { tt++; if (nombre(r.v[j]) !== null && /[\d]/.test(r.v[j])) n++; } }); return tt > 0 && n / tt > 0.7; });
    var titre = (document.title || '').split('—').slice(1).join('—').trim() || 'Édition', texte = ecr.textContent.replace(/\s+/g, ' ');
    var tt2 = [].slice.call(ecr.querySelectorAll('h1,h2,h3,[class*="titre"],[class*="-ti"]')).filter(function (e) { return e.offsetParent !== null; }).map(function (e) { return e.textContent; }).join(' '), pe = /du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/.exec(tt2), pf = / au (\d{2}\/\d{2}\/\d{4})/.exec(tt2); if (!pe && pf) pe = [0, '01/01/' + pf[1].slice(6), pf[1]]; if (!pe) pe = /du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/.exec(texte);
    var dev = /\((MGA|USD|EUR)\)/.exec(texte), proj = projetActif(), h = horo();
    var X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n', R = [], widths = head.map(function (t) { return Math.min(60, Math.max(8, t.length + 3)); });
    function cs(ref, st, t) { return '<c r="' + ref + '" s="' + st + '" t="inlineStr"><is><t xml:space="preserve">' + ex(t) + '</t></is></c>'; }
    function cn(ref, st, v) { return '<c r="' + ref + '" s="' + st + '"><v>' + v + '</v></c>'; }
    R.push('<row r="1" ht="24" customHeight="1">' + cs('A1', 1, titre) + '</row>');
    R.push('<row r="2">' + cs('A2', 2, 'Projet : ' + (proj || '—')) + '</row>');
    R.push('<row r="3">' + cs('A3', 2, (pe ? 'Période du ' + pe[1] + ' au ' + pe[2] + ' · ' : '') + 'Devise : ' + (dev ? dev[1] : 'MGA') + ' · Édité le ' + h.long) + '</row>');
    var HR = 5; R.push('<row r="' + HR + '" ht="20" customHeight="1">' + head.map(function (t, j) { return cs(col(j) + HR, num[j] ? 4 : 3, t.toUpperCase()); }).join('') + '</row>');
    rows.forEach(function (rw, i) {
      var n = HR + 1 + i;
      R.push('<row r="' + n + '">' + head.map(function (_, j) {
        var t = rw.v[j] == null ? '' : rw.v[j], ref = col(j) + n, v = num[j] ? nombre(t) : null;
        if (v !== null && /\d/.test(t)) { widths[j] = Math.min(60, Math.max(widths[j], (Math.abs(v) < 1e15 ? v.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(v)).length + 3)); return cn(ref, rw.tot ? 8 : 6, v); }
        if (!rw.tot) widths[j] = Math.min(60, Math.max(widths[j], Math.min(t.length, 60) + 2)); return cs(ref, rw.tot ? 7 : 5, t === '—' ? '' : t);
      }).join('') + '</row>');
    });
    var last = col(head.length - 1) + (HR + rows.length);
    var sheet = X + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0" showGridLines="0"><pane ySplit="' + HR + '" topLeftCell="A' + (HR + 1) + '" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetFormatPr defaultRowHeight="16"/><cols>' + widths.map(function (w, j) { return '<col min="' + (j + 1) + '" max="' + (j + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('') + '</cols><sheetData>' + R.join('') + '</sheetData><autoFilter ref="A' + HR + ':' + last + '"/></worksheet>';
    var styles = X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
      '<fonts count="5"><font><sz val="10"/><color rgb="FF0B1332"/><name val="Inter"/></font><font><b/><sz val="9"/><color rgb="FF5B606D"/><name val="Inter"/></font><font><b/><sz val="14"/><color rgb="FF0B1332"/><name val="Outfit"/></font><font><sz val="10"/><color rgb="FF5B606D"/><name val="Inter"/></font><font><b/><sz val="10"/><color rgb="FF0B1332"/><name val="Inter"/></font></fonts>' +
      '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5F7F9"/><bgColor indexed="64"/></patternFill></fill></fills>' +
      '<borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left/><right/><top/><bottom style="thin"><color rgb="FFE3E7EE"/></bottom><diagonal/></border></borders>' +
      '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
      '<cellXfs count="9"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
      '<xf numFmtId="0" fontId="2" fillId="0" borderId="0" xfId="0" applyFont="1"><alignment vertical="center"/></xf>' +
      '<xf numFmtId="0" fontId="3" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center" wrapText="1"/></xf>' +
      '<xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
      '<xf numFmtId="4" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>' +
      '<xf numFmtId="0" fontId="4" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="left" vertical="center"/></xf>' +
      '<xf numFmtId="4" fontId="4" fillId="2" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf></cellXfs></styleSheet>';
    var nomF = titre.replace(/[\\\/?*\[\]:]/g, ' ').slice(0, 31) || 'Export';
    var blob = zip([
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + ex(nomF) + '" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', styles], ['xl/worksheets/sheet1.xml', sheet]]);
    var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nom('xlsx'); document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    return { colonnes: head.length, lignes: rows.length };
  }
  window.SC_EXPORT = { nom: nom, notifier: notifier, lancer: lancer, horo: horo, xlsxTable: xlsxTable, nombre: nombre };

  // ---------- impression / PDF ----------
  var css = '' +
    '.sc-notif{position:fixed;right:20px;bottom:20px;z-index:3000;max-width:360px;background:#0B1332;color:#fff;padding:12px 16px;border-radius:10px;font-size:13px;box-shadow:0 12px 30px rgba(11,19,50,.35);opacity:0;transform:translateY(10px);transition:.25s}.sc-notif.on{opacity:1;transform:none}' +
    '.ba-exp{position:relative}.ba-expm{min-width:300px;padding:8px}.ba-expm:not([hidden]){display:flex;flex-direction:column}.ba-expm .sc-it{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;padding:10px 12px;border:0;background:none;border-radius:8px;cursor:pointer;font:inherit}.ba-expm .sc-it:hover,.ba-expm .sc-it:focus-visible{background:#E8EEFB}.ba-expm .sc-it i{font-size:20px;color:#2E427B;margin-top:2px}.ba-expm .sc-it b{display:block;font-size:14px;color:#0B1332}.ba-expm .sc-it small{display:block;font-size:12.5px;color:#5B606D;margin-top:2px}.ba-expm .sc-it:disabled{opacity:.5;cursor:default}' +
    '.ba-expm .sc-pied{border-top:1px solid #E3E7EE;margin-top:6px;padding:10px 12px 4px;font-size:13px;color:#5B606D}' +
    '.sc-ed-head,.sc-ed-foot{display:none}' +
    '@media print{' +
    'body{font-family:Inter,Arial,sans-serif;font-size:9.5pt;color:#0B1332}h1,h2,h3{font-family:Outfit,Inter,sans-serif;color:#0B1332}h2{font-size:14pt}h3{font-size:12pt}' +
    '.sc-ed-head{display:flex!important;justify-content:space-between;align-items:flex-start;gap:12pt;border-bottom:1.5pt solid #2E427B;padding-bottom:7pt;margin-bottom:9pt}' +
    '.sc-ed-head .g{display:flex;gap:10pt;align-items:flex-start}.sc-ed-logo{width:70pt;height:40pt;border:1pt dashed #5B606D;display:flex;align-items:center;justify-content:center;font-size:8pt;color:#5B606D;text-align:center}.sc-ed-logo img{max-width:100%;max-height:100%}' +
    '.sc-ed-head .rs{font:600 14pt Outfit,Inter,sans-serif;color:#0B1332}.sc-ed-head .nif{font-size:9pt;color:#5B606D;margin-top:2pt}.sc-ed-head .d{display:flex;gap:10pt;align-items:flex-start;text-align:right}.sc-ed-head .ti{font:600 16pt Outfit,Inter,sans-serif;color:#0B1332}.sc-ed-head .pe{font-size:9pt;color:#5B606D;margin-top:2pt}.sc-ed-qr{width:46pt;text-align:center;font-size:7pt;color:#5B606D}.sc-ed-qr svg{width:46pt;height:46pt;display:block}' +
    '.sc-ed-foot{display:flex!important;position:fixed;left:0;right:0;bottom:0;align-items:center;gap:8pt;border-top:.5pt solid #E3E7EE;padding-top:4pt;font-size:8pt;color:#5B606D}.sc-ed-foot b{font:700 10pt Outfit,Inter,sans-serif;color:#0B1332}.sc-ed-foot .sp{flex:1}' +
    'table{border-collapse:collapse}table thead{display:table-header-group}table tr{break-inside:avoid}' +
    'table th{background:#F5F7F9!important;color:#5B606D!important;font-size:8pt!important;text-transform:uppercase;letter-spacing:.02em;font-weight:700;border-bottom:.75pt solid #D6D9E0!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    'table td{font-size:8.5pt!important;border-bottom:.5pt solid #E3E7EE!important;color:#0B1332}table td.r,table td.n,table td.num,table td.amount,table th.r,table th.n{text-align:right;font-variant-numeric:tabular-nums}' +
    'tr.t td,tr.tg td,tr.total td,tr.row-total td,tr.row-sous-total td,tfoot td{font-weight:700!important;background:#F5F7F9!important;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
    '.etm-fond,.etm-h,.etm-sub,.page-breadcrumb,.page-title,.page-subtitle,.filters-info,.be-vide{display:none!important}' +
    'tr>td:first-child[style*="padding-left"],tr>th:first-child[style*="padding-left"]{padding-left:3pt!important}' +
    'table td.amount,table td.num,table td.n,table td.r,table td.mono,table th.n,table th.r{white-space:nowrap}table td,table th{padding:3pt 5pt!important}table{width:100%!important;min-width:0!important}' +
    '.sc-notif{display:none!important}}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function qr(graine) {
    var h = 7; for (var i = 0; i < graine.length; i++) h = (h * 31 + graine.charCodeAt(i)) >>> 0; var N = 21, c = '';
    function repere(x, y) { c += '<rect x="' + x + '" y="' + y + '" width="7" height="7" fill="#0B1332"/><rect x="' + (x + 1) + '" y="' + (y + 1) + '" width="5" height="5" fill="#fff"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="3" height="3" fill="#0B1332"/>'; }
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) { if ((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) continue; h = (h * 1103515245 + 12345) >>> 0; if ((h >>> 16) & 1) c += '<rect x="' + x + '" y="' + y + '" width="1" height="1" fill="#0B1332"/>'; }
    repere(0, 0); repere(14, 0); repere(0, 14);
    return '<svg viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">' + c + '</svg>';
  }
  function champEntite(lib) { var v = ''; [].slice.call(document.querySelectorAll('.ig-f')).forEach(function (f) { var l = f.querySelector('.ig-l'), i = f.querySelector('input'); if (!v && l && i && new RegExp('^' + lib, 'i').test(l.textContent.trim()) && i.value) v = i.value; }); return v; }
  function ecran() { return [].slice.call(document.querySelectorAll('[data-screen]')).filter(function (e) { return e.offsetParent !== null; })[0]; }
  function avant() {
    var s = ecran(), titre = (document.title || '').split('—').slice(1).join('—').trim() || 'Édition', texte = s ? s.textContent.replace(/\s+/g, ' ') : '';
    var tt = s ? [].slice.call(s.querySelectorAll('h1,h2,h3,[class*="titre"],[class*="-ti"]')).filter(function (e) { return e.offsetParent !== null; }).map(function (e) { return e.textContent; }).join(' ') : '', pe = /du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/.exec(tt), pf = / au (\d{2}\/\d{2}\/\d{4})/.exec(tt); if (!pe && pf) pe = [0, '01/01/' + pf[1].slice(6), pf[1]]; if (!pe) pe = /du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/.exec(texte);
    var dev = /\((MGA|USD|EUR)\)/.exec(texte), h = horo(), user = (document.querySelector('.soft-topbar [class*="user"] b, .soft-topbar strong') || {}).textContent || 'admin';
    var logo = document.querySelector('[data-ig-prev] img'), rs = champEntite("Libellé de l'entité") || 'SOFTWELL — Version partenaire', nif = champEntite('NIF') || '000 000 000';
    var cols = 0; if (s) [].slice.call(s.querySelectorAll('table')).forEach(function (t) { if (t.offsetParent !== null) { var r = t.tHead && t.tHead.rows[0] ? [].slice.call(t.tHead.rows[0].cells).filter(function (c) { return c.offsetParent !== null; }).length : 0; if (r > cols) cols = r; } });
    var ps = document.getElementById('sc-ed-page') || document.head.appendChild(Object.assign(document.createElement('style'), { id: 'sc-ed-page' }));
    ps.textContent = '@page{size:A4 ' + (cols > 7 ? 'landscape' : 'portrait') + ';margin:15mm;@bottom-right{content:"Page " counter(page) " / " counter(pages);font:8pt Inter,sans-serif;color:#5B606D}}';
    var head = document.createElement('div'); head.className = 'sc-ed-head';
    head.innerHTML = '<div class="g"><div class="sc-ed-logo">' + (logo ? '<img src="' + logo.src + '" alt="">' : 'Logo client') + '</div><div><div class="rs">' + esc(rs) + '</div><div class="nif">NIF ' + esc(nif) + '</div></div></div>' +
      '<div class="d"><div><div class="ti">' + esc(titre) + '</div><div class="pe">' + (pe ? 'Période du ' + pe[1] + ' au ' + pe[2] : '') + '</div><div class="pe">Devise : ' + (dev ? dev[1] : 'MGA') + '</div></div><div class="sc-ed-qr">' + qr(titre + h.f) + 'Vérification</div></div>';
    var foot = document.createElement('div'); foot.className = 'sc-ed-foot';
    foot.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#C9A227" stroke-width="1.6"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20"/></svg><b>Softwell</b><span>Soft Accounting · Édité le ' + h.long + ' par ' + esc(user.trim() || 'admin') + '</span><span class="sp"></span>';
    document.body.insertBefore(head, document.body.firstChild); document.body.appendChild(foot);
  }
  function apres() { [].slice.call(document.querySelectorAll('.sc-ed-head,.sc-ed-foot')).forEach(function (e) { e.remove(); }); }
  window.addEventListener('beforeprint', function () { apres(); avant(); }); window.addEventListener('afterprint', apres);
})();
