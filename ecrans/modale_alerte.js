// Modales d'avertissement / de confirmation aux couleurs de la charte Softwell, en remplacement des boîtes natives du navigateur (window.confirm, window.alert).
// Les écrans appellent encore « if (!window.confirm(...)) return; » (appel synchrone) : window.confirm est donc intercepté — il affiche la modale, renvoie false,
// puis, si l'utilisateur valide, rejoue le clic d'origine avec une approbation à usage unique, de sorte que le second appel renvoie true.
(function () {
  var natif = { confirm: window.confirm.bind(window), alert: window.alert.bind(window) };
  var approuve = null, ouverte = null;
  var css = document.createElement('style');
  css.textContent = '.mal-ov{position:fixed;inset:0;z-index:3500;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(11,19,50,.55)}' +
    '.mal-md{width:min(440px,100%);padding:24px;border-radius:12px;background:#fff;box-shadow:0 28px 70px rgba(11,19,50,.35);font-family:var(--font-sans,Inter,system-ui,sans-serif);color:#353944}' +
    '.mal-ic{display:flex;align-items:center;justify-content:center;width:48px;height:48px;margin-bottom:14px;border-radius:50%;font-size:24px}' +
    '.mal-ic.danger{background:#FDE4E1;color:#B63132}.mal-ic.warn{background:#FBF3C7;color:#706000}.mal-ic.info{background:#E3EBFE;color:#2E427B}' +
    '.mal-md h2{margin:0 0 8px;font:600 18px var(--font-heading,Outfit,Inter,sans-serif);color:#0B1332}' +
    '.mal-md p{margin:0;font-size:14px;line-height:1.5;color:#353944}.mal-md p.sec{margin-top:6px;font-size:13px;color:#5B606D}' +
    '.mal-bt{display:flex;justify-content:flex-end;gap:10px;margin-top:22px}' +
    '.mal-bt button{min-height:40px;padding:0 18px;border:1px solid #2E427B;border-radius:8px;background:#fff;color:#2E427B;font:600 14px var(--font-sans,Inter,system-ui,sans-serif);cursor:pointer}' +
    '.mal-bt button:hover{background:#F4F7FE}.mal-bt button:focus-visible{outline:2px solid #2E427B;outline-offset:2px}' +
    '.mal-bt button.ok{background:#2E427B;color:#fff}.mal-bt button.ok:hover{background:#243569}' +
    '.mal-bt button.ok.danger{background:#B63132;border-color:#B63132}.mal-bt button.ok.danger:hover{background:#962728}' +
    '.mal-bt button.ok.warn{background:#2E427B}';
  document.head.appendChild(css);

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  // Classe le message : suppression (danger), abandon (avertissement) ou confirmation simple
  function typer(msg) {
    if (/^supprimer/i.test(msg)) return { k: 'danger', ic: 'trash', titre: 'Confirmer la suppression', ok: 'Supprimer' };
    if (/^annuler la clôture/i.test(msg)) return { k: 'warn', ic: 'lock-open', titre: 'Annuler la clôture', ok: 'Annuler la clôture' };
    if (/^clôturer/i.test(msg)) return { k: 'warn', ic: 'lock', titre: 'Confirmer la clôture', ok: 'Clôturer' };
    if (/^rouvrir/i.test(msg)) return { k: 'warn', ic: 'lock-open', titre: 'Rouvrir la période', ok: 'Rouvrir' };
    if (/^générer/i.test(msg)) return { k: 'warn', ic: 'refresh', titre: 'Régénérer', ok: 'Générer' };
    if (/^(abandonner|annuler|quitter)/i.test(msg)) return { k: 'warn', ic: 'alert-triangle', titre: 'Abandonner la saisie ?', ok: 'Abandonner' };
    return { k: 'warn', ic: 'alert-triangle', titre: 'Confirmation', ok: 'Confirmer' };
  }
  function corps(msg) {
    var m = String(msg).split(/\s*(?=Cette action est définitive\.)/);
    return '<p>' + esc(m[0].trim()) + '</p>' + (m[1] ? '<p class="sec">' + esc(m[1].trim()) + '</p>' : '');
  }
  function afficher(opt, rappel) {
    if (ouverte) ouverte.remove();
    var prec = document.activeElement;
    var ov = document.createElement('div'); ov.className = 'mal-ov';
    ov.innerHTML = '<div class="mal-md" role="alertdialog" aria-modal="true" aria-labelledby="mal-t" aria-describedby="mal-d">' +
      '<div class="mal-ic ' + opt.k + '" aria-hidden="true"><i class="ti ti-' + opt.ic + '"></i></div>' +
      '<h2 id="mal-t">' + esc(opt.titre) + '</h2><div id="mal-d">' + corps(opt.msg) + '</div>' +
      '<div class="mal-bt">' + (opt.simple ? '' : '<button type="button" data-mal-x>Annuler</button>') + '<button type="button" class="ok ' + opt.k + '" data-mal-ok>' + esc(opt.ok) + '</button></div></div>';
    document.body.appendChild(ov); ouverte = ov;
    var ok = ov.querySelector('[data-mal-ok]'), x = ov.querySelector('[data-mal-x]');
    function fermer(oui) { ov.remove(); ouverte = null; document.removeEventListener('keydown', clavier, true); if (prec && prec.focus && document.contains(prec)) { try { prec.focus(); } catch (e) {} } if (oui && rappel) rappel(); }
    function clavier(e) {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); fermer(false); }
      else if (e.key === 'Tab') { var b = [x, ok].filter(Boolean), i = b.indexOf(document.activeElement); e.preventDefault(); b[(i + (e.shiftKey ? -1 : 1) + b.length) % b.length].focus(); }
    }
    document.addEventListener('keydown', clavier, true);
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(false); });
    ok.addEventListener('click', function () { fermer(true); });
    if (x) x.addEventListener('click', function () { fermer(false); });
    (x || ok).focus();   // le bouton par défaut est « Annuler » : une suppression n'est jamais validée par un Entrée distrait
  }

  window.confirm = function (msg) {
    msg = String(msg == null ? '' : msg);
    if (approuve === msg) { approuve = null; return true; }
    var ev = window.event, cible = ev && ev.target && ev.target.closest ? ev.target.closest('button,a,[role=button],input,tr,td,li') || ev.target : null;
    if (!cible || !document.contains(cible)) return natif.confirm(msg);   // pas d'événement à rejouer : boîte native
    var t = typer(msg); t.msg = msg;
    afficher(t, function () {
      approuve = msg;
      try { cible.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); } finally { approuve = null; }
    });
    return false;
  };
  window.alert = function (msg) { afficher({ k: 'info', ic: 'info-circle', titre: 'Information', ok: 'OK', simple: true, msg: String(msg == null ? '' : msg) }); };
})();
