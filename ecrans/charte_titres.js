// Charte §7.5 : un seul titre de page (h1) par écran. Les écrans repris des captures n'en ont pas :
// on promeut leur titre existant (role=heading niveau 1), sinon on ajoute un h1 avec le titre du fil d'Ariane.
(function () {
  function visible(e) { var r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
  function appliquer() {
    var cur = [].slice.call(document.querySelectorAll('.soft-breadcrumb-current')).filter(visible)[0];
    var parent = cur && cur.closest('nav,ol,div') && (function () { var it = [].slice.call(cur.closest('nav,ol,div').querySelectorAll('.soft-breadcrumb-link,.soft-breadcrumb-current')).filter(visible); var i = it.indexOf(cur); return i > 0 ? it[i - 1] : null; })();
    document.querySelectorAll('[data-screen]').forEach(function (s) {
      if (!visible(s) || s.querySelector('h1,[role="heading"][aria-level="1"]')) return;
      var h = [].slice.call(s.querySelectorAll('h2,.dd-title')).filter(visible)[0];
      if (h && parseFloat(getComputedStyle(h).fontSize) >= 15) { h.setAttribute('role', 'heading'); h.setAttribute('aria-level', '1'); return; }
      var t = cur && cur.textContent.trim(); if (!t) return;
      var n = document.createElement('h1'); n.className = 'ch-h1'; n.textContent = t;
      s.insertBefore(n, s.firstChild);
      if (parent && parent.textContent.trim() && !/^softcompta$/i.test(parent.textContent.trim())) { var ey = document.createElement('p'); ey.className = 'ch-eyebrow'; ey.textContent = parent.textContent.trim(); s.insertBefore(ey, n); }
    });
  }
  window.addEventListener('hashchange', function () { setTimeout(appliquer, 120); });
  setTimeout(appliquer, 300);
})();

// Charte §6.4 : le rayon complet est réservé aux avatars et aux pastilles rondes ; boutons, puces et badges ovales -> 8 px (6 px si petits)
(function () {
  var t = null;
  function arrondis() {
    document.querySelectorAll('[data-screen]').forEach(function (s) {
      var r0 = s.getBoundingClientRect(); if (!r0.width || !r0.height) return;
      s.querySelectorAll('*').forEach(function (e) {
        if (e.__rond) return;
        // Les interrupteurs (piste en pilule + curseur rond) gardent leur rayon complet : un rayon de 6 px ferait dépasser le curseur
        if (e.closest('.an-sw,.gu-sw,[role="switch"]') || e.matches('.ml-sw,.ga-sw,.dp-switch,.tp-tg,[class*="switch"]')) { e.__rond = 1; return; }
        var r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
        if (parseFloat(getComputedStyle(e).borderTopLeftRadius) < 100 && getComputedStyle(e).borderTopLeftRadius.indexOf('%') < 0) return;
        e.__rond = 1;
        if (Math.abs(r.width - r.height) <= 2 && r.width <= 64) return;
        e.style.borderRadius = r.height <= 28 ? '6px' : '8px';
      });
    });
  }
  function plan() { clearTimeout(t); t = setTimeout(arrondis, 250); }
  window.addEventListener('hashchange', plan);
  new MutationObserver(plan).observe(document.body, { childList: true, subtree: true });
  setTimeout(arrondis, 400);
})();

// Charte §7.4 / §10 : lien d'évitement, zone principale ciblée, champs toujours nommés
(function () {
  var main = document.querySelector('main.app-layout-main') || document.querySelector('main');
  if (main && !document.getElementById('main-content')) { main.id = 'main-content'; main.setAttribute('tabindex', '-1'); }
  if (!document.querySelector('.ch-skip')) {
    var a = document.createElement('a'); a.className = 'ch-skip'; a.href = '#main-content'; a.textContent = 'Aller au contenu';
    a.addEventListener('click', function (e) { e.preventDefault(); var m = document.getElementById('main-content'); if (m) m.focus(); });
    document.body.insertBefore(a, document.body.firstChild);
  }
  var t = null;
  function nommer() {
    document.querySelectorAll('[data-screen] input:not([type=hidden]):not([type=checkbox]):not([type=radio]),[data-screen] select,[data-screen] textarea').forEach(function (e) {
      if (e.__nom || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label')) return;
      if (e.id && document.querySelector('label[for="' + e.id + '"]')) return;
      var p = e.closest('div,fieldset,li'); if (p && p.querySelector('label') && p.querySelectorAll('input,select,textarea').length <= 2) return;
      var n = e.getAttribute('placeholder') || e.getAttribute('title') || e.getAttribute('name') || (e.tagName === 'SELECT' && e.options[0] && e.options[0].text) || '';
      if (n) { e.setAttribute('aria-label', n.trim()); e.__nom = 1; }
    });
  }
  function plan() { clearTimeout(t); t = setTimeout(nommer, 300); }
  window.addEventListener('hashchange', plan);
  new MutationObserver(plan).observe(document.body, { childList: true, subtree: true });
  setTimeout(nommer, 500);
})();

// Menu latéral repliable : le bouton « Replier la barre latérale » et le bouton menu de la barre supérieure basculent entre 256 px et 72 px
(function () {
  var racine = document.documentElement;
  function lire() { try { return localStorage.getItem('sc-sb-reduit') === '1'; } catch (e) { return false; } }
  function ecrire(v) { try { localStorage.setItem('sc-sb-reduit', v ? '1' : '0'); } catch (e) { } }
  function marquer() {
    var b = [].slice.call(document.querySelectorAll('.sidebar-shell button')).filter(function (x) { return /Replier la barre|Déplier la barre/i.test(x.textContent) || x.hasAttribute('data-repli'); })[0];
    if (b) { b.setAttribute('data-repli', ''); var red = racine.classList.contains('sb-reduit'); b.title = red ? 'Déplier la barre latérale' : 'Replier la barre latérale'; b.setAttribute('aria-label', b.title); }
    var m = document.querySelector('.topbar-menu-button'); if (m) { m.setAttribute('aria-expanded', racine.classList.contains('sb-reduit') ? 'false' : 'true'); m.setAttribute('aria-label', 'Réduire ou agrandir le menu latéral'); }
  }
  function basculer() { var v = !racine.classList.contains('sb-reduit'); racine.classList.toggle('sb-reduit', v); ecrire(v); marquer(); }
  if (lire()) racine.classList.add('sb-reduit');
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-repli') || b.classList.contains('topbar-menu-button') || (b.closest('.sidebar-shell') && /Replier la barre|Déplier la barre/i.test(b.textContent))) { e.preventDefault(); basculer(); }
  }, true);
  setTimeout(marquer, 400);
})();
