// Données de démonstration des plans -> ecrans/plans_donnees.json
// lignes : [code, libellé, code parent, valeur du champ complémentaire, actif (0 = inactif)]
const P = [];
function plan(id, titre, extra, lignes) { P.push({ id: id, titre: titre, extra: extra, lignes: lignes }); }

plan('pl_comptable', 'Plan comptable', { label: 'Sens habituel', options: ['Débit', 'Crédit', 'Débit ou crédit'] }, [
  ['1', 'Comptes de ressources durables', '', 'Crédit'], ['10', 'Capital', '1', 'Crédit'], ['101', 'Capital social', '10', 'Crédit'], ['131', 'Résultat net : bénéfice', '1', 'Crédit'],
  ['2', "Comptes d'actif immobilisé", '', 'Débit'], ['21', 'Immobilisations incorporelles', '2', 'Débit'], ['211', 'Frais de développement et de prototypes', '21', 'Débit'], ['212', 'Brevets, licences, logiciels', '21', 'Débit'],
  ['4', 'Comptes de tiers', '', 'Débit ou crédit'], ['40', 'Fournisseurs et comptes rattachés', '4', 'Crédit'], ['401100', 'Fournisseurs – dettes en compte', '40', 'Crédit'], ['470000', "Comptes d'attente", '4', 'Débit ou crédit'],
  ['5', 'Comptes de trésorerie', '', 'Débit'], ['512210', 'Banque – compte en Ariary', '5', 'Débit'], ['530000', 'Caisse', '5', 'Débit'],
  ['6', 'Comptes de charges', '', 'Débit'], ['60', 'Achats et variations de stocks', '6', 'Débit'], ['606300', 'Petit matériel et fournitures', '60', 'Débit'], ['624400', 'Frais de transport et de taxi', '6', 'Débit'], ['7', 'Comptes de produits', '', 'Crédit']
]);
plan('pl_activite', 'Plan Activité', null, [
  ['3', 'Composante 3 — Gouvernance', ''], ['3A01000', 'Pilotage et coordination', '3'], ['4', 'Composante 4 — Appui à la production', ''],
  ['4A09009', 'Déplacements et missions de terrain', '4'], ['4A09011', 'Entretien des locaux', '4'], ['4A09014', 'Véhicules : entretien et équipement', '4'], ['4A09023', 'Informatique et bureautique', '4'],
  ['4C59018', 'Équipements de pêche et de communication', '4'], ['5', 'Composante 5 — Suivi-évaluation', ''], ['5A01001', 'Collecte des données', '5', '', 0]
]);
plan('pl_budget', 'Plan Budget', null, [
  ['23', 'Dépenses de fonctionnement', ''], ['23173', 'Fonctionnement courant', '23'], ['23174', 'Déplacements et missions', '23'], ['24', "Dépenses d'investissement", ''],
  ['24100', 'Équipements et matériels', '24'], ['24200', 'Travaux', '24'], ['25', 'Dépenses de personnel', ''], ['25100', 'Salaires et indemnités', '25']
]);
plan('pl_geo', 'Plan Géographique', { label: 'Type', options: ['Région', 'District', 'Commune'] }, [
  ['01', 'ANALAMANGA', '', 'Région'], ['01-01', 'Antananarivo Renivohitra', '01', 'District'], ['U1000', 'Commune urbaine d\'Antananarivo', '01-01', 'Commune'],
  ['02', 'ITASY', '', 'Région'], ['02-01', 'Miarinarivo', '02', 'District'], ['03', 'ANOSY', '', 'Région'], ['03-01', 'Taolagnaro', '03', 'District'],
  ['04', 'ATSIMO ANDREFANA', '', 'Région'], ['04-01', 'Toliara I', '04', 'District'], ['05', 'ANDROY', '', 'Région'], ['05-01', 'Ambovombe Androy', '05', 'District']
]);
plan('pl_financier', 'Plan Financier', { label: 'Bailleur', options: ['IDA', 'FIDA', 'FED', 'FM', 'BAD', 'ASAP', 'Gouvernement malagasy', 'Bénéficiaires'] }, [
  ['01', 'Prêt FIDA', '', 'FIDA'], ['01 - 1', 'Travaux', '01', 'FIDA'], ['01 - 2', 'Équipements et matériels', '01', 'FIDA'], ['01 - 3', 'Formation et accompagnement', '01', 'FIDA'], ['01 - 4', 'Prestations de services', '01', 'FIDA'], ['01 - 5', 'Subventions', '01', 'FIDA'], ['01 - 6', 'Coûts opérationnels', '01', 'FIDA'],
  ['02', 'Fonds fiduciaires ASAP', '', 'ASAP'], ['02 - 1', 'ASAP — catégorie 1', '02', 'ASAP'], ['03', 'Gouvernement malagasy', '', 'Gouvernement malagasy'], ['03 - 1', 'Contrepartie de l\'État', '03', 'Gouvernement malagasy'],
  ['04', 'Apport bénéficiaires', '', 'Bénéficiaires'],
  ['05', 'Crédit IDA', '', 'IDA'], ['05 - 1', 'IDA — catégorie 1 (travaux)', '05', 'IDA'], ['05 - 2', 'IDA — catégorie 2 (biens et services)', '05', 'IDA']
]);
for (let n = 5; n <= 10; n++) {
  plan('pl_' + n, 'Plan ' + n, null, [
    ['P' + n + '-1', 'Plan ' + n + ' — rubrique 1', ''], ['P' + n + '-1A', 'Plan ' + n + ' — rubrique 1, sous-rubrique A', 'P' + n + '-1'], ['P' + n + '-1B', 'Plan ' + n + ' — rubrique 1, sous-rubrique B', 'P' + n + '-1'],
    ['P' + n + '-2', 'Plan ' + n + ' — rubrique 2', '']
  ]);
}
plan('pl_tiers', 'Plan Tiers', { label: 'Type de tiers', options: ['Client', 'Fournisseur', 'Personnel', 'Autre'] }, [
  ['F', 'Fournisseurs', '', 'Fournisseur'], ['CHB01', 'CHABANI — location de véhicules', 'F', 'Fournisseur'], ['ULT01', 'ULTIMA INSERTION — matériel de pêche', 'F', 'Fournisseur'],
  ['C', 'Clients', '', 'Client'], ['CL001', 'Client de démonstration', 'C', 'Client'], ['A', 'Autres tiers', '', 'Autre'], ['AF1', 'Avances sur frais (taxi chauffeur)', 'A', 'Autre'], ['ROGC', 'Frais de regroupement du personnel', 'A', 'Personnel']
]);
plan('pl_journaux', 'Plan Journaux', { label: 'Type de journal', options: ['Achats', 'Ventes', 'Banque', 'Caisse', 'Opérations diverses', 'Paie'] }, [
  ['ACH', 'Journal Achats de Biens & Prestations de Services', '', 'Achats'], ['FAACH', "Factures d'achat", '', 'Achats'], ['FA2ACH', "Factures d'achat (2)", '', 'Achats'],
  ['BCDA', 'Banque — dépenses en Ariary', '', 'Banque'], ['FABNM', 'Règlements fournisseurs', '', 'Banque'], ['FA2BNIM', 'Règlements fournisseurs (2)', '', 'Banque'],
  ['CADI', 'Caisse — dépenses', '', 'Caisse'], ['JMISS', 'Journal des missions', '', 'Opérations diverses'], ['AAJMISS', 'JOURNAL MISSION ATSIMO ANDREFANA', '', 'Opérations diverses'],
  ['OD', 'Opérations diverses', '', 'Opérations diverses'], ['PA', 'Paie', '', 'Paie']
]);
require('fs').writeFileSync('ecrans/plans_donnees.json', JSON.stringify(P), 'utf8');
console.log(P.length + ' plans');
