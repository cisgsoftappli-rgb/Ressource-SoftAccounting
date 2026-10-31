// Règle générale des pop-up modaux : un clic en dehors de la fenêtre (sur le fond assombri) la ferme.
// Repère tout fond plein écran en position fixe qui contient une fenêtre (role="dialog" / aria-modal, ou classe *-ov / overlay / modal) et déclenche
// son bouton de fermeture (Fermer, Annuler, ×) ; à défaut, la touche Échap puis le masquage. Le clic doit commencer ET finir sur le fond
// (une sélection de texte qui déborde de la fenêtre ne la ferme pas).
(function () {
  var debut = null;
  function fond(t) {
    if (!t || t.nodeType !== 1 || !t.isConnected) return null;
    var cs = getComputedStyle(t); if (cs.position !== 'fixed' || cs.display === 'none') return null;
    var r = t.getBoundingClientRect(); if (r.width < innerWidth * 0.9 || r.height < innerHeight * 0.9) return null;
    if (/sidebar/i.test(String(t.className))) return null;
    if (!t.querySelector('[role="dialog"],[aria-modal="true"]') && !/(^|[-_ ])(ov|overlay|modal|backdrop|mask)($|[-_ ])/i.test(String(t.className))) return null;
    return t;
  }
  function visible(o) { return o.isConnected && getComputedStyle(o).display !== 'none' && !o.hidden; }
  function fermer(o) {
    var b = o.querySelector('[aria-label="Fermer"],[aria-label="Close"],[data-ia-x],[data-fermer]');
    if (!b) b = [].slice.call(o.querySelectorAll('button,a')).filter(function (x) { return /^\s*(fermer|annuler|close|×|✕)\s*$/i.test(x.textContent) || /(^|[-_ ])(x|fermer|close)$/i.test(String(x.className)) || /(fermer|-x$|-ix$|-mx$|-sx$)/i.test(Object.keys(x.dataset || {}).join(' ')); })[0];
    if (b && !b.disabled) { b.click(); return; }
    o.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    if (visible(o)) { if (o.parentElement === document.body && !o.hasAttribute('data-screen')) o.remove(); else o.hidden = true; }
  }
  document.addEventListener('mousedown', function (e) { debut = e.target; }, true);
  document.addEventListener('click', function (e) {
    var t = e.target; if (debut !== t) return;
    var o = fond(t); if (o) fermer(o);
  }, true);
})();
