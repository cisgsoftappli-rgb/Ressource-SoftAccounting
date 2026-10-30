<script>
// Gestion des accès : exports PDF / XLSX du tableau affiché (Journaux, Sites, Plan de regroupement, Permissions). Boutons relayés dans la barre d'actions de page.
(function () {
  var root = document.currentScript.parentElement.querySelector('[data-ga]');
  function say(t) { var d = document.createElement('div'); d.className = 'ga-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2400); }
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
  function col(i) { var s = ''; i++; while (i > 0) { var r = (i - 1) % 26; s = String.fromCharCode(65 + r) + s; i = Math.floor((i - 1) / 26); } return s; }
  function telecharger(nom, type, octets) {
    var url = URL.createObjectURL(new Blob([octets], { type: type })), a = document.createElement('a');
    a.href = url; a.download = nom; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
  }
  function largeurs(tete, lignes) { return tete.map(function (h, i) { var m = String(h).length; lignes.forEach(function (r) { m = Math.max(m, String(r[i] == null ? '' : r[i]).length); }); return Math.max(6, Math.min(60, m)); }); }
  function xlsx(fichier, feuille, tete, lignes) {
    var L = [tete].concat(lignes), X = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n';
    var rows = L.map(function (r, i) { return '<row r="' + (i + 1) + '">' + r.map(function (v, j) { return '<c r="' + col(j) + (i + 1) + '" t="inlineStr"' + (i === 0 ? ' s="1"' : '') + '><is><t>' + xml(v == null ? '' : v) + '</t></is></c>'; }).join('') + '</row>'; }).join('');
    var cols = largeurs(tete, lignes).map(function (w, i) { return '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + (w + 3) + '" customWidth="1"/>'; }).join('');
    telecharger(fichier, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', zip([
      ['[Content_Types].xml', X + '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
      ['_rels/.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
      ['xl/workbook.xml', X + '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="' + xml(feuille.slice(0, 31)) + '" sheetId="1" r:id="rId1"/></sheets></workbook>'],
      ['xl/_rels/workbook.xml.rels', X + '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
      ['xl/styles.xml', X + '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF2E427B"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="2"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/></cellXfs></styleSheet>'],
      ['xl/worksheets/sheet1.xml', X + '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols>' + cols + '</cols><sheetData>' + rows + '</sheetData></worksheet>']
    ]));
  }
  function latin(s) { return String(s == null ? '' : s).replace(/[—–]/g, '-').replace(/[’‘]/g, "'").replace(/[“”«»]/g, '"').replace(/[^\x00-\xFF]/g, '?'); }
  function pdfTxt(s) { return latin(s).replace(/([()\\])/g, '\\$1'); }
  function pdf(fichier, titre, sous, tete, lignes) {
    var W = 842, H = 595, M = 36, utile = W - 2 * M, pw = largeurs(tete, lignes), tot = pw.reduce(function (a, b) { return a + b; }, 0), X = [], x = M, cap = [], FS = 8, ligne = 18, pages = [], cur, y;
    pw.forEach(function (p) { var w = utile * p / tot; X.push(x); cap.push(Math.max(3, Math.floor((w - 8) / (FS * 0.52)))); x += w; });
    function coupe(t, n) { t = latin(t); return t.length > n ? t.slice(0, Math.max(1, n - 2)) + '..' : t; }
    function neuve(premiere) {
      cur = []; pages.push(cur); y = H - M;
      if (premiere) { cur.push('BT /F2 13 Tf 0.04 0.07 0.2 rg 1 0 0 1 ' + M + ' ' + y + ' Tm (' + pdfTxt(titre) + ') Tj ET'); y -= 15; if (sous) { cur.push('BT /F1 9 Tf 0.36 0.38 0.43 rg 1 0 0 1 ' + M + ' ' + y + ' Tm (' + pdfTxt(sous) + ') Tj ET'); y -= 10; } y -= 10; }
      cur.push('0.18 0.26 0.48 rg ' + M + ' ' + (y - 5) + ' ' + utile + ' 17 re f'); cur.push('BT /F2 ' + FS + ' Tf 1 1 1 rg');
      tete.forEach(function (h, i) { cur.push('1 0 0 1 ' + (X[i] + 4) + ' ' + (y) + ' Tm (' + pdfTxt(coupe(String(h).toUpperCase(), cap[i])) + ') Tj'); }); cur.push('ET'); y -= ligne + 2;
    }
    neuve(true);
    lignes.forEach(function (r) {
      if (y < M + 14) neuve(false);
      cur.push('0.85 0.86 0.89 RG ' + M + ' ' + (y - 5) + ' m ' + (W - M) + ' ' + (y - 5) + ' l S');
      cur.push('BT /F1 ' + FS + ' Tf 0.04 0.07 0.2 rg'); r.forEach(function (c, i) { cur.push('1 0 0 1 ' + (X[i] + 4) + ' ' + y + ' Tm (' + pdfTxt(coupe(c == null ? '' : c, cap[i])) + ') Tj'); }); cur.push('ET');
      y -= ligne;
    });
    var obj = [], n = pages.length;
    obj[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    obj[2] = '<< /Type /Pages /Kids [' + pages.map(function (_, i) { return (5 + 2 * i) + ' 0 R'; }).join(' ') + '] /Count ' + n + ' >>';
    obj[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    obj[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    pages.forEach(function (p, i) {
      var flux = p.join('\n') + '\nBT /F1 8 Tf 0.4 0.45 0.55 rg 1 0 0 1 ' + M + ' 20 Tm (' + pdfTxt('SoftCompta - ' + titre + ' - page ' + (i + 1) + '/' + n) + ') Tj ET';
      obj[5 + 2 * i] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + W + ' ' + H + '] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + (6 + 2 * i) + ' 0 R >>';
      obj[6 + 2 * i] = '<< /Length ' + flux.length + ' >>\nstream\n' + flux + '\nendstream';
    });
    var out = '%PDF-1.4\n', off = [], i;
    for (i = 1; i < obj.length; i++) { off[i] = out.length; out += i + ' 0 obj\n' + obj[i] + '\nendobj\n'; }
    var xr = out.length; out += 'xref\n0 ' + obj.length + '\n0000000000 65535 f \n';
    for (i = 1; i < obj.length; i++) out += ('0000000000' + off[i]).slice(-10) + ' 00000 n \n';
    out += 'trailer\n<< /Size ' + obj.length + ' /Root 1 0 R >>\nstartxref\n' + xr + '\n%%EOF';
    var oct = new Uint8Array(out.length); for (i = 0; i < out.length; i++) oct[i] = out.charCodeAt(i) & 255;
    telecharger(fichier, 'application/pdf', oct);
  }
  // Lecture du tableau affiché : cases et interrupteurs deviennent Oui / Non
  function lire(pane) {
    var t = pane.querySelector('table.ga-t'); if (!t) return null;
    var tete = [].map.call(t.querySelectorAll('thead th'), function (th) { return th.textContent.replace(/\s+/g, ' ').trim(); });
    var lignes = [].map.call(t.querySelectorAll('tbody tr'), function (tr) {
      return [].map.call(tr.children, function (td) {
        var c = td.querySelector('input[type=checkbox]'); if (c) return c.checked ? 'Oui' : (c.disabled ? '' : 'Non');
        var s = td.querySelector('[aria-checked]'); if (s) return s.getAttribute('aria-checked') === 'true' ? 'Oui' : 'Non';
        return td.textContent.replace(/\s+/g, ' ').trim();
      });
    }).filter(function (r) { return r.some(function (v) { return v; }) && r.length === tete.length; });
    return { tete: tete, lignes: lignes };
  }
  var NOMS = { jnl: 'Journaux', sites: 'Sites', axes: 'Plan de regroupement', perm: 'Permissions' };
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ga-xport]'); if (!b) return;
    var pane = b.closest('[data-ga-pane]'), tab = pane.dataset.gaPane, d = lire(pane); if (!d || !d.lignes.length) { say('Rien à exporter.'); return; }
    var h2 = pane.querySelector('.ga-mh h2'), titre = 'Gestion des accès - ' + NOMS[tab], sous = h2 ? h2.textContent.trim() : '', f = 'gestion_acces_' + tab;
    if (b.dataset.gaXport === 'pdf') { pdf(f + '.pdf', titre, sous, d.tete, d.lignes); say('Export PDF généré : ' + d.lignes.length + ' ligne(s).'); }
    else { xlsx(f + '.xlsx', NOMS[tab], d.tete, d.lignes); say('Export Excel (XLSX) généré : ' + d.lignes.length + ' ligne(s).'); }
  });
  // boutons dans l'en-tête de chaque onglet concerné (miroités ensuite dans la barre d'actions de page)
  Object.keys(NOMS).forEach(function (tab) {
    var pane = root.querySelector('[data-ga-pane="' + tab + '"]'), zone = pane && pane.querySelector('.ga-mh > div:last-child'); if (!zone) return;
    zone.insertAdjacentHTML('afterbegin', '<button type="button" class="ga-btn" data-ga-xport="pdf"><i class="ti ti-file-type-pdf"></i> PDF</button><button type="button" class="ga-btn" data-ga-xport="xlsx"><i class="ti ti-file-spreadsheet"></i> Excel (XLSX)</button>');
  });
})();
</script>
