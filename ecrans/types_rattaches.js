// Fenêtre « Contrats rattachés » : double-clic sur une ligne de Gestion des contrats › Paramétrages › Type de passation / Type de contrat.
// window.TYPES_RATTACHES.ouvrir({ titre, sous, contrats: [contrat de « Fiche contrat » (window.CONTRATS)] }) ; montant(contrat) : total des ventilations (MGA).
(function () {
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nb(n) { return (Math.round((+n || 0) * 100) / 100).toLocaleString('fr-FR', { maximumFractionDigits: 2 }); }
  function dt(d) { return d ? String(d).split('-').reverse().join('/') : '—'; }
  function montant(c) { return (c.vent || []).reduce(function (a, v) { return a + (Number((v.mt || {}).MGA) || 0); }, 0); }
  var css = document.createElement('style');
  css.textContent = '.trc-ov{position:fixed;inset:0;z-index:3400;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.trc-md{display:flex;flex-direction:column;width:min(860px,100%);max-height:calc(100vh - 32px);border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35)}' +
    '.trc-md h2{margin:0;padding:14px 20px 4px;font:600 18px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}.trc-md .s{margin:0;padding:0 20px 10px;border-bottom:1px solid #E9EBF0;font-size:13px;color:#5B606D}' +
    '.trc-b{padding:14px 20px;overflow:auto}.trc-t{width:100%;border-collapse:collapse;font-size:13px}.trc-t th{background:#2E427B;color:#fff;text-align:left;padding:8px 10px;font-size:12px;text-transform:uppercase;white-space:nowrap}' +
    '.trc-t td{padding:8px 10px;border-top:1px solid #E9EBF0}.trc-t .r{text-align:right;white-space:nowrap}.trc-t .m{font-family:ui-monospace,Consolas,monospace;font-weight:600}' +
    '.trc-t tfoot td{background:#EEF2FB;font-weight:700;color:#18244F;border-top:2px solid #2E427B}.trc-v{padding:24px;text-align:center;color:#5B606D;font-size:13px}' +
    '.trc-f{display:flex;justify-content:flex-end;padding:12px 20px;border-top:1px solid #E9EBF0}.trc-f button{min-height:36px;padding:0 16px;border:1px solid #2E427B;border-radius:8px;background:#2E427B;color:#fff;font-weight:600;font-size:14px;cursor:pointer}';
  document.head.appendChild(css);
  function ouvrir(o) {
    var L = o.contrats || [], ov = document.createElement('div'), tot = L.reduce(function (a, c) { return a + montant(c); }, 0);
    ov.className = 'trc-ov';
    ov.innerHTML = '<div class="trc-md" role="dialog" aria-modal="true" aria-label="Contrats rattachés"><h2>' + esc(o.titre) + '</h2><p class="s">' + esc(o.sous || '') + ' — ' + L.length + ' contrat(s) rattaché(s)</p><div class="trc-b">' +
      (L.length ? '<table class="trc-t"><thead><tr><th>N° contrat</th><th>Désignation</th><th>Tiers</th><th>Date de signature</th><th class="r">Montant (MGA)</th><th>Statut</th></tr></thead><tbody>' +
        L.map(function (c) { return '<tr><td class="m">' + esc(c.num) + '</td><td>' + esc(c.designation) + '</td><td>' + esc(c.tiers) + '</td><td>' + dt(c.dateSign) + '</td><td class="r">' + nb(montant(c)) + '</td><td>' + esc(c.statut || 'Actif') + '</td></tr>'; }).join('') +
        '</tbody><tfoot><tr><td colspan="4">Total</td><td class="r">' + nb(tot) + '</td><td></td></tr></tfoot></table>' : '<div class="trc-v">Aucun contrat n’est rattaché à ce type.</div>') +
      '</div><div class="trc-f"><button type="button" data-trc-x>Fermer</button></div></div>';
    document.body.appendChild(ov);
    function fermer() { ov.remove(); document.removeEventListener('keydown', cl, true); }
    function cl(e) { if (e.key === 'Escape') { e.preventDefault(); fermer(); } }
    document.addEventListener('keydown', cl, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
    ov.addEventListener('click', function (e) { if (e.target.closest('[data-trc-x]')) fermer(); });
    ov.querySelector('[data-trc-x]').focus();
  }
  window.TYPES_RATTACHES = { ouvrir: ouvrir, montant: montant };
})();
