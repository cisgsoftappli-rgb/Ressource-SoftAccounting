<!--
  Écran « __NOM__ » (Gestion des contrats › Paramétrages › __NOM__) — onglets Saisie / Liste : liste filtrable (Code, Libellé, Utilisation, Statut),
  saisie (Code *, Libellé *, case « Actif »). Boutons dans la barre d'actions (Ajouter, Modifier, Supprimer, Enregistrer, Annuler, Importer, Imprimer, PDF, Excel).
  Généré par gen_types.cjs (modèle types_modele.tpl) : ne pas modifier à la main. Données en mémoire ; « Utilisation » = « – » (aucun contrat dans la maquette).
  S'appuie sur les styles bp-* de l'écran « Paramétrage du bilan ». Ne pas nommer de fonction « $$ » (build.cjs).
-->
<style>
.__K__-code{font-family:ui-monospace,Consolas,monospace;font-weight:600}
.__K__-help{font-size:12px;color:#5B606D}
.__K__-er{display:none;font-size:12px;color:#B63132}.__K__-er.show{display:block}
.bp-in.err,.bp-sel.err{border-color:#B63132}
.__K__-badge{display:inline-flex;align-items:center;padding:2px 10px;border:1px solid;border-radius:6px;font-size:12px;font-weight:600}.__K__-badge.on{background:#ECFDF5;border-color:#A7F3D0;color:#047857}.__K__-badge.off{background:#F5F7F9;border-color:#D6D9E0;color:#5B606D}
</style>

<div class="bp-root" data-__K__>
  <h1 style="position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);margin:0">__NOM__</h1>

  <div class="no-print" data-__K__-actions>
    <button type="button" data-__K__-ajouter>Ajouter</button>
    <button type="button" data-__K__-modifier>Modifier</button>
    <button type="button" data-__K__-supprimer>Supprimer</button>
    <button type="button" data-__K__-enregistrer>Enregistrer</button>
    <button type="button" data-__K__-annuler>Annuler</button>
    <button type="button" data-__K__-importer>Importer</button>
    <button type="button" data-__K__-imprimer>Imprimer</button>
    <button type="button" data-__K__-pdf>PDF</button>
    <button type="button" data-__K__-xlsx>Excel (XLSX)</button>
  </div>
  <input type="file" accept=".csv,.txt" data-__K__-fichier style="display:none">

  <div class="bp-tabs" role="tablist">
    <button type="button" role="tab" class="on" data-__K__-tab="saisie">Saisie</button>
    <button type="button" role="tab" data-__K__-tab="liste">Liste <span class="bp-n" data-__K__-compte></span></button>
  </div>

  <div class="bp-grid">
    <section class="bp-pan" aria-label="Liste des __LCPL__" data-__K__-pan="liste" hidden>
      <h2>__PL__ <small>Double-clic ou « Modifier » pour ouvrir la ligne en saisie</small></h2>
      <div style="overflow:auto;max-height:560px">
        <table class="bp-tb" style="min-width:640px"><thead>
          <tr><th>Code</th><th>Libellé</th><th>Utilisation</th><th>Statut</th></tr>
          <tr class="flt"><th><input class="bp-in" data-fc="0" aria-label="Filtrer Code"></th><th><input class="bp-in" data-fc="1" aria-label="Filtrer Libellé"></th><th></th>
            <th><select class="bp-sel" data-fc="3" aria-label="Filtrer Statut"><option value=""></option><option value="actif">Actif</option><option value="inactif">Inactif</option></select></th></tr>
        </thead><tbody data-__K__-lignes></tbody></table>
      </div>
      <div class="bp-vide" data-__K__-vide hidden>Aucun __LCNOM__ : utilisez « Ajouter ».</div>
    </section>

    <section class="bp-pan" aria-label="Saisie d'un __LCNOM__" data-__K__-pan="saisie">
      <form class="bp-form" data-__K__-form onsubmit="return false" novalidate>
        <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
          <label class="bp-champ"><span>Code <b>*</b></span><input class="bp-in" data-f="code" maxlength="50" autocomplete="off" placeholder="__PHC__"><span class="__K__-help">Unique, enregistré en majuscules. Non modifiable après création.</span><span class="__K__-er" data-er="code"></span></label>
          <label class="bp-champ"><span>Libellé <b>*</b></span><input class="bp-in" data-f="lib" maxlength="150" autocomplete="off" placeholder="__PHL__"><span class="__K__-er" data-er="lib"></span></label>
          <div class="bp-chk" style="align-self:end"><label><input type="checkbox" data-f="actif" checked>Actif</label><span class="__K__-help" style="display:block">Un __LCNOM__ inactif n'est plus proposé dans les contrats.</span></div>
        </div>
      </form>
    </section>
  </div>
  <div class="bp-toast" role="status" hidden data-__K__-toast></div>
</div>

<script>
(function () {
  var root = document.querySelector('[data-__K__]'); if (!root) return;
  function q(s) { return root.querySelector(s); } function qa(s) { return [].slice.call(root.querySelectorAll(s)); }
  var data = window.__GLOBAL__ = window.__GLOBAL__ || __DATA__.map(function (r) { return { code: r[0], lib: r[1], actif: true, usage: 0 }; });
  var sel = -1, mode = 'consultation', NOM = '__NOM__', LC = '__LCNOM__', FICHIER = '__FILE__';
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(m) { var t = q('[data-__K__-toast]'); t.textContent = m; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(function () { t.hidden = true; }, 2500); }
  function err(k, m) { var e = q('[data-er="' + k + '"]'); e.textContent = m || ''; e.classList.toggle('show', !!m); }
  function filtrer() {
    var F = []; qa('[data-fc]').forEach(function (e) { F[+e.dataset.fc] = e.value.trim().toLowerCase(); });
    qa('[data-__K__-lignes] tr').forEach(function (tr) { tr.hidden = F.some(function (v, k) { if (!v) return false; var t = tr.children[k].textContent.trim().toLowerCase(); return k === 3 ? t !== v : t.indexOf(v) < 0; }); });
  }
  qa('[data-fc]').forEach(function (e) { e.addEventListener('input', filtrer); e.addEventListener('change', filtrer); });
  function liste() {
    q('[data-__K__-compte]').textContent = data.length ? data.length + (data.length > 1 ? ' lignes' : ' ligne') : '';
    q('[data-__K__-vide]').hidden = data.length > 0;
    q('[data-__K__-lignes]').innerHTML = data.map(function (s, i) {
      return '<tr data-i="' + i + '"' + (i === sel ? ' class="sel"' : '') + '><td><span class="__K__-code">' + esc(s.code) + '</span></td><td>' + esc(s.lib) + '</td><td>' + (s.usage ? s.usage + ' contrat(s)' : '–') + '</td><td class="c"><span class="__K__-badge ' + (s.actif ? 'on' : 'off') + '">' + (s.actif ? 'Actif' : 'Inactif') + '</span></td></tr>';
    }).join(''); filtrer();
  }
  function form(s) {
    s = s || { code: '', lib: '', actif: true };
    q('[data-f=code]').value = s.code; q('[data-f=lib]').value = s.lib; q('[data-f=actif]').checked = s.actif !== false;
    ['code', 'lib'].forEach(function (k) { err(k); q('[data-f=' + k + ']').classList.remove('err'); });
  }
  function etat() {
    var ed = mode !== 'consultation';
    qa('[data-__K__-form] input').forEach(function (e) { e.disabled = !ed; });
    q('[data-f=code]').disabled = mode !== 'creation';
    var a = q('[data-__K__-actions]');
    a.querySelector('[data-__K__-ajouter]').disabled = ed; a.querySelector('[data-__K__-importer]').disabled = ed;
    a.querySelector('[data-__K__-modifier]').disabled = ed || sel < 0; a.querySelector('[data-__K__-supprimer]').disabled = ed || sel < 0;
    a.querySelector('[data-__K__-enregistrer]').disabled = !ed; a.querySelector('[data-__K__-annuler]').disabled = !ed;
    ['imprimer', 'pdf', 'xlsx'].forEach(function (k) { a.querySelector('[data-__K__-' + k + ']').disabled = !data.length; });
  }
  function onglet(n) { qa('[data-__K__-pan]').forEach(function (p) { p.hidden = p.dataset.__KC__Pan !== n; }); qa('[data-__K__-tab]').forEach(function (t) { var on = t.dataset.__KC__Tab === n; t.classList.toggle('on', on); t.setAttribute('aria-selected', on); }); }
  function choisir(i) { if (mode !== 'consultation') return; sel = i; liste(); form(data[i]); etat(); }
  qa('[data-__K__-tab]').forEach(function (t) { t.addEventListener('click', function () { onglet(t.dataset.__KC__Tab); }); });
  var tb = q('[data-__K__-lignes]');
  tb.addEventListener('click', function (e) { var tr = e.target.closest('tr[data-i]'); if (tr) choisir(+tr.dataset.i); });
  tb.addEventListener('dblclick', function (e) { var tr = e.target.closest('tr[data-i]'); if (tr) { choisir(+tr.dataset.i); onglet('saisie'); } });
  q('[data-f=code]').addEventListener('input', function () { var p = this.selectionStart; this.value = this.value.toUpperCase(); try { this.setSelectionRange(p, p); } catch (x) {} });
  function enregistrer() {
    var code = q('[data-f=code]').value.trim().toUpperCase(), lib = q('[data-f=lib]').value.trim(), ok = true, ancien = mode === 'edition' ? data[sel].code : null;
    ['code', 'lib'].forEach(function (k) { err(k); q('[data-f=' + k + ']').classList.remove('err'); });
    function ko(k, m) { err(k, m); q('[data-f=' + k + ']').classList.add('err'); ok = false; }
    if (!code) ko('code', 'Le code est obligatoire.'); else if (data.some(function (x) { return x.code === code && x.code !== ancien; })) ko('code', 'Ce code existe déjà.');
    if (!lib) ko('lib', 'Le libellé est obligatoire.');
    if (!ok) return;
    var rec = { code: code, lib: lib, actif: q('[data-f=actif]').checked, usage: mode === 'edition' ? data[sel].usage : 0 };
    if (mode === 'creation') { data.push(rec); sel = data.length - 1; } else data[sel] = rec;
    mode = 'consultation'; liste(); form(data[sel]); etat(); onglet('liste'); toast(ancien ? '__MODIF__' : '__CREE__');
  }
  function table() { var L = data.filter(function (s, i) { var tr = tb.children[i]; return !tr || !tr.hidden; }); return { tete: ['Code', 'Libellé', 'Utilisation', 'Statut'], lignes: L.map(function (s) { return [s.code, s.lib, s.usage ? s.usage + ' contrat(s)' : '–', s.actif ? 'Actif' : 'Inactif']; }) }; }
  function exporter(k) {
    var X = window.EXPORT_TABLEAU, t = table(); if (!X) { toast('Module d’export indisponible.'); return; } if (!t.lignes.length) { toast('Rien à exporter.'); return; }
    if (k === 'pdf') X.pdf(FICHIER + '.pdf', NOM, t.lignes.length + ' ligne(s)', t.tete, t.lignes); else X.xlsx(FICHIER + '.xlsx', NOM, t.tete, t.lignes);
    toast('Export ' + (k === 'pdf' ? 'PDF' : 'Excel (XLSX)') + ' généré : ' + t.lignes.length + ' ligne(s).');
  }
  function imprimer() {
    var t = table(), w = window.open('', '_blank'); if (!w) { toast('Autorisez les fenêtres pop-up pour imprimer.'); return; }
    w.document.write('<!doctype html><meta charset="utf-8"><title>' + esc(NOM) + '</title><style>body{font:13px system-ui,sans-serif;color:#0B1332;margin:24px}h1{font-size:18px}table{border-collapse:collapse;width:100%}th{background:#2E427B;color:#fff;text-align:left;padding:8px 10px;font-size:11px;text-transform:uppercase;-webkit-print-color-adjust:exact;print-color-adjust:exact}td{padding:8px 10px;border-bottom:1px solid #D6D9E0}</style><h1>' + esc(NOM) + '</h1><table><thead><tr>' +
      t.tete.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' + t.lignes.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>');
    w.document.close(); w.focus(); setTimeout(function () { w.print(); }, 300);
  }
  // importation Excel / CSV : colonnes Code, Libellé, Statut
  function importerFichier(f) {
    window.IMPORT_ASSISTANT.lireFichier(f).then(function (rows) {
      var sans = function (t) { return String(t == null ? '' : t).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, ''); };
      var ent = (rows[0] || []).map(sans), iC = ent.indexOf('code'), iL = ent.indexOf('libelle'), iS = ent.indexOf('statut'), debut = 1;
      if (iC < 0 || iL < 0) { iC = 0; iL = 1; iS = 2; debut = /^code$/i.test(String((rows[0] || [])[0] || '').trim()) ? 1 : 0; }
      var n = 0, rej = 0;
      rows.slice(debut).forEach(function (r) {
        var c = String(r[iC] || '').trim().toUpperCase(), lb = String(r[iL] || '').trim(), st = sans(r[iS]);
        if (!c && !lb) return;
        if (!c || !lb || data.some(function (x) { return x.code === c; })) { rej++; return; }
        data.push({ code: c, lib: lb, actif: st !== 'inactif', usage: 0 }); n++;
      });
      liste(); etat(); toast(n + ' ligne(s) importée(s)' + (rej ? ', ' + rej + ' rejetée(s) (code vide, libellé vide ou code existant)' : '') + '.');
    }).catch(function (x) { toast('Importation impossible : ' + (x && x.message ? x.message : 'fichier illisible') + '.'); });
  }
  q('[data-__K__-fichier]').addEventListener('change', function (e) {
    var f = e.target.files[0]; if (!f) return; var fr = new FileReader(), n = 0;
    fr.onload = function () {
      String(fr.result).replace(/^﻿/, '').split(/\r?\n/).forEach(function (l, i) {
        var p = l.split(/[;,\t]/), c = (p[0] || '').trim().toUpperCase(), lb = (p.slice(1).join(' ') || '').replace(/"/g, '').trim();
        if (i === 0 && /^code$/i.test(c)) return;
        if (c && lb && !data.some(function (x) { return x.code === c; })) { data.push({ code: c, lib: lb, actif: true, usage: 0 }); n++; }
      });
      e.target.value = ''; liste(); etat(); toast(n + ' ligne(s) importée(s).');
    };
    fr.readAsText(f);
  });
  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b || b.disabled) return;
    if (b.hasAttribute('data-__K__-ajouter')) { onglet('saisie'); mode = 'creation'; sel = -1; liste(); form(null); etat(); q('[data-f=code]').focus(); return; }
    if (b.hasAttribute('data-__K__-modifier')) { onglet('saisie'); mode = 'edition'; etat(); q('[data-f=lib]').focus(); return; }
    if (b.hasAttribute('data-__K__-annuler')) { mode = 'consultation'; liste(); form(sel >= 0 ? data[sel] : null); etat(); return; }
    if (b.hasAttribute('data-__K__-enregistrer')) { enregistrer(); return; }
    if (b.hasAttribute('data-__K__-supprimer')) {
      var s = data[sel]; if (!s) return;
      if (!window.confirm('Supprimer le ' + LC + ' « ' + s.lib + ' » (' + s.code + ') ? Cette action est définitive.')) return;
      data.splice(sel, 1); sel = -1; liste(); form(null); etat(); toast('__SUPP__'); return;
    }
    if (b.hasAttribute('data-__K__-importer')) {
      window.IMPORT_ASSISTANT.ouvrir({
        titre: NOM, fichier: 'modele_' + FICHIER + '.xlsx',
        champs: [
          { col: 'Code', oblig: true, format: 'Unique, 50 caractères au plus. Enregistré en majuscules.', exemple: 'CODE01' },
          { col: 'Libellé', oblig: true, format: 'Texte, 150 caractères au plus.', exemple: 'Libellé exemple' },
          { col: 'Statut', oblig: false, format: 'Actif ou Inactif. Par défaut : Actif.', exemple: 'Actif' }
        ],
        exemples: [['CODE01', 'Libellé exemple', 'Actif']],
        onFichier: importerFichier
      });
      return;
    }
    if (b.hasAttribute('data-__K__-imprimer')) { imprimer(); return; }
    if (b.hasAttribute('data-__K__-pdf')) { exporter('pdf'); return; }
    if (b.hasAttribute('data-__K__-xlsx')) { exporter('xlsx'); return; }
  });
  liste(); form(null); etat(); onglet('liste');
})();
</script>
