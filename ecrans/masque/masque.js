/* Masque d'impression PDF : logo, titre, QR code, pied de page. Appliqué à toute impression. */
(function () {
  var M = window.__MASQUE = window.__MASQUE || {};
  M.titre = M.titre || 'Projet de Connectivité Numérique et Energétique pour l’Inclusion à Madagascar';
  M.user = M.user || 'MICHAEL';
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  /* html : contenu (tableaux...) ; opts : { titre, sousTitre, paysage } */
  window.__printMask = function (html, opts) {
    opts = opts || {};
    var d = new Date(), edite = 'Édité le ' + p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + '/' + d.getFullYear() + ' par ' + M.user + ' à ' + p2(d.getHours()) + ':' + p2(d.getMinutes());
    var land = opts.paysage !== false;
    var css = '@page{size:A4 ' + (land ? 'landscape' : 'portrait') + ';margin:0}' +
      '*{box-sizing:border-box}html,body{margin:0;padding:0;font:11px Arial,Helvetica,sans-serif;color:#1e293b;-webkit-print-color-adjust:exact;print-color-adjust:exact}' +
      '.mk-h{position:fixed;top:0;left:0;right:0;height:30mm;padding:6mm 10mm 0;display:flex;align-items:flex-start;justify-content:space-between;background:#fff}' +
      '.mk-h img.l{height:15mm}.mk-h img.q{height:20mm}.mk-h b{flex:1;text-align:center;font-size:15px;color:#0c2d6b;padding:6mm 8mm 0}' +
      '.mk-f{position:fixed;bottom:0;left:0;right:0;height:14mm;background:#2d4177}.mk-f img{position:absolute;left:0;top:0;height:14mm;width:100%;object-fit:fill}' +
      '.mk-f span{position:absolute;right:10mm;top:0;line-height:14mm;color:#fff;font-size:11px}' +
      'table.mk-w{width:100%;border-collapse:collapse}.mk-w>thead>tr>td{height:32mm;padding:0}.mk-w>tfoot>tr>td{height:17mm;padding:0}.mk-w>tbody>tr>td{padding:0 10mm}' +
      '.mk-t{font-size:17px;font-weight:700;color:#0c2d6b;margin:0 0 2px}.mk-s{color:#64748b;margin:0 0 8px}' +
      '.mk-c table{width:100%;border-collapse:collapse}.mk-c th{background:#0c2d6b;color:#fff;font-size:9.5px;text-transform:uppercase;padding:5px 6px}.mk-c td{border:1px solid #d6d3c4;padding:3px 6px}.mk-c tr{page-break-inside:avoid}.mk-c thead{display:table-header-group}' +
      '.mk-c button,.mk-c input[type=checkbox],.mk-c .no-print,.mk-c [data-no-print]{display:none!important}';
    var head = '<div class="mk-h"><img class="l" src="' + M.logo + '"><b>' + esc(M.titre) + '</b><img class="q" src="' + M.qr + '"></div>';
    var foot = '<div class="mk-f"><img src="' + M.pied + '"><span>' + esc(edite) + '</span></div>';
    var body = (opts.titre ? '<h1 class="mk-t">' + esc(opts.titre) + '</h1>' : '') + (opts.sousTitre ? '<p class="mk-s">' + esc(opts.sousTitre) + '</p>' : '') + '<div class="mk-c">' + html + '</div>';
    var doc = '<!doctype html><html><head><meta charset="utf-8"><title>' + esc(opts.titre || 'Impression') + '</title><style>' + css + '</style></head><body>' + head + foot +
      '<table class="mk-w"><thead><tr><td></td></tr></thead><tfoot><tr><td></td></tr></tfoot><tbody><tr><td>' + body + '</td></tr></tbody></table></body></html>';
    var w = window.open('', '_blank');
    if (!w) { alert('Fenêtre bloquée par le navigateur.'); return; }
    w.document.open(); w.document.write(doc); w.document.close();
    var go = function () { try { w.focus(); w.print(); } catch (e) {} };
    var imgs = [].slice.call(w.document.images), n = imgs.length;
    if (!n) return setTimeout(go, 200);
    var done = 0, fin = function () { if (++done === n) setTimeout(go, 100); };
    imgs.forEach(function (i) { if (i.complete) fin(); else { i.onload = fin; i.onerror = fin; } });
  };
  /* window.print() depuis un écran : imprime l'écran visible avec le masque */
  var nativePrint = window.print.bind(window);
  window.print = function () {
    var s = [].slice.call(document.querySelectorAll('[data-screen]')).filter(function (e) { return e.style.display !== 'none' && e.offsetParent !== null; })[0];
    if (!s) return nativePrint();
    var c = s.cloneNode(true);
    [].slice.call(c.querySelectorAll('script,style,button,input[type=checkbox],[class*=modal],[class*=toolbar],[class*=pager],[class*=pagination]')).forEach(function (e) { e.remove(); });
    [].slice.call(c.querySelectorAll('input,select')).forEach(function (e) { var t = document.createElement('span'); t.textContent = e.tagName === 'SELECT' ? (e.options[e.selectedIndex] || {}).text || '' : e.value; e.replaceWith(t); });
    var t = document.title.replace(/^SoftCompta\s*—\s*/, '');
    window.__printMask(c.innerHTML, { titre: t });
  };
})();
