// Données de l'exemple « Compte de résultat du projet AD2M-II » (transcrites de la capture fournie) -> ecrans/cr_donnees.json
// k : t = en-tête de groupe, l = ligne de détail, s = total de groupe (*** TOTAL ***), g = total général
const R = [
  ['Achats consommés', 't'],
  ['Autres approvisionnements', 'l', '319 284 748,88', '83 146 534,46'],
  ['Carburants et lubrifiants', 'l', '68 178 412,30', '101 892 392,51'],
  ['Autres fournitures', 'l', '60 246 114,00', '77 320 654,22'],
  ['*** TOTAL  Achats consommés ***', 's', '447 709 275,18', '262 359 581,19'],
  ['Services extérieurs', 't'],
  ['Locations', 'l', '', '1 951 143 145,50'],
  ['Entretiens  réparations et maintenances', 'l', '44 991 240,00', '459 437 223,40'],
  ['Assurances', 'l', '210 772 172,55', '297 139 780,96'],
  ['Documentations et divers', 'l', '707 380,00', '265 100,00'],
  ['*** TOTAL  Services extérieurs ***', 's', '256 470 792,55', '2 707 985 249,86'],
  ['Autres services extérieurs', 't'],
  ["Personnel extérieur à l'entreprise", 'l', '', '260 025,23'],
  ['Honoraires', 'l'],
  ['Insertion publicitaire', 'l', '10 581 637,37', '70 106 879,05'],
  ['Frais de transports', 'l'],
  ['Missions et réceptions', 'l', '11 378 144,00', '83 398 498,00'],
  ['Frais postaux et télécommunication', 'l', '33 749 599,21', '119 046 662,75'],
  ['Commissions et frais bancaires', 'l', '43 095 457,62', '55 217 081,61'],
  ['Autres services extérieurs', 'l', '158 000,00', ''],
  ['*** TOTAL  Autres services extérieurs ***', 's', '98 962 838,40', '328 029 346,64'],
  ['Impôts,taxes et versements assimilés', 't'],
  ['Charges de personnel', 't'],
  ['Rémunération du personnel', 'l', '826 452 294,16', '1 508 726 417,71'],
  ['Cotisations aux organismes sociaux', 'l', '3 868 198,18', ''],
  ['*** TOTAL  Charges de personnel ***', 's', '830 318 492,34', '1 508 726 417,71'],
  ['Autres charges des activités ordinaires', 't'],
  ['Charges des gestions courantes', 't'],
  ['*** TOTAL  Autres charges des activités ordinaires ***', 's'],
  ['Charges financières', 'l', '0,01', '728 347,94'],
  ['TOTAL GÉNÉRAL CHARGES', 'g', '1 633 461 398,48', '4 807 828 943,34'],
  ['TOTAL GÉNÉRAL PRODUITS', 'g'],
  ['EXCÉDENT / DÉFICIT', 'g', '-1 633 461 398,48', '-4 807 828 943,34']
].map(([l, k, n, n1]) => ({ l, k, n: n || '', n1: n1 || '' }));
require('fs').writeFileSync('ecrans/cr_donnees.json', JSON.stringify(R), 'utf8');
console.log(R.length);
