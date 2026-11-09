// Filet de sécurité commun à tous les menus et modules : toute erreur d'exécution (action qui échoue, promesse rejetée, ressource introuvable,
// stockage local plein ou refusé) affiche un message explicite (menu concerné, nature du problème, que faire) au lieu d'échouer en silence.
// Les contrôles de saisie propres à chaque écran (champ obligatoire, format, doublon…) restent affichés par l'écran lui-même.
(function () {
  if (window.__erreursGlobales) return; window.__erreursGlobales = true;
  var css = document.createElement('style');
  css.textContent = '.eg-ban{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:4000;width:min(640px,calc(100% - 24px));display:flex;gap:12px;align-items:flex-start;padding:14px 16px;border:1px solid #E8A8A2;border-left:5px solid #B63132;border-radius:10px;background:#FDF1F0;color:#5A1A1B;box-shadow:0 12px 32px rgba(11,19,50,.25);font:14px/1.45 var(--font-sans,Inter,system-ui,sans-serif)}' +
    '.eg-ban b{display:block;margin-bottom:2px;color:#8F2324;font-size:15px}.eg-ban p{margin:2px 0 0}.eg-ban .eg-menu{font-weight:600}.eg-ban .eg-det{font-size:12.5px;color:#7A3536;word-break:break-word}' +
    '.eg-ban button{flex:none;margin-left:auto;min-height:32px;padding:0 12px;border:1px solid #B63132;border-radius:8px;background:#fff;color:#B63132;font:600 13px var(--font-sans,Inter,system-ui,sans-serif);cursor:pointer}.eg-ban button:hover{background:#FDE4E1}' +
    '.eg-ban button:focus-visible{outline:2px solid #B63132;outline-offset:2px}';
  document.head.appendChild(css);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function visible(e) { return !!(e && (e.offsetWidth || e.offsetHeight || e.getClientRects().length)); }
  // nom du menu affiché à l'écran : titre de la page courante, sinon dernier élément du fil d'Ariane, sinon l'ancre de l'adresse
  function menu() {
    var h = [].slice.call(document.querySelectorAll('h1.ch-h1,[role=heading][aria-level="1"]')).filter(visible)[0];
    if (h && h.textContent.trim()) return h.textContent.trim().replace(/\s+/g, ' ').slice(0, 80);
    var bc = [].slice.call(document.querySelectorAll('[aria-label*="riane" i] li,[aria-label*="readcrumb" i] li,nav li,.breadcrumb li')).filter(visible);
    if (bc.length && bc[bc.length - 1].textContent.trim()) return bc[bc.length - 1].textContent.trim().replace(/\s+/g, ' ').slice(0, 80);
    var ti = (document.title || '').replace(/^SoftCompta\s*[—-]\s*/, '').trim(); if (ti && location.hash) return ti.slice(0, 80);
    return location.hash ? location.hash.replace(/^#/, '') : 'Tableau de bord';
  }
  // explication lisible selon la nature technique de l'erreur
  function expliquer(msg, nom) {
    var m = String(msg || '');
    if (/quota|exceeded the quota|storage/i.test(m) || nom === 'QuotaExceededError') return { t: 'Enregistrement impossible : l’espace de stockage du navigateur est plein.', c: 'Libérez de la place (effacez les données du site dans les paramètres du navigateur ou supprimez des données inutiles) puis recommencez.' };
    if (/SecurityError|access is denied|denied for this document/i.test(m) || nom === 'SecurityError') return { t: 'Le navigateur refuse l’enregistrement des données (navigation privée ou stockage bloqué).', c: 'Autorisez le stockage pour ce site ou quittez la navigation privée ; sinon, vos saisies ne seront pas conservées.' };
    if (/network|failed to fetch|load failed|networkerror/i.test(m)) return { t: 'La connexion au serveur a échoué.', c: 'Vérifiez votre connexion internet puis recommencez.' };
    if (/JSON|Unexpected token|is not valid/i.test(m)) return { t: 'Des données enregistrées ou importées sont illisibles ou corrompues.', c: 'Vérifiez le fichier importé ; si le problème vient des données enregistrées, effacez les données du site puis ressaisissez-les.' };
    if (/is not defined|is not a function|Cannot read|Cannot set|undefined|null/i.test(m)) return { t: 'Une anomalie interne a empêché la dernière action d’aboutir.', c: 'Recommencez l’action ; si l’erreur persiste, rechargez la page (les données déjà enregistrées sont conservées) et signalez le menu concerné.' };
    return { t: 'La dernière action n’a pas pu aboutir.', c: 'Recommencez ; si l’erreur persiste, rechargez la page (les données déjà enregistrées sont conservées).' };
  }
  var vu = {}, ban = null, minuteur = null;
  function afficher(msg, nom, detail) {
    var cle = menu() + '|' + msg; if (vu[cle] && Date.now() - vu[cle] < 4000) return; vu[cle] = Date.now();
    var ex = expliquer(msg, nom);
    if (ban) ban.remove(); clearTimeout(minuteur);
    ban = document.createElement('div'); ban.className = 'eg-ban'; ban.setAttribute('role', 'alert');
    ban.innerHTML = '<div><b>Une erreur est survenue</b><p><span class="eg-menu">Menu : ' + esc(menu()) + '</span></p><p>' + esc(ex.t) + '</p><p>' + esc(ex.c) + '</p>' +
      '<p class="eg-det">Détail technique : ' + esc((detail ? detail + ' — ' : '') + String(msg || 'erreur inconnue').slice(0, 220)) + '</p></div><button type="button">Fermer</button>';
    ban.querySelector('button').addEventListener('click', function () { ban.remove(); ban = null; });
    document.body.appendChild(ban); minuteur = setTimeout(function () { if (ban) { ban.remove(); ban = null; } }, 20000);
  }
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && t.tagName) { // ressource qui ne se charge pas (image, feuille de style, script)
      var u = t.currentSrc || t.src || t.href || ''; if (!u || /^data:/.test(u)) return;
      afficher('Ressource introuvable : ' + u.slice(0, 120), '', 'chargement'); return;
    }
    var m = e.message || (e.error && e.error.message) || '';
    if (/ResizeObserver loop/i.test(m)) return;
    if (!m || /^Script error\.?$/i.test(m)) m = 'erreur d’un script externe';
    afficher(m, e.error && e.error.name, e.filename ? (e.filename.split('/').pop() + ':' + e.lineno) : '');
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason; afficher((r && r.message) || String(r || 'opération asynchrone refusée'), r && r.name, 'promesse rejetée');
  });
  // les écrans enregistrent leurs données dans le navigateur et ignorent les échecs : on les signale ici
  try {
    var sv = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      try { return sv.call(this, k, v); } catch (err) { afficher(err && err.message || 'stockage indisponible', err && err.name, 'enregistrement « ' + k + ' »'); throw err; }
    };
  } catch (e) {}
  window.afficherErreur = function (message, detail) { afficher(message, '', detail); };

  // ---------- message de réussite (ou d'échec explicite) après une action ----------
  // Les écrans qui affichent déjà leur propre message (toast, bandeau…) ne sont pas doublonnés ; les autres reçoivent un message commun.
  var css2 = document.createElement('style');
  css2.textContent = '.eg-ok{position:fixed;right:20px;bottom:24px;z-index:3900;max-width:min(420px,calc(100% - 40px));display:flex;gap:10px;align-items:flex-start;padding:12px 16px;border-radius:10px;border-left:5px solid #1E7B3F;background:#E9F6EE;color:#14502A;box-shadow:0 12px 30px rgba(11,19,50,.22);font:14px/1.45 var(--font-sans,Inter,system-ui,sans-serif)}' +
    '.eg-ok b{display:block;font-size:14.5px}.eg-ok small{display:block;color:#2F6B47;font-size:12.5px}.eg-ok.ko{border-left-color:#B63132;background:#FDF1F0;color:#5A1A1B}.eg-ok.ko small{color:#7A3536}';
  document.head.appendChild(css2);
  var VERBES = [
    [/^enregistrer/i, 'Enregistrement effectué.'], [/^supprimer/i, 'Suppression effectuée.'], [/^g[ée]n[ée]rer/i, 'Génération effectuée.'],
    [/^cl[ôo]turer/i, 'Clôture effectuée.'], [/^rouvrir/i, 'Réouverture effectuée.'], [/^valider/i, 'Validation effectuée.'], [/^dupliquer/i, 'Duplication effectuée.']
  ];
  var ECHEC = { 'Enregistrement effectué.': 'Enregistrement impossible', 'Suppression effectuée.': 'Suppression impossible', 'Génération effectuée.': 'Génération impossible', 'Clôture effectuée.': 'Clôture impossible', 'Réouverture effectuée.': 'Réouverture impossible', 'Validation effectuée.': 'Validation impossible', 'Duplication effectuée.': 'Duplication impossible' };
  var okEl = null, okT = null;
  function note(txt, detail, ko) {
    if (okEl) okEl.remove(); clearTimeout(okT);
    okEl = document.createElement('div'); okEl.className = 'eg-ok' + (ko ? ' ko' : ''); okEl.setAttribute('role', ko ? 'alert' : 'status');
    okEl.innerHTML = '<div><b>' + esc(txt) + '</b><small>' + esc(detail) + '</small></div>';
    document.body.appendChild(okEl); okT = setTimeout(function () { if (okEl) { okEl.remove(); okEl = null; } }, ko ? 7000 : 3500);
  }
  function signature(n) { if (!n || n.nodeType !== 1) n = n && n.parentElement; if (!n) return ''; var a = []; for (var i = 0; i < n.attributes.length; i++) a.push(n.attributes[i].name); return ((n.id || '') + ' ' + (typeof n.className === 'string' ? n.className : '') + ' ' + a.join(' ')).toLowerCase(); }
  var PROPRE = /toast|snack|notif|msg|message|alert|statut|status|bandeau|feedback|banner|flash/;
  function erreursVisibles() {
    var r = [];
    [].slice.call(document.querySelectorAll('[class],[aria-invalid=true]')).forEach(function (e) {
      if (e.closest('.eg-ban,.eg-ok')) return;
      var cl = typeof e.className === 'string' ? e.className : '', jetons = cl.split(/\s+/), est = e.getAttribute('aria-invalid') === 'true' && e.tagName !== 'INPUT' && e.tagName !== 'SELECT' && e.tagName !== 'TEXTAREA';
      for (var i = 0; i < jetons.length; i++) if (/(^|[-_])(er|err|erreur|error|invalid)$/i.test(jetons[i])) est = true;
      if (est && !e.children.length && e.textContent.trim() && visible(e)) r.push(e.textContent.trim());
    });
    return r;
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('button,[role=button]'); if (!b || b.disabled || b.closest('.eg-ban,.eg-ok,.mal-ov')) return;
    var lib = (b.textContent || '').trim().replace(/\s+/g, ' '), v = null;
    for (var i = 0; i < VERBES.length; i++) if (VERBES[i][0].test(lib)) { v = VERBES[i][1]; break; }
    if (!v || lib.length > 40) return;
    var propre = false, mo = new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.target.closest && m.target.closest('.eg-ban,.eg-ok,.mal-ov')) return; if (PROPRE.test(signature(m.target)) || (m.addedNodes && [].some.call(m.addedNodes, function (n) { return PROPRE.test(signature(n)); }))) propre = true; }); });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true });
    var avant = erreursVisibles().join('|');
    setTimeout(function () {
      mo.disconnect(); if (okEl) { okEl.remove(); okEl = null; }
      if (document.querySelector('.mal-ov') || document.querySelector('.eg-ban')) return; // confirmation en attente ou erreur déjà signalée
      var er = erreursVisibles();
      if (er.length && er.join('|') !== '') {
        if (propre) return;
        note(ECHEC[v] + ' — ' + menu() + '.', 'Corrigez le(s) champ(s) signalé(s) : ' + er.slice(0, 3).join(' ; ') + (er.length > 3 ? ' …' : ''), true); return;
      }
      if (propre) return;
      note(v, 'Menu : ' + menu(), false);
    }, 650);
  }, true);
  window.afficherSucces = function (message, detail) { note(message, detail || 'Menu : ' + menu(), false); };
})();
