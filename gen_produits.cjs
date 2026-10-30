// Génère ecrans/produits.js (sélecteur de produits de l'en-tête) en incorporant les logos recadrés des captures (logos/*.png).
const fs = require('fs');
const b64 = (f) => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const js = `// Sélecteur de produits (en-tête) : la liste déroulante de la capture est inerte dans la maquette ; elle est reconstruite ici.
// Produits : SoftAccounting (courant), Soft e-Payment, Soft Budget. Les deux autres produits ne sont pas navigables (maquette) : un message l'indique.
(function () {
  var LOGOS = { epay: '${b64('logos/e-payment_capture.png')}', budget: '${b64('logos/budget_capture.png')}' };
  window.PRODUITS_LOGOS = LOGOS;
  var PRODUITS = [
    { id: 'accounting', nom: 'SoftAccounting', desc: 'Comptabilité & pilotage financier', courant: true },
    { id: 'epay', nom: 'Soft e-Payment', desc: 'Paiements et encaissements électroniques', logo: 'epay' },
    { id: 'budget', nom: 'Soft Budget', desc: 'Élaboration et suivi budgétaire', logo: 'budget' }
  ];
  var css = document.createElement('style');
  css.textContent = '.app-switcher{position:relative}' +
    '.ps-menu{position:absolute;top:calc(100% + 8px);left:0;z-index:2600;width:min(318px,calc(100vw - 18px));overflow:hidden;border:1px solid #E9EBF0;border-radius:12px;background:#fff;box-shadow:0 28px 70px #0b133230,0 1px 0 #ffffffe6 inset}' +
    '.ps-menu[hidden]{display:none}' +
    '.ps-list{display:grid;gap:4px;padding:10px 12px}' +
    '.ps-item{display:grid;grid-template-columns:46px minmax(0,1fr) 18px;align-items:center;gap:12px;width:100%;min-height:58px;padding:4px 8px 4px 4px;border:1px solid transparent;border-radius:12px;background:#fff;text-align:left;cursor:pointer;font:inherit}' +
    '.ps-item:hover,.ps-item:focus-visible{background:#F4F7FE;border-color:#DCE4F7;outline:0}' +
    '.ps-item[aria-current="true"]{background:#EEF1FA;border-color:#C9D3F0}' +
    '.ps-mark{display:block;width:46px;height:50px;overflow:hidden;background-repeat:no-repeat;background-position:0 0;background-size:auto}' +
    '.ps-mark.acc{width:42px;height:42px;margin:4px;border:1px solid #fffffff0;border-radius:12px;background-color:#fff;background-position:center;background-size:contain;box-shadow:0 2px 8px #0b13321f}' +
    '.ps-txt{display:block;min-width:0}.ps-txt b{display:block;font-size:14px;font-weight:700;color:#0B1332;line-height:1.2}.ps-txt small{display:block;margin-top:2px;font-size:12px;color:#5B606D;line-height:1.3}' +
    '.ps-ok{color:#2E427B;font-size:16px}' +
    '.ps-toast{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:3000;background:#0B1332;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px}';
  document.head.appendChild(css);

  function monter() {
    var racine = document.querySelector('.app-switcher'), btn = racine && racine.querySelector('.app-switcher-trigger');
    if (!racine || !btn || racine.__ps) return;
    racine.__ps = true;
    var logoCourant = (btn.querySelector('.switcher-logo-img') || {}).src || '';
    var menu = document.createElement('div'); menu.className = 'ps-menu'; menu.setAttribute('role', 'menu'); menu.setAttribute('aria-label', 'Basculer de produit'); menu.hidden = true;
    var liste = document.createElement('div'); liste.className = 'ps-list';
    PRODUITS.forEach(function (p) {
      var b = document.createElement('button'); b.type = 'button'; b.className = 'ps-item'; b.setAttribute('role', 'menuitem'); b.dataset.psId = p.id;
      if (p.courant) b.setAttribute('aria-current', 'true');
      var m = document.createElement('span'); m.className = 'ps-mark' + (p.courant ? ' acc' : ''); m.setAttribute('aria-hidden', 'true');
      m.style.backgroundImage = 'url("' + (p.courant ? logoCourant : LOGOS[p.logo]) + '")';
      var t = document.createElement('span'); t.className = 'ps-txt'; var n = document.createElement('b'); n.textContent = p.nom; var d = document.createElement('small'); d.textContent = p.desc; t.appendChild(n); t.appendChild(d);
      var c = document.createElement('i'); c.className = 'ps-ok ti ti-check'; c.style.visibility = p.courant ? 'visible' : 'hidden'; c.setAttribute('aria-hidden', 'true');
      b.appendChild(m); b.appendChild(t); b.appendChild(c); liste.appendChild(b);
    });
    menu.appendChild(liste); racine.appendChild(menu);
    function ouvrir(o) { menu.hidden = !o; btn.setAttribute('aria-expanded', o ? 'true' : 'false'); btn.classList.toggle('app-switcher-trigger-open', o); }
    function toast(txt) { var d = document.createElement('div'); d.className = 'ps-toast'; d.textContent = txt; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 2600); }
    btn.addEventListener('click', function (e) { e.stopPropagation(); ouvrir(menu.hidden); if (!menu.hidden) { var cur = menu.querySelector('[aria-current="true"]'); if (cur) cur.focus(); } });
    menu.addEventListener('click', function (e) {
      var b = e.target.closest('.ps-item'); if (!b) return; e.stopPropagation(); ouvrir(false);
      var p = PRODUITS.filter(function (x) { return x.id === b.dataset.psId; })[0];
      if (p && p.id === 'epay' && window.EPAYMENT) window.EPAYMENT.ouvrir();
      else if (p && !p.courant) toast(p.nom + ' : produit non disponible dans cette maquette.');
    });
    document.addEventListener('click', function () { if (!menu.hidden) ouvrir(false); });
    document.addEventListener('keydown', function (e) {
      if (menu.hidden) return;
      if (e.key === 'Escape') { ouvrir(false); btn.focus(); }
      else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); var it = [].slice.call(menu.querySelectorAll('.ps-item')), i = it.indexOf(document.activeElement); it[(i + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length].focus(); }
    });
  }
  setTimeout(monter, 300); setInterval(monter, 1500);
})();
`;
fs.writeFileSync('ecrans/produits.js', js);
console.log('produits.js', js.length);
