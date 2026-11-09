// Chargement, états vides et états d'erreur (charte §6.8, §7.4, §8.8, §8.1) — composants partagés : window.SC_ETATS
//  · vide(hôte, {icone, titre, texte, actions}) / htmlVide(o) : pastille 56 px (neutral-50 + bordure), icône 26 px marine, titre Outfit 17 px, texte, actions (principale à droite)
//      cas : première utilisation (« Aucun … pour l'instant » + « Nouveau … »), aucun résultat (« Réinitialiser les filtres »), prérequis manquant, erreur de chargement (pastille rose, « Réessayer »)
//  · erreur(hôte, {onRetry}) : pastille rose-50, « Impossible de charger les données », « Réessayer »
//  · squelette(hôte, colonnes, lignes=5) : squelette à la forme du tableau (jamais de voile sur le tableau) ; charger(hôte, tâche, {colonnes}) n'affiche rien avant 300 ms
//  · chargement(hôte) : indicateur circulaire 40 px (marine-700 sur marine-100) centré dans la zone de contenu (jamais de voile plein écran)
//  · busy(bouton, oui) : indicateur 16 px dans le bouton + aria-busy ; progression(hôte, {total, duree, onFin, onAnnuler}) : barre avec pourcentage, volume traité et annulation (opérations > 5 s)
// Amélioration automatique : les messages « Aucun … : … » existants (.bp-vide, .jr-vide, …) prennent la forme d'un état vide de la charte.
(function () {
  if (window.SC_ETATS) return;
  var I = {
    inbox: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>',
    search: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    alert: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4M12 17h.01"/></svg>',
    org: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6"/></svg>'
  };
  var css = '' +
    '.sc-vide{display:flex;flex-direction:column;align-items:center;text-align:center;gap:6px;padding:28px 20px}' +
    '.sc-vide .sc-pa{width:56px;height:56px;border-radius:50%;background:#F5F7F9;border:1px solid #E3E7EE;color:#2E427B;display:grid;place-items:center;margin-bottom:8px}.sc-vide.err .sc-pa{background:#FDF2F4;border-color:#F6D5DC;color:#C0392B}' +
    '.sc-vide .sc-ti{font:600 17px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332;margin:0}.sc-vide .sc-tx{margin:0;max-width:420px;font-size:13.5px;line-height:1.45;color:#5B606D}' +
    '.sc-vide .sc-ac{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px}' +
    '.sc-b{min-height:38px;padding:0 16px;border-radius:8px;border:1px solid #C9D2E3;background:#fff;color:#0B1332;font:600 13.5px Inter,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:8px}.sc-b.p{background:#2E427B;border-color:#2E427B;color:#fff}.sc-b:hover{filter:brightness(.96)}' +
    '.sc-sk td{padding:12px 10px!important}.sc-sk i{display:block;height:12px;border-radius:6px;background:linear-gradient(90deg,#EEF1F5 25%,#E3E7EE 37%,#EEF1F5 63%);background-size:400% 100%;animation:scsk 1.3s ease infinite}' +
    '.sc-sk-n{margin:8px 12px;font-size:12px;color:#7B8190}@keyframes scsk{0%{background-position:100% 50%}100%{background-position:0 50%}}' +
    '.sc-ch{display:flex;flex-direction:column;align-items:center;gap:10px;padding:40px 20px;color:#5B606D;font-size:13px}.sc-spin{width:40px;height:40px;border-radius:50%;border:4px solid #DFE7F7;border-top-color:#2E427B;animation:scr .8s linear infinite}' +
    '.sc-b-busy{opacity:.75;cursor:progress!important;pointer-events:none}.sc-b-busy::before{content:"";width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-top-color:transparent;display:inline-block;margin-right:8px;vertical-align:-3px;animation:scr .7s linear infinite}@keyframes scr{to{transform:rotate(360deg)}}' +
    '.sc-pg{padding:6px 0}.sc-pg .sc-pgh{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#0B1332;margin-bottom:6px}.sc-pg .sc-bar{height:8px;border-radius:999px;background:#E9EBF0;overflow:hidden}.sc-pg .sc-bar i{display:block;height:100%;width:0;background:#2E427B;transition:width .2s}.sc-pg .sc-pgd{margin:6px 0 0;font-size:12px;color:#667085}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function htmlVide(o) {
    o = o || {}; var A = (o.actions || []).map(function (a, i) { return '<button type="button" class="sc-b' + (a.primary ? ' p' : '') + '" data-sc-a="' + i + '"' + (a.faire ? ' data-sc-do="' + esc(a.faire) + '"' : '') + '>' + (a.icone === '+' ? '+ ' : '') + esc(a.label) + '</button>'; }).join('');
    return '<div class="sc-vide' + (o.erreur ? ' err' : '') + '" role="' + (o.erreur ? 'alert' : 'status') + '"><span class="sc-pa" aria-hidden="true">' + (I[o.icone] || (o.erreur ? I.alert : I.inbox)) + '</span><h3 class="sc-ti">' + esc(o.titre) + '</h3>' + (o.texte ? '<p class="sc-tx">' + esc(o.texte) + '</p>' : '') + (A ? '<div class="sc-ac">' + A + '</div>' : '') + '</div>';
  }
  function vide(h, o) {
    h.innerHTML = htmlVide(o);
    [].slice.call(h.querySelectorAll('[data-sc-a]')).forEach(function (b) { var a = (o.actions || [])[+b.getAttribute('data-sc-a')]; if (a && a.onClick) b.addEventListener('click', a.onClick); });
    return h;
  }
  function erreur(h, o) { o = o || {}; return vide(h, { erreur: true, icone: 'alert', titre: o.titre || 'Impossible de charger les données', texte: o.texte || 'Le serveur ne répond pas. Vos données ne sont pas perdues.', actions: [{ label: 'Réessayer', primary: false, onClick: o.onRetry }] }); }
  function squelette(h, cols, n) {
    cols = cols || 5; n = n || 5; var r = ''; for (var i = 0; i < n; i++) { r += '<tr class="sc-sk">'; for (var c = 0; c < cols; c++) r += '<td><i style="width:' + (50 + ((i * 7 + c * 13) % 40)) + '%"></i></td>'; r += '</tr>'; }
    if (h.tagName === 'TBODY') h.innerHTML = r; else h.innerHTML = '<table style="width:100%;border-collapse:collapse"><tbody>' + r + '</tbody></table>'; h.setAttribute('aria-busy', 'true'); return h;
  }
  function chargement(h, texte) { h.innerHTML = '<div class="sc-ch" role="status" aria-live="polite"><span class="sc-spin" aria-hidden="true"></span><span>' + esc(texte || 'Chargement…') + '</span></div>'; h.setAttribute('aria-busy', 'true'); return h; }
  // « Rien n'est affiché sous 300 ms » : le squelette n'apparaît qu'au-delà ; tache(termine) appelle termine() à la fin
  function charger(h, tache, o) {
    o = o || {}; var fini = false, t = setTimeout(function () { if (!fini) (o.page ? chargement : function (x) { squelette(x, o.colonnes, 5); })(h); }, 300);
    tache(function () { fini = true; clearTimeout(t); h.removeAttribute('aria-busy'); if (o.fin) o.fin(); });
  }
  function busy(b, oui) { if (!b) return; b.classList.toggle('sc-b-busy', !!oui); if (oui) b.setAttribute('aria-busy', 'true'); else b.removeAttribute('aria-busy'); }
  function progression(h, o) {
    o = o || {}; var total = o.total || 0, duree = o.duree || 2200, t0 = Date.now(), arret = false, sauve = h.innerHTML;
    h.innerHTML = '<div class="sc-pg" role="status"><div class="sc-pgh"><span>' + esc(o.titre || 'Opération en cours…') + '</span><span data-sc-p>0 %</span></div><div class="sc-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100"><i data-sc-i></i></div><p class="sc-pgd" data-sc-d></p><button type="button" class="sc-b" data-sc-x style="margin-top:8px;width:100%;justify-content:center">Annuler</button></div>';
    var barre = h.querySelector('[data-sc-i]'), pc = h.querySelector('[data-sc-p]'), dt = h.querySelector('[data-sc-d]');
    function fin(ok) { clearInterval(iv); h.innerHTML = sauve; if (ok) { if (o.onFin) o.onFin(); } else if (o.onAnnuler) o.onAnnuler(); }
    var iv = setInterval(function () {
      var p = Math.min(100, Math.round((Date.now() - t0) / duree * 100)); barre.style.width = p + '%'; pc.textContent = p + ' %'; barre.parentNode.setAttribute('aria-valuenow', p);
      dt.textContent = total ? Math.round(total * p / 100).toLocaleString('fr-FR') + ' / ' + total.toLocaleString('fr-FR') + ' lignes' : '';
      if (p >= 100) fin(true);
    }, 80);
    h.querySelector('[data-sc-x]').addEventListener('click', function () { arret = true; fin(false); });
    return { annuler: function () { fin(false); } };
  }
  window.SC_ETATS = { vide: vide, htmlVide: htmlVide, erreur: erreur, squelette: squelette, chargement: chargement, charger: charger, busy: busy, progression: progression };

  // ---------- amélioration automatique des messages « vides » existants ----------
  var SEL = '.bp-vide,.jr-vide,.gn-vide,.dm-vide,[data-sc-vide]', occupe = false;
  function ameliorer(el) {
    if (el.querySelector('.sc-vide')) return; var t = (el.textContent || '').replace(/\s+/g, ' ').trim(); if (!t) return;
    var i = t.indexOf(':'), titre = i > 0 && i < 60 ? t.slice(0, i).trim() : t, texte = i > 0 && i < 60 ? t.slice(i + 1).trim() : '';
    if (texte) texte = texte.charAt(0).toUpperCase() + texte.slice(1);
    if (!texte && titre.length > 60) { texte = titre; titre = 'Aucun résultat'; }
    if (el.getAttribute('data-sc-titre')) { titre = el.getAttribute('data-sc-titre'); texte = el.getAttribute('data-sc-texte') || ''; }
    var act = el.getAttribute('data-sc-action'), faire = el.getAttribute('data-sc-do');
    occupe = true;
    el.innerHTML = htmlVide({ icone: /filtre|recherche|critère/i.test(t) ? 'search' : 'inbox', titre: titre, texte: texte, actions: act ? [{ label: act, primary: true, faire: faire }] : [] }); occupe = false;
  }
  function balayer() { if (occupe) return; [].slice.call(document.querySelectorAll(SEL)).forEach(ameliorer); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-sc-do]'); if (!b) return; var ecran = b.closest('[data-screen]') || document, c = ecran.querySelector(b.getAttribute('data-sc-do')); if (c) c.click();
  });
  var to; new MutationObserver(function () { if (occupe) return; clearTimeout(to); to = setTimeout(balayer, 60); }).observe(document.body, { childList: true, subtree: true, characterData: true });
  window.addEventListener('load', function () { setTimeout(balayer, 100); }); setTimeout(balayer, 400);
})();
