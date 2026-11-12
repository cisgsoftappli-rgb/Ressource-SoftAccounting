// Barre d'actions de page (charte §7.1 n° 5-6, §7.4, §8.1) : bande blanche unique sous le fil d'Ariane.
// Recherche à gauche, actions à droite (secondaires, Annuler, puis l'action principale tout à droite ; pour les états :
// Filtre | CSV | EXCEL | PDF). Les boutons et champs d'origine restent dans leur page (écouteurs intacts, masqués visuellement) :
// la barre en est le miroir (libellé, état désactivé / masqué) et relaie clics et saisie.
(function () {
  // Écrans équipés. « add » : écran de gestion (bouton Ajouter / Nouveau…) ; « txt » : boutons repérés par leur libellé.
  var CFG = {
    exercices: { plat: 1, txt: /^(ajouter|modifier|supprimer|définir en cours|clôturer l'exercice|enregistrer|annuler|imprimer|exporter)$/i }, saisie: { add: 1 }, dp: { add: 1 }, procfin: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|nouvelle sélection)$/i }, fichecontrat: { add: 1, plat: 1 }, budgetconv: { plat: 1, txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|synchronisation softbudget|importation)$/i }, badprog: { plat: 1, txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|importer|récupération softbudget)$/i }, rfiparam: { plat: 1, txt: /^(enregistrer|annuler)$/i }, rfiedit: { plat: 1, txt: /^(critères|pdf|excel \(xlsx\))$/i }, reliquats: { plat: 1, txt: /^(simuler|générer les reliquats|rafraîchir)$/i }, suivicontrats: { plat: 1, txt: /^(critères|pdf|excel \(xlsx\))$/i }, detailcontrat: { plat: 1, txt: /^(critères|pdf|excel \(xlsx\))$/i }, typemarche: { plat: 1, txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|importer|imprimer|pdf|excel \(xlsx\))$/i }, passation: { plat: 1, txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|importer|synchroniser avec soft e-procurement|imprimer|pdf|excel \(xlsx\))$/i }, pays: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer|exporter)$/i }, tiers: { add: 1 },
    listing: { add: 1 }, listing2: { add: 1 }, recap: { add: 1 }, soemodel: { add: 1 }, modfisc: { add: 1 }, typetaxe: { add: 1 },
    modecr: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer)$/i }, taxes: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer|exporter)$/i }, racines: { txt: /^(modifier|enregistrer|annuler|imprimer|exporter)$/i }, plans: { txt: /^(modifier|enregistrer|annuler|imprimer|exporter)$/i }, journal: { txt: /^(critères|imprimer|exporter)$/i }, crparam: { txt: /^(ajouter|nouveau modèle|dupliquer|supprimer|modifier|enregistrer|annuler|imprimer|exporter|édition)$/i }, erparam: { txt: /^(ajouter|nouveau modèle|dupliquer|supprimer|modifier|enregistrer|annuler|imprimer|exporter|édition)$/i }, cred: { txt: /^(critères|imprimer|exporter|paramétrage)$/i }, ered: { txt: /^(critères|imprimer|exporter|paramétrage)$/i }, tfted: { txt: /^(critères|imprimer|exporter|paramétrage)$/i }, tftparam: { txt: /^(ajouter|nouveau modèle|dupliquer|supprimer|modifier|enregistrer|annuler|imprimer|exporter|édition)$/i }, biledit: { txt: /^(critères|imprimer|exporter|paramétrage)$/i }, bilparam: { txt: /^(ajouter|nouveau modèle|dupliquer|supprimer|modifier|enregistrer|annuler|imprimer|exporter|édition)$/i }, modfisc2: {},
    caissemodeles: { plat: 1, txt: /^(nouveau modèle|modifier|importer word \/ rtf|exporter en word|exporter en rtf|dupliquer|enregistrer|définir par défaut|supprimer)$/i },
    pvcaisse: { plat: 1, txt: /^(enregistrer|valider le pv|imprimer le pv)$/i },
    listeecritures: { plat: 1, txt: /^(modifier|filtres|imprimer la fiche d’imputation|pdf|excel \(xlsx\))$/i },
    rsfer: { plat: 1, txt: /^(générer|pdf|excel \(xlsx\))$/i }, rsfuf: { plat: 1, txt: /^(critères|pdf|excel \(xlsx\))$/i }, rsfsb: { plat: 1, txt: /^(critères|pdf|excel \(xlsx\))$/i },
    coursapplique: { plat: 1, txt: /^(lancer le contrôle|pdf|excel \(xlsx\))$/i },
    rapprochement: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler)$/i }, situation: { txt: /^(détail.*|fiche( 2)?|exporter)$/i }, pointage: { txt: /^(liste des relevés|proposer automatiquement|générer les écritures|valider le rapprochement)$/i },
    devise: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer|pdf|excel \(xlsx\))$/i }, banques: { plat: 1, txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer|pdf|excel \(xlsx\)|récupération soft e-payment)$/i }, signataires: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer|pdf|excel \(xlsx\))$/i }, modereglement: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer|pdf|excel \(xlsx\))$/i }, lieuaffect: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|import|imprimer|pdf|excel \(xlsx\))$/i }, nettoyages: { plat: 1, txt: /^lancer la purge/i }, jtraces: { plat: 1, txt: /^(réinitialiser|dictionnaire|pdf|pdf avec détails|excel \(xlsx\)|excel \(xlsx\) avec détails)$/i }, cloture: { txt: /^(annuler|enregistrer)$/i }, lettparam: { txt: /^(annuler|enregistrer)$/i }, prelettrage: { plat: 1, txt: /^(tout désélectionner|annuler le prélettrage|prélettrer)$/i }, designer: { plat: 1, txt: /^(retour|enregistrer)$/i }, collabresp: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|import|imprimer|pdf|excel \(xlsx\))$/i }, famimmo: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|import|imprimer|pdf|excel \(xlsx\))$/i }, immolist: { plat: 1, txt: /^(ajouter|modifier|supprimer|importer|enregistrer|annuler|générer écriture|récupérer|calculer les dotations|imprimer|pdf|excel \(xlsx\))$/i },
    etatinv: { plat: 1, txt: /^(filtre|imprimer|pdf|excel \(xlsx\))$/i }, reassign: { plat: 1, txt: /^(nouvelle réassignation|supprimer|enregistrer|annuler|historique|imprimer|pdf|excel \(xlsx\))$/i }, caissegen: { plat: 1, txt: /^proposer schéma comptable$/i }, caissesaisie: { plat: 1, txt: /^(ajouter|fermer le lot|ouvrir le lot|supprimer|ajouter des opérations|imprimer la pièce de caisse|enregistrer|annuler)$/i }, caissetypes: { plat: 1, txt: /^(ajouter|modifier|supprimer|enregistrer|annuler)$/i }, conversion: { plat: 1, txt: /^(historique|réinitialiser|lancer la conversion)$/i }, cours: { plat: 1, txt: /^(ajouter|modifier|supprimer|importer|enregistrer|annuler)$/i }, releves: { plat: 1, txt: /^(ajouter|modifier|supprimer|importer les lignes|importer par ocr|enregistrer|annuler|pointage)$/i }, lettmanuel: { plat: 1, txt: /^(lettrage automatique|tout désélectionner|délettrer|écart de règlement|lettrer)$/i }, clotper: { plat: 1, txt: /^(clôturer la période|annuler la clôture)$/i }, clotmens: { plat: 1, txt: /^(clôturer la période|rouvrir la période)$/i }, anouvanalytique: { plat: 1, txt: /^(saisie manuelle|importer|supprimer les à nouveaux analytiques|pdf|excel \(xlsx\))$/i }, anouveaux: { plat: 1, txt: /^(générer les à nouveaux provisoires|saisie manuelle|importer|supprimer les à nouveaux|pdf|excel \(xlsx\))$/i }, clotannuelle: { plat: 1, txt: /^(clôturer l'exercice)$/i }, traces: { txt: /^(annuler|enregistrer)$/i }, acces: { txt: /^(réinitialiser|enregistrer|nouvel utilisateur|modifier|supprimer|imprimer|pdf|excel \(xlsx\))$/i }, entite: { txt: /^(annuler|enregistrer)$/i },
    menuperso: { txt: /^(enregistrer|annuler|dupliquer|importer|télécharger|supprimer)$/i },
    circparam: { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|imprimer|pdf|excel \(xlsx\))$/i },
    ecritures: { txt: /^(importer des écritures|mod[èe]le d.[ée]criture|facture softdocs|facture ocr|infos libres|annuler|enregistrer la pièce)/i },
    ejcd: { txt: /^(éditer l.état|réinitialiser)/i },
    etatdep: { txt: /^modifier/i }, pad: { txt: /^importer/i },
    balance: { txt: /^(filtre|csv|excel|pdf)$/i }, balaux: { txt: /^(filtre|csv|excel|pdf)$/i }, glg: { txt: /^(filtre|csv|excel|pdf)$/i }, glana: { txt: /^(filtre|csv|excel|pdf)$/i }, detmvt: { txt: /^(filtre|csv|excel|pdf)$/i }, balana: { txt: /^(filtre|csv|excel|pdf)$/i },
    histdem: { txt: /^(filtre|csv|excel|imprimer)$/i }, gavisuivi: { txt: /^(critères|imprimer|exporter)$/i }, gavirapport: { txt: /^(critères|imprimer|exporter)$/i }, gavirecap: { txt: /^(critères|imprimer|exporter)$/i }, gavisynth: { txt: /^(critères|imprimer|exporter|paramétrage)$/i }, gavisynthparam: { txt: /^(ajouter|nouveau modèle|dupliquer|supprimer|modifier|enregistrer|annuler|imprimer|exporter|édition)$/i }, listedit: { txt: /^(critères|filtre|csv|excel|pdf)/i }, recapexec: { txt: /^(critères|filtre|csv|excel|pdf)/i }
  };
  ['pl_comptable', 'pl_activite', 'pl_budget', 'pl_geo', 'pl_financier', 'pl_5', 'pl_6', 'pl_7', 'pl_8', 'pl_9', 'pl_10', 'pl_tiers', 'pl_journaux'].forEach(function (id) { CFG[id] = { txt: /^(ajouter|modifier|supprimer|enregistrer|annuler|importer|imprimer|exporter)$/i }; });
  var RECH = /^(recherch|code ou libell|code, intitul)/i;
  var ORDRE = { nav: 9, ico: -1, imp: -1, sdocs: -2, modele: -3, ocr: 0, filter: 0, export: 1, other: 1, reset: 2, edit: 3, del: 4, cancel: 5, save: 6, run: 7, add: 8 };
  var PRIORITE = ['run', 'save', 'add', 'filter'];
  function nettoyer(t) { return t.trim().replace(/^[^a-zA-ZÀ-ÿ]+/, '').toLowerCase(); }
  function genre(t) {
    t = nettoyer(t);
    if (/^mod[èe]le d.[ée]criture/.test(t)) return 'modele';
    if (/^facture softdocs/.test(t)) return 'sdocs';
    if (/^facture ocr/.test(t)) return 'ocr';
    if (/^importer des écritures/.test(t)) return 'imp';
    if (/^(ajouter|nouv(eau|elle|el))/.test(t)) return 'add';
    if (/^modifier/.test(t)) return 'edit';
    if (/^supprimer/.test(t)) return 'del';
    if (/^enregistrer/.test(t)) return 'save';
    if (/^annuler/.test(t)) return 'cancel';
    if (/^réinitialiser/.test(t)) return 'reset';
    if (/^(filtre|critères|rechercher)/.test(t)) return 'filter';
    if (/^(éditer|exécuter|suivant|valider|consulter|lettrer|prélettrer|convertir|proposer|générer|récupérer|calculer)/.test(t)) return 'run';
    if (/^(csv|excel|pdf|export|import|imprimer|télécharger|historique)/.test(t)) return 'export';
    return 'other';
  }
  // Pictogrammes de la charte (traits Tabler) à la place des symboles / émoticônes de texte
  var ICONES = { imp: 'upload', add: 'plus', edit: 'pencil', del: 'trash', save: 'device-floppy', cancel: 'x', reset: 'refresh', filter: 'adjustments-horizontal', run: 'arrow-right' };
  function contenu(b, g) {
    if (g === 'nav') return b.textContent.trim().replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }) + '<i class="ti ti-arrow-right" aria-hidden="true"></i>';
    if (b.querySelector('i,svg')) return b.innerHTML;
    var t = b.textContent.trim().replace(/^[^a-zA-ZÀ-ÿ0-9]+/, ''), n = nettoyer(t), ic = ICONES[g];
    if (g === 'filter' && /^rechercher/.test(n)) ic = 'search';
    if (/^lettrage automatique/.test(n)) ic = 'sparkles';
    if (/^écart de règlement/.test(n)) ic = 'receipt';
    if (/^générer les écritures/.test(n)) ic = 'wand';
    if (/^lancer le contrôle/.test(n)) ic = 'player-play';
    if (/^ouvrir le lot/.test(n)) ic = 'folder-open';
    if (/^fermer le lot/.test(n)) ic = 'lock';
    if (/^imprimer la fiche/.test(n)) ic = 'printer';
    if (/^filtres$/.test(n)) ic = 'filter';
    if (/^valider le pv/.test(n)) ic = 'circle-check';
    if (/^imprimer le pv/.test(n)) ic = 'printer';
    if (/^imprimer la pièce/.test(n)) ic = 'printer';
    if (/^nouveau modèle/.test(n)) ic = 'file-plus';
    if (/^importer word/.test(n)) ic = 'file-import';
    if (/^exporter en (word|rtf)/.test(n)) ic = 'file-export';
    if (/^dupliquer/.test(n)) ic = 'copy';
    if (/^définir par défaut/.test(n)) ic = 'star';
    if (/^calculer/.test(n)) ic = 'calculator';
    if (/^(liste des relevés|retour)/.test(n)) ic = 'arrow-left';
    if (g === 'export') ic = /^importer par ocr/.test(n) ? 'scan' : /^imprimer/.test(n) ? 'printer' : /^excel/.test(n) ? 'file-spreadsheet' : /^pdf/.test(n) ? 'file-type-pdf' : /^csv/.test(n) ? 'file-text' : /^import/.test(n) ? 'upload' : 'download';
    var esc = t.replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
    return (ic ? '<i class="ti ti-' + ic + '" aria-hidden="true"></i>' : '') + esc;
  }
  function horsPage(b) { return b.closest('td,th,[class*="modal"],[class*="-ov"],[role="dialog"],[role="tablist"],[class*="-tabs"],.ba-bar,.ec-actions'); }
  function vu(e) { return !!(e && !e.hidden && getComputedStyle(e).display !== 'none' && e.getClientRects().length); }

  function hote() {
    var h = document.getElementById('ba-host'); if (h) return h;
    h = document.createElement('div'); h.id = 'ba-host'; h.className = 'ba-host'; h.hidden = true;
    var main = document.querySelector('main.app-layout-main'); if (main && main.parentNode) main.parentNode.insertBefore(h, main); else document.body.appendChild(h);
    return h;
  }
  function viderParents(b, s) {
    var p = b.parentElement;
    for (var i = 0; i < 3 && p && p !== s; i++, p = p.parentElement) {
      var reste = [].slice.call(p.children).some(function (c) { return !c.classList.contains('ba-orig') && !c.classList.contains('ba-cache') && (c.textContent.trim() || c.querySelector('input,select,textarea,table,img')); });
      if (reste || p.querySelector('h1,h2,h3,p,table,input,select,textarea')) return;
      p.classList.add('ba-cache');
    }
  }

  function monter(id) {
    var cfg = CFG[id], s = document.querySelector('[data-screen="' + id + '"]');
    if (!cfg || !s || s.__ba) return;
    var tous = [].slice.call(s.querySelectorAll('button')).filter(function (b) { return b.textContent.trim() && !horsPage(b); });
    var acts = [];
    if (cfg.add) {
      var add = tous.filter(function (b) { return genre(b.textContent) === 'add'; })[0]; if (!add) return;
      var src = add.closest('.no-print') || add.parentElement;
      acts = [].slice.call(src.querySelectorAll('button')).filter(function (b) { return b.textContent.trim() && !horsPage(b); });
    } else if (cfg.txt) {
      acts = [].slice.call(s.querySelectorAll('button,[data-el-open],label.cursor-pointer')).filter(function (b) { return cfg.txt.test(b.textContent.trim().replace(/^[^a-zA-ZÀ-ÿ]+/, '')) && !horsPage(b); });
    }
    // Boutons d'une sous-section d'un onglet de saisie (ex. lignes de billetage) : relayés en icônes seules dans la barre
    [].slice.call(s.querySelectorAll('[data-ba-ico]')).forEach(function (b) { if (acts.indexOf(b) < 0) acts.push(b); });
    s.__ba = true;

    var bar = document.createElement('div'); bar.className = 'ba-bar'; bar.setAttribute('role', 'toolbar'); bar.setAttribute('aria-label', 'Actions de la page'); bar.setAttribute('data-ba', id); bar.hidden = true;
    var left = document.createElement('div'); left.className = 'ba-left'; left.hidden = true;
    var right = document.createElement('div'); right.className = 'ba-right';
    bar.appendChild(left); bar.appendChild(right);
    var ig = document.createElement('div'); ig.className = 'ba-ig'; ig.style.order = -1; ig.hidden = true; ig.setAttribute('role', 'group'); ig.setAttribute('aria-label', 'Actions de la sous-section'); right.appendChild(ig);

    // Recherche relayée vers le champ d'origine (retrouvé à chaque fois : les états le recréent à chaque édition)
    function champ() {
      return [].slice.call(s.querySelectorAll('input')).filter(function (i) { return RECH.test(i.getAttribute('placeholder') || '') && !i.closest('td,th,tr,[class*="modal"],[role="dialog"],.ba-bar,.custom-select-dropdown,.cb-pan') && i.getClientRects().length; })[0];
    }
    var ps = document.createElement('input'); ps.type = 'search'; ps.setAttribute('autocomplete', 'off');
    var ic = document.createElement('i'); ic.className = 'ti ti-search'; ic.setAttribute('aria-hidden', 'true');
    left.appendChild(ic); left.appendChild(ps);
    ps.addEventListener('input', function () { var c = champ(); if (!c) return; c.value = ps.value; c.dispatchEvent(new Event('input', { bubbles: true })); c.dispatchEvent(new Event('keyup', { bubbles: true })); });

    // Miroirs des boutons
    var miroirs = acts.map(function (b) {
      var p = document.createElement('button'); p.type = 'button'; var g = b.hasAttribute('data-ba-ico') ? 'ico' : b.hasAttribute('data-bil-vers') || b.hasAttribute('data-ba-nav') ? 'nav' : genre(b.textContent);
      p.className = 'ba-btn ba-' + g; p.style.order = ORDRE[g];
      p.addEventListener('click', function () { if (b.dataset.bilVers) { location.hash = '#' + b.dataset.bilVers; return; } if (!b.disabled) b.click(); });
      b.classList.add('ba-orig'); viderParents(b, s);
      return { b: b, p: p, g: g };
    });
    // Un seul bouton « Exporter » (menu Excel / CSV / PDF, nombre de lignes exportées) à la place des boutons de format
    var fmts = miroirs.filter(function (m) { return m.g === 'export' && /^(csv|excel|pdf)/.test(nettoyer(m.b.textContent)); }), expoW = null;
    if (fmts.length) {
      var TYPES = { excel: ['file-spreadsheet', 'Excel (.xlsx)', 'Filtres et tri appliqués', 0], csv: ['file-text', 'CSV (.csv)', 'Séparateur point-virgule, UTF-8', 1], pdf: ['file-type-pdf', 'PDF (.pdf)', 'Mise en page d’édition A4', 2] };
      expoW = document.createElement('div'); expoW.className = 'ba-plus ba-exp'; expoW.style.order = 1;
      var eb = document.createElement('button'); eb.type = 'button'; eb.className = 'ba-btn ba-export'; eb.setAttribute('aria-haspopup', 'true'); eb.innerHTML = '<i class="ti ti-download" aria-hidden="true"></i>Exporter<i class="ti ti-chevron-down" aria-hidden="true"></i>';
      var em = document.createElement('div'); em.className = 'ba-menu ba-expm'; em.hidden = true;
      fmts.forEach(function (m) {
        var t = nettoyer(m.b.textContent), k = /^excel/.test(t) ? 'excel' : /^csv/.test(t) ? 'csv' : 'pdf', T = TYPES[k], det = /détails/.test(t), it = document.createElement('button'); it.type = 'button'; it.className = 'sc-it'; it.style.order = T[3] * 2 + (det ? 1 : 0);
        it.innerHTML = '<i class="ti ti-' + T[0] + '" aria-hidden="true"></i><span><b>' + T[1].replace(' (', det ? ' avec détails (' : ' (') + '</b><small>' + T[2] + '</small></span>';
        it.addEventListener('click', function (e) { e.stopPropagation(); em.hidden = true; var n = nbLignes(); var xl = k === 'excel' && !det && fmts.some(function (x) { return /^csv/.test(nettoyer(x.b.textContent)); }) && window.SC_EXPORT && window.SC_EXPORT.xlsxTable, go = function () { if (xl) window.SC_EXPORT.xlsxTable(s); else if (!m.b.disabled) m.b.click(); }; if (window.SC_EXPORT) window.SC_EXPORT.lancer(n, go); else go(); });
        m.g = 'fmt'; m.item = it; em.appendChild(it);
      });
      var pied = document.createElement('div'); pied.className = 'sc-pied'; em.appendChild(pied); pied.style.order = 99;
      function nbLignes() {
        var n = 0; [].slice.call(s.querySelectorAll('table')).forEach(function (t) { if (!t.offsetParent) return; [].slice.call(t.tBodies).forEach(function (tb) { [].slice.call(tb.rows).forEach(function (r) { if (r.hidden || r.offsetParent === null || r.cells.length < 3 || /(^|\s)(t|tg|g|tr-grp|sc-sk|plus|filter-row|flt|gl-tot|gl-mois|gl-grp|row-total|row-sous-total)(\s|$)/.test(r.className) || r.querySelector('.sc-vide,.empty-state')) return; n++; }); }); }); return n;
      }
      eb.addEventListener('click', function (e) { e.stopPropagation(); em.hidden = !em.hidden; if (!em.hidden) { var n = nbLignes(); pied.textContent = n ? n.toLocaleString('fr-FR') + ' ligne' + (n > 1 ? 's' : '') + ' seront exportées' + (n > 5000 ? ' (en arrière-plan)' : '') : 'Aucune ligne à exporter'; pied.hidden = false; } });
      document.addEventListener('click', function () { em.hidden = true; });
      expoW.appendChild(eb); expoW.appendChild(em); right.appendChild(expoW);
    }
    var plusieurs = miroirs.filter(function (m) { return m.g === 'other' || m.g === 'export'; });
    var menu = null;
    var libellesUniques = {}; plusieurs.forEach(function (m) { libellesUniques[nettoyer(m.b.textContent)] = 1; });   // un même bouton répété dans plusieurs onglets ne compte qu'une fois
    if (Object.keys(libellesUniques).length > 3 && !cfg.plat) {
      var plus = document.createElement('div'); plus.className = 'ba-plus'; plus.style.order = 1;
      var bp = document.createElement('button'); bp.type = 'button'; bp.className = 'ba-btn ba-more'; bp.setAttribute('aria-haspopup', 'true'); bp.innerHTML = '<i class="ti ti-dots"></i>Plus d\'actions';
      menu = document.createElement('div'); menu.className = 'ba-menu'; menu.hidden = true;
      bp.addEventListener('click', function (e) { e.stopPropagation(); menu.hidden = !menu.hidden; });
      document.addEventListener('click', function () { menu.hidden = true; });
      plus.appendChild(bp); plus.appendChild(menu); right.appendChild(plus);
    }
    miroirs.forEach(function (m) { if (m.g === 'fmt') return; (m.g === 'ico' ? ig : menu && (m.g === 'other' || m.g === 'export') ? menu : right).appendChild(m.p); });

    bar.__sync = function () {
      var c = champ();
      if (c) { var bx = c.parentElement; if (bx && bx !== s && bx.children.length <= 3 && !bx.querySelector('button')) { bx.classList.add('ba-cache'); var bp2 = bx.parentElement; if (bp2 && bp2 !== s && !bp2.querySelector('button,select,table,h1,h2') && [].slice.call(bp2.children).every(function (x) { return x.classList.contains('ba-cache'); })) bp2.classList.add('ba-cache'); } else c.classList.add('ba-cache'); }
      left.hidden = !c;
      if (c) { var ph = c.getAttribute('placeholder') || 'Rechercher'; if (ps.placeholder !== ph) { ps.placeholder = ph; ps.setAttribute('aria-label', ph); } if (document.activeElement !== ps && ps.value !== c.value) ps.value = c.value; }
      var visibles = 0;
      miroirs.forEach(function (m) {
        var h = !vu(m.b);
        m.p.hidden = h; m.p.disabled = !!m.b.disabled || m.b.getAttribute('aria-disabled') === 'true';
        if (!h) visibles++;
        var html = contenu(m.b, m.g); if (m.p.__h !== html) { m.p.innerHTML = html; m.p.__h = html; }
        if (m.b.title) m.p.title = m.b.title;
        if (m.g === 'ico') m.p.setAttribute('aria-label', m.b.getAttribute('aria-label') || m.b.title || '');
        m.p.classList.remove('pri');
      });
      if (expoW) { fmts.forEach(function (m) { m.item.hidden = m.p.hidden; m.item.disabled = m.p.disabled; }); expoW.hidden = fmts.every(function (m) { return m.p.hidden; }); }
      ig.hidden = !miroirs.some(function (m) { return m.g === 'ico' && !m.p.hidden; });
      var choisi = null;
      PRIORITE.some(function (g) { var m = miroirs.filter(function (x) { return x.g === g && !x.p.hidden && !x.p.disabled; })[0]; if (m) { choisi = m; return true; } });
      if (choisi) choisi.p.classList.add('pri');
      bar.__actif = !!(visibles || c);
    };
    bar.__sync();
    hote().appendChild(bar);
  }

  function tout() {
    Object.keys(CFG).forEach(monter);
    var h = document.getElementById('ba-host'); if (!h) return; var any = false;
    [].slice.call(h.children).forEach(function (b) {
      var s = document.querySelector('[data-screen="' + b.getAttribute('data-ba') + '"]'); var v = !!(s && s.offsetWidth);
      if (v && b.__sync) b.__sync();
      b.hidden = !(v && b.__actif); if (!b.hidden) any = true;
    });
    h.hidden = !any;
  }
  window.addEventListener('hashchange', function () { setTimeout(tout, 120); setTimeout(tout, 500); });
  setTimeout(tout, 700);
  setInterval(tout, 300);
})();
