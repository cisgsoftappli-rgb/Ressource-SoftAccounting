// Assistant d'importation Excel / CSV (charte Softwell) : présente les colonnes attendues par le système (obligatoire, format, exemple), propose le modèle Excel à
// télécharger (feuilles « Modèle » et « Instructions »), puis laisse choisir le fichier. Fournit aussi la lecture des fichiers .xlsx (décompression incluse) et .csv.
//   window.IMPORT_ASSISTANT.ouvrir({ titre, champs:[{col, oblig, format, exemple}], exemples:[[...]], fichier:'modele.xlsx', onFichier:function(file){...} })
//   window.IMPORT_ASSISTANT.lireFichier(file) -> Promise<tableau de lignes (tableaux de cellules)>
//   window.IMPORT_ASSISTANT.modele(opt)       -> télécharge le modèle Excel
(function () {
  var css = document.createElement('style');
  css.textContent = '.ia-ov{position:fixed;inset:0;z-index:3400;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.ia-md{display:flex;flex-direction:column;width:min(760px,100%);max-height:calc(100vh - 32px);border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.ia-md h2{margin:0;padding:16px 20px;border-bottom:1px solid #E9EBF0;font:600 18px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}' +
    '.ia-b{padding:16px 20px;overflow:auto}.ia-b p{margin:0 0 12px;font-size:13px;color:#5B606D}' +
    '.ia-t{width:100%;border-collapse:collapse;font-size:13px}.ia-t th{background:#2E427B;color:#fff;text-align:left;padding:8px 10px;font-size:12px;text-transform:uppercase;white-space:nowrap}.ia-t td{padding:8px 10px;border-bottom:1px solid #E9EBF0;vertical-align:top}' +
    '.ia-o{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700}.ia-o.oui{background:#FDE4E1;color:#B63132}.ia-o.non{background:#F5F7F9;color:#5B606D}' +
    '.ia-f{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:14px 20px;border-top:1px solid #E9EBF0}' +
    '.ia-f button{min-height:38px;padding:0 16px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font-weight:600;font-size:14px;cursor:pointer}.ia-f button:hover{background:#F4F7FE}.ia-f button.p{background:#2E427B;color:#fff}.ia-f button.p:hover{background:#243569}';
  document.head.appendChild(css);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ---------- modèle Excel ----------
  function modele(o) {
    var X = window.EXPORT_TABLEAU; if (!X || !X.modeleImport) { alert('Module d\'export indisponible.'); return; }
    X.modeleImport(o.fichier || 'modele_import.xlsx', o.champs, o.exemples || []);
  }

  // ---------- lecture des fichiers ----------
  function xmlTxt(x) { return x.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, '&'); }
  async function inflate(u8) { var s = new Blob([u8]).stream().pipeThrough(new DecompressionStream('deflate-raw')); return new Uint8Array(await new Response(s).arrayBuffer()); }
  async function lireZip(buf) {
    var v = new DataView(buf), u8 = new Uint8Array(buf), i = buf.byteLength - 22, td = new TextDecoder(), fic = {};
    while (i >= 0 && v.getUint32(i, true) !== 0x06054b50) i--;
    if (i < 0) throw new Error('fichier Excel invalide');
    var n = v.getUint16(i + 10, true), off = v.getUint32(i + 16, true);
    for (var k = 0; k < n; k++) {
      if (v.getUint32(off, true) !== 0x02014b50) break;
      var meth = v.getUint16(off + 10, true), csz = v.getUint32(off + 20, true), nl = v.getUint16(off + 28, true), el = v.getUint16(off + 30, true), cl = v.getUint16(off + 32, true), lo = v.getUint32(off + 42, true);
      var nom = td.decode(u8.subarray(off + 46, off + 46 + nl)), ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true), data = u8.subarray(ds, ds + csz);
      fic[nom] = meth === 8 ? await inflate(data) : data; off += 46 + nl + el + cl;
    }
    return fic;
  }
  function colIdx(r) { var m = /^([A-Z]+)/.exec(r) || [0, 'A'], n = 0; for (var i = 0; i < m[1].length; i++) n = n * 26 + m[1].charCodeAt(i) - 64; return n - 1; }
  async function lireXlsx(buf) {
    var fic = await lireZip(buf), td = new TextDecoder(), noms = Object.keys(fic).filter(function (n) { return /^xl\/worksheets\/sheet\d+\.xml$/.test(n); }).sort();
    if (!noms.length) throw new Error('aucune feuille trouvée');
    var sst = [], sx = fic['xl/sharedStrings.xml'] ? td.decode(fic['xl/sharedStrings.xml']) : '';
    (sx.match(/<si>[\s\S]*?<\/si>/g) || []).forEach(function (si) { sst.push(xmlTxt((si.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map(function (t) { return t.replace(/<[^>]+>/g, ''); }).join(''))); });
    var xml = td.decode(fic[noms[0]]), lignes = [];
    (xml.match(/<row[\s\S]*?<\/row>/g) || []).forEach(function (row) {
      var r = []; (row.match(/<c [^>]*?(?:\/>|>[\s\S]*?<\/c>)/g) || []).forEach(function (c) {
        var ref = (/\sr="([A-Z]+\d+)"/.exec(c) || [])[1] || 'A1', t = (/\st="(\w+)"/.exec(c) || [])[1], val = '', v = /<v>([\s\S]*?)<\/v>/.exec(c);
        if (t === 'inlineStr') val = xmlTxt((c.match(/<t[^>]*>[\s\S]*?<\/t>/g) || []).map(function (x) { return x.replace(/<[^>]+>/g, ''); }).join(''));
        else if (v) val = t === 's' ? (sst[+v[1]] || '') : xmlTxt(v[1]);
        r[colIdx(ref)] = val;
      });
      if (r.length) lignes.push(r);
    });
    return lignes;
  }
  function lireCsv(txt) { return txt.replace(/^﻿/, '').split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) { var sep = l.indexOf(';') >= 0 ? ';' : (l.indexOf('\t') >= 0 ? '\t' : ','); return l.split(sep).map(function (c) { return c.replace(/^"|"$/g, '').trim(); }); }); }
  async function lireFichier(f) { return /\.xlsx$/i.test(f.name) ? lireXlsx(await f.arrayBuffer()) : lireCsv(await f.text()); }

  // ---------- fenêtre ----------
  function ouvrir(o) {
    var ov = document.createElement('div'); ov.className = 'ia-ov';
    ov.innerHTML = '<div class="ia-md" role="dialog" aria-modal="true" aria-label="Importation"><h2>Importer — ' + esc(o.titre) + '</h2><div class="ia-b">' +
      '<p>Le fichier (Excel .xlsx ou CSV) doit comporter une première ligne d\'en-têtes avec les colonnes ci-dessous. Téléchargez le modèle pour partir d\'un fichier prêt à remplir.</p>' +
      '<table class="ia-t"><thead><tr><th>Colonne</th><th>Obligatoire</th><th>Format / valeurs acceptées</th><th>Exemple</th></tr></thead><tbody>' +
      o.champs.map(function (c) { return '<tr><td><b>' + esc(c.col) + '</b></td><td><span class="ia-o ' + (c.oblig ? 'oui' : 'non') + '">' + (c.oblig ? 'Oui' : 'Non') + '</span></td><td>' + esc(c.format) + '</td><td>' + esc(c.exemple) + '</td></tr>'; }).join('') +
      '</tbody></table></div><div class="ia-f"><button type="button" data-ia-x>Annuler</button><button type="button" data-ia-m><i class="ti ti-download"></i> Télécharger le modèle Excel</button><button type="button" class="p" data-ia-c><i class="ti ti-upload"></i> Choisir un fichier…</button></div></div>' +
      '<input type="file" accept=".xlsx,.csv,.txt" style="display:none">';
    document.body.appendChild(ov);
    var inp = ov.querySelector('input[type=file]');
    function fermer() { ov.remove(); document.removeEventListener('keydown', cl, true); }
    function cl(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }
    document.addEventListener('keydown', cl, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
    ov.addEventListener('click', function (e) {
      if (e.target.closest('[data-ia-x]')) fermer(); else if (e.target.closest('[data-ia-m]')) modele(o); else if (e.target.closest('[data-ia-c]')) inp.click();
    });
    inp.addEventListener('change', function () { var f = inp.files[0]; if (!f) return; fermer(); if (o.onFichier) o.onFichier(f); });
    ov.querySelector('[data-ia-c]').focus();
  }
  window.IMPORT_ASSISTANT = { ouvrir: ouvrir, lireFichier: lireFichier, modele: modele };
})();
