const fs = require('fs');
global.window = {}; eval(fs.readFileSync('ecrans/balance_auxiliaire_donnees.js', 'utf8'));
const T = window.BX_TIERS, C = window.BX_COLLECTIFS;
const out = T.map((t, i) => { const n = String(i + 1).padStart(5, '0'); return { code: 'T' + n, libelle: t.libelle === 'DIRECTION DES GRANDES ENTREPRISES' ? t.libelle : 'TIERS ' + n, mvD: t.mvD, mvC: t.mvC }; });
fs.writeFileSync('import_plans/publication/balance_auxiliaire_donnees.js',
  '// Version de publication (tiers anonymisés) — généré par anon_bx.cjs à partir de ecrans/balance_auxiliaire_donnees.js\nwindow.BX_TIERS = ' + JSON.stringify(out) + ';\nwindow.BX_COLLECTIFS = ' + JSON.stringify(C) + ';\n', 'utf8');
console.log(out.length, 'tiers anonymisés');
