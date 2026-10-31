/* Assistant SoftAccounting IA : recherche d'un menu ou d'une fonctionnalité à partir de mots-clés.
   - mots-clés seuls ou combinés (tous les mots doivent être retrouvés) ; tolérance aux fautes de frappe (jusqu'à 3 lettres sur les mots longs) ;
   - cherche dans les entrées du menu (modules, groupes, écrans), puis dans chaque écran : onglets, boutons, champs, colonnes et contenu ;
   - répond par une liste de suggestions cliquables, chacune avec son chemin dans le menu et une description très brève.
   S'enregistre en tête de window.AI_PLUGINS. Ne pas nommer de fonction « $$ » (build.cjs). */
(function () {
  function norm(t) { return String(t == null ? '' : t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’']/g, "'"); }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var STOP = /^(le|la|les|un|une|des|du|de|d|l|et|ou|en|au|aux|sur|pour|par|dans|je|tu|il|on|nous|vous|ce|cet|cette|ces|mon|ma|mes|que|qui|quoi|est|sont|puis|peut|veux|voudrais|ecran|menu|fenetre|module|cherche|chercher|recherche|rechercher|trouve|trouver|trouvez|montre|montrer|ouvre|ouvrir|aller|va|a|y|ca|moi|me|se|sa|son|ses|svp|stp|merci|bonjour|salut|ou|se|situe|trouve|dans|logiciel|fonction|fonctionnalite|page)$/;
  var EXCLU = /(comment|pourquoi|combien|inventaire|qualite|repartition|analys|graphi|ratio|anomalie|incoherence|rentab|marge|solvab|liquidit|diagnostic|top \d|etapes|pas a pas|expliqu)/;
  function mots(t) { return norm(t).split(/[^a-z0-9]+/).filter(function (w) { return w.length > 1 && !STOP.test(w); }); }
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) {
      var prev = p[0], mn; p[0] = i; mn = p[0];
      for (j = 1; j <= b.length; j++) { var tmp = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1)); prev = tmp; if (p[j] < mn) mn = p[j]; }
      if (mn > max) return max + 1;
    }
    return p[b.length];
  }
  function tol(n) { return n <= 3 ? 0 : n <= 5 ? 1 : n <= 7 ? 2 : 3; }
  // similarité d'un mot cherché w avec un mot du corpus x : 1 exact, 0.9 début de mot, 0.5 à 0.8 faute de frappe, 0 sinon
  function sim(w, x) {
    if (w === x) return 1;
    if (w.length >= 3 && x.indexOf(w) === 0) return 0.9;
    if (x.length >= 4 && w.indexOf(x) === 0 && w.length - x.length <= 2) return 0.8;
    var m = tol(w.length); if (!m || x.length < 4) return 0;
    var d = lev(w, x, m); if (d <= m) return 0.8 - 0.1 * d;
    if (x.length > w.length) { d = lev(w, x.slice(0, w.length), m); if (d <= m) return 0.7 - 0.1 * d; }
    return 0;
  }
  function meilleur(w, liste) { var b = 0; for (var i = 0; i < liste.length; i++) { var s = sim(w, liste[i]); if (s > b) { b = s; if (b === 1) break; } } return b; }

  /* ---------- corpus ---------- */
  var IDX = null, ECR = {};
  function txt(e) { return e.textContent.replace(/\s+/g, ' ').trim(); }
  function indexMenu() {
    var res = [], mods = {};
    document.querySelectorAll('[data-module]').forEach(function (m) { mods[m.dataset.module] = txt(m); });
    document.querySelectorAll('[data-sidebar-level]').forEach(function (lv) {
      var mod = mods[lv.dataset.sidebarLevel] || '', gr = {};
      lv.querySelectorAll('[data-group-toggle]').forEach(function (g) { gr[g.dataset.groupToggle] = { l: txt(g), p: g.dataset.group || '' }; });
      function chemin(g) { var c = []; while (g && gr[g]) { c.unshift(gr[g].l); g = gr[g].p; } return c; }
      function ajouter(label, id, g, groupe) {
        if (!label) return;
        var parts = [mod].concat(chemin(g)).filter(Boolean);
        parts = parts.filter(function (p, i) { return i === 0 || p !== parts[i - 1]; });
        if (parts[parts.length - 1] === label) parts.pop();
        res.push({ label: label, id: id, groupe: !!groupe, parents: parts.join(' › '), path: parts.concat([label]).join(' › '), mt: mots(label), mp: mots(parts.join(' ')) });
      }
      var premierDe = {};
      lv.querySelectorAll('a.sidebar-child-item').forEach(function (a) {
        ajouter(txt(a), a.dataset.nav || '', a.dataset.group, false);
        if (a.dataset.nav && a.dataset.nav !== 'x') { var g = a.dataset.group, n = 0; while (g && gr[g] && n++ < 8) { if (!premierDe[g]) premierDe[g] = a.dataset.nav; g = gr[g].p; } }
      });
      Object.keys(gr).forEach(function (k) { if (premierDe[k]) ajouter(gr[k].l, premierDe[k], gr[k].p, true); });
    });
    document.querySelectorAll('[data-module]').forEach(function (m) {
      var id = m.dataset.module === 'tableau-de-bord' ? 'dashboard' : ''; if (id) res.push({ label: txt(m), id: id, groupe: true, parents: '', path: txt(m), mt: mots(txt(m)), mp: [] });
    });
    return res.filter(function (e) { return e.id && e.id !== 'x'; });
  }
  // contenu d'un écran : onglets, boutons, champs, colonnes et texte
  function ecran(id) {
    if (ECR[id]) return ECR[id];
    var el = document.querySelector('[data-screen="' + id + '"]'), o = { feats: [], texte: '', nt: '', mots: [] };
    if (el) {
      var vu = {};
      el.querySelectorAll('button,[role="tab"],label,label span,.bp-champ>span,th,h1,h2,h3,legend,summary').forEach(function (n) {
        var t = txt(n); if (!t || t.length > 70 || vu[t]) return; vu[t] = 1;
        var k = /^(BUTTON)$/.test(n.tagName) ? 'Bouton' : n.getAttribute('role') === 'tab' ? 'Onglet' : n.tagName === 'TH' ? 'Colonne' : /^H\d$|LEGEND|SUMMARY/.test(n.tagName) ? 'Rubrique' : 'Champ';
        o.feats.push({ t: t, k: k, mt: mots(t) });
      });
      var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null), n, parts = [];
      while ((n = w.nextNode())) { var p = n.parentNode && n.parentNode.nodeName; if (p === 'SCRIPT' || p === 'STYLE' || p === 'TEMPLATE') continue; var s = n.nodeValue.replace(/\s+/g, ' ').trim(); if (s) parts.push(s); }
      o.texte = parts.join(' · '); o.nt = norm(o.texte);
      var set = {}; o.nt.split(/[^a-z0-9]+/).forEach(function (m) { if (m.length > 1) set[m] = (set[m] || 0) + 1; }); o.mots = set;
    }
    return (ECR[id] = o);
  }
  function brefDesc(id) {
    var d = window.AI_DESC && window.AI_DESC[id]; if (!d) return '';
    var s = String(d).split(/(?<=[.!?])\s/)[0]; return s.length > 110 ? s.slice(0, 107).replace(/\s+\S*$/, '') + '…' : s;
  }
  function extrait(o, w) {
    var i = o.nt.indexOf(w); if (i < 0) return '';
    var a = Math.max(0, i - 28), b = Math.min(o.texte.length, i + w.length + 40);
    return (a > 0 ? '…' : '') + o.texte.slice(a, b).trim() + (b < o.texte.length ? '…' : '');
  }

  /* ---------- recherche ---------- */
  function chercher(q) {
    var tq = mots(q); if (!tq.length) return null;
    if (!IDX) IDX = indexMenu();
    var res = [];
    IDX.forEach(function (e) {
      var sc = 0, ok = 0, ind = [], fort = false, ec = null;
      tq.forEach(function (w) {
        var s = 0, ou = '';
        var sl = meilleur(w, e.mt); if (sl) { s = 5 * sl; ou = 'label'; fort = true; }
        if (s < 5) {
          ec = ec || ecran(e.id);
          var bf = null, bs = 0; ec.feats.forEach(function (f) { var v = meilleur(w, f.mt); if (v > bs) { bs = v; bf = f; } });
          if (bs && 3 * bs > s) { s = 3 * bs; ou = 'feat'; ind.push({ f: bf, w: w }); fort = true; }
          var bm = 0; if (!fort || !s) { var c = ec.mots[w] ? 1 : 0; if (!c) { for (var k in ec.mots) { var v2 = sim(w, k); if (v2 > bm) bm = v2; if (bm === 1) break; } } else bm = 1; }
          if (bm >= 0.7 && 2 * bm > s) { s = 2 * bm + Math.min(1, (ec.mots[w] || 1) / 10); ou = 'texte'; ind.push({ t: w }); fort = true; }
        }
        var sp = meilleur(w, e.mp); if (sp && 1.5 * sp > s) { s = 1.5 * sp; ou = 'path'; }
        if (s) { ok++; sc += s; }
      });
      if (ok) res.push({ e: e, sc: sc, ok: ok, fort: fort, ind: ind });
    });
    var tous = res.filter(function (r) { return r.ok === tq.length; });
    var liste = tous.length ? tous : res.filter(function (r) { return r.ok >= Math.ceil(tq.length / 2); });
    var fortes = liste.filter(function (r) { return r.fort; }); if (fortes.length) liste = fortes;
    // un résultat par écran (le chemin qui correspond le mieux aux mots cherchés)
    var best = {}; liste.forEach(function (r) { var k = r.e.id; if (!best[k] || r.sc > best[k].sc) best[k] = r; });
    var tri = Object.keys(best).map(function (k) { return best[k]; }).sort(function (a, b) { return b.sc - a.sc || (a.e.groupe ? 0 : 1) - (b.e.groupe ? 0 : 1); });
    // variété : d'abord le meilleur résultat de chaque emplacement du menu, puis les suivants
    var vus = {}, premiers = [], reste = []; tri.forEach(function (r) { var k = r.e.parents + '|' + (r.e.groupe ? r.e.label : ''); if (!vus[r.e.parents]) { vus[r.e.parents] = 1; premiers.push(r); } else reste.push(r); });
    return { tq: tq, liste: premiers.concat(reste), partiel: !tous.length };
  }
  function rendre(q, r) {
    var L = r.liste.slice(0, 10), plus = r.liste.length - L.length;
    var h = '<p>' + (r.partiel ? 'Aucun écran ne contient tous les mots ; voici les plus proches' : '<b>' + r.liste.length + ' résultat' + (r.liste.length > 1 ? 's' : '') + '</b> pour « ' + esc(q.trim()) + ' »') + ' :</p><ul style="margin:6px 0 0;padding:0;list-style:none">';
    L.forEach(function (x) {
      var e = x.e, ec = ecran(e.id), d = '';
      var feat = x.ind.filter(function (i) { return i.f; })[0], mt = x.ind.filter(function (i) { return i.t; })[0];
      if (feat) d = feat.f.k + ' « ' + feat.f.t + ' » dans cet écran';
      else if (mt) { var ex = extrait(ec, mt.t); d = ex ? 'Contenu : ' + ex : ''; }
      var base = brefDesc(e.id);
      var br = [base, d].filter(Boolean).join(' — ');
      h += '<li style="margin:0 0 8px;padding:8px 10px;border:1px solid #E9EBF0;border-radius:8px;background:#fff;text-align:left"><a class="ai-lien" href="#' + esc(e.id) + '">' + esc(e.label) + ' <i class="ti ti-arrow-right" aria-hidden="true"></i></a>' +
        '<br><small style="color:#5B606D">' + esc(e.parents || 'Menu principal') + '</small>' + (br ? '<br><small style="color:#353944">' + esc(br.length > 170 ? br.slice(0, 167) + '…' : br) + '</small>' : '') + '</li>';
    });
    h += '</ul>' + (plus > 0 ? '<p style="margin-top:4px"><small>' + plus + ' autre(s) résultat(s) : ajoutez un second mot-clé pour affiner (ex. « ' + esc(r.tq[0]) + ' budget »).</small></p>' : '');
    return h;
  }
  window.AI_PLUGINS = window.AI_PLUGINS || [];
  window.AI_PLUGINS.unshift(function (q, t) {
    var explicite = /(^|\s)(cherche|chercher|recherche|rechercher|trouve|trouver|ou est|ou se trouve|ou trouver|ou se situe|montre|menu)(\s|$)/.test(t);
    var tq = mots(q);
    if (!tq.length || tq.length > 5 || (EXCLU.test(t) && !explicite) || /^(merci|bonjour|salut|hello)/.test(t.trim())) return null;
    var r = chercher(q);
    if (!r || !r.liste.length) return explicite ? '<p>Aucun menu ni fonctionnalité ne correspond à « ' + esc(q.trim()) + ' ». Essayez un autre mot-clé (la recherche tolère les fautes de frappe).</p>' : null;
    if (!explicite && r.partiel && tq.length > 2) return null;
    return rendre(q, r);
  });
  window.AI_RECHERCHE = { chercher: chercher, sim: sim };
})();
