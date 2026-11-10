// Patch de PUBLICATION (le fichier publié par le binôme n'est pas reconstructible depuis les sources) :
// Gestion des contrats › Type de passation / Type de contrat : double-clic sur une ligne = fenêtre « Contrats rattachés » (au lieu d'ouvrir la ligne en saisie),
// colonne « Utilisation » rafraîchie à chaque ajout / modification / suppression de contrat (événement contrats-changed). Ajoute ecrans/types_rattaches.js avant le dernier </body>.
// Usage : node patches/types_utilisation_double_clic.cjs index.html index_patche.html
const fs = require('fs'), path = require('path');
const [src, dst] = process.argv.slice(2); let s = fs.readFileSync(src, 'utf8');
const ancre = "tb.addEventListener('dblclick', function (e) { var tr = e.target.closest('tr[data-i]'); if (tr) { choisir(+tr.dataset.i); onglet('saisie'); } });";
function patcher(marque, champ, libelle, hash) {
  const i = s.indexOf(marque); if (i < 0) throw new Error('repère introuvable : ' + marque);
  const j = s.indexOf(ancre, i); if (j < 0) throw new Error('gestionnaire de double-clic introuvable après ' + marque);
  const nv = "tb.addEventListener('dblclick', function (e) {\n" +
    "    var tr = e.target.closest('tr[data-i]'); if (!tr) return; var t = data[+tr.dataset.i];\n" +
    "    if (!window.TYPES_RATTACHES) { choisir(+tr.dataset.i); onglet('saisie'); return; }\n" +
    "    if (mode === 'consultation') choisir(+tr.dataset.i);\n" +
    "    window.TYPES_RATTACHES.ouvrir({ titre: 'Contrats rattachés — ' + t.code, sous: '" + libelle + " : ' + t.lib, contrats: (window.CONTRATS || []).filter(function (c) { return c." + champ + " === t.code || c." + champ + " === t.lib; }) });\n" +
    "  });\n" +
    "  window.addEventListener('contrats-changed', function () { liste(); });   // « Utilisation » suit les ajouts, modifications et suppressions de contrats\n" +
    "  window.addEventListener('hashchange', function () { if (location.hash === '" + hash + "') liste(); });";
  s = s.slice(0, j) + nv + s.slice(j + ancre.length);
}
patcher('function usageDe(s) { var C = window.CONTRATS || []; return C.filter(function (c) { return c.typePassation', 'typePassation', 'Type de passation', '#passation');
patcher('function usageDe(s) { var C = window.CONTRATS || []; return C.filter(function (c) { return c.typeMarche', 'typeMarche', 'Type de contrat', '#typemarche');
const mod = fs.readFileSync(path.join(__dirname, '..', 'ecrans', 'types_rattaches.js'), 'utf8');
const k = s.lastIndexOf('</body>'); if (k < 0) throw new Error('</body> introuvable');
s = s.slice(0, k) + '<script>\n' + mod + '\n</script>' + s.slice(k);
fs.writeFileSync(dst, s); console.log('patch appliqué :', dst);
