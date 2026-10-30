  var selId = '';
  var ENTETE = ['Identifiant', 'Nom', 'Groupe', 'Email', 'Rôle', 'Statut'];
  function trouver(id) { return USERS.filter(function (x) { return x.id === id; })[0]; }
  function liste() {
    return USERS.filter(function (u) { return !filtre || (u.id + ' ' + u.nom + ' ' + u.email).toLowerCase().indexOf(filtre) >= 0; })
      .map(function (u) { return [u.id, u.nom, u.groupe || '—', u.email, role(u) || '—', u.actif ? 'Actif' : 'Inactif']; });
  }
  function editer() {
    var u = trouver(selId); if (!u) return;
    open(); F.edit = u.id; F.mode = 'exist'; F.groupe = u.groupe; F.nom = u.nom; F.id = u.id; F.email = u.email;
    F.societes = (u.societes || []).slice(); F.det = JSON.parse(JSON.stringify(u.det || {})); body();
  }
  function supprimer() {
    var u = trouver(selId); if (!u) return;
    if (u.id === 'superadmin') { toast('L’administrateur principal ne peut pas être supprimé.'); return; }
    var ov = document.createElement('div'); ov.className = 'gu-ov';
    ov.innerHTML = '<div class="gu-md" style="width:440px" role="alertdialog"><div class="gu-bd" style="min-height:0"><h3 style="margin:0 0 8px;font-size:16px">Supprimer l’utilisateur ?</h3><p class="gu-hint" style="margin:0">« ' + esc(u.id) + ' — ' + esc(u.nom) + ' » sera retiré de la liste et de ses rattachements aux journaux. Cette action est définitive.</p></div>' +
      '<div class="gu-ft"><span style="flex:1"></span><button type="button" class="ga-btn" data-no>Annuler</button><button type="button" class="ga-btn" data-yes style="background:#b91c1c;border-color:#b91c1c;color:#fff">Supprimer</button></div></div>';
    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-yes]')) { USERS.splice(USERS.indexOf(u), 1); selId = ''; ov.remove(); draw(); window.dispatchEvent(new Event('ga-users-changed')); toast('Utilisateur « ' + u.id + ' » supprimé.'); }
      else if (e.target.closest('[data-no]') || e.target === ov) ov.remove();
    });
    host.appendChild(ov);
  }
  function telecharger(nom, type, octets) {
    var url = URL.createObjectURL(new Blob([octets], { type: type })), a = document.createElement('a');
    a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function utf8(s) { return new TextEncoder().encode(s); }
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(b) { var c = 0xFFFFFFFF; for (var i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function zip(fichiers) {
    var parts = [], centr = [], off = 0;
    function u16(v) { return [v & 255, (v >>> 8) & 255]; } function u32(v) { return [v & 255, (v >>> 8) & 255, (v >>> 16) & 255, (v >>> 24) & 255]; }
    fichiers.forEach(function (f) {
      var nom = utf8(f[0]), d = utf8(f[1]), crc = crc32(d);
      var loc = [].concat([0x50, 0x4B, 3, 4], u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(d.length), u32(d.length), u16(nom.length), u16(0));
      parts.push(new Uint8Array(loc), nom, d);
      centr.push([].concat([0x50, 0x4B, 1, 2], u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(d.length), u32(d.length), u16(nom.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(off)), Array.prototype.slice.call(nom));
      off += loc.length + nom.length + d.length;
    });
    var cd = [].concat.apply([], centr);
    parts.push(new Uint8Array(cd), new Uint8Array([].concat([0x50, 0x4B, 5, 6], u16(0), u16(0), u16(fichiers.length), u16(fichiers.length), u32(cd.length), u32(off), u16(0))));
    var tot = parts.reduce(function (n, p) { return n + p.length; }, 0), out = new Uint8Array(tot), p0 = 0;
    parts.forEach(function (p) { out.set(p, p0); p0 += p.length; });
    return out;
  }
  function xml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function colonne(i) { return String.fromCharCode(65 + i); }
  function exporterXlsx() {
    var L = [ENTETE].concat(liste());
    var rows = L.map(function (r, i) { return '<row r="' + (i + 1) + '">' + r.map(function (v, j) { return '<c r="' + colonne(j) + (i + 1) + '" t="inlineStr"' + (i === 0 ? ' s="1"' : '') + '><is><t>' + xml(v) + '</t></is></c>'; }).join('') + '</row>'; }).join('');
    var cols = [16, 28, 20, 32, 18, 10].map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; }).join('');
    var X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    var f = [
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Utilisateurs" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2E427B"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>'],
      ['xl/worksheets/sheet1.xml', X + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>' + cols + '</cols><sheetData>' + rows + '</sheetData></worksheet>']
    ];
    telecharger('utilisateurs.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip(f));
    toast('Export Excel (XLSX) généré : ' + (L.length - 1) + ' utilisateur(s).');
  }
  function latin(s) { return String(s).replace(/[—–]/g, '-').replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[^\x00-\xFF]/g, '?'); }
  function pdfTxt(s) { return latin(s).replace(/([()\\])/g, '\\$1'); }
  function exporterPdf() {
    var L = liste(), W = 842, H = 595, M = 40, X = [M, M + 100, M + 270, M + 410, M + 620, M + 700], ligne = 20, pages = [], cur;
    function neuve() { cur = []; pages.push(cur); cur.push('0.18 0.26 0.48 rg ' + M + ' ' + (H - M - 4) + ' ' + (W - 2 * M) + ' 18 re f'); cur.push('BT /F2 9 Tf 1 1 1 rg'); ENTETE.forEach(function (e, i) { cur.push('1 0 0 1 ' + (X[i] + 4) + ' ' + (H - M + 2) + ' Tm (' + pdfTxt(e.toUpperCase()) + ') Tj'); }); cur.push('ET'); return H - M - 4; }
    var y = neuve() - ligne + 4;
    L.forEach(function (r) {
      if (y < M + 20) y = neuve() - ligne + 4;
      cur.push('0.85 0.86 0.89 RG ' + M + ' ' + (y - 6) + ' m ' + (W - M) + ' ' + (y - 6) + ' l S');
      cur.push('BT /F1 9 Tf 0.04 0.07 0.2 rg'); r.forEach(function (c, i) { cur.push('1 0 0 1 ' + (X[i] + 4) + ' ' + y + ' Tm (' + pdfTxt(c) + ') Tj'); }); cur.push('ET');
      y -= ligne;
    });
    var obj = [], n = pages.length;
    obj[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    obj[2] = '<< /Type /Pages /Kids [' + pages.map(function (_, i) { return (5 + 2 * i) + ' 0 R'; }).join(' ') + '] /Count ' + n + ' >>';
    obj[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    obj[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    pages.forEach(function (p, i) {
      var pie = 'BT /F1 8 Tf 0.4 0.45 0.55 rg 1 0 0 1 ' + M + ' 20 Tm (' + pdfTxt('SoftCompta - Liste des utilisateurs - page ' + (i + 1) + '/' + n) + ') Tj ET';
      var flux = p.join('\n') + '\n' + pie;
      obj[5 + 2 * i] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (6 + 2 * i) + ' 0 R >>';
      obj[6 + 2 * i] = '<< /Length ' + flux.length + ' >>\nstream\n' + flux + '\nendstream';
    });
    var out = '%PDF-1.4\n', off = [];
    for (var i = 1; i < obj.length; i++) { off[i] = out.length; out += i + ' 0 obj\n' + obj[i] + '\nendobj\n'; }
    var xr = out.length; out += 'xref\n0 ' + obj.length + '\n0000000000 65535 f \n';
    for (i = 1; i < obj.length; i++) out += ('0000000000' + off[i]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + obj.length + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
    var oct = new Uint8Array(out.length); for (i = 0; i < out.length; i++) oct[i] = out.charCodeAt(i) & 255;
    telecharger('utilisateurs.pdf', 'application/pdf', oct);
    toast('Export PDF généré : ' + L.length + ' utilisateur(s).');
  }
  function imprimer() {
    var w = window.open('', '_blank'); if (!w) { toast('Autorisez les fenêtres pop-up pour imprimer.'); return; }
    w.document.write('<!doctype html><meta charset="utf-8"><title>Liste des utilisateurs</title><style>body{font:13px system-ui,sans-serif;color:#0B1332;margin:24px}h1{font-size:18px}table{border-collapse:collapse;width:100%}th{background:#2E427B;color:#fff;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact}td{padding:8px 10px;border-bottom:1px solid #D6D9E0}</style><h1>Liste des utilisateurs</h1><table><thead><tr>' +
      ENTETE.map(function (e) { return '<th>' + xml(e) + '</th>'; }).join('') + '</tr></thead><tbody>' + liste().map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + xml(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>');
    w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 300);
  }
