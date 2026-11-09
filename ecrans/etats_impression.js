// Masques d'impression des états financiers : Bilan (Actif | Passif côte à côte, paysage) et Compte de résultat (Réf, Libellé, Notes, Exercice N, Exercice N-1, portrait).
//   window.ETAT_IMPRESSION.bilan(o) / .cr(o) / .html(kind, o) avec o = { titre, modele, modeleLib, du, au (aaaa-mm-jj), devise (« MGA – Ariary »), site, N: [lignes], N1: [lignes], fmt: function(centimes) }
//   Les lignes sont celles de ETATS_FIN.calc : { code, libelle, nature, type ('actif' | 'passif'), v, afficher, gras, note, reference }.
// L'impression passe par une fenêtre intégrée (iframe) : le masque est indépendant de l'écran.
(function () {
  function esc(t) { return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function fr(iso) { var p = String(iso || '').split('-'); return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso || ''); }
  function an(iso, n) { return (+String(iso).slice(0, 4) + n) + String(iso).slice(4); }
  function deviseLib(d) { var m = /^(\S+)\s*[–-]\s*(.+)$/.exec(String(d || '')); return m ? m[2].toUpperCase() + ' (' + m[1] + ')' : String(d || ''); }
  var CSS = '@page{size:A4 LANDSCAPE;margin:8mm 8mm 10mm;@bottom-right{content:"Page " counter(page) "/" counter(pages);font:8px Arial,sans-serif;color:#333}}' +
    'body{margin:0;font:9px Arial,Helvetica,sans-serif;color:#1F4E8C}' +
    '.en{background:#EBEBEB;text-align:center;padding:8px 10px 6px;margin-bottom:5px}.en h1{margin:0 0 6px;font-size:18px;color:#0B3A7A}.en p{margin:3px 0;font-size:10px;color:#1b1b1b}' +
    '.en .sl{display:flex;justify-content:space-between;font-size:10px;color:#1b1b1b;margin-top:8px}' +
    'table{width:100%;border-collapse:collapse;table-layout:fixed}th{background:#2F6096;color:#fff;font-weight:700;font-size:9px;text-align:center;padding:4px 3px;border:1px solid #fff}' +
    'td{border:1px solid #CFCFF5;padding:0 4px;height:26px;vertical-align:middle;font-size:8px}td.r{text-align:right}td.c{text-align:center}' +
    '.g{font-weight:700;color:#0B1332}.tt{font-weight:700;color:#1b1b1b}.l1{padding-left:14px}.l2{padding-left:24px}' +
    'tr.fill td{height:auto;border-top:0;border-bottom:0}tr.pied td{background:#EEF0F6;font-weight:700;color:#0B3A7A;text-align:center;border:1px solid #CFCFF5}tr.pied td.r{text-align:right}' +
    '.mn{min-height:1px}';
  function entete(o, genre) {
    return '<div class="en"><h1>' + esc(o.titre) + '</h1><p>Modèle : ' + esc(o.modele) + '</p><p>Période Du ' + fr(o.du) + ' au ' + fr(o.au) + '</p><p>' + esc((o.modeleLib || genre) + ' - ' + o.titre + ' - Etat exprimé en  ' + deviseLib(o.devise)) + '</p>' +
      '<div class="sl"><span>Site : ' + esc(o.site || '01') + '</span><span></span></div></div>';
  }
  function libTotal(r) { var l = String(r.libelle || ''); return /^\*\*\*/.test(l) ? l : '*** ' + l.toUpperCase() + ' ***'; }
  function classe(r) { return r.nature === 'total' || r.nature === 'soustotal' ? 'tt' : (r.nature === 'titre' ? 'g' : ''); }
  function vide(r) { return r.nature === 'titre' || r.nature === 'soustitre'; }
  function montant(r, fmt, v) { if (vide(r)) return ''; var tot = r.nature === 'total' || r.nature === 'soustotal'; return !v && !tot ? '' : fmt(v || 0); }
  // ---------- Bilan : Actif à gauche, Passif à droite
  function bilan(o) {
    var N = o.N || [], N1 = o.N1 || [], fmt = o.fmt, A = [], P = [], tA = [0, 0], tP = [0, 0];
    N.forEach(function (r, i) {
      if (!r.afficher) return; var x = { r: r, v1: N1[i] ? N1[i].v : 0 };
      (r.type === 'passif' ? P : A).push(x);
      if (r.nature === 'ligne' || r.nature === 'resultat' || r.nature === 'constante') { var t = r.type === 'passif' ? tP : tA; t[0] += r.v || 0; t[1] += x.v1 || 0; }
    });
    var n = Math.max(A.length, P.length), d1 = fr(o.au), d0 = fr(an(o.au, -1)), h = '';
    function cel(x) {
      if (!x) return '<td></td><td></td><td></td><td></td><td></td>';
      var r = x.r, c = classe(r), lib = r.nature === 'total' || r.nature === 'soustotal' ? libTotal(r) : r.libelle;
      return '<td class="c">' + esc(r.reference || '') + '</td><td class="' + c + '">' + esc(lib) + '</td><td class="c">' + esc(r.note || '') + '</td><td class="r ' + c + '">' + montant(r, fmt, r.v) + '</td><td class="r ' + c + '">' + montant(r, fmt, x.v1) + '</td>';
    }
    for (var i = 0; i < n; i++) h += '<tr>' + cel(A[i]) + cel(P[i]) + '</tr>';
    h += '<tr class="fill"><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>';
    var cols = '<colgroup><col style="width:3%"><col style="width:26%"><col style="width:4%"><col style="width:9%"><col style="width:9%"><col style="width:3%"><col style="width:26%"><col style="width:4%"><col style="width:8%"><col style="width:8%"></colgroup>';
    function tete(lib) { return '<th rowspan="2">Réf</th><th rowspan="2">' + lib + '</th><th rowspan="2">Notes</th><th>Exercice au<br>' + d1 + '</th><th>Exercice au<br>' + d0 + '</th>'; }
    var thead = '<thead><tr>' + tete('Actif') + tete('Passif') + '</tr><tr><th>Net</th><th>Net</th><th>Net</th><th>Net</th></tr></thead>';
    var pied = '<tr class="pied"><td colspan="3">Total actif</td><td class="r">' + fmt(tA[0]) + '</td><td class="r">' + fmt(tA[1]) + '</td><td colspan="3">Total passif</td><td class="r">' + fmt(tP[0]) + '</td><td class="r">' + fmt(tP[1]) + '</td></tr>';
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(o.titre) + '</title><style>' + CSS + 'table.bl{height:150mm}table.bl tbody tr.fill{height:100%}</style></head><body>' + entete(o, 'Bilan') +
      '<table class="bl">' + cols + thead + '<tbody>' + h + pied + '</tbody></table></body></html>';
  }
  // ---------- Compte de résultat : Réf, Libellé, Notes, Exercice N, Exercice N-1
  function cr(o) {
    var N = o.N || [], N1 = o.N1 || [], fmt = o.fmt, h = '', niv = 0;
    N.forEach(function (r, i) {
      if (!r.afficher) return; var c = classe(r), tot = r.nature === 'total' || r.nature === 'soustotal', lib = tot ? libTotal(r) : r.libelle;
      if (r.nature === 'titre') niv = 0; else if (r.nature === 'soustitre') niv = 1;
      var pad = tot ? '' : (r.nature === 'titre' ? '' : (r.nature === 'soustitre' ? 'l1' : 'l2'));
      h += '<tr><td class="c">' + esc(r.reference || '') + '</td><td class="' + c + ' ' + pad + '">' + esc(lib) + '</td><td class="c">' + esc(r.note || '') + '</td><td class="r ' + c + '">' + montant(r, fmt, r.v) + '</td><td class="r ' + c + '">' + montant(r, fmt, N1[i] ? N1[i].v : 0) + '</td></tr>';
    });
    h += '<tr class="fill"><td></td><td></td><td></td><td></td><td></td></tr>';
    var cols = '<colgroup><col style="width:6%"><col style="width:50%"><col style="width:8%"><col style="width:18%"><col style="width:18%"></colgroup>';
    var thead = '<thead><tr><th rowspan="2">Réf</th><th rowspan="2">Libellé</th><th rowspan="2">Notes</th><th>Exercice N</th><th>Exercice N-1</th></tr><tr><th>NET</th><th>NET</th></tr></thead>';
    return '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(o.titre) + '</title><style>' + CSS.replace('A4 LANDSCAPE', 'A4 PORTRAIT') + 'table.bl{height:230mm}td{height:16px}table.bl tbody tr.fill{height:100%}</style></head><body>' + entete(o, 'Compte de résultat') +
      '<table class="bl">' + cols + thead + '<tbody>' + h + '</tbody></table></body></html>';
  }
  function imprimer(html) {
    var f = document.createElement('iframe'); f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(f);
    var d = f.contentWindow.document; d.open(); d.write(html); d.close();
    setTimeout(function () { try { f.contentWindow.focus(); f.contentWindow.print(); } catch (e) {} setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 60000); }, 300);
  }
  window.ETAT_IMPRESSION = { html: function (k, o) { return k === 'bilan' ? bilan(o) : cr(o); }, bilan: function (o) { imprimer(bilan(o)); }, cr: function (o) { imprimer(cr(o)); } };
})();
