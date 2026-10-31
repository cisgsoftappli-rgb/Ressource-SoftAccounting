// Assistant d'importation Excel / CSV (charte Softwell). Règle générale : toute importation suit les mêmes étapes.
//   1. colonnes attendues (obligatoire, format, exemple) + modèle Excel à télécharger + choix du fichier ;
//   2. après le choix : nom du fichier, gestion des doublons (Ignorer / Remplacer / Afficher en tant qu'anomalie) et bouton « Lancer l'importation » ;
//   3. résultat : onglets « Lignes retenues », « Lignes rejetées » et « Anomalies » (cause du rejet par ligne, avec la référence de la ligne du fichier Excel) ;
//   4. bouton « Intégration définitive » (grisé tant qu'il y a des anomalies) qui intègre les lignes retenues dans le système.
//   window.IMPORT_ASSISTANT.ouvrir({ titre, champs:[{col, oblig, format, exemple, alias:[…]}], exemples:[[...]], fichier:'modele.xlsx',
//       ligne:function(v, n){ … return { cle:'clé de doublon', doublon:true|false (existe déjà dans le système), erreurs:['cause', …], data:{…} }; },
//       integrer:function(retenues /* [{ n, v, data, remplace }] */){ … } })
//     (ancien mode : onFichier:function(file, { doublons:'ignorer'|'remplacer'|'anomalie' }) — appelé après « Lancer l'importation »)
//   window.IMPORT_ASSISTANT.lireFichier(file) -> Promise<tableau de lignes (tableaux de cellules, propriété __n = n° de ligne du fichier)>
//   window.IMPORT_ASSISTANT.modele(opt)       -> télécharge le modèle Excel
(function () {
  var css = document.createElement('style');
  css.textContent = '.ia-ov{position:fixed;inset:0;z-index:3400;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.ia-md{display:flex;flex-direction:column;width:min(900px,100%);max-height:calc(100vh - 32px);border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.ia-md h2{margin:0;padding:14px 20px;border-bottom:1px solid #E9EBF0;font:600 18px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}' +
    '.ia-b{padding:14px 20px;overflow:auto}.ia-b p{margin:0 0 12px;font-size:13px;color:#5B606D}' +
    '.ia-t{width:100%;border-collapse:collapse;font-size:13px}.ia-t th{background:#2E427B;color:#fff;text-align:left;padding:8px 10px;font-size:12px;text-transform:uppercase;white-space:nowrap}.ia-t td{padding:8px 10px;border-bottom:1px solid #E9EBF0;vertical-align:top}' +
    '.ia-t td.c{text-align:center;white-space:nowrap}.ia-t td.m{color:#B63132}' +
    '.ia-o{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px;font-weight:700}.ia-o.oui{background:#FDE4E1;color:#B63132}.ia-o.non{background:#F5F7F9;color:#5B606D}' +
    '.ia-f{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:10px;padding:12px 20px;border-top:1px solid #E9EBF0}' +
    '.ia-f button{min-height:36px;padding:0 16px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font-weight:600;font-size:14px;cursor:pointer}.ia-f button:hover{background:#F4F7FE}.ia-f button.p{background:#2E427B;color:#fff}.ia-f button.p:hover{background:#243569}' +
    '.ia-f button:disabled{opacity:.45;cursor:not-allowed;background:#F5F7F9;color:#5B606D;border-color:#C5CAD6}' +
    '.ia-fic{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid #D5DBE5;border-radius:8px;background:#F5F7F9;font-size:14px;color:#0B1332}.ia-fic i{font-size:22px;color:#1E7B4B}.ia-fic small{color:#5B606D;font-size:12px}' +
    '.ia-dbl{margin:14px 0 0;padding:12px 14px;border:1px solid #D5DBE5;border-radius:8px}.ia-dbl legend{padding:0 6px;font-size:12px;font-weight:700;color:#0B1332;text-transform:uppercase}.ia-dbl label{display:flex;align-items:flex-start;gap:8px;margin:6px 0;font-size:13px;cursor:pointer}.ia-dbl label span small{display:block;color:#5B606D;font-size:12px}.ia-dbl input{margin-top:3px;accent-color:#2E427B}' +
    '.ia-kpi{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:12px}.ia-kpi div{flex:1 1 140px;padding:10px 14px;border:1px solid #E9EBF0;border-radius:8px;background:#fff}.ia-kpi small{display:block;font-size:11px;text-transform:uppercase;color:#5B606D}.ia-kpi b{font-size:20px;color:#0B1332}.ia-kpi .ko b{color:#B63132}' +
    '.ia-tabs{display:flex;gap:4px;border-bottom:1px solid #E9EBF0;margin-bottom:10px}.ia-tabs button{padding:8px 14px;border:0;border-bottom:3px solid transparent;background:none;color:#5B606D;font-weight:600;font-size:13px;cursor:pointer}.ia-tabs button.on{color:#2E427B;border-bottom-color:#2E427B}.ia-tabs .n{display:inline-block;margin-left:6px;padding:0 8px;border-radius:10px;background:#E9EBF0;font-size:11px}.ia-tabs button.an .n{background:#FDE4E1;color:#B63132}' +
    '.ia-sc{max-height:340px;overflow:auto;border:1px solid #E9EBF0;border-radius:8px}.ia-vide{padding:22px;text-align:center;color:#5B606D;font-size:13px}.ia-er{margin-top:10px;color:#B63132;font-size:13px}';
  document.head.appendChild(css);
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function norm(t) { return String(t == null ? '' : t).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); }

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
      if (r.length) { r.__n = +((/^<row[^>]*\sr="(\d+)"/.exec(row) || [])[1]) || undefined; lignes.push(r); }
    });
    return lignes;
  }
  function lireCsv(txt) {
    var out = []; txt.replace(/^﻿/, '').split(/\r?\n/).forEach(function (l, i) {
      if (!l.trim()) return; var sep = l.indexOf(';') >= 0 ? ';' : (l.indexOf('\t') >= 0 ? '\t' : ',');
      var r = l.split(sep).map(function (c) { return c.replace(/^"|"$/g, '').trim(); }); r.__n = i + 1; out.push(r);
    });
    return out;
  }
  async function lireFichier(f) { return /\.xlsx$/i.test(f.name) ? lireXlsx(await f.arrayBuffer()) : lireCsv(await f.text()); }

  // ---------- analyse ----------
  // associe les colonnes du fichier à celles du modèle ; renvoie les lignes {n, v:{colonne:valeur}}
  function lignesDe(rows, champs) {
    var ent = (rows[0] || []).map(function (h) { return norm(String(h == null ? '' : h).replace(/\([^)]*\)/g, '')); }), idx = {}, manque = [];
    champs.forEach(function (c) {
      var noms = [norm(String(c.col).replace(/\([^)]*\)/g, ''))].concat((c.alias || []).map(norm)), k = -1;
      noms.forEach(function (n) { if (k < 0) k = ent.indexOf(n); }); idx[c.col] = k; if (k < 0 && c.oblig) manque.push(c.col);
    });
    if (manque.length) return { erreur: 'Colonne(s) obligatoire(s) introuvable(s) dans la première ligne du fichier : ' + manque.join(', ') + '.' };
    var L = [];
    rows.slice(1).forEach(function (r, i) {
      if (!r || r.every(function (c) { return c === '' || c == null; })) return;
      var v = {}; champs.forEach(function (c) { var x = idx[c.col] < 0 ? '' : r[idx[c.col]]; v[c.col] = x == null ? '' : String(x).trim(); });
      L.push({ n: r.__n || i + 2, v: v });
    });
    return { lignes: L };
  }
  function analyser(o, L, mode) {
    var ret = [], rej = [], ano = [], vus = {};
    L.forEach(function (x) {
      var r = o.ligne(x.v, x.n) || {}, er = r.erreurs || [];
      if (er.length) { rej.push({ n: x.n, v: x.v, cause: er.join(' ; ') }); er.forEach(function (e) { ano.push({ n: x.n, cause: e }); }); return; }
      var cle = r.cle == null ? '' : String(r.cle), dup = r.doublon ? 'sys' : (cle && vus[cle] !== undefined ? 'fic' : '');
      if (dup) {
        var cz = dup === 'sys' ? 'Doublon : « ' + cle + ' » existe déjà dans le système' : 'Doublon : « ' + cle + ' » déjà présent à la ligne ' + ret[vus[cle]].n + ' du fichier';
        if (mode === 'ignorer') { rej.push({ n: x.n, v: x.v, cause: cz + ' — ligne ignorée' }); return; }
        if (mode === 'anomalie') { rej.push({ n: x.n, v: x.v, cause: cz }); ano.push({ n: x.n, cause: cz }); return; }
        if (dup === 'fic') { var p = ret[vus[cle]]; p.annule = true; rej.push({ n: p.n, v: p.v, cause: 'Remplacée par la ligne ' + x.n + ' du fichier (même clé « ' + cle + ' »)' }); }
      }
      var e = { n: x.n, v: x.v, data: r.data, remplace: !!dup }; ret.push(e); if (cle) vus[cle] = ret.length - 1;
    });
    ret = ret.filter(function (e) { return !e.annule; });
    if (o.controle) (o.controle(ret) || []).forEach(function (c) { var n = typeof c === 'string' ? null : c.n, t = typeof c === 'string' ? c : c.cause; ano.push({ n: n, cause: t }); if (n) { var k = ret.filter(function (e) { return e.n === n; })[0]; if (k) { k.annule = true; rej.push({ n: k.n, v: k.v, cause: t }); } } });
    ret = ret.filter(function (e) { return !e.annule; });
    return { ret: ret, rej: rej.sort(function (a, b) { return a.n - b.n; }), ano: ano.sort(function (a, b) { return (a.n || 1e9) - (b.n || 1e9); }) };
  }

  // ---------- fenêtre ----------
  function ouvrir(o) {
    var ov = document.createElement('div'), fichier = null, mode = 'ignorer', res = null, tab = 'ret'; ov.className = 'ia-ov';
    var corps, pied, titre;
    ov.innerHTML = '<div class="ia-md" role="dialog" aria-modal="true" aria-label="Importation"><h2></h2><div class="ia-b"></div><div class="ia-f"></div></div><input type="file" accept=".xlsx,.csv,.txt" style="display:none">';
    titre = ov.querySelector('h2'); corps = ov.querySelector('.ia-b'); pied = ov.querySelector('.ia-f');
    document.body.appendChild(ov);
    var inp = ov.querySelector('input[type=file]');
    function fermer() { ov.remove(); document.removeEventListener('keydown', cl, true); }
    function cl(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }
    function taille(n) { return n > 1048576 ? (n / 1048576).toFixed(1).replace('.', ',') + ' Mo' : Math.max(1, Math.round(n / 1024)) + ' Ko'; }

    function etape1() {
      titre.textContent = 'Importer — ' + o.titre;
      corps.innerHTML = '<p>Le fichier (Excel .xlsx ou CSV) doit comporter une première ligne d\'en-têtes avec les colonnes ci-dessous. Téléchargez le modèle pour partir d\'un fichier prêt à remplir.</p>' +
        '<table class="ia-t"><thead><tr><th>Colonne</th><th>Obligatoire</th><th>Format / valeurs acceptées</th><th>Exemple</th></tr></thead><tbody>' +
        o.champs.map(function (c) { return '<tr><td><b>' + esc(c.col) + '</b></td><td><span class="ia-o ' + (c.oblig ? 'oui' : 'non') + '">' + (c.oblig ? 'Oui' : 'Non') + '</span></td><td>' + esc(c.format) + '</td><td>' + esc(c.exemple) + '</td></tr>'; }).join('') + '</tbody></table>';
      pied.innerHTML = '<button type="button" data-ia-x>Annuler</button><button type="button" data-ia-m><i class="ti ti-download"></i> Télécharger le modèle Excel</button><button type="button" class="p" data-ia-c><i class="ti ti-upload"></i> Choisir un fichier…</button>';
      var b = pied.querySelector('[data-ia-c]'); if (b) b.focus();
    }
    function etape2(err) {
      titre.textContent = 'Importer — ' + o.titre;
      var D = [['ignorer', 'Ignorer', 'Les lignes déjà existantes ou en double dans le fichier ne sont pas importées.'], ['remplacer', 'Remplacer', 'Les lignes existantes sont mises à jour avec les valeurs du fichier.'], ['anomalie', 'Afficher en tant qu\'anomalie', 'Les doublons sont rejetés et signalés dans l\'onglet Anomalies (intégration bloquée).']];
      corps.innerHTML = '<div class="ia-fic"><i class="ti ti-file-spreadsheet" aria-hidden="true"></i><div><b data-ia-nom>' + esc(fichier.name) + '</b><br><small>' + taille(fichier.size) + '</small></div></div>' +
        '<fieldset class="ia-dbl"><legend>Gestion des doublons</legend>' + D.map(function (d) { return '<label><input type="radio" name="ia-dbl" value="' + d[0] + '"' + (mode === d[0] ? ' checked' : '') + '><span>' + d[1] + '<small>' + d[2] + '</small></span></label>'; }).join('') + '</fieldset>' + (err ? '<div class="ia-er" role="alert">' + esc(err) + '</div>' : '');
      pied.innerHTML = '<button type="button" data-ia-x>Annuler</button><button type="button" data-ia-ch><i class="ti ti-file-search"></i> Changer de fichier</button><button type="button" class="p" data-ia-go><i class="ti ti-player-play"></i> Lancer l\'importation</button>';
      pied.querySelector('[data-ia-go]').focus();
    }
    function tableau(liste, avecCause) {
      if (!liste.length) return '<div class="ia-vide">Aucune ligne.</div>';
      var cols = o.champs.map(function (c) { return c.col; });
      return '<div class="ia-sc"><table class="ia-t"><thead><tr><th>Ligne Excel</th>' + cols.map(function (c) { return '<th>' + esc(c) + '</th>'; }).join('') + (avecCause ? '<th>Cause du rejet</th>' : '') + '</tr></thead><tbody>' +
        liste.slice(0, 500).map(function (x) { return '<tr><td class="c">' + x.n + '</td>' + cols.map(function (c) { return '<td>' + esc(x.v[c]) + '</td>'; }).join('') + (avecCause ? '<td class="m">' + esc(x.cause) + '</td>' : '') + '</tr>'; }).join('') + '</tbody></table></div>' + (liste.length > 500 ? '<p>… ' + (liste.length - 500) + ' ligne(s) supplémentaire(s) non affichée(s).</p>' : '');
    }
    function etape3() {
      titre.textContent = 'Résultat de l\'importation — ' + o.titre;
      var h = '<div class="ia-fic" style="margin-bottom:12px"><i class="ti ti-file-spreadsheet" aria-hidden="true"></i><div><b>' + esc(fichier.name) + '</b><br><small>Doublons : ' + { ignorer: 'ignorés', remplacer: 'remplacés', anomalie: 'affichés en anomalie' }[mode] + '</small></div></div>';
      h += '<div class="ia-kpi"><div><small>Lignes retenues</small><b>' + res.ret.length + '</b></div><div class="' + (res.rej.length ? 'ko' : '') + '"><small>Lignes rejetées</small><b>' + res.rej.length + '</b></div><div class="' + (res.ano.length ? 'ko' : '') + '"><small>Anomalies</small><b>' + res.ano.length + '</b></div></div>';
      h += '<div class="ia-tabs" role="tablist"><button type="button" role="tab" data-ia-tab="ret" class="' + (tab === 'ret' ? 'on' : '') + '">Lignes retenues <span class="n">' + res.ret.length + '</span></button><button type="button" role="tab" data-ia-tab="rej" class="' + (tab === 'rej' ? 'on' : '') + '">Lignes rejetées <span class="n">' + res.rej.length + '</span></button><button type="button" role="tab" data-ia-tab="ano" class="an ' + (tab === 'ano' ? 'on' : '') + '">Anomalies <span class="n">' + res.ano.length + '</span></button></div>';
      if (tab === 'ret') h += tableau(res.ret.map(function (x) { return { n: x.n, v: x.v }; }), false);
      else if (tab === 'rej') h += tableau(res.rej, true);
      else h += res.ano.length ? '<div class="ia-sc"><table class="ia-t"><thead><tr><th style="width:140px">Ligne Excel</th><th>Cause du rejet</th></tr></thead><tbody>' + res.ano.map(function (a) { return '<tr><td class="c">' + (a.n ? 'Ligne ' + a.n : 'Ensemble du fichier') + '</td><td class="m">' + esc(a.cause) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<div class="ia-vide">Aucune anomalie : le fichier peut être intégré.</div>';
      corps.innerHTML = h;
      pied.innerHTML = '<button type="button" data-ia-x>Fermer</button><button type="button" data-ia-ch><i class="ti ti-file-search"></i> Autre fichier</button><button type="button" data-ia-re><i class="ti ti-refresh"></i> Relancer</button><button type="button" class="p" data-ia-int' + (res.ano.length || !res.ret.length ? ' disabled title="' + (res.ano.length ? 'Corrigez les anomalies puis relancez l\'importation.' : 'Aucune ligne retenue.') + '"' : '') + '><i class="ti ti-database-import"></i> Intégration définitive</button>';
    }
    async function lancer() {
      var r = pied.querySelector('[data-ia-go]'); if (r) r.disabled = true;
      try {
        var rows = await lireFichier(fichier);
        if (o.ligne) {
          var d = lignesDe(rows, o.champs); if (d.erreur) { etape2(d.erreur); return; }
          if (o.avant) o.avant(d.lignes);
          res = analyser(o, d.lignes, mode); tab = res.ano.length ? 'ano' : 'ret'; etape3();
        } else { var f = fichier; fermer(); if (o.onFichier) o.onFichier(f, { doublons: mode }); }
      } catch (x) { etape2('Importation impossible : ' + (x && x.message ? x.message : 'fichier illisible') + '.'); }
    }
    document.addEventListener('keydown', cl, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
    ov.addEventListener('change', function (e) { if (e.target.name === 'ia-dbl') mode = e.target.value; });
    ov.addEventListener('click', function (e) {
      var t = e.target, b;
      if (t.closest('[data-ia-x]')) fermer();
      else if (t.closest('[data-ia-m]')) modele(o);
      else if (t.closest('[data-ia-c]') || t.closest('[data-ia-ch]')) { inp.value = ''; inp.click(); }
      else if (t.closest('[data-ia-go]') || t.closest('[data-ia-re]')) lancer();
      else if ((b = t.closest('[data-ia-tab]'))) { tab = b.getAttribute('data-ia-tab'); etape3(); }
      else if ((b = t.closest('[data-ia-int]')) && !b.disabled) { var ok = res.ret; fermer(); if (o.integrer) o.integrer(ok, { doublons: mode }); }
    });
    inp.addEventListener('change', function () { var f = inp.files[0]; if (!f) return; fichier = f; res = null; etape2(); });
    etape1();
  }
  window.IMPORT_ASSISTANT = { ouvrir: ouvrir, lireFichier: lireFichier, modele: modele };
})();
