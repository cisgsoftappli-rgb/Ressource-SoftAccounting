/* Barre de propriétés commune à tous les concepteurs d'état (Concepteur SOE, Designer de déclaration, Designer listing).
   Même présentation partout : titre « Propriétés », sous-titre « Élément — type (nom) » ou « Document », onglets selon le type d'élément :
     Texte   : Contenu | Mise en forme | Position
     Image   : Source | Dimensionnement | Position   (source : image prédéfinie ou fichier de l'ordinateur ; ajustement : contenir / couvrir / étirer ; proportions)
     Ligne   : Mise en forme | Position
     Tableau : Contenu | Mise en forme | Position
     Document : propriétés du document (affichées seulement après un clic direct sur la feuille).
   Chaque concepteur fournit une fonction « spec » (état courant) et reçoit les modifications par onKey(clé, valeur, élément, type d'événement, nom de fichier) et onAct(nom).
   Spec : { title, sub, tabs: [ { id, label, fields: [ champ ] } ], foot }  —  champ : { k, t, l, v, opts, half, rows, min, max, dis, name, html }
   Types de champ : text, textarea, number, color, select, check, file (import d'une image de l'ordinateur), note, raw.
   Ne pas nommer de fonction « $$ » (build.cjs). */
(function () {
  var css = '.pp{display:block;color:#353944;font-size:12px}.pp-h{margin:0;font:600 15px var(--font-heading);color:#0B1332}.pp-sub{margin:4px 0 10px;font-size:12px;color:#5B606D}' +
    '.pp-tabs{display:flex;gap:4px;margin:0 0 12px;border-bottom:1px solid #E9EBF0;flex-wrap:wrap}.pp-tabs button{height:32px;padding:0 10px;border:0;border-bottom:2px solid transparent;background:none;font:600 12px var(--font-sans);color:#5B606D;cursor:pointer;min-height:0!important}' +
    '.pp-tabs button:hover{color:#2E427B}.pp-tabs button.on{color:#2E427B;border-bottom-color:#2E427B}' +
    '.pp-b{display:grid;gap:10px}.pp-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.pp-f{display:flex;flex-direction:column;gap:4px;min-width:0}' +
    '.pp-lab{font-size:12px;font-weight:600;color:#474C58}.pp-in{width:100%;box-sizing:border-box;border:1px solid #878D9A;border-radius:8px;background:#fff;color:#353944;font:inherit;font-size:12px;padding:0 10px;height:34px}' +
    'textarea.pp-in{height:auto;padding:8px 10px;resize:vertical}input[type=color].pp-in{padding:2px}.pp-in:focus-visible,.pp-btn:focus-visible{outline:3px solid #2E427B;outline-offset:2px}.pp-in:disabled{background:#F5F7F9;color:#747A88;cursor:not-allowed}' +
    '.pp-chk{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#353944;cursor:pointer}.pp-chk input{width:16px;height:16px;accent-color:#2E427B;margin:0}.pp-chks{display:flex;flex-wrap:wrap;gap:8px 16px}' +
    '.pp-file{display:flex;align-items:center;gap:8px;min-width:0}.pp-fn{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#5B606D;font-size:12px}' +
    '.pp-btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;height:34px;padding:0 12px;border:1px solid #D6D9E0;border-radius:8px;background:#fff;color:#474C58;font:700 12px var(--font-sans);cursor:pointer;white-space:nowrap}.pp-btn:hover{background:#E9EBF0}.pp-btn.dng{border-color:#E6B8B8;color:#B63132}' +
    '.pp-dl{margin:0;display:grid;gap:2px}.pp-dl>div{display:grid;grid-template-columns:96px minmax(0,1fr);gap:8px;padding:5px 0;border-bottom:1px solid #F1F2F5}.pp-dl dt{font-weight:600;color:#474C58}.pp-dl dd{margin:0;color:#353944;word-break:break-word}' +
    '.pp-note{margin:0;font-size:12px;color:#5B606D}.pp-foot{display:flex;justify-content:flex-end;gap:8px;margin-top:12px}.pp-vide{margin:0;font-size:13px;color:#5B606D}.pp-prev{max-width:100%;max-height:90px;border:1px solid #E9EBF0;border-radius:6px;background:#F5F7F9;object-fit:contain}';
  var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function at(s) { return esc(s).replace(/"/g, '&quot;'); }
  function champ(F, A) {
    var a = A + '="' + at(F.k) + '"', v = F.v == null ? '' : F.v, dis = F.dis ? ' disabled' : '', l = F.l ? '<label class="pp-lab">' + esc(F.l) + '</label>' : '';
    switch (F.t) {
      case 'textarea': return l + '<textarea class="pp-in" rows="' + (F.rows || 3) + '" ' + a + dis + '>' + esc(v) + '</textarea>';
      case 'number': return l + '<input class="pp-in" type="number" ' + a + (F.min != null ? ' min="' + F.min + '"' : '') + (F.max != null ? ' max="' + F.max + '"' : '') + ' value="' + at(v) + '"' + dis + '>';
      case 'color': return l + '<input class="pp-in" type="color" ' + a + ' value="' + at(v || '#000000') + '"' + dis + '>';
      case 'select': return l + '<select class="pp-in" ' + a + dis + '>' + (F.opts || []).map(function (o) { return '<option value="' + at(o[0]) + '"' + (String(o[0]) === String(v) ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
      case 'check': return '<label class="pp-chk"><input type="checkbox" ' + a + (v ? ' checked' : '') + dis + '> ' + esc(F.l) + '</label>';
      case 'file': return l + '<div class="pp-file"><button type="button" class="pp-btn" data-pp-pick>Parcourir…</button><span class="pp-fn">' + esc(F.name || 'Aucun fichier choisi') + '</span><input type="file" accept="image/*" hidden data-pp-file="' + at(F.k) + '"></div>' + (F.prev ? '<img class="pp-prev" alt="Aperçu de l’image" src="' + at(F.prev) + '">' : '');
      case 'note': return '<p class="pp-note">' + esc(v) + '</p>';
      case 'raw': return F.html || '';
      default: return l + '<input class="pp-in" type="text" ' + a + ' value="' + at(v) + '"' + dis + '>';
    }
  }
  function corps(fields, A) {
    var out = '', i = 0;
    while (i < fields.length) {
      var F = fields[i];
      if (F.half && fields[i + 1] && fields[i + 1].half) { out += '<div class="pp-g2"><div class="pp-f">' + champ(F, A) + '</div><div class="pp-f">' + champ(fields[i + 1], A) + '</div></div>'; i += 2; continue; }
      if (F.chk) { var g = ''; while (i < fields.length && fields[i].chk) { g += champ(fields[i], A); i++; } out += '<div class="pp-chks">' + g + '</div>'; continue; }
      out += F.t === 'raw' ? champ(F, A) : '<div class="pp-f">' + champ(F, A) + '</div>'; i++;
    }
    return out;
  }
  function html(sp, A, tab) {
    if (!sp) return '';
    var tabs = sp.tabs || [], cur = tabs.filter(function (t) { return t.id === tab; })[0] || tabs[0] || { fields: [] };
    return '<div class="pp"><h3 class="pp-h">' + esc(sp.title || 'Propriétés') + '</h3><p class="pp-sub">' + esc(sp.sub || '') + '</p>' +
      (tabs.length > 1 ? '<div class="pp-tabs" role="tablist">' + tabs.map(function (t) { return '<button type="button" role="tab" data-pp-tab="' + at(t.id) + '"' + (t === cur ? ' class="on" aria-selected="true"' : '') + '>' + esc(t.label) + '</button>'; }).join('') + '</div>' : '') +
      '<div class="pp-b">' + corps(cur.fields || [], A) + '</div>' + (sp.foot || '') + '</div>';
  }

  /* monte la barre dans « host » : specFn() décrit l'état courant (ou null pour une barre vide) */
  function mount(host, specFn, A, onKey, onAct) {
    var etat = { tab: null, id: null };
    function rendre() {
      var sp = specFn(), ae = document.activeElement, cle = ae && host.contains(ae) ? ae.getAttribute(A) : null, pos = null;
      if (cle && ae.selectionStart != null) pos = ae.selectionStart;
      if (!sp) { host.innerHTML = '<div class="pp"><h3 class="pp-h">Propriétés</h3><p class="pp-sub">Cliquez sur un élément pour le modifier, ou directement sur la feuille pour régler le document.</p></div>'; return; }
      var ids = (sp.tabs || []).map(function (t) { return t.id; });
      if (sp.key !== etat.id) { etat.id = sp.key; if (ids.indexOf(etat.tab) < 0) etat.tab = ids[0]; }
      if (ids.indexOf(etat.tab) < 0) etat.tab = ids[0];
      host.innerHTML = html(sp, A, etat.tab);
      if (cle) { var n = host.querySelector('[' + A + '="' + cle + '"]'); if (n) { n.focus(); if (pos != null && n.setSelectionRange) try { n.setSelectionRange(pos, pos); } catch (e) {} } }
    }
    function val(el) { return el.type === 'checkbox' ? el.checked : el.value; }
    host.addEventListener('input', function (e) { var el = e.target.closest('[' + A + ']'); if (!el || el.type === 'checkbox' || el.tagName === 'SELECT' || el.type === 'file') return; onKey(el.getAttribute(A), val(el), el, 'input'); });
    host.addEventListener('change', function (e) {
      var f = e.target.closest('[data-pp-file]');
      if (f) { var fi = f.files && f.files[0]; if (!fi) return; var r = new FileReader(); r.onload = function () { onKey(f.getAttribute('data-pp-file'), r.result, f, 'file', fi.name); }; r.readAsDataURL(fi); return; }
      var el = e.target.closest('[' + A + ']'); if (!el) return; onKey(el.getAttribute(A), val(el), el, 'change');
    });
    host.addEventListener('click', function (e) {
      var tb = e.target.closest('[data-pp-tab]'); if (tb) { etat.tab = tb.getAttribute('data-pp-tab'); rendre(); return; }
      var pk = e.target.closest('[data-pp-pick]'); if (pk) { var fi = host.querySelector('[data-pp-file]'); if (fi) fi.click(); return; }
      var ac = e.target.closest('[data-pp-act]'); if (ac && onAct) onAct(ac.getAttribute('data-pp-act'), ac);
    });
    rendre();
    return { render: rendre };
  }

  /* groupes de champs communs (clés canoniques : content, name, x, y, w, h, ff, fs, color, bold, italic, under, align, valign, src, srcNom, fit, ratio) */
  var FF = [['', 'Par défaut'], ['Arial,sans-serif', 'Arial'], ['Calibri,sans-serif', 'Calibri'], ['Verdana,sans-serif', 'Verdana'], ["'Times New Roman',serif", 'Times New Roman'], ["'Courier New',monospace", 'Courier New']];
  var G = {
    position: function (v, o) { o = o || {}; var f = [{ k: 'x', t: 'number', l: 'X', v: v.x, half: 1, min: 0 }, { k: 'y', t: 'number', l: 'Y', v: v.y, half: 1, min: 0 }]; if (!o.sansTaille) f.push({ k: 'w', t: 'number', l: 'Largeur', v: v.w, half: 1, min: 1 }, { k: 'h', t: 'number', l: 'Hauteur', v: v.h, half: 1, min: 1 }); return f; },
    police: function (v, o) { o = o || {}; var f = []; if (!o.sansPolice) f.push({ k: 'ff', t: 'select', l: 'Police', v: v.ff || '', opts: FF }); f.push({ k: 'fs', t: 'number', l: 'Taille (px)', v: v.fs, half: 1, min: 6, max: 60 }, { k: 'color', t: 'color', l: 'Couleur', v: v.color, half: 1 });
      f.push({ k: 'bold', t: 'check', l: 'Gras', v: v.bold, chk: 1 }, { k: 'italic', t: 'check', l: 'Italique', v: v.italic, chk: 1 }, { k: 'under', t: 'check', l: 'Souligné', v: v.under, chk: 1 });
      f.push({ k: 'align', t: 'select', l: 'Alignement', v: v.align || 'left', half: 1, opts: [['left', 'Gauche'], ['center', 'Centré'], ['right', 'Droite']] }, { k: 'valign', t: 'select', l: 'Vertical', v: v.valign || 'flex-start', half: 1, opts: [['flex-start', 'Haut'], ['center', 'Milieu'], ['flex-end', 'Bas']] }); return f; },
    source: function (v, presets) { var o = [['', 'Fichier de l’ordinateur']].concat(presets || []); return [{ k: 'src', t: 'select', l: 'Image', v: v.preset || '', opts: o }, { k: 'srcfile', t: 'file', l: 'Importer depuis l’ordinateur', name: v.srcNom, prev: v.apercu }]; },
    dimension: function (v) { return [{ k: 'w', t: 'number', l: 'Largeur', v: v.w, half: 1, min: 1 }, { k: 'h', t: 'number', l: 'Hauteur', v: v.h, half: 1, min: 1 }, { k: 'fit', t: 'select', l: 'Ajustement de l’image', v: v.fit || 'contain', opts: [['contain', 'Ajuster (proportions conservées)'], ['cover', 'Remplir (rognage)'], ['fill', 'Étirer']] }, { k: 'ratio', t: 'check', l: 'Conserver les proportions au redimensionnement', v: v.ratio }]; },
    document: function (v) { return [{ k: 'format', t: 'select', l: 'Format', v: v.format, opts: [['A4', 'A4'], ['A3', 'A3'], ['Lettre', 'Lettre']] }, { k: 'orient', t: 'select', l: 'Orientation', v: v.orient, opts: [['Portrait', 'Portrait'], ['Paysage', 'Paysage']] },
      { k: 'mt', t: 'number', l: 'Marge haut (px)', v: v.mt, half: 1, min: 0 }, { k: 'mb', t: 'number', l: 'Marge bas (px)', v: v.mb, half: 1, min: 0 }, { k: 'ml', t: 'number', l: 'Marge gauche (px)', v: v.ml, half: 1, min: 0 }, { k: 'mr', t: 'number', l: 'Marge droite (px)', v: v.mr, half: 1, min: 0 }]; }
  };
  window.PP = { mount: mount, html: html, G: G, FF: FF };
})();
