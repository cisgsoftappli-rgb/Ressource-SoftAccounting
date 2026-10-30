// Prépare un dossier « sources » propre (sans sauvegardes .avant-*, .bak, builds générés, documents clients) puis l'archive en zip.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const out = path.join(__dirname, 'sources_softaccounting');
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out);
const exclu = /\.(avant-[^.]+|bak|bak\.html)$|\.avant-|\.bak\./;
function copie(src, dst) {
  const st = fs.statSync(src);
  if (st.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); fs.readdirSync(src).forEach((n) => { if (!exclu.test(n)) copie(path.join(src, n), path.join(dst, n)); }); }
  else fs.copyFileSync(src, dst);
}
['build.cjs', 'gen_prelettrage.cjs', 'anon_pub.cjs', 'anon_bx.cjs', 'scan_pub.cjs', 'serve.cjs', 'PASSATION.md', 'SoftCompta_HTML_assemble.html', 'css', 'ecrans'].forEach((n) => { if (fs.existsSync(n)) copie(n, path.join(out, n)); });
fs.writeFileSync(path.join(out, 'LISEZMOI.txt'), [
  'Sources SoftAccounting (maquette) — dossier de travail à placer dans C:\\Artefact (ou tout dossier).',
  '',
  'Construire : node build.cjs   → SoftCompta_Administration_entite.html',
  'Tester     : node serve.cjs   → http://localhost:4322/SoftCompta_Administration_entite.html',
  'Publier (anonymisé, une seule personne, depuis la version fusionnée) :',
  '  node anon_pub.cjs ; PUBLICATION=1 node build.cjs ; node scan_pub.cjs',
  '  puis copier SoftCompta_Administration_entite_publication.html vers deploy/index.html (dépôt de publication) et pousser.',
  '',
  'Ajouter un écran : créer ecrans/<nom>.html ; dans build.cjs ajouter le div data-screen, le fil d\'Ariane, l\'entrée de menu (child), TITLES / GROUP / MODULE ;',
  'dans ecrans/barre_actions.js une entrée CFG ; dans ecrans/assistant_aide.js la description et le guide. Voir PASSATION.md.',
  'Attention : ne jamais écrire la chaîne littérale </style></head><body> dans un écran (build.cjs y injecte le masque) ; la couper en morceaux.',
  'Ne pas écraser deploy/index.html à la main : c\'est un fichier construit.',
].join('\n'));
const zip = path.join(__dirname, 'sources_softaccounting.zip');
fs.rmSync(zip, { force: true });
cp.execSync('powershell -NoProfile -Command "Compress-Archive -Path \'' + out + '\\*\' -DestinationPath \'' + zip + '\' -Force"');
console.log((fs.statSync(zip).size / 1048576).toFixed(1) + ' Mo', zip);
