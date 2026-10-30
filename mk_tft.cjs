// Données de démonstration du TFT (modèle fourni en capture) -> ecrans/tft_donnees.json
// n : niveau d'indentation, k : t = en-tête en gras, l = ligne, s = total (A)(B)(C)
const R = [
  ['Flux de trésorerie liés à l\'activité', 0, 't'],
  ['Résultat net de l\'exercice', 1, 'l', '', '85 400 000,00', '64 200 000,00'],
  ['Ajustements pour :', 1, 'l'],
  ['- Amortissements et provisions', 2, 'l', '', '12 600 000,00', '11 100 000,00'],
  ['- Variation des impôts différés', 2, 'l', '', '-1 200 000,00', '800 000,00'],
  ['- Variation des stocks', 2, 'l', '', '-4 500 000,00', '-3 200 000,00'],
  ['- Variation des clients et autres créances', 2, 'l', '', '-9 800 000,00', '-6 400 000,00'],
  ['- Variation des fournisseurs et autres dettes', 2, 'l', '', '7 300 000,00', '5 100 000,00'],
  ['- Plus ou moins values de cession, nettes d\'impôts', 2, 'l', '', '-2 100 000,00', '-1 500 000,00'],
  ['Flux de trésorerie générés par l\'activité (A)', 0, 's', '', '87 700 000,00', '70 100 000,00'],
  ['Flux de trésorerie liés aux opérations d\'investissement', 0, 't'],
  ['Décaissements sur acquisitions d\'immobilisations', 2, 'l', '3', '-52 000 000,00', '-38 000 000,00'],
  ['Encaissements sur cessions d\'immobilisations', 2, 'l', '3', '6 500 000,00', '4 000 000,00'],
  ['Flux de trésorerie liés aux opérations d\'investissement (B)', 0, 's', '', '-45 500 000,00', '-34 000 000,00'],
  ['Flux de trésorerie liés aux activités de financement', 0, 't'],
  ['Dividendes versés aux actionnaires', 2, 'l', '', '-10 000 000,00', '-8 000 000,00'],
  ['Augmentation de capital en numéraire', 2, 'l', '5', '30 000 000,00', '0,00'],
  ['Emission d\'emprunt', 2, 'l', '6', '20 000 000,00', '25 000 000,00'],
  ['Subventions d\'investissement', 2, 'l', '', '8 000 000,00', '5 000 000,00'],
  ['Dépôt et cautionnement reçu', 2, 'l', '', '1 500 000,00', '900 000,00'],
  ['Flux de trésorerie liés aux opérations de financement (C)', 0, 's', '', '49 500 000,00', '22 900 000,00'],
  ['Variation de trésorerie de la période (A+B+C)', 0, 's', '', '91 700 000,00', '59 000 000,00'],
  ['Trésorerie d\'ouverture', 2, 'l', '', '128 400 000,00', '69 400 000,00'],
  ['Trésorerie de clôture', 2, 'l', '', '220 100 000,00', '128 400 000,00'],
  ['Incidence des variations de cours des devises', 2, 'l', '', '0,00', '0,00'],
  ['Variation de trésorerie', 0, 's', '', '91 700 000,00', '59 000 000,00'],
  ['ECART', 0, 's', '', '0,00', '0,00']
].map(([l, n, k, note, a, b]) => ({ l, n, k, note: note || '', a: a || '', b: b || '' }));
require('fs').writeFileSync('ecrans/tft_donnees.json', JSON.stringify(R), 'utf8');
console.log(R.length);
