// Génère ecrans/type_passation.html et ecrans/type_marche.html (onglets Saisie / Liste, barre d'actions globale) depuis types_modele.tpl
const fs = require('fs');
const tpl = fs.readFileSync('types_modele.tpl', 'utf8');
const D = [
  {
    out: 'ecrans/type_passation.html', K: 'typa', NOM: 'Type de passation', LCNOM: 'type de passation', PL: 'Types de passation', LCPL: 'types de passation', FILE: 'types_passation',
    PHC: 'Ex : AOI', PHL: "Ex : Appel d'offre international", GLOBAL: 'typesPassation', M: 'masc',
    DATA: [['AOI', "Appel d'offre International"], ['AON', "Appel d'Offre National"], ['CR', 'Consultation Restreinte'], ['DC', 'Demande de Prix'], ['DP', 'Demande de Proposition'], ['ED', 'Entente Directe'], ['SCBD', 'Sélection sur le Coût et le Budget Déterminé'], ['SCI', 'Sélection des Consultants Individuels'], ['SFQ', 'Sélection Fondée sur le Qualité'], ['SFQC', 'Selection Fondée sur la Qualité et Coût'], ['SMC', 'Séléction sur le Moindre Coût'], ['SQC', 'Selection sur la Qualification des Consultants']]
  },
  {
    out: 'ecrans/type_marche.html', K: 'typm', NOM: 'Type de marché', LCNOM: 'type de marché', PL: 'Types de marché', LCPL: 'types de marché', FILE: 'types_marche',
    PHC: 'Ex : FS', PHL: 'Ex : Fournitures et services', GLOBAL: 'typesMarche',
    DATA: [['FS', 'FOURNITURES ET SERVICES'], ['PI', 'PRESTATIONS INTELLECTUELLES'], ['TR', 'TRAVAUX']]
  }
];
D.forEach((d) => {
  const maj = d.LCNOM.charAt(0).toUpperCase() + d.LCNOM.slice(1);
  const rep = { __K__: d.K, __KC__: d.K, __NOM__: d.NOM, __LCNOM__: d.LCNOM, __PL__: d.PL, __LCPL__: d.LCPL, __FILE__: d.FILE, __PHC__: d.PHC, __PHL__: d.PHL, __PHC_SANS__: d.PHC.replace(/^Ex : /, '').replace(/'/g, "\\'"), __PHL_SANS__: d.PHL.replace(/^Ex : /, '').replace(/'/g, "\\'"), __GLOBAL__: d.GLOBAL, __DATA__: JSON.stringify(d.DATA),
    __MODIF__: maj + ' modifié.', __CREE__: maj + ' enregistré.', __SUPP__: maj + ' supprimé.' };
  let t = tpl;
  Object.keys(rep).sort((a, b) => b.length - a.length).forEach((k) => { t = t.split(k).join(rep[k]); });
  if (/__[A-Z]+__/.test(t)) throw new Error('jeton non remplacé dans ' + d.out);
  fs.copyFileSync(d.out, d.out + '.avant-modele');
  fs.writeFileSync(d.out, t);
  console.log(d.out, t.length);
});
